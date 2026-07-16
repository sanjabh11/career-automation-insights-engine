#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CHECKPOINT_STANDARD_REFS,
  MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS,
  OFFICIAL_REFERENCE_REQUIREMENTS,
  REQUIRED_ACCESSIBILITY_SUPPORT_BASELINE_COUNT,
  REQUIRED_CHECKPOINT_IDS,
  REQUIRED_COMPLETE_PROCESS_IDS,
  REQUIRED_ROUTE_PATHS,
  REVIEW_RECORD_ARCHIVE_ATTESTATIONS,
  SCHEMA_VERSION as MANUAL_WCAG_EVIDENCE_SCHEMA_VERSION,
} from './verify-manual-wcag-evidence.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-manual-wcag-review-packet-alignment.mjs');

const PACKET_JSON_PATH = 'docs/commercialization/manual-wcag-review-packet-latest.json';
const PACKET_MARKDOWN_PATH = 'docs/commercialization/manual-wcag-review-packet-latest.md';
const PACKET_CSV_PATH = 'docs/commercialization/manual-wcag-review-matrix-latest.csv';
const SOURCE_TRACE_BOUNDARY =
  'This source trace maps each generated manual WCAG review packet provenance row to the sourceArtifacts key used by the owner worksheet. It does not perform manual accessibility review, read owner-held reviewer notes, screenshots, recordings, assistive-technology transcripts, issue details, evaluation-tool output, sample archives, artifact hash source maps, private user data, or upgrade launch readiness.';
const HASHER_INPUT_BOUNDARY =
  'When hashing proof artifacts, use ordinary owner-held files outside git or under an ignored local proof path. The hasher rejects symbolic links, hard-linked files, tracked files, staged files, and non-ignored repository files; copy proof material to a single-link owner-held file before hashing.';
const LATEST_EVIDENCE_PATH = 'docs/commercialization/manual-wcag-evidence-latest.json';
const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const HASHER_PATH = 'scripts/hash-owner-evidence-artifacts.mjs';
const MANUAL_GATE_ID = 'manual_wcag_evidence';
const LOCAL_EVIDENCE_PATH = 'docs/commercialization/manual-wcag-evidence.local.json';
const NEXT_COMMANDS = [
  'npm run verify:commercial-a11y',
  'npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>',
  `npm run verify:manual-wcag-evidence -- --evidence ${LOCAL_EVIDENCE_PATH} --require-complete`,
  'npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-intake docs/commercialization/commercial-evidence-intake.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json',
];
const DOES_NOT_PROVE = [
  'WCAG conformance statement',
  'Legal compliance',
  'Institutional procurement approval',
  'Manual review completion',
  'Assistive-technology coverage beyond reviewed combinations',
  'Future accessibility after code changes',
];
const CSV_COLUMNS = [
  'route_path',
  'route_label',
  'checkpoint_id',
  'checkpoint_label',
  'standard_refs',
  'official_reference_urls',
  'review_status',
  'automated_smoke_status',
  'automated_viewports',
  'keyboard_tab_stops_checked',
  'interactive_count_max',
  'owner_held_artifacts',
  'evidence_json_path',
  'does_not_prove',
];
const ACCEPTANCE_CHECKLIST_IDS = [
  'scope-and-sample',
  'complete-process-and-support-baseline',
  'evaluation-specifics-and-archive',
  'owner-evidence-archive',
  'official-reference-basis',
  'reviewer-attestation',
  'checkpoint-coverage',
  'artifact-hashes-and-issue-closeout',
];

