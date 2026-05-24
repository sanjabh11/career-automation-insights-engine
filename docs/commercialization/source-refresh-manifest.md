# Source Refresh Manifest

Date: 2026-05-24
Code source: `src/lib/sourceManifest.ts`
Purpose: Keep commercial reports honest about which public sources are current, which adapters are only ready boundaries, and which claims still require ingestion verification.

## Verified Current Sources

| Source | Current version/status | Verified use | Claim boundary |
|---|---|---|---|
| O*NET | O*NET Database 30.3 production release, May 2026 | SOC occupation metadata, tasks, skills, descriptors, and Task Ratings importance/frequency fields | Do not claim all in-app rows are 30.3-backed or task-time precise until the data-refresh job and checksum manifest run. |
| O*NET Task Statements/Ratings/Categories/Scales | O*NET 30.3 text dictionary | Task statement ingestion, importance/relevance/frequency weighting metadata, and frequency labels | Use as occupation-level task-prioritization evidence only after migration, ingest, and exported-table checksum proof. |
| BLS Employment Projections | 2024-34 occupational employment projections | Growth/outlook context | Directional labor-market context only; not employer-specific forecasting. |
| BLS OEWS | May 2025 OEWS tables, published May 2026 | Wage and employment estimates | Use only after SOC/occupation mapping is verified. |
| WEF Future of Jobs | 2025 edition, 2025-2030 horizon | Macro skill and technology trend framing | Use for directional narrative, not occupation scoring by itself. |
| OECD Skills Outlook | 2025 edition | Skill-change, task-content change, and reskilling policy context | Use for skill-transition framing, not worker-specific guidance or local demand proof. |
| AI Workforce Consortium ICT in Motion | 2025 report | AI-era role radar market-signal framing for AI-specific and specialized support roles | Use as emerging-role signal context, not title-level proof for every employer or region. |
| NACE Career Readiness Competencies | Public competency framework reviewed May 2026 | Career-center and coach outreach framing, transferable-skill language, and student/alumni development context | Use to frame buyer workflows and development conversations; do not imply NACE validates the product, scores, or recommendations. |
| DOL AI Literacy Framework | Training and Employment Notice No. 07-25, published February 13, 2026 | AI literacy, workforce-board, training-provider, and L&D pilot framing for role-specific AI skill development | Use as workforce and education context only; do not claim DOL endorsement, grant eligibility, or employment-outcome proof. |
| Anthropic Economic Index | Initial 2025 index plus 2026 Economic Primitives updates | Observed AI use by O*NET task, automation/augmentation framing, adoption inequality caveats | Use as AI-use benchmark context only until task-level datasets are imported and validated. |
| Anthropic observed exposure research | 2026 labor-market impacts research | Separates theoretical capability from observed automated, work-related AI use | Use for claim discipline; do not translate exposure directly into job-loss claims. |
| OpenAI GDPval | First version, September 2025 | Economically valuable knowledge-work capability benchmark | Use for model-capability context only, not as a labor-market forecast. |
| BLS AI Monthly Labor Review | February 2025 occupational case-study article | Claim discipline around exposure, uncertainty, and occupation-specific employment-projection nuance | Exposure does not imply rapid displacement; use to temper commercial claims. |
| WCAG 2.2 | W3C Recommendation | Accessibility conformance target for public commercial flows | Do not claim conformance until manual and automated audit evidence exists. |
| OWASP File Upload Cheat Sheet | OWASP Cheat Sheet Series | Resume upload validation, file-signature, size-limit, and storage-minimization boundaries | Does not prove uploads are malware-free or that PDF/DOCX extraction is complete. |
| Supabase Edge Functions | Supabase platform documentation | Server-side parser boundary and deployment/runtime caveats for resume file handling | Use for validation and orchestration; heavy parsing, malware scanning, or large-file workflows may need a dedicated parser service. |
| ADA algorithmic hiring guidance | DOJ/EEOC guidance | Employment-decision, accommodation, and human-review guardrails | Planning-only reports unless validation, accommodation, and adverse-impact review exist. |
| EEOC employment tests and selection procedures | Employment Tests and Selection Procedures technical assistance | Employment-selection overclaim boundaries and adverse-impact caveats | Do not use proof-pack scores for selection, promotion, retention, or termination decisions without a formal validated employment-selection program. |
| CFPB employment algorithmic score circular | Consumer Financial Protection Circular 2024-06 | Consumer-report and employment-purpose overclaim boundaries for individual reports and worker scores | Do not furnish individual proof-pack reports to employers for employment purposes without FCRA, notice, permission, dispute, accuracy, and legal-review controls. |
| ISO/IEC 42001 | ISO/IEC 42001:2023 AI management system | AI governance, traceability, transparency, and review-attestation framing | Use as governance design context only; do not claim ISO certification or compliance. |

