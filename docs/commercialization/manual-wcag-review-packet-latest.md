# Manual WCAG Review Packet

Generated: 2026-06-08T23:23:36.520Z

Schema: `2026-06-04.apo-manual-wcag-review-packet.v1`

Manual evidence schema: `2026-06-04.apo-manual-wcag-evidence.v1`

Status: `owner_manual_review_required`

This packet converts the manual WCAG evidence schema into an owner-review execution matrix. It is not launch proof and it is not a WCAG conformance statement.

Primary source artifact: `docs/commercialization/manual-wcag-evidence-template.json`

Source artifact count: 6

Source trace rows: 6

## Evidence Boundary

This packet is an owner-review worksheet only. Raw reviewer notes, screenshots, recordings, assistive-technology transcripts, reviewer identity, reviewer profile URLs, meeting/calendar links, issue tracker details, evaluation-tool output, sample archives, artifact hash source maps, and private user data must remain owner-held outside tracked files. The packet does not make placeholder hashes count as proof.

## Hasher Input Boundary

When hashing proof artifacts, use ordinary owner-held files outside git or under an ignored local proof path. The hasher rejects symbolic links, hard-linked files, tracked files, staged files, and non-ignored repository files; copy proof material to a single-link owner-held file before hashing.

## Source Trace

This source trace maps each generated manual WCAG review packet provenance row to the sourceArtifacts key used by the owner worksheet. It does not perform manual accessibility review, read owner-held reviewer notes, screenshots, recordings, assistive-technology transcripts, issue details, evaluation-tool output, sample archives, artifact hash source maps, private user data, or upgrade launch readiness.

| Key | Artifact | Source anchor |
| --- | --- | --- |
| automatedAccessibilityAudit | `docs/commercialization/commercial-accessibility-audit-latest.json` | `docs/commercialization/manual-wcag-review-packet-latest.json#sourceArtifacts.automatedAccessibilityAudit` |
| manualEvidenceTemplate | `docs/commercialization/manual-wcag-evidence-template.json` | `docs/commercialization/manual-wcag-review-packet-latest.json#sourceArtifacts.manualEvidenceTemplate` |
| ownerHasher | `scripts/hash-owner-evidence-artifacts.mjs` | `docs/commercialization/manual-wcag-review-packet-latest.json#sourceArtifacts.ownerHasher` |
| latestManualWcagEvidence | `docs/commercialization/manual-wcag-evidence-latest.json` | `docs/commercialization/manual-wcag-review-packet-latest.json#sourceArtifacts.latestManualWcagEvidence` |
| closeoutStatus | `docs/commercialization/owner-evidence-closeout-status-latest.json` | `docs/commercialization/manual-wcag-review-packet-latest.json#sourceArtifacts.closeoutStatus` |
| manualEvidenceVerifier | `scripts/verify-manual-wcag-evidence.mjs` | `docs/commercialization/manual-wcag-review-packet-latest.json#sourceArtifacts.manualEvidenceVerifier` |

## Counts

| Item | Count |
| --- | ---: |
| Required routes | 9 |
| Required checkpoints | 8 |
| Official W3C/WAI references | 7 |
| Required complete processes | 5 |
| Required accessibility-support baseline combinations | 2 |
| Required owner-evidence archive policy fields | 9 |
| Route review plan rows | 9 |
| Checkpoint review plan rows | 8 |
| Route/checkpoint matrix rows | 72 |
| Verifier acceptance checklist items | 8 |
| Next commands | 4 |
| Does-not-prove boundaries | 6 |

## Latest Manual Evidence Summary

| Artifact | Status | Accepted checkpoints | Required checkpoints | Required routes | Gate satisfied |
| --- | --- | ---: | ---: | ---: | --- |
| `docs/commercialization/manual-wcag-evidence-latest.json` | no_local_evidence | 0 | 8 | 9 | false |

## Closeout Summary

| Artifact | Goal complete | Manual WCAG owner actions |
| --- | --- | ---: |
| `docs/commercialization/owner-evidence-closeout-status-latest.json` | false | 1 |

## Official References

