#!/usr/bin/env node

import { spawn } from 'node:child_process';

const HOST = '127.0.0.1';
const START_PORT = 5175;
const STARTUP_TIMEOUT_MS = 30_000;
const SERVER_PROBE_TIMEOUT_MS = 3_000;
const ROUTE_TIMEOUT_MS = 45_000;
const INTERACTION_TIMEOUT_MS = 20_000;
const BROWSER_LAUNCH_TIMEOUT_MS = 60_000;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isIgnoredConsoleError(text) {
  return (
    text.includes('supabase-disabled.invalid') ||
    text.includes('Failed to load resource') ||
    text.includes('net::ERR_NAME_NOT_RESOLVED') ||
    text.includes('net::ERR_FAILED')
  );
}

function isIgnoredRequestFailure(url) {
  return (
    url.includes('supabase-disabled.invalid') ||
    url.includes('m.stripe.com') ||
    url.includes('m.stripe.network') ||
    url.includes('js.stripe.com') ||
    url.includes('fonts.gstatic.com') ||
    url.includes('fonts.googleapis.com')
  );
}

async function waitForServer(baseUrl) {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(SERVER_PROBE_TIMEOUT_MS) });
      if (response.ok) return;
      lastError = new Error(`Server responded ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await wait(500);
  }

  throw new Error(`Vite server did not become ready: ${lastError instanceof Error ? lastError.message : 'unknown error'}`);
}

async function launchCommercialBrowser() {
  const { chromium } = await import('playwright');
  const baseOptions = {
    headless: true,
    timeout: BROWSER_LAUNCH_TIMEOUT_MS,
    protocol: 'webDriverBiDi',
  };

  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return chromium.launch({
      ...baseOptions,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    });
  }

  if (process.env.PLAYWRIGHT_CHANNEL) {
    return chromium.launch({ ...baseOptions, channel: process.env.PLAYWRIGHT_CHANNEL });
  }

  try {
    return await chromium.launch(baseOptions);
  } catch (defaultError) {
    try {
      return await chromium.launch({ ...baseOptions, channel: 'chrome' });
    } catch (channelError) {
      throw new Error(
        'Unable to launch Playwright Chromium. Tried bundled Chromium and installed Chrome. ' +
        'Install browsers with "npx playwright install chromium", set PLAYWRIGHT_CHANNEL, or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH. ' +
        `Bundled error: ${defaultError instanceof Error ? defaultError.message : defaultError}. ` +
        `Chrome channel error: ${channelError instanceof Error ? channelError.message : channelError}.`
      );
    }
  }
}

function createPageIssueCollector(page) {
  const issues = [];

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (!isIgnoredConsoleError(text)) {
      issues.push(`console error: ${text}`);
    }
  });

  page.on('pageerror', (error) => {
    issues.push(`page error: ${error.message}`);
  });

  page.on('requestfailed', (request) => {
    const url = request.url();
    if (isIgnoredRequestFailure(url)) return;
    if (url.startsWith('data:')) return;
    issues.push(`request failed: ${request.method()} ${url} - ${request.failure()?.errorText || 'unknown'}`);
  });

  return issues;
}

async function assertVisible(locator, label) {
  await locator.waitFor({ state: 'visible', timeout: ROUTE_TIMEOUT_MS });
  console.log(`ok visible - ${label}`);
}

async function assertButtonDisabled(locator, label) {
  const disabled = await locator.evaluate((element) => {
    if (element instanceof HTMLButtonElement) return element.disabled;
    return element.getAttribute('aria-disabled') === 'true';
  });

  if (!disabled) {
    throw new Error(`${label} should be disabled`);
  }
  console.log(`ok disabled - ${label}`);
}

async function assertButtonEnabled(locator, label) {
  const enabled = await locator.evaluate((element) => {
    if (element instanceof HTMLButtonElement) return !element.disabled;
    return element.getAttribute('aria-disabled') !== 'true';
  });

  if (!enabled) {
    throw new Error(`${label} should be enabled`);
  }
  console.log(`ok enabled - ${label}`);
}

async function verifyPopupReport(popupPromise, expectedText, label) {
  const popup = await popupPromise;
  const expectedTexts = Array.isArray(expectedText) ? expectedText : [expectedText];
  for (const text of expectedTexts) {
    await popup.waitForFunction(
      (expected) => document.body?.innerText.includes(expected),
      text,
      { timeout: INTERACTION_TIMEOUT_MS }
    );
  }
  const hasReviewMetadata = await popup.evaluate(() =>
    {
      const template = document.querySelector('template[data-proof-pack-review-metadata="true"]');
      const metadataText = [
        template?.textContent,
        template instanceof HTMLTemplateElement ? template.innerHTML : '',
        template instanceof HTMLTemplateElement ? template.content.textContent : '',
      ].join('\n');
      return Boolean(template && metadataText.includes('sections'));
    }
  );
  if (!hasReviewMetadata) {
    throw new Error(`${label} is missing machine-readable proof-pack review metadata`);
  }
  console.log(`ok popup - ${label}`);
  await popup.close();
}

function getMockResumeAnalysisResponse() {
  const generatedAt = '2026-05-24T00:00:00.000Z';
  const sourceIds = ['llm-output', 'nist-ai-rmf', 'ada-ai-hiring-guidance'];
  return {
    success: true,
    analysis_id: null,
    automation_risk_score: 42,
    confidence_score: 0.82,
    automation_prone_phrases: [
      {
        phrase: 'handled routine reports',
        context: 'Operations reporting',
        severity: 'medium',
        reason: 'Routine report generation can often be AI-assisted and should be reframed around judgment, stakeholder context, and exception handling.',
      },
    ],
    rewrite_suggestions: [
      {
        original: 'Handled routine reports',
        suggested: 'Translated recurring operations reports into exception-focused briefings for managers.',
        rationale: 'Reframes the task around judgment and decision support rather than routine production.',
      },
    ],
    detected_skills: ['Excel', 'reporting', 'stakeholder communication'],
    recommended_skills: [
      {
        skill: 'AI-assisted analytics QA',
        priority: 'high',
        reason: 'Adds human-review strength around model-generated summaries and data checks.',
      },
    ],
    proof_pack: {
      proofPackType: 'resume_analysis',
      schemaVersion: '2026-05-24',
      generatedAt,
      reviewStatus: 'staff_review_required',
      sourceIds,
      decisionBoundaries: [
        'Not a hiring, firing, promotion, compensation, layoff, screening, or eligibility decision tool.',
        'Human review is required before coach, counselor, workforce, or institutional delivery.',
      ],
      parserBoundary: {
        filename: 'pasted-resume.txt',
        inputMode: 'pasted_text',
        rawFileStored: false,
        rawResumeTextStored: false,
        savedAnalysisId: null,
        deletionReceiptAvailable: false,
        productionPdfDocxParser: false,
        caveat: 'Browser text input was analyzed for coaching only; production PDF/DOCX parsing requires server-side parser verification.',
      },
      evidenceCards: [
        {
          id: 'resume-risk-score-boundary',
          claim: 'Resume risk score is an AI-assisted language review signal.',
          sourceIds,
          confidence: 'medium',
          generatedAt,
          caveat: 'Score depends on supplied resume text and prompt behavior.',
          doesNotProve: 'Does not prove job loss, employability, screening eligibility, or performance.',
          reviewStatus: 'staff_review_required',
        },
        {
          id: 'resume-rewrite-boundary',
          claim: 'Rewrite drafts are coaching suggestions.',
          sourceIds,
          confidence: 'medium',
          generatedAt,
          caveat: 'Drafts need human editing before client use.',
          doesNotProve: 'Does not prove hiring advantage or application success.',
          reviewStatus: 'staff_review_required',
        },
        {
          id: 'resume-skill-recommendation-boundary',
          claim: 'Recommended skills are directional learning themes.',
          sourceIds,
          confidence: 'medium',
          generatedAt,
          caveat: 'Skill recommendations need local labor-market and advisor validation.',
          doesNotProve: 'Does not prove market demand or credential value.',
          reviewStatus: 'staff_review_required',
        },
      ],
    },
  };
}

async function verifyResumeProofReportDownload(page, baseUrl) {
  console.log('checking /tools/resume-analyzer proof report');
  await page.goto(`${baseUrl}/tools/resume-analyzer`, { waitUntil: 'domcontentloaded', timeout: ROUTE_TIMEOUT_MS });
  await assertVisible(page.getByRole('heading', { name: /Resume Automation Risk Analyzer/i }).first(), '/tools/resume-analyzer heading');

  const resumeText = [
    'Operations analyst with five years of experience handling routine reports, recurring spreadsheet updates, stakeholder requests, and weekly dashboard summaries.',
    'Built Excel workbooks, documented exceptions, reviewed data quality, coordinated manager briefings, and translated recurring findings into operational decisions.',
    'Seeking to reposition the resume around human judgment, AI-assisted analytics QA, and cross-functional communication.',
  ].join(' ');
  await page.getByPlaceholder(/Paste resume text here/i).fill(resumeText);

  const analyzeButton = page.getByRole('button', { name: /Analyze Pasted Text/i });
  await assertButtonEnabled(analyzeButton, 'resume analyze pasted text');
  await analyzeButton.click();
  await assertVisible(page.getByRole('heading', { name: /Automation Risk Assessment/i }), 'resume proof result');
  await assertVisible(page.getByText(/Resume Analysis Evidence And Review Boundaries/i), 'resume proof evidence boundaries');
  await assertVisible(page.getByText(/Saved proof artifacts are redacted/i), 'resume redacted artifact boundary');
  await assertVisible(page.getByRole('button', { name: /Download Proof Report/i }), 'resume proof report button');
  await assertVisible(page.getByRole('button', { name: /Copy Rewrite Drafts/i }), 'resume rewrite draft button');
  await assertButtonDisabled(page.getByRole('button', { name: /Save Redacted Artifact/i }), 'guest resume redacted artifact save');

  const downloadPromise = page.waitForEvent('download', { timeout: INTERACTION_TIMEOUT_MS });
  await page.getByRole('button', { name: /Download Proof Report/i }).click();
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  if (!suggestedFilename.includes('resume-work-transition-proof-report')) {
    throw new Error(`Unexpected resume proof report filename: ${suggestedFilename}`);
  }
  const htmlBody = await download.createReadStream().then(async (stream) => {
    if (!stream) throw new Error('Resume proof report stream was unavailable');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  });
  for (const expected of [
    'data-resume-proof-report="true"',
    'Resume Work Transition Proof Report',
    'Parser And Retention Boundary',
    'resume-risk-score-boundary',
    'resume-rewrite-boundary',
    'resume-skill-recommendation-boundary',
    'Not a hiring, firing, promotion, compensation, layoff, screening, or eligibility decision tool',
    'Does not prove',
  ]) {
    if (!htmlBody.includes(expected)) {
      throw new Error(`Resume proof report HTML is missing ${expected}`);
    }
  }
  console.log('ok download - resume proof report HTML');
}

async function verifyOfflineQueueRedaction(page, source) {
  const queue = await page.evaluate(() => {
    const raw = window.localStorage.getItem('commercial_leads_offline_queue');
    return raw ? JSON.parse(raw) : [];
  });

  const matching = queue.filter((item) => item.source === source);
  if (matching.length === 0) {
    throw new Error(`Expected offline queue entry for ${source}`);
  }

  const latest = matching.at(-1);
  if (latest.report_html !== null) {
    throw new Error(`Offline queue entry for ${source} preserved report_html`);
  }

  if (latest.metadata?.offline_queue_redacted_report_html !== true) {
    throw new Error(`Offline queue entry for ${source} is missing redaction metadata`);
  }

  if (latest.consent_to_contact !== true || !latest.consent_text) {
    throw new Error(`Offline queue entry for ${source} is missing consent evidence`);
  }

  const reviewWorkflow = latest.metadata?.proof_pack_review_workflow;
  if (!reviewWorkflow || !Array.isArray(reviewWorkflow.sections) || reviewWorkflow.sections.length === 0) {
    throw new Error(`Offline queue entry for ${source} is missing proof-pack review workflow metadata`);
  }

  console.log(`ok offline queue redacted - ${source}`);
}

async function verifyPrivacyPage(page, baseUrl) {
  console.log('checking /privacy');
  await page.goto(`${baseUrl}/privacy`, { waitUntil: 'domcontentloaded', timeout: ROUTE_TIMEOUT_MS });
  await assertVisible(page.getByRole('heading', { name: /Privacy Policy/i }), '/privacy heading');
  await assertVisible(page.getByText(/Local Fallback Queue/i), '/privacy fallback queue copy');
  await assertVisible(page.getByText(/employment decisions/i).first(), '/privacy employment decision notice');
}

async function verifyCoachSampleReport(page, baseUrl) {
  console.log('checking /sample-report');
  await page.goto(`${baseUrl}/sample-report`, { waitUntil: 'domcontentloaded', timeout: ROUTE_TIMEOUT_MS });
  await assertVisible(page.getByRole('heading', { name: /Generate a Free AI Career Report/i }), '/sample-report heading');

  await page.locator('#coachBrandName').fill('Proof Pack Coaching');
  await page.locator('#coachContactEmail').fill('pilot-coach@example.com');
  await page.getByPlaceholder(/Search occupations/i).fill('bookkeeper');
  await page.getByRole('button', { name: /Bookkeeper/i }).evaluate((element) => {
    if (element instanceof HTMLElement) element.click();
  });

  const generateButton = page.getByRole('button', { name: /Generate Sample Report/i });
  await assertButtonDisabled(generateButton, 'coach sample generate without consent');

  await page.locator('#coachSampleConsent').click();
  await assertButtonEnabled(generateButton, 'coach sample generate after consent');

  const popupPromise = page.waitForEvent('popup', { timeout: INTERACTION_TIMEOUT_MS });
  await generateButton.click();
  await verifyPopupReport(
    popupPromise,
    ['AI Career Resilience Report', 'Human Review Workflow', 'Client Delivery Readiness', 'Weight basis', 'O*NET Task Ratings', 'Changing', 'Unknown', 'Source caveat', 'Role validation', 'Needs posting validation', 'Learning And Provider Boundary', 'Local Labor-Market Proof Appendix', 'bls-laus'],
    'coach sample report'
  );
  await assertVisible(
    page.getByText(/Queued locally because Supabase was unavailable|Saved to Supabase lead ops/i),
    'coach lead persistence status'
  );
  await verifyOfflineQueueRedaction(page, 'coach-sample-report');
}

async function verifySeoReportDownload(page, baseUrl) {
  console.log('checking /automation-risk/accountant');
  await page.goto(`${baseUrl}/automation-risk/accountant`, { waitUntil: 'domcontentloaded', timeout: ROUTE_TIMEOUT_MS });
  await assertVisible(page.getByRole('heading', { name: /Will AI Replace Accountants/i }), '/automation-risk/accountant heading');

  const downloadButton = page.getByRole('button', { name: /Download PDF/i });
  await page.getByPlaceholder('your@email.com').fill('pilot-reader@example.com');
  await assertButtonDisabled(downloadButton, 'SEO report download without consent');

  await page.locator('#seo-report-consent-accountant').click();
  await assertButtonEnabled(downloadButton, 'SEO report download after consent');

  const popupPromise = page.waitForEvent('popup', { timeout: INTERACTION_TIMEOUT_MS });
  await downloadButton.click();
  await verifyPopupReport(
    popupPromise,
    ['AI Automation Risk Report', 'Human Review Workflow', 'Client Delivery Readiness', 'Weight basis', 'O*NET Task Ratings', 'Changing', 'Unknown', 'Source caveat', 'Role validation', 'Needs posting validation', 'Learning And Provider Boundary', 'Local Labor-Market Proof Appendix', 'bls-laus'],
    'SEO occupation report'
  );
  await assertVisible(page.getByText(/Report Downloaded/i), 'SEO report downloaded success state');
  await verifyOfflineQueueRedaction(page, 'seo-report-download');
}

async function verifyWorkforceAuditBuilder(page, baseUrl) {
  console.log('checking /enterprise-dashboard');
  await page.goto(`${baseUrl}/enterprise-dashboard`, { waitUntil: 'domcontentloaded', timeout: ROUTE_TIMEOUT_MS });
  await assertVisible(page.getByRole('heading', { name: /Workforce Planning Dashboard/i }), '/enterprise-dashboard heading');
  await page.getByRole('tab', { name: /Audit Builder/i }).click();
  await assertVisible(page.getByRole('heading', { name: /Workforce CSV Audit Builder/i }), 'workforce audit builder');
  await assertVisible(page.getByRole('heading', { name: /Executive report skeleton/i }), 'workforce executive report skeleton');
  await assertVisible(page.getByRole('button', { name: /Download Executive HTML Report/i }), 'workforce executive HTML report export');
  await assertVisible(page.getByText(/Local SOC suggestion catalog/i), 'workforce SOC suggestion catalog stats');
  await assertVisible(page.getByText('Weighted Exposure', { exact: true }).first(), 'workforce weighted exposure metric');

  await page.getByLabel(/Workforce audit CSV rows/i).fill(`department,role,headcount,avg_salary,apo_score,soc_code
Operations,Customer Service Representatives,10,52000,78,
Engineering,Software Developers,8,128000,35,15-1252.00`);
  await page.getByRole('button', { name: /Generate Audit Skeleton/i }).click();
  await assertVisible(page.getByText(/18 workers/i), 'workforce parsed headcount');
  await assertVisible(page.getByText(/Rows needing SOC\/O\*NET review: 1/i), 'workforce unmapped review count');
}

async function verifyCounselorCohortProofPack(page, baseUrl) {
  console.log('checking /tools/counselor-reports');
  await page.goto(`${baseUrl}/tools/counselor-reports`, { waitUntil: 'domcontentloaded', timeout: ROUTE_TIMEOUT_MS });
  await assertVisible(page.getByRole('heading', { name: /Counselor Report Generator/i }), '/tools/counselor-reports heading');
  await assertVisible(page.locator('[data-career-center-cohort-pack="true"]'), 'career center cohort proof pack');
  await assertVisible(page.getByText(/aggregate-only/i).first(), 'cohort aggregate-only boundary');
  await assertVisible(page.getByText(/placement-rate or first-destination outcome report/i), 'cohort outcome boundary');

  const htmlDownloadPromise = page.waitForEvent('download', { timeout: INTERACTION_TIMEOUT_MS });
  await page.getByRole('button', { name: /Cohort HTML/i }).click();
  const htmlDownload = await htmlDownloadPromise;
  if (!htmlDownload.suggestedFilename().includes('career-center-cohort-proof-pack')) {
    throw new Error(`Unexpected cohort HTML filename: ${htmlDownload.suggestedFilename()}`);
  }
  const htmlBody = await htmlDownload.createReadStream().then(async (stream) => {
    if (!stream) throw new Error('Cohort HTML stream was unavailable');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  });
  for (const expected of ['data-career-center-cohort-proof-pack="true"', 'Career Center Cohort Evidence Cards', 'FERPA', 'NACE']) {
    if (!htmlBody.includes(expected)) {
      throw new Error(`Cohort HTML is missing ${expected}`);
    }
  }
  console.log('ok download - career center cohort HTML');

  const csvDownloadPromise = page.waitForEvent('download', { timeout: INTERACTION_TIMEOUT_MS });
  await page.getByRole('button', { name: /Cohort CSV/i }).click();
  const csvDownload = await csvDownloadPromise;
  if (!csvDownload.suggestedFilename().includes('career-center-cohort-proof-pack')) {
    throw new Error(`Unexpected cohort CSV filename: ${csvDownload.suggestedFilename()}`);
  }
  const csvBody = await csvDownload.createReadStream().then(async (stream) => {
    if (!stream) throw new Error('Cohort CSV stream was unavailable');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  });
  for (const expectedColumn of ['segment_id', 'source_ids', 'review_state', 'caveat', 'does_not_prove']) {
    if (!csvBody.includes(expectedColumn)) {
      throw new Error(`Career-center cohort CSV is missing ${expectedColumn}`);
    }
  }
  console.log('ok download - career center cohort CSV');
}

async function verifyProofPackGallery(page, baseUrl) {
  console.log('checking /proof-pack-gallery');
  await page.goto(`${baseUrl}/proof-pack-gallery`, { waitUntil: 'domcontentloaded', timeout: ROUTE_TIMEOUT_MS });
  await assertVisible(
    page.getByRole('heading', { name: /Proof-pack gallery for coach, career-center, and workforce pilots/i }),
    '/proof-pack-gallery heading'
  );
  await assertVisible(page.locator('[data-proof-pack-gallery="phase-6-outreach"]'), 'proof-pack gallery marker');
  await assertVisible(page.locator('[data-proof-pack-gallery-card="individual-transition-report"]'), 'individual proof-pack sample card');
  await assertVisible(page.locator('[data-proof-pack-gallery-card="coach-branded-sample"]'), 'coach proof-pack sample card');
  await assertVisible(page.locator('[data-proof-pack-gallery-card="workforce-csv-audit"]'), 'workforce proof-pack sample card');
  await assertVisible(page.locator('[data-proof-pack-gallery-card="career-center-cohort-report"]'), 'career-center cohort sample card');
  await assertVisible(page.getByText(/Does not prove boundaries/i), 'gallery does-not-prove boundary');
  await assertVisible(page.locator('[data-institutional-readiness-gallery="true"]'), 'institutional readiness packet');
  await assertVisible(page.getByRole('button', { name: /Trust HTML/i }), 'institutional trust HTML export');
  await assertVisible(page.getByRole('button', { name: /Risk CSV/i }), 'institutional risk CSV export');
  await assertVisible(page.locator('[data-ai-rmf-control-map="true"]'), 'institutional AI RMF control map');
  await assertVisible(page.locator('[data-wcag-accessibility-gate="true"]'), 'institutional WCAG accessibility gate');
  await assertVisible(page.locator('[data-employment-decision-boundary="true"]'), 'institutional employment decision boundary');
  await assertVisible(page.getByText(/CRM import pack/i), 'CRM import pack');
  await assertVisible(page.getByRole('button', { name: /CRM CSV/i }), 'CRM CSV export');
  await assertVisible(page.getByText(/Planning artifact only/i).first(), 'gallery planning-only boundary');
  await assertVisible(page.locator('[data-phase6-evidence-cards="true"]'), 'phase 6 evidence cards');
  await assertVisible(page.locator('[data-phase6-evidence-card="true"]').first(), 'phase 6 evidence card item');
  await assertVisible(page.getByText(/DOL AI literacy framework/i).first(), 'DOL AI literacy source');
  await assertVisible(page.getByText(/Does not prove:/i).first(), 'gallery evidence does-not-prove field');

  const csvButton = page.getByRole('button', { name: /CRM CSV/i });
  const downloadPromise = page.waitForEvent('download', { timeout: INTERACTION_TIMEOUT_MS });
  await csvButton.click();
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  if (!suggestedFilename.includes('proof-pack-outreach')) {
    throw new Error(`Unexpected proof-pack gallery CSV filename: ${suggestedFilename}`);
  }
  const csvBody = await download.createReadStream().then(async (stream) => {
    if (!stream) {
      throw new Error('Proof-pack gallery CRM CSV stream was unavailable');
    }
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  });
  for (const expectedColumn of ['source_ids', 'confidence', 'review_state', 'caveat', 'does_not_prove']) {
    if (!csvBody.includes(expectedColumn)) {
      throw new Error(`Proof-pack gallery CRM CSV is missing ${expectedColumn}`);
    }
  }
  console.log('ok download - proof-pack gallery CRM CSV');

  const trustDownloadPromise = page.waitForEvent('download', { timeout: INTERACTION_TIMEOUT_MS });
  await page.getByRole('button', { name: /Trust HTML/i }).click();
  const trustDownload = await trustDownloadPromise;
  if (!trustDownload.suggestedFilename().includes('institutional-readiness-proof-pack')) {
    throw new Error(`Unexpected institutional readiness HTML filename: ${trustDownload.suggestedFilename()}`);
  }
  const trustHtml = await trustDownload.createReadStream().then(async (stream) => {
    if (!stream) throw new Error('Institutional readiness HTML stream was unavailable');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  });
  for (const expected of [
    'data-institutional-readiness-packet="true"',
    'Institutional Risk Register',
    'AI RMF Control Map',
    'Employment Decision Boundary',
    'WCAG 2.2 Accessibility Gate',
    'Institutional Acceptance Gates',
    'institutional-readiness-not-employment-selection',
    'Does not prove',
  ]) {
    if (!trustHtml.includes(expected)) {
      throw new Error(`Institutional readiness HTML is missing ${expected}`);
    }
  }
  console.log('ok download - institutional readiness HTML');

  const riskCsvDownloadPromise = page.waitForEvent('download', { timeout: INTERACTION_TIMEOUT_MS });
  await page.getByRole('button', { name: /Risk CSV/i }).click();
  const riskCsvDownload = await riskCsvDownloadPromise;
  if (!riskCsvDownload.suggestedFilename().includes('institutional-readiness-risk-register')) {
    throw new Error(`Unexpected institutional readiness CSV filename: ${riskCsvDownload.suggestedFilename()}`);
  }
  const riskCsvBody = await riskCsvDownload.createReadStream().then(async (stream) => {
    if (!stream) throw new Error('Institutional readiness CSV stream was unavailable');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  });
  for (const expectedColumn of ['risk_id', 'source_ids', 'confidence', 'review_state', 'caveat', 'does_not_prove', 'next_action']) {
    if (!riskCsvBody.includes(expectedColumn)) {
      throw new Error(`Institutional readiness CSV is missing ${expectedColumn}`);
    }
  }
  console.log('ok download - institutional readiness CSV');
}

async function runBrowserChecks(baseUrl) {
  console.log('launching Playwright browser');
  const browser = await launchCommercialBrowser();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
  });

  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.includes('/functions/v1/analyze-resume')) {
      await route.fulfill({
        status: route.request().method() === 'OPTIONS' ? 204 : 200,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
          'access-control-allow-methods': 'POST, OPTIONS',
          'content-type': 'application/json',
        },
        body: route.request().method() === 'OPTIONS' ? '' : JSON.stringify(getMockResumeAnalysisResponse()),
      });
      return;
    }
    if (url.includes('supabase-disabled.invalid')) {
      await route.abort('failed');
      return;
    }
    await route.continue();
  });

  const page = await context.newPage();
  const issues = createPageIssueCollector(page);

  try {
    await verifyPrivacyPage(page, baseUrl);
    await verifyCoachSampleReport(page, baseUrl);
    await verifySeoReportDownload(page, baseUrl);
    await verifyResumeProofReportDownload(page, baseUrl);
    await verifyWorkforceAuditBuilder(page, baseUrl);
    await verifyCounselorCohortProofPack(page, baseUrl);
    await verifyProofPackGallery(page, baseUrl);

    if (issues.length > 0) {
      throw new Error(`Commercial browser issues:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
    }
  } finally {
    await browser.close();
  }
}

function stopServer(server) {
  if (!server.pid) return;
  try {
    if (process.platform !== 'win32') {
      process.kill(-server.pid, 'SIGTERM');
      return;
    }
  } catch {
    // Fall back to killing the wrapper process below.
  }
  server.kill('SIGTERM');
}

async function main() {
  const port = Number(process.env.COMMERCIAL_BROWSER_PORT || START_PORT);
  const baseUrl = `http://${HOST}:${port}`;
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const server = spawn(npmCommand, ['run', 'dev', '--', '--host', HOST, '--port', String(port), '--strictPort'], {
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let serverOutput = '';
  server.stdout.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });

  try {
    await waitForServer(baseUrl);
    console.log(`server ready at ${baseUrl}`);
    await runBrowserChecks(baseUrl);
    console.log(`Commercial browser verification passed at ${baseUrl}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    if (serverOutput.trim()) {
      console.error('\nVite output:\n');
      console.error(serverOutput.trim());
    }
    process.exitCode = 1;
  } finally {
    stopServer(server);
  }
}

await main();
