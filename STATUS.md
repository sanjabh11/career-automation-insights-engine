# APO Dashboard Status

Status date: 2026-05-31
Branch baseline: `live-auth-e2e-closeout`
Baseline commit: `7ab9821`

## Current Position

The APO Dashboard is an active decision-support product, not an externally calibrated forecasting system. The strongest current evidence is code, migrations, local build/typecheck proof, and commercial proof-pack verifiers. The weakest current evidence is calibration, live payment proof, public model documentation, global-English localization, and commercial traction.

## Verification Baseline

Last observed Phase B local baseline:

| Command | Result | Notes |
| --- | --- | --- |
| `npx tsc --noEmit` | Pass | TypeScript completed with no reported errors. |
| `npm run lint` | Fail | 1,534 existing problems observed, including `SAFE_BACKUP`, archived functions, explicit `any`, empty blocks, and `require()` style imports. Touched `calibrate-ece` passed file-scoped ESLint. |
| `npm run verify:report-evidence` | Pass | Report evidence verification passed. |
| `npm run verify:secrets` | Pass | Secret hygiene verification passed. |
| `npm run verify:commercial-trust` | Pass | Commercial trust-boundary verifier passed. |
| `npm run verify:commercial` | Pass | Passed, including build and commercial route smoke. It regenerates timestamped commercialization evidence docs; review generated diffs before committing. |

## Active Proof Boundaries

- APO outputs are automation-exposure estimates for coaching and planning. They are not job-loss predictions, employment decisions, salary guarantees, or scientific certification.
- Public Phase B validation artifacts are served from `/docs/**`: APO model card, task model card, calibration report, and reliability plot.
- The Phase B public calibration artifact is a source-backed fixture calculation for transparent documentation. Live database calibration still requires owner approval to apply migrations and run the Supabase Edge Function against production APO logs and approved expert labels.
- Current wage and occupation data is U.S. O*NET/BLS-centered unless a specific UI surface states otherwise.
- Stripe subscription price IDs exist for core tiers; bootcamp checkout remains blocked until the placeholder price is replaced or the CTA is hidden.

## Remediation Phases

| Phase | Objective | Status |
| --- | --- | --- |
| A | Truth and claims reconciliation | PR open |
| B | APO validation, calibration, model cards, and uncertainty disclosure | Complete locally; ready for Phase B PR |
| C | Runtime verification, embedding fix, crosswalk proof, E2E smoke | Pending |
| D | Global-English crosswalks and UK/CA/AU wage/outlook localization or disclosure | Pending |
| E | Commercial validation, activation/retention instrumentation, partners, and MRR proof | Pending |

## Manual Gates

Ask before:

- Running migrations or database writes.
- Deploying Supabase Edge Functions or frontend builds to production.
- Printing or handling secrets.
- Running live Stripe/Whop operations beyond test-mode proof.
- Making destructive archive/delete/reset operations.

## Phase A Acceptance Evidence

- No active user-facing proof buttons link to missing `/docs/**` files.
- README and landing claims avoid unsupported absolute language.
- Stale status and summary docs are archived so `README.md` and this file are canonical.
- Rendered route crawl confirmed `/validation`, `/validation/methods`, `/resources`, `/quality`, `/outcomes`, and `/veterans` return 200, render body content, and expose no `/docs/**` anchors.

## Phase B Acceptance Evidence

- `calibrate-ece` compares APO `overall_apo` predictions against matched `expert_assessments` rows and writes ECE, MAE, and RMSE validation metrics when pairs exist.
- Placeholder expert-assessment seed examples are replaced with sourced external calibration anchors, with a follow-up migration to remove previously applied placeholder rows.
- `/validation` and `/validation/methods` link to served Phase B artifacts: calibration report, reliability plot, APO model card, and task model card.
- APO result surfaces now label the score as a decision-support exposure estimate and disclose uncertainty, source scope, and calibration limitations.
- Route and artifact crawl confirmed `/validation`, `/validation/methods`, `/resources`, `/quality`, `/outcomes`, `/veterans`, `/docs/reports/apo-calibration-report.html`, `/docs/reports/apo-reliability-curve.svg`, `/docs/model_cards/APO_MODEL_CARD.html`, and `/docs/model_cards/TASK_MODEL_CARD.html` return 200 with no forbidden claim text.
