import {
  createEvidenceCard,
  getEvidenceCardCss,
  renderEvidenceCardsHtml,
  type EvidenceCard,
  type EvidenceConfidence,
  type ReportReviewStatus,
  REVIEW_STATUS_LABELS,
} from "@/lib/reportEvidenceCards";
import { getReportProvenanceCss, renderReportProvenanceHtml } from "@/lib/reportProvenance";

export type CohortRiskBand = "low" | "medium" | "high" | "unknown";
export type CohortActionType = "protect" | "upgrade" | "learn_next" | "review_required";
export type CohortPrivacyStatus = "aggregate_only" | "consent_required" | "advisor_review_required";

export interface CohortProofPackSegment {
  segmentId: string;
  label: string;
  learnerCount: number;
  riskBand: CohortRiskBand;
  priorityAction: CohortActionType;
  sourceIds: string[];
  confidence: EvidenceConfidence;
  reviewStatus: ReportReviewStatus;
  finding: string;
  caveat: string;
  doesNotProve: string;
}

export interface CohortProofPackBoundary {
  label: string;
  privacyStatus: CohortPrivacyStatus;
  sourceIds: string[];
  reviewStatus: ReportReviewStatus;
  caveat: string;
  requiredBeforeDelivery: string[];
}

export interface CareerCenterCohortProofPack {
  generatedAt: string;
  title: string;
  summary: string;
  reviewStatus: ReportReviewStatus;
  cohortLabel: string;
  cohortSize: number;
  segments: CohortProofPackSegment[];
  boundaries: CohortProofPackBoundary[];
  evidenceCards: EvidenceCard[];
  nextActions: string[];
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function renderRiskBandLabel(band: CohortRiskBand): string {
  const labels: Record<CohortRiskBand, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    unknown: "Unknown",
  };
  return labels[band];
}

function renderActionLabel(action: CohortActionType): string {
  const labels: Record<CohortActionType, string> = {
    protect: "Protect",
    upgrade: "Upgrade",
    learn_next: "Learn next",
    review_required: "Review required",
  };
  return labels[action];
}

function renderPrivacyStatusLabel(status: CohortPrivacyStatus): string {
  const labels: Record<CohortPrivacyStatus, string> = {
    aggregate_only: "Aggregate only",
    consent_required: "Consent required",
    advisor_review_required: "Advisor review required",
  };
  return labels[status];
}

