import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Input shape: {
//   series: Array<{ soc6: string; seriesId: string }>,
//   startYear: string,
//   endYear: string,
//   region?: string
// }

async function upsertBlsRows(supabase: any, soc6: string, region: string | null, rows: Array<{ year: number; employment: number | null; wage?: number | null }>) {
  for (const r of rows) {
    const payload: any = {
      occupation_code_6: soc6,
      year: r.year,
      employment_level: r.employment ?? null,
      median_wage_annual: r.wage ?? null,
      region: region ?? null,
      data_source: 'BLS',
    };
    await supabase.from('bls_employment_data')
      .upsert(payload, { onConflict: 'occupation_code_6,year,region' });
  }
}

export async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const { series, startYear, endYear, region } = await req.json();
    if (!Array.isArray(series) || !startYear || !endYear) {
      return new Response(JSON.stringify({ error: 'Missing required fields: series[], startYear, endYear' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.3");
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const timeseriesUrl = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const registrationkey = Deno.env.get('BLS_API_KEY');

    // Batch the series into chunks of up to 20 per BLS API
    const chunkSize = 20;
    const chunks: Array<typeof series> = [];
    for (let i = 0; i < series.length; i += chunkSize) chunks.push(series.slice(i, i + chunkSize));

    let totalUpserted = 0;

    for (const chunk of chunks) {
      const seriesIds = chunk.map(s => s.seriesId);
      const body: any = { seriesid: seriesIds, startyear: startYear, endyear: endYear };
      if (registrationkey) body.registrationkey = registrationkey;

      const res = await fetch(timeseriesUrl, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const txt = await res.text();
        return new Response(JSON.stringify({ error: 'BLS API error', status: res.status, body: txt }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const data = await res.json();
      const seriesArr: Array<any> = data?.Results?.series || [];

      for (let i = 0; i < seriesArr.length; i++) {
        const s = seriesArr[i];
        const meta = chunk[i];
        if (!meta) continue;
        const soc6 = String(meta.soc6);
        const regionOrNull = region ? String(region) : null;

        // Each s.data is array of { year: '2024', period: 'M01'|'A01', value: '12345' }
        const yearsMap: Record<number, { employment: number | null }> = {};
        for (const pt of (s.data || [])) {
          const year = Number(pt.year);
          const val = Number(pt.value);
          if (!Number.isFinite(year)) continue;
          // Prefer annual (A01) values if available, else last monthly
          const isAnnual = pt.period === 'A01';
          const prev = yearsMap[year]?.employment ?? null;
          if (isAnnual || prev == null) yearsMap[year] = { employment: Number.isFinite(val) ? val : null };
        }
        const rows = Object.entries(yearsMap)
          .map(([y, v]) => ({ year: Number(y), employment: v.employment }))
          .sort((a, b) => a.year - b.year);

        await upsertBlsRows(supabase, soc6, regionOrNull, rows);
        totalUpserted += rows.length;
      }
    }

    return new Response(JSON.stringify({ ok: true, totalUpserted }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('bls-sync error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

if (import.meta.main) {
  serve(handler);
}
