# Source Refresh Manifest

Date: 2026-05-24
Code source: `src/lib/sourceManifest.ts`
Purpose: Keep commercial reports honest about which public sources are current, which adapters are only ready boundaries, and which claims still require ingestion verification.

## Verified Current Sources

| Source | Current version/status | Verified use | Claim boundary |
|---|---|---|---|
| O*NET | O*NET Database 30.3 production release, May 2026 | SOC occupation metadata, tasks, skills, descriptors, and Task Ratings importance/frequency fields | Do not claim all in-app rows are 30.3-backed or task-time precise until the data-refresh job and checksum manifest run. |
| BLS Employment Projections | 2024-34 occupational employment projections | Growth/outlook context | Directional labor-market context only; not employer-specific forecasting. |
| BLS OEWS | May 2025 OEWS tables, published May 2026 | Wage and employment estimates | Use only after SOC/occupation mapping is verified. |
| WEF Future of Jobs | 2025 edition, 2025-2030 horizon | Macro skill and technology trend framing | Use for directional narrative, not occupation scoring by itself. |
| OECD Skills Outlook | 2025 edition | Skill-change, task-content change, and reskilling policy context | Use for skill-transition framing, not worker-specific guidance or local demand proof. |
| AI Workforce Consortium ICT in Motion | 2025 report | AI-era role radar market-signal framing for AI-specific and specialized support roles | Use as emerging-role signal context, not title-level proof for every employer or region. |
| Anthropic Economic Index | Initial 2025 index plus 2026 Economic Primitives updates | Observed AI use by O*NET task, automation/augmentation framing, adoption inequality caveats | Use as AI-use benchmark context only until task-level datasets are imported and validated. |
| Anthropic observed exposure research | 2026 labor-market impacts research | Separates theoretical capability from observed automated, work-related AI use | Use for claim discipline; do not translate exposure directly into job-loss claims. |
| OpenAI GDPval | First version, September 2025 | Economically valuable knowledge-work capability benchmark | Use for model-capability context only, not as a labor-market forecast. |
| BLS AI Monthly Labor Review | February 2025 occupational case-study article | Claim discipline around exposure, uncertainty, and occupation-specific employment-projection nuance | Exposure does not imply rapid displacement; use to temper commercial claims. |
| WCAG 2.2 | W3C Recommendation | Accessibility conformance target for public commercial flows | Do not claim conformance until manual and automated audit evidence exists. |
| ADA algorithmic hiring guidance | DOJ/EEOC guidance | Employment-decision, accommodation, and human-review guardrails | Planning-only reports unless validation, accommodation, and adverse-impact review exist. |
| ISO/IEC 42001 | ISO/IEC 42001:2023 AI management system | AI governance, traceability, transparency, and review-attestation framing | Use as governance design context only; do not claim ISO certification or compliance. |

## Adapter Boundaries

| Source | Status | Boundary |
|---|---|---|
| ESCO v1.2.1 | Adapter-ready | Needs import, crosswalk, and validation before powering scored U.S. reports. |
| Lightcast | Adapter-ready | Requires licensed data agreement and ingestion adapter before any backed claims. |
| SerpAPI-compatible search | Adapter-ready | Requires query log, cache policy, timestamp, and jurisdiction before market-signal claims. |
| LLM output | Runtime advisory | Needs model/prompt metadata, source grounding, and human review state per artifact. |

## Next Refresh Work

1. Schedule `npm run verify:sources` and archive each `source-verification-latest.json` output before source-sensitive demos.
2. Add checksums for imported O*NET/BLS data tables after ingestion, including O*NET Task Ratings importance/frequency rows before replacing proxy task weights.
3. Attach score-level evidence cards to generated report sections.
4. Store source manifest snapshots with each generated commercial report artifact.
5. Block marketing copy from claiming provider-backed scoring when a source is only `adapter-ready`.

## Commercial Artifact Delivery Audit

Report artifacts now have an append-only staff event boundary in `commercial_report_artifact_events`. Staff opens/download fallbacks from `/operations/leads` call `log_commercial_report_artifact_event` with `staff_opened`, `staff_downloaded`, or `staff_open_failed`, and the lead ops table can load recent artifact history per lead. The follow-up migration `20260524000200_add_commercial_artifact_review_events.sql` adds `section_review_updated`, `section_client_ready`, and `artifact_client_ready` so staff can log section-level proof-pack readiness plus final artifact client-ready approval with actor identity, reviewer notes, source IDs, evidence card IDs, and acceptance criteria. This gives the sales/support workflow a delivery and review evidence trail while signed storage URLs, PDF export, resend workflows, and richer delivery analytics remain next-step work.

Coach sample reports now use the same source manifest boundary and can persist a branded sample artifact when a coach enters a contact email. Treat this as an outreach proof-pack flow: the preview settings are browser-saved for fast demos, while the generated report HTML and lead record are Supabase-backed when the artifact capture succeeds.