| ID | Label | URL |
| --- | --- | --- |
| wcag22 | WCAG 2.2 Recommendation | https://www.w3.org/TR/WCAG22/ |
| wcag-em-overview | WCAG-EM overview | https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/ |
| wcag-em-2 | WCAG-EM 2.0 | https://www.w3.org/TR/wcag-em-2/ |
| wcag-em-report-tool | WCAG-EM Report Tool | https://www.w3.org/WAI/eval/report-tool/ |
| wai-easy-checks | WAI Easy Checks | https://www.w3.org/WAI/test-evaluate/preliminary/ |
| wai-aria-apg | WAI-ARIA Authoring Practices | https://www.w3.org/WAI/ARIA/apg/ |
| wcag2ict-22 | WCAG2ICT 2.2 | https://www.w3.org/TR/wcag2ict-22/ |

## Route Review Plan

| Route | Label | Automated smoke context | Automated viewports | Keyboard tab stops checked | Boundary |
| --- | --- | --- | ---: | ---: | --- |
| /privacy | privacy policy | automated_smoke_passed | 3 | 3 | Automated smoke context is only a pre-review signal; it does not prove manual WCAG evidence, assistive-technology behavior, legal compliance, procurement approval, or future accessibility. |
| /trust-center | commercial trust center | automated_smoke_passed | 3 | 30 | Automated smoke context is only a pre-review signal; it does not prove manual WCAG evidence, assistive-technology behavior, legal compliance, procurement approval, or future accessibility. |
| /for-coaches | coach landing page | automated_smoke_passed | 3 | 30 | Automated smoke context is only a pre-review signal; it does not prove manual WCAG evidence, assistive-technology behavior, legal compliance, procurement approval, or future accessibility. |
| /sample-report | coach sample report | automated_smoke_passed | 3 | 30 | Automated smoke context is only a pre-review signal; it does not prove manual WCAG evidence, assistive-technology behavior, legal compliance, procurement approval, or future accessibility. |
| /tools/resume-analyzer | resume analyzer | automated_smoke_passed | 3 | 12 | Automated smoke context is only a pre-review signal; it does not prove manual WCAG evidence, assistive-technology behavior, legal compliance, procurement approval, or future accessibility. |
| /tools/counselor-reports | counselor reports | automated_smoke_passed | 3 | 30 | Automated smoke context is only a pre-review signal; it does not prove manual WCAG evidence, assistive-technology behavior, legal compliance, procurement approval, or future accessibility. |
| /enterprise-dashboard | workforce dashboard | automated_smoke_passed | 3 | 30 | Automated smoke context is only a pre-review signal; it does not prove manual WCAG evidence, assistive-technology behavior, legal compliance, procurement approval, or future accessibility. |
| /proof-pack-gallery | proof-pack gallery | automated_smoke_passed | 3 | 30 | Automated smoke context is only a pre-review signal; it does not prove manual WCAG evidence, assistive-technology behavior, legal compliance, procurement approval, or future accessibility. |
| /automation-risk/accountant | occupation SEO report | automated_smoke_passed | 3 | 30 | Automated smoke context is only a pre-review signal; it does not prove manual WCAG evidence, assistive-technology behavior, legal compliance, procurement approval, or future accessibility. |

## Checkpoint Review Plan

