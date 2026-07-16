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
const REQUIRED_NEXT_COMMAND_KEYS = [
  'writeLocalScaffold',
  'verifyLocalSafety',
  'generateLiveProofRunPacket',
  'loadEnv',
  'collectLiveProofs',
  'composeLiveGateEvidence',
  'validateLiveGateEvidence',
  'composeCompleteLiveGateEvidence',
  'validateCompleteLiveGateEvidence',
  'generateCommercialEvidenceIntakePacket',
  'hashCommercialProofArtifacts',
  'composeCommercialRecords',
  'validateCommercialEvidenceRecords',
  'generateManualWcagReviewPacket',
  'hashManualWcagProofArtifacts',
  'validateManualWcagEvidence',
  'composeAndCloseout',
  'statusOnly',
];
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

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function readOptionalJson(relativePath) {
  try {
    return readJson(relativePath);
  } catch {
    return null;
  }
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item));
  return String(value || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
}

function markdownCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
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
  if (!header) return [];
  return body.map((csvRow) => {
    const record = {};
    header.forEach((column, index) => {
      record[column] = csvRow[index] || '';
    });
    return record;
  });
}

function trackForGate(gateId) {
  if (gateId === 'manual_wcag_evidence') return 'accessibility';
  if (gateId === 'real_stripe_test_checkout' || gateId === 'live_mrr_gt_zero') return 'payments';
  if (gateId === 'production_calibration_run' || gateId === 'authenticated_live_artifact_e2e') return 'live-runtime';
  if (gateId === 'three_committed_partners' || gateId === 'documented_outcomes') return 'commercial-validation';
  return 'other';
}

function closeoutStepsForGate(gateId) {
  const mapping = {
    manual_wcag_evidence: ['verify-manual-wcag-evidence', 'verify-remediation-gates'],
    real_stripe_test_checkout: ['compose-live-evidence', 'verify-live-evidence', 'verify-remediation-gates'],
    production_calibration_run: ['compose-live-evidence', 'verify-live-evidence', 'verify-remediation-gates'],
    authenticated_live_artifact_e2e: ['compose-live-evidence', 'verify-live-evidence', 'verify-remediation-gates'],
    live_mrr_gt_zero: ['compose-live-evidence', 'verify-live-evidence', 'verify-remediation-gates'],
    three_committed_partners: ['compose-commercial-records', 'verify-commercial-records', 'verify-remediation-gates'],
    documented_outcomes: ['compose-commercial-records', 'verify-commercial-records', 'verify-remediation-gates'],
  };
  return mapping[gateId] || ['verify-remediation-gates'];
}

function ownerPrepBlockerPrefixesForGate(gateId) {
  const mapping = {
    manual_wcag_evidence: ['docs/commercialization/manual-wcag-evidence.local.json:'],
    real_stripe_test_checkout: [
      'stripe_test_checkout:',
      'docs/commercialization/stripe-test-checkout-proof-latest.json:',
    ],
    production_calibration_run: ['production_calibration:'],
    authenticated_live_artifact_e2e: ['authenticated_live_artifact_e2e:'],
    live_mrr_gt_zero: [
      'live_mrr_gt_zero:',
      'docs/commercialization/stripe-live-mrr-proof-latest.json:',
    ],
    three_committed_partners: ['docs/commercialization/commercial-evidence-intake.local.json:'],
    documented_outcomes: ['docs/commercialization/commercial-evidence-intake.local.json:'],
  };
  return mapping[gateId] || [];
}

function blockingOwnerActionsForGate(gateId, closeoutStatus) {
  const canonicalActions = closeoutStatus.ownerEvidencePrep?.ownerActionNeededByGate?.[gateId];
  if (Array.isArray(canonicalActions)) {
    return canonicalActions;
  }

  const prefixes = ownerPrepBlockerPrefixesForGate(gateId);
  const ownerActions = closeoutStatus.ownerEvidencePrep?.ownerActionNeeded || [];
  return ownerActions.filter((action) => prefixes.some((prefix) => action.startsWith(prefix)));
}

