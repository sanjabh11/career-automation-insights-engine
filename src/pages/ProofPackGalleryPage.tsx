import { ArrowRight, Building2, CheckCircle2, Download, ExternalLink, FileText, GraduationCap, Mail, MapPin, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import NavigationPremium from "@/components/NavigationPremium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildInstitutionalReadinessCsv,
  buildInstitutionalReadinessPacket,
  INSTITUTIONAL_READINESS_STATUS_LABELS,
  renderInstitutionalReadinessPacketHtml,
} from "@/lib/institutionalReadinessPacket";
import {
  buildLocalLaborMarketSnapshotCsv,
  buildLocalLaborMarketSnapshotPacket,
  renderLocalLaborMarketSnapshotHtml,
} from "@/lib/localLaborMarketSnapshot";
import { REVIEW_STATUS_LABELS, type ReportReviewStatus } from "@/lib/reportEvidenceCards";
import { REPORT_SOURCE_REGISTRY, type SourceConfidence } from "@/lib/reportProvenance";

interface OutreachEvidence {
  claim: string;
  sourceIds: string[];
  confidence: SourceConfidence;
  reviewStatus: ReportReviewStatus;
  caveat: string;
  doesNotProve: string;
}

const galleryItems = [
  {
    id: "individual-transition-report",
    title: "Individual transition report",
    buyer: "Career changers, coach clients, alumni",
    route: "/automation-risk/accountant?utm_source=proof_pack_gallery&utm_medium=sample&utm_campaign=phase6_pilot",
    routeLabel: "Open occupation sample",
    icon: FileText,
    sample: "Accountant occupation proof pack",
    output: "Task exposure split, skill-change ledger, emerging role radar, evidence cards, and review state.",
    evidence: ["O*NET-backed occupation context", "Task exposure buckets", "Does not prove boundaries"],
    sourceIds: ["onet", "bls-ai-mlr-2025", "anthropic-observed-exposure"],
    confidence: "medium" as const,
    reviewStatus: "staff_review_required" as const,
    caveat: "Planning signal only. It must not be used as a guarantee of future employment or displacement.",
  },
  {
    id: "coach-branded-sample",
    title: "Coach-branded sample",
    buyer: "Career coaches, resume writers, counselors",
    route: "/sample-report?utm_source=proof_pack_gallery&utm_medium=sample&utm_campaign=phase6_pilot",
    routeLabel: "Build coach sample",
    icon: Users,
    sample: "White-label client proof pack",
    output: "A branded report artifact that can be reviewed before a client conversation or paid discovery call.",
    evidence: ["Evidence-card report body", "Coach consent capture", "Human review workflow"],
    sourceIds: ["nace-career-readiness", "nist-ai-rmf", "wcag-22"],
    confidence: "medium" as const,
    reviewStatus: "staff_review_required" as const,
    caveat: "Coach branding does not remove source caveats, review requirements, or employment-decision limits.",
  },
  {
    id: "workforce-csv-audit",
    title: "Workforce CSV audit",
    buyer: "Workforce boards, career centers, L&D teams",
    route: "/enterprise-dashboard?utm_source=proof_pack_gallery&utm_medium=sample&utm_campaign=phase6_pilot",
    routeLabel: "Open workforce audit",
    icon: Building2,
    sample: "Role-level CSV executive report",
    output: "CSV role exposure rollup with unmapped-row review, source caveats, and executive report skeleton.",
    evidence: ["Role rollup", "SOC/O*NET review queue", "Non-employment-decision disclaimer"],
    sourceIds: ["dol-ai-literacy-framework", "bls-emp", "ada-ai-hiring-guidance"],
    confidence: "medium" as const,
    reviewStatus: "staff_review_required" as const,
    caveat: "Use anonymized role rows for pilots. This is not employee ranking, hiring, firing, or layoff support.",
  },
  {
    id: "career-center-cohort-report",
    title: "Career-center cohort report",
    buyer: "Career centers, counselors, alumni teams",
    route: "/tools/counselor-reports?utm_source=proof_pack_gallery&utm_medium=sample&utm_campaign=phase6_pilot",
    routeLabel: "Open cohort pack",
    icon: GraduationCap,
    sample: "Aggregate student and alumni cohort proof pack",
    output: "Cohort transition segments with privacy, consent, advisor-review, and outcome-reporting boundaries.",
    evidence: ["Aggregate-only cohort rows", "FERPA-style privacy boundary", "Outcome-reporting caveat"],
    sourceIds: ["ferpa-student-privacy", "nace-career-readiness", "nace-first-destination", "dol-ai-literacy-framework"],
    confidence: "medium" as const,
    reviewStatus: "staff_review_required" as const,
    caveat: "Use anonymized aggregate segments only. This is not student ranking, placement-rate reporting, or individual advising replacement.",
  },
];

