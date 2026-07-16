#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-live-proof-run-packet-alignment.mjs');

const PACKET_JSON_PATH = 'docs/commercialization/live-proof-run-packet-latest.json';
const PACKET_MARKDOWN_PATH = 'docs/commercialization/live-proof-run-packet-latest.md';
const PACKET_CSV_PATH = 'docs/commercialization/live-proof-run-matrix-latest.csv';
const STRIPE_TEST_CHECKOUT_PROOF_PATH = 'docs/commercialization/stripe-test-checkout-proof-latest.json';
const PRODUCTION_CALIBRATION_PROOF_PATH = 'docs/commercialization/production-calibration-proof-latest.json';
const LIVE_AUTH_E2E_PROOF_PATH = 'docs/commercialization/live-auth-e2e-proof-latest.json';
const STRIPE_LIVE_MRR_PROOF_PATH = 'docs/commercialization/stripe-live-mrr-proof-latest.json';
const STRIPE_TEST_CHECKOUT_DOES_NOT_PROVE = [
  'Live revenue',
  'MRR',
  'Successful payment method collection',
  'Webhook fulfillment',
  'Report-credit balance mutation',
  'Bootcamp demand',
];
const PRODUCTION_CALIBRATION_DOES_NOT_PROVE = [
  'Scientific validation beyond the measured sample',
  'Future model performance',
  'Employment-decision validity',
  'Successful migration or deployment',
  'Raw label provenance',
];
const LIVE_AUTH_E2E_DOES_NOT_PROVE = [
  'Production PDF/DOCX extraction',
  'Malware scanning',
  'External model-provider log deletion',
  'Browser downloads or exports deletion',
  'Backups deletion',
  'Employment-decision validity',
  'Buyer-specific EEOC/ADA/FCRA review',
];
const STRIPE_LIVE_MRR_DOES_NOT_PROVE = [
  'Retention',
  'Product-market fit',
  'Future revenue',
  'Accounting-recognized revenue',
  'Webhook fulfillment',
  'Commercial outcomes',
];
const SOURCE_PROOF_DOES_NOT_PROVE_BY_PATH = new Map([
  [STRIPE_TEST_CHECKOUT_PROOF_PATH, STRIPE_TEST_CHECKOUT_DOES_NOT_PROVE],
  [PRODUCTION_CALIBRATION_PROOF_PATH, PRODUCTION_CALIBRATION_DOES_NOT_PROVE],
  [LIVE_AUTH_E2E_PROOF_PATH, LIVE_AUTH_E2E_DOES_NOT_PROVE],
  [STRIPE_LIVE_MRR_PROOF_PATH, STRIPE_LIVE_MRR_DOES_NOT_PROVE],
]);
const SOURCE_TRACE_BOUNDARY =
  'This source trace maps each generated live-proof run packet provenance row to the sourceArtifacts key used by the owner worksheet. It does not execute owner commands, load credentials, print secrets, run Stripe or Supabase live checks, create checkout sessions, query live revenue, prove payment readiness, or upgrade launch readiness.';
