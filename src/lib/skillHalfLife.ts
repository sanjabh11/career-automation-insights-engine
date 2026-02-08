/**
 * Skill Half-Life Calculation Model
 * Career Automation Insights Engine
 * 
 * Models skill decay over time based on:
 * - Technology evolution rate
 * - Industry adoption patterns
 * - Skill category (technical vs. soft)
 * - Market demand trends
 * 
 * Half-life = time for skill relevance to decrease by 50%
 */

// ============================================================================
// SKILL CATEGORY DEFINITIONS
// ============================================================================

export type SkillCategory = 
  | 'programming_language'
  | 'framework'
  | 'tool'
  | 'platform'
  | 'methodology'
  | 'soft_skill'
  | 'domain_knowledge'
  | 'certification'
  | 'emerging_tech';

export interface SkillHalfLifeData {
  skillName: string;
  category: SkillCategory;
  baseHalfLifeMonths: number;  // Base half-life in months
  volatilityFactor: number;    // 0-1, higher = more volatile
  demandTrend: 'rising' | 'stable' | 'declining';
  lastUpdated: Date;
}

export interface SkillDecayResult {
  skillName: string;
  currentRelevance: number;     // 0-100%
  halfLifeMonths: number;
  decayRate: number;            // Monthly decay rate
  monthsUntil50Percent: number;
  monthsUntil25Percent: number;
  urgencyLevel: 'critical' | 'warning' | 'moderate' | 'stable';
  recommendation: string;
}

// ============================================================================
// HALF-LIFE DATA BY SKILL CATEGORY
// ============================================================================

// Based on industry research and technology evolution patterns
const CATEGORY_HALF_LIVES: Record<SkillCategory, { base: number; volatility: number }> = {
  // Technical skills with high turnover
  programming_language: { base: 36, volatility: 0.3 },  // 3 years base
  framework: { base: 24, volatility: 0.5 },             // 2 years base (high churn)
  tool: { base: 30, volatility: 0.4 },                  // 2.5 years
  platform: { base: 36, volatility: 0.35 },             // 3 years
  
  // Methodologies more stable
  methodology: { base: 48, volatility: 0.2 },           // 4 years
  
  // Soft skills most durable
  soft_skill: { base: 120, volatility: 0.1 },           // 10 years
  
  // Domain knowledge varies
  domain_knowledge: { base: 60, volatility: 0.25 },     // 5 years
  
  // Certifications decay faster
  certification: { base: 24, volatility: 0.4 },         // 2 years (needs renewal)
  
  // Emerging tech very volatile
  emerging_tech: { base: 18, volatility: 0.6 },         // 1.5 years
};

// ============================================================================
// SPECIFIC SKILL ADJUSTMENTS
// ============================================================================

// Override defaults for well-known skills
const SPECIFIC_SKILL_DATA: Record<string, Partial<SkillHalfLifeData>> = {
  // Programming Languages
  'python': { baseHalfLifeMonths: 48, demandTrend: 'rising' },
  'javascript': { baseHalfLifeMonths: 42, demandTrend: 'stable' },
  'typescript': { baseHalfLifeMonths: 36, demandTrend: 'rising' },
  'java': { baseHalfLifeMonths: 60, demandTrend: 'stable' },
  'c++': { baseHalfLifeMonths: 72, demandTrend: 'stable' },
  'rust': { baseHalfLifeMonths: 30, demandTrend: 'rising' },
  'go': { baseHalfLifeMonths: 36, demandTrend: 'rising' },
  'php': { baseHalfLifeMonths: 48, demandTrend: 'declining' },
  'ruby': { baseHalfLifeMonths: 36, demandTrend: 'declining' },
  'swift': { baseHalfLifeMonths: 36, demandTrend: 'stable' },
  'kotlin': { baseHalfLifeMonths: 30, demandTrend: 'rising' },
  
  // Frameworks (high churn)
  'react': { baseHalfLifeMonths: 24, demandTrend: 'stable' },
  'angular': { baseHalfLifeMonths: 24, demandTrend: 'stable' },
  'vue': { baseHalfLifeMonths: 24, demandTrend: 'rising' },
  'next.js': { baseHalfLifeMonths: 18, demandTrend: 'rising' },
  'django': { baseHalfLifeMonths: 36, demandTrend: 'stable' },
  'spring': { baseHalfLifeMonths: 42, demandTrend: 'stable' },
  'express': { baseHalfLifeMonths: 30, demandTrend: 'stable' },
  'jquery': { baseHalfLifeMonths: 48, demandTrend: 'declining' },
  
  // Cloud & DevOps
  'aws': { baseHalfLifeMonths: 30, demandTrend: 'stable' },
  'azure': { baseHalfLifeMonths: 30, demandTrend: 'rising' },
  'gcp': { baseHalfLifeMonths: 30, demandTrend: 'rising' },
  'docker': { baseHalfLifeMonths: 36, demandTrend: 'stable' },
  'kubernetes': { baseHalfLifeMonths: 30, demandTrend: 'stable' },
  'terraform': { baseHalfLifeMonths: 30, demandTrend: 'rising' },
  
  // AI/ML (emerging, volatile)
  'machine learning': { baseHalfLifeMonths: 24, demandTrend: 'rising' },
  'deep learning': { baseHalfLifeMonths: 18, demandTrend: 'rising' },
  'tensorflow': { baseHalfLifeMonths: 24, demandTrend: 'stable' },
  'pytorch': { baseHalfLifeMonths: 24, demandTrend: 'rising' },
  'llm': { baseHalfLifeMonths: 12, demandTrend: 'rising' },
  'prompt engineering': { baseHalfLifeMonths: 12, demandTrend: 'rising' },
  'langchain': { baseHalfLifeMonths: 12, demandTrend: 'rising' },
  
  // Data
  'sql': { baseHalfLifeMonths: 72, demandTrend: 'stable' },
  'nosql': { baseHalfLifeMonths: 48, demandTrend: 'stable' },
  'data analysis': { baseHalfLifeMonths: 48, demandTrend: 'rising' },
  'data visualization': { baseHalfLifeMonths: 48, demandTrend: 'stable' },
  'tableau': { baseHalfLifeMonths: 36, demandTrend: 'stable' },
  'power bi': { baseHalfLifeMonths: 30, demandTrend: 'rising' },
  
  // Soft Skills (very durable)
  'communication': { baseHalfLifeMonths: 120, demandTrend: 'stable' },
  'leadership': { baseHalfLifeMonths: 120, demandTrend: 'stable' },
  'problem solving': { baseHalfLifeMonths: 120, demandTrend: 'stable' },
  'critical thinking': { baseHalfLifeMonths: 120, demandTrend: 'rising' },
  'collaboration': { baseHalfLifeMonths: 120, demandTrend: 'stable' },
  'project management': { baseHalfLifeMonths: 60, demandTrend: 'stable' },
  'agile': { baseHalfLifeMonths: 48, demandTrend: 'stable' },
  'scrum': { baseHalfLifeMonths: 48, demandTrend: 'stable' },
};

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Get the category for a skill name
 */
