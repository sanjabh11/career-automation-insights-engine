#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CHECKPOINT_STANDARD_REFS,
  DEFAULT_INPUT_PATH as DEFAULT_MANUAL_WCAG_EVIDENCE_PATH,
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
const args = process.argv.slice(2);

function readFlagValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const root = path.resolve(readFlagValue('--root', path.resolve(__dirname, '..')));

const PACKET_JSON_PATH = 'docs/commercialization/manual-wcag-review-packet-latest.json';
const PACKET_MARKDOWN_PATH = 'docs/commercialization/manual-wcag-review-packet-latest.md';
const PACKET_CSV_PATH = 'docs/commercialization/manual-wcag-review-matrix-latest.csv';
const AUDIT_JSON_PATH = 'docs/commercialization/commercial-accessibility-audit-latest.json';
const TEMPLATE_PATH = 'docs/commercialization/manual-wcag-evidence-template.json';
const LATEST_EVIDENCE_PATH = 'docs/commercialization/manual-wcag-evidence-latest.json';
const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const HASHER_PATH = 'scripts/hash-owner-evidence-artifacts.mjs';
const MANUAL_EVIDENCE_VERIFIER_PATH = 'scripts/verify-manual-wcag-evidence.mjs';
const PACKET_SCHEMA_VERSION = '2026-06-04.apo-manual-wcag-review-packet.v1';
const MANUAL_GATE_ID = 'manual_wcag_evidence';
const SOURCE_TRACE_BOUNDARY =
  'This source trace maps each generated manual WCAG review packet provenance row to the sourceArtifacts key used by the owner worksheet. It does not perform manual accessibility review, read owner-held reviewer notes, screenshots, recordings, assistive-technology transcripts, issue details, evaluation-tool output, sample archives, artifact hash source maps, private user data, or upgrade launch readiness.';
const HASHER_INPUT_BOUNDARY =
  'When hashing proof artifacts, use ordinary owner-held files outside git or under an ignored local proof path. The hasher rejects symbolic links, hard-linked files, tracked files, staged files, and non-ignored repository files; copy proof material to a single-link owner-held file before hashing.';
