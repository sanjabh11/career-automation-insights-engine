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
const root = path.resolve(__dirname, '..');

const SCHEMA_VERSION = '2026-06-04.apo-manual-wcag-review-packet.v1';
const AUDIT_JSON_PATH = 'docs/commercialization/commercial-accessibility-audit-latest.json';
const TEMPLATE_PATH = 'docs/commercialization/manual-wcag-evidence-template.json';
const HASHER_PATH = 'scripts/hash-owner-evidence-artifacts.mjs';
const LATEST_EVIDENCE_PATH = 'docs/commercialization/manual-wcag-evidence-latest.json';
const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const OUTPUT_JSON = 'docs/commercialization/manual-wcag-review-packet-latest.json';
const OUTPUT_MD = 'docs/commercialization/manual-wcag-review-packet-latest.md';
const OUTPUT_CSV = 'docs/commercialization/manual-wcag-review-matrix-latest.csv';
const SOURCE_TRACE_BOUNDARY =
  'This source trace maps each generated manual WCAG review packet provenance row to the sourceArtifacts key used by the owner worksheet. It does not perform manual accessibility review, read owner-held reviewer notes, screenshots, recordings, assistive-technology transcripts, issue details, evaluation-tool output, sample archives, artifact hash source maps, private user data, or upgrade launch readiness.';
const HASHER_INPUT_BOUNDARY =
  'When hashing proof artifacts, use ordinary owner-held files outside git or under an ignored local proof path. The hasher rejects symbolic links, hard-linked files, tracked files, staged files, and non-ignored repository files; copy proof material to a single-link owner-held file before hashing.';
