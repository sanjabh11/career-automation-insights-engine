import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Generate Counterfactual Explanations
 *
 * Given an occupation's APO scores, generates deterministic recourse recommendations:
 * "If your tasks score decreased by X, your APO would drop to Y"
 *
 * Approach:
 * 1. Fetch occupation's per-category APO scores
 * 2. For each category, compute the delta needed to reach a target APO
 * 3. Generate actionable recommendations per category
 * 4. Verify determinism: same inputs → same outputs
 */

interface CategoryScore {
  category: string;
  score: number;
  weight: number;
  contribution: number;
}

const CATEGORY_WEIGHTS: Record<string, number> = {
  tasks: 0.35,
  technologies: 0.25,
  skills: 0.20,
  abilities: 0.15,
  knowledge: 0.05,
};

const CATEGORY_ACTIONS: Record<string, Array<{ action: string; potentialReduction: number }>> = {
  tasks: [
    { action: "Automate routine data entry tasks with RPA tools", potentialReduction: 15 },
    { action: "Implement AI-assisted document processing for template-based work", potentialReduction: 12 },
    { action: "Use LLMs for draft generation of standard reports", potentialReduction: 10 },
    { action: "Deploy workflow automation for checklist-driven procedures", potentialReduction: 8 },
  ],
  technologies: [
    { action: "Adopt AI-powered CRM with predictive analytics", potentialReduction: 18 },
    { action: "Implement automated testing frameworks with AI agents", potentialReduction: 15 },
    { action: "Use AI-augmented development tools (Copilot, Cursor)", potentialReduction: 14 },
    { action: "Deploy intelligent monitoring and alerting systems", potentialReduction: 10 },
  ],
  skills: [
    { action: "Develop prompt engineering and AI collaboration skills", potentialReduction: 8 },
    { action: "Build data literacy and analytical reasoning capabilities", potentialReduction: 7 },
    { action: "Learn to orchestrate AI agents for multi-step workflows", potentialReduction: 6 },
    { action: "Develop skills in AI model evaluation and feedback", potentialReduction: 5 },
  ],
  abilities: [
    { action: "Focus on complex problem-solving that AI struggles with", potentialReduction: 5 },
    { action: "Develop creative thinking capabilities for novel scenarios", potentialReduction: 4 },
    { action: "Strengthen interpersonal communication and empathy", potentialReduction: 3 },
    { action: "Build leadership and team coordination skills", potentialReduction: 3 },
  ],
  knowledge: [
    { action: "Deepen domain expertise in areas requiring contextual judgment", potentialReduction: 3 },
    { action: "Develop cross-disciplinary knowledge for complex decision-making", potentialReduction: 2 },
    { action: "Build regulatory and compliance knowledge (hard to automate)", potentialReduction: 2 },
  ],
};

