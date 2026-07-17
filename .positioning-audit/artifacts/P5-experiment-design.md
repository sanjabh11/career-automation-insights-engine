# Phase 5: Experiment Design

**Audit ID:** caie-niche-positioning-2026-07-16
**Date:** 2026-07-17
**Lifecycle status:** VALIDATION_PENDING (designed experiments, not executed)

---

## 5.1 Experiment Portfolio

| Experiment | Hypothesis | Type | Duration | Cost | Priority |
|---|---|---|---|---|---|
| EXP-001 | H-001 (Coach white-label) | Warm-referral discovery interviews | 2-3 weeks | $0 | P0 — Start immediately |
| EXP-002 | H-001 (Coach white-label) | Static sample report demo | Concurrent with EXP-001 | $0 | P0 — Start immediately |
| EXP-003 | H-002 (O*NET grounding) | A/B test | 2 weeks | $0 | DEFERRED — Post-pilot only |
| EXP-004 | H-004 (SEO acquisition) | Organic measurement | 30 days | $0 | DEFERRED — Post-pilot only |
| EXP-005 | H-005 (WTP $49) | Paid pilot | 30 days | $0 | P1 — After EXP-001/002 |
| EXP-006 | H-001 (Coach Pro pricing) | Sequential price test | 4 weeks | $0 | DEFERRED — After EXP-005 |

---

## 5.2 EXP-001: 12 Structured Discovery Interviews with Career-Transition Coaches

### Design
Recruit 12 independent career-transition coaches (8 US, 4 Canada) via **warm referrals and opt-in communities only**. No cold outreach. No LinkedIn DMs to strangers. No pitch in the first 20 minutes. 30-min interviews with consistent script: workflow, manual research time, tools, trust concerns, buyer process, WTP.

After discovery questions, show the existing /sample-report page with **pseudonymous data** and consented notes. No live report generation. No free reports. No testimonials in exchange for free reports.

Exclude employee-selection, school-placement, HR-decision uses.

### Selection Criteria for Coaches
- Warm referral from founder's network or opt-in coaching communities
- Profile mentions "career coach," "career counselor," "resume writer," or "executive coach"
- US or Canada only (pilot boundary)
- Willing to provide consented notes

### Metrics
| Metric | Target | Stop Condition |
|---|---|---|
| Coaches reporting recurring costly workflow | >=8/12 | <4/12 → recycle ICP/message/artifact |
| Coaches qualifying for pilot | >=6/12 | <3/12 qualify → recycle ICP before pilot |
| Qualitative themes | Trust, time saved, delivery format, pricing sensitivity | — |

### What This Proves
If successful: validates that coaches (1) see the problem, (2) value the solution, and (3) are willing to pay for it. This is the critical first-party evidence needed to move from CONDITIONAL_GO toward GO.

### What This Does NOT Prove
- Does not prove scalability (12 coaches is not a market)
- Does not prove retention (one-time discovery call ≠ recurring revenue)
- Does not prove the $149/mo price point (discovery ≠ paid subscription)

---

## 5.3 EXP-002: Static Sample Report Demo During Discovery Interviews

### Design
After discovery questions in EXP-001, show the existing /sample-report page with pseudonymous data. Capture reactions: clarity, trust, perceived value, concerns. No live report generation, no free reports, no testimonials in exchange for free reports.

### Metrics
| Metric | Target | Stop Condition |
|---|---|---|
| Coaches who say the artifact would save time | >=6/12 | 0/12 see value → artifact or positioning needs redesign |
| Coaches who express concern about credibility or format | Track qualitatively | — |
| Qualitative feedback on proof boundary text and source labeling | Track qualitatively | — |

---

## 5.4 EXP-003: O*NET Source Citation A/B Test (DEFERRED)

**DEFERRED until post-pilot.** Do not run until coach motion clears paid-pilot gate.

### Design
Split 20 coaches into two groups of 10:

**Variant A (O*NET emphasis)**:
> "I've built a tool that generates coach-branded automation defense reports grounded in O*NET government data — the same database used by the US Department of Labor."

