import {
  createEvidenceCard,
  getEvidenceCardCss,
  renderEvidenceCardsHtml,
  type EvidenceCard,
  type EvidenceConfidence,
  type ReportReviewStatus,
  REVIEW_STATUS_LABELS,
} from "@/lib/reportEvidenceCards";
import { REPORT_SOURCE_REGISTRY } from "@/lib/reportProvenance";

export type InstitutionalReadinessStatus =
  | "implemented_local"
  | "hosted_ci_verified"
  | "blocked_live_credentials"
  | "buyer_policy_required"
  | "future_adapter_required";

export interface InstitutionalRiskRow {
  id: string;
  riskArea: string;
  buyerConcern: string;
  currentControl: string;
  currentEvidence: string;
  status: InstitutionalReadinessStatus;
  sourceIds: string[];
  confidence: EvidenceConfidence;
  reviewStatus: ReportReviewStatus;
  caveat: string;
  doesNotProve: string;
  nextAction: string;
}

export interface AiRmfControlRow {
  function: "GOVERN" | "MAP" | "MEASURE" | "MANAGE";
  control: string;
  productEvidence: string;
  sourceIds: string[];
  reviewStatus: ReportReviewStatus;
  remainingGate: string;
}

export interface ManualWcagEvidenceRow {
  id: string;
  checkpoint: string;
  currentAutomatedProof: string;
  manualEvidenceNeeded: string;
  reviewerRole: string;
  status: InstitutionalReadinessStatus;
  sourceIds: string[];
  caveat: string;
  doesNotProve: string;
}

export interface BuyerAcceptableUseSignoffRow {
  id: string;
  gate: string;
  buyerQuestion: string;
  requiredConfirmation: string;
  owner: string;
  status: InstitutionalReadinessStatus;
  sourceIds: string[];
  caveat: string;
  doesNotProve: string;
}

export interface InstitutionalReadinessPacket {
  id: string;
  title: string;
  generatedAt: string;
  intendedUse: string;
  statusSummary: string;
  riskRows: InstitutionalRiskRow[];
  aiRmfControls: AiRmfControlRow[];
  manualWcagEvidenceRows: ManualWcagEvidenceRow[];
  buyerAcceptableUseSignoffRows: BuyerAcceptableUseSignoffRow[];
  accessibilityGate: string[];
  employmentDecisionBoundary: string[];
  institutionalAcceptanceGates: string[];
  evidenceCards: EvidenceCard[];
}

export const INSTITUTIONAL_READINESS_STATUS_LABELS: Record<InstitutionalReadinessStatus, string> = {
  implemented_local: "Implemented in local proof pack",
  hosted_ci_verified: "Hosted CI verified",
  blocked_live_credentials: "Blocked on live credentials or migration",
  buyer_policy_required: "Buyer policy/review required",
  future_adapter_required: "Future adapter or licensed data required",
};

