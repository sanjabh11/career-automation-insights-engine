#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const checks = [
  {
    id: 'mit-license-file',
    file: 'LICENSE',
    test: (source) => /MIT License/.test(source) && /Permission is hereby granted/.test(source),
  },
  {
    id: 'package-license-metadata',
    file: 'package.json',
    test: (source) => JSON.parse(source).license === 'MIT',
  },
  {
    id: 'readme-repo-description-framing',
    file: 'README.md',
    test: (source) =>
      source.includes('Decision-support APO dashboard for career automation exposure') &&
      source.includes('CI regression gates') &&
      source.includes('source-labeled workforce data pipelines'),
  },
  {
    id: 'readme-stars-not-adoption',
    file: 'README.md',
    test: (source) =>
      source.includes('Stars are not used as evidence of maturity or adoption') &&
      source.includes('active maintenance, PR review, CI checks, regression tests'),
  },
  {
    id: 'contributing-maintainer-burden-copy',
    file: 'CONTRIBUTING.md',
    test: (source) =>
      source.includes('PR review, CI triage, regression-test coverage') &&
      source.includes('does not use stars, popularity, commercial traction, or broad adoption as proof of maturity'),
  },
];

const failures = [];

for (const check of checks) {
  let source = '';
  try {
    source = readText(check.file);
  } catch (error) {
    failures.push({
      id: check.id,
      file: check.file,
      reason: `Unable to read file: ${error.message}`,
    });
    continue;
  }

  if (!check.test(source)) {
    failures.push({
      id: check.id,
      file: check.file,
      reason: 'Expected repository-presentation wording was not found.',
    });
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    ok: true,
    checks: checks.map((check) => check.id),
  }, null, 2));
}
