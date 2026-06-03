#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

const HOST = '127.0.0.1';
const START_PORT = 5174;
const STARTUP_TIMEOUT_MS = 30_000;
const ROUTE_TIMEOUT_MS = 30_000;

const commercialRoutes = [
  { path: '/', appRoute: 'path="/"', label: 'Home' },
  { path: '/for-coaches', appRoute: 'path="/for-coaches"', label: 'Coach landing' },
  { path: '/sample-report', appRoute: 'path="/sample-report"', label: 'Coach sample report' },
  { path: '/tools/resume-analyzer', appRoute: 'path="/tools/resume-analyzer"', label: 'Resume analyzer' },
  { path: '/tools/counselor-reports', appRoute: 'path="/tools/counselor-reports"', label: 'Counselor reports' },
  { path: '/enterprise-dashboard', appRoute: 'path="/enterprise-dashboard"', label: 'Enterprise dashboard' },
  { path: '/operations/leads', appRoute: 'path="/operations/leads"', label: 'Commercial lead ops' },
  { path: '/privacy', appRoute: 'path="/privacy"', label: 'Privacy policy' },
  { path: '/trust-center', appRoute: 'path="/trust-center"', label: 'Commercial trust center' },
  { path: '/proof-pack-gallery', appRoute: 'path="/proof-pack-gallery"', label: 'Proof-pack gallery' },
  { path: '/automation-risk/accountants', appRoute: 'path="/automation-risk/:occupation"', label: 'Occupation SEO risk page' },
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
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(ROUTE_TIMEOUT_MS) });
      if (response.ok) return;
      lastError = new Error(`Server responded ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await wait(500);
  }

  throw new Error(`Vite server did not become ready: ${lastError instanceof Error ? lastError.message : 'unknown error'}`);
}

async function verifyRouteDefinitions() {
  const appSource = await readFile('src/App.tsx', 'utf8');
  const missingRoutes = commercialRoutes.filter((route) => !appSource.includes(route.appRoute));

  if (missingRoutes.length > 0) {
    throw new Error(`Missing App.tsx route definitions: ${missingRoutes.map((route) => route.path).join(', ')}`);
  }
}

async function verifyHttpRoutes(baseUrl) {
  const failures = [];

  for (const route of commercialRoutes) {
    const url = new URL(route.path, baseUrl);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(ROUTE_TIMEOUT_MS) });
      const html = await response.text();
      const hasAppShell = html.includes('id="root"') && html.includes('type="module"');

      if (!response.ok || !hasAppShell) {
        failures.push(`${route.path} returned ${response.status} with app shell=${hasAppShell}`);
      } else {
        console.log(`ok ${route.path} - ${route.label}`);
      }
    } catch (error) {
      failures.push(`${route.path} failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Commercial route smoke failures:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
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
  const port = Number(process.env.COMMERCIAL_SMOKE_PORT || START_PORT);
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
    await verifyRouteDefinitions();
    await waitForServer(baseUrl);
    await verifyHttpRoutes(baseUrl);
    console.log(`Commercial route smoke passed at ${baseUrl}`);
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
