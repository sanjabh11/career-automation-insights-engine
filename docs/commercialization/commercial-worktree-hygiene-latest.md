# Commercial Worktree Hygiene

Generated: `2026-07-17T09:54:01.609Z`
Status: `passed`

This artifact records repo-local dirty worktree hygiene for commercial launch verification. It is an inventory and path-policy check, not proof of owner-held evidence.

## Counts

| Field | Value |
| --- | ---: |
| Tracked dirty paths | 79 |
| Staged paths | 0 |
| Modified paths | 79 |
| Deleted paths | 1 |
| Untracked paths | 31 |
| Allowed untracked paths | 31 |
| Unexpected untracked paths | 0 |
| Sensitive untracked paths | 0 |
| Policy patterns: allowed untracked | 15 |
| Policy patterns: sensitive untracked | 4 |
| Untracked path checks | 31 |
| Does-not-prove boundaries | 4 |
| Errors | 0 |

## Untracked Path Policy

| Path | Category | Sensitive category |
| --- | --- | --- |
| `.positioning-audit/competitor-matrix.json` | positioning-audit-artifact | none |
| `.positioning-audit/history/v1-superseded/artifacts/P0-audit-brief.md` | positioning-audit-artifact | none |
| `.positioning-audit/history/v1-superseded/artifacts/P1-product-truth.md` | positioning-audit-artifact | none |
| `.positioning-audit/history/v1-superseded/artifacts/P2-market-research.md` | positioning-audit-artifact | none |
| `.positioning-audit/history/v1-superseded/artifacts/P3-segment-analysis.md` | positioning-audit-artifact | none |
| `.positioning-audit/history/v1-superseded/artifacts/P4-gap-analysis.md` | positioning-audit-artifact | none |
| `.positioning-audit/history/v1-superseded/artifacts/P5-experiment-design.md` | positioning-audit-artifact | none |
| `.positioning-audit/history/v1-superseded/artifacts/P6-codebase-recon.md` | positioning-audit-artifact | none |
| `.positioning-audit/history/v1-superseded/artifacts/P7-terminal-report.md` | positioning-audit-artifact | none |
| `.positioning-audit/history/v1-superseded/evidence-corpus.json` | positioning-audit-artifact | none |
| `.positioning-audit/history/v1-superseded/experiments.json` | positioning-audit-artifact | none |
| `.positioning-audit/history/v1-superseded/hypotheses.json` | positioning-audit-artifact | none |
| `.positioning-audit/history/v1-superseded/P7-archive-manifest.json` | positioning-audit-artifact | none |
| `.positioning-audit/history/v1-superseded/research-questions.json` | positioning-audit-artifact | none |
| `.positioning-audit/history/v1-superseded/state.json` | positioning-audit-artifact | none |
| `.positioning-audit/history/v1-superseded/supersession.json` | positioning-audit-artifact | none |
| `.windsurf/plans/r1-r2-gap-fixes.md` | windsurf-plan | none |
| `AGENTS.md` | project-instruction | none |
| `docs/legal/pilot-terms-v1.md` | legal-document | none |
| `scripts/validate-positioning-audit.mjs` | positioning-audit-validator | none |
| `scripts/verify-coach-pilot-contract.mjs` | commercialization-helper-script | none |
| `src/lib/pilotEnrollment.ts` | pilot-client-library | none |
| `src/pages/PilotTermsPage.tsx` | pilot-ui | none |
| `supabase/functions/cleanup-report-artifacts/index.ts` | pilot-cleanup-worker | none |
| `supabase/functions/enroll-coach-pilot/index.ts` | pilot-edge-function | none |
| `supabase/functions/generate-counselor-report/test.ts` | pilot-test-fixture | none |
| `supabase/migrations/20260118_report_credit_ledger.sql` | coach-pilot-migration | none |
| `supabase/migrations/20260716220000_report_credit_ledger_v2.sql` | coach-pilot-migration | none |
| `supabase/migrations/20260717000000_report_credit_contract_v3.sql` | coach-pilot-migration | none |
| `supabase/migrations/20260718000000_pilot_governance_and_credit_lots.sql` | coach-pilot-migration | none |
| `supabase/migrations/20260719000000_coach_pilot_contract_v5.sql` | coach-pilot-migration | none |

## Errors

- none

## Evidence Boundary

This verifier inventories git worktree paths only. It fails on untracked sensitive owner-local paths and untracked files outside approved commercialization/generated workflow categories. It does not read owner-held ignored evidence contents and does not prove untracked file contents are secret-free beyond the separate secret-hygiene scanner.

## Does Not Prove

- owner-held Stripe, Supabase, customer, partner, outcome, or manual WCAG evidence
- absence of secrets in git history, ignored local files, screenshots, logs, browser caches, cloud dashboards, or external systems
- that every modified tracked file is ready to commit, reviewed, or production-safe
- commercial-ready status, legal compliance, WCAG conformance, procurement approval, or production uptime
