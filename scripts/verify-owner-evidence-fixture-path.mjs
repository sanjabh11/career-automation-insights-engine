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

function buildLiveEvidence(asOf) {
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
    redactionLevel: 'fixture hashes only; no partner names, contacts, contracts, or notes',
    doesNotProve: ['Revenue', 'Successful outcomes', 'Market-wide demand'],
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
        redactionLevel: 'fixture hash only; no customer identity, private quote, or raw notes',
        doesNotProve: ['Guaranteed career outcomes', 'Causal product impact', 'Generalizable demand'],
      },
    ],
  };
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apo-owner-evidence-fixtures-'));
const liveEvidencePath = path.join(tempDir, 'live-gate-evidence.fixture.json');
const commercialEvidencePath = path.join(tempDir, 'commercial-evidence-records.fixture.json');
const asOf = evidenceDate();

try {
  writeJson(liveEvidencePath, buildLiveEvidence(asOf));
  writeJson(commercialEvidencePath, buildCommercialEvidence(asOf));

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
    runStep('validate-final-remediation-gates-fixture', [
      'scripts/verify-remediation-external-gates.mjs',
      '--live-evidence',
      liveEvidencePath,
      '--commercial-evidence',
      commercialEvidencePath,
      '--require-complete',
    ]),
  ];

  const failed = steps.filter((step) => step.status !== 'pass');
  const finalStep = steps.at(-1);
  const finalOutput = finalStep?.stdout ? JSON.parse(finalStep.stdout) : null;
  const result = {
    ok: failed.length === 0 && finalOutput?.goalComplete === true,
    fixtureBoundary:
      'Synthetic non-secret metadata only. This proves validator compatibility, not live checkout, production calibration, live MRR, partner commitments, or outcomes.',
    tempDir: keepFixtures ? tempDir : null,
    liveEvidencePath: keepFixtures ? liveEvidencePath : null,
    commercialEvidencePath: keepFixtures ? commercialEvidencePath : null,
    goalCompleteWithSyntheticFixtures: finalOutput?.goalComplete === true,
    steps: steps.map((step) => ({
      id: step.id,
      status: step.status,
      exitCode: step.exitCode,
    })),
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    for (const step of failed) {
      console.error(`\n${step.id} failed with exit ${step.exitCode}`);
      if (step.stdout) console.error(step.stdout);
      if (step.stderr) console.error(step.stderr);
    }
    process.exitCode = 1;
  }
} finally {
  if (!keepFixtures) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
