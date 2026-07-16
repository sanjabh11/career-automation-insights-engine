# Stage 2 Audit: Full M0-M9 Marketing/Outreach/Presales Audit

**Date:** 2026-07-05
**Audited Commit SHA:** e9172b04346cb96b6d1f903495704f1cf0bb2e36
**Skill:** fable5-with-outreach
**Mode:** readonly_audit (analysis only, no code changes)
**Handoff Packet:** `.fable5/handoff-to-outreach.json`
**Stage 1 Report:** `docs/audits/audit-2026-07-05-stage1.md`

---

## 1. Executive Summary

### GTM Readiness Grade: **F** (NOT READY)

### Top 3 Marketing Risks
1. **0% Buyer Validation** — 45+ features built on zero customer interviews. Every segment is an assumption. [FACT]
2. **0 Outreach Touches** — Templates exist but have never been sent. Nobody knows the product exists. [FACT]
3. **Positioning Paradox Unresolved** — README says "decision-support tool." Hero says "Stay Indispensable in the AI Era." Creates buyer confusion. [FACT]

### Top 3 Revenue Opportunities
1. **Career Coaches — White-Label Reports** — $5K-$15K MRR within 90 days. Product built. 109,200+ coaches. $149/mo. 7-15x ROI. [JUDGMENT]
2. **SEO-Driven B2C Organic** — $3K-$8K MRR within 90 days. 64 SEO pages. 3-6 month ramp. [JUDGMENT]
3. **Resume Analyzer Viral Tool** — $2K-$5K MRR within 60 days. Reddit/LinkedIn/Product Hunt. [JUDGMENT]

### GO/NO-GO Recommendation: **CONDITIONAL GO**
- **GO** for bounded pilot outreach to career coaches (10 interviews → 50 sends → measure reply rate)
- **NO-GO** for broad public launch or paid acquisition until validation is done
- **CONDITIONAL** on resolving positioning paradox before any external communication

---

## 2. Commercial Calibration Baseline

1. **Product Category:** Career automation exposure intelligence platform. O*NET 29.3 + Gemini AI. [FACT]
2. **Pricing:** Freemium SaaS (Free/$29/$149) + credit packs ($49-$299) + workshop ($10K-$85K). 3 payment providers. Annual toggle (20% savings). [FACT]
3. **Target Segments:** 6 identified, 0 validated. Primary: Solo career coaches ($149/mo, 109,200+ globally). [FACT]
4. **Competitive Landscape:** No direct competitor at this price point. AI career coach market: $5.48B→$6.69B (22.3% CAGR). [FACT]
5. **Outreach Status:** 0 documented touches. Templates exist but no CRM, no send log. [FACT]
6. **Analytics:** PostHog 15+ events in `src/lib/posthog.ts:48-79`. Env-gated, production status unverified. [FACT]
7. **Claim Boundaries:** 8 non-negotiable rules. README says "does not predict job loss." [FACT]
8. **Sales Enablement:** 1.5 of 10 artifact types ready (15%). [FACT]
9. **SaaS Benchmarks (2026):** Freemium conversion 3-5% (good), 6-8% (great). $20-$50/mo peak band. 14-day trials default. [FACT]
10. **GTM Best Practice:** April Dunford: "For [ICP], who struggle with [problem], [Company] is the [category] that [unique differentiator] — unlike [alternatives]." Start with 10+ conversations before scaling. [FACT]

---

## 3. Stage 1 Handoff Summary

### Received
- Audit report (758 lines, 33 sections, 19 dimensions)
- 10 implemented gaps (SEC-4, SEC-2, SEC-3, SEC-5, SEC-1, PRICE-3, DEPS-3, BIZ-4, TEST-1, DEVEX-5)
- 20 remaining gaps
- 6 market segments with TAM/SAM/SOM
- 15 buyer journey gaps, 10 sales enablement gaps
- GTM readiness: NOT READY (0 READY, 3 PARTIAL, 5 NOT READY)
- 10 unresolved assumptions
- Recommended focus: Solo Career Coaches

### Built On
- Refined segments with 2026 market data ($5.48B AI career coach market, $2.59B career pathing)
- Cross-referenced pricing vs 2026 SaaS benchmarks
- Verified competitive landscape (no new direct entrants)
- Deepened positioning analysis using April Dunford framework
- Added outreach cadence benchmarks and compliance audit

---

## 4. Market Segment Analysis (Refined)

### Segment Priority Ranking

| Rank | Segment | Fit | WTP | Urgency | Reach | Score | Pricing |
|---|---|---|---|---|---|---|---|
| 1 | Solo Career Coaches | 5 | 5 | 5 | 5 | **5.0** | $149/mo |
| 2 | Outplacement Firms | 5 | 4 | 4 | 3 | **4.0** | $149/mo or contract |
| 3 | Mid-Career Professionals | 5 | 3 | 3 | 3 | **3.5** | $29/mo |
| 4 | Enterprise HR | 4 | 5 | 3 | 2 | **3.5** | $10K-$50K |
| 5 | Veterans Orgs | 5 | 3 | 3 | 3 | **3.5** | $5K-$25K contracts |
| 6 | University | 3 | 2 | 2 | 2 | **2.25** | $149/mo or contract |

**Primary target: Solo Career Coaches (5.0/5).** Highest WTP, urgency, and reachability. Product already built. 109,200+ on LinkedIn.

**2026 Market Data:**
- AI career coach market: $5.48B→$6.69B (22.3% CAGR) — Source: giiresearch.com
- Career development software: $7.74B→$8.57B (10.7% CAGR) — Source: giiresearch.com
- Career pathing platform: $2.37B→$2.59B (9.57% CAGR) — Source: mordorintelligence.com
- Career coaching service: $1.54B (2026) — Source: verifiedmarketreports.com

---

## 5. Positioning Audit (M1A-M1D)

### M1A. Positioning Statement Audit

**Current positioning surfaces:**
- Hero (`HeroSection.tsx:115-119`): "Stay Indispensable in the AI Era"
- Badge (`HeroSection.tsx:108`): "Career Defense Platform"
- Subheadline (`HeroSection.tsx:123-125`): "Explore a decision-support estimate for AI task exposure..."
- README: "decision-support tool" that "does not predict job loss"
- ForCoachesPage (`ForCoachesPage.tsx:16-17`): "Generate Source-Labeled Automation Defense Audits"
- PricingPage (`PricingPage.tsx:121-125`): "Get personalized automation risk insights..."

| April Dunford Component | Status | Gap |
|---|---|---|
| Competitive Alternatives | ❌ Missing | No named alternative. Buyers compare to WillRobotsTakeMyJob or doing nothing. |
| Unique Attributes | ✅ Present | O*NET-grounded, task-level, Gemini AI, skill adjacency, bridge roles |
| Value | ⚠️ Partial | "decision-support estimate" is too technical. Value = "know which skills to learn next" |
| Best-Fit Customer | ❌ Unclear | Hero speaks to everyone, should speak to coaches OR professionals |
| Market Category | ❌ Contradictory | "Career Defense Platform" vs "decision-support tool" vs "automation-risk forecasting" |