const NEXT_COMMANDS = [
  'npm run verify:commercial-a11y',
  'npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>',
  `npm run verify:manual-wcag-evidence -- --evidence ${DEFAULT_MANUAL_WCAG_EVIDENCE_PATH} --require-complete`,
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

const CHECKPOINT_GUIDANCE = {
  'wcag-em-scope': {
    label: 'WCAG-EM scope and sampling',
    reviewerGoal: 'Confirm the target standard, product scope, route sample, sample-selection method, technologies relied upon, complete-process coverage, browser/assistive-technology support baseline, evaluator role, independence/conflict boundary, owner-held WCAG-EM report-tool export, review-record archive, and reporting boundary before any conformance language is considered.',
    requiredEvidenceSummary: [
      'scopeDefined=true',
      'conformanceTarget="WCAG 2.2 A/AA"',
      'productScopeDefined=true',
      'sampleSelectionRationaleDocumented=true',
      'completeProcessesReviewed=true',
      'accessibilitySupportBaselineDefined=true',
    ],
    ownerHeldArtifacts: [
      'evaluation scope notes',
      'route sample rationale',
      'sample-selection method notes',
      'technologies relied upon notes',
      'complete-process walkthrough notes',
      'browser/assistive-technology support baseline matrix',
      'WCAG-EM Report Tool JSON or HTML export retained owner-held',
      'review-record archive checklist',
    ],
  },
  'keyboard-focus-not-obscured': {
    label: 'Keyboard focus and focus-not-obscured review',
    reviewerGoal: 'Tab through each route and interactive state at mobile, tablet, and desktop widths, including sticky navigation, dialogs, long forms, report downloads, and status panels.',
    requiredEvidenceSummary: ['keyboardTraversalCompleted=true', 'focusNotObscuredChecked=true'],
    ownerHeldArtifacts: ['keyboard traversal notes', 'focus screenshots or recordings', 'issue/remediation log'],
  },
  'target-size': {
    label: 'Pointer target size review',
    reviewerGoal: 'Measure compact links, icon buttons, table actions, badges used as controls, mobile CTA clusters, and form controls for target size or spacing exceptions.',
    requiredEvidenceSummary: ['pointerTargetReviewCompleted=true'],
    ownerHeldArtifacts: ['target measurements', 'exception rationale', 'mobile screenshots'],
  },
  'form-errors-and-redundant-entry': {
    label: 'Form errors, labels, instructions, and redundant entry',
    reviewerGoal: 'Exercise lead capture, coach sample, resume analyzer, workforce CSV, counselor forms, and evidence download flows with missing, invalid, and repeated values.',
    requiredEvidenceSummary: ['errorStateReviewCompleted=true', 'redundantEntryReviewCompleted=true'],
    ownerHeldArtifacts: ['form error screenshots', 'label/instruction notes', 're-entry test notes'],
  },
  'accessible-authentication': {
    label: 'Accessible authentication and account/payment access',
    reviewerGoal: 'Review sign-in, payment, account, and synthetic-user flows for cognitive-function-test barriers and accessible alternatives before institutional pilots.',
    requiredEvidenceSummary: ['authFlowReviewed=true'],
    ownerHeldArtifacts: ['auth flow notes', 'payment/account screenshots with private data redacted', 'accessibility exception notes'],
  },
  'screen-reader-name-role-value': {
    label: 'Screen-reader name, role, value, relationships, and keyboard semantics',
    reviewerGoal: 'Use assistive technologies to review menus, dialogs, generated reports, evidence cards, CSV/HTML download controls, dynamic status messages, and route navigation.',
    requiredEvidenceSummary: ['assistiveTechnologies=[...]', 'nameRoleValueReviewCompleted=true'],
    ownerHeldArtifacts: ['screen-reader transcript notes', 'name/role/value defect log', 'assistive-technology matrix'],
  },
  'contrast-reflow-text-spacing': {
    label: 'Contrast, reflow, non-text contrast, and text spacing',
    reviewerGoal: 'Run contrast and text-spacing/reflow checks on commercial cards, badges, alerts, charts, proof packets, downloadable HTML, mobile layouts, and any dark-theme surfaces.',
    requiredEvidenceSummary: ['contrastReviewCompleted=true', 'reflowAndTextSpacingReviewCompleted=true'],
    ownerHeldArtifacts: ['contrast measurements', 'text-spacing screenshots', 'reflow notes'],
  },
  'downloadable-artifacts': {
    label: 'Downloadable HTML/CSV/proof artifact accessibility',
    reviewerGoal: 'Open downloaded trust packets, risk CSVs, sample reports, proof-pack exports, and pilot-validation artifacts, then review names, headings, tables, keyboard access, assistive-technology behavior, and non-web document/software applicability boundaries.',
    requiredEvidenceSummary: ['artifactsReviewed=[...]', 'downloadedArtifactReviewCompleted=true'],
    ownerHeldArtifacts: ['downloaded artifact list', 'artifact screenshots', 'assistive-technology notes'],
  },
};

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function readJsonOptional(relativePath) {
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

function officialReferenceById() {
  return new Map(OFFICIAL_REFERENCE_REQUIREMENTS.map((reference) => [reference.id, reference]));
}

function automatedRouteContext(audit, routePath) {
  const routeResults = (audit?.routeResults || []).filter((result) => result.path === routePath);
  const viewports = [...new Set(routeResults.map((result) => result.viewport).filter(Boolean))];
  const failedResults = routeResults.filter((result) => result.result !== 'pass');
  return {
    routePath,
    routeLabel: (audit?.routes || []).find((route) => route.path === routePath)?.label || routePath,
    automatedSmokeStatus: routeResults.length > 0 && failedResults.length === 0 ? 'automated_smoke_passed' : 'automated_context_missing_or_failed',
    automatedResultCount: routeResults.length,
    automatedViewportCount: viewports.length,
    viewports,
    keyboardTabStopsChecked: routeResults.reduce((sum, result) => sum + (result.keyboardTabStopsChecked || 0), 0),
    interactiveCountMax: Math.max(0, ...routeResults.map((result) => result.interactiveCount || 0)),
    targetSizeReview: [...new Set(routeResults.map((result) => result.targetSizeReview).filter(Boolean))],
    textSpacingReview: [...new Set(routeResults.map((result) => result.textSpacingReview).filter(Boolean))],
    boundary: 'Automated smoke context is only a pre-review signal; it does not prove manual WCAG evidence, assistive-technology behavior, legal compliance, procurement approval, or future accessibility.',
  };
}

function checkpointPlan(checkpointId, referenceMap) {
  const guidance = CHECKPOINT_GUIDANCE[checkpointId];
  const standardRefs = CHECKPOINT_STANDARD_REFS[checkpointId] || [];
  return {
    checkpointId,
    label: guidance.label,
    reviewerGoal: guidance.reviewerGoal,
    standardRefs,
    officialReferenceUrls: standardRefs.map((id) => referenceMap.get(id)?.url).filter(Boolean),
    requiredEvidenceSummary: guidance.requiredEvidenceSummary,
    ownerHeldArtifacts: guidance.ownerHeldArtifacts,
    evidenceJsonPath: `checkpointResults[].checkpointId=${checkpointId}`,
    acceptedStatuses: ['passed', 'passed_with_remediation', 'not_applicable_with_rationale'],
    failureBoundary: 'If unresolved issues remain, keep this checkpoint failed or blocked and do not mark the manual WCAG evidence gate complete.',
    doesNotProve: [
      'WCAG conformance statement',
      'Legal compliance',
      'Institutional procurement approval',
      'Assistive-technology coverage beyond reviewed combinations',
      'Future accessibility after code changes',
    ],
  };
}

function buildVerifierAcceptanceChecklist(checkpointPlans) {
  return [
    {
      id: 'scope-and-sample',
      label: 'WCAG-EM scope and route sample',
      verifierPaths: [
        'evaluationScope.productScope',
        'evaluationScope.sampleSelectionRationale',
        'evaluationScope.sampleSetSelectionMethod',
        'targetStandard',
        'methodology',
        'evaluationScope.routesReviewed',
        'evaluationScope.technologiesReliedUpon',
        'evaluationScope.browsers',
        'evaluationScope.assistiveTechnologies',
        'evaluationScope.viewports',
      ],
      acceptedWhen: `Evidence uses targetStandard=WCAG 2.2 A/AA, methodology=WCAG-EM, includes all ${REQUIRED_ROUTE_PATHS.length} required commercial routes, describes the sample-selection method and technologies relied upon, and covers mobile/tablet/desktop plus browser and assistive-technology matrices.`,
      ownerHeldEvidence: [
        'product scope notes',
        'route sample rationale',
        'sample-selection method notes',
        'technologies relied upon notes',
        'browser and viewport notes',
        'assistive-technology matrix notes',
      ],
      boundary:
        'Scope metadata is necessary but does not prove accessibility until every checkpoint is manually reviewed and accepted.',
    },
    {
      id: 'complete-process-and-support-baseline',
      label: 'Complete processes and accessibility support baseline',
      verifierPaths: [
        'evaluationScope.completeProcessesReviewed',
        'evaluationScope.accessibilitySupportBaseline[].operatingSystem',
        'evaluationScope.accessibilitySupportBaseline[].browser',
        'evaluationScope.accessibilitySupportBaseline[].assistiveTechnology',
        'evaluationScope.accessibilitySupportBaseline[].inputModalities',
        'evaluationScope.accessibilitySupportBaseline[].viewports',
      ],
      acceptedWhen: `Evidence includes all ${REQUIRED_COMPLETE_PROCESS_IDS.length} required complete processes and at least ${REQUIRED_ACCESSIBILITY_SUPPORT_BASELINE_COUNT} explicit browser/assistive-technology support combinations with keyboard input covered.`,
      ownerHeldEvidence: [
        'complete-process walkthrough notes',
        'browser/assistive-technology support baseline notes',
        'keyboard and screen-reader setup notes',
      ],
      boundary:
        'Support-baseline metadata defines reviewed combinations only; it does not prove unreviewed operating systems, browsers, assistive technologies, or future UI states.',
    },
    {
      id: 'evaluation-specifics-and-archive',
      label: 'Evaluation specifics and review-record archive',
      verifierPaths: [
        'reviewRecordArchive.samplesArchivedOwnerHeld',
        'reviewRecordArchive.evaluationToolsRecorded',
        'reviewRecordArchive.wcagEmReportToolExportOwnerHeld',
        'reviewRecordArchive.browserAssistiveTechnologyVersionsRecorded',
        'reviewRecordArchive.navigationPathsRecorded',
        'reviewRecordArchive.issueLogOwnerHeld',
        'reviewRecordArchive.rawEvidenceSecurityReviewed',
        'reviewRecordArchive.reEvaluationRequiredAfterMaterialChange',
      ],
      acceptedWhen: `Evidence includes reviewRecordArchive with all required attestations true: ${REVIEW_RECORD_ARCHIVE_ATTESTATIONS.join(', ')}.`,
      ownerHeldEvidence: [
        'sample archive',
        'evaluation tool/version notes',
        'browser/assistive-technology version notes',
        'navigation path notes',
        'issue log',
        'raw evidence security review note',
      ],
      boundary:
        'Archive metadata confirms review records were retained owner-side only; it does not expose the records or independently validate reviewer findings.',
    },
    {
      id: 'owner-evidence-archive',
      label: 'Owner evidence archive policy',
      verifierPaths: MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS.map(
        (requirement) => `ownerEvidenceArchive.${requirement}`,
      ),
      acceptedWhen: `Evidence includes ownerEvidenceArchive with all required policy fields true: ${MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS.join(', ')}.`,
      ownerHeldEvidence: [
        'raw reviewer notes archive',
        'screenshot and recording archive',
        'assistive-technology transcript archive',
        'reviewer identity and qualification record',
        'issue detail archive',
        'evaluation-tool output archive',
        'sample archive',
        'artifact hash source map',
        'material-change re-review policy',
      ],
      boundary:
        'OwnerEvidenceArchive metadata is a storage and re-review policy only; it does not expose raw artifacts or prove WCAG conformance.',
    },
    {
      id: 'official-reference-basis',
      label: 'Official W3C/WAI reference basis',
      verifierPaths: ['officialReferences[].id', 'officialReferences[].url', 'officialReferences[].accessedAt'],
      acceptedWhen: `Evidence includes all ${OFFICIAL_REFERENCE_REQUIREMENTS.length} required W3C/WAI references with exact URLs and non-future accessedAt dates not later than asOf.`,
      ownerHeldEvidence: ['reviewer source-access notes'],
      boundary:
        'Reference metadata proves the review basis only; it does not prove the app satisfies those standards.',
    },
    {
      id: 'reviewer-attestation',
      label: 'Reviewer attestation and redaction boundary',
      verifierPaths: [
        'evaluator.reviewerIdHash',
        'evaluator.reviewType',
        'evaluator.independenceBoundary',
        'evaluator.expertiseConfirmed',
        'evaluator.conflictOfInterestDisclosed',
        'reviewerAttestation.manualReviewCompleted',
        'reviewerAttestation.assistiveTechnologyReviewCompleted',
        'reviewerAttestation.noWcagConformanceClaim',
        'reviewerAttestation.noProcurementApprovalClaim',
        'reviewerAttestation.ownerHeldRawNotes',
      ],
      acceptedWhen:
        'Reviewer identity is represented only by a non-placeholder sha256 hash, review type and independence/conflict boundary are disclosed, expertise is attested, manual and assistive-technology reviews are complete, raw notes stay owner-held, and no WCAG conformance or procurement-approval claim is made.',
      ownerHeldEvidence: [
        'reviewer identity and qualification record',
        'review independence/conflict disclosure',
        'raw review notes',
        'screenshots or recordings',
        'assistive-technology transcripts',
      ],
      boundary:
        'Reviewer attestation supports the owner evidence gate but does not create legal, procurement, or warranty language.',
    },
    {
      id: 'checkpoint-coverage',
      label: 'Required checkpoint coverage',
      verifierPaths: [
        'checkpointResults[].checkpointId',
        'checkpointResults[].status',
        'checkpointResults[].routesReviewed',
        'checkpointResults[].standardRefs',
        'checkpointResults[].evidenceSummary',
      ],
      acceptedWhen: `All ${checkpointPlans.length} required checkpoints are present once, use accepted statuses only, include every required route, include checkpoint-specific standard refs, and provide the required evidenceSummary fields.`,
      ownerHeldEvidence: checkpointPlans.flatMap((checkpoint) => checkpoint.ownerHeldArtifacts),
      boundary:
        'Checkpoint coverage is redacted metadata; unresolved issues, missing routes, duplicate checkpoints, or missing evidenceSummary fields keep the gate incomplete.',
    },
    {
      id: 'artifact-hashes-and-issue-closeout',
      label: 'Proof hashes and issue closeout',
      verifierPaths: [
        'checkpointResults[].artifactHashes',
        'checkpointResults[].unresolvedIssueCount',
        'checkpointResults[].remediatedIssueCount',
        'checkpointResults[].doesNotProve',
      ],
      acceptedWhen:
        'Every accepted checkpoint has at least one non-placeholder sha256 proof hash, unresolvedIssueCount=0, a non-negative remediatedIssueCount, and explicit does-not-prove boundaries.',
      ownerHeldEvidence: [
        `ordinary local proof files hashed with npm run hash:owner-evidence-artifacts; ${HASHER_INPUT_BOUNDARY}`,
        'issue remediation notes',
        'raw screenshots or recordings',
      ],
      boundary:
        'Hashes prove only that owner-held artifacts were represented in the metadata; they do not expose or independently validate the raw artifacts.',
    },
  ];
}

function buildMatrix(routeContexts, checkpointPlans) {
  return routeContexts.flatMap((route) =>
    checkpointPlans.map((checkpoint) => ({
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
    }))
  );
}

function summarizeLatestEvidence(latestEvidence) {
  if (!latestEvidence) {
    return {
      latestEvidencePath: LATEST_EVIDENCE_PATH,
      status: 'missing_latest_manual_wcag_evidence_artifact',
      acceptedCheckpointCount: 0,
      requiredCheckpointCount: REQUIRED_CHECKPOINT_IDS.length,
      requiredRouteCount: REQUIRED_ROUTE_PATHS.length,
      manualWcagGateSatisfied: false,
    };
  }

  return {
    latestEvidencePath: LATEST_EVIDENCE_PATH,
    status: latestEvidence.status || 'unknown',
    acceptedCheckpointCount: latestEvidence.acceptedCheckpointCount || 0,
    requiredCheckpointCount: latestEvidence.requiredCheckpointCount || REQUIRED_CHECKPOINT_IDS.length,
    requiredRouteCount: latestEvidence.requiredRouteCount || REQUIRED_ROUTE_PATHS.length,
    manualWcagGateSatisfied: latestEvidence.manualWcagGateSatisfied === true,
  };
}

function summarizeCloseout(closeoutStatus) {
  const queue = Array.isArray(closeoutStatus?.ownerActionQueue) ? closeoutStatus.ownerActionQueue : [];
  return {
    closeoutStatusPath: CLOSEOUT_STATUS_PATH,
    goalComplete: closeoutStatus?.goalComplete === true,
    relevantOwnerActions: queue
      .filter((item) => item.id === 'manual_wcag_evidence')
      .map((item) => ({
        id: item.id,
        status: item.status,
        ownerAction: item.ownerAction,
        ownerPrepCommand: item.ownerPrepCommand,
        nextCommand: item.nextCommand,
      })),
  };
}

function buildSourceTrace(sourceArtifacts) {
  return Object.entries(sourceArtifacts).map(([key, artifactPath]) => ({
    key,
    artifactPath,
    sourceArtifact: `${OUTPUT_JSON}#sourceArtifacts.${key}`,
  }));
}

function buildCsv(matrixRows) {
  const header = [
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
  const body = matrixRows.map((row) => [
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
  ]);
  return [header, ...body].map((row) => row.map(csvCell).join(',')).join('\n');
}

function buildMarkdown(packet) {
  const referenceRows = packet.officialReferences
    .map((reference) => `| ${markdownCell(reference.id)} | ${markdownCell(reference.label)} | ${markdownCell(reference.url)} |`)
    .join('\n');
  const routeRows = packet.routeReviewPlan
    .map((route) => `| ${markdownCell(route.routePath)} | ${markdownCell(route.routeLabel)} | ${markdownCell(route.automatedSmokeStatus)} | ${route.automatedViewportCount} | ${route.keyboardTabStopsChecked} | ${markdownCell(route.boundary)} |`)
    .join('\n');
  const checkpointRows = packet.checkpointReviewPlan
    .map((checkpoint) => `| ${markdownCell(checkpoint.checkpointId)} | ${markdownCell(checkpoint.label)} | ${markdownCell(checkpoint.standardRefs.join(', '))} | ${markdownCell(checkpoint.requiredEvidenceSummary.join('; '))} | ${markdownCell(checkpoint.ownerHeldArtifacts.join('; '))} |`)
    .join('\n');
  const acceptanceRows = packet.verifierAcceptanceChecklist
    .map((item) => `| ${markdownCell(item.id)} | ${markdownCell(item.verifierPaths.join(', '))} | ${markdownCell(item.acceptedWhen)} | ${markdownCell(item.boundary)} |`)
    .join('\n');
  const commandRows = packet.nextCommands.map((command) => `- \`${command}\``).join('\n');
  const sourceTraceRows = packet.sourceTrace
    .map((row) => `| ${markdownCell(row.key)} | \`${markdownCell(row.artifactPath)}\` | \`${markdownCell(row.sourceArtifact)}\` |`)
    .join('\n');

  return `# Manual WCAG Review Packet

Generated: ${packet.generatedAt}

Schema: \`${packet.schemaVersion}\`

Manual evidence schema: \`${packet.manualEvidenceSchemaVersion}\`

Status: \`${packet.status}\`

This packet converts the manual WCAG evidence schema into an owner-review execution matrix. It is not launch proof and it is not a WCAG conformance statement.

Primary source artifact: \`${packet.sourceArtifact}\`

Source artifact count: ${packet.sourceArtifactCount}

Source trace rows: ${packet.sourceTraceCount}

## Evidence Boundary

${packet.evidenceBoundary}

## Hasher Input Boundary

${packet.hasherInputBoundary}

## Source Trace

${packet.sourceTraceBoundary}

| Key | Artifact | Source anchor |
| --- | --- | --- |
${sourceTraceRows}

## Counts

| Item | Count |
| --- | ---: |
| Required routes | ${packet.requiredRouteCount} |
| Required checkpoints | ${packet.requiredCheckpointCount} |
| Official W3C/WAI references | ${packet.officialReferenceCount} |
| Required complete processes | ${packet.requiredCompleteProcessCount} |
| Required accessibility-support baseline combinations | ${packet.requiredAccessibilitySupportBaselineCount} |
| Required owner-evidence archive policy fields | ${packet.requiredOwnerEvidenceArchiveRequirementCount} |
| Route review plan rows | ${packet.routeReviewPlanCount} |
| Checkpoint review plan rows | ${packet.checkpointReviewPlanCount} |
| Route/checkpoint matrix rows | ${packet.routeCheckpointMatrixRowCount} |
| Verifier acceptance checklist items | ${packet.verifierAcceptanceChecklistCount} |
| Next commands | ${packet.nextCommandCount} |
| Does-not-prove boundaries | ${packet.doesNotProveCount} |

## Latest Manual Evidence Summary

| Artifact | Status | Accepted checkpoints | Required checkpoints | Required routes | Gate satisfied |
| --- | --- | ---: | ---: | ---: | --- |
| \`${packet.latestEvidenceSummary.latestEvidencePath}\` | ${packet.latestEvidenceSummary.status} | ${packet.latestEvidenceSummary.acceptedCheckpointCount} | ${packet.latestEvidenceSummary.requiredCheckpointCount} | ${packet.latestEvidenceSummary.requiredRouteCount} | ${packet.latestEvidenceSummary.manualWcagGateSatisfied} |

## Closeout Summary

| Artifact | Goal complete | Manual WCAG owner actions |
| --- | --- | ---: |
| \`${packet.closeoutSummary.closeoutStatusPath}\` | ${packet.closeoutSummary.goalComplete} | ${packet.closeoutSummary.relevantOwnerActions.length} |

## Official References

| ID | Label | URL |
| --- | --- | --- |
${referenceRows}

## Route Review Plan

| Route | Label | Automated smoke context | Automated viewports | Keyboard tab stops checked | Boundary |
| --- | --- | --- | ---: | ---: | --- |
${routeRows}

## Checkpoint Review Plan

| Checkpoint | Label | Standard refs | Required evidence summary fields | Owner-held artifacts |
| --- | --- | --- | --- | --- |
${checkpointRows}

## Verifier Acceptance Checklist

These are the machine-readable conditions that \`npm run verify:manual-wcag-evidence -- --evidence ${packet.localManualEvidencePath} --require-complete\` expects before the manual WCAG gate can close.

| Checklist item | Verifier paths | Accepted when | Boundary |
| --- | --- | --- | --- |
${acceptanceRows}

## Matrix CSV

Tracked CSV: \`${packet.outputs.csv}\`

Use the CSV as the reviewer worksheet. After review, store only redacted metadata and hashes in \`${packet.localManualEvidencePath}\`.

## Next Commands

${commandRows}

## Does Not Prove

${packet.doesNotProve.map((item) => `- ${item}`).join('\n')}
`;
}

function buildPacket() {
  const audit = readJsonOptional(AUDIT_JSON_PATH);
  const latestEvidence = readJsonOptional(LATEST_EVIDENCE_PATH);
  const closeoutStatus = readJsonOptional(CLOSEOUT_STATUS_PATH);
  const referenceMap = officialReferenceById();
  const officialReferences = OFFICIAL_REFERENCE_REQUIREMENTS;
  const routeReviewPlan = REQUIRED_ROUTE_PATHS.map((routePath) => automatedRouteContext(audit, routePath));
  const checkpointReviewPlan = REQUIRED_CHECKPOINT_IDS.map((checkpointId) => checkpointPlan(checkpointId, referenceMap));
  const routeCheckpointMatrix = buildMatrix(routeReviewPlan, checkpointReviewPlan);
  const verifierAcceptanceChecklist = buildVerifierAcceptanceChecklist(checkpointReviewPlan);
  const sourceArtifacts = {
    automatedAccessibilityAudit: AUDIT_JSON_PATH,
    manualEvidenceTemplate: TEMPLATE_PATH,
    ownerHasher: HASHER_PATH,
    latestManualWcagEvidence: LATEST_EVIDENCE_PATH,
    closeoutStatus: CLOSEOUT_STATUS_PATH,
    manualEvidenceVerifier: 'scripts/verify-manual-wcag-evidence.mjs',
  };
  const sourceTrace = buildSourceTrace(sourceArtifacts);

  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
    status: 'owner_manual_review_required',
    manualEvidenceSchemaVersion: MANUAL_WCAG_EVIDENCE_SCHEMA_VERSION,
    sourceArtifact: sourceArtifacts.manualEvidenceTemplate,
    sourceArtifactCount: Object.keys(sourceArtifacts).length,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_TRACE_BOUNDARY,
    sourceArtifacts,
    outputs: {
      json: OUTPUT_JSON,
      markdown: OUTPUT_MD,
      csv: OUTPUT_CSV,
    },
    localManualEvidencePath: DEFAULT_MANUAL_WCAG_EVIDENCE_PATH,
    evidenceBoundary:
      'This packet is an owner-review worksheet only. Raw reviewer notes, screenshots, recordings, assistive-technology transcripts, reviewer identity, reviewer profile URLs, meeting/calendar links, issue tracker details, evaluation-tool output, sample archives, artifact hash source maps, and private user data must remain owner-held outside tracked files. The packet does not make placeholder hashes count as proof.',
    hasherInputBoundary: HASHER_INPUT_BOUNDARY,
    latestEvidenceSummary: summarizeLatestEvidence(latestEvidence),
    closeoutSummary: summarizeCloseout(closeoutStatus),
    requiredRouteCount: REQUIRED_ROUTE_PATHS.length,
    requiredCheckpointCount: REQUIRED_CHECKPOINT_IDS.length,
    requiredOfficialReferenceCount: OFFICIAL_REFERENCE_REQUIREMENTS.length,
    officialReferenceCount: officialReferences.length,
    requiredCompleteProcessIds: REQUIRED_COMPLETE_PROCESS_IDS,
    requiredCompleteProcessCount: REQUIRED_COMPLETE_PROCESS_IDS.length,
    requiredAccessibilitySupportBaselineCount: REQUIRED_ACCESSIBILITY_SUPPORT_BASELINE_COUNT,
    ownerEvidenceArchiveRequirements: MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS,
    requiredOwnerEvidenceArchiveRequirementCount: MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS.length,
    matrixRowCount: routeCheckpointMatrix.length,
    routeReviewPlanCount: routeReviewPlan.length,
    checkpointReviewPlanCount: checkpointReviewPlan.length,
    routeCheckpointMatrixRowCount: routeCheckpointMatrix.length,
    verifierAcceptanceChecklistCount: verifierAcceptanceChecklist.length,
    officialReferences,
    routeReviewPlan,
    checkpointReviewPlan,
    verifierAcceptanceChecklist,
    routeCheckpointMatrix,
    nextCommands: NEXT_COMMANDS,
    nextCommandCount: NEXT_COMMANDS.length,
    doesNotProve: DOES_NOT_PROVE,
    doesNotProveCount: DOES_NOT_PROVE.length,
  };
}

function main() {
  const shouldWrite = hasFlag('--write');
  const packet = buildPacket();
  const csv = buildCsv(packet.routeCheckpointMatrix);
  const markdown = buildMarkdown(packet);

  if (shouldWrite) {
    writeText(OUTPUT_JSON, `${JSON.stringify(packet, null, 2)}\n`);
    writeText(OUTPUT_MD, markdown);
    writeText(OUTPUT_CSV, csv);
  }

  console.log(JSON.stringify({
    ok: true,
    schemaVersion: packet.schemaVersion,
    status: packet.status,
    requiredRouteCount: packet.requiredRouteCount,
    requiredCheckpointCount: packet.requiredCheckpointCount,
    requiredOfficialReferenceCount: packet.requiredOfficialReferenceCount,
    officialReferenceCount: packet.officialReferenceCount,
    matrixRowCount: packet.matrixRowCount,
    routeReviewPlanCount: packet.routeReviewPlanCount,
    checkpointReviewPlanCount: packet.checkpointReviewPlanCount,
    routeCheckpointMatrixRowCount: packet.routeCheckpointMatrixRowCount,
    nextCommandCount: packet.nextCommandCount,
    doesNotProveCount: packet.doesNotProveCount,
    sourceArtifact: packet.sourceArtifact,
    sourceArtifactCount: packet.sourceArtifactCount,
    sourceTraceCount: packet.sourceTraceCount,
    sourceArtifacts: packet.sourceArtifacts,
    outputs: shouldWrite ? packet.outputs : null,
    evidenceBoundary: packet.evidenceBoundary,
    hasherInputBoundary: packet.hasherInputBoundary,
  }, null, 2));
}

main();
