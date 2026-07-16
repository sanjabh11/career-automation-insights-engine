#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  CHECKPOINT_STANDARD_REFS,
  MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS,
  OFFICIAL_REFERENCE_REQUIREMENTS,
  REQUIRED_CHECKPOINT_IDS,
  REQUIRED_COMPLETE_PROCESS_IDS,
  REQUIRED_ROUTE_PATHS,
  REVIEW_RECORD_ARCHIVE_ATTESTATIONS,
  renderArtifact,
  validateManualWcagEvidence,
  validateRenderedArtifactCounts,
} from './verify-manual-wcag-evidence.mjs';

const EVIDENCE_PATH = 'docs/commercialization/manual-wcag-evidence.local.json';
const EVIDENCE_DATE = '2026-06-04';
const ZERO_HASH = `sha256:${'0'.repeat(64)}`;

function sha256(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function writeJson(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function truthyRecord(keys) {
  return Object.fromEntries(keys.map((key) => [key, true]));
}

function checkpointEvidenceSummary(checkpointId) {
  const summaries = {
    'wcag-em-scope': {
      scopeDefined: true,
      conformanceTarget: 'WCAG 2.2 A/AA',
      productScopeDefined: true,
      sampleSelectionRationaleDocumented: true,
      completeProcessesReviewed: true,
      accessibilitySupportBaselineDefined: true,
    },
    'keyboard-focus-not-obscured': {
      keyboardTraversalCompleted: true,
      focusNotObscuredChecked: true,
    },
    'target-size': {
      pointerTargetReviewCompleted: true,
    },
    'form-errors-and-redundant-entry': {
      errorStateReviewCompleted: true,
      redundantEntryReviewCompleted: true,
    },
    'accessible-authentication': {
      authFlowReviewed: true,
    },
    'screen-reader-name-role-value': {
      assistiveTechnologies: ['VoiceOver macOS', 'NVDA Windows'],
      nameRoleValueReviewCompleted: true,
    },
    'contrast-reflow-text-spacing': {
      contrastReviewCompleted: true,
      reflowAndTextSpacingReviewCompleted: true,
    },
    'downloadable-artifacts': {
      artifactsReviewed: ['sample report PDF', 'proof-pack CSV export'],
      downloadedArtifactReviewCompleted: true,
    },
  };
  return summaries[checkpointId];
}

function checkpoint(checkpointId, index, overrides = {}) {
  return {
    checkpointId,
    status: 'passed',
    observedAt: EVIDENCE_DATE,
    reviewedByHuman: true,
    routesReviewed: [...REQUIRED_ROUTE_PATHS],
    artifactHashes: [sha256(`manual-wcag-${checkpointId}-${index}`)],
    standardRefs: [...(CHECKPOINT_STANDARD_REFS[checkpointId] || [])],
    evidenceSummary: checkpointEvidenceSummary(checkpointId),
    unresolvedIssueCount: 0,
    remediatedIssueCount: 0,
    doesNotProve: [
      'WCAG conformance statement',
      'Legal compliance',
      'Procurement approval',
    ],
    ...overrides,
  };
}

function completeEvidence(overrides = {}) {
  return {
    schemaVersion: '2026-06-04.apo-manual-wcag-evidence.v1',
    asOf: EVIDENCE_DATE,
    sourceBoundary:
      'Redacted manual WCAG evidence metadata only. Raw notes, screenshots, recordings, reviewer identity, assistive-technology transcripts, issue details, tool output, sample archives, and hash source maps remain owner-held outside git.',
    targetStandard: 'WCAG 2.2 A/AA',
    methodology: 'WCAG-EM',
    officialReferences: OFFICIAL_REFERENCE_REQUIREMENTS.map((reference) => ({
      ...reference,
      accessedAt: EVIDENCE_DATE,
    })),
    evaluator: {
      reviewerIdHash: sha256('manual-wcag-reviewer'),
      role: 'accessibility_reviewer',
      reviewType: 'manual WCAG-EM review with assistive technology checks',
      independenceBoundary: 'internal self-assessment with reviewer conflict boundary documented owner-held',
      expertiseConfirmed: true,
      conflictOfInterestDisclosed: true,
    },
    evaluationScope: {
      productScope:
        'APO commercial launch surfaces covering public trust pages, proof-pack downloads, report generation, account/payment access, and buyer evidence workflows.',
      sampleSelectionRationale:
        'Route sample covers the highest-risk commercial launch surfaces: privacy and trust claims, coach and counselor report creation, resume proof artifacts, enterprise dashboard review, proof-pack exports, and SEO buyer entry.',
      sampleSetSelectionMethod: 'structured commercial-route sample plus required complete processes',
      technologiesReliedUpon: ['HTML', 'CSS', 'JavaScript', 'WAI-ARIA'],
      routesReviewed: [...REQUIRED_ROUTE_PATHS],
      completeProcessesReviewed: [...REQUIRED_COMPLETE_PROCESS_IDS],
      browsers: ['Chrome current', 'Safari current'],
      assistiveTechnologies: ['VoiceOver macOS', 'NVDA Windows'],
      viewports: ['mobile', 'tablet', 'desktop'],
      accessibilitySupportBaseline: [
        {
          id: 'macos-safari-voiceover',
          operatingSystem: 'macOS current',
          browser: 'Safari current',
          assistiveTechnology: 'VoiceOver macOS',
          inputModalities: ['keyboard', 'screen_reader'],
          viewports: ['mobile', 'desktop'],
        },
        {
          id: 'windows-chrome-nvda',
          operatingSystem: 'Windows current',
          browser: 'Chrome current',
          assistiveTechnology: 'NVDA Windows',
          inputModalities: ['keyboard', 'screen_reader'],
          viewports: ['desktop'],
        },
      ],
      conformanceTarget: 'WCAG 2.2 A/AA',
    },
    reviewRecordArchive: truthyRecord(REVIEW_RECORD_ARCHIVE_ATTESTATIONS),
    ownerEvidenceArchive: truthyRecord(MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS),
    reviewerAttestation: {
      manualReviewCompleted: true,
      assistiveTechnologyReviewCompleted: true,
      noWcagConformanceClaim: true,
      noProcurementApprovalClaim: true,
      ownerHeldRawNotes: true,
    },
    checkpointResults: REQUIRED_CHECKPOINT_IDS.map((checkpointId, index) => checkpoint(checkpointId, index)),
    ...overrides,
  };
}

function runFixture(root, evidence) {
  writeJson(root, EVIDENCE_PATH, evidence);
  const result = validateManualWcagEvidence({ inputPath: EVIDENCE_PATH, root });
  return {
    result,
    artifact: renderArtifact(result),
  };
}

function assertIncludes(name, values, expectedText) {
  if (!values.some((value) => String(value).includes(expectedText))) {
    throw new Error(`${name} expected error containing ${JSON.stringify(expectedText)}\n${values.join('\n')}`);
  }
}

function assertRenderedArtifactCounts(name, artifact) {
  const errors = validateRenderedArtifactCounts(artifact);
  if (errors.length > 0) {
    throw new Error(`${name} expected rendered artifact counts to align\n${errors.join('\n')}`);
  }
}

function assertCase(name, mutate, assertion) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-manual-wcag-evidence-${name}-`));
  try {
    const evidence = completeEvidence();
    mutate(evidence);
    const { result, artifact } = runFixture(root, evidence);
    assertion({ result, artifact });
    console.log(`ok ${name}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const cases = [
  {
    name: 'complete-manual-wcag-evidence-pass',
    mutate() {},
    assertion({ result, artifact }) {
      if (result.errors.length !== 0) throw new Error(`expected no errors\n${result.errors.join('\n')}`);
      if (!result.manualWcagGateSatisfied) throw new Error('expected manual WCAG gate to be satisfied');
      if (artifact.status !== 'passed') throw new Error(`expected passed artifact, got ${artifact.status}`);
      assertRenderedArtifactCounts('complete-manual-wcag-evidence-pass', artifact);
    },
  },
  {
    name: 'rendered-artifact-gate-id-count-drift-fails',
    mutate() {},
    assertion({ artifact }) {
      artifact.gateIdCount += 1;
      assertIncludes('rendered-artifact-gate-id-count-drift-fails', validateRenderedArtifactCounts(artifact), 'artifact_gate_id_count_mismatch');
    },
  },
  {
    name: 'rendered-artifact-owner-evidence-archive-count-drift-fails',
    mutate() {},
    assertion({ artifact }) {
      artifact.ownerEvidenceArchiveRequirementCount += 1;
      assertIncludes(
        'rendered-artifact-owner-evidence-archive-count-drift-fails',
        validateRenderedArtifactCounts(artifact),
        'artifact_owner_evidence_archive_requirement_count_mismatch',
      );
    },
  },
  {
    name: 'rendered-artifact-required-owner-evidence-archive-count-drift-fails',
    mutate() {},
    assertion({ artifact }) {
      artifact.requiredOwnerEvidenceArchiveRequirementCount += 1;
      assertIncludes(
        'rendered-artifact-required-owner-evidence-archive-count-drift-fails',
        validateRenderedArtifactCounts(artifact),
        'artifact_required_owner_evidence_archive_requirement_count_mismatch',
      );
    },
  },
  {
    name: 'rendered-artifact-rejected-checkpoint-count-drift-fails',
    mutate(evidence) {
      evidence.checkpointResults[0].unresolvedIssueCount = 1;
    },
    assertion({ artifact }) {
      artifact.rejectedCheckpointCount += 1;
      assertIncludes(
        'rendered-artifact-rejected-checkpoint-count-drift-fails',
        validateRenderedArtifactCounts(artifact),
        'artifact_rejected_checkpoint_count_mismatch',
      );
    },
  },
  {
    name: 'rendered-artifact-does-not-prove-count-drift-fails',
    mutate() {},
    assertion({ artifact }) {
      artifact.doesNotProveCount += 1;
      assertIncludes('rendered-artifact-does-not-prove-count-drift-fails', validateRenderedArtifactCounts(artifact), 'artifact_does_not_prove_count_mismatch');
    },
  },
  {
    name: 'rendered-artifact-manual-intervention-count-drift-fails',
    mutate() {},
    assertion({ artifact }) {
      artifact.manualInterventionIfMissingCount += 1;
      assertIncludes(
        'rendered-artifact-manual-intervention-count-drift-fails',
        validateRenderedArtifactCounts(artifact),
        'artifact_manual_intervention_count_mismatch',
      );
    },
  },
  {
    name: 'rendered-artifact-error-count-drift-fails',
    mutate(evidence) {
      evidence.checkpointResults[0].artifactHashes = [ZERO_HASH];
    },
    assertion({ artifact }) {
      artifact.errorCount += 1;
      assertIncludes('rendered-artifact-error-count-drift-fails', validateRenderedArtifactCounts(artifact), 'artifact_error_count_mismatch');
    },
  },
  {
    name: 'missing-checkpoint-fails-complete-gate',
    mutate(evidence) {
      evidence.checkpointResults.pop();
    },
    assertion({ result, artifact }) {
      if (result.errors.length !== 0) throw new Error(`expected incompleteness without schema errors\n${result.errors.join('\n')}`);
      if (result.manualWcagGateSatisfied) throw new Error('expected manual WCAG gate to remain unsatisfied');
      if (artifact.status !== 'incomplete_evidence') throw new Error(`expected incomplete_evidence, got ${artifact.status}`);
    },
  },
  {
    name: 'placeholder-artifact-hash-fails',
    mutate(evidence) {
      evidence.checkpointResults[0].artifactHashes = [ZERO_HASH];
    },
    assertion({ result }) {
      assertIncludes('placeholder-artifact-hash-fails', result.errors, 'artifactHashes must contain at least one sha256');
    },
  },
  {
    name: 'private-contact-pattern-fails',
    mutate(evidence) {
      evidence.sourceBoundary = 'Redacted metadata only. Contact reviewer@example.com must not be tracked.';
    },
    assertion({ result }) {
      assertIncludes('private-contact-pattern-fails', result.errors, 'private-contact pattern: email_address');
    },
  },
  {
    name: 'private-profile-url-fails',
    mutate(evidence) {
      evidence.evaluator.independenceBoundary =
        'Reviewer identity remains owner-held; do not track https://www.linkedin.com/in/private-accessibility-reviewer';
    },
    assertion({ result }) {
      assertIncludes('private-profile-url-fails', result.errors, 'private-contact pattern: private_profile_url');
    },
  },
  {
    name: 'meeting-link-fails',
    mutate(evidence) {
      evidence.reviewRecordArchive.meetingLinkOwnerHeldOutsideGit = 'https://meet.google.com/abc-defg-hij';
    },
    assertion({ result }) {
      assertIncludes('meeting-link-fails', result.errors, 'private-contact pattern: meeting_or_calendar_link');
    },
  },
  {
    name: 'non-w3c-official-reference-fails',
    mutate(evidence) {
      evidence.officialReferences[0].url = 'https://example.com/wcag22';
    },
    assertion({ result }) {
      assertIncludes('non-w3c-official-reference-fails', result.errors, 'must be an official W3C/WAI');
    },
  },
  {
    name: 'missing-wcag-em-report-tool-reference-fails',
    mutate(evidence) {
      evidence.officialReferences = evidence.officialReferences.filter((reference) => reference.id !== 'wcag-em-report-tool');
    },
    assertion({ result }) {
      assertIncludes('missing-wcag-em-report-tool-reference-fails', result.errors, 'officialReferences must include wcag-em-report-tool');
    },
  },
  {
    name: 'missing-wcag-em-report-export-attestation-fails',
    mutate(evidence) {
      evidence.reviewRecordArchive.wcagEmReportToolExportOwnerHeld = false;
    },
    assertion({ result }) {
      assertIncludes(
        'missing-wcag-em-report-export-attestation-fails',
        result.errors,
        'reviewRecordArchive.wcagEmReportToolExportOwnerHeld must be true',
      );
    },
  },
  {
    name: 'missing-route-coverage-fails',
    mutate(evidence) {
      evidence.checkpointResults[0].routesReviewed = REQUIRED_ROUTE_PATHS.filter((route) => route !== '/proof-pack-gallery');
    },
    assertion({ result }) {
      assertIncludes('missing-route-coverage-fails', result.errors, 'routesReviewed must include /proof-pack-gallery');
    },
  },
  {
    name: 'checkpoint-specific-summary-gap-fails',
    mutate(evidence) {
      const checkpointResult = evidence.checkpointResults.find((item) => item.checkpointId === 'keyboard-focus-not-obscured');
      checkpointResult.evidenceSummary.keyboardTraversalCompleted = false;
    },
    assertion({ result }) {
      assertIncludes('checkpoint-specific-summary-gap-fails', result.errors, 'requires evidenceSummary.keyboardTraversalCompleted=true');
    },
  },
  {
    name: 'owner-archive-attestation-fails',
    mutate(evidence) {
      evidence.ownerEvidenceArchive.rawReviewerNotesOwnerHeldOutsideGit = false;
    },
    assertion({ result }) {
      assertIncludes('owner-archive-attestation-fails', result.errors, 'ownerEvidenceArchive.rawReviewerNotesOwnerHeldOutsideGit must be true');
    },
  },
  {
    name: 'future-dated-checkpoint-fails',
    mutate(evidence) {
      evidence.checkpointResults[0].observedAt = '2999-01-01';
    },
    assertion({ result }) {
      assertIncludes('future-dated-checkpoint-fails', result.errors, 'checkpointResults[0].observedAt must not be future-dated');
    },
  },
  {
    name: 'unresolved-issue-keeps-gate-incomplete',
    mutate(evidence) {
      evidence.checkpointResults[0].unresolvedIssueCount = 1;
    },
    assertion({ result, artifact }) {
      if (result.errors.length !== 0) throw new Error(`expected unresolved issue to reject checkpoint without schema errors\n${result.errors.join('\n')}`);
      if (result.manualWcagGateSatisfied) throw new Error('expected manual WCAG gate to remain unsatisfied');
      if (artifact.status !== 'incomplete_evidence') throw new Error(`expected incomplete_evidence, got ${artifact.status}`);
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.assertion);
}

console.log(`Manual WCAG evidence fixture verification passed: ${cases.length} cases.`);
