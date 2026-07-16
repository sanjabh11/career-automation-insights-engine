#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-owner-evidence-runbook-alignment.mjs');
const RUNBOOK_PATHS = [
  'docs/commercialization/part-i-owner-evidence-blocker-runbook.md',
  'docs/commercialization/phase-e-commercial-validation-playbook.md',
];

const COMMANDS = [
  'npm run prepare:owner-evidence -- --write',
  'npm run generate:live-proof-run-packet',
  'npm run verify:stripe-test-checkout',
  'npm run verify:commercial',
];

const STALE_COMMAND = 'npm run verify:commercial-evidence-records -- --require-all';

function writeFile(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, value);
}

function writeJson(root, relativePath, value) {
  writeFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function runbookMarkdown(commands = COMMANDS, extra = '') {
  return `# Fixture Owner Runbook

Use this command sequence:

\`\`\`bash
${commands.join('\n')}
\`\`\`

${extra}
`;
}

function writeRunbooks(root, commands = COMMANDS) {
  for (const runbookPath of RUNBOOK_PATHS) {
    writeFile(root, runbookPath, runbookMarkdown(commands));
  }
}

function writeBaseArtifacts(root) {
  writeJson(root, 'docs/commercialization/owner-evidence-handoff-latest.json', {
    schemaVersion: '2026-06-04.apo-owner-evidence-handoff.v1',
    goalComplete: false,
    commandSequence: [...COMMANDS],
  });
  writeRunbooks(root);
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-owner-runbook-alignment-${name}-`));
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
    name: 'aligned-owner-runbooks-pass',
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
    name: 'missing-exact-command-sequence-block-fails',
    expectedCode: 1,
    expectedText: 'missing_exact_command_sequence_block',
    mutate(root) {
      writeFile(root, RUNBOOK_PATHS[0], runbookMarkdown([...COMMANDS].reverse()));
    },
  },
  {
    name: 'missing-command-fails',
    expectedCode: 1,
    expectedText: 'missing_command',
    mutate(root) {
      writeFile(root, RUNBOOK_PATHS[0], runbookMarkdown(COMMANDS.slice(1)));
    },
  },
  {
    name: 'stale-command-fails',
    expectedCode: 1,
    expectedText: 'stale_command',
    mutate(root) {
      writeFile(root, RUNBOOK_PATHS[1], runbookMarkdown(COMMANDS, `Legacy command:\n\n${STALE_COMMAND}\n`));
    },
  },
  {
    name: 'missing-runbook-fails',
    expectedCode: 1,
    expectedText: 'missing_runbook',
    mutate(root) {
      fs.rmSync(path.join(root, RUNBOOK_PATHS[1]), { force: true });
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText);
}

console.log(`Owner-evidence runbook alignment fixture verification passed: ${cases.length} cases.`);
