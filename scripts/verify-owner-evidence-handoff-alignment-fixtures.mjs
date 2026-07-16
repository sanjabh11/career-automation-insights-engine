#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-owner-evidence-handoff-alignment.mjs');

const LEDGER_PATH = 'docs/commercialization/remediation-external-gates-latest.json';
const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const OWNER_EVIDENCE_LOCAL_SAFETY_PATH = 'docs/commercialization/owner-evidence-local-safety-latest.json';
const OWNER_EVIDENCE_LOCAL_SAFETY_SOURCE_TRACE_BOUNDARY =
  'This local-safety source trace identifies owner-evidence-local-safety artifact anchors for git ignore, tracking, staging, error, and boundary counts. It does not read owner-held evidence file contents, load secrets, run live checks, or upgrade launch readiness.';
const HANDOFF_SOURCE_TRACE_BOUNDARY =
  'This handoff source trace maps each owner-evidence handoff provenance row to the sourceArtifacts key used by the generated owner packet. It does not execute owner commands, load credentials, collect owner-held evidence, read local evidence values, run live checks, or upgrade launch readiness.';
const HANDOFF_JSON_PATH = 'docs/commercialization/owner-evidence-handoff-latest.json';
const HANDOFF_MD_PATH = 'docs/commercialization/owner-evidence-handoff-latest.md';
const HANDOFF_CSV_PATH = 'docs/commercialization/owner-evidence-handoff-latest.csv';

const REQUIRED_COLLECT_LIVE_PROOF_COMMANDS = [
  'npm run verify:stripe-test-checkout',
  'npm run verify:production-calibration',
  'npm run verify:commercial-live-auth-e2e',
  'npm run verify:stripe-live-mrr',
];
const LIVE_CLOSEOUT_TARGET_PROJECT_REF = 'kvunnankqgfokeufvsrv';
const REQUIRED_OPERATIONAL_ACCESS_COMMANDS = [
  'gh secret list --repo sanjabh11/career-automation-insights-engine',
  'supabase login',
  'supabase projects list --output json',
  `supabase functions list --project-ref ${LIVE_CLOSEOUT_TARGET_PROJECT_REF}`,
  'npm run generate:live-closeout-readiness',
  'npm run verify:live-closeout-readiness',
];

const CLOSEOUT_FAILED_STEP_IDS = [
  'compose-live-evidence',
  'verify-live-evidence',
  'verify-manual-wcag-evidence',
  'verify-remediation-gates',
];

const OWNER_ACTIONS = {
  manual:
    'docs/commercialization/manual-wcag-evidence.local.json: complete manual WCAG review metadata and hash owner-held proof artifacts',
  stripe:
    'stripe_test_checkout: provide STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY and load synthetic-user credentials',
  stripeArtifact:
    'docs/commercialization/stripe-test-checkout-proof-latest.json: run owner proof command until status=passed',
};

const CSV_COLUMNS = [
  'order',
  'track',
  'gate_id',
  'label',
  'status',
  'source_boundary',
  'current_evidence',
  'needed_evidence',
  'owner_action',
  'owner_prep_command',
  'blocking_owner_actions',
  'next_command',
  'closeout_steps',
  'closeout_failure_details',
  'risk_if_skipped',
  'does_not_prove',
  'raw_evidence_policy',
  'repo_does_not_do',
];

