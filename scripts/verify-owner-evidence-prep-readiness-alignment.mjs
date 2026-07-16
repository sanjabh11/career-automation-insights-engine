#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = process.argv.slice(2);

function readFlagValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const root = path.resolve(readFlagValue('--root', path.resolve(__dirname, '..')));

const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const MODEL_PATH = 'src/lib/commercialLaunchReadiness.ts';
const SUMMARY_EXPORT_NAME = 'ownerEvidencePrepReadinessSummary';
const GATE_SUMMARIES_EXPORT_NAME = 'ownerEvidencePrepReadinessGateSummaries';
const ITEMS_EXPORT_NAME = 'ownerEvidencePrepReadinessItems';

const LIVE_PROOF_ITEM_BY_ID = {
  stripe_test_checkout: {
    itemId: 'stripe_test_checkout_env',
    track: 'payments',
    status: 'needs_owner_input',
    sourceIncludes: ['.env.local readiness check', 'required key names only'],
  },
  production_calibration: {
    itemId: 'production_calibration_env',
    track: 'live-runtime',
    status: 'env_file_complete_not_loaded',
    sourceIncludes: ['.env.local readiness check', 'required key names only'],
  },
  authenticated_live_artifact_e2e: {
    itemId: 'authenticated_live_artifact_env',
    track: 'live-runtime',
    status: 'env_file_complete_not_loaded',
    sourceIncludes: ['.env.local readiness check', 'required key names only'],
  },
  live_mrr_gt_zero: {
    itemId: 'live_mrr_env',
    track: 'payments',
    status: 'env_file_complete_not_loaded',
    sourceIncludes: ['.env.local readiness check', 'required key names only'],
  },
};

function liveProofSourceFragments(readiness, staticExpectation) {
  const fragments = [...staticExpectation.sourceIncludes];
  for (const [key, value] of [
    ['requiredGroupCount', readiness.requiredGroupCount],
    ['presentGroupCount', readiness.presentGroupCount],
    ['missingGroupCount', readiness.missingGroupCount],
    ['loadFromEnvFileCount', readiness.loadFromEnvFileCount],
    ['invalidKeyModeCount', readiness.invalidKeyModeCount],
  ]) {
    if (Number.isFinite(value)) fragments.push(`${key}=${value}`);
  }
  if (readiness.stripeKeyModeRequirement?.requiredMode) {
    fragments.push(`requiredStripeKeyMode=${readiness.stripeKeyModeRequirement.requiredMode}`);
  }
  return fragments;
}

const PROOF_ARTIFACT_ITEM_BY_PATH = {
  'docs/commercialization/stripe-test-checkout-proof-latest.json': {
    itemId: 'stripe_test_checkout_artifact_failed',
    track: 'payments',
    nextCommand: 'npm run verify:stripe-test-checkout',
  },
  'docs/commercialization/stripe-live-mrr-proof-latest.json': {
    itemId: 'stripe_live_mrr_artifact_failed',
    track: 'payments',
    nextCommand: 'npm run verify:stripe-live-mrr',
  },
};

const ACCEPTED_PROOF_ARTIFACT_ITEM_BY_READINESS_ID = {
  production_calibration: {
    itemId: 'production_calibration_compose_live_evidence',
    track: 'live-runtime',
  },
  authenticated_live_artifact_e2e: {
    itemId: 'authenticated_live_artifact_compose_live_evidence',
    track: 'live-runtime',
  },
};

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function propName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return null;
}

function literalValue(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(literalValue);
  return undefined;
}

function objectLiteralToRecord(node) {
  const record = {};
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = propName(property.name);
    if (!key) continue;
    const value = literalValue(property.initializer);
    if (value !== undefined) record[key] = value;
  }
  return record;
}

