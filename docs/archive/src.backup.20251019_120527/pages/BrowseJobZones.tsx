import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, GraduationCap, Download } from "lucide-react";
import { motion } from "framer-motion";
import { formatWage } from "@/types/onet-enrichment";

export default function BrowseJobZones() {
  const [selectedZone, setSelectedZone] = useState<number | undefined>(undefined);
  const [limit, setLimit] = useState<number>(50);
  const [ladder, setLadder] = useState<{ z: number; occupations: any[] }[] | null>(null);

  const zonesQuery = useQuery({
    queryKey: ["job-zones", selectedZone, limit],
    queryFn: async () => {
      if (selectedZone) {
        const { data, error } = await supabase.functions.invoke("browse-job-zones", {
          body: { zone: selectedZone, includeOccupations: true, limit }
        });
        if (error) throw error;
        return data as { zone: any; occupations: any[]; occupationCount: number };
      } else {
        const { data, error } = await supabase.functions.invoke("browse-job-zones", {});
        if (error) throw error;
        return data as { zones: any[]; totalZones: number };
      }
    },
    staleTime: 60_000,
  });

  const dataSource = (zonesQuery.data as any)?.source || "db";

  // Fetch ladder when zone selected
  React.useEffect(() => {
    const run = async () => {
      if (!selectedZone) { setLadder(null); return; }
      try {
        const next1 = selectedZone + 1;
        const next2 = selectedZone + 2;
        const calls: Array<Promise<any>> = [];
        calls.push(supabase.functions.invoke("browse-job-zones", { body: { zone: selectedZone, includeOccupations: true, limit: 50 } }));
        if (next1 <= 5) calls.push(supabase.functions.invoke("browse-job-zones", { body: { zone: next1, includeOccupations: true, limit: 50 } }));
        if (next2 <= 5) calls.push(supabase.functions.invoke("browse-job-zones", { body: { zone: next2, includeOccupations: true, limit: 50 } }));
        const results = await Promise.all(calls);
        const packs = results.map((r, idx) => {
          const z = idx === 0 ? selectedZone : (selectedZone + idx);
          const occs = (r.data?.occupations || []).slice().sort((a:any,b:any)=>(b.median_wage_annual||0)-(a.median_wage_annual||0)).slice(0, 8);
          return { z, occupations: occs };
        });
        setLadder(packs);
      } catch {
        setLadder(null);
      }
    };
    run();
  }, [selectedZone]);

  const exportCSV = () => {
    try {
      if (selectedZone && (zonesQuery.data as any)?.occupations) {
        const rows = (zonesQuery.data as any).occupations.map((o: any) => ({
          occupation_code: o.occupation_code,
          occupation_title: o.occupation_title,
          bright_outlook: o.bright_outlook ? "Yes" : "No",
          median_wage_annual: o.median_wage_annual ?? "",
        }));
        const header = Object.keys(rows[0] || { occupation_code: "", occupation_title: "", bright_outlook: "", median_wage_annual: "" });
        const csv = [header.join(","), ...rows.map((r: any) => header.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `job_zone_${selectedZone}_occupations_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
      } else if (!selectedZone && (zonesQuery.data as any)?.zones) {
        const rows = (zonesQuery.data as any).zones.map((z: any) => ({
          zone_number: z.zone_number,
          zone_name: z.zone_name,
          occupationCount: z.occupationCount ?? "",
        }));
        const header = Object.keys(rows[0] || { zone_number: "", zone_name: "", occupationCount: "" });
        const csv = [header.join(","), ...rows.map((r: any) => header.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `job_zones_summary_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
      }
    } catch {}
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-purple-600" /> Job Zones Explorer
        </h1>
        <p className="text-sm text-muted-foreground">Browse occupations by O*NET Job Zone (1–5). Export lists for demos.</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {[undefined, 1, 2, 3, 4, 5].map((z) => (
            <Button
              key={String(z ?? "All")}
              size="sm"
              variant={(selectedZone ?? "All") === (z ?? "All") ? "default" : "outline"}
              onClick={() => setSelectedZone(z as number | undefined)}
            >
              {z ? `Zone ${z}` : "All"}
            </Button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Input
              type="number"
              className="w-28"
              placeholder="Limit"
              value={limit}
              onChange={(e) => setLimit(Math.max(1, Math.min(200, Number(e.target.value) || 50)))}
              aria-label="Result limit"
            />
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {zonesQuery.isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        )}

        {/* Ladder UI */}
        {selectedZone && ladder && (
          <div className="mt-6 space-y-3">
            <div className="text-sm font-medium">Ladder: Zone {selectedZone} → {Math.min(selectedZone+1,5)} → {Math.min(selectedZone+2,5)}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ladder.map((pack, idx) => (
                <Card key={idx} className="p-4">
                  <div className="text-sm font-semibold mb-2">Zone {pack.z}</div>
                  <div className="space-y-2">
                    {pack.occupations.map((o:any) => (
                      <div key={o.occupation_code} className="text-xs">
                        <div className="font-medium truncate">{o.occupation_title}</div>
                        <div className="text-muted-foreground font-mono">{o.occupation_code}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!zonesQuery.isLoading && selectedZone && (zonesQuery.data as any)?.occupations && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{(zonesQuery.data as any).occupationCount} occupations in Zone {selectedZone}</div>
              {dataSource === "onet_fallback" && (
                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">🟡 Live from O*NET API</Badge>
              )}
              {dataSource === "db" && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">🟢 From Database</Badge>
              )}
            </div>
            {(zonesQuery.data as any).occupations.map((occ: any, index: number) => (
              <motion.div key={occ.occupation_code} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{occ.occupation_title}</h4>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{occ.occupation_code}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {occ.bright_outlook && (
                        <Badge variant="secondary" className="text-xs">Bright Outlook</Badge>
                      )}
                      {occ.median_wage_annual && (
                        <Badge variant="outline" className="text-xs text-green-700">{formatWage(occ.median_wage_annual)}</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {!zonesQuery.isLoading && !selectedZone && (zonesQuery.data as any)?.zones && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{(zonesQuery.data as any).totalZones} zones</div>
              {dataSource === "db" && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">🟢 From Database</Badge>
              )}
            </div>
            {(zonesQuery.data as any).zones.map((z: any, index: number) => (
              <motion.div key={z.zone_number} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedZone(z.zone_number)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">Zone {z.zone_number}: {z.zone_name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{z.occupationCount || 0} occupations</p>
                    </div>
                    <Button size="sm" variant="outline">View</Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