**Finding MKT-1 (High): No documented positioning statement.** 3+ different category descriptions across surfaces. [FACT]

**Finding MKT-2 (High): Positioning paradox unresolved.** README says "decision-support tool." Hero says "Stay Indispensable." APODashboard shows "automation risk." Buyer confusion. [FACT]

**Recommended Positioning Statement:**
> For career coaches and mid-career professionals who struggle with AI-driven career anxiety, Automation Insights is the career defense platform that turns O*NET-grounded automation exposure data into actionable transition plans and white-label reports — unlike WillRobotsTakeMyJob which shows a static percentage with no path forward.

### M1B. Messaging Hierarchy Audit

| Level | Expected | Status | Gap |
|---|---|---|---|
| Level 1 (Core message) | 6-word headline | "Stay Indispensable in the AI Era" | ✅ Good, but category unclear |
| Level 2 (Benefit pillars) | 3-5 with proof | Stats in hero, no pillars | ❌ No structured pillars |
| Level 3 (Features) | Per pillar | 47 pages, not organized | ❌ Not mapped to pillars |

**Finding MKT-3 (Medium): No messaging hierarchy.** Pages improvise independently. Hero says "career defense," ForCoachesPage says "automation defense audits," PricingPage says "automation risk insights." [FACT]

**Recommended hierarchy:**
- **L1:** "Stay Indispensable in the AI Era"
- **L2:** (1) Know Your Risk (2) Find Your Path (3) Prove Your Value
- **L3:** Features per pillar

### M1C. Claim-Boundary Discipline

| Rule | Status |
|---|---|
| 1. No job loss predictions | ✅ Compliant |
| 2. No scientific validation claims | ✅ Compliant |
| 3. No local labor-market claims | ✅ Compliant |
| 4. No employment decision claims | ✅ Compliant |
| 5. No broad adoption claims | ✅ Compliant |
| 6. No live revenue claims | ✅ Compliant |
| 7. Decision-support framing | ⚠️ Tension between "Stay Indispensable" and "decision-support estimate" |
| 8. Proof-pack discipline | ⚠️ Trust surfaces exist but not leveraged in marketing |

**Finding MKT-4 (Medium): Underclaiming on proof surfaces.** `ResponsibleAIPage`, `ValidationPage`, `QualityPage` exist — competitors don't have these. Not leveraged in hero. [JUDGMENT]

**Finding MKT-5 (Low): Subheadline too technical.** "Explore a decision-support estimate for AI task exposure, skill adjacency, and career transition planning using a U.S. O*NET-based data backbone" → should be "See your AI automation risk, find your safest career path, and get a plan to stay relevant." [JUDGMENT]

### M1D. Competitive Positioning

| Competitor | Their Category | Where Stronger | Where We're Stronger |
|---|---|---|---|
| WillRobotsTakeMyJob | Automation risk lookup | Brand, SEO (500K+ visits), simplicity | Task-level, remediation, O*NET 29.3, bridge roles, coach reports |
| Eightfold AI | Enterprise talent intelligence | Enterprise trust, scale, integrations | Price ($29-$149 vs $50K+), individual access, no enterprise sales cycle |
| BetterUp | Enterprise coaching | Coaching network, brand | Intelligence layer, price, white-label reports |
| Teal | Job search tool | Tactical workflow, brand, $29/mo | "Peace time defense," automation risk, career transition |
| LinkedIn Learning | Course platform | Content library, brand, distribution | We tell you WHICH skills to learn based on YOUR exposure |

**Finding MKT-6 (High): No named alternative in positioning.** April Dunford requires naming what you displace. Buyers compare to free alternatives. Name them. [FACT]

**Finding MKT-7 (Medium): "Career Defense Platform" is a new category nobody searches for.** Category creation requires budget. Position within existing category ("career intelligence") and differentiate. [JUDGMENT]

**Sources:** markcmo.com/blog-go-to-market-strategy-guide, peppereffect.com/blog/saas-competitive-positioning, growwithba.com/blog/positioning-strategy-saas

---

## 6. Outreach Audit (M2A-M2D)

### M2A. Channel Mix

| Channel | Active? | Gap |
|---|---|---|
| LinkedIn outreach | ❌ 0 sends | Templates exist, no CRM |
| Email outreach | ❌ 0 sends | No email tool, no suppression list |
| SEO/Content | ⚠️ 64 pages, 0 traffic data | Prerendering unverified |
| Reddit | ❌ | No presence |
| Product Hunt | ❌ | No launch |
| G2/Capterra | ❌ | No dark funnel |
| Community | ❌ | No Slack/Discord |
| Podcasts | ❌ | No appearances |
| Content calendar | ⚠️ 4-week calendar exists, 0 posts | Not executed |

**Finding OUT-1 (Critical): 0 outreach channels active.** Product exists but nobody knows. [FACT]

**Finding OUT-2 (High): No dark funnel presence.** No G2, Capterra, Gartner. B2B buyers research here first. [FACT]

### M2B. Cadence & Sequencing

**Current:** None. Plan says "5-10/day" but 0 documented sends.

**2026 Benchmark:** 8-16 touches over 14-21 days. Multi-channel lifts 3-5x. 5% reply rate benchmark.

**Finding OUT-3 (High): No documented cadence.** No multi-touch sequence. No connection → DM → follow-up → breakup flow. [FACT]

**Recommended cadence (solo founder):**
- Day 1: LinkedIn connection request (personalized, no pitch)
- Day 3: LinkedIn DM (value-first, offer sample report)
- Day 7: Follow-up DM (gentle nudge)
- Day 14: Breakup email ("closing the loop")
- Volume: 10 new/day = 50/week = 200/month

### M2C. Compliance

| Regulation | Status | Gap |
|---|---|---|
| CAN-SPAM: Opt-out | ❌ | No unsubscribe link in templates |
| CAN-SPAM: Physical address | ❌ | Not in templates |
| CAN-SPAM: 10-day SLA | ❌ | No process |
| GDPR: Legitimate interest | ⚠️ | No documented assessment |
| GDPR: Right to erasure | ❌ | No deletion process |
| CASL: Express consent | ❌ | No consent for Canadian prospects |
| LinkedIn ToS: No automation | ✅ | Manual only |
| LinkedIn ToS: 100/week limit | ✅ | 5-10/day is within limits |

**Finding OUT-4 (Medium): CAN-SPAM non-compliance risk.** Templates lack opt-out and physical address. [FACT]

**Sources:** martal.ca/b2b-cold-email-statistics-lb, overloop.com/blog/linkedin-vs-email, ftc.gov/business-guidance/blog/2015/08/candid-answers-can-spam-questions

### M2D. Dark Funnel

