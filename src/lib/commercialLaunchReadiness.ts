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
  artifactState: "redacted_evidence_attached" | "passed_artifact_not_attached" | "failed_artifact" | "missing_owner_record";
  currentProof: string;
  remainingAction: string;
  sourceArtifact: string;
  doesNotProve: string;
}

export interface OwnerEvidenceCloseoutCommandItem {
  commandId: string;
  label: string;
  status:
    | "ready_after_owner_inputs"
    | "preflight_required"
    | "owner_credentials_required"
    | "blocked_until_real_evidence"
    | "owner_attestation_required"
    | "final_closeout";
  command: string;
  requiredOwnerInputs: string[];
  writes: string;
  safetyBoundary: string;
}

export interface OwnerEvidenceActionQueueItem {
  gateId: string;
  label: string;
  status: ReadinessStatus;
  ownerAction: string;
  ownerPrepCommand?: string;
  nextCommand: string;
  riskIfSkipped: string;
  sourceBoundary: string;
  doesNotProve: string;
}

export interface OwnerEvidenceHandoffItem extends OwnerEvidenceActionQueueItem {
  track: "accessibility" | "payments" | "live-runtime" | "commercial-validation";
  closeoutSteps: string;
  closeoutFailureDetails: string[];
  blockingOwnerActions: string[];
  rawEvidencePolicy: string;
  repoDoesNotDo: string;
}

export interface OwnerEvidenceHandoffSummary {
  goalComplete: boolean;
  alignmentStatus: "aligned_with_canonical_ledgers";
  ownerActionQueueCount: number;
  operationalAccessPrerequisiteCount: number;
  sourceArtifacts: string[];
  outputArtifacts: string[];
  alignmentVerifier: string;
  evidenceBoundary: string;
}

export interface OwnerEvidenceOperationalAccessPrerequisite {
  id: string;
  label: string;
  track: "live-runtime";
  status: "owner_access_required" | "passed";
  sourceArtifact: string;
  ownerAction: string;
  ownerPrepCommand: string;
  nextCommand: string;
  accessRecoveryCommands: string[];
  accessRecoveryCommandCount: number;
  blockingCheckIds: string[];
  acceptedWhen: string;
  evidenceBoundary: string;
  doesNotProve: string[];
  rawEvidencePolicy: string;
  repoDoesNotDo: string;
}

export interface OwnerEvidenceCompletionDrillItem extends OwnerEvidenceHandoffItem {
  order: number;
  completionState: "blocked_owner_evidence_required" | "owner_prep_required";
  packetType: "manual_wcag_review" | "live_proof_run" | "commercial_evidence_intake";
  packetStatus: "owner_manual_review_required" | "owner_live_proof_required" | "owner_commercial_evidence_required";
  packetMarkdown: string;
  packetCsv: string;
  packetGeneratorCommand: string;
  expectedProofArtifact: string;
  acceptedWhen: string;
  acceptanceVerifierCommand: string;
}

export interface OwnerEvidenceCompletionDrillSummary {
  status: "owner_evidence_required";
  goalComplete: boolean;
  requiredGateCount: number;
  blockedGateCount: number;
  ownerActionNeededCount: number;
  operationalAccessPrerequisiteCount: number;
  matrixRowCount: number;
  sourceArtifacts: string[];
  outputArtifacts: string[];
  verificationCommand: string;
  evidenceBoundary: string;
}

export interface OwnerEvidenceLocalSafetySummary {
  sourceArtifact: string;
  status: "passed" | "failed" | "missing_local_safety_artifact";
  ok: boolean;
  protectedPathCount: number;
  ignoredProtectedPathCount: number;
  trackedSensitiveFileViolationCount: number;
  stagedSensitivePathViolationCount: number;
  errorCount: number;
  evidenceBoundary: string;
  doesNotProve: string[];
  doesNotProveCount: number;
  sourceTraceCount: number;
  sourceTrace: Array<{
    key: string;
    value: string;
    sourceArtifact: string;
  }>;
  sourceTraceBoundary: string;
}

export interface OwnerEvidencePrepReadinessItem {
  itemId: string;
  track: "accessibility" | "payments" | "live-runtime" | "commercial-validation";
  status:
    | "needs_owner_input"
    | "env_file_complete_not_loaded"
    | "local_placeholder"
    | "local_missing"
    | "failed_artifact"
    | "proof_artifact_ready";
  ownerAction: string;
  source: string;
  nextCommand: string;
  doesNotProve: string;
}

export interface OwnerEvidencePrepReadinessSummary {
  readyForCloseout: boolean;
  ownerActionNeededCount: number;
  sourceArtifact: string;
  sourceCommand: string;
  statusVerifier: string;
  evidenceBoundary: string;
}

export interface OwnerEvidencePrepReadinessGateSummary {
  gateId: string;
  ownerActionNeededCount: number;
  status: "owner_prep_required" | "prep_ready";
  sourceArtifact: string;
  evidenceBoundary: string;
}

export interface OwnerEvidenceCloseoutSummary {
  asOf: string;
  goalComplete: boolean;
  trackedLedger: string;
  passedArtifactCount: number;
  totalGateCount: number;
  remainingGateCount: number;
  remainingGateIds: string[];
  ownerActionNeededCount: number;
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
  totalGateCount: 7,
  remainingGateCount: 5,
  remainingGateIds: [
    "manual_wcag_evidence",
    "real_stripe_test_checkout",
    "live_mrr_gt_zero",
    "three_committed_partners",
    "documented_outcomes",
  ],
  ownerActionNeededCount: 6,
  closeoutBoundary:
    "Tracked redacted artifacts are not the same as final closeout. Part I remains incomplete until npm run closeout:owner-evidence -- --write --refresh-tracked accepts every live, commercial, and manual WCAG evidence gate.",
};

export const ownerEvidenceCloseoutStatusItems: OwnerEvidenceCloseoutStatusItem[] = [
  {
    gateId: "manual_wcag_evidence",
    label: "Manual WCAG accessibility evidence",
    status: "blocked",
    artifactState: "missing_owner_record",
    currentProof:
      "Automated commercial accessibility smoke artifacts exist, but manual WCAG evidence metadata is not attached.",
    remainingAction:
      "Complete the WCAG-EM-scoped review, fill reviewer disclosure, technologies relied upon, sample-selection method, review-record archive attestations, ownerEvidenceArchive policy metadata, replace placeholder hashes in docs/commercialization/manual-wcag-evidence.local.json, and rerun npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete.",
    sourceArtifact: "docs/commercialization/manual-wcag-evidence-latest.json",
    doesNotProve: "WCAG conformance, legal compliance, institutional procurement approval, or future accessibility after UI changes.",
  },
  {
    gateId: "real_stripe_test_checkout",
    label: "Stripe test checkout",
    status: "blocked",
    artifactState: "failed_artifact",
    currentProof:
      "Latest redacted artifact is blocked until an explicit STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY is loaded; generic STRIPE_SECRET_KEY is intentionally ignored for this test proof.",
    remainingAction:
      "Set a test-mode Stripe key through STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY plus STRIPE_TEST_PRICE_ID, then rerun npm run verify:stripe-test-checkout and preserve raw Checkout Session payloads, function invocation metadata, screenshots, and Stripe dashboard records outside git.",
    sourceArtifact: "docs/commercialization/stripe-test-checkout-proof-latest.json",
    doesNotProve: "Live revenue, MRR, webhook fulfillment, or successful payment method collection.",
  },
  {
    gateId: "production_calibration_run",
    label: "Production calibration",
    status: "done",
    artifactState: "redacted_evidence_attached",
    currentProof:
      "Redacted production calibration artifact passed and is accepted by docs/commercialization/live-gate-evidence.local.json.",
    remainingAction:
      "No separate owner prep action remains for this gate; final closeout still requires Stripe test checkout, live MRR, partner/outcome, and manual WCAG evidence.",
    sourceArtifact: "docs/commercialization/production-calibration-proof-latest.json",
    doesNotProve: "Scientific validation beyond the measured sample, future performance, raw label provenance, or employment-decision validity.",
  },
  {
    gateId: "authenticated_live_artifact_e2e",
    label: "Authenticated live artifact e2e",
    status: "done",
    artifactState: "redacted_evidence_attached",
    currentProof:
      "Redacted live auth artifact passed for a synthetic user save/delete/deletion-receipt path and is accepted by docs/commercialization/live-gate-evidence.local.json.",
    remainingAction:
      "No separate owner prep action remains for this gate; final closeout still requires Stripe test checkout, live MRR, partner/outcome, and manual WCAG evidence.",
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
      "Attach owner-held live Stripe evidence only after an active paid subscription or paid invoice exists and npm run verify:stripe-live-mrr passes with subscription/invoice archive policy fields; keep raw exports, dashboard screenshots, and customer-level evidence outside git.",
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
      "Collect three permissioned partner records with pilot scope, planning-only use, artifact reviewed, next step, contact permission, marketing/testimonial integrity attestations, ownerEvidenceArchive policy metadata, and owner-held proof metadata; compose with an owner-held salt.",
    sourceArtifact: "docs/commercialization/commercial-evidence-records-latest.json",
    doesNotProve: "Revenue, retention, market-wide demand, legal compliance, testimonial compliance, or a paid pilot.",
  },
  {
    gateId: "documented_outcomes",
    label: "Permissioned documented outcomes",
    status: "owner_action",
    artifactState: "missing_owner_record",
    currentProof:
      "Commercial evidence verifier is wired, but commercial-evidence-records-latest.json shows 0 accepted outcome hashes.",
    remainingAction:
      "Collect one permissioned outcome record with baseline workflow, artifact reviewed, measured change, measured-change unit, measurement window, outcome claim scope, typicality boundary, approved quote, marketing/testimonial and outcome integrity attestations, ownerEvidenceArchive policy metadata, and explicit does-not-prove boundary.",
    sourceArtifact: "docs/commercialization/commercial-evidence-records-latest.json",
    doesNotProve: "Guaranteed career outcomes, causal product impact, wage gain, placement, legal compliance, testimonial compliance, or generalizable demand.",
  },
];

