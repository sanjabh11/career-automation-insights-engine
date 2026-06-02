import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  CreditCard,
  Database,
  FileText,
  Gauge,
  Map,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  commercialLaunchGateItems,
} from "@/lib/commercialLaunchGate";
import {
  caseStudyCaptureTemplate,
  coachCommercializationWorkflow,
  commercialValidationEvidenceGates,
  designPartnerOnboardingChecklist,
  ownerEvidenceCloseoutStatusItems,
  ownerEvidenceCloseoutSummary,
  paymentFulfillmentStatusItems,
  sourceFreshnessDashboardRows,
} from "@/lib/commercialLaunchReadiness";
import {
  GLOBAL_ENGLISH_SOURCE_DATE,
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

function metric(value: number) {
  return `${value.toFixed(1).replace(/\.0$/, "")}/5`;
}

export function EvidenceGateDashboard() {
  const gateRows = commercialValidationEvidenceGates.map((gate) => ({
    id: gate.gate,
    label: gate.gate,
    status: commercialGateStatus(gate.status),
    proof: gate.currentProof,
    required: gate.requiredEvidence,
    boundary: gate.doesNotProve,
  }));
  const launchBlockers = commercialLaunchGateItems
    .filter((item) => item.priority === "high")
    .slice(0, 4)
    .map((item) => ({
      id: item.gap,
      label: item.gap,
      status: item.owner === "codex-implemented" ? "ready" : item.owner === "owner-secret" ? "manual" : "blocked",
      proof: item.currentProof,
      required: item.remainingAction,
      boundary: `Owner: ${item.owner.replace(/-/g, " ")} · maturity ${metric(item.maturity)}`,
    }));
  const rows = [...gateRows, ...launchBlockers];
  const readyCount = rows.filter((row) => row.status === "ready").length;

  return (
    <Card data-proof-visibility="evidence-gate-dashboard">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">Evidence gate dashboard</CardTitle>
            <CardDescription>
              Claims stay blocked until owner-held payment, partner, outcome, and live runtime proof passes.
            </CardDescription>
          </div>
          <Badge variant="outline">{readyCount}/{rows.length} ready</Badge>
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

export function OwnerEvidenceCloseoutPanel() {
  const blockedCount = ownerEvidenceCloseoutStatusItems.filter((item) => item.status === "blocked").length;
  const ownerActionCount = ownerEvidenceCloseoutStatusItems.filter((item) => item.status === "owner_action").length;

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
            <Badge variant="outline">{ownerActionCount} owner-held</Badge>
          </div>
          <p className="mt-3 text-muted-foreground">{ownerEvidenceCloseoutSummary.closeoutBoundary}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            <strong>Tracked ledger:</strong> {ownerEvidenceCloseoutSummary.trackedLedger}
          </p>
        </div>

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
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
      </CardContent>
    </Card>
  );
}

export function OutcomeEvidenceReviewPanel() {
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
      <CardContent className="grid gap-3 md:grid-cols-2">
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
