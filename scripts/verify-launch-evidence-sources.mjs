#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = process.argv.slice(2);

function readFlagValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const root = path.resolve(readFlagValue('--root', path.resolve(__dirname, '..')));

const LAUNCH_EVIDENCE_PATH = 'docs/commercialization/launch-evidence-latest.json';
const SOURCE_VERIFICATION_PATH = 'docs/commercialization/source-verification-latest.json';
const OUTPUT_PATH = 'docs/commercialization/launch-evidence-source-audit-latest.json';
const LAST_ATTEMPT_PATH = 'docs/commercialization/launch-evidence-source-audit-last-attempt.json';
const REQUEST_TIMEOUT_MS = 20_000;

const sourceExpectations = {
  'https://docs.stripe.com/api/checkout/sessions': [
    { label: 'Stripe Checkout Sessions API reference', pattern: /Checkout Sessions|Stripe API Reference/i },
    { label: 'checkout session object or create endpoint', pattern: /Checkout Session|Create a Checkout Session|Session object/i },
  ],
  'https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1': [
    { label: 'PCI DSS v4.0.1 publication title', pattern: /Just Published: PCI DSS v4\.0\.1|PCI DSS v4\.0\.1/i },
    { label: 'PCI DSS active-version boundary', pattern: /only active version of the standard|31 December 2024|31 March 2025 effective date/i },
  ],
  'https://owasp.org/API-Security/editions/2023/en/0x11-t10/': [
    { label: 'OWASP API Security Top 10 2023', pattern: /OWASP Top 10 API Security Risks|OWASP API Security Top 10/i },
    { label: 'unsafe consumption API risk evidence', pattern: /API10:2023 Unsafe Consumption of APIs|Unsafe Consumption of APIs/i },
  ],
  'https://csrc.nist.gov/pubs/sp/800/218/final': [
    { label: 'NIST SSDF title', pattern: /Secure Software Development Framework \(SSDF\) Version 1\.1/i },
    { label: 'secure development practices evidence', pattern: /secure software development practices|software purchasers and consumers|supplier/i },
  ],
  'https://www.cisa.gov/news-events/news/applying-secure-design-thinking-events-news': [
    { label: 'CISA Secure by Design guide reference', pattern: /Shifting the Balance of Cybersecurity Risk|Secure by Design Software/i },
    { label: 'Secure by Design principles evidence', pattern: /Take Ownership of Customer Security Outcomes|Embrace Radical Transparency and Accountability|Lead From the Top/i },
  ],
  'https://owasp.org/www-project-application-security-verification-standard/': [
    { label: 'OWASP ASVS title', pattern: /Application Security Verification Standard \(ASVS\)/i },
    { label: 'ASVS 5.0.0 current stable evidence', pattern: /latest stable version of the ASVS \(5\.0\.0\)|ASVS Version 5\.0\.0 is released/i },
  ],
  'https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/': [
    { label: 'OWASP LLM Top 10 2025 title', pattern: /OWASP Top 10 for LLM Applications 2025/i },
    { label: 'AI application risk evidence', pattern: /security issues specific to AI applications|associated risks|LLMs are embedded/i },
  ],
  'https://www.eeoc.gov/laws/guidance/employment-tests-and-selection-procedures': [
    { label: 'EEOC employment tests and selection procedures', pattern: /Employment Tests and Selection Procedures/i },
    { label: 'selection procedure adverse-impact boundary', pattern: /disparate impact|selection procedures|job-related and consistent with business necessity/i },
  ],
  'https://www.dol.gov/index.php/newsroom/releases/osec/osec20241016': [
    { label: 'DOL AI Best Practices roadmap', pattern: /AI Best Practices roadmap|AI Best Practices/i },
    { label: 'worker-centered AI governance evidence', pattern: /meaningful human oversight|Protecting workers.*rights|Securing and protecting worker data/i },
  ],
  'https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers': [
    { label: 'FTC Consumer Reviews and Testimonials Rule Q&A', pattern: /Consumer Reviews and Testimonials Rule/i },
    { label: 'fake or deceptive reviews/testimonials boundary', pattern: /fake, false, or otherwise deceptive reviews and testimonials|fake or false consumer reviews/i },
  ],
  'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking': [
    { label: 'FTC Endorsement Guides FAQ', pattern: /Endorsement Guides: What People Are Asking|Endorsement Guides/i },
    { label: 'material connection disclosure guidance', pattern: /material connection|clear and conspicuous/i },
  ],
  'https://www.naceweb.org/career-readiness/competencies/career-readiness-defined': [
    { label: 'NACE career readiness definition', pattern: /Career readiness is a foundation/i },
    { label: 'lifelong career management evidence', pattern: /lifelong career management/i },
  ],
  'https://www.nist.gov/itl/ai-risk-management-framework': [
    { label: 'NIST AI Risk Management Framework', pattern: /AI Risk Management Framework/i },
    { label: 'NIST source evidence', pattern: /National Institute of Standards and Technology|NIST/i },
  ],
  'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence': [
    { label: 'NIST AI RMF Generative AI Profile', pattern: /Generative Artificial Intelligence Profile/i },
    { label: 'NIST AI 600-1 evidence', pattern: /NIST Trustworthy and Responsible AI\s*-\s*600-1|Report Number\s+600-1|NIST\.AI\.600-1/i },
  ],
  'https://www.onetcenter.org/database.html': [
    { label: 'O*NET Database page', pattern: /O\*NET Database/i },
    { label: 'occupation descriptor evidence', pattern: /standardized and occupation-specific descriptors|occupations covering the entire U\.S\. economy/i },
  ],
  'https://www.w3.org/TR/WCAG22/': [
    { label: 'WCAG 2.2 title', pattern: /Web Content Accessibility Guidelines \(WCAG\) 2\.2/i },
    { label: 'conformance levels evidence', pattern: /Level A|Level AA|three levels of conformance/i },
  ],
  'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/': [
    { label: 'WCAG-EM overview title', pattern: /WCAG-EM Overview|Website Accessibility Conformance Evaluation Methodology/i },
    { label: 'WCAG-EM evaluation process', pattern: /define the scope|select a representative sample|report your evaluation findings/i },
  ],
  'https://www.w3.org/TR/wcag-em-2/': [
    { label: 'WCAG-EM 2.0 title', pattern: /W3C Accessibility Guidelines Evaluation Methodology \(WCAG-EM\) 2\.0|WCAG-EM 2\.0/i },
    { label: 'digital product evaluation evidence', pattern: /digital products|sample set|accessibility support baseline/i },
  ],
  'https://www.w3.org/WAI/eval/report-tool/': [
    { label: 'WCAG-EM Report Tool title', pattern: /WCAG-EM[-\s]Report[-\s]Tool/i },
    { label: 'W3C WAI tool stewardship evidence', pattern: /W3C\/WAI \(Project Lead\)|Accessibility Education and Outreach Working Group|EOWG/i },
    { label: 'current report tool version evidence', pattern: /Updated 12 May 2026|Version 3\.0\.3/i },
  ],
  'https://www.weforum.org/publications/the-future-of-jobs-report-2025/': [
    { label: 'Future of Jobs Report 2025 title', pattern: /Future of Jobs Report 2025/i },
    { label: 'World Economic Forum source', pattern: /World Economic Forum|weforum/i },
  ],
  'https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/2-jobs-outlook/': [
    { label: 'Future of Jobs 2025 jobs outlook chapter', pattern: /2\. Jobs outlook|Jobs outlook/i },
    { label: 'World Economic Forum source', pattern: /Future of Jobs Report 2025|World Economic Forum/i },
  ],
  'https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/4-workforce-strategies/': [
    { label: 'Future of Jobs 2025 workforce strategies chapter', pattern: /4\. Workforce strategies|Workforce strategies/i },
    { label: 'World Economic Forum source', pattern: /Future of Jobs Report 2025|World Economic Forum/i },
  ],
  'https://www.workera.ai/product-overview': [
    { label: 'Workera product overview', pattern: /Workera|Elo|Skills Intelligence/i },
    { label: 'verified skills or workforce capability evidence', pattern: /verified skills|workforce capabilities|AI Skills Agent|skills verification/i },
  ],
  'https://lightcast.io/open-skills': [
    { label: 'Lightcast Skills Taxonomy', pattern: /Lightcast Skills Taxonomy|Global Standard in Skills/i },
    { label: 'skills taxonomy evidence', pattern: /34,000\+ skills|33,000 skills|machine-readable identifier|job postings and profiles/i },
  ],
  'https://github.com/CareerOneStop/API-Overview': [
    { label: 'CareerOneStop API overview', pattern: /CareerOneStop|API Documentation/i },
    { label: 'web API services evidence', pattern: /Web API Services|career, employment, and education data|quality-controlled data/i },
  ],
};

