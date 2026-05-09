# Top 20 Features / Capabilities of the APO Dashboard

Evidence snapshot: 2026-05-08
Purpose: marketable, sellable, proof-tiered assessment of the APO Dashboard as a career automation forecasting and workforce transition product.

This document replaces the older feature dump. It ranks the strongest commercial features, marks implementation status from the active codebase, compares the product against best-in-class alternatives, and defines the next implementation roadmap.

Companion execution plan: [APO Best-In-Class Gap And Implementation Freeze](./APO_BEST_IN_CLASS_GAP_AND_IMPLEMENTATION_FREEZE.md).
Growth operating plan: [APO Outreach Operating Plan](./growth/APO_OUTREACH_OPERATING_PLAN.md).
Outreach templates: [APO Outreach And Pilot Templates](./growth/templates/APO_OUTREACH_AND_PILOT_TEMPLATES.md).
Campaign assets: [APO Outreach Campaign Assets](./growth/APO_OUTREACH_CAMPAIGN_ASSETS.md).

## Status Labels

| Label | Meaning |
|---|---|
| `Source-implemented` | Route, component, Edge Function, schema, or migration exists in the active repo. Runtime behavior still needs smoke proof before public `LIVE` claims. |
| `Partially usable` | The feature exists but depends on auth, seeded data, environment secrets, UX wiring, credits, or runtime proof. |
| `Planned / missing` | The idea exists in docs or strategy, but active implementation evidence is insufficient. |
| `Do not prioritize` | Commodity or low-differentiation feature for this product's current market wedge. |

## Executive Selling Points

1. **Career automation defense, not generic career software.** The strongest USP is a workflow that starts with automation exposure, then moves into transition planning, reskilling, and reporting.
2. **O*NET-backed task and skill structure with AI synthesis.** APO can use O*NET occupations, tasks, knowledge, skills, abilities, technologies, and work context as its backbone, then layer Gemini scoring and explanation over it.
3. **Actionable transition pathways.** Bridge roles and skill adjacency are more sellable than a single risk score because they answer: "What should I do next?"
4. **B2B coach and counselor monetization.** White-label reports turn the product into a revenue tool for career counselors, coaches, workforce consultants, universities, and workforce agencies.
5. **Utilities and energy workforce planning vertical.** The same automation exposure engine can be packaged for utilities: grid-modernization skill gaps, compliance friction, reskilling ROI, and department-level risk audits.
6. **Trust and evidence surfaces are a buyer feature.** Validation, provenance, calibration, telemetry, model cards, and responsible AI pages are not back-office details; they are how the product becomes credible for B2B, education, government, and regulated-sector buyers.
7. **The product is not best framed as a broad feature bundle.** If marketed as "many career tools," it loses focus. If marketed as "automation-risk forecast plus practical transition plan," it has a defensible USP.

## GTM Readiness Summary

The app should not be marketed as broadly world-class yet. It can be marketed through bounded pilot outreach where the buyer can review a visible route or artifact and the claim boundary is explicit.

| Proof Pack | Buyer | Route / Artifact | Outreach Status |
|---|---|---|---|
| Coach white-label career resilience report | Career coaches, resume writers, outplacement consultants | `/for-coaches`, `/sample-report`, `/tools/counselor-reports` | Lead for pilot outreach. |
| Resume AI-proof score | Individual professionals and coaches | `/tools/resume-analyzer` | Lead for B2C content and coach discovery. |
| Bridge-role transition pathway | Coaches, workforce boards, career services | `/tools/bridge-roles` | Lead after route/function proof. |
| Skill adjacency graph | Coaches, bootcamps, workforce agencies | `/tools/skill-adjacency` | Demo asset. |
| Utility workforce automation audit | Utility HR, L&D, workforce planners | `/enterprise-dashboard` | Pilot-only until CSV/report proof is complete. |
| Responsible AI and methods appendix | B2B, education, government, regulated sectors | `/validation`, `/responsible-ai` | Attach to serious B2B conversations. |

Outreach must stay manual and proof-tiered: one buyer lane, one proof pack, one route, one artifact, one caveat. Do not claim production pilots, guaranteed outcomes, Lightcast equivalence, O*NET-only forecast truth, or utility operational forecasting.

## Does This Site Have A USP?

**Yes, but only with tight positioning.** The USP is not "career dashboard" or "AI resume helper." The defensible wedge is:

> An automation-risk forecasting and transition-planning platform that combines O*NET occupational structure, task-level AI scoring, skill adjacency, bridge-role pathways, and white-label workforce reports.

### USPs To Augment

| USP | Why It Matters | How To Strengthen |
|---|---|---|
| APO forecasting with confidence intervals | Converts anxiety into a quantified exposure score. | Add visible provenance, freshness, calibration, and sample occupations with known-good outputs. |
| Skill adjacency graph | Shows non-obvious but realistic career pivots. | Add standalone skill/occupation picker, example paths, and demand/salary provenance. |
| Bridge role pathways | Solves the unrealistic-leap problem in career transitions. | Replace SOC-code-only UX with occupation search, missing-skill bundles, and learning-resource handoff. |
| Counselor reports | Clear B2B monetization path. | Convert HTML report into polished PDF flow, client folders, templates, and proof-ready sample reports. |
| Utilities/energy workforce audit | Strong vertical wedge for enterprise buyers. | Add utility role templates, team CSV import proof, grid-modernization skill taxonomy, and reskilling ROI output. |

### USPs That Can Degrade If Overclaimed

| Risk | Why It Hurts | Fix |
|---|---|---|
| Calling every routed feature `LIVE` | Routes can exist while data, auth, credits, or env secrets block real use. | Use `Source-implemented` or `Partially usable` until browser/API proof is captured. |
| Relying only on O*NET | O*NET is authoritative, but not enough for current demand, salary, and AI adoption signals. | Add BLS/OEWS, job postings, WEF/economic adoption, outcomes, and provenance labels. |
| Competing with ATS tools | Jobscan/Teal/Rezi already own tactical resume optimization. | Keep resume features tied to automation risk and career resilience, not keyword matching. |
| Pushing GPU forecasting too early | Current bottleneck is data quality, calibration, and usability. | Defer GPU until batch scale, embedding refresh, graph clustering, or model training justifies it. |

## Top 10 Sellable Features

| Rank | Feature | Buyer / Use Case | Current Status | Proof Source | Sellability 1-5 | Gap To Best-In-Class |
|---:|---|---|---|---|---:|---|
| 1 | APO automation potential forecasting and confidence intervals | Individuals, coaches, workforce planners, utilities HR | `Source-implemented` | `supabase/functions/calculate-apo/index.ts`; route usage via `SearchInterface`; `apo_logs` telemetry | 5 | Needs visible provenance, calibration results, freshness labels, and runtime proof for exemplar occupations. |
| 2 | Resume automation risk analyzer | B2C lead magnet, coaches, career-transition clients | `Source-implemented` / `Partially usable` | `/tools/resume-analyzer`; `src/components/ResumeAnalyzer.tsx`; `supabase/functions/analyze-resume/index.ts` | 5 | File parsing is simplified; needs robust PDF/DOCX parsing, redaction, deletion controls, and privacy copy. |
| 3 | Counselor / coach white-label report generator | Career counselors, coaches, workforce consultants | `Source-implemented` / `Partially usable` | `/tools/counselor-reports`; `CounselorReportGenerator`; `generate-counselor-report`; `white_label_configs` | 5 | Generates HTML/print flow, not polished server-side PDF; depends on auth, credits, and report-credit RPC. |
| 4 | Bridge role career transition pathways | Career pivot users, coaches, workforce agencies | `Source-implemented` / `Partially usable` | `/tools/bridge-roles`; `BridgeRolePathway`; `find-bridge-roles`; `bridge_role_paths` | 5 | SOC-code-only input is too technical; needs occupation search, examples, missing-skills, courses, and feasibility explainability. |
| 5 | Dynamic skill adjacency graph | Career pivot planning, coach strategy sessions | `Source-implemented` / `Partially usable` | `/tools/skill-adjacency`; `SkillAdjacencyGraph`; `calculate-skill-adjacency`; pgvector migration | 5 | Standalone route can render without usable inputs; needs occupation picker, cached examples, and demand/salary provenance. |
| 6 | Enterprise / utilities workforce risk dashboard | Utilities, energy companies, HR consultancies | `Partially usable` / demo-stub-backed | `/enterprise-dashboard`; `EnterpriseTeamDashboard`; `CSVEmployeeImporter`; `hris-sync`; `generate-executive-report`; `calculate-learning-roi` | 5 | Demo dashboard exists, but HRIS sync, executive report, CSV persistence, and learning ROI are stub/simulated. Needs utility templates, real import, department risk maps, ROI proof, and report smoke tests. |
| 7 | Task-level AI Impact Planner and learning paths | Individuals, bootcamps, counselors | `Source-implemented` / `Partially usable` | `/ai-impact-planner`; `assess-task`; `generate-learning-path`; `course-search`; `skill-recommendations`; `LearningPathPanel` | 4 | Broad feature surface exists, but needs tighter handoff from APO result to task plan, learning ROI, progress tracking, and evidence-backed recommendations. |
| 8 | Market intelligence layer | B2B audits, SEO, career planning | `Partially usable` | `market-intelligence`; `serpapi-jobs`; `bls-sync`; OEWS tables; `automation_economics` | 4 | SerpAPI and BLS paths exist, but local dev disables market intelligence by default and the function lets Gemini fill missing market context. Needs refresh cadence, source freshness, posting aggregation, salary normalization, and clear fallback states. |
| 9 | SEO / programmatic risk pages and sample reports | Organic acquisition, report lead-gen | `Source-implemented` / `Partially usable` | `/automation-risk/:occupation`; `/compare/:slugs`; `/automation-risk/industry/:industry`; `/sample-report`; `occupationRiskData` | 4 | Pages use static occupation-risk data and a lead-capture TODO. Needs proof that pages render unique content, capture leads, cross-link to paid workflows, and avoid thin SEO pages. |
| 10 | Responsible AI, validation, and evidence surfaces | B2B, education, government, regulated sectors | `Partially usable` | `/validation`; `/validation/methods`; `/validation/center`; `/responsible-ai`; `calibrate-ece`; `apo_logs` | 4 | Needs public-facing validation summaries, calibration snapshots, model cards, data sheets, and benchmark claims that match proof. |