export function buildCareerCenterCohortProofPack(generatedAt: Date = new Date()): CareerCenterCohortProofPack {
  const reviewStatus: ReportReviewStatus = "staff_review_required";
  const segments: CohortProofPackSegment[] = [
    {
      segmentId: "business-accounting",
      label: "Business and accounting students",
      learnerCount: 42,
      riskBand: "medium",
      priorityAction: "upgrade",
      sourceIds: ["onet", "bls-oews", "nace-career-readiness", "bls-ai-mlr-2025"],
      confidence: "medium",
      reviewStatus,
      finding: "Use task-level AI exposure to identify where accounting workflows shift toward review, exception handling, and client communication.",
      caveat: "Segment size and occupation mix are sample values until a counselor uploads an anonymized cohort roster.",
      doesNotProve: "That any student should change major, avoid an occupation, or be screened differently by an employer.",
    },
    {
      segmentId: "liberal-arts-alumni",
      label: "Liberal arts alumni career changers",
      learnerCount: 36,
      riskBand: "unknown",
      priorityAction: "review_required",
      sourceIds: ["nace-career-readiness", "dol-ai-literacy-framework", "census-acs-api"],
      confidence: "low",
      reviewStatus,
      finding: "Start with transferable skills and AI literacy themes before recommending a specific occupation path.",
      caveat: "Outcome context depends on learner goals, local labor-market access, prior experience, and advisor review.",
      doesNotProve: "That the cohort has a single best transition path or that demographic context predicts individual outcomes.",
    },
    {
      segmentId: "student-workers",
      label: "Student workers and interns",
      learnerCount: 58,
      riskBand: "low",
      priorityAction: "protect",
      sourceIds: ["nace-career-readiness", "dol-ai-literacy-framework", "wcag-22"],
      confidence: "medium",
      reviewStatus,
      finding: "Protect human-led workplace skills while adding role-specific AI literacy, output review, and accessibility-aware tool use.",
      caveat: "Career readiness framing supports development planning, not assessment replacement or employment selection.",
      doesNotProve: "That a student worker is ready for a role, promotion, or placement without institutional assessment.",
    },
    {
      segmentId: "technology-bootcamp",
      label: "Technology bootcamp graduates",
      learnerCount: 24,
      riskBand: "medium",
      priorityAction: "learn_next",
      sourceIds: ["openai-gdpval", "anthropic-observed-exposure", "wef-foj-2025", "bls-oews"],
      confidence: "medium",
      reviewStatus,
      finding: "Prioritize AI workflow supervision, evaluation, and product-context skills alongside technical portfolio evidence.",
      caveat: "AI capability benchmarks and observed-use sources do not prove local entry-level hiring demand.",
      doesNotProve: "That completion of a bootcamp, certificate, or AI course guarantees placement or pay outcomes.",
    },
  ];

  const boundaries: CohortProofPackBoundary[] = [
    {
      label: "Aggregate reporting only",
      privacyStatus: "aggregate_only",
      sourceIds: ["ferpa-student-privacy", "nist-ai-rmf"],
      reviewStatus,
      caveat: "The sample cohort report uses aggregate rows only and must not include student names, IDs, resumes, or personally identifiable education-record data.",
      requiredBeforeDelivery: [
        "Use anonymous segment labels or approved directory categories.",
        "Suppress small cells where re-identification is plausible.",
        "Store reviewer notes without student PII unless the institution has approved consent and retention terms.",
      ],
    },
    {
      label: "Advisor review before student delivery",
      privacyStatus: "advisor_review_required",
      sourceIds: ["nace-career-readiness", "dol-ai-literacy-framework", "wcag-22"],
      reviewStatus,
      caveat: "Career-center staff must review cohort guidance for advising fit, accessibility, and program context before sharing with students or alumni.",
      requiredBeforeDelivery: [
        "Confirm the cohort purpose and audience.",
        "Review accessibility and accommodation notes.",
        "Attach local labor-market appendix only after geography and source vintage are selected.",
      ],
    },
    {
      label: "Outcome and placement boundary",
      privacyStatus: "consent_required",
      sourceIds: ["nace-first-destination", "ferpa-student-privacy", "bls-oews"],
      reviewStatus,
      caveat: "Career outcome, salary, and placement reporting require institutional standards, consent/data governance, and separated evidence from transition guidance.",
      requiredBeforeDelivery: [
        "Do not call this a placement-rate or career-outcome report.",
        "Keep cohort transition themes separate from first-destination survey reporting.",
        "Use source-labeled follow-up evidence before claiming outcomes.",
      ],
    },
  ];

  const evidenceCards = [
    createEvidenceCard({
      id: "career-center-cohort-boundary",
      claim: "Career-center cohort proof packs must stay aggregate, advisor-reviewed, and source-labeled.",
      sourceIds: ["ferpa-student-privacy", "nace-career-readiness", "nist-ai-rmf"],
      confidence: "high",
      caveat: "Aggregate cohort guidance can support advising and program planning, but individual student records and advising decisions need institutional controls.",
      doesNotProve: "That the report is FERPA compliance, a validated assessment, or a replacement for counselor judgment.",
      reviewStatus,
      generatedAt,
      action: "Use anonymized segment rows, suppress small cells, and require advisor review before delivery.",
    }),
    createEvidenceCard({
      id: "cohort-outcome-boundary",
      claim: "Cohort transition themes are not placement, salary, or first-destination outcomes.",
      sourceIds: ["nace-first-destination", "bls-oews", "llm-output"],
      confidence: "medium",
      caveat: "Career outcomes require separate collection standards, knowledge-rate handling, salary methodology, and institutional approval.",
      doesNotProve: "That any cohort member obtained employment, compensation, promotion, or enrollment outcome.",
      reviewStatus,
      generatedAt,
      action: "Keep proof-pack cohorts separate from outcome dashboards until outcome evidence is collected and reviewed.",
    }),
    createEvidenceCard({
      id: "cohort-local-context-boundary",
      claim: "Cohort recommendations need local labor-market context before region-specific advising.",
      sourceIds: ["bls-oews", "bls-laus", "bls-qcew", "census-acs-api"],
      confidence: "medium",
      caveat: "Public labor-market sources answer different questions and need geography, release vintage, and reviewer notes.",
      doesNotProve: "That local employers are hiring these learners or that a training theme produces local placement.",
      reviewStatus,
      generatedAt,
      action: "Attach the local labor-market proof appendix before region-specific workshop or curriculum recommendations.",
    }),
  ];

  return {
    generatedAt: generatedAt.toISOString(),
    title: "Career Center Cohort AI Work Transition Proof Pack",
    summary: "Aggregate-only cohort artifact for counselor review, workshop planning, and bounded career-center outreach.",
    reviewStatus,
    cohortLabel: "Sample student and alumni cohort",
    cohortSize: segments.reduce((total, segment) => total + segment.learnerCount, 0),
    segments,
    boundaries,
    evidenceCards,
    nextActions: [
      "Replace sample rows with anonymized cohort segments and suppress small cells.",
      "Ask an advisor to review skill themes, accessibility needs, and local labor-market context.",
      "Use the report for workshop planning and advising conversations, not individual student ranking.",
      "Keep outcome reporting separate until first-destination or follow-up evidence is collected under institutional policy.",
    ],
  };
}

