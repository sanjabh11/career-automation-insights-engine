# APO Dashboard Status

Status date: 2026-05-31
Branch baseline: `live-auth-e2e-closeout`
Baseline commit: `7ab9821`

## Current Position

The APO Dashboard is an active decision-support product, not an externally calibrated forecasting system. The strongest current evidence is code, migrations, local build/typecheck proof, and commercial proof-pack verifiers. The weakest current evidence is calibration, live payment proof, public model documentation, global-English localization, and commercial traction.

## Verification Baseline

Last observed Phase E local baseline:

| Command | Result | Notes |
| --- | --- | --- |
| `npx tsc --noEmit` | Pass | TypeScript completed with no reported errors. |
| `npm run lint` | Fail | 183 explicit-`any` errors and 34 React warnings remain after excluding inactive backups/archives, clearing mechanical lint errors, and type-hardening the AI Impact Planner, Outcomes KPI, calculate-APO, Industry dashboard, Validation calibration, Job Zones, Skill Adjacency Graph, O*NET enrichment, Whop webhook, roadmap-generation, task-analysis, BLS sync, heatmap snapshot, skill recommendation, intelligent task-assessment test, personalized skill-recommendation test, Bridge Role Pathway, Ecosystem Risk Card, Premium Report Summary, and O*NET enrichment hook payload paths. |
| `npm run verify:report-evidence` | Pass | Report evidence verification passed. |
| `npm run verify:secrets` | Pass | Secret hygiene verification passed. |
| `npm run verify:commercial-trust` | Pass | Commercial trust-boundary verifier passed. |
| `npm run verify:commercial` | Pass | Passed, including the remediation gate ledger, build, and commercial route smoke. It regenerates timestamped commercialization evidence docs; review generated diffs before committing. |
| `npm run verify:claim-boundaries` | Pass | Active Markdown/source/data scan found no unsupported absolute claims or dead local WEF PDF path. |
| `npm run smoke:skill-adjacency` | Pass | Confirmed `gemini-embedding-001`, 768-dimensional output, and non-empty adjacency smoke result. |
| `npm run verify:global-english` | Pass | Confirmed 20 sample O*NET occupations mapped to ESCO bridge terms plus UK SOC, Canada NOC, and Australia ANZSCO codes, with non-US wage/outlook adapter-pending disclosure status. |
| `npm run verify:global-english-sources` | Pass | Network-backed source check returned HTTP 2xx/3xx for ESCO API, ONS ASHE Table 2, Statistics Canada NOC 2021, Canada Job Bank wage and outlook methodology, ABS ANZSCO 2022, and Jobs and Skills Australia occupation profiles. |
| `npm run verify:commercial-validation` | Pass | Confirmed Phase E activation/retention instrumentation, design-partner checklist, case-study template, commercial evidence gates, and hidden bootcamp CTA boundary. |
| `npm run verify:live-gate-evidence` | Pass | Confirmed the redacted evidence intake verifier is wired and no local evidence file is currently attached. |
| `npm run verify:remediation-gates` | Pass | Wrote the non-mutating external gate ledger. Current result is `goalComplete=false` because Stripe test-mode checkout, production calibration, authenticated live e2e, live MRR, partners, and outcomes still require owner/live evidence. |
| `PLAYWRIGHT_CHANNEL=chrome npm run e2e:smoke` | Pass | 6 Playwright smoke tests passed: auth, APO run, Veterans crosswalk, Stripe test-mode checkout, white-label report export, and UK global-English disclosure. |

## Active Proof Boundaries

- APO outputs are automation-exposure estimates for coaching and planning. They are not job-loss predictions, employment decisions, salary guarantees, or scientific certification.
- Public Phase B validation artifacts are served from `/docs/**`: APO model card, task model card, calibration report, and reliability plot.
- The Phase B public calibration artifact is a source-backed fixture calculation for transparent documentation. Live database calibration still requires owner approval to apply migrations and run the Supabase Edge Function against production APO logs and approved expert labels.
- Current wage and occupation data is U.S. O*NET/BLS-centered unless a specific UI surface states otherwise. For UK, Canada, and Australia browser locales, APO result UI now shows a visible U.S.-basis disclosure, local classification mapping when one of the Phase D sample rows is available, and the registered local wage/outlook adapter status.
- Phase D does not claim localized UK, Canada, or Australia wage/outlook values. Source-registered adapter contracts exist for ONS ASHE, Canada Job Bank wage/outlook methods, and JSA occupation profiles, but local values remain gated on source-specific joins that preserve release dates, suppression notes, geography, and methodology boundaries.
- Stripe subscription price IDs exist for core tiers; bootcamp checkout is disabled until a real live Stripe price is supplied.
- Phase E instrumentation prepares activation, retention, design-partner, case-study, and revenue gates. It does not prove live MRR, committed partners, or outcomes until external evidence is attached.
- `docs/commercialization/live-gate-evidence-template.json` and `npm run verify:live-gate-evidence` define a redacted evidence intake path for owner-held live/manual proof. The default local evidence file is git-ignored and must not contain secrets, raw customer data, partner contact details, or private outcome notes.
- `docs/commercialization/remediation-external-gates-latest.md` is the current non-mutating ledger for the remaining external gates. It records secret presence by variable name only, reads only redacted evidence metadata when present, and does not apply migrations, deploy functions, create Stripe sessions, or query live customer data.

## Remediation Phases

