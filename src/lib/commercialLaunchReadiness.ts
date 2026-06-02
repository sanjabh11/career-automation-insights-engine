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

export interface PilotValidationTarget {
  buyerSegment: string;
  targetCount: number;
  qualifyingEvidence: string;
  successThreshold: string;
  currentProof: string;
  remainingAction: string;
  maturity: number;
}

export interface PilotValidationWorksheetColumn {
  column: string;
  purpose: string;
  requiredFor: string;
  boundary: string;
}

export interface BuyerLandingRoadmapItem {
  buyer: string;
  currentRoute: string;
  missingUi: string;
  nextAction: string;
  maturity: number;
}

export interface CoachCommercializationWorkflowStep {
  step: string;
  routeOrArtifact: string;
  owner: "founder" | "coach" | "client-review" | "owner-held-evidence";
  proofToCapture: string;
  claimBoundary: string;
  acceptanceGate: string;
}

export interface ActivationRetentionEventSpec {
  eventName: string;
  funnelStage: "activation" | "retention" | "revenue" | "commercial_validation";
  trigger: string;
  analysisUse: string;
  sourceSystem: "posthog" | "supabase_analytics_events" | "commercial_leads_metadata" | "stripe_dashboard";
  privacyBoundary: string;
  currentProof: string;
  remainingAction: string;
  maturity: number;
}

export interface RetentionCohortDefinition {
  cohort: string;
  startEvent: string;
  returnEvent: string;
  period: string;
  successCriterion: string;
  currentProof: string;
  remainingAction: string;
  maturity: number;
}

export interface CommercialValidationEvidenceGate {
  gate: string;
  requiredEvidence: string;
  currentProof: string;
  status: "local_ready" | "manual_required" | "blocked";
  doesNotProve: string;
}

export interface OwnerEvidenceCloseoutStatusItem {
  gateId: string;
  label: string;
  status: ReadinessStatus;
  artifactState: "passed_artifact_not_attached" | "failed_artifact" | "missing_owner_record";
  currentProof: string;
  remainingAction: string;
  sourceArtifact: string;
  doesNotProve: string;
}

export interface OwnerEvidenceCloseoutSummary {
  asOf: string;
  goalComplete: boolean;
  trackedLedger: string;
  passedArtifactCount: number;
  totalGateCount: number;
  closeoutBoundary: string;
}

export interface BlockedClaimVisibilityItem {
  claim: string;
  currentStatus: "blocked" | "bounded" | "owner_attestation_required";
  blockingEvidence: string;
  requiredEvidence: string;
  allowedCopy: string;
}

export interface DesignPartnerOnboardingStep {
  step: string;
  owner: "founder" | "partner" | "staff-review";
  artifact: string;
  acceptanceEvidence: string;
  boundary: string;
}

export interface CaseStudyCaptureTemplateField {
  field: string;
  prompt: string;
  requiredFor: string;
  privacyBoundary: string;
}

export const PILOT_VALIDATION_WORKSHEET_FILENAME = "proof-pack-pilot-validation-worksheet.csv";

export const phaseECommercialValidationAsOf = "2026-05-31";