function extractExportedLiteral(sourceText, exportName) {
  const source = ts.createSourceFile(MODEL_PATH, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let initializer = null;

  function visit(node) {
    if (initializer) return;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === exportName) {
      initializer = node.initializer || null;
      return;
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  if (!initializer) throw new Error(`Could not find ${exportName} in ${MODEL_PATH}`);
  return initializer;
}

function extractSummary(sourceText) {
  const initializer = extractExportedLiteral(sourceText, SUMMARY_EXPORT_NAME);
  if (!ts.isObjectLiteralExpression(initializer)) {
    throw new Error(`${SUMMARY_EXPORT_NAME} must be an object literal`);
  }
  return objectLiteralToRecord(initializer);
}

function extractItems(sourceText) {
  const initializer = extractExportedLiteral(sourceText, ITEMS_EXPORT_NAME);
  if (!ts.isArrayLiteralExpression(initializer)) {
    throw new Error(`${ITEMS_EXPORT_NAME} must be an array literal`);
  }
  return initializer.elements.map((element) => {
    if (!ts.isObjectLiteralExpression(element)) {
      throw new Error(`${ITEMS_EXPORT_NAME} contains a non-object entry`);
    }
    return objectLiteralToRecord(element);
  });
}

function extractGateSummaries(sourceText) {
  const initializer = extractExportedLiteral(sourceText, GATE_SUMMARIES_EXPORT_NAME);
  if (!ts.isArrayLiteralExpression(initializer)) {
    throw new Error(`${GATE_SUMMARIES_EXPORT_NAME} must be an array literal`);
  }
  return initializer.elements.map((element) => {
    if (!ts.isObjectLiteralExpression(element)) {
      throw new Error(`${GATE_SUMMARIES_EXPORT_NAME} contains a non-object entry`);
    }
    return objectLiteralToRecord(element);
  });
}

function statusForLiveProof(readiness) {
  if ((readiness.invalidKeyModeGroups || []).length > 0 || (readiness.missingGroups || []).length > 0) {
    return 'needs_owner_input';
  }
  if (readiness.envFileCompleteButNotLoaded) return 'env_file_complete_not_loaded';
  if ((readiness.blankOrPlaceholderEnvFile || []).length > 0) return 'needs_owner_input';
  return readiness.ready ? 'ready' : 'needs_owner_input';
}

function requiredActionFragmentsForLiveProof(readiness) {
  const fragments = new Set();
  for (const key of readiness.loadFromEnvFile || []) fragments.add(key);
  for (const issue of readiness.invalidKeyModeGroups || []) {
    for (const token of String(issue).match(/[A-Z][A-Z0-9_]+/g) || []) fragments.add(token);
  }
  return [...fragments];
}

function buildExpectedItems(prep) {
  const expected = [];
  const proofArtifactsByReadinessId = new Map(
    (prep.proofArtifacts || []).map((artifact) => [artifact.readinessId, artifact])
  );
  const acceptedLiveGateIds = new Set(prep.liveGateEvidence?.acceptedGateIds || []);

  for (const readiness of prep.liveProofReadiness || []) {
    const staticExpectation = LIVE_PROOF_ITEM_BY_ID[readiness.id];
    if (!staticExpectation) continue;
    const proofArtifact = proofArtifactsByReadinessId.get(readiness.id);
    if (proofArtifact?.acceptedSourceArtifact) continue;
    expected.push({
      itemId: staticExpectation.itemId,
      track: staticExpectation.track,
      status: statusForLiveProof(readiness),
      nextCommand: readiness.command,
      sourceIncludes: liveProofSourceFragments(readiness, staticExpectation),
      ownerActionIncludes: requiredActionFragmentsForLiveProof(readiness),
      closeoutActionPrefix: `${readiness.id}:`,
    });
  }

  if (prep.commercialIntake?.placeholderCount > 0) {
    const intakeCounts = prep.commercialIntake.commercialEvidenceIntakeCounts || {};
    expected.push({
      itemId: 'commercial_intake_placeholders',
      track: 'commercial-validation',
      status: 'local_placeholder',
      nextCommand: prep.nextCommands?.hashCommercialProofArtifacts,
      sourceIncludes: [
        prep.commercialIntake.path,
        `placeholderCount=${prep.commercialIntake.placeholderCount}`,
        Number.isFinite(intakeCounts.designPartnerCommitmentCount)
          ? `designPartnerCommitmentCount=${intakeCounts.designPartnerCommitmentCount}`
          : null,
        Number.isFinite(intakeCounts.documentedOutcomeCount)
          ? `documentedOutcomeCount=${intakeCounts.documentedOutcomeCount}`
          : null,
      ],
      ownerActionIncludes: ['placeholder', 'proof artifact hashes', 'hash salt'],
      closeoutActionPrefix: `${prep.commercialIntake.path}:`,
    });
  }

  if (!prep.manualWcagEvidence?.exists) {
    const manualCounts = prep.manualWcagEvidence?.manualWcagEvidenceCounts || {};
    expected.push({
      itemId: 'manual_wcag_evidence_missing',
      track: 'accessibility',
      status: 'local_missing',
      nextCommand: prep.nextCommands?.hashManualWcagProofArtifacts,
      sourceIncludes: [
        prep.manualWcagEvidence?.path,
        'missing',
        Number.isFinite(manualCounts.requiredCheckpointCount)
          ? `requiredCheckpointCount=${manualCounts.requiredCheckpointCount}`
          : null,
        Number.isFinite(manualCounts.requiredRouteCount)
          ? `requiredRouteCount=${manualCounts.requiredRouteCount}`
          : null,
        Number.isFinite(manualCounts.requiredCompleteProcessCount)
          ? `requiredCompleteProcessCount=${manualCounts.requiredCompleteProcessCount}`
          : null,
        Number.isFinite(manualCounts.requiredAccessibilitySupportBaselineCount)
          ? `requiredAccessibilitySupportBaselineCount=${manualCounts.requiredAccessibilitySupportBaselineCount}`
          : null,
        Number.isFinite(manualCounts.requiredOfficialReferenceCount)
          ? `requiredOfficialReferenceCount=${manualCounts.requiredOfficialReferenceCount}`
          : null,
        Number.isFinite(manualCounts.requiredOwnerEvidenceArchiveRequirementCount)
          ? `requiredOwnerEvidenceArchiveRequirementCount=${manualCounts.requiredOwnerEvidenceArchiveRequirementCount}`
          : null,
      ].filter(Boolean),
      ownerActionIncludes: ['manual WCAG', 'WCAG-EM', 'artifactHashes', 'complete-process', 'accessibility-support', 'official W3C/WAI reference', 'review-record archive', 'ownerEvidenceArchive'],
      closeoutActionPrefix: `${prep.manualWcagEvidence?.path}:`,
    });
  }

  for (const artifact of prep.proofArtifacts || []) {
    if (artifact.acceptedSourceArtifact) {
      if (acceptedLiveGateIds.has(artifact.gateId)) continue;
      const staticExpectation = ACCEPTED_PROOF_ARTIFACT_ITEM_BY_READINESS_ID[artifact.readinessId];
      if (!staticExpectation) continue;
      expected.push({
        itemId: staticExpectation.itemId,
        track: staticExpectation.track,
        status: 'proof_artifact_ready',
        nextCommand: prep.nextCommands?.composeLiveGateEvidence,
        sourceIncludes: [
          artifact.path,
          `status=${artifact.artifactStatus}`,
          'acceptedSourceArtifact=true',
          `acceptedInLiveGateEvidence=false`,
        ],
        ownerActionIncludes: ['Compose', 'redacted partial live-gate evidence', 'require-any', 'final closeout'],
        closeoutActionPrefix: `${artifact.gateId}:`,
      });
      continue;
    }
    const staticExpectation = PROOF_ARTIFACT_ITEM_BY_PATH[artifact.path];
    if (!staticExpectation) continue;
    expected.push({
      itemId: staticExpectation.itemId,
      track: staticExpectation.track,
      status: 'failed_artifact',
      nextCommand: staticExpectation.nextCommand,
      sourceIncludes: [artifact.path, `status=${artifact.artifactStatus}`],
      ownerActionIncludes: ['run', 'status'],
      closeoutActionPrefix: `${artifact.path}:`,
    });
  }

  return expected;
}

function buildExpectedGateSummaries(closeoutStatus, prep) {
  const remainingGateIds = closeoutStatus.ownerGateScoreboard?.remainingGateIds || closeoutStatus.remainingGateIds || [];
  const ownerActionNeededByGate = prep.ownerActionNeededByGate || {};
  return remainingGateIds.map((gateId) => {
    const ownerActionNeededCount = (ownerActionNeededByGate[gateId] || []).length;
    return {
      gateId,
      ownerActionNeededCount,
      status: ownerActionNeededCount > 0 ? 'owner_prep_required' : 'prep_ready',
      sourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate.${gateId}`,
    };
  });
}

function addError(errors, type, detail) {
  errors.push({ type, ...detail });
}

function compareField(errors, context, field, expected, actual) {
  if (expected !== actual) {
    addError(errors, 'field_mismatch', { context, field, expected, actual });
  }
}

function assertIncludes(errors, context, field, haystack, fragments) {
  const value = String(haystack || '');
  for (const fragment of fragments.filter(Boolean)) {
    if (!value.includes(fragment)) {
      addError(errors, 'missing_fragment', { context, field, expectedFragment: fragment, actual: value });
    }
  }
}

function main() {
  const closeoutStatus = readJson(CLOSEOUT_STATUS_PATH);
  const prep = closeoutStatus.ownerEvidencePrep || {};
  const modelText = read(MODEL_PATH);
  const summary = extractSummary(modelText);
  const uiGateSummaries = extractGateSummaries(modelText);
  const uiItems = extractItems(modelText);
  const expectedItems = buildExpectedItems(prep);
  const expectedGateSummaries = buildExpectedGateSummaries(closeoutStatus, prep);
  const errors = [];

  if (!closeoutStatus.ownerEvidencePrep) {
    addError(errors, 'missing_owner_evidence_prep', { sourceCloseoutStatus: CLOSEOUT_STATUS_PATH });
  }

  compareField(errors, 'summary', 'readyForCloseout', prep.readyForCloseout, summary.readyForCloseout);
  compareField(errors, 'summary', 'ownerActionNeededCount', prep.ownerActionNeededCount, summary.ownerActionNeededCount);
  compareField(
    errors,
    'summary',
    'sourceArtifact',
    `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep`,
    summary.sourceArtifact
  );
  compareField(errors, 'summary', 'sourceCommand', 'npm run verify:owner-evidence-prep', summary.sourceCommand);
  compareField(errors, 'summary', 'statusVerifier', 'npm run verify:owner-evidence-closeout-status', summary.statusVerifier);

  if (expectedItems.length !== prep.ownerActionNeededCount) {
    addError(errors, 'expected_item_count_mismatch', {
      expectedFromOwnerActionNeededCount: prep.ownerActionNeededCount,
      actualExpectedItemCount: expectedItems.length,
    });
  }

  if (uiItems.length !== expectedItems.length) {
    addError(errors, 'ui_item_count_mismatch', {
      expected: expectedItems.length,
      actual: uiItems.length,
    });
  }

  if (uiGateSummaries.length !== expectedGateSummaries.length) {
    addError(errors, 'ui_gate_summary_count_mismatch', {
      expected: expectedGateSummaries.length,
      actual: uiGateSummaries.length,
    });
  }

  const uiByItemId = new Map(uiItems.map((item) => [item.itemId, item]));
  const uiGateByGateId = new Map(uiGateSummaries.map((item) => [item.gateId, item]));
  const closeoutActionText = (prep.ownerActionNeeded || []).join('\n');

  for (const expected of expectedGateSummaries) {
    const actual = uiGateByGateId.get(expected.gateId);
    if (!actual) {
      addError(errors, 'missing_ui_gate_prep_summary', { gateId: expected.gateId });
      continue;
    }
    compareField(errors, `gate:${expected.gateId}`, 'ownerActionNeededCount', expected.ownerActionNeededCount, actual.ownerActionNeededCount);
    compareField(errors, `gate:${expected.gateId}`, 'status', expected.status, actual.status);
    compareField(errors, `gate:${expected.gateId}`, 'sourceArtifact', expected.sourceArtifact, actual.sourceArtifact);
    assertIncludes(errors, `gate:${expected.gateId}`, 'evidenceBoundary', actual.evidenceBoundary, ['does not prove']);
  }

  const expectedGateIds = new Set(expectedGateSummaries.map((item) => item.gateId));
  for (const actual of uiGateSummaries) {
    if (!expectedGateIds.has(actual.gateId)) {
      addError(errors, 'extra_ui_gate_prep_summary', { gateId: actual.gateId });
    }
  }

  for (const expected of expectedItems) {
    const actual = uiByItemId.get(expected.itemId);
    if (!actual) {
      addError(errors, 'missing_ui_prep_item', { itemId: expected.itemId });
      continue;
    }
    compareField(errors, expected.itemId, 'track', expected.track, actual.track);
    compareField(errors, expected.itemId, 'status', expected.status, actual.status);
    compareField(errors, expected.itemId, 'nextCommand', expected.nextCommand, actual.nextCommand);
    assertIncludes(errors, expected.itemId, 'source', actual.source, expected.sourceIncludes);
    assertIncludes(errors, expected.itemId, 'ownerAction', actual.ownerAction, expected.ownerActionIncludes);
    assertIncludes(errors, expected.itemId, 'ownerEvidencePrep.ownerActionNeeded', closeoutActionText, [expected.closeoutActionPrefix]);
    assertIncludes(errors, expected.itemId, 'doesNotProve', actual.doesNotProve, [';']);
  }

  const expectedItemIds = new Set(expectedItems.map((item) => item.itemId));
  for (const actual of uiItems) {
    if (!expectedItemIds.has(actual.itemId)) {
      addError(errors, 'extra_ui_prep_item', { itemId: actual.itemId });
    }
  }

  const result = {
    ok: errors.length === 0,
    sourceCloseoutStatus: CLOSEOUT_STATUS_PATH,
    uiModel: MODEL_PATH,
    readyForCloseout: prep.readyForCloseout,
    ownerActionNeededCount: prep.ownerActionNeededCount,
    expectedGateSummaryCount: expectedGateSummaries.length,
    uiGateSummaryCount: uiGateSummaries.length,
    gateSummaryIds: expectedGateSummaries.map((item) => item.gateId),
    expectedItemCount: expectedItems.length,
    uiItemCount: uiItems.length,
    itemIds: expectedItems.map((item) => item.itemId),
    evidenceBoundary:
      'This alignment check proves the Trust Center prep-readiness UI mirrors the redacted closeout-status artifact. It does not prove live checkout, live MRR, production calibration, authenticated live artifact persistence, partner commitments, documented outcomes, or manual WCAG conformance.',
    errorCount: errors.length,
    errors,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main();
