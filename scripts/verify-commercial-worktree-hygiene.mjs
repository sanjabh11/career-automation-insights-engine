#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

const SCHEMA_VERSION = '2026-06-05.apo-commercial-worktree-hygiene.v1';
const OUTPUT_JSON = 'docs/commercialization/commercial-worktree-hygiene-latest.json';
const OUTPUT_MD = 'docs/commercialization/commercial-worktree-hygiene-latest.md';
const writeOutputs = process.argv.includes('--write');

const allowedUntrackedPathPatterns = [
  {
    id: 'generated-commercialization-artifact',
    pattern: /^docs\/commercialization\/[^/]+\.(json|md|csv)$/,
  },
  {
    id: 'commercialization-helper-script',
    pattern: /^scripts\/(closeout|compose|generate|hash|lint|prepare|smoke|verify)-[A-Za-z0-9._-]+\.mjs$/,
  },
  {
    id: 'dynamic-workflow-artifact',
    pattern:
      /^\.dynamic-workflows\/[^/]+\/(README\.md|backlog\.jsonl|claims\.jsonl|results\.jsonl|workflow\.(js|json))$/,
  },
  {
    id: 'phase-loop-trace-artifact',
    pattern: /^\.phase-loop\/trace-spans\.jsonl$/,
  },
  {
    id: 'positioning-audit-artifact',
    pattern: /^\.positioning-audit\/(?:(?:artifacts|history)\/.+|competitor-matrix\.json)$/,
  },
  {
    id: 'windsurf-plan',
    pattern: /^\.windsurf\/plans\/[^/]+\.md$/,
  },
  {
    id: 'project-instruction',
    pattern: /^AGENTS\.md$/,
  },
  {
    id: 'legal-document',
    pattern: /^docs\/legal\/[^/]+\.md$/,
  },
  {
    id: 'positioning-audit-validator',
    pattern: /^scripts\/validate-positioning-audit\.mjs$/,
  },
  {
    id: 'pilot-client-library',
    pattern: /^src\/lib\/pilotEnrollment\.ts$/,
  },
  {
    id: 'pilot-ui',
    pattern: /^src\/pages\/PilotTermsPage\.tsx$/,
  },
  {
    id: 'pilot-edge-function',
    pattern: /^supabase\/functions\/enroll-coach-pilot\/index\.ts$/,
  },
  {
    id: 'pilot-test-fixture',
    pattern: /^supabase\/functions\/generate-counselor-report\/test\.ts$/,
  },
  {
    id: 'pilot-cleanup-worker',
    pattern: /^supabase\/functions\/cleanup-report-artifacts\/index\.ts$/,
  },
  {
    id: 'coach-pilot-migration',
    pattern:
      /^supabase\/migrations\/2026(?:0118_report_credit_ledger|0716220000_report_credit_ledger_v2|0717000000_report_credit_contract_v3|0718000000_pilot_governance_and_credit_lots|0719000000_coach_pilot_contract_v5)\.sql$/,
  },
];

const sensitiveUntrackedPathPatterns = [
  {
    id: 'local-env-file',
    pattern: /(^|\/)\.env($|\.)/,
  },
  {
    id: 'owner-local-evidence-json',
    pattern: /^docs\/commercialization\/.*\.local\.json$/,
  },
  {
    id: 'private-key-or-certificate',
    pattern: /\.(pem|key|p12|pfx|crt)$/i,
  },
  {
    id: 'local-secret-or-token-file',
    pattern: /(^|\/)(secret|secrets|token|tokens|credential|credentials)(\.|\/|$)/i,
  },
];

const evidenceBoundary =
  'This verifier inventories git worktree paths only. It fails on untracked sensitive owner-local paths and untracked files outside approved commercialization/generated workflow categories. It does not read owner-held ignored evidence contents and does not prove untracked file contents are secret-free beyond the separate secret-hygiene scanner.';

const doesNotProve = [
  'owner-held Stripe, Supabase, customer, partner, outcome, or manual WCAG evidence',
  'absence of secrets in git history, ignored local files, screenshots, logs, browser caches, cloud dashboards, or external systems',
  'that every modified tracked file is ready to commit, reviewed, or production-safe',
  'commercial-ready status, legal compliance, WCAG conformance, procurement approval, or production uptime',
];

function runGit(args) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout || '';
}

function parseShortStatus(output) {
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => ({
      status: line.slice(0, 2),
      path: line.slice(3),
    }));
}

function categoryForUntrackedPath(file) {
  const match = allowedUntrackedPathPatterns.find((item) => item.pattern.test(file));
  return match?.id || null;
}

function sensitiveCategoryForUntrackedPath(file) {
  const match = sensitiveUntrackedPathPatterns.find((item) => item.pattern.test(file));
  return match?.id || null;
}