const occupationSamples = [
  { title: "Accountant", route: "/automation-risk/accountant", segment: "Finance and accounting", proof: "task split plus skill ledger" },
  { title: "Bookkeeper", route: "/automation-risk/bookkeeper", segment: "Small-business finance", proof: "bridge-role and reskilling signal" },
  { title: "Paralegal", route: "/automation-risk/paralegal", segment: "Legal services", proof: "human-led work boundary" },
  { title: "Customer Service Representative", route: "/automation-risk/customer-service-representative", segment: "Operations", proof: "AI-assisted workflow signal" },
  { title: "Software Developer", route: "/automation-risk/software-developer", segment: "Technology", proof: "augmentation-heavy task framing" },
  { title: "Teacher", route: "/automation-risk/teacher", segment: "Education", proof: "human-led trust boundary" },
];

const outreachSegments = [
  {
    segment: "Career coaches",
    owner: "Founder-led LinkedIn and direct email",
    offer: "10 branded proof packs plus one feedback call",
    route: "/sample-report",
    opener:
      "I am piloting a source-labeled AI work-transition proof pack that separates task exposure, skill changes, and emerging role options with evidence cards. Would you review one sample for a role your clients ask about?",
    successMetric: "3 sample requests, 2 feedback calls, 1 paid pilot conversation",
    sourceIds: ["nace-career-readiness", "nist-ai-rmf", "wcag-22"],
    confidence: "medium" as const,
    reviewStatus: "staff_review_required" as const,
    caveat: "Coach pilots still need client consent, source caveats, and review before delivery.",
    doesNotProve: "That a coach should present the report as validated assessment, legal advice, or guaranteed client outcome.",
  },
  {
    segment: "Career centers",
    owner: "Counselor and alumni-services outreach",
    offer: "One aggregate student/alumni cohort pack plus counselor review notes",
    route: "/tools/counselor-reports",
    opener:
      "I am testing a reviewed career-transition artifact for students and alumni that explains what changed, what to learn next, and what the report does not prove. Could I send a sample for counselor feedback?",
    successMetric: "2 counselor reviews and one workshop-fit discussion",
    sourceIds: ["nace-career-readiness", "nace-first-destination", "ferpa-student-privacy", "dol-ai-literacy-framework", "wcag-22"],
    confidence: "medium" as const,
    reviewStatus: "staff_review_required" as const,
    caveat: "Career-center pilots should keep reports aggregate-only, educational, privacy-reviewed, and advisor-reviewed.",
    doesNotProve: "That the report can replace institutional advising, accommodation review, student outcome measurement, or FERPA/data-governance review.",
  },
  {
    segment: "Workforce boards and L&D",
    owner: "Workforce pilot outreach",
    offer: "10-25 role CSV audit with executive proof-pack skeleton",
    route: "/enterprise-dashboard",
    opener:
      "I am building a workforce CSV audit that summarizes role-level AI exposure without ranking employees or making employment decisions. Would a bounded pilot across 10-25 role titles help your planning team?",
    successMetric: "1 anonymized CSV pilot and one review-owner identified",
    sourceIds: ["dol-ai-literacy-framework", "bls-ai-mlr-2025", "ada-ai-hiring-guidance"],
    confidence: "medium" as const,
    reviewStatus: "staff_review_required" as const,
    caveat: "Workforce pilots must use anonymized role rows and remain planning artifacts.",
    doesNotProve: "That any individual employee should be hired, fired, promoted, ranked, or compensated differently.",
  },
];

