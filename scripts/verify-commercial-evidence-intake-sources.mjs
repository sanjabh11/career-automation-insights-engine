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

const PACKET_PATH = 'docs/commercialization/commercial-evidence-intake-packet-latest.json';
const OUTPUT_PATH = 'docs/commercialization/commercial-evidence-intake-source-audit-latest.json';
const LAST_ATTEMPT_PATH = 'docs/commercialization/commercial-evidence-intake-source-audit-last-attempt.json';
const REQUEST_TIMEOUT_MS = 20_000;

const sourceExpectations = {
  'https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers': [
    { label: 'FTC Consumer Reviews and Testimonials Rule Q&A', pattern: /Consumer Reviews and Testimonials Rule/i },
    { label: 'fake or deceptive reviews/testimonials boundary', pattern: /fake, false, or otherwise deceptive reviews and testimonials|fake or false consumer reviews/i },
  ],
  'https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews': [
    { label: 'FTC endorsements and reviews hub', pattern: /Endorsements, Influencers, and Reviews/i },
    { label: 'Endorsement Guides and Consumer Reviews Rule coverage', pattern: /Endorsement Guides|Rule on the Use of Consumer Reviews and Testimonials/i },
  ],
  'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking': [
    { label: 'FTC Endorsement Guides FAQ', pattern: /Endorsement Guides: What People Are Asking/i },
    { label: 'material connection disclosure guidance', pattern: /material connection|clear and conspicuous/i },
  ],
  'https://www.ftc.gov/business-guidance/resources/soliciting-paying-online-reviews-guide-marketers': [
    { label: 'FTC soliciting and paying for online reviews guide', pattern: /Soliciting and Paying for Online Reviews/i },
    { label: 'review solicitation integrity guidance', pattern: /Don.t ask for reviews from people who haven.t used|incentivized reviews|positive ones/i },
  ],
};

const requiredReferences = [
  {
    id: 'ftc-consumer-reviews-rule-questions',
    url: 'https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers',
  },
  {
    id: 'ftc-endorsements-reviews',
    url: 'https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews',
  },
  {
    id: 'ftc-endorsement-guides-faq',
    url: 'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking',
  },
  {
    id: 'ftc-review-solicitation-guide',
    url: 'https://www.ftc.gov/business-guidance/resources/soliciting-paying-online-reviews-guide-marketers',
  },
];

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
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'user-agent': 'CareerAutomationInsightsEngine/1.0 commercial evidence source verifier',
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
    const expectations = sourceExpectations[url] || [];
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
    schemaVersion: '2026-06-05.apo-commercial-evidence-intake-source-audit.v1',
    generatedAt: new Date().toISOString(),
    packetPath: PACKET_PATH,
    networkFetch: shouldFetch,
    sourceBoundary:
      'This audit proves only that the commercial evidence intake packet official FTC reference URLs were present and matched expected page text at verification time. It does not prove partner commitments, documented outcomes, testimonial compliance, legal compliance, revenue, retention, causality, market-wide demand, or permission to cite.',
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
