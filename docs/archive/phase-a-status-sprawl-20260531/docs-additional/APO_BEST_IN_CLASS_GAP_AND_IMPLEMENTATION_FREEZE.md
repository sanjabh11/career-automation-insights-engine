# APO Best-In-Class Gap And Implementation Freeze

Evidence snapshot: 2026-05-08
Scope: product freeze plan for the APO Dashboard as a career automation forecasting and workforce transition platform.

This document freezes what should be implemented next after the Top20 rewrite. It is intentionally buyer-first: features are ranked by market value, proof status, and ability to strengthen the core USP.

Runtime proof tracker: `docs/APO_TOP10_RUNTIME_PROOF_CHECKLIST.md`.
Growth operating plan: `docs/growth/APO_OUTREACH_OPERATING_PLAN.md`.
Outreach templates: `docs/growth/templates/APO_OUTREACH_AND_PILOT_TEMPLATES.md`.
Campaign assets: `docs/growth/APO_OUTREACH_CAMPAIGN_ASSETS.md`.

## Freeze Rule

Do not mark a feature `LIVE`, `Ready to sell`, or `Best-in-class` until all six gates pass:

| Gate | Required Proof |
|---|---|
| Source | Route, component, Edge Function, migration, or API contract exists. |
| Runtime | Local or deployed route opens without blank, crash, or unusable empty state. |
| Data | The feature has seeded/demo data or a real import/API path. |
| Provenance | User-facing output states whether it came from O*NET, BLS/OEWS, job postings, WEF/economic assumptions, or generated AI. |
| Buyer Workflow | The target buyer can complete the core action without SOC IDs, hidden env flags, or developer-only steps. |
| Artifact | The feature produces a saved, downloadable, shareable, or reportable output where buyer value requires one. |

Items that fail any gate remain `Partially usable` even if the code exists.

## Key Selling Points

1. APO has a real USP when focused on automation-risk defense and transition planning, not generic career tooling.
2. The core strength is the chain: occupation search -> APO forecast -> task drivers -> bridge roles -> skill adjacency -> learning/report output.
3. O*NET is a strong backbone because it provides standardized occupations, tasks, knowledge, skills, abilities, work context, and technology skills.
4. The marketable gap is current labor-market signal depth: O*NET needs BLS/OEWS, job postings, WEF/economic adoption, and outcomes data layered on top.
5. The best B2B wedge is counselor/coach reports first, then utilities/energy workforce audits.
6. Utilities/energy should be framed as workforce planning for grid modernization, automation exposure, regulated work, cybersecurity, SCADA, distributed energy resources, and reskilling ROI. Do not blend this with energy load forecasting inside this repo.

## USP Decision

**This website has a USP if it is positioned narrowly.** The sellable proposition is:

> Automation-risk forecasting plus practical transition planning for individuals, coaches, and workforce teams.

It becomes a weak feature bundle if it competes as a generic resume builder, ATS optimizer, job tracker, interview-prep site, or job board.

## GTM Readiness And Outreach Freeze

APO is not ready for broad "world-class" or self-serve market claims yet. It is ready for bounded, founder-led pilot outreach if every message is tied to a visible proof pack and an explicit claim boundary.

| Proof Pack | Buyer | Route / Artifact | GTM Status | Claim Boundary |
|---|---|---|---|---|
| Coach white-label career resilience report | Career coaches, resume writers, outplacement consultants | `/for-coaches`, `/sample-report`, `/tools/counselor-reports` | Pilot outreach ready | Present as a reviewable coach artifact; do not imply polished PDF/client-folder workflow is fully complete until proven. |
| Resume AI-proof score | Individual professionals, coaches | `/tools/resume-analyzer` | Pilot/content ready | Position as automation-risk resume language analysis, not an ATS optimizer or guaranteed interview tool. |
| Bridge-role transition pathway | Coaches, workforce boards, career services | `/tools/bridge-roles` | Conditional lead | Use after route/function proof; avoid promising complete learning-resource coverage until verified. |
| Skill adjacency graph | Coaches, bootcamps, workforce agencies | `/tools/skill-adjacency` | Demo asset | Use as visual differentiation; keep data/embedding/cache proof caveats visible. |
| Utility workforce automation audit | Utility HR, L&D, workforce planners | `/enterprise-dashboard` | Pilot-only | Workforce planning only; not energy-load forecasting, SCADA, ADMS, or production HRIS. |
| Responsible AI/methods appendix | B2B, education, government, regulated sectors | `/validation`, `/validation/methods`, `/responsible-ai` | Attach | Trust appendix only until calibration/model-card snapshots are tied to current implementation. |

