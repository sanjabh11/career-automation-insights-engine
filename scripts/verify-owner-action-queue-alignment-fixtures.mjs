#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-owner-action-queue-alignment.mjs');

const LEDGER_PATH = 'docs/commercialization/remediation-external-gates-latest.json';
const MODEL_PATH = 'src/lib/commercialLaunchReadiness.ts';

function canonicalItem(id, overrides = {}) {
  const base = {
    id,
    label: id === 'manual_wcag_evidence' ? 'Manual WCAG evidence' : 'Three committed partners',
    status: id === 'manual_wcag_evidence' ? 'blocked_missing_manual_wcag_evidence' : 'blocked_missing_owner_evidence_records',
    ownerAction:
      id === 'manual_wcag_evidence'
        ? 'Complete the owner-held WCAG-EM review and attach redacted metadata.'
        : 'Attach three permissioned partner commitments with owner-held evidence.',
    ownerPrepCommand:
      id === 'manual_wcag_evidence'
        ? 'npm run generate:manual-wcag-review-packet && npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>'
        : 'npm run generate:commercial-evidence-intake-packet && npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>',
    nextCommand:
      id === 'manual_wcag_evidence'
        ? 'npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete'
        : 'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
    riskIfSkipped:
      id === 'manual_wcag_evidence'
        ? 'No manual accessibility claim can be made.'
        : 'Partner commitment claims must stay blocked.',
    sourceBoundary: id === 'manual_wcag_evidence' ? 'owner WCAG evidence metadata' : 'owner commercial evidence records',
    doesNotProve:
      id === 'manual_wcag_evidence'
        ? ['WCAG conformance', 'procurement approval']
        : ['revenue', 'generalizable demand'],
  };
  return { ...base, ...overrides };
}

function statusForUi(status) {
  if (status === 'blocked_missing_owner_evidence_records' || status === 'ready_for_owner_live_run') return 'owner_action';
  if (status === 'blocked_missing_explicit_test_stripe_key' || status.startsWith('blocked_') || status.startsWith('invalid_')) return 'blocked';
  return status;
}

function uiItem(item, overrides = {}) {
  return {
    gateId: item.id,
    label: item.label,
    status: statusForUi(item.status),
    ownerAction: item.ownerAction,
    ownerPrepCommand: item.ownerPrepCommand || '',
    nextCommand: item.nextCommand,
    riskIfSkipped: item.riskIfSkipped,
    sourceBoundary: item.sourceBoundary,
    doesNotProve: Array.isArray(item.doesNotProve) ? item.doesNotProve.join('; ') : item.doesNotProve,
    ...overrides,
  };
}

function writeFile(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, value);
}

function writeJson(root, relativePath, value) {
  writeFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeModel(root, items) {
  const body = items
    .map((item) => `  ${JSON.stringify(item, null, 2).replace(/\n/g, '\n  ')}`)
    .join(',\n');
  writeFile(root, MODEL_PATH, `export const ownerEvidenceActionQueueItems = [\n${body}\n];\n`);
}

function writeBaseArtifacts(root) {
  const queue = [canonicalItem('manual_wcag_evidence'), canonicalItem('three_committed_partners')];
  writeJson(root, LEDGER_PATH, {
    schemaVersion: '2026-06-04.apo-remediation-external-gates.v1',
    goalComplete: false,
    ownerActionQueue: queue,
  });
  writeModel(root, queue.map((item) => uiItem(item)));
}

function updateJson(root, relativePath, updater) {
  const absolutePath = path.join(root, relativePath);
  const value = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  updater(value);
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readQueue(root) {
  return JSON.parse(fs.readFileSync(path.join(root, LEDGER_PATH), 'utf8')).ownerActionQueue;
}

function runVerifier(root) {
  return spawnSync(process.execPath, [VERIFIER_SCRIPT, '--root', root], {
    cwd: path.dirname(root),
    encoding: 'utf8',
  });
}

function assertCase(name, mutate, expectedCode, expectedText) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-owner-action-queue-${name}-`));
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
    name: 'aligned-owner-action-queue-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
  },
  {
    name: 'missing-owner-action-queue-fails',
    expectedCode: 1,
    expectedText: 'missing_owner_action_queue',
    mutate(root) {
      updateJson(root, LEDGER_PATH, (value) => {
        delete value.ownerActionQueue;
      });
    },
  },
  {
    name: 'count-mismatch-fails',
    expectedCode: 1,
    expectedText: 'count_mismatch',
    mutate(root) {
      const [first] = readQueue(root);
      writeModel(root, [uiItem(first)]);
    },
  },
  {
    name: 'missing-ui-queue-item-fails',
    expectedCode: 1,
    expectedText: 'missing_ui_queue_item',
    mutate(root) {
      const [first] = readQueue(root);
      writeModel(root, [uiItem(first), uiItem(first, { gateId: 'unexpected_gate' })]);
    },
  },
  {
    name: 'queue-item-mismatch-fails',
    expectedCode: 1,
    expectedText: 'queue_item_mismatch',
    mutate(root) {
      const queue = readQueue(root);
      const items = queue.map((item) => uiItem(item));
      items[0].nextCommand = 'npm run verify:manual-wcag-evidence --wrong';
      writeModel(root, items);
    },
  },
  {
    name: 'stale-next-command-fails',
    expectedCode: 1,
    expectedText: 'stale_next_command',
    mutate(root) {
      updateJson(root, LEDGER_PATH, (value) => {
        value.ownerActionQueue[0].nextCommand = 'npm run verify:manual-wcag-evidence -- --require-complete';
      });
      const queue = readQueue(root);
      writeModel(root, queue.map((item) => uiItem(item)));
    },
  },
  {
    name: 'extra-ui-queue-item-fails',
    expectedCode: 1,
    expectedText: 'extra_ui_queue_item',
    mutate(root) {
      const queue = readQueue(root);
      writeModel(root, [...queue.map((item) => uiItem(item)), uiItem(canonicalItem('manual_wcag_evidence'), { gateId: 'extra_gate' })]);
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText);
}

console.log(`Owner-action queue alignment fixture verification passed: ${cases.length} cases.`);
