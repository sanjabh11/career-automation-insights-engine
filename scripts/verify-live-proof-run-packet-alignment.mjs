#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = process.argv.slice(2);

function readFlagValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const root = path.resolve(readFlagValue('--root', path.resolve(__dirname, '..')));

const PACKET_JSON_PATH = 'docs/commercialization/live-proof-run-packet-latest.json';
const PACKET_MARKDOWN_PATH = 'docs/commercialization/live-proof-run-packet-latest.md';
const PACKET_CSV_PATH = 'docs/commercialization/live-proof-run-matrix-latest.csv';
const OWNER_PREP_PATH = 'scripts/prepare-owner-evidence-workspace.mjs';
const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const COMPOSER_PATH = 'scripts/compose-live-gate-evidence.mjs';
const VERIFIER_PATH = 'scripts/verify-live-gate-evidence.mjs';
const SCHEMA_VERSION = '2026-06-04.apo-live-proof-run-packet.v1';
const SOURCE_TRACE_BOUNDARY =
  'This source trace maps each generated live-proof run packet provenance row to the sourceArtifacts key used by the owner worksheet. It does not execute owner commands, load credentials, print secrets, run Stripe or Supabase live checks, create checkout sessions, query live revenue, prove payment readiness, or upgrade launch readiness.';
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

