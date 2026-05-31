# APO Dashboard Remediation Completion Audit

Status date: 2026-05-31
Branch audited: `phase-e-commercial-validation`
Latest non-audit remediation implementation commit audited: `bd8b39e`

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
| TypeScript | `npx tsc --noEmit` from Phase E gate run | Pass |
| Report evidence | `npm run verify:report-evidence` from Phase E gate run | Pass |
| Secret hygiene | `npm run verify:secrets` from Phase E gate run | Pass |
| Commercial trust | `npm run verify:commercial-trust` from Phase E gate run | Pass |
| Commercial verifier | `npm run verify:commercial` from Phase E gate run | Pass, including build and commercial route smoke |
| Full lint | `npm run lint` from Phase E gate run | Fail on inherited repo-wide lint debt: 1,506 problems, mainly `SAFE_BACKUP`, archived functions, legacy explicit `any`, empty blocks, and CommonJS require usage |

## Unmet Or Externally Blocked Gates

| Gate | Why completion is not proven | Needed evidence |
| --- | --- | --- |
| Real Stripe test-mode checkout | Shell has `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, Supabase URL, anon key, and service-role key unset; current Playwright checkout is a mocked route smoke, not a real Stripe Checkout Session | Owner-provided test secrets plus deployed or local `create-checkout-session` Edge Function run that creates a Stripe test-mode Checkout Session without printing secrets |
| Live calibration against production data | Migrations/functions are implemented locally, but no Supabase migration or Edge Function deployment was applied because destructive/deploy steps require approval | Approved migration/deploy, expert-label rows, APO logs, and calibration function run against target project |
| UK/CA/AU localized wage values | Phase D intentionally shows U.S.-basis disclosure rather than fabricated local wages | Source-dated ONS/Job Bank or StatCan/JSA or ABS adapters with tested joins and visible release metadata |
| Live MRR > 0 | No live Stripe active subscription, payment transaction, or MRR export is attached | Stripe live-mode and database evidence showing `total_mrr > 0` |
| >=3 committed design partners | Lead ops and onboarding capture are implemented, but no named partner commitments are present | At least three permissioned partner records with pilot scope, next step, and contact permission |
| Documented outcomes | Case-study capture fields exist, but no permissioned outcome rows are present | Permissioned case-study records with baseline workflow, artifact reviewed, outcome, quote approval, and does-not-prove text |

## Decision

Local implementation for phases A-E is in place and verified as far as this workspace can prove without secrets, migrations, deployments, payments, or real partner activity. The active goal should remain open because the original plan's Phase C and Phase E live/commercial gates are not fully proven.
