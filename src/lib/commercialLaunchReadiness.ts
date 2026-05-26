import type { SourceConfidence } from "@/lib/reportProvenance";

export type ReadinessPriority = "high" | "medium";
export type ReadinessStatus = "done" | "blocked" | "owner_action" | "pending";

export interface CommercialLaunchReadinessMilestone {
  phase: string;
  focus: string;
  done: string;
  pending: string;
  rating: number;
  remainingPercent: number;
  moveNext: string;
  priority: ReadinessPriority;
}

export interface PaymentFulfillmentStatusItem {
  item: string;
  currentProof: string;
  remainingAction: string;
  status: ReadinessStatus;
  maturity: number;
}

export interface OutreachSequenceTemplate {
  buyer: string;
  firstTouch: string;
  followUp: string;
  proofArtifact: string;
  successMetric: string;
  sourceIds: string[];
  confidence: SourceConfidence;
  caveat: string;
}

export interface SourceFreshnessDashboardRow {
  sourceId: string;
  sourceFamily: string;
  currentState: string;
  nextProofNeeded: string;
  confidence: SourceConfidence;
  maturity: number;
}

export interface ManualWcagEvidenceItem {
  checkpoint: string;
  currentProof: string;
  requiredEvidence: string;
  maturity: number;
}

export interface PilotFeedbackCaptureField {
  field: string;
  whyItMatters: string;
  captureMethod: string;
  maturity: number;
}

export interface BuyerLandingRoadmapItem {
  buyer: string;
  currentRoute: string;
  missingUi: string;
  nextAction: string;
  maturity: number;
}

export const commercialLaunchReadinessMilestones: CommercialLaunchReadinessMilestone[] = [
  {
    phase: "1. Live governance closeout",
    focus: "Make the live Supabase project safe enough for controlled outreach.",
    done: "Parser, authenticated checkout, authenticated portal, and live closeout workflow are present.",
    pending: "Function-cap cleanup, no-JWT review, and owner-led secret rotation.",
    rating: 3.6,
    remainingPercent: 28,
    moveNext: "Yes for UI/governance work; no for paid outreach until payment proof passes.",
    priority: "high",
  },
  {
    phase: "2. Payment proof",
    focus: "Prove paid report credits and subscription fulfillment end to end.",
    done: "Frontend checkout calls pass Supabase JWTs; create-checkout-session and create-portal-session are live.",
    pending: "Free Supabase function capacity or raise the cap, redeploy checkout/webhook, replay Stripe test events, and prove report-credit balance changes.",
    rating: 3.4,
    remainingPercent: 32,
    moveNext: "No scaled paid outreach until webhook and credit fulfillment are proven live.",
    priority: "high",
  },
  {
    phase: "3. Outreach readiness",
    focus: "Turn proof-pack interest into a repeatable founder-led pilot workflow.",
    done: "Lead ops, stages, priorities, sequence step, next action, follow-up date, response analytics, CSV export, and unsubscribe-safe campaign export with tracked links exist.",
    pending: "Email-provider API sync, deployed-domain analytics, unsubscribe webhook sync-back, and A/B campaign reporting.",
    rating: 4.2,
    remainingPercent: 16,
    moveNext: "Yes for manual founder-led validation with bounded claims.",
    priority: "high",
  },
  {
    phase: "4. Institutional trust",
    focus: "Make governance, privacy, accessibility, and review boundaries buyer-reviewable.",
    done: "Evidence cards, privacy/deletion receipts, AI RMF rows, WCAG smoke, trust center, manual WCAG worksheet, buyer acceptable-use checklist, and employment-decision boundaries exist.",
    pending: "Completed manual WCAG notes, signed buyer acceptable-use review, unresolved issue log, and formal legal copy.",
    rating: 4.3,
    remainingPercent: 14,
    moveNext: "Yes for review calls; no for compliance claims.",
    priority: "medium",
  },
  {
    phase: "5. Market validation",
    focus: "Collect proof that buyers understand, value, and will pay for the wedge.",
    done: "Positioning, proof-pack gallery, sample reports, and outreach scripts exist.",
    pending: "10 coach reviews, 5 career-center reviews, 3 workforce-board reviews, and paid pilot willingness evidence.",
    rating: 3.2,
    remainingPercent: 36,
    moveNext: "No broad marketing until feedback and conversion data are captured.",
    priority: "medium",
  },
];

