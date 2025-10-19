import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONET_USERNAME = Deno.env.get("ONET_USERNAME");
const ONET_PASSWORD = Deno.env.get("ONET_PASSWORD");
const ONET_BASE_URL = "https://services.onetcenter.org/ws";

// STEM knowledge indicators with importance thresholds
const STEM_KNOWLEDGE_INDICATORS = {
  "2.C.3.a": { name: "Computers and Electronics", threshold: 60, type: "Technology", family: "Information Technology" },
  "2.C.4.a": { name: "Mathematics", threshold: 50, type: "Mathematics", family: "Mathematics & Statistics" },
  "2.C.3.b": { name: "Engineering and Technology", threshold: 50, type: "Engineering", family: "Engineering" },
  "2.C.4": { name: "Mathematics and Science", threshold: 50, type: "Mathematics", family: "Mathematics & Statistics" },
  "2.C.3": { name: "Engineering and Technology", threshold: 50, type: "Engineering", family: "Engineering" },
  "2.C.1.a": { name: "Physics", threshold: 40, type: "Science", family: "Physical Sciences" },
  "2.C.1.b": { name: "Chemistry", threshold: 40, type: "Science", family: "Physical Sciences" },
  "2.C.1.c": { name: "Biology", threshold: 40, type: "Science", family: "Life Sciences" },
};

function getAuthHeader(): string {
  if (!ONET_USERNAME || !ONET_PASSWORD) {
    throw new Error("O*NET credentials not configured");
  }
  return `Basic ${btoa(`${ONET_USERNAME}:${ONET_PASSWORD}`)}`;
}

async function fetchOnetData(path: string): Promise<any | null> {
  try {
    const response = await fetch(`${ONET_BASE_URL}/${path}`, {
      headers: {
        Authorization: getAuthHeader(),
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error(`O*NET API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${path}:`, error);
    return null;
  }
}

async function classifyOccupation(code: string, title: string) {
  const data = await fetchOnetData(`online/occupations/${code}/details/knowledge`);
  if (!data || !data.element) return null;

  const elements = Array.isArray(data.element) ? data.element : [data.element];
  
  let isStem = false;
  let stemType = "Other";
  let jobFamily = "";
  let maxImportance = 0;

  for (const elem of elements) {
    const indicator = STEM_KNOWLEDGE_INDICATORS[elem.id as keyof typeof STEM_KNOWLEDGE_INDICATORS];
    if (!indicator) continue;

    const scores = Array.isArray(elem.score) ? elem.score : (elem.score ? [elem.score] : []);
    const importance = Number(
      scores.find((s: any) => String(s.scale || '').toLowerCase().includes('importance'))?.value ?? 0
    );

    if (importance >= indicator.threshold && importance > maxImportance) {
      isStem = true;
      maxImportance = importance;
      stemType = indicator.type;
      jobFamily = indicator.family;
    }
  }

  if (!isStem) return null;

  return {
    code,
    title,
    stemType,
    jobFamily,
    confidence: maxImportance / 100,
  };
}

async function fetchCommonOccupations(): Promise<any[]> {
  return [
    { code: "15-1252.00", title: "Software Developers" },
    { code: "15-2051.00", title: "Data Scientists" },
    { code: "15-1244.00", title: "Network and Computer Systems Administrators" },
    { code: "17-2112.00", title: "Industrial Engineers" },
    { code: "17-2141.00", title: "Mechanical Engineers" },
    { code: "17-2071.00", title: "Electrical Engineers" },
    { code: "17-2051.00", title: "Civil Engineers" },
    { code: "19-1042.00", title: "Medical Scientists" },
    { code: "19-2012.00", title: "Physicists" },
    { code: "19-2041.00", title: "Environmental Scientists" },
    { code: "15-2021.00", title: "Mathematicians" },
    { code: "15-2031.00", title: "Operations Research Analysts" },
    { code: "15-2041.00", title: "Statisticians" },
    { code: "15-1211.00", title: "Computer Systems Analysts" },
    { code: "15-1299.08", title: "Computer Systems Engineers/Architects" },
  ];
}

export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting STEM membership classification...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const occupations = await fetchCommonOccupations();
    console.log(`Classifying ${occupations.length} occupations for STEM membership`);

    const stemOccupations = [];
    let processed = 0;
    let classified = 0;

    for (const occ of occupations) {
      processed++;
      console.log(`Processing ${processed}/${occupations.length}: ${occ.title}`);
      
      const classification = await classifyOccupation(occ.code, occ.title);
      if (classification) {
        stemOccupations.push(classification);
        classified++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (stemOccupations.length === 0) {
      return new Response(
        JSON.stringify({ error: "No STEM occupations classified", processed, timestamp: new Date().toISOString() }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Classified ${classified} STEM occupations`);

    const records = stemOccupations.map((occ: any) => ({
      occupation_code: occ.code,
      occupation_title: occ.title,
      stem_occupation_type: occ.stemType,
      job_family: occ.jobFamily,
      is_official_stem: false,
      data_source: "O*NET Knowledge Classification",
      classification_confidence: occ.confidence,
    }));

    const { error, count } = await supabase
      .from("onet_stem_membership")
      .upsert(records, { onConflict: "occupation_code", count: "exact" });

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: error.message, timestamp: new Date().toISOString() }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        classified,
        recordsInserted: count,
        occupations: stemOccupations.map(o => ({ code: o.code, type: o.stemType, family: o.jobFamily })),
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("sync-stem-membership error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

if (import.meta.main) serve(handler);
