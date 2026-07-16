# Fable5 Audit Prompts for Career Automation Insights Engine

## Plan Overview

**Goal:** Two comprehensive prompts that, when run sequentially through the fable5-prompt and fable5-with-outreach skills, will produce a complete 360-degree audit + improvement plan for this repository.

**Repository:** career-automation-insights-engine — Vite/React/TypeScript/Supabase/Stripe/Whop/Gemini application for career automation-exposure research and coaching workflows. 45+ Supabase Edge Functions, 47 pages, 80+ components, 3 payment providers, $0 revenue, 0 outreach touches, 0 buyer validation.

**Stage 1 (Prompt 1):** Full 19-dimension codebase audit via `/fable5-prompt` — Phases 0-4 + Top 5 Summary Gate + Implementation Loop + Stage 2 handoff packet.

**Stage 2 (Prompt 2):** Full M0-M9 marketing/outreach/presales audit via `/fable5-with-outreach` — Stage 2A (M0-M4 verification + presales) + Stage 2B (M5-M8 outreach/GTM) + Top 5 Gates + Implementation Loops.

**Mode:** Comprehensive audit + full plan (audit-only with handoff, no implementation in this run).

---

## PROMPT 1 — Stage 1: Full 19-Dimension Codebase Audit

**Skill:** `/fable5-prompt`
**Runtime mode:** `readonly_audit` (analysis only, no code changes)
**Effort level:** `xhigh` for security, architecture, performance, market alignment; `high` for all others
**Deliverable:** `docs/audits/audit-{YYYY-MM-DD}-stage1.md`

### Copy-Paste Prompt:

