# APO Top 10 Runtime Proof Checklist

Evidence snapshot: 2026-05-08

This checklist supports `APO_BEST_IN_CLASS_GAP_AND_IMPLEMENTATION_FREEZE.md`. A feature should remain `Partially usable` until the required route, data, provenance, buyer workflow, and artifact checks are proven in the target environment.

## Phase 0 Build Proof

| Check | Result | Evidence |
|---|---|---|
| Package metadata unchanged during dependency repair | Pass | `git diff -- package.json package-lock.json` returned empty after repairs. |
| Production build | Pass | `npm run build` completed successfully after 2,052 modules transformed. |
| Build warning | Non-blocking | Vite reported a large `index` chunk and a Supabase dynamic/static import chunking warning. |
| Repaired local packages | Pass | Rehydrated incomplete/mismatched `node_modules` packages from lockfile tarballs: `@vitejs/plugin-react-swc`, `picomatch`, `posthog-js`, `framer-motion`, `motion-dom`, `motion-utils`, `d3-time-format`, `@babel/runtime`. |
| Build performance guard | Pass | Added a local `lucide-react` shim so Vite imports only app-used icon modules instead of transforming the full icon barrel. |

## Local Route Smoke

Dev server: `http://127.0.0.1:8080/`

| Route | HTTP Smoke | Notes |
|---|---|---|
| `/tools/skill-adjacency` | 200 OK | Served by Vite after dependency optimization. Full browser interaction proof still pending because Playwright connector returned `Transport closed`. |
| `/tools/bridge-roles` | 200 OK | Served by Vite after dependency optimization. |
| `/tools/resume-analyzer` | 200 OK | Served by Vite after dependency optimization. |
| `/tools/counselor-reports` | 200 OK | Served by Vite after dependency optimization. |
| `/sample-report` | 200 OK | Served by Vite after dependency optimization. |

## Top 10 Route Proof States

| Rank | Feature | Route / Function | Current Proof State | Remaining Runtime Proof Needed |
|---:|---|---|---|---|
| 1 | APO forecasting and confidence intervals | `/`, `calculate-apo` | Source implemented; build passes. | Smoke known-good occupations, confirm confidence/provenance labels render, and capture function success/failure states. |
| 2 | Resume automation risk analyzer | `/tools/resume-analyzer`, `analyze-resume` | Source implemented; route UX hardened for text/paste, parsing warnings, privacy copy, saved-record delete. | Smoke guest paste flow and authenticated saved/delete flow with valid Supabase/Gemini env. |
| 3 | Counselor white-label reports | `/tools/counselor-reports`, `generate-counselor-report` | Source implemented; occupation search/examples/sample-report link added; backend occupation lookup fixed. | Smoke auth, credit deduction, report generation, history/report ID, and print-to-PDF. |
| 4 | Bridge role pathways | `/tools/bridge-roles`, `find-bridge-roles` | Source implemented; search-first UX, examples, manual SOC fallback, provenance copy added. | Smoke example paths against seeded bridge-role data. |
| 5 | Skill adjacency graph | `/tools/skill-adjacency`, `calculate-skill-adjacency` | Source implemented; search-first UX, examples, deterministic SVG graph, empty states, provenance copy added. | Smoke O*NET skill load and adjacency function with seeded embeddings/cache. |
| 6 | Enterprise / utilities workforce dashboard | `/enterprise-dashboard` | Still partial/demo. | Verify CSV persistence, utility role templates, department rollups, ROI, and executive report. |
| 7 | Task AI impact planner and learning paths | `/ai-impact-planner` | Source implemented; build syntax break in `AIImpactDashboard` repaired. | Smoke full occupation -> task -> skill -> learning-path path and confirm outputs tie back to APO. |
| 8 | Market intelligence layer | `market-intelligence`, `serpapi-jobs`, `bls-sync` | Partial/source implemented. | Verify env-enabled feed calls, freshness labels, posting counts, salary normalization, and fallback states. |
| 9 | SEO risk pages and sample reports | `/automation-risk/:occupation`, `/compare/:slugs`, `/sample-report` | Source implemented; build passes. | Smoke static page uniqueness, lead capture/report download, and paid-flow handoff. |
| 10 | Responsible AI and validation | `/validation`, `/validation/methods`, `/responsible-ai` | Source implemented; build passes. | Attach calibration snapshots, model-card/data-sheet proof, and known limitations to current implementation. |

## Freeze Decisions After This Slice

| Feature | Status Label To Use Now | Why |
|---|---|---|
| Skill adjacency graph | `Source-implemented / Partially usable` | Standalone UX is now usable, but real output still depends on O*NET skill rows and adjacency function proof. |
| Bridge role pathways | `Source-implemented / Partially usable` | Search and examples are implemented, but function/data smoke is still needed. |
| Resume analyzer | `Source-implemented / Partially usable` | Text path and privacy controls improved; robust server-side PDF/DOCX parsing still missing. |
| Counselor reports | `Source-implemented / Partially usable` | Search/sample/report schema bug fixed; auth, credits, and print-to-PDF still need runtime proof. |
| GPU forecasting | `Do not prioritize` | Build/data/provenance/usability remain higher bottlenecks than compute. |

## Next Proof Commands

```bash
npm run build
npm run dev -- --host 127.0.0.1 --port 8080
```

Runtime smoke targets:

- `http://127.0.0.1:8080/tools/skill-adjacency`
- `http://127.0.0.1:8080/tools/bridge-roles`
- `http://127.0.0.1:8080/tools/resume-analyzer`
- `http://127.0.0.1:8080/tools/counselor-reports`
- `http://127.0.0.1:8080/sample-report`
