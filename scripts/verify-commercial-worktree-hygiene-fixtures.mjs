#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateCommercialWorktreeHygieneCounts } from './verify-commercial-worktree-hygiene.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKTREE_SCRIPT = path.join(__dirname, 'verify-commercial-worktree-hygiene.mjs');

function writeFile(root, relativePath, contents = 'fixture\n') {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
}

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
  });
}

function initFixtureRepo(root) {
  const result = run('git', ['init', '--quiet'], root);
  if (result.status !== 0) {
    throw new Error(`git init failed in ${root}\n${result.stderr || result.stdout}`);
  }
}

function runVerifier(root) {
  return spawnSync(process.execPath, [WORKTREE_SCRIPT], {
    cwd: root,
    encoding: 'utf8',
  });
}

function parseVerifierJson(name, stdout) {
  try {
    return JSON.parse(stdout);
  } catch {
    throw new Error(`${name} expected verifier stdout to be JSON\n${stdout}`);
  }
}

function assertIncludes(name, values, expectedText) {
  if (!values.some((value) => String(value).includes(expectedText))) {
    throw new Error(`${name} expected count error containing ${JSON.stringify(expectedText)}\n${values.join('\n')}`);
  }
}

function assertCommercialWorktreeHygieneCounts(name, result) {
  const errors = validateCommercialWorktreeHygieneCounts(result);
  if (errors.length > 0) {
    throw new Error(`${name} expected commercial worktree hygiene counts to align\n${errors.join('\n')}`);
  }
}

function assertCountDrift(name, mutate, expectedText) {
  return (result) => {
    mutate(result);
    assertIncludes(name, validateCommercialWorktreeHygieneCounts(result), expectedText);
  };
}

