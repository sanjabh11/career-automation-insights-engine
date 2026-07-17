# Live Proof Run Packet

Generated: 2026-07-17T09:54:35.089Z

Status: `owner_live_proof_required`

Primary source artifact: `scripts/prepare-owner-evidence-workspace.mjs`

Source artifact count: 4

Source trace rows: 4

Official reference count: 6

Live proof count: 4

Owner command sequence count: 9

Does-not-prove boundary count: 8

## Evidence Boundary

This packet is an owner-run worksheet only. It does not execute credentialed checks, does not print secrets, and does not make failed or missing proof artifacts count as launch evidence. Raw Stripe API responses, hosted Checkout/Billing/Invoice URLs, subscription and invoice exports, Stripe or Supabase dashboard URLs, private profile URLs, meeting/calendar links, dashboard screenshots, Supabase credentials, customer identities, synthetic-user credentials, auth tokens, service-role data, logs, and raw proof payloads must remain owner-held outside tracked files.

## Source Trace

This source trace maps each generated live-proof run packet provenance row to the sourceArtifacts key used by the owner worksheet. It does not execute owner commands, load credentials, print secrets, run Stripe or Supabase live checks, create checkout sessions, query live revenue, prove payment readiness, or upgrade launch readiness.

| Key | Artifact | Source anchor |
| --- | --- | --- |
| ownerEvidencePrep | `scripts/prepare-owner-evidence-workspace.mjs` | `docs/commercialization/live-proof-run-packet-latest.json#sourceArtifacts.ownerEvidencePrep` |
| closeoutStatus | `docs/commercialization/owner-evidence-closeout-status-latest.json` | `docs/commercialization/live-proof-run-packet-latest.json#sourceArtifacts.closeoutStatus` |
| liveGateComposer | `scripts/compose-live-gate-evidence.mjs` | `docs/commercialization/live-proof-run-packet-latest.json#sourceArtifacts.liveGateComposer` |
| liveGateVerifier | `scripts/verify-live-gate-evidence.mjs` | `docs/commercialization/live-proof-run-packet-latest.json#sourceArtifacts.liveGateVerifier` |

## Current Live Proof Summary

| Gate | Readiness | Owner action | Proof artifact status | Accepted artifact | Command | Artifact |
| --- | --- | --- | --- | --- | --- | --- |
| Real Stripe test-mode checkout | owner_action_required | missing 6 env group(s) | skipped_missing_env | false | `npm run verify:stripe-test-checkout` | `docs/commercialization/stripe-test-checkout-proof-latest.json` |
| Production calibration run | owner_action_required | missing 2 env group(s) | skipped_missing_env | false | `npm run verify:production-calibration` | `docs/commercialization/production-calibration-proof-latest.json` |
| Authenticated live artifact e2e | owner_action_required | missing 4 env group(s) | skipped_missing_env | false | `npm run verify:commercial-live-auth-e2e` | `docs/commercialization/live-auth-e2e-proof-latest.json` |
| Live MRR greater than zero | owner_action_required | missing 1 env group(s) | skipped_missing_env | false | `npm run verify:stripe-live-mrr` | `docs/commercialization/stripe-live-mrr-proof-latest.json` |

## Owner Command Sequence

- `npm run generate:live-proof-run-packet`
- `npm run prepare:owner-evidence -- --write`
- `set -a; source .env.local; set +a`
- `npm run verify:stripe-test-checkout`
- `npm run verify:production-calibration`
- `npm run verify:commercial-live-auth-e2e`
- `npm run verify:stripe-live-mrr`
- `npm run compose:live-gate-evidence -- --write --allow-partial --output docs/commercialization/live-gate-evidence.local.json`
- `npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-any`

## Official Reference Basis

| Reference | URL | Applies to |
| --- | --- | --- |
| Stripe testing environments and test mode | https://docs.stripe.com/test-mode | test checkout proof; test keys; no real charges in test proof |
| Stripe API keys | https://docs.stripe.com/keys | test/live key prefixes; restricted keys; live key handling |
| Stripe secret key best practices | https://docs.stripe.com/keys-best-practices | prefer restricted keys; avoid live keys in testing; rotation if exposed |
| PCI DSS v4.0.1 publication notice | https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1 | payment-data security boundary; cardholder-data compliance is owner-held; no PCI compliance claim |
| Supabase Edge Function environment variables and secrets | https://supabase.com/docs/guides/functions/secrets | function secrets; local env files; do not check env files into git |
| GitHub Actions secrets | https://docs.github.com/en/actions/concepts/security/secrets | CI secret names; masked secret storage; owner-held credentials |

