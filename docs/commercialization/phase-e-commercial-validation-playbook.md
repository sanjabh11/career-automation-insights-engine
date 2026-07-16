# Phase E Commercial Validation Playbook

Status date: 2026-06-05

Phase E does not complete commercial validation. It prepares the instrumentation, partner-review workflow, and proof gates required before any commercial confidence score is raised.

As of the latest 2026-06-05 full-local commercial verification, the repo-local optional gates pass, including browser journey, accessibility smoke, network/source checks, npm audit, typecheck, diff hygiene, and full-local release coverage. Phase E still remains `pilot-only` and `owner_evidence_required` until the owner-held payment, revenue, partner, outcome, and manual WCAG gates are accepted by the closeout commands below.

For the current owner-side blockers, use [Part I Owner Evidence Blocker Runbook](./part-i-owner-evidence-blocker-runbook.md). It contains the exact Stripe test-mode, live-MRR, partner/outcome intake, and final closeout sequence to hand to Comet or run locally without weakening the fail-closed gates.

## Evidence Gates

| Gate | Required evidence | Current status | Boundary |
| --- | --- | --- | --- |
| Live MRR > $0 | Stripe live-mode active subscription, payment transaction, and MRR export showing `total_mrr > 0` | Blocked on owner/live payment proof | Test-mode checkout and source code do not prove revenue |
| >=3 committed design partners | Named partners with accepted pilot scope, next step, and contact permission | Manual founder-led work required | A lead, sample download, or polite reply is not commitment |
| Documented outcomes | Permissioned case-study row with baseline workflow, artifact reviewed, outcome, quote, and explicit does-not-prove text | Template and fields prepared | A case study does not prove market-wide demand or career outcomes |
| Bootcamp CTA safe | Runtime has no placeholder price ID, or a real live Stripe price is supplied | Bootcamp checkout hidden pending live price | Hidden CTA does not prove bootcamp demand |

## Redacted Evidence Intake

Use `docs/commercialization/live-gate-evidence-template.json` only as a schema template for credential-gated live proof: Stripe test checkout, production calibration, authenticated live artifact e2e, and live MRR. After any owner-run proof command passes, run `npm run compose:live-gate-evidence -- --write --allow-partial --output docs/commercialization/live-gate-evidence.local.json` to compose the gitignored redacted evidence file from accepted `*-proof-latest.json` artifacts, then run `npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-any` to verify at least one accepted item. You can also put owner-held, redacted proof metadata in `docs/commercialization/live-gate-evidence.local.json`, pass another path with `LIVE_GATE_EVIDENCE_PATH`, or pass the path directly to the final ledger with `npm run verify:remediation-gates -- --live-evidence <path>`. The default local file is ignored by git. Complete validation still uses `npm run compose:live-gate-evidence -- --write --require-complete --output docs/commercialization/live-gate-evidence.local.json` and `npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-complete` before `npm run verify:remediation-gates -- --require-complete`; the final live-gate path must fail closed until all four credential-gated items are accepted. When you need to refresh the tracked external-gate artifacts, run `npm run verify:remediation-gates:write -- --live-evidence <path> --commercial-evidence <path> --manual-wcag-evidence <path> --require-complete`.

The evidence file must contain artifact hashes, summary fields, and `ownerEvidenceArchive` policy metadata only. Do not store Stripe secret keys, Supabase service-role keys, raw Checkout Session payloads, hosted Stripe Checkout/Billing/Invoice URLs, Stripe or Supabase dashboard URLs, subscription exports, invoice exports, dashboard screenshots, customer emails, auth tokens, private profile URLs, meeting/calendar links, partner contact details, or private outcome notes in the repository. The verifier rejects high-confidence secret and private-contact patterns, rejects future-dated `asOf` or `observedAt` metadata, rejects `observedAt` values later than `asOf`, and only upgrades a credential-gated live proof gate when the gate-specific redacted evidence item passes validation, including the owner-held archive policy fields. Use the commercial evidence records template for design-partner commitments and documented outcomes.

