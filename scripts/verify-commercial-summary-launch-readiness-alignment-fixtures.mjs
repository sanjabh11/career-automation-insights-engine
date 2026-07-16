#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-commercial-summary-launch-readiness-alignment.mjs');

const SUMMARY_JSON = 'docs/commercialization/commercial-verification-summary-latest.json';
const SUMMARY_MD = 'docs/commercialization/commercial-verification-summary-latest.md';
const LAUNCH_EVIDENCE_JSON = 'docs/commercialization/launch-evidence-latest.json';
const LAUNCH_EVIDENCE_MD = 'docs/commercialization/launch-evidence-latest.md';
const LAUNCH_EVIDENCE_GAPS_SOURCE_ARTIFACT = `${LAUNCH_EVIDENCE_JSON}#gaps`;
const LAUNCH_EVIDENCE_UNRESOLVED_BLOCKERS_SOURCE_ARTIFACT =
  `${LAUNCH_EVIDENCE_JSON}#fix_report.unresolved_blockers`;
const LAUNCH_EVIDENCE_BLOCKER_SOURCE_TRACE_BOUNDARY =
  'This launch-evidence blocker source trace identifies repo-generated launch gap, unresolved-blocker, remediation-completion, and remediation-gate anchors for each unresolved owner/live gate. It does not execute owner commands, collect owner-held evidence, run live checks, send outreach, or upgrade commercial readiness.';
const LAUNCH_EVIDENCE_BLOCKER_EVIDENCE_BOUNDARY =
  'This launch-evidence summary mirrors repo-generated launch gap and blocker rows only. It does not prove outreach delivery, buyer replies, partner commitments, documented outcomes, live checkout, live MRR, manual WCAG conformance, legal compliance, production state, or commercial readiness.';
const LAUNCH_EVIDENCE_SUMMARY_SOURCE_TRACE_BOUNDARY =
  'This launch-evidence summary source trace identifies repo-generated launch manifest anchors for score, deliverable-count, outreach, CRM export, fix-report, source-audit, and release-gate-command coverage. It does not execute outreach, rerun network fetches, collect owner-held evidence, run live checks, or upgrade commercial readiness.';
const LAUNCH_EVIDENCE_SUMMARY_EVIDENCE_BOUNDARY =
  'This compact summary mirrors launch-evidence required-output coverage and counts only. It does not prove outreach delivery, buyer replies, partner commitments, documented outcomes, live checkout, live MRR, manual WCAG conformance, legal compliance, production state, or commercial readiness.';
const PROOF_BUCKET_SOURCE_TRACE_BOUNDARY =
  'This proof-bucket source trace identifies repo-generated launch manifest anchors for each proof-bucket item and its source path. It does not execute proof commands, inspect owner-held evidence, rerun live checks, or upgrade commercial readiness.';
const PROOF_BUCKET_EVIDENCE_BOUNDARY =
  'This compact summary mirrors launch-evidence proof-bucket categorization and counts only. It does not prove owner-held evidence, live checkout, live MRR, partner commitments, documented outcomes, manual WCAG conformance, legal compliance, production state, or commercial readiness.';
const COMMERCIAL_ARTIFACT_REDACTION_JSON =
  'docs/commercialization/commercial-artifact-redaction-latest.json';
const COMMERCIAL_ARTIFACT_REDACTION_MD =
  'docs/commercialization/commercial-artifact-redaction-latest.md';
const LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON =
  'docs/commercialization/launch-evidence-source-audit-latest.json';
const COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON =
  'docs/commercialization/commercial-evidence-intake-source-audit-latest.json';
const LIVE_PROOF_RUN_PACKET_JSON =
  'docs/commercialization/live-proof-run-packet-latest.json';
const LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON =
  'docs/commercialization/live-proof-run-packet-source-audit-latest.json';
const LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON =
  'docs/commercialization/live-closeout-access-source-audit-latest.json';
const MANUAL_WCAG_REVIEW_PACKET_JSON =
  'docs/commercialization/manual-wcag-review-packet-latest.json';
const MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_JSON =
  'docs/commercialization/manual-wcag-review-packet-source-audit-latest.json';
const OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON =
  'docs/commercialization/owner-evidence-completion-drill-source-audit-latest.json';
const LAUNCH_SOURCE_AUDIT_SOURCE_ARTIFACT =
  `${LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON}#sources`;
const COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_SOURCE_ARTIFACT =
  `${COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON}#sources`;
const LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_SOURCE_ARTIFACT =
  `${LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON}#sources`;
const LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_SOURCE_ARTIFACT =
  `${LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON}#sources`;
const MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_SOURCE_ARTIFACT =
  `${MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_JSON}#sources`;
const OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_SOURCE_ARTIFACT =
  `${OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON}#sources`;
const SOURCE_AUDIT_SOURCE_TRACE_BOUNDARY =
  'This source-audit source trace identifies repo-generated official/reference source anchors, source status, and expected-text match counts from existing source-audit artifacts. It does not rerun network fetches, execute live checks, load credentials, collect owner-held evidence, or upgrade commercial readiness.';
const LIVE_CLOSEOUT_READINESS_JSON =
  'docs/commercialization/live-closeout-readiness-latest.json';
const LIVE_CLOSEOUT_READINESS_CHECKS_SOURCE_ARTIFACT =
  `${LIVE_CLOSEOUT_READINESS_JSON}#checks`;
const LIVE_CLOSEOUT_READINESS_NEXT_ACTIONS_SOURCE_ARTIFACT =
  `${LIVE_CLOSEOUT_READINESS_JSON}#nextActions`;
const LIVE_CLOSEOUT_READINESS_OFFICIAL_REFERENCES_SOURCE_ARTIFACT =
  `${LIVE_CLOSEOUT_READINESS_JSON}#officialReferences`;
const LIVE_CLOSEOUT_READINESS_SOURCE_TRACE_BOUNDARY =
  'This live closeout readiness source trace identifies repo-generated check, next-action, and official-reference anchors from the redacted readiness artifact. It does not rerun Supabase/GitHub access checks, load credentials, mutate external state, deploy functions, or upgrade launch readiness.';
const OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON =
  'docs/commercialization/owner-evidence-closeout-status-latest.json';
const OWNER_EVIDENCE_HANDOFF_JSON =
  'docs/commercialization/owner-evidence-handoff-latest.json';
const OWNER_EVIDENCE_COMPLETION_DRILL_JSON =
  'docs/commercialization/owner-evidence-completion-drill-latest.json';
const OWNER_EVIDENCE_LOCAL_SAFETY_JSON =
  'docs/commercialization/owner-evidence-local-safety-latest.json';
const REMEDIATION_COMPLETION_AUDIT_JSON =
  'docs/commercialization/remediation-completion-audit-latest.json';
const REMEDIATION_EXTERNAL_GATES_JSON =
  'docs/commercialization/remediation-external-gates-latest.json';
const OWNER_GATE_SCOREBOARD_SOURCE_ARTIFACT =
  `${OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON}#ownerGateScoreboard`;
const OWNER_GATE_SCOREBOARD_REMEDIATION_COMPLETION_SOURCE_ARTIFACT =
  `${REMEDIATION_COMPLETION_AUDIT_JSON}#remainingExternalGates`;
const OWNER_GATE_SCOREBOARD_SOURCE_TRACE_BOUNDARY =
  'This owner-gate scoreboard source trace identifies repo-generated anchors for each remaining owner/live gate across closeout, remediation, handoff, and completion-drill artifacts. It does not execute owner commands, collect owner-held evidence, run live checks, or upgrade commercial readiness.';
const REMEDIATION_COMPLETION_SOURCE_TRACE_BOUNDARY =
  'This remediation-completion source trace identifies repo-generated remainingExternalGates anchors for each unresolved owner/live gate. It does not execute owner commands, collect owner-held evidence, run live checks, or upgrade commercial readiness.';
const REMEDIATION_COMPLETION_EVIDENCE_BOUNDARY =
  'This remediation-completion summary mirrors repo-generated remaining external gate rows only. It does not prove owner-held evidence, live payment, live revenue, partner commitments, documented outcomes, manual WCAG conformance, or commercial readiness.';
const SUMMARY_SCHEMA = '2026-06-05.apo-commercial-verification-summary.v1';
const VERIFICATION_SUMMARY_BOUNDARY =
  'This summary records the repo-local commercial verification command invocation only. It does not prove owner-held evidence, live revenue, partner commitments, customer outcomes, legal compliance, WCAG conformance, production uptime, ignored-file hygiene, untracked file content safety beyond included secret/redaction scanners, or optional live/network/accessibility/browser-journey gates that were not included in this invocation.';
const VERIFICATION_SUMMARY_DOES_NOT_PROVE = [
  'owner-held Stripe, Supabase, customer, partner, outcome, accessibility-review, or credential evidence',
  'live MRR, three committed partners, documented outcomes, production calibration, or authenticated live artifact e2e completion',
  'legal compliance, WCAG conformance, employment-selection validity, production uptime, or buyer willingness to pay',
];
const EXPECTED_LAUNCH_READINESS_COMMAND =
  'node scripts/verify-commercial-summary-launch-readiness-alignment.mjs';
const EXPECTED_LAUNCH_READINESS_EXECUTION_ORDER = 'after post-summary redaction alignment verifier';
const EXPECTED_LAUNCH_READINESS_FIXTURE_COMMAND =
  'node scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs';
const EXPECTED_LAUNCH_READINESS_FIXTURE_EXECUTION_ORDER =
  'after post-summary launch-readiness alignment verifier';
const EXPECTED_LAUNCH_READINESS_BOUNDARY =
  'This verifier parses the final commercial verification summary, launch evidence manifest, manual WCAG review packet, owner closeout status, remediation completion audit, and remediation gate ledger only. It does not perform live checks or complete owner-held evidence gates.';
const EXPECTED_LAUNCH_READINESS_FIXTURE_BOUNDARY =
  'This fixture verifier copies summary and launch-readiness source artifacts into temporary files, mutates those copies, and proves launch decision, owner gate, source path, and Markdown boundary drift fail closed. It writes no repo artifacts.';
const POST_SUMMARY_COMMAND_SOURCE_TRACE_BOUNDARY =
  'This post-summary command-contract source trace identifies repo-generated command, artifact, fixture, approval, and rewrite anchors for post-summary release checks. It does not execute optional Browser/Computer, accessibility, network, full-local, live, payment, credential, outreach, worker, or owner-held gates.';
const POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_SOURCE_ARTIFACT =
  `${SUMMARY_JSON}#postSummaryLaunchReadinessAlignment`;
const POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_DOES_NOT_PROVE = [
  'commercial-ready status',
  'owner-held live, payment, partner, outcome, manual WCAG, production, procurement, or legal evidence',
  'that optional Browser/Computer, accessibility, network, audit, full-local, payment, credential, outreach, or owner-held evidence gates ran',
  'external customer demand, revenue, partner commitments, documented outcomes, legal compliance, or production uptime',
];
const OWNER_PREP_ACTION_NEEDED_BY_GATE_SOURCE_ARTIFACT =
  `${OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON}#ownerEvidencePrep.ownerActionNeededByGate`;
const OWNER_PREP_ACTION_NEEDED_BY_GATE_BOUNDARY =
  'This per-gate summary mirrors ownerEvidencePrep.ownerActionNeededByGate for remaining owner gates only. Gate-scoped counts can exceed unique owner actions when one owner-held artifact unblocks multiple gates. It does not expose owner-held evidence values or prove any external launch gate.';
const OWNER_OPERATIONAL_ACCESS_PREREQUISITE_SOURCE_ARTIFACT =
  `${OWNER_EVIDENCE_HANDOFF_JSON}#operationalAccessPrerequisites`;
const OWNER_OPERATIONAL_ACCESS_COMPLETION_DRILL_SOURCE_ARTIFACT =
  `${OWNER_EVIDENCE_COMPLETION_DRILL_JSON}#operationalAccessPrerequisites`;
const OWNER_OPERATIONAL_ACCESS_LIVE_CLOSEOUT_SOURCE_ARTIFACT =
  `${LIVE_CLOSEOUT_READINESS_JSON}#checks`;
const OWNER_OPERATIONAL_ACCESS_PREREQUISITE_BOUNDARY =
  'This release-level summary mirrors owner handoff operational-access prerequisites only. It does not grant Supabase access, deploy functions, run live closeout, ingest O*NET data, prove parser deployment, or upgrade commercial readiness.';
const OWNER_OPERATIONAL_ACCESS_SOURCE_TRACE_BOUNDARY =
  'This operational-access source trace identifies repo-generated handoff, completion-drill, and live closeout readiness anchors for owner access prerequisites. It does not grant Supabase access, execute live closeout, ingest O*NET data, deploy functions, or upgrade commercial readiness.';
const OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT =
  `${REMEDIATION_EXTERNAL_GATES_JSON}#ownerActionQueue`;
const REMEDIATION_EXTERNAL_GATES_SOURCE_TRACE_BOUNDARY =
  'This remediation external-gates source trace identifies repo-generated ownerActionQueue anchors for each unresolved owner/live gate. It does not execute owner commands, collect owner-held evidence, run live checks, or upgrade commercial readiness.';
const REMEDIATION_EXTERNAL_GATES_EVIDENCE_BOUNDARY =
  'This remediation external-gates summary mirrors repo-generated owner-action queue rows only. It does not prove owner-held evidence, live payment, live revenue, partner commitments, documented outcomes, manual WCAG conformance, or commercial readiness.';
const OWNER_ACTION_QUEUE_CLOSEOUT_SOURCE_ARTIFACT =
  `${OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON}#ownerActionQueue`;
const OWNER_ACTION_QUEUE_HANDOFF_SOURCE_ARTIFACT =
  `${OWNER_EVIDENCE_HANDOFF_JSON}#ownerActionRows`;
const OWNER_ACTION_QUEUE_COMPLETION_DRILL_SOURCE_ARTIFACT =
  `${OWNER_EVIDENCE_COMPLETION_DRILL_JSON}#completionRows`;
const OWNER_ACTION_QUEUE_SOURCE_TRACE_BOUNDARY =
  'This row-level source trace identifies repo-generated artifact anchors used to assemble owner-action queue commands, policies, and failure context. It does not execute owner commands, expose owner-held evidence, verify raw artifacts, or upgrade launch readiness.';
const OWNER_HANDOFF_COMMAND_SEQUENCE_SOURCE_ARTIFACT =
  `${OWNER_EVIDENCE_HANDOFF_JSON}#commandSequence`;
const OWNER_COMPLETION_DRILL_COMMAND_ORDER_SOURCE_ARTIFACT =
  `${OWNER_EVIDENCE_COMPLETION_DRILL_JSON}#recommendedCommandOrder`;
const OWNER_COMMAND_SEQUENCE_SOURCE_TRACE_BOUNDARY =
  'This command-level source trace identifies repo-generated owner handoff and completion-drill command anchors used to assemble release handoff sequences. It does not execute owner commands, load credentials, collect owner-held evidence, or upgrade launch readiness.';
const OWNER_CLOSEOUT_FAILED_STEPS_SOURCE_ARTIFACT =
  `${OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON}#steps`;
const OWNER_CLOSEOUT_FAILED_STEP_SOURCE_TRACE_BOUNDARY =
  'This failed-step source trace identifies repo-generated owner closeout status step anchors and commands for failed closeout steps. It does not execute owner commands, load credentials, collect owner-held evidence, or upgrade launch readiness.';
const OWNER_CLOSEOUT_NEXT_COMMANDS_SOURCE_ARTIFACT =
  `${OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON}#nextCommands`;
const OWNER_CLOSEOUT_STATUS_ARTIFACTS_SOURCE_ARTIFACT =
  `${OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON}#statusArtifacts`;
const OWNER_CLOSEOUT_NEXT_COMMAND_SOURCE_TRACE_BOUNDARY =
  'This closeout next-command source trace identifies repo-generated owner closeout command-map anchors and status-artifact anchors. It does not execute owner commands, load credentials, collect owner-held evidence, write owner-local files, or upgrade launch readiness.';
const OWNER_LOCAL_SAFETY_HANDOFF_SOURCE_ARTIFACT =
  `${OWNER_EVIDENCE_HANDOFF_JSON}#localSafetyStatus`;
const OWNER_LOCAL_SAFETY_COMPLETION_DRILL_SOURCE_ARTIFACT =
  `${OWNER_EVIDENCE_COMPLETION_DRILL_JSON}#localSafetyStatus`;
const OWNER_LOCAL_SAFETY_SOURCE_TRACE_BOUNDARY =
  'This local-safety source trace identifies owner-evidence-local-safety artifact anchors for git ignore, tracking, staging, error, and boundary counts. It does not read owner-held evidence file contents, load secrets, run live checks, or upgrade launch readiness.';
const OWNER_LOCAL_SAFETY_SUMMARY_SOURCE_TRACE_BOUNDARY =
  'This release-level local-safety source trace identifies repo-generated owner-evidence-local-safety, handoff, and completion-drill anchors for owner-local evidence path hygiene. It does not read owner-held evidence file contents, load secrets, run live checks, or upgrade launch readiness.';
const OWNER_LOCAL_SAFETY_SUMMARY_BOUNDARY =
  'This release-level summary mirrors repo-local owner-evidence local-safety artifact status and confirms the handoff/completion-drill copied status stays aligned. It does not inspect owner-held local evidence contents, prove live gates, or upgrade commercial readiness.';
const POST_SUMMARY_ARTIFACT_REDACTION_SOURCE_ARTIFACT =
  `${SUMMARY_JSON}#postSummaryArtifactRedaction`;
const POST_SUMMARY_ARTIFACT_REDACTION_COMMAND =
  'node scripts/verify-commercial-artifact-redaction.mjs --write';
const POST_SUMMARY_ARTIFACT_REDACTION_EXECUTION_ORDER =
  'after final commercial verification summary write';
const POST_SUMMARY_ARTIFACT_REDACTION_ALIGNMENT_COMMAND =
  'node scripts/verify-commercial-summary-redaction-alignment.mjs';
const POST_SUMMARY_ARTIFACT_REDACTION_ALIGNMENT_EXECUTION_ORDER =
  'after post-summary artifact redaction scan';
const POST_SUMMARY_ARTIFACT_REDACTION_ALIGNMENT_BOUNDARY =
  'This verifier parses the summary and redaction JSON artifacts only. It writes no generated docs, so it does not create an additional unscanned commercialization artifact.';
const POST_SUMMARY_ARTIFACT_REDACTION_FIXTURE_COMMAND =
  'node scripts/verify-commercial-summary-redaction-alignment-fixtures.mjs';
const POST_SUMMARY_ARTIFACT_REDACTION_FIXTURE_EXECUTION_ORDER =
  'after post-summary launch-readiness alignment fixtures';
const POST_SUMMARY_ARTIFACT_REDACTION_FIXTURE_BOUNDARY =
  'This fixture verifier copies the summary and redaction artifacts into temporary files, mutates those copies, and proves stale timestamps, missing scanned files, nonzero findings, and missing alignment metadata fail closed. It writes no repo artifacts.';
const POST_SUMMARY_ARTIFACT_REDACTION_BOUNDARY =
  'This release-level summary mirrors the post-summary artifact-redaction contract. The redaction artifact is generated after this summary timestamp, so use the later redaction artifact as the pass/fail evidence. This summary does not prove absence of secrets outside generated commercialization artifacts.';
const POST_SUMMARY_ARTIFACT_REDACTION_DOES_NOT_PROVE = [
  'absence of secrets in git history, ignored local evidence files, screenshots, browser caches, external provider dashboards, CI secrets, or owner-held archives',
  'validity of live Stripe, Supabase, customer, partner, outcome, accessibility-review, or credential evidence',
  'commercial-ready status or owner approval to expose raw evidence',
];
const POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_SOURCE_ARTIFACT =
  `${SUMMARY_JSON}#postSummaryLaunchEvidenceRefresh`;
const POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_COMMAND =
  'node scripts/generate-launch-evidence-manifest.mjs --write --validate';
const POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_EXECUTION_ORDER =
  'after initial passed summary write and before final summary rewrite';
const POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_TOP_LEVEL_BOUNDARY =
  'The runner first writes a passed summary, refreshes launch evidence from that passed summary, then rewrites the final summary so progress updates and Code Optimization Gate rows remain in parity before redaction and launch-readiness alignment checks. This does not execute optional live, network, browser, accessibility, payment, credential, outreach, or owner-held evidence gates.';
const POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_STATE_BOUNDARY =
  'This release-level state summary mirrors the post-summary launch-evidence refresh contract. It proves the refresh command is included after an initial passed summary and before the final summary rewrite; it does not execute optional live, network, browser, accessibility, payment, credential, outreach, or owner-held evidence gates.';
const POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_FINAL_REWRITE_PURPOSE =
  'Keep commercialReadinessState.progressUpdates, implementationDecisions, rejectedVariants, and codeOptimizationReviews in parity with refreshed launch evidence before post-summary redaction and launch-readiness alignment.';
const POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_DOES_NOT_PROVE = [
  'commercial-ready status',
  'owner-held live, payment, partner, outcome, or manual WCAG evidence',
  'that optional Browser/Computer, accessibility, network, audit, full-local, outreach, or owner-held evidence gates ran',
  'external customer demand, revenue, procurement approval, legal compliance, or production uptime',
];
const FULL_LOCAL_APPROVAL_PACKAGE_SOURCE_ARTIFACT =
  `${SUMMARY_JSON}#postSummaryFullLocalApprovalPackage`;
const FULL_LOCAL_APPROVAL_PACKAGE_COMMAND =
  'node scripts/verify-commercial-full-local-approval-package.mjs';
const FULL_LOCAL_APPROVAL_PACKAGE_EXECUTION_ORDER =
  'after post-summary redaction and launch-readiness alignment fixtures';
const FULL_LOCAL_APPROVAL_PACKAGE_CONDITION =
  'Runs only for the default commercial verifier invocation where optional accessibility, browser journey, network/audit, and live gates are not included. Full-local and other optional invocations are expected to update releaseGateCoverage instead of preserving the plan-only approval package state.';
const FULL_LOCAL_APPROVAL_PACKAGE_FIXTURE_COMMAND =
  'node scripts/verify-commercial-full-local-approval-package-fixtures.mjs';
const FULL_LOCAL_APPROVAL_PACKAGE_FIXTURE_EXECUTION_ORDER =
  'during the default commercial verifier before trust-boundary checks and before the post-summary static approval-package gate';
const FULL_LOCAL_APPROVAL_PACKAGE_FIXTURE_BOUNDARY =
  'This fixture verifier builds temporary approval-package artifacts, mutates those copies, and proves optional-gate overclaims, launch-decision upgrades, execution approval drift, missing review results, missing approval text, and missing package script wiring fail closed. It writes no repo artifacts.';
const FULL_LOCAL_APPROVAL_PACKAGE_BOUNDARY =
  'This release-level summary mirrors the plan-only full-local approval package. It does not execute accessibility, browser, network, audit, full-local, worker, live, payment, credential, outreach, or owner-held evidence gates.';
const FULL_LOCAL_APPROVAL_PACKAGE_DOES_NOT_PROVE = [
  'approval to execute optional full-local gates',
  'automated accessibility smoke, browser journey, network/source refresh, npm audit, or full-local verifier completion',
  'manual WCAG conformance, hosted uptime, live payment, live MRR, partner commitments, documented outcomes, owner-held evidence, or commercial-ready status',
];
const RELEASE_GATE_COVERAGE_BOUNDARY =
  'Release-gate coverage records only the steps included in this exact verifier invocation. Null means the gate was not included and needs separate current command output.';
const RELEASE_GATE_COVERAGE_SOURCE_ARTIFACT = `${SUMMARY_JSON}#releaseGateCoverage`;
const RELEASE_GATE_COVERAGE_STATE_BOUNDARY =
  'This state summary mirrors releaseGateCoverage for the exact verifier invocation only. Gates with passedInThisInvocation=null were not included and require separate current command output before they can be cited as proof.';
const RELEASE_GATE_COVERAGE_STATE_DOES_NOT_PROVE = [
  'that optional Browser/Computer, accessibility, network, audit, full-local, live, payment, credential, outreach, or owner-held evidence gates ran when includedInThisInvocation is false',
  'current command output for gates with passedInThisInvocation=null',
  'commercial-ready status, owner-held evidence, live checkout, live MRR, partner commitments, documented outcomes, manual WCAG conformance, legal compliance, or production uptime',
];
const RELEASE_GATE_COVERAGE_SOURCE_TRACE_BOUNDARY =
  'This release-gate source trace identifies repo-generated releaseGateCoverage anchors for each configured gate in the current verifier invocation. It does not execute optional Browser/Computer, accessibility, network, full-local, live, payment, credential, outreach, or owner-held evidence gates.';
const RELEASE_GATE_COVERAGE_EXPECTATIONS = {
  default_core: {
    command: 'npm run verify:commercial',
    option: null,
  },
  browser_journey: {
    command: 'npm run verify:commercial-browser',
    option: 'includeJourney',
  },
  accessibility_smoke: {
    command: 'npm run verify:commercial-a11y',
    option: 'includeA11y',
  },
  network_and_audit: {
    command: 'npm run verify:commercial-network',
    option: 'includeNetwork',
  },
  full_local_gate: {
    command: 'npm run verify:commercial-full',
    option: 'fullLocal',
  },
  typecheck: {
    command: 'npx tsc --noEmit',
    option: null,
    boundary: 'Included in the default commercial verifier as a repo-local TypeScript contract check.',
  },
  diff_check: {
    command: 'git diff --check',
    option: null,
    boundary:
      'Included in the default commercial verifier for tracked diff whitespace hygiene; the worktree-hygiene step separately checks untracked path policy.',
  },
};
const GATE_IDS = [
  'manual_wcag_evidence',
  'real_stripe_test_checkout',
  'live_mrr_gt_zero',
  'three_committed_partners',
  'documented_outcomes',
];
const SOURCE_URLS = [
  'https://docs.stripe.com/api/checkout/sessions',
  'https://www.w3.org/TR/WCAG22/',
];
const COMMERCIAL_EVIDENCE_INTAKE_SOURCE_URLS = [
  'https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers',
  'https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews',
  'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking',
  'https://www.ftc.gov/business-guidance/resources/soliciting-paying-online-reviews-guide-marketers',
];
const COMMERCIAL_EVIDENCE_INTAKE_SOURCE_IDS = [
  'ftc-consumer-reviews-rule-questions',
  'ftc-endorsements-reviews',
  'ftc-endorsement-guides-faq',
  'ftc-review-solicitation-guide',
];
const LIVE_PROOF_RUN_PACKET_SOURCE_IDS = [
  'stripe-test-mode',
  'stripe-api-keys',
  'stripe-key-best-practices',
  'supabase-edge-function-secrets',
  'github-actions-secrets',
];
const LIVE_PROOF_RUN_PACKET_SOURCE_URLS = [
  'https://docs.stripe.com/test-mode',
  'https://docs.stripe.com/keys',
  'https://docs.stripe.com/keys-best-practices',
  'https://supabase.com/docs/guides/functions/secrets',
  'https://docs.github.com/en/actions/concepts/security/secrets',
];
const LIVE_CLOSEOUT_ACCESS_SOURCE_IDS = [
  'supabase-access-control',
  'supabase-cli-login',
  'supabase-functions-list',
  'github-actions-secrets',
];
const LIVE_CLOSEOUT_ACCESS_SOURCE_URLS = [
  'https://supabase.com/docs/guides/platform/access-control',
  'https://supabase.com/docs/reference/cli/supabase-login',
  'https://supabase.com/docs/reference/cli/supabase-functions-list',
  'https://docs.github.com/en/actions/concepts/security/secrets',
];
const MANUAL_WCAG_REVIEW_PACKET_SOURCE_IDS = [
  'wcag22',
  'wcag-em-overview',
  'wcag-em-2',
  'wcag-em-report-tool',
  'wai-easy-checks',
  'wai-aria-apg',
];
const MANUAL_WCAG_REVIEW_PACKET_SOURCE_URLS = [
  'https://www.w3.org/TR/WCAG22/',
  'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/',
  'https://www.w3.org/TR/wcag-em-2/',
  'https://www.w3.org/WAI/eval/report-tool/',
  'https://www.w3.org/WAI/test-evaluate/preliminary/',
  'https://www.w3.org/WAI/ARIA/apg/',
];
const OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_KEYS = [
  'live_proof_run:stripe-test-mode',
  'live_proof_run:stripe-api-keys',
  'live_proof_run:stripe-key-best-practices',
  'live_proof_run:pci-dss-v4-0-1',
  'live_proof_run:supabase-edge-function-secrets',
  'live_proof_run:github-actions-secrets',
  'commercial_evidence_intake:ftc-consumer-reviews-rule-questions',
  'commercial_evidence_intake:ftc-endorsements-reviews',
  'commercial_evidence_intake:ftc-endorsement-guides-faq',
  'commercial_evidence_intake:ftc-review-solicitation-guide',
  'manual_wcag_review:wcag22',
  'manual_wcag_review:wcag-em-overview',
  'manual_wcag_review:wcag-em-2',
  'manual_wcag_review:wcag-em-report-tool',
  'manual_wcag_review:wai-easy-checks',
  'manual_wcag_review:wai-aria-apg',
];
const OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_URLS = [
  'https://docs.stripe.com/test-mode',
  'https://docs.stripe.com/keys',
  'https://docs.stripe.com/keys-best-practices',
  'https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1',
  'https://supabase.com/docs/guides/functions/secrets',
  'https://docs.github.com/en/actions/concepts/security/secrets',
  'https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers',
  'https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews',
  'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking',
  'https://www.ftc.gov/business-guidance/resources/soliciting-paying-online-reviews-guide-marketers',
  'https://www.w3.org/TR/WCAG22/',
  'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/',
  'https://www.w3.org/TR/wcag-em-2/',
  'https://www.w3.org/WAI/eval/report-tool/',
  'https://www.w3.org/WAI/test-evaluate/preliminary/',
  'https://www.w3.org/WAI/ARIA/apg/',
];