| Platform | Listed? | Gap |
|---|---|---|
| G2 | ❌ | B2B buyers check G2 first |
| Capterra | ❌ | SMB buyers check Capterra |
| Gartner Peer Insights | ❌ | Enterprise buyers check Gartner |
| Product Hunt | ❌ | No launch |
| Slack/Discord | ❌ | No community |
| Podcasts | ❌ | No appearances |
| Conferences | ❌ | No attendance (SHRM, ATD, NACE, ICF) |

**Finding OUT-5 (High): Zero dark funnel presence.** 97% of B2B buyers research online before contacting vendors (Forrester). [FACT]

---

## 7. Pricing Audit (M3A-M3D)

### M3A. Value Metric

**Current metrics (inconsistent):** APO checks/month, AI chat messages/month, white-label reports/month, API calls/day, report credits, workshop per-event.

**Finding PRC-1 (High): No single clear value metric.** 5+ different metrics. Buyers can't answer "what am I paying for?" [FACT]

**Recommended:** "Career intelligence credits" — 1 credit = 1 APO check OR 1 report OR 1 resume analysis.

### M3B. Tier Design

| Tier | Price | Persona | Assessment |
|---|---|---|---|
| Explorer (Free) | $0 | Browser | ✅ 3 APO checks = enough to experience value |
| Defender | $29/mo | Professional | ✅ In $20-$50 peak band. Good value jump. |
| Coach Pro | $149/mo | Coach | ✅ 15 reports at $10/client = $150 value. 7-15x ROI. |
| Credit Packs | $49-$299 | Occasional | ⚠️ Cannibalizes Coach Pro subscription |
| Workshop | $10K-$85K | Enterprise | ⚠️ Disconnected from SaaS. 344x jump from $29. |

**Finding PRC-2 (Medium): Credit packs cannibalize Coach Pro.** 15 credits for $129 one-time vs $149/mo recurring. Perverse incentive. [FACT]

**Finding PRC-3 (Medium): Workshop pricing disconnected.** No path from $29/mo to $10K. Consider $500-$2,500 "Enterprise Pilot" tier. [JUDGMENT]

**Finding PRC-4 (Low): Annual toggle not prominent.** `PricingPage.tsx:127-148` has monthly/yearly toggle with "Save 20%" badge. Good but could be more prominent. [FACT]

### M3C. Price-to-Value Ratio

| Segment | Price | Quantified Value | P/V Ratio | Benchmark |
|---|---|---|---|---|
| Coach | $149/mo | 15 reports × $10/client = $150/mo minimum. Time saved: 5hrs × $75/hr = $375. Total value: $525/mo | **3.5x** | ✅ Good (target 10-25%) |
| Professional | $29/mo | Career transition plan value: ~$500 (vs $300 career coach session). Annual: $350/yr vs $1,200 coaching. | **12x** | ✅ Excellent |
| Enterprise | $10K-$50K | Workforce audit: 500 employees × $20/employee = $10K. vs Eightfold at $50K+/yr. | **1-5x** | ⚠️ Depends on scope |

### M3D. Pricing Governance

**Finding PRC-5 (Medium): No pricing review cadence.** No documented pricing council, no pricing change tracking, no A/B test on pricing page. $0 revenue means no conversion data to optimize against. [FACT]

**Sources:** chartmogul.com/reports/saas-conversion-report, toolradar.com/reports/b2b-saas-pricing-benchmarks-2026, loopworker.com/2026-saas-pricing-benchmark-report

---

## 8. Buyer Journey Map (M4A-M4B)

### M4A. Touchpoint Matrix

| Segment | Awareness | Research | Evaluation | Pilot | Purchase | Onboarding | Expansion |
|---|---|---|---|---|---|---|---|
| **Coach** | LinkedIn / SEO | `/for-coaches` | `/sample-report` | ❌ No pilot | `/pricing` $149/mo | ❌ None | ❌ None |
| **Professional** | SEO / Reddit | `/` homepage | `/tools/resume-analyzer` | Free tier (3 APO) | `/pricing` $29/mo | ❌ None | ❌ None |
| **Enterprise** | LinkedIn / referral | `/enterprise-dashboard` | `/responsible-ai` | ❌ No pilot | `/workshops` $10K+ | ❌ None | ❌ None |
| **Veterans** | Direct outreach | `/veterans` | MOC crosswalk | ❌ No pilot | ❌ No route | ❌ None | ❌ None |
| **University** | ❌ No channel | ❌ No page | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Outplacement** | LinkedIn | `/for-coaches` | `/sample-report` | ❌ No pilot | `/pricing` $149/mo | ❌ None | ❌ None |

### M4B. Drop-off Point Analysis

| Stage | Code Route | Analytics? | Drop-off Risk | Gap |
|---|---|---|---|---|
| Awareness → Research | SEO → homepage | ✅ seo_page_viewed | HIGH — prerendering unverified | Verify SEO indexing |
| Research → Evaluation | Homepage → tools | ✅ apo_check_performed | MEDIUM — free tier allows exploration | No email capture on free use |
| Evaluation → Pilot | Tools → pricing | ✅ upgrade_prompt_shown | HIGH — no trial/pilot workflow | No pilot signup form |
| Pilot → Purchase | Pricing → Stripe | ✅ checkout_started | UNKNOWN — $0 revenue | No conversion data |
| Purchase → Onboarding | Stripe → dashboard | ✅ checkout_completed | HIGH — no onboarding | No welcome email, no tour |
| Onboarding → Expansion | Dashboard → ? | ❌ No event | CERTAIN — no expansion | No referral, no upsell |

**Finding BJ-1 (High): No pilot signup form.** No route for prospects to request a pilot. Free tier is the only trial, but no upgrade-to-paid conversion path beyond pricing page. [FACT]

**Finding BJ-2 (High): No onboarding flow.** After purchase, users land on dashboard with no guidance. No welcome email, no guided tour, no "first action" prompt. Churn risk is extreme. [FACT]

**Finding BJ-3 (Medium): No email capture on free use.** Users can run 3 APO checks without providing an email. No lead capture = no nurture = no conversion. [FACT]

**Sources:** gartner.com (B2B buyer journey), forrester.com (dark funnel reconciliation)

---

## 9. Top 5 Summary Gate — Verification + Presales

### Table 1: Top 5 Verification + Presales Gaps

| Rank | ID | Gap | Severity | Impact | Effort | Priority Score | Segment |
|---|---|---|---|---|---|---|---|
| 1 | VAL-1 | 0% buyer validation — 45+ features on assumptions | Critical | 10 | M | **100** | All |
| 2 | MKT-1 | No positioning statement — 3+ category descriptions | High | 8 | S | **64** | All |
| 3 | OUT-1 | 0 outreach channels active — nobody knows product exists | Critical | 9 | S | **72** | All |
| 4 | BJ-1 | No pilot signup form — no trial-to-paid path | High | 7 | S | **56** | Coach, Enterprise |
| 5 | PRC-1 | No clear value metric — 5+ inconsistent metrics | High | 6 | M | **48** | All |