## Adapter Boundaries

| Source | Status | Boundary |
|---|---|---|
| ESCO v1.2.1 | Adapter-ready | Needs import, crosswalk, and validation before powering scored U.S. reports. |
| Lightcast | Adapter-ready | Requires licensed data agreement and ingestion adapter before any backed claims. |
| Workera public positioning | Adapter-ready | Use only for market-positioning context; do not imply Workera-backed validation, integration, or comparable assessment depth. |
| SerpAPI-compatible search | Adapter-ready | Requires query log, cache policy, timestamp, and jurisdiction before market-signal claims. |
| LLM output | Runtime advisory | Needs model/prompt metadata, source grounding, and human review state per artifact. |

## Next Refresh Work

1. Schedule `npm run verify:sources` and archive each `source-verification-latest.json` output before source-sensitive demos.
2. Apply `20260524000300_add_onet_task_rating_metadata.sql`, run the O*NET 30.3 Task Statements/Task Ratings ingest, rerun `npm run verify:onet-task-ratings-live`, and add checksums for the exported `onet_detailed_tasks` table before replacing proxy task weights.
3. Attach score-level evidence cards to generated report sections.
4. Store source manifest snapshots with each generated commercial report artifact.
5. Block marketing copy from claiming provider-backed scoring when a source is only `adapter-ready`.

## Commercial Artifact Delivery Audit

Report artifacts now have an append-only staff event boundary in `commercial_report_artifact_events`. Staff opens/download fallbacks from `/operations/leads` call `log_commercial_report_artifact_event` with `staff_opened`, `staff_downloaded`, or `staff_open_failed`, and the lead ops table can load recent artifact history per lead. The follow-up migration `20260524000200_add_commercial_artifact_review_events.sql` adds `section_review_updated`, `section_client_ready`, and `artifact_client_ready` so staff can log section-level proof-pack readiness plus final artifact client-ready approval with actor identity, reviewer notes, source IDs, evidence card IDs, and acceptance criteria. After human-review attestation exists, staff can download a source-labeled proof-pack delivery packet that bundles the reviewed report preview, attestation, event history, source IDs, report hash, packet hash, and decision boundaries. This gives the sales/support workflow a delivery and review evidence trail while signed storage URLs, PDF export, resend workflows, and richer delivery analytics remain next-step work.

Coach sample reports now use the same source manifest boundary and can persist a branded sample artifact when a coach enters a contact email. Treat this as an outreach proof-pack flow: the preview settings are browser-saved for fast demos, while the generated report HTML and lead record are Supabase-backed when the artifact capture succeeds.

The public proof-pack gallery at `/proof-pack-gallery` packages the bounded outreach surface for coaches, career centers, and workforce buyers. It links to the individual, coach, career-center cohort, and workforce sample routes, includes a sample occupation shelf, renders outreach evidence cards with source IDs, caveats, confidence, and review state, and exports a manual CRM-import CSV with the same evidence boundary columns. Treat the CSV as an outreach operations artifact only; live CRM sync, email automation, and deployed-domain analytics remain pending.

The counselor route at `/tools/counselor-reports` now includes an aggregate-only career-center cohort proof pack for student/alumni workshop planning. The sample exports source-labeled HTML and CSV artifacts with FERPA-style privacy boundaries, NACE first-destination outcome separation, small-cell suppression notes, and advisor-review requirements. Treat this as a pilot sample until live batch consent, approved roster import, artifact persistence, and institution-specific data governance are implemented.