function hasFlag(name) {
  return process.argv.includes(name);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function readJsonIfExists(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function normalizeForEvidence(value) {
  return value
    .replace(/&ndash;|&#8211;|&#x2013;/gi, '-')
    .replace(/&mdash;|&#8212;|&#x2014;/gi, '-')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function collectSourceUsage(launchEvidence) {
  const sourceUsage = new Map();
  const ensureUsage = (url) => {
    if (!sourceUsage.has(url)) {
      sourceUsage.set(url, {
        url,
        painPointRanks: [],
        painPointLabels: [],
        competitorRanks: [],
        competitorLabels: [],
        crmRowRanks: [],
        crmRowLabels: [],
        usageContexts: [],
      });
    }
    return sourceUsage.get(url);
  };

  for (const painPoint of launchEvidence.pain_points || []) {
    for (const url of painPoint.source_evidence || []) {
      const usage = ensureUsage(url);
      usage.painPointRanks.push(painPoint.rank);
      usage.painPointLabels.push(painPoint.pain_point);
      usage.usageContexts.push(`pain_point:${painPoint.rank}`);
    }
  }

  for (const competitor of launchEvidence.competitor_substitutes || []) {
    for (const url of competitor.source_evidence || []) {
      const usage = ensureUsage(url);
      usage.competitorRanks.push(competitor.rank);
      usage.competitorLabels.push(competitor.name);
      usage.usageContexts.push(`competitor_substitute:${competitor.rank}`);
    }
  }

  for (const [index, row] of (launchEvidence.outreach_plan?.crm_export?.rows || []).entries()) {
    const url = row.website;
    if (!/^https?:\/\//.test(url || '')) continue;
    const usage = ensureUsage(url);
    usage.crmRowRanks.push(index + 1);
    usage.crmRowLabels.push(row.account_name);
    usage.usageContexts.push(`crm_export:${index + 1}`);
  }

  return [...sourceUsage.values()].sort((a, b) => a.url.localeCompare(b.url));
}

function sourceVerificationFor(sourceVerification, url) {
  const result = (sourceVerification?.results || []).find((item) => item.url === url);
  if (!result) {
    return {
      covered: false,
      allPassed: sourceVerification?.allPassed ?? null,
      generatedAt: sourceVerification?.generatedAt || null,
      id: null,
      label: null,
      passed: null,
    };
  }

  return {
    covered: true,
    allPassed: sourceVerification?.allPassed ?? null,
    generatedAt: sourceVerification?.generatedAt || null,
    id: result.id,
    label: result.label,
    passed: result.passed === true,
    status: result.status,
  };
}

async function fetchSource(url, expectations) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'user-agent': 'CareerAutomationInsightsEngine/1.0 launch evidence source verifier',
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
  const launchEvidence = readJson(LAUNCH_EVIDENCE_PATH);
  const sourceVerification = readJsonIfExists(SOURCE_VERIFICATION_PATH);
  const usages = collectSourceUsage(launchEvidence);
  const sources = [];

  for (const usage of usages) {
    const expectations = sourceExpectations[usage.url] || [];
    const sourceVerificationMatch = sourceVerificationFor(sourceVerification, usage.url);
    let fetchResult = { attempted: false, passed: null };
    if (shouldFetch && expectations.length > 0) {
      try {
        fetchResult = await fetchSource(usage.url, expectations);
      } catch (error) {
        fetchResult = {
          attempted: true,
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

    const missingExpectation = expectations.length === 0;
    const passed = shouldFetch
      ? fetchResult.passed === true && !missingExpectation
      : sourceVerificationMatch.covered && sourceVerificationMatch.passed === true && !missingExpectation;
    const status = missingExpectation
      ? 'missing_expectation'
      : passed
        ? 'passed'
        : shouldFetch
          ? 'failed_fetch_or_pattern'
          : 'missing_or_failed_source_registry_match';

    sources.push({
      ...usage,
      expectedEvidenceCount: expectations.length,
      sourceVerification: sourceVerificationMatch,
      fetch: fetchResult,
      status,
      passed,
    });
  }

  const failedSources = sources.filter((source) => !source.passed);
  return {
    schemaVersion: '2026-06-04.apo-launch-evidence-source-audit.v1',
    generatedAt: new Date().toISOString(),
    launchEvidencePath: LAUNCH_EVIDENCE_PATH,
    sourceVerificationPath: SOURCE_VERIFICATION_PATH,
    networkFetch: shouldFetch,
    sourceBoundary:
      'This audit proves the launch evidence source URLs were reachable and matched expected source-page text at verification time. It does not prove buyer willingness to pay, customer outcomes, legal compliance, WCAG conformance, live revenue, partner commitments, or production runtime behavior.',
    allPassed: failedSources.length === 0,
    sourceCount: sources.length,
    passedCount: sources.length - failedSources.length,
    failedCount: failedSources.length,
    missingExpectationCount: sources.filter((source) => source.status === 'missing_expectation').length,
    failedSourceUrls: failedSources.map((source) => source.url),
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

  console.log(JSON.stringify({
    ok: artifact.allPassed,
    networkFetch: artifact.networkFetch,
    sourceCount: artifact.sourceCount,
    passedCount: artifact.passedCount,
    failedCount: artifact.failedCount,
    missingExpectationCount: artifact.missingExpectationCount,
    failedSourceUrls: artifact.failedSourceUrls,
    wrote,
  }, null, 2));

  if (!artifact.allPassed) process.exitCode = 1;
}

await main();
