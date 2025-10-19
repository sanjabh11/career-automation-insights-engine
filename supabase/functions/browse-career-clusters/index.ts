import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
} as const;

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
  // Build dynamic CORS headers from allowlist
  const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = req.headers.get("origin") || "";
  const allowAll = allowedOrigins.includes("*");
  const cors = {
    ...BASE_CORS_HEADERS,
    "Access-Control-Allow-Origin": allowAll
      ? "*"
      : (allowedOrigins.includes(origin) ? origin : "null"),
    Vary: "Origin",
  } as Record<string, string>;

  if (req.method === "OPTIONS") {
    if (!allowAll && origin && !allowedOrigins.includes(origin)) {
      return new Response("CORS not allowed", { status: 403, headers: cors });
    }
    return new Response(null, { headers: cors });
  }

  try {
    const url = new URL(req.url);
    let clusterId: string | undefined = url.searchParams.get("clusterId") || undefined;
    let includeOccupations = url.searchParams.get("includeOccupations") === "true";
    let limit = parseInt(url.searchParams.get("limit") || "50");

    // Allow POST JSON body overrides
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (typeof body?.clusterId === "string") clusterId = body.clusterId;
        if (typeof body?.includeOccupations === "boolean") includeOccupations = body.includeOccupations;
        if (typeof body?.limit === "number") limit = body.limit;
      } catch (_e) {
        // Ignore JSON parse errors and continue with query params
      }
    }

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
          headers: { ...cors, "Content-Type": "application/json" },
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
          source: 'db',
        }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Get all clusters with occupation counts
    const { data: clusters } = await supabase
      .from("onet_career_clusters")
      .select("*")
      .order("sort_order");

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
        source: 'db',
      }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Browse career clusters error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  }
}

if (import.meta.main) {
  serve(handler);
}