| Checkpoint | Label | Standard refs | Required evidence summary fields | Owner-held artifacts |
| --- | --- | --- | --- | --- |
| wcag-em-scope | WCAG-EM scope and sampling | wcag-em-overview, wcag-em-2, wcag-em-report-tool | scopeDefined=true; conformanceTarget="WCAG 2.2 A/AA"; productScopeDefined=true; sampleSelectionRationaleDocumented=true; completeProcessesReviewed=true; accessibilitySupportBaselineDefined=true | evaluation scope notes; route sample rationale; sample-selection method notes; technologies relied upon notes; complete-process walkthrough notes; browser/assistive-technology support baseline matrix; WCAG-EM Report Tool JSON or HTML export retained owner-held; review-record archive checklist |
| keyboard-focus-not-obscured | Keyboard focus and focus-not-obscured review | wcag22 | keyboardTraversalCompleted=true; focusNotObscuredChecked=true | keyboard traversal notes; focus screenshots or recordings; issue/remediation log |
| target-size | Pointer target size review | wcag22 | pointerTargetReviewCompleted=true | target measurements; exception rationale; mobile screenshots |
| form-errors-and-redundant-entry | Form errors, labels, instructions, and redundant entry | wcag22, wai-easy-checks | errorStateReviewCompleted=true; redundantEntryReviewCompleted=true | form error screenshots; label/instruction notes; re-entry test notes |
| accessible-authentication | Accessible authentication and account/payment access | wcag22 | authFlowReviewed=true | auth flow notes; payment/account screenshots with private data redacted; accessibility exception notes |
| screen-reader-name-role-value | Screen-reader name, role, value, relationships, and keyboard semantics | wcag22, wai-aria-apg | assistiveTechnologies=[...]; nameRoleValueReviewCompleted=true | screen-reader transcript notes; name/role/value defect log; assistive-technology matrix |
| contrast-reflow-text-spacing | Contrast, reflow, non-text contrast, and text spacing | wcag22, wai-easy-checks | contrastReviewCompleted=true; reflowAndTextSpacingReviewCompleted=true | contrast measurements; text-spacing screenshots; reflow notes |
| downloadable-artifacts | Downloadable HTML/CSV/proof artifact accessibility | wcag22, wai-easy-checks, wai-aria-apg, wcag2ict-22 | artifactsReviewed=[...]; downloadedArtifactReviewCompleted=true | downloaded artifact list; artifact screenshots; assistive-technology notes |

## Verifier Acceptance Checklist

These are the machine-readable conditions that `npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete` expects before the manual WCAG gate can close.

