# Live Closeout Readiness

Status: `owner_access_required`
Generated: `2026-07-17T10:06:42.609Z`
Target project ref: `kvunnankqgfokeufvsrv`

This is a redacted status artifact for the local CLI context. It is not a live deployment or closeout proof.

## Counts

| Item | Count |
| --- | ---: |
| Checks | 4 |
| Failed checks | 4 |
| Official references | 4 |
| Next actions | 3 |
| Does-not-prove boundaries | 6 |

## Checks

| Check | Result | Message |
| --- | --- | --- |
| github-secrets-visible | blocked | spawnSync gh ETIMEDOUT |
| github-live-closeout-secrets-present | blocked | Missing required GitHub secret name(s): SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, LIVE_SUPABASE_TEST_USER_EMAIL, LIVE_SUPABASE_TEST_USER_PASSWORD |
| supabase-target-project-visible | blocked | spawnSync supabase ETIMEDOUT |
| supabase-functions-api-accessible | blocked | spawnSync supabase ETIMEDOUT |

## Secret Name Boundary

- Required GitHub secret names present: 0/7
- Missing required GitHub secret names: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LIVE_SUPABASE_TEST_USER_EMAIL`, `LIVE_SUPABASE_TEST_USER_PASSWORD`
- Secret values persisted: `no`
- All repository secret names persisted: `no`

## Supabase Access Boundary

| Field | Value |
| --- | --- |
| Projects list available | `no` |
| Target project visible | `no` |
| Visible project ref count | 0 |
| Visible project refs persisted | `no` |
| Functions API accessible | `no` |

## Official References

These references explain the access and secret-management surfaces checked above. They do not prove this local account has owner access, valid secret values, or a completed live closeout.

| Reference | URL | Applies to |
| --- | --- | --- |
| supabase-access-control | [Supabase access control](https://supabase.com/docs/guides/platform/access-control) | supabase-target-project-visible, supabase-functions-api-accessible |
| supabase-cli-login | [Supabase CLI login](https://supabase.com/docs/reference/cli/supabase-login) | supabase-target-project-visible, supabase-functions-api-accessible |
| supabase-functions-list | [Supabase functions list](https://supabase.com/docs/reference/cli/supabase-functions-list) | supabase-functions-api-accessible |
| github-actions-secrets | [GitHub Actions secrets](https://docs.github.com/en/actions/concepts/security/secrets) | github-secrets-visible, github-live-closeout-secrets-present |

## Next Actions

- Use a Supabase account that can manage the target project before claiming live closeout readiness.
- If the target project should be visible, refresh Supabase CLI authentication outside tracked files and rerun npm run verify:live-closeout-readiness.
- Keep the strict verifier as the acceptance proof; use --allow-incomplete only for redacted status artifacts.

## Evidence Boundary

This verifier checks only whether the current local CLI context can see required GitHub secret names and the target Supabase project/functions surface for live closeout. It records secret names only, never secret values, and does not deploy, mutate, ingest, rotate, or prove production behavior.

## Does Not Prove

- live deployment completion
- O*NET ingest completion
- parse-resume deployment completion
- commercial-ready status
- live checkout, live MRR, partner commitments, documented outcomes, manual WCAG conformance, legal compliance, or production uptime
- validity, freshness, or correctness of any secret value
