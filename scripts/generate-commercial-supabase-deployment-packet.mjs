#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const OUTPUT_DIR = 'docs/commercialization';
const JSON_OUTPUT = `${OUTPUT_DIR}/live-supabase-deployment-packet.json`;
const MD_OUTPUT = `${OUTPUT_DIR}/live-supabase-deployment-runbook.md`;
const PROJECT_REF_PATH = 'supabase/.temp/project-ref';

const migrations = [
  {
    phase: 'Phase 0/1 commercial persistence',
    file: 'supabase/migrations/20260523000100_create_commercial_leads.sql',
    reason: 'Lead capture, commercial artifacts, workforce audit persistence, and staff boundaries.',
    expectedSnippets: [
      'commercial_leads',
      'capture_commercial_lead',
      'commercial_report_artifacts',
      'create_commercial_report_artifact',
      'commercial_workforce_audits',
      'create_commercial_workforce_audit',
    ],
  },
  {
    phase: 'Phase 5 human review events',
    file: 'supabase/migrations/20260524000200_add_commercial_artifact_review_events.sql',
    reason: 'Append-only section review, artifact client-ready approval, actor identity, and review attestation trail.',
    expectedSnippets: [
      'commercial_report_artifact_events',
      'section_review_updated',
      'section_client_ready',
      'artifact_client_ready',
      'log_commercial_report_artifact_event',
    ],
  },
  {
    phase: 'Phase 2 O*NET Task Ratings metadata',
    file: 'supabase/migrations/20260524000300_add_onet_task_rating_metadata.sql',
    reason: 'Task Ratings columns needed before replacing proxy task-weight evidence with live O*NET 30.3 metadata.',
    expectedSnippets: [
      'onet_release_version',
      'relevance_value',
      'frequency_category',
      'frequency_percent',
      'task_ratings_ingested_at',
    ],
  },
  {
    phase: 'Phase 5 resume deletion receipts',
    file: 'supabase/migrations/20260524000400_add_resume_deletion_receipts.sql',
    reason: 'Authenticated app-level resume analysis deletion receipts with model-provider and backup caveats.',
    expectedSnippets: [
      'resume_analysis_deletion_receipts',
      'delete_resume_analysis_with_receipt',
      'raw_text_retention_policy',
      'model_provider_boundary',
      'receipt_hash',
    ],
  },
  {
    phase: 'Phase 5 redacted resume proof artifacts',
    file: 'supabase/migrations/20260524000500_add_resume_proof_report_artifacts.sql',
    reason: 'Authenticated user-owned redacted resume proof-report artifacts and artifact deletion receipts.',
    expectedSnippets: [
      'resume_proof_report_artifacts',
      'resume_proof_report_artifact_deletion_receipts',
      'create_resume_proof_report_artifact',
      'delete_resume_proof_report_artifact_with_receipt',
      'data-resume-proof-report-redacted="true"',
      'GRANT SELECT ON public.resume_proof_report_artifacts TO authenticated',
    ],
  },
];

const unsafePatterns = [
  { label: 'DROP TABLE', pattern: /\bDROP\s+TABLE\b/i },
  { label: 'DROP SCHEMA', pattern: /\bDROP\s+SCHEMA\b/i },
  { label: 'TRUNCATE', pattern: /\bTRUNCATE\b/i },
  { label: 'DROP COLUMN', pattern: /\bDROP\s+COLUMN\b/i },
  { label: 'REMOTE RESET', pattern: /\bdb\s+reset\b|\breset\s+--linked\b/i },
];

const requiredEnvironment = [
  {
    name: 'SUPABASE_DB_PASSWORD',
    purpose: 'Remote database password required by Supabase CLI for migration list, dry run, and db push.',
  },
  {
    name: 'SUPABASE_URL or VITE_SUPABASE_URL',
    purpose: 'Public project URL required by non-mutating live verification scripts.',
  },
  {
    name: 'SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY',
    purpose: 'Anon/publishable key required by non-mutating live verification scripts; never use or print service-role keys for these checks.',
  },
];

