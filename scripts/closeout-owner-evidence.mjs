#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

function hasFlag(name) {
  return args.includes(name);
}

function readFlagValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function parseJsonOutput(stdout) {
  const trimmed = String(stdout || '').trim();
  if (!trimmed) return null;

  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first < 0 || last < first) return null;

  try {
    return JSON.parse(trimmed.slice(first, last + 1));
  } catch {
    return null;
  }
}

function commandString(commandArgs) {
  return ['node', ...commandArgs].map((part) => (/\s/.test(part) ? JSON.stringify(part) : part)).join(' ');
}

function runNodeStep(id, label, commandArgs) {
  const result = spawnSync(process.execPath, commandArgs, {
    cwd: root,
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  const parsed = parseJsonOutput(result.stdout);
  return {
    id,
    label,
    command: commandString(commandArgs),
    status: result.status === 0 ? 'pass' : 'fail',
    exitCode: result.status,
    signal: result.signal || null,
    summary: summarizeStep(id, parsed),
    stderrTail: tailLines(result.stderr, 4),
  };
}

function tailLines(value, count) {
  return String(value || '')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-count);
}

function summarizeStep(id, parsed) {
  if (!parsed) return { parsed: false };

  if (id === 'compose-live-evidence') {
    return {
      ok: parsed.ok,
      complete: parsed.complete,
      wrote: parsed.wrote,
      acceptedGateIds: parsed.acceptedGateIds || [],
      errorCount: parsed.errorCount || 0,
    };
  }

  if (id === 'compose-commercial-records') {
    return {
      ok: parsed.ok,
      wrote: parsed.wrote,
      partnerGateSatisfied: parsed.partnerGateSatisfied,
      outcomeGateSatisfied: parsed.outcomeGateSatisfied,
      uniqueDesignPartnerCount: parsed.uniqueDesignPartnerCount,
      uniqueOutcomeCount: parsed.uniqueOutcomeCount,
      errorCount: parsed.errorCount || 0,
    };
  }

  if (id === 'verify-live-evidence') {
    return {
      ok: parsed.ok,
      found: parsed.found,
      complete: parsed.complete,
      acceptedGateIds: parsed.acceptedGateIds || [],
      errorCount: parsed.errorCount || 0,
    };
  }

  if (id === 'verify-commercial-records') {
    return {
      ok: parsed.ok,
      found: parsed.found,
      partnerGateSatisfied: parsed.partnerGateSatisfied,
      outcomeGateSatisfied: parsed.outcomeGateSatisfied,
      uniqueDesignPartnerCount: parsed.uniqueDesignPartnerCount,
      uniqueOutcomeCount: parsed.uniqueOutcomeCount,
      errorCount: parsed.errorCount || 0,
    };
  }

  if (id === 'verify-remediation-gates') {
    return {
      ok: parsed.ok,
      goalComplete: parsed.goalComplete,
      acceptedLiveGateIds: parsed.liveGateEvidence?.acceptedGateIds || [],
      partnerGateSatisfied: parsed.commercialEvidenceRecords?.partnerGateSatisfied,
      outcomeGateSatisfied: parsed.commercialEvidenceRecords?.outcomeGateSatisfied,
      blockedGateIds: (parsed.gates || [])
        .filter((gate) => String(gate.status || '').startsWith('blocked_'))
        .map((gate) => gate.id),
      wrote: parsed.wrote || null,
    };
  }

  if (id === 'write-completion-audit') {
    return {
      ok: parsed.ok,
      goalComplete: parsed.goalComplete,
      remainingExternalGateCount: parsed.remainingExternalGateCount,
      wrote: parsed.wrote || null,
      errors: parsed.errors || [],
    };
  }

  return parsed;
}

const shouldWrite = hasFlag('--write');
const allowIncomplete = hasFlag('--allow-incomplete');
const refreshTracked = hasFlag('--refresh-tracked');
const liveEvidencePath = readFlagValue('--live-evidence', readFlagValue('--live-output', 'docs/commercialization/live-gate-evidence.local.json'));
const commercialIntakePath = readFlagValue('--commercial-intake', 'docs/commercialization/commercial-evidence-intake.local.json');
const commercialRecordsPath = readFlagValue('--commercial-evidence', readFlagValue('--commercial-output', 'docs/commercialization/commercial-evidence-records.local.json'));

const liveComposeArgs = [
  'scripts/compose-live-gate-evidence.mjs',
  '--require-complete',
  '--output',
  liveEvidencePath,
];
if (shouldWrite) liveComposeArgs.push('--write');

for (const passThroughFlag of [
  '--stripe-test-artifact',
  '--production-calibration-artifact',
  '--live-auth-e2e-artifact',
  '--stripe-live-mrr-artifact',
]) {
  const value = readFlagValue(passThroughFlag);
  if (value) liveComposeArgs.push(passThroughFlag, value);
}

const commercialComposeArgs = [
  'scripts/compose-commercial-evidence-records.mjs',
  '--require-all',
  '--intake',
  commercialIntakePath,
  '--output',
  commercialRecordsPath,
];
if (shouldWrite) commercialComposeArgs.push('--write');

const remediationGateArgs = [
  'scripts/verify-remediation-external-gates.mjs',
  '--live-evidence',
  liveEvidencePath,
  '--commercial-evidence',
  commercialRecordsPath,
  '--require-complete',
];
if (refreshTracked) remediationGateArgs.push('--write');

const steps = [
  runNodeStep('compose-live-evidence', 'Compose redacted live-gate evidence from owner-run proof artifacts', liveComposeArgs),
  runNodeStep('compose-commercial-records', 'Compose redacted partner/outcome records from owner-held intake', commercialComposeArgs),
  runNodeStep('verify-live-evidence', 'Validate redacted live-gate evidence fail-closed', [
    'scripts/verify-live-gate-evidence.mjs',
    '--evidence',
    liveEvidencePath,
    '--require-complete',
  ]),
  runNodeStep('verify-commercial-records', 'Validate redacted commercial evidence records fail-closed', [
    'scripts/verify-commercial-evidence-records.mjs',
    '--evidence',
    commercialRecordsPath,
    '--require-all',
  ]),
  runNodeStep('verify-remediation-gates', 'Validate final remediation gates fail-closed', remediationGateArgs),
];

const remediationStep = steps.find((step) => step.id === 'verify-remediation-gates');
const goalComplete = remediationStep?.summary?.goalComplete === true;

if (goalComplete && refreshTracked) {
  steps.push(runNodeStep('write-completion-audit', 'Refresh tracked remediation completion audit', [
    'scripts/verify-remediation-completion-audit.mjs',
    '--write',
  ]));
}

const failedSteps = steps.filter((step) => step.status !== 'pass');
const result = {
  ok: failedSteps.length === 0 && goalComplete,
  goalComplete,
  writeMode: shouldWrite,
  refreshTracked,
  allowIncomplete,
  paths: {
    liveEvidence: liveEvidencePath,
    commercialIntake: commercialIntakePath,
    commercialEvidence: commercialRecordsPath,
  },
  evidenceBoundary: 'This command orchestrates redacted local evidence only. Raw Stripe exports, Supabase secrets, customer identities, partner names, contracts, private notes, quotes, and hash salts must remain owner-held outside tracked files.',
  steps,
  failedStepIds: failedSteps.map((step) => step.id),
  nextCommands: {
    collectLiveProofs: [
      'npm run verify:stripe-test-checkout',
      'npm run verify:production-calibration',
      'npm run verify:commercial-live-auth-e2e',
      'npm run verify:stripe-live-mrr',
    ],
    composeAndCloseout: `npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence ${liveEvidencePath} --commercial-intake ${commercialIntakePath} --commercial-evidence ${commercialRecordsPath}`,
    statusOnly: 'npm run verify:owner-evidence-closeout',
  },
};

console.log(JSON.stringify(result, null, 2));

if (!allowIncomplete && !result.ok) {
  process.exitCode = 1;
}
