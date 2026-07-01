import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface OccupationRow {
  occupation_code: string;
  occupation_title: string;
  job_zone: number | null;
  career_cluster: string | null;
  industry: string | null;
}

interface ApoLogRow {
  occupation_code: string;
  overall_apo: number;
}

/**
 * Bias Audit Pipeline — LL 144 Four-Fifths Rule
 *
 * Computes impact ratios for occupation categories (job zone, career cluster, industry)
 * against high-risk APO predictions (APO >= 70).
 *
 * Impact Ratio = (high_risk_rate for category) / (high_risk_rate for highest group)
 * Passes if Impact Ratio >= 0.80 for all categories.
 */
async function computeBiasAudit(
  occupations: OccupationRow[],
  apoLogs: ApoLogRow[],
): Promise<{
  overall: { impactRatio: number; passed: boolean; flaggedCategories: string[] };
  results: Array<{
    category: string;
    categoryValue: string;
    occupationCount: number;
    highRiskCount: number;
    lowRiskCount: number;
    highRiskRate: number;
    impactRatio: number;
    fourFifthsPassed: boolean;
    flagged: boolean;
  }>;
}> {
  const apoByCode = new Map<string, number>();
  for (const log of apoLogs) {
    if (log.occupation_code && typeof log.overall_apo === "number") {
      apoByCode.set(log.occupation_code, log.overall_apo);
    }
  }

  const HIGH_RISK_THRESHOLD = 70;
  const FOUR_FIFTHS = 0.80;

  let totalHigh = 0;
  let totalMatched = 0;
  for (const occ of occupations) {
    const apo = apoByCode.get(occ.occupation_code);
    if (typeof apo === "number") {
      totalMatched++;
      if (apo >= HIGH_RISK_THRESHOLD) totalHigh++;
    }
  }
  const overallRate = totalMatched > 0 ? totalHigh / totalMatched : 0;

  const auditCategories = ["job_zone", "career_cluster", "industry"] as const;
  const allResults: Array<{
    category: string;
    categoryValue: string;
    occupationCount: number;
    highRiskCount: number;
    lowRiskCount: number;
    highRiskRate: number;
    impactRatio: number;
    fourFifthsPassed: boolean;
    flagged: boolean;
  }> = [];

  for (const category of auditCategories) {
    const groups = new Map<string, { total: number; high: number }>();
    for (const occ of occupations) {
      const rawValue = (occ as unknown as Record<string, unknown>)[category] as unknown;
      if (rawValue === null || rawValue === undefined) continue;
      const catValue = String(rawValue);
      const apo = apoByCode.get(occ.occupation_code);
      if (typeof apo !== "number") continue;

      const group = groups.get(catValue) || { total: 0, high: 0 };
      group.total++;
      if (apo >= HIGH_RISK_THRESHOLD) group.high++;
      groups.set(catValue, group);
    }

    let maxRate = 0;
    const groupRates: Array<{ value: string; rate: number; total: number; high: number }> = [];
    for (const [value, group] of groups) {
      const rate = group.total > 0 ? group.high / group.total : 0;
      groupRates.push({ value, rate, total: group.total, high: group.high });
      if (rate > maxRate) maxRate = rate;
    }

    for (const grp of groupRates) {
      const impactRatio = maxRate > 0 ? grp.rate / maxRate : 1.0;
      const passed = impactRatio >= FOUR_FIFTHS;
      allResults.push({
        category,
        categoryValue: grp.value,
        occupationCount: grp.total,
        highRiskCount: grp.high,
        lowRiskCount: grp.total - grp.high,
        highRiskRate: Math.round(grp.rate * 10000) / 10000,
        impactRatio: Math.round(impactRatio * 10000) / 10000,
        fourFifthsPassed: passed,
        flagged: !passed,
      });
    }
  }

  const flaggedCategories = Array.from(new Set(
    allResults.filter((r) => r.flagged).map((r) => `${r.category}:${r.categoryValue}`)
  ));
  const overallPassed = flaggedCategories.length === 0;
  const overallImpactRatio = Math.round(overallRate * 10000) / 10000;

  return {
    overall: {
      impactRatio: overallImpactRatio,
      passed: overallPassed,
      flaggedCategories,
    },
    results: allResults,
  };
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

    const { data: occupations, error: occError } = await supabase
      .from("onet_occupation_enrichment")
      .select("occupation_code, occupation_title, job_zone, career_cluster, industry")
      .limit(5000) as { data: OccupationRow[] | null; error: unknown };

    if (occError || !occupations) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch occupations", details: String(occError) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: apoLogs, error: apoError } = await supabase
      .from("apo_logs")
      .select("occupation_code, overall_apo")
      .not("overall_apo", "is", null)
      .order("created_at", { ascending: false })
      .limit(5000) as { data: ApoLogRow[] | null; error: unknown };

    if (apoError || !apoLogs) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch APO logs", details: String(apoError) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const latestApo = new Map<string, number>();
    for (const log of apoLogs) {
      if (log.occupation_code && !latestApo.has(log.occupation_code)) {
        latestApo.set(log.occupation_code, log.overall_apo);
      }
    }
    const uniqueApoLogs: ApoLogRow[] = Array.from(latestApo.entries()).map(([code, apo]) => ({
      occupation_code: code,
      overall_apo: apo,
    }));

    const audit = await computeBiasAudit(occupations, uniqueApoLogs);

    const { data: runRow, error: runErr } = await supabase
      .from("bias_audit_runs")
      .insert({
        occupation_count: occupations.length,
        total_high_risk: audit.results.reduce((sum, r) => sum + r.highRiskCount, 0),
        total_low_risk: audit.results.reduce((sum, r) => sum + r.lowRiskCount, 0),
        overall_impact_ratio: audit.overall.impactRatio,
        four_fifths_rule_passed: audit.overall.passed,
        flagged_categories: audit.overall.flaggedCategories,
        notes: `Bias audit computed across ${audit.results.length} category groups. High-risk threshold: APO>=70.`,
      })
      .select("id")
      .single() as { data: { id: string } | null; error: unknown };

    if (runErr || !runRow) {
      console.error("Failed to store bias audit run:", runErr);
    } else {
      if (audit.results.length > 0) {
        const rows = audit.results.map((r) => ({
          run_id: runRow.id,
          category: r.category,
          category_value: r.categoryValue,
          occupation_count: r.occupationCount,
          high_risk_count: r.highRiskCount,
          low_risk_count: r.lowRiskCount,
          high_risk_rate: r.highRiskRate,
          impact_ratio: r.impactRatio,
          four_fifths_passed: r.fourFifthsPassed,
          flagged: r.flagged,
        }));
        await supabase.from("bias_audit_results").insert(rows);
      }
    }

    return new Response(
      JSON.stringify({
        runId: runRow?.id ?? null,
        runDate: new Date().toISOString(),
        occupationCount: occupations.length,
        matchedApoCount: uniqueApoLogs.length,
        overall: audit.overall,
        results: audit.results,
        fourFifthsRule: {
          threshold: 0.80,
          passed: audit.overall.passed,
          flaggedCount: audit.overall.flaggedCategories.length,
          flaggedCategories: audit.overall.flaggedCategories,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("bias-audit error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
