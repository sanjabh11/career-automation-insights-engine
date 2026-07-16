# Phase 0: Audit Brief

**Audit ID:** caie-niche-positioning-2026-07-16
**Date:** 2026-07-16
**Scope:** Deep (with codebase)
**Evidence mode:** Evidence-limited (no first-party commercial evidence)

---

## Decision Statement

> Which niche should the Career Automation Insights Engine target first, and how should it be positioned to win?

## Customer Segments Under Consideration

1. **B2C mid-career knowledge workers** (28-45) — developers, writers, marketers, analysts, consultants
2. **B2B career coaches/resume writers** — 109K+ globally, need data credibility for client work
3. **B2B enterprise HR/CHROs** — Fortune 1000, need board-ready AI exposure audits
4. **B2C/B2G veterans/transitioning service members** — 200K+/year, MOC crosswalk need
5. **B2B bootcamps/training providers** — need automation risk data for curriculum/marketing

## Geography

US primary (O*NET/BLS data backbone). Global English secondary (UK/Canada/Australia crosswalk scaffolding exists in codebase).

## Business Model

Current: SaaS subscription (Free / $29 Defender / $149 Coach Pro) + PAYG ($20/report credits). Model will be audited, not replaced.

## Constraints

- **Budget:** Bootstrap ($0-$5K marketing spend)
- **Team:** Solo operator (founder)
- **Timeline:** First paying customer within 30-90 days ideal
- **Product:** Fully built, not rebuilding — audit informs positioning, not features

## Evidence Sources

| Source | Type | Availability |
|---|---|---|
| Codebase (src/, supabase/, docs/) | codebase_evidence | ✅ Available |
| README.md, STATUS.md | product_promise | ✅ Available |
| Prior GTM strategy (archived) | competitor_intel | ✅ Available |
| Web research (Exa search) | competitor_intel, pricing_signal | ✅ Available |
| Free-tier usage data | analytics_data | ⚠️ May exist in code (localStorage) but no live DB access |
| Customer conversations | customer_outcome, user_quote | ❌ None |
| Sales data | sales_data | ❌ None ($0 revenue) |
| Support tickets | support_ticket | ❌ None |

## Conflicts of Interest

1. **Founder as decision owner** — self-interest bias toward positive outcomes
2. **AI agent as auditor** — lacks human market intuition, may miss qualitative signals

## Evidence Limitations

- **Evidence-limited mode is ACTIVE.** No first-party commercial evidence exists. All subsequent gates are capped at CONDITIONAL_GO. No full GO is possible until first-party customer evidence is recorded.
- Zero executed experiments means validation confidence = 0 and lifecycle status = VALIDATION_PENDING after P5.

## Unknowns

- Actual user count and signup numbers
- Free-to-paid conversion rate
- User behavior patterns and feature usage
- Customer feedback and support tickets
- Competitor revenue and traction data
- SEO ranking and organic traffic data

## Gate Decision

**CONDITIONAL_GO** — Proceed to Phase 1 with evidence-limited mode acknowledged.
