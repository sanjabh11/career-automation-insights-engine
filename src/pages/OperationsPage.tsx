import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";

function formatDay(d: string | Date) {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return dt.toISOString().slice(0, 10);
}

function pQuantile(values: number[], p: number) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1));
  return s[idx];
}

function computePSI(a: number[], b: number[], bins = 10) {
  // a: baseline (prev 14d), b: current (last 14d), values in 0..100
  const toDist = (arr: number[]) => {
    const counts = Array.from({ length: bins }, () => 0);
    for (const v of arr) {
      const x = Math.max(0, Math.min(99.999, v));
      const idx = Math.min(bins - 1, Math.floor((x / 100) * bins));
      counts[idx] += 1;
    }
    const total = Math.max(1, counts.reduce((a, c) => a + c, 0));
    return counts.map((c) => c / total);
  };
  const pa = toDist(a);
  const pb = toDist(b);
  let psi = 0;
  for (let i = 0; i < bins; i++) {
    const p = Math.max(1e-6, pa[i]);
    const q = Math.max(1e-6, pb[i]);
    psi += (p - q) * Math.log(p / q);
  }
  return Math.round(psi * 1000) / 1000;
}

export default function OperationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["ops-metrics"],
    queryFn: async () => {
      const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const since28 = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString();
      const { data: logs } = await (supabase as any)
        .from("apo_logs")
        .select("created_at, latency_ms, error, overall_apo")
        .gte("created_at", since30)
        .order("created_at", { ascending: true })
        .limit(5000);
      const byDay = new Map<string, { count: number; failures: number; latencies: number[] }>();
      const overall: number[] = [];
      for (const r of (logs || [])) {
        const day = formatDay(r.created_at);
        const o = byDay.get(day) || { count: 0, failures: 0, latencies: [] };
        o.count += 1;
        if (r.error && String(r.error).trim().length > 0) o.failures += 1;
        if (typeof r.latency_ms === 'number') o.latencies.push(r.latency_ms);
        byDay.set(day, o);
        if (typeof r.overall_apo === 'number') overall.push(r.overall_apo);
      }
      const series = Array.from(byDay.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([day, v]) => ({
        day,
        throughput: v.count,
        errorRate: v.count ? Math.round((v.failures / v.count) * 1000) / 10 : 0,
        p95Latency: pQuantile(v.latencies, 95),
      }));
      // Drift: compare last 14d vs prior 14d
      const { data: driftLogs } = await (supabase as any)
        .from("apo_logs")
        .select("created_at, overall_apo")
        .gte("created_at", since28)
        .order("created_at", { ascending: true })
        .limit(5000);
      const half = Math.floor((driftLogs || []).length / 2);
      const vals = (driftLogs || []).map((r: any) => Number(r.overall_apo || 0)).filter((n: number) => n>0);
      const current = vals.slice(half);
      const prior = vals.slice(0, half);
      const psi = computePSI(prior, current, 10);
      return { series, psi };
    },
    staleTime: 60_000,
  });

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Activity className="h-7 w-7 text-green-600" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Operations</h1>
        </div>
        <p className="text-sm text-muted-foreground">SLOs, throughput, error rate, latency, and drift monitoring (PSI) over the last 30 days.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold">SLO Dashboard</h3>
          <Badge variant="secondary">30d</Badge>
        </div>
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-3">
              <div className="text-sm text-muted-foreground">Throughput (per day)</div>
              <div className="h-48">
                <ResponsiveContainer>
                  <BarChart data={data?.series || []} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="throughput" fill="#6366f1" name="Requests" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-sm text-muted-foreground">Error Rate (%)</div>
              <div className="h-48">
                <ResponsiveContainer>
                  <LineChart data={data?.series || []} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="errorRate" stroke="#ef4444" name="Error %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-sm text-muted-foreground">Latency p95 (ms)</div>
              <div className="h-48">
                <ResponsiveContainer>
                  <LineChart data={data?.series || []} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="p95Latency" stroke="#10b981" name="p95 ms" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <Clock className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold">Drift Monitoring (PSI)</h3>
          <Badge variant="secondary">last 14d vs prior 14d</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Population Stability Index (PSI) over overall APO distribution. Values > 0.25 indicate significant drift.
        </div>
        <div className="mt-2 text-xl font-bold">
          {isLoading ? "–" : `PSI: ${data?.psi}`}
        </div>
        {(!isLoading && (data?.psi ?? 0) > 0.25) && (
          <div className="mt-2 text-sm text-amber-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Significant drift detected. Investigate model/config changes and input distributions.
          </div>
        )}
      </Card>
    </div>
  );
}