export const activationRetentionEventCatalog: ActivationRetentionEventSpec[] = [
  {
    eventName: "search_success",
    funnelStage: "activation",
    trigger: "User receives occupation search results.",
    analysisUse: "Top-of-funnel product engagement and search-to-APO conversion.",
    sourceSystem: "supabase_analytics_events",
    privacyBoundary: "Payload is bounded to event category, page path, result count, and redacted/truncated strings.",
    currentProof: "SearchInterface emits search_success through trackAnalyticsEvent; the hook now writes event_type/payload to analytics_events when enabled.",
    remainingAction: "Confirm production analytics table accepts rows after the owner deploys the Phase E migration/runtime stack.",
    maturity: 3.7,
  },
  {
    eventName: "activation_apo_result_viewed",
    funnelStage: "activation",
    trigger: "Authenticated user receives the first APO result view.",
    analysisUse: "Primary activation candidate for APO Dashboard users.",
    sourceSystem: "supabase_analytics_events",
    privacyBoundary: "Payload stores occupation code and latency only, not resume text, student data, or contact information.",
    currentProof: "SearchInterface emits activation_apo_result_viewed immediately after calculate-apo succeeds.",
    remainingAction: "Compare this event against 4-week and 8-week return cohorts once live event volume exists.",
    maturity: 3.9,
  },
  {
    eventName: "activation_proof_artifact_created",
    funnelStage: "activation",
    trigger: "Coach or staff user generates a sample proof artifact.",
    analysisUse: "Commercial activation candidate for coaches and proof-pack reviewers.",
    sourceSystem: "posthog",
    privacyBoundary: "Payload excludes contact email and report HTML; artifact persistence has a separate consent gate.",
    currentProof: "SampleReportPage emits activation_proof_artifact_created with artifact type and buyer segment.",
    remainingAction: "Promote to a Supabase/server event after live lead volume proves this is a stable activation signal.",
    maturity: 3.6,
  },
  {
    eventName: "commercial_lead_captured",
    funnelStage: "commercial_validation",
    trigger: "Consent-backed commercial lead capture persists or enters the offline queue.",
    analysisUse: "Measures partner-review interest without treating lead capture as revenue.",
    sourceSystem: "posthog",
    privacyBoundary: "Event payload stores source, buyer segment, and persistence status only; email stays in commercial_leads under consent controls.",
    currentProof: "captureCommercialLead emits commercial_lead_captured after RPC persistence or offline fallback.",
    remainingAction: "Join only aggregate lead counts to case-study and paid-signal fields for launch reviews.",
    maturity: 3.8,
  },
  {
    eventName: "founder_led_pilot_outreach_click",
    funnelStage: "commercial_validation",
    trigger: "Tracked outreach link click from a consent-safe campaign export.",
    analysisUse: "Manual outreach A/B learning and review-call conversion tracking.",
    sourceSystem: "commercial_leads_metadata",
    privacyBoundary: "UTM and lead ID are operational campaign metadata; do not use as consent proof by themselves.",
    currentProof: "commercialLeadOps exports tracked links and a named analytics_event_name for each campaign row.",
    remainingAction: "Connect deployed-domain click ingestion or provider webhook sync-back after founder-led validation.",
    maturity: 3.4,
  },
  {
    eventName: "checkout_completed",
    funnelStage: "revenue",
    trigger: "Stripe redirects a subscription checkout success back to the app.",
    analysisUse: "Revenue conversion event candidate; not MRR proof until reconciled with Stripe live mode and active subscription state.",
    sourceSystem: "posthog",
    privacyBoundary: "Payload stores tier only; billing identifiers remain in Stripe and payment_transactions.",
    currentProof: "UserDashboardPage emits checkout_completed on checkout success URL state.",
    remainingAction: "Reconcile against live Stripe subscription and MRR report before claiming revenue.",
    maturity: 3.2,
  },
];

export const retentionCohortDefinitions: RetentionCohortDefinition[] = [
  {
    cohort: "APO activated users",
    startEvent: "activation_apo_result_viewed",
    returnEvent: "activation_apo_result_viewed",
    period: "4-week and 8-week recurring retention",
    successCriterion: "Retained users return to run or view another APO result in a later weekly cohort.",
    currentProof: "Client event is instrumented; PostHog/Supabase can compute retention once live events exist.",
    remainingAction: "Attach live cohort export with cohort sizes before making retention claims.",
    maturity: 3.4,
  },
  {
    cohort: "Coach proof-artifact users",
    startEvent: "activation_proof_artifact_created",
    returnEvent: "activation_proof_artifact_created",
    period: "8-week recurring retention",
    successCriterion: "Coach or staff users return to create a second proof artifact or capture a commercial lead.",
    currentProof: "Sample report and commercial lead events are instrumented without storing contact email in analytics payloads.",
    remainingAction: "Collect enough live coach review rows to compare artifact activation to follow-up meetings.",
    maturity: 3.2,
  },
  {
    cohort: "Design-partner review pipeline",
    startEvent: "commercial_lead_captured",
    returnEvent: "founder_led_pilot_outreach_click",
    period: "30-day pilot-review return window",
    successCriterion: "Design partner returns to a tracked proof artifact and logs usefulness, trust objection, or meeting data.",
    currentProof: "Lead ops has tracked links, response fields, usefulness score, paid pilot signal, and case-study permission.",
    remainingAction: "Founder-led outreach must create real rows; empty fixtures do not prove partner commitment.",
    maturity: 3.1,
  },
];

