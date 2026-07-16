#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';

const SCHEMA_VERSION = '2026-06-04.apo-owner-evidence-completion-drill.v1';
const OUTPUT_JSON = 'docs/commercialization/owner-evidence-completion-drill-latest.json';
const OUTPUT_MARKDOWN = 'docs/commercialization/owner-evidence-completion-drill-latest.md';
const OUTPUT_CSV = 'docs/commercialization/owner-evidence-completion-matrix-latest.csv';

const REMEDIATION_LEDGER_PATH = 'docs/commercialization/remediation-external-gates-latest.json';
const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const HANDOFF_PATH = 'docs/commercialization/owner-evidence-handoff-latest.json';
const LIVE_PACKET_PATH = 'docs/commercialization/live-proof-run-packet-latest.json';
const COMMERCIAL_PACKET_PATH = 'docs/commercialization/commercial-evidence-intake-packet-latest.json';
const MANUAL_WCAG_PACKET_PATH = 'docs/commercialization/manual-wcag-review-packet-latest.json';
const LIVE_CLOSEOUT_READINESS_PATH = 'docs/commercialization/live-closeout-readiness-latest.json';
const OWNER_EVIDENCE_LOCAL_SAFETY_PATH = 'docs/commercialization/owner-evidence-local-safety-latest.json';
const OWNER_EVIDENCE_LOCAL_SAFETY_SOURCE_TRACE_BOUNDARY =
  'This local-safety source trace identifies owner-evidence-local-safety artifact anchors for git ignore, tracking, staging, error, and boundary counts. It does not read owner-held evidence file contents, load secrets, run live checks, or upgrade launch readiness.';
const COMPLETION_DRILL_SOURCE_TRACE_BOUNDARY =
  'This completion-drill source trace maps each owner-evidence completion drill provenance row to the sourceArtifacts key used by the generated drill packet. It does not execute owner commands, load credentials, collect owner-held evidence, read local evidence values, run live checks, or upgrade launch readiness.';
const LIVE_CLOSEOUT_TARGET_PROJECT_REF = 'kvunnankqgfokeufvsrv';
const OPERATIONAL_ACCESS_RECOVERY_COMMANDS = [
  'gh secret list --repo sanjabh11/career-automation-insights-engine',
  'supabase login',
  'supabase projects list --output json',
  `supabase functions list --project-ref ${LIVE_CLOSEOUT_TARGET_PROJECT_REF}`,
  'npm run generate:live-closeout-readiness',
  'npm run verify:live-closeout-readiness',
];

const LIVE_GATE_IDS = new Set([
  'real_stripe_test_checkout',
  'production_calibration_run',
  'authenticated_live_artifact_e2e',
  'live_mrr_gt_zero',
]);
const COMMERCIAL_GATE_IDS = new Set(['three_committed_partners', 'documented_outcomes']);
const MANUAL_WCAG_GATE_IDS = new Set(['manual_wcag_evidence']);