```
You are running the fable5-prompt skill to perform a full 360-degree codebase audit on the Career Automation Insights Engine repository. This is a readonly_audit — analysis only, no code changes. The deliverable is a single audit report file at docs/audits/audit-{YYYY-MM-DD}-stage1.md.

## CONTEXT

### Repository Identity
- **Name:** Career Automation Insights Engine (APO Dashboard)
- **Path:** /Users/sanjayb/Library/Mobile Documents/com~apple~CloudDocs/Documents/newrepo/career-automation-insights-engine
- **Stack:** Vite 5.4, React 18.3, TypeScript 5.5, Supabase (Postgres + Edge Functions + pgvector), Stripe, Whop, Google Gemini, Tailwind CSS 3.4, shadcn/ui, Framer Motion, Recharts, Three.js
- **Deployment:** Netlify (SPA with prerendering plugin for SEO routes)
- **Description:** Decision-support APO dashboard for career automation exposure, proof-pack review, CI regression gates, and source-labeled workforce data pipelines.
- **License:** MIT
- **Maturity:** Production-built but $0 revenue. 45+ Supabase Edge Functions, 47 pages, 80+ components, 19,000+ O*NET tasks seeded, 109 pre-enriched occupations, pgvector skill embeddings.

### Prior STATE.md Facts (verified from previous sessions — do NOT re-derive)
1. **APO Calculation:** calculate-apo Edge Function uses O*NET data grounding (fetchOnetContext queries onet_detailed_tasks/knowledge/abilities/technologies), 24h result caching via apo_logs, weighted formula (tasks=0.35, tech=0.25, skills=0.20, abilities=0.15, knowledge=0.05), confidence-scaled Monte Carlo CI (high=2%, medium=5%, low=10%), per-item timelines (immediate|short_term|medium_term|long_term).
2. **UI/UX Redesign:** "Warm Authority" teal/amber palette (#2DD4A8 primary, #E5A54B amber). Sparkles icon removed from ~18 files. Purple colors removed from ~37 files. Dark theme with CSS vars. Bento grids on homepage, dashboard, APO results, skills builder. Score counter animation (useCountUp). Predictive CTA highlighting. Time-of-day greeting. ARIA tab patterns. PWA icon.svg. Mobile menu slide animation.
3. **Homepage Redesign:** Search-first hero with occupation/skills input, quick filter chips (Bright Outlook, STEM, Tech Skills, Job Zones), primary CTA to Career Impact Planner, secondary CTA to Browse. Evidence dropdown in top nav. Renamed labels: Automation Potential Oracle→Automation Insights, Outcomes→Market Signals, AI Impact Planner→Career Impact Planner.
4. **Security Fixes:** Supabase credentials moved to env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Centralized LLM prompts in supabase/lib/prompts.ts (7 system prompts). Centralized Zod schemas in supabase/lib/promptSchemas.ts. LLM telemetry in supabase/lib/llmTelemetry.ts. DOMPurify added to CounselorReportGenerator. postMessage wildcard→whop.com. Auth error sanitization. Whop OAuth moved server-side. 'unsafe-eval' removed from CSP.
5. **SEO:** Sitemap.xml (64 URLs), robots.txt, Netlify prerendering config. /automation-risk/:occupation dynamic SEO pages exist but are client-rendered React (prerendering plugin added but verify effectiveness).
6. **Stripe:** create-checkout-session Edge Function created. stripe.ts updated to call Supabase Edge Function. stripe-webhook tier mapping fixed (defender/coach). Real Defender and Coach Pro price IDs exist. Bootcamp checkout hidden (no runtime placeholder price ID).
7. **Heatmap:** PBI-0009 started — occupation_market_facts, occupation_exposure_snapshot, occupation_heatmap_cells migrations. market-heatmap Edge Function. MarketMapPage.tsx. Route /market-map wired.
8. **tsconfig.json:** strictNullChecks: false, noImplicitAny: false, noUnusedParameters: false, noUnusedLocals: false, skipLibCheck: true, allowJs: true. NO "strict: true" — this is a deliberate choice but a significant type-safety gap.
9. **No test runner:** package.json has NO "test" script. No vitest, jest, or pytest in dependencies. @playwright/test is installed for e2e but no unit test framework. 100+ npm scripts for verification/commercial checks but zero unit test coverage.
10. **3 Payment Providers:** Stripe (subscriptions: Free/$29/$149), Whop (marketplace embedded app), Bootcamp (workshop pricing $10K-$85K, hidden checkout). All wired but $0 live revenue.
11. **GTM Research:** Deep research completed (docs/archive/phase-a-status-sprawl-20260531/docs-claims-additional/DEEP_RESEARCH_GTM_STRATEGY.md). Top 5 revenue opportunities identified: (1) Career coach white-label reports, (2) SEO-driven B2C organic, (3) Resume analyzer viral tool, (4) Veterans transition services, (5) Enterprise workforce audit. Competitive landscape mapped (WillRobotsTakeMyJob, TripleTen, Eightfold, BetterUp, LinkedIn Learning). No direct competitor exists at this price point with this depth.

### Codebase-Specific Audit Priorities (focus extra depth here)
1. **Test Instability / Zero Coverage:** No unit test framework installed. No "test" script in package.json. 45+ Edge Functions with Zod validation but no automated test coverage. Playwright e2e exists but only for phase-c-smoke. This is the #1 risk for a production app handling payments and AI-generated career advice.
2. **Large Files / Complexity Hotspots:** CommercialLeadOpsPage.tsx (90KB), ProofPackGalleryPage.tsx (84KB), EnterpriseTeamDashboard.tsx (54KB), ForCoachesPage.tsx (27KB), WorkshopBookingPage.tsx (23KB), AutomationRiskLandingPage.tsx (20KB), BootcampDashboardPage.tsx (19KB), OccupationDetailPage.tsx (19KB), ResponsibleAIPage.tsx (18KB), OutcomesPage.tsx (18KB), TechSkillsPage.tsx (17KB), PricingPage.tsx (17KB). These are gravity wells that need deep review.
3. **strict:false in tsconfig:** strictNullChecks: false and noImplicitAny: false are active. This means null/undefined bugs and implicit any types are silently allowed across the entire codebase. Assess the blast radius — how many runtime bugs could this mask?
4. **Bundle Size:** Dependencies include recharts (heavy), three.js (heavy), framer-motion (moderate), react-force-graph-2d (heavy), @react-pdf/renderer (heavy). 47 lazy-loaded routes help, but the initial bundle and heavy-route chunks need analysis. No bundle analyzer configured.
5. **Security Surface Area:** 45+ Edge Functions exposed via Supabase. Gemini API keys in server-side functions. Stripe webhook signature verification. Whop OAuth token exchange. DOMPurify on counselor reports. CSP headers in netlify.toml. Auth via Supabase. Rate limiting on APO. Assess OWASP Top 10 against this surface.
6. **CI/CD Gaps:** No visible CI config (.github/workflows not checked). 100+ npm scripts for verification exist but no automated CI pipeline. No pre-commit hooks visible. No automated lint/type-check on PR. Deployment is Netlify auto-deploy from git.
7. **Positioning Paradox:** The README explicitly says "decision-support tool" that "does not predict job loss" — yet the homepage hero says "Stay Indispensable in the AI Era" and the product calculates "automation risk." This creates a positioning tension between responsible-AI disclaimers and marketable fear-based messaging. Audit this across all customer-facing copy.

### Provider-Agnostic Model Routing
Use the 4-tier model routing from the fable5-prompt skill. Map to YOUR provider's models:
- **Orchestrator-tier:** Phase 0 calibration, Phase 1 scoping, Phase 3 synthesis, Top 5 Summary Gate, report writing. (Anthropic: Fable 5 / Opus 4.8 | OpenAI: GPT-5.5 high | Google: Gemini 3.5 Flash)
- **Heavy-tier:** Security threat modeling (Dimension 5), Architecture analysis (Dimension 3), Performance deep dive (Dimension 7). Fallback when classifiers block. (Anthropic: Opus 4.8 | OpenAI: GPT-5.5 | Google: Gemini 3.5 Flash)
- **Worker-tier:** Per-dimension code reading, lint/type-check execution, file inventory, test execution, dependency audit. Fan out 19 parallel workers. (Anthropic: Sonnet 4.6 | OpenAI: GPT-5.4 | Google: Gemini 2.5 Flash)
- **Grader-tier:** Adversarial verifier, finding triage, existence checks, false positive refutation. (Anthropic: Haiku 4.5 | OpenAI: GPT-5.4 mini | Google: Gemini 2.5 Flash-Lite)

Effort levels: xhigh for SEC, ARCH, PERF, MKT; high for all others; medium for DOCS, STYLE.

### Efficient-Fable Delegation Guidance (for Implementation Loop)
When the audit reaches Implementation Loop (Phase 4X), load the efficient-fable pattern:
- **Fable (Orchestrator) owns:** Gap prioritization, implementation ordering, risk assessment, integration review, final synthesis
- **Worker-tier agents do:** Bounded code edits (one gap per agent), test scaffolding, config changes
- **Grader-tier agents do:** Run test commands, verify regressions, check build passes
- **Heavy-tier fallback:** Complex security fixes, architecture refactors that Workers can't handle
- Each Implementation Loop agent gets: repo path, gap description, files in scope, acceptance criteria as runnable check, test command, rollback procedure

## REQUEST

Execute the full fable5-prompt audit with all 11 steps:

### Phase 0 — Calibration
1. Read ALL config files: package.json, tsconfig.json, tsconfig.app.json, tsconfig.node.json, vite.config.ts, tailwind.config.ts, eslint.config.js, netlify.toml, postcss.config.js, index.html, manifest.json, README.md, CONTRIBUTING.md (if exists), CLAUDE.md (if exists)
2. Read all docs in docs/ directory (at minimum: README.md, DIAGNOSTIC_REPORT.md, ROOT_CAUSE_ANALYSIS.md, Value_proposition.md, Top20_Features.md, UI_design.md, LLM.md, QUICK_START_GUIDE.md, RUNBOOK_ENV_SETUP.md, PHASE_EXTERNAL_INTEGRATION_PLAN.md)
3. Note: language versions, framework versions, disabled lint rules, documented patterns, intentional deviations
4. Deep research: Search internet for latest best practices for Vite 5.4 + React 18.3 + TypeScript 5.5 + Supabase + Stripe stack. Verify project's choices are current.
5. Output: Calibration Baseline (5-10 bullets) — this is what you audit AGAINST
6. Exit criteria checklist (all items must be Y to proceed)

### Phase 0.5 — Tooling Discovery
1. Run: npm install (verify lockfile health)
2. Run: npx tsc --noEmit (record type errors — expect issues due to strict:false)
3. Run: npm run lint (record eslint output)
4. Run: npm run build (verify production build succeeds)
5. Run: npm audit (record CVEs)
6. Check for test runner: verify NO vitest/jest exists (this is a finding)
7. Check for CI: look for .github/workflows/, .gitlab-ci.yml, etc.
8. Check for bundle analyzer: look for vite-bundle-visualizer or similar
9. Record tool-truth matrix: EXPOSED / INSTALLED / USABLE / UNAVAILABLE
10. Exit criteria checklist

### Phase 1 — Quantitative Discovery & Feature Analysis
1. **Repo map:** Purpose, stack, entry points (main.tsx, App.tsx), data flows, conventions
2. **Top 15 largest files:** LOC count, identify gravity wells
3. **Gravity Wells:** LOC × git churn (commits per file). Use git log --oneline --stat
4. **Test coverage mapping:** Since no test runner exists, map which critical paths have ZERO tests. List orphaned test files.
5. **Lint/type baseline:** Record error counts from tsc and eslint
6. **Top 15 Key Features (A/B/C):** Read docs/Top20_Features.md, cross-reference with actual code. Categorize: A=revenue-generating, B=user-facing value, C=infrastructure
7. **Market Segment Identification:** Read README.md, docs/Value_proposition.md, PricingPage.tsx, ForCoachesPage.tsx. Identify segments: (1) Individual professionals, (2) Career coaches/resume writers, (3) Enterprise HR, (4) Veterans transition orgs, (5) University career services, (6) Outplacement firms. Full ICP per segment.
8. **Feature-to-Segment Suitability Matrix:** Cross-reference features with segments
9. **Buyer Journey Mapping:** Map touchpoints for each segment × 6 stages (Awareness→Research→Evaluation→Pilot→Purchase→Onboarding→Expansion). Cross-reference with App.tsx routes.
10. **Scope Gate:** Present calibration baseline, gravity wells, top 15 features, market segments, proposed Phase 2 scope. Wait for user confirmation if repo >500 source files.
11. Exit criteria checklist

### Phase 2 — Audit (19 dimensions, parallel subagents, adversarially verified)
Fan out one subagent per dimension. Each finding must have: ID, What, Where (file:line), Why it matters, Severity, Confidence, Fact/Judgment, Market Segment Impact.

**The 19 dimensions (all [DEEP] unless justified [SHALLOW]):**

1. **Business/Product:** Goals, success metrics, stakeholder alignment. Check: Is there a product roadmap? KPIs? North star metric? The README says "decision-support tool" — is this consistent with the product's actual ambition?
2. **User/Customer:** Personas, journeys, accessibility, localization, device diversity. Check: 47 pages serve who? Is the ICP clear? Mobile responsiveness?
3. **Architecture & Layering:** Code structure, data flows, coupling, circular deps, boundaries. Check: 45+ Edge Functions — are they well-organized? Is there a lib/ layer? Are concerns separated? CommercialLeadOpsPage.tsx at 90KB — is this a god component?
4. **Code Quality:** Duplication, dead code, complexity hotspots, swallowed errors, type-safety. Check: strictNullChecks:false blast radius. noImplicitAny:false impact. Are there try/catch blocks that swallow errors silently?
5. **Security:** Construct threat model (assets: user data, Stripe payments, Gemini API keys, O*NET data; attack surfaces: 45+ Edge Functions, auth, Stripe webhooks, Whop OAuth; trust boundaries: client/server; threat actors). Audit OWASP Top 10 with file:line evidence. Check: RLS policies on Supabase tables. API key exposure. Rate limiting coverage.
6. **Testing:** Gaps around core logic, tests that assert nothing, coverage on critical paths. THIS IS CRITICAL: No unit test framework exists. 45+ Edge Functions with zero unit tests. calculate-apo (925 LOC) has no tests. stripe-webhook has no tests. This is the #1 risk.
7. **Performance:** N+1 queries, blocking calls in async paths, unbounded growth, bundle size. Check: recharts + three.js + framer-motion + react-force-graph bundle impact. APO caching (24h TTL) — is it effective? Supabase query patterns. Lazy loading effectiveness.
8. **Dependencies & Supply Chain:** Known CVEs (npm audit), hallucinated packages, outdated versions, lockfile hygiene, license compatibility. Check: 40+ dependencies — any with known CVEs? Any unmaintained? @whop-apps/sdk at 0.0.1-canary — is this stable enough for production?
9. **DevEx & Ops:** Build friction, CI gaps, observability, deployment story, monitoring/alerting. Check: No CI pipeline. No pre-commit hooks. 100+ npm scripts but no "test" script. How does deployment work? Is there rollback? Monitoring? Alerting?
10. **Documentation vs Reality:** README accuracy, API docs vs implementation, stale docs. Check: README says "decision-support tool" — does the code match? Are docs/ files current? Does Top20_Features.md match actual features?
11. **Accessibility (WCAG 2.2 AA):** Semantic HTML, ARIA, keyboard nav, contrast, focus management. Check: ARIA tab patterns were added (S2-10). But are ALL interactive components accessible? Color contrast in teal/amber dark theme? Screen reader support?
12. **Future-Proofing:** Extensibility, emerging tech alignment, sustainability. Check: Is the architecture extensible? Can new occupations be added easily? Can new payment providers be added? Is the AI model layer abstracted (GeminiClient.ts)?
13. **Ethical/Safety:** Disclaimers, bias, responsible AI, data privacy. Check: README says "does not predict job loss" — is this enforced in the UI? Are there disclaimers on APO results? Is there bias auditing (bias-audit Edge Function exists — is it used)? NIST AI RMF alignment?
14. **Legal & Compliance:** Licensing, open-source compatibility, regulatory boundaries. Check: MIT license. O*NET data usage terms. Gemini API ToS. Stripe ToS. Whop ToS. GDPR/CAN-SPAM for outreach. Veteran data (VA compliance)?
15. **Market Alignment & Seller Proposition:** Feature-to-segment fit, marketability gaps, competitive positioning, pricing alignment, buyer-ready artifact quality. Check: $0 revenue with 45+ features — is the product over-built for current market validation? Is pricing aligned with value? Are there buyer-ready artifacts (case studies, ROI calculators, battle cards)?
16. **Marketing Strategy & Positioning:** Positioning statement clarity (April Dunford framework). Messaging hierarchy. Channel-market fit. Brand consistency. SEO/content strategy. Claim-boundary discipline. Competitive positioning. Check: "Stay Indispensable in the AI Era" vs "decision-support tool" — is this consistent? Is there a documented positioning statement? SEO pages exist but are they effective?
17. **Outreach & Engagement Strategy:** Channel mix, cadence, personalization, compliance. Check: 0 outreach touches documented. No outreach templates in code. No CRM integration. No email sequences. This dimension will likely be all gaps.
18. **Pricing & Monetization Strategy:** Pricing model alignment, value metric, price-point competitiveness, tier design, transparency. Check: Free/$29/$149 tiers. 3 payment providers (Stripe/Whop/bootcamp). Is the value metric clear (APO checks? reports? API calls?). Is pricing public on PricingPage.tsx? Is the $10K-$85K bootcamp pricing justified?
19. **Customer Discovery & Validation Evidence:** Customer interviews, surveys, pilot feedback, lost-deal analysis, usage analytics. Check: 0% buyer validation. No customer interviews documented. No pilot data. No NPS/CSAT. No usage analytics (PostHog is in deps but is it instrumented?). Validation maturity: Desk Research Only.

**Per-dimension deep research:** Each subagent MUST search the internet for best-of-class practices for that dimension and record sources. Each dimension MUST include a Competitive Intelligence Matrix entry (top 3 competitors).

**Adversarial verification:** Before any Critical/High finding enters the report, a fresh-context Grader-tier subagent must try to refute it. Record refuter tally.

### Phase 3 — Improvement Strategy & Market Alignment
1. **Themes:** 3-5 themes that explain most findings. Target state per theme. What you are NOT fixing and why.
2. **Market Alignment Improvements:** Per-segment improvements, seller proposition gains, competitive gap closures
3. **Code Improvement Suggestions for Marketability:** What code changes would make this more sellable?
4. **Sales Enablement Artifact Audit:** Check all 10 artifact types (case studies, ROI calculators, battle cards, demo scripts, one-pagers, RFP templates, security questionnaires, pilot agreements, reference architectures, vendor assessment responses)
5. **Deep Research:** Competitor pricing, feature matrices, buyer requirements
6. Exit criteria checklist

### Top 5 Summary Gate (domain="codebase")
HARD STOP. Present 4 tables:
1. Top 5 Codebase Gaps (ranked by Priority Score = Severity × Impact × Effort)
2. Top 5 Audience Profiles (ranked by Overall Score = (Fit + WTP + Urgency + Reachability) / 4 × 5)
3. Top 5 Competitor Codebase Gaps (ranked by Priority Score = Severity × Market Impact)
4. Profile × Gap × Implementation Matrix (ranked by Severity × Profile Fit)

Ask user: "The audit and gap analysis are complete. Do you want me to proceed with implementing the top 5 gaps?"
Options: Yes (top 5) / Yes (adjust scope) / No (stop after audit)

### Phase 4 — Phase-by-Phase Gap Implementation Plan (top 5 gaps, after user approval)
1. **Gap-to-Phase Mapping:** Map each finding to implementation phase (M0-M4)
2. **Agent-Executable Tasks:** Each task self-contained (title, context paragraph, files affected, acceptance criteria as runnable checks, effort S/M/L/XL, risk, dependencies, rollback, test command, regression command, market segment benefited, seller proposition impact)
3. **Milestone Ordering:** M0 (safety net: tests + CI), M1 (critical: security + correctness), M2 (high-leverage), M3 (market alignment), M4 (quality & polish)
4. **Quick wins flagged** (high impact, S effort)
5. **Top 3 implementation sketches** included
6. Exit criteria checklist

### Implementation Loop — Top 5 Gaps
Execute Implementation Loop for top 5 gaps. Worker-tier agents do bounded edits; Grader-tier agents run tests; Orchestrator owns integration.

### Stage 1 Completion & Stage 2 Entry Gate
1. Generate handoff packet at .fable5/handoff-to-outreach.json with: audit_report_path, audited_commit_sha, implemented_gaps, remaining_gaps, market_segment_table, buyer_journey_gaps, sales_enablement_gaps, gtm_readiness_status, unresolved_assumptions, recommended_outreach_focus
2. Ask user: "Stage 1 complete. Proceed to Stage 2 (Verification + Presales + Outreach/GTM audit)?"
3. Options: Yes (full Stage 2) / Yes (Stage 2A only) / No (stop after Stage 1)

## OUTPUT FORMAT

Write one file: docs/audits/audit-{YYYY-MM-DD}-stage1.md

Structure (24 sections per the fable5-prompt deliverable spec):
1. Audited commit SHA, date, method note, refuter tally, overall confidence
2. Executive Summary: Health grade A-F, top 3 risks, top 3 opportunities, GO/NO-GO recommendation
3. Calibration Baseline (5-10 bullets)
4. Repo Map: Purpose, stack, entry points, data flows, conventions
5. Gravity Wells Table: Rank, file, LOC, commits, priority score, tests?, issue
6. Top 15 Key Features (A/B/C): Feature, category, entry point, status, test coverage, segments served
7. Market Segment Analysis & ICP: Full ICP per segment, TAM/SAM/SOM, current fit, competitor comparison
8. Feature-to-Segment Suitability Matrix with gaps
9. Buyer Journey Map: Touchpoint matrix (segment × stage × touchpoint × code route × analytics × dark funnel × gap)
10. Audit Report (worst first, grouped by dimension, all 19): Per dimension [DEEP]/[SHALLOW], findings table, internet sources, competitive intelligence matrix
11. False Positive Log (2-5 dismissed issues with why)
12. Improvement Strategy: 3-5 themes, target states, non-fixes, done signals
13. Market Alignment & Seller Proposition Improvements
14. Sales Enablement Artifact Audit (10 types)
15. Phase-by-Phase Gap Implementation Plan: M0-M4, task table, quick wins, sketches
16. New Feature Rating Table (scale 1-5, 5 dimensions)
17. GTM Readiness Scorecard (8 dimensions, READY/PARTIAL/NOT READY)
18. Presales Lifecycle Audit (10-stage funnel)
19. Customer Validation Maturity Assessment
20. Tooling Gaps
21. Metrics Snapshot: LOC, coverage, lint baseline, TODO count, CVE count
22. Phase Exit Criteria Summary
23. Open Questions
24. Multi-Model Pipeline Recommendation

## CONSTRAINTS

1. **Readonly mode:** No code changes. Only the audit report file is created.
2. **Every finding cites file:line** you actually read this session. Label [UNVERIFIED] if you can't verify.
3. **Adversarial verification** for all Critical/High findings. Record refuter tally.
4. **Deep research per dimension:** Search internet for best practices. Record sources.
5. **Competitive Intelligence Matrix:** Top 3 competitors per dimension.
6. **Calibrate to maturity:** This is a production-built app with $0 revenue. Don't demand enterprise rigor where it doesn't matter yet, but DO flag the $0 revenue + 0 tests + 0 validation as the critical gap.
7. **Tag findings:** {DIM}-{number} (e.g., SEC-1, ARCH-3, TEST-1)
8. **Label:** [FACT] or [JUDGMENT] for each finding
9. **Prompt Optimization Protocol:** Run before Phase 2 dispatch and before Top 5 Summary Gate
10. **Exit criteria are HARD GATES** — do not proceed if unmet
11. **Effort levels:** xhigh for SEC, ARCH, PERF, MKT; high for others
12. **Context budget:** Prioritize entry points, auth/payment/security code, data flow paths, config files, commercial docs. Skip dist/, node_modules/.
13. **Do not re-derive** the prior STATE.md facts listed above — they are verified. Build on them.
14. **Positioning paradox:** Explicitly audit the tension between "decision-support tool" (README) and "Stay Indispensable in the AI Era" (hero). Is this responsible-AI discipline or a marketing contradiction?
15. **3 payment providers:** Audit Stripe, Whop, and Bootcamp payment flows for consistency, security, and completeness.
16. **No test runner:** This is itself a Critical finding (TEST-1). Assess the risk of deploying a payment-handling, AI-advice-giving app with zero unit test coverage.
```

