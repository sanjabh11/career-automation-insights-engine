#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SCHEMA_VERSION = '2026-06-05.apo-live-closeout-readiness.v1';
const EXPECTED_PROJECT_REF = 'kvunnankqgfokeufvsrv';
const OUTPUT_JSON = 'docs/commercialization/live-closeout-readiness-latest.json';
const OUTPUT_MD = 'docs/commercialization/live-closeout-readiness-latest.md';
const REQUIRED_GITHUB_SECRETS = [
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_PROJECT_REF',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'LIVE_SUPABASE_TEST_USER_EMAIL',
  'LIVE_SUPABASE_TEST_USER_PASSWORD',
];
const OFFICIAL_REFERENCES = [
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

const args = process.argv.slice(2);
const writeOutputs = args.includes('--write');
const allowIncomplete = args.includes('--allow-incomplete');

const evidenceBoundary =
  'This verifier checks only whether the current local CLI context can see required GitHub secret names and the target Supabase project/functions surface for live closeout. It records secret names only, never secret values, and does not deploy, mutate, ingest, rotate, or prove production behavior.';
const doesNotProve = [
  'live deployment completion',
  'O*NET ingest completion',
  'parse-resume deployment completion',
  'commercial-ready status',
  'live checkout, live MRR, partner commitments, documented outcomes, manual WCAG conformance, legal compliance, or production uptime',
  'validity, freshness, or correctness of any secret value',
];

function run(command, commandArgs, options = {}) {
  try {
    return {
      ok: true,
      stdout: execFileSync(command, commandArgs, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        ...options,
      }),
      stderr: '',
      status: 0,
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

function compactMessage(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

function readGhSecretNames() {
  const result = run('gh', ['secret', 'list', '--repo', 'sanjabh11/career-automation-insights-engine']);
  if (!result.ok) {
    return {
      available: false,
      names: [],
      message: compactMessage(result.stderr),
    };
  }

  const names = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/)[0])
    .filter(Boolean);

  return {
    available: true,
    names,
    message: 'GitHub secret names are readable.',
  };
}

function listSupabaseProjects() {
  const result = run('supabase', ['projects', 'list', '--output', 'json']);
  if (!result.ok) {
    return {
      available: false,
      targetVisible: false,
      visibleRefCount: 0,
      message: compactMessage(result.stderr),
    };
  }

  try {
    const projects = JSON.parse(result.stdout);
    return {
      available: true,
      targetVisible: projects.some((project) => project.ref === EXPECTED_PROJECT_REF),
      visibleRefCount: projects.map((project) => project.ref).filter(Boolean).length,
      message: projects.some((project) => project.ref === EXPECTED_PROJECT_REF)
        ? `Target project ${EXPECTED_PROJECT_REF} is visible to the current Supabase account.`
        : `Target project ${EXPECTED_PROJECT_REF} is not visible to the current Supabase account.`,
    };
  } catch {
    return {
      available: false,
      targetVisible: false,
      visibleRefCount: 0,
      message: 'Could not parse supabase projects JSON output.',
    };
  }
}

function listSupabaseFunctions() {
  const result = run('supabase', ['functions', 'list', '--project-ref', EXPECTED_PROJECT_REF]);
  return {
    available: result.ok,
    message: result.ok ? 'Supabase functions API accessible.' : compactMessage(result.stderr),
  };
}

function buildArtifact() {
  const ghSecrets = readGhSecretNames();
  const supabaseProjects = listSupabaseProjects();
  const supabaseFunctions = listSupabaseFunctions();
  const missingSecrets = REQUIRED_GITHUB_SECRETS.filter((secret) => !ghSecrets.names.includes(secret));
  const presentRequiredSecrets = REQUIRED_GITHUB_SECRETS.filter((secret) => ghSecrets.names.includes(secret));

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
        ? `Missing required GitHub secret name(s): ${missingSecrets.join(', ')}`
        : 'Required GitHub secret names are present.',
    },
    {
      id: 'supabase-target-project-visible',
      passed: supabaseProjects.available && supabaseProjects.targetVisible,
      message: supabaseProjects.message,
    },
    {
      id: 'supabase-functions-api-accessible',
      passed: supabaseFunctions.available,
      message: supabaseFunctions.message,
    },
  ];
  const failedChecks = checks.filter((check) => !check.passed);
  const ok = failedChecks.length === 0;
  const nextActions = ok
    ? [
        'Run the live closeout workflow only after confirming production deploy/ingest scope and owner approval.',
        'Keep raw Supabase, GitHub, O*NET, and customer/provider proof outside tracked files.',
      ]
    : [
        'Use a Supabase account that can manage the target project before claiming live closeout readiness.',
        'If the target project should be visible, refresh Supabase CLI authentication outside tracked files and rerun npm run verify:live-closeout-readiness.',
        'Keep the strict verifier as the acceptance proof; use --allow-incomplete only for redacted status artifacts.',
      ];

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    ok,
    status: ok ? 'passed' : 'owner_access_required',
    allowIncomplete,
    targetProjectRef: EXPECTED_PROJECT_REF,
    commandContext: {
      command: `node scripts/verify-live-closeout-readiness.mjs${writeOutputs ? ' --write' : ''}${
        allowIncomplete ? ' --allow-incomplete' : ''
      }`,
      mutatesExternalState: false,
      printsSecretValues: false,
    },
    githubSecrets: {
      available: ghSecrets.available,
      requiredSecretNames: REQUIRED_GITHUB_SECRETS,
      presentRequiredSecretNames: presentRequiredSecrets,
      missingRequiredSecretNames: missingSecrets,
      valuesRedacted: true,
      allRepositorySecretNamesPersisted: false,
    },
    supabaseAccess: {
      projectsListAvailable: supabaseProjects.available,
      targetProjectVisible: supabaseProjects.targetVisible,
      visibleProjectRefCount: supabaseProjects.visibleRefCount,
      visibleProjectRefsPersisted: false,
      functionsApiAccessible: supabaseFunctions.available,
      projectMessage: supabaseProjects.message,
      functionsMessage: supabaseFunctions.message,
    },
    checkCount: checks.length,
    passedCheckCount: checks.filter((check) => check.passed).length,
    failedCheckCount: failedChecks.length,
    failedCheckIds: failedChecks.map((check) => check.id),
    checks,
    officialReferences: OFFICIAL_REFERENCES,
    officialReferenceCount: OFFICIAL_REFERENCES.length,
    nextActions,
    nextActionCount: nextActions.length,
    evidenceBoundary,
    doesNotProve,
    doesNotProveCount: doesNotProve.length,
    outputs: {
      json: OUTPUT_JSON,
      markdown: OUTPUT_MD,
    },
  };
}