const researchSignals = [
  {
    label: "NACE career readiness",
    sourceId: "nace-career-readiness",
    url: "https://www.naceweb.org/career-readiness/competencies/career-readiness-defined",
    takeaway: "Career centers and employers need skills language that connects education, work, and lifelong career management.",
  },
  {
    label: "NACE first-destination standards",
    sourceId: "nace-first-destination",
    url: "https://www.naceweb.org/job-market/graduate-outcomes/first-destination/standards-and-protocols/",
    takeaway: "Career-center outcome reporting needs standards and must stay separate from planning artifacts until outcomes are collected.",
  },
  {
    label: "FERPA student privacy",
    sourceId: "ferpa-student-privacy",
    url: "https://studentprivacy.ed.gov/content/personally-identifiable-information-education-records",
    takeaway: "Cohort reports must avoid student PII unless institutional consent, access, retention, and disclosure controls are approved.",
  },
  {
    label: "DOL AI literacy framework",
    sourceId: "dol-ai-literacy-framework",
    url: "https://www.dol.gov/agencies/eta/advisories/ten-07-25",
    takeaway: "Workforce and education systems need role-relevant AI literacy guidance that can adapt to local labor-market context.",
  },
  {
    label: "Lightcast positioning",
    sourceId: "lightcast",
    url: "https://lightcast.io/",
    takeaway: "Enterprise buyers expect labor-market intelligence, taxonomies, skills, and workforce strategy context.",
  },
  {
    label: "Workera positioning",
    sourceId: "workera-positioning",
    url: "https://www.workera.ai/product-overview",
    takeaway: "Skills intelligence products compete on evidence, verification, defensibility, and integrations.",
  },
];

const outreachFunctionalityAssessment = [
  {
    capability: "Coach-branded sample reports",
    laymanValue: "A coach can create a professional sample report for a client conversation.",
    outreachUse: "Best first outreach offer for coaches, resume writers, and counselors.",
    currentProof: "/sample-report, consent capture, source-labeled sample HTML, Supabase lead/artifact save when configured.",
    maturity: 4.3,
    nextGap: "Add authenticated coach accounts, logo upload, paid report credits, and email follow-up automation.",
    sourceIds: ["nace-career-readiness", "nist-ai-rmf", "wcag-22"],
  },
  {
    capability: "Individual occupation proof packs",
    laymanValue: "A user can see which parts of a job may be automated, assisted by AI, or still human-led.",
    outreachUse: "Useful for SEO traffic, LinkedIn demos, and lead magnets by occupation.",
    currentProof: "/automation-risk/:occupation renders proof-pack sections with caveats and evidence cards.",
    maturity: 4.1,
    nextGap: "Attach live source snapshots and stronger local labor-market rows before region-specific claims.",
    sourceIds: ["onet", "bls-ai-mlr-2025", "anthropic-observed-exposure"],
  },
  {
    capability: "Resume work-transition proof report",
    laymanValue: "A job seeker can turn resume text into a bounded transition report with deletion and review boundaries.",
    outreachUse: "Strong free tool for coaches and individuals, but must stay privacy-first.",
    currentProof: "/tools/resume-analyzer, parser boundary, downloadable proof report, redacted artifact persistence for signed-in users.",
    maturity: 4.0,
    nextGap: "Run authenticated live e2e with a synthetic test user; add production PDF/DOC/DOCX parser and malware-scan policy.",
    sourceIds: ["owasp-file-upload", "supabase-edge-functions", "ada-ai-hiring-guidance"],
  },
  {
    capability: "Workforce CSV role audit",
    laymanValue: "A workforce team can upload role titles and get a role-level exposure summary without ranking employees.",
    outreachUse: "Best pilot for workforce boards, L&D teams, and small enterprise planning.",
    currentProof: "/enterprise-dashboard, CSV parser, role rollup, unmapped review queue, executive HTML report.",
    maturity: 4.0,
    nextGap: "Add richer SOC matching, department recommendations, signed delivery, and live table checksum proof.",
    sourceIds: ["dol-ai-literacy-framework", "bls-emp", "ada-ai-hiring-guidance"],
  },
  {
    capability: "Career-center cohort proof pack",
    laymanValue: "A counselor can discuss aggregate student or alumni transition themes without exposing individual records.",
    outreachUse: "Good for workshops, alumni services, and career-center feedback pilots.",
    currentProof: "/tools/counselor-reports exports aggregate-only cohort proof packs with privacy boundaries.",
    maturity: 3.9,
    nextGap: "Add roster consent, small-cell suppression enforcement, persistence, and institution-specific review notes.",
    sourceIds: ["ferpa-student-privacy", "nace-first-destination", "nace-career-readiness"],
  },
  {
    capability: "Source and caveat evidence cards",
    laymanValue: "Every major claim can show where it came from, how confident it is, and what it does not prove.",
    outreachUse: "The main differentiator against generic AI career advice.",
    currentProof: "Shared evidence-card model, report provenance registry, source manifest, and commercial verifiers.",
    maturity: 4.6,
    nextGap: "Add scheduled refresh, live imported-table checksums, and provider-backed source snapshots per artifact.",
    sourceIds: ["nist-ai-rmf", "lightcast", "workera-positioning"],
  },
  {
    capability: "Institutional readiness packet",
    laymanValue: "A buyer can review risk, accessibility, governance, and employment-decision boundaries before a pilot.",
    outreachUse: "Helps serious institutions say yes to a bounded pilot without overclaiming compliance.",
    currentProof: "Downloadable HTML/CSV readiness packet with AI RMF, WCAG, live proof blockers, and buyer risk rows.",
    maturity: 4.2,
    nextGap: "Complete manual WCAG evidence, signed buyer acceptable-use signoff, and legal review for employment-adjacent pilots.",
    sourceIds: ["nist-ai-rmf", "wcag-22", "eeoc-employment-selection-procedures"],
  },
  {
    capability: "Lead capture and lead ops",
    laymanValue: "People requesting reports can become trackable leads instead of disappearing after a download.",
    outreachUse: "Turns sample reports and SEO traffic into a sales pipeline.",
    currentProof: "Supabase lead capture, consent text, offline redacted retry queue, staff lead ops, CSV export.",
    maturity: 4.0,
    nextGap: "Add CRM/email integration, deployed-domain analytics, owner assignment, sequence status, and unsubscribe handling.",
    sourceIds: ["nist-ai-rmf", "wcag-22", "llm-output"],
  },
  {
    capability: "Local labor-market snapshot boundary",
    laymanValue: "The app can show what local data would be needed before claiming local demand.",
    outreachUse: "Useful for workforce boards and regional pilots where local context matters.",
    currentProof: "Downloadable local-market snapshot pack with source vintage, geography, query, caveat, and reviewer fields.",
    maturity: 3.6,
    nextGap: "Connect live OEWS, LAUS, QCEW, ACS, CareerOneStop, and licensed posting adapters per buyer geography.",
    sourceIds: ["bls-oews", "bls-laus", "bls-qcew", "careeronestop-api", "census-acs-api"],
  },
  {
    capability: "Outreach CSV starter pack",
    laymanValue: "The founder can export pilot segments, messages, offers, and success metrics for manual CRM use.",
    outreachUse: "Fastest practical way to begin small controlled outreach.",
    currentProof: "Proof-pack gallery exports a CRM CSV for coach, career-center, and workforce-board pilots.",
    maturity: 3.8,
    nextGap: "Add tracked campaign links, response status, follow-up templates, calendar booking, and A/B message results.",
    sourceIds: ["nace-career-readiness", "dol-ai-literacy-framework", "lightcast"],
  },
];

