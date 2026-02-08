import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { listJobZone } from "../../lib/onet.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * Browse Job Zones
 * 
 * GET /browse-job-zones
 * - List all 5 job zones
 * - Get occupations by zone
 * - Filter by zone number
 */
export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let zoneNumber = url.searchParams.get("zone") ? parseInt(url.searchParams.get("zone")!) : undefined;
    let includeOccupations = url.searchParams.get("includeOccupations") === "true";
    let limit = parseInt(url.searchParams.get("limit") || "50");

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (typeof body?.zone === "number") zoneNumber = body.zone;
        if (typeof body?.includeOccupations === "boolean") includeOccupations = body.includeOccupations;
        if (typeof body?.limit === "number") limit = body.limit;
      } catch (_) {
        // ignore body parse errors; fallback to query params
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (zoneNumber) {
      // Get specific zone with occupations
      const { data: zone } = await supabase
        .from("onet_job_zones")
        .select("*")
        .eq("zone_number", zoneNumber)
        .single();

      if (!zone) {
        return new Response(JSON.stringify({ error: "Zone not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let occupations = [] as any[];
      if (includeOccupations) {
        const { data: occData } = await supabase
          .from("onet_occupation_enrichment")
          .select("occupation_code, occupation_title, bright_outlook, career_cluster, median_wage_annual")
          .eq("job_zone", zoneNumber)
          .order("occupation_title")
          .limit(limit);

        occupations = occData || [];

        // Fallback to O*NET WS if DB returned no rows
        if ((occupations?.length || 0) === 0) {
          try {
            const fromOnet = await listJobZone(zoneNumber);
            if (fromOnet.length > 0) {
              const page = fromOnet.slice(0, limit);
              return new Response(
                JSON.stringify({
                  zone,
                  occupations: page.map((o) => ({
                    occupation_code: o.code,
                    occupation_title: o.title,
                  })),
                  occupationCount: fromOnet.length,
                  source: "onet_fallback",
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
              );
            }
          } catch (_e) {
            // swallow fallback errors; will return empty
          }
        }
      }

      return new Response(
        JSON.stringify({
          zone,
          occupations,
          occupationCount: occupations.length,
          source: "db",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all zones with occupation counts
    const { data: zones } = await supabase
      .from("onet_job_zones")
      .select("*")
      .order("zone_number");

    // Get occupation counts for each zone
    const zonesWithCounts = await Promise.all(
      (zones || []).map(async (zone) => {
        const { count } = await supabase
          .from("onet_occupation_enrichment")
          .select("*", { count: "exact", head: true })
          .eq("job_zone", zone.zone_number);

        return {
          ...zone,
          occupationCount: count || 0,
        };
      })
    );

    return new Response(
      JSON.stringify({
        zones: zonesWithCounts,
        totalZones: zonesWithCounts.length,
        source: "db",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Browse job zones error:", error);
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
