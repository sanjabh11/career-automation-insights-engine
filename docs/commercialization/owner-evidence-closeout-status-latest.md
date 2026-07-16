# Owner Evidence Closeout Status

Generated: 2026-06-08T23:24:38.035Z

Goal complete: `false`

Status OK: `false`

Failed steps: compose-live-evidence, compose-commercial-records, verify-live-evidence, verify-commercial-records, verify-manual-wcag-evidence, verify-remediation-gates

This artifact records the current ordered owner-evidence closeout status. It is allowed to be incomplete and does not turn missing owner-held proof into launch evidence.

## Evidence Boundary

This command orchestrates redacted local evidence only. Raw Stripe API responses, Checkout Session payloads, subscription exports, invoice exports, dashboard screenshots, Supabase secrets, customer identities, partner names, contracts, private notes, quotes, hash salts, manual WCAG notes, screenshots, recordings, reviewer identity, assistive-technology transcripts, evaluation-tool output, issue logs, sample archives, artifact hash source maps, and owner-held archive records must remain owner-held outside tracked files.

## Paths

| Item | Path |
| --- | --- |
| liveEvidence | `docs/commercialization/live-gate-evidence.local.json` |
| commercialIntake | `docs/commercialization/commercial-evidence-intake.local.json` |
| commercialEvidence | `docs/commercialization/commercial-evidence-records.local.json` |
| manualWcagEvidence | `docs/commercialization/manual-wcag-evidence.local.json` |

## Counts

| Metric | Count |
| --- | ---: |
| Remaining gates | 5 |
| Accepted live gates | 2 |
| Owner action queue rows | 5 |
| Owner gate closeout rows | 5 |
| Closeout steps | 8 |
| Failed closeout steps | 6 |
| Written artifacts | 2 |

## Owner Gate Scoreboard

Status: `owner_evidence_required`

Goal complete: `false`

Remaining gate count: 5

Accepted live gate count: 2

Owner action queue count: 5

Owner prep action count: 6

Failed closeout step count: 6

This scoreboard is a machine-readable owner-evidence closeout summary only. It does not prove live checkout, live MRR, partner commitments, documented outcomes, manual WCAG conformance, legal compliance, procurement approval, or commercial readiness.

| Gate | State |
| --- | --- |
| manual_wcag_evidence | remaining owner-held proof |
| real_stripe_test_checkout | remaining owner-held proof |
| live_mrr_gt_zero | remaining owner-held proof |
| three_committed_partners | remaining owner-held proof |
| documented_outcomes | remaining owner-held proof |

## Owner Evidence Prep Status

Ready for closeout: `false`

Owner action needed count: 6

| # | Owner action needed |
| --- | --- |
| 1 | stripe_test_checkout: provide STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY and load SUPABASE_URL, SUPABASE_ANON_KEY, LIVE_SUPABASE_TEST_USER_EMAIL, LIVE_SUPABASE_TEST_USER_PASSWORD, STRIPE_TEST_PRICE_ID |
| 2 | live_mrr_gt_zero: load STRIPE_SECRET_KEY |
| 3 | docs/commercialization/commercial-evidence-intake.local.json: run npm run generate:commercial-evidence-intake-packet and use docs/commercialization/commercial-evidence-intake-packet-latest.md plus docs/commercialization/commercial-evidence-intake-matrix-latest.csv as the owner-held partner/outcome worksheet before hashing proof artifacts; run npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>, then replace placeholder partner/outcome refs, proof artifact hashes/types, integrity attestations, ownerEvidenceArchive policy metadata, measured-outcome scope fields, rawEvidenceOwnerHeld attestation, and hash salt |
| 4 | docs/commercialization/manual-wcag-evidence.local.json: run npm run generate:manual-wcag-review-packet and use docs/commercialization/manual-wcag-review-packet-latest.md, docs/commercialization/manual-wcag-review-matrix-latest.csv, and the W3C WCAG-EM Report Tool as the owner-held review worksheet/report export before hashing proof artifacts; create from docs/commercialization/manual-wcag-evidence-template.json after the owner-held WCAG-EM review is complete (template requires 8 checkpoint(s), 9 route(s), and 5 complete process(es), 2 accessibility-support baseline combination(s), and 7 official W3C/WAI reference(s), plus 9 ownerEvidenceArchive policy field(s)), including reviewer disclosure, technologies relied upon, sample-selection method, review-record archive attestations, owner-held WCAG-EM report-tool export, and ownerEvidenceArchive policy metadata, then run npm run hash:owner-evidence-artifacts -- <local WCAG review proof files> before replacing artifactHashes |
| 5 | docs/commercialization/stripe-test-checkout-proof-latest.json: run owner proof command until status=passed with test-mode subscription Checkout metadata and owner-held Checkout Session/function-invocation archive policy |
| 6 | docs/commercialization/stripe-live-mrr-proof-latest.json: run owner proof command until status=passed with active subscription, paid invoice, redacted MRR metadata, and owner-held subscription/invoice archive policy |