const outreachCampaignPhases = [
  {
    phase: "1. Proof refresh",
    focus: "Make sure claims match live proof.",
    successPoint: "Commercial gate, live closeout gate, and source/caveat pages are green.",
    maturity: 4.2,
    remaining: "Live authenticated e2e and manual WCAG notes.",
  },
  {
    phase: "2. Founder-led validation",
    focus: "Ask coaches and counselors to review sample artifacts, not buy a large platform.",
    successPoint: "10 reviews, 3 discovery calls, 1 paid pilot conversation.",
    maturity: 3.8,
    remaining: "Tracked links, feedback form, and CRM status updates.",
  },
  {
    phase: "3. Workforce pilot",
    focus: "Run anonymized role-level CSV audits for planning teams.",
    successPoint: "One 10-25 role CSV pilot with buyer review-owner identified.",
    maturity: 3.7,
    remaining: "SOC review service, signed packet delivery, and local labor-market evidence.",
  },
  {
    phase: "4. Paid proof-pack offer",
    focus: "Convert validated segments into bounded paid packages.",
    successPoint: "Pricing page links to report credits or pilot packages with fulfillment state.",
    maturity: 3.0,
    remaining: "Stripe/report credit fulfillment and invoice-ready delivery.",
  },
  {
    phase: "5. Scaled outreach",
    focus: "Move from manual founder outreach to repeatable campaigns.",
    successPoint: "CRM/email sequences, analytics, unsubscribe, and buyer-specific case-study artifacts.",
    maturity: 2.5,
    remaining: "Campaign automation, conversion dashboards, and buyer-specific landing pages.",
  },
];