function writeJson(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function releaseGateIncludedForOption(option, invocationOptions) {
  if (option === null) return true;
  if (option === 'fullLocal') {
    return (
      invocationOptions.includeA11y === true &&
      invocationOptions.includeNetwork === true &&
      invocationOptions.includeJourney === true
    );
  }
  return invocationOptions[option] === true;
}

function defaultInvocationOptions() {
  return {
    includeNetwork: false,
    includeLive: false,
    includeA11y: false,
    includeJourney: false,
  };
}

function releaseGateCoverage(invocationOptions = defaultInvocationOptions()) {
  return {
    ...Object.fromEntries(
      Object.entries(RELEASE_GATE_COVERAGE_EXPECTATIONS).map(([gateId, expectation]) => {
        const includedInThisInvocation = releaseGateIncludedForOption(expectation.option, invocationOptions);
        return [
          gateId,
          {
            command: expectation.command,
            includedInThisInvocation,
            passedInThisInvocation: includedInThisInvocation ? true : null,
            ...(expectation.boundary ? { boundary: expectation.boundary } : {}),
          },
        ];
      }),
    ),
    boundary: RELEASE_GATE_COVERAGE_BOUNDARY,
  };
}

function releaseGateCoverageSummary(coverage = {}) {
  const gateEntries = Object.entries(coverage).filter(([gateId]) => gateId !== 'boundary');
  const includedGateIds = gateEntries
    .filter(([, gate]) => gate?.includedInThisInvocation === true)
    .map(([gateId]) => gateId);
  const notIncludedGateIds = gateEntries
    .filter(([, gate]) => gate?.includedInThisInvocation === false)
    .map(([gateId]) => gateId);
  const passedGateIds = gateEntries
    .filter(([, gate]) => gate?.passedInThisInvocation === true)
    .map(([gateId]) => gateId);
  const optionalGateIds = [
    'browser_journey',
    'accessibility_smoke',
    'network_and_audit',
    'full_local_gate',
  ];
  const sourceTrace = gateEntries.map(([gateId, gate]) => ({
    gateId,
    command: gate.command,
    includedInThisInvocation: gate.includedInThisInvocation,
    passedInThisInvocation: gate.passedInThisInvocation,
    optional: optionalGateIds.includes(gateId),
    separateProofRequired: gate.includedInThisInvocation === false,
    sourceArtifact: `${RELEASE_GATE_COVERAGE_SOURCE_ARTIFACT}.${gateId}`,
    boundary: gate.boundary || '',
  }));

  return {
    sourceArtifact: RELEASE_GATE_COVERAGE_SOURCE_ARTIFACT,
    sourceArtifactCount: 1 + sourceTrace.length,
    status:
      notIncludedGateIds.length > 0
        ? 'partial_invocation_optional_gates_not_included'
        : 'all_configured_release_gates_included',
    gateCount: gateEntries.length,
    includedGateCount: includedGateIds.length,
    notIncludedGateCount: notIncludedGateIds.length,
    passedGateCount: passedGateIds.length,
    includedGateIds,
    notIncludedGateIds,
    passedGateIds,
    requiredSeparateProofGateIds: notIncludedGateIds,
    optionalGateIds,
    optionalIncludedGateIds: includedGateIds.filter((gateId) => optionalGateIds.includes(gateId)),
    optionalNotIncludedGateIds: notIncludedGateIds.filter((gateId) =>
      optionalGateIds.includes(gateId),
    ),
    gates: Object.fromEntries(
      gateEntries.map(([gateId, gate]) => [
        gateId,
        {
          command: gate.command,
          includedInThisInvocation: gate.includedInThisInvocation,
          passedInThisInvocation: gate.passedInThisInvocation,
          ...(gate.boundary ? { boundary: gate.boundary } : {}),
        },
      ]),
    ),
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: RELEASE_GATE_COVERAGE_SOURCE_TRACE_BOUNDARY,
    boundary: RELEASE_GATE_COVERAGE_STATE_BOUNDARY,
    doesNotProveCount: RELEASE_GATE_COVERAGE_STATE_DOES_NOT_PROVE.length,
    doesNotProve: RELEASE_GATE_COVERAGE_STATE_DOES_NOT_PROVE,
  };
}

function markdownBool(value) {
  if (value === null || value === undefined) {
    return '`not included`';
  }

  return value ? '`yes`' : '`no`';
}

function sourceTraceValue(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${item}`)
      .join('; ');
  }

  return String(value ?? '');
}

function postSummaryCommandSourceTrace(sourceArtifact, entries) {
  return entries.map(({ key, value, boundary = '' }) => ({
    key,
    value: sourceTraceValue(value),
    sourceArtifact: `${sourceArtifact}.${key}`,
    boundary,
  }));
}

function sourceAuditSourceTrace(sources, sourceArtifact) {
  return (sources || []).map((source, index) => {
    const id = source.key || source.id || `source-${index + 1}`;
    const expectationRows = source.fetch?.evidence || [];
    return {
      id,
      url: source.url || '',
      status: source.status || null,
      attemptedFetch: source.fetch?.attempted ?? null,
      expectationCount: expectationRows.length,
      expectedTextMatchCount: expectationRows.filter((item) => item.matched === true).length,
      sourceArtifact: `${sourceArtifact}.${id}`,
    };
  });
}

function gate(gateId) {
  return {
    id: gateId,
    label: gateId.replaceAll('_', ' '),
  };
}

function launchEvidence(gateIds) {
  return {
    launch_decision: gateIds.length > 0 ? 'pilot-only' : 'sellable-with-caveats',
    scores: {
      security: gateIds.length > 0 ? 4 : 5,
      readiness: gateIds.length > 0 ? 3 : 4,
      sellability: 4,
      evidence: gateIds.length > 0 ? 3 : 4,
      overall: gateIds.length > 0 ? 3 : 4,
    },
    gaps: gateIds.map((gateId, index) => ({
      id: gateId,
      gate_id: gateId,
      severity: 'P1',
      status: ownerActionDetail(gateId, index).status,
    })),
    fix_report: {
      unresolved_blockers: [...gateIds],
      approval_gates: ['No production deploys without owner approval.'],
      checks_run: ['node scripts/verify-commercial-summary-launch-readiness-alignment.mjs'],
      owner_action_queue_count: gateIds.length,
      owner_prep_command_count: gateIds.length,
      owner_prep_action_needed_count: gateIds.length > 0 ? 1 : 0,
      source_audit: {
        status: 'passed',
        source_count: 2,
      },
      release_gate_commands: {
        default_core: 'npm run verify:commercial',
        typecheck: 'npx tsc --noEmit',
        boundary: 'fixture only',
      },
    },
    proof_buckets: {
      hosted_live: [
        {
          label: 'Fixture hosted-live candidate artifact',
          evidence: 'A redacted candidate live artifact exists in the fixture.',
          source: 'docs/commercialization/fixture-live-proof.json',
          status: 'candidate_live_artifact',
          boundary: 'Does not prove live checkout, live MRR, or production runtime behavior.',
        },
      ],
      local: [
        {
          label: 'Fixture commercial release verifier',
          evidence: 'The fixture commercial verifier passes locally.',
          source: 'npm run verify:commercial',
          status: 'present',
          boundary: '',
        },
      ],
      repo_artifact: [
        {
          label: 'Fixture launch evidence manifest',
          evidence: 'The fixture launch evidence manifest is present.',
          source: LAUNCH_EVIDENCE_JSON,
          status: 'present',
          boundary: 'Does not prove owner-held live, partner, outcome, or accessibility evidence.',
        },
      ],
      candidate_shadow: [
        {
          label: 'Fixture owner action queue',
          evidence: 'The fixture owner action queue remains visible and exportable.',
          source: 'src/components/proof/ProofVisibilityPanels.tsx',
          status: 'present',
          boundary: '',
        },
      ],
      roadmap: [
        {
          label: 'Fixture live MRR proof',
          evidence: 'Requires owner-held live revenue evidence.',
          source: 'npm run verify:stripe-live-mrr',
          status: 'present',
          boundary: 'Does not prove current live revenue.',
        },
      ],
    },
    pain_points: Array.from({ length: 10 }, (_, index) => ({
      rank: index + 1,
      pain_point: `Fixture pain point ${index + 1}`,
      source_evidence: [SOURCE_URLS[index % SOURCE_URLS.length]],
      confidence: 4,
    })),
    target_customers: Array.from({ length: 10 }, (_, index) => ({
      rank: index + 1,
      account_or_segment: `Fixture target segment ${index + 1}`,
      confidence: 4,
    })),
    competitor_substitutes: [
      { name: 'Fixture competitor 1', source_evidence: [SOURCE_URLS[0]] },
      { name: 'Fixture competitor 2', source_evidence: [SOURCE_URLS[1]] },
    ],
    outreach_plan: {
      thirty_sixty_ninety_plan: [{ window: '0-30 days' }, { window: '31-60 days' }, { window: '61-90 days' }],
      thirty_days: ['Review fixture artifact.'],
      sixty_days: ['Validate fixture evidence.'],
      ninety_days: ['Re-score fixture launch decision.'],
      email_script: 'Fixture email script',
      linkedin_script: 'Fixture LinkedIn script',
      demo_narrative: { opening: 'Fixture demo narrative' },
      objection_handling: ['Fixture objection response'],
      objection_handling_matrix: [{ objection: 'Fixture objection' }],
      crm_export: {
        row_count: 10,
        schema_fields: ['account_name', 'status'],
        allowed_statuses: ['researched', 'contacted'],
        artifact_json: 'docs/commercialization/launch-outreach-crm-latest.json',
        artifact_csv: 'docs/commercialization/launch-outreach-crm-latest.csv',
      },
    },
    progress_updates: [
      {
        phase: 'fixture-progress-phase',
        created_at: '2026-06-05T00:00:00.000Z',
        accomplished: ['summary fixture generated'],
        target_matrix: [
          {
            lane: 'Synthesis + Validation',
            target_percent: 5,
            current_percent: gateIds.length > 0 ? 45 : 100,
            status: gateIds.length > 0 ? 'running' : 'pass',
            evidence: [SUMMARY_JSON, LAUNCH_EVIDENCE_JSON],
            confidence: 4,
          },
        ],
        pending: gateIds,
        activities_remaining: {
          current_phase_actions: gateIds.length > 0 ? 5 : 0,
          next_phase_actions: gateIds.length > 0 ? 1 : 0,
          next_phase: gateIds.length > 0 ? 'owner-held evidence closeout' : 'launch decision handoff',
        },
        bottleneck:
          gateIds.length > 0
            ? 'Owner-held evidence gates remain open.'
            : 'No repo-generated owner/live gates remain open.',
      },
    ],
    bottleneck_log: [
      {
        phase: 'fixture-owner-evidence-closeout',
        task_or_subtask: gateIds.join(', ') || 'none',
        elapsed_minutes: 0,
        last_update: '2026-06-05T00:00:00.000Z',
        root_cause: gateIds.length > 0 ? 'evidence gap' : 'none',
        top_unblock_options:
          gateIds.length > 0
            ? ['Collect owner-held evidence.', 'Validate redacted metadata.', 'Re-run summary alignment.']
            : [],
      },
    ],
    required_output_table_counts: {
      scoreDimensionCount: 5,
      proofBucketTypeCount: 5,
      hostedLiveProofCount: 1,
      localProofCount: 1,
      repoArtifactProofCount: 1,
      candidateShadowProofCount: 1,
      roadmapProofCount: 1,
      gapCount: gateIds.length,
      painPointCount: 10,
      targetCustomerCount: 10,
      competitorSubstituteCount: 2,
      outreachMilestoneCount: 3,
      outreachThirtyDayActionCount: 1,
      outreachSixtyDayActionCount: 1,
      outreachNinetyDayActionCount: 1,
      objectionHandlingCount: 1,
      objectionHandlingMatrixCount: 1,
      crmSchemaFieldCount: 2,
      crmAllowedStatusCount: 2,
      crmRowCount: 10,
      fixReportCheckCount: 1,
      approvalGateCount: 1,
      unresolvedBlockerCount: gateIds.length,
      implementationDecisionCount: 1,
      rejectedVariantCount: 1,
      codeOptimizationReviewCount: 1,
      adversarialReviewCount: 0,
      progressUpdateCount: 1,
      bottleneckLogCount: 1,
    },
    implementation_decisions: [
      {
        decision: 'Fixture summary mirrors launch-evidence implementation decisions.',
        acceptance_check: 'The launch-readiness summary verifier must compare implementation decisions exactly.',
        chosen_variant: 'minimal summary parity field',
        files_changed: [SUMMARY_JSON, LAUNCH_EVIDENCE_JSON],
        tests_run: ['node scripts/verify-commercial-summary-launch-readiness-alignment.mjs'],
        proof: 'The fixture includes one implementation decision mirrored into commercialReadinessState.',
        reason: 'Launch summaries should expose code-changing decisions without overstating owner-held evidence.',
      },
    ],
    rejected_variants: [
      {
        variant: 'Hide code optimization decisions in launch evidence only.',
        reason_rejected: 'The commercial verification summary is the release-level reader handoff.',
        tradeoff: 'Mirroring adds summary length but improves auditability.',
        evidence: SUMMARY_JSON,
      },
    ],
    code_optimization_reviews: [
      {
        target_task: 'Fixture launch-readiness summary code optimization parity',
        policy: 'strict',
        verdict: 'pass',
        minimality_score: 4,
        evidence: 'The fixture report is mirrored without adding live checks.',
        tests_or_checks: ['node scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs'],
      },
    ],
  };
}

function launchEvidenceSummary(gateIds) {
  const value = launchEvidence(gateIds);
  const outreachPlan = value.outreach_plan;
  const crmExport = outreachPlan.crm_export;
  const fixReport = value.fix_report;
  const summary = {
    sourceArtifact: LAUNCH_EVIDENCE_JSON,
    sourceArtifacts: {
      launchEvidence: LAUNCH_EVIDENCE_JSON,
      scores: `${LAUNCH_EVIDENCE_JSON}#scores`,
      outreachPlan: `${LAUNCH_EVIDENCE_JSON}#outreach_plan`,
      crmExport: `${LAUNCH_EVIDENCE_JSON}#outreach_plan.crm_export`,
      crmJson: crmExport.artifact_json,
      crmCsv: crmExport.artifact_csv,
      fixReport: `${LAUNCH_EVIDENCE_JSON}#fix_report`,
      sourceAudit: LAUNCH_SOURCE_AUDIT_SOURCE_ARTIFACT,
      requiredOutputTableCounts: `${LAUNCH_EVIDENCE_JSON}#required_output_table_counts`,
    },
    scores: value.scores,
    deliverableCounts: {
      gapCount: value.gaps.length,
      painPointCount: value.pain_points.length,
      targetCustomerCount: value.target_customers.length,
      competitorSubstituteCount: value.competitor_substitutes.length,
      implementationDecisionCount: value.implementation_decisions.length,
      rejectedVariantCount: value.rejected_variants.length,
      codeOptimizationReviewCount: value.code_optimization_reviews.length,
      progressUpdateCount: value.progress_updates.length,
      bottleneckLogCount: value.bottleneck_log.length,
    },
    requiredOutputTableCounts: value.required_output_table_counts,
    outreachCoverage: {
      planWindowCount: outreachPlan.thirty_sixty_ninety_plan.length,
      thirtyDayActionCount: outreachPlan.thirty_days.length,
      sixtyDayActionCount: outreachPlan.sixty_days.length,
      ninetyDayActionCount: outreachPlan.ninety_days.length,
      objectionHandlingCount: outreachPlan.objection_handling.length,
      objectionHandlingMatrixCount: outreachPlan.objection_handling_matrix.length,
      hasEmailScript: true,
      hasLinkedInScript: true,
      hasDemoNarrative: true,
      crmExport: {
        rowCount: crmExport.row_count,
        schemaFieldCount: crmExport.schema_fields.length,
        allowedStatusCount: crmExport.allowed_statuses.length,
        artifactJson: crmExport.artifact_json,
        artifactCsv: crmExport.artifact_csv,
      },
    },
    fixReportCoverage: {
      ownerActionQueueCount: fixReport.owner_action_queue_count,
      ownerPrepCommandCount: fixReport.owner_prep_command_count,
      ownerPrepActionNeededCount: fixReport.owner_prep_action_needed_count,
      unresolvedBlockerCount: fixReport.unresolved_blockers.length,
      unresolvedBlockers: fixReport.unresolved_blockers,
      approvalGateCount: fixReport.approval_gates.length,
      checksRunCount: fixReport.checks_run.length,
      sourceAuditStatus: fixReport.source_audit.status,
      sourceAuditSourceCount: fixReport.source_audit.source_count,
      releaseGateCommandIds: ['default_core', 'typecheck'],
    },
    evidenceBoundary: LAUNCH_EVIDENCE_SUMMARY_EVIDENCE_BOUNDARY,
  };
  summary.sourceArtifactCount = Object.values(summary.sourceArtifacts).filter(Boolean).length;
  summary.sourceTrace = [
    {
      coverage: 'scores',
      metricCount: Object.keys(summary.scores).length,
      sourceArtifact: `${LAUNCH_EVIDENCE_JSON}#scores`,
      sourceArtifacts: {
        scores: `${LAUNCH_EVIDENCE_JSON}#scores`,
      },
      sourceArtifactCount: 1,
    },
    {
      coverage: 'deliverableCounts',
      metricCount: Object.keys(summary.deliverableCounts).length,
      sourceArtifact: `${LAUNCH_EVIDENCE_JSON}#gaps`,
      sourceArtifacts: {
        gaps: `${LAUNCH_EVIDENCE_JSON}#gaps`,
        painPoints: `${LAUNCH_EVIDENCE_JSON}#pain_points`,
        targetCustomers: `${LAUNCH_EVIDENCE_JSON}#target_customers`,
        competitorSubstitutes: `${LAUNCH_EVIDENCE_JSON}#competitor_substitutes`,
        implementationDecisions: `${LAUNCH_EVIDENCE_JSON}#implementation_decisions`,
        rejectedVariants: `${LAUNCH_EVIDENCE_JSON}#rejected_variants`,
        codeOptimizationReviews: `${LAUNCH_EVIDENCE_JSON}#code_optimization_reviews`,
        progressUpdates: `${LAUNCH_EVIDENCE_JSON}#progress_updates`,
        bottleneckLog: `${LAUNCH_EVIDENCE_JSON}#bottleneck_log`,
      },
      sourceArtifactCount: 9,
    },
    {
      coverage: 'requiredOutputTableCounts',
      metricCount: Object.keys(summary.requiredOutputTableCounts).length,
      sourceArtifact: `${LAUNCH_EVIDENCE_JSON}#required_output_table_counts`,
      sourceArtifacts: {
        requiredOutputTableCounts: `${LAUNCH_EVIDENCE_JSON}#required_output_table_counts`,
      },
      sourceArtifactCount: 1,
    },
    {
      coverage: 'outreachCoverage',
      metricCount: Object.keys(summary.outreachCoverage).length,
      sourceArtifact: `${LAUNCH_EVIDENCE_JSON}#outreach_plan`,
      sourceArtifacts: {
        outreachPlan: `${LAUNCH_EVIDENCE_JSON}#outreach_plan`,
        crmExport: `${LAUNCH_EVIDENCE_JSON}#outreach_plan.crm_export`,
        crmJson: summary.outreachCoverage.crmExport.artifactJson,
        crmCsv: summary.outreachCoverage.crmExport.artifactCsv,
      },
      sourceArtifactCount: 4,
    },
    {
      coverage: 'fixReportCoverage',
      metricCount: Object.keys(summary.fixReportCoverage).length,
      sourceArtifact: `${LAUNCH_EVIDENCE_JSON}#fix_report`,
      sourceArtifacts: {
        fixReport: `${LAUNCH_EVIDENCE_JSON}#fix_report`,
        unresolvedBlockers: `${LAUNCH_EVIDENCE_JSON}#fix_report.unresolved_blockers`,
        sourceAudit: LAUNCH_SOURCE_AUDIT_SOURCE_ARTIFACT,
        releaseGateCommands: `${LAUNCH_EVIDENCE_JSON}#fix_report.release_gate_commands`,
      },
      sourceArtifactCount: 4,
    },
  ];
  summary.sourceTraceCount = summary.sourceTrace.length;
  summary.sourceTraceBoundary = LAUNCH_EVIDENCE_SUMMARY_SOURCE_TRACE_BOUNDARY;
  return summary;
}

function launchSourceAudit() {
  return {
    schemaVersion: '2026-06-05.apo-launch-evidence-source-audit.v1',
    generatedAt: '2026-06-05T00:00:00.000Z',
    launchEvidencePath: LAUNCH_EVIDENCE_JSON,
    networkFetch: true,
    sourceBoundary:
      'Source URL audit proves source-page reachability and expected page text only. It does not prove buyer willingness to pay, customer outcomes, legal compliance, WCAG conformance, live revenue, partner commitments, or production runtime behavior.',
    allPassed: true,
    sourceCount: SOURCE_URLS.length,
    passedCount: SOURCE_URLS.length,
    failedCount: 0,
    missingExpectationCount: 0,
    failedSourceUrls: [],
    sources: SOURCE_URLS.map((url, index) => ({
      url,
      status: 'passed',
      usage: {
        usageContexts: [`pain_point:${index + 1}`, `competitor_substitute:${index + 1}`],
      },
      fetch: {
        attempted: true,
        evidence: [
          { label: `Fixture expectation ${index + 1}a`, matched: true },
          { label: `Fixture expectation ${index + 1}b`, matched: true },
        ],
      },
    })),
  };
}

function launchSourceAuditCoverage() {
  const audit = launchSourceAudit();
  const sourceTrace = sourceAuditSourceTrace(audit.sources, LAUNCH_SOURCE_AUDIT_SOURCE_ARTIFACT);
  return {
    artifact: LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON,
    generatedAt: audit.generatedAt,
    networkFetch: audit.networkFetch,
    allPassed: audit.allPassed,
    sourceCount: audit.sourceCount,
    passedCount: audit.passedCount,
    failedCount: audit.failedCount,
    missingExpectationCount: audit.missingExpectationCount,
    failedSourceUrls: audit.failedSourceUrls,
    sourceUrls: audit.sources.map((source) => source.url),
    usageContextCount: audit.sources.reduce((total, source) => total + source.usage.usageContexts.length, 0),
    expectationCheckCount: audit.sources.reduce((total, source) => total + source.fetch.evidence.length, 0),
    expectedTextMatchCount: audit.sources.reduce(
      (total, source) => total + source.fetch.evidence.filter((item) => item.matched).length,
      0,
    ),
    fetchedSourceCount: audit.sources.filter((source) => source.fetch.attempted).length,
    sourceTraceSourceArtifact: LAUNCH_SOURCE_AUDIT_SOURCE_ARTIFACT,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_AUDIT_SOURCE_TRACE_BOUNDARY,
    boundary: audit.sourceBoundary,
  };
}

function commercialEvidenceIntakeSourceAudit() {
  return {
    schemaVersion: '2026-06-05.apo-commercial-evidence-intake-source-audit.v1',
    generatedAt: '2026-06-05T00:00:00.000Z',
    packetPath: 'docs/commercialization/commercial-evidence-intake-packet-latest.json',
    networkFetch: true,
    sourceBoundary:
      'Commercial evidence intake source audit proves only official reference URL presence and expected page text at verification time. It does not prove partner commitments, documented outcomes, testimonial compliance, legal compliance, revenue, retention, causality, market-wide demand, or permission to cite.',
    allPassed: true,
    sourceCount: COMMERCIAL_EVIDENCE_INTAKE_SOURCE_URLS.length,
    passedCount: COMMERCIAL_EVIDENCE_INTAKE_SOURCE_URLS.length,
    failedCount: 0,
    missingExpectationCount: 0,
    unexpectedReferenceCount: 0,
    failedSourceIds: [],
    unexpectedReferences: [],
    sources: COMMERCIAL_EVIDENCE_INTAKE_SOURCE_URLS.map((url, index) => ({
      id: COMMERCIAL_EVIDENCE_INTAKE_SOURCE_IDS[index],
      label: `FTC fixture source ${index + 1}`,
      url,
      status: 'passed',
      appliesTo: [`fixture-boundary-${index + 1}a`, `fixture-boundary-${index + 1}b`],
      fetch: {
        attempted: true,
        evidence: [
          { label: `FTC fixture expectation ${index + 1}a`, matched: true },
          { label: `FTC fixture expectation ${index + 1}b`, matched: true },
        ],
      },
    })),
  };
}

function commercialEvidenceIntakeSourceAuditCoverage() {
  const audit = commercialEvidenceIntakeSourceAudit();
  const sourceTrace = sourceAuditSourceTrace(
    audit.sources,
    COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_SOURCE_ARTIFACT,
  );
  return {
    artifact: COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON,
    packetPath: audit.packetPath,
    generatedAt: audit.generatedAt,
    networkFetch: audit.networkFetch,
    allPassed: audit.allPassed,
    sourceCount: audit.sourceCount,
    passedCount: audit.passedCount,
    failedCount: audit.failedCount,
    missingExpectationCount: audit.missingExpectationCount,
    unexpectedReferenceCount: audit.unexpectedReferenceCount,
    failedSourceIds: audit.failedSourceIds,
    unexpectedReferences: audit.unexpectedReferences,
    sourceIds: audit.sources.map((source) => source.id),
    sourceUrls: audit.sources.map((source) => source.url),
    appliesToCount: audit.sources.reduce((total, source) => total + source.appliesTo.length, 0),
    expectationCheckCount: audit.sources.reduce((total, source) => total + source.fetch.evidence.length, 0),
    expectedTextMatchCount: audit.sources.reduce(
      (total, source) => total + source.fetch.evidence.filter((item) => item.matched).length,
      0,
    ),
    fetchedSourceCount: audit.sources.filter((source) => source.fetch.attempted).length,
    sourceTraceSourceArtifact: COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_SOURCE_ARTIFACT,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_AUDIT_SOURCE_TRACE_BOUNDARY,
    boundary: audit.sourceBoundary,
  };
}

function liveProofRunPacketSourceAudit() {
  return {
    schemaVersion: '2026-06-05.apo-live-proof-run-packet-source-audit.v1',
    generatedAt: '2026-06-05T00:00:00.000Z',
    packetPath: LIVE_PROOF_RUN_PACKET_JSON,
    networkFetch: true,
    sourceBoundary:
      'Live proof run packet source audit proves only that the owner live-proof worksheet official Stripe, Supabase, and GitHub reference URLs were present and matched expected page text at verification time. It does not prove live checkout, live MRR, production calibration, authenticated live artifact persistence, credential validity, owner-held evidence completeness, production deployment, or commercial readiness.',
    allPassed: true,
    sourceCount: LIVE_PROOF_RUN_PACKET_SOURCE_URLS.length,
    passedCount: LIVE_PROOF_RUN_PACKET_SOURCE_URLS.length,
    failedCount: 0,
    missingExpectationCount: 0,
    unexpectedReferenceCount: 0,
    failedSourceIds: [],
    unexpectedReferences: [],
    sources: LIVE_PROOF_RUN_PACKET_SOURCE_URLS.map((url, index) => ({
      id: LIVE_PROOF_RUN_PACKET_SOURCE_IDS[index],
      label: `Live proof fixture source ${index + 1}`,
      url,
      status: 'passed',
      appliesTo:
        index === 0
          ? ['real_stripe_test_checkout']
          : ['real_stripe_test_checkout', 'live_mrr_gt_zero'],
      fetch: {
        attempted: true,
        evidence: [
          { label: `Live proof fixture expectation ${index + 1}a`, matched: true },
          { label: `Live proof fixture expectation ${index + 1}b`, matched: true },
        ],
      },
    })),
  };
}

function liveProofRunPacket() {
  return {
    schemaVersion: '2026-06-05.apo-live-proof-run-packet.v1',
    status: 'owner_live_proof_required',
    requiredOfficialReferenceCount: LIVE_PROOF_RUN_PACKET_SOURCE_URLS.length,
    officialReferences: LIVE_PROOF_RUN_PACKET_SOURCE_URLS.map((url, index) => ({
      id: LIVE_PROOF_RUN_PACKET_SOURCE_IDS[index],
      label: `Live proof fixture source ${index + 1}`,
      url,
      appliesTo:
        index === 0
          ? ['real_stripe_test_checkout']
          : ['real_stripe_test_checkout', 'live_mrr_gt_zero'],
    })),
  };
}

function liveProofRunPacketSourceAuditCoverage() {
  const audit = liveProofRunPacketSourceAudit();
  const sourceTrace = sourceAuditSourceTrace(audit.sources, LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_SOURCE_ARTIFACT);
  return {
    artifact: LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON,
    packetPath: audit.packetPath,
    generatedAt: audit.generatedAt,
    networkFetch: audit.networkFetch,
    allPassed: audit.allPassed,
    sourceCount: audit.sourceCount,
    passedCount: audit.passedCount,
    failedCount: audit.failedCount,
    missingExpectationCount: audit.missingExpectationCount,
    unexpectedReferenceCount: audit.unexpectedReferenceCount,
    failedSourceIds: audit.failedSourceIds,
    unexpectedReferences: audit.unexpectedReferences,
    sourceIds: audit.sources.map((source) => source.id),
    sourceUrls: audit.sources.map((source) => source.url),
    appliesToCount: audit.sources.reduce((total, source) => total + source.appliesTo.length, 0),
    expectationCheckCount: audit.sources.reduce((total, source) => total + source.fetch.evidence.length, 0),
    expectedTextMatchCount: audit.sources.reduce(
      (total, source) => total + source.fetch.evidence.filter((item) => item.matched).length,
      0,
    ),
    fetchedSourceCount: audit.sources.filter((source) => source.fetch.attempted).length,
    sourceTraceSourceArtifact: LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_SOURCE_ARTIFACT,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_AUDIT_SOURCE_TRACE_BOUNDARY,
    boundary: audit.sourceBoundary,
  };
}

function liveCloseoutAccessSourceAudit() {
  return {
    schemaVersion: '2026-06-05.apo-live-closeout-access-source-audit.v1',
    generatedAt: '2026-06-05T00:00:00.000Z',
    readinessPath: LIVE_CLOSEOUT_READINESS_JSON,
    networkFetch: true,
    sourceBoundary:
      'Live closeout access source audit proves only that the live closeout readiness artifact contains reviewed Supabase and GitHub official reference URLs and, when network fetch is enabled, that those pages matched expected access/secret-management text at verification time. It does not prove Supabase account access, functions API access, secret value validity, deployment completion, O*NET ingest completion, parse-resume deployment completion, live closeout, or commercial readiness.',
    allPassed: true,
    sourceCount: LIVE_CLOSEOUT_ACCESS_SOURCE_URLS.length,
    passedCount: LIVE_CLOSEOUT_ACCESS_SOURCE_URLS.length,
    failedCount: 0,
    missingExpectationCount: 0,
    unexpectedReferenceCount: 0,
    failedSourceIds: [],
    unexpectedReferences: [],
    sources: LIVE_CLOSEOUT_ACCESS_SOURCE_URLS.map((url, index) => ({
      id: LIVE_CLOSEOUT_ACCESS_SOURCE_IDS[index],
      label: `Live closeout access fixture source ${index + 1}`,
      url,
      status: 'passed',
      appliesTo:
        index === 3
          ? ['github-secrets-visible', 'github-live-closeout-secrets-present']
          : ['supabase-target-project-visible', 'supabase-functions-api-accessible'],
      fetch: {
        attempted: true,
        evidence: [
          { label: `Live closeout access fixture expectation ${index + 1}a`, matched: true },
          { label: `Live closeout access fixture expectation ${index + 1}b`, matched: true },
        ],
      },
    })),
  };
}

function liveCloseoutReadiness() {
  const checks = [
    {
      id: 'github-secrets-visible',
      passed: true,
      message: 'Fixture GitHub secret names are readable.',
    },
    {
      id: 'github-live-closeout-secrets-present',
      passed: true,
      message: 'Fixture required GitHub secret names are present.',
    },
    {
      id: 'supabase-target-project-visible',
      passed: false,
      message: 'Fixture target Supabase project is not visible.',
    },
    {
      id: 'supabase-functions-api-accessible',
      passed: false,
      message: 'Fixture Supabase functions API is not accessible.',
    },
  ];
  return {
    schemaVersion: '2026-06-05.apo-live-closeout-readiness.v1',
    generatedAt: '2026-06-05T00:00:00.000Z',
    status: 'owner_access_required',
    ok: false,
    allowIncomplete: true,
    targetProjectRef: 'kvunnankqgfokeufvsrv',
    commandContext: {
      command: 'node scripts/verify-live-closeout-readiness.mjs --write --allow-incomplete',
      mutatesExternalState: false,
      printsSecretValues: false,
    },
    githubSecrets: {
      available: true,
      requiredSecretNames: [
        'SUPABASE_ACCESS_TOKEN',
        'SUPABASE_PROJECT_REF',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'LIVE_SUPABASE_TEST_USER_EMAIL',
        'LIVE_SUPABASE_TEST_USER_PASSWORD',
      ],
      presentRequiredSecretNames: [
        'SUPABASE_ACCESS_TOKEN',
        'SUPABASE_PROJECT_REF',
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'LIVE_SUPABASE_TEST_USER_EMAIL',
        'LIVE_SUPABASE_TEST_USER_PASSWORD',
      ],
      missingRequiredSecretNames: [],
      valuesRedacted: true,
      allRepositorySecretNamesPersisted: false,
    },
    supabaseAccess: {
      projectsListAvailable: true,
      targetProjectVisible: false,
      visibleProjectRefCount: 1,
      visibleProjectRefsPersisted: false,
      functionsApiAccessible: false,
    },
    checkCount: checks.length,
    passedCheckCount: checks.filter((check) => check.passed).length,
    failedCheckCount: checks.filter((check) => !check.passed).length,
    failedCheckIds: ['supabase-target-project-visible', 'supabase-functions-api-accessible'],
    checks,
    officialReferences: LIVE_CLOSEOUT_ACCESS_SOURCE_URLS.map((url, index) => ({
      id: LIVE_CLOSEOUT_ACCESS_SOURCE_IDS[index],
      label: `Live closeout access fixture source ${index + 1}`,
      url,
      appliesTo:
        index === 3
          ? ['github-secrets-visible', 'github-live-closeout-secrets-present']
          : ['supabase-target-project-visible', 'supabase-functions-api-accessible'],
    })),
    officialReferenceCount: LIVE_CLOSEOUT_ACCESS_SOURCE_URLS.length,
    nextActions: [
      'Use a Supabase account that can manage the target project before claiming live closeout readiness.',
      'Keep the strict verifier as the acceptance proof; use --allow-incomplete only for redacted status artifacts.',
    ],
    nextActionCount: 2,
    evidenceBoundary:
      'Fixture live closeout readiness artifact preserves official references while owner access remains blocked.',
    doesNotProve: ['commercial-ready status', 'live deployment completion'],
    doesNotProveCount: 2,
  };
}

function liveCloseoutAccessSourceAuditCoverage() {
  const audit = liveCloseoutAccessSourceAudit();
  const sourceTrace = sourceAuditSourceTrace(audit.sources, LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_SOURCE_ARTIFACT);
  return {
    artifact: LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON,
    readinessPath: audit.readinessPath,
    generatedAt: audit.generatedAt,
    networkFetch: audit.networkFetch,
    allPassed: audit.allPassed,
    sourceCount: audit.sourceCount,
    passedCount: audit.passedCount,
    failedCount: audit.failedCount,
    missingExpectationCount: audit.missingExpectationCount,
    unexpectedReferenceCount: audit.unexpectedReferenceCount,
    failedSourceIds: audit.failedSourceIds,
    unexpectedReferences: audit.unexpectedReferences,
    sourceIds: audit.sources.map((source) => source.id),
    sourceUrls: audit.sources.map((source) => source.url),
    appliesToCount: audit.sources.reduce((total, source) => total + source.appliesTo.length, 0),
    expectationCheckCount: audit.sources.reduce((total, source) => total + source.fetch.evidence.length, 0),
    expectedTextMatchCount: audit.sources.reduce(
      (total, source) => total + source.fetch.evidence.filter((item) => item.matched).length,
      0,
    ),
    fetchedSourceCount: audit.sources.filter((source) => source.fetch.attempted).length,
    sourceTraceSourceArtifact: LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_SOURCE_ARTIFACT,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_AUDIT_SOURCE_TRACE_BOUNDARY,
    boundary: audit.sourceBoundary,
  };
}

function liveCloseoutReadinessCheckSourceTrace(checks) {
  return (checks || []).map((check, index) => {
    const id = check.id || `check-${index + 1}`;
    return {
      id,
      passed: check.passed === true,
      message: check.message || '',
      sourceArtifact: `${LIVE_CLOSEOUT_READINESS_CHECKS_SOURCE_ARTIFACT}.${id}`,
    };
  });
}

function liveCloseoutReadinessNextActionSourceTrace(nextActions) {
  return (nextActions || []).map((action, index) => ({
    order: index + 1,
    action,
    sourceArtifact: `${LIVE_CLOSEOUT_READINESS_NEXT_ACTIONS_SOURCE_ARTIFACT}.${index + 1}`,
  }));
}

function liveCloseoutReadinessOfficialReferenceSourceTrace(references) {
  return (references || []).map((reference, index) => {
    const id = reference.id || `reference-${index + 1}`;
    return {
      id,
      label: reference.label || '',
      url: reference.url || '',
      appliesTo: reference.appliesTo || [],
      sourceArtifact: `${LIVE_CLOSEOUT_READINESS_OFFICIAL_REFERENCES_SOURCE_ARTIFACT}.${id}`,
    };
  });
}

function liveCloseoutReadinessSourceTrace(
  checkSourceTrace,
  nextActionSourceTrace,
  officialReferenceSourceTrace,
) {
  return [
    ...checkSourceTrace.map((trace) => ({ traceType: 'check', ...trace })),
    ...nextActionSourceTrace.map((trace) => ({ traceType: 'next_action', ...trace })),
    ...officialReferenceSourceTrace.map((trace) => ({
      traceType: 'official_reference',
      ...trace,
    })),
  ];
}

