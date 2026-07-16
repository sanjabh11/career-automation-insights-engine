#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const REMEDIATION_LEDGER_PATH = 'docs/commercialization/remediation-external-gates-latest.json';
const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const LIVE_CLOSEOUT_READINESS_PATH = 'docs/commercialization/live-closeout-readiness-latest.json';
const OWNER_EVIDENCE_LOCAL_SAFETY_PATH = 'docs/commercialization/owner-evidence-local-safety-latest.json';
const OWNER_EVIDENCE_LOCAL_SAFETY_SOURCE_TRACE_BOUNDARY =
  'This local-safety source trace identifies owner-evidence-local-safety artifact anchors for git ignore, tracking, staging, error, and boundary counts. It does not read owner-held evidence file contents, load secrets, run live checks, or upgrade launch readiness.';
const HANDOFF_SOURCE_TRACE_BOUNDARY =
  'This handoff source trace maps each owner-evidence handoff provenance row to the sourceArtifacts key used by the generated owner packet. It does not execute owner commands, load credentials, collect owner-held evidence, read local evidence values, run live checks, or upgrade launch readiness.';
const OUTPUT_JSON = 'docs/commercialization/owner-evidence-handoff-latest.json';
const OUTPUT_MD = 'docs/commercialization/owner-evidence-handoff-latest.md';
const OUTPUT_CSV = 'docs/commercialization/owner-evidence-handoff-latest.csv';
const LIVE_CLOSEOUT_TARGET_PROJECT_REF = 'kvunnankqgfokeufvsrv';
const OPERATIONAL_ACCESS_RECOVERY_COMMANDS = [
  'gh secret list --repo sanjabh11/career-automation-insights-engine',
  'supabase login',
  'supabase projects list --output json',
  `supabase functions list --project-ref ${LIVE_CLOSEOUT_TARGET_PROJECT_REF}`,
  'npm run generate:live-closeout-readiness',
  'npm run verify:live-closeout-readiness',
];

function hasFlag(name) {
  return process.argv.includes(name);
}

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

function writeText(relativePath, source) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, source);
}

function csvCell(value) {
  const source = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return `"${source.replace(/"/g, '""')}"`;
}

function markdownCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
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

function rawEvidencePolicyForGate(gateId) {
  if (gateId === 'manual_wcag_evidence') {
    return 'Keep reviewer notes, screenshots, recordings, reviewer identity, assistive-technology transcripts, evaluation-tool output, issue logs, sample archives, artifact hash source maps, and owner-held archive records outside git; commit only redacted hashes/status metadata and ownerEvidenceArchive policy metadata.';
  }
  if (gateId === 'real_stripe_test_checkout' || gateId === 'live_mrr_gt_zero') {
    return 'Keep Stripe keys, customer IDs, invoice IDs, checkout URLs, Checkout Session payloads, subscription exports, invoice exports, dashboard screenshots, function invocation metadata, and raw exports outside git; commit only redacted proof status, hashes, and ownerEvidenceArchive policy metadata.';
  }
  if (gateId === 'production_calibration_run' || gateId === 'authenticated_live_artifact_e2e') {
    return 'Keep Supabase secrets, synthetic-user credentials, logs with user identifiers, and service-role data outside git; commit only redacted verifier artifacts.';
  }
  if (gateId === 'three_committed_partners') {
    return 'Keep partner names, contracts, raw quotes, private notes, contact details, testimonial integrity review notes, material-connection reviews, incentive reviews, archive records, and hash salts outside git; commit only permissioned redacted hashes, caveats, and ownerEvidenceArchive policy metadata.';
  }
  if (gateId === 'documented_outcomes') {
    return 'Keep partner names, contracts, raw quotes, private notes, contact details, testimonial integrity review notes, material-connection reviews, incentive reviews, typicality substantiation, archive records, and hash salts outside git; commit only permissioned redacted hashes, caveats, and ownerEvidenceArchive policy metadata.';
  }
  return 'Keep owner-held raw evidence outside git; commit only redacted hashes, caveats, and policy metadata.';
}