const sourceIds = {
  governance: ["nist-ai-rmf", "iso-42001", "llm-output"],
  employment: ["ada-ai-hiring-guidance", "eeoc-employment-selection-procedures", "cfpb-employment-algorithmic-scores", "eu-ai-act-annex-iii-high-risk"],
  accessibility: ["wcag-22", "wcag2ict-22", "ada-ai-hiring-guidance"],
  parser: ["owasp-file-upload", "supabase-edge-functions", "nist-ai-rmf", "ada-ai-hiring-guidance"],
  data: ["onet", "onet-task-ratings", "bls-oews", "bls-laus", "bls-qcew"],
  market: ["lightcast", "esco", "serpapi", "llm-output"],
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sourceLabels(ids: string[]): string {
  return ids
    .map((sourceId) => {
      const source = REPORT_SOURCE_REGISTRY.find((entry) => entry.id === sourceId);
      return source ? `${source.label} (${source.confidence})` : sourceId;
    })
    .join("; ");
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildInstitutionalReadinessPacket(generatedAt: Date | string = new Date()): InstitutionalReadinessPacket {
  const generatedAtIso = generatedAt instanceof Date ? generatedAt.toISOString() : generatedAt;
  const riskRows: InstitutionalRiskRow[] = [
    {
      id: "source-traceability",
      riskArea: "Source traceability",
      buyerConcern: "Institutional reviewers need to know which source supports each major report claim.",
      currentControl: "Evidence cards, source manifest, report provenance, checksum manifest, and source verification gate are wired into the commercial verifier.",
      currentEvidence: "npm run verify:commercial, npm run verify:sources, and data-provenance checksums cover commercial proof-pack artifacts.",
      status: "hosted_ci_verified",
      sourceIds: sourceIds.governance,
      confidence: "high",
      reviewStatus: "staff_reviewed",
      caveat: "Traceability proves source labeling and local artifact integrity, not source correctness beyond the verified official pages and imported data boundaries.",
      doesNotProve: "Legal compliance, validated employment-selection use, or licensed labor-market intelligence depth.",
      nextAction: "Attach hosted CI run URLs and source snapshots to each buyer delivery packet.",
    },
    {
      id: "employment-decision-misuse",
      riskArea: "Employment decision misuse",
      buyerConcern: "Scores or reports could be misused for hiring, firing, promotion, compensation, layoff, screening, or eligibility decisions.",
      currentControl: "Commercial reports and resume artifacts show non-employment-decision disclaimers, human-review states, and does-not-prove boundaries.",
      currentEvidence: "Report evidence verifier checks employment-decision boundaries across occupation, coach, workforce, counselor, and resume flows.",
      status: "buyer_policy_required",
      sourceIds: sourceIds.employment,
      confidence: "high",
      reviewStatus: "staff_review_required",
      caveat: "The product is intentionally positioned as a planning and coaching artifact unless a buyer establishes a separately validated employment-selection program.",
      doesNotProve: "Job-relatedness, business necessity, adverse-impact validation, accommodation readiness, FCRA readiness, or lawful selection use.",
      nextAction: "Add buyer-specific acceptable-use policy signoff before any institutional pilot with employee or applicant data.",
    },
    {
      id: "accessibility-readiness",
      riskArea: "Accessibility readiness",
      buyerConcern: "Commercial report and lead flows must be usable by people relying on keyboard, assistive technology, accessible authentication, and predictable controls.",
      currentControl: "Commercial accessibility smoke checks H1, landmarks, horizontal overflow, accessible control names, visible keyboard tab stops, and writes a WCAG 2.2 audit packet for scoped commercial routes.",
      currentEvidence: "npm run verify:commercial-a11y is included in the hosted commercial proof-pack gate and writes docs/commercialization/commercial-accessibility-audit-latest.md/json.",
      status: "hosted_ci_verified",
      sourceIds: sourceIds.accessibility,
      confidence: "medium",
      reviewStatus: "staff_review_required",
      caveat: "Automated and smoke checks do not equal a full WCAG 2.2 conformance audit.",
      doesNotProve: "Full WCAG 2.2 AA conformance, screen-reader parity, contrast coverage, accessible-authentication completeness, or accommodation workflow adequacy.",
      nextAction: "Complete the manual checklist in commercial-accessibility-audit-latest.md before institutional delivery.",
    },
    {
      id: "privacy-deletion-proof",
      riskArea: "Privacy and deletion proof",
      buyerConcern: "Resume and career reports may contain sensitive individual career data and must not store raw resume text unnecessarily.",
      currentControl: "Resume proof artifacts are redacted, raw resume text is not stored by the proof artifact path, and app-level deletion receipt functions are implemented locally.",
      currentEvidence: "Resume proof report UI, deletion receipt client, Supabase migrations, and live Supabase verifier are in the commercial gate.",
      status: "blocked_live_credentials",
      sourceIds: ["nist-ai-rmf", "cfpb-employment-algorithmic-scores", "llm-output"],
      confidence: "medium",
      reviewStatus: "staff_review_required",
      caveat: "The live target still needs credentialed migration application and authenticated e2e proof.",
      doesNotProve: "Deletion of model-provider logs, browser downloads, exports, backups, emails, or third-party copies.",
      nextAction: "Apply the Supabase deployment packet with SUPABASE_DB_PASSWORD and rerun live commercial and O*NET proof gates.",
    },
    {
      id: "human-review-readiness",
      riskArea: "Human review readiness",
      buyerConcern: "Auto-generated recommendations need review before a coach, counselor, workforce board, or L&D team treats them as client-ready.",
      currentControl: "Section-level review states, artifact client-ready logging, non-legal review attestation, and delivery packets are implemented.",
      currentEvidence: "Lead ops can log section-reviewed, section-client-ready, and artifact-client-ready events with actor identity and evidence IDs.",
      status: "implemented_local",
      sourceIds: sourceIds.governance,
      confidence: "high",
      reviewStatus: "staff_reviewed",
      caveat: "The attestation is a product-readiness trace, not a legal signature or professional certification.",
      doesNotProve: "Independent audit, attorney review, HR validation, or buyer acceptance.",
      nextAction: "Run staff-auth e2e after live migrations and attach reviewer notes to pilot artifacts.",
    },
    {
      id: "task-rating-live-proof",
      riskArea: "O*NET Task Ratings live proof",
      buyerConcern: "Task exposure prioritization should not imply live O*NET importance/frequency data unless the production table is migrated and populated.",
      currentControl: "Task Ratings migration, Deno ingest boundary, local verifier, and live non-mutating row proof gate are implemented.",
      currentEvidence: "Latest local gate passes; latest live artifact still shows missing target columns and rows.",
      status: "blocked_live_credentials",
      sourceIds: ["onet", "onet-task-statements", "onet-task-ratings", "onet-task-categories", "onet-scales-reference"],
      confidence: "medium",
      reviewStatus: "staff_review_required",
      caveat: "Reports can show proxy weight basis, but stronger task-time claims require live O*NET 30.3 row checksums.",
      doesNotProve: "Task-time precision, employer-specific automation exposure, or complete production data freshness.",
      nextAction: "Apply migration, ingest O*NET 30.3 Task Statements and Task Ratings, rerun live proof, and export table checksums.",
    },
    {
      id: "resume-parser-boundary",
      riskArea: "Resume PDF/DOCX parser boundary",
      buyerConcern: "Uploaded documents require extraction, retention, deletion, and failure-mode proof before production use.",
      currentControl: "Current analyzer supports pasted text and adds a server-side parse-resume boundary that validates upload type, size, signature, and non-persistence before analysis.",
      currentEvidence: "supabase/functions/parse-resume/index.ts, ResumeAnalyzer parser receipt UI, and resume proof reports expose parser receipt, no raw-file storage, and PDF/DOCX adapter-pending caveats.",
      status: "buyer_policy_required",
      sourceIds: sourceIds.parser,
      confidence: "medium",
      reviewStatus: "staff_review_required",
      caveat: "The parser boundary extracts only UTF-8 text uploads today; PDF/DOC/DOCX extraction, malware scanning, and live deployed parser proof remain pending.",
      doesNotProve: "Malware-free files, complete PDF/DOCX extraction, or deletion of browser files, user exports, model-provider logs, or backups.",
      nextAction: "Deploy parse-resume, verify live text upload receipt, then add a dedicated PDF/DOCX parser adapter with malware-scan and deletion evidence before paid upload pilots.",
    },
    {
      id: "market-intelligence-depth",
      riskArea: "Labor-market and provider-depth claims",
      buyerConcern: "Buyers may compare the product to licensed labor-market intelligence or skills-taxonomy platforms.",
      currentControl: "Reports label Lightcast, ESCO, SerpAPI, and LLM outputs as adapter-ready or bounded context unless imported and validated.",
      currentEvidence: "Source manifest and proof-pack rows keep provider-backed claims separate from open-data planning signals.",
      status: "future_adapter_required",
      sourceIds: sourceIds.market,
      confidence: "medium",
      reviewStatus: "staff_review_required",
      caveat: "Open-data proof packs are useful for pilot planning but do not equal licensed posting intelligence or verified skills assessment.",
      doesNotProve: "Lightcast-level market intelligence, live posting demand, validated skills assessment, or jurisdiction-specific demand.",
      nextAction: "Add a licensed provider adapter or source-permitted live posting snapshot before making market-demand claims.",
    },
  ];

  const aiRmfControls: AiRmfControlRow[] = [
    {
      function: "GOVERN",
      control: "Roles, acceptable use, source provenance, and review responsibilities are documented in commercial artifacts.",
      productEvidence: "Evidence cards, review states, delivery packet, and institutional readiness risk rows.",
      sourceIds: sourceIds.governance,
      reviewStatus: "staff_reviewed",
      remainingGate: "Buyer acceptable-use signoff and live reviewer identity proof.",
    },
    {
      function: "MAP",
      control: "Use context is narrowed to career coaching, education advising, workforce planning, and L&D pilots.",
      productEvidence: "Public gallery and reports reject hiring/firing/layoff/screening and full HCM claims.",
      sourceIds: ["nist-ai-rmf", "ada-ai-hiring-guidance", "eeoc-employment-selection-procedures"],
      reviewStatus: "staff_review_required",
      remainingGate: "Buyer-specific data categories, audience, and jurisdiction mapping.",
    },
    {
      function: "MEASURE",
      control: "Commercial gates measure source coverage, report evidence, accessibility smoke, browser journeys, data checksums, and audit status.",
      productEvidence: "verify:commercial, verify:sources, verify:data-provenance, verify:commercial-a11y, commercial-accessibility-audit-latest.md/json, and hosted CI.",
      sourceIds: ["nist-ai-rmf", "wcag-22", "iso-42001"],
      reviewStatus: "staff_reviewed",
      remainingGate: "Manual WCAG 2.2 checklist evidence, live Supabase proof, and buyer pilot outcome evidence.",
    },
    {
      function: "MANAGE",
      control: "Known blockers are explicit and tied to next actions before institutional delivery.",
      productEvidence: "Supabase deployment runbook, live proof gates, redacted proof artifact boundary, and risk rows.",
      sourceIds: ["nist-ai-rmf", "iso-42001", "llm-output"],
      reviewStatus: "staff_review_required",
      remainingGate: "Credentialed live deployment, e2e staff-auth proof, and buyer acceptance criteria.",
    },
  ];

  const manualWcagEvidenceRows: ManualWcagEvidenceRow[] = [
    {
      id: "keyboard-and-focus",
      checkpoint: "Keyboard-only path and focus visibility",
      currentAutomatedProof: "Commercial browser and accessibility smoke checks verify visible tab stops on scoped commercial routes.",
      manualEvidenceNeeded: "Record full tab order, skip/focus behavior, dropdown/modal behavior, report-download controls, and any obscured-focus defects on mobile, tablet, and desktop.",
      reviewerRole: "Accessibility reviewer or trained staff reviewer",
      status: "buyer_policy_required",
      sourceIds: sourceIds.accessibility,
      caveat: "Automated tab-stop checks do not prove complete keyboard operability for every state.",
      doesNotProve: "WCAG conformance, assistive-technology parity, or accommodation readiness.",
    },
    {
      id: "screen-reader-name-role-value",
      checkpoint: "Screen-reader name, role, value, and reading order",
      currentAutomatedProof: "Route smoke verifies H1, main landmark, visible text, and accessible control names.",
      manualEvidenceNeeded: "Capture VoiceOver or NVDA notes for proof-pack downloads, resume upload/parser receipts, lead forms, consent states, checkout entry points, and dense tables.",
      reviewerRole: "Accessibility reviewer",
      status: "buyer_policy_required",
      sourceIds: sourceIds.accessibility,
      caveat: "Static control-name checks do not prove screen-reader ordering or state announcements.",
      doesNotProve: "Screen-reader parity across browser/AT combinations.",
    },
    {
      id: "target-size-and-mobile",
      checkpoint: "Target size, spacing, and mobile reflow",
      currentAutomatedProof: "Responsive smoke covers mobile, tablet, and desktop route rendering without major overflow.",
      manualEvidenceNeeded: "Measure dense buttons, table actions, icon controls, mobile exports, and report cards against target-size and spacing expectations.",
      reviewerRole: "Accessibility reviewer or product reviewer",
      status: "buyer_policy_required",
      sourceIds: sourceIds.accessibility,
      caveat: "Responsive rendering does not prove every target is easy to activate.",
      doesNotProve: "WCAG target-size conformance or motor-accessibility adequacy.",
    },
    {
      id: "forms-errors-and-auth",
      checkpoint: "Forms, errors, consent, and accessible authentication",
      currentAutomatedProof: "Commercial browser checks consent-disabled actions, lead persistence status, and downloadable artifact flows.",
      manualEvidenceNeeded: "Record invalid-input states, retry/error messaging, consent revocation paths, login/password flows, timeout behavior, and recovery steps.",
      reviewerRole: "Accessibility reviewer plus product owner",
      status: "buyer_policy_required",
      sourceIds: sourceIds.accessibility,
      caveat: "Happy-path browser checks do not prove understandable recovery from every failure state.",
      doesNotProve: "Accessible-authentication completeness or legal accommodation readiness.",
    },
  ];

  const buyerAcceptableUseSignoffRows: BuyerAcceptableUseSignoffRow[] = [
    {
      id: "planning-only-use",
      gate: "Planning-only use",
      buyerQuestion: "Will the buyer use proof packs only for coaching, education advising, workforce planning, or L&D discussion?",
      requiredConfirmation: "Buyer confirms reports will not be used for hiring, firing, promotion, compensation, layoff, screening, eligibility, or worker-ranking decisions.",
      owner: "Buyer sponsor",
      status: "buyer_policy_required",
      sourceIds: sourceIds.employment,
      caveat: "This confirmation narrows pilot use; it is not a legal opinion.",
      doesNotProve: "Lawful employment-selection use or adverse-impact validation.",
    },
    {
      id: "data-minimization",
      gate: "Data minimization and consent",
      buyerQuestion: "Will the pilot avoid unnecessary individual PII and preserve consent/retention terms for any uploaded resume or student/workforce data?",
      requiredConfirmation: "Buyer confirms role-level, aggregate, or redacted data is preferred and any individual data has approved consent, retention, and deletion handling.",
      owner: "Buyer privacy or program owner",
      status: "buyer_policy_required",
      sourceIds: ["nist-ai-rmf", "cfpb-employment-algorithmic-scores", "llm-output"],
      caveat: "Product controls reduce data exposure but do not replace buyer privacy review.",
      doesNotProve: "FERPA, FCRA, GDPR, state privacy, or employer-policy compliance.",
    },
    {
      id: "human-review-owner",
      gate: "Human review owner",
      buyerQuestion: "Who is accountable for reviewing source caveats, local context, and client-ready recommendations before delivery?",
      requiredConfirmation: "Buyer names a coach, counselor, workforce lead, or L&D reviewer who will approve pilot artifacts before client use.",
      owner: "Buyer sponsor plus product reviewer",
      status: "buyer_policy_required",
      sourceIds: sourceIds.governance,
      caveat: "Named review ownership improves governance but is not an independent audit.",
      doesNotProve: "Professional certification, attorney review, or employment-selection validation.",
    },
    {
      id: "local-evidence-boundary",
      gate: "Local labor-market evidence boundary",
      buyerQuestion: "Will the buyer avoid local-demand or licensed-market-intelligence claims unless geography, source vintage, query metadata, and reviewer notes are attached?",
      requiredConfirmation: "Buyer confirms open-data and licensed-provider caveats remain visible in any pilot artifact.",
      owner: "Buyer sponsor plus data reviewer",
      status: "future_adapter_required",
      sourceIds: sourceIds.market,
      caveat: "Open-source proof packs can guide discovery but do not equal licensed posting intelligence.",
      doesNotProve: "Lightcast-level intelligence, live posting demand, or provider-quality validation.",
    },
    {
      id: "live-proof-attachment",
      gate: "Live proof attachment",
      buyerQuestion: "Will delivery wait until live Supabase proof, payment proof when billing is involved, and known launch blockers are attached?",
      requiredConfirmation: "Buyer/internal owner confirms the latest CI, live-readiness, and unresolved-blocker evidence is attached to the delivery packet.",
      owner: "Product owner",
      status: "blocked_live_credentials",
      sourceIds: ["nist-ai-rmf", "supabase-edge-functions", "llm-output"],
      caveat: "Local and hosted CI do not prove all target-project live state.",
      doesNotProve: "Production migration state, payment fulfillment, or test-user authenticated e2e until live gates pass.",
    },
  ];

  const evidenceCards = [
    createEvidenceCard({
      id: "institutional-readiness-not-employment-selection",
      claim: "Proof packs are institutional planning and coaching artifacts unless a separate validated employment-selection program exists.",
      sourceIds: sourceIds.employment,
      confidence: "high",
      generatedAt: generatedAtIso,
      caveat: "ADA, EEOC, and CFPB-aligned boundaries require buyer-specific legal, accommodation, adverse-impact, and consumer-report review before employment use.",
      doesNotProve: "Lawful hiring, firing, promotion, compensation, layoff, screening, eligibility, or worker ranking use.",
      reviewStatus: "staff_review_required",
      action: "Keep institutional pilots role-level, anonymized, reviewed, and planning-only.",
    }),
    createEvidenceCard({
      id: "institutional-readiness-accessibility-gate",
      claim: "Commercial accessibility smoke is necessary but insufficient for institutional accessibility conformance.",
      sourceIds: sourceIds.accessibility,
      confidence: "medium",
      generatedAt: generatedAtIso,
      caveat: "Automated route checks must be paired with manual assistive-technology and accommodation review.",
      doesNotProve: "Full WCAG 2.2 AA conformance or accommodation readiness.",
      reviewStatus: "staff_review_required",
      action: "Attach commercial-accessibility-audit-latest.md plus completed manual WCAG 2.2 notes before institution-facing delivery.",
    }),
    createEvidenceCard({
      id: "institutional-readiness-live-proof-blocker",
      claim: "Live Supabase migration proof remains a hard gate before institutional delivery.",
      sourceIds: ["nist-ai-rmf", "iso-42001", "llm-output"],
      confidence: "high",
      generatedAt: generatedAtIso,
      caveat: "Local gates and hosted CI prove code behavior, not the target Supabase schema state.",
      doesNotProve: "That live staff review, resume deletion receipts, redacted artifact save/delete, or O*NET Task Ratings rows exist in production.",
      reviewStatus: "staff_review_required",
      action: "Run the credentialed deployment packet and both live proof gates.",
    }),
    createEvidenceCard({
      id: "institutional-readiness-acceptable-use-signoff",
      claim: "Controlled institutional pilots need a buyer acceptable-use checklist before client delivery.",
      sourceIds: [...sourceIds.governance, ...sourceIds.employment],
      confidence: "high",
      generatedAt: generatedAtIso,
      caveat: "The checklist is a governance artifact, not legal advice or a compliance certification.",
      doesNotProve: "Buyer legal approval, validated employment-selection use, or accessibility conformance.",
      reviewStatus: "staff_review_required",
      action: "Attach the completed acceptance checklist to every institutional pilot packet.",
    }),
  ];

  return {
    id: "institutional-readiness-packet",
    title: "Institutional Readiness Packet",
    generatedAt: generatedAtIso,
    intendedUse: "Buyer-facing trust packet for coaches, career centers, workforce boards, and L&D pilots.",
    statusSummary: "Ready for bounded demos and pilot review; not ready for institutional delivery until live Supabase proof, generated accessibility audit packet plus completed manual WCAG notes, buyer acceptable-use signoff, and unresolved issue list are attached.",
    riskRows,
    aiRmfControls,
    manualWcagEvidenceRows,
    buyerAcceptableUseSignoffRows,
    accessibilityGate: [
      "Automated commercial a11y smoke passes before demos and writes commercial-accessibility-audit-latest.md/json.",
      "Manual WCAG 2.2 worksheet rows are included in this packet and still require human evidence for focus-not-obscured, target size, redundant entry, accessible authentication, contrast, labels, error states, and screen-reader reading order.",
      "Do not claim WCAG conformance until manual evidence and remediation notes are complete.",
    ],
    employmentDecisionBoundary: [
      "Not a hiring, firing, promotion, compensation, layoff, screening, eligibility, or worker-ranking system.",
      "Do not furnish individual reports to employers for employment purposes without separate FCRA, notice, permission, dispute, accuracy, and legal controls.",
      "Do not use scores as selection procedures without validated job-relatedness, business necessity, adverse-impact monitoring, accommodation procedures, and buyer legal review.",
    ],
    institutionalAcceptanceGates: [
      "Live Supabase deployment packet applied and migration list reviewed.",
      "npm run verify:commercial-live-supabase passes against the target project.",
      "npm run verify:onet-task-ratings-live passes after O*NET 30.3 task rating ingest and exported checksums.",
      "Staff-auth review/final-approval and signed-in redacted resume artifact save/delete e2e proof are attached.",
      "commercial-accessibility-audit-latest.md plus completed manual WCAG 2.2 worksheet notes and unresolved issue list are attached.",
      "Buyer acceptable-use, data-retention, consent, local-evidence, and non-employment-decision policy checklist is signed off.",
    ],
    evidenceCards,
  };
}

export function buildInstitutionalReadinessCsv(packet = buildInstitutionalReadinessPacket()): string {
  const header = [
    "risk_id",
    "risk_area",
    "buyer_concern",
    "current_control",
    "current_evidence",
    "status",
    "source_ids",
    "sources",
    "confidence",
    "review_state",
    "caveat",
    "does_not_prove",
    "next_action",
  ];
  const rows = packet.riskRows.map((risk) => [
    risk.id,
    risk.riskArea,
    risk.buyerConcern,
    risk.currentControl,
    risk.currentEvidence,
    INSTITUTIONAL_READINESS_STATUS_LABELS[risk.status],
    risk.sourceIds.join(";"),
    sourceLabels(risk.sourceIds),
    risk.confidence,
    REVIEW_STATUS_LABELS[risk.reviewStatus],
    risk.caveat,
    risk.doesNotProve,
    risk.nextAction,
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function buildInstitutionalAcceptanceChecklistCsv(packet = buildInstitutionalReadinessPacket()): string {
  const header = [
    "checklist_type",
    "item_id",
    "title",
    "current_or_required_proof",
    "reviewer_or_owner",
    "status",
    "source_ids",
    "sources",
    "caveat",
    "does_not_prove",
  ];
  const manualRows = packet.manualWcagEvidenceRows.map((row) => [
    "manual_wcag_evidence",
    row.id,
    row.checkpoint,
    `${row.currentAutomatedProof} Manual evidence needed: ${row.manualEvidenceNeeded}`,
    row.reviewerRole,
    INSTITUTIONAL_READINESS_STATUS_LABELS[row.status],
    row.sourceIds.join(";"),
    sourceLabels(row.sourceIds),
    row.caveat,
    row.doesNotProve,
  ]);
  const signoffRows = packet.buyerAcceptableUseSignoffRows.map((row) => [
    "buyer_acceptable_use_signoff",
    row.id,
    row.gate,
    `${row.buyerQuestion} Required confirmation: ${row.requiredConfirmation}`,
    row.owner,
    INSTITUTIONAL_READINESS_STATUS_LABELS[row.status],
    row.sourceIds.join(";"),
    sourceLabels(row.sourceIds),
    row.caveat,
    row.doesNotProve,
  ]);

  return [header, ...manualRows, ...signoffRows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function renderInstitutionalReadinessPacketHtml(packet = buildInstitutionalReadinessPacket()): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(packet.title)}</title>
  <style>
    body { color: #0f172a; font-family: Inter, Arial, sans-serif; line-height: 1.5; margin: 0; padding: 28px; }
    h1, h2, h3 { line-height: 1.2; }
    .summary { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; }
    .boundary { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; margin-top: 18px; padding: 16px; }
    table { border-collapse: collapse; font-size: 11px; margin-top: 12px; width: 100%; }
    th, td { border: 1px solid #dbe3ef; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #e2e8f0; color: #0f172a; }
    .status { font-weight: 700; }
    .small { color: #475569; font-size: 12px; }
    .gate-list li { margin: 5px 0; }
    ${getEvidenceCardCss()}
    @media print { body { padding: 16px; } }
  </style>
</head>
<body data-institutional-readiness-packet="true">
  <header>
    <p class="small">Generated: ${escapeHtml(packet.generatedAt)}</p>
    <h1>${escapeHtml(packet.title)}</h1>
    <div class="summary">
      <p><strong>Intended use:</strong> ${escapeHtml(packet.intendedUse)}</p>
      <p><strong>Status:</strong> ${escapeHtml(packet.statusSummary)}</p>
    </div>
  </header>

  <section data-institutional-risk-register="true">
    <h2>Institutional Risk Register</h2>
    <table>
      <thead>
        <tr>
          <th>Risk</th>
          <th>Current Control</th>
          <th>Status</th>
          <th>Sources / Caveat</th>
          <th>Next Action</th>
        </tr>
      </thead>
      <tbody>
        ${packet.riskRows.map((risk) => `
          <tr data-institutional-risk-row="${escapeHtml(risk.id)}">
            <td><strong>${escapeHtml(risk.riskArea)}</strong><br/>${escapeHtml(risk.buyerConcern)}</td>
            <td>${escapeHtml(risk.currentControl)}<br/><span class="small">Evidence: ${escapeHtml(risk.currentEvidence)}</span></td>
            <td class="status">${escapeHtml(INSTITUTIONAL_READINESS_STATUS_LABELS[risk.status])}<br/><span class="small">${escapeHtml(REVIEW_STATUS_LABELS[risk.reviewStatus])}; ${escapeHtml(risk.confidence)} confidence</span></td>
            <td>${escapeHtml(sourceLabels(risk.sourceIds))}<br/><span class="small">Caveat: ${escapeHtml(risk.caveat)}</span><br/><span class="small">Does not prove: ${escapeHtml(risk.doesNotProve)}</span></td>
            <td>${escapeHtml(risk.nextAction)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </section>

  <section data-ai-rmf-control-map="true">
    <h2>AI RMF Control Map</h2>
    <table>
      <thead>
        <tr>
          <th>Function</th>
          <th>Control</th>
          <th>Product Evidence</th>
          <th>Remaining Gate</th>
        </tr>
      </thead>
      <tbody>
        ${packet.aiRmfControls.map((control) => `
          <tr>
            <td><strong>${escapeHtml(control.function)}</strong></td>
            <td>${escapeHtml(control.control)}<br/><span class="small">Sources: ${escapeHtml(sourceLabels(control.sourceIds))}</span></td>
            <td>${escapeHtml(control.productEvidence)}</td>
            <td>${escapeHtml(control.remainingGate)}<br/><span class="small">${escapeHtml(REVIEW_STATUS_LABELS[control.reviewStatus])}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </section>

  <section class="boundary" data-employment-decision-boundary="true">
    <h2>Employment Decision Boundary</h2>
    <ul class="gate-list">
      ${packet.employmentDecisionBoundary.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  </section>

  <section class="boundary" data-wcag-accessibility-gate="true">
    <h2>WCAG 2.2 Accessibility Gate</h2>
    <ul class="gate-list">
      ${packet.accessibilityGate.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  </section>

  <section data-manual-wcag-evidence-worksheet="true">
    <h2>Manual WCAG Evidence Worksheet</h2>
    <table>
      <thead>
        <tr>
          <th>Checkpoint</th>
          <th>Automated Proof</th>
          <th>Manual Evidence Needed</th>
          <th>Reviewer / Status</th>
          <th>Boundary</th>
        </tr>
      </thead>
      <tbody>
        ${packet.manualWcagEvidenceRows.map((row) => `
          <tr data-manual-wcag-evidence-row="${escapeHtml(row.id)}">
            <td><strong>${escapeHtml(row.checkpoint)}</strong><br/><span class="small">Sources: ${escapeHtml(sourceLabels(row.sourceIds))}</span></td>
            <td>${escapeHtml(row.currentAutomatedProof)}</td>
            <td>${escapeHtml(row.manualEvidenceNeeded)}</td>
            <td>${escapeHtml(row.reviewerRole)}<br/><span class="small">${escapeHtml(INSTITUTIONAL_READINESS_STATUS_LABELS[row.status])}</span></td>
            <td><span class="small">Caveat: ${escapeHtml(row.caveat)}</span><br/><span class="small">Does not prove: ${escapeHtml(row.doesNotProve)}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </section>

  <section data-buyer-acceptable-use-signoff="true">
    <h2>Buyer Acceptable-Use Signoff Checklist</h2>
    <table>
      <thead>
        <tr>
          <th>Gate</th>
          <th>Buyer Question</th>
          <th>Required Confirmation</th>
          <th>Owner / Status</th>
          <th>Boundary</th>
        </tr>
      </thead>
      <tbody>
        ${packet.buyerAcceptableUseSignoffRows.map((row) => `
          <tr data-buyer-acceptable-use-signoff-row="${escapeHtml(row.id)}">
            <td><strong>${escapeHtml(row.gate)}</strong><br/><span class="small">Sources: ${escapeHtml(sourceLabels(row.sourceIds))}</span></td>
            <td>${escapeHtml(row.buyerQuestion)}</td>
            <td>${escapeHtml(row.requiredConfirmation)}</td>
            <td>${escapeHtml(row.owner)}<br/><span class="small">${escapeHtml(INSTITUTIONAL_READINESS_STATUS_LABELS[row.status])}</span></td>
            <td><span class="small">Caveat: ${escapeHtml(row.caveat)}</span><br/><span class="small">Does not prove: ${escapeHtml(row.doesNotProve)}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </section>

  <section class="boundary" data-institutional-acceptance-gates="true">
    <h2>Institutional Acceptance Gates</h2>
    <ul class="gate-list">
      ${packet.institutionalAcceptanceGates.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  </section>

  ${renderEvidenceCardsHtml(packet.evidenceCards, "Institutional Readiness Evidence Cards")}
</body>
</html>`;
}
