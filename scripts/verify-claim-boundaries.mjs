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
  `${path.sep}docs${path.sep}audits${path.sep}`,
  `${path.sep}.windsurf${path.sep}plans${path.sep}`,
  `${path.sep}SAFE_BACKUP${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}dist${path.sep}`,
  `${path.sep}test-results${path.sep}`,
  `${path.sep}playwright-report${path.sep}`,
];

const staleButScannedFragments = [
  `${path.sep}.positioning-audit${path.sep}history${path.sep}`,
];

const ignoredClaimDiagnosticFragments = [
  `${path.sep}docs${path.sep}archive${path.sep}`,
  `${path.sep}docs${path.sep}audits${path.sep}`,
  `${path.sep}.windsurf${path.sep}plans${path.sep}`,
];

const publicRuntimeRoots = ['src/', 'index.html', 'README.md', 'STATUS.md'];

const forbiddenPatterns = [
  { id: 'production-ready-score', pattern: /\b4\.8\/5(?:\.0)?\b|\bProduction-Ready\b|Current Implementation Score/ },
  { id: 'absolute-security-score', pattern: /Security:\*\*\s*10\/10|10\/10\s*\(RLS/i },
  { id: 'absolute-competitor-claim', pattern: /no direct competitors|Blue Ocean achieved|world['’]s first/i },
  { id: 'mock-data-absolute', pattern: /\bZERO mock data\b|\bzero mock data\b/i },
  { id: 'coverage-absolute', pattern: /\b80% coverage\b/i },
  { id: 'scientific-validation-absolute', pattern: /scientifically validated/i },
  { id: 'commercial-confidence-overclaim', pattern: /95% bounded confidence|96% once|The technology is ready/i },
  { id: 'dead-wef-local-pdf', pattern: /\/(?:public\/)?docs\/WEF_Future_of_Jobs_Report_2025\.pdf/i },
  { id: 'unsupported-real-user-outcomes', pattern: /Measured outcomes and growth metrics from real users|Avg Wage Increase|Skill Match Accuracy|Decision Speed-up/i },
  { id: 'public-outcome-reporting-overclaim', pattern: /Export-ready for public reporting|30\/90-day outcomes and performance/i },
  { id: 'static-correlation-overclaim', pattern: /Correlations computed over rolling 24-month windows|Learning Path Completion ↔ Wage Growth|APO ↔ Median Salary/i },
  { id: 'will-replace-public-copy', pattern: /Will AI Replace|AI will replace|will not be replaced/i, scope: 'public-runtime', allowedPaths: ['src/lib/automationDefenseMethodology.ts'] },
  { id: 'future-proof-public-copy', pattern: /future[- ]proof/i, scope: 'public-runtime', allowedPaths: ['src/lib/automationDefenseMethodology.ts'] },
  { id: 'safe-job-public-copy', pattern: /safe jobs?|safe roles?|AI-proof career/i, scope: 'public-runtime', allowedPaths: ['src/lib/automationDefenseMethodology.ts'] },
  { id: 'career-insurance-public-copy', pattern: /career insurance/i, scope: 'public-runtime', allowedPaths: ['src/lib/automationDefenseMethodology.ts'] },
  { id: 'roi-multiple-public-copy', pattern: /\b15x ROI\b|\b20x over\b|guaranteed ROI/i, scope: 'public-runtime', allowedPaths: ['src/lib/automationDefenseMethodology.ts'] },
  { id: 'automation-risk-score-public-copy', pattern: /Automation Risk Score/i, scope: 'public-runtime' },
];

function patternApplies({ scope, allowedPaths = [] }, relativePath) {
  if (allowedPaths.includes(relativePath)) return false;
  if (scope === 'public-runtime') {
    return publicRuntimeRoots.some((root) => relativePath === root || relativePath.startsWith(root));
  }
  return true;
}

function walk(dir, files = [], staleFiles = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (ignoredPathFragments.some((fragment) => fullPath.includes(fragment))) continue;
    const isStale = staleButScannedFragments.some((fragment) => fullPath.includes(fragment));
    if (entry.isDirectory()) {
      walk(fullPath, files, staleFiles);
    } else if (scanExtensions.has(path.extname(entry.name))) {
      if (isStale) {
        staleFiles.push(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }
  return { files, staleFiles };
}

const { files, staleFiles } = walk(root);
function walkDiagnostic(dir, diagnosticFiles = []) {
  if (!fs.existsSync(dir)) return diagnosticFiles;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDiagnostic(fullPath, diagnosticFiles);
    } else if (scanExtensions.has(path.extname(entry.name))) {
      diagnosticFiles.push(fullPath);
    }
  }
  return diagnosticFiles;
}

const ignoredDiagnosticFiles = ignoredClaimDiagnosticFragments.flatMap((fragment) =>
  walkDiagnostic(path.join(root, ...fragment.split(path.sep).filter(Boolean)), []),
);
const allFiles = [...files, ...staleFiles];
const strictStale = process.argv.includes('--strict-stale');
const strictIgnored = process.argv.includes('--strict-ignored');
const failures = [];
const staleFailures = [];
const ignoredFailures = [];

for (const filePath of allFiles) {
  const relativePath = path.relative(root, filePath);
  const isStale = staleButScannedFragments.some((fragment) => filePath.includes(fragment));
  const source = fs.readFileSync(filePath, 'utf8');
  const lines = source.split(/\r?\n/);
  const targetFailures = isStale ? staleFailures : failures;

  for (const { id, pattern, scope, allowedPaths } of forbiddenPatterns) {
    if (!patternApplies({ scope, allowedPaths }, relativePath)) continue;
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        targetFailures.push({
          id,
          file: relativePath,
          line: index + 1,
          excerpt: line.slice(0, 220),
          stale: isStale,
        });
      }
    });
  }
}

