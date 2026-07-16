#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-owner-evidence-completion-drill-alignment.mjs');

const DRILL_JSON_PATH = 'docs/commercialization/owner-evidence-completion-drill-latest.json';
const DRILL_MARKDOWN_PATH = 'docs/commercialization/owner-evidence-completion-drill-latest.md';
const DRILL_CSV_PATH = 'docs/commercialization/owner-evidence-completion-matrix-latest.csv';
const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const HANDOFF_JSON_PATH = 'docs/commercialization/owner-evidence-handoff-latest.json';
const OWNER_EVIDENCE_LOCAL_SAFETY_PATH = 'docs/commercialization/owner-evidence-local-safety-latest.json';
const OWNER_EVIDENCE_LOCAL_SAFETY_SOURCE_TRACE_BOUNDARY =
  'This local-safety source trace identifies owner-evidence-local-safety artifact anchors for git ignore, tracking, staging, error, and boundary counts. It does not read owner-held evidence file contents, load secrets, run live checks, or upgrade launch readiness.';
const COMPLETION_DRILL_SOURCE_TRACE_BOUNDARY =
  'This completion-drill source trace maps each owner-evidence completion drill provenance row to the sourceArtifacts key used by the generated drill packet. It does not execute owner commands, load credentials, collect owner-held evidence, read local evidence values, run live checks, or upgrade launch readiness.';
const MODEL_PATH = 'src/lib/commercialLaunchReadiness.ts';
const EXPECTED_SCHEMA_VERSION = '2026-06-04.apo-owner-evidence-completion-drill.v1';
const EXPECTED_FILENAME = 'owner-evidence-completion-matrix-latest.csv';
const LIVE_CLOSEOUT_TARGET_PROJECT_REF = 'kvunnankqgfokeufvsrv';
const REQUIRED_OPERATIONAL_ACCESS_COMMANDS = [
  'gh secret list --repo sanjabh11/career-automation-insights-engine',
  'supabase login',
  'supabase projects list --output json',
  `supabase functions list --project-ref ${LIVE_CLOSEOUT_TARGET_PROJECT_REF}`,
  'npm run generate:live-closeout-readiness',
  'npm run verify:live-closeout-readiness',
];
const PACKET_PATH_BY_TYPE = {
  live_proof_run: 'docs/commercialization/live-proof-run-packet-latest.json',
  commercial_evidence_intake: 'docs/commercialization/commercial-evidence-intake-packet-latest.json',
  manual_wcag_review: 'docs/commercialization/manual-wcag-review-packet-latest.json',
};

const CSV_COLUMNS = [
  'order',
  'gate_id',
  'track',
  'completion_state',
  'packet_type',
  'packet_status',
  'packet_markdown',
  'packet_csv',
  'packet_generator_command',
  'expected_proof_artifact',
  'accepted_when',
  'acceptance_verifier_command',
  'owner_prep_command',
  'blocking_owner_actions',
  'raw_evidence_policy',
  'repo_does_not_do',
  'does_not_prove',
];

function baseRows() {
  return [
    {
      order: 1,
      gateId: 'manual_wcag_evidence',
      label: 'Manual WCAG evidence',
      track: 'accessibility',
      completionState: 'blocked_owner_evidence_required',
      packetType: 'manual_wcag_review',
      packetStatus: 'owner_manual_review_required',
      packetMarkdown: 'docs/commercialization/manual-wcag-review-packet-latest.md',
      packetCsv: 'docs/commercialization/manual-wcag-review-matrix-latest.csv',
      packetGeneratorCommand: 'npm run generate:manual-wcag-review-packet',
      expectedProofArtifact: 'docs/commercialization/manual-wcag-evidence.local.json',
      acceptedWhen: 'manual evidence validates with --require-complete',
      acceptanceVerifierCommand:
        'npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete',
      ownerPrepCommand:
        'npm run generate:manual-wcag-review-packet && npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>',
      ownerAction: 'Complete owner-held manual WCAG evidence.',
      blockingOwnerActionCount: 1,
      blockingOwnerActions: ['Complete manual WCAG review'],
      sourceBoundary: 'owner manual WCAG metadata',
      riskIfSkipped: 'No manual accessibility claim.',
      rawEvidencePolicy: 'Raw reviewer notes stay outside git.',
      repoDoesNotDo: 'Does not prove WCAG conformance',
      doesNotProve: ['WCAG conformance', 'procurement approval'],
    },
    {
      order: 2,
      gateId: 'three_committed_partners',
      label: 'Three committed partners',
      track: 'commercial-validation',
      completionState: 'blocked_owner_evidence_required',
      packetType: 'commercial_evidence_intake',
      packetStatus: 'owner_commercial_evidence_required',
      packetMarkdown: 'docs/commercialization/commercial-evidence-intake-packet-latest.md',
      packetCsv: 'docs/commercialization/commercial-evidence-intake-matrix-latest.csv',
      packetGeneratorCommand: 'npm run generate:commercial-evidence-intake-packet',
      expectedProofArtifact: 'docs/commercialization/commercial-evidence-intake.local.json',
      acceptedWhen: 'three partner records validate with --require-all',
      acceptanceVerifierCommand:
        'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
      ownerPrepCommand:
        'npm run generate:commercial-evidence-intake-packet && npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>',
      ownerAction: 'Attach three permissioned partner commitments.',
      blockingOwnerActionCount: 1,
      blockingOwnerActions: ['Attach partner evidence'],
      sourceBoundary: 'owner commercial evidence records',
      riskIfSkipped: 'Partner claims stay blocked.',
      rawEvidencePolicy: 'Raw partner details stay outside git.',
      repoDoesNotDo: 'Does not prove revenue',
      doesNotProve: ['revenue', 'generalizable demand'],
    },
  ];
}

