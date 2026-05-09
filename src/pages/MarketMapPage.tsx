import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Map, RefreshCcw } from "lucide-react";

type GroupBy = "career_cluster" | "job_zone" | "occupation";

type HeatmapCell = {
  id: string;
  label: string;
  group: string;
  value: number;
  colorValue: number;
  occupationCount?: number;
  occupationCode6?: string;
  detailSlug?: string | null;
  employmentLevel?: number | null;
  medianWageAnnual?: number | null;
  projectedGrowth10y?: number | null;
  overallApo?: number | null;
  confidence?: string | null;
  riskBand?: string | null;
};

type HeatmapResponse = {
  snapshotDate: string | null;
  region: string;
  groupBy: GroupBy;
  summary: {
    totalCells: number;
    totalEmployment: number;
    weightedAverageApo: number;
    occupationCount: number;
  };
  cells: HeatmapCell[];
  source?: string;
};

const REGIONS = ["US"];
const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "career_cluster", label: "Career Cluster" },
  { value: "job_zone", label: "Job Zone" },
  { value: "occupation", label: "Occupation" },
];

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function getCellColor(value: number) {
  if (value >= 75) return "#dc2626";
  if (value >= 55) return "#f59e0b";
  if (value >= 35) return "#2dd4a8";
  return "#14b8a6";
}

function TreemapTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;

  const item = payload[0]?.payload as HeatmapCell | undefined;
  if (!item) return null;

  return (
    <div className="rounded-lg border bg-[var(--bg-secondary)] p-3 text-sm shadow-lg">
      <div className="font-semibold text-[var(--text-primary)]">{item.label}</div>
      <div className="mt-1 text-[var(--text-secondary)]">Employment: {formatCompactNumber(item.value || 0)}</div>
      <div className="text-[var(--text-secondary)]">Exposure: {Math.round(item.colorValue || 0)}%</div>
      {typeof item.medianWageAnnual === "number" && (
        <div className="text-[var(--text-secondary)]">Median wage: {formatCurrency(item.medianWageAnnual)}</div>
      )}
      {typeof item.projectedGrowth10y === "number" && (
        <div className="text-[var(--text-secondary)]">Growth: {item.projectedGrowth10y}%</div>
      )}
    </div>
  );
}

export default function MarketMapPage() {
  const [region, setRegion] = useState("US");
  const [groupBy, setGroupBy] = useState<GroupBy>("career_cluster");

  const heatmapQuery = useQuery({
    queryKey: ["market-heatmap", region, groupBy],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("market-heatmap", {
        body: { region, groupBy, limit: groupBy === "occupation" ? 120 : 250 },
      } as any);
      if (error) throw error;
      return data as HeatmapResponse;
    },
    staleTime: 300_000,
  });

  const treemapData = useMemo(() => {
    return (heatmapQuery.data?.cells || []).map((cell) => ({
      ...cell,
      name: cell.label,
      size: Math.max(cell.value || 0, 1),
      fill: getCellColor(cell.colorValue || 0),
    }));
  }, [heatmapQuery.data]);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Map className="h-6 w-6 text-[var(--accent-primary)]" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Occupation Market Map</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Area represents employment scale. Color represents automation exposure using the precomputed heatmap data layer.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={groupBy} onValueChange={(value: GroupBy) => setGroupBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              {GROUP_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => heatmapQuery.refetch()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2">
          <div className="text-xs text-muted-foreground">Snapshot</div>
          <div className="text-2xl font-bold">{heatmapQuery.data?.snapshotDate || "—"}</div>
        </Card>
        <Card className="p-5 space-y-2">
          <div className="text-xs text-muted-foreground">Cells</div>
          <div className="text-2xl font-bold">{formatCompactNumber(heatmapQuery.data?.summary.totalCells || 0)}</div>
        </Card>
        <Card className="p-5 space-y-2">
          <div className="text-xs text-muted-foreground">Occupations</div>
          <div className="text-2xl font-bold">{formatCompactNumber(heatmapQuery.data?.summary.occupationCount || 0)}</div>
        </Card>
        <Card className="p-5 space-y-2">
          <div className="text-xs text-muted-foreground">Weighted Exposure</div>
          <div className="text-2xl font-bold">{Math.round(heatmapQuery.data?.summary.weightedAverageApo || 0)}%</div>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="font-semibold">Treemap</h2>
            <p className="text-sm text-muted-foreground">Initial isolated route for the heatmap feature. Existing user journeys remain untouched.</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">Source: {heatmapQuery.data?.source || "db"}</Badge>
            <Badge variant="outline">{GROUP_OPTIONS.find((option) => option.value === groupBy)?.label}</Badge>
          </div>
        </div>

        {heatmapQuery.isLoading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading market map...
          </div>
        ) : heatmapQuery.error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {(heatmapQuery.error as Error).message}
          </div>
        ) : treemapData.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
            No published heatmap cells are available yet for this region.
          </div>
        ) : (
          <div className="h-[520px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap data={treemapData} dataKey="size" stroke="rgba(15,23,42,0.35)" fill="#2dd4a8">
                <Tooltip content={<TreemapTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
