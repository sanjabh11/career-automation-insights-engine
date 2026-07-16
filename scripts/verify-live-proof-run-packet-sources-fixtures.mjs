#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-live-proof-run-packet-sources.mjs');

const PACKET_PATH = 'docs/commercialization/live-proof-run-packet-latest.json';
const OUTPUT_PATH = 'docs/commercialization/live-proof-run-packet-source-audit-latest.json';

const references = [
  {
    id: 'stripe-test-mode',
    label: 'Stripe test mode',
    url: 'https://docs.stripe.com/test-mode',
    appliesTo: ['real_stripe_test_checkout'],
  },
  {
    id: 'stripe-api-keys',
    label: 'Stripe API keys',
    url: 'https://docs.stripe.com/keys',
    appliesTo: ['real_stripe_test_checkout', 'live_mrr_gt_zero'],
  },
  {
    id: 'stripe-key-best-practices',
    label: 'Stripe API key best practices',
    url: 'https://docs.stripe.com/keys-best-practices',
    appliesTo: ['real_stripe_test_checkout', 'live_mrr_gt_zero'],
  },
  {
    id: 'pci-dss-v4-0-1',
    label: 'PCI DSS v4.0.1 publication notice',
    url: 'https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1',
    appliesTo: ['real_stripe_test_checkout', 'live_mrr_gt_zero'],
  },
  {
    id: 'supabase-edge-function-secrets',
    label: 'Supabase Edge Function secrets',
    url: 'https://supabase.com/docs/guides/functions/secrets',
    appliesTo: ['real_stripe_test_checkout', 'live_mrr_gt_zero'],
  },
  {
    id: 'github-actions-secrets',
    label: 'GitHub Actions secrets',
    url: 'https://docs.github.com/en/actions/concepts/security/secrets',
    appliesTo: ['real_stripe_test_checkout', 'live_mrr_gt_zero'],
  },
];

function packet(overrides = {}) {
  return {
    schemaVersion: '2026-06-04.apo-live-proof-run-packet.v1',
    status: 'owner_live_proof_required',
    officialReferences: references,
    liveProofs: [
      {
        gateId: 'real_stripe_test_checkout',
        officialReferenceIds: references.map((reference) => reference.id),
        officialReferenceUrls: references.map((reference) => reference.url),
      },
      {
        gateId: 'live_mrr_gt_zero',
        officialReferenceIds: references
          .filter((reference) => reference.appliesTo.includes('live_mrr_gt_zero'))
          .map((reference) => reference.id),
        officialReferenceUrls: references
          .filter((reference) => reference.appliesTo.includes('live_mrr_gt_zero'))
          .map((reference) => reference.url),
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-live-proof-source-audit-${name}-`));
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
    name: 'aligned-live-proof-run-packet-source-audit-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
    inspect(root) {
      const audit = readJson(root, OUTPUT_PATH);
      if (audit.sourceCount !== 6 || audit.passedCount !== 6 || audit.failedCount !== 0) {
        throw new Error(`aligned audit counts drifted: ${JSON.stringify(audit)}`);
      }
      if (audit.networkFetch !== false) {
        throw new Error('fixture verifier should exercise non-network source-audit mode');
      }
      const stripeKeys = audit.sources.find((source) => source.id === 'stripe-api-keys');
      if (!stripeKeys?.appliesTo?.includes('live_mrr_gt_zero')) {
        throw new Error('written audit did not preserve live proof appliesTo context');
      }
    },
  },
  {
    name: 'missing-required-reference-fails',
    expectedCode: 1,
    expectedText: 'missing_required_reference',
    mutate(root) {
      updateJson(root, PACKET_PATH, (value) => {
        value.officialReferences = value.officialReferences.filter(
          (reference) => reference.id !== 'github-actions-secrets',
        );
      });
    },
  },
  {
    name: 'reference-url-drift-fails',
    expectedCode: 1,
    expectedText: 'reference_url_mismatch',
    mutate(root) {
      updateJson(root, PACKET_PATH, (value) => {
        value.officialReferences[0].url = 'https://docs.stripe.com/payments';
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
          id: 'unreviewed-live-proof-source',
          label: 'Unreviewed live proof source',
          url: 'https://example.com/live-proof',
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
      if (!audit.sourceBoundary.includes('does not prove live checkout')) {
        throw new Error('written audit did not preserve live proof source boundary');
      }
      const supabase = audit.sources.find((source) => source.id === 'supabase-edge-function-secrets');
      if (!supabase?.appliesTo?.includes('real_stripe_test_checkout')) {
        throw new Error('written audit did not preserve Supabase appliesTo source mapping');
      }
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText, testCase.inspect);
}

console.log(`Live proof run packet source-audit fixture verification passed: ${cases.length} cases.`);
