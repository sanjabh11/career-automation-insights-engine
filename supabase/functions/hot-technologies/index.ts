import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Hot Technologies
 * 
 * GET /hot-technologies - List all hot/trending technologies
 * GET /hot-technologies?technology={name} - Get occupations using a specific technology
 * GET /hot-technologies?occupationCode={code} - Get hot technologies for an occupation
 */
export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Defaults from query params
    let technology = url.searchParams.get("technology");
    let occupationCode = url.searchParams.get("occupationCode");
    let limit = parseInt(url.searchParams.get("limit") || "50");

    // Allow POST JSON body overrides
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (typeof body?.technology === 'string') technology = body.technology;
        if (typeof body?.occupationCode === 'string') occupationCode = body.occupationCode;
        if (typeof body?.limit === 'number') limit = body.limit;
      } catch (_e) {
        // ignore body parse errors; fallback to query params
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Case 1: Get occupations using a specific technology
    if (technology) {
      const { data: occupations, error } = await supabase
        .from("onet_technologies")
        .select("occupation_code, onet_occupation_enrichment!inner(occupation_title, bright_outlook, median_wage_annual)")
        .eq("technology_name", technology)
        .eq("is_hot_technology", true)
        .limit(limit);

      if (error) throw error;

      return new Response(
        JSON.stringify({
          technology,
          occupations: occupations || [],
          count: occupations?.length || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Case 2: Get hot technologies for a specific occupation
    if (occupationCode) {
      const { data: technologies, error } = await supabase
        .from("onet_technologies")
        .select("*")
        .eq("occupation_code", occupationCode)
        .eq("is_hot_technology", true)
        .order("technology_name");

      if (error) throw error;

      return new Response(
        JSON.stringify({
          occupationCode,
          technologies: technologies || [],
          count: technologies?.length || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Case 3: List all hot technologies (default)
    const { data: hotTechs, error } = await supabase
      .from("onet_hot_technologies_master")
      .select("*")
      .order("trending_score", { ascending: false, nullsLast: true })
      .order("related_occupations_count", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Get occupation counts for each technology
    const techsWithCounts = await Promise.all(
      (hotTechs || []).map(async (tech) => {
        const { count } = await supabase
          .from("onet_technologies")
          .select("*", { count: "exact", head: true })
          .eq("technology_name", tech.technology_name)
          .eq("is_hot_technology", true);

        return {
          ...tech,
          occupation_count: count || 0,
        };
      })
    );

    return new Response(
      JSON.stringify({
        technologies: techsWithCounts,
        totalCount: techsWithCounts.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("hot-technologies error:", error);
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
