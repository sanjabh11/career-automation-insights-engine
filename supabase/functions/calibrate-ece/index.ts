import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ApoLogRow = {
  id: string;
  created_at: string;
  model_json: any;
  category_scores: any;
  overall_apo: number | null;
  cohort: string | null;
};

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

function computeECE(values: Array<{ predicted: number; observed: number }>, binCount: number) {
  if (!values.length) return { ece: 0, bins: [] as any[] };
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

export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const url = new URL(req.url);
    let days = parseInt(url.searchParams.get("days") || "90");
    let binCount = parseInt(url.searchParams.get("binCount") || "10");
    let cohort = url.searchParams.get("cohort");

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (typeof body?.days === "number") days = body.days;
        if (typeof body?.binCount === "number") binCount = body.binCount;
        if (typeof body?.cohort === "string") cohort = body.cohort;
      } catch (_) {}
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    let query = supabase
      .from("apo_logs")
      .select("id, created_at, model_json, category_scores, overall_apo, cohort")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (cohort) query = (query as any).eq("cohort", cohort);
    const { data: rows, error } = await query as any;
    if (error) throw error;

    // Build predicted vs observed pairs
    const pairs: Array<{ predicted: number; observed: number }> = [];
    for (const r of (rows as ApoLogRow[] || [])) {
      const predictedRaw: number | undefined = r.model_json?.overall_apo ?? undefined;
      const observedRaw: number | null = r.overall_apo ?? null;
      if (typeof predictedRaw === "number" && typeof observedRaw === "number") {
        pairs.push({ predicted: predictedRaw / 100, observed: observedRaw / 100 });
        continue;
      }
      // Fallback: derive predicted from model_json.category_apos weighted equally
      const caps = r.model_json?.category_apos || {};
      const values: number[] = [];
      for (const k of ["tasks","knowledge","skills","abilities","technologies"]) {
        if (typeof caps?.[k]?.apo === "number") values.push(caps[k].apo);
      }
      if (values.length && typeof observedRaw === "number") {
        const avg = values.reduce((a,b)=>a+b,0) / values.length;
        pairs.push({ predicted: avg / 100, observed: observedRaw / 100 });
      }
    }

    const { ece, bins } = computeECE(pairs, binCount);

    // Persist run & results
    const { data: runIns, error: runErr } = await supabase
      .from("calibration_runs")
      .insert({ cohort: cohort || null, bin_count: binCount, method: "overall_apo_vs_deterministic" })
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
      await supabase.from("calibration_results").insert(rowsToInsert as any);
    }

    return new Response(JSON.stringify({ runId: runIns.id, created_at: runIns.created_at, ece, binsCount: bins.length, pairsCount: pairs.length }), {
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
