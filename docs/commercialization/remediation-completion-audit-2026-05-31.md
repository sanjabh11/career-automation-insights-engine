# APO Dashboard Remediation Completion Audit

Status date: 2026-06-01
Branch audited: `phase-e-commercial-validation`
Latest local remediation evidence reviewed: Phase E follow-up through commercial evidence records verifier handoff

This audit checks the active remediation objective against current repo and GitHub evidence. It does not mark the remediation goal complete because several acceptance gates require external live evidence that is not present in this workspace.

## PR Stack

| Phase | PR | Base | Current evidence |
| --- | --- | --- | --- |
| A | [#5](https://github.com/sanjabh11/career-automation-insights-engine/pull/5) | `live-auth-e2e-closeout` | Open, non-draft, mergeable |
| B | [#6](https://github.com/sanjabh11/career-automation-insights-engine/pull/6) | `phase-a-truth-claims-reconciliation` | Open, non-draft, mergeable |
| C | [#7](https://github.com/sanjabh11/career-automation-insights-engine/pull/7) | `phase-b-validation-calibration` | Open, non-draft, mergeable; `Phase C Runtime Smoke` check succeeded |
| D | [#8](https://github.com/sanjabh11/career-automation-insights-engine/pull/8) | `phase-c-runtime-verification-bugfixes` | Open, non-draft, mergeable |
| E | [#9](https://github.com/sanjabh11/career-automation-insights-engine/pull/9) | `phase-d-global-english-localization` | Open, non-draft, mergeable |

## Current Verification Evidence

| Requirement area | Evidence inspected | Result |
| --- | --- | --- |
| Phase A route/proof-link crawl | Browser crawl of `/validation`, `/validation/methods`, `/resources`, `/quality`, `/outcomes`, `/veterans` on local Vite port 5199 | Pass: all returned 200, body rendered, active `/docs/**` anchors returned 200, no forbidden claim text found |
| Phase B public artifacts | `public/docs/model_cards/APO_MODEL_CARD.html`, `TASK_MODEL_CARD.html`, `public/docs/reports/apo-calibration-report.html`, reliability SVG, calibration JSON | Present |
| Phase C embedding model | `npm run smoke:skill-adjacency` | Pass: `gemini-embedding-001`, 768 dimensions, non-empty adjacency |
| Phase C browser smoke | `PLAYWRIGHT_CHANNEL=chrome npm run e2e:smoke -- --workers=1 --reporter=line` from Phase E follow-up gate run | Pass: 7 tests, including Phase C runtime, Phase D global-English, and proof-boundary copy checks |
| Phase D global-English | `npm run verify:global-english` | Pass: 20 sample O*NET occupations, 20 ESCO bridge rows, 20 UK mappings, 20 Canada mappings, 20 Australia mappings |
| Phase E commercial validation instrumentation | `npm run verify:commercial-validation` | Pass: analytics persistence, PostHog identified-only capture, activation events, commercial lead capture event, commercial evidence gates, hidden bootcamp CTA |
| Impact/outcomes proof-boundary copy | `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/proof-boundary-copy.spec.ts --workers=1 --reporter=line`; `npm run verify:claim-boundaries` | Pass: `/impact` no longer renders hard-coded wage, skill-accuracy, decision-speed, or testimonial claims; `/outcomes` no longer renders static correlation/wage-growth claims |
| Stripe test checkout verifier | `node scripts/verify-stripe-test-checkout.mjs --write --allow-missing-env`; `npm run verify:commercial-validation`; `npm run verify:remediation-gates` | Pass as repo-side harness: verifier is wired, writes redacted missing-env artifact, and requires owner-supplied test credentials plus `STRIPE_TEST_PRICE_ID` before creating a Checkout Session |
| Stripe live MRR verifier | `node scripts/verify-stripe-live-mrr.mjs --write --allow-missing-env`; `npm run verify:commercial-validation`; `npm run verify:remediation-gates` | Pass as repo-side harness: verifier is wired, writes redacted missing-env artifact, rejects test-mode keys, and requires owner-supplied live Stripe credentials plus active subscription and paid-invoice evidence before proving live MRR |
| Production calibration verifier | `node scripts/verify-production-calibration-run.mjs --write --allow-missing-env`; `npm run verify:commercial-validation`; `npm run verify:remediation-gates` | Pass as repo-side harness: verifier is wired, writes redacted missing-env artifact, and requires owner-supplied Supabase target credentials plus an already deployed `calibrate-ece` function with approved live APO logs and expert labels before proving a calibration run |
| Commercial evidence records verifier | `npm run verify:commercial-evidence-records`; `npm run verify:commercial-validation`; `npm run verify:remediation-gates` | Pass as repo-side harness: verifier is wired, writes a no-local-evidence artifact, rejects private contact patterns, and requires owner-held permissioned partner/outcome records before proving the partner and outcome gates |
| TypeScript | `npx tsc --noEmit` from Phase E gate run | Pass |
| Report evidence | `npm run verify:report-evidence` from Phase E gate run | Pass |
| Secret hygiene | `npm run verify:secrets` from Phase E gate run | Pass |
| Commercial trust | `npm run verify:commercial-trust` from Phase E gate run | Pass |
| Commercial verifier | `npm run verify:commercial` from Phase E gate run, then rerun after adding the remediation-gate step | Pass, including remediation-gate ledger, build, and commercial route smoke |
| Remediation external gates | `npm run verify:remediation-gates` | Pass as a non-mutating readiness ledger; `goalComplete=false` because live/manual evidence is still missing |
| Full lint | `npm run lint` from Phase E follow-up gate run | Pass: 0 errors and 0 warnings after inactive backup/archive trees, mechanical non-`any` errors, the active explicit-`any` backlog, active hook-dependency warnings, and provider/page/UI Fast Refresh export warnings were cleared across frontend components/hooks/pages/services plus Supabase Edge Function, shared library, and test boundaries |

## Unmet Or Externally Blocked Gates

| Gate | Why completion is not proven | Needed evidence |
| --- | --- | --- |
| Real Stripe test-mode checkout | Shell has Stripe/Supabase test credentials and `STRIPE_TEST_PRICE_ID` unset; current Playwright checkout is a mocked route smoke, and `stripe-test-checkout-proof-latest.json` is `skipped_missing_env`, not a real Checkout Session | Owner-provided test secrets plus `npm run verify:stripe-test-checkout` output showing `create-checkout-session` created a Stripe test-mode Checkout Session without printing secrets |
| Live calibration against production data | Migrations/functions and owner-run verifier are implemented locally, but no Supabase migration, Edge Function deployment, or live calibration invocation was applied because destructive/deploy/live steps require approval and owner credentials | Approved migration/deploy, expert-label rows, APO logs, and `npm run verify:production-calibration` output from the target project |
| UK/CA/AU localized wage values | Phase D intentionally shows U.S.-basis disclosure rather than fabricated local wages | Source-dated ONS/Job Bank or StatCan/JSA or ABS adapters with tested joins and visible release metadata |
| Live MRR > 0 | Owner-run Stripe live-MRR verifier exists, but no live Stripe key or accepted redacted live evidence file is attached | Owner-run `npm run verify:stripe-live-mrr` output or accepted redacted evidence showing live-mode active subscription, paid invoice, and `total_mrr > 0` |
| >=3 committed design partners | Redacted commercial-evidence records verifier exists, but no accepted owner-held partner records are attached | At least three permissioned partner records validated by `npm run verify:commercial-evidence-records -- --require-partners` |
| Documented outcomes | Redacted commercial-evidence records verifier exists, but no accepted owner-held outcome records are attached | At least one permissioned outcome record validated by `npm run verify:commercial-evidence-records -- --require-outcomes` |

## Decision

Local implementation for phases A-E is in place and verified as far as this workspace can prove without secrets, migrations, deployments, payments, or real partner activity. `docs/commercialization/remediation-external-gates-latest.md` is the current non-mutating ledger for remaining live/manual evidence. The active goal should remain open because the original plan's Phase C and Phase E live/commercial gates are not fully proven.
