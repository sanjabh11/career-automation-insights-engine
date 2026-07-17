# Phase 4: Product-Market Alignment and Gap Classification

**Audit ID:** caie-niche-positioning-2026-07-16
**Date:** 2026-07-16

---

## 4.1 Gap Table — Beachhead: B2B Career Coaches

| Gap ID | Gap Type | Description | Evidence | Severity | Action Required |
|---|---|---|---|---|---|
| G-001 | **Distribution gap** | Product has never been marketed to career coaches. No coach has seen ForCoachesPage.tsx. Zero outreach to ICF chapters, coach associations, or LinkedIn coach community. | E-015 ($0 revenue), E-003 (page exists but no traffic) | 🔴 CRITICAL | Active outreach: cold email 50 coaches, post in ICF forums, LinkedIn content, coach association partnerships |
| G-002 | **Proof gap** | No testimonials, case studies, demos, or social proof. ForCoachesPage has no "trusted by" section, no sample report preview, no coach quotes. | E-015 (no customer evidence), EG-001 (no customer outcomes) | 🔴 CRITICAL | Create sample white-label report, record demo video, offer free reports to 5 coaches in exchange for testimonials |
| G-003 | **Adoption gap** | No coach-specific onboarding or trial. Free tier is B2C-focused (3 APO checks). Coaches can't easily try the white-label report feature without paying $149. | E-004 (pricing structure), E-003 (ForCoachesPage) | 🟡 HIGH | Add coach-specific trial: 1 free white-label report, guided onboarding wizard, sample client setup |
| G-004 | **Positioning gap** | Product is positioned as "decision-support APO dashboard" (generic, technical). Should be positioned as "white-label automation defense reports for career coaches" (specific, outcome-focused). | E-001 (README framing), E-002 (homepage hero) | 🟡 HIGH | Reposition ForCoachesPage as primary landing page for coach outreach. Update messaging from "APO dashboard" to "Automation Defense Report Generator for Career Coaches" |
| G-005 | **Pricing gap** | Credit packs ($49-$299) are priced higher than the $20/report mentioned on ForCoachesPage. Inconsistent pricing messaging. | E-004 (stripe.ts: $49 for 5 credits = $9.80/report), E-003 (ForCoachesPage: "$20/report") | 🟢 MEDIUM | Align pricing messaging: $9.80/report for Starter pack, $8.60/report for Professional pack — better than advertised $20/report |
| G-006 | **Evidence gap** | No first-party evidence that coaches want this product. No customer conversations, no survey data, no pilot results. | EG-001, EG-002, EG-003, EG-004 | 🔴 CRITICAL (but expected in evidence-limited mode) | Execute Phase 5 experiments to generate first-party evidence |

### Need → Outcome → Promise → Capability → Proof → Positioning → Experiment Map

| Need | Customer Outcome | Product Promise | Actual Capability | Proof | Positioning | Experiment |
|---|---|---|---|---|---|---|
| "I need data-credentialed reports for clients" | Coaches deliver branded, O*NET-grounded automation defense reports | "White-label reports that sell" | ✅ CounselorReportGenerator + O*NET data + branding | ❌ No testimonials | "Automation Defense Report Generator for Career Coaches" | E-001: Free report to 5 coaches → testimonial |
| "ChatGPT lacks data credibility" | Coaches cite O*NET source IDs, task-level analysis, uncertainty bounds | "O*NET-Grounded Analysis" | ✅ 19K+ tasks, knowledge, abilities, technologies | ❌ No demo | "The only career tool grounded in O*NET 30.3 government data" | E-002: Demo video showing O*NET source citations |
| "I need to assess multiple clients" | Coaches run bulk occupation analysis for 15+ clients/mo | "15 white-label reports/month" | ✅ Coach Pro tier + bulk analysis | ❌ No case study | "Scale your coaching practice with bulk automation defense reports" | E-003: Pilot with 1 coach, measure time saved |
| "I need to show skills to build" | Coaches show clients skill adjacency graph + bridge roles + learning paths | "Bridge Role pathfinding + Skill Adjacency Graph" | ✅ A* algorithm + pgvector + Gemini embeddings | ❌ No proof | "Don't just show risk — show the path forward with skill-overlap-based bridge roles" | E-004: Show bridge role feature in demo |

