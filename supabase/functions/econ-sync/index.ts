import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function handler(req: Request) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const requiredKey = Deno.env.get('ECON_SYNC_API_KEY');
  if (requiredKey) {
    const provided = req.headers.get('x-api-key');
    if (provided !== requiredKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.3");
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const body = await req.json();
    const mode = String(body?.mode || 'upsert_batch');
    if (mode !== 'upsert_batch') {
      return new Response(JSON.stringify({ error: 'Unsupported mode' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const rows = Array.isArray(body?.rows) ? body.rows as Array<Record<string, any>> : null;
    if (!rows || !rows.length) {
      return new Response(JSON.stringify({ error: 'rows[] required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let upserts = 0;
    for (const r of rows) {
      const payload: Record<string, any> = {
        task_category: r.task_category ?? null,
        industry_sector: r.industry_sector ?? null,
        implementation_cost_low: toNum(r.implementation_cost_low),
        implementation_cost_high: toNum(r.implementation_cost_high),
        roi_timeline_months: toInt(r.roi_timeline_months),
        technology_maturity: toStr(r.technology_maturity),
        wef_adoption_score: toNum(r.wef_adoption_score),
        regulatory_friction: toStr(r.regulatory_friction),
        min_org_size: toInt(r.min_org_size),
        annual_labor_cost_threshold: toNum(r.annual_labor_cost_threshold),
        source: toStr(r.source),
        source_url: toStr(r.source_url),
        as_of_year: toInt(r.as_of_year),
        adoption_current_pct: toNum(r.adoption_current_pct),
        adoption_expected_pct: toNum(r.adoption_expected_pct),
        payback_months: toInt(r.payback_months),
        region: toStr(r.region),
        country: toStr(r.country),
        evidence_note: toStr(r.evidence_note),
        source_page: toStr(r.source_page),
      };
      const { error } = await supabase
        .from('automation_economics')
        .upsert(payload, { onConflict: 'task_category,industry_sector' });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      upserts++;
    }
    return new Response(JSON.stringify({ ok: true, totalUpserted: upserts }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

function toStr(v: any): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}
function toNum(v: any): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}
function toInt(v: any): number | null {
  const n = toNum(v);
  return n === null ? null : Math.trunc(n);
}

serve(handler);
