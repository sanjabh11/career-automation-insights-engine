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

function trackedFiles() {
  const output = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' });
  return output
    .split('\0')
    .filter(Boolean)
    .filter((path) => !excludedPathPatterns.some((pattern) => pattern.test(path)));
}

function isAllowedMatch(match) {
  return placeholderPattern.test(match);
}

const findings = [];

for (const file of trackedFiles()) {
  let source;
  try {
    source = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const { id, pattern } of secretPatterns) {
      pattern.lastIndex = 0;
      const matches = [...line.matchAll(pattern)];
      for (const match of matches) {
        if (isAllowedMatch(match[0])) continue;
        findings.push({
          id,
          file,
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
    console.error(`- ${finding.id} ${finding.file}:${finding.line} ${finding.preview}`);
  }
  process.exit(1);
}

console.log('Secret hygiene verification passed.');