const outreachEvidenceCards: OutreachEvidence[] = [
  {
    claim: "Bounded coach and career-center pilots are the right first buyer motion for reviewed proof packs.",
    sourceIds: ["nace-career-readiness", "nist-ai-rmf", "wcag-22"],
    confidence: "medium",
    reviewStatus: "staff_review_required",
    caveat: "The evidence supports career-readiness and trustworthy-review framing; it does not prove conversion rate or willingness to pay.",
    doesNotProve: "That the tool is a validated assessment, an institutional advising replacement, or a guaranteed paid pilot.",
  },
  {
    claim: "Workforce CSV audits should stay role-level, anonymized, and planning-only until live governance and data validation are complete.",
    sourceIds: ["dol-ai-literacy-framework", "bls-ai-mlr-2025", "ada-ai-hiring-guidance"],
    confidence: "medium",
    reviewStatus: "staff_review_required",
    caveat: "The source base supports AI-literacy and planning boundaries, not employee-level decisions.",
    doesNotProve: "That any worker should be ranked, selected, terminated, promoted, or compensated differently.",
  },
  {
    claim: "The public gallery is a market-test artifact, not proof of Lightcast-level market intelligence.",
    sourceIds: ["lightcast", "serpapi", "llm-output"],
    confidence: "medium",
    reviewStatus: "auto_generated",
    caveat: "Licensed job-posting or provider-backed validation is not integrated in this repository.",
    doesNotProve: "That role-radar claims are backed by live postings, licensed provider data, or jurisdiction-specific demand.",
  },
  {
    claim: "Career-center cohort proof packs must stay aggregate-only and separate from placement or first-destination outcome reporting.",
    sourceIds: ["ferpa-student-privacy", "nace-first-destination", "nace-career-readiness"],
    confidence: "medium",
    reviewStatus: "staff_review_required",
    caveat: "Cohort reporting can support workshops and advising planning, but student PII, outcome claims, and institutional reporting require separate governance.",
    doesNotProve: "That the tool is FERPA-compliant, a placement-rate report, or a validated student outcome measurement system.",
  },
];

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function sourceLabels(sourceIds: string[]): string {
  return sourceIds
    .map((sourceId) => REPORT_SOURCE_REGISTRY.find((source) => source.id === sourceId)?.label || sourceId)
    .join("; ");
}