The composer fails closed when any source artifact is missing, skipped, failed, or lacks the summary fields required by the live-gate schema. It writes only to the ignored local evidence file unless you pass `--output <path>`, and it does not make skipped artifacts count as proof.

When the live-gate composer writes a redacted local file, its JSON output includes three follow-up commands: `validateLiveEvidence` for the redacted file itself, `finalReadOnlyLedger` for the fail-closed final remediation gate, and `refreshTrackedLedger` for intentionally refreshing tracked closeout artifacts. The final ledger commands still require a commercial evidence records path; do not treat live-gate proof alone as Phase E completion.

## Owner Evidence Workspace Prep

Run `npm run verify:owner-evidence-prep` for a read-only summary of missing owner-held inputs before attempting the final closeout. It reports required variable names, gitignored local evidence files, source proof artifact status, and placeholder counts without printing secret values, partner names, customer data, contracts, private notes, quotes, or hash salts.

Run `npm run prepare:owner-evidence -- --write` only when you want local scaffolding created. It creates `.env.local`, `docs/commercialization/commercial-evidence-intake.local.json`, and `docs/commercialization/manual-wcag-evidence.local.json` only if they are absent, and all three paths are ignored by git. The `.env.local` file contains blank variable names plus a `set -a; source .env.local; set +a` loading hint; owners must fill and load values locally before running the Stripe, Supabase, calibration, and live-e2e proof commands. Run `npm run generate:live-proof-run-packet` before credentialed live proof commands to refresh `docs/commercialization/live-proof-run-packet-latest.md` and `docs/commercialization/live-proof-run-matrix-latest.csv`; these files are execution worksheets only, not proof that live checkout, live MRR, production calibration, or authenticated live persistence passed. The commercial intake file is copied from the template and remains invalid until placeholder partner/outcome refs, proof artifact hashes/types, `rawEvidenceOwnerHeld=true`, `ownerEvidenceArchive` policy metadata, and the hash salt are replaced with owner-held values. Run `npm run generate:commercial-evidence-intake-packet` before partner/outcome proof hashing to refresh `docs/commercialization/commercial-evidence-intake-packet-latest.md` and `docs/commercialization/commercial-evidence-intake-matrix-latest.csv`; these files are execution worksheets only, not proof that partners committed or outcomes occurred. The manual WCAG file is copied from the template and remains invalid until placeholder hashes are replaced with owner-held review artifact hashes and `ownerEvidenceArchive` policy metadata is confirmed. Run `npm run generate:manual-wcag-review-packet` before the owner-held WCAG review to refresh `docs/commercialization/manual-wcag-review-packet-latest.md` and `docs/commercialization/manual-wcag-review-matrix-latest.csv`; these files are execution worksheets only, not proof that the review is complete. This prep helper is not proof and must not be used to claim completion.

When replacing proof artifact hash placeholders, run `npm run hash:owner-evidence-artifacts -- <local proof files>` against owner-held files such as permission emails, signed pilot scopes, artifact review logs, baseline/change notes, quote approvals, screenshots, reviewer notes, assistive-technology transcripts, evaluation-tool output, issue logs, or sample archives. The command writes no files and prints JSON with `proofArtifactHash` values only plus byte counts and `sourcePathHash` fingerprints; it does not print source filenames or raw file contents. Copy only the `proofArtifactHash` values into the ignored local evidence templates.

## Commercial Evidence Records