---

## 4.2 Gap Table — Secondary: B2C Knowledge Workers (Freemium Channel)

| Gap ID | Gap Type | Description | Evidence | Severity | Action Required |
|---|---|---|---|---|---|
| G-007 | **Distribution gap** | 50+ SEO pages exist but no SEO ranking data. No content marketing. No Reddit/HN presence. | E-008 (SEO pages exist) | 🟡 HIGH | Submit sitemap to Google, build backlinks, post on Reddit/HN, content marketing |
| G-008 | **Positioning gap** | Homepage positions as "APO Dashboard" (technical jargon). Should be "AI Career Defense Tool" or "Automation Risk Analyzer" (user language). | E-002 (hero section) | 🟢 MEDIUM | A/B test headline variants |
| G-009 | **Pricing gap** | $29/mo Defender is above $20/mo ChatGPT/Claude anchor. Value differentiation not clear enough. | E-013 (pricing benchmarks) | 🟡 HIGH | Clarify value: "ChatGPT gives generic advice. We give O*NET-grounded, task-level analysis with bridge roles and Monte Carlo confidence intervals." |
| G-010 | **Competition gap** | 12+ free competitors. Kairo is free beta with same target audience. Product's free tier (3 APO checks) is more restrictive than competitors. | E-009 (competitor landscape) | 🔴 CRITICAL (but B2C is not primary revenue) | Accept B2C as freemium acquisition. Don't try to win B2C — use it for SEO + email capture. |

---

## 4.3 Gap Table — Tertiary: Enterprise HR (Phase 3+ Expansion)

| Gap ID | Gap Type | Description | Evidence | Severity | Action Required |
|---|---|---|---|---|---|
| G-011 | **Product gap** | No SOC 2, GDPR, ISO 27001 compliance. No HRIS integration. EnterpriseTeamDashboard is basic compared to JobRoute/INOP. | E-010 (enterprise competitors) | 🔴 CRITICAL (for enterprise) | Not actionable for beachhead — defer to Phase 3+ |
| G-012 | **Distribution gap** | No enterprise sales capacity. Solo operator can't do 3-6 month sales cycles. | E-010 | 🔴 CRITICAL (for enterprise) | Defer enterprise to post-beachhead validation |

---

## 4.4 Positioning Hypotheses

### H-001: Coach White-Label Report Hypothesis (PRIMARY)
> **Career coaches will pay $149/mo for white-label, O*NET-grounded automation defense reports because ChatGPT lacks data credibility and no coaching platform offers automation-specific white-label reports.**

**Evidence bundle**: E-003 (ForCoachesPage promise), E-004 (pricing), E-005 (codebase capability), E-012 (coach landscape), E-013 (pricing benchmarks)
**Bundle satisfied**: ✅ 3 HIGH items (E-003, E-004, E-005) + 2 MEDIUM items (E-012, E-013)
**Counter-evidence**: B2C market is saturated (E-009), but this hypothesis is B2B, not B2C. Coach WTP validated at $149/mo by Intry and CoachStackHub.
**Hypothesis state**: `unresolved` — needs first-party validation

### H-002: O*NET Grounding Differentiation Hypothesis
> **O*NET 30.3 data grounding is a defensible differentiator that career coaches value because it provides government-source credibility that ChatGPT and generic AI tools cannot replicate.**

**Evidence bundle**: E-001 (README product promise), E-005 (codebase: 19K+ tasks), E-003 (ForCoachesPage: "O*NET-Grounded Analysis")
**Bundle satisfied**: ✅ 3 HIGH items
**Counter-evidence**: AIJobImpactCalculator also uses O*NET + ILO + Brookings + BLS + WEF. But it's B2C free, not B2B white-label.
**Hypothesis state**: `unresolved` — needs first-party validation

### H-003: Bridge Role Pathfinding Hypothesis
> **Bridge role pathfinding (A* algorithm via skill overlap) is a unique capability that no competitor offers, and coaches will use it to show clients actionable transition paths.**

