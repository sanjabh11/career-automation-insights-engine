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

async function main() {
  const port = Number(process.env.COMMERCIAL_BROWSER_PORT || START_PORT);
  const baseUrl = `http://${HOST}:${port}`;
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const server = spawn(npmCommand, ['run', 'dev', '--', '--host', HOST, '--port', String(port), '--strictPort'], {
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
    server.kill('SIGTERM');
  }
}

await main();
