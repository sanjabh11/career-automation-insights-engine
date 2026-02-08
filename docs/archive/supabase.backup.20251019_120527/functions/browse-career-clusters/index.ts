import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const requestSchema = z.object({
  clusterId: z.string().optional(),
  includeOccupations: z.boolean().optional().default(false),
  limit: z.number().min(1).max(100).optional().default(50),
});

/**
 * Browse Career Clusters
 * 
 * GET /browse-career-clusters
 * - List all 16 career clusters
 * - Get occupations by cluster
 * - Filter by cluster ID
 */
export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const clusterId = url.searchParams.get("clusterId") || undefined;
    const includeOccupations = url.searchParams.get("includeOccupations") === "true";
    const limit = parseInt(url.searchParams.get("limit") || "50");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (clusterId) {
      // Get specific cluster with occupations
      const { data: cluster } = await supabase
        .from("onet_career_clusters")
        .select("*")
        .eq("cluster_id", clusterId)
        .single();

      if (!cluster) {
        return new Response(JSON.stringify({ error: "Cluster not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let occupations = [];
      if (includeOccupations) {
        const { data: occData } = await supabase
          .from("onet_occupation_enrichment")
          .select("occupation_code, occupation_title, bright_outlook, job_zone, median_wage_annual")
          .eq("career_cluster_id", clusterId)
          .order("occupation_title")
          .limit(limit);

        occupations = occData || [];
      }

      return new Response(
        JSON.stringify({
          cluster,
          occupations,
          occupationCount: occupations.length,
          source: "db",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all clusters with occupation counts
    const { data: clusters } = await supabase
      .from("onet_career_clusters")
      .select("*")
      .order("sort_order");

    // If DB has no clusters, provide a curated fallback list
    if (!clusters || clusters.length === 0) {
      const curated = [
        { cluster_id: "it", cluster_title: "Information Technology", sort_order: 1 },
        { cluster_id: "health", cluster_title: "Health Science", sort_order: 2 },
        { cluster_id: "eng", cluster_title: "Engineering & Manufacturing", sort_order: 3 },
        { cluster_id: "finance", cluster_title: "Finance", sort_order: 4 },
        { cluster_id: "business", cluster_title: "Business Management & Admin", sort_order: 5 },
        { cluster_id: "edu", cluster_title: "Education & Training", sort_order: 6 },
        { cluster_id: "public", cluster_title: "Government & Public Admin", sort_order: 7 },
        { cluster_id: "law", cluster_title: "Law, Public Safety & Security", sort_order: 8 },
        { cluster_id: "agri", cluster_title: "Agriculture, Food & Natural Resources", sort_order: 9 },
        { cluster_id: "arts", cluster_title: "Arts, A/V Tech & Communications", sort_order: 10 },
        { cluster_id: "arch", cluster_title: "Architecture & Construction", sort_order: 11 },
        { cluster_id: "hosp", cluster_title: "Hospitality & Tourism", sort_order: 12 },
        { cluster_id: "hr", cluster_title: "Human Services", sort_order: 13 },
        { cluster_id: "trans", cluster_title: "Transportation, Distribution & Logistics", sort_order: 14 },
        { cluster_id: "mktg", cluster_title: "Marketing", sort_order: 15 },
        { cluster_id: "sci", cluster_title: "Science, Research & Innovation", sort_order: 16 },
      ];
      return new Response(
        JSON.stringify({
          clusters: curated.map(c => ({ ...c, occupationCount: 0 })),
          totalClusters: curated.length,
          source: "curated_fallback",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get occupation counts for each cluster
    const clustersWithCounts = await Promise.all(
      (clusters || []).map(async (cluster) => {
        const { count } = await supabase
          .from("onet_occupation_enrichment")
          .select("*", { count: "exact", head: true })
          .eq("career_cluster_id", cluster.cluster_id);

        return {
          ...cluster,
          occupationCount: count || 0,
        };
      })
    );

    return new Response(
      JSON.stringify({
        clusters: clustersWithCounts,
        totalClusters: clustersWithCounts.length,
        source: "db",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Browse career clusters error:", error);
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