function buildOutreachCsv(): string {
  const header = [
    "segment",
    "owner",
    "offer",
    "sample_route",
    "opening_message",
    "success_metric",
    "source_ids",
    "sources",
    "confidence",
    "review_state",
    "caveat",
    "does_not_prove",
    "boundary",
  ];
  const rows = outreachSegments.map((segment) => [
    segment.segment,
    segment.owner,
    segment.offer,
    segment.route,
    segment.opener,
    segment.successMetric,
    segment.sourceIds.join(";"),
    sourceLabels(segment.sourceIds),
    segment.confidence,
    REVIEW_STATUS_LABELS[segment.reviewStatus],
    segment.caveat,
    segment.doesNotProve,
    "Planning artifact only; not hiring, firing, layoff, or Lightcast-level market intelligence.",
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function downloadOutreachCsv() {
  const blob = new Blob([`${buildOutreachCsv()}\n`], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ai-work-transition-proof-pack-outreach.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function downloadInstitutionalReadinessHtml() {
  const packet = buildInstitutionalReadinessPacket();
  const blob = new Blob([renderInstitutionalReadinessPacketHtml(packet)], { type: "text/html;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "institutional-readiness-proof-pack.html";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function downloadInstitutionalReadinessCsv() {
  const packet = buildInstitutionalReadinessPacket();
  const blob = new Blob([`${buildInstitutionalReadinessCsv(packet)}\n`], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "institutional-readiness-risk-register.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function downloadLocalMarketSnapshotHtml() {
  const packet = buildLocalLaborMarketSnapshotPacket();
  const blob = new Blob([renderLocalLaborMarketSnapshotHtml(packet)], { type: "text/html;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "local-labor-market-snapshot-pack.html";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function downloadLocalMarketSnapshotCsv() {
  const packet = buildLocalLaborMarketSnapshotPacket();
  const blob = new Blob([`${buildLocalLaborMarketSnapshotCsv(packet)}\n`], { type: "text/csv;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "local-labor-market-snapshot-sources.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function ProofPackGalleryPage() {
  const institutionalPacket = buildInstitutionalReadinessPacket();
  const topInstitutionalRisks = institutionalPacket.riskRows.slice(0, 4);
  const localMarketPacket = buildLocalLaborMarketSnapshotPacket();
  const localMarketPreviewRows = localMarketPacket.sourceRows.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <NavigationPremium />
      <main data-proof-pack-gallery="phase-6-outreach" className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <Badge className="mb-5 border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
              Source-labeled AI work transition proof packs
            </Badge>
            <h1 className="max-w-4xl text-4xl font-bold tracking-normal text-white sm:text-5xl">
              Proof-pack gallery for coach, career-center, and workforce pilots
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Four buyer-ready sample paths show what changed, why it changed, what source supports it, what action to take next, and what the artifact must not be used for.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                <Link to="/sample-report?utm_source=proof_pack_gallery&utm_medium=hero&utm_campaign=phase6_pilot">
                  Generate coach sample
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800">
                <Link to="/enterprise-dashboard?utm_source=proof_pack_gallery&utm_medium=hero&utm_campaign=phase6_pilot">
                  Open workforce audit
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-emerald-300" />
              <div>
                <h2 className="text-xl font-semibold text-white">Pilot claim boundary</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Planning artifact only. These samples are for coaching, career-center, and workforce discussion. They do not predict layoffs, rank employees, make employment decisions, or claim licensed labor-market intelligence depth.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {galleryItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.id} data-proof-pack-gallery-card={item.id} className="border-slate-800 bg-slate-900 text-slate-100">
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl text-white">{item.title}</CardTitle>
                  <CardDescription className="text-slate-400">{item.buyer}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Sample artifact</div>
                    <div className="mt-1 font-medium text-slate-100">{item.sample}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{item.output}</p>
                  </div>
                  <div className="space-y-2">
                    {item.evidence.map((evidence) => (
                      <div key={evidence} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        {evidence}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-md border border-slate-700 bg-slate-950/70 p-3 text-xs leading-5 text-slate-300">
                    <div><span className="font-semibold text-slate-100">Sources:</span> {sourceLabels(item.sourceIds)}</div>
                    <div><span className="font-semibold text-slate-100">Confidence:</span> {item.confidence}</div>
                    <div><span className="font-semibold text-slate-100">Review state:</span> {REVIEW_STATUS_LABELS[item.reviewStatus]}</div>
                  </div>
                  <p className="rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
                    {item.caveat}
                  </p>
                  <Button asChild className="w-full bg-slate-100 text-slate-950 hover:bg-white">
                    <Link to={item.route}>
                      {item.routeLabel}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mt-12 rounded-lg border border-slate-800 bg-slate-900 p-5" data-institutional-readiness-gallery="true">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Institutional readiness packet</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                A buyer-review artifact for AI RMF controls, employment-decision boundaries, accessibility gates, live proof blockers, and source-labeled risk rows.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={downloadInstitutionalReadinessHtml} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                <Download className="mr-2 h-4 w-4" />
                Trust HTML
              </Button>
              <Button type="button" onClick={downloadInstitutionalReadinessCsv} variant="outline" className="border-slate-600 bg-slate-950 text-slate-100 hover:bg-slate-800">
                <Download className="mr-2 h-4 w-4" />
                Risk CSV
              </Button>
            </div>
          </div>

          <div className="mt-5 rounded-md border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100" data-institutional-readiness-boundary="true">
            {institutionalPacket.statusSummary}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            {topInstitutionalRisks.map((risk) => (
              <article key={risk.id} className="rounded-md border border-slate-800 bg-slate-950/70 p-4" data-institutional-risk-preview={risk.id}>
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200">{risk.confidence} confidence</Badge>
                  <Badge variant="outline" className="border-slate-600 text-slate-300">{INSTITUTIONAL_READINESS_STATUS_LABELS[risk.status]}</Badge>
                </div>
                <h3 className="mt-4 font-semibold leading-6 text-white">{risk.riskArea}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{risk.buyerConcern}</p>
                <p className="mt-3 text-xs leading-5 text-slate-400"><span className="font-semibold text-slate-200">Sources:</span> {sourceLabels(risk.sourceIds)}</p>
                <p className="mt-2 text-xs leading-5 text-amber-100"><span className="font-semibold">Does not prove:</span> {risk.doesNotProve}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-3 text-sm leading-6 text-slate-300 lg:grid-cols-3">
            <div className="rounded-md border border-slate-800 bg-slate-950/60 p-4" data-ai-rmf-control-map="true">
              <h3 className="font-semibold text-white">AI RMF control map</h3>
              <p className="mt-2">Govern, Map, Measure, and Manage rows connect product evidence to remaining buyer gates.</p>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/60 p-4" data-wcag-accessibility-gate="true">
              <h3 className="font-semibold text-white">WCAG 2.2 accessibility gate</h3>
              <p className="mt-2">Hosted smoke proof is present; manual screen-reader, focus, target-size, contrast, and error-state notes remain required.</p>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-950/60 p-4" data-employment-decision-boundary="true">
              <h3 className="font-semibold text-white">Employment decision boundary</h3>
              <p className="mt-2">No hiring, firing, promotion, compensation, layoff, screening, eligibility, or worker-ranking use.</p>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5" data-local-market-snapshot-gallery="true">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-200">
                  <MapPin className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Local market snapshot pack</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Package the exact geography, source vintage, query metadata, caveats, and reviewer notes required before local-demand language becomes client-ready.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                <Button type="button" onClick={downloadLocalMarketSnapshotHtml} className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Snapshot HTML
                </Button>
                <Button type="button" onClick={downloadLocalMarketSnapshotCsv} variant="outline" className="w-full border-slate-600 bg-slate-950 text-slate-100 hover:bg-slate-800 sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Snapshot CSV
                </Button>
              </div>
            </div>
            <div className="mt-5 rounded-md border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100" data-local-market-snapshot-boundary="true">
              {localMarketPacket.statusSummary}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {localMarketPreviewRows.map((row) => (
                <article key={row.id} className="rounded-md border border-slate-800 bg-slate-950/70 p-4" data-local-market-snapshot-row={row.id}>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200">{row.confidence} confidence</Badge>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">{REVIEW_STATUS_LABELS[row.reviewStatus]}</Badge>
                  </div>
                  <h3 className="mt-3 font-semibold leading-6 text-white">{row.label}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-300"><span className="font-semibold text-slate-100">Source:</span> {sourceLabels([row.sourceId])}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-300"><span className="font-semibold text-slate-100">Caveat:</span> {row.caveat}</p>
                  <p className="mt-2 text-xs leading-5 text-amber-100"><span className="font-semibold">Does not prove:</span> {row.doesNotProve}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">CRM import pack</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Export a bounded pilot list with segment, offer, sample route, opener, success metric, and decision boundary for manual CRM import.
                </p>
              </div>
              <Button type="button" onClick={downloadOutreachCsv} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                <Download className="mr-2 h-4 w-4" />
                CRM CSV
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              {outreachSegments.map((segment) => (
                <div key={segment.segment} data-outreach-segment={segment.segment} className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-white">{segment.segment}</h3>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">{segment.offer}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{segment.opener}</p>
                  <div className="mt-3 text-xs text-slate-400">Success point: {segment.successMetric}</div>
                  <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-300 sm:grid-cols-2">
                    <div><span className="font-semibold text-slate-100">Sources:</span> {sourceLabels(segment.sourceIds)}</div>
                    <div><span className="font-semibold text-slate-100">Review state:</span> {REVIEW_STATUS_LABELS[segment.reviewStatus]}</div>
                    <div><span className="font-semibold text-slate-100">Confidence:</span> {segment.confidence}</div>
                    <div><span className="font-semibold text-slate-100">Caveat:</span> {segment.caveat}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
            <h2 className="text-2xl font-semibold text-white">Occupation sample shelf</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Use these samples for outreach links until the deployed gallery is connected to analytics and a CRM sequence.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {occupationSamples.map((sample) => (
                <Link
                  key={sample.title}
                  to={`${sample.route}?utm_source=proof_pack_gallery&utm_medium=occupation_shelf&utm_campaign=phase6_pilot`}
                  className="rounded-md border border-slate-800 bg-slate-950/60 p-4 transition hover:border-emerald-400/60 hover:bg-slate-900"
                >
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <GraduationCap className="h-4 w-4 text-emerald-300" />
                    {sample.segment}
                  </div>
                  <div className="mt-2 font-semibold text-white">{sample.title}</div>
                  <div className="mt-1 text-sm text-slate-300">{sample.proof}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 rounded-lg border border-slate-800 bg-slate-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Research-backed outreach stance</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                The phase focus is a narrow proof-pack wedge, not a full HCM, LMS, ATS, or labor-market data platform.
              </p>
            </div>
            <Button asChild variant="outline" className="border-slate-600 bg-slate-950 text-slate-100 hover:bg-slate-800">
              <Link to="/privacy">
                <Mail className="mr-2 h-4 w-4" />
                Review privacy boundary
              </Link>
            </Button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {researchSignals.map((signal) => (
              <a
                key={signal.label}
                href={signal.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-slate-800 bg-slate-950/60 p-4 transition hover:border-emerald-400/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">{signal.label}</h3>
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{signal.takeaway}</p>
                <p className="mt-3 text-xs text-slate-500">Source ID: {signal.sourceId}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-lg border border-slate-800 bg-slate-900 p-5" data-outreach-functionality-assessment="true">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Outreach functionality assessment</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Plain-language maturity view for what can be marketed now, what proof exists in the app, and what must be finished before scaled outreach.
              </p>
            </div>
            <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
              1 = idea, 5 = market-ready
            </Badge>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-3 pr-4 font-semibold">Functionality</th>
                  <th className="py-3 pr-4 font-semibold">Layman value</th>
                  <th className="py-3 pr-4 font-semibold">Outreach use</th>
                  <th className="py-3 pr-4 font-semibold">Current proof</th>
                  <th className="py-3 pr-4 font-semibold">Maturity</th>
                  <th className="py-3 pr-4 font-semibold">Next gap</th>
                </tr>
              </thead>
              <tbody>
                {outreachFunctionalityAssessment.map((row) => (
                  <tr key={row.capability} className="border-b border-slate-800/80 align-top">
                    <td className="py-4 pr-4 font-semibold text-white">{row.capability}</td>
                    <td className="py-4 pr-4 leading-6 text-slate-300">{row.laymanValue}</td>
                    <td className="py-4 pr-4 leading-6 text-slate-300">{row.outreachUse}</td>
                    <td className="py-4 pr-4 leading-6 text-slate-300">{row.currentProof}</td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 font-semibold text-emerald-200">
                          {row.maturity.toFixed(1)}/5
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{sourceLabels(row.sourceIds)}</p>
                    </td>
                    <td className="py-4 pr-4 leading-6 text-amber-100">{row.nextGap}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12 rounded-lg border border-slate-800 bg-slate-900 p-5" data-outreach-phase-plan="true">
          <h2 className="text-2xl font-semibold text-white">Phase-wise outreach program</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Start with reviewed proof artifacts and buyer feedback, then move into paid pilots only after live trust gates and campaign tracking are in place.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            {outreachCampaignPhases.map((phase) => (
              <article key={phase.phase} className="rounded-md border border-slate-800 bg-slate-950/70 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">{phase.phase}</div>
                <h3 className="mt-3 font-semibold leading-6 text-white">{phase.focus}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{phase.successPoint}</p>
                <div className="mt-4 rounded-md border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm font-semibold text-emerald-200">
                  {phase.maturity.toFixed(1)}/5 maturity
                </div>
                <p className="mt-3 text-xs leading-5 text-amber-100">{phase.remaining}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-lg border border-slate-800 bg-slate-900 p-5" data-phase6-evidence-cards="true">
          <h2 className="text-2xl font-semibold text-white">Outreach evidence cards</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Each commercial recommendation stays source-labeled and review-bound until live CRM, deployed analytics, and buyer feedback prove stronger claims.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {outreachEvidenceCards.map((card) => (
              <article key={card.claim} className="rounded-md border border-slate-800 bg-slate-950/70 p-4" data-phase6-evidence-card="true">
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-emerald-400/30 bg-emerald-400/10 text-emerald-200">{card.confidence} confidence</Badge>
                  <Badge variant="outline" className="border-slate-600 text-slate-300">{REVIEW_STATUS_LABELS[card.reviewStatus]}</Badge>
                </div>
                <h3 className="mt-4 font-semibold leading-6 text-white">{card.claim}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300"><span className="font-semibold text-slate-100">Sources:</span> {sourceLabels(card.sourceIds)}</p>
                <p className="mt-3 text-sm leading-6 text-slate-300"><span className="font-semibold text-slate-100">Caveat:</span> {card.caveat}</p>
                <p className="mt-3 text-sm leading-6 text-amber-100"><span className="font-semibold">Does not prove:</span> {card.doesNotProve}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
