import { REVIEW_STATUS_LABELS, type EvidenceConfidence, type ReportReviewStatus } from "@/lib/reportEvidenceCards";
import { REPORT_SOURCE_REGISTRY } from "@/lib/reportProvenance";

export type LocalMarketSnapshotValidationStatus =
  | "template_required"
  | "adapter_ready"
  | "buyer_input_required"
  | "review_required";

export interface LocalMarketSnapshotSourceRow {
  id: string;
  sourceId: string;
  label: string;
  useCase: string;
  requiredBuyerInput: string[];
  requiredSourceMetadata: string[];
  validationStatus: LocalMarketSnapshotValidationStatus;
  confidence: EvidenceConfidence;
  reviewStatus: ReportReviewStatus;
  caveat: string;
  doesNotProve: string;
  nextValidationStep: string;
}

export interface LocalMarketSnapshotPacket {
  generatedAt: string;
  packetId: string;
  title: string;
  buyerUse: string;
  statusSummary: string;
  sourceRows: LocalMarketSnapshotSourceRow[];
  acceptanceCriteria: string[];
  buyerQuestions: string[];
  claimBoundaries: string[];
}

const sourceRows: LocalMarketSnapshotSourceRow[] = [
  {
    id: "oews-wage-employment",
    sourceId: "bls-oews",
    label: "BLS OEWS wage and employment context",
    useCase: "Attach state, metro, or nonmetropolitan occupation wage and employment estimates after SOC/O*NET mapping.",
    requiredBuyerInput: ["target occupation", "SOC/O*NET mapping", "state or metro area", "acceptable wage-vintage window"],
    requiredSourceMetadata: ["OEWS release year", "area code", "SOC code", "estimate type", "retrieved_at", "reviewer_note"],
    validationStatus: "buyer_input_required",
    confidence: "medium",
    reviewStatus: "staff_review_required",
    caveat: "OEWS is official wage and employment context, not a real-time posting feed or compensation guarantee.",
    doesNotProve: "That a local employer is hiring, that a specific salary is available, or that a transition will raise pay.",
    nextValidationStep: "Select buyer geography and SOC code, then attach OEWS row metadata to the report artifact.",
  },
  {
    id: "laus-area-pressure",
    sourceId: "bls-laus",
    label: "BLS LAUS local labor-force pressure",
    useCase: "Add area-level employment, unemployment, and labor-force context for workforce-board or career-center discussion.",
    requiredBuyerInput: ["state/county/city/metro", "month/year", "learner or employer geography policy"],
    requiredSourceMetadata: ["LAUS series or area code", "month/year", "retrieved_at", "seasonal-adjustment status", "reviewer_note"],
    validationStatus: "buyer_input_required",
    confidence: "medium",
    reviewStatus: "staff_review_required",
    caveat: "LAUS is place-based labor-force context and must not be treated as occupation demand.",
    doesNotProve: "That any occupation, skill, course, or emerging role is locally demanded.",
    nextValidationStep: "Record jurisdiction and month, then label LAUS separately from occupation-specific evidence.",
  },
  {
    id: "qcew-industry-base",
    sourceId: "bls-qcew",
    label: "BLS QCEW industry employment base",
    useCase: "Add county/state plus NAICS industry employment and wage base for L&D or workforce-sector pilots.",
    requiredBuyerInput: ["county or state", "NAICS industry", "ownership scope", "quarter/year"],
    requiredSourceMetadata: ["QCEW area", "NAICS", "ownership", "quarter/year", "retrieved_at", "reviewer_note"],
    validationStatus: "buyer_input_required",
    confidence: "medium",
    reviewStatus: "staff_review_required",
    caveat: "QCEW is industry-by-geography context, not occupation-level skill demand.",
    doesNotProve: "That specific occupations or AI-era roles are demanded by local employers.",
    nextValidationStep: "Attach QCEW only as industry context and pair it with OEWS or postings for occupation claims.",
  },
  {
    id: "careeronestop-cross-check",
    sourceId: "careeronestop-api",
    label: "CareerOneStop occupation and training cross-check",
    useCase: "Cross-check occupation, salary, training, license, and skills-gap fields when authenticated API access is approved.",
    requiredBuyerInput: ["API access owner", "occupation", "location", "training/provider review policy"],
    requiredSourceMetadata: ["endpoint", "query", "location", "token owner", "retrieved_at", "cache key", "reviewer_note"],
    validationStatus: "adapter_ready",
    confidence: "low",
    reviewStatus: "staff_review_required",
    caveat: "CareerOneStop API fields need authenticated access and endpoint-specific source logging.",
    doesNotProve: "That a provider is endorsed, accessible, affordable, or outcome-validated for a learner.",
    nextValidationStep: "Log endpoint, query, location, and reviewer note before promoting any training/pathway recommendation.",
  },
  {
    id: "acs-access-context",
    sourceId: "census-acs-api",
    label: "Census ACS local access context",
    useCase: "Add local access factors such as education, commuting, broadband, language, or income context for program design.",
    requiredBuyerInput: ["geography", "ACS vintage", "selected variables", "why each variable is relevant"],
    requiredSourceMetadata: ["ACS table IDs", "variables", "geography", "vintage", "margin-of-error handling", "reviewer_note"],
    validationStatus: "adapter_ready",
    confidence: "low",
    reviewStatus: "staff_review_required",
    caveat: "ACS context is not occupation demand and must not be used to rank or screen individuals.",
    doesNotProve: "That an individual can or cannot succeed in a job, training path, or transition role.",
    nextValidationStep: "Pick variables with buyer review and record margin-of-error handling in the artifact.",
  },
  {
    id: "posting-snapshot",
    sourceId: "serpapi",
    label: "Reviewed posting snapshot",
    useCase: "Add volatile job-posting evidence only after query, geography, timestamp, provider, and deduplication notes are stored.",
    requiredBuyerInput: ["query", "location", "job-board/source policy", "deduplication method", "licensed provider decision"],
    requiredSourceMetadata: ["provider", "query", "location", "retrieved_at", "result count", "dedupe rule", "cache key", "reviewer_note"],
    validationStatus: "review_required",
    confidence: "low",
    reviewStatus: "staff_review_required",
    caveat: "Posting snapshots are volatile, duplicated, provider-dependent, and not complete labor-market truth.",
    doesNotProve: "That openings are unique, still active, complete, or representative of all local demand.",
    nextValidationStep: "Attach a reviewed search snapshot or licensed posting feed before any local-demand claim.",
  },
  {
    id: "licensed-market-intelligence",
    sourceId: "lightcast",
    label: "Licensed market-intelligence adapter",
    useCase: "Upgrade local demand and skills intelligence only when licensed provider terms and data exports are approved.",
    requiredBuyerInput: ["licensed provider", "data-use terms", "export fields", "refresh cadence", "buyer claim policy"],
    requiredSourceMetadata: ["provider", "license scope", "dataset vintage", "fields used", "retrieved_at", "reviewer_note"],
    validationStatus: "template_required",
    confidence: "low",
    reviewStatus: "staff_review_required",
    caveat: "This app does not currently include licensed Lightcast-level market intelligence.",
    doesNotProve: "That current reports have licensed posting, compensation, skills, or taxonomy depth.",
    nextValidationStep: "Attach licensed export metadata before using provider-backed market-intelligence language.",
  },
];

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sourceLabel(sourceId: string): string {
  return REPORT_SOURCE_REGISTRY.find((source) => source.id === sourceId)?.label || sourceId;
}

