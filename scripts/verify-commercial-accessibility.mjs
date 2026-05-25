#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

const HOST = '127.0.0.1';
const START_PORT = 5176;
const STARTUP_TIMEOUT_MS = 30_000;
const SERVER_PROBE_TIMEOUT_MS = 3_000;
const ROUTE_TIMEOUT_MS = 45_000;
const BROWSER_LAUNCH_TIMEOUT_MS = 60_000;
const AUDIT_OUTPUT_DIR = 'docs/commercialization';
const AUDIT_JSON_OUTPUT = `${AUDIT_OUTPUT_DIR}/commercial-accessibility-audit-latest.json`;
const AUDIT_MD_OUTPUT = `${AUDIT_OUTPUT_DIR}/commercial-accessibility-audit-latest.md`;

const routes = [
  { path: '/privacy', label: 'privacy policy' },
  { path: '/for-coaches', label: 'coach landing page' },
  { path: '/sample-report', label: 'coach sample report' },
  { path: '/tools/resume-analyzer', label: 'resume analyzer' },
  { path: '/tools/counselor-reports', label: 'counselor reports' },
  { path: '/enterprise-dashboard', label: 'workforce dashboard' },
  { path: '/proof-pack-gallery', label: 'proof-pack gallery' },
  { path: '/automation-risk/accountant', label: 'occupation SEO report' },
];

const viewports = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1100 },
];

const officialReferences = [
  {
    label: 'WCAG 2.2 Recommendation',
    url: 'https://www.w3.org/TR/WCAG22/',
    use: 'Target standard for commercial route accessibility checks and manual audit notes.',
  },
  {
    label: 'WCAG-EM overview',
    url: 'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/',
    use: 'Evaluation-methodology structure for scope, target conformance level, sampling, audit results, and reporting.',
  },
  {
    label: 'WCAG-EM 2.0 draft',
    url: 'https://www.w3.org/TR/wcag-em-2/',
    use: 'Current W3C methodology draft for optional conformance claims and report structure.',
  },
  {
    label: 'WAI Easy Checks',
    url: 'https://www.w3.org/WAI/test-evaluate/preliminary/',
    use: 'Preliminary manual checks for headings, labels, keyboard access, visible focus, forms, and contrast.',
  },
  {
    label: 'WAI-ARIA Authoring Practices',
    url: 'https://www.w3.org/WAI/ARIA/apg/',
    use: 'Manual interaction-pattern review for dynamic widgets, names, roles, states, and keyboard behavior.',
  },
];

const manualReviewChecklist = [
  {
    id: 'wcag-em-scope',
    status: 'manual_required',
    source: 'WCAG-EM',
    criteria: ['Evaluation scope', 'Target conformance level', 'Representative route sample', 'User-agent and assistive-technology context'],
    evidenceNeeded: 'Document evaluator, browser, assistive technology, routes, states, and target WCAG 2.2 A/AA scope before any conformance statement.',
  },
  {
    id: 'focus-not-obscured',
    status: 'manual_required',
    source: 'WCAG 2.2',
    criteria: ['2.4.7 Focus Visible', '2.4.11 Focus Not Obscured (Minimum)', '2.4.12 Focus Not Obscured (Enhanced)'],
    evidenceNeeded: 'Tab through sticky navigation, modals, report popups, downloadable artifacts, and long forms at mobile/tablet/desktop sizes and capture obscured-focus issues.',
  },
  {
    id: 'target-size',
    status: 'manual_required',
    source: 'WCAG 2.2',
    criteria: ['2.5.5 Target Size (Enhanced)', '2.5.8 Target Size (Minimum)'],
    evidenceNeeded: 'Measure compact links, icon buttons, table actions, form controls, and mobile CTA clusters for pointer target size or spacing exceptions.',
  },
  {
    id: 'redundant-entry-and-errors',
    status: 'manual_required',
    source: 'WCAG 2.2 / WAI Easy Checks',
    criteria: ['3.3.1 Error Identification', '3.3.2 Labels or Instructions', '3.3.7 Redundant Entry'],
    evidenceNeeded: 'Exercise lead capture, coach sample, resume analyzer, workforce CSV, and counselor forms with missing/invalid values and verify labels, instructions, recovery, and no unnecessary re-entry.',
  },
  {
    id: 'accessible-authentication',
    status: 'manual_required',
    source: 'WCAG 2.2',
    criteria: ['3.3.8 Accessible Authentication (Minimum)', '3.3.9 Accessible Authentication (Enhanced)'],
    evidenceNeeded: 'Review sign-in/payment/account flows before institutional pilots; prove there is no cognitive-function test without an accessible alternative.',
  },
  {
    id: 'screen-reader-and-name-role-value',
    status: 'manual_required',
    source: 'WAI-ARIA Authoring Practices',
    criteria: ['4.1.2 Name, Role, Value', '1.3.1 Info and Relationships', '2.1.1 Keyboard'],
    evidenceNeeded: 'Use a screen reader to review menus, dialogs, generated reports, evidence cards, CSV/HTML download controls, and dynamic status messages.',
  },
  {
    id: 'contrast-and-reflow',
    status: 'manual_required',
    source: 'WCAG 2.2 / WAI Easy Checks',
    criteria: ['1.4.3 Contrast (Minimum)', '1.4.10 Reflow', '1.4.11 Non-text Contrast', '1.4.12 Text Spacing'],
    evidenceNeeded: 'Run color contrast and text-spacing checks on commercial cards, badges, alerts, charts, downloadable HTML, and dark-theme surfaces.',
  },
];

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
        'Unable to launch Playwright Chromium. ' +
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
    if (
      text.includes('supabase-disabled.invalid') ||
      text.includes('Failed to load resource') ||
      text.includes('net::ERR_NAME_NOT_RESOLVED') ||
      text.includes('net::ERR_FAILED')
    ) {
      return;
    }
    issues.push(`console error: ${text}`);
  });

  page.on('pageerror', (error) => {
    issues.push(`page error: ${error.message}`);
  });

  return issues;
}

