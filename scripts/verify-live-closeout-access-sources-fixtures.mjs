#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-live-closeout-access-sources.mjs');

const READINESS_PATH = 'docs/commercialization/live-closeout-readiness-latest.json';
const OUTPUT_PATH = 'docs/commercialization/live-closeout-access-source-audit-latest.json';

const references = [
  {
    id: 'supabase-access-control',
    label: 'Supabase access control',
    url: 'https://supabase.com/docs/guides/platform/access-control',
    appliesTo: ['supabase-target-project-visible', 'supabase-functions-api-accessible'],
  },
  {
    id: 'supabase-cli-login',
    label: 'Supabase CLI login',
    url: 'https://supabase.com/docs/reference/cli/supabase-login',
    appliesTo: ['supabase-target-project-visible', 'supabase-functions-api-accessible'],
  },
  {
    id: 'supabase-functions-list',
    label: 'Supabase functions list',
    url: 'https://supabase.com/docs/reference/cli/supabase-functions-list',
    appliesTo: ['supabase-functions-api-accessible'],
  },
  {
    id: 'github-actions-secrets',
    label: 'GitHub Actions secrets',
    url: 'https://docs.github.com/en/actions/concepts/security/secrets',
    appliesTo: ['github-secrets-visible', 'github-live-closeout-secrets-present'],
  },
];

function readiness(overrides = {}) {
  return {
    schemaVersion: '2026-06-05.apo-live-closeout-readiness.v1',
    status: 'owner_access_required',
    targetProjectRef: 'kvunnankqgfokeufvsrv',
    officialReferences: references,
    officialReferenceCount: references.length,
    checks: [
      {
        id: 'supabase-target-project-visible',
        passed: false,
        message: 'Target project is not visible to the current Supabase account.',
      },
      {
        id: 'supabase-functions-api-accessible',
        passed: false,
        message: 'Supabase functions API is not accessible.',
      },
    ],
    ...overrides,
  };
}

function writeFile(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, value);
}

function writeJson(root, relativePath, value) {
  writeFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeBaseArtifacts(root) {
  writeJson(root, READINESS_PATH, readiness());
}

function updateJson(root, relativePath, updater) {
  const absolutePath = path.join(root, relativePath);
  const value = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  updater(value);
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function runVerifier(root) {
  return spawnSync(process.execPath, [VERIFIER_SCRIPT, '--root', root, '--write'], {
    cwd: path.dirname(root),
    encoding: 'utf8',
  });
}

function assertCase(name, mutate, expectedCode, expectedText, inspect = () => {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-live-closeout-access-source-audit-${name}-`));
  try {
    writeBaseArtifacts(root);
    mutate(root);
    const result = runVerifier(root);
    const auditPath = path.join(root, OUTPUT_PATH);
    const auditText = fs.existsSync(auditPath) ? fs.readFileSync(auditPath, 'utf8') : '';
    const output = `${result.stdout || ''}\n${result.stderr || ''}\n${auditText}`;
    if (result.status !== expectedCode) {
      throw new Error(`${name} expected exit ${expectedCode}, got ${result.status}\n${output}`);
    }
    if (!output.includes(expectedText)) {
      throw new Error(`${name} expected output containing ${JSON.stringify(expectedText)}\n${output}`);
    }
    inspect(root, output);
    console.log(`ok ${name}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const cases = [
  {
    name: 'aligned-live-closeout-access-source-audit-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
    inspect(root) {
      const audit = readJson(root, OUTPUT_PATH);
      if (audit.sourceCount !== 4 || audit.passedCount !== 4 || audit.failedCount !== 0) {
        throw new Error(`aligned audit counts drifted: ${JSON.stringify(audit)}`);
      }
      if (audit.networkFetch !== false) {
        throw new Error('fixture verifier should exercise non-network source-audit mode');
      }
      const supabaseAccess = audit.sources.find((source) => source.id === 'supabase-access-control');
      if (!supabaseAccess?.appliesTo?.includes('supabase-target-project-visible')) {
        throw new Error('written audit did not preserve Supabase access appliesTo context');
      }
    },
  },
  {
    name: 'missing-required-reference-fails',
    expectedCode: 1,
    expectedText: 'missing_required_reference',
    mutate(root) {
      updateJson(root, READINESS_PATH, (value) => {
        value.officialReferences = value.officialReferences.filter(
          (reference) => reference.id !== 'github-actions-secrets',
        );
      });
    },
  },
  {
    name: 'reference-url-drift-fails',
    expectedCode: 1,
    expectedText: 'reference_url_mismatch',
    mutate(root) {
      updateJson(root, READINESS_PATH, (value) => {
        value.officialReferences[0].url = 'https://supabase.com/docs/guides/platform/projects';
      });
    },
  },
  {
    name: 'unexpected-reference-fails',
    expectedCode: 1,
    expectedText: 'unexpectedReferenceCount',
    mutate(root) {
      updateJson(root, READINESS_PATH, (value) => {
        value.officialReferences.push({
          id: 'unreviewed-live-closeout-access-source',
          label: 'Unreviewed live closeout access source',
          url: 'https://example.com/live-closeout-access',
        });
      });
    },
  },
  {
    name: 'write-audit-artifact-captures-source-boundary',
    expectedCode: 0,
    expectedText: 'sourceBoundary',
    mutate() {},
    inspect(root) {
      const audit = readJson(root, OUTPUT_PATH);
      if (!audit.sourceBoundary.includes('does not prove Supabase account access')) {
        throw new Error('written audit did not preserve live closeout access source boundary');
      }
      const githubSecrets = audit.sources.find((source) => source.id === 'github-actions-secrets');
      if (!githubSecrets?.appliesTo?.includes('github-live-closeout-secrets-present')) {
        throw new Error('written audit did not preserve GitHub secrets appliesTo source mapping');
      }
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText, testCase.inspect);
}

console.log(`Live closeout access source-audit fixture verification passed: ${cases.length} cases.`);
