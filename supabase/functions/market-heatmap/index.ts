import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
} as const;

const requestSchema = z.object({
  region: z.string().optional().default("US"),
  snapshotDate: z.string().optional(),
  groupBy: z.enum(["career_cluster", "job_zone", "occupation"]).optional().default("career_cluster"),
  careerClusterId: z.string().optional(),
  jobZone: z.number().int().min(1).max(5).optional(),
  riskBand: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional().default(250),
});

type HeatmapRow = {
  snapshot_date: string;
  region: string;
  occupation_code_6: string;
  occupation_code_8: string | null;
  occupation_title: string;
  career_cluster: string | null;
  career_cluster_id: string | null;
  job_zone: number | null;
  employment_level: number | null;
  median_wage_annual: number | null;
  projected_growth_10y: number | null;
  overall_apo: number | null;
  confidence: string | null;
  risk_band: string | null;
  cell_weight: number | null;
  cell_color_score: number | null;
  detail_slug: string | null;
  is_stem: boolean | null;
  bright_outlook: boolean | null;
};

function buildCors(req: Request) {
  const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "*")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const origin = req.headers.get("origin") || "";
  const allowAll = allowedOrigins.includes("*");

  return {
    ...BASE_CORS_HEADERS,
    "Access-Control-Allow-Origin": allowAll ? "*" : (allowedOrigins.includes(origin) ? origin : "null"),
    Vary: "Origin",
  } as Record<string, string>;
}

function safeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function aggregateRows(rows: HeatmapRow[], groupBy: "career_cluster" | "job_zone" | "occupation") {
  if (groupBy === "occupation") {
    return rows.map((row) => ({
      id: row.occupation_code_6,
      label: row.occupation_title,
      group: row.career_cluster || "Unclassified",
      value: row.cell_weight ?? row.employment_level ?? 0,
      colorValue: row.cell_color_score ?? row.overall_apo ?? 0,
      occupationCode6: row.occupation_code_6,
      occupationCode8: row.occupation_code_8,
      detailSlug: row.detail_slug,
      employmentLevel: row.employment_level,
      medianWageAnnual: row.median_wage_annual,
      projectedGrowth10y: row.projected_growth_10y,
      overallApo: row.overall_apo,
      confidence: row.confidence,
      riskBand: row.risk_band,
      isStem: row.is_stem,
      brightOutlook: row.bright_outlook,
      snapshotDate: row.snapshot_date,
      region: row.region,
    }));
  }

  const groups = new Map<string, { label: string; value: number; colorAccumulator: number; colorWeight: number; occupations: number; region: string; snapshotDate: string; jobZone: number | null; careerClusterId: string | null }>();

  for (const row of rows) {
    const key = groupBy === "job_zone"
      ? `job-zone-${row.job_zone ?? 0}`
      : (row.career_cluster_id || row.career_cluster || "unclassified");

    const label = groupBy === "job_zone"
      ? `Job Zone ${row.job_zone ?? "N/A"}`
      : (row.career_cluster || "Unclassified");

    const value = safeNumber(row.cell_weight ?? row.employment_level);
    const colorValue = safeNumber(row.cell_color_score ?? row.overall_apo);
    const colorWeight = value > 0 ? value : 1;

    const current = groups.get(key) || {
      label,
      value: 0,
      colorAccumulator: 0,
      colorWeight: 0,
      occupations: 0,
      region: row.region,
      snapshotDate: row.snapshot_date,
      jobZone: row.job_zone,
      careerClusterId: row.career_cluster_id,
    };

    current.value += value;
    current.colorAccumulator += colorValue * colorWeight;
    current.colorWeight += colorWeight;
    current.occupations += 1;
    groups.set(key, current);
  }

  return Array.from(groups.entries()).map(([id, group]) => ({
    id,
    label: group.label,
    group: group.label,
    value: group.value,
    colorValue: group.colorWeight > 0 ? Number((group.colorAccumulator / group.colorWeight).toFixed(2)) : 0,
    occupationCount: group.occupations,
    region: group.region,
    snapshotDate: group.snapshotDate,
    jobZone: group.jobZone,
    careerClusterId: group.careerClusterId,
  }));
}

