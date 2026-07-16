import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  CreditCard,
  Database,
  Download,
  FileText,
  Gauge,
  Map,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  blockedClaimVisibilityItems,
  buildOwnerEvidenceCompletionDrillCsv,
  buildOwnerEvidenceHandoffCsv,
  buildOwnerEvidenceActionQueueCsv,
  buildOwnerEvidencePrepReadinessCsv,
  caseStudyCaptureTemplate,
  coachCommercializationWorkflow,
  designPartnerOnboardingChecklist,
  OWNER_EVIDENCE_COMPLETION_DRILL_FILENAME,
  OWNER_EVIDENCE_HANDOFF_FILENAME,
  OWNER_EVIDENCE_ACTION_QUEUE_FILENAME,
  OWNER_EVIDENCE_PREP_READINESS_FILENAME,
  ownerEvidenceCompletionDrillItems,
  ownerEvidenceCompletionDrillSummary,
  ownerEvidenceHandoffItems,
  ownerEvidenceHandoffSummary,
  ownerEvidenceLocalSafetySummary,
  ownerEvidenceOperationalAccessPrerequisites,
  ownerEvidencePrepReadinessGateSummaries,
  ownerEvidencePrepReadinessItems,
  ownerEvidencePrepReadinessSummary,
  ownerEvidenceActionQueueItems,
  ownerEvidenceCloseoutCommandItems,
  ownerEvidenceCloseoutStatusItems,
  ownerEvidenceCloseoutSummary,
  paymentFulfillmentStatusItems,
  sourceFreshnessDashboardRows,
} from "@/lib/commercialLaunchReadiness";
import {
  GLOBAL_ENGLISH_SOURCE_DATE,
  REGIONAL_LABOR_MARKET_SOURCE_ROW_SUMMARIES,
  REGIONAL_WAGE_OUTLOOK_ADAPTERS,
  getBrowserGlobalEnglishRegion,
  getOfficialSources,
  getRegionalLaborMarketDisclosure,
  type GlobalEnglishRegion,
} from "@/lib/globalEnglishLocalization";
import {
  SOURCE_MANIFEST_LAST_VERIFIED_AT,
  SOURCE_REFRESH_MANIFEST,
} from "@/lib/sourceManifest";
import { cn } from "@/lib/utils";

type ProofStatus = "ready" | "blocked" | "manual" | "pending";

const OWNER_EVIDENCE_INTAKE_BOUNDARY =
  "Draft only. Raw partner names, contacts, contracts, notes, private quotes, customer data, and hash salts must remain owner-held outside the repository.";

const DEFAULT_PARTNER_BOUNDARIES = "Revenue\nSuccessful outcomes\nMarket-wide demand";
const DEFAULT_OUTCOME_BOUNDARIES = "Guaranteed career outcomes\nCausal impact\nGeneralizable demand";

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseBoundaries(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function downloadJsonDraft(filename: string, value: unknown) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: "application/json;charset=utf-8" });
  downloadBlob(filename, blob);
}

function downloadTextFile(filename: string, body: string, type = "text/plain;charset=utf-8") {
  downloadBlob(filename, new Blob([body], { type }));
}

function downloadBlob(filename: string, blob: Blob) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function compactJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function statusTone(status: ProofStatus) {
  switch (status) {
    case "ready":
      return {
        badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
        label: "Ready",
      };
    case "blocked":
      return {
        badge: "bg-rose-100 text-rose-800 border-rose-200",
        icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
        label: "Blocked",
      };
    case "manual":
      return {
        badge: "bg-amber-100 text-amber-800 border-amber-200",
        icon: <Circle className="h-4 w-4 text-amber-600" />,
        label: "Owner-held",
      };
    case "pending":
      return {
        badge: "bg-slate-100 text-slate-800 border-slate-200",
        icon: <Circle className="h-4 w-4 text-slate-500" />,
        label: "Pending",
      };
  }
}

function commercialGateStatus(status: string): ProofStatus {
  if (status === "local_ready" || status === "done") return "ready";
  if (status === "blocked") return "blocked";
  if (status === "manual_required" || status === "owner_action") return "manual";
  return "pending";
}

function proofBadge(status: ProofStatus) {
  const tone = statusTone(status);
  return (
    <Badge variant="outline" className={cn("gap-1 border", tone.badge)}>
      {tone.icon}
      {tone.label}
    </Badge>
  );
}

function blockedClaimStatusBadge(status: "blocked" | "bounded" | "owner_attestation_required") {
  const classes = {
    blocked: "border-rose-200 bg-rose-50 text-rose-800",
    bounded: "border-sky-200 bg-sky-50 text-sky-800",
    owner_attestation_required: "border-amber-200 bg-amber-50 text-amber-800",
  }[status];
  const label = {
    blocked: "Blocked",
    bounded: "Bounded copy only",
    owner_attestation_required: "Owner attestation required",
  }[status];

  return (
    <Badge variant="outline" className={cn("border", classes)}>
      {label}
    </Badge>
  );
}

function metric(value: number) {
  return `${value.toFixed(1).replace(/\.0$/, "")}/5`;
}

