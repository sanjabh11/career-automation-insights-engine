# Commercial Evidence Intake Packet

Generated: 2026-06-08T23:23:25.382Z

Status: `owner_commercial_evidence_required`

Primary source artifact: `docs/commercialization/commercial-evidence-intake-template.json`

Source artifact count: 6

Source trace rows: 6

Does-not-prove boundaries: 9

## Evidence Boundary

This packet is an owner-intake worksheet only. Raw partner names, contact details, profile URLs, meeting/calendar links, contracts, private notes, private quotes, customer data, proof artifacts, material-connection reviews, incentive reviews, typicality substantiation, approval trails, and hash salts must remain owner-held outside tracked files. The packet does not prove partner commitments, documented outcomes, revenue, retention, causality, market-wide demand, guaranteed career outcomes, legal compliance, or testimonial compliance.

## Hasher Input Boundary

When hashing proof artifacts, use ordinary owner-held files outside git or under an ignored local proof path. The hasher rejects symbolic links, hard-linked files, tracked files, staged files, and non-ignored repository files; copy proof material to a single-link owner-held file before hashing.

## Does Not Prove

- Partner commitments
- Documented outcomes
- Revenue
- Retention
- Causal product impact
- Market-wide demand
- Guaranteed career outcomes
- Legal compliance
- Testimonial compliance

## Source Trace

This source trace maps each generated commercial-evidence intake packet provenance row to the sourceArtifacts key used by the owner worksheet. It does not read owner-held partner or outcome evidence contents, hash salts, raw proof files, private quotes, contracts, contacts, payment data, live systems, or upgrade launch readiness.

| Key | Artifact | Source anchor |
| --- | --- | --- |
| intakeTemplate | `docs/commercialization/commercial-evidence-intake-template.json` | `docs/commercialization/commercial-evidence-intake-packet-latest.json#sourceArtifacts.intakeTemplate` |
| ownerHasher | `scripts/hash-owner-evidence-artifacts.mjs` | `docs/commercialization/commercial-evidence-intake-packet-latest.json#sourceArtifacts.ownerHasher` |
| composer | `scripts/compose-commercial-evidence-records.mjs` | `docs/commercialization/commercial-evidence-intake-packet-latest.json#sourceArtifacts.composer` |
| verifier | `scripts/verify-commercial-evidence-records.mjs` | `docs/commercialization/commercial-evidence-intake-packet-latest.json#sourceArtifacts.verifier` |
| latestRecords | `docs/commercialization/commercial-evidence-records-latest.json` | `docs/commercialization/commercial-evidence-intake-packet-latest.json#sourceArtifacts.latestRecords` |
| closeoutStatus | `docs/commercialization/owner-evidence-closeout-status-latest.json` | `docs/commercialization/commercial-evidence-intake-packet-latest.json#sourceArtifacts.closeoutStatus` |

## Required Counts

| Item | Count |
| --- | ---: |
| Design partner commitments | 3 |
| Documented outcomes | 1 |
| Requirement matrix rows | 67 |
| Required gates | 2 |
| Record slots | 4 |
| Owner command sequence | 4 |
| Does-not-prove boundaries | 9 |
| Official references | 4 |

## Latest Records Summary

| Artifact | Status | Partners | Outcomes | Partner gate | Outcome gate |
| --- | --- | ---: | ---: | --- | --- |
| `docs/commercialization/commercial-evidence-records-latest.json` | no_local_evidence | 0 / 3 | 0 / 1 | false | false |

## Owner Command Sequence

- `npm run generate:commercial-evidence-intake-packet`
- `npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>`
- `COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all`
- `npm run verify:commercial-evidence-records -- --evidence docs/commercialization/commercial-evidence-records.local.json --require-all`

## Official Reference Basis

| Reference | URL | Applies to |
| --- | --- | --- |
| FTC Consumer Reviews and Testimonials Rule questions | https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers | fake or false review/testimonial boundary; review/testimonial rule awareness |
| FTC endorsements, influencers, and reviews | https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews | quote approval; review/testimonial boundaries; material connection awareness |
| FTC Endorsement Guides: What People Are Asking | https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking | honest endorsement handling; material connection disclosure review |
| FTC soliciting and paying for online reviews guide | https://www.ftc.gov/business-guidance/resources/soliciting-paying-online-reviews-guide-marketers | review solicitation integrity; anti-fake-review boundary |

