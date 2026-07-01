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
  overall_apo: number | null;
  cohort: string | null;
};

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

// --- Isotonic Regression (Pool Adjacent Violators Algorithm) ---
// Fits a non-decreasing function mapping predicted -> observed
function fitIsotonic(pairs: CalibrationPair[]): { x: number[]; y: number[] } {
  if (!pairs.length) return { x: [], y: [] };
  const sorted = [...pairs].sort((a, b) => a.predicted - b.predicted);
  const xs = sorted.map(p => p.predicted);
  const ys = sorted.map(p => p.observed);

  // Pool Adjacent Violators: merge blocks where y[i] > y[i+1]
  const blocks: { x: number[]; y: number[]; sum: number }[] = [];
  for (let i = 0; i < xs.length; i++) {
    blocks.push({ x: [xs[i]], y: [ys[i]], sum: ys[i] });
    while (blocks.length >= 2) {
      const n = blocks.length;
      const prev = blocks[n - 2];
      const curr = blocks[n - 1];
      const prevMean = prev.sum / prev.y.length;
      const currMean = curr.sum / curr.y.length;
      if (prevMean > currMean) {
        // Merge
        prev.x.push(...curr.x);
        prev.y.push(...curr.y);
        prev.sum += curr.sum;
        blocks.pop();
      } else {
        break;
      }
    }
  }

  // Build isotonic mapping: for each block, all x values map to block mean
  const outX: number[] = [];
  const outY: number[] = [];
  for (const b of blocks) {
    const mean = b.sum / b.y.length;
    for (const x of b.x) {
      outX.push(x);
      outY.push(clamp01(mean));
    }
  }
  return { x: outX, y: outY };
}

// Apply isotonic mapping to a new predicted value via linear interpolation
function applyIsotonic(pred: number, iso: { x: number[]; y: number[] }): number {
  if (!iso.x.length) return pred;
  if (pred <= iso.x[0]) return iso.y[0];
  if (pred >= iso.x[iso.x.length - 1]) return iso.y[iso.y.length - 1];
  // Binary search for position
  let lo = 0, hi = iso.x.length - 1;
  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (iso.x[mid] <= pred) lo = mid; else hi = mid;
  }
  const t = (pred - iso.x[lo]) / (iso.x[hi] - iso.x[lo] || 1);
  return clamp01(iso.y[lo] + t * (iso.y[hi] - iso.y[lo]));
}

