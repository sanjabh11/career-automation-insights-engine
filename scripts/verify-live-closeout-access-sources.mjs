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

const READINESS_PATH = 'docs/commercialization/live-closeout-readiness-latest.json';
const OUTPUT_PATH = 'docs/commercialization/live-closeout-access-source-audit-latest.json';
const LAST_ATTEMPT_PATH =
  'docs/commercialization/live-closeout-access-source-audit-last-attempt.json';
const REQUEST_TIMEOUT_MS = 20_000;

const requiredReferences = [
  {
    id: 'supabase-access-control',
    url: 'https://supabase.com/docs/guides/platform/access-control',
  },
  {
    id: 'supabase-cli-login',
    url: 'https://supabase.com/docs/reference/cli/supabase-login',
  },
  {
    id: 'supabase-functions-list',
    url: 'https://supabase.com/docs/reference/cli/supabase-functions-list',
  },
  {
    id: 'github-actions-secrets',
    url: 'https://docs.github.com/en/actions/concepts/security/secrets',
  },
];

const sourceExpectations = {
  'https://supabase.com/docs/guides/platform/access-control': [
    { label: 'Supabase access control reference', pattern: /Access Control|granular access controls/i },
    { label: 'Supabase roles and permissions', pattern: /Owner|Administrator|Developer|Read-Only|permissions/i },
  ],
  'https://supabase.com/docs/reference/cli/supabase-login': [
    { label: 'Supabase CLI login command', pattern: /supabase login|Log in to a Supabase account/i },
    { label: 'Supabase personal access token', pattern: /personal access token|SUPABASE_ACCESS_TOKEN/i },
  ],
  'https://supabase.com/docs/reference/cli/supabase-functions-list': [
    { label: 'Supabase functions list command', pattern: /supabase functions list|List all Functions/i },
    { label: 'Supabase project ref flag', pattern: /--project-ref|Project ref of the Supabase project/i },
  ],
  'https://docs.github.com/en/actions/concepts/security/secrets': [
    { label: 'GitHub Actions secrets concept', pattern: /Secrets allow you to store sensitive information/i },
    { label: 'GitHub secret redaction or access boundary', pattern: /automatically redacts|minimum permissions|workflow secrets/i },
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

function collectReferences(readiness) {
  const references = Array.isArray(readiness.officialReferences) ? readiness.officialReferences : [];
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
      'user-agent': 'CareerAutomationInsightsEngine/1.0 live closeout access source verifier',
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
  const readiness = readJson(READINESS_PATH);
  const references = collectReferences(readiness);
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
    schemaVersion: '2026-06-05.apo-live-closeout-access-source-audit.v1',
    generatedAt: new Date().toISOString(),
    readinessPath: READINESS_PATH,
    networkFetch: shouldFetch,
    sourceBoundary:
      'Live closeout access source audit proves only that the live closeout readiness artifact contains reviewed Supabase and GitHub official reference URLs and, when network fetch is enabled, that those pages matched expected access/secret-management text at verification time. It does not prove Supabase account access, functions API access, secret value validity, deployment completion, O*NET ingest completion, parse-resume deployment completion, live closeout, or commercial readiness.',
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
