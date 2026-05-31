import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ApoLogRow = {
  id: string;
  created_at: string;
  occupation_code: string;
  occupation_title: string;
  model_json: JsonValue;
  category_scores: JsonValue;
  overall_apo: number | null;
  cohort: string | null;
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type ExpertAssessmentRow = {
  occupation_code: string;
  occupation_title: string | null;
  automation_probability: number | null;
  source: string;
  assessment_year: number | null;
  methodology: string | null;
  citation: string | null;
};

type CalibrationPair = {
  predicted: number;
  observed: number;
};

type CalibrationBin = {
  bin_lower: number;
  bin_upper: number;
  predicted_avg: number;
  observed_avg: number;
  count: number;
  ece_component: number;
};

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

function getNumberProperty(value: JsonValue, key: string): number | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const maybeNumber = value[key];
  return typeof maybeNumber === "number" ? maybeNumber : null;
}

function computeECE(values: CalibrationPair[], binCount: number): { ece: number; bins: CalibrationBin[] } {
  if (!values.length) return { ece: 0, bins: [] };
  const bins = Array.from({ length: binCount }, (_, i) => ({
    lower: i / binCount,
    upper: (i + 1) / binCount,
    count: 0,
    predSum: 0,
    obsSum: 0,
  }));
  for (const v of values) {
    const p = clamp01(v.predicted);
    const o = clamp01(v.observed);
    let idx = Math.floor(p * binCount);
    if (idx === binCount) idx = binCount - 1;
    bins[idx].count += 1;
    bins[idx].predSum += p;
    bins[idx].obsSum += o;
  }
  const N = values.length;
  let ece = 0;
  const outBins = bins.map(b => {
    const c = Math.max(1, b.count);
    const predAvg = b.predSum / c;
    const obsAvg = b.obsSum / c;
    const weight = b.count / Math.max(1, N);
    const component = Math.abs(obsAvg - predAvg) * weight;
    ece += component;
    return {
      bin_lower: b.lower,
      bin_upper: b.upper,
      predicted_avg: predAvg,
      observed_avg: obsAvg,
      count: b.count,
      ece_component: component,
    };
  });
  return { ece, bins: outBins };
}

function mean(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

function rmse(values: CalibrationPair[]) {
  if (!values.length) return 0;
  return Math.sqrt(mean(values.map((v) => Math.pow(v.observed - v.predicted, 2))));
}

export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);
    let days = parseInt(url.searchParams.get("days") || "90");
    let binCount = parseInt(url.searchParams.get("binCount") || "10");
    let cohort = url.searchParams.get("cohort");
    let source = url.searchParams.get("source");

    if (req.method === "POST") {
      try {
        const body = await req.json() as Partial<{
          days: number;
          binCount: number;
          cohort: string;
          source: string;
        }>;
        if (typeof body?.days === "number") days = body.days;
        if (typeof body?.binCount === "number") binCount = body.binCount;
        if (typeof body?.cohort === "string") cohort = body.cohort;
        if (typeof body?.source === "string") source = body.source;
      } catch {
        // Ignore malformed optional POST filters and fall back to query params.
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    let query = supabase
      .from("apo_logs")
      .select("id, created_at, occupation_code, occupation_title, model_json, category_scores, overall_apo, cohort")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (cohort) query = query.eq("cohort", cohort);
    const { data: rows, error } = await query;
    if (error) throw error;

    const apoRows = (rows ?? []) as ApoLogRow[];
    const occupationCodes = Array.from(new Set(apoRows
      .map((row) => row.occupation_code)
      .filter(Boolean)));

    let expertRows: ExpertAssessmentRow[] = [];
    if (occupationCodes.length) {
      let expertQuery = supabase
        .from("expert_assessments")
        .select("occupation_code, occupation_title, automation_probability, source, assessment_year, methodology, citation")
        .in("occupation_code", occupationCodes);
      if (source) expertQuery = expertQuery.eq("source", source);
      const { data, error: expertError } = await expertQuery;
      if (expertError) throw expertError;
      expertRows = (data ?? []) as ExpertAssessmentRow[];
    }

    const expertByOccupation = new Map<string, ExpertAssessmentRow[]>();
    for (const expert of expertRows) {
      if (typeof expert.automation_probability !== "number") continue;
      const bucket = expertByOccupation.get(expert.occupation_code) || [];
      bucket.push(expert);
      expertByOccupation.set(expert.occupation_code, bucket);
    }

    const pairs: Array<CalibrationPair & { occupation_code: string; source_count: number }> = [];
    for (const r of apoRows) {
      const expertMatches = expertByOccupation.get(r.occupation_code) || [];
      if (!expertMatches.length) continue;
      const predictedRaw = typeof r.overall_apo === "number"
        ? r.overall_apo
        : getNumberProperty(r.model_json, "overall_apo");
      if (typeof predictedRaw !== "number") continue;
      const observedRaw = mean(expertMatches.map((expert) => Number(expert.automation_probability)));
      pairs.push({
        predicted: predictedRaw / 100,
        observed: observedRaw / 100,
        occupation_code: r.occupation_code,
        source_count: expertMatches.length,
      });
    }

    const { ece, bins } = computeECE(pairs, binCount);
    const mae = pairs.length ? mean(pairs.map((pair) => Math.abs(pair.observed - pair.predicted))) : 0;
    const rootMeanSquaredError = rmse(pairs);

    const { data: runIns, error: runErr } = await supabase
      .from("calibration_runs")
      .insert({
        cohort: cohort || null,
        bin_count: binCount,
        method: "apo_overall_vs_expert_assessments",
        notes: `Compared APO overall_apo to mean expert_assessments. days=${days}; expert_source=${source || "all"}; matched_pairs=${pairs.length}; expert_rows=${expertRows.length}`,
      })
      .select("id, created_at")
      .single();
    if (runErr) throw runErr;

    if (bins.length) {
      const rowsToInsert = bins.map(b => ({
        run_id: runIns.id,
        cohort: cohort || null,
        bin_lower: b.bin_lower,
        bin_upper: b.bin_upper,
        predicted_avg: b.predicted_avg,
        observed_avg: b.observed_avg,
        count: b.count,
        ece_component: b.ece_component,
      }));
      await supabase.from("calibration_results").insert(rowsToInsert);
    }

    if (pairs.length) {
      await supabase.from("validation_metrics").insert([
        {
          metric_name: "apo_vs_expert_ece",
          value: ece,
          sample_size: pairs.length,
          notes: `Expected calibration error against expert_assessments; binCount=${binCount}; source=${source || "all"}`,
        },
        {
          metric_name: "apo_vs_expert_mae",
          value: mae,
          sample_size: pairs.length,
          notes: "Mean absolute error against expert_assessments, normalized 0-1.",
        },
        {
          metric_name: "apo_vs_expert_rmse",
          value: rootMeanSquaredError,
          sample_size: pairs.length,
          notes: "Root mean squared error against expert_assessments, normalized 0-1.",
        },
      ]);
    }

    return new Response(JSON.stringify({
      runId: runIns.id,
      created_at: runIns.created_at,
      method: "apo_overall_vs_expert_assessments",
      ece,
      mae,
      rmse: rootMeanSquaredError,
      binsCount: bins.length,
      pairsCount: pairs.length,
      expertRowsCount: expertRows.length,
      unmatchedApoLogs: Math.max(0, (rows || []).length - pairs.length),
      source: source || "all",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("calibrate-ece error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

if (import.meta.main) {
  serve(handler);
}