export function EvidenceGateDashboard() {
  const rows = ownerEvidenceCloseoutStatusItems.map((item) => ({
    id: item.gateId,
    label: item.label,
    status: commercialGateStatus(item.status),
    proof: item.currentProof,
    required: item.remainingAction,
    boundary: item.doesNotProve,
  }));
  const readyCount = rows.filter((row) => row.status === "ready").length;

  return (
    <Card data-proof-visibility="evidence-gate-dashboard">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">Evidence gate dashboard</CardTitle>
            <CardDescription>
              Claims stay blocked until final closeout accepts the remaining payment, partner, outcome, and manual WCAG proof.
            </CardDescription>
          </div>
          <Badge variant="outline">{readyCount}/{rows.length} accepted</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {rows.map((row) => (
          <article key={row.id} className="rounded-lg border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-sm font-semibold">{row.label}</h3>
              {proofBadge(row.status)}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{row.proof}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              <strong>Needed:</strong> {row.required}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              <strong>Does not prove:</strong> {row.boundary}
            </p>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

export function BlockedClaimsPanel() {
  const blockedCount = blockedClaimVisibilityItems.filter((item) => item.currentStatus === "blocked").length;

  return (
    <Card data-proof-visibility="blocked-claims-panel" className="border-rose-200 bg-rose-50/30">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5 text-rose-700" />
              Blocked claims matrix
            </CardTitle>
            <CardDescription>
              Admin-facing guardrail for copy, demos, PRs, and partner conversations. Use the allowed copy until the
              required evidence is attached.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-rose-200 bg-white text-rose-800">
            {blockedCount} blocked
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        {blockedClaimVisibilityItems.map((item) => (
          <article key={item.claim} className="rounded-lg border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-sm font-semibold">{item.claim}</h3>
              {blockedClaimStatusBadge(item.currentStatus)}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              <strong>Why blocked:</strong> {item.blockingEvidence}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              <strong>Required evidence:</strong> {item.requiredEvidence}
            </p>
            <p className="mt-3 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
              <strong>Allowed copy:</strong> {item.allowedCopy}
            </p>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

export function OwnerEvidenceCloseoutPanel() {
  const blockedCount = ownerEvidenceCloseoutStatusItems.filter((item) => item.status === "blocked").length;
  const ownerActionCount = ownerEvidenceCloseoutStatusItems.filter((item) => item.status === "owner_action").length;
  const [copiedCommandId, setCopiedCommandId] = useState<string | null>(null);

  const copyOwnerCommand = async (commandId: string, command: string) => {
    await navigator.clipboard.writeText(command);
    setCopiedCommandId(commandId);
  };
  const downloadOwnerActionQueue = () => {
    downloadTextFile(
      OWNER_EVIDENCE_ACTION_QUEUE_FILENAME,
      `${buildOwnerEvidenceActionQueueCsv()}\n`,
      "text/csv;charset=utf-8"
    );
  };
  const downloadOwnerEvidenceHandoff = () => {
    downloadTextFile(
      OWNER_EVIDENCE_HANDOFF_FILENAME,
      `${buildOwnerEvidenceHandoffCsv()}\n`,
      "text/csv;charset=utf-8"
    );
  };
  const downloadOwnerEvidencePrepReadiness = () => {
    downloadTextFile(
      OWNER_EVIDENCE_PREP_READINESS_FILENAME,
      `${buildOwnerEvidencePrepReadinessCsv()}\n`,
      "text/csv;charset=utf-8"
    );
  };
  const downloadOwnerEvidenceCompletionDrill = () => {
    downloadTextFile(
      OWNER_EVIDENCE_COMPLETION_DRILL_FILENAME,
      `${buildOwnerEvidenceCompletionDrillCsv()}\n`,
      "text/csv;charset=utf-8"
    );
  };

  return (
    <Card data-proof-visibility="owner-evidence-closeout-panel" className="border-amber-200 bg-amber-50/40">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-amber-700" />
              Owner evidence closeout
            </CardTitle>
            <CardDescription>
              Part I goalComplete=false as of {ownerEvidenceCloseoutSummary.asOf}; redacted proof artifacts do not
              complete the gate until final closeout accepts every owner-held record.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-amber-300 bg-white text-amber-900">
            {ownerEvidenceCloseoutSummary.passedArtifactCount}/{ownerEvidenceCloseoutSummary.totalGateCount} artifacts passed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-white p-4 text-sm text-amber-950">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-800">
              goalComplete=false
            </Badge>
            <Badge variant="outline">{blockedCount} blocked</Badge>
            <Badge variant="outline">{ownerEvidenceCloseoutSummary.remainingGateCount} remaining owner gates</Badge>
            <Badge variant="outline">{ownerActionCount} owner-held</Badge>
            <Badge variant="outline">{ownerEvidenceCloseoutSummary.ownerActionNeededCount} owner actions</Badge>
            <Badge variant="outline">{ownerEvidenceActionQueueItems.length} queue items</Badge>
          </div>
          <p className="mt-3 text-muted-foreground">{ownerEvidenceCloseoutSummary.closeoutBoundary}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            <strong>Tracked ledger:</strong> {ownerEvidenceCloseoutSummary.trackedLedger}
          </p>
        </div>

        <section
          className="rounded-lg border border-emerald-200 bg-white p-4"
          data-proof-visibility="owner-evidence-local-safety-preflight"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Local evidence safety preflight</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Git ignore, tracking, and staging status for owner-held evidence paths before refreshed proof metadata is
                staged.
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "border",
                ownerEvidenceLocalSafetySummary.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              )}
            >
              localSafetyStatus={ownerEvidenceLocalSafetySummary.status}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {ownerEvidenceLocalSafetySummary.ignoredProtectedPathCount}/
              {ownerEvidenceLocalSafetySummary.protectedPathCount} protected paths ignored
            </Badge>
            <Badge variant="outline">
              tracked violations={ownerEvidenceLocalSafetySummary.trackedSensitiveFileViolationCount}
            </Badge>
            <Badge variant="outline">
              staged violations={ownerEvidenceLocalSafetySummary.stagedSensitivePathViolationCount}
            </Badge>
            <Badge variant="outline">errors={ownerEvidenceLocalSafetySummary.errorCount}</Badge>
            <Badge variant="outline">
              does-not-prove boundaries={ownerEvidenceLocalSafetySummary.doesNotProveCount}
            </Badge>
            <Badge variant="outline">source trace rows={ownerEvidenceLocalSafetySummary.sourceTraceCount}</Badge>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{ownerEvidenceLocalSafetySummary.evidenceBoundary}</p>
          <p className="mt-2 text-xs text-muted-foreground">{ownerEvidenceLocalSafetySummary.sourceTraceBoundary}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            <strong>Source artifact:</strong> {ownerEvidenceLocalSafetySummary.sourceArtifact}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            <strong>Does not prove:</strong> {ownerEvidenceLocalSafetySummary.doesNotProve.join("; ")}
          </p>
        </section>

        <section
          className="rounded-lg border border-amber-200 bg-white p-4"
          data-proof-visibility="owner-evidence-prep-readiness"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Owner evidence prep readiness</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Read-only local prep status embedded in the closeout packet. It shows what the owner must load or
                replace before final closeout can even attempt the live, commercial, and manual WCAG gates.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadOwnerEvidencePrepReadiness}
              data-owner-evidence-prep-readiness-download="true"
            >
              <Download className="mr-2 h-4 w-4" />
              Prep CSV
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline">readyForCloseout={String(ownerEvidencePrepReadinessSummary.readyForCloseout)}</Badge>
            <Badge variant="outline">{ownerEvidencePrepReadinessSummary.ownerActionNeededCount} owner actions</Badge>
            <Badge variant="outline">{ownerEvidencePrepReadinessGateSummaries.length} gate prep summaries</Badge>
            <Badge variant="outline">redacted readiness only</Badge>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{ownerEvidencePrepReadinessSummary.evidenceBoundary}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            <strong>Source artifact:</strong> {ownerEvidencePrepReadinessSummary.sourceArtifact}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            <strong>Status verifier:</strong> {ownerEvidencePrepReadinessSummary.statusVerifier}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" data-owner-evidence-prep-by-gate="true">
            {ownerEvidencePrepReadinessGateSummaries.map((item) => (
              <article key={item.gateId} className="rounded-md border bg-muted/30 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="break-words font-mono text-[11px] text-muted-foreground">{item.gateId}</p>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
                <p className="mt-2 text-sm font-semibold">{item.ownerActionNeededCount} prep action(s)</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <strong>Source:</strong> {item.sourceArtifact}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{item.evidenceBoundary}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {ownerEvidencePrepReadinessItems.map((item) => (
              <article key={item.itemId} className="rounded-md border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold">{item.itemId.replace(/_/g, " ")}</h4>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.status}</p>
                  </div>
                  <Badge variant="outline">{item.track}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{item.ownerAction}</p>
                {item.ownerPrepCommand ? (
                  <div className="mt-3 rounded-md border border-blue-100 bg-blue-50/60 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase text-blue-900">Owner prep command</p>
                    <code className="break-words text-xs">{item.ownerPrepCommand}</code>
                  </div>
                ) : null}
                <div className="mt-3 rounded-md border bg-muted/40 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">Next proof command</p>
                  <code className="break-words text-xs">{item.nextCommand}</code>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  <strong>Source:</strong> {item.source}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <strong>Does not prove:</strong> {item.doesNotProve}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="rounded-lg border border-amber-200 bg-white p-4"
          data-proof-visibility="owner-evidence-completion-drill"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Owner evidence completion drill</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Gate-by-gate execution matrix for the generated live-proof, commercial-evidence, and manual WCAG owner
                packets. It keeps the launch decision fail-closed while showing exactly which packet and verifier moves
                each gate.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadOwnerEvidenceCompletionDrill}
              data-owner-evidence-completion-drill-download="true"
            >
              <Download className="mr-2 h-4 w-4" />
              Completion CSV
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline">status={ownerEvidenceCompletionDrillSummary.status}</Badge>
            <Badge variant="outline">goalComplete={String(ownerEvidenceCompletionDrillSummary.goalComplete)}</Badge>
            <Badge variant="outline">{ownerEvidenceCompletionDrillSummary.blockedGateCount} blocked gates</Badge>
            <Badge variant="outline">{ownerEvidenceCompletionDrillSummary.ownerActionNeededCount} owner-prep actions</Badge>
            <Badge variant="outline">
              {ownerEvidenceCompletionDrillSummary.operationalAccessPrerequisiteCount} operational access item
            </Badge>
            <Badge variant="outline">{ownerEvidenceCompletionDrillSummary.matrixRowCount} matrix rows</Badge>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{ownerEvidenceCompletionDrillSummary.evidenceBoundary}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            <strong>Verification command:</strong> {ownerEvidenceCompletionDrillSummary.verificationCommand}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            <strong>CSV artifact:</strong> {OWNER_EVIDENCE_COMPLETION_DRILL_FILENAME}
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {ownerEvidenceCompletionDrillItems.map((item) => (
              <article key={item.gateId} className="rounded-md border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold">{item.order}. {item.label}</h4>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.gateId}</p>
                  </div>
                  <Badge variant="outline">{item.completionState}</Badge>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                  <p>
                    <strong>Packet:</strong> {item.packetType} ({item.packetStatus})
                  </p>
                  <p>
                    <strong>Packet files:</strong> {item.packetMarkdown}; {item.packetCsv}
                  </p>
                  <p>
                    <strong>Expected proof artifact:</strong> {item.expectedProofArtifact}
                  </p>
                  <p>
                    <strong>Accepted when:</strong> {item.acceptedWhen}
                  </p>
                </div>
                <div className="mt-3 rounded-md border bg-muted/40 p-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">Acceptance verifier</p>
                  <code className="break-words text-xs">{item.acceptanceVerifierCommand}</code>
                </div>
                <div className="mt-3" data-owner-evidence-completion-drill-blockers="true">
                  <p className="text-xs font-semibold text-foreground">Blocking owner actions</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {item.blockingOwnerActions.map((action) => (
                      <li key={action} className="break-words rounded border border-dashed bg-amber-50/50 px-2 py-1">
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  <strong>Repo does not do:</strong> {item.repoDoesNotDo}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <strong>Does not prove:</strong> {item.doesNotProve}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="rounded-lg border border-amber-200 bg-white p-4"
          data-proof-visibility="owner-operational-access-prerequisites"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Operational access prerequisites</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Owner account-access checks for live deployment closeout. These items are not counted as launch-evidence
                gates and do not make missing owner evidence pass.
              </p>
            </div>
            <Badge variant="outline">{ownerEvidenceOperationalAccessPrerequisites.length} access item</Badge>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {ownerEvidenceOperationalAccessPrerequisites.map((item) => (
              <article key={item.id} className="rounded-md border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold">{item.label}</h4>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.id}</p>
                  </div>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{item.ownerAction}</p>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                  <p>
                    <strong>Source artifact:</strong> {item.sourceArtifact}
                  </p>
                  <p>
                    <strong>Owner prep command:</strong> {item.ownerPrepCommand}
                  </p>
                  <p>
                    <strong>Strict verifier:</strong> {item.nextCommand}
                  </p>
                </div>
                <div className="mt-3" data-owner-operational-access-commands="true">
                  <p className="text-xs font-semibold text-foreground">Owner access command checklist</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {item.accessRecoveryCommands.map((command) => (
                      <li key={command} className="break-words rounded border border-dashed bg-background px-2 py-1">
                        {command}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3" data-owner-operational-access-blockers="true">
                  <p className="text-xs font-semibold text-foreground">Blocking checks</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {item.blockingCheckIds.map((checkId) => (
                      <li key={checkId} className="break-words rounded border border-dashed bg-amber-50/50 px-2 py-1">
                        {checkId}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  <strong>Accepted when:</strong> {item.acceptedWhen}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <strong>Repo does not do:</strong> {item.repoDoesNotDo}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="rounded-lg border border-amber-200 bg-white p-4"
          data-proof-visibility="owner-evidence-action-queue"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Owner action queue</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Generated from the five remaining owner-evidence gates in the remediation ledger. It is safe to export
                because it contains actions, commands, and proof boundaries only.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadOwnerActionQueue}
              data-owner-evidence-action-queue-download="true"
            >
              <Download className="mr-2 h-4 w-4" />
              Action CSV
            </Button>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {ownerEvidenceActionQueueItems.map((item) => (
              <article key={item.gateId} className="rounded-md border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold">{item.label}</h4>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.gateId}</p>
                  </div>
                  {proofBadge(commercialGateStatus(item.status))}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{item.ownerAction}</p>
                <div className="mt-3 rounded-md border bg-muted/40 p-3">
                  <code className="break-words text-xs">{item.nextCommand}</code>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  <strong>Risk if skipped:</strong> {item.riskIfSkipped}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <strong>Does not prove:</strong> {item.doesNotProve}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="rounded-lg border border-amber-200 bg-white p-4"
          data-proof-visibility="owner-evidence-handoff-packet"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Owner evidence handoff packet</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Cross-checked execution packet for the five remaining owner-held gates. The alignment verifier confirms the
                handoff rows match the remediation ledger, closeout status, and CSV export.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadOwnerEvidenceHandoff}
              data-owner-evidence-handoff-download="true"
            >
              <Download className="mr-2 h-4 w-4" />
              Handoff CSV
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="outline">goalComplete={String(ownerEvidenceHandoffSummary.goalComplete)}</Badge>
            <Badge variant="outline">{ownerEvidenceHandoffSummary.ownerActionQueueCount} handoff rows</Badge>
            <Badge variant="outline">aligned with canonical ledgers</Badge>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{ownerEvidenceHandoffSummary.evidenceBoundary}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            <strong>Alignment verifier:</strong> {ownerEvidenceHandoffSummary.alignmentVerifier}
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {ownerEvidenceHandoffItems.map((item) => (
              <article key={item.gateId} className="rounded-md border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold">{item.label}</h4>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.gateId}</p>
                  </div>
                  <Badge variant="outline">{item.track}</Badge>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  <strong>Closeout steps:</strong> {item.closeoutSteps}
                </p>
                <div className="mt-3" data-owner-evidence-handoff-blockers="true">
                  <p className="text-xs font-semibold text-foreground">Blocking owner-prep actions</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {item.blockingOwnerActions.map((action) => (
                      <li key={action} className="break-words rounded border border-dashed bg-amber-50/50 px-2 py-1">
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3" data-owner-evidence-handoff-failure-details="true">
                  <p className="text-xs font-semibold text-foreground">Redacted failure detail</p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {item.closeoutFailureDetails.map((detail) => (
                      <li key={detail} className="break-words rounded border border-dashed bg-muted/30 px-2 py-1">
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  <strong>Raw evidence policy:</strong> {item.rawEvidencePolicy}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <strong>Repo does not do:</strong> {item.repoDoesNotDo}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-3 md:grid-cols-2">
          {ownerEvidenceCloseoutStatusItems.map((item) => (
            <article key={item.gateId} className="rounded-lg border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold">{item.label}</h3>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.gateId}</p>
                </div>
                {proofBadge(commercialGateStatus(item.status))}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{item.currentProof}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                <strong>Artifact state:</strong> {item.artifactState.replace(/_/g, " ")}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                <strong>Source artifact:</strong> {item.sourceArtifact}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                <strong>Next:</strong> {item.remainingAction}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                <strong>Does not prove:</strong> {item.doesNotProve}
              </p>
            </article>
          ))}
        </div>

        <div className="rounded-lg border border-amber-200 bg-white p-4" data-proof-visibility="owner-evidence-command-checklist">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Owner closeout command checklist</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Copy-safe commands for collecting redacted proof. Raw secrets, partner names, customer data, invoices,
                contracts, quotes, and salts stay owner-held outside tracked files.
              </p>
            </div>
            <Badge variant="outline">fail closed</Badge>
          </div>
          <div className="mt-4 grid gap-3">
            {ownerEvidenceCloseoutCommandItems.map((item) => (
              <article key={item.commandId} className="rounded-md border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold">{item.label}</h4>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{item.commandId}</p>
                  </div>
                  <Badge variant={item.status === "final_closeout" ? "default" : "outline"}>
                    {item.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="mt-3 rounded-md border bg-muted/40 p-3">
                  <code className="break-words text-xs">{item.command}</code>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Required owner inputs</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                      {item.requiredOwnerInputs.map((input) => (
                        <li key={input}>{input}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>
                      <strong>Writes:</strong> {item.writes}
                    </p>
                    <p>
                      <strong>Safety boundary:</strong> {item.safetyBoundary}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => copyOwnerCommand(item.commandId, item.command)}
                >
                  {copiedCommandId === item.commandId ? "Copied command" : "Copy command"}
                </Button>
              </article>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SourceFreshnessPanel() {
  const highConfidenceSources = SOURCE_REFRESH_MANIFEST.filter((source) => source.confidence === "high").length;
  const activeSources = SOURCE_REFRESH_MANIFEST.filter((source) => source.integrationStatus === "active").length;

  return (
    <Card data-proof-visibility="source-freshness-panel">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Database className="h-5 w-5 text-indigo-600" />
              Source freshness
            </CardTitle>
            <CardDescription>
              Source registry last verified {SOURCE_MANIFEST_LAST_VERIFIED_AT}; active sources are not treated as live
              data proof until table checksums or artifact snapshots exist.
            </CardDescription>
          </div>
          <Badge variant="outline">{activeSources} active · {highConfidenceSources} high confidence</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-3">
        {sourceFreshnessDashboardRows.map((row) => (
          <article key={row.sourceId} className="rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{row.sourceFamily}</h3>
              <Badge variant="outline">{row.confidence}</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{row.currentState}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              <strong>Next proof:</strong> {row.nextProofNeeded}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Maturity {metric(row.maturity)}</p>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

export function RegionalLaborMarketSourceRowsPanel() {
  const totalImportedRows = REGIONAL_LABOR_MARKET_SOURCE_ROW_SUMMARIES.reduce(
    (total, item) => total + item.importedRowCount,
    0
  );

  return (
    <Card data-proof-visibility="regional-source-rows-panel">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Map className="h-5 w-5 text-emerald-600" />
              Regional source rows
            </CardTitle>
            <CardDescription>
              Source-dated UK, Canada, and Australia labor-market rows currently imported for disclosure/context.
              These rows do not make APO exposure estimates non-U.S. estimates.
            </CardDescription>
          </div>
          <Badge variant="outline">{totalImportedRows} imported rows</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-3">
        {REGIONAL_LABOR_MARKET_SOURCE_ROW_SUMMARIES.map((item) => (
          <article key={item.region} className="rounded-lg border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{item.region} source rows</h3>
              <Badge variant="outline">{item.importedRowCount} rows</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{item.sourceFamily}</p>
            <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
              <p>
                <strong>Source period:</strong> {item.sourcePeriod}
              </p>
              <p>
                <strong>Source date:</strong> {item.sourceDate}
              </p>
              <p>
                <strong>Source IDs:</strong> {item.sourceIds.join(", ")}
              </p>
              <div>
                <strong>Suppression states:</strong>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.suppressionStates.map((state) => (
                    <Badge key={state} variant="secondary" className="text-[11px]">
                      {state.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
              <p>
                <strong>Display boundary:</strong> {item.displayBoundary}
              </p>
              <p>
                <strong>Next proof:</strong> {item.nextProofNeeded}
              </p>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

export function CalibrationHealthWidget() {
  return (
    <Card data-proof-visibility="calibration-health-widget" className="border-indigo-200 bg-indigo-50 text-indigo-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Gauge className="h-5 w-5" />
          Calibration health
        </CardTitle>
        <CardDescription className="text-indigo-900/80">
          Local artifacts are served, but production confidence remains gated by live expert/APO matched pairs.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-indigo-200 bg-white/70 p-4">
          <span className="text-xs font-semibold uppercase text-indigo-800">Local docs</span>
          <p className="mt-2 text-sm">Calibration report, reliability plot, APO model card, and task model card are served.</p>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-white/70 p-4">
          <span className="text-xs font-semibold uppercase text-indigo-800">Live gate</span>
          <p className="mt-2 text-sm">
            Latest redacted run passed on 2026-06-02: 6 matched APO/expert pairs, 10 reliability bins, ECE 0.27855.
          </p>
        </div>
        <div className="rounded-lg border border-indigo-200 bg-white/70 p-4">
          <span className="text-xs font-semibold uppercase text-indigo-800">Claim boundary</span>
          <p className="mt-2 text-sm">
            This proves only a bounded live calibration run. Do not claim general accuracy, future performance, or employment-decision validity.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function RegionalDataBadge({
  occupationCode,
  region,
}: {
  occupationCode: string;
  region?: GlobalEnglishRegion;
}) {
  const resolvedRegion = region ?? getBrowserGlobalEnglishRegion();
  const disclosure = getRegionalLaborMarketDisclosure(resolvedRegion, occupationCode);
  const sourceNames = getOfficialSources(disclosure.sourceIds).map((source) => source.name);

  if (!disclosure.shouldShow) {
    return (
      <div
        aria-label="Regional labor-market disclosure"
        className="rounded-lg border bg-emerald-50 p-4 text-sm text-emerald-950"
        data-proof-visibility="regional-data-badge"
        role="note"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Map className="h-4 w-4" />
          <strong>U.S. source basis</strong>
          <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-800">active</Badge>
        </div>
        <p className="mt-2">This result uses the U.S. SOC/O*NET/BLS basis shown in the methodology and model card.</p>
      </div>
    );
  }

  return (
    <div
      aria-label="Regional labor-market disclosure"
      className="rounded-lg border bg-amber-50 p-4 text-sm text-amber-950"
      data-proof-visibility="regional-data-badge"
      role="note"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Map className="h-4 w-4" />
        <strong>{disclosure.heading}</strong>
        <Badge variant="outline" className="border-amber-200 bg-white text-amber-800">
          {disclosure.wageStatus.replace(/_/g, " ")}
        </Badge>
      </div>
      <p className="mt-2">{disclosure.message}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <p className="text-xs">
          <strong>Classification:</strong>{" "}
          {disclosure.classification ? (
            <>
              <span className="font-mono">{disclosure.classification.code}</span>{" "}
              <span aria-hidden="true">·</span>{" "}
              <span>{disclosure.classification.title}</span>
            </>
          ) : (
            "No reliable regional mapping found."
          )}
        </p>
        <p className="text-xs">
          <strong>Source date:</strong> {GLOBAL_ENGLISH_SOURCE_DATE}
        </p>
        {disclosure.localValue ? (
          <>
            <p className="text-xs md:col-span-2">
              <strong>Local source row:</strong>{" "}
              <span className="font-mono">{disclosure.localValue.classificationCode}</span>{" "}
              <span aria-hidden="true">·</span>{" "}
              <span>{disclosure.localValue.classificationTitle}</span>{" "}
              <span>({disclosure.localValue.classificationLevel})</span>
            </p>
            <p className="text-xs">
              <strong>Local wage:</strong> {disclosure.localValue.wage.label}.{" "}
              {disclosure.localValue.wage.suppressionState.replace(/_/g, " ")}.
            </p>
            <p className="text-xs">
              <strong>Local outlook:</strong> {disclosure.localValue.outlook.label}.{" "}
              {disclosure.localValue.outlook.suppressionState.replace(/_/g, " ")}.
            </p>
            <p className="text-xs md:col-span-2">
              <strong>Value boundary:</strong> {disclosure.localValue.displayBoundary}
            </p>
          </>
        ) : null}
        {disclosure.adapter ? (
          <p className="text-xs md:col-span-2">
            <strong>Adapter:</strong> {REGIONAL_WAGE_OUTLOOK_ADAPTERS[disclosure.adapter.region].label}.{" "}
            {disclosure.adapter.displayBoundary}
          </p>
        ) : null}
        <p className="text-xs md:col-span-2">
          <strong>Sources:</strong> {sourceNames.length ? sourceNames.join("; ") : "Source registry pending for this result."}
        </p>
      </div>
    </div>
  );
}

export function PartnerEvidenceIntakePanel() {
  const [partnerRef, setPartnerRef] = useState("");
  const [segment, setSegment] = useState("career_coach");
  const [committedAt, setCommittedAt] = useState(todayIsoDate);
  const [artifactReviewed, setArtifactReviewed] = useState("sample_report");
  const [redactionLevel, setRedactionLevel] = useState("public_segment_only");
  const [partnerFlags, setPartnerFlags] = useState({
    permissioned: false,
    contactPermission: false,
    pilotScopeAccepted: false,
    planningOnlyUseConfirmed: false,
    nextStepRecorded: false,
  });
  const [doesNotProve, setDoesNotProve] = useState(DEFAULT_PARTNER_BOUNDARIES);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const partnerDraft = useMemo(() => ({
    partnerRef,
    segment,
    committedAt,
    permissioned: partnerFlags.permissioned,
    contactPermission: partnerFlags.contactPermission,
    pilotScopeAccepted: partnerFlags.pilotScopeAccepted,
    planningOnlyUseConfirmed: partnerFlags.planningOnlyUseConfirmed,
    artifactReviewed,
    nextStepRecorded: partnerFlags.nextStepRecorded,
    proofArtifactHashes: [],
    proofArtifactTypes: ["permissioned_email", "artifact_review_log"],
    rawEvidenceOwnerHeld: Object.values(partnerFlags).every(Boolean),
    redactionLevel,
    integrityAttestations: {
      marketingUseReviewed: partnerFlags.permissioned,
      materialConnectionReviewed: partnerFlags.permissioned,
      incentiveOrCompensationReviewed: partnerFlags.permissioned,
      noFakeOrSyntheticTestimonial: partnerFlags.permissioned,
      noReviewGatingOrSuppression: partnerFlags.permissioned,
    },
    ownerEvidenceArchive: {
      permissionTrailOwnerHeld: partnerFlags.permissioned && partnerFlags.contactPermission,
      pilotScopeRecordOwnerHeld: partnerFlags.pilotScopeAccepted,
      artifactReviewLogOwnerHeld: artifactReviewed.trim().length >= 3,
      contactDetailsOwnerHeldOutsideGit: partnerFlags.contactPermission,
      materialConnectionReviewOwnerHeld: partnerFlags.permissioned,
      incentiveOrCompensationReviewOwnerHeld: partnerFlags.permissioned,
      reviewSolicitationNotConditionedOnSentiment: partnerFlags.permissioned,
      reReviewRequiredBeforePublicUse: partnerFlags.permissioned,
    },
    doesNotProve: parseBoundaries(doesNotProve),
  }), [artifactReviewed, committedAt, doesNotProve, partnerFlags, partnerRef, redactionLevel, segment]);
  const partnerDraftJson = useMemo(() => compactJson(partnerDraft), [partnerDraft]);
  const readyForComposer = Object.values(partnerFlags).every(Boolean)
    && partnerDraft.partnerRef.trim().length >= 3
    && partnerDraft.segment.trim().length >= 3
    && partnerDraft.artifactReviewed.trim().length >= 3
    && partnerDraft.proofArtifactHashes.length > 0
    && partnerDraft.redactionLevel.trim().length >= 6
    && partnerDraft.doesNotProve.length > 0;

  const updatePartnerFlag = (key: keyof typeof partnerFlags, value: boolean) => {
    setPartnerFlags((current) => ({ ...current, [key]: value }));
  };

  const copyPartnerDraft = async () => {
    await navigator.clipboard.writeText(partnerDraftJson);
    setCopyState("copied");
  };

  return (
    <Card data-proof-visibility="partner-evidence-intake">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Users className="h-5 w-5 text-emerald-600" />
          Partner evidence intake
        </CardTitle>
        <CardDescription>
          The UI now shows what must be captured before design-partner claims are allowed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {designPartnerOnboardingChecklist.map((step) => (
            <article key={step.step} className="rounded-lg border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{step.step}</h3>
                <Badge variant="outline">{step.owner.replace(/-/g, " ")}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{step.artifact}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                <strong>Acceptance:</strong> {step.acceptanceEvidence}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{step.boundary}</p>
            </article>
          ))}
        </div>

        <div className="rounded-lg border bg-background p-4" data-owner-evidence-draft-builder="partner">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Design partner intake draft</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Generates one <code>designPartnerCommitments</code> entry for the gitignored local intake file.
              </p>
            </div>
            {proofBadge(readyForComposer ? "ready" : "manual")}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="partnerRef">Owner-held partner reference</Label>
              <Input
                id="partnerRef"
                placeholder="owner-held stable alias; never paste names or emails"
                value={partnerRef}
                onChange={(event) => setPartnerRef(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerSegment">Segment</Label>
              <Input id="partnerSegment" value={segment} onChange={(event) => setSegment(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerCommittedAt">Committed at</Label>
              <Input id="partnerCommittedAt" type="date" value={committedAt} onChange={(event) => setCommittedAt(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerArtifactReviewed">Artifact reviewed</Label>
              <Input id="partnerArtifactReviewed" value={artifactReviewed} onChange={(event) => setArtifactReviewed(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerRedactionLevel">Redaction level</Label>
              <Input id="partnerRedactionLevel" value={redactionLevel} onChange={(event) => setRedactionLevel(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="partnerDoesNotProve">Does not prove boundaries</Label>
              <Textarea id="partnerDoesNotProve" value={doesNotProve} onChange={(event) => setDoesNotProve(event.target.value)} />
            </div>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {Object.entries(partnerFlags).map(([key, value]) => (
              <Label key={key} className="flex items-center gap-2 rounded-md border p-3 text-xs font-normal">
                <Checkbox checked={value} onCheckedChange={(checked) => updatePartnerFlag(key as keyof typeof partnerFlags, checked === true)} />
                <span>{key.replace(/([A-Z])/g, " $1").toLowerCase()} confirmed</span>
              </Label>
            ))}
          </div>
          <div className="mt-4 rounded-md border bg-muted/40 p-3">
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs">{partnerDraftJson}</pre>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyPartnerDraft}>
              {copyState === "copied" ? "Copied draft" : "Copy partner draft"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => downloadJsonDraft("design-partner-intake-draft.json", partnerDraft)}>
              Download draft JSON
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{OWNER_EVIDENCE_INTAKE_BOUNDARY}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Paste this entry into <code>docs/commercialization/commercial-evidence-intake.local.json</code> under <code>designPartnerCommitments</code>, then run <code>COMMERCIAL_EVIDENCE_HASH_SALT="&lt;owner-held salt&gt;" npm run compose:commercial-evidence-records -- --write --require-all</code>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function OutcomeEvidenceReviewPanel() {
  const [outcomeRef, setOutcomeRef] = useState("");
  const [observedAt, setObservedAt] = useState(todayIsoDate);
  const [artifactReviewed, setArtifactReviewed] = useState("sample_report");
  const [redactionLevel, setRedactionLevel] = useState("public_quote_approved");
  const [outcomeFlags, setOutcomeFlags] = useState({
    permissioned: false,
    baselineWorkflowCaptured: false,
    measuredChangeCaptured: false,
    approvedQuoteCaptured: false,
    quoteApprovalCaptured: false,
  });
  const [doesNotProve, setDoesNotProve] = useState(DEFAULT_OUTCOME_BOUNDARIES);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const outcomeDraft = useMemo(() => ({
    outcomeRef,
    observedAt,
    permissioned: outcomeFlags.permissioned,
    baselineWorkflowCaptured: outcomeFlags.baselineWorkflowCaptured,
    artifactReviewed,
    measuredChangeCaptured: outcomeFlags.measuredChangeCaptured,
    approvedQuoteCaptured: outcomeFlags.approvedQuoteCaptured,
    quoteApprovalCaptured: outcomeFlags.quoteApprovalCaptured,
    measuredChangeUnit: "minutes_saved_per_report",
    measurementWindow: "single reviewed workflow during owner-held pilot evidence window",
    outcomeClaimScope: "single permissioned observed workflow only; not generalized beyond the reviewed artifact",
    typicalityBoundary: "not represented as typical or expected for other users without additional evidence",
    proofArtifactHashes: [],
    proofArtifactTypes: ["baseline_workflow_note", "measured_change_summary", "quote_approval"],
    rawEvidenceOwnerHeld: Object.values(outcomeFlags).every(Boolean),
    redactionLevel,
    integrityAttestations: {
      marketingUseReviewed: outcomeFlags.permissioned,
      materialConnectionReviewed: outcomeFlags.permissioned,
      incentiveOrCompensationReviewed: outcomeFlags.permissioned,
      noFakeOrSyntheticTestimonial: outcomeFlags.permissioned,
      noReviewGatingOrSuppression: outcomeFlags.permissioned,
      counterfactualNotClaimed: outcomeFlags.measuredChangeCaptured,
      guaranteedOutcomeNotClaimed: outcomeFlags.measuredChangeCaptured,
    },
    ownerEvidenceArchive: {
      baselineWorkflowEvidenceOwnerHeld: outcomeFlags.baselineWorkflowCaptured,
      measuredChangeEvidenceOwnerHeld: outcomeFlags.measuredChangeCaptured,
      quoteApprovalRecordOwnerHeld: outcomeFlags.quoteApprovalCaptured,
      privateQuoteTextOwnerHeldOutsideGit: outcomeFlags.approvedQuoteCaptured,
      materialConnectionReviewOwnerHeld: outcomeFlags.permissioned,
      incentiveOrCompensationReviewOwnerHeld: outcomeFlags.permissioned,
      typicalitySubstantiationOwnerHeld: outcomeFlags.measuredChangeCaptured,
      reReviewRequiredBeforePublicCaseStudyUse: outcomeFlags.permissioned,
    },
    doesNotProve: parseBoundaries(doesNotProve),
  }), [artifactReviewed, doesNotProve, observedAt, outcomeFlags, outcomeRef, redactionLevel]);
  const outcomeDraftJson = useMemo(() => compactJson(outcomeDraft), [outcomeDraft]);
  const readyForComposer = Object.values(outcomeFlags).every(Boolean)
    && outcomeDraft.outcomeRef.trim().length >= 3
    && outcomeDraft.artifactReviewed.trim().length >= 3
    && outcomeDraft.proofArtifactHashes.length > 0
    && outcomeDraft.redactionLevel.trim().length >= 6
    && outcomeDraft.doesNotProve.length > 0;

  const updateOutcomeFlag = (key: keyof typeof outcomeFlags, value: boolean) => {
    setOutcomeFlags((current) => ({ ...current, [key]: value }));
  };

  const copyOutcomeDraft = async () => {
    await navigator.clipboard.writeText(outcomeDraftJson);
    setCopyState("copied");
  };

  return (
    <Card data-proof-visibility="outcome-evidence-review">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-5 w-5 text-indigo-600" />
          Outcome evidence review
        </CardTitle>
        <CardDescription>
          Outcome copy stays blocked until every case-study field is permissioned and redacted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {caseStudyCaptureTemplate.map((field) => (
            <article key={field.field} className="rounded-lg border bg-background p-4">
              <h3 className="text-sm font-semibold">{field.field.replace(/_/g, " ")}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{field.prompt}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                <strong>Required for:</strong> {field.requiredFor}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{field.privacyBoundary}</p>
            </article>
          ))}
        </div>

        <div className="rounded-lg border bg-background p-4" data-owner-evidence-draft-builder="outcome">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Outcome evidence intake draft</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Generates one <code>documentedOutcomes</code> entry with consent and does-not-prove fields.
              </p>
            </div>
            {proofBadge(readyForComposer ? "ready" : "manual")}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="outcomeRef">Owner-held outcome reference</Label>
              <Input
                id="outcomeRef"
                placeholder="owner-held stable alias; never paste names or contacts"
                value={outcomeRef}
                onChange={(event) => setOutcomeRef(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outcomeObservedAt">Observed at</Label>
              <Input id="outcomeObservedAt" type="date" value={observedAt} onChange={(event) => setObservedAt(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outcomeArtifactReviewed">Artifact reviewed</Label>
              <Input id="outcomeArtifactReviewed" value={artifactReviewed} onChange={(event) => setArtifactReviewed(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outcomeRedactionLevel">Redaction level</Label>
              <Input id="outcomeRedactionLevel" value={redactionLevel} onChange={(event) => setRedactionLevel(event.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="outcomeDoesNotProve">Does not prove boundaries</Label>
              <Textarea id="outcomeDoesNotProve" value={doesNotProve} onChange={(event) => setDoesNotProve(event.target.value)} />
            </div>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {Object.entries(outcomeFlags).map(([key, value]) => (
              <Label key={key} className="flex items-center gap-2 rounded-md border p-3 text-xs font-normal">
                <Checkbox checked={value} onCheckedChange={(checked) => updateOutcomeFlag(key as keyof typeof outcomeFlags, checked === true)} />
                <span>{key.replace(/([A-Z])/g, " $1").toLowerCase()} confirmed</span>
              </Label>
            ))}
          </div>
          <div className="mt-4 rounded-md border bg-muted/40 p-3">
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs">{outcomeDraftJson}</pre>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyOutcomeDraft}>
              {copyState === "copied" ? "Copied draft" : "Copy outcome draft"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => downloadJsonDraft("outcome-evidence-intake-draft.json", outcomeDraft)}>
              Download draft JSON
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{OWNER_EVIDENCE_INTAKE_BOUNDARY}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Paste this entry into <code>docs/commercialization/commercial-evidence-intake.local.json</code> under <code>documentedOutcomes</code>. The composer hashes refs with the owner-held salt and rejects placeholders.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CoachAuditWorkspacePanel() {
  return (
    <Card data-proof-visibility="coach-audit-workspace">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          Coach audit workspace
        </CardTitle>
        <CardDescription>
          White-label Automation Risk Audit workflow with proof capture and planning-only limits.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {coachCommercializationWorkflow.map((step) => (
          <article key={step.step} className="rounded-lg border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{step.step}</h3>
              <Badge variant="outline">{step.owner.replace(/-/g, " ")}</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{step.routeOrArtifact}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              <strong>Capture:</strong> {step.proofToCapture}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              <strong>Gate:</strong> {step.acceptanceGate}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{step.claimBoundary}</p>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

export function StripeProofStatusCard() {
  return (
    <Card data-proof-visibility="stripe-proof-status-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <CreditCard className="h-5 w-5 text-indigo-600" />
          Stripe proof status
        </CardTitle>
        <CardDescription>
          Payment source code exists, but live revenue and fulfillment claims remain gated by Stripe/Supabase proof.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {paymentFulfillmentStatusItems.map((item) => (
          <article key={item.item} className="rounded-lg border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{item.item}</h3>
              {proofBadge(commercialGateStatus(item.status))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{item.currentProof}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              <strong>Next:</strong> {item.remainingAction}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">Maturity {metric(item.maturity)}</p>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