function liveCloseoutReadinessCoverage() {
  const readiness = liveCloseoutReadiness();
  const checkSourceTrace = liveCloseoutReadinessCheckSourceTrace(readiness.checks);
  const failedCheckSourceTrace = checkSourceTrace.filter((check) => check.passed !== true);
  const nextActionSourceTrace = liveCloseoutReadinessNextActionSourceTrace(readiness.nextActions);
  const officialReferenceSourceTrace = liveCloseoutReadinessOfficialReferenceSourceTrace(
    readiness.officialReferences,
  );
  const sourceTrace = liveCloseoutReadinessSourceTrace(
    checkSourceTrace,
    nextActionSourceTrace,
    officialReferenceSourceTrace,
  );
  return {
    artifact: LIVE_CLOSEOUT_READINESS_JSON,
    generatedAt: readiness.generatedAt,
    status: readiness.status,
    ok: readiness.ok,
    allowIncomplete: readiness.allowIncomplete,
    targetProjectRef: readiness.targetProjectRef,
    command: readiness.commandContext.command,
    mutatesExternalState: readiness.commandContext.mutatesExternalState,
    printsSecretValues: readiness.commandContext.printsSecretValues,
    checkCount: readiness.checkCount,
    passedCheckCount: readiness.passedCheckCount,
    failedCheckCount: readiness.failedCheckCount,
    failedCheckIds: readiness.failedCheckIds,
    checkResults: readiness.checks.map((check) => ({
      id: check.id,
      passed: check.passed,
      message: check.message,
    })),
    checkSourceArtifact: LIVE_CLOSEOUT_READINESS_CHECKS_SOURCE_ARTIFACT,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    checkSourceTraceCount: checkSourceTrace.length,
    failedCheckSourceTraceCount: failedCheckSourceTrace.length,
    checkSourceTrace,
    githubSecrets: {
      available: readiness.githubSecrets.available,
      requiredSecretNameCount: readiness.githubSecrets.requiredSecretNames.length,
      presentRequiredSecretNameCount: readiness.githubSecrets.presentRequiredSecretNames.length,
      missingRequiredSecretNameCount: readiness.githubSecrets.missingRequiredSecretNames.length,
      missingRequiredSecretNames: readiness.githubSecrets.missingRequiredSecretNames,
      valuesRedacted: readiness.githubSecrets.valuesRedacted,
      allRepositorySecretNamesPersisted: readiness.githubSecrets.allRepositorySecretNamesPersisted,
    },
    supabaseAccess: {
      projectsListAvailable: readiness.supabaseAccess.projectsListAvailable,
      targetProjectVisible: readiness.supabaseAccess.targetProjectVisible,
      visibleProjectRefCount: readiness.supabaseAccess.visibleProjectRefCount,
      visibleProjectRefsPersisted: readiness.supabaseAccess.visibleProjectRefsPersisted,
      functionsApiAccessible: readiness.supabaseAccess.functionsApiAccessible,
    },
    officialReferenceCount: readiness.officialReferenceCount,
    officialReferenceSourceArtifact: LIVE_CLOSEOUT_READINESS_OFFICIAL_REFERENCES_SOURCE_ARTIFACT,
    officialReferenceSourceTraceCount: officialReferenceSourceTrace.length,
    officialReferenceSourceTrace,
    nextActionCount: readiness.nextActionCount,
    nextActions: readiness.nextActions,
    nextActionSourceArtifact: LIVE_CLOSEOUT_READINESS_NEXT_ACTIONS_SOURCE_ARTIFACT,
    nextActionSourceTraceCount: nextActionSourceTrace.length,
    nextActionSourceTrace,
    sourceTraceBoundary: LIVE_CLOSEOUT_READINESS_SOURCE_TRACE_BOUNDARY,
    boundary: readiness.evidenceBoundary,
    doesNotProve: readiness.doesNotProve,
    doesNotProveCount: readiness.doesNotProveCount,
  };
}

function operationalAccessPrerequisites() {
  return [
    {
      id: 'live_closeout_supabase_access',
      label: 'Live closeout Supabase project/functions access',
      track: 'live-runtime',
      status: 'owner_access_required',
      sourceArtifact: LIVE_CLOSEOUT_READINESS_JSON,
      ownerAction:
        'Use a Supabase account that can manage the target project and access the functions API, then rerun the strict live closeout readiness verifier before claiming O*NET ingest or parse-resume deployment completion.',
      ownerPrepCommand: 'npm run generate:live-closeout-readiness',
      nextCommand: 'npm run verify:live-closeout-readiness',
      blockingCheckIds: ['supabase-target-project-visible', 'supabase-functions-api-accessible'],
      acceptedWhen:
        'The strict live closeout readiness verifier exits 0 without --allow-incomplete, after the target Supabase project and functions API are visible to the current owner-approved account.',
      evidenceBoundary:
        'This verifier checks only whether the current local CLI context can see required GitHub secret names and the target Supabase project/functions surface for live closeout. It records secret names only, never secret values, and does not deploy, mutate, ingest, rotate, or prove production behavior.',
      doesNotProve: [
        'live deployment completion',
        'O*NET ingest completion',
        'parse-resume deployment completion',
        'commercial-ready status',
        'live checkout, live MRR, partner commitments, documented outcomes, manual WCAG conformance, legal compliance, or production uptime',
        'validity, freshness, or correctness of any secret value',
      ],
      rawEvidencePolicy:
        'Keep Supabase access tokens, service-role data, project-management credentials, logs with user identifiers, and deployment approvals outside git; commit only redacted status artifacts and command evidence.',
      repoDoesNotDo:
        'The repo cannot grant Supabase project access, run production deployment closeout, ingest live O*NET data, or prove parser deployment without owner-approved access and execution.',
    },
  ];
}

function operationalAccessPrerequisiteSummary() {
  const prerequisites = operationalAccessPrerequisites();
  const sourceTrace = operationalAccessPrerequisiteSourceTrace(prerequisites);
  const uniqueBlockingCheckIds = [
    ...new Set(prerequisites.flatMap((prerequisite) => prerequisite.blockingCheckIds)),
  ].sort((a, b) => a.localeCompare(b));
  return {
    sourceArtifact: OWNER_OPERATIONAL_ACCESS_PREREQUISITE_SOURCE_ARTIFACT,
    sourceArtifacts: {
      handoff: OWNER_OPERATIONAL_ACCESS_PREREQUISITE_SOURCE_ARTIFACT,
      completionDrill: OWNER_OPERATIONAL_ACCESS_COMPLETION_DRILL_SOURCE_ARTIFACT,
      liveCloseoutReadiness: OWNER_OPERATIONAL_ACCESS_LIVE_CLOSEOUT_SOURCE_ARTIFACT,
    },
    sourceArtifactCount: 3,
    sourceTraceCount: sourceTrace.length,
    sourceTraceBlockingCheckCount: sourceTrace.reduce(
      (total, row) => total + row.sourceArtifacts.blockingChecks.length,
      0,
    ),
    sourceTrace,
    sourceTraceBoundary: OWNER_OPERATIONAL_ACCESS_SOURCE_TRACE_BOUNDARY,
    boundary: OWNER_OPERATIONAL_ACCESS_PREREQUISITE_BOUNDARY,
    prerequisiteCount: prerequisites.length,
    handoffPrerequisiteCount: prerequisites.length,
    completionDrillPrerequisiteCount: prerequisites.length,
    prerequisiteIds: prerequisites.map((prerequisite) => prerequisite.id),
    statusesById: Object.fromEntries(
      prerequisites.map((prerequisite) => [prerequisite.id, prerequisite.status]),
    ),
    blockingCheckCount: uniqueBlockingCheckIds.length,
    uniqueBlockingCheckIds,
    prerequisites,
  };
}

function operationalAccessPrerequisiteSourceTrace(prerequisites) {
  return prerequisites.map((prerequisite) => {
    const blockingChecks = prerequisite.blockingCheckIds.map(
      (checkId) => `${OWNER_OPERATIONAL_ACCESS_LIVE_CLOSEOUT_SOURCE_ARTIFACT}.${checkId}`,
    );
    const sourceArtifacts = {
      handoff: `${OWNER_OPERATIONAL_ACCESS_PREREQUISITE_SOURCE_ARTIFACT}.${prerequisite.id}`,
      completionDrill: `${OWNER_OPERATIONAL_ACCESS_COMPLETION_DRILL_SOURCE_ARTIFACT}.${prerequisite.id}`,
      liveCloseoutReadiness: OWNER_OPERATIONAL_ACCESS_LIVE_CLOSEOUT_SOURCE_ARTIFACT,
      blockingChecks,
    };

    return {
      id: prerequisite.id,
      status: prerequisite.status,
      sourceArtifact: sourceArtifacts.handoff,
      sourceArtifacts,
      sourceArtifactCount: 3 + blockingChecks.length,
    };
  });
}

function ownerGateScoreboardSourceTrace(gateIds) {
  return gateIds.map((gateId, index) => {
    const detail = ownerActionDetail(gateId, index);
    const sourceArtifacts = {
      scoreboard: `${OWNER_GATE_SCOREBOARD_SOURCE_ARTIFACT}.remainingGateIds.${gateId}`,
      remediationCompletion: `${OWNER_GATE_SCOREBOARD_REMEDIATION_COMPLETION_SOURCE_ARTIFACT}.${gateId}`,
      remediationExternalGates: `${OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT}.${gateId}`,
      closeoutStatus: `${OWNER_ACTION_QUEUE_CLOSEOUT_SOURCE_ARTIFACT}.${gateId}`,
      handoff: `${OWNER_ACTION_QUEUE_HANDOFF_SOURCE_ARTIFACT}.${gateId}`,
      completionDrill: `${OWNER_ACTION_QUEUE_COMPLETION_DRILL_SOURCE_ARTIFACT}.${gateId}`,
    };

    return {
      gateId,
      status: detail.status,
      sourceArtifact: sourceArtifacts.scoreboard,
      sourceArtifacts,
      sourceArtifactCount: Object.values(sourceArtifacts).filter(Boolean).length,
    };
  });
}

function remediationCompletionSourceTrace(gateIds) {
  return gateIds.map((gateId, index) => {
    const detail = ownerActionDetail(gateId, index);
    return {
      gateId,
      status: detail.status,
      sourceArtifact: `${OWNER_GATE_SCOREBOARD_REMEDIATION_COMPLETION_SOURCE_ARTIFACT}.${gateId}`,
      sourceArtifactCount: 1,
    };
  });
}

function remediationExternalGateSourceTrace(gateIds) {
  return gateIds.map((gateId, index) => {
    const detail = ownerActionDetail(gateId, index);
    return {
      gateId,
      status: detail.status,
      sourceBoundary: detail.sourceBoundary,
      sourceArtifact: `${OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT}.${gateId}`,
      sourceArtifactCount: 1,
    };
  });
}

function launchEvidenceBlockerSourceTrace(gateIds) {
  return gateIds.map((gateId, index) => {
    const detail = ownerActionDetail(gateId, index);
    const sourceArtifacts = {
      launchGap: `${LAUNCH_EVIDENCE_GAPS_SOURCE_ARTIFACT}.${gateId}`,
      unresolvedBlocker: `${LAUNCH_EVIDENCE_UNRESOLVED_BLOCKERS_SOURCE_ARTIFACT}.${gateId}`,
      remediationCompletion: `${OWNER_GATE_SCOREBOARD_REMEDIATION_COMPLETION_SOURCE_ARTIFACT}.${gateId}`,
      remediationExternalGates: `${OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT}.${gateId}`,
    };

    return {
      gateId,
      status: detail.status,
      severity: 'P1',
      sourceArtifact: sourceArtifacts.launchGap,
      sourceArtifacts,
      sourceArtifactCount: Object.values(sourceArtifacts).filter(Boolean).length,
    };
  });
}

function postSummaryArtifactRedactionSummary() {
  const resultArtifacts = {
    json: COMMERCIAL_ARTIFACT_REDACTION_JSON,
    markdown: COMMERCIAL_ARTIFACT_REDACTION_MD,
  };
  const alignmentVerifier = {
    command: POST_SUMMARY_ARTIFACT_REDACTION_ALIGNMENT_COMMAND,
    executionOrder: POST_SUMMARY_ARTIFACT_REDACTION_ALIGNMENT_EXECUTION_ORDER,
    boundary: POST_SUMMARY_ARTIFACT_REDACTION_ALIGNMENT_BOUNDARY,
  };
  const fixtureVerifier = {
    command: POST_SUMMARY_ARTIFACT_REDACTION_FIXTURE_COMMAND,
    executionOrder: POST_SUMMARY_ARTIFACT_REDACTION_FIXTURE_EXECUTION_ORDER,
    boundary: POST_SUMMARY_ARTIFACT_REDACTION_FIXTURE_BOUNDARY,
  };
  const sourceTrace = postSummaryCommandSourceTrace(
    POST_SUMMARY_ARTIFACT_REDACTION_SOURCE_ARTIFACT,
    [
      { key: 'command', value: POST_SUMMARY_ARTIFACT_REDACTION_COMMAND },
      { key: 'executionOrder', value: POST_SUMMARY_ARTIFACT_REDACTION_EXECUTION_ORDER },
      { key: 'resultArtifacts', value: resultArtifacts },
      { key: 'alignmentVerifier', value: alignmentVerifier.command, boundary: alignmentVerifier.boundary },
      { key: 'fixtureVerifier', value: fixtureVerifier.command, boundary: fixtureVerifier.boundary },
    ],
  );

  return {
    sourceArtifact: POST_SUMMARY_ARTIFACT_REDACTION_SOURCE_ARTIFACT,
    status: 'post_summary_scan_required',
    command: POST_SUMMARY_ARTIFACT_REDACTION_COMMAND,
    executionOrder: POST_SUMMARY_ARTIFACT_REDACTION_EXECUTION_ORDER,
    includedInThisInvocation: true,
    resultArtifacts,
    alignmentVerifier,
    fixtureVerifier,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: POST_SUMMARY_COMMAND_SOURCE_TRACE_BOUNDARY,
    boundary: POST_SUMMARY_ARTIFACT_REDACTION_BOUNDARY,
    doesNotProve: POST_SUMMARY_ARTIFACT_REDACTION_DOES_NOT_PROVE,
    doesNotProveCount: POST_SUMMARY_ARTIFACT_REDACTION_DOES_NOT_PROVE.length,
  };
}

function postSummaryLaunchReadinessAlignmentSummary() {
  const fixtureVerifier = {
    command: EXPECTED_LAUNCH_READINESS_FIXTURE_COMMAND,
    executionOrder: EXPECTED_LAUNCH_READINESS_FIXTURE_EXECUTION_ORDER,
    boundary: EXPECTED_LAUNCH_READINESS_FIXTURE_BOUNDARY,
  };
  const sourceTrace = postSummaryCommandSourceTrace(
    POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_SOURCE_ARTIFACT,
    [
      { key: 'command', value: EXPECTED_LAUNCH_READINESS_COMMAND },
      { key: 'executionOrder', value: EXPECTED_LAUNCH_READINESS_EXECUTION_ORDER },
      { key: 'fixtureVerifier', value: fixtureVerifier.command, boundary: fixtureVerifier.boundary },
    ],
  );

  return {
    sourceArtifact: POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_SOURCE_ARTIFACT,
    status: 'included_after_post_summary_redaction_alignment',
    command: EXPECTED_LAUNCH_READINESS_COMMAND,
    executionOrder: EXPECTED_LAUNCH_READINESS_EXECUTION_ORDER,
    includedInThisInvocation: true,
    fixtureVerifier,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: POST_SUMMARY_COMMAND_SOURCE_TRACE_BOUNDARY,
    boundary: EXPECTED_LAUNCH_READINESS_BOUNDARY,
    doesNotProve: POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_DOES_NOT_PROVE,
    doesNotProveCount: POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_DOES_NOT_PROVE.length,
  };
}

function postSummaryLaunchEvidenceRefreshSummary() {
  const resultArtifacts = {
    json: LAUNCH_EVIDENCE_JSON,
    markdown: LAUNCH_EVIDENCE_MD,
  };
  const finalSummaryRewrite = {
    required: true,
    purpose: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_FINAL_REWRITE_PURPOSE,
  };
  const sourceTrace = postSummaryCommandSourceTrace(
    POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_SOURCE_ARTIFACT,
    [
      { key: 'command', value: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_COMMAND },
      { key: 'executionOrder', value: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_EXECUTION_ORDER },
      { key: 'resultArtifacts', value: resultArtifacts },
      { key: 'finalSummaryRewrite', value: finalSummaryRewrite.purpose },
    ],
  );

  return {
    sourceArtifact: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_SOURCE_ARTIFACT,
    status: 'included_after_initial_passed_summary',
    command: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_COMMAND,
    executionOrder: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_EXECUTION_ORDER,
    includedInThisInvocation: true,
    resultArtifacts,
    finalSummaryRewrite,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: POST_SUMMARY_COMMAND_SOURCE_TRACE_BOUNDARY,
    boundary: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_STATE_BOUNDARY,
    doesNotProve: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_DOES_NOT_PROVE,
    doesNotProveCount: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_DOES_NOT_PROVE.length,
  };
}

function fullLocalApprovalPackageSummary() {
  const approvalRequiredBefore = [
    'accessibility_smoke',
    'browser_journey',
    'network_and_audit',
    'full_local_gate',
    'worker_execution_or_export',
    'live_payment_or_credential_gate',
    'customer_or_partner_outreach',
  ];
  const optionalGateCommands = {
    accessibility_smoke: 'npm run verify:commercial-a11y',
    browser_journey: 'npm run verify:commercial-browser',
    network_and_audit: 'npm run verify:commercial-network',
    full_local_gate: 'npm run verify:commercial-full',
  };
  const fixtureVerifier = {
    command: FULL_LOCAL_APPROVAL_PACKAGE_FIXTURE_COMMAND,
    executionOrder: FULL_LOCAL_APPROVAL_PACKAGE_FIXTURE_EXECUTION_ORDER,
    boundary: FULL_LOCAL_APPROVAL_PACKAGE_FIXTURE_BOUNDARY,
  };
  const sourceTrace = postSummaryCommandSourceTrace(
    FULL_LOCAL_APPROVAL_PACKAGE_SOURCE_ARTIFACT,
    [
      { key: 'command', value: FULL_LOCAL_APPROVAL_PACKAGE_COMMAND },
      { key: 'executionOrder', value: FULL_LOCAL_APPROVAL_PACKAGE_EXECUTION_ORDER },
      { key: 'approvalRequiredBefore', value: approvalRequiredBefore },
      { key: 'optionalGateCommands', value: optionalGateCommands },
      { key: 'fixtureVerifier', value: fixtureVerifier.command, boundary: fixtureVerifier.boundary },
    ],
  );

  return {
    sourceArtifact: FULL_LOCAL_APPROVAL_PACKAGE_SOURCE_ARTIFACT,
    status: 'approval_required_plan_only',
    command: FULL_LOCAL_APPROVAL_PACKAGE_COMMAND,
    executionOrder: FULL_LOCAL_APPROVAL_PACKAGE_EXECUTION_ORDER,
    includedInThisInvocation: true,
    condition: FULL_LOCAL_APPROVAL_PACKAGE_CONDITION,
    executionApproved: false,
    approvalRequiredBefore,
    optionalGateCommands,
    fixtureVerifier,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: POST_SUMMARY_COMMAND_SOURCE_TRACE_BOUNDARY,
    boundary: FULL_LOCAL_APPROVAL_PACKAGE_BOUNDARY,
    doesNotProve: FULL_LOCAL_APPROVAL_PACKAGE_DOES_NOT_PROVE,
    doesNotProveCount: FULL_LOCAL_APPROVAL_PACKAGE_DOES_NOT_PROVE.length,
  };
}

function manualWcagReviewPacketSourceAudit() {
  return {
    schemaVersion: '2026-06-05.apo-manual-wcag-review-packet-source-audit.v1',
    generatedAt: '2026-06-05T00:00:00.000Z',
    packetPath: 'docs/commercialization/manual-wcag-review-packet-latest.json',
    networkFetch: true,
    sourceBoundary:
      'Manual WCAG review packet source audit proves only W3C/WAI official reference URL presence and expected page text at verification time. It does not prove manual review completion, WCAG conformance, legal compliance, procurement approval, assistive-technology coverage, or commercial readiness.',
    allPassed: true,
    sourceCount: MANUAL_WCAG_REVIEW_PACKET_SOURCE_URLS.length,
    passedCount: MANUAL_WCAG_REVIEW_PACKET_SOURCE_URLS.length,
    failedCount: 0,
    missingExpectationCount: 0,
    unexpectedReferenceCount: 0,
    failedSourceIds: [],
    unexpectedReferences: [],
    sources: MANUAL_WCAG_REVIEW_PACKET_SOURCE_URLS.map((url, index) => ({
      id: MANUAL_WCAG_REVIEW_PACKET_SOURCE_IDS[index],
      label: `W3C/WAI fixture source ${index + 1}`,
      url,
      status: 'passed',
      checkpointIds: [`fixture-checkpoint-${index + 1}`],
      fetch: {
        attempted: true,
        evidence: [
          { label: `W3C/WAI fixture expectation ${index + 1}a`, matched: true },
          { label: `W3C/WAI fixture expectation ${index + 1}b`, matched: true },
        ],
      },
    })),
  };
}

function manualWcagReviewPacket() {
  return {
    schemaVersion: '2026-06-05.apo-manual-wcag-review-packet.v1',
    status: 'owner_manual_review_required',
    requiredOfficialReferenceCount: MANUAL_WCAG_REVIEW_PACKET_SOURCE_URLS.length,
    officialReferences: MANUAL_WCAG_REVIEW_PACKET_SOURCE_URLS.map((url, index) => ({
      id: MANUAL_WCAG_REVIEW_PACKET_SOURCE_IDS[index],
      label: `W3C/WAI fixture source ${index + 1}`,
      url,
    })),
  };
}

function manualWcagReviewPacketSourceAuditCoverage() {
  const audit = manualWcagReviewPacketSourceAudit();
  const sourceTrace = sourceAuditSourceTrace(
    audit.sources,
    MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_SOURCE_ARTIFACT,
  );
  return {
    artifact: MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_JSON,
    packetPath: audit.packetPath,
    generatedAt: audit.generatedAt,
    networkFetch: audit.networkFetch,
    allPassed: audit.allPassed,
    sourceCount: audit.sourceCount,
    passedCount: audit.passedCount,
    failedCount: audit.failedCount,
    missingExpectationCount: audit.missingExpectationCount,
    unexpectedReferenceCount: audit.unexpectedReferenceCount,
    failedSourceIds: audit.failedSourceIds,
    unexpectedReferences: audit.unexpectedReferences,
    sourceIds: audit.sources.map((source) => source.id),
    sourceUrls: audit.sources.map((source) => source.url),
    checkpointReferenceCount: audit.sources.reduce((total, source) => total + source.checkpointIds.length, 0),
    expectationCheckCount: audit.sources.reduce((total, source) => total + source.fetch.evidence.length, 0),
    expectedTextMatchCount: audit.sources.reduce(
      (total, source) => total + source.fetch.evidence.filter((item) => item.matched).length,
      0,
    ),
    fetchedSourceCount: audit.sources.filter((source) => source.fetch.attempted).length,
    sourceTraceSourceArtifact: MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_SOURCE_ARTIFACT,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_AUDIT_SOURCE_TRACE_BOUNDARY,
    boundary: audit.sourceBoundary,
  };
}

function ownerEvidenceCompletionDrillSourceAudit() {
  const packetTypeForKey = (key) => key.split(':')[0];
  const packetTypes = ['live_proof_run', 'commercial_evidence_intake', 'manual_wcag_review'];
  const sources = OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_KEYS.map((key, index) => ({
    key,
    packetType: packetTypeForKey(key),
    id: key.split(':')[1],
    url: OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_URLS[index],
    status: 'passed',
    fetch: {
      attempted: true,
      evidence: [
        { label: `Completion drill fixture expectation ${index + 1}a`, matched: true },
        { label: `Completion drill fixture expectation ${index + 1}b`, matched: true },
      ],
    },
  }));
  return {
    schemaVersion: '2026-06-05.apo-owner-evidence-completion-drill-source-audit.v1',
    generatedAt: '2026-06-05T00:00:00.000Z',
    drillPath: OWNER_EVIDENCE_COMPLETION_DRILL_JSON,
    networkFetch: true,
    sourceBoundary:
      'Owner-evidence completion-drill source audit proves only official reference URL presence and expected page text at verification time. It does not prove owner-held evidence, live checkout, live MRR, partner commitments, documented outcomes, manual WCAG conformance, legal compliance, production state, or commercial readiness.',
    allPassed: true,
    sourceCount: sources.length,
    passedCount: sources.length,
    failedCount: 0,
    missingExpectationCount: 0,
    unexpectedReferenceCount: 0,
    topLevelUrlMismatch: false,
    failedSourceKeys: [],
    unexpectedReferences: [],
    packetTypes,
    packetReferenceCounts: {
      live_proof_run: 6,
      commercial_evidence_intake: 4,
      manual_wcag_review: 6,
    },
    sources,
  };
}

function ownerEvidenceCompletionDrillSourceAuditCoverage() {
  const audit = ownerEvidenceCompletionDrillSourceAudit();
  const sourceTrace = sourceAuditSourceTrace(
    audit.sources,
    OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_SOURCE_ARTIFACT,
  );
  return {
    artifact: OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON,
    drillPath: audit.drillPath,
    generatedAt: audit.generatedAt,
    networkFetch: audit.networkFetch,
    allPassed: audit.allPassed,
    sourceCount: audit.sourceCount,
    passedCount: audit.passedCount,
    failedCount: audit.failedCount,
    missingExpectationCount: audit.missingExpectationCount,
    unexpectedReferenceCount: audit.unexpectedReferenceCount,
    topLevelUrlMismatch: audit.topLevelUrlMismatch,
    failedSourceKeys: audit.failedSourceKeys,
    unexpectedReferences: audit.unexpectedReferences,
    packetTypes: audit.packetTypes,
    packetReferenceCounts: audit.packetReferenceCounts,
    sourceKeys: audit.sources.map((source) => source.key),
    sourceUrls: audit.sources.map((source) => source.url),
    expectationCheckCount: audit.sources.reduce((total, source) => total + source.fetch.evidence.length, 0),
    expectedTextMatchCount: audit.sources.reduce(
      (total, source) => total + source.fetch.evidence.filter((item) => item.matched).length,
      0,
    ),
    fetchedSourceCount: audit.sources.filter((source) => source.fetch.attempted).length,
    sourceTraceSourceArtifact: OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_SOURCE_ARTIFACT,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_AUDIT_SOURCE_TRACE_BOUNDARY,
    boundary: audit.sourceBoundary,
  };
}

function proofBucketSummary(gateIds) {
  const proofBuckets = launchEvidence(gateIds).proof_buckets;
  const bucketNames = Object.keys(proofBuckets);
  const countsByBucket = Object.fromEntries(
    bucketNames.map((bucketName) => [bucketName, proofBuckets[bucketName].length]),
  );
  const items = bucketNames.flatMap((bucketName) =>
    proofBuckets[bucketName].map((item, index) => ({
      bucket: bucketName,
      index,
      label: item.label,
      status: item.status,
      source: item.source,
      boundary: item.boundary,
    })),
  );
  const sourcePaths = [...new Set(items.map((item) => item.source).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
  const statusesByBucket = Object.fromEntries(
    bucketNames.map((bucketName) => [
      bucketName,
      proofBuckets[bucketName].reduce((statusCounts, item) => {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
        return statusCounts;
      }, {}),
    ]),
  );

  const sourceArtifacts = {
    proofBuckets: `${LAUNCH_EVIDENCE_JSON}#proof_buckets`,
    ...Object.fromEntries(
      bucketNames.map((bucketName) => [
        bucketName,
        `${LAUNCH_EVIDENCE_JSON}#proof_buckets.${bucketName}`,
      ]),
    ),
  };
  const sourceTrace = items.map((item) => ({
    bucket: item.bucket,
    index: item.index,
    label: item.label,
    status: item.status,
    source: item.source,
    boundary: item.boundary,
    sourceArtifact: `${LAUNCH_EVIDENCE_JSON}#proof_buckets.${item.bucket}.${item.index}`,
    sourcePath: item.source,
  }));

  return {
    sourceArtifact: `${LAUNCH_EVIDENCE_JSON}#proof_buckets`,
    sourceArtifacts,
    sourceArtifactCount: Object.values(sourceArtifacts).filter(Boolean).length,
    bucketNames,
    bucketCount: bucketNames.length,
    itemCount: items.length,
    countsByBucket,
    statusesByBucket,
    sourceCount: sourcePaths.length,
    sourcePaths,
    boundaryCount: items.filter((item) => item.boundary).length,
    hostedLiveItemCount: countsByBucket.hosted_live,
    localItemCount: countsByBucket.local,
    repoArtifactItemCount: countsByBucket.repo_artifact,
    candidateShadowItemCount: countsByBucket.candidate_shadow,
    roadmapItemCount: countsByBucket.roadmap,
    items,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: PROOF_BUCKET_SOURCE_TRACE_BOUNDARY,
    evidenceBoundary: PROOF_BUCKET_EVIDENCE_BOUNDARY,
  };
}

function ownerActionDetail(gateId, index) {
  return {
    id: gateId,
    gateId,
    label: gateId.replaceAll('_', ' '),
    track: index % 2 === 0 ? 'live-proof' : 'commercial-proof',
    status: 'blocked_fixture_owner_evidence_required',
    sourceBoundary: `fixture owner-held boundary for ${gateId}`,
    currentEvidence: `Fixture current evidence for ${gateId}`,
    neededEvidence: `Fixture needed evidence for ${gateId}`,
    ownerAction: `Fixture owner action for ${gateId}`,
    ownerPrepCommand: `prepare ${gateId}`,
    nextCommand: `verify ${gateId}`,
    riskIfSkipped: `Fixture risk if ${gateId} is skipped`,
    doesNotProve: [`Fixture ${gateId} does not prove commercial readiness`],
    rawEvidencePolicy: `Keep raw fixture evidence for ${gateId} outside git.`,
    repoDoesNotDo: `The repo cannot complete ${gateId} without owner-held evidence.`,
  };
}

function ownerPrepActionsByGate(gateIds) {
  const sharedCommercialEvidenceAction =
    'docs/commercialization/commercial-evidence-intake.local.json: fixture shared partner/outcome prep action';
  const actionsByGate = {
    manual_wcag_evidence: [
      'docs/commercialization/manual-wcag-evidence.local.json: fixture manual WCAG review prep action',
    ],
    real_stripe_test_checkout: [
      'stripe_test_checkout: fixture Stripe test secret and Supabase test account prep action',
      'docs/commercialization/stripe-test-checkout-proof-latest.json: fixture test checkout proof prep action',
    ],
    live_mrr_gt_zero: [
      'live_mrr_gt_zero: fixture live Stripe secret prep action',
      'docs/commercialization/stripe-live-mrr-proof-latest.json: fixture live MRR proof prep action',
    ],
    three_committed_partners: [sharedCommercialEvidenceAction],
    documented_outcomes: [sharedCommercialEvidenceAction],
  };

  return Object.fromEntries(
    gateIds.map((gateId) => [gateId, actionsByGate[gateId] || [`${gateId}: fixture owner prep action`]]),
  );
}

function uniqueOwnerPrepActionNeededCount(gateIds) {
  return new Set(Object.values(ownerPrepActionsByGate(gateIds)).flat()).size;
}

function ownerPrepActionNeededByGate(gateIds) {
  return Object.fromEntries(
    Object.entries(ownerPrepActionsByGate(gateIds)).map(([gateId, ownerActionNeeded]) => [
      gateId,
      {
        gateId,
        ownerActionNeededCount: ownerActionNeeded.length,
        ownerActionNeeded,
        sourceArtifact: `${OWNER_PREP_ACTION_NEEDED_BY_GATE_SOURCE_ARTIFACT}.${gateId}`,
      },
    ]),
  );
}

function ownerPrepActionNeededByGateCoverage(gateIds) {
  const ownerPrepActionMap = ownerPrepActionNeededByGate(gateIds);
  const gateScopedOwnerPrepActionCount = Object.values(ownerPrepActionMap).reduce(
    (sum, gateSummary) => sum + gateSummary.ownerActionNeededCount,
    0,
  );
  const uniqueOwnerPrepActionCount = uniqueOwnerPrepActionNeededCount(gateIds);
  return {
    ownerPrepActionNeededGateCount: Object.keys(ownerPrepActionMap).length,
    gateScopedOwnerPrepActionCount,
    uniqueOwnerPrepActionNeededCount: uniqueOwnerPrepActionCount,
    sharedOwnerPrepActionCount: Math.max(gateScopedOwnerPrepActionCount - uniqueOwnerPrepActionCount, 0),
  };
}

function closeoutStatus(gateIds) {
  const ownerPrepUniqueCount = uniqueOwnerPrepActionNeededCount(gateIds);
  const failedStepIds = gateIds.length > 0 ? ['verify-remediation-gates'] : [];
  const acceptedLiveGateIds = ['production_calibration_run', 'authenticated_live_artifact_e2e'];
  const ownerActionQueue = gateIds.map((gateId) => ({ id: gateId }));
  const steps = [
    {
      id: 'owner-evidence-local-safety',
      status: 'pass',
      command: 'node scripts/verify-owner-evidence-local-safety.mjs --write',
    },
    ...(failedStepIds.length
      ? [
          {
            id: 'verify-remediation-gates',
            status: 'fail',
            command:
              'node scripts/verify-remediation-external-gates.mjs --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete',
          },
        ]
      : []),
  ];
  const statusArtifacts = {
    json: OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON,
    markdown: 'docs/commercialization/owner-evidence-closeout-status-latest.md',
  };
  const wrote = [statusArtifacts.json, statusArtifacts.markdown];
  return {
    goalComplete: gateIds.length === 0,
    remainingGateCount: gateIds.length,
    remainingGateIds: [...gateIds],
    acceptedLiveGateCount: acceptedLiveGateIds.length,
    acceptedLiveGateIds,
    ownerActionNeededCount: ownerPrepUniqueCount,
    ownerActionQueueCount: gateIds.length,
    ownerEvidencePrep: {
      ownerActionNeededCount: ownerPrepUniqueCount,
      ownerActionNeededByGate: ownerPrepActionsByGate(gateIds),
    },
    ownerActionQueue,
    ownerGateCloseoutSummaryCount: gateIds.length,
    ownerGateCloseoutSummary: gateIds.map((gateId) => ({ gateId })),
    stepCount: steps.length,
    steps,
    failedStepCount: failedStepIds.length,
    failedStepIds,
    nextCommands: {
      writeLocalScaffold: 'npm run prepare:owner-evidence -- --write',
      verifyLocalSafety: 'npm run verify:owner-evidence-local-safety',
      collectLiveProofs: [
        'npm run verify:stripe-test-checkout',
        'npm run verify:production-calibration',
        'npm run verify:commercial-live-auth-e2e',
        'npm run verify:stripe-live-mrr',
      ],
      composeAndCloseout:
        'npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence docs/commercialization/live-gate-evidence.local.json --commercial-intake docs/commercialization/commercial-evidence-intake.local.json --commercial-evidence docs/commercialization/commercial-evidence-records.local.json --manual-wcag-evidence docs/commercialization/manual-wcag-evidence.local.json',
      statusOnly: 'npm run verify:owner-evidence-closeout',
    },
    statusArtifacts,
    wroteCount: wrote.length,
    wrote,
    ownerGateScoreboard: {
      status: gateIds.length > 0 ? 'owner_evidence_required' : 'owner_evidence_complete',
      goalComplete: gateIds.length === 0,
      remainingGateCount: gateIds.length,
      remainingGateIds: [...gateIds],
      acceptedLiveGateCount: acceptedLiveGateIds.length,
      acceptedLiveGateIds,
      ownerActionNeededCount: ownerPrepUniqueCount,
      failedStepCount: failedStepIds.length,
      failedStepIds,
    },
  };
}

function ownerEvidenceLocalSafety() {
  return {
    schemaVersion: '2026-06-05.apo-owner-evidence-local-safety.v1',
    generatedAt: '2026-06-05T00:00:00.000Z',
    ok: true,
    protectedPathCount: 10,
    protectedPathChecks: [],
    ignoredProtectedPathCount: 10,
    trackedSensitiveFileViolations: [],
    stagedSensitivePathViolations: [],
    errorCount: 0,
    errors: [],
    evidenceBoundary:
      'This preflight proves only git ignore/tracking/staging policy for owner-held local evidence paths. It does not inspect file contents, validate redacted evidence completeness, prove live payment or revenue, prove partner commitments, prove documented outcomes, prove manual WCAG conformance, or replace host-level secret scanning/push protection.',
    doesNotProve: [
      'absence of secrets in git history, logs, screenshots, local machines, cloud dashboards, browser caches, or third-party systems',
      'validity or completeness of local owner evidence files',
      'commercial-ready status, legal compliance, WCAG conformance, or procurement approval',
    ],
  };
}

function ownerLocalSafetyStatus(localSafety = ownerEvidenceLocalSafety()) {
  const trackedSensitiveFileViolationCount = Array.isArray(localSafety.trackedSensitiveFileViolations)
    ? localSafety.trackedSensitiveFileViolations.length
    : localSafety.trackedSensitiveFileViolationCount ?? 0;
  const stagedSensitivePathViolationCount = Array.isArray(localSafety.stagedSensitivePathViolations)
    ? localSafety.stagedSensitivePathViolations.length
    : localSafety.stagedSensitivePathViolationCount ?? 0;
  const errorCount = Array.isArray(localSafety.errors)
    ? localSafety.errors.length
    : localSafety.errorCount ?? 0;
  const status = localSafety.ok === true ? 'passed' : 'failed';
  const doesNotProve = localSafety.doesNotProve || [];
  const doesNotProveCount = localSafety.doesNotProveCount ?? doesNotProve.length;
  const sourceTrace = [
    { key: 'status', value: status, sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_JSON}#ok` },
    {
      key: 'protectedPathCount',
      value: String(localSafety.protectedPathCount ?? 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_JSON}#protectedPathCount`,
    },
    {
      key: 'ignoredProtectedPathCount',
      value: String(localSafety.ignoredProtectedPathCount ?? 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_JSON}#ignoredProtectedPathCount`,
    },
    {
      key: 'trackedSensitiveFileViolationCount',
      value: String(trackedSensitiveFileViolationCount),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_JSON}#trackedSensitiveFileViolations`,
    },
    {
      key: 'stagedSensitivePathViolationCount',
      value: String(stagedSensitivePathViolationCount),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_JSON}#stagedSensitivePathViolations`,
    },
    {
      key: 'errorCount',
      value: String(errorCount),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_JSON}#errorCount`,
    },
    {
      key: 'doesNotProveCount',
      value: String(doesNotProveCount),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_JSON}#doesNotProveCount`,
    },
    {
      key: 'evidenceBoundary',
      value: localSafety.evidenceBoundary || '',
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_JSON}#evidenceBoundary`,
    },
  ];

  return {
    sourceArtifact: OWNER_EVIDENCE_LOCAL_SAFETY_JSON,
    status,
    ok: localSafety.ok === true,
    protectedPathCount: localSafety.protectedPathCount ?? 0,
    ignoredProtectedPathCount: localSafety.ignoredProtectedPathCount ?? 0,
    trackedSensitiveFileViolationCount,
    stagedSensitivePathViolationCount,
    errorCount,
    evidenceBoundary: localSafety.evidenceBoundary || '',
    doesNotProve,
    doesNotProveCount,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: OWNER_LOCAL_SAFETY_SOURCE_TRACE_BOUNDARY,
  };
}

