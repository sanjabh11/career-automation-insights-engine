import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

/**
 * Human Agency Scale (H1-H5)
 *
 * Classifies occupations/tasks on a 5-level scale measuring the degree
 * of human agency required in the AI-augmented workflow:
 *
 * H1: Human-only — AI cannot perform this task (e.g., empathy-critical care)
 * H2: Human-led, AI-assisted — Human directs, AI suggests (e.g., medical diagnosis)
 * H3: Shared agency — Human and AI collaborate as peers (e.g., code review with Copilot)
 * H4: AI-led, Human-supervised — AI performs, human approves (e.g., automated report generation)
 * H5: AI-autonomous — AI performs without human oversight (e.g., data entry, routing)
 *
 * Based on:
 * - Exposure score (from Pizzinelli model)
 * - Complementarity score
 * - Task complexity (O*NET)
 * - Need for human judgment (socio-emotional, adversarial)
 */

export type AgencyLevel = 'H1' | 'H2' | 'H3' | 'H4' | 'H5';

export interface AgencyClassification {
  level: AgencyLevel;
  label: string;
  description: string;
  exposureScore: number;
  complementarityScore: number;
  humanJudgmentRequired: number;
  automationConfidence: number;
  rationale: string;
}

const AGENCY_PROFILES: Record<AgencyLevel, { label: string; description: string }> = {
  H1: {
    label: "Human-Only",
    description: "AI cannot perform this task. Requires empathy, physical presence, or complex human judgment.",
  },
  H2: {
    label: "Human-Led, AI-Assisted",
    description: "Human directs the work; AI provides suggestions, drafts, or analysis support.",
  },
  H3: {
    label: "Shared Agency",
    description: "Human and AI collaborate as peers. Both contribute substantively to the outcome.",
  },
  H4: {
    label: "AI-Led, Human-Supervised",
    description: "AI performs the work; human reviews and approves. Minimal human intervention needed.",
  },
  H5: {
    label: "AI-Autonomous",
    description: "AI performs without human oversight. Fully automated with no human-in-the-loop.",
  },
};

function classifyAgency(
  exposureScore: number,
  complementarityScore: number,
  humanJudgmentRequired: number,
): AgencyClassification {
  // Automation confidence: high exposure + low complementarity = high automation potential
  const automationConfidence = Math.round(
    (exposureScore * 0.5 + (10 - complementarityScore) * 0.3 + (10 - humanJudgmentRequired) * 0.2) * 10,
  ) / 10;

  let level: AgencyLevel;
  let rationale: string;

  if (humanJudgmentRequired >= 8 || exposureScore < 3) {
    level = 'H1';
    rationale = `High human judgment required (${humanJudgmentRequired}/10) and low exposure (${exposureScore}/10). AI cannot replace human agency.`;
  } else if (exposureScore < 5 && complementarityScore >= 5) {
    level = 'H2';
    rationale = `Moderate exposure (${exposureScore}/10) with high complementarity (${complementarityScore}/10). AI assists but human leads.`;
  } else if (exposureScore >= 5 && exposureScore < 7 && complementarityScore >= 5) {
    level = 'H3';
    rationale = `Balanced exposure (${exposureScore}/10) and complementarity (${complementarityScore}/10). Human and AI work as peers.`;
  } else if (exposureScore >= 7 && humanJudgmentRequired >= 3) {
    level = 'H4';
    rationale = `High exposure (${exposureScore}/10) with some human judgment needed (${humanJudgmentRequired}/10). AI leads, human supervises.`;
  } else {
    level = 'H5';
    rationale = `Very high exposure (${exposureScore}/10) and low human judgment (${humanJudgmentRequired}/10). AI can operate autonomously.`;
  }

  const profile = AGENCY_PROFILES[level];

  return {
    level,
    label: profile.label,
    description: profile.description,
    exposureScore,
    complementarityScore,
    humanJudgmentRequired,
    automationConfidence,
    rationale,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as {
      occupationCode?: string;
      exposureScore?: number;
      complementarityScore?: number;
      humanJudgmentRequired?: number;
    };

    let exposure = body.exposureScore;
    let complementarity = body.complementarityScore;
    let humanJudgment = body.humanJudgmentRequired;

    // If occupation code provided, fetch from DB
    if (body.occupationCode && (!exposure || !complementarity)) {
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
          exposure = exposure ?? apoLog.category_scores.exposure_score;
          complementarity = complementarity ?? apoLog.category_scores.complementarity_score;
        }
      }
    }

    // Defaults if still missing
    exposure = exposure ?? 5;
    complementarity = complementarity ?? 5;
    humanJudgment = humanJudgment ?? Math.round((10 - exposure + complementarity) / 2);

    const classification = classifyAgency(exposure, complementarity, humanJudgment);

    return new Response(
      JSON.stringify({
        occupationCode: body.occupationCode ?? null,
        ...classification,
        scale: "H1-H5 Human Agency Scale",
        inputScores: { exposure, complementarity, humanJudgment },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("human-agency-scale error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
