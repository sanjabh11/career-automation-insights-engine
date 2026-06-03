import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BlockedClaimsPanel,
  EvidenceGateDashboard,
  OwnerEvidenceCloseoutPanel,
  StripeProofStatusCard,
} from "@/components/proof/ProofVisibilityPanels";
import {
  commercialLaunchGateItems,
  functionSecurityReviewGroups,
} from "@/lib/commercialLaunchGate";
import {
  commercialLaunchReadinessMilestones,
  paymentFulfillmentStatusItems,
} from "@/lib/commercialLaunchReadiness";
import {
  buildInstitutionalAcceptanceChecklistCsv,
  buildInstitutionalReadinessCsv,
  buildInstitutionalReadinessPacket,
  INSTITUTIONAL_READINESS_STATUS_LABELS,
  renderInstitutionalReadinessPacketHtml,
} from "@/lib/institutionalReadinessPacket";
import { REVIEW_STATUS_LABELS } from "@/lib/reportEvidenceCards";
import { supabaseFunctionGovernanceSummary } from "@/lib/supabaseFunctionGovernance";

function downloadTextFile(filename: string, body: string, type: string) {
  const blob = new Blob([body], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function scoreLabel(value: number): string {
  return `${value.toFixed(1).replace(/\.0$/, "")}/5`;
}

export default function ResponsibleAIPage() {
  const packet = buildInstitutionalReadinessPacket();
  const blockedGateCount = commercialLaunchGateItems.filter((item) => item.owner !== "codex-implemented").length;

  const handleDownloadTrustPacket = () => {
    downloadTextFile(
      "ai-work-transition-trust-packet.html",
      renderInstitutionalReadinessPacketHtml(packet),
      "text/html;charset=utf-8"
    );
  };

  const handleDownloadRiskCsv = () => {
    downloadTextFile(
      "ai-work-transition-risk-register.csv",
      buildInstitutionalReadinessCsv(packet),
      "text/csv;charset=utf-8"
    );
  };

  const handleDownloadAcceptanceChecklist = () => {
    downloadTextFile(
      "ai-work-transition-acceptance-checklist.csv",
      buildInstitutionalAcceptanceChecklistCsv(packet),
      "text/csv;charset=utf-8"
    );
  };

  return (
    <main className="container mx-auto min-h-screen space-y-8 px-4 py-8" data-commercial-trust-center="true">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Commercial Trust Center</Badge>
            <Badge variant="outline">Planning use only</Badge>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Responsible AI and institutional trust boundaries
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
              Buyer-facing review surface for source-labeled AI work transition proof packs. It shows what is
              implemented, what remains blocked, what evidence supports each control, and what the app must not
              be used for before controlled founder-led outreach.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleDownloadTrustPacket}>
              <Download className="mr-2 h-4 w-4" />
              Download trust packet
            </Button>
            <Button variant="outline" onClick={handleDownloadRiskCsv}>
              <Download className="mr-2 h-4 w-4" />
              Download risk CSV
            </Button>
            <Button variant="outline" onClick={handleDownloadAcceptanceChecklist}>
              <Download className="mr-2 h-4 w-4" />
              Download acceptance checklist
            </Button>
            <Button variant="outline" asChild>
              <Link to="/proof-pack-gallery">
                <ExternalLink className="mr-2 h-4 w-4" />
                Proof-pack gallery
              </Link>
            </Button>
          </div>
        </div>

        <Card className="border-amber-400/70 bg-amber-500/10 p-5 text-foreground">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 text-amber-300" />
            <div className="space-y-2">
              <h2 className="font-semibold">Launch boundary</h2>
              <p className="text-sm leading-6 text-amber-100">
                Ready for bounded demos and pilot review. Not ready for scaled paid or institutional delivery
                until live payment proof, authenticated E2E, manual WCAG evidence, secret rotation, and buyer
                acceptable-use signoff are complete.
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Commercial trust summary">
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Active Supabase functions</span>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{supabaseFunctionGovernanceSummary.activeFunctionCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            {supabaseFunctionGovernanceSummary.noJwtFunctionCount} public/no-JWT functions classified.
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Launch blockers</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{blockedGateCount}</div>
          <p className="mt-1 text-xs text-muted-foreground">Owner, platform, provider, or staff-review actions.</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">AI RMF controls</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{packet.aiRmfControls.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Govern, Map, Measure, and Manage mapped to product evidence.</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">Readiness risks</span>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-semibold">{packet.riskRows.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Each row has sources, caveats, and does-not-prove text.</p>
        </Card>
      </section>

      <EvidenceGateDashboard />
      <BlockedClaimsPanel />
      <OwnerEvidenceCloseoutPanel />
      <StripeProofStatusCard />

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5" data-trust-employment-boundary="true">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-semibold">Allowed use and hard limits</h2>
          </div>
          <div className="mt-4 space-y-3">
            {packet.employmentDecisionBoundary.map((boundary) => (
              <div key={boundary} className="flex gap-2 text-sm leading-6">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{boundary}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5" data-trust-accessibility-boundary="true">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-semibold">Accessibility evidence gate</h2>
          </div>
          <div className="mt-4 space-y-3">
            {packet.accessibilityGate.map((gate) => (
              <div key={gate} className="flex gap-2 text-sm leading-6">
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-indigo-600" />
                <span>{gate}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-4" data-trust-launch-readiness="true">
        <div>
          <h2 className="text-2xl font-semibold">Commercial launch readiness</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Progress is intentionally split between implemented proof and remaining launch gates.
          </p>
        </div>
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full divide-y text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Phase</th>
                <th className="px-4 py-3 font-medium">Done</th>
                <th className="px-4 py-3 font-medium">Pending</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-background">
              {commercialLaunchReadinessMilestones.map((milestone) => (
                <tr key={milestone.phase}>
                  <td className="px-4 py-3 font-medium">{milestone.phase}</td>
                  <td className="px-4 py-3 text-muted-foreground">{milestone.done}</td>
                  <td className="px-4 py-3 text-muted-foreground">{milestone.pending}</td>
                  <td className="px-4 py-3">{scoreLabel(milestone.rating)}</td>
                  <td className="px-4 py-3">{milestone.remainingPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5" data-trust-live-blockers="true">
          <h2 className="text-xl font-semibold">Current live blockers</h2>
          <div className="mt-4 space-y-3">
            {commercialLaunchGateItems.map((item) => (
              <div key={item.gap} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">{item.gap}</h3>
                  <Badge variant={item.priority === "high" ? "destructive" : "outline"}>{item.priority}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.currentProof}</p>
                <p className="mt-2 text-sm">{item.remainingAction}</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  Owner: {item.owner}; maturity {scoreLabel(item.maturity)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5" data-trust-payment-proof="true">
          <h2 className="text-xl font-semibold">Payment proof status</h2>
          <div className="mt-4 space-y-3">
            {paymentFulfillmentStatusItems.map((item) => (
              <div key={item.item} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">{item.item}</h3>
                  <Badge variant={item.status === "done" ? "default" : item.status === "blocked" ? "destructive" : "outline"}>
                    {item.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.currentProof}</p>
                <p className="mt-2 text-sm">{item.remainingAction}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-4" data-trust-risk-register="true">
        <div>
          <h2 className="text-2xl font-semibold">Institutional risk register</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These rows are for buyer review. They do not certify legal compliance, WCAG conformance, or employment-selection validity.
          </p>
        </div>
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full divide-y text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Risk area</th>
                <th className="px-4 py-3 font-medium">Current control</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Review</th>
                <th className="px-4 py-3 font-medium">Does not prove</th>
              </tr>
            </thead>
            <tbody className="divide-y bg-background">
              {packet.riskRows.map((risk) => (
                <tr key={risk.id}>
                  <td className="px-4 py-3 font-medium">{risk.riskArea}</td>
                  <td className="px-4 py-3 text-muted-foreground">{risk.currentControl}</td>
                  <td className="px-4 py-3">{INSTITUTIONAL_READINESS_STATUS_LABELS[risk.status]}</td>
                  <td className="px-4 py-3">{REVIEW_STATUS_LABELS[risk.reviewStatus]}</td>
                  <td className="px-4 py-3 text-muted-foreground">{risk.doesNotProve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5" data-trust-manual-wcag-worksheet="true">
          <h2 className="text-xl font-semibold">Manual WCAG evidence worksheet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Automated smoke evidence is not a WCAG conformance claim. These rows define the manual proof still
            required before institution-facing delivery.
          </p>
          <div className="mt-4 space-y-3">
            {packet.manualWcagEvidenceRows.map((row) => (
              <div key={row.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">{row.checkpoint}</h3>
                  <Badge variant="outline">{INSTITUTIONAL_READINESS_STATUS_LABELS[row.status]}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{row.currentAutomatedProof}</p>
                <p className="mt-2 text-sm">{row.manualEvidenceNeeded}</p>
                <p className="mt-2 text-xs text-muted-foreground">Does not prove: {row.doesNotProve}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5" data-trust-buyer-signoff-checklist="true">
          <h2 className="text-xl font-semibold">Buyer acceptable-use signoff checklist</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Controlled pilots need explicit buyer confirmation before any client delivery. This checklist is
            governance evidence, not legal advice or compliance certification.
          </p>
          <div className="mt-4 space-y-3">
            {packet.buyerAcceptableUseSignoffRows.map((row) => (
              <div key={row.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">{row.gate}</h3>
                  <Badge variant="outline">{INSTITUTIONAL_READINESS_STATUS_LABELS[row.status]}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{row.buyerQuestion}</p>
                <p className="mt-2 text-sm">{row.requiredConfirmation}</p>
                <p className="mt-2 text-xs text-muted-foreground">Does not prove: {row.doesNotProve}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5" data-trust-ai-rmf="true">
          <h2 className="text-xl font-semibold">AI RMF control map</h2>
          <div className="mt-4 space-y-3">
            {packet.aiRmfControls.map((control) => (
              <div key={control.function} className="rounded-md border p-3">
                <Badge variant="secondary">{control.function}</Badge>
                <p className="mt-2 text-sm font-medium">{control.control}</p>
                <p className="mt-1 text-sm text-muted-foreground">{control.productEvidence}</p>
                <p className="mt-2 text-xs text-muted-foreground">Remaining gate: {control.remainingGate}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5" data-trust-function-review="true">
          <h2 className="text-xl font-semibold">Function governance review</h2>
          <p className="mt-2 text-sm text-muted-foreground">{supabaseFunctionGovernanceSummary.blocker}</p>
          <div className="mt-4 space-y-3">
            {functionSecurityReviewGroups.map((group) => (
              <div key={group.group} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">{group.group}</h3>
                  <Badge variant="outline">{scoreLabel(group.maturity)}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{group.currentControl}</p>
                <p className="mt-2 text-sm">{group.remainingRisk}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