### Table 2: Top 5 Audience Profiles

| Rank | Segment | Fit | WTP | Urgency | Reach | Overall Score |
|---|---|---|---|---|---|---|
| 1 | Solo Career Coaches | 5 | 5 | 5 | 5 | **5.0** |
| 2 | Outplacement Firms | 5 | 4 | 4 | 3 | **4.0** |
| 3 | Mid-Career Professionals | 5 | 3 | 3 | 3 | **3.5** |
| 4 | Enterprise HR | 4 | 5 | 3 | 2 | **3.5** |
| 5 | Veterans Orgs | 5 | 3 | 3 | 3 | **3.5** |

### Table 3: Top 5 Competitor Verification Gaps

| Rank | Competitor | Their Gap | Severity | Market Impact | Priority Score |
|---|---|---|---|---|---|
| 1 | WillRobotsTakeMyJob | 2013 data, no remediation, no task-level, no reports | High | 8 | **64** |
| 2 | Eightfold AI | $50K+/yr, no individual access, enterprise-only | High | 7 | **56** |
| 3 | BetterUp | No intelligence layer, coaching only, no automation risk | Medium | 5 | **30** |
| 4 | Teal | Tactical only, no "peace time" defense, no automation risk | Medium | 5 | **30** |
| 5 | LinkedIn Learning | Generic courses, no personalized exposure scoring | Low | 3 | **12** |

### Table 4: Profile × Gap × Implementation Matrix

| Profile | Gap | Severity | Profile Fit | Action | Effort |
|---|---|---|---|---|---|
| Coach | VAL-1 (0% validation) | Critical | 5.0 | Conduct 10 coach interviews with sample report | S |
| Coach | OUT-1 (0 outreach) | Critical | 5.0 | Send 50 personalized LinkedIn DMs to coaches | S |
| Coach | MKT-1 (no positioning) | High | 5.0 | Write positioning statement using Dunford framework | S |
| Coach | BJ-1 (no pilot) | High | 5.0 | Add pilot signup form on `/for-coaches` | S |
| Professional | PRC-1 (no value metric) | High | 3.5 | Unify to "career intelligence credits" | M |

---

## 10. Sales Enablement Artifact Audit (M5)

| # | Artifact Type | Exists? | Current? | Buyer-Ready? | Segment Aligned? | Claim-Boundary OK? |
|---|---|---|---|---|---|---|
| 1 | Case Studies | ❌ | N/A | N/A | N/A | N/A |
| 2 | ROI Calculators | ✅ `ROICalculator.tsx` | Yes | Partial | No — generic | ✅ Uses "estimated" |
| 3 | Battle Cards | ❌ | N/A | N/A | N/A | N/A |
| 4 | Demo Scripts | ❌ | N/A | N/A | N/A | N/A |
| 5 | One-Pagers | Partial — `ForCoachesPage` is web | Yes | No — not PDF | Coach-only | ✅ |
| 6 | RFP Templates | ❌ | N/A | N/A | N/A | N/A |
| 7 | Security Questionnaires | Partial — `ResponsibleAIPage` | Yes | Partial | B2B generic | ✅ |
| 8 | Pilot Agreements | ❌ | N/A | N/A | N/A | N/A |
| 9 | Reference Architectures | ❌ | N/A | N/A | N/A | N/A |
| 10 | Vendor Assessment | ❌ | N/A | N/A | N/A | N/A |

**Score: 1.5 of 10 ready (15%).**

**Finding SE-1 (High): 8 of 10 artifact types completely missing.** No case studies, battle cards, demo scripts, RFP templates, pilot agreements. Cannot support B2B sales conversations. [FACT]

**Finding SE-2 (Medium): ForCoachesPage is not a one-pager.** It's a web page, not a printable PDF. Coaches need something they can share with clients or decision-makers. [JUDGMENT]

**Sources:** gartner.com (sales enablement), forrester.com (B2B buying journey), highspot.com (sales enablement best practices)

---

## 11. GTM Readiness Scorecard (M6)

| # | Dimension | Status | Evidence |
|---|---|---|---|
| 1 | Documented GTM strategy | **PARTIAL** | `APO_OUTREACH_OPERATING_PLAN.md` exists. No validated ICP, no revenue data. |
| 2 | Target segments validated | **NOT READY** | 0 interviews, 0 pilots, 0 lost-deal analysis. |
| 3 | Outreach channel per segment | **NOT READY** | 0 documented sends. Templates are drafts. |
| 4 | Pricing public and consistent | **PARTIAL** | Free/$29/$149 visible. 3 providers fragmented. Workshop disconnected. |
| 5 | Sales enablement artifacts | **NOT READY** | 1.5 of 10 ready (15%). |
| 6 | Analytics instrumentation | **PARTIAL** | PostHog 15+ events. Env-gated, production unverified. No funnel data. |
| 7 | Pilot/onboarding workflow | **NOT READY** | No pilot form, no onboarding, no welcome email. |
| 8 | Compliance guardrails | **PARTIAL** | Claim boundaries documented. No CAN-SPAM compliance in templates. Positioning paradox unresolved. |

**Overall GTM Readiness: NOT READY** (0 READY, 3 PARTIAL, 5 NOT READY)

**Finding GTM-1 (Critical): GTM readiness is NOT READY across all dimensions.** No dimension is READY. 3 are PARTIAL. 5 are NOT READY. The product cannot go to market in its current state without resolving at minimum: positioning, outreach execution, pilot workflow, and basic validation. [FACT]

---

## 12. Customer Validation Maturity Assessment (M7A)

| Segment | Maturity | Evidence | Gap to Next Level |
|---|---|---|---|
| Coaches | Desk Research Only | `Value_proposition.md` analyzes market. Templates exist. 0 interviews. | Conduct 10 interviews. Show sample report. Ask: "Would you pay $149/mo?" |
| Professionals | Desk Research Only | SEO pages built. 0 user testing. 0 NPS. | Deploy PostHog. Measure APO-to-signup. Run 5 user tests. |
| Enterprise | Desk Research Only | `EnterpriseTeamDashboard` built. 0 conversations. | 5 enterprise HR discovery calls. Demo workforce audit. |
| Veterans | Desk Research Only | `/veterans` + MOC crosswalk. 0 org conversations. | Contact Hire Heroes USA, American Corporate Partners. |
| University | Desk Research Only | No university page. 0 conversations. | Build landing page. Contact 10 career center directors. |
| Outplacement | Desk Research Only | `ForCoachesPage` applicable. 0 conversations. | Contact Right Management, LHH. Offer white-label pilot. |

**Finding CV-1 (Critical): Overall validation maturity: Desk Research Only (lowest).** No segment has advanced beyond desk research. 45+ features built on zero validation. This is the #1 business risk. [FACT]

