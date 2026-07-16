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
  commercialEvidenceRecordsComposer: read('scripts/compose-commercial-evidence-records.mjs'),
  commercialEvidenceRecordsVerifier: read('scripts/verify-commercial-evidence-records.mjs'),
  ownerEvidenceArtifactHasher: read('scripts/hash-owner-evidence-artifacts.mjs'),
  ownerEvidenceFixtureVerifier: read('scripts/verify-owner-evidence-fixture-path.mjs'),
  ownerEvidencePrep: read('scripts/prepare-owner-evidence-workspace.mjs'),
  ownerEvidenceCloseout: read('scripts/closeout-owner-evidence.mjs'),
  remediationCompletionAuditVerifier: read('scripts/verify-remediation-completion-audit.mjs'),
  commercialEvidenceIntakeTemplate: read('docs/commercialization/commercial-evidence-intake-template.json'),
  commercialEvidenceRecordsTemplate: read('docs/commercialization/commercial-evidence-records-template.json'),
  stripeTestCheckoutVerifier: read('scripts/verify-stripe-test-checkout.mjs'),
  stripeLiveMrrVerifier: read('scripts/verify-stripe-live-mrr.mjs'),
  productionCalibrationVerifier: read('scripts/verify-production-calibration-run.mjs'),
  liveGateEvidenceTemplate: read('docs/commercialization/live-gate-evidence-template.json'),
  gitignore: read('.gitignore'),
  remediationGatesVerifier: read('scripts/verify-remediation-external-gates.mjs'),
};
const commercialEvidenceIntakeTemplate = JSON.parse(files.commercialEvidenceIntakeTemplate);

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
  'npm run verify:owner-evidence-prep',
  'npm run prepare:owner-evidence',
  'npm run hash:owner-evidence-artifacts',
  'npm run verify:owner-evidence-closeout',
  'npm run closeout:owner-evidence',
  'live-gate-evidence-template.json',
].forEach((snippet) => assert(files.playbook.includes(snippet), `Phase E playbook missing ${snippet}`));

