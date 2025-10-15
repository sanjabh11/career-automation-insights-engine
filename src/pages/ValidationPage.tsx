import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Target, BarChart3 } from "lucide-react";

export default function ValidationPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Validation & Reliability</h1>
        <p className="text-sm text-muted-foreground">Calibration, confidence, and reliability diagnostics for APO and task categorization.</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold">Reliability Panel (ECE / Calibration)</h3>
          <Badge variant="secondary">beta</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          We compute Expected Calibration Error (ECE) and plot reliability diagrams over a rolling benchmark of occupations. This panel will populate once the
          benchmark job is run. In the meantime, you can review methodology in Methods & Ablations.
        </p>
        <div className="mt-4 rounded-lg border p-4 bg-gray-50">
          <div className="text-sm text-muted-foreground">
            No calibration run found yet. Please run the 200+ occupation benchmark in <a className="underline" href="/validation/methods">Methods</a> and refresh.
          </div>
        </div>
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
