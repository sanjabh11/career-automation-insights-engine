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

export interface InstitutionalReadinessPacket {
  id: string;
  title: string;
  generatedAt: string;
  intendedUse: string;
  statusSummary: string;
  riskRows: InstitutionalRiskRow[];
  aiRmfControls: AiRmfControlRow[];
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
  employment: ["ada-ai-hiring-guidance", "eeoc-employment-selection-procedures", "cfpb-employment-algorithmic-scores"],
  accessibility: ["wcag-22", "ada-ai-hiring-guidance"],
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
      currentControl: "Commercial accessibility smoke checks H1, landmarks, horizontal overflow, accessible control names, and visible keyboard tab stops across key routes.",
      currentEvidence: "npm run verify:commercial-a11y is included in the hosted commercial proof-pack gate.",
      status: "hosted_ci_verified",
      sourceIds: sourceIds.accessibility,
      confidence: "medium",
      reviewStatus: "staff_review_required",
      caveat: "Automated and smoke checks do not equal a full WCAG 2.2 conformance audit.",
      doesNotProve: "Full WCAG 2.2 AA conformance, screen-reader parity, contrast coverage, accessible-authentication completeness, or accommodation workflow adequacy.",
      nextAction: "Add manual screen-reader, focus-not-obscured, target-size, redundant-entry, contrast, and error-state notes before institutional delivery.",
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
      currentControl: "Current analyzer supports pasted/browser text and labels production PDF/DOCX parsing as pending.",
      currentEvidence: "Resume analyzer proof report and browser journey verify parser caveats and downloadable proof report boundaries.",
      status: "buyer_policy_required",
      sourceIds: ["nist-ai-rmf", "ada-ai-hiring-guidance", "llm-output"],
      confidence: "medium",
      reviewStatus: "staff_review_required",
      caveat: "Production document parsing requires server-side file handling, deletion proof, file-type limits, malware handling, and retention policy.",
      doesNotProve: "Secure file handling, complete document extraction, or deletion of uploaded files.",
      nextAction: "Add a server-side parser integration boundary with file deletion receipts before enabling uploaded resume files in paid pilots.",
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
      productEvidence: "verify:commercial, verify:sources, verify:data-provenance, verify:commercial-a11y, and hosted CI.",
      sourceIds: ["nist-ai-rmf", "wcag-22", "iso-42001"],
      reviewStatus: "staff_reviewed",
      remainingGate: "Manual WCAG notes, live Supabase proof, and buyer pilot outcome evidence.",
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
      action: "Attach manual WCAG 2.2 notes before institution-facing delivery.",
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
  ];

  return {
    id: "institutional-readiness-packet",
    title: "Institutional Readiness Packet",
    generatedAt: generatedAtIso,
    intendedUse: "Buyer-facing trust packet for coaches, career centers, workforce boards, and L&D pilots.",
    statusSummary: "Ready for bounded demos and pilot review; not ready for institutional delivery until live Supabase proof, manual accessibility notes, and buyer acceptable-use signoff are attached.",
    riskRows,
    aiRmfControls,
    accessibilityGate: [
      "Automated commercial a11y smoke passes before demos.",
      "Manual WCAG 2.2 notes are still required for focus-not-obscured, target size, redundant entry, accessible authentication, contrast, labels, error states, and screen-reader reading order.",
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
      "Manual WCAG 2.2 audit notes and unresolved issue list are attached.",
      "Buyer acceptable-use, data-retention, consent, and non-employment-decision policy are signed off.",
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