const references = [
  {
    label: 'Supabase database migrations',
    url: 'https://supabase.com/docs/guides/deployment/database-migrations',
  },
  {
    label: 'Supabase managing environments with CI/CD',
    url: 'https://supabase.com/docs/guides/deployment/managing-environments',
  },
  {
    label: 'Supabase CLI db push reference',
    url: 'https://supabase.com/docs/reference/cli/supabase-db-push',
  },
  {
    label: 'PostgREST schema cache reloading',
    url: 'https://docs.postgrest.org/en/stable/references/schema_cache.html',
  },
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function readOptional(path) {
  try {
    return (await readFile(path, 'utf8')).trim();
  } catch {
    return null;
  }
}

function versionFromFile(file) {
  const match = file.match(/\/([0-9]{14})_/);
  return match?.[1] || '';
}

function renderMarkdown(packet) {
  const migrationRows = packet.migrations.map((migration) =>
    `| \`${migration.version}\` | ${migration.phase} | \`${migration.file}\` | \`${migration.sha256.slice(0, 16)}...\` | ${migration.status} |`
  );
  const envRows = packet.requiredEnvironment.map((item) => `| \`${item.name}\` | ${item.purpose} |`);
  const guardRows = packet.guardrails.map((item) => `- ${item}`);
  const commandRows = packet.commands.map((item) => `\n${item.label}:\n\`\`\`bash\n${item.command}\n\`\`\``);
  const acceptanceRows = packet.acceptanceCriteria.map((item) => `- ${item}`);
  const referenceRows = packet.references.map((item) => `- [${item.label}](${item.url})`);

  return `# Live Supabase Deployment Runbook

Generated: ${packet.generatedAt}
Target project ref: \`${packet.targetProjectRef || 'not-detected'}\`
Packet status: **${packet.allPassed ? 'pass' : 'fail'}**

Purpose: apply the commercial proof-pack schema changes in the linked Supabase project without weakening the no-employment-decision, redacted-resume, and source-evidence boundaries.

## Migration Packet

| Version | Phase | File | SHA-256 | Status |
|---|---|---|---|---|
${migrationRows.join('\n')}

## Required Environment

| Variable | Purpose |
|---|---|
${envRows.join('\n')}

## Deployment Commands
${commandRows.join('\n')}

## Guardrails

${guardRows.join('\n')}

## Acceptance Criteria

${acceptanceRows.join('\n')}

## References

${referenceRows.join('\n')}

## Current Blocker

Remote migration application is intentionally not attempted by this packet. The latest local CLI attempt failed because the session did not have the required database password or platform privileges. Provide \`SUPABASE_DB_PASSWORD\` in a secure shell or CI secret, then run the commands above.
`;
}

async function main() {
  const targetProjectRef = await readOptional(PROJECT_REF_PATH);
  const orderedVersions = migrations.map((migration) => versionFromFile(migration.file));
  const versionsAreSorted = orderedVersions.every((version, index, values) => index === 0 || values[index - 1] < version);

  const migrationResults = [];
  const combinedParts = [];

  for (const migration of migrations) {
    const source = await readFile(migration.file, 'utf8');
    combinedParts.push(`-- ${migration.file}\n${source}`);
    const missingSnippets = migration.expectedSnippets.filter((snippet) => !source.includes(snippet));
    const unsafeMatches = unsafePatterns
      .filter((item) => item.pattern.test(source))
      .map((item) => item.label);
    const version = versionFromFile(migration.file);

    migrationResults.push({
      ...migration,
      version,
      lineCount: source.split(/\r?\n/).length,
      sha256: sha256(source),
      missingSnippets,
      unsafeMatches,
      status: missingSnippets.length === 0 && unsafeMatches.length === 0 ? 'pass' : 'fail',
    });
  }

  const packet = {
    generatedAt: new Date().toISOString(),
    targetProjectRef,
    allPassed: versionsAreSorted && migrationResults.every((migration) => migration.status === 'pass'),
    versionsAreSorted,
    requiredEnvironment,
    combinedSqlSha256: sha256(combinedParts.join('\n\n')),
    references,
    migrations: migrationResults,
    commands: [
      {
        label: 'Confirm linked migration history',
        command: 'SUPABASE_DB_PASSWORD="[redacted]" supabase migration list',
      },
      {
        label: 'Preview pending production migrations without applying them',
        command: 'SUPABASE_DB_PASSWORD="[redacted]" supabase db push --dry-run',
      },
      {
        label: 'Apply pending migrations after reviewing the dry run',
        command: 'SUPABASE_DB_PASSWORD="[redacted]" supabase db push',
      },
      {
        label: 'Force PostgREST schema cache reload if new objects are still hidden by schema-cache errors',
        command: "NOTIFY pgrst, 'reload schema';",
      },
      {
        label: 'Verify commercial live Supabase boundaries after deployment',
        command: 'npm run verify:commercial-live-supabase',
      },
      {
        label: 'Verify live O*NET Task Ratings after migration plus ingest',
        command: 'npm run verify:onet-task-ratings-live',
      },
    ],
    guardrails: [
      'Do not run remote db reset, migration down, table drops, truncation, or manual data deletion for this release.',
      'Prefer Supabase CLI db push so supabase_migrations.schema_migrations records applied versions.',
      'Do not print service-role keys, database passwords, JWTs, or raw resume text in logs or proof artifacts.',
      'Treat live verifier success as object/RPC boundary proof, not as legal compliance or employment-decision validation.',
      'Treat O*NET Task Ratings live proof as schema/row evidence only; exported table checksums are still required before task-time claims.',
    ],
    acceptanceCriteria: [
      'Migration list shows the commercial proof-pack migrations applied to the linked project.',
      '`npm run verify:commercial-live-supabase` passes against the linked project.',
      '`npm run verify:onet-task-ratings-live` passes only after Task Ratings migration and ingest produce live O*NET 30.3 rows.',
      'Resume proof artifact live calls remain authenticated and redaction-gated.',
      'Report and workforce review RPCs remain protected by staff/auth/RLS boundaries.',
    ],
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(JSON_OUTPUT, `${JSON.stringify(packet, null, 2)}\n`);
  await writeFile(MD_OUTPUT, renderMarkdown(packet));

  console.log(`wrote ${JSON_OUTPUT}`);
  console.log(`wrote ${MD_OUTPUT}`);

  if (!packet.allPassed) {
    const failures = migrationResults
      .filter((migration) => migration.status !== 'pass')
      .map((migration) => `${migration.file}: missing=[${migration.missingSnippets.join(', ')}] unsafe=[${migration.unsafeMatches.join(', ')}]`);
    if (!versionsAreSorted) failures.unshift('migration versions are not sorted');
    console.error(`Commercial Supabase deployment packet failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
    process.exitCode = 1;
  }
}

await main();