Outreach operating rules are frozen in `docs/growth/APO_OUTREACH_OPERATING_PLAN.md`. Templates and pilot scopes are frozen in `docs/growth/templates/APO_OUTREACH_AND_PILOT_TEMPLATES.md`. Campaign assets and buyer-lane copy are frozen in `docs/growth/APO_OUTREACH_CAMPAIGN_ASSETS.md`.

Do not run automation-first LinkedIn campaigns. The first motion is manual, founder-led, and capped to protect claim quality: one buyer lane, one proof pack, one route, one artifact, one caveat.

## Best-In-Class Benchmark

| Comparator | Best-In-Class Capability | APO Position | Required Gap Closure |
|---|---|---|---|
| O*NET / CareerOneStop | Trusted public occupation profiles, assessments, wages, employment, training, job postings, and state/national views. | APO adds AI automation-risk interpretation and transition planning over structured occupational data. | Add cleaner O*NET attribution, current O*NET version/freshness, and avoid implying O*NET itself provides AI forecast truth. |
| Will Robots Take My Job | Simple viral automation-risk lookup, rankings, model methodology, and user sentiment. | APO can be deeper: task-level drivers, bridge roles, reports, and B2B workflow. | Make first public lookup faster, add shareable score cards, publish a transparent methods page, and show validation. |
| Jobscan / Teal / Rezi | Resume/job-search workflows, ATS matching, job tracker, templates, coach/university accounts. | APO should not chase generic ATS. It can differentiate on automation-prone resume language and future-proof repositioning. | Improve parsing, privacy, deletion, and coach workflow while avoiding commodity keyword matching as the headline. |
| Lightcast-style intelligence | Real-time labor market skills taxonomy, postings, pathways, advertised salary, and enterprise-grade data products. | APO can be a focused, lower-cost automation-defense layer for mid-market, coaches, schools, and utilities. | Add richer skills taxonomy, external feed provenance, skill-gap scoring, salary/demand evidence, and enterprise report proof. |
| Career-coach tooling | Client management, white-label deliverables, progress tracking, and billing. | APO has a differentiated report topic coaches can charge for. | Add client folders, report history, polished PDF, sample report proof, and reliable credits/subscription flow. |

## Current Vs Needed For The Top 10

