#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-owner-evidence-command-checklist-alignment.mjs');

const COMMANDS = [
  'npm run prepare:owner-evidence -- --write',
  'npm run generate:live-proof-run-packet',
  'npm run verify:stripe-test-checkout',
  'npm run verify:commercial',
];

function writeJson(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function commandItem(command, index, overrides = {}) {
  return {
    commandId: `owner-command-${index + 1}`,
    label: `Owner command ${index + 1}`,
    status: index < 2 ? 'ready_after_owner_inputs' : 'blocked_until_real_evidence',
    command,
    requiredOwnerInputs: [`Owner input ${index + 1}`],
    writes: index === COMMANDS.length - 1 ? 'No tracked files.' : `Generated owner artifact ${index + 1}.`,
    safetyBoundary: 'Command checklist fixture boundary; does not prove owner-held evidence or commercial readiness.',
    ...overrides,
  };
}

function writeModel(root, items) {
  const absolutePath = path.join(root, 'src/lib/commercialLaunchReadiness.ts');
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  const body = items
    .map((item) => `  ${JSON.stringify(item, null, 2).replace(/\n/g, '\n  ')}`)
    .join(',\n');
  fs.writeFileSync(absolutePath, `export const ownerEvidenceCloseoutCommandItems = [\n${body}\n];\n`);
}

function writeBaseArtifacts(root) {
  writeJson(root, 'docs/commercialization/owner-evidence-handoff-latest.json', {
    schemaVersion: '2026-06-04.apo-owner-evidence-handoff.v1',
    goalComplete: false,
    commandSequence: [...COMMANDS],
  });
  writeModel(root, COMMANDS.map((command, index) => commandItem(command, index)));
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-owner-command-checklist-${name}-`));
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
    name: 'aligned-owner-command-checklist-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
  },
  {
    name: 'missing-handoff-command-sequence-fails',
    expectedCode: 1,
    expectedText: 'missing_handoff_command_sequence',
    mutate(root) {
      updateJson(root, 'docs/commercialization/owner-evidence-handoff-latest.json', (value) => {
        delete value.commandSequence;
      });
    },
  },
  {
    name: 'ui-command-sequence-mismatch-fails',
    expectedCode: 1,
    expectedText: 'command_sequence_mismatch',
    mutate(root) {
      const items = COMMANDS.map((command, index) => commandItem(command, index));
      items[2].command = 'npm run verify:stripe-test-checkout --wrong';
      writeModel(root, items);
    },
  },
  {
    name: 'missing-command-id-fails',
    expectedCode: 1,
    expectedText: '"field": "commandId"',
    mutate(root) {
      const items = COMMANDS.map((command, index) => commandItem(command, index));
      delete items[0].commandId;
      writeModel(root, items);
    },
  },
  {
    name: 'duplicate-command-id-fails',
    expectedCode: 1,
    expectedText: 'duplicate_command_id',
    mutate(root) {
      const items = COMMANDS.map((command, index) => commandItem(command, index));
      items[1].commandId = items[0].commandId;
      writeModel(root, items);
    },
  },
  {
    name: 'missing-required-owner-inputs-fails',
    expectedCode: 1,
    expectedText: 'missing_required_owner_inputs',
    mutate(root) {
      const items = COMMANDS.map((command, index) => commandItem(command, index));
      items[1].requiredOwnerInputs = [];
      writeModel(root, items);
    },
  },
  {
    name: 'missing-safety-boundary-fails',
    expectedCode: 1,
    expectedText: '"field": "safetyBoundary"',
    mutate(root) {
      const items = COMMANDS.map((command, index) => commandItem(command, index));
      items[2].safetyBoundary = '';
      writeModel(root, items);
    },
  },
  {
    name: 'missing-writes-field-fails',
    expectedCode: 1,
    expectedText: '"field": "writes"',
    mutate(root) {
      const items = COMMANDS.map((command, index) => commandItem(command, index));
      delete items[3].writes;
      writeModel(root, items);
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText);
}

console.log(`Owner-evidence command checklist alignment fixture verification passed: ${cases.length} cases.`);
