#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const files = {
  analyticsHook: read('src/hooks/useAnalyticsEvents.ts'),
  posthog: read('src/lib/posthog.ts'),
  session: read('src/hooks/useSession.ts'),
  search: read('src/components/SearchInterface.tsx'),
  sampleReport: read('src/pages/SampleReportPage.tsx'),
  commercialLeads: read('src/lib/commercialLeads.ts'),
  readiness: read('src/lib/commercialLaunchReadiness.ts'),
  gallery: read('src/pages/ProofPackGalleryPage.tsx'),
  stripe: read('src/lib/stripe.ts'),
  playbook: read('docs/commercialization/phase-e-commercial-validation-playbook.md'),
  packageJson: read('package.json'),
  liveGateEvidenceVerifier: read('scripts/verify-live-gate-evidence.mjs'),
  liveGateEvidenceComposer: read('scripts/compose-live-gate-evidence.mjs'),
  liveGateEvidenceLibrary: read('scripts/lib/liveGateEvidence.mjs'),
  commercialEvidenceRecordsVerifier: read('scripts/verify-commercial-evidence-records.mjs'),
  commercialEvidenceRecordsTemplate: read('docs/commercialization/commercial-evidence-records-template.json'),
  stripeTestCheckoutVerifier: read('scripts/verify-stripe-test-checkout.mjs'),
  stripeLiveMrrVerifier: read('scripts/verify-stripe-live-mrr.mjs'),
  productionCalibrationVerifier: read('scripts/verify-production-calibration-run.mjs'),
  liveGateEvidenceTemplate: read('docs/commercialization/live-gate-evidence-template.json'),
  gitignore: read('.gitignore'),
  remediationGatesVerifier: read('scripts/verify-remediation-external-gates.mjs'),
};