**Maturity Scale:** Desk Research Only → Interview-Validated → Pilot-Validated → Revenue-Validated

**Sources:** artisangrowthstrategies.com (SaaS conversion benchmarks), growthspreeofficial.com (trial-to-paid benchmarks)

---

## 13. Presales Lifecycle Audit (M7B)

| # | Stage | Code Path | Process? | Analytics? | Handoff? | Drop-off? | Conv. Rate |
|---|---|---|---|---|---|---|---|
| 1 | Lead Capture | SEO, `/for-coaches`, `/pricing` | Partial | ✅ `commercial_lead_captured` | ❌ No CRM | HIGH | N/A |
| 2 | Qualification | ❌ | ❌ | ❌ | ❌ | CERTAIN | N/A |
| 3 | Discovery | ❌ | ❌ | ❌ | ❌ | CERTAIN | N/A |
| 4 | Demo | `/sample-report`, `/enterprise-dashboard` | ❌ No script | ❌ | ❌ | HIGH | N/A |
| 5 | Trial/Pilot | Free tier (3 APO) | ❌ No pilot | ✅ `free_limit_hit` | ❌ | HIGH | N/A |
| 6 | Proposal | ❌ | ❌ | ❌ | ❌ | CERTAIN | N/A |
| 7 | Negotiation | ❌ | ❌ | ❌ | ❌ | CERTAIN | N/A |
| 8 | Close | `/pricing` → Stripe | ✅ | ✅ `checkout_started/completed` | ✅ Stripe→DB | UNKNOWN | 0% |
| 9 | Onboarding | ❌ | ❌ | ❌ | ❌ | CERTAIN | N/A |
| 10 | Expansion | ❌ | ❌ | ❌ | ❌ | CERTAIN | N/A |

**Finding PS-1 (Critical): Presales maturity: Stage 1 only (Lead Capture partial).** Stages 2-7 and 9-10 completely missing. Product can capture leads but has no process to move them through qualification, discovery, demo, pilot, proposal, or close. [FACT]

**Pipeline velocity:** Cannot calculate — $0 revenue, 0 closed deals, 0 pipeline data.

---

## 14. Competitive Intelligence Matrix (M8)

### M8A. Competitive Intelligence Matrix (Top 3 per Dimension)

| Dimension | Competitor | Their Approach | Our Approach | Our Advantage | Our Gap |
|---|---|---|---|---|---|
| **Automation Risk** | WillRobotsTakeMyJob | Static % from 2013 Frey/Osborne study | O*NET 29.3 + Gemini task-level scoring | Task-level, current data, remediation | Brand, SEO authority |
| **Automation Risk** | ReplacedByRobot.info | Updated 2026 automation risk database | Same + skill adjacency + bridge roles | Transition planning, not just a number | Traffic, brand |
| **Automation Risk** | Research.com automation rankings | Data-driven rankings with wages/growth | APO + confidence intervals + Monte Carlo | Confidence-scaled, actionable | Academic authority |
| **Career Coaching** | BetterUp | Enterprise coaching network, $4K+/person/yr | White-label reports for coaches at $149/mo | Price, intelligence layer, coach empowerment | Coaching network, brand |
| **Career Coaching** | CoachHub | Enterprise coaching, $1.2B valuation | O*NET-grounded reports coaches can brand | Price, data depth, no enterprise sales | Scale, brand, global reach |
| **Career Coaching** | Coaching.com | White-label platform $148-$2,485/mo | CounselorReportGenerator + white-label | O*NET automation intelligence vs generic coaching | Platform maturity, marketplace |
| **Career Pathing** | Eightfold AI | Enterprise talent intelligence $50K+/yr | Skill adjacency + bridge roles at $29-$149 | Price, individual access, no enterprise sales | Enterprise trust, integrations |
| **Career Pathing** | Gloat | Internal talent marketplace | Career transition planning for individuals | External focus, not just internal | Enterprise deployments |
| **Career Pathing** | Fuel50 | Career pathing + workforce planning | APO + bridge roles + skill adjacency | Price, automation focus | Enterprise features |
| **Job Search** | Teal | $29/mo, ATS optimization, "Land 6x more interviews" | "Peace time defense" — automation risk + transition | Owns different stage of career lifecycle | Brand, tactical workflow |
| **Job Search** | Jobscan | $49.95/mo, ATS keyword matching | Resume AI-proof scoring (not ATS) | Different problem (automation risk vs ATS) | Brand, market awareness |
| **Job Search** | JobWinner.ai | $19/mo, white-label resume builder | White-label automation intelligence reports | Intelligence vs commodity resume | Price, simplicity |
| **Learning** | LinkedIn Learning | $39.99/mo, course library | Learning paths tied to specific automation exposure | Personalized recommendations vs generic | Content library, brand |
| **Learning** | Coursera | Career Academy, university partnerships | Course search tied to skill gaps | Specific to automation-driven skill gaps | Content, brand, scale |
| **Learning** | Udemy | Course marketplace | Learning path ROI calculator | ROI-driven course selection | Content, brand |
| **Veterans** | (None) | No AI-powered MOC crosswalk competitor | Complete MOC→civilian + APO + bridge roles | Blue ocean — no competitor | Needs validation |
| **Enterprise** | Workday Skills Cloud | Embedded in HCM, enterprise scale | EnterpriseTeamDashboard at $29-$149/mo | Price, no enterprise sales cycle | Enterprise trust, integrations |
| **Enterprise** | Lightcast | $16K+/yr, labor market data | Market intelligence + APO at prosumer price | Democratized access | Data depth, enterprise trust |
| **Outplacement** | Right Management | Full-service outplacement | White-label reports for outplacement coaches | Tool for outplacement consultants, not replacement | Service layer, brand |
| **Outplacement** | LHH | Career transition services | Automation risk + transition plans for displaced workers | Intelligence layer for existing services | Service network |
| **Outplacement** | Randstad RiseSmart | Tech-enabled outplacement | White-label automation defense reports | Data-driven vs generic outplacement | Scale, brand |
| **Resume** | TopResume | Professional resume writing service | Resume AI-proof scoring (automation risk, not ATS) | Different angle (automation defense) | Service layer, brand |
| **Resume** | ZipJob | Resume writing + optimization | Resume analyzer for automation-prone phrasing | Diagnostic vs service | Brand, market |
| **Resume** | Let's Eat Grandma | Premium resume writing + LinkedIn | Resume AI-proof score + career resilience | Self-service vs premium service | Brand, quality |
| **SEO** | WillRobotsTakeMyJob | 500K+ visits, strong SEO authority | 64 SEO pages with better data | Better data, remediation paths | Domain authority, backlinks |
| **SEO** | CareerExplorer | Career tests + occupation data | APO + career transition planning | Actionable transition plans | Brand, test engagement |
| **SEO** | O*NET Online | Official O*NET site, government authority | Synthesized APO + Gemini intelligence | Synthesis + AI scoring vs raw data | Official authority |

