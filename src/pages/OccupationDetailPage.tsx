import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { formatWage } from "@/types/onet-enrichment";
import { OccupationAnalysis } from "@/components/OccupationAnalysis";
import { isTimeoutError, withTimeout } from "@/lib/asyncTimeout";

type CategoryKey = "tasks" | "knowledge" | "skills" | "abilities" | "technologies";

type AnalysisItem = {
  category?: string;
  description: string;
  apo: number;
  factors?: string[];
  timeline?: string;
};

type OccupationAiData = {
  code: string;
  title: string;
  description: string;
  overallAPO: number;
  confidence: string;
  timeline: string;
  tasks: AnalysisItem[];
  knowledge: AnalysisItem[];
  skills: AnalysisItem[];
  abilities: AnalysisItem[];
  technologies: AnalysisItem[];
  items?: AnalysisItem[];
  categoryBreakdown: Record<CategoryKey, { apo: number; confidence: string }>;
  insights: {
    primary_opportunities: string[];
    main_challenges: string[];
    automation_drivers: string[];
    barriers: string[];
  };
  metadata: {
    analysis_version: string;
    calculation_method: string;
    timestamp: string;
  };
  ci?: { lower: number; upper: number; iterations?: number };
  externalSignals?: {
    blsTrendPct?: number;
    blsAdjustmentPts?: number;
    industrySector?: string;
    sectorDelayMonths?: number;
    econViabilityDiscount?: number;
  };
};

type OccupationSummary = {
  occupation_code: string;
  occupation_title: string;
};

type TechnologyRow = {
  technology_name: string;
  category: string | null;
  demand_score: number | null;
};

type RelatedOccupationRow = {
  related_occupation_code: string;
  related_occupation_title: string;
  similarity_score: number | null;
};

type JsonRecord = Record<string, unknown>;

const CATEGORY_KEYS: CategoryKey[] = ["tasks", "knowledge", "skills", "abilities", "technologies"];
const OCCUPATION_TIMEOUT_MS = 12_000;
const SUPPORTING_QUERY_TIMEOUT_MS = 10_000;
const SESSION_TIMEOUT_MS = 5_000;
const APO_TIMEOUT_MS = 25_000;

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

function normalizeAnalysisItem(value: unknown): AnalysisItem | null {
  if (!isRecord(value)) return null;

  const description = asString(value.description);
  const apo = asNumber(value.apo);
  if (!description || apo === undefined) return null;

  const category = asString(value.category);
  const timeline = asString(value.timeline);
  const factors = asStringArray(value.factors);

  return {
    ...(category ? { category } : {}),
    description,
    apo,
    ...(factors.length > 0 ? { factors } : {}),
    ...(timeline ? { timeline } : {}),
  };
}

const normalizeAnalysisItems = (value: unknown): AnalysisItem[] =>
  Array.isArray(value)
    ? value.flatMap((item) => {
      const normalized = normalizeAnalysisItem(item);
      return normalized ? [normalized] : [];
    })
    : [];

function normalizeCategoryBreakdown(value: unknown): Record<CategoryKey, { apo: number; confidence: string }> {
  const record = isRecord(value) ? value : {};

  return CATEGORY_KEYS.reduce((acc, key) => {
    const item = record[key];
    const itemRecord = isRecord(item) ? item : {};
    acc[key] = {
      apo: asNumber(itemRecord.apo) ?? 0,
      confidence: asString(itemRecord.confidence) ?? "medium",
    };
    return acc;
  }, {} as Record<CategoryKey, { apo: number; confidence: string }>);
}

function normalizeCi(value: unknown): OccupationAiData["ci"] {
  if (!isRecord(value)) return undefined;
  const lower = asNumber(value.lower);
  const upper = asNumber(value.upper);
  if (lower === undefined || upper === undefined) return undefined;
  const iterations = asNumber(value.iterations);
  return {
    lower,
    upper,
    ...(iterations !== undefined ? { iterations } : {}),
  };
}

function normalizeExternalSignals(value: unknown): OccupationAiData["externalSignals"] {
  if (!isRecord(value)) return undefined;

  const signals: OccupationAiData["externalSignals"] = {
    ...(asNumber(value.blsTrendPct) !== undefined ? { blsTrendPct: asNumber(value.blsTrendPct) } : {}),
    ...(asNumber(value.blsAdjustmentPts) !== undefined ? { blsAdjustmentPts: asNumber(value.blsAdjustmentPts) } : {}),
    ...(asString(value.industrySector) ? { industrySector: asString(value.industrySector) } : {}),
    ...(asNumber(value.sectorDelayMonths) !== undefined ? { sectorDelayMonths: asNumber(value.sectorDelayMonths) } : {}),
    ...(asNumber(value.econViabilityDiscount) !== undefined ? { econViabilityDiscount: asNumber(value.econViabilityDiscount) } : {}),
  };

  return Object.keys(signals).length > 0 ? signals : undefined;
}