export const paymentFulfillmentStatusItems: PaymentFulfillmentStatusItem[] = [
  {
    item: "Authenticated subscription checkout",
    currentProof: "Frontend sends Supabase JWT and deployed create-checkout-session verifies caller identity.",
    remainingAction: "Run a signed-in Stripe test checkout after secrets are confirmed.",
    status: "done",
    maturity: 4.1,
  },
  {
    item: "Authenticated billing portal",
    currentProof: "Frontend calls create-portal-session with Authorization and deployed function verifies JWT.",
    remainingAction: "Confirm portal link works with a real test subscription.",
    status: "done",
    maturity: 4.0,
  },
  {
    item: "Report-credit checkout",
    currentProof: "Source folds credit checkout into create-checkout-session to avoid another Edge Function.",
    remainingAction: "Fresh 2026-05-26 redeploy attempt returned Supabase 402 function-count/spend-cap error; free capacity or raise the cap, then run a credit purchase test.",
    status: "blocked",
    maturity: 3.3,
  },
  {
    item: "Stripe webhook fulfillment",
    currentProof: "Source handles credit_purchase metadata and records payment transactions.",
    remainingAction: "Fresh 2026-05-26 redeploy attempt returned Supabase 402 function-count/spend-cap error; redeploy after cap cleanup and replay Stripe test events before claiming live credit fulfillment.",
    status: "blocked",
    maturity: 3.2,
  },
  {
    item: "Legacy payment slug retirement",
    currentProof: "stripe-checkout and stripe-portal are superseded by JWT-protected replacements.",
    remainingAction: "Delete only after owner approval, one slug at a time, then rerun live function inventory.",
    status: "owner_action",
    maturity: 2.8,
  },
];

export const outreachSequenceTemplates: OutreachSequenceTemplate[] = [
  {
    buyer: "Career coach",
    firstTouch: "Send a coach-branded sample report and ask for a role-specific review.",
    followUp: "Share one evidence-card section and ask whether the caveat language helps client trust.",
    proofArtifact: "/sample-report",
    successMetric: "3 sample requests, 2 feedback calls, 1 paid pilot conversation.",
    sourceIds: ["nace-career-readiness", "nist-ai-rmf", "wcag-22"],
    confidence: "medium",
    caveat: "Coach outreach must stay framed as reviewed guidance, not validated assessment.",
  },
  {
    buyer: "Career center",
    firstTouch: "Send an aggregate cohort proof-pack sample for counselor review.",
    followUp: "Ask which cohort segment, privacy note, or skill ledger would be useful in a workshop.",
    proofArtifact: "/tools/counselor-reports",
    successMetric: "5 counselor reviews and one workshop-fit discussion.",
    sourceIds: ["ferpa-student-privacy", "nace-first-destination", "nace-career-readiness"],
    confidence: "medium",
    caveat: "Student/alumni data must remain aggregate-only unless the institution approves consent and retention controls.",
  },
  {
    buyer: "Workforce board or L&D team",
    firstTouch: "Offer a 10-25 role CSV audit with no employee names and no employment-decision use.",
    followUp: "Share the executive report skeleton and ask who should own SOC review and local-market validation.",
    proofArtifact: "/enterprise-dashboard",
    successMetric: "3 anonymized role pilots and one review-owner identified.",
    sourceIds: ["dol-ai-literacy-framework", "bls-emp", "ada-ai-hiring-guidance"],
    confidence: "medium",
    caveat: "Workforce outreach must stay role-level and planning-only until buyer governance is signed off.",
  },
];

export const sourceFreshnessDashboardRows: SourceFreshnessDashboardRow[] = [
  {
    sourceId: "onet-task-ratings",
    sourceFamily: "O*NET task ratings",
    currentState: "Schema, ingest boundary, helper, and live proof exist.",
    nextProofNeeded: "Production checksum export proving task-rating rows used in report artifacts.",
    confidence: "high",
    maturity: 4.1,
  },
  {
    sourceId: "bls-oews",
    sourceFamily: "BLS wage and employment context",
    currentState: "Source registry and adapter boundary exist.",
    nextProofNeeded: "Live table checksum and selected geography/SOC evidence rows.",
    confidence: "high",
    maturity: 3.4,
  },
  {
    sourceId: "careeronestop-api",
    sourceFamily: "CareerOneStop local and training cross-check",
    currentState: "Authenticated adapter boundary is documented.",
    nextProofNeeded: "Token-owner, endpoint, query, location, timestamp, and reviewer notes per artifact.",
    confidence: "medium",
    maturity: 2.8,
  },
  {
    sourceId: "lightcast",
    sourceFamily: "Licensed posting and skills intelligence",
    currentState: "Market comparison and caveat boundary only.",
    nextProofNeeded: "Licensed data agreement or explicit exclusion from market claims.",
    confidence: "medium",
    maturity: 2.5,
  },
  {
    sourceId: "wcag-22",
    sourceFamily: "Accessibility evidence",
    currentState: "Automated smoke audit artifact exists.",
    nextProofNeeded: "Manual keyboard, screen-reader, target-size, text-spacing, focus, and error-state evidence.",
    confidence: "medium",
    maturity: 3.8,
  },
];

