# Phase 5: Experiment Design

**Audit ID:** caie-niche-positioning-2026-07-16
**Date:** 2026-07-16
**Lifecycle status:** VALIDATION_PENDING (designed experiments, not executed)

---

## 5.1 Experiment Portfolio

| Experiment | Hypothesis | Type | Duration | Cost | Priority |
|---|---|---|---|---|---|
| EXP-001 | H-001 (Coach white-label) | Cold outreach | 2 weeks | $0 | 🔴 P0 — Start immediately |
| EXP-002 | H-001 (Coach white-label) | Content marketing | 1 week | $0 (existing tools) | 🔴 P0 — Start immediately |
| EXP-003 | H-002 (O*NET grounding) | A/B test | 2 weeks | $0 | 🟡 P1 — Run parallel with EXP-001 |
| EXP-004 | H-004 (SEO acquisition) | Organic measurement | 30 days | $0 | 🟡 P1 — Start immediately |

---

## 5.2 EXP-001: Coach Cold Outreach — Free Report Offer

### Design
Contact 20 career coaches via LinkedIn DM or email with a personalized offer:

> "Hi [Name], I noticed you help clients navigate career transitions. I've built a tool that generates white-label automation defense reports grounded in O*NET 30.3 government data — branded with your logo, ready in minutes. I'd like to generate one free report for one of your clients. You keep it, no strings attached. Would that be useful?"

### Selection Criteria for Coaches
- Active on LinkedIn (posted in last 30 days)
- Profile mentions "career coach," "career counselor," "resume writer," or "executive coach"
- 500+ connections (established enough to have clients)
- US or global English (UK/Canada/Australia)

### Metrics
| Metric | Target | Stop Condition |
|---|---|---|
| Response rate | >20% (4/20) | 0 responses after 50 messages → reposition |
| Free report acceptance | >30% of responses | >50% respond but 0 accept → messaging gap |
| Willingness to pay | >25% of free report recipients | >50% accept but 0 WTP → pricing/proof gap |

### What This Proves
If successful: validates that coaches (1) see the problem, (2) value the solution, and (3) are willing to pay for it. This is the critical first-party evidence needed to move from CONDITIONAL_GO toward GO.

### What This Does NOT Prove
- Does not prove scalability (20 coaches is not a market)
- Does not prove retention (one-time free report ≠ recurring revenue)
- Does not prove the $149/mo price point (free ≠ paid)

---

## 5.3 EXP-002: Coach Demo Video — LinkedIn Content Test

### Design
Create a 3-minute Loom/video showing:
1. Search for an occupation (e.g., "Financial Analyst")
2. Run APO analysis — show task-level breakdown
3. Generate white-label report with custom branding (logo, colors)
4. Show O*NET source citations in the report
5. Show bridge role pathfinding (skill overlap → adjacent safer roles)

Post on LinkedIn with:
> "I built a tool that generates white-label automation defense reports for career coaches — grounded in O*NET 30.3 government data, branded with your logo, ready in minutes. Here's a 3-min demo. #careercoaching #careerdevelopment #AI"

### Metrics
| Metric | Target | Stop Condition |
|---|---|---|
| Inbound inquiries from coaches | >3 | 0 inquiries after 1000 views → messaging issue |
| LinkedIn post views | >500 | <100 views in 7 days → distribution issue |
| Reactions/comments | >20 | High views, 0 engagement → content quality issue |

---

## 5.4 EXP-003: O*NET Source Citation A/B Test

### Design
Split the 20 coaches from EXP-001 into two groups of 10:

**Variant A (O*NET emphasis)**:
> "I've built a tool that generates white-label automation defense reports grounded in O*NET 30.3 government data — the same database used by the US Department of Labor."

**Variant B (AI emphasis)**:
> "I've built a tool that generates white-label automation defense reports powered by AI analysis — showing exactly which tasks are at risk and what to do about it."

### Metrics
| Metric | Target |
|---|---|
| Response rate A vs B | A > B by >10% |
| Acceptance rate A vs B | A > B |

### What This Proves
If A > B: O*NET government data sourcing is a perceived differentiator that coaches value. Validates H-002.
If B > A or no difference: O*NET grounding may not be a perceived differentiator. Product needs a different value prop.

---

## 5.5 EXP-004: SEO Organic Traffic Baseline

### Design
1. Submit `sitemap.xml` to Google Search Console (already exists in `/public/sitemap.xml`)
2. Verify domain ownership in Search Console
3. Track organic impressions and clicks for 30 days
4. Identify which occupation pages get impressions
5. Identify what search queries drive impressions

### Metrics
| Metric | Target | Stop Condition |
|---|---|---|
| Organic impressions (30 days) | >100 | 0 impressions → indexing or authority issue |
| Organic clicks (30 days) | >10 | Impressions but 0 clicks → title/meta optimization |
| Click-through rate | >2% | <0.5% CTR → SERP snippet optimization |

---

## 5.6 Success Metrics Summary

| Experiment | Success Looks Like | Failure Looks Like |
|---|---|---|
| EXP-001 | 4+ coaches respond, 2+ accept free report, 1+ expresses WTP | 0 responses after 50 messages |
| EXP-002 | 3+ inbound coach inquiries, 500+ views | 0 inquiries after 1000 views |
| EXP-003 | Variant A (O*NET) outperforms Variant B (AI) by >10% | No difference or B > A |
| EXP-004 | 100+ organic impressions in 30 days | 0 impressions (indexing issue) |

---

## 5.7 Validation Status

| Field | Value |
|---|---|
| `market_validation_status` | `validation_pending` |
| `current_phase` | `VALIDATION_PENDING` |
| `validation_confidence` | 0 |
| `experiment_count` | 4 (designed, 0 executed) |
| `hypothesis_count` | 4 (all `unresolved`) |

**No experiment has been executed. No first-party results exist. Validation confidence is 0. All hypotheses remain `unresolved`. This is the expected state at the end of Phase 5 in evidence-limited mode.**

---

## Gate Decision

**CONDITIONAL_GO** — 4 experiments designed with metrics, sample sizes, durations, and stop conditions. None executed. Lifecycle status: VALIDATION_PENDING. Proceed to Phase 6: Codebase Reconnaissance.