// --- Temperature Scaling ---
// Find temperature T that minimizes squared error of observed given predicted
function fitTemperature(pairs: CalibrationPair[]): number {
  if (!pairs.length) return 1.0;
  // Binary search for optimal T in [0.1, 10]
  let lo = 0.1, hi = 10.0;
  for (let iter = 0; iter < 50; iter++) {
    const mid = (lo + hi) / 2;
    const midLoss = nllLoss(pairs, mid);
    const midLo = nllLoss(pairs, Math.max(0.01, mid - 0.01));
    if (midLo < midLoss) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

function nllLoss(pairs: CalibrationPair[], T: number): number {
  // Simplified: minimize squared error of (predicted/T) vs observed
  let loss = 0;
  for (const p of pairs) {
    const scaled = clamp01(p.predicted / T);
    loss += Math.pow(p.observed - scaled, 2);
  }
  return loss / pairs.length;
}

function applyTemperature(pred: number, T: number): number {
  return clamp01(pred / T);
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

    days = Number.isFinite(days) && days > 0 ? Math.min(days, 365) : 90;
    binCount = Number.isFinite(binCount) && binCount > 0 ? Math.min(binCount, 50) : 10;

    const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    let query = supabase
      .from("apo_logs")
      .select("id, created_at, occupation_code, occupation_title, overall_apo, cohort")
      .gte("created_at", sinceIso)
      .not("overall_apo", "is", null)
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
      const predictedRaw = r.overall_apo;
      if (typeof predictedRaw !== "number") continue;
      const observedRaw = mean(expertMatches.map((expert) => Number(expert.automation_probability)));
      pairs.push({
        predicted: predictedRaw / 100,
        observed: observedRaw / 100,
        occupation_code: r.occupation_code,
        source_count: expertMatches.length,
      });
    }

    // --- Baseline ECE ---
    const { ece: baselineECE, bins } = computeECE(pairs, binCount);
    const mae = pairs.length ? mean(pairs.map((pair) => Math.abs(pair.observed - pair.predicted))) : 0;
    const rootMeanSquaredError = rmse(pairs);

    // --- Isotonic Regression Calibration ---
    const isoFit = fitIsotonic(pairs);
    const isotonicCorrected = pairs.map(p => ({
      ...p,
      corrected: applyIsotonic(p.predicted, isoFit),
    }));
    const { ece: isotonicECE } = computeECE(
      isotonicCorrected.map(p => ({ predicted: p.corrected, observed: p.observed })),
      binCount
    );

    // --- Temperature Scaling Calibration ---
    const tempT = fitTemperature(pairs);
    const tempCorrected = pairs.map(p => ({
      ...p,
      corrected: applyTemperature(p.predicted, tempT),
    }));
    const { ece: temperatureECE } = computeECE(
      tempCorrected.map(p => ({ predicted: p.corrected, observed: p.observed })),
      binCount
    );

    // Choose best calibration method
    const bestMethod = isotonicECE <= temperatureECE ? 'isotonic' : 'temperature';
    const bestECE = Math.min(isotonicECE, temperatureECE);
    const eceReductionPct = baselineECE > 0 ? Math.round(((baselineECE - bestECE) / baselineECE) * 10000) / 100 : 0;

    // Build calibration curve (isotonic mapping at sample points)
    const calibrationCurve = isoFit.x.map((x, i) => ({ predicted: x, corrected: isoFit.y[i] }));

    const { data: runIns, error: runErr } = await supabase
      .from("calibration_runs")
      .insert({
        cohort: cohort || null,
        bin_count: binCount,
        method: "apo_overall_vs_expert_assessments",
        notes: `Compared APO overall_apo to mean expert_assessments. days=${days}; expert_source=${source || "all"}; matched_pairs=${pairs.length}; expert_rows=${expertRows.length}; baseline_ece=${baselineECE.toFixed(4)}; isotonic_ece=${isotonicECE.toFixed(4)}; temperature_ece=${temperatureECE.toFixed(4)}; best_method=${bestMethod}; ece_reduction=${eceReductionPct}%; temperature_T=${tempT.toFixed(4)}`,
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
          value: baselineECE,
          sample_size: pairs.length,
          notes: `Baseline ECE; binCount=${binCount}; source=${source || "all"}`,
        },
        {
          metric_name: "apo_vs_expert_ece_isotonic",
          value: isotonicECE,
          sample_size: pairs.length,
          notes: `Isotonic regression calibrated ECE; reduction=${eceReductionPct}%`,
        },
        {
          metric_name: "apo_vs_expert_ece_temperature",
          value: temperatureECE,
          sample_size: pairs.length,
          notes: `Temperature scaling calibrated ECE; T=${tempT.toFixed(4)}`,
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
      ece: baselineECE,
      mae,
      rmse: rootMeanSquaredError,
      binsCount: bins.length,
      pairsCount: pairs.length,
      expertRowsCount: expertRows.length,
      unmatchedApoLogs: Math.max(0, (rows || []).length - pairs.length),
      source: source || "all",
      // Calibration results
      calibration: {
        baseline_ece: baselineECE,
        isotonic_ece: isotonicECE,
        temperature_ece: temperatureECE,
        best_method: bestMethod,
        best_ece: bestECE,
        ece_reduction_pct: eceReductionPct,
        temperature_T: tempT,
        calibration_curve: calibrationCurve.slice(0, 100), // cap for response size
      },
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
