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
    component: 'BlockedClaimsPanel',
    marker: 'data-proof-visibility="blocked-claims-panel"',
    routeFile: 'src/pages/ResponsibleAIPage.tsx',
    route: '/trust-center',
    purpose: 'blocked claims matrix',
  },
  {
    component: 'OwnerEvidenceCloseoutPanel',
    marker: 'data-proof-visibility="owner-evidence-closeout-panel"',
    routeFile: 'src/pages/ResponsibleAIPage.tsx',
    route: '/trust-center',
    purpose: 'owner evidence closeout status panel',
  },
  {
    component: 'OwnerEvidenceCloseoutPanel',
    marker: 'data-proof-visibility="owner-evidence-command-checklist"',
    routeFile: 'src/pages/ResponsibleAIPage.tsx',
    route: '/trust-center',
    purpose: 'owner evidence closeout command checklist',
  },
  {
    component: 'OwnerEvidenceCloseoutPanel',
    marker: 'data-proof-visibility="owner-evidence-local-safety-preflight"',
    routeFile: 'src/pages/ResponsibleAIPage.tsx',
    route: '/trust-center',
    purpose: 'owner evidence local safety preflight',
  },
  {
    component: 'OwnerEvidenceCloseoutPanel',
    marker: 'data-proof-visibility="owner-evidence-action-queue"',
    routeFile: 'src/pages/ResponsibleAIPage.tsx',
    route: '/trust-center',
    purpose: 'owner evidence action queue',
  },
  {
    component: 'OwnerEvidenceCloseoutPanel',
    marker: 'data-proof-visibility="owner-evidence-prep-readiness"',
    routeFile: 'src/pages/ResponsibleAIPage.tsx',
    route: '/trust-center',
    purpose: 'owner evidence prep readiness',
  },
  {
    component: 'OwnerEvidenceCloseoutPanel',
    marker: 'data-proof-visibility="owner-evidence-completion-drill"',
    routeFile: 'src/pages/ResponsibleAIPage.tsx',
    route: '/trust-center',
    purpose: 'owner evidence completion drill',
  },
  {
    component: 'OwnerEvidenceCloseoutPanel',
    marker: 'data-proof-visibility="owner-evidence-handoff-packet"',
    routeFile: 'src/pages/ResponsibleAIPage.tsx',
    route: '/trust-center',
    purpose: 'owner evidence handoff packet',
  },
  {
    component: 'OwnerEvidenceCloseoutPanel',
    marker: 'data-proof-visibility="owner-operational-access-prerequisites"',
    routeFile: 'src/pages/ResponsibleAIPage.tsx',
    route: '/trust-center',
    purpose: 'owner operational access prerequisites',
  },
  {
    component: 'SourceFreshnessPanel',
    marker: 'data-proof-visibility="source-freshness-panel"',
    routeFile: 'src/pages/ValidationPage.tsx',
    route: '/validation',
    purpose: 'source freshness panel',
  },
  {
    component: 'RegionalLaborMarketSourceRowsPanel',
    marker: 'data-proof-visibility="regional-source-rows-panel"',
    routeFile: 'src/pages/ValidationPage.tsx',
    route: '/validation',
    purpose: 'regional labor-market source row status panel',
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
  'ownerEvidenceCloseoutStatusItems',
  'ownerEvidenceCloseoutSummary',
  'ownerEvidenceCloseoutCommandItems',
  'ownerEvidenceCompletionDrillItems',
  'ownerEvidenceCompletionDrillSummary',
  'ownerEvidenceLocalSafetySummary',
  'OWNER_EVIDENCE_COMPLETION_DRILL_FILENAME',
  'buildOwnerEvidenceCompletionDrillCsv',
  'ownerEvidenceActionQueueItems',
  'OWNER_EVIDENCE_ACTION_QUEUE_FILENAME',
  'buildOwnerEvidenceActionQueueCsv',
  'ownerEvidencePrepReadinessItems',
  'ownerEvidencePrepReadinessSummary',
  'OWNER_EVIDENCE_PREP_READINESS_FILENAME',
  'buildOwnerEvidencePrepReadinessCsv',
  'ownerEvidenceHandoffItems',
  'ownerEvidenceHandoffSummary',
  'OWNER_EVIDENCE_HANDOFF_FILENAME',
  'buildOwnerEvidenceHandoffCsv',
  'ownerEvidenceOperationalAccessPrerequisites',
  'remainingGateCount',
  'Owner action queue',
  'Action CSV',
  'five remaining owner-evidence gates',
  'accepted',
  'ownerPrepCommand',
  'Owner prep command',
  'Next proof command',
  'Owner evidence prep readiness',
  'Prep CSV',
  'Owner evidence completion drill',
  'Completion CSV',
  'data-proof-visibility="owner-evidence-completion-drill"',
  'data-owner-evidence-completion-drill-download="true"',
  'data-owner-evidence-completion-drill-blockers="true"',
  'ownerEvidenceCompletionDrillSummary.blockedGateCount} blocked gates',
  'ownerEvidenceCompletionDrillSummary.ownerActionNeededCount} owner-prep actions',
  'ownerEvidenceCompletionDrillSummary.operationalAccessPrerequisiteCount} operational access item',
  'ownerEvidenceCompletionDrillSummary.matrixRowCount} matrix rows',
  'readyForCloseout={String(ownerEvidencePrepReadinessSummary.readyForCloseout)}',
  'ownerEvidencePrepReadinessSummary.ownerActionNeededCount} owner actions',
  'Owner evidence handoff packet',
  'Handoff CSV',
  'Operational access prerequisites',
  'data-proof-visibility="owner-operational-access-prerequisites"',
  'data-owner-operational-access-blockers="true"',
  'blockingOwnerActions',
  'Blocking owner-prep actions',
  'data-owner-evidence-handoff-blockers="true"',
  'closeoutFailureDetails',
  'data-owner-evidence-handoff-failure-details="true"',
  'Redacted failure detail',
  'data-owner-evidence-action-queue-download="true"',
  'data-owner-evidence-prep-readiness-download="true"',
  'data-proof-visibility="owner-evidence-prep-readiness"',
  'data-owner-evidence-prep-by-gate="true"',
  'gate prep summaries',
  'data-owner-evidence-handoff-download="true"',
  'data-proof-visibility="owner-evidence-handoff-packet"',
  'aligned with canonical ledgers',
  'Owner closeout command checklist',
  'Local evidence safety preflight',
  'data-proof-visibility="owner-evidence-local-safety-preflight"',
  'localSafetyStatus={ownerEvidenceLocalSafetySummary.status}',
  'ownerEvidenceLocalSafetySummary.ignoredProtectedPathCount',
  'ownerEvidenceLocalSafetySummary.trackedSensitiveFileViolationCount',
  'ownerEvidenceLocalSafetySummary.stagedSensitivePathViolationCount',
  'ownerEvidenceLocalSafetySummary.sourceTraceCount',
  'ownerEvidenceLocalSafetySummary.sourceTraceBoundary',
  'source trace rows=',
  'ownerEvidenceLocalSafetySummary.sourceArtifact',
  'Copy command',
  'goalComplete=false',
  'SOURCE_MANIFEST_LAST_VERIFIED_AT',
  'SOURCE_REFRESH_MANIFEST',
  'sourceFreshnessDashboardRows',
  'REGIONAL_LABOR_MARKET_SOURCE_ROW_SUMMARIES',
  'Regional source rows',
  'importedRowCount',
  'sourceDate',
  'suppressionStates',
  'blockedClaimVisibilityItems',
  'Blocked claims matrix',
  'matched APO/expert pairs',
  'ECE 0.27855',
  'REGIONAL_WAGE_OUTLOOK_ADAPTERS',
  'GLOBAL_ENGLISH_SOURCE_DATE',
  'Local source row:',
  'designPartnerOnboardingChecklist',
  'caseStudyCaptureTemplate',
  'data-owner-evidence-draft-builder="partner"',
  'data-owner-evidence-draft-builder="outcome"',
  'designPartnerCommitments',
  'documentedOutcomes',
  'Copy partner draft',
  'Copy outcome draft',
  'commercial-evidence-intake.local.json',
  'COMMERCIAL_EVIDENCE_HASH_SALT',
  'coachCommercializationWorkflow',
  'paymentFulfillmentStatusItems',
  'Do not claim general accuracy',
  'live revenue and fulfillment claims remain gated',
].forEach((snippet) => assertContains(proofComponentFile, snippet));

