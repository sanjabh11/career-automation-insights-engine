import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
} as const;

async function fetchSkillCount(skill: string, serpApiKey: string): Promise<number | null> {
  const params = new URLSearchParams({
    engine: "google",
    q: `${skill} jobs site:indeed.com OR site:linkedin.com/jobs`,
    tbs: "qdr:m", // last month
    num: "10",
    api_key: serpApiKey,
  });
  const url = `https://serpapi.com/search.json?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) return null;
  const json = await resp.json();
  const info = json?.search_information;
  const total = Number(info?.total_results);
  if (!isFinite(total)) return null;
  // Cap to a safe integer range and approximate as postings within 30d
  return Math.min(5_000_000, Math.max(0, Math.floor(total)));
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requiredKey = Deno.env.get("SKILL_DEMAND_API_KEY");
    if (requiredKey) {
      const provided = req.headers.get("x-api-key");
      if (provided !== requiredKey) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      }
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const serpKey = Deno.env.get("SERPAPI_API_KEY");
    if (!url || !serviceKey || !serpKey) {
      return new Response(JSON.stringify({ error: "Missing required env (SUPABASE_URL, SERVICE_ROLE_KEY, SERPAPI_API_KEY)" }), { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

    const body = await req.json().catch(() => ({}));
    const skills: string[] = Array.isArray(body?.skills) ? body.skills.slice(0, 20) : [];
    const occupationCode: string | null = typeof body?.occupationCode === "string" ? body.occupationCode : null;
    if (!skills.length) {
      return new Response(JSON.stringify({ error: "Provide 'skills': string[] in body" }), { status: 400, headers: corsHeaders });
    }

    const results: Record<string, number | null> = {};
    for (const skill of skills) {
      try {
        const count = await fetchSkillCount(skill, serpKey);
        results[skill] = count;
        if (count != null) {
          const { error: upErr } = await supabase
            .from("skill_demand_signals")
            .upsert({
              skill_name: skill,
              occupation_code: occupationCode,
              posting_count_30d: count,
              data_source: "SerpAPI+NLP",
              last_updated: new Date().toISOString(),
            }, { onConflict: "skill_name,occupation_code,data_source" });
          if (upErr) {
            // non-fatal per skill
          }
        }
      } catch (_) {
        results[skill] = null;
      }
      // Gentle pacing to respect API limits
      await new Promise((r) => setTimeout(r, 200));
    }

    return new Response(JSON.stringify({ ok: true, results }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: corsHeaders });
  }
});
