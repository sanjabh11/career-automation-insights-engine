#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_STEP_TIMEOUT_MS = parsePositiveInteger(process.env.COMMERCIAL_VERIFY_STEP_TIMEOUT_MS, 5 * 60 * 1000);
const BUILD_STEP_TIMEOUT_MS = parsePositiveInteger(process.env.COMMERCIAL_VERIFY_BUILD_TIMEOUT_MS, 10 * 60 * 1000);
const BROWSER_STEP_TIMEOUT_MS = parsePositiveInteger(process.env.COMMERCIAL_VERIFY_BROWSER_TIMEOUT_MS, 12 * 60 * 1000);
const NETWORK_STEP_TIMEOUT_MS = parsePositiveInteger(process.env.COMMERCIAL_VERIFY_NETWORK_TIMEOUT_MS, 10 * 60 * 1000);
const LIVE_STEP_TIMEOUT_MS = parsePositiveInteger(process.env.COMMERCIAL_VERIFY_LIVE_TIMEOUT_MS, 5 * 60 * 1000);
const AUDIT_STEP_TIMEOUT_MS = parsePositiveInteger(process.env.COMMERCIAL_VERIFY_AUDIT_TIMEOUT_MS, 3 * 60 * 1000);
const TERMINATION_GRACE_MS = parsePositiveInteger(process.env.COMMERCIAL_VERIFY_TERMINATION_GRACE_MS, 5 * 1000);
const COMMERCIAL_VERIFICATION_SUMMARY_JSON =
  'docs/commercialization/commercial-verification-summary-latest.json';
const COMMERCIAL_VERIFICATION_SUMMARY_MD =
  'docs/commercialization/commercial-verification-summary-latest.md';
const COMMERCIAL_VERIFICATION_SUMMARY_SCHEMA =
  '2026-06-05.apo-commercial-verification-summary.v1';
const LAUNCH_EVIDENCE_JSON = 'docs/commercialization/launch-evidence-latest.json';
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
const LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON =
  'docs/commercialization/live-proof-run-packet-source-audit-latest.json';
const LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON =
  'docs/commercialization/live-closeout-access-source-audit-latest.json';
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
const VERIFICATION_SUMMARY_BOUNDARY =
  'This summary records the repo-local commercial verification command invocation only. It does not prove owner-held evidence, live revenue, partner commitments, customer outcomes, legal compliance, WCAG conformance, production uptime, ignored-file hygiene, untracked file content safety beyond included secret/redaction scanners, or optional live/network/accessibility/browser-journey gates that were not included in this invocation.';
const VERIFICATION_SUMMARY_DOES_NOT_PROVE = [
  'owner-held Stripe, Supabase, customer, partner, outcome, accessibility-review, or credential evidence',
  'live MRR, three committed partners, documented outcomes, production calibration, or authenticated live artifact e2e completion',
  'legal compliance, WCAG conformance, employment-selection validity, production uptime, or buyer willingness to pay',
];
const POST_SUMMARY_COMMAND_SOURCE_TRACE_BOUNDARY =
  'This post-summary command-contract source trace identifies repo-generated command, artifact, fixture, approval, and rewrite anchors for post-summary release checks. It does not execute optional Browser/Computer, accessibility, network, full-local, live, payment, credential, outreach, worker, or owner-held gates.';
const POST_SUMMARY_ARTIFACT_REDACTION_STEP = {
  id: 'post-summary-artifact-redaction',
  label: 'Verify final commercial verification summary artifact redaction',
  command: ['node', 'scripts/verify-commercial-artifact-redaction.mjs', '--write'],
};
const POST_SUMMARY_REDACTION_ALIGNMENT_STEP = {
  id: 'post-summary-redaction-alignment',
  label: 'Verify final summary and redaction artifacts are semantically aligned',
  command: ['node', 'scripts/verify-commercial-summary-redaction-alignment.mjs'],
};
const POST_SUMMARY_REDACTION_FIXTURE_STEP = {
  id: 'post-summary-redaction-alignment-fixtures',
  label: 'Verify final summary redaction alignment failure fixtures',
  command: ['node', 'scripts/verify-commercial-summary-redaction-alignment-fixtures.mjs'],
};
const POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_STEP = {
  id: 'post-summary-launch-readiness-alignment',
  label: 'Verify final summary launch-readiness state aligns with owner/remediation ledgers',
  command: ['node', 'scripts/verify-commercial-summary-launch-readiness-alignment.mjs'],
};
const POST_SUMMARY_LAUNCH_READINESS_FIXTURE_STEP = {
  id: 'post-summary-launch-readiness-alignment-fixtures',
  label: 'Verify final summary launch-readiness alignment failure fixtures',
  command: ['node', 'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs'],
  timeoutMs: BUILD_STEP_TIMEOUT_MS,
};
const POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_STEP = {
  id: 'post-summary-launch-evidence-refresh',
  label: 'Refresh launch evidence from the passed commercial verification summary',
  command: ['node', 'scripts/generate-launch-evidence-manifest.mjs', '--write', '--validate'],
};
const POST_SUMMARY_FULL_LOCAL_APPROVAL_PACKAGE_STEP = {
  id: 'post-summary-full-local-approval-package',
  label: 'Verify full-local approval package remains plan-only before optional execution',
  command: ['node', 'scripts/verify-commercial-full-local-approval-package.mjs'],
};
const TYPECHECK_STEP = {
  id: 'typecheck',
  label: 'Run TypeScript no-emit check',
  command: ['npx', 'tsc', '--noEmit'],
  timeoutMs: BUILD_STEP_TIMEOUT_MS,
};
const DIFF_HYGIENE_STEP = {
  id: 'diff-hygiene',
  label: 'Check tracked diff whitespace hygiene',
  command: ['git', 'diff', '--check'],
};

const DEFAULT_STEPS = [
  {
    id: 'index',
    label: 'Regenerate commercial codebase index',
    command: ['node', 'scripts/generate-commercialization-index.mjs'],
  },
  {
    id: 'worktree-hygiene',
    label: 'Verify commercial worktree untracked-path hygiene',
    command: ['node', 'scripts/verify-commercial-worktree-hygiene.mjs', '--write'],
  },
  {
    id: 'worktree-hygiene-fixtures',
    label: 'Verify commercial worktree hygiene failure fixtures',
    command: ['node', 'scripts/verify-commercial-worktree-hygiene-fixtures.mjs'],
  },
  {
    id: 'full-local-approval-package-fixtures',
    label: 'Verify full-local approval-package failure fixtures',
    command: ['node', 'scripts/verify-commercial-full-local-approval-package-fixtures.mjs'],
  },
  {
    id: 'commercial-artifact-redaction',
    label: 'Verify generated commercial artifacts do not expose secrets or owner-local metadata',
    command: ['node', 'scripts/verify-commercial-artifact-redaction.mjs', '--write'],
  },
  {
    id: 'trust',
    label: 'Verify commercial trust boundaries',
    command: ['node', 'scripts/verify-commercial-trust-boundaries.mjs'],
  },
  {
    id: 'report-evidence',
    label: 'Verify report evidence cards and proof-pack coverage',
    command: ['node', 'scripts/verify-report-evidence.mjs'],
  },
  {
    id: 'proof-visibility-ui',
    label: 'Verify proof visibility UI surfaces',
    command: ['node', 'scripts/verify-proof-visibility-ui.mjs'],
  },
  {
    id: 'phase-e-commercial-validation',
    label: 'Verify Phase E commercial validation instrumentation and owner-evidence gates',
    command: ['node', 'scripts/verify-phase-e-commercial-validation.mjs'],
  },
  {
    id: 'supabase-function-governance',
    label: 'Verify Supabase function governance and launch readiness',
    command: ['node', 'scripts/verify-supabase-function-governance.mjs'],
  },
  {
    id: 'onet-task-ratings',
    label: 'Verify O*NET Task Ratings ingest boundary',
    command: ['node', 'scripts/verify-onet-task-ratings-ingest.mjs'],
  },
  {
    id: 'deployment-packet',
    label: 'Generate live Supabase deployment proof packet',
    command: ['node', 'scripts/generate-commercial-supabase-deployment-packet.mjs'],
  },
  {
    id: 'live-closeout-readiness-status',
    label: 'Write redacted live closeout readiness status',
    command: ['node', 'scripts/verify-live-closeout-readiness.mjs', '--allow-incomplete', '--write'],
    timeoutMs: LIVE_STEP_TIMEOUT_MS,
  },
  {
    id: 'live-closeout-access-sources-fixtures',
    label: 'Verify live closeout access source-audit failure fixtures',
    command: ['node', 'scripts/verify-live-closeout-access-sources-fixtures.mjs'],
  },
  {
    id: 'data-provenance',
    label: 'Verify local data provenance checksums',
    command: [
      'node',
      'scripts/verify-commercial-data-provenance.mjs',
      '--write',
      '--require-source-verification',
    ],
  },
  {
    id: 'live-gate-evidence',
    label: 'Validate redacted live-gate evidence intake',
    command: ['node', 'scripts/verify-live-gate-evidence.mjs'],
  },
  {
    id: 'live-proof-run-packet',
    label: 'Generate owner live-proof run packet',
    command: ['node', 'scripts/generate-live-proof-run-packet.mjs', '--write'],
  },
  {
    id: 'live-proof-run-packet-alignment',
    label: 'Verify owner live-proof run packet aligns with source proof artifacts',
    command: ['node', 'scripts/verify-live-proof-run-packet-alignment.mjs'],
  },
  {
    id: 'live-proof-run-packet-alignment-fixtures',
    label: 'Verify live-proof run packet alignment failure fixtures',
    command: ['node', 'scripts/verify-live-proof-run-packet-alignment-fixtures.mjs'],
  },
  {
    id: 'commercial-evidence-records',
    label: 'Validate redacted commercial partner/outcome evidence records',
    command: ['node', 'scripts/verify-commercial-evidence-records.mjs', '--write'],
  },
  {
    id: 'commercial-evidence-records-fixtures',
    label: 'Verify commercial partner/outcome evidence records failure fixtures',
    command: ['node', 'scripts/verify-commercial-evidence-records-fixtures.mjs'],
  },
  {
    id: 'commercial-evidence-intake-packet',
    label: 'Generate commercial partner/outcome owner intake packet',
    command: ['node', 'scripts/generate-commercial-evidence-intake-packet.mjs', '--write'],
  },
  {
    id: 'commercial-evidence-intake-packet-alignment',
    label: 'Verify commercial evidence intake packet aligns with canonical records and closeout status',
    command: ['node', 'scripts/verify-commercial-evidence-intake-packet-alignment.mjs'],
  },
  {
    id: 'commercial-evidence-intake-packet-alignment-fixtures',
    label: 'Verify commercial evidence intake packet alignment failure fixtures',
    command: ['node', 'scripts/verify-commercial-evidence-intake-packet-alignment-fixtures.mjs'],
  },
  {
    id: 'manual-wcag-evidence',
    label: 'Validate redacted manual WCAG evidence metadata',
    command: ['node', 'scripts/verify-manual-wcag-evidence.mjs', '--write'],
  },
  {
    id: 'manual-wcag-evidence-fixtures',
    label: 'Verify manual WCAG evidence failure fixtures',
    command: ['node', 'scripts/verify-manual-wcag-evidence-fixtures.mjs'],
  },
  {
    id: 'manual-wcag-review-packet',
    label: 'Generate manual WCAG owner review packet',
    command: ['node', 'scripts/generate-manual-wcag-review-packet.mjs', '--write'],
  },
  {
    id: 'manual-wcag-review-packet-alignment',
    label: 'Verify manual WCAG review packet aligns with canonical verifier and closeout status',
    command: ['node', 'scripts/verify-manual-wcag-review-packet-alignment.mjs'],
  },
  {
    id: 'manual-wcag-review-packet-alignment-fixtures',
    label: 'Verify manual WCAG review packet alignment failure fixtures',
    command: ['node', 'scripts/verify-manual-wcag-review-packet-alignment-fixtures.mjs'],
  },
  {
    id: 'owner-evidence-prep',
    label: 'Inspect owner-evidence local prep status',
    command: ['node', 'scripts/prepare-owner-evidence-workspace.mjs'],
  },
  {
    id: 'owner-evidence-local-safety',
    label: 'Verify owner-evidence local files are ignored and untracked',
    command: ['node', 'scripts/verify-owner-evidence-local-safety.mjs', '--write'],
  },
  {
    id: 'owner-evidence-local-safety-fixtures',
    label: 'Verify owner-evidence local-safety failure fixtures',
    command: ['node', 'scripts/verify-owner-evidence-local-safety-fixtures.mjs'],
  },
  {
    id: 'owner-evidence-artifact-hasher-fixtures',
    label: 'Verify owner-evidence artifact hasher failure fixtures',
    command: ['node', 'scripts/verify-owner-evidence-artifact-hasher-fixtures.mjs'],
  },
  {
    id: 'owner-evidence-closeout-status',
    label: 'Write owner-evidence closeout status artifact',
    command: ['node', 'scripts/closeout-owner-evidence.mjs', '--allow-incomplete', '--write-status'],
  },
  {
    id: 'owner-evidence-prep-alignment',
    label: 'Verify owner-evidence prep readiness aligns with closeout status',
    command: ['node', 'scripts/verify-owner-evidence-prep-readiness-alignment.mjs'],
  },
  {
    id: 'owner-evidence-prep-alignment-fixtures',
    label: 'Verify owner-evidence prep-readiness alignment failure fixtures',
    command: ['node', 'scripts/verify-owner-evidence-prep-readiness-alignment-fixtures.mjs'],
  },
  {
    id: 'owner-evidence-fixtures',
    label: 'Verify redacted owner-evidence fixture completion and failure paths',
    command: ['node', 'scripts/verify-owner-evidence-fixture-path.mjs'],
  },
  {
    id: 'remediation-gates',
    label: 'Write APO remediation external gate ledger',
    command: ['node', 'scripts/verify-remediation-external-gates.mjs', '--write'],
  },
  {
    id: 'owner-action-queue',
    label: 'Verify Trust Center owner-action queue matches remediation ledger',
    command: ['node', 'scripts/verify-owner-action-queue-alignment.mjs'],
  },
  {
    id: 'owner-action-queue-fixtures',
    label: 'Verify Trust Center owner-action queue alignment failure fixtures',
    command: ['node', 'scripts/verify-owner-action-queue-alignment-fixtures.mjs'],
  },
  {
    id: 'owner-evidence-handoff',
    label: 'Generate owner-evidence handoff packet',
    command: ['node', 'scripts/generate-owner-evidence-handoff.mjs', '--write'],
  },
  {
    id: 'owner-evidence-completion-drill',
    label: 'Generate owner-evidence completion drill',
    command: ['node', 'scripts/generate-owner-evidence-completion-drill.mjs', '--write'],
  },
  {
    id: 'owner-evidence-completion-drill-alignment',
    label: 'Verify Trust Center completion drill aligns with generated artifact',
    command: ['node', 'scripts/verify-owner-evidence-completion-drill-alignment.mjs'],
  },
  {
    id: 'owner-evidence-completion-drill-alignment-fixtures',
    label: 'Verify Trust Center completion drill alignment failure fixtures',
    command: ['node', 'scripts/verify-owner-evidence-completion-drill-alignment-fixtures.mjs'],
  },
  {
    id: 'owner-evidence-handoff-alignment',
    label: 'Verify owner-evidence handoff aligns with canonical ledgers',
    command: ['node', 'scripts/verify-owner-evidence-handoff-alignment.mjs'],
  },
  {
    id: 'owner-evidence-handoff-alignment-fixtures',
    label: 'Verify owner-evidence handoff alignment failure fixtures',
    command: ['node', 'scripts/verify-owner-evidence-handoff-alignment-fixtures.mjs'],
  },
  {
    id: 'live-proof-closeout-command-alignment',
    label: 'Verify live-proof owner commands align across closeout surfaces',
    command: ['node', 'scripts/verify-live-proof-closeout-command-alignment.mjs'],
  },
  {
    id: 'live-proof-closeout-command-alignment-fixtures',
    label: 'Verify live-proof owner command alignment failure fixtures',
    command: ['node', 'scripts/verify-live-proof-closeout-command-alignment-fixtures.mjs'],
  },
  {
    id: 'owner-evidence-command-checklist-alignment',
    label: 'Verify Trust Center owner closeout command checklist aligns with handoff',
    command: ['node', 'scripts/verify-owner-evidence-command-checklist-alignment.mjs'],
  },
  {
    id: 'owner-evidence-command-checklist-alignment-fixtures',
    label: 'Verify Trust Center owner command checklist failure fixtures',
    command: ['node', 'scripts/verify-owner-evidence-command-checklist-alignment-fixtures.mjs'],
  },
  {
    id: 'owner-evidence-runbook-alignment',
    label: 'Verify owner-facing runbooks align with handoff',
    command: ['node', 'scripts/verify-owner-evidence-runbook-alignment.mjs'],
  },
  {
    id: 'owner-evidence-runbook-alignment-fixtures',
    label: 'Verify owner-facing runbook alignment failure fixtures',
    command: ['node', 'scripts/verify-owner-evidence-runbook-alignment-fixtures.mjs'],
  },
  {
    id: 'remediation-completion-audit',
    label: 'Write APO remediation completion audit',
    command: ['node', 'scripts/verify-remediation-completion-audit.mjs', '--write'],
  },
  {
    id: 'launch-evidence',
    label: 'Generate and validate commercial launch evidence manifest',
    command: ['node', 'scripts/generate-launch-evidence-manifest.mjs', '--write', '--validate'],
  },
  {
    id: 'launch-evidence-alignment',
    label: 'Verify launch evidence manifest aligns with owner/remediation ledgers',
    command: ['node', 'scripts/verify-launch-evidence-alignment.mjs'],
  },
  {
    id: 'launch-evidence-alignment-fixtures',
    label: 'Verify launch evidence alignment failure fixtures',
    command: ['node', 'scripts/verify-launch-evidence-alignment-fixtures.mjs'],
  },
  {
    id: 'launch-evidence-sources-fixtures',
    label: 'Verify launch evidence source-audit failure fixtures',
    command: ['node', 'scripts/verify-launch-evidence-sources-fixtures.mjs'],
  },
  {
    id: 'commercial-evidence-intake-sources-fixtures',
    label: 'Verify commercial evidence intake source-audit failure fixtures',
    command: ['node', 'scripts/verify-commercial-evidence-intake-sources-fixtures.mjs'],
  },
  {
    id: 'live-proof-run-packet-sources-fixtures',
    label: 'Verify live-proof run packet source-audit failure fixtures',
    command: ['node', 'scripts/verify-live-proof-run-packet-sources-fixtures.mjs'],
  },
  {
    id: 'manual-wcag-review-packet-sources-fixtures',
    label: 'Verify manual WCAG review packet source-audit failure fixtures',
    command: ['node', 'scripts/verify-manual-wcag-review-packet-sources-fixtures.mjs'],
  },
  {
    id: 'owner-evidence-completion-drill-sources-fixtures',
    label: 'Verify owner-evidence completion-drill source-audit failure fixtures',
    command: ['node', 'scripts/verify-owner-evidence-completion-drill-sources-fixtures.mjs'],
  },
  {
    id: 'lint-commercial',
    label: 'Lint commercial proof-pack files',
    command: ['node', 'scripts/lint-commercial-scope.mjs'],
  },
  {
    id: 'secret-hygiene',
    label: 'Verify tracked and untracked non-ignored files do not contain high-confidence secrets',
    command: ['node', 'scripts/verify-secret-hygiene.mjs'],
  },
  {
    id: 'repo-presentation',
    label: 'Verify repository presentation, license, and adoption-claim boundaries',
    command: ['node', 'scripts/verify-repo-presentation.mjs'],
  },
  TYPECHECK_STEP,
  DIFF_HYGIENE_STEP,
  {
    id: 'build',
    label: 'Build production bundle',
    command: ['npm', 'run', 'build'],
    timeoutMs: BUILD_STEP_TIMEOUT_MS,
  },
  {
    id: 'route-smoke',
    label: 'Smoke commercial route registration and app shell',
    command: ['node', 'scripts/smoke-commercial-routes.mjs'],
    timeoutMs: BROWSER_STEP_TIMEOUT_MS,
  },
];

const A11Y_STEPS = [
  {
    id: 'a11y',
    label: 'Run commercial responsive/accessibility smoke',
    command: ['node', 'scripts/verify-commercial-accessibility.mjs'],
    timeoutMs: BROWSER_STEP_TIMEOUT_MS,
  },
];

const SOURCE_REGISTRY_STEP = {
  id: 'sources',
  label: 'Fetch and verify official source registry pages',
  command: ['node', 'scripts/verify-source-manifest.mjs', '--write'],
  timeoutMs: NETWORK_STEP_TIMEOUT_MS,
};

const NETWORK_STEPS = [
  SOURCE_REGISTRY_STEP,
  {
    id: 'launch-evidence-sources',
    label: 'Fetch and verify launch evidence source URLs',
    command: ['node', 'scripts/verify-launch-evidence-sources.mjs', '--fetch', '--write'],
    timeoutMs: NETWORK_STEP_TIMEOUT_MS,
  },
  {
    id: 'commercial-evidence-intake-sources',
    label: 'Fetch and verify commercial evidence intake FTC source URLs',
    command: ['node', 'scripts/verify-commercial-evidence-intake-sources.mjs', '--fetch', '--write'],
    timeoutMs: NETWORK_STEP_TIMEOUT_MS,
  },
  {
    id: 'live-proof-run-packet-sources',
    label: 'Fetch and verify live proof run packet Stripe/Supabase/GitHub source URLs',
    command: ['node', 'scripts/verify-live-proof-run-packet-sources.mjs', '--fetch', '--write'],
    timeoutMs: NETWORK_STEP_TIMEOUT_MS,
  },
  {
    id: 'live-closeout-access-sources',
    label: 'Fetch and verify live closeout access Supabase/GitHub source URLs',
    command: ['node', 'scripts/verify-live-closeout-access-sources.mjs', '--fetch', '--write'],
    timeoutMs: NETWORK_STEP_TIMEOUT_MS,
  },
  {
    id: 'manual-wcag-review-packet-sources',
    label: 'Fetch and verify manual WCAG review packet W3C/WAI source URLs',
    command: ['node', 'scripts/verify-manual-wcag-review-packet-sources.mjs', '--fetch', '--write'],
    timeoutMs: NETWORK_STEP_TIMEOUT_MS,
  },
  {
    id: 'owner-evidence-completion-drill-sources',
    label: 'Fetch and verify owner-evidence completion-drill official source URLs',
    command: ['node', 'scripts/verify-owner-evidence-completion-drill-sources.mjs', '--fetch', '--write'],
    timeoutMs: NETWORK_STEP_TIMEOUT_MS,
  },
  {
    id: 'launch-evidence-source-refresh',
    label: 'Regenerate launch evidence with source-audit summary',
    command: ['node', 'scripts/generate-launch-evidence-manifest.mjs', '--write', '--validate'],
  },
  {
    id: 'audit',
    label: 'Run production dependency audit',
    command: ['npm', 'audit', '--omit=dev', '--audit-level=high'],
    timeoutMs: AUDIT_STEP_TIMEOUT_MS,
  },
];

const LIVE_SUPABASE_STEPS = [
  {
    id: 'live-supabase',
    label: 'Verify live Supabase commercial review/deletion boundaries',
    command: ['node', 'scripts/verify-commercial-live-supabase.mjs', '--write'],
    timeoutMs: LIVE_STEP_TIMEOUT_MS,
  },
];

const LIVE_ONET_STEPS = [
  {
    id: 'live-onet-task-ratings',
    label: 'Verify live Supabase O*NET Task Ratings schema and row proof',
    command: ['node', 'scripts/verify-onet-task-ratings-live.mjs', '--write'],
    timeoutMs: LIVE_STEP_TIMEOUT_MS,
  },
];

const LIVE_RESUME_PARSER_STEPS = [
  {
    id: 'live-resume-parser',
    label: 'Verify live parse-resume Edge Function parser receipts',
    command: ['node', 'scripts/verify-resume-parser-live.mjs', '--write'],
    timeoutMs: LIVE_STEP_TIMEOUT_MS,
  },
];

const JOURNEY_STEPS = [
  {
    id: 'browser-journey',
    label: 'Run full commercial browser journey',
    command: ['node', 'scripts/verify-commercial-browser.mjs'],
    timeoutMs: BROWSER_STEP_TIMEOUT_MS,
  },
];

let activeChild = null;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatDuration(ms) {
  if (ms >= 60_000) {
    return `${(ms / 60_000).toFixed(1)}m`;
  }

  return `${(ms / 1000).toFixed(1)}s`;
}

