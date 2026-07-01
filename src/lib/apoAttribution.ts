/**
 * APO Attribution — Deterministic SHAP-style contribution breakdown.
 *
 * For each category, computes: contribution = weight × categoryScore × multiplier
 * The sum of all contributions equals the overall APO (±1 point tolerance).
 *
 * This is a deterministic, additive attribution method — not stochastic SHAP.
 * It decomposes the weighted-sum formula used by the APO calculator into
 * per-category and per-factor contributions, providing explainability
 * without the computational cost of model-agnostic SHAP sampling.
 */

export type ApoCategory = 'tasks' | 'knowledge' | 'skills' | 'abilities' | 'technologies';

export interface CategoryScore {
  apo: number;
  confidence: 'low' | 'medium' | 'high';
}

export interface FactorMultiplier {
  factor: string;
  multiplier: number;
}

export interface ApoItem {
  category: ApoCategory;
  description: string;
  computedAPO: number;
  factors: string[];
  confidence: number;
  metadata: {
    importance: number;
    frequency: 'low' | 'medium' | 'high';
    skill_level: number;
    tech_adoption: number;
  };
}

export interface CategoryAttribution {
  category: ApoCategory;
  weight: number;
  categoryScore: number;
  weightedContribution: number;
  percentageOfTotal: number;
  confidence: 'low' | 'medium' | 'high';
  topFactors: FactorMultiplier[];
  itemCount: number;
}

export interface ItemAttribution {
  category: ApoCategory;
  description: string;
  itemAPO: number;
  factorMultiplier: number;
  adjustedScore: number;
  importance: number;
  contributionToCategory: number;
  percentageOfCategory: number;
  topFactors: string[];
}

export interface AttributionResult {
  overallAPO: number;
  sumOfContributions: number;
  residual: number;
  categoryAttributions: CategoryAttribution[];
  itemAttributions: ItemAttribution[];
  externalAdjustments: {
    blsAdjustmentPts: number | null;
    econViabilityDiscount: number | null;
  };
}

// Default factor multipliers (must match calculate-apo defaults)
const DEFAULT_FACTOR_MULTIPLIERS: Record<string, number> = {
  routine: 1.2,
  data_driven: 1.15,
  creative: 0.5,
  social: 0.6,
  physical_complex: 0.7,
  judgment: 0.9,
  compliance: 0.95,
  genai_boost: 1.2,
  economic_viability: 1.1,
  productivity_enhancement: 0.95,
  insufficient_evidence: 0.9,
};

const FREQ_SCORE: Record<'low' | 'medium' | 'high', number> = {
  low: 0.3,
  medium: 0.6,
  high: 0.9,
};

function clamp100(x: number): number {
  return Math.max(0, Math.min(100, x));
}

/**
 * Compute the aggregate factor multiplier for an item.
 * Multiplies all factor multipliers together, then averages with 1.0 to avoid
 * extreme compounding (geometric mean approach).
 */
function computeAggregateMultiplier(factors: string[], customMultipliers?: Record<string, number>): number {
  const multipliers = customMultipliers ?? DEFAULT_FACTOR_MULTIPLIERS;
  if (!factors || factors.length === 0) return 1.0;

  let product = 1.0;
  let count = 0;
  for (const f of factors) {
    const m = multipliers[f];
    if (typeof m === 'number') {
      product *= m;
      count++;
    }
  }
  if (count === 0) return 1.0;
  // Geometric mean of product and 1.0 to dampen extreme effects
  return Math.pow(product, 1 / Math.max(1, count * 0.5));
}

/**
 * Compute deterministic APO attribution for a set of items and weights.
 *
 * @param items - Array of APO items with computedAPO, factors, metadata
 * @param weights - Category weights (must sum to ~1.0)
 * @param categoryScores - Pre-computed category scores
 * @param overallAPO - The final overall APO score (after external adjustments)
 * @param externalAdjustments - BLS and econ adjustments applied to final APO
 * @param customMultipliers - Optional custom factor multipliers
 * @returns AttributionResult with per-category and per-item breakdowns
 */