function renderAuditMarkdown(audit) {
  const tableCell = (value) => String(value).replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim();
  const routeRows = audit.routeResults.map((result) =>
    `| \`${result.path}\` | ${tableCell(result.label)} | ${tableCell(result.viewport)} | ${tableCell(result.heading)} | ${result.interactiveCount} | ${result.bodyLength} | ${result.keyboardTabStopsChecked ?? 'n/a'} | pass |`
  );
  const checklistRows = audit.manualReviewChecklist.map((item) =>
    `| \`${item.id}\` | ${tableCell(item.source)} | ${item.criteria.map(tableCell).join('<br/>')} | ${tableCell(item.status)} | ${tableCell(item.evidenceNeeded)} |`
  );
  const referenceRows = audit.officialReferences.map((item) => `- [${item.label}](${item.url}) - ${item.use}`);

  return `# Commercial WCAG 2.2 Accessibility Audit Packet

Generated: ${audit.generatedAt}
Target: ${audit.target}
Status: **${audit.status}**

## Boundary

${audit.boundary}

## Automated Smoke Results

| Route | Label | Viewport | H1 | Controls | Visible Text Length | Keyboard Tab Stops Checked | Result |
|---|---|---|---|---:|---:|---:|---|
${routeRows.join('\n')}

## Manual WCAG 2.2 Review Checklist

These rows are required before any institutional delivery or WCAG conformance statement.

| Check | Source | Criteria | Status | Evidence Needed |
|---|---|---|---|---|
${checklistRows.join('\n')}

## Official References

${referenceRows.join('\n')}
`;
}

async function writeAuditArtifacts(audit) {
  await mkdir(AUDIT_OUTPUT_DIR, { recursive: true });
  await writeFile(AUDIT_JSON_OUTPUT, `${JSON.stringify(audit, null, 2)}\n`);
  await writeFile(AUDIT_MD_OUTPUT, renderAuditMarkdown(audit));
  console.log(`wrote ${AUDIT_JSON_OUTPUT}`);
  console.log(`wrote ${AUDIT_MD_OUTPUT}`);
}

async function evaluateCommercialAccessibility(page, route, viewportName) {
  const result = await page.evaluate(() => {
    const isVisible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    };

    const textFor = (element) => {
      const labelledBy = element.getAttribute('aria-labelledby');
      const labelText = labelledBy
        ? labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.innerText || '')
          .join(' ')
        : '';

      const explicitLabel = element.id
        ? document.querySelector(`label[for="${CSS.escape(element.id)}"]`)?.textContent || ''
        : '';

      return [
        element.getAttribute('aria-label'),
        labelText,
        explicitLabel,
        element.getAttribute('title'),
        element.textContent,
        element.getAttribute('value'),
        element.getAttribute('placeholder'),
      ]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const issues = [];
    const main = document.querySelector('main, [role="main"]');
    if (!main) issues.push('missing main landmark');

    const h1s = Array.from(document.querySelectorAll('h1')).filter(isVisible);
    if (h1s.length !== 1) issues.push(`expected exactly one visible h1, found ${h1s.length}`);

    const bodyText = document.body?.innerText?.replace(/\s+/g, ' ').trim() || '';
    if (bodyText.length < 80) issues.push('page body rendered with too little visible text');

    const overflowPx = Math.ceil(document.documentElement.scrollWidth - window.innerWidth);
    if (overflowPx > 16) {
      const offenders = Array.from(document.body.querySelectorAll('*'))
        .filter((element) => {
          if (!(element instanceof HTMLElement)) return false;
          if (!isVisible(element)) return false;
          const rect = element.getBoundingClientRect();
          return rect.right > window.innerWidth + 16 || rect.left < -16;
        })
        .slice(0, 3)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return `${element.tagName.toLowerCase()} ${element.className || ''} (${Math.round(rect.left)}..${Math.round(rect.right)})`;
        });
      issues.push(`horizontal overflow ${overflowPx}px${offenders.length ? `; offenders: ${offenders.join(' | ')}` : ''}`);
    }

    const interactive = Array.from(
      document.querySelectorAll('a[href], button, input, textarea, select, [role="button"], [role="link"]')
    ).filter((element) => element instanceof HTMLElement && isVisible(element) && !element.hasAttribute('aria-hidden'));

    const nameless = interactive
      .filter((element) => textFor(element).length === 0)
      .slice(0, 6)
      .map((element) => `${element.tagName.toLowerCase()}#${element.id || 'no-id'}.${String(element.className || '').split(/\s+/).filter(Boolean).slice(0, 3).join('.')}`);

    if (nameless.length > 0) {
      issues.push(`interactive controls missing accessible names: ${nameless.join(', ')}`);
    }

    return {
      issues,
      heading: h1s[0]?.innerText?.trim() || '',
      bodyLength: bodyText.length,
      interactiveCount: interactive.length,
    };
  });

  if (result.issues.length > 0) {
    throw new Error(`${route.path} ${viewportName} failed accessibility smoke:\n${result.issues.map((issue) => `- ${issue}`).join('\n')}`);
  }

  console.log(
    `ok ${route.path} ${viewportName} - h1="${result.heading}" controls=${result.interactiveCount} text=${result.bodyLength}`
  );

  return {
    path: route.path,
    label: route.label,
    viewport: viewportName,
    heading: result.heading,
    bodyLength: result.bodyLength,
    interactiveCount: result.interactiveCount,
    automatedChecks: [
      'one visible h1',
      'main landmark present',
      'visible body text present',
      'no horizontal overflow above tolerance',
      'interactive controls have accessible names',
    ],
    result: 'pass',
  };
}

