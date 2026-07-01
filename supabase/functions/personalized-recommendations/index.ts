import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ReqSchema = z.object({
  user_id: z.string().uuid(),
  top_k: z.number().min(1).max(50).default(10),
  include_skills: z.boolean().default(true),
});

interface InteractionRow {
  occupation_code: string;
  interaction_type: string;
  interaction_weight: number;
}

interface OccupationRow {
  occupation_code: string;
  occupation_title: string;
}

interface ApoLogRow {
  occupation_code: string;
  overall_apo: number | null;
}

interface SkillRatingRow {
  skill_name: string;
  proficiency_rating: number;
}

const INTERACTION_WEIGHTS: Record<string, number> = {
  viewed: 1.0,
  searched: 1.5,
  saved: 2.0,
  analyzed: 2.5,
  planned: 3.0,
};

/**
 * Item-Based Collaborative Filtering
 *
 * 1. Build user-occupation interaction matrix
 * 2. Compute occupation co-occurrence similarity (cosine)
 * 3. For each candidate occupation, sum similarity * user_interaction
 * 4. Combine with content-based score (skill overlap) and market demand
 */
function itemBasedCF(
  userInteractions: InteractionRow[],
  allInteractions: InteractionRow[],
  candidateOccs: string[],
): Map<string, number> {
  const userOccs = new Set(userInteractions.map((i) => i.occupation_code));
  const scores = new Map<string, number>();

  // Build occupation → user interaction map
  const occUserMap = new Map<string, Map<string, number>>();
  for (const i of allInteractions) {
    if (!occUserMap.has(i.occupation_code)) occUserMap.set(i.occupation_code, new Map());
    const w = INTERACTION_WEIGHTS[i.interaction_type] ?? 1.0;
    const current = occUserMap.get(i.occupation_code)!.get(i.interaction_type) ?? 0;
    occUserMap.get(i.occupation_code)!.set(i.interaction_type, Math.max(current, w * i.interaction_weight));
  }

  // Compute occupation frequency (for cosine normalization)
  const occFrequency = new Map<string, number>();
  for (const [occ, users] of occUserMap) {
    occFrequency.set(occ, users.size);
  }

  // For each candidate occupation, compute CF score
  for (const candidate of candidateOccs) {
    if (userOccs.has(candidate)) continue; // Skip already-interacted

    let cfScore = 0;
    const candidateUsers = occUserMap.get(candidate);
    if (!candidateUsers) continue;

    for (const userOcc of userOccs) {
      const occUsers = occUserMap.get(userOcc);
      if (!occUsers) continue;

      // Co-occurrence count (users who interacted with both)
      let coCount = 0;
      for (const [u] of candidateUsers) {
        if (occUsers.has(u)) coCount++;
      }

      // Cosine similarity: co_count / sqrt(freq_a * freq_b)
      const freqA = occFrequency.get(candidate) ?? 1;
      const freqB = occFrequency.get(userOcc) ?? 1;
      const similarity = coCount / Math.sqrt(freqA * freqB);

      // User's interaction weight for this occupation
      const userWeight = userInteractions
        .filter((i) => i.occupation_code === userOcc)
        .reduce((sum, i) => sum + (INTERACTION_WEIGHTS[i.interaction_type] ?? 1.0) * i.interaction_weight, 0);

      cfScore += similarity * userWeight;
    }

    scores.set(candidate, cfScore);
  }

  return scores;
}

/**
 * Content-based scoring using skill overlap between user's skills and occupation requirements
 */