function ownerLocalSafetyStatusSummary(localSafety = ownerEvidenceLocalSafety()) {
  const localSafetyStatus = ownerLocalSafetyStatus(localSafety);
  const sourceTrace = localSafetyStatus.sourceTrace.map((row) => ({
    ...row,
    handoffSourceArtifact: `${OWNER_LOCAL_SAFETY_HANDOFF_SOURCE_ARTIFACT}.sourceTrace.${row.key}`,
    completionDrillSourceArtifact:
      `${OWNER_LOCAL_SAFETY_COMPLETION_DRILL_SOURCE_ARTIFACT}.sourceTrace.${row.key}`,
  }));

  return {
    ...localSafetyStatus,
    sourceArtifacts: {
      localSafety: OWNER_EVIDENCE_LOCAL_SAFETY_JSON,
      handoff: OWNER_LOCAL_SAFETY_HANDOFF_SOURCE_ARTIFACT,
      completionDrill: OWNER_LOCAL_SAFETY_COMPLETION_DRILL_SOURCE_ARTIFACT,
    },
    sourceArtifactCount: 3,
    handoffStatusMatchesLocalSafety: true,
    completionDrillStatusMatchesLocalSafety: true,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: OWNER_LOCAL_SAFETY_SUMMARY_SOURCE_TRACE_BOUNDARY,
    boundary: OWNER_LOCAL_SAFETY_SUMMARY_BOUNDARY,
  };
}

function ownerEvidenceHandoff(gateIds) {
  return {
    goalComplete: gateIds.length === 0,
    ownerActionQueueCount: gateIds.length,
    remainingGateIds: [...gateIds],
    ownerPrepReadiness: {
      ownerActionNeededCount: uniqueOwnerPrepActionNeededCount(gateIds),
      ownerActionNeeded: gateIds.map((gateId) => `${gateId}: fixture owner action needed`),
    },
    ownerPrepActionNeededByGateSourceArtifact: OWNER_PREP_ACTION_NEEDED_BY_GATE_SOURCE_ARTIFACT,
    ownerPrepActionNeededByGateBoundary: OWNER_PREP_ACTION_NEEDED_BY_GATE_BOUNDARY,
    ownerPrepActionNeededByGate: ownerPrepActionNeededByGate(gateIds),
    operationalAccessPrerequisiteCount: operationalAccessPrerequisites().length,
    operationalAccessPrerequisites: operationalAccessPrerequisites(),
    localSafetyStatus: ownerLocalSafetyStatus(),
    commandSequence: [
      'npm run prepare:owner-evidence -- --write',
      'npm run verify:owner-evidence-local-safety',
      'npm run verify:owner-evidence-closeout',
    ],
    ownerActionRows: gateIds.map((gateId, index) => {
      const detail = ownerActionDetail(gateId, index);
      return {
        order: index + 1,
        gateId,
        label: detail.label,
        track: detail.track,
        status: detail.status,
        sourceBoundary: detail.sourceBoundary,
        currentEvidence: detail.currentEvidence,
        neededEvidence: detail.neededEvidence,
        ownerAction: detail.ownerAction,
        ownerPrepCommand: detail.ownerPrepCommand,
        nextCommand: detail.nextCommand,
        closeoutStepIds: [`closeout-${gateId}`],
        closeoutFailureDetails: [`closeout-${gateId}: fixture failure detail`],
        blockingOwnerActions: [`${gateId}: fixture blocking owner action`],
        riskIfSkipped: detail.riskIfSkipped,
        doesNotProve: detail.doesNotProve,
        rawEvidencePolicy: detail.rawEvidencePolicy,
        repoDoesNotDo: detail.repoDoesNotDo,
      };
    }),
    outputs: {
      json: OWNER_EVIDENCE_HANDOFF_JSON,
      markdown: 'docs/commercialization/owner-evidence-handoff-latest.md',
      csv: 'docs/commercialization/owner-evidence-handoff-latest.csv',
    },
  };
}

function ownerEvidenceCompletionDrill(gateIds) {
  const packetSummaries = [
    {
      packetType: 'live_proof_run',
      officialReferenceCount: 6,
      officialReferenceIds: [
        'stripe-test-mode',
        'stripe-api-keys',
        'stripe-key-best-practices',
        'pci-dss-v4-0-1',
        'supabase-edge-function-secrets',
        'github-actions-secrets',
      ],
      officialReferenceUrls: OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_URLS.slice(0, 6),
    },
    {
      packetType: 'commercial_evidence_intake',
      officialReferenceCount: 4,
      officialReferenceIds: [
        'ftc-consumer-reviews-rule-questions',
        'ftc-endorsements-reviews',
        'ftc-endorsement-guides-faq',
        'ftc-review-solicitation-guide',
      ],
      officialReferenceUrls: OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_URLS.slice(6, 10),
    },
    {
      packetType: 'manual_wcag_review',
      officialReferenceCount: 6,
      officialReferenceIds: ['wcag22', 'wcag-em-overview', 'wcag-em-2', 'wcag-em-report-tool', 'wai-easy-checks', 'wai-aria-apg'],
      officialReferenceUrls: OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_URLS.slice(10),
    },
  ];
  const officialReferenceUrls = [
    ...new Set(packetSummaries.flatMap((packet) => packet.officialReferenceUrls)),
  ].sort((a, b) => a.localeCompare(b));
  return {
    status: gateIds.length > 0 ? 'owner_evidence_required' : 'owner_evidence_complete',
    goalComplete: gateIds.length === 0,
    requiredGateCount: gateIds.length,
    blockedGateCount: gateIds.length,
    ownerActionQueueCount: gateIds.length,
    ownerActionNeededCount: uniqueOwnerPrepActionNeededCount(gateIds),
    ownerPrepActionNeededByGateSourceArtifact: OWNER_PREP_ACTION_NEEDED_BY_GATE_SOURCE_ARTIFACT,
    ownerPrepActionNeededByGateBoundary: OWNER_PREP_ACTION_NEEDED_BY_GATE_BOUNDARY,
    ownerPrepActionNeededByGate: ownerPrepActionNeededByGate(gateIds),
    operationalAccessPrerequisiteCount: operationalAccessPrerequisites().length,
    operationalAccessPrerequisites: operationalAccessPrerequisites(),
    localSafetyStatus: ownerLocalSafetyStatus(),
    packetCount: 3,
    officialReferenceCount: officialReferenceUrls.length,
    officialReferenceUrls,
    matrixRowCount: gateIds.length,
    requiredGateIds: [...gateIds],
    outputArtifacts: {
      json: OWNER_EVIDENCE_COMPLETION_DRILL_JSON,
      markdown: 'docs/commercialization/owner-evidence-completion-drill-latest.md',
      csv: 'docs/commercialization/owner-evidence-completion-matrix-latest.csv',
    },
    packetSummaries,
    recommendedCommandOrder: [
      'npm run generate:owner-evidence-completion-drill',
      'npm run generate:owner-evidence-handoff',
      'npm run verify:commercial',
    ],
    completionRows: gateIds.map((gateId, index) => ({
      order: index + 1,
      gateId,
      label: gateId.replaceAll('_', ' '),
      completionState: 'blocked_owner_evidence_required',
    })),
  };
}

function ownerEvidenceExecutionSummary(gateIds) {
  const closeout = closeoutStatus(gateIds);
  const handoff = ownerEvidenceHandoff(gateIds);
  const completionDrill = ownerEvidenceCompletionDrill(gateIds);
  const failedStepIds = closeout.failedStepIds || closeout.ownerGateScoreboard.failedStepIds || [];
  const failedStepSourceTrace = closeoutFailedStepSourceTrace(closeout, failedStepIds);
  const nextCommandSourceTrace = closeoutNextCommandSourceTrace(closeout.nextCommands || {});
  const statusArtifactSourceTrace = closeoutStatusArtifactSourceTrace(closeout.statusArtifacts || {});
  const closeoutCoverageSourceTrace = ownerCloseoutCoverageSourceTrace(
    failedStepSourceTrace,
    nextCommandSourceTrace,
    statusArtifactSourceTrace,
  );
  const handoffCommandSequenceSourceTrace = commandSequenceSourceTrace(
    handoff.commandSequence,
    OWNER_HANDOFF_COMMAND_SEQUENCE_SOURCE_ARTIFACT,
  );
  const completionCommandOrderSourceTrace = commandSequenceSourceTrace(
    completionDrill.recommendedCommandOrder,
    OWNER_COMPLETION_DRILL_COMMAND_ORDER_SOURCE_ARTIFACT,
  );
  return {
    status: closeout.ownerGateScoreboard.status || completionDrill.status,
    goalComplete:
      closeout.goalComplete === true && handoff.goalComplete === true && completionDrill.goalComplete === true,
    gateIds: {
      remaining: closeout.remainingGateIds,
      handoffRemaining: handoff.remainingGateIds,
      completionRequired: completionDrill.requiredGateIds,
    },
    ownerPrepActionNeededByGateSourceArtifact: OWNER_PREP_ACTION_NEEDED_BY_GATE_SOURCE_ARTIFACT,
    ownerPrepActionNeededByGateBoundary: OWNER_PREP_ACTION_NEEDED_BY_GATE_BOUNDARY,
    ownerPrepActionNeededByGateCoverage: ownerPrepActionNeededByGateCoverage(gateIds),
    ownerPrepActionNeededByGate: ownerPrepActionNeededByGate(gateIds),
    commandSequenceSourceTraceBoundary: OWNER_COMMAND_SEQUENCE_SOURCE_TRACE_BOUNDARY,
    operationalAccessPrerequisiteSummary: operationalAccessPrerequisiteSummary(),
    localSafetyStatusSummary: ownerLocalSafetyStatusSummary(),
    closeoutCoverage: {
      ownerActionQueueCount: closeout.ownerActionQueueCount,
      ownerActionNeededCount: closeout.ownerActionNeededCount,
      ownerPrepActionNeededCount: closeout.ownerEvidencePrep.ownerActionNeededCount,
      failedStepCount: failedStepIds.length,
      failedStepIds,
      failedStepSourceArtifact: OWNER_CLOSEOUT_FAILED_STEPS_SOURCE_ARTIFACT,
      failedStepSourceTraceCount: failedStepSourceTrace.length,
      failedStepSourceTraceCommandCount: failedStepSourceTrace.filter((step) => step.command).length,
      failedStepSourceTrace,
      failedStepSourceTraceBoundary: OWNER_CLOSEOUT_FAILED_STEP_SOURCE_TRACE_BOUNDARY,
      nextCommandCount: Object.keys(closeout.nextCommands || {}).length,
      nextCommandValueCount: nextCommandSourceTrace.reduce(
        (sum, row) => sum + (row.commands || []).length,
        0,
      ),
      nextCommandSourceArtifact: OWNER_CLOSEOUT_NEXT_COMMANDS_SOURCE_ARTIFACT,
      nextCommandSourceTraceCount: nextCommandSourceTrace.length,
      nextCommandSourceTrace,
      statusArtifactCount: Object.keys(closeout.statusArtifacts || {}).length,
      statusArtifacts: closeout.statusArtifacts || {},
      statusArtifactSourceArtifact: OWNER_CLOSEOUT_STATUS_ARTIFACTS_SOURCE_ARTIFACT,
      statusArtifactSourceTraceCount: statusArtifactSourceTrace.length,
      statusArtifactSourceTrace,
      sourceTraceCount: closeoutCoverageSourceTrace.length,
      sourceTrace: closeoutCoverageSourceTrace,
      nextCommandSourceTraceBoundary: OWNER_CLOSEOUT_NEXT_COMMAND_SOURCE_TRACE_BOUNDARY,
    },
    handoffCoverage: {
      ownerActionQueueCount: handoff.ownerActionQueueCount,
      ownerActionRowCount: handoff.ownerActionRows.length,
      ownerActionGateIds: handoff.ownerActionRows.map((row) => row.gateId),
      commandSequenceCount: handoff.commandSequence.length,
      commandSequence: handoff.commandSequence,
      commandSequenceSourceArtifact: OWNER_HANDOFF_COMMAND_SEQUENCE_SOURCE_ARTIFACT,
      commandSequenceSourceTraceCount: handoffCommandSequenceSourceTrace.length,
      commandSequenceSourceTrace: handoffCommandSequenceSourceTrace,
      sourceTraceCount: handoffCommandSequenceSourceTrace.length,
      sourceTrace: handoffCommandSequenceSourceTrace,
      outputs: handoff.outputs,
    },
    completionDrillCoverage: {
      status: completionDrill.status,
      requiredGateCount: completionDrill.requiredGateCount,
      blockedGateCount: completionDrill.blockedGateCount,
      ownerActionQueueCount: completionDrill.ownerActionQueueCount,
      ownerActionNeededCount: completionDrill.ownerActionNeededCount,
      packetCount: completionDrill.packetCount,
      packetTypes: completionDrill.packetSummaries.map((packet) => packet.packetType),
      officialReferenceCount: completionDrill.officialReferenceCount,
      officialReferenceUrls: completionDrill.officialReferenceUrls,
      packetOfficialReferenceCounts: Object.fromEntries(
        completionDrill.packetSummaries.map((packet) => [packet.packetType, packet.officialReferenceCount]),
      ),
      matrixRowCount: completionDrill.matrixRowCount,
      completionRowGateIds: completionDrill.completionRows.map((row) => row.gateId),
      recommendedCommandCount: completionDrill.recommendedCommandOrder.length,
      recommendedCommandOrder: completionDrill.recommendedCommandOrder,
      recommendedCommandOrderSourceArtifact: OWNER_COMPLETION_DRILL_COMMAND_ORDER_SOURCE_ARTIFACT,
      recommendedCommandOrderSourceTraceCount: completionCommandOrderSourceTrace.length,
      recommendedCommandOrderSourceTrace: completionCommandOrderSourceTrace,
      sourceTraceCount: completionCommandOrderSourceTrace.length,
      sourceTrace: completionCommandOrderSourceTrace,
      outputArtifacts: completionDrill.outputArtifacts,
    },
    evidenceBoundary:
      'This compact summary mirrors owner-evidence execution coverage and counts only. It does not execute owner commands, load credentials, perform outreach, complete manual WCAG review, prove live checkout, prove live MRR, prove partner commitments, prove documented outcomes, or upgrade commercial readiness.',
  };
}

function commandSequenceSourceTrace(commands, sourceArtifact) {
  return commands.map((command, index) => ({
    order: index + 1,
    command,
    sourceArtifact: `${sourceArtifact}.${index + 1}`,
  }));
}

function closeoutFailedStepSourceTrace(closeout, failedStepIds) {
  const stepsById = new Map((closeout.steps || []).map((step) => [step.id, step]));
  return failedStepIds.map((stepId) => {
    const step = stepsById.get(stepId) || {};
    return {
      id: stepId,
      status: step.status || null,
      command: step.command || null,
      sourceArtifact: `${OWNER_CLOSEOUT_FAILED_STEPS_SOURCE_ARTIFACT}.${stepId}`,
    };
  });
}

function closeoutNextCommandSourceTrace(nextCommands) {
  return Object.entries(nextCommands || {}).map(([key, value]) => {
    const commands = Array.isArray(value) ? value : value ? [value] : [];
    return {
      key,
      commands,
      commandCount: commands.length,
      sourceArtifact: `${OWNER_CLOSEOUT_NEXT_COMMANDS_SOURCE_ARTIFACT}.${key}`,
    };
  });
}

function closeoutStatusArtifactSourceTrace(statusArtifacts) {
  return Object.entries(statusArtifacts || {}).map(([key, artifactPath]) => ({
    key,
    artifactPath,
    sourceArtifact: `${OWNER_CLOSEOUT_STATUS_ARTIFACTS_SOURCE_ARTIFACT}.${key}`,
  }));
}

function ownerCloseoutCoverageSourceTrace(
  failedStepSourceTrace,
  nextCommandSourceTrace,
  statusArtifactSourceTrace,
) {
  return [
    ...failedStepSourceTrace.map((trace) => ({ traceType: 'failed_step', ...trace })),
    ...nextCommandSourceTrace.map((trace) => ({ traceType: 'next_command', ...trace })),
    ...statusArtifactSourceTrace.map((trace) => ({ traceType: 'status_artifact', ...trace })),
  ];
}

function ownerActionQueueRowSourceArtifacts(gateId) {
  return {
    remediationExternalGates: `${OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT}.${gateId}`,
    closeoutStatus: `${OWNER_ACTION_QUEUE_CLOSEOUT_SOURCE_ARTIFACT}.${gateId}`,
    handoff: `${OWNER_ACTION_QUEUE_HANDOFF_SOURCE_ARTIFACT}.${gateId}`,
    completionDrill: `${OWNER_ACTION_QUEUE_COMPLETION_DRILL_SOURCE_ARTIFACT}.${gateId}`,
  };
}

function ownerActionQueueSourceTrace(rows) {
  return rows.map((row) => ({
    gateId: row.gateId,
    status: row.status,
    track: row.track,
    sourceArtifact: row.sourceArtifact || '',
    sourceArtifacts: row.sourceArtifacts,
    sourceArtifactCount: row.sourceArtifactCount,
    sourceBoundary: row.sourceBoundary,
    ownerPrepCommand: row.ownerPrepCommand,
    nextCommand: row.nextCommand,
    blockingOwnerActionCount: row.blockingOwnerActionCount,
    closeoutFailureDetailCount: row.closeoutFailureDetailCount,
  }));
}

function ownerActionQueueSummary(gateIds) {
  const remediation = remediationGates(gateIds);
  const handoff = ownerEvidenceHandoff(gateIds);
  const closeout = closeoutStatus(gateIds);
  const completionDrill = ownerEvidenceCompletionDrill(gateIds);
  const handoffByGateId = new Map(handoff.ownerActionRows.map((row) => [row.gateId, row]));
  const rows = remediation.ownerActionQueue.map((item, index) => {
    const handoffRow = handoffByGateId.get(item.id) || {};
    const gateId = item.id || handoffRow.gateId || '';
    const closeoutFailureDetails = handoffRow.closeoutFailureDetails || [];
    const blockingOwnerActions = handoffRow.blockingOwnerActions || [];
    const doesNotProve = item.doesNotProve || handoffRow.doesNotProve || [];
    const sourceArtifacts = ownerActionQueueRowSourceArtifacts(gateId);
    const sourceArtifact = sourceArtifacts.remediationExternalGates;

    return {
      order: handoffRow.order ?? index + 1,
      gateId,
      label: item.label || handoffRow.label || '',
      track: handoffRow.track || null,
      status: item.status || handoffRow.status || '',
      sourceArtifact,
      sourceArtifacts,
      sourceArtifactCount: Object.keys(sourceArtifacts).length,
      sourceBoundary: item.sourceBoundary || handoffRow.sourceBoundary || '',
      currentEvidence: handoffRow.currentEvidence || item.evidence || '',
      neededEvidence: handoffRow.neededEvidence || item.neededEvidence || '',
      ownerAction: item.ownerAction || handoffRow.ownerAction || '',
      ownerPrepCommand: item.ownerPrepCommand || handoffRow.ownerPrepCommand || '',
      nextCommand: item.nextCommand || handoffRow.nextCommand || '',
      riskIfSkipped: item.riskIfSkipped || handoffRow.riskIfSkipped || '',
      closeoutStepIds: handoffRow.closeoutStepIds || [],
      closeoutFailureDetailCount: closeoutFailureDetails.length,
      blockingOwnerActionCount: blockingOwnerActions.length,
      doesNotProve,
      doesNotProveCount: doesNotProve.length,
      rawEvidencePolicy: handoffRow.rawEvidencePolicy || '',
      repoDoesNotDo: handoffRow.repoDoesNotDo || '',
    };
  });
  const queueGateIds = rows.map((row) => row.gateId);
  const sourceTrace = ownerActionQueueSourceTrace(rows);
  const ownerActionSummarySourceArtifacts = {
    remediationExternalGates: OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT,
    closeoutStatus: OWNER_ACTION_QUEUE_CLOSEOUT_SOURCE_ARTIFACT,
    handoff: OWNER_ACTION_QUEUE_HANDOFF_SOURCE_ARTIFACT,
    completionDrill: OWNER_ACTION_QUEUE_COMPLETION_DRILL_SOURCE_ARTIFACT,
  };

  return {
    status: remediation.goalComplete === true ? 'owner_action_queue_complete' : 'owner_action_required',
    queueCount: remediation.ownerActionQueue.length,
    closeoutQueueCount: closeout.ownerActionQueue.length,
    handoffRowCount: handoff.ownerActionRows.length,
    completionDrillRowCount: completionDrill.completionRows.length,
    gateIds: queueGateIds,
    sourceArtifact: ownerActionSummarySourceArtifacts.remediationExternalGates,
    sourceArtifacts: ownerActionSummarySourceArtifacts,
    sourceArtifactCount: Object.keys(ownerActionSummarySourceArtifacts).length,
    rowSourceArtifactCount: rows.reduce((total, row) => total + row.sourceArtifactCount, 0),
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    handoffOnlyGateIds: handoff.ownerActionRows
      .map((row) => row.gateId)
      .filter((gateId) => gateId && !queueGateIds.includes(gateId)),
    ownerPrepCommandCount: rows.filter((row) => row.ownerPrepCommand).length,
    nextCommandCount: rows.filter((row) => row.nextCommand).length,
    rawEvidencePolicyCount: rows.filter((row) => row.rawEvidencePolicy).length,
    repoDoesNotDoCount: rows.filter((row) => row.repoDoesNotDo).length,
    blockingOwnerActionCount: rows.reduce((total, row) => total + row.blockingOwnerActionCount, 0),
    closeoutFailureDetailCount: rows.reduce((total, row) => total + row.closeoutFailureDetailCount, 0),
    statusesByGate: Object.fromEntries(rows.map((row) => [row.gateId, row.status])),
    tracksByGate: Object.fromEntries(rows.map((row) => [row.gateId, row.track]).filter(([, track]) => track)),
    rows,
    sourceTraceBoundary: OWNER_ACTION_QUEUE_SOURCE_TRACE_BOUNDARY,
    evidenceBoundary:
      'This compact summary mirrors owner-action queue and handoff instructions only. It does not run owner commands, load credentials, collect raw evidence, send outreach, complete manual WCAG review, prove live checkout, prove live MRR, prove partner commitments, prove documented outcomes, or upgrade commercial readiness.',
  };
}

function completionAudit(gateIds) {
  return {
    goalComplete: gateIds.length === 0,
    remainingExternalGates: gateIds.map((gateId, index) => ({
      ...gate(gateId),
      status: ownerActionDetail(gateId, index).status,
    })),
  };
}

function remediationGates(gateIds) {
  return {
    goalComplete: gateIds.length === 0,
    ownerActionQueue: gateIds.map((gateId, index) => {
      const detail = ownerActionDetail(gateId, index);
      return {
        id: gateId,
        label: detail.label,
        status: detail.status,
        sourceBoundary: detail.sourceBoundary,
        ownerAction: detail.ownerAction,
        ownerPrepCommand: detail.ownerPrepCommand,
        nextCommand: detail.nextCommand,
        riskIfSkipped: detail.riskIfSkipped,
        doesNotProve: detail.doesNotProve,
      };
    }),
  };
}

function readinessState(gateIds, invocationOptions = defaultInvocationOptions()) {
  const decision = gateIds.length > 0 ? 'pilot-only' : 'sellable-with-caveats';
  const coverage = releaseGateCoverage(invocationOptions);
  const scoreboardSourceTrace = ownerGateScoreboardSourceTrace(gateIds);
  const completionSourceTrace = remediationCompletionSourceTrace(gateIds);
  const externalGateSourceTrace = remediationExternalGateSourceTrace(gateIds);
  const launchBlockerSourceTrace = launchEvidenceBlockerSourceTrace(gateIds);
  const commercialReadinessStateSourceArtifacts = {
    launchEvidence: LAUNCH_EVIDENCE_JSON,
    commercialArtifactRedaction: COMMERCIAL_ARTIFACT_REDACTION_JSON,
    launchEvidenceSourceAudit: LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON,
    commercialEvidenceIntakeSourceAudit: COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON,
    liveProofRunPacketSourceAudit: LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON,
    liveCloseoutAccessSourceAudit: LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON,
    manualWcagReviewPacketSourceAudit: MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_JSON,
    ownerEvidenceCompletionDrillSourceAudit: OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON,
    liveCloseoutReadiness: LIVE_CLOSEOUT_READINESS_JSON,
    ownerEvidenceCloseoutStatus: OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON,
    ownerEvidenceHandoff: OWNER_EVIDENCE_HANDOFF_JSON,
    ownerEvidenceCompletionDrill: OWNER_EVIDENCE_COMPLETION_DRILL_JSON,
    ownerEvidenceLocalSafety: OWNER_EVIDENCE_LOCAL_SAFETY_JSON,
    remediationCompletionAudit: REMEDIATION_COMPLETION_AUDIT_JSON,
    remediationExternalGates: REMEDIATION_EXTERNAL_GATES_JSON,
    fullLocalApprovalPackage: FULL_LOCAL_APPROVAL_PACKAGE_SOURCE_ARTIFACT,
  };

  return {
    status: gateIds.length > 0 ? 'owner_evidence_required' : 'owner_evidence_complete',
    alignmentStatus: 'passed',
    launchDecision: decision,
    expectedLaunchDecision: decision,
    goalComplete: gateIds.length === 0,
    sourceArtifact: commercialReadinessStateSourceArtifacts.launchEvidence,
    sourceArtifacts: commercialReadinessStateSourceArtifacts,
    sourceArtifactCount: Object.keys(commercialReadinessStateSourceArtifacts).length,
    ownerGateScoreboard: {
      sourceArtifact: OWNER_GATE_SCOREBOARD_SOURCE_ARTIFACT,
      sourceArtifacts: {
        scoreboard: OWNER_GATE_SCOREBOARD_SOURCE_ARTIFACT,
        remediationCompletion: OWNER_GATE_SCOREBOARD_REMEDIATION_COMPLETION_SOURCE_ARTIFACT,
        remediationExternalGates: OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT,
        closeoutStatus: OWNER_ACTION_QUEUE_CLOSEOUT_SOURCE_ARTIFACT,
        handoff: OWNER_ACTION_QUEUE_HANDOFF_SOURCE_ARTIFACT,
        completionDrill: OWNER_ACTION_QUEUE_COMPLETION_DRILL_SOURCE_ARTIFACT,
      },
      sourceArtifactCount: 6,
      status: gateIds.length > 0 ? 'owner_evidence_required' : 'owner_evidence_complete',
      goalComplete: gateIds.length === 0,
      remainingGateCount: gateIds.length,
      remainingGateIds: [...gateIds],
      sourceTraceCount: scoreboardSourceTrace.length,
      sourceTrace: scoreboardSourceTrace,
      remainingGateSourceTraceCount: scoreboardSourceTrace.length,
      remainingGateSourceTrace: scoreboardSourceTrace,
      sourceTraceBoundary: OWNER_GATE_SCOREBOARD_SOURCE_TRACE_BOUNDARY,
      evidenceBoundary: '',
      acceptedLiveGateIds: ['production_calibration_run', 'authenticated_live_artifact_e2e'],
      ownerActionNeededCount: gateIds.length > 0 ? 6 : 0,
      failedStepIds: gateIds.length > 0 ? ['verify-remediation-gates'] : [],
    },
    remediationCompletion: {
      sourceArtifact: OWNER_GATE_SCOREBOARD_REMEDIATION_COMPLETION_SOURCE_ARTIFACT,
      sourceArtifactCount: 1,
      goalComplete: gateIds.length === 0,
      remainingExternalGateCount: gateIds.length,
      remainingExternalGateIds: [...gateIds],
      sourceTraceCount: completionSourceTrace.length,
      sourceTrace: completionSourceTrace,
      remainingExternalGateSourceTraceCount: completionSourceTrace.length,
      remainingExternalGateSourceTrace: completionSourceTrace,
      sourceTraceBoundary: REMEDIATION_COMPLETION_SOURCE_TRACE_BOUNDARY,
      evidenceBoundary: REMEDIATION_COMPLETION_EVIDENCE_BOUNDARY,
    },
    launchEvidence: {
      sourceArtifact: LAUNCH_EVIDENCE_JSON,
      sourceArtifacts: {
        gaps: LAUNCH_EVIDENCE_GAPS_SOURCE_ARTIFACT,
        unresolvedBlockers: LAUNCH_EVIDENCE_UNRESOLVED_BLOCKERS_SOURCE_ARTIFACT,
        remediationCompletion: OWNER_GATE_SCOREBOARD_REMEDIATION_COMPLETION_SOURCE_ARTIFACT,
        remediationExternalGates: OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT,
      },
      sourceArtifactCount: 4,
      gapGateIds: [...gateIds],
      unresolvedBlockers: [...gateIds],
      scoreOverall: gateIds.length > 0 ? 3 : 4,
      sourceTraceCount: launchBlockerSourceTrace.length,
      sourceTrace: launchBlockerSourceTrace,
      blockerSourceTraceCount: launchBlockerSourceTrace.length,
      blockerSourceTrace: launchBlockerSourceTrace,
      sourceTraceBoundary: LAUNCH_EVIDENCE_BLOCKER_SOURCE_TRACE_BOUNDARY,
      evidenceBoundary: LAUNCH_EVIDENCE_BLOCKER_EVIDENCE_BOUNDARY,
    },
    launchEvidenceSummary: launchEvidenceSummary(gateIds),
    releaseGateCoverageSummary: releaseGateCoverageSummary(coverage),
    launchSourceAuditCoverage: launchSourceAuditCoverage(),
    commercialEvidenceIntakeSourceAuditCoverage: commercialEvidenceIntakeSourceAuditCoverage(),
    liveProofRunPacketSourceAuditCoverage: liveProofRunPacketSourceAuditCoverage(),
    liveCloseoutAccessSourceAuditCoverage: liveCloseoutAccessSourceAuditCoverage(),
    liveCloseoutReadinessCoverage: liveCloseoutReadinessCoverage(),
    postSummaryArtifactRedactionSummary: postSummaryArtifactRedactionSummary(),
    postSummaryLaunchReadinessAlignmentSummary: postSummaryLaunchReadinessAlignmentSummary(),
    postSummaryLaunchEvidenceRefreshSummary: postSummaryLaunchEvidenceRefreshSummary(),
    fullLocalApprovalPackageSummary: fullLocalApprovalPackageSummary(),
    manualWcagReviewPacketSourceAuditCoverage: manualWcagReviewPacketSourceAuditCoverage(),
    ownerEvidenceCompletionDrillSourceAuditCoverage: ownerEvidenceCompletionDrillSourceAuditCoverage(),
    proofBucketSummary: proofBucketSummary(gateIds),
    ownerEvidenceExecutionSummary: ownerEvidenceExecutionSummary(gateIds),
    ownerActionQueueSummary: ownerActionQueueSummary(gateIds),
    progressUpdates: launchEvidence(gateIds).progress_updates,
    bottleneckLog: launchEvidence(gateIds).bottleneck_log,
    implementationDecisions: launchEvidence(gateIds).implementation_decisions,
    rejectedVariants: launchEvidence(gateIds).rejected_variants,
    codeOptimizationReviews: launchEvidence(gateIds).code_optimization_reviews,
    remediationExternalGates: {
      sourceArtifact: OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT,
      sourceArtifactCount: 1,
      goalComplete: gateIds.length === 0,
      ownerActionQueueCount: gateIds.length,
      ownerActionGateIds: [...gateIds],
      sourceTraceCount: externalGateSourceTrace.length,
      sourceTrace: externalGateSourceTrace,
      ownerActionGateSourceTraceCount: externalGateSourceTrace.length,
      ownerActionGateSourceTrace: externalGateSourceTrace,
      sourceTraceBoundary: REMEDIATION_EXTERNAL_GATES_SOURCE_TRACE_BOUNDARY,
      evidenceBoundary: REMEDIATION_EXTERNAL_GATES_EVIDENCE_BOUNDARY,
    },
    evidenceBoundary:
      'This state summarizes current repo-generated launch and owner-evidence ledgers only. A passed repo-local verification summary does not upgrade the launch decision while owner/live gates remain unresolved.',
    doesNotProve: [
      'owner-held Stripe, Supabase, customer, partner, outcome, accessibility-review, or credential evidence',
      'live MRR, real Stripe checkout, three committed partners, documented outcomes, manual WCAG conformance, or commercial readiness',
    ],
    alignmentErrors: [],
  };
}

