// supabase/lib/SerpApiClient.ts
// Minimal SerpAPI wrapper for course search
import { z } from "https://esm.sh/zod@3.22.4";

const primarySerpKey = Deno.env.get("SERPAPI_API_KEY");
const fallbackSerpKey = Deno.env.get("SERPAPI_KEY");
const serpApiKey = primarySerpKey || fallbackSerpKey;
if (!serpApiKey) {
  console.warn("SERPAPI_API_KEY not set (fallback SERPAPI_KEY also missing) — SerpAPI-dependent functions will fail");
} else if (!primarySerpKey && fallbackSerpKey) {
  console.warn("Using SERPAPI_KEY fallback. Please set SERPAPI_API_KEY for consistency.");
}

const resultSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  snippet: z.string().optional(),
});
export type CourseResult = z.infer<typeof resultSchema>;

export async function searchCourses(query: string, limit = 5): Promise<CourseResult[]> {
  if (!serpApiKey) throw new Error("SerpAPI key missing (expected SERPAPI_API_KEY)");
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&num=${limit}&api_key=${serpApiKey}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`SerpAPI error ${resp.status}`);
  const data = await resp.json();
  const results = (data.organic_results || []).slice(0, limit).map((r: any) => ({
    title: r.title,
    link: r.link,
    snippet: r.snippet,
  }));
  return z.array(resultSchema).parse(results);
}

/**
 * Generic SerpAPI search helper.
 * Usage example (Google Jobs): serpApiSearch({ engine: 'google_jobs', q, hl: 'en', gl: 'us', num: '10' })
 */
export async function serpApiSearch(params: Record<string, string>): Promise<any> {
  if (!serpApiKey) throw new Error("SerpAPI key missing (expected SERPAPI_API_KEY)");
  const search = new URLSearchParams({ ...params, api_key: serpApiKey });
  const url = `https://serpapi.com/search.json?${search.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`SerpAPI error ${resp.status}: ${text}`);
  }
  return resp.json();
}
