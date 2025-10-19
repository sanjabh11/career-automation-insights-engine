import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { searchOccupationsByTechnology } from "../../lib/onet.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    if (!supabaseUrl || !supabaseKey) {
      // Missing configuration — return empty but valid payload
      return new Response(
        JSON.stringify({ technologies: [], totalCount: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Case 1: Get occupations using a specific technology
    if (technology) {
      const { data: occupations, error } = await supabase
        .from("onet_technologies")
        .select("occupation_code, onet_occupation_enrichment!inner(occupation_title, bright_outlook, median_wage_annual)")
        .eq("technology_name", technology)
        .eq("is_hot_technology", true)
        .limit(limit);

      if (!error && occupations && occupations.length > 0) {
        return new Response(
          JSON.stringify({ technology, occupations, count: occupations.length, source: "db" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fallback 1: search occupation titles for technology keyword in DB
      const { data: occFallback, error: occFallbackErr } = await supabase
        .from("onet_occupation_enrichment")
        .select("occupation_code, occupation_title, bright_outlook, median_wage_annual")
        .ilike("occupation_title", `%${technology}%`)
        .order("occupation_title")
        .limit(limit);

      if (occFallback && occFallback.length > 0) {
        const mapped = occFallback.map((row: any) => ({
          occupation_code: row.occupation_code,
          onet_occupation_enrichment: {
            occupation_title: row.occupation_title,
            bright_outlook: row.bright_outlook,
            median_wage_annual: row.median_wage_annual,
          }
        }));

        return new Response(
          JSON.stringify({ technology, occupations: mapped, count: mapped.length, source: "db_fallback" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fallback 2: O*NET Web Services keyword search
      try {
        const onetOccs = await searchOccupationsByTechnology(technology);
        if (onetOccs.length > 0) {
          const onetMapped = onetOccs.slice(0, limit).map((o: any) => ({
            occupation_code: o.code,
            onet_occupation_enrichment: {
              occupation_title: o.title,
              bright_outlook: o.bright_outlook,
              median_wage_annual: null,
            }
          }));

          return new Response(
            JSON.stringify({ technology, occupations: onetMapped, count: onetMapped.length, source: "onet_fallback" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (onetErr) {
        console.error("O*NET fallback error:", onetErr);
      }

      // Final fallback: empty
      return new Response(
        JSON.stringify({ technology, occupations: [], count: 0, source: "empty" }),
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

      if (error) {
        return new Response(
          JSON.stringify({ occupationCode, technologies: [], count: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

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

    if (!error && hotTechs && hotTechs.length > 0) {
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
        JSON.stringify({ technologies: techsWithCounts, totalCount: techsWithCounts.length, source: "db" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: curated list with estimated counts via title ilike
    const curated = ["Excel","Python","Salesforce","AWS","Tableau","SQL"]; 
    const fallbackList = await Promise.all(curated.map(async (name) => {
      const { count } = await supabase
        .from("onet_occupation_enrichment")
        .select("*", { count: "exact", head: true })
        .ilike("occupation_title", `%${name}%`);
      return {
        technology_name: name,
        category: "General",
        trending_score: 50,
        related_occupations_count: count || 0,
        occupation_count: count || 0,
      };
    }));

    return new Response(
      JSON.stringify({ technologies: fallbackList, totalCount: fallbackList.length, fallback: true, source: "curated_fallback" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (_error) {
    // Any unexpected error — return empty but valid payload to avoid UI 500s
    return new Response(
      JSON.stringify({ technologies: [], totalCount: 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

if (import.meta.main) {
  serve(handler);
}
