#!/usr/bin/env node

import { spawn } from 'node:child_process';

const DEFAULT_STEPS = [
  {
    id: 'index',
    label: 'Regenerate commercial codebase index',
    command: ['node', 'scripts/generate-commercialization-index.mjs'],
  },
  {
    id: 'trust',
    label: 'Verify commercial trust boundaries',
    command: ['node', 'scripts/verify-commercial-trust-boundaries.mjs'],
  },
  {
    id: 'report-evidence',
    label: 'Verify report evidence cards and proof-pack coverage',
    command: ['node', 'scripts/verify-report-evidence.mjs'],
  },
  {
    id: 'supabase-function-governance',
    label: 'Verify Supabase function governance and launch readiness',
    command: ['node', 'scripts/verify-supabase-function-governance.mjs'],
  },
  {
    id: 'onet-task-ratings',
    label: 'Verify O*NET Task Ratings ingest boundary',
    command: ['node', 'scripts/verify-onet-task-ratings-ingest.mjs'],
  },
  {
    id: 'deployment-packet',
    label: 'Generate live Supabase deployment proof packet',
    command: ['node', 'scripts/generate-commercial-supabase-deployment-packet.mjs'],
  },
  {
    id: 'data-provenance',
    label: 'Verify local data provenance checksums',
    command: ['node', 'scripts/verify-commercial-data-provenance.mjs', '--write'],
  },
  {
    id: 'live-gate-evidence',
    label: 'Validate redacted live-gate evidence intake',
    command: ['node', 'scripts/verify-live-gate-evidence.mjs'],
  },
  {
    id: 'commercial-evidence-records',
    label: 'Validate redacted commercial partner/outcome evidence records',
    command: ['node', 'scripts/verify-commercial-evidence-records.mjs', '--write'],
  },
  {
    id: 'remediation-gates',
    label: 'Write APO remediation external gate ledger',
    command: ['node', 'scripts/verify-remediation-external-gates.mjs'],
  },
  {
    id: 'lint-commercial',
    label: 'Lint commercial proof-pack files',
    command: ['node', 'scripts/lint-commercial-scope.mjs'],
  },
  {
    id: 'secret-hygiene',
    label: 'Verify tracked files do not contain high-confidence secrets',
    command: ['node', 'scripts/verify-secret-hygiene.mjs'],
  },
  {
    id: 'build',
    label: 'Build production bundle',
    command: ['npm', 'run', 'build'],
  },
  {
    id: 'route-smoke',
    label: 'Smoke commercial route registration and app shell',
    command: ['node', 'scripts/smoke-commercial-routes.mjs'],
  },
];

const A11Y_STEPS = [
  {
    id: 'a11y',
    label: 'Run commercial responsive/accessibility smoke',
    command: ['node', 'scripts/verify-commercial-accessibility.mjs'],
  },
];

const NETWORK_STEPS = [
  {
    id: 'sources',
    label: 'Fetch and verify official source registry pages',
    command: ['node', 'scripts/verify-source-manifest.mjs', '--write'],
  },
  {
    id: 'audit',
    label: 'Run production dependency audit',
    command: ['npm', 'audit', '--omit=dev', '--audit-level=high'],
  },
];

const LIVE_SUPABASE_STEPS = [
  {
    id: 'live-supabase',
    label: 'Verify live Supabase commercial review/deletion boundaries',
    command: ['node', 'scripts/verify-commercial-live-supabase.mjs', '--write'],
  },
];

const LIVE_ONET_STEPS = [
  {
    id: 'live-onet-task-ratings',
    label: 'Verify live Supabase O*NET Task Ratings schema and row proof',
    command: ['node', 'scripts/verify-onet-task-ratings-live.mjs', '--write'],
  },
];

const LIVE_RESUME_PARSER_STEPS = [
  {
    id: 'live-resume-parser',
    label: 'Verify live parse-resume Edge Function parser receipts',
    command: ['node', 'scripts/verify-resume-parser-live.mjs', '--write'],
  },
];

const JOURNEY_STEPS = [
  {
    id: 'browser-journey',
    label: 'Run full commercial browser journey',
    command: ['node', 'scripts/verify-commercial-browser.mjs'],
  },
];

function hasFlag(name) {
  return process.argv.includes(name);
}

function runStep(step) {
  return new Promise((resolve) => {
    const [command, ...args] = step.command;
    const executable = process.platform === 'win32' && command === 'npm' ? 'npm.cmd' : command;
    const child = spawn(executable, args, { stdio: 'inherit' });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

function printUsage() {
  console.log(`Usage: node scripts/verify-commercial-release.mjs [options]

Options:
  --with-network   Also run official source URL checks and npm production audit.
  --with-live-supabase
                   Also run non-mutating live Supabase object/RPC proof using SUPABASE_URL and SUPABASE_ANON_KEY.
  --with-live-onet Also run non-mutating live O*NET Task Ratings schema/row proof using SUPABASE_URL and SUPABASE_ANON_KEY.
  --with-live-resume-parser
                   Also run live parse-resume Edge Function receipt proof using SUPABASE_URL and SUPABASE_ANON_KEY.
  --with-a11y      Also run the Playwright responsive/accessibility smoke gate.
  --with-journey   Also run the full Playwright lead/report/workforce browser journey.

Default gate:
  index, trust, report evidence, O*NET Task Ratings ingest boundary, live Supabase deployment packet,
  data provenance, redacted live-gate evidence intake, commercial evidence records, remediation gate ledger,
  scoped commercial lint, production build, route smoke.
`);
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    printUsage();
    return;
  }

  const includeNetwork = hasFlag('--with-network');
  const includeLiveSupabase = hasFlag('--with-live-supabase');
  const includeLiveOnet = hasFlag('--with-live-onet');
  const includeLiveResumeParser = hasFlag('--with-live-resume-parser');
  const includeA11y = hasFlag('--with-a11y');
  const includeJourney = hasFlag('--with-journey');

  const steps = [
    ...DEFAULT_STEPS,
    ...(includeA11y ? A11Y_STEPS : []),
    ...(includeNetwork ? NETWORK_STEPS : []),
    ...(includeLiveSupabase ? LIVE_SUPABASE_STEPS : []),
    ...(includeLiveOnet ? LIVE_ONET_STEPS : []),
    ...(includeLiveResumeParser ? LIVE_RESUME_PARSER_STEPS : []),
    ...(includeJourney ? JOURNEY_STEPS : []),
  ];

  const results = [];
  console.log(`Commercial verification starting with ${steps.length} step(s).`);

  for (const step of steps) {
    const startedAt = Date.now();
    console.log(`\n==> ${step.label}`);
    const code = await runStep(step);
    const durationSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    results.push({ ...step, code, durationSeconds });

    if (code !== 0) {
      console.error(`\nCommercial verification stopped at '${step.id}' after ${durationSeconds}s with exit code ${code}.`);
      process.exitCode = code;
      break;
    }
  }

  console.log('\nCommercial verification summary:');
  for (const result of results) {
    console.log(`${result.code === 0 ? 'ok' : 'fail'} ${result.id} (${result.durationSeconds}s)`);
  }

  if (results.length === steps.length && results.every((result) => result.code === 0)) {
    console.log('\nCommercial verification passed.');
  }
}

await main();