const PACKET_BY_TYPE = {
  live_proof_run: {
    id: 'live_proof_run',
    label: 'Live proof run packet',
    json: LIVE_PACKET_PATH,
    markdown: 'docs/commercialization/live-proof-run-packet-latest.md',
    csv: 'docs/commercialization/live-proof-run-matrix-latest.csv',
    generatorCommand: 'npm run generate:live-proof-run-packet',
    packetStatusField: 'status',
    boundary:
      'Owner-run worksheet for Stripe/Supabase proof commands. It does not execute checks, does not print secrets, and does not prove live proof artifacts passed; raw provider payloads, exports, screenshots, and ownerEvidenceArchive source records remain owner-held.',
  },
  commercial_evidence_intake: {
    id: 'commercial_evidence_intake',
    label: 'Commercial evidence intake packet',
    json: COMMERCIAL_PACKET_PATH,
    markdown: 'docs/commercialization/commercial-evidence-intake-packet-latest.md',
    csv: 'docs/commercialization/commercial-evidence-intake-matrix-latest.csv',
    generatorCommand: 'npm run generate:commercial-evidence-intake-packet',
    packetStatusField: 'status',
    boundary:
      'Owner worksheet for partner and outcome evidence. It does not prove partner commitments, documented outcomes, testimonial compliance, revenue, retention, or causality.',
  },
  manual_wcag_review: {
    id: 'manual_wcag_review',
    label: 'Manual WCAG review packet',
    json: MANUAL_WCAG_PACKET_PATH,
    markdown: 'docs/commercialization/manual-wcag-review-packet-latest.md',
    csv: 'docs/commercialization/manual-wcag-review-matrix-latest.csv',
    generatorCommand: 'npm run generate:manual-wcag-review-packet',
    packetStatusField: 'status',
    boundary:
      'Owner-review worksheet for manual WCAG evidence. It does not complete manual review, certify conformance, prove legal compliance, or replace redacted evidence metadata.',
  },
};

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function readOptionalJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
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

function formatList(values) {
  return (values || []).filter(Boolean).join('; ');
}

function packetTypeForGate(gateId) {
  if (LIVE_GATE_IDS.has(gateId)) return 'live_proof_run';
  if (COMMERCIAL_GATE_IDS.has(gateId)) return 'commercial_evidence_intake';
  if (MANUAL_WCAG_GATE_IDS.has(gateId)) return 'manual_wcag_review';
  return 'unmapped';
}

function packetStatus(packetType, packets) {
  if (packetType === 'unmapped') return 'missing_packet_mapping';
  const packet = packets[packetType];
  return packet?.status || 'missing_packet_artifact';
}

function liveProofForGate(gateId, livePacket) {
  return (livePacket?.liveProofs || []).find((item) => item.gateId === gateId) || null;
}

function expectedProofArtifact(gateId, livePacket, closeoutStatus) {
  if (LIVE_GATE_IDS.has(gateId)) {
    return liveProofForGate(gateId, livePacket)?.artifactPath || '';
  }
  if (COMMERCIAL_GATE_IDS.has(gateId)) {
    return closeoutStatus?.paths?.commercialEvidence || 'docs/commercialization/commercial-evidence-records.local.json';
  }
  if (MANUAL_WCAG_GATE_IDS.has(gateId)) {
    return closeoutStatus?.paths?.manualWcagEvidence || 'docs/commercialization/manual-wcag-evidence.local.json';
  }
  return '';
}

function acceptedWhen(gateId) {
  if (LIVE_GATE_IDS.has(gateId)) {
    return 'Gate proof artifact has status=passed, redacted live-gate evidence accepts the gate, and final remediation gates pass with --require-complete.';
  }
  if (COMMERCIAL_GATE_IDS.has(gateId)) {
    return 'Commercial evidence records verify with --require-all and final remediation gates pass with --require-complete.';
  }
  if (MANUAL_WCAG_GATE_IDS.has(gateId)) {
    return 'Manual WCAG evidence verifies with --require-complete and final remediation gates pass with --require-complete.';
  }
  return 'Final remediation gates pass with --require-complete.';
}

function defaultVerifierCommand(gateId, gate) {
  if (gate?.nextCommand) return gate.nextCommand;
  if (LIVE_GATE_IDS.has(gateId)) return 'npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-complete';
  if (COMMERCIAL_GATE_IDS.has(gateId)) return 'npm run verify:commercial-evidence-records -- --evidence docs/commercialization/commercial-evidence-records.local.json --require-all';
  if (MANUAL_WCAG_GATE_IDS.has(gateId)) return 'npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete';
  return 'npm run verify:remediation-gates -- --require-complete';
}

