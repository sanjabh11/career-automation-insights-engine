#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-owner-evidence-completion-drill-sources.mjs');

const DRILL_PATH = 'docs/commercialization/owner-evidence-completion-drill-latest.json';
const OUTPUT_PATH = 'docs/commercialization/owner-evidence-completion-drill-source-audit-latest.json';

const packetSummaries = [
  {
    packetType: 'live_proof_run',
    label: 'Owner live-proof run packet',
    officialReferenceIds: [
      'stripe-test-mode',
      'stripe-api-keys',
      'stripe-key-best-practices',
      'pci-dss-v4-0-1',
      'supabase-edge-function-secrets',
      'github-actions-secrets',
    ],
    officialReferenceUrls: [
      'https://docs.stripe.com/test-mode',
      'https://docs.stripe.com/keys',
      'https://docs.stripe.com/keys-best-practices',
      'https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1',
      'https://supabase.com/docs/guides/functions/secrets',
      'https://docs.github.com/en/actions/concepts/security/secrets',
    ],
  },
  {
    packetType: 'commercial_evidence_intake',
    label: 'Commercial evidence intake packet',
    officialReferenceIds: [
      'ftc-consumer-reviews-rule-questions',
      'ftc-endorsements-reviews',
      'ftc-endorsement-guides-faq',
      'ftc-review-solicitation-guide',
    ],
    officialReferenceUrls: [
      'https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers',
      'https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews',
      'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking',
      'https://www.ftc.gov/business-guidance/resources/soliciting-paying-online-reviews-guide-marketers',
    ],
  },
  {
    packetType: 'manual_wcag_review',
    label: 'Manual WCAG owner review packet',
    officialReferenceIds: ['wcag22', 'wcag-em-overview', 'wcag-em-2', 'wcag-em-report-tool', 'wai-easy-checks', 'wai-aria-apg', 'wcag2ict-22'],
    officialReferenceUrls: [
      'https://www.w3.org/TR/WCAG22/',
      'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/',
      'https://www.w3.org/TR/wcag-em-2/',
      'https://www.w3.org/WAI/eval/report-tool/',
      'https://www.w3.org/WAI/test-evaluate/preliminary/',
      'https://www.w3.org/WAI/ARIA/apg/',
      'https://www.w3.org/TR/wcag2ict-22/',
    ],
  },
];

function officialReferenceUrls() {
  return [...new Set(packetSummaries.flatMap((packet) => packet.officialReferenceUrls))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function drill(overrides = {}) {
  const urls = officialReferenceUrls();
  return {
    schemaVersion: '2026-06-04.apo-owner-evidence-completion-drill.v1',
    status: 'owner_evidence_required',
    goalComplete: false,
    officialReferenceCount: urls.length,
    officialReferenceUrls: urls,
    packetSummaries: packetSummaries.map((packet) => ({
      ...packet,
      officialReferenceCount: packet.officialReferenceUrls.length,
    })),
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
  writeJson(root, DRILL_PATH, drill());
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-completion-drill-source-audit-${name}-`));
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
    name: 'aligned-owner-evidence-completion-drill-source-audit-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
    inspect(root) {
      const audit = readJson(root, OUTPUT_PATH);
      if (audit.sourceCount !== 17 || audit.passedCount !== 17 || audit.failedCount !== 0) {
        throw new Error(`aligned audit counts drifted: ${JSON.stringify(audit)}`);
      }
      if (audit.networkFetch !== false) {
        throw new Error('fixture verifier should exercise non-network source-audit mode');
      }
      if (audit.packetReferenceCounts.live_proof_run !== 6) {
        throw new Error('live-proof packet source count drifted');
      }
    },
  },
  {
    name: 'missing-required-reference-fails',
    expectedCode: 1,
    expectedText: 'missing_required_reference',
    mutate(root) {
      updateJson(root, DRILL_PATH, (value) => {
        const packet = value.packetSummaries.find((item) => item.packetType === 'manual_wcag_review');
        const index = packet.officialReferenceIds.indexOf('wcag-em-2');
        packet.officialReferenceIds.splice(index, 1);
        packet.officialReferenceUrls.splice(index, 1);
      });
    },
  },
  {
    name: 'reference-url-drift-fails',
    expectedCode: 1,
    expectedText: 'reference_url_mismatch',
    mutate(root) {
      updateJson(root, DRILL_PATH, (value) => {
        value.packetSummaries[0].officialReferenceUrls[0] = 'https://docs.stripe.com/testing';
      });
    },
  },
  {
    name: 'unexpected-reference-fails',
    expectedCode: 1,
    expectedText: 'unexpectedReferenceCount',
    mutate(root) {
      updateJson(root, DRILL_PATH, (value) => {
        value.packetSummaries[0].officialReferenceIds.push('unreviewed-source');
        value.packetSummaries[0].officialReferenceUrls.push('https://example.com/unreviewed');
      });
    },
  },
  {
    name: 'top-level-reference-url-drift-fails',
    expectedCode: 1,
    expectedText: 'topLevelUrlMismatch',
    mutate(root) {
      updateJson(root, DRILL_PATH, (value) => {
        value.officialReferenceUrls = ['https://example.com/stale'];
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
      if (!audit.sourceBoundary.includes('does not prove owner-held evidence')) {
        throw new Error('written audit did not preserve owner-evidence source boundary');
      }
      const source = audit.sources.find((item) => item.key === 'live_proof_run:stripe-test-mode');
      if (!source || source.expectedEvidenceCount !== 2) {
        throw new Error('written audit did not preserve expected source checks');
      }
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText, testCase.inspect);
}

console.log(`Owner-evidence completion-drill source-audit fixture verification passed: ${cases.length} cases.`);