**Variant B (AI emphasis)**:
> "I've built a tool that generates coach-branded automation defense reports powered by AI analysis — showing exactly which tasks are at risk and what to do about it."

### Metrics
| Metric | Target |
|---|---|
| Response rate A vs B | A > B by >10% |
| Acceptance rate A vs B | A > B |

### What This Proves
If A > B: O*NET government data sourcing is a perceived differentiator that coaches value. Validates H-002.
If B > A or no difference: O*NET grounding may not be a perceived differentiator. Product needs a different value prop.

---

## 5.5 EXP-004: SEO Organic Traffic Baseline (DEFERRED)

**DEFERRED until coach motion clears paid-pilot gate.**

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

## 5.5b EXP-005: $49 Paid Founding Pilot (5 Credits, 30 Days, 8 Coaches)

### Design
Offer 8 qualified coaches from EXP-001 a 30-day, $49, 5-credit pilot. No free reports for testimonials. Require human-review acknowledgement and pseudonymous client labels. Prohibit employment decisions and predictive claims. Record: checkout, report completion, repeat use, feedback, permission (separately). Testimonials require explicit approval after genuine use + proof boundary.

### Metrics
| Metric | Target | Stop Condition |
|---|---|---|
| Paid checkouts | >=3/8 | <2/8 pay → recycle positioning/ICP/pricing |
| Completed human-reviewed uses | >=2/8 | — |
| Repeat use within 30 days | Track qualitatively | — |

---

## 5.5c EXP-006: Sequential Coach Pro Price Test ($149 then $99) — DEFERRED

**DEFERRED until subscription checkout mechanics proven via paid pilot (EXP-005).**

### Design
After pilot, test Coach Pro pricing sequentially. Offer $149/mo to next 6 qualified coaches. If none convert, offer $99/mo to following 6. No underpowered A/B tests — sequential only.

### Metrics
| Metric | Target | Stop Condition |
|---|---|---|
| Conversion at $149 | >=1/6 | 0/6 AND 0/6 at $99 → recycle |
| Conversion at $99 (if $149 fails) | >=2/6 | — |

---

## 5.6 Success Metrics Summary

| Experiment | Success Looks Like | Failure Looks Like |
|---|---|---|
| EXP-001 | >=8/12 report costly workflow, >=6/12 qualify for pilot | <4/12 report costly workflow |
| EXP-002 | >=6/12 say artifact would save time | 0/12 see value after demo |
| EXP-003 | Variant A (O*NET) outperforms Variant B (AI) by >10% | No difference or B > A |
| EXP-004 | 100+ organic impressions in 30 days | 0 impressions (indexing issue) |
| EXP-005 | >=3/8 paid checkouts, >=2/8 completed human-reviewed uses | <2/8 pay |
| EXP-006 | >=1/6 convert at $149 or >=2/6 at $99 | 0/6 at both price points |

---

## 5.7 Validation Status

| Field | Value |
|---|---|
| `market_validation_status` | `validation_pending` |
| `current_phase` | `VALIDATION_PENDING` |
| `validation_confidence` | 0 |
| `experiment_count` | 6 (designed, 0 executed) |
| `hypothesis_count` | 5 (all `unresolved`) |

**No experiment has been executed. No first-party results exist. Validation confidence is 0. All hypotheses remain `unresolved`. This is the expected state at the end of Phase 5 in evidence-limited mode.**

---

## Gate Decision

**CONDITIONAL_GO** — 6 experiments designed with metrics, sample sizes, durations, and stop conditions. None executed. Lifecycle status: VALIDATION_PENDING. Proceed to Phase 6: Codebase Reconnaissance.

**Key constraint:** EXP-001 and EXP-002 use warm referrals only. No cold outreach, no LinkedIn DMs to strangers, no pitch in first 20 minutes, static sample only with pseudonymous data. EXP-003, EXP-004, and EXP-006 are deferred until post-pilot. EXP-005 is the paid pilot gate.