function repoDoesNotDoForGate(gateId) {
  if (gateId === 'manual_wcag_evidence') return 'The repo cannot perform the manual WCAG-EM review or certify conformance.';
  if (gateId === 'real_stripe_test_checkout') return 'The repo cannot prove a real Stripe test checkout without owner-held test-mode credentials.';
  if (gateId === 'production_calibration_run') return 'The repo cannot prove production calibration unless the owner target has migrations, deployed functions, logs, and expert labels.';
  if (gateId === 'authenticated_live_artifact_e2e') return 'The repo cannot prove live authenticated artifact persistence without owner-held target credentials and a synthetic user.';
  if (gateId === 'live_mrr_gt_zero') return 'The repo cannot prove revenue before a real paid subscription exists and a live-mode read-only Stripe key is supplied.';
  if (gateId === 'three_committed_partners') return 'The repo cannot invent partner commitments or permission to cite them.';
  if (gateId === 'documented_outcomes') return 'The repo cannot invent measured outcomes, quotes, or permission to cite them.';
  return 'The repo cannot replace owner-held external proof.';
}

function stepStatusMap(closeoutStatus) {
  return new Map((closeoutStatus.steps || []).map((step) => [step.id, step.status]));
}

function stepDetailMap(closeoutStatus) {
  return new Map((closeoutStatus.steps || []).map((step) => {
    const details = [
      ...(step.summary?.errorExcerpts || []),
      ...(step.stderrTail || []).map((line) => `stderr: ${line}`),
    ];
    return [step.id, details];
  }));
}

function buildRows(ledger, closeoutStatus) {
  const gatesById = new Map((ledger.gates || []).map((gate) => [gate.id, gate]));
  const statuses = stepStatusMap(closeoutStatus);
  const detailsByStepId = stepDetailMap(closeoutStatus);

  return (ledger.ownerActionQueue || []).map((item, index) => {
    const gate = gatesById.get(item.id) || item;
    const closeoutStepIds = closeoutStepsForGate(item.id);
    const closeoutStepStatuses = closeoutStepIds.map((stepId) => ({
      stepId,
      status: statuses.get(stepId) || 'not_run',
      failureDetails: detailsByStepId.get(stepId) || [],
    }));
    return {
      order: index + 1,
      gateId: item.id,
      label: item.label,
      track: trackForGate(item.id),
      status: item.status,
      sourceBoundary: item.sourceBoundary,
      currentEvidence: gate.evidence || '',
      neededEvidence: gate.neededEvidence || '',
      ownerAction: item.ownerAction,
      ownerPrepCommand: item.ownerPrepCommand || '',
      nextCommand: item.nextCommand,
      closeoutStepIds,
      closeoutStepStatuses,
      closeoutFailureDetails: closeoutStepStatuses
        .filter((step) => step.failureDetails.length > 0)
        .map((step) => `${step.stepId}: ${step.failureDetails.join(' | ')}`),
      blockingOwnerActions: blockingOwnerActionsForGate(item.id, closeoutStatus),
      riskIfSkipped: item.riskIfSkipped,
      doesNotProve: item.doesNotProve || [],
      rawEvidencePolicy: rawEvidencePolicyForGate(item.id),
      repoDoesNotDo: repoDoesNotDoForGate(item.id),
    };
  });
}