[
  'Part I remediation complete',
  'APO validity beyond bounded calibration',
  'Live revenue or MRR greater than zero',
  'Three committed design partners',
  'Documented product outcomes',
  'Localized UK/CA/AU exact wage or outlook forecasts',
  'WCAG conformance or institutional accessibility approval',
  'Employment-decision validity',
  'allowedCopy',
  'APO exposure estimates remain U.S. O*NET/BLS basis',
  'goalComplete=false',
  '0 active subscriptions',
  '0 accepted unique design-partner hashes',
  '0 accepted outcome hashes',
  'OwnerEvidenceCloseoutCommandItem',
  'OwnerEvidenceActionQueueItem',
  'OwnerEvidenceOperationalAccessPrerequisite',
  'OwnerEvidenceCompletionDrillItem',
  'OwnerEvidenceCompletionDrillSummary',
  'OwnerEvidenceLocalSafetySummary',
  'sourceTraceCount',
  'sourceTraceBoundary',
  'OwnerEvidencePrepReadinessItem',
  'OwnerEvidencePrepReadinessGateSummary',
  'OwnerEvidencePrepReadinessSummary',
  'ownerEvidenceCloseoutCommandItems',
  'ownerEvidenceCompletionDrillItems',
  'ownerEvidenceCompletionDrillSummary',
  'ownerEvidenceLocalSafetySummary',
  'buildOwnerEvidenceCompletionDrillCsv',
  'OWNER_EVIDENCE_COMPLETION_DRILL_FILENAME',
  'ownerEvidenceActionQueueItems',
  'buildOwnerEvidenceActionQueueCsv',
  'ownerEvidencePrepReadinessItems',
  'ownerEvidencePrepReadinessGateSummaries',
  'ownerEvidencePrepReadinessSummary',
  'buildOwnerEvidencePrepReadinessCsv',
  'OWNER_EVIDENCE_PREP_READINESS_FILENAME',
  'ownerEvidenceHandoffItems',
  'ownerEvidenceHandoffSummary',
  'ownerEvidenceOperationalAccessPrerequisites',
  'blockingOwnerActions',
  'blocking_owner_actions',
  'closeoutFailureDetails',
  'closeout_failure_details',
  'buildOwnerEvidenceHandoffCsv',
  'OWNER_EVIDENCE_HANDOFF_FILENAME',
  'OWNER_EVIDENCE_ACTION_QUEUE_FILENAME',
  'owner-evidence-action-queue.csv',
  'owner-evidence-completion-matrix-latest.csv',
  'owner-evidence-local-safety-latest.json',
  'owner-evidence-prep-readiness.csv',
  'manual_wcag_evidence',
  'real_stripe_test_checkout',
  'live_mrr_gt_zero',
  'three_committed_partners',
  'documented_outcomes',
  'ownerEvidencePrep.ownerActionNeededByGate',
  'owner-evidence-handoff-latest.csv',
  'protectedPathCount: 10',
  'ignoredProtectedPathCount: 10',
  'trackedSensitiveFileViolationCount: 0',
  'stagedSensitivePathViolationCount: 0',
  'ownerActionNeededCount: 10',
  'operationalAccessPrerequisiteCount: 1',
  'blockedGateCount: 7',
  'matrixRowCount: 7',
  'live-closeout-readiness-latest.json',
  'live_closeout_supabase_access',
  'owner_access_required',
  'supabase-target-project-visible',
  'supabase-functions-api-accessible',
  'owner_evidence_required',
  'completionState',
  'packetType',
  'packetStatus',
  'expectedProofArtifact',
  'acceptanceVerifierCommand',
  'live_proof_run',
  'commercial_evidence_intake',
  'manual_wcag_review',
  'stripe_test_checkout_env',
  'skipped_missing_env',
  'manual_wcag_evidence',
  'totalGateCount: 7',
  'ownerActionQueueCount: 7',
  'verify:owner-evidence-handoff-alignment',
  'aligned_with_canonical_ledgers',
  'repoDoesNotDo',
  'rawEvidencePolicy',
  'blockingOwnerActions',
  'ownerPrepCommand',
  'blocking_owner_actions',
  'owner_prep_command',
  'prepare-owner-evidence',
  'load-owner-env',
  'hash-commercial-proof-artifacts',
  'hash-manual-wcag-proof-artifacts',
  'npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>',
  'npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>',
  'proofArtifactHash',
  'sourcePathHash',
  'stripe-test-checkout-proof',
  'production-calibration-proof',
  'authenticated-live-artifact-proof',
  'stripe-live-mrr-proof',
  'compose-commercial-evidence-records',
  'validate-commercial-evidence-records',
  'compose-live-gate-evidence',
  'validate-live-gate-evidence',
  'final-commercial-verification',
  'final-owner-closeout',
  'set -a; source .env.local; set +a',
  'COMMERCIAL_EVIDENCE_HASH_SALT=\\"<owner-held salt>\\"',
].forEach((snippet) => assertContains('src/lib/commercialLaunchReadiness.ts', snippet));

[
  'REGIONAL_LABOR_MARKET_SOURCE_ROW_SUMMARIES',
  'ONS ASHE 2025 provisional Table 2',
  'Canada Job Bank 2025 wage rows',
  'JSA February 2026 occupation profiles',
  '2025-12-19',
  '2025-11-19 wages; 2025-12-15 outlooks',
  '2026-04-02',
  'published_parent_group_value',
  'geography_required',
].forEach((snippet) => assertContains('src/lib/globalEnglishLocalization.ts', snippet));

[
  'O*NET task ratings',
  'BLS wage and employment context',
  'ILO GenAI jobs 2025 exposure framing',
  'WEF Future of Jobs 2025 macro signal',
  'ESCO occupation and skill taxonomy',
  'ONS ASHE UK wage context',
  'Canada NOC and Job Bank wage/outlook context',
  'Australia OSCA and JSA occupation profiles',
  'outlook remains geography-required',
  'OSCA 2024 transition boundary',
  'parent-group and suppression boundaries',
].forEach((snippet) => assertContains('src/lib/commercialLaunchReadiness.ts', snippet));

[
  'skipped_missing_env',
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