export const commercialValidationEvidenceGates: CommercialValidationEvidenceGate[] = [
  {
    gate: "Live MRR greater than zero",
    requiredEvidence: "Stripe live-mode active subscription, payment transaction, and MRR export showing total_mrr > 0.",
    currentProof: "Checkout source and success event hooks exist; no live revenue proof is attached in this repo.",
    status: "blocked",
    doesNotProve: "Test-mode checkout, local route smoke, or a configured price ID does not prove live MRR.",
  },
  {
    gate: "Three committed design partners",
    requiredEvidence: "At least three named coach/career-center/workforce partners with accepted pilot scope, next step, and contact permission.",
    currentProof: "Lead ops, pilot worksheet, response metrics, and onboarding checklist exist.",
    status: "manual_required",
    doesNotProve: "A downloaded sample, email open, or polite reply does not prove a committed partner.",
  },
  {
    gate: "Documented outcomes",
    requiredEvidence: "Permissioned case-study rows with baseline workflow, artifact reviewed, buyer quote, outcome, caveat, and publication permission.",
    currentProof: "Case-study permission and response notes are captured in commercial_leads metadata; template fields are defined below.",
    status: "manual_required",
    doesNotProve: "A single anecdote does not prove market-wide outcomes or job-placement impact.",
  },
  {
    gate: "Bootcamp CTA hidden or real Stripe price",
    requiredEvidence: "No runtime placeholder price ID; bootcamp checkout remains hidden until a real live Stripe price is supplied.",
    currentProof: "BOOTCAMP_PRICING.checkoutStatus is hidden_pending_live_price and stripePriceId is undefined.",
    status: "local_ready",
    doesNotProve: "Hidden CTA does not prove bootcamp demand or payment fulfillment.",
  },
];

export const ownerEvidenceCloseoutSummary: OwnerEvidenceCloseoutSummary = {
  asOf: "2026-06-02",
  goalComplete: false,
  trackedLedger: "docs/commercialization/remediation-completion-audit-latest.json",
  passedArtifactCount: 2,
  totalGateCount: 6,
  closeoutBoundary:
    "Tracked redacted artifacts are not the same as final closeout. Part I remains incomplete until npm run closeout:owner-evidence -- --write --refresh-tracked accepts every live and commercial gate.",
};

