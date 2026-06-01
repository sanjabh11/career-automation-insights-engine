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
  stripeTestCheckoutVerifier: read('scripts/verify-stripe-test-checkout.mjs'),
  liveGateEvidenceTemplate: read('docs/commercialization/live-gate-evidence-template.json'),
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
  'npm run verify:live-gate-evidence',
  'npm run verify:stripe-test-checkout',
  'live-gate-evidence-template.json',
].forEach((snippet) => assert(files.playbook.includes(snippet), `Phase E playbook missing ${snippet}`));

assert(/"verify:live-gate-evidence": "node scripts\/verify-live-gate-evidence\.mjs"/.test(files.packageJson), 'live-gate evidence verifier script must be wired');
assert(/"verify:stripe-test-checkout": "node scripts\/verify-stripe-test-checkout\.mjs --write"/.test(files.packageJson), 'Stripe test checkout verifier script must be wired');
assert(/validateLiveGateEvidence/.test(files.liveGateEvidenceVerifier), 'live-gate evidence verifier must call the shared validator');
assert(/create-checkout-session/.test(files.stripeTestCheckoutVerifier), 'Stripe test checkout verifier must call the checkout Edge Function');
assert(/livemode=false/.test(files.stripeTestCheckoutVerifier), 'Stripe test checkout verifier must verify Stripe test mode');
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
