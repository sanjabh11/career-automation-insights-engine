#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const OUTPUT_PATH = 'docs/commercialization/production-calibration-proof-latest.json';
const ENV_FILES = ['.env.local', '.env'];
const DEFAULT_DAYS = 90;
const DEFAULT_BIN_COUNT = 10;

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return null;
  const equalsIndex = trimmed.indexOf('=');
  const key = trimmed.slice(0, equalsIndex).trim();
  let value = trimmed.slice(equalsIndex + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

async function loadLocalEnv() {
  const loaded = {};
  for (const file of ENV_FILES) {
    try {
      const source = await readFile(file, 'utf8');
      for (const line of source.split(/\r?\n/)) {
        const parsed = parseEnvLine(line);
        if (parsed && loaded[parsed.key] === undefined) {
          loaded[parsed.key] = parsed.value;
        }
      }
    } catch {
      // Local env files are optional and secret values must never be printed.
    }
  }
  return loaded;
}

function resolveEnv(localEnv, keys) {
  for (const key of keys) {
    const value = process.env[key] || localEnv[key];
    if (value && value.trim()) return value.trim();
  }
  return '';
}

function parsePositiveInteger(value, fallback, label) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}

function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function safeError(error) {
  if (!error) return '';
  const message = typeof error === 'string' ? error : error.message || JSON.stringify(error);
  return String(message)
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email-redacted]')
    .replace(/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{8,}\b/g, '[stripe-secret-redacted]')
    .replace(/\bAIza[A-Za-z0-9_-]{20,}\b/g, '[google-key-redacted]')
    .replace(/eyJ[A-Za-z0-9._-]+/g, '[jwt-redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .replace(/service[_-]?role[_-]?key["':=\s]+[A-Za-z0-9._-]+/gi, 'service_role_key=[redacted]')
    .slice(0, 700);
}