export function inferSkillCategory(skillName: string): SkillCategory {
  const lower = skillName.toLowerCase();
  
  // Check for specific patterns
  if (/^(python|javascript|typescript|java|c\+\+|c#|ruby|go|rust|php|swift|kotlin|scala|r|matlab)$/i.test(lower)) {
    return 'programming_language';
  }
  
  if (/react|angular|vue|django|flask|spring|express|next\.?js|nuxt|svelte|rails|laravel/i.test(lower)) {
    return 'framework';
  }
  
  if (/aws|azure|gcp|docker|kubernetes|git|jenkins|terraform|ansible|jira|figma|sketch/i.test(lower)) {
    return 'tool';
  }
  
  if (/cloud|platform|salesforce|sap|oracle|microsoft 365/i.test(lower)) {
    return 'platform';
  }
  
  if (/agile|scrum|kanban|devops|ci\/cd|tdd|bdd|lean|six sigma/i.test(lower)) {
    return 'methodology';
  }
  
  if (/communication|leadership|teamwork|problem.?solving|critical.?thinking|creativity|collaboration|negotiation|presentation/i.test(lower)) {
    return 'soft_skill';
  }
  
  if (/certified|certification|pmp|aws.?certified|cpa|cfa|cissp/i.test(lower)) {
    return 'certification';
  }
  
  if (/ai|ml|machine.?learning|deep.?learning|llm|gpt|chatgpt|langchain|vector|embedding|transformer/i.test(lower)) {
    return 'emerging_tech';
  }
  
  // Default to tool
  return 'tool';
}

/**
 * Calculate skill half-life data for a specific skill
 */
export function getSkillHalfLife(skillName: string): SkillHalfLifeData {
  const normalized = skillName.toLowerCase().trim();
  const category = inferSkillCategory(skillName);
  const categoryDefaults = CATEGORY_HALF_LIVES[category];
  const specificData = SPECIFIC_SKILL_DATA[normalized];
  
  return {
    skillName,
    category,
    baseHalfLifeMonths: specificData?.baseHalfLifeMonths ?? categoryDefaults.base,
    volatilityFactor: categoryDefaults.volatility,
    demandTrend: specificData?.demandTrend ?? 'stable',
    lastUpdated: new Date(),
  };
}

/**
 * Calculate current skill relevance and decay metrics
 * 
 * @param skillName - Name of the skill
 * @param monthsSinceAcquired - Months since skill was acquired/last updated
 * @param practiceFrequency - How often skill is practiced: 'daily' | 'weekly' | 'monthly' | 'rarely'
 */
export function calculateSkillDecay(
  skillName: string,
  monthsSinceAcquired: number,
  practiceFrequency: 'daily' | 'weekly' | 'monthly' | 'rarely' = 'monthly'
): SkillDecayResult {
  const halfLifeData = getSkillHalfLife(skillName);
  
  // Adjust half-life based on practice frequency
  const practiceMultiplier = {
    daily: 1.5,      // Active practice extends half-life by 50%
    weekly: 1.2,     // Weekly practice extends by 20%
    monthly: 1.0,    // Base rate
    rarely: 0.7,     // Rare practice accelerates decay
  }[practiceFrequency];
  
  // Adjust for demand trend
  const trendMultiplier = {
    rising: 1.2,     // Rising demand extends relevance
    stable: 1.0,
    declining: 0.8,  // Declining demand accelerates decay
  }[halfLifeData.demandTrend];
  
  const effectiveHalfLife = halfLifeData.baseHalfLifeMonths * practiceMultiplier * trendMultiplier;
  
  // Calculate decay using exponential decay formula: R(t) = 100 * (0.5)^(t/halfLife)
  const decayExponent = monthsSinceAcquired / effectiveHalfLife;
  const currentRelevance = Math.round(100 * Math.pow(0.5, decayExponent));
  
  // Monthly decay rate (approximate)
  const decayRate = (Math.log(2) / effectiveHalfLife) * 100; // % per month
  
  // Time until 50% and 25% relevance
  const monthsUntil50 = Math.max(0, effectiveHalfLife - monthsSinceAcquired);
  const monthsUntil25 = Math.max(0, (effectiveHalfLife * 2) - monthsSinceAcquired);
  
  // Determine urgency level
  let urgencyLevel: SkillDecayResult['urgencyLevel'];
  let recommendation: string;
  
  if (currentRelevance < 25) {
    urgencyLevel = 'critical';
    recommendation = `Your ${skillName} skills are critically outdated. Immediate upskilling recommended to stay competitive.`;
  } else if (currentRelevance < 50) {
    urgencyLevel = 'warning';
    recommendation = `Your ${skillName} skills are decaying. Consider refresher training or certification within the next ${Math.ceil(monthsUntil25)} months.`;
  } else if (currentRelevance < 75) {
    urgencyLevel = 'moderate';
    recommendation = `Your ${skillName} skills are moderately fresh. Plan for skill maintenance in the next ${Math.ceil(monthsUntil50)} months.`;
  } else {
    urgencyLevel = 'stable';
    recommendation = `Your ${skillName} skills are current. Continue practicing to maintain relevance.`;
  }
  
  return {
    skillName,
    currentRelevance,
    halfLifeMonths: Math.round(effectiveHalfLife),
    decayRate: Math.round(decayRate * 100) / 100,
    monthsUntil50Percent: Math.round(monthsUntil50),
    monthsUntil25Percent: Math.round(monthsUntil25),
    urgencyLevel,
    recommendation,
  };
}

/**
 * Batch calculate decay for multiple skills
 */
export function calculateSkillPortfolioDecay(
  skills: Array<{ name: string; monthsSinceAcquired: number; practiceFrequency?: 'daily' | 'weekly' | 'monthly' | 'rarely' }>
): {
  skills: SkillDecayResult[];
  averageRelevance: number;
  criticalCount: number;
  warningCount: number;
  overallHealth: 'healthy' | 'needs_attention' | 'at_risk';
} {
  const results = skills.map(skill => 
    calculateSkillDecay(skill.name, skill.monthsSinceAcquired, skill.practiceFrequency || 'monthly')
  );
  
  const averageRelevance = Math.round(
    results.reduce((sum, r) => sum + r.currentRelevance, 0) / results.length
  );
  
  const criticalCount = results.filter(r => r.urgencyLevel === 'critical').length;
  const warningCount = results.filter(r => r.urgencyLevel === 'warning').length;
  
  let overallHealth: 'healthy' | 'needs_attention' | 'at_risk';
  if (criticalCount > 0 || averageRelevance < 40) {
    overallHealth = 'at_risk';
  } else if (warningCount > 0 || averageRelevance < 60) {
    overallHealth = 'needs_attention';
  } else {
    overallHealth = 'healthy';
  }
  
  return {
    skills: results,
    averageRelevance,
    criticalCount,
    warningCount,
    overallHealth,
  };
}

/**
 * Get skill refresh recommendations based on decay analysis
 */
export function getSkillRefreshRecommendations(
  decayResults: SkillDecayResult[]
): Array<{
  skill: string;
  priority: 'high' | 'medium' | 'low';
  action: string;
  estimatedTimeInvestment: string;
}> {
  return decayResults
    .filter(r => r.urgencyLevel !== 'stable')
    .sort((a, b) => a.currentRelevance - b.currentRelevance)
    .map(result => {
      let priority: 'high' | 'medium' | 'low';
      let action: string;
      let estimatedTimeInvestment: string;
      
      if (result.urgencyLevel === 'critical') {
        priority = 'high';
        action = `Complete ${result.skillName} certification or intensive bootcamp`;
        estimatedTimeInvestment = '40-80 hours';
      } else if (result.urgencyLevel === 'warning') {
        priority = 'medium';
        action = `Take refresher course on latest ${result.skillName} developments`;
        estimatedTimeInvestment = '20-40 hours';
      } else {
        priority = 'low';
        action = `Review ${result.skillName} documentation and practice exercises`;
        estimatedTimeInvestment = '10-20 hours';
      }
      
      return {
        skill: result.skillName,
        priority,
        action,
        estimatedTimeInvestment,
      };
    });
}