const REQUIRED_NEXT_COMMANDS = [
  'npm run verify:commercial-a11y',
  'npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>',
  `npm run verify:manual-wcag-evidence -- --evidence ${DEFAULT_MANUAL_WCAG_EVIDENCE_PATH} --require-complete`,
  'npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-intake docs/commercialization/commercial-evidence-intake.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json',
];
const REQUIRED_DOES_NOT_PROVE = [
  'WCAG conformance statement',
  'Legal compliance',
  'Institutional procurement approval',
  'Manual review completion',
  'Assistive-technology coverage beyond reviewed combinations',
  'Future accessibility after code changes',
];
const REQUIRED_CSV_COLUMNS = [
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
const REQUIRED_ACCEPTANCE_CHECKLIST_IDS = [
  'scope-and-sample',
  'complete-process-and-support-baseline',
  'evaluation-specifics-and-archive',
  'owner-evidence-archive',
  'official-reference-basis',
  'reviewer-attestation',
  'checkpoint-coverage',
  'artifact-hashes-and-issue-closeout',
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
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

function expectedLatestEvidenceSummary(latestEvidence) {
  return {
    latestEvidencePath: LATEST_EVIDENCE_PATH,
    status: latestEvidence.status || 'unknown',
    acceptedCheckpointCount: latestEvidence.acceptedCheckpointCount || 0,
    requiredCheckpointCount: latestEvidence.requiredCheckpointCount || REQUIRED_CHECKPOINT_IDS.length,
    requiredRouteCount: latestEvidence.requiredRouteCount || REQUIRED_ROUTE_PATHS.length,
    manualWcagGateSatisfied: latestEvidence.manualWcagGateSatisfied === true,
  };
}

function expectedCloseoutSummary(closeoutStatus) {
  const queue = Array.isArray(closeoutStatus.ownerActionQueue) ? closeoutStatus.ownerActionQueue : [];
  return {
    closeoutStatusPath: CLOSEOUT_STATUS_PATH,
    goalComplete: closeoutStatus.goalComplete === true,
    relevantOwnerActions: queue
      .filter((item) => item.id === MANUAL_GATE_ID)
      .map((item) => ({
        id: item.id,
        status: item.status,
        ownerAction: item.ownerAction,
        ownerPrepCommand: item.ownerPrepCommand,
        nextCommand: item.nextCommand,
      })),
  };
}

function expectedMatrixPairs() {
  return REQUIRED_ROUTE_PATHS.flatMap((routePath) =>
    REQUIRED_CHECKPOINT_IDS.map((checkpointId) => `${routePath}::${checkpointId}`)
  );
}

function validatePacketShape(errors, packet) {
  requireExact(errors, 'packet.schemaVersion', PACKET_SCHEMA_VERSION, packet.schemaVersion);
  requireExact(errors, 'packet.status', 'owner_manual_review_required', packet.status);
  requireExact(errors, 'packet.manualEvidenceSchemaVersion', MANUAL_WCAG_EVIDENCE_SCHEMA_VERSION, packet.manualEvidenceSchemaVersion);
  requireExact(errors, 'packet.sourceArtifacts.automatedAccessibilityAudit', AUDIT_JSON_PATH, packet.sourceArtifacts?.automatedAccessibilityAudit);
  requireExact(errors, 'packet.sourceArtifacts.manualEvidenceTemplate', TEMPLATE_PATH, packet.sourceArtifacts?.manualEvidenceTemplate);
  requireExact(errors, 'packet.sourceArtifacts.ownerHasher', HASHER_PATH, packet.sourceArtifacts?.ownerHasher);
  requireExact(errors, 'packet.sourceArtifacts.latestManualWcagEvidence', LATEST_EVIDENCE_PATH, packet.sourceArtifacts?.latestManualWcagEvidence);
  requireExact(errors, 'packet.sourceArtifacts.closeoutStatus', CLOSEOUT_STATUS_PATH, packet.sourceArtifacts?.closeoutStatus);
  requireExact(errors, 'packet.sourceArtifacts.manualEvidenceVerifier', MANUAL_EVIDENCE_VERIFIER_PATH, packet.sourceArtifacts?.manualEvidenceVerifier);

  const sourceArtifacts = packet.sourceArtifacts && typeof packet.sourceArtifacts === 'object' ? packet.sourceArtifacts : {};
  const expectedPrimarySourceArtifact = sourceArtifacts.manualEvidenceTemplate;
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

  requireExact(errors, 'packet.outputs.json', PACKET_JSON_PATH, packet.outputs?.json);
  requireExact(errors, 'packet.outputs.markdown', PACKET_MARKDOWN_PATH, packet.outputs?.markdown);
  requireExact(errors, 'packet.outputs.csv', PACKET_CSV_PATH, packet.outputs?.csv);
  requireExact(errors, 'packet.localManualEvidencePath', DEFAULT_MANUAL_WCAG_EVIDENCE_PATH, packet.localManualEvidencePath);
  requireExact(errors, 'packet.requiredRouteCount', REQUIRED_ROUTE_PATHS.length, packet.requiredRouteCount);
  requireExact(errors, 'packet.requiredCheckpointCount', REQUIRED_CHECKPOINT_IDS.length, packet.requiredCheckpointCount);
  requireExact(errors, 'packet.requiredOfficialReferenceCount', OFFICIAL_REFERENCE_REQUIREMENTS.length, packet.requiredOfficialReferenceCount);
  requireExact(errors, 'packet.requiredCompleteProcessIds', REQUIRED_COMPLETE_PROCESS_IDS, packet.requiredCompleteProcessIds);
  requireExact(errors, 'packet.requiredCompleteProcessCount', REQUIRED_COMPLETE_PROCESS_IDS.length, packet.requiredCompleteProcessCount);
  requireExact(errors, 'packet.requiredAccessibilitySupportBaselineCount', REQUIRED_ACCESSIBILITY_SUPPORT_BASELINE_COUNT, packet.requiredAccessibilitySupportBaselineCount);
  requireExact(errors, 'packet.ownerEvidenceArchiveRequirements', MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS, packet.ownerEvidenceArchiveRequirements);
  requireExact(errors, 'packet.requiredOwnerEvidenceArchiveRequirementCount', MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS.length, packet.requiredOwnerEvidenceArchiveRequirementCount);
  requireExact(errors, 'packet.matrixRowCount', REQUIRED_ROUTE_PATHS.length * REQUIRED_CHECKPOINT_IDS.length, packet.matrixRowCount);
  requireExact(errors, 'packet.routeReviewPlanCount', REQUIRED_ROUTE_PATHS.length, packet.routeReviewPlanCount);
  requireExact(errors, 'packet.checkpointReviewPlanCount', REQUIRED_CHECKPOINT_IDS.length, packet.checkpointReviewPlanCount);
  requireExact(errors, 'packet.routeCheckpointMatrixRowCount', REQUIRED_ROUTE_PATHS.length * REQUIRED_CHECKPOINT_IDS.length, packet.routeCheckpointMatrixRowCount);
  requireExact(errors, 'packet.verifierAcceptanceChecklistCount', REQUIRED_ACCEPTANCE_CHECKLIST_IDS.length, packet.verifierAcceptanceChecklistCount);
  requireExact(errors, 'packet.nextCommands', REQUIRED_NEXT_COMMANDS, packet.nextCommands);
  requireExact(errors, 'packet.nextCommandCount', REQUIRED_NEXT_COMMANDS.length, packet.nextCommandCount);
  requireExact(errors, 'packet.doesNotProve', REQUIRED_DOES_NOT_PROVE, packet.doesNotProve);
  requireExact(errors, 'packet.doesNotProveCount', REQUIRED_DOES_NOT_PROVE.length, packet.doesNotProveCount);

  if (typeof packet.evidenceBoundary !== 'string' || !packet.evidenceBoundary.includes('Raw reviewer notes')) {
    addError(errors, 'missing_evidence_boundary', {
      expectedText: 'Raw reviewer notes',
      actual: packet.evidenceBoundary || '',
    });
  }
  requireExact(errors, 'packet.hasherInputBoundary', HASHER_INPUT_BOUNDARY, packet.hasherInputBoundary);

  const doesNotProve = Array.isArray(packet.doesNotProve) ? packet.doesNotProve : [];
  ['WCAG conformance statement', 'Legal compliance', 'Manual review completion'].forEach((text) => {
    if (!doesNotProve.includes(text)) addError(errors, 'missing_claim_boundary', { expectedText: text });
  });
}

function validateOfficialReferences(errors, packet) {
  const actual = packet.officialReferences || [];
  requireExact(errors, 'packet.officialReferences', OFFICIAL_REFERENCE_REQUIREMENTS, actual);
  if (packet.officialReferenceCount !== actual.length) {
    addError(errors, 'packet_official_reference_count_mismatch', {
      expected: actual.length,
      actual: packet.officialReferenceCount,
    });
  }
}

function validateRoutePlan(errors, packet) {
  const routePlan = Array.isArray(packet.routeReviewPlan) ? packet.routeReviewPlan : [];
  requireExact(errors, 'packet.routeReviewPlanCount.arrayParity', routePlan.length, packet.routeReviewPlanCount);
  requireExact(errors, 'packet.routeReviewPlan.routePaths', REQUIRED_ROUTE_PATHS, routePlan.map((route) => route.routePath));
  routePlan.forEach((route, index) => {
    if (typeof route.boundary !== 'string' || !route.boundary.includes('Automated smoke context is only a pre-review signal')) {
      addError(errors, 'route_plan_boundary_missing', { index, routePath: route.routePath || '' });
    }
    if (!['automated_smoke_passed', 'automated_context_missing_or_failed'].includes(route.automatedSmokeStatus)) {
      addError(errors, 'route_plan_automated_status_unknown', {
        index,
        routePath: route.routePath || '',
        actual: route.automatedSmokeStatus || '',
      });
    }
  });

}

function validateCheckpointPlan(errors, packet) {
  const checkpointPlan = Array.isArray(packet.checkpointReviewPlan) ? packet.checkpointReviewPlan : [];
  requireExact(errors, 'packet.checkpointReviewPlanCount.arrayParity', checkpointPlan.length, packet.checkpointReviewPlanCount);
  requireExact(
    errors,
    'packet.checkpointReviewPlan.checkpointIds',
    REQUIRED_CHECKPOINT_IDS,
    checkpointPlan.map((checkpoint) => checkpoint.checkpointId),
  );
  checkpointPlan.forEach((checkpoint, index) => {
    requireExact(
      errors,
      `packet.checkpointReviewPlan[${index}].standardRefs`,
      CHECKPOINT_STANDARD_REFS[checkpoint.checkpointId] || [],
      checkpoint.standardRefs,
    );
    if (!Array.isArray(checkpoint.ownerHeldArtifacts) || checkpoint.ownerHeldArtifacts.length === 0) {
      addError(errors, 'checkpoint_plan_missing_owner_artifacts', {
        checkpointId: checkpoint.checkpointId || '',
      });
    }
    if (typeof checkpoint.failureBoundary !== 'string' || !checkpoint.failureBoundary.includes('do not mark the manual WCAG evidence gate complete')) {
      addError(errors, 'checkpoint_plan_failure_boundary_missing', {
        checkpointId: checkpoint.checkpointId || '',
      });
    }
  });
}

function validateAcceptanceChecklist(errors, packet) {
  const checklist = Array.isArray(packet.verifierAcceptanceChecklist) ? packet.verifierAcceptanceChecklist : [];
  requireExact(errors, 'packet.verifierAcceptanceChecklist.ids', REQUIRED_ACCEPTANCE_CHECKLIST_IDS, checklist.map((item) => item.id));
  const serialized = stableJson(checklist);
  [
    ...REVIEW_RECORD_ARCHIVE_ATTESTATIONS,
    ...MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS,
    'evaluationScope.routesReviewed',
    'checkpointResults[].artifactHashes',
  ].forEach((expectedText) => {
    if (!serialized.includes(expectedText)) {
      addError(errors, 'acceptance_checklist_missing_text', { expectedText });
    }
  });
}

function validateMatrix(errors, packet) {
  const matrix = Array.isArray(packet.routeCheckpointMatrix) ? packet.routeCheckpointMatrix : [];
  requireExact(errors, 'packet.routeCheckpointMatrix.length', packet.matrixRowCount, matrix.length);
  requireExact(errors, 'packet.routeCheckpointMatrixRowCount.arrayParity', matrix.length, packet.routeCheckpointMatrixRowCount);
  requireExact(
    errors,
    'packet.routeCheckpointMatrix.pairs',
    expectedMatrixPairs(),
    matrix.map((row) => `${row.routePath}::${row.checkpointId}`),
  );

  matrix.forEach((row, index) => {
    requireExact(errors, `packet.routeCheckpointMatrix[${index}].standardRefs`, CHECKPOINT_STANDARD_REFS[row.checkpointId] || [], row.standardRefs);
    requireExact(errors, `packet.routeCheckpointMatrix[${index}].reviewStatus`, 'owner_manual_review_required', row.reviewStatus);
    requireExact(errors, `packet.routeCheckpointMatrix[${index}].evidenceJsonPath`, `checkpointResults[].checkpointId=${row.checkpointId}`, row.evidenceJsonPath);
    if (!Array.isArray(row.ownerHeldArtifacts) || row.ownerHeldArtifacts.length === 0) {
      addError(errors, 'matrix_row_missing_owner_artifacts', { index, checkpointId: row.checkpointId || '' });
    }
  });
}

function validateCsv(errors, packet, csvSource) {
  const { header, rows } = parseCsv(csvSource);
  const matrix = Array.isArray(packet.routeCheckpointMatrix) ? packet.routeCheckpointMatrix : [];
  requireExact(errors, 'csv.header', REQUIRED_CSV_COLUMNS, header);
  requireExact(errors, 'csv.rowCount', matrix.length, rows.length);

  matrix.forEach((row, index) => {
    const expected = {
      route_path: row.routePath,
      route_label: row.routeLabel,
      checkpoint_id: row.checkpointId,
      checkpoint_label: row.checkpointLabel,
      standard_refs: (row.standardRefs || []).join('; '),
      official_reference_urls: (row.officialReferenceUrls || []).join('; '),
      review_status: row.reviewStatus,
      automated_smoke_status: row.automatedSmokeStatus,
      automated_viewports: (row.automatedViewports || []).join('; '),
      keyboard_tab_stops_checked: String(row.keyboardTabStopsChecked ?? ''),
      interactive_count_max: String(row.interactiveCountMax ?? ''),
      owner_held_artifacts: (row.ownerHeldArtifacts || []).join('; '),
      evidence_json_path: row.evidenceJsonPath,
      does_not_prove: (row.doesNotProve || []).join('; '),
    };
    const actual = rows[index] || {};
    if (stableJson(expected) !== stableJson(actual)) {
      addError(errors, 'csv_route_checkpoint_matrix_mismatch', {
        index,
        routePath: row.routePath || '',
        checkpointId: row.checkpointId || '',
        expected,
        actual,
      });
    }
  });
}

function validateMarkdown(errors, packet, markdownSource) {
  [
    '# Manual WCAG Review Packet',
    'owner_manual_review_required',
    PACKET_CSV_PATH,
    DEFAULT_MANUAL_WCAG_EVIDENCE_PATH,
    'Latest Manual Evidence Summary',
    'Closeout Summary',
    'Hasher Input Boundary',
    HASHER_INPUT_BOUNDARY,
    'npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>',
    'WCAG conformance statement',
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_text', { expectedText });
    }
  });

  [
    `Primary source artifact: \`${TEMPLATE_PATH}\``,
    `Source artifact count: ${packet.sourceArtifactCount}`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'packet_primary_source_artifact_markdown_mismatch', { expectedText });
    }
  });
  [
    `Source trace rows: ${packet.sourceTraceCount}`,
    '## Source Trace',
    SOURCE_TRACE_BOUNDARY,
    `${PACKET_JSON_PATH}#sourceArtifacts.manualEvidenceTemplate`,
    `${PACKET_JSON_PATH}#sourceArtifacts.ownerHasher`,
    `${PACKET_JSON_PATH}#sourceArtifacts.manualEvidenceVerifier`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'packet_source_trace_markdown_mismatch', { expectedText });
    }
  });

  const expectedOfficialReferenceCountText = `| Official W3C/WAI references | ${OFFICIAL_REFERENCE_REQUIREMENTS.length} |`;
  if (!markdownSource.includes(expectedOfficialReferenceCountText)) {
    addError(errors, 'packet_official_reference_count_markdown_mismatch', {
      expectedText: expectedOfficialReferenceCountText,
    });
  }

  [
    `| Route review plan rows | ${REQUIRED_ROUTE_PATHS.length} |`,
    `| Checkpoint review plan rows | ${REQUIRED_CHECKPOINT_IDS.length} |`,
    `| Route/checkpoint matrix rows | ${REQUIRED_ROUTE_PATHS.length * REQUIRED_CHECKPOINT_IDS.length} |`,
    `| Next commands | ${REQUIRED_NEXT_COMMANDS.length} |`,
    `| Does-not-prove boundaries | ${REQUIRED_DOES_NOT_PROVE.length} |`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'packet_basis_count_markdown_mismatch', { expectedText });
    }
  });
}