function completionState(gate, blockingOwnerActions) {
  if (gate?.status === 'externally_proven_redacted_evidence_attached') return 'accepted_redacted_evidence_attached';
  if (gate?.status?.startsWith('blocked')) return 'blocked_owner_evidence_required';
  if (blockingOwnerActions.length > 0) return 'owner_prep_required';
  return 'owner_verifier_required';
}

function normalizeGateRow(row) {
  return {
    id: row.gateId || row.id,
    label: row.label || row.gateId || row.id,
    track: row.track || 'owner_evidence',
    status: row.status || 'unknown',
    sourceBoundary: row.sourceBoundary || '',
    currentEvidence: row.currentEvidence || row.evidence || '',
    neededEvidence: row.neededEvidence || '',
    ownerAction: row.ownerAction || '',
    ownerPrepCommand: row.ownerPrepCommand || '',
    nextCommand: row.nextCommand || '',
    riskIfSkipped: row.riskIfSkipped || '',
    doesNotProve: row.doesNotProve || [],
    rawEvidencePolicy: row.rawEvidencePolicy || '',
    repoDoesNotDo: row.repoDoesNotDo || [],
    order: row.order || null,
  };
}

function buildCompletionRows({ handoff, remediationLedger, closeoutStatus, packets }) {
  const handoffRows = Array.isArray(handoff?.ownerActionRows) ? handoff.ownerActionRows : [];
  const remediationRows = Array.isArray(remediationLedger?.ownerActionQueue) ? remediationLedger.ownerActionQueue : [];
  const sourceRows = handoffRows.length ? handoffRows : remediationRows;
  const ownerActionsByGate = closeoutStatus?.ownerEvidencePrep?.ownerActionNeededByGate || {};
  const closeoutFailureDetails = closeoutStatus?.steps || [];
  const livePacket = packets.live_proof_run;

  return sourceRows.map((sourceRow, index) => {
    const gate = normalizeGateRow(sourceRow);
    const packetType = packetTypeForGate(gate.id);
    const packet = PACKET_BY_TYPE[packetType] || {};
    const blockingOwnerActions = ownerActionsByGate[gate.id] || [];
    const liveProof = liveProofForGate(gate.id, livePacket);
    const closeoutFailures = closeoutFailureDetails
      .filter((step) => step.ok === false && JSON.stringify(step).includes(gate.id))
      .map((step) => step.id);

    return {
      order: gate.order || index + 1,
      gateId: gate.id,
      label: gate.label,
      track: gate.track,
      currentStatus: gate.status,
      completionState: completionState(gate, blockingOwnerActions),
      packetType,
      packetLabel: packet.label || 'Unmapped packet',
      packetStatus: packetStatus(packetType, packets),
      packetMarkdown: packet.markdown || '',
      packetCsv: packet.csv || '',
      packetGeneratorCommand: packet.generatorCommand || '',
      expectedProofArtifact: expectedProofArtifact(gate.id, livePacket, closeoutStatus),
      acceptanceVerifierCommand: defaultVerifierCommand(gate.id, gate),
      finalCloseoutCommand:
        'npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-intake docs/commercialization/commercial-evidence-intake.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json',
      acceptedWhen: acceptedWhen(gate.id),
      ownerPrepCommand: gate.ownerPrepCommand,
      ownerAction: gate.ownerAction,
      blockingOwnerActionCount: blockingOwnerActions.length,
      blockingOwnerActions,
      closeoutFailureStepIds: closeoutFailures,
      sourceBoundary: gate.sourceBoundary,
      currentEvidence: gate.currentEvidence,
      neededEvidence: gate.neededEvidence,
      riskIfSkipped: gate.riskIfSkipped,
      rawEvidencePolicy:
        gate.rawEvidencePolicy ||
        'Keep raw Stripe API responses, Checkout Session payloads, subscription exports, invoice exports, dashboard screenshots, Supabase secrets, customer identities, partner names, contracts, private notes, quotes, hash salts, manual WCAG notes, screenshots, recordings, reviewer identity, assistive-technology transcripts, evaluation-tool output, issue logs, and sample archives owner-held outside tracked files.',
      repoDoesNotDo:
        gate.repoDoesNotDo?.length
          ? gate.repoDoesNotDo
          : [
              'Does not execute owner-held credentialed checks',
              'Does not convert placeholder hashes or missing artifacts into launch evidence',
              'Does not prove legal compliance, procurement approval, product-market fit, retention, future revenue, or WCAG conformance',
            ],
      doesNotProve: gate.doesNotProve,
      liveReadinessStatus: liveProof?.readiness?.status || '',
      liveProofArtifactStatus: liveProof?.proofArtifact?.artifactStatus || '',
    };
  });
}