## Requirement Matrix

Use the CSV companion for worksheet execution: `docs/commercialization/commercial-evidence-intake-matrix-latest.csv`.

| Slot | Type | Requirement | Required value | Owner input location | Status |
| --- | --- | --- | --- | --- | --- |
| partner-1 | design_partner_commitment | partner-ref | Non-placeholder partnerRef | designPartnerCommitments[].partnerRef | owner_evidence_required |
| partner-1 | design_partner_commitment | segment | Segment such as career_coach, career_center, or workforce_board | designPartnerCommitments[].segment | owner_evidence_required |
| partner-1 | design_partner_commitment | committed-at | ISO date or datetime not later than asOf | designPartnerCommitments[].committedAt | owner_evidence_required |
| partner-1 | design_partner_commitment | permissioned | true | designPartnerCommitments[].permissioned | owner_evidence_required |
| partner-1 | design_partner_commitment | contact-permission | true | designPartnerCommitments[].contactPermission | owner_evidence_required |
| partner-1 | design_partner_commitment | pilot-scope-accepted | true | designPartnerCommitments[].pilotScopeAccepted | owner_evidence_required |
| partner-1 | design_partner_commitment | planning-only-use-confirmed | true | designPartnerCommitments[].planningOnlyUseConfirmed | owner_evidence_required |
| partner-1 | design_partner_commitment | artifact-reviewed | Non-empty artifactReviewed | designPartnerCommitments[].artifactReviewed | owner_evidence_required |
| partner-1 | design_partner_commitment | next-step-recorded | true | designPartnerCommitments[].nextStepRecorded | owner_evidence_required |
| partner-1 | design_partner_commitment | proof-artifact-hashes | At least one non-placeholder sha256 hash | designPartnerCommitments[].proofArtifactHashes | owner_evidence_required |
| partner-1 | design_partner_commitment | proof-artifact-types | artifact_review_log plus at least one of permissioned_email; signed_pilot_scope | designPartnerCommitments[].proofArtifactTypes | owner_evidence_required |
| partner-1 | design_partner_commitment | raw-evidence-owner-held | true | designPartnerCommitments[].rawEvidenceOwnerHeld | owner_evidence_required |
| partner-1 | design_partner_commitment | redaction-level | Description with at least 6 characters | designPartnerCommitments[].redactionLevel | owner_evidence_required |
| partner-1 | design_partner_commitment | integrity-attestations | marketingUseReviewed; materialConnectionReviewed; incentiveOrCompensationReviewed; noFakeOrSyntheticTestimonial; noReviewGatingOrSuppression | designPartnerCommitments[].integrityAttestations | owner_evidence_required |
| partner-1 | design_partner_commitment | owner-evidence-archive | permissionTrailOwnerHeld; pilotScopeRecordOwnerHeld; artifactReviewLogOwnerHeld; contactDetailsOwnerHeldOutsideGit; materialConnectionReviewOwnerHeld; incentiveOrCompensationReviewOwnerHeld; reviewSolicitationNotConditionedOnSentiment; reReviewRequiredBeforePublicUse | designPartnerCommitments[].ownerEvidenceArchive | owner_evidence_required |
| partner-1 | design_partner_commitment | does-not-prove | Non-empty doesNotProve array | designPartnerCommitments[].doesNotProve | owner_evidence_required |
| partner-2 | design_partner_commitment | partner-ref | Non-placeholder partnerRef | designPartnerCommitments[].partnerRef | owner_evidence_required |
| partner-2 | design_partner_commitment | segment | Segment such as career_coach, career_center, or workforce_board | designPartnerCommitments[].segment | owner_evidence_required |
| partner-2 | design_partner_commitment | committed-at | ISO date or datetime not later than asOf | designPartnerCommitments[].committedAt | owner_evidence_required |
| partner-2 | design_partner_commitment | permissioned | true | designPartnerCommitments[].permissioned | owner_evidence_required |
| partner-2 | design_partner_commitment | contact-permission | true | designPartnerCommitments[].contactPermission | owner_evidence_required |
| partner-2 | design_partner_commitment | pilot-scope-accepted | true | designPartnerCommitments[].pilotScopeAccepted | owner_evidence_required |
| partner-2 | design_partner_commitment | planning-only-use-confirmed | true | designPartnerCommitments[].planningOnlyUseConfirmed | owner_evidence_required |
| partner-2 | design_partner_commitment | artifact-reviewed | Non-empty artifactReviewed | designPartnerCommitments[].artifactReviewed | owner_evidence_required |
| partner-2 | design_partner_commitment | next-step-recorded | true | designPartnerCommitments[].nextStepRecorded | owner_evidence_required |
| partner-2 | design_partner_commitment | proof-artifact-hashes | At least one non-placeholder sha256 hash | designPartnerCommitments[].proofArtifactHashes | owner_evidence_required |
| partner-2 | design_partner_commitment | proof-artifact-types | artifact_review_log plus at least one of permissioned_email; signed_pilot_scope | designPartnerCommitments[].proofArtifactTypes | owner_evidence_required |
| partner-2 | design_partner_commitment | raw-evidence-owner-held | true | designPartnerCommitments[].rawEvidenceOwnerHeld | owner_evidence_required |
| partner-2 | design_partner_commitment | redaction-level | Description with at least 6 characters | designPartnerCommitments[].redactionLevel | owner_evidence_required |
| partner-2 | design_partner_commitment | integrity-attestations | marketingUseReviewed; materialConnectionReviewed; incentiveOrCompensationReviewed; noFakeOrSyntheticTestimonial; noReviewGatingOrSuppression | designPartnerCommitments[].integrityAttestations | owner_evidence_required |
| partner-2 | design_partner_commitment | owner-evidence-archive | permissionTrailOwnerHeld; pilotScopeRecordOwnerHeld; artifactReviewLogOwnerHeld; contactDetailsOwnerHeldOutsideGit; materialConnectionReviewOwnerHeld; incentiveOrCompensationReviewOwnerHeld; reviewSolicitationNotConditionedOnSentiment; reReviewRequiredBeforePublicUse | designPartnerCommitments[].ownerEvidenceArchive | owner_evidence_required |
| partner-2 | design_partner_commitment | does-not-prove | Non-empty doesNotProve array | designPartnerCommitments[].doesNotProve | owner_evidence_required |
| partner-3 | design_partner_commitment | partner-ref | Non-placeholder partnerRef | designPartnerCommitments[].partnerRef | owner_evidence_required |
| partner-3 | design_partner_commitment | segment | Segment such as career_coach, career_center, or workforce_board | designPartnerCommitments[].segment | owner_evidence_required |
| partner-3 | design_partner_commitment | committed-at | ISO date or datetime not later than asOf | designPartnerCommitments[].committedAt | owner_evidence_required |
| partner-3 | design_partner_commitment | permissioned | true | designPartnerCommitments[].permissioned | owner_evidence_required |
| partner-3 | design_partner_commitment | contact-permission | true | designPartnerCommitments[].contactPermission | owner_evidence_required |
| partner-3 | design_partner_commitment | pilot-scope-accepted | true | designPartnerCommitments[].pilotScopeAccepted | owner_evidence_required |
| partner-3 | design_partner_commitment | planning-only-use-confirmed | true | designPartnerCommitments[].planningOnlyUseConfirmed | owner_evidence_required |
| partner-3 | design_partner_commitment | artifact-reviewed | Non-empty artifactReviewed | designPartnerCommitments[].artifactReviewed | owner_evidence_required |
| partner-3 | design_partner_commitment | next-step-recorded | true | designPartnerCommitments[].nextStepRecorded | owner_evidence_required |
| partner-3 | design_partner_commitment | proof-artifact-hashes | At least one non-placeholder sha256 hash | designPartnerCommitments[].proofArtifactHashes | owner_evidence_required |
| partner-3 | design_partner_commitment | proof-artifact-types | artifact_review_log plus at least one of permissioned_email; signed_pilot_scope | designPartnerCommitments[].proofArtifactTypes | owner_evidence_required |
| partner-3 | design_partner_commitment | raw-evidence-owner-held | true | designPartnerCommitments[].rawEvidenceOwnerHeld | owner_evidence_required |
| partner-3 | design_partner_commitment | redaction-level | Description with at least 6 characters | designPartnerCommitments[].redactionLevel | owner_evidence_required |
| partner-3 | design_partner_commitment | integrity-attestations | marketingUseReviewed; materialConnectionReviewed; incentiveOrCompensationReviewed; noFakeOrSyntheticTestimonial; noReviewGatingOrSuppression | designPartnerCommitments[].integrityAttestations | owner_evidence_required |
| partner-3 | design_partner_commitment | owner-evidence-archive | permissionTrailOwnerHeld; pilotScopeRecordOwnerHeld; artifactReviewLogOwnerHeld; contactDetailsOwnerHeldOutsideGit; materialConnectionReviewOwnerHeld; incentiveOrCompensationReviewOwnerHeld; reviewSolicitationNotConditionedOnSentiment; reReviewRequiredBeforePublicUse | designPartnerCommitments[].ownerEvidenceArchive | owner_evidence_required |
| partner-3 | design_partner_commitment | does-not-prove | Non-empty doesNotProve array | designPartnerCommitments[].doesNotProve | owner_evidence_required |
| outcome-1 | documented_outcome | outcome-ref | Non-placeholder outcomeRef | documentedOutcomes[].outcomeRef | owner_evidence_required |
| outcome-1 | documented_outcome | observed-at | ISO date or datetime not later than asOf | documentedOutcomes[].observedAt | owner_evidence_required |
| outcome-1 | documented_outcome | permissioned | true | documentedOutcomes[].permissioned | owner_evidence_required |
| outcome-1 | documented_outcome | baseline-workflow-captured | true | documentedOutcomes[].baselineWorkflowCaptured | owner_evidence_required |
| outcome-1 | documented_outcome | artifact-reviewed | Non-empty artifactReviewed | documentedOutcomes[].artifactReviewed | owner_evidence_required |
| outcome-1 | documented_outcome | measured-change-captured | true | documentedOutcomes[].measuredChangeCaptured | owner_evidence_required |
| outcome-1 | documented_outcome | approved-quote-captured | true | documentedOutcomes[].approvedQuoteCaptured | owner_evidence_required |
| outcome-1 | documented_outcome | quote-approval-captured | true | documentedOutcomes[].quoteApprovalCaptured | owner_evidence_required |
| outcome-1 | documented_outcome | measured-change-unit | Non-empty measuredChangeUnit | documentedOutcomes[].measuredChangeUnit | owner_evidence_required |
| outcome-1 | documented_outcome | measurement-window | Description with at least 6 characters | documentedOutcomes[].measurementWindow | owner_evidence_required |
| outcome-1 | documented_outcome | outcome-claim-scope | Description with at least 12 characters | documentedOutcomes[].outcomeClaimScope | owner_evidence_required |
| outcome-1 | documented_outcome | typicality-boundary | Description with at least 12 characters | documentedOutcomes[].typicalityBoundary | owner_evidence_required |
| outcome-1 | documented_outcome | proof-artifact-hashes | At least one non-placeholder sha256 hash | documentedOutcomes[].proofArtifactHashes | owner_evidence_required |
| outcome-1 | documented_outcome | proof-artifact-types | baseline_workflow_note; measured_change_summary; quote_approval | documentedOutcomes[].proofArtifactTypes | owner_evidence_required |
| outcome-1 | documented_outcome | raw-evidence-owner-held | true | documentedOutcomes[].rawEvidenceOwnerHeld | owner_evidence_required |
| outcome-1 | documented_outcome | redaction-level | Description with at least 6 characters | documentedOutcomes[].redactionLevel | owner_evidence_required |
| outcome-1 | documented_outcome | integrity-attestations | marketingUseReviewed; materialConnectionReviewed; incentiveOrCompensationReviewed; noFakeOrSyntheticTestimonial; noReviewGatingOrSuppression; counterfactualNotClaimed; guaranteedOutcomeNotClaimed | documentedOutcomes[].integrityAttestations | owner_evidence_required |
| outcome-1 | documented_outcome | owner-evidence-archive | baselineWorkflowEvidenceOwnerHeld; measuredChangeEvidenceOwnerHeld; quoteApprovalRecordOwnerHeld; privateQuoteTextOwnerHeldOutsideGit; materialConnectionReviewOwnerHeld; incentiveOrCompensationReviewOwnerHeld; typicalitySubstantiationOwnerHeld; reReviewRequiredBeforePublicCaseStudyUse | documentedOutcomes[].ownerEvidenceArchive | owner_evidence_required |
| outcome-1 | documented_outcome | does-not-prove | Non-empty doesNotProve array | documentedOutcomes[].doesNotProve | owner_evidence_required |
