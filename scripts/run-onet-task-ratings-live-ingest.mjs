#!/usr/bin/env node

import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const DEFAULT_RELEASE = '30.3';
const REQUIRED_FILES = [
  'Task Statements',
  'Task Ratings',
  'Task Categories',
];

function getEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return '';
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function getFlagValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function projectRefFromUrl(value) {
  try {
    return new URL(value).host.split('.')[0] || '';
  } catch {
    return '';
  }
}

async function downloadTextFile(label, release, outputPath) {
  const encoded = encodeURIComponent(label).replace(/%20/g, '%20');
  const releasePath = release.replace('.', '_');
  const url = `https://www.onetcenter.org/dl_files/database/db_${releasePath}_text/${encoded}.txt`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${label}.txt from O*NET ${release}: HTTP ${response.status}`);
  }
  const text = await response.text();
  await writeFile(outputPath, text);
  const lineCount = text.split(/\r?\n/).filter(Boolean).length;
  console.log(`downloaded ${label}.txt rows=${Math.max(0, lineCount - 1)}`);
}

function runCommand(command, args, env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env,
    });
    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function assertServiceRoleAccepted(supabaseUrl, serviceRoleKey) {
  const url = new URL('/rest/v1/onet_detailed_tasks?select=occupation_code&limit=0', supabaseUrl);
  const response = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    const message = body
      .replace(/eyJ[A-Za-z0-9._-]+/g, '[jwt-redacted]')
      .replace(/sb_(?:secret|publishable)_[A-Za-z0-9._-]+/g, '[supabase-key-redacted]')
      .slice(0, 300);
    throw new Error(`Supabase service-role key was not accepted by the target project: HTTP ${response.status} ${message}`);
  }
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    console.log(`Usage: npm run ingest:onet-task-ratings -- [--release 30.3] [--project-ref kvunnankqgfokeufvsrv]

Required env:
  SUPABASE_URL or VITE_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

This downloads official O*NET text files to a temp directory, validates that the
service-role key is accepted by the target Supabase project, runs the Deno
ingest, and never prints secret values.`);
    return;
  }

  const release = getFlagValue('--release') || DEFAULT_RELEASE;
  const expectedProjectRef = getFlagValue('--project-ref') || 'kvunnankqgfokeufvsrv';
  const supabaseUrl = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL', 'PUBLIC_SUPABASE_URL');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
    return;
  }

  const projectRef = projectRefFromUrl(supabaseUrl);
  if (expectedProjectRef && projectRef !== expectedProjectRef) {
    console.error(`Refusing ingest: target project ref '${projectRef || 'unknown'}' does not match expected '${expectedProjectRef}'.`);
    process.exit(1);
    return;
  }

  await assertServiceRoleAccepted(supabaseUrl, serviceRoleKey);
  console.log(`Supabase service-role key accepted for project ${projectRef}; key redacted.`);

  const root = await mkdtemp(join(tmpdir(), 'onet-task-ratings-'));
  const onetDir = join(root, `db_${release.replace('.', '_')}_text`);

  try {
    await mkdir(onetDir, { recursive: true });
    for (const label of REQUIRED_FILES) {
      await downloadTextFile(label, release, join(onetDir, `${label}.txt`));
    }

    const code = await runCommand('deno', [
      'run',
      '-A',
      'supabase/lib/scripts/ingest_onet_metadata.ts',
      onetDir,
      release,
    ], {
      ...process.env,
      ONET_TASK_RATINGS_ONLY: '1',
      SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    });

    if (code !== 0) {
      process.exitCode = code;
      return;
    }

    console.log(`O*NET ${release} Task Ratings ingest completed. Run npm run verify:onet-task-ratings-live with the target anon key to prove live row coverage.`);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

await main();
