import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Environment variables
const ONET_USERNAME = Deno.env.get("ONET_USERNAME");
const ONET_PASSWORD = Deno.env.get("ONET_PASSWORD");
const ONET_BASE_URL = "https://services.onetcenter.org/ws";

// Request schema
const requestSchema = z.object({
  occupationCode: z.string().min(1),
  forceRefresh: z.boolean().optional().default(false),
});

interface EnrichmentData {
  occupationCode: string;
  occupationTitle: string;
  brightOutlook: boolean;
  brightOutlookCategory?: string;
  employmentCurrent?: number;
  employmentProjected?: number;
  employmentChangePercent?: number;
  jobOpeningsAnnual?: number;
  growthRate?: string;
  medianWageAnnual?: number;
  medianWageHourly?: number;
  educationLevel?: string;
  experienceRequired?: string;
  careerCluster?: string;
  careerClusterId?: string;
  jobZone?: number;
  jobZoneDescription?: string;
  isStem?: boolean;
  isGreen?: boolean;
  relatedOccupations: Array<{
    code: string;
    title: string;
    similarityScore?: number;
  }>;
}

/**
 * Get Basic Auth header for O*NET API
 */
function getAuthHeader(): string {
  if (!ONET_USERNAME || !ONET_PASSWORD) {
    throw new Error("O*NET credentials not configured");
  }
  const basic = btoa(`${ONET_USERNAME}:${ONET_PASSWORD}`);
  return `Basic ${basic}`;
}

/**
 * Fetch data from O*NET API with error handling
 */
async function fetchOnetData(path: string): Promise<any> {
  const url = `${ONET_BASE_URL}/${path}`;
  console.log(`Fetching O*NET data: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: getAuthHeader(),
        Accept: "application/json",
        "User-Agent": "APO-Dashboard/1.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`O*NET API error (${response.status}):`, errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${path}:`, error);
    return null;
  }
}

/**
 * Extract Bright Outlook information
 */
async function getBrightOutlookData(code: string): Promise<{ bright: boolean; category?: string }> {
  const data = await fetchOnetData(`mnm/careers/${code}/bright_outlook`);
  
  if (!data || !data.bright_outlook) {
    return { bright: false };
  }

  const bo = data.bright_outlook;
  let category: string | undefined;
  
  if (bo.category) {
    category = bo.category;
  } else if (bo.description) {
    // Parse description for category
    if (bo.description.includes("rapid growth")) category = "Rapid Growth";
    else if (bo.description.includes("numerous openings")) category = "Numerous Openings";
    else if (bo.description.includes("new and emerging")) category = "New & Emerging";
  }

  return {
    bright: true,
    category,
  };
}

/**
 * Extract Employment Outlook data
 */
async function getEmploymentOutlookData(code: string): Promise<any> {
  const data = await fetchOnetData(`mnm/careers/${code}/outlook`);
  
  if (!data || !data.outlook) {
    return {};
  }

  const outlook = data.outlook;
  return {
    employmentCurrent: outlook.employment_current || outlook.current_employment,
    employmentProjected: outlook.employment_projected || outlook.projected_employment,
    employmentChangePercent: outlook.percent_change || outlook.employment_change_percent,
    jobOpeningsAnnual: outlook.annual_openings || outlook.job_openings,
    growthRate: outlook.growth || outlook.growth_rate || outlook.outlook_category,
  };
}

/**
 * Extract Wage data
 */
async function getWageData(code: string): Promise<any> {
  const data = await fetchOnetData(`mnm/careers/${code}/wages`);
  
  if (!data || !data.wages) {
    return {};
  }

  const wages = data.wages;
  return {
    medianWageAnnual: wages.annual_median || wages.median_annual,
    medianWageHourly: wages.hourly_median || wages.median_hourly,
  };
}

/**
 * Extract Job Zone and Education data
 */
async function getJobZoneData(code: string): Promise<any> {
  const data = await fetchOnetData(`online/occupations/${code}/summary/job_zone`);
  
  if (!data || !data.job_zone) {
    return {};
  }

  const jz = data.job_zone;
  return {
    jobZone: parseInt(jz.job_zone || jz.zone) || undefined,
    jobZoneDescription: jz.name || jz.description,
    educationLevel: jz.education,
    experienceRequired: jz.experience,
  };
}

/**
 * Extract Related Occupations
 */
async function getRelatedOccupations(code: string): Promise<Array<{ code: string; title: string; similarityScore?: number }>> {
  const data = await fetchOnetData(`online/occupations/${code}/related_occupations`);
  
  if (!data || !data.related_occupation) {
    return [];
  }

  const related = Array.isArray(data.related_occupation) 
    ? data.related_occupation 
    : [data.related_occupation];

  return related.slice(0, 10).map((occ: any, index: number) => ({
    code: occ.code || occ.onetsoc_code,
    title: occ.title || occ.name,
    similarityScore: occ.similarity ? parseFloat(occ.similarity) : (1.0 - index * 0.05),
  }));
}

