#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const scanExtensions = new Set(['.md', '.mdx', '.ts', '.tsx', '.csv', '.html']);
const ignoredPathFragments = [
  `${path.sep}docs${path.sep}archive${path.sep}`,
  `${path.sep}SAFE_BACKUP${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}dist${path.sep}`,
  `${path.sep}test-results${path.sep}`,
  `${path.sep}playwright-report${path.sep}`,
];

const forbiddenPatterns = [
  { id: 'production-ready-score', pattern: /\b4\.8\/5(?:\.0)?\b|\bProduction-Ready\b|Current Implementation Score/ },
  { id: 'absolute-security-score', pattern: /Security:\*\*\s*10\/10|10\/10\s*\(RLS/i },
  { id: 'absolute-competitor-claim', pattern: /no direct competitors|Blue Ocean achieved|world['’]s first/i },
  { id: 'mock-data-absolute', pattern: /\bZERO mock data\b|\bzero mock data\b/i },
  { id: 'coverage-absolute', pattern: /\b80% coverage\b/i },
  { id: 'scientific-validation-absolute', pattern: /scientifically validated/i },
  { id: 'commercial-confidence-overclaim', pattern: /95% bounded confidence|96% once|The technology is ready/i },
  { id: 'dead-wef-local-pdf', pattern: /\/(?:public\/)?docs\/WEF_Future_of_Jobs_Report_2025\.pdf/i },
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (ignoredPathFragments.some((fragment) => fullPath.includes(fragment))) continue;
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (scanExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = walk(root);
const failures = [];

for (const filePath of files) {
  const relativePath = path.relative(root, filePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const lines = source.split(/\r?\n/);

  for (const { id, pattern } of forbiddenPatterns) {
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        failures.push({
          id,
          file: relativePath,
          line: index + 1,
          excerpt: line.slice(0, 220),
        });
      }
    });
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    ok: true,
    scannedFiles: files.length,
    forbiddenPatternCount: forbiddenPatterns.length,
  }, null, 2));
}
