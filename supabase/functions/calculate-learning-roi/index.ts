import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ReqSchema = z.object({
  occupation_code: z.string().min(1),
  skills_to_learn: z.array(z.string()).min(1).max(20),
  course_cost: z.number().min(0).default(0),
  course_duration_months: z.number().min(1).max(36).default(6),
  hours_per_week: z.number().min(1).max(80).default(10),
  current_salary: z.number().min(0).optional(),
  target_occupation_code: z.string().optional(),
});

interface BlsRow {
  occupation_code_6: string;
  median_wage_annual: number | null;
  projected_growth_10y: number | null;
}

interface ApoLogRow {
  occupation_code: string;
  overall_apo: number | null;
}

interface OccupationRow {
  occupation_code: string;
  occupation_title: string;
}

interface KnowledgeRow {
  knowledge_id: string;
  importance: number;
}

interface AbilityRow {
  ability_id: string;
  importance: number;
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

    const targetOcc = body.target_occupation_code ?? body.occupation_code;
    const soc6 = targetOcc.substring(0, 6);

    // 1. Fetch BLS salary + growth projections for both occupations
    const occCodes = [body.occupation_code.substring(0, 6), soc6];
    const { data: blsRows } = await supabase
      .from("bls_employment_projections")
      .select("occupation_code_6, median_wage_annual, projected_growth_10y")
      .in("occupation_code_6", occCodes)
      .limit(10) as { data: BlsRow[] | null; error: unknown };

    const blsMap = new Map<string, BlsRow>();
    if (blsRows) {
      for (const r of blsRows) blsMap.set(r.occupation_code_6, r);
    }

    const currentBls = blsMap.get(body.occupation_code.substring(0, 6));
    const targetBls = blsMap.get(soc6);

    const currentSalary = body.current_salary ?? currentBls?.median_wage_annual ?? 50000;
    const targetSalary = targetBls?.median_wage_annual ?? currentSalary * 1.15;
    const projectedGrowth = targetBls?.projected_growth_10y ?? 0;

    // 2. Fetch APO scores for both occupations
    const { data: apoLogs } = await supabase
      .from("apo_logs")
      .select("occupation_code, overall_apo")
      .in("occupation_code", [body.occupation_code, targetOcc])
      .not("overall_apo", "is", null)
      .order("created_at", { ascending: false })
      .limit(10) as { data: ApoLogRow[] | null; error: unknown };

    const apoMap = new Map<string, number>();
    if (apoLogs) {
      for (const log of apoLogs) {
        if (!apoMap.has(log.occupation_code) && log.overall_apo !== null) {
          apoMap.set(log.occupation_code, Number(log.overall_apo));
        }
      }
    }

    const currentApo = apoMap.get(body.occupation_code) ?? 50;
    const targetApo = apoMap.get(targetOcc) ?? 30;

    // 3. Fetch occupation titles
    const { data: occRows } = await supabase
      .from("onet_occupation_enrichment")
      .select("occupation_code, occupation_title")
      .in("occupation_code", [body.occupation_code, targetOcc])
      .limit(2) as { data: OccupationRow[] | null; error: unknown };

    const titleMap = new Map<string, string>();
    if (occRows) {
      for (const o of occRows) titleMap.set(o.occupation_code, o.occupation_title);
    }

    // 4. Fetch target occupation's required knowledge/abilities
    const { data: knowledge } = await supabase
      .from("onet_knowledge")
      .select("knowledge_id, importance")
      .eq("occupation_code", targetOcc)
      .gte("importance", 3.0)
      .limit(30) as { data: KnowledgeRow[] | null; error: unknown };

    const { data: abilities } = await supabase
      .from("onet_abilities")
      .select("ability_id, importance")
      .eq("occupation_code", targetOcc)
      .gte("importance", 3.0)
      .limit(30) as { data: AbilityRow[] | null; error: unknown };

    const targetSkillSet = new Set<string>();
    knowledge?.forEach((k) => targetSkillSet.add(k.knowledge_id.toLowerCase()));
    abilities?.forEach((a) => targetSkillSet.add(a.ability_id.toLowerCase()));

    // 5. Calculate skill coverage
    const userSkillSet = new Set(body.skills_to_learn.map((s) => s.toLowerCase()));
    let coveredSkills = 0;
    for (const s of targetSkillSet) {
      if (userSkillSet.has(s)) coveredSkills++;
    }
    const skillCoverage = targetSkillSet.size > 0 ? coveredSkills / targetSkillSet.size : 0.5;

    // 6. Real ROI Calculation
    const salaryUplift = Math.max(0, targetSalary - currentSalary);
    const automationRiskReduction = clamp(currentApo - targetApo, 0, 100) / 100;

    // Time value: opportunity cost of learning hours
    const hourlyRate = currentSalary / 2080; // 40h/wk * 52 weeks
    const totalLearningHours = body.hours_per_week * 4.33 * body.course_duration_months;
    const opportunityCost = totalLearningHours * hourlyRate;

    const totalCost = body.course_cost + opportunityCost;

    // Projected annual value: salary uplift + automation risk buffer
    // Automation buffer: risk_reduction * current_salary * 0.1 (expected annual loss from automation)
    const annualAutomationBuffer = automationRiskReduction * currentSalary * 0.1;
    const projectedAnnualValue = salaryUplift + annualAutomationBuffer;

    // Market growth adjustment: occupations with positive growth projection add value
    const marketGrowthBonus = (projectedGrowth / 100) * targetSalary * 0.05;
    const totalAnnualValue = projectedAnnualValue + marketGrowthBonus;

    // ROI over 3-year horizon
    const threeYearValue = totalAnnualValue * 3;
    const roi = totalCost > 0 ? Math.round((threeYearValue / totalCost) * 100) : 0;

    // Break-even: months until cumulative value exceeds cost
    const monthlyValue = totalAnnualValue / 12;
    const breakEvenMonths = monthlyValue > 0 ? Math.ceil(totalCost / monthlyValue) : null;

    // Skill gap analysis
    const uncoveredSkills = Array.from(targetSkillSet)
      .filter((s) => !userSkillSet.has(s))
      .slice(0, 10);

    const response = {
      occupation_code: body.occupation_code,
      occupation_title: titleMap.get(body.occupation_code) ?? body.occupation_code,
      target_occupation_code: targetOcc,
      target_occupation_title: titleMap.get(targetOcc) ?? targetOcc,
      roi_pct: roi,
      total_investment: Math.round(totalCost * 100) / 100,
      course_cost: body.course_cost,
      opportunity_cost: Math.round(opportunityCost * 100) / 100,
      projected_annual_value: Math.round(totalAnnualValue * 100) / 100,
      salary_uplift: Math.round(salaryUplift * 100) / 100,
      automation_risk_buffer: Math.round(annualAutomationBuffer * 100) / 100,
      market_growth_bonus: Math.round(marketGrowthBonus * 100) / 100,
      break_even_months: breakEvenMonths,
      three_year_roi: roi,
      current_salary: currentSalary,
      target_salary: targetSalary,
      current_apo: currentApo,
      target_apo: targetApo,
      automation_risk_reduction: Math.round(automationRiskReduction * 1000) / 10,
      skill_coverage_pct: Math.round(skillCoverage * 1000) / 10,
      skills_covered: coveredSkills,
      total_target_skills: targetSkillSet.size,
      uncovered_skills: uncoveredSkills,
      market_growth_projection_10y: projectedGrowth,
      model: "bls_grounded_roi",
      recommendation: roi > 200 ? "highly_recommended" : roi > 100 ? "recommended" : roi > 50 ? "consider" : "low_priority",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("calculate-learning-roi error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
