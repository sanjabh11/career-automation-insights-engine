#!/usr/bin/env node

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

const DEFAULT_STATUS_JSON = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const DEFAULT_STATUS_MD = 'docs/commercialization/owner-evidence-closeout-status-latest.md';
const MAX_ERROR_EXCERPTS = 8;
const MAX_ERROR_EXCERPT_LENGTH = 280;

const REDACTION_PATTERNS = [
  { pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, replacement: '<redacted-email>' },
  { pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{8,}\b/g, replacement: '<redacted-stripe-key>' },
  { pattern: /\bwhsec_[A-Za-z0-9]{8,}\b/g, replacement: '<redacted-webhook-secret>' },
  { pattern: /\bAIza[A-Za-z0-9_-]{20,}\b/g, replacement: '<redacted-google-api-key>' },
  { pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, replacement: '<redacted-jwt>' },
  { pattern: /\+?\d[\d().\-\s]{8,}\d/g, replacement: '<redacted-phone-like-number>' },
];

function hasFlag(name) {
  return args.includes(name);
}

function readFlagValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function parseJsonOutput(stdout) {
  const trimmed = String(stdout || '').trim();
  if (!trimmed) return null;

  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first < 0 || last < first) return null;

  try {
    return JSON.parse(trimmed.slice(first, last + 1));
  } catch {
    return null;
  }
}

function commandString(commandArgs) {
  return ['node', ...commandArgs].map((part) => (/\s/.test(part) ? JSON.stringify(part) : part)).join(' ');
}

function writeText(relativePath, source) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, source);
}

function escapeMarkdownCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

function compactSummary(summary) {
  if (!summary || summary.parsed === false) return 'No machine-readable JSON summary was emitted.';
  return JSON.stringify(summary);
}

function redactSensitiveText(value) {
  let source = String(value ?? '');
  REDACTION_PATTERNS.forEach(({ pattern, replacement }) => {
    source = source.replace(pattern, replacement);
  });
  if (source.length > MAX_ERROR_EXCERPT_LENGTH) {
    return `${source.slice(0, MAX_ERROR_EXCERPT_LENGTH - 3)}...`;
  }
  return source;
}

function safeErrorExcerpts(value, maxItems = MAX_ERROR_EXCERPTS) {
  if (!Array.isArray(value) || value.length === 0) return [];
  const excerpts = value
    .map((item) => redactSensitiveText(typeof item === 'string' ? item : JSON.stringify(item)))
    .filter(Boolean)
    .slice(0, maxItems);
  if (value.length > maxItems) {
    excerpts.push(`${value.length - maxItems} additional error(s) omitted from this redacted summary`);
  }
  return excerpts;
}

function prepInputDetail(status, countKey) {
  const details = [`placeholderCount=${status?.placeholderCount ?? 'n/a'}`];
  const counts = status?.[countKey];
  if (counts) {
    for (const key of [
      'requiredCheckpointCount',
      'checkpointResultCount',
      'requiredRouteCount',
      'routeReviewedCount',
      'requiredCompleteProcessCount',
      'completeProcessReviewedCount',
      'requiredAccessibilitySupportBaselineCount',
      'accessibilitySupportBaselineCount',
      'requiredOfficialReferenceCount',
      'officialReferenceCount',
      'designPartnerCommitmentCount',
      'documentedOutcomeCount',
    ]) {
      if (counts[key] !== undefined && counts[key] !== null) details.push(`${key}=${counts[key]}`);
    }
  }
  return details.join('; ');
}

