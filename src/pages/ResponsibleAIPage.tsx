import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, FileText, ScrollText, Lock, Database, Link as LinkIcon, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function ResponsibleAIPage() {
  const { data: gov, isLoading } = useQuery({
    queryKey: ["governance-metrics"],
    queryFn: async () => {
      const d30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: logs } = await (supabase as any)
        .from("apo_logs")
        .select("id, created_at, validation_warnings")
        .gte("created_at", d30)
        .limit(5000);
      const total = logs?.length || 0;
      const overrides = (logs || []).filter((r: any) => Array.isArray(r.validation_warnings) && r.validation_warnings.length > 0).length;
      const overrideRate = total > 0 ? Math.round((overrides / total) * 1000) / 10 : 0;
      return { total, overrides, overrideRate };
    },
    staleTime: 60_000,
  });
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Responsible AI</h1>
        <p className="text-sm text-muted-foreground">Model cards, data sheets, security posture, and governance metrics.</p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="border rounded-md p-3">
            <div className="text-xs text-muted-foreground">Security</div>
            <div className="text-lg font-semibold flex items-center gap-2 mt-1"><Lock className="h-4 w-4 text-green-600" /> RLS + Secrets</div>
          </div>
          <div className="border rounded-md p-3">
            <div className="text-xs text-muted-foreground">Data Governance</div>
            <div className="text-lg font-semibold flex items-center gap-2 mt-1"><Database className="h-4 w-4 text-indigo-600" /> 90d retention</div>
          </div>
          <div className="border rounded-md p-3">
            <div className="text-xs text-muted-foreground">Override Rate</div>
            <div className="text-lg font-semibold flex items-center gap-2 mt-1"><Activity className="h-4 w-4 text-green-600" /> {isLoading ? "–" : `${gov?.overrideRate ?? 0}%`}</div>
          </div>
          <div className="border rounded-md p-3">
            <div className="text-xs text-muted-foreground">Model Cards</div>
            <div className="text-lg font-semibold flex items-center gap-2 mt-1"><FileText className="h-4 w-4 text-indigo-600" /> 2 published</div>
          </div>
        </div>
      </Card>

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
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Activity className="h-4 w-4" />
            <span>Override rate: {isLoading ? "–" : `${gov?.overrideRate ?? 0}%`} ({isLoading ? "–" : `${gov?.overrides ?? 0}`} of {isLoading ? "–" : `${gov?.total ?? 0}`})</span>
          </div>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Incident count: 0 (public)</li>
            <li>Prompt updates: tracked in CHANGELOG</li>
          </ul>
          <div className="mt-3">
            <div className="text-sm font-medium mb-1">Security Artifacts</div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/docs/security/THREAT_MODEL.pdf" target="_blank" rel="noreferrer">Threat Model</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/docs/security/PEN_TEST_SUMMARY.pdf" target="_blank" rel="noreferrer">Pen-test Summary</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/docs/security/RLS_PROOFS.pdf" target="_blank" rel="noreferrer">RLS Proofs</a>
              </Button>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
            <LinkIcon className="h-3.5 w-3.5" /> See <a className="underline" href="/validation">Validation</a> for calibration.
          </div>
        </Card>
      </div>
    </div>
  );
}