function normalizeAiData(value: unknown, fallback: OccupationSummary): OccupationAiData | null {
  if (!isRecord(value)) return null;

  const overallAPO = asNumber(value.overallAPO) ?? asNumber(value.apo_score);
  if (overallAPO === undefined) return null;

  const insightsRecord = isRecord(value.insights) ? value.insights : {};
  const metadataRecord = isRecord(value.metadata) ? value.metadata : {};
  const ci = normalizeCi(value.ci);
  const externalSignals = normalizeExternalSignals(value.externalSignals);

  return {
    code: asString(value.code) ?? fallback.occupation_code,
    title: asString(value.title) ?? fallback.occupation_title,
    description: asString(value.description) ?? "APO decision-support estimate",
    overallAPO,
    confidence: asString(value.confidence) ?? "medium",
    timeline: asString(value.timeline) ?? "2031-2035",
    tasks: normalizeAnalysisItems(value.tasks),
    knowledge: normalizeAnalysisItems(value.knowledge),
    skills: normalizeAnalysisItems(value.skills),
    abilities: normalizeAnalysisItems(value.abilities),
    technologies: normalizeAnalysisItems(value.technologies),
    items: normalizeAnalysisItems(value.items),
    categoryBreakdown: normalizeCategoryBreakdown(value.categoryBreakdown),
    insights: {
      primary_opportunities: asStringArray(insightsRecord.primary_opportunities),
      main_challenges: asStringArray(insightsRecord.main_challenges),
      automation_drivers: asStringArray(insightsRecord.automation_drivers),
      barriers: asStringArray(insightsRecord.barriers),
    },
    metadata: {
      analysis_version: asString(metadataRecord.analysis_version) ?? "unknown",
      calculation_method: asString(metadataRecord.calculation_method) ?? "calculate-apo",
      timestamp: asString(metadataRecord.timestamp) ?? new Date().toISOString(),
    },
    ...(ci ? { ci } : {}),
    ...(externalSignals ? { externalSignals } : {}),
  };
}

