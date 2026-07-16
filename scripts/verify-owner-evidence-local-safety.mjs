#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = process.argv.slice(2);

function readFlagValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const root = path.resolve(readFlagValue('--root', path.resolve(__dirname, '..')));

const OUTPUT_JSON = 'docs/commercialization/owner-evidence-local-safety-latest.json';
const OUTPUT_MD = 'docs/commercialization/owner-evidence-local-safety-latest.md';
const SCHEMA_VERSION = '2026-06-05.apo-owner-evidence-local-safety.v1';

const protectedPaths = [
  {
    path: '.env',
    kind: 'owner_environment',
    reason: 'Base local environment files can contain Supabase, Stripe, API, and owner proof credentials.',
  },
  {
    path: '.env.local',
    kind: 'owner_environment',
    reason: 'Owner-held local environment file for live proof commands.',
  },
  {
    path: '.env.production',
    kind: 'owner_environment',
    reason: 'Production environment files must never become tracked proof artifacts.',
  },
  {
    path: '.env.production.local',
    kind: 'owner_environment',
    reason: 'Production local override files can contain live credentials.',
  },
  {
    path: '.env.test.local',
    kind: 'owner_environment',
    reason: 'Test local override files can contain payment or synthetic-user credentials.',
  },
  {
    path: 'docs/commercialization/live-gate-evidence.local.json',
    kind: 'owner_live_evidence',
    reason: 'Redacted live-gate evidence intake may still map to owner-held Stripe/Supabase proof archives.',
  },
  {
    path: 'docs/commercialization/commercial-evidence-intake.local.json',
    kind: 'owner_commercial_intake',
    reason: 'Partner/outcome intake can reference owner-held contracts, quotes, contacts, salts, and proof hashes.',
  },
  {
    path: 'docs/commercialization/commercial-evidence-records.local.json',
    kind: 'owner_commercial_records',
    reason: 'Composed local commercial evidence records are owner-reviewed before tracked redacted ledgers are refreshed.',
  },
  {
    path: 'docs/commercialization/manual-wcag-evidence.local.json',
    kind: 'owner_manual_wcag_evidence',
    reason: 'Manual WCAG metadata maps to owner-held notes, screenshots, reviewer evidence, and archive records.',
  },
];

const ignoreProbePaths = [
  {
    path: 'docs/commercialization/__owner-evidence-local-safety-probe__.local.json',
    kind: 'future_owner_local_json',
    reason: 'Future commercialization owner-evidence local JSON files should inherit the same ignore policy.',
  },
];

const allowedTrackedEnvPaths = new Set(['.env.example']);
const sensitivePathPattern = /(^|\/)\.env(?:\.|$)|^docs\/commercialization\/.*\.local\.json$/;

function hasFlag(name) {
  return args.includes(name);
}