assert(/"verify:live-gate-evidence": "node scripts\/verify-live-gate-evidence\.mjs"/.test(files.packageJson), 'live-gate evidence verifier script must be wired');
assert(/"compose:live-gate-evidence": "node scripts\/compose-live-gate-evidence\.mjs"/.test(files.packageJson), 'live-gate evidence composer script must be wired');
assert(/"compose:commercial-evidence-records": "node scripts\/compose-commercial-evidence-records\.mjs"/.test(files.packageJson), 'commercial evidence records composer script must be wired');
assert(/"verify:commercial-evidence-records": "node scripts\/verify-commercial-evidence-records\.mjs"/.test(files.packageJson), 'commercial evidence records verifier script must be wired as read-only by default');
assert(/"verify:commercial-evidence-records:write": "node scripts\/verify-commercial-evidence-records\.mjs --write"/.test(files.packageJson), 'commercial evidence records write verifier script must be wired explicitly');
assert(/"verify:owner-evidence-fixtures": "node scripts\/verify-owner-evidence-fixture-path\.mjs"/.test(files.packageJson), 'owner evidence fixture verifier script must be wired');
assert(/"prepare:owner-evidence": "node scripts\/prepare-owner-evidence-workspace\.mjs"/.test(files.packageJson), 'owner evidence preparation command must be wired');
assert(/"hash:owner-evidence-artifacts": "node scripts\/hash-owner-evidence-artifacts\.mjs"/.test(files.packageJson), 'owner evidence artifact hashing command must be wired');
assert(/"verify:owner-evidence-prep": "node scripts\/prepare-owner-evidence-workspace\.mjs"/.test(files.packageJson), 'owner evidence preparation status command must be wired');
assert(/"closeout:owner-evidence": "node scripts\/closeout-owner-evidence\.mjs"/.test(files.packageJson), 'owner evidence closeout command must be wired');
assert(/"verify:owner-evidence-closeout": "node scripts\/closeout-owner-evidence\.mjs --allow-incomplete"/.test(files.packageJson), 'owner evidence closeout status command must be wired');
assert(/"verify:remediation-completion-audit": "node scripts\/verify-remediation-completion-audit\.mjs"/.test(files.packageJson), 'remediation completion audit verifier script must be wired');
assert(/"verify:remediation-completion-audit:write": "node scripts\/verify-remediation-completion-audit\.mjs --write"/.test(files.packageJson), 'remediation completion audit write script must be wired');
assert(/"verify:stripe-test-checkout": "node scripts\/verify-stripe-test-checkout\.mjs --write"/.test(files.packageJson), 'Stripe test checkout verifier script must be wired');
assert(/"verify:stripe-live-mrr": "node scripts\/verify-stripe-live-mrr\.mjs --write"/.test(files.packageJson), 'Stripe live MRR verifier script must be wired');
assert(/"verify:production-calibration": "node scripts\/verify-production-calibration-run\.mjs --write"/.test(files.packageJson), 'production calibration verifier script must be wired');
assert(/validateLiveGateEvidence/.test(files.liveGateEvidenceVerifier), 'live-gate evidence verifier must call the shared validator');
assert(/--require-complete/.test(files.liveGateEvidenceVerifier), 'live-gate evidence verifier must support the documented --require-complete flag');
assert(/complete/.test(files.liveGateEvidenceVerifier), 'live-gate evidence verifier must expose completion state');
assert(/validateLiveGateEvidence/.test(files.liveGateEvidenceComposer), 'live-gate evidence composer must validate composed evidence');
assert(/stripe-test-checkout-proof-latest\.json/.test(files.liveGateEvidenceComposer), 'live-gate evidence composer must consume Stripe test checkout proof artifacts');
assert(/stripe-live-mrr-proof-latest\.json/.test(files.liveGateEvidenceComposer), 'live-gate evidence composer must consume Stripe live MRR proof artifacts');
assert(/production-calibration-proof-latest\.json/.test(files.liveGateEvidenceComposer), 'live-gate evidence composer must consume production calibration proof artifacts');
assert(/live-auth-e2e-proof-latest\.json/.test(files.liveGateEvidenceComposer), 'live-gate evidence composer must consume authenticated live e2e proof artifacts');
assert(/validateLiveEvidence/.test(files.liveGateEvidenceComposer), 'live-gate evidence composer must return the validation follow-up command');
assert(/finalReadOnlyLedger/.test(files.liveGateEvidenceComposer), 'live-gate evidence composer must return the read-only final ledger command');
assert(/refreshTrackedLedger/.test(files.liveGateEvidenceComposer), 'live-gate evidence composer must return the tracked-ledger refresh command');
assert(/future-dated/.test(files.liveGateEvidenceLibrary), 'live-gate evidence verifier must reject future-dated metadata');
assert(/later than asOf/.test(files.liveGateEvidenceLibrary), 'live-gate evidence verifier must reject observedAt later than asOf');
assert(/COMMERCIAL_EVIDENCE_HASH_SALT/.test(files.commercialEvidenceRecordsComposer), 'commercial evidence composer must support owner-held hash salt env');
assert(/validateCommercialEvidence/.test(files.commercialEvidenceRecordsComposer), 'commercial evidence composer must validate composed records');
assert(/partnerRef/.test(files.commercialEvidenceRecordsComposer), 'commercial evidence composer must consume owner-held partner refs');
assert(/outcomeRef/.test(files.commercialEvidenceRecordsComposer), 'commercial evidence composer must consume owner-held outcome refs');
assert(/proofArtifactHashes/.test(files.commercialEvidenceRecordsComposer), 'commercial evidence composer must carry proof artifact hashes');
assert(/proofArtifactTypes/.test(files.commercialEvidenceRecordsComposer), 'commercial evidence composer must carry proof artifact types');
assert(/rawEvidenceOwnerHeld/.test(files.commercialEvidenceRecordsComposer), 'commercial evidence composer must require owner-held raw evidence attestation');
assert(/ownerEvidenceArchive/.test(files.commercialEvidenceRecordsComposer), 'commercial evidence composer must require owner-held commercial archive metadata');
assert(/finalReadOnlyLedger/.test(files.commercialEvidenceRecordsComposer), 'commercial evidence composer must return the read-only final ledger command');
assert(/refreshTrackedLedger/.test(files.commercialEvidenceRecordsComposer), 'commercial evidence composer must return the tracked-ledger refresh command');
assert(/three_committed_partners/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must cover partner commitments');
assert(/documented_outcomes/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must cover documented outcomes');
assert(/acceptedDesignPartnerCount/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must count accepted partner records');
assert(/acceptedOutcomeCount/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must count accepted outcome records');
assert(/uniqueDesignPartnerCount/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must count unique partner hashes');
assert(/uniqueOutcomeCount/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must count unique outcome hashes');
assert(/proofArtifactHashes/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must require proof artifact hashes');
assert(/proofArtifactTypes/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must require proof artifact types');
assert(/rawEvidenceOwnerHeld/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must require owner-held raw evidence attestation');
assert(/ownerEvidenceArchive/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must require owner-held commercial archive metadata');
assert(/future-dated/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must reject future-dated metadata');
assert(/later than asOf/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must reject record dates later than asOf');
assert(/composeFromOwnerIntake/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must publish the owner-intake compose command');
assert(/refreshTrackedLedger/.test(files.commercialEvidenceRecordsVerifier), 'commercial evidence verifier must publish the tracked-ledger refresh command');
assert(/apo-owner-evidence-artifact-hashes\.v1/.test(files.ownerEvidenceArtifactHasher), 'owner evidence artifact hasher must declare its schema version');
assert(/proofArtifactHash/.test(files.ownerEvidenceArtifactHasher), 'owner evidence artifact hasher must emit proof artifact hashes');
assert(/sourcePathHash/.test(files.ownerEvidenceArtifactHasher), 'owner evidence artifact hasher must avoid source filenames by using path fingerprints');
assert(/noSourceFilenamesPrinted/.test(files.ownerEvidenceArtifactHasher), 'owner evidence artifact hasher must state that source filenames are not printed');
assert(/noRawFileContentsPrinted/.test(files.ownerEvidenceArtifactHasher), 'owner evidence artifact hasher must state that raw file contents are not printed');
assert(/rawArtifactsOwnerHeld/.test(files.ownerEvidenceArtifactHasher), 'owner evidence artifact hasher must preserve owner-held raw artifact boundary');
assert(/verify-live-gate-evidence\.mjs/.test(files.ownerEvidenceFixtureVerifier), 'owner evidence fixture verifier must exercise live evidence validation');
assert(/verify-commercial-evidence-records\.mjs/.test(files.ownerEvidenceFixtureVerifier), 'owner evidence fixture verifier must exercise commercial evidence validation');
assert(/verify-remediation-external-gates\.mjs/.test(files.ownerEvidenceFixtureVerifier), 'owner evidence fixture verifier must exercise final remediation gates');
assert(/goalCompleteWithSyntheticFixtures/.test(files.ownerEvidenceFixtureVerifier), 'owner evidence fixture verifier must prove the synthetic complete path reaches goalComplete');
assert(/Synthetic non-secret metadata only/.test(files.ownerEvidenceFixtureVerifier), 'owner evidence fixture verifier must describe its non-proof fixture boundary');
assert(/buildEnvTemplate/.test(files.ownerEvidencePrep), 'owner evidence prep must create a local env scaffold only when requested');
assert(/commercial-evidence-intake-template\.json/.test(files.ownerEvidencePrep), 'owner evidence prep must use the commercial evidence intake template');
assert(/This helper creates or inspects local owner-evidence scaffolding only/.test(files.ownerEvidencePrep), 'owner evidence prep must describe its non-proof boundary');
assert(/readyForCloseout/.test(files.ownerEvidencePrep), 'owner evidence prep must report whether owner inputs are closeout-ready');
assert(/--require-ready/.test(files.ownerEvidencePrep), 'owner evidence prep must support fail-closed readiness mode');
assert(/hashCommercialProofArtifacts/.test(files.ownerEvidencePrep), 'owner evidence prep must publish the partner/outcome proof artifact hash command');
assert(/hashManualWcagProofArtifacts/.test(files.ownerEvidencePrep), 'owner evidence prep must publish the manual WCAG proof artifact hash command');
assert(/compose-live-gate-evidence\.mjs/.test(files.ownerEvidenceCloseout), 'owner evidence closeout must run live evidence composition');
assert(/compose-commercial-evidence-records\.mjs/.test(files.ownerEvidenceCloseout), 'owner evidence closeout must run commercial records composition');
assert(/verify-live-gate-evidence\.mjs/.test(files.ownerEvidenceCloseout), 'owner evidence closeout must validate live evidence');
assert(/verify-commercial-evidence-records\.mjs/.test(files.ownerEvidenceCloseout), 'owner evidence closeout must validate commercial evidence records');
assert(/verify-remediation-external-gates\.mjs/.test(files.ownerEvidenceCloseout), 'owner evidence closeout must run the final remediation gate');
assert(/--allow-incomplete/.test(files.ownerEvidenceCloseout), 'owner evidence closeout must support incomplete status runs');
assert(/--stripe-test-artifact/.test(files.ownerEvidenceCloseout), 'owner evidence closeout must pass through alternate live proof artifact paths');
assert(/hashCommercialProofArtifacts/.test(files.ownerEvidenceCloseout), 'owner evidence closeout status must surface the partner/outcome proof artifact hash command');
assert(/hashManualWcagProofArtifacts/.test(files.ownerEvidenceCloseout), 'owner evidence closeout status must surface the manual WCAG proof artifact hash command');
assert(/const refreshTracked = hasFlag\('--refresh-tracked'\)/.test(files.ownerEvidenceCloseout), 'owner evidence closeout must not refresh tracked ledgers unless explicitly requested');
assert(/COMMERCIAL_EVIDENCE_HASH_SALT/.test(files.playbook), 'Phase E playbook must document owner-held hash salt use for closeout');
assert(/phaseDeliverables/.test(files.remediationCompletionAuditVerifier), 'remediation completion audit must publish per-phase deliverables');
assert(/confidenceDelta/.test(files.remediationCompletionAuditVerifier), 'remediation completion audit must include confidence delta');
assert(/remainingExternalGates/.test(files.remediationCompletionAuditVerifier), 'remediation completion audit must include remaining external gates');
assert(/Keep the active goal open/.test(files.remediationCompletionAuditVerifier), 'remediation completion audit must preserve incomplete goal boundary when live evidence is missing');
assert(/designPartnerCommitments/.test(files.commercialEvidenceRecordsTemplate), 'commercial evidence template must include design partner commitments');
assert(/documentedOutcomes/.test(files.commercialEvidenceRecordsTemplate), 'commercial evidence template must include documented outcomes');
assert(/2026-06-01\.apo-commercial-evidence-intake\.v1/.test(files.commercialEvidenceIntakeTemplate), 'commercial evidence intake template must declare the expected schema version');
assert(/hashSalt/.test(files.commercialEvidenceIntakeTemplate), 'commercial evidence intake template must include hash salt guidance');
assert(/proofArtifactHashes/.test(files.commercialEvidenceIntakeTemplate), 'commercial evidence intake template must include proof artifact hash guidance');
assert(/proofArtifactTypes/.test(files.commercialEvidenceIntakeTemplate), 'commercial evidence intake template must include proof artifact type guidance');
assert(/rawEvidenceOwnerHeld/.test(files.commercialEvidenceIntakeTemplate), 'commercial evidence intake template must include owner-held raw evidence attestation');
assert(/ownerEvidenceArchive/.test(files.commercialEvidenceIntakeTemplate), 'commercial evidence intake template must include owner-held commercial archive metadata');
assert(Array.isArray(commercialEvidenceIntakeTemplate.designPartnerCommitments), 'commercial evidence intake template must include designPartnerCommitments array');
assert(commercialEvidenceIntakeTemplate.designPartnerCommitments.length >= 3, 'commercial evidence intake template must include at least three design-partner placeholder records');
assert(Array.isArray(commercialEvidenceIntakeTemplate.documentedOutcomes), 'commercial evidence intake template must include documentedOutcomes array');
assert(commercialEvidenceIntakeTemplate.documentedOutcomes.length >= 1, 'commercial evidence intake template must include at least one documented-outcome placeholder record');
commercialEvidenceIntakeTemplate.designPartnerCommitments.forEach((item, index) => {
  assert(/replace-with-owner-stable-partner-reference-/.test(item.partnerRef), `design partner template ${index + 1} must use a placeholder partner reference`);
  assert(Array.isArray(item.proofArtifactHashes) && item.proofArtifactHashes.length > 0, `design partner template ${index + 1} must include proof artifact hashes`);
  assert(Array.isArray(item.proofArtifactTypes) && item.proofArtifactTypes.includes('artifact_review_log'), `design partner template ${index + 1} must include artifact_review_log proof type`);
  assert(item.rawEvidenceOwnerHeld === true, `design partner template ${index + 1} must preserve owner-held raw evidence attestation`);
  assert(item.ownerEvidenceArchive?.permissionTrailOwnerHeld === true, `design partner template ${index + 1} must preserve owner-held permission archive attestation`);
});
assert(/docs\/commercialization\/live-gate-evidence\.local\.json/.test(files.gitignore), 'owner-held live evidence file must be gitignored');
assert(/docs\/commercialization\/commercial-evidence-intake\.local\.json/.test(files.gitignore), 'owner-held commercial intake file must be gitignored');
assert(/docs\/commercialization\/commercial-evidence-records\.local\.json/.test(files.gitignore), 'owner-held commercial evidence records file must be gitignored');
assert(/--live-evidence/.test(files.remediationGatesVerifier), 'remediation gate verifier must accept explicit live evidence path');
assert(/--commercial-evidence/.test(files.remediationGatesVerifier), 'remediation gate verifier must accept explicit commercial evidence path');
assert(/--write/.test(files.remediationGatesVerifier), 'remediation gate verifier must require explicit --write for tracked ledger artifacts');
assert(/owner-evidence-fixtures/.test(read('scripts/verify-commercial-release.mjs')), 'commercial release verifier must run the owner evidence fixture path before final ledger generation');
assert(/remediation-completion-audit/.test(read('scripts/verify-commercial-release.mjs')), 'commercial release verifier must generate the remediation completion audit');
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
