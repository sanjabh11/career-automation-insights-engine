import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, FileText, ScrollText, Lock, Database, Link as LinkIcon } from "lucide-react";

export default function ResponsibleAIPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Responsible AI</h1>
        <p className="text-sm text-muted-foreground">Model cards, data sheets, security posture, and governance metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Security & Privacy</h3>
            <Badge variant="secondary">RLS</Badge>
          </div>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Row Level Security (RLS) enforced on user-facing tables</li>
            <li>Secrets stored in Supabase project settings; no keys in repo</li>
            <li>CORS restricted for edge functions as applicable</li>
          </ul>
          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="h-3.5 w-3.5" /> Audit trail available via `apo_logs`
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold">Model Cards</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">Describe scope, limitations, and intended use of APO and task classification models.</p>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href="/docs/model_cards/APO_MODEL_CARD.pdf" target="_blank" rel="noreferrer">APO Model Card</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/docs/model_cards/TASK_MODEL_CARD.pdf" target="_blank" rel="noreferrer">Task Model Card</a>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold">Data Sheets</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">O*NET enrichment, telemetry, and logging data sources and retention.</p>
          <div className="flex gap-2">
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
            <ScrollText className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold">Governance (last 30 days)</h3>
            <Badge>beta</Badge>
          </div>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Override rate: pending</li>
            <li>Incident count: 0 (public)</li>
            <li>Prompt updates: tracked in CHANGELOG</li>
          </ul>
          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
            <LinkIcon className="h-3.5 w-3.5" /> See <a className="underline" href="/validation">Validation</a> for calibration.
          </div>
        </Card>
      </div>
    </div>
  );
}