## Broader Feature Inventory

These features can stay in the product, but should be subordinate to the top 10 selling story.

| Feature / Capability | Current Status | Commercial Role |
|---|---|---|
| Occupation search across O*NET roles | `Source-implemented` | Core entry point; needs strong search UX and data freshness copy. |
| Browse STEM, bright outlook, and job zones | `Source-implemented` / `Partially usable` | Useful exploration layer; not the main USP. |
| Compare occupations | `Source-implemented` | Good upsell and SEO support when tied to automation exposure. |
| Saved analyses and local/authenticated modes | `Source-implemented` / `Partially usable` | Retention feature; needs clear account value. |
| Sharing and exports | `Source-implemented` / `Partially usable` | Important for coaches and viral loops; needs polished proof. |
| AI career coach | `Source-implemented` / `Partially usable` | Support feature; should be data-grounded, not generic chat. |
| Workshops, bootcamp, pricing, Whop routes | `Source-implemented` / `Partially usable` | Monetization channels; should be secondary until core product proof is clean. |

## Best-In-Class Gap Analysis

| Comparator | What They Do Well | APO Strength Against Them | APO Gap To Close |
|---|---|---|---|
| O*NET / CareerOneStop | Authoritative occupational data, skills, wages, career exploration, public trust. | APO can synthesize O*NET data into automation forecasting and transition plans instead of raw profiles. | Must cite provenance clearly and avoid implying O*NET alone provides real-time AI-risk forecasts. |
| Will Robots Take My Job | Simple, viral automation-risk lookup and broad public awareness. | APO can go beyond one score by adding task-level drivers, transition routes, reports, and reskilling plans. | Needs faster public demo path and clean shareable score output. |
| Jobscan / Teal / Rezi | Strong resume/job-search monetization, clear pricing, tactical user workflows. | APO can own the upstream question: "Is this career resilient, and where should I move?" | Do not chase generic ATS matching; improve resume-risk parsing only where it supports automation defense. |
| Lightcast-style workforce intelligence | Current labor-market data, skills taxonomy, career pathways, enterprise trust. | APO can become a lower-cost, more focused "career automation defense" layer for individuals, coaches, and mid-market teams. | Needs stronger external feeds, data freshness, skill taxonomy depth, and enterprise-grade reporting proof. |
| Career coach / white-label tools | Client management, branded deliverables, coach workflow fit. | APO reports are differentiated if they include O*NET-backed automation risk, transition paths, and skill graphs. | Needs client folders, polished PDF, repeatable sample reports, and operational billing/credit proof. |