function renderMarkdown(artifact) {
  const rows = artifact.checks
    .map((check) => `| ${check.id} | ${check.passed ? 'pass' : 'blocked'} | ${check.message.replaceAll('|', '\\|')} |`)
    .join('\n');
  const referenceRows = artifact.officialReferences
    .map(
      (reference) =>
        `| ${reference.id} | [${reference.label}](${reference.url}) | ${reference.appliesTo.join(', ')} |`,
    )
    .join('\n');
  const nextActions = artifact.nextActions.map((item) => `- ${item}`).join('\n');

  return `# Live Closeout Readiness

Status: \`${artifact.status}\`
Generated: \`${artifact.generatedAt}\`
Target project ref: \`${artifact.targetProjectRef}\`

This is a redacted status artifact for the local CLI context. It is not a live deployment or closeout proof.

## Counts

| Item | Count |
| --- | ---: |
| Checks | ${artifact.checkCount} |
| Failed checks | ${artifact.failedCheckCount} |
| Official references | ${artifact.officialReferenceCount} |
| Next actions | ${artifact.nextActionCount} |
| Does-not-prove boundaries | ${artifact.doesNotProveCount} |

## Checks

| Check | Result | Message |
| --- | --- | --- |
${rows}

## Secret Name Boundary

- Required GitHub secret names present: ${artifact.githubSecrets.presentRequiredSecretNames.length}/${artifact.githubSecrets.requiredSecretNames.length}
- Missing required GitHub secret names: ${
    artifact.githubSecrets.missingRequiredSecretNames.length
      ? artifact.githubSecrets.missingRequiredSecretNames.map((name) => `\`${name}\``).join(', ')
      : '`none`'
  }
- Secret values persisted: \`no\`
- All repository secret names persisted: \`no\`

## Supabase Access Boundary

| Field | Value |
| --- | --- |
| Projects list available | \`${artifact.supabaseAccess.projectsListAvailable ? 'yes' : 'no'}\` |
| Target project visible | \`${artifact.supabaseAccess.targetProjectVisible ? 'yes' : 'no'}\` |
| Visible project ref count | ${artifact.supabaseAccess.visibleProjectRefCount} |
| Visible project refs persisted | \`no\` |
| Functions API accessible | \`${artifact.supabaseAccess.functionsApiAccessible ? 'yes' : 'no'}\` |

## Official References

These references explain the access and secret-management surfaces checked above. They do not prove this local account has owner access, valid secret values, or a completed live closeout.

| Reference | URL | Applies to |
| --- | --- | --- |
${referenceRows}

## Next Actions

${nextActions}

## Evidence Boundary

${artifact.evidenceBoundary}

## Does Not Prove

${artifact.doesNotProve.map((item) => `- ${item}`).join('\n')}
`;
}

function writeArtifact(root, artifact) {
  fs.mkdirSync(path.join(root, path.dirname(OUTPUT_JSON)), { recursive: true });
  fs.writeFileSync(path.join(root, OUTPUT_JSON), `${JSON.stringify(artifact, null, 2)}\n`);
  fs.writeFileSync(path.join(root, OUTPUT_MD), renderMarkdown(artifact));
}

function main() {
  const artifact = buildArtifact();

  for (const check of artifact.checks) {
    console.log(`${check.passed ? 'ok' : 'fail'} ${check.id} - ${check.message}`);
  }

  if (writeOutputs) {
    writeArtifact(process.cwd(), artifact);
    console.log(`wrote ${OUTPUT_JSON}`);
    console.log(`wrote ${OUTPUT_MD}`);
  }

  if (!artifact.ok) {
    console.error(
      '\nLive closeout readiness failed. Configure target Supabase project access or GitHub secrets before claiming O*NET ingest / parse-resume deploy completion.',
    );
    if (!allowIncomplete) {
      process.exit(1);
    }
  }
}

main();
