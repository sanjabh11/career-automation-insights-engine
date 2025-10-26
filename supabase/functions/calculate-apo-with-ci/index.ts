import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, x-api-key, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function clamp100(v: number) { return Math.max(0, Math.min(100, v)); }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const requiredKey = Deno.env.get("APO_FUNCTION_API_KEY");
    if (requiredKey) {
      const provided = req.headers.get("x-api-key");
      if (provided !== requiredKey) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const occupation = body?.occupation;
    if (!occupation?.code || !occupation?.title) {
      return new Response(JSON.stringify({ error: "Provide occupation: { code, title }" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const requestUrl = new URL(req.url);
    const host = requestUrl.hostname;
    let projectRef = host;
    if (host.endsWith('.functions.supabase.co')) {
      projectRef = host.replace('.functions.supabase.co', '');
    } else if (host.endsWith('.supabase.co')) {
      projectRef = host.replace('.supabase.co', '');
    }
    const projectBase = Deno.env.get('SUPABASE_URL')
      || `https://${projectRef}.supabase.co`;
    const functionsBase = `https://${projectRef}.functions.supabase.co`;

    const svc = req.headers.get("Authorization") || "";
    const apikey = req.headers.get("apikey") || svc.replace(/^Bearer\s+/i, "");
    const apoKey = requiredKey || req.headers.get("x-api-key") || "";

    const baselineUrl = `${functionsBase}/calculate-apo`;

    let resp = await fetch(baselineUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": svc,
        "apikey": apikey,
        "x-api-key": apoKey,
      },
      body: JSON.stringify({ occupation }),
    });

    let base: any = {};
    try {
      base = await resp.json();
    } catch (_) {
      base = {};
    }
    if (!resp.ok) {
      const message = typeof base?.error === 'string' && base.error
        ? base.error
        : `calculate-apo proxy failed (status ${resp.status})`;
      return new Response(JSON.stringify({ error: message }), { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const analysis = base?.analysis || base;
    let enhanced: any = analysis;
    if (!(analysis?.ci?.lower != null && analysis?.ci?.upper != null)) {
      // Compute lightweight CI around overallAPO
      const overall = Number(analysis?.overallAPO ?? 0);
      const N = Number(Deno.env.get("APO_CI_ITERATIONS") ?? 200);
      const std = 0.05; // 5% variability
      function randn() {
        let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      }
      const sims: number[] = [];
      for (let i = 0; i < N; i++) sims.push(clamp100(overall * (1 + randn() * std)));
      sims.sort((a,b)=>a-b);
      const q = (p: number) => sims[Math.max(0, Math.min(sims.length - 1, Math.floor(p * (sims.length - 1))))];
      enhanced = { ...analysis, ci: { lower: Math.round(q(0.05) * 100) / 100, upper: Math.round(q(0.95) * 100) / 100, iterations: sims.length } } as any;
    }

    // Telemetry fallback: attempt to log minimal row if possible
    try {
      const rawUrl = new URL(req.url);
      const host = rawUrl.hostname;
      const derivedBaseUrl = host.endsWith('.functions.supabase.co')
        ? `https://${host.replace('.functions.supabase.co', '.supabase.co')}`
        : `${rawUrl.protocol}//${host}`;
      const headerApiKey = req.headers.get('apikey') || (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('PROJECT_URL') || derivedBaseUrl;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || headerApiKey || '';
      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
        const payload: Record<string, any> = {
          occupation_code: enhanced.code || occupation.code,
          occupation_title: enhanced.title || occupation.title,
          overall_apo: enhanced.overallAPO,
          ci_lower: enhanced?.ci?.lower ?? null,
          ci_upper: enhanced?.ci?.upper ?? null,
          ci_iterations: enhanced?.ci?.iterations ?? null,
          bls_trend_pct: enhanced?.externalSignals?.blsTrendPct ?? null,
          bls_adjustment_pts: enhanced?.externalSignals?.blsAdjustmentPts ?? null,
          industry_sector: enhanced?.externalSignals?.industrySector ?? null,
          sector_delay_months: enhanced?.externalSignals?.sectorDelayMonths ?? null,
          econ_viability_discount: enhanced?.externalSignals?.econViabilityDiscount ?? null,
          calculation_method: 'ci-wrapper-fallback',
          schema_valid: true,
          validated_output: enhanced,
          model: 'ci-wrapper',
          model_version: 'v1'
        };
        await supabase.from('apo_logs').insert(payload);
      }
    } catch (telemetryErr) {
      console.warn('ci-wrapper telemetry fallback failed:', telemetryErr);
    }

    return new Response(JSON.stringify(enhanced), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
