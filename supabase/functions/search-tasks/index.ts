import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  query: z.string().min(1),
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
    const { query, limit, offset } = requestSchema.parse(json);

    console.log(`Task search: "${query}", limit: ${limit}, offset: ${offset}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Full-text search on task descriptions
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

    // Group tasks by occupation
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
