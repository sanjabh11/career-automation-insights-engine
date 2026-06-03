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

type JsonRecord = Record<string, unknown>;
type OnetSupabaseClient = ReturnType<typeof createClient>;

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

interface EmploymentOutlookData {
  employmentCurrent?: number;
  employmentProjected?: number;
  employmentChangePercent?: number;
  jobOpeningsAnnual?: number;
  growthRate?: string;
}

interface WageData {
  medianWageAnnual?: number;
  medianWageHourly?: number;
}

interface JobZoneData {
  jobZone?: number;
  jobZoneDescription?: string;
  educationLevel?: string;
  experienceRequired?: string;
}

interface RelatedOccupation {
  code: string;
  title: string;
  similarityScore?: number;
}

interface CareerClusterData {
  careerCluster?: string;
  careerClusterId?: string;
}

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const normalized = value.replace(/[$,%]/g, "").replace(/,/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const asRecordArray = (value: unknown): JsonRecord[] => {
  if (Array.isArray(value)) return value.filter(isRecord);
  return isRecord(value) ? [value] : [];
};

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
async function fetchOnetData(path: string): Promise<JsonRecord | null> {
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

    const payload = await response.json();
    return isRecord(payload) ? payload : null;
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
  
  const bo = isRecord(data?.bright_outlook) ? data.bright_outlook : null;
  if (!bo) {
    return { bright: false };
  }

  let category: string | undefined;
  
  const categoryValue = asString(bo.category);
  const description = asString(bo.description);
  if (categoryValue) {
    category = categoryValue;
  } else if (description) {
    // Parse description for category
    if (description.includes("rapid growth")) category = "Rapid Growth";
    else if (description.includes("numerous openings")) category = "Numerous Openings";
    else if (description.includes("new and emerging")) category = "New & Emerging";
  }

  return {
    bright: true,
    category,
  };
}

/**
 * Extract Employment Outlook data
 */
async function getEmploymentOutlookData(code: string): Promise<EmploymentOutlookData> {
  const data = await fetchOnetData(`mnm/careers/${code}/outlook`);
  
  const outlook = isRecord(data?.outlook) ? data.outlook : null;
  if (!outlook) {
    return {};
  }

  return {
    employmentCurrent: asNumber(outlook.employment_current) ?? asNumber(outlook.current_employment),
    employmentProjected: asNumber(outlook.employment_projected) ?? asNumber(outlook.projected_employment),
    employmentChangePercent: asNumber(outlook.percent_change) ?? asNumber(outlook.employment_change_percent),
    jobOpeningsAnnual: asNumber(outlook.annual_openings) ?? asNumber(outlook.job_openings),
    growthRate: asString(outlook.growth) ?? asString(outlook.growth_rate) ?? asString(outlook.outlook_category),
  };
}

/**
 * Extract Wage data
 */
async function getWageData(code: string): Promise<WageData> {
  const data = await fetchOnetData(`mnm/careers/${code}/wages`);
  
  const wages = isRecord(data?.wages) ? data.wages : null;
  if (!wages) {
    return {};
  }

  return {
    medianWageAnnual: asNumber(wages.annual_median) ?? asNumber(wages.median_annual),
    medianWageHourly: asNumber(wages.hourly_median) ?? asNumber(wages.median_hourly),
  };
}

/**
 * Extract Job Zone and Education data
 */
async function getJobZoneData(code: string): Promise<JobZoneData> {
  const data = await fetchOnetData(`online/occupations/${code}/summary/job_zone`);
  
  const jz = isRecord(data?.job_zone) ? data.job_zone : null;
  if (!jz) {
    return {};
  }

  return {
    jobZone: asNumber(jz.job_zone) ?? asNumber(jz.zone),
    jobZoneDescription: asString(jz.name) ?? asString(jz.description),
    educationLevel: asString(jz.education),
    experienceRequired: asString(jz.experience),
  };
}

/**
 * Extract Related Occupations
 */
async function getRelatedOccupations(code: string): Promise<RelatedOccupation[]> {
  const data = await fetchOnetData(`online/occupations/${code}/related_occupations`);
  
  const related = asRecordArray(data?.related_occupation);

  return related.slice(0, 10).flatMap((occ, index) => {
    const occupationCode = asString(occ.code) ?? asString(occ.onetsoc_code);
    const title = asString(occ.title) ?? asString(occ.name);
    if (!occupationCode || !title) return [];

    return [{
      code: occupationCode,
      title,
      similarityScore: asNumber(occ.similarity) ?? (1.0 - index * 0.05),
    }];
  });
}

/**
 * Get Career Cluster from occupation details
 */
async function getCareerClusterData(code: string): Promise<CareerClusterData> {
  const data = await fetchOnetData(`online/occupations/${code}/career_cluster`);
  
  const cc = isRecord(data?.career_cluster) ? data.career_cluster : null;
  if (!cc) {
    return {};
  }

  return {
    careerCluster: asString(cc.title) ?? asString(cc.name),
    careerClusterId: asString(cc.code) ?? asString(cc.id),
  };
}

/**
 * Check if occupation is STEM using official O*NET membership
 */
async function checkStem(occupationCode: string, supabase: OnetSupabaseClient): Promise<boolean> {
  const { data } = await supabase
    .from("onet_stem_membership")
    .select("occupation_code")
    .eq("occupation_code", occupationCode)
    .maybeSingle();
  
  return !!data;
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
    const occupation = isRecord(basicData?.occupation) ? basicData.occupation : null;
    const title = asString(basicData?.title) ?? asString(occupation?.title) ?? "Unknown";

    // Fetch all enrichment data in parallel
    const [brightOutlook, employment, wages, jobZone, related, careerCluster] = await Promise.all([
      getBrightOutlookData(occupationCode),
      getEmploymentOutlookData(occupationCode),
      getWageData(occupationCode),
      getJobZoneData(occupationCode),
      getRelatedOccupations(occupationCode),
      getCareerClusterData(occupationCode),
    ]);

    // Check STEM membership
    const isStem = await checkStem(occupationCode, supabase);

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
      is_stem: isStem,
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
