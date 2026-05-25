#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const checks = [
  {
    id: 'official-onet-source-checks',
    file: 'scripts/verify-source-manifest.mjs',
    expected: [
      /id: 'onet-task-statements'/,
      /Task Statements - O\*NET 30\.3/,
      /O\\\*NET-SOC Code\.\*Task ID\.\*Task\.\*Task Type/,
      /id: 'onet-task-ratings'/,
      /Task Ratings - O\*NET 30\.3/,
      /Scale ID.*Category.*Data Value/s,
      /id: 'onet-task-categories'/,
      /Frequency of Task/,
      /id: 'onet-scales-reference'/,
      /scale fields and importance example/,
    ],
  },
  {
    id: 'task-rating-migration',
    file: 'supabase/migrations/20260524000300_add_onet_task_rating_metadata.sql',
    expected: [
      /ALTER TABLE public\.onet_detailed_tasks/,
      /onet_release_version/,
      /relevance_value/,
      /importance_n/,
      /frequency_category/,
      /frequency_percent/,
      /task_ratings_ingested_at/,
      /idx_detailed_tasks_importance/,
      /idx_detailed_tasks_frequency_category/,
      /COMMENT ON COLUMN public\.onet_detailed_tasks\.frequency_percent/,
    ],
  },
  {
    id: 'deno-task-rating-ingest',
    file: 'supabase/lib/scripts/ingest_onet_metadata.ts',
    expected: [
      /ingestTaskStatementsAndRatings/,
      /Task Statements\.txt/,
      /Task Ratings\.txt/,
      /Task Categories\.txt/,
      /onetReleaseVersion = "30\.3"/,
      /scaleId === "IM"/,
      /scaleId === "RT"/,
      /scaleId === "FT"/,
      /dominant O\*NET Task Ratings FT frequency category|frequency_category/,
      /onet_detailed_tasks/,
      /task_ratings_ingested_at/,
    ],
  },
  {
    id: 'runtime-weighting-boundary',
    file: 'src/lib/workTransitionProofPack.ts',
    expected: [
      /OnetTaskRatingWeightInput/,
      /buildOnetTaskRatingWeighting/,
      /method: "onet_task_ratings_ready"/,
      /O\*NET 30\.3 Task Ratings ingest and checksum gate/,
      /occupation-level survey summaries/,
    ],
  },
  {
    id: 'data-provenance-covers-task-ratings',
    file: 'scripts/verify-commercial-data-provenance.mjs',
    expected: [
      /onet-task-ratings-ingest-script/,
      /Task Statements\.txt/,
      /Task Ratings\.txt/,
      /Task Categories\.txt/,
      /onet-task-rating-metadata-migration/,
      /20260524000300_add_onet_task_rating_metadata\.sql/,
    ],
  },
  {
    id: 'live-onet-task-ratings-proof-gate',
    file: 'scripts/verify-onet-task-ratings-live.mjs',
    expected: [
      /onet_detailed_tasks/,
      /task_ratings_ingested_at/,
      /metadata-not-ingested/,
      /missing-column-or-schema-cache/,
      /non-mutating-public-api-task-rating-boundary/,
      /allow-missing-env/,
    ],
  },
];

async function main() {
  const failures = [];

  for (const check of checks) {
    const source = await readFile(check.file, 'utf8');
    const missing = check.expected.filter((pattern) => !pattern.test(source));
    if (missing.length > 0) {
      failures.push(`${check.id} missing ${missing.length} expected pattern(s) in ${check.file}`);
      console.log(`fail ${check.id}`);
    } else {
      console.log(`ok ${check.id}`);
    }
  }

  if (failures.length > 0) {
    console.error(`\nO*NET Task Ratings ingest verification failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('O*NET Task Ratings ingest verification passed.');
  }
}

await main();
