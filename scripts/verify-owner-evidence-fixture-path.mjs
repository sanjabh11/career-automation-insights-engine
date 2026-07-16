#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const keepFixtures = process.argv.includes('--keep-fixtures');

function sha256(value) {
  return `sha256:${createHash('sha256').update(String(value)).digest('hex')}`;
}

function evidenceDate() {
  const date = new Date(Date.now() - 86_400_000);
  return date.toISOString().slice(0, 10);
}

function runStep(id, args) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
  });

  return {
    id,
    command: `node ${args.join(' ')}`,
    status: result.status === 0 ? 'pass' : 'fail',
    exitCode: result.status,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
  };
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeMutatedJson(sourcePath, targetPath, mutate) {
  const value = readJson(sourcePath);
  mutate(value);
  writeJson(targetPath, value);
  return targetPath;
}

function runExpectedFailure(id, args, expectedSnippets) {
  const step = runStep(id, args);
  const combinedOutput = `${step.stdout}\n${step.stderr}`;
  const missingExpectedSnippets = expectedSnippets.filter((snippet) => !combinedOutput.includes(snippet));
  return {
    id,
    command: step.command,
    status: step.exitCode !== 0 && missingExpectedSnippets.length === 0 ? 'pass' : 'fail',
    exitCode: step.exitCode,
    expectedExitCode: 'nonzero',
    missingExpectedSnippets,
  };
}

function buildLiveEvidence(asOf) {
  const archive = (values) => Object.fromEntries(values.map((key) => [key, true]));

  return {
    schemaVersion: '2026-05-31.apo-live-gate-evidence.v1',
    asOf,
    sourceBoundary:
      'Synthetic non-secret fixture metadata for verifier coverage only. Real proof, identities, screenshots, exports, and secrets remain owner-held.',
    evidenceItems: [
      {
        gateId: 'real_stripe_test_checkout',
        status: 'proven',
        observedAt: asOf,
        evidenceType: 'stripe_test_checkout_session',
        redactionBoundary:
          'Fixture uses synthetic metadata only; Stripe keys, session payloads, customer identity, and payment details are not present.',
        evidenceSummary: {
          testMode: true,
          checkoutSessionCreated: true,
          checkoutSessionMode: 'subscription',
          checkoutSessionStatus: 'open',
          paymentStatus: 'unpaid',
          edgeFunction: 'create-checkout-session',
          ownerEvidenceArchive: archive([
            'rawCheckoutSessionPayloadOwnerHeld',
            'supabaseFunctionInvocationMetadataOwnerHeld',
            'secretValuesNotPersisted',
            'customerIdentifiersRedacted',
            'paymentMethodDetailsExcluded',
            'reRunRequiredAfterCheckoutConfigChange',
          ]),
        },
        artifactHashes: [sha256('fixture-stripe-test-checkout-artifact')],
        doesNotProve: ['Live revenue', 'MRR', 'Payment fulfillment in live mode'],
      },
      {
        gateId: 'production_calibration_run',
        status: 'proven',
        observedAt: asOf,
        evidenceType: 'production_calibration_run',
        redactionBoundary:
          'Fixture uses synthetic aggregate metadata only; Supabase service-role keys, raw logs, and non-public labels are not present.',
        evidenceSummary: {
          ece: 0.12,
          expertAssessmentCount: 12,
          predictionPairCount: 12,
          ownerEvidenceArchive: archive([
            'rawCalibrationRunOutputOwnerHeld',
            'serviceRoleSecretNotPersisted',
            'respondentIdentifiersRedacted',
            'expertLabelsOwnerHeld',
            'reRunRequiredAfterModelOrDataChange',
          ]),
        },
        artifactHashes: [sha256('fixture-production-calibration-artifact')],
        doesNotProve: ['Scientific validation', 'Generalization beyond accepted live labels'],
      },
      {
        gateId: 'authenticated_live_artifact_e2e',
        status: 'proven',
        observedAt: asOf,
        evidenceType: 'authenticated_live_e2e',
        redactionBoundary:
          'Fixture uses synthetic e2e metadata only; credentials, auth tokens, raw resume text, and stored artifacts are not present.',
        evidenceSummary: {
          passed: true,
          syntheticUser: true,
          ownerEvidenceArchive: archive([
            'syntheticUserOnly',
            'credentialsNotPersisted',
            'authTokensNotPersisted',
            'rawArtifactPayloadsRedacted',
            'deletionReceiptsOwnerHeld',
            'reRunRequiredAfterPersistenceChange',
          ]),
        },
        artifactHashes: [sha256('fixture-authenticated-live-artifact-e2e')],
        doesNotProve: ['Payment proof', 'Malware scanning', 'Legal compliance'],
      },
      {
        gateId: 'live_mrr_gt_zero',
        status: 'proven',
        observedAt: asOf,
        evidenceType: 'stripe_live_mrr_export',
        redactionBoundary:
          'Fixture uses synthetic aggregate metadata only; live Stripe keys, customer identities, subscription IDs, and invoices are not present.',
        evidenceSummary: {
          liveMode: true,
          totalMrrGreaterThanZero: true,
          activeSubscriptionCount: 1,
          paidInvoiceCount: 1,
          ownerEvidenceArchive: archive([
            'rawSubscriptionExportOwnerHeld',
            'rawInvoiceExportOwnerHeld',
            'secretValuesNotPersisted',
            'customerIdentifiersRedacted',
            'subscriptionAndInvoiceIdsHashed',
            'paymentMethodDetailsExcluded',
            'reRunRequiredAfterRevenueChange',
          ]),
        },
        artifactHashes: [sha256('fixture-live-mrr-artifact')],
        doesNotProve: ['Retention', 'Product-market fit', 'Future revenue', 'Accounting-recognized revenue'],
      },
    ],
  };
}

