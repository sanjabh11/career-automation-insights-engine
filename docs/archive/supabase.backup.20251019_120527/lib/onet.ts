// Lightweight O*NET Web Services client for Deno Edge Functions
// Centralizes Basic Auth and JSON parsing, and exposes a few helpers.

const ONET_BASE_URL = "https://services.onetcenter.org/ws";

function getAuthHeader(): string {
  const u = Deno.env.get("ONET_USERNAME");
  const p = Deno.env.get("ONET_PASSWORD");
  if (!u || !p) throw new Error("O*NET credentials not configured");
  const basic = btoa(`${u}:${p}`);
  return `Basic ${basic}`;
}

export async function onetFetch(path: string, params: Record<string, string | number | undefined> = {}) {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  const url = `${ONET_BASE_URL}${path}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    headers: { Authorization: getAuthHeader(), Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`O*NET ${res.status}: ${body || url}`);
  }
  return await res.json();
}

export async function browseBright(category?: "Rapid Growth"|"Numerous Openings"|"New & Emerging"|"all") {
  // O*NET doesn't have a direct bright_outlook browse endpoint
  // Instead, fetch all occupations and filter by bright_outlook tag
  const data = await onetFetch("/online/occupations/", { end: 1000 });
  const items = data?.occupation || data?.occupations || [];
  const list = Array.isArray(items) ? items : [items];
  
  // Filter by bright_outlook tag
  const brightOccs = list.filter((o: any) => o.tags?.bright_outlook === true);
  
  // TODO: Category filtering would require additional API calls to get detailed outlook data
  // For now, return all bright outlook occupations
  return brightOccs
    .map((o: any) => ({ code: o.code || o.onetsoc_code, title: o.title || o.name }))
    .filter((o: any) => o.code && o.title);
}

export async function listJobZone(zone: number) {
  // Fetch all occupations and filter by job zone from detailed data
  // Note: This requires fetching occupation details which is expensive
  // Better approach: seed DB from O*NET database downloads
  const data = await onetFetch("/online/occupations/", { end: 1000 });
  const items = data?.occupation || data?.occupations || [];
  const list = Array.isArray(items) ? items : [items];
  
  // For now, return all occupations (job zone filtering requires individual occupation calls)
  // This is a temporary fallback; proper implementation needs DB seeding
  return list
    .map((o: any) => ({ code: o.code || o.onetsoc_code, title: o.title || o.name }))
    .filter((o: any) => o.code && o.title)
    .slice(0, 100); // Limit to avoid overwhelming response
}

export async function keywordSearch(keyword: string) {
  const data = await onetFetch("/mnm/search", { keyword });
  const items = data?.career || data?.occupation || [];
  const list = Array.isArray(items) ? items : [items];
  return list
    .map((o: any) => ({ code: o.code || o.onetsoc_code, title: o.title || o.name }))
    .filter((o: any) => o.code && o.title);
}

export async function browseStem() {
  // O*NET doesn't expose STEM flag in the main API
  // STEM designation comes from separate STEM membership data
  // For now, use keyword search as a proxy
  const data = await onetFetch("/mnm/search", { keyword: "science technology engineering math", end: 200 });
  const items = data?.career || data?.occupation || [];
  const list = Array.isArray(items) ? items : [items];
  return list
    .map((o: any) => ({ code: o.code || o.onetsoc_code, title: o.title || o.name }))
    .filter((o: any) => o.code && o.title)
    .slice(0, 100);
}

export async function searchOccupationsByTechnology(techKeyword: string) {
  // Search for occupations that use a specific technology
  const data = await onetFetch("/mnm/search", { keyword: techKeyword, end: 100 });
  const items = data?.career || data?.occupation || [];
  const list = Array.isArray(items) ? items : [items];
  return list
    .map((o: any) => ({ 
      code: o.code || o.onetsoc_code, 
      title: o.title || o.name,
      bright_outlook: o.tags?.bright_outlook || false
    }))
    .filter((o: any) => o.code && o.title);
}
