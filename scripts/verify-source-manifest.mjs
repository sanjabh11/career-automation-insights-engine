#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const MANIFEST_SOURCE = 'src/lib/sourceManifest.ts';
const OUTPUT_PATH = 'docs/commercialization/source-verification-latest.json';
const LAST_ATTEMPT_PATH = 'docs/commercialization/source-verification-last-attempt.json';
const REQUEST_TIMEOUT_MS = 20_000;
const execFileAsync = promisify(execFile);

const checks = [
  {
    id: 'onet',
    label: 'O*NET Database releases',
    url: 'https://www.onetcenter.org/db_releases.html',
    expected: [
      { label: 'current production release 30.3', pattern: /current production release of the O\*NET database is 30\.3/i },
      { label: 'O*NET 30.3 May 2026 release row', pattern: /O\*NET 30\.3\s+May 2026/i },
    ],
  },
  {
    id: 'onet-task-statements',
    label: 'Task Statements - O*NET 30.3',
    url: 'https://www.onetcenter.org/dictionary/30.3/text/task_statements.html',
    expected: [
      { label: 'Task Statements table', pattern: /Task Statements/i },
      { label: 'task statement fields', pattern: /O\*NET-SOC Code.*Task ID.*Task.*Task Type/i },
    ],
  },
  {
    id: 'onet-task-ratings',
    label: 'Task Ratings - O*NET 30.3',
    url: 'https://www.onetcenter.org/dictionary/30.3/text/task_ratings.html',
    expected: [
      { label: 'Task Ratings table', pattern: /Task Ratings/i },
      { label: 'task rating fields', pattern: /Scale ID.*Category.*Data Value.*Standard Error/i },
    ],
  },
  {
    id: 'onet-task-categories',
    label: 'Task Categories - O*NET 30.3',
    url: 'https://www.onetcenter.org/dictionary/30.3/text/task_categories.html',
    expected: [
      { label: 'Task Categories table', pattern: /Task Categories/i },
      { label: 'frequency category evidence', pattern: /Frequency of Task|Category Description/i },
    ],
  },
  {
    id: 'onet-scales-reference',
    label: 'Scales Reference - O*NET 30.3',
    url: 'https://www.onetcenter.org/dictionary/30.3/text/scales_reference.html',
    expected: [
      { label: 'Scales Reference table', pattern: /Scales Reference/i },
      { label: 'scale fields and importance example', pattern: /Scale ID.*Scale Name.*Minimum.*Maximum.*IM.*Importance/i },
    ],
  },
  {
    id: 'bls-emp',
    label: 'BLS Employment Projections',
    url: 'https://www.bls.gov/emp/',
    expected: [
      { label: '2024-34 projections', pattern: /2024\s*[–-]\s*34|2024 to 2034/i },
      { label: 'BLS Occupational Employment Projections', pattern: /BLS Occupational Employment Projections/i },
    ],
  },
  {
    id: 'bls-oews',
    label: 'BLS OEWS tables',
    url: 'https://www.bls.gov/oes/tables.htm',
    expected: [
      { label: 'May 2025 OEWS table section', pattern: /May 2025/i },
      { label: 'Occupational Employment and Wage Statistics', pattern: /Occupational Employment and Wage Statistics/i },
    ],
  },
  {
    id: 'bls-laus',
    label: 'BLS LAUS data overview',
    url: 'https://www.bls.gov/lau/data-overview.htm',
    expected: [
      { label: 'LAUS Data Overview title', pattern: /LAUS Data Overview/i },
      { label: 'local geography tables and maps evidence', pattern: /Monthly and annual data tables and maps by state, metropolitan area, county, and city/i },
    ],
  },
  {
    id: 'bls-qcew',
    label: 'BLS QCEW data overview',
    url: 'https://www.bls.gov/cew/data-overview.htm',
    expected: [
      { label: 'QCEW Data Overview title', pattern: /QCEW Data Overview Page/i },
      { label: 'county and open data access evidence', pattern: /every NAICS industry for every county|QCEW Open Data Access|For Developers/i },
    ],
  },
  {
    id: 'careeronestop-api',
    label: 'CareerOneStop Web API Services',
    url: 'https://github.com/CareerOneStop/API-Overview',
    expected: [
      { label: 'CareerOneStop API services evidence', pattern: /Web API Services/i },
      { label: 'quality-controlled data and access evidence', pattern: /quality-controlled data sets|Request data access|Authentication|API Token/i },
    ],
  },
  {
    id: 'census-acs-api',
    label: 'Census ACS Data API',
    url: 'https://www.census.gov/programs-surveys/acs/data/data-via-api.html',
    expected: [
      { label: 'ACS Data via API title', pattern: /American Community Survey Data via API/i },
      { label: 'Census API access evidence', pattern: /Application Programming Interface \(API\).*access American Community Survey \(ACS\) data/i },
    ],
  },
  {
    id: 'wef-foj-2025',
    label: 'World Economic Forum Future of Jobs Report 2025',
    url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/',
    expected: [
      { label: 'Future of Jobs Report 2025 title', pattern: /Future of Jobs Report 2025/i },
      { label: 'World Economic Forum source', pattern: /World Economic Forum|weforum/i },
    ],
  },
  {
    id: 'oecd-skills-outlook-2025',
    label: 'OECD Skills Outlook 2025',
    url: 'https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/12/oecd-skills-outlook-2025_ac37c7d4/26163cd3-en.pdf',
    timeoutMs: 60_000,
    expected: [
      { label: 'OECD Skills Outlook 2025 title', pattern: /OECD Skills Outlook 2025/i },
      { label: 'skill and labour-market transition evidence', pattern: /skills|labour market|timely labour-market intelligence|artificial intelligence/i },
    ],
  },
  {
    id: 'ai-workforce-consortium-2025',
    label: 'AI Workforce Consortium ICT in Motion 2025',
    url: 'https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2025/m09/ai-workforce-consortium-finds-78-of-ict-roles-now-include-ai-technical-skills-while-human-skills-gain-priority-for-responsible-tech-adoption.html',
    expected: [
      { label: 'AI Workforce Consortium source', pattern: /AI Workforce Consortium/i },
      { label: 'AI role and skill market signal', pattern: /78% of (the )?job roles analyzed include AI skills|7 of the 10 fastest-growing ICT roles are AI-related|AI Risk & Governance Specialist/i },
    ],
  },
  {
    id: 'nace-career-readiness',
    label: 'NACE Career Readiness Competencies',
    url: 'https://www.naceweb.org/career-readiness/competencies/career-readiness-defined',
    expected: [
      { label: 'NACE career readiness definition', pattern: /Career readiness is a foundation/i },
      { label: 'lifelong career management evidence', pattern: /lifelong career management/i },
    ],
  },
  {
    id: 'nace-first-destination',
    label: 'NACE First-Destination Standards and Protocols',
    url: 'https://www.naceweb.org/job-market/graduate-outcomes/first-destination/standards-and-protocols/',
    expected: [
      { label: 'first-destination standards title', pattern: /First-Destination.*Standards and Protocols/i },
      { label: 'career outcome rate evidence', pattern: /Career Outcomes Rate|knowledge rate|salary/i },
    ],
  },
  {
    id: 'ferpa-student-privacy',
    label: 'FERPA student privacy guidance',
    url: 'https://studentprivacy.ed.gov/content/personally-identifiable-information-education-records',
    expected: [
      { label: 'PII for education records title', pattern: /Personally Identifiable Information for Education Records/i },
      { label: 'direct and indirect identifier evidence', pattern: /direct identifiers|indirect identifiers|education records/i },
    ],
  },
  {
    id: 'dol-ai-literacy-framework',
    label: 'DOL AI Literacy Framework',
    url: 'https://www.dol.gov/agencies/eta/advisories/ten-07-25',
    expected: [
      { label: 'DOL AI Literacy Framework title', pattern: /AI Literacy Framework/i },
      { label: 'workforce and education stakeholder evidence', pattern: /public workforce and education systems|state and local workforce board/i },
    ],
  },
  {
    id: 'anthropic-economic-index',
    label: 'Anthropic Economic Index',
    url: 'https://www.anthropic.com/research/the-anthropic-economic-index',
    expected: [
      { label: 'Anthropic Economic Index title', pattern: /Anthropic Economic Index/i },
      { label: 'O*NET task mapping evidence', pattern: /O\*NET|Occupational Information Network/i },
    ],
  },
  {
    id: 'anthropic-observed-exposure',
    label: 'Anthropic observed AI exposure research',
    url: 'https://www.anthropic.com/research/labor-market-impacts',
    expected: [
      { label: 'observed exposure methodology', pattern: /observed exposure/i },
      { label: 'O*NET task grounding', pattern: /O\*NET|Occupational Information Network/i },
    ],
  },
  {
    id: 'openai-gdpval',
    label: 'OpenAI GDPval occupational task evaluation',
    url: 'https://arxiv.org/abs/2510.04374',
    expected: [
      { label: 'GDPval title', pattern: /GDPval/i },
      { label: 'occupational task coverage', pattern: /44 occupations|220 tasks|economically valuable tasks/i },
    ],
  },
  {
    id: 'bls-ai-mlr-2025',
    label: 'BLS AI impacts in employment projections',
    url: 'https://www.bls.gov/opub/mlr/2025/article/incorporating-ai-impacts-in-bls-employment-projections.htm',
    expected: [
      { label: 'AI impacts article title', pattern: /Incorporating AI impacts in BLS employment projections/i },
      { label: 'Monthly Labor Review source', pattern: /Monthly Labor Review|U\.S\. Bureau of Labor Statistics/i },
    ],
  },
  {
    id: 'wcag-22',
    label: 'WCAG 2.2 accessibility standard',
    url: 'https://www.w3.org/TR/WCAG22/',
    expected: [
      { label: 'WCAG 2.2 title', pattern: /Web Content Accessibility Guidelines \(WCAG\) 2\.2/i },
      { label: 'conformance levels evidence', pattern: /three levels of conformance|Level A|Level AA/i },
    ],
  },
  {
    id: 'ada-ai-hiring-guidance',
    label: 'ADA algorithmic hiring guidance',
    url: 'https://www.ada.gov/resources/ai-guidance/',
    expected: [
      { label: 'AI hiring guidance title', pattern: /Algorithms, Artificial Intelligence, and Disability Discrimination in Hiring/i },
      { label: 'reasonable accommodation evidence', pattern: /reasonable accommodations|Web Content Accessibility Guidelines/i },
    ],
  },
  {
    id: 'eeoc-employment-selection-procedures',
    label: 'EEOC employment tests and selection procedures',
    url: 'https://www.eeoc.gov/laws/guidance/employment-tests-and-selection-procedures',
    expected: [
      { label: 'EEOC employment tests title', pattern: /Employment Tests and Selection Procedures/i },
      { label: 'employment selection boundary evidence', pattern: /disparate impact|selection procedures|job-related and consistent with business necessity/i },
    ],
  },
  {
    id: 'cfpb-employment-algorithmic-scores',
    label: 'CFPB employment algorithmic score circular',
    url: 'https://www.consumerfinance.gov/compliance/circulars/consumer-financial-protection-circular-2024-06-background-dossiers-and-algorithmic-scores-for-hiring-promotion-and-other-employment-decisions/',
    expected: [
      { label: 'CFPB circular title', pattern: /Consumer Financial Protection Circular 2024-06|Background Dossiers and Algorithmic Scores/i },
      { label: 'employment FCRA purpose evidence', pattern: /permission to procure a consumer report|provide notices before and upon taking adverse actions|hiring, promotion, reassignment, or retention/i },
    ],
  },
  {
    id: 'iso-42001',
    label: 'ISO/IEC 42001 AI management system',
    url: 'https://www.iso.org/standard/42001',
    expected: [
      { label: 'ISO/IEC 42001 title', pattern: /ISO\/IEC 42001:2023/i },
      { label: 'AI management system governance evidence', pattern: /Artificial Intelligence Management System|managing risk|traceability|transparency/i },
    ],
  },
  {
    id: 'esco',
    label: 'ESCO v1.2.1',
    url: 'https://esco.ec.europa.eu/en/use-esco/use-esco-services-api',
    expected: [
      { label: 'ESCO v1.2.1 title', pattern: /ESCO v1\.2\.1/i },
      { label: 'last update date', pattern: /Last update 10\/12\/2025|December 2025/i },
    ],
  },
  {
    id: 'workera-positioning',
    label: 'Workera skills intelligence positioning',
    url: 'https://www.workera.ai/product-overview',
    expected: [
      { label: 'Workera product page', pattern: /Workera|Elo/i },
      { label: 'skills intelligence positioning', pattern: /skills intelligence|verified skills|skills verification/i },
    ],
  },
  {
    id: 'llm-output',
    label: 'NIST AI RMF grounding for LLM-output caveats',
    url: 'https://www.nist.gov/itl/ai-risk-management-framework',
    expected: [
      { label: 'AI Risk Management Framework title', pattern: /AI Risk Management Framework/i },
      { label: 'NIST source', pattern: /National Institute of Standards and Technology|NIST/i },
    ],
  },
];