for (const filePath of ignoredDiagnosticFiles) {
  const relativePath = path.relative(root, filePath);
  const source = fs.readFileSync(filePath, 'utf8');
  const lines = source.split(/\r?\n/);

  for (const { id, pattern, scope, allowedPaths } of forbiddenPatterns) {
    if (!patternApplies({ scope, allowedPaths }, relativePath)) continue;
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        ignoredFailures.push({
          id,
          file: relativePath,
          line: index + 1,
          excerpt: line.slice(0, 220),
          ignored: true,
        });
      }
    });
  }
}

const activeOk = failures.length === 0;
const staleOk = staleFailures.length === 0;
const ignoredOk = ignoredFailures.length === 0;
const releaseGateOk = activeOk && staleOk && ignoredOk;
const ok = activeOk && (!strictStale || staleOk) && (!strictIgnored || ignoredOk);
const result = {
  ok,
  activeOk,
  staleOk,
  ignoredOk,
  releaseGateOk,
  strictStale,
  strictIgnored,
  failures,
  staleFailures,
  ignoredFailures,
  scannedFiles: allFiles.length,
  staleButScanned: staleFiles.length,
  staleViolations: staleFailures.length,
  ignoredDiagnosticFiles: ignoredDiagnosticFiles.length,
  ignoredViolations: ignoredFailures.length,
  forbiddenPatternCount: forbiddenPatterns.length,
  ignoredPathFragments: ignoredPathFragments.map((fragment) => fragment.split(path.sep).filter(Boolean).join('/')),
  evidenceBoundary:
    'Active runtime files are release-gate scanned. Archive, audit, and plan paths are scanned diagnostically but remain outside the default active gate; use --strict-stale or --strict-ignored to fail on those findings. This verifier does not prove external evidence, deployment state, or owner-held customer outcomes.',
};

if (!ok) {
  console.error(JSON.stringify(result, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(result, null, 2));
}
