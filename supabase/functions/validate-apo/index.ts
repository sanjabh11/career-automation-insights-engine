import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
} as const;

function pearson(x: number[], y: number[]): number | null {
  const n = Math.min(x.length, y.length);
  if (n < 3) return null;
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const vx = x[i] - mx;
    const vy = y[i] - my;
    num += vx * vy;
    dx += vx * vx;
    dy += vy * vy;
  }
  const den = Math.sqrt(dx * dy);
  if (den === 0) return null;
  return num / den;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing service env" }), { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    // Optional filter from request
    const body = await req.json().catch(() => ({}));
    const sinceDays = typeof body?.sinceDays === "number" ? Math.max(0, Math.floor(body.sinceDays)) : null;

    // Fetch expert assessments
    const { data: expertRows, error: expertErr } = await supabase
      .from("expert_assessments")
      .select("occupation_code, automation_probability")
      .not("automation_probability", "is", null);
    if (expertErr) throw expertErr;

    // Fetch APO logs (optionally filter by recency)
    let apoQuery = supabase
      .from("apo_logs")
      .select("occupation_code, overall_apo, created_at")
      .not("overall_apo", "is", null);

    if (sinceDays && sinceDays > 0) {
      const from = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
      apoQuery = apoQuery.gte("created_at", from);
    }

    const { data: apoRows, error: apoErr } = await apoQuery;
    if (apoErr) throw apoErr;

    // Aggregate APO by occupation_code
    const apoByOcc: Record<string, { sum: number; n: number }> = {};
    for (const row of apoRows || []) {
      const code = row.occupation_code as string;
      const val = Number(row.overall_apo);
      if (!isFinite(val)) continue;
      if (!apoByOcc[code]) apoByOcc[code] = { sum: 0, n: 0 };
      apoByOcc[code].sum += val;
      apoByOcc[code].n += 1;
    }

    const xs: number[] = [];
    const ys: number[] = [];
    for (const ex of expertRows || []) {
      const code = ex.occupation_code as string;
      const expertProb = Number(ex.automation_probability);
      const agg = apoByOcc[code];
      if (!agg || !isFinite(expertProb)) continue;
      const apoAvg = agg.sum / Math.max(1, agg.n);
      xs.push(expertProb);
      ys.push(apoAvg);
    }

    const r = pearson(xs, ys);
    const sampleSize = xs.length;
    const result = { metric: "apo_vs_academic_pearson_r", r, sampleSize };

    if (r != null) {
      const { error: insErr } = await supabase.from("validation_metrics").insert({
        metric_name: "apo_vs_academic_pearson_r",
        value: r,
        sample_size: sampleSize,
        notes: sinceDays ? `sinceDays=${sinceDays}` : null,
      });
      if (insErr) {
        // non-fatal
      }
    }

    return new Response(JSON.stringify(result), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: corsHeaders });
  }
});