const OWNER_COMMAND_SEQUENCE = [
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
const OFFICIAL_REFERENCES = [
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
const LIVE_PROOFS = [
  {
    readinessId: 'stripe_test_checkout',
    gateId: 'real_stripe_test_checkout',
    label: 'Real Stripe test-mode checkout',
    command: 'npm run verify:stripe-test-checkout',
    artifactPath: STRIPE_TEST_CHECKOUT_PROOF_PATH,
    evidenceType: 'stripe_test_checkout_session',
    artifactStatus: 'skipped_missing_env',
    readinessStatus: 'owner_action_required',
    officialReferenceIds: ['stripe-test-mode', 'stripe-api-keys', 'stripe-key-best-practices', 'pci-dss-v4-0-1', 'supabase-edge-function-secrets'],
  },
  {
    readinessId: 'production_calibration',
    gateId: 'production_calibration_run',
    label: 'Production calibration run',
    command: 'npm run verify:production-calibration',
    artifactPath: PRODUCTION_CALIBRATION_PROOF_PATH,
    evidenceType: 'production_calibration_run',
    artifactStatus: 'passed',
    readinessStatus: 'env_file_complete_not_loaded',
    officialReferenceIds: ['supabase-edge-function-secrets', 'github-actions-secrets'],
  },
  {
    readinessId: 'authenticated_live_artifact_e2e',
    gateId: 'authenticated_live_artifact_e2e',
    label: 'Authenticated live artifact e2e',
    command: 'npm run verify:commercial-live-auth-e2e',
    artifactPath: LIVE_AUTH_E2E_PROOF_PATH,
    evidenceType: 'authenticated_live_e2e',
    artifactStatus: 'passed',
    readinessStatus: 'env_file_complete_not_loaded',
    officialReferenceIds: ['supabase-edge-function-secrets', 'github-actions-secrets'],
  },
  {
    readinessId: 'live_mrr_gt_zero',
    gateId: 'live_mrr_gt_zero',
    label: 'Live MRR greater than zero',
    command: 'npm run verify:stripe-live-mrr',
    artifactPath: STRIPE_LIVE_MRR_PROOF_PATH,
    evidenceType: 'stripe_live_mrr_export',
    artifactStatus: 'failed',
    readinessStatus: 'env_file_complete_not_loaded',
    officialReferenceIds: ['stripe-api-keys', 'stripe-key-best-practices', 'pci-dss-v4-0-1', 'github-actions-secrets'],
  },
];
const REQUIREMENT_TEMPLATES = [
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
    ownerAction:
      'Compose partial redacted live-gate evidence for accepted proof artifacts, then use complete validation only after all live proof artifacts pass; keep raw proof outside git.',
  },
  {
    id: 'claim-boundary',
    label: 'Claim boundary',
    ownerAction: 'Do not cite this gate beyond the explicit does-not-prove boundary.',
  },
];
const CSV_COLUMNS = [
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

function writeJson(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function liveProofRows() {
  return LIVE_PROOFS.map((proof) => ({
    readinessId: proof.readinessId,
    gateId: proof.gateId,
    label: proof.label,
    command: proof.command,
    artifactPath: proof.artifactPath,
    evidenceType: proof.evidenceType,
    requiredEnvSummary: ['owner-held env value'],
    preconditions: ['owner-controlled external state exists'],
    acceptanceChecks: ['artifact status=passed', 'evidenceSummary.ownerEvidenceArchive has all archive fields=true'],
    redactionBoundary: `${proof.label} raw provider payloads and credentials remain owner-held outside tracked files.`,
    doesNotProve: ['Commercial readiness'],
    officialReferenceIds: proof.officialReferenceIds,
    readiness: {
      ready: false,
      status: proof.readinessStatus,
      ownerAction: 'load env values from .env.local',
    },
    proofArtifact: {
      artifactPath: proof.artifactPath,
      exists: true,
      validJson: true,
      artifactStatus: proof.artifactStatus,
      acceptedSourceArtifact: proof.artifactStatus === 'passed',
      ...(SOURCE_PROOF_DOES_NOT_PROVE_BY_PATH.has(proof.artifactPath)
        ? {
            doesNotProve: SOURCE_PROOF_DOES_NOT_PROVE_BY_PATH.get(proof.artifactPath),
            doesNotProveCount: SOURCE_PROOF_DOES_NOT_PROVE_BY_PATH.get(proof.artifactPath).length,
          }
        : {}),
    },
  }));
}

function runMatrix(rows) {
  return rows.flatMap((row) =>
    REQUIREMENT_TEMPLATES.map((requirement) => ({
      gateId: row.gateId,
      readinessId: row.readinessId,
      label: row.label,
      requirementId: requirement.id,
      requirementLabel: requirement.label,
      command: row.command,
      artifactPath: row.artifactPath,
      readinessStatus: row.readiness.status,
      artifactStatus: row.proofArtifact.artifactStatus || 'missing',
      reviewStatus: 'owner_live_proof_required',
      ownerAction: requirement.ownerAction,
      requiredEnvSummary: row.requiredEnvSummary.join('; '),
      preconditions: row.preconditions.join('; '),
      acceptanceChecks: row.acceptanceChecks.join('; '),
      redactionBoundary: row.redactionBoundary,
      doesNotProve: row.doesNotProve.join('; '),
      officialReferenceIds: row.officialReferenceIds.join('; '),
    }))
  );
}

function buildSourceTrace(sourceArtifacts) {
  return Object.entries(sourceArtifacts).map(([key, artifactPath]) => ({
    key,
    artifactPath,
    sourceArtifact: `${PACKET_JSON_PATH}#sourceArtifacts.${key}`,
  }));
}

function packet() {
  const rows = liveProofRows();
  const matrix = runMatrix(rows);
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
    ownerEvidencePrep: 'scripts/prepare-owner-evidence-workspace.mjs',
    closeoutStatus: 'docs/commercialization/owner-evidence-closeout-status-latest.json',
    liveGateComposer: 'scripts/compose-live-gate-evidence.mjs',
    liveGateVerifier: 'scripts/verify-live-gate-evidence.mjs',
  };
  const sourceTrace = buildSourceTrace(sourceArtifacts);
  return {
    generatedAt: '2026-06-05T00:00:00.000Z',
    schemaVersion: '2026-06-04.apo-live-proof-run-packet.v1',
    status: 'owner_live_proof_required',
    requiredLiveGateCount: 4,
    readyLiveProofCount: 0,
    acceptedSourceArtifactCount: 2,
    matrixRowCount: matrix.length,
    liveProofCount: rows.length,
    ownerCommandSequenceCount: OWNER_COMMAND_SEQUENCE.length,
    doesNotProveCount: doesNotProve.length,
    officialReferences: OFFICIAL_REFERENCES,
    officialReferenceCount: 6,
    sourceArtifacts,
    sourceArtifact: 'scripts/prepare-owner-evidence-workspace.mjs',
    sourceArtifactCount: 4,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_TRACE_BOUNDARY,
    outputArtifacts: {
      json: PACKET_JSON_PATH,
      markdown: PACKET_MARKDOWN_PATH,
      csv: PACKET_CSV_PATH,
    },
    evidenceBoundary:
      'This packet is an owner-run worksheet only. It does not execute credentialed checks, does not print secrets, and does not make failed or missing proof artifacts count as launch evidence. Raw Stripe API responses, subscription and invoice exports, dashboard screenshots, Supabase credentials, customer identities, synthetic-user credentials, auth tokens, service-role data, logs, and raw proof payloads must remain owner-held outside tracked files.',
    liveProofs: rows,
    runMatrix: matrix,
    ownerCommandSequence: [...OWNER_COMMAND_SEQUENCE],
    doesNotProve,
  };
}

function renderCsv(value) {
  const rows = value.runMatrix.map((row) =>
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
    ].map(csvCell).join(','),
  );
  return `${CSV_COLUMNS.map(csvCell).join(',')}\n${rows.join('\n')}\n`;
}

function renderMarkdown(value) {
  const summaryRows = value.liveProofs
    .map(
      (proof) =>
        `| ${proof.label} | ${proof.readiness.status} | ${proof.readiness.ownerAction} | ${proof.proofArtifact.artifactStatus} | ${proof.proofArtifact.acceptedSourceArtifact} | \`${proof.command}\` | \`${proof.artifactPath}\` |`,
    )
    .join('\n');
  const commandRows = value.ownerCommandSequence.map((command) => `- \`${command}\``).join('\n');
  const referenceRows = value.officialReferences
    .map((reference) => `| ${reference.label} | ${reference.url} | ${reference.appliesTo.join('; ')} |`)
    .join('\n');
  const sourceTraceRows = value.sourceTrace
    .map((row) => `| ${row.key} | \`${row.artifactPath}\` | \`${row.sourceArtifact}\` |`)
    .join('\n');
  const matrixRows = value.runMatrix
    .map(
      (row) =>
        `| ${row.gateId} | ${row.requirementId}: ${row.requirementLabel} | ${row.readinessStatus} | ${row.artifactStatus} | ${row.reviewStatus} | ${row.ownerAction} |`,
    )
    .join('\n');

  return `# Live Proof Run Packet

Status: \`${value.status}\`

Primary source artifact: \`${value.sourceArtifact}\`

Source artifact count: ${value.sourceArtifactCount}

Source trace rows: ${value.sourceTraceCount}

Official reference count: ${value.officialReferenceCount}

Live proof count: ${value.liveProofCount}

Owner command sequence count: ${value.ownerCommandSequenceCount}

Does-not-prove boundary count: ${value.doesNotProveCount}

## Evidence Boundary

${value.evidenceBoundary}

## Source Trace

${value.sourceTraceBoundary}

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

Use the CSV companion for owner execution: \`${PACKET_CSV_PATH}\`.

| Gate | Requirement | Readiness | Artifact | Review status | Owner action |
| --- | --- | --- | --- | --- | --- |
${matrixRows}

## Does Not Prove

${value.doesNotProve.map((item) => `- ${item}`).join('\n')}
`;
}

function writeBaseArtifacts(root) {
  const value = packet();
  for (const proof of value.liveProofs) {
    const doesNotProve = SOURCE_PROOF_DOES_NOT_PROVE_BY_PATH.get(proof.artifactPath);
    const artifact = doesNotProve
      ? {
          status: proof.proofArtifact.artifactStatus,
          doesNotProve,
          doesNotProveCount: doesNotProve.length,
        }
      : { status: proof.proofArtifact.artifactStatus };
    writeJson(root, proof.artifactPath, artifact);
  }
  writeJson(root, PACKET_JSON_PATH, value);
  fs.mkdirSync(path.dirname(path.join(root, PACKET_CSV_PATH)), { recursive: true });
  fs.writeFileSync(path.join(root, PACKET_CSV_PATH), renderCsv(value));
  fs.writeFileSync(path.join(root, PACKET_MARKDOWN_PATH), renderMarkdown(value));
}

function updateJson(root, relativePath, updater) {
  const absolutePath = path.join(root, relativePath);
  const value = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  updater(value);
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function updateText(root, relativePath, updater) {
  const absolutePath = path.join(root, relativePath);
  fs.writeFileSync(absolutePath, updater(fs.readFileSync(absolutePath, 'utf8')));
}

function runVerifier(root) {
  return spawnSync(process.execPath, [VERIFIER_SCRIPT, '--root', root], {
    cwd: path.dirname(root),
    encoding: 'utf8',
  });
}

function assertCase(name, mutate, expectedCode, expectedText) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-live-proof-run-packet-${name}-`));
  try {
    writeBaseArtifacts(root);
    mutate(root);
    const result = runVerifier(root);
    const output = `${result.stdout || ''}\n${result.stderr || ''}`;
    if (result.status !== expectedCode) {
      throw new Error(`${name} expected exit ${expectedCode}, got ${result.status}\n${output}`);
    }
    if (!output.includes(expectedText)) {
      throw new Error(`${name} expected output containing ${JSON.stringify(expectedText)}\n${output}`);
    }
    console.log(`ok ${name}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const cases = [
  {
    name: 'aligned-live-proof-run-packet-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
  },
  {
    name: 'source-artifact-status-drift-fails',
    expectedCode: 1,
    expectedText: 'source_artifact_summary_mismatch',
    mutate(root) {
      updateJson(root, 'docs/commercialization/stripe-live-mrr-proof-latest.json', (value) => {
        value.status = 'passed';
      });
    },
  },
  {
    name: 'stripe-test-proof-does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'source_proof_does_not_prove_count_mismatch',
    mutate(root) {
      updateJson(root, STRIPE_TEST_CHECKOUT_PROOF_PATH, (value) => {
        value.doesNotProveCount += 1;
      });
    },
  },
  {
    name: 'production-calibration-proof-does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'source_proof_does_not_prove_count_mismatch',
    mutate(root) {
      updateJson(root, PRODUCTION_CALIBRATION_PROOF_PATH, (value) => {
        value.doesNotProveCount += 1;
      });
    },
  },
  {
    name: 'live-auth-proof-does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'source_proof_does_not_prove_count_mismatch',
    mutate(root) {
      updateJson(root, LIVE_AUTH_E2E_PROOF_PATH, (value) => {
        value.doesNotProveCount += 1;
      });
    },
  },
  {
    name: 'stripe-live-mrr-proof-does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'source_proof_does_not_prove_count_mismatch',
    mutate(root) {
      updateJson(root, STRIPE_LIVE_MRR_PROOF_PATH, (value) => {
        value.doesNotProveCount += 1;
      });
    },
  },
  {
    name: 'live-proof-command-drift-fails',
    expectedCode: 1,
    expectedText: 'packet.liveProofs[0].core',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.liveProofs[0].command = 'npm run verify:stripe-test-checkout --wrong';
      });
    },
  },
  {
    name: 'matrix-row-count-mismatch-fails',
    expectedCode: 1,
    expectedText: 'packet.runMatrix.length',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.runMatrix.pop();
      });
    },
  },
  {
    name: 'csv-matrix-drift-fails',
    expectedCode: 1,
    expectedText: 'csv_run_matrix_mismatch',
    mutate(root) {
      updateText(root, PACKET_CSV_PATH, (source) => source.replace('skipped_missing_env', 'passed'));
    },
  },
  {
    name: 'markdown-boundary-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_text',
    mutate(root) {
      updateText(root, PACKET_MARKDOWN_PATH, (source) =>
        source.replace('does not execute credentialed checks', 'runs credentialed checks'),
      );
    },
  },
  {
    name: 'owner-command-sequence-drift-fails',
    expectedCode: 1,
    expectedText: 'packet.ownerCommandSequence',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.ownerCommandSequence[2] = 'source .env.local';
      });
    },
  },
  {
    name: 'live-proof-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_live_proof_count_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.liveProofCount += 1;
      });
    },
  },
  {
    name: 'owner-command-sequence-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_owner_command_sequence_count_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.ownerCommandSequenceCount += 1;
      });
    },
  },
  {
    name: 'does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_does_not_prove_count_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.doesNotProveCount += 1;
      });
    },
  },
  {
    name: 'packet-basis-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_basis_count_markdown_mismatch',
    mutate(root) {
      updateText(root, PACKET_MARKDOWN_PATH, (source) => source.replace('Owner command sequence count: 9', 'Owner command sequence count: 8'));
    },
  },
  {
    name: 'packet-primary-source-artifact-missing-fails',
    expectedCode: 1,
    expectedText: 'packet_primary_source_artifact_missing',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        delete value.sourceArtifact;
      });
    },
  },
  {
    name: 'packet-primary-source-artifact-stale-fails',
    expectedCode: 1,
    expectedText: 'packet_primary_source_artifact_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.sourceArtifact = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
      });
    },
  },
  {
    name: 'packet-source-artifact-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_source_artifact_count_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.sourceArtifactCount += 1;
      });
    },
  },
  {
    name: 'packet-source-trace-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_source_trace_count_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.sourceTraceCount += 1;
      });
    },
  },
  {
    name: 'packet-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'packet_source_trace_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.sourceTrace[0].sourceArtifact = `${PACKET_JSON_PATH}#sourceArtifacts.closeoutStatus`;
      });
    },
  },
  {
    name: 'packet-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_source_trace_markdown_mismatch',
    mutate(root) {
      updateText(root, PACKET_MARKDOWN_PATH, (source) =>
        source.replace(`${PACKET_JSON_PATH}#sourceArtifacts.liveGateVerifier`, `${PACKET_JSON_PATH}#sourceArtifacts.liveGateComposer`),
      );
    },
  },
  {
    name: 'packet-primary-source-artifact-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_primary_source_artifact_markdown_mismatch',
    mutate(root) {
      updateText(root, PACKET_MARKDOWN_PATH, (source) =>
        source.replace(
          'Primary source artifact: `scripts/prepare-owner-evidence-workspace.mjs`',
          'Primary source artifact: `docs/commercialization/owner-evidence-closeout-status-latest.json`',
        ),
      );
    },
  },
  {
    name: 'packet-official-reference-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_official_reference_count_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.officialReferenceCount += 1;
      });
    },
  },
  {
    name: 'packet-official-reference-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_official_reference_count_markdown_mismatch',
    mutate(root) {
      updateText(root, PACKET_MARKDOWN_PATH, (source) => source.replace('Official reference count: 6', 'Official reference count: 4'));
    },
  },
  {
    name: 'accepted-count-status-drift-fails',
    expectedCode: 1,
    expectedText: 'packet.acceptedSourceArtifactCount',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.acceptedSourceArtifactCount = 4;
        value.status = 'ready_to_compose_live_evidence';
      });
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText);
}

console.log(`Live proof run packet alignment fixture verification passed: ${cases.length} cases.`);
