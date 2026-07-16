#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HASHER_SCRIPT = path.join(__dirname, 'hash-owner-evidence-artifacts.mjs');

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
  });
}

function writeFile(root, relativePath, contents = 'owner-held proof fixture\n') {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
  return absolutePath;
}

function initFixtureRepo(root) {
  const result = run('git', ['init', '--quiet'], root);
  if (result.status !== 0) {
    throw new Error(`git init failed in ${root}\n${result.stderr || result.stdout}`);
  }
}

function forceStage(root, relativePath) {
  const result = run('git', ['add', '-f', '--', relativePath], root);
  if (result.status !== 0) {
    throw new Error(`git add -f ${relativePath} failed in ${root}\n${result.stderr || result.stdout}`);
  }
}

function runHasher(root, inputPath) {
  return spawnSync(process.execPath, [HASHER_SCRIPT, inputPath], {
    cwd: root,
    encoding: 'utf8',
  });
}

function assertNoRawPathLeak(name, output, forbiddenSnippets) {
  for (const snippet of forbiddenSnippets) {
    if (output.includes(snippet)) {
      throw new Error(`${name} leaked raw source path snippet ${JSON.stringify(snippet)}\n${output}`);
    }
  }
}

function assertCase(name, setup, expectedCode, expectedText, forbiddenSnippets = []) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-owner-evidence-hasher-${name}-`));
  const cleanupRoots = [];
  try {
    initFixtureRepo(root);
    const inputPath = setup(root, cleanupRoots);

    const result = runHasher(root, inputPath);
    const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`;

    if (result.status !== expectedCode) {
      throw new Error(`${name} expected exit ${expectedCode}, got ${result.status}\n${combinedOutput}`);
    }
    const expectedTexts = Array.isArray(expectedText) ? expectedText : [expectedText];
    for (const text of expectedTexts) {
      if (!combinedOutput.includes(text)) {
        throw new Error(`${name} expected output containing ${JSON.stringify(text)}\n${combinedOutput}`);
      }
    }
    assertNoRawPathLeak(name, combinedOutput, forbiddenSnippets);

    console.log(`ok ${name}`);
  } finally {
    for (const cleanupRoot of cleanupRoots) {
      fs.rmSync(cleanupRoot, { recursive: true, force: true });
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const cases = [
  {
    name: 'outside-repo-owner-proof-file-pass',
    expectedCode: 0,
    expectedText: [
      '"ok": true',
      '"openedWithNoFollowFlag": true',
      '"openedDescriptorValidatedBeforeHashing": true',
      '"pathSwapBeforeHashingRejected": true',
    ],
    forbiddenSnippets: ['external-owner-proof.txt'],
    setup(_root, cleanupRoots) {
      const externalRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'apo-external-owner-proof-'));
      cleanupRoots.push(externalRoot);
      return writeFile(externalRoot, 'external-owner-proof.txt');
    },
  },
  {
    name: 'ignored-in-repo-owner-proof-file-pass',
    expectedCode: 0,
    expectedText: [
      '"ok": true',
      '"openedWithNoFollowFlag": true',
      '"openedDescriptorValidatedBeforeHashing": true',
      '"pathSwapBeforeHashingRejected": true',
    ],
    forbiddenSnippets: ['owner-proof/ignored-proof.txt'],
    setup(root) {
      writeFile(root, '.gitignore', 'owner-proof/\n');
      writeFile(root, 'owner-proof/ignored-proof.txt');
      return 'owner-proof/ignored-proof.txt';
    },
  },
  {
    name: 'symbolic-link-owner-proof-file-fails',
    expectedCode: 1,
    expectedText: 'symbolic link',
    forbiddenSnippets: ['owner-proof/symlink-proof.txt', 'external-target.txt'],
    setup(root, cleanupRoots) {
      writeFile(root, '.gitignore', 'owner-proof/\n');
      const externalRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'apo-external-owner-proof-target-'));
      cleanupRoots.push(externalRoot);
      const targetPath = writeFile(externalRoot, 'external-target.txt');
      const linkPath = path.join(root, 'owner-proof', 'symlink-proof.txt');
      fs.mkdirSync(path.dirname(linkPath), { recursive: true });
      fs.symlinkSync(targetPath, linkPath);
      return 'owner-proof/symlink-proof.txt';
    },
  },
  {
    name: 'hard-linked-owner-proof-file-fails',
    expectedCode: 1,
    expectedText: 'multiple filesystem links',
    forbiddenSnippets: ['owner-proof/hardlink-proof.txt', 'owner-proof/hardlink-target.txt'],
    setup(root) {
      writeFile(root, '.gitignore', 'owner-proof/\n');
      const targetPath = writeFile(root, 'owner-proof/hardlink-target.txt');
      const linkPath = path.join(root, 'owner-proof', 'hardlink-proof.txt');
      fs.linkSync(targetPath, linkPath);
      return 'owner-proof/hardlink-proof.txt';
    },
  },
  {
    name: 'nonignored-in-repo-proof-file-fails',
    expectedCode: 1,
    expectedText: 'not ignored by git',
    forbiddenSnippets: ['owner-proof/nonignored-proof.txt'],
    setup(root) {
      writeFile(root, 'owner-proof/nonignored-proof.txt');
      return 'owner-proof/nonignored-proof.txt';
    },
  },
  {
    name: 'tracked-repo-proof-file-fails',
    expectedCode: 1,
    expectedText: 'tracked repository file',
    forbiddenSnippets: ['tracked-proof.txt'],
    setup(root) {
      writeFile(root, 'tracked-proof.txt');
      forceStage(root, 'tracked-proof.txt');
      return 'tracked-proof.txt';
    },
  },
  {
    name: 'staged-ignored-owner-proof-file-fails',
    expectedCode: 1,
    expectedText: 'staged repository file',
    forbiddenSnippets: ['owner-proof/staged-proof.txt'],
    setup(root) {
      writeFile(root, '.gitignore', 'owner-proof/\n');
      writeFile(root, 'owner-proof/staged-proof.txt');
      forceStage(root, 'owner-proof/staged-proof.txt');
      return 'owner-proof/staged-proof.txt';
    },
  },
];

for (const testCase of cases) {
  assertCase(
    testCase.name,
    testCase.setup,
    testCase.expectedCode,
    testCase.expectedText,
    testCase.forbiddenSnippets,
  );
}

console.log(`Owner evidence artifact hasher fixture verification passed: ${cases.length} cases.`);