export function buildCareerCenterCohortCsv(pack: CareerCenterCohortProofPack = buildCareerCenterCohortProofPack()): string {
  const header = [
    "segment_id",
    "segment_label",
    "learner_count",
    "risk_band",
    "priority_action",
    "source_ids",
    "confidence",
    "review_state",
    "finding",
    "caveat",
    "does_not_prove",
  ];
  const rows = pack.segments.map((segment) => [
    segment.segmentId,
    segment.label,
    String(segment.learnerCount),
    segment.riskBand,
    segment.priorityAction,
    segment.sourceIds.join(";"),
    segment.confidence,
    REVIEW_STATUS_LABELS[segment.reviewStatus],
    segment.finding,
    segment.caveat,
    segment.doesNotProve,
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function renderCareerCenterCohortProofPackHtml(
  pack: CareerCenterCohortProofPack = buildCareerCenterCohortProofPack()
): string {
  return `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(pack.title)}</title>
    <style>
      ${getCareerCenterCohortProofPackCss()}
      ${getEvidenceCardCss()}
      ${getReportProvenanceCss()}
    </style>
  </head>
  <body>
    <main class="cohort-proof-pack" data-career-center-cohort-proof-pack="true">
      <header class="cohort-header">
        <div>
          <p class="eyebrow">Aggregate cohort artifact</p>
          <h1>${escapeHtml(pack.title)}</h1>
          <p>${escapeHtml(pack.summary)}</p>
        </div>
        <div class="review-badge">${escapeHtml(REVIEW_STATUS_LABELS[pack.reviewStatus])}</div>
      </header>

      <section class="cohort-meta">
        <div><strong>Cohort:</strong> ${escapeHtml(pack.cohortLabel)}</div>
        <div><strong>Learners:</strong> ${pack.cohortSize}</div>
        <div><strong>Generated:</strong> ${escapeHtml(pack.generatedAt)}</div>
      </section>

      <section>
        <h2>Cohort Transition Segments</h2>
        <table class="cohort-table">
          <thead>
            <tr><th>Segment</th><th>Learners</th><th>Risk band</th><th>Action</th><th>Confidence / review</th><th>Finding</th><th>Source caveat</th></tr>
          </thead>
          <tbody>
            ${pack.segments.map((segment) => `
              <tr>
                <td><strong>${escapeHtml(segment.label)}</strong><br/><span>${escapeHtml(segment.segmentId)}</span></td>
                <td>${segment.learnerCount}</td>
                <td>${escapeHtml(renderRiskBandLabel(segment.riskBand))}</td>
                <td>${escapeHtml(renderActionLabel(segment.priorityAction))}</td>
                <td>${escapeHtml(segment.confidence)} confidence<br/><span>${escapeHtml(REVIEW_STATUS_LABELS[segment.reviewStatus])}</span></td>
                <td>${escapeHtml(segment.finding)}</td>
                <td>${escapeHtml(segment.caveat)}<br/><span>Sources: ${segment.sourceIds.map(escapeHtml).join(", ")}</span><br/><span>Does not prove: ${escapeHtml(segment.doesNotProve)}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Privacy, Consent, And Outcome Boundaries</h2>
        <table class="cohort-table">
          <thead>
            <tr><th>Boundary</th><th>Status</th><th>Review</th><th>Caveat</th><th>Required before delivery</th></tr>
          </thead>
          <tbody>
            ${pack.boundaries.map((boundary) => `
              <tr>
                <td><strong>${escapeHtml(boundary.label)}</strong><br/><span>Sources: ${boundary.sourceIds.map(escapeHtml).join(", ")}</span></td>
                <td>${escapeHtml(renderPrivacyStatusLabel(boundary.privacyStatus))}</td>
                <td>${escapeHtml(REVIEW_STATUS_LABELS[boundary.reviewStatus])}</td>
                <td>${escapeHtml(boundary.caveat)}</td>
                <td><ul>${boundary.requiredBeforeDelivery.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Next Actions</h2>
        <ol>
          ${pack.nextActions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}
        </ol>
      </section>

      ${renderEvidenceCardsHtml(pack.evidenceCards, "Career Center Cohort Evidence Cards")}
      ${renderReportProvenanceHtml({
        title: "Cohort Source Provenance",
        generatedAt: new Date(pack.generatedAt),
        context: "Aggregate career-center cohort proof pack generated from sample segments, source registry versions, privacy boundaries, and advisor-review requirements.",
      })}
    </main>
  </body>
  </html>`;
}

export function getCareerCenterCohortProofPackCss(): string {
  return `
    body { margin: 0; background: #f8fafc; color: #0f172a; font-family: Inter, Arial, sans-serif; }
    .cohort-proof-pack { max-width: 1180px; margin: 0 auto; padding: 32px; }
    .cohort-header { align-items: flex-start; border-bottom: 4px solid #0f766e; display: flex; gap: 24px; justify-content: space-between; padding-bottom: 20px; }
    .cohort-header h1 { font-size: 30px; line-height: 1.1; margin: 0; }
    .cohort-header p { color: #475569; margin: 8px 0 0; max-width: 760px; }
    .eyebrow { color: #0f766e; font-size: 12px; font-weight: 800; letter-spacing: 0; margin: 0 0 6px; text-transform: uppercase; }
    .review-badge { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 999px; color: #92400e; font-size: 12px; font-weight: 800; padding: 8px 12px; white-space: nowrap; }
    .cohort-meta { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; display: grid; gap: 10px; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 18px; padding: 14px; }
    section { margin-top: 28px; }
    h2 { font-size: 20px; margin: 0 0 10px; }
    .cohort-table { background: #ffffff; border-collapse: collapse; font-size: 12px; width: 100%; }
    .cohort-table th, .cohort-table td { border: 1px solid #cbd5e1; padding: 9px; text-align: left; vertical-align: top; }
    .cohort-table th { background: #e2e8f0; }
    .cohort-table span { color: #64748b; }
    ol { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; margin: 0; padding: 16px 16px 16px 34px; }
    li { margin: 5px 0; }
    @media (max-width: 760px) {
      .cohort-proof-pack { padding: 18px; }
      .cohort-header { display: block; }
      .review-badge { display: inline-block; margin-top: 14px; }
      .cohort-meta { grid-template-columns: 1fr; }
    }
  `;
}
