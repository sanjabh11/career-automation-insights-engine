# Task Plan

## Active Work
- [x] Phase A: Remove unsupported `/docs/**` proof links from user-facing pages
- [x] Phase A: Rewrite README as an evidence-scoped project ledger
- [x] Phase A: Add canonical `STATUS.md`
- [x] Phase A: Archive stale status, summary, completion, and deployment-status docs under `docs/archive/`
- [x] Phase A: Run typecheck, lint, evidence, secret, trust, commercial, and route-link checks
- [x] Phase B: Replace placeholder expert-assessment seed data with source-backed calibration anchors
- [x] Phase B: Update `calibrate-ece` to compare APO logs against `expert_assessments`
- [x] Phase B: Serve calibration report, reliability plot, APO model card, and task model card from `public/docs`
- [x] Phase B: Add APO result uncertainty disclosure and decision-support estimate language
- [x] Phase B: Run Phase B type, lint, proof, route, and artifact-link checks
- [x] Phase C: Switch skill-adjacency embedding calls to `gemini-embedding-001`
- [x] Phase C: Add skill-adjacency embedding and non-empty adjacency smoke check
- [x] Phase C: Route Veterans MOC crosswalks through O*NET's military crosswalk endpoint
- [x] Phase C: Add Playwright smoke coverage for auth, APO run, Stripe test-mode checkout, and white-label export
- [x] Phase C: Wire Phase C runtime smoke into CI
- [x] Phase C: Run Phase C type, lint, proof, commercial, embedding, and E2E checks
- [x] Phase D: Add source-dated global-English crosswalk/disclosure model
- [x] Phase D: Cover 20 sample occupations for ESCO bridge, UK SOC, Canada NOC, and Australia ANZSCO
- [x] Phase D: Add visible U.S.-basis wage/outlook disclosure for non-US English locales
- [x] Phase D: Add UK locale Playwright smoke and global-English static verifier
- [x] Phase D: Run Phase D type, lint, proof, commercial, global-English, and E2E checks

## Review
- Baseline branch: `live-auth-e2e-closeout` at `7ab9821`.
- Existing dirty files before Phase A edits: generated commercialization docs under `docs/commercialization/`.
- Phase A must not copy archived placeholder PDFs into `public/docs`; real artifacts are deferred to Phase B.
- `npm run lint` still fails on pre-existing repo-wide lint debt: 1,541 problems across `SAFE_BACKUP`, archived Supabase functions, and legacy explicit-`any`/empty-block rules.
- Rendered route crawl passed for `/validation`, `/validation/methods`, `/resources`, `/quality`, `/outcomes`, and `/veterans`: each route returned 200, had body content, and exposed no `/docs/**` anchors or forbidden claims.
- `npm run verify:commercial` passed and regenerated the commercial evidence files; keep those generated files out of the Phase A commit unless intentionally refreshing that artifact set.
- Phase B artifact evidence is intentionally scoped: public docs prove transparent documentation and source-backed fixture calibration, while live expert-label calibration still requires owner-approved Supabase migration/application and function execution.
- Phase B route and artifact crawl passed for `/validation`, `/validation/methods`, `/resources`, `/quality`, `/outcomes`, `/veterans`, `/docs/reports/apo-calibration-report.html`, `/docs/reports/apo-reliability-curve.svg`, `/docs/model_cards/APO_MODEL_CARD.html`, and `/docs/model_cards/TASK_MODEL_CARD.html`.
- Phase B `npm run lint` remains red on inherited repo-wide lint debt but improved to 1,534 problems; `supabase/functions/calibrate-ece/index.ts` passes file-scoped ESLint.
- Phase C `npm run smoke:skill-adjacency` passed with `gemini-embedding-001`, 768 dimensions, and a non-empty adjacency result.
- Phase C `PLAYWRIGHT_CHANNEL=chrome npm run e2e:smoke` passed 5 browser tests covering auth, APO run, Veterans crosswalk, Stripe test-mode checkout, and white-label report export.
- Phase C `npm run lint` remains red on inherited repo-wide lint debt but improved to 1,529 problems; Phase C touched files pass file-scoped ESLint.
- The bootcamp placeholder Stripe price ID no longer appears in runtime code; bootcamp checkout remains disabled until a real Stripe price is supplied.
- Phase D `npm run verify:global-english-sources` provides the reproducible network-backed source-link check for ESCO API, ONS ASHE Table 2, Statistics Canada NOC 2021, Canada Job Bank wage methodology, Canada Job Bank outlook methodology, ABS ANZSCO 2022, and Jobs and Skills Australia occupation profiles.
- Phase D `npm run verify:global-english` passed with 20 sample O*NET occupations, 20 ESCO bridge rows, 20 UK SOC mappings, 20 Canada NOC mappings, 20 Australia ANZSCO mappings, and source-registered UK/CA/AU wage/outlook adapter contracts.
- Phase D `PLAYWRIGHT_CHANNEL=chrome npm run e2e:smoke` passed 6 browser tests after adding UK global-English disclosure coverage.
- Phase D `npm run lint` remains red on inherited repo-wide lint debt but improved to 1,507 problems; Phase D touched files pass file-scoped ESLint.
- Phase D deliberately does not claim localized UK/CA/AU wage values. The UI labels non-US views as U.S. O*NET/BLS basis and exposes adapter-pending join requirements until source-dated local wage/outlook adapters are imported and validated.
