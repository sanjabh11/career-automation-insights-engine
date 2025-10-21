import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Route, TrendingUp } from "lucide-react";

export default function JobZoneLaddersPage() {
  const { data: zones, isLoading: zonesLoading } = useQuery({
    queryKey: ["v_job_zone_ladders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_job_zone_ladders")
        .select("job_zone, zone_name, education, experience, training, occupation_count, sample_occupations, transitions_available")
        .order("job_zone");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: transitions, isLoading: transLoading } = useQuery({
    queryKey: ["job_zone_transitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_zone_transitions")
        .select("from_zone, to_zone, typical_duration_months, cost_estimate_usd, prerequisites, recommended_certifications, sample_path, success_rate_pct")
        .order("from_zone")
        .order("to_zone");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: ladders, isLoading: laddersLoading } = useQuery({
    queryKey: ["job_zone_ladder_examples"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_zone_ladder_examples")
        .select("ladder_name, from_zone, to_zone, occupation_path, total_time_months, total_cost_usd, roi_description")
        .order("ladder_name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Route className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Career Ladders & Job Zones</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Explore job zones (1–5), typical education/training, and recommended transition paths.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between text-xs">
          <div className="font-semibold">Overview</div>
          <Badge variant="secondary">🟢 From Database</Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zonesLoading ? (
          <div className="col-span-full flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading zones...
          </div>
        ) : (
          zones?.map((z: any) => (
            <Card key={z.job_zone} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Job Zone {z.job_zone}</div>
                  <div className="font-semibold">{z.zone_name}</div>
                </div>
                <Badge variant="outline" className="text-xs">{z.occupation_count} occupations</Badge>
              </div>
              <div className="text-sm">
                <div className="mb-2"><span className="text-xs text-muted-foreground">Education:</span> {z.education || 'N/A'}</div>
                <div className="mb-2"><span className="text-xs text-muted-foreground">Experience:</span> {z.experience || 'N/A'}</div>
                <div className="mb-2"><span className="text-xs text-muted-foreground">Training:</span> {z.training || 'N/A'}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                Transitions Available: <span className="font-medium text-gray-900">{z.transitions_available}</span>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" /> Recommended Transitions
          </h3>
          {transLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading transitions...
            </div>
          )}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {transitions?.map((t: any, i: number) => (
              <div key={`${t.from_zone}-${t.to_zone}-${i}`} className="p-3 rounded border">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">Zone {t.from_zone} → {t.to_zone}</div>
                  {typeof t.success_rate_pct === 'number' && (
                    <Badge variant="outline" className="text-xs">{t.success_rate_pct}% success</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t.typical_duration_months ? `${t.typical_duration_months} months` : 'Duration N/A'} • {t.cost_estimate_usd ? `$${t.cost_estimate_usd.toLocaleString()}` : 'Cost N/A'}
                </div>
                {t.sample_path && (
                  <div className="text-xs mt-2">{t.sample_path}</div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Example Ladders</h3>
          {laddersLoading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading ladders...
            </div>
          )}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {ladders?.map((l: any, i: number) => (
              <div key={`${l.ladder_name}-${i}`} className="p-3 rounded border">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{l.ladder_name}</div>
                  <Badge variant="outline" className="text-xs">Zone {l.from_zone} → {l.to_zone}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {l.total_time_months ? `${l.total_time_months} months` : 'Duration N/A'} • {l.total_cost_usd ? `$${l.total_cost_usd.toLocaleString()}` : 'Cost N/A'}
                </div>
                {l.roi_description && (
                  <div className="text-xs mt-2">{l.roi_description}</div>
                )}
                {Array.isArray(l.occupation_path) && l.occupation_path.length > 0 && (
                  <div className="text-xs mt-2">
                    Path: {l.occupation_path.join(' → ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
