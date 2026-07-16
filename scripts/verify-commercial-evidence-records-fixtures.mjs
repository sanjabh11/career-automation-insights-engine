#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  renderArtifact,
  validateCommercialEvidence,
  validateRenderedArtifactCounts,
} from './verify-commercial-evidence-records.mjs';

const EVIDENCE_PATH = 'docs/commercialization/commercial-evidence-records.local.json';
const ZERO_HASH = `sha256:${'0'.repeat(64)}`;

function sha256(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function writeJson(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function integrityAttestations(extra = {}) {
  return {
    marketingUseReviewed: true,
    materialConnectionReviewed: true,
    incentiveOrCompensationReviewed: true,
    noFakeOrSyntheticTestimonial: true,
    noReviewGatingOrSuppression: true,
    ...extra,
  };
}

function partnerArchive(extra = {}) {
  return {
    permissionTrailOwnerHeld: true,
    pilotScopeRecordOwnerHeld: true,
    artifactReviewLogOwnerHeld: true,
    contactDetailsOwnerHeldOutsideGit: true,
    materialConnectionReviewOwnerHeld: true,
    incentiveOrCompensationReviewOwnerHeld: true,
    reviewSolicitationNotConditionedOnSentiment: true,
    reReviewRequiredBeforePublicUse: true,
    ...extra,
  };
}

function outcomeArchive(extra = {}) {
  return {
    baselineWorkflowEvidenceOwnerHeld: true,
    measuredChangeEvidenceOwnerHeld: true,
    quoteApprovalRecordOwnerHeld: true,
    privateQuoteTextOwnerHeldOutsideGit: true,
    materialConnectionReviewOwnerHeld: true,
    incentiveOrCompensationReviewOwnerHeld: true,
    typicalitySubstantiationOwnerHeld: true,
    reReviewRequiredBeforePublicCaseStudyUse: true,
    ...extra,
  };
}

function designPartner(index, overrides = {}) {
  return {
    partnerIdHash: sha256(`partner-${index}`),
    segment: index === 1 ? 'career_coach' : index === 2 ? 'career_center' : 'workforce_program',
    committedAt: '2026-06-01',
    permissioned: true,
    contactPermission: true,
    pilotScopeAccepted: true,
    planningOnlyUseConfirmed: true,
    artifactReviewed: 'source-labeled planning proof pack',
    nextStepRecorded: true,
    proofArtifactHashes: [sha256(`partner-${index}-artifact-1`), sha256(`partner-${index}-artifact-2`)],
    proofArtifactTypes: ['permissioned_email', 'artifact_review_log'],
    rawEvidenceOwnerHeld: true,
    redactionLevel: 'public segment and hashed artifact metadata only',
    integrityAttestations: integrityAttestations(),
    ownerEvidenceArchive: partnerArchive(),
    doesNotProve: [
      'Revenue',
      'Successful outcomes',
      'Market-wide demand',
      'Legal compliance',
      'Testimonial compliance',
    ],
    ...overrides,
  };
}

function documentedOutcome(overrides = {}) {
  return {
    outcomeIdHash: sha256('outcome-1'),
    observedAt: '2026-06-01',
    permissioned: true,
    baselineWorkflowCaptured: true,
    artifactReviewed: 'source-labeled planning proof pack',
    measuredChangeCaptured: true,
    approvedQuoteCaptured: true,
    quoteApprovalCaptured: true,
    measuredChangeUnit: 'minutes_saved_per_review',
    measurementWindow: 'single owner-held pilot workflow observed during one review window',
    outcomeClaimScope: 'single permissioned workflow only; not generalized beyond this reviewed artifact',
    typicalityBoundary: 'not represented as typical or expected for other users without additional evidence',
    proofArtifactHashes: [sha256('outcome-artifact-1'), sha256('outcome-artifact-2'), sha256('outcome-artifact-3')],
    proofArtifactTypes: ['baseline_workflow_note', 'measured_change_summary', 'quote_approval'],
    rawEvidenceOwnerHeld: true,
    redactionLevel: 'public quote-approved metadata only',
    integrityAttestations: integrityAttestations({
      counterfactualNotClaimed: true,
      guaranteedOutcomeNotClaimed: true,
    }),
    ownerEvidenceArchive: outcomeArchive(),
    doesNotProve: [
      'Guaranteed career outcomes',
      'Causal impact',
      'Generalizable demand',
      'Legal compliance',
      'Testimonial compliance',
    ],
    ...overrides,
  };
}

function completeEvidence(overrides = {}) {
  return {
    schemaVersion: '2026-06-01.apo-commercial-evidence-records.v1',
    asOf: '2026-06-01',
    sourceBoundary:
      'Redacted founder-held commercial evidence metadata only. Raw partner names, contact details, notes, quotes, proof artifacts, and salts remain owner-held outside git.',
    designPartnerCommitments: [designPartner(1), designPartner(2), designPartner(3)],
    documentedOutcomes: [documentedOutcome()],
    ...overrides,
  };
}

function runFixture(root, evidence) {
  writeJson(root, EVIDENCE_PATH, evidence);
  const result = validateCommercialEvidence({ inputPath: EVIDENCE_PATH, root });
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-commercial-evidence-records-${name}-`));
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
    name: 'complete-commercial-evidence-records-pass',
    mutate() {},
    assertion({ result, artifact }) {
      if (result.errors.length !== 0) throw new Error(`expected no errors\n${result.errors.join('\n')}`);
      if (!result.partnerGateSatisfied) throw new Error('expected partner gate to be satisfied');
      if (!result.outcomeGateSatisfied) throw new Error('expected outcome gate to be satisfied');
      if (artifact.status !== 'passed') throw new Error(`expected passed artifact, got ${artifact.status}`);
      assertRenderedArtifactCounts('complete-commercial-evidence-records-pass', artifact);
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
    mutate() {},
    assertion({ artifact }) {
      artifact.errorCount += 1;
      assertIncludes('rendered-artifact-error-count-drift-fails', validateRenderedArtifactCounts(artifact), 'artifact_error_count_mismatch');
    },
  },
  {
    name: 'two-design-partners-fail-partner-gate',
    mutate(evidence) {
      evidence.designPartnerCommitments.pop();
    },
    assertion({ result, artifact }) {
      if (result.errors.length !== 0) throw new Error(`expected insufficiency without schema errors\n${result.errors.join('\n')}`);
      if (result.partnerGateSatisfied) throw new Error('expected partner gate to remain unsatisfied');
      if (artifact.status !== 'insufficient_records') throw new Error(`expected insufficient_records, got ${artifact.status}`);
    },
  },
  {
    name: 'placeholder-partner-id-hash-fails',
    mutate(evidence) {
      evidence.designPartnerCommitments[0].partnerIdHash = ZERO_HASH;
    },
    assertion({ result }) {
      assertIncludes('placeholder-partner-id-hash-fails', result.errors, 'partnerIdHash must be a non-placeholder sha256 hash');
    },
  },
  {
    name: 'duplicate-partner-hashes-fail',
    mutate(evidence) {
      evidence.designPartnerCommitments[1].partnerIdHash = evidence.designPartnerCommitments[0].partnerIdHash;
    },
    assertion({ result }) {
      assertIncludes('duplicate-partner-hashes-fail', result.errors, 'duplicate hash appears');
    },
  },
  {
    name: 'private-contact-pattern-fails',
    mutate(evidence) {
      evidence.sourceBoundary = 'Redacted metadata only. Contact reviewer@example.com remains forbidden in tracked evidence.';
    },
    assertion({ result }) {
      assertIncludes('private-contact-pattern-fails', result.errors, 'email_address');
    },
  },
  {
    name: 'private-profile-url-fails',
    mutate(evidence) {
      evidence.designPartnerCommitments[0].artifactReviewed =
        'source-labeled planning proof pack reviewed from https://www.linkedin.com/in/private-reviewer';
    },
    assertion({ result }) {
      assertIncludes('private-profile-url-fails', result.errors, 'private_profile_url');
    },
  },
  {
    name: 'meeting-link-fails',
    mutate(evidence) {
      evidence.designPartnerCommitments[0].artifactReviewed =
        'source-labeled planning proof pack reviewed after https://calendly.com/private-owner/demo';
    },
    assertion({ result }) {
      assertIncludes('meeting-link-fails', result.errors, 'meeting_or_calendar_link');
    },
  },
  {
    name: 'stripe-checkout-url-fails',
    mutate(evidence) {
      evidence.sourceBoundary =
        'Redacted metadata only. Raw checkout URL https://checkout.stripe.com/c/pay/cs_test_private remains forbidden.';
    },
    assertion({ result }) {
      assertIncludes('stripe-checkout-url-fails', result.errors, 'stripe_checkout_url');
    },
  },
  {
    name: 'outcome-missing-required-proof-type-fails',
    mutate(evidence) {
      evidence.documentedOutcomes[0].proofArtifactTypes = ['baseline_workflow_note', 'measured_change_summary'];
    },
    assertion({ result }) {
      assertIncludes('outcome-missing-required-proof-type-fails', result.errors, 'proofArtifactTypes must include quote_approval');
    },
  },
  {
    name: 'owner-archive-attestation-fails',
    mutate(evidence) {
      evidence.designPartnerCommitments[0].ownerEvidenceArchive = partnerArchive({
        reReviewRequiredBeforePublicUse: false,
      });
    },
    assertion({ result }) {
      assertIncludes('owner-archive-attestation-fails', result.errors, 'ownerEvidenceArchive.reReviewRequiredBeforePublicUse must be true');
    },
  },
  {
    name: 'future-dated-record-fails',
    mutate(evidence) {
      evidence.designPartnerCommitments[0].committedAt = '2999-01-01';
    },
    assertion({ result }) {
      assertIncludes('future-dated-record-fails', result.errors, 'committedAt must not be future-dated');
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.assertion);
}

console.log(`Commercial evidence records fixture verification passed: ${cases.length} cases.`);