### Local Evidence Inputs

| Input | Status | Detail |
| --- | --- | --- |
| envFile | exists | keyNamesRedacted=true; expectedKeyCount=16; presentExpectedKeyCount=8; blankOrPlaceholderExpectedKeys=STRIPE_LIVE_SECRET_KEY; extraKeyCount=2 |
| commercialIntake | exists | placeholderCount=5; designPartnerCommitmentCount=3; documentedOutcomeCount=1 |
| manualWcagEvidence | missing | placeholderCount=n/a; requiredCheckpointCount=8; checkpointResultCount=8; requiredRouteCount=9; routeReviewedCount=9; requiredCompleteProcessCount=5; completeProcessReviewedCount=5; requiredAccessibilitySupportBaselineCount=2; accessibilitySupportBaselineCount=2; requiredOfficialReferenceCount=7; officialReferenceCount=7 |

## Gate Closeout Summary

This table projects the canonical remediation owner-action queue into closeout status. It is still an execution aid, not proof that owner-held gates are satisfied.

| Gate | Status | Owner action | Next command | Owner-prep readiness | Closeout steps | Redacted failure detail |
| --- | --- | --- | --- | --- | --- | --- |
| manual_wcag_evidence | blocked_missing_manual_wcag_evidence | Generate the manual WCAG review packet, complete the owner-held WCAG-EM review from the route/checkpoint matrix, document product scope, sample rationale, sample-selection method, technologies relied upon, complete processes, support-baseline combinations, reviewer type/conflict boundary, review-record archive attestations, and ownerEvidenceArchive policy metadata, hash local WCAG review proof files, replace placeholder hashes in the ignored local evidence file, and keep raw reviewer notes/screenshots/AT transcripts/tool output/sample archives/hash source maps outside git. | `npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete` | path=docs/commercialization/manual-wcag-evidence.local.json; exists=false; requiredCheckpointCount=8; requiredRouteCount=9; requiredCompleteProcessCount=5; requiredAccessibilitySupportBaselineCount=2; requiredOfficialReferenceCount=7; requiredOwnerEvidenceArchiveRequirementCount=9; blockingOwnerActionCount=1 | verify-manual-wcag-evidence:fail; verify-remediation-gates:fail | verify-manual-wcag-evidence: stderr: Manual WCAG evidence is incomplete.<br>verify-remediation-gates: stderr: Remediation external gates are not complete. See generated artifact for remaining evidence. |
| real_stripe_test_checkout | blocked_missing_owner_secret_or_live_evidence | Load owner-held Supabase synthetic-user credentials, a Stripe test-mode key, and a matching test Price ID, then run the checkout verifier against the deployed or staging function; keep raw Checkout Session payloads, function invocation metadata, screenshots, and Stripe dashboard records outside git. | `npm run verify:stripe-test-checkout` | liveReadinessId=stripe_test_checkout; ready=false; requiredGroupCount=6; presentGroupCount=5; missingGroupCount=1; loadFromEnvFileCount=5; invalidKeyModeCount=0; requiredStripeKeyMode=test; resolvedStripeKeyMode=missing; blockingOwnerActionCount=2 | compose-live-evidence:fail; verify-live-evidence:fail; verify-remediation-gates:fail | compose-live-evidence: stripe-test-checkout: docs/commercialization/stripe-test-checkout-proof-latest.json must have status=passed and all checks passed<br>compose-live-evidence: stripe-live-mrr: docs/commercialization/stripe-live-mrr-proof-latest.json must have status=passed and all checks passed<br>verify-live-evidence: stderr: Not all live-gate evidence items are accepted.<br>verify-remediation-gates: stderr: Remediation external gates are not complete. See generated artifact for remaining evidence. |
| live_mrr_gt_zero | ready_for_owner_live_run | Provide a live-mode read-only Stripe key after a real paid recurring subscription exists, then run the live-MRR verifier without exposing customer or invoice details; keep raw subscription exports, invoice exports, dashboard screenshots, and customer-level evidence outside git. | `npm run verify:stripe-live-mrr` | liveReadinessId=live_mrr_gt_zero; ready=false; requiredGroupCount=1; presentGroupCount=1; missingGroupCount=0; loadFromEnvFileCount=1; invalidKeyModeCount=0; requiredStripeKeyMode=live; resolvedStripeKeyMode=live; blockingOwnerActionCount=2 | compose-live-evidence:fail; verify-live-evidence:fail; verify-remediation-gates:fail | compose-live-evidence: stripe-test-checkout: docs/commercialization/stripe-test-checkout-proof-latest.json must have status=passed and all checks passed<br>compose-live-evidence: stripe-live-mrr: docs/commercialization/stripe-live-mrr-proof-latest.json must have status=passed and all checks passed<br>verify-live-evidence: stderr: Not all live-gate evidence items are accepted.<br>verify-remediation-gates: stderr: Remediation external gates are not complete. See generated artifact for remaining evidence. |
| three_committed_partners | blocked_missing_owner_evidence_records | Generate the commercial evidence intake packet, use the partner/outcome matrix to prepare owner-held proof, hash owner-held partner proof artifacts, then fill the ignored commercial evidence intake with three permissioned design-partner commitments, non-placeholder proofArtifactHashes, supported proofArtifactTypes, marketing/testimonial integrity attestations, rawEvidenceOwnerHeld=true, ownerEvidenceArchive policy metadata, and an owner-held salt; preserve raw names/contracts/proof artifacts outside git. | `COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all` | path=docs/commercialization/commercial-evidence-intake.local.json; exists=true; placeholderCount=5; designPartnerCommitmentCount=3; documentedOutcomeCount=1; blockingOwnerActionCount=1 | compose-commercial-records:fail; verify-commercial-records:fail; verify-remediation-gates:fail | compose-commercial-records: hashSalt or COMMERCIAL_EVIDENCE_HASH_SALT must be an owner-held non-placeholder string with at least 16 characters<br>compose-commercial-records: designPartnerCommitments[0].partnerRef must not be a placeholder<br>compose-commercial-records: designPartnerCommitments[0].proofArtifactHashes must contain at least one non-placeholder sha256 hash<br>compose-commercial-records: designPartnerCommitments[0].proofArtifactTypes must contain at least one supported proof artifact type<br>compose-commercial-records: designPartnerCommitments[0].rawEvidenceOwnerHeld must be true<br>compose-commercial-records: designPartnerCommitments[0].integrityAttestations must be an object<br>compose-commercial-records: designPartnerCommitments[0].ownerEvidenceArchive must be an object<br>compose-commercial-records: designPartnerCommitments[1].partnerRef must not be a placeholder<br>compose-commercial-records: 21 additional error(s) omitted from this redacted summary<br>verify-commercial-records: stderr: Three committed design partners are not proven by the redacted commercial evidence records.<br>verify-remediation-gates: stderr: Remediation external gates are not complete. See generated artifact for remaining evidence. |
| documented_outcomes | blocked_missing_owner_evidence_records | Generate the commercial evidence intake packet, use the partner/outcome matrix to prepare owner-held proof, hash owner-held outcome proof artifacts, then fill the ignored commercial evidence intake with at least one permissioned documented outcome, including baseline workflow, measured change, measured-change unit, measurement window, outcome claim scope, typicality boundary, quote approval, non-placeholder proofArtifactHashes, supported proofArtifactTypes, marketing/testimonial and outcome integrity attestations, rawEvidenceOwnerHeld=true, ownerEvidenceArchive policy metadata, and caveats. | `COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all` | path=docs/commercialization/commercial-evidence-intake.local.json; exists=true; placeholderCount=5; designPartnerCommitmentCount=3; documentedOutcomeCount=1; blockingOwnerActionCount=1 | compose-commercial-records:fail; verify-commercial-records:fail; verify-remediation-gates:fail | compose-commercial-records: hashSalt or COMMERCIAL_EVIDENCE_HASH_SALT must be an owner-held non-placeholder string with at least 16 characters<br>compose-commercial-records: designPartnerCommitments[0].partnerRef must not be a placeholder<br>compose-commercial-records: designPartnerCommitments[0].proofArtifactHashes must contain at least one non-placeholder sha256 hash<br>compose-commercial-records: designPartnerCommitments[0].proofArtifactTypes must contain at least one supported proof artifact type<br>compose-commercial-records: designPartnerCommitments[0].rawEvidenceOwnerHeld must be true<br>compose-commercial-records: designPartnerCommitments[0].integrityAttestations must be an object<br>compose-commercial-records: designPartnerCommitments[0].ownerEvidenceArchive must be an object<br>compose-commercial-records: designPartnerCommitments[1].partnerRef must not be a placeholder<br>compose-commercial-records: 21 additional error(s) omitted from this redacted summary<br>verify-commercial-records: stderr: Three committed design partners are not proven by the redacted commercial evidence records.<br>verify-remediation-gates: stderr: Remediation external gates are not complete. See generated artifact for remaining evidence. |