The public proof-pack gallery at `/proof-pack-gallery` packages the bounded outreach surface for coaches, career centers, and workforce buyers. It links to the individual, coach, and workforce sample routes, includes a sample occupation shelf, and exports a manual CRM-import CSV. Treat the CSV as an outreach operations artifact only; live CRM sync, email automation, and deployed-domain analytics remain pending.

Lead capture now routes through `capture_commercial_lead`, which normalizes repeat captures by email/source/report/occupation and stores consent text plus consent timestamp. SEO report downloads and coach sample artifacts require explicit contact consent before they persist a lead, link to `/privacy`, and lead ops exposes the consent status for staff review. If Supabase is unavailable, the browser retry queue redacts full report HTML, keeps entries for up to seven days, and retries queued lead persistence after later successful captures.

## Current Verification Gate

Run `npm run smoke:commercial` before commercial demos or outreach handoffs. The script starts Vite on a local open port, verifies commercial routes are registered in `src/App.tsx`, and checks that each route returns a Vite app shell. This is a route smoke gate, not a replacement for browser-level lead capture and PDF/report generation tests.

Run `npm run verify:sources` before changing public source claims. The script fetches official O*NET, BLS, WEF, OECD, AI Workforce Consortium/Cisco, Anthropic, OpenAI GDPval, WCAG, ADA, ISO/IEC 42001, ESCO, and NIST pages, checks expected evidence strings, writes `docs/commercialization/source-verification-latest.json`, and stores response hashes for audit comparison.

Run `npm run verify:data-provenance` after changing local commercial seed data, source adapters, or provenance code. The script hashes the local WEF economics CSV, occupation-risk seed, O*NET ingestion boundary, source registry, and report provenance renderer, then writes `docs/commercialization/data-provenance-checksums.json` and `.md`. This is a local artifact drift guard; full O*NET/BLS table checksums and true O*NET Task Ratings weighting still require a live exported Supabase data snapshot after ingestion.

Run `npm run verify:commercial-trust` before commercial demos or outreach copy changes. The script checks that public pages do not crash when Supabase env vars are absent, `/privacy` is routed, SEO and coach consent copy link to privacy, browser fallback queues redact report HTML, and the expanded source guardrails remain registered.

Run `npm run verify:commercial` as the core commercial proof-pack gate. It regenerates the codebase index, verifies trust boundaries, writes local data-provenance checksums, lints commercial files, builds the production bundle, and smokes commercial routes. The local data-provenance gate records whether the latest source URL verification passed, but it does not fail solely because DNS or official-source fetching is unavailable; use `node scripts/verify-commercial-data-provenance.mjs --write --require-source-verification` when you intentionally want that stricter coupling. Use `npm run verify:commercial -- --with-a11y` when Chromium startup is stable, `npm run verify:commercial-network` when DNS/npm registry access is available, and `npm run verify:commercial-full` only when source fetching, npm audit, and Chromium startup are stable in the execution environment.

Run `npm run index:commercial` after adding or changing commercial routes, persistence functions, source adapters, or verification scripts. It regenerates `docs/commercialization/commercialization-codebase-index.md` and `.json` from `src/App.tsx`, `package.json`, `src/lib/sourceManifest.ts`, and the commercial Supabase migration so codebase indexing stays tied to repo evidence.

Browser QA on May 24, 2026 found and fixed a public-route failure where missing Supabase env vars blanked the app at module import time. After the fallback change, `/privacy`, `/sample-report`, and `/automation-risk/accountant` rendered in the in-app browser; the SEO and coach sample form checks produced no new console errors and kept submit actions disabled until consent was checked.

## Official References

- O*NET Database releases: https://www.onetcenter.org/db_releases.html
- BLS Employment Projections: https://www.bls.gov/emp/
- BLS OEWS tables: https://www.bls.gov/oes/tables.htm
- WEF Future of Jobs Report 2025: https://www.weforum.org/publications/the-future-of-jobs-report-2025/
- OECD Skills Outlook 2025: https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/12/oecd-skills-outlook-2025_ac37c7d4/26163cd3-en.pdf
- AI Workforce Consortium ICT in Motion 2025: https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2025/m09/ai-workforce-consortium-finds-78-of-ict-roles-now-include-ai-technical-skills-while-human-skills-gain-priority-for-responsible-tech-adoption.html
- Anthropic Economic Index: https://www.anthropic.com/research/the-anthropic-economic-index
- Anthropic labor market impacts / observed exposure: https://www.anthropic.com/research/labor-market-impacts
- OpenAI GDPval overview: https://openai.com/index/gdpval
- OpenAI GDPval leaderboard: https://evals.openai.com/gdpval/leaderboard
- OpenAI GDPval paper record: https://arxiv.org/abs/2510.04374
- BLS AI impacts in employment projections: https://www.bls.gov/opub/mlr/2025/article/incorporating-ai-impacts-in-bls-employment-projections.htm
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- ADA AI hiring guidance: https://www.ada.gov/resources/ai-guidance/
- ISO/IEC 42001: https://www.iso.org/standard/42001
- ESCO Services API: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api
- NIST AI RMF: https://www.nist.gov/itl/ai-risk-management-framework