Use `docs/commercialization/commercial-evidence-records-template.json` only as a schema template. Put redacted founder-held partner and outcome records in `docs/commercialization/commercial-evidence-records.local.json`, pass another path to the standalone verifier with `--evidence`, set `COMMERCIAL_EVIDENCE_RECORDS_PATH`, or pass the path directly to the final ledger with `npm run verify:remediation-gates -- --commercial-evidence <path>`; the default local file is ignored by git. To avoid manually computing hashes, put owner-held intake in `docs/commercialization/commercial-evidence-intake.local.json` using `docs/commercialization/commercial-evidence-intake-template.json`, set an owner-held non-placeholder `hashSalt` or `COMMERCIAL_EVIDENCE_HASH_SALT`, and run `COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all`. Run `npm run verify:commercial-evidence-records -- --require-partners --evidence docs/commercialization/commercial-evidence-records.local.json`, `npm run verify:commercial-evidence-records -- --require-outcomes --evidence docs/commercialization/commercial-evidence-records.local.json`, or `npm run verify:commercial-evidence-records -- --evidence docs/commercialization/commercial-evidence-records.local.json --require-all` as read-only checks before relying on `npm run verify:remediation-gates` to mark the partner/outcome gates as externally proven. Use `npm run verify:commercial-evidence-records:write` only when you intentionally want to refresh `docs/commercialization/commercial-evidence-records-latest.json`.

Run `npm run generate:commercial-evidence-intake-packet` before collecting partner/outcome hashes to regenerate the owner worksheet and field-level CSV matrix from the same verifier constants that enforce partner/outcome records. Use `docs/commercialization/commercial-evidence-intake-packet-latest.md` and `docs/commercialization/commercial-evidence-intake-matrix-latest.csv` to track the three design-partner slots, one documented-outcome slot, proof artifact types, quote approval requirements, does-not-prove boundaries, raw-evidence owner-held rules, and `ownerEvidenceArchive` policy fields. The packet and matrix do not prove partner commitments, documented outcomes, revenue, testimonial compliance, or permission to cite.

The records file must contain unique partner/outcome hashes, proof artifact hashes, supported proof artifact type labels, segment labels, permission booleans, artifact reviewed labels, `rawEvidenceOwnerHeld=true`, `ownerEvidenceArchive` policy metadata, redaction level, and does-not-prove boundaries only. Partner records must include an `artifact_review_log` proof type and at least one of `permissioned_email` or `signed_pilot_scope`; outcome records must include `baseline_workflow_note`, `measured_change_summary`, and `quote_approval`. Do not store partner names, emails, phone numbers, contracts, raw notes, private quotes, material-connection review notes, incentive review notes, typicality substantiation, raw proof artifacts, or customer data in tracked files. The verifier rejects future-dated `asOf`, `committedAt`, or `observedAt` metadata and rejects `committedAt` or `observedAt` values later than `asOf`. A passing verifier proves only the presence of permissioned redacted records with distinct partner/outcome hashes and owner-held proof artifact metadata; it does not prove revenue, retention, causal impact, market-wide demand, or guaranteed career outcomes.

Use `npm run hash:owner-evidence-artifacts -- <local proof files>` to generate the `proofArtifactHashes` for permissioned emails, signed scopes, artifact review logs, baseline workflow notes, measured-change summaries, and quote approvals. The helper is a hash utility only; it does not prove that a partner is committed, that an outcome occurred, or that permission to cite exists.

The commercial evidence composer never prints or writes `partnerRef`, `outcomeRef`, raw proof artifacts, or the hash salt. It writes only salted SHA-256 hashes, owner-held proof artifact hashes/types, and the redacted fields required by the evidence-record verifier, then validates the output before writing.

When the commercial evidence composer writes a redacted records file, its JSON output includes `validateCommercialEvidence`, `finalReadOnlyLedger`, and `refreshTrackedLedger`. Use the read-only final ledger first; use the write refresh command only after both live-gate evidence and commercial records are present and you intend to update tracked closeout artifacts.

## Manual WCAG Evidence

Use `docs/commercialization/manual-wcag-evidence-template.json` only as a schema template. Put redacted manual accessibility review metadata in `docs/commercialization/manual-wcag-evidence.local.json`, pass another path with `--evidence`, set `MANUAL_WCAG_EVIDENCE_PATH`, or pass the path directly to the final remediation ledger with `npm run verify:remediation-gates -- --manual-wcag-evidence <path>`. The default local file is ignored by git.