function baseSummary(rows = baseRows()) {
  return {
    status: 'owner_evidence_required',
    goalComplete: false,
    requiredGateCount: rows.length,
    blockedGateCount: rows.length,
    ownerActionNeededCount: rows.length,
    matrixRowCount: rows.length,
  };
}

function baseOwnerPrepActionNeededByGate(rows = baseRows()) {
  return Object.fromEntries(
    rows.map((row) => [
      row.gateId,
      {
        gateId: row.gateId,
        ownerActionNeededCount: row.blockingOwnerActions.length,
        ownerActionNeeded: row.blockingOwnerActions,
        sourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate.${row.gateId}`,
      },
    ])
  );
}

function basePacketArtifacts() {
  return {
    live_proof_run: {
      status: 'owner_live_proof_required',
      officialReferences: [
        {
          id: 'stripe-test-mode',
          label: 'Stripe testing environments and test mode',
          url: 'https://docs.stripe.com/test-mode',
        },
        {
          id: 'stripe-key-best-practices',
          label: 'Stripe secret key best practices',
          url: 'https://docs.stripe.com/keys-best-practices',
        },
      ],
    },
    commercial_evidence_intake: {
      status: 'owner_commercial_evidence_required',
      officialReferences: [
        {
          id: 'ftc-consumer-reviews-rule-questions',
          label: 'FTC Consumer Reviews and Testimonials Rule questions',
          url: 'https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers',
        },
      ],
    },
    manual_wcag_review: {
      status: 'owner_manual_review_required',
      officialReferences: [
        {
          id: 'wcag22',
          label: 'WCAG 2.2 Recommendation',
          url: 'https://www.w3.org/TR/WCAG22/',
        },
      ],
    },
  };
}

function basePacketSummaries(packetArtifacts = basePacketArtifacts()) {
  const packetMetadata = {
    live_proof_run: {
      label: 'Live proof run packet',
      markdown: 'docs/commercialization/live-proof-run-packet-latest.md',
      csv: 'docs/commercialization/live-proof-run-matrix-latest.csv',
      generatorCommand: 'npm run generate:live-proof-run-packet',
    },
    commercial_evidence_intake: {
      label: 'Commercial evidence intake packet',
      markdown: 'docs/commercialization/commercial-evidence-intake-packet-latest.md',
      csv: 'docs/commercialization/commercial-evidence-intake-matrix-latest.csv',
      generatorCommand: 'npm run generate:commercial-evidence-intake-packet',
    },
    manual_wcag_review: {
      label: 'Manual WCAG review packet',
      markdown: 'docs/commercialization/manual-wcag-review-packet-latest.md',
      csv: 'docs/commercialization/manual-wcag-review-matrix-latest.csv',
      generatorCommand: 'npm run generate:manual-wcag-review-packet',
    },
  };

  return Object.entries(packetArtifacts).map(([packetType, artifact]) => {
    const officialReferences = artifact.officialReferences || [];
    return {
      packetType,
      label: packetMetadata[packetType].label,
      status: artifact.status,
      json: PACKET_PATH_BY_TYPE[packetType],
      markdown: packetMetadata[packetType].markdown,
      csv: packetMetadata[packetType].csv,
      generatorCommand: packetMetadata[packetType].generatorCommand,
      officialReferenceCount: officialReferences.length,
      officialReferenceIds: officialReferences.map((reference) => reference.id),
      officialReferenceUrls: officialReferences.map((reference) => reference.url),
      boundary: 'Fixture packet boundary.',
    };
  });
}

function baseLocalSafetyArtifact() {
  return {
    schemaVersion: '2026-06-05.apo-owner-evidence-local-safety.v1',
    ok: true,
    protectedPathCount: 10,
    ignoredProtectedPathCount: 10,
    trackedSensitiveFileViolations: [],
    stagedSensitivePathViolations: [],
    errorCount: 0,
    errors: [],
    evidenceBoundary:
      'Fixture local-safety boundary; does not prove local evidence completeness, live revenue, partner commitments, outcomes, or WCAG conformance.',
    doesNotProve: [
      'absence of secrets in git history',
      'validity or completeness of local owner evidence files',
      'commercial-ready status',
    ],
  };
}

function baseLocalSafetySourceTrace(artifact = baseLocalSafetyArtifact()) {
  return [
    {
      key: 'status',
      value: artifact.ok === true ? 'passed' : 'failed',
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#ok`,
    },
    {
      key: 'protectedPathCount',
      value: String(artifact.protectedPathCount ?? 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#protectedPathCount`,
    },
    {
      key: 'ignoredProtectedPathCount',
      value: String(artifact.ignoredProtectedPathCount ?? 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#ignoredProtectedPathCount`,
    },
    {
      key: 'trackedSensitiveFileViolationCount',
      value: String(artifact.trackedSensitiveFileViolations?.length || 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#trackedSensitiveFileViolations`,
    },
    {
      key: 'stagedSensitivePathViolationCount',
      value: String(artifact.stagedSensitivePathViolations?.length || 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#stagedSensitivePathViolations`,
    },
    {
      key: 'errorCount',
      value: String(artifact.errorCount ?? artifact.errors?.length ?? 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#errorCount`,
    },
    {
      key: 'doesNotProveCount',
      value: String(artifact.doesNotProveCount ?? artifact.doesNotProve?.length ?? 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#doesNotProveCount`,
    },
    {
      key: 'evidenceBoundary',
      value: artifact.evidenceBoundary || '',
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#evidenceBoundary`,
    },
  ];
}

function baseLocalSafetyStatus(artifact = baseLocalSafetyArtifact()) {
  const sourceTrace = baseLocalSafetySourceTrace(artifact);
  return {
    sourceArtifact: OWNER_EVIDENCE_LOCAL_SAFETY_PATH,
    status: artifact.ok === true ? 'passed' : 'failed',
    ok: artifact.ok === true,
    protectedPathCount: artifact.protectedPathCount ?? 0,
    ignoredProtectedPathCount: artifact.ignoredProtectedPathCount ?? 0,
    trackedSensitiveFileViolationCount: artifact.trackedSensitiveFileViolations?.length || 0,
    stagedSensitivePathViolationCount: artifact.stagedSensitivePathViolations?.length || 0,
    errorCount: artifact.errorCount ?? artifact.errors?.length ?? 0,
    evidenceBoundary: artifact.evidenceBoundary || '',
    doesNotProve: artifact.doesNotProve || [],
    doesNotProveCount: artifact.doesNotProveCount ?? artifact.doesNotProve?.length ?? 0,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: OWNER_EVIDENCE_LOCAL_SAFETY_SOURCE_TRACE_BOUNDARY,
  };
}

function baseDrillBasis(ownerPrepByGate = baseOwnerPrepActionNeededByGate(baseRows())) {
  const recommendedCommandOrder = [
    'npm run generate:owner-evidence-completion-drill',
    'npm run verify:owner-evidence-completion-drill-alignment',
  ];
  const recommendedOperationalAccessCommands = [
    ...REQUIRED_OPERATIONAL_ACCESS_COMMANDS,
  ];
  const doesNotProve = [
    'Commercial-ready launch status',
    'Owner-held evidence completeness',
    'Procurement approval',
  ];
  return {
    recommendedCommandOrder,
    recommendedCommandOrderCount: recommendedCommandOrder.length,
    recommendedOperationalAccessCommands,
    recommendedOperationalAccessCommandCount: recommendedOperationalAccessCommands.length,
    doesNotProve,
    doesNotProveCount: doesNotProve.length,
    ownerPrepActionNeededByGateCount: Object.keys(ownerPrepByGate).length,
  };
}

function baseSourceArtifacts() {
  return {
    closeoutStatus: CLOSEOUT_STATUS_PATH,
    handoff: HANDOFF_JSON_PATH,
    ownerEvidenceLocalSafety: OWNER_EVIDENCE_LOCAL_SAFETY_PATH,
  };
}

function sourceTrace(sourceArtifacts = baseSourceArtifacts()) {
  return Object.entries(sourceArtifacts).map(([key, artifactPath]) => ({
    key,
    artifactPath,
    sourceArtifact: `${DRILL_JSON_PATH}#sourceArtifacts.${key}`,
  }));
}

function officialReferenceUrls(packetSummaries = basePacketSummaries()) {
  return [...new Set(packetSummaries.flatMap((packet) => packet.officialReferenceUrls || []))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function writeFile(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, value);
}

function writeJson(root, relativePath, value) {
  writeFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function csvEscape(value) {
  if (Array.isArray(value)) return csvEscape(value.join('; '));
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function csvValue(row, column) {
  const values = {
    order: row.order,
    gate_id: row.gateId,
    track: row.track,
    completion_state: row.completionState,
    packet_type: row.packetType,
    packet_status: row.packetStatus,
    packet_markdown: row.packetMarkdown,
    packet_csv: row.packetCsv,
    packet_generator_command: row.packetGeneratorCommand,
    expected_proof_artifact: row.expectedProofArtifact,
    accepted_when: row.acceptedWhen,
    acceptance_verifier_command: row.acceptanceVerifierCommand,
    owner_prep_command: row.ownerPrepCommand,
    blocking_owner_actions: row.blockingOwnerActions,
    raw_evidence_policy: row.rawEvidencePolicy,
    repo_does_not_do: row.repoDoesNotDo,
    does_not_prove: row.doesNotProve,
  };
  return values[column];
}

function buildCsv(rows) {
  const header = CSV_COLUMNS.map(csvEscape).join(',');
  const body = rows.map((row) => CSV_COLUMNS.map((column) => csvEscape(csvValue(row, column))).join(','));
  return [header, ...body].join('\n');
}

function writeGeneratedCsv(root, rows) {
  writeFile(root, DRILL_CSV_PATH, `${buildCsv(rows)}\n`);
}

function markdownCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

function buildDrillMarkdown(
  localSafetyStatus = baseLocalSafetyStatus(),
  drillBasis = baseDrillBasis(),
  sourceArtifacts = baseSourceArtifacts(),
) {
  const packetSourceTrace = sourceTrace(sourceArtifacts);
  const packetSourceTraceRows = packetSourceTrace
    .map((row) => `| ${markdownCell(row.key)} | \`${markdownCell(row.artifactPath)}\` | \`${markdownCell(row.sourceArtifact)}\` |`)
    .join('\n');
  const localSafetySourceTraceRows = localSafetyStatus.sourceTrace
    .map((row) => `| ${markdownCell(row.key)} | ${markdownCell(row.value)} | ${markdownCell(row.sourceArtifact)} |`)
    .join('\n');
  const operationalCommandRows = drillBasis.recommendedOperationalAccessCommands
    .map((command) => `- \`${markdownCell(command)}\``)
    .join('\n');
  return `# Owner Evidence Completion Drill

Primary source artifact: \`${HANDOFF_JSON_PATH}\`

Source artifact count: ${Object.keys(sourceArtifacts).length}

Source trace rows: ${packetSourceTrace.length}

## Source Trace

Trace boundary: ${COMPLETION_DRILL_SOURCE_TRACE_BOUNDARY}

| Key | Artifact | Source anchor |
| --- | --- | --- |
${packetSourceTraceRows}

## Local Evidence Safety Preflight

Source artifact: \`${localSafetyStatus.sourceArtifact}\`

Status: \`${localSafetyStatus.status}\`

Protected paths ignored: ${localSafetyStatus.ignoredProtectedPathCount}/${localSafetyStatus.protectedPathCount}

Tracked sensitive file violations: ${localSafetyStatus.trackedSensitiveFileViolationCount}

Staged sensitive path violations: ${localSafetyStatus.stagedSensitivePathViolationCount}

Does-not-prove boundaries: ${localSafetyStatus.doesNotProveCount}

Boundary: ${localSafetyStatus.evidenceBoundary}

Source trace rows: ${localSafetyStatus.sourceTraceCount}

### Local Evidence Safety Source Trace

Trace boundary: ${localSafetyStatus.sourceTraceBoundary}

| Key | Value | Source artifact |
| --- | --- | --- |
${localSafetySourceTraceRows}

## Counts

| Item | Count |
| --- | ---: |
| Owner prep by-gate maps | ${drillBasis.ownerPrepActionNeededByGateCount} |
| Recommended commands | ${drillBasis.recommendedCommandOrderCount} |
| Recommended operational access commands | ${drillBasis.recommendedOperationalAccessCommandCount} |
| Does-not-prove boundaries | ${drillBasis.doesNotProveCount} |

## Recommended Operational Access Commands

These commands are owner-run access probes and local status refreshes. They must not be treated as deploy, ingest, payment, or launch proof.

${operationalCommandRows}
`;
}

function writeModel(
  root,
  {
    summary = baseSummary(),
    items = baseRows(),
    filename = EXPECTED_FILENAME,
    csvRows = items,
    localSafetyStatus = baseLocalSafetyStatus(),
  } = {},
) {
  const summaryText = JSON.stringify(summary, null, 2).replace(/\n/g, '\n  ');
  const localSafetyText = JSON.stringify(localSafetyStatus, null, 2).replace(/\n/g, '\n  ');
  const itemText = items.map((item) => `  ${JSON.stringify(item, null, 2).replace(/\n/g, '\n  ')}`).join(',\n');
  const csvText = buildCsv(csvRows);
  writeFile(
    root,
    MODEL_PATH,
    `export const OWNER_EVIDENCE_COMPLETION_DRILL_FILENAME = ${JSON.stringify(filename)};\n\nexport const ownerEvidenceCompletionDrillSummary = ${summaryText};\n\nexport const ownerEvidenceLocalSafetySummary = ${localSafetyText};\n\nexport const ownerEvidenceCompletionDrillItems = [\n${itemText}\n];\n\nexport function buildOwnerEvidenceCompletionDrillCsv() {\n  return ${JSON.stringify(csvText)};\n}\n`,
  );
}

function writeBaseArtifacts(root) {
  const rows = baseRows();
  const packetArtifacts = basePacketArtifacts();
  const packetSummaries = basePacketSummaries(packetArtifacts);
  const urls = officialReferenceUrls(packetSummaries);
  const ownerPrepByGate = baseOwnerPrepActionNeededByGate(rows);
  const drillBasis = baseDrillBasis(ownerPrepByGate);
  const sourceArtifacts = baseSourceArtifacts();
  const packetSourceTrace = sourceTrace(sourceArtifacts);
  Object.entries(packetArtifacts).forEach(([packetType, artifact]) => {
    writeJson(root, PACKET_PATH_BY_TYPE[packetType], artifact);
  });
  writeJson(root, OWNER_EVIDENCE_LOCAL_SAFETY_PATH, baseLocalSafetyArtifact());
  writeJson(root, CLOSEOUT_STATUS_PATH, {
    schemaVersion: '2026-06-04.apo-owner-evidence-closeout-status.v1',
    ok: false,
    goalComplete: false,
    ownerEvidencePrep: {
      readyForCloseout: false,
      ownerActionNeededCount: rows.reduce((count, row) => count + row.blockingOwnerActions.length, 0),
      ownerActionNeeded: rows.flatMap((row) => row.blockingOwnerActions),
      ownerActionNeededByGate: Object.fromEntries(rows.map((row) => [row.gateId, row.blockingOwnerActions])),
    },
  });
  writeJson(root, HANDOFF_JSON_PATH, {
    schemaVersion: '2026-06-04.apo-owner-evidence-handoff.v1',
    remainingGateIds: rows.map((row) => row.gateId),
    ownerPrepActionNeededByGateSourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate`,
    ownerPrepActionNeededByGateBoundary:
      'Fixture handoff per-gate owner prep summary; does not prove owner-held evidence or commercial readiness.',
    ownerPrepActionNeededByGate: ownerPrepByGate,
    ownerPrepActionNeededByGateCount: Object.keys(ownerPrepByGate).length,
  });
  writeJson(root, DRILL_JSON_PATH, {
    schemaVersion: EXPECTED_SCHEMA_VERSION,
    ...baseSummary(rows),
    ...drillBasis,
    officialReferenceCount: urls.length,
    officialReferenceUrls: urls,
    requiredGateIds: rows.map((row) => row.gateId),
    ownerPrepActionNeededByGateSourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate`,
    ownerPrepActionNeededByGateBoundary:
      'Fixture drill per-gate owner prep summary; does not prove owner-held evidence or commercial readiness.',
    ownerPrepActionNeededByGate: ownerPrepByGate,
    outputArtifacts: {
      csv: `docs/commercialization/${EXPECTED_FILENAME}`,
    },
    sourceArtifact: HANDOFF_JSON_PATH,
    sourceArtifacts,
    sourceArtifactCount: Object.keys(sourceArtifacts).length,
    sourceTraceCount: packetSourceTrace.length,
    sourceTrace: packetSourceTrace,
    sourceTraceBoundary: COMPLETION_DRILL_SOURCE_TRACE_BOUNDARY,
    localSafetyStatus: baseLocalSafetyStatus(),
    packetSummaries,
    completionRows: rows,
  });
  writeFile(root, DRILL_MARKDOWN_PATH, buildDrillMarkdown(baseLocalSafetyStatus(), drillBasis, sourceArtifacts));
  writeGeneratedCsv(root, rows);
  writeModel(root, { summary: baseSummary(rows), items: rows, csvRows: rows });
}

function updateJson(root, relativePath, updater) {
  const absolutePath = path.join(root, relativePath);
  const value = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  updater(value);
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function runVerifier(root) {
  return spawnSync(process.execPath, [VERIFIER_SCRIPT, '--root', root], {
    cwd: path.dirname(root),
    encoding: 'utf8',
  });
}

function assertCase(name, mutate, expectedCode, expectedText) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-owner-completion-drill-${name}-`));
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
    name: 'aligned-completion-drill-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
  },
  {
    name: 'drill-primary-source-artifact-missing-fails',
    expectedCode: 1,
    expectedText: 'drill_primary_source_artifact_missing',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        delete value.sourceArtifact;
      });
    },
  },
  {
    name: 'drill-primary-source-artifact-stale-fails',
    expectedCode: 1,
    expectedText: 'drill_primary_source_artifact_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.sourceArtifact = 'docs/commercialization/stale-owner-evidence-handoff.json';
      });
    },
  },
  {
    name: 'drill-source-artifact-count-drift-fails',
    expectedCode: 1,
    expectedText: 'drill_source_artifact_count_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.sourceArtifactCount += 1;
      });
    },
  },
  {
    name: 'drill-source-trace-count-drift-fails',
    expectedCode: 1,
    expectedText: 'drill_source_trace_count_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.sourceTraceCount += 1;
      });
    },
  },
  {
    name: 'drill-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'drill_source_trace_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.sourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-owner-evidence-completion-drill.json#sourceArtifacts.closeoutStatus';
      });
    },
  },
  {
    name: 'drill-source-trace-boundary-drift-fails',
    expectedCode: 1,
    expectedText: 'drill_source_trace_boundary_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.sourceTraceBoundary = 'Stale completion drill source trace boundary.';
      });
    },
  },
  {
    name: 'drill-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'drill_source_trace_markdown_mismatch',
    mutate(root) {
      const absolutePath = path.join(root, DRILL_MARKDOWN_PATH);
      fs.writeFileSync(
        absolutePath,
        fs.readFileSync(absolutePath, 'utf8').replace('## Source Trace', '## Stale Source Trace'),
      );
    },
  },
  {
    name: 'recommended-command-order-count-drift-fails',
    expectedCode: 1,
    expectedText: 'drill_recommended_command_order_count_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.recommendedCommandOrderCount += 1;
      });
    },
  },
  {
    name: 'recommended-operational-access-command-count-drift-fails',
    expectedCode: 1,
    expectedText: 'drill_recommended_operational_access_command_count_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.recommendedOperationalAccessCommandCount += 1;
      });
    },
  },
  {
    name: 'recommended-operational-access-command-list-drift-fails',
    expectedCode: 1,
    expectedText: 'drill_recommended_operational_access_commands_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.recommendedOperationalAccessCommands = value.recommendedOperationalAccessCommands.slice(1);
        value.recommendedOperationalAccessCommandCount = value.recommendedOperationalAccessCommands.length;
      });
    },
  },
  {
    name: 'recommended-operational-access-command-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'drill_recommended_operational_access_command_markdown_mismatch',
    mutate(root) {
      const absolutePath = path.join(root, DRILL_MARKDOWN_PATH);
      fs.writeFileSync(
        absolutePath,
        fs.readFileSync(absolutePath, 'utf8').replace('## Recommended Operational Access Commands', '## Stale Operational Access Commands'),
      );
    },
  },
  {
    name: 'does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'drill_does_not_prove_count_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.doesNotProveCount += 1;
      });
    },
  },
  {
    name: 'owner-prep-action-needed-by-gate-count-drift-fails',
    expectedCode: 1,
    expectedText: 'drill_owner_prep_action_needed_by_gate_count_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.ownerPrepActionNeededByGateCount += 1;
      });
    },
  },
  {
    name: 'handoff-owner-prep-action-needed-by-gate-count-drift-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.ownerPrepActionNeededByGateCount += 1;
      });
    },
  },
  {
    name: 'drill-basis-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'drill_basis_count_markdown_mismatch',
    mutate(root) {
      const absolutePath = path.join(root, DRILL_MARKDOWN_PATH);
      fs.writeFileSync(
        absolutePath,
        fs.readFileSync(absolutePath, 'utf8').replace('| Recommended commands |', '| Recommended commands drift |'),
      );
    },
  },
  {
    name: 'owner-prep-action-needed-by-gate-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'drill_basis_count_markdown_mismatch',
    mutate(root) {
      const absolutePath = path.join(root, DRILL_MARKDOWN_PATH);
      fs.writeFileSync(
        absolutePath,
        fs.readFileSync(absolutePath, 'utf8').replace('| Owner prep by-gate maps |', '| Owner prep by-gate map total |'),
      );
    },
  },
  {
    name: 'drill-primary-source-artifact-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'drill_primary_source_artifact_markdown_mismatch',
    mutate(root) {
      const absolutePath = path.join(root, DRILL_MARKDOWN_PATH);
      fs.writeFileSync(
        absolutePath,
        fs.readFileSync(absolutePath, 'utf8').replace('Primary source artifact:', 'Primary source artifact drift:'),
      );
    },
  },
  {
    name: 'missing-completion-rows-fails',
    expectedCode: 1,
    expectedText: 'missing_completion_rows',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        delete value.completionRows;
      });
    },
  },
  {
    name: 'summary-status-mismatch-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      writeModel(root, { summary: { ...baseSummary(), status: 'stale_status' } });
    },
  },
  {
    name: 'missing-ui-completion-drill-item-fails',
    expectedCode: 1,
    expectedText: 'missing_ui_completion_drill_item',
    mutate(root) {
      const rows = baseRows();
      writeModel(root, { summary: baseSummary(rows), items: rows.slice(1), csvRows: rows.slice(1) });
    },
  },
  {
    name: 'extra-ui-completion-drill-item-fails',
    expectedCode: 1,
    expectedText: 'extra_ui_completion_drill_item',
    mutate(root) {
      const rows = baseRows();
      const extra = { ...clone(rows[0]), gateId: 'unexpected_gate', label: 'Unexpected gate', order: 99 };
      writeModel(root, { summary: baseSummary(rows), items: [...rows, extra], csvRows: [...rows, extra] });
    },
  },
  {
    name: 'row-field-mismatch-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      const rows = clone(baseRows());
      rows[0].ownerPrepCommand = 'npm run hash:owner-evidence-artifacts --wrong';
      writeModel(root, { summary: baseSummary(), items: rows, csvRows: rows });
    },
  },
  {
    name: 'missing-ui-csv-row-fails',
    expectedCode: 1,
    expectedText: 'missing_ui_csv_row',
    mutate(root) {
      const rows = baseRows();
      writeModel(root, { summary: baseSummary(rows), items: rows, csvRows: rows.slice(0, 1) });
    },
  },
  {
    name: 'generated-csv-json-order-mismatch-fails',
    expectedCode: 1,
    expectedText: 'generated_csv_json_gate_order_mismatch',
    mutate(root) {
      writeGeneratedCsv(root, baseRows().reverse());
    },
  },
  {
    name: 'packet-missing-official-references-fails',
    expectedCode: 1,
    expectedText: 'packet_missing_official_references',
    mutate(root) {
      updateJson(root, PACKET_PATH_BY_TYPE.live_proof_run, (value) => {
        value.officialReferences = [];
      });
    },
  },
  {
    name: 'packet-official-reference-count-drift-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.packetSummaries[0].officialReferenceCount = 99;
      });
    },
  },
  {
    name: 'drill-official-reference-url-drift-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.officialReferenceUrls = ['https://example.com/stale'];
      });
    },
  },
  {
    name: 'filename-mismatch-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      writeModel(root, { filename: 'stale-owner-evidence-completion-matrix.csv' });
    },
  },
  {
    name: 'missing-local-safety-source-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        delete value.sourceArtifacts.ownerEvidenceLocalSafety;
      });
    },
  },
  {
    name: 'local-safety-status-drift-fails',
    expectedCode: 1,
    expectedText: 'local_safety_status_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.localSafetyStatus.protectedPathCount = 9;
      });
    },
  },
  {
    name: 'local-safety-does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'local_safety_status_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.localSafetyStatus.doesNotProveCount = 999;
      });
    },
  },
  {
    name: 'local-safety-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'local_safety_status_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        delete value.localSafetyStatus.sourceTrace;
        delete value.localSafetyStatus.sourceTraceCount;
        delete value.localSafetyStatus.sourceTraceBoundary;
      });
    },
  },
  {
    name: 'local-safety-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'local_safety_status_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.localSafetyStatus.sourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-owner-evidence-local-safety.json#ok';
      });
    },
  },
  {
    name: 'ui-local-safety-status-drift-fails',
    expectedCode: 1,
    expectedText: 'ui_local_safety_status_mismatch',
    mutate(root) {
      writeModel(root, {
        localSafetyStatus: {
          ...baseLocalSafetyStatus(),
          trackedSensitiveFileViolationCount: 1,
        },
      });
    },
  },
  {
    name: 'ui-local-safety-source-trace-drift-fails',
    expectedCode: 1,
    expectedText: 'ui_local_safety_status_mismatch',
    mutate(root) {
      const staleStatus = baseLocalSafetyStatus();
      staleStatus.sourceTrace[0].sourceArtifact = 'docs/commercialization/stale-owner-evidence-local-safety.json#ok';
      writeModel(root, { localSafetyStatus: staleStatus });
    },
  },
  {
    name: 'local-safety-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'local_safety_source_trace_markdown_mismatch',
    mutate(root) {
      const absolutePath = path.join(root, DRILL_MARKDOWN_PATH);
      fs.writeFileSync(
        absolutePath,
        fs.readFileSync(absolutePath, 'utf8').replace('### Local Evidence Safety Source Trace', '### Stale Local Safety Trace'),
      );
    },
  },
  {
    name: 'local-safety-does-not-prove-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'local_safety_source_trace_markdown_mismatch',
    mutate(root) {
      const absolutePath = path.join(root, DRILL_MARKDOWN_PATH);
      fs.writeFileSync(
        absolutePath,
        fs.readFileSync(absolutePath, 'utf8').replace('Does-not-prove boundaries: 3', 'Does-not-prove boundaries: 2'),
      );
    },
  },
  {
    name: 'missing-owner-prep-action-needed-by-gate-fails',
    expectedCode: 1,
    expectedText: 'owner_prep_action_needed_by_gate_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        delete value.ownerPrepActionNeededByGate;
      });
    },
  },
  {
    name: 'owner-prep-action-needed-by-gate-drift-fails',
    expectedCode: 1,
    expectedText: 'owner_prep_action_needed_by_gate_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.ownerPrepActionNeededByGate.manual_wcag_evidence.ownerActionNeeded = [];
        value.ownerPrepActionNeededByGate.manual_wcag_evidence.ownerActionNeededCount = 0;
      });
    },
  },
  {
    name: 'handoff-owner-prep-action-needed-by-gate-drift-fails',
    expectedCode: 1,
    expectedText: 'handoff_owner_prep_action_needed_by_gate_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        delete value.ownerPrepActionNeededByGate.manual_wcag_evidence;
      });
    },
  },
  {
    name: 'owner-prep-action-needed-by-gate-source-drift-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      updateJson(root, DRILL_JSON_PATH, (value) => {
        value.ownerPrepActionNeededByGateSourceArtifact = 'docs/commercialization/stale-closeout.json#ownerEvidencePrep.ownerActionNeededByGate';
      });
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText);
}

console.log(`Owner-evidence completion-drill alignment fixture verification passed: ${cases.length} cases.`);