## Step Summary

| Step | Status | Command | Summary | Redacted failure detail |
| --- | --- | --- | --- | --- |
| owner-evidence-local-safety | pass | `node scripts/verify-owner-evidence-local-safety.mjs --write` | {"ok":true,"protectedPathCount":10,"ignoredProtectedPathCount":10,"trackedSensitiveFileViolationCount":0,"stagedSensitivePathViolationCount":0,"errorCount":0,"errorExcerpts":[],"outputs":{"json":"docs/commercialization/owner-evidence-local-safety-latest.json","markdown":"docs/commercialization/owner-evidence-local-safety-latest.md"},"evidenceBoundary":"This preflight proves only git ignore/tracking/staging policy for owner-held local evidence paths. It does not inspect file contents, validate redacted evidence completeness, prove live payment or revenue, prove partner commitments, prove documented outcomes, prove manual WCAG conformance, or replace host-level secret scanning/push protection."} | none |
| inspect-owner-evidence-prep | pass | `node scripts/prepare-owner-evidence-workspace.mjs --commercial-intake docs/commercialization/commercial-evidence-intake.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json` | {"ok":true,"readyForCloseout":false,"ownerActionNeededCount":6,"ownerActionNeeded":["stripe_test_checkout: provide STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY and load SUPABASE_URL, SUPABASE_ANON_KEY, LIVE_SUPABASE_TEST_USER_EMAIL, LIVE_SUPABASE_TEST_USER_PASSWORD, STRIPE_TEST_PRICE_ID","live_mrr_gt_zero: load STRIPE_SECRET_KEY","docs/commercialization/commercial-evidence-intake.local.json: run npm run generate:commercial-evidence-intake-packet and use docs/commercialization/commercial-evidence-intake-packet-latest.md plus docs/commercialization/commercial-evidence-intake-matrix-latest.csv as the owner-held partner/outcome worksheet before hashing proof artifacts; run npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>, then replace placeholder partner/outcome refs, proof artifact hashes/types, integrity attestations, ownerEvidenceArchive policy metadata, measured-outcome scope fields, rawEvidenceOwnerHeld attestation, and hash salt","docs/commercialization/manual-wcag-evidence.local.json: run npm run generate:manual-wcag-review-packet and use docs/commercialization/manual-wcag-review-packet-latest.md, docs/commercialization/manual-wcag-review-matrix-latest.csv, and the W3C WCAG-EM Report Tool as the owner-held review worksheet/report export before hashing proof artifacts; create from docs/commercialization/manual-wcag-evidence-template.json after the owner-held WCAG-EM review is complete (template requires 8 checkpoint(s), 9 route(s), and 5 complete process(es), 2 accessibility-support baseline combination(s), and 7 official W3C/WAI reference(s), plus 9 ownerEvidenceArchive policy field(s)), including reviewer disclosure, technologies relied upon, sample-selection method, review-record archive attestations, owner-held WCAG-EM report-tool export, and ownerEvidenceArchive policy metadata, then run npm run hash:owner-evidence-artifacts -- <local WCAG review proof files> before replacing artifactHashes","docs/commercialization/stripe-test-checkout-proof-latest.json: run owner proof command until status=passed with test-mode subscription Checkout metadata and owner-held Checkout Session/function-invocation archive policy","docs/commercialization/stripe-live-mrr-proof-latest.json: run owner proof command until status=passed with active subscription, paid invoice, redacted MRR metadata, and owner-held subscription/invoice archive policy"],"ownerActionNeededByGate":{"manual_wcag_evidence":["docs/commercialization/manual-wcag-evidence.local.json: run npm run generate:manual-wcag-review-packet and use docs/commercialization/manual-wcag-review-packet-latest.md, docs/commercialization/manual-wcag-review-matrix-latest.csv, and the W3C WCAG-EM Report Tool as the owner-held review worksheet/report export before hashing proof artifacts; create from docs/commercialization/manual-wcag-evidence-template.json after the owner-held WCAG-EM review is complete (template requires 8 checkpoint(s), 9 route(s), and 5 complete process(es), 2 accessibility-support baseline combination(s), and 7 official W3C/WAI reference(s), plus 9 ownerEvidenceArchive policy field(s)), including reviewer disclosure, technologies relied upon, sample-selection method, review-record archive attestations, owner-held WCAG-EM report-tool export, and ownerEvidenceArchive policy metadata, then run npm run hash:owner-evidence-artifacts -- <local WCAG review proof files> before replacing artifactHashes"],"real_stripe_test_checkout":["stripe_test_checkout: provide STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY and load SUPABASE_URL, SUPABASE_ANON_KEY, LIVE_SUPABASE_TEST_USER_EMAIL, LIVE_SUPABASE_TEST_USER_PASSWORD, STRIPE_TEST_PRICE_ID","docs/commercialization/stripe-test-checkout-proof-latest.json: run owner proof command until status=passed with test-mode subscription Checkout metadata and owner-held Checkout Session/function-invocation archive policy"],"production_calibration_run":[],"authenticated_live_artifact_e2e":[],"live_mrr_gt_zero":["live_mrr_gt_zero: load STRIPE_SECRET_KEY","docs/commercialization/stripe-live-mrr-proof-latest.json: run owner proof command until status=passed with active subscription, paid invoice, redacted MRR metadata, and owner-held subscription/invoice archive policy"],"three_committed_partners":["docs/commercialization/commercial-evidence-intake.local.json: run npm run generate:commercial-evidence-intake-packet and use docs/commercialization/commercial-evidence-intake-packet-latest.md plus docs/commercialization/commercial-evidence-intake-matrix-latest.csv as the owner-held partner/outcome worksheet before hashing proof artifacts; run npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>, then replace placeholder partner/outcome refs, proof artifact hashes/types, integrity attestations, ownerEvidenceArchive policy metadata, measured-outcome scope fields, rawEvidenceOwnerHeld attestation, and hash salt"],"documented_outcomes":["docs/commercialization/commercial-evidence-intake.local.json: run npm run generate:commercial-evidence-intake-packet and use docs/commercialization/commercial-evidence-intake-packet-latest.md plus docs/commercialization/commercial-evidence-intake-matrix-latest.csv as the owner-held partner/outcome worksheet before hashing proof artifacts; run npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>, then replace placeholder partner/outcome refs, proof artifact hashes/types, integrity attestations, ownerEvidenceArchive policy metadata, measured-outcome scope fields, rawEvidenceOwnerHeld attestation, and hash salt"]},"envFile":{"path":".env.local","exists":true,"keyNamesRedacted":true,"expectedKeyCount":16,"presentExpectedKeyCount":8,"blankOrPlaceholderExpectedKeys":["STRIPE_LIVE_SECRET_KEY"],"extraKeyCount":2,"redactionBoundary":"Only expected owner-proof environment key names are reported. Extra local key names and all values are redacted from repo artifacts and command output."},"liveProofReadiness":[{"id":"stripe_test_checkout","command":"npm run verify:stripe-test-checkout","ready":false,"envFileCompleteButNotLoaded":false,"requiredGroupCount":6,"presentGroupCount":5,"missingGroupCount":1,"blankOrPlaceholderEnvFileCount":0,"invalidKeyModeCount":0,"loadFromEnvFileCount":5,"missingGroups":[["STRIPE_TEST_SECRET_KEY","STRIPE_TEST_RESTRICTED_KEY"]],"blankOrPlaceholderEnvFile":[],"invalidKeyModeGroups":[],"stripeKeyModeRequirement":{"requiredMode":"test","resolvedKey":null,"resolvedSource":null,"resolvedMode":"missing"},"loadFromEnvFile":["SUPABASE_URL","SUPABASE_ANON_KEY","LIVE_SUPABASE_TEST_USER_EMAIL","LIVE_SUPABASE_TEST_USER_PASSWORD","STRIPE_TEST_PRICE_ID"]},{"id":"production_calibration","command":"npm run verify:production-calibration","ready":false,"envFileCompleteButNotLoaded":true,"requiredGroupCount":2,"presentGroupCount":2,"missingGroupCount":0,"blankOrPlaceholderEnvFileCount":0,"invalidKeyModeCount":0,"loadFromEnvFileCount":2,"missingGroups":[],"blankOrPlaceholderEnvFile":[],"invalidKeyModeGroups":[],"stripeKeyModeRequirement":null,"loadFromEnvFile":["SUPABASE_URL","SUPABASE_ANON_KEY"]},{"id":"authenticated_live_artifact_e2e","command":"npm run verify:commercial-live-auth-e2e","ready":false,"envFileCompleteButNotLoaded":true,"requiredGroupCount":4,"presentGroupCount":4,"missingGroupCount":0,"blankOrPlaceholderEnvFileCount":0,"invalidKeyModeCount":0,"loadFromEnvFileCount":4,"missingGroups":[],"blankOrPlaceholderEnvFile":[],"invalidKeyModeGroups":[],"stripeKeyModeRequirement":null,"loadFromEnvFile":["SUPABASE_URL","SUPABASE_ANON_KEY","LIVE_SUPABASE_TEST_USER_EMAIL","LIVE_SUPABASE_TEST_USER_PASSWORD"]},{"id":"live_mrr_gt_zero","command":"npm run verify:stripe-live-mrr","ready":false,"envFileCompleteButNotLoaded":true,"requiredGroupCount":1,"presentGroupCount":1,"missingGroupCount":0,"blankOrPlaceholderEnvFileCount":0,"invalidKeyModeCount":0,"loadFromEnvFileCount":1,"missingGroups":[],"blankOrPlaceholderEnvFile":[],"invalidKeyModeGroups":[],"stripeKeyModeRequirement":{"requiredMode":"live","resolvedKey":"STRIPE_SECRET_KEY","resolvedSource":"env_file","resolvedMode":"live"},"loadFromEnvFile":["STRIPE_SECRET_KEY"]}],"liveGateEvidence":{"path":"docs/commercialization/live-gate-evidence.local.json","exists":true,"validJson":true,"schemaVersion":"2026-05-31.apo-live-gate-evidence.v1","placeholderCount":0,"complete":false,"acceptedGateIds":["production_calibration_run","authenticated_live_artifact_e2e"],"rejectedGateIds":[],"errorCount":0,"errors":[]},"commercialIntake":{"path":"docs/commercialization/commercial-evidence-intake.local.json","exists":true,"validJson":true,"schemaVersion":"2026-06-01.apo-commercial-evidence-intake.v1","placeholderCount":5,"commercialEvidenceIntakeCounts":{"designPartnerCommitmentCount":3,"documentedOutcomeCount":1}},"manualWcagEvidence":{"path":"docs/commercialization/manual-wcag-evidence.local.json","exists":false,"validJson":false,"placeholderCount":null,"manualWcagEvidenceCounts":{"sourcePath":"docs/commercialization/manual-wcag-evidence-template.json","requiredCheckpointCount":8,"requiredRouteCount":9,"requiredCompleteProcessCount":5,"requiredAccessibilitySupportBaselineCount":2,"requiredOfficialReferenceCount":7,"requiredOwnerEvidenceArchiveRequirementCount":9,"ownerEvidenceArchiveRequirementCount":9,"checkpointResultCount":8,"routeReviewedCount":9,"completeProcessReviewedCount":5,"accessibilitySupportBaselineCount":2,"officialReferenceCount":7}},"proofArtifacts":[{"path":"docs/commercialization/stripe-test-checkout-proof-latest.json","gateId":"real_stripe_test_checkout","readinessId":"stripe_test_checkout","command":"npm run verify:stripe-test-checkout","exists":true,"validJson":true,"artifactStatus":"skipped_missing_env","acceptedSourceArtifact":false},{"path":"docs/commercialization/production-calibration-proof-latest.json","gateId":"production_calibration_run","readinessId":"production_calibration","command":"npm run verify:production-calibration","exists":true,"validJson":true,"artifactStatus":"passed","acceptedSourceArtifact":true},{"path":"docs/commercialization/live-auth-e2e-proof-latest.json","gateId":"authenticated_live_artifact_e2e","readinessId":"authenticated_live_artifact_e2e","command":"npm run verify:commercial-live-auth-e2e","exists":true,"validJson":true,"artifactStatus":"passed","acceptedSourceArtifact":true},{"path":"docs/commercialization/stripe-live-mrr-proof-latest.json","gateId":"live_mrr_gt_zero","readinessId":"live_mrr_gt_zero","command":"npm run verify:stripe-live-mrr","exists":true,"validJson":true,"artifactStatus":"failed","acceptedSourceArtifact":false}],"nextCommands":{"writeLocalScaffold":"npm run prepare:owner-evidence -- --write","verifyLocalSafety":"npm run verify:owner-evidence-local-safety","generateLiveProofRunPacket":"npm run generate:live-proof-run-packet","loadEnv":"set -a; source .env.local; set +a","liveProofs":["npm run verify:stripe-test-checkout","npm run verify:production-calibration","npm run verify:commercial-live-auth-e2e","npm run verify:stripe-live-mrr"],"composeLiveGateEvidence":"npm run compose:live-gate-evidence -- --write --allow-partial --output docs/commercialization/live-gate-evidence.local.json","validateLiveGateEvidence":"npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-any","composeCompleteLiveGateEvidence":"npm run compose:live-gate-evidence -- --write --require-complete --output docs/commercialization/live-gate-evidence.local.json","validateCompleteLiveGateEvidence":"npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-complete","generateCommercialEvidenceIntakePacket":"npm run generate:commercial-evidence-intake-packet","hashCommercialProofArtifacts":"npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>","composeCommercialRecords":"COMMERCIAL_EVIDENCE_HASH_SALT=\"<owner-held salt>\" npm run compose:commercial-evidence-records -- --write --require-all","generateManualWcagReviewPacket":"npm run generate:manual-wcag-review-packet","hashManualWcagProofArtifacts":"npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>","validateManualWcagEvidence":"npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete","finalCloseout":"npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-intake docs/commercialization/commercial-evidence-intake.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json"}} | none |
| compose-live-evidence | fail | `node scripts/compose-live-gate-evidence.mjs --require-complete --output docs/commercialization/live-gate-evidence.local.json` | {"ok":false,"complete":false,"wrote":null,"acceptedGateIds":["production_calibration_run","authenticated_live_artifact_e2e"],"errorCount":2,"errorExcerpts":["stripe-test-checkout: docs/commercialization/stripe-test-checkout-proof-latest.json must have status=passed and all checks passed","stripe-live-mrr: docs/commercialization/stripe-live-mrr-proof-latest.json must have status=passed and all checks passed"]} | stripe-test-checkout: docs/commercialization/stripe-test-checkout-proof-latest.json must have status=passed and all checks passed<br>stripe-live-mrr: docs/commercialization/stripe-live-mrr-proof-latest.json must have status=passed and all checks passed |
| compose-commercial-records | fail | `node scripts/compose-commercial-evidence-records.mjs --require-all --intake docs/commercialization/commercial-evidence-intake.local.json --output docs/commercialization/commercial-evidence-records.local.json` | {"ok":false,"wrote":null,"partnerGateSatisfied":false,"outcomeGateSatisfied":false,"uniqueDesignPartnerCount":0,"uniqueOutcomeCount":0,"errorCount":29,"errorExcerpts":["hashSalt or COMMERCIAL_EVIDENCE_HASH_SALT must be an owner-held non-placeholder string with at least 16 characters","designPartnerCommitments[0].partnerRef must not be a placeholder","designPartnerCommitments[0].proofArtifactHashes must contain at least one non-placeholder sha256 hash","designPartnerCommitments[0].proofArtifactTypes must contain at least one supported proof artifact type","designPartnerCommitments[0].rawEvidenceOwnerHeld must be true","designPartnerCommitments[0].integrityAttestations must be an object","designPartnerCommitments[0].ownerEvidenceArchive must be an object","designPartnerCommitments[1].partnerRef must not be a placeholder","21 additional error(s) omitted from this redacted summary"]} | hashSalt or COMMERCIAL_EVIDENCE_HASH_SALT must be an owner-held non-placeholder string with at least 16 characters<br>designPartnerCommitments[0].partnerRef must not be a placeholder<br>designPartnerCommitments[0].proofArtifactHashes must contain at least one non-placeholder sha256 hash<br>designPartnerCommitments[0].proofArtifactTypes must contain at least one supported proof artifact type<br>designPartnerCommitments[0].rawEvidenceOwnerHeld must be true<br>designPartnerCommitments[0].integrityAttestations must be an object<br>designPartnerCommitments[0].ownerEvidenceArchive must be an object<br>designPartnerCommitments[1].partnerRef must not be a placeholder<br>21 additional error(s) omitted from this redacted summary |
| verify-live-evidence | fail | `node scripts/verify-live-gate-evidence.mjs --evidence docs/commercialization/live-gate-evidence.local.json --require-complete` | {"ok":false,"found":true,"complete":false,"acceptedGateIds":["production_calibration_run","authenticated_live_artifact_e2e"],"errorCount":0,"errorExcerpts":[]} | stderr: Not all live-gate evidence items are accepted. |
| verify-commercial-records | fail | `node scripts/verify-commercial-evidence-records.mjs --evidence docs/commercialization/commercial-evidence-records.local.json --require-all` | {"ok":false,"found":false,"partnerGateSatisfied":false,"outcomeGateSatisfied":false,"uniqueDesignPartnerCount":0,"uniqueOutcomeCount":0,"errorCount":0,"errorExcerpts":[]} | stderr: Three committed design partners are not proven by the redacted commercial evidence records. |
| verify-manual-wcag-evidence | fail | `node scripts/verify-manual-wcag-evidence.mjs --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete` | {"ok":false,"found":false,"complete":false,"manualWcagGateSatisfied":false,"acceptedCheckpointIds":[],"acceptedCheckpointCount":0,"requiredCheckpointCount":8,"checkpointResultCount":0,"requiredRouteCount":9,"routeReviewedCount":0,"requiredCompleteProcessCount":5,"completeProcessReviewedCount":0,"requiredAccessibilitySupportBaselineCount":2,"accessibilitySupportBaselineCount":0,"requiredOfficialReferenceCount":7,"officialReferenceCount":0,"errorCount":0,"errorExcerpts":[]} | stderr: Manual WCAG evidence is incomplete. |
| verify-remediation-gates | fail | `node scripts/verify-remediation-external-gates.mjs --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete` | {"ok":false,"goalComplete":false,"acceptedLiveGateIds":["production_calibration_run","authenticated_live_artifact_e2e"],"partnerGateSatisfied":false,"outcomeGateSatisfied":false,"manualWcagGateSatisfied":false,"blockedGateIds":["manual_wcag_evidence","real_stripe_test_checkout","three_committed_partners","documented_outcomes"],"ownerActionQueueCount":5,"ownerActionGateIds":["manual_wcag_evidence","real_stripe_test_checkout","live_mrr_gt_zero","three_committed_partners","documented_outcomes"],"gateCount":13,"remainingManualEvidenceCount":5,"wrote":null,"errorExcerpts":[]} | stderr: Remediation external gates are not complete. See generated artifact for remaining evidence. |

