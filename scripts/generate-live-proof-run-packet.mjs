#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';

const SCHEMA_VERSION = '2026-06-04.apo-live-proof-run-packet.v1';
const OUTPUT_JSON = 'docs/commercialization/live-proof-run-packet-latest.json';
const OUTPUT_MARKDOWN = 'docs/commercialization/live-proof-run-packet-latest.md';
const OUTPUT_CSV = 'docs/commercialization/live-proof-run-matrix-latest.csv';
const PREP_SCRIPT = 'scripts/prepare-owner-evidence-workspace.mjs';
const COMPOSER_SCRIPT = 'scripts/compose-live-gate-evidence.mjs';
const VERIFIER_SCRIPT = 'scripts/verify-live-gate-evidence.mjs';
const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const STRIPE_TEST_CHECKOUT_PROOF_PATH = 'docs/commercialization/stripe-test-checkout-proof-latest.json';
const PRODUCTION_CALIBRATION_PROOF_PATH = 'docs/commercialization/production-calibration-proof-latest.json';
const LIVE_AUTH_E2E_PROOF_PATH = 'docs/commercialization/live-auth-e2e-proof-latest.json';
const STRIPE_LIVE_MRR_PROOF_PATH = 'docs/commercialization/stripe-live-mrr-proof-latest.json';
const SOURCE_PROOF_COUNT_PATHS = new Set([
  STRIPE_TEST_CHECKOUT_PROOF_PATH,
  PRODUCTION_CALIBRATION_PROOF_PATH,
  LIVE_AUTH_E2E_PROOF_PATH,
  STRIPE_LIVE_MRR_PROOF_PATH,
]);
const SOURCE_TRACE_BOUNDARY =
  'This source trace maps each generated live-proof run packet provenance row to the sourceArtifacts key used by the owner worksheet. It does not execute owner commands, load credentials, print secrets, run Stripe or Supabase live checks, create checkout sessions, query live revenue, prove payment readiness, or upgrade launch readiness.';

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function csvCell(value) {
  const source = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return `"${source.replace(/"/g, '""')}"`;
}

function markdownCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function formatList(values) {
  return values.join('; ');
}