| Rank | Feature | Current Evidence | Current Gap | Best-In-Class Needed | Freeze Decision |
|---:|---|---|---|---|---|
| 1 | APO Forecasting + Confidence Intervals | `calculate-apo` has Gemini JSON validation, deterministic scoring, BLS/economic adjustments, Monte Carlo CI, `apo_logs`. | Needs runtime proof, visible provenance, calibration snapshot, and sample known-good occupations. | Public methods, freshness, validation, confidence explanation, and traceable input sources. | Freeze after route/function smoke and methods surface. |
| 2 | Resume Automation Risk Analyzer | `/tools/resume-analyzer`, `ResumeAnalyzer`, `analyze-resume`, `resume_analyses`. | Browser reads PDF/DOC/DOCX with `file.text()` simplification; stores resume text for signed-in users; lacks deletion/privacy controls. | Robust PDF/DOCX parsing, redaction, retention/deletion, shareable score card, coach handoff. | Fix before selling broadly. |
| 3 | Counselor White-Label Reports | `/tools/counselor-reports`, `CounselorReportGenerator`, credits RPC, `generate-counselor-report`. | Auth/credits dependent; HTML/print output; client/report management not complete. | Polished PDF, client folders, branded templates, report history, sample reports, billing proof. | Critical B2B freeze item. |
| 4 | Bridge Role Pathways | `/tools/bridge-roles`, A* function, cache table. | SOC-code-only input; intermediate path titles can be missing; no guided examples or learning handoff. | Search-first UX, examples, gap skills, course recommendations, salary/risk deltas. | Fix standalone UX first. |
| 5 | Skill Adjacency Graph | `/tools/skill-adjacency`, graph component, pgvector/RPC function. | Standalone route has no picker and defaults to empty disabled state. | Occupation/skill picker, demo examples, cached output, demand/salary provenance. | Fix standalone UX first. |
| 6 | Enterprise / Utilities Workforce Dashboard | `/enterprise-dashboard` demo route, department charts, CSV importer, HRIS/report/ROI functions. | `orgId="demo"`; HRIS sync, executive report, CSV upload persistence, and learning ROI are stub/simulated. | Real CSV import, utility templates, department heatmap, ROI, executive report, audit export. | Do not sell as implemented until stubs are replaced. |
| 7 | Task AI Impact Planner + Learning Paths | `/ai-impact-planner`, `assess-task`, `generate-learning-path`, `course-search`, `skill-recommendations`. | Broad but fragmented; many tools are not tied back to APO forecast or buyer journey. | One guided flow from APO drivers to tasks, skills, learning plan, ROI, and progress. | Consolidate after top standalone fixes. |
| 8 | Market Intelligence Layer | `market-intelligence`, `serpapi-jobs`, `bls-sync`, `automation_economics`, BLS tables. | Local market intelligence is env-disabled by default; job data is shallow; AI fills context gaps. | Refresh cadence, posting counts, salary normalization, geography, source freshness, fallback labels. | Build provenance layer before adding more feeds. |
| 9 | SEO Risk Pages + Sample Reports | `/automation-risk/:occupation`, `/compare/:slugs`, `/sample-report`, `occupationRiskData`. | Static data; lead capture TODO; no proof of conversion or content uniqueness. | Programmatic pages with evidence, email capture, report download, internal linking, paid workflow handoff. | Medium priority after core proof. |
| 10 | Responsible AI + Validation | `/validation`, `/validation/methods`, `/responsible-ai`, `calibrate-ece`, `apo_logs`. | Pages exist but public calibration/model-card proof needs hardening. | Methods page, model card, data sheet, validation snapshots, known limitations, provenance labels. | Critical for B2B trust. |

## Data Feed Decision

O*NET should stay as the backbone, not the only signal.

| Feed | Add Now? | Reason |
|---|---:|---|
| O*NET current database / Web Services | Yes | Backbone for occupations, tasks, skills, knowledge, abilities, technology skills, and work context. Track version and update date. |
| BLS/OEWS | Yes | Adds wage, employment, and occupational trend grounding. Already partly implemented; needs freshness UI. |
| Job postings via SerpAPI or similar | Yes | Adds current demand and emerging skill signals, but needs aggregation and source limits. |
| WEF / macro adoption signals | Yes, as assumptions | Useful for sector-level adoption context; must be labeled as macro signal, not occupation ground truth. |
| User outcomes and follow-up surveys | Yes, after core flows | Needed for calibration and proof that recommendations help. |
| Lightcast / ESCO / NLx-style skills data | Later / partnership | Valuable for best-in-class skills taxonomy and pathways, but not required before usability and provenance. |
| GPU forecasting | No for v1 | Data quality, calibration, and UX are bigger bottlenecks than compute. |

## GPU Forecasting Decision

Do not implement GPU-based forecasting now.

GPU becomes justified only if one of these becomes true:

| Trigger | Example |
|---|---|
| Large offline training set exists | Labeled task/outcome data supports custom model training. |
| Embedding refresh is slow at scale | Recomputing thousands of occupation/skill embeddings becomes a batch bottleneck. |
| Enterprise simulations need high volume | Large clients require thousands of scenarios per run. |
| Graph analytics outgrow SQL/RPC | Career-neighborhood clustering or similarity search needs heavier offline computation. |

Until then, spend engineering effort on data provenance, route usability, calibration, and reports.

## Utilities / Energy Workforce Package

Utilities/energy is worth implementing as a vertical package because public grid-modernization and energy-workforce sources emphasize workforce development, cybersecurity, data science, forecasting, SCADA/operational technology, distributed energy resources, and cross-sector transition planning.

