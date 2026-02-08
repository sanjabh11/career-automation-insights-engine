import React from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function AdminParityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-parity"],
    queryFn: async () => {
      const [all, bright, stem, zone1, zone2, zone3, zone4, zone5] = await Promise.all([
        supabase.from("onet_occupation_enrichment").select("occupation_code", { count: "exact", head: true }),
        supabase.from("onet_occupation_enrichment").select("occupation_code", { count: "exact", head: true }).eq("bright_outlook", true),
        supabase.from("onet_occupation_enrichment").select("occupation_code", { count: "exact", head: true }).eq("is_stem", true),
        supabase.from("onet_occupation_enrichment").select("occupation_code", { count: "exact", head: true }).eq("job_zone", 1),
        supabase.from("onet_occupation_enrichment").select("occupation_code", { count: "exact", head: true }).eq("job_zone", 2),
        supabase.from("onet_occupation_enrichment").select("occupation_code", { count: "exact", head: true }).eq("job_zone", 3),
        supabase.from("onet_occupation_enrichment").select("occupation_code", { count: "exact", head: true }).eq("job_zone", 4),
        supabase.from("onet_occupation_enrichment").select("occupation_code", { count: "exact", head: true }).eq("job_zone", 5),
      ]);
      return {
        all: all.count || 0,
        bright: bright.count || 0,
        stem: stem.count || 0,
        zones: [zone1.count||0, zone2.count||0, zone3.count||0, zone4.count||0, zone5.count||0],
      };
    },
    staleTime: 60_000,
  });

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admin: Parity Checker</h1>
        <p className="text-sm text-muted-foreground">Quick counts from `onet_occupation_enrichment` to gauge coverage and parity.</p>
      </div>

      <Card className="p-6">
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 border rounded-lg">
              <div className="font-semibold">All Occupations</div>
              <div className="text-2xl">{data?.all ?? 0}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="font-semibold">Bright Outlook</div>
              <div className="text-2xl">{data?.bright ?? 0}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="font-semibold">STEM</div>
              <div className="text-2xl">{data?.stem ?? 0}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="font-semibold">Job Zones</div>
              <div className="text-xs text-muted-foreground">[1,2,3,4,5]</div>
              <div className="text-2xl">{(data?.zones || []).join(" / ")}</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