function buildCommercialEvidence(asOf) {
  const partner = (index, segment) => ({
    partnerIdHash: sha256(`fixture-design-partner-${index}`),
    segment,
    committedAt: asOf,
    permissioned: true,
    contactPermission: true,
    pilotScopeAccepted: true,
    planningOnlyUseConfirmed: true,
    artifactReviewed: 'redacted proof-pack sample',
    nextStepRecorded: true,
    proofArtifactHashes: [
      sha256(`fixture-design-partner-${index}-permission-proof`),
      sha256(`fixture-design-partner-${index}-artifact-review-log`),
    ],
    proofArtifactTypes: ['permissioned_email', 'artifact_review_log'],
    rawEvidenceOwnerHeld: true,
    redactionLevel: 'fixture hashes only; no partner names, contacts, contracts, or notes',
    integrityAttestations: {
      marketingUseReviewed: true,
      materialConnectionReviewed: true,
      incentiveOrCompensationReviewed: true,
      noFakeOrSyntheticTestimonial: true,
      noReviewGatingOrSuppression: true,
    },
    ownerEvidenceArchive: {
      permissionTrailOwnerHeld: true,
      pilotScopeRecordOwnerHeld: true,
      artifactReviewLogOwnerHeld: true,
      contactDetailsOwnerHeldOutsideGit: true,
      materialConnectionReviewOwnerHeld: true,
      incentiveOrCompensationReviewOwnerHeld: true,
      reviewSolicitationNotConditionedOnSentiment: true,
      reReviewRequiredBeforePublicUse: true,
    },
    doesNotProve: ['Revenue', 'Successful outcomes', 'Market-wide demand', 'Testimonial compliance'],
  });

  return {
    schemaVersion: '2026-06-01.apo-commercial-evidence-records.v1',
    asOf,
    sourceBoundary:
      'Synthetic non-secret commercial evidence fixture for verifier coverage only. Raw partner names, contacts, contracts, notes, quotes, customer data, and salts are not present.',
    designPartnerCommitments: [
      partner(1, 'career coaching practice'),
      partner(2, 'workforce training nonprofit'),
      partner(3, 'college career services team'),
    ],
    documentedOutcomes: [
      {
        outcomeIdHash: sha256('fixture-documented-outcome-1'),
        observedAt: asOf,
        permissioned: true,
        baselineWorkflowCaptured: true,
        artifactReviewed: 'redacted proof-pack sample',
        measuredChangeCaptured: true,
        approvedQuoteCaptured: true,
        quoteApprovalCaptured: true,
        measuredChangeUnit: 'fixture_review_cycle_delta',
        measurementWindow: 'single synthetic fixture observation window',
        outcomeClaimScope: 'synthetic fixture validates verifier shape only, not a real outcome',
        typicalityBoundary: 'not represented as typical or expected for any user',
        proofArtifactHashes: [
          sha256('fixture-documented-outcome-baseline-workflow'),
          sha256('fixture-documented-outcome-measured-change'),
          sha256('fixture-documented-outcome-quote-approval'),
        ],
        proofArtifactTypes: ['baseline_workflow_note', 'measured_change_summary', 'quote_approval'],
        rawEvidenceOwnerHeld: true,
        redactionLevel: 'fixture hash only; no customer identity, private quote, or raw notes',
        integrityAttestations: {
          marketingUseReviewed: true,
          materialConnectionReviewed: true,
          incentiveOrCompensationReviewed: true,
          noFakeOrSyntheticTestimonial: true,
          noReviewGatingOrSuppression: true,
          counterfactualNotClaimed: true,
          guaranteedOutcomeNotClaimed: true,
        },
        ownerEvidenceArchive: {
          baselineWorkflowEvidenceOwnerHeld: true,
          measuredChangeEvidenceOwnerHeld: true,
          quoteApprovalRecordOwnerHeld: true,
          privateQuoteTextOwnerHeldOutsideGit: true,
          materialConnectionReviewOwnerHeld: true,
          incentiveOrCompensationReviewOwnerHeld: true,
          typicalitySubstantiationOwnerHeld: true,
          reReviewRequiredBeforePublicCaseStudyUse: true,
        },
        doesNotProve: ['Guaranteed career outcomes', 'Causal product impact', 'Generalizable demand', 'Testimonial compliance'],
      },
    ],
  };
}