function stepStatusString(gateId, closeoutStatus) {
  const byStepId = new Map((closeoutStatus.steps || []).map((step) => [step.id, step.status]));
  return closeoutStepsForGate(gateId)
    .map((stepId) => `${stepId}:${byStepId.get(stepId) || 'not_run'}`)
    .join('; ');
}

function stepFailureDetails(gateId, closeoutStatus) {
  const byStepId = new Map((closeoutStatus.steps || []).map((step) => [step.id, step]));
  return closeoutStepsForGate(gateId)
    .flatMap((stepId) => {
      const step = byStepId.get(stepId);
      const details = [
        ...(step?.summary?.errorExcerpts || []),
        ...(step?.stderrTail || []).map((line) => `stderr: ${line}`),
      ];
      return details.length > 0 ? [`${stepId}: ${details.join(' | ')}`] : [];
    });
}

function addError(errors, type, detail) {
  errors.push({ type, ...detail });
}

function expectedLocalSafetySourceTrace(localSafety) {
  if (!localSafety) return [];
  return [
    {
      key: 'status',
      value: localSafety.ok === true ? 'passed' : 'failed',
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#ok`,
    },
    {
      key: 'protectedPathCount',
      value: String(localSafety.protectedPathCount ?? 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#protectedPathCount`,
    },
    {
      key: 'ignoredProtectedPathCount',
      value: String(localSafety.ignoredProtectedPathCount ?? 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#ignoredProtectedPathCount`,
    },
    {
      key: 'trackedSensitiveFileViolationCount',
      value: String(localSafety.trackedSensitiveFileViolations?.length || 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#trackedSensitiveFileViolations`,
    },
    {
      key: 'stagedSensitivePathViolationCount',
      value: String(localSafety.stagedSensitivePathViolations?.length || 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#stagedSensitivePathViolations`,
    },
    {
      key: 'errorCount',
      value: String(localSafety.errorCount ?? localSafety.errors?.length ?? 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#errorCount`,
    },
    {
      key: 'doesNotProveCount',
      value: String(localSafety.doesNotProveCount ?? localSafety.doesNotProve?.length ?? 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#doesNotProveCount`,
    },
    {
      key: 'evidenceBoundary',
      value: localSafety.evidenceBoundary || '',
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#evidenceBoundary`,
    },
  ];
}

function expectedLocalSafetyStatus(localSafety) {
  const sourceTrace = expectedLocalSafetySourceTrace(localSafety);
  if (!localSafety) {
    return {
      sourceArtifact: OWNER_EVIDENCE_LOCAL_SAFETY_PATH,
      status: 'missing_local_safety_artifact',
      ok: false,
      protectedPathCount: 0,
      ignoredProtectedPathCount: 0,
      trackedSensitiveFileViolationCount: 0,
      stagedSensitivePathViolationCount: 0,
      errorCount: 1,
      evidenceBoundary:
        'Owner-evidence local-safety status could not be read. Run npm run verify:owner-evidence-local-safety before using this handoff.',
      doesNotProve: [
        'safe handling of owner-held local evidence paths',
        'evidence completeness',
        'commercial-ready status',
      ],
      doesNotProveCount: 3,
      sourceTraceCount: sourceTrace.length,
      sourceTrace,
      sourceTraceBoundary: OWNER_EVIDENCE_LOCAL_SAFETY_SOURCE_TRACE_BOUNDARY,
    };
  }

  return {
    sourceArtifact: OWNER_EVIDENCE_LOCAL_SAFETY_PATH,
    status: localSafety.ok === true ? 'passed' : 'failed',
    ok: localSafety.ok === true,
    protectedPathCount: localSafety.protectedPathCount ?? 0,
    ignoredProtectedPathCount: localSafety.ignoredProtectedPathCount ?? 0,
    trackedSensitiveFileViolationCount: localSafety.trackedSensitiveFileViolations?.length || 0,
    stagedSensitivePathViolationCount: localSafety.stagedSensitivePathViolations?.length || 0,
    errorCount: localSafety.errorCount ?? localSafety.errors?.length ?? 0,
    evidenceBoundary: localSafety.evidenceBoundary || '',
    doesNotProve: localSafety.doesNotProve || [],
    doesNotProveCount: localSafety.doesNotProveCount ?? localSafety.doesNotProve?.length ?? 0,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: OWNER_EVIDENCE_LOCAL_SAFETY_SOURCE_TRACE_BOUNDARY,
  };
}

function validateLocalSafetySourceTraceMarkdown(errors, markdown, expectedSafety) {
  const requiredSnippets = [
    '## Local Evidence Safety Preflight',
    `Does-not-prove boundaries: ${expectedSafety.doesNotProveCount}`,
    `Source trace rows: ${expectedSafety.sourceTraceCount}`,
    '### Local Evidence Safety Source Trace',
    `Trace boundary: ${expectedSafety.sourceTraceBoundary}`,
    '| Key | Value | Source artifact |',
  ];
  requiredSnippets.forEach((snippet) => {
    if (!markdown.includes(snippet)) {
      addError(errors, 'local_safety_source_trace_markdown_mismatch', {
        markdownPath: HANDOFF_MD_PATH,
        missing: snippet,
      });
    }
  });

  (expectedSafety.sourceTrace || []).forEach((row) => {
    const expectedRow = `| ${markdownCell(row.key)} | ${markdownCell(row.value)} | ${markdownCell(row.sourceArtifact)} |`;
    if (!markdown.includes(expectedRow)) {
      addError(errors, 'local_safety_source_trace_markdown_mismatch', {
        markdownPath: HANDOFF_MD_PATH,
        missing: expectedRow,
      });
    }
  });
}

function buildExpectedSourceTrace(sourceArtifacts) {
  return Object.entries(sourceArtifacts || {}).map(([key, artifactPath]) => ({
    key,
    artifactPath,
    sourceArtifact: `${HANDOFF_JSON_PATH}#sourceArtifacts.${key}`,
  }));
}

function validateSourceTraceMarkdown(errors, markdown, handoff) {
  [
    `Source trace rows: ${handoff.sourceTraceCount}`,
    '## Source Trace',
    `Trace boundary: ${HANDOFF_SOURCE_TRACE_BOUNDARY}`,
    '| Key | Artifact | Source anchor |',
  ].forEach((snippet) => {
    if (!markdown.includes(snippet)) {
      addError(errors, 'handoff_source_trace_markdown_mismatch', {
        markdownPath: HANDOFF_MD_PATH,
        missing: snippet,
      });
    }
  });

  (handoff.sourceTrace || []).forEach((row) => {
    const expectedRow = `| ${markdownCell(row.key)} | \`${markdownCell(row.artifactPath)}\` | \`${markdownCell(row.sourceArtifact)}\` |`;
    if (!markdown.includes(expectedRow)) {
      addError(errors, 'handoff_source_trace_markdown_mismatch', {
        markdownPath: HANDOFF_MD_PATH,
        missing: expectedRow,
      });
    }
  });
}

function validateHandoffBasisCountMarkdown(errors, markdown, handoff) {
  [
    `Owner action queue count: ${handoff.ownerActionQueueCount}`,
    `Remaining gate count: ${handoff.remainingGateCount}`,
    `Owner action row count: ${handoff.ownerActionRowCount}`,
    `Owner prep by-gate map count: ${handoff.ownerPrepActionNeededByGateCount}`,
    `Command sequence count: ${handoff.commandSequenceCount}`,
  ].forEach((snippet) => {
    if (!markdown.includes(snippet)) {
      addError(errors, 'handoff_basis_count_markdown_mismatch', {
        markdownPath: HANDOFF_MD_PATH,
        missing: snippet,
      });
    }
  });
}

function expectedOwnerPrepActionNeededByGate(closeoutStatus, gateIds) {
  const actionsByGate = closeoutStatus.ownerEvidencePrep?.ownerActionNeededByGate || {};
  return Object.fromEntries(
    gateIds.map((gateId) => {
      const ownerActionNeeded = Array.isArray(actionsByGate[gateId]) ? actionsByGate[gateId] : [];
      return [
        gateId,
        {
          gateId,
          ownerActionNeededCount: ownerActionNeeded.length,
          ownerActionNeeded,
          sourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate.${gateId}`,
        },
      ];
    })
  );
}

function validateCloseoutNextCommands(errors, closeoutStatus) {
  const nextCommands = closeoutStatus.nextCommands || {};
  REQUIRED_NEXT_COMMAND_KEYS.forEach((key) => {
    const value = nextCommands[key];
    if (Array.isArray(value)) {
      if (value.length === 0) addError(errors, 'missing_closeout_next_command', { key });
      return;
    }
    if (!value) addError(errors, 'missing_closeout_next_command', { key });
  });

  if (JSON.stringify(nextCommands.collectLiveProofs || []) !== JSON.stringify(REQUIRED_COLLECT_LIVE_PROOF_COMMANDS)) {
    addError(errors, 'collect_live_proofs_command_sequence_mismatch', {
      expected: REQUIRED_COLLECT_LIVE_PROOF_COMMANDS,
      actual: nextCommands.collectLiveProofs || [],
    });
  }
}

function buildExpectedCommandSequence(closeoutStatus) {
  const nextCommands = closeoutStatus.nextCommands || {};
  return [
    nextCommands.writeLocalScaffold,
    nextCommands.verifyLocalSafety,
    nextCommands.generateLiveProofRunPacket,
    nextCommands.loadEnv,
    ...(nextCommands.collectLiveProofs || []),
    nextCommands.composeLiveGateEvidence,
    nextCommands.validateLiveGateEvidence,
    nextCommands.composeCompleteLiveGateEvidence,
    nextCommands.validateCompleteLiveGateEvidence,
    nextCommands.generateCommercialEvidenceIntakePacket,
    nextCommands.hashCommercialProofArtifacts,
    nextCommands.composeCommercialRecords,
    nextCommands.validateCommercialEvidenceRecords,
    nextCommands.generateManualWcagReviewPacket,
    nextCommands.hashManualWcagProofArtifacts,
    nextCommands.validateManualWcagEvidence,
    nextCommands.composeAndCloseout,
    'npm run verify:commercial',
  ].filter(Boolean);
}

function validateOperationalAccessPrerequisites(errors, handoff, markdown) {
  const prerequisites = handoff.operationalAccessPrerequisites || [];
  if (handoff.operationalAccessPrerequisiteCount !== prerequisites.length) {
    addError(errors, 'operational_access_prerequisite_count_mismatch', {
      expected: prerequisites.length,
      actual: handoff.operationalAccessPrerequisiteCount,
    });
  }
  const supabaseAccess = prerequisites.find((item) => item.id === 'live_closeout_supabase_access');
  if (!supabaseAccess) {
    addError(errors, 'missing_live_closeout_supabase_access_prerequisite', {
      handoffJson: HANDOFF_JSON_PATH,
    });
    return;
  }
  if (JSON.stringify(supabaseAccess.accessRecoveryCommands || []) !== JSON.stringify(REQUIRED_OPERATIONAL_ACCESS_COMMANDS)) {
    addError(errors, 'operational_access_recovery_commands_mismatch', {
      expected: REQUIRED_OPERATIONAL_ACCESS_COMMANDS,
      actual: supabaseAccess.accessRecoveryCommands || [],
    });
  }
  if (supabaseAccess.accessRecoveryCommandCount !== REQUIRED_OPERATIONAL_ACCESS_COMMANDS.length) {
    addError(errors, 'operational_access_recovery_command_count_mismatch', {
      expected: REQUIRED_OPERATIONAL_ACCESS_COMMANDS.length,
      actual: supabaseAccess.accessRecoveryCommandCount,
    });
  }

  [
    '### Operational Access Command Checklist',
    'These commands are owner-run access probes and local status refreshes.',
    ...REQUIRED_OPERATIONAL_ACCESS_COMMANDS.map((command) => `- \`${markdownCell(command)}\``),
  ].forEach((snippet) => {
    if (!markdown.includes(snippet)) {
      addError(errors, 'operational_access_command_markdown_mismatch', {
        markdownPath: HANDOFF_MD_PATH,
        missing: snippet,
      });
    }
  });
}

function compareField(errors, context, field, expected, actual) {
  if (expected !== actual) {
    addError(errors, 'field_mismatch', { context, field, expected, actual });
  }
}

function main() {
  const ledger = readJson(LEDGER_PATH);
  const closeoutStatus = readJson(CLOSEOUT_STATUS_PATH);
  const localSafety = readOptionalJson(OWNER_EVIDENCE_LOCAL_SAFETY_PATH);
  const handoff = readJson(HANDOFF_JSON_PATH);
  const handoffMarkdown = read(HANDOFF_MD_PATH);
  const csvRows = parseCsv(read(HANDOFF_CSV_PATH));
  const errors = [];

  if (!Array.isArray(ledger.ownerActionQueue) || ledger.ownerActionQueue.length === 0) {
    addError(errors, 'missing_owner_action_queue', { sourceLedger: LEDGER_PATH });
  }
  if (!Array.isArray(handoff.ownerActionRows) || handoff.ownerActionRows.length === 0) {
    addError(errors, 'missing_handoff_rows', { handoffJson: HANDOFF_JSON_PATH });
  }

  const ownerQueue = ledger.ownerActionQueue || [];
  const gatesById = new Map((ledger.gates || []).map((gate) => [gate.id, gate]));
  const rowsByGateId = new Map((handoff.ownerActionRows || []).map((row) => [row.gateId, row]));
  const csvRowsByGateId = new Map(csvRows.map((row) => [row.gate_id, row]));

  validateCloseoutNextCommands(errors, closeoutStatus);

  compareField(errors, 'handoff', 'schemaVersion', '2026-06-04.apo-owner-evidence-handoff.v1', handoff.schemaVersion);
  compareField(errors, 'handoff', 'ownerActionQueueCount', ownerQueue.length, handoff.ownerActionQueueCount);
  compareField(errors, 'handoff', 'ownerActionRowCount', (handoff.ownerActionRows || []).length, handoff.ownerActionRowCount);
  compareField(errors, 'handoff', 'goalComplete', ledger.goalComplete === true && closeoutStatus.goalComplete === true, handoff.goalComplete);
  compareField(errors, 'handoff.sourceArtifacts', 'remediationLedger', LEDGER_PATH, handoff.sourceArtifacts?.remediationLedger);
  compareField(errors, 'handoff.sourceArtifacts', 'closeoutStatus', CLOSEOUT_STATUS_PATH, handoff.sourceArtifacts?.closeoutStatus);
  compareField(
    errors,
    'handoff.sourceArtifacts',
    'ownerEvidenceLocalSafety',
    OWNER_EVIDENCE_LOCAL_SAFETY_PATH,
    handoff.sourceArtifacts?.ownerEvidenceLocalSafety,
  );
  const expectedPrimarySourceArtifact = handoff.sourceArtifacts?.remediationLedger;
  if (!handoff.sourceArtifact) {
    addError(errors, 'handoff_primary_source_artifact_missing', {
      handoffJson: HANDOFF_JSON_PATH,
      expected: expectedPrimarySourceArtifact,
      actual: handoff.sourceArtifact,
    });
  } else if (handoff.sourceArtifact !== expectedPrimarySourceArtifact) {
    addError(errors, 'handoff_primary_source_artifact_mismatch', {
      handoffJson: HANDOFF_JSON_PATH,
      expected: expectedPrimarySourceArtifact,
      actual: handoff.sourceArtifact,
    });
  }
  const expectedSourceArtifactCount = Object.keys(handoff.sourceArtifacts || {}).length;
  if (handoff.sourceArtifactCount !== expectedSourceArtifactCount) {
    addError(errors, 'handoff_source_artifact_count_mismatch', {
      handoffJson: HANDOFF_JSON_PATH,
      expected: expectedSourceArtifactCount,
      actual: handoff.sourceArtifactCount,
    });
  }
  const expectedSourceTrace = buildExpectedSourceTrace(handoff.sourceArtifacts);
  if (handoff.sourceTraceCount !== expectedSourceTrace.length) {
    addError(errors, 'handoff_source_trace_count_mismatch', {
      handoffJson: HANDOFF_JSON_PATH,
      expected: expectedSourceTrace.length,
      actual: handoff.sourceTraceCount,
    });
  }
  if (JSON.stringify(handoff.sourceTrace || []) !== JSON.stringify(expectedSourceTrace)) {
    addError(errors, 'handoff_source_trace_mismatch', {
      handoffJson: HANDOFF_JSON_PATH,
      expected: expectedSourceTrace,
      actual: handoff.sourceTrace || [],
    });
  }
  if (handoff.sourceTraceBoundary !== HANDOFF_SOURCE_TRACE_BOUNDARY) {
    addError(errors, 'handoff_source_trace_boundary_mismatch', {
      handoffJson: HANDOFF_JSON_PATH,
      expected: HANDOFF_SOURCE_TRACE_BOUNDARY,
      actual: handoff.sourceTraceBoundary,
    });
  }
  validateSourceTraceMarkdown(errors, handoffMarkdown, handoff);
  if (handoff.sourceArtifact) {
    [
      `Primary source artifact: \`${handoff.sourceArtifact}\``,
      `Source artifact count: ${handoff.sourceArtifactCount}`,
    ].forEach((snippet) => {
      if (!handoffMarkdown.includes(snippet)) {
        addError(errors, 'handoff_primary_source_artifact_markdown_mismatch', {
          markdownPath: HANDOFF_MD_PATH,
          missing: snippet,
        });
      }
    });
  }
  compareField(errors, 'handoff.outputs', 'csv', HANDOFF_CSV_PATH, handoff.outputs?.csv);
  compareField(errors, 'handoff.closeoutStatus', 'ok', closeoutStatus.ok, handoff.closeoutStatus?.ok);
  compareField(errors, 'handoff.closeoutStatus', 'goalComplete', closeoutStatus.goalComplete, handoff.closeoutStatus?.goalComplete);

  const expectedSafety = expectedLocalSafetyStatus(localSafety);
  if (JSON.stringify(expectedSafety) !== JSON.stringify(handoff.localSafetyStatus || null)) {
    addError(errors, 'local_safety_status_mismatch', {
      expected: expectedSafety,
      actual: handoff.localSafetyStatus || null,
    });
  }
  validateLocalSafetySourceTraceMarkdown(errors, handoffMarkdown, expectedSafety);
  compareField(
    errors,
    'handoff.ownerPrepReadiness',
    'readyForCloseout',
    closeoutStatus.ownerEvidencePrep?.readyForCloseout === true,
    handoff.ownerPrepReadiness?.readyForCloseout,
  );
  compareField(
    errors,
    'handoff.ownerPrepReadiness',
    'ownerActionNeededCount',
    closeoutStatus.ownerEvidencePrep?.ownerActionNeededCount || 0,
    handoff.ownerPrepReadiness?.ownerActionNeededCount,
  );

  const expectedOwnerActions = closeoutStatus.ownerEvidencePrep?.ownerActionNeeded || [];
  const actualOwnerActions = handoff.ownerPrepReadiness?.ownerActionNeeded || [];
  if (JSON.stringify(expectedOwnerActions) !== JSON.stringify(actualOwnerActions)) {
    addError(errors, 'owner_prep_actions_mismatch', {
      expected: expectedOwnerActions,
      actual: actualOwnerActions,
    });
  }

  const expectedOwnerActionsByGate = closeoutStatus.ownerEvidencePrep?.ownerActionNeededByGate || {};
  if (Object.keys(expectedOwnerActionsByGate).length > 0) {
    const handoffActionsByGate = Object.fromEntries(
      (handoff.ownerActionRows || []).map((row) => [row.gateId, row.blockingOwnerActions || []])
    );
    Object.entries(expectedOwnerActionsByGate).forEach(([gateId, expectedActions]) => {
      if (JSON.stringify(expectedActions) !== JSON.stringify(handoffActionsByGate[gateId] || [])) {
        addError(errors, 'owner_prep_actions_by_gate_mismatch', {
          gateId,
          expected: expectedActions,
          actual: handoffActionsByGate[gateId] || [],
        });
      }
    });
  }

  const expectedGateIds = ownerQueue.map((item) => item.id);
  const actualGateIds = handoff.remainingGateIds || [];
  if (JSON.stringify(expectedGateIds) !== JSON.stringify(actualGateIds)) {
    addError(errors, 'remaining_gate_ids_mismatch', { expected: expectedGateIds, actual: actualGateIds });
  }
  compareField(errors, 'handoff', 'remainingGateCount', expectedGateIds.length, handoff.remainingGateCount);

  compareField(
    errors,
    'handoff',
    'ownerPrepActionNeededByGateSourceArtifact',
    `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate`,
    handoff.ownerPrepActionNeededByGateSourceArtifact,
  );
  if (!handoff.ownerPrepActionNeededByGateBoundary) {
    addError(errors, 'owner_prep_action_needed_by_gate_boundary_missing', {
      handoffJson: HANDOFF_JSON_PATH,
    });
  }
  const expectedOwnerPrepByGate = expectedOwnerPrepActionNeededByGate(closeoutStatus, expectedGateIds);
  if (JSON.stringify(expectedOwnerPrepByGate) !== JSON.stringify(handoff.ownerPrepActionNeededByGate || {})) {
    addError(errors, 'owner_prep_action_needed_by_gate_mismatch', {
      expected: expectedOwnerPrepByGate,
      actual: handoff.ownerPrepActionNeededByGate || {},
    });
  }
  compareField(
    errors,
    'handoff',
    'ownerPrepActionNeededByGateCount',
    Object.keys(expectedOwnerPrepByGate).length,
    handoff.ownerPrepActionNeededByGateCount,
  );

  const expectedFailedSteps = closeoutStatus.failedStepIds || [];
  const actualFailedSteps = handoff.closeoutStatus?.failedStepIds || [];
  if (JSON.stringify(expectedFailedSteps) !== JSON.stringify(actualFailedSteps)) {
    addError(errors, 'failed_step_ids_mismatch', { expected: expectedFailedSteps, actual: actualFailedSteps });
  }

  const expectedCommandSequence = buildExpectedCommandSequence(closeoutStatus);
  if (JSON.stringify(expectedCommandSequence) !== JSON.stringify(handoff.commandSequence || [])) {
    addError(errors, 'command_sequence_mismatch', {
      expected: expectedCommandSequence,
      actual: handoff.commandSequence || [],
    });
  }
  compareField(errors, 'handoff', 'commandSequenceCount', expectedCommandSequence.length, handoff.commandSequenceCount);
  validateHandoffBasisCountMarkdown(errors, handoffMarkdown, handoff);
  validateOperationalAccessPrerequisites(errors, handoff, handoffMarkdown);

  if ((handoff.ownerActionRows || []).length !== ownerQueue.length) {
    addError(errors, 'row_count_mismatch', {
      expected: ownerQueue.length,
      actual: (handoff.ownerActionRows || []).length,
    });
  }

  if (csvRows.length !== ownerQueue.length) {
    addError(errors, 'csv_row_count_mismatch', { expected: ownerQueue.length, actual: csvRows.length });
  }

  ownerQueue.forEach((queueItem, index) => {
    const row = rowsByGateId.get(queueItem.id);
    const csvRow = csvRowsByGateId.get(queueItem.id);
    const gate = gatesById.get(queueItem.id) || queueItem;
    const context = `ownerActionRows.${queueItem.id}`;

    if (!row) {
      addError(errors, 'missing_handoff_row', { gateId: queueItem.id });
      return;
    }
    if (!csvRow) {
      addError(errors, 'missing_csv_row', { gateId: queueItem.id });
      return;
    }

    compareField(errors, context, 'order', index + 1, row.order);
    compareField(errors, context, 'label', queueItem.label, row.label);
    compareField(errors, context, 'track', trackForGate(queueItem.id), row.track);
    compareField(errors, context, 'status', queueItem.status, row.status);
    compareField(errors, context, 'sourceBoundary', queueItem.sourceBoundary, row.sourceBoundary);
    compareField(errors, context, 'currentEvidence', gate.evidence || '', row.currentEvidence);
    compareField(errors, context, 'neededEvidence', gate.neededEvidence || '', row.neededEvidence);
    compareField(errors, context, 'ownerAction', queueItem.ownerAction, row.ownerAction);
    compareField(errors, context, 'ownerPrepCommand', queueItem.ownerPrepCommand || '', row.ownerPrepCommand || '');
    compareField(errors, context, 'nextCommand', queueItem.nextCommand, row.nextCommand);
    compareField(errors, context, 'riskIfSkipped', queueItem.riskIfSkipped, row.riskIfSkipped);

    const expectedBlockingOwnerActions = blockingOwnerActionsForGate(queueItem.id, closeoutStatus);
    if (JSON.stringify(expectedBlockingOwnerActions) !== JSON.stringify(row.blockingOwnerActions || [])) {
      addError(errors, 'blocking_owner_actions_mismatch', {
        gateId: queueItem.id,
        expected: expectedBlockingOwnerActions,
        actual: row.blockingOwnerActions || [],
      });
    }
    compareField(
      errors,
      context,
      'csv.blocking_owner_actions',
      expectedBlockingOwnerActions.join('; '),
      csvRow.blocking_owner_actions || '',
    );

    const expectedDoesNotProve = normalizeList(queueItem.doesNotProve);
    if (JSON.stringify(expectedDoesNotProve) !== JSON.stringify(normalizeList(row.doesNotProve))) {
      addError(errors, 'does_not_prove_mismatch', {
        gateId: queueItem.id,
        expected: expectedDoesNotProve,
        actual: normalizeList(row.doesNotProve),
      });
    }

    const expectedSteps = closeoutStepsForGate(queueItem.id);
    if (JSON.stringify(expectedSteps) !== JSON.stringify(row.closeoutStepIds || [])) {
      addError(errors, 'closeout_step_ids_mismatch', {
        gateId: queueItem.id,
        expected: expectedSteps,
        actual: row.closeoutStepIds || [],
      });
    }
    compareField(errors, context, 'csv.closeout_steps', stepStatusString(queueItem.id, closeoutStatus), csvRow.closeout_steps);
    const expectedFailureDetails = stepFailureDetails(queueItem.id, closeoutStatus);
    if (JSON.stringify(expectedFailureDetails) !== JSON.stringify(row.closeoutFailureDetails || [])) {
      addError(errors, 'closeout_failure_details_mismatch', {
        gateId: queueItem.id,
        expected: expectedFailureDetails,
        actual: row.closeoutFailureDetails || [],
      });
    }
    compareField(errors, context, 'csv.closeout_failure_details', expectedFailureDetails.join('; '), csvRow.closeout_failure_details);

    compareField(errors, `csv.${queueItem.id}`, 'order', String(index + 1), csvRow.order);
    compareField(errors, `csv.${queueItem.id}`, 'track', row.track, csvRow.track);
    compareField(errors, `csv.${queueItem.id}`, 'label', row.label, csvRow.label);
    compareField(errors, `csv.${queueItem.id}`, 'status', row.status, csvRow.status);
    compareField(errors, `csv.${queueItem.id}`, 'owner_action', row.ownerAction, csvRow.owner_action);
    compareField(errors, `csv.${queueItem.id}`, 'owner_prep_command', row.ownerPrepCommand || '', csvRow.owner_prep_command || '');
    compareField(errors, `csv.${queueItem.id}`, 'blocking_owner_actions', row.blockingOwnerActions.join('; '), csvRow.blocking_owner_actions || '');
    compareField(errors, `csv.${queueItem.id}`, 'next_command', row.nextCommand, csvRow.next_command);
    compareField(errors, `csv.${queueItem.id}`, 'raw_evidence_policy', row.rawEvidencePolicy, csvRow.raw_evidence_policy);
    compareField(errors, `csv.${queueItem.id}`, 'repo_does_not_do', row.repoDoesNotDo, csvRow.repo_does_not_do);
  });

  const result = {
    ok: errors.length === 0,
    sourceLedger: LEDGER_PATH,
    sourceCloseoutStatus: CLOSEOUT_STATUS_PATH,
    handoffJson: HANDOFF_JSON_PATH,
    handoffCsv: HANDOFF_CSV_PATH,
    ownerActionQueueCount: ownerQueue.length,
    handoffRowCount: (handoff.ownerActionRows || []).length,
    csvRowCount: csvRows.length,
    remainingGateIds: expectedGateIds,
    closeoutFailedStepIds: expectedFailedSteps,
    ownerPrepActionNeededCount: expectedOwnerActions.length,
    ownerPrepActionNeededByGateCount: Object.keys(expectedOwnerPrepByGate).length,
    sourceTraceCount: handoff.sourceTraceCount,
    errorCount: errors.length,
    errors,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main();
