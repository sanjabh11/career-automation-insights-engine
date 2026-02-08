import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function IndustryDashboardPage() {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const navigate = useNavigate();

  const clustersQuery = useQuery({
    queryKey: ["career-clusters", selectedCluster],
    queryFn: async () => {
      if (!selectedCluster) {
        const { data, error } = await supabase.functions.invoke("browse-career-clusters", {} as any);
        if (error) throw error;
        return data as { clusters: any[]; source?: string };
      } else {
        const { data, error } = await supabase.functions.invoke("browse-career-clusters", {
          body: { clusterId: selectedCluster, includeOccupations: true },
        } as any);
        if (error) throw error;
        return data as { cluster: any; occupations: any[]; occupationCount: number; source?: string };
      }
    },
    staleTime: 60_000,
  });

  const isLoading = clustersQuery.isLoading;
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
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedCluster ? "Cluster Details" : `${(clustersQuery.data as any)?.clusters?.length || 0} clusters`}
          </div>
          <div className="flex items-center gap-2">
            {source === "db" && (
              <span className="inline-flex items-center text-xs px-2 py-1 rounded border bg-green-50 text-green-700 border-green-300">🟢 From Database</span>
            )}
            {source && source !== "db" && (
              <span className="inline-flex items-center text-xs px-2 py-1 rounded border bg-yellow-50 text-yellow-700 border-yellow-300">🟡 {source}</span>
            )}
            {selectedCluster && (
              <Button size="sm" variant="outline" onClick={() => setSelectedCluster(null)}>Back</Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
          </div>
        ) : !selectedCluster ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(clustersQuery.data as any)?.clusters?.map((c: any) => (
              <Card key={c.cluster_id} className="p-4 space-y-2 hover:shadow-sm transition" onClick={() => setSelectedCluster(c.cluster_id)}>
                <div className="font-semibold">{c.cluster_name || c.title || c.cluster_id}</div>
                {c.description ? <p className="text-sm text-muted-foreground">{c.description}</p> : null}
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="font-semibold">{(clustersQuery.data as any)?.cluster?.cluster_name || selectedCluster}</div>
            <div className="text-sm text-muted-foreground">{(clustersQuery.data as any)?.occupationCount || 0} occupations</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(clustersQuery.data as any)?.occupations?.map((o: any) => (
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
      </Card>
    </div>
  );
}
