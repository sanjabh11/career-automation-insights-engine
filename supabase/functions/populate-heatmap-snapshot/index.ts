import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BLSData {
  occupation_code_6: string;
  occupation_code_8: string | null;
  year: number;
  employment_level: number | null;
  projected_growth_10y: number | null;
  median_wage_annual: number | null;
  region: string;
}

interface EnrichmentData {
  occupation_code: string;
  occupation_title: string;
  career_cluster: string | null;
  career_cluster_id: string | null;
  job_zone: number | null;
  bright_outlook: boolean | null;
  bright_outlook_category: string | null;
  is_stem: boolean | null;
}

interface APOData {
  occupation_code: string;
  occupation_title: string;
  overall_apo: number;
  model: string;
  confidence: string | null;
  category_scores: any;
  created_at: string;
}

function calculateRiskBand(apo: number): string {
  if (apo < 35) return "Low";
  if (apo < 55) return "Moderate";
  if (apo < 75) return "High";
  return "Critical";
}

export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const snapshotDate = new Date().toISOString().split("T")[0];
    const currentYear = new Date().getFullYear();

    console.log(`Starting heatmap snapshot for ${snapshotDate}`);

    // Step 1: Fetch latest BLS employment data
    const { data: blsData, error: blsError } = await supabase
      .from("bls_employment_data")
      .select("*")
      .eq("region", "US")
      .order("year", { ascending: false })
      .limit(500);

    if (blsError) throw new Error(`BLS fetch error: ${blsError.message}`);
    if (!blsData || blsData.length === 0) {
      return new Response(JSON.stringify({
        error: "No BLS employment data found. Please populate bls_employment_data table first.",
        hint: "Run bls-sync function to populate employment data",
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Fetched ${blsData.length} BLS records`);

    // Step 2: Fetch O*NET enrichment data
    const { data: enrichmentData, error: enrichmentError } = await supabase
      .from("onet_occupation_enrichment")
      .select("occupation_code, occupation_title, career_cluster, career_cluster_id, job_zone, bright_outlook, bright_outlook_category, is_stem");

    if (enrichmentError) throw new Error(`Enrichment fetch error: ${enrichmentError.message}`);
    console.log(`Fetched ${enrichmentData?.length || 0} enrichment records`);

    // Create enrichment lookup map
    const enrichmentMap = new Map<string, EnrichmentData>();
    (enrichmentData || []).forEach((item: any) => {
      const code6 = item.occupation_code.substring(0, 7);
      enrichmentMap.set(code6, item);
      enrichmentMap.set(item.occupation_code, item);
    });

    // Step 3: Fetch latest APO scores
    const { data: apoData, error: apoError } = await supabase
      .from("apo_logs")
      .select("occupation_code, occupation_title, overall_apo, model, computed_items, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (apoError) console.warn(`APO fetch warning: ${apoError.message}`);
    console.log(`Fetched ${apoData?.length || 0} APO records`);

    // Create APO lookup map (latest per occupation)
    const apoMap = new Map<string, APOData>();
    (apoData || []).forEach((item: any) => {
      const code = item.occupation_code;
      if (!apoMap.has(code)) {
        apoMap.set(code, {
          occupation_code: code,
          occupation_title: item.occupation_title,
          overall_apo: item.overall_apo || 0,
          model: item.model || "unknown",
          confidence: item.computed_items?.confidence || null,
          category_scores: item.computed_items?.category_scores || {},
          created_at: item.created_at,
        });
      }
    });

    // Step 4: Process and merge data
    const marketFacts: any[] = [];
    const exposureSnapshots: any[] = [];
    const heatmapCells: any[] = [];

    const processedCodes = new Set<string>();

    for (const bls of blsData as BLSData[]) {
      const code6 = bls.occupation_code_6;
      const code8 = bls.occupation_code_8 || code6 + ".00";

      if (processedCodes.has(code6)) continue;
      processedCodes.add(code6);

      const enrichment = enrichmentMap.get(code6) || enrichmentMap.get(code8);
      const apo = apoMap.get(code8) || apoMap.get(code6);

      if (!enrichment) {
        console.warn(`No enrichment data for ${code6}`);
        continue;
      }

      const occupationTitle = enrichment.occupation_title || apo?.occupation_title || `Occupation ${code6}`;
      const apoScore = apo?.overall_apo || 0;
      const riskBand = calculateRiskBand(apoScore);
      const cellWeight = bls.employment_level || 0;

      // Insert into occupation_market_facts
      marketFacts.push({
        occupation_code_6: code6,
        occupation_code_8: code8,
        occupation_title: occupationTitle,
        region: bls.region,
        year: bls.year || currentYear,
        employment_level: bls.employment_level,
        projected_growth_10y: bls.projected_growth_10y,
        median_wage_annual: bls.median_wage_annual,
        career_cluster: enrichment.career_cluster,
        career_cluster_id: enrichment.career_cluster_id,
        job_zone: enrichment.job_zone,
        bright_outlook: enrichment.bright_outlook || false,
        bright_outlook_category: enrichment.bright_outlook_category,
        is_stem: enrichment.is_stem || false,
        data_source: "heatmap_pipeline",
        last_updated: new Date().toISOString(),
      });

      // Insert into occupation_exposure_snapshot (if APO data exists)
      if (apo) {
        exposureSnapshots.push({
          snapshot_date: snapshotDate,
          occupation_code_8: code8,
          occupation_code_6: code6,
          occupation_title: occupationTitle,
          model: apo.model,
          scoring_version: "v1",
          overall_apo: apoScore,
          confidence: apo.confidence,
          timeline: null,
          category_scores_json: apo.category_scores,
          external_signals_json: {},
        });
      }

      // Insert into occupation_heatmap_cells (serving layer)
      heatmapCells.push({
        snapshot_date: snapshotDate,
        region: bls.region,
        occupation_code_6: code6,
        occupation_code_8: code8,
        occupation_title: occupationTitle,
        career_cluster: enrichment.career_cluster,
        career_cluster_id: enrichment.career_cluster_id,
        job_zone: enrichment.job_zone,
        employment_level: bls.employment_level,
        median_wage_annual: bls.median_wage_annual,
        projected_growth_10y: bls.projected_growth_10y,
        overall_apo: apoScore,
        confidence: apo?.confidence,
        risk_band: riskBand,
        cell_weight: cellWeight,
        cell_color_score: apoScore,
        detail_slug: code8.replace(".", "-"),
        is_stem: enrichment.is_stem || false,
        bright_outlook: enrichment.bright_outlook || false,
      });
    }

    console.log(`Prepared ${marketFacts.length} market facts`);
    console.log(`Prepared ${exposureSnapshots.length} exposure snapshots`);
    console.log(`Prepared ${heatmapCells.length} heatmap cells`);

    // Step 5: Bulk insert data
    if (marketFacts.length > 0) {
      const { error: factError } = await supabase
        .from("occupation_market_facts")
        .upsert(marketFacts, { onConflict: "occupation_code_6,region,year" });
      if (factError) console.error(`Market facts insert error: ${factError.message}`);
      else console.log(`✅ Inserted ${marketFacts.length} market facts`);
    }

    if (exposureSnapshots.length > 0) {
      const { error: snapshotError } = await supabase
        .from("occupation_exposure_snapshot")
        .upsert(exposureSnapshots, { onConflict: "snapshot_date,occupation_code_8,scoring_version" });
      if (snapshotError) console.error(`Exposure snapshot insert error: ${snapshotError.message}`);
      else console.log(`✅ Inserted ${exposureSnapshots.length} exposure snapshots`);
    }

    if (heatmapCells.length > 0) {
      const { error: cellError } = await supabase
        .from("occupation_heatmap_cells")
        .upsert(heatmapCells, { onConflict: "snapshot_date,region,occupation_code_6" });
      if (cellError) console.error(`Heatmap cells insert error: ${cellError.message}`);
      else console.log(`✅ Inserted ${heatmapCells.length} heatmap cells`);
    }

    return new Response(JSON.stringify({
      success: true,
      snapshotDate,
      stats: {
        marketFacts: marketFacts.length,
        exposureSnapshots: exposureSnapshots.length,
        heatmapCells: heatmapCells.length,
      },
      message: "Heatmap snapshot created successfully",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Populate heatmap error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

if (import.meta.main) {
  serve(handler);
}