| Utility Capability | Build Status | Priority | Implementation Target |
|---|---|---:|---|
| Utility role template library | Missing | 5 | Seed roles such as lineworker, substation technician, distribution dispatcher, grid planner, SCADA/OT engineer, utility cybersecurity analyst, DER interconnection analyst, vegetation management, customer operations, regulatory analyst. |
| Team CSV workforce audit | Stub/simulated | 5 | Persist uploaded employees, map roles to SOC/O*NET, calculate APO, group by department, show unmapped rows. |
| Department risk map | Demo-only | 5 | Real org data rollups plus utility-specific risk labels and regulated-work caveats. |
| Reskilling ROI | Stub | 5 | Replace mock ROI with formula using headcount, wage, training cost, time-to-proficiency, risk reduction, retention, and avoided hiring cost. |
| Grid-modernization skill gaps | Missing | 5 | Map roles to data science, AI/ML, cybersecurity, SCADA/OT, DER, energy storage, GIS, regulatory reporting, safety/compliance. |
| Executive audit report | Stub | 4 | Downloadable report with department exposure, top transition roles, budget estimate, and data provenance. |
| Energy load/demand forecasting | Out of scope | 1 | Separate product domain; do not dilute this career/workforce site. |

## Critical Roadmap

| Item | Commercial Impact | Urgency | Utilities / Workforce Relevance | Execution Notes |
|---|---:|---:|---:|---|
| Maintain local dependency/build state and complete smoke harness | 5 | 5 | 5 | Build repair is complete and `npm run build` passes. Remaining proof work is browser interaction and Edge Function smoke for top routes. |
| Add proof gates to Top10 feature statuses | 5 | 5 | 5 | Create a route/function smoke checklist and avoid `LIVE` claims until proof is attached. |
| Fix `/tools/skill-adjacency` standalone UX | 5 | 5 | 5 | Add occupation/skill picker, demo defaults, empty states, and cached sample output. |
| Fix `/tools/bridge-roles` standalone UX | 5 | 5 | 5 | Add occupation search, common examples, title display, missing-skill summaries, and learning-path CTA. |
| Harden resume analyzer privacy/parsing | 5 | 4 | 4 | Add real PDF/DOCX parsing, redaction, retention notice, delete analysis, and parsing failure states. |
| Harden counselor report flow | 5 | 4 | 5 | Add polished PDF generation, sample output, report history, client folders, and credit-flow proof. |
| Replace enterprise stubs for utility audit MVP | 5 | 5 | 5 | Real CSV persistence, role mapping, department rollups, utility templates, and exportable report. |
| Add provenance/freshness labels | 5 | 5 | 5 | Every output should label O*NET, BLS/OEWS, job postings, WEF/economics, and AI generation separately. |

## Medium Roadmap

| Item | Commercial Impact | Urgency | Utilities / Workforce Relevance | Execution Notes |
|---|---:|---:|---:|---|
| Market intelligence refresh pipeline | 4 | 3 | 5 | Add source refresh dates, posting counts, salary normalization, fallback states, and geography. |
| Calibration and validation snapshots | 4 | 4 | 5 | Surface ECE/calibration outputs, benchmark examples, and known limitations. |
| Programmatic SEO lead capture | 4 | 3 | 3 | Replace TODO email capture with real event/storage; link downloads to report/coach workflows. |
| AI Impact Planner consolidation | 4 | 3 | 5 | Turn the broad tool set into one guided workflow from APO drivers to learning ROI. |
| Coach client management | 4 | 3 | 3 | Client folders, notes, report history, resend/share, and dashboard filters. |
| Outcomes tracking | 4 | 3 | 4 | Follow-up surveys, confidence decay, job transition outcomes, and recommendation feedback. |

## Low / Do-Not-Prioritize Roadmap

| Item | Commercial Impact | Urgency | Utilities / Workforce Relevance | Decision |
|---|---:|---:|---:|---|
| GPU forecasting | 2 | 1 | 2 | Defer until data/model scale proves compute bottleneck. |
| Generic ATS keyword optimizer | 2 | 1 | 1 | Avoid as headline; crowded and off-USP. |
| Cover-letter generator | 1 | 1 | 1 | Commodity feature. |
| Interview prep | 2 | 1 | 1 | Adjacent but dilutes core wedge. |
| Broad job board / auto-apply | 2 | 1 | 1 | Distracts from forecasting and transition planning. |
| Practitioner marketplace | 2 | 1 | 2 | Wait until report/client workflow has traction. |

## Step-By-Step Execution Plan

### Phase 0: Maintain Build And Complete Proof Harness

Goal: make runtime proof possible.

