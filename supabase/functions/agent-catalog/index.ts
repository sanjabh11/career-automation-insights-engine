import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Agent Catalog API
 *
 * GET /agent-catalog - List all active agents
 * GET /agent-catalog?category=Document%20Processing - Filter by category
 * GET /agent-catalog?tags=legal,hr - Filter by tags
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse query parameters
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const tagsParam = url.searchParams.get("tags");
    const tags = tagsParam ? tagsParam.split(",") : null;

    // Build query
    let query = supabase
      .from("agent_registry")
      .select(`
        agent_code,
        name,
        description,
        category,
        icon,
        tags,
        input_types,
        output_types,
        avg_processing_time_seconds,
        credits_per_execution,
        monthly_executions_included,
        total_executions,
        avg_success_rate,
        avg_user_rating,
        status,
        version
      `)
      .eq("status", "active")
      .order("total_executions", { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }

    if (tags) {
      query = query.overlaps("tags", tags);
    }

    const { data: agents, error } = await query;

    if (error) {
      throw error;
    }

    // Get unique categories for filtering
    const { data: categories } = await supabase
      .from("agent_registry")
      .select("category")
      .eq("status", "active");

    const uniqueCategories = Array.from(
      new Set(categories?.map((c) => c.category) || [])
    );

    return new Response(
      JSON.stringify({
        agents: agents || [],
        filters: {
          categories: uniqueCategories,
          appliedCategory: category,
          appliedTags: tags,
        },
        total: agents?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("agent-catalog error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