function assertCase(name, setup, expectedCode, expectedText, assertion = () => {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-worktree-hygiene-${name}-`));
  try {
    initFixtureRepo(root);
    setup(root);

    const result = runVerifier(root);
    const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`;

    if (result.status !== expectedCode) {
      throw new Error(`${name} expected exit ${expectedCode}, got ${result.status}\n${combinedOutput}`);
    }
    if (!combinedOutput.includes(expectedText)) {
      throw new Error(`${name} expected output containing ${JSON.stringify(expectedText)}\n${combinedOutput}`);
    }

    assertion(parseVerifierJson(name, result.stdout));
    console.log(`ok ${name}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const cases = [
  {
    name: 'allowed-generated-commercialization-paths-pass',
    expectedCode: 0,
    expectedText: '"status": "passed"',
    setup(root) {
      writeFile(root, 'docs/commercialization/commercial-worktree-hygiene-latest.json', '{}\n');
      writeFile(root, 'docs/commercialization/owner-evidence-handoff-latest.md');
      writeFile(root, 'docs/commercialization/live-proof-run-matrix-latest.csv', 'id,status\nfixture,ok\n');
      writeFile(root, 'scripts/verify-fixture-boundary.mjs', '#!/usr/bin/env node\n');
      writeFile(root, '.dynamic-workflows/fixture-run/README.md');
      writeFile(root, '.dynamic-workflows/fixture-run/backlog.jsonl');
      writeFile(root, '.dynamic-workflows/fixture-run/workflow.json', '{}\n');
      writeFile(root, '.phase-loop/trace-spans.jsonl', '{"type":"trace-step"}\n');
    },
    assertion(result) {
      assertCommercialWorktreeHygieneCounts('allowed-generated-commercialization-paths-pass', result);
    },
  },
  {
    name: 'allowed-untracked-path-pattern-count-drift-fails',
    expectedCode: 0,
    expectedText: '"status": "passed"',
    setup(root) {
      writeFile(root, 'docs/commercialization/commercial-worktree-hygiene-latest.json', '{}\n');
    },
    assertion: assertCountDrift(
      'allowed-untracked-path-pattern-count-drift-fails',
      (result) => { result.allowedUntrackedPathPatternCount += 1; },
      'worktree_hygiene_allowed_untracked_path_pattern_count_mismatch',
    ),
  },
  {
    name: 'sensitive-untracked-path-pattern-count-drift-fails',
    expectedCode: 0,
    expectedText: '"status": "passed"',
    setup(root) {
      writeFile(root, 'docs/commercialization/commercial-worktree-hygiene-latest.json', '{}\n');
    },
    assertion: assertCountDrift(
      'sensitive-untracked-path-pattern-count-drift-fails',
      (result) => { result.sensitiveUntrackedPathPatternCount += 1; },
      'worktree_hygiene_sensitive_untracked_path_pattern_count_mismatch',
    ),
  },
  {
    name: 'untracked-path-count-drift-fails',
    expectedCode: 0,
    expectedText: '"status": "passed"',
    setup(root) {
      writeFile(root, 'docs/commercialization/commercial-worktree-hygiene-latest.json', '{}\n');
    },
    assertion: assertCountDrift(
      'untracked-path-count-drift-fails',
      (result) => { result.untrackedPathCount += 1; },
      'worktree_hygiene_untracked_path_count_mismatch',
    ),
  },
  {
    name: 'untracked-allowed-path-count-drift-fails',
    expectedCode: 0,
    expectedText: '"status": "passed"',
    setup(root) {
      writeFile(root, 'docs/commercialization/commercial-worktree-hygiene-latest.json', '{}\n');
    },
    assertion: assertCountDrift(
      'untracked-allowed-path-count-drift-fails',
      (result) => { result.untrackedAllowedPathCount += 1; },
      'worktree_hygiene_untracked_allowed_path_count_mismatch',
    ),
  },
  {
    name: 'unexpected-untracked-path-count-drift-fails',
    expectedCode: 0,
    expectedText: '"status": "passed"',
    setup(root) {
      writeFile(root, 'docs/commercialization/commercial-worktree-hygiene-latest.json', '{}\n');
    },
    assertion: assertCountDrift(
      'unexpected-untracked-path-count-drift-fails',
      (result) => { result.unexpectedUntrackedPathCount += 1; },
      'worktree_hygiene_unexpected_untracked_path_count_mismatch',
    ),
  },
  {
    name: 'sensitive-untracked-path-count-drift-fails',
    expectedCode: 0,
    expectedText: '"status": "passed"',
    setup(root) {
      writeFile(root, 'docs/commercialization/commercial-worktree-hygiene-latest.json', '{}\n');
    },
    assertion: assertCountDrift(
      'sensitive-untracked-path-count-drift-fails',
      (result) => { result.sensitiveUntrackedPathCount += 1; },
      'worktree_hygiene_sensitive_untracked_path_count_mismatch',
    ),
  },
  {
    name: 'untracked-path-check-count-drift-fails',
    expectedCode: 0,
    expectedText: '"status": "passed"',
    setup(root) {
      writeFile(root, 'docs/commercialization/commercial-worktree-hygiene-latest.json', '{}\n');
    },
    assertion: assertCountDrift(
      'untracked-path-check-count-drift-fails',
      (result) => { result.untrackedPathCheckCount += 1; },
      'worktree_hygiene_untracked_path_check_count_mismatch',
    ),
  },
  {
    name: 'does-not-prove-count-drift-fails',
    expectedCode: 0,
    expectedText: '"status": "passed"',
    setup(root) {
      writeFile(root, 'docs/commercialization/commercial-worktree-hygiene-latest.json', '{}\n');
    },
    assertion: assertCountDrift(
      'does-not-prove-count-drift-fails',
      (result) => { result.doesNotProveCount += 1; },
      'worktree_hygiene_does_not_prove_count_mismatch',
    ),
  },
  {
    name: 'error-count-drift-fails',
    expectedCode: 0,
    expectedText: '"status": "passed"',
    setup(root) {
      writeFile(root, 'docs/commercialization/commercial-worktree-hygiene-latest.json', '{}\n');
    },
    assertion: assertCountDrift(
      'error-count-drift-fails',
      (result) => { result.errorCount += 1; },
      'worktree_hygiene_error_count_mismatch',
    ),
  },
  {
    name: 'unexpected-untracked-path-fails',
    expectedCode: 1,
    expectedText: 'unexpected_untracked_path',
    setup(root) {
      writeFile(root, 'README.md');
    },
  },
  {
    name: 'sensitive-local-env-fails',
    expectedCode: 1,
    expectedText: 'sensitive_untracked_path',
    setup(root) {
      writeFile(root, '.env.local', 'STRIPE_SECRET_KEY=fixture\n');
    },
  },
  {
    name: 'owner-local-evidence-json-fails',
    expectedCode: 1,
    expectedText: 'owner-local-evidence-json',
    setup(root) {
      writeFile(root, 'docs/commercialization/live-gate-evidence.local.json', '{}\n');
    },
  },
  {
    name: 'private-key-path-fails',
    expectedCode: 1,
    expectedText: 'private-key-or-certificate',
    setup(root) {
      writeFile(root, 'docs/commercialization/private-key.pem', 'fixture\n');
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.setup, testCase.expectedCode, testCase.expectedText, testCase.assertion);
}

console.log(`Commercial worktree hygiene fixture verification passed: ${cases.length} cases.`);
