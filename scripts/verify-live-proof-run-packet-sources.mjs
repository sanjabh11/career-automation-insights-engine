#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = process.argv.slice(2);

function readFlagValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const root = path.resolve(readFlagValue('--root', path.resolve(__dirname, '..')));

const PACKET_PATH = 'docs/commercialization/live-proof-run-packet-latest.json';
const OUTPUT_PATH = 'docs/commercialization/live-proof-run-packet-source-audit-latest.json';
const LAST_ATTEMPT_PATH =
  'docs/commercialization/live-proof-run-packet-source-audit-last-attempt.json';
const REQUEST_TIMEOUT_MS = 20_000;

const requiredReferences = [
  {
    id: 'stripe-test-mode',
    url: 'https://docs.stripe.com/test-mode',
  },
  {
    id: 'stripe-api-keys',
    url: 'https://docs.stripe.com/keys',
  },
  {
    id: 'stripe-key-best-practices',
    url: 'https://docs.stripe.com/keys-best-practices',
  },
  {
    id: 'pci-dss-v4-0-1',
    url: 'https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1',
  },
  {
    id: 'supabase-edge-function-secrets',
    url: 'https://supabase.com/docs/guides/functions/secrets',
  },
  {
    id: 'github-actions-secrets',
    url: 'https://docs.github.com/en/actions/concepts/security/secrets',
  },
];

const sourceExpectations = {
  'https://docs.stripe.com/test-mode': [
    { label: 'Stripe testing use cases and sandboxes', pattern: /Testing use cases|Testing environments|Sandboxes/i },
    { label: 'sandbox does not affect live payments', pattern: /without affecting.*live|without making actual charges|without processing actual payments/i },
  ],
  'https://docs.stripe.com/keys': [
    { label: 'Stripe API keys reference', pattern: /API keys|Use API keys to authenticate API requests/i },
    { label: 'test and live key mode boundary', pattern: /sandbox.*keys|live mode keys|pk_test_|sk_live_/i },
  ],
  'https://docs.stripe.com/keys-best-practices': [
    { label: 'Stripe secret API key best practices', pattern: /Best practices for managing secret API keys/i },
    { label: 'do not store keys in source code', pattern: /Never put secret API keys in source code|environment variables|secrets vault/i },
  ],
  'https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1': [
    { label: 'PCI DSS v4.0.1 publication title', pattern: /Just Published: PCI DSS v4\.0\.1|PCI DSS v4\.0\.1/i },
    { label: 'PCI DSS active-version boundary', pattern: /only active version of the standard|31 December 2024|31 March 2025 effective date/i },
  ],
  'https://supabase.com/docs/guides/functions/secrets': [
    { label: 'Supabase Edge Function environment variables', pattern: /Environment Variables|Manage sensitive data securely/i },
    { label: 'Supabase local env files are not checked into git', pattern: /Never check your `.env` files into Git|supabase functions serve --env-file/i },
  ],
  'https://docs.github.com/en/actions/concepts/security/secrets': [
    { label: 'GitHub Actions secrets concept', pattern: /Secrets allow you to store sensitive information/i },
    { label: 'GitHub Actions secret access and permissions', pattern: /explicitly include the secret|minimum permissions|automatically redacts/i },
  ],
};