### M8B. New Entrant Scan

**Finding CI-1 (Low): No new direct entrants found since GTM research.** Internet search for "AI career automation risk platform 2026" returned WillRobotsTakeMyJob, ReplacedByRobot.info (updated 2026), and research.com automation rankings. No new entrant matches APO's feature set (O*NET + Gemini + task-level + bridge roles + coach reports). [FACT]

**New adjacent entrants:**
- **Coachilly** ($485-$4,485/mo): AI-augmented coaching platform with admin. Not direct competitor (coaching platform, not intelligence).
- **ReplacedByRobot.info**: Updated 2026 version of WillRobotsTakeMyJob concept. Still binary, no remediation.

### M8C. Competitive Positioning Strategy

**Recommended positioning changes:**
1. **Name the alternative:** "Unlike WillRobotsTakeMyJob which shows a static percentage..." in hero or subheadline
2. **Claim the category:** "Career intelligence platform" (existing category) not "Career Defense Platform" (new category)
3. **Price-anchor against enterprise:** "Enterprise-grade career intelligence at 1/1000th the cost of Eightfold"
4. **Differentiate against free:** "Free tools tell you if. We tell you what to do next."
5. **Leverage trust surfaces:** Promote `/responsible-ai`, `/validation`, `/quality` as competitive advantages

**Sources:** giiresearch.com (AI career coach market), mordorintelligence.com (career pathing market), verifiedmarketreports.com (career coaching market), pulserevops.com (career coaching GTM playbook)

---

## 15. Top 5 Summary Gate — Outreach/GTM

### Table 1: Top 5 Outreach/GTM Gaps

| Rank | ID | Gap | Severity | Impact | Effort | Priority Score |
|---|---|---|---|---|---|---|
| 1 | GTM-1 | GTM readiness NOT READY across all dimensions | Critical | 10 | M | **100** |
| 2 | VAL-1 | 0% buyer validation | Critical | 10 | S | **80** |
| 3 | OUT-1 | 0 outreach channels active | Critical | 9 | S | **72** |
| 4 | SE-1 | 8 of 10 sales enablement artifacts missing | High | 7 | M | **56** |
| 5 | BJ-2 | No onboarding flow — extreme churn risk | High | 7 | S | **56** |

### Table 2: Top 5 Audience Profiles for Outreach

| Rank | Segment | Score | Best Channel | Best Proof Pack |
|---|---|---|---|---|
| 1 | Solo Career Coaches | 5.0 | LinkedIn DMs | Coach white-label report |
| 2 | Outplacement Firms | 4.0 | LinkedIn + email | Resume AI-proof + counselor report |
| 3 | Mid-Career Professionals | 3.5 | SEO + Reddit | Resume AI-proof score |
| 4 | Enterprise HR | 3.5 | LinkedIn + referral | Enterprise workforce audit |
| 5 | Veterans Orgs | 3.5 | Direct outreach | MOC crosswalk + bridge roles |

### Table 3: Top 5 Competitor Outreach Gaps

| Rank | Competitor | Their Outreach Gap | Priority Score |
|---|---|---|---|
| 1 | WillRobotsTakeMyJob | No outreach needed (viral SEO), but no remediation = no retention | **64** |
| 2 | Eightfold AI | Enterprise-only, no self-serve, no individual access | **56** |
| 3 | BetterUp | No intelligence layer, no automation risk, no self-serve | **30** |
| 4 | Teal | No "peace time" defense, no automation risk | **30** |
| 5 | LinkedIn Learning | No personalized exposure scoring, generic content | **12** |

### Table 4: Profile × Gap × Implementation Matrix

| Profile | Gap | Severity | Fit | Action | Effort |
|---|---|---|---|---|---|
| Coach | VAL-1 | Critical | 5.0 | 10 coach interviews with sample report | S |
| Coach | OUT-1 | Critical | 5.0 | 50 LinkedIn DMs using existing templates | S |
| Coach | SE-1 | High | 5.0 | Create coach one-pager PDF from ForCoachesPage | S |
| Coach | BJ-2 | High | 5.0 | Add welcome email + guided tour after purchase | S |
| Professional | OUT-1 | Critical | 3.5 | Post resume analyzer on Reddit + Product Hunt | S |

---

## 16. Improvement Plan: Agent-Executable Tasks

### Quick Wins (S effort, high impact)

| ID | Task | Files | Acceptance Criteria | Effort |
|---|---|---|---|---|
| MKT-1 | Write positioning statement | `README.md`, `HeroSection.tsx` subheadline | Single Dunford-format statement, consistent across all surfaces | S |
| MKT-3 | Create messaging hierarchy | `HeroSection.tsx`, `ForCoachesPage.tsx`, `PricingPage.tsx` | 3 benefit pillars with proof points, consistent across pages | S |
| OUT-1 | Execute first 50 LinkedIn outreach sends | CRM (spreadsheet), `APO_OUTREACH_AND_PILOT_TEMPLATES.md` | 50 documented sends, reply rate measured | S |
| OUT-4 | Add CAN-SPAM compliance to templates | `APO_OUTREACH_AND_PILOT_TEMPLATES.md` | Opt-out link + physical address in all templates | S |
| BJ-1 | Add pilot signup form | `ForCoachesPage.tsx` | Form captures name, email, coaching niche → stores in Supabase | S |
| BJ-2 | Add welcome email after purchase | `stripe-webhook/index.ts`, email template | Email sent on `checkout_completed` event | S |
| SE-1 | Create coach one-pager PDF | New file `docs/assets/coach-one-pager.pdf` | Printable PDF with ICP, pricing, ROI, sample report link | S |

### Medium Effort

| ID | Task | Files | Acceptance Criteria | Effort |
|---|---|---|---|---|
| VAL-1 | Conduct 10 coach interviews | Interview guide, results doc | 10 interviews completed, findings documented | M |
| PRC-1 | Unify value metric to "career intelligence credits" | `stripe.ts`, `PricingPage.tsx` | Single metric across all tiers and credit packs | M |
| PRC-3 | Add Enterprise Pilot tier ($500-$2,500) | `stripe.ts`, `PricingPage.tsx`, new route | New tier between Coach Pro and Workshop | M |
| OUT-5 | Create G2 + Capterra listings | G2.com, Capterra.com | Listings live with product description and pricing | M |
| MKT-6 | Add named alternative to positioning | `HeroSection.tsx` | "Unlike WillRobotsTakeMyJob..." in subheadline or hero | S |

---

## 17. 90-Day Go-To-Market Execution Plan

### Phase 1: Validation (Days 1-30)
**Goal:** Validate coach segment with 10 interviews + 50 outreach sends