function summary(gateIds) {
  const invocationOptions = defaultInvocationOptions();
  const steps = [
    {
      id: 'typecheck',
      command: 'npx tsc --noEmit',
      status: 'passed',
    },
    {
      id: 'diff-hygiene',
      command: 'git diff --check',
      status: 'passed',
    },
  ];
  const failedSteps = steps.filter((step) => ['failed', 'timed_out'].includes(step.status));
  return {
    schemaVersion: SUMMARY_SCHEMA,
    status: 'passed',
    invocation: {
      command: 'node scripts/verify-commercial-release.mjs',
      options: invocationOptions,
    },
    plannedStepCount: steps.length,
    stepCount: steps.length,
    completedStepCount: steps.length,
    passedStepCount: steps.filter((step) => step.status === 'passed').length,
    failedStepCount: failedSteps.length,
    timedOutStepCount: steps.filter((step) => step.status === 'timed_out').length,
    failedSteps: failedSteps.map((step) => step.id),
    releaseGateCoverage: releaseGateCoverage(invocationOptions),
    commercialReadinessState: readinessState(gateIds, invocationOptions),
    postSummaryArtifactRedaction: {
      ...postSummaryArtifactRedactionSummary(),
      boundary:
        'When all planned steps pass, the release runner writes this summary first, then runs the generated-artifact redaction verifier so commercial-verification-summary-latest.json and .md are included in the scan. Use the redaction artifact generated after this summary timestamp as the pass/fail evidence for the post-summary scan.',
    },
    postSummaryLaunchReadinessAlignment: postSummaryLaunchReadinessAlignmentSummary(),
    postSummaryLaunchEvidenceRefresh: {
      ...postSummaryLaunchEvidenceRefreshSummary(),
      boundary: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_TOP_LEVEL_BOUNDARY,
    },
    postSummaryFullLocalApprovalPackage: {
      ...fullLocalApprovalPackageSummary(),
      boundary:
        'This verifier reads the approval plan, progress digest, workflow metadata, workflow backlog/results, package scripts, and current commercial summary only. It does not execute accessibility, browser, network, audit, full-local, worker, live, payment, credential, outreach, or owner-held evidence gates.',
    },
    steps,
    evidenceBoundary: VERIFICATION_SUMMARY_BOUNDARY,
    doesNotProveCount: VERIFICATION_SUMMARY_DOES_NOT_PROVE.length,
    doesNotProve: VERIFICATION_SUMMARY_DOES_NOT_PROVE,
  };
}

