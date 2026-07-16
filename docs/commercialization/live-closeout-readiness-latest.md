# Live Closeout Readiness

Status: `owner_access_required`
Generated: `2026-06-08T23:23:08.202Z`
Target project ref: `kvunnankqgfokeufvsrv`

This is a redacted status artifact for the local CLI context. It is not a live deployment or closeout proof.

## Counts

| Item | Count |
| --- | ---: |
| Checks | 4 |
| Failed checks | 2 |
| Official references | 4 |
| Next actions | 3 |
| Does-not-prove boundaries | 6 |

## Checks

| Check | Result | Message |
| --- | --- | --- |
| github-secrets-visible | pass | GitHub secret names are readable. |
| github-live-closeout-secrets-present | pass | Required GitHub secret names are present. |
| supabase-target-project-visible | blocked | Target project kvunnankqgfokeufvsrv is not visible to the current Supabase account. |
| supabase-functions-api-accessible | blocked | unexpected list functions status 403: {"message":"Your account does not have the necessary privileges to access this endpoint. For more details, refer to our documentation https://supabase.com/docs/guides/platform/access-control"} Try rerunning the command with --debug to troubleshoot the error. |

## Secret Name Boundary

- Required GitHub secret names present: 7/7
- Missing required GitHub secret names: `none`
- Secret values persisted: `no`
- All repository secret names persisted: `no`

## Supabase Access Boundary

| Field | Value |
| --- | --- |
| Projects list available | `yes` |
| Target project visible | `no` |
| Visible project ref count | 4 |
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