const REQUIRED_OWNER_COMMAND_SEQUENCE = [
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

const REQUIRED_OFFICIAL_REFERENCES = [
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

const LIVE_PROOF_SPECS = [
  {
    readinessId: 'stripe_test_checkout',
    gateId: 'real_stripe_test_checkout',
    label: 'Real Stripe test-mode checkout',
    command: 'npm run verify:stripe-test-checkout',
    artifactPath: STRIPE_TEST_CHECKOUT_PROOF_PATH,
    evidenceType: 'stripe_test_checkout_session',
    officialReferenceIds: ['stripe-test-mode', 'stripe-api-keys', 'stripe-key-best-practices', 'pci-dss-v4-0-1', 'supabase-edge-function-secrets'],
  },
  {
    readinessId: 'production_calibration',
    gateId: 'production_calibration_run',
    label: 'Production calibration run',
    command: 'npm run verify:production-calibration',
    artifactPath: PRODUCTION_CALIBRATION_PROOF_PATH,
    evidenceType: 'production_calibration_run',
    officialReferenceIds: ['supabase-edge-function-secrets', 'github-actions-secrets'],
  },
  {
    readinessId: 'authenticated_live_artifact_e2e',
    gateId: 'authenticated_live_artifact_e2e',
    label: 'Authenticated live artifact e2e',
    command: 'npm run verify:commercial-live-auth-e2e',
    artifactPath: LIVE_AUTH_E2E_PROOF_PATH,
    evidenceType: 'authenticated_live_e2e',
    officialReferenceIds: ['supabase-edge-function-secrets', 'github-actions-secrets'],
  },
  {
    readinessId: 'live_mrr_gt_zero',
    gateId: 'live_mrr_gt_zero',
    label: 'Live MRR greater than zero',
    command: 'npm run verify:stripe-live-mrr',
    artifactPath: STRIPE_LIVE_MRR_PROOF_PATH,
    evidenceType: 'stripe_live_mrr_export',
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

const REQUIRED_CSV_COLUMNS = [
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

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function readJsonStatus(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return {
      artifactPath: relativePath,
      exists: false,
      validJson: false,
      artifactStatus: null,
      acceptedSourceArtifact: false,
    };
  }

  try {
    const value = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    const summary = {
      artifactPath: relativePath,
      exists: true,
      validJson: true,
      artifactStatus: value.status || null,
      acceptedSourceArtifact: value.status === 'passed',
    };
    if (SOURCE_PROOF_COUNT_PATHS.has(relativePath)) {
      summary.doesNotProve = Array.isArray(value.doesNotProve) ? value.doesNotProve : null;
      summary.doesNotProveCount = Number.isInteger(value.doesNotProveCount) ? value.doesNotProveCount : null;
    }
    return summary;
  } catch {
    return {
      artifactPath: relativePath,
      exists: true,
      validJson: false,
      artifactStatus: null,
      acceptedSourceArtifact: false,
    };
  }
}

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
        continue;
      }
      if (char === '"') {
        inQuotes = false;
        continue;
      }
      field += char;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }
    if (char === '\r') continue;
    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((csvRow) => csvRow.some((cell) => cell.length > 0));
  if (!header) return { header: [], rows: [] };
  return {
    header,
    rows: body.map((csvRow) => {
      const record = {};
      header.forEach((column, index) => {
        record[column] = csvRow[index] || '';
      });
      return record;
    }),
  };
}

function stableJson(value) {
  return JSON.stringify(value);
}

function addError(errors, type, detail = {}) {
  errors.push({ type, ...detail });
}

function requireExact(errors, context, expected, actual) {
  if (stableJson(expected) !== stableJson(actual)) {
    addError(errors, 'field_mismatch', { context, expected, actual });
  }
}

function buildExpectedSourceTrace(sourceArtifacts) {
  return Object.entries(sourceArtifacts).map(([key, artifactPath]) => ({
    key,
    artifactPath,
    sourceArtifact: `${PACKET_JSON_PATH}#sourceArtifacts.${key}`,
  }));
}

function stringList(value) {
  return Array.isArray(value) ? value.join('; ') : '';
}

function proofArtifactsByPath() {
  return new Map(LIVE_PROOF_SPECS.map((spec) => [spec.artifactPath, readJsonStatus(spec.artifactPath)]));
}

function expectedMatrixRows(liveProofs) {
  return liveProofs.flatMap((proof) =>
    REQUIREMENT_TEMPLATES.map((requirement) => ({
      gateId: proof.gateId,
      readinessId: proof.readinessId,
      label: proof.label,
      requirementId: requirement.id,
      requirementLabel: requirement.label,
      command: proof.command,
      artifactPath: proof.artifactPath,
      readinessStatus: proof.readiness?.status || '',
      artifactStatus: proof.proofArtifact?.artifactStatus || 'missing',
      reviewStatus:
        proof.readiness?.ready === true && proof.proofArtifact?.acceptedSourceArtifact === true
          ? 'proof_artifact_ready'
          : 'owner_live_proof_required',
      ownerAction: requirement.ownerAction,
      requiredEnvSummary: stringList(proof.requiredEnvSummary),
      preconditions: stringList(proof.preconditions),
      acceptanceChecks: stringList(proof.acceptanceChecks),
      redactionBoundary: proof.redactionBoundary,
      doesNotProve: stringList(proof.doesNotProve),
      officialReferenceIds: stringList(proof.officialReferenceIds),
    }))
  );
}

function validatePacketShape(errors, packet, sourceArtifactByPath) {
  const liveProofs = Array.isArray(packet.liveProofs) ? packet.liveProofs : [];
  const acceptedSourceArtifactCount = [...sourceArtifactByPath.values()].filter((item) => item.acceptedSourceArtifact).length;
  const readyLiveProofCount = liveProofs.filter((item) => item.readiness?.ready === true).length;
  const expectedStatus =
    acceptedSourceArtifactCount === LIVE_PROOF_SPECS.length ? 'ready_to_compose_live_evidence' : 'owner_live_proof_required';

  requireExact(errors, 'packet.schemaVersion', SCHEMA_VERSION, packet.schemaVersion);
  requireExact(errors, 'packet.status', expectedStatus, packet.status);
  requireExact(errors, 'packet.requiredLiveGateCount', LIVE_PROOF_SPECS.length, packet.requiredLiveGateCount);
  requireExact(errors, 'packet.readyLiveProofCount', readyLiveProofCount, packet.readyLiveProofCount);
  requireExact(errors, 'packet.acceptedSourceArtifactCount', acceptedSourceArtifactCount, packet.acceptedSourceArtifactCount);
  requireExact(errors, 'packet.matrixRowCount', LIVE_PROOF_SPECS.length * REQUIREMENT_TEMPLATES.length, packet.matrixRowCount);
  if (packet.liveProofCount !== liveProofs.length) {
    addError(errors, 'packet_live_proof_count_mismatch', {
      expected: liveProofs.length,
      actual: packet.liveProofCount,
    });
  }
  if (packet.ownerCommandSequenceCount !== REQUIRED_OWNER_COMMAND_SEQUENCE.length) {
    addError(errors, 'packet_owner_command_sequence_count_mismatch', {
      expected: REQUIRED_OWNER_COMMAND_SEQUENCE.length,
      actual: packet.ownerCommandSequenceCount,
    });
  }
  const expectedDoesNotProveCount = Array.isArray(packet.doesNotProve) ? packet.doesNotProve.length : 0;
  if (packet.doesNotProveCount !== expectedDoesNotProveCount) {
    addError(errors, 'packet_does_not_prove_count_mismatch', {
      expected: expectedDoesNotProveCount,
      actual: packet.doesNotProveCount,
    });
  }
  requireExact(errors, 'packet.officialReferences', REQUIRED_OFFICIAL_REFERENCES, packet.officialReferences);
  const expectedOfficialReferenceCount = Array.isArray(packet.officialReferences) ? packet.officialReferences.length : 0;
  if (packet.officialReferenceCount !== expectedOfficialReferenceCount) {
    addError(errors, 'packet_official_reference_count_mismatch', {
      expected: expectedOfficialReferenceCount,
      actual: packet.officialReferenceCount,
    });
  }
  requireExact(
    errors,
    'packet.sourceArtifacts',
    {
      ownerEvidencePrep: OWNER_PREP_PATH,
      closeoutStatus: CLOSEOUT_STATUS_PATH,
      liveGateComposer: COMPOSER_PATH,
      liveGateVerifier: VERIFIER_PATH,
    },
    packet.sourceArtifacts,
  );

  const sourceArtifacts = packet.sourceArtifacts && typeof packet.sourceArtifacts === 'object' ? packet.sourceArtifacts : {};
  const expectedPrimarySourceArtifact = sourceArtifacts.ownerEvidencePrep;
  if (!packet.sourceArtifact) {
    addError(errors, 'packet_primary_source_artifact_missing', {
      expected: expectedPrimarySourceArtifact,
      actual: packet.sourceArtifact || null,
    });
  } else if (packet.sourceArtifact !== expectedPrimarySourceArtifact) {
    addError(errors, 'packet_primary_source_artifact_mismatch', {
      expected: expectedPrimarySourceArtifact,
      actual: packet.sourceArtifact,
    });
  }

  const expectedSourceArtifactCount = Object.keys(sourceArtifacts).length;
  if (packet.sourceArtifactCount !== expectedSourceArtifactCount) {
    addError(errors, 'packet_source_artifact_count_mismatch', {
      expected: expectedSourceArtifactCount,
      actual: packet.sourceArtifactCount,
    });
  }
  const expectedSourceTrace = buildExpectedSourceTrace(sourceArtifacts);
  if (packet.sourceTraceCount !== expectedSourceTrace.length) {
    addError(errors, 'packet_source_trace_count_mismatch', {
      expected: expectedSourceTrace.length,
      actual: packet.sourceTraceCount,
    });
  }
  if (stableJson(packet.sourceTrace || []) !== stableJson(expectedSourceTrace)) {
    addError(errors, 'packet_source_trace_mismatch', {
      expected: expectedSourceTrace,
      actual: packet.sourceTrace || [],
    });
  }
  if (packet.sourceTraceBoundary !== SOURCE_TRACE_BOUNDARY) {
    addError(errors, 'packet_source_trace_boundary_mismatch', {
      expected: SOURCE_TRACE_BOUNDARY,
      actual: packet.sourceTraceBoundary || '',
    });
  }

  requireExact(
    errors,
    'packet.outputArtifacts',
    {
      json: PACKET_JSON_PATH,
      markdown: PACKET_MARKDOWN_PATH,
      csv: PACKET_CSV_PATH,
    },
    packet.outputArtifacts,
  );
  requireExact(errors, 'packet.ownerCommandSequence', REQUIRED_OWNER_COMMAND_SEQUENCE, packet.ownerCommandSequence);

  [
    'owner-run worksheet only',
    'does not execute credentialed checks',
    'does not print secrets',
    'does not make failed or missing proof artifacts count as launch evidence',
    'Raw Stripe API responses',
    'owner-held outside tracked files',
  ].forEach((expectedText) => {
    if (typeof packet.evidenceBoundary !== 'string' || !packet.evidenceBoundary.includes(expectedText)) {
      addError(errors, 'missing_evidence_boundary', { expectedText, actual: packet.evidenceBoundary || '' });
    }
  });

  ['Commercial readiness', 'Partner commitments', 'Manual WCAG conformance', 'Legal compliance', 'PCI DSS compliance'].forEach((expectedText) => {
    if (!Array.isArray(packet.doesNotProve) || !packet.doesNotProve.includes(expectedText)) {
      addError(errors, 'missing_does_not_prove_boundary', { expectedText });
    }
  });
}

function validateLiveProofs(errors, packet, sourceArtifactByPath) {
  const liveProofs = Array.isArray(packet.liveProofs) ? packet.liveProofs : [];
  requireExact(errors, 'packet.liveProofs.length', LIVE_PROOF_SPECS.length, liveProofs.length);

  LIVE_PROOF_SPECS.forEach((spec, index) => {
    const actual = liveProofs[index] || {};
    const expectedCore = {
      readinessId: spec.readinessId,
      gateId: spec.gateId,
      label: spec.label,
      command: spec.command,
      artifactPath: spec.artifactPath,
      evidenceType: spec.evidenceType,
      officialReferenceIds: spec.officialReferenceIds,
    };
    const actualCore = {
      readinessId: actual.readinessId,
      gateId: actual.gateId,
      label: actual.label,
      command: actual.command,
      artifactPath: actual.artifactPath,
      evidenceType: actual.evidenceType,
      officialReferenceIds: actual.officialReferenceIds,
    };
    requireExact(errors, `packet.liveProofs[${index}].core`, expectedCore, actualCore);

    const expectedProofArtifact = sourceArtifactByPath.get(spec.artifactPath);
    if (stableJson(expectedProofArtifact) !== stableJson(actual.proofArtifact)) {
      addError(errors, 'source_artifact_summary_mismatch', {
        gateId: spec.gateId,
        expected: expectedProofArtifact,
        actual: actual.proofArtifact || null,
      });
    }

    if (typeof actual.readiness?.status !== 'string' || actual.readiness.status.length === 0) {
      addError(errors, 'missing_live_proof_readiness_status', { gateId: spec.gateId });
    }
    if (!Array.isArray(actual.requiredEnvSummary) || actual.requiredEnvSummary.length === 0) {
      addError(errors, 'missing_required_env_summary', { gateId: spec.gateId });
    }
    if (!Array.isArray(actual.preconditions) || actual.preconditions.length === 0) {
      addError(errors, 'missing_preconditions', { gateId: spec.gateId });
    }
    if (
      !Array.isArray(actual.acceptanceChecks) ||
      !actual.acceptanceChecks.includes('artifact status=passed') ||
      !actual.acceptanceChecks.some((item) => item.includes('ownerEvidenceArchive'))
    ) {
      addError(errors, 'missing_acceptance_archive_boundary', { gateId: spec.gateId });
    }
    if (typeof actual.redactionBoundary !== 'string' || !actual.redactionBoundary.includes('owner-held')) {
      addError(errors, 'missing_redaction_boundary', { gateId: spec.gateId });
    }
    if (!Array.isArray(actual.doesNotProve) || actual.doesNotProve.length === 0) {
      addError(errors, 'missing_live_proof_claim_boundary', { gateId: spec.gateId });
    }
  });
}

function validateSourceProofArtifactCounts(errors, sourceArtifactByPath) {
  for (const artifactPath of SOURCE_PROOF_COUNT_PATHS) {
    const proofArtifact = sourceArtifactByPath.get(artifactPath);
    if (!proofArtifact || !Array.isArray(proofArtifact.doesNotProve)) continue;

    const expectedDoesNotProveCount = proofArtifact.doesNotProve.length;
    if (proofArtifact.doesNotProveCount !== expectedDoesNotProveCount) {
      addError(errors, 'source_proof_does_not_prove_count_mismatch', {
        artifactPath,
        expected: expectedDoesNotProveCount,
        actual: proofArtifact.doesNotProveCount,
      });
    }
  }
}

function validateRunMatrix(errors, packet) {
  const liveProofs = Array.isArray(packet.liveProofs) ? packet.liveProofs : [];
  const matrix = Array.isArray(packet.runMatrix) ? packet.runMatrix : [];
  const expectedRows = expectedMatrixRows(liveProofs);

  requireExact(errors, 'packet.runMatrix.length', expectedRows.length, matrix.length);
  requireExact(errors, 'packet.matrixRowCount', expectedRows.length, packet.matrixRowCount);

  expectedRows.forEach((expectedRow, index) => {
    const actualRow = matrix[index] || {};
    if (stableJson(expectedRow) !== stableJson(actualRow)) {
      addError(errors, 'run_matrix_row_mismatch', {
        index,
        gateId: expectedRow.gateId,
        requirementId: expectedRow.requirementId,
        expected: expectedRow,
        actual: actualRow,
      });
    }
  });
}

function validateCsv(errors, packet, csvSource) {
  const { header, rows } = parseCsv(csvSource);
  const matrix = Array.isArray(packet.runMatrix) ? packet.runMatrix : [];
  requireExact(errors, 'csv.header', REQUIRED_CSV_COLUMNS, header);
  requireExact(errors, 'csv.rowCount', matrix.length, rows.length);

  matrix.forEach((expectedRow, index) => {
    const expectedCsvRow = {
      gate_id: expectedRow.gateId,
      readiness_id: expectedRow.readinessId,
      label: expectedRow.label,
      requirement_id: expectedRow.requirementId,
      requirement_label: expectedRow.requirementLabel,
      command: expectedRow.command,
      artifact_path: expectedRow.artifactPath,
      readiness_status: expectedRow.readinessStatus,
      artifact_status: expectedRow.artifactStatus,
      review_status: expectedRow.reviewStatus,
      owner_action: expectedRow.ownerAction,
      required_env_summary: expectedRow.requiredEnvSummary,
      preconditions: expectedRow.preconditions,
      acceptance_checks: expectedRow.acceptanceChecks,
      redaction_boundary: expectedRow.redactionBoundary,
      does_not_prove: expectedRow.doesNotProve,
      official_reference_ids: expectedRow.officialReferenceIds,
    };
    const actualRow = rows[index] || {};
    if (stableJson(expectedCsvRow) !== stableJson(actualRow)) {
      addError(errors, 'csv_run_matrix_mismatch', {
        index,
        gateId: expectedRow.gateId,
        requirementId: expectedRow.requirementId,
        expected: expectedCsvRow,
        actual: actualRow,
      });
    }
  });
}

function validateMarkdown(errors, packet, markdownSource) {
  [
    '# Live Proof Run Packet',
    `Status: \`${packet.status}\``,
    '## Evidence Boundary',
    `Primary source artifact: \`${OWNER_PREP_PATH}\``,
    'Source artifact count: 4',
    'Official reference count: 6',
    `Live proof count: ${packet.liveProofCount}`,
    `Owner command sequence count: ${packet.ownerCommandSequenceCount}`,
    `Does-not-prove boundary count: ${packet.doesNotProveCount}`,
    'does not execute credentialed checks',
    'Current Live Proof Summary',
    'Owner Command Sequence',
    'Official Reference Basis',
    PACKET_CSV_PATH,
    'archive-and-redaction: Owner-held archive and redaction policy',
    'ownerEvidenceArchive',
    '## Does Not Prove',
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_text', { expectedText });
    }
  });

  [
    `Primary source artifact: \`${OWNER_PREP_PATH}\``,
    'Source artifact count: 4',
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'packet_primary_source_artifact_markdown_mismatch', { expectedText });
    }
  });
  [
    `Source trace rows: ${packet.sourceTraceCount}`,
    '## Source Trace',
    SOURCE_TRACE_BOUNDARY,
    `${PACKET_JSON_PATH}#sourceArtifacts.ownerEvidencePrep`,
    `${PACKET_JSON_PATH}#sourceArtifacts.liveGateVerifier`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'packet_source_trace_markdown_mismatch', { expectedText });
    }
  });

  [
    'Official reference count: 6',
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'packet_official_reference_count_markdown_mismatch', { expectedText });
    }
  });

  [
    `Live proof count: ${packet.liveProofCount}`,
    `Owner command sequence count: ${packet.ownerCommandSequenceCount}`,
    `Does-not-prove boundary count: ${packet.doesNotProveCount}`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'packet_basis_count_markdown_mismatch', { expectedText });
    }
  });

  REQUIRED_OWNER_COMMAND_SEQUENCE.forEach((command) => {
    if (!markdownSource.includes(`\`${command}\``)) {
      addError(errors, 'markdown_missing_command', { command });
    }
  });

  REQUIRED_OFFICIAL_REFERENCES.forEach((reference) => {
    if (!markdownSource.includes(reference.url)) {
      addError(errors, 'markdown_missing_reference_url', { referenceId: reference.id, url: reference.url });
    }
  });

  (packet.liveProofs || []).forEach((proof) => {
    [
      proof.label,
      proof.readiness?.status,
      proof.proofArtifact?.artifactStatus || 'missing',
      proof.command,
      proof.artifactPath,
    ].forEach((expectedText) => {
      if (!markdownSource.includes(String(expectedText))) {
        addError(errors, 'markdown_missing_live_proof_summary', {
          gateId: proof.gateId,
          expectedText: String(expectedText),
        });
      }
    });
  });
}

