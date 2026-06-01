#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  DEFAULT_LIVE_GATE_EVIDENCE_PATH,
  LIVE_GATE_EVIDENCE_SCHEMA_VERSION,
  validateLiveGateEvidence,
} from './lib/liveGateEvidence.mjs';

const root = process.cwd();

function hasFlag(name) {
  return process.argv.includes(name);
}

function readFlagValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJsonArtifact(relativePath) {
  const absolutePath = path.isAbsolute(relativePath) ? relativePath : path.join(root, relativePath);
  const relativeDisplayPath = path.relative(root, absolutePath) || path.basename(absolutePath);
  if (!fs.existsSync(absolutePath)) {
    return {
      artifactPath: relativeDisplayPath,
      found: false,
      source: '',
      artifact: null,
      errors: [`${relativeDisplayPath} is missing`],
    };
  }

  const source = fs.readFileSync(absolutePath, 'utf8');
  try {
    return {
      artifactPath: relativeDisplayPath,
      found: true,
      source,
      artifact: JSON.parse(source),
      errors: [],
    };
  } catch {
    return {
      artifactPath: relativeDisplayPath,
      found: true,
      source,
      artifact: null,
      errors: [`${relativeDisplayPath} must be valid JSON`],
    };
  }
}

function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function artifactHash(source) {
  return `sha256:${sha256(source)}`;
}

function isPassedArtifact(artifact) {
  return artifact?.status === 'passed' && Array.isArray(artifact.checks) && artifact.checks.every((check) => check?.passed === true);
}

