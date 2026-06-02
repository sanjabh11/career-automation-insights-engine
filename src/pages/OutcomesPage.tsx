import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Download, BarChart2, Activity, Users, Clock, TrendingUp, AlertCircle, ShieldCheck, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OutcomeEvidenceReviewPanel } from "@/components/proof/ProofVisibilityPanels";

type ApoLogRow = {
  latency_ms?: number | null;
  tokens_used?: number | null;
  created_at?: string | null;
  user_id?: string | null;
  error?: string | null;
  cohort?: string | null;
};

type WebVitalRow = {
  name?: string | null;
  value?: number | null;
  created_at?: string | null;
};

type OutcomeKpi = {
  analyses30: number;
  analyses90: number;
  mau90: number;
  tokens90: number;
  p95Latency: number;
  p99Latency: number;
  p95LCP: number;
  uptimePct: number;
  errorBudgetUsed: number;
  totalRequests30: number;
  failures30: number;
};

type OutcomesQueryData = {
  kpi: OutcomeKpi;
  apoLogs: ApoLogRow[];
  vitals: WebVitalRow[];
};

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
  const [cohort, setCohort] = React.useState<string>("all");
  const [useSyntheticCohort, setUseSyntheticCohort] = React.useState(false);

  const { data: kpis, isLoading } = useQuery<OutcomesQueryData>({
    queryKey: ["outcomes-kpis", cohort],
    queryFn: async () => {
      // Saved analyses counts are product activity signals, not labor-market outcomes.
      const [sa30, sa90] = await Promise.all([
        supabase.from("saved_analyses").select("id, user_id, created_at", { count: "exact" }).gte("created_at", d30).limit(1),
        supabase.from("saved_analyses").select("id, user_id, created_at", { count: "exact" }).gte("created_at", d90).limit(1),
      ]);

      // LLM logs (apo_logs) for latency and token metrics
      let apoQuery = supabase
        .from("apo_logs")
        .select("latency_ms, tokens_used, created_at, user_id, error, cohort")
        .gte("created_at", d90)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (cohort !== "all") {
        apoQuery = apoQuery.eq("cohort", cohort);
      }
      const { data: apoLogData } = await apoQuery;
      const apoLogs = (apoLogData || []) as ApoLogRow[];

      // Web vitals for performance (last 14 days)
      const d14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: vitalsData } = await supabase
        .from("web_vitals")
        .select("name, value, created_at")
        .gte("created_at", d14)
        .order("created_at", { ascending: false })
        .limit(1000);
      const vitals = (vitalsData || []) as WebVitalRow[];

      // Aggregate
      const latencies = apoLogs.map((l) => Number(l.latency_ms || 0)).filter((n) => n > 0);
      const tokens = apoLogs.map((l) => Number(l.tokens_used || 0)).filter((n) => n > 0);
      const users90 = new Set(apoLogs.map((l) => l.user_id).filter(Boolean));
      const logs30 = apoLogs.filter((l) => l.created_at && new Date(l.created_at).toISOString() >= d30);
      const total30 = logs30.length;
      const failures30 = logs30.filter((l) => l.error && String(l.error).trim().length > 0).length;
      const uptimePct = total30 > 0 ? Math.round(((total30 - failures30) / total30) * 10000) / 100 : 100;
      const SLO = 99.5; // percent
      const allowedErrors = Math.max(1, Math.floor((1 - SLO / 100) * total30));
      const errorBudgetUsed = Math.min(100, Math.round((failures30 / allowedErrors) * 100));

      const lcpValues = vitals
        .filter((v) => (v.name || "").toUpperCase().includes("LCP"))
        .map((v) => Number(v.value || 0));

      const kpi = {
        analyses30: sa30.count ?? 0,
        analyses90: sa90.count ?? 0,
        mau90: users90.size,
        tokens90: tokens.reduce((a, b) => a + b, 0),
        p95Latency: Math.round(percentile(latencies, 95)),
        p99Latency: Math.round(percentile(latencies, 99)),
        p95LCP: Math.round(percentile(lcpValues, 95)),
        uptimePct,
        errorBudgetUsed,
        totalRequests30: total30,
        failures30,
      };

      return { kpi, apoLogs, vitals };
    },
    staleTime: 60_000,
  });

  const csv = useMemo(() => {
    if (!kpis) return "";
    const { kpi } = kpis;
    const rows = [
      ["Metric", "Value"],
      ["Analyses (30d)", kpi.analyses30],
      ["Analyses (90d)", kpi.analyses90],
      ["MAU (90d)", kpi.mau90],
      ["Tokens Used (90d)", kpi.tokens90],
      ["Latency p95 (ms)", kpi.p95Latency],
      ["Latency p99 (ms)", kpi.p99Latency],
      ["LCP p95 (ms)", kpi.p95LCP],
      ["Uptime (30d) %", kpi.uptimePct],
      ["Error Budget Used %", kpi.errorBudgetUsed],
      ["Requests (30d)", kpi.totalRequests30],
      ["Failures (30d)", kpi.failures30],
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

  const kpi = kpis?.kpi;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-green-600" aria-hidden="true" /> Market Signals & KPIs
          </h1>
          <p className="text-sm text-muted-foreground">
            30/90-day platform usage and performance telemetry. This is not placement, wage, or public outcome reporting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={cohort} onValueChange={setCohort}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cohort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cohorts</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={downloadCSV} variant="outline" className="gap-2" aria-label="Export outcomes data as CSV">
            <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
          </Button>
        </div>
      </div>

      <OutcomeEvidenceReviewPanel />

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold">Signals & Methods</h3>
          <Badge variant="secondary">methods</Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Current rows summarize saved-analysis counts, APO request logs, token usage, latency, and web vitals when the
          configured Supabase project exposes those tables. Labor-market outcome claims require separate permissioned
          case-study or institutional evidence.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Telemetry boundary</Badge>
          <Button variant="outline" size="sm" asChild>
            <a href="/validation/methods">View Validation Methods →</a>
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-5 w-5 text-[var(--accent-primary)]" />
          <h3 className="font-semibold text-[var(--accent-primary)]">Cohort Methodology</h3>
          <Badge variant="secondary">transparency</Badge>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useSyntheticCohort}
              onChange={(e) => setUseSyntheticCohort(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">Use Synthetic Cohort</span>
          </label>
        </div>
        <p className="text-sm text-[var(--text-primary)]">
          {useSyntheticCohort ? (
            <>
              <strong>Synthetic cohort mode:</strong> Use only for UI demonstration and verifier exercises. Synthetic rows
              must not be described as usage, revenue, retention, placement, wage, or product-market-fit evidence.
              See <a href="/validation/methods" className="underline">Validation Methods</a> for methodology boundaries.
            </>
          ) : (
            <>
              <strong>Telemetry mode:</strong> Metrics reflect rows readable from the configured Supabase tables for the
              selected cohort tier. Counts are aggregate product activity signals from <code className="bg-[var(--accent-primary)]/20 px-1 rounded">apo_logs</code>,
              <code className="bg-[var(--accent-primary)]/20 px-1 rounded">saved_analyses</code>, and <code className="bg-[var(--accent-primary)]/20 px-1 rounded">web_vitals</code>;
              they do not prove buyer adoption or career outcomes.
            </>
          )}
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Analyses (30 days)</div>
          <div className="text-3xl font-bold">{isLoading ? "–" : kpi?.analyses30}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Analyses (90 days)</div>
          <div className="text-3xl font-bold">{isLoading ? "–" : kpi?.analyses90}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Monthly Active Users (90d)</div>
          <div className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-green-600" /> {isLoading ? "–" : kpi?.mau90}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Latency p95 (ms)</div>
          <div className="text-3xl font-bold flex items-center gap-2"><Clock className="h-6 w-6 text-green-600" />{isLoading ? "–" : kpi?.p95Latency}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Latency p99 (ms)</div>
          <div className="text-3xl font-bold">{isLoading ? "–" : kpi?.p99Latency}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Tokens Used (90d)</div>
          <div className="text-3xl font-bold">{isLoading ? "–" : kpi?.tokens90}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Uptime (30d)</div>
          <div className="text-3xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-green-600" />{isLoading ? "–" : `${kpi?.uptimePct}%`}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Error Budget Used</div>
          <div className="text-3xl font-bold">{isLoading ? "–" : `${kpi?.errorBudgetUsed}%`}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Requests/Failures (30d)</div>
          <div className="text-3xl font-bold">{isLoading ? "–" : `${kpi?.totalRequests30}/${kpi?.failures30}`}</div>
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
              {kpis?.apoLogs.slice(0, 20).map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">{r.created_at ? new Date(r.created_at).toLocaleString() : "—"}</TableCell>
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
          {isLoading ? "Loading…" : `${kpi?.p95LCP || 0} ms`}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold">Outcome Evidence Boundary</h3>
          <Badge variant="secondary">evidence gate</Badge>
        </div>
        <div className="space-y-4">
          <div className="rounded-lg border p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-700 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-900 font-medium mb-1">Outcome claims are not yet proven</p>
                <p className="text-xs text-amber-800">
                  The table below is an evidence checklist for future analysis. No causal relationship, wage lift,
                  placement rate, or buyer outcome should be claimed until source-dated data and permissioned outcome
                  records are attached.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evidence Area</TableHead>
                  <TableHead>Current State</TableHead>
                  <TableHead>Needed Before Claiming</TableHead>
                  <TableHead>Boundary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-sm">APO shifts and job postings</TableCell>
                  <TableCell>Not computed in this local artifact</TableCell>
                  <TableCell className="text-xs text-muted-foreground">Source-dated posting data, occupation mapping, lag specification, and reproducible analysis output</TableCell>
                  <TableCell className="text-xs text-muted-foreground">Exposure estimates are not displacement forecasts.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm">APO shifts and wages</TableCell>
                  <TableCell>Not computed in this local artifact</TableCell>
                  <TableCell className="text-xs text-muted-foreground">Source-dated wage tables, geography/SOC joins, suppression notes, and reviewer sign-off</TableCell>
                  <TableCell className="text-xs text-muted-foreground">Do not claim salary increase or compensation impact.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-sm">Learning activity and outcomes</TableCell>
                  <TableCell>Not computed in this local artifact</TableCell>
                  <TableCell className="text-xs text-muted-foreground">Consent-backed cohort definition, completion records, baseline workflow, measured change, and permissioned quote/outcome</TableCell>
                  <TableCell className="text-xs text-muted-foreground">Learning recommendations are planning themes, not placement or wage guarantees.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="text-xs text-muted-foreground">
            <strong>Note:</strong> This page is a telemetry and evidence-readiness surface. See <a href="/proof-pack-gallery" className="underline">Proof Pack Gallery</a> for the commercial evidence gates and live-proof boundaries.
          </div>
        </div>
      </Card>
    </div>
  );
}