export const OWNER_EVIDENCE_ACTION_QUEUE_FILENAME = "owner-evidence-action-queue.csv";

export const ownerEvidenceActionQueueItems: OwnerEvidenceActionQueueItem[] = [
  {
    gateId: "manual_wcag_evidence",
    label: "Manual WCAG accessibility evidence",
    status: "blocked",
    ownerAction:
      "Generate the manual WCAG review packet, complete the owner-held WCAG-EM review from the route/checkpoint matrix, document product scope, sample rationale, sample-selection method, technologies relied upon, complete processes, support-baseline combinations, reviewer type/conflict boundary, review-record archive attestations, and ownerEvidenceArchive policy metadata, hash local WCAG review proof files, replace placeholder hashes in the ignored local evidence file, and keep raw reviewer notes/screenshots/AT transcripts/tool output/sample archives/hash source maps outside git.",
    ownerPrepCommand: "npm run generate:manual-wcag-review-packet && npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>",
    nextCommand: "npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete",
    riskIfSkipped:
      "The product can keep automated accessibility smoke evidence, but it must not claim WCAG conformance or procurement-ready accessibility evidence.",
    sourceBoundary: "owner-held manual accessibility review",
    doesNotProve: "WCAG conformance statement; legal compliance; institutional procurement approval; future accessibility after code changes",
  },
  {
    gateId: "real_stripe_test_checkout",
    label: "Real Stripe test-mode checkout",
    status: "blocked",
    ownerAction:
      "Load owner-held Supabase synthetic-user credentials, a Stripe test-mode key, and a matching test Price ID, then run the checkout verifier against the deployed or staging function; keep raw Checkout Session payloads, function invocation metadata, screenshots, and Stripe dashboard records outside git.",
    ownerPrepCommand:
      "npm run generate:live-proof-run-packet && npm run prepare:owner-evidence -- --write && set -a; source .env.local; set +a",
    nextCommand: "npm run verify:stripe-test-checkout",
    riskIfSkipped:
      "Checkout remains source-ready only; no real Stripe test-mode session can be cited in buyer or launch evidence.",
    sourceBoundary: "owner credential gate",
    doesNotProve: "Live revenue; MRR; payment fulfillment in live mode",
  },
  {
    gateId: "live_mrr_gt_zero",
    label: "Live MRR greater than zero",
    status: "owner_action",
    ownerAction:
      "Provide a live-mode read-only Stripe key after a real paid recurring subscription exists, then run the live-MRR verifier without exposing customer or invoice details; keep raw subscription exports, invoice exports, dashboard screenshots, and customer-level evidence outside git.",
    ownerPrepCommand:
      "npm run generate:live-proof-run-packet && npm run prepare:owner-evidence -- --write && set -a; source .env.local; set +a",
    nextCommand: "npm run verify:stripe-live-mrr",
    riskIfSkipped:
      "Revenue must stay unclaimed; test checkout, configured prices, and UI conversion events do not prove live MRR.",
    sourceBoundary: "owner live Stripe credential gate",
    doesNotProve: "Retention; Product-market fit; Future revenue; Accounting-recognized revenue",
  },
  {
    gateId: "three_committed_partners",
    label: "Three committed design partners",
    status: "owner_action",
    ownerAction:
      "Generate the commercial evidence intake packet, use the partner/outcome matrix to prepare owner-held proof, hash owner-held partner proof artifacts, then fill the ignored commercial evidence intake with three permissioned design-partner commitments, non-placeholder proofArtifactHashes, supported proofArtifactTypes, marketing/testimonial integrity attestations, rawEvidenceOwnerHeld=true, ownerEvidenceArchive policy metadata, and an owner-held salt; preserve raw names/contracts/proof artifacts outside git.",
    ownerPrepCommand: "npm run generate:commercial-evidence-intake-packet && npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>",
    nextCommand: "COMMERCIAL_EVIDENCE_HASH_SALT=\"<owner-held salt>\" npm run compose:commercial-evidence-records -- --write --require-all",
    riskIfSkipped:
      "Pilot traction remains a worksheet or lead-ops capability, not committed partner evidence.",
    sourceBoundary: "owner redacted commercial-evidence records",
    doesNotProve: "Revenue; Successful outcomes; Market-wide demand; Legal compliance; Testimonial compliance",
  },
  {
    gateId: "documented_outcomes",
    label: "Permissioned documented outcomes",
    status: "owner_action",
    ownerAction:
      "Generate the commercial evidence intake packet, use the partner/outcome matrix to prepare owner-held proof, hash owner-held outcome proof artifacts, then fill the ignored commercial evidence intake with at least one permissioned documented outcome, including baseline workflow, measured change, measured-change unit, measurement window, outcome claim scope, typicality boundary, quote approval, non-placeholder proofArtifactHashes, supported proofArtifactTypes, marketing/testimonial and outcome integrity attestations, rawEvidenceOwnerHeld=true, ownerEvidenceArchive policy metadata, and caveats.",
    ownerPrepCommand: "npm run generate:commercial-evidence-intake-packet && npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>",
    nextCommand: "COMMERCIAL_EVIDENCE_HASH_SALT=\"<owner-held salt>\" npm run compose:commercial-evidence-records -- --write --require-all",
    riskIfSkipped:
      "Outcome claims must remain absent or anecdote-bounded; no case-study evidence can be cited as launch proof.",
    sourceBoundary: "owner redacted commercial-evidence records",
    doesNotProve: "Guaranteed career outcomes; Causal impact; Generalizable demand; Legal compliance; Testimonial compliance",
  },
];

