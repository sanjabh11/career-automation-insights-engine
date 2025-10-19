import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  query: z.string().min(1).optional(),
  queries: z.array(z.string().min(1)).optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

/**
 * Task-Based Search
 * 
 * Search across 19,000+ occupation-specific tasks
 * Uses PostgreSQL full-text search for relevance ranking
 */
export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const json = await req.json();
    const { query, queries, limit, offset } = requestSchema.parse(json);

    console.log(`Task search: ${query ? 'single' : 'multi'} request, limit: ${limit}, offset: ${offset}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Multi-duty aggregation path
    if (queries && queries.length > 0) {
      const uniqueQueries = Array.from(new Set(queries.map((q) => q.trim()).filter(Boolean))).slice(0, 8);
      const occMap = new Map<string, any>();
      let totalTaskMatches = 0;

      for (const q of uniqueQueries) {
        const { data: tasks, error } = await supabase
          .from("onet_detailed_tasks")
          .select("*, onet_occupation_enrichment!inner(occupation_title, bright_outlook, job_zone)")
          .textSearch("task_description", q, { type: "websearch", config: "english" })
          .order("importance", { ascending: false, nullsLast: true })
          .limit(500);
        if (error) continue;
        for (const task of tasks || []) {
          totalTaskMatches += 1;
          const code = task.occupation_code as string;
          if (!occMap.has(code)) {
            occMap.set(code, {
              occupation_code: code,
              occupation_title: task.onet_occupation_enrichment?.occupation_title || "Unknown",
              bright_outlook: task.onet_occupation_enrichment?.bright_outlook || false,
              job_zone: task.onet_occupation_enrichment?.job_zone,
              matched_tasks: new Map<string, any>(),
              score: 0,
              match_count: 0,
            });
          }
          const entry = occMap.get(code)!;
          if (!entry.matched_tasks.has(task.task_id)) {
            entry.matched_tasks.set(task.task_id, {
              task_id: task.task_id,
              task_description: task.task_description,
              importance: task.importance,
              frequency: task.frequency,
              automation_category: task.automation_category,
              matched_query: q,
            });
            entry.match_count += 1;
            entry.score += (task.importance || 0) + 1; // simple score combining importance and coverage
          }
        }
      }

      const occupationsAgg = Array.from(occMap.values())
        .map((o) => ({
          ...o,
          tasks: Array.from(o.matched_tasks.values()).slice(0, 20),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(offset, offset + limit);

      return new Response(
        JSON.stringify({
          queries: uniqueQueries,
          occupations: occupationsAgg,
          totalTasks: totalTaskMatches,
          totalOccupations: occMap.size,
          limit,
          offset,
          hasMore: occMap.size > offset + limit,
          mode: "multi",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Single-query path (original)
    if (!query) {
      return new Response(JSON.stringify({ occupations: [], totalTasks: 0, totalOccupations: 0, limit, offset, hasMore: false, mode: "single" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: tasks, error, count } = await supabase
      .from("onet_detailed_tasks")
      .select("*, onet_occupation_enrichment!inner(occupation_title, bright_outlook, job_zone)", { count: "exact" })
      .textSearch("task_description", query, {
        type: "websearch",
        config: "english",
      })
      .order("importance", { ascending: false, nullsLast: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const tasksByOccupation = (tasks || []).reduce((acc: any, task: any) => {
      const code = task.occupation_code;
      if (!acc[code]) {
        acc[code] = {
          occupation_code: code,
          occupation_title: task.onet_occupation_enrichment?.occupation_title || "Unknown",
          bright_outlook: task.onet_occupation_enrichment?.bright_outlook || false,
          job_zone: task.onet_occupation_enrichment?.job_zone,
          tasks: [],
        };
      }
      acc[code].tasks.push({
        task_id: task.task_id,
        task_description: task.task_description,
        importance: task.importance,
        frequency: task.frequency,
        automation_category: task.automation_category,
      });
      return acc;
    }, {});

    const occupations = Object.values(tasksByOccupation);

    return new Response(
      JSON.stringify({
        query,
        occupations,
        totalTasks: count || 0,
        totalOccupations: occupations.length,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
        mode: "single",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("search-tasks error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

if (import.meta.main) {
  serve(handler);
}
