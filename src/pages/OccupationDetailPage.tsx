import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";
import { formatWage } from "@/types/onet-enrichment";
import { OccupationAnalysis } from "@/components/OccupationAnalysis";

export default function OccupationDetailPage() {
  const { code } = useParams<{ code: string }>();
  const apoFunctionApiKey = import.meta.env.VITE_APO_FUNCTION_API_KEY as string | undefined;
  const [aiData, setAiData] = React.useState<any | null>(null);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);

  const { data: occupation, isLoading: loadingOcc, error: occError } = useQuery({
    queryKey: ["occupation", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onet_occupation_enrichment")
        .select(
          "occupation_code, occupation_title, bright_outlook, bright_outlook_category, job_zone, is_stem, median_wage_annual, wage_range_low, wage_range_high, outlook_category"
        )
        .eq("occupation_code", code)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!code,
  });

  React.useEffect(() => {
    (async () => {
      if (!occupation?.occupation_code || !occupation?.occupation_title) return;
      if (!apoFunctionApiKey) { setAiError("APO configuration missing"); return; }
      setAiLoading(true);
      setAiError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = { 'x-api-key': apoFunctionApiKey };
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
        const { data, error } = await supabase.functions.invoke('calculate-apo', {
          body: { occupation: { code: occupation.occupation_code, title: occupation.occupation_title } },
          headers,
        });
        if (error) throw new Error(error.message || 'APO calculation failed');
        if (data && typeof data === 'object') setAiData(data);
      } catch (e: any) {
        setAiError(e?.message || 'Failed to load AI analysis');
      } finally {
        setAiLoading(false);
      }
    })();
  }, [occupation?.occupation_code, occupation?.occupation_title, apoFunctionApiKey]);

  const { data: zoneInfo } = useQuery({
    queryKey: ["job-zone", occupation?.job_zone],
    queryFn: async () => {
      if (!occupation?.job_zone) return null;
      const { data, error } = await supabase
        .from("onet_job_zones")
        .select("zone_number, zone_name, education, experience, training")
        .eq("zone_number", occupation.job_zone)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!occupation?.job_zone,
  });

  const { data: technologies } = useQuery({
    queryKey: ["technologies", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onet_occupation_technologies")
        .select("technology_name, category, demand_score")
        .eq("occupation_code", code as string)
        .order("demand_score", { ascending: false })
        .limit(20);
      if (error) return [] as any[]; // degrade gracefully if RLS blocks
      return data || [];
    },
    enabled: !!code,
  });

  const { data: related } = useQuery({
    queryKey: ["related-occupations", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onet_related_occupations")
        .select("related_occupation_code, related_occupation_title, similarity_score")
        .eq("source_occupation_code", code as string)
        .order("similarity_score", { ascending: false })
        .limit(10);
      if (error) return [] as any[];
      return data || [];
    },
    enabled: !!code,
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
            We couldn't find details for the requested occupation code.
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
            <div className="text-xs text-red-600">{aiError}</div>
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
            {related?.map((r: any) => (
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