## Data Strategy: Beyond O*NET

O*NET should remain the backbone because it gives structured occupations, tasks, knowledge, skills, abilities, work context, technology skills, and SOC taxonomy. But best-in-class forecasting needs multiple signal families:

| Signal | Why Add It | Implementation Priority |
|---|---|---|
| BLS/OEWS employment and wage trends | Adds labor-market trend and compensation grounding. | Critical |
| Job postings via SerpAPI or similar feeds | Adds current demand, geography, salary mentions, and emerging skills. | Critical |
| WEF / economic adoption signals | Adds macro adoption context and sector friction. | Medium |
| User outcomes and follow-up surveys | Enables real calibration and proof of recommendations. | Medium |
| Lightcast / ESCO / NLx-style skills data | Adds richer skills taxonomy and current skill demand. | Medium, paid/partnership dependent |
| Internal usage telemetry | Shows which searches, roles, and reports drive conversion. | Critical |

## Utilities / Energy Vertical Assessment

Utilities and energy should be treated as a high-value workforce planning vertical, not as a separate energy-load forecasting product inside this repo.

| Needed Capability | Current Fit | Priority | Notes |
|---|---|---:|---|
| Utility workforce automation audit | Partial fit | 5 | Use enterprise dashboard, CSV/HRIS import, APO scores, and department rollups. |
| Grid-modernization skill gap mapping | Partial fit | 5 | Add utility-specific role templates and skill categories: grid ops, field tech, GIS, SCADA, cybersecurity, DER, regulatory reporting. |
| Reskilling ROI calculator | Partial fit | 5 | Existing `calculate-learning-roi` can be verticalized with utility cost assumptions. |
| Compliance and safety friction adjustment | Partial fit | 4 | Extend APO economics to handle regulated operations, safety-critical tasks, union constraints, and auditability. |
| Executive utility report | Partial fit | 4 | White-label counselor report pattern can evolve into department-level executive reports. |
| Energy demand/load forecasting | Out of scope for now | 1 | Valuable in another product, but it dilutes this site's career/workforce automation wedge. |

## GPU Forecasting Assessment

**Recommendation: do not implement GPU-based forecasting in v1.**

GPU work is not the current bottleneck. The immediate gaps are route usability, data provenance, calibration, external signal quality, and repeatable proof. GPU becomes worthwhile only after one of these conditions is met:

| Condition | Example Use | Priority Now |
|---|---|---:|
| High-volume offline training | Train a custom task automation model from outcomes and labeled examples. | 1 |
| Large embedding refresh | Recompute skill/occupation embeddings across richer taxonomies. | 2 |
| Graph clustering at scale | Run community detection and career-neighborhood discovery across thousands of nodes. | 2 |
| Bulk enterprise simulations | Run many workforce scenarios for large clients. | 2 |

For now, invest in data quality, traceability, cached examples, and productized reports before GPU infrastructure.

## Critical Roadmap

Scores: impact on commercial value, implementation urgency, and utilities/workforce relevance. 5 is highest.

| Priority | Feature / Fix | Commercial Impact | Urgency | Utilities / Workforce Relevance | Implementation Notes |
|---|---|---:|---:|---:|---|
| Critical | Runtime proof for all top 10 routes and Edge Functions | 5 | 5 | 5 | Add smoke checklist before any feature is labeled `LIVE`. Build now passes; remaining proof is browser interaction, seeded data, auth/credit states, and Edge Function responses. |
| Critical | Standalone usability for skill adjacency and bridge roles | 5 | 5 | 5 | Replace SOC/skill-id-only flows with search, examples, default demo occupations, and clear empty states. |
| Critical | Utilities workforce audit package | 5 | 5 | 5 | Replace demo/stub paths with real CSV persistence, utility role templates, department heatmap, skill gaps, ROI output, and executive report sample. |
| Critical | Data provenance and freshness labels | 5 | 5 | 5 | Label O*NET, BLS/OEWS, SerpAPI, WEF/economic, and AI-generated claims separately. |
| Critical | White-label report hardening | 5 | 4 | 5 | Add polished PDF output, sample report route, counselor branding proof, client folders, and credit-flow verification. |
| Critical | Resume privacy and parsing hardening | 5 | 4 | 4 | Add robust PDF/DOCX parsing, text extraction warnings, deletion controls, redaction, and retention policy. |

