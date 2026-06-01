# APO Dashboard Remediation Completion Audit

Status date: 2026-06-01
Branch audited: `phase-e-commercial-validation`
Latest local remediation evidence reviewed: Phase E follow-up through Stripe test checkout verifier handoff

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
| Phase C browser smoke | `PLAYWRIGHT_CHANNEL=chrome npm run e2e:smoke` from Phase E gate run | Pass: 6 tests |
| Phase D global-English | `npm run verify:global-english` | Pass: 20 sample O*NET occupations, 20 ESCO bridge rows, 20 UK mappings, 20 Canada mappings, 20 Australia mappings |
| Phase E commercial validation instrumentation | `npm run verify:commercial-validation` | Pass: analytics persistence, PostHog identified-only capture, activation events, commercial lead capture event, commercial evidence gates, hidden bootcamp CTA |
| Impact/outcomes proof-boundary copy | `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/proof-boundary-copy.spec.ts --workers=1 --reporter=line`; `npm run verify:claim-boundaries` | Pass: `/impact` no longer renders hard-coded wage, skill-accuracy, decision-speed, or testimonial claims; `/outcomes` no longer renders static correlation/wage-growth claims |
| Stripe test checkout verifier | `node scripts/verify-stripe-test-checkout.mjs --write --allow-missing-env`; `npm run verify:commercial-validation`; `npm run verify:remediation-gates` | Pass as repo-side harness: verifier is wired, writes redacted missing-env artifact, and requires owner-supplied test credentials plus `STRIPE_TEST_PRICE_ID` before creating a Checkout Session |
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
| Live calibration against production data | Migrations/functions are implemented locally, but no Supabase migration or Edge Function deployment was applied because destructive/deploy steps require approval | Approved migration/deploy, expert-label rows, APO logs, and calibration function run against target project |
| UK/CA/AU localized wage values | Phase D intentionally shows U.S.-basis disclosure rather than fabricated local wages | Source-dated ONS/Job Bank or StatCan/JSA or ABS adapters with tested joins and visible release metadata |
| Live MRR > 0 | No live Stripe active subscription, payment transaction, or MRR export is attached | Stripe live-mode and database evidence showing `total_mrr > 0` |
| >=3 committed design partners | Lead ops and onboarding capture are implemented, but no named partner commitments are present | At least three permissioned partner records with pilot scope, next step, and contact permission |
| Documented outcomes | Case-study capture fields exist, but no permissioned outcome rows are present | Permissioned case-study records with baseline workflow, artifact reviewed, outcome, quote approval, and does-not-prove text |

## Decision

Local implementation for phases A-E is in place and verified as far as this workspace can prove without secrets, migrations, deployments, payments, or real partner activity. `docs/commercialization/remediation-external-gates-latest.md` is the current non-mutating ledger for remaining live/manual evidence. The active goal should remain open because the original plan's Phase C and Phase E live/commercial gates are not fully proven.