function nextCommands() {
  return {
    writeLocalScaffold: 'npm run prepare:owner-evidence -- --write',
    verifyLocalSafety: 'npm run verify:owner-evidence-local-safety',
    generateLiveProofRunPacket: 'npm run generate:live-proof-run-packet',
    loadEnv: 'set -a; source .env.local; set +a',
    collectLiveProofs: REQUIRED_COLLECT_LIVE_PROOF_COMMANDS,
    composeLiveGateEvidence:
      'npm run compose:live-gate-evidence -- --write --allow-partial --output docs/commercialization/live-gate-evidence.local.json',
    validateLiveGateEvidence:
      'npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-any',
    composeCompleteLiveGateEvidence:
      'npm run compose:live-gate-evidence -- --write --require-complete --output docs/commercialization/live-gate-evidence.local.json',
    validateCompleteLiveGateEvidence:
      'npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-complete',
    generateCommercialEvidenceIntakePacket: 'npm run generate:commercial-evidence-intake-packet',
    hashCommercialProofArtifacts: 'npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>',
    composeCommercialRecords:
      'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
    validateCommercialEvidenceRecords:
      'npm run verify:commercial-evidence-records -- --evidence docs/commercialization/commercial-evidence-records.local.json --require-all',
    generateManualWcagReviewPacket: 'npm run generate:manual-wcag-review-packet',
    hashManualWcagProofArtifacts: 'npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>',
    validateManualWcagEvidence:
      'npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete',
    composeAndCloseout:
      'npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-intake docs/commercialization/commercial-evidence-intake.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json',
    statusOnly: 'npm run verify:owner-evidence-closeout',
  };
}

function commandSequence(commands = nextCommands()) {
  return [
    commands.writeLocalScaffold,
    commands.verifyLocalSafety,
    commands.generateLiveProofRunPacket,
    commands.loadEnv,
    ...(commands.collectLiveProofs || []),
    commands.composeLiveGateEvidence,
    commands.validateLiveGateEvidence,
    commands.composeCompleteLiveGateEvidence,
    commands.validateCompleteLiveGateEvidence,
    commands.generateCommercialEvidenceIntakePacket,
    commands.hashCommercialProofArtifacts,
    commands.composeCommercialRecords,
    commands.validateCommercialEvidenceRecords,
    commands.generateManualWcagReviewPacket,
    commands.hashManualWcagProofArtifacts,
    commands.validateManualWcagEvidence,
    commands.composeAndCloseout,
    'npm run verify:commercial',
  ].filter(Boolean);
}

function ownerActionQueue() {
  return [
    {
      id: 'manual_wcag_evidence',
      label: 'Manual WCAG accessibility evidence',
      status: 'blocked_missing_manual_wcag_evidence',
      ownerAction: 'Complete owner-held manual WCAG evidence.',
      ownerPrepCommand:
        'npm run generate:manual-wcag-review-packet && npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>',
      nextCommand:
        'npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete',
      riskIfSkipped: 'No manual accessibility claim can be made.',
      sourceBoundary: 'owner-held manual accessibility review',
      doesNotProve: ['WCAG conformance statement', 'legal compliance'],
    },
    {
      id: 'real_stripe_test_checkout',
      label: 'Real Stripe test-mode checkout',
      status: 'blocked_missing_owner_secret_or_live_evidence',
      ownerAction: 'Run owner-held Stripe test checkout proof.',
      ownerPrepCommand:
        'npm run generate:live-proof-run-packet && npm run prepare:owner-evidence -- --write && set -a; source .env.local; set +a',
      nextCommand: 'npm run verify:stripe-test-checkout',
      riskIfSkipped: 'No real Stripe test checkout can be cited.',
      sourceBoundary: 'owner credential gate',
      doesNotProve: ['Live revenue', 'MRR'],
    },
  ];
}

function gates() {
  return ownerActionQueue().map((item) => ({
    id: item.id,
    label: item.label,
    status: item.status,
    evidence: `${item.id} current evidence placeholder`,
    neededEvidence: `${item.id} needed evidence placeholder`,
    sourceBoundary: item.sourceBoundary,
    ownerAction: item.ownerAction,
    ownerPrepCommand: item.ownerPrepCommand,
    nextCommand: item.nextCommand,
    riskIfSkipped: item.riskIfSkipped,
    doesNotProve: item.doesNotProve,
  }));
}