function buildCsv(rows) {
  const header = [
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
  const body = rows.map((row) => [
    row.order,
    row.track,
    row.gateId,
    row.label,
    row.status,
    row.sourceBoundary,
    row.currentEvidence,
    row.neededEvidence,
    row.ownerAction,
    row.ownerPrepCommand,
    row.blockingOwnerActions.join('; '),
    row.nextCommand,
    row.closeoutStepStatuses.map((item) => `${item.stepId}:${item.status}`).join('; '),
    row.closeoutFailureDetails.join('; '),
    row.riskIfSkipped,
    row.doesNotProve.join('; '),
    row.rawEvidencePolicy,
    row.repoDoesNotDo,
  ]);
  return [header, ...body].map((row) => row.map(csvCell).join(',')).join('\n');
}

function buildOperationalAccessPrerequisites(liveCloseoutReadiness) {
  if (!liveCloseoutReadiness) return [];
  const status = liveCloseoutReadiness.ok === true ? 'passed' : 'owner_access_required';
  return [
    {
      id: 'live_closeout_supabase_access',
      label: 'Live closeout Supabase project/functions access',
      track: 'live-runtime',
      status,
      sourceArtifact: LIVE_CLOSEOUT_READINESS_PATH,
      ownerAction:
        status === 'passed'
          ? 'Keep live closeout access proof current before any production deployment, ingest, or parser closeout claim.'
          : 'Use a Supabase account that can manage the target project and access the functions API, then rerun the strict live closeout readiness verifier before claiming O*NET ingest or parse-resume deployment completion.',
      ownerPrepCommand: 'npm run generate:live-closeout-readiness',
      nextCommand: 'npm run verify:live-closeout-readiness',
      accessRecoveryCommands: OPERATIONAL_ACCESS_RECOVERY_COMMANDS,
      accessRecoveryCommandCount: OPERATIONAL_ACCESS_RECOVERY_COMMANDS.length,
      blockingCheckIds: liveCloseoutReadiness.failedCheckIds || [],
      acceptedWhen:
        'The strict live closeout readiness verifier exits 0 without --allow-incomplete, after the target Supabase project and functions API are visible to the current owner-approved account.',
      evidenceBoundary: liveCloseoutReadiness.evidenceBoundary || '',
      doesNotProve: liveCloseoutReadiness.doesNotProve || [],
      rawEvidencePolicy:
        'Keep Supabase access tokens, service-role data, project-management credentials, logs with user identifiers, and deployment approvals outside git; commit only redacted status artifacts and command evidence.',
      repoDoesNotDo:
        'The repo cannot grant Supabase project access, run production deployment closeout, ingest live O*NET data, or prove parser deployment without owner-approved access and execution.',
    },
  ];
}

function buildLocalSafetySourceTrace(localSafety) {
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

function buildLocalSafetyStatus(localSafety) {
  const sourceTrace = buildLocalSafetySourceTrace(localSafety);
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

function buildSourceTrace(sourceArtifacts) {
  return Object.entries(sourceArtifacts).map(([key, artifactPath]) => ({
    key,
    artifactPath,
    sourceArtifact: `${OUTPUT_JSON}#sourceArtifacts.${key}`,
  }));
}

function buildOwnerPrepActionNeededByGate(closeoutStatus, gateIds) {
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

function buildMarkdown(packet) {
  const rows = packet.ownerActionRows
    .map((row) => {
      const failureDetail = row.closeoutFailureDetails.length > 0 ? row.closeoutFailureDetails.join('<br>') : 'none';
      const ownerPrepCommand = row.ownerPrepCommand ? `\`${markdownCell(row.ownerPrepCommand)}\`` : 'n/a';
      const blockerDetail = row.blockingOwnerActions.length > 0 ? row.blockingOwnerActions.join('<br>') : 'none';
      return `| ${row.order} | ${markdownCell(row.track)} | ${markdownCell(row.gateId)} | ${markdownCell(row.status)} | ${markdownCell(row.ownerAction)} | ${ownerPrepCommand} | ${markdownCell(blockerDetail)} | \`${markdownCell(row.nextCommand)}\` | ${markdownCell(row.closeoutStepStatuses.map((item) => `${item.stepId}:${item.status}`).join('; '))} | ${markdownCell(failureDetail)} |`;
    })
    .join('\n');
  const commandRows = packet.commandSequence
    .map((command) => `- \`${command}\``)
    .join('\n');
  const operationalRows = packet.operationalAccessPrerequisites
    .map((item) => {
      const blockingChecks = item.blockingCheckIds.length ? item.blockingCheckIds.join('; ') : 'none';
      return `| ${markdownCell(item.id)} | ${markdownCell(item.status)} | ${markdownCell(item.ownerAction)} | \`${markdownCell(item.ownerPrepCommand)}\` | \`${markdownCell(item.nextCommand)}\` | ${markdownCell(blockingChecks)} |`;
    })
    .join('\n');
  const operationalCommandRows = packet.operationalAccessPrerequisites
    .flatMap((item) => item.accessRecoveryCommands || [])
    .map((command) => `- \`${markdownCell(command)}\``)
    .join('\n');
  const ownerPrepByGateRows = Object.values(packet.ownerPrepActionNeededByGate)
    .map((item) => {
      const actions = item.ownerActionNeeded.length ? item.ownerActionNeeded.join('<br>') : 'none';
      return `| ${markdownCell(item.gateId)} | ${item.ownerActionNeededCount} | ${markdownCell(actions)} | \`${markdownCell(item.sourceArtifact)}\` |`;
    })
    .join('\n');
  const localSafetySourceTraceRows =
    packet.localSafetyStatus.sourceTrace
      ?.map((row) => `| ${markdownCell(row.key)} | ${markdownCell(row.value)} | ${markdownCell(row.sourceArtifact)} |`)
      .join('\n') || '| none | n/a | n/a |';
  const sourceTraceRows =
    packet.sourceTrace
      ?.map((row) => `| ${markdownCell(row.key)} | \`${markdownCell(row.artifactPath)}\` | \`${markdownCell(row.sourceArtifact)}\` |`)
      .join('\n') || '| none | `n/a` | `n/a` |';

  return `# Owner Evidence Handoff Packet

Generated: ${packet.generatedAt}

Goal complete: \`${packet.goalComplete}\`

Owner action queue count: ${packet.ownerActionQueueCount}

Remaining gate count: ${packet.remainingGateCount}

Owner action row count: ${packet.ownerActionRowCount}

Owner prep by-gate map count: ${packet.ownerPrepActionNeededByGateCount}

Command sequence count: ${packet.commandSequenceCount}

Primary source artifact: \`${packet.sourceArtifact}\`

Source artifact count: ${packet.sourceArtifactCount}

Source trace rows: ${packet.sourceTraceCount}

Closeout status: \`${packet.closeoutStatus.ok ? 'ok' : 'incomplete'}\`

This generated handoff consolidates the canonical remediation owner-action queue with the latest owner-evidence closeout status. It is an execution aid, not launch proof.

## Evidence Boundary

${packet.evidenceBoundary}

## Source Trace

Trace boundary: ${packet.sourceTraceBoundary}

| Key | Artifact | Source anchor |
| --- | --- | --- |
${sourceTraceRows}

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

## Owner Prep Actions By Gate

Source artifact: \`${packet.ownerPrepActionNeededByGateSourceArtifact}\`

Boundary: ${packet.ownerPrepActionNeededByGateBoundary}

| Gate | Owner prep action count | Blocking owner-prep actions | Source |
| --- | ---: | --- | --- |
${ownerPrepByGateRows}

## Owner Action Queue

| # | Track | Gate | Status | Owner action | Owner prep command | Blocking owner-prep actions | Next command | Closeout steps | Redacted failure detail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## Operational Access Prerequisites

These rows are not launch-evidence gates. They are owner access prerequisites for live deployment closeout claims.

| ID | Status | Owner action | Owner prep command | Strict verifier | Blocking checks |
| --- | --- | --- | --- | --- | --- |
${operationalRows || '| none | n/a | n/a | n/a | n/a | n/a |'}

### Operational Access Command Checklist

These commands are owner-run access probes and local status refreshes. They must not be treated as deploy, ingest, payment, or launch proof.

${operationalCommandRows || '- none'}

## Command Sequence

${commandRows}

## Raw Evidence Policy

- Keep Stripe keys, live customer/payment data, Checkout Session payloads, subscription exports, invoice exports, dashboard screenshots, Supabase secrets, synthetic-user credentials, partner identities, contracts, raw quotes, testimonial integrity review notes, material-connection reviews, incentive reviews, typicality substantiation, owner-held archive records, reviewer notes, screenshots, transcripts, evaluation-tool output, sample archives, artifact hash source maps, and hash salts outside git.
- Commit only redacted metadata, salted hashes, proof status, and caveats through the existing local ignored intake path and tracked latest artifacts.
- Run \`npm run verify:owner-evidence-local-safety\` before staging refreshed evidence artifacts; it checks git ignore/tracking/staging policy without reading local owner evidence values.
- Re-run \`npm run verify:commercial\` only after local redacted metadata has been refreshed.

## Source Artifacts

- Primary: ${packet.sourceArtifact}
- ${packet.sourceArtifacts.remediationLedger}
- ${packet.sourceArtifacts.closeoutStatus}
- ${packet.sourceArtifacts.liveCloseoutReadiness}
- ${packet.sourceArtifacts.ownerEvidenceLocalSafety}
- ${packet.outputs.csv}
`;
}

function buildPacket() {
  const ledger = readJson(REMEDIATION_LEDGER_PATH);
  const closeoutStatus = readJson(CLOSEOUT_STATUS_PATH);
  const liveCloseoutReadiness = readOptionalJson(LIVE_CLOSEOUT_READINESS_PATH);
  const localSafety = readOptionalJson(OWNER_EVIDENCE_LOCAL_SAFETY_PATH);
  const ownerActionRows = buildRows(ledger, closeoutStatus);
  const operationalAccessPrerequisites = buildOperationalAccessPrerequisites(liveCloseoutReadiness);
  const localSafetyStatus = buildLocalSafetyStatus(localSafety);
  const remainingGateIds = ownerActionRows.map((row) => row.gateId);
  const ownerPrepActionNeededByGate = buildOwnerPrepActionNeededByGate(closeoutStatus, remainingGateIds);
  const sourceArtifacts = {
    remediationLedger: REMEDIATION_LEDGER_PATH,
    closeoutStatus: CLOSEOUT_STATUS_PATH,
    liveCloseoutReadiness: LIVE_CLOSEOUT_READINESS_PATH,
    ownerEvidenceLocalSafety: OWNER_EVIDENCE_LOCAL_SAFETY_PATH,
  };
  const sourceTrace = buildSourceTrace(sourceArtifacts);

  if (ownerActionRows.length === 0) {
    throw new Error('Owner evidence handoff requires a non-empty ownerActionQueue.');
  }

  const commandSequence = [
    closeoutStatus.nextCommands?.writeLocalScaffold || 'npm run prepare:owner-evidence -- --write',
    closeoutStatus.nextCommands?.verifyLocalSafety || 'npm run verify:owner-evidence-local-safety',
    closeoutStatus.nextCommands?.generateLiveProofRunPacket || 'npm run generate:live-proof-run-packet',
    closeoutStatus.nextCommands?.loadEnv,
    ...(closeoutStatus.nextCommands?.collectLiveProofs || []),
    closeoutStatus.nextCommands?.composeLiveGateEvidence,
    closeoutStatus.nextCommands?.validateLiveGateEvidence,
    closeoutStatus.nextCommands?.composeCompleteLiveGateEvidence,
    closeoutStatus.nextCommands?.validateCompleteLiveGateEvidence,
    closeoutStatus.nextCommands?.generateCommercialEvidenceIntakePacket || 'npm run generate:commercial-evidence-intake-packet',
    closeoutStatus.nextCommands?.hashCommercialProofArtifacts,
    closeoutStatus.nextCommands?.composeCommercialRecords ||
      'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
    closeoutStatus.nextCommands?.validateCommercialEvidenceRecords,
    closeoutStatus.nextCommands?.generateManualWcagReviewPacket || 'npm run generate:manual-wcag-review-packet',
    closeoutStatus.nextCommands?.hashManualWcagProofArtifacts,
    closeoutStatus.nextCommands?.validateManualWcagEvidence,
    closeoutStatus.nextCommands?.composeAndCloseout,
    'npm run verify:commercial',
  ].filter(Boolean);

  return {
    schemaVersion: '2026-06-04.apo-owner-evidence-handoff.v1',
    generatedAt: new Date().toISOString(),
    ok: true,
    goalComplete: ledger.goalComplete === true && closeoutStatus.goalComplete === true,
    ownerActionQueueCount: ownerActionRows.length,
    remainingGateIds,
    remainingGateCount: remainingGateIds.length,
    evidenceBoundary:
      'This handoff is a repo-generated execution aid. It does not prove live checkout, live MRR, production calibration, authenticated live artifact persistence, committed partners, documented outcomes, manual WCAG conformance, legal compliance, or procurement approval.',
    sourceArtifact: sourceArtifacts.remediationLedger,
    sourceArtifacts,
    sourceArtifactCount: Object.keys(sourceArtifacts).length,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: HANDOFF_SOURCE_TRACE_BOUNDARY,
    localSafetyStatus,
    closeoutStatus: {
      ok: closeoutStatus.ok,
      goalComplete: closeoutStatus.goalComplete,
      failedStepIds: closeoutStatus.failedStepIds || [],
    },
    ownerPrepReadiness: {
      readyForCloseout: closeoutStatus.ownerEvidencePrep?.readyForCloseout === true,
      ownerActionNeededCount: closeoutStatus.ownerEvidencePrep?.ownerActionNeededCount || 0,
      ownerActionNeeded: closeoutStatus.ownerEvidencePrep?.ownerActionNeeded || [],
    },
    ownerPrepActionNeededByGateSourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate`,
    ownerPrepActionNeededByGateBoundary:
      'This per-gate summary mirrors ownerEvidencePrep.ownerActionNeededByGate for remaining gates only. It is an owner-execution aid and does not expose owner-held evidence values or prove any external launch gate.',
    ownerPrepActionNeededByGate,
    ownerPrepActionNeededByGateCount: Object.keys(ownerPrepActionNeededByGate).length,
    commandSequence,
    commandSequenceCount: commandSequence.length,
    ownerActionRows,
    ownerActionRowCount: ownerActionRows.length,
    operationalAccessPrerequisiteCount: operationalAccessPrerequisites.length,
    operationalAccessPrerequisites,
    outputs: {
      json: OUTPUT_JSON,
      markdown: OUTPUT_MD,
      csv: OUTPUT_CSV,
    },
  };
}

function main() {
  const shouldWrite = hasFlag('--write');
  const packet = buildPacket();
  const csv = buildCsv(packet.ownerActionRows);
  const markdown = buildMarkdown(packet);

  if (shouldWrite) {
    writeText(OUTPUT_JSON, `${JSON.stringify(packet, null, 2)}\n`);
    writeText(OUTPUT_MD, markdown);
    writeText(OUTPUT_CSV, `${csv}\n`);
  }

  console.log(JSON.stringify({
    ok: packet.ok,
    goalComplete: packet.goalComplete,
    ownerActionQueueCount: packet.ownerActionQueueCount,
    remainingGateCount: packet.remainingGateCount,
    ownerActionRowCount: packet.ownerActionRowCount,
    commandSequenceCount: packet.commandSequenceCount,
    operationalAccessPrerequisiteCount: packet.operationalAccessPrerequisiteCount,
    ownerPrepActionNeededCount: packet.ownerPrepReadiness.ownerActionNeededCount,
    ownerPrepActionNeededByGateCount: packet.ownerPrepActionNeededByGateCount,
    sourceArtifact: packet.sourceArtifact,
    sourceArtifactCount: packet.sourceArtifactCount,
    sourceTraceCount: packet.sourceTraceCount,
    localSafetyStatus: packet.localSafetyStatus.status,
    remainingGateIds: packet.remainingGateIds,
    closeoutFailedStepIds: packet.closeoutStatus.failedStepIds,
    wrote: shouldWrite ? [OUTPUT_JSON, OUTPUT_MD, OUTPUT_CSV] : [],
  }, null, 2));
}

main();
