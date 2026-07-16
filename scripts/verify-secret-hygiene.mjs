#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const excludedPathPatterns = [
  /^package-lock\.json$/,
  /^docs\/commercialization\/.*\.json$/,
  /^dist\//,
  /^node_modules\//,
];

const placeholderPattern =
  /(\.\.\.|your|correct|example|placeholder|redacted|fake|dummy|test|not_set|not-computed|Deno\.env|get\(|process\.env|import\.meta\.env)/i;

const secretPatterns = [
  {
    id: 'supabase-personal-access-token',
    pattern: /sbp_[A-Za-z0-9]{20,}/g,
  },
  {
    id: 'postgres-url-with-password',
    pattern: /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/gi,
  },
  {
    id: 'jwt-literal',
    pattern: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  },
  {
    id: 'serpapi-literal',
    pattern: /SERPAPI(?:_API)?_KEY\s*=\s*["']?[A-Za-z0-9_-]{24,}/gi,
  },
  {
    id: 'onet-password-literal',
    pattern: /ONET_PASSWORD\s*=\s*["']?[^"'\s<>$][^"'\s]*/gi,
  },
  {
    id: 'onet-username-literal',
    pattern: /ONET_USERNAME\s*=\s*["']?[^"'\s<>$][^"'\s]*/gi,
  },
];

const publicEnvBoundaryPathPatterns = [
  /^\.env\.example$/,
  /^README\.md$/,
  /^STATUS\.md$/,
  /^src\//,
  /^netlify\//,
  /^supabase\/functions\//,
  /^docs\/RUNBOOK_ENV_SETUP\.md$/,
  /^docs\/technical\//,
];

const forbiddenPublicEnvNames = new Set([
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'PUBLIC_SUPABASE_SERVICE_ROLE_KEY',
  'VITE_GEMINI_API_KEY',
  'PUBLIC_GEMINI_API_KEY',
  'VITE_SERPAPI_API_KEY',
  'PUBLIC_SERPAPI_API_KEY',
  'VITE_APO_FUNCTION_API_KEY',
  'PUBLIC_APO_FUNCTION_API_KEY',
  'VITE_WHOP_CLIENT_SECRET',
  'PUBLIC_WHOP_CLIENT_SECRET',
  'VITE_WHOP_API_KEY',
  'PUBLIC_WHOP_API_KEY',
  'VITE_STRIPE_SECRET_KEY',
  'PUBLIC_STRIPE_SECRET_KEY',
  'VITE_STRIPE_WEBHOOK_SECRET',
  'PUBLIC_STRIPE_WEBHOOK_SECRET',
]);

function gitFileList(args) {
  const output = execFileSync('git', [...args, '-z'], { encoding: 'utf8' });
  return output
    .split('\0')
    .filter(Boolean)
    .filter((path) => !excludedPathPatterns.some((pattern) => pattern.test(path)));
}

function trackedFiles() {
  return gitFileList(['ls-files']);
}

function untrackedFiles() {
  return gitFileList(['ls-files', '--others', '--exclude-standard']);
}

function isAllowedMatch(match) {
  return placeholderPattern.test(match);
}

function shouldCheckPublicEnvBoundary(file) {
  return publicEnvBoundaryPathPatterns.some((pattern) => pattern.test(file));
}

const trackedScanFiles = trackedFiles();
const untrackedScanFiles = untrackedFiles();
const scanSourceByFile = new Map();
const files = [];

for (const file of trackedScanFiles) {
  if (scanSourceByFile.has(file)) continue;
  scanSourceByFile.set(file, 'tracked');
  files.push(file);
}

for (const file of untrackedScanFiles) {
  if (scanSourceByFile.has(file)) continue;
  scanSourceByFile.set(file, 'untracked_non_ignored');
  files.push(file);
}

const findings = [];

for (const file of files) {
  let source;
  try {
    source = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (shouldCheckPublicEnvBoundary(file)) {
      for (const name of forbiddenPublicEnvNames) {
        if (line.includes(name)) {
          findings.push({
          id: 'browser-public-secret-env-name',
          file,
          source: scanSourceByFile.get(file),
          line: index + 1,
          preview: line.replace(name, '[forbidden-public-env-name]').slice(0, 220),
        });
        }
      }
    }

    for (const { id, pattern } of secretPatterns) {
      pattern.lastIndex = 0;
      const matches = [...line.matchAll(pattern)];
      for (const match of matches) {
        if (isAllowedMatch(match[0])) continue;
        findings.push({
          id,
          file,
          source: scanSourceByFile.get(file),
          line: index + 1,
          preview: line.replace(match[0], '[secret-redacted]').slice(0, 220),
        });
      }
    }
  });
}

if (findings.length > 0) {
  console.error('Secret hygiene verification failed:');
  for (const finding of findings) {
    console.error(`- ${finding.id} ${finding.source} ${finding.file}:${finding.line} ${finding.preview}`);
  }
  process.exit(1);
}

console.log(
  `Secret hygiene verification passed: ${trackedScanFiles.length} tracked and ${untrackedScanFiles.length} untracked non-ignored files scanned.`,
);