Run `npm run generate:manual-wcag-review-packet` before the manual review to regenerate the reviewer packet and route/checkpoint matrix from the same verifier constants that enforce the evidence schema. Use `docs/commercialization/manual-wcag-review-packet-latest.md` and `docs/commercialization/manual-wcag-review-matrix-latest.csv` to track the required route/checkpoint review work, then keep raw notes, screenshots, recordings, assistive-technology transcripts, reviewer identity, issue details, evaluation-tool output, sample archives, and artifact hash source maps owner-held outside tracked files. The packet and matrix do not complete the manual review, certify conformance, or replace the redacted local evidence file.

The manual evidence file must represent a WCAG-EM-scoped WCAG 2.2 A/AA review over the commercial route sample. It must include reviewer-attested metadata for scope, sample-selection method, technologies relied upon, reviewer type/conflict boundary, review-record archive retention, ownerEvidenceArchive policy metadata, keyboard focus and focus-not-obscured behavior, target size, form errors and redundant entry, accessible authentication, screen-reader name/role/value, contrast/reflow/text spacing, and downloadable artifacts. Preserve the template's `officialReferences` entries for W3C/WAI sources and each checkpoint's `standardRefs` IDs so the redacted evidence remains tied to the current WCAG/WCAG-EM source basis. Keep raw notes, screenshots, recordings, assistive-technology transcripts, reviewer identity, issue tracker details, evaluation-tool output, sample archives, and artifact hash source maps owner-held outside tracked files. Validate with:

Use `npm run hash:owner-evidence-artifacts -- <local proof files>` to generate each manual checkpoint's owner-held `artifactHashes`. The helper does not perform the manual review, certify conformance, or replace reviewer attestation; it only computes non-placeholder hashes for raw artifacts that stay outside git.

```bash
npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete
```

This gate still does not create a WCAG conformance claim, legal compliance claim, accessibility warranty, or institutional procurement approval. It only proves that the required redacted manual evidence metadata is attached and internally consistent.

## Redacted Evidence Path Smoke

Run `npm run verify:owner-evidence-fixtures` when changing the live-gate evidence schema, commercial evidence schema, manual WCAG evidence schema, or remediation gate logic. The command creates temporary synthetic non-secret files outside the repository and proves that `verify:live-gate-evidence`, `verify:commercial-evidence-records`, `verify:manual-wcag-evidence`, and `verify:remediation-gates -- --require-complete` agree on the complete path. This is a compatibility smoke test only; it does not prove live checkout, production calibration, live MRR, partner commitments, documented outcomes, or manual accessibility conformance.

## Owner Evidence Closeout Bundle

Run `npm run verify:owner-evidence-closeout` for a non-writing status pass over the whole owner-evidence path. It runs the live-gate composer, commercial evidence composer, live evidence verifier, commercial evidence verifier, manual WCAG evidence verifier, and final remediation gate verifier in order, while allowing the run to remain incomplete. This is useful before owner evidence is ready because it reports which redacted files, proof artifacts, partner/outcome records, or manual accessibility records are still missing.

After the owner-run Stripe, Supabase, calibration, authenticated live e2e, partner, outcome, and manual WCAG evidence exists, run:

The canonical owner sequence is generated in `docs/commercialization/owner-evidence-handoff-latest.json#commandSequence`, rendered in `docs/commercialization/owner-evidence-handoff-latest.md`, surfaced in the Trust Center owner closeout command checklist, and guarded by `npm run verify:owner-evidence-runbook-alignment` plus `npm run verify:owner-evidence-command-checklist-alignment`.

```bash
npm run prepare:owner-evidence -- --write
npm run verify:owner-evidence-local-safety
npm run generate:live-proof-run-packet
set -a; source .env.local; set +a
npm run verify:stripe-test-checkout
npm run verify:production-calibration
npm run verify:commercial-live-auth-e2e
npm run verify:stripe-live-mrr
npm run compose:live-gate-evidence -- --write --allow-partial --output docs/commercialization/live-gate-evidence.local.json
npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-any
npm run compose:live-gate-evidence -- --write --require-complete --output docs/commercialization/live-gate-evidence.local.json
npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-complete
npm run generate:commercial-evidence-intake-packet
npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>
COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all
npm run verify:commercial-evidence-records -- --evidence docs/commercialization/commercial-evidence-records.local.json --require-all
npm run generate:manual-wcag-review-packet
npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>
npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete
npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-intake docs/commercialization/commercial-evidence-intake.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json
npm run verify:commercial
```

