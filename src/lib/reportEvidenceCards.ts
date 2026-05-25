import { REPORT_SOURCE_REGISTRY, type SourceConfidence } from "@/lib/reportProvenance";

export type EvidenceConfidence = SourceConfidence;

export type ReportReviewStatus =
  | "auto_generated"
  | "staff_review_required"
  | "staff_reviewed"
  | "coach_reviewed"
  | "client_ready";

export interface EvidenceCard {
  id: string;
  claim: string;
  sourceIds: string[];
  confidence: EvidenceConfidence;
  generatedAt: string;
  caveat: string;
  doesNotProve: string;
  reviewStatus: ReportReviewStatus;
  action?: string;
}

export const REVIEW_STATUS_LABELS: Record<ReportReviewStatus, string> = {
  auto_generated: "Auto-generated draft",
  staff_review_required: "Staff review required",
  staff_reviewed: "Staff reviewed",
  coach_reviewed: "Coach reviewed",
  client_ready: "Client-ready after review",
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function sourceLabel(sourceId: string): string {
  const source = REPORT_SOURCE_REGISTRY.find((entry) => entry.id === sourceId);
  return source ? `${source.label} (${source.confidence})` : sourceId;
}

export function createEvidenceCard(input: Omit<EvidenceCard, "generatedAt"> & { generatedAt?: Date | string }): EvidenceCard {
  const generatedAt = input.generatedAt instanceof Date
    ? input.generatedAt.toISOString()
    : input.generatedAt || new Date().toISOString();

  return {
    ...input,
    generatedAt,
  };
}

export function renderEvidenceCardsHtml(cards: EvidenceCard[], title = "Evidence Cards"): string {
  if (cards.length === 0) {
    return "";
  }

  return `
    <section class="evidence-card-section" data-evidence-card-section="true">
      <h2>${escapeHtml(title)}</h2>
      <div class="evidence-card-grid">
        ${cards.map((card) => `
          <article class="evidence-card" data-evidence-card-id="${escapeHtml(card.id)}" data-review-status="${escapeHtml(card.reviewStatus)}">
            <div class="evidence-card-header">
              <span class="evidence-confidence evidence-confidence-${escapeHtml(card.confidence)}">${escapeHtml(card.confidence)} confidence</span>
              <span class="review-state">${escapeHtml(REVIEW_STATUS_LABELS[card.reviewStatus])}</span>
            </div>
            <h3>${escapeHtml(card.claim)}</h3>
            <p><strong>Sources:</strong> ${card.sourceIds.map(sourceLabel).map(escapeHtml).join("; ")}</p>
            <p><strong>Caveat:</strong> ${escapeHtml(card.caveat)}</p>
            <p class="does-not-prove"><strong>Does not prove:</strong> ${escapeHtml(card.doesNotProve)}</p>
            ${card.action ? `<p><strong>Action:</strong> ${escapeHtml(card.action)}</p>` : ""}
            <p class="evidence-generated-at">Generated: ${escapeHtml(card.generatedAt)}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

export function getEvidenceCardCss(): string {
  return `
    .evidence-card-section { margin-top: 24px; padding: 18px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; }
    .evidence-card-section h2 { margin: 0 0 12px; }
    .evidence-card-grid { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .evidence-card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; font-size: 12px; }
    .evidence-card h3 { margin: 8px 0; font-size: 14px; line-height: 1.25; }
    .evidence-card p { margin: 7px 0; line-height: 1.45; }
    .evidence-card-header { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; }
    .evidence-confidence, .review-state { border-radius: 999px; display: inline-block; font-size: 10px; font-weight: 700; padding: 3px 8px; text-transform: uppercase; }
    .evidence-confidence-high { background: #dcfce7; color: #166534; }
    .evidence-confidence-medium { background: #fef3c7; color: #92400e; }
    .evidence-confidence-low { background: #fee2e2; color: #991b1b; }
    .review-state { background: #e0f2fe; color: #075985; }
    .does-not-prove { color: #7c2d12; }
    .evidence-generated-at { color: #64748b; font-size: 10px; }
    @media (max-width: 760px) { .evidence-card-grid { grid-template-columns: 1fr; } }
  `;
}
