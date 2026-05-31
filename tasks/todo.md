# Task Plan

## Active Work
- [x] Phase A: Remove unsupported `/docs/**` proof links from user-facing pages
- [x] Phase A: Rewrite README as an evidence-scoped project ledger
- [x] Phase A: Add canonical `STATUS.md`
- [x] Phase A: Archive stale status, summary, completion, and deployment-status docs under `docs/archive/`
- [x] Phase A: Run typecheck, lint, evidence, secret, trust, commercial, and route-link checks

## Review
- Baseline branch: `live-auth-e2e-closeout` at `7ab9821`.
- Existing dirty files before Phase A edits: generated commercialization docs under `docs/commercialization/`.
- Phase A must not copy archived placeholder PDFs into `public/docs`; real artifacts are deferred to Phase B.
- `npm run lint` still fails on pre-existing repo-wide lint debt: 1,541 problems across `SAFE_BACKUP`, archived Supabase functions, and legacy explicit-`any`/empty-block rules.
- Rendered route crawl passed for `/validation`, `/validation/methods`, `/resources`, `/quality`, `/outcomes`, and `/veterans`: each route returned 200, had body content, and exposed no `/docs/**` anchors or forbidden claims.
- `npm run verify:commercial` passed and regenerated the commercial evidence files; keep those generated files out of the Phase A commit unless intentionally refreshing that artifact set.