That command composes `docs/commercialization/live-gate-evidence.local.json` and `docs/commercialization/commercial-evidence-records.local.json`, validates live, commercial, and manual WCAG evidence fail-closed, runs `verify-remediation-gates --require-complete`, and refreshes tracked remediation ledgers only when all external/manual evidence gates are accepted. It does not print secret values, raw partner/customer data, or raw accessibility review notes, and it must fail until all seven external/manual gates are represented by valid redacted evidence.

## Completion Audit

Run `npm run verify:remediation-completion-audit:write` after refreshing the remediation gate ledger. It writes `docs/commercialization/remediation-completion-audit-latest.json` and `.md` with phase summaries, key files, commands, acceptance evidence, confidence deltas, and remaining external gates. The audit must keep `goalComplete=false` until the final live and commercial evidence gates are accepted.

## Stripe Test Checkout Proof

Run `npm run verify:stripe-test-checkout` only with owner-controlled test credentials. The command signs in a dedicated synthetic Supabase Auth user, calls the deployed `create-checkout-session` Edge Function, retrieves the resulting Checkout Session from Stripe, and requires Stripe to report `livemode=false` with subscription-mode session metadata. It writes `docs/commercialization/stripe-test-checkout-proof-latest.json` with hashes, session status/payment status, and redacted `ownerEvidenceArchive` policy metadata only.

Required local or CI secret names:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` or `VITE_SUPABASE_URL` | Target Supabase project URL |
| `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY` | Public key used to sign in the synthetic user |
| `LIVE_SUPABASE_TEST_USER_EMAIL` or `STRIPE_TEST_USER_EMAIL` | Dedicated synthetic test user email |
| `LIVE_SUPABASE_TEST_USER_PASSWORD` or `STRIPE_TEST_USER_PASSWORD` | Dedicated synthetic test user password |
| `STRIPE_TEST_SECRET_KEY` or `STRIPE_TEST_RESTRICTED_KEY` | Stripe test-mode secret or restricted key; live-mode keys are rejected. Generic `STRIPE_SECRET_KEY` is intentionally ignored by this test proof so live-MRR checks can keep a live key. |
| `STRIPE_TEST_PRICE_ID` or `APO_STRIPE_TEST_PRICE_ID` | Stripe test-mode Price ID used for the Checkout Session |

Optional variables: `CHECKOUT_TEST_ORIGIN`, `STRIPE_TEST_TIER`, and `STRIPE_TEST_BILLING_PERIOD`. A passing test-mode Checkout Session still does not prove live revenue, webhook fulfillment, report-credit mutation, MRR, or bootcamp demand. Keep raw Checkout Session payloads, function invocation metadata, screenshots, and Stripe dashboard records owner-held outside git.

Before running credentialed live proof commands, generate the owner worksheet:

```bash
npm run generate:live-proof-run-packet
```

Use `docs/commercialization/live-proof-run-packet-latest.md` and `docs/commercialization/live-proof-run-matrix-latest.csv` to confirm required env names, external preconditions, expected proof artifacts, compose/validate commands, and does-not-prove boundaries. This packet is an execution worksheet only; it does not run live checks or make failed proof artifacts count.

## Live MRR Proof

Run `npm run verify:stripe-live-mrr` only with owner-controlled live-mode Stripe credentials. The command lists live active subscriptions, checks fixed recurring subscription-item prices, looks for paid invoices for active subscriptions, and writes `docs/commercialization/stripe-live-mrr-proof-latest.json` with hashes, redacted MRR metadata, and `ownerEvidenceArchive` policy metadata only. It does not create charges, refund charges, change subscriptions, store customer identities, or print raw Stripe payloads.

Required local or CI secret names:

| Variable | Purpose |
| --- | --- |
| `STRIPE_LIVE_SECRET_KEY`, `STRIPE_LIVE_RESTRICTED_KEY`, or `STRIPE_SECRET_KEY` | Live-mode Stripe key used for read-only subscription and invoice checks; test-mode keys are rejected |

Prefer a restricted read-only key with access to subscriptions and invoices. Optional variables: `STRIPE_LIVE_MRR_MAX_PAGES` and `STRIPE_LIVE_MRR_CURRENCY`. A passing live-MRR proof still does not prove retention, product-market fit, future revenue, accounting-recognized revenue, webhook fulfillment, or commercial outcomes. Keep raw subscription exports, invoice exports, dashboard screenshots, and customer-level evidence owner-held outside git.

## Production Calibration Proof

Run `npm run verify:production-calibration` only after the target Supabase project already has the approved calibration migrations, the deployed `calibrate-ece` Edge Function, function-level service-role secret, APO logs, and approved expert-assessment rows. The verifier invokes the deployed Edge Function with an anon key, validates that the response used `apo_overall_vs_expert_assessments`, requires ECE to be within `[0,1]`, and requires positive matched prediction pairs, expert rows, reliability bins, and a calibration run id. It writes `docs/commercialization/production-calibration-proof-latest.json` with hashes and redacted metadata only.

Required local or CI secret names:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` or `VITE_SUPABASE_URL` | Target Supabase project URL |
| `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY` | Public key used to invoke the deployed calibration function |

