#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const HOST = '127.0.0.1';
const START_PORT = 5175;
const STARTUP_TIMEOUT_MS = 90_000;
const SERVER_PROBE_TIMEOUT_MS = 3_000;
const ROUTE_TIMEOUT_MS = 90_000;
const INTERACTION_TIMEOUT_MS = 20_000;
const BROWSER_LAUNCH_TIMEOUT_MS = 60_000;
const OWNER_EVIDENCE_HANDOFF_JSON = 'docs/commercialization/owner-evidence-handoff-latest.json';

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

function isIgnoredRequestFailure(request) {
  const url = request.url();
  const failureText = request.failure()?.errorText || '';

  if (failureText === 'net::ERR_ABORTED' && request.method() === 'GET') {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === HOST && parsed.pathname === '/icon.svg') return true;
    } catch {
      // Fall through to the explicit third-party ignore list below.
    }
  }

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
    if (isIgnoredRequestFailure(request)) return;
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

async function assertBodyText(page, pattern, label) {
  const bodyText = await page.locator('body').innerText({ timeout: ROUTE_TIMEOUT_MS });
  if (!pattern.test(bodyText)) {
    throw new Error(`${label} was not found in rendered body text`);
  }
  console.log(`ok text - ${label}`);
}

async function assertBodyTextAbsent(page, staleTexts, label) {
  const bodyText = await page.locator('body').innerText({ timeout: ROUTE_TIMEOUT_MS });
  const found = staleTexts.filter((text) => bodyText.includes(text));
  if (found.length > 0) {
    throw new Error(`${label} found stale rendered text: ${found.join(', ')}`);
  }
  console.log(`ok absent - ${label}`);
}

async function readDownloadBody(download, label) {
  const stream = await download.createReadStream();
  if (!stream) {
    throw new Error(`${label} stream was unavailable`);
  }
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function readOwnerEvidenceHandoffCommandSequence() {
  const handoff = JSON.parse(readFileSync(OWNER_EVIDENCE_HANDOFF_JSON, 'utf8'));
  if (!Array.isArray(handoff.commandSequence) || handoff.commandSequence.length === 0) {
    throw new Error(`${OWNER_EVIDENCE_HANDOFF_JSON} is missing commandSequence`);
  }
  return handoff.commandSequence;
}

function readOwnerOperationalAccessCommands() {
  const handoff = JSON.parse(readFileSync(OWNER_EVIDENCE_HANDOFF_JSON, 'utf8'));
  if (!Array.isArray(handoff.operationalAccessPrerequisites) || handoff.operationalAccessPrerequisites.length === 0) {
    throw new Error(`${OWNER_EVIDENCE_HANDOFF_JSON} is missing operationalAccessPrerequisites`);
  }
  const commands = handoff.operationalAccessPrerequisites.flatMap((item) => item.accessRecoveryCommands || []);
  if (commands.length === 0) {
    throw new Error(`${OWNER_EVIDENCE_HANDOFF_JSON} has no operational access recovery commands`);
  }
  return commands;
}

async function verifyOwnerEvidenceCommandChecklist(panel) {
  const expectedCommands = readOwnerEvidenceHandoffCommandSequence();
  const commandCards = panel.locator('article');
  const actualCardCount = await commandCards.count();
  if (actualCardCount !== expectedCommands.length) {
    throw new Error(
      `Owner evidence command checklist rendered ${actualCardCount} card(s), expected ${expectedCommands.length}.`
    );
  }

  const renderedCommands = await panel.locator('article code').evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.trim() || '')
  );
  if (JSON.stringify(renderedCommands) !== JSON.stringify(expectedCommands)) {
    throw new Error(
      `Owner evidence command checklist does not match ${OWNER_EVIDENCE_HANDOFF_JSON}#commandSequence.`
    );
  }

  console.log(`ok visible - owner evidence command checklist canonical sequence (${expectedCommands.length} commands)`);
}

