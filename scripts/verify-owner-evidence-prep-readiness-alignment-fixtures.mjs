#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-owner-evidence-prep-readiness-alignment.mjs');

const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const MODEL_PATH = 'src/lib/commercialLaunchReadiness.ts';
const SUMMARY_SOURCE_ARTIFACT = `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep`;
const COMMERCIAL_PATH = 'docs/commercialization/commercial-evidence-intake.local.json';
const MANUAL_PATH = 'docs/commercialization/manual-wcag-evidence.local.json';
const HASH_COMMERCIAL_COMMAND = 'npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>';
const HASH_MANUAL_WCAG_COMMAND = 'npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>';
const REMAINING_GATE_IDS = [
  'manual_wcag_evidence',
  'real_stripe_test_checkout',
  'live_mrr_gt_zero',
  'three_committed_partners',
  'documented_outcomes',
];

function basePrep() {
  return {
    readyForCloseout: false,
    ownerActionNeededCount: 2,
    ownerActionNeeded: [
      `${COMMERCIAL_PATH}: replace placeholders, proof artifact hashes, supported proof artifact types, and hash salt.`,
      `${MANUAL_PATH}: complete manual WCAG WCAG-EM review, artifactHashes, complete-process evidence, accessibility-support baseline, official W3C/WAI reference coverage, review-record archive, and ownerEvidenceArchive policy.`,
    ],
    ownerActionNeededByGate: {
      manual_wcag_evidence: [
        `${MANUAL_PATH}: complete manual WCAG WCAG-EM review, artifactHashes, complete-process evidence, accessibility-support baseline, official W3C/WAI reference coverage, review-record archive, and ownerEvidenceArchive policy.`,
      ],
      real_stripe_test_checkout: [],
      live_mrr_gt_zero: [],
      three_committed_partners: [
        `${COMMERCIAL_PATH}: replace placeholders, proof artifact hashes, supported proof artifact types, and hash salt.`,
      ],
      documented_outcomes: [
        `${COMMERCIAL_PATH}: replace placeholders, proof artifact hashes, supported proof artifact types, and hash salt.`,
      ],
    },
    nextCommands: {
      hashCommercialProofArtifacts: HASH_COMMERCIAL_COMMAND,
      hashManualWcagProofArtifacts: HASH_MANUAL_WCAG_COMMAND,
    },
    liveProofReadiness: [],
    proofArtifacts: [],
    liveGateEvidence: {
      acceptedGateIds: [],
    },
    commercialIntake: {
      path: COMMERCIAL_PATH,
      exists: true,
      validJson: true,
      placeholderCount: 1,
      commercialEvidenceIntakeCounts: {
        designPartnerCommitmentCount: 3,
        documentedOutcomeCount: 1,
      },
    },
    manualWcagEvidence: {
      path: MANUAL_PATH,
      exists: false,
      validJson: false,
      manualWcagEvidenceCounts: {
        requiredCheckpointCount: 8,
        requiredRouteCount: 9,
        requiredCompleteProcessCount: 5,
        requiredAccessibilitySupportBaselineCount: 2,
        requiredOfficialReferenceCount: 7,
        requiredOwnerEvidenceArchiveRequirementCount: 9,
      },
    },
  };
}

