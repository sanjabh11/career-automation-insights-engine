#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-commercial-evidence-intake-sources.mjs');

const PACKET_PATH = 'docs/commercialization/commercial-evidence-intake-packet-latest.json';
const OUTPUT_PATH = 'docs/commercialization/commercial-evidence-intake-source-audit-latest.json';

const references = [
  {
    id: 'ftc-consumer-reviews-rule-questions',
    label: 'FTC Consumer Reviews and Testimonials Rule questions',
    url: 'https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers',
    appliesTo: ['fake or false review/testimonial boundary', 'review/testimonial rule awareness'],
  },
  {
    id: 'ftc-endorsements-reviews',
    label: 'FTC endorsements, influencers, and reviews',
    url: 'https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews',
    appliesTo: ['quote approval', 'review/testimonial boundaries', 'material connection awareness'],
  },
  {
    id: 'ftc-endorsement-guides-faq',
    label: "FTC Endorsement Guides: What People Are Asking",
    url: 'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking',
    appliesTo: ['honest endorsement handling', 'material connection disclosure review'],
  },
  {
    id: 'ftc-review-solicitation-guide',
    label: 'FTC soliciting and paying for online reviews guide',
    url: 'https://www.ftc.gov/business-guidance/resources/soliciting-paying-online-reviews-guide-marketers',
    appliesTo: ['review solicitation integrity', 'anti-fake-review boundary'],
  },
];

function packet(overrides = {}) {
  return {
    schemaVersion: '2026-06-04.apo-commercial-evidence-intake-packet.v1',
    status: 'owner_commercial_evidence_required',
    officialReferences: references,
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-commercial-intake-source-audit-${name}-`));
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
    name: 'aligned-commercial-evidence-intake-source-audit-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
    inspect(root) {
      const audit = readJson(root, OUTPUT_PATH);
      if (audit.sourceCount !== 4 || audit.passedCount !== 4 || audit.failedCount !== 0) {
        throw new Error(`aligned audit counts drifted: ${JSON.stringify(audit)}`);
      }
      if (audit.networkFetch !== false) {
        throw new Error('fixture verifier should exercise non-network source-audit mode');
      }
    },
  },
  {
    name: 'missing-required-reference-fails',
    expectedCode: 1,
    expectedText: 'missing_required_reference',
    mutate(root) {
      updateJson(root, PACKET_PATH, (value) => {
        value.officialReferences = value.officialReferences.filter((reference) => reference.id !== 'ftc-endorsement-guides-faq');
      });
    },
  },
  {
    name: 'reference-url-drift-fails',
    expectedCode: 1,
    expectedText: 'reference_url_mismatch',
    mutate(root) {
      updateJson(root, PACKET_PATH, (value) => {
        value.officialReferences[0].url = 'https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions';
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
          id: 'unreviewed-source',
          label: 'Unreviewed source',
          url: 'https://example.com/unreviewed',
          appliesTo: ['fixture'],
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
      if (!audit.sourceBoundary.includes('does not prove partner commitments')) {
        throw new Error('written audit did not preserve owner-evidence source boundary');
      }
      const reviewsRule = audit.sources.find((source) => source.id === 'ftc-consumer-reviews-rule-questions');
      if (!reviewsRule?.appliesTo?.includes('review/testimonial rule awareness')) {
        throw new Error('written audit did not preserve reference usage context');
      }
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText, testCase.inspect);
}

console.log(`Commercial evidence intake source-audit fixture verification passed: ${cases.length} cases.`);