**Evidence bundle**: E-005 (codebase: find-bridge-roles), E-003 (ForCoachesPage features)
**Bundle satisfied**: ✅ 2 HIGH items
**Counter-evidence**: Kairo offers "adjacent role paths with safer moves based on skills overlap" — similar concept. But Kairo is B2C free beta, not B2B white-label.
**Hypothesis state**: `unresolved` — needs first-party validation

### H-004: SEO Acquisition Hypothesis
> **The 50+ pre-built SEO occupation pages at /automation-risk/:slug will drive organic traffic that converts to free-tier signups, which funnel to coach outreach via upgrade prompts.**

**Evidence bundle**: E-008 (SEO pages exist), E-007 (analytics infrastructure)
**Bundle satisfied**: ✅ 2 HIGH items + 1 MEDIUM
**Counter-evidence**: 12+ free competitors have SEO head start. WillRobotsTakeMyJob has 8+ years of domain authority.
**Hypothesis state**: `unresolved` — needs first-party validation

---

## 4.5 Positioning Statement (Proposed)

### Current Positioning
> "Decision-support APO dashboard for career automation exposure, proof-pack review, CI regression gates, and source-labeled workforce data pipelines."

**Problems**: Technical jargon ("APO," "proof-pack," "CI regression gates"). Describes the product, not the customer outcome. No mention of the primary buyer (coaches). Sounds like a developer tool, not a coaching tool.

### Proposed Positioning (Beachhead)
> **"The white-label automation defense report generator for career coaches. Grounded in O*NET 30.3 government data. Branded with your logo. Ready in minutes — not hours of manual research."**

**Why this works**:
- Names the buyer ("career coaches")
- Names the output ("white-label automation defense reports")
- Names the differentiator ("O*NET 30.3 government data")
- Names the benefit ("branded with your logo, ready in minutes")
- Contrasts with status quo ("not hours of manual research")
- No jargon ("APO," "proof-pack," "CI regression gates" removed)

### Tagline Options
1. "Reports that sell. Data that sticks." — emphasizes revenue + credibility
2. "Your brand. O*NET data. Their trust." — emphasizes white-label + source credibility
3. "Stop using ChatGPT for client reports. Use O*NET." — direct competitive positioning
4. "The only career tool grounded in O*NET 30.3 government data." — authority positioning

---

## 4.6 Evidence Bundle Summary

| Hypothesis | Bundle Items | Satisfied? | Counter-Evidence | State |
|---|---|---|---|---|
| H-001 (Coach white-label) | E-003, E-004, E-005, E-012, E-013 | ✅ 3 HIGH + 2 MEDIUM | B2C saturation (but this is B2B) | unresolved |
| H-002 (O*NET grounding) | E-001, E-005, E-003 | ✅ 3 HIGH | AIJobImpactCalculator uses O*NET too (but B2C free) | unresolved |
| H-003 (Bridge roles) | E-005, E-003 | ✅ 2 HIGH | Kairo offers similar (but B2C free beta) | unresolved |
| H-004 (SEO acquisition) | E-008, E-007 | ✅ 2 HIGH + 1 MEDIUM | 12+ competitors have SEO head start | unresolved |

---

## Gate Decision

**CONDITIONAL_GO** — Gap analysis complete with 12 gaps classified across 3 segments. 4 hypotheses formed with evidence bundles. Proposed positioning statement developed. Evidence-limited mode active. **Requires user approval before Phase 5.**

---

## ⏸️ USER APPROVAL GATE

**Recommendation**: Proceed to Phase 5 (experiment design) with the following priorities:

1. **Primary hypothesis (H-001)**: Coach white-label report — design cold outreach experiment to 20 career coaches
2. **Secondary hypothesis (H-004)**: SEO acquisition — design organic traffic measurement experiment
3. **Tertiary hypothesis (H-002)**: O*NET grounding — design demo/video experiment

**Proposed positioning**: "The white-label automation defense report generator for career coaches. Grounded in O*NET 30.3 government data."

**Top 3 gaps to close**:
1. G-001 (Distribution) — active coach outreach
2. G-002 (Proof) — testimonials and demos
3. G-003 (Adoption) — coach-specific trial
