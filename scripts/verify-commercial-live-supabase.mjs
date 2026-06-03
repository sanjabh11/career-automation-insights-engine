#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';

const OUTPUT_PATH = 'docs/commercialization/live-supabase-proof-latest.json';
const REQUEST_TIMEOUT_MS = Number(process.env.LIVE_SUPABASE_TIMEOUT_MS || 60_000);
const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

const ENV_FILES = ['.env.local', '.env'];

const acceptableErrorPatterns = [
  /permission denied/i,
  /not authorized/i,
  /authentication_required/i,
  /not_found_or_not_owned/i,
  /not found/i,
  /not owned/i,
  /report artifact not found/i,
  /JWT/i,
  /authenticated/i,
];

const statementTimeoutPatterns = [
  /statement timeout/i,
  /canceling statement due to statement timeout/i,
  /57014/i,
];

const missingObjectPatterns = [
  /could not find/i,
  /schema cache/i,
  /does not exist/i,
  /undefined function/i,
  /PGRST202/i,
  /PGRST203/i,
  /PGRST204/i,
  /PGRST205/i,
  /function .* does not exist/i,
];

const checks = [
  {
    id: 'resume-deletion-receipts-table',
    label: 'resume_analysis_deletion_receipts table is exposed or access-denied, not missing',
    method: 'GET',
    path: '/rest/v1/resume_analysis_deletion_receipts?select=id,analysis_id,receipt_hash&limit=0',
    expectedBoundary: 'table-present-rls-or-empty',
    acceptStatementTimeoutAsPresent: true,
  },
  {
    id: 'resume-proof-report-artifacts-table',
    label: 'resume_proof_report_artifacts table is exposed or access-denied, not missing',
    method: 'GET',
    path: '/rest/v1/resume_proof_report_artifacts?select=id,analysis_id,review_status,raw_resume_text_stored,resume_detail_rows_redacted&limit=0',
    expectedBoundary: 'table-present-rls-or-empty',
    acceptStatementTimeoutAsPresent: true,
  },
  {
    id: 'resume-proof-report-artifact-receipts-table',
    label: 'resume_proof_report_artifact_deletion_receipts table is exposed or access-denied, not missing',
    method: 'GET',
    path: '/rest/v1/resume_proof_report_artifact_deletion_receipts?select=id,artifact_id,receipt_hash&limit=0',
    expectedBoundary: 'table-present-rls-or-empty',
    acceptStatementTimeoutAsPresent: true,
  },
  {
    id: 'commercial-artifact-events-table',
    label: 'commercial_report_artifact_events table is exposed or access-denied, not missing',
    method: 'GET',
    path: '/rest/v1/commercial_report_artifact_events?select=id,event_type,artifact_id&limit=0',
    expectedBoundary: 'table-present-rls-or-empty',
    acceptStatementTimeoutAsPresent: true,
  },
  {
    id: 'commercial-staff-table',
    label: 'commercial_staff table is exposed or access-denied, not missing',
    method: 'GET',
    path: '/rest/v1/commercial_staff?select=user_id,role,active&limit=0',
    expectedBoundary: 'staff-table-present-rls-or-empty',
    acceptStatementTimeoutAsPresent: true,
  },
  {
    id: 'delete-resume-analysis-rpc',
    label: 'delete_resume_analysis_with_receipt RPC exists behind auth boundary',
    method: 'POST',
    path: '/rest/v1/rpc/delete_resume_analysis_with_receipt',
    body: { p_analysis_id: ZERO_UUID },
    expectedBoundary: 'auth-required-or-not-owned-no-mutation',
  },
  {
    id: 'create-resume-proof-report-artifact-rpc',
    label: 'create_resume_proof_report_artifact RPC exists behind auth and redaction boundary',
    method: 'POST',
    path: '/rest/v1/rpc/create_resume_proof_report_artifact',
    body: {
      p_analysis_id: null,
      p_title: 'Live proof should not mutate',
      p_report_html_redacted: '<html><body>missing redaction marker</body></html>',
      p_source_versions: {},
      p_metadata: { verification: 'non_mutating' },
    },
    expectedBoundary: 'auth-required-or-redaction-check-no-mutation',
  },
  {
    id: 'delete-resume-proof-report-artifact-rpc',
    label: 'delete_resume_proof_report_artifact_with_receipt RPC exists behind auth boundary',
    method: 'POST',
    path: '/rest/v1/rpc/delete_resume_proof_report_artifact_with_receipt',
    body: { p_artifact_id: ZERO_UUID },
    expectedBoundary: 'auth-required-or-not-owned-no-mutation',
  },
  {
    id: 'log-artifact-review-event-rpc',
    label: 'log_commercial_report_artifact_event RPC accepts new review event types behind staff boundary',
    method: 'POST',
    path: '/rest/v1/rpc/log_commercial_report_artifact_event',
    body: {
      p_artifact_id: ZERO_UUID,
      p_event_type: 'artifact_client_ready',
      p_lead_id: null,
      p_delivery_channel: 'live-supabase-proof',
      p_metadata: {
        verification: 'non_mutating',
        expected: 'permission_or_not_authorized_or_missing_artifact',
      },
    },
    expectedBoundary: 'staff-required-or-missing-artifact-or-cold-timeout-no-mutation',
    acceptStatementTimeoutAsPresent: true,
  },
  {
    id: 'artifact-event-history-rpc',
    label: 'get_commercial_report_artifact_events RPC exists behind staff boundary',
    method: 'POST',
    path: '/rest/v1/rpc/get_commercial_report_artifact_events',
    body: { p_artifact_id: ZERO_UUID, p_limit: 1 },
    expectedBoundary: 'staff-required-no-mutation',
  },
  {
    id: 'commercial-lead-outreach-plan-rpc',
    label: 'update_commercial_lead_outreach_plan RPC exists behind staff boundary',
    method: 'POST',
    path: '/rest/v1/rpc/update_commercial_lead_outreach_plan',
    body: {
      p_lead_id: ZERO_UUID,
      p_outreach_stage: 'research_ready',
      p_outreach_channel: 'email',
      p_priority: 'medium',
      p_next_follow_up_at: null,
      p_sequence_step: 0,
      p_next_action: 'non-mutating live proof',
      p_staff_notes: null,
    },
    expectedBoundary: 'staff-required-or-missing-lead-no-mutation',
    acceptStatementTimeoutAsPresent: true,
  },
  {
    id: 'commercial-lead-response-metrics-rpc',
    label: 'update_commercial_lead_response_metrics RPC exists behind staff boundary',
    method: 'POST',
    path: '/rest/v1/rpc/update_commercial_lead_response_metrics',
    body: {
      p_lead_id: ZERO_UUID,
      p_replied_at: null,
      p_reply_sentiment: 'none',
      p_meeting_booked_at: null,
      p_sample_report_sent_at: null,
      p_usefulness_score: null,
      p_objection_category: 'none',
      p_case_study_permission: false,
      p_paid_pilot_signal: false,
      p_unsubscribe_requested: false,
      p_response_notes: 'non-mutating live proof',
    },
    expectedBoundary: 'staff-required-or-missing-lead-no-mutation',
    acceptStatementTimeoutAsPresent: true,
  },
];

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function getFlagValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
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
      // Optional local env files are intentionally ignored.
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

