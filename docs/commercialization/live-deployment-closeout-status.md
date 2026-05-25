# Live Deployment Closeout Status

Updated: 2026-05-25
Target Supabase project: `kvunnankqgfokeufvsrv`
Netlify site: `career-automation-insights-engine`

## Proven

| Gate | Evidence | Status |
|---|---|---|
| Commercial Supabase schema/RPC proof | `npm run verify:commercial-live-supabase` with production public Supabase URL/anon key | Pass |
| Live resume parser proof | `npm run verify:resume-parser-live` with production public Supabase URL/anon key | Pass |
| Live O*NET Task Ratings proof | `npm run verify:onet-task-ratings-live` with production public Supabase URL/anon key | Pass |
| Live closeout readiness verifier | `env -u SUPABASE_ACCESS_TOKEN npm run verify:live-closeout-readiness` | Pass |
| Local commercial release gate | `npm run verify:commercial` | Pass |
| Secret hygiene gate | `npm run verify:secrets` and as part of `npm run verify:commercial` | Pass |
| Official source registry | `npm run verify:sources` | Pass |
| Browser/a11y buyer flows | `npm run verify:commercial-browser`, `npm run verify:commercial-a11y` | Pass in latest local run |

## Remaining Blockers

| Residual Risk | Current Evidence | Required Follow-up |
|---|---|---|
| Local Codex process still contains a stale `SUPABASE_ACCESS_TOKEN` env var | Supabase CLI calls succeed when run as `env -u SUPABASE_ACCESS_TOKEN ...`; the process-level token returned platform 403 before being unset per command | Start a fresh Codex shell or replace the process-level token before future Supabase CLI work |
| Supabase Data API schema cache is large and can be slow cold | PostGREST returned `PGRST002`/statement-timeout during initial closeout. Migrations `20260525083000` and `20260525084500` now pin exposed schemas and raise authenticator timeouts; live proof passes after cache warm-up | Keep exposed schemas narrow and avoid adding broad public-schema objects without running `npm run verify:commercial-live-supabase` |
| GitHub workflow has secrets but has not been manually dispatched in this run | Required GitHub secret names are present and `npm run verify:live-closeout-readiness` passes | Trigger `Supabase Commercial Live Closeout` from GitHub Actions before relying on CI as the live closeout proof |
| Secret rotation still required | Historical/pasted secrets were redacted in repo files, but exposure happened outside git in chat/local output | Rotate listed values; do not paste replacements into chat or tracked files |

## Ready-To-Run Closeout Paths

### GitHub Actions

Use `.github/workflows/supabase-commercial-live-closeout.yml`; these repository secrets now exist:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF` = `kvunnankqgfokeufvsrv`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Run the manual workflow with:

- `deploy_parse_resume=true`
- `ingest_onet_task_ratings=true`

The workflow deploys `parse-resume`, optionally ingests O*NET Task Ratings, then runs:

- `npm run verify:commercial-live-supabase`
- `npm run verify:onet-task-ratings-live`
- `npm run verify:resume-parser-live`

### Local

Use a terminal session with a Supabase account that can manage `kvunnankqgfokeufvsrv`, plus target project secrets. In the current Codex process, unset the stale process-level token for Supabase CLI commands:

```bash
env -u SUPABASE_ACCESS_TOKEN supabase functions deploy parse-resume --project-ref kvunnankqgfokeufvsrv
SUPABASE_URL="https://kvunnankqgfokeufvsrv.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="[redacted]" \
npm run ingest:onet-task-ratings -- --project-ref kvunnankqgfokeufvsrv
SUPABASE_URL="https://kvunnankqgfokeufvsrv.supabase.co" \
SUPABASE_ANON_KEY="[redacted]" \
npm run verify:onet-task-ratings-live
SUPABASE_URL="https://kvunnankqgfokeufvsrv.supabase.co" \
SUPABASE_ANON_KEY="[redacted]" \
npm run verify:resume-parser-live
```

## Secret Rotation Required

- Rotate the Supabase personal access token previously pasted into chat.
- Rotate the Supabase database password that existed in older tracked demo-script content and appeared in a local diff.
- Rotate the O*NET password exposed during a failed local env-list parsing attempt.
- Rotate the SerpAPI key that was previously committed in old diagnostic/demo files.

Do not paste replacement values into chat or commit them to repo files.