function baseGateSummaries() {
  return [
    {
      gateId: 'manual_wcag_evidence',
      ownerActionNeededCount: 1,
      status: 'owner_prep_required',
      sourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate.manual_wcag_evidence`,
      evidenceBoundary: 'Per-gate prep counts mirror redacted closeout metadata only and does not prove completion.',
    },
    {
      gateId: 'real_stripe_test_checkout',
      ownerActionNeededCount: 0,
      status: 'prep_ready',
      sourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate.real_stripe_test_checkout`,
      evidenceBoundary: 'Per-gate prep counts mirror redacted closeout metadata only and does not prove completion.',
    },
    {
      gateId: 'live_mrr_gt_zero',
      ownerActionNeededCount: 0,
      status: 'prep_ready',
      sourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate.live_mrr_gt_zero`,
      evidenceBoundary: 'Per-gate prep counts mirror redacted closeout metadata only and does not prove completion.',
    },
    {
      gateId: 'three_committed_partners',
      ownerActionNeededCount: 1,
      status: 'owner_prep_required',
      sourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate.three_committed_partners`,
      evidenceBoundary: 'Per-gate prep counts mirror redacted closeout metadata only and does not prove completion.',
    },
    {
      gateId: 'documented_outcomes',
      ownerActionNeededCount: 1,
      status: 'owner_prep_required',
      sourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate.documented_outcomes`,
      evidenceBoundary: 'Per-gate prep counts mirror redacted closeout metadata only and does not prove completion.',
    },
  ];
}

function baseItems() {
  return [
    {
      itemId: 'commercial_intake_placeholders',
      track: 'commercial-validation',
      status: 'local_placeholder',
      nextCommand: HASH_COMMERCIAL_COMMAND,
      source: `${COMMERCIAL_PATH}; placeholderCount=1; designPartnerCommitmentCount=3; documentedOutcomeCount=1`,
      ownerAction: 'Replace placeholder partner/outcome data, proof artifact hashes, and hash salt before closeout.',
      doesNotProve: 'Partner commitments; documented outcomes',
    },
    {
      itemId: 'manual_wcag_evidence_missing',
      track: 'accessibility',
      status: 'local_missing',
      nextCommand: HASH_MANUAL_WCAG_COMMAND,
      source: `${MANUAL_PATH}; missing; requiredCheckpointCount=8; requiredRouteCount=9; requiredCompleteProcessCount=5; requiredAccessibilitySupportBaselineCount=2; requiredOfficialReferenceCount=7; requiredOwnerEvidenceArchiveRequirementCount=9`,
      ownerAction: 'Complete manual WCAG WCAG-EM review with artifactHashes, complete-process coverage, accessibility-support baseline, official W3C/WAI reference coverage, review-record archive, and ownerEvidenceArchive policy.',
      doesNotProve: 'WCAG conformance; procurement approval',
    },
  ];
}

function writeFile(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, value);
}

function writeJson(root, relativePath, value) {
  writeFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeModel(root, summary, items, gateSummaries = baseGateSummaries()) {
  const summaryText = JSON.stringify(summary, null, 2).replace(/\n/g, '\n  ');
  const gateSummaryText = gateSummaries
    .map((item) => `  ${JSON.stringify(item, null, 2).replace(/\n/g, '\n  ')}`)
    .join(',\n');
  const itemText = items
    .map((item) => `  ${JSON.stringify(item, null, 2).replace(/\n/g, '\n  ')}`)
    .join(',\n');
  writeFile(
    root,
    MODEL_PATH,
    `export const ownerEvidencePrepReadinessSummary = ${summaryText};\n\nexport const ownerEvidencePrepReadinessGateSummaries = [\n${gateSummaryText}\n];\n\nexport const ownerEvidencePrepReadinessItems = [\n${itemText}\n];\n`,
  );
}

function writeBaseArtifacts(root) {
  const prep = basePrep();
  writeJson(root, CLOSEOUT_STATUS_PATH, {
    schemaVersion: '2026-06-04.apo-owner-evidence-closeout-status.v1',
    ok: false,
    goalComplete: false,
    ownerGateScoreboard: {
      remainingGateIds: REMAINING_GATE_IDS,
    },
    ownerEvidencePrep: prep,
  });
  writeModel(
    root,
    {
      readyForCloseout: prep.readyForCloseout,
      ownerActionNeededCount: prep.ownerActionNeededCount,
      sourceArtifact: SUMMARY_SOURCE_ARTIFACT,
      sourceCommand: 'npm run verify:owner-evidence-prep',
      statusVerifier: 'npm run verify:owner-evidence-closeout-status',
    },
    baseItems(),
  );
}

function updateJson(root, relativePath, updater) {
  const absolutePath = path.join(root, relativePath);
  const value = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  updater(value);
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function runVerifier(root) {
  return spawnSync(process.execPath, [VERIFIER_SCRIPT, '--root', root], {
    cwd: path.dirname(root),
    encoding: 'utf8',
  });
}

function assertCase(name, mutate, expectedCode, expectedText) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-owner-prep-readiness-${name}-`));
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
    name: 'aligned-owner-prep-readiness-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
  },
  {
    name: 'missing-owner-evidence-prep-fails',
    expectedCode: 1,
    expectedText: 'missing_owner_evidence_prep',
    mutate(root) {
      updateJson(root, CLOSEOUT_STATUS_PATH, (value) => {
        delete value.ownerEvidencePrep;
      });
    },
  },
  {
    name: 'summary-count-mismatch-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      const prep = basePrep();
      writeModel(
        root,
        {
          readyForCloseout: prep.readyForCloseout,
          ownerActionNeededCount: 99,
          sourceArtifact: SUMMARY_SOURCE_ARTIFACT,
          sourceCommand: 'npm run verify:owner-evidence-prep',
          statusVerifier: 'npm run verify:owner-evidence-closeout-status',
        },
        baseItems(),
      );
    },
  },
  {
    name: 'missing-ui-prep-item-fails',
    expectedCode: 1,
    expectedText: 'missing_ui_prep_item',
    mutate(root) {
      const prep = basePrep();
      writeModel(
        root,
        {
          readyForCloseout: prep.readyForCloseout,
          ownerActionNeededCount: prep.ownerActionNeededCount,
          sourceArtifact: SUMMARY_SOURCE_ARTIFACT,
          sourceCommand: 'npm run verify:owner-evidence-prep',
          statusVerifier: 'npm run verify:owner-evidence-closeout-status',
        },
        baseItems().slice(1),
      );
    },
  },
  {
    name: 'missing-ui-gate-prep-summary-fails',
    expectedCode: 1,
    expectedText: 'missing_ui_gate_prep_summary',
    mutate(root) {
      const prep = basePrep();
      writeModel(
        root,
        {
          readyForCloseout: prep.readyForCloseout,
          ownerActionNeededCount: prep.ownerActionNeededCount,
          sourceArtifact: SUMMARY_SOURCE_ARTIFACT,
          sourceCommand: 'npm run verify:owner-evidence-prep',
          statusVerifier: 'npm run verify:owner-evidence-closeout-status',
        },
        baseItems(),
        baseGateSummaries().slice(1),
      );
    },
  },
  {
    name: 'extra-ui-gate-prep-summary-fails',
    expectedCode: 1,
    expectedText: 'ui_gate_summary_count_mismatch',
    mutate(root) {
      const prep = basePrep();
      const gateSummaries = baseGateSummaries();
      gateSummaries.push({
        ...gateSummaries[0],
        gateId: 'unexpected_gate',
        sourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate.unexpected_gate`,
      });
      writeModel(
        root,
        {
          readyForCloseout: prep.readyForCloseout,
          ownerActionNeededCount: prep.ownerActionNeededCount,
          sourceArtifact: SUMMARY_SOURCE_ARTIFACT,
          sourceCommand: 'npm run verify:owner-evidence-prep',
          statusVerifier: 'npm run verify:owner-evidence-closeout-status',
        },
        baseItems(),
        gateSummaries,
      );
    },
  },
  {
    name: 'ui-gate-prep-count-drift-fails',
    expectedCode: 1,
    expectedText: 'ownerActionNeededCount',
    mutate(root) {
      const prep = basePrep();
      const gateSummaries = baseGateSummaries();
      gateSummaries[0].ownerActionNeededCount = 99;
      writeModel(
        root,
        {
          readyForCloseout: prep.readyForCloseout,
          ownerActionNeededCount: prep.ownerActionNeededCount,
          sourceArtifact: SUMMARY_SOURCE_ARTIFACT,
          sourceCommand: 'npm run verify:owner-evidence-prep',
          statusVerifier: 'npm run verify:owner-evidence-closeout-status',
        },
        baseItems(),
        gateSummaries,
      );
    },
  },
  {
    name: 'ui-field-mismatch-fails',
    expectedCode: 1,
    expectedText: 'field_mismatch',
    mutate(root) {
      const prep = basePrep();
      const items = baseItems();
      items[0].nextCommand = 'npm run hash:owner-evidence-artifacts --wrong';
      writeModel(
        root,
        {
          readyForCloseout: prep.readyForCloseout,
          ownerActionNeededCount: prep.ownerActionNeededCount,
          sourceArtifact: SUMMARY_SOURCE_ARTIFACT,
          sourceCommand: 'npm run verify:owner-evidence-prep',
          statusVerifier: 'npm run verify:owner-evidence-closeout-status',
        },
        items,
      );
    },
  },
  {
    name: 'missing-source-fragment-fails',
    expectedCode: 1,
    expectedText: 'missing_fragment',
    mutate(root) {
      const prep = basePrep();
      const items = baseItems();
      items[0].source = `${COMMERCIAL_PATH}; placeholderCount=1`;
      writeModel(
        root,
        {
          readyForCloseout: prep.readyForCloseout,
          ownerActionNeededCount: prep.ownerActionNeededCount,
          sourceArtifact: SUMMARY_SOURCE_ARTIFACT,
          sourceCommand: 'npm run verify:owner-evidence-prep',
          statusVerifier: 'npm run verify:owner-evidence-closeout-status',
        },
        items,
      );
    },
  },
  {
    name: 'missing-owner-action-fragment-fails',
    expectedCode: 1,
    expectedText: 'missing_fragment',
    mutate(root) {
      const prep = basePrep();
      const items = baseItems();
      items[1].ownerAction = 'Complete manual review.';
      writeModel(
        root,
        {
          readyForCloseout: prep.readyForCloseout,
          ownerActionNeededCount: prep.ownerActionNeededCount,
          sourceArtifact: SUMMARY_SOURCE_ARTIFACT,
          sourceCommand: 'npm run verify:owner-evidence-prep',
          statusVerifier: 'npm run verify:owner-evidence-closeout-status',
        },
        items,
      );
    },
  },
  {
    name: 'missing-closeout-action-prefix-fails',
    expectedCode: 1,
    expectedText: 'ownerEvidencePrep.ownerActionNeeded',
    mutate(root) {
      updateJson(root, CLOSEOUT_STATUS_PATH, (value) => {
        value.ownerEvidencePrep.ownerActionNeeded = value.ownerEvidencePrep.ownerActionNeeded.slice(1);
      });
    },
  },
  {
    name: 'extra-ui-prep-item-fails',
    expectedCode: 1,
    expectedText: 'extra_ui_prep_item',
    mutate(root) {
      const prep = basePrep();
      writeModel(
        root,
        {
          readyForCloseout: prep.readyForCloseout,
          ownerActionNeededCount: prep.ownerActionNeededCount,
          sourceArtifact: SUMMARY_SOURCE_ARTIFACT,
          sourceCommand: 'npm run verify:owner-evidence-prep',
          statusVerifier: 'npm run verify:owner-evidence-closeout-status',
        },
        [...baseItems(), { ...baseItems()[0], itemId: 'unexpected_prep_item' }],
      );
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText);
}

console.log(`Owner-evidence prep-readiness alignment fixture verification passed: ${cases.length} cases.`);