function runGit(gitArgs) {
  const result = spawnSync('git', gitArgs, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  return {
    code: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function nulList(output) {
  return String(output || '').split('\0').filter(Boolean);
}

function lineList(output) {
  return String(output || '').split(/\r?\n/).filter(Boolean);
}

function trackedFiles() {
  const result = runGit(['ls-files', '-z']);
  if (result.code !== 0) {
    throw new Error(`git ls-files failed: ${result.stderr || result.stdout}`);
  }
  return nulList(result.stdout);
}

function isTracked(relativePath) {
  const result = runGit(['ls-files', '-z', '--', relativePath]);
  return result.code === 0 && nulList(result.stdout).includes(relativePath);
}

function isStaged(relativePath) {
  const result = runGit(['diff', '--cached', '--name-only', '-z', '--', relativePath]);
  return result.code === 0 && nulList(result.stdout).includes(relativePath);
}

function ignoreStatus(relativePath) {
  const result = runGit(['check-ignore', '-v', '--', relativePath]);
  if (result.code === 0) {
    const detail = lineList(result.stdout)[0] || '';
    const match = detail.match(/^(.*?):(\d+):(.+?)\t(.+)$/);
    return {
      ignored: true,
      source: match
        ? {
            file: match[1],
            line: Number(match[2]),
            pattern: match[3],
          }
        : { raw: detail },
    };
  }
  return {
    ignored: false,
    source: null,
    stderr: result.stderr || null,
  };
}

function stagedSensitivePaths() {
  const result = runGit(['diff', '--cached', '--name-only', '-z']);
  if (result.code !== 0) return [];
  return nulList(result.stdout).filter((file) => sensitivePathPattern.test(file));
}

function trackedSensitiveFiles(files) {
  return files.filter((file) => {
    if (allowedTrackedEnvPaths.has(file)) return false;
    return sensitivePathPattern.test(file);
  });
}

function buildProtectedPathChecks() {
  return [...protectedPaths, ...ignoreProbePaths].map((item) => {
    const ignore = ignoreStatus(item.path);
    return {
      ...item,
      ignored: ignore.ignored,
      ignoreSource: ignore.source,
      tracked: isTracked(item.path),
      staged: isStaged(item.path),
    };
  });
}

function addError(errors, type, detail) {
  errors.push({ type, ...detail });
}

export function validateLocalSafetyCounts(result) {
  const errors = [];
  const expectedProtectedPathCount = Array.isArray(result?.protectedPathChecks) ? result.protectedPathChecks.length : null;
  const expectedIgnoredProtectedPathCount = Array.isArray(result?.protectedPathChecks)
    ? result.protectedPathChecks.filter((check) => check.ignored).length
    : null;
  const expectedTrackedSensitiveFileViolationCount = Array.isArray(result?.trackedSensitiveFileViolations)
    ? result.trackedSensitiveFileViolations.length
    : null;
  const expectedStagedSensitivePathViolationCount = Array.isArray(result?.stagedSensitivePathViolations)
    ? result.stagedSensitivePathViolations.length
    : null;
  const expectedDoesNotProveCount = Array.isArray(result?.doesNotProve) ? result.doesNotProve.length : null;
  const expectedReferencePracticeCount = Array.isArray(result?.referencePractices) ? result.referencePractices.length : null;
  const expectedErrorCount = Array.isArray(result?.errors) ? result.errors.length : null;

  if (result?.protectedPathCount !== expectedProtectedPathCount) {
    errors.push(`local_safety_protected_path_count_mismatch expected ${expectedProtectedPathCount} got ${result?.protectedPathCount}`);
  }
  if (result?.ignoredProtectedPathCount !== expectedIgnoredProtectedPathCount) {
    errors.push(`local_safety_ignored_protected_path_count_mismatch expected ${expectedIgnoredProtectedPathCount} got ${result?.ignoredProtectedPathCount}`);
  }
  if (result?.trackedSensitiveFileViolationCount !== expectedTrackedSensitiveFileViolationCount) {
    errors.push(`local_safety_tracked_sensitive_file_violation_count_mismatch expected ${expectedTrackedSensitiveFileViolationCount} got ${result?.trackedSensitiveFileViolationCount}`);
  }
  if (result?.stagedSensitivePathViolationCount !== expectedStagedSensitivePathViolationCount) {
    errors.push(`local_safety_staged_sensitive_path_violation_count_mismatch expected ${expectedStagedSensitivePathViolationCount} got ${result?.stagedSensitivePathViolationCount}`);
  }
  if (result?.doesNotProveCount !== expectedDoesNotProveCount) {
    errors.push(`local_safety_does_not_prove_count_mismatch expected ${expectedDoesNotProveCount} got ${result?.doesNotProveCount}`);
  }
  if (result?.referencePracticeCount !== expectedReferencePracticeCount) {
    errors.push(`local_safety_reference_practice_count_mismatch expected ${expectedReferencePracticeCount} got ${result?.referencePracticeCount}`);
  }
  if (result?.errorCount !== expectedErrorCount) {
    errors.push(`local_safety_error_count_mismatch expected ${expectedErrorCount} got ${result?.errorCount}`);
  }

  return errors;
}

function renderMarkdown(result) {
  const protectedRows = result.protectedPathChecks
    .map((check) => {
      const ignoreSource = check.ignoreSource?.file
        ? `${check.ignoreSource.file}:${check.ignoreSource.line} ${check.ignoreSource.pattern}`
        : 'none';
      return `| \`${check.path}\` | ${check.kind} | ${check.ignored ? 'yes' : 'no'} | ${check.tracked ? 'yes' : 'no'} | ${check.staged ? 'yes' : 'no'} | ${ignoreSource} |`;
    })
    .join('\n');
  const errors = result.errors.length > 0
    ? result.errors.map((error) => `- ${error.type}: ${error.path || error.file || error.message || ''}`).join('\n')
    : '- none';

  return `# Owner Evidence Local Safety

Generated: ${result.generatedAt}

Status: \`${result.ok ? 'passed' : 'failed'}\`

This preflight checks git tracking, staging, and ignore policy for owner-held local evidence paths. It never reads \`.env.local\` or \`docs/commercialization/*.local.json\` contents.

## Counts

| Field | Count |
| --- | ---: |
| Protected paths | ${result.protectedPathCount} |
| Ignored protected paths | ${result.ignoredProtectedPathCount} |
| Tracked sensitive file violations | ${result.trackedSensitiveFileViolationCount} |
| Staged sensitive path violations | ${result.stagedSensitivePathViolationCount} |
| Reference practices | ${result.referencePracticeCount} |
| Does-not-prove boundaries | ${result.doesNotProveCount} |
| Errors | ${result.errorCount} |

## Protected Paths

| Path | Kind | Ignored | Tracked | Staged | Ignore source |
| --- | --- | --- | --- | --- | --- |
${protectedRows}

## Sensitive Tracked File Scan

Tracked sensitive file violations: ${result.trackedSensitiveFileViolations.length}

Staged sensitive path violations: ${result.stagedSensitivePathViolations.length}

## Errors

${errors}

## Evidence Boundary

${result.evidenceBoundary}

## Does Not Prove

${result.doesNotProve.map((item) => `- ${item}`).join('\n')}
`;
}

function main() {
  const shouldWrite = hasFlag('--write');
  const files = trackedFiles();
  const protectedPathChecks = buildProtectedPathChecks();
  const trackedSensitiveFileViolations = trackedSensitiveFiles(files);
  const stagedSensitivePathViolations = stagedSensitivePaths();
  const errors = [];
  const doesNotProve = [
    'absence of secrets in git history, logs, screenshots, local machines, cloud dashboards, browser caches, or third-party systems',
    'validity or completeness of local owner evidence files',
    'commercial-ready status, legal compliance, WCAG conformance, or procurement approval',
  ];
  const referencePractices = [
    {
      source: 'OWASP Secrets Management Cheat Sheet',
      url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html',
      localMapping:
        'Owner-held secrets and proof archives stay outside tracked files; the repo stores templates, redacted hashes, and policy metadata only.',
    },
    {
      source: 'GitHub push protection',
      url: 'https://docs.github.com/en/code-security/concepts/secret-security/about-push-protection',
      localMapping:
        'This preflight is a repo-local preventative check before staging/commit; hosted push protection should still be enabled by the owner.',
    },
  ];

  for (const check of protectedPathChecks) {
    if (!check.ignored) {
      addError(errors, 'protected_owner_path_not_ignored', {
        path: check.path,
        kind: check.kind,
        reason: check.reason,
      });
    }
    if (check.tracked) {
      addError(errors, 'protected_owner_path_tracked', {
        path: check.path,
        kind: check.kind,
      });
    }
    if (check.staged) {
      addError(errors, 'protected_owner_path_staged', {
        path: check.path,
        kind: check.kind,
      });
    }
  }

  for (const file of trackedSensitiveFileViolations) {
    addError(errors, 'tracked_sensitive_local_file', { file });
  }

  for (const file of stagedSensitivePathViolations) {
    addError(errors, 'staged_sensitive_local_file', { file });
  }

  const result = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    ok: errors.length === 0,
    protectedPathCount: protectedPathChecks.length,
    protectedPathChecks,
    ignoredProtectedPathCount: protectedPathChecks.filter((check) => check.ignored).length,
    trackedSensitiveFileViolations,
    trackedSensitiveFileViolationCount: trackedSensitiveFileViolations.length,
    stagedSensitivePathViolations,
    stagedSensitivePathViolationCount: stagedSensitivePathViolations.length,
    errorCount: errors.length,
    errors,
    outputs: {
      json: OUTPUT_JSON,
      markdown: OUTPUT_MD,
    },
    evidenceBoundary:
      'This preflight proves only git ignore/tracking/staging policy for owner-held local evidence paths. It does not inspect file contents, validate redacted evidence completeness, prove live payment or revenue, prove partner commitments, prove documented outcomes, prove manual WCAG conformance, or replace host-level secret scanning/push protection.',
    doesNotProve,
    doesNotProveCount: doesNotProve.length,
    referencePractices,
    referencePracticeCount: referencePractices.length,
  };

  const countErrors = validateLocalSafetyCounts(result);
  if (countErrors.length > 0) {
    result.errors.push(...countErrors.map((message) => ({ type: 'local_safety_count_mismatch', message })));
    result.errorCount = result.errors.length;
    result.ok = false;
  }

  if (shouldWrite) {
    fs.mkdirSync(path.dirname(path.join(root, OUTPUT_JSON)), { recursive: true });
    fs.writeFileSync(path.join(root, OUTPUT_JSON), `${JSON.stringify(result, null, 2)}\n`);
    fs.writeFileSync(path.join(root, OUTPUT_MD), renderMarkdown(result));
  }

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) main();
