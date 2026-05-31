# Live Supabase Deployment Runbook

Generated: 2026-05-31T19:53:07.997Z
Target project ref: `kvunnankqgfokeufvsrv`
Packet status: **pass**

Purpose: apply the commercial proof-pack schema changes in the linked Supabase project without weakening the no-employment-decision, redacted-resume, and source-evidence boundaries.

## Migration Packet

| Version | Phase | File | SHA-256 | Status |
|---|---|---|---|---|
| `20260523000100` | Phase 0/1 commercial persistence | `supabase/migrations/20260523000100_create_commercial_leads.sql` | `129290bc2cca692c...` | pass |
| `20260524000200` | Phase 5 human review events | `supabase/migrations/20260524000200_add_commercial_artifact_review_events.sql` | `f0179f9e596e98e0...` | pass |
| `20260524000300` | Phase 2 O*NET Task Ratings metadata | `supabase/migrations/20260524000300_add_onet_task_rating_metadata.sql` | `b719ea4ba88bed94...` | pass |
| `20260524000400` | Phase 5 resume deletion receipts | `supabase/migrations/20260524000400_add_resume_deletion_receipts.sql` | `26cbcd73f5380890...` | pass |
| `20260524000500` | Phase 5 redacted resume proof artifacts | `supabase/migrations/20260524000500_add_resume_proof_report_artifacts.sql` | `7ca18c1ef3788b23...` | pass |
| `20260525172048` | Commercial outreach pipeline | `supabase/migrations/20260525172048_add_commercial_outreach_pipeline.sql` | `ebbb672d2ec56e54...` | pass |
| `20260526000100` | Commercial outreach response metrics | `supabase/migrations/20260526000100_add_commercial_outreach_response_metrics.sql` | `c77b4715c0ad41f9...` | pass |

## Required Environment

| Variable | Purpose |
|---|---|
| `SUPABASE_DB_PASSWORD` | Remote database password required by Supabase CLI for migration list, dry run, and db push. |
| `SUPABASE_URL or VITE_SUPABASE_URL` | Public project URL required by non-mutating live verification scripts. |
| `SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY` | Anon/publishable key required by non-mutating live verification scripts; never use or print service-role keys for these checks. |
| `SUPABASE_SERVICE_ROLE_KEY` | Target-project service-role key required only for the O*NET Task Ratings ingest runner; never print it or store it in repo files. |

## Deployment Commands

Confirm linked migration history:
```bash
SUPABASE_DB_PASSWORD="[redacted]" supabase migration list
```

Preview pending production migrations without applying them:
```bash
SUPABASE_DB_PASSWORD="[redacted]" supabase db push --dry-run
```

Apply pending migrations after reviewing the dry run:
```bash
SUPABASE_DB_PASSWORD="[redacted]" supabase db push
```

Force PostgREST schema cache reload if new objects are still hidden by schema-cache errors:
```bash
NOTIFY pgrst, 'reload schema';
```

Verify commercial live Supabase boundaries after deployment:
```bash
npm run verify:commercial-live-supabase
```

Verify live parse-resume Edge Function parser receipts after function deploy:
```bash
npm run verify:resume-parser-live
```

Run official O*NET 30.3 Task Ratings ingest after target service-role key is available:
```bash
npm run ingest:onet-task-ratings -- --project-ref kvunnankqgfokeufvsrv
```

Verify live O*NET Task Ratings after migration plus ingest:
```bash
npm run verify:onet-task-ratings-live
```

## Guardrails

- Do not run remote db reset, migration down, table drops, truncation, or manual data deletion for this release.
- Prefer Supabase CLI db push so supabase_migrations.schema_migrations records applied versions.
- Do not print service-role keys, database passwords, JWTs, or raw resume text in logs or proof artifacts.
- Treat live verifier success as object/RPC boundary proof, not as legal compliance or employment-decision validation.
- Treat live parser verifier success as synthetic receipt proof only; malware scanning, production PDF/DOC/DOCX parsing, provider logs, and backups remain separate controls.
- Treat O*NET Task Ratings live proof as schema/row evidence only; exported table checksums are still required before task-time claims.

## Acceptance Criteria

- Migration list shows the commercial proof-pack migrations applied to the linked project.
- `npm run verify:commercial-live-supabase` passes against the linked project.
- `npm run verify:resume-parser-live` passes after `parse-resume` is deployed to the target project.
- `npm run verify:onet-task-ratings-live` passes only after Task Ratings migration and ingest produce live O*NET 30.3 rows.
- Resume proof artifact live calls remain authenticated and redaction-gated.
- Report and workforce review RPCs remain protected by staff/auth/RLS boundaries.

## References

- [Supabase database migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase managing environments with CI/CD](https://supabase.com/docs/guides/deployment/managing-environments)
- [Supabase CLI db push reference](https://supabase.com/docs/reference/cli/supabase-db-push)
- [PostgREST schema cache reloading](https://docs.postgrest.org/en/stable/references/schema_cache.html)

## Current Deployment Status

This packet verifies local migration order, hashes, and guardrails. Remote application is still a credentialed operation: use `SUPABASE_DB_PASSWORD` for database migration checks/pushes, then run the live verifiers. If the commercial schema verifier already passes, the remaining deployment blockers move to Edge Function deploy permissions, O*NET Task Ratings ingest rows, and authenticated end-to-end staff/resume artifact checks.
