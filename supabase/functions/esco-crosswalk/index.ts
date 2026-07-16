import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * ESCO Crosswalk Edge Function
 *
 * Modes:
 * - GET ?mode=lookup&socCode=15-1252 → Find ESCO occupations for an O*NET SOC code
 * - GET ?mode=reverse&escoCode=I251  → Find O*NET occupations for an ESCO code
 * - POST { mode: 'seed', occupations: [...] } → Bulk insert ESCO occupations + crosswalk mappings
 * - GET ?mode=stats → Get crosswalk statistics (total mappings, coverage)
 * - GET ?mode=search&query=software → Search ESCO occupations by label
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration" }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") || "stats";

    // --- Stats mode ---
    if (mode === "stats") {
      const { count: occCount } = await supabase
        .from("esco_occupations")
        .select("*", { count: "exact", head: true }) as { count?: number };

      const { count: mappingCount } = await supabase
        .from("esco_onet_crosswalk")
        .select("*", { count: "exact", head: true }) as { count?: number };

      const { count: skillCount } = await supabase
        .from("esco_skills")
        .select("*", { count: "exact", head: true }) as { count?: number };

      // Count unique SOC codes mapped
      const { data: uniqueSocs } = await supabase
        .from("esco_onet_crosswalk")
        .select("onet_soc_code")
        .limit(10000) as { data: { onet_soc_code: string }[] | null };

      const uniqueSocSet = new Set(uniqueSocs?.map((r) => r.onet_soc_code) || []);

      return new Response(
        JSON.stringify({
          esco_occupations: occCount ?? 0,
          crosswalk_mappings: mappingCount ?? 0,
          unique_soc_codes_mapped: uniqueSocSet.size,
          esco_skills: skillCount ?? 0,
          coverage_target: 100,
          coverage_met: uniqueSocSet.size >= 100,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Lookup mode: SOC → ESCO ---
    if (mode === "lookup") {
      const socCode = url.searchParams.get("socCode");
      if (!socCode) {
        return new Response(
          JSON.stringify({ error: "socCode parameter required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const soc6 = socCode.split("-").slice(0, 2).join("-");

      const { data: mappings, error } = await supabase
        .from("esco_onet_crosswalk")
        .select(`
          esco_code,
          onet_soc_code,
          match_type,
          match_confidence,
          validated,
          esco_occupations!inner(esco_uri, preferred_label, description, isco_group)
        `)
        .eq("onet_soc6", soc6)
        .order("match_confidence", { ascending: false }) as { data: unknown[] | null; error: unknown };

      if (error) {
        return new Response(
          JSON.stringify({ socCode, escoOccupations: [], count: 0, error: String(error) }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ socCode, escoOccupations: mappings || [], count: mappings?.length || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Reverse mode: ESCO → SOC ---
    if (mode === "reverse") {
      const escoCode = url.searchParams.get("escoCode");
      if (!escoCode) {
        return new Response(
          JSON.stringify({ error: "escoCode parameter required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { data: mappings, error } = await supabase
        .from("esco_onet_crosswalk")
        .select("onet_soc_code, onet_soc6, match_type, match_confidence, validated")
        .eq("esco_code", escoCode)
        .order("match_confidence", { ascending: false }) as { data: unknown[] | null; error: unknown };

      if (error) {
        return new Response(
          JSON.stringify({ escoCode, onetOccupations: [], count: 0, error: String(error) }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ escoCode, onetOccupations: mappings || [], count: mappings?.length || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Search mode ---
    if (mode === "search") {
      const query = url.searchParams.get("query");
      if (!query || query.length < 2) {
        return new Response(
          JSON.stringify({ error: "query parameter (min 2 chars) required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const limit = parseInt(url.searchParams.get("limit") || "20");

      const { data: results, error } = await supabase
        .from("esco_occupations")
        .select("esco_uri, esco_code, preferred_label, description, isco_group")
        .ilike("preferred_label", `%${query}%`)
        .limit(limit) as { data: unknown[] | null; error: unknown };

      if (error) {
        return new Response(
          JSON.stringify({ query, results: [], count: 0, error: String(error) }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ query, results: results || [], count: results?.length || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- Seed mode: bulk insert ---
    if (mode === "seed" && req.method === "POST") {
      const body = await req.json() as {
        occupations?: Array<{
          esco_uri: string;
          esco_code: string;
          preferred_label: string;
          alt_labels?: string[];
          description?: string;
          skill_type?: string;
          isco_group?: string;
          onet_soc_code?: string;
          onet_soc6?: string;
          match_confidence?: number;
        }>;
      };

      if (!body.occupations || !body.occupations.length) {
        return new Response(
          JSON.stringify({ error: "occupations array required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      let occInserted = 0;
      let mappingInserted = 0;

      for (const occ of body.occupations) {
        // Insert ESCO occupation
        const { error: occErr } = await supabase
          .from("esco_occupations")
          .upsert({
            esco_uri: occ.esco_uri,
            esco_code: occ.esco_code,
            preferred_label: occ.preferred_label,
            alt_labels: occ.alt_labels || null,
            description: occ.description || null,
            skill_type: occ.skill_type || null,
            isco_group: occ.isco_group || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: "esco_uri" });
        if (!occErr) occInserted++;

        // Insert crosswalk mapping if SOC code provided
        if (occ.onet_soc_code && occ.onet_soc6) {
          const { error: mapErr } = await supabase
            .from("esco_onet_crosswalk")
            .upsert({
              esco_uri: occ.esco_uri,
              esco_code: occ.esco_code,
              onet_soc_code: occ.onet_soc_code,
              onet_soc6: occ.onet_soc6,
              match_type: "automated",
              match_confidence: occ.match_confidence ?? 0.8,
              validated: false,
            }, { onConflict: "esco_code,onet_soc_code" });
          if (!mapErr) mappingInserted++;
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          occupationsInserted: occInserted,
          mappingsInserted: mappingInserted,
          total: body.occupations.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown mode: ${mode}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("esco-crosswalk error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