function packetSummaries(packets) {
  return Object.entries(PACKET_BY_TYPE).map(([packetType, packet]) => ({
    ...packetSummary(packetType, packet, packets[packetType]),
  }));
}

function packetSummary(packetType, packet, packetArtifact) {
  const officialReferences = Array.isArray(packetArtifact?.officialReferences)
    ? packetArtifact.officialReferences
    : [];

  return {
    packetType,
    label: packet.label,
    status: packetStatus(packetType, { [packetType]: packetArtifact }),
    json: packet.json,
    markdown: packet.markdown,
    csv: packet.csv,
    generatorCommand: packet.generatorCommand,
    officialReferenceCount: officialReferences.length,
    officialReferenceIds: officialReferences.map((reference) => reference.id).filter(Boolean),
    officialReferenceUrls: officialReferences.map((reference) => reference.url).filter(Boolean),
    boundary: packet.boundary,
  };
}

function officialReferenceSummary(packetSummaries) {
  const urls = [...new Set(packetSummaries.flatMap((packet) => packet.officialReferenceUrls || []))].sort((a, b) =>
    a.localeCompare(b),
  );
  return {
    count: urls.length,
    urls,
  };
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

function buildSourceTrace(sourceArtifacts) {
  return Object.entries(sourceArtifacts || {}).map(([key, artifactPath]) => ({
    key,
    artifactPath,
    sourceArtifact: `${OUTPUT_JSON}#sourceArtifacts.${key}`,
  }));
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
        'Owner-evidence local-safety status could not be read. Run npm run verify:owner-evidence-local-safety before using this completion drill.',
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

function buildOwnerPrepActionNeededByGate(closeoutStatus, gateIds) {
  const actionsByGate = closeoutStatus?.ownerEvidencePrep?.ownerActionNeededByGate || {};
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

async function buildDrill() {
  const [remediationLedger, closeoutStatus, handoff, livePacket, commercialPacket, manualPacket, liveCloseoutReadiness, localSafety] = await Promise.all([
    readOptionalJson(REMEDIATION_LEDGER_PATH),
    readOptionalJson(CLOSEOUT_STATUS_PATH),
    readOptionalJson(HANDOFF_PATH),
    readOptionalJson(LIVE_PACKET_PATH),
    readOptionalJson(COMMERCIAL_PACKET_PATH),
    readOptionalJson(MANUAL_WCAG_PACKET_PATH),
    readOptionalJson(LIVE_CLOSEOUT_READINESS_PATH),
    readOptionalJson(OWNER_EVIDENCE_LOCAL_SAFETY_PATH),
  ]);
  const packets = {
    live_proof_run: livePacket,
    commercial_evidence_intake: commercialPacket,
    manual_wcag_review: manualPacket,
  };
  const completionRows = buildCompletionRows({ handoff, remediationLedger, closeoutStatus, packets });
  const operationalAccessPrerequisites =
    handoff?.operationalAccessPrerequisites ||
    (liveCloseoutReadiness
      ? [
          {
            id: 'live_closeout_supabase_access',
            label: 'Live closeout Supabase project/functions access',
            track: 'live-runtime',
            status: liveCloseoutReadiness.ok === true ? 'passed' : 'owner_access_required',
            sourceArtifact: LIVE_CLOSEOUT_READINESS_PATH,
            ownerAction:
              liveCloseoutReadiness.ok === true
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
        ]
      : []);
  const requiredGateIds = completionRows.map((row) => row.gateId);
  const blockedGateCount = completionRows.filter((row) => row.completionState !== 'accepted_redacted_evidence_attached').length;
  const summaries = packetSummaries(packets);
  const officialReferences = officialReferenceSummary(summaries);
  const localSafetyStatus = buildLocalSafetyStatus(localSafety);
  const ownerPrepActionNeededByGate = buildOwnerPrepActionNeededByGate(closeoutStatus, requiredGateIds);
  const sourceArtifacts = {
    remediationLedger: REMEDIATION_LEDGER_PATH,
    closeoutStatus: CLOSEOUT_STATUS_PATH,
    handoff: HANDOFF_PATH,
    liveProofRunPacket: LIVE_PACKET_PATH,
    commercialEvidenceIntakePacket: COMMERCIAL_PACKET_PATH,
    manualWcagReviewPacket: MANUAL_WCAG_PACKET_PATH,
    liveCloseoutReadiness: LIVE_CLOSEOUT_READINESS_PATH,
    ownerEvidenceLocalSafety: OWNER_EVIDENCE_LOCAL_SAFETY_PATH,
  };
  const sourceTrace = buildSourceTrace(sourceArtifacts);
  const recommendedCommandOrder = [
    'npm run generate:owner-evidence-completion-drill',
    ...(handoff?.commandSequence || [
      'npm run prepare:owner-evidence -- --write',
      'npm run verify:owner-evidence-local-safety',
      'npm run generate:live-proof-run-packet',
      'set -a; source .env.local; set +a',
      'npm run verify:stripe-test-checkout',
      'npm run verify:production-calibration',
      'npm run verify:commercial-live-auth-e2e',
      'npm run verify:stripe-live-mrr',
      'npm run compose:live-gate-evidence -- --write --allow-partial --output docs/commercialization/live-gate-evidence.local.json',
      'npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-any',
      'npm run compose:live-gate-evidence -- --write --require-complete --output docs/commercialization/live-gate-evidence.local.json',
      'npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-complete',
      'npm run generate:commercial-evidence-intake-packet',
      'npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>',
      'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
      'npm run verify:commercial-evidence-records -- --evidence docs/commercialization/commercial-evidence-records.local.json --require-all',
      'npm run generate:manual-wcag-review-packet',
      'npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>',
      'npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete',
      'npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-intake docs/commercialization/commercial-evidence-intake.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json',
      'npm run verify:commercial',
    ]),
  ];
  const recommendedOperationalAccessCommands = [
    ...new Set(
      operationalAccessPrerequisites.flatMap(
        (item) => item.accessRecoveryCommands || OPERATIONAL_ACCESS_RECOVERY_COMMANDS,
      ),
    ),
  ];
  const doesNotProve = [
    'Commercial-ready launch status',
    'Stripe checkout proof',
    'Live MRR',
    'Production calibration',
    'Authenticated live artifact proof',
    'Three committed partners',
    'Documented outcomes',
    'Manual WCAG conformance',
    'Live deployment closeout access',
    'Legal compliance',
    'Procurement approval',
  ];

  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
    status: blockedGateCount === 0 ? 'owner_evidence_complete' : 'owner_evidence_required',
    goalComplete: blockedGateCount === 0 && closeoutStatus?.goalComplete === true,
    requiredGateCount: completionRows.length,
    blockedGateCount,
    ownerActionQueueCount: closeoutStatus?.ownerActionQueueCount ?? handoff?.ownerActionQueueCount ?? completionRows.length,
    ownerActionNeededCount: closeoutStatus?.ownerEvidencePrep?.ownerActionNeededCount ?? handoff?.ownerPrepReadiness?.ownerActionNeededCount ?? null,
    operationalAccessPrerequisiteCount: operationalAccessPrerequisites.length,
    packetCount: Object.keys(PACKET_BY_TYPE).length,
    officialReferenceCount: officialReferences.count,
    officialReferenceUrls: officialReferences.urls,
    matrixRowCount: completionRows.length,
    requiredGateIds,
    ownerPrepActionNeededByGateSourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate`,
    ownerPrepActionNeededByGateBoundary:
      'This per-gate summary mirrors ownerEvidencePrep.ownerActionNeededByGate for required owner gates only. It is an owner-execution aid and does not expose owner-held evidence values or prove any external launch gate.',
    ownerPrepActionNeededByGate,
    ownerPrepActionNeededByGateCount: Object.keys(ownerPrepActionNeededByGate).length,
    sourceArtifact: sourceArtifacts.handoff,
    sourceArtifacts,
    sourceArtifactCount: Object.keys(sourceArtifacts).length,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: COMPLETION_DRILL_SOURCE_TRACE_BOUNDARY,
    outputArtifacts: {
      json: OUTPUT_JSON,
      markdown: OUTPUT_MARKDOWN,
      csv: OUTPUT_CSV,
    },
    evidenceBoundary:
      'This drill is a repo-generated execution map over existing owner packets. It does not run live Stripe or Supabase checks, does not review WCAG manually, does not validate partner/outcome evidence, does not print secrets, does not archive raw provider evidence in git, and does not upgrade launch readiness while required owner evidence is missing.',
    localSafetyStatus,
    packetSummaries: summaries,
    recommendedCommandOrderCount: recommendedCommandOrder.length,
    recommendedOperationalAccessCommandCount: recommendedOperationalAccessCommands.length,
    doesNotProveCount: doesNotProve.length,
    recommendedCommandOrder,
    recommendedOperationalAccessCommands,
    completionRows,
    operationalAccessPrerequisites,
    doesNotProve,
  };
}

function renderMarkdown(drill) {
  const packetRows = drill.packetSummaries
    .map((packet) => `| ${markdownCell(packet.label)} | ${markdownCell(packet.status)} | ${packet.officialReferenceCount ?? 0} | ${markdownCell(packet.officialReferenceIds)} | \`${packet.markdown}\` | \`${packet.csv}\` | \`${packet.generatorCommand}\` |`)
    .join('\n');
  const commandRows = drill.recommendedCommandOrder.map((command) => `- \`${command}\``).join('\n');
  const ownerPrepByGateRows = Object.values(drill.ownerPrepActionNeededByGate || {})
    .map((item) => {
      const actions = item.ownerActionNeeded.length ? item.ownerActionNeeded.join('<br>') : 'none';
      return `| ${markdownCell(item.gateId)} | ${item.ownerActionNeededCount} | ${markdownCell(actions)} | \`${markdownCell(item.sourceArtifact)}\` |`;
    })
    .join('\n');
  const matrixRows = drill.completionRows
    .map((row) =>
      `| ${row.order} | ${markdownCell(row.gateId)} | ${markdownCell(row.currentStatus)} | ${markdownCell(row.completionState)} | ${markdownCell(row.packetLabel)} | ${markdownCell(row.packetStatus)} | ${markdownCell(row.blockingOwnerActions)} | \`${markdownCell(row.acceptanceVerifierCommand)}\` |`
    )
    .join('\n');
  const operationalCommandRows = drill.recommendedOperationalAccessCommands
    .map((command) => `- \`${markdownCell(command)}\``)
    .join('\n');
  const localSafetySourceTraceRows =
    drill.localSafetyStatus.sourceTrace
      ?.map((row) => `| ${markdownCell(row.key)} | ${markdownCell(row.value)} | ${markdownCell(row.sourceArtifact)} |`)
      .join('\n') || '| none | n/a | n/a |';
  const sourceTraceRows =
    drill.sourceTrace
      ?.map((row) => `| ${markdownCell(row.key)} | \`${markdownCell(row.artifactPath)}\` | \`${markdownCell(row.sourceArtifact)}\` |`)
      .join('\n') || '| none | `n/a` | `n/a` |';

  return `# Owner Evidence Completion Drill

Generated: ${drill.generatedAt}

Schema: \`${drill.schemaVersion}\`

Status: \`${drill.status}\`

Goal complete: \`${drill.goalComplete}\`

Primary source artifact: \`${drill.sourceArtifact}\`

Source artifact count: ${drill.sourceArtifactCount}

Source trace rows: ${drill.sourceTraceCount}

This drill consolidates the live-proof, partner/outcome, and manual WCAG owner packets into one gate-by-gate execution matrix. It is not launch proof.

## Evidence Boundary

${drill.evidenceBoundary}

## Source Trace

Trace boundary: ${drill.sourceTraceBoundary}

| Key | Artifact | Source anchor |
| --- | --- | --- |
${sourceTraceRows}

## Local Evidence Safety Preflight

Source artifact: \`${drill.localSafetyStatus.sourceArtifact}\`

Status: \`${drill.localSafetyStatus.status}\`

Protected paths ignored: ${drill.localSafetyStatus.ignoredProtectedPathCount}/${drill.localSafetyStatus.protectedPathCount}

Tracked sensitive file violations: ${drill.localSafetyStatus.trackedSensitiveFileViolationCount}

Staged sensitive path violations: ${drill.localSafetyStatus.stagedSensitivePathViolationCount}

Does-not-prove boundaries: ${drill.localSafetyStatus.doesNotProveCount}

Boundary: ${drill.localSafetyStatus.evidenceBoundary}

Source trace rows: ${drill.localSafetyStatus.sourceTraceCount}

### Local Evidence Safety Source Trace

Trace boundary: ${drill.localSafetyStatus.sourceTraceBoundary}

| Key | Value | Source artifact |
| --- | --- | --- |
${localSafetySourceTraceRows}

## Counts

| Item | Count |
| --- | ---: |
| Required owner gates | ${drill.requiredGateCount} |
| Blocked owner gates | ${drill.blockedGateCount} |
| Owner action queue count | ${drill.ownerActionQueueCount} |
| Owner prep action count | ${drill.ownerActionNeededCount} |
| Owner prep by-gate maps | ${drill.ownerPrepActionNeededByGateCount} |
| Operational access prerequisites | ${drill.operationalAccessPrerequisiteCount} |
| Packet groups | ${drill.packetCount} |
| Official reference URLs | ${drill.officialReferenceCount} |
| Matrix rows | ${drill.matrixRowCount} |
| Recommended commands | ${drill.recommendedCommandOrderCount} |
| Recommended operational access commands | ${drill.recommendedOperationalAccessCommandCount} |
| Does-not-prove boundaries | ${drill.doesNotProveCount} |

## Owner Prep Actions By Gate

Source artifact: \`${drill.ownerPrepActionNeededByGateSourceArtifact}\`

Boundary: ${drill.ownerPrepActionNeededByGateBoundary}

| Gate | Owner prep action count | Blocking owner-prep actions | Source |
| --- | ---: | --- | --- |
${ownerPrepByGateRows}

## Packet Basis

| Packet | Status | Official refs | Ref IDs | Markdown | CSV | Generate command |
| --- | --- | ---: | --- | --- | --- | --- |
${packetRows}

## Recommended Command Order

${commandRows}

## Recommended Operational Access Commands

These commands are owner-run access probes and local status refreshes. They must not be treated as deploy, ingest, payment, or launch proof.

${operationalCommandRows || '- none'}

## Operational Access Prerequisites

These rows are owner access prerequisites for live deployment closeout claims. They are not counted as launch-evidence gates.

${drill.operationalAccessPrerequisites
  .map((item) => {
    const blockingChecks = item.blockingCheckIds?.length ? item.blockingCheckIds.join('; ') : 'none';
    return `- ${item.id}: ${item.label}; status=\`${item.status}\`; strict verifier=\`${item.nextCommand}\`; blocking checks=${blockingChecks}`;
  })
  .join('\n') || '- none'}

## Completion Matrix

CSV companion: \`${OUTPUT_CSV}\`

| # | Gate | Current status | Completion state | Packet | Packet status | Blocking owner actions | Acceptance verifier |
| ---: | --- | --- | --- | --- | --- | --- | --- |
${matrixRows}

## Does Not Prove

${drill.doesNotProve.map((item) => `- ${item}`).join('\n')}
`;
}