---

## PROMPT 2 — Stage 2: Full M0-M9 Marketing/Outreach/Presales Audit

**Skill:** `/fable5-with-outreach`
**Runtime mode:** `readonly_audit` (analysis only, no code changes)
**Effort level:** `xhigh` for positioning, competitive intelligence, pricing, presales; `high` for others
**Deliverable:** `docs/audits/audit-{YYYY-MM-DD}-stage2.md`
**Prerequisite:** Stage 1 handoff packet at `.fable5/handoff-to-outreach.json`

### Copy-Paste Prompt:

```
You are running the fable5-with-outreach skill to perform a full marketing, outreach, pricing, and presales lifecycle audit on the Career Automation Insights Engine. This is a readonly_audit — analysis only, no code changes. The deliverable is a single audit report file at docs/audits/audit-{YYYY-MM-DD}-stage2.md.

## CONTEXT

### Inbound Handoff from Stage 1
Read .fable5/handoff-to-outreach.json at start. This packet contains:
- audit_report_path — Stage 1 audit report
- audited_commit_sha — commit audited
- implemented_gaps — gaps already fixed in Stage 1
- remaining_gaps — gaps not yet addressed
- market_segment_table — segments identified in Stage 1
- buyer_journey_gaps — known journey gaps
- sales_enablement_gaps — known artifact gaps
- gtm_readiness_status — preliminary GTM assessment
- unresolved_assumptions — assumptions to validate
- recommended_outreach_focus — Stage 1's recommendation for Stage 2 priority

If no handoff packet exists, perform M0 calibration from scratch using the prior STATE.md facts below.

### Repository Identity
- **Name:** Career Automation Insights Engine (APO Dashboard)
- **Path:** /Users/sanjayb/Library/Mobile Documents/com~apple~CloudDocs/Documents/newrepo/career-automation-insights-engine
- **Stack:** Vite/React/TypeScript/Supabase/Stripe/Whop/Gemini
- **Product:** Decision-support APO dashboard for career automation exposure. 45+ Edge Functions, 47 pages, 80+ components. O*NET-grounded, Gemini AI-powered, multi-factor automation risk scoring with task-level granularity, skill adjacency, bridge roles, career trajectory simulation, white-label coach reports, enterprise dashboards, veterans crosswalk.
- **Pricing:** Free / $29/mo Defender / $149/mo Coach Pro / $10K-$85K bootcamp/workshop
- **3 Payment Providers:** Stripe (subscriptions), Whop (marketplace), Bootcamp (workshop pricing)
- **Revenue:** $0. No paying customers. No outreach. No buyer validation.
- **Deployment:** Netlify. SEO landing pages at /automation-risk/:occupation.

### Prior STATE.md Facts (verified — do NOT re-derive)
1. **GTM Research Completed:** Full deep research at docs/archive/phase-a-status-sprawl-20260531/docs-claims-additional/DEEP_RESEARCH_GTM_STRATEGY.md. Top 5 revenue opportunities, competitive landscape, market validation, pricing validation, outreach scripts, 90-day execution calendar all documented.
2. **Market Segments Identified:** (1) Solo career coaches/resume writers (109,200+ globally, $149/mo), (2) Mid-career professionals (28-45, $29/mo), (3) Enterprise HR (500-5000 employees, $10K-$50K audits), (4) Veterans transition orgs (federally funded), (5) University career services, (6) Outplacement firms.
3. **Competitive Landscape:** No direct competitor exists at this price point with this depth. WillRobotsTakeMyJob.com (free, 2013 data, 500K+ visits), TripleTen (lead gen for bootcamps), Eightfold AI ($50K+/year enterprise), BetterUp ($4K+/person/year coaching), LinkedIn Learning ($39.99/mo courses).
4. **Pricing Validated:** $29/mo is sweet spot for individuals. $149/mo for coaches justified by 7-15x ROI. Market comparison done. Recommendation to add $9/mo Starter tier.
5. **UI/UX Redesign Done:** "Warm Authority" teal/amber palette. Search-first homepage. Evidence dropdown. Renamed labels (Automation Insights, Market Signals, Career Impact Planner).
6. **Claim Boundaries:** README explicitly says "decision-support tool" that "does not predict job loss, make employment decisions, certify scientific validity, or prove local labor-market outcomes." This is the claim-boundary baseline.
7. **SEO Infrastructure:** Sitemap.xml (64 URLs), robots.txt, Netlify prerendering. /automation-risk/:occupation pages exist but client-rendered (prerendering plugin added).
8. **Stripe:** create-checkout-session Edge Function exists. Real price IDs for Defender and Coach Pro. Bootcamp checkout hidden.
9. **0 Outreach:** No outreach templates, no CRM, no email sequences, no LinkedIn cadence, no dark funnel presence (no G2, Capterra, Gartner listings).
10. **0 Buyer Validation:** No customer interviews, no pilot data, no NPS/CSAT, no usage analytics instrumentation (PostHog in deps but not verified as instrumented). Validation maturity: Desk Research Only.

### 5 Defensible USPs (from prior deep research — verify and refine)
1. **O*NET-Grounded Multi-Factor Scoring:** Only platform using real-time O*NET 29.3 data + Gemini AI for task-level automation analysis (not a static 2013 percentage like WillRobotsTakeMyJob). 19,000+ tasks, 109 enriched occupations, pgvector skill embeddings.
2. **Actionable Career Transition Pathfinding:** A* algorithm bridge role pathfinding + skill adjacency graph + Monte Carlo career trajectory simulation. Competitors show a number; we show a path forward.
3. **White-Label B2B Coach Reports:** CounselorReportGenerator + generate-counselor-report Edge Function. Coaches get branded HTML/PDF reports in 30 seconds. 7-15x ROI on $149/mo subscription. No competitor offers this at prosumer pricing.
4. **Veterans MOC→Civilian Crosswalk:** Complete military occupation code translation + APO analysis + bridge roles + learning paths. Federally-funded niche with dedicated budgets. No AI-powered competitor exists in this space.
5. **Enterprise Workforce Audit at Prosumer Price:** EnterpriseTeamDashboard (54KB, CSV import, department-level risk) + ROI calculator at $29-$149/mo vs Eightfold at $50K+/year. 1000x cheaper entry point for similar workforce-level insights.

### Top 5 Revenue Opportunities (from prior deep research — verify and refine)
1. **Career Coaches — White-Label Reports:** $5K-$15K MRR within 90 days. Product already built. 109,200+ coaches globally. $149/mo Coach Pro. 7-15x coach ROI. LinkedIn outreach + sample reports.
2. **SEO-Driven B2C Organic:** $3K-$8K MRR within 90 days (compounding). 50+ occupation SEO pages. WillRobotsTakeMyJob gets 500K+ visits with outdated data. We're objectively superior. 3-6 month SEO ramp.
3. **Resume Analyzer Viral Tool:** $2K-$5K MRR within 60 days. analyze-resume is complete. Inherently shareable. Reddit/LinkedIn/Product Hunt distribution. "Is Your Resume AI-Proof?"
4. **Veterans Transition Services:** $5K-$25K contracts within 90 days. MOC crosswalk + APO + bridge roles. Hire Heroes USA, American Corporate Partners, DoD TAP, state VA offices. Free pilot → paid contracts.
5. **Enterprise Workforce Audit:** $10K-$50K one-time within 90 days. EnterpriseTeamDashboard + ROI calculator. Mid-market companies (500-5000 employees) undergoing AI transformation. $2,500 wedge audit → ongoing monitoring.

### Codebase-Specific Marketing/Outreach Priorities
1. **0% Buyer Validation:** No customer interviews, no pilot feedback, no lost-deal analysis, no NPS, no usage analytics. The product has 45+ features built on assumptions, not validation. This is the #1 marketing risk.
2. **0 Outreach Touches:** No documented outreach of any kind. No email sequences, no LinkedIn cadence, no content calendar, no community engagement, no dark funnel presence. The product exists but nobody knows it does.
3. **Positioning Paradox:** README says "decision-support tool" that "does not predict job loss." Hero says "Stay Indispensable in the AI Era." APODashboard shows "automation risk" scores. This tension between responsible-AI disclaimers and marketable empowerment messaging must be resolved. Is "decision-support" the category, or is "career intelligence platform" the category?
4. **3 Payment Providers:** Stripe (subscriptions), Whop (marketplace), Bootcamp (workshop $10K-$85K). Are these coordinated? Does the pricing page show all three? Is the value metric consistent across providers? Is the bootcamp pricing aligned with the $29/$149 SaaS tiers?
5. **Competitive Intelligence vs Orennia and others:** Orennia is an energy/market intelligence platform — not a direct competitor. The real competitive set is: WillRobotsTakeMyJob (free, outdated), Eightfold AI (enterprise, expensive), BetterUp (coaching, not intelligence), LinkedIn Learning (courses, not diagnosis), TripleTen (lead gen). Verify this competitive landscape with live internet research. Are there new entrants since the GTM research was done?

### Claim-Boundary Rules (NON-NEGOTIABLE constraints for this audit)
1. **No job loss predictions:** The product estimates "automation exposure," not "job replacement probability." All marketing copy must use "automation exposure" or "automation risk" language, never "will be replaced" or "job loss probability."
2. **No scientific validation claims:** The README explicitly states APO scores are "decision-support estimates" that are not "scientifically validated." Marketing must not claim scientific accuracy, peer-reviewed methodology, or proven predictive validity.
3. **No local labor-market outcome claims:** The product does not "prove local labor-market outcomes." Marketing must not claim localized job market predictions or regional employment forecasts.
4. **No employment decision claims:** The product "does not make employment decisions." Marketing must not position it as an HR decision-making tool for hiring/firing.
5. **No broad adoption claims:** The README says stars/popularity are "not used as evidence of maturity or adoption." Marketing must not claim user counts, market share, or adoption metrics that aren't real.
6. **No live revenue claims:** $0 revenue. Marketing must not claim traction, MRR, customer counts, or revenue milestones.
7. **Decision-support framing:** All customer-facing copy must frame the product as "decision-support" — a tool that helps professionals and coaches make informed career decisions, not a tool that makes decisions for them.
8. **Proof-pack discipline:** The repo has commercial proof-pack verifiers. Any claim in marketing must be backed by a proof artifact that exists in the repo. No claim without proof.

### Provider-Agnostic Model Routing
- **Orchestrator-tier:** M0 calibration, M1 positioning, M3 pricing strategy, M7 presales lifecycle, competitive intelligence synthesis, Top 5 Gates, report writing
- **Heavy-tier:** Competitive intelligence deep dives, pricing strategy analysis, complex positioning tradeoffs, fallback when classifiers block competitive claims
- **Worker-tier:** Artifact existence checks, pricing page scans, doc scans, outreach template review, compliance checklist verification
- **Grader-tier:** Claim-boundary verification, finding triage, adversarial verifier, existence checks

Effort levels: xhigh for M1 (positioning), M3 (pricing), M7 (presales), M8 (competitive); high for M2, M4, M5, M6; medium for M0.

### Efficient-Fable Delegation Guidance
- **Fable (Orchestrator) owns:** Positioning strategy, competitive intelligence synthesis, presales lifecycle analysis, pricing tradeoffs, Top 5 Gate tables, final report
- **Worker-tier agents do:** Pricing page scans, artifact inventory checks, doc scans, outreach template review, compliance checklist verification
- **Grader-tier agents do:** Claim-boundary checks on every finding, adversarial verification, existence checks
- **Heavy-tier fallback:** Complex competitive analysis, pricing strategy when Worker-tier can't handle the nuance

## REQUEST

Execute the full fable5-with-outreach audit with all 20 steps across Stage 2A and Stage 2B:

### STAGE 2A: Verification + Presales (M0-M4)

### Phase M0 — Calibration & Discovery
1. Read: README.md, docs/Value_proposition.md, docs/Top20_Features.md, PricingPage.tsx, ForCoachesPage.tsx, HeroSection.tsx, NavigationPremium.tsx, AutomationRiskLandingPage.tsx, stripe.ts, whop config, bootcamp pricing in WorkshopBookingPage.tsx
2. Read handoff packet from Stage 1 (.fable5/handoff-to-outreach.json)
3. Note: target segments, current positioning, pricing model, outreach channels (NONE), sales enablement artifacts (NONE), analytics infrastructure (PostHog in deps — verify instrumentation)
4. Deep research: Search internet for latest GTM frameworks (April Dunford "Obviously Awesome", GTM Sequencing, MEDDIC), marketing benchmarks, outreach best practices (2026)
5. Output: Commercial Calibration Baseline (5-10 bullets)
6. Exit criteria checklist

### Phase M1 — Marketing Strategy & Positioning Audit
1. **M1A. Positioning Statement Audit:** Read all customer-facing copy (hero, landing pages, pricing, outreach docs, meta descriptions, OG tags). Check against April Dunford framework: "For [ICP], who struggle with [problem], [Company] is the [category] that [unique differentiator] — unlike [alternatives] which [limitation]." Does a positioning statement exist? Is it consistent? Does it name a specific alternative? Does it exclude bad-fit buyers?
2. **M1B. Messaging Hierarchy Audit:** Check for 3-level hierarchy: Level 1 (core message on hero), Level 2 (3-5 benefit pillars with proof points), Level 3 (features/specs/integrations). Flag if pages are improvising the pitch.
3. **M1C. Claim-Boundary Discipline:** Read all customer-facing copy against the 8 claim-boundary rules above. Check: Are claims backed by proof points? Are doNotClaim lists enforced? Is there overclaiming? Is there underclaiming (stronger claims the proof supports but aren't made)?
4. **M1D. Competitive Positioning:** For each top 3 competitor (WillRobotsTakeMyJob, Eightfold AI, BetterUp — verify with live research): What is their positioning? How do they describe their category? What alternatives do they position against? Where are they stronger? Where are we stronger?
5. Deep research: Competitor marketing copy, pricing pages, outreach strategies. Are there new entrants since the GTM research?
6. Exit criteria checklist

### Phase M2 — Outreach & Engagement Strategy Audit
1. **M2A. Channel Mix Audit:** Identify all outreach channels in use (expected: NONE). Check: Is there at least one channel per segment? Is the channel mix multi-channel (3+)? Are channels coordinated?
2. **M2B. Cadence & Sequencing Audit:** Read outreach templates (expected: NONE). Check: Is there a documented cadence (8-16 touches over 14-21 days)? Channel split? Breakup email? Reply detection? Safe limits?
3. **M2C. Compliance Audit:** Check CAN-SPAM (opt-out, physical address, 10-day SLA), GDPR (legitimate interest, retention), CASL (consent), LinkedIn ToS (automation limits). Is there a suppression list?
4. **M2D. Dark Funnel Presence:** Check for G2, Capterra, Gartner Peer Insights listings. Community presence (Slack, Discord, forums). Podcast appearances. Conference presence. Content marketing cadence.
5. Deep research: Latest outreach cadence benchmarks (2026), compliance requirements, competitor outreach strategies
6. Exit criteria checklist

### Phase M3 — Pricing & Monetization Strategy Audit
1. **M3A. Value Metric Audit:** Identify the value metric (APO checks? reports? API calls? team size?). Is it easy to understand? Aligned with how customers receive value? Scalable? Hard to game?
2. **M3B. Tier Design Audit:** Read PricingPage.tsx, stripe.ts, WorkshopBookingPage.tsx. Check: Do tiers map to distinct personas? Are price jumps justified by value jumps? Good/Better/Best structure? Decoy tier? Annual toggle? Is pricing public? Are all 3 payment providers (Stripe/Whop/Bootcamp) consistent?
3. **M3C. Price-to-Value Ratio:** For each segment, calculate quantified customer value vs price (target 10-25%). Compare to competitors.
4. **M3D. Pricing Governance:** Is there a pricing review cadence? Pricing council? Are pricing changes tracked?
5. Deep research: SaaS pricing benchmarks 2026, competitor pricing pages, value-based pricing frameworks
6. Exit criteria checklist

### Phase M4 — Buyer Journey & Touchpoint Audit
1. **M4A. Touchpoint Matrix:** For each segment × stage (Awareness→Research→Evaluation→Pilot→Purchase→Onboarding→Expansion): Map touchpoint, code route/component, analytics instrumented, dark funnel surface, gap?
2. **M4B. Drop-off Point Analysis:** Where are buyers lost? Is there a demo request route? Trial/pilot signup? Onboarding workflow? Analytics at each stage? Dark funnel tracking?
3. Deep research: B2B buyer journey research (Gartner, Forrester 2026), SaaS conversion benchmarks, dark funnel reconciliation
4. Exit criteria checklist

### Top 5 Summary Gate (domain="verification-presales")
HARD STOP. Present 4 tables:
1. Top 5 Verification + Presales Gaps (Priority Score)
2. Top 5 Audience Profiles (Overall Score)
3. Top 5 Competitor Verification Gaps (Priority Score)
4. Profile × Gap × Implementation Matrix (Severity × Profile Fit)

Ask: "Stage 2A audit complete. Proceed with implementing top 5 verification + presales gaps?"
Options: Yes (top 5) / Yes (adjust scope) / No (skip to Stage 2B)

### Implementation Loop — Stage 2A Top 5 Gaps
Execute Implementation Loop for top 5 verification + presales gaps.

### User Gate: Stage 2A Remaining Gaps
Ask: "Stage 2A top 5 implemented. {N} remaining. Implement remaining or proceed to Stage 2B?"
Options: Yes (all remaining) / Yes (selected) / No (proceed to Stage 2B)

### Stage 2A Completion & Stage 2B Entry Gate
Ask: "Stage 2A complete. Proceed to Stage 2B (Outreach/GTM)?"
Options: Yes (full Stage 2B) / Yes (selected dimensions only) / No (stop)

### STAGE 2B: Outreach/GTM (M5-M8)

### Phase M5 — Sales Enablement Artifact Audit
1. **M5A. Artifact Inventory:** For each of 10 artifact types (case studies, ROI calculators, battle cards, demo scripts, one-pagers, RFP templates, security questionnaires, pilot agreements, reference architectures, vendor assessment responses): Check exists?, current?, buyer-ready?, segment aligned?, claim-boundary OK?
2. Deep research: B2B sales enablement best practices (Gartner, Forrester, Highspot 2026), RFP benchmarks, security questionnaire standards
3. Exit criteria checklist

### Phase M6 — GTM Readiness Gate
1. **M6A. GTM Readiness Scorecard:** 8 dimensions scored READY/PARTIAL/NOT READY:
   - Documented GTM strategy
   - Target segments validated (not just identified)
   - At least one outreach channel per segment
   - Pricing public and consistent
   - Sales enablement artifacts ready
   - Analytics instrumentation for funnel measurement
   - Pilot/onboarding workflow exists
   - Compliance guardrails for claims
2. Score: READY / PARTIAL / NOT READY. Must not claim GTM readiness if any dimension is NOT READY.
3. Exit criteria checklist

### Phase M7 — Customer Validation & Presales Lifecycle Audit
1. **M7A. Customer Validation Maturity:** Score per segment: Desk Research Only → Interview-Validated → Pilot-Validated → Revenue-Validated. Check: pilot evidence register? recorded conversations? lost-deal analysis? usage analytics? feature requests?
2. **M7B. Presales Stage Map:** 10-stage funnel (Lead Capture→Qualification→Discovery→Demo→Trial/Pilot→Proposal→Negotiation→Close→Onboarding→Expansion). For each: code path/route, documented process?, analytics?, handoff?, drop-off?, conversion rate?
3. **M7C. Pipeline Velocity:** Calculate if data exists (expected: no data since $0 revenue)
4. Deep research: Presales lifecycle benchmarks, pipeline velocity formulas, conversion rate benchmarks by stage
5. Exit criteria checklist

### Phase M8 — Competitive Intelligence Deep Dive
1. **M8A. Competitive Intelligence Matrix:** For each of 9 audit dimensions, identify top 3 competitors, their approach, our approach, advantages, gaps
2. **M8B. New Entrant Scan:** Search internet for new competitors since GTM research was completed. Has anyone entered the AI career automation intelligence space?
3. **M8C. Competitive Positioning Strategy:** Based on matrix, what positioning changes would maximize competitive advantage?
4. Deep research: G2, Capterra, Gartner Peer Insights, competitor product pages, technical blogs, hiring patterns, customer reviews
5. Exit criteria checklist

### Top 5 Summary Gate (domain="outreach-gtm")
HARD STOP. Present 4 tables:
1. Top 5 Outreach/GTM Gaps (Priority Score)
2. Top 5 Audience Profiles for Outreach (Overall Score)
3. Top 5 Competitor Outreach Gaps (Priority Score)
4. Profile × Gap × Implementation Matrix (Severity × Profile Fit)

Ask: "Stage 2B audit complete. Proceed with implementing top 5 outreach/GTM gaps?"
Options: Yes (top 5) / Yes (adjust scope) / No (stop after audit)

### Implementation Loop — Stage 2B Top 5 Gaps
Execute Implementation Loop for top 5 outreach/GTM gaps.

### User Gate: Stage 2B Remaining Gaps
Ask: "Stage 2B top 5 implemented. {N} remaining. Implement remaining or produce final report?"
Options: Yes (all remaining) / Yes (selected) / No (produce final report)

## OUTPUT FORMAT

Write one file: docs/audits/audit-{YYYY-MM-DD}-stage2.md

Structure:
1. Executive Summary: GTM readiness grade A-F, top 3 marketing risks, top 3 revenue opportunities, GO/NO-GO recommendation for go-to-market
2. Commercial Calibration Baseline (5-10 bullets)
3. Stage 1 Handoff Summary (what was received, what was built on)
4. Market Segment Analysis (from Stage 1, refined with marketing depth)
5. Positioning Audit (M1A-M1D findings)
6. Outreach Audit (M2A-M2D findings)
7. Pricing Audit (M3A-M3D findings)
8. Buyer Journey Map (M4A-M4B findings)
9. Top 5 Summary Gate — Verification + Presales (4 tables)
10. Sales Enablement Artifact Audit (M5, 10 artifact types)
11. GTM Readiness Scorecard (M6, 8 dimensions)
12. Customer Validation Maturity Assessment (M7A)
13. Presales Lifecycle Audit (M7B, 10-stage funnel)
14. Competitive Intelligence Matrix (M8, top 3 per dimension)
15. Top 5 Summary Gate — Outreach/GTM (4 tables)
16. Improvement Plan: Agent-executable tasks for each gap
17. 90-Day Go-To-Market Execution Plan (updated from GTM research with audit findings)
18. Claim-Boundary Compliance Report (all claims checked against rules)
19. Phase Exit Criteria Summary (all phases, all items, met/unmet)
20. Open Questions for User Decision
21. Research Provenance (all internet sources consulted)

## CONSTRAINTS

1. **Readonly mode:** No code changes. Only the audit report file is created.
2. **Every finding cites file:line** you actually read this session. Label [UNVERIFIED] if you can't verify.
3. **Claim-boundary rules are NON-NEGOTIABLE:** Every marketing finding must be checked against the 8 claim-boundary rules. Overclaiming is the #1 risk. The verifier must check each finding against README claim boundaries and proof-pack artifacts.
4. **Adversarial verification** for all Critical/High findings. Fresh-context Grader-tier subagent must try to refute.
5. **Deep research per phase:** Search internet for best practices. Record sources.
6. **Competitive Intelligence Matrix:** Top 3 competitors per dimension. Use G2, Capterra, Gartner Peer Insights, competitor pages, customer reviews.
7. **Calibrate to maturity:** $0 revenue, 0 outreach, 0 validation. Don't recommend enterprise sales processes for a solo founder with no sales team. Focus on bootstrap-friendly, immediately actionable improvements.
8. **Tag findings:** {DIM}-{number} (e.g., MKT-1, OUT-3, PRC-2, GTM-1)
9. **Label:** [FACT] or [JUDGMENT] for each finding
10. **Prompt Optimization Protocol:** Run before M1-M8 audits and before Top 5 Summary Gate tables
11. **Exit criteria are HARD GATES** — do not proceed if unmet
12. **Effort levels:** xhigh for M1, M3, M7, M8; high for M2, M4, M5, M6; medium for M0
13. **Do not re-derive** the prior STATE.md facts, 5 USPs, or 5 revenue opportunities listed above — they are from verified deep research. Build on them, verify they still hold, refine if needed.
14. **0% buyer validation is the #1 finding:** The product has 45+ features built on zero customer validation. Every marketing recommendation must account for this. Do not recommend scaling outreach until basic validation is done.
15. **Positioning paradox must be resolved:** The audit must produce a definitive recommendation on how to reconcile "decision-support tool" (responsible AI) with "Stay Indispensable in the AI Era" (marketable empowerment). This is a strategic decision the user needs to make.
16. **3 payment providers must be reconciled:** Audit whether Stripe, Whop, and Bootcamp pricing are coordinated or fragmented. Is the value metric consistent? Should all three be shown on the pricing page?
17. **90-day execution plan must be updated:** The GTM research has a 90-day plan. The audit must update it based on findings — what's still valid, what needs to change, what's missing.
18. **Bootstrap budget:** All recommendations must be executable with $0-$5K marketing spend by a solo founder. No "hire a VP of Sales" recommendations.
```