function formatCommand(command) {
  return command
    .map((part) => (/\s/.test(part) ? JSON.stringify(part) : part))
    .join(' ');
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

function buildPostSummaryCommandSourceTrace(sourceArtifact, entries) {
  return entries.map(({ key, value, boundary = '' }) => ({
    key,
    value: sourceTraceValue(value),
    sourceArtifact: `${sourceArtifact}.${key}`,
    boundary,
  }));
}

function resultStatus(result, overallStatus) {
  if (!result) {
    return overallStatus === 'running' ? 'pending' : 'not_run';
  }

  if (result.code === 0) {
    return 'passed';
  }

  if (result.timedOut) {
    return 'timed_out';
  }

  return 'failed';
}

function idsForSteps(steps) {
  return steps.map((step) => step.id);
}

function allStepIdsPassed(results, ids) {
  const resultById = new Map(results.map((result) => [result.id, result]));
  return ids.every((id) => resultById.get(id)?.code === 0);
}

function readJsonArtifact(relativePath) {
  if (!existsSync(relativePath)) {
    return { ok: false, missing: true, value: null };
  }

  try {
    return { ok: true, missing: false, value: JSON.parse(readFileSync(relativePath, 'utf8')) };
  } catch (error) {
    return { ok: false, missing: false, error: error.message, value: null };
  }
}

function arraysEqual(left = [], right = []) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function completionGateIds(completionAudit) {
  return (completionAudit?.remainingExternalGates || []).map((gate) => gate.id);
}

function expectedLaunchDecision(ownerCloseout, completionAudit) {
  const ownerComplete = ownerCloseout?.goalComplete === true;
  const completionComplete = completionAudit?.goalComplete === true;
  const noRemainingOwnerGates = (ownerCloseout?.remainingGateIds || []).length === 0;
  const noRemainingCompletionGates = completionGateIds(completionAudit).length === 0;
  return ownerComplete && completionComplete && noRemainingOwnerGates && noRemainingCompletionGates
    ? 'sellable-with-caveats'
    : 'pilot-only';
}

function countTruthyValues(value = {}) {
  return Object.values(value).filter((item) => item !== null && item !== undefined && item !== '')
    .length;
}

function buildLaunchEvidenceSummarySourceTrace(summary) {
  const sourceAudit = summary.fixReportCoverage?.sourceAuditStatus
    ? LAUNCH_SOURCE_AUDIT_SOURCE_ARTIFACT
    : null;
  return [
    {
      coverage: 'scores',
      metricCount: Object.keys(summary.scores || {}).length,
      sourceArtifact: `${LAUNCH_EVIDENCE_JSON}#scores`,
      sourceArtifacts: {
        scores: `${LAUNCH_EVIDENCE_JSON}#scores`,
      },
      sourceArtifactCount: 1,
    },
    {
      coverage: 'deliverableCounts',
      metricCount: Object.keys(summary.deliverableCounts || {}).length,
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
      metricCount: Object.keys(summary.requiredOutputTableCounts || {}).length,
      sourceArtifact: `${LAUNCH_EVIDENCE_JSON}#required_output_table_counts`,
      sourceArtifacts: {
        requiredOutputTableCounts: `${LAUNCH_EVIDENCE_JSON}#required_output_table_counts`,
      },
      sourceArtifactCount: 1,
    },
    {
      coverage: 'outreachCoverage',
      metricCount: Object.keys(summary.outreachCoverage || {}).length,
      sourceArtifact: `${LAUNCH_EVIDENCE_JSON}#outreach_plan`,
      sourceArtifacts: {
        outreachPlan: `${LAUNCH_EVIDENCE_JSON}#outreach_plan`,
        crmExport: `${LAUNCH_EVIDENCE_JSON}#outreach_plan.crm_export`,
        crmJson: summary.outreachCoverage?.crmExport?.artifactJson || null,
        crmCsv: summary.outreachCoverage?.crmExport?.artifactCsv || null,
      },
      sourceArtifactCount: countTruthyValues({
        outreachPlan: `${LAUNCH_EVIDENCE_JSON}#outreach_plan`,
        crmExport: `${LAUNCH_EVIDENCE_JSON}#outreach_plan.crm_export`,
        crmJson: summary.outreachCoverage?.crmExport?.artifactJson || null,
        crmCsv: summary.outreachCoverage?.crmExport?.artifactCsv || null,
      }),
    },
    {
      coverage: 'fixReportCoverage',
      metricCount: Object.keys(summary.fixReportCoverage || {}).length,
      sourceArtifact: `${LAUNCH_EVIDENCE_JSON}#fix_report`,
      sourceArtifacts: {
        fixReport: `${LAUNCH_EVIDENCE_JSON}#fix_report`,
        unresolvedBlockers: `${LAUNCH_EVIDENCE_JSON}#fix_report.unresolved_blockers`,
        sourceAudit: sourceAudit,
        releaseGateCommands: `${LAUNCH_EVIDENCE_JSON}#fix_report.release_gate_commands`,
      },
      sourceArtifactCount: countTruthyValues({
        fixReport: `${LAUNCH_EVIDENCE_JSON}#fix_report`,
        unresolvedBlockers: `${LAUNCH_EVIDENCE_JSON}#fix_report.unresolved_blockers`,
        sourceAudit,
        releaseGateCommands: `${LAUNCH_EVIDENCE_JSON}#fix_report.release_gate_commands`,
      }),
    },
  ];
}

function buildLaunchEvidenceSummary(launch) {
  const outreachPlan = launch?.outreach_plan || {};
  const crmExport = outreachPlan.crm_export || {};
  const fixReport = launch?.fix_report || {};
  const sourceAudit = fixReport.source_audit || {};
  const releaseGateCommands = fixReport.release_gate_commands || {};
  const summary = {
    sourceArtifact: LAUNCH_EVIDENCE_JSON,
    sourceArtifacts: {
      launchEvidence: LAUNCH_EVIDENCE_JSON,
      scores: `${LAUNCH_EVIDENCE_JSON}#scores`,
      outreachPlan: `${LAUNCH_EVIDENCE_JSON}#outreach_plan`,
      crmExport: `${LAUNCH_EVIDENCE_JSON}#outreach_plan.crm_export`,
      crmJson: crmExport.artifact_json || null,
      crmCsv: crmExport.artifact_csv || null,
      fixReport: `${LAUNCH_EVIDENCE_JSON}#fix_report`,
      sourceAudit: sourceAudit.status ? LAUNCH_SOURCE_AUDIT_SOURCE_ARTIFACT : null,
      requiredOutputTableCounts: `${LAUNCH_EVIDENCE_JSON}#required_output_table_counts`,
    },
    scores: launch?.scores || {},
    deliverableCounts: {
      gapCount: (launch?.gaps || []).length,
      painPointCount: (launch?.pain_points || []).length,
      targetCustomerCount: (launch?.target_customers || []).length,
      competitorSubstituteCount: (launch?.competitor_substitutes || []).length,
      implementationDecisionCount: (launch?.implementation_decisions || []).length,
      rejectedVariantCount: (launch?.rejected_variants || []).length,
      codeOptimizationReviewCount: (launch?.code_optimization_reviews || []).length,
      progressUpdateCount: (launch?.progress_updates || []).length,
      bottleneckLogCount: (launch?.bottleneck_log || []).length,
    },
    requiredOutputTableCounts: launch?.required_output_table_counts || {},
    outreachCoverage: {
      planWindowCount: (outreachPlan.thirty_sixty_ninety_plan || []).length,
      thirtyDayActionCount: (outreachPlan.thirty_days || []).length,
      sixtyDayActionCount: (outreachPlan.sixty_days || []).length,
      ninetyDayActionCount: (outreachPlan.ninety_days || []).length,
      objectionHandlingCount: (outreachPlan.objection_handling || []).length,
      objectionHandlingMatrixCount: (outreachPlan.objection_handling_matrix || []).length,
      hasEmailScript: Boolean(outreachPlan.email_script),
      hasLinkedInScript: Boolean(outreachPlan.linkedin_script),
      hasDemoNarrative: Boolean(outreachPlan.demo_narrative),
      crmExport: {
        rowCount: crmExport.row_count ?? 0,
        schemaFieldCount: (crmExport.schema_fields || []).length,
        allowedStatusCount: (crmExport.allowed_statuses || []).length,
        artifactJson: crmExport.artifact_json || null,
        artifactCsv: crmExport.artifact_csv || null,
      },
    },
    fixReportCoverage: {
      ownerActionQueueCount: fixReport.owner_action_queue_count ?? null,
      ownerPrepCommandCount: fixReport.owner_prep_command_count ?? null,
      ownerPrepActionNeededCount: fixReport.owner_prep_action_needed_count ?? null,
      unresolvedBlockerCount: (fixReport.unresolved_blockers || []).length,
      unresolvedBlockers: fixReport.unresolved_blockers || [],
      approvalGateCount: (fixReport.approval_gates || []).length,
      checksRunCount: (fixReport.checks_run || []).length,
      sourceAuditStatus: sourceAudit.status || null,
      sourceAuditSourceCount: sourceAudit.source_count ?? null,
      releaseGateCommandIds: Object.keys(releaseGateCommands).filter((key) => key !== 'boundary'),
    },
    evidenceBoundary: LAUNCH_EVIDENCE_SUMMARY_EVIDENCE_BOUNDARY,
  };
  summary.sourceArtifactCount = countTruthyValues(summary.sourceArtifacts);
  summary.sourceTrace = buildLaunchEvidenceSummarySourceTrace(summary);
  summary.sourceTraceCount = summary.sourceTrace.length;
  summary.sourceTraceBoundary = LAUNCH_EVIDENCE_SUMMARY_SOURCE_TRACE_BOUNDARY;
  return summary;
}

function buildProofBucketSummary(launch) {
  const proofBuckets = launch?.proof_buckets || {};
  const bucketNames = Object.keys(proofBuckets);
  const countsByBucket = Object.fromEntries(
    bucketNames.map((bucketName) => [bucketName, (proofBuckets[bucketName] || []).length]),
  );
  const items = bucketNames.flatMap((bucketName) =>
    (proofBuckets[bucketName] || []).map((item, index) => ({
      bucket: bucketName,
      index,
      label: item.label || '',
      status: item.status || '',
      source: item.source || '',
      boundary: item.boundary || '',
    })),
  );
  const sourcePaths = [...new Set(items.map((item) => item.source).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
  const statusesByBucket = Object.fromEntries(
    bucketNames.map((bucketName) => [
      bucketName,
      (proofBuckets[bucketName] || []).reduce((statusCounts, item) => {
        const status = item.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
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
    sourceArtifactCount: countTruthyValues(sourceArtifacts),
    bucketNames,
    bucketCount: bucketNames.length,
    itemCount: items.length,
    countsByBucket,
    statusesByBucket,
    sourceCount: sourcePaths.length,
    sourcePaths,
    boundaryCount: items.filter((item) => item.boundary).length,
    hostedLiveItemCount: countsByBucket.hosted_live || 0,
    localItemCount: countsByBucket.local || 0,
    repoArtifactItemCount: countsByBucket.repo_artifact || 0,
    candidateShadowItemCount: countsByBucket.candidate_shadow || 0,
    roadmapItemCount: countsByBucket.roadmap || 0,
    items,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: PROOF_BUCKET_SOURCE_TRACE_BOUNDARY,
    evidenceBoundary: PROOF_BUCKET_EVIDENCE_BOUNDARY,
  };
}

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
const POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_SOURCE_ARTIFACT =
  `${COMMERCIAL_VERIFICATION_SUMMARY_JSON}#postSummaryLaunchReadinessAlignment`;
const POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_EXECUTION_ORDER =
  'after post-summary redaction alignment verifier';
const POST_SUMMARY_LAUNCH_READINESS_FIXTURE_EXECUTION_ORDER =
  'after post-summary launch-readiness alignment verifier';
const POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_BOUNDARY =
  'This verifier parses the final commercial verification summary, launch evidence manifest, manual WCAG review packet, owner closeout status, remediation completion audit, and remediation gate ledger only. It does not perform live checks or complete owner-held evidence gates.';
const POST_SUMMARY_LAUNCH_READINESS_FIXTURE_BOUNDARY =
  'This fixture verifier copies summary and launch-readiness source artifacts into temporary files, mutates those copies, and proves launch decision, owner gate, source path, and Markdown boundary drift fail closed. It writes no repo artifacts.';
const POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_DOES_NOT_PROVE = [
  'commercial-ready status',
  'owner-held live, payment, partner, outcome, manual WCAG, production, procurement, or legal evidence',
  'that optional Browser/Computer, accessibility, network, audit, full-local, payment, credential, outreach, or owner-held evidence gates ran',
  'external customer demand, revenue, partner commitments, documented outcomes, legal compliance, or production uptime',
];
const POST_SUMMARY_ARTIFACT_REDACTION_SOURCE_ARTIFACT =
  `${COMMERCIAL_VERIFICATION_SUMMARY_JSON}#postSummaryArtifactRedaction`;
const POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_SOURCE_ARTIFACT =
  `${COMMERCIAL_VERIFICATION_SUMMARY_JSON}#postSummaryLaunchEvidenceRefresh`;
const POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_EXECUTION_ORDER =
  'after initial passed summary write and before final summary rewrite';
const POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_BOUNDARY =
  'This release-level state summary mirrors the post-summary launch-evidence refresh contract. It proves the refresh command is included after an initial passed summary and before the final summary rewrite; it does not execute optional live, network, browser, accessibility, payment, credential, outreach, or owner-held evidence gates.';
const POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_DOES_NOT_PROVE = [
  'commercial-ready status',
  'owner-held live, payment, partner, outcome, or manual WCAG evidence',
  'that optional Browser/Computer, accessibility, network, audit, full-local, outreach, or owner-held evidence gates ran',
  'external customer demand, revenue, procurement approval, legal compliance, or production uptime',
];
const POST_SUMMARY_ARTIFACT_REDACTION_ALIGNMENT_BOUNDARY =
  'This verifier parses the summary and redaction JSON artifacts only. It writes no generated docs, so it does not create an additional unscanned commercialization artifact.';
const POST_SUMMARY_ARTIFACT_REDACTION_FIXTURE_BOUNDARY =
  'This fixture verifier copies the summary and redaction artifacts into temporary files, mutates those copies, and proves stale timestamps, missing scanned files, nonzero findings, and missing alignment metadata fail closed. It writes no repo artifacts.';
const POST_SUMMARY_ARTIFACT_REDACTION_BOUNDARY =
  'This release-level summary mirrors the post-summary artifact-redaction contract. The redaction artifact is generated after this summary timestamp, so use the later redaction artifact as the pass/fail evidence. This summary does not prove absence of secrets outside generated commercialization artifacts.';
const POST_SUMMARY_ARTIFACT_REDACTION_DOES_NOT_PROVE = [
  'absence of secrets in git history, ignored local evidence files, screenshots, browser caches, external provider dashboards, CI secrets, or owner-held archives',
  'validity of live Stripe, Supabase, customer, partner, outcome, accessibility-review, or credential evidence',
  'commercial-ready status or owner approval to expose raw evidence',
];
const FULL_LOCAL_APPROVAL_PACKAGE_SOURCE_ARTIFACT =
  `${COMMERCIAL_VERIFICATION_SUMMARY_JSON}#postSummaryFullLocalApprovalPackage`;
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
const RELEASE_GATE_COVERAGE_SOURCE_ARTIFACT =
  `${COMMERCIAL_VERIFICATION_SUMMARY_JSON}#releaseGateCoverage`;
const RELEASE_GATE_COVERAGE_STATE_BOUNDARY =
  'This state summary mirrors releaseGateCoverage for the exact verifier invocation only. Gates with passedInThisInvocation=null were not included and require separate current command output before they can be cited as proof.';
const RELEASE_GATE_COVERAGE_STATE_DOES_NOT_PROVE = [
  'that optional Browser/Computer, accessibility, network, audit, full-local, live, payment, credential, outreach, or owner-held evidence gates ran when includedInThisInvocation is false',
  'current command output for gates with passedInThisInvocation=null',
  'commercial-ready status, owner-held evidence, live checkout, live MRR, partner commitments, documented outcomes, manual WCAG conformance, legal compliance, or production uptime',
];
const RELEASE_GATE_COVERAGE_SOURCE_TRACE_BOUNDARY =
  'This release-gate source trace identifies repo-generated releaseGateCoverage anchors for each configured gate in the current verifier invocation. It does not execute optional Browser/Computer, accessibility, network, full-local, live, payment, credential, outreach, or owner-held evidence gates.';

function buildOwnerPrepActionNeededByGate(closeout, gateIds) {
  const ownerActionNeededByGate = closeout?.ownerEvidencePrep?.ownerActionNeededByGate || {};
  return Object.fromEntries(
    gateIds.map((gateId) => {
      const ownerActionNeeded = Array.isArray(ownerActionNeededByGate[gateId])
        ? ownerActionNeededByGate[gateId]
        : [];
      return [
        gateId,
        {
          gateId,
          ownerActionNeededCount: ownerActionNeeded.length,
          ownerActionNeeded,
          sourceArtifact: `${OWNER_PREP_ACTION_NEEDED_BY_GATE_SOURCE_ARTIFACT}.${gateId}`,
        },
      ];
    }),
  );
}

function buildOwnerPrepActionNeededByGateCoverage(ownerPrepActionNeededByGate, uniqueOwnerPrepActionNeededCount) {
  const gateScopedOwnerPrepActionCount = Object.values(ownerPrepActionNeededByGate).reduce(
    (sum, gateSummary) =>
      sum + (gateSummary.ownerActionNeededCount ?? gateSummary.ownerActionNeeded?.length ?? 0),
    0,
  );
  return {
    ownerPrepActionNeededGateCount: Object.keys(ownerPrepActionNeededByGate).length,
    gateScopedOwnerPrepActionCount,
    uniqueOwnerPrepActionNeededCount,
    sharedOwnerPrepActionCount:
      typeof uniqueOwnerPrepActionNeededCount === 'number'
        ? Math.max(gateScopedOwnerPrepActionCount - uniqueOwnerPrepActionNeededCount, 0)
        : null,
  };
}

function normalizeOperationalAccessPrerequisite(prerequisite) {
  return {
    id: prerequisite.id || '',
    label: prerequisite.label || '',
    track: prerequisite.track || '',
    status: prerequisite.status || '',
    sourceArtifact: prerequisite.sourceArtifact || '',
    ownerAction: prerequisite.ownerAction || '',
    ownerPrepCommand: prerequisite.ownerPrepCommand || '',
    nextCommand: prerequisite.nextCommand || '',
    blockingCheckIds: prerequisite.blockingCheckIds || [],
    acceptedWhen: prerequisite.acceptedWhen || '',
    evidenceBoundary: prerequisite.evidenceBoundary || '',
    doesNotProve: prerequisite.doesNotProve || [],
    rawEvidencePolicy: prerequisite.rawEvidencePolicy || '',
    repoDoesNotDo: prerequisite.repoDoesNotDo || '',
  };
}

function buildOperationalAccessPrerequisiteSummary(handoff, completionDrill) {
  const handoffPrerequisites = (handoff?.operationalAccessPrerequisites || []).map(
    normalizeOperationalAccessPrerequisite,
  );
  const completionDrillPrerequisites = (completionDrill?.operationalAccessPrerequisites || []).map(
    normalizeOperationalAccessPrerequisite,
  );
  const sourceTrace = buildOperationalAccessPrerequisiteSourceTrace(
    handoffPrerequisites,
    completionDrillPrerequisites,
  );
  const uniqueBlockingCheckIds = [
    ...new Set(handoffPrerequisites.flatMap((prerequisite) => prerequisite.blockingCheckIds || [])),
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
      (total, row) => total + (row.sourceArtifacts.blockingChecks || []).length,
      0,
    ),
    sourceTrace,
    sourceTraceBoundary: OWNER_OPERATIONAL_ACCESS_SOURCE_TRACE_BOUNDARY,
    boundary: OWNER_OPERATIONAL_ACCESS_PREREQUISITE_BOUNDARY,
    prerequisiteCount: handoffPrerequisites.length,
    handoffPrerequisiteCount: handoffPrerequisites.length,
    completionDrillPrerequisiteCount: completionDrillPrerequisites.length,
    prerequisiteIds: handoffPrerequisites.map((prerequisite) => prerequisite.id),
    statusesById: Object.fromEntries(
      handoffPrerequisites.map((prerequisite) => [prerequisite.id, prerequisite.status]),
    ),
    blockingCheckCount: uniqueBlockingCheckIds.length,
    uniqueBlockingCheckIds,
    prerequisites: handoffPrerequisites,
  };
}

function buildOperationalAccessPrerequisiteSourceTrace(handoffPrerequisites, completionDrillPrerequisites) {
  const completionDrillById = new Map(
    completionDrillPrerequisites.map((prerequisite) => [prerequisite.id, prerequisite]),
  );

  return handoffPrerequisites.map((prerequisite) => {
    const blockingCheckSourceArtifacts = (prerequisite.blockingCheckIds || []).map(
      (checkId) => `${OWNER_OPERATIONAL_ACCESS_LIVE_CLOSEOUT_SOURCE_ARTIFACT}.${checkId}`,
    );
    const sourceArtifacts = {
      handoff: `${OWNER_OPERATIONAL_ACCESS_PREREQUISITE_SOURCE_ARTIFACT}.${prerequisite.id}`,
      completionDrill: completionDrillById.has(prerequisite.id)
        ? `${OWNER_OPERATIONAL_ACCESS_COMPLETION_DRILL_SOURCE_ARTIFACT}.${prerequisite.id}`
        : '',
      liveCloseoutReadiness: OWNER_OPERATIONAL_ACCESS_LIVE_CLOSEOUT_SOURCE_ARTIFACT,
      blockingChecks: blockingCheckSourceArtifacts,
    };

    return {
      id: prerequisite.id,
      status: prerequisite.status,
      sourceArtifact: sourceArtifacts.handoff,
      sourceArtifacts,
      sourceArtifactCount:
        ['handoff', 'completionDrill', 'liveCloseoutReadiness'].filter((key) => sourceArtifacts[key])
          .length + blockingCheckSourceArtifacts.length,
    };
  });
}

function buildOwnerLocalSafetyStatus(localSafety) {
  const trackedSensitiveFileViolationCount = Array.isArray(localSafety?.trackedSensitiveFileViolations)
    ? localSafety.trackedSensitiveFileViolations.length
    : localSafety?.trackedSensitiveFileViolationCount ?? 0;
  const stagedSensitivePathViolationCount = Array.isArray(localSafety?.stagedSensitivePathViolations)
    ? localSafety.stagedSensitivePathViolations.length
    : localSafety?.stagedSensitivePathViolationCount ?? 0;
  const errorCount = Array.isArray(localSafety?.errors)
    ? localSafety.errors.length
    : localSafety?.errorCount ?? 0;
  const status = localSafety?.ok === true ? 'passed' : 'failed';
  const protectedPathCount = localSafety?.protectedPathCount ?? 0;
  const ignoredProtectedPathCount = localSafety?.ignoredProtectedPathCount ?? 0;
  const evidenceBoundary = localSafety?.evidenceBoundary || '';
  const doesNotProve = localSafety?.doesNotProve || [];
  const doesNotProveCount = localSafety?.doesNotProveCount ?? doesNotProve.length;
  const sourceTraceRows = [
    { key: 'status', value: status, sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_JSON}#ok` },
    {
      key: 'protectedPathCount',
      value: String(protectedPathCount),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_JSON}#protectedPathCount`,
    },
    {
      key: 'ignoredProtectedPathCount',
      value: String(ignoredProtectedPathCount),
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
      value: evidenceBoundary,
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_JSON}#evidenceBoundary`,
    },
  ];

  return {
    sourceArtifact: OWNER_EVIDENCE_LOCAL_SAFETY_JSON,
    status,
    ok: localSafety?.ok === true,
    protectedPathCount,
    ignoredProtectedPathCount,
    trackedSensitiveFileViolationCount,
    stagedSensitivePathViolationCount,
    errorCount,
    evidenceBoundary,
    doesNotProve,
    doesNotProveCount,
    sourceTraceCount: sourceTraceRows.length,
    sourceTrace: sourceTraceRows,
    sourceTraceBoundary: OWNER_LOCAL_SAFETY_SOURCE_TRACE_BOUNDARY,
  };
}

function buildOwnerLocalSafetyStatusSummary(localSafety, handoff, completionDrill) {
  const localSafetyStatus = buildOwnerLocalSafetyStatus(localSafety);
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
    handoffStatusMatchesLocalSafety:
      JSON.stringify(handoff?.localSafetyStatus || null) === JSON.stringify(localSafetyStatus),
    completionDrillStatusMatchesLocalSafety:
      JSON.stringify(completionDrill?.localSafetyStatus || null) === JSON.stringify(localSafetyStatus),
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: OWNER_LOCAL_SAFETY_SUMMARY_SOURCE_TRACE_BOUNDARY,
    boundary: OWNER_LOCAL_SAFETY_SUMMARY_BOUNDARY,
  };
}

function buildOwnerGateScoreboardSourceTrace(
  gateIds,
  closeout,
  completionAudit,
  remediationGates,
  handoff,
  completionDrill,
) {
  const closeoutQueueById = new Map((closeout?.ownerActionQueue || []).map((row) => [row.id, row]));
  const remediationCompletionById = new Map(
    (completionAudit?.remainingExternalGates || []).map((row) => [row.id, row]),
  );
  const remediationQueueById = new Map(
    (remediationGates?.ownerActionQueue || []).map((row) => [row.id, row]),
  );
  const handoffRowsByGateId = new Map(
    (handoff?.ownerActionRows || []).map((row) => [row.gateId, row]),
  );
  const completionRowsByGateId = new Map(
    (completionDrill?.completionRows || []).map((row) => [row.gateId, row]),
  );

  return gateIds.map((gateId) => {
    const closeoutRow = closeoutQueueById.get(gateId) || {};
    const remediationCompletionRow = remediationCompletionById.get(gateId) || {};
    const remediationQueueRow = remediationQueueById.get(gateId) || {};
    const handoffRow = handoffRowsByGateId.get(gateId) || {};
    const completionRow = completionRowsByGateId.get(gateId) || {};
    const sourceArtifacts = {
      scoreboard: `${OWNER_GATE_SCOREBOARD_SOURCE_ARTIFACT}.remainingGateIds.${gateId}`,
      remediationCompletion: remediationCompletionById.has(gateId)
        ? `${OWNER_GATE_SCOREBOARD_REMEDIATION_COMPLETION_SOURCE_ARTIFACT}.${gateId}`
        : '',
      remediationExternalGates: remediationQueueById.has(gateId)
        ? `${OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT}.${gateId}`
        : '',
      closeoutStatus: closeoutQueueById.has(gateId)
        ? `${OWNER_ACTION_QUEUE_CLOSEOUT_SOURCE_ARTIFACT}.${gateId}`
        : '',
      handoff: handoffRowsByGateId.has(gateId)
        ? `${OWNER_ACTION_QUEUE_HANDOFF_SOURCE_ARTIFACT}.${gateId}`
        : '',
      completionDrill: completionRowsByGateId.has(gateId)
        ? `${OWNER_ACTION_QUEUE_COMPLETION_DRILL_SOURCE_ARTIFACT}.${gateId}`
        : '',
    };

    return {
      gateId,
      status:
        remediationCompletionRow.status ||
        remediationQueueRow.status ||
        closeoutRow.status ||
        handoffRow.status ||
        completionRow.status ||
        '',
      sourceArtifact: sourceArtifacts.scoreboard,
      sourceArtifacts,
      sourceArtifactCount: Object.values(sourceArtifacts).filter(Boolean).length,
    };
  });
}

function buildRemediationCompletionSourceTrace(gateIds, completionAudit) {
  const completionById = new Map(
    (completionAudit?.remainingExternalGates || []).map((row) => [row.id, row]),
  );

  return gateIds.map((gateId) => {
    const row = completionById.get(gateId) || {};
    const sourceArtifact = completionById.has(gateId)
      ? `${OWNER_GATE_SCOREBOARD_REMEDIATION_COMPLETION_SOURCE_ARTIFACT}.${gateId}`
      : '';

    return {
      gateId,
      status: row.status || '',
      sourceArtifact,
      sourceArtifactCount: sourceArtifact ? 1 : 0,
    };
  });
}

function buildRemediationExternalGateSourceTrace(gateIds, remediationGates) {
  const remediationById = new Map(
    (remediationGates?.ownerActionQueue || []).map((row) => [row.id, row]),
  );

  return gateIds.map((gateId) => {
    const row = remediationById.get(gateId) || {};
    const sourceArtifact = remediationById.has(gateId)
      ? `${OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT}.${gateId}`
      : '';

    return {
      gateId,
      status: row.status || '',
      sourceBoundary: row.sourceBoundary || '',
      sourceArtifact,
      sourceArtifactCount: sourceArtifact ? 1 : 0,
    };
  });
}

function buildLaunchEvidenceBlockerSourceTrace(gateIds, launch, completionAudit, remediationGates) {
  const gapById = new Map(
    (launch?.gaps || []).map((row) => [row.gate_id || row.id, row]),
  );
  const unresolvedBlockerIds = new Set(launch?.fix_report?.unresolved_blockers || []);
  const completionById = new Map(
    (completionAudit?.remainingExternalGates || []).map((row) => [row.id, row]),
  );
  const remediationById = new Map(
    (remediationGates?.ownerActionQueue || []).map((row) => [row.id, row]),
  );

  return gateIds.map((gateId) => {
    const gap = gapById.get(gateId) || {};
    const completionRow = completionById.get(gateId) || {};
    const remediationRow = remediationById.get(gateId) || {};
    const sourceArtifacts = {
      launchGap: gapById.has(gateId)
        ? `${LAUNCH_EVIDENCE_GAPS_SOURCE_ARTIFACT}.${gateId}`
        : '',
      unresolvedBlocker: unresolvedBlockerIds.has(gateId)
        ? `${LAUNCH_EVIDENCE_UNRESOLVED_BLOCKERS_SOURCE_ARTIFACT}.${gateId}`
        : '',
      remediationCompletion: completionById.has(gateId)
        ? `${OWNER_GATE_SCOREBOARD_REMEDIATION_COMPLETION_SOURCE_ARTIFACT}.${gateId}`
        : '',
      remediationExternalGates: remediationById.has(gateId)
        ? `${OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT}.${gateId}`
        : '',
    };

    return {
      gateId,
      status: gap.status || remediationRow.status || completionRow.status || '',
      severity: gap.severity || '',
      sourceArtifact: sourceArtifacts.launchGap,
      sourceArtifacts,
      sourceArtifactCount: Object.values(sourceArtifacts).filter(Boolean).length,
    };
  });
}

function buildPostSummaryArtifactRedactionSummary(status = 'passed') {
  const resultArtifacts = {
    json: COMMERCIAL_ARTIFACT_REDACTION_JSON,
    markdown: COMMERCIAL_ARTIFACT_REDACTION_MD,
  };
  const alignmentVerifier = {
    command: formatCommand(POST_SUMMARY_REDACTION_ALIGNMENT_STEP.command),
    executionOrder: 'after post-summary artifact redaction scan',
    boundary: POST_SUMMARY_ARTIFACT_REDACTION_ALIGNMENT_BOUNDARY,
  };
  const fixtureVerifier = {
    command: formatCommand(POST_SUMMARY_REDACTION_FIXTURE_STEP.command),
    executionOrder: 'after post-summary launch-readiness alignment fixtures',
    boundary: POST_SUMMARY_ARTIFACT_REDACTION_FIXTURE_BOUNDARY,
  };
  const sourceTrace = buildPostSummaryCommandSourceTrace(
    POST_SUMMARY_ARTIFACT_REDACTION_SOURCE_ARTIFACT,
    [
      { key: 'command', value: formatCommand(POST_SUMMARY_ARTIFACT_REDACTION_STEP.command) },
      { key: 'executionOrder', value: 'after final commercial verification summary write' },
      { key: 'resultArtifacts', value: resultArtifacts },
      { key: 'alignmentVerifier', value: alignmentVerifier.command, boundary: alignmentVerifier.boundary },
      { key: 'fixtureVerifier', value: fixtureVerifier.command, boundary: fixtureVerifier.boundary },
    ],
  );

  return {
    sourceArtifact: POST_SUMMARY_ARTIFACT_REDACTION_SOURCE_ARTIFACT,
    status: status === 'passed' ? 'post_summary_scan_required' : 'not_included_until_summary_passes',
    command: formatCommand(POST_SUMMARY_ARTIFACT_REDACTION_STEP.command),
    executionOrder: 'after final commercial verification summary write',
    includedInThisInvocation: status === 'passed',
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

function buildPostSummaryLaunchReadinessAlignmentSummary(status = 'passed') {
  const fixtureVerifier = {
    command: formatCommand(POST_SUMMARY_LAUNCH_READINESS_FIXTURE_STEP.command),
    executionOrder: POST_SUMMARY_LAUNCH_READINESS_FIXTURE_EXECUTION_ORDER,
    boundary: POST_SUMMARY_LAUNCH_READINESS_FIXTURE_BOUNDARY,
  };
  const sourceTrace = buildPostSummaryCommandSourceTrace(
    POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_SOURCE_ARTIFACT,
    [
      { key: 'command', value: formatCommand(POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_STEP.command) },
      { key: 'executionOrder', value: POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_EXECUTION_ORDER },
      { key: 'fixtureVerifier', value: fixtureVerifier.command, boundary: fixtureVerifier.boundary },
    ],
  );

  return {
    sourceArtifact: POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_SOURCE_ARTIFACT,
    status:
      status === 'passed'
        ? 'included_after_post_summary_redaction_alignment'
        : 'pending_final_summary_alignment',
    command: formatCommand(POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_STEP.command),
    executionOrder: POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_EXECUTION_ORDER,
    includedInThisInvocation: status === 'passed',
    fixtureVerifier,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: POST_SUMMARY_COMMAND_SOURCE_TRACE_BOUNDARY,
    boundary: POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_BOUNDARY,
    doesNotProve: POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_DOES_NOT_PROVE,
    doesNotProveCount: POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_DOES_NOT_PROVE.length,
  };
}

function buildPostSummaryLaunchEvidenceRefreshSummary(status = 'passed') {
  const resultArtifacts = {
    json: LAUNCH_EVIDENCE_JSON,
    markdown: 'docs/commercialization/launch-evidence-latest.md',
  };
  const finalSummaryRewrite = {
    required: true,
    purpose:
      'Keep commercialReadinessState.progressUpdates, implementationDecisions, rejectedVariants, and codeOptimizationReviews in parity with refreshed launch evidence before post-summary redaction and launch-readiness alignment.',
  };
  const sourceTrace = buildPostSummaryCommandSourceTrace(
    POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_SOURCE_ARTIFACT,
    [
      { key: 'command', value: formatCommand(POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_STEP.command) },
      { key: 'executionOrder', value: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_EXECUTION_ORDER },
      { key: 'resultArtifacts', value: resultArtifacts },
      { key: 'finalSummaryRewrite', value: finalSummaryRewrite.purpose },
    ],
  );

  return {
    sourceArtifact: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_SOURCE_ARTIFACT,
    status: status === 'passed' ? 'included_after_initial_passed_summary' : 'pending_initial_passed_summary',
    command: formatCommand(POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_STEP.command),
    executionOrder: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_EXECUTION_ORDER,
    includedInThisInvocation: status === 'passed',
    resultArtifacts,
    finalSummaryRewrite,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: POST_SUMMARY_COMMAND_SOURCE_TRACE_BOUNDARY,
    boundary: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_BOUNDARY,
    doesNotProve: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_DOES_NOT_PROVE,
    doesNotProveCount: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_DOES_NOT_PROVE.length,
  };
}

function buildFullLocalApprovalPackageSummary(options) {
  const includedInThisInvocation = isDefaultCoreOnlyInvocation(options || {});
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
  const sourceTrace = buildPostSummaryCommandSourceTrace(
    FULL_LOCAL_APPROVAL_PACKAGE_SOURCE_ARTIFACT,
    [
      { key: 'command', value: formatCommand(POST_SUMMARY_FULL_LOCAL_APPROVAL_PACKAGE_STEP.command) },
      { key: 'executionOrder', value: FULL_LOCAL_APPROVAL_PACKAGE_EXECUTION_ORDER },
      { key: 'approvalRequiredBefore', value: approvalRequiredBefore },
      { key: 'optionalGateCommands', value: optionalGateCommands },
      { key: 'fixtureVerifier', value: fixtureVerifier.command, boundary: fixtureVerifier.boundary },
    ],
  );

  return {
    sourceArtifact: FULL_LOCAL_APPROVAL_PACKAGE_SOURCE_ARTIFACT,
    status: includedInThisInvocation ? 'approval_required_plan_only' : 'not_default_core_invocation',
    command: formatCommand(POST_SUMMARY_FULL_LOCAL_APPROVAL_PACKAGE_STEP.command),
    executionOrder: FULL_LOCAL_APPROVAL_PACKAGE_EXECUTION_ORDER,
    includedInThisInvocation,
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

function buildOwnerEvidenceExecutionSummary(closeout, handoff, completionDrill, localSafety) {
  const closeoutScoreboard = closeout?.ownerGateScoreboard || {};
  const failedStepIds = closeout?.failedStepIds || closeoutScoreboard.failedStepIds || [];
  const failedStepSourceTrace = closeoutFailedStepSourceTrace(closeout, failedStepIds);
  const nextCommandSourceTrace = closeoutNextCommandSourceTrace(closeout?.nextCommands || {});
  const statusArtifactSourceTrace = closeoutStatusArtifactSourceTrace(closeout?.statusArtifacts || {});
  const closeoutCoverageSourceTrace = ownerCloseoutCoverageSourceTrace(
    failedStepSourceTrace,
    nextCommandSourceTrace,
    statusArtifactSourceTrace,
  );
  const remainingGateIds = closeout?.remainingGateIds || closeoutScoreboard.remainingGateIds || [];
  const handoffRemainingGateIds = handoff?.remainingGateIds || [];
  const completionRequiredGateIds = completionDrill?.requiredGateIds || [];
  const handoffCommandSequence = handoff?.commandSequence || [];
  const completionCommandOrder = completionDrill?.recommendedCommandOrder || [];
  const handoffCommandSequenceSourceTrace = commandSequenceSourceTrace(
    handoffCommandSequence,
    OWNER_HANDOFF_COMMAND_SEQUENCE_SOURCE_ARTIFACT,
  );
  const completionCommandOrderSourceTrace = commandSequenceSourceTrace(
    completionCommandOrder,
    OWNER_COMPLETION_DRILL_COMMAND_ORDER_SOURCE_ARTIFACT,
  );
  const ownerActionRows = handoff?.ownerActionRows || [];
  const completionRows = completionDrill?.completionRows || [];
  const packetSummaries = completionDrill?.packetSummaries || [];
  const packetOfficialReferenceUrls = [
    ...new Set(packetSummaries.flatMap((packet) => packet.officialReferenceUrls || [])),
  ].sort((a, b) => a.localeCompare(b));
  const packetOfficialReferenceCounts = Object.fromEntries(
    packetSummaries.map((packet) => [packet.packetType, packet.officialReferenceCount ?? 0]),
  );
  const ownerPrepActionNeededByGate = buildOwnerPrepActionNeededByGate(closeout, remainingGateIds);
  const ownerPrepActionNeededByGateCoverage = buildOwnerPrepActionNeededByGateCoverage(
    ownerPrepActionNeededByGate,
    closeout?.ownerEvidencePrep?.ownerActionNeededCount ?? null,
  );

  return {
    status: closeoutScoreboard.status || completionDrill?.status || null,
    goalComplete:
      closeout?.goalComplete === true && handoff?.goalComplete === true && completionDrill?.goalComplete === true,
    gateIds: {
      remaining: remainingGateIds,
      handoffRemaining: handoffRemainingGateIds,
      completionRequired: completionRequiredGateIds,
    },
    ownerPrepActionNeededByGateSourceArtifact: OWNER_PREP_ACTION_NEEDED_BY_GATE_SOURCE_ARTIFACT,
    ownerPrepActionNeededByGateBoundary: OWNER_PREP_ACTION_NEEDED_BY_GATE_BOUNDARY,
    ownerPrepActionNeededByGateCoverage,
    ownerPrepActionNeededByGate,
    commandSequenceSourceTraceBoundary: OWNER_COMMAND_SEQUENCE_SOURCE_TRACE_BOUNDARY,
    operationalAccessPrerequisiteSummary: buildOperationalAccessPrerequisiteSummary(
      handoff,
      completionDrill,
    ),
    localSafetyStatusSummary: buildOwnerLocalSafetyStatusSummary(localSafety, handoff, completionDrill),
    closeoutCoverage: {
      ownerActionQueueCount: closeout?.ownerActionQueueCount ?? null,
      ownerActionNeededCount: closeout?.ownerActionNeededCount ?? null,
      ownerPrepActionNeededCount: closeout?.ownerEvidencePrep?.ownerActionNeededCount ?? null,
      failedStepCount: failedStepIds.length,
      failedStepIds,
      failedStepSourceArtifact: OWNER_CLOSEOUT_FAILED_STEPS_SOURCE_ARTIFACT,
      failedStepSourceTraceCount: failedStepSourceTrace.length,
      failedStepSourceTraceCommandCount: failedStepSourceTrace.filter((step) => step.command).length,
      failedStepSourceTrace,
      failedStepSourceTraceBoundary: OWNER_CLOSEOUT_FAILED_STEP_SOURCE_TRACE_BOUNDARY,
      nextCommandCount: Object.keys(closeout?.nextCommands || {}).length,
      nextCommandValueCount: nextCommandSourceTrace.reduce(
        (sum, row) => sum + (row.commands || []).length,
        0,
      ),
      nextCommandSourceArtifact: OWNER_CLOSEOUT_NEXT_COMMANDS_SOURCE_ARTIFACT,
      nextCommandSourceTraceCount: nextCommandSourceTrace.length,
      nextCommandSourceTrace,
      statusArtifactCount: Object.keys(closeout?.statusArtifacts || {}).length,
      statusArtifacts: closeout?.statusArtifacts || {},
      statusArtifactSourceArtifact: OWNER_CLOSEOUT_STATUS_ARTIFACTS_SOURCE_ARTIFACT,
      statusArtifactSourceTraceCount: statusArtifactSourceTrace.length,
      statusArtifactSourceTrace,
      sourceTraceCount: closeoutCoverageSourceTrace.length,
      sourceTrace: closeoutCoverageSourceTrace,
      nextCommandSourceTraceBoundary: OWNER_CLOSEOUT_NEXT_COMMAND_SOURCE_TRACE_BOUNDARY,
    },
    handoffCoverage: {
      ownerActionQueueCount: handoff?.ownerActionQueueCount ?? null,
      ownerActionRowCount: ownerActionRows.length,
      ownerActionGateIds: ownerActionRows.map((row) => row.gateId),
      commandSequenceCount: handoffCommandSequence.length,
      commandSequence: handoffCommandSequence,
      commandSequenceSourceArtifact: OWNER_HANDOFF_COMMAND_SEQUENCE_SOURCE_ARTIFACT,
      commandSequenceSourceTraceCount: handoffCommandSequenceSourceTrace.length,
      commandSequenceSourceTrace: handoffCommandSequenceSourceTrace,
      sourceTraceCount: handoffCommandSequenceSourceTrace.length,
      sourceTrace: handoffCommandSequenceSourceTrace,
      outputs: handoff?.outputs || {},
    },
    completionDrillCoverage: {
      status: completionDrill?.status || null,
      requiredGateCount: completionDrill?.requiredGateCount ?? completionRequiredGateIds.length,
      blockedGateCount: completionDrill?.blockedGateCount ?? null,
      ownerActionQueueCount: completionDrill?.ownerActionQueueCount ?? null,
      ownerActionNeededCount: completionDrill?.ownerActionNeededCount ?? null,
      packetCount: completionDrill?.packetCount ?? packetSummaries.length,
      packetTypes: packetSummaries.map((packet) => packet.packetType),
      officialReferenceCount: completionDrill?.officialReferenceCount ?? packetOfficialReferenceUrls.length,
      officialReferenceUrls: completionDrill?.officialReferenceUrls || packetOfficialReferenceUrls,
      packetOfficialReferenceCounts,
      matrixRowCount: completionDrill?.matrixRowCount ?? completionRows.length,
      completionRowGateIds: completionRows.map((row) => row.gateId),
      recommendedCommandCount: completionCommandOrder.length,
      recommendedCommandOrder: completionCommandOrder,
      recommendedCommandOrderSourceArtifact: OWNER_COMPLETION_DRILL_COMMAND_ORDER_SOURCE_ARTIFACT,
      recommendedCommandOrderSourceTraceCount: completionCommandOrderSourceTrace.length,
      recommendedCommandOrderSourceTrace: completionCommandOrderSourceTrace,
      sourceTraceCount: completionCommandOrderSourceTrace.length,
      sourceTrace: completionCommandOrderSourceTrace,
      outputArtifacts: completionDrill?.outputArtifacts || {},
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

function closeoutFailedStepSourceTrace(closeout, failedStepIds) {
  const stepsById = new Map((closeout?.steps || []).map((step) => [step.id, step]));
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

function buildOwnerActionQueueSummary(remediationGates, handoff, closeout, completionDrill) {
  const ownerActionQueue = remediationGates?.ownerActionQueue || [];
  const closeoutOwnerActionQueue = closeout?.ownerActionQueue || [];
  const ownerActionRows = handoff?.ownerActionRows || [];
  const completionRows = completionDrill?.completionRows || [];
  const handoffByGateId = new Map(ownerActionRows.map((row) => [row.gateId, row]));
  const rows = ownerActionQueue.map((item, index) => {
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
    status: remediationGates?.goalComplete === true ? 'owner_action_queue_complete' : 'owner_action_required',
    queueCount: ownerActionQueue.length,
    closeoutQueueCount: closeoutOwnerActionQueue.length,
    handoffRowCount: ownerActionRows.length,
    completionDrillRowCount: completionRows.length,
    gateIds: queueGateIds,
    sourceArtifact: ownerActionSummarySourceArtifacts.remediationExternalGates,
    sourceArtifacts: ownerActionSummarySourceArtifacts,
    sourceArtifactCount: Object.keys(ownerActionSummarySourceArtifacts).length,
    rowSourceArtifactCount: rows.reduce((total, row) => total + row.sourceArtifactCount, 0),
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    handoffOnlyGateIds: ownerActionRows
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

function buildLaunchSourceAuditCoverage(sourceAudit) {
  const sources = sourceAudit?.sources || [];
  const sourceTrace = sourceAuditSourceTrace(sources, LAUNCH_SOURCE_AUDIT_SOURCE_ARTIFACT);
  return {
    artifact: LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON,
    generatedAt: sourceAudit?.generatedAt || null,
    networkFetch: sourceAudit?.networkFetch ?? null,
    allPassed: sourceAudit?.allPassed ?? null,
    sourceCount: sourceAudit?.sourceCount ?? sources.length,
    passedCount: sourceAudit?.passedCount ?? sources.filter((source) => source.status === 'passed').length,
    failedCount: sourceAudit?.failedCount ?? sources.filter((source) => source.status !== 'passed').length,
    missingExpectationCount: sourceAudit?.missingExpectationCount ?? null,
    failedSourceUrls: sourceAudit?.failedSourceUrls || [],
    sourceUrls: sources.map((source) => source.url),
    usageContextCount: sources.reduce((total, source) => total + (source.usage?.usageContexts || []).length, 0),
    expectationCheckCount: sources.reduce((total, source) => total + (source.fetch?.evidence || []).length, 0),
    expectedTextMatchCount: sources.reduce(
      (total, source) => total + (source.fetch?.evidence || []).filter((item) => item.matched === true).length,
      0,
    ),
    fetchedSourceCount: sources.filter((source) => source.fetch?.attempted === true).length,
    sourceTraceSourceArtifact: LAUNCH_SOURCE_AUDIT_SOURCE_ARTIFACT,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_AUDIT_SOURCE_TRACE_BOUNDARY,
    boundary:
      sourceAudit?.sourceBoundary ||
      'Source URL audit proves source-page reachability and expected page text only. It does not prove buyer willingness to pay, customer outcomes, legal compliance, WCAG conformance, live revenue, partner commitments, or production runtime behavior.',
  };
}

function buildCommercialEvidenceIntakeSourceAuditCoverage(sourceAudit) {
  const sources = sourceAudit?.sources || [];
  const sourceTrace = sourceAuditSourceTrace(
    sources,
    COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_SOURCE_ARTIFACT,
  );
  return {
    artifact: COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON,
    packetPath: sourceAudit?.packetPath || null,
    generatedAt: sourceAudit?.generatedAt || null,
    networkFetch: sourceAudit?.networkFetch ?? null,
    allPassed: sourceAudit?.allPassed ?? null,
    sourceCount: sourceAudit?.sourceCount ?? sources.length,
    passedCount: sourceAudit?.passedCount ?? sources.filter((source) => source.status === 'passed').length,
    failedCount: sourceAudit?.failedCount ?? sources.filter((source) => source.status !== 'passed').length,
    missingExpectationCount: sourceAudit?.missingExpectationCount ?? null,
    unexpectedReferenceCount: sourceAudit?.unexpectedReferenceCount ?? null,
    failedSourceIds: sourceAudit?.failedSourceIds || [],
    unexpectedReferences: sourceAudit?.unexpectedReferences || [],
    sourceIds: sources.map((source) => source.id),
    sourceUrls: sources.map((source) => source.url),
    appliesToCount: sources.reduce((total, source) => total + (source.appliesTo || []).length, 0),
    expectationCheckCount: sources.reduce((total, source) => total + (source.fetch?.evidence || []).length, 0),
    expectedTextMatchCount: sources.reduce(
      (total, source) => total + (source.fetch?.evidence || []).filter((item) => item.matched === true).length,
      0,
    ),
    fetchedSourceCount: sources.filter((source) => source.fetch?.attempted === true).length,
    sourceTraceSourceArtifact: COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_SOURCE_ARTIFACT,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_AUDIT_SOURCE_TRACE_BOUNDARY,
    boundary:
      sourceAudit?.sourceBoundary ||
      'Commercial evidence intake source audit proves only official reference URL presence and expected page text at verification time. It does not prove partner commitments, documented outcomes, testimonial compliance, legal compliance, revenue, retention, causality, market-wide demand, or permission to cite.',
  };
}

function buildLiveProofRunPacketSourceAuditCoverage(sourceAudit) {
  const sources = sourceAudit?.sources || [];
  const sourceTrace = sourceAuditSourceTrace(sources, LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_SOURCE_ARTIFACT);
  return {
    artifact: LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON,
    packetPath: sourceAudit?.packetPath || null,
    generatedAt: sourceAudit?.generatedAt || null,
    networkFetch: sourceAudit?.networkFetch ?? null,
    allPassed: sourceAudit?.allPassed ?? null,
    sourceCount: sourceAudit?.sourceCount ?? sources.length,
    passedCount: sourceAudit?.passedCount ?? sources.filter((source) => source.status === 'passed').length,
    failedCount: sourceAudit?.failedCount ?? sources.filter((source) => source.status !== 'passed').length,
    missingExpectationCount: sourceAudit?.missingExpectationCount ?? null,
    unexpectedReferenceCount: sourceAudit?.unexpectedReferenceCount ?? null,
    failedSourceIds: sourceAudit?.failedSourceIds || [],
    unexpectedReferences: sourceAudit?.unexpectedReferences || [],
    sourceIds: sources.map((source) => source.id),
    sourceUrls: sources.map((source) => source.url),
    appliesToCount: sources.reduce((total, source) => total + (source.appliesTo || []).length, 0),
    expectationCheckCount: sources.reduce((total, source) => total + (source.fetch?.evidence || []).length, 0),
    expectedTextMatchCount: sources.reduce(
      (total, source) => total + (source.fetch?.evidence || []).filter((item) => item.matched === true).length,
      0,
    ),
    fetchedSourceCount: sources.filter((source) => source.fetch?.attempted === true).length,
    sourceTraceSourceArtifact: LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_SOURCE_ARTIFACT,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_AUDIT_SOURCE_TRACE_BOUNDARY,
    boundary:
      sourceAudit?.sourceBoundary ||
      'Live proof run packet source audit proves only that the owner live-proof worksheet official Stripe, Supabase, and GitHub reference URLs were present and matched expected page text at verification time. It does not prove live checkout, live MRR, production calibration, authenticated live artifact persistence, credential validity, owner-held evidence completeness, production deployment, or commercial readiness.',
  };
}

function buildLiveCloseoutAccessSourceAuditCoverage(sourceAudit) {
  const sources = sourceAudit?.sources || [];
  const sourceTrace = sourceAuditSourceTrace(sources, LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_SOURCE_ARTIFACT);
  return {
    artifact: LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON,
    readinessPath: sourceAudit?.readinessPath || null,
    generatedAt: sourceAudit?.generatedAt || null,
    networkFetch: sourceAudit?.networkFetch ?? null,
    allPassed: sourceAudit?.allPassed ?? null,
    sourceCount: sourceAudit?.sourceCount ?? sources.length,
    passedCount: sourceAudit?.passedCount ?? sources.filter((source) => source.status === 'passed').length,
    failedCount: sourceAudit?.failedCount ?? sources.filter((source) => source.status !== 'passed').length,
    missingExpectationCount: sourceAudit?.missingExpectationCount ?? null,
    unexpectedReferenceCount: sourceAudit?.unexpectedReferenceCount ?? null,
    failedSourceIds: sourceAudit?.failedSourceIds || [],
    unexpectedReferences: sourceAudit?.unexpectedReferences || [],
    sourceIds: sources.map((source) => source.id),
    sourceUrls: sources.map((source) => source.url),
    appliesToCount: sources.reduce((total, source) => total + (source.appliesTo || []).length, 0),
    expectationCheckCount: sources.reduce((total, source) => total + (source.fetch?.evidence || []).length, 0),
    expectedTextMatchCount: sources.reduce(
      (total, source) => total + (source.fetch?.evidence || []).filter((item) => item.matched === true).length,
      0,
    ),
    fetchedSourceCount: sources.filter((source) => source.fetch?.attempted === true).length,
    sourceTraceSourceArtifact: LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_SOURCE_ARTIFACT,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_AUDIT_SOURCE_TRACE_BOUNDARY,
    boundary:
      sourceAudit?.sourceBoundary ||
      'Live closeout access source audit proves only official Supabase and GitHub reference URL presence and expected page text at verification time. It does not prove Supabase account access, functions API access, secret value validity, deployment completion, live closeout, or commercial readiness.',
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

function buildLiveCloseoutReadinessCoverage(readiness) {
  const checks = readiness?.checks || [];
  const githubSecrets = readiness?.githubSecrets || {};
  const supabaseAccess = readiness?.supabaseAccess || {};
  const checkSourceTrace = liveCloseoutReadinessCheckSourceTrace(checks);
  const failedCheckSourceTrace = checkSourceTrace.filter((check) => check.passed !== true);
  const nextActionSourceTrace = liveCloseoutReadinessNextActionSourceTrace(
    readiness?.nextActions || [],
  );
  const officialReferenceSourceTrace = liveCloseoutReadinessOfficialReferenceSourceTrace(
    readiness?.officialReferences || [],
  );
  const sourceTrace = liveCloseoutReadinessSourceTrace(
    checkSourceTrace,
    nextActionSourceTrace,
    officialReferenceSourceTrace,
  );
  return {
    artifact: LIVE_CLOSEOUT_READINESS_JSON,
    generatedAt: readiness?.generatedAt || null,
    status: readiness?.status || null,
    ok: readiness?.ok ?? null,
    allowIncomplete: readiness?.allowIncomplete ?? null,
    targetProjectRef: readiness?.targetProjectRef || null,
    command: readiness?.commandContext?.command || null,
    mutatesExternalState: readiness?.commandContext?.mutatesExternalState ?? null,
    printsSecretValues: readiness?.commandContext?.printsSecretValues ?? null,
    checkCount: readiness?.checkCount ?? checks.length,
    passedCheckCount: readiness?.passedCheckCount ?? checks.filter((check) => check.passed === true).length,
    failedCheckCount: readiness?.failedCheckCount ?? checks.filter((check) => check.passed !== true).length,
    failedCheckIds: readiness?.failedCheckIds || checks.filter((check) => check.passed !== true).map((check) => check.id),
    checkResults: checks.map((check) => ({
      id: check.id,
      passed: check.passed === true,
      message: check.message || '',
    })),
    checkSourceArtifact: LIVE_CLOSEOUT_READINESS_CHECKS_SOURCE_ARTIFACT,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    checkSourceTraceCount: checkSourceTrace.length,
    failedCheckSourceTraceCount: failedCheckSourceTrace.length,
    checkSourceTrace,
    githubSecrets: {
      available: githubSecrets.available ?? null,
      requiredSecretNameCount: (githubSecrets.requiredSecretNames || []).length,
      presentRequiredSecretNameCount: (githubSecrets.presentRequiredSecretNames || []).length,
      missingRequiredSecretNameCount: (githubSecrets.missingRequiredSecretNames || []).length,
      missingRequiredSecretNames: githubSecrets.missingRequiredSecretNames || [],
      valuesRedacted: githubSecrets.valuesRedacted ?? null,
      allRepositorySecretNamesPersisted: githubSecrets.allRepositorySecretNamesPersisted ?? null,
    },
    supabaseAccess: {
      projectsListAvailable: supabaseAccess.projectsListAvailable ?? null,
      targetProjectVisible: supabaseAccess.targetProjectVisible ?? null,
      visibleProjectRefCount: supabaseAccess.visibleProjectRefCount ?? null,
      visibleProjectRefsPersisted: supabaseAccess.visibleProjectRefsPersisted ?? null,
      functionsApiAccessible: supabaseAccess.functionsApiAccessible ?? null,
    },
    officialReferenceCount: readiness?.officialReferenceCount ?? (readiness?.officialReferences || []).length,
    officialReferenceSourceArtifact: LIVE_CLOSEOUT_READINESS_OFFICIAL_REFERENCES_SOURCE_ARTIFACT,
    officialReferenceSourceTraceCount: officialReferenceSourceTrace.length,
    officialReferenceSourceTrace,
    nextActionCount: readiness?.nextActionCount ?? (readiness?.nextActions || []).length,
    nextActions: readiness?.nextActions || [],
    nextActionSourceArtifact: LIVE_CLOSEOUT_READINESS_NEXT_ACTIONS_SOURCE_ARTIFACT,
    nextActionSourceTraceCount: nextActionSourceTrace.length,
    nextActionSourceTrace,
    sourceTraceBoundary: LIVE_CLOSEOUT_READINESS_SOURCE_TRACE_BOUNDARY,
    boundary:
      readiness?.evidenceBoundary ||
      'Live closeout readiness coverage mirrors the local CLI access verifier only. It records redacted status and does not deploy, mutate, ingest, rotate, prove production behavior, or upgrade launch readiness.',
    doesNotProve: readiness?.doesNotProve || [],
    doesNotProveCount: readiness?.doesNotProveCount ?? (readiness?.doesNotProve || []).length,
  };
}

function buildManualWcagReviewPacketSourceAuditCoverage(sourceAudit) {
  const sources = sourceAudit?.sources || [];
  const sourceTrace = sourceAuditSourceTrace(
    sources,
    MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_SOURCE_ARTIFACT,
  );
  return {
    artifact: MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_JSON,
    packetPath: sourceAudit?.packetPath || null,
    generatedAt: sourceAudit?.generatedAt || null,
    networkFetch: sourceAudit?.networkFetch ?? null,
    allPassed: sourceAudit?.allPassed ?? null,
    sourceCount: sourceAudit?.sourceCount ?? sources.length,
    passedCount: sourceAudit?.passedCount ?? sources.filter((source) => source.status === 'passed').length,
    failedCount: sourceAudit?.failedCount ?? sources.filter((source) => source.status !== 'passed').length,
    missingExpectationCount: sourceAudit?.missingExpectationCount ?? null,
    unexpectedReferenceCount: sourceAudit?.unexpectedReferenceCount ?? null,
    failedSourceIds: sourceAudit?.failedSourceIds || [],
    unexpectedReferences: sourceAudit?.unexpectedReferences || [],
    sourceIds: sources.map((source) => source.id),
    sourceUrls: sources.map((source) => source.url),
    checkpointReferenceCount: sources.reduce((total, source) => total + (source.checkpointIds || []).length, 0),
    expectationCheckCount: sources.reduce((total, source) => total + (source.fetch?.evidence || []).length, 0),
    expectedTextMatchCount: sources.reduce(
      (total, source) => total + (source.fetch?.evidence || []).filter((item) => item.matched === true).length,
      0,
    ),
    fetchedSourceCount: sources.filter((source) => source.fetch?.attempted === true).length,
    sourceTraceSourceArtifact: MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_SOURCE_ARTIFACT,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_AUDIT_SOURCE_TRACE_BOUNDARY,
    boundary:
      sourceAudit?.sourceBoundary ||
      'Manual WCAG review packet source audit proves only W3C/WAI official reference URL presence and expected page text at verification time. It does not prove manual review completion, WCAG conformance, legal compliance, procurement approval, assistive-technology coverage, or commercial readiness.',
  };
}

function buildOwnerEvidenceCompletionDrillSourceAuditCoverage(sourceAudit) {
  const sources = sourceAudit?.sources || [];
  const sourceTrace = sourceAuditSourceTrace(
    sources,
    OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_SOURCE_ARTIFACT,
  );
  return {
    artifact: OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON,
    drillPath: sourceAudit?.drillPath || null,
    generatedAt: sourceAudit?.generatedAt || null,
    networkFetch: sourceAudit?.networkFetch ?? null,
    allPassed: sourceAudit?.allPassed ?? null,
    sourceCount: sourceAudit?.sourceCount ?? sources.length,
    passedCount: sourceAudit?.passedCount ?? sources.filter((source) => source.status === 'passed').length,
    failedCount: sourceAudit?.failedCount ?? sources.filter((source) => source.status !== 'passed').length,
    missingExpectationCount: sourceAudit?.missingExpectationCount ?? null,
    unexpectedReferenceCount: sourceAudit?.unexpectedReferenceCount ?? null,
    topLevelUrlMismatch: sourceAudit?.topLevelUrlMismatch ?? null,
    failedSourceKeys: sourceAudit?.failedSourceKeys || [],
    unexpectedReferences: sourceAudit?.unexpectedReferences || [],
    packetTypes: sourceAudit?.packetTypes || [...new Set(sources.map((source) => source.packetType))],
    packetReferenceCounts: sourceAudit?.packetReferenceCounts || {},
    sourceKeys: sources.map((source) => source.key),
    sourceUrls: sources.map((source) => source.url),
    expectationCheckCount: sources.reduce((total, source) => total + (source.fetch?.evidence || []).length, 0),
    expectedTextMatchCount: sources.reduce(
      (total, source) => total + (source.fetch?.evidence || []).filter((item) => item.matched === true).length,
      0,
    ),
    fetchedSourceCount: sources.filter((source) => source.fetch?.attempted === true).length,
    sourceTraceSourceArtifact: OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_SOURCE_ARTIFACT,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_AUDIT_SOURCE_TRACE_BOUNDARY,
    boundary:
      sourceAudit?.sourceBoundary ||
      'Owner-evidence completion-drill source audit proves only official reference URL presence and expected page text at verification time. It does not prove owner-held evidence, live checkout, live MRR, partner commitments, documented outcomes, manual WCAG conformance, legal compliance, production state, or commercial readiness.',
  };
}

function isDefaultCoreOnlyInvocation(options) {
  return (
    options.includeNetwork !== true &&
    options.includeLiveSupabase !== true &&
    options.includeLiveOnet !== true &&
    options.includeLiveResumeParser !== true &&
    options.includeA11y !== true &&
    options.includeJourney !== true
  );
}

function buildCommercialReadinessState(options = {}, status = 'passed', releaseGateCoverage = {}) {
  const launchArtifact = readJsonArtifact(LAUNCH_EVIDENCE_JSON);
  const sourceAuditArtifact = readJsonArtifact(LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON);
  const commercialEvidenceIntakeSourceAuditArtifact = readJsonArtifact(
    COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON,
  );
  const liveProofRunPacketSourceAuditArtifact = readJsonArtifact(
    LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON,
  );
  const liveCloseoutAccessSourceAuditArtifact = readJsonArtifact(
    LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON,
  );
  const liveCloseoutReadinessArtifact = readJsonArtifact(LIVE_CLOSEOUT_READINESS_JSON);
  const manualWcagReviewPacketSourceAuditArtifact = readJsonArtifact(
    MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_JSON,
  );
  const ownerEvidenceCompletionDrillSourceAuditArtifact = readJsonArtifact(
    OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON,
  );
  const closeoutArtifact = readJsonArtifact(OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON);
  const handoffArtifact = readJsonArtifact(OWNER_EVIDENCE_HANDOFF_JSON);
  const completionDrillArtifact = readJsonArtifact(OWNER_EVIDENCE_COMPLETION_DRILL_JSON);
  const localSafetyArtifact = readJsonArtifact(OWNER_EVIDENCE_LOCAL_SAFETY_JSON);
  const completionArtifact = readJsonArtifact(REMEDIATION_COMPLETION_AUDIT_JSON);
  const remediationArtifact = readJsonArtifact(REMEDIATION_EXTERNAL_GATES_JSON);
  const launch = launchArtifact.value;
  const sourceAudit = sourceAuditArtifact.value;
  const commercialEvidenceIntakeSourceAudit = commercialEvidenceIntakeSourceAuditArtifact.value;
  const liveProofRunPacketSourceAudit = liveProofRunPacketSourceAuditArtifact.value;
  const liveCloseoutAccessSourceAudit = liveCloseoutAccessSourceAuditArtifact.value;
  const liveCloseoutReadiness = liveCloseoutReadinessArtifact.value;
  const manualWcagReviewPacketSourceAudit = manualWcagReviewPacketSourceAuditArtifact.value;
  const ownerEvidenceCompletionDrillSourceAudit = ownerEvidenceCompletionDrillSourceAuditArtifact.value;
  const closeout = closeoutArtifact.value;
  const handoff = handoffArtifact.value;
  const completionDrill = completionDrillArtifact.value;
  const localSafety = localSafetyArtifact.value;
  const completionAudit = completionArtifact.value;
  const remediationGates = remediationArtifact.value;
  const completionRemainingGateIds = completionGateIds(completionAudit);
  const closeoutRemainingGateIds = closeout?.remainingGateIds || [];
  const launchGapGateIds = (launch?.gaps || []).map((gap) => gap.gate_id || gap.id);
  const launchUnresolvedBlockers = launch?.fix_report?.unresolved_blockers || [];
  const launchProgressUpdates = launch?.progress_updates || [];
  const launchBottleneckLog = launch?.bottleneck_log || [];
  const launchImplementationDecisions = launch?.implementation_decisions || [];
  const launchRejectedVariants = launch?.rejected_variants || [];
  const launchCodeOptimizationReviews = launch?.code_optimization_reviews || [];
  const ownerActionGateIds = (remediationGates?.ownerActionQueue || []).map((item) => item.id);
  const handoffRemainingGateIds = handoff?.remainingGateIds || [];
  const handoffOwnerActionGateIds = (handoff?.ownerActionRows || []).map((row) => row.gateId);
  const completionDrillRequiredGateIds = completionDrill?.requiredGateIds || [];
  const completionDrillRowGateIds = (completionDrill?.completionRows || []).map((row) => row.gateId);
  const expectedDecision = expectedLaunchDecision(closeout, completionAudit);
  const ownerGateScoreboardSourceTrace = buildOwnerGateScoreboardSourceTrace(
    closeoutRemainingGateIds,
    closeout,
    completionAudit,
    remediationGates,
    handoff,
    completionDrill,
  );
  const remediationCompletionSourceTrace = buildRemediationCompletionSourceTrace(
    completionRemainingGateIds,
    completionAudit,
  );
  const remediationExternalGateSourceTrace = buildRemediationExternalGateSourceTrace(
    ownerActionGateIds,
    remediationGates,
  );
  const launchEvidenceBlockerSourceTrace = buildLaunchEvidenceBlockerSourceTrace(
    completionRemainingGateIds,
    launch,
    completionAudit,
    remediationGates,
  );
  const alignmentErrors = [];

  [
    [LAUNCH_EVIDENCE_JSON, launchArtifact],
    [LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON, sourceAuditArtifact],
    [COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON, commercialEvidenceIntakeSourceAuditArtifact],
    [LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON, liveProofRunPacketSourceAuditArtifact],
    [LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON, liveCloseoutAccessSourceAuditArtifact],
    [LIVE_CLOSEOUT_READINESS_JSON, liveCloseoutReadinessArtifact],
    [MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_JSON, manualWcagReviewPacketSourceAuditArtifact],
    [OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON, ownerEvidenceCompletionDrillSourceAuditArtifact],
    [OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON, closeoutArtifact],
    [OWNER_EVIDENCE_HANDOFF_JSON, handoffArtifact],
    [OWNER_EVIDENCE_COMPLETION_DRILL_JSON, completionDrillArtifact],
    [REMEDIATION_COMPLETION_AUDIT_JSON, completionArtifact],
    [REMEDIATION_EXTERNAL_GATES_JSON, remediationArtifact],
  ].forEach(([relativePath, artifact]) => {
    if (!artifact.ok) {
      alignmentErrors.push(
        artifact.missing
          ? `${relativePath} is missing`
          : `${relativePath} could not be parsed: ${artifact.error}`,
      );
    }
  });

  if (launch && launch.launch_decision !== expectedDecision) {
    alignmentErrors.push(
      `${LAUNCH_EVIDENCE_JSON}.launch_decision must be ${expectedDecision}, got ${launch.launch_decision}`,
    );
  }
  if (!arraysEqual(closeoutRemainingGateIds, completionRemainingGateIds)) {
    alignmentErrors.push('owner closeout remainingGateIds must match remediation completion remainingExternalGates');
  }
  if (!arraysEqual(launchGapGateIds, completionRemainingGateIds)) {
    alignmentErrors.push('launch evidence gap gate IDs must match remediation completion remainingExternalGates');
  }
  if (!arraysEqual(launchUnresolvedBlockers, completionRemainingGateIds)) {
    alignmentErrors.push('launch evidence unresolved blockers must match remediation completion remainingExternalGates');
  }
  if (!arraysEqual(ownerActionGateIds, completionRemainingGateIds)) {
    alignmentErrors.push('remediation owner action queue IDs must match remediation completion remainingExternalGates');
  }
  if (!arraysEqual(handoffRemainingGateIds, completionRemainingGateIds)) {
    alignmentErrors.push('owner evidence handoff remainingGateIds must match remediation completion remainingExternalGates');
  }
  if (!arraysEqual(handoffOwnerActionGateIds, completionRemainingGateIds)) {
    alignmentErrors.push('owner evidence handoff ownerActionRows must match remediation completion remainingExternalGates');
  }
  if (!arraysEqual(completionDrillRequiredGateIds, completionRemainingGateIds)) {
    alignmentErrors.push('owner evidence completion drill requiredGateIds must match remediation completion remainingExternalGates');
  }
  if (!arraysEqual(completionDrillRowGateIds, completionRemainingGateIds)) {
    alignmentErrors.push('owner evidence completion drill completionRows must match remediation completion remainingExternalGates');
  }

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
    status:
      alignmentErrors.length > 0
        ? 'misaligned'
        : completionRemainingGateIds.length > 0
          ? 'owner_evidence_required'
          : 'owner_evidence_complete',
    alignmentStatus: alignmentErrors.length === 0 ? 'passed' : 'failed',
    launchDecision: launch?.launch_decision || null,
    expectedLaunchDecision: expectedDecision,
    goalComplete: closeout?.goalComplete === true && completionAudit?.goalComplete === true,
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
      status: closeout?.ownerGateScoreboard?.status || null,
      goalComplete: closeout?.ownerGateScoreboard?.goalComplete ?? closeout?.goalComplete ?? null,
      remainingGateCount: closeout?.remainingGateCount ?? closeoutRemainingGateIds.length,
      remainingGateIds: closeoutRemainingGateIds,
      sourceTraceCount: ownerGateScoreboardSourceTrace.length,
      sourceTrace: ownerGateScoreboardSourceTrace,
      remainingGateSourceTraceCount: ownerGateScoreboardSourceTrace.length,
      remainingGateSourceTrace: ownerGateScoreboardSourceTrace,
      sourceTraceBoundary: OWNER_GATE_SCOREBOARD_SOURCE_TRACE_BOUNDARY,
      evidenceBoundary: closeout?.ownerGateScoreboard?.evidenceBoundary || '',
      acceptedLiveGateIds: closeout?.acceptedLiveGateIds || [],
      ownerActionNeededCount: closeout?.ownerActionNeededCount ?? null,
      failedStepIds: closeout?.failedStepIds || closeout?.ownerGateScoreboard?.failedStepIds || [],
    },
    remediationCompletion: {
      sourceArtifact: OWNER_GATE_SCOREBOARD_REMEDIATION_COMPLETION_SOURCE_ARTIFACT,
      sourceArtifactCount: 1,
      goalComplete: completionAudit?.goalComplete ?? null,
      remainingExternalGateCount: completionRemainingGateIds.length,
      remainingExternalGateIds: completionRemainingGateIds,
      sourceTraceCount: remediationCompletionSourceTrace.length,
      sourceTrace: remediationCompletionSourceTrace,
      remainingExternalGateSourceTraceCount: remediationCompletionSourceTrace.length,
      remainingExternalGateSourceTrace: remediationCompletionSourceTrace,
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
      gapGateIds: launchGapGateIds,
      unresolvedBlockers: launchUnresolvedBlockers,
      scoreOverall: launch?.scores?.overall ?? null,
      sourceTraceCount: launchEvidenceBlockerSourceTrace.length,
      sourceTrace: launchEvidenceBlockerSourceTrace,
      blockerSourceTraceCount: launchEvidenceBlockerSourceTrace.length,
      blockerSourceTrace: launchEvidenceBlockerSourceTrace,
      sourceTraceBoundary: LAUNCH_EVIDENCE_BLOCKER_SOURCE_TRACE_BOUNDARY,
      evidenceBoundary: LAUNCH_EVIDENCE_BLOCKER_EVIDENCE_BOUNDARY,
    },
    launchEvidenceSummary: buildLaunchEvidenceSummary(launch),
    proofBucketSummary: buildProofBucketSummary(launch),
    releaseGateCoverageSummary: buildReleaseGateCoverageSummary(releaseGateCoverage),
    launchSourceAuditCoverage: buildLaunchSourceAuditCoverage(sourceAudit),
    commercialEvidenceIntakeSourceAuditCoverage:
      buildCommercialEvidenceIntakeSourceAuditCoverage(commercialEvidenceIntakeSourceAudit),
    liveProofRunPacketSourceAuditCoverage:
      buildLiveProofRunPacketSourceAuditCoverage(liveProofRunPacketSourceAudit),
    liveCloseoutAccessSourceAuditCoverage:
      buildLiveCloseoutAccessSourceAuditCoverage(liveCloseoutAccessSourceAudit),
    liveCloseoutReadinessCoverage: buildLiveCloseoutReadinessCoverage(liveCloseoutReadiness),
    postSummaryArtifactRedactionSummary: buildPostSummaryArtifactRedactionSummary(status),
    postSummaryLaunchReadinessAlignmentSummary:
      buildPostSummaryLaunchReadinessAlignmentSummary(status),
    postSummaryLaunchEvidenceRefreshSummary:
      buildPostSummaryLaunchEvidenceRefreshSummary(status),
    fullLocalApprovalPackageSummary: buildFullLocalApprovalPackageSummary(options),
    manualWcagReviewPacketSourceAuditCoverage:
      buildManualWcagReviewPacketSourceAuditCoverage(manualWcagReviewPacketSourceAudit),
    ownerEvidenceCompletionDrillSourceAuditCoverage:
      buildOwnerEvidenceCompletionDrillSourceAuditCoverage(ownerEvidenceCompletionDrillSourceAudit),
    ownerEvidenceExecutionSummary: buildOwnerEvidenceExecutionSummary(
      closeout,
      handoff,
      completionDrill,
      localSafety,
    ),
    ownerActionQueueSummary: buildOwnerActionQueueSummary(remediationGates, handoff, closeout, completionDrill),
    progressUpdates: launchProgressUpdates,
    bottleneckLog: launchBottleneckLog,
    implementationDecisions: launchImplementationDecisions,
    rejectedVariants: launchRejectedVariants,
    codeOptimizationReviews: launchCodeOptimizationReviews,
    remediationExternalGates: {
      sourceArtifact: OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT,
      sourceArtifactCount: 1,
      goalComplete: remediationGates?.goalComplete ?? null,
      ownerActionQueueCount: (remediationGates?.ownerActionQueue || []).length,
      ownerActionGateIds,
      sourceTraceCount: remediationExternalGateSourceTrace.length,
      sourceTrace: remediationExternalGateSourceTrace,
      ownerActionGateSourceTraceCount: remediationExternalGateSourceTrace.length,
      ownerActionGateSourceTrace: remediationExternalGateSourceTrace,
      sourceTraceBoundary: REMEDIATION_EXTERNAL_GATES_SOURCE_TRACE_BOUNDARY,
      evidenceBoundary: REMEDIATION_EXTERNAL_GATES_EVIDENCE_BOUNDARY,
    },
    evidenceBoundary:
      'This state summarizes current repo-generated launch and owner-evidence ledgers only. A passed repo-local verification summary does not upgrade the launch decision while owner/live gates remain unresolved.',
    doesNotProve: [
      'owner-held Stripe, Supabase, customer, partner, outcome, accessibility-review, or credential evidence',
      'live MRR, real Stripe checkout, three committed partners, documented outcomes, manual WCAG conformance, or commercial readiness',
      'that optional live, network, accessibility, or browser-journey gates passed unless their current command output is included separately',
    ],
    alignmentErrors,
  };
}

function buildReleaseGateCoverage(results, options) {
  const defaultStepIds = idsForSteps(DEFAULT_STEPS);
  const a11yStepIds = idsForSteps(A11Y_STEPS);
  const networkStepIds = idsForSteps(NETWORK_STEPS);
  const journeyStepIds = idsForSteps(JOURNEY_STEPS);
  const fullLocalStepIds = [...defaultStepIds, ...a11yStepIds, ...networkStepIds, ...journeyStepIds];

  return {
    default_core: {
      command: 'npm run verify:commercial',
      includedInThisInvocation: true,
      passedInThisInvocation: allStepIdsPassed(results, defaultStepIds),
    },
    browser_journey: {
      command: 'npm run verify:commercial-browser',
      includedInThisInvocation: options.includeJourney,
      passedInThisInvocation: options.includeJourney ? allStepIdsPassed(results, journeyStepIds) : null,
    },
    accessibility_smoke: {
      command: 'npm run verify:commercial-a11y',
      includedInThisInvocation: options.includeA11y,
      passedInThisInvocation: options.includeA11y ? allStepIdsPassed(results, a11yStepIds) : null,
    },
    network_and_audit: {
      command: 'npm run verify:commercial-network',
      includedInThisInvocation: options.includeNetwork,
      passedInThisInvocation: options.includeNetwork ? allStepIdsPassed(results, networkStepIds) : null,
    },
    full_local_gate: {
      command: 'npm run verify:commercial-full',
      includedInThisInvocation: options.includeA11y && options.includeNetwork && options.includeJourney,
      passedInThisInvocation:
        options.includeA11y && options.includeNetwork && options.includeJourney
          ? allStepIdsPassed(results, fullLocalStepIds)
          : null,
    },
    typecheck: {
      command: formatCommand(TYPECHECK_STEP.command),
      includedInThisInvocation: true,
      passedInThisInvocation: allStepIdsPassed(results, [TYPECHECK_STEP.id]),
      boundary: 'Included in the default commercial verifier as a repo-local TypeScript contract check.',
    },
    diff_check: {
      command: formatCommand(DIFF_HYGIENE_STEP.command),
      includedInThisInvocation: true,
      passedInThisInvocation: allStepIdsPassed(results, [DIFF_HYGIENE_STEP.id]),
      boundary:
        'Included in the default commercial verifier for tracked diff whitespace hygiene; the worktree-hygiene step separately checks untracked path policy.',
    },
    boundary:
      'Release-gate coverage records only the steps included in this exact verifier invocation. Null means the gate was not included and needs separate current command output.',
  };
}

function buildReleaseGateCoverageSummary(coverage = {}) {
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

function buildCommercialVerificationSummary({ status, startedAt, endedAt, steps, results, options }) {
  const resultById = new Map(results.map((result) => [result.id, result]));
  const postSummaryArtifactRedactionSummary = buildPostSummaryArtifactRedactionSummary(status);
  const postSummaryLaunchReadinessAlignmentSummary =
    buildPostSummaryLaunchReadinessAlignmentSummary(status);
  const postSummaryLaunchEvidenceRefreshSummary =
    buildPostSummaryLaunchEvidenceRefreshSummary(status);
  const fullLocalApprovalPackageSummary = buildFullLocalApprovalPackageSummary(options);
  const releaseGateCoverage = buildReleaseGateCoverage(results, options);
  const stepRows = steps.map((step) => {
    const result = resultById.get(step.id);
    return {
      id: step.id,
      label: step.label,
      command: formatCommand(step.command),
      timeoutMs: step.timeoutMs ?? DEFAULT_STEP_TIMEOUT_MS,
      status: resultStatus(result, status),
      exitCode: result?.code ?? null,
      signal: result?.signal ?? null,
      timedOut: Boolean(result?.timedOut),
      durationSeconds: result?.durationSeconds ?? null,
    };
  });
  const failedSteps = stepRows.filter((step) => ['failed', 'timed_out'].includes(step.status));

  return {
    schemaVersion: COMMERCIAL_VERIFICATION_SUMMARY_SCHEMA,
    generatedAt: new Date().toISOString(),
    startedAt,
    endedAt,
    status,
    invocation: {
      command: formatCommand(['node', 'scripts/verify-commercial-release.mjs', ...process.argv.slice(2)]),
      npmScripts: {
        defaultCore: 'npm run verify:commercial',
        fullLocalGate: 'npm run verify:commercial-full',
      },
      options,
      cwd: process.cwd(),
    },
    plannedStepCount: steps.length,
    stepCount: stepRows.length,
    completedStepCount: results.length,
    passedStepCount: stepRows.filter((step) => step.status === 'passed').length,
    failedStepCount: failedSteps.length,
    timedOutStepCount: stepRows.filter((step) => step.timedOut).length,
    failedSteps: failedSteps.map((step) => step.id),
    releaseGateCoverage,
    commercialReadinessState: buildCommercialReadinessState(options, status, releaseGateCoverage),
    postSummaryArtifactRedaction: {
      ...postSummaryArtifactRedactionSummary,
      boundary:
        'When all planned steps pass, the release runner writes this summary first, then runs the generated-artifact redaction verifier so commercial-verification-summary-latest.json and .md are included in the scan. Use the redaction artifact generated after this summary timestamp as the pass/fail evidence for the post-summary scan.',
    },
    postSummaryLaunchReadinessAlignment: postSummaryLaunchReadinessAlignmentSummary,
    postSummaryLaunchEvidenceRefresh: {
      ...postSummaryLaunchEvidenceRefreshSummary,
      boundary:
        'The runner first writes a passed summary, refreshes launch evidence from that passed summary, then rewrites the final summary so progress updates and Code Optimization Gate rows remain in parity before redaction and launch-readiness alignment checks. This does not execute optional live, network, browser, accessibility, payment, credential, outreach, or owner-held evidence gates.',
    },
    postSummaryFullLocalApprovalPackage: {
      ...fullLocalApprovalPackageSummary,
      includedInThisInvocation: status === 'passed' && fullLocalApprovalPackageSummary.includedInThisInvocation,
      boundary:
        'This verifier reads the approval plan, progress digest, workflow metadata, workflow backlog/results, package scripts, and current commercial summary only. It does not execute accessibility, browser, network, audit, full-local, worker, live, payment, credential, outreach, or owner-held evidence gates.',
    },
    steps: stepRows,
    evidenceBoundary: VERIFICATION_SUMMARY_BOUNDARY,
    doesNotProveCount: VERIFICATION_SUMMARY_DOES_NOT_PROVE.length,
    doesNotProve: VERIFICATION_SUMMARY_DOES_NOT_PROVE,
  };
}

function markdownBool(value) {
  if (value === null || value === undefined) {
    return '`not included`';
  }

  return value ? '`yes`' : '`no`';
}

function markdownCell(value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  return String(value).replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
}

function renderCommercialVerificationSummaryMarkdown(summary) {
  const readiness = summary.commercialReadinessState || {};
  const ownerGateScoreboard = readiness.ownerGateScoreboard || {};
  const remediationCompletion = readiness.remediationCompletion || {};
  const remediationExternalGates = readiness.remediationExternalGates || {};
  const launchEvidence = readiness.launchEvidence || {};
  const launchEvidenceSummary = readiness.launchEvidenceSummary || {};
  const proofBucketSummary = readiness.proofBucketSummary || {};
  const releaseGateCoverageSummary = readiness.releaseGateCoverageSummary || {};
  const sourceAuditCoverage = readiness.launchSourceAuditCoverage || {};
  const commercialEvidenceIntakeSourceAuditCoverage =
    readiness.commercialEvidenceIntakeSourceAuditCoverage || {};
  const liveProofRunPacketSourceAuditCoverage =
    readiness.liveProofRunPacketSourceAuditCoverage || {};
  const liveCloseoutAccessSourceAuditCoverage =
    readiness.liveCloseoutAccessSourceAuditCoverage || {};
  const liveCloseoutReadinessCoverage = readiness.liveCloseoutReadinessCoverage || {};
  const manualWcagReviewPacketSourceAuditCoverage =
    readiness.manualWcagReviewPacketSourceAuditCoverage || {};
  const ownerEvidenceCompletionDrillSourceAuditCoverage =
    readiness.ownerEvidenceCompletionDrillSourceAuditCoverage || {};
  const ownerEvidenceExecutionSummary = readiness.ownerEvidenceExecutionSummary || {};
  const ownerActionQueueSummary = readiness.ownerActionQueueSummary || {};
  const launchScores = launchEvidenceSummary.scores || {};
  const deliverableCounts = launchEvidenceSummary.deliverableCounts || {};
  const requiredOutputTableCounts = launchEvidenceSummary.requiredOutputTableCounts || {};
  const outreachCoverage = launchEvidenceSummary.outreachCoverage || {};
  const crmExport = outreachCoverage.crmExport || {};
  const fixReportCoverage = launchEvidenceSummary.fixReportCoverage || {};
  const ownerCloseoutCoverage = ownerEvidenceExecutionSummary.closeoutCoverage || {};
  const ownerHandoffCoverage = ownerEvidenceExecutionSummary.handoffCoverage || {};
  const ownerCompletionDrillCoverage = ownerEvidenceExecutionSummary.completionDrillCoverage || {};
  const ownerExecutionGateIds = ownerEvidenceExecutionSummary.gateIds || {};
  const ownerPrepActionNeededByGateCoverage =
    ownerEvidenceExecutionSummary.ownerPrepActionNeededByGateCoverage || {};
  const ownerPrepActionNeededByGate = ownerEvidenceExecutionSummary.ownerPrepActionNeededByGate || {};
  const ownerOperationalAccessPrerequisiteSummary =
    ownerEvidenceExecutionSummary.operationalAccessPrerequisiteSummary || {};
  const ownerLocalSafetyStatusSummary =
    ownerEvidenceExecutionSummary.localSafetyStatusSummary || {};
  const postSummaryArtifactRedactionSummary =
    readiness.postSummaryArtifactRedactionSummary || {};
  const postSummaryLaunchReadinessAlignmentSummary =
    readiness.postSummaryLaunchReadinessAlignmentSummary || {};
  const postSummaryLaunchEvidenceRefreshSummary =
    readiness.postSummaryLaunchEvidenceRefreshSummary || {};
  const fullLocalApprovalPackageSummary = readiness.fullLocalApprovalPackageSummary || {};
  const sourceArtifacts = readiness.sourceArtifacts || {};
  const progressUpdates = readiness.progressUpdates || [];
  const bottleneckLog = readiness.bottleneckLog || [];
  const implementationDecisions = readiness.implementationDecisions || [];
  const rejectedVariants = readiness.rejectedVariants || [];
  const codeOptimizationReviews = readiness.codeOptimizationReviews || [];
  const coverageRows = Object.entries(summary.releaseGateCoverage)
    .filter(([key]) => key !== 'boundary')
    .map(([key, item]) =>
      `| ${key} | \`${item.command}\` | ${markdownBool(item.includedInThisInvocation)} | ${markdownBool(
        item.passedInThisInvocation,
      )} | ${item.boundary || ''} |`,
    )
    .join('\n');
  const stepRows = summary.steps
    .map(
      (step) =>
        `| ${step.id} | ${step.status} | \`${step.command}\` | ${step.durationSeconds ?? ''} | ${
          step.exitCode ?? ''
        } |`,
    )
    .join('\n');
  const remainingGateRows = (ownerGateScoreboard.remainingGateIds || [])
    .map((gateId) => `| ${gateId} | open | owner/live evidence required |`)
    .join('\n');
  const ownerGateScoreboardSourceRows = (ownerGateScoreboard.remainingGateSourceTrace || [])
    .map((row) => {
      const sourceArtifacts = row.sourceArtifacts || {};
      return `| ${markdownCell(row.gateId)} | ${markdownCell(row.status || '')} | ${markdownCell(
        sourceArtifacts.scoreboard || '',
      )} | ${markdownCell(sourceArtifacts.remediationCompletion || '')} | ${markdownCell(
        sourceArtifacts.remediationExternalGates || '',
      )} | ${markdownCell(sourceArtifacts.closeoutStatus || '')} | ${markdownCell(
        sourceArtifacts.handoff || '',
      )} | ${markdownCell(sourceArtifacts.completionDrill || '')} |`;
    })
    .join('\n');
  const remediationCompletionSourceRows = (
    remediationCompletion.remainingExternalGateSourceTrace || []
  )
    .map(
      (row) =>
        `| ${markdownCell(row.gateId)} | ${markdownCell(row.status || '')} | ${markdownCell(
          row.sourceArtifact || '',
        )} |`,
    )
    .join('\n');
  const remediationExternalGateSourceRows = (
    remediationExternalGates.ownerActionGateSourceTrace || []
  )
    .map(
      (row) =>
        `| ${markdownCell(row.gateId)} | ${markdownCell(row.status || '')} | ${markdownCell(
          row.sourceBoundary || '',
        )} | ${markdownCell(row.sourceArtifact || '')} |`,
    )
    .join('\n');
  const launchEvidenceBlockerSourceRows = (launchEvidence.blockerSourceTrace || [])
    .map((row) => {
      const sourceArtifacts = row.sourceArtifacts || {};
      return `| ${markdownCell(row.gateId)} | ${markdownCell(row.status || '')} | ${markdownCell(
        row.severity || '',
      )} | ${markdownCell(sourceArtifacts.launchGap || '')} | ${markdownCell(
        sourceArtifacts.unresolvedBlocker || '',
      )} | ${markdownCell(sourceArtifacts.remediationCompletion || '')} | ${markdownCell(
        sourceArtifacts.remediationExternalGates || '',
      )} |`;
    })
    .join('\n');
  const launchEvidenceSummarySourceRows = (launchEvidenceSummary.sourceTrace || [])
    .map((row) => {
      const sourceArtifactText =
        Object.values(row.sourceArtifacts || {})
          .filter(Boolean)
          .map(markdownCell)
          .join('<br>') || 'none';
      return `| ${markdownCell(row.coverage || '')} | ${row.metricCount ?? 0} | ${
        row.sourceArtifactCount ?? 0
      } | ${sourceArtifactText} |`;
    })
    .join('\n');
  const requiredOutputTableCountRows = Object.entries(requiredOutputTableCounts)
    .map(([field, count]) => `| ${markdownCell(field)} | ${count} |`)
    .join('\n');
  const progressRows = progressUpdates
    .map(
      (update) =>
        `| ${markdownCell(update.phase || 'unknown')} | ${(update.accomplished || []).length} | ${
          (update.target_matrix || []).length
        } | ${(update.pending || []).length} | ${
          update.activities_remaining?.current_phase_actions ?? 'unknown'
        } | ${markdownCell(update.bottleneck || '')} |`,
    )
    .join('\n');
  const bottleneckRows = bottleneckLog
    .map(
      (entry) =>
        `| ${markdownCell(entry.phase || 'unknown')} | ${markdownCell(
          entry.task_or_subtask || '',
        )} | ${markdownCell(entry.root_cause || '')} | ${(entry.top_unblock_options || []).length} |`,
    )
    .join('\n');
  const implementationDecisionRows = implementationDecisions
    .map(
      (item) =>
        `| ${markdownCell(item.decision || '')} | ${markdownCell(item.chosen_variant || '')} | ${markdownCell(
          item.acceptance_check || '',
        )} | ${(item.tests_run || []).map(markdownCell).join('<br>')} |`,
    )
    .join('\n');
  const rejectedVariantRows = rejectedVariants
    .map(
      (item) =>
        `| ${markdownCell(item.variant || '')} | ${markdownCell(item.reason_rejected || '')} | ${markdownCell(
          item.tradeoff || '',
        )} | ${markdownCell(item.evidence || '')} |`,
    )
    .join('\n');
  const codeOptimizationReviewRows = codeOptimizationReviews
    .map(
      (item) =>
        `| ${markdownCell(item.target_task || '')} | ${markdownCell(item.policy || '')} | ${markdownCell(
          item.verdict || '',
        )} | ${item.minimality_score ?? ''}/5 | ${(item.tests_or_checks || []).map(markdownCell).join('<br>')} |`,
    )
    .join('\n');
  const acceptedLiveGateText = (ownerGateScoreboard.acceptedLiveGateIds || []).length
    ? ownerGateScoreboard.acceptedLiveGateIds.map((gateId) => `\`${gateId}\``).join(', ')
    : '`none`';
  const releaseGateList = (gateIds = []) =>
    gateIds.length ? gateIds.map(markdownCell).join(', ') : 'none';
  const sourceAuditTraceRows = (coverage) =>
    (coverage.sourceTrace || [])
      .map(
        (row) =>
          `| ${markdownCell(row.id || '')} | ${markdownCell(row.url || '')} | ${markdownCell(
            row.status || '',
          )} | ${row.expectedTextMatchCount ?? 0}/${row.expectationCount ?? 0} | ${markdownCell(
            row.sourceArtifact || '',
          )} |`,
      )
      .join('\n');
  const ownerExecutionGateRows = [
    ['Remaining gates', ownerExecutionGateIds.remaining || []],
    ['Handoff remaining gates', ownerExecutionGateIds.handoffRemaining || []],
    ['Completion-drill required gates', ownerExecutionGateIds.completionRequired || []],
  ]
    .map(([label, gateIds]) => `| ${label} | ${gateIds.length ? gateIds.map(markdownCell).join(', ') : 'none'} |`)
    .join('\n');
  const liveCloseoutReadinessCheckRows = (liveCloseoutReadinessCoverage.checkSourceTrace || [])
    .map(
      (check) =>
        `| ${markdownCell(check.id)} | ${markdownBool(check.passed)} | ${markdownCell(
          check.message || '',
        )} | ${markdownCell(check.sourceArtifact || '')} |`,
    )
    .join('\n');
  const liveCloseoutReadinessNextActionRows = (liveCloseoutReadinessCoverage.nextActionSourceTrace || [])
    .map(
      (row) =>
        `| ${row.order} | ${markdownCell(row.action || '')} | ${markdownCell(
          row.sourceArtifact || '',
        )} |`,
    )
    .join('\n');
  const liveCloseoutReadinessOfficialReferenceRows = (
    liveCloseoutReadinessCoverage.officialReferenceSourceTrace || []
  )
    .map(
      (row) =>
        `| ${markdownCell(row.id)} | ${markdownCell(row.url || '')} | ${markdownCell(
          (row.appliesTo || []).join('<br>') || 'none',
        )} | ${markdownCell(row.sourceArtifact || '')} |`,
    )
    .join('\n');
  const releaseGateCoverageStateRows = Object.entries(releaseGateCoverageSummary.gates || {})
    .map(
      ([gateId, gate]) =>
        `| ${markdownCell(gateId)} | \`${gate.command || ''}\` | ${markdownBool(
          gate.includedInThisInvocation,
        )} | ${markdownBool(gate.passedInThisInvocation)} | ${markdownCell(gate.boundary || '')} |`,
    )
    .join('\n');
  const releaseGateCoverageSourceRows = (releaseGateCoverageSummary.sourceTrace || [])
    .map(
      (row) =>
        `| ${markdownCell(row.gateId)} | \`${row.command || ''}\` | ${markdownBool(
          row.includedInThisInvocation,
        )} | ${markdownBool(row.passedInThisInvocation)} | ${markdownBool(
          row.optional,
        )} | ${markdownBool(row.separateProofRequired)} | ${markdownCell(
          row.sourceArtifact || '',
        )} | ${markdownCell(row.boundary || '')} |`,
    )
    .join('\n');
  const ownerPrepByGateRows = Object.values(ownerPrepActionNeededByGate)
    .map(
      (gateSummary) =>
        `| ${markdownCell(gateSummary.gateId)} | ${
          gateSummary.ownerActionNeededCount ?? gateSummary.ownerActionNeeded?.length ?? 0
        } | ${markdownCell(gateSummary.sourceArtifact || '')} |`,
    )
    .join('\n');
  const ownerOperationalAccessRows = (
    ownerOperationalAccessPrerequisiteSummary.prerequisites || []
  )
    .map(
      (prerequisite) =>
        `| ${markdownCell(prerequisite.id)} | ${markdownCell(prerequisite.status)} | ${markdownCell(
          prerequisite.track,
        )} | ${markdownCell(prerequisite.ownerPrepCommand)} | ${markdownCell(
          prerequisite.nextCommand,
        )} | ${(prerequisite.blockingCheckIds || []).map(markdownCell).join(', ') || 'none'} |`,
    )
    .join('\n');
  const ownerOperationalAccessSourceRows = (
    ownerOperationalAccessPrerequisiteSummary.sourceTrace || []
  )
    .map((row) => {
      const sourceArtifacts = row.sourceArtifacts || {};
      return `| ${markdownCell(row.id)} | ${markdownCell(sourceArtifacts.handoff || '')} | ${markdownCell(
        sourceArtifacts.completionDrill || '',
      )} | ${markdownCell(sourceArtifacts.liveCloseoutReadiness || '')} | ${
        (sourceArtifacts.blockingChecks || []).map(markdownCell).join('<br>') || 'none'
      } |`;
    })
    .join('\n');
  const ownerCloseoutFailedStepRows = (ownerCloseoutCoverage.failedStepSourceTrace || [])
    .map(
      (step) =>
        `| ${markdownCell(step.id)} | ${markdownCell(step.status || '')} | ${markdownCell(
          step.command || '',
        )} | ${markdownCell(step.sourceArtifact || '')} |`,
    )
    .join('\n');
  const ownerCloseoutNextCommandRows = (ownerCloseoutCoverage.nextCommandSourceTrace || [])
    .map(
      (row) =>
        `| ${markdownCell(row.key)} | ${(row.commands || []).map(markdownCell).join('<br>') || 'none'} | ${
          row.commandCount ?? 0
        } | ${markdownCell(row.sourceArtifact || '')} |`,
    )
    .join('\n');
  const ownerCloseoutStatusArtifactRows = (ownerCloseoutCoverage.statusArtifactSourceTrace || [])
    .map(
      (row) =>
        `| ${markdownCell(row.key)} | ${markdownCell(row.artifactPath || '')} | ${markdownCell(
          row.sourceArtifact || '',
        )} |`,
    )
    .join('\n');
  const ownerLocalSafetySourceRows = (ownerLocalSafetyStatusSummary.sourceTrace || [])
    .map(
      (row) =>
        `| ${markdownCell(row.key)} | ${markdownCell(row.value || '')} | ${markdownCell(
          row.sourceArtifact || '',
        )} | ${markdownCell(row.handoffSourceArtifact || '')} | ${markdownCell(
          row.completionDrillSourceArtifact || '',
        )} |`,
    )
    .join('\n');
  const ownerHandoffCommandSourceRows = (
    ownerHandoffCoverage.commandSequenceSourceTrace || []
  )
    .map(
      (row) =>
        `| ${row.order ?? ''} | ${markdownCell(row.command || '')} | ${markdownCell(
          row.sourceArtifact || '',
        )} |`,
    )
    .join('\n');
  const ownerCompletionCommandSourceRows = (
    ownerCompletionDrillCoverage.recommendedCommandOrderSourceTrace || []
  )
    .map(
      (row) =>
        `| ${row.order ?? ''} | ${markdownCell(row.command || '')} | ${markdownCell(
          row.sourceArtifact || '',
        )} |`,
    )
    .join('\n');
  const postSummaryArtifactRedactionDoesNotProveRows = (
    postSummaryArtifactRedactionSummary.doesNotProve || []
  )
    .map((item) => `| ${markdownCell(item)} |`)
    .join('\n');
  const postSummaryCommandSourceRows = (sourceTrace = []) =>
    sourceTrace
      .map(
        (row) =>
          `| ${markdownCell(row.key || '')} | ${markdownCell(row.value || '')} | ${markdownCell(
            row.sourceArtifact || '',
          )} | ${markdownCell(row.boundary || '')} |`,
      )
      .join('\n');
  const postSummaryArtifactRedactionSourceRows = postSummaryCommandSourceRows(
    postSummaryArtifactRedactionSummary.sourceTrace,
  );
  const postSummaryLaunchReadinessAlignmentSourceRows = postSummaryCommandSourceRows(
    postSummaryLaunchReadinessAlignmentSummary.sourceTrace,
  );
  const postSummaryLaunchEvidenceRefreshSourceRows = postSummaryCommandSourceRows(
    postSummaryLaunchEvidenceRefreshSummary.sourceTrace,
  );
  const fullLocalApprovalSourceRows = postSummaryCommandSourceRows(
    fullLocalApprovalPackageSummary.sourceTrace,
  );
  const releaseGateCoverageDoesNotProveRows = (
    releaseGateCoverageSummary.doesNotProve || []
  )
    .map((item) => `| ${markdownCell(item)} |`)
    .join('\n');
  const postSummaryLaunchReadinessAlignmentDoesNotProveRows = (
    postSummaryLaunchReadinessAlignmentSummary.doesNotProve || []
  )
    .map((item) => `| ${markdownCell(item)} |`)
    .join('\n');
  const postSummaryLaunchEvidenceRefreshDoesNotProveRows = (
    postSummaryLaunchEvidenceRefreshSummary.doesNotProve || []
  )
    .map((item) => `| ${markdownCell(item)} |`)
    .join('\n');
  const fullLocalApprovalCommandRows = Object.entries(
    fullLocalApprovalPackageSummary.optionalGateCommands || {},
  )
    .map(([gateId, command]) => `| ${markdownCell(gateId)} | \`${markdownCell(command)}\` |`)
    .join('\n');
  const fullLocalApprovalRequiredRows = (
    fullLocalApprovalPackageSummary.approvalRequiredBefore || []
  )
    .map((gateId) => `| ${markdownCell(gateId)} | approval required |`)
    .join('\n');
  const ownerActionQueueRows = (ownerActionQueueSummary.rows || [])
    .map(
      (row) =>
        `| ${markdownCell(row.gateId)} | ${markdownCell(row.status)} | ${markdownCell(
          row.track || '',
        )} | ${markdownCell(row.sourceArtifact || '')} | ${markdownCell(row.sourceBoundary)} | ${markdownCell(
          row.ownerPrepCommand,
        )} | ${markdownCell(row.nextCommand)} | ${row.blockingOwnerActionCount ?? 0} | ${
          row.closeoutFailureDetailCount ?? 0
        } |`,
    )
    .join('\n');
  const ownerActionBoundaryRows = (ownerActionQueueSummary.rows || [])
    .map(
      (row) =>
        `| ${markdownCell(row.gateId)} | ${markdownCell(row.riskIfSkipped)} | ${
          (row.doesNotProve || []).map(markdownCell).join('<br>') || 'none'
        } |`,
    )
    .join('\n');
  const ownerActionSourceRows = (ownerActionQueueSummary.sourceTrace || [])
    .map((row) => {
      const sourceArtifacts = row.sourceArtifacts || {};
      return `| ${markdownCell(row.gateId)} | ${markdownCell(
        sourceArtifacts.remediationExternalGates || '',
      )} | ${markdownCell(sourceArtifacts.closeoutStatus || '')} | ${markdownCell(
        sourceArtifacts.handoff || '',
      )} | ${markdownCell(sourceArtifacts.completionDrill || '')} |`;
    })
    .join('\n');
  const proofBucketRows = Object.entries(proofBucketSummary.countsByBucket || {})
    .map(([bucketName, count]) => {
      const statusText = Object.entries(proofBucketSummary.statusesByBucket?.[bucketName] || {})
        .map(([status, statusCount]) => `${markdownCell(status)}: ${statusCount}`)
        .join(', ');
      return `| ${markdownCell(bucketName)} | ${count} | ${statusText || 'none'} |`;
    })
    .join('\n');
  const proofBucketTraceRows = (proofBucketSummary.items || [])
    .map(
      (item) =>
        `| ${markdownCell(item.bucket)} | ${markdownCell(item.label)} | ${markdownCell(
          item.status,
      )} | ${markdownCell(item.source)} | ${markdownCell(item.boundary)} |`,
    )
    .join('\n');
  const proofBucketSourceRows = (proofBucketSummary.sourceTrace || [])
    .map(
      (item) =>
        `| ${markdownCell(item.bucket)} | ${item.index ?? ''} | ${markdownCell(
          item.label,
        )} | ${markdownCell(item.status)} | ${markdownCell(item.sourceArtifact)} | ${markdownCell(
          item.sourcePath,
        )} | ${markdownCell(item.boundary)} |`,
    )
    .join('\n');
  const alignmentErrorText = (readiness.alignmentErrors || []).length
    ? readiness.alignmentErrors.map((error) => `- ${error}`).join('\n')
    : '- none';

  return `# Commercial Verification Summary

Status: \`${summary.status}\`
Generated: \`${summary.generatedAt}\`
Started: \`${summary.startedAt}\`
Ended: \`${summary.endedAt || 'running'}\`
Invocation: \`${summary.invocation.command}\`

## Counts

| Field | Value |
| --- | ---: |
| Planned steps | ${summary.plannedStepCount} |
| Step result rows | ${summary.stepCount ?? summary.steps?.length ?? 0} |
| Completed steps | ${summary.completedStepCount} |
| Passed steps | ${summary.passedStepCount} |
| Failed steps | ${summary.failedStepCount} |
| Failed step IDs | ${(summary.failedSteps || []).length} |
| Timed-out steps | ${summary.timedOutStepCount} |
| Does-not-prove boundaries | ${summary.doesNotProveCount ?? 0} |

## Commercial Readiness State

| Field | Value |
| --- | --- |
| Readiness status | \`${readiness.status || 'unknown'}\` |
| Launch decision | \`${readiness.launchDecision || 'unknown'}\` |
| Expected launch decision | \`${readiness.expectedLaunchDecision || 'unknown'}\` |
| Alignment status | \`${readiness.alignmentStatus || 'unknown'}\` |
| State source artifact | \`${readiness.sourceArtifact || ''}\` |
| State source artifacts | ${readiness.sourceArtifactCount ?? 0} |
| Release gate coverage status | \`${releaseGateCoverageSummary.status || 'unknown'}\` |
| Release gates included | ${releaseGateCoverageSummary.includedGateCount ?? 'unknown'} |
| Release gates not included | ${releaseGateCoverageSummary.notIncludedGateCount ?? 'unknown'} |
| Release gates requiring separate proof | ${releaseGateCoverageSummary.requiredSeparateProofGateIds?.length ?? 'unknown'} |
| Release gate does-not-prove boundaries | ${releaseGateCoverageSummary.doesNotProveCount ?? 0} |
| Release gate source trace rows | ${releaseGateCoverageSummary.sourceTraceCount ?? 0} |
| Goal complete | ${markdownBool(readiness.goalComplete)} |
| Owner gate status | \`${ownerGateScoreboard.status || 'unknown'}\` |
| Remaining owner/live gate count | ${ownerGateScoreboard.remainingGateCount ?? 0} |
| Remaining owner/live gate source trace rows | ${ownerGateScoreboard.remainingGateSourceTraceCount ?? 0} |
| Accepted live gates | ${acceptedLiveGateText} |
| Owner action needed count | ${ownerGateScoreboard.ownerActionNeededCount ?? 'unknown'} |
| Owner handoff command count | ${ownerHandoffCoverage.commandSequenceCount ?? 'unknown'} |
| Owner completion-drill matrix rows | ${ownerCompletionDrillCoverage.matrixRowCount ?? 'unknown'} |
| Owner action queue detail rows | ${ownerActionQueueSummary.queueCount ?? 'unknown'} |
| Owner action next commands | ${ownerActionQueueSummary.nextCommandCount ?? 'unknown'} |
| Owner action raw-evidence policies | ${ownerActionQueueSummary.rawEvidencePolicyCount ?? 'unknown'} |
| Launch source-audit sources | ${sourceAuditCoverage.sourceCount ?? 'unknown'} |
| Launch source-audit failed sources | ${sourceAuditCoverage.failedCount ?? 'unknown'} |
| Live proof packet source-audit references | ${liveProofRunPacketSourceAuditCoverage.sourceCount ?? 'unknown'} |
| Live proof packet source-audit failed references | ${liveProofRunPacketSourceAuditCoverage.failedCount ?? 'unknown'} |
| Live closeout readiness status | \`${liveCloseoutReadinessCoverage.status || 'unknown'}\` |
| Live closeout readiness failed checks | ${liveCloseoutReadinessCoverage.failedCheckCount ?? 'unknown'} |
| Post-summary redaction status | \`${postSummaryArtifactRedactionSummary.status || 'unknown'}\` |
| Post-summary redaction included | ${markdownBool(postSummaryArtifactRedactionSummary.includedInThisInvocation)} |
| Post-summary redaction artifacts | ${Object.keys(postSummaryArtifactRedactionSummary.resultArtifacts || {}).length} |
| Post-summary redaction does-not-prove boundaries | ${postSummaryArtifactRedactionSummary.doesNotProveCount ?? 0} |
| Post-summary launch-readiness alignment status | \`${postSummaryLaunchReadinessAlignmentSummary.status || 'unknown'}\` |
| Post-summary launch-readiness alignment included | ${markdownBool(postSummaryLaunchReadinessAlignmentSummary.includedInThisInvocation)} |
| Post-summary launch-readiness alignment fixture | \`${postSummaryLaunchReadinessAlignmentSummary.fixtureVerifier?.command || ''}\` |
| Post-summary launch-readiness alignment does-not-prove boundaries | ${postSummaryLaunchReadinessAlignmentSummary.doesNotProveCount ?? 0} |
| Post-summary launch evidence refresh status | \`${postSummaryLaunchEvidenceRefreshSummary.status || 'unknown'}\` |
| Post-summary launch evidence refresh included | ${markdownBool(postSummaryLaunchEvidenceRefreshSummary.includedInThisInvocation)} |
| Post-summary launch evidence refresh artifacts | ${Object.keys(postSummaryLaunchEvidenceRefreshSummary.resultArtifacts || {}).length} |
| Post-summary launch evidence refresh does-not-prove boundaries | ${postSummaryLaunchEvidenceRefreshSummary.doesNotProveCount ?? 0} |
| Full-local approval status | \`${fullLocalApprovalPackageSummary.status || 'unknown'}\` |
| Full-local execution approved | ${markdownBool(fullLocalApprovalPackageSummary.executionApproved)} |
| Full-local optional commands | ${Object.keys(fullLocalApprovalPackageSummary.optionalGateCommands || {}).length} |
| Live closeout access source-audit references | ${liveCloseoutAccessSourceAuditCoverage.sourceCount ?? 'unknown'} |
| Live closeout access source-audit failed references | ${liveCloseoutAccessSourceAuditCoverage.failedCount ?? 'unknown'} |
| Manual WCAG packet source-audit references | ${manualWcagReviewPacketSourceAuditCoverage.sourceCount ?? 'unknown'} |
| Manual WCAG packet source-audit failed references | ${manualWcagReviewPacketSourceAuditCoverage.failedCount ?? 'unknown'} |
| Completion-drill source-audit references | ${ownerEvidenceCompletionDrillSourceAuditCoverage.sourceCount ?? 'unknown'} |
| Completion-drill source-audit failed references | ${ownerEvidenceCompletionDrillSourceAuditCoverage.failedCount ?? 'unknown'} |
| Launch proof-bucket count | ${proofBucketSummary.bucketCount ?? 'unknown'} |
| Launch proof-bucket item count | ${proofBucketSummary.itemCount ?? 'unknown'} |
| Launch roadmap proof-bucket items | ${proofBucketSummary.roadmapItemCount ?? 'unknown'} |
| Launch proof-bucket source trace rows | ${proofBucketSummary.sourceTraceCount ?? 0} |
| Remediation remaining external gate count | ${remediationCompletion.remainingExternalGateCount ?? 0} |
| Launch evidence overall score | ${launchEvidence.scoreOverall ?? 'unknown'} |
| Launch evidence gap count | ${deliverableCounts.gapCount ?? 'unknown'} |
| Launch evidence pain point count | ${deliverableCounts.painPointCount ?? 'unknown'} |
| Launch evidence target customer count | ${deliverableCounts.targetCustomerCount ?? 'unknown'} |
| Launch evidence summary source trace rows | ${launchEvidenceSummary.sourceTraceCount ?? 0} |
| Progress update count | ${progressUpdates.length} |
| Bottleneck log count | ${bottleneckLog.length} |
| Implementation decision count | ${implementationDecisions.length} |
| Rejected variant count | ${rejectedVariants.length} |
| Code optimization review count | ${codeOptimizationReviews.length} |
| Remediation completion source trace rows | ${remediationCompletion.remainingExternalGateSourceTraceCount ?? 0} |
| Remediation external gate source trace rows | ${remediationExternalGates.ownerActionGateSourceTraceCount ?? 0} |

### Remaining Owner/Live Gates

| Gate | Status | Boundary |
| --- | --- | --- |
${remainingGateRows || '| none | closed | no remaining owner/live gates in the current repo-generated ledgers |'}

#### Owner Gate Scoreboard Source Trace

| Gate | Status | Scoreboard | Remediation completion | Remediation gates | Closeout queue | Handoff | Completion drill |
| --- | --- | --- | --- | --- | --- | --- | --- |
${ownerGateScoreboardSourceRows || '| none | closed | none | none | none | none | none | none |'}

${ownerGateScoreboard.sourceTraceBoundary || ''}

#### Remediation Completion Source Trace

| Gate | Status | Source artifact |
| --- | --- | --- |
${remediationCompletionSourceRows || '| none | closed | none |'}

${remediationCompletion.sourceTraceBoundary || ''}

${remediationCompletion.evidenceBoundary || ''}

#### Remediation External Gates Source Trace

| Gate | Status | Source boundary | Source artifact |
| --- | --- | --- | --- |
${remediationExternalGateSourceRows || '| none | closed | none | none |'}

${remediationExternalGates.sourceTraceBoundary || ''}

${remediationExternalGates.evidenceBoundary || ''}

### Release Gate Coverage State Summary

| Field | Value |
| --- | --- |
| Source artifact | \`${releaseGateCoverageSummary.sourceArtifact || ''}\` |
| Status | \`${releaseGateCoverageSummary.status || 'unknown'}\` |
| Gate count | ${releaseGateCoverageSummary.gateCount ?? 'unknown'} |
| Included gates | ${releaseGateList(releaseGateCoverageSummary.includedGateIds || [])} |
| Not included gates | ${releaseGateList(releaseGateCoverageSummary.notIncludedGateIds || [])} |
| Passed gates | ${releaseGateList(releaseGateCoverageSummary.passedGateIds || [])} |
| Separate proof required gates | ${releaseGateList(releaseGateCoverageSummary.requiredSeparateProofGateIds || [])} |
| Optional gates not included | ${releaseGateList(releaseGateCoverageSummary.optionalNotIncludedGateIds || [])} |
| Release gate state does-not-prove boundaries | ${releaseGateCoverageSummary.doesNotProveCount ?? 0} |

#### Release Gate Coverage State Details

| Gate | Command | Included in this invocation | Passed in this invocation | Boundary |
| --- | --- | --- | --- | --- |
${releaseGateCoverageStateRows || '| none | none | `not included` | `not included` | none |'}

#### Release Gate Coverage Source Trace

| Gate | Command | Included | Passed | Optional | Separate proof required | Source artifact | Boundary |
| --- | --- | --- | --- | --- | --- | --- | --- |
${releaseGateCoverageSourceRows || '| none | none | `not included` | `not included` | `no` | `no` | none | none |'}

${releaseGateCoverageSummary.sourceTraceBoundary || ''}

#### Release Gate Coverage State Boundary

${releaseGateCoverageSummary.boundary || ''}

#### Release Gate Coverage State Does Not Prove

| Boundary |
| --- |
${releaseGateCoverageDoesNotProveRows || '| none |'}

### Launch-Readiness Source Artifacts

| Artifact | Path |
| --- | --- |
| Launch evidence | \`${sourceArtifacts.launchEvidence || ''}\` |
| Commercial artifact redaction | \`${sourceArtifacts.commercialArtifactRedaction || ''}\` |
| Launch evidence source audit | \`${sourceArtifacts.launchEvidenceSourceAudit || ''}\` |
| Commercial evidence intake source audit | \`${sourceArtifacts.commercialEvidenceIntakeSourceAudit || ''}\` |
| Live proof run packet source audit | \`${sourceArtifacts.liveProofRunPacketSourceAudit || ''}\` |
| Live closeout access source audit | \`${sourceArtifacts.liveCloseoutAccessSourceAudit || ''}\` |
| Manual WCAG review packet source audit | \`${sourceArtifacts.manualWcagReviewPacketSourceAudit || ''}\` |
| Owner evidence completion drill source audit | \`${sourceArtifacts.ownerEvidenceCompletionDrillSourceAudit || ''}\` |
| Live closeout readiness | \`${sourceArtifacts.liveCloseoutReadiness || ''}\` |
| Owner evidence closeout status | \`${sourceArtifacts.ownerEvidenceCloseoutStatus || ''}\` |
| Owner evidence handoff | \`${sourceArtifacts.ownerEvidenceHandoff || ''}\` |
| Owner evidence completion drill | \`${sourceArtifacts.ownerEvidenceCompletionDrill || ''}\` |
| Remediation completion audit | \`${sourceArtifacts.remediationCompletionAudit || ''}\` |
| Remediation external gates | \`${sourceArtifacts.remediationExternalGates || ''}\` |
| Full-local approval package | \`${sourceArtifacts.fullLocalApprovalPackage || ''}\` |

${readiness.evidenceBoundary || ''}

### Post-Summary Artifact Redaction Summary

| Field | Value |
| --- | --- |
| Source artifact | \`${postSummaryArtifactRedactionSummary.sourceArtifact || ''}\` |
| Status | \`${postSummaryArtifactRedactionSummary.status || 'unknown'}\` |
| Command | \`${postSummaryArtifactRedactionSummary.command || ''}\` |
| Execution order | \`${postSummaryArtifactRedactionSummary.executionOrder || ''}\` |
| Included in this invocation | ${markdownBool(postSummaryArtifactRedactionSummary.includedInThisInvocation)} |
| Result JSON | \`${postSummaryArtifactRedactionSummary.resultArtifacts?.json || ''}\` |
| Result Markdown | \`${postSummaryArtifactRedactionSummary.resultArtifacts?.markdown || ''}\` |
| Alignment verifier | \`${postSummaryArtifactRedactionSummary.alignmentVerifier?.command || ''}\` |
| Fixture verifier | \`${postSummaryArtifactRedactionSummary.fixtureVerifier?.command || ''}\` |
| Source trace rows | ${postSummaryArtifactRedactionSummary.sourceTraceCount ?? 0} |
| Does-not-prove boundaries | ${postSummaryArtifactRedactionSummary.doesNotProveCount ?? 0} |

#### Post-Summary Artifact Redaction Source Trace

| Key | Value | Source artifact | Boundary |
| --- | --- | --- | --- |
${postSummaryArtifactRedactionSourceRows || '| none | none | none | none |'}

${postSummaryArtifactRedactionSummary.sourceTraceBoundary || ''}

#### Post-Summary Artifact Redaction Boundary

${postSummaryArtifactRedactionSummary.boundary || ''}

#### Post-Summary Artifact Redaction Does Not Prove

| Boundary |
| --- |
${postSummaryArtifactRedactionDoesNotProveRows || '| none |'}

### Post-Summary Launch-Readiness Alignment State Summary

| Field | Value |
| --- | --- |
| Source artifact | \`${postSummaryLaunchReadinessAlignmentSummary.sourceArtifact || ''}\` |
| Status | \`${postSummaryLaunchReadinessAlignmentSummary.status || 'unknown'}\` |
| Command | \`${postSummaryLaunchReadinessAlignmentSummary.command || ''}\` |
| Execution order | \`${postSummaryLaunchReadinessAlignmentSummary.executionOrder || ''}\` |
| Included in this invocation | ${markdownBool(postSummaryLaunchReadinessAlignmentSummary.includedInThisInvocation)} |
| Fixture verifier | \`${postSummaryLaunchReadinessAlignmentSummary.fixtureVerifier?.command || ''}\` |
| Fixture execution order | \`${postSummaryLaunchReadinessAlignmentSummary.fixtureVerifier?.executionOrder || ''}\` |
| Source trace rows | ${postSummaryLaunchReadinessAlignmentSummary.sourceTraceCount ?? 0} |
| Does-not-prove boundaries | ${postSummaryLaunchReadinessAlignmentSummary.doesNotProveCount ?? 0} |

#### Post-Summary Launch-Readiness Alignment Source Trace

| Key | Value | Source artifact | Boundary |
| --- | --- | --- | --- |
${postSummaryLaunchReadinessAlignmentSourceRows || '| none | none | none | none |'}

${postSummaryLaunchReadinessAlignmentSummary.sourceTraceBoundary || ''}

#### Post-Summary Launch-Readiness Alignment Boundary

${postSummaryLaunchReadinessAlignmentSummary.boundary || ''}

#### Post-Summary Launch-Readiness Alignment Fixture Boundary

${postSummaryLaunchReadinessAlignmentSummary.fixtureVerifier?.boundary || ''}

#### Post-Summary Launch-Readiness Alignment Does Not Prove

| Boundary |
| --- |
${postSummaryLaunchReadinessAlignmentDoesNotProveRows || '| none |'}

### Post-Summary Launch Evidence Refresh State Summary

| Field | Value |
| --- | --- |
| Source artifact | \`${postSummaryLaunchEvidenceRefreshSummary.sourceArtifact || ''}\` |
| Status | \`${postSummaryLaunchEvidenceRefreshSummary.status || 'unknown'}\` |
| Command | \`${postSummaryLaunchEvidenceRefreshSummary.command || ''}\` |
| Execution order | \`${postSummaryLaunchEvidenceRefreshSummary.executionOrder || ''}\` |
| Included in this invocation | ${markdownBool(postSummaryLaunchEvidenceRefreshSummary.includedInThisInvocation)} |
| Result JSON | \`${postSummaryLaunchEvidenceRefreshSummary.resultArtifacts?.json || ''}\` |
| Result Markdown | \`${postSummaryLaunchEvidenceRefreshSummary.resultArtifacts?.markdown || ''}\` |
| Final summary rewrite required | ${markdownBool(postSummaryLaunchEvidenceRefreshSummary.finalSummaryRewrite?.required)} |
| Final summary rewrite purpose | ${markdownCell(postSummaryLaunchEvidenceRefreshSummary.finalSummaryRewrite?.purpose || '')} |
| Source trace rows | ${postSummaryLaunchEvidenceRefreshSummary.sourceTraceCount ?? 0} |
| Does-not-prove boundaries | ${postSummaryLaunchEvidenceRefreshSummary.doesNotProveCount ?? 0} |

#### Post-Summary Launch Evidence Refresh Source Trace

| Key | Value | Source artifact | Boundary |
| --- | --- | --- | --- |
${postSummaryLaunchEvidenceRefreshSourceRows || '| none | none | none | none |'}

${postSummaryLaunchEvidenceRefreshSummary.sourceTraceBoundary || ''}

#### Post-Summary Launch Evidence Refresh Boundary

${postSummaryLaunchEvidenceRefreshSummary.boundary || ''}

#### Post-Summary Launch Evidence Refresh Does Not Prove

| Boundary |
| --- |
${postSummaryLaunchEvidenceRefreshDoesNotProveRows || '| none |'}

### Full-Local Approval Package Summary

| Field | Value |
| --- | --- |
| Source artifact | \`${fullLocalApprovalPackageSummary.sourceArtifact || ''}\` |
| Status | \`${fullLocalApprovalPackageSummary.status || 'unknown'}\` |
| Command | \`${fullLocalApprovalPackageSummary.command || ''}\` |
| Execution order | \`${fullLocalApprovalPackageSummary.executionOrder || ''}\` |
| Included in this invocation | ${markdownBool(fullLocalApprovalPackageSummary.includedInThisInvocation)} |
| Execution approved | ${markdownBool(fullLocalApprovalPackageSummary.executionApproved)} |
| Fixture verifier | \`${fullLocalApprovalPackageSummary.fixtureVerifier?.command || ''}\` |
| Source trace rows | ${fullLocalApprovalPackageSummary.sourceTraceCount ?? 0} |
| Does-not-prove boundaries | ${fullLocalApprovalPackageSummary.doesNotProveCount ?? 0} |

#### Full-Local Approval Source Trace

| Key | Value | Source artifact | Boundary |
| --- | --- | --- | --- |
${fullLocalApprovalSourceRows || '| none | none | none | none |'}

${fullLocalApprovalPackageSummary.sourceTraceBoundary || ''}

#### Full-Local Approval Command Trace

| Optional gate | Command |
| --- | --- |
${fullLocalApprovalCommandRows || '| none | none |'}

#### Full-Local Approval Required Trace

| Gate | Status |
| --- | --- |
${fullLocalApprovalRequiredRows || '| none | none |'}

${fullLocalApprovalPackageSummary.boundary || ''}

### Launch Evidence Required Output Coverage

| Output | Count |
| --- | ---: |
| Gaps | ${deliverableCounts.gapCount ?? 0} |
| Pain points | ${deliverableCounts.painPointCount ?? 0} |
| Target customers | ${deliverableCounts.targetCustomerCount ?? 0} |
| Competitor/substitutes | ${deliverableCounts.competitorSubstituteCount ?? 0} |
| Implementation decisions | ${deliverableCounts.implementationDecisionCount ?? 0} |
| Rejected variants | ${deliverableCounts.rejectedVariantCount ?? 0} |
| Code optimization reviews | ${deliverableCounts.codeOptimizationReviewCount ?? 0} |
| Progress updates | ${deliverableCounts.progressUpdateCount ?? 0} |
| Bottleneck log entries | ${deliverableCounts.bottleneckLogCount ?? 0} |
| Launch evidence summary source trace rows | ${launchEvidenceSummary.sourceTraceCount ?? 0} |
| Launch blocker source trace rows | ${launchEvidence.blockerSourceTraceCount ?? 0} |

#### Required Output Table Counts

| Output | Count |
| --- | ---: |
${requiredOutputTableCountRows || '| none | 0 |'}

#### Launch Score

| Score | Value |
| --- | ---: |
| Security | ${launchScores.security ?? 'unknown'} |
| Readiness | ${launchScores.readiness ?? 'unknown'} |
| Sellability | ${launchScores.sellability ?? 'unknown'} |
| Evidence | ${launchScores.evidence ?? 'unknown'} |
| Overall | ${launchScores.overall ?? 'unknown'} |

#### Outreach And Fix-Report Coverage

| Field | Value |
| --- | --- |
| 30/60/90 plan windows | ${outreachCoverage.planWindowCount ?? 0} |
| Objection handling items | ${outreachCoverage.objectionHandlingCount ?? 0} |
| Objection matrix rows | ${outreachCoverage.objectionHandlingMatrixCount ?? 0} |
| Has email script | ${markdownBool(outreachCoverage.hasEmailScript)} |
| Has LinkedIn script | ${markdownBool(outreachCoverage.hasLinkedInScript)} |
| Has demo narrative | ${markdownBool(outreachCoverage.hasDemoNarrative)} |
| CRM rows | ${crmExport.rowCount ?? 0} |
| CRM JSON | \`${crmExport.artifactJson || ''}\` |
| CRM CSV | \`${crmExport.artifactCsv || ''}\` |
| Unresolved blockers | ${fixReportCoverage.unresolvedBlockerCount ?? 0} |
| Approval gates | ${fixReportCoverage.approvalGateCount ?? 0} |
| Source audit status | \`${fixReportCoverage.sourceAuditStatus || 'unknown'}\` |
| Source audit sources | ${fixReportCoverage.sourceAuditSourceCount ?? 'unknown'} |

${launchEvidenceSummary.evidenceBoundary || ''}

#### Launch Evidence Summary Source Trace

| Coverage | Metric count | Source artifacts | Sources |
| --- | ---: | ---: | --- |
${launchEvidenceSummarySourceRows || '| none | 0 | 0 | none |'}

${launchEvidenceSummary.sourceTraceBoundary || ''}

#### Launch Evidence Blocker Source Trace

| Gate | Status | Severity | Launch gap | Unresolved blocker | Remediation completion | Remediation gates |
| --- | --- | --- | --- | --- | --- | --- |
${launchEvidenceBlockerSourceRows || '| none | closed | none | none | none | none | none |'}

${launchEvidence.sourceTraceBoundary || ''}

${launchEvidence.evidenceBoundary || ''}

### Launch Proof Bucket Coverage

| Field | Value |
| --- | ---: |
| Buckets | ${proofBucketSummary.bucketCount ?? 0} |
| Items | ${proofBucketSummary.itemCount ?? 0} |
| Source paths | ${proofBucketSummary.sourceCount ?? 0} |
| Hosted/live items | ${proofBucketSummary.hostedLiveItemCount ?? 0} |
| Local items | ${proofBucketSummary.localItemCount ?? 0} |
| Repo artifact items | ${proofBucketSummary.repoArtifactItemCount ?? 0} |
| Candidate/shadow items | ${proofBucketSummary.candidateShadowItemCount ?? 0} |
| Roadmap items | ${proofBucketSummary.roadmapItemCount ?? 0} |
| Boundary-bearing items | ${proofBucketSummary.boundaryCount ?? 0} |
| Source trace rows | ${proofBucketSummary.sourceTraceCount ?? 0} |

| Bucket | Items | Status counts |
| --- | ---: | --- |
${proofBucketRows || '| none | 0 | none |'}

#### Launch Proof Bucket Trace

| Bucket | Label | Status | Source | Boundary |
| --- | --- | --- | --- | --- |
${proofBucketTraceRows || '| none | none | none | none | none |'}

#### Launch Proof Bucket Source Trace

| Bucket | Index | Label | Status | Source artifact | Source path | Boundary |
| --- | ---: | --- | --- | --- | --- | --- |
${proofBucketSourceRows || '| none | 0 | none | none | none | none | none |'}

${proofBucketSummary.sourceTraceBoundary || ''}

${proofBucketSummary.evidenceBoundary || ''}

### Launch Source Audit Coverage

| Field | Value |
| --- | --- |
| Artifact | \`${sourceAuditCoverage.artifact || ''}\` |
| Network fetch | ${markdownBool(sourceAuditCoverage.networkFetch)} |
| All passed | ${markdownBool(sourceAuditCoverage.allPassed)} |
| Source URLs | ${sourceAuditCoverage.sourceCount ?? 'unknown'} |
| Passed sources | ${sourceAuditCoverage.passedCount ?? 'unknown'} |
| Failed sources | ${sourceAuditCoverage.failedCount ?? 'unknown'} |
| Missing expectations | ${sourceAuditCoverage.missingExpectationCount ?? 'unknown'} |
| Usage contexts | ${sourceAuditCoverage.usageContextCount ?? 'unknown'} |
| Expectation checks | ${sourceAuditCoverage.expectationCheckCount ?? 'unknown'} |
| Expected-text matches | ${sourceAuditCoverage.expectedTextMatchCount ?? 'unknown'} |
| Fetched sources | ${sourceAuditCoverage.fetchedSourceCount ?? 'unknown'} |
| Source trace rows | ${sourceAuditCoverage.sourceTraceCount ?? 0} |

#### Launch Source Trace

| Source | URL | Status | Expected-text matches | Source artifact |
| --- | --- | --- | ---: | --- |
${sourceAuditTraceRows(sourceAuditCoverage) || '| none | none | none | 0/0 | none |'}

${sourceAuditCoverage.sourceTraceBoundary || ''}

${sourceAuditCoverage.boundary || ''}

### Commercial Evidence Intake Source Audit Coverage

| Field | Value |
| --- | --- |
| Artifact | \`${commercialEvidenceIntakeSourceAuditCoverage.artifact || ''}\` |
| Packet | \`${commercialEvidenceIntakeSourceAuditCoverage.packetPath || ''}\` |
| Network fetch | ${markdownBool(commercialEvidenceIntakeSourceAuditCoverage.networkFetch)} |
| All passed | ${markdownBool(commercialEvidenceIntakeSourceAuditCoverage.allPassed)} |
| FTC references | ${commercialEvidenceIntakeSourceAuditCoverage.sourceCount ?? 'unknown'} |
| Passed references | ${commercialEvidenceIntakeSourceAuditCoverage.passedCount ?? 'unknown'} |
| Failed references | ${commercialEvidenceIntakeSourceAuditCoverage.failedCount ?? 'unknown'} |
| Missing expectations | ${commercialEvidenceIntakeSourceAuditCoverage.missingExpectationCount ?? 'unknown'} |
| Unexpected references | ${commercialEvidenceIntakeSourceAuditCoverage.unexpectedReferenceCount ?? 'unknown'} |
| Applies-to entries | ${commercialEvidenceIntakeSourceAuditCoverage.appliesToCount ?? 'unknown'} |
| Expectation checks | ${commercialEvidenceIntakeSourceAuditCoverage.expectationCheckCount ?? 'unknown'} |
| Expected-text matches | ${commercialEvidenceIntakeSourceAuditCoverage.expectedTextMatchCount ?? 'unknown'} |
| Fetched references | ${commercialEvidenceIntakeSourceAuditCoverage.fetchedSourceCount ?? 'unknown'} |
| Source trace rows | ${commercialEvidenceIntakeSourceAuditCoverage.sourceTraceCount ?? 0} |

#### Commercial Evidence Intake Source Trace

| Source | URL | Status | Expected-text matches | Source artifact |
| --- | --- | --- | ---: | --- |
${sourceAuditTraceRows(commercialEvidenceIntakeSourceAuditCoverage) || '| none | none | none | 0/0 | none |'}

${commercialEvidenceIntakeSourceAuditCoverage.sourceTraceBoundary || ''}

${commercialEvidenceIntakeSourceAuditCoverage.boundary || ''}

### Live Proof Run Packet Source Audit Coverage

| Field | Value |
| --- | --- |
| Artifact | \`${liveProofRunPacketSourceAuditCoverage.artifact || ''}\` |
| Packet | \`${liveProofRunPacketSourceAuditCoverage.packetPath || ''}\` |
| Network fetch | ${markdownBool(liveProofRunPacketSourceAuditCoverage.networkFetch)} |
| All passed | ${markdownBool(liveProofRunPacketSourceAuditCoverage.allPassed)} |
| Stripe/Supabase/GitHub references | ${liveProofRunPacketSourceAuditCoverage.sourceCount ?? 'unknown'} |
| Passed references | ${liveProofRunPacketSourceAuditCoverage.passedCount ?? 'unknown'} |
| Failed references | ${liveProofRunPacketSourceAuditCoverage.failedCount ?? 'unknown'} |
| Missing expectations | ${liveProofRunPacketSourceAuditCoverage.missingExpectationCount ?? 'unknown'} |
| Unexpected references | ${liveProofRunPacketSourceAuditCoverage.unexpectedReferenceCount ?? 'unknown'} |
| Applies-to entries | ${liveProofRunPacketSourceAuditCoverage.appliesToCount ?? 'unknown'} |
| Expectation checks | ${liveProofRunPacketSourceAuditCoverage.expectationCheckCount ?? 'unknown'} |
| Expected-text matches | ${liveProofRunPacketSourceAuditCoverage.expectedTextMatchCount ?? 'unknown'} |
| Fetched references | ${liveProofRunPacketSourceAuditCoverage.fetchedSourceCount ?? 'unknown'} |
| Source trace rows | ${liveProofRunPacketSourceAuditCoverage.sourceTraceCount ?? 0} |

#### Live Proof Run Packet Source Trace

| Source | URL | Status | Expected-text matches | Source artifact |
| --- | --- | --- | ---: | --- |
${sourceAuditTraceRows(liveProofRunPacketSourceAuditCoverage) || '| none | none | none | 0/0 | none |'}

${liveProofRunPacketSourceAuditCoverage.sourceTraceBoundary || ''}

${liveProofRunPacketSourceAuditCoverage.boundary || ''}

### Live Closeout Access Source Audit Coverage

| Field | Value |
| --- | --- |
| Artifact | \`${liveCloseoutAccessSourceAuditCoverage.artifact || ''}\` |
| Readiness artifact | \`${liveCloseoutAccessSourceAuditCoverage.readinessPath || ''}\` |
| Network fetch | ${markdownBool(liveCloseoutAccessSourceAuditCoverage.networkFetch)} |
| All passed | ${markdownBool(liveCloseoutAccessSourceAuditCoverage.allPassed)} |
| Supabase/GitHub access references | ${liveCloseoutAccessSourceAuditCoverage.sourceCount ?? 'unknown'} |
| Passed references | ${liveCloseoutAccessSourceAuditCoverage.passedCount ?? 'unknown'} |
| Failed references | ${liveCloseoutAccessSourceAuditCoverage.failedCount ?? 'unknown'} |
| Missing expectations | ${liveCloseoutAccessSourceAuditCoverage.missingExpectationCount ?? 'unknown'} |
| Unexpected references | ${liveCloseoutAccessSourceAuditCoverage.unexpectedReferenceCount ?? 'unknown'} |
| Applies-to entries | ${liveCloseoutAccessSourceAuditCoverage.appliesToCount ?? 'unknown'} |
| Expectation checks | ${liveCloseoutAccessSourceAuditCoverage.expectationCheckCount ?? 'unknown'} |
| Expected-text matches | ${liveCloseoutAccessSourceAuditCoverage.expectedTextMatchCount ?? 'unknown'} |
| Fetched references | ${liveCloseoutAccessSourceAuditCoverage.fetchedSourceCount ?? 'unknown'} |
| Source trace rows | ${liveCloseoutAccessSourceAuditCoverage.sourceTraceCount ?? 0} |

#### Live Closeout Access Source Trace

| Source | URL | Status | Expected-text matches | Source artifact |
| --- | --- | --- | ---: | --- |
${sourceAuditTraceRows(liveCloseoutAccessSourceAuditCoverage) || '| none | none | none | 0/0 | none |'}

${liveCloseoutAccessSourceAuditCoverage.sourceTraceBoundary || ''}

${liveCloseoutAccessSourceAuditCoverage.boundary || ''}

### Live Closeout Readiness Status

| Field | Value |
| --- | --- |
| Artifact | \`${liveCloseoutReadinessCoverage.artifact || ''}\` |
| Status | \`${liveCloseoutReadinessCoverage.status || 'unknown'}\` |
| OK | ${markdownBool(liveCloseoutReadinessCoverage.ok)} |
| Allow incomplete | ${markdownBool(liveCloseoutReadinessCoverage.allowIncomplete)} |
| Target project ref | \`${liveCloseoutReadinessCoverage.targetProjectRef || ''}\` |
| Check count | ${liveCloseoutReadinessCoverage.checkCount ?? 'unknown'} |
| Passed checks | ${liveCloseoutReadinessCoverage.passedCheckCount ?? 'unknown'} |
| Failed checks | ${liveCloseoutReadinessCoverage.failedCheckCount ?? 'unknown'} |
| Failed check IDs | ${(liveCloseoutReadinessCoverage.failedCheckIds || []).map(markdownCell).join(', ') || 'none'} |
| GitHub required secret names present | ${liveCloseoutReadinessCoverage.githubSecrets?.presentRequiredSecretNameCount ?? 'unknown'} |
| GitHub missing required secret names | ${liveCloseoutReadinessCoverage.githubSecrets?.missingRequiredSecretNameCount ?? 'unknown'} |
| Supabase project list available | ${markdownBool(liveCloseoutReadinessCoverage.supabaseAccess?.projectsListAvailable)} |
| Supabase target project visible | ${markdownBool(liveCloseoutReadinessCoverage.supabaseAccess?.targetProjectVisible)} |
| Supabase functions API accessible | ${markdownBool(liveCloseoutReadinessCoverage.supabaseAccess?.functionsApiAccessible)} |
| Mutates external state | ${markdownBool(liveCloseoutReadinessCoverage.mutatesExternalState)} |
| Prints secret values | ${markdownBool(liveCloseoutReadinessCoverage.printsSecretValues)} |
| Official references | ${liveCloseoutReadinessCoverage.officialReferenceCount ?? 'unknown'} |
| Next actions | ${liveCloseoutReadinessCoverage.nextActionCount ?? 'unknown'} |
| Does-not-prove boundaries | ${liveCloseoutReadinessCoverage.doesNotProveCount ?? 'unknown'} |
| Check source trace rows | ${liveCloseoutReadinessCoverage.checkSourceTraceCount ?? 0} |
| Failed check source trace rows | ${liveCloseoutReadinessCoverage.failedCheckSourceTraceCount ?? 0} |
| Next action source trace rows | ${liveCloseoutReadinessCoverage.nextActionSourceTraceCount ?? 0} |
| Official reference source trace rows | ${liveCloseoutReadinessCoverage.officialReferenceSourceTraceCount ?? 0} |

#### Live Closeout Readiness Check Trace

| Check | Passed | Message | Source artifact |
| --- | --- | --- | --- |
${liveCloseoutReadinessCheckRows || '| none | no | none | none |'}

#### Live Closeout Readiness Next Action Source Trace

| Order | Next action | Source artifact |
| ---: | --- | --- |
${liveCloseoutReadinessNextActionRows || '| 0 | none | none |'}

#### Live Closeout Readiness Official Reference Source Trace

| Reference | URL | Applies to | Source artifact |
| --- | --- | --- | --- |
${liveCloseoutReadinessOfficialReferenceRows || '| none | none | none | none |'}

${liveCloseoutReadinessCoverage.sourceTraceBoundary || ''}

${liveCloseoutReadinessCoverage.boundary || ''}

### Manual WCAG Review Packet Source Audit Coverage

| Field | Value |
| --- | --- |
| Artifact | \`${manualWcagReviewPacketSourceAuditCoverage.artifact || ''}\` |
| Packet | \`${manualWcagReviewPacketSourceAuditCoverage.packetPath || ''}\` |
| Network fetch | ${markdownBool(manualWcagReviewPacketSourceAuditCoverage.networkFetch)} |
| All passed | ${markdownBool(manualWcagReviewPacketSourceAuditCoverage.allPassed)} |
| W3C/WAI references | ${manualWcagReviewPacketSourceAuditCoverage.sourceCount ?? 'unknown'} |
| Passed references | ${manualWcagReviewPacketSourceAuditCoverage.passedCount ?? 'unknown'} |
| Failed references | ${manualWcagReviewPacketSourceAuditCoverage.failedCount ?? 'unknown'} |
| Missing expectations | ${manualWcagReviewPacketSourceAuditCoverage.missingExpectationCount ?? 'unknown'} |
| Unexpected references | ${manualWcagReviewPacketSourceAuditCoverage.unexpectedReferenceCount ?? 'unknown'} |
| Checkpoint references | ${manualWcagReviewPacketSourceAuditCoverage.checkpointReferenceCount ?? 'unknown'} |
| Expectation checks | ${manualWcagReviewPacketSourceAuditCoverage.expectationCheckCount ?? 'unknown'} |
| Expected-text matches | ${manualWcagReviewPacketSourceAuditCoverage.expectedTextMatchCount ?? 'unknown'} |
| Fetched references | ${manualWcagReviewPacketSourceAuditCoverage.fetchedSourceCount ?? 'unknown'} |
| Source trace rows | ${manualWcagReviewPacketSourceAuditCoverage.sourceTraceCount ?? 0} |

#### Manual WCAG Review Packet Source Trace

| Source | URL | Status | Expected-text matches | Source artifact |
| --- | --- | --- | ---: | --- |
${sourceAuditTraceRows(manualWcagReviewPacketSourceAuditCoverage) || '| none | none | none | 0/0 | none |'}

${manualWcagReviewPacketSourceAuditCoverage.sourceTraceBoundary || ''}

${manualWcagReviewPacketSourceAuditCoverage.boundary || ''}

### Owner Evidence Completion Drill Source Audit Coverage

| Field | Value |
| --- | --- |
| Artifact | \`${ownerEvidenceCompletionDrillSourceAuditCoverage.artifact || ''}\` |
| Drill | \`${ownerEvidenceCompletionDrillSourceAuditCoverage.drillPath || ''}\` |
| Network fetch | ${markdownBool(ownerEvidenceCompletionDrillSourceAuditCoverage.networkFetch)} |
| All passed | ${markdownBool(ownerEvidenceCompletionDrillSourceAuditCoverage.allPassed)} |
| Official references | ${ownerEvidenceCompletionDrillSourceAuditCoverage.sourceCount ?? 'unknown'} |
| Passed references | ${ownerEvidenceCompletionDrillSourceAuditCoverage.passedCount ?? 'unknown'} |
| Failed references | ${ownerEvidenceCompletionDrillSourceAuditCoverage.failedCount ?? 'unknown'} |
| Missing expectations | ${ownerEvidenceCompletionDrillSourceAuditCoverage.missingExpectationCount ?? 'unknown'} |
| Unexpected references | ${ownerEvidenceCompletionDrillSourceAuditCoverage.unexpectedReferenceCount ?? 'unknown'} |
| Top-level URL mismatch | ${markdownBool(ownerEvidenceCompletionDrillSourceAuditCoverage.topLevelUrlMismatch)} |
| Expectation checks | ${ownerEvidenceCompletionDrillSourceAuditCoverage.expectationCheckCount ?? 'unknown'} |
| Expected-text matches | ${ownerEvidenceCompletionDrillSourceAuditCoverage.expectedTextMatchCount ?? 'unknown'} |
| Fetched references | ${ownerEvidenceCompletionDrillSourceAuditCoverage.fetchedSourceCount ?? 'unknown'} |
| Source trace rows | ${ownerEvidenceCompletionDrillSourceAuditCoverage.sourceTraceCount ?? 0} |

#### Owner Evidence Completion Drill Source Trace

| Source | URL | Status | Expected-text matches | Source artifact |
| --- | --- | --- | ---: | --- |
${sourceAuditTraceRows(ownerEvidenceCompletionDrillSourceAuditCoverage) || '| none | none | none | 0/0 | none |'}

${ownerEvidenceCompletionDrillSourceAuditCoverage.sourceTraceBoundary || ''}

${ownerEvidenceCompletionDrillSourceAuditCoverage.boundary || ''}

### Owner Evidence Execution Coverage

| Field | Value |
| --- | --- |
| Execution status | \`${ownerEvidenceExecutionSummary.status || 'unknown'}\` |
| Goal complete | ${markdownBool(ownerEvidenceExecutionSummary.goalComplete)} |
| Remaining gates | ${ownerCloseoutCoverage.failedStepIds ? (ownerExecutionGateIds.remaining || []).length : ownerGateScoreboard.remainingGateCount ?? 0} |
| Owner action queue count | ${ownerCloseoutCoverage.ownerActionQueueCount ?? 'unknown'} |
| Owner action rows | ${ownerHandoffCoverage.ownerActionRowCount ?? 0} |
| Owner action needed count | ${ownerCloseoutCoverage.ownerActionNeededCount ?? 'unknown'} |
| Owner prep actions needed | ${ownerCloseoutCoverage.ownerPrepActionNeededCount ?? 'unknown'} |
| Owner prep by-gate entries | ${ownerPrepActionNeededByGateCoverage.ownerPrepActionNeededGateCount ?? 0} |
| Gate-scoped owner prep actions | ${ownerPrepActionNeededByGateCoverage.gateScopedOwnerPrepActionCount ?? 0} |
| Unique owner prep actions | ${ownerPrepActionNeededByGateCoverage.uniqueOwnerPrepActionNeededCount ?? 'unknown'} |
| Shared owner prep actions | ${ownerPrepActionNeededByGateCoverage.sharedOwnerPrepActionCount ?? 'unknown'} |
| Operational access prerequisites | ${ownerOperationalAccessPrerequisiteSummary.prerequisiteCount ?? 0} |
| Operational access blocking checks | ${ownerOperationalAccessPrerequisiteSummary.blockingCheckCount ?? 0} |
| Operational access source trace rows | ${ownerOperationalAccessPrerequisiteSummary.sourceTraceCount ?? 0} |
| Operational access source artifacts | ${ownerOperationalAccessPrerequisiteSummary.sourceArtifactCount ?? 0} |
| Operational access blocking check source anchors | ${ownerOperationalAccessPrerequisiteSummary.sourceTraceBlockingCheckCount ?? 0} |
| Local safety status | \`${ownerLocalSafetyStatusSummary.status || 'unknown'}\` |
| Local safety protected paths ignored | ${ownerLocalSafetyStatusSummary.ignoredProtectedPathCount ?? 0}/${ownerLocalSafetyStatusSummary.protectedPathCount ?? 0} |
| Local safety source trace rows | ${ownerLocalSafetyStatusSummary.sourceTraceCount ?? 0} |
| Local safety source artifacts | ${ownerLocalSafetyStatusSummary.sourceArtifactCount ?? 0} |
| Handoff local safety aligned | ${markdownBool(ownerLocalSafetyStatusSummary.handoffStatusMatchesLocalSafety)} |
| Completion-drill local safety aligned | ${markdownBool(ownerLocalSafetyStatusSummary.completionDrillStatusMatchesLocalSafety)} |
| Failed closeout steps | ${ownerCloseoutCoverage.failedStepCount ?? 0} |
| Failed closeout source trace rows | ${ownerCloseoutCoverage.failedStepSourceTraceCount ?? 0} |
| Failed closeout source artifact | \`${ownerCloseoutCoverage.failedStepSourceArtifact || ''}\` |
| Failed closeout command anchors | ${ownerCloseoutCoverage.failedStepSourceTraceCommandCount ?? 0} |
| Closeout next command keys | ${ownerCloseoutCoverage.nextCommandCount ?? 0} |
| Closeout next command values | ${ownerCloseoutCoverage.nextCommandValueCount ?? 0} |
| Closeout next command source trace rows | ${ownerCloseoutCoverage.nextCommandSourceTraceCount ?? 0} |
| Closeout status artifacts | ${ownerCloseoutCoverage.statusArtifactCount ?? 0} |
| Closeout status artifact trace rows | ${ownerCloseoutCoverage.statusArtifactSourceTraceCount ?? 0} |
| Handoff commands | ${ownerHandoffCoverage.commandSequenceCount ?? 0} |
| Handoff command source trace rows | ${ownerHandoffCoverage.commandSequenceSourceTraceCount ?? 0} |
| Completion-drill recommended commands | ${ownerCompletionDrillCoverage.recommendedCommandCount ?? 0} |
| Completion-drill command source trace rows | ${ownerCompletionDrillCoverage.recommendedCommandOrderSourceTraceCount ?? 0} |
| Completion-drill packets | ${ownerCompletionDrillCoverage.packetCount ?? 0} |
| Completion-drill official reference URLs | ${ownerCompletionDrillCoverage.officialReferenceCount ?? 0} |
| Completion-drill matrix rows | ${ownerCompletionDrillCoverage.matrixRowCount ?? 0} |

#### Owner Evidence Gate Trace

| Source | Gate IDs |
| --- | --- |
${ownerExecutionGateRows}

#### Owner Prep By-Gate Trace

| Gate | Owner prep actions | Source artifact |
| --- | ---: | --- |
${ownerPrepByGateRows || '| none | 0 | none |'}

${ownerEvidenceExecutionSummary.ownerPrepActionNeededByGateBoundary || ''}

#### Owner Closeout Next Command Source Trace

| Key | Command(s) | Command count | Source artifact |
| --- | --- | ---: | --- |
${ownerCloseoutNextCommandRows || '| none | none | 0 | none |'}

#### Owner Closeout Status Artifact Trace

| Key | Artifact path | Source artifact |
| --- | --- | --- |
${ownerCloseoutStatusArtifactRows || '| none | none | none |'}

${ownerCloseoutCoverage.nextCommandSourceTraceBoundary || ''}

#### Owner Closeout Failed Step Source Trace

| Step | Status | Command | Source artifact |
| --- | --- | --- | --- |
${ownerCloseoutFailedStepRows || '| none | none | none | none |'}

${ownerCloseoutCoverage.failedStepSourceTraceBoundary || ''}

#### Operational Access Prerequisite Trace

| ID | Status | Track | Owner prep command | Next command | Blocking checks |
| --- | --- | --- | --- | --- | --- |
${ownerOperationalAccessRows || '| none | none | none | none | none | none |'}

${ownerOperationalAccessPrerequisiteSummary.boundary || ''}

#### Operational Access Source Trace

| ID | Handoff | Completion drill | Live closeout readiness | Blocking check anchors |
| --- | --- | --- | --- | --- |
${ownerOperationalAccessSourceRows || '| none | none | none | none | none |'}

${ownerOperationalAccessPrerequisiteSummary.sourceTraceBoundary || ''}

#### Owner Local Safety Source Trace

| Key | Value | Local-safety source artifact | Handoff source artifact | Completion-drill source artifact |
| --- | --- | --- | --- | --- |
${ownerLocalSafetySourceRows || '| none | none | none | none | none |'}

${ownerLocalSafetyStatusSummary.sourceTraceBoundary || ''}

${ownerLocalSafetyStatusSummary.boundary || ''}

#### Owner Handoff Command Source Trace

| Order | Command | Source artifact |
| ---: | --- | --- |
${ownerHandoffCommandSourceRows || '| 0 | none | none |'}

#### Completion Drill Command Source Trace

| Order | Command | Source artifact |
| ---: | --- | --- |
${ownerCompletionCommandSourceRows || '| 0 | none | none |'}

${ownerEvidenceExecutionSummary.commandSequenceSourceTraceBoundary || ''}

${ownerEvidenceExecutionSummary.evidenceBoundary || ''}

### Owner Action Queue Detail

| Field | Value |
| --- | ---: |
| Queue rows | ${ownerActionQueueSummary.queueCount ?? 0} |
| Closeout rows | ${ownerActionQueueSummary.closeoutQueueCount ?? 0} |
| Handoff rows | ${ownerActionQueueSummary.handoffRowCount ?? 0} |
| Completion-drill rows | ${ownerActionQueueSummary.completionDrillRowCount ?? 0} |
| Primary source artifact | \`${ownerActionQueueSummary.sourceArtifact || ''}\` |
| Source artifacts | ${ownerActionQueueSummary.sourceArtifactCount ?? 0} |
| Row source artifacts | ${ownerActionQueueSummary.rowSourceArtifactCount ?? 0} |
| Owner action source trace rows | ${ownerActionQueueSummary.sourceTraceCount ?? 0} |
| Owner prep commands | ${ownerActionQueueSummary.ownerPrepCommandCount ?? 0} |
| Next commands | ${ownerActionQueueSummary.nextCommandCount ?? 0} |
| Raw-evidence policies | ${ownerActionQueueSummary.rawEvidencePolicyCount ?? 0} |
| Repo limitation notes | ${ownerActionQueueSummary.repoDoesNotDoCount ?? 0} |
| Blocking owner-action notes | ${ownerActionQueueSummary.blockingOwnerActionCount ?? 0} |
| Closeout failure details | ${ownerActionQueueSummary.closeoutFailureDetailCount ?? 0} |

#### Owner Action Command Trace

| Gate | Status | Track | Source artifact | Source boundary | Owner prep command | Next command | Blocking owner actions | Closeout failure details |
| --- | --- | --- | --- | --- | --- | --- | ---: | ---: |
${ownerActionQueueRows || '| none | none | none | none | none | none | none | 0 | 0 |'}

#### Owner Action Boundary Trace

| Gate | Risk if skipped | Does not prove |
| --- | --- | --- |
${ownerActionBoundaryRows || '| none | none | none |'}

#### Owner Action Source Trace

| Gate | Remediation ledger | Closeout status | Handoff | Completion drill |
| --- | --- | --- | --- | --- |
${ownerActionSourceRows || '| none | none | none | none | none |'}

${ownerActionQueueSummary.sourceTraceBoundary || ''}

${ownerActionQueueSummary.evidenceBoundary || ''}

### Progress Updates

| Phase | Accomplished items | Target matrix rows | Pending items | Current phase actions | Bottleneck |
| --- | ---: | ---: | ---: | ---: | --- |
${progressRows || '| none | 0 | 0 | 0 | 0 | no launch-evidence progress update mirrored into the summary |'}

### Bottleneck Log

| Phase | Task/subtask | Root cause | Top unblock options |
| --- | --- | --- | ---: |
${bottleneckRows || '| none | none | none | 0 |'}

### Implementation Decisions

| Decision | Chosen variant | Acceptance check | Tests run |
| --- | --- | --- | --- |
${implementationDecisionRows || '| none | none | none | none |'}

### Rejected Variants

| Variant | Reason rejected | Tradeoff | Evidence |
| --- | --- | --- | --- |
${rejectedVariantRows || '| none | none | none | none |'}

### Code Optimization Reviews

| Target task | Policy | Verdict | Minimality score | Checks |
| --- | --- | --- | ---: | --- |
${codeOptimizationReviewRows || '| none | none | none | 0/5 | none |'}

Alignment errors:

${alignmentErrorText}

## Release Gate Coverage

| Gate | Command | Included in this invocation | Passed in this invocation | Boundary |
| --- | --- | --- | --- | --- |
${coverageRows}

${summary.releaseGateCoverage.boundary}

## Post-Summary Artifact Redaction

Command: \`${summary.postSummaryArtifactRedaction.command}\`
Execution order: \`${summary.postSummaryArtifactRedaction.executionOrder}\`
Included in this invocation: ${markdownBool(summary.postSummaryArtifactRedaction.includedInThisInvocation)}
Result artifacts: \`${summary.postSummaryArtifactRedaction.resultArtifacts.json}\`, \`${summary.postSummaryArtifactRedaction.resultArtifacts.markdown}\`
Alignment verifier: \`${summary.postSummaryArtifactRedaction.alignmentVerifier.command}\`
Fixture verifier: \`${summary.postSummaryArtifactRedaction.fixtureVerifier.command}\`

${summary.postSummaryArtifactRedaction.boundary}

${summary.postSummaryArtifactRedaction.alignmentVerifier.boundary}

${summary.postSummaryArtifactRedaction.fixtureVerifier.boundary}

## Post-Summary Launch-Readiness Alignment

Check: Verify final summary launch-readiness state aligns with owner/remediation ledgers
Source artifact: \`${summary.postSummaryLaunchReadinessAlignment.sourceArtifact}\`
Status: \`${summary.postSummaryLaunchReadinessAlignment.status}\`
Command: \`${summary.postSummaryLaunchReadinessAlignment.command}\`
Execution order: \`${summary.postSummaryLaunchReadinessAlignment.executionOrder}\`
Included in this invocation: ${markdownBool(summary.postSummaryLaunchReadinessAlignment.includedInThisInvocation)}
Fixture verifier: \`${summary.postSummaryLaunchReadinessAlignment.fixtureVerifier.command}\`
Source trace rows: ${summary.postSummaryLaunchReadinessAlignment.sourceTraceCount ?? 0}
Does-not-prove boundaries: ${summary.postSummaryLaunchReadinessAlignment.doesNotProveCount ?? 0}

### Post-Summary Launch-Readiness Alignment Appendix Source Trace

| Key | Value | Source artifact | Boundary |
| --- | --- | --- | --- |
${postSummaryCommandSourceRows(summary.postSummaryLaunchReadinessAlignment.sourceTrace)}

${summary.postSummaryLaunchReadinessAlignment.sourceTraceBoundary}

${summary.postSummaryLaunchReadinessAlignment.boundary}

${summary.postSummaryLaunchReadinessAlignment.fixtureVerifier.boundary}

### Post-Summary Launch-Readiness Alignment Appendix Does Not Prove

| Boundary |
| --- |
${(summary.postSummaryLaunchReadinessAlignment.doesNotProve || [])
  .map((item) => `| ${markdownCell(item)} |`)
  .join('\n')}

## Post-Summary Launch Evidence Refresh

Command: \`${summary.postSummaryLaunchEvidenceRefresh.command}\`
Execution order: \`${summary.postSummaryLaunchEvidenceRefresh.executionOrder}\`
Included in this invocation: ${markdownBool(summary.postSummaryLaunchEvidenceRefresh.includedInThisInvocation)}
Artifacts: \`${summary.postSummaryLaunchEvidenceRefresh.resultArtifacts.json}\`, \`${summary.postSummaryLaunchEvidenceRefresh.resultArtifacts.markdown}\`

${summary.postSummaryLaunchEvidenceRefresh.boundary}

## Post-Summary Full-Local Approval Package

Command: \`${summary.postSummaryFullLocalApprovalPackage.command}\`
Execution order: \`${summary.postSummaryFullLocalApprovalPackage.executionOrder}\`
Included in this invocation: ${markdownBool(summary.postSummaryFullLocalApprovalPackage.includedInThisInvocation)}
Condition: ${summary.postSummaryFullLocalApprovalPackage.condition}
Fixture verifier: \`${summary.postSummaryFullLocalApprovalPackage.fixtureVerifier.command}\`

${summary.postSummaryFullLocalApprovalPackage.boundary}

${summary.postSummaryFullLocalApprovalPackage.fixtureVerifier.boundary}

## Step Results

| Step | Status | Command | Duration seconds | Exit code |
| --- | --- | --- | ---: | ---: |
${stepRows}

## Evidence Boundary

${summary.evidenceBoundary}

## Does Not Prove

${summary.doesNotProve.map((item) => `- ${item}`).join('\n')}
`;
}

function writeCommercialVerificationSummary(summaryInput) {
  const summary = summaryInput.schemaVersion
    ? summaryInput
    : buildCommercialVerificationSummary(summaryInput);
  mkdirSync(path.dirname(COMMERCIAL_VERIFICATION_SUMMARY_JSON), { recursive: true });
  writeFileSync(COMMERCIAL_VERIFICATION_SUMMARY_JSON, `${JSON.stringify(summary, null, 2)}\n`);
  writeFileSync(COMMERCIAL_VERIFICATION_SUMMARY_MD, renderCommercialVerificationSummaryMarkdown(summary));
}

function terminateChildTree(child, signal) {
  if (!child?.pid) {
    return;
  }

  try {
    if (process.platform === 'win32') {
      child.kill(signal);
      return;
    }

    process.kill(-child.pid, signal);
  } catch (error) {
    if (error?.code !== 'ESRCH') {
      console.error(`Unable to send ${signal} to '${child.pid}': ${error.message}`);
    }
  }
}

function installSignalForwarding() {
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      if (activeChild) {
        console.error(`\nCommercial verification received ${signal}; terminating active child process tree.`);
        terminateChildTree(activeChild, 'SIGTERM');
        setTimeout(() => terminateChildTree(activeChild, 'SIGKILL'), TERMINATION_GRACE_MS).unref();
      }

      process.exitCode = signal === 'SIGINT' ? 130 : 143;
      setTimeout(() => process.exit(process.exitCode), TERMINATION_GRACE_MS).unref();
    });
  }
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function runStep(step) {
  return new Promise((resolve) => {
    const [command, ...args] = step.command;
    const executable = process.platform === 'win32' && command === 'npm' ? 'npm.cmd' : command;
    const timeoutMs = step.timeoutMs ?? DEFAULT_STEP_TIMEOUT_MS;
    const child = spawn(executable, args, {
      stdio: 'inherit',
      detached: process.platform !== 'win32',
    });

    activeChild = child;
    let timedOut = false;
    let killTimer = null;

    const timeout = setTimeout(() => {
      timedOut = true;
      console.error(
        `\nCommercial verification step '${step.id}' exceeded ${formatDuration(timeoutMs)}; terminating child process tree.`,
      );
      terminateChildTree(child, 'SIGTERM');
      killTimer = setTimeout(() => terminateChildTree(child, 'SIGKILL'), TERMINATION_GRACE_MS);
      killTimer.unref();
    }, timeoutMs);

    timeout.unref();

    function cleanup() {
      clearTimeout(timeout);
      if (killTimer) {
        clearTimeout(killTimer);
      }
      if (activeChild === child) {
        activeChild = null;
      }
    }

    child.on('error', (error) => {
      cleanup();
      console.error(`Commercial verification step '${step.id}' failed to start: ${error.message}`);
      resolve({ code: 1, timedOut: false, signal: null });
    });

    child.on('close', (code, signal) => {
      cleanup();
      resolve({
        code: timedOut ? 124 : code ?? 1,
        timedOut,
        signal,
      });
    });
  });
}

async function runPostSummaryStep(step) {
  const startedAt = Date.now();
  console.log(`\n==> ${step.label}`);
  const result = await runStep(step);
  const durationSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);

  if (result.code !== 0) {
    const timeoutText = result.timedOut ? ' after hitting the step timeout' : '';
    const signalText = result.signal ? ` (signal ${result.signal})` : '';
    console.error(
      `\nCommercial verification stopped at '${step.id}' after ${durationSeconds}s${timeoutText} with exit code ${result.code}${signalText}.`,
    );
    process.exitCode = result.code;
    return false;
  }

  console.log(`ok ${step.id} (${durationSeconds}s)`);
  return true;
}

function printUsage() {
  console.log(`Usage: node scripts/verify-commercial-release.mjs [options]

Options:
  --with-network   Also run official source URL checks, launch-evidence source URL audit, and npm production audit.
  --with-live-supabase
                   Also run non-mutating live Supabase object/RPC proof using SUPABASE_URL and SUPABASE_ANON_KEY.
  --with-live-onet Also run non-mutating live O*NET Task Ratings schema/row proof using SUPABASE_URL and SUPABASE_ANON_KEY.
  --with-live-resume-parser
                   Also run live parse-resume Edge Function receipt proof using SUPABASE_URL and SUPABASE_ANON_KEY.
  --with-a11y      Also run the Playwright responsive/accessibility smoke gate.
  --with-journey   Also run the full Playwright lead/report/workforce browser journey.

Timeouts:
  Each child step is bounded to avoid inconclusive aggregate release runs. Override with:
    COMMERCIAL_VERIFY_STEP_TIMEOUT_MS, COMMERCIAL_VERIFY_BUILD_TIMEOUT_MS,
    COMMERCIAL_VERIFY_BROWSER_TIMEOUT_MS, COMMERCIAL_VERIFY_NETWORK_TIMEOUT_MS,
    COMMERCIAL_VERIFY_LIVE_TIMEOUT_MS, COMMERCIAL_VERIFY_AUDIT_TIMEOUT_MS.

Default gate:
  index, worktree hygiene and fixture coverage, trust, report evidence, proof visibility UI, Phase E commercial validation, O*NET Task Ratings ingest boundary, live Supabase deployment packet,
  data provenance, redacted live-gate evidence intake, owner live-proof run packet alignment and failure fixtures, commercial evidence records and failure fixtures, manual WCAG evidence fixtures, owner-evidence prep status,
	  owner-evidence local-safety fixture smoke, owner-evidence artifact-hasher fixture smoke, owner-evidence closeout status, owner-evidence prep-readiness alignment, owner-evidence fixture fail-closed smoke,
	  remediation gate ledger, owner-action queue alignment, owner-evidence handoff packet, owner command checklist fixtures, and live-proof command alignment fixtures, remediation completion audit, launch evidence manifest alignment fixtures,
	  scoped commercial lint, secret hygiene, TypeScript no-emit, tracked diff whitespace hygiene,
	  repository presentation, production build, route smoke, post-summary launch-readiness alignment checks,
	  and a default-only post-summary full-local approval-package consistency check.
	`);
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    printUsage();
    return;
  }

  const includeNetwork = hasFlag('--with-network');
  const includeLiveSupabase = hasFlag('--with-live-supabase');
  const includeLiveOnet = hasFlag('--with-live-onet');
  const includeLiveResumeParser = hasFlag('--with-live-resume-parser');
  const includeA11y = hasFlag('--with-a11y');
  const includeJourney = hasFlag('--with-journey');
  const options = {
    includeNetwork,
    includeLiveSupabase,
    includeLiveOnet,
    includeLiveResumeParser,
    includeA11y,
    includeJourney,
  };

  const defaultSteps = DEFAULT_STEPS.flatMap((step) =>
    includeNetwork && step.id === 'data-provenance' ? [SOURCE_REGISTRY_STEP, step] : [step],
  );
  const networkFollowUpSteps = includeNetwork
    ? NETWORK_STEPS.filter((step) => step.id !== SOURCE_REGISTRY_STEP.id)
    : [];
  const steps = [
    ...defaultSteps,
    ...(includeA11y ? A11Y_STEPS : []),
    ...networkFollowUpSteps,
    ...(includeLiveSupabase ? LIVE_SUPABASE_STEPS : []),
    ...(includeLiveOnet ? LIVE_ONET_STEPS : []),
    ...(includeLiveResumeParser ? LIVE_RESUME_PARSER_STEPS : []),
    ...(includeJourney ? JOURNEY_STEPS : []),
  ];

  const results = [];
  const startedAtIso = new Date().toISOString();
  writeCommercialVerificationSummary({
    status: 'running',
    startedAt: startedAtIso,
    endedAt: null,
    steps,
    results,
    options,
  });
  console.log(`Commercial verification starting with ${steps.length} step(s).`);

  for (const step of steps) {
    const startedAt = Date.now();
    console.log(`\n==> ${step.label}`);
    const result = await runStep(step);
    const durationSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
    results.push({ ...step, ...result, durationSeconds });

    if (result.code !== 0) {
      const timeoutText = result.timedOut ? ' after hitting the step timeout' : '';
      const signalText = result.signal ? ` (signal ${result.signal})` : '';
      console.error(
        `\nCommercial verification stopped at '${step.id}' after ${durationSeconds}s${timeoutText} with exit code ${result.code}${signalText}.`,
      );
      process.exitCode = result.code;
      break;
    }
  }

  console.log('\nCommercial verification summary:');
  for (const result of results) {
    const timeoutSuffix = result.timedOut ? ', timeout' : '';
    console.log(`${result.code === 0 ? 'ok' : 'fail'} ${result.id} (${result.durationSeconds}s${timeoutSuffix})`);
  }

  const plannedStepsPassed = results.length === steps.length && results.every((result) => result.code === 0);

  writeCommercialVerificationSummary({
    status: plannedStepsPassed ? 'passed' : 'failed',
    startedAt: startedAtIso,
    endedAt: new Date().toISOString(),
    steps,
    results,
    options,
  });

  if (!plannedStepsPassed) {
    return;
  }

  if (!(await runPostSummaryStep(POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_STEP))) {
    return;
  }

  writeCommercialVerificationSummary({
    status: 'passed',
    startedAt: startedAtIso,
    endedAt: new Date().toISOString(),
    steps,
    results,
    options,
  });

  for (const step of [
    POST_SUMMARY_ARTIFACT_REDACTION_STEP,
    POST_SUMMARY_REDACTION_ALIGNMENT_STEP,
    POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_STEP,
    POST_SUMMARY_LAUNCH_READINESS_FIXTURE_STEP,
    POST_SUMMARY_REDACTION_FIXTURE_STEP,
    ...(isDefaultCoreOnlyInvocation(options) ? [POST_SUMMARY_FULL_LOCAL_APPROVAL_PACKAGE_STEP] : []),
  ]) {
    if (!(await runPostSummaryStep(step))) {
      return;
    }
  }

  console.log('\nCommercial verification passed.');
}

installSignalForwarding();
await main();