function main() {
  const packet = readJson(PACKET_JSON_PATH);
  const csvSource = read(PACKET_CSV_PATH);
  const markdownSource = read(PACKET_MARKDOWN_PATH);
  const sourceArtifactByPath = proofArtifactsByPath();
  const errors = [];

  validatePacketShape(errors, packet, sourceArtifactByPath);
  validateSourceProofArtifactCounts(errors, sourceArtifactByPath);
  validateLiveProofs(errors, packet, sourceArtifactByPath);
  validateRunMatrix(errors, packet);
  validateCsv(errors, packet, csvSource);
  validateMarkdown(errors, packet, markdownSource);

  const parsedCsv = parseCsv(csvSource);
  const sourceArtifacts = [...sourceArtifactByPath.values()];
  const result = {
    ok: errors.length === 0,
    sourcePacket: PACKET_JSON_PATH,
    sourceCsv: PACKET_CSV_PATH,
    sourceMarkdown: PACKET_MARKDOWN_PATH,
    sourceProofArtifacts: LIVE_PROOF_SPECS.map((spec) => spec.artifactPath),
    checkedGateIds: LIVE_PROOF_SPECS.map((spec) => spec.gateId),
    requiredLiveGateCount: LIVE_PROOF_SPECS.length,
    acceptedSourceArtifactCount: sourceArtifacts.filter((item) => item.acceptedSourceArtifact).length,
    sourceTraceCount: packet.sourceTraceCount ?? null,
    matrixRowCount: Array.isArray(packet.runMatrix) ? packet.runMatrix.length : 0,
    csvRowCount: parsedCsv.rows.length,
    evidenceBoundary:
      'This verifier proves the generated live proof run packet, matrix CSV, and owner-facing Markdown align with current redacted proof-artifact statuses only. It does not load env values, print secrets, run Stripe or Supabase live checks, create checkout sessions, query live revenue, prove MRR, prove production calibration, prove authenticated live artifact e2e, complete WCAG review, prove partner commitments, prove documented outcomes, or make failed/missing proof artifacts count as launch evidence.',
    errorCount: errors.length,
    errors,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main();
