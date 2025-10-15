import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Download, BarChart2, Activity, Users, Clock } from "lucide-react";

function percentile(arr: number[], p: number) {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
  return s[idx];
}

export default function OutcomesPage() {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const d90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const { data: kpis, isLoading } = useQuery({
    queryKey: ["outcomes-kpis"],
    queryFn: async () => {
      // Saved analyses counts (proxy for outcomes created/exports)
      const [sa30, sa90] = await Promise.all([
        supabase.from("saved_analyses").select("id, user_id, created_at", { count: "exact" }).gte("created_at", d30).limit(1),
        supabase.from("saved_analyses").select("id, user_id, created_at", { count: "exact" }).gte("created_at", d90).limit(1),
      ]);

      // LLM logs (apo_logs) for latency and token metrics
      const { data: apoLogs } = await supabase
        .from("apo_logs")
        .select("latency_ms, tokens_used, created_at, user_id")
        .gte("created_at", d90)
        .order("created_at", { ascending: false })
        .limit(1000);

      // Web vitals for performance (last 14 days)
      const d14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: vitals } = await (supabase as any)
        .from("web_vitals")
        .select("name, value, created_at")
        .gte("created_at", d14)
        .order("created_at", { ascending: false })
        .limit(1000);

      // Aggregate
      const latencies = (apoLogs || []).map((l: any) => Number(l.latency_ms || 0)).filter((n) => n > 0);
      const tokens = (apoLogs || []).map((l: any) => Number(l.tokens_used || 0)).filter((n) => n > 0);
      const users90 = new Set((apoLogs || []).map((l: any) => l.user_id).filter(Boolean));

      const lcpValues = (vitals || [])
        .filter((v: any) => (v.name || "").toUpperCase().includes("LCP"))
        .map((v: any) => Number(v.value || 0));

      const kpi = {
        analyses30: sa30.count ?? 0,
        analyses90: sa90.count ?? 0,
        mau90: users90.size,
        tokens90: tokens.reduce((a, b) => a + b, 0),
        p95Latency: Math.round(percentile(latencies, 95)),
        p99Latency: Math.round(percentile(latencies, 99)),
        p95LCP: Math.round(percentile(lcpValues, 95)),
      };

      return { kpi, apoLogs: apoLogs || [], vitals: vitals || [] };
    },
    staleTime: 60_000,
  });

  const csv = useMemo(() => {
    if (!kpis) return "";
    const { kpi } = kpis as any;
    const rows = [
      ["Metric", "Value"],
      ["Analyses (30d)", kpi.analyses30],
      ["Analyses (90d)", kpi.analyses90],
      ["MAU (90d)", kpi.mau90],
      ["Tokens Used (90d)", kpi.tokens90],
      ["Latency p95 (ms)", kpi.p95Latency],
      ["Latency p99 (ms)", kpi.p99Latency],
      ["LCP p95 (ms)", kpi.p95LCP],
    ];
    return rows.map((r) => r.join(",")).join("\n");
  }, [kpis]);

  const downloadCSV = () => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `outcomes_kpis_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-green-600" /> Outcomes & KPIs
          </h1>
          <p className="text-sm text-muted-foreground">30/90-day outcomes and performance. Export-ready for public reporting.</p>
        </div>
        <Button onClick={downloadCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Analyses (30 days)</div>
          <div className="text-3xl font-bold">{isLoading ? "–" : (kpis as any)?.kpi.analyses30}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Analyses (90 days)</div>
          <div className="text-3xl font-bold">{isLoading ? "–" : (kpis as any)?.kpi.analyses90}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Monthly Active Users (90d)</div>
          <div className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-green-600" /> {isLoading ? "–" : (kpis as any)?.kpi.mau90}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Latency p95 (ms)</div>
          <div className="text-3xl font-bold flex items-center gap-2"><Clock className="h-6 w-6 text-green-600" />{isLoading ? "–" : (kpis as any)?.kpi.p95Latency}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Latency p99 (ms)</div>
          <div className="text-3xl font-bold">{isLoading ? "–" : (kpis as any)?.kpi.p99Latency}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Tokens Used (90d)</div>
          <div className="text-3xl font-bold">{isLoading ? "–" : (kpis as any)?.kpi.tokens90}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold">Recent APO Requests (sample)</h3>
          <Badge variant="secondary">last 1000 / 90d</Badge>
        </div>
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Latency (ms)</TableHead>
                <TableHead>Tokens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(kpis as any)?.apoLogs?.slice(0, 20).map((r: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell>{r.latency_ms}</TableCell>
                  <TableCell>{r.tokens_used}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold">Web Vitals Summary (LCP p95 over last 14d)</h3>
        </div>
        <div className="text-sm text-muted-foreground">
          {isLoading ? "Loading…" : `${(kpis as any)?.kpi.p95LCP || 0} ms`}
        </div>
      </Card>
    </div>
  );
}
