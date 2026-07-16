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

const DRILL_PATH = 'docs/commercialization/owner-evidence-completion-drill-latest.json';
const OUTPUT_PATH = 'docs/commercialization/owner-evidence-completion-drill-source-audit-latest.json';
const LAST_ATTEMPT_PATH =
  'docs/commercialization/owner-evidence-completion-drill-source-audit-last-attempt.json';
const REQUEST_TIMEOUT_MS = 20_000;

const expectedReferences = [
  {
    packetType: 'live_proof_run',
    id: 'stripe-test-mode',
    url: 'https://docs.stripe.com/test-mode',
  },
  {
    packetType: 'live_proof_run',
    id: 'stripe-api-keys',
    url: 'https://docs.stripe.com/keys',
  },
  {
    packetType: 'live_proof_run',
    id: 'stripe-key-best-practices',
    url: 'https://docs.stripe.com/keys-best-practices',
  },
  {
    packetType: 'live_proof_run',
    id: 'pci-dss-v4-0-1',
    url: 'https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1',
  },
  {
    packetType: 'live_proof_run',
    id: 'supabase-edge-function-secrets',
    url: 'https://supabase.com/docs/guides/functions/secrets',
  },
  {
    packetType: 'live_proof_run',
    id: 'github-actions-secrets',
    url: 'https://docs.github.com/en/actions/concepts/security/secrets',
  },
  {
    packetType: 'commercial_evidence_intake',
    id: 'ftc-consumer-reviews-rule-questions',
    url: 'https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers',
  },
  {
    packetType: 'commercial_evidence_intake',
    id: 'ftc-endorsements-reviews',
    url: 'https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews',
  },
  {
    packetType: 'commercial_evidence_intake',
    id: 'ftc-endorsement-guides-faq',
    url: 'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking',
  },
  {
    packetType: 'commercial_evidence_intake',
    id: 'ftc-review-solicitation-guide',
    url: 'https://www.ftc.gov/business-guidance/resources/soliciting-paying-online-reviews-guide-marketers',
  },
  {
    packetType: 'manual_wcag_review',
    id: 'wcag22',
    url: 'https://www.w3.org/TR/WCAG22/',
  },
  {
    packetType: 'manual_wcag_review',
    id: 'wcag-em-overview',
    url: 'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/',
  },
  {
    packetType: 'manual_wcag_review',
    id: 'wcag-em-2',
    url: 'https://www.w3.org/TR/wcag-em-2/',
  },
  {
    packetType: 'manual_wcag_review',
    id: 'wcag-em-report-tool',
    url: 'https://www.w3.org/WAI/eval/report-tool/',
  },
  {
    packetType: 'manual_wcag_review',
    id: 'wai-easy-checks',
    url: 'https://www.w3.org/WAI/test-evaluate/preliminary/',
  },
  {
    packetType: 'manual_wcag_review',
    id: 'wai-aria-apg',
    url: 'https://www.w3.org/WAI/ARIA/apg/',
  },
  {
    packetType: 'manual_wcag_review',
    id: 'wcag2ict-22',
    url: 'https://www.w3.org/TR/wcag2ict-22/',
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

function referenceKey(reference) {
  return `${reference.packetType}:${reference.id}`;
}

function collectReferences(drill) {
  const references = [];
  for (const packet of drill.packetSummaries || []) {
    const ids = packet.officialReferenceIds || [];
    const urls = packet.officialReferenceUrls || [];
    ids.forEach((id, index) => {
      references.push({
        packetType: packet.packetType,
        packetLabel: packet.label || packet.packetType,
        id,
        url: urls[index] || null,
      });
    });
  }
  return references;
}

async function fetchSource(url, expectations) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
      'user-agent': 'CareerAutomationInsightsEngine/1.0 owner evidence completion drill source verifier',
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
  const drill = readJson(DRILL_PATH);
  const references = collectReferences(drill);
  const referenceByKey = new Map(references.map((reference) => [referenceKey(reference), reference]));
  const expectedByKey = new Map(expectedReferences.map((reference) => [referenceKey(reference), reference]));
  const sources = [];

  for (const expectedReference of expectedReferences) {
    const reference = referenceByKey.get(referenceKey(expectedReference));
    const url = reference?.url || expectedReference.url;
    const expectations = sourceExpectations[expectedReference.url] || [];
    const missingReference = !reference;
    const urlMismatch = reference && reference.url !== expectedReference.url;
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
      key: referenceKey(expectedReference),
      packetType: expectedReference.packetType,
      packetLabel: reference?.packetLabel || null,
      id: expectedReference.id,
      url,
      expectedUrl: expectedReference.url,
      expectedEvidenceCount: expectations.length,
      fetch: fetchResult,
      status,
      passed,
    });
  }

  const unexpectedReferences = references
    .filter((reference) => !expectedByKey.has(referenceKey(reference)))
    .map((reference) => ({
      key: referenceKey(reference),
      packetType: reference.packetType,
      id: reference.id,
      url: reference.url,
    }));
  const expectedUrls = expectedReferences.map((reference) => reference.url).sort((a, b) => a.localeCompare(b));
  const topLevelUrls = [...(drill.officialReferenceUrls || [])].sort((a, b) => a.localeCompare(b));
  const topLevelUrlMismatch = JSON.stringify(expectedUrls) !== JSON.stringify(topLevelUrls);
  const failedSources = sources.filter((source) => !source.passed);
  const packetReferenceCounts = sources.reduce((counts, source) => {
    counts[source.packetType] = (counts[source.packetType] || 0) + 1;
    return counts;
  }, {});

  return {
    schemaVersion: '2026-06-05.apo-owner-evidence-completion-drill-source-audit.v1',
    generatedAt: new Date().toISOString(),
    drillPath: DRILL_PATH,
    networkFetch: shouldFetch,
    sourceBoundary:
      'This audit proves only that the owner-evidence completion drill official reference URLs are present and, when fetched, match expected official-page text at verification time. It does not prove owner-held evidence, live checkout, live MRR, partner commitments, documented outcomes, manual WCAG conformance, legal compliance, production state, or commercial readiness.',
    allPassed: failedSources.length === 0 && unexpectedReferences.length === 0 && !topLevelUrlMismatch,
    sourceCount: sources.length,
    passedCount: sources.length - failedSources.length,
    failedCount: failedSources.length,
    missingExpectationCount: sources.filter((source) => source.status === 'missing_expectation').length,
    unexpectedReferenceCount: unexpectedReferences.length,
    topLevelUrlMismatch,
    failedSourceKeys: failedSources.map((source) => source.key),
    unexpectedReferences,
    packetTypes: [...new Set(sources.map((source) => source.packetType))],
    packetReferenceCounts,
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
        topLevelUrlMismatch: artifact.topLevelUrlMismatch,
        failedSourceKeys: artifact.failedSourceKeys,
        wrote,
      },
      null,
      2,
    ),
  );

  if (!artifact.allPassed) process.exitCode = 1;
}

await main();