async function writeArtifact(artifact) {
  await mkdir('docs/commercialization', { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(`wrote ${OUTPUT_PATH}`);
}

function result(id, label, passed, message, evidence = {}) {
  return {
    id,
    label,
    passed,
    message,
    ...evidence,
  };
}

function numberInRange(value, min, max) {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function validateCalibrationBody(body) {
  const checks = [];

  checks.push(
    result(
      'calibration-method',
      'calibrate-ece used expert-assessment calibration method',
      body?.method === 'apo_overall_vs_expert_assessments',
      body?.method === 'apo_overall_vs_expert_assessments'
        ? 'The deployed function reported method=apo_overall_vs_expert_assessments.'
        : 'The deployed function did not report the expected calibration method.'
    )
  );

  checks.push(
    result(
      'calibration-ece-range',
      'ECE is a normalized finite value',
      numberInRange(body?.ece, 0, 1),
      numberInRange(body?.ece, 0, 1)
        ? 'Expected calibration error is finite and within [0,1].'
        : 'Expected calibration error is missing or outside [0,1].',
      { ece: numberInRange(body?.ece, 0, 1) ? body.ece : null }
    )
  );

  checks.push(
    result(
      'calibration-sample-pairs',
      'Calibration joined live APO predictions to expert assessments',
      Number.isInteger(body?.pairsCount) && body.pairsCount > 0,
      Number.isInteger(body?.pairsCount) && body.pairsCount > 0
        ? 'The deployed function returned at least one matched prediction/expert pair.'
        : 'No matched prediction/expert pairs were returned.',
      { predictionPairCount: Number.isInteger(body?.pairsCount) ? body.pairsCount : null }
    )
  );

  checks.push(
    result(
      'calibration-expert-rows',
      'Calibration found expert assessment rows',
      Number.isInteger(body?.expertRowsCount) && body.expertRowsCount > 0,
      Number.isInteger(body?.expertRowsCount) && body.expertRowsCount > 0
        ? 'The deployed function returned at least one expert assessment row.'
        : 'No expert assessment rows were returned.',
      { expertAssessmentCount: Number.isInteger(body?.expertRowsCount) ? body.expertRowsCount : null }
    )
  );

  checks.push(
    result(
      'calibration-bins',
      'Reliability bins were produced',
      Number.isInteger(body?.binsCount) && body.binsCount > 0,
      Number.isInteger(body?.binsCount) && body.binsCount > 0
        ? 'The deployed function produced reliability bins.'
        : 'No reliability bins were returned.',
      { binsCount: Number.isInteger(body?.binsCount) ? body.binsCount : null }
    )
  );

  checks.push(
    result(
      'calibration-run-id',
      'Calibration run id is present',
      typeof body?.runId === 'string' && body.runId.length > 8,
      typeof body?.runId === 'string' && body.runId.length > 8
        ? 'The deployed function returned a calibration run id.'
        : 'No usable calibration run id was returned.',
      { runIdHash: typeof body?.runId === 'string' ? sha256(body.runId).slice(0, 16) : null }
    )
  );

  return checks;
}

async function invokeCalibrationFunction({ supabaseUrl, anonKey, days, binCount, source, cohort }) {
  const body = { days, binCount };
  if (source) body.source = source;
  if (cohort) body.cohort = cohort;

  const response = await fetch(`${supabaseUrl}/functions/v1/calibrate-ece`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `calibrate-ece returned HTTP ${response.status}`);
  }
  return payload;
}

async function main() {
  const shouldWrite = hasFlag('--write');
  const allowMissingEnv = hasFlag('--allow-missing-env');
  const generatedAt = new Date().toISOString();
  const localEnv = await loadLocalEnv();

  const supabaseUrl = resolveEnv(localEnv, ['SUPABASE_URL', 'VITE_SUPABASE_URL']);
  const anonKey = resolveEnv(localEnv, ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'PUBLIC_SUPABASE_ANON_KEY']);
  const days = parsePositiveInteger(resolveEnv(localEnv, ['CALIBRATION_DAYS', 'PRODUCTION_CALIBRATION_DAYS']), DEFAULT_DAYS, 'CALIBRATION_DAYS');
  const binCount = parsePositiveInteger(resolveEnv(localEnv, ['CALIBRATION_BIN_COUNT', 'PRODUCTION_CALIBRATION_BIN_COUNT']), DEFAULT_BIN_COUNT, 'CALIBRATION_BIN_COUNT');
  const source = resolveEnv(localEnv, ['CALIBRATION_SOURCE', 'PRODUCTION_CALIBRATION_SOURCE']);
  const cohort = resolveEnv(localEnv, ['CALIBRATION_COHORT', 'PRODUCTION_CALIBRATION_COHORT']);

  const missing = [
    ['SUPABASE_URL or VITE_SUPABASE_URL', supabaseUrl],
    ['SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY', anonKey],
  ].filter(([, value]) => !value);

  const baseArtifact = {
    generatedAt,
    target: supabaseUrl ? new URL(supabaseUrl).origin : null,
    status: 'pending',
    confidence: 'bounded_production_calibration_run',
    caveat:
      'This verifier invokes the deployed calibrate-ece Supabase Edge Function and validates only the redacted response shape and counts. It does not apply migrations, deploy functions, inspect raw expert labels, print secrets, or prove scientific validity beyond the returned sample.',
    functionPreconditions: [
      'The target Supabase project must already have the approved calibration migrations applied.',
      'The deployed calibrate-ece function must have its own SUPABASE_SERVICE_ROLE_KEY configured in Supabase function secrets.',
      'The target database must contain approved expert_assessments rows and APO logs with matching occupation codes.',
    ],
    doesNotProve: [
      'Scientific validation beyond the measured sample',
      'Future model performance',
      'Employment-decision validity',
      'Successful migration or deployment',
      'Raw label provenance',
    ],
    manualInterventionIfSkipped: [
      'Confirm calibration migrations and the deployed calibrate-ece function are already approved for the target Supabase project.',
      'Provide SUPABASE_URL or VITE_SUPABASE_URL and SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY for the target project.',
      'Confirm the deployed function has SUPABASE_SERVICE_ROLE_KEY configured as a Supabase secret; do not put service-role values in chat or tracked files.',
      'Run npm run verify:production-calibration. Review the redacted artifact and attach owner-held raw proof only through the live-gate evidence template.',
    ],
    request: {
      days,
      binCount,
      source: source || 'all',
      cohort: cohort || null,
    },
    checks: [],
  };

  if (missing.length > 0) {
    const artifact = {
      ...baseArtifact,
      status: 'skipped_missing_env',
      missingEnv: missing.map(([key]) => key),
      checks: [
        result(
          'production-calibration-env',
          'Production calibration target credentials are configured',
          false,
          `Missing: ${missing.map(([key]) => key).join(', ')}`
        ),
      ],
    };
    if (shouldWrite) await writeArtifact(artifact);
    if (!allowMissingEnv) {
      console.error('Production calibration proof skipped because required env values are missing.');
      process.exitCode = 1;
    } else {
      console.log('Production calibration proof skipped because required env values are missing.');
    }
    return;
  }

  const checks = [
    result(
      'production-calibration-env',
      'Production calibration target credentials are configured',
      true,
      'Required target URL and anon key were provided without printing secret values.'
    ),
  ];

  try {
    const calibrationBody = await invokeCalibrationFunction({ supabaseUrl, anonKey, days, binCount, source, cohort });
    checks.push(...validateCalibrationBody(calibrationBody));

    const passed = checks.every((check) => check.passed);
    const artifact = {
      ...baseArtifact,
      status: passed ? 'passed' : 'failed',
      checks,
      evidenceSummary: {
        ece: numberInRange(calibrationBody?.ece, 0, 1) ? calibrationBody.ece : null,
        mae: numberInRange(calibrationBody?.mae, 0, 1) ? calibrationBody.mae : null,
        rmse: numberInRange(calibrationBody?.rmse, 0, 1) ? calibrationBody.rmse : null,
        expertAssessmentCount: Number.isInteger(calibrationBody?.expertRowsCount) ? calibrationBody.expertRowsCount : null,
        predictionPairCount: Number.isInteger(calibrationBody?.pairsCount) ? calibrationBody.pairsCount : null,
        binsCount: Number.isInteger(calibrationBody?.binsCount) ? calibrationBody.binsCount : null,
        unmatchedApoLogs: Number.isInteger(calibrationBody?.unmatchedApoLogs) ? calibrationBody.unmatchedApoLogs : null,
        method: calibrationBody?.method || null,
        source: calibrationBody?.source || source || 'all',
        runIdHash: typeof calibrationBody?.runId === 'string' ? sha256(calibrationBody.runId).slice(0, 16) : null,
        targetProjectHash: sha256(new URL(supabaseUrl).origin).slice(0, 16),
      },
    };

    if (shouldWrite) await writeArtifact(artifact);
    console.log(JSON.stringify({
      ok: passed,
      status: artifact.status,
      target: artifact.target,
      checks: checks.map((check) => ({ id: check.id, passed: check.passed })),
      wrote: shouldWrite ? OUTPUT_PATH : null,
    }, null, 2));

    if (!passed) process.exitCode = 1;
  } catch (error) {
    const artifact = {
      ...baseArtifact,
      status: 'failed',
      checks,
      error: safeError(error),
    };
    if (shouldWrite) await writeArtifact(artifact);
    console.error(safeError(error));
    process.exitCode = 1;
  }
}

await main();
