import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Building2, Layers } from "lucide-react";
import { motion } from "framer-motion";

export default function IndustryDashboardPage() {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  const clustersQuery = useQuery({
    queryKey: ["career-clusters", selectedCluster],
    queryFn: async () => {
      if (!selectedCluster) {
        const { data, error } = await supabase.functions.invoke("browse-career-clusters", {});
        if (error) throw error;
        return data as { clusters: any[] };
      } else {
        const { data, error } = await supabase.functions.invoke("browse-career-clusters", {
          body: { clusterId: selectedCluster, includeOccupations: true }
        } as any);
        if (error) throw error;
        return data as { cluster: any; occupations: any[]; occupationCount: number };
      }
    },
    staleTime: 60_000,
  });

  const source = (clustersQuery.data as any)?.source || "db";

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-7 w-7 text-indigo-600" /> Industry (Career Cluster) Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Browse by career clusters as a proxy for sectors. Click a cluster to see its occupations.</p>
      </div>

      <Card className="p-6 space-y-4">
        {!selectedCluster && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">{clustersQuery.data?.clusters?.length || 0} clusters</div>
              {source === "db" && (
                <span className="inline-flex items-center text-xs px-2 py-1 rounded border bg-green-50 text-green-700 border-green-300">🟢 From Database</span>
              )}
              {source === "curated_fallback" && (
                <span className="inline-flex items-center text-xs px-2 py-1 rounded border bg-yellow-50 text-yellow-700 border-yellow-300">🟡 Curated Fallback</span>
              )}
            </div>
            {clustersQuery.isLoading && (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(clustersQuery.data as any)?.clusters?.map((c: any, i: number) => (
                <motion.div key={c.cluster_id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCluster(c.cluster_id)}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-indigo-600" />
                        <div className="font-semibold text-sm">{c.cluster_title}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{c.occupationCount || 0} occupations</div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {selectedCluster && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Cluster: {selectedCluster}</div>
              <div className="flex items-center gap-2">
                {source === "db" && (
                  <span className="inline-flex items-center text-xs px-2 py-1 rounded border bg-green-50 text-green-700 border-green-300">🟢 From Database</span>
                )}
                <Button size="sm" variant="outline" onClick={() => setSelectedCluster(null)}>Back to clusters</Button>
              </div>
            </div>
            {clustersQuery.isLoading && (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(clustersQuery.data as any)?.occupations?.map((o: any, i: number) => (
                <motion.div key={o.occupation_code} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="font-semibold text-sm">{o.occupation_title}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">{o.occupation_code}</div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