function readOwnerPrepStatus() {
  const stdout = execFileSync('node', [PREP_SCRIPT], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(stdout);
}

function readOptionalJson(relativePath) {
  try {
    return JSON.parse(readFileSync(relativePath, 'utf8'));
  } catch {
    return null;
  }
}

const officialReferences = [
  {
    id: 'stripe-test-mode',
    label: 'Stripe testing environments and test mode',
    url: 'https://docs.stripe.com/test-mode',
    appliesTo: ['test checkout proof', 'test keys', 'no real charges in test proof'],
  },
  {
    id: 'stripe-api-keys',
    label: 'Stripe API keys',
    url: 'https://docs.stripe.com/keys',
    appliesTo: ['test/live key prefixes', 'restricted keys', 'live key handling'],
  },
  {
    id: 'stripe-key-best-practices',
    label: 'Stripe secret key best practices',
    url: 'https://docs.stripe.com/keys-best-practices',
    appliesTo: ['prefer restricted keys', 'avoid live keys in testing', 'rotation if exposed'],
  },
  {
    id: 'pci-dss-v4-0-1',
    label: 'PCI DSS v4.0.1 publication notice',
    url: 'https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1',
    appliesTo: ['payment-data security boundary', 'cardholder-data compliance is owner-held', 'no PCI compliance claim'],
  },
  {
    id: 'supabase-edge-function-secrets',
    label: 'Supabase Edge Function environment variables and secrets',
    url: 'https://supabase.com/docs/guides/functions/secrets',
    appliesTo: ['function secrets', 'local env files', 'do not check env files into git'],
  },
  {
    id: 'github-actions-secrets',
    label: 'GitHub Actions secrets',
    url: 'https://docs.github.com/en/actions/concepts/security/secrets',
    appliesTo: ['CI secret names', 'masked secret storage', 'owner-held credentials'],
  },
];

const liveProofSpecs = [
  {
    readinessId: 'stripe_test_checkout',
    gateId: 'real_stripe_test_checkout',
    label: 'Real Stripe test-mode checkout',
    command: 'npm run verify:stripe-test-checkout',
    artifactPath: STRIPE_TEST_CHECKOUT_PROOF_PATH,
    evidenceType: 'stripe_test_checkout_session',
    requiredEnvSummary: [
      'SUPABASE_URL or VITE_SUPABASE_URL',
      'SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY',
      'LIVE_SUPABASE_TEST_USER_EMAIL or STRIPE_TEST_USER_EMAIL',
      'LIVE_SUPABASE_TEST_USER_PASSWORD or STRIPE_TEST_USER_PASSWORD',
      'STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY with sk_test_/rk_test_ prefix; generic STRIPE_SECRET_KEY is ignored for this test proof',
      'STRIPE_TEST_PRICE_ID or APO_STRIPE_TEST_PRICE_ID',
    ],
    preconditions: [
      'Dedicated synthetic Supabase Auth test user exists.',
      'The target create-checkout-session Edge Function is deployed and configured with its own server-side Stripe/Supabase secrets.',
      'The Price ID belongs to Stripe test mode.',
    ],
    acceptanceChecks: [
      'artifact status=passed',
      'all artifact checks passed',
      'evidenceSummary.testMode=true',
      'evidenceSummary.checkoutSessionCreated=true',
      'evidenceSummary.edgeFunction=create-checkout-session',
      'evidenceSummary.checkoutSessionMode=subscription',
      'evidenceSummary.paymentStatus is recorded',
      'evidenceSummary.ownerEvidenceArchive has all checkout archive fields=true',
    ],
    redactionBoundary:
      'Stripe keys, customer identity, payment method details, hosted Checkout URLs, Stripe dashboard URLs, Checkout Session payload, Supabase function invocation metadata, Supabase auth token, and synthetic-user credentials remain owner-held outside tracked files.',
    doesNotProve: ['Live revenue', 'MRR', 'Payment fulfillment in live mode', 'Webhook fulfillment', 'PCI DSS compliance'],
    officialReferenceIds: ['stripe-test-mode', 'stripe-api-keys', 'stripe-key-best-practices', 'pci-dss-v4-0-1', 'supabase-edge-function-secrets'],
  },
  {
    readinessId: 'production_calibration',
    gateId: 'production_calibration_run',
    label: 'Production calibration run',
    command: 'npm run verify:production-calibration',
    artifactPath: PRODUCTION_CALIBRATION_PROOF_PATH,
    evidenceType: 'production_calibration_run',
    requiredEnvSummary: ['SUPABASE_URL or VITE_SUPABASE_URL', 'SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY'],
    preconditions: [
      'Approved migrations are applied to the target Supabase project.',
      'The calibrate-ece Edge Function is deployed.',
      'Function-level service-role secret is configured in Supabase, not committed locally.',
      'Live APO logs and approved expert-assessment rows exist.',
    ],
    acceptanceChecks: [
      'artifact status=passed',
      'all artifact checks passed',
      'evidenceSummary.method=apo_overall_vs_expert_assessments',
      'evidenceSummary.ece is in [0,1]',
      'expertAssessmentCount and predictionPairCount are positive',
      'evidenceSummary.ownerEvidenceArchive has all calibration archive fields=true',
    ],
    redactionBoundary:
      'Supabase service-role key, Supabase dashboard URLs, raw APO logs, respondent details, and non-public expert labels remain owner-held outside tracked files.',
    doesNotProve: ['Scientific validity beyond the measured sample', 'Future model performance', 'Employment-decision validity'],
    officialReferenceIds: ['supabase-edge-function-secrets', 'github-actions-secrets'],
  },
  {
    readinessId: 'authenticated_live_artifact_e2e',
    gateId: 'authenticated_live_artifact_e2e',
    label: 'Authenticated live artifact e2e',
    command: 'npm run verify:commercial-live-auth-e2e',
    artifactPath: LIVE_AUTH_E2E_PROOF_PATH,
    evidenceType: 'authenticated_live_e2e',
    requiredEnvSummary: [
      'SUPABASE_URL or VITE_SUPABASE_URL',
      'SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY',
      'LIVE_SUPABASE_TEST_USER_EMAIL',
      'LIVE_SUPABASE_TEST_USER_PASSWORD',
    ],
    preconditions: [
      'Dedicated synthetic Supabase Auth test user exists.',
      'Target project has the proof-report artifact and deletion receipt schema/RPCs deployed.',
      'The run uses synthetic data only.',
    ],
    acceptanceChecks: [
      'artifact status=passed',
      'all artifact checks passed',
      'auth-sign-in check passed',
      'redacted-artifact-create check passed',
      'redacted-artifact-delete-receipt and readback checks passed',
      'resume-analysis-delete-receipt check passed',
      'evidenceSummary.ownerEvidenceArchive has all authenticated-artifact archive fields=true',
    ],
    redactionBoundary:
      'Synthetic user credentials, auth tokens, Supabase dashboard URLs, raw resume text, stored artifact payloads, and receipt internals remain owner-held or redacted outside tracked files.',
    doesNotProve: ['Payment proof', 'Malware scanning', 'Legal compliance', 'Provider-log deletion'],
    officialReferenceIds: ['supabase-edge-function-secrets', 'github-actions-secrets'],
  },
  {
    readinessId: 'live_mrr_gt_zero',
    gateId: 'live_mrr_gt_zero',
    label: 'Live MRR greater than zero',
    command: 'npm run verify:stripe-live-mrr',
    artifactPath: STRIPE_LIVE_MRR_PROOF_PATH,
    evidenceType: 'stripe_live_mrr_export',
    requiredEnvSummary: ['STRIPE_LIVE_SECRET_KEY, STRIPE_LIVE_RESTRICTED_KEY, or STRIPE_SECRET_KEY with sk_live_/rk_live_ prefix'],
    preconditions: [
      'At least one real paid recurring subscription exists before running the proof.',
      'Prefer a restricted read-only live key with subscription and invoice read access.',
      'Do not use test-mode keys for this proof.',
    ],
    acceptanceChecks: [
      'artifact status=passed',
      'all artifact checks passed',
      'evidenceSummary.liveMode=true',
      'evidenceSummary.totalMrrGreaterThanZero=true',
      'activeSubscriptionCount and paidInvoiceCount are positive',
      'evidenceSummary.ownerEvidenceArchive has all live-MRR archive fields=true',
    ],
    redactionBoundary:
      'Stripe live key, customer identities, subscription IDs, invoice IDs, hosted Stripe Invoice/Billing URLs, Stripe dashboard URLs, payment details, subscription exports, invoice exports, and dashboard revenue screenshots remain owner-held outside tracked files.',
    doesNotProve: ['Retention', 'Product-market fit', 'Future revenue', 'Accounting-recognized revenue', 'PCI DSS compliance'],
    officialReferenceIds: ['stripe-api-keys', 'stripe-key-best-practices', 'pci-dss-v4-0-1', 'github-actions-secrets'],
  },
];

const requirementTemplates = [
  {
    id: 'environment',
    label: 'Owner environment values',
    ownerAction: 'Provide or load the required local/CI secret names for this verifier without printing values.',
  },
  {
    id: 'preconditions',
    label: 'External preconditions',
    ownerAction: 'Confirm target Stripe/Supabase state exists before running the verifier.',
  },
  {
    id: 'run-command',
    label: 'Run proof command',
    ownerAction: 'Run the verifier command from the repo root only after the credential and precondition checks are true.',
  },
  {
    id: 'artifact-review',
    label: 'Review generated artifact',
    ownerAction: 'Confirm the tracked proof artifact has status=passed and contains redacted metadata only.',
  },
  {
    id: 'archive-and-redaction',
    label: 'Owner-held archive and redaction policy',
    ownerAction:
      'Confirm raw provider payloads, screenshots, exports, secrets, tokens, customer identifiers, hosted Stripe URLs, provider dashboard URLs, private profile URLs, and meeting/calendar links are retained owner-held outside git, and that the redacted artifact carries the required ownerEvidenceArchive policy fields.',
  },
  {
    id: 'compose-live-evidence',
    label: 'Compose redacted live-gate evidence',
    ownerAction: 'Run the live-gate composer after all four proof artifacts pass.',
  },
  {
    id: 'validate-live-evidence',
    label: 'Validate fail-closed live evidence',
    ownerAction: 'Compose partial redacted live-gate evidence for accepted proof artifacts, then use complete validation only after all live proof artifacts pass; keep raw proof outside git.',
  },
  {
    id: 'claim-boundary',
    label: 'Claim boundary',
    ownerAction: 'Do not cite this gate beyond the explicit does-not-prove boundary.',
  },
];

function readinessSummary(readiness) {
  if (!readiness) {
    return {
      ready: false,
      envFileCompleteButNotLoaded: false,
      missingGroupCount: null,
      invalidKeyModeCount: null,
      loadFromEnvFileCount: null,
      status: 'missing_readiness_row',
      ownerAction: 'Regenerate owner evidence prep status.',
    };
  }

  const actions = [];
  if (readiness.missingGroupCount > 0) actions.push(`missing ${readiness.missingGroupCount} env group(s)`);
  if (readiness.blankOrPlaceholderEnvFileCount > 0) actions.push(`fill ${readiness.blankOrPlaceholderEnvFileCount} placeholder env value(s)`);
  if (readiness.invalidKeyModeCount > 0) actions.push('replace key with required test/live mode');
  if (readiness.loadFromEnvFileCount > 0) actions.push(`load ${readiness.loadFromEnvFileCount} env value(s) from .env.local`);

  return {
    ready: readiness.ready === true,
    envFileCompleteButNotLoaded: readiness.envFileCompleteButNotLoaded === true,
    missingGroupCount: readiness.missingGroupCount,
    invalidKeyModeCount: readiness.invalidKeyModeCount,
    loadFromEnvFileCount: readiness.loadFromEnvFileCount,
    resolvedStripeMode: readiness.stripeKeyModeRequirement?.resolvedMode || null,
    requiredStripeMode: readiness.stripeKeyModeRequirement?.requiredMode || null,
    status: readiness.ready ? 'ready' : readiness.envFileCompleteButNotLoaded ? 'env_file_complete_not_loaded' : 'owner_action_required',
    ownerAction: actions.length ? actions.join('; ') : 'ready to run command',
  };
}

function proofArtifactSummary(prepStatus, artifactPath) {
  const artifact = (prepStatus.proofArtifacts || []).find((item) => item.path === artifactPath);
  const summary = {
    artifactPath,
    exists: artifact?.exists === true,
    validJson: artifact?.validJson === true,
    artifactStatus: artifact?.artifactStatus || null,
    acceptedSourceArtifact: artifact?.acceptedSourceArtifact === true,
  };
  if (SOURCE_PROOF_COUNT_PATHS.has(artifactPath) && summary.validJson) {
    const source = readOptionalJson(artifactPath);
    summary.doesNotProve = Array.isArray(source?.doesNotProve) ? source.doesNotProve : null;
    summary.doesNotProveCount = Number.isInteger(source?.doesNotProveCount) ? source.doesNotProveCount : null;
  }
  return summary;
}

function buildMatrix(packetRows) {
  return packetRows.flatMap((row) =>
    requirementTemplates.map((requirement) => ({
      gateId: row.gateId,
      readinessId: row.readinessId,
      label: row.label,
      requirementId: requirement.id,
      requirementLabel: requirement.label,
      command: row.command,
      artifactPath: row.artifactPath,
      readinessStatus: row.readiness.status,
      artifactStatus: row.proofArtifact.artifactStatus || 'missing',
      reviewStatus:
        row.readiness.ready && row.proofArtifact.acceptedSourceArtifact
          ? 'proof_artifact_ready'
          : 'owner_live_proof_required',
      ownerAction: requirement.ownerAction,
      requiredEnvSummary: formatList(row.requiredEnvSummary),
      preconditions: formatList(row.preconditions),
      acceptanceChecks: formatList(row.acceptanceChecks),
      redactionBoundary: row.redactionBoundary,
      doesNotProve: formatList(row.doesNotProve),
      officialReferenceIds: formatList(row.officialReferenceIds),
    }))
  );
}

function buildSourceTrace(sourceArtifacts) {
  return Object.entries(sourceArtifacts).map(([key, artifactPath]) => ({
    key,
    artifactPath,
    sourceArtifact: `${OUTPUT_JSON}#sourceArtifacts.${key}`,
  }));
}

async function buildPacket() {
  const generatedAt = new Date().toISOString();
  const prepStatus = readOwnerPrepStatus();
  const readinessById = new Map((prepStatus.liveProofReadiness || []).map((item) => [item.id, item]));
  const packetRows = liveProofSpecs.map((spec) => ({
    ...spec,
    readiness: readinessSummary(readinessById.get(spec.readinessId)),
    proofArtifact: proofArtifactSummary(prepStatus, spec.artifactPath),
  }));
  const runMatrix = buildMatrix(packetRows);
  const acceptedSourceArtifactCount = packetRows.filter((row) => row.proofArtifact.acceptedSourceArtifact).length;
  const readyLiveProofCount = packetRows.filter((row) => row.readiness.ready).length;
  const ownerCommandSequence = [
    'npm run generate:live-proof-run-packet',
    'npm run prepare:owner-evidence -- --write',
    'set -a; source .env.local; set +a',
    'npm run verify:stripe-test-checkout',
    'npm run verify:production-calibration',
    'npm run verify:commercial-live-auth-e2e',
    'npm run verify:stripe-live-mrr',
    'npm run compose:live-gate-evidence -- --write --allow-partial --output docs/commercialization/live-gate-evidence.local.json',
    'npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-any',
  ];
  const doesNotProve = [
    'Commercial readiness',
    'Partner commitments',
    'Documented outcomes',
    'Manual WCAG conformance',
    'Product-market fit',
    'Legal compliance',
    'PCI DSS compliance',
    'Future revenue or retention',
  ];
  const sourceArtifacts = {
    ownerEvidencePrep: PREP_SCRIPT,
    closeoutStatus: CLOSEOUT_STATUS_PATH,
    liveGateComposer: COMPOSER_SCRIPT,
    liveGateVerifier: VERIFIER_SCRIPT,
  };
  const sourceTrace = buildSourceTrace(sourceArtifacts);

  return {
    generatedAt,
    schemaVersion: SCHEMA_VERSION,
    status: acceptedSourceArtifactCount === liveProofSpecs.length ? 'ready_to_compose_live_evidence' : 'owner_live_proof_required',
    requiredLiveGateCount: liveProofSpecs.length,
    readyLiveProofCount,
    acceptedSourceArtifactCount,
    matrixRowCount: runMatrix.length,
    liveProofCount: packetRows.length,
    ownerCommandSequenceCount: ownerCommandSequence.length,
    doesNotProveCount: doesNotProve.length,
    officialReferences,
    officialReferenceCount: officialReferences.length,
    sourceArtifact: sourceArtifacts.ownerEvidencePrep,
    sourceArtifacts,
    sourceArtifactCount: Object.keys(sourceArtifacts).length,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_TRACE_BOUNDARY,
    outputArtifacts: {
      json: OUTPUT_JSON,
      markdown: OUTPUT_MARKDOWN,
      csv: OUTPUT_CSV,
    },
    evidenceBoundary:
      'This packet is an owner-run worksheet only. It does not execute credentialed checks, does not print secrets, and does not make failed or missing proof artifacts count as launch evidence. Raw Stripe API responses, hosted Checkout/Billing/Invoice URLs, subscription and invoice exports, Stripe or Supabase dashboard URLs, private profile URLs, meeting/calendar links, dashboard screenshots, Supabase credentials, customer identities, synthetic-user credentials, auth tokens, service-role data, logs, and raw proof payloads must remain owner-held outside tracked files.',
    liveProofs: packetRows,
    runMatrix,
    ownerCommandSequence,
    doesNotProve,
  };
}

function renderMarkdown(packet) {
  const summaryRows = packet.liveProofs
    .map((item) =>
      `| ${markdownCell(item.label)} | ${markdownCell(item.readiness.status)} | ${markdownCell(item.readiness.ownerAction)} | ${markdownCell(item.proofArtifact.artifactStatus || 'missing')} | ${item.proofArtifact.acceptedSourceArtifact} | \`${item.command}\` | \`${item.artifactPath}\` |`
    )
    .join('\n');
  const referenceRows = packet.officialReferences
    .map((ref) => `| ${markdownCell(ref.label)} | ${markdownCell(ref.url)} | ${markdownCell(formatList(ref.appliesTo))} |`)
    .join('\n');
  const commandRows = packet.ownerCommandSequence.map((command) => `- \`${command}\``).join('\n');
  const sourceTraceRows = packet.sourceTrace
    .map((row) => `| ${markdownCell(row.key)} | \`${markdownCell(row.artifactPath)}\` | \`${markdownCell(row.sourceArtifact)}\` |`)
    .join('\n');
  const matrixRows = packet.runMatrix
    .map((row) =>
      `| ${markdownCell(row.gateId)} | ${markdownCell(`${row.requirementId}: ${row.requirementLabel}`)} | ${markdownCell(row.readinessStatus)} | ${markdownCell(row.artifactStatus)} | ${markdownCell(row.reviewStatus)} | ${markdownCell(row.ownerAction)} |`
    )
    .join('\n');

  return `# Live Proof Run Packet

Generated: ${packet.generatedAt}

Status: \`${packet.status}\`

Primary source artifact: \`${packet.sourceArtifact}\`

Source artifact count: ${packet.sourceArtifactCount}

Source trace rows: ${packet.sourceTraceCount}

Official reference count: ${packet.officialReferenceCount}

Live proof count: ${packet.liveProofCount}

Owner command sequence count: ${packet.ownerCommandSequenceCount}

Does-not-prove boundary count: ${packet.doesNotProveCount}

## Evidence Boundary

${packet.evidenceBoundary}

## Source Trace

${packet.sourceTraceBoundary}

| Key | Artifact | Source anchor |
| --- | --- | --- |
${sourceTraceRows}

## Current Live Proof Summary

| Gate | Readiness | Owner action | Proof artifact status | Accepted artifact | Command | Artifact |
| --- | --- | --- | --- | --- | --- | --- |
${summaryRows}

## Owner Command Sequence

${commandRows}

## Official Reference Basis

| Reference | URL | Applies to |
| --- | --- | --- |
${referenceRows}

## Run Matrix

Use the CSV companion for owner execution: \`${OUTPUT_CSV}\`.

| Gate | Requirement | Readiness | Artifact | Review status | Owner action |
| --- | --- | --- | --- | --- | --- |
${matrixRows}

## Does Not Prove

${packet.doesNotProve.map((item) => `- ${item}`).join('\n')}
`;
}

function renderCsv(packet) {
  const header = [
    'gate_id',
    'readiness_id',
    'label',
    'requirement_id',
    'requirement_label',
    'command',
    'artifact_path',
    'readiness_status',
    'artifact_status',
    'review_status',
    'owner_action',
    'required_env_summary',
    'preconditions',
    'acceptance_checks',
    'redaction_boundary',
    'does_not_prove',
    'official_reference_ids',
  ];
  const rows = packet.runMatrix.map((row) =>
    [
      row.gateId,
      row.readinessId,
      row.label,
      row.requirementId,
      row.requirementLabel,
      row.command,
      row.artifactPath,
      row.readinessStatus,
      row.artifactStatus,
      row.reviewStatus,
      row.ownerAction,
      row.requiredEnvSummary,
      row.preconditions,
      row.acceptanceChecks,
      row.redactionBoundary,
      row.doesNotProve,
      row.officialReferenceIds,
    ].map(csvCell).join(',')
  );
  return `${header.map(csvCell).join(',')}\n${rows.join('\n')}\n`;
}

async function writePacket(packet) {
  await mkdir('docs/commercialization', { recursive: true });
  await writeFile(OUTPUT_JSON, `${JSON.stringify(packet, null, 2)}\n`);
  await writeFile(OUTPUT_MARKDOWN, renderMarkdown(packet));
  await writeFile(OUTPUT_CSV, renderCsv(packet));
}

const packet = await buildPacket();
if (hasFlag('--write')) await writePacket(packet);

console.log(JSON.stringify({
  ok: true,
  schemaVersion: packet.schemaVersion,
  status: packet.status,
  requiredLiveGateCount: packet.requiredLiveGateCount,
  readyLiveProofCount: packet.readyLiveProofCount,
  acceptedSourceArtifactCount: packet.acceptedSourceArtifactCount,
  matrixRowCount: packet.matrixRowCount,
  liveProofCount: packet.liveProofCount,
  ownerCommandSequenceCount: packet.ownerCommandSequenceCount,
  doesNotProveCount: packet.doesNotProveCount,
  officialReferenceCount: packet.officialReferenceCount,
  sourceArtifact: packet.sourceArtifact,
  sourceArtifactCount: packet.sourceArtifactCount,
  sourceTraceCount: packet.sourceTraceCount,
  outputs: packet.outputArtifacts,
  evidenceBoundary: packet.evidenceBoundary,
}, null, 2));