function renderCsv(drill) {
  const header = [
    'order',
    'gate_id',
    'label',
    'track',
    'current_status',
    'completion_state',
    'packet_type',
    'packet_label',
    'packet_status',
    'packet_markdown',
    'packet_csv',
    'packet_generator_command',
    'expected_proof_artifact',
    'accepted_when',
    'acceptance_verifier_command',
    'owner_prep_command',
    'owner_action',
    'blocking_owner_action_count',
    'blocking_owner_actions',
    'source_boundary',
    'risk_if_skipped',
    'raw_evidence_policy',
    'repo_does_not_do',
    'does_not_prove',
  ];
  const rows = drill.completionRows.map((row) =>
    [
      row.order,
      row.gateId,
      row.label,
      row.track,
      row.currentStatus,
      row.completionState,
      row.packetType,
      row.packetLabel,
      row.packetStatus,
      row.packetMarkdown,
      row.packetCsv,
      row.packetGeneratorCommand,
      row.expectedProofArtifact,
      row.acceptedWhen,
      row.acceptanceVerifierCommand,
      row.ownerPrepCommand,
      row.ownerAction,
      row.blockingOwnerActionCount,
      row.blockingOwnerActions,
      row.sourceBoundary,
      row.riskIfSkipped,
      row.rawEvidencePolicy,
      row.repoDoesNotDo,
      row.doesNotProve,
    ].map(csvCell).join(',')
  );
  return `${header.map(csvCell).join(',')}\n${rows.join('\n')}\n`;
}