| Checklist item | Verifier paths | Accepted when | Boundary |
| --- | --- | --- | --- |
| scope-and-sample | evaluationScope.productScope, evaluationScope.sampleSelectionRationale, evaluationScope.sampleSetSelectionMethod, targetStandard, methodology, evaluationScope.routesReviewed, evaluationScope.technologiesReliedUpon, evaluationScope.browsers, evaluationScope.assistiveTechnologies, evaluationScope.viewports | Evidence uses targetStandard=WCAG 2.2 A/AA, methodology=WCAG-EM, includes all 9 required commercial routes, describes the sample-selection method and technologies relied upon, and covers mobile/tablet/desktop plus browser and assistive-technology matrices. | Scope metadata is necessary but does not prove accessibility until every checkpoint is manually reviewed and accepted. |
| complete-process-and-support-baseline | evaluationScope.completeProcessesReviewed, evaluationScope.accessibilitySupportBaseline[].operatingSystem, evaluationScope.accessibilitySupportBaseline[].browser, evaluationScope.accessibilitySupportBaseline[].assistiveTechnology, evaluationScope.accessibilitySupportBaseline[].inputModalities, evaluationScope.accessibilitySupportBaseline[].viewports | Evidence includes all 5 required complete processes and at least 2 explicit browser/assistive-technology support combinations with keyboard input covered. | Support-baseline metadata defines reviewed combinations only; it does not prove unreviewed operating systems, browsers, assistive technologies, or future UI states. |
| evaluation-specifics-and-archive | reviewRecordArchive.samplesArchivedOwnerHeld, reviewRecordArchive.evaluationToolsRecorded, reviewRecordArchive.wcagEmReportToolExportOwnerHeld, reviewRecordArchive.browserAssistiveTechnologyVersionsRecorded, reviewRecordArchive.navigationPathsRecorded, reviewRecordArchive.issueLogOwnerHeld, reviewRecordArchive.rawEvidenceSecurityReviewed, reviewRecordArchive.reEvaluationRequiredAfterMaterialChange | Evidence includes reviewRecordArchive with all required attestations true: samplesArchivedOwnerHeld, evaluationToolsRecorded, wcagEmReportToolExportOwnerHeld, browserAssistiveTechnologyVersionsRecorded, navigationPathsRecorded, issueLogOwnerHeld, rawEvidenceSecurityReviewed, reEvaluationRequiredAfterMaterialChange. | Archive metadata confirms review records were retained owner-side only; it does not expose the records or independently validate reviewer findings. |
| owner-evidence-archive | ownerEvidenceArchive.rawReviewerNotesOwnerHeldOutsideGit, ownerEvidenceArchive.screenshotsRecordingsOwnerHeldOutsideGit, ownerEvidenceArchive.assistiveTechnologyTranscriptsOwnerHeldOutsideGit, ownerEvidenceArchive.reviewerIdentityOwnerHeldOutsideGit, ownerEvidenceArchive.issueDetailsOwnerHeldOutsideGit, ownerEvidenceArchive.evaluationToolOutputOwnerHeldOutsideGit, ownerEvidenceArchive.sampleArchivesOwnerHeldOutsideGit, ownerEvidenceArchive.artifactHashSourceMapOwnerHeld, ownerEvidenceArchive.reReviewRequiredAfterMaterialChange | Evidence includes ownerEvidenceArchive with all required policy fields true: rawReviewerNotesOwnerHeldOutsideGit, screenshotsRecordingsOwnerHeldOutsideGit, assistiveTechnologyTranscriptsOwnerHeldOutsideGit, reviewerIdentityOwnerHeldOutsideGit, issueDetailsOwnerHeldOutsideGit, evaluationToolOutputOwnerHeldOutsideGit, sampleArchivesOwnerHeldOutsideGit, artifactHashSourceMapOwnerHeld, reReviewRequiredAfterMaterialChange. | OwnerEvidenceArchive metadata is a storage and re-review policy only; it does not expose raw artifacts or prove WCAG conformance. |
| official-reference-basis | officialReferences[].id, officialReferences[].url, officialReferences[].accessedAt | Evidence includes all 7 required W3C/WAI references with exact URLs and non-future accessedAt dates not later than asOf. | Reference metadata proves the review basis only; it does not prove the app satisfies those standards. |
| reviewer-attestation | evaluator.reviewerIdHash, evaluator.reviewType, evaluator.independenceBoundary, evaluator.expertiseConfirmed, evaluator.conflictOfInterestDisclosed, reviewerAttestation.manualReviewCompleted, reviewerAttestation.assistiveTechnologyReviewCompleted, reviewerAttestation.noWcagConformanceClaim, reviewerAttestation.noProcurementApprovalClaim, reviewerAttestation.ownerHeldRawNotes | Reviewer identity is represented only by a non-placeholder sha256 hash, review type and independence/conflict boundary are disclosed, expertise is attested, manual and assistive-technology reviews are complete, raw notes stay owner-held, and no WCAG conformance or procurement-approval claim is made. | Reviewer attestation supports the owner evidence gate but does not create legal, procurement, or warranty language. |
| checkpoint-coverage | checkpointResults[].checkpointId, checkpointResults[].status, checkpointResults[].routesReviewed, checkpointResults[].standardRefs, checkpointResults[].evidenceSummary | All 8 required checkpoints are present once, use accepted statuses only, include every required route, include checkpoint-specific standard refs, and provide the required evidenceSummary fields. | Checkpoint coverage is redacted metadata; unresolved issues, missing routes, duplicate checkpoints, or missing evidenceSummary fields keep the gate incomplete. |
| artifact-hashes-and-issue-closeout | checkpointResults[].artifactHashes, checkpointResults[].unresolvedIssueCount, checkpointResults[].remediatedIssueCount, checkpointResults[].doesNotProve | Every accepted checkpoint has at least one non-placeholder sha256 proof hash, unresolvedIssueCount=0, a non-negative remediatedIssueCount, and explicit does-not-prove boundaries. | Hashes prove only that owner-held artifacts were represented in the metadata; they do not expose or independently validate the raw artifacts. |

## Matrix CSV

Tracked CSV: `docs/commercialization/manual-wcag-review-matrix-latest.csv`

Use the CSV as the reviewer worksheet. After review, store only redacted metadata and hashes in `docs/commercialization/manual-wcag-evidence.local.json`.

## Next Commands

- `npm run verify:commercial-a11y`
- `npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>`
- `npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete`
- `npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-intake docs/commercialization/commercial-evidence-intake.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json`

## Does Not Prove

- WCAG conformance statement
- Legal compliance
- Institutional procurement approval
- Manual review completion
- Assistive-technology coverage beyond reviewed combinations
- Future accessibility after code changes