export default function OccupationDetailPage() {
  const { code } = useParams<{ code: string }>();
  const [aiData, setAiData] = React.useState<OccupationAiData | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);

  const { data: occupation, isLoading: loadingOcc, error: occError } = useQuery({
    queryKey: ["occupation", code],
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase
          .from("onet_occupation_enrichment")
          .select(
            "occupation_code, occupation_title, bright_outlook, bright_outlook_category, job_zone, is_stem, median_wage_annual, wage_range_low, wage_range_high, outlook_category"
          )
          .eq("occupation_code", code)
          .maybeSingle(),
        OCCUPATION_TIMEOUT_MS,
        "Occupation details lookup timed out."
      );
      if (error) throw error;
      return data;
    },
    enabled: !!code,
    retry: false,
  });

  const occupationSummary = React.useMemo<OccupationSummary | null>(() => {
    if (!occupation?.occupation_code || !occupation?.occupation_title) return null;
    return {
      occupation_code: occupation.occupation_code,
      occupation_title: occupation.occupation_title,
    };
  }, [occupation?.occupation_code, occupation?.occupation_title]);

  React.useEffect(() => {
    (async () => {
      if (!occupationSummary) return;
      setAiLoading(true);
      setAiError(null);
      try {
        let session: { access_token?: string } | null = null;
        try {
          const sessionResponse = await withTimeout(
            supabase.auth.getSession(),
            SESSION_TIMEOUT_MS,
            "Supabase session lookup timed out."
          );
          session = sessionResponse.data.session;
        } catch {
          session = null;
        }
        const headers: Record<string, string> = {};
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
        const { data, error } = await withTimeout(
          supabase.functions.invoke('calculate-apo', {
            body: { occupation: { code: occupationSummary.occupation_code, title: occupationSummary.occupation_title } },
            headers,
          }),
          APO_TIMEOUT_MS,
          "APO calculation timed out."
        );
        if (error) throw new Error(error.message || "APO calculation failed");
        const normalized = normalizeAiData(data, occupationSummary);
        if (!normalized) throw new Error("APO response missing expected analysis data");
        setAiData(normalized);
      } catch (e: unknown) {
        setAiError(
          isTimeoutError(e)
            ? "APO decision-support estimate is temporarily unavailable because calculate-apo did not respond within 25 seconds. The occupation facts below remain available."
            : e instanceof Error ? e.message : "Failed to load AI analysis"
        );
      } finally {
        setAiLoading(false);
      }
    })();
  }, [occupationSummary]);

  const { data: zoneInfo } = useQuery({
    queryKey: ["job-zone", occupation?.job_zone],
    queryFn: async () => {
      if (!occupation?.job_zone) return null;
      const { data, error } = await withTimeout(
        supabase
          .from("onet_job_zones")
          .select("zone_number, zone_name, education, experience, training")
          .eq("zone_number", occupation.job_zone)
          .maybeSingle(),
        SUPPORTING_QUERY_TIMEOUT_MS,
        "Job-zone details lookup timed out."
      );
      if (error) throw error;
      return data;
    },
    enabled: !!occupation?.job_zone,
    retry: false,
  });

  const { data: technologies } = useQuery({
    queryKey: ["technologies", code],
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase
          .from("onet_occupation_technologies")
          .select("technology_name, category, demand_score")
          .eq("occupation_code", code as string)
          .order("demand_score", { ascending: false })
          .limit(20),
        SUPPORTING_QUERY_TIMEOUT_MS,
        "Technology lookup timed out."
      );
      if (error) return [] as TechnologyRow[]; // degrade gracefully if RLS blocks
      return (data || []) as TechnologyRow[];
    },
    enabled: !!code,
    retry: false,
  });

  const { data: related } = useQuery({
    queryKey: ["related-occupations", code],
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase
          .from("onet_related_occupations")
          .select("related_occupation_code, related_occupation_title, similarity_score")
          .eq("source_occupation_code", code as string)
          .order("similarity_score", { ascending: false })
          .limit(10),
        SUPPORTING_QUERY_TIMEOUT_MS,
        "Related occupations lookup timed out."
      );
      if (error) return [] as RelatedOccupationRow[];
      return (data || []) as RelatedOccupationRow[];
    },
    enabled: !!code,
    retry: false,
  });

  if (loadingOcc) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading occupation...
        </div>
      </div>
    );
  }

  if (occError || !occupation) {
    const occupationErrorMessage = isTimeoutError(occError)
      ? "Occupation details did not respond within 12 seconds. The data service may be unavailable; try again after Supabase project health is restored."
      : "We couldn't find details for the requested occupation code.";

    return (
      <div className="container mx-auto p-4 md:p-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Occupation Not Found</h1>
            <Button asChild variant="outline" size="sm">
              <Link to="/browse/bright-outlook">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Bright Outlook
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {occupationErrorMessage}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{occupation.occupation_title}</h1>
          <p className="text-sm text-muted-foreground font-mono">{occupation.occupation_code}</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/browse/bright-outlook">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Link>
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {occupation.bright_outlook && (
            <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
              Bright Outlook{occupation.bright_outlook_category ? `: ${occupation.bright_outlook_category}` : ""}
            </Badge>
          )}
          {occupation.is_stem && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" /> STEM
            </Badge>
          )}
          {occupation.job_zone && (
            <Badge variant="outline" className="text-xs">Zone {occupation.job_zone}</Badge>
          )}
          {occupation.median_wage_annual && (
            <Badge variant="outline" className="text-xs text-green-700">{formatWage(occupation.median_wage_annual)}</Badge>
          )}
        </div>

        <div className="mt-4">
          {aiLoading && (
            <div className="flex items-center text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading AI analysis…</div>
          )}
          {aiError && (
            <Alert variant="destructive">
              <AlertDescription>{aiError}</AlertDescription>
            </Alert>
          )}
          {aiData && (
            <div className="mt-4">
              <OccupationAnalysis 
                occupation={aiData}
                overallAPO={aiData.overallAPO}
                onAddToSelected={() => {}}
                isAlreadySelected={false}
              />
            </div>
          )}
        </div>

        {zoneInfo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Job Zone</div>
              <div className="font-semibold">{zoneInfo.zone_name} (Zone {zoneInfo.zone_number})</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Education</div>
              <div className="text-sm">{zoneInfo.education || "N/A"}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Experience & Training</div>
              <div className="text-sm">{zoneInfo.experience || "N/A"}{zoneInfo.training ? ` • ${zoneInfo.training}` : ""}</div>
            </Card>
          </div>
        )}

        {(occupation.wage_range_low || occupation.wage_range_high) && (
          <div className="text-sm text-muted-foreground">
            Typical range: {occupation.wage_range_low ? formatWage(occupation.wage_range_low) : "N/A"} – {occupation.wage_range_high ? formatWage(occupation.wage_range_high) : "N/A"}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Top Technologies</h3>
          {(!technologies || technologies.length === 0) && (
            <div className="text-sm text-muted-foreground">No technologies found or not available.</div>
          )}
          <div className="space-y-2">
            {technologies?.map((t) => (
              <div key={t.technology_name} className="flex items-center justify-between text-sm p-2 rounded border">
                <div>
                  <div className="font-medium">{t.technology_name}</div>
                  <div className="text-xs text-muted-foreground">{t.category}</div>
                </div>
                {typeof t.demand_score === "number" && (
                  <Badge variant="outline" className="text-xs">{Math.round(t.demand_score)}</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Related Occupations</h3>
          {(!related || related.length === 0) && (
            <div className="text-sm text-muted-foreground">No related occupations found.</div>
          )}
          <div className="space-y-2">
            {related?.map((r) => (
              <Link key={r.related_occupation_code} to={`/occupation/${r.related_occupation_code}`} className="block p-2 rounded border hover:bg-muted">
                <div className="font-medium text-sm">{r.related_occupation_title}</div>
                <div className="text-xs text-muted-foreground font-mono">{r.related_occupation_code}</div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