function renderValidationStatus(status: LocalMarketSnapshotValidationStatus): string {
  switch (status) {
    case "template_required":
      return "Template required";
    case "adapter_ready":
      return "Adapter-ready";
    case "buyer_input_required":
      return "Buyer input required";
    case "review_required":
      return "Review required";
    default:
      return status;
  }
}

export function buildLocalLaborMarketSnapshotPacket(): LocalMarketSnapshotPacket {
  return {
    generatedAt: new Date().toISOString(),
    packetId: "local-labor-market-snapshot-v1",
    title: "Local Labor-Market Snapshot Packet",
    buyerUse:
      "A buyer-review template for attaching geography, source vintage, query metadata, reviewer notes, and caveats before any local-demand claim appears in a proof pack.",
    statusSummary:
      "Ready as a source-labeled validation packet for pilots; not a live labor-market snapshot until buyer geography, source rows, query metadata, and reviewer notes are attached.",
    sourceRows,
    acceptanceCriteria: [
      "Every local wage, employment, training, posting, or access claim has source ID, source label, vintage, geography, retrieved_at, caveat, and reviewer note.",
      "Official public labor data, authenticated government APIs, search snapshots, and licensed market-intelligence exports remain separated by source and claim boundary.",
      "No local-demand, wage, training-provider, or placement claim is client-ready until reviewStatus is staff_reviewed or client_ready.",
      "No report uses ACS, LAUS, QCEW, postings, or licensed-provider data for hiring, firing, promotion, compensation, layoff, screening, or eligibility decisions.",
    ],
    buyerQuestions: [
      "Which geography should the report represent: state, metro, county, remote market, campus region, or employer footprint?",
      "Which occupations or SOC/O*NET mappings need local evidence before a recommendation becomes client-ready?",
      "Is an open public source enough for this pilot, or does the buyer require licensed posting or skills intelligence?",
      "Who is the reviewer authorized to approve local-market language before delivery?",
    ],
    claimBoundaries: [
      "Does not prove local hiring demand until source rows with geography, vintage, and reviewer notes are attached.",
      "Does not prove salary, placement, provider quality, course outcomes, or learner fit.",
      "Does not replace licensed labor-market intelligence, institutional research, legal review, or advisor judgment.",
    ],
  };
}