async function verifyOwnerOperationalAccessCommands(panel) {
  const expectedCommands = readOwnerOperationalAccessCommands();
  const commandList = panel.locator('[data-owner-operational-access-commands="true"]');
  await assertVisible(commandList, 'trust owner operational access command checklist');

  const renderedCommands = await commandList.locator('li').evaluateAll((nodes) =>
    nodes.map((node) => node.textContent?.trim() || '')
  );
  if (JSON.stringify(renderedCommands) !== JSON.stringify(expectedCommands)) {
    throw new Error(
      `Owner operational access commands do not match ${OWNER_EVIDENCE_HANDOFF_JSON}#operationalAccessPrerequisites.accessRecoveryCommands.`
    );
  }

  console.log(`ok visible - owner operational access command checklist (${expectedCommands.length} commands)`);
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
  const sourceIds = ['llm-output', 'nist-ai-rmf', 'ada-ai-hiring-guidance', 'owasp-file-upload', 'supabase-edge-functions'];
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
        serverParserReceiptId: null,
        fileSha256: null,
        detectedFileKind: 'pasted_text',
        uploadValidation: 'text_submission_without_file_upload',
        rawFileStored: false,
        rawResumeTextStored: false,
        savedAnalysisId: null,
        deletionReceiptAvailable: false,
        productionPdfDocxParser: false,
        tempFileDeletionStatus: 'not_applicable',
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
        {
          id: 'resume-server-parser-boundary',
          claim: 'Server-side resume parsing must validate file type, size, signature, and storage minimization before paid PDF/DOCX workflows are enabled.',
          sourceIds: ['owasp-file-upload', 'supabase-edge-functions', 'nist-ai-rmf'],
          confidence: 'medium',
          generatedAt,
          caveat: 'Pasted text has no server parser receipt; production PDF/DOCX parsing requires deployed parser verification.',
          doesNotProve: 'Does not prove uploaded files are malware-free or that PDF/DOCX extraction is complete.',
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
    'resume-server-parser-boundary',
    'No server parser receipt is attached',
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

async function verifyCommercialTrustCenter(page, baseUrl) {
  console.log('checking /trust-center');
  await page.goto(`${baseUrl}/trust-center`, { waitUntil: 'domcontentloaded', timeout: ROUTE_TIMEOUT_MS });
  await assertVisible(
    page.getByRole('heading', { name: /Responsible AI and institutional trust boundaries/i }),
    '/trust-center heading'
  );
  await assertVisible(page.locator('[data-commercial-trust-center="true"]'), 'commercial trust center marker');
  await assertVisible(page.getByText(/Commercial Trust Center/i), 'commercial trust center badge');
  await assertVisible(page.getByText(/Planning use only/i), 'planning use only badge');
  await assertVisible(page.locator('[data-trust-employment-boundary="true"]'), 'trust employment boundary');
  await assertVisible(page.locator('[data-trust-accessibility-boundary="true"]'), 'trust accessibility boundary');
  await assertVisible(page.locator('[data-trust-launch-readiness="true"]'), 'trust launch readiness table');
  await assertVisible(page.locator('[data-trust-live-blockers="true"]'), 'trust live blockers');
  await assertVisible(page.locator('[data-trust-payment-proof="true"]'), 'trust payment proof status');
  await assertVisible(page.locator('[data-trust-risk-register="true"]'), 'trust risk register');
  await assertVisible(page.locator('[data-trust-manual-wcag-worksheet="true"]'), 'trust manual WCAG worksheet');
  await assertVisible(page.locator('[data-trust-buyer-signoff-checklist="true"]'), 'trust buyer acceptable-use checklist');
  await assertVisible(page.locator('[data-trust-ai-rmf="true"]'), 'trust AI RMF control map');
  await assertVisible(page.locator('[data-trust-function-review="true"]'), 'trust function governance review');
  await assertVisible(page.getByText(/Not ready for scaled paid or institutional delivery/i), 'trust launch blocker copy');
  await assertVisible(page.getByText(/do not certify legal compliance, WCAG conformance/i), 'trust evidence boundary copy');
  await assertVisible(page.getByText(/Manual WCAG evidence worksheet/i), 'trust manual WCAG worksheet heading');
  await assertVisible(page.getByText(/Buyer acceptable-use signoff checklist/i), 'trust buyer signoff heading');
  await assertBodyText(page, /Launch blockers\s*5\b/i, 'trust summary launch blocker count');
  await assertBodyText(page, /Readiness risks\s*6\b/i, 'trust summary readiness risk count');
  await assertVisible(page.locator('[data-proof-visibility="evidence-gate-dashboard"]'), 'trust evidence gate dashboard');
  await assertVisible(page.getByText(/2\/7 accepted/i), 'trust evidence gate accepted count');
  for (const [acceptedLiveGateId, labelPattern] of [
    ['production_calibration_run', /Production calibration/i],
    ['authenticated_live_artifact_e2e', /Authenticated live artifact e2e/i],
  ]) {
    await assertVisible(page.getByText(labelPattern).first(), `trust accepted live gate ${acceptedLiveGateId}`);
  }
  await assertBodyTextAbsent(
    page,
    ['Launch blockers 7', 'Readiness risks 8', '1/8 ready', 'same seven incomplete gates'],
    'stale trust evidence counts'
  );
  const ownerEvidencePrepPanel = page.locator('[data-proof-visibility="owner-evidence-prep-readiness"]');
  await assertVisible(ownerEvidencePrepPanel, 'trust owner evidence prep readiness');
  await assertVisible(ownerEvidencePrepPanel.getByText(/Owner evidence prep readiness/i), 'trust owner evidence prep heading');
  await assertVisible(ownerEvidencePrepPanel.getByText(/readyForCloseout=false/i), 'trust owner evidence prep closeout boundary');
  await assertVisible(ownerEvidencePrepPanel.getByText(/6 owner actions/i), 'trust owner evidence prep action count');
  await assertVisible(ownerEvidencePrepPanel.getByText(/redacted readiness only/i), 'trust owner evidence prep redaction badge');
  await assertVisible(ownerEvidencePrepPanel.getByText(/stripe test checkout env/i), 'trust owner evidence prep stripe item');
  await assertVisible(
    ownerEvidencePrepPanel.getByText(/Provide explicit STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY/i),
    'trust owner evidence prep stripe guidance',
  );
  await assertVisible(ownerEvidencePrepPanel.locator('[data-owner-evidence-prep-readiness-download="true"]'), 'owner evidence prep CSV export');
  const ownerEvidenceCommandChecklistPanel = page.locator('[data-proof-visibility="owner-evidence-command-checklist"]');
  await assertVisible(ownerEvidenceCommandChecklistPanel, 'trust owner evidence command checklist');
  await verifyOwnerEvidenceCommandChecklist(ownerEvidenceCommandChecklistPanel);
  const ownerEvidenceCompletionPanel = page.locator('[data-proof-visibility="owner-evidence-completion-drill"]');
  await assertVisible(ownerEvidenceCompletionPanel, 'trust owner evidence completion drill');
  await assertVisible(ownerEvidenceCompletionPanel.getByText(/Owner evidence completion drill/i), 'trust owner evidence completion drill heading');
  await assertVisible(ownerEvidenceCompletionPanel.getByText(/status=owner_evidence_required/i), 'trust owner evidence completion drill status');
  await assertVisible(ownerEvidenceCompletionPanel.getByText(/goalComplete=false/i), 'trust owner evidence completion drill goal boundary');
  await assertVisible(ownerEvidenceCompletionPanel.getByText(/5 blocked gates/i), 'trust owner evidence completion drill blocked count');
  await assertVisible(ownerEvidenceCompletionPanel.getByText(/6 owner-prep actions/i), 'trust owner evidence completion drill prep count');
  await assertVisible(ownerEvidenceCompletionPanel.getByText(/5 matrix rows/i), 'trust owner evidence completion drill row count');
  await assertVisible(ownerEvidenceCompletionPanel.getByText(/verify:owner-evidence-completion-drill/i), 'trust owner evidence completion drill verifier');
  await assertVisible(ownerEvidenceCompletionPanel.getByText(/live_proof_run/i).first(), 'trust owner evidence completion drill live packet');
  await assertVisible(ownerEvidenceCompletionPanel.getByText(/commercial_evidence_intake/i).first(), 'trust owner evidence completion drill commercial packet');
  await assertVisible(ownerEvidenceCompletionPanel.getByText(/manual_wcag_review/i).first(), 'trust owner evidence completion drill manual WCAG packet');
  await assertVisible(ownerEvidenceCompletionPanel.getByText(/stripe-test-checkout-proof-latest\.json/i).first(), 'trust owner evidence completion drill stripe artifact');
  await assertVisible(ownerEvidenceCompletionPanel.locator('[data-owner-evidence-completion-drill-blockers="true"]').first(), 'trust owner evidence completion drill blocker detail block');
  await assertVisible(ownerEvidenceCompletionPanel.locator('[data-owner-evidence-completion-drill-download="true"]'), 'owner evidence completion drill CSV export');
  const ownerOperationalAccessPanel = page.locator('[data-proof-visibility="owner-operational-access-prerequisites"]');
  await assertVisible(ownerOperationalAccessPanel, 'trust owner operational access prerequisites');
  await assertVisible(ownerOperationalAccessPanel.getByText(/Operational access prerequisites/i), 'trust owner operational access heading');
  await assertVisible(ownerOperationalAccessPanel.getByText(/1 access item/i), 'trust owner operational access item count');
  await assertVisible(ownerOperationalAccessPanel.getByText(/supabase-target-project-visible/i), 'trust owner operational access target-project blocker');
  await assertVisible(ownerOperationalAccessPanel.getByText(/supabase-functions-api-accessible/i), 'trust owner operational access functions-api blocker');
  await verifyOwnerOperationalAccessCommands(ownerOperationalAccessPanel);
  const ownerEvidenceHandoffPanel = page.locator('[data-proof-visibility="owner-evidence-handoff-packet"]');
  await assertVisible(ownerEvidenceHandoffPanel, 'trust owner evidence handoff packet');
  await assertVisible(ownerEvidenceHandoffPanel.getByText(/Owner evidence handoff packet/i), 'trust owner evidence handoff heading');
  await assertVisible(ownerEvidenceHandoffPanel.getByText(/goalComplete=false/i), 'trust owner evidence handoff goal boundary');
  await assertVisible(ownerEvidenceHandoffPanel.getByText(/5 handoff rows/i), 'trust owner evidence handoff row count');
  await assertVisible(ownerEvidenceHandoffPanel.getByText(/aligned with canonical ledgers/i), 'trust owner evidence handoff alignment badge');
  await assertVisible(ownerEvidenceHandoffPanel.getByText(/verify:owner-evidence-handoff-alignment/i), 'trust owner evidence handoff verifier');
  await assertVisible(ownerEvidenceHandoffPanel.locator('[data-owner-evidence-handoff-blockers="true"]').first(), 'trust owner evidence handoff blocker detail block');
  await assertVisible(ownerEvidenceHandoffPanel.locator('[data-owner-evidence-handoff-failure-details="true"]').first(), 'trust owner evidence handoff failure detail block');
  await assertVisible(ownerEvidenceHandoffPanel.getByText(/Redacted failure detail/i).first(), 'trust owner evidence handoff failure detail heading');
  await assertVisible(ownerEvidenceHandoffPanel.getByText(/proofArtifactHashes must contain at least one non-placeholder sha256 hash/i).first(), 'trust owner evidence handoff commercial failure detail');
  await assertVisible(ownerEvidenceHandoffPanel.locator('[data-owner-evidence-handoff-download="true"]'), 'owner evidence handoff CSV export');
  await assertVisible(page.getByRole('button', { name: /Download trust packet/i }), 'trust packet export');
  await assertVisible(page.getByRole('button', { name: /Download risk CSV/i }), 'risk CSV export');
  await assertVisible(page.getByRole('button', { name: /Download acceptance checklist/i }), 'acceptance checklist CSV export');

  const trustDownloadPromise = page.waitForEvent('download', { timeout: INTERACTION_TIMEOUT_MS });
  await page.getByRole('button', { name: /Download trust packet/i }).click();
  const trustDownload = await trustDownloadPromise;
  if (!trustDownload.suggestedFilename().includes('ai-work-transition-trust-packet')) {
    throw new Error(`Unexpected trust-center HTML filename: ${trustDownload.suggestedFilename()}`);
  }
  const trustHtml = await readDownloadBody(trustDownload, 'Trust-center HTML');
  for (const expected of [
    'data-institutional-readiness-packet="true"',
    'Institutional Risk Register',
    'AI RMF Control Map',
    'Employment Decision Boundary',
    'WCAG 2.2 Accessibility Gate',
    'Manual WCAG Evidence Worksheet',
    'Buyer Acceptable-Use Signoff Checklist',
    'Does not prove',
  ]) {
    if (!trustHtml.includes(expected)) {
      throw new Error(`Trust-center HTML is missing ${expected}`);
    }
  }
  console.log('ok download - trust center HTML');

  const riskCsvDownloadPromise = page.waitForEvent('download', { timeout: INTERACTION_TIMEOUT_MS });
  await page.getByRole('button', { name: /Download risk CSV/i }).click();
  const riskCsvDownload = await riskCsvDownloadPromise;
  if (!riskCsvDownload.suggestedFilename().includes('ai-work-transition-risk-register')) {
    throw new Error(`Unexpected trust-center CSV filename: ${riskCsvDownload.suggestedFilename()}`);
  }
  const riskCsvBody = await readDownloadBody(riskCsvDownload, 'Trust-center risk CSV');
  for (const expectedColumn of ['risk_id', 'source_ids', 'confidence', 'review_state', 'caveat', 'does_not_prove', 'next_action']) {
    if (!riskCsvBody.includes(expectedColumn)) {
      throw new Error(`Trust-center risk CSV is missing ${expectedColumn}`);
    }
  }
  console.log('ok download - trust center risk CSV');

  const acceptanceCsvDownloadPromise = page.waitForEvent('download', { timeout: INTERACTION_TIMEOUT_MS });
  await page.getByRole('button', { name: /Download acceptance checklist/i }).click();
  const acceptanceCsvDownload = await acceptanceCsvDownloadPromise;
  if (!acceptanceCsvDownload.suggestedFilename().includes('ai-work-transition-acceptance-checklist')) {
    throw new Error(`Unexpected trust-center acceptance CSV filename: ${acceptanceCsvDownload.suggestedFilename()}`);
  }
  const acceptanceCsvBody = await readDownloadBody(acceptanceCsvDownload, 'Trust-center acceptance checklist CSV');
  for (const expectedColumn of ['checklist_type', 'item_id', 'current_or_required_proof', 'reviewer_or_owner', 'status', 'does_not_prove']) {
    if (!acceptanceCsvBody.includes(expectedColumn)) {
      throw new Error(`Trust-center acceptance checklist CSV is missing ${expectedColumn}`);
    }
  }
  for (const expectedValue of ['manual_wcag_evidence', 'buyer_acceptable_use_signoff']) {
    if (!acceptanceCsvBody.includes(expectedValue)) {
      throw new Error(`Trust-center acceptance checklist CSV is missing ${expectedValue}`);
    }
  }
  console.log('ok download - trust center acceptance checklist CSV');

  const ownerPrepCsvDownloadPromise = page.waitForEvent('download', { timeout: INTERACTION_TIMEOUT_MS });
  await ownerEvidencePrepPanel.locator('[data-owner-evidence-prep-readiness-download="true"]').click();
  const ownerPrepCsvDownload = await ownerPrepCsvDownloadPromise;
  if (!ownerPrepCsvDownload.suggestedFilename().includes('owner-evidence-prep-readiness.csv')) {
    throw new Error(`Unexpected owner evidence prep CSV filename: ${ownerPrepCsvDownload.suggestedFilename()}`);
  }
  const ownerPrepCsvBody = await readDownloadBody(ownerPrepCsvDownload, 'Owner evidence prep CSV');
  for (const expectedColumn of ['item_id', 'track', 'status', 'owner_action', 'source', 'next_command', 'does_not_prove']) {
    if (!ownerPrepCsvBody.includes(expectedColumn)) {
      throw new Error(`Owner evidence prep CSV is missing ${expectedColumn}`);
    }
  }
  for (const expectedItemId of [
    'stripe_test_checkout_env',
    'live_mrr_env',
    'commercial_intake_placeholders',
    'manual_wcag_evidence_missing',
    'stripe_test_checkout_artifact_failed',
    'stripe_live_mrr_artifact_failed',
  ]) {
    if (!ownerPrepCsvBody.includes(expectedItemId)) {
      throw new Error(`Owner evidence prep CSV is missing ${expectedItemId}`);
    }
  }
  const ownerPrepCsvRows = ownerPrepCsvBody.trim().split(/\r?\n/);
  if (ownerPrepCsvRows.length !== 7) {
    throw new Error(`Owner evidence prep CSV should include one header and six owner-action rows; got ${ownerPrepCsvRows.length} row(s).`);
  }
  console.log('ok download - trust center owner evidence prep CSV');

  const ownerCompletionCsvDownloadPromise = page.waitForEvent('download', { timeout: INTERACTION_TIMEOUT_MS });
  await ownerEvidenceCompletionPanel.locator('[data-owner-evidence-completion-drill-download="true"]').click();
  const ownerCompletionCsvDownload = await ownerCompletionCsvDownloadPromise;
  if (!ownerCompletionCsvDownload.suggestedFilename().includes('owner-evidence-completion-matrix-latest.csv')) {
    throw new Error(`Unexpected owner evidence completion drill CSV filename: ${ownerCompletionCsvDownload.suggestedFilename()}`);
  }
  const ownerCompletionCsvBody = await readDownloadBody(ownerCompletionCsvDownload, 'Owner evidence completion drill CSV');
  for (const expectedColumn of [
    'order',
    'gate_id',
    'track',
    'status',
    'completion_state',
    'packet_type',
    'packet_status',
    'packet_markdown',
    'packet_csv',
    'expected_proof_artifact',
    'accepted_when',
    'acceptance_verifier_command',
    'repo_does_not_do',
  ]) {
    if (!ownerCompletionCsvBody.includes(expectedColumn)) {
      throw new Error(`Owner evidence completion drill CSV is missing ${expectedColumn}`);
    }
  }
  for (const expectedGateId of [
    'manual_wcag_evidence',
    'real_stripe_test_checkout',
    'live_mrr_gt_zero',
    'three_committed_partners',
    'documented_outcomes',
  ]) {
    if (!ownerCompletionCsvBody.includes(expectedGateId)) {
      throw new Error(`Owner evidence completion drill CSV is missing ${expectedGateId}`);
    }
  }
  const ownerCompletionCsvRows = ownerCompletionCsvBody.trim().split(/\r?\n/);
  if (ownerCompletionCsvRows.length !== 6) {
    throw new Error(`Owner evidence completion drill CSV should include one header and five gate rows; got ${ownerCompletionCsvRows.length} row(s).`);
  }
  console.log('ok download - trust center owner evidence completion drill CSV');

  const ownerHandoffCsvDownloadPromise = page.waitForEvent('download', { timeout: INTERACTION_TIMEOUT_MS });
  await ownerEvidenceHandoffPanel.locator('[data-owner-evidence-handoff-download="true"]').click();
  const ownerHandoffCsvDownload = await ownerHandoffCsvDownloadPromise;
  if (!ownerHandoffCsvDownload.suggestedFilename().includes('owner-evidence-handoff-latest.csv')) {
    throw new Error(`Unexpected owner evidence handoff CSV filename: ${ownerHandoffCsvDownload.suggestedFilename()}`);
  }
  const ownerHandoffCsvBody = await readDownloadBody(ownerHandoffCsvDownload, 'Owner evidence handoff CSV');
  for (const expectedColumn of [
    'gate_id',
    'track',
    'status',
    'owner_action',
    'owner_prep_command',
    'blocking_owner_actions',
    'next_command',
    'closeout_steps',
    'closeout_failure_details',
    'raw_evidence_policy',
    'repo_does_not_do',
  ]) {
    if (!ownerHandoffCsvBody.includes(expectedColumn)) {
      throw new Error(`Owner evidence handoff CSV is missing ${expectedColumn}`);
    }
  }
  for (const expectedGateId of [
    'manual_wcag_evidence',
    'real_stripe_test_checkout',
    'live_mrr_gt_zero',
    'three_committed_partners',
    'documented_outcomes',
  ]) {
    if (!ownerHandoffCsvBody.includes(expectedGateId)) {
      throw new Error(`Owner evidence handoff CSV is missing ${expectedGateId}`);
    }
  }
  const ownerHandoffCsvRows = ownerHandoffCsvBody.trim().split(/\r?\n/);
  if (ownerHandoffCsvRows.length !== 6) {
    throw new Error(`Owner evidence handoff CSV should include one header and five gate rows; got ${ownerHandoffCsvRows.length} row(s).`);
  }
  console.log('ok download - trust center owner evidence handoff CSV');
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
  await assertVisible(page.getByRole('heading', { name: /Accountant.*Automation Defense Estimate/i }), '/automation-risk/accountant heading');

  const downloadButton = page.getByRole('button', { name: /Download PDF/i });
  await page.getByPlaceholder('your@email.com').fill('pilot-reader@example.com');
  await assertButtonDisabled(downloadButton, 'SEO report download without consent');

  await page.locator('#seo-report-consent-accountant').click();
  await assertButtonEnabled(downloadButton, 'SEO report download after consent');

  const popupPromise = page.waitForEvent('popup', { timeout: INTERACTION_TIMEOUT_MS });
  await downloadButton.click();
  await verifyPopupReport(
    popupPromise,
    ['Automation Defense Estimate', 'Human Review Workflow', 'Client Delivery Readiness', 'Weight basis', 'O*NET Task Ratings', 'Changing', 'Unknown', 'Source caveat', 'Role validation', 'Needs posting validation', 'Learning And Provider Boundary', 'Local Labor-Market Proof Appendix', 'bls-laus'],
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
  await assertVisible(page.locator('[data-launch-readiness-command-center="true"]'), 'launch readiness command center');
  await assertVisible(page.getByText(/Live governance closeout/i), 'launch readiness governance row');
  await assertVisible(page.getByText(/Payment proof/i).first(), 'launch readiness payment proof');
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
  await assertVisible(page.locator('[data-local-market-snapshot-gallery="true"]'), 'local market snapshot packet');
  await assertVisible(page.getByRole('button', { name: /Snapshot HTML/i }), 'local market snapshot HTML export');
  await assertVisible(page.getByRole('button', { name: /Snapshot CSV/i }), 'local market snapshot CSV export');
  await assertVisible(page.locator('[data-local-market-snapshot-row]').first(), 'local market snapshot row');
  await assertVisible(page.getByText(/Local market snapshot pack/i), 'local market snapshot title');
  await assertVisible(page.getByText(/CRM import pack/i), 'CRM import pack');
  await assertVisible(page.getByRole('button', { name: /CRM CSV/i }), 'CRM CSV export');
  await assertVisible(page.getByText(/Planning artifact only/i).first(), 'gallery planning-only boundary');
  await assertVisible(page.locator('[data-phase6-evidence-cards="true"]'), 'phase 6 evidence cards');
  await assertVisible(page.locator('[data-phase6-evidence-card="true"]').first(), 'phase 6 evidence card item');
  await assertVisible(page.getByText(/DOL AI literacy framework/i).first(), 'DOL AI literacy source');
  await assertVisible(page.getByText(/Does not prove:/i).first(), 'gallery evidence does-not-prove field');
  await assertVisible(page.locator('[data-outreach-functionality-assessment="true"]'), 'outreach functionality assessment');
  await assertVisible(page.getByText(/1 = idea, 5 = market-ready/i), 'outreach maturity scale');
  await assertVisible(page.getByText(/Coach-branded sample reports/i), 'coach outreach function row');
  await assertVisible(page.getByText(/Resume work-transition proof report/i), 'resume outreach function row');
  await assertVisible(page.getByText(/Lead capture and lead ops/i), 'lead ops outreach function row');
  const outreachPhasePlan = page.locator('[data-outreach-phase-plan="true"]');
  await assertVisible(outreachPhasePlan, 'outreach phase plan');
  await assertVisible(outreachPhasePlan.getByText('2. Founder-led validation'), 'outreach founder validation phase');
  await assertVisible(outreachPhasePlan.getByText('5. Scaled outreach'), 'outreach scaled phase');
  await assertVisible(page.locator('[data-pilot-validation-tracker="true"]'), 'pilot validation evidence tracker');
  await assertVisible(page.getByRole('button', { name: /Validation CSV/i }), 'pilot validation CSV export');
  await assertVisible(page.locator('[data-pilot-validation-target]').first(), 'pilot validation target');
  await assertVisible(page.locator('[data-pilot-validation-worksheet-column]').first(), 'pilot validation worksheet column');
  await assertVisible(page.locator('[data-payment-fulfillment-status="true"]'), 'payment fulfillment status panel');
  await assertVisible(page.getByText(/Report-credit checkout/i), 'report credit checkout status');
  await assertVisible(page.getByText(/Stripe webhook fulfillment/i), 'stripe webhook fulfillment status');
  await assertVisible(page.locator('[data-outreach-sequence-builder="true"]'), 'outreach sequence builder');
  await assertVisible(page.getByText(/Career coach/i).first(), 'coach outreach sequence');
  await assertVisible(page.locator('[data-source-freshness-dashboard="true"]'), 'source freshness dashboard');
  await assertVisible(page.getByText(/O\*NET task ratings/i).first(), 'source freshness O*NET row');
  await assertVisible(page.locator('[data-manual-wcag-evidence-workspace="true"]'), 'manual WCAG evidence workspace');
  await assertVisible(page.getByText(/Keyboard-only path/i), 'manual WCAG keyboard checkpoint');
  await assertVisible(page.locator('[data-pilot-feedback-capture="true"]'), 'pilot feedback capture');
  await assertVisible(page.getByText(/Paid pilot signal/i), 'pilot feedback paid signal');
  await assertVisible(page.locator('[data-buyer-landing-roadmap="true"]'), 'buyer landing roadmap');
  const commercialLaunchGate = page.locator('[data-commercial-launch-gate="true"]');
  await assertVisible(commercialLaunchGate, 'commercial outreach launch gate');
  await assertVisible(commercialLaunchGate.getByText(/Auth live E2E secrets/i), 'launch gate auth secret row');
  await assertVisible(commercialLaunchGate.getByText(/Public\/no-JWT function review/i), 'launch gate public function row');
  await assertVisible(commercialLaunchGate.getByRole('cell', { name: 'Payment fulfillment' }), 'launch gate payment fulfillment row');
  await assertVisible(page.locator('[data-function-security-review="true"]'), 'function security review');
  await assertVisible(page.getByText(/Commercial core with JWT/i), 'function security commercial core group');
  await assertVisible(page.locator('[data-supabase-function-governance="true"]'), 'supabase function governance section');
  await assertVisible(page.getByText(/Owner approval required before deletion/i), 'function governance owner approval boundary');
  await assertVisible(page.locator('[data-public-function-classification-count="true"]'), 'public function classification count');
  await assertVisible(page.getByText(/20\/20 public\/no-JWT classified/i), 'all public functions classified');
  await assertVisible(page.locator('[data-retirement-required-evidence="true"]').first(), 'retirement required evidence checklist');
  await assertVisible(page.locator('[data-public-function-required-evidence="true"]').first(), 'public function required evidence checklist');
  await assertVisible(page.locator('[data-public-function-launch-decision="true"]').first(), 'public function launch decision');
  await assertVisible(page.getByText(/stripe-checkout/i).first(), 'stripe checkout retirement candidate');
  await assertVisible(page.getByText(/stripe-portal/i).first(), 'stripe portal retirement candidate');
  await assertVisible(page.getByText(/market-intelligence/i).first(), 'market intelligence function classification');
  await assertVisible(page.getByText(/generate-executive-report/i).first(), 'executive report function classification');
  await assertVisible(page.getByText(/hris-sync/i).first(), 'HRIS sync function classification');

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

  const validationDownloadPromise = page.waitForEvent('download', { timeout: INTERACTION_TIMEOUT_MS });
  await page.getByRole('button', { name: /Validation CSV/i }).click();
  const validationDownload = await validationDownloadPromise;
  if (!validationDownload.suggestedFilename().includes('pilot-validation-worksheet')) {
    throw new Error(`Unexpected pilot validation CSV filename: ${validationDownload.suggestedFilename()}`);
  }
  const validationCsvBody = await validationDownload.createReadStream().then(async (stream) => {
    if (!stream) {
      throw new Error('Pilot validation CSV stream was unavailable');
    }
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  });
  for (const expectedColumn of ['buyer_segment', 'proof_artifact_reviewed', 'usefulness_score_1_to_5', 'paid_pilot_signal', 'decision_boundary_confirmed', 'does_not_prove']) {
    if (!validationCsvBody.includes(expectedColumn)) {
      throw new Error(`Pilot validation CSV is missing ${expectedColumn}`);
    }
  }
  console.log('ok download - pilot validation CSV');

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

  const snapshotHtmlDownloadPromise = page.waitForEvent('download', { timeout: INTERACTION_TIMEOUT_MS });
  await page.getByRole('button', { name: /Snapshot HTML/i }).click();
  const snapshotHtmlDownload = await snapshotHtmlDownloadPromise;
  if (!snapshotHtmlDownload.suggestedFilename().includes('local-labor-market-snapshot-pack')) {
    throw new Error(`Unexpected local market snapshot HTML filename: ${snapshotHtmlDownload.suggestedFilename()}`);
  }
  const snapshotHtml = await snapshotHtmlDownload.createReadStream().then(async (stream) => {
    if (!stream) throw new Error('Local market snapshot HTML stream was unavailable');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  });
  for (const expected of [
    'data-local-labor-market-snapshot="true"',
    'Local Labor-Market Snapshot Packet',
    'BLS OEWS wage and employment context',
    'CareerOneStop occupation and training cross-check',
    'Does not prove',
  ]) {
    if (!snapshotHtml.includes(expected)) {
      throw new Error(`Local market snapshot HTML is missing ${expected}`);
    }
  }
  console.log('ok download - local market snapshot HTML');

  const snapshotCsvDownloadPromise = page.waitForEvent('download', { timeout: INTERACTION_TIMEOUT_MS });
  await page.getByRole('button', { name: /Snapshot CSV/i }).click();
  const snapshotCsvDownload = await snapshotCsvDownloadPromise;
  if (!snapshotCsvDownload.suggestedFilename().includes('local-labor-market-snapshot-sources')) {
    throw new Error(`Unexpected local market snapshot CSV filename: ${snapshotCsvDownload.suggestedFilename()}`);
  }
  const snapshotCsvBody = await snapshotCsvDownload.createReadStream().then(async (stream) => {
    if (!stream) throw new Error('Local market snapshot CSV stream was unavailable');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8');
  });
  for (const expectedColumn of [
    'snapshot_id',
    'source_id',
    'required_buyer_input',
    'required_source_metadata',
    'validation_status',
    'review_state',
    'does_not_prove',
  ]) {
    if (!snapshotCsvBody.includes(expectedColumn)) {
      throw new Error(`Local market snapshot CSV is missing ${expectedColumn}`);
    }
  }
  console.log('ok download - local market snapshot CSV');
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
    if (url.includes('/functions/v1/parse-resume')) {
      await route.fulfill({
        status: route.request().method() === 'OPTIONS' ? 204 : 200,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
          'access-control-allow-methods': 'POST, OPTIONS',
          'content-type': 'application/json',
        },
        body: route.request().method() === 'OPTIONS' ? '' : JSON.stringify({
          success: true,
          extracted_text: 'Server parsed resume text with human judgment, AI-assisted analytics QA, stakeholder communication, and exception handling.',
          parser_receipt: {
            receiptId: 'parser-receipt-browser-smoke',
            detectedFileKind: 'txt',
            rawFileStored: false,
            rawResumeTextStored: false,
            productionPdfDocxParser: false,
            tempFileDeletionStatus: 'not_persisted',
            sourceIds: ['owasp-file-upload', 'supabase-edge-functions', 'nist-ai-rmf', 'ada-ai-hiring-guidance'],
            caveat: 'Browser smoke parser mock; live parser deployment remains separately verified.',
            doesNotProve: 'Does not prove malware scanning or full PDF/DOCX extraction.',
          },
        }),
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
    await verifyCommercialTrustCenter(page, baseUrl);
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