function normalizeForEvidence(value) {
  return value
    .replace(/&ndash;|&#8211;|&#x2013;/gi, '–')
    .replace(/&mdash;|&#8212;|&#x2014;/gi, '—')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function fetchSource(check) {
  const response = await fetch(check.url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(check.timeoutMs || REQUEST_TIMEOUT_MS),
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'user-agent': 'CareerAutomationInsightsEngine/1.0 source freshness verifier',
    },
  });
  const body = await response.text();
  const normalizedBody = normalizeForEvidence(body);
  const evidence = check.expected.map((expectation) => ({
    label: expectation.label,
    matched: expectation.pattern.test(normalizedBody),
  }));

  return {
    id: check.id,
    label: check.label,
    url: check.url,
    status: response.status,
    ok: response.ok,
    contentSha256: sha256(body),
    byteLength: Buffer.byteLength(body),
    evidence,
    passed: response.ok && evidence.every((item) => item.matched),
  };
}

async function verifyManifestWiring() {
  const source = await readFile(MANIFEST_SOURCE, 'utf8');
  const missing = checks.flatMap((check) => {
    const failures = [];
    if (!source.includes(`id: '${check.id}'`)) failures.push(`${check.id} id`);
    if (!source.includes(check.url)) failures.push(`${check.id} url`);
    return failures;
  });

  if (missing.length > 0) {
    throw new Error(`Source manifest wiring is missing: ${missing.join(', ')}`);
  }
}