Lead capture now routes through `capture_commercial_lead`, which normalizes repeat captures by email/source/report/occupation and stores consent text plus consent timestamp. SEO report downloads and coach sample artifacts require explicit contact consent before they persist a lead, link to `/privacy`, and lead ops exposes the consent status for staff review. If Supabase is unavailable, the browser retry queue redacts full report HTML, keeps entries for up to seven days, and retries queued lead persistence after later successful captures.

Resume analysis now has a bounded deletion-receipt, parser, and proof-pack boundary. The `parse-resume` Edge Function validates multipart uploads with an extension allowlist, content-type caveat, file-signature check, 2MB size cap, no public storage write, no raw resume text persistence, and a non-persistence parser receipt. It extracts text only from UTF-8 `.txt` uploads; PDF/DOC/DOCX returns a `parser_adapter_pending` receipt until a dedicated parser, malware-scan policy, and deletion evidence exist. The `analyze-resume` Edge Function stores only a redacted length-only resume text stub for saved analyses, returns `resume_analysis_proof_boundary` metadata with source IDs, confidence, caveats, "does not prove" statements, parser receipt linkage, parser boundary, and `staff_review_required` state, and `delete_resume_analysis_with_receipt` deletes the authenticated user's saved `resume_analyses` row while recording receipt ID, receipt hash, source IDs, caveat, raw-text retention policy, and model-provider boundary. The resume UI can request server-side parsing when Supabase is configured, show the parser receipt, download a source-labeled `Resume Work Transition Proof Report` HTML artifact, save an authenticated user-owned redacted proof artifact that omits raw resume text, phrase rows, and detailed rewrite rows, delete that redacted artifact with an app-level receipt, and copy rewrite drafts with coaching caveats. Treat this as app-level upload-boundary/deletion and coaching-proof metadata only; browser files, user exports, external model-provider logs, backups, employment-decision validation, institution-consented detailed resume storage, live parser deployment, malware scanning, and production PDF/DOCX parsing require separate controls and live deployment verification.

## Current Verification Gate

Run `npm run smoke:commercial` before commercial demos or outreach handoffs. The script starts Vite on a local open port, verifies commercial routes are registered in `src/App.tsx`, and checks that each route returns a Vite app shell. This is a route smoke gate, not a replacement for browser-level lead capture and PDF/report generation tests.

Run `npm run verify:sources` before changing public source claims. The script fetches official O*NET release and task dictionary pages, BLS, WEF, OECD, AI Workforce Consortium/Cisco, NACE, DOL AI literacy, Anthropic, OpenAI GDPval, WCAG, ADA, ISO/IEC 42001, ESCO, and NIST pages, checks expected evidence strings, writes `docs/commercialization/source-verification-latest.json`, and stores response hashes for audit comparison.

Run `npm run verify:onet-task-ratings` after changing O*NET task-rating imports. The script verifies the official 30.3 Task Statements, Task Ratings, Task Categories, and Scales Reference source checks, the Supabase task-rating metadata migration, the Deno ingest boundary, the runtime weighting helper, and data-provenance coverage.

Run `npm run verify:onet-task-ratings-live` after target project credentials are available and after any O*NET Task Ratings migration or ingest attempt. The script uses the public Supabase API with an anon/publishable key, never prints keys, and performs only non-mutating `GET` requests against `onet_detailed_tasks`. It fails if the deployed schema cache is missing the Task Ratings columns or if the table returns no ingested `O*NET 30.3` rating rows. Use `node scripts/verify-commercial-release.mjs --with-live-onet` when you want this live proof included in the release orchestrator. The latest redacted attempt is stored at `docs/commercialization/onet-task-ratings-live-proof-latest.json`; on May 24, 2026 it showed target `kvunnankqgfokeufvsrv` missing `onet_release_version` and `frequency_category`, so O*NET Task Ratings migration/ingest remains a live blocker before task-time or live rating-weight claims.

