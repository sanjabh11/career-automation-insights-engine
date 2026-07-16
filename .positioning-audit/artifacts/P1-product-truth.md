# Phase 1: Product and Evidence Reconnaissance

**Audit ID:** caie-niche-positioning-2026-07-16
**Date:** 2026-07-16
**Evidence mode:** Evidence-limited (no first-party commercial evidence)

---

## Product Truth

### What the Product Claims to Be

The Career Automation Insights Engine (APO Dashboard) is a **decision-support tool** that estimates automation exposure and transition options from O*NET-centered occupation data, LLM-assisted task analysis, and commercial proof-pack workflows. It explicitly does **not** predict job loss, make employment decisions, certify scientific validity, or prove local labor-market outcomes.

### What the Product Actually Does (Codebase-Verified)

| Capability | Implementation | Status |
|---|---|---|
| APO Score Calculation | `calculate-apo` Edge Function (Gemini + O*NET data, Zod-validated, cached, rate-limited, Monte Carlo CI) | ✅ Production |
| Occupation Search | `search-occupations` (1,000+ O*NET occupations) | ✅ Production |
| Resume Automation Risk | `analyze-resume` (paste resume → automation-prone phrases + rewrites) | ✅ Production |
| White-Label Counselor Reports | `generate-counselor-report` + `CounselorReportGenerator.tsx` | ✅ Production |
| Bridge Role Pathfinding | `find-bridge-roles` (A* algorithm via skill overlap) | ✅ Production |
| Skill Adjacency Graph | `calculate-skill-adjacency` (Gemini embeddings + pgvector) | ✅ Production |
| Career Trajectory Simulator | `simulate-career-trajectory` (Monte Carlo) | ✅ Production |
| Market Intelligence | `market-intelligence` + `serpapi-jobs` (AI labor market analysis) | ✅ Production |
| Learning Path Generator | `generate-learning-path` | ✅ Production |
| Veterans MOC Crosswalk | `crosswalk` (Military → civilian occupation translation) | ✅ Production |
| Enterprise Team Dashboard | `EnterpriseTeamDashboard.tsx` (795 LOC, CSV import) | ✅ Production |
| Task Assessment | `assess-task` + `analyze-occupation-tasks` | ✅ Production |
| SEO Landing Pages | 50+ occupation pages at `/automation-risk/:slug` with JSON-LD | ✅ Production |
| Stripe Subscriptions | 3-tier (Free/$29/$149) + credit packs ($49/$129/$299) with real price IDs | ✅ Wired |
| Whop Marketplace | OAuth + webhook edge functions | ✅ Wired |
| Analytics | PostHog + Supabase analytics_events with 15+ conversion funnel events | ✅ Wired |
| Market Heatmap | `market-heatmap` edge function + `MarketMapPage.tsx` | ✅ Built |

### Data Assets (Competitive Moat)

- 19,000+ O*NET tasks seeded in `onet_detailed_tasks`
- O*NET knowledge, abilities, technologies tables (real government data)
- 109 pre-enriched occupations in `onet_occupation_enrichment`
- pgvector skill embeddings for similarity search
- APO telemetry logs with prompt hashing, caching, latency tracking
- 7 centralized LLM prompts in `supabase/lib/prompts.ts`
- 20+ npm verification scripts (claim boundaries, commercial trust, data provenance, secret hygiene)

### Pricing Architecture

| Tier | Price | Target | Key Features |
|---|---|---|---|
| Explorer (Free) | $0 | B2C trial | 3 APO checks/mo, 10 AI chat, basic skill adjacency |
| Defender | $29/mo | B2C prosumer | Unlimited APO + AI chat, bridge roles, ROI calc, PDF exports |
| Coach Pro | $149/mo | B2B coaches | 15 white-label reports/mo, bulk analysis, 1K API calls/day |
| Credit Packs | $49-$299 | B2B PAYG | 5-40 report credits with white-label branding |

### Product Promise vs. Customer Outcome Map

| Promise | Outcome | Evidence |
|---|---|---|
| "Decision-support APO dashboard" | APO score with task-level breakdown, confidence intervals, timeline projections | Codebase-verified (E-005) |
| "Automation exposure and transition options" | Bridge roles via A* skill overlap, career trajectory simulation, learning paths | Codebase-verified (E-005) |
| "White-label reports that sell" | CounselorReportGenerator with custom branding, PDF/HTML export | Codebase-verified (E-003) |
| "O*NET-grounded analysis" | Real O*NET 30.3 data (19K+ tasks, knowledge, abilities, technologies) injected into Gemini prompts | Codebase-verified (E-005) |
| "Source-labeled automation defense audits" | Source IDs, review state, uncertainty disclosure, evidence boundaries in reports | Codebase-verified (E-003) |

---

## Evidence Corpus Summary

| Evidence Type | Count | Grades |
|---|---|---|
| product_promise | 2 | 2 HIGH |
| customer_outcome | 1 | 1 HIGH |
| codebase_evidence | 4 | 4 HIGH |
| competitor_intel | 4 | 3 HIGH, 1 MEDIUM |
| pricing_signal | 2 | 1 HIGH, 1 MEDIUM |
| analytics_data | 1 | 1 MEDIUM |
| stakeholder_input | 1 | 1 MEDIUM |
| **Total** | **15** | **10 HIGH, 5 MEDIUM** |

### First-Party Commercial Evidence Check

**NOT MET.** Zero evidence items are first-party customer or commercial evidence. No `customer_outcome` from a real customer, no `user_quote`, no `support_ticket`, no `sales_data`. The `customer_outcome` item (E-003) describes what the product promises to deliver, not a recorded customer outcome.

**Evidence-limited mode: ACTIVE.** All subsequent gates capped at CONDITIONAL_GO.

### Evidence Gaps

| Gap | Type | Impact |
|---|---|---|
| EG-001 | No customer outcomes | Blocks full GO |
| EG-002 | No live analytics data | Cannot validate PMF behaviorally |
| EG-003 | No sales data | Cannot validate WTP |
| EG-004 | No support tickets | Cannot identify user pain points |

---

## Contradictions and Tensions

1. **Breadth vs. Focus**: The product has 65+ edge functions and 47 pages spanning B2C, B2B coaches, enterprise HR, veterans, and bootcamps. This breadth is a positioning weakness — no single segment gets a focused, best-in-class experience.

2. **"Decision-support" framing vs. user desire for answers**: The product carefully avoids claiming to predict job loss (responsible), but users seeking "will AI replace my job?" may perceive this as hedging. Competitors like WillRobotsTakeMyJob give a direct percentage.

3. **Free tier cannibalization**: The free tier offers 3 APO checks + 10 AI chat messages. Competitors offer unlimited free checks. The upgrade pressure may be insufficient.

4. **$149/mo Coach Pro vs. free alternatives**: Coaches can use ChatGPT for free to generate career advice. The value proposition must clearly justify why O*NET-grounded + white-label is worth $149/mo vs. $0.

---

## Gate Decision

**CONDITIONAL_GO** — Evidence corpus assembled with 15 items across 7 types. Evidence-limited mode active (no first-party commercial evidence). Proceed to Phase 2: Market Research.