## Run Matrix

Use the CSV companion for owner execution: `docs/commercialization/live-proof-run-matrix-latest.csv`.

| Gate | Requirement | Readiness | Artifact | Review status | Owner action |
| --- | --- | --- | --- | --- | --- |
| real_stripe_test_checkout | environment: Owner environment values | owner_action_required | skipped_missing_env | owner_live_proof_required | Provide or load the required local/CI secret names for this verifier without printing values. |
| real_stripe_test_checkout | preconditions: External preconditions | owner_action_required | skipped_missing_env | owner_live_proof_required | Confirm target Stripe/Supabase state exists before running the verifier. |
| real_stripe_test_checkout | run-command: Run proof command | owner_action_required | skipped_missing_env | owner_live_proof_required | Run the verifier command from the repo root only after the credential and precondition checks are true. |
| real_stripe_test_checkout | artifact-review: Review generated artifact | owner_action_required | skipped_missing_env | owner_live_proof_required | Confirm the tracked proof artifact has status=passed and contains redacted metadata only. |
| real_stripe_test_checkout | archive-and-redaction: Owner-held archive and redaction policy | owner_action_required | skipped_missing_env | owner_live_proof_required | Confirm raw provider payloads, screenshots, exports, secrets, tokens, customer identifiers, hosted Stripe URLs, provider dashboard URLs, private profile URLs, and meeting/calendar links are retained owner-held outside git, and that the redacted artifact carries the required ownerEvidenceArchive policy fields. |
| real_stripe_test_checkout | compose-live-evidence: Compose redacted live-gate evidence | owner_action_required | skipped_missing_env | owner_live_proof_required | Run the live-gate composer after all four proof artifacts pass. |
| real_stripe_test_checkout | validate-live-evidence: Validate fail-closed live evidence | owner_action_required | skipped_missing_env | owner_live_proof_required | Compose partial redacted live-gate evidence for accepted proof artifacts, then use complete validation only after all live proof artifacts pass; keep raw proof outside git. |
| real_stripe_test_checkout | claim-boundary: Claim boundary | owner_action_required | skipped_missing_env | owner_live_proof_required | Do not cite this gate beyond the explicit does-not-prove boundary. |
| production_calibration_run | environment: Owner environment values | owner_action_required | skipped_missing_env | owner_live_proof_required | Provide or load the required local/CI secret names for this verifier without printing values. |
| production_calibration_run | preconditions: External preconditions | owner_action_required | skipped_missing_env | owner_live_proof_required | Confirm target Stripe/Supabase state exists before running the verifier. |
| production_calibration_run | run-command: Run proof command | owner_action_required | skipped_missing_env | owner_live_proof_required | Run the verifier command from the repo root only after the credential and precondition checks are true. |
| production_calibration_run | artifact-review: Review generated artifact | owner_action_required | skipped_missing_env | owner_live_proof_required | Confirm the tracked proof artifact has status=passed and contains redacted metadata only. |
| production_calibration_run | archive-and-redaction: Owner-held archive and redaction policy | owner_action_required | skipped_missing_env | owner_live_proof_required | Confirm raw provider payloads, screenshots, exports, secrets, tokens, customer identifiers, hosted Stripe URLs, provider dashboard URLs, private profile URLs, and meeting/calendar links are retained owner-held outside git, and that the redacted artifact carries the required ownerEvidenceArchive policy fields. |
| production_calibration_run | compose-live-evidence: Compose redacted live-gate evidence | owner_action_required | skipped_missing_env | owner_live_proof_required | Run the live-gate composer after all four proof artifacts pass. |
| production_calibration_run | validate-live-evidence: Validate fail-closed live evidence | owner_action_required | skipped_missing_env | owner_live_proof_required | Compose partial redacted live-gate evidence for accepted proof artifacts, then use complete validation only after all live proof artifacts pass; keep raw proof outside git. |
| production_calibration_run | claim-boundary: Claim boundary | owner_action_required | skipped_missing_env | owner_live_proof_required | Do not cite this gate beyond the explicit does-not-prove boundary. |
| authenticated_live_artifact_e2e | environment: Owner environment values | owner_action_required | skipped_missing_env | owner_live_proof_required | Provide or load the required local/CI secret names for this verifier without printing values. |
| authenticated_live_artifact_e2e | preconditions: External preconditions | owner_action_required | skipped_missing_env | owner_live_proof_required | Confirm target Stripe/Supabase state exists before running the verifier. |
| authenticated_live_artifact_e2e | run-command: Run proof command | owner_action_required | skipped_missing_env | owner_live_proof_required | Run the verifier command from the repo root only after the credential and precondition checks are true. |
| authenticated_live_artifact_e2e | artifact-review: Review generated artifact | owner_action_required | skipped_missing_env | owner_live_proof_required | Confirm the tracked proof artifact has status=passed and contains redacted metadata only. |
| authenticated_live_artifact_e2e | archive-and-redaction: Owner-held archive and redaction policy | owner_action_required | skipped_missing_env | owner_live_proof_required | Confirm raw provider payloads, screenshots, exports, secrets, tokens, customer identifiers, hosted Stripe URLs, provider dashboard URLs, private profile URLs, and meeting/calendar links are retained owner-held outside git, and that the redacted artifact carries the required ownerEvidenceArchive policy fields. |
| authenticated_live_artifact_e2e | compose-live-evidence: Compose redacted live-gate evidence | owner_action_required | skipped_missing_env | owner_live_proof_required | Run the live-gate composer after all four proof artifacts pass. |
| authenticated_live_artifact_e2e | validate-live-evidence: Validate fail-closed live evidence | owner_action_required | skipped_missing_env | owner_live_proof_required | Compose partial redacted live-gate evidence for accepted proof artifacts, then use complete validation only after all live proof artifacts pass; keep raw proof outside git. |
| authenticated_live_artifact_e2e | claim-boundary: Claim boundary | owner_action_required | skipped_missing_env | owner_live_proof_required | Do not cite this gate beyond the explicit does-not-prove boundary. |
| live_mrr_gt_zero | environment: Owner environment values | owner_action_required | skipped_missing_env | owner_live_proof_required | Provide or load the required local/CI secret names for this verifier without printing values. |
| live_mrr_gt_zero | preconditions: External preconditions | owner_action_required | skipped_missing_env | owner_live_proof_required | Confirm target Stripe/Supabase state exists before running the verifier. |
| live_mrr_gt_zero | run-command: Run proof command | owner_action_required | skipped_missing_env | owner_live_proof_required | Run the verifier command from the repo root only after the credential and precondition checks are true. |
| live_mrr_gt_zero | artifact-review: Review generated artifact | owner_action_required | skipped_missing_env | owner_live_proof_required | Confirm the tracked proof artifact has status=passed and contains redacted metadata only. |
| live_mrr_gt_zero | archive-and-redaction: Owner-held archive and redaction policy | owner_action_required | skipped_missing_env | owner_live_proof_required | Confirm raw provider payloads, screenshots, exports, secrets, tokens, customer identifiers, hosted Stripe URLs, provider dashboard URLs, private profile URLs, and meeting/calendar links are retained owner-held outside git, and that the redacted artifact carries the required ownerEvidenceArchive policy fields. |
| live_mrr_gt_zero | compose-live-evidence: Compose redacted live-gate evidence | owner_action_required | skipped_missing_env | owner_live_proof_required | Run the live-gate composer after all four proof artifacts pass. |
| live_mrr_gt_zero | validate-live-evidence: Validate fail-closed live evidence | owner_action_required | skipped_missing_env | owner_live_proof_required | Compose partial redacted live-gate evidence for accepted proof artifacts, then use complete validation only after all live proof artifacts pass; keep raw proof outside git. |
| live_mrr_gt_zero | claim-boundary: Claim boundary | owner_action_required | skipped_missing_env | owner_live_proof_required | Do not cite this gate beyond the explicit does-not-prove boundary. |

## Does Not Prove

- Commercial readiness
- Partner commitments
- Documented outcomes
- Manual WCAG conformance
- Product-market fit
- Legal compliance
- PCI DSS compliance
- Future revenue or retention
