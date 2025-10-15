The 20% to build now: public outcomes KPIs, APO explainability/calibration, validation/ablation report, soft-skills/tech-skills discovery, Bright Outlook/STEM tags, crosswalks (veterans/OOH/ESCO), demo sandbox, signals-to-outcomes linkage, WCAG/perf badges, security/model cards.

20–80: What to implement first to maximize award odds

Focusing on ET AI Awards scoring (Technical Innovation, Market Impact, Scalability, Data-Driven Evaluation; and Jury criteria: Strategic Relevance, Business Model Viability, Future Potential), these items deliver outsized impact relative to effort and directly support your mission: clearly classify automation potential and skill sets under Generative AI and automation risk, then share those insights with educators, researchers, and students.

The essential 10 that drive ~80% of outcome
 • Public outcomes KPIs with case-study ROI and cohort trends: converts product into evidence and strengthens Market Impact + Data-Driven Evaluation.
 • APO explainability and calibration: per-factor contributions (Tasks/Technologies/Skills/Abilities/Knowledge), confidence bands, reliability diagrams (ECE): lifts Technical Innovation + Excellence.
 • Validation and ablation report: deterministic vs. LLM vs. hybrid; sensitivity to weights/prompts; costs/latency/variance: proves originality and rigor.
 • Soft-skills and tech-skills discovery: interactive builder and tech search linking to occupations and GenAI augmentation risk: amplifies Business Intelligence & Analytics impact.
 • Bright Outlook and STEM tagging: immediate discoverability value for students/educators; aligns to O*NET critical browsing features.
 • Crosswalk enhancements and veterans flow: OOH/ESCO mappings; branch-specific MOC entry with civilian translation; widens social impact and scale.
 • Demo sandbox (judge-friendly): 3 exemplar SOCs, guided tour, one-click exports; reproducible evidence in minutes.
 • Signals-to-outcomes linkage: APO trends vs. postings/salaries (lag correlations/Granger proxies with disclaimers), plus learning-path outcomes: ties insights to business value without overclaiming causality.
 • Accessibility/performance badges with perf budget: WCAG AA progress, Lighthouse scores, p95/p99 latency: de-risks scale and UX.
 • Security + Responsible AI transparency: model cards, data sheets, threat model, RLS proofs, pen-test summary: satisfies Responsible AI & governance expectations.

Priority gap analysis table (start-now subset)

Feature (priority)

Current

Gap vs O*NET/awards

Scope of work

Implementation steps

Effort

Risks

Deliverables

Public Outcomes KPIs + ROI

KPIs exist; case studies referenced.

Not public/time-bounded; lacks baselines/cohorts.

Metrics, trends, cohorts, ROI deltas.

Build read-only /outcomes with 30/90-day board; cohort filters (HR/academic/student); CSV export; add before/after ROI in case studies.

S

Data hygiene; privacy redaction.

Outcomes board; 2 one-pagers with 3 KPIs each.

APO Explainability & Calibration

Confidence histograms; anomaly flags.

No per-factor contributions or calibration quality.

Factor breakdown, CI bands, ECE charts.

Compute normalized contributions per dimension; render CI bands per occupation; add reliability diagrams and ECE per cohort.

M

Calibration metrics accuracy.

APO detail view; Validation: Reliability panel.

Validation & Ablations

Hybrid approach described.

Formal benchmarking/ablations missing.

Baselines vs. hybrid; sensitivity.

Run deterministic-only vs Gemini-only vs hybrid across 200+ occupations; record accuracy/latency/cost/variance; weight/prompt ablations; 6-page write-up + charts.

M

Repeatability; compute cost.

/validation “Method & Ablations” report.

Soft-Skills Builder

Skill gap analysis present.

Interactive soft-skills profiling absent.

Survey + mapping to occupations.

Implement short soft-skills profiler (O*NET soft skills); match to occupations and show GenAI augmentation vs human-only tasks; export/share.

M

Survey quality.

/skills “Build your profile” flow.

Technology Skills Search

Hot technologies function exists.

No tech-to-occupation search with heat index.

Tech keyword search + mapping.

Index O*NET tech skills + SerpAPI counts; compute normalized “heat” per tech; link to learning paths and APO impacts.

M

Noise in postings.

/tech “Find occupations by software” page.

Bright Outlook & STEM Tags

Career clusters/job zones supported.

Bright Outlook/STEM filters absent.

Tags/filters and browse flows.

Ingest flags; add filter chips; show “Rapid Growth/Many Openings/New/Emerging” and STEM subgroups; highlight student/educator use.

S

Data sync freshness.

Bright Outlook & STEM browse pages.

Crosswalks: OOH, ESCO + Veterans UX

