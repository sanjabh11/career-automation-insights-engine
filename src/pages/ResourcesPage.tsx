import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, BookOpen, FileText, GraduationCap, FlaskConical } from "lucide-react";

export default function ResourcesPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Resources</h1>
        <p className="text-sm text-muted-foreground">Educator and researcher packs, with data sheets and model documentation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Educator Pack</h3>
            <Badge variant="secondary">PDF</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Top Bright Outlook/STEM occupations, skills ladders, APO task labels, and learning pathways.</p>
          <Button variant="outline" className="gap-2" asChild>
            <a href="/docs/resources/EDUCATOR_PACK.pdf" download>
              <Download className="h-4 w-4" /> Download
            </a>
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Research API Guide</h3>
            <Badge variant="secondary">PDF</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">API endpoints, schemas, and example queries for researchers; governance and privacy notes included.</p>
          <Button variant="outline" className="gap-2" asChild>
            <a href="/docs/resources/RESEARCH_API_GUIDE.pdf" download>
              <Download className="h-4 w-4" /> Download
            </a>
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Model Cards & Data Sheets</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <a href="/docs/model_cards/APO_MODEL_CARD.pdf" target="_blank" rel="noreferrer">APO Model Card</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/docs/model_cards/TASK_MODEL_CARD.pdf" target="_blank" rel="noreferrer">Task Model Card</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/docs/data_sheets/ONET_ENRICHMENT_SHEET.pdf" target="_blank" rel="noreferrer">O*NET Enrichment</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/docs/data_sheets/TELEMETRY_SHEET.pdf" target="_blank" rel="noreferrer">Telemetry</a>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">Ablations Report</h3>
            <Badge variant="secondary">PDF</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Baseline comparisons and sensitivity analyses across ≥200 occupations. (Placeholder; upload final report)</p>
          <Button variant="outline" className="gap-2" asChild>
            <a href="/docs/reports/ABLATIONS_REPORT.pdf" target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" /> View Report
            </a>
          </Button>
        </Card>
      </div>
    </div>
  );
}