function buildManualWcagEvidence(asOf) {
  const routesReviewed = [
    '/privacy',
    '/trust-center',
    '/for-coaches',
    '/sample-report',
    '/tools/resume-analyzer',
    '/tools/counselor-reports',
    '/enterprise-dashboard',
    '/proof-pack-gallery',
    '/automation-risk/accountant',
  ];
  const checkpointStandardRefs = {
    'wcag-em-scope': ['wcag-em-overview', 'wcag-em-2', 'wcag-em-report-tool'],
    'keyboard-focus-not-obscured': ['wcag22'],
    'target-size': ['wcag22'],
    'form-errors-and-redundant-entry': ['wcag22', 'wai-easy-checks'],
    'accessible-authentication': ['wcag22'],
    'screen-reader-name-role-value': ['wcag22', 'wai-aria-apg'],
    'contrast-reflow-text-spacing': ['wcag22', 'wai-easy-checks'],
    'downloadable-artifacts': ['wcag22', 'wai-easy-checks', 'wai-aria-apg', 'wcag2ict-22'],
  };
  const checkpoint = (checkpointId, evidenceSummary) => ({
    checkpointId,
    status: 'passed',
    observedAt: asOf,
    reviewedByHuman: true,
    routesReviewed,
    artifactHashes: [sha256(`fixture-manual-wcag-${checkpointId}`)],
    standardRefs: checkpointStandardRefs[checkpointId],
    evidenceSummary,
    unresolvedIssueCount: 0,
    remediatedIssueCount: 0,
    doesNotProve: ['WCAG conformance statement', 'Legal compliance', 'Future accessibility after code changes'],
  });

  return {
    schemaVersion: '2026-06-04.apo-manual-wcag-evidence.v1',
    asOf,
    sourceBoundary:
      'Synthetic non-secret manual WCAG fixture metadata for verifier coverage only. Raw notes, screenshots, recordings, reviewer identity, assistive-technology transcripts, and issue details are not present.',
    targetStandard: 'WCAG 2.2 A/AA',
    methodology: 'WCAG-EM',
    officialReferences: [
      {
        id: 'wcag22',
        label: 'WCAG 2.2 Recommendation',
        url: 'https://www.w3.org/TR/WCAG22/',
        accessedAt: asOf,
      },
      {
        id: 'wcag-em-overview',
        label: 'WCAG-EM overview',
        url: 'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/',
        accessedAt: asOf,
      },
      {
        id: 'wcag-em-2',
        label: 'WCAG-EM 2.0',
        url: 'https://www.w3.org/TR/wcag-em-2/',
        accessedAt: asOf,
      },
      {
        id: 'wcag-em-report-tool',
        label: 'WCAG-EM Report Tool',
        url: 'https://www.w3.org/WAI/eval/report-tool/',
        accessedAt: asOf,
      },
      {
        id: 'wai-easy-checks',
        label: 'WAI Easy Checks',
        url: 'https://www.w3.org/WAI/test-evaluate/preliminary/',
        accessedAt: asOf,
      },
      {
        id: 'wai-aria-apg',
        label: 'WAI-ARIA Authoring Practices',
        url: 'https://www.w3.org/WAI/ARIA/apg/',
        accessedAt: asOf,
      },
      {
        id: 'wcag2ict-22',
        label: 'WCAG2ICT 2.2',
        url: 'https://www.w3.org/TR/wcag2ict-22/',
        accessedAt: asOf,
      },
    ],
    evaluator: {
      reviewerIdHash: sha256('fixture-accessibility-reviewer'),
      role: 'accessibility reviewer',
      reviewType: 'synthetic fixture self-assessment',
      independenceBoundary: 'fixture reviewer boundary only; not a real independent review',
      expertiseConfirmed: true,
      conflictOfInterestDisclosed: true,
    },
    evaluationScope: {
      productScope:
        'Synthetic APO Dashboard commercial launch review scope covering trust pages, report generation, proof downloads, and account/payment access.',
      sampleSelectionRationale:
        'Synthetic fixture route sample mirrors the high-risk commercial launch surfaces used by the owner-held WCAG-EM review worksheet.',
      sampleSetSelectionMethod: 'synthetic structured route sample for verifier coverage',
      technologiesReliedUpon: ['HTML', 'CSS', 'JavaScript', 'WAI-ARIA'],
      routesReviewed,
      completeProcessesReviewed: [
        'public-trust-navigation',
        'resume-analysis-proof-report',
        'counselor-report-generation',
        'proof-pack-downloads',
        'payment-and-account-access',
      ],
      browsers: ['Chromium fixture'],
      assistiveTechnologies: ['Screen reader fixture'],
      viewports: ['mobile', 'tablet', 'desktop'],
      accessibilitySupportBaseline: [
        {
          id: 'fixture-chromium-screen-reader-desktop',
          operatingSystem: 'Fixture OS desktop',
          browser: 'Chromium fixture',
          assistiveTechnology: 'Screen reader fixture',
          inputModalities: ['keyboard', 'screen_reader'],
          viewports: ['desktop'],
        },
        {
          id: 'fixture-chromium-screen-reader-mobile',
          operatingSystem: 'Fixture OS mobile',
          browser: 'Chromium fixture',
          assistiveTechnology: 'Screen reader fixture',
          inputModalities: ['keyboard', 'screen_reader'],
          viewports: ['mobile'],
        },
      ],
      conformanceTarget: 'WCAG 2.2 A/AA',
    },
    reviewRecordArchive: {
      samplesArchivedOwnerHeld: true,
      evaluationToolsRecorded: true,
      wcagEmReportToolExportOwnerHeld: true,
      browserAssistiveTechnologyVersionsRecorded: true,
      navigationPathsRecorded: true,
      issueLogOwnerHeld: true,
      rawEvidenceSecurityReviewed: true,
      reEvaluationRequiredAfterMaterialChange: true,
    },
    ownerEvidenceArchive: {
      rawReviewerNotesOwnerHeldOutsideGit: true,
      screenshotsRecordingsOwnerHeldOutsideGit: true,
      assistiveTechnologyTranscriptsOwnerHeldOutsideGit: true,
      reviewerIdentityOwnerHeldOutsideGit: true,
      issueDetailsOwnerHeldOutsideGit: true,
      evaluationToolOutputOwnerHeldOutsideGit: true,
      sampleArchivesOwnerHeldOutsideGit: true,
      artifactHashSourceMapOwnerHeld: true,
      reReviewRequiredAfterMaterialChange: true,
    },
    reviewerAttestation: {
      manualReviewCompleted: true,
      assistiveTechnologyReviewCompleted: true,
      noWcagConformanceClaim: true,
      noProcurementApprovalClaim: true,
      ownerHeldRawNotes: true,
    },
    checkpointResults: [
      checkpoint('wcag-em-scope', {
        scopeDefined: true,
        conformanceTarget: 'WCAG 2.2 A/AA',
        productScopeDefined: true,
        sampleSelectionRationaleDocumented: true,
        completeProcessesReviewed: true,
        accessibilitySupportBaselineDefined: true,
      }),
      checkpoint('keyboard-focus-not-obscured', { keyboardTraversalCompleted: true, focusNotObscuredChecked: true }),
      checkpoint('target-size', { pointerTargetReviewCompleted: true }),
      checkpoint('form-errors-and-redundant-entry', { errorStateReviewCompleted: true, redundantEntryReviewCompleted: true }),
      checkpoint('accessible-authentication', { authFlowReviewed: true }),
      checkpoint('screen-reader-name-role-value', {
        assistiveTechnologies: ['Screen reader fixture'],
        nameRoleValueReviewCompleted: true,
      }),
      checkpoint('contrast-reflow-text-spacing', {
        contrastReviewCompleted: true,
        reflowAndTextSpacingReviewCompleted: true,
      }),
      checkpoint('downloadable-artifacts', {
        artifactsReviewed: ['fixture trust packet HTML', 'fixture risk CSV'],
        downloadedArtifactReviewCompleted: true,
      }),
    ],
  };
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apo-owner-evidence-fixtures-'));
const liveEvidencePath = path.join(tempDir, 'live-gate-evidence.fixture.json');
const commercialEvidencePath = path.join(tempDir, 'commercial-evidence-records.fixture.json');
const manualWcagEvidencePath = path.join(tempDir, 'manual-wcag-evidence.fixture.json');
const ZERO_SHA256 = `sha256:${'0'.repeat(64)}`;
const asOf = evidenceDate();

try {
  writeJson(liveEvidencePath, buildLiveEvidence(asOf));
  writeJson(commercialEvidencePath, buildCommercialEvidence(asOf));
  writeJson(manualWcagEvidencePath, buildManualWcagEvidence(asOf));

  const steps = [
    runStep('validate-live-evidence-fixture', [
      'scripts/verify-live-gate-evidence.mjs',
      '--evidence',
      liveEvidencePath,
      '--require-complete',
    ]),
    runStep('validate-commercial-evidence-fixture', [
      'scripts/verify-commercial-evidence-records.mjs',
      '--evidence',
      commercialEvidencePath,
      '--require-all',
    ]),
    runStep('validate-manual-wcag-evidence-fixture', [
      'scripts/verify-manual-wcag-evidence.mjs',
      '--evidence',
      manualWcagEvidencePath,
      '--require-complete',
    ]),
    runStep('validate-final-remediation-gates-fixture', [
      'scripts/verify-remediation-external-gates.mjs',
      '--live-evidence',
      liveEvidencePath,
      '--commercial-evidence',
      commercialEvidencePath,
      '--manual-wcag-evidence',
      manualWcagEvidencePath,
      '--require-complete',
    ]),
  ];

  const negativeCases = [
    runExpectedFailure(
      'live-gate-stripe-hosted-payment-url-fails',
      [
        'scripts/verify-live-gate-evidence.mjs',
        '--evidence',
        writeMutatedJson(
          liveEvidencePath,
          path.join(tempDir, 'live-gate-stripe-hosted-payment-url.fixture.json'),
          (value) => {
            value.evidenceItems[0].redactionBoundary += ' Raw hosted URL https://checkout.stripe.com/c/pay/cs_test_fixture remains owner-held.';
          },
        ),
        '--require-complete',
      ],
      ['private-contact pattern: stripe_hosted_payment_url'],
    ),
    runExpectedFailure(
      'live-gate-stripe-dashboard-url-fails',
      [
        'scripts/verify-live-gate-evidence.mjs',
        '--evidence',
        writeMutatedJson(
          liveEvidencePath,
          path.join(tempDir, 'live-gate-stripe-dashboard-url.fixture.json'),
          (value) => {
            value.evidenceItems[3].evidenceSummary.ownerDashboard = 'https://dashboard.stripe.com/subscriptions/sub_fixture';
          },
        ),
        '--require-complete',
      ],
      ['private-contact pattern: stripe_dashboard_url'],
    ),
    runExpectedFailure(
      'live-gate-supabase-dashboard-url-fails',
      [
        'scripts/verify-live-gate-evidence.mjs',
        '--evidence',
        writeMutatedJson(
          liveEvidencePath,
          path.join(tempDir, 'live-gate-supabase-dashboard-url.fixture.json'),
          (value) => {
            value.evidenceItems[2].evidenceSummary.ownerDashboard =
              'https://supabase.com/dashboard/project/abcdefghijklmnopqrst/auth/users';
          },
        ),
        '--require-complete',
      ],
      ['private-contact pattern: supabase_dashboard_url'],
    ),
    runExpectedFailure(
      'live-gate-meeting-link-fails',
      [
        'scripts/verify-live-gate-evidence.mjs',
        '--evidence',
        writeMutatedJson(
          liveEvidencePath,
          path.join(tempDir, 'live-gate-meeting-link.fixture.json'),
          (value) => {
            value.sourceBoundary += ' Owner review call https://calendly.com/founder/live-proof-review remains owner-held.';
          },
        ),
        '--require-complete',
      ],
      ['private-contact pattern: meeting_or_calendar_link'],
    ),
    runExpectedFailure(
      'manual-wcag-placeholder-hash-fails',
      [
        'scripts/verify-manual-wcag-evidence.mjs',
        '--evidence',
        writeMutatedJson(
          manualWcagEvidencePath,
          path.join(tempDir, 'manual-wcag-placeholder-hash.fixture.json'),
          (value) => {
            value.checkpointResults[0].artifactHashes = [ZERO_SHA256];
          },
        ),
        '--require-complete',
      ],
      ['artifactHashes must contain at least one sha256'],
    ),
    runExpectedFailure(
      'manual-wcag-private-contact-fails',
      [
        'scripts/verify-manual-wcag-evidence.mjs',
        '--evidence',
        writeMutatedJson(
          manualWcagEvidencePath,
          path.join(tempDir, 'manual-wcag-private-contact.fixture.json'),
          (value) => {
            value.evaluationScope.productScope += ' owner reviewer test@example.com';
          },
        ),
        '--require-complete',
      ],
      ['private-contact pattern: email_address'],
    ),
    runExpectedFailure(
      'commercial-evidence-future-date-fails',
      [
        'scripts/verify-commercial-evidence-records.mjs',
        '--evidence',
        writeMutatedJson(
          commercialEvidencePath,
          path.join(tempDir, 'commercial-evidence-future-date.fixture.json'),
          (value) => {
            const futureDate = new Date(Date.now() + 172_800_000).toISOString().slice(0, 10);
            value.asOf = futureDate;
            value.designPartnerCommitments[0].committedAt = futureDate;
          },
        ),
        '--require-all',
      ],
      ['must not be future-dated'],
    ),
    runExpectedFailure(
      'commercial-evidence-missing-archive-attestation-fails',
      [
        'scripts/verify-commercial-evidence-records.mjs',
        '--evidence',
        writeMutatedJson(
          commercialEvidencePath,
          path.join(tempDir, 'commercial-evidence-missing-archive.fixture.json'),
          (value) => {
            delete value.designPartnerCommitments[0].ownerEvidenceArchive.permissionTrailOwnerHeld;
          },
        ),
        '--require-all',
      ],
      ['ownerEvidenceArchive.permissionTrailOwnerHeld must be true'],
    ),
    runExpectedFailure(
      'final-remediation-incomplete-live-evidence-fails',
      [
        'scripts/verify-remediation-external-gates.mjs',
        '--live-evidence',
        writeMutatedJson(
          liveEvidencePath,
          path.join(tempDir, 'live-gate-evidence-incomplete.fixture.json'),
          (value) => {
            value.evidenceItems = value.evidenceItems.filter((item) => item.gateId !== 'live_mrr_gt_zero');
          },
        ),
        '--commercial-evidence',
        commercialEvidencePath,
        '--manual-wcag-evidence',
        manualWcagEvidencePath,
        '--require-complete',
      ],
      ['"goalComplete": false', 'live_mrr_gt_zero'],
    ),
  ];

  const failed = steps.filter((step) => step.status !== 'pass');
  const failedNegativeCases = negativeCases.filter((step) => step.status !== 'pass');
  const finalStep = steps.at(-1);
  const finalOutput = finalStep?.stdout ? JSON.parse(finalStep.stdout) : null;
  const result = {
    ok: failed.length === 0 && failedNegativeCases.length === 0 && finalOutput?.goalComplete === true,
    fixtureBoundary:
      'Synthetic non-secret metadata only. This proves validator compatibility and fail-closed behavior, not live checkout, production calibration, live MRR, partner commitments, manual WCAG conformance, or outcomes.',
    tempDir: keepFixtures ? tempDir : null,
    liveEvidencePath: keepFixtures ? liveEvidencePath : null,
    commercialEvidencePath: keepFixtures ? commercialEvidencePath : null,
    manualWcagEvidencePath: keepFixtures ? manualWcagEvidencePath : null,
    goalCompleteWithSyntheticFixtures: finalOutput?.goalComplete === true,
    steps: steps.map((step) => ({
      id: step.id,
      status: step.status,
      exitCode: step.exitCode,
    })),
    negativeCases: negativeCases.map((step) => ({
      id: step.id,
      status: step.status,
      exitCode: step.exitCode,
      expectedExitCode: step.expectedExitCode,
      missingExpectedSnippets: step.missingExpectedSnippets,
    })),
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    for (const step of [...failed, ...failedNegativeCases]) {
      console.error(`\n${step.id} failed with exit ${step.exitCode}`);
      if (step.stdout) console.error(step.stdout);
      if (step.stderr) console.error(step.stderr);
      if (step.missingExpectedSnippets?.length) {
        console.error(`Missing expected snippet(s): ${step.missingExpectedSnippets.join(', ')}`);
      }
    }
    process.exitCode = 1;
  }
} finally {
  if (!keepFixtures) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
