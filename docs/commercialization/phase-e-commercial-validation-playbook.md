# Phase E Commercial Validation Playbook

Status date: 2026-05-31

Phase E does not complete commercial validation. It prepares the instrumentation, partner-review workflow, and proof gates required before any commercial confidence score is raised.

## Evidence Gates

| Gate | Required evidence | Current status | Boundary |
| --- | --- | --- | --- |
| Live MRR > $0 | Stripe live-mode active subscription, payment transaction, and MRR export showing `total_mrr > 0` | Blocked on owner/live payment proof | Test-mode checkout and source code do not prove revenue |
| >=3 committed design partners | Named partners with accepted pilot scope, next step, and contact permission | Manual founder-led work required | A lead, sample download, or polite reply is not commitment |
| Documented outcomes | Permissioned case-study row with baseline workflow, artifact reviewed, outcome, quote, and explicit does-not-prove text | Template and fields prepared | A case study does not prove market-wide demand or career outcomes |
| Bootcamp CTA safe | Runtime has no placeholder price ID, or a real live Stripe price is supplied | Bootcamp checkout hidden pending live price | Hidden CTA does not prove bootcamp demand |

## Activation And Retention Events

Use PostHog funnels and Supabase `analytics_events` exports with the same event contract:

| Event | Use | Boundary |
| --- | --- | --- |
| `search_success` | Search-to-APO funnel | Query strings are redacted/truncated before persistence |
| `activation_apo_result_viewed` | Primary APO activation candidate | Stores occupation code and latency, not private resume/student data |
| `activation_proof_artifact_created` | Coach/commercial artifact activation | Stores artifact type and buyer segment only |
| `commercial_lead_captured` | Consent-backed lead capture signal | Does not prove revenue or commitment |
| `founder_led_pilot_outreach_click` | Manual outreach learning | Clicks do not prove consent or buyer adoption |
| `checkout_completed` | Revenue conversion candidate | Must be reconciled to Stripe live-mode and active subscription state |

## Design-Partner Onboarding

1. Select segment: career coach, career center, workforce board, L&D, or paid pilot.
2. Confirm planning-only use: no hiring, firing, pay, promotion, discipline, layoff, or individual-ranking use.
3. Review an artifact: sample report, cohort proof pack, or role-level CSV audit.
4. Capture feedback: usefulness score, trust objection, missing source, local-data need, and next action.
5. Capture paid signal separately from encouragement.
6. Capture case-study permission and redaction level before using any quote.

## Case-Study Template

| Field | Prompt |
| --- | --- |
| `baseline_workflow` | What workflow existed before the APO proof artifact? |
| `artifact_reviewed` | Which exact artifact did the partner review? |
| `measured_change` | What changed after review? |
| `approved_quote` | What exact quote may be used publicly, and who approved it? |
| `does_not_prove` | Which claims are explicitly unsupported by this case study? |

## Source Anchors

- PostHog retention docs, as of 2026-05-31: retention needs a start event and return event, and cohort sizes must be interpreted explicitly.
- PostHog funnel docs, as of 2026-05-31: funnels should use clear sequential steps and simple success events before adding optional complexity.
- Stripe checkout docs, as of 2026-05-31: Checkout Sessions should reference real Stripe Price objects; test mode or sandbox objects do not prove live revenue.