function renderMarkdown(value) {
  const state = value.commercialReadinessState;
  const releaseGateState = state.releaseGateCoverageSummary;
  const releaseGateCoverageRows = Object.entries(value.releaseGateCoverage)
    .filter(([gateId]) => gateId !== 'boundary')
    .map(
      ([gateId, gate]) =>
        `| ${gateId} | \`${gate.command}\` | ${markdownBool(gate.includedInThisInvocation)} | ${markdownBool(gate.passedInThisInvocation)} | ${gate.boundary || ''} |`,
    )
    .join('\n');
  const releaseGateList = (gateIds = []) =>
    gateIds.length ? gateIds.join(', ') : 'none';
  const sourceAuditTraceRows = (coverage) =>
    (coverage.sourceTrace || [])
      .map(
        (row) =>
          `| ${row.id || ''} | ${row.url || ''} | ${row.status || ''} | ` +
          `${row.expectedTextMatchCount ?? 0}/${row.expectationCount ?? 0} | ` +
          `${row.sourceArtifact || ''} |`,
      )
      .join('\n');
  const releaseGateCoverageStateRows = Object.entries(releaseGateState.gates)
    .map(
      ([gateId, gate]) =>
        `| ${gateId} | \`${gate.command}\` | ${markdownBool(gate.includedInThisInvocation)} | ${markdownBool(gate.passedInThisInvocation)} | ${gate.boundary || ''} |`,
    )
    .join('\n');
  const releaseGateCoverageSourceRows = releaseGateState.sourceTrace
    .map(
      (row) =>
        `| ${row.gateId} | \`${row.command}\` | ${markdownBool(
          row.includedInThisInvocation,
        )} | ${markdownBool(row.passedInThisInvocation)} | ${markdownBool(
          row.optional,
        )} | ${markdownBool(row.separateProofRequired)} | ${row.sourceArtifact} | ${
          row.boundary || ''
        } |`,
    )
    .join('\n');
  const releaseGateCoverageDoesNotProveRows = releaseGateState.doesNotProve
    .map((item) => `| ${item} |`)
    .join('\n');
  const gateRows = state.ownerGateScoreboard.remainingGateIds
    .map((gateId) => `| ${gateId} | open | owner/live evidence required |`)
    .join('\n');
  const ownerGateScoreboardSourceRows = state.ownerGateScoreboard.remainingGateSourceTrace
    .map((row) => {
      const sourceArtifacts = row.sourceArtifacts || {};
      return `| ${row.gateId} | ${row.status} | ${sourceArtifacts.scoreboard} | ${sourceArtifacts.remediationCompletion} | ${sourceArtifacts.remediationExternalGates} | ${sourceArtifacts.closeoutStatus} | ${sourceArtifacts.handoff} | ${sourceArtifacts.completionDrill} |`;
    })
    .join('\n');
  const remediationCompletionSourceRows = state.remediationCompletion.remainingExternalGateSourceTrace
    .map((row) => `| ${row.gateId} | ${row.status} | ${row.sourceArtifact} |`)
    .join('\n');
  const remediationExternalGateSourceRows = state.remediationExternalGates.ownerActionGateSourceTrace
    .map((row) => `| ${row.gateId} | ${row.status} | ${row.sourceBoundary} | ${row.sourceArtifact} |`)
    .join('\n');
  const launchEvidenceBlockerSourceRows = state.launchEvidence.blockerSourceTrace
    .map((row) => {
      const sourceArtifacts = row.sourceArtifacts || {};
      return `| ${row.gateId} | ${row.status} | ${row.severity} | ${sourceArtifacts.launchGap} | ${sourceArtifacts.unresolvedBlocker} | ${sourceArtifacts.remediationCompletion} | ${sourceArtifacts.remediationExternalGates} |`;
    })
    .join('\n');
  const launchEvidenceSummarySourceRows = state.launchEvidenceSummary.sourceTrace
    .map((row) => {
      const sourceArtifactText = Object.values(row.sourceArtifacts).filter(Boolean).join('<br>') || 'none';
      return `| ${row.coverage} | ${row.metricCount} | ${row.sourceArtifactCount} | ${sourceArtifactText} |`;
    })
    .join('\n');
  const requiredOutputTableCountRows = Object.entries(
    state.launchEvidenceSummary.requiredOutputTableCounts,
  )
    .map(([field, count]) => `| ${field} | ${count} |`)
    .join('\n');
  const proofBucketRows = Object.entries(state.proofBucketSummary.countsByBucket)
    .map(([bucketName, count]) => {
      const statusText = Object.entries(state.proofBucketSummary.statusesByBucket[bucketName])
        .map(([status, statusCount]) => `${status}: ${statusCount}`)
        .join(', ');
      return `| ${bucketName} | ${count} | ${statusText} |`;
    })
    .join('\n');
  const proofBucketTraceRows = state.proofBucketSummary.items
    .map(
      (item) =>
        `| ${item.bucket} | ${item.label} | ${item.status} | ${item.source} | ${item.boundary} |`,
    )
    .join('\n');
  const proofBucketSourceRows = state.proofBucketSummary.sourceTrace
    .map(
      (item) =>
        `| ${item.bucket} | ${item.index} | ${item.label} | ${item.status} | ${item.sourceArtifact} | ${item.sourcePath} | ${item.boundary} |`,
    )
    .join('\n');
  const liveCloseoutReadinessCheckRows = state.liveCloseoutReadinessCoverage.checkSourceTrace
    .map(
      (row) =>
        `| ${row.id} | \`${row.passed ? 'yes' : 'no'}\` | ${row.message} | ${row.sourceArtifact} |`,
    )
    .join('\n');
  const liveCloseoutReadinessNextActionRows =
    state.liveCloseoutReadinessCoverage.nextActionSourceTrace
      .map((row) => `| ${row.order} | ${row.action} | ${row.sourceArtifact} |`)
      .join('\n');
  const liveCloseoutReadinessOfficialReferenceRows =
    state.liveCloseoutReadinessCoverage.officialReferenceSourceTrace
      .map(
        (row) =>
          `| ${row.id} | ${row.url} | ${row.appliesTo.join('<br>') || 'none'} | ${row.sourceArtifact} |`,
      )
      .join('\n');
  const ownerActionQueueRows = state.ownerActionQueueSummary.rows
    .map(
      (row) =>
        `| ${row.gateId} | ${row.status} | ${row.track} | ${row.sourceArtifact} | ${row.sourceBoundary} | ${row.ownerPrepCommand} | ${row.nextCommand} | ${row.blockingOwnerActionCount} | ${row.closeoutFailureDetailCount} |`,
    )
    .join('\n');
  const ownerActionBoundaryRows = state.ownerActionQueueSummary.rows
    .map(
      (row) =>
        `| ${row.gateId} | ${row.riskIfSkipped} | ${row.doesNotProve.join('<br>')} |`,
    )
    .join('\n');
  const ownerActionSourceRows = state.ownerActionQueueSummary.sourceTrace
    .map((row) => {
      const sourceArtifacts = row.sourceArtifacts || {};
      return `| ${row.gateId} | ${sourceArtifacts.remediationExternalGates} | ${sourceArtifacts.closeoutStatus} | ${sourceArtifacts.handoff} | ${sourceArtifacts.completionDrill} |`;
    })
    .join('\n');
  const ownerOperationalAccessSourceRows =
    state.ownerEvidenceExecutionSummary.operationalAccessPrerequisiteSummary.sourceTrace
      .map((row) => {
        const sourceArtifacts = row.sourceArtifacts || {};
        return `| ${row.id} | ${sourceArtifacts.handoff} | ${sourceArtifacts.completionDrill} | ${sourceArtifacts.liveCloseoutReadiness} | ${sourceArtifacts.blockingChecks.join('<br>')} |`;
      })
      .join('\n');
  const ownerCloseoutFailedStepRows =
    state.ownerEvidenceExecutionSummary.closeoutCoverage.failedStepSourceTrace
      .map((step) => `| ${step.id} | ${step.status} | ${step.command} | ${step.sourceArtifact} |`)
      .join('\n');
  const ownerCloseoutNextCommandRows =
    state.ownerEvidenceExecutionSummary.closeoutCoverage.nextCommandSourceTrace
      .map(
        (row) =>
          `| ${row.key} | ${row.commands.join('<br>') || 'none'} | ${row.commandCount} | ${row.sourceArtifact} |`,
      )
      .join('\n');
  const ownerCloseoutStatusArtifactRows =
    state.ownerEvidenceExecutionSummary.closeoutCoverage.statusArtifactSourceTrace
      .map((row) => `| ${row.key} | ${row.artifactPath} | ${row.sourceArtifact} |`)
      .join('\n');
  const ownerLocalSafetySourceRows =
    state.ownerEvidenceExecutionSummary.localSafetyStatusSummary.sourceTrace
      .map(
        (row) =>
          `| ${row.key} | ${row.value} | ${row.sourceArtifact} | ${row.handoffSourceArtifact} | ${row.completionDrillSourceArtifact} |`,
      )
      .join('\n');
  const ownerHandoffCommandSourceRows =
    state.ownerEvidenceExecutionSummary.handoffCoverage.commandSequenceSourceTrace
      .map((row) => `| ${row.order} | ${row.command} | ${row.sourceArtifact} |`)
      .join('\n');
  const ownerCompletionCommandSourceRows =
    state.ownerEvidenceExecutionSummary.completionDrillCoverage.recommendedCommandOrderSourceTrace
      .map((row) => `| ${row.order} | ${row.command} | ${row.sourceArtifact} |`)
      .join('\n');
  const postSummaryArtifactRedactionDoesNotProveRows =
    state.postSummaryArtifactRedactionSummary.doesNotProve
      .map((item) => `| ${item} |`)
      .join('\n');
  const postSummaryCommandSourceRows = (sourceTrace = []) =>
    sourceTrace
      .map(
        (row) =>
          `| ${row.key || ''} | ${row.value || ''} | ${row.sourceArtifact || ''} | ${
            row.boundary || ''
          } |`,
      )
      .join('\n');
  const postSummaryArtifactRedactionSourceRows = postSummaryCommandSourceRows(
    state.postSummaryArtifactRedactionSummary.sourceTrace,
  );
  const postSummaryLaunchReadinessAlignmentSourceRows = postSummaryCommandSourceRows(
    state.postSummaryLaunchReadinessAlignmentSummary.sourceTrace,
  );
  const topLevelPostSummaryLaunchReadinessAlignmentSourceRows = postSummaryCommandSourceRows(
    value.postSummaryLaunchReadinessAlignment.sourceTrace,
  );
  const postSummaryLaunchEvidenceRefreshSourceRows = postSummaryCommandSourceRows(
    state.postSummaryLaunchEvidenceRefreshSummary.sourceTrace,
  );
  const fullLocalApprovalSourceRows = postSummaryCommandSourceRows(
    state.fullLocalApprovalPackageSummary.sourceTrace,
  );
  const postSummaryLaunchReadinessAlignmentDoesNotProveRows =
    state.postSummaryLaunchReadinessAlignmentSummary.doesNotProve
      .map((item) => `| ${item} |`)
      .join('\n');
  const topLevelPostSummaryLaunchReadinessAlignmentDoesNotProveRows =
    value.postSummaryLaunchReadinessAlignment.doesNotProve
      .map((item) => `| ${item} |`)
      .join('\n');
  const postSummaryLaunchEvidenceRefreshDoesNotProveRows =
    state.postSummaryLaunchEvidenceRefreshSummary.doesNotProve
      .map((item) => `| ${item} |`)
      .join('\n');
  const fullLocalApprovalCommandRows = Object.entries(
    state.fullLocalApprovalPackageSummary.optionalGateCommands,
  )
    .map(([gateId, command]) => `| ${gateId} | \`${command}\` |`)
    .join('\n');
  const fullLocalApprovalRequiredRows = state.fullLocalApprovalPackageSummary.approvalRequiredBefore
    .map((gateId) => `| ${gateId} | approval required |`)
    .join('\n');
  return `# Commercial Verification Summary

## Counts

| Field | Value |
| --- | ---: |
| Planned steps | ${value.plannedStepCount} |
| Step result rows | ${value.stepCount} |
| Completed steps | ${value.completedStepCount} |
| Passed steps | ${value.passedStepCount} |
| Failed steps | ${value.failedStepCount} |
| Failed step IDs | ${value.failedSteps.length} |
| Timed-out steps | ${value.timedOutStepCount} |
| Does-not-prove boundaries | ${value.doesNotProveCount} |

## Release Gate Coverage

| Gate | Command | Included in this invocation | Passed in this invocation | Boundary |
| --- | --- | --- | --- | --- |
${releaseGateCoverageRows}

${value.releaseGateCoverage.boundary}

## Commercial Readiness State

| Field | Value |
| --- | --- |
| Launch decision | \`${state.launchDecision}\` |
| Expected launch decision | \`${state.expectedLaunchDecision}\` |
| Alignment status | \`${state.alignmentStatus}\` |
| State source artifact | \`${state.sourceArtifact}\` |
| State source artifacts | ${state.sourceArtifactCount} |
| Release gate coverage status | \`${releaseGateState.status}\` |
| Release gates included | ${releaseGateState.includedGateCount} |
| Release gates not included | ${releaseGateState.notIncludedGateCount} |
| Release gates requiring separate proof | ${releaseGateState.requiredSeparateProofGateIds.length} |
| Release gate does-not-prove boundaries | ${releaseGateState.doesNotProveCount} |
| Release gate source trace rows | ${releaseGateState.sourceTraceCount} |
| Post-summary redaction status | \`${state.postSummaryArtifactRedactionSummary.status}\` |
| Post-summary redaction included | ${markdownBool(state.postSummaryArtifactRedactionSummary.includedInThisInvocation)} |
| Post-summary redaction artifacts | ${Object.keys(state.postSummaryArtifactRedactionSummary.resultArtifacts).length} |
| Post-summary redaction does-not-prove boundaries | ${state.postSummaryArtifactRedactionSummary.doesNotProveCount} |
| Post-summary launch-readiness alignment status | \`${state.postSummaryLaunchReadinessAlignmentSummary.status}\` |
| Post-summary launch-readiness alignment included | ${markdownBool(state.postSummaryLaunchReadinessAlignmentSummary.includedInThisInvocation)} |
| Post-summary launch-readiness alignment fixture | \`${state.postSummaryLaunchReadinessAlignmentSummary.fixtureVerifier.command}\` |
| Post-summary launch-readiness alignment does-not-prove boundaries | ${state.postSummaryLaunchReadinessAlignmentSummary.doesNotProveCount} |
| Post-summary launch evidence refresh status | \`${state.postSummaryLaunchEvidenceRefreshSummary.status}\` |
| Post-summary launch evidence refresh included | ${markdownBool(state.postSummaryLaunchEvidenceRefreshSummary.includedInThisInvocation)} |
| Post-summary launch evidence refresh artifacts | ${Object.keys(state.postSummaryLaunchEvidenceRefreshSummary.resultArtifacts).length} |
| Post-summary launch evidence refresh does-not-prove boundaries | ${state.postSummaryLaunchEvidenceRefreshSummary.doesNotProveCount} |
| Full-local approval status | \`${state.fullLocalApprovalPackageSummary.status}\` |
| Full-local execution approved | ${markdownBool(state.fullLocalApprovalPackageSummary.executionApproved)} |
| Full-local optional commands | ${Object.keys(state.fullLocalApprovalPackageSummary.optionalGateCommands).length} |
| Remaining owner/live gate source trace rows | ${state.ownerGateScoreboard.remainingGateSourceTraceCount} |
| Remediation completion source trace rows | ${state.remediationCompletion.remainingExternalGateSourceTraceCount} |
| Remediation external gate source trace rows | ${state.remediationExternalGates.ownerActionGateSourceTraceCount} |
| Launch evidence summary source trace rows | ${state.launchEvidenceSummary.sourceTraceCount} |
| Launch proof-bucket source trace rows | ${state.proofBucketSummary.sourceTraceCount} |

### Remaining Owner/Live Gates

| Gate | Status | Boundary |
| --- | --- | --- |
${gateRows || '| none | closed | no remaining owner/live gates in the current repo-generated ledgers |'}

#### Owner Gate Scoreboard Source Trace

| Gate | Status | Scoreboard | Remediation completion | Remediation gates | Closeout queue | Handoff | Completion drill |
| --- | --- | --- | --- | --- | --- | --- | --- |
${ownerGateScoreboardSourceRows || '| none | closed | none | none | none | none | none | none |'}

${state.ownerGateScoreboard.sourceTraceBoundary}

#### Remediation Completion Source Trace

| Gate | Status | Source artifact |
| --- | --- | --- |
${remediationCompletionSourceRows || '| none | closed | none |'}

${state.remediationCompletion.sourceTraceBoundary}

${state.remediationCompletion.evidenceBoundary}

#### Remediation External Gates Source Trace

| Gate | Status | Source boundary | Source artifact |
| --- | --- | --- | --- |
${remediationExternalGateSourceRows || '| none | closed | none | none |'}

${state.remediationExternalGates.sourceTraceBoundary}

${state.remediationExternalGates.evidenceBoundary}

### Release Gate Coverage State Summary

| Field | Value |
| --- | --- |
| Source artifact | \`${releaseGateState.sourceArtifact}\` |
| Status | \`${releaseGateState.status}\` |
| Gate count | ${releaseGateState.gateCount} |
| Included gates | ${releaseGateList(releaseGateState.includedGateIds)} |
| Not included gates | ${releaseGateList(releaseGateState.notIncludedGateIds)} |
| Passed gates | ${releaseGateList(releaseGateState.passedGateIds)} |
| Separate proof required gates | ${releaseGateList(releaseGateState.requiredSeparateProofGateIds)} |
| Optional gates not included | ${releaseGateList(releaseGateState.optionalNotIncludedGateIds)} |
| Release gate state does-not-prove boundaries | ${releaseGateState.doesNotProveCount} |

#### Release Gate Coverage State Details

| Gate | Command | Included in this invocation | Passed in this invocation | Boundary |
| --- | --- | --- | --- | --- |
${releaseGateCoverageStateRows}

#### Release Gate Coverage Source Trace

| Gate | Command | Included | Passed | Optional | Separate proof required | Source artifact | Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
${releaseGateCoverageSourceRows}

${releaseGateState.sourceTraceBoundary}

#### Release Gate Coverage State Boundary

${releaseGateState.boundary}

#### Release Gate Coverage State Does Not Prove

| Boundary |
| --- |
${releaseGateCoverageDoesNotProveRows}

### Launch-Readiness Source Artifacts

${LAUNCH_EVIDENCE_JSON}
${COMMERCIAL_ARTIFACT_REDACTION_JSON}
${LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON}
${COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON}
${LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON}
${LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON}
${LIVE_CLOSEOUT_READINESS_JSON}
${OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON}
${OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON}
${OWNER_EVIDENCE_HANDOFF_JSON}
${OWNER_EVIDENCE_COMPLETION_DRILL_JSON}
${REMEDIATION_COMPLETION_AUDIT_JSON}
${REMEDIATION_EXTERNAL_GATES_JSON}
${FULL_LOCAL_APPROVAL_PACKAGE_SOURCE_ARTIFACT}

${state.evidenceBoundary}

### Post-Summary Artifact Redaction Summary

| Field | Value |
| --- | --- |
| Source artifact | \`${state.postSummaryArtifactRedactionSummary.sourceArtifact}\` |
| Status | \`${state.postSummaryArtifactRedactionSummary.status}\` |
| Command | \`${state.postSummaryArtifactRedactionSummary.command}\` |
| Execution order | \`${state.postSummaryArtifactRedactionSummary.executionOrder}\` |
| Included in this invocation | ${markdownBool(state.postSummaryArtifactRedactionSummary.includedInThisInvocation)} |
| Result JSON | \`${state.postSummaryArtifactRedactionSummary.resultArtifacts.json}\` |
| Result Markdown | \`${state.postSummaryArtifactRedactionSummary.resultArtifacts.markdown}\` |
| Alignment verifier | \`${state.postSummaryArtifactRedactionSummary.alignmentVerifier.command}\` |
| Fixture verifier | \`${state.postSummaryArtifactRedactionSummary.fixtureVerifier.command}\` |
| Source trace rows | ${state.postSummaryArtifactRedactionSummary.sourceTraceCount} |
| Does-not-prove boundaries | ${state.postSummaryArtifactRedactionSummary.doesNotProveCount} |

#### Post-Summary Artifact Redaction Source Trace

| Key | Value | Source artifact | Boundary |
| --- | --- | --- | --- |
${postSummaryArtifactRedactionSourceRows}

${state.postSummaryArtifactRedactionSummary.sourceTraceBoundary}

#### Post-Summary Artifact Redaction Boundary

${state.postSummaryArtifactRedactionSummary.boundary}

#### Post-Summary Artifact Redaction Does Not Prove

| Boundary |
| --- |
${postSummaryArtifactRedactionDoesNotProveRows}

### Post-Summary Launch-Readiness Alignment State Summary

| Field | Value |
| --- | --- |
| Source artifact | \`${state.postSummaryLaunchReadinessAlignmentSummary.sourceArtifact}\` |
| Status | \`${state.postSummaryLaunchReadinessAlignmentSummary.status}\` |
| Command | \`${state.postSummaryLaunchReadinessAlignmentSummary.command}\` |
| Execution order | \`${state.postSummaryLaunchReadinessAlignmentSummary.executionOrder}\` |
| Included in this invocation | ${markdownBool(state.postSummaryLaunchReadinessAlignmentSummary.includedInThisInvocation)} |
| Fixture verifier | \`${state.postSummaryLaunchReadinessAlignmentSummary.fixtureVerifier.command}\` |
| Fixture execution order | \`${state.postSummaryLaunchReadinessAlignmentSummary.fixtureVerifier.executionOrder}\` |
| Source trace rows | ${state.postSummaryLaunchReadinessAlignmentSummary.sourceTraceCount} |
| Does-not-prove boundaries | ${state.postSummaryLaunchReadinessAlignmentSummary.doesNotProveCount} |

#### Post-Summary Launch-Readiness Alignment Source Trace

| Key | Value | Source artifact | Boundary |
| --- | --- | --- | --- |
${postSummaryLaunchReadinessAlignmentSourceRows}

${state.postSummaryLaunchReadinessAlignmentSummary.sourceTraceBoundary}

#### Post-Summary Launch-Readiness Alignment Boundary

${state.postSummaryLaunchReadinessAlignmentSummary.boundary}

#### Post-Summary Launch-Readiness Alignment Fixture Boundary

${state.postSummaryLaunchReadinessAlignmentSummary.fixtureVerifier.boundary}

#### Post-Summary Launch-Readiness Alignment Does Not Prove

| Boundary |
| --- |
${postSummaryLaunchReadinessAlignmentDoesNotProveRows}

### Post-Summary Launch Evidence Refresh State Summary

| Field | Value |
| --- | --- |
| Source artifact | \`${state.postSummaryLaunchEvidenceRefreshSummary.sourceArtifact}\` |
| Status | \`${state.postSummaryLaunchEvidenceRefreshSummary.status}\` |
| Command | \`${state.postSummaryLaunchEvidenceRefreshSummary.command}\` |
| Execution order | \`${state.postSummaryLaunchEvidenceRefreshSummary.executionOrder}\` |
| Included in this invocation | ${markdownBool(state.postSummaryLaunchEvidenceRefreshSummary.includedInThisInvocation)} |
| Result JSON | \`${state.postSummaryLaunchEvidenceRefreshSummary.resultArtifacts.json}\` |
| Result Markdown | \`${state.postSummaryLaunchEvidenceRefreshSummary.resultArtifacts.markdown}\` |
| Final summary rewrite required | ${markdownBool(state.postSummaryLaunchEvidenceRefreshSummary.finalSummaryRewrite.required)} |
| Final summary rewrite purpose | ${state.postSummaryLaunchEvidenceRefreshSummary.finalSummaryRewrite.purpose} |
| Source trace rows | ${state.postSummaryLaunchEvidenceRefreshSummary.sourceTraceCount} |
| Does-not-prove boundaries | ${state.postSummaryLaunchEvidenceRefreshSummary.doesNotProveCount} |

#### Post-Summary Launch Evidence Refresh Source Trace

| Key | Value | Source artifact | Boundary |
| --- | --- | --- | --- |
${postSummaryLaunchEvidenceRefreshSourceRows}

${state.postSummaryLaunchEvidenceRefreshSummary.sourceTraceBoundary}

#### Post-Summary Launch Evidence Refresh Boundary

${state.postSummaryLaunchEvidenceRefreshSummary.boundary}

#### Post-Summary Launch Evidence Refresh Does Not Prove

| Boundary |
| --- |
${postSummaryLaunchEvidenceRefreshDoesNotProveRows}

### Full-Local Approval Package Summary

| Field | Value |
| --- | --- |
| Source artifact | \`${state.fullLocalApprovalPackageSummary.sourceArtifact}\` |
| Status | \`${state.fullLocalApprovalPackageSummary.status}\` |
| Command | \`${state.fullLocalApprovalPackageSummary.command}\` |
| Execution order | \`${state.fullLocalApprovalPackageSummary.executionOrder}\` |
| Included in this invocation | ${markdownBool(state.fullLocalApprovalPackageSummary.includedInThisInvocation)} |
| Execution approved | ${markdownBool(state.fullLocalApprovalPackageSummary.executionApproved)} |
| Fixture verifier | \`${state.fullLocalApprovalPackageSummary.fixtureVerifier.command}\` |
| Source trace rows | ${state.fullLocalApprovalPackageSummary.sourceTraceCount} |
| Does-not-prove boundaries | ${state.fullLocalApprovalPackageSummary.doesNotProveCount} |

#### Full-Local Approval Source Trace

| Key | Value | Source artifact | Boundary |
| --- | --- | --- | --- |
${fullLocalApprovalSourceRows}

${state.fullLocalApprovalPackageSummary.sourceTraceBoundary}

#### Full-Local Approval Command Trace

| Optional gate | Command |
| --- | --- |
${fullLocalApprovalCommandRows}

#### Full-Local Approval Required Trace

| Gate | Status |
| --- | --- |
${fullLocalApprovalRequiredRows}

${state.fullLocalApprovalPackageSummary.boundary}

### Launch Evidence Required Output Coverage

| Output | Count |
| --- | ---: |
| Gaps | ${state.launchEvidenceSummary.deliverableCounts.gapCount} |
| Pain points | ${state.launchEvidenceSummary.deliverableCounts.painPointCount} |
| Target customers | ${state.launchEvidenceSummary.deliverableCounts.targetCustomerCount} |
| Competitor/substitutes | ${state.launchEvidenceSummary.deliverableCounts.competitorSubstituteCount} |
| Launch evidence summary source trace rows | ${state.launchEvidenceSummary.sourceTraceCount} |
| Launch blocker source trace rows | ${state.launchEvidence.blockerSourceTraceCount} |

#### Required Output Table Counts

| Output | Count |
| --- | ---: |
${requiredOutputTableCountRows}

#### Launch Score

| Score | Value |
| --- | ---: |
| Security | ${state.launchEvidenceSummary.scores.security} |
| Readiness | ${state.launchEvidenceSummary.scores.readiness} |
| Sellability | ${state.launchEvidenceSummary.scores.sellability} |
| Evidence | ${state.launchEvidenceSummary.scores.evidence} |
| Overall | ${state.launchEvidenceSummary.scores.overall} |

#### Outreach And Fix-Report Coverage

| Field | Value |
| --- | --- |
| CRM rows | ${state.launchEvidenceSummary.outreachCoverage.crmExport.rowCount} |
| Unresolved blockers | ${state.launchEvidenceSummary.fixReportCoverage.unresolvedBlockerCount} |

${state.launchEvidenceSummary.evidenceBoundary}

#### Launch Evidence Summary Source Trace

| Coverage | Metric count | Source artifacts | Sources |
| --- | ---: | ---: | --- |
${launchEvidenceSummarySourceRows}

${state.launchEvidenceSummary.sourceTraceBoundary}

#### Launch Evidence Blocker Source Trace

| Gate | Status | Severity | Launch gap | Unresolved blocker | Remediation completion | Remediation gates |
| --- | --- | --- | --- | --- | --- | --- |
${launchEvidenceBlockerSourceRows || '| none | closed | none | none | none | none | none |'}

${state.launchEvidence.sourceTraceBoundary}

${state.launchEvidence.evidenceBoundary}

### Launch Proof Bucket Coverage

| Field | Value |
| --- | ---: |
| Buckets | ${state.proofBucketSummary.bucketCount} |
| Items | ${state.proofBucketSummary.itemCount} |
| Source paths | ${state.proofBucketSummary.sourceCount} |
| Hosted/live items | ${state.proofBucketSummary.hostedLiveItemCount} |
| Local items | ${state.proofBucketSummary.localItemCount} |
| Repo artifact items | ${state.proofBucketSummary.repoArtifactItemCount} |
| Candidate/shadow items | ${state.proofBucketSummary.candidateShadowItemCount} |
| Roadmap items | ${state.proofBucketSummary.roadmapItemCount} |
| Boundary-bearing items | ${state.proofBucketSummary.boundaryCount} |
| Source trace rows | ${state.proofBucketSummary.sourceTraceCount} |

| Bucket | Items | Status counts |
| --- | ---: | --- |
${proofBucketRows}

#### Launch Proof Bucket Trace

| Bucket | Label | Status | Source | Boundary |
| --- | --- | --- | --- | --- |
${proofBucketTraceRows}

#### Launch Proof Bucket Source Trace

| Bucket | Index | Label | Status | Source artifact | Source path | Boundary |
| --- | ---: | --- | --- | --- | --- | --- |
${proofBucketSourceRows}

${state.proofBucketSummary.sourceTraceBoundary}

${state.proofBucketSummary.evidenceBoundary}

### Launch Source Audit Coverage

| Field | Value |
| --- | --- |
| Artifact | \`${state.launchSourceAuditCoverage.artifact}\` |
| Network fetch | \`${state.launchSourceAuditCoverage.networkFetch ? 'yes' : 'no'}\` |
| All passed | \`${state.launchSourceAuditCoverage.allPassed ? 'yes' : 'no'}\` |
| Source URLs | ${state.launchSourceAuditCoverage.sourceCount} |
| Passed sources | ${state.launchSourceAuditCoverage.passedCount} |
| Failed sources | ${state.launchSourceAuditCoverage.failedCount} |
| Missing expectations | ${state.launchSourceAuditCoverage.missingExpectationCount} |
| Usage contexts | ${state.launchSourceAuditCoverage.usageContextCount} |
| Expectation checks | ${state.launchSourceAuditCoverage.expectationCheckCount} |
| Expected-text matches | ${state.launchSourceAuditCoverage.expectedTextMatchCount} |
| Fetched sources | ${state.launchSourceAuditCoverage.fetchedSourceCount} |
| Source trace rows | ${state.launchSourceAuditCoverage.sourceTraceCount} |

#### Launch Source Trace

| Source | URL | Status | Expected-text matches | Source artifact |
| --- | --- | --- | ---: | --- |
${sourceAuditTraceRows(state.launchSourceAuditCoverage)}

${state.launchSourceAuditCoverage.sourceTraceBoundary}

${state.launchSourceAuditCoverage.boundary}

### Commercial Evidence Intake Source Audit Coverage

| Field | Value |
| --- | --- |
| Artifact | \`${state.commercialEvidenceIntakeSourceAuditCoverage.artifact}\` |
| Packet | \`${state.commercialEvidenceIntakeSourceAuditCoverage.packetPath}\` |
| Network fetch | \`${state.commercialEvidenceIntakeSourceAuditCoverage.networkFetch ? 'yes' : 'no'}\` |
| All passed | \`${state.commercialEvidenceIntakeSourceAuditCoverage.allPassed ? 'yes' : 'no'}\` |
| FTC references | ${state.commercialEvidenceIntakeSourceAuditCoverage.sourceCount} |
| Passed references | ${state.commercialEvidenceIntakeSourceAuditCoverage.passedCount} |
| Failed references | ${state.commercialEvidenceIntakeSourceAuditCoverage.failedCount} |
| Missing expectations | ${state.commercialEvidenceIntakeSourceAuditCoverage.missingExpectationCount} |
| Unexpected references | ${state.commercialEvidenceIntakeSourceAuditCoverage.unexpectedReferenceCount} |
| Applies-to entries | ${state.commercialEvidenceIntakeSourceAuditCoverage.appliesToCount} |
| Expectation checks | ${state.commercialEvidenceIntakeSourceAuditCoverage.expectationCheckCount} |
| Expected-text matches | ${state.commercialEvidenceIntakeSourceAuditCoverage.expectedTextMatchCount} |
| Fetched references | ${state.commercialEvidenceIntakeSourceAuditCoverage.fetchedSourceCount} |
| Source trace rows | ${state.commercialEvidenceIntakeSourceAuditCoverage.sourceTraceCount} |

#### Commercial Evidence Intake Source Trace

| Source | URL | Status | Expected-text matches | Source artifact |
| --- | --- | --- | ---: | --- |
${sourceAuditTraceRows(state.commercialEvidenceIntakeSourceAuditCoverage)}

${state.commercialEvidenceIntakeSourceAuditCoverage.sourceTraceBoundary}

${state.commercialEvidenceIntakeSourceAuditCoverage.boundary}

### Live Proof Run Packet Source Audit Coverage

| Field | Value |
| --- | --- |
| Artifact | \`${state.liveProofRunPacketSourceAuditCoverage.artifact}\` |
| Packet | \`${state.liveProofRunPacketSourceAuditCoverage.packetPath}\` |
| Network fetch | \`${state.liveProofRunPacketSourceAuditCoverage.networkFetch ? 'yes' : 'no'}\` |
| All passed | \`${state.liveProofRunPacketSourceAuditCoverage.allPassed ? 'yes' : 'no'}\` |
| Stripe/Supabase/GitHub references | ${state.liveProofRunPacketSourceAuditCoverage.sourceCount} |
| Passed references | ${state.liveProofRunPacketSourceAuditCoverage.passedCount} |
| Failed references | ${state.liveProofRunPacketSourceAuditCoverage.failedCount} |
| Missing expectations | ${state.liveProofRunPacketSourceAuditCoverage.missingExpectationCount} |
| Unexpected references | ${state.liveProofRunPacketSourceAuditCoverage.unexpectedReferenceCount} |
| Applies-to entries | ${state.liveProofRunPacketSourceAuditCoverage.appliesToCount} |
| Expectation checks | ${state.liveProofRunPacketSourceAuditCoverage.expectationCheckCount} |
| Expected-text matches | ${state.liveProofRunPacketSourceAuditCoverage.expectedTextMatchCount} |
| Fetched references | ${state.liveProofRunPacketSourceAuditCoverage.fetchedSourceCount} |
| Source trace rows | ${state.liveProofRunPacketSourceAuditCoverage.sourceTraceCount} |

#### Live Proof Run Packet Source Trace

| Source | URL | Status | Expected-text matches | Source artifact |
| --- | --- | --- | ---: | --- |
${sourceAuditTraceRows(state.liveProofRunPacketSourceAuditCoverage)}

${state.liveProofRunPacketSourceAuditCoverage.sourceTraceBoundary}

${state.liveProofRunPacketSourceAuditCoverage.boundary}

### Live Closeout Access Source Audit Coverage

| Field | Value |
| --- | --- |
| Artifact | \`${state.liveCloseoutAccessSourceAuditCoverage.artifact}\` |
| Readiness artifact | \`${state.liveCloseoutAccessSourceAuditCoverage.readinessPath}\` |
| Network fetch | \`${state.liveCloseoutAccessSourceAuditCoverage.networkFetch ? 'yes' : 'no'}\` |
| All passed | \`${state.liveCloseoutAccessSourceAuditCoverage.allPassed ? 'yes' : 'no'}\` |
| Supabase/GitHub access references | ${state.liveCloseoutAccessSourceAuditCoverage.sourceCount} |
| Passed references | ${state.liveCloseoutAccessSourceAuditCoverage.passedCount} |
| Failed references | ${state.liveCloseoutAccessSourceAuditCoverage.failedCount} |
| Missing expectations | ${state.liveCloseoutAccessSourceAuditCoverage.missingExpectationCount} |
| Unexpected references | ${state.liveCloseoutAccessSourceAuditCoverage.unexpectedReferenceCount} |
| Applies-to entries | ${state.liveCloseoutAccessSourceAuditCoverage.appliesToCount} |
| Expectation checks | ${state.liveCloseoutAccessSourceAuditCoverage.expectationCheckCount} |
| Expected-text matches | ${state.liveCloseoutAccessSourceAuditCoverage.expectedTextMatchCount} |
| Fetched references | ${state.liveCloseoutAccessSourceAuditCoverage.fetchedSourceCount} |
| Source trace rows | ${state.liveCloseoutAccessSourceAuditCoverage.sourceTraceCount} |

#### Live Closeout Access Source Trace

| Source | URL | Status | Expected-text matches | Source artifact |
| --- | --- | --- | ---: | --- |
${sourceAuditTraceRows(state.liveCloseoutAccessSourceAuditCoverage)}

${state.liveCloseoutAccessSourceAuditCoverage.sourceTraceBoundary}

${state.liveCloseoutAccessSourceAuditCoverage.boundary}

### Live Closeout Readiness Status

| Field | Value |
| --- | --- |
| Artifact | \`${state.liveCloseoutReadinessCoverage.artifact}\` |
| Status | \`${state.liveCloseoutReadinessCoverage.status}\` |
| OK | \`${state.liveCloseoutReadinessCoverage.ok ? 'yes' : 'no'}\` |
| Allow incomplete | \`${state.liveCloseoutReadinessCoverage.allowIncomplete ? 'yes' : 'no'}\` |
| Target project ref | \`${state.liveCloseoutReadinessCoverage.targetProjectRef}\` |
| Check count | ${state.liveCloseoutReadinessCoverage.checkCount} |
| Passed checks | ${state.liveCloseoutReadinessCoverage.passedCheckCount} |
| Failed checks | ${state.liveCloseoutReadinessCoverage.failedCheckCount} |
| Failed check IDs | ${state.liveCloseoutReadinessCoverage.failedCheckIds.join(', ') || 'none'} |
| GitHub required secret names present | ${state.liveCloseoutReadinessCoverage.githubSecrets.presentRequiredSecretNameCount} |
| GitHub missing required secret names | ${state.liveCloseoutReadinessCoverage.githubSecrets.missingRequiredSecretNameCount} |
| Supabase project list available | \`${state.liveCloseoutReadinessCoverage.supabaseAccess.projectsListAvailable ? 'yes' : 'no'}\` |
| Supabase target project visible | \`${state.liveCloseoutReadinessCoverage.supabaseAccess.targetProjectVisible ? 'yes' : 'no'}\` |
| Supabase functions API accessible | \`${state.liveCloseoutReadinessCoverage.supabaseAccess.functionsApiAccessible ? 'yes' : 'no'}\` |
| Mutates external state | \`${state.liveCloseoutReadinessCoverage.mutatesExternalState ? 'yes' : 'no'}\` |
| Prints secret values | \`${state.liveCloseoutReadinessCoverage.printsSecretValues ? 'yes' : 'no'}\` |
| Official references | ${state.liveCloseoutReadinessCoverage.officialReferenceCount} |
| Next actions | ${state.liveCloseoutReadinessCoverage.nextActionCount} |
| Does-not-prove boundaries | ${state.liveCloseoutReadinessCoverage.doesNotProveCount} |
| Check source trace rows | ${state.liveCloseoutReadinessCoverage.checkSourceTraceCount} |
| Failed check source trace rows | ${state.liveCloseoutReadinessCoverage.failedCheckSourceTraceCount} |
| Next action source trace rows | ${state.liveCloseoutReadinessCoverage.nextActionSourceTraceCount} |
| Official reference source trace rows | ${state.liveCloseoutReadinessCoverage.officialReferenceSourceTraceCount} |

#### Live Closeout Readiness Check Trace

| Check | Passed | Message | Source artifact |
| --- | --- | --- | --- |
${liveCloseoutReadinessCheckRows}

#### Live Closeout Readiness Next Action Source Trace

| Order | Next action | Source artifact |
| ---: | --- | --- |
${liveCloseoutReadinessNextActionRows}

#### Live Closeout Readiness Official Reference Source Trace

| Reference | URL | Applies to | Source artifact |
| --- | --- | --- | --- |
${liveCloseoutReadinessOfficialReferenceRows}

${state.liveCloseoutReadinessCoverage.sourceTraceBoundary}

${state.liveCloseoutReadinessCoverage.boundary}

### Manual WCAG Review Packet Source Audit Coverage

| Field | Value |
| --- | --- |
| Artifact | \`${state.manualWcagReviewPacketSourceAuditCoverage.artifact}\` |
| Packet | \`${state.manualWcagReviewPacketSourceAuditCoverage.packetPath}\` |
| Network fetch | \`${state.manualWcagReviewPacketSourceAuditCoverage.networkFetch ? 'yes' : 'no'}\` |
| All passed | \`${state.manualWcagReviewPacketSourceAuditCoverage.allPassed ? 'yes' : 'no'}\` |
| W3C/WAI references | ${state.manualWcagReviewPacketSourceAuditCoverage.sourceCount} |
| Passed references | ${state.manualWcagReviewPacketSourceAuditCoverage.passedCount} |
| Failed references | ${state.manualWcagReviewPacketSourceAuditCoverage.failedCount} |
| Missing expectations | ${state.manualWcagReviewPacketSourceAuditCoverage.missingExpectationCount} |
| Unexpected references | ${state.manualWcagReviewPacketSourceAuditCoverage.unexpectedReferenceCount} |
| Checkpoint references | ${state.manualWcagReviewPacketSourceAuditCoverage.checkpointReferenceCount} |
| Expectation checks | ${state.manualWcagReviewPacketSourceAuditCoverage.expectationCheckCount} |
| Expected-text matches | ${state.manualWcagReviewPacketSourceAuditCoverage.expectedTextMatchCount} |
| Fetched references | ${state.manualWcagReviewPacketSourceAuditCoverage.fetchedSourceCount} |
| Source trace rows | ${state.manualWcagReviewPacketSourceAuditCoverage.sourceTraceCount} |

#### Manual WCAG Review Packet Source Trace

| Source | URL | Status | Expected-text matches | Source artifact |
| --- | --- | --- | ---: | --- |
${sourceAuditTraceRows(state.manualWcagReviewPacketSourceAuditCoverage)}

${state.manualWcagReviewPacketSourceAuditCoverage.sourceTraceBoundary}

${state.manualWcagReviewPacketSourceAuditCoverage.boundary}

### Owner Evidence Completion Drill Source Audit Coverage

| Field | Value |
| --- | --- |
| Artifact | \`${state.ownerEvidenceCompletionDrillSourceAuditCoverage.artifact}\` |
| Drill | \`${state.ownerEvidenceCompletionDrillSourceAuditCoverage.drillPath}\` |
| Network fetch | \`${state.ownerEvidenceCompletionDrillSourceAuditCoverage.networkFetch ? 'yes' : 'no'}\` |
| All passed | \`${state.ownerEvidenceCompletionDrillSourceAuditCoverage.allPassed ? 'yes' : 'no'}\` |
| Official references | ${state.ownerEvidenceCompletionDrillSourceAuditCoverage.sourceCount} |
| Passed references | ${state.ownerEvidenceCompletionDrillSourceAuditCoverage.passedCount} |
| Failed references | ${state.ownerEvidenceCompletionDrillSourceAuditCoverage.failedCount} |
| Missing expectations | ${state.ownerEvidenceCompletionDrillSourceAuditCoverage.missingExpectationCount} |
| Unexpected references | ${state.ownerEvidenceCompletionDrillSourceAuditCoverage.unexpectedReferenceCount} |
| Top-level URL mismatch | \`${state.ownerEvidenceCompletionDrillSourceAuditCoverage.topLevelUrlMismatch ? 'yes' : 'no'}\` |
| Expectation checks | ${state.ownerEvidenceCompletionDrillSourceAuditCoverage.expectationCheckCount} |
| Expected-text matches | ${state.ownerEvidenceCompletionDrillSourceAuditCoverage.expectedTextMatchCount} |
| Fetched references | ${state.ownerEvidenceCompletionDrillSourceAuditCoverage.fetchedSourceCount} |
| Source trace rows | ${state.ownerEvidenceCompletionDrillSourceAuditCoverage.sourceTraceCount} |

#### Owner Evidence Completion Drill Source Trace

| Source | URL | Status | Expected-text matches | Source artifact |
| --- | --- | --- | ---: | --- |
${sourceAuditTraceRows(state.ownerEvidenceCompletionDrillSourceAuditCoverage)}

${state.ownerEvidenceCompletionDrillSourceAuditCoverage.sourceTraceBoundary}

${state.ownerEvidenceCompletionDrillSourceAuditCoverage.boundary}

### Owner Evidence Execution Coverage

| Field | Value |
| --- | --- |
| Execution status | \`${state.ownerEvidenceExecutionSummary.status}\` |
| Goal complete | \`${state.ownerEvidenceExecutionSummary.goalComplete ? 'yes' : 'no'}\` |
| Remaining gates | ${state.ownerEvidenceExecutionSummary.gateIds.remaining.length} |
| Owner action queue count | ${state.ownerEvidenceExecutionSummary.closeoutCoverage.ownerActionQueueCount} |
| Owner action rows | ${state.ownerEvidenceExecutionSummary.handoffCoverage.ownerActionRowCount} |
| Owner action needed count | ${state.ownerEvidenceExecutionSummary.closeoutCoverage.ownerActionNeededCount} |
| Owner prep actions needed | ${state.ownerEvidenceExecutionSummary.closeoutCoverage.ownerPrepActionNeededCount} |
| Owner prep by-gate entries | ${state.ownerEvidenceExecutionSummary.ownerPrepActionNeededByGateCoverage.ownerPrepActionNeededGateCount} |
| Gate-scoped owner prep actions | ${state.ownerEvidenceExecutionSummary.ownerPrepActionNeededByGateCoverage.gateScopedOwnerPrepActionCount} |
| Unique owner prep actions | ${state.ownerEvidenceExecutionSummary.ownerPrepActionNeededByGateCoverage.uniqueOwnerPrepActionNeededCount} |
| Shared owner prep actions | ${state.ownerEvidenceExecutionSummary.ownerPrepActionNeededByGateCoverage.sharedOwnerPrepActionCount} |
| Operational access prerequisites | ${state.ownerEvidenceExecutionSummary.operationalAccessPrerequisiteSummary.prerequisiteCount} |
| Operational access blocking checks | ${state.ownerEvidenceExecutionSummary.operationalAccessPrerequisiteSummary.blockingCheckCount} |
| Operational access source trace rows | ${state.ownerEvidenceExecutionSummary.operationalAccessPrerequisiteSummary.sourceTraceCount} |
| Operational access source artifacts | ${state.ownerEvidenceExecutionSummary.operationalAccessPrerequisiteSummary.sourceArtifactCount} |
| Operational access blocking check source anchors | ${state.ownerEvidenceExecutionSummary.operationalAccessPrerequisiteSummary.sourceTraceBlockingCheckCount} |
| Local safety status | \`${state.ownerEvidenceExecutionSummary.localSafetyStatusSummary.status}\` |
| Local safety protected paths ignored | ${state.ownerEvidenceExecutionSummary.localSafetyStatusSummary.ignoredProtectedPathCount}/${state.ownerEvidenceExecutionSummary.localSafetyStatusSummary.protectedPathCount} |
| Local safety source trace rows | ${state.ownerEvidenceExecutionSummary.localSafetyStatusSummary.sourceTraceCount} |
| Local safety source artifacts | ${state.ownerEvidenceExecutionSummary.localSafetyStatusSummary.sourceArtifactCount} |
| Handoff local safety aligned | \`${state.ownerEvidenceExecutionSummary.localSafetyStatusSummary.handoffStatusMatchesLocalSafety ? 'yes' : 'no'}\` |
| Completion-drill local safety aligned | \`${state.ownerEvidenceExecutionSummary.localSafetyStatusSummary.completionDrillStatusMatchesLocalSafety ? 'yes' : 'no'}\` |
| Failed closeout steps | ${state.ownerEvidenceExecutionSummary.closeoutCoverage.failedStepCount} |
| Failed closeout source trace rows | ${state.ownerEvidenceExecutionSummary.closeoutCoverage.failedStepSourceTraceCount} |
| Failed closeout source artifact | \`${state.ownerEvidenceExecutionSummary.closeoutCoverage.failedStepSourceArtifact}\` |
| Failed closeout command anchors | ${state.ownerEvidenceExecutionSummary.closeoutCoverage.failedStepSourceTraceCommandCount} |
| Closeout next command keys | ${state.ownerEvidenceExecutionSummary.closeoutCoverage.nextCommandCount} |
| Closeout next command values | ${state.ownerEvidenceExecutionSummary.closeoutCoverage.nextCommandValueCount} |
| Closeout next command source trace rows | ${state.ownerEvidenceExecutionSummary.closeoutCoverage.nextCommandSourceTraceCount} |
| Closeout status artifacts | ${state.ownerEvidenceExecutionSummary.closeoutCoverage.statusArtifactCount} |
| Closeout status artifact trace rows | ${state.ownerEvidenceExecutionSummary.closeoutCoverage.statusArtifactSourceTraceCount} |
| Handoff commands | ${state.ownerEvidenceExecutionSummary.handoffCoverage.commandSequenceCount} |
| Handoff command source trace rows | ${state.ownerEvidenceExecutionSummary.handoffCoverage.commandSequenceSourceTraceCount} |
| Completion-drill recommended commands | ${state.ownerEvidenceExecutionSummary.completionDrillCoverage.recommendedCommandCount} |
| Completion-drill command source trace rows | ${state.ownerEvidenceExecutionSummary.completionDrillCoverage.recommendedCommandOrderSourceTraceCount} |
| Completion-drill packets | ${state.ownerEvidenceExecutionSummary.completionDrillCoverage.packetCount} |
| Completion-drill official reference URLs | ${state.ownerEvidenceExecutionSummary.completionDrillCoverage.officialReferenceCount} |
| Completion-drill matrix rows | ${state.ownerEvidenceExecutionSummary.completionDrillCoverage.matrixRowCount} |

#### Owner Evidence Gate Trace

| Source | Gate IDs |
| --- | --- |
| Remaining gates | ${state.ownerEvidenceExecutionSummary.gateIds.remaining.join(', ') || 'none'} |
| Handoff remaining gates | ${state.ownerEvidenceExecutionSummary.gateIds.handoffRemaining.join(', ') || 'none'} |
| Completion-drill required gates | ${state.ownerEvidenceExecutionSummary.gateIds.completionRequired.join(', ') || 'none'} |

#### Owner Prep By-Gate Trace

| Gate | Owner prep actions | Source artifact |
| --- | ---: | --- |
${Object.values(state.ownerEvidenceExecutionSummary.ownerPrepActionNeededByGate)
  .map(
    (gateSummary) =>
      `| ${gateSummary.gateId} | ${gateSummary.ownerActionNeededCount} | ${gateSummary.sourceArtifact} |`,
  )
  .join('\n') || '| none | 0 | none |'}

${state.ownerEvidenceExecutionSummary.ownerPrepActionNeededByGateBoundary}

#### Owner Closeout Next Command Source Trace

| Key | Command(s) | Command count | Source artifact |
| --- | --- | ---: | --- |
${ownerCloseoutNextCommandRows || '| none | none | 0 | none |'}

#### Owner Closeout Status Artifact Trace

| Key | Artifact path | Source artifact |
| --- | --- | --- |
${ownerCloseoutStatusArtifactRows || '| none | none | none |'}

${state.ownerEvidenceExecutionSummary.closeoutCoverage.nextCommandSourceTraceBoundary}

#### Owner Closeout Failed Step Source Trace

| Step | Status | Command | Source artifact |
| --- | --- | --- | --- |
${ownerCloseoutFailedStepRows || '| none | none | none | none |'}

${state.ownerEvidenceExecutionSummary.closeoutCoverage.failedStepSourceTraceBoundary}

#### Operational Access Prerequisite Trace

| ID | Status | Track | Owner prep command | Next command | Blocking checks |
| --- | --- | --- | --- | --- | --- |
${state.ownerEvidenceExecutionSummary.operationalAccessPrerequisiteSummary.prerequisites
  .map(
    (prerequisite) =>
      `| ${prerequisite.id} | ${prerequisite.status} | ${prerequisite.track} | ${prerequisite.ownerPrepCommand} | ${prerequisite.nextCommand} | ${prerequisite.blockingCheckIds.join(', ')} |`,
  )
  .join('\n') || '| none | none | none | none | none | none |'}

${state.ownerEvidenceExecutionSummary.operationalAccessPrerequisiteSummary.boundary}

#### Operational Access Source Trace

| ID | Handoff | Completion drill | Live closeout readiness | Blocking check anchors |
| --- | --- | --- | --- | --- |
${ownerOperationalAccessSourceRows}

${state.ownerEvidenceExecutionSummary.operationalAccessPrerequisiteSummary.sourceTraceBoundary}

#### Owner Local Safety Source Trace

| Key | Value | Local-safety source artifact | Handoff source artifact | Completion-drill source artifact |
| --- | --- | --- | --- | --- |
${ownerLocalSafetySourceRows}

${state.ownerEvidenceExecutionSummary.localSafetyStatusSummary.sourceTraceBoundary}

${state.ownerEvidenceExecutionSummary.localSafetyStatusSummary.boundary}

#### Owner Handoff Command Source Trace

| Order | Command | Source artifact |
| ---: | --- | --- |
${ownerHandoffCommandSourceRows}

#### Completion Drill Command Source Trace

| Order | Command | Source artifact |
| ---: | --- | --- |
${ownerCompletionCommandSourceRows}

${state.ownerEvidenceExecutionSummary.commandSequenceSourceTraceBoundary}

${state.ownerEvidenceExecutionSummary.evidenceBoundary}

### Owner Action Queue Detail

| Field | Value |
| --- | ---: |
| Queue rows | ${state.ownerActionQueueSummary.queueCount} |
| Closeout rows | ${state.ownerActionQueueSummary.closeoutQueueCount} |
| Handoff rows | ${state.ownerActionQueueSummary.handoffRowCount} |
| Completion-drill rows | ${state.ownerActionQueueSummary.completionDrillRowCount} |
| Primary source artifact | \`${state.ownerActionQueueSummary.sourceArtifact}\` |
| Source artifacts | ${state.ownerActionQueueSummary.sourceArtifactCount} |
| Row source artifacts | ${state.ownerActionQueueSummary.rowSourceArtifactCount} |
| Owner action source trace rows | ${state.ownerActionQueueSummary.sourceTraceCount} |
| Owner prep commands | ${state.ownerActionQueueSummary.ownerPrepCommandCount} |
| Next commands | ${state.ownerActionQueueSummary.nextCommandCount} |
| Raw-evidence policies | ${state.ownerActionQueueSummary.rawEvidencePolicyCount} |
| Repo limitation notes | ${state.ownerActionQueueSummary.repoDoesNotDoCount} |
| Blocking owner-action notes | ${state.ownerActionQueueSummary.blockingOwnerActionCount} |
| Closeout failure details | ${state.ownerActionQueueSummary.closeoutFailureDetailCount} |

#### Owner Action Command Trace

| Gate | Status | Track | Source artifact | Source boundary | Owner prep command | Next command | Blocking owner actions | Closeout failure details |
| --- | --- | --- | --- | --- | --- | --- | ---: | ---: |
${ownerActionQueueRows}

#### Owner Action Boundary Trace

| Gate | Risk if skipped | Does not prove |
| --- | --- | --- |
${ownerActionBoundaryRows}

#### Owner Action Source Trace

| Gate | Remediation ledger | Closeout status | Handoff | Completion drill |
| --- | --- | --- | --- | --- |
${ownerActionSourceRows}

${state.ownerActionQueueSummary.sourceTraceBoundary}

${state.ownerActionQueueSummary.evidenceBoundary}

### Progress Updates

| Phase | Accomplished items | Target matrix rows | Pending items | Current phase actions | Bottleneck |
| --- | ---: | ---: | ---: | ---: | --- |
${state.progressUpdates
  .map(
    (update) =>
      `| ${update.phase} | ${update.accomplished.length} | ${update.target_matrix.length} | ${update.pending.length} | ${update.activities_remaining.current_phase_actions} | ${update.bottleneck} |`,
  )
  .join('\n')}

### Bottleneck Log

| Phase | Task/subtask | Root cause | Top unblock options |
| --- | --- | --- | ---: |
${state.bottleneckLog
  .map(
    (entry) =>
      `| ${entry.phase} | ${entry.task_or_subtask} | ${entry.root_cause} | ${entry.top_unblock_options.length} |`,
  )
  .join('\n')}

### Implementation Decisions

| Decision | Chosen variant | Acceptance check | Tests run |
| --- | --- | --- | --- |
${state.implementationDecisions
  .map(
    (item) =>
      `| ${item.decision} | ${item.chosen_variant} | ${item.acceptance_check} | ${item.tests_run.join('<br>')} |`,
  )
  .join('\n')}

### Rejected Variants

| Variant | Reason rejected | Tradeoff | Evidence |
| --- | --- | --- | --- |
${state.rejectedVariants
  .map((item) => `| ${item.variant} | ${item.reason_rejected} | ${item.tradeoff} | ${item.evidence} |`)
  .join('\n')}

### Code Optimization Reviews

| Target task | Policy | Verdict | Minimality score | Checks |
| --- | --- | --- | ---: | --- |
${state.codeOptimizationReviews
  .map(
    (item) =>
      `| ${item.target_task} | ${item.policy} | ${item.verdict} | ${item.minimality_score}/5 | ${item.tests_or_checks.join('<br>')} |`,
  )
  .join('\n')}

## Post-Summary Launch-Readiness Alignment

Verify final summary launch-readiness state aligns with owner/remediation ledgers
Source artifact: \`${value.postSummaryLaunchReadinessAlignment.sourceArtifact}\`
Status: \`${value.postSummaryLaunchReadinessAlignment.status}\`
Command: \`${value.postSummaryLaunchReadinessAlignment.command}\`
Execution order: \`${value.postSummaryLaunchReadinessAlignment.executionOrder}\`
Included in this invocation: ${markdownBool(value.postSummaryLaunchReadinessAlignment.includedInThisInvocation)}
Fixture verifier: \`${value.postSummaryLaunchReadinessAlignment.fixtureVerifier.command}\`
Source trace rows: ${value.postSummaryLaunchReadinessAlignment.sourceTraceCount}
Does-not-prove boundaries: ${value.postSummaryLaunchReadinessAlignment.doesNotProveCount}

### Post-Summary Launch-Readiness Alignment Appendix Source Trace

| Key | Value | Source artifact | Boundary |
| --- | --- | --- | --- |
${topLevelPostSummaryLaunchReadinessAlignmentSourceRows}

${value.postSummaryLaunchReadinessAlignment.sourceTraceBoundary}

${value.postSummaryLaunchReadinessAlignment.boundary}

${value.postSummaryLaunchReadinessAlignment.fixtureVerifier.boundary}

### Post-Summary Launch-Readiness Alignment Appendix Does Not Prove

| Boundary |
| --- |
${topLevelPostSummaryLaunchReadinessAlignmentDoesNotProveRows}
`;
}

function writeBaseArtifacts(root, gateIds = GATE_IDS) {
  const value = summary(gateIds);
  writeJson(root, SUMMARY_JSON, value);
  fs.writeFileSync(path.join(root, SUMMARY_MD), renderMarkdown(value));
  writeJson(root, LAUNCH_EVIDENCE_JSON, launchEvidence(gateIds));
  writeJson(root, LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON, launchSourceAudit());
  writeJson(root, COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON, commercialEvidenceIntakeSourceAudit());
  writeJson(root, LIVE_PROOF_RUN_PACKET_JSON, liveProofRunPacket());
  writeJson(root, LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON, liveProofRunPacketSourceAudit());
  writeJson(root, LIVE_CLOSEOUT_READINESS_JSON, liveCloseoutReadiness());
  writeJson(root, LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON, liveCloseoutAccessSourceAudit());
  writeJson(root, MANUAL_WCAG_REVIEW_PACKET_JSON, manualWcagReviewPacket());
  writeJson(root, MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_JSON, manualWcagReviewPacketSourceAudit());
  writeJson(root, OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON, ownerEvidenceCompletionDrillSourceAudit());
  writeJson(root, OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON, closeoutStatus(gateIds));
  writeJson(root, OWNER_EVIDENCE_HANDOFF_JSON, ownerEvidenceHandoff(gateIds));
  writeJson(root, OWNER_EVIDENCE_COMPLETION_DRILL_JSON, ownerEvidenceCompletionDrill(gateIds));
  writeJson(root, OWNER_EVIDENCE_LOCAL_SAFETY_JSON, ownerEvidenceLocalSafety());
  writeJson(root, REMEDIATION_COMPLETION_AUDIT_JSON, completionAudit(gateIds));
  writeJson(root, REMEDIATION_EXTERNAL_GATES_JSON, remediationGates(gateIds));
}

