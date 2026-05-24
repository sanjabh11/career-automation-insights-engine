#!/usr/bin/env node

import { spawn } from 'node:child_process';

const HOST = '127.0.0.1';
const START_PORT = 5176;
const STARTUP_TIMEOUT_MS = 30_000;
const SERVER_PROBE_TIMEOUT_MS = 3_000;
const ROUTE_TIMEOUT_MS = 45_000;
const BROWSER_LAUNCH_TIMEOUT_MS = 60_000;

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
}

async function runChecks(baseUrl) {
  console.log('launching Playwright browser for commercial accessibility smoke');
  const browser = await launchCommercialBrowser();

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
        await evaluateCommercialAccessibility(page, route, viewport.name);
        if (viewport.name === 'mobile') {
          await verifyKeyboardFocus(page, route);
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
    await runChecks(baseUrl);
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
