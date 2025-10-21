import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Target, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ValidationPage() {
  const [cohort, setCohort] = React.useState<string>("all");
  const { data: run, isLoading: runLoading, refetch } = useQuery({
    queryKey: ["calibration-run-latest", cohort],
    queryFn: async () => {
      let q = (supabase as any)
        .from("calibration_runs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      if (cohort !== "all") {
        q = q.eq("cohort", cohort);
      }
      const { data } = await q.maybeSingle();
      if (!data) return null;
      const { data: results } = await (supabase as any)
        .from("calibration_results")
        .select("*")
        .eq("run_id", data.id)
        .order("bin_lower");
      return { run: data, results: results || [] } as any;
    },
    staleTime: 60_000,
  });

  const { data: corrMetric } = useQuery({
    queryKey: ["validation-metric-pearson-r"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("validation_metrics")
        .select("metric_name, value, sample_size, created_at")
        .eq("metric_name", "apo_vs_academic_pearson_r")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as any;
    },
    staleTime: 60_000,
  });

  const ece = React.useMemo(() => {
    const rows = (run as any)?.results || [];
    const total = rows.reduce((a: number, r: any) => a + (r.count || 0), 0) || 1;
    const sum = rows.reduce((a: number, r: any) => a + (Number(r.ece_component ?? Math.abs((r.observed_avg||0)-(r.predicted_avg||0))) * (r.count||0) / total), 0);
    return Math.round(sum * 1000) / 1000;
  }, [run]);

  const chartData = ((run as any)?.results || []).map((r: any) => ({
    bin: `${Math.round((r.bin_lower||0)*100)}–${Math.round((r.bin_upper||0)*100)}%`,
    predicted: Math.round((r.predicted_avg || 0) * 1000) / 10,
    observed: Math.round((r.observed_avg || 0) * 1000) / 10,
    error: Math.abs(((r.observed_avg || 0) - (r.predicted_avg || 0)) * 100),
  }));

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Validation & Reliability</h1>
        <p className="text-sm text-muted-foreground">Calibration, confidence, and reliability diagnostics for APO and task categorization.</p>
        {corrMetric && (
          <div className="mt-2 text-xs">
            <Badge variant="outline" className="mr-2">Academic corr r={(Number(corrMetric.value)).toFixed(2)}</Badge>
            {typeof corrMetric.sample_size === 'number' && (
              <Badge variant="secondary">n={corrMetric.sample_size}</Badge>
            )}
          </div>
        )}
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold">Model Cards & Dataset Sheets</h3>
          <Badge variant="secondary">transparency</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/docs/model_cards/APO_MODEL_CARD.pdf" target="_blank" rel="noreferrer">APO Model Card (PDF)</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/docs/model_cards/TASK_MODEL_CARD.pdf" target="_blank" rel="noreferrer">Task Model Card (PDF)</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/docs/data_sheets/ONET_ENRICHMENT_SHEET.pdf" target="_blank" rel="noreferrer">O*NET Enrichment Sheet (PDF)</a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/docs/data_sheets/TELEMETRY_SHEET.pdf" target="_blank" rel="noreferrer">Telemetry Sheet (PDF)</a>
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold">Reliability Panel (ECE / Calibration)</h3>
          <Badge variant="secondary">beta</Badge>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <Select value={cohort} onValueChange={(v)=>{ setCohort(v); refetch(); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cohort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cohorts</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" asChild>
            <a href="/docs/methods/CALIBRATION_METHODS.pdf" target="_blank" rel="noreferrer">Calibration Methods (PDF)</a>
          </Button>
        </div>
        <div className="mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await supabase.functions.invoke("calibrate-ece", { body: { days: 90, binCount: 10, cohort: cohort === 'all' ? null : cohort } });
                // Force refetch
                await (supabase as any); // no-op to keep types quiet
                window.location.reload();
              } catch (e) {
                // swallow
              }
            }}
            aria-label="Run calibration over last 90 days"
          >
            Run Calibration (90d)
          </Button>
        </div>
        {runLoading && (
          <div className="text-sm text-muted-foreground">Loading calibration run…</div>
        )}
        {!run && !runLoading && (
          <div className="mt-4 rounded-lg border p-4 bg-gray-50">
            <div className="text-sm text-muted-foreground">
              No calibration run found yet. Please run the 200+ occupation benchmark in <a className="underline" href="/validation/methods">Methods</a> and refresh.
            </div>
          </div>
        )}
        {run && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">Latest run: {(run as any).run.created_at?.slice(0,19).replace('T',' ')}</div>
              <Badge variant="outline">ECE: {ece}</Badge>
              <Badge variant="outline">Bins: {(run as any).results?.length || 0}</Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-3">
                <div className="text-sm font-medium mb-2">Reliability Diagram (Predicted vs Observed %)</div>
                <div className="h-64">
                  <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bin" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="predicted" stroke="#6366f1" name="Predicted %" />
                      <Line type="monotone" dataKey="observed" stroke="#10b981" name="Observed %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-sm font-medium mb-2">Calibration Error per Bin (|obs - pred| %)</div>
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bin" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="error" fill="#f59e0b" name="|obs - pred|" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold">Anomaly Detection</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Outlier detection flags occupations with unusual APO distributions or confidence patterns.
        </p>
        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Occupation</TableHead>
                <TableHead>Flag</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="text-sm text-muted-foreground">No anomalies detected yet</TableCell>
                <TableCell>—</TableCell>
                <TableCell>Run benchmark to populate</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-6 border-amber-200 bg-amber-50">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-amber-700" />
          <h3 className="font-semibold text-amber-900">Caveats</h3>
        </div>
        <ul className="list-disc list-inside text-sm text-amber-900 space-y-1">
          <li>APO is an indicative score, not a prediction of job loss; use alongside domain judgment.</li>
          <li>Calibration depends on prompt stability and model updates; monitor drift month-to-month.</li>
        </ul>
      </Card>

      <div className="flex gap-2">
        <Button asChild>
          <a href="/validation/methods" aria-label="Navigate to validation methods and ablations report">View Methods & Ablations →</a>
        </Button>
      </div>
    </div>
  );
}