function updateJson(root, relativePath, updater) {
  const absolutePath = path.join(root, relativePath);
  const value = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  updater(value);
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function updateText(root, relativePath, updater) {
  const absolutePath = path.join(root, relativePath);
  fs.writeFileSync(absolutePath, updater(fs.readFileSync(absolutePath, 'utf8')));
}

function runVerifier(root) {
  return spawnSync(process.execPath, [VERIFIER_SCRIPT, '--root', root], {
    cwd: path.dirname(root),
    encoding: 'utf8',
  });
}

function assertCase(name, mutate, expectedCode, expectedText, gateIds = GATE_IDS) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-summary-readiness-${name}-`));
  try {
    writeBaseArtifacts(root, gateIds);
    mutate(root);
    const result = runVerifier(root);
    const output = `${result.stdout || ''}\n${result.stderr || ''}`;
    if (result.status !== expectedCode) {
      throw new Error(`${name} expected exit ${expectedCode}, got ${result.status}\n${output}`);
    }
    if (!output.includes(expectedText)) {
      throw new Error(`${name} expected output containing ${JSON.stringify(expectedText)}\n${output}`);
    }
    console.log(`ok ${name}`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const cases = [
  {
    name: 'aligned-pilot-only-open-gates-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
  },
  {
    name: 'aligned-no-remaining-gates-pass',
    expectedCode: 0,
    expectedText: '"expectedLaunchDecision": "sellable-with-caveats"',
    gateIds: [],
    mutate() {},
  },
  {
    name: 'missing-readiness-state-fails',
    expectedCode: 1,
    expectedText: 'missing_commercial_readiness_state',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState;
      });
    },
  },
  {
    name: 'launch-decision-drift-fails',
    expectedCode: 1,
    expectedText: 'launch_decision_does_not_match_owner_gate_state',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_JSON, (value) => {
        value.launch_decision = 'commercial-ready';
      });
    },
  },
  {
    name: 'state-gate-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerGateScoreboard.remainingGateIds',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerGateScoreboard.remainingGateIds.pop();
      });
    },
  },
  {
    name: 'launch-evidence-canonical-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.launchEvidence.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.launchEvidence.sourceTrace;
        delete value.commercialReadinessState.launchEvidence.sourceTraceCount;
      });
    },
  },
  {
    name: 'launch-evidence-canonical-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.launchEvidence.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.launchEvidence.sourceTrace[0].sourceArtifacts.launchGap =
          'docs/commercialization/stale-launch-evidence.json#gaps.manual_wcag_evidence';
      });
    },
  },
  {
    name: 'launch-evidence-blocker-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.launchEvidence.blockerSourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.launchEvidence.blockerSourceTrace;
      });
    },
  },
  {
    name: 'launch-evidence-blocker-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.launchEvidence.blockerSourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.launchEvidence.blockerSourceTrace[0].sourceArtifacts.launchGap =
          'docs/commercialization/stale-launch-evidence.json#gaps.manual_wcag_evidence';
      });
    },
  },
  {
    name: 'launch-evidence-blocker-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_launch_evidence_blocker_source_trace_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(LAUNCH_EVIDENCE_BLOCKER_SOURCE_TRACE_BOUNDARY, 'stale launch blocker source boundary'),
      );
    },
  },
  {
    name: 'state-owner-gate-scoreboard-canonical-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.ownerGateScoreboard.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerGateScoreboard.sourceTrace;
        delete value.commercialReadinessState.ownerGateScoreboard.sourceTraceCount;
      });
    },
  },
  {
    name: 'state-owner-gate-scoreboard-canonical-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.ownerGateScoreboard.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerGateScoreboard.sourceTrace[0].sourceArtifacts.handoff =
          'docs/commercialization/stale-owner-handoff.json#ownerActionRows.manual_wcag_evidence';
      });
    },
  },
  {
    name: 'canonical-source-trace-primary-source-artifact-missing-fails',
    expectedCode: 1,
    expectedText: 'canonical_source_trace_primary_source_artifact_missing',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerGateScoreboard.sourceTrace[0].sourceArtifact;
      });
    },
  },
  {
    name: 'canonical-source-trace-primary-source-artifact-stale-fails',
    expectedCode: 1,
    expectedText: 'state.ownerGateScoreboard.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerGateScoreboard.sourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-owner-evidence-closeout-status.json#ownerGateScoreboard.remainingGateIds.manual_wcag_evidence';
      });
    },
  },
  {
    name: 'state-owner-gate-scoreboard-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.ownerGateScoreboard.remainingGateSourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerGateScoreboard.remainingGateSourceTrace.pop();
      });
    },
  },
  {
    name: 'state-owner-gate-scoreboard-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.ownerGateScoreboard.remainingGateSourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerGateScoreboard.remainingGateSourceTrace[0].sourceArtifacts.handoff =
          'docs/commercialization/stale-owner-handoff.json#ownerActionRows.manual_wcag_evidence';
      });
    },
  },
  {
    name: 'owner-gate-scoreboard-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_owner_gate_scoreboard_source_trace_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(OWNER_GATE_SCOREBOARD_SOURCE_TRACE_BOUNDARY, 'stale scoreboard source boundary'),
      );
    },
  },
  {
    name: 'remediation-completion-canonical-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.remediationCompletion.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.remediationCompletion.sourceTrace;
        delete value.commercialReadinessState.remediationCompletion.sourceTraceCount;
      });
    },
  },
  {
    name: 'remediation-completion-canonical-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.remediationCompletion.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.remediationCompletion.sourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-remediation-completion.json#remainingExternalGates.manual_wcag_evidence';
      });
    },
  },
  {
    name: 'remediation-completion-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.remediationCompletion.remainingExternalGateSourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.remediationCompletion.remainingExternalGateSourceTrace;
      });
    },
  },
  {
    name: 'remediation-completion-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.remediationCompletion.remainingExternalGateSourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.remediationCompletion.remainingExternalGateSourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-remediation-completion.json#remainingExternalGates.manual_wcag_evidence';
      });
    },
  },
  {
    name: 'remediation-completion-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_remediation_completion_source_trace_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(REMEDIATION_COMPLETION_SOURCE_TRACE_BOUNDARY, 'stale remediation completion source boundary'),
      );
    },
  },
  {
    name: 'remediation-external-gates-canonical-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.remediationExternalGates.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.remediationExternalGates.sourceTrace;
        delete value.commercialReadinessState.remediationExternalGates.sourceTraceCount;
      });
    },
  },
  {
    name: 'remediation-external-gates-canonical-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.remediationExternalGates.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.remediationExternalGates.sourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-remediation-gates.json#ownerActionQueue.manual_wcag_evidence';
      });
    },
  },
  {
    name: 'remediation-external-gates-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.remediationExternalGates.ownerActionGateSourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.remediationExternalGates.ownerActionGateSourceTrace;
      });
    },
  },
  {
    name: 'remediation-external-gates-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.remediationExternalGates.ownerActionGateSourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.remediationExternalGates.ownerActionGateSourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-remediation-gates.json#ownerActionQueue.manual_wcag_evidence';
      });
    },
  },
  {
    name: 'remediation-external-gates-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_remediation_external_gate_source_trace_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(REMEDIATION_EXTERNAL_GATES_SOURCE_TRACE_BOUNDARY, 'stale remediation external gates source boundary'),
      );
    },
  },
  {
    name: 'closeout-gate-drift-fails',
    expectedCode: 1,
    expectedText: 'closeout.remainingGateIds',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON, (value) => {
        value.remainingGateIds.pop();
      });
    },
  },
  {
    name: 'remediation-owner-action-drift-fails',
    expectedCode: 1,
    expectedText: 'remediation.ownerActionGateIds',
    mutate(root) {
      updateJson(root, REMEDIATION_EXTERNAL_GATES_JSON, (value) => {
        value.ownerActionQueue.pop();
      });
    },
  },
  {
    name: 'source-path-drift-fails',
    expectedCode: 1,
    expectedText: 'state.sourceArtifacts.launchEvidence',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.sourceArtifacts.launchEvidence = 'docs/commercialization/stale.json';
      });
    },
  },
  {
    name: 'state-primary-source-artifact-missing-fails',
    expectedCode: 1,
    expectedText: 'state.sourceArtifact',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.sourceArtifact;
      });
    },
  },
  {
    name: 'state-primary-source-artifact-stale-fails',
    expectedCode: 1,
    expectedText: 'state.sourceArtifact',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.sourceArtifact = 'docs/commercialization/stale-launch-evidence.json';
      });
    },
  },
  {
    name: 'state-primary-source-artifact-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          `| State source artifact | \`${LAUNCH_EVIDENCE_JSON}\` |`,
          '| State source artifact | `docs/commercialization/stale-launch-evidence.json` |',
        ),
      );
    },
  },
  {
    name: 'missing-release-gate-coverage-fails',
    expectedCode: 1,
    expectedText: 'summary.releaseGateCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.releaseGateCoverage;
      });
    },
  },
  {
    name: 'release-gate-overclaim-browser-journey-fails',
    expectedCode: 1,
    expectedText: 'summary.releaseGateCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.releaseGateCoverage.browser_journey.includedInThisInvocation = true;
        value.releaseGateCoverage.browser_journey.passedInThisInvocation = true;
      });
    },
  },
  {
    name: 'release-gate-typecheck-step-fails',
    expectedCode: 1,
    expectedText: 'release_gate_step_not_passed',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.steps.find((step) => step.id === 'typecheck').status = 'failed';
      });
    },
  },
  {
    name: 'release-gate-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_release_gate_coverage_row',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replaceAll(
          '| browser_journey | `npm run verify:commercial-browser` | `no` | `not included` |  |',
          '| browser_journey | `npm run verify:commercial-browser` | `yes` | `yes` |  |',
        ),
      );
    },
  },
  {
    name: 'release-gate-state-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.releaseGateCoverageSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.releaseGateCoverageSummary.includedGateIds.push(
          'browser_journey',
        );
      });
    },
  },
  {
    name: 'missing-release-gate-state-summary-fails',
    expectedCode: 1,
    expectedText: 'state.releaseGateCoverageSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.releaseGateCoverageSummary;
      });
    },
  },
  {
    name: 'release-gate-state-source-artifact-drift-fails',
    expectedCode: 1,
    expectedText: 'state.releaseGateCoverageSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.releaseGateCoverageSummary.sourceArtifact =
          'docs/commercialization/stale-summary.json#releaseGateCoverage';
      });
    },
  },
  {
    name: 'release-gate-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.releaseGateCoverageSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.releaseGateCoverageSummary.sourceTrace;
      });
    },
  },
  {
    name: 'release-gate-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.releaseGateCoverageSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.releaseGateCoverageSummary.sourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-summary.json#releaseGateCoverage.default_core';
      });
    },
  },
  {
    name: 'release-gate-does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'state.releaseGateCoverageSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.releaseGateCoverageSummary.doesNotProveCount = 999;
      });
    },
  },
  {
    name: 'release-gate-does-not-prove-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '| Release gate does-not-prove boundaries | 3 |',
          '| Release gate does-not-prove boundaries | 999 |',
        ),
      );
    },
  },
  {
    name: 'release-gate-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_release_gate_source_trace_row',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '| default_core | `npm run verify:commercial` | `yes` | `yes` | `no` | `no` | docs/commercialization/commercial-verification-summary-latest.json#releaseGateCoverage.default_core |  |',
          '| default_core | `npm run verify:commercial` | `yes` | `yes` | `no` | `no` | docs/commercialization/stale-summary.json#releaseGateCoverage.default_core |  |',
        ),
      );
    },
  },
  {
    name: 'release-gate-state-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '| Release gate coverage status | `partial_invocation_optional_gates_not_included` |',
          '| Release gate coverage status | `stale_release_gate_status` |',
        ),
      );
    },
  },
  {
    name: 'missing-post-summary-launch-readiness-metadata-fails',
    expectedCode: 1,
    expectedText: 'missing_post_summary_launch_readiness_alignment',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.postSummaryLaunchReadinessAlignment;
      });
    },
  },
  {
    name: 'post-summary-launch-readiness-command-drift-fails',
    expectedCode: 1,
    expectedText: 'summary.postSummaryLaunchReadinessAlignment.command',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.postSummaryLaunchReadinessAlignment.command =
          'node scripts/stale-launch-readiness-alignment.mjs';
      });
    },
  },
  {
    name: 'post-summary-launch-readiness-order-drift-fails',
    expectedCode: 1,
    expectedText: 'summary.postSummaryLaunchReadinessAlignment.executionOrder',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.postSummaryLaunchReadinessAlignment.executionOrder = 'before summary write';
      });
    },
  },
  {
    name: 'post-summary-launch-readiness-fixture-drift-fails',
    expectedCode: 1,
    expectedText: 'summary.postSummaryLaunchReadinessAlignment.fixtureVerifier.command',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.postSummaryLaunchReadinessAlignment.fixtureVerifier.command =
          'node scripts/stale-fixtures.mjs';
      });
    },
  },
  {
    name: 'post-summary-launch-readiness-source-artifact-drift-fails',
    expectedCode: 1,
    expectedText: 'summary.postSummaryLaunchReadinessAlignment.sourceArtifact',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.postSummaryLaunchReadinessAlignment.sourceArtifact =
          'docs/commercialization/stale-summary.json#postSummaryLaunchReadinessAlignment';
      });
    },
  },
  {
    name: 'post-summary-launch-readiness-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'summary.postSummaryLaunchReadinessAlignment.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.postSummaryLaunchReadinessAlignment.sourceTrace;
        delete value.postSummaryLaunchReadinessAlignment.sourceTraceCount;
        delete value.postSummaryLaunchReadinessAlignment.sourceTraceBoundary;
      });
    },
  },
  {
    name: 'post-summary-launch-readiness-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'summary.postSummaryLaunchReadinessAlignment.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.postSummaryLaunchReadinessAlignment.sourceTrace[0].sourceArtifact =
          `${POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_SOURCE_ARTIFACT}.staleCommand`;
      });
    },
  },
  {
    name: 'post-summary-launch-readiness-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          `Command: \`${EXPECTED_LAUNCH_READINESS_COMMAND}\``,
          'Command: `node scripts/stale-launch-readiness-alignment.mjs`',
        ),
      );
    },
  },
  {
    name: 'post-summary-launch-readiness-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_top_level_post_summary_launch_readiness_alignment_source_trace',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '### Post-Summary Launch-Readiness Alignment Appendix Source Trace',
          '### Post-Summary Launch-Readiness Alignment Appendix Sources',
        ),
      );
    },
  },
  {
    name: 'launch-evidence-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.launchEvidenceSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.launchEvidenceSummary.deliverableCounts.painPointCount = 9;
      });
    },
  },
  {
    name: 'launch-evidence-summary-required-output-counts-missing-fails',
    expectedCode: 1,
    expectedText: 'state.launchEvidenceSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.launchEvidenceSummary.requiredOutputTableCounts;
      });
    },
  },
  {
    name: 'launch-evidence-summary-required-output-counts-stale-fails',
    expectedCode: 1,
    expectedText: 'state.launchEvidenceSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.launchEvidenceSummary.requiredOutputTableCounts.gapCount = 999;
      });
    },
  },
  {
    name: 'launch-evidence-summary-required-output-counts-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_required_output_table_counts_section',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace('#### Required Output Table Counts', '#### Required Output Coverage'),
      );
    },
  },
  {
    name: 'launch-evidence-summary-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.launchEvidenceSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.launchEvidenceSummary.sourceTrace;
        delete value.commercialReadinessState.launchEvidenceSummary.sourceTraceCount;
        delete value.commercialReadinessState.launchEvidenceSummary.sourceTraceBoundary;
      });
    },
  },
  {
    name: 'launch-evidence-summary-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.launchEvidenceSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.launchEvidenceSummary.sourceTrace[0].sourceArtifacts.scores =
          `${LAUNCH_EVIDENCE_JSON}#stale_scores`;
      });
    },
  },
  {
    name: 'launch-evidence-summary-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_launch_evidence_summary_source_trace',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace('#### Launch Evidence Summary Source Trace', '#### Launch Evidence Summary'),
      );
    },
  },
  {
    name: 'missing-launch-evidence-summary-fails',
    expectedCode: 1,
    expectedText: 'state.launchEvidenceSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.launchEvidenceSummary;
      });
    },
  },
  {
    name: 'proof-bucket-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.proofBucketSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.proofBucketSummary.countsByBucket.roadmap = 0;
      });
    },
  },
  {
    name: 'proof-bucket-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.proofBucketSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.proofBucketSummary.sourceTrace;
        delete value.commercialReadinessState.proofBucketSummary.sourceTraceCount;
        delete value.commercialReadinessState.proofBucketSummary.sourceTraceBoundary;
      });
    },
  },
  {
    name: 'proof-bucket-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.proofBucketSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.proofBucketSummary.sourceTrace[0].sourceArtifact =
          `${LAUNCH_EVIDENCE_JSON}#proof_buckets.hosted_live.stale`;
      });
    },
  },
  {
    name: 'proof-bucket-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_proof_bucket_source_trace',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace('#### Launch Proof Bucket Source Trace', '#### Launch Proof Bucket Sources'),
      );
    },
  },
  {
    name: 'missing-proof-buckets-fails',
    expectedCode: 1,
    expectedText: 'launch_missing_proof_buckets',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_JSON, (value) => {
        delete value.proof_buckets;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.proofBucketSummary;
      });
    },
  },
  {
    name: 'missing-roadmap-proof-bucket-fails',
    expectedCode: 1,
    expectedText: 'launch_missing_roadmap_proof_bucket',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_JSON, (value) => {
        delete value.proof_buckets.roadmap;
      });
    },
  },
  {
    name: 'proof-bucket-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_proof_bucket_summary_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) => source.replace('| Roadmap items | 1 |', '| Roadmap items | 0 |'));
    },
  },
  {
    name: 'source-audit-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.launchSourceAuditCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.launchSourceAuditCoverage.sourceCount = 1;
      });
    },
  },
  {
    name: 'source-audit-url-drift-fails',
    expectedCode: 1,
    expectedText: 'sourceAudit.sourceUrls',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON, (value) => {
        value.sources.pop();
        value.sourceCount = value.sources.length;
        value.passedCount = value.sources.length;
      });
    },
  },
  {
    name: 'source-audit-failed-source-fails',
    expectedCode: 1,
    expectedText: 'source_audit_not_all_passed',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON, (value) => {
        value.allPassed = false;
        value.failedCount = 1;
        value.failedSourceUrls = [SOURCE_URLS[0]];
        value.sources[0].status = 'failed';
      });
    },
  },
  {
    name: 'source-audit-network-fetch-disabled-fails',
    expectedCode: 1,
    expectedText: 'source_audit_network_fetch_not_enabled',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON, (value) => {
        value.networkFetch = false;
        value.sources.forEach((source) => {
          source.fetch.attempted = false;
          source.fetch.evidence = [];
        });
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        const coverage = value.commercialReadinessState.launchSourceAuditCoverage;
        coverage.networkFetch = false;
        coverage.expectationCheckCount = 0;
        coverage.expectedTextMatchCount = 0;
        coverage.fetchedSourceCount = 0;
      });
    },
  },
  {
    name: 'source-audit-expected-text-mismatch-fails',
    expectedCode: 1,
    expectedText: 'source_audit_expected_text_mismatch',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON, (value) => {
        value.sources[0].fetch.evidence[0].matched = false;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.launchSourceAuditCoverage.expectedTextMatchCount -= 1;
      });
    },
  },
  {
    name: 'source-audit-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.launchSourceAuditCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.launchSourceAuditCoverage.sourceTrace;
      });
    },
  },
  {
    name: 'commercial-intake-source-audit-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.commercialEvidenceIntakeSourceAuditCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.commercialEvidenceIntakeSourceAuditCoverage.sourceCount = 1;
      });
    },
  },
  {
    name: 'missing-commercial-intake-source-audit-summary-fails',
    expectedCode: 1,
    expectedText: 'state.commercialEvidenceIntakeSourceAuditCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.commercialEvidenceIntakeSourceAuditCoverage;
      });
    },
  },
  {
    name: 'commercial-intake-source-audit-url-drift-fails',
    expectedCode: 1,
    expectedText: 'state.commercialEvidenceIntakeSourceAuditCoverage',
    mutate(root) {
      updateJson(root, COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON, (value) => {
        value.sources.pop();
        value.sourceCount = value.sources.length;
        value.passedCount = value.sources.length;
      });
    },
  },
  {
    name: 'commercial-intake-source-audit-failed-source-fails',
    expectedCode: 1,
    expectedText: 'commercial_evidence_intake_source_audit_not_all_passed',
    mutate(root) {
      updateJson(root, COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON, (value) => {
        value.allPassed = false;
        value.failedCount = 1;
        value.failedSourceIds = [COMMERCIAL_EVIDENCE_INTAKE_SOURCE_IDS[0]];
        value.sources[0].status = 'failed';
      });
    },
  },
  {
    name: 'commercial-intake-source-audit-network-fetch-disabled-fails',
    expectedCode: 1,
    expectedText: 'commercial_evidence_intake_source_audit_network_fetch_not_enabled',
    mutate(root) {
      updateJson(root, COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON, (value) => {
        value.networkFetch = false;
        value.sources.forEach((source) => {
          source.fetch.attempted = false;
          source.fetch.evidence = [];
        });
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        const coverage = value.commercialReadinessState.commercialEvidenceIntakeSourceAuditCoverage;
        coverage.networkFetch = false;
        coverage.expectationCheckCount = 0;
        coverage.expectedTextMatchCount = 0;
        coverage.fetchedSourceCount = 0;
      });
    },
  },
  {
    name: 'commercial-intake-source-audit-expected-text-mismatch-fails',
    expectedCode: 1,
    expectedText: 'commercial_evidence_intake_source_audit_expected_text_mismatch',
    mutate(root) {
      updateJson(root, COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON, (value) => {
        value.sources[0].fetch.evidence[0].matched = false;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.commercialEvidenceIntakeSourceAuditCoverage.expectedTextMatchCount -= 1;
      });
    },
  },
  {
    name: 'commercial-intake-source-audit-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_commercial_evidence_intake_source_audit_coverage_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace('| FTC references | 4 |', '| FTC references | 1 |'),
      );
    },
  },
  {
    name: 'commercial-intake-source-audit-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_commercial_evidence_intake_source_audit_source_trace',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          `${COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_SOURCE_ARTIFACT}.${COMMERCIAL_EVIDENCE_INTAKE_SOURCE_IDS[0]}`,
          'docs/commercialization/commercial-evidence-intake-source-audit-latest.json#sources.stale',
        ),
      );
    },
  },
  {
    name: 'live-proof-run-packet-source-audit-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.liveProofRunPacketSourceAuditCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.liveProofRunPacketSourceAuditCoverage.sourceCount = 1;
      });
    },
  },
  {
    name: 'missing-live-proof-run-packet-source-audit-summary-fails',
    expectedCode: 1,
    expectedText: 'state.liveProofRunPacketSourceAuditCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.liveProofRunPacketSourceAuditCoverage;
      });
    },
  },
  {
    name: 'live-proof-run-packet-source-audit-url-drift-fails',
    expectedCode: 1,
    expectedText: 'liveProofRunPacketSourceAudit.sourceUrls',
    mutate(root) {
      updateJson(root, LIVE_PROOF_RUN_PACKET_JSON, (value) => {
        value.officialReferences[0].url = 'https://example.invalid/live-proof-url-drift';
      });
    },
  },
  {
    name: 'live-proof-run-packet-source-audit-failed-source-fails',
    expectedCode: 1,
    expectedText: 'live_proof_run_packet_source_audit_not_all_passed',
    mutate(root) {
      updateJson(root, LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON, (value) => {
        value.allPassed = false;
        value.failedCount = 1;
        value.failedSourceIds = [LIVE_PROOF_RUN_PACKET_SOURCE_IDS[0]];
        value.sources[0].status = 'failed';
      });
    },
  },
  {
    name: 'live-proof-run-packet-source-audit-network-fetch-disabled-fails',
    expectedCode: 1,
    expectedText: 'live_proof_run_packet_source_audit_network_fetch_not_enabled',
    mutate(root) {
      updateJson(root, LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON, (value) => {
        value.networkFetch = false;
        value.sources.forEach((source) => {
          source.fetch.attempted = false;
          source.fetch.evidence = [];
        });
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        const coverage = value.commercialReadinessState.liveProofRunPacketSourceAuditCoverage;
        coverage.networkFetch = false;
        coverage.expectationCheckCount = 0;
        coverage.expectedTextMatchCount = 0;
        coverage.fetchedSourceCount = 0;
      });
    },
  },
  {
    name: 'live-proof-run-packet-source-audit-expected-text-mismatch-fails',
    expectedCode: 1,
    expectedText: 'live_proof_run_packet_source_audit_expected_text_mismatch',
    mutate(root) {
      updateJson(root, LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON, (value) => {
        value.sources[0].fetch.evidence[0].matched = false;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.liveProofRunPacketSourceAuditCoverage.expectedTextMatchCount -= 1;
      });
    },
  },
  {
    name: 'live-proof-run-packet-source-audit-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_live_proof_run_packet_source_audit_coverage_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace('| Stripe/Supabase/GitHub references | 5 |', '| Stripe/Supabase/GitHub references | 1 |'),
      );
    },
  },
  {
    name: 'live-closeout-access-source-audit-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.liveCloseoutAccessSourceAuditCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.liveCloseoutAccessSourceAuditCoverage.sourceCount = 1;
      });
    },
  },
  {
    name: 'missing-live-closeout-access-source-audit-summary-fails',
    expectedCode: 1,
    expectedText: 'state.liveCloseoutAccessSourceAuditCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.liveCloseoutAccessSourceAuditCoverage;
      });
    },
  },
  {
    name: 'live-closeout-readiness-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.liveCloseoutReadinessCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.liveCloseoutReadinessCoverage.status = 'passed';
      });
    },
  },
  {
    name: 'missing-live-closeout-readiness-summary-fails',
    expectedCode: 1,
    expectedText: 'state.liveCloseoutReadinessCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.liveCloseoutReadinessCoverage;
      });
    },
  },
  {
    name: 'live-closeout-readiness-failed-check-drift-fails',
    expectedCode: 1,
    expectedText: 'state.liveCloseoutReadinessCoverage',
    mutate(root) {
      updateJson(root, LIVE_CLOSEOUT_READINESS_JSON, (value) => {
        value.failedCheckIds = ['supabase-target-project-visible'];
        value.failedCheckCount = 1;
      });
    },
  },
  {
    name: 'live-closeout-readiness-next-action-count-drift-fails',
    expectedCode: 1,
    expectedText: 'liveCloseoutReadiness.nextActionCount',
    mutate(root) {
      updateJson(root, LIVE_CLOSEOUT_READINESS_JSON, (value) => {
        value.nextActionCount = 999;
      });
    },
  },
  {
    name: 'live-closeout-readiness-does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'liveCloseoutReadiness.doesNotProveCount',
    mutate(root) {
      updateJson(root, LIVE_CLOSEOUT_READINESS_JSON, (value) => {
        value.doesNotProveCount = 999;
      });
    },
  },
  {
    name: 'live-closeout-readiness-mutating-command-fails',
    expectedCode: 1,
    expectedText: 'live_closeout_readiness_external_mutation_overclaim',
    mutate(root) {
      updateJson(root, LIVE_CLOSEOUT_READINESS_JSON, (value) => {
        value.commandContext.mutatesExternalState = true;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.liveCloseoutReadinessCoverage.mutatesExternalState = true;
      });
    },
  },
  {
    name: 'live-closeout-readiness-canonical-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.liveCloseoutReadinessCoverage.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.liveCloseoutReadinessCoverage.sourceTrace;
        delete value.commercialReadinessState.liveCloseoutReadinessCoverage.sourceTraceCount;
      });
    },
  },
  {
    name: 'live-closeout-readiness-canonical-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.liveCloseoutReadinessCoverage.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.liveCloseoutReadinessCoverage.sourceTrace[0].sourceArtifact =
          'docs/commercialization/live-closeout-readiness-latest.json#checks.stale';
      });
    },
  },
  {
    name: 'live-closeout-readiness-check-source-trace-drift-fails',
    expectedCode: 1,
    expectedText: 'state.liveCloseoutReadinessCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.liveCloseoutReadinessCoverage.checkSourceTrace[0].sourceArtifact =
          'docs/commercialization/live-closeout-readiness-latest.json#checks.stale';
      });
    },
  },
  {
    name: 'missing-live-closeout-readiness-next-action-source-trace-fails',
    expectedCode: 1,
    expectedText: 'state.liveCloseoutReadinessCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.liveCloseoutReadinessCoverage.nextActionSourceTrace;
      });
    },
  },
  {
    name: 'live-closeout-readiness-reference-source-trace-drift-fails',
    expectedCode: 1,
    expectedText: 'state.liveCloseoutReadinessCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.liveCloseoutReadinessCoverage.officialReferenceSourceTrace[0].sourceArtifact =
          'docs/commercialization/live-closeout-readiness-latest.json#officialReferences.stale';
      });
    },
  },
  {
    name: 'live-closeout-readiness-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_live_closeout_readiness_check_source_trace_row',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          'docs/commercialization/live-closeout-readiness-latest.json#checks.github-secrets-visible',
          'docs/commercialization/live-closeout-readiness-latest.json#checks.stale',
        ),
      );
    },
  },
  {
    name: 'live-closeout-access-source-audit-url-drift-fails',
    expectedCode: 1,
    expectedText: 'liveCloseoutAccessSourceAudit.sourceUrls',
    mutate(root) {
      updateJson(root, LIVE_CLOSEOUT_READINESS_JSON, (value) => {
        value.officialReferences[0].url = 'https://example.invalid/live-closeout-url-drift';
      });
    },
  },
  {
    name: 'live-closeout-access-source-audit-failed-source-fails',
    expectedCode: 1,
    expectedText: 'live_closeout_access_source_audit_not_all_passed',
    mutate(root) {
      updateJson(root, LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON, (value) => {
        value.allPassed = false;
        value.failedCount = 1;
        value.failedSourceIds = [LIVE_CLOSEOUT_ACCESS_SOURCE_IDS[0]];
        value.sources[0].status = 'failed';
      });
    },
  },
  {
    name: 'live-closeout-access-source-audit-network-fetch-disabled-fails',
    expectedCode: 1,
    expectedText: 'live_closeout_access_source_audit_network_fetch_not_enabled',
    mutate(root) {
      updateJson(root, LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON, (value) => {
        value.networkFetch = false;
        value.sources.forEach((source) => {
          source.fetch.attempted = false;
          source.fetch.evidence = [];
        });
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        const coverage = value.commercialReadinessState.liveCloseoutAccessSourceAuditCoverage;
        coverage.networkFetch = false;
        coverage.expectationCheckCount = 0;
        coverage.expectedTextMatchCount = 0;
        coverage.fetchedSourceCount = 0;
      });
    },
  },
  {
    name: 'live-closeout-access-source-audit-expected-text-mismatch-fails',
    expectedCode: 1,
    expectedText: 'live_closeout_access_source_audit_expected_text_mismatch',
    mutate(root) {
      updateJson(root, LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON, (value) => {
        value.sources[0].fetch.evidence[0].matched = false;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.liveCloseoutAccessSourceAuditCoverage.expectedTextMatchCount -= 1;
      });
    },
  },
  {
    name: 'live-closeout-access-source-audit-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_live_closeout_access_source_audit_coverage_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace('| Supabase/GitHub access references | 4 |', '| Supabase/GitHub access references | 1 |'),
      );
    },
  },
  {
    name: 'live-closeout-readiness-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_live_closeout_readiness_coverage_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace('| Failed checks | 2 |', '| Failed checks | 0 |'),
      );
    },
  },
  {
    name: 'manual-wcag-packet-source-audit-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.manualWcagReviewPacketSourceAuditCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.manualWcagReviewPacketSourceAuditCoverage.sourceCount = 1;
      });
    },
  },
  {
    name: 'missing-manual-wcag-packet-source-audit-summary-fails',
    expectedCode: 1,
    expectedText: 'state.manualWcagReviewPacketSourceAuditCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.manualWcagReviewPacketSourceAuditCoverage;
      });
    },
  },
  {
    name: 'manual-wcag-packet-source-audit-url-drift-fails',
    expectedCode: 1,
    expectedText: 'manualWcagReviewPacketSourceAudit.sourceUrls',
    mutate(root) {
      updateJson(root, MANUAL_WCAG_REVIEW_PACKET_JSON, (value) => {
        value.officialReferences[0].url = 'https://example.invalid/manual-wcag-url-drift';
      });
    },
  },
  {
    name: 'manual-wcag-packet-source-audit-failed-source-fails',
    expectedCode: 1,
    expectedText: 'manual_wcag_review_packet_source_audit_not_all_passed',
    mutate(root) {
      updateJson(root, MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_JSON, (value) => {
        value.allPassed = false;
        value.failedCount = 1;
        value.failedSourceIds = [MANUAL_WCAG_REVIEW_PACKET_SOURCE_IDS[0]];
        value.sources[0].status = 'failed';
      });
    },
  },
  {
    name: 'manual-wcag-packet-source-audit-network-fetch-disabled-fails',
    expectedCode: 1,
    expectedText: 'manual_wcag_review_packet_source_audit_network_fetch_not_enabled',
    mutate(root) {
      updateJson(root, MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_JSON, (value) => {
        value.networkFetch = false;
        value.sources.forEach((source) => {
          source.fetch.attempted = false;
          source.fetch.evidence = [];
        });
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        const coverage = value.commercialReadinessState.manualWcagReviewPacketSourceAuditCoverage;
        coverage.networkFetch = false;
        coverage.expectationCheckCount = 0;
        coverage.expectedTextMatchCount = 0;
        coverage.fetchedSourceCount = 0;
      });
    },
  },
  {
    name: 'manual-wcag-packet-source-audit-expected-text-mismatch-fails',
    expectedCode: 1,
    expectedText: 'manual_wcag_review_packet_source_audit_expected_text_mismatch',
    mutate(root) {
      updateJson(root, MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_JSON, (value) => {
        value.sources[0].fetch.evidence[0].matched = false;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.manualWcagReviewPacketSourceAuditCoverage.expectedTextMatchCount -= 1;
      });
    },
  },
  {
    name: 'manual-wcag-packet-source-audit-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_manual_wcag_review_packet_source_audit_coverage_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace('| W3C/WAI references | 6 |', '| W3C/WAI references | 1 |'),
      );
    },
  },
  {
    name: 'completion-drill-source-audit-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceCompletionDrillSourceAuditCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceCompletionDrillSourceAuditCoverage.sourceCount = 1;
      });
    },
  },
  {
    name: 'missing-completion-drill-source-audit-summary-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceCompletionDrillSourceAuditCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerEvidenceCompletionDrillSourceAuditCoverage;
      });
    },
  },
  {
    name: 'completion-drill-source-audit-url-drift-fails',
    expectedCode: 1,
    expectedText: 'ownerEvidenceCompletionDrillSourceAudit.sourceUrls',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON, (value) => {
        value.sources.pop();
        value.sourceCount = value.sources.length;
        value.passedCount = value.sources.length;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        const coverage = value.commercialReadinessState.ownerEvidenceCompletionDrillSourceAuditCoverage;
        coverage.sourceCount -= 1;
        coverage.passedCount -= 1;
        coverage.sourceKeys.pop();
        coverage.sourceUrls.pop();
        coverage.expectationCheckCount -= 2;
        coverage.expectedTextMatchCount -= 2;
        coverage.fetchedSourceCount -= 1;
      });
    },
  },
  {
    name: 'completion-drill-source-audit-failed-source-fails',
    expectedCode: 1,
    expectedText: 'owner_evidence_completion_drill_source_audit_not_all_passed',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON, (value) => {
        value.allPassed = false;
        value.failedCount = 1;
        value.failedSourceKeys = [OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_KEYS[0]];
        value.sources[0].status = 'failed';
      });
    },
  },
  {
    name: 'completion-drill-source-audit-network-fetch-disabled-fails',
    expectedCode: 1,
    expectedText: 'owner_evidence_completion_drill_source_audit_network_fetch_not_enabled',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON, (value) => {
        value.networkFetch = false;
        value.sources.forEach((source) => {
          source.fetch.attempted = false;
          source.fetch.evidence = [];
        });
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        const coverage = value.commercialReadinessState.ownerEvidenceCompletionDrillSourceAuditCoverage;
        coverage.networkFetch = false;
        coverage.expectationCheckCount = 0;
        coverage.expectedTextMatchCount = 0;
        coverage.fetchedSourceCount = 0;
      });
    },
  },
  {
    name: 'completion-drill-source-audit-expected-text-mismatch-fails',
    expectedCode: 1,
    expectedText: 'owner_evidence_completion_drill_source_audit_expected_text_mismatch',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON, (value) => {
        value.sources[0].fetch.evidence[0].matched = false;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceCompletionDrillSourceAuditCoverage.expectedTextMatchCount -= 1;
      });
    },
  },
  {
    name: 'completion-drill-source-audit-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceCompletionDrillSourceAuditCoverage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceCompletionDrillSourceAuditCoverage.sourceTrace[0].sourceArtifact =
          'docs/commercialization/owner-evidence-completion-drill-source-audit-latest.json#sources.stale';
      });
    },
  },
  {
    name: 'completion-drill-source-audit-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_owner_evidence_completion_drill_source_audit_coverage_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace('| Official references | 16 |', '| Official references | 1 |'),
      );
    },
  },
  {
    name: 'owner-evidence-execution-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary.handoffCoverage.commandSequenceCount = 1;
      });
    },
  },
  {
    name: 'owner-local-safety-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary
          .localSafetyStatusSummary.ignoredProtectedPathCount = 9;
      });
    },
  },
  {
    name: 'owner-local-safety-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary
          .localSafetyStatusSummary.sourceTrace;
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary
          .localSafetyStatusSummary.sourceTraceCount;
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary
          .localSafetyStatusSummary.sourceTraceBoundary;
      });
    },
  },
  {
    name: 'owner-local-safety-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary
          .localSafetyStatusSummary.sourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-owner-evidence-local-safety.json#ok';
      });
    },
  },
  {
    name: 'owner-local-safety-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_owner_local_safety_source_trace_row',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          `${OWNER_EVIDENCE_LOCAL_SAFETY_JSON}#ok`,
          'docs/commercialization/stale-owner-evidence-local-safety.json#ok',
        ),
      );
    },
  },
  {
    name: 'owner-local-safety-handoff-status-drift-fails',
    expectedCode: 1,
    expectedText: 'owner_local_safety_handoff_status_mismatch',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_HANDOFF_JSON, (value) => {
        value.localSafetyStatus.sourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-owner-evidence-local-safety.json#ok';
      });
    },
  },
  {
    name: 'owner-local-safety-completion-drill-status-drift-fails',
    expectedCode: 1,
    expectedText: 'owner_local_safety_completion_drill_status_mismatch',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_COMPLETION_DRILL_JSON, (value) => {
        value.localSafetyStatus.sourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-owner-evidence-local-safety.json#ok';
      });
    },
  },
  {
    name: 'owner-handoff-command-source-trace-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary.handoffCoverage
          .commandSequenceSourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-owner-handoff.json#commandSequence.1';
      });
    },
  },
  {
    name: 'missing-owner-handoff-command-source-trace-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary.handoffCoverage
          .commandSequenceSourceTrace;
      });
    },
  },
  {
    name: 'owner-handoff-coverage-canonical-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary.handoffCoverage.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary.handoffCoverage
          .sourceTrace;
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary.handoffCoverage
          .sourceTraceCount;
      });
    },
  },
  {
    name: 'owner-handoff-coverage-canonical-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary.handoffCoverage.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary.handoffCoverage
          .sourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-owner-handoff.json#commandSequence.1';
      });
    },
  },
  {
    name: 'completion-drill-command-source-trace-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary.completionDrillCoverage
          .recommendedCommandOrderSourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-owner-evidence-completion-drill.json#recommendedCommandOrder.1';
      });
    },
  },
  {
    name: 'completion-drill-coverage-canonical-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary.completionDrillCoverage.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary
          .completionDrillCoverage.sourceTrace;
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary
          .completionDrillCoverage.sourceTraceCount;
      });
    },
  },
  {
    name: 'completion-drill-coverage-canonical-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary.completionDrillCoverage.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary
          .completionDrillCoverage.sourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-owner-evidence-completion-drill.json#recommendedCommandOrder.1';
      });
    },
  },
  {
    name: 'owner-command-source-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_owner_handoff_command_source_trace_row',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          `${OWNER_EVIDENCE_HANDOFF_JSON}#commandSequence.1`,
          'docs/commercialization/stale-owner-handoff.json#commandSequence.1',
        ),
      );
    },
  },
  {
    name: 'owner-closeout-failed-step-source-trace-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary.closeoutCoverage
          .failedStepSourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-owner-evidence-closeout-status.json#steps.verify-remediation-gates';
      });
    },
  },
  {
    name: 'missing-owner-closeout-failed-step-source-trace-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary.closeoutCoverage
          .failedStepSourceTrace;
      });
    },
  },
  {
    name: 'owner-closeout-failed-step-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_owner_closeout_failed_step_source_trace_row',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          `${OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON}#steps.verify-remediation-gates`,
          'docs/commercialization/stale-owner-evidence-closeout-status.json#steps.verify-remediation-gates',
        ),
      );
    },
  },
  {
    name: 'owner-closeout-next-command-source-trace-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary.closeoutCoverage
          .nextCommandSourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-owner-evidence-closeout-status.json#nextCommands.writeLocalScaffold';
      });
    },
  },
  {
    name: 'missing-owner-closeout-next-command-source-trace-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary.closeoutCoverage
          .nextCommandSourceTrace;
      });
    },
  },
  {
    name: 'owner-closeout-status-artifact-source-trace-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary.closeoutCoverage
          .statusArtifactSourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-owner-evidence-closeout-status.json#statusArtifacts.json';
      });
    },
  },
  {
    name: 'owner-closeout-coverage-canonical-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary.closeoutCoverage.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary.closeoutCoverage
          .sourceTrace;
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary.closeoutCoverage
          .sourceTraceCount;
      });
    },
  },
  {
    name: 'owner-closeout-coverage-canonical-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary.closeoutCoverage.sourceTrace',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary.closeoutCoverage
          .sourceTrace[0].sourceArtifact =
          'docs/commercialization/stale-owner-evidence-closeout-status.json#steps.verify-remediation-gates';
      });
    },
  },
  {
    name: 'owner-closeout-next-command-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_owner_closeout_next_command_source_trace_row',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          `${OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON}#nextCommands.writeLocalScaffold`,
          'docs/commercialization/stale-owner-evidence-closeout-status.json#nextCommands.writeLocalScaffold',
        ),
      );
    },
  },
  {
    name: 'owner-evidence-execution-by-gate-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary.ownerPrepActionNeededByGateCoverage
          .gateScopedOwnerPrepActionCount = 1;
      });
    },
  },
  {
    name: 'owner-evidence-handoff-by-gate-map-drift-fails',
    expectedCode: 1,
    expectedText: 'handoff.ownerPrepActionNeededByGate',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_HANDOFF_JSON, (value) => {
        value.ownerPrepActionNeededByGate.manual_wcag_evidence.ownerActionNeededCount = 0;
      });
    },
  },
  {
    name: 'completion-drill-by-gate-map-drift-fails',
    expectedCode: 1,
    expectedText: 'completionDrill.ownerPrepActionNeededByGate',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_COMPLETION_DRILL_JSON, (value) => {
        value.ownerPrepActionNeededByGate.manual_wcag_evidence.ownerActionNeededCount = 0;
      });
    },
  },
  {
    name: 'operational-access-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary
          .operationalAccessPrerequisiteSummary.prerequisiteCount = 0;
      });
    },
  },
  {
    name: 'operational-access-source-trace-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary
          .operationalAccessPrerequisiteSummary.sourceTrace[0].sourceArtifacts.completionDrill =
          'docs/commercialization/stale-owner-evidence-completion-drill.json#operationalAccessPrerequisites.live_closeout_supabase_access';
      });
    },
  },
  {
    name: 'missing-operational-access-source-trace-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary
          .operationalAccessPrerequisiteSummary.sourceTrace;
      });
    },
  },
  {
    name: 'post-summary-artifact-redaction-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryArtifactRedactionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.postSummaryArtifactRedactionSummary.status =
          'redaction_scan_skipped';
      });
    },
  },
  {
    name: 'missing-post-summary-artifact-redaction-summary-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryArtifactRedactionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.postSummaryArtifactRedactionSummary;
      });
    },
  },
  {
    name: 'post-summary-artifact-redaction-command-drift-fails',
    expectedCode: 1,
    expectedText: 'summary.postSummaryArtifactRedaction.command',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.postSummaryArtifactRedaction.command =
          'node scripts/stale-commercial-artifact-redaction.mjs --write';
      });
    },
  },
  {
    name: 'post-summary-artifact-redaction-source-artifact-drift-fails',
    expectedCode: 1,
    expectedText: 'state.sourceArtifacts.commercialArtifactRedaction',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.sourceArtifacts.commercialArtifactRedaction =
          'docs/commercialization/stale-artifact-redaction.json';
      });
    },
  },
  {
    name: 'post-summary-artifact-redaction-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_post_summary_artifact_redaction_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '| Post-summary redaction status | `post_summary_scan_required` |',
          '| Post-summary redaction status | `redaction_scan_skipped` |',
        ),
      );
    },
  },
  {
    name: 'post-summary-artifact-redaction-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryArtifactRedactionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.postSummaryArtifactRedactionSummary.sourceTrace;
        delete value.commercialReadinessState.postSummaryArtifactRedactionSummary.sourceTraceCount;
        delete value.commercialReadinessState.postSummaryArtifactRedactionSummary.sourceTraceBoundary;
      });
    },
  },
  {
    name: 'post-summary-artifact-redaction-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryArtifactRedactionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.postSummaryArtifactRedactionSummary.sourceTrace[0].sourceArtifact =
          `${POST_SUMMARY_ARTIFACT_REDACTION_SOURCE_ARTIFACT}.staleCommand`;
      });
    },
  },
  {
    name: 'post-summary-artifact-redaction-does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryArtifactRedactionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.postSummaryArtifactRedaction.doesNotProveCount = 999;
        value.commercialReadinessState.postSummaryArtifactRedactionSummary.doesNotProveCount = 999;
      });
    },
  },
  {
    name: 'post-summary-artifact-redaction-does-not-prove-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_post_summary_artifact_redaction_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '| Post-summary redaction does-not-prove boundaries | 3 |',
          '| Post-summary redaction does-not-prove boundaries | 0 |',
        ),
      );
    },
  },
  {
    name: 'post-summary-artifact-redaction-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_post_summary_artifact_redaction_source_trace',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '#### Post-Summary Artifact Redaction Source Trace',
          '#### Post-Summary Artifact Redaction Sources',
        ),
      );
    },
  },
  {
    name: 'post-summary-launch-readiness-alignment-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryLaunchReadinessAlignmentSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.postSummaryLaunchReadinessAlignmentSummary.status =
          'stale_alignment_status';
      });
    },
  },
  {
    name: 'missing-post-summary-launch-readiness-alignment-summary-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryLaunchReadinessAlignmentSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.postSummaryLaunchReadinessAlignmentSummary;
      });
    },
  },
  {
    name: 'post-summary-launch-readiness-alignment-state-command-drift-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryLaunchReadinessAlignmentSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.postSummaryLaunchReadinessAlignmentSummary.command =
          'node scripts/stale-summary-launch-readiness-alignment.mjs';
      });
    },
  },
  {
    name: 'post-summary-launch-readiness-alignment-source-artifact-drift-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryLaunchReadinessAlignmentSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.postSummaryLaunchReadinessAlignmentSummary.sourceArtifact =
          'docs/commercialization/stale-summary.json#postSummaryLaunchReadinessAlignment';
      });
    },
  },
  {
    name: 'post-summary-launch-readiness-alignment-state-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_post_summary_launch_readiness_alignment_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '| Post-summary launch-readiness alignment status | `included_after_post_summary_redaction_alignment` |',
          '| Post-summary launch-readiness alignment status | `stale_alignment_status` |',
        ),
      );
    },
  },
  {
    name: 'post-summary-launch-readiness-alignment-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryLaunchReadinessAlignmentSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.postSummaryLaunchReadinessAlignmentSummary.sourceTrace;
        delete value.commercialReadinessState.postSummaryLaunchReadinessAlignmentSummary.sourceTraceCount;
        delete value.commercialReadinessState.postSummaryLaunchReadinessAlignmentSummary.sourceTraceBoundary;
      });
    },
  },
  {
    name: 'post-summary-launch-readiness-alignment-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryLaunchReadinessAlignmentSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.postSummaryLaunchReadinessAlignmentSummary.sourceTrace[0].sourceArtifact =
          `${POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_SOURCE_ARTIFACT}.staleCommand`;
      });
    },
  },
  {
    name: 'post-summary-launch-readiness-alignment-does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryLaunchReadinessAlignmentSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.postSummaryLaunchReadinessAlignment.doesNotProveCount = 999;
        value.commercialReadinessState.postSummaryLaunchReadinessAlignmentSummary.doesNotProveCount = 999;
      });
    },
  },
  {
    name: 'post-summary-launch-readiness-alignment-does-not-prove-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_post_summary_launch_readiness_alignment_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '| Post-summary launch-readiness alignment does-not-prove boundaries | 4 |',
          '| Post-summary launch-readiness alignment does-not-prove boundaries | 0 |',
        ),
      );
    },
  },
  {
    name: 'post-summary-launch-readiness-alignment-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_post_summary_launch_readiness_alignment_source_trace',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '#### Post-Summary Launch-Readiness Alignment Source Trace',
          '#### Post-Summary Launch-Readiness Alignment Sources',
        ),
      );
    },
  },
  {
    name: 'post-summary-launch-evidence-refresh-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryLaunchEvidenceRefreshSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.postSummaryLaunchEvidenceRefreshSummary.status =
          'stale_refresh_status';
      });
    },
  },
  {
    name: 'missing-post-summary-launch-evidence-refresh-summary-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryLaunchEvidenceRefreshSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.postSummaryLaunchEvidenceRefreshSummary;
      });
    },
  },
  {
    name: 'post-summary-launch-evidence-refresh-command-drift-fails',
    expectedCode: 1,
    expectedText: 'summary.postSummaryLaunchEvidenceRefresh.command',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.postSummaryLaunchEvidenceRefresh.command =
          'node scripts/stale-launch-evidence-refresh.mjs --write';
      });
    },
  },
  {
    name: 'post-summary-launch-evidence-refresh-source-artifact-drift-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryLaunchEvidenceRefreshSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.postSummaryLaunchEvidenceRefreshSummary.sourceArtifact =
          'docs/commercialization/stale-summary.json#postSummaryLaunchEvidenceRefresh';
      });
    },
  },
  {
    name: 'post-summary-launch-evidence-refresh-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_post_summary_launch_evidence_refresh_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '| Post-summary launch evidence refresh status | `included_after_initial_passed_summary` |',
          '| Post-summary launch evidence refresh status | `stale_refresh_status` |',
        ),
      );
    },
  },
  {
    name: 'post-summary-launch-evidence-refresh-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryLaunchEvidenceRefreshSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.postSummaryLaunchEvidenceRefreshSummary.sourceTrace;
        delete value.commercialReadinessState.postSummaryLaunchEvidenceRefreshSummary.sourceTraceCount;
        delete value.commercialReadinessState.postSummaryLaunchEvidenceRefreshSummary.sourceTraceBoundary;
      });
    },
  },
  {
    name: 'post-summary-launch-evidence-refresh-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryLaunchEvidenceRefreshSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.postSummaryLaunchEvidenceRefreshSummary.sourceTrace[0].sourceArtifact =
          `${POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_SOURCE_ARTIFACT}.staleCommand`;
      });
    },
  },
  {
    name: 'post-summary-launch-evidence-refresh-does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'state.postSummaryLaunchEvidenceRefreshSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.postSummaryLaunchEvidenceRefresh.doesNotProveCount = 999;
        value.commercialReadinessState.postSummaryLaunchEvidenceRefreshSummary.doesNotProveCount = 999;
      });
    },
  },
  {
    name: 'post-summary-launch-evidence-refresh-does-not-prove-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_post_summary_launch_evidence_refresh_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '| Post-summary launch evidence refresh does-not-prove boundaries | 4 |',
          '| Post-summary launch evidence refresh does-not-prove boundaries | 0 |',
        ),
      );
    },
  },
  {
    name: 'post-summary-launch-evidence-refresh-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_post_summary_launch_evidence_refresh_source_trace',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '#### Post-Summary Launch Evidence Refresh Source Trace',
          '#### Post-Summary Launch Evidence Refresh Sources',
        ),
      );
    },
  },
  {
    name: 'full-local-approval-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.fullLocalApprovalPackageSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.fullLocalApprovalPackageSummary.status =
          'approved_for_execution';
      });
    },
  },
  {
    name: 'missing-full-local-approval-summary-fails',
    expectedCode: 1,
    expectedText: 'state.fullLocalApprovalPackageSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.fullLocalApprovalPackageSummary;
      });
    },
  },
  {
    name: 'post-summary-full-local-command-drift-fails',
    expectedCode: 1,
    expectedText: 'summary.postSummaryFullLocalApprovalPackage.command',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.postSummaryFullLocalApprovalPackage.command =
          'node scripts/stale-full-local-approval-package.mjs';
      });
    },
  },
  {
    name: 'full-local-approval-source-artifact-drift-fails',
    expectedCode: 1,
    expectedText: 'state.sourceArtifacts.fullLocalApprovalPackage',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.sourceArtifacts.fullLocalApprovalPackage =
          'docs/commercialization/stale-full-local-approval.json';
      });
    },
  },
  {
    name: 'full-local-approval-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_full_local_approval_summary_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '| Execution approved | `no` |',
          '| Execution approved | `yes` |',
        ),
      );
    },
  },
  {
    name: 'full-local-approval-does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'state.fullLocalApprovalPackageSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.fullLocalApprovalPackageSummary.doesNotProveCount = 999;
        value.postSummaryFullLocalApprovalPackage.doesNotProveCount = 999;
      });
    },
  },
  {
    name: 'full-local-approval-does-not-prove-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_full_local_approval_summary_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          /(\n### Full-Local Approval Package Summary[\s\S]*?\| Does-not-prove boundaries \| )\d+( \|)/,
          (_match, prefix, suffix) => `${prefix}999${suffix}`,
        ),
      );
    },
  },
  {
    name: 'full-local-approval-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.fullLocalApprovalPackageSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.fullLocalApprovalPackageSummary.sourceTrace;
        delete value.commercialReadinessState.fullLocalApprovalPackageSummary.sourceTraceCount;
        delete value.commercialReadinessState.fullLocalApprovalPackageSummary.sourceTraceBoundary;
      });
    },
  },
  {
    name: 'full-local-approval-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.fullLocalApprovalPackageSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.fullLocalApprovalPackageSummary.sourceTrace[0].sourceArtifact =
          `${FULL_LOCAL_APPROVAL_PACKAGE_SOURCE_ARTIFACT}.staleCommand`;
      });
    },
  },
  {
    name: 'full-local-approval-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_full_local_approval_source_trace',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace('#### Full-Local Approval Source Trace', '#### Full-Local Approval Sources'),
      );
    },
  },
  {
    name: 'root-step-count-drift-fails',
    expectedCode: 1,
    expectedText: 'summary.stepCount',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.stepCount = 999;
      });
    },
  },
  {
    name: 'root-failed-step-count-drift-fails',
    expectedCode: 1,
    expectedText: 'summary.failedStepCount',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.failedStepCount = 999;
      });
    },
  },
  {
    name: 'root-does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'summary.doesNotProveCount',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.doesNotProveCount = 999;
      });
    },
  },
  {
    name: 'root-counts-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_root_counts_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          /(\n## Counts[\s\S]*?\| Does-not-prove boundaries \| )\d+( \|)/,
          (_match, prefix, suffix) => `${prefix}999${suffix}`,
        ),
      );
    },
  },
  {
    name: 'closeout-accepted-live-count-drift-fails',
    expectedCode: 1,
    expectedText: 'closeout.acceptedLiveGateCount',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON, (value) => {
        value.acceptedLiveGateCount = 999;
      });
    },
  },
  {
    name: 'closeout-owner-gate-closeout-count-drift-fails',
    expectedCode: 1,
    expectedText: 'closeout.ownerGateCloseoutSummaryCount',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON, (value) => {
        value.ownerGateCloseoutSummaryCount = 999;
      });
    },
  },
  {
    name: 'closeout-step-count-drift-fails',
    expectedCode: 1,
    expectedText: 'closeout.stepCount',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON, (value) => {
        value.stepCount = 999;
      });
    },
  },
  {
    name: 'closeout-failed-step-count-drift-fails',
    expectedCode: 1,
    expectedText: 'closeout.failedStepCount',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON, (value) => {
        value.failedStepCount = 999;
      });
    },
  },
  {
    name: 'closeout-wrote-count-drift-fails',
    expectedCode: 1,
    expectedText: 'closeout.wroteCount',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON, (value) => {
        value.wroteCount = 999;
      });
    },
  },
  {
    name: 'missing-operational-access-summary-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary
          .operationalAccessPrerequisiteSummary;
      });
    },
  },
  {
    name: 'handoff-operational-access-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_HANDOFF_JSON, (value) => {
        value.operationalAccessPrerequisites[0].nextCommand = 'npm run stale-live-closeout';
      });
    },
  },
  {
    name: 'completion-drill-operational-access-drift-fails',
    expectedCode: 1,
    expectedText: 'completionDrill.operationalAccessPrerequisites',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_COMPLETION_DRILL_JSON, (value) => {
        value.operationalAccessPrerequisites[0].sourceArtifact =
          'docs/commercialization/stale-live-closeout.json';
      });
    },
  },
  {
    name: 'missing-owner-evidence-execution-summary-fails',
    expectedCode: 1,
    expectedText: 'state.ownerEvidenceExecutionSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary;
      });
    },
  },
  {
    name: 'owner-action-queue-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerActionQueueSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerActionQueueSummary.rows[0].nextCommand = 'stale next command';
      });
    },
  },
  {
    name: 'missing-owner-action-queue-summary-fails',
    expectedCode: 1,
    expectedText: 'state.ownerActionQueueSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerActionQueueSummary;
      });
    },
  },
  {
    name: 'owner-action-summary-primary-source-artifact-missing-fails',
    expectedCode: 1,
    expectedText: 'state.ownerActionQueueSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerActionQueueSummary.sourceArtifact;
      });
    },
  },
  {
    name: 'owner-action-summary-primary-source-artifact-stale-fails',
    expectedCode: 1,
    expectedText: 'state.ownerActionQueueSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerActionQueueSummary.sourceArtifact =
          'docs/commercialization/stale-remediation-gates.json#ownerActionQueue';
      });
    },
  },
  {
    name: 'owner-action-summary-primary-source-artifact-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_owner_action_source_trace_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          `| Primary source artifact | \`${OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT}\` |`,
          '| Primary source artifact | `docs/commercialization/stale-remediation-gates.json#ownerActionQueue` |',
        ),
      );
    },
  },
  {
    name: 'owner-action-queue-detail-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerActionQueueSummary',
    mutate(root) {
      updateJson(root, REMEDIATION_EXTERNAL_GATES_JSON, (value) => {
        value.ownerActionQueue[0].ownerPrepCommand = 'stale prep command';
      });
    },
  },
  {
    name: 'owner-action-source-artifact-drift-fails',
    expectedCode: 1,
    expectedText: 'state.ownerActionQueueSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerActionQueueSummary.rows[0].sourceArtifacts.handoff =
          'docs/commercialization/stale-owner-handoff.json#ownerActionRows.manual_wcag_evidence';
      });
    },
  },
  {
    name: 'owner-action-row-primary-source-artifact-missing-fails',
    expectedCode: 1,
    expectedText: 'state.ownerActionQueueSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerActionQueueSummary.rows[0].sourceArtifact;
      });
    },
  },
  {
    name: 'owner-action-row-primary-source-artifact-stale-fails',
    expectedCode: 1,
    expectedText: 'state.ownerActionQueueSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerActionQueueSummary.rows[0].sourceArtifact =
          'docs/commercialization/stale-remediation-gates.json#ownerActionQueue.manual_wcag_evidence';
      });
    },
  },
  {
    name: 'missing-owner-action-source-artifacts-fails',
    expectedCode: 1,
    expectedText: 'state.ownerActionQueueSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerActionQueueSummary.rows[0].sourceArtifacts;
      });
    },
  },
  {
    name: 'owner-action-source-trace-missing-fails',
    expectedCode: 1,
    expectedText: 'state.ownerActionQueueSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerActionQueueSummary.sourceTrace;
      });
    },
  },
  {
    name: 'owner-action-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'state.ownerActionQueueSummary',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerActionQueueSummary.sourceTrace[0].sourceArtifacts.handoff =
          'docs/commercialization/stale-owner-handoff.json#ownerActionRows.manual_wcag_evidence';
      });
    },
  },
  {
    name: 'owner-action-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_owner_action_source_trace',
    mutate(root) {
      const expectedRow = `| manual_wcag_evidence | ${OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT}.manual_wcag_evidence | ${OWNER_ACTION_QUEUE_CLOSEOUT_SOURCE_ARTIFACT}.manual_wcag_evidence | ${OWNER_ACTION_QUEUE_HANDOFF_SOURCE_ARTIFACT}.manual_wcag_evidence | ${OWNER_ACTION_QUEUE_COMPLETION_DRILL_SOURCE_ARTIFACT}.manual_wcag_evidence |`;
      updateText(root, SUMMARY_MD, (source) =>
        source
          .replace('| Owner action source trace rows | 5 |', '| Owner action source trace rows | 0 |')
          .replace(
            expectedRow,
            expectedRow.replace(
              `${OWNER_ACTION_QUEUE_HANDOFF_SOURCE_ARTIFACT}.manual_wcag_evidence`,
              'docs/commercialization/stale-owner-handoff.json#ownerActionRows.manual_wcag_evidence',
            ),
          ),
      );
    },
  },
  {
    name: 'missing-owner-action-next-command-fails',
    expectedCode: 1,
    expectedText: 'remediation_owner_action_missing_nextCommand',
    mutate(root) {
      updateJson(root, REMEDIATION_EXTERNAL_GATES_JSON, (value) => {
        delete value.ownerActionQueue[0].nextCommand;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerActionQueueSummary.rows[0].nextCommand;
      });
    },
  },
  {
    name: 'owner-action-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_owner_action_queue_summary_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) => source.replace('| Next commands | 5 |', '| Next commands | 0 |'));
    },
  },
  {
    name: 'owner-action-row-primary-source-artifact-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_owner_action_queue_command_trace_row',
    mutate(root) {
      const expectedRow = `| manual_wcag_evidence | blocked_fixture_owner_evidence_required | live-proof | ${OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT}.manual_wcag_evidence | fixture owner-held boundary for manual_wcag_evidence | prepare manual_wcag_evidence | verify manual_wcag_evidence | 1 | 1 |`;
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          expectedRow,
          expectedRow.replace(
            `${OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT}.manual_wcag_evidence`,
            'docs/commercialization/stale-remediation-gates.json#ownerActionQueue.manual_wcag_evidence',
          ),
        ),
      );
    },
  },
  {
    name: 'owner-action-source-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_owner_action_source_trace',
    mutate(root) {
      const expectedRow = `| manual_wcag_evidence | ${OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT}.manual_wcag_evidence | ${OWNER_ACTION_QUEUE_CLOSEOUT_SOURCE_ARTIFACT}.manual_wcag_evidence | ${OWNER_ACTION_QUEUE_HANDOFF_SOURCE_ARTIFACT}.manual_wcag_evidence | ${OWNER_ACTION_QUEUE_COMPLETION_DRILL_SOURCE_ARTIFACT}.manual_wcag_evidence |`;
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          expectedRow,
          expectedRow.replace(
            `${OWNER_ACTION_QUEUE_HANDOFF_SOURCE_ARTIFACT}.manual_wcag_evidence`,
            'docs/commercialization/stale-owner-handoff.json#ownerActionRows.manual_wcag_evidence',
          ),
        ),
      );
    },
  },
  {
    name: 'owner-execution-by-gate-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_owner_evidence_execution_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace('| Gate-scoped owner prep actions | 7 |', '| Gate-scoped owner prep actions | 0 |'),
      );
    },
  },
  {
    name: 'operational-access-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_operational_access_prerequisite_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace('npm run verify:live-closeout-readiness', 'npm run stale-live-closeout-readiness'),
      );
    },
  },
  {
    name: 'operational-access-source-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_operational_access_source_trace_row',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          `${OWNER_EVIDENCE_COMPLETION_DRILL_JSON}#operationalAccessPrerequisites.live_closeout_supabase_access`,
          'docs/commercialization/stale-owner-evidence-completion-drill.json#operationalAccessPrerequisites.live_closeout_supabase_access',
        ),
      );
    },
  },
  {
    name: 'handoff-gate-drift-fails',
    expectedCode: 1,
    expectedText: 'handoff.remainingGateIds',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_HANDOFF_JSON, (value) => {
        value.remainingGateIds.pop();
      });
    },
  },
  {
    name: 'completion-drill-gate-drift-fails',
    expectedCode: 1,
    expectedText: 'completionDrill.requiredGateIds',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_COMPLETION_DRILL_JSON, (value) => {
        value.requiredGateIds.pop();
      });
    },
  },
  {
    name: 'completion-drill-packet-official-reference-missing-fails',
    expectedCode: 1,
    expectedText: 'completion_drill_packet_missing_official_references',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_COMPLETION_DRILL_JSON, (value) => {
        value.packetSummaries[0].officialReferenceCount = 0;
        value.packetSummaries[0].officialReferenceIds = [];
        value.packetSummaries[0].officialReferenceUrls = [];
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary.completionDrillCoverage
          .packetOfficialReferenceCounts.live_proof_run = 0;
      });
    },
  },
  {
    name: 'completion-drill-official-reference-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'completionDrill.officialReferenceUrls',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_COMPLETION_DRILL_JSON, (value) => {
        value.officialReferenceUrls = ['https://example.com/stale'];
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.ownerEvidenceExecutionSummary.completionDrillCoverage.officialReferenceUrls = [
          'https://example.com/stale',
        ];
      });
    },
  },
  {
    name: 'missing-handoff-command-sequence-fails',
    expectedCode: 1,
    expectedText: 'handoff_missing_command_sequence',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_HANDOFF_JSON, (value) => {
        delete value.commandSequence;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary.handoffCoverage.commandSequence;
      });
    },
  },
  {
    name: 'missing-completion-drill-rows-fails',
    expectedCode: 1,
    expectedText: 'completion_drill_missing_completion_rows',
    mutate(root) {
      updateJson(root, OWNER_EVIDENCE_COMPLETION_DRILL_JSON, (value) => {
        delete value.completionRows;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.ownerEvidenceExecutionSummary.completionDrillCoverage
          .completionRowGateIds;
      });
    },
  },
  {
    name: 'missing-launch-pain-points-fails',
    expectedCode: 1,
    expectedText: 'launch_missing_pain_points',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_JSON, (value) => {
        value.pain_points = value.pain_points.slice(0, 9);
      });
    },
  },
  {
    name: 'missing-launch-gaps-fails',
    expectedCode: 1,
    expectedText: 'launch_missing_gaps',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_JSON, (value) => {
        delete value.gaps;
      });
    },
  },
  {
    name: 'missing-outreach-crm-export-fails',
    expectedCode: 1,
    expectedText: 'launch_missing_outreach_crm_export',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_JSON, (value) => {
        delete value.outreach_plan.crm_export;
      });
    },
  },
  {
    name: 'progress-update-drift-fails',
    expectedCode: 1,
    expectedText: 'state.progressUpdates',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.progressUpdates[0].phase = 'stale-progress-phase';
      });
    },
  },
  {
    name: 'missing-progress-updates-fails',
    expectedCode: 1,
    expectedText: 'launch_missing_progress_updates',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_JSON, (value) => {
        delete value.progress_updates;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.progressUpdates;
      });
    },
  },
  {
    name: 'bottleneck-log-drift-fails',
    expectedCode: 1,
    expectedText: 'state.bottleneckLog',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.bottleneckLog[0].root_cause = 'stale root cause';
      });
    },
  },
  {
    name: 'missing-bottleneck-log-fails',
    expectedCode: 1,
    expectedText: 'launch_missing_bottleneck_log',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_JSON, (value) => {
        delete value.bottleneck_log;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.bottleneckLog;
      });
    },
  },
  {
    name: 'implementation-decision-drift-fails',
    expectedCode: 1,
    expectedText: 'state.implementationDecisions',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.implementationDecisions[0].decision = 'stale implementation decision';
      });
    },
  },
  {
    name: 'missing-implementation-decisions-fails',
    expectedCode: 1,
    expectedText: 'launch_missing_implementation_decisions',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_JSON, (value) => {
        delete value.implementation_decisions;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.implementationDecisions;
      });
    },
  },
  {
    name: 'rejected-variant-drift-fails',
    expectedCode: 1,
    expectedText: 'state.rejectedVariants',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.rejectedVariants[0].variant = 'stale rejected variant';
      });
    },
  },
  {
    name: 'missing-rejected-variants-fails',
    expectedCode: 1,
    expectedText: 'launch_missing_rejected_variants',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_JSON, (value) => {
        delete value.rejected_variants;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.rejectedVariants;
      });
    },
  },
  {
    name: 'code-optimization-review-drift-fails',
    expectedCode: 1,
    expectedText: 'state.codeOptimizationReviews',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.codeOptimizationReviews[0].target_task =
          'stale code optimization review';
      });
    },
  },
  {
    name: 'missing-code-optimization-reviews-fails',
    expectedCode: 1,
    expectedText: 'launch_missing_code_optimization_reviews',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_JSON, (value) => {
        delete value.code_optimization_reviews;
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.codeOptimizationReviews;
      });
    },
  },
  {
    name: 'markdown-boundary-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_text',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          'A passed repo-local verification summary does not upgrade the launch decision',
          'A passed repo-local verification summary upgrades the launch decision',
        ),
      );
    },
  },
  {
    name: 'commercial-ready-overclaim-open-gates-fails',
    expectedCode: 1,
    expectedText: 'commercial_ready_overclaim_with_open_owner_gates',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_JSON, (value) => {
        value.launch_decision = 'commercial-ready';
      });
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.launchDecision = 'commercial-ready';
      });
    },
  },
];

for (const testCase of cases) {
  assertCase(
    testCase.name,
    testCase.mutate,
    testCase.expectedCode,
    testCase.expectedText,
    testCase.gateIds ?? GATE_IDS,
  );
}

console.log(`Commercial summary launch-readiness alignment fixture verification passed: ${cases.length} cases.`);