function writeJson(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function csvCell(value) {
  const source = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return `"${source.replace(/"/g, '""')}"`;
}

function referenceUrl(id) {
  return OFFICIAL_REFERENCE_REQUIREMENTS.find((reference) => reference.id === id)?.url || '';
}

function latestEvidence() {
  return {
    generatedAt: '2026-06-05T00:00:00.000Z',
    schemaVersion: MANUAL_WCAG_EVIDENCE_SCHEMA_VERSION,
    status: 'no_local_evidence',
    acceptedCheckpointCount: 0,
    requiredCheckpointCount: REQUIRED_CHECKPOINT_IDS.length,
    requiredRouteCount: REQUIRED_ROUTE_PATHS.length,
    manualWcagGateSatisfied: false,
  };
}

function closeoutStatus() {
  return {
    generatedAt: '2026-06-05T00:00:00.000Z',
    schemaVersion: '2026-06-04.apo-owner-evidence-closeout-status.v1',
    goalComplete: false,
    ownerActionQueue: [
      {
        id: MANUAL_GATE_ID,
        status: 'blocked_missing_manual_wcag_evidence',
        ownerAction: 'Complete owner-held manual WCAG evidence from the generated review packet.',
        ownerPrepCommand: 'npm run generate:manual-wcag-review-packet && npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>',
        nextCommand: `npm run verify:manual-wcag-evidence -- --evidence ${LOCAL_EVIDENCE_PATH} --require-complete`,
      },
    ],
  };
}

function latestEvidenceSummary(value = latestEvidence()) {
  return {
    latestEvidencePath: LATEST_EVIDENCE_PATH,
    status: value.status,
    acceptedCheckpointCount: value.acceptedCheckpointCount,
    requiredCheckpointCount: value.requiredCheckpointCount,
    requiredRouteCount: value.requiredRouteCount,
    manualWcagGateSatisfied: value.manualWcagGateSatisfied,
  };
}

function closeoutSummary(value = closeoutStatus()) {
  return {
    closeoutStatusPath: CLOSEOUT_STATUS_PATH,
    goalComplete: value.goalComplete === true,
    relevantOwnerActions: value.ownerActionQueue.map((item) => ({
      id: item.id,
      status: item.status,
      ownerAction: item.ownerAction,
      ownerPrepCommand: item.ownerPrepCommand,
      nextCommand: item.nextCommand,
    })),
  };
}

function routePlan() {
  return REQUIRED_ROUTE_PATHS.map((routePath) => ({
    routePath,
    routeLabel: routePath,
    automatedSmokeStatus: 'automated_smoke_passed',
    automatedResultCount: 3,
    automatedViewportCount: 3,
    viewports: ['mobile', 'tablet', 'desktop'],
    keyboardTabStopsChecked: 3,
    interactiveCountMax: 2,
    targetSizeReview: ['automated_context_only'],
    textSpacingReview: ['automated_context_only'],
    boundary:
      'Automated smoke context is only a pre-review signal; it does not prove manual WCAG evidence, assistive-technology behavior, legal compliance, procurement approval, or future accessibility.',
  }));
}

function checkpointPlan() {
  return REQUIRED_CHECKPOINT_IDS.map((checkpointId) => ({
    checkpointId,
    label: `${checkpointId} label`,
    reviewerGoal: `${checkpointId} reviewer goal`,
    standardRefs: CHECKPOINT_STANDARD_REFS[checkpointId] || [],
    officialReferenceUrls: (CHECKPOINT_STANDARD_REFS[checkpointId] || []).map(referenceUrl),
    requiredEvidenceSummary: [`${checkpointId} evidence summary`],
    ownerHeldArtifacts: [`${checkpointId} owner artifact`],
    evidenceJsonPath: `checkpointResults[].checkpointId=${checkpointId}`,
    acceptedStatuses: ['passed', 'passed_with_remediation', 'not_applicable_with_rationale'],
    failureBoundary:
      'If unresolved issues remain, keep this checkpoint failed or blocked and do not mark the manual WCAG evidence gate complete.',
    doesNotProve: [
      'WCAG conformance statement',
      'Legal compliance',
      'Institutional procurement approval',
      'Assistive-technology coverage beyond reviewed combinations',
      'Future accessibility after code changes',
    ],
  }));
}

function acceptanceChecklist() {
  const checklistText = [
    ...REVIEW_RECORD_ARCHIVE_ATTESTATIONS,
    ...MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS,
    'evaluationScope.routesReviewed',
    'checkpointResults[].artifactHashes',
  ];
  return ACCEPTANCE_CHECKLIST_IDS.map((id) => ({
    id,
    label: `${id} checklist`,
    verifierPaths: checklistText,
    acceptedWhen: `${id} accepted when all canonical manual WCAG verifier requirements are present.`,
    ownerHeldEvidence: [`${id} owner evidence`],
    boundary: 'Checklist fixture boundary; does not prove manual review completion or WCAG conformance.',
  }));
}

function matrix(routeRows = routePlan(), checkpointRows = checkpointPlan()) {
  return routeRows.flatMap((route) =>
    checkpointRows.map((checkpoint) => ({
      routePath: route.routePath,
      routeLabel: route.routeLabel,
      checkpointId: checkpoint.checkpointId,
      checkpointLabel: checkpoint.label,
      standardRefs: checkpoint.standardRefs,
      officialReferenceUrls: checkpoint.officialReferenceUrls,
      reviewStatus: 'owner_manual_review_required',
      automatedSmokeStatus: route.automatedSmokeStatus,
      automatedViewports: route.viewports,
      keyboardTabStopsChecked: route.keyboardTabStopsChecked,
      interactiveCountMax: route.interactiveCountMax,
      ownerHeldArtifacts: checkpoint.ownerHeldArtifacts,
      evidenceJsonPath: checkpoint.evidenceJsonPath,
      doesNotProve: checkpoint.doesNotProve,
    })),
  );
}

function buildSourceTrace(sourceArtifacts) {
  return Object.entries(sourceArtifacts).map(([key, artifactPath]) => ({
    key,
    artifactPath,
    sourceArtifact: `${PACKET_JSON_PATH}#sourceArtifacts.${key}`,
  }));
}

function packet(evidence = latestEvidence(), closeout = closeoutStatus()) {
  const routeRows = routePlan();
  const checkpointRows = checkpointPlan();
  const rows = matrix(routeRows, checkpointRows);
  const sourceArtifacts = {
    automatedAccessibilityAudit: 'docs/commercialization/commercial-accessibility-audit-latest.json',
    manualEvidenceTemplate: 'docs/commercialization/manual-wcag-evidence-template.json',
    ownerHasher: HASHER_PATH,
    latestManualWcagEvidence: LATEST_EVIDENCE_PATH,
    closeoutStatus: CLOSEOUT_STATUS_PATH,
    manualEvidenceVerifier: 'scripts/verify-manual-wcag-evidence.mjs',
  };
  const sourceTrace = buildSourceTrace(sourceArtifacts);
  return {
    generatedAt: '2026-06-05T00:00:00.000Z',
    schemaVersion: '2026-06-04.apo-manual-wcag-review-packet.v1',
    status: 'owner_manual_review_required',
    manualEvidenceSchemaVersion: MANUAL_WCAG_EVIDENCE_SCHEMA_VERSION,
    sourceArtifact: 'docs/commercialization/manual-wcag-evidence-template.json',
    sourceArtifactCount: 6,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_TRACE_BOUNDARY,
    sourceArtifacts,
    outputs: {
      json: PACKET_JSON_PATH,
      markdown: PACKET_MARKDOWN_PATH,
      csv: PACKET_CSV_PATH,
    },
    localManualEvidencePath: LOCAL_EVIDENCE_PATH,
    evidenceBoundary:
      'This packet is an owner-review worksheet only. Raw reviewer notes, screenshots, recordings, assistive-technology transcripts, reviewer identity, issue tracker details, evaluation-tool output, sample archives, artifact hash source maps, and private user data must remain owner-held outside tracked files.',
    hasherInputBoundary: HASHER_INPUT_BOUNDARY,
    latestEvidenceSummary: latestEvidenceSummary(evidence),
    closeoutSummary: closeoutSummary(closeout),
    requiredRouteCount: REQUIRED_ROUTE_PATHS.length,
    requiredCheckpointCount: REQUIRED_CHECKPOINT_IDS.length,
    requiredOfficialReferenceCount: OFFICIAL_REFERENCE_REQUIREMENTS.length,
    officialReferenceCount: OFFICIAL_REFERENCE_REQUIREMENTS.length,
    requiredCompleteProcessIds: [...REQUIRED_COMPLETE_PROCESS_IDS],
    requiredCompleteProcessCount: REQUIRED_COMPLETE_PROCESS_IDS.length,
    requiredAccessibilitySupportBaselineCount: REQUIRED_ACCESSIBILITY_SUPPORT_BASELINE_COUNT,
    ownerEvidenceArchiveRequirements: [...MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS],
    requiredOwnerEvidenceArchiveRequirementCount: MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS.length,
    matrixRowCount: rows.length,
    routeReviewPlanCount: routeRows.length,
    checkpointReviewPlanCount: checkpointRows.length,
    routeCheckpointMatrixRowCount: rows.length,
    verifierAcceptanceChecklistCount: ACCEPTANCE_CHECKLIST_IDS.length,
    officialReferences: OFFICIAL_REFERENCE_REQUIREMENTS,
    routeReviewPlan: routeRows,
    checkpointReviewPlan: checkpointRows,
    verifierAcceptanceChecklist: acceptanceChecklist(),
    routeCheckpointMatrix: rows,
    nextCommands: [...NEXT_COMMANDS],
    nextCommandCount: NEXT_COMMANDS.length,
    doesNotProve: [...DOES_NOT_PROVE],
    doesNotProveCount: DOES_NOT_PROVE.length,
  };
}

function renderCsv(value) {
  const rows = value.routeCheckpointMatrix.map((row) =>
    [
      row.routePath,
      row.routeLabel,
      row.checkpointId,
      row.checkpointLabel,
      row.standardRefs,
      row.officialReferenceUrls,
      row.reviewStatus,
      row.automatedSmokeStatus,
      row.automatedViewports,
      row.keyboardTabStopsChecked,
      row.interactiveCountMax,
      row.ownerHeldArtifacts,
      row.evidenceJsonPath,
      row.doesNotProve,
    ].map(csvCell).join(','),
  );
  return `${CSV_COLUMNS.map(csvCell).join(',')}\n${rows.join('\n')}\n`;
}

function renderMarkdown(value) {
  const sourceTraceRows = value.sourceTrace
    .map((row) => `| ${row.key} | \`${row.artifactPath}\` | \`${row.sourceArtifact}\` |`)
    .join('\n');

  return `# Manual WCAG Review Packet

Status: \`${value.status}\`

Primary source artifact: \`${value.sourceArtifact}\`

Source artifact count: ${value.sourceArtifactCount}

Source trace rows: ${value.sourceTraceCount}

## Hasher Input Boundary

${value.hasherInputBoundary}

## Source Trace

${value.sourceTraceBoundary}

| Key | Artifact | Source anchor |
| --- | --- | --- |
${sourceTraceRows}

## Counts

| Item | Count |
| --- | ---: |
| Official W3C/WAI references | ${value.officialReferenceCount} |
| Route review plan rows | ${value.routeReviewPlanCount} |
| Checkpoint review plan rows | ${value.checkpointReviewPlanCount} |
| Route/checkpoint matrix rows | ${value.routeCheckpointMatrixRowCount} |
| Next commands | ${value.nextCommandCount} |
| Does-not-prove boundaries | ${value.doesNotProveCount} |

## Latest Manual Evidence Summary

\`${LATEST_EVIDENCE_PATH}\`

## Closeout Summary

\`${CLOSEOUT_STATUS_PATH}\`

Tracked CSV: \`${PACKET_CSV_PATH}\`

Store only redacted metadata and hashes in \`${LOCAL_EVIDENCE_PATH}\`.

- \`npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>\`

WCAG conformance statement remains unproven.
`;
}

function writeBaseArtifacts(root) {
  const evidence = latestEvidence();
  const closeout = closeoutStatus();
  const value = packet(evidence, closeout);
  writeJson(root, LATEST_EVIDENCE_PATH, evidence);
  writeJson(root, CLOSEOUT_STATUS_PATH, closeout);
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-manual-wcag-review-packet-${name}-`));
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
    name: 'aligned-manual-wcag-review-packet-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
  },
  {
    name: 'source-artifact-drift-fails',
    expectedCode: 1,
    expectedText: 'packet.sourceArtifacts.manualEvidenceVerifier',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.sourceArtifacts.manualEvidenceVerifier = 'scripts/verify-manual-wcag-evidence-old.mjs';
      });
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
        value.sourceArtifact = 'docs/commercialization/commercial-accessibility-audit-latest.json';
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
        source.replace(`${PACKET_JSON_PATH}#sourceArtifacts.manualEvidenceVerifier`, `${PACKET_JSON_PATH}#sourceArtifacts.closeoutStatus`)
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
    name: 'route-review-plan-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet.routeReviewPlanCount',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.routeReviewPlanCount += 1;
      });
    },
  },
  {
    name: 'checkpoint-review-plan-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet.checkpointReviewPlanCount',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.checkpointReviewPlanCount += 1;
      });
    },
  },
  {
    name: 'route-checkpoint-matrix-row-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet.routeCheckpointMatrixRowCount',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.routeCheckpointMatrixRowCount += 1;
      });
    },
  },
  {
    name: 'next-command-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet.nextCommandCount',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.nextCommandCount += 1;
      });
    },
  },
  {
    name: 'does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet.doesNotProveCount',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.doesNotProveCount += 1;
      });
    },
  },
  {
    name: 'packet-primary-source-artifact-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_primary_source_artifact_markdown_mismatch',
    mutate(root) {
      updateText(root, PACKET_MARKDOWN_PATH, (source) =>
        source.replace(
          'Primary source artifact: `docs/commercialization/manual-wcag-evidence-template.json`',
          'Primary source artifact: `docs/commercialization/commercial-accessibility-audit-latest.json`',
        )
      );
    },
  },
  {
    name: 'packet-official-reference-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_official_reference_count_markdown_mismatch',
    mutate(root) {
      updateText(root, PACKET_MARKDOWN_PATH, (source) =>
        source.replace(
          `| Official W3C/WAI references | ${OFFICIAL_REFERENCE_REQUIREMENTS.length} |`,
          `| Official W3C/WAI references | ${OFFICIAL_REFERENCE_REQUIREMENTS.length - 1} |`,
        )
      );
    },
  },
  {
    name: 'packet-basis-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_basis_count_markdown_mismatch',
    mutate(root) {
      updateText(root, PACKET_MARKDOWN_PATH, (source) =>
        source.replace('| Route/checkpoint matrix rows | 72 |', '| Route/checkpoint matrix rows | 71 |')
      );
    },
  },
  {
    name: 'route-checkpoint-matrix-missing-row-fails',
    expectedCode: 1,
    expectedText: 'packet.routeCheckpointMatrix.pairs',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.routeCheckpointMatrix.pop();
      });
    },
  },
  {
    name: 'latest-evidence-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'packet.latestEvidenceSummary',
    mutate(root) {
      updateJson(root, LATEST_EVIDENCE_PATH, (value) => {
        value.acceptedCheckpointCount = 2;
      });
    },
  },
  {
    name: 'closeout-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'packet.closeoutSummary',
    mutate(root) {
      updateJson(root, CLOSEOUT_STATUS_PATH, (value) => {
        value.ownerActionQueue[0].nextCommand = 'npm run verify:manual-wcag-evidence --wrong';
      });
    },
  },
  {
    name: 'csv-matrix-drift-fails',
    expectedCode: 1,
    expectedText: 'csv_route_checkpoint_matrix_mismatch',
    mutate(root) {
      updateText(root, PACKET_CSV_PATH, (source) => source.replace('owner_manual_review_required', 'review_complete'));
    },
  },
  {
    name: 'next-command-sequence-drift-fails',
    expectedCode: 1,
    expectedText: 'packet.nextCommands',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.nextCommands[2] = 'npm run verify:manual-wcag-evidence';
      });
    },
  },
  {
    name: 'markdown-boundary-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_text',
    mutate(root) {
      updateText(root, PACKET_MARKDOWN_PATH, (source) => source.replace('WCAG conformance statement', 'accessibility approved'));
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText);
}

console.log(`Manual WCAG review packet alignment fixture verification passed: ${cases.length} cases.`);