function main() {
  const packet = readJson(PACKET_JSON_PATH);
  const latestEvidence = readJson(LATEST_EVIDENCE_PATH);
  const closeoutStatus = readJson(CLOSEOUT_STATUS_PATH);
  const csvSource = read(PACKET_CSV_PATH);
  const markdownSource = read(PACKET_MARKDOWN_PATH);
  const errors = [];

  validatePacketShape(errors, packet);
  validateOfficialReferences(errors, packet);
  validateRoutePlan(errors, packet);
  validateCheckpointPlan(errors, packet);
  validateAcceptanceChecklist(errors, packet);
  validateMatrix(errors, packet);
  requireExact(errors, 'packet.latestEvidenceSummary', expectedLatestEvidenceSummary(latestEvidence), packet.latestEvidenceSummary);
  requireExact(errors, 'packet.closeoutSummary', expectedCloseoutSummary(closeoutStatus), packet.closeoutSummary);
  validateCsv(errors, packet, csvSource);
  validateMarkdown(errors, packet, markdownSource);

  const result = {
    ok: errors.length === 0,
    sourcePacket: PACKET_JSON_PATH,
    sourceCsv: PACKET_CSV_PATH,
    sourceMarkdown: PACKET_MARKDOWN_PATH,
    sourceLatestEvidence: LATEST_EVIDENCE_PATH,
    sourceCloseoutStatus: CLOSEOUT_STATUS_PATH,
    requiredRouteCount: REQUIRED_ROUTE_PATHS.length,
    requiredCheckpointCount: REQUIRED_CHECKPOINT_IDS.length,
    matrixRowCount: Array.isArray(packet.routeCheckpointMatrix) ? packet.routeCheckpointMatrix.length : 0,
    routeReviewPlanCount: Array.isArray(packet.routeReviewPlan) ? packet.routeReviewPlan.length : 0,
    checkpointReviewPlanCount: Array.isArray(packet.checkpointReviewPlan) ? packet.checkpointReviewPlan.length : 0,
    routeCheckpointMatrixRowCount: Array.isArray(packet.routeCheckpointMatrix) ? packet.routeCheckpointMatrix.length : 0,
    nextCommandCount: Array.isArray(packet.nextCommands) ? packet.nextCommands.length : 0,
    doesNotProveCount: Array.isArray(packet.doesNotProve) ? packet.doesNotProve.length : 0,
    sourceTraceCount: packet.sourceTraceCount ?? null,
    csvRowCount: parseCsv(csvSource).rows.length,
    evidenceBoundary:
      'This verifier proves the generated manual WCAG owner review packet, matrix CSV, and owner-facing Markdown align with the canonical manual-WCAG verifier constants, latest manual evidence artifact, and closeout status only. It does not prove manual review completion, WCAG conformance, legal compliance, procurement approval, assistive-technology coverage, or commercial readiness.',
    errorCount: errors.length,
    errors,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main();