function countBy(items, getKey) {
  const counts = {};
  for (const item of items) {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export function validateCommercialWorktreeHygieneCounts(result) {
  const errors = [];
  const expectedAllowedUntrackedPathPatternCount = Array.isArray(result?.allowedUntrackedPathPatterns)
    ? result.allowedUntrackedPathPatterns.length
    : null;
  const expectedSensitiveUntrackedPathPatternCount = Array.isArray(result?.sensitiveUntrackedPathPatterns)
    ? result.sensitiveUntrackedPathPatterns.length
    : null;
  const expectedUntrackedPathCheckCount = Array.isArray(result?.untrackedPathChecks)
    ? result.untrackedPathChecks.length
    : null;
  const expectedUntrackedPathCount = expectedUntrackedPathCheckCount;
  const expectedUntrackedAllowedPathCount = Array.isArray(result?.untrackedPathChecks)
    ? result.untrackedPathChecks.filter((item) => item.category).length
    : null;
  const expectedUnexpectedUntrackedPathCount = Array.isArray(result?.untrackedPathChecks)
    ? result.untrackedPathChecks.filter((item) => !item.category).length
    : null;
  const expectedSensitiveUntrackedPathCount = Array.isArray(result?.untrackedPathChecks)
    ? result.untrackedPathChecks.filter((item) => item.sensitiveCategory).length
    : null;
  const expectedDoesNotProveCount = Array.isArray(result?.doesNotProve) ? result.doesNotProve.length : null;
  const expectedErrorCount = Array.isArray(result?.errors) ? result.errors.length : null;

  if (result?.allowedUntrackedPathPatternCount !== expectedAllowedUntrackedPathPatternCount) {
    errors.push(
      `worktree_hygiene_allowed_untracked_path_pattern_count_mismatch expected ${expectedAllowedUntrackedPathPatternCount} got ${result?.allowedUntrackedPathPatternCount}`,
    );
  }
  if (result?.sensitiveUntrackedPathPatternCount !== expectedSensitiveUntrackedPathPatternCount) {
    errors.push(
      `worktree_hygiene_sensitive_untracked_path_pattern_count_mismatch expected ${expectedSensitiveUntrackedPathPatternCount} got ${result?.sensitiveUntrackedPathPatternCount}`,
    );
  }
  if (result?.untrackedPathCheckCount !== expectedUntrackedPathCheckCount) {
    errors.push(
      `worktree_hygiene_untracked_path_check_count_mismatch expected ${expectedUntrackedPathCheckCount} got ${result?.untrackedPathCheckCount}`,
    );
  }
  if (result?.untrackedPathCount !== expectedUntrackedPathCount) {
    errors.push(
      `worktree_hygiene_untracked_path_count_mismatch expected ${expectedUntrackedPathCount} got ${result?.untrackedPathCount}`,
    );
  }
  if (result?.untrackedAllowedPathCount !== expectedUntrackedAllowedPathCount) {
    errors.push(
      `worktree_hygiene_untracked_allowed_path_count_mismatch expected ${expectedUntrackedAllowedPathCount} got ${result?.untrackedAllowedPathCount}`,
    );
  }
  if (result?.unexpectedUntrackedPathCount !== expectedUnexpectedUntrackedPathCount) {
    errors.push(
      `worktree_hygiene_unexpected_untracked_path_count_mismatch expected ${expectedUnexpectedUntrackedPathCount} got ${result?.unexpectedUntrackedPathCount}`,
    );
  }
  if (result?.sensitiveUntrackedPathCount !== expectedSensitiveUntrackedPathCount) {
    errors.push(
      `worktree_hygiene_sensitive_untracked_path_count_mismatch expected ${expectedSensitiveUntrackedPathCount} got ${result?.sensitiveUntrackedPathCount}`,
    );
  }
  if (result?.doesNotProveCount !== expectedDoesNotProveCount) {
    errors.push(
      `worktree_hygiene_does_not_prove_count_mismatch expected ${expectedDoesNotProveCount} got ${result?.doesNotProveCount}`,
    );
  }
  if (result?.errorCount !== expectedErrorCount) {
    errors.push(`worktree_hygiene_error_count_mismatch expected ${expectedErrorCount} got ${result?.errorCount}`);
  }

  return errors;
}

function buildResult() {
  const entries = parseShortStatus(runGit(['status', '--short', '--untracked-files=all']));
  const trackedEntries = entries.filter((entry) => entry.status !== '??');
  const untrackedEntries = entries.filter((entry) => entry.status === '??');
  const stagedEntries = trackedEntries.filter((entry) => entry.status[0] !== ' ');
  const modifiedEntries = trackedEntries.filter((entry) => entry.status[1] !== ' ');
  const deletedEntries = trackedEntries.filter((entry) => entry.status.includes('D'));

  const untrackedPaths = untrackedEntries.map((entry) => entry.path).sort((a, b) => a.localeCompare(b));
  const untrackedPathChecks = untrackedPaths.map((file) => ({
    path: file,
    category: categoryForUntrackedPath(file),
    sensitiveCategory: sensitiveCategoryForUntrackedPath(file),
  }));

  const sensitiveUntrackedPaths = untrackedPathChecks.filter((item) => item.sensitiveCategory);
  const unexpectedUntrackedPaths = untrackedPathChecks.filter((item) => !item.category);
  const errors = [
    ...sensitiveUntrackedPaths.map((item) => ({
      type: 'sensitive_untracked_path',
      path: item.path,
      category: item.sensitiveCategory,
    })),
    ...unexpectedUntrackedPaths.map((item) => ({
      type: 'unexpected_untracked_path',
      path: item.path,
    })),
  ];

  const result = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    ok: errors.length === 0,
    status: errors.length === 0 ? 'passed' : 'failed',
    trackedDirtyPathCount: trackedEntries.length,
    stagedPathCount: stagedEntries.length,
    modifiedPathCount: modifiedEntries.length,
    deletedPathCount: deletedEntries.length,
    untrackedPathCount: untrackedPaths.length,
    untrackedAllowedPathCount: untrackedPathChecks.filter((item) => item.category).length,
    unexpectedUntrackedPathCount: unexpectedUntrackedPaths.length,
    sensitiveUntrackedPathCount: sensitiveUntrackedPaths.length,
    allowedUntrackedPathPatternCount: allowedUntrackedPathPatterns.length,
    sensitiveUntrackedPathPatternCount: sensitiveUntrackedPathPatterns.length,
    untrackedPathCheckCount: untrackedPathChecks.length,
    untrackedCountsByCategory: countBy(
      untrackedPathChecks.filter((item) => item.category),
      (item) => item.category,
    ),
    trackedDirtyStatusCounts: countBy(trackedEntries, (entry) => entry.status),
    allowedUntrackedPathPatterns: allowedUntrackedPathPatterns.map((item) => item.id),
    sensitiveUntrackedPathPatterns: sensitiveUntrackedPathPatterns.map((item) => item.id),
    untrackedPathChecks,
    errorCount: errors.length,
    errors,
    outputs: {
      json: OUTPUT_JSON,
      markdown: OUTPUT_MD,
    },
    evidenceBoundary,
    doesNotProve,
    doesNotProveCount: doesNotProve.length,
  };

  const countErrors = validateCommercialWorktreeHygieneCounts(result);
  if (countErrors.length > 0) {
    result.errors.push(...countErrors.map((message) => ({ type: 'worktree_hygiene_count_mismatch', message })));
    result.errorCount = result.errors.length;
    result.ok = false;
    result.status = 'failed';
  }

  return result;
}

function renderMarkdown(result) {
  const untrackedRows =
    result.untrackedPathChecks.length > 0
      ? result.untrackedPathChecks
          .map(
            (item) =>
              `| \`${item.path}\` | ${item.category || 'unexpected'} | ${item.sensitiveCategory || 'none'} |`,
          )
          .join('\n')
      : '| none | none | none |';
  const errors =
    result.errors.length > 0
      ? result.errors.map((error) => `- ${error.type}: \`${error.path}\``).join('\n')
      : '- none';

  return `# Commercial Worktree Hygiene

Generated: \`${result.generatedAt}\`
Status: \`${result.status}\`

This artifact records repo-local dirty worktree hygiene for commercial launch verification. It is an inventory and path-policy check, not proof of owner-held evidence.

## Counts

| Field | Value |
| --- | ---: |
| Tracked dirty paths | ${result.trackedDirtyPathCount} |
| Staged paths | ${result.stagedPathCount} |
| Modified paths | ${result.modifiedPathCount} |
| Deleted paths | ${result.deletedPathCount} |
| Untracked paths | ${result.untrackedPathCount} |
| Allowed untracked paths | ${result.untrackedAllowedPathCount} |
| Unexpected untracked paths | ${result.unexpectedUntrackedPathCount} |
| Sensitive untracked paths | ${result.sensitiveUntrackedPathCount} |
| Policy patterns: allowed untracked | ${result.allowedUntrackedPathPatternCount} |
| Policy patterns: sensitive untracked | ${result.sensitiveUntrackedPathPatternCount} |
| Untracked path checks | ${result.untrackedPathCheckCount} |
| Does-not-prove boundaries | ${result.doesNotProveCount} |
| Errors | ${result.errorCount} |

## Untracked Path Policy

| Path | Category | Sensitive category |
| --- | --- | --- |
${untrackedRows}

## Errors

${errors}

## Evidence Boundary

${result.evidenceBoundary}

## Does Not Prove

${result.doesNotProve.map((item) => `- ${item}`).join('\n')}
`;
}

function main() {
  const result = buildResult();

  if (writeOutputs) {
    fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
    fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(result, null, 2)}\n`);
    fs.writeFileSync(OUTPUT_MD, renderMarkdown(result));
  }

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) main();
