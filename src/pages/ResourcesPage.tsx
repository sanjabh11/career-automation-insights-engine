import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, GraduationCap, FlaskConical } from "lucide-react";
import { SourceFreshnessPanel } from "@/components/proof/ProofVisibilityPanels";

export default function ResourcesPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Resources</h1>
        <p className="text-sm text-muted-foreground">Educator and researcher packs, with data sheets and model documentation.</p>
      </div>

      <SourceFreshnessPanel />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="h-5 w-5 text-[var(--accent-primary)]" />
            <h3 className="font-semibold">Educator Pack</h3>
            <Badge variant="secondary">PDF</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Top Bright Outlook/STEM occupations, skills ladders, APO task labels, and learning pathways.</p>
          <p className="text-sm text-muted-foreground rounded-md border p-3">Download pending. This pack will be published after Phase B adds dated methodology and calibration artifacts.</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="h-5 w-5 text-[var(--accent-primary)]" />
            <h3 className="font-semibold">Research API Guide</h3>
            <Badge variant="secondary">PDF</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">API endpoints, schemas, and example queries for researchers; governance and privacy notes included.</p>
          <p className="text-sm text-muted-foreground rounded-md border p-3">Download pending. Public API documentation will be linked when the validation boundary is complete.</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-[var(--accent-primary)]" />
            <h3 className="font-semibold">Model Cards & Data Sheets</h3>
          </div>
          <p className="text-sm text-muted-foreground rounded-md border p-3">
            Model cards and data sheets are in progress. They will identify intended use, known limitations, source vintages, and calibration evidence before any files are served.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-[var(--accent-primary)]" />
            <h3 className="font-semibold">Ablations Report</h3>
            <Badge variant="secondary">PDF</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Baseline comparisons and sensitivity analyses across representative occupations.</p>
          <p className="text-sm text-muted-foreground rounded-md border p-3">Report pending. Current code has the validation UI scaffold, not a served ablations result.</p>
        </Card>
      </div>
    </div>
  );
}