function envFilePrepInputDetail(envFile) {
  if (!envFile) return 'n/a';
  const blank = envFile.blankOrPlaceholderExpectedKeys || envFile.blankOrPlaceholderKeys || [];
  return [
    `keyNamesRedacted=${envFile.keyNamesRedacted === true}`,
    `expectedKeyCount=${envFile.expectedKeyCount ?? 'n/a'}`,
    `presentExpectedKeyCount=${envFile.presentExpectedKeyCount ?? 'n/a'}`,
    `blankOrPlaceholderExpectedKeys=${blank.length > 0 ? blank.join(', ') : 'none'}`,
    `extraKeyCount=${envFile.extraKeyCount ?? 'n/a'}`,
  ].join('; ');
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

function liveReadinessIdForGate(gateId) {
  const mapping = {
    real_stripe_test_checkout: 'stripe_test_checkout',
    production_calibration_run: 'production_calibration',
    authenticated_live_artifact_e2e: 'authenticated_live_artifact_e2e',
    live_mrr_gt_zero: 'live_mrr_gt_zero',
  };
  return mapping[gateId] || null;
}

function ownerPrepReadinessForGate(gateId, ownerEvidencePrep) {
  const blockingOwnerActions = ownerEvidencePrep?.ownerActionNeededByGate?.[gateId] || [];
  const base = {
    blockingOwnerActionCount: blockingOwnerActions.length,
    blockingOwnerActions,
  };
  const liveReadinessId = liveReadinessIdForGate(gateId);
  if (liveReadinessId) {
    const liveProofReadiness = (ownerEvidencePrep?.liveProofReadiness || []).find((item) => item.id === liveReadinessId);
    return {
      ...base,
      kind: 'live_proof_readiness',
      liveReadinessId,
      liveProofReadiness: liveProofReadiness
        ? {
            ready: liveProofReadiness.ready,
            envFileCompleteButNotLoaded: liveProofReadiness.envFileCompleteButNotLoaded,
            requiredGroupCount: liveProofReadiness.requiredGroupCount,
            presentGroupCount: liveProofReadiness.presentGroupCount,
            missingGroupCount: liveProofReadiness.missingGroupCount,
            blankOrPlaceholderEnvFileCount: liveProofReadiness.blankOrPlaceholderEnvFileCount,
            invalidKeyModeCount: liveProofReadiness.invalidKeyModeCount,
            loadFromEnvFileCount: liveProofReadiness.loadFromEnvFileCount,
            missingGroups: liveProofReadiness.missingGroups || [],
            invalidKeyModeGroups: liveProofReadiness.invalidKeyModeGroups || [],
            stripeKeyModeRequirement: liveProofReadiness.stripeKeyModeRequirement || null,
          }
        : null,
    };
  }

  if (gateId === 'manual_wcag_evidence') {
    const manualWcagEvidence = ownerEvidencePrep?.manualWcagEvidence || null;
    return {
      ...base,
      kind: 'manual_wcag_evidence',
      manualWcagEvidence: manualWcagEvidence
        ? {
            path: manualWcagEvidence.path,
            exists: manualWcagEvidence.exists,
            validJson: manualWcagEvidence.validJson,
            placeholderCount: manualWcagEvidence.placeholderCount,
            manualWcagEvidenceCounts: manualWcagEvidence.manualWcagEvidenceCounts || null,
          }
        : null,
    };
  }

  if (gateId === 'three_committed_partners' || gateId === 'documented_outcomes') {
    const commercialIntake = ownerEvidencePrep?.commercialIntake || null;
    return {
      ...base,
      kind: 'commercial_evidence_intake',
      commercialIntake: commercialIntake
        ? {
            path: commercialIntake.path,
            exists: commercialIntake.exists,
            validJson: commercialIntake.validJson,
            placeholderCount: commercialIntake.placeholderCount,
            commercialEvidenceIntakeCounts: commercialIntake.commercialEvidenceIntakeCounts || null,
          }
        : null,
    };
  }

  return {
    ...base,
    kind: 'generic_owner_prep',
  };
}

function stepFailureDetails(step) {
  return [
    ...(step?.summary?.errorExcerpts || []),
    ...(step?.stderrTail || []).map((line) => `stderr: ${line}`),
  ];
}

function buildOwnerGateCloseoutSummary(remediationSummary, ownerEvidencePrep, steps) {
  const gates = Array.isArray(remediationSummary?.gates) ? remediationSummary.gates : [];
  const gateById = new Map(gates.map((gate) => [gate.id, gate]));
  const ownerActionQueue = Array.isArray(remediationSummary?.ownerActionQueue) ? remediationSummary.ownerActionQueue : [];
  const stepById = new Map((steps || []).map((step) => [step.id, step]));
  const rows = ownerActionQueue.length > 0
    ? ownerActionQueue
    : gates.filter((gate) => !String(gate.status || '').startsWith('locally_proven'));

  return rows.map((item) => {
    const gate = gateById.get(item.id) || item;
    const closeoutStepStatuses = closeoutStepsForGate(item.id).map((stepId) => {
      const step = stepById.get(stepId);
      return {
        stepId,
        status: step?.status || 'not_run',
        failureDetails: stepFailureDetails(step),
      };
    });
    return {
      gateId: item.id,
      label: item.label || gate.label || item.id,
      status: item.status || gate.status || 'unknown',
      sourceBoundary: item.sourceBoundary || gate.sourceBoundary || 'owner-held proof gate',
      currentEvidence: gate.evidence || '',
      neededEvidence: gate.neededEvidence || '',
      ownerAction: item.ownerAction || gate.ownerAction || gate.neededEvidence || '',
      ownerPrepCommand: item.ownerPrepCommand || gate.ownerPrepCommand || '',
      nextCommand: item.nextCommand || gate.nextCommand || '',
      riskIfSkipped: item.riskIfSkipped || gate.riskIfSkipped || '',
      doesNotProve: item.doesNotProve || gate.doesNotProve || [],
      ownerPrepReadiness: ownerPrepReadinessForGate(item.id, ownerEvidencePrep),
      closeoutStepStatuses,
    };
  });
}

function compactRemediationStepSummary(summary) {
  if (!summary) return summary;
  const ownerActionQueue = Array.isArray(summary.ownerActionQueue) ? summary.ownerActionQueue : [];
  const gates = Array.isArray(summary.gates) ? summary.gates : [];
  const remainingManualEvidence = Array.isArray(summary.remainingManualEvidence) ? summary.remainingManualEvidence : [];
  return {
    ok: summary.ok,
    goalComplete: summary.goalComplete,
    acceptedLiveGateIds: summary.acceptedLiveGateIds || [],
    partnerGateSatisfied: summary.partnerGateSatisfied,
    outcomeGateSatisfied: summary.outcomeGateSatisfied,
    manualWcagGateSatisfied: summary.manualWcagGateSatisfied,
    blockedGateIds: summary.blockedGateIds || [],
    ownerActionQueueCount: summary.ownerActionQueueCount || ownerActionQueue.length,
    ownerActionGateIds: ownerActionQueue.map((item) => item.id),
    gateCount: gates.length,
    remainingManualEvidenceCount: remainingManualEvidence.length,
    wrote: summary.wrote || null,
    errorExcerpts: summary.errorExcerpts || [],
  };
}

function compactResultSteps(steps) {
  return steps.map((step) => {
    if (step.id !== 'verify-remediation-gates') return step;
    return {
      ...step,
      summary: compactRemediationStepSummary(step.summary),
    };
  });
}

function compactOwnerPrepReadiness(detail) {
  if (!detail) return 'n/a';
  if (detail.kind === 'live_proof_readiness') {
    const readiness = detail.liveProofReadiness;
    if (!readiness) return `liveReadinessId=${detail.liveReadinessId}; blockingOwnerActionCount=${detail.blockingOwnerActionCount}; missing readiness item`;
    const stripeMode = readiness.stripeKeyModeRequirement?.requiredMode
      ? `; requiredStripeKeyMode=${readiness.stripeKeyModeRequirement.requiredMode}; resolvedStripeKeyMode=${readiness.stripeKeyModeRequirement.resolvedMode}`
      : '';
    return `liveReadinessId=${detail.liveReadinessId}; ready=${readiness.ready}; requiredGroupCount=${readiness.requiredGroupCount}; presentGroupCount=${readiness.presentGroupCount}; missingGroupCount=${readiness.missingGroupCount}; loadFromEnvFileCount=${readiness.loadFromEnvFileCount}; invalidKeyModeCount=${readiness.invalidKeyModeCount}${stripeMode}; blockingOwnerActionCount=${detail.blockingOwnerActionCount}`;
  }
  if (detail.kind === 'manual_wcag_evidence') {
    const evidence = detail.manualWcagEvidence;
    const counts = evidence?.manualWcagEvidenceCounts || {};
    return `path=${evidence?.path || 'n/a'}; exists=${evidence?.exists === true}; requiredCheckpointCount=${counts.requiredCheckpointCount ?? 'n/a'}; requiredRouteCount=${counts.requiredRouteCount ?? 'n/a'}; requiredCompleteProcessCount=${counts.requiredCompleteProcessCount ?? 'n/a'}; requiredAccessibilitySupportBaselineCount=${counts.requiredAccessibilitySupportBaselineCount ?? 'n/a'}; requiredOfficialReferenceCount=${counts.requiredOfficialReferenceCount ?? 'n/a'}; requiredOwnerEvidenceArchiveRequirementCount=${counts.requiredOwnerEvidenceArchiveRequirementCount ?? 'n/a'}; blockingOwnerActionCount=${detail.blockingOwnerActionCount}`;
  }
  if (detail.kind === 'commercial_evidence_intake') {
    const intake = detail.commercialIntake;
    const counts = intake?.commercialEvidenceIntakeCounts || {};
    return `path=${intake?.path || 'n/a'}; exists=${intake?.exists === true}; placeholderCount=${intake?.placeholderCount ?? 'n/a'}; designPartnerCommitmentCount=${counts.designPartnerCommitmentCount ?? 'n/a'}; documentedOutcomeCount=${counts.documentedOutcomeCount ?? 'n/a'}; blockingOwnerActionCount=${detail.blockingOwnerActionCount}`;
  }
  return `blockingOwnerActionCount=${detail.blockingOwnerActionCount}`;
}

function buildOwnerGateScoreboard({ remediationSummary, ownerEvidencePrep, ownerGateCloseoutSummary, failedStepIds }) {
  const remainingGateIds = (ownerGateCloseoutSummary || []).map((item) => item.gateId);
  const acceptedLiveGateIds = remediationSummary?.acceptedLiveGateIds || [];
  return {
    status: remainingGateIds.length === 0 ? 'owner_evidence_complete' : 'owner_evidence_required',
    goalComplete: remediationSummary?.goalComplete === true,
    remainingGateCount: remainingGateIds.length,
    remainingGateIds,
    acceptedLiveGateCount: acceptedLiveGateIds.length,
    acceptedLiveGateIds,
    ownerActionQueueCount: remediationSummary?.ownerActionQueueCount || remainingGateIds.length,
    ownerActionNeededCount: ownerEvidencePrep?.ownerActionNeededCount || 0,
    failedStepCount: failedStepIds.length,
    failedStepIds,
    evidenceBoundary: 'This scoreboard is a machine-readable owner-evidence closeout summary only. It does not prove live checkout, live MRR, partner commitments, documented outcomes, manual WCAG conformance, legal compliance, procurement approval, or commercial readiness.',
  };
}

function renderMarkdown(result) {
  const failedSteps = result.failedStepIds.length > 0 ? result.failedStepIds.join(', ') : 'none';
  const scoreboard = result.ownerGateScoreboard || {};
  const remainingGateRows = (scoreboard.remainingGateIds || [])
    .map((gateId) => `| ${escapeMarkdownCell(gateId)} | remaining owner-held proof |`)
    .join('\n');
  const pathRows = Object.entries(result.paths)
    .map(([label, value]) => `| ${label} | \`${value}\` |`)
    .join('\n');
  const ownerActionRows = (result.ownerEvidencePrep?.ownerActionNeeded || [])
    .map((item, index) => `| ${index + 1} | ${escapeMarkdownCell(item)} |`)
    .join('\n');
  const ownerActions =
    ownerActionRows.length > 0
      ? `| # | Owner action needed |\n| --- | --- |\n${ownerActionRows}`
      : 'No owner action is needed before closeout.';
  const prepInputRows = [
    ['envFile', result.ownerEvidencePrep?.envFile?.exists ? 'exists' : 'missing', envFilePrepInputDetail(result.ownerEvidencePrep?.envFile)],
    ['commercialIntake', result.ownerEvidencePrep?.commercialIntake?.exists ? 'exists' : 'missing', prepInputDetail(result.ownerEvidencePrep?.commercialIntake, 'commercialEvidenceIntakeCounts')],
    ['manualWcagEvidence', result.ownerEvidencePrep?.manualWcagEvidence?.exists ? 'exists' : 'missing', prepInputDetail(result.ownerEvidencePrep?.manualWcagEvidence, 'manualWcagEvidenceCounts')],
  ]
    .map(([item, status, detail]) => `| ${item} | ${escapeMarkdownCell(status)} | ${escapeMarkdownCell(detail)} |`)
    .join('\n');
  const ownerGateRows = (result.ownerGateCloseoutSummary || [])
    .map((item) => {
      const closeoutSteps = item.closeoutStepStatuses.map((step) => `${step.stepId}:${step.status}`).join('; ');
      const failureDetails = item.closeoutStepStatuses
        .flatMap((step) => step.failureDetails.map((detail) => `${step.stepId}: ${detail}`));
      return `| ${escapeMarkdownCell(item.gateId)} | ${escapeMarkdownCell(item.status)} | ${escapeMarkdownCell(item.ownerAction)} | \`${escapeMarkdownCell(item.nextCommand || 'n/a')}\` | ${escapeMarkdownCell(compactOwnerPrepReadiness(item.ownerPrepReadiness))} | ${escapeMarkdownCell(closeoutSteps)} | ${escapeMarkdownCell(failureDetails.join('<br>') || 'none')} |`;
    })
    .join('\n');
  const stepRows = result.steps
    .map((step) => {
      const errorExcerpts = [
        ...(step.summary?.errorExcerpts || []),
        ...(step.stderrTail || []).map((line) => `stderr: ${line}`),
      ];
      const detail = errorExcerpts.length > 0 ? errorExcerpts.join('<br>') : 'none';
      return `| ${escapeMarkdownCell(step.id)} | ${escapeMarkdownCell(step.status)} | \`${escapeMarkdownCell(step.command)}\` | ${escapeMarkdownCell(compactSummary(step.summary))} | ${escapeMarkdownCell(detail)} |`;
    })
    .join('\n');
  const liveProofCommands = result.nextCommands.collectLiveProofs
    .map((command) => `- \`${command}\``)
    .join('\n');
  const writeLocalScaffoldCommand =
    result.nextCommands.writeLocalScaffold ||
    'npm run prepare:owner-evidence -- --write';
  const verifyLocalSafetyCommand =
    result.nextCommands.verifyLocalSafety ||
    'npm run verify:owner-evidence-local-safety';
  const generateLiveProofRunPacketCommand =
    result.nextCommands.generateLiveProofRunPacket ||
    'npm run generate:live-proof-run-packet';
  const loadEnvCommand =
    result.nextCommands.loadEnv ||
    'set -a; source .env.local; set +a';
  const commercialHashCommand =
    result.nextCommands.hashCommercialProofArtifacts ||
    'npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>';
  const generateCommercialEvidenceIntakePacketCommand =
    result.nextCommands.generateCommercialEvidenceIntakePacket ||
    'npm run generate:commercial-evidence-intake-packet';
  const manualWcagHashCommand =
    result.nextCommands.hashManualWcagProofArtifacts ||
    'npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>';
  const generateManualWcagReviewPacketCommand =
    result.nextCommands.generateManualWcagReviewPacket ||
    'npm run generate:manual-wcag-review-packet';
  const composeLiveGateEvidenceCommand =
    result.nextCommands.composeLiveGateEvidence ||
    `npm run compose:live-gate-evidence -- --write --allow-partial --output ${result.paths.liveEvidence}`;
  const validateLiveGateEvidenceCommand =
    result.nextCommands.validateLiveGateEvidence ||
    `npm run verify:live-gate-evidence -- --evidence ${result.paths.liveEvidence} --require-any`;
  const composeCompleteLiveGateEvidenceCommand =
    result.nextCommands.composeCompleteLiveGateEvidence ||
    `npm run compose:live-gate-evidence -- --write --require-complete --output ${result.paths.liveEvidence}`;
  const validateCompleteLiveGateEvidenceCommand =
    result.nextCommands.validateCompleteLiveGateEvidence ||
    `npm run verify:live-gate-evidence -- --evidence ${result.paths.liveEvidence} --require-complete`;
  const composeCommercialRecordsCommand =
    result.nextCommands.composeCommercialRecords ||
    'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all';
  const validateCommercialRecordsCommand =
    result.nextCommands.validateCommercialEvidenceRecords ||
    `npm run verify:commercial-evidence-records -- --evidence ${result.paths.commercialEvidence} --require-all`;

  return `# Owner Evidence Closeout Status

Generated: ${result.generatedAt}

Goal complete: \`${result.goalComplete}\`

Status OK: \`${result.ok}\`

Failed steps: ${failedSteps}

This artifact records the current ordered owner-evidence closeout status. It is allowed to be incomplete and does not turn missing owner-held proof into launch evidence.

## Evidence Boundary

${result.evidenceBoundary}

## Paths

| Item | Path |
| --- | --- |
${pathRows}

## Counts

| Metric | Count |
| --- | ---: |
| Remaining gates | ${result.remainingGateCount ?? result.remainingGateIds?.length ?? 0} |
| Accepted live gates | ${result.acceptedLiveGateCount ?? result.acceptedLiveGateIds?.length ?? 0} |
| Owner action queue rows | ${result.ownerActionQueueCount ?? result.ownerActionQueue?.length ?? 0} |
| Owner gate closeout rows | ${result.ownerGateCloseoutSummaryCount ?? result.ownerGateCloseoutSummary?.length ?? 0} |
| Closeout steps | ${result.stepCount ?? result.steps?.length ?? 0} |
| Failed closeout steps | ${result.failedStepCount ?? result.failedStepIds?.length ?? 0} |
| Written artifacts | ${result.wroteCount ?? result.wrote?.length ?? 0} |

## Owner Gate Scoreboard

Status: \`${scoreboard.status || 'unknown'}\`

Goal complete: \`${scoreboard.goalComplete === true}\`

Remaining gate count: ${scoreboard.remainingGateCount ?? 0}

Accepted live gate count: ${scoreboard.acceptedLiveGateCount ?? 0}

Owner action queue count: ${scoreboard.ownerActionQueueCount ?? result.ownerActionQueueCount}

Owner prep action count: ${scoreboard.ownerActionNeededCount ?? result.ownerEvidencePrep?.ownerActionNeededCount ?? 0}

Failed closeout step count: ${scoreboard.failedStepCount ?? result.failedStepIds.length}

${scoreboard.evidenceBoundary || ''}

| Gate | State |
| --- | --- |
${remainingGateRows || '| none | no remaining owner-held proof gates |'}

## Owner Evidence Prep Status

Ready for closeout: \`${result.ownerEvidencePrep?.readyForCloseout === true}\`

Owner action needed count: ${result.ownerEvidencePrep?.ownerActionNeededCount ?? 0}

${ownerActions}

### Local Evidence Inputs

| Input | Status | Detail |
| --- | --- | --- |
${prepInputRows}

## Gate Closeout Summary

This table projects the canonical remediation owner-action queue into closeout status. It is still an execution aid, not proof that owner-held gates are satisfied.

| Gate | Status | Owner action | Next command | Owner-prep readiness | Closeout steps | Redacted failure detail |
| --- | --- | --- | --- | --- | --- | --- |
${ownerGateRows || '| None | complete | No owner action remains. | `n/a` | n/a | n/a | none |'}

## Step Summary

| Step | Status | Command | Summary | Redacted failure detail |
| --- | --- | --- | --- | --- |
${stepRows}

## Next Commands

Prepare local owner evidence scaffolding:

\`${writeLocalScaffoldCommand}\`

Verify local owner evidence paths are ignored and untracked:

\`${verifyLocalSafetyCommand}\`

Generate live proof run packet and matrix:

\`${generateLiveProofRunPacketCommand}\`

Load owner-held environment into the current shell before live proof commands:

\`${loadEnvCommand}\`

Collect live proof artifacts:

${liveProofCommands}

Compose redacted partial live-gate evidence from passing live proof artifacts:

\`${composeLiveGateEvidenceCommand}\`

Validate at least one accepted redacted live-gate evidence item:

\`${validateLiveGateEvidenceCommand}\`

Compose complete redacted live-gate evidence after all live proof artifacts pass:

\`${composeCompleteLiveGateEvidenceCommand}\`

Validate complete redacted live-gate evidence before final closeout:

\`${validateCompleteLiveGateEvidenceCommand}\`

Generate commercial partner/outcome evidence intake packet:

\`${generateCommercialEvidenceIntakePacketCommand}\`

Hash commercial partner/outcome proof artifacts:

\`${commercialHashCommand}\`

Compose redacted commercial partner/outcome evidence records:

\`${composeCommercialRecordsCommand}\`

Validate redacted commercial partner/outcome evidence records:

\`${validateCommercialRecordsCommand}\`

Generate manual WCAG review packet and route/checkpoint matrix:

\`${generateManualWcagReviewPacketCommand}\`

Hash manual WCAG proof artifacts:

\`${manualWcagHashCommand}\`

Validate manual WCAG evidence:

\`${result.nextCommands.validateManualWcagEvidence}\`

Compose final closeout:

\`${result.nextCommands.composeAndCloseout}\`

Status-only rerun:

\`${result.nextCommands.statusOnly}\`
`;
}

function runNodeStep(id, label, commandArgs) {
  const result = spawnSync(process.execPath, commandArgs, {
    cwd: root,
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  const parsed = parseJsonOutput(result.stdout);
  return {
    id,
    label,
    command: commandString(commandArgs),
    status: result.status === 0 ? 'pass' : 'fail',
    exitCode: result.status,
    signal: result.signal || null,
    summary: summarizeStep(id, parsed),
    stderrTail: tailLines(result.stderr, 4),
  };
}

function tailLines(value, count) {
  return String(value || '')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => redactSensitiveText(line))
    .slice(-count);
}

function summarizeStep(id, parsed) {
  if (!parsed) return { parsed: false };

  if (id === 'inspect-owner-evidence-prep') {
    return {
      ok: parsed.ok,
      readyForCloseout: parsed.readyForCloseout,
      ownerActionNeededCount: (parsed.ownerActionNeeded || []).length,
      ownerActionNeeded: parsed.ownerActionNeeded || [],
      ownerActionNeededByGate: parsed.ownerActionNeededByGate || {},
      envFile: {
        path: parsed.envFile?.path,
        exists: parsed.envFile?.exists,
        keyNamesRedacted: parsed.envFile?.keyNamesRedacted === true,
        expectedKeyCount: parsed.envFile?.expectedKeyCount ?? null,
        presentExpectedKeyCount: parsed.envFile?.presentExpectedKeyCount ?? null,
        blankOrPlaceholderExpectedKeys:
          parsed.envFile?.blankOrPlaceholderExpectedKeys ||
          parsed.envFile?.blankOrPlaceholderKeys ||
          [],
        extraKeyCount: parsed.envFile?.extraKeyCount ?? null,
        redactionBoundary: parsed.envFile?.redactionBoundary || null,
      },
      liveProofReadiness: (parsed.liveProofReadiness || []).map((item) => ({
        id: item.id,
        command: item.command,
        ready: item.ready,
        envFileCompleteButNotLoaded: item.envFileCompleteButNotLoaded,
        requiredGroupCount: item.requiredGroupCount,
        presentGroupCount: item.presentGroupCount,
        missingGroupCount: item.missingGroupCount,
        blankOrPlaceholderEnvFileCount: item.blankOrPlaceholderEnvFileCount,
        invalidKeyModeCount: item.invalidKeyModeCount,
        loadFromEnvFileCount: item.loadFromEnvFileCount,
        missingGroups: item.missingGroups || [],
        blankOrPlaceholderEnvFile: item.blankOrPlaceholderEnvFile || [],
        invalidKeyModeGroups: item.invalidKeyModeGroups || [],
        stripeKeyModeRequirement: item.stripeKeyModeRequirement || null,
        loadFromEnvFile: item.loadFromEnvFile || [],
      })),
      liveGateEvidence: parsed.liveGateEvidence || null,
      commercialIntake: parsed.commercialIntake || null,
      manualWcagEvidence: parsed.manualWcagEvidence || null,
      proofArtifacts: (parsed.proofArtifacts || []).map((artifact) => ({
        path: artifact.path,
        gateId: artifact.gateId || null,
        readinessId: artifact.readinessId || null,
        command: artifact.command || null,
        exists: artifact.exists,
        validJson: artifact.validJson,
        artifactStatus: artifact.artifactStatus,
        acceptedSourceArtifact: artifact.acceptedSourceArtifact,
      })),
      nextCommands: parsed.nextCommands || {},
    };
  }

  if (id === 'owner-evidence-local-safety') {
    return {
      ok: parsed.ok,
      protectedPathCount: parsed.protectedPathCount,
      ignoredProtectedPathCount: parsed.ignoredProtectedPathCount,
      trackedSensitiveFileViolationCount: parsed.trackedSensitiveFileViolations?.length || 0,
      stagedSensitivePathViolationCount: parsed.stagedSensitivePathViolations?.length || 0,
      errorCount: parsed.errorCount || 0,
      errorExcerpts: safeErrorExcerpts(parsed.errors),
      outputs: parsed.outputs || null,
      evidenceBoundary: parsed.evidenceBoundary,
    };
  }

  if (id === 'compose-live-evidence') {
    return {
      ok: parsed.ok,
      complete: parsed.complete,
      wrote: parsed.wrote,
      acceptedGateIds: parsed.acceptedGateIds || [],
      errorCount: parsed.errorCount || 0,
      errorExcerpts: safeErrorExcerpts(parsed.errors),
    };
  }

  if (id === 'compose-commercial-records') {
    return {
      ok: parsed.ok,
      wrote: parsed.wrote,
      partnerGateSatisfied: parsed.partnerGateSatisfied,
      outcomeGateSatisfied: parsed.outcomeGateSatisfied,
      uniqueDesignPartnerCount: parsed.uniqueDesignPartnerCount,
      uniqueOutcomeCount: parsed.uniqueOutcomeCount,
      errorCount: parsed.errorCount || 0,
      errorExcerpts: safeErrorExcerpts(parsed.errors),
    };
  }

  if (id === 'verify-live-evidence') {
    return {
      ok: parsed.ok,
      found: parsed.found,
      complete: parsed.complete,
      acceptedGateIds: parsed.acceptedGateIds || [],
      errorCount: parsed.errorCount || 0,
      errorExcerpts: safeErrorExcerpts(parsed.errors),
    };
  }

  if (id === 'verify-commercial-records') {
    return {
      ok: parsed.ok,
      found: parsed.found,
      partnerGateSatisfied: parsed.partnerGateSatisfied,
      outcomeGateSatisfied: parsed.outcomeGateSatisfied,
      uniqueDesignPartnerCount: parsed.uniqueDesignPartnerCount,
      uniqueOutcomeCount: parsed.uniqueOutcomeCount,
      errorCount: parsed.errorCount || 0,
      errorExcerpts: safeErrorExcerpts(parsed.errors),
    };
  }

  if (id === 'verify-manual-wcag-evidence') {
    return {
      ok: parsed.ok,
      found: parsed.found,
      complete: parsed.complete,
      manualWcagGateSatisfied: parsed.manualWcagGateSatisfied,
      acceptedCheckpointIds: parsed.acceptedCheckpointIds || [],
      acceptedCheckpointCount: parsed.acceptedCheckpointCount || 0,
      requiredCheckpointCount: parsed.requiredCheckpointCount,
      checkpointResultCount: parsed.checkpointResultCount || 0,
      requiredRouteCount: parsed.requiredRouteCount,
      routeReviewedCount: parsed.routeReviewedCount || 0,
      requiredCompleteProcessCount: parsed.requiredCompleteProcessCount,
      completeProcessReviewedCount: parsed.completeProcessReviewedCount || 0,
      requiredAccessibilitySupportBaselineCount: parsed.requiredAccessibilitySupportBaselineCount,
      accessibilitySupportBaselineCount: parsed.accessibilitySupportBaselineCount || 0,
      requiredOfficialReferenceCount: parsed.requiredOfficialReferenceCount,
      officialReferenceCount: parsed.officialReferenceCount || 0,
      errorCount: parsed.errorCount || 0,
      errorExcerpts: safeErrorExcerpts(parsed.errors),
    };
  }

  if (id === 'verify-remediation-gates') {
    return {
      ok: parsed.ok,
      goalComplete: parsed.goalComplete,
      acceptedLiveGateIds: parsed.liveGateEvidence?.acceptedGateIds || [],
      partnerGateSatisfied: parsed.commercialEvidenceRecords?.partnerGateSatisfied,
      outcomeGateSatisfied: parsed.commercialEvidenceRecords?.outcomeGateSatisfied,
      manualWcagGateSatisfied: parsed.manualWcagEvidence?.manualWcagGateSatisfied,
      blockedGateIds: (parsed.gates || [])
        .filter((gate) => String(gate.status || '').startsWith('blocked_'))
        .map((gate) => gate.id),
      gates: parsed.gates || [],
      ownerActionQueue: parsed.ownerActionQueue || [],
      ownerActionQueueCount: parsed.ownerActionQueueCount || 0,
      remainingManualEvidence: parsed.remainingManualEvidence || [],
      wrote: parsed.wrote || null,
      errorExcerpts: safeErrorExcerpts(parsed.errors),
    };
  }

  if (id === 'write-completion-audit') {
    return {
      ok: parsed.ok,
      goalComplete: parsed.goalComplete,
      remainingExternalGateCount: parsed.remainingExternalGateCount,
      wrote: parsed.wrote || null,
      errorExcerpts: safeErrorExcerpts(parsed.errors),
    };
  }

  return parsed;
}

const shouldWrite = hasFlag('--write');
const allowIncomplete = hasFlag('--allow-incomplete');
const refreshTracked = hasFlag('--refresh-tracked');
const writeStatus = hasFlag('--write-status');
const liveEvidencePath = readFlagValue('--live-evidence', readFlagValue('--live-output', 'docs/commercialization/live-gate-evidence.local.json'));
const commercialIntakePath = readFlagValue('--commercial-intake', 'docs/commercialization/commercial-evidence-intake.local.json');
const commercialRecordsPath = readFlagValue('--commercial-evidence', readFlagValue('--commercial-output', 'docs/commercialization/commercial-evidence-records.local.json'));
const manualWcagEvidencePath = readFlagValue('--manual-wcag-evidence', 'docs/commercialization/manual-wcag-evidence.local.json');
const statusJsonPath = readFlagValue('--status-json', DEFAULT_STATUS_JSON);
const statusMarkdownPath = readFlagValue('--status-md', DEFAULT_STATUS_MD);

const liveComposeArgs = [
  'scripts/compose-live-gate-evidence.mjs',
  '--require-complete',
  '--output',
  liveEvidencePath,
];
if (shouldWrite) liveComposeArgs.push('--write');

for (const passThroughFlag of [
  '--stripe-test-artifact',
  '--production-calibration-artifact',
  '--live-auth-e2e-artifact',
  '--stripe-live-mrr-artifact',
]) {
  const value = readFlagValue(passThroughFlag);
  if (value) liveComposeArgs.push(passThroughFlag, value);
}

const commercialComposeArgs = [
  'scripts/compose-commercial-evidence-records.mjs',
  '--require-all',
  '--intake',
  commercialIntakePath,
  '--output',
  commercialRecordsPath,
];
if (shouldWrite) commercialComposeArgs.push('--write');

const remediationGateArgs = [
  'scripts/verify-remediation-external-gates.mjs',
  '--live-evidence',
  liveEvidencePath,
  '--commercial-evidence',
  commercialRecordsPath,
  '--manual-wcag-evidence',
  manualWcagEvidencePath,
  '--require-complete',
];
if (refreshTracked) remediationGateArgs.push('--write');

const ownerEvidencePrepArgs = [
  'scripts/prepare-owner-evidence-workspace.mjs',
  '--commercial-intake',
  commercialIntakePath,
  '--manual-wcag-evidence',
  manualWcagEvidencePath,
];

const steps = [
  runNodeStep('owner-evidence-local-safety', 'Verify owner-evidence local paths are ignored and untracked', [
    'scripts/verify-owner-evidence-local-safety.mjs',
    '--write',
  ]),
  runNodeStep('inspect-owner-evidence-prep', 'Inspect local owner-evidence readiness without printing secrets', ownerEvidencePrepArgs),
  runNodeStep('compose-live-evidence', 'Compose redacted live-gate evidence from owner-run proof artifacts', liveComposeArgs),
  runNodeStep('compose-commercial-records', 'Compose redacted partner/outcome records from owner-held intake', commercialComposeArgs),
  runNodeStep('verify-live-evidence', 'Validate redacted live-gate evidence fail-closed', [
    'scripts/verify-live-gate-evidence.mjs',
    '--evidence',
    liveEvidencePath,
    '--require-complete',
  ]),
  runNodeStep('verify-commercial-records', 'Validate redacted commercial evidence records fail-closed', [
    'scripts/verify-commercial-evidence-records.mjs',
    '--evidence',
    commercialRecordsPath,
    '--require-all',
  ]),
  runNodeStep('verify-manual-wcag-evidence', 'Validate manual WCAG evidence metadata fail-closed', [
    'scripts/verify-manual-wcag-evidence.mjs',
    '--evidence',
    manualWcagEvidencePath,
    '--require-complete',
  ]),
  runNodeStep('verify-remediation-gates', 'Validate final remediation gates fail-closed', remediationGateArgs),
];

const remediationStep = steps.find((step) => step.id === 'verify-remediation-gates');
const goalComplete = remediationStep?.summary?.goalComplete === true;
const ownerEvidencePrepSummary = steps.find((step) => step.id === 'inspect-owner-evidence-prep')?.summary || null;
const ownerGateCloseoutSummary = buildOwnerGateCloseoutSummary(remediationStep?.summary, ownerEvidencePrepSummary, steps);

if (goalComplete && refreshTracked) {
  steps.push(runNodeStep('write-completion-audit', 'Refresh tracked remediation completion audit', [
    'scripts/verify-remediation-completion-audit.mjs',
    '--write',
  ]));
}

const failedSteps = steps.filter((step) => step.status !== 'pass');
const resultSteps = compactResultSteps(steps);
const ownerGateScoreboard = buildOwnerGateScoreboard({
  remediationSummary: remediationStep?.summary,
  ownerEvidencePrep: ownerEvidencePrepSummary,
  ownerGateCloseoutSummary,
  failedStepIds: failedSteps.map((step) => step.id),
});
const result = {
  schemaVersion: '2026-06-04.apo-owner-evidence-closeout-status.v1',
  generatedAt: new Date().toISOString(),
  ok: failedSteps.length === 0 && goalComplete,
  goalComplete,
  writeMode: shouldWrite,
  writeStatus,
  refreshTracked,
  allowIncomplete,
  paths: {
    liveEvidence: liveEvidencePath,
    commercialIntake: commercialIntakePath,
    commercialEvidence: commercialRecordsPath,
    manualWcagEvidence: manualWcagEvidencePath,
  },
  evidenceBoundary: 'This command orchestrates redacted local evidence only. Raw Stripe API responses, Checkout Session payloads, subscription exports, invoice exports, dashboard screenshots, Supabase secrets, customer identities, partner names, contracts, private notes, quotes, hash salts, manual WCAG notes, screenshots, recordings, reviewer identity, assistive-technology transcripts, evaluation-tool output, issue logs, sample archives, artifact hash source maps, and owner-held archive records must remain owner-held outside tracked files.',
  ownerGateScoreboard,
  remainingGateCount: ownerGateScoreboard.remainingGateCount,
  remainingGateIds: ownerGateScoreboard.remainingGateIds,
  acceptedLiveGateCount: ownerGateScoreboard.acceptedLiveGateCount,
  acceptedLiveGateIds: ownerGateScoreboard.acceptedLiveGateIds,
  ownerActionNeededCount: ownerGateScoreboard.ownerActionNeededCount,
  ownerEvidencePrep: ownerEvidencePrepSummary,
  ownerActionQueueCount: remediationStep?.summary?.ownerActionQueueCount || ownerGateCloseoutSummary.length,
  ownerActionQueue: remediationStep?.summary?.ownerActionQueue || [],
  ownerGateCloseoutSummaryCount: ownerGateCloseoutSummary.length,
  ownerGateCloseoutSummary,
  stepCount: resultSteps.length,
  steps: resultSteps,
  failedStepCount: failedSteps.length,
  failedStepIds: failedSteps.map((step) => step.id),
  nextCommands: {
    writeLocalScaffold:
      ownerEvidencePrepSummary?.nextCommands?.writeLocalScaffold ||
      'npm run prepare:owner-evidence -- --write',
    verifyLocalSafety:
      ownerEvidencePrepSummary?.nextCommands?.verifyLocalSafety ||
      'npm run verify:owner-evidence-local-safety',
    generateLiveProofRunPacket:
      ownerEvidencePrepSummary?.nextCommands?.generateLiveProofRunPacket ||
      'npm run generate:live-proof-run-packet',
    loadEnv:
      ownerEvidencePrepSummary?.nextCommands?.loadEnv ||
      'set -a; source .env.local; set +a',
    collectLiveProofs: [
      'npm run verify:stripe-test-checkout',
      'npm run verify:production-calibration',
      'npm run verify:commercial-live-auth-e2e',
      'npm run verify:stripe-live-mrr',
    ],
    composeLiveGateEvidence: `npm run compose:live-gate-evidence -- --write --allow-partial --output ${liveEvidencePath}`,
    validateLiveGateEvidence: `npm run verify:live-gate-evidence -- --evidence ${liveEvidencePath} --require-any`,
    composeCompleteLiveGateEvidence: `npm run compose:live-gate-evidence -- --write --require-complete --output ${liveEvidencePath}`,
    validateCompleteLiveGateEvidence: `npm run verify:live-gate-evidence -- --evidence ${liveEvidencePath} --require-complete`,
    generateCommercialEvidenceIntakePacket: 'npm run generate:commercial-evidence-intake-packet',
    hashCommercialProofArtifacts: 'npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>',
    composeCommercialRecords: 'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
    validateCommercialEvidenceRecords: `npm run verify:commercial-evidence-records -- --evidence ${commercialRecordsPath} --require-all`,
    generateManualWcagReviewPacket: 'npm run generate:manual-wcag-review-packet',
    validateManualWcagEvidence: `npm run verify:manual-wcag-evidence -- --evidence ${manualWcagEvidencePath} --require-complete`,
    hashManualWcagProofArtifacts: 'npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>',
    composeAndCloseout: `npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence ${liveEvidencePath} --commercial-intake ${commercialIntakePath} --commercial-evidence ${commercialRecordsPath} --manual-wcag-evidence ${manualWcagEvidencePath}`,
    statusOnly: 'npm run verify:owner-evidence-closeout',
  },
};

if (writeStatus) {
  result.statusArtifacts = {
    json: statusJsonPath,
    markdown: statusMarkdownPath,
  };
  result.wrote = [statusJsonPath, statusMarkdownPath];
  result.wroteCount = result.wrote.length;
  writeText(statusJsonPath, `${JSON.stringify(result, null, 2)}\n`);
  writeText(statusMarkdownPath, renderMarkdown(result));
}

console.log(JSON.stringify(result, null, 2));

if (!allowIncomplete && !result.ok) {
  process.exitCode = 1;
}