Run `npm run verify:data-provenance` after changing local commercial seed data, source adapters, privacy boundaries, or provenance code. The script hashes the local WEF economics CSV, occupation-risk seed, O*NET ingestion boundary, O*NET Task Ratings ingest boundary, source registry, report provenance renderer, institutional readiness packet, resume deletion receipt client/migration, and resume retention/proof-pack boundary, then writes `docs/commercialization/data-provenance-checksums.json` and `.md`. This is a local artifact drift guard; full O*NET/BLS table checksums and true O*NET Task Ratings weighting still require a live exported Supabase data snapshot after ingestion.

Run `npm run verify:commercial-live-supabase` after target project credentials are available. The script uses the public Supabase API with an anon/publishable key, never prints keys, and performs only non-mutating requests. It fails if the commercial staff/artifact review or resume deletion receipt tables/RPCs are missing from the deployed schema cache, and it accepts expected auth/RLS/staff-boundary responses as proof that the objects exist behind the correct access boundary. Use `node scripts/verify-commercial-release.mjs --with-live-supabase` when you want this live proof included in the release orchestrator. The latest redacted attempt is stored at `docs/commercialization/live-supabase-proof-latest.json`; on May 24, 2026 it showed the target project still missing the commercial staff/artifact event and resume deletion receipt objects, so migration application remains a live blocker before institutional delivery.

Run `npm run verify:commercial-deployment` before applying commercial Supabase migrations. The script writes `docs/commercialization/live-supabase-deployment-packet.json` and `docs/commercialization/live-supabase-deployment-runbook.md`, verifies the local migration order, records SHA-256 hashes, rejects table-drop/truncate/drop-column patterns, and prints the credential-gated `supabase migration list`, `supabase db push --dry-run`, `supabase db push`, schema-cache reload, and post-deployment verifier sequence. This packet does not apply migrations and does not prove the remote schema; it exists so the credentialed deployment step is reviewable and reproducible.

Run `npm run verify:commercial-trust` before commercial demos or outreach copy changes. The script checks that public pages do not crash when Supabase env vars are absent, `/privacy` is routed, SEO and coach consent copy link to privacy, browser fallback queues redact report HTML, resume deletion receipt and resume proof-pack boundaries remain wired, the institutional readiness packet remains source-labeled, and the expanded source guardrails remain registered.

Run `npm run verify:commercial-a11y` before institution-facing demos when Chromium startup is stable. The script checks scoped commercial routes across mobile, tablet, and desktop for H1 coverage, main landmarks, horizontal overflow, accessible control names, and visible mobile keyboard tab stops, then writes `docs/commercialization/commercial-accessibility-audit-latest.json` and `.md`. Treat the generated packet as automated smoke plus a manual WCAG 2.2 checklist, not as a WCAG conformance claim; WCAG-EM scope, screen-reader review, contrast, focus-not-obscured, target-size, redundant-entry, error-state, and accessible-authentication evidence remain required before institutional delivery.

Run `npm run verify:commercial` as the core commercial proof-pack gate. It regenerates the codebase index, verifies trust boundaries, generates the live Supabase deployment packet, writes local data-provenance checksums, lints commercial files, builds the production bundle, and smokes commercial routes. The local data-provenance gate records whether the latest source URL verification passed, but it does not fail solely because DNS or official-source fetching is unavailable; use `node scripts/verify-commercial-data-provenance.mjs --write --require-source-verification` when you intentionally want that stricter coupling. Use `npm run verify:commercial -- --with-a11y` when Chromium startup is stable, `npm run verify:commercial-network` when DNS/npm registry access is available, and `npm run verify:commercial-full` only when source fetching, npm audit, and Chromium startup are stable in the execution environment.

Run `npm run index:commercial` after adding or changing commercial routes, persistence functions, source adapters, or verification scripts. It regenerates `docs/commercialization/commercialization-codebase-index.md` and `.json` from `src/App.tsx`, `package.json`, `src/lib/sourceManifest.ts`, and the commercial Supabase migration so codebase indexing stays tied to repo evidence.