---

## How to Use These Prompts

1. **Run Prompt 1** by pasting it into a fresh agent session with the `/fable5-prompt` skill loaded. The agent will execute Phases 0-4, produce the Stage 1 audit report, and generate the handoff packet.

2. **After Stage 1 completes**, review the audit report and Top 5 Summary Gate tables. Decide whether to proceed to Stage 2.

3. **Run Prompt 2** by pasting it into a fresh agent session with the `/fable5-with-outreach` skill loaded. The agent will read the handoff packet, execute M0-M8, and produce the Stage 2 audit report.

4. **After Stage 2 completes**, review both audit reports and the agent-executable task plans. Each task is self-contained and can be handed to a fresh agent session for implementation.

## Key Design Decisions

- **Readonly mode:** Both prompts specify `readonly_audit` — no code changes during the audit. This ensures the audit is objective and doesn't introduce regressions.
- **Prior STATE.md facts:** Both prompts include 10-11 verified facts from previous sessions to avoid re-deriving context and to build on existing work.
- **Codebase-specific priorities:** Each prompt has 5-7 priorities that focus extra depth on the most critical areas (test coverage, strict:false, positioning paradox, 0% validation, 3 payment providers).
- **Provider-agnostic model routing:** Both prompts use the 4-tier model routing (Orchestrator/Heavy/Worker/Grader) with provider mapping examples for Anthropic, OpenAI, Google, Zhipu, and Open-weight.
- **Efficient-fable delegation:** Both prompts specify what Fable (Orchestrator) owns vs what Worker/Grader agents do, keeping cost down and quality high.
- **Claim-boundary rules:** Prompt 2 has 8 non-negotiable claim-boundary rules that the verifier must check every finding against. This prevents overclaiming in marketing recommendations.
- **Bootstrap budget constraint:** Prompt 2 requires all recommendations to be executable with $0-$5K by a solo founder. No enterprise sales process recommendations.