export function buildOwnerEvidenceActionQueueCsv(): string {
  const header = [
    "gate_id",
    "label",
    "status",
    "owner_action",
    "owner_prep_command",
    "next_command",
    "risk_if_skipped",
    "source_boundary",
    "does_not_prove",
  ];
  const rows = ownerEvidenceActionQueueItems.map((item) => [
    item.gateId,
    item.label,
    item.status,
    item.ownerAction,
    item.ownerPrepCommand || "",
    item.nextCommand,
    item.riskIfSkipped,
    item.sourceBoundary,
    item.doesNotProve,
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export const OWNER_EVIDENCE_HANDOFF_FILENAME = "owner-evidence-handoff-latest.csv";

const ownerEvidenceHandoffTrackByGateId: Record<string, OwnerEvidenceHandoffItem["track"]> = {
  manual_wcag_evidence: "accessibility",
  real_stripe_test_checkout: "payments",
  production_calibration_run: "live-runtime",
  authenticated_live_artifact_e2e: "live-runtime",
  live_mrr_gt_zero: "payments",
  three_committed_partners: "commercial-validation",
  documented_outcomes: "commercial-validation",
};

const ownerEvidenceHandoffCloseoutStepsByGateId: Record<string, string> = {
  manual_wcag_evidence: "verify-manual-wcag-evidence:fail; verify-remediation-gates:fail",
  real_stripe_test_checkout: "compose-live-evidence:fail; verify-live-evidence:fail; verify-remediation-gates:fail",
  live_mrr_gt_zero: "compose-live-evidence:fail; verify-live-evidence:fail; verify-remediation-gates:fail",
  three_committed_partners: "compose-commercial-records:fail; verify-commercial-records:fail; verify-remediation-gates:fail",
  documented_outcomes: "compose-commercial-records:fail; verify-commercial-records:fail; verify-remediation-gates:fail",
};

const liveEvidenceFailureDetail =
  "compose-live-evidence: stripe-test-checkout: docs/commercialization/stripe-test-checkout-proof-latest.json must have status=passed and all checks passed | stripe-live-mrr: docs/commercialization/stripe-live-mrr-proof-latest.json must have status=passed and all checks passed";

const remediationGateFailureDetail =
  "verify-remediation-gates: stderr: Remediation external gates are not complete. See generated artifact for remaining evidence.";

const commercialEvidenceFailureDetail =
  "compose-commercial-records: hashSalt or COMMERCIAL_EVIDENCE_HASH_SALT must be an owner-held non-placeholder string with at least 16 characters | designPartnerCommitments[0].partnerRef must not be a placeholder | designPartnerCommitments[0].proofArtifactHashes must contain at least one non-placeholder sha256 hash | designPartnerCommitments[0].proofArtifactTypes must contain at least one supported proof artifact type | designPartnerCommitments[0].integrityAttestations.marketingUseReviewed must be true | designPartnerCommitments[0].rawEvidenceOwnerHeld must be true | designPartnerCommitments[0].ownerEvidenceArchive.permissionTrailOwnerHeld must be true | documentedOutcomes[0].measuredChangeUnit is required | documentedOutcomes[0].measurementWindow is required | documentedOutcomes[0].outcomeClaimScope is required | documentedOutcomes[0].typicalityBoundary is required | documentedOutcomes[0].integrityAttestations.counterfactualNotClaimed must be true | documentedOutcomes[0].ownerEvidenceArchive.quoteApprovalRecordOwnerHeld must be true | additional redacted placeholder error(s) omitted";

const ownerEvidenceHandoffFailureDetailsByGateId: Record<string, string[]> = {
  manual_wcag_evidence: [
    "verify-manual-wcag-evidence: stderr: Manual WCAG evidence is incomplete.",
    remediationGateFailureDetail,
  ],
  real_stripe_test_checkout: [
    liveEvidenceFailureDetail,
    "verify-live-evidence: stderr: Not all live-gate evidence items are accepted.",
    remediationGateFailureDetail,
  ],
  live_mrr_gt_zero: [
    liveEvidenceFailureDetail,
    "verify-live-evidence: stderr: Not all live-gate evidence items are accepted.",
    remediationGateFailureDetail,
  ],
  three_committed_partners: [
    commercialEvidenceFailureDetail,
    "verify-commercial-records: stderr: Three committed design partners are not proven by the redacted commercial evidence records.",
    remediationGateFailureDetail,
  ],
  documented_outcomes: [
    commercialEvidenceFailureDetail,
    "verify-commercial-records: stderr: Three committed design partners are not proven by the redacted commercial evidence records.",
    remediationGateFailureDetail,
  ],
};

const ownerEvidenceHandoffBlockingOwnerActionsByGateId: Record<string, string[]> = {
  manual_wcag_evidence: [
    "docs/commercialization/manual-wcag-evidence.local.json: run npm run generate:manual-wcag-review-packet and use docs/commercialization/manual-wcag-review-packet-latest.md, docs/commercialization/manual-wcag-review-matrix-latest.csv, and the W3C WCAG-EM Report Tool as the owner-held review worksheet/report export before hashing proof artifacts; create from docs/commercialization/manual-wcag-evidence-template.json after the owner-held WCAG-EM review is complete (template requires 8 checkpoint(s), 9 route(s), and 5 complete process(es), 2 accessibility-support baseline combination(s), and 7 official W3C/WAI reference(s), plus 9 ownerEvidenceArchive policy field(s)), including reviewer disclosure, technologies relied upon, sample-selection method, review-record archive attestations, owner-held WCAG-EM report-tool export, and ownerEvidenceArchive policy metadata, then run npm run hash:owner-evidence-artifacts -- <local WCAG review proof files> before replacing artifactHashes",
  ],
  real_stripe_test_checkout: [
    "stripe_test_checkout: provide STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY and load SUPABASE_URL, SUPABASE_ANON_KEY, LIVE_SUPABASE_TEST_USER_EMAIL, LIVE_SUPABASE_TEST_USER_PASSWORD, STRIPE_TEST_PRICE_ID",
    "docs/commercialization/stripe-test-checkout-proof-latest.json: run owner proof command until status=passed with test-mode subscription Checkout metadata and owner-held Checkout Session/function-invocation archive policy",
  ],
  live_mrr_gt_zero: [
    "live_mrr_gt_zero: load STRIPE_SECRET_KEY",
    "docs/commercialization/stripe-live-mrr-proof-latest.json: run owner proof command until status=passed with active subscription, paid invoice, redacted MRR metadata, and owner-held subscription/invoice archive policy",
  ],
  three_committed_partners: [
    "docs/commercialization/commercial-evidence-intake.local.json: run npm run generate:commercial-evidence-intake-packet and use docs/commercialization/commercial-evidence-intake-packet-latest.md plus docs/commercialization/commercial-evidence-intake-matrix-latest.csv as the owner-held partner/outcome worksheet before hashing proof artifacts; run npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>, then replace placeholder partner/outcome refs, proof artifact hashes/types, integrity attestations, ownerEvidenceArchive policy metadata, measured-outcome scope fields, rawEvidenceOwnerHeld attestation, and hash salt",
  ],
  documented_outcomes: [
    "docs/commercialization/commercial-evidence-intake.local.json: run npm run generate:commercial-evidence-intake-packet and use docs/commercialization/commercial-evidence-intake-packet-latest.md plus docs/commercialization/commercial-evidence-intake-matrix-latest.csv as the owner-held partner/outcome worksheet before hashing proof artifacts; run npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>, then replace placeholder partner/outcome refs, proof artifact hashes/types, integrity attestations, ownerEvidenceArchive policy metadata, measured-outcome scope fields, rawEvidenceOwnerHeld attestation, and hash salt",
  ],
};

const ownerEvidenceHandoffRawEvidencePolicyByGateId: Record<string, string> = {
  manual_wcag_evidence:
    "Keep reviewer notes, screenshots, recordings, reviewer identity, assistive-technology transcripts, evaluation-tool output, issue logs, sample archives, artifact hash source maps, and owner-held archive records outside git; commit only redacted hashes/status metadata and ownerEvidenceArchive policy metadata.",
  real_stripe_test_checkout:
    "Keep Stripe keys, customer IDs, invoice IDs, checkout URLs, Checkout Session payloads, subscription exports, invoice exports, dashboard screenshots, function invocation metadata, and raw exports outside git; commit only redacted proof status, hashes, and ownerEvidenceArchive policy metadata.",
  production_calibration_run:
    "Keep Supabase secrets, synthetic-user credentials, logs with user identifiers, and service-role data outside git; commit only redacted verifier artifacts.",
  authenticated_live_artifact_e2e:
    "Keep Supabase secrets, synthetic-user credentials, logs with user identifiers, and service-role data outside git; commit only redacted verifier artifacts.",
  live_mrr_gt_zero:
    "Keep Stripe keys, customer IDs, invoice IDs, checkout URLs, Checkout Session payloads, subscription exports, invoice exports, dashboard screenshots, function invocation metadata, and raw exports outside git; commit only redacted proof status, hashes, and ownerEvidenceArchive policy metadata.",
  three_committed_partners:
    "Keep partner names, contracts, raw quotes, private notes, contact details, testimonial integrity review notes, material-connection reviews, incentive reviews, archive records, and hash salts outside git; commit only permissioned redacted hashes, caveats, and ownerEvidenceArchive policy metadata.",
  documented_outcomes:
    "Keep partner names, contracts, raw quotes, private notes, contact details, testimonial integrity review notes, material-connection reviews, incentive reviews, typicality substantiation, archive records, and hash salts outside git; commit only permissioned redacted hashes, caveats, and ownerEvidenceArchive policy metadata.",
};

const ownerEvidenceHandoffRepoDoesNotDoByGateId: Record<string, string> = {
  manual_wcag_evidence: "The repo cannot perform the manual WCAG-EM review or certify conformance.",
  real_stripe_test_checkout: "The repo cannot prove a real Stripe test checkout without owner-held test-mode credentials.",
  production_calibration_run:
    "The repo cannot prove production calibration unless the owner target has migrations, deployed functions, logs, and expert labels.",
  authenticated_live_artifact_e2e:
    "The repo cannot prove live authenticated artifact persistence without owner-held target credentials and a synthetic user.",
  live_mrr_gt_zero:
    "The repo cannot prove revenue before a real paid subscription exists and a live-mode read-only Stripe key is supplied.",
  three_committed_partners: "The repo cannot invent partner commitments or permission to cite them.",
  documented_outcomes: "The repo cannot invent measured outcomes, quotes, or permission to cite them.",
};

export const ownerEvidenceHandoffSummary: OwnerEvidenceHandoffSummary = {
  goalComplete: false,
  alignmentStatus: "aligned_with_canonical_ledgers",
  ownerActionQueueCount: 5,
  operationalAccessPrerequisiteCount: 1,
  sourceArtifacts: [
    "docs/commercialization/remediation-external-gates-latest.json",
    "docs/commercialization/owner-evidence-closeout-status-latest.json",
    "docs/commercialization/live-closeout-readiness-latest.json",
    "docs/commercialization/owner-evidence-local-safety-latest.json",
  ],
  outputArtifacts: [
    "docs/commercialization/owner-evidence-handoff-latest.json",
    "docs/commercialization/owner-evidence-handoff-latest.md",
    "docs/commercialization/owner-evidence-handoff-latest.csv",
  ],
  alignmentVerifier: "npm run verify:owner-evidence-handoff-alignment",
  evidenceBoundary:
    "The handoff packet is an owner execution aid. It does not prove live checkout, live MRR, production calibration, authenticated live artifact persistence, committed partners, documented outcomes, manual WCAG conformance, legal compliance, or procurement approval.",
};

export const ownerEvidenceOperationalAccessPrerequisites: OwnerEvidenceOperationalAccessPrerequisite[] = [
  {
    id: "live_closeout_supabase_access",
    label: "Live closeout Supabase project/functions access",
    track: "live-runtime",
    status: "owner_access_required",
    sourceArtifact: "docs/commercialization/live-closeout-readiness-latest.json",
    ownerAction:
      "Use a Supabase account that can manage the target project and access the functions API, then rerun the strict live closeout readiness verifier before claiming O*NET ingest or parse-resume deployment completion.",
    ownerPrepCommand: "npm run generate:live-closeout-readiness",
    nextCommand: "npm run verify:live-closeout-readiness",
    accessRecoveryCommands: [
      "gh secret list --repo sanjabh11/career-automation-insights-engine",
      "supabase login",
      "supabase projects list --output json",
      "supabase functions list --project-ref kvunnankqgfokeufvsrv",
      "npm run generate:live-closeout-readiness",
      "npm run verify:live-closeout-readiness",
    ],
    accessRecoveryCommandCount: 6,
    blockingCheckIds: ["supabase-target-project-visible", "supabase-functions-api-accessible"],
    acceptedWhen:
      "The strict live closeout readiness verifier exits 0 without --allow-incomplete, after the target Supabase project and functions API are visible to the current owner-approved account.",
    evidenceBoundary:
      "This prerequisite checks only whether the current local CLI context can see required GitHub secret names and the target Supabase project/functions surface for live closeout. It records secret names only, never secret values, and does not deploy, mutate, ingest, rotate, or prove production behavior.",
    doesNotProve: [
      "production deployment completion",
      "O*NET Task Ratings live ingest completion",
      "parse-resume deployment completion",
      "production uptime",
      "manual WCAG evidence",
      "live checkout",
      "live MRR",
      "partner commitments",
      "documented outcomes",
    ],
    rawEvidencePolicy:
      "Keep Supabase access tokens, service-role data, project-management credentials, logs with user identifiers, and deployment approvals outside git; commit only redacted status artifacts and command evidence.",
    repoDoesNotDo:
      "The repo cannot grant Supabase project access, run production deployment closeout, ingest live O*NET data, or prove parser deployment without owner-approved access and execution.",
  },
];

export const ownerEvidenceHandoffItems: OwnerEvidenceHandoffItem[] = ownerEvidenceActionQueueItems.map((item) => ({
  ...item,
  track: ownerEvidenceHandoffTrackByGateId[item.gateId],
  closeoutSteps: ownerEvidenceHandoffCloseoutStepsByGateId[item.gateId],
  closeoutFailureDetails: ownerEvidenceHandoffFailureDetailsByGateId[item.gateId],
  blockingOwnerActions: ownerEvidenceHandoffBlockingOwnerActionsByGateId[item.gateId],
  rawEvidencePolicy: ownerEvidenceHandoffRawEvidencePolicyByGateId[item.gateId],
  repoDoesNotDo: ownerEvidenceHandoffRepoDoesNotDoByGateId[item.gateId],
}));

export function buildOwnerEvidenceHandoffCsv(): string {
  const header = [
    "gate_id",
    "track",
    "status",
    "owner_action",
    "owner_prep_command",
    "blocking_owner_actions",
    "next_command",
    "closeout_steps",
    "closeout_failure_details",
    "raw_evidence_policy",
    "repo_does_not_do",
  ];
  const rows = ownerEvidenceHandoffItems.map((item) => [
    item.gateId,
    item.track,
    item.status,
    item.ownerAction,
    item.ownerPrepCommand || "",
    item.blockingOwnerActions.join("; "),
    item.nextCommand,
    item.closeoutSteps,
    item.closeoutFailureDetails.join("; "),
    item.rawEvidencePolicy,
    item.repoDoesNotDo,
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export const OWNER_EVIDENCE_COMPLETION_DRILL_FILENAME = "owner-evidence-completion-matrix-latest.csv";

export const ownerEvidenceCompletionDrillSummary: OwnerEvidenceCompletionDrillSummary = {
  status: "owner_evidence_required",
  goalComplete: false,
  requiredGateCount: 5,
  blockedGateCount: 5,
  ownerActionNeededCount: 6,
  operationalAccessPrerequisiteCount: 1,
  matrixRowCount: 5,
  sourceArtifacts: [
    "docs/commercialization/owner-evidence-completion-drill-latest.json",
    "docs/commercialization/owner-evidence-handoff-latest.json",
    "docs/commercialization/owner-evidence-closeout-status-latest.json",
    "docs/commercialization/remediation-external-gates-latest.json",
    "docs/commercialization/live-closeout-readiness-latest.json",
    "docs/commercialization/owner-evidence-local-safety-latest.json",
  ],
  outputArtifacts: [
    "docs/commercialization/owner-evidence-completion-drill-latest.json",
    "docs/commercialization/owner-evidence-completion-drill-latest.md",
    "docs/commercialization/owner-evidence-completion-matrix-latest.csv",
  ],
  verificationCommand: "npm run verify:owner-evidence-completion-drill",
  evidenceBoundary:
    "The completion drill is an owner execution map over existing packets. It does not run live Stripe or Supabase checks, does not review WCAG manually, does not validate partner/outcome evidence, does not print secrets, and does not upgrade launch readiness while owner evidence is missing.",
};

export const ownerEvidenceLocalSafetySummary: OwnerEvidenceLocalSafetySummary = {
  sourceArtifact: "docs/commercialization/owner-evidence-local-safety-latest.json",
  status: "passed",
  ok: true,
  protectedPathCount: 10,
  ignoredProtectedPathCount: 10,
  trackedSensitiveFileViolationCount: 0,
  stagedSensitivePathViolationCount: 0,
  errorCount: 0,
  evidenceBoundary:
    "This preflight proves only git ignore/tracking/staging policy for owner-held local evidence paths. It does not inspect file contents, validate redacted evidence completeness, prove live payment or revenue, prove partner commitments, prove documented outcomes, prove manual WCAG conformance, or replace host-level secret scanning/push protection.",
  doesNotProve: [
    "absence of secrets in git history, logs, screenshots, local machines, cloud dashboards, browser caches, or third-party systems",
    "validity or completeness of local owner evidence files",
    "commercial-ready status, legal compliance, WCAG conformance, or procurement approval",
  ],
  doesNotProveCount: 3,
  sourceTraceCount: 8,
  sourceTrace: [
    {
      key: "status",
      value: "passed",
      sourceArtifact: "docs/commercialization/owner-evidence-local-safety-latest.json#ok",
    },
    {
      key: "protectedPathCount",
      value: "10",
      sourceArtifact: "docs/commercialization/owner-evidence-local-safety-latest.json#protectedPathCount",
    },
    {
      key: "ignoredProtectedPathCount",
      value: "10",
      sourceArtifact: "docs/commercialization/owner-evidence-local-safety-latest.json#ignoredProtectedPathCount",
    },
    {
      key: "trackedSensitiveFileViolationCount",
      value: "0",
      sourceArtifact: "docs/commercialization/owner-evidence-local-safety-latest.json#trackedSensitiveFileViolations",
    },
    {
      key: "stagedSensitivePathViolationCount",
      value: "0",
      sourceArtifact: "docs/commercialization/owner-evidence-local-safety-latest.json#stagedSensitivePathViolations",
    },
    {
      key: "errorCount",
      value: "0",
      sourceArtifact: "docs/commercialization/owner-evidence-local-safety-latest.json#errorCount",
    },
    {
      key: "doesNotProveCount",
      value: "3",
      sourceArtifact: "docs/commercialization/owner-evidence-local-safety-latest.json#doesNotProveCount",
    },
    {
      key: "evidenceBoundary",
      value:
        "This preflight proves only git ignore/tracking/staging policy for owner-held local evidence paths. It does not inspect file contents, validate redacted evidence completeness, prove live payment or revenue, prove partner commitments, prove documented outcomes, prove manual WCAG conformance, or replace host-level secret scanning/push protection.",
      sourceArtifact: "docs/commercialization/owner-evidence-local-safety-latest.json#evidenceBoundary",
    },
  ],
  sourceTraceBoundary:
    "This local-safety source trace identifies owner-evidence-local-safety artifact anchors for git ignore, tracking, staging, error, and boundary counts. It does not read owner-held evidence file contents, load secrets, run live checks, or upgrade launch readiness.",
};

const ownerEvidenceCompletionPacketByGateId: Record<
  string,
  Pick<
    OwnerEvidenceCompletionDrillItem,
    "packetType" | "packetStatus" | "packetMarkdown" | "packetCsv" | "packetGeneratorCommand"
  >
> = {
  manual_wcag_evidence: {
    packetType: "manual_wcag_review",
    packetStatus: "owner_manual_review_required",
    packetMarkdown: "docs/commercialization/manual-wcag-review-packet-latest.md",
    packetCsv: "docs/commercialization/manual-wcag-review-matrix-latest.csv",
    packetGeneratorCommand: "npm run generate:manual-wcag-review-packet",
  },
  real_stripe_test_checkout: {
    packetType: "live_proof_run",
    packetStatus: "owner_live_proof_required",
    packetMarkdown: "docs/commercialization/live-proof-run-packet-latest.md",
    packetCsv: "docs/commercialization/live-proof-run-matrix-latest.csv",
    packetGeneratorCommand: "npm run generate:live-proof-run-packet",
  },
  production_calibration_run: {
    packetType: "live_proof_run",
    packetStatus: "owner_live_proof_required",
    packetMarkdown: "docs/commercialization/live-proof-run-packet-latest.md",
    packetCsv: "docs/commercialization/live-proof-run-matrix-latest.csv",
    packetGeneratorCommand: "npm run generate:live-proof-run-packet",
  },
  authenticated_live_artifact_e2e: {
    packetType: "live_proof_run",
    packetStatus: "owner_live_proof_required",
    packetMarkdown: "docs/commercialization/live-proof-run-packet-latest.md",
    packetCsv: "docs/commercialization/live-proof-run-matrix-latest.csv",
    packetGeneratorCommand: "npm run generate:live-proof-run-packet",
  },
  live_mrr_gt_zero: {
    packetType: "live_proof_run",
    packetStatus: "owner_live_proof_required",
    packetMarkdown: "docs/commercialization/live-proof-run-packet-latest.md",
    packetCsv: "docs/commercialization/live-proof-run-matrix-latest.csv",
    packetGeneratorCommand: "npm run generate:live-proof-run-packet",
  },
  three_committed_partners: {
    packetType: "commercial_evidence_intake",
    packetStatus: "owner_commercial_evidence_required",
    packetMarkdown: "docs/commercialization/commercial-evidence-intake-packet-latest.md",
    packetCsv: "docs/commercialization/commercial-evidence-intake-matrix-latest.csv",
    packetGeneratorCommand: "npm run generate:commercial-evidence-intake-packet",
  },
  documented_outcomes: {
    packetType: "commercial_evidence_intake",
    packetStatus: "owner_commercial_evidence_required",
    packetMarkdown: "docs/commercialization/commercial-evidence-intake-packet-latest.md",
    packetCsv: "docs/commercialization/commercial-evidence-intake-matrix-latest.csv",
    packetGeneratorCommand: "npm run generate:commercial-evidence-intake-packet",
  },
};

const ownerEvidenceCompletionStateByGateId: Record<string, OwnerEvidenceCompletionDrillItem["completionState"]> = {
  manual_wcag_evidence: "blocked_owner_evidence_required",
  real_stripe_test_checkout: "blocked_owner_evidence_required",
  live_mrr_gt_zero: "owner_prep_required",
  three_committed_partners: "blocked_owner_evidence_required",
  documented_outcomes: "blocked_owner_evidence_required",
};

const ownerEvidenceExpectedProofArtifactByGateId: Record<string, string> = {
  manual_wcag_evidence: "docs/commercialization/manual-wcag-evidence.local.json",
  real_stripe_test_checkout: "docs/commercialization/stripe-test-checkout-proof-latest.json",
  production_calibration_run: "docs/commercialization/production-calibration-proof-latest.json",
  authenticated_live_artifact_e2e: "docs/commercialization/live-auth-e2e-proof-latest.json",
  live_mrr_gt_zero: "docs/commercialization/stripe-live-mrr-proof-latest.json",
  three_committed_partners: "docs/commercialization/commercial-evidence-records.local.json",
  documented_outcomes: "docs/commercialization/commercial-evidence-records.local.json",
};

const ownerEvidenceAcceptedWhenByGateId: Record<string, string> = {
  manual_wcag_evidence:
    "Manual WCAG evidence verifies with --require-complete and final remediation gates pass with --require-complete.",
  real_stripe_test_checkout:
    "Gate proof artifact has status=passed, redacted live-gate evidence accepts the gate, and final remediation gates pass with --require-complete.",
  production_calibration_run:
    "Gate proof artifact has status=passed, redacted live-gate evidence accepts the gate, and final remediation gates pass with --require-complete.",
  authenticated_live_artifact_e2e:
    "Gate proof artifact has status=passed, redacted live-gate evidence accepts the gate, and final remediation gates pass with --require-complete.",
  live_mrr_gt_zero:
    "Gate proof artifact has status=passed, redacted live-gate evidence accepts the gate, and final remediation gates pass with --require-complete.",
  three_committed_partners:
    "Commercial evidence records verify with --require-all and final remediation gates pass with --require-complete.",
  documented_outcomes:
    "Commercial evidence records verify with --require-all and final remediation gates pass with --require-complete.",
};

const ownerEvidenceAcceptanceVerifierByGateId: Record<string, string> = {
  manual_wcag_evidence:
    "npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete",
  real_stripe_test_checkout: "npm run verify:stripe-test-checkout",
  production_calibration_run: "npm run verify:production-calibration",
  authenticated_live_artifact_e2e: "npm run verify:commercial-live-auth-e2e",
  live_mrr_gt_zero: "npm run verify:stripe-live-mrr",
  three_committed_partners:
    "COMMERCIAL_EVIDENCE_HASH_SALT=\"<owner-held salt>\" npm run compose:commercial-evidence-records -- --write --require-all",
  documented_outcomes:
    "COMMERCIAL_EVIDENCE_HASH_SALT=\"<owner-held salt>\" npm run compose:commercial-evidence-records -- --write --require-all",
};

export const ownerEvidenceCompletionDrillItems: OwnerEvidenceCompletionDrillItem[] = ownerEvidenceHandoffItems.map(
  (item, index) => ({
    ...item,
    order: index + 1,
    completionState: ownerEvidenceCompletionStateByGateId[item.gateId],
    ...ownerEvidenceCompletionPacketByGateId[item.gateId],
    expectedProofArtifact: ownerEvidenceExpectedProofArtifactByGateId[item.gateId],
    acceptedWhen: ownerEvidenceAcceptedWhenByGateId[item.gateId],
    acceptanceVerifierCommand: ownerEvidenceAcceptanceVerifierByGateId[item.gateId],
  })
);

export function buildOwnerEvidenceCompletionDrillCsv(): string {
  const header = [
    "order",
    "gate_id",
    "track",
    "status",
    "completion_state",
    "packet_type",
    "packet_status",
    "packet_markdown",
    "packet_csv",
    "packet_generator_command",
    "expected_proof_artifact",
    "accepted_when",
    "acceptance_verifier_command",
    "owner_prep_command",
    "blocking_owner_actions",
    "raw_evidence_policy",
    "repo_does_not_do",
    "does_not_prove",
  ];
  const rows = ownerEvidenceCompletionDrillItems.map((item) => [
    item.order,
    item.gateId,
    item.track,
    item.status,
    item.completionState,
    item.packetType,
    item.packetStatus,
    item.packetMarkdown,
    item.packetCsv,
    item.packetGeneratorCommand,
    item.expectedProofArtifact,
    item.acceptedWhen,
    item.acceptanceVerifierCommand,
    item.ownerPrepCommand || "",
    item.blockingOwnerActions.join("; "),
    item.rawEvidencePolicy,
    item.repoDoesNotDo,
    item.doesNotProve,
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export const OWNER_EVIDENCE_PREP_READINESS_FILENAME = "owner-evidence-prep-readiness.csv";

export const ownerEvidencePrepReadinessSummary: OwnerEvidencePrepReadinessSummary = {
  readyForCloseout: false,
  ownerActionNeededCount: 6,
  sourceArtifact: "docs/commercialization/owner-evidence-closeout-status-latest.json#ownerEvidencePrep",
  sourceCommand: "npm run verify:owner-evidence-prep",
  statusVerifier: "npm run verify:owner-evidence-closeout-status",
  evidenceBoundary:
    "Prep readiness is a redacted owner checklist. It reports only expected proof-env key names and counts, not extra local key names or values. It does not print secrets, partner identities, customer data, raw quotes, contracts, reviewer notes, screenshots, transcripts, or salts, and it does not prove launch readiness.",
};

export const ownerEvidencePrepReadinessGateSummaries: OwnerEvidencePrepReadinessGateSummary[] = [
  {
    gateId: "manual_wcag_evidence",
    ownerActionNeededCount: 1,
    status: "owner_prep_required",
    sourceArtifact:
      "docs/commercialization/owner-evidence-closeout-status-latest.json#ownerEvidencePrep.ownerActionNeededByGate.manual_wcag_evidence",
    evidenceBoundary:
      "Per-gate prep counts mirror redacted closeout metadata only. This does not prove owner-held evidence is complete, valid, or commercially acceptable.",
  },
  {
    gateId: "real_stripe_test_checkout",
    ownerActionNeededCount: 2,
    status: "owner_prep_required",
    sourceArtifact:
      "docs/commercialization/owner-evidence-closeout-status-latest.json#ownerEvidencePrep.ownerActionNeededByGate.real_stripe_test_checkout",
    evidenceBoundary:
      "Per-gate prep counts mirror redacted closeout metadata only. This does not prove owner-held evidence is complete, valid, or commercially acceptable.",
  },
  {
    gateId: "live_mrr_gt_zero",
    ownerActionNeededCount: 2,
    status: "owner_prep_required",
    sourceArtifact:
      "docs/commercialization/owner-evidence-closeout-status-latest.json#ownerEvidencePrep.ownerActionNeededByGate.live_mrr_gt_zero",
    evidenceBoundary:
      "Per-gate prep counts mirror redacted closeout metadata only. This does not prove owner-held evidence is complete, valid, or commercially acceptable.",
  },
  {
    gateId: "three_committed_partners",
    ownerActionNeededCount: 1,
    status: "owner_prep_required",
    sourceArtifact:
      "docs/commercialization/owner-evidence-closeout-status-latest.json#ownerEvidencePrep.ownerActionNeededByGate.three_committed_partners",
    evidenceBoundary:
      "Per-gate prep counts mirror redacted closeout metadata only. This does not prove owner-held evidence is complete, valid, or commercially acceptable.",
  },
  {
    gateId: "documented_outcomes",
    ownerActionNeededCount: 1,
    status: "owner_prep_required",
    sourceArtifact:
      "docs/commercialization/owner-evidence-closeout-status-latest.json#ownerEvidencePrep.ownerActionNeededByGate.documented_outcomes",
    evidenceBoundary:
      "Per-gate prep counts mirror redacted closeout metadata only. This does not prove owner-held evidence is complete, valid, or commercially acceptable.",
  },
];

export const ownerEvidencePrepReadinessItems: OwnerEvidencePrepReadinessItem[] = [
  {
    itemId: "stripe_test_checkout_env",
    track: "payments",
    status: "needs_owner_input",
    ownerAction:
      "Provide explicit STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY with a sk_test_/rk_test_ value and load SUPABASE_URL, SUPABASE_ANON_KEY, LIVE_SUPABASE_TEST_USER_EMAIL, LIVE_SUPABASE_TEST_USER_PASSWORD, and STRIPE_TEST_PRICE_ID.",
    source:
      ".env.local readiness check; required key names only, no extra local key names or secret values; requiredGroupCount=6; presentGroupCount=5; missingGroupCount=1; loadFromEnvFileCount=5; invalidKeyModeCount=0; requiredStripeKeyMode=test",
    nextCommand: "npm run verify:stripe-test-checkout",
    doesNotProve: "Live revenue; MRR; payment fulfillment in live mode",
  },
  {
    itemId: "live_mrr_env",
    track: "payments",
    status: "env_file_complete_not_loaded",
    ownerAction: "Load STRIPE_SECRET_KEY or a live-mode restricted Stripe key only after a real paid subscription exists.",
    source:
      ".env.local readiness check; required key names only, no extra local key names or secret values; requiredGroupCount=1; presentGroupCount=1; missingGroupCount=0; loadFromEnvFileCount=1; invalidKeyModeCount=0; requiredStripeKeyMode=live",
    nextCommand: "npm run verify:stripe-live-mrr",
    doesNotProve: "Retention; product-market fit; future revenue; accounting-recognized revenue",
  },
  {
    itemId: "commercial_intake_placeholders",
    track: "commercial-validation",
    status: "local_placeholder",
    ownerAction:
      "Run npm run generate:commercial-evidence-intake-packet, use the generated partner/outcome matrix for the owner-held intake review, then hash owner-held partner/outcome proof artifacts before replacing placeholder partner/outcome references, proof artifact hashes/types, integrity attestations, ownerEvidenceArchive policy metadata, measured-outcome scope fields, rawEvidenceOwnerHeld attestation, and the owner-held hash salt in the ignored commercial evidence intake.",
    source:
      "docs/commercialization/commercial-evidence-intake.local.json placeholderCount=5; designPartnerCommitmentCount=3; documentedOutcomeCount=1",
    nextCommand: "npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>",
    doesNotProve: "Revenue; successful outcomes; market-wide demand",
  },
  {
    itemId: "manual_wcag_evidence_missing",
    track: "accessibility",
    status: "local_missing",
    ownerAction:
      "Run npm run generate:manual-wcag-review-packet, use the generated route/checkpoint matrix for the owner-held WCAG-EM review, create manual WCAG evidence metadata from the tracked template with the required checkpoint, route, complete-process, accessibility-support baseline, official W3C/WAI reference counts, reviewer disclosure, technologies relied upon, sample-selection method, review-record archive attestations, and ownerEvidenceArchive policy metadata, then hash local WCAG review proof files before replacing artifactHashes.",
    source:
      "docs/commercialization/manual-wcag-evidence.local.json is missing; requiredCheckpointCount=8; requiredRouteCount=9; requiredCompleteProcessCount=5; requiredAccessibilitySupportBaselineCount=2; requiredOfficialReferenceCount=7; requiredOwnerEvidenceArchiveRequirementCount=9",
    nextCommand: "npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>",
    doesNotProve: "WCAG conformance statement; legal compliance; institutional procurement approval",
  },
  {
    itemId: "stripe_test_checkout_artifact_failed",
    track: "payments",
    status: "failed_artifact",
    ownerAction: "Re-run the Stripe test checkout verifier after loading an explicit test-mode key until the proof artifact status is passed.",
    source: "docs/commercialization/stripe-test-checkout-proof-latest.json status=skipped_missing_env",
    nextCommand: "npm run verify:stripe-test-checkout",
    doesNotProve: "Live revenue; live-mode payment fulfillment; webhook fulfillment",
  },
  {
    itemId: "stripe_live_mrr_artifact_failed",
    track: "payments",
    status: "failed_artifact",
    ownerAction:
      "Re-run the live MRR verifier only after a real paid recurring subscription exists and a live read-only Stripe key is loaded until the proof artifact status is passed.",
    source: "docs/commercialization/stripe-live-mrr-proof-latest.json status=failed",
    nextCommand: "npm run verify:stripe-live-mrr",
    doesNotProve: "Retention; product-market fit; future revenue; accounting-recognized revenue",
  },
];

export function buildOwnerEvidencePrepReadinessCsv(): string {
  const header = [
    "item_id",
    "track",
    "status",
    "owner_action",
    "source",
    "next_command",
    "does_not_prove",
  ];
  const rows = ownerEvidencePrepReadinessItems.map((item) => [
    item.itemId,
    item.track,
    item.status,
    item.ownerAction,
    item.source,
    item.nextCommand,
    item.doesNotProve,
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export const ownerEvidenceCloseoutCommandItems: OwnerEvidenceCloseoutCommandItem[] = [
  {
    commandId: "prepare-owner-evidence",
    label: "Prepare local owner evidence scaffolding",
    status: "ready_after_owner_inputs",
    command: "npm run prepare:owner-evidence -- --write",
    requiredOwnerInputs: [
      "Local owner workspace where ignored evidence templates can be created safely.",
      "Owner reviews generated local files before adding any redacted hashes or metadata.",
    ],
    writes: "Ignored local evidence scaffolds such as .env.local and local commercialization evidence templates.",
    safetyBoundary:
      "Creates or preserves local scaffolding only; placeholder files and unloaded env values do not satisfy any launch gate.",
  },
  {
    commandId: "verify-owner-evidence-local-safety",
    label: "Verify local owner evidence safety",
    status: "preflight_required",
    command: "npm run verify:owner-evidence-local-safety",
    requiredOwnerInputs: [
      "Current git worktree with owner local evidence paths still ignored.",
      "Owner has not staged .env.local, docs/commercialization/*.local.json, raw proof archives, screenshots with private data, or hash salts.",
    ],
    writes:
      "docs/commercialization/owner-evidence-local-safety-latest.json and docs/commercialization/owner-evidence-local-safety-latest.md",
    safetyBoundary:
      "Checks git ignore/tracking/staging policy without reading local owner evidence values; it does not prove evidence completeness, live revenue, partner commitments, outcomes, or WCAG conformance.",
  },
  {
    commandId: "generate-live-proof-run-packet",
    label: "Generate live proof run packet",
    status: "owner_credentials_required",
    command: "npm run generate:live-proof-run-packet",
    requiredOwnerInputs: [
      "Current owner evidence prep status, live proof verifier constants, and tracked proof artifact statuses.",
      "Owner uses the generated live-proof matrix before running credentialed Stripe/Supabase proof commands.",
    ],
    writes:
      "docs/commercialization/live-proof-run-packet-latest.md, docs/commercialization/live-proof-run-packet-latest.json, and docs/commercialization/live-proof-run-matrix-latest.csv",
    safetyBoundary:
      "Generates an execution worksheet only; it does not run credentialed checks, print secrets, prove revenue, prove live persistence, or make failed proof artifacts count.",
  },
  {
    commandId: "load-owner-env",
    label: "Load owner-held local environment",
    status: "ready_after_owner_inputs",
    command: "set -a; source .env.local; set +a",
    requiredOwnerInputs: [
      "Owner-approved .env.local with Supabase anon URL/key, dedicated synthetic user credentials, and Stripe keys by mode.",
      "No raw values should be pasted into chat, public docs, or tracked files.",
    ],
    writes: "No tracked files; loads shell variables only.",
    safetyBoundary: "This prepares local proof commands only and does not validate evidence by itself.",
  },
  {
    commandId: "stripe-test-checkout-proof",
    label: "Collect Stripe test checkout proof",
    status: "blocked_until_real_evidence",
    command: "npm run verify:stripe-test-checkout",
    requiredOwnerInputs: [
      "Explicit test-mode Stripe key through STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY.",
      "STRIPE_TEST_PRICE_ID for an active test Price.",
      "Dedicated Supabase synthetic user email/password.",
      "Owner-held raw Checkout Session payloads, function invocation metadata, screenshots, and Stripe dashboard records; only redacted archive-policy metadata belongs in tracked artifacts.",
    ],
    writes: "docs/commercialization/stripe-test-checkout-proof-latest.json",
    safetyBoundary: "Must require Stripe livemode=false and subscription Checkout metadata; does not prove live revenue, payment collection, or webhook fulfillment.",
  },
  {
    commandId: "production-calibration-proof",
    label: "Collect production calibration proof",
    status: "blocked_until_real_evidence",
    command: "npm run verify:production-calibration",
    requiredOwnerInputs: [
      "Owner target Supabase URL and anon key loaded in the local shell.",
      "Production calibration data with expert-assessment pairs available to the deployed verifier.",
    ],
    writes: "docs/commercialization/production-calibration-proof-latest.json",
    safetyBoundary:
      "Reads bounded calibration evidence only; does not prove scientific validity beyond the measured sample or future model performance.",
  },
  {
    commandId: "authenticated-live-artifact-proof",
    label: "Collect authenticated live artifact proof",
    status: "blocked_until_real_evidence",
    command: "npm run verify:commercial-live-auth-e2e",
    requiredOwnerInputs: [
      "Owner target Supabase URL and anon key loaded in the local shell.",
      "Dedicated synthetic user email/password for authenticated artifact create/delete verification.",
    ],
    writes: "docs/commercialization/live-auth-e2e-proof-latest.json",
    safetyBoundary:
      "Uses redacted synthetic-user proof only; does not prove payment status, malware scanning, legal compliance, or broad production reliability.",
  },
  {
    commandId: "stripe-live-mrr-proof",
    label: "Collect live MRR proof",
    status: "blocked_until_real_evidence",
    command: "npm run verify:stripe-live-mrr",
    requiredOwnerInputs: [
      "Live-mode Stripe restricted or secret key with read access for subscriptions and invoices.",
      "At least one active paid subscription or paid invoice; zero revenue must stay failed.",
      "Owner-held subscription exports, invoice exports, dashboard screenshots, and customer-level evidence; only redacted archive-policy metadata belongs in tracked artifacts.",
    ],
    writes: "docs/commercialization/stripe-live-mrr-proof-latest.json",
    safetyBoundary: "Read-only redacted Stripe metadata; does not create charges, prove retention, or prove product-market fit.",
  },
  {
    commandId: "compose-live-gate-evidence",
    label: "Compose partial live-gate evidence",
    status: "ready_after_owner_inputs",
    command: "npm run compose:live-gate-evidence -- --write --allow-partial --output docs/commercialization/live-gate-evidence.local.json",
    requiredOwnerInputs: [
      "At least one accepted redacted proof artifact for Stripe test checkout, production calibration, authenticated live artifact e2e, or live MRR.",
    ],
    writes: "docs/commercialization/live-gate-evidence.local.json",
    safetyBoundary:
      "Writes only accepted redacted live-gate items; final closeout still fails closed until all live-gate artifacts pass and complete validation succeeds.",
  },
  {
    commandId: "validate-live-gate-evidence",
    label: "Validate partial live-gate evidence",
    status: "ready_after_owner_inputs",
    command: "npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-any",
    requiredOwnerInputs: [
      "Redacted local live-gate evidence composed from passing owner-run proof artifacts.",
    ],
    writes: "No files; read-only validation of redacted local live-gate evidence.",
    safetyBoundary:
      "Partial validation proves only that at least one redacted metadata item is accepted; it does not prove complete live evidence or create a commercial-ready claim.",
  },
  {
    commandId: "compose-complete-live-gate-evidence",
    label: "Compose complete live-gate evidence",
    status: "blocked_until_real_evidence",
    command: "npm run compose:live-gate-evidence -- --write --require-complete --output docs/commercialization/live-gate-evidence.local.json",
    requiredOwnerInputs: [
      "All required live proof artifacts have status=passed: Stripe test checkout, production calibration, authenticated live artifact e2e, and live MRR.",
      "Owner has reviewed redacted proof metadata before writing the complete local live-gate evidence file.",
    ],
    writes: "docs/commercialization/live-gate-evidence.local.json",
    safetyBoundary:
      "Fails closed while any live proof artifact is missing or failed; complete composition is required before final owner closeout can pass.",
  },
  {
    commandId: "validate-complete-live-gate-evidence",
    label: "Validate complete live-gate evidence",
    status: "blocked_until_real_evidence",
    command: "npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-complete",
    requiredOwnerInputs: [
      "Complete redacted live-gate evidence file composed from all passing owner-run proof artifacts.",
    ],
    writes: "No files; read-only validation of complete redacted local live-gate evidence.",
    safetyBoundary:
      "This is the live-proof completeness gate before final owner closeout; it does not prove partner commitments, documented outcomes, manual WCAG conformance, legal compliance, or procurement approval.",
  },
  {
    commandId: "generate-commercial-evidence-intake-packet",
    label: "Generate commercial evidence intake packet",
    status: "owner_attestation_required",
    command: "npm run generate:commercial-evidence-intake-packet",
    requiredOwnerInputs: [
      "Current commercial evidence verifier constants and tracked intake template.",
      "Owner will use the generated partner/outcome matrix as a worksheet before creating redacted local evidence metadata.",
    ],
    writes:
      "docs/commercialization/commercial-evidence-intake-packet-latest.md, docs/commercialization/commercial-evidence-intake-packet-latest.json, and docs/commercialization/commercial-evidence-intake-matrix-latest.csv",
    safetyBoundary:
      "Generates an execution worksheet only; it does not prove partner commitments, documented outcomes, revenue, testimonial compliance, or permission to cite.",
  },
  {
    commandId: "hash-commercial-proof-artifacts",
    label: "Hash commercial partner/outcome proof artifacts",
    status: "owner_attestation_required",
    command: "npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>",
    requiredOwnerInputs: [
      "Local owner-held permission emails, signed pilot scopes, artifact review logs, baseline/change notes, quote approvals, or related partner/outcome records.",
      "Owner maps returned proofArtifactHash values into ignored local commercial evidence intake; raw files remain outside git and chat.",
    ],
    writes: "Stdout JSON only; no files are written.",
    safetyBoundary:
      "Prints proofArtifactHash values, byte counts, and sourcePathHash fingerprints only; does not print source filenames or raw file contents and does not prove permission, commitments, outcomes, revenue, or legal approval by itself.",
  },
  {
    commandId: "compose-commercial-evidence-records",
    label: "Compose partner and outcome evidence records",
    status: "blocked_until_real_evidence",
    command: "COMMERCIAL_EVIDENCE_HASH_SALT=\"<owner-held salt>\" npm run compose:commercial-evidence-records -- --write --require-all",
    requiredOwnerInputs: [
      "Three permissioned design-partner intake records with pilot scope, artifact reviewed, next step, and contact permission.",
      "One permissioned outcome record with baseline workflow, measured change, approved quote status, ownerEvidenceArchive policy metadata, and does-not-prove boundary.",
      "Owner-held archive attestations for partner permission trails, pilot scope records, artifact review logs, baseline evidence, measured-change evidence, quote approvals, material-connection review, incentive review, and typicality substantiation.",
      "Non-placeholder owner-held hash salt.",
    ],
    writes: "docs/commercialization/commercial-evidence-records.local.json",
    safetyBoundary: "Hashes/redacts owner-held records; does not prove revenue, broad demand, causal outcome impact, or placement results.",
  },
  {
    commandId: "validate-commercial-evidence-records",
    label: "Validate partner and outcome evidence records",
    status: "ready_after_owner_inputs",
    command: "npm run verify:commercial-evidence-records -- --evidence docs/commercialization/commercial-evidence-records.local.json --require-all",
    requiredOwnerInputs: [
      "Redacted local commercial evidence records composed from owner-held partner and outcome intake.",
    ],
    writes: "No files; read-only validation of redacted local commercial evidence records.",
    safetyBoundary:
      "Validation proves only local redacted record completeness; it does not prove buyer demand, revenue, retention, or broad product-market fit.",
  },
  {
    commandId: "generate-manual-wcag-review-packet",
    label: "Generate manual WCAG review packet",
    status: "owner_attestation_required",
    command: "npm run generate:manual-wcag-review-packet",
    requiredOwnerInputs: [
      "Current commercial accessibility smoke artifact and tracked manual WCAG evidence verifier constants.",
      "Owner will use the generated packet and route/checkpoint matrix as a worksheet before creating redacted local evidence metadata.",
    ],
    writes:
      "docs/commercialization/manual-wcag-review-packet-latest.md, docs/commercialization/manual-wcag-review-packet-latest.json, and docs/commercialization/manual-wcag-review-matrix-latest.csv",
    safetyBoundary:
      "Generates an execution worksheet only; it does not perform the manual review, certify WCAG conformance, or replace owner-held raw review artifacts.",
  },
  {
    commandId: "hash-manual-wcag-proof-artifacts",
    label: "Hash manual WCAG proof artifacts",
    status: "owner_attestation_required",
    command: "npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>",
    requiredOwnerInputs: [
      "Owner-held manual WCAG review notes, screenshots, recordings, assistive-technology transcripts, reviewer identity, evaluation-tool output, issue logs, sample archives, and related evidence files.",
      "Owner maps returned artifact hashes into ignored local manual WCAG evidence metadata.",
    ],
    writes: "Stdout JSON only; no files are written.",
    safetyBoundary:
      "Prints proofArtifactHash values, byte counts, and sourcePathHash fingerprints only; does not print source filenames or raw file contents and does not certify WCAG conformance or procurement approval.",
  },
  {
    commandId: "validate-manual-wcag-evidence",
    label: "Validate manual WCAG evidence",
    status: "owner_attestation_required",
    command: "npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete",
    requiredOwnerInputs: [
      "Completed WCAG-EM-scoped manual review metadata for the commercial route sample.",
      "Owner-held raw notes, screenshots, recordings, assistive-technology transcript notes, evaluation-tool output, issue logs, sample archive notes, and reviewer evidence hashes.",
    ],
    writes: "docs/commercialization/manual-wcag-evidence.local.json",
    safetyBoundary: "Validates redacted metadata only; does not create a WCAG conformance claim, legal approval, or procurement approval.",
  },
  {
    commandId: "final-owner-closeout",
    label: "Run final owner-evidence closeout",
    status: "final_closeout",
    command: "npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-intake docs/commercialization/commercial-evidence-intake.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json",
    requiredOwnerInputs: [
      "Complete live-gate evidence file.",
      "Complete redacted commercial evidence records.",
      "Complete manual WCAG evidence metadata.",
      "Review generated tracked ledgers before committing.",
    ],
    writes: "Tracked remediation and commercialization ledgers only after all gates pass.",
    safetyBoundary: "This is the only command in the list that can move Part I to goalComplete=true; it must remain blocked while any live or commercial gate is missing.",
  },
  {
    commandId: "final-commercial-verification",
    label: "Run final commercial verification",
    status: "final_closeout",
    command: "npm run verify:commercial",
    requiredOwnerInputs: [
      "Final owner-evidence closeout has accepted every live, commercial, manual WCAG, and remediation gate.",
      "Generated artifacts have been reviewed for proof boundaries before any commercial-ready claim.",
    ],
    writes: "Regenerated commercial ledgers, launch evidence artifacts, build output, and route-smoke evidence.",
    safetyBoundary:
      "A passing verifier proves repo checks only; commercial-ready status still requires the accepted owner-held evidence artifacts and launch decision to support it.",
  },
];

export const blockedClaimVisibilityItems: BlockedClaimVisibilityItem[] = [
  {
    claim: "Part I remediation complete",
    currentStatus: "blocked",
    blockingEvidence:
      "Final owner-evidence closeout still reports goalComplete=false and missing live/commercial/manual WCAG evidence records.",
    requiredEvidence:
      "npm run closeout:owner-evidence -- --write --refresh-tracked accepts all live proof, partner, outcome, manual WCAG, and remediation gates.",
    allowedCopy:
      "Repo-side implementation and CI proof-pack checks are substantially complete; final owner-held evidence gates remain open.",
  },
  {
    claim: "APO validity beyond bounded calibration",
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
      "Automated commercial smoke evidence exists and target-size/text-spacing residuals were cleared, but redacted manual WCAG-EM, screen-reader, contrast, focus, form-error, downloadable-artifact, and reviewer-attestation metadata is not attached.",
    requiredEvidence:
      "Completed manual WCAG 2.2 evidence file accepted by verify:manual-wcag-evidence, plus owner-held raw notes, review-record archive, reviewer attestation, and ownerEvidenceArchive policy metadata.",
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
