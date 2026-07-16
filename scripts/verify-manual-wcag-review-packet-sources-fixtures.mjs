#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-manual-wcag-review-packet-sources.mjs');

const PACKET_PATH = 'docs/commercialization/manual-wcag-review-packet-latest.json';
const OUTPUT_PATH = 'docs/commercialization/manual-wcag-review-packet-source-audit-latest.json';

const references = [
  {
    id: 'wcag22',
    label: 'WCAG 2.2',
    url: 'https://www.w3.org/TR/WCAG22/',
  },
  {
    id: 'wcag-em-overview',
    label: 'WCAG-EM overview',
    url: 'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/',
  },
  {
    id: 'wcag-em-2',
    label: 'WCAG-EM 2.0',
    url: 'https://www.w3.org/TR/wcag-em-2/',
  },
  {
    id: 'wcag-em-report-tool',
    label: 'WCAG-EM Report Tool',
    url: 'https://www.w3.org/WAI/eval/report-tool/',
  },
  {
    id: 'wai-easy-checks',
    label: 'WAI Easy Checks',
    url: 'https://www.w3.org/WAI/test-evaluate/preliminary/',
  },
  {
    id: 'wai-aria-apg',
    label: 'ARIA Authoring Practices Guide',
    url: 'https://www.w3.org/WAI/ARIA/apg/',
  },
  {
    id: 'wcag2ict-22',
    label: 'WCAG2ICT 2.2',
    url: 'https://www.w3.org/TR/wcag2ict-22/',
  },
];

function packet(overrides = {}) {
  return {
    schemaVersion: '2026-06-04.apo-manual-wcag-review-packet.v1',
    status: 'owner_manual_review_required',
    officialReferences: references,
    checkpointReviewPlan: [
      {
        checkpointId: 'wcag-em-scope',
        standardRefs: ['wcag22', 'wcag-em-overview', 'wcag-em-2'],
        officialReferenceUrls: [
          'https://www.w3.org/TR/WCAG22/',
          'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/',
          'https://www.w3.org/TR/wcag-em-2/',
          'https://www.w3.org/WAI/eval/report-tool/',
        ],
      },
      {
        checkpointId: 'downloadable-artifacts',
        standardRefs: ['wcag22', 'wai-easy-checks', 'wai-aria-apg', 'wcag2ict-22'],
        officialReferenceUrls: [
          'https://www.w3.org/TR/WCAG22/',
          'https://www.w3.org/WAI/test-evaluate/preliminary/',
          'https://www.w3.org/WAI/ARIA/apg/',
          'https://www.w3.org/TR/wcag2ict-22/',
        ],
      },
    ],
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

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeBaseArtifacts(root) {
  writeJson(root, PACKET_PATH, packet());
}

function updateJson(root, relativePath, updater) {
  const absolutePath = path.join(root, relativePath);
  const value = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  updater(value);
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function runVerifier(root) {
  return spawnSync(process.execPath, [VERIFIER_SCRIPT, '--root', root, '--write'], {
    cwd: path.dirname(root),
    encoding: 'utf8',
  });
}

function assertCase(name, mutate, expectedCode, expectedText, inspect = () => {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-manual-wcag-source-audit-${name}-`));
  try {
    writeBaseArtifacts(root);
    mutate(root);
    const result = runVerifier(root);
    const auditPath = path.join(root, OUTPUT_PATH);
    const auditText = fs.existsSync(auditPath) ? fs.readFileSync(auditPath, 'utf8') : '';
    const output = `${result.stdout || ''}\n${result.stderr || ''}\n${auditText}`;
    if (result.status !== expectedCode) {
      throw new Error(`${name} expected exit ${expectedCode}, got ${result.status}\n${output}`);
    }
    if (!output.includes(expectedText)) {
      throw new Error(`${name} expected output containing ${JSON.stringify(expectedText)}\n${output}`);
    }
    inspect(root, output);
    console.log(`ok ${name}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const cases = [
  {
    name: 'aligned-manual-wcag-review-packet-source-audit-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
    inspect(root) {
      const audit = readJson(root, OUTPUT_PATH);
      if (audit.sourceCount !== 7 || audit.passedCount !== 7 || audit.failedCount !== 0) {
        throw new Error(`aligned audit counts drifted: ${JSON.stringify(audit)}`);
      }
      if (audit.networkFetch !== false) {
        throw new Error('fixture verifier should exercise non-network source-audit mode');
      }
      const wcag22 = audit.sources.find((source) => source.id === 'wcag22');
      if (!wcag22?.checkpointIds?.includes('wcag-em-scope')) {
        throw new Error('written audit did not preserve checkpoint usage context');
      }
    },
  },
  {
    name: 'missing-required-reference-fails',
    expectedCode: 1,
    expectedText: 'missing_required_reference',
    mutate(root) {
      updateJson(root, PACKET_PATH, (value) => {
        value.officialReferences = value.officialReferences.filter((reference) => reference.id !== 'wai-aria-apg');
      });
    },
  },
  {
    name: 'reference-url-drift-fails',
    expectedCode: 1,
    expectedText: 'reference_url_mismatch',
    mutate(root) {
      updateJson(root, PACKET_PATH, (value) => {
        value.officialReferences[0].url = 'https://www.w3.org/TR/WCAG21/';
      });
    },
  },
  {
    name: 'unexpected-reference-fails',
    expectedCode: 1,
    expectedText: 'unexpectedReferenceCount',
    mutate(root) {
      updateJson(root, PACKET_PATH, (value) => {
        value.officialReferences.push({
          id: 'unreviewed-accessibility-source',
          label: 'Unreviewed accessibility source',
          url: 'https://example.com/manual-wcag',
        });
      });
    },
  },
  {
    name: 'write-audit-artifact-captures-source-boundary',
    expectedCode: 0,
    expectedText: 'sourceBoundary',
    mutate() {},
    inspect(root) {
      const audit = readJson(root, OUTPUT_PATH);
      if (!audit.sourceBoundary.includes('does not prove manual review completion')) {
        throw new Error('written audit did not preserve manual WCAG review source boundary');
      }
      const easyChecks = audit.sources.find((source) => source.id === 'wai-easy-checks');
      if (!easyChecks?.checkpointIds?.includes('downloadable-artifacts')) {
        throw new Error('written audit did not preserve checkpoint source mapping');
      }
      const wcag2ict = audit.sources.find((source) => source.id === 'wcag2ict-22');
      if (!wcag2ict?.checkpointIds?.includes('downloadable-artifacts')) {
        throw new Error('written audit did not preserve WCAG2ICT downloadable-artifact mapping');
      }
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText, testCase.inspect);
}

console.log(`Manual WCAG review packet source-audit fixture verification passed: ${cases.length} cases.`);