function dateValue(value) {
  const timestamp = Date.parse(value || '');
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function asOfFromItems(items) {
  const latest = items.reduce((max, item) => Math.max(max, dateValue(item.observedAt)), 0);
  return new Date(latest || Date.now()).toISOString().slice(0, 10);
}

function positiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function checkIds(artifact) {
  return new Set((artifact?.checks || []).map((check) => check?.id).filter(Boolean));
}

function buildStripeTestCheckoutItem(artifact, source) {
  const summary = artifact.evidenceSummary || {};
  const errors = [];
  if (summary.testMode !== true) errors.push('stripe test checkout artifact must report evidenceSummary.testMode=true');
  if (summary.checkoutSessionCreated !== true) errors.push('stripe test checkout artifact must report evidenceSummary.checkoutSessionCreated=true');
  if (summary.edgeFunction !== 'create-checkout-session') errors.push('stripe test checkout artifact must identify create-checkout-session');

  return {
    errors,
    item: {
      gateId: 'real_stripe_test_checkout',
      status: 'proven',
      observedAt: artifact.generatedAt,
      evidenceType: 'stripe_test_checkout_session',
      redactionBoundary: 'Stripe keys, customer identity, payment method details, and raw Checkout Session payload are owner-held outside the repository.',
      artifactHashes: [artifactHash(source)],
      evidenceSummary: {
        testMode: summary.testMode === true,
        checkoutSessionCreated: summary.checkoutSessionCreated === true,
        checkoutUrlOpened: summary.checkoutUrlOpened === true,
        edgeFunction: 'create-checkout-session',
      },
      doesNotProve: artifact.doesNotProve || [
        'Live revenue',
        'MRR',
        'Payment fulfillment in live mode',
      ],
    },
  };
}

function buildProductionCalibrationItem(artifact, source) {
  const summary = artifact.evidenceSummary || {};
  const errors = [];
  if (typeof summary.ece !== 'number' || summary.ece < 0 || summary.ece > 1) errors.push('production calibration artifact must report evidenceSummary.ece in [0,1]');
  if (!positiveInteger(summary.expertAssessmentCount)) errors.push('production calibration artifact must report positive evidenceSummary.expertAssessmentCount');
  if (!positiveInteger(summary.predictionPairCount)) errors.push('production calibration artifact must report positive evidenceSummary.predictionPairCount');
  if (summary.method !== 'apo_overall_vs_expert_assessments') errors.push('production calibration artifact must report the expert-assessment calibration method');

  return {
    errors,
    item: {
      gateId: 'production_calibration_run',
      status: 'proven',
      observedAt: artifact.generatedAt,
      evidenceType: 'production_calibration_run',
      redactionBoundary: 'Supabase service-role key, raw APO logs, respondent details, and non-public expert labels are owner-held outside the repository.',
      artifactHashes: [artifactHash(source)],
      evidenceSummary: {
        ece: summary.ece,
        expertAssessmentCount: summary.expertAssessmentCount,
        predictionPairCount: summary.predictionPairCount,
        targetProject: summary.targetProjectHash ? 'redacted_hash' : 'redacted',
      },
      doesNotProve: artifact.doesNotProve || [
        'Scientific validity beyond the measured sample',
        'Future model performance',
        'Employment-decision validity',
      ],
    },
  };
}

function buildAuthenticatedLiveE2eItem(artifact, source) {
  const ids = checkIds(artifact);
  const errors = [];
  if (!ids.has('auth-sign-in')) errors.push('authenticated live e2e artifact must include auth-sign-in check');
  if (!ids.has('redacted-artifact-create')) errors.push('authenticated live e2e artifact must include redacted-artifact-create check');
  if (!ids.has('redacted-artifact-delete-receipt')) errors.push('authenticated live e2e artifact must include redacted-artifact-delete-receipt check');
  if (!ids.has('redacted-artifact-delete-readback')) errors.push('authenticated live e2e artifact must include redacted-artifact-delete-readback check');
  if (!ids.has('resume-analysis-delete-receipt')) errors.push('authenticated live e2e artifact must include resume-analysis-delete-receipt check');

  return {
    errors,
    item: {
      gateId: 'authenticated_live_artifact_e2e',
      status: 'proven',
      observedAt: artifact.generatedAt,
      evidenceType: 'authenticated_live_e2e',
      redactionBoundary: 'Synthetic user credentials, auth tokens, raw resume text, stored artifact payloads, and receipt internals are owner-held or redacted outside the repository.',
      artifactHashes: [artifactHash(source)],
      evidenceSummary: {
        passed: artifact.status === 'passed',
        syntheticUser: true,
        artifactSaved: ids.has('redacted-artifact-create'),
        artifactDeleted: ids.has('redacted-artifact-delete-readback'),
        deletionReceiptVerified: ids.has('redacted-artifact-delete-receipt') && ids.has('resume-analysis-delete-receipt'),
      },
      doesNotProve: artifact.doesNotProve || [
        'Payment proof',
        'Malware scanning',
        'Legal compliance',
      ],
    },
  };
}

function buildStripeLiveMrrItem(artifact, source) {
  const summary = artifact.evidenceSummary || {};
  const errors = [];
  if (summary.liveMode !== true) errors.push('Stripe live MRR artifact must report evidenceSummary.liveMode=true');
  if (summary.totalMrrGreaterThanZero !== true) errors.push('Stripe live MRR artifact must report evidenceSummary.totalMrrGreaterThanZero=true');
  if (!positiveInteger(summary.activeSubscriptionCount)) errors.push('Stripe live MRR artifact must report positive evidenceSummary.activeSubscriptionCount');
  if (!positiveInteger(summary.paidInvoiceCount)) errors.push('Stripe live MRR artifact must report positive evidenceSummary.paidInvoiceCount');

  return {
    errors,
    item: {
      gateId: 'live_mrr_gt_zero',
      status: 'proven',
      observedAt: artifact.generatedAt,
      evidenceType: 'stripe_live_mrr_export',
      redactionBoundary: 'Stripe live secret key, customer identities, subscription IDs, invoice IDs, payment details, and raw Stripe exports are owner-held outside the repository.',
      artifactHashes: [artifactHash(source)],
      evidenceSummary: {
        liveMode: summary.liveMode === true,
        totalMrrGreaterThanZero: summary.totalMrrGreaterThanZero === true,
        activeSubscriptionCount: summary.activeSubscriptionCount,
        paidInvoiceCount: summary.paidInvoiceCount,
        currency: summary.currency || 'redacted_or_multi_currency',
      },
      doesNotProve: artifact.doesNotProve || [
        'Retention',
        'Product-market fit',
        'Future revenue',
      ],
    },
  };
}

const specs = [
  {
    id: 'stripe-test-checkout',
    gateId: 'real_stripe_test_checkout',
    path: readFlagValue('--stripe-test-artifact') || 'docs/commercialization/stripe-test-checkout-proof-latest.json',
    build: buildStripeTestCheckoutItem,
  },
  {
    id: 'production-calibration',
    gateId: 'production_calibration_run',
    path: readFlagValue('--production-calibration-artifact') || 'docs/commercialization/production-calibration-proof-latest.json',
    build: buildProductionCalibrationItem,
  },
  {
    id: 'authenticated-live-artifact-e2e',
    gateId: 'authenticated_live_artifact_e2e',
    path: readFlagValue('--live-auth-e2e-artifact') || 'docs/commercialization/live-auth-e2e-proof-latest.json',
    build: buildAuthenticatedLiveE2eItem,
  },
  {
    id: 'stripe-live-mrr',
    gateId: 'live_mrr_gt_zero',
    path: readFlagValue('--stripe-live-mrr-artifact') || 'docs/commercialization/stripe-live-mrr-proof-latest.json',
    build: buildStripeLiveMrrItem,
  },
];

function composeEvidence() {
  const items = [];
  const inputs = [];

  for (const spec of specs) {
    const readResult = readJsonArtifact(spec.path);
    const input = {
      id: spec.id,
      gateId: spec.gateId,
      artifactPath: readResult.artifactPath,
      found: readResult.found,
      status: readResult.artifact?.status || null,
      accepted: false,
      errors: [...readResult.errors],
    };

    if (readResult.artifact && !isPassedArtifact(readResult.artifact)) {
      input.errors.push(`${readResult.artifactPath} must have status=passed and all checks passed`);
    }

    if (readResult.artifact && isPassedArtifact(readResult.artifact)) {
      const built = spec.build(readResult.artifact, readResult.source);
      input.errors.push(...built.errors);
      if (input.errors.length === 0) {
        items.push(built.item);
        input.accepted = true;
      }
    }

    inputs.push(input);
  }

  const evidence = {
    schemaVersion: LIVE_GATE_EVIDENCE_SCHEMA_VERSION,
    asOf: asOfFromItems(items),
    sourceBoundary: 'Composed redacted owner evidence from passing live proof artifacts only. Raw screenshots, exports, customer details, secrets, future-dated proof metadata, and private records remain owner-held outside the repository.',
    evidenceItems: items,
  };

  return { evidence, inputs };
}

function validateComposedEvidence(evidence) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apo-live-evidence-compose-'));
  const tempPath = path.join(tempDir, 'live-gate-evidence.json');
  try {
    fs.writeFileSync(tempPath, `${JSON.stringify(evidence, null, 2)}\n`);
    return validateLiveGateEvidence({ root, evidencePath: tempPath });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function main() {
  const shouldWrite = hasFlag('--write');
  const allowPartial = hasFlag('--allow-partial');
  const requireComplete = hasFlag('--require-complete');
  const outputPath = readFlagValue('--output') || DEFAULT_LIVE_GATE_EVIDENCE_PATH;
  const outputAbsolutePath = path.isAbsolute(outputPath) ? outputPath : path.join(root, outputPath);
  const outputDisplayPath = path.relative(root, outputAbsolutePath) || path.basename(outputAbsolutePath);
  const { evidence, inputs } = composeEvidence();
  const validation = validateComposedEvidence(evidence);
  const acceptedGateIds = new Set(validation.acceptedGateIds);
  const complete = specs.every((spec) => acceptedGateIds.has(spec.gateId));
  const inputErrors = inputs.flatMap((input) => input.errors.map((error) => `${input.id}: ${error}`));
  const errors = [...inputErrors, ...validation.errors];

  const canWrite = shouldWrite && errors.length === 0 && (complete || allowPartial);
  if (canWrite) {
    fs.mkdirSync(path.dirname(outputAbsolutePath), { recursive: true });
    fs.writeFileSync(outputAbsolutePath, `${JSON.stringify(evidence, null, 2)}\n`);
  }

  const composeCommand = `npm run compose:live-gate-evidence -- --write --require-complete`;
  const validateCommand = `npm run verify:live-gate-evidence -- --evidence ${outputDisplayPath} --require-complete`;
  const finalReadOnlyLedgerCommand = `npm run verify:remediation-gates -- --live-evidence ${outputDisplayPath} --commercial-evidence <commercial-evidence-records-path> --require-complete`;
  const refreshTrackedLedgerCommand = `npm run verify:remediation-gates:write -- --live-evidence ${outputDisplayPath} --commercial-evidence <commercial-evidence-records-path> --require-complete`;

  const result = {
    ok: errors.length === 0 && (complete || allowPartial || !requireComplete),
    complete,
    schemaVersion: LIVE_GATE_EVIDENCE_SCHEMA_VERSION,
    outputPath: outputDisplayPath,
    wrote: canWrite ? outputDisplayPath : null,
    acceptedGateIds: validation.acceptedGateIds,
    rejectedGateIds: validation.rejectedGateIds,
    inputCount: inputs.length,
    acceptedInputCount: inputs.filter((input) => input.accepted).length,
    inputs,
    errorCount: errors.length,
    errors,
    nextCommand: canWrite ? validateCommand : composeCommand,
    nextCommands: canWrite
      ? {
        validateLiveEvidence: validateCommand,
        finalReadOnlyLedger: finalReadOnlyLedgerCommand,
        refreshTrackedLedger: refreshTrackedLedgerCommand,
      }
      : {
        composeLiveEvidence: composeCommand,
      },
  };

  console.log(JSON.stringify(result, null, 2));

  if (errors.length > 0 || (shouldWrite && !canWrite) || (requireComplete && !complete)) {
    process.exitCode = 1;
  }
}

main();
