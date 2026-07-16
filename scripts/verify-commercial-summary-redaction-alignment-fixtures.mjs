#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const REPO_SUMMARY_JSON = 'docs/commercialization/commercial-verification-summary-latest.json';
const REPO_SUMMARY_MD = 'docs/commercialization/commercial-verification-summary-latest.md';
const REPO_REDACTION_JSON = 'docs/commercialization/commercial-artifact-redaction-latest.json';
const REPO_REDACTION_MD = 'docs/commercialization/commercial-artifact-redaction-latest.md';
const ALIGNMENT_SCRIPT = 'scripts/verify-commercial-summary-redaction-alignment.mjs';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function copyFixtureArtifacts(root) {
  const paths = {
    summaryJson: path.join(root, 'commercial-verification-summary-latest.json'),
    summaryMd: path.join(root, 'commercial-verification-summary-latest.md'),
    redactionJson: path.join(root, 'commercial-artifact-redaction-latest.json'),
    redactionMd: path.join(root, 'commercial-artifact-redaction-latest.md'),
  };

  fs.copyFileSync(REPO_SUMMARY_JSON, paths.summaryJson);
  fs.copyFileSync(REPO_SUMMARY_MD, paths.summaryMd);
  fs.copyFileSync(REPO_REDACTION_JSON, paths.redactionJson);
  fs.copyFileSync(REPO_REDACTION_MD, paths.redactionMd);
  return paths;
}

function runAlignment(paths) {
  return spawnSync(process.execPath, [ALIGNMENT_SCRIPT], {
    encoding: 'utf8',
    env: {
      ...process.env,
      COMMERCIAL_SUMMARY_REDACTION_SUMMARY_JSON: paths.summaryJson,
      COMMERCIAL_SUMMARY_REDACTION_SUMMARY_MD: paths.summaryMd,
      COMMERCIAL_SUMMARY_REDACTION_ARTIFACT_JSON: paths.redactionJson,
      COMMERCIAL_SUMMARY_REDACTION_ARTIFACT_MD: paths.redactionMd,
    },
  });
}

function assertCase(name, paths, mutate, expectedCode, expectedText) {
  mutate(paths);
  const result = runAlignment(paths);
  const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`;
  if (result.status !== expectedCode) {
    throw new Error(`${name} expected exit ${expectedCode}, got ${result.status}\n${combinedOutput}`);
  }
  if (!combinedOutput.includes(expectedText)) {
    throw new Error(`${name} expected output containing ${JSON.stringify(expectedText)}\n${combinedOutput}`);
  }
  console.log(`ok ${name}`);
}

function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'apo-summary-redaction-fixtures-'));
  const cases = [
    {
      name: 'aligned-current-artifacts-pass',
      mutate: () => {},
      expectedCode: 0,
      expectedText: 'Commercial summary redaction alignment passed',
    },
    {
      name: 'stale-redaction-timestamp-fails',
      mutate: (paths) => {
        const summary = readJson(paths.summaryJson);
        const redaction = readJson(paths.redactionJson);
        redaction.generatedAt = summary.generatedAt;
        writeJson(paths.redactionJson, redaction);
      },
      expectedCode: 1,
      expectedText: 'generatedAt must be later',
    },
    {
      name: 'missing-scanned-summary-json-fails',
      mutate: (paths) => {
        const redaction = readJson(paths.redactionJson);
        redaction.scannedFiles = redaction.scannedFiles.filter(
          (file) => file !== 'docs/commercialization/commercial-verification-summary-latest.json',
        );
        writeJson(paths.redactionJson, redaction);
      },
      expectedCode: 1,
      expectedText: 'scannedFiles must include docs/commercialization/commercial-verification-summary-latest.json',
    },
    {
      name: 'nonzero-redaction-findings-fail',
      mutate: (paths) => {
        const redaction = readJson(paths.redactionJson);
        redaction.findingCount = 1;
        redaction.findings = [
          {
            id: 'fixture-high-confidence-secret',
            file: 'docs/commercialization/commercial-verification-summary-latest.json',
            line: 1,
            preview: '[fixture-redacted]',
          },
        ];
        writeJson(paths.redactionJson, redaction);
      },
      expectedCode: 1,
      expectedText: 'findingCount must be 0',
    },
    {
      name: 'scanned-extension-count-drift-fails',
      mutate: (paths) => {
        const redaction = readJson(paths.redactionJson);
        redaction.scannedExtensionCount = redaction.scannedExtensions.length + 1;
        writeJson(paths.redactionJson, redaction);
      },
      expectedCode: 1,
      expectedText: 'scannedExtensionCount must match scannedExtensions length',
    },
    {
      name: 'scanned-extension-count-markdown-drift-fails',
      mutate: (paths) => {
        const source = fs.readFileSync(paths.redactionMd, 'utf8');
        fs.writeFileSync(paths.redactionMd, source.replace('| Scanned extensions | 3 |\n', ''));
      },
      expectedCode: 1,
      expectedText: 'must include scannedExtensionCount',
    },
    {
      name: 'reference-practice-count-drift-fails',
      mutate: (paths) => {
        const redaction = readJson(paths.redactionJson);
        redaction.referencePracticeCount = redaction.referencePractices.length + 1;
        writeJson(paths.redactionJson, redaction);
      },
      expectedCode: 1,
      expectedText: 'referencePracticeCount must match referencePractices length',
    },
    {
      name: 'does-not-prove-count-drift-fails',
      mutate: (paths) => {
        const redaction = readJson(paths.redactionJson);
        redaction.doesNotProveCount = redaction.doesNotProve.length + 1;
        writeJson(paths.redactionJson, redaction);
      },
      expectedCode: 1,
      expectedText: 'doesNotProveCount must match doesNotProve length',
    },
    {
      name: 'does-not-prove-count-markdown-drift-fails',
      mutate: (paths) => {
        const source = fs.readFileSync(paths.redactionMd, 'utf8');
        fs.writeFileSync(paths.redactionMd, source.replace('| Does-not-prove boundaries | 3 |\n', ''));
      },
      expectedCode: 1,
      expectedText: 'must include doesNotProveCount',
    },
    {
      name: 'reference-practice-count-markdown-drift-fails',
      mutate: (paths) => {
        const source = fs.readFileSync(paths.redactionMd, 'utf8');
        fs.writeFileSync(paths.redactionMd, source.replace('| Reference practices | 3 |\n', ''));
      },
      expectedCode: 1,
      expectedText: 'must include referencePracticeCount',
    },
    {
      name: 'missing-alignment-metadata-fails',
      mutate: (paths) => {
        const summary = readJson(paths.summaryJson);
        delete summary.postSummaryArtifactRedaction.alignmentVerifier;
        writeJson(paths.summaryJson, summary);
      },
      expectedCode: 1,
      expectedText: 'alignmentVerifier.command mismatch',
    },
  ];

  for (const testCase of cases) {
    const caseRoot = fs.mkdtempSync(path.join(tempRoot, `${testCase.name}-`));
    const paths = copyFixtureArtifacts(caseRoot);
    assertCase(testCase.name, paths, testCase.mutate, testCase.expectedCode, testCase.expectedText);
  }

  console.log(`Commercial summary redaction alignment fixture verification passed: ${cases.length} cases.`);
}

main();