export const ownerEvidenceCloseoutStatusItems: OwnerEvidenceCloseoutStatusItem[] = [
  {
    gateId: "real_stripe_test_checkout",
    label: "Stripe test checkout",
    status: "blocked",
    artifactState: "failed_artifact",
    currentProof:
      "Latest redacted artifact is failed_non_test_stripe_key: the resolved checkout key was live-mode, so test-mode checkout proof was rejected.",
    remainingAction:
      "Set a test-mode Stripe key through STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY plus STRIPE_TEST_PRICE_ID, then rerun npm run verify:stripe-test-checkout.",
    sourceArtifact: "docs/commercialization/stripe-test-checkout-proof-latest.json",
    doesNotProve: "Live revenue, MRR, webhook fulfillment, or successful payment method collection.",
  },
  {
    gateId: "production_calibration_run",
    label: "Production calibration",
    status: "owner_action",
    artifactState: "passed_artifact_not_attached",
    currentProof:
      "Redacted production calibration artifact passed against deployed calibrate-ece on 2026-06-02 with 6 matched APO/expert pairs, 10 bins, and ECE 0.27855.",
    remainingAction:
      "Attach only redacted owner-held evidence through the live-gate evidence template and rerun the final closeout bundle.",
    sourceArtifact: "docs/commercialization/production-calibration-proof-latest.json",
    doesNotProve: "Scientific validation beyond the measured sample, future performance, raw label provenance, or employment-decision validity.",
  },
  {
    gateId: "authenticated_live_artifact_e2e",
    label: "Authenticated live artifact e2e",
    status: "owner_action",
    artifactState: "passed_artifact_not_attached",
    currentProof:
      "Redacted live auth artifact passed for a synthetic user save/delete/deletion-receipt path on 2026-06-02.",
    remainingAction:
      "Attach the redacted proof metadata through the live-gate evidence template and rerun npm run closeout:owner-evidence -- --write --refresh-tracked.",
    sourceArtifact: "docs/commercialization/live-auth-e2e-proof-latest.json",
    doesNotProve: "Production PDF/DOCX extraction, malware scanning, provider-log deletion, backups deletion, or legal compliance.",
  },
  {
    gateId: "live_mrr_gt_zero",
    label: "Live MRR greater than zero",
    status: "blocked",
    artifactState: "failed_artifact",
    currentProof:
      "Latest redacted Stripe live MRR artifact read live mode successfully but found 0 active subscriptions, 0 paid invoices, and total_mrr > 0 was false.",
    remainingAction:
      "Attach owner-held live Stripe evidence only after an active paid subscription or paid invoice exists and npm run verify:stripe-live-mrr passes.",
    sourceArtifact: "docs/commercialization/stripe-live-mrr-proof-latest.json",
    doesNotProve: "Retention, product-market fit, future revenue, accounting-recognized revenue, or commercial outcomes.",
  },
  {
    gateId: "three_committed_partners",
    label: "Three committed design partners",
    status: "owner_action",
    artifactState: "missing_owner_record",
    currentProof:
      "Commercial evidence verifier is wired, but commercial-evidence-records-latest.json shows 0 accepted unique design-partner hashes.",
    remainingAction:
      "Collect three permissioned partner records with pilot scope, planning-only use, artifact reviewed, next step, and contact permission; compose with an owner-held salt.",
    sourceArtifact: "docs/commercialization/commercial-evidence-records-latest.json",
    doesNotProve: "Revenue, retention, market-wide demand, or a paid pilot.",
  },
  {
    gateId: "documented_outcomes",
    label: "Permissioned documented outcomes",
    status: "owner_action",
    artifactState: "missing_owner_record",
    currentProof:
      "Commercial evidence verifier is wired, but commercial-evidence-records-latest.json shows 0 accepted outcome hashes.",
    remainingAction:
      "Collect one permissioned outcome record with baseline workflow, artifact reviewed, measured change, approved quote, and explicit does-not-prove boundary.",
    sourceArtifact: "docs/commercialization/commercial-evidence-records-latest.json",
    doesNotProve: "Guaranteed career outcomes, causal product impact, wage gain, placement, or legal compliance.",
  },
];