function closeoutSteps() {
  return [
    {
      id: 'verify-manual-wcag-evidence',
      status: 'fail',
      summary: { errorExcerpts: [] },
      stderrTail: ['Manual WCAG evidence is incomplete.'],
    },
    {
      id: 'compose-live-evidence',
      status: 'fail',
      summary: { errorExcerpts: ['stripe-test-checkout proof is missing'] },
      stderrTail: [],
    },
    {
      id: 'verify-live-evidence',
      status: 'fail',
      summary: { errorExcerpts: [] },
      stderrTail: ['Not all live-gate evidence items are accepted.'],
    },
    {
      id: 'verify-remediation-gates',
      status: 'fail',
      summary: { errorExcerpts: [] },
      stderrTail: ['Remediation external gates are not complete.'],
    },
  ];
}

function ownerEvidencePrep() {
  return {
    readyForCloseout: false,
    ownerActionNeededCount: 3,
    ownerActionNeeded: [OWNER_ACTIONS.manual, OWNER_ACTIONS.stripe, OWNER_ACTIONS.stripeArtifact],
    ownerActionNeededByGate: {
      manual_wcag_evidence: [OWNER_ACTIONS.manual],
      real_stripe_test_checkout: [OWNER_ACTIONS.stripe, OWNER_ACTIONS.stripeArtifact],
    },
  };
}

