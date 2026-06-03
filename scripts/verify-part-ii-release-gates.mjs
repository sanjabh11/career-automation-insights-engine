#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(source, expected, label) {
  assert(source.includes(expected), `${label} missing: ${expected}`);
}

const methodology = read('src/lib/automationDefenseMethodology.ts');
const sourceManifest = read('src/lib/sourceManifest.ts');
const globalEnglish = read('src/lib/globalEnglishLocalization.ts');
const claimVerifier = read('scripts/verify-claim-boundaries.mjs');
const outcomeMigration = read('supabase/migrations/20260601120000_create_revealed_transition_flywheel.sql');
const outcomeSurvey = read('src/components/outcomes/OutcomeSurvey.tsx');
const commercialReadiness = read('src/lib/commercialLaunchReadiness.ts');
const deploymentPacketGenerator = read('scripts/generate-commercial-supabase-deployment-packet.mjs');
const packageJson = JSON.parse(read('package.json'));
const commercialWorkflow = read('.github/workflows/commercial-proof-pack.yml');

const methodologyRequired = [
  'task_exposure_not_job_loss',
  'automation_augmentation_split',
  'decision_support_estimate',
  'uncertainty_and_review',
  'non_employment_decision_boundary',
  'career_insurance_internal_positioning',
  'ilo-genai-jobs-2025',
  'openai-eloundou-gpts-are-gpts',
  'anthropic-economic-index-2026',
  'nist-ai-rmf',
];

for (const token of methodologyRequired) {
  assertIncludes(methodology, token, 'methodology registry');
}

const sourceRequired = [
  "SOURCE_MANIFEST_LAST_VERIFIED_AT = '2026-06-01'",
  "id: 'ilo-genai-jobs-2025'",
  "id: 'openai-eloundou-gpts-are-gpts'",
  "id: 'anthropic-economic-index-2026'",
  "id: 'abs-osca-2024'",
];

for (const token of sourceRequired) {
  assertIncludes(sourceManifest, token, 'source manifest');
}

const globalRequired = [
  'REGIONAL_WAGE_OUTLOOK_FALLBACKS',
  'unavailable_source_join_pending',
  'suppressed_or_quality_limited',
  "forwardClassificationField: 'osca2024'",
  'getAustraliaOscaTransitionMapping',
  'abs-osca-2024',
];

for (const token of globalRequired) {
  assertIncludes(globalEnglish, token, 'global-English localization');
}

const outcomeRequired = [
  'revealed_transition_events',
  'partner_artifact_reviews',
  'consent_to_research',
  'does_not_prove_acknowledged',
  'Planning telemetry only; does not prove placement, wage gain, retention, or causal impact.',
];

for (const token of outcomeRequired) {
  assertIncludes(outcomeMigration, token, 'revealed-transition migration');
}

for (const token of ['consent_to_research', 'selected_transition_option', 'does_not_prove_acknowledged']) {
  assertIncludes(outcomeSurvey, token, 'outcome survey intake');
}

for (const token of [
  'Part II revealed-transition flywheel',
  '20260601120000_create_revealed_transition_flywheel.sql',
  'supabase functions deploy record-outcome --project-ref kvunnankqgfokeufvsrv',
  'Deploy `record-outcome` only after the Part II migration exists remotely',
]) {
  assertIncludes(deploymentPacketGenerator, token, 'Part II live deployment packet');
}

assertIncludes(commercialReadiness, 'coachCommercializationWorkflow', 'coach commercialization workflow');
assertIncludes(commercialReadiness, 'Run white-label automation defense audit', 'coach commercialization workflow');
assertIncludes(claimVerifier, 'career-insurance-public-copy', 'claim-boundary verifier');
assertIncludes(claimVerifier, 'future-proof-public-copy', 'claim-boundary verifier');
assertIncludes(claimVerifier, 'automation-risk-score-public-copy', 'claim-boundary verifier');
assert(packageJson.scripts?.['verify:part-ii'] === 'node scripts/verify-part-ii-release-gates.mjs', 'package.json must expose verify:part-ii');
assertIncludes(commercialWorkflow, 'npm run verify:part-ii', 'commercial proof-pack workflow');

const publicRuntimeFiles = [
  'index.html',
  'src/pages/AutomationRiskLandingPage.tsx',
  'src/pages/ForCoachesPage.tsx',
  'src/pages/PricingPage.tsx',
  'src/pages/IndustrySEOPage.tsx',
  'src/pages/SEOComparisonPage.tsx',
  'src/components/SEOReportDownload.tsx',
  'src/components/ResumeAnalyzer.tsx',
  'src/pages/whop/DiscoverPage.tsx',
  'src/components/whop/WhopHeroSection.tsx',
];

const forbiddenPublicCopy = [
  { id: 'will-replace', pattern: /Will AI Replace|AI will replace|will not be replaced/i },
  { id: 'future-proof', pattern: /future[- ]proof/i },
  { id: 'career-insurance', pattern: /career insurance/i },
  { id: 'roi-multiple', pattern: /\b15x ROI\b|\b20x over\b|guaranteed ROI/i },
  { id: 'automation-risk-score', pattern: /Automation Risk Score/i },
];

const failures = [];
for (const relativePath of publicRuntimeFiles) {
  const source = read(relativePath);
  for (const { id, pattern } of forbiddenPublicCopy) {
    if (pattern.test(source)) {
      failures.push({ id, file: relativePath });
    }
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  methodologyAsOf: '2026-06-01',
  phasesCovered: ['II-0', 'II-A', 'II-B', 'II-C', 'II-D', 'II-E', 'II-F'],
  gates: {
    scienceBackbone: true,
    buyerJourneyCopy: true,
    revealedTransitionFlywheel: true,
    liveActivationPacket: true,
    globalEnglishFallbacks: true,
    coachCommercializationWorkflow: true,
    releaseVerifier: true,
  },
}, null, 2));
