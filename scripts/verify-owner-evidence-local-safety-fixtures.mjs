#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateLocalSafetyCounts } from './verify-owner-evidence-local-safety.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_SAFETY_SCRIPT = path.join(__dirname, 'verify-owner-evidence-local-safety.mjs');

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
  });
}

function writeFile(root, relativePath, contents = 'fixture\n') {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
}

function initFixtureRepo(root) {
  const result = run('git', ['init', '--quiet'], root);
  if (result.status !== 0) {
    throw new Error(`git init failed in ${root}\n${result.stderr || result.stdout}`);
  }
}

function writeFullIgnorePolicy(root) {
  writeFile(
    root,
    '.gitignore',
    [
      '.env',
      '.env.*',
      'docs/commercialization/*.local.json',
      '',
    ].join('\n'),
  );
}

function forceStage(root, relativePath) {
  const result = run('git', ['add', '-f', '--', relativePath], root);
  if (result.status !== 0) {
    throw new Error(`git add -f ${relativePath} failed in ${root}\n${result.stderr || result.stdout}`);
  }
}

function runVerifier(root) {
  return spawnSync(process.execPath, [LOCAL_SAFETY_SCRIPT, '--root', root], {
    cwd: path.dirname(__dirname),
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
    throw new Error(`${name} expected error containing ${JSON.stringify(expectedText)}\n${values.join('\n')}`);
  }
}

function assertLocalSafetyCounts(name, result) {
  const errors = validateLocalSafetyCounts(result);
  if (errors.length > 0) {
    throw new Error(`${name} expected local-safety counts to align\n${errors.join('\n')}`);
  }
}

function assertCountDrift(name, mutate, expectedText) {
  return (result) => {
    mutate(result);
    assertIncludes(name, validateLocalSafetyCounts(result), expectedText);
  };
}

function assertCase(name, setup, expectedCode, expectedText, assertion = () => {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-owner-evidence-local-safety-${name}-`));
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
    name: 'ignored-untracked-owner-local-files-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    setup(root) {
      writeFullIgnorePolicy(root);
      writeFile(root, '.env.local', 'STRIPE_SECRET_KEY=owner-held-fixture\n');
      writeFile(root, 'docs/commercialization/live-gate-evidence.local.json', '{}\n');
      writeFile(root, 'docs/commercialization/commercial-evidence-intake.local.json', '{}\n');
      writeFile(root, 'docs/commercialization/manual-wcag-evidence.local.json', '{}\n');
    },
    assertion(result) {
      assertLocalSafetyCounts('ignored-untracked-owner-local-files-pass', result);
    },
  },
  {
    name: 'protected-path-count-drift-fails',
    expectedCode: 0,
    expectedText: '"ok": true',
    setup(root) {
      writeFullIgnorePolicy(root);
    },
    assertion: assertCountDrift(
      'protected-path-count-drift-fails',
      (result) => { result.protectedPathCount += 1; },
      'local_safety_protected_path_count_mismatch',
    ),
  },
  {
    name: 'ignored-protected-path-count-drift-fails',
    expectedCode: 0,
    expectedText: '"ok": true',
    setup(root) {
      writeFullIgnorePolicy(root);
    },
    assertion: assertCountDrift(
      'ignored-protected-path-count-drift-fails',
      (result) => { result.ignoredProtectedPathCount += 1; },
      'local_safety_ignored_protected_path_count_mismatch',
    ),
  },
  {
    name: 'tracked-sensitive-file-violation-count-drift-fails',
    expectedCode: 0,
    expectedText: '"ok": true',
    setup(root) {
      writeFullIgnorePolicy(root);
    },
    assertion: assertCountDrift(
      'tracked-sensitive-file-violation-count-drift-fails',
      (result) => { result.trackedSensitiveFileViolationCount += 1; },
      'local_safety_tracked_sensitive_file_violation_count_mismatch',
    ),
  },
  {
    name: 'staged-sensitive-path-violation-count-drift-fails',
    expectedCode: 0,
    expectedText: '"ok": true',
    setup(root) {
      writeFullIgnorePolicy(root);
    },
    assertion: assertCountDrift(
      'staged-sensitive-path-violation-count-drift-fails',
      (result) => { result.stagedSensitivePathViolationCount += 1; },
      'local_safety_staged_sensitive_path_violation_count_mismatch',
    ),
  },
  {
    name: 'does-not-prove-count-drift-fails',
    expectedCode: 0,
    expectedText: '"ok": true',
    setup(root) {
      writeFullIgnorePolicy(root);
    },
    assertion: assertCountDrift(
      'does-not-prove-count-drift-fails',
      (result) => { result.doesNotProveCount += 1; },
      'local_safety_does_not_prove_count_mismatch',
    ),
  },
  {
    name: 'reference-practice-count-drift-fails',
    expectedCode: 0,
    expectedText: '"ok": true',
    setup(root) {
      writeFullIgnorePolicy(root);
    },
    assertion: assertCountDrift(
      'reference-practice-count-drift-fails',
      (result) => { result.referencePracticeCount += 1; },
      'local_safety_reference_practice_count_mismatch',
    ),
  },
  {
    name: 'error-count-drift-fails',
    expectedCode: 0,
    expectedText: '"ok": true',
    setup(root) {
      writeFullIgnorePolicy(root);
    },
    assertion: assertCountDrift(
      'error-count-drift-fails',
      (result) => { result.errorCount += 1; },
      'local_safety_error_count_mismatch',
    ),
  },
  {
    name: 'missing-env-ignore-policy-fails',
    expectedCode: 1,
    expectedText: 'protected_owner_path_not_ignored',
    setup(root) {
      writeFile(root, '.gitignore', 'docs/commercialization/*.local.json\n');
    },
  },
  {
    name: 'missing-owner-local-json-ignore-policy-fails',
    expectedCode: 1,
    expectedText: 'docs/commercialization/live-gate-evidence.local.json',
    setup(root) {
      writeFile(root, '.gitignore', '.env\n.env.*\n');
    },
  },
  {
    name: 'tracked-env-local-fails',
    expectedCode: 1,
    expectedText: 'protected_owner_path_tracked',
    setup(root) {
      writeFullIgnorePolicy(root);
      writeFile(root, '.env.local', 'STRIPE_SECRET_KEY=owner-held-fixture\n');
      forceStage(root, '.env.local');
    },
  },
  {
    name: 'staged-owner-local-json-fails',
    expectedCode: 1,
    expectedText: 'protected_owner_path_staged',
    setup(root) {
      writeFullIgnorePolicy(root);
      writeFile(root, 'docs/commercialization/live-gate-evidence.local.json', '{}\n');
      forceStage(root, 'docs/commercialization/live-gate-evidence.local.json');
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.setup, testCase.expectedCode, testCase.expectedText);
}

console.log(`Owner evidence local-safety fixture verification passed: ${cases.length} cases.`);
