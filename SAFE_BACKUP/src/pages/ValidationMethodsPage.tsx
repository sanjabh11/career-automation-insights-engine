import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, FlaskConical, Gauge } from "lucide-react";

export default function ValidationMethodsPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Methods & Ablations</h1>
        <p className="text-sm text-muted-foreground">Benchmark design, baselines, and sensitivity tests to validate APO methodology.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <FlaskConical className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold">Benchmark Plan (200+ Occupations)</h3>
          <Badge variant="secondary">protocol</Badge>
        </div>
        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
          <li>Select 200+ representative occupations across clusters and job zones.</li>
          <li>Run three pipelines per occupation: Deterministic-only, LLM-only, Hybrid.</li>
          <li>Record latency, tokens, and APO distributions per category.</li>
          <li>Compute calibration metrics (ECE), plot reliability diagrams.</li>
          <li>Conduct sensitivity tests on weights and prompt variants.</li>
        </ol>
        <div className="mt-3">
          <Button variant="outline" asChild>
            <a href="/validation">Go to Reliability Panel →</a>
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Gauge className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold">Baselines</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Deterministic</TableCell>
              <TableCell className="text-sm text-muted-foreground">Rule-based mapping using O*NET weights only.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>LLM-only</TableCell>
              <TableCell className="text-sm text-muted-foreground">Direct task classification via Gemini, no rule fusion.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Hybrid (current)</TableCell>
              <TableCell className="text-sm text-muted-foreground">Weighted fusion with prompt-standardized task analysis.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold">Deliverables</h3>
        </div>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>6-page report (PDF) summarizing methods, results, calibration plots, costs/latency variance.</li>
          <li>CSV of per-occupation metrics for reproducibility.</li>
          <li>Changelog documenting prompt and weight changes.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href="/docs/reports/ABLATIONS_REPORT.pdf" target="_blank" rel="noreferrer">Download Methods & Ablations (PDF)</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/docs/methods/CALIBRATION_METHODS.pdf" target="_blank" rel="noreferrer">Calibration Methods (PDF)</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/docs/examples/baselines_sample.csv" target="_blank" rel="noreferrer">Sample Baselines CSV</a>
          </Button>
        </div>
      </Card>
    </div>
  );
}
