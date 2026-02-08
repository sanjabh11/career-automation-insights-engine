import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";
import { browseBright, browseStem, listJobZone, keywordSearch } from "../../lib/onet.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const requestSchema = z.object({
  keyword: z.string().optional(),
  filters: z.object({
    brightOutlook: z.boolean().optional(),
    brightOutlookCategory: z.enum(['Rapid Growth', 'Numerous Openings', 'New & Emerging']).optional(),
    stem: z.boolean().optional(),
    green: z.boolean().optional(),
    careerCluster: z.string().optional(),
    jobZone: z.number().min(1).max(5).optional(),
    minWage: z.number().optional(),
    maxWage: z.number().optional(),
  }).optional().default({}),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

// Shared O*NET helpers are imported from ../../lib/onet.ts

/**
 * Advanced Search with Filters
 * 
 * Supports:
 * - Keyword search
 * - Bright Outlook filter
 * - STEM filter
 * - Career Cluster filter
 * - Job Zone filter
 * - Wage range filter
 */
export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    const json = await req.json();
    const { keyword, filters, limit, offset } = requestSchema.parse(json);

    console.log("Advanced search:", { keyword, filters, limit, offset });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    let occupationCodes: string[] = [];

    // Step 1: Get initial occupation codes from keyword search or all occupations
    if (keyword && keyword.trim().length > 0) {
      // Search O*NET by keyword
      const onetResults = await keywordSearch(keyword.trim());
      console.log(`Found ${onetResults.length} occupations from O*NET keyword search`);
      
      if (onetResults.length === 0) {
        return new Response(
          JSON.stringify({
            occupations: [],
            total: 0,
            limit,
            offset,
            filters,
            hasMore: false,
            source: 'onet_keyword',
            requestId,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Map O*NET results to normalized format
      const normalizedOccupations = onetResults.map((occ: any) => ({
        occupation_code: occ.code || occ.onetsoc_code,
        occupation_title: occ.title,
        description: occ.description || null,
        bright_outlook: false,
        is_stem: false,
        is_green: false,
      }));

      // Try to enrich with cached data if available
      occupationCodes = normalizedOccupations.map((occ: any) => occ.occupation_code).filter(Boolean);
      
      const { data: enrichedData } = await supabase
        .from("onet_occupation_enrichment")
        .select("*")
        .in("occupation_code", occupationCodes);

      // Merge O*NET results with enrichment data
      const enrichmentMap = new Map((enrichedData || []).map(item => [item.occupation_code, item]));
      const mergedOccupations = normalizedOccupations.map((occ: any) => {
        const enriched = enrichmentMap.get(occ.occupation_code);
        return enriched || occ;
      });

      // Apply pagination
      const paginatedResults = mergedOccupations.slice(offset, offset + limit);

      return new Response(
        JSON.stringify({
          occupations: paginatedResults,
          total: mergedOccupations.length,
          limit,
          offset,
          filters,
          hasMore: mergedOccupations.length > offset + limit,
          source: 'onet_keyword+db_enrichment',
          requestId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Get all occupation codes from enrichment table
      const { data: allOccs } = await supabase
        .from("onet_occupation_enrichment")
        .select("occupation_code")
        .order("occupation_title");
      
      occupationCodes = (allOccs || []).map(occ => occ.occupation_code);
      console.log(`Using ${occupationCodes.length} cached occupations`);
    }

    if (occupationCodes.length === 0) {
      return new Response(
        JSON.stringify({
          occupations: [],
          total: 0,
          limit,
          offset,
          filters,
          hasMore: false,
          source: 'db',
          requestId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Apply filters using enrichment data
    let query = supabase
      .from("onet_occupation_enrichment")
      .select("*", { count: "exact" })
      .in("occupation_code", occupationCodes);

    // Apply filters
    if (filters.brightOutlook === true) {
      query = query.eq("bright_outlook", true);
    }

    if (filters.brightOutlookCategory) {
      query = query.eq("bright_outlook_category", filters.brightOutlookCategory);
    }

    if (filters.stem === true) {
      query = query.eq("is_stem", true);
    }

    if (filters.green === true) {
      query = query.eq("is_green", true);
    }

    if (filters.careerCluster) {
      query = query.eq("career_cluster_id", filters.careerCluster);
    }

    if (filters.jobZone) {
      query = query.eq("job_zone", filters.jobZone);
    }

    if (filters.minWage !== undefined) {
      query = query.gte("median_wage_annual", filters.minWage);
    }

    if (filters.maxWage !== undefined) {
      query = query.lte("median_wage_annual", filters.maxWage);
    }

    // Apply pagination
    query = query
      .order("occupation_title")
      .range(offset, offset + limit - 1);

    const { data: occupations, count, error } = await query;

    if (error) {
      console.error("Database query error:", error);
      throw error;
    }

    // If requesting Bright Outlook but cache has no rows, fall back to O*NET browse API
    if ((count || 0) === 0 && filters.brightOutlook === true) {
      const brightList = await browseBright(filters.brightOutlookCategory as any);
      if (brightList.length > 0) {
        const page = brightList.slice(offset, offset + limit);
        return new Response(
          JSON.stringify({
            occupations: page.map((o) => ({
              occupation_code: o.code,
              occupation_title: o.title,
              bright_outlook: true,
              bright_outlook_category: filters.brightOutlookCategory,
            })),
            total: brightList.length,
            limit,
            offset,
            filters,
            hasMore: brightList.length > offset + limit,
            source: 'onet_browse_bright',
            requestId,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // If requesting STEM but cache has no rows, fall back to O*NET STEM browse
    if ((count || 0) === 0 && filters.stem === true) {
      const stemList = await browseStem();
      if (stemList.length > 0) {
        const page = stemList.slice(offset, offset + limit);
        return new Response(
          JSON.stringify({
            occupations: page.map((o) => ({
              occupation_code: o.code,
              occupation_title: o.title,
              is_stem: true,
            })),
            total: stemList.length,
            limit,
            offset,
            filters,
            hasMore: stemList.length > offset + limit,
            source: 'onet_browse_stem',
            requestId,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // If requesting a specific Job Zone but cache has no rows, fall back to O*NET zone list
    if ((count || 0) === 0 && filters.jobZone) {
      const zoneList = await listJobZone(filters.jobZone);
      if (zoneList.length > 0) {
        const page = zoneList.slice(offset, offset + limit);
        return new Response(
          JSON.stringify({
            occupations: page.map((o) => ({
              occupation_code: o.code,
              occupation_title: o.title,
            })),
            total: zoneList.length,
            limit,
            offset,
            filters,
            hasMore: zoneList.length > offset + limit,
            source: 'onet_browse_zone',
            requestId,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Step 3: Enrich results with APO data if available
    const enrichedOccupations = await Promise.all(
      (occupations || []).map(async (occ) => {
        // Get latest APO score if available
        const { data: apoData } = await supabase
          .from("saved_analyses")
          .select("apo_score")
          .eq("occupation_code", occ.occupation_code)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...occ,
          apoScore: apoData?.apo_score,
        };
      })
    );

    return new Response(
      JSON.stringify({
        occupations: enrichedOccupations,
        total: count || 0,
        limit,
        offset,
        filters,
        hasMore: count ? count > offset + limit : false,
        source: 'db',
        requestId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Search occupations error:", error);
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