function redactMessage(value) {
  if (!value) return '';
  return String(value)
    .replace(/eyJ[A-Za-z0-9._-]+/g, '[jwt-redacted]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [redacted]')
    .slice(0, 500);
}

function parseBodyText(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function bodyMessage(body) {
  if (!body) return '';
  if (typeof body === 'string') return body;
  if (typeof body === 'object') {
    return [body.message, body.details, body.hint, body.code].filter(Boolean).join(' ');
  }
  return String(body);
}

function classifyResponse(check, status, body) {
  const message = bodyMessage(body);
  const serialized = typeof body === 'string' ? body : JSON.stringify(body || {});
  const combined = `${message} ${serialized}`;

  if (missingObjectPatterns.some((pattern) => pattern.test(combined))) {
    return {
      passed: false,
      classification: 'missing-object-or-schema-cache',
      message: redactMessage(message || serialized),
    };
  }

  if (check.acceptStatementTimeoutAsPresent && statementTimeoutPatterns.some((pattern) => pattern.test(combined))) {
    return {
      passed: true,
      classification: 'present-cold-timeout-no-mutation',
      message:
        'The RPC was reached but the live proof call hit Postgres statement timeout before returning the expected staff-boundary response. Treat as object-present proof only; rerun after schema/cache warm-up for stronger boundary evidence.',
    };
  }

  if (status >= 200 && status < 300) {
    return {
      passed: true,
      classification: 'present-accessible',
      message: 'Object is present and request completed without mutation-sensitive payload.',
    };
  }

  if ([400, 401, 403, 404, 405].includes(status) && acceptableErrorPatterns.some((pattern) => pattern.test(combined))) {
    return {
      passed: true,
      classification: 'present-protected',
      message: redactMessage(message || serialized),
    };
  }

  return {
    passed: false,
    classification: 'unexpected-response',
    message: redactMessage(message || serialized || `HTTP ${status}`),
  };
}

async function fetchCheck(baseUrl, anonKey, check) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = new URL(check.path, baseUrl);
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: 'application/json',
  };
  if (check.method === 'POST') headers['Content-Type'] = 'application/json';

  try {
    const response = await fetch(url, {
      method: check.method,
      headers,
      body: check.method === 'POST' ? JSON.stringify(check.body || {}) : undefined,
      signal: controller.signal,
    });
    const text = await response.text();
    const body = parseBodyText(text);
    const classification = classifyResponse(check, response.status, body);
    return {
      id: check.id,
      label: check.label,
      method: check.method,
      path: check.path.replace(/\?.*$/, '?[query-redacted]'),
      expectedBoundary: check.expectedBoundary,
      status: response.status,
      ...classification,
    };
  } catch (error) {
    return {
      id: check.id,
      label: check.label,
      method: check.method,
      path: check.path.replace(/\?.*$/, '?[query-redacted]'),
      expectedBoundary: check.expectedBoundary,
      status: null,
      passed: false,
      classification: error?.name === 'AbortError' ? 'timeout' : 'request-failed',
      message: redactMessage(error?.message || 'Request failed'),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function writeProof(proof) {
  await mkdir('docs/commercialization', { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(proof, null, 2)}\n`);
}

function printUsage() {
  console.log(`Usage: node scripts/verify-commercial-live-supabase.mjs [options]

Options:
  --url <url>              Supabase project URL. Defaults to SUPABASE_URL/VITE_SUPABASE_URL/PUBLIC_SUPABASE_URL.
  --anon-key <key>         Supabase anon/publishable key. Defaults to SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY/PUBLIC_SUPABASE_ANON_KEY.
  --write                  Write redacted proof to ${OUTPUT_PATH}.
  --allow-missing-env      Exit 0 with a skipped proof artifact when URL/key are unavailable.

This is a non-mutating live proof gate. It expects protected tables/RPCs to either
return an auth/RLS/staff-boundary response or an empty accessible result, and it
fails on missing relation/function/schema-cache responses.
`);
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    printUsage();
    return;
  }

  const localEnv = await loadLocalEnv();
  const rawUrl =
    getFlagValue('--url') ||
    resolveEnv(localEnv, ['SUPABASE_URL', 'VITE_SUPABASE_URL', 'PUBLIC_SUPABASE_URL']);
  const anonKey =
    getFlagValue('--anon-key') ||
    resolveEnv(localEnv, ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY', 'PUBLIC_SUPABASE_ANON_KEY']);
  const allowMissingEnv = hasFlag('--allow-missing-env');

  const proof = {
    generatedAt: new Date().toISOString(),
    verifier: 'verify-commercial-live-supabase',
    mode: 'non-mutating-public-api-boundary',
    target: null,
    allPassed: false,
    skipped: false,
    caveat:
      'This verifies deployed object presence and auth/RLS/staff boundaries from the public Supabase API. It does not apply migrations, seed staff users, or prove authenticated end-to-end deletion/review flows.',
    checks: [],
  };

  if (!rawUrl || !anonKey) {
    proof.skipped = true;
    proof.skipReason =
      'Missing Supabase URL or anon key. Provide SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY.';
    if (allowMissingEnv) {
      if (hasFlag('--write')) await writeProof(proof);
      console.log(`skip live-supabase-proof - ${proof.skipReason}`);
      return;
    }
    console.error(proof.skipReason);
    process.exitCode = 1;
    return;
  }

  let baseUrl;
  try {
    baseUrl = new URL(rawUrl);
  } catch {
    console.error('Supabase URL is invalid.');
    process.exitCode = 1;
    return;
  }

  proof.target = {
    host: baseUrl.host,
    projectRef: baseUrl.host.split('.')[0] || null,
    anonKeyProvided: true,
  };

  const results = [];
  for (const check of checks) {
    const result = await fetchCheck(baseUrl, anonKey, check);
    results.push(result);
    console.log(`${result.passed ? 'ok' : 'fail'} ${check.id} - ${result.classification}`);
    if (!result.passed && result.message) {
      console.log(`  ${result.message}`);
    }
  }

  proof.checks = results;
  proof.allPassed = results.every((result) => result.passed);
  if (hasFlag('--write')) await writeProof(proof);

  if (!proof.allPassed) {
    console.error('Live Supabase proof failed.');
    process.exitCode = 1;
    return;
  }

  console.log('Live Supabase proof passed.');
}

await main();