function localSafetyArtifact() {
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

function localSafetySourceTrace(artifact = localSafetyArtifact()) {
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

function localSafetyStatus(artifact = localSafetyArtifact()) {
  const sourceTrace = localSafetySourceTrace(artifact);
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

function ownerPrepActionNeededByGate() {
  const prep = ownerEvidencePrep();
  return Object.fromEntries(
    ownerActionQueue().map((item) => {
      const ownerActionNeeded = prep.ownerActionNeededByGate[item.id] || [];
      return [
        item.id,
        {
          gateId: item.id,
          ownerActionNeededCount: ownerActionNeeded.length,
          ownerActionNeeded,
          sourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate.${item.id}`,
        },
      ];
    })
  );
}

function operationalAccessPrerequisites() {
  return [
    {
      id: 'live_closeout_supabase_access',
      label: 'Live closeout Supabase project/functions access',
      track: 'live-runtime',
      status: 'owner_access_required',
      sourceArtifact: 'docs/commercialization/live-closeout-readiness-latest.json',
      ownerAction: 'Use an owner-approved Supabase account and rerun the strict live closeout readiness verifier.',
      ownerPrepCommand: 'npm run generate:live-closeout-readiness',
      nextCommand: 'npm run verify:live-closeout-readiness',
      accessRecoveryCommands: REQUIRED_OPERATIONAL_ACCESS_COMMANDS,
      accessRecoveryCommandCount: REQUIRED_OPERATIONAL_ACCESS_COMMANDS.length,
      blockingCheckIds: ['supabase-target-project-visible', 'supabase-functions-api-accessible'],
    },
  ];
}

function closeoutStatus(commands = nextCommands()) {
  return {
    schemaVersion: '2026-06-04.apo-owner-evidence-closeout-status.v1',
    ok: false,
    goalComplete: false,
    ownerEvidencePrep: ownerEvidencePrep(),
    steps: closeoutSteps(),
    failedStepIds: CLOSEOUT_FAILED_STEP_IDS,
    nextCommands: commands,
  };
}

function closeoutStepIdsForGate(gateId) {
  if (gateId === 'manual_wcag_evidence') return ['verify-manual-wcag-evidence', 'verify-remediation-gates'];
  if (gateId === 'real_stripe_test_checkout') {
    return ['compose-live-evidence', 'verify-live-evidence', 'verify-remediation-gates'];
  }
  return ['verify-remediation-gates'];
}

function closeoutDetailsForGate(gateId) {
  const stepsById = new Map(closeoutSteps().map((step) => [step.id, step]));
  return closeoutStepIdsForGate(gateId)
    .flatMap((stepId) => {
      const step = stepsById.get(stepId);
      const details = [
        ...(step?.summary?.errorExcerpts || []),
        ...(step?.stderrTail || []).map((line) => `stderr: ${line}`),
      ];
      return details.length ? [`${stepId}: ${details.join(' | ')}`] : [];
    });
}

function rawEvidencePolicyForGate(gateId) {
  if (gateId === 'manual_wcag_evidence') return 'Keep raw WCAG reviewer notes outside git.';
  if (gateId === 'real_stripe_test_checkout') return 'Keep Stripe keys and raw Checkout Session payloads outside git.';
  return 'Keep owner-held raw evidence outside git.';
}

function repoDoesNotDoForGate(gateId) {
  if (gateId === 'manual_wcag_evidence') return 'The repo cannot perform the manual WCAG-EM review.';
  if (gateId === 'real_stripe_test_checkout') return 'The repo cannot prove checkout without owner-held credentials.';
  return 'The repo cannot replace owner-held evidence.';
}

function handoffRows() {
  const prep = ownerEvidencePrep();
  return ownerActionQueue().map((item, index) => {
    const closeoutStepIds = closeoutStepIdsForGate(item.id);
    return {
      order: index + 1,
      gateId: item.id,
      label: item.label,
      track: item.id === 'manual_wcag_evidence' ? 'accessibility' : 'payments',
      status: item.status,
      sourceBoundary: item.sourceBoundary,
      currentEvidence: `${item.id} current evidence placeholder`,
      neededEvidence: `${item.id} needed evidence placeholder`,
      ownerAction: item.ownerAction,
      ownerPrepCommand: item.ownerPrepCommand,
      nextCommand: item.nextCommand,
      closeoutStepIds,
      closeoutStepStatuses: closeoutStepIds.map((stepId) => ({
        stepId,
        status: 'fail',
        failureDetails: [],
      })),
      closeoutFailureDetails: closeoutDetailsForGate(item.id),
      blockingOwnerActions: prep.ownerActionNeededByGate[item.id] || [],
      riskIfSkipped: item.riskIfSkipped,
      doesNotProve: item.doesNotProve,
      rawEvidencePolicy: rawEvidencePolicyForGate(item.id),
      repoDoesNotDo: repoDoesNotDoForGate(item.id),
    };
  });
}

function sourceTrace(sourceArtifacts) {
  return Object.entries(sourceArtifacts || {}).map(([key, artifactPath]) => ({
    key,
    artifactPath,
    sourceArtifact: `${HANDOFF_JSON_PATH}#sourceArtifacts.${key}`,
  }));
}

function handoff(commands = nextCommands()) {
  const rows = handoffRows();
  const ownerPrepByGate = ownerPrepActionNeededByGate();
  const sourceArtifacts = {
    remediationLedger: LEDGER_PATH,
    closeoutStatus: CLOSEOUT_STATUS_PATH,
    ownerEvidenceLocalSafety: OWNER_EVIDENCE_LOCAL_SAFETY_PATH,
  };
  const sourceTraceRows = sourceTrace(sourceArtifacts);
  return {
    schemaVersion: '2026-06-04.apo-owner-evidence-handoff.v1',
    generatedAt: '2026-06-05T00:00:00.000Z',
    ok: true,
    goalComplete: false,
    ownerActionQueueCount: rows.length,
    remainingGateIds: rows.map((row) => row.gateId),
    remainingGateCount: rows.length,
    evidenceBoundary: 'Fixture handoff is an execution aid, not launch proof.',
    sourceArtifact: sourceArtifacts.remediationLedger,
    sourceArtifacts,
    sourceArtifactCount: Object.keys(sourceArtifacts).length,
    sourceTraceCount: sourceTraceRows.length,
    sourceTrace: sourceTraceRows,
    sourceTraceBoundary: HANDOFF_SOURCE_TRACE_BOUNDARY,
    localSafetyStatus: localSafetyStatus(),
    closeoutStatus: {
      ok: false,
      goalComplete: false,
      failedStepIds: CLOSEOUT_FAILED_STEP_IDS,
    },
    ownerPrepReadiness: {
      readyForCloseout: false,
      ownerActionNeededCount: ownerEvidencePrep().ownerActionNeededCount,
      ownerActionNeeded: ownerEvidencePrep().ownerActionNeeded,
    },
    ownerPrepActionNeededByGateSourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate`,
    ownerPrepActionNeededByGateBoundary:
      'Fixture per-gate owner prep summary; does not prove owner-held evidence or commercial readiness.',
    ownerPrepActionNeededByGate: ownerPrepByGate,
    ownerPrepActionNeededByGateCount: Object.keys(ownerPrepByGate).length,
    commandSequence: commandSequence(commands),
    commandSequenceCount: commandSequence(commands).length,
    ownerActionRows: rows,
    ownerActionRowCount: rows.length,
    operationalAccessPrerequisiteCount: operationalAccessPrerequisites().length,
    operationalAccessPrerequisites: operationalAccessPrerequisites(),
    outputs: {
      json: HANDOFF_JSON_PATH,
      markdown: 'docs/commercialization/owner-evidence-handoff-latest.md',
      csv: HANDOFF_CSV_PATH,
    },
  };
}

function csvEscape(value) {
  if (Array.isArray(value)) return csvEscape(value.join('; '));
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function csvValue(row, column) {
  const values = {
    order: row.order,
    track: row.track,
    gate_id: row.gateId,
    label: row.label,
    status: row.status,
    source_boundary: row.sourceBoundary,
    current_evidence: row.currentEvidence,
    needed_evidence: row.neededEvidence,
    owner_action: row.ownerAction,
    owner_prep_command: row.ownerPrepCommand,
    blocking_owner_actions: row.blockingOwnerActions,
    next_command: row.nextCommand,
    closeout_steps: row.closeoutStepIds.map((stepId) => `${stepId}:fail`).join('; '),
    closeout_failure_details: row.closeoutFailureDetails,
    risk_if_skipped: row.riskIfSkipped,
    does_not_prove: row.doesNotProve,
    raw_evidence_policy: row.rawEvidencePolicy,
    repo_does_not_do: row.repoDoesNotDo,
  };
  return values[column];
}

function buildCsv(rows) {
  const header = CSV_COLUMNS.map(csvEscape).join(',');
  const body = rows.map((row) => CSV_COLUMNS.map((column) => csvEscape(csvValue(row, column))).join(','));
  return [header, ...body].join('\n');
}

function markdownCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

function buildMarkdown(packet) {
  const packetSourceTraceRows = packet.sourceTrace
    .map((row) => `| ${markdownCell(row.key)} | \`${markdownCell(row.artifactPath)}\` | \`${markdownCell(row.sourceArtifact)}\` |`)
    .join('\n');
  const localSafetySourceTraceRows = packet.localSafetyStatus.sourceTrace
    .map((row) => `| ${markdownCell(row.key)} | ${markdownCell(row.value)} | ${markdownCell(row.sourceArtifact)} |`)
    .join('\n');
  const operationalCommandRows = packet.operationalAccessPrerequisites
    .flatMap((item) => item.accessRecoveryCommands || [])
    .map((command) => `- \`${markdownCell(command)}\``)
    .join('\n');
  return `# Owner Evidence Handoff Packet

Primary source artifact: \`${packet.sourceArtifact}\`

Source artifact count: ${packet.sourceArtifactCount}

Source trace rows: ${packet.sourceTraceCount}

Owner action queue count: ${packet.ownerActionQueueCount}

Remaining gate count: ${packet.remainingGateCount}

Owner action row count: ${packet.ownerActionRowCount}

Owner prep by-gate map count: ${packet.ownerPrepActionNeededByGateCount}

Command sequence count: ${packet.commandSequenceCount}

## Source Trace

Trace boundary: ${packet.sourceTraceBoundary}

| Key | Artifact | Source anchor |
| --- | --- | --- |
${packetSourceTraceRows}

## Local Evidence Safety Preflight

Source artifact: \`${packet.localSafetyStatus.sourceArtifact}\`

Status: \`${packet.localSafetyStatus.status}\`

Protected paths ignored: ${packet.localSafetyStatus.ignoredProtectedPathCount}/${packet.localSafetyStatus.protectedPathCount}

Tracked sensitive file violations: ${packet.localSafetyStatus.trackedSensitiveFileViolationCount}

Staged sensitive path violations: ${packet.localSafetyStatus.stagedSensitivePathViolationCount}

Does-not-prove boundaries: ${packet.localSafetyStatus.doesNotProveCount}

Boundary: ${packet.localSafetyStatus.evidenceBoundary}

Source trace rows: ${packet.localSafetyStatus.sourceTraceCount}

### Local Evidence Safety Source Trace

Trace boundary: ${packet.localSafetyStatus.sourceTraceBoundary}

| Key | Value | Source artifact |
| --- | --- | --- |
${localSafetySourceTraceRows}

## Operational Access Prerequisites

These rows are not launch-evidence gates. They are owner access prerequisites for live deployment closeout claims.

### Operational Access Command Checklist

These commands are owner-run access probes and local status refreshes. They must not be treated as deploy, ingest, payment, or launch proof.

${operationalCommandRows}
`;
}

function writeFile(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, value);
}

function writeJson(root, relativePath, value) {
  writeFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeCsv(root, rows) {
  writeFile(root, HANDOFF_CSV_PATH, `${buildCsv(rows)}\n`);
}

function writeBaseArtifacts(root) {
  const commands = nextCommands();
  const packet = handoff(commands);
  writeJson(root, LEDGER_PATH, {
    generatedAt: '2026-06-05T00:00:00.000Z',
    goalComplete: false,
    gates: gates(),
    ownerActionQueue: ownerActionQueue(),
  });
  writeJson(root, CLOSEOUT_STATUS_PATH, closeoutStatus(commands));
  writeJson(root, OWNER_EVIDENCE_LOCAL_SAFETY_PATH, localSafetyArtifact());
  writeJson(root, HANDOFF_JSON_PATH, packet);
  writeFile(root, HANDOFF_MD_PATH, buildMarkdown(packet));
  writeCsv(root, packet.ownerActionRows);
}

function updateJson(root, relativePath, updater) {
  const absolutePath = path.join(root, relativePath);
  const value = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  updater(value);
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function runVerifier(root) {
  return spawnSync(process.execPath, [VERIFIER_SCRIPT, '--root', root], {
    cwd: path.dirname(root),
    encoding: 'utf8',
  });
}

function assertCase(name, mutate, expectedCode, expectedText) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-owner-handoff-alignment-${name}-`));
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
    name: 'aligned-owner-evidence-handoff-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
  },
  {
    name: 'handoff-primary-source-artifact-missing-fails',
    expectedCode: 1,
    expectedText: 'handoff_primary_source_artifact_missing',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        delete value.sourceArtifact;
      });
    },
  },
  {
    name: 'handoff-primary-source-artifact-stale-fails',
    expectedCode: 1,
    expectedText: 'handoff_primary_source_artifact_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.sourceArtifact = 'docs/commercialization/stale-remediation-external-gates.json';
      });
    },
  },
  {
    name: 'handoff-source-artifact-count-drift-fails',
    expectedCode: 1,
    expectedText: 'handoff_source_artifact_count_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.sourceArtifactCount += 1;
      });
    },
  },
  {
    name: 'handoff-source-trace-count-drift-fails',
    expectedCode: 1,
    expectedText: 'handoff_source_trace_count_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.sourceTraceCount += 1;
      });
    },
  },
  {
    name: 'handoff-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'handoff_source_trace_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.sourceTrace[0].sourceArtifact = 'docs/commercialization/owner-evidence-handoff-latest.json#sourceArtifacts.stale';
      });
    },
  },
  {
    name: 'handoff-source-trace-boundary-drift-fails',
    expectedCode: 1,
    expectedText: 'handoff_source_trace_boundary_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.sourceTraceBoundary = 'stale handoff source trace boundary';
      });
    },
  },
  {
    name: 'handoff-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'handoff_source_trace_markdown_mismatch',
    mutate(root) {
      const absolutePath = path.join(root, HANDOFF_MD_PATH);
      fs.writeFileSync(
        absolutePath,
        fs.readFileSync(absolutePath, 'utf8').replace('Source trace rows: 3', 'Source trace total: 3'),
      );
    },
  },
  {
    name: 'handoff-primary-source-artifact-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'handoff_primary_source_artifact_markdown_mismatch',
    mutate(root) {
      const absolutePath = path.join(root, HANDOFF_MD_PATH);
      fs.writeFileSync(
        absolutePath,
        fs.readFileSync(absolutePath, 'utf8').replace('Primary source artifact:', 'Primary source artifact drift:'),
      );
    },
  },
  {
    name: 'remaining-gate-count-drift-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.remainingGateCount += 1;
      });
    },
  },
  {
    name: 'command-sequence-count-drift-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.commandSequenceCount -= 1;
      });
    },
  },
  {
    name: 'owner-action-row-count-drift-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.ownerActionRowCount += 1;
      });
    },
  },
  {
    name: 'owner-prep-action-needed-by-gate-count-drift-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.ownerPrepActionNeededByGateCount += 1;
      });
    },
  },
  {
    name: 'operational-access-command-list-drift-fails',
    expectedCode: 1,
    expectedText: 'operational_access_recovery_commands_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.operationalAccessPrerequisites[0].accessRecoveryCommands =
          value.operationalAccessPrerequisites[0].accessRecoveryCommands.slice(1);
        value.operationalAccessPrerequisites[0].accessRecoveryCommandCount =
          value.operationalAccessPrerequisites[0].accessRecoveryCommands.length;
      });
    },
  },
  {
    name: 'operational-access-command-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'operational_access_command_markdown_mismatch',
    mutate(root) {
      const absolutePath = path.join(root, HANDOFF_MD_PATH);
      fs.writeFileSync(
        absolutePath,
        fs.readFileSync(absolutePath, 'utf8').replace('### Operational Access Command Checklist', '### Stale Access Command Checklist'),
      );
    },
  },
  {
    name: 'handoff-basis-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'handoff_basis_count_markdown_mismatch',
    mutate(root) {
      const absolutePath = path.join(root, HANDOFF_MD_PATH);
      fs.writeFileSync(
        absolutePath,
        fs.readFileSync(absolutePath, 'utf8').replace('Command sequence count:', 'Command sequence total:'),
      );
    },
  },
  {
    name: 'owner-prep-action-needed-by-gate-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'handoff_basis_count_markdown_mismatch',
    mutate(root) {
      const absolutePath = path.join(root, HANDOFF_MD_PATH);
      fs.writeFileSync(
        absolutePath,
        fs.readFileSync(absolutePath, 'utf8').replace('Owner prep by-gate map count:', 'Owner prep by-gate map total:'),
      );
    },
  },
  {
    name: 'missing-owner-action-queue-fails',
    expectedCode: 1,
    expectedText: 'missing_owner_action_queue',
    mutate(root) {
      updateJson(root, LEDGER_PATH, (value) => {
        delete value.ownerActionQueue;
      });
    },
  },
  {
    name: 'missing-closeout-next-command-fails',
    expectedCode: 1,
    expectedText: 'missing_closeout_next_command',
    mutate(root) {
      updateJson(root, CLOSEOUT_STATUS_PATH, (value) => {
        delete value.nextCommands.validateManualWcagEvidence;
      });
    },
  },
  {
    name: 'collect-live-proofs-command-sequence-mismatch-fails',
    expectedCode: 1,
    expectedText: 'collect_live_proofs_command_sequence_mismatch',
    mutate(root) {
      updateJson(root, CLOSEOUT_STATUS_PATH, (value) => {
        value.nextCommands.collectLiveProofs = value.nextCommands.collectLiveProofs.slice(0, 2);
      });
    },
  },
  {
    name: 'missing-handoff-row-fails',
    expectedCode: 1,
    expectedText: 'missing_handoff_row',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.ownerActionRows = value.ownerActionRows.slice(0, 1);
      });
    },
  },
  {
    name: 'missing-csv-row-fails',
    expectedCode: 1,
    expectedText: 'missing_csv_row',
    mutate(root) {
      writeCsv(root, handoffRows().slice(0, 1));
    },
  },
  {
    name: 'row-field-mismatch-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.ownerActionRows[0].ownerPrepCommand = 'npm run hash:owner-evidence-artifacts --wrong';
      });
    },
  },
  {
    name: 'blocking-owner-actions-mismatch-fails',
    expectedCode: 1,
    expectedText: 'blocking_owner_actions_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.ownerActionRows[0].blockingOwnerActions = [];
      });
    },
  },
  {
    name: 'command-sequence-mismatch-fails',
    expectedCode: 1,
    expectedText: 'command_sequence_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.commandSequence = value.commandSequence.slice(0, -1);
      });
    },
  },
  {
    name: 'owner-prep-actions-mismatch-fails',
    expectedCode: 1,
    expectedText: 'owner_prep_actions_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.ownerPrepReadiness.ownerActionNeeded = value.ownerPrepReadiness.ownerActionNeeded.slice(0, 1);
      });
    },
  },
  {
    name: 'missing-owner-prep-action-needed-by-gate-fails',
    expectedCode: 1,
    expectedText: 'owner_prep_action_needed_by_gate_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        delete value.ownerPrepActionNeededByGate;
      });
    },
  },
  {
    name: 'owner-prep-action-needed-by-gate-drift-fails',
    expectedCode: 1,
    expectedText: 'owner_prep_action_needed_by_gate_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.ownerPrepActionNeededByGate.manual_wcag_evidence.ownerActionNeeded = [];
        value.ownerPrepActionNeededByGate.manual_wcag_evidence.ownerActionNeededCount = 0;
      });
    },
  },
  {
    name: 'owner-prep-action-needed-by-gate-source-drift-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.ownerPrepActionNeededByGateSourceArtifact = 'docs/commercialization/stale-closeout.json#ownerEvidencePrep.ownerActionNeededByGate';
      });
    },
  },
  {
    name: 'failed-step-ids-mismatch-fails',
    expectedCode: 1,
    expectedText: 'failed_step_ids_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.closeoutStatus.failedStepIds = value.closeoutStatus.failedStepIds.slice(0, 1);
      });
    },
  },
  {
    name: 'missing-local-safety-source-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        delete value.sourceArtifacts.ownerEvidenceLocalSafety;
      });
    },
  },
  {
    name: 'local-safety-status-drift-fails',
    expectedCode: 1,
    expectedText: 'local_safety_status_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.localSafetyStatus.ok = false;
        value.localSafetyStatus.status = 'failed';
      });
    },
  },
  {
    name: 'local-safety-does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'local_safety_status_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.localSafetyStatus.doesNotProveCount = 999;
      });
    },
  },
  {
    name: 'local-safety-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'local_safety_status_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
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
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.localSafetyStatus.sourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-owner-evidence-local-safety.json#ok';
      });
    },
  },
  {
    name: 'local-safety-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'local_safety_source_trace_markdown_mismatch',
    mutate(root) {
      const absolutePath = path.join(root, HANDOFF_MD_PATH);
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
      const absolutePath = path.join(root, HANDOFF_MD_PATH);
      fs.writeFileSync(
        absolutePath,
        fs.readFileSync(absolutePath, 'utf8').replace('Does-not-prove boundaries: 3', 'Does-not-prove boundaries: 2'),
      );
    },
  },
  {
    name: 'closeout-failure-details-mismatch-fails',
    expectedCode: 1,
    expectedText: 'closeout_failure_details_mismatch',
    mutate(root) {
      updateJson(root, HANDOFF_JSON_PATH, (value) => {
        value.ownerActionRows[1].closeoutFailureDetails = [];
      });
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText);
}

console.log(`Owner-evidence handoff alignment fixture verification passed: ${cases.length} cases.`);