export function buildLocalLaborMarketSnapshotCsv(packet: LocalMarketSnapshotPacket): string {
  const header = [
    "snapshot_id",
    "source_id",
    "source_label",
    "use_case",
    "required_buyer_input",
    "required_source_metadata",
    "validation_status",
    "confidence",
    "review_state",
    "caveat",
    "does_not_prove",
    "next_validation_step",
  ];
  const rows = packet.sourceRows.map((row) => [
    row.id,
    row.sourceId,
    sourceLabel(row.sourceId),
    row.useCase,
    row.requiredBuyerInput.join("; "),
    row.requiredSourceMetadata.join("; "),
    renderValidationStatus(row.validationStatus),
    row.confidence,
    REVIEW_STATUS_LABELS[row.reviewStatus],
    row.caveat,
    row.doesNotProve,
    row.nextValidationStep,
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function renderLocalLaborMarketSnapshotHtml(packet: LocalMarketSnapshotPacket): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(packet.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; color: #172033; line-height: 1.5; }
    h1, h2 { color: #0f172a; }
    .notice { border: 1px solid #f59e0b; background: #fffbeb; padding: 12px; border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; text-align: left; }
    th { background: #e2e8f0; }
    .review { font-weight: 700; color: #0f766e; }
  </style>
</head>
<body data-local-labor-market-snapshot="true">
  <h1>${escapeHtml(packet.title)}</h1>
  <p><strong>Generated:</strong> ${escapeHtml(packet.generatedAt)}</p>
  <p>${escapeHtml(packet.buyerUse)}</p>
  <div class="notice">
    <strong>Status boundary:</strong> ${escapeHtml(packet.statusSummary)}
  </div>

  <h2>Source Rows</h2>
  <table>
    <thead>
      <tr>
        <th>Source</th>
        <th>Use Case</th>
        <th>Required Inputs</th>
        <th>Status</th>
        <th>Caveat / Does Not Prove</th>
        <th>Next Validation</th>
      </tr>
    </thead>
    <tbody>
      ${packet.sourceRows.map((row) => `
        <tr data-local-market-source-row="${escapeHtml(row.id)}">
          <td><strong>${escapeHtml(row.label)}</strong><br/>${escapeHtml(row.sourceId)}<br/>${escapeHtml(sourceLabel(row.sourceId))}</td>
          <td>${escapeHtml(row.useCase)}</td>
          <td>
            <strong>Buyer:</strong> ${escapeHtml(row.requiredBuyerInput.join("; "))}<br/>
            <strong>Metadata:</strong> ${escapeHtml(row.requiredSourceMetadata.join("; "))}
          </td>
          <td>${escapeHtml(renderValidationStatus(row.validationStatus))}<br/>${escapeHtml(row.confidence)} confidence<br/><span class="review">${escapeHtml(REVIEW_STATUS_LABELS[row.reviewStatus])}</span></td>
          <td>${escapeHtml(row.caveat)}<br/><strong>Does not prove:</strong> ${escapeHtml(row.doesNotProve)}</td>
          <td>${escapeHtml(row.nextValidationStep)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <h2>Acceptance Criteria</h2>
  <ul>${packet.acceptanceCriteria.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>

  <h2>Buyer Questions</h2>
  <ul>${packet.buyerQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>

  <h2>Does Not Prove</h2>
  <ul>${packet.claimBoundaries.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
</body>
</html>`;
}