| Phase | Objective | Status |
| --- | --- | --- |
| A | Truth and claims reconciliation | PR open |
| B | APO validation, calibration, model cards, and uncertainty disclosure | PR open |
| C | Runtime verification, embedding fix, crosswalk proof, E2E smoke | PR open |
| D | Global-English crosswalks and UK/CA/AU wage/outlook localization or disclosure | PR open |
| E | Commercial validation, activation/retention instrumentation, partners, and MRR proof | Local instrumentation complete; live proof still blocked/manual |

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

## Phase B Acceptance Evidence

- `calibrate-ece` compares APO `overall_apo` predictions against matched `expert_assessments` rows and writes ECE, MAE, and RMSE validation metrics when pairs exist.
- Placeholder expert-assessment seed examples are replaced with sourced external calibration anchors, with a follow-up migration to remove previously applied placeholder rows.
- `/validation` and `/validation/methods` link to served Phase B artifacts: calibration report, reliability plot, APO model card, and task model card.
- APO result surfaces now label the score as a decision-support exposure estimate and disclose uncertainty, source scope, and calibration limitations.
- Route and artifact crawl confirmed `/validation`, `/validation/methods`, `/resources`, `/quality`, `/outcomes`, `/veterans`, `/docs/reports/apo-calibration-report.html`, `/docs/reports/apo-reliability-curve.svg`, `/docs/model_cards/APO_MODEL_CARD.html`, and `/docs/model_cards/TASK_MODEL_CARD.html` return 200 with no forbidden claim text.

## Phase C Acceptance Evidence

- `calculate-skill-adjacency` now calls Gemini `embedContent` with `gemini-embedding-001`, `SEMANTIC_SIMILARITY`, explicit 768-dimensional output, and dimensionality validation against the current `vector(768)` schema.
- The follow-up migration updates embedding defaults and clears stale cached skill embeddings from older model families when owner-approved migration execution occurs.
- `npm run smoke:skill-adjacency` passed with a 768-dimensional generated-vector contract and non-empty deterministic adjacency result.
- Veterans MOC crosswalk now calls O*NET's military crosswalk endpoint with branch mapping instead of the generic crosswalk path.
- `PLAYWRIGHT_CHANNEL=chrome npm run e2e:smoke` passed 5 browser smoke tests: auth sign-in, APO run, Veterans crosswalk, Stripe test-mode checkout redirect, and white-label report export.
- Phase C runtime smoke is wired into `.github/workflows/phase-c-runtime-smoke.yml` for pull requests.
- The bootcamp placeholder Stripe price ID was removed from runtime code; bootcamp checkout remains disabled until a real Stripe price is supplied.

## Phase D Acceptance Evidence

- `src/lib/globalEnglishLocalization.ts` defines an explicit source date of 2026-05-31 and official source registry entries for ESCO API, ONS SOC/ASHE, Statistics Canada NOC, Canada Job Bank wage and outlook methodology, ABS ANZSCO, and Jobs and Skills Australia occupation profiles.
- Phase D now registers UK, Canada, and Australia wage/outlook adapter contracts with required join fields, release metadata, suppression boundaries, and display boundaries before any local value can be shown.
- `npm run verify:global-english` passed with 20 sample O*NET occupations, 20 ESCO bridge rows, 20 UK SOC mappings, 20 Canada NOC mappings, and 20 Australia ANZSCO mappings.
- `npm run verify:global-english-sources` provides the reproducible network-backed source-link check for ESCO API, ONS ASHE Table 2, Statistics Canada NOC 2021, Canada Job Bank wage methodology, Canada Job Bank outlook methodology, ABS ANZSCO 2022, and Jobs and Skills Australia occupation profiles.
- `OccupationAnalysis` now shows a regional labor-market disclosure for non-US English locales, including the local classification mapping when available, adapter pending status, join requirement, and the statement that wage/outlook values remain U.S. O*NET/BLS basis until localized adapters supply source-dated values.
- `PLAYWRIGHT_CHANNEL=chrome npm run e2e:smoke` passed 6 browser smoke tests, including the UK locale disclosure check for Software Developers mapped to UK SOC `2134`.

## Phase E Acceptance Evidence

- `trackAnalyticsEvent` now writes to the actual `analytics_events` schema using `event_type` and `payload`, mirrors configured events to PostHog, skips local dev persistence by default, and redacts/truncates string payloads before storage.
- PostHog initialization uses an explicit 2026-01-30 defaults snapshot and `identified_only` person profiles; `useSession` identifies/resets users without storing email in the analytics payload.
- APO success emits `activation_apo_result_viewed`, coach sample generation emits `activation_proof_artifact_created`, and commercial lead capture emits `commercial_lead_captured` without including contact email or report HTML.
- `commercialLaunchReadiness.ts`, `/proof-pack-gallery`, and `docs/commercialization/phase-e-commercial-validation-playbook.md` define activation/retention event contracts, retention cohort definitions, design-partner onboarding steps, case-study capture fields, and explicit commercial validation gates.
- `docs/commercialization/live-gate-evidence-template.json`, `scripts/lib/liveGateEvidence.mjs`, and `npm run verify:live-gate-evidence` provide a redacted owner-evidence schema for the remaining live/manual gates. The current repo has no attached accepted live evidence file.
- `npm run verify:remediation-gates` now summarizes the entire A-E remediation boundary and writes `docs/commercialization/remediation-external-gates-latest.json` plus `.md`.
- Live MRR > $0, at least three committed design partners, and permissioned documented outcomes remain manual/external gates. Local source/test proof must not be described as commercial validation.