SOC/CIP/MOC implemented.

OOH/DOT/RAPIDS/ESCO missing; veterans UX minimal.

Datasets + flows.

Import OOH/ESCO mappings; normalize codes; build veterans entry (branch selector + MOC code → civilian roles) with guidance; downloadable packs for educators.

L

Data alignment; licensing notes.

/crosswalks suite; Veterans flow.

Demo Sandbox

Live demo route exists.

Needs judge-friendly, reproducible tour.

Preloaded exemplars + guided tour.

Create /demo with 3 SOCs (e.g., RN, Financial Analyst, Software Dev); tour: search → APO → task categorization → learning path/ROI → market snapshot; one-click PDF export/sharing.

S

Over-simplification.

Demo sandbox + PDFs.

Signals ↔ Outcomes Linkage

Market intelligence present.

No causal proxies or clarity.

Lagged correlations; disclaimers.

Compute correlations/Granger-esque tests between APO shifts and postings/salaries; annotate non-causality; show learning-path outcome links.

M

Misinterpretation risk.

/outcomes “Signals & Outcomes” panel.

Accessibility & Performance

WCAG “in progress”; Lighthouse strong.

Needs visible badges/perf budgets.

AA checklist + perf budgets.

Publish Lighthouse badges (mobile/desktop), AA checklist status, keyboard map; show perf budget (bundle size, p95/p99 latency); lazy-load heavy charts.

S

Audit time.

/quality with badges + budgets.

Security & Responsible AI

RLS/CSP; audit snapshot.

Formal artifacts not public.

Model cards, data sheets, threat model.

Publish model cards (APO/Task Assessment); data sheets (O*NET enrichments/telemetry); threat model, RLS policy proofs, pen-test summary, governance overrides metrics.

M

Disclosure balance.

/responsible-ai portal.



Effort scale: S ≤ 1 week, M 2–3 weeks, L 4–6 weeks.

Step-by-step implementation plan (4–6 weeks)
 • Week 1: Public /outcomes board, Demo sandbox, Bright Outlook/STEM tags, Accessibility/perf badges.
 • Week 2: APO explainability (factor contributions + CI bands), Reliability/ECE charts, Soft-skills builder v1.
 • Week 3: Tech-skills search with heat index, Signals↔Outcomes linkage panel, Case-study PDFs finalized.
 • Week 4–5: Validation & Ablations report (200+ occupations; baselines; sensitivity), Responsible AI portal (model cards/data sheets/threat model/RLS proofs).
 • Week 6: Crosswalks expansion (OOH/ESCO) + Veterans UX; publish educator packs and API docs for researchers.

Why these choices maximize award probability
 • They directly map to the evaluation matrix and jury criteria while showcasing your core innovation: clear automation potential and skill classification under GenAI vs. human work, grounded in O*NET. Bright Outlook/STEM and crosswalks make the platform immediately valuable to educators and researchers. Public outcomes and rigorous validation turn claims into evidence, which juries reward. Accessibility/security/model cards demonstrate maturity and responsibility at startup scale.

Mission alignment: clarity for educators, researchers, students
 • Factor-level explainability, soft/tech-skills discovery, and crosswalks create transparent pathways from current roles to future-proof skills, with APO risk and GenAI augmentation clearly labeled. The sandbox and public KPIs make findings easy to share and trust, accelerating academic use and workforce planning.

Targeted gap details to start with (missing O*NET features most relevant to your mission)
 • Bright Outlook browse and STEM filters: implement flags and filters; add educator-focused views showing top occupations by student interest.
 • Soft-skills and tech-skills discovery: build dimension-first discovery pages (Soft Skills; Technology Skills) tied to APO task categories (Automate/Augment/Human-only).
 • Browse by O*NET data dimensions: Abilities/Knowledge/Work Activities—add filters by importance level and link to APO changes when those dimensions shift.
 • Crosswalks and veterans flow: complete OOH/ESCO; design veterans landing with branch-specific code entry; provide civilian translation guidance and learning recommendations.
 • Professional Associations: minimally link top associations per occupation to support student networks; lightweight ingest for initial value.

These are sufficient to demonstrate parity and purposeful enhancement without boiling the ocean.

## Phase‑2 O*NET Alignment Gap Analysis (H/M/L) — Tracker

- **[HIGH] Bright Outlook browse + category filters**
  - Current: `supabase/functions/onet-enrichment/` persists `bright_outlook` and `bright_outlook_category`; search supports `brightOutlook`.
  - Gap: Category-level filtering not exposed end-to-end.
  - Action: Added UI select and backend filter for `brightOutlookCategory`.
  - Deliverables: Frontend route `src/pages/BrowseBrightOutlook.tsx`, router `/browse/bright-outlook`; backend accepts category filter.
  - Tests: Keyword+filter returns >0 results; category chips reflect server values.