function hasFlag(name) {
  return args.includes(name);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function readJsonIfExists(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function normalizeForEvidence(value) {
  return value
    .replace(/&rsquo;|&#8217;|&#x2019;/gi, "'")
    .replace(/&ldquo;|&#8220;|&#x201c;/gi, '"')
    .replace(/&rdquo;|&#8221;|&#x201d;/gi, '"')
    .replace(/&ndash;|&#8211;|&#x2013;/gi, '-')
    .replace(/&mdash;|&#8212;|&#x2014;/gi, '-')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function collectReferences(packet) {
  const references = Array.isArray(packet.officialReferences) ? packet.officialReferences : [];
  return references.map((reference) => ({
    id: reference.id,
    label: reference.label,
    url: reference.url,
    appliesTo: reference.appliesTo || [],
  }));
}

async function fetchSource(url, expectations) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
      'user-agent': 'CareerAutomationInsightsEngine/1.0 live proof run packet source verifier',
    },
  });
  const body = await response.text();
  const normalizedBody = normalizeForEvidence(body);
  const evidence = expectations.map((expectation) => ({
    label: expectation.label,
    matched: expectation.pattern.test(normalizedBody),
  }));

  return {
    attempted: true,
    finalUrl: response.url,
    status: response.status,
    ok: response.ok,
    contentSha256: sha256(body),
    byteLength: Buffer.byteLength(body),
    evidence,
    passed: response.ok && evidence.every((item) => item.matched),
  };
}

function networkWideFetchFailure(sources) {
  const attempted = sources.filter((item) => item.fetch?.attempted);
  return (
    attempted.length > 0 &&
    attempted.every((item) =>
      item.passed === false &&
      typeof item.fetch.error === 'string' &&
      /fetch failed|getaddrinfo|ENOTFOUND|EAI_AGAIN|network|timeout/i.test(item.fetch.error)
    )
  );
}

function writeJson(relativePath, artifact) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(`${absolutePath}.tmp`, `${JSON.stringify(artifact, null, 2)}\n`);
  fs.renameSync(`${absolutePath}.tmp`, absolutePath);
}

async function buildArtifact() {
  const shouldFetch = hasFlag('--fetch');
  const packet = readJson(PACKET_PATH);
  const references = collectReferences(packet);
  const referenceById = new Map(references.map((reference) => [reference.id, reference]));
  const sources = [];

  for (const requiredReference of requiredReferences) {
    const reference = referenceById.get(requiredReference.id);
    const url = reference?.url || requiredReference.url;
    const expectations = sourceExpectations[requiredReference.url] || [];
    const missingReference = !reference;
    const urlMismatch = reference && reference.url !== requiredReference.url;
    const missingExpectation = expectations.length === 0;
    let fetchResult = { attempted: false, passed: null };

    if (shouldFetch && !missingReference && !urlMismatch && !missingExpectation) {
      try {
        fetchResult = await fetchSource(url, expectations);
      } catch (error) {
        fetchResult = {
          attempted: true,
          finalUrl: null,
          status: null,
          ok: false,
          contentSha256: null,
          byteLength: 0,
          evidence: expectations.map((expectation) => ({
            label: expectation.label,
            matched: false,
          })),
          passed: false,
          error: error instanceof Error ? error.message : 'unknown error',
        };
      }
    }

    const passed =
      !missingReference &&
      !urlMismatch &&
      !missingExpectation &&
      (shouldFetch ? fetchResult.passed === true : true);
    const status = missingReference
      ? 'missing_required_reference'
      : urlMismatch
        ? 'reference_url_mismatch'
        : missingExpectation
          ? 'missing_expectation'
          : passed
            ? 'passed'
            : 'failed_fetch_or_pattern';

    sources.push({
      id: requiredReference.id,
      label: reference?.label || null,
      url,
      expectedUrl: requiredReference.url,
      appliesTo: reference?.appliesTo || [],
      expectedEvidenceCount: expectations.length,
      fetch: fetchResult,
      status,
      passed,
    });
  }

  const unexpectedReferences = references
    .filter((reference) => !requiredReferences.some((requiredReference) => requiredReference.id === reference.id))
    .map((reference) => ({ id: reference.id, url: reference.url }));
  const failedSources = sources.filter((source) => !source.passed);

  return {
    schemaVersion: '2026-06-05.apo-live-proof-run-packet-source-audit.v1',
    generatedAt: new Date().toISOString(),
    packetPath: PACKET_PATH,
    networkFetch: shouldFetch,
    sourceBoundary:
      'Live proof run packet source audit proves only that the owner live-proof worksheet official Stripe, PCI SSC, Supabase, and GitHub reference URLs were present and matched expected page text at verification time. It does not prove live checkout, live MRR, production calibration, authenticated live artifact persistence, credential validity, PCI DSS compliance, owner-held evidence completeness, production deployment, or commercial readiness.',
    allPassed: failedSources.length === 0 && unexpectedReferences.length === 0,
    sourceCount: sources.length,
    passedCount: sources.length - failedSources.length,
    failedCount: failedSources.length,
    missingExpectationCount: sources.filter((source) => source.status === 'missing_expectation').length,
    unexpectedReferenceCount: unexpectedReferences.length,
    failedSourceIds: failedSources.map((source) => source.id),
    unexpectedReferences,
    sources,
  };
}

async function main() {
  const shouldWrite = hasFlag('--write');
  const artifact = await buildArtifact();
  let wrote = null;

  if (shouldWrite) {
    if (networkWideFetchFailure(artifact.sources)) {
      writeJson(LAST_ATTEMPT_PATH, artifact);
      const existing = readJsonIfExists(OUTPUT_PATH);
      if (existing?.allPassed === true) {
        writeJson(OUTPUT_PATH, existing);
      } else {
        writeJson(OUTPUT_PATH, artifact);
      }
      wrote = [LAST_ATTEMPT_PATH, OUTPUT_PATH];
    } else {
      writeJson(OUTPUT_PATH, artifact);
      wrote = [OUTPUT_PATH];
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: artifact.allPassed,
        networkFetch: artifact.networkFetch,
        sourceCount: artifact.sourceCount,
        passedCount: artifact.passedCount,
        failedCount: artifact.failedCount,
        missingExpectationCount: artifact.missingExpectationCount,
        unexpectedReferenceCount: artifact.unexpectedReferenceCount,
        failedSourceIds: artifact.failedSourceIds,
        wrote,
      },
      null,
      2,
    ),
  );

  if (!artifact.allPassed) process.exitCode = 1;
}

await main();
