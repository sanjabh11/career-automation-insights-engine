# Task Plan

## Active Work
- [x] Phase A: Remove unsupported `/docs/**` proof links from user-facing pages
- [x] Phase A: Rewrite README as an evidence-scoped project ledger
- [x] Phase A: Add canonical `STATUS.md`
- [x] Phase A: Archive stale status, summary, completion, and deployment-status docs under `docs/archive/`
- [x] Phase A: Archive active stale research/strategy docs with unsupported commercial, readiness, security-score, and confidence claims
- [x] Phase A: Add active-claim boundary verifier and remove dead local WEF PDF path from seed data
- [x] Phase A: Run typecheck, lint, evidence, secret, trust, commercial, and route-link checks

## Review
- Baseline branch: `live-auth-e2e-closeout` at `7ab9821`.
- Existing dirty files before Phase A edits: generated commercialization docs under `docs/commercialization/`.
- Phase A must not copy archived placeholder PDFs into `public/docs`; real artifacts are deferred to Phase B.
- Phase A follow-up archives active stale research/strategy docs with unsupported numeric readiness/security scores, projected revenue, uniqueness claims, and high-confidence commercialization language under `docs/archive/phase-a-status-sprawl-20260531/`.
- Phase A follow-up replaces the missing local WEF PDF seed URL with the official WEF source page and adds `npm run verify:claim-boundaries`.
- `npm run lint` still fails on pre-existing repo-wide lint debt: latest JSON run reports 1,441 errors and 93 warnings outside touched active files.
- Rendered route crawl passed for `/validation`, `/validation/methods`, `/resources`, `/quality`, `/outcomes`, and `/veterans`: each route returned 200, had body content, and exposed no `/docs/**` anchors or forbidden claims.
- `npm run verify:commercial` passed and regenerated the commercial evidence files; this follow-up includes refreshed provenance artifacts because the WEF seed URL/checksum changed.