export const blockedClaimVisibilityItems: BlockedClaimVisibilityItem[] = [
  {
    claim: "Part I remediation complete",
    currentStatus: "blocked",
    blockingEvidence:
      "Final owner-evidence closeout still reports goalComplete=false and missing live/commercial evidence records.",
    requiredEvidence:
      "npm run closeout:owner-evidence -- --write --refresh-tracked accepts all live proof, partner, outcome, and remediation gates.",
    allowedCopy:
      "Repo-side implementation and CI proof-pack checks are substantially complete; final owner-held evidence gates remain open.",
  },
  {
    claim: "Scientifically validated APO scores",
    currentStatus: "blocked",
    blockingEvidence:
      "Production calibration currently proves only a bounded 6-pair APO/expert run and public fixture/model-card artifacts.",
    requiredEvidence:
      "Approved expert-label collection plan, materially larger matched APO/log sample, reliability analysis, drift policy, and model-card update.",
    allowedCopy:
      "APO is a decision-support estimate with documented method, uncertainty, limitations, and bounded calibration evidence.",
  },
  {
    claim: "Live revenue or MRR greater than zero",
    currentStatus: "blocked",
    blockingEvidence:
      "Latest redacted Stripe live MRR artifact found 0 active subscriptions, 0 paid invoices, and total_mrr > 0 was false.",
    requiredEvidence:
      "Owner-held live Stripe active subscription or paid invoice proof with redacted aggregate MRR > 0.",
    allowedCopy:
      "Payment flows and proof gates are implemented; live revenue remains unproven until Stripe evidence passes.",
  },
  {
    claim: "Three committed design partners",
    currentStatus: "blocked",
    blockingEvidence:
      "Commercial evidence records currently show 0 accepted unique design-partner hashes.",
    requiredEvidence:
      "Three permissioned partner records with pilot scope, planning-only use, artifact reviewed, next step, and contact permission.",
    allowedCopy:
      "Design-partner intake and redaction workflow is implemented; committed partners are still owner-held evidence.",
  },
  {
    claim: "Documented product outcomes",
    currentStatus: "blocked",
    blockingEvidence:
      "Commercial evidence records currently show 0 accepted outcome hashes.",
    requiredEvidence:
      "At least one permissioned outcome record with baseline workflow, artifact reviewed, measured change, approved quote, and does-not-prove boundary.",
    allowedCopy:
      "Outcome evidence capture is implemented; no case-study outcome should be claimed until owner-approved records pass.",
  },
  {
    claim: "Localized UK/CA/AU exact wage or outlook forecasts",
    currentStatus: "bounded",
    blockingEvidence:
      "Current UK and Australia values are parent-group context; Canada wages are national rows and outlook remains geography-required.",
    requiredEvidence:
      "Full source table checksums, geography/occupation joins, suppression states, and source-date review for each displayed local value.",
    allowedCopy:
      "UK/CA/AU regional context is source-dated and bounded; APO exposure estimates remain U.S. O*NET/BLS basis.",
  },
  {
    claim: "WCAG conformance or institutional accessibility approval",
    currentStatus: "owner_attestation_required",
    blockingEvidence:
      "Automated commercial smoke evidence exists, but manual WCAG-EM, screen-reader, contrast, target-size, text-spacing, focus, and form-error evidence is incomplete.",
    requiredEvidence:
      "Completed manual WCAG 2.2 worksheet, issue remediation notes, and reviewer attestation.",
    allowedCopy:
      "Automated accessibility smoke checks pass for commercial routes; full WCAG conformance remains unclaimed.",
  },
  {
    claim: "Employment-decision validity",
    currentStatus: "blocked",
    blockingEvidence:
      "The product is scoped for planning and review, not hiring, firing, promotion, compensation, retention, or eligibility decisions.",
    requiredEvidence:
      "Separate validated employment-selection program, legal review, adverse-impact analysis, governance controls, and customer-specific approval.",
    allowedCopy:
      "Use for planning-only automation-defense review with human oversight and explicit non-employment-decision boundaries.",
  },
];

export const designPartnerOnboardingChecklist: DesignPartnerOnboardingStep[] = [
  {
    step: "Select design partner segment",
    owner: "founder",
    artifact: "Pilot validation worksheet row",
    acceptanceEvidence: "Buyer segment, reviewer role, organization, and reviewed proof artifact are recorded.",
    boundary: "Segment selection is a scoping decision, not proof of product-market fit.",
  },
  {
    step: "Confirm planning-only use",
    owner: "partner",
    artifact: "Decision-boundary confirmation",
    acceptanceEvidence: "Partner confirms no hiring, firing, pay, promotion, discipline, layoff, or individual-ranking use.",
    boundary: "Confirmation supports pilot framing only and does not certify legal compliance.",
  },
  {
    step: "Run artifact review",
    owner: "staff-review",
    artifact: "Sample report, cohort proof pack, or role-level CSV audit",
    acceptanceEvidence: "Usefulness score, trust objection, and missing-source notes are recorded.",
    boundary: "Review feedback is qualitative until tied to repeated usage, payment, or delivery outcomes.",
  },
  {
    step: "Capture paid-pilot signal",
    owner: "founder",
    artifact: "Lead ops response metrics",
    acceptanceEvidence: "Budget, procurement path, paid discovery interest, or signed next-step scope is recorded.",
    boundary: "Paid intent is not MRR until live payment and fulfillment are reconciled.",
  },
  {
    step: "Approve case-study use",
    owner: "partner",
    artifact: "Case-study permission field and approved quote",
    acceptanceEvidence: "Permission, redaction level, quote owner, and publishable outcome are recorded.",
    boundary: "Do not publish private resume, student, workforce, or contact data without explicit permission.",
  },
];

