#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

const EXPECTED_PROJECT_REF = 'kvunnankqgfokeufvsrv';
const REQUIRED_GITHUB_SECRETS = [
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_PROJECT_REF',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'LIVE_SUPABASE_TEST_USER_EMAIL',
  'LIVE_SUPABASE_TEST_USER_PASSWORD',
];

function run(command, args, options = {}) {
  try {
    return {
      ok: true,
      stdout: execFileSync(command, args, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        ...options,
      }),
    };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || error.message,
      status: error.status ?? 1,
    };
  }
}

function readGhSecretNames() {
  const result = run('gh', ['secret', 'list', '--repo', 'sanjabh11/career-automation-insights-engine']);
  if (!result.ok) {
    return {
      available: false,
      names: [],
      message: result.stderr.trim().slice(0, 500),
    };
  }

  const names = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/)[0])
    .filter(Boolean);

  return {
    available: true,
    names,
    message: '',
  };
}

function listSupabaseProjects() {
  const result = run('supabase', ['projects', 'list', '--output', 'json']);
  if (!result.ok) {
    return {
      available: false,
      targetVisible: false,
      visibleRefs: [],
      message: result.stderr.trim().slice(0, 500),
    };
  }

  try {
    const projects = JSON.parse(result.stdout);
    return {
      available: true,
      targetVisible: projects.some((project) => project.ref === EXPECTED_PROJECT_REF),
      visibleRefs: projects.map((project) => project.ref).filter(Boolean),
      message: '',
    };
  } catch {
    return {
      available: false,
      targetVisible: false,
      visibleRefs: [],
      message: 'Could not parse supabase projects JSON output.',
    };
  }
}

function listSupabaseFunctions() {
  const result = run('supabase', ['functions', 'list', '--project-ref', EXPECTED_PROJECT_REF]);
  return {
    available: result.ok,
    message: result.ok ? 'Supabase functions API accessible.' : result.stderr.trim().slice(0, 500),
  };
}

function main() {
  const ghSecrets = readGhSecretNames();
  const supabaseProjects = listSupabaseProjects();
  const supabaseFunctions = listSupabaseFunctions();

  const missingSecrets = REQUIRED_GITHUB_SECRETS.filter((secret) => !ghSecrets.names.includes(secret));
  const checks = [
    {
      id: 'github-secrets-visible',
      passed: ghSecrets.available,
      message: ghSecrets.available ? 'GitHub secret names are readable.' : ghSecrets.message,
    },
    {
      id: 'github-live-closeout-secrets-present',
      passed: ghSecrets.available && missingSecrets.length === 0,
      message: missingSecrets.length
        ? `Missing GitHub secret name(s): ${missingSecrets.join(', ')}`
        : 'Required GitHub secret names are present.',
    },
    {
      id: 'supabase-target-project-visible',
      passed: supabaseProjects.available && supabaseProjects.targetVisible,
      message: supabaseProjects.targetVisible
        ? `Target project ${EXPECTED_PROJECT_REF} is visible to the current Supabase account.`
        : `Target project ${EXPECTED_PROJECT_REF} is not visible. Visible refs: ${supabaseProjects.visibleRefs.join(', ') || 'none'}`,
    },
    {
      id: 'supabase-functions-api-accessible',
      passed: supabaseFunctions.available,
      message: supabaseFunctions.message,
    },
  ];

  for (const check of checks) {
    console.log(`${check.passed ? 'ok' : 'fail'} ${check.id} - ${check.message}`);
  }

  if (!checks.every((check) => check.passed)) {
    console.error('\nLive closeout readiness failed. Configure target Supabase project access or GitHub secrets before claiming O*NET ingest / parse-resume deploy completion.');
    process.exit(1);
  }
}

main();
