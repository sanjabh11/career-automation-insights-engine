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

const failures = [];

function assertContains(relativePath, snippet, label = snippet) {
  const source = read(relativePath);
  if (!source.includes(snippet)) {
    failures.push(`${relativePath} missing ${label}`);
  }
}

function assertMatches(relativePath, pattern, label) {
  const source = read(relativePath);
  if (!pattern.test(source)) {
    failures.push(`${relativePath} missing ${label}`);
  }
}

function assertOccurrenceAtLeast(relativePath, snippet, minimum, label = snippet) {
  const source = read(relativePath);
  const count = source.split(snippet).length - 1;
  if (count < minimum) {
    failures.push(`${relativePath} expected at least ${minimum} occurrence(s) of ${label}; found ${count}`);
  }
}

const proofComponentFile = 'src/components/proof/ProofVisibilityPanels.tsx';
const expectedProofSurfaces = [
  {
    component: 'EvidenceGateDashboard',
    marker: 'data-proof-visibility="evidence-gate-dashboard"',
    routeFile: 'src/pages/ResponsibleAIPage.tsx',
    route: '/trust-center',
    purpose: 'evidence gate dashboard',
  },
  {
    component: 'OwnerEvidenceCloseoutPanel',
    marker: 'data-proof-visibility="owner-evidence-closeout-panel"',
    routeFile: 'src/pages/ResponsibleAIPage.tsx',
    route: '/trust-center',
    purpose: 'owner evidence closeout status panel',
  },
  {
    component: 'SourceFreshnessPanel',
    marker: 'data-proof-visibility="source-freshness-panel"',
    routeFile: 'src/pages/ValidationPage.tsx',
    route: '/validation',
    purpose: 'source freshness panel',
  },
  {
    component: 'CalibrationHealthWidget',
    marker: 'data-proof-visibility="calibration-health-widget"',
    routeFile: 'src/pages/ValidationPage.tsx',
    route: '/validation',
    purpose: 'calibration health widget',
  },
  {
    component: 'RegionalDataBadge',
    marker: 'data-proof-visibility="regional-data-badge"',
    routeFile: 'src/components/OccupationAnalysis.tsx',
    route: '/occupation/:code',
    purpose: 'regional data badge',
  },
  {
    component: 'PartnerEvidenceIntakePanel',
    marker: 'data-proof-visibility="partner-evidence-intake"',
    routeFile: 'src/pages/CommercialLeadOpsPage.tsx',
    route: '/operations/leads',
    purpose: 'partner evidence intake UI',
  },
  {
    component: 'OutcomeEvidenceReviewPanel',
    marker: 'data-proof-visibility="outcome-evidence-review"',
    routeFile: 'src/pages/OutcomesPage.tsx',
    route: '/outcomes',
    purpose: 'outcome evidence review UI',
  },
  {
    component: 'CoachAuditWorkspacePanel',
    marker: 'data-proof-visibility="coach-audit-workspace"',
    routeFile: 'src/pages/ForCoachesPage.tsx',
    route: '/for-coaches',
    purpose: 'coach audit workspace',
  },
  {
    component: 'StripeProofStatusCard',
    marker: 'data-proof-visibility="stripe-proof-status-card"',
    routeFile: 'src/pages/ResponsibleAIPage.tsx',
    route: '/trust-center',
    purpose: 'Stripe proof status card',
  },
];

for (const surface of expectedProofSurfaces) {
  assertMatches(
    proofComponentFile,
    new RegExp(`export function ${surface.component}\\b`),
    `${surface.component} export`
  );
  assertContains(proofComponentFile, surface.marker, surface.marker);
  assertContains(surface.routeFile, surface.component, `${surface.component} route wiring`);
}

assertOccurrenceAtLeast(proofComponentFile, 'data-proof-visibility="regional-data-badge"', 2, 'regional-data-badge states');
assertOccurrenceAtLeast(proofComponentFile, 'role="note"', 2, 'regional labor-market disclosure note role');
assertOccurrenceAtLeast(
  proofComponentFile,
  'aria-label="Regional labor-market disclosure"',
  2,
  'regional labor-market disclosure accessible name'
);

[
  'commercialValidationEvidenceGates',
  'ownerEvidenceCloseoutStatusItems',
  'ownerEvidenceCloseoutSummary',
  'goalComplete=false',
  'commercialLaunchGateItems',
  'SOURCE_MANIFEST_LAST_VERIFIED_AT',
  'SOURCE_REFRESH_MANIFEST',
  'sourceFreshnessDashboardRows',
  'matched APO/expert pairs',
  'ECE 0.27855',
  'REGIONAL_WAGE_OUTLOOK_ADAPTERS',
  'GLOBAL_ENGLISH_SOURCE_DATE',
  'Local source row:',
  'designPartnerOnboardingChecklist',
  'caseStudyCaptureTemplate',
  'coachCommercializationWorkflow',
  'paymentFulfillmentStatusItems',
  'Do not claim general accuracy',
  'live revenue and fulfillment claims remain gated',
].forEach((snippet) => assertContains(proofComponentFile, snippet));

[
  'failed_non_test_stripe_key',
  'production-calibration-proof-latest.json',
  'live-auth-e2e-proof-latest.json',
  'stripe-live-mrr-proof-latest.json',
  'commercial-evidence-records-latest.json',
  'closeout:owner-evidence -- --write --refresh-tracked',
].forEach((snippet) => assertContains('src/lib/commercialLaunchReadiness.ts', snippet));

const routeChecks = [
  ['src/App.tsx', 'path="/validation"', '/validation route'],
  ['src/App.tsx', 'path="/resources"', '/resources route'],
  ['src/App.tsx', 'path="/trust-center"', '/trust-center route'],
  ['src/App.tsx', 'path="/responsible-ai"', '/responsible-ai route'],
  ['src/App.tsx', 'path="/operations/leads"', '/operations/leads route'],
  ['src/App.tsx', 'path="/outcomes"', '/outcomes route'],
  ['src/App.tsx', 'path="/for-coaches"', '/for-coaches route'],
  ['src/App.tsx', 'path="/occupation/:code"', '/occupation/:code route'],
  ['src/pages/ResourcesPage.tsx', 'SourceFreshnessPanel', 'resources source freshness panel'],
  ['src/pages/OutcomesPage.tsx', 'OutcomeEvidenceReviewPanel', 'outcomes evidence panel'],
  ['src/pages/ForCoachesPage.tsx', 'CoachAuditWorkspacePanel', 'coach workspace panel'],
  ['src/pages/OccupationDetailPage.tsx', 'OccupationAnalysis', 'occupation detail analysis render'],
  ['src/components/OccupationAnalysis.tsx', 'RegionalDataBadge', 'occupation regional badge render'],
];

for (const [relativePath, snippet, label] of routeChecks) {
  assertContains(relativePath, snippet, label);
}

assertContains('package.json', '"verify:proof-visibility-ui": "node scripts/verify-proof-visibility-ui.mjs"', 'proof visibility verifier script');
assertContains('scripts/verify-commercial-release.mjs', 'verify-proof-visibility-ui.mjs', 'commercial release proof visibility step');

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  verifiedAt: '2026-06-02',
  proofSurfaces: expectedProofSurfaces.map((surface) => ({
    id: surface.marker.match(/"([^"]+)"/)?.[1],
    component: surface.component,
    route: surface.route,
    purpose: surface.purpose,
  })),
  claimBoundary: 'UI proof surfaces prove visibility and wiring only; owner-held revenue, partner, outcome, and live runtime proof remain separate gates.',
}, null, 2));