export const caseStudyCaptureTemplate: CaseStudyCaptureTemplateField[] = [
  {
    field: "baseline_workflow",
    prompt: "What coaching, advising, or workforce-planning workflow existed before the APO proof artifact?",
    requiredFor: "All case studies",
    privacyBoundary: "Describe the workflow, not private client, student, employee, or resume content.",
  },
  {
    field: "artifact_reviewed",
    prompt: "Which exact sample report, cohort pack, or role-level audit did the partner review?",
    requiredFor: "Attribution and reproducibility",
    privacyBoundary: "Use artifact IDs or public sample routes when possible.",
  },
  {
    field: "measured_change",
    prompt: "What changed after review: meeting booked, pilot scoped, report purchased, workflow adopted, or objection retired?",
    requiredFor: "Outcome documentation",
    privacyBoundary: "Do not convert qualitative feedback into numeric impact without measurement.",
  },
  {
    field: "approved_quote",
    prompt: "What exact quote may be used publicly, and who approved it?",
    requiredFor: "Public proof",
    privacyBoundary: "Quote must be permissioned and redact sensitive data by default.",
  },
  {
    field: "does_not_prove",
    prompt: "Which claims are explicitly not supported by this case study?",
    requiredFor: "Every public case study",
    privacyBoundary: "Must include no job-placement, wage-gain, legal-compliance, or market-wide-demand claim unless separately proven.",
  },
];

export const commercialLaunchReadinessMilestones: CommercialLaunchReadinessMilestone[] = [
  {
    phase: "1. Live governance closeout",
    focus: "Make the live Supabase project safe enough for controlled outreach.",
    done: "Parser, authenticated checkout, authenticated portal, live closeout workflow, and public/no-JWT classification with required evidence fields are present.",
    pending: "Function-cap cleanup, live rate/abuse telemetry proof, and owner-led secret rotation.",
    rating: 3.7,
    remainingPercent: 25,
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
    done: "Lead ops, stages, priorities, sequence step, next action, follow-up date, response analytics, CSV export, unsubscribe-safe campaign export, tracked UTM links, A/B variants, and variant response reporting exist.",
    pending: "Email-provider API sync, deployed-domain analytics ingestion, unsubscribe webhook sync-back, and enough live A/B outcome data for market validation.",
    rating: 4.3,
    remainingPercent: 13,
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
    done: "Positioning, proof-pack gallery, sample reports, outreach scripts, feedback fields, and pilot validation worksheet/export exist.",
    pending: "Real 10 coach reviews, 5 career-center reviews, 3 workforce-board reviews, paid pilot willingness evidence, and permissioned quotes.",
    rating: 3.4,
    remainingPercent: 32,
    moveNext: "No broad marketing until feedback and conversion data are captured.",
    priority: "medium",
  },
];

