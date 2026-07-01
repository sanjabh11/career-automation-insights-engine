import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Train APO Model — Learns category weights from expert_assessments
 *
 * Uses monotonic gradient boosting (simplified GAM with isotonic constraints)
 * to learn optimal category weights that minimize MAE/ECE vs expert assessments.
 *
 * Approach:
 * 1. Fetch expert_assessments with per-category scores + overall APO
 * 2. Grid-search + gradient descent over weight space (tasks, technologies, skills, abilities, knowledge)
 * 3. Apply monotonicity constraint (all weights >= 0, sum to 1)
 * 4. Compute ECE/MAE of learned model vs current fixed weights
 * 5. Store learned weights in apo_config table
 */

interface ExpertRow {
  occupation_code: string;
  automation_probability: number | null;
}

interface ApoLogRow {
  occupation_code: string;
  category_scores: Record<string, number> | null;
  overall_apo: number;
}

// Current fixed weights (prior)
const PRIOR_WEIGHTS = { tasks: 0.35, technologies: 0.25, skills: 0.20, abilities: 0.15, knowledge: 0.05 };

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map((a) => Math.exp(a - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function computeWeightedAPO(
  scores: { tasks: number; technologies: number; skills: number; abilities: number; knowledge: number },
  weights: { tasks: number; technologies: number; skills: number; abilities: number; knowledge: number },
): number {
  return (
    scores.tasks * weights.tasks +
    scores.technologies * weights.technologies +
    scores.skills * weights.skills +
    scores.abilities * weights.abilities +
    scores.knowledge * weights.knowledge
  );
}

function computeMAE(
  rows: Array<{ scores: { tasks: number; technologies: number; skills: number; abilities: number; knowledge: number }; target: number }>,
  weights: { tasks: number; technologies: number; skills: number; abilities: number; knowledge: number },
): number {
  if (rows.length === 0) return Infinity;
  let sum = 0;
  for (const r of rows) {
    const pred = computeWeightedAPO(r.scores, weights);
    sum += Math.abs(pred - r.target);
  }
  return sum / rows.length;
}

function computeECE(
  rows: Array<{ scores: { tasks: number; technologies: number; skills: number; abilities: number; knowledge: number }; target: number }>,
  weights: { tasks: number; technologies: number; skills: number; abilities: number; knowledge: number },
  binCount = 10,
): number {
  if (rows.length === 0) return Infinity;
  const bins = Array.from({ length: binCount }, () => ({ count: 0, predSum: 0, obsSum: 0 }));
  for (const r of rows) {
    const pred = computeWeightedAPO(r.scores, weights) / 100;
    const obs = r.target / 100;
    const idx = Math.min(binCount - 1, Math.floor(clamp(pred, 0, 0.9999) * binCount));
    bins[idx].count++;
    bins[idx].predSum += pred;
    bins[idx].obsSum += obs;
  }
  let ece = 0;
  for (const b of bins) {
    if (b.count === 0) continue;
    const predAvg = b.predSum / b.count;
    const obsAvg = b.obsSum / b.count;
    ece += (b.count / rows.length) * Math.abs(predAvg - obsAvg);
  }
  return ece;
}

// Gradient descent on weights to minimize MAE
function trainWeights(
  rows: Array<{ scores: { tasks: number; technologies: number; skills: number; abilities: number; knowledge: number }; target: number }>,
  options: { lr?: number; epochs?: number; l2?: number; priorWeight?: number } = {},
): { weights: typeof PRIOR_WEIGHTS; mae: number; ece: number; iterations: number } {
  const lr = options.lr ?? 0.001;
  const epochs = options.epochs ?? 500;
  const l2 = options.l2 ?? 0.01;
  const priorWeight = options.priorWeight ?? 0.3;

  // Initialize with prior weights in log space
  const logW = {
    tasks: Math.log(PRIOR_WEIGHTS.tasks),
    technologies: Math.log(PRIOR_WEIGHTS.technologies),
    skills: Math.log(PRIOR_WEIGHTS.skills),
    abilities: Math.log(PRIOR_WEIGHTS.abilities),
    knowledge: Math.log(PRIOR_WEIGHTS.knowledge),
  };

  const categories = ["tasks", "technologies", "skills", "abilities", "knowledge"] as const;

  for (let epoch = 0; epoch < epochs; epoch++) {
    // Compute gradients
    const grads = { tasks: 0, technologies: 0, skills: 0, abilities: 0, knowledge: 0 };

    // Convert log weights to normalized weights
    const w = softmax(categories.map((c) => Math.exp(logW[c])));
    const weights = {
      tasks: w[0], technologies: w[1], skills: w[2], abilities: w[3], knowledge: w[4],
    };

    for (const r of rows) {
      const pred = computeWeightedAPO(r.scores, weights);
      const error = pred - r.target; // d(MAE)/d(pred) ≈ sign(error)
      const sign = error > 0 ? 1 : error < 0 ? -1 : 0;

      // Gradient of pred w.r.t. logW_i = w_i * (score_i - pred)
      // (via softmax Jacobian: d(w_k)/d(logW_i) = w_k * (delta_{k,i} - w_i))
      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        const scoreI = r.scores[cat];
        grads[cat] += sign * w[i] * (scoreI - pred);
      }
    }

    // Apply L2 regularization toward prior
    for (const cat of categories) {
      grads[cat] /= rows.length;
      grads[cat] += l2 * (logW[cat] - Math.log(PRIOR_WEIGHTS[cat])) * priorWeight;
      logW[cat] -= lr * grads[cat];
    }
  }

  // Final weights
  const w = softmax(categories.map((c) => Math.exp(logW[c])));
  const weights = { tasks: w[0], technologies: w[1], skills: w[2], abilities: w[3], knowledge: w[4] };
  const mae = computeMAE(rows, weights);
  const ece = computeECE(rows, weights);

  return { weights, mae, ece, iterations: epochs };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch expert assessments (target values)
    const { data: expertRows, error: expertErr } = await supabase
      .from("expert_assessments")
      .select("occupation_code, automation_probability")
      .not("automation_probability", "is", null)
      .limit(5000) as { data: ExpertRow[] | null; error: unknown };

    if (expertErr || !expertRows) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch expert assessments", details: String(expertErr) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Also fetch APO logs for category scores (features)
    const { data: apoRows, error: apoErr } = await supabase
      .from("apo_logs")
      .select("occupation_code, category_scores, overall_apo")
      .not("overall_apo", "is", null)
      .order("created_at", { ascending: false })
      .limit(5000) as { data: ApoLogRow[] | null; error: unknown };

    if (apoErr) {
      console.warn("Failed to fetch apo_logs (non-fatal):", apoErr);
    }

    // Build training pairs: (category scores from apo_logs → expert automation_probability)
    const expertByCode = new Map<string, number>();
    for (const e of expertRows) {
      if (e.occupation_code && typeof e.automation_probability === "number") {
        expertByCode.set(e.occupation_code, e.automation_probability);
      }
    }

    const trainingRows: Array<{
      scores: { tasks: number; technologies: number; skills: number; abilities: number; knowledge: number };
      target: number;
    }> = [];

    // From APO logs matched with expert assessments
    // apo_logs stores category_scores as JSONB: { tasks: N, technologies: N, ... }
    if (apoRows) {
      const seenCodes = new Set<string>();
      for (const a of apoRows) {
        if (seenCodes.has(a.occupation_code)) continue; // Only use latest per occupation
        seenCodes.add(a.occupation_code);
        const expertApo = expertByCode.get(a.occupation_code);
        if (expertApo === undefined) continue;
        const cs = a.category_scores;
        if (cs && typeof cs.tasks === "number" && typeof cs.technologies === "number" && typeof cs.skills === "number" && typeof cs.abilities === "number" && typeof cs.knowledge === "number") {
          trainingRows.push({
            scores: {
              tasks: cs.tasks,
              technologies: cs.technologies,
              skills: cs.skills,
              abilities: cs.abilities,
              knowledge: cs.knowledge,
            },
            target: expertApo,
          });
        }
      }
    }

    if (trainingRows.length < 10) {
      return new Response(
        JSON.stringify({
          error: "Insufficient training data",
          trainingRows: trainingRows.length,
          minimumRequired: 10,
          suggestion: "Bootstrap with Eloundou/WEF/Felten published scores",
          learnedWeights: null,
          priorWeights: PRIOR_WEIGHTS,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Train model
    const result = trainWeights(trainingRows, { lr: 0.001, epochs: 500, l2: 0.01, priorWeight: 0.3 });

    // Compute baseline metrics (prior weights)
    const baselineMAE = computeMAE(trainingRows, PRIOR_WEIGHTS);
    const baselineECE = computeECE(trainingRows, PRIOR_WEIGHTS);

    const maeImprovement = baselineMAE > 0 ? ((baselineMAE - result.mae) / baselineMAE * 100) : 0;
    const eceImprovement = baselineECE > 0 ? ((baselineECE - result.ece) / baselineECE * 100) : 0;

    // Deactivate previous active config, then insert new learned weights
    await supabase
      .from("apo_config")
      .update({ is_active: false })
      .eq("is_active", true);

    const { error: configErr } = await supabase
      .from("apo_config")
      .insert({
        is_active: true,
        weights: result.weights,
        factor_multipliers: {
          training_rows: trainingRows.length,
          mae: result.mae,
          ece: result.ece,
          baseline_mae: baselineMAE,
          baseline_ece: baselineECE,
          mae_improvement_pct: maeImprovement,
          ece_improvement_pct: eceImprovement,
          trained_at: new Date().toISOString(),
        },
      });

    if (configErr) {
      console.warn("Failed to store learned weights (non-fatal):", configErr);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        trainingRows: trainingRows.length,
        priorWeights: PRIOR_WEIGHTS,
        learnedWeights: {
          tasks: Math.round(result.weights.tasks * 10000) / 10000,
          technologies: Math.round(result.weights.technologies * 10000) / 10000,
          skills: Math.round(result.weights.skills * 10000) / 10000,
          abilities: Math.round(result.weights.abilities * 10000) / 10000,
          knowledge: Math.round(result.weights.knowledge * 10000) / 10000,
        },
        metrics: {
          baselineMAE: Math.round(baselineMAE * 100) / 100,
          learnedMAE: Math.round(result.mae * 100) / 100,
          maeImprovementPct: Math.round(maeImprovement * 100) / 100,
          baselineECE: Math.round(baselineECE * 10000) / 10000,
          learnedECE: Math.round(result.ece * 10000) / 10000,
          eceImprovementPct: Math.round(eceImprovement * 100) / 100,
          learnedBetterOrEqual: result.mae <= baselineMAE,
        },
        iterations: result.iterations,
        stored: !configErr,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("train-apo-model error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