- **[HIGH] STEM browse (official list vs heuristic)**
  - Current: `onet-enrichment` sets `is_stem` via title keywords; Advanced Search filter exists; page added at `/browse/stem`.
  - Gap: Must align with O*NET STEM list (Reference: Browse STEM occupations) instead of heuristics.
  - Action: Implement membership from O*NET STEM browse (persist a join table `onet_stem_membership` or resolve per enrichment call) and replace heuristic in `checkStem()`.
  - Deliverables: Deterministic `is_stem` based on O*NET; migration + enrichment update; reindex job counts.
  - Risk: Endpoint shape/paging; mitigate by periodic sync + cache.

- **[HIGH] Crosswalks: OOH + Veterans UX**
  - Current: Edge function `/crosswalk` proxies generic `online/crosswalk` with `codes=...`; UI `CrosswalkWizard` exists.
  - Gap: Dedicated OOH service (`online/crosswalks/ooh`) and branch-specific veterans entry flow (MOC) with guidance not implemented.
  - Action: Extend `/crosswalk` to map `from=OOH` to OOH endpoint; add veterans flow UI (branch select + MOC input) that calls `/crosswalk?from=MOC` and renders civilian SOC matches + learning guidance.
  - Deliverables: Function enhancement + `/veterans` page.
  - Risk: Data alignment/licensing; add notes in UI.

- **[MEDIUM] Tech‑skills discovery (heat index)**
  - Current: `hot-technologies` function + technology cache; no dedicated discovery page.
  - Gap: No tech→occupation search with “heat”.
  - Action: Create `/tech` page: keyword tech search, list related occupations with normalized heat (SerpAPI counts + O*NET linkage), link to learning paths.
  - Deliverables: Frontend page + minor function extension for counts.

- **[MEDIUM] Work‑dimension browse (Abilities/Knowledge/Activities)**
  - Current: `fetch-work-context` stores tasks/activities/technologies; no dimension-first browse.
  - Gap: Browse and filter by importance/level with links to APO.
  - Action: Add dimension browse panels; reuse cached tables; facet by `im_value/level_value`.

- **[MEDIUM] Demo sandbox**
  - Current: Live demo route exists but not judge‑guided.
  - Gap: Guided tour + preloaded exemplars + export.
  - Action: `/demo` tour covering search → APO → tasks → learning path/ROI; one‑click PDF.

- **[LOW] Bright Outlook/STEM badges polish**
  - Current: `BrightOutlookBadge` and `EmploymentOutlookCard` present.
  - Gap: Minor UI polish and accessibility labels; add STEM job family chip.
  - Action: Small UI tweaks; audit aria‑labels.

- **[LOW] Proxy consolidation**
  - Current: Both Netlify `netlify/functions/onet-proxy.ts` and Supabase `supabase/functions/onet-proxy` exist; frontend `useOnet()` points to Netlify path.
  - Gap: Two proxies maintained.
  - Action: Decide single proxy, update `getFunctionsBaseUrl()` usage and docs.

### Status and links

- **✅ COMPLETED - HIGH Priority:**
  - `/browse/bright-outlook` and `/browse/stem` pages with auto-search
  - Advanced Search: Bright Outlook category filter (UI + backend)
  - STEM membership migration + sync function (`supabase/migrations/20251015120000_create_stem_membership.sql`)
  - Official O*NET STEM list integration replacing heuristics in `onet-enrichment`
  - OOH crosswalk endpoint support in `/crosswalk` function
  - `/veterans` page with branch/MOC input and civilian translation
  - Supabase proxy consolidation (removed Netlify dependency)

- **✅ COMPLETED - MEDIUM Priority:**
  - `/tech-skills` page with heat index and occupation discovery
  - `/work-dimensions` page for Abilities/Knowledge/Activities browse
  - `/demo` sandbox with guided 5-step tour and export functionality

- **Routes Added:**
  - `/browse/bright-outlook` - Bright Outlook careers
  - `/browse/stem` - Official STEM occupations
  - `/veterans` - Military to civilian career transition
  - `/tech-skills` - Technology skills discovery with heat index
  - `/work-dimensions` - Browse by abilities, knowledge, activities
  - `/demo` - Interactive guided tour sandbox

### Acceptance checks (smoke)

- Bright Outlook page loads and paginates; category filter narrows results.
- STEM page lists only O*NET STEM occupations once mapping shipped.
- Crosswalk accepts `from=OOH` and returns valid SOC results; MOC flow shows civilian matches.