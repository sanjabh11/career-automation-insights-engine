import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
} as const;

const RequestSchema = z.object({
  duties: z.array(z.string().min(2)).min(1).optional(),
  query: z.string().min(2).optional(),
  limit: z.number().min(1).max(50).optional().default(20),
});

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { duties, query, limit } = RequestSchema.parse(body);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const text = (duties && duties.length ? duties.join(" ") : (query || "")).slice(0, 2000);

    const { data: taskRows, error: taskErr } = await supabase
      .from("onet_detailed_tasks")
      .select("occupation_code, task_id, task_description, importance", { count: "exact" })
      .textSearch("task_description", text, { type: "websearch", config: "english" })
      .order("importance", { ascending: false, nullsLast: true })
      .limit(500);

    const { data: actRows, error: actErr } = await supabase
      .from("onet_work_activities")
      .select("occupation_code, activity_id, activity_name, importance", { count: "exact" })
      .textSearch("activity_name", text, { type: "websearch", config: "english" })
      .order("importance", { ascending: false, nullsLast: true })
      .limit(500);

    if (taskErr) throw taskErr;
    if (actErr) throw actErr;

    const scores: Record<string, number> = {};
    for (const r of taskRows || []) {
      const w = typeof r.importance === "number" ? r.importance : 50;
      scores[r.occupation_code] = (scores[r.occupation_code] || 0) + w;
    }
    for (const r of actRows || []) {
      const w = typeof r.importance === "number" ? r.importance : 30;
      scores[r.occupation_code] = (scores[r.occupation_code] || 0) + w;
    }

    const ranked = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([occupation_code, score]) => ({ occupation_code, score }));

    const codes = ranked.map(r => r.occupation_code);
    let enrichment: any[] = [];
    if (codes.length) {
      const { data } = await supabase
        .from("onet_occupation_enrichment")
        .select("occupation_code, occupation_title, job_zone, is_stem, bright_outlook")
        .in("occupation_code", codes);
      enrichment = data || [];
    }

    const enrichMap = Object.fromEntries(enrichment.map(e => [e.occupation_code, e]));
    const results = ranked.map(r => ({
      occupation_code: r.occupation_code,
      score: r.score,
      ...enrichMap[r.occupation_code],
    }));

    return new Response(
      JSON.stringify({ mode: "fulltext", query: text, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
