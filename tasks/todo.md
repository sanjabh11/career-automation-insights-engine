# Task Plan

## Active Work
- [x] Phase A: Remove unsupported `/docs/**` proof links from user-facing pages
- [x] Phase A: Rewrite README as an evidence-scoped project ledger
- [x] Phase A: Add canonical `STATUS.md`
- [x] Phase A: Archive stale status, summary, completion, and deployment-status docs under `docs/archive/`
- [x] Phase A: Archive active stale research/strategy docs with unsupported commercial, readiness, security-score, and confidence claims
- [x] Phase A: Add active-claim boundary verifier and remove dead local WEF PDF path from seed data
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

## Review
- Baseline branch: `live-auth-e2e-closeout` at `7ab9821`.
- Existing dirty files before Phase A edits: generated commercialization docs under `docs/commercialization/`.
- Phase A must not copy archived placeholder PDFs into `public/docs`; real artifacts are deferred to Phase B.
- Phase A follow-up archives active stale research/strategy docs with unsupported numeric readiness/security scores, projected revenue, uniqueness claims, and high-confidence commercialization language under `docs/archive/phase-a-status-sprawl-20260531/`.
- Phase A follow-up replaces the missing local WEF PDF seed URL with the official WEF source page and adds `npm run verify:claim-boundaries`.
- `npm run lint` still fails on pre-existing repo-wide lint debt: latest JSON run reports 1,441 errors and 93 warnings outside touched active files.
- Rendered route crawl passed for `/validation`, `/validation/methods`, `/resources`, `/quality`, `/outcomes`, and `/veterans`: each route returned 200, had body content, and exposed no `/docs/**` anchors or forbidden claims.
- `npm run verify:commercial` passed and regenerated the commercial evidence files; the Phase A follow-up includes refreshed provenance artifacts because the WEF seed URL/checksum changed.
- Phase B artifact evidence is intentionally scoped: public docs prove transparent documentation and source-backed fixture calibration, while live expert-label calibration still requires owner-approved Supabase migration/application and function execution.
- Phase B route and artifact crawl passed for `/validation`, `/validation/methods`, `/resources`, `/quality`, `/outcomes`, `/veterans`, `/docs/reports/apo-calibration-report.html`, `/docs/reports/apo-reliability-curve.svg`, `/docs/model_cards/APO_MODEL_CARD.html`, and `/docs/model_cards/TASK_MODEL_CARD.html`.
- Phase B `npm run lint` remains red on inherited repo-wide lint debt but improved to 1,534 problems; `supabase/functions/calibrate-ece/index.ts` passes file-scoped ESLint.
- Phase C `npm run smoke:skill-adjacency` passed with `gemini-embedding-001`, 768 dimensions, and a non-empty adjacency result.
- Phase C `PLAYWRIGHT_CHANNEL=chrome npm run e2e:smoke` passed 5 browser tests covering auth, APO run, Veterans crosswalk, Stripe test-mode checkout, and white-label report export.
- Phase C `npm run lint` remains red on inherited repo-wide lint debt but improved to 1,529 problems; Phase C touched files pass file-scoped ESLint.
- `price_bootcamp` no longer appears in runtime code; bootcamp checkout remains disabled until a real Stripe price is supplied.