export async function handler(req: Request) {
  const cors = buildCors(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const url = new URL(req.url);
    const body = req.method === "POST"
      ? await req.json().catch(() => ({}))
      : {};

    const parsed = requestSchema.parse({
      region: typeof body?.region === "string" ? body.region : url.searchParams.get("region") || undefined,
      snapshotDate: typeof body?.snapshotDate === "string" ? body.snapshotDate : url.searchParams.get("snapshotDate") || undefined,
      groupBy: typeof body?.groupBy === "string" ? body.groupBy : url.searchParams.get("groupBy") || undefined,
      careerClusterId: typeof body?.careerClusterId === "string" ? body.careerClusterId : url.searchParams.get("careerClusterId") || undefined,
      jobZone: typeof body?.jobZone === "number" ? body.jobZone : (url.searchParams.get("jobZone") ? Number(url.searchParams.get("jobZone")) : undefined),
      riskBand: typeof body?.riskBand === "string" ? body.riskBand : url.searchParams.get("riskBand") || undefined,
      limit: typeof body?.limit === "number" ? body.limit : (url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined),
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let snapshotDate = parsed.snapshotDate;

    if (!snapshotDate) {
      const { data: latestSnapshot } = await supabase
        .from("occupation_heatmap_cells")
        .select("snapshot_date")
        .eq("region", parsed.region)
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      snapshotDate = latestSnapshot?.snapshot_date;
    }

    if (!snapshotDate) {
      return new Response(JSON.stringify({
        snapshotDate: null,
        region: parsed.region,
        groupBy: parsed.groupBy,
        summary: {
          totalCells: 0,
          totalEmployment: 0,
          weightedAverageApo: 0,
          occupationCount: 0,
        },
        cells: [],
        source: "db",
      }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    let query = supabase
      .from("occupation_heatmap_cells")
      .select("snapshot_date, region, occupation_code_6, occupation_code_8, occupation_title, career_cluster, career_cluster_id, job_zone, employment_level, median_wage_annual, projected_growth_10y, overall_apo, confidence, risk_band, cell_weight, cell_color_score, detail_slug, is_stem, bright_outlook")
      .eq("region", parsed.region)
      .eq("snapshot_date", snapshotDate)
      .order("cell_weight", { ascending: false, nullsFirst: false })
      .limit(parsed.limit);

    if (parsed.careerClusterId) {
      query = query.eq("career_cluster_id", parsed.careerClusterId);
    }

    if (parsed.jobZone) {
      query = query.eq("job_zone", parsed.jobZone);
    }

    if (parsed.riskBand) {
      query = query.eq("risk_band", parsed.riskBand);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const rows = (data || []) as HeatmapRow[];
    const cells = aggregateRows(rows, parsed.groupBy);

    const totalEmployment = rows.reduce((sum, row) => sum + safeNumber(row.employment_level), 0);
    const weightedApoNumerator = rows.reduce((sum, row) => {
      const weight = safeNumber(row.employment_level);
      return sum + safeNumber(row.overall_apo) * (weight > 0 ? weight : 1);
    }, 0);
    const weightedApoDenominator = rows.reduce((sum, row) => {
      const weight = safeNumber(row.employment_level);
      return sum + (weight > 0 ? weight : 1);
    }, 0);

    return new Response(JSON.stringify({
      snapshotDate,
      region: parsed.region,
      groupBy: parsed.groupBy,
      summary: {
        totalCells: cells.length,
        totalEmployment,
        weightedAverageApo: weightedApoDenominator > 0 ? Number((weightedApoNumerator / weightedApoDenominator).toFixed(2)) : 0,
        occupationCount: rows.length,
      },
      cells,
      source: "db",
    }), {
      headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
}

if (import.meta.main) {
  serve(handler);
}
