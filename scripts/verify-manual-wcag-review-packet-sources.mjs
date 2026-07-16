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

const PACKET_PATH = 'docs/commercialization/manual-wcag-review-packet-latest.json';
const OUTPUT_PATH = 'docs/commercialization/manual-wcag-review-packet-source-audit-latest.json';
const LAST_ATTEMPT_PATH =
  'docs/commercialization/manual-wcag-review-packet-source-audit-last-attempt.json';
const REQUEST_TIMEOUT_MS = 20_000;

const requiredReferences = [
  {
    id: 'wcag22',
    url: 'https://www.w3.org/TR/WCAG22/',
  },
  {
    id: 'wcag-em-overview',
    url: 'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/',
  },
  {
    id: 'wcag-em-2',
    url: 'https://www.w3.org/TR/wcag-em-2/',
  },
  {
    id: 'wcag-em-report-tool',
    url: 'https://www.w3.org/WAI/eval/report-tool/',
  },
  {
    id: 'wai-easy-checks',
    url: 'https://www.w3.org/WAI/test-evaluate/preliminary/',
  },
  {
    id: 'wai-aria-apg',
    url: 'https://www.w3.org/WAI/ARIA/apg/',
  },
  {
    id: 'wcag2ict-22',
    url: 'https://www.w3.org/TR/wcag2ict-22/',
  },
];

const sourceExpectations = {
  'https://www.w3.org/TR/WCAG22/': [
    { label: 'WCAG 2.2 recommendation title', pattern: /Web Content Accessibility Guidelines \(WCAG\) 2\.2/i },
    { label: 'WCAG 2.2 conformance and testable criteria', pattern: /testable statements|Level A|Level AA|conformance/i },
  ],
  'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/': [
    { label: 'WCAG-EM overview title', pattern: /WCAG-EM Overview|Website Accessibility Conformance Evaluation Methodology/i },
    { label: 'WCAG-EM evaluation process', pattern: /define the scope|select a representative sample|report your evaluation findings/i },
  ],
  'https://www.w3.org/TR/wcag-em-2/': [
    { label: 'WCAG-EM 2.0 title', pattern: /W3C Accessibility Guidelines Evaluation Methodology \(WCAG-EM\) 2\.0|WCAG-EM 2\.0/i },
    { label: 'WCAG-EM 2.0 evaluation methodology', pattern: /evaluation methodology|sample set|digital product/i },
  ],
  'https://www.w3.org/WAI/eval/report-tool/': [
    { label: 'WCAG-EM Report Tool title', pattern: /WCAG-EM[-\s]Report[-\s]Tool/i },
    { label: 'W3C WAI tool stewardship evidence', pattern: /W3C\/WAI \(Project Lead\)|Accessibility Education and Outreach Working Group|EOWG/i },
    { label: 'current report tool version evidence', pattern: /Updated 12 May 2026|Version 3\.0\.3/i },
  ],
  'https://www.w3.org/WAI/test-evaluate/preliminary/': [
    { label: 'WAI Easy Checks first review', pattern: /Easy Checks.*First Review of Web Accessibility/i },
    { label: 'preliminary accessibility checks boundary', pattern: /not a complete evaluation|More robust assessment is needed|few accessibility issues/i },
  ],
  'https://www.w3.org/WAI/ARIA/apg/': [
    { label: 'ARIA Authoring Practices Guide', pattern: /ARIA Authoring Practices Guide/i },
    { label: 'ARIA patterns and keyboard support', pattern: /accessibility semantics|design patterns|keyboard support/i },
  ],
  'https://www.w3.org/TR/wcag2ict-22/': [
    { label: 'WCAG2ICT Group Note title', pattern: /Guidance on Applying WCAG 2 to Non-Web Information and Communications Technologies \(WCAG2ICT\)/i },
    { label: 'non-web documents and software guidance', pattern: /non-web documents and software/i },
    { label: 'informative guidance boundary', pattern: /informative guidance|not normative|does not set requirements/i },
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

function collectCheckpointIds(packet, referenceId, referenceUrl) {
  return (packet.checkpointReviewPlan || [])
    .filter((checkpoint) => {
      const standardRefs = checkpoint.standardRefs || [];
      const officialReferenceUrls = checkpoint.officialReferenceUrls || [];
      return standardRefs.includes(referenceId) || officialReferenceUrls.includes(referenceUrl);
    })
    .map((checkpoint) => checkpoint.checkpointId)
    .filter(Boolean);
}

function collectReferences(packet) {
  const references = Array.isArray(packet.officialReferences) ? packet.officialReferences : [];
  return references.map((reference) => ({
    id: reference.id,
    label: reference.label,
    url: reference.url,
    checkpointIds: collectCheckpointIds(packet, reference.id, reference.url),
  }));
}

async function fetchSource(url, expectations) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
      'user-agent': 'CareerAutomationInsightsEngine/1.0 manual WCAG review packet source verifier',
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
      checkpointIds: reference?.checkpointIds || [],
      expectedEvidenceCount: expectations.length,
      fetch: fetchResult,
      status,
      passed,
    });
  }

  const unexpectedReferences = references
    .filter((reference) => !requiredReferences.some((requiredReference) => requiredReference.id === reference.id))
    .map((reference) => ({
      id: reference.id,
      url: reference.url,
    }));
  const failedSources = sources.filter((source) => !source.passed);

  return {
    schemaVersion: '2026-06-05.apo-manual-wcag-review-packet-source-audit.v1',
    generatedAt: new Date().toISOString(),
    packetPath: PACKET_PATH,
    networkFetch: shouldFetch,
    sourceBoundary:
      'Manual WCAG review packet source audit proves only W3C/WAI official reference URL presence and expected page text at verification time. It does not prove manual review completion, WCAG conformance, legal compliance, procurement approval, assistive-technology coverage, or commercial readiness.',
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