async function writeDrill(drill) {
  await mkdir('docs/commercialization', { recursive: true });
  await writeFile(OUTPUT_JSON, `${JSON.stringify(drill, null, 2)}\n`);
  await writeFile(OUTPUT_MARKDOWN, renderMarkdown(drill));
  await writeFile(OUTPUT_CSV, renderCsv(drill));
}

const drill = await buildDrill();
if (hasFlag('--write')) await writeDrill(drill);

console.log(JSON.stringify({
  ok: true,
  schemaVersion: drill.schemaVersion,
  status: drill.status,
  goalComplete: drill.goalComplete,
  requiredGateCount: drill.requiredGateCount,
  blockedGateCount: drill.blockedGateCount,
  ownerActionQueueCount: drill.ownerActionQueueCount,
  ownerActionNeededCount: drill.ownerActionNeededCount,
  ownerPrepActionNeededByGateCount: drill.ownerPrepActionNeededByGateCount,
  operationalAccessPrerequisiteCount: drill.operationalAccessPrerequisiteCount,
  matrixRowCount: drill.matrixRowCount,
  recommendedCommandOrderCount: drill.recommendedCommandOrderCount,
  recommendedOperationalAccessCommandCount: drill.recommendedOperationalAccessCommandCount,
  doesNotProveCount: drill.doesNotProveCount,
  sourceArtifact: drill.sourceArtifact,
  sourceArtifactCount: drill.sourceArtifactCount,
  sourceTraceCount: drill.sourceTraceCount,
  outputs: drill.outputArtifacts,
  evidenceBoundary: drill.evidenceBoundary,
}, null, 2));