function contentBasedScore(
  userSkills: SkillRatingRow[],
  occupationSkills: Map<string, Set<string>>,
  candidateOccs: string[],
): Map<string, number> {
  const userSkillSet = new Set(userSkills.map((s) => s.skill_name.toLowerCase()));
  const scores = new Map<string, number>();

  for (const occ of candidateOccs) {
    const occSkills = occupationSkills.get(occ);
    if (!occSkills || occSkills.size === 0) {
      scores.set(occ, 0);
      continue;
    }

    let overlap = 0;
    for (const s of occSkills) {
      if (userSkillSet.has(s.toLowerCase())) overlap++;
    }
    scores.set(occ, overlap / occSkills.size);
  }

  return scores;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const raw = await req.text();
    let body: z.infer<typeof ReqSchema>;
    try {
      body = ReqSchema.parse(JSON.parse(raw));
    } catch (_e) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch user's interactions
    const { data: userInteractions } = await supabase
      .from("user_interactions")
      .select("occupation_code, interaction_type, interaction_weight")
      .eq("user_id", body.user_id)
      .order("created_at", { ascending: false })
      .limit(100) as { data: InteractionRow[] | null; error: unknown };

    // 2. Fetch all interactions (for CF — limited sample)
    const { data: allInteractions } = await supabase
      .from("user_interactions")
      .select("occupation_code, interaction_type, interaction_weight")
      .limit(5000) as { data: InteractionRow[] | null; error: unknown };

    // 3. Fetch user's skill ratings
    const { data: userSkills } = await supabase
      .from("user_skill_ratings")
      .select("skill_name, proficiency_rating")
      .eq("user_id", body.user_id) as { data: SkillRatingRow[] | null; error: unknown };

    // 4. Fetch occupations for candidates
    const { data: occupations } = await supabase
      .from("onet_occupation_enrichment")
      .select("occupation_code, occupation_title")
      .limit(500) as { data: OccupationRow[] | null; error: unknown };

    if (!occupations) {
      return new Response(JSON.stringify({ error: "No occupations found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const candidateOccs = occupations.map((o) => o.occupation_code);
    const titleMap = new Map(occupations.map((o) => [o.occupation_code, o.occupation_title]));

    // 5. Fetch APO scores for market demand weighting
    const { data: apoLogs } = await supabase
      .from("apo_logs")
      .select("occupation_code, overall_apo")
      .in("occupation_code", candidateOccs)
      .not("overall_apo", "is", null)
      .order("created_at", { ascending: false })
      .limit(500) as { data: ApoLogRow[] | null; error: unknown };

    const apoMap = new Map<string, number>();
    if (apoLogs) {
      for (const log of apoLogs) {
        if (!apoMap.has(log.occupation_code) && log.overall_apo !== null) {
          apoMap.set(log.occupation_code, Number(log.overall_apo));
        }
      }
    }

    // 6. Compute CF scores
    const cfScores = (userInteractions && allInteractions && userInteractions.length >= 3)
      ? itemBasedCF(userInteractions, allInteractions, candidateOccs)
      : new Map<string, number>(); // Cold start: skip CF

    // 7. Compute content-based scores (if user has skills)
    const occSkillsMap = new Map<string, Set<string>>();
    if (userSkills && userSkills.length > 0 && body.include_skills) {
      // Fetch skills for candidate occupations (batch)
      for (const occ of candidateOccs.slice(0, 100)) {
        const { data: knowledge } = await supabase
          .from("onet_knowledge")
          .select("knowledge_id")
          .eq("occupation_code", occ)
          .gte("importance", 3.0)
          .limit(20) as { data: Array<{ knowledge_id: string }> | null; error: unknown };

        const skills = new Set<string>();
        knowledge?.forEach((k) => skills.add(k.knowledge_id));
        occSkillsMap.set(occ, skills);
      }
    }
    const contentScores = (userSkills && userSkills.length > 0)
      ? contentBasedScore(userSkills, occSkillsMap, candidateOccs)
      : new Map<string, number>();

    // 8. Hybrid scoring: 0.4 * CF + 0.4 * content + 0.2 * market_demand
    const isColdStart = !userInteractions || userInteractions.length < 3;
    const cfWeight = isColdStart ? 0 : 0.4;
    const contentWeight = isColdStart ? 0.7 : 0.4;
    const marketWeight = isColdStart ? 0.3 : 0.2;

    const recommendations = candidateOccs
      .map((occ) => {
        const cf = cfScores.get(occ) ?? 0;
        const content = contentScores.get(occ) ?? 0;
        const apo = apoMap.get(occ) ?? 50;
        // Market demand: lower APO = higher demand (safer occupations)
        const marketDemand = clamp((100 - apo) / 100, 0, 1);

        const hybridScore = cfWeight * cf + contentWeight * content + marketWeight * marketDemand;

        return {
          occupation_code: occ,
          occupation_title: titleMap.get(occ) ?? occ,
          hybrid_score: Math.round(hybridScore * 1000) / 1000,
          cf_score: Math.round(cf * 1000) / 1000,
          content_score: Math.round(content * 1000) / 1000,
          market_demand_score: Math.round(marketDemand * 1000) / 1000,
          automation_apo: apo,
        };
      })
      .filter((r) => r.hybrid_score > 0)
      .sort((a, b) => b.hybrid_score - a.hybrid_score)
      .slice(0, body.top_k);

    // 9. Skill recommendations (if user has skills)
    let skillRecommendations: Array<{ skill_name: string; priority: string }> = [];
    if (userSkills && userSkills.length > 0 && body.include_skills) {
      // Find skills from top recommended occupations that user doesn't have
      const userSkillSet = new Set(userSkills.map((s) => s.skill_name.toLowerCase()));
      const skillFrequency = new Map<string, number>();

      for (const rec of recommendations.slice(0, 5)) {
        const occSkills = occSkillsMap.get(rec.occupation_code);
        if (occSkills) {
          for (const s of occSkills) {
            if (!userSkillSet.has(s.toLowerCase())) {
              skillFrequency.set(s, (skillFrequency.get(s) ?? 0) + 1);
            }
          }
        }
      }

      skillRecommendations = Array.from(skillFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill, freq]) => ({
          skill_name: skill,
          priority: freq >= 3 ? "high" : freq >= 2 ? "medium" : "low",
        }));
    }

    const response = {
      user_id: body.user_id,
      is_cold_start: isColdStart,
      recommendation_count: recommendations.length,
      recommended_occupations: recommendations,
      recommended_skills: skillRecommendations,
      model: "hybrid_cf_content",
      weights: { cf: cfWeight, content: contentWeight, market: marketWeight },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("personalized-recommendations error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
