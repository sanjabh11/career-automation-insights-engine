import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function BrowseJobZones() {
  const navigate = useNavigate();
  const [selectedZone, setSelectedZone] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["browse-job-zones"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("browse-job-zones", {
        method: "POST",
        body: { includeOccupations: false },
      } as any);
      if (error) throw error;
      return data as { zones: any[]; totalZones: number; source?: string };
    },
    staleTime: 60_000,
  });

  const { data: zoneDetails, isLoading: zoneLoading, refetch: refetchZone } = useQuery({
    queryKey: ["browse-job-zones", selectedZone],
    queryFn: async () => {
      if (!selectedZone) return null;
      const { data, error } = await supabase.functions.invoke("browse-job-zones", {
        body: { zone: selectedZone, includeOccupations: true },
      } as any);
      if (error) throw error;
      return data as { zone: any; occupations: any[]; occupationCount: number; source?: string };
    },
    enabled: selectedZone !== null,
    staleTime: 60_000,
  });

  const zones = data?.zones || [];
  const source = data?.source || "db";
  const zsrc = (zoneDetails as any)?.source || "db";

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Job Zones</h1>
        <p className="text-sm text-muted-foreground">Occupations grouped by preparation required (1–5).</p>
      </div>

      {!selectedZone && (
        <Card className="p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isLoading ? "Loading zones..." : `${zones.length} zones`}
          </div>
          <div className="flex items-center gap-2">
            {source === "db" && (
              <span className="inline-flex items-center text-xs px-2 py-1 rounded border bg-green-50 text-green-700 border-green-300">🟢 From Database</span>
            )}
            {source && source !== "db" && (
              <span className="inline-flex items-center text-xs px-2 py-1 rounded border bg-yellow-50 text-yellow-700 border-yellow-300">🟡 {source}</span>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh</Button>
          </div>
        </Card>
      )}

      {!selectedZone && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {zones.map((z) => (
            <Card
              key={z.zone_number}
              className="p-6 space-y-2 cursor-pointer hover:shadow-md transition"
              onClick={() => setSelectedZone(Number(z.zone_number))}
              title="View occupations in this zone"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">Zone {z.zone_number}: {z.zone_name || z.title || `Preparation ${z.zone_number}`}</div>
                <Badge variant="secondary">{z.occupationCount ?? 0} occupations</Badge>
              </div>
              {z.description ? (
                <p className="text-sm text-muted-foreground">{z.description}</p>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      {selectedZone && (
        <div className="space-y-4">
          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" onClick={() => setSelectedZone(null)}>
                ← Back to all zones
              </Button>
              <div className="text-sm text-muted-foreground">
                Zone {selectedZone} • {(zoneDetails as any)?.occupationCount || 0} occupations
              </div>
            </div>
            <div className="flex items-center gap-2">
              {zsrc === "db" && (
                <span className="inline-flex items-center text-xs px-2 py-1 rounded border bg-green-50 text-green-700 border-green-300">🟢 From Database</span>
              )}
              {zsrc && zsrc !== "db" && (
                <span className="inline-flex items-center text-xs px-2 py-1 rounded border bg-yellow-50 text-yellow-700 border-yellow-300">🟡 {zsrc}</span>
              )}
              <Button variant="outline" size="sm" onClick={() => refetchZone()}>Refresh</Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(zoneDetails as any)?.occupations?.map((o: any) => (
              <Card
                key={o.occupation_code}
                className="p-4 cursor-pointer hover:shadow-md transition"
                onClick={() => navigate(`/?search=${encodeURIComponent(o.occupation_title || o.occupation_code)}`)}
                title="Open in Dashboard"
              >
                <div className="font-medium">{o.occupation_title}</div>
                <div className="text-xs text-muted-foreground font-mono mt-1">{o.occupation_code}</div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