export const paymentFulfillmentStatusItems: PaymentFulfillmentStatusItem[] = [
  {
    item: "Authenticated subscription checkout",
    currentProof: "Frontend sends Supabase JWT and deployed create-checkout-session verifies caller identity.",
    remainingAction: "Run npm run verify:stripe-test-checkout after owner supplies a Stripe test Price ID, test-mode Stripe key, Supabase URL/anon key, and synthetic user credentials.",
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
    sourceId: "ilo-genai-jobs-2025",
    sourceFamily: "ILO GenAI jobs 2025 exposure framing",
    currentState: "Source registered as a 2025 transformation/exposure anchor; used only for task-exposure framing.",
    nextProofNeeded: "Methodology registry row and model-card addendum showing which ILO concepts are mapped, excluded, and claim-limited.",
    confidence: "medium",
    maturity: 3.1,
  },
  {
    sourceId: "wef-foj-2025",
    sourceFamily: "WEF Future of Jobs 2025 macro signal",
    currentState: "Source registered for 2025-2030 macro skill and workforce-transition context.",
    nextProofNeeded: "Narrative-source checksum and claim-boundary verifier showing WEF signals are not used as occupation-level scores.",
    confidence: "medium",
    maturity: 3.0,
  },
  {
    sourceId: "esco",
    sourceFamily: "ESCO occupation and skill taxonomy",
    currentState: "Official ESCO source is registered; current app uses bridge/disclosure context rather than scored ESCO outputs.",
    nextProofNeeded: "ESCO import snapshot, concept URI checks, and reviewed crosswalk coverage before any ESCO-backed scoring claim.",
    confidence: "high",
    maturity: 3.0,
  },
  {
    sourceId: "ons-ashe-2025-provisional-table-2",
    sourceFamily: "ONS ASHE UK wage context",
    currentState: "UK SOC mappings and 2025 provisional two-digit ASHE wage rows are visible with parent-group and suppression boundaries.",
    nextProofNeeded: "Full ASHE edition checksum, correction/suppression notes, and occupation-level join review before richer UK wage displays.",
    confidence: "high",
    maturity: 3.3,
  },
  {
    sourceId: "statcan-noc-jobbank",
    sourceFamily: "Canada NOC and Job Bank wage/outlook context",
    currentState: "NOC 2021 mappings and national Job Bank wage rows are visible; outlook remains geography-required.",
    nextProofNeeded: "Province/economic-region selector, Job Bank outlook row checksum, and undetermined-status handling before Canada outlook display.",
    confidence: "high",
    maturity: 3.4,
  },
  {
    sourceId: "abs-osca-jsa",
    sourceFamily: "Australia OSCA and JSA occupation profiles",
    currentState: "ANZSCO parent-group JSA values are visible with OSCA 2024 transition boundary and parent-group labels.",
    nextProofNeeded: "OSCA-aware JSA source migration check, profile checksum, and suppressed/N/A row handling before exact Australian occupation claims.",
    confidence: "high",
    maturity: 3.2,
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

export const pilotValidationTargets: PilotValidationTarget[] = [
  {
    buyerSegment: "Career coaches and resume writers",
    targetCount: 10,
    qualifyingEvidence: "A named reviewer inspects a coach-branded sample report and scores usefulness, trust, and client-fit language.",
    successThreshold: "At least 6 useful-or-better reviews, 3 discovery calls, and 1 paid-pilot conversation.",
    currentProof: "Coach sample route, evidence-card report body, consent capture, tracked campaign export, and response metrics exist.",
    remainingAction: "Run founder-led reviews and log usefulness score, trust objection, meeting, paid-signal, and permission fields.",
    maturity: 3.6,
  },
  {
    buyerSegment: "Career centers and alumni offices",
    targetCount: 5,
    qualifyingEvidence: "A counselor or career-center owner reviews the aggregate cohort proof pack and privacy/workshop framing.",
    successThreshold: "At least 3 counselor-useful reviews and 1 workshop-fit discussion with an institutional review owner.",
    currentProof: "Aggregate-only cohort report, FERPA/NACE caveats, downloadable HTML/CSV, and institutional readiness packet exist.",
    remainingAction: "Capture workshop use case, privacy objection, acceptable-use confirmation, and case-study permission status.",
    maturity: 3.4,
  },
  {
    buyerSegment: "Workforce boards and L&D teams",
    targetCount: 3,
    qualifyingEvidence: "A workforce/L&D reviewer inspects a role-level CSV audit sample with no employee ranking or employment-decision use.",
    successThreshold: "At least 1 anonymized 10-25 role CSV pilot and one SOC/local-market review owner identified.",
    currentProof: "Workforce CSV audit, executive report skeleton, unmapped review queue, and local-market snapshot packet exist.",
    remainingAction: "Capture role-count, SOC-review owner, local-source requirement, governance blocker, and paid-pilot path.",
    maturity: 3.3,
  },
  {
    buyerSegment: "Paid pilot willingness",
    targetCount: 3,
    qualifyingEvidence: "A buyer states budget, procurement path, paid discovery interest, or report-credit purchase intent.",
    successThreshold: "At least 1 paid pilot or clear procurement path before broad paid marketing.",
    currentProof: "Pricing route and authenticated checkout source exist, but live credit fulfillment is still blocked by function capacity.",
    remainingAction: "Log paid willingness separately from polite feedback; do not sell paid credits until payment proof passes.",
    maturity: 3.0,
  },
];

export const pilotValidationWorksheetColumns: PilotValidationWorksheetColumn[] = [
  {
    column: "buyer_segment",
    purpose: "Separates coach, career-center, workforce, and paid-pilot evidence.",
    requiredFor: "All validation rows",
    boundary: "Segment evidence is directional and does not prove market-wide demand.",
  },
  {
    column: "proof_artifact_reviewed",
    purpose: "Links feedback to the exact sample report, cohort pack, workforce audit, or gallery route reviewed.",
    requiredFor: "All validation rows",
    boundary: "A viewed artifact does not prove buyer adoption or procurement readiness.",
  },
  {
    column: "usefulness_score_1_to_5",
    purpose: "Captures whether the proof pack would change a real coaching, advising, or planning workflow.",
    requiredFor: "Coach, career-center, and workforce reviews",
    boundary: "Usefulness scores are not sales forecasts or employment outcomes.",
  },
  {
    column: "trust_objection",
    purpose: "Records missing source, privacy, accessibility, legal, local-market, or payment proof blockers.",
    requiredFor: "All validation rows",
    boundary: "An objection is a product-learning signal, not legal advice.",
  },
  {
    column: "paid_pilot_signal",
    purpose: "Distinguishes willingness to pay from general encouragement or polite feedback.",
    requiredFor: "Paid pilot qualification",
    boundary: "A paid signal does not prove revenue until payment and delivery are completed.",
  },
  {
    column: "case_study_permission",
    purpose: "Tracks whether a quote or outcome can be used in outreach without exposing private data.",
    requiredFor: "Public case-study use",
    boundary: "No private resume, student, or workforce data should enter outreach without explicit approval.",
  },
  {
    column: "decision_boundary_confirmed",
    purpose: "Confirms the reviewer accepts no layoff prediction, no employee ranking, and no hiring/firing use.",
    requiredFor: "Institutional and workforce rows",
    boundary: "Acceptance confirms pilot framing only; it is not legal compliance certification.",
  },
];

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function buildPilotValidationWorksheetCsv(): string {
  const header = [
    "buyer_segment",
    "target_count",
    "reviewer_name_or_role",
    "organization",
    "proof_artifact_reviewed",
    "usefulness_score_1_to_5",
    "trust_objection",
    "meeting_booked_at",
    "paid_pilot_signal",
    "case_study_permission",
    "decision_boundary_confirmed",
    "next_action_owner",
    "source_ids",
    "does_not_prove",
  ];

  const rows = pilotValidationTargets.map((target) => [
    target.buyerSegment,
    target.targetCount,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "nace-career-readiness;nist-ai-rmf;wcag-22;dol-ai-literacy-framework",
    "This worksheet does not prove market demand, revenue, legal compliance, employment outcomes, or buyer adoption until real review and payment evidence is attached.",
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

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

export const coachCommercializationWorkflow: CoachCommercializationWorkflowStep[] = [
  {
    step: "Review sample artifact",
    routeOrArtifact: "/sample-report and /proof-pack-gallery",
    owner: "coach",
    proofToCapture: "Reviewed artifact hash, buyer segment, usefulness score, trust objection, and reviewer permission state.",
    claimBoundary: "Artifact review is product-learning evidence only; it does not prove paid demand or client outcomes.",
    acceptanceGate: "At least three permissioned partner review records before public design-partner claims.",
  },
  {
    step: "Run white-label automation defense audit",
    routeOrArtifact: "/for-coaches and /tools/counselor-reports",
    owner: "coach",
    proofToCapture: "Client context reviewed, source IDs retained, limitation language retained, and human review confirmed.",
    claimBoundary: "Use as a planning artifact, not a validated assessment or employment decision system.",
    acceptanceGate: "Coach confirms planning-only language and no hiring/firing/eligibility use.",
  },
  {
    step: "Capture revealed transition choice",
    routeOrArtifact: "/outcomes and revealed_transition_events",
    owner: "client-review",
    proofToCapture: "Options presented, selected option, follow-up status, consent flags, and does-not-prove acknowledgement.",
    claimBoundary: "Revealed choices are directional product telemetry, not placement, wage, or causal outcome proof.",
    acceptanceGate: "Consent and does-not-prove acknowledgement required before outcome learning is aggregated.",
  },
  {
    step: "Attach owner-held proof",
    routeOrArtifact: "docs/commercialization redacted evidence templates",
    owner: "owner-held-evidence",
    proofToCapture: "Stripe live/test evidence, partner hashes, outcome hashes, and production calibration proof.",
    claimBoundary: "No live MRR, committed-partner, or documented-outcome claim until redacted owner proof passes validators.",
    acceptanceGate: "npm run closeout:owner-evidence -- --write --refresh-tracked after owner evidence is complete.",
  },
];
