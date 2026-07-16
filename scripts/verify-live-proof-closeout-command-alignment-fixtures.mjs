#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-live-proof-closeout-command-alignment.mjs');

const REQUIRED_SETUP_COMMANDS = [
  'npm run generate:live-proof-run-packet',
  'npm run prepare:owner-evidence -- --write',
  'set -a; source .env.local; set +a',
];
const OWNER_PREP_COMMAND = REQUIRED_SETUP_COMMANDS.join(' && ');
const STRIPE_TEST_COMMAND = 'npm run verify:stripe-test-checkout';
const STRIPE_MRR_COMMAND = 'npm run verify:stripe-live-mrr';

function writeJson(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeModel(root, rows) {
  const absolutePath = path.join(root, 'src/lib/commercialLaunchReadiness.ts');
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  const body = rows
    .map(
      (row) => `  {
    gateId: ${JSON.stringify(row.gateId)},
    ownerPrepCommand: ${JSON.stringify(row.ownerPrepCommand || '')},
    nextCommand: ${JSON.stringify(row.nextCommand || '')},
  }`
    )
    .join(',\n');
  fs.writeFileSync(absolutePath, `export const ownerEvidenceActionQueueItems = [\n${body}\n];\n`);
}

function stripeRows() {
  return [
    {
      id: 'real_stripe_test_checkout',
      gateId: 'real_stripe_test_checkout',
      ownerPrepCommand: OWNER_PREP_COMMAND,
      nextCommand: STRIPE_TEST_COMMAND,
    },
    {
      id: 'live_mrr_gt_zero',
      gateId: 'live_mrr_gt_zero',
      ownerPrepCommand: OWNER_PREP_COMMAND,
      nextCommand: STRIPE_MRR_COMMAND,
    },
  ];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function writeBaseArtifacts(root) {
  const rows = stripeRows();
  const queueRows = rows.map(({ id, ownerPrepCommand, nextCommand }) => ({
    id,
    ownerPrepCommand,
    nextCommand,
  }));
  const gateRows = rows.map(({ id, ownerPrepCommand, nextCommand }) => ({
    id,
    ownerPrepCommand,
    nextCommand,
  }));
  const closeoutRows = rows.map(({ gateId, ownerPrepCommand, nextCommand }) => ({
    gateId,
    ownerPrepCommand,
    nextCommand,
  }));

  writeJson(root, 'docs/commercialization/live-proof-run-packet-latest.json', {
    ownerCommandSequence: [
      ...REQUIRED_SETUP_COMMANDS,
      STRIPE_TEST_COMMAND,
      'npm run verify:production-calibration',
      'npm run verify:commercial-live-auth-e2e',
      STRIPE_MRR_COMMAND,
      'npm run compose:live-gate-evidence -- --write --allow-partial --output docs/commercialization/live-gate-evidence.local.json',
      'npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-any',
    ],
    liveProofs: [
      {
        gateId: 'real_stripe_test_checkout',
        command: STRIPE_TEST_COMMAND,
      },
      {
        gateId: 'live_mrr_gt_zero',
        command: STRIPE_MRR_COMMAND,
      },
    ],
  });
  writeJson(root, 'docs/commercialization/remediation-external-gates-latest.json', {
    gates: gateRows,
    ownerActionQueue: queueRows,
  });
  writeJson(root, 'docs/commercialization/owner-evidence-closeout-status-latest.json', {
    ownerActionQueue: queueRows,
    ownerGateCloseoutSummary: closeoutRows,
    nextCommands: {
      collectLiveProofs: [STRIPE_TEST_COMMAND, STRIPE_MRR_COMMAND],
    },
  });
  writeJson(root, 'docs/commercialization/owner-evidence-handoff-latest.json', {
    ownerActionRows: closeoutRows,
  });
  writeModel(root, rows);
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-live-proof-command-alignment-${name}-`));
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
    name: 'aligned-live-proof-closeout-commands-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
  },
  {
    name: 'missing-remediation-prep-command-fails',
    expectedCode: 1,
    expectedText: 'remediation.ownerActionQueue',
    mutate(root) {
      updateJson(root, 'docs/commercialization/remediation-external-gates-latest.json', (value) => {
        value.ownerActionQueue[0].ownerPrepCommand = '';
      });
    },
  },
  {
    name: 'mismatched-closeout-next-command-fails',
    expectedCode: 1,
    expectedText: 'closeout.ownerGateCloseoutSummary',
    mutate(root) {
      updateJson(root, 'docs/commercialization/owner-evidence-closeout-status-latest.json', (value) => {
        value.ownerGateCloseoutSummary[1].nextCommand = 'npm run verify:stripe-live-mrr --wrong';
      });
    },
  },
  {
    name: 'missing-handoff-prep-command-fails',
    expectedCode: 1,
    expectedText: 'handoff.ownerActionRows',
    mutate(root) {
      updateJson(root, 'docs/commercialization/owner-evidence-handoff-latest.json', (value) => {
        value.ownerActionRows[0].ownerPrepCommand = '';
      });
    },
  },
  {
    name: 'missing-ui-prep-command-fails',
    expectedCode: 1,
    expectedText: 'ui.ownerEvidenceActionQueueItems',
    mutate(root) {
      const rows = clone(stripeRows());
      rows[1].ownerPrepCommand = '';
      writeModel(root, rows);
    },
  },
  {
    name: 'live-packet-setup-sequence-mismatch-fails',
    expectedCode: 1,
    expectedText: 'live_packet_setup_sequence_mismatch',
    mutate(root) {
      updateJson(root, 'docs/commercialization/live-proof-run-packet-latest.json', (value) => {
        value.ownerCommandSequence[1] = 'npm run prepare:owner-evidence';
      });
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText);
}

console.log(`Live-proof closeout command alignment fixture verification passed: ${cases.length} cases.`);
