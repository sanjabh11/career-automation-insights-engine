#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-launch-evidence-sources.mjs');

const LAUNCH_EVIDENCE_PATH = 'docs/commercialization/launch-evidence-latest.json';
const SOURCE_VERIFICATION_PATH = 'docs/commercialization/source-verification-latest.json';
const OUTPUT_PATH = 'docs/commercialization/launch-evidence-source-audit-latest.json';

const STRIPE_SOURCE = 'https://docs.stripe.com/api/checkout/sessions';
const PCI_DSS_SOURCE = 'https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1';
const WCAG_SOURCE = 'https://www.w3.org/TR/WCAG22/';
const WCAG_EM_OVERVIEW_SOURCE = 'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/';
const WCAG_EM_2_SOURCE = 'https://www.w3.org/TR/wcag-em-2/';
const WCAG_EM_REPORT_TOOL_SOURCE = 'https://www.w3.org/WAI/eval/report-tool/';
const WORKERA_SOURCE = 'https://www.workera.ai/product-overview';
const CAREERONESTOP_SOURCE = 'https://github.com/CareerOneStop/API-Overview';
const NIST_GENAI_SOURCE =
  'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence';
const NIST_SSDF_SOURCE = 'https://csrc.nist.gov/pubs/sp/800/218/final';
const CISA_SECURE_BY_DESIGN_SOURCE =
  'https://www.cisa.gov/news-events/news/applying-secure-design-thinking-events-news';
const OWASP_ASVS_SOURCE = 'https://owasp.org/www-project-application-security-verification-standard/';
const OWASP_LLM_TOP_10_SOURCE =
  'https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/';
const DOL_AI_WORKER_WELLBEING_SOURCE = 'https://www.dol.gov/index.php/newsroom/releases/osec/osec20241016';
const FTC_REVIEWS_RULE_SOURCE =
  'https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers';
const FTC_ENDORSEMENT_GUIDES_SOURCE =
  'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking';
const UNKNOWN_SOURCE = 'https://example.com/uncovered-market-source';

function launchEvidence(overrides = {}) {
  return {
    pain_points: [
      {
        rank: 1,
        pain_point: 'Buyer needs payment proof before procurement.',
        source_evidence: [
          STRIPE_SOURCE,
          PCI_DSS_SOURCE,
          NIST_GENAI_SOURCE,
          NIST_SSDF_SOURCE,
          CISA_SECURE_BY_DESIGN_SOURCE,
          OWASP_ASVS_SOURCE,
          OWASP_LLM_TOP_10_SOURCE,
          DOL_AI_WORKER_WELLBEING_SOURCE,
          WCAG_SOURCE,
          WCAG_EM_OVERVIEW_SOURCE,
          WCAG_EM_2_SOURCE,
          WCAG_EM_REPORT_TOOL_SOURCE,
          FTC_REVIEWS_RULE_SOURCE,
          FTC_ENDORSEMENT_GUIDES_SOURCE,
        ],
      },
    ],
    competitor_substitutes: [
      {
        rank: 1,
        name: 'Workera',
        source_evidence: [WORKERA_SOURCE],
      },
    ],
    outreach_plan: {
      crm_export: {
        rows: [
          {
            account_name: 'CareerOneStop',
            website: CAREERONESTOP_SOURCE,
          },
        ],
      },
    },
    ...overrides,
  };
}

function sourceResult(url, id, label, overrides = {}) {
  return {
    id,
    label,
    url,
    status: 200,
    ok: true,
    passed: true,
    ...overrides,
  };
}

function sourceVerification(results = baseSourceResults()) {
  return {
    generatedAt: '2026-06-05T00:00:00.000Z',
    manifestSource: 'fixture',
    allPassed: results.every((result) => result.passed === true),
    results,
  };
}