`.github/workflows/commercial-proof-pack.yml` is the installed GitHub Actions proof-pack gate. It uses read-only repository permissions, `actions/checkout@v6`, `actions/setup-node@v6`, Node 20 as the app test runtime, runs `npm ci`, installs Playwright Chromium, runs `npm run verify:commercial -- --with-a11y --with-journey` on push/PR, and reserves `npm run verify:commercial-network` for manual or scheduled runs so official-source fetching and production audit are explicit CI events. `docs/commercialization/commercial-proof-pack.workflow.yml` remains the reference template.

Browser QA on May 24, 2026 found and fixed a public-route failure where missing Supabase env vars blanked the app at module import time. After the fallback change, `/privacy`, `/sample-report`, and `/automation-risk/accountant` rendered in the in-app browser; the SEO and coach sample form checks produced no new console errors and kept submit actions disabled until consent was checked.

## Official References

- O*NET Database releases: https://www.onetcenter.org/db_releases.html
- O*NET 30.3 Task Statements: https://www.onetcenter.org/dictionary/30.3/text/task_statements.html
- O*NET 30.3 Task Ratings: https://www.onetcenter.org/dictionary/30.3/text/task_ratings.html
- O*NET 30.3 Task Categories: https://www.onetcenter.org/dictionary/30.3/text/task_categories.html
- O*NET 30.3 Scales Reference: https://www.onetcenter.org/dictionary/30.3/text/scales_reference.html
- BLS Employment Projections: https://www.bls.gov/emp/
- BLS OEWS tables: https://www.bls.gov/oes/tables.htm
- BLS LAUS data overview: https://www.bls.gov/lau/data-overview.htm
- BLS QCEW data overview: https://www.bls.gov/cew/data-overview.htm
- CareerOneStop API Overview: https://github.com/CareerOneStop/API-Overview
- Census ACS Data via API: https://www.census.gov/programs-surveys/acs/data/data-via-api.html
- WEF Future of Jobs Report 2025: https://www.weforum.org/publications/the-future-of-jobs-report-2025/
- OECD Skills Outlook 2025: https://www.oecd.org/en/publications/2025/12/oecd-skills-outlook-2025_ac37c7d4.html
- AI Workforce Consortium ICT in Motion 2025: https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2025/m09/ai-workforce-consortium-finds-78-of-ict-roles-now-include-ai-technical-skills-while-human-skills-gain-priority-for-responsible-tech-adoption.html
- NACE Career Readiness Competencies: https://www.naceweb.org/career-readiness/competencies/career-readiness-defined
- NACE First-Destination Standards and Protocols: https://www.naceweb.org/job-market/graduate-outcomes/first-destination/standards-and-protocols/
- FERPA student privacy PII guidance: https://studentprivacy.ed.gov/content/personally-identifiable-information-education-records
- DOL AI Literacy Framework: https://www.dol.gov/agencies/eta/advisories/ten-07-25
- Anthropic Economic Index: https://www.anthropic.com/research/the-anthropic-economic-index
- Anthropic labor market impacts / observed exposure: https://www.anthropic.com/research/labor-market-impacts
- OpenAI GDPval overview: https://openai.com/index/gdpval
- OpenAI GDPval leaderboard: https://evals.openai.com/gdpval/leaderboard
- OpenAI GDPval paper record: https://arxiv.org/abs/2510.04374
- BLS AI impacts in employment projections: https://www.bls.gov/opub/mlr/2025/article/incorporating-ai-impacts-in-bls-employment-projections.htm
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- ADA AI hiring guidance: https://www.ada.gov/resources/ai-guidance/
- EEOC employment tests and selection procedures: https://www.eeoc.gov/laws/guidance/employment-tests-and-selection-procedures
- CFPB employment algorithmic score circular: https://www.consumerfinance.gov/compliance/circulars/consumer-financial-protection-circular-2024-06-background-dossiers-and-algorithmic-scores-for-hiring-promotion-and-other-employment-decisions/
- ISO/IEC 42001: https://www.iso.org/standard/42001
- ESCO Services API: https://esco.ec.europa.eu/en/use-esco/use-esco-services-api
- NIST AI RMF: https://www.nist.gov/itl/ai-risk-management-framework
- Workera product overview: https://www.workera.ai/product-overview