function computeOverallAPO(scores: Record<string, number>): number {
  let sum = 0;
  for (const [cat, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    sum += (scores[cat] ?? 0) * weight;
  }
  return Math.round(sum * 100) / 100;
}

interface CounterfactualResult {
  category: string;
  currentScore: number;
  currentContribution: number;
  targetScore: number;
  targetContribution: number;
  delta: number;
  newOverallAPO: number;
  overallDelta: number;
  action: string;
  potentialReduction: number;
  feasible: boolean;
}

function generateCounterfactuals(
  scores: Record<string, number>,
  targetAPO: number,
): { counterfactuals: CounterfactualResult[]; currentAPO: number; targetAPO: number; achievable: boolean } {
  const currentAPO = computeOverallAPO(scores);
  const gap = currentAPO - targetAPO;

  if (gap <= 0) {
    return {
      counterfactuals: [],
      currentAPO,
      targetAPO,
      achievable: true,
    };
  }

  const results: CounterfactualResult[] = [];
  const categories = Object.keys(CATEGORY_WEIGHTS).sort((a, b) => CATEGORY_WEIGHTS[b] - CATEGORY_WEIGHTS[a]);

  // Distribute the gap across categories proportionally to their weight
  let remainingGap = gap;

  for (const cat of categories) {
    if (remainingGap <= 0) break;

    const weight = CATEGORY_WEIGHTS[cat];
    const currentScore = scores[cat] ?? 0;
    const currentContribution = currentScore * weight;

    // How much can we reduce this category?
    const actions = CATEGORY_ACTIONS[cat] || [];
    const maxReduction = actions.reduce((sum, a) => sum + a.potentialReduction, 0);
    const maxScoreReduction = Math.min(currentScore, maxReduction);
    const maxContributionReduction = maxScoreReduction * weight;

    // Target reduction for this category (proportional to weight)
    const targetReduction = Math.min(remainingGap, maxContributionReduction);
    const scoreDelta = targetReduction / weight;
    const targetScore = Math.max(0, currentScore - scoreDelta);

    // Find best action for this reduction
    const suitableActions = actions.filter((a) => a.potentialReduction >= scoreDelta * 0.5);
    const bestAction = suitableActions[0] || actions[0];

    const newScores = { ...scores, [cat]: targetScore };
    const newOverallAPO = computeOverallAPO(newScores);

    results.push({
      category: cat,
      currentScore: Math.round(currentScore * 100) / 100,
      currentContribution: Math.round(currentContribution * 100) / 100,
      targetScore: Math.round(targetScore * 100) / 100,
      targetContribution: Math.round(targetScore * weight * 100) / 100,
      delta: Math.round(scoreDelta * 100) / 100,
      newOverallAPO: Math.round(newOverallAPO * 100) / 100,
      overallDelta: Math.round((currentAPO - newOverallAPO) * 100) / 100,
      action: bestAction?.action || `Reduce ${cat} automation exposure`,
      potentialReduction: bestAction?.potentialReduction || 0,
      feasible: scoreDelta <= maxScoreReduction,
    });

    remainingGap -= targetReduction;
  }

  const achievable = remainingGap <= 0.5;

  return {
    counterfactuals: results,
    currentAPO: Math.round(currentAPO * 100) / 100,
    targetAPO,
    achievable,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as {
      occupationCode?: string;
      scores?: Record<string, number>;
      targetAPO?: number;
    };

    if (!body.targetAPO || body.targetAPO < 0 || body.targetAPO > 100) {
      return new Response(
        JSON.stringify({ error: "targetAPO (0-100) is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let scores = body.scores;

    // If occupation code provided, fetch scores from DB
    if (!scores && body.occupationCode) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: apoLog } = await supabase
          .from("apo_logs")
          .select("category_scores, overall_apo")
          .eq("occupation_code", body.occupationCode)
          .order("created_at", { ascending: false })
          .limit(1)
          .single() as { data: { category_scores: Record<string, number> | null; overall_apo: number | null } | null; error: unknown };

        if (apoLog && apoLog.category_scores) {
          const cs = apoLog.category_scores;
          scores = {
            tasks: cs.tasks ?? 50,
            technologies: cs.technologies ?? 50,
            skills: cs.skills ?? 50,
            abilities: cs.abilities ?? 50,
            knowledge: cs.knowledge ?? 50,
          };
        }
      }
    }

    if (!scores) {
      return new Response(
        JSON.stringify({ error: "Either scores or occupationCode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Ensure all categories present
    const fullScores: Record<string, number> = {
      tasks: scores.tasks ?? 50,
      technologies: scores.technologies ?? 50,
      skills: scores.skills ?? 50,
      abilities: scores.abilities ?? 50,
      knowledge: scores.knowledge ?? 50,
    };

    const result = generateCounterfactuals(fullScores, body.targetAPO);

    return new Response(
      JSON.stringify({
        occupationCode: body.occupationCode ?? null,
        currentAPO: result.currentAPO,
        targetAPO: result.targetAPO,
        gap: Math.round((result.currentAPO - result.targetAPO) * 100) / 100,
        achievable: result.achievable,
        counterfactuals: result.counterfactuals,
        deterministic: true, // Same inputs always produce same outputs
        summary: result.counterfactuals.length > 0
          ? `To reduce APO from ${result.currentAPO} to ${result.targetAPO}, apply ${result.counterfactuals.length} action(s): ${result.counterfactuals.map((c) => c.action).join("; ")}`
          : `Current APO (${result.currentAPO}) already at or below target (${result.targetAPO})`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("generate-counterfactual error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