async function verifyKeyboardFocus(page, route) {
  const result = await page.evaluate(() => {
    const candidates = Array.from(
      document.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')
    )
      .filter((element) => element instanceof HTMLElement)
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
      });

    return { count: candidates.length };
  });

  if (result.count === 0) {
    throw new Error(`${route.path} has no visible focusable controls`);
  }

  for (let index = 0; index < Math.min(5, result.count); index += 1) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement)) return null;
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return {
        tag: element.tagName.toLowerCase(),
        id: element.id,
        text: (element.innerText || element.getAttribute('aria-label') || element.getAttribute('placeholder') || '').trim().slice(0, 60),
        visible: style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0,
      };
    });

    if (!focused?.visible) {
      throw new Error(`${route.path} tab stop ${index + 1} did not land on a visible control`);
    }
  }

  console.log(`ok ${route.path} keyboard - first ${Math.min(5, result.count)} tab stops visible`);

  return {
    focusableCount: result.count,
    keyboardTabStopsChecked: Math.min(5, result.count),
    result: 'pass',
  };
}

async function runChecks(baseUrl) {
  console.log('launching Playwright browser for commercial accessibility smoke');
  const browser = await launchCommercialBrowser();
  const routeResults = [];

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        ignoreHTTPSErrors: true,
      });

      await context.route('**/*', async (route) => {
        const url = route.request().url();
        if (
          url.includes('supabase-disabled.invalid') ||
          url.includes('m.stripe.com') ||
          url.includes('m.stripe.network') ||
          url.includes('js.stripe.com') ||
          url.includes('fonts.gstatic.com') ||
          url.includes('fonts.googleapis.com')
        ) {
          await route.abort('failed');
          return;
        }
        await route.continue();
      });

      const page = await context.newPage();
      const pageIssues = createPageIssueCollector(page);

      for (const route of routes) {
        await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded', timeout: ROUTE_TIMEOUT_MS });
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
        const routeResult = await evaluateCommercialAccessibility(page, route, viewport.name);
        if (viewport.name === 'mobile') {
          const keyboardResult = await verifyKeyboardFocus(page, route);
          routeResults.push({ ...routeResult, ...keyboardResult });
        } else {
          routeResults.push(routeResult);
        }
      }

      if (pageIssues.length > 0) {
        throw new Error(`Commercial accessibility browser issues on ${viewport.name}:\n${pageIssues.map((issue) => `- ${issue}`).join('\n')}`);
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  return {
    routeResults,
    pageCount: routes.length,
    viewportCount: viewports.length,
  };
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
  const port = Number(process.env.COMMERCIAL_A11Y_PORT || START_PORT);
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
    const checkSummary = await runChecks(baseUrl);
    await writeAuditArtifacts({
      generatedAt: new Date().toISOString(),
      target: baseUrl,
      status: 'automated_smoke_passed_manual_wcag_required',
      boundary:
        'This packet proves automated responsive/accessibility smoke for the scoped commercial routes. It is not a WCAG conformance claim; manual WCAG 2.2, WCAG-EM, screen-reader, contrast, focus, form-error, target-size, and accessible-authentication evidence remains required before institutional delivery.',
      routes,
      viewports,
      routeResults: checkSummary.routeResults,
      manualReviewChecklist,
      officialReferences,
    });
    console.log(`Commercial accessibility/responsive smoke passed at ${baseUrl}`);
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
