# APO Dashboard Status

Status date: 2026-05-31
Branch baseline: `live-auth-e2e-closeout`
Baseline commit: `7ab9821`

## Current Position

The APO Dashboard is an active decision-support product, not an externally calibrated forecasting system. The strongest current evidence is code, migrations, local build/typecheck proof, and commercial proof-pack verifiers. The weakest current evidence is calibration, live payment proof, public model documentation, global-English localization, and commercial traction.

## Verification Baseline

Last observed Phase A baseline:

| Command | Result | Notes |
| --- | --- | --- |
| `npx tsc --noEmit` | Pass | TypeScript completed with no reported errors. |
| `npm run lint` | Fail | Latest JSON run reported 1,441 inherited errors and 93 warnings; touched active files have no findings. |
| `npm run verify:report-evidence` | Pass | Report evidence verification passed. |
| `npm run verify:secrets` | Pass | Secret hygiene verification passed. |
| `npm run verify:commercial-trust` | Pass | Commercial trust-boundary verifier passed. |
| `npm run verify:claim-boundaries` | Pass | Active Markdown/source/data scan found no unsupported absolute claims or dead local WEF PDF path. |
| `npm run verify:commercial` | Pass | Passed, but regenerates timestamped commercialization evidence docs. Review generated diffs before committing. |

## Active Proof Boundaries

- APO outputs are automation-exposure estimates for coaching and planning. They are not job-loss predictions, employment decisions, salary guarantees, or scientific certification.
- Public `/docs/**` proof artifacts are intentionally not served during Phase A. Archived PDFs were placeholder-scale and contained unsupported conclusions.
- The validation UI can display calibration runs, but Phase B must compute and publish calibration against sourced expert assessments.
- Current wage and occupation data is U.S. O*NET/BLS-centered unless a specific UI surface states otherwise.
- Stripe subscription price IDs exist for core tiers; bootcamp checkout remains blocked until the placeholder price is replaced or the CTA is hidden.

## Remediation Phases

| Phase | Objective | Status |
| --- | --- | --- |
| A | Truth and claims reconciliation | Complete locally; ready for Phase A PR |
| B | APO validation, calibration, model cards, and uncertainty disclosure | Pending |
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
- Stale research and strategy docs with unsupported readiness, security-score, projected-MRR, or 95%+ confidence language are archived under `docs/archive/phase-a-status-sprawl-20260531/`.
- `data/econ_wef.csv` and `public/data/econ_wef.csv` point to the official WEF Future of Jobs 2025 source page rather than a missing local `/public/docs/**` PDF.
- `src/pages/EconImporter.tsx` uses the official WEF source page as placeholder guidance and has no touched-file lint findings.
- Rendered route crawl confirmed `/validation`, `/validation/methods`, `/resources`, `/quality`, `/outcomes`, and `/veterans` return 200, render body content, and expose no `/docs/**` anchors.