export const manualWcagEvidenceChecklist: ManualWcagEvidenceItem[] = [
  {
    checkpoint: "Keyboard-only path",
    currentProof: "Commercial browser journey verifies main routes and controls render.",
    requiredEvidence: "Manual tab order, skip/focus behavior, modal controls, and all form actions.",
    maturity: 3.7,
  },
  {
    checkpoint: "Screen-reader labels",
    currentProof: "Automated route smoke catches obvious missing headings and controls.",
    requiredEvidence: "VoiceOver/NVDA notes for report downloads, uploads, lead ops, and checkout entry points.",
    maturity: 3.5,
  },
  {
    checkpoint: "Target size and pointer alternatives",
    currentProof: "Responsive Playwright checks cover mobile/tablet/desktop route rendering.",
    requiredEvidence: "Manual target-size review for dense dashboard tables and icon buttons.",
    maturity: 3.6,
  },
  {
    checkpoint: "Form errors and consent states",
    currentProof: "Consent-disabled controls and privacy links are verified in commercial gates.",
    requiredEvidence: "Manual review of error messaging, invalid inputs, retry states, and timeout messaging.",
    maturity: 3.9,
  },
];

export const pilotFeedbackCaptureFields: PilotFeedbackCaptureField[] = [
  {
    field: "Buyer segment and role",
    whyItMatters: "Separates coach, counselor, workforce, and L&D feedback instead of flattening objections.",
    captureMethod: "Lead ops metadata and CRM CSV import.",
    maturity: 4.0,
  },
  {
    field: "Usefulness score",
    whyItMatters: "Measures whether the proof pack changes an actual conversation or decision workflow.",
    captureMethod: "Post-review form with 1-5 usefulness rating.",
    maturity: 2.8,
  },
  {
    field: "Trust objection",
    whyItMatters: "Identifies missing source, caveat, privacy, accessibility, or legal-review blockers.",
    captureMethod: "Required free-text field attached to the lead or pilot artifact.",
    maturity: 3.0,
  },
  {
    field: "Paid pilot signal",
    whyItMatters: "Prevents mistaking polite feedback for commercial demand.",
    captureMethod: "Discovery-call outcome: not now, review later, paid pilot, or procurement path.",
    maturity: 2.7,
  },
  {
    field: "Case-study permission",
    whyItMatters: "Creates permissioned outreach proof without exposing private resume, student, or workforce data.",
    captureMethod: "Consent checkbox and redacted quote approval workflow.",
    maturity: 2.6,
  },
];

export const buyerLandingPageRoadmap: BuyerLandingRoadmapItem[] = [
  {
    buyer: "Career coaches",
    currentRoute: "/for-coaches and /sample-report",
    missingUi: "Coach-only pilot page with sample report, pricing, proof boundaries, and booking CTA.",
    nextAction: "Split the coach journey from the general proof-pack gallery after manual pilot feedback.",
    maturity: 3.8,
  },
  {
    buyer: "Career centers",
    currentRoute: "/tools/counselor-reports",
    missingUi: "Institution-facing page for aggregate cohort packs, privacy boundary, and workshop offer.",
    nextAction: "Add only after 5 counselor reviews identify the first workshop wedge.",
    maturity: 3.3,
  },
  {
    buyer: "Workforce boards and L&D",
    currentRoute: "/enterprise-dashboard",
    missingUi: "Role-level CSV pilot page with sample executive report, governance limits, and review-owner checklist.",
    nextAction: "Add after one anonymized CSV pilot validates fields and buyer language.",
    maturity: 3.4,
  },
  {
    buyer: "Paid report-credit buyers",
    currentRoute: "/pricing",
    missingUi: "Payment fulfillment status, credit balance, receipt, and report delivery status.",
    nextAction: "Add after Stripe credit fulfillment is proven live.",
    maturity: 2.9,
  },
];