function baseSourceResults() {
  return [
    sourceResult(STRIPE_SOURCE, 'stripe-checkout-sessions', 'Stripe Checkout Sessions API reference'),
    sourceResult(PCI_DSS_SOURCE, 'pci-dss-v4-0-1', 'PCI DSS v4.0.1 publication notice'),
    sourceResult(WORKERA_SOURCE, 'workera-product-overview', 'Workera product overview'),
    sourceResult(CAREERONESTOP_SOURCE, 'careeronestop-api-overview', 'CareerOneStop API overview'),
    sourceResult(NIST_GENAI_SOURCE, 'nist-ai-genai-profile', 'NIST AI RMF Generative Artificial Intelligence Profile'),
    sourceResult(NIST_SSDF_SOURCE, 'nist-ssdf', 'NIST Secure Software Development Framework'),
    sourceResult(CISA_SECURE_BY_DESIGN_SOURCE, 'cisa-secure-by-design', 'CISA Secure by Design principles'),
    sourceResult(OWASP_ASVS_SOURCE, 'owasp-asvs-5', 'OWASP Application Security Verification Standard'),
    sourceResult(OWASP_LLM_TOP_10_SOURCE, 'owasp-llm-top-10-2025', 'OWASP Top 10 for LLM Applications 2025'),
    sourceResult(
      DOL_AI_WORKER_WELLBEING_SOURCE,
      'dol-ai-worker-wellbeing-best-practices',
      'DOL AI Worker Well-being best practices',
    ),
    sourceResult(WCAG_SOURCE, 'wcag-22', 'WCAG 2.2 accessibility standard'),
    sourceResult(
      WCAG_EM_OVERVIEW_SOURCE,
      'wcag-em-overview',
      'WCAG-EM conformance evaluation overview',
    ),
    sourceResult(WCAG_EM_2_SOURCE, 'wcag-em-2', 'WCAG-EM 2.0 digital-product evaluation draft'),
    sourceResult(WCAG_EM_REPORT_TOOL_SOURCE, 'wcag-em-report-tool', 'WCAG-EM Report Tool'),
    sourceResult(
      FTC_REVIEWS_RULE_SOURCE,
      'ftc-consumer-reviews-rule-questions',
      'FTC Consumer Reviews and Testimonials Rule questions',
    ),
    sourceResult(
      FTC_ENDORSEMENT_GUIDES_SOURCE,
      'ftc-endorsement-guides-faq',
      "FTC Endorsement Guides: What People Are Asking",
    ),
  ];
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
  writeJson(root, LAUNCH_EVIDENCE_PATH, launchEvidence());
  writeJson(root, SOURCE_VERIFICATION_PATH, sourceVerification());
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-launch-source-audit-${name}-`));
  try {
    writeBaseArtifacts(root);
    mutate(root);
    const result = runVerifier(root);
    const outputPath = path.join(root, OUTPUT_PATH);
    const auditText = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
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
    name: 'aligned-launch-evidence-source-audit-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
    inspect(root) {
      const audit = readJson(root, OUTPUT_PATH);
      if (audit.sourceCount !== 16 || audit.passedCount !== 16 || audit.failedCount !== 0) {
        throw new Error(`aligned audit counts drifted: ${JSON.stringify(audit)}`);
      }
      const workera = audit.sources.find((source) => source.url === WORKERA_SOURCE);
      const crm = audit.sources.find((source) => source.url === CAREERONESTOP_SOURCE);
      if (!workera?.competitorRanks?.includes(1) || !workera?.competitorLabels?.includes('Workera')) {
        throw new Error('aligned audit did not capture competitor source usage');
      }
      if (!crm?.crmRowRanks?.includes(1) || !crm?.crmRowLabels?.includes('CareerOneStop')) {
        throw new Error('aligned audit did not capture CRM source usage');
      }
    },
  },
  {
    name: 'missing-source-registry-match-fails',
    expectedCode: 1,
    expectedText: 'missing_or_failed_source_registry_match',
    mutate(root) {
      updateJson(root, SOURCE_VERIFICATION_PATH, (value) => {
        value.results = value.results.filter((result) => result.url !== WORKERA_SOURCE);
      });
    },
  },
  {
    name: 'failed-source-registry-match-fails',
    expectedCode: 1,
    expectedText: 'missing_or_failed_source_registry_match',
    mutate(root) {
      updateJson(root, SOURCE_VERIFICATION_PATH, (value) => {
        const target = value.results.find((result) => result.url === STRIPE_SOURCE);
        target.passed = false;
        target.status = 500;
        value.allPassed = false;
      });
    },
  },
  {
    name: 'missing-expectation-fails',
    expectedCode: 1,
    expectedText: 'missing_expectation',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.pain_points[0].source_evidence = [UNKNOWN_SOURCE];
      });
      updateJson(root, SOURCE_VERIFICATION_PATH, (value) => {
        value.results.push(sourceResult(UNKNOWN_SOURCE, 'unknown-source', 'Unknown market source'));
      });
    },
  },
  {
    name: 'crm-source-url-drift-fails',
    expectedCode: 1,
    expectedText: UNKNOWN_SOURCE,
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.outreach_plan.crm_export.rows[0].website = UNKNOWN_SOURCE;
      });
    },
  },
  {
    name: 'write-audit-artifact-captures-usage-contexts',
    expectedCode: 0,
    expectedText: 'usageContexts',
    mutate() {},
    inspect(root) {
      const audit = readJson(root, OUTPUT_PATH);
      const stripe = audit.sources.find((source) => source.url === STRIPE_SOURCE);
      const pci = audit.sources.find((source) => source.url === PCI_DSS_SOURCE);
      const nistGenai = audit.sources.find((source) => source.url === NIST_GENAI_SOURCE);
      const owaspLlm = audit.sources.find((source) => source.url === OWASP_LLM_TOP_10_SOURCE);
      if (!stripe?.usageContexts?.includes('pain_point:1')) {
        throw new Error('written audit did not preserve pain point usage context');
      }
      if (!pci?.usageContexts?.includes('pain_point:1')) {
        throw new Error('written audit did not preserve PCI DSS source usage context');
      }
      if (!nistGenai?.usageContexts?.includes('pain_point:1')) {
        throw new Error('written audit did not preserve NIST GenAI source usage context');
      }
      if (!owaspLlm?.usageContexts?.includes('pain_point:1')) {
        throw new Error('written audit did not preserve OWASP LLM source usage context');
      }
      if (audit.networkFetch !== false) {
        throw new Error('fixture verifier should exercise non-network source registry mode');
      }
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText, testCase.inspect);
}

console.log(`Launch evidence source-audit fixture verification passed: ${cases.length} cases.`);