## Next Commands

Prepare local owner evidence scaffolding:

`npm run prepare:owner-evidence -- --write`

Verify local owner evidence paths are ignored and untracked:

`npm run verify:owner-evidence-local-safety`

Generate live proof run packet and matrix:

`npm run generate:live-proof-run-packet`

Load owner-held environment into the current shell before live proof commands:

`set -a; source .env.local; set +a`

Collect live proof artifacts:

- `npm run verify:stripe-test-checkout`
- `npm run verify:production-calibration`
- `npm run verify:commercial-live-auth-e2e`
- `npm run verify:stripe-live-mrr`

Compose redacted partial live-gate evidence from passing live proof artifacts:

`npm run compose:live-gate-evidence -- --write --allow-partial --output docs/commercialization/live-gate-evidence.local.json`

Validate at least one accepted redacted live-gate evidence item:

`npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-any`

Compose complete redacted live-gate evidence after all live proof artifacts pass:

`npm run compose:live-gate-evidence -- --write --require-complete --output docs/commercialization/live-gate-evidence.local.json`

Validate complete redacted live-gate evidence before final closeout:

`npm run verify:live-gate-evidence -- --evidence docs/commercialization/live-gate-evidence.local.json --require-complete`

Generate commercial partner/outcome evidence intake packet:

`npm run generate:commercial-evidence-intake-packet`

Hash commercial partner/outcome proof artifacts:

`npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>`

Compose redacted commercial partner/outcome evidence records:

`COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all`

Validate redacted commercial partner/outcome evidence records:

`npm run verify:commercial-evidence-records -- --evidence docs/commercialization/commercial-evidence-records.local.json --require-all`

Generate manual WCAG review packet and route/checkpoint matrix:

`npm run generate:manual-wcag-review-packet`

Hash manual WCAG proof artifacts:

`npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>`

Validate manual WCAG evidence:

`npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete`

Compose final closeout:

`npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-intake docs/commercialization/commercial-evidence-intake.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json`

Status-only rerun:

`npm run verify:owner-evidence-closeout`