assert(!/DISABLED: Analytics events table has schema issues/.test(files.analyticsHook), 'analytics hook must not remain disabled');
assert(/event_type: eventType/.test(files.analyticsHook), 'analytics hook must write event_type');
assert(/payload: \{/.test(files.analyticsHook), 'analytics hook must write payload');
assert(/sanitizeAnalyticsPayload/.test(files.analyticsHook), 'analytics payload sanitizer is required');
assert(/trackEvent\(eventType/.test(files.analyticsHook), 'analytics hook must mirror events to PostHog when configured');

assert(/defaults: '2026-01-30'/.test(files.posthog), 'PostHog JS defaults date must be explicit');
assert(/person_profiles: 'identified_only'/.test(files.posthog), 'PostHog must avoid anonymous person-profile inflation');
assert(/activation_apo_result_viewed/.test(files.posthog), 'PostHog activation APO helper is required');
assert(/commercial_lead_captured/.test(files.posthog), 'PostHog commercial lead helper is required');
assert(/identifyUser/.test(files.session) && /resetUser/.test(files.session), 'session hook must identify/reset PostHog users');

assert(/activation_apo_result_viewed/.test(files.search), 'APO success path must emit activation event');
assert(/activation_proof_artifact_created/.test(files.sampleReport), 'sample report path must emit proof-artifact activation event');
assert(/commercialLeadCaptured/.test(files.commercialLeads), 'commercial lead capture must emit commercial event without email payload');

[
  'phaseECommercialValidationAsOf',
  'activationRetentionEventCatalog',
  'retentionCohortDefinitions',
  'commercialValidationEvidenceGates',
  'designPartnerOnboardingChecklist',
  'caseStudyCaptureTemplate',
  'Live MRR greater than zero',
  'Three committed design partners',
  'Documented outcomes',
  'Bootcamp CTA hidden or real Stripe price',
].forEach((snippet) => assert(files.readiness.includes(snippet), `commercial readiness missing ${snippet}`));

[
  'data-phase-e-commercial-validation="true"',
  'data-activation-retention-events="true"',
  'data-retention-cohort-definitions="true"',
  'data-design-partner-onboarding="true"',
  'data-case-study-capture-template="true"',
].forEach((snippet) => assert(files.gallery.includes(snippet), `proof-pack gallery missing ${snippet}`));

assert(/stripePriceId: undefined/.test(files.stripe), 'bootcamp Stripe price must remain undefined until a real price is supplied');
assert(/checkoutStatus: 'hidden_pending_live_price'/.test(files.stripe), 'bootcamp checkout must remain hidden pending live price');
const bootcampPlaceholderPriceId = 'price_' + 'bootcamp';
assert(
  !`${files.stripe}\n${files.gallery}\n${files.posthog}`.includes(bootcampPlaceholderPriceId),
  'runtime must not contain the placeholder bootcamp price id'
);

[
  'Live MRR > $0',
  '>=3 committed design partners',
  'Case-Study Template',
  'https://posthog.com/docs/product-analytics/retention',
  'https://posthog.com/docs/product-analytics/funnels',
  'https://posthog.com/docs/libraries/js',
  'https://docs.stripe.com/payments/checkout-sessions',
  'https://docs.stripe.com/test-mode',
  'https://docs.stripe.com/api/subscriptions/list',
  'https://docs.stripe.com/api/invoices/list',
  'npm run verify:live-gate-evidence',
  'npm run verify:commercial-evidence-records',
  'npm run verify:stripe-test-checkout',
  'npm run verify:stripe-live-mrr',
  'npm run verify:production-calibration',
  'live-gate-evidence-template.json',
].forEach((snippet) => assert(files.playbook.includes(snippet), `Phase E playbook missing ${snippet}`));

assert(/"verify:live-gate-evidence": "node scripts\/verify-live-gate-evidence\.mjs"/.test(files.packageJson), 'live-gate evidence verifier script must be wired');
assert(/"compose:live-gate-evidence": "node scripts\/compose-live-gate-evidence\.mjs"/.test(files.packageJson), 'live-gate evidence composer script must be wired');
assert(/"verify:commercial-evidence-records": "node scripts\/verify-commercial-evidence-records\.mjs --write"/.test(files.packageJson), 'commercial evidence records verifier script must be wired');
assert(/"verify:stripe-test-checkout": "node scripts\/verify-stripe-test-checkout\.mjs --write"/.test(files.packageJson), 'Stripe test checkout verifier script must be wired');
assert(/"verify:stripe-live-mrr": "node scripts\/verify-stripe-live-mrr\.mjs --write"/.test(files.packageJson), 'Stripe live MRR verifier script must be wired');
assert(/"verify:production-calibration": "node scripts\/verify-production-calibration-run\.mjs --write"/.test(files.packageJson), 'production calibration verifier script must be wired');
assert(/validateLiveGateEvidence/.test(files.liveGateEvidenceVerifier), 'live-gate evidence verifier must call the shared validator');
assert(/validateLiveGateEvidence/.test(files.liveGateEvidenceComposer), 'live-gate evidence composer must validate composed evidence');
assert(/stripe-test-checkout-proof-latest\.json/.test(files.liveGateEvidenceComposer), 'live-gate evidence composer must consume Stripe test checkout proof artifacts');
assert(/stripe-live-mrr-proof-latest\.json/.test(files.liveGateEvidenceComposer), 'live-gate evidence composer must consume Stripe live MRR proof artifacts');
assert(/production-calibration-proof-latest\.json/.test(files.liveGateEvidenceComposer), 'live-gate evidence composer must consume production calibration proof artifacts');
assert(/live-auth-e2e-proof-latest\.json/.test(files.liveGateEvidenceComposer), 'live-gate evidence composer must consume authenticated live e2e proof artifacts');
assert(/future-dated/.test(files.liveGateEvidenceLibrary), 'live-gate evidence verifier must reject future-dated metadata');
assert(/later than asOf/.test(files.liveGateEvidenceLibrary), 'live-gate evidence verifier must reject observedAt later than asOf');
assert(/three_committed_partners/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must cover partner commitments');
assert(/documented_outcomes/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must cover documented outcomes');
assert(/acceptedDesignPartnerCount/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must count accepted partner records');
assert(/acceptedOutcomeCount/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must count accepted outcome records');
assert(/uniqueDesignPartnerCount/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must count unique partner hashes');
assert(/uniqueOutcomeCount/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must count unique outcome hashes');
assert(/future-dated/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must reject future-dated metadata');
assert(/later than asOf/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must reject record dates later than asOf');
assert(/designPartnerCommitments/.test(files.commercialEvidenceRecordsTemplate), 'commercial evidence template must include design partner commitments');
assert(/documentedOutcomes/.test(files.commercialEvidenceRecordsTemplate), 'commercial evidence template must include documented outcomes');
assert(/docs\/commercialization\/live-gate-evidence\.local\.json/.test(files.gitignore), 'owner-held live evidence file must be gitignored');
assert(/docs\/commercialization\/commercial-evidence-records\.local\.json/.test(files.gitignore), 'owner-held commercial evidence records file must be gitignored');
assert(/--live-evidence/.test(files.remediationGatesVerifier), 'remediation gate verifier must accept explicit live evidence path');
assert(/--commercial-evidence/.test(files.remediationGatesVerifier), 'remediation gate verifier must accept explicit commercial evidence path');
assert(/create-checkout-session/.test(files.stripeTestCheckoutVerifier), 'Stripe test checkout verifier must call the checkout Edge Function');
assert(/livemode=false/.test(files.stripeTestCheckoutVerifier), 'Stripe test checkout verifier must verify Stripe test mode');
assert(/stripe_live_mrr_export/.test(files.stripeLiveMrrVerifier), 'Stripe live MRR verifier must declare the redacted evidence type');
assert(/totalMrrGreaterThanZero/.test(files.stripeLiveMrrVerifier), 'Stripe live MRR verifier must check total MRR');
assert(/activeSubscriptionCount/.test(files.stripeLiveMrrVerifier), 'Stripe live MRR verifier must count active subscriptions');
assert(/paidInvoiceCount/.test(files.stripeLiveMrrVerifier), 'Stripe live MRR verifier must count paid invoices');
assert(/failed_non_live_stripe_key/.test(files.stripeLiveMrrVerifier), 'Stripe live MRR verifier must reject non-live Stripe keys');
assert(/calibrate-ece/.test(files.productionCalibrationVerifier), 'production calibration verifier must call the calibration Edge Function');
assert(/apo_overall_vs_expert_assessments/.test(files.productionCalibrationVerifier), 'production calibration verifier must verify the calibration method');
assert(/pairsCount/.test(files.productionCalibrationVerifier), 'production calibration verifier must verify matched prediction pairs');
assert(/expertRowsCount/.test(files.productionCalibrationVerifier), 'production calibration verifier must verify expert assessment rows');
assert(/2026-05-31\.apo-live-gate-evidence\.v1/.test(files.liveGateEvidenceTemplate), 'live-gate evidence template must declare the expected schema version');

console.log(JSON.stringify({
  ok: true,
  phase: 'E',
  sourceDate: '2026-05-31',
  instrumentation: [
    'analytics_events event_type/payload persistence',
    'PostHog identified-only event capture',
    'APO activation event',
    'proof-artifact activation event',
    'commercial lead capture event',
  ],
  commercialGates: [
    'live_mrr_gt_zero_blocked_until_stripe_live_proof',
    'three_design_partners_manual_required',
    'documented_outcomes_manual_required',
    'bootcamp_cta_hidden_pending_live_price',
  ],
}, null, 2));
