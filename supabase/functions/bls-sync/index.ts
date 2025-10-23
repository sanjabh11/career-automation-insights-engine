import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { parse } from "https://deno.land/std@0.203.0/csv/parse.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Input shape: {
//   mode?: 'fetch' | 'upsert' | 'fetch_oews',
//   soc6List?: string[],              // used when mode==='fetch'
//   series?: Array<{ soc6: string; seriesId: string }>, // used when mode==='upsert'
//   startYear: string,
//   endYear: string,
//   region?: string
// }

async function upsertBlsRows(
  supabase: any,
  soc6: string,
  region: string | null,
  rows: Array<{ year: number; employment: number | null; wage?: number | null }>,
  dataSource?: string
) {
  for (const r of rows) {
    const payload: any = {
      occupation_code_6: soc6,
      year: r.year,
      employment_level: r.employment ?? null,
      median_wage_annual: r.wage ?? null,
      region: region ?? null,
      data_source: dataSource ?? 'BLS',
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
    const requiredKey = Deno.env.get('BLS_SYNC_API_KEY');
    if (requiredKey) {
      const provided = req.headers.get('x-api-key');
      if (provided !== requiredKey) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    const body = await req.json();
    const mode = (body?.mode || 'upsert') as 'fetch' | 'upsert' | 'fetch_oews' | 'upsert_oews_batch';
    let { series } = body as { series?: Array<{ soc6: string; seriesId: string }>; };
    const { startYear, endYear, region } = body as { startYear?: string; endYear?: string; region?: string };

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.3");
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    if (mode === 'upsert_oews_batch') {
      const { year, rows } = body as { year?: number; rows?: Array<Record<string, any>> };
      if (!Number.isFinite(Number(year)) || !Array.isArray(rows)) {
        return new Response(JSON.stringify({ error: 'year (number) and rows (array) are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const y = Number(year);
      let upserts = 0;
      const toSoc6 = (s: string) => {
        const m = String(s || '').match(/^(\d{2}-\d{4})/);
        return m ? m[1] : String(s || '');
      };
      for (const r of rows) {
        const occ = toSoc6(r.occ_code || r.soc_code || r.soc6 || r.soc || '');
        if (!occ) continue;
        const emp = Number(r.tot_emp ?? r.employment ?? r.emp ?? null);
        const wage = Number(r.a_median ?? r.annual_median_wage ?? r.a_mean ?? r.annual_mean_wage ?? null);
        await upsertBlsRows(supabase, occ, null, [{ year: y, employment: Number.isFinite(emp) ? emp : null, wage: Number.isFinite(wage) ? wage : null }], `OEWS ${y}`);
        upserts++;
      }
      return new Response(JSON.stringify({ ok: true, totalUpserted: upserts, source: 'batch' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if ((mode === 'fetch' || mode === 'upsert' || mode === 'fetch_oews') && (!startYear || !endYear)) {
      return new Response(JSON.stringify({ error: 'Missing required fields: startYear, endYear' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (mode === 'upsert' && !Array.isArray(series)) {
      return new Response(JSON.stringify({ error: 'Missing required field: series[] for mode=upsert' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const timeseriesUrl = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const registrationkey = Deno.env.get('BLS_API_KEY');

    // If mode=fetch, build series[] from known mapping (for expert 6 SOC-6) or provided list
    if (mode === 'fetch') {
      const defaultSoc6 = ['15-1252', '29-1141', '41-2011', '43-4051', '53-3032', '11-1021'];
      const list: string[] = Array.isArray(body?.soc6List) && body.soc6List.length ? body.soc6List : defaultSoc6;
      const map: Record<string, string> = {
        '15-1252': 'OEUM000000151252',
        '29-1141': 'OEUM000000291141',
        '41-2011': 'OEUM000000412011',
        '43-4051': 'OEUM000000434051',
        '53-3032': 'OEUM000000533032',
        '11-1021': 'OEUM000000111021',
      };
      series = list.map((soc6) => ({ soc6, seriesId: map[soc6] || '' })).filter(s => s.seriesId);
      if (!series.length) {
        return new Response(JSON.stringify({ error: 'No series mapping found for provided soc6List' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // If mode=fetch_oews, download OEWS national CSVs for each year and upsert
    if (mode === 'fetch_oews') {
      const defaultSoc6 = ['15-1252', '29-1141', '41-2011', '43-4051', '53-3032', '11-1021'];
      const list: string[] = Array.isArray(body?.soc6List) && body.soc6List.length ? body.soc6List : defaultSoc6;
      const y0 = Number(startYear);
      const y1 = Number(endYear);
      if (!Number.isFinite(y0) || !Number.isFinite(y1) || y1 < y0) {
        return new Response(JSON.stringify({ error: 'Invalid year range' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const fetchHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept': 'text/csv,application/zip,application/octet-stream,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Referer': 'https://www.bls.gov/oes/tables.htm'
      };

      // Direct CSV ingestion if csvUrl + year provided (e.g., mirror or Supabase Storage)
      if (typeof body?.csvUrl === 'string' && Number.isFinite(Number(body?.year))) {
        const year = Number(body.year);
        // Allowlist check
        const allowlistRaw = (Deno.env.get('BLS_OEWS_ALLOWLIST') || '').trim();
        const allowlist: string[] = allowlistRaw ? JSON.parse(allowlistRaw) : [];
        const u = new URL(String(body.csvUrl));
        const hostOk = allowlist.length === 0 || allowlist.some((p) => u.href.startsWith(p));
        if (!hostOk) {
          return new Response(JSON.stringify({ error: 'csvUrl not allowed by BLS_OEWS_ALLOWLIST' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const rcsv = await fetch(String(body.csvUrl), { headers: fetchHeaders });
        if (!rcsv.ok) {
          return new Response(JSON.stringify({ error: 'csvUrl fetch failed', status: rcsv.status }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const csvText = await rcsv.text();
        const upserts = await processOEWSCSVText(supabase, list, csvText, year, region || null);
        return new Response(JSON.stringify({ ok: true, totalUpserted: upserts, source: 'csvUrl' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Fallback to BLS-hosted per-year files (may be blocked by 403 depending on environment)
      const { unzipSync } = await import('https://esm.sh/fflate@0.8.2');
      let totalUpserted = 0;
      for (let y = y0; y <= y1; y++) {
        const yy = String(y).slice(-2); // '2024' -> '24'
        const zipUrl = `https://www.bls.gov/oes/special-requests/oesm${yy}nat.zip`;
        const res = await fetch(zipUrl, { headers: fetchHeaders });
        if (!res.ok) {
          const csvUrl = `https://www.bls.gov/oes/special-requests/oesm${yy}nat.csv`;
          const rcsv = await fetch(csvUrl, { headers: fetchHeaders });
          if (!rcsv.ok) continue;
          const csvText = await rcsv.text();
          totalUpserted += await processOEWSCSVText(supabase, list, csvText, y, region || null);
          continue;
        }
        const zipBytes = new Uint8Array(await res.arrayBuffer());
        const files = unzipSync(zipBytes);
        const decoder = new TextDecoder();
        let found = false;
        for (const name of Object.keys(files)) {
          if (name.toLowerCase().endsWith('.csv')) {
            const csvText = decoder.decode(files[name]);
            totalUpserted += await processOEWSCSVText(supabase, list, csvText, y, region || null);
            found = true;
            break;
          }
        }
        if (!found) continue;
      }
      return new Response(JSON.stringify({ ok: true, totalUpserted, source: 'bls' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Batch the series into chunks of up to 20 per BLS API
    const chunkSize = 20;
    const chunks: Array<Array<{ soc6: string; seriesId: string }>> = [];
    for (let i = 0; i < (series as Array<{ soc6: string; seriesId: string }>).length; i += chunkSize) {
      chunks.push((series as Array<{ soc6: string; seriesId: string }>).slice(i, i + chunkSize));
    }

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

async function processOEWSCSVText(supabase: any, soc6List: string[], csvText: string, year: number, region: string | null): Promise<number> {
  const records = await parse(csvText, { skipFirstRow: false }) as string[][];
  if (!records || records.length === 0) return 0;
  const header = (records[0] || []).map((h) => String(h || '').trim().toLowerCase());
  const idx = (names: string[]) => names.map(n => header.indexOf(n)).find(i => i >= 0) ?? -1;
  const occIdx = idx(['occ_code']);
  const empIdx = idx(['tot_emp','employment']);
  const aMedIdx = idx(['a_median','annual_median_wage','a_med']);
  const aMeanIdx = idx(['a_mean','annual_mean_wage']);
  if (occIdx < 0 || empIdx < 0) return 0;
  const toNum = (s: unknown) => {
    const v = typeof s === 'string' ? s : String(s ?? '');
    if (!v) return null;
    const clean = v.replace(/[^0-9.\-]/g, '');
    const n = Number(clean);
    return Number.isFinite(n) ? n : null;
  };
  const wanted = new Set(soc6List);
  let upserts = 0;
  for (let i = 1; i < records.length; i++) {
    const cols = records[i];
    if (!cols || cols.length <= Math.max(occIdx, empIdx, aMedIdx, aMeanIdx)) continue;
    const occ = String(cols[occIdx] || '').trim();
    if (!wanted.has(occ)) continue;
    const emp = toNum(cols[empIdx]);
    const wage = aMedIdx >= 0 ? toNum(cols[aMedIdx]) : (aMeanIdx >= 0 ? toNum(cols[aMeanIdx]) : null);
    await upsertBlsRows(supabase, occ, region, [{ year, employment: emp, wage: wage ?? null }], `OEWS ${year}`);
    upserts++;
  }
  return upserts;
}

if (import.meta.main) {
  serve(handler);
}