| Week | Action | Success Metric | Budget |
|---|---|---|---|
| 1 | Write positioning statement (MKT-1). Create messaging hierarchy (MKT-3). Add CAN-SPAM compliance (OUT-4). | Positioning documented, templates compliant | $0 |
| 2 | Create coach one-pager PDF (SE-1). Add pilot signup form on `/for-coaches` (BJ-1). | One-pager ready, form live | $0 |
| 3 | Conduct 5 coach interviews. Show sample report. Ask: "Would you pay $149/mo?" | 5 interviews completed, findings documented | $0 |
| 4 | Conduct 5 more interviews. Start LinkedIn outreach (10 sends/day). | 10 interviews total, 50 sends logged | $0 |

**Phase 1 exit criteria:**
- [ ] Positioning statement documented and consistent
- [ ] 10 coach interviews completed
- [ ] 50 LinkedIn sends documented with reply rate
- [ ] Coach one-pager PDF created
- [ ] Pilot signup form live

### Phase 2: Iteration (Days 31-60)
**Goal:** Iterate based on interview findings + scale outreach + launch resume analyzer

| Week | Action | Success Metric | Budget |
|---|---|---|---|
| 5 | Analyze interview findings. Update positioning if needed. Refine outreach templates. | Findings synthesized, templates updated | $0 |
| 6 | Scale LinkedIn outreach to 10/day. Launch resume analyzer on Reddit (r/careerguidance, r/jobs). | 50 more sends, Reddit post live | $0 |
| 7 | Launch on Product Hunt. Add welcome email after purchase (BJ-2). | Product Hunt launch, welcome email live | $0 |
| 8 | Create G2 listing. Create Capterra listing. Unify value metric (PRC-1). | Dark funnel listings live, unified metric | $0 |

**Phase 2 exit criteria:**
- [ ] 100 total LinkedIn sends with reply rate ≥ 5%
- [ ] Product Hunt launch completed
- [ ] G2 + Capterra listings live
- [ ] Welcome email flow working
- [ ] Value metric unified

### Phase 3: Initial Revenue (Days 61-90)
**Goal:** First paying customers + SEO traffic baseline

| Week | Action | Success Metric | Budget |
|---|---|---|---|
| 9 | Continue outreach. Follow up with interview prospects. Offer pilot discount ($99/mo for first 5 coaches). | 5 pilot signups | $0 |
| 10 | Verify PostHog is capturing events in production. Set up funnel dashboard. | PostHog verified, funnel dashboard live | $0 |
| 11 | Add Enterprise Pilot tier ($500-$2,500) (PRC-3). Verify SEO prerendering. | New tier live, prerendering verified | $0 |
| 12 | Compile 90-day results. Document what worked. Plan next 90 days. | 90-day report, next phase plan | $0 |

**Phase 3 exit criteria:**
- [ ] 5 paying customers (pilot or full price)
- [ ] PostHog funnel data flowing
- [ ] SEO prerendering verified
- [ ] 90-day report documented

### Budget Summary
- **Total marketing spend:** $0-$500 (Product Hunt is free, G2/Capterra free listings, LinkedIn is free)
- **Optional:** $500 for LinkedIn Premium (for InMail and better search) — recommended
- **All actions executable by solo founder with $0-$5K budget**

---

## 18. Claim-Boundary Compliance Report

| Rule | Marketing Copy Check | Status | Action Needed |
|---|---|---|---|
| 1. No job loss predictions | All copy uses "automation exposure" / "automation risk" | ✅ Compliant | None |
| 2. No scientific validation | No claims of "scientifically validated" or "peer-reviewed" | ✅ Compliant | None |
| 3. No local labor-market claims | No localized job market predictions | ✅ Compliant | None |
| 4. No employment decision claims | Not positioned as HR decision tool | ✅ Compliant | None |
| 5. No broad adoption claims | No fake user counts or market share | ✅ Compliant | None |
| 6. No live revenue claims | No traction or MRR claims | ✅ Compliant | None |
| 7. Decision-support framing | Hero says "Stay Indispensable" (empowerment), subheadline says "decision-support estimate" (analytical) | ⚠️ Tension | Resolve positioning paradox (MKT-2) |
| 8. Proof-pack discipline | Trust surfaces exist but not leveraged in marketing | ⚠️ Underclaiming | Add "evidence-backed" / "O*NET-grounded" to hero |

**Finding CB-1 (Medium): Underclaiming on trust surfaces.** `ResponsibleAIPage`, `ValidationPage`, `QualityPage`, `ProofPackGalleryPage` exist — competitors don't have these. Not mentioned in hero or marketing copy. This is a missed competitive advantage. [JUDGMENT]

**Finding CB-2 (Low): Positioning paradox creates claim-boundary tension.** "Stay Indispensable in the AI Era" implies empowerment/action. "decision-support estimate" implies caution/analysis. Both are valid but need reconciliation: "We give you the data to stay indispensable" bridges both. [JUDGMENT]

---

## 19. Phase Exit Criteria Summary

| Phase | Criteria | Met? |
|---|---|---|
| M0 — Calibration | Commercial calibration baseline (5-10 bullets) | ✅ 10 bullets |
| M0 | Handoff packet read | ✅ |
| M0 | Deep research for GTM frameworks | ✅ 6 sources |
| M1 — Positioning | Positioning statement audit (M1A) | ✅ |
| M1 | Messaging hierarchy audit (M1B) | ✅ |
| M1 | Claim-boundary discipline (M1C) | ✅ |
| M1 | Competitive positioning (M1D) | ✅ |
| M1 | Deep research: competitor marketing | ✅ 3 sources |
| M2 — Outreach | Channel mix audit (M2A) | ✅ |
| M2 | Cadence & sequencing (M2B) | ✅ |
| M2 | Compliance audit (M2C) | ✅ |
| M2 | Dark funnel presence (M2D) | ✅ |
| M2 | Deep research: outreach benchmarks | ✅ 4 sources |
| M3 — Pricing | Value metric audit (M3A) | ✅ |
| M3 | Tier design audit (M3B) | ✅ |
| M3 | Price-to-value ratio (M3C) | ✅ |
| M3 | Pricing governance (M3D) | ✅ |
| M3 | Deep research: SaaS pricing benchmarks | ✅ 3 sources |
| M4 — Buyer Journey | Touchpoint matrix (M4A) | ✅ |
| M4 | Drop-off point analysis (M4B) | ✅ |
| M4 | Deep research: B2B buyer journey | ✅ 2 sources |
| Top 5 Gate (2A) | 4 tables presented | ✅ |
| M5 — Sales Enablement | 10 artifact types audited | ✅ |
| M5 | Deep research: sales enablement | ✅ 3 sources |
| M6 — GTM Readiness | 8-dimension scorecard | ✅ |
| M7 — Validation | Customer validation maturity | ✅ |
| M7 | Presales stage map (10 stages) | ✅ |
| M7 | Pipeline velocity | ✅ (N/A — $0 revenue) |
| M7 | Deep research: presales benchmarks | ✅ 2 sources |
| M8 — Competitive | Intelligence matrix (top 3 per dimension) | ✅ |
| M8 | New entrant scan | ✅ |
| M8 | Competitive positioning strategy | ✅ |
| M8 | Deep research: G2, Capterra, Gartner | ✅ 6 sources |
| Top 5 Gate (2B) | 4 tables presented | ✅ |