Optional variables: `CALIBRATION_DAYS`, `CALIBRATION_BIN_COUNT`, `CALIBRATION_SOURCE`, and `CALIBRATION_COHORT`. The deployed function itself must have `SUPABASE_SERVICE_ROLE_KEY` configured in Supabase function secrets; do not put service-role values in chat or tracked files. A passing production calibration run still does not prove scientific validity beyond the returned sample, future model performance, employment-decision validity, or partner/revenue traction.

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

- [PostHog retention docs](https://posthog.com/docs/product-analytics/retention), as of 2026-06-05: retention needs a start event and return event, and cohort sizes must be interpreted explicitly.
- [PostHog funnel docs](https://posthog.com/docs/product-analytics/funnels), as of 2026-06-05: funnels should use clear sequential steps and simple success events before adding optional complexity.
- [PostHog JavaScript docs](https://posthog.com/docs/libraries/js), as of 2026-06-05: identified users and SDK defaults are explicit setup choices.
- [Stripe Checkout Sessions](https://docs.stripe.com/payments/checkout-sessions) and [Stripe testing environments](https://docs.stripe.com/test-mode), as of 2026-06-05: Checkout Sessions should reference real Stripe Price objects; test-mode and sandbox objects do not prove live revenue.
- [Stripe Billing testing](https://docs.stripe.com/billing/testing), as of 2026-06-05: test clocks and subscription simulations are useful QA tools but do not replace live paid subscription evidence.
- [Stripe Subscriptions list API](https://docs.stripe.com/api/subscriptions/list) and [Stripe Invoices list API](https://docs.stripe.com/api/invoices/list), as of 2026-06-05: active subscriptions and paid invoices can be read through the API; this repo stores only redacted proof metadata and hashes.
- [W3C WCAG-EM overview](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/) and [Draft WCAG-EM 2.0](https://www.w3.org/TR/wcag-em-2/), as of 2026-06-05: the manual WCAG gate must keep scope, representative samples, complete processes, technologies relied upon, and report findings explicit without overclaiming conformance from incomplete evidence.
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html), as of 2026-06-05: local owner evidence must keep secrets lifecycle-managed and auditable outside tracked files.
- [GitHub push protection](https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection), as of 2026-06-05: push protection is useful defense-in-depth, but the repo still needs local secret hygiene, gitignored owner evidence files, and redacted proof artifacts.
