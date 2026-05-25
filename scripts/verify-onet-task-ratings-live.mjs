#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';

const OUTPUT_PATH = 'docs/commercialization/onet-task-ratings-live-proof-latest.json';
const REQUEST_TIMEOUT_MS = 20_000;
const ENV_FILES = ['.env.local', '.env'];

const missingObjectPatterns = [
  /could not find/i,
  /schema cache/i,
  /does not exist/i,
  /undefined table/i,
  /undefined column/i,
  /column .* does not exist/i,
  /relation .* does not exist/i,
  /PGRST202/i,
  /PGRST203/i,
  /PGRST204/i,
  /PGRST205/i,
];

const protectedObjectPatterns = [
  /permission denied/i,
  /not authorized/i,
  /authentication_required/i,
  /JWT/i,
  /authenticated/i,
  /row-level security/i,
];

const checks = [
  {
    id: 'onet-task-ratings-schema',
    label: 'onet_detailed_tasks exposes O*NET Task Rating metadata columns',
    mode: 'schema',
    path:
      '/rest/v1/onet_detailed_tasks?select=onet_release_version,relevance_value,importance_n,frequency_category,frequency_percent,task_ratings_ingested_at&limit=1',
    expectedBoundary: 'table-and-task-rating-columns-present',
  },
  {
    id: 'onet-task-ratings-ingested-rows',
    label: 'O*NET 30.3 task rating metadata rows are present',
    mode: 'rows',
    path:
      '/rest/v1/onet_detailed_tasks?select=occupation_code,task_id,onet_release_version,importance,frequency_category,frequency_percent,task_ratings_ingested_at&onet_release_version=eq.30.3&task_ratings_ingested_at=not.is.null&importance=not.is.null&limit=5',
    expectedBoundary: 'live-ingest-has-rated-tasks',
  },
  {
    id: 'onet-task-ratings-frequency-rows',
    label: 'Dominant frequency category metadata is populated for rated tasks',
    mode: 'rows',
    path:
      '/rest/v1/onet_detailed_tasks?select=occupation_code,task_id,frequency,frequency_category,frequency_percent,task_ratings_ingested_at&frequency_category=not.is.null&frequency_percent=not.is.null&task_ratings_ingested_at=not.is.null&limit=5',
    expectedBoundary: 'live-ingest-has-frequency-metadata',
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
      // Local env files are optional for this verifier.
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
      classification: 'missing-column-or-schema-cache',
      rowCount: null,
      message: redactMessage(message || serialized),
    };
  }

  if (check.mode === 'schema') {
    if (status >= 200 && status < 300) {
      return {
        passed: true,
        classification: 'schema-present-accessible',
        rowCount: Array.isArray(body) ? body.length : null,
        message: 'O*NET Task Rating metadata columns are present in the deployed REST schema.',
      };
    }

    if ([400, 401, 403].includes(status) && protectedObjectPatterns.some((pattern) => pattern.test(combined))) {
      return {
        passed: true,
        classification: 'schema-present-protected',
        rowCount: null,
        message: redactMessage(message || serialized),
      };
    }

    return {
      passed: false,
      classification: 'unexpected-schema-response',
      rowCount: null,
      message: redactMessage(message || serialized || `HTTP ${status}`),
    };
  }

  if (status >= 200 && status < 300) {
    const rowCount = Array.isArray(body) ? body.length : 0;
    if (rowCount > 0) {
      return {
        passed: true,
        classification: 'metadata-ingested',
        rowCount,
        sample: body.slice(0, 3),
        message: `Found ${rowCount} deployed O*NET Task Rating metadata row(s).`,
      };
    }

    return {
      passed: false,
      classification: 'metadata-not-ingested',
      rowCount,
      message:
        'The deployed table accepts the query but returned no O*NET 30.3 Task Rating metadata rows. Run the Task Statements/Task Ratings ingest before using live rating weights.',
    };
  }

  if ([401, 403].includes(status) && protectedObjectPatterns.some((pattern) => pattern.test(combined))) {
    return {
      passed: false,
      classification: 'protected-no-live-row-proof',
      rowCount: null,
      message: redactMessage(message || serialized),
    };
  }

  return {
    passed: false,
    classification: 'unexpected-row-response',
    rowCount: null,
    message: redactMessage(message || serialized || `HTTP ${status}`),
  };
}

async function fetchCheck(baseUrl, anonKey, check) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = new URL(check.path, baseUrl);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    const text = await response.text();
    const body = parseBodyText(text);
    const classification = classifyResponse(check, response.status, body);
    return {
      id: check.id,
      label: check.label,
      method: 'GET',
      path: check.path.replace(/\?.*$/, '?[query-redacted]'),
      expectedBoundary: check.expectedBoundary,
      status: response.status,
      ...classification,
    };
  } catch (error) {
    return {
      id: check.id,
      label: check.label,
      method: 'GET',
      path: check.path.replace(/\?.*$/, '?[query-redacted]'),
      expectedBoundary: check.expectedBoundary,
      status: null,
      passed: false,
      classification: error?.name === 'AbortError' ? 'timeout' : 'request-failed',
      rowCount: null,
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
  console.log(`Usage: node scripts/verify-onet-task-ratings-live.mjs [options]

Options:
  --url <url>              Supabase project URL. Defaults to SUPABASE_URL/VITE_SUPABASE_URL/PUBLIC_SUPABASE_URL.
  --anon-key <key>         Supabase anon/publishable key. Defaults to SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY/PUBLIC_SUPABASE_ANON_KEY.
  --write                  Write redacted proof to ${OUTPUT_PATH}.
  --allow-missing-env      Exit 0 with a skipped proof artifact when URL/key are unavailable.

This is a non-mutating-public-api-task-rating-boundary verifier. It proves only
that the deployed Supabase REST schema can expose O*NET Task Rating metadata and
that at least one query returns ingested rating rows. It does not apply migrations,
run the O*NET ingest, or certify task-time allocation for any person or employer.
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
    verifier: 'verify-onet-task-ratings-live',
    mode: 'non-mutating-public-api-task-rating-boundary',
    target: null,
    allPassed: false,
    skipped: false,
    caveat:
      'This verifies deployed O*NET Task Rating schema and row presence from the public Supabase API. It does not apply migrations, run the ingest, prove table checksums, or certify task-time allocation.',
    checks: [],
  };

  if (!rawUrl || !anonKey) {
    proof.skipped = true;
    proof.skipReason =
      'Missing Supabase URL or anon key. Provide SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY.';
    if (hasFlag('--write')) await writeProof(proof);
    if (allowMissingEnv) {
      console.log(`skip onet-task-ratings-live-proof - ${proof.skipReason}`);
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
    console.error('Live O*NET Task Ratings proof failed.');
    process.exitCode = 1;
    return;
  }

  console.log('Live O*NET Task Ratings proof passed.');
}

await main();