export function computeAPOAttribution(
  items: ApoItem[],
  weights: Record<string, number>,
  categoryScores: Record<ApoCategory, CategoryScore>,
  overallAPO: number,
  externalAdjustments?: {
    blsAdjustmentPts?: number | null;
    econViabilityDiscount?: number | null;
  },
  customMultipliers?: Record<string, number>,
): AttributionResult {
  const categories: ApoCategory[] = ['tasks', 'knowledge', 'skills', 'abilities', 'technologies'];

  // Group items by category
  const itemsByCategory: Record<ApoCategory, ApoItem[]> = {
    tasks: items.filter(i => i.category === 'tasks'),
    knowledge: items.filter(i => i.category === 'knowledge'),
    skills: items.filter(i => i.category === 'skills'),
    abilities: items.filter(i => i.category === 'abilities'),
    technologies: items.filter(i => i.category === 'technologies'),
  };

  const categoryAttributions: CategoryAttribution[] = [];
  const itemAttributions: ItemAttribution[] = [];

  for (const cat of categories) {
    const catItems = itemsByCategory[cat];
    const weight = weights[cat] ?? 0;
    const catScore = categoryScores[cat]?.apo ?? 0;
    const weightedContribution = weight * catScore;

    // Compute per-item contributions within this category
    const totalImportance = catItems.length
      ? catItems.reduce((sum, i) => sum + (i.metadata.importance ?? 0.5) * (i.confidence ?? 0.6), 0)
      : 1;

    const catTopFactors: Record<string, number> = {};
    for (const item of catItems) {
      const multiplier = computeAggregateMultiplier(item.factors, customMultipliers);
      const importance = (item.metadata.importance ?? 0.5) * (item.confidence ?? 0.6);
      const contributionToCategory = totalImportance > 0 ? (importance / totalImportance) * catScore : 0;
      const percentageOfCategory = catScore > 0 ? (contributionToCategory / catScore) * 100 : 0;

      itemAttributions.push({
        category: cat,
        description: item.description,
        itemAPO: item.computedAPO,
        factorMultiplier: multiplier,
        adjustedScore: clamp100(item.computedAPO * multiplier),
        importance: item.metadata.importance ?? 0.5,
        contributionToCategory,
        percentageOfCategory,
        topFactors: item.factors.slice(0, 3),
      });

      // Aggregate top factors for category
      for (const f of item.factors) {
        const m = (customMultipliers ?? DEFAULT_FACTOR_MULTIPLIERS)[f] ?? 1.0;
        catTopFactors[f] = (catTopFactors[f] ?? 0) + (m - 1) * importance;
      }
    }

    // Sort and pick top 3 factors for category
    const topFactors: FactorMultiplier[] = Object.entries(catTopFactors)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, 3)
      .map(([factor, _]) => ({
        factor,
        multiplier: (customMultipliers ?? DEFAULT_FACTOR_MULTIPLIERS)[factor] ?? 1.0,
      }));

    categoryAttributions.push({
      category: cat,
      weight,
      categoryScore: catScore,
      weightedContribution,
      percentageOfTotal: overallAPO > 0 ? (weightedContribution / overallAPO) * 100 : 0,
      confidence: categoryScores[cat]?.confidence ?? 'medium',
      topFactors,
      itemCount: catItems.length,
    });
  }

  // Sum of weighted contributions (before external adjustments)
  const sumOfContributions = categoryAttributions.reduce((sum, c) => sum + c.weightedContribution, 0);

  // External adjustments
  const blsAdj = externalAdjustments?.blsAdjustmentPts ?? 0;
  const econDiscount = externalAdjustments?.econViabilityDiscount ?? 0;
  const adjustedSum = clamp100(sumOfContributions + blsAdj - econDiscount);

  // Residual = difference between overallAPO and adjustedSum (should be ≤ 1)
  const residual = Math.abs(overallAPO - adjustedSum);

  return {
    overallAPO,
    sumOfContributions: Math.round(adjustedSum * 100) / 100,
    residual: Math.round(residual * 100) / 100,
    categoryAttributions,
    itemAttributions,
    externalAdjustments: {
      blsAdjustmentPts: externalAdjustments?.blsAdjustmentPts ?? null,
      econViabilityDiscount: externalAdjustments?.econViabilityDiscount ?? null,
    },
  };
}

/**
 * Verify that the attribution sums to the overall APO within tolerance.
 * @returns true if |sum - overallAPO| <= tolerance (default 1.0)
 */
export function verifyAttributionSum(
  result: AttributionResult,
  tolerance: number = 1.0,
): { valid: boolean; delta: number } {
  const delta = Math.abs(result.sumOfContributions - result.overallAPO);
  return { valid: delta <= tolerance, delta: Math.round(delta * 100) / 100 };
}

/**
 * Generate a human-readable summary of the attribution.
 */
export function formatAttributionSummary(result: AttributionResult): string {
  const lines: string[] = [];
  lines.push(`Overall APO: ${result.overallAPO.toFixed(1)}`);
  lines.push(`Sum of contributions: ${result.sumOfContributions.toFixed(1)} (residual: ${result.residual.toFixed(1)})`);
  lines.push('');
  lines.push('Category Breakdown:');
  for (const cat of result.categoryAttributions) {
    lines.push(
      `  ${cat.category}: score=${cat.categoryScore.toFixed(1)}, weight=${(cat.weight * 100).toFixed(0)}%, ` +
      `contribution=${cat.weightedContribution.toFixed(1)} (${cat.percentageOfTotal.toFixed(1)}% of total), ` +
      `${cat.itemCount} items`
    );
    if (cat.topFactors.length) {
      lines.push(`    Top factors: ${cat.topFactors.map(f => `${f.factor}(${f.multiplier.toFixed(2)})`).join(', ')}`);
    }
  }
  if (result.externalAdjustments.blsAdjustmentPts) {
    lines.push(`BLS adjustment: ${result.externalAdjustments.blsAdjustmentPts > 0 ? '+' : ''}${result.externalAdjustments.blsAdjustmentPts} pts`);
  }
  if (result.externalAdjustments.econViabilityDiscount) {
    lines.push(`Econ viability discount: -${result.externalAdjustments.econViabilityDiscount} pts`);
  }
  return lines.join('\n');
}