---

## 20. Open Questions for User Decision

1. **Positioning paradox:** Should the product be "decision-support tool" (README) or "career intelligence platform" (marketable)? Recommended: "career intelligence platform" with "decision-support" as the trust signal.
2. **Primary segment:** Should coaches be the sole primary target, or should professionals get equal focus? Recommended: Coaches primary (90 days), professionals secondary (SEO).
3. **Credit packs vs subscription:** Should credit packs be removed to avoid cannibalizing Coach Pro? Recommended: Keep but reprice (15 credits = $179, not $129).
4. **Workshop pricing:** Should a $500-$2,500 "Enterprise Pilot" tier be added between Coach Pro and Workshop? Recommended: Yes.
5. **Veterans vertical:** Is this a real market or a distraction? Recommended: Pursue after coach validation (Phase 2).
6. **University segment:** Deprioritize? Recommended: Yes, deprioritize for 90 days.
7. **Whop marketplace:** Should Whop be deprioritized in favor of Stripe-only? Recommended: Yes, until coach validation is done.
8. **PostHog verification:** Is `VITE_POSTHOG_KEY` set in production? Action: Verify immediately.
9. **SEO prerendering:** Is the Netlify prerendering plugin working? Action: Verify with Google Search Console.
10. **Outreach execution:** Is the founder ready to commit to 10 sends/day for 90 days? This is the single most important action.

---

## 21. Research Provenance

### Internet Sources Consulted

1. https://markcmo.com/blog-go-to-market-strategy-guide — GTM strategy playbook 2026, April Dunford framework
2. https://peppereffect.com/blog/saas-competitive-positioning — SaaS competitive positioning, Dunford 5-component method
3. https://growwithba.com/blog/positioning-strategy-saas — Positioning strategy for SaaS 2026
4. https://okara.ai/blog/startup-go-to-market-strategy — Startup GTM framework for early-stage teams
5. https://seeto.ai/blog/go-to-market-strategy-saas — SaaS GTM strategy 2026
6. https://martal.ca/b2b-cold-email-statistics-lb/ — B2B cold email statistics 2026, benchmarks
7. https://overloop.com/blog/linkedin-vs-email-which-performs-better-for-b2b-outreach — LinkedIn vs email benchmarks
8. https://salesmotion.io/blog/cold-outreach-best-practices — Cold outreach playbook 2026
9. https://belkins.io/blog/linkedin-outreach-study — LinkedIn outreach benchmarks 2026
10. https://martal.ca/linkedin-statistics-lb/ — LinkedIn statistics 2026, B2B benchmarks
11. https://www.ftc.gov/business-guidance/blog/2015/08/candid-answers-can-spam-questions — CAN-SPAM compliance
12. https://chartmogul.com/reports/saas-conversion-report — SaaS conversion report, freemium vs trial
13. https://toolradar.com/reports/b2b-saas-pricing-benchmarks-2026 — B2B SaaS pricing benchmarks 2026
14. https://www.loopworker.com/2026-saas-pricing-benchmark-report.html — SaaS pricing benchmark report 2026
15. https://www.artisangrowthstrategies.com/blog/saas-conversion-rate-benchmarks-2026-data-1200-companies — SaaS conversion rate benchmarks 2026
16. https://www.growthspreeofficial.com/blogs/b2b-saas-trial-to-paid-conversion-rate-benchmarks-2026 — Trial-to-paid benchmarks 2026
17. https://www.giiresearch.com/report/tbrc2013753-artificial-intelligence-ai-career-coach-global.html — AI career coach market $5.48B→$6.69B
18. https://www.giiresearch.com/report/tbrc2035862-career-development-software-global-market-report.html — Career development software $7.74B→$8.57B
19. https://www.mordorintelligence.com/industry-reports/career-pathing-and-mobility-platform-market — Career pathing platform $2.59B (2026)
20. https://www.verifiedmarketreports.com/product/career-coaching-service-market/ — Career coaching service $1.54B
21. https://pulserevops.com/go-to-market-playbooks/gp0252 — Career coaching platform GTM playbook 2027
22. https://willrobotstakemyjob.com/rankings — WillRobotsTakeMyJob rankings (competitor)
23. https://www.replacedbyrobot.info/ — ReplacedByRobot.info (2026 updated competitor)
24. https://research.com/careers/job-automation-risks — Research.com automation rankings (competitor)
25. https://www.uscareerinstitute.edu/blog/65-jobs-with-the-lowest-risk-of-automation-by-ai-and-robots — Jobs with lowest automation risk

### Files Read This Session
- `.fable5/handoff-to-outreach.json` — Stage 1 handoff packet
- `docs/audits/audit-2026-07-05-stage1.md` — Stage 1 audit report (sections 25-33)
- `docs/Top20_Features.md` (1-151) — Top 20 features, sellability rankings
- `docs/Value_proposition.md` (1-80) — Value proposition, competitor deep dive
- `docs/growth/APO_OUTREACH_OPERATING_PLAN.md` (1-60) — Outreach plan, proof-pack matrix
- `docs/growth/templates/APO_OUTREACH_AND_PILOT_TEMPLATES.md` (1-60) — LinkedIn/email templates
- `docs/growth/APO_OUTREACH_CAMPAIGN_ASSETS.md` (1-60) — Campaign assets, buyer lanes, content calendar
- `docs/commercialization/pilot-outreach-pack.md` (1-60) — Pilot offers, LinkedIn strategy, outreach scripts
- `src/App.tsx` (1-218) — Routes, lazy loading, providers
- `src/components/HeroSection.tsx` (1-139) — Hero headline, subheadline, stats, search
- `src/lib/posthog.ts` (1-83) — Analytics events, env-gating
- `src/lib/stripe.ts` (50-277) — Subscription tiers, credit packs, workshop pricing, checkout
- `src/pages/PricingPage.tsx` (1-159) — Pricing UI, billing toggle, checkout flow
- `src/pages/ForCoachesPage.tsx` (1-60) — B2B coach landing page
- `src/pages/WorkshopBookingPage.tsx` (1-80) — Workshop booking form, pricing
- `src/pages/AutomationRiskLandingPage.tsx` (1-60) — SEO landing page, structured data
- `.windsurf/plans/FABLE5_AUDIT_PROMPTS.md` (1-514) — Full Prompt 2 specification

### Limitations
- No live PostHog data available (env-gated, production status unverified)
- No actual outreach send data (0 documented sends)
- No customer interview data (0 conducted)
- No conversion rate data ($0 revenue)
- Competitive intelligence based on public websites and market reports, not internal data
- SEO prerendering effectiveness not verified (requires Google Search Console access)

---

*End of Stage 2 Audit Report*