## Medium Roadmap

| Priority | Feature / Fix | Commercial Impact | Urgency | Utilities / Workforce Relevance | Implementation Notes |
|---|---|---:|---:|---:|---|
| Medium | Programmatic SEO downloads and comparison pages | 4 | 4 | 3 | Add PDF/email capture and comparison pages tied to top occupations and industries. |
| Medium | Calibration and evaluation snapshots | 4 | 4 | 5 | Surface ECE/calibration outputs and benchmark examples for buyer trust. |
| Medium | Market intelligence refresh pipeline | 4 | 3 | 5 | Add refresh dates, job-posting counts, salary normalization, and fallback labels. |
| Medium | Learning path and ROI handoff | 4 | 3 | 5 | Connect APO drivers to learning path priorities, time cost, expected risk reduction, and role transition path. |
| Medium | Coach client management | 4 | 3 | 3 | Add client folders, report history, resend/share, and practitioner dashboard. |
| Medium | Shareable AI-proof score card | 4 | 3 | 2 | Useful for B2C lead gen if tied to resume analyzer and signup. |

## Low Roadmap

| Priority | Feature / Fix | Commercial Impact | Urgency | Utilities / Workforce Relevance | Implementation Notes |
|---|---|---:|---:|---:|---|
| Low | GPU forecasting | 2 | 1 | 2 | Defer until scale or custom training justifies it. |
| Low | Generic ATS optimizer | 2 | 1 | 1 | Crowded market; only build if it reinforces automation-risk narrative. |
| Low | Cover-letter generator | 1 | 1 | 1 | Commodity feature available everywhere. |
| Low | Interview prep | 2 | 1 | 1 | Adjacent but dilutes the automation-defense wedge. |
| Low | Broad job board / auto-apply | 2 | 1 | 1 | Distracts from forecasting, transition planning, and B2B reporting. |
| Low | Practitioner marketplace | 2 | 1 | 2 | Wait until coach reports and client management prove retention. |

## Do Not Prioritize

Do not spend near-term product effort on:

- Generic ATS keyword matching.
- Cover-letter generation.
- Broad job board or auto-apply workflows.
- Interview simulation.
- Practitioner marketplace.
- GPU forecasting as a v1 headline.
- Any feature that adds breadth without improving the core automation-risk forecast, transition plan, or sellable report.

## Implementation Status Detail

| Area | Evidence | Status |
|---|---|---|
| Routes | `src/App.tsx` contains routes for dashboard, planner, enterprise, tools, SEO pages, validation, responsible AI, pricing, workshops, Whop. | `Source-implemented` |
| APO scoring | `calculate-apo` includes Gemini JSON validation, deterministic item/category scoring, DB-configurable weights, BLS/economic adjustments, Monte Carlo confidence intervals, and telemetry. | `Source-implemented` |
| Monetization tools | Skill adjacency, bridge roles, resume analyzer, and counselor reports are routed and backed by Edge Functions. | `Source-implemented` / `Partially usable` |
| External data | O*NET, BLS/OEWS, SerpAPI, and automation economics appear in active code/data paths. | `Partially usable` |
| Enterprise workforce | Enterprise route exists and demo data renders; `hris-sync`, `generate-executive-report`, `calculate-learning-roi`, and CSV import persistence are stub/simulated. | `Partially usable` |
| Validation/trust | Validation routes and calibration function exist; public proof summaries need hardening. | `Partially usable` |

## Research Sources

- WEF Future of Jobs 2025: https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/
- O*NET overview: https://www.onetcenter.org/overview.html
- O*NET database/content model: https://www.onetcenter.org/content.html/database.html
- Lightcast Skills Taxonomy: https://lightcast.io/open-skills
- CareerOneStop career tools: https://www.careeronestop.org/ExploreCareers/explore-careers.aspx
- Will Robots Take My Job: https://willrobotstakemyjob.com/
- Jobscan Coach: https://www.jobscan.co/coach/

## Final Recommendation

The APO Dashboard should be marketed as a focused career automation defense and workforce transition intelligence platform. The most sellable product line is:

1. Individual automation-risk forecast.
2. Resume automation-risk analyzer.
3. Bridge-role and skill-adjacency transition plan.
4. White-label counselor report.
5. Enterprise utilities/workforce audit.

Everything else should either support that journey or be deprioritized.