1. Keep local dependencies healthy and rerun `npm run build` after material route changes.
2. Add a small route smoke checklist for top 10 routes.
3. Record proof states: usable, gated, empty, stub, env-blocked, or crash.
4. Do not change product claims until proof exists.

Acceptance criteria:

- `npm run build` passes.
- Top 10 route smoke results are captured in a doc or test output.
- Any route that is blank, stubbed, or auth/env blocked remains `Partially usable`.

### Phase 1: Fix Standalone Monetization Tools

Goal: make the highest-sellability B2C/B2B tools usable without developer knowledge.

1. `/tools/skill-adjacency`: add occupation/skill search and example defaults.
2. `/tools/bridge-roles`: replace SOC-code-only fields with occupation search and examples.
3. `/tools/resume-analyzer`: improve file parsing and privacy copy.
4. `/tools/counselor-reports`: add sample/demo report path and clearer auth/credit states.

Acceptance criteria:

- A non-technical user can complete each route.
- Empty states explain what is needed.
- Sample inputs work without hidden IDs.

### Phase 2: Provenance And Market Intelligence

Goal: make forecasts defensible.

1. Add source badges for O*NET, BLS/OEWS, job postings, WEF/economics, and AI-generated content.
2. Add refresh dates and missing-data/fallback states.
3. Normalize job-posting counts and salary snippets before passing to Gemini.
4. Add a data provenance component used by APO, market intelligence, SEO, and reports.

Acceptance criteria:

- Users can see which source contributed to each major claim.
- Missing feeds degrade visibly instead of silently becoming AI narrative.

### Phase 3: Utilities / Energy Workforce Audit MVP

Goal: create a sellable vertical package.

1. Seed utility role templates and SOC mappings.
2. Replace CSV importer simulation with persisted upload and unmapped-row review.
3. Calculate department exposure and skill gaps from real imported rows.
4. Replace `calculate-learning-roi` stub with deterministic ROI math.
5. Replace `generate-executive-report` stub with a real utility audit report.

Acceptance criteria:

- A sample utility CSV produces department risk, skill gaps, ROI, and a downloadable report.
- Report labels all data sources and caveats.

### Phase 4: B2B Coach Workflow

Goal: make counselor reports a repeatable paid workflow.

1. Add client folders and report history.
2. Add branded PDF output.
3. Add share/resend links.
4. Verify credits and checkout flow.

Acceptance criteria:

- Coach can create, save, export, and retrieve a client report.
- Credits decrement only after successful report generation or are safely refunded.

### Phase 5: Validation And Calibration

Goal: make B2B and regulated-sector claims credible.

1. Publish methods/model-card page tied to current implementation.
2. Surface calibration snapshots from `calibrate-ece` / `apo_logs`.
3. Add representative occupations with expected score bands.
4. Add known limitations for O*NET-only and AI-generated analysis.

Acceptance criteria:

- Buyers can inspect methods, limitations, and validation snapshots.
- The product does not claim precision beyond evidence.

## First Implementation Slice Recommendation

Start with Phase 0 and the two standalone routes:

1. Repair dependency/build state.
2. Add smoke proof table.
3. Fix `/tools/skill-adjacency` empty route with search/default examples.
4. Fix `/tools/bridge-roles` SOC-code-only route with occupation search/default examples.

This gives the fastest conversion from "source exists" to "usable and sellable." The utilities package should start after those routes prove stable, because it depends on the same occupation/skill/transition primitives.

## Research Sources

- O*NET Database: https://www.onetcenter.org/database.html
- CareerOneStop career tools: https://www.careeronestop.org/Toolkit/Careers/careers.aspx
- Lightcast Skills Taxonomy: https://lightcast.io/open-skills
- Lightcast Career Pathways Data: https://docs.lightcast.io/data/docs/career-pathways
- WEF Future of Jobs Report 2025 press release: https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/
- Jobscan Coach: https://www.jobscan.co/coach
- Will Robots Take My Job calculations: https://willrobotstakemyjob.com/about/calculations
- DOE Grid Modernization Strategy 2024: https://www.energy.gov/sites/default/files/2024-12/Grid%20Modernization%20Strategy%202024.pdf
- DOE Strategy for a 21st Century Energy Workforce: https://www.energy.gov/sites/default/files/2024-09/Strategy%20for%20a%2021st%20Century%20Energy%20Workforce.pdf
