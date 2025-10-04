import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  query: z.string().min(1),
  category: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

/**
 * Work Activities Search
 * 
 * Search across 2,000+ generalized work activities
 * Filter by category: Information Input, Mental Processes, Work Output, Interacting with Others
 */
export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const json = await req.json();
    const { query, category, limit, offset } = requestSchema.parse(json);

    console.log(`Activity search: "${query}", category: ${category || "all"}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
    let queryBuilder = supabase
      .from("onet_work_activities")
      .select("*, onet_occupation_enrichment!inner(occupation_title, bright_outlook, career_cluster)", { count: "exact" })
      .textSearch("activity_name", query, {
        type: "websearch",
        config: "english",
      });

    // Apply category filter
    if (category) {
      queryBuilder = queryBuilder.eq("category", category);
    }

    const { data: activities, error, count } = await queryBuilder
      .order("importance", { ascending: false, nullsLast: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Group activities by occupation
    const activitiesByOccupation = (activities || []).reduce((acc: any, activity: any) => {
      const code = activity.occupation_code;
      if (!acc[code]) {
        acc[code] = {
          occupation_code: code,
          occupation_title: activity.onet_occupation_enrichment?.occupation_title || "Unknown",
          bright_outlook: activity.onet_occupation_enrichment?.bright_outlook || false,
          career_cluster: activity.onet_occupation_enrichment?.career_cluster,
          activities: [],
        };
      }
      acc[code].activities.push({
        activity_id: activity.activity_id,
        activity_name: activity.activity_name,
        activity_description: activity.activity_description,
        level: activity.level,
        importance: activity.importance,
        category: activity.category,
      });
      return acc;
    }, {});

    const occupations = Object.values(activitiesByOccupation);

    return new Response(
      JSON.stringify({
        query,
        category: category || "all",
        occupations,
        totalActivities: count || 0,
        totalOccupations: occupations.length,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("search-activities error:", error);
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
