export type EconRow = {
  task_category?: string | null;
  industry_sector?: string | null;
  implementation_cost_low?: number | string | null;
  implementation_cost_high?: number | string | null;
  roi_timeline_months?: number | string | null;
  technology_maturity?: string | null;
  wef_adoption_score?: number | string | null;
  regulatory_friction?: string | null;
  min_org_size?: number | string | null;
  annual_labor_cost_threshold?: number | string | null;
  source?: string | null;
  source_url?: string | null;
  as_of_year?: number | string | null;
  adoption_current_pct?: number | string | null;
  adoption_expected_pct?: number | string | null;
  payback_months?: number | string | null;
  region?: string | null;
  country?: string | null;
  evidence_note?: string | null;
  source_page?: string | null;
  [k: string]: any;
};

function getEnv(key: string): string | undefined {
  const win = typeof window !== 'undefined' ? (window as any) : {};
  const env = win.__CAIE_ENV || {};
  // @ts-ignore
  return import.meta.env[key] || env[key];
}

export async function postEconBatch(
  rows: EconRow[],
  opts: { functionUrl: string; apiKey: string }
): Promise<{ ok: boolean; totalUpserted?: number; error?: string }> {
  const isSupabaseFunctionsRest =
    /\.supabase\.co\/functions\/v1\//.test(opts.functionUrl) ||
    /\.functions\.supabase\.co\//.test(opts.functionUrl);
  const anonKey =
    getEnv('VITE_SUPABASE_ANON_KEY') ||
    getEnv('PUBLIC_SUPABASE_ANON_KEY') ||
    getEnv('SUPABASE_ANON_KEY') ||
    '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': (opts.apiKey || '').replace(/\s+/g, ''),
  };
  if (isSupabaseFunctionsRest && anonKey) {
    headers['Authorization'] = `Bearer ${anonKey}`;
    headers['apikey'] = anonKey;
  }
  const res = await fetch(opts.functionUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mode: 'upsert_batch', rows }),
  });
  if (!res.ok) {
    const txt = await res.text();
    return { ok: false, error: `HTTP ${res.status}: ${txt}` };
  }
  const json = await res.json();
  return json;
}