async function readJsonArtifact(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

async function readCommittedJsonArtifact(path) {
  try {
    const { stdout } = await execFileAsync('git', ['show', `HEAD:${path}`], {
      maxBuffer: 10 * 1024 * 1024,
    });
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

function isNetworkWideFetchFailure(results) {
  return (
    results.length > 0 &&
    results.every((result) =>
      result.passed === false &&
      typeof result.error === 'string' &&
      /fetch failed|getaddrinfo|ENOTFOUND|EAI_AGAIN|network/i.test(result.error)
    )
  );
}

async function writeJson(path, artifact) {
  await writeFile(`${path}.tmp`, `${JSON.stringify(artifact, null, 2)}\n`);
  await rename(`${path}.tmp`, path);
}

async function main() {
  const shouldWrite = process.argv.includes('--write');
  await verifyManifestWiring();

  const results = [];
  for (const check of checks) {
    try {
      const result = await fetchSource(check);
      results.push(result);
      console.log(`${result.passed ? 'ok' : 'fail'} ${check.id} - ${check.label}`);
    } catch (error) {
      const result = {
        id: check.id,
        label: check.label,
        url: check.url,
        status: null,
        ok: false,
        contentSha256: null,
        byteLength: 0,
        evidence: check.expected.map((expectation) => ({
          label: expectation.label,
          matched: false,
        })),
        passed: false,
        error: error instanceof Error ? error.message : 'unknown error',
      };
      results.push(result);
      console.log(`fail ${check.id} - ${check.label}`);
    }
  }

  const artifact = {
    generatedAt: new Date().toISOString(),
    manifestSource: MANIFEST_SOURCE,
    allPassed: results.every((result) => result.passed),
    results,
  };

  if (shouldWrite) {
    await mkdir('docs/commercialization', { recursive: true });
    if (isNetworkWideFetchFailure(results)) {
      await writeJson(LAST_ATTEMPT_PATH, artifact);
      const existingArtifact = await readJsonArtifact(OUTPUT_PATH);
      const committedArtifact = await readCommittedJsonArtifact(OUTPUT_PATH);
      const preservedArtifact = existingArtifact?.allPassed === true
        ? existingArtifact
        : committedArtifact?.allPassed === true
          ? committedArtifact
          : null;

      if (preservedArtifact) {
        await writeJson(OUTPUT_PATH, preservedArtifact);
        console.log(`network-wide source fetch failure; wrote ${LAST_ATTEMPT_PATH} and preserved ${OUTPUT_PATH}`);
      } else {
        await writeJson(OUTPUT_PATH, artifact);
        console.log(`network-wide source fetch failure; wrote ${OUTPUT_PATH} because no passing artifact was available to preserve`);
      }
    } else {
      await writeJson(OUTPUT_PATH, artifact);
      console.log(`wrote ${OUTPUT_PATH}`);
    }
  }

  if (!artifact.allPassed) {
    process.exitCode = 1;
  }
}

await main();