/**
 * Get Career Cluster from occupation details
 */
async function getCareerClusterData(code: string): Promise<any> {
  const data = await fetchOnetData(`online/occupations/${code}/career_cluster`);
  
  if (!data || !data.career_cluster) {
    return {};
  }

  const cc = data.career_cluster;
  return {
    careerCluster: cc.title || cc.name,
    careerClusterId: cc.code || cc.id,
  };
}

/**
 * Check if occupation is STEM
 */
function checkStem(title: string, careerCluster?: string): boolean {
  const stemKeywords = ["engineer", "scientist", "developer", "programmer", "analyst", "mathematician", "statistician", "researcher"];
  const titleLower = title.toLowerCase();
  
  if (stemKeywords.some(keyword => titleLower.includes(keyword))) {
    return true;
  }
  
  if (careerCluster?.includes("Science, Technology, Engineering")) {
    return true;
  }
  
  return false;
}

/**
 * Main handler
 */
export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const json = await req.json();
    const { occupationCode, forceRefresh } = requestSchema.parse(json);

    console.log(`O*NET enrichment request for: ${occupationCode}, forceRefresh: ${forceRefresh}`);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from("onet_occupation_enrichment")
        .select("*")
        .eq("occupation_code", occupationCode)
        .gt("cache_expires_at", new Date().toISOString())
        .maybeSingle();

      if (cached) {
        console.log("Returning cached enrichment data");
        
        // Get related occupations
        const { data: relatedData } = await supabase
          .from("onet_related_occupations")
          .select("related_occupation_code, related_occupation_title, similarity_score")
          .eq("source_occupation_code", occupationCode)
          .order("sort_order", { ascending: true });

        return new Response(
          JSON.stringify({
            ...cached,
            relatedOccupations: relatedData || [],
            cached: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch fresh data from O*NET
    console.log("Fetching fresh data from O*NET...");

    // Get basic occupation info first
    const basicData = await fetchOnetData(`online/occupations/${occupationCode}`);
    const title = basicData?.title || basicData?.occupation?.title || "Unknown";

    // Fetch all enrichment data in parallel
    const [brightOutlook, employment, wages, jobZone, related, careerCluster] = await Promise.all([
      getBrightOutlookData(occupationCode),
      getEmploymentOutlookData(occupationCode),
      getWageData(occupationCode),
      getJobZoneData(occupationCode),
      getRelatedOccupations(occupationCode),
      getCareerClusterData(occupationCode),
    ]);

    // Combine all data
    const enrichmentData = {
      occupation_code: occupationCode,
      occupation_title: title,
      bright_outlook: brightOutlook.bright,
      bright_outlook_category: brightOutlook.category,
      employment_current: employment.employmentCurrent,
      employment_projected: employment.employmentProjected,
      employment_change_percent: employment.employmentChangePercent,
      job_openings_annual: employment.jobOpeningsAnnual,
      growth_rate: employment.growthRate,
      median_wage_annual: wages.medianWageAnnual,
      median_wage_hourly: wages.medianWageHourly,
      education_level: jobZone.educationLevel,
      experience_required: jobZone.experienceRequired,
      career_cluster: careerCluster.careerCluster,
      career_cluster_id: careerCluster.careerClusterId,
      job_zone: jobZone.jobZone,
      job_zone_description: jobZone.jobZoneDescription,
      is_stem: checkStem(title, careerCluster.careerCluster),
      cache_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    // Upsert enrichment data
    const { error: upsertError } = await supabase
      .from("onet_occupation_enrichment")
      .upsert(enrichmentData, { onConflict: "occupation_code" });

    if (upsertError) {
      console.error("Failed to cache enrichment data:", upsertError);
    }

    // Store related occupations
    if (related.length > 0) {
      // Delete old related occupations
      await supabase
        .from("onet_related_occupations")
        .delete()
        .eq("source_occupation_code", occupationCode);

      // Insert new ones
      const relatedInserts = related.map((rel, index) => ({
        source_occupation_code: occupationCode,
        related_occupation_code: rel.code,
        related_occupation_title: rel.title,
        similarity_score: rel.similarityScore,
        sort_order: index,
      }));

      const { error: relatedError } = await supabase
        .from("onet_related_occupations")
        .insert(relatedInserts);

      if (relatedError) {
        console.error("Failed to cache related occupations:", relatedError);
      }
    }

    // Return enriched data
    const responseData = {
      ...enrichmentData,
      relatedOccupations: related,
      cached: false,
      fetchedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("O*NET enrichment error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
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
