#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = process.argv.slice(2);

function readFlagValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const root = path.resolve(readFlagValue('--root', path.resolve(__dirname, '..')));

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
    stepId: 'typecheck',
  },
  diff_check: {
    command: 'git diff --check',
    option: null,
    boundary:
      'Included in the default commercial verifier for tracked diff whitespace hygiene; the worktree-hygiene step separately checks untracked path policy.',
    stepId: 'diff-hygiene',
  },
};

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function stableJson(value) {
  return JSON.stringify(value);
}

function addError(errors, type, detail = {}) {
  errors.push({ type, ...detail });
}

function requireExact(errors, context, expected, actual) {
  if (stableJson(expected) !== stableJson(actual)) {
    addError(errors, 'field_mismatch', { context, expected, actual });
  }
}

function collectCanonicalSourceTracePrimaryArtifactGaps(value, currentPath, gaps = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return gaps;

  if (Array.isArray(value.sourceTrace)) {
    value.sourceTrace.forEach((row, index) => {
      if (
        !row ||
        typeof row !== 'object' ||
        typeof row.sourceArtifact !== 'string' ||
        row.sourceArtifact.trim() === ''
      ) {
        gaps.push(`${currentPath}.sourceTrace.${index}.sourceArtifact`);
      }
    });
  }

  Object.entries(value).forEach(([key, child]) => {
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      collectCanonicalSourceTracePrimaryArtifactGaps(child, `${currentPath}.${key}`, gaps);
    }
  });

  return gaps;
}

function validateCanonicalSourceTracePrimaryArtifacts(errors, state) {
  const gaps = collectCanonicalSourceTracePrimaryArtifactGaps(state, 'state');
  if (gaps.length > 0) {
    addError(errors, 'canonical_source_trace_primary_source_artifact_missing', {
      gapCount: gaps.length,
      gaps,
    });
  }
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

function buildExpectedReleaseGateCoverage(summary) {
  const invocationOptions = summary.invocation?.options || {};
  return {
    ...Object.fromEntries(
      Object.entries(RELEASE_GATE_COVERAGE_EXPECTATIONS).map(([gateId, expectation]) => {
        const includedInThisInvocation = releaseGateIncludedForOption(expectation.option, invocationOptions);
        return [
          gateId,
          {
            command: expectation.command,
            includedInThisInvocation,
            passedInThisInvocation: includedInThisInvocation ? summary.status === 'passed' : null,
            ...(expectation.boundary ? { boundary: expectation.boundary } : {}),
          },
        ];
      }),
    ),
    boundary: RELEASE_GATE_COVERAGE_BOUNDARY,
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

function isDefaultCoreOnlyInvocation(options = {}) {
  return (
    options.includeNetwork !== true &&
    options.includeLiveSupabase !== true &&
    options.includeLiveOnet !== true &&
    options.includeLiveResumeParser !== true &&
    options.includeA11y !== true &&
    options.includeJourney !== true
  );
}

function buildFullLocalApprovalPackageSummary(summary) {
  const invocationOptions = summary.invocation?.options || {};
  const includedInThisInvocation =
    summary.status === 'passed' && isDefaultCoreOnlyInvocation(invocationOptions);
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
      { key: 'command', value: FULL_LOCAL_APPROVAL_PACKAGE_COMMAND },
      { key: 'executionOrder', value: FULL_LOCAL_APPROVAL_PACKAGE_EXECUTION_ORDER },
      { key: 'approvalRequiredBefore', value: approvalRequiredBefore },
      { key: 'optionalGateCommands', value: optionalGateCommands },
      { key: 'fixtureVerifier', value: fixtureVerifier.command, boundary: fixtureVerifier.boundary },
    ],
  );

  return {
    sourceArtifact: FULL_LOCAL_APPROVAL_PACKAGE_SOURCE_ARTIFACT,
    status: includedInThisInvocation ? 'approval_required_plan_only' : 'not_default_core_invocation',
    command: FULL_LOCAL_APPROVAL_PACKAGE_COMMAND,
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

function buildPostSummaryArtifactRedactionSummary(summary) {
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
  const sourceTrace = buildPostSummaryCommandSourceTrace(
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
    status: summary.status === 'passed' ? 'post_summary_scan_required' : 'not_included_until_summary_passes',
    command: POST_SUMMARY_ARTIFACT_REDACTION_COMMAND,
    executionOrder: POST_SUMMARY_ARTIFACT_REDACTION_EXECUTION_ORDER,
    includedInThisInvocation: summary.status === 'passed',
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

function buildPostSummaryLaunchReadinessAlignmentSummary(summary) {
  const fixtureVerifier = {
    command: EXPECTED_LAUNCH_READINESS_FIXTURE_COMMAND,
    executionOrder: EXPECTED_LAUNCH_READINESS_FIXTURE_EXECUTION_ORDER,
    boundary: EXPECTED_LAUNCH_READINESS_FIXTURE_BOUNDARY,
  };
  const sourceTrace = buildPostSummaryCommandSourceTrace(
    POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_SOURCE_ARTIFACT,
    [
      { key: 'command', value: EXPECTED_LAUNCH_READINESS_COMMAND },
      { key: 'executionOrder', value: EXPECTED_LAUNCH_READINESS_EXECUTION_ORDER },
      { key: 'fixtureVerifier', value: fixtureVerifier.command, boundary: fixtureVerifier.boundary },
    ],
  );

  return {
    sourceArtifact: POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_SOURCE_ARTIFACT,
    status:
      summary.status === 'passed'
        ? 'included_after_post_summary_redaction_alignment'
        : 'pending_final_summary_alignment',
    command: EXPECTED_LAUNCH_READINESS_COMMAND,
    executionOrder: EXPECTED_LAUNCH_READINESS_EXECUTION_ORDER,
    includedInThisInvocation: summary.status === 'passed',
    fixtureVerifier,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: POST_SUMMARY_COMMAND_SOURCE_TRACE_BOUNDARY,
    boundary: EXPECTED_LAUNCH_READINESS_BOUNDARY,
    doesNotProve: POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_DOES_NOT_PROVE,
    doesNotProveCount: POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_DOES_NOT_PROVE.length,
  };
}

function buildPostSummaryLaunchEvidenceRefreshSummary(summary) {
  const resultArtifacts = {
    json: LAUNCH_EVIDENCE_JSON,
    markdown: LAUNCH_EVIDENCE_MD,
  };
  const finalSummaryRewrite = {
    required: true,
    purpose: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_FINAL_REWRITE_PURPOSE,
  };
  const sourceTrace = buildPostSummaryCommandSourceTrace(
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
    status:
      summary.status === 'passed'
        ? 'included_after_initial_passed_summary'
        : 'pending_initial_passed_summary',
    command: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_COMMAND,
    executionOrder: POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_EXECUTION_ORDER,
    includedInThisInvocation: summary.status === 'passed',
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

function markdownBool(value) {
  if (value === null || value === undefined) {
    return '`not included`';
  }

  return value ? '`yes`' : '`no`';
}

function requiredReleaseGateStepIds(summary) {
  const coverage = summary.releaseGateCoverage || {};
  return Object.entries(RELEASE_GATE_COVERAGE_EXPECTATIONS)
    .filter(([, expectation]) => expectation.stepId)
    .map(([, expectation]) => expectation.stepId)
    .filter((stepId) => {
      const gateId = Object.entries(RELEASE_GATE_COVERAGE_EXPECTATIONS).find(
        ([, expectation]) => expectation.stepId === stepId,
      )?.[0];
      return coverage[gateId]?.includedInThisInvocation === true;
    });
}

function validateReleaseGateCoverage(errors, summary) {
  const expectedReleaseGateCoverage = buildExpectedReleaseGateCoverage(summary);
  requireExact(
    errors,
    'summary.releaseGateCoverage',
    expectedReleaseGateCoverage,
    summary.releaseGateCoverage || {},
  );

  const stepRows = Array.isArray(summary.steps) ? summary.steps : [];
  const stepsById = new Map(stepRows.map((step) => [step.id, step]));
  requiredReleaseGateStepIds(summary).forEach((stepId) => {
    const step = stepsById.get(stepId);
    if (!step) {
      addError(errors, 'release_gate_missing_step', { stepId });
      return;
    }
    if (step.status !== 'passed') {
      addError(errors, 'release_gate_step_not_passed', {
        stepId,
        status: step.status,
      });
    }
  });
}

function validateRootSummaryCounts(errors, summary) {
  const stepRows = Array.isArray(summary.steps) ? summary.steps : [];
  const failedStepIds = stepRows
    .filter((step) => ['failed', 'timed_out'].includes(step.status))
    .map((step) => step.id);
  const doesNotProve = Array.isArray(summary.doesNotProve) ? summary.doesNotProve : [];

  requireExact(errors, 'summary.stepCount', stepRows.length, summary.stepCount);
  requireExact(errors, 'summary.failedSteps', failedStepIds, summary.failedSteps || []);
  requireExact(errors, 'summary.failedStepCount', failedStepIds.length, summary.failedStepCount);
  requireExact(
    errors,
    'summary.doesNotProveCount',
    doesNotProve.length,
    summary.doesNotProveCount,
  );
}

function validateOwnerCloseoutStatusCounts(errors, closeoutStatus) {
  const remainingGateIds = Array.isArray(closeoutStatus.remainingGateIds)
    ? closeoutStatus.remainingGateIds
    : [];
  const acceptedLiveGateIds = Array.isArray(closeoutStatus.acceptedLiveGateIds)
    ? closeoutStatus.acceptedLiveGateIds
    : [];
  const ownerActionQueue = Array.isArray(closeoutStatus.ownerActionQueue)
    ? closeoutStatus.ownerActionQueue
    : [];
  const ownerGateCloseoutSummary = Array.isArray(closeoutStatus.ownerGateCloseoutSummary)
    ? closeoutStatus.ownerGateCloseoutSummary
    : [];
  const steps = Array.isArray(closeoutStatus.steps) ? closeoutStatus.steps : [];
  const failedStepIds = steps
    .filter((step) => step.status !== 'pass')
    .map((step) => step.id);
  const wrote = Array.isArray(closeoutStatus.wrote) ? closeoutStatus.wrote : [];

  requireExact(errors, 'closeout.remainingGateCount', remainingGateIds.length, closeoutStatus.remainingGateCount);
  requireExact(
    errors,
    'closeout.acceptedLiveGateCount',
    acceptedLiveGateIds.length,
    closeoutStatus.acceptedLiveGateCount,
  );
  requireExact(
    errors,
    'closeout.ownerActionQueueCount',
    ownerActionQueue.length,
    closeoutStatus.ownerActionQueueCount,
  );
  requireExact(
    errors,
    'closeout.ownerGateCloseoutSummaryCount',
    ownerGateCloseoutSummary.length,
    closeoutStatus.ownerGateCloseoutSummaryCount,
  );
  requireExact(errors, 'closeout.stepCount', steps.length, closeoutStatus.stepCount);
  requireExact(errors, 'closeout.failedStepIds', failedStepIds, closeoutStatus.failedStepIds || []);
  requireExact(errors, 'closeout.failedStepCount', failedStepIds.length, closeoutStatus.failedStepCount);
  if (Object.hasOwn(closeoutStatus, 'wrote') || Object.hasOwn(closeoutStatus, 'wroteCount')) {
    requireExact(errors, 'closeout.wroteCount', wrote.length, closeoutStatus.wroteCount);
  }
}

function validatePostSummaryLaunchReadinessMetadata(errors, summary) {
  const postSummary = summary.postSummaryLaunchReadinessAlignment;
  if (!postSummary || typeof postSummary !== 'object') {
    addError(errors, 'missing_post_summary_launch_readiness_alignment');
    return;
  }

  requireExact(
    errors,
    'summary.postSummaryLaunchReadinessAlignment.command',
    EXPECTED_LAUNCH_READINESS_COMMAND,
    postSummary.command,
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchReadinessAlignment.executionOrder',
    EXPECTED_LAUNCH_READINESS_EXECUTION_ORDER,
    postSummary.executionOrder,
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchReadinessAlignment.includedInThisInvocation',
    summary.status === 'passed',
    postSummary.includedInThisInvocation,
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchReadinessAlignment.sourceArtifact',
    POST_SUMMARY_LAUNCH_READINESS_ALIGNMENT_SOURCE_ARTIFACT,
    postSummary.sourceArtifact,
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchReadinessAlignment.status',
    summary.status === 'passed'
      ? 'included_after_post_summary_redaction_alignment'
      : 'pending_final_summary_alignment',
    postSummary.status,
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchReadinessAlignment.fixtureVerifier.command',
    EXPECTED_LAUNCH_READINESS_FIXTURE_COMMAND,
    postSummary.fixtureVerifier?.command,
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchReadinessAlignment.fixtureVerifier.executionOrder',
    EXPECTED_LAUNCH_READINESS_FIXTURE_EXECUTION_ORDER,
    postSummary.fixtureVerifier?.executionOrder,
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchReadinessAlignment.boundary',
    EXPECTED_LAUNCH_READINESS_BOUNDARY,
    postSummary.boundary,
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchReadinessAlignment.fixtureVerifier.boundary',
    EXPECTED_LAUNCH_READINESS_FIXTURE_BOUNDARY,
    postSummary.fixtureVerifier?.boundary,
  );
  const expectedSummary = buildPostSummaryLaunchReadinessAlignmentSummary(summary);
  requireExact(
    errors,
    'summary.postSummaryLaunchReadinessAlignment.sourceTraceCount',
    expectedSummary.sourceTraceCount,
    postSummary.sourceTraceCount,
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchReadinessAlignment.sourceTrace',
    expectedSummary.sourceTrace,
    postSummary.sourceTrace || [],
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchReadinessAlignment.sourceTraceBoundary',
    expectedSummary.sourceTraceBoundary,
    postSummary.sourceTraceBoundary,
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchReadinessAlignment.doesNotProve',
    expectedSummary.doesNotProve,
    postSummary.doesNotProve || [],
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchReadinessAlignment.doesNotProveCount',
    expectedSummary.doesNotProveCount,
    postSummary.doesNotProveCount,
  );
}

function validatePostSummaryLaunchEvidenceRefreshMetadata(errors, summary) {
  const postSummary = summary.postSummaryLaunchEvidenceRefresh;
  if (!postSummary || typeof postSummary !== 'object') {
    addError(errors, 'missing_post_summary_launch_evidence_refresh');
    return;
  }

  requireExact(
    errors,
    'summary.postSummaryLaunchEvidenceRefresh.command',
    POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_COMMAND,
    postSummary.command,
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchEvidenceRefresh.executionOrder',
    POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_EXECUTION_ORDER,
    postSummary.executionOrder,
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchEvidenceRefresh.includedInThisInvocation',
    summary.status === 'passed',
    postSummary.includedInThisInvocation,
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchEvidenceRefresh.resultArtifacts',
    {
      json: LAUNCH_EVIDENCE_JSON,
      markdown: LAUNCH_EVIDENCE_MD,
    },
    postSummary.resultArtifacts || {},
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchEvidenceRefresh.boundary',
    POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_TOP_LEVEL_BOUNDARY,
    postSummary.boundary,
  );
  const expectedSummary = buildPostSummaryLaunchEvidenceRefreshSummary(summary);
  requireExact(
    errors,
    'summary.postSummaryLaunchEvidenceRefresh.doesNotProve',
    expectedSummary.doesNotProve,
    postSummary.doesNotProve || [],
  );
  requireExact(
    errors,
    'summary.postSummaryLaunchEvidenceRefresh.doesNotProveCount',
    expectedSummary.doesNotProveCount,
    postSummary.doesNotProveCount,
  );
}

function completionGateIds(completionAudit) {
  return (completionAudit.remainingExternalGates || []).map((gate) => gate.id);
}

function expectedLaunchDecision(closeoutStatus, completionAudit) {
  return closeoutStatus.goalComplete === true &&
    completionAudit.goalComplete === true &&
    (closeoutStatus.remainingGateIds || []).length === 0 &&
    completionGateIds(completionAudit).length === 0
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
        sourceAudit,
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

function buildLaunchEvidenceSummary(launchEvidence) {
  const outreachPlan = launchEvidence.outreach_plan || {};
  const crmExport = outreachPlan.crm_export || {};
  const fixReport = launchEvidence.fix_report || {};
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
    scores: launchEvidence.scores || {},
    deliverableCounts: {
      gapCount: (launchEvidence.gaps || []).length,
      painPointCount: (launchEvidence.pain_points || []).length,
      targetCustomerCount: (launchEvidence.target_customers || []).length,
      competitorSubstituteCount: (launchEvidence.competitor_substitutes || []).length,
      implementationDecisionCount: (launchEvidence.implementation_decisions || []).length,
      rejectedVariantCount: (launchEvidence.rejected_variants || []).length,
      codeOptimizationReviewCount: (launchEvidence.code_optimization_reviews || []).length,
      progressUpdateCount: (launchEvidence.progress_updates || []).length,
      bottleneckLogCount: (launchEvidence.bottleneck_log || []).length,
    },
    requiredOutputTableCounts: launchEvidence.required_output_table_counts || {},
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

function buildProofBucketSummary(launchEvidence) {
  const proofBuckets = launchEvidence.proof_buckets || {};
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

function buildOwnerPrepActionNeededByGate(closeoutStatus, gateIds) {
  const ownerActionNeededByGate = closeoutStatus.ownerEvidencePrep?.ownerActionNeededByGate || {};
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

function buildOwnerPrepActionNeededByGateCoverage(
  ownerPrepActionNeededByGate,
  uniqueOwnerPrepActionNeededCount,
) {
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

function buildOperationalAccessPrerequisiteSummary(ownerHandoff, completionDrill) {
  const handoffPrerequisites = (ownerHandoff.operationalAccessPrerequisites || []).map(
    normalizeOperationalAccessPrerequisite,
  );
  const completionDrillPrerequisites = (completionDrill.operationalAccessPrerequisites || []).map(
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

function buildOwnerLocalSafetyStatusSummary(localSafety, ownerHandoff, completionDrill) {
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
      stableJson(ownerHandoff?.localSafetyStatus || null) === stableJson(localSafetyStatus),
    completionDrillStatusMatchesLocalSafety:
      stableJson(completionDrill?.localSafetyStatus || null) === stableJson(localSafetyStatus),
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: OWNER_LOCAL_SAFETY_SUMMARY_SOURCE_TRACE_BOUNDARY,
    boundary: OWNER_LOCAL_SAFETY_SUMMARY_BOUNDARY,
  };
}

function buildOwnerGateScoreboardSourceTrace(
  gateIds,
  closeoutStatus,
  completionAudit,
  remediationGates,
  ownerHandoff,
  completionDrill,
) {
  const closeoutQueueById = new Map((closeoutStatus.ownerActionQueue || []).map((row) => [row.id, row]));
  const remediationCompletionById = new Map(
    (completionAudit.remainingExternalGates || []).map((row) => [row.id, row]),
  );
  const remediationQueueById = new Map(
    (remediationGates.ownerActionQueue || []).map((row) => [row.id, row]),
  );
  const handoffRowsByGateId = new Map(
    (ownerHandoff.ownerActionRows || []).map((row) => [row.gateId, row]),
  );
  const completionRowsByGateId = new Map(
    (completionDrill.completionRows || []).map((row) => [row.gateId, row]),
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
    (completionAudit.remainingExternalGates || []).map((row) => [row.id, row]),
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
    (remediationGates.ownerActionQueue || []).map((row) => [row.id, row]),
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

function buildLaunchEvidenceBlockerSourceTrace(
  gateIds,
  launchEvidence,
  completionAudit,
  remediationGates,
) {
  const gapById = new Map(
    (launchEvidence.gaps || []).map((row) => [row.gate_id || row.id, row]),
  );
  const unresolvedBlockerIds = new Set(launchEvidence.fix_report?.unresolved_blockers || []);
  const completionById = new Map(
    (completionAudit.remainingExternalGates || []).map((row) => [row.id, row]),
  );
  const remediationById = new Map(
    (remediationGates.ownerActionQueue || []).map((row) => [row.id, row]),
  );

  return gateIds.map((gateId) => {
    const gap = gapById.get(gateId) || {};
    const completionRow = completionById.get(gateId) || {};
    const remediationRow = remediationById.get(gateId) || {};
    const sourceArtifacts = {
      launchGap: gapById.has(gateId) ? `${LAUNCH_EVIDENCE_GAPS_SOURCE_ARTIFACT}.${gateId}` : '',
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

function buildOwnerEvidenceExecutionSummary(closeoutStatus, ownerHandoff, completionDrill, localSafety) {
  const closeoutScoreboard = closeoutStatus.ownerGateScoreboard || {};
  const failedStepIds = closeoutStatus.failedStepIds || closeoutScoreboard.failedStepIds || [];
  const failedStepSourceTrace = closeoutFailedStepSourceTrace(closeoutStatus, failedStepIds);
  const nextCommandSourceTrace = closeoutNextCommandSourceTrace(closeoutStatus.nextCommands || {});
  const statusArtifactSourceTrace = closeoutStatusArtifactSourceTrace(
    closeoutStatus.statusArtifacts || {},
  );
  const closeoutCoverageSourceTrace = ownerCloseoutCoverageSourceTrace(
    failedStepSourceTrace,
    nextCommandSourceTrace,
    statusArtifactSourceTrace,
  );
  const remainingGateIds = closeoutStatus.remainingGateIds || closeoutScoreboard.remainingGateIds || [];
  const handoffRemainingGateIds = ownerHandoff.remainingGateIds || [];
  const completionRequiredGateIds = completionDrill.requiredGateIds || [];
  const handoffCommandSequence = ownerHandoff.commandSequence || [];
  const completionCommandOrder = completionDrill.recommendedCommandOrder || [];
  const handoffCommandSequenceSourceTrace = commandSequenceSourceTrace(
    handoffCommandSequence,
    OWNER_HANDOFF_COMMAND_SEQUENCE_SOURCE_ARTIFACT,
  );
  const completionCommandOrderSourceTrace = commandSequenceSourceTrace(
    completionCommandOrder,
    OWNER_COMPLETION_DRILL_COMMAND_ORDER_SOURCE_ARTIFACT,
  );
  const ownerActionRows = ownerHandoff.ownerActionRows || [];
  const completionRows = completionDrill.completionRows || [];
  const packetSummaries = completionDrill.packetSummaries || [];
  const packetOfficialReferenceUrls = [
    ...new Set(packetSummaries.flatMap((packet) => packet.officialReferenceUrls || [])),
  ].sort((a, b) => a.localeCompare(b));
  const packetOfficialReferenceCounts = Object.fromEntries(
    packetSummaries.map((packet) => [packet.packetType, packet.officialReferenceCount ?? 0]),
  );
  const ownerPrepActionNeededByGate = buildOwnerPrepActionNeededByGate(closeoutStatus, remainingGateIds);
  const ownerPrepActionNeededByGateCoverage = buildOwnerPrepActionNeededByGateCoverage(
    ownerPrepActionNeededByGate,
    closeoutStatus.ownerEvidencePrep?.ownerActionNeededCount ?? null,
  );

  return {
    status: closeoutScoreboard.status || completionDrill.status || null,
    goalComplete:
      closeoutStatus.goalComplete === true &&
      ownerHandoff.goalComplete === true &&
      completionDrill.goalComplete === true,
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
      ownerHandoff,
      completionDrill,
    ),
    localSafetyStatusSummary:
      buildOwnerLocalSafetyStatusSummary(localSafety, ownerHandoff, completionDrill),
    closeoutCoverage: {
      ownerActionQueueCount: closeoutStatus.ownerActionQueueCount ?? null,
      ownerActionNeededCount: closeoutStatus.ownerActionNeededCount ?? null,
      ownerPrepActionNeededCount: closeoutStatus.ownerEvidencePrep?.ownerActionNeededCount ?? null,
      failedStepCount: failedStepIds.length,
      failedStepIds,
      failedStepSourceArtifact: OWNER_CLOSEOUT_FAILED_STEPS_SOURCE_ARTIFACT,
      failedStepSourceTraceCount: failedStepSourceTrace.length,
      failedStepSourceTraceCommandCount: failedStepSourceTrace.filter((step) => step.command).length,
      failedStepSourceTrace,
      failedStepSourceTraceBoundary: OWNER_CLOSEOUT_FAILED_STEP_SOURCE_TRACE_BOUNDARY,
      nextCommandCount: Object.keys(closeoutStatus.nextCommands || {}).length,
      nextCommandValueCount: nextCommandSourceTrace.reduce(
        (sum, row) => sum + (row.commands || []).length,
        0,
      ),
      nextCommandSourceArtifact: OWNER_CLOSEOUT_NEXT_COMMANDS_SOURCE_ARTIFACT,
      nextCommandSourceTraceCount: nextCommandSourceTrace.length,
      nextCommandSourceTrace,
      statusArtifactCount: Object.keys(closeoutStatus.statusArtifacts || {}).length,
      statusArtifacts: closeoutStatus.statusArtifacts || {},
      statusArtifactSourceArtifact: OWNER_CLOSEOUT_STATUS_ARTIFACTS_SOURCE_ARTIFACT,
      statusArtifactSourceTraceCount: statusArtifactSourceTrace.length,
      statusArtifactSourceTrace,
      sourceTraceCount: closeoutCoverageSourceTrace.length,
      sourceTrace: closeoutCoverageSourceTrace,
      nextCommandSourceTraceBoundary: OWNER_CLOSEOUT_NEXT_COMMAND_SOURCE_TRACE_BOUNDARY,
    },
    handoffCoverage: {
      ownerActionQueueCount: ownerHandoff.ownerActionQueueCount ?? null,
      ownerActionRowCount: ownerActionRows.length,
      ownerActionGateIds: ownerActionRows.map((row) => row.gateId),
      commandSequenceCount: handoffCommandSequence.length,
      commandSequence: handoffCommandSequence,
      commandSequenceSourceArtifact: OWNER_HANDOFF_COMMAND_SEQUENCE_SOURCE_ARTIFACT,
      commandSequenceSourceTraceCount: handoffCommandSequenceSourceTrace.length,
      commandSequenceSourceTrace: handoffCommandSequenceSourceTrace,
      sourceTraceCount: handoffCommandSequenceSourceTrace.length,
      sourceTrace: handoffCommandSequenceSourceTrace,
      outputs: ownerHandoff.outputs || {},
    },
    completionDrillCoverage: {
      status: completionDrill.status || null,
      requiredGateCount: completionDrill.requiredGateCount ?? completionRequiredGateIds.length,
      blockedGateCount: completionDrill.blockedGateCount ?? null,
      ownerActionQueueCount: completionDrill.ownerActionQueueCount ?? null,
      ownerActionNeededCount: completionDrill.ownerActionNeededCount ?? null,
      packetCount: completionDrill.packetCount ?? packetSummaries.length,
      packetTypes: packetSummaries.map((packet) => packet.packetType),
      officialReferenceCount: completionDrill.officialReferenceCount ?? packetOfficialReferenceUrls.length,
      officialReferenceUrls: completionDrill.officialReferenceUrls || packetOfficialReferenceUrls,
      packetOfficialReferenceCounts,
      matrixRowCount: completionDrill.matrixRowCount ?? completionRows.length,
      completionRowGateIds: completionRows.map((row) => row.gateId),
      recommendedCommandCount: completionCommandOrder.length,
      recommendedCommandOrder: completionCommandOrder,
      recommendedCommandOrderSourceArtifact: OWNER_COMPLETION_DRILL_COMMAND_ORDER_SOURCE_ARTIFACT,
      recommendedCommandOrderSourceTraceCount: completionCommandOrderSourceTrace.length,
      recommendedCommandOrderSourceTrace: completionCommandOrderSourceTrace,
      sourceTraceCount: completionCommandOrderSourceTrace.length,
      sourceTrace: completionCommandOrderSourceTrace,
      outputArtifacts: completionDrill.outputArtifacts || {},
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

function closeoutFailedStepSourceTrace(closeoutStatus, failedStepIds) {
  const stepsById = new Map((closeoutStatus.steps || []).map((step) => [step.id, step]));
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

function buildOwnerActionQueueSummary(remediationGates, ownerHandoff, closeoutStatus, completionDrill) {
  const ownerActionQueue = remediationGates.ownerActionQueue || [];
  const closeoutOwnerActionQueue = closeoutStatus.ownerActionQueue || [];
  const ownerActionRows = ownerHandoff.ownerActionRows || [];
  const completionRows = completionDrill.completionRows || [];
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
    status: remediationGates.goalComplete === true ? 'owner_action_queue_complete' : 'owner_action_required',
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
  const sources = sourceAudit.sources || [];
  const sourceTrace = sourceAuditSourceTrace(sources, LAUNCH_SOURCE_AUDIT_SOURCE_ARTIFACT);
  return {
    artifact: LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON,
    generatedAt: sourceAudit.generatedAt || null,
    networkFetch: sourceAudit.networkFetch ?? null,
    allPassed: sourceAudit.allPassed ?? null,
    sourceCount: sourceAudit.sourceCount ?? sources.length,
    passedCount: sourceAudit.passedCount ?? sources.filter((source) => source.status === 'passed').length,
    failedCount: sourceAudit.failedCount ?? sources.filter((source) => source.status !== 'passed').length,
    missingExpectationCount: sourceAudit.missingExpectationCount ?? null,
    failedSourceUrls: sourceAudit.failedSourceUrls || [],
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
      sourceAudit.sourceBoundary ||
      'Source URL audit proves source-page reachability and expected page text only. It does not prove buyer willingness to pay, customer outcomes, legal compliance, WCAG conformance, live revenue, partner commitments, or production runtime behavior.',
  };
}

function buildCommercialEvidenceIntakeSourceAuditCoverage(sourceAudit) {
  const sources = sourceAudit.sources || [];
  const sourceTrace = sourceAuditSourceTrace(
    sources,
    COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_SOURCE_ARTIFACT,
  );
  return {
    artifact: COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON,
    packetPath: sourceAudit.packetPath || null,
    generatedAt: sourceAudit.generatedAt || null,
    networkFetch: sourceAudit.networkFetch ?? null,
    allPassed: sourceAudit.allPassed ?? null,
    sourceCount: sourceAudit.sourceCount ?? sources.length,
    passedCount: sourceAudit.passedCount ?? sources.filter((source) => source.status === 'passed').length,
    failedCount: sourceAudit.failedCount ?? sources.filter((source) => source.status !== 'passed').length,
    missingExpectationCount: sourceAudit.missingExpectationCount ?? null,
    unexpectedReferenceCount: sourceAudit.unexpectedReferenceCount ?? null,
    failedSourceIds: sourceAudit.failedSourceIds || [],
    unexpectedReferences: sourceAudit.unexpectedReferences || [],
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
      sourceAudit.sourceBoundary ||
      'Commercial evidence intake source audit proves only official reference URL presence and expected page text at verification time. It does not prove partner commitments, documented outcomes, testimonial compliance, legal compliance, revenue, retention, causality, market-wide demand, or permission to cite.',
  };
}

function buildLiveProofRunPacketSourceAuditCoverage(sourceAudit) {
  const sources = sourceAudit.sources || [];
  const sourceTrace = sourceAuditSourceTrace(sources, LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_SOURCE_ARTIFACT);
  return {
    artifact: LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON,
    packetPath: sourceAudit.packetPath || null,
    generatedAt: sourceAudit.generatedAt || null,
    networkFetch: sourceAudit.networkFetch ?? null,
    allPassed: sourceAudit.allPassed ?? null,
    sourceCount: sourceAudit.sourceCount ?? sources.length,
    passedCount: sourceAudit.passedCount ?? sources.filter((source) => source.status === 'passed').length,
    failedCount: sourceAudit.failedCount ?? sources.filter((source) => source.status !== 'passed').length,
    missingExpectationCount: sourceAudit.missingExpectationCount ?? null,
    unexpectedReferenceCount: sourceAudit.unexpectedReferenceCount ?? null,
    failedSourceIds: sourceAudit.failedSourceIds || [],
    unexpectedReferences: sourceAudit.unexpectedReferences || [],
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
      sourceAudit.sourceBoundary ||
      'Live proof run packet source audit proves only that the owner live-proof worksheet official Stripe, Supabase, and GitHub reference URLs were present and matched expected page text at verification time. It does not prove live checkout, live MRR, production calibration, authenticated live artifact persistence, credential validity, owner-held evidence completeness, production deployment, or commercial readiness.',
  };
}

function buildLiveCloseoutAccessSourceAuditCoverage(sourceAudit) {
  const sources = sourceAudit.sources || [];
  const sourceTrace = sourceAuditSourceTrace(sources, LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_SOURCE_ARTIFACT);
  return {
    artifact: LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON,
    readinessPath: sourceAudit.readinessPath || null,
    generatedAt: sourceAudit.generatedAt || null,
    networkFetch: sourceAudit.networkFetch ?? null,
    allPassed: sourceAudit.allPassed ?? null,
    sourceCount: sourceAudit.sourceCount ?? sources.length,
    passedCount: sourceAudit.passedCount ?? sources.filter((source) => source.status === 'passed').length,
    failedCount: sourceAudit.failedCount ?? sources.filter((source) => source.status !== 'passed').length,
    missingExpectationCount: sourceAudit.missingExpectationCount ?? null,
    unexpectedReferenceCount: sourceAudit.unexpectedReferenceCount ?? null,
    failedSourceIds: sourceAudit.failedSourceIds || [],
    unexpectedReferences: sourceAudit.unexpectedReferences || [],
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
      sourceAudit.sourceBoundary ||
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
  const checks = readiness.checks || [];
  const githubSecrets = readiness.githubSecrets || {};
  const supabaseAccess = readiness.supabaseAccess || {};
  const checkSourceTrace = liveCloseoutReadinessCheckSourceTrace(checks);
  const failedCheckSourceTrace = checkSourceTrace.filter((check) => check.passed !== true);
  const nextActionSourceTrace = liveCloseoutReadinessNextActionSourceTrace(readiness.nextActions || []);
  const officialReferenceSourceTrace = liveCloseoutReadinessOfficialReferenceSourceTrace(
    readiness.officialReferences || [],
  );
  const sourceTrace = liveCloseoutReadinessSourceTrace(
    checkSourceTrace,
    nextActionSourceTrace,
    officialReferenceSourceTrace,
  );
  return {
    artifact: LIVE_CLOSEOUT_READINESS_JSON,
    generatedAt: readiness.generatedAt || null,
    status: readiness.status || null,
    ok: readiness.ok ?? null,
    allowIncomplete: readiness.allowIncomplete ?? null,
    targetProjectRef: readiness.targetProjectRef || null,
    command: readiness.commandContext?.command || null,
    mutatesExternalState: readiness.commandContext?.mutatesExternalState ?? null,
    printsSecretValues: readiness.commandContext?.printsSecretValues ?? null,
    checkCount: readiness.checkCount ?? checks.length,
    passedCheckCount: readiness.passedCheckCount ?? checks.filter((check) => check.passed === true).length,
    failedCheckCount: readiness.failedCheckCount ?? checks.filter((check) => check.passed !== true).length,
    failedCheckIds: readiness.failedCheckIds || checks.filter((check) => check.passed !== true).map((check) => check.id),
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
    officialReferenceCount: readiness.officialReferenceCount ?? (readiness.officialReferences || []).length,
    officialReferenceSourceArtifact: LIVE_CLOSEOUT_READINESS_OFFICIAL_REFERENCES_SOURCE_ARTIFACT,
    officialReferenceSourceTraceCount: officialReferenceSourceTrace.length,
    officialReferenceSourceTrace,
    nextActionCount: readiness.nextActionCount ?? (readiness.nextActions || []).length,
    nextActions: readiness.nextActions || [],
    nextActionSourceArtifact: LIVE_CLOSEOUT_READINESS_NEXT_ACTIONS_SOURCE_ARTIFACT,
    nextActionSourceTraceCount: nextActionSourceTrace.length,
    nextActionSourceTrace,
    sourceTraceBoundary: LIVE_CLOSEOUT_READINESS_SOURCE_TRACE_BOUNDARY,
    boundary:
      readiness.evidenceBoundary ||
      'Live closeout readiness coverage mirrors the local CLI access verifier only. It records redacted status and does not deploy, mutate, ingest, rotate, prove production behavior, or upgrade launch readiness.',
    doesNotProve: readiness.doesNotProve || [],
    doesNotProveCount: readiness.doesNotProveCount ?? (readiness.doesNotProve || []).length,
  };
}

function buildManualWcagReviewPacketSourceAuditCoverage(sourceAudit) {
  const sources = sourceAudit.sources || [];
  const sourceTrace = sourceAuditSourceTrace(
    sources,
    MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_SOURCE_ARTIFACT,
  );
  return {
    artifact: MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_JSON,
    packetPath: sourceAudit.packetPath || null,
    generatedAt: sourceAudit.generatedAt || null,
    networkFetch: sourceAudit.networkFetch ?? null,
    allPassed: sourceAudit.allPassed ?? null,
    sourceCount: sourceAudit.sourceCount ?? sources.length,
    passedCount: sourceAudit.passedCount ?? sources.filter((source) => source.status === 'passed').length,
    failedCount: sourceAudit.failedCount ?? sources.filter((source) => source.status !== 'passed').length,
    missingExpectationCount: sourceAudit.missingExpectationCount ?? null,
    unexpectedReferenceCount: sourceAudit.unexpectedReferenceCount ?? null,
    failedSourceIds: sourceAudit.failedSourceIds || [],
    unexpectedReferences: sourceAudit.unexpectedReferences || [],
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
      sourceAudit.sourceBoundary ||
      'Manual WCAG review packet source audit proves only W3C/WAI official reference URL presence and expected page text at verification time. It does not prove manual review completion, WCAG conformance, legal compliance, procurement approval, assistive-technology coverage, or commercial readiness.',
  };
}

function buildOwnerEvidenceCompletionDrillSourceAuditCoverage(sourceAudit) {
  const sources = sourceAudit.sources || [];
  const sourceTrace = sourceAuditSourceTrace(
    sources,
    OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_SOURCE_ARTIFACT,
  );
  return {
    artifact: OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON,
    drillPath: sourceAudit.drillPath || null,
    generatedAt: sourceAudit.generatedAt || null,
    networkFetch: sourceAudit.networkFetch ?? null,
    allPassed: sourceAudit.allPassed ?? null,
    sourceCount: sourceAudit.sourceCount ?? sources.length,
    passedCount: sourceAudit.passedCount ?? sources.filter((source) => source.status === 'passed').length,
    failedCount: sourceAudit.failedCount ?? sources.filter((source) => source.status !== 'passed').length,
    missingExpectationCount: sourceAudit.missingExpectationCount ?? null,
    unexpectedReferenceCount: sourceAudit.unexpectedReferenceCount ?? null,
    topLevelUrlMismatch: sourceAudit.topLevelUrlMismatch ?? null,
    failedSourceKeys: sourceAudit.failedSourceKeys || [],
    unexpectedReferences: sourceAudit.unexpectedReferences || [],
    packetTypes: sourceAudit.packetTypes || [...new Set(sources.map((source) => source.packetType))],
    packetReferenceCounts: sourceAudit.packetReferenceCounts || {},
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
      sourceAudit.sourceBoundary ||
      'Owner-evidence completion-drill source audit proves only official reference URL presence and expected page text at verification time. It does not prove owner-held evidence, live checkout, live MRR, partner commitments, documented outcomes, manual WCAG conformance, legal compliance, production state, or commercial readiness.',
  };
}

function collectManifestSourceUrls(launchEvidence) {
  return [
    ...(launchEvidence.pain_points || []).flatMap((item) => item.source_evidence || []),
    ...(launchEvidence.competitor_substitutes || []).flatMap((item) => item.source_evidence || []),
    ...(launchEvidence.outreach_plan?.crm_export?.rows || [])
      .map((row) => row.website)
      .filter((value) => /^https?:\/\//.test(value || '')),
  ]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b));
}

function collectManualWcagReviewPacketReferenceUrls(packet) {
  return [
    ...new Set((packet.officialReferences || []).map((reference) => reference.url).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));
}

function collectLiveProofRunPacketReferenceUrls(packet) {
  return [
    ...new Set((packet.officialReferences || []).map((reference) => reference.url).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));
}

function collectLiveCloseoutReferenceUrls(closeoutStatus) {
  return [
    ...new Set((closeoutStatus.officialReferences || []).map((reference) => reference.url).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));
}

function validateState(
  errors,
  summary,
  launchEvidence,
  sourceAudit,
  commercialEvidenceIntakeSourceAudit,
  liveProofRunPacket,
  liveProofRunPacketSourceAudit,
  liveCloseoutAccessSourceAudit,
  liveCloseoutReadiness,
  manualWcagReviewPacket,
  manualWcagReviewPacketSourceAudit,
  ownerEvidenceCompletionDrillSourceAudit,
  closeoutStatus,
  ownerHandoff,
  completionDrill,
  localSafety,
  completionAudit,
  remediationGates,
) {
  const state = summary.commercialReadinessState;
  if (!state || typeof state !== 'object') {
    addError(errors, 'missing_commercial_readiness_state');
    return;
  }
  validateCanonicalSourceTracePrimaryArtifacts(errors, state);

  const expectedGateIds = completionGateIds(completionAudit);
  const closeoutGateIds = closeoutStatus.remainingGateIds || [];
  const closeoutScoreboard = closeoutStatus.ownerGateScoreboard || {};
  const launchGapGateIds = (launchEvidence.gaps || []).map((gap) => gap.gate_id || gap.id);
  const launchUnresolvedBlockers = launchEvidence.fix_report?.unresolved_blockers || [];
  const launchProgressUpdates = launchEvidence.progress_updates || [];
  const launchBottleneckLog = launchEvidence.bottleneck_log || [];
  const launchImplementationDecisions = launchEvidence.implementation_decisions || [];
  const launchRejectedVariants = launchEvidence.rejected_variants || [];
  const launchCodeOptimizationReviews = launchEvidence.code_optimization_reviews || [];
  const expectedReleaseGateCoverage = buildExpectedReleaseGateCoverage(summary);
  const expectedReleaseGateCoverageSummary =
    buildReleaseGateCoverageSummary(expectedReleaseGateCoverage);
  const expectedLaunchEvidenceSummary = buildLaunchEvidenceSummary(launchEvidence);
  const expectedProofBucketSummary = buildProofBucketSummary(launchEvidence);
  const expectedLaunchSourceAuditCoverage = buildLaunchSourceAuditCoverage(sourceAudit);
  const expectedCommercialEvidenceIntakeSourceAuditCoverage =
    buildCommercialEvidenceIntakeSourceAuditCoverage(commercialEvidenceIntakeSourceAudit);
  const expectedLiveProofRunPacketSourceAuditCoverage =
    buildLiveProofRunPacketSourceAuditCoverage(liveProofRunPacketSourceAudit);
  const expectedLiveCloseoutAccessSourceAuditCoverage =
    buildLiveCloseoutAccessSourceAuditCoverage(liveCloseoutAccessSourceAudit);
  const expectedLiveCloseoutReadinessCoverage =
    buildLiveCloseoutReadinessCoverage(liveCloseoutReadiness);
  const expectedPostSummaryArtifactRedactionSummary =
    buildPostSummaryArtifactRedactionSummary(summary);
  const expectedPostSummaryLaunchReadinessAlignmentSummary =
    buildPostSummaryLaunchReadinessAlignmentSummary(summary);
  const expectedPostSummaryLaunchEvidenceRefreshSummary =
    buildPostSummaryLaunchEvidenceRefreshSummary(summary);
  const expectedFullLocalApprovalPackageSummary =
    buildFullLocalApprovalPackageSummary(summary);
  const expectedManualWcagReviewPacketSourceAuditCoverage =
    buildManualWcagReviewPacketSourceAuditCoverage(manualWcagReviewPacketSourceAudit);
  const expectedOwnerEvidenceCompletionDrillSourceAuditCoverage =
    buildOwnerEvidenceCompletionDrillSourceAuditCoverage(ownerEvidenceCompletionDrillSourceAudit);
  const expectedOwnerGateScoreboardSourceTrace = buildOwnerGateScoreboardSourceTrace(
    expectedGateIds,
    closeoutStatus,
    completionAudit,
    remediationGates,
    ownerHandoff,
    completionDrill,
  );
  const expectedRemediationCompletionSourceTrace = buildRemediationCompletionSourceTrace(
    expectedGateIds,
    completionAudit,
  );
  const expectedOwnerEvidenceExecutionSummary = buildOwnerEvidenceExecutionSummary(
    closeoutStatus,
    ownerHandoff,
    completionDrill,
    localSafety,
  );
  const expectedOwnerPrepActionNeededByGate =
    expectedOwnerEvidenceExecutionSummary.ownerPrepActionNeededByGate;
  const expectedOperationalAccessPrerequisites =
    expectedOwnerEvidenceExecutionSummary.operationalAccessPrerequisiteSummary.prerequisites;
  const expectedOwnerActionQueueSummary = buildOwnerActionQueueSummary(
    remediationGates,
    ownerHandoff,
    closeoutStatus,
    completionDrill,
  );
  const ownerActionGateIds = (remediationGates.ownerActionQueue || []).map((item) => item.id);
  const expectedRemediationExternalGateSourceTrace = buildRemediationExternalGateSourceTrace(
    ownerActionGateIds,
    remediationGates,
  );
  const expectedLaunchEvidenceBlockerSourceTrace = buildLaunchEvidenceBlockerSourceTrace(
    expectedGateIds,
    launchEvidence,
    completionAudit,
    remediationGates,
  );
  const handoffGateIds = ownerHandoff.remainingGateIds || [];
  const handoffOwnerActionGateIds = (ownerHandoff.ownerActionRows || []).map((row) => row.gateId);
  const completionDrillRequiredGateIds = completionDrill.requiredGateIds || [];
  const completionDrillRowGateIds = (completionDrill.completionRows || []).map((row) => row.gateId);
  const expectedDecision = expectedLaunchDecision(closeoutStatus, completionAudit);
  const expectedStatus = expectedGateIds.length > 0 ? 'owner_evidence_required' : 'owner_evidence_complete';

  requireExact(errors, 'summary.schemaVersion', SUMMARY_SCHEMA, summary.schemaVersion);
  requireExact(errors, 'summary.status', 'passed', summary.status);
  requireExact(errors, 'state.status', expectedStatus, state.status);
  requireExact(errors, 'state.alignmentStatus', 'passed', state.alignmentStatus);
  requireExact(errors, 'state.alignmentErrors', [], state.alignmentErrors || []);
  requireExact(errors, 'state.launchDecision', launchEvidence.launch_decision, state.launchDecision);
  requireExact(errors, 'state.expectedLaunchDecision', expectedDecision, state.expectedLaunchDecision);
  requireExact(
    errors,
    'state.goalComplete',
    closeoutStatus.goalComplete === true && completionAudit.goalComplete === true,
    state.goalComplete,
  );
  requireExact(errors, 'state.sourceArtifact', LAUNCH_EVIDENCE_JSON, state.sourceArtifact);
  requireExact(errors, 'state.sourceArtifacts.launchEvidence', LAUNCH_EVIDENCE_JSON, state.sourceArtifacts?.launchEvidence);
  requireExact(
    errors,
    'state.sourceArtifacts.commercialArtifactRedaction',
    COMMERCIAL_ARTIFACT_REDACTION_JSON,
    state.sourceArtifacts?.commercialArtifactRedaction,
  );
  requireExact(
    errors,
    'state.sourceArtifacts.launchEvidenceSourceAudit',
    LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON,
    state.sourceArtifacts?.launchEvidenceSourceAudit,
  );
  requireExact(
    errors,
    'state.sourceArtifacts.commercialEvidenceIntakeSourceAudit',
    COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON,
    state.sourceArtifacts?.commercialEvidenceIntakeSourceAudit,
  );
  requireExact(
    errors,
    'state.sourceArtifacts.liveProofRunPacketSourceAudit',
    LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON,
    state.sourceArtifacts?.liveProofRunPacketSourceAudit,
  );
  requireExact(
    errors,
    'state.sourceArtifacts.liveCloseoutAccessSourceAudit',
    LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON,
    state.sourceArtifacts?.liveCloseoutAccessSourceAudit,
  );
  requireExact(
    errors,
    'state.sourceArtifacts.manualWcagReviewPacketSourceAudit',
    MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_JSON,
    state.sourceArtifacts?.manualWcagReviewPacketSourceAudit,
  );
  requireExact(
    errors,
    'state.sourceArtifacts.ownerEvidenceCompletionDrillSourceAudit',
    OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON,
    state.sourceArtifacts?.ownerEvidenceCompletionDrillSourceAudit,
  );
  requireExact(
    errors,
    'state.sourceArtifacts.liveCloseoutReadiness',
    LIVE_CLOSEOUT_READINESS_JSON,
    state.sourceArtifacts?.liveCloseoutReadiness,
  );
  requireExact(
    errors,
    'state.sourceArtifacts.ownerEvidenceCloseoutStatus',
    OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON,
    state.sourceArtifacts?.ownerEvidenceCloseoutStatus,
  );
  requireExact(
    errors,
    'state.sourceArtifacts.ownerEvidenceHandoff',
    OWNER_EVIDENCE_HANDOFF_JSON,
    state.sourceArtifacts?.ownerEvidenceHandoff,
  );
  requireExact(
    errors,
    'state.sourceArtifacts.ownerEvidenceCompletionDrill',
    OWNER_EVIDENCE_COMPLETION_DRILL_JSON,
    state.sourceArtifacts?.ownerEvidenceCompletionDrill,
  );
  requireExact(
    errors,
    'state.sourceArtifacts.ownerEvidenceLocalSafety',
    OWNER_EVIDENCE_LOCAL_SAFETY_JSON,
    state.sourceArtifacts?.ownerEvidenceLocalSafety,
  );
  requireExact(
    errors,
    'state.sourceArtifacts.remediationCompletionAudit',
    REMEDIATION_COMPLETION_AUDIT_JSON,
    state.sourceArtifacts?.remediationCompletionAudit,
  );
  requireExact(
    errors,
    'state.sourceArtifacts.remediationExternalGates',
    REMEDIATION_EXTERNAL_GATES_JSON,
    state.sourceArtifacts?.remediationExternalGates,
  );
  requireExact(
    errors,
    'state.sourceArtifacts.fullLocalApprovalPackage',
    FULL_LOCAL_APPROVAL_PACKAGE_SOURCE_ARTIFACT,
    state.sourceArtifacts?.fullLocalApprovalPackage,
  );
  requireExact(
    errors,
    'state.sourceArtifactCount',
    Object.keys(state.sourceArtifacts || {}).length,
    state.sourceArtifactCount,
  );
  requireExact(
    errors,
    'summary.postSummaryArtifactRedaction.command',
    POST_SUMMARY_ARTIFACT_REDACTION_COMMAND,
    summary.postSummaryArtifactRedaction?.command,
  );
  requireExact(
    errors,
    'summary.postSummaryArtifactRedaction.alignmentVerifier.command',
    POST_SUMMARY_ARTIFACT_REDACTION_ALIGNMENT_COMMAND,
    summary.postSummaryArtifactRedaction?.alignmentVerifier?.command,
  );
  requireExact(
    errors,
    'summary.postSummaryArtifactRedaction.fixtureVerifier.command',
    POST_SUMMARY_ARTIFACT_REDACTION_FIXTURE_COMMAND,
    summary.postSummaryArtifactRedaction?.fixtureVerifier?.command,
  );
  requireExact(
    errors,
    'summary.postSummaryArtifactRedaction.doesNotProve',
    expectedPostSummaryArtifactRedactionSummary.doesNotProve,
    summary.postSummaryArtifactRedaction?.doesNotProve || [],
  );
  requireExact(
    errors,
    'summary.postSummaryArtifactRedaction.doesNotProveCount',
    expectedPostSummaryArtifactRedactionSummary.doesNotProveCount,
    summary.postSummaryArtifactRedaction?.doesNotProveCount,
  );
  requireExact(
    errors,
    'summary.postSummaryFullLocalApprovalPackage.command',
    FULL_LOCAL_APPROVAL_PACKAGE_COMMAND,
    summary.postSummaryFullLocalApprovalPackage?.command,
  );
  requireExact(
    errors,
    'summary.postSummaryFullLocalApprovalPackage.fixtureVerifier.command',
    FULL_LOCAL_APPROVAL_PACKAGE_FIXTURE_COMMAND,
    summary.postSummaryFullLocalApprovalPackage?.fixtureVerifier?.command,
  );

  requireExact(errors, 'closeout.remainingGateIds', expectedGateIds, closeoutGateIds);
  requireExact(errors, 'closeout.scoreboard.remainingGateIds', expectedGateIds, closeoutScoreboard.remainingGateIds || []);
  requireExact(errors, 'launch.gapGateIds', expectedGateIds, launchGapGateIds);
  requireExact(errors, 'launch.unresolvedBlockers', expectedGateIds, launchUnresolvedBlockers);
  requireExact(errors, 'remediation.ownerActionGateIds', expectedGateIds, ownerActionGateIds);
  requireExact(errors, 'handoff.remainingGateIds', expectedGateIds, handoffGateIds);
  requireExact(errors, 'handoff.ownerActionRowGateIds', expectedGateIds, handoffOwnerActionGateIds);
  requireExact(
    errors,
    'handoff.ownerPrepActionNeededByGate',
    expectedOwnerPrepActionNeededByGate,
    ownerHandoff.ownerPrepActionNeededByGate || {},
  );
  requireExact(errors, 'completionDrill.requiredGateIds', expectedGateIds, completionDrillRequiredGateIds);
  requireExact(errors, 'completionDrill.completionRowGateIds', expectedGateIds, completionDrillRowGateIds);
  requireExact(
    errors,
    'completionDrill.ownerPrepActionNeededByGate',
    expectedOwnerPrepActionNeededByGate,
    completionDrill.ownerPrepActionNeededByGate || {},
  );
  requireExact(
    errors,
    'completionDrill.operationalAccessPrerequisites',
    expectedOperationalAccessPrerequisites,
    (completionDrill.operationalAccessPrerequisites || []).map(normalizeOperationalAccessPrerequisite),
  );
  requireExact(
    errors,
    'state.ownerGateScoreboard.sourceArtifact',
    OWNER_GATE_SCOREBOARD_SOURCE_ARTIFACT,
    state.ownerGateScoreboard?.sourceArtifact,
  );
  requireExact(
    errors,
    'state.ownerGateScoreboard.sourceArtifacts',
    {
      scoreboard: OWNER_GATE_SCOREBOARD_SOURCE_ARTIFACT,
      remediationCompletion: OWNER_GATE_SCOREBOARD_REMEDIATION_COMPLETION_SOURCE_ARTIFACT,
      remediationExternalGates: OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT,
      closeoutStatus: OWNER_ACTION_QUEUE_CLOSEOUT_SOURCE_ARTIFACT,
      handoff: OWNER_ACTION_QUEUE_HANDOFF_SOURCE_ARTIFACT,
      completionDrill: OWNER_ACTION_QUEUE_COMPLETION_DRILL_SOURCE_ARTIFACT,
    },
    state.ownerGateScoreboard?.sourceArtifacts || {},
  );
  requireExact(
    errors,
    'state.ownerGateScoreboard.sourceArtifactCount',
    6,
    state.ownerGateScoreboard?.sourceArtifactCount,
  );
  requireExact(errors, 'state.ownerGateScoreboard.remainingGateIds', expectedGateIds, state.ownerGateScoreboard?.remainingGateIds || []);
  requireExact(
    errors,
    'state.ownerGateScoreboard.remainingGateCount',
    expectedGateIds.length,
    state.ownerGateScoreboard?.remainingGateCount,
  );
  requireExact(
    errors,
    'state.ownerGateScoreboard.sourceTraceCount',
    expectedOwnerGateScoreboardSourceTrace.length,
    state.ownerGateScoreboard?.sourceTraceCount,
  );
  requireExact(
    errors,
    'state.ownerGateScoreboard.sourceTrace',
    expectedOwnerGateScoreboardSourceTrace,
    state.ownerGateScoreboard?.sourceTrace || [],
  );
  requireExact(
    errors,
    'state.ownerGateScoreboard.remainingGateSourceTraceCount',
    expectedOwnerGateScoreboardSourceTrace.length,
    state.ownerGateScoreboard?.remainingGateSourceTraceCount,
  );
  requireExact(
    errors,
    'state.ownerGateScoreboard.remainingGateSourceTrace',
    expectedOwnerGateScoreboardSourceTrace,
    state.ownerGateScoreboard?.remainingGateSourceTrace || [],
  );
  requireExact(
    errors,
    'state.ownerGateScoreboard.sourceTraceBoundary',
    OWNER_GATE_SCOREBOARD_SOURCE_TRACE_BOUNDARY,
    state.ownerGateScoreboard?.sourceTraceBoundary,
  );
  requireExact(
    errors,
    'state.ownerGateScoreboard.evidenceBoundary',
    closeoutScoreboard.evidenceBoundary || '',
    state.ownerGateScoreboard?.evidenceBoundary || '',
  );
  requireExact(
    errors,
    'state.ownerGateScoreboard.acceptedLiveGateIds',
    closeoutStatus.acceptedLiveGateIds || [],
    state.ownerGateScoreboard?.acceptedLiveGateIds || [],
  );
  requireExact(
    errors,
    'state.ownerGateScoreboard.ownerActionNeededCount',
    closeoutStatus.ownerActionNeededCount ?? null,
    state.ownerGateScoreboard?.ownerActionNeededCount ?? null,
  );
  requireExact(errors, 'state.remediationCompletion.remainingExternalGateIds', expectedGateIds, state.remediationCompletion?.remainingExternalGateIds || []);
  requireExact(
    errors,
    'state.remediationCompletion.remainingExternalGateCount',
    expectedGateIds.length,
    state.remediationCompletion?.remainingExternalGateCount,
  );
  requireExact(
    errors,
    'state.remediationCompletion.sourceArtifact',
    OWNER_GATE_SCOREBOARD_REMEDIATION_COMPLETION_SOURCE_ARTIFACT,
    state.remediationCompletion?.sourceArtifact,
  );
  requireExact(
    errors,
    'state.remediationCompletion.sourceArtifactCount',
    1,
    state.remediationCompletion?.sourceArtifactCount,
  );
  requireExact(
    errors,
    'state.remediationCompletion.sourceTraceCount',
    expectedRemediationCompletionSourceTrace.length,
    state.remediationCompletion?.sourceTraceCount,
  );
  requireExact(
    errors,
    'state.remediationCompletion.sourceTrace',
    expectedRemediationCompletionSourceTrace,
    state.remediationCompletion?.sourceTrace || [],
  );
  requireExact(
    errors,
    'state.remediationCompletion.remainingExternalGateSourceTraceCount',
    expectedRemediationCompletionSourceTrace.length,
    state.remediationCompletion?.remainingExternalGateSourceTraceCount,
  );
  requireExact(
    errors,
    'state.remediationCompletion.remainingExternalGateSourceTrace',
    expectedRemediationCompletionSourceTrace,
    state.remediationCompletion?.remainingExternalGateSourceTrace || [],
  );
  requireExact(
    errors,
    'state.remediationCompletion.sourceTraceBoundary',
    REMEDIATION_COMPLETION_SOURCE_TRACE_BOUNDARY,
    state.remediationCompletion?.sourceTraceBoundary,
  );
  requireExact(
    errors,
    'state.remediationCompletion.evidenceBoundary',
    REMEDIATION_COMPLETION_EVIDENCE_BOUNDARY,
    state.remediationCompletion?.evidenceBoundary,
  );
  requireExact(errors, 'state.launchEvidence.gapGateIds', expectedGateIds, state.launchEvidence?.gapGateIds || []);
  requireExact(
    errors,
    'state.launchEvidence.unresolvedBlockers',
    expectedGateIds,
    state.launchEvidence?.unresolvedBlockers || [],
  );
  requireExact(
    errors,
    'state.launchEvidence.sourceArtifact',
    LAUNCH_EVIDENCE_JSON,
    state.launchEvidence?.sourceArtifact,
  );
  requireExact(
    errors,
    'state.launchEvidence.sourceArtifacts',
    {
      gaps: LAUNCH_EVIDENCE_GAPS_SOURCE_ARTIFACT,
      unresolvedBlockers: LAUNCH_EVIDENCE_UNRESOLVED_BLOCKERS_SOURCE_ARTIFACT,
      remediationCompletion: OWNER_GATE_SCOREBOARD_REMEDIATION_COMPLETION_SOURCE_ARTIFACT,
      remediationExternalGates: OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT,
    },
    state.launchEvidence?.sourceArtifacts || {},
  );
  requireExact(
    errors,
    'state.launchEvidence.sourceArtifactCount',
    4,
    state.launchEvidence?.sourceArtifactCount,
  );
  requireExact(
    errors,
    'state.launchEvidence.sourceTraceCount',
    expectedLaunchEvidenceBlockerSourceTrace.length,
    state.launchEvidence?.sourceTraceCount,
  );
  requireExact(
    errors,
    'state.launchEvidence.sourceTrace',
    expectedLaunchEvidenceBlockerSourceTrace,
    state.launchEvidence?.sourceTrace || [],
  );
  requireExact(
    errors,
    'state.launchEvidence.blockerSourceTraceCount',
    expectedLaunchEvidenceBlockerSourceTrace.length,
    state.launchEvidence?.blockerSourceTraceCount,
  );
  requireExact(
    errors,
    'state.launchEvidence.blockerSourceTrace',
    expectedLaunchEvidenceBlockerSourceTrace,
    state.launchEvidence?.blockerSourceTrace || [],
  );
  requireExact(
    errors,
    'state.launchEvidence.sourceTraceBoundary',
    LAUNCH_EVIDENCE_BLOCKER_SOURCE_TRACE_BOUNDARY,
    state.launchEvidence?.sourceTraceBoundary,
  );
  requireExact(
    errors,
    'state.launchEvidence.evidenceBoundary',
    LAUNCH_EVIDENCE_BLOCKER_EVIDENCE_BOUNDARY,
    state.launchEvidence?.evidenceBoundary,
  );
  requireExact(errors, 'state.launchEvidenceSummary', expectedLaunchEvidenceSummary, state.launchEvidenceSummary || {});
  requireExact(errors, 'state.proofBucketSummary', expectedProofBucketSummary, state.proofBucketSummary || {});
  requireExact(
    errors,
    'state.releaseGateCoverageSummary',
    expectedReleaseGateCoverageSummary,
    state.releaseGateCoverageSummary || {},
  );
  requireExact(
    errors,
    'state.launchSourceAuditCoverage',
    expectedLaunchSourceAuditCoverage,
    state.launchSourceAuditCoverage || {},
  );
  requireExact(
    errors,
    'state.commercialEvidenceIntakeSourceAuditCoverage',
    expectedCommercialEvidenceIntakeSourceAuditCoverage,
    state.commercialEvidenceIntakeSourceAuditCoverage || {},
  );
  requireExact(
    errors,
    'state.liveProofRunPacketSourceAuditCoverage',
    expectedLiveProofRunPacketSourceAuditCoverage,
    state.liveProofRunPacketSourceAuditCoverage || {},
  );
  requireExact(
    errors,
    'state.liveCloseoutAccessSourceAuditCoverage',
    expectedLiveCloseoutAccessSourceAuditCoverage,
    state.liveCloseoutAccessSourceAuditCoverage || {},
  );
  requireExact(
    errors,
    'state.liveCloseoutReadinessCoverage',
    expectedLiveCloseoutReadinessCoverage,
    state.liveCloseoutReadinessCoverage || {},
  );
  requireExact(
    errors,
    'state.liveCloseoutReadinessCoverage.sourceTraceCount',
    expectedLiveCloseoutReadinessCoverage.sourceTraceCount,
    state.liveCloseoutReadinessCoverage?.sourceTraceCount,
  );
  requireExact(
    errors,
    'state.liveCloseoutReadinessCoverage.sourceTrace',
    expectedLiveCloseoutReadinessCoverage.sourceTrace,
    state.liveCloseoutReadinessCoverage?.sourceTrace || [],
  );
  requireExact(
    errors,
    'state.postSummaryArtifactRedactionSummary',
    expectedPostSummaryArtifactRedactionSummary,
    state.postSummaryArtifactRedactionSummary || {},
  );
  requireExact(
    errors,
    'state.postSummaryLaunchReadinessAlignmentSummary',
    expectedPostSummaryLaunchReadinessAlignmentSummary,
    state.postSummaryLaunchReadinessAlignmentSummary || {},
  );
  requireExact(
    errors,
    'state.postSummaryLaunchEvidenceRefreshSummary',
    expectedPostSummaryLaunchEvidenceRefreshSummary,
    state.postSummaryLaunchEvidenceRefreshSummary || {},
  );
  requireExact(
    errors,
    'state.fullLocalApprovalPackageSummary',
    expectedFullLocalApprovalPackageSummary,
    state.fullLocalApprovalPackageSummary || {},
  );
  requireExact(
    errors,
    'state.manualWcagReviewPacketSourceAuditCoverage',
    expectedManualWcagReviewPacketSourceAuditCoverage,
    state.manualWcagReviewPacketSourceAuditCoverage || {},
  );
  requireExact(
    errors,
    'state.ownerEvidenceCompletionDrillSourceAuditCoverage',
    expectedOwnerEvidenceCompletionDrillSourceAuditCoverage,
    state.ownerEvidenceCompletionDrillSourceAuditCoverage || {},
  );
  requireExact(
    errors,
    'state.ownerEvidenceExecutionSummary',
    expectedOwnerEvidenceExecutionSummary,
    state.ownerEvidenceExecutionSummary || {},
  );
  requireExact(
    errors,
    'state.ownerEvidenceExecutionSummary.closeoutCoverage.sourceTraceCount',
    expectedOwnerEvidenceExecutionSummary.closeoutCoverage.sourceTraceCount,
    state.ownerEvidenceExecutionSummary?.closeoutCoverage?.sourceTraceCount,
  );
  requireExact(
    errors,
    'state.ownerEvidenceExecutionSummary.closeoutCoverage.sourceTrace',
    expectedOwnerEvidenceExecutionSummary.closeoutCoverage.sourceTrace,
    state.ownerEvidenceExecutionSummary?.closeoutCoverage?.sourceTrace || [],
  );
  requireExact(
    errors,
    'state.ownerEvidenceExecutionSummary.handoffCoverage.sourceTraceCount',
    expectedOwnerEvidenceExecutionSummary.handoffCoverage.sourceTraceCount,
    state.ownerEvidenceExecutionSummary?.handoffCoverage?.sourceTraceCount,
  );
  requireExact(
    errors,
    'state.ownerEvidenceExecutionSummary.handoffCoverage.sourceTrace',
    expectedOwnerEvidenceExecutionSummary.handoffCoverage.sourceTrace,
    state.ownerEvidenceExecutionSummary?.handoffCoverage?.sourceTrace || [],
  );
  requireExact(
    errors,
    'state.ownerEvidenceExecutionSummary.completionDrillCoverage.sourceTraceCount',
    expectedOwnerEvidenceExecutionSummary.completionDrillCoverage.sourceTraceCount,
    state.ownerEvidenceExecutionSummary?.completionDrillCoverage?.sourceTraceCount,
  );
  requireExact(
    errors,
    'state.ownerEvidenceExecutionSummary.completionDrillCoverage.sourceTrace',
    expectedOwnerEvidenceExecutionSummary.completionDrillCoverage.sourceTrace,
    state.ownerEvidenceExecutionSummary?.completionDrillCoverage?.sourceTrace || [],
  );
  if (
    expectedOwnerEvidenceExecutionSummary.localSafetyStatusSummary
      .handoffStatusMatchesLocalSafety !== true
  ) {
    addError(errors, 'owner_local_safety_handoff_status_mismatch', {
      expected: buildOwnerLocalSafetyStatus(localSafety),
      actual: ownerHandoff.localSafetyStatus || null,
    });
  }
  if (
    expectedOwnerEvidenceExecutionSummary.localSafetyStatusSummary
      .completionDrillStatusMatchesLocalSafety !== true
  ) {
    addError(errors, 'owner_local_safety_completion_drill_status_mismatch', {
      expected: buildOwnerLocalSafetyStatus(localSafety),
      actual: completionDrill.localSafetyStatus || null,
    });
  }
  requireExact(
    errors,
    'state.ownerActionQueueSummary',
    expectedOwnerActionQueueSummary,
    state.ownerActionQueueSummary || {},
  );
  requireExact(errors, 'state.progressUpdates', launchProgressUpdates, state.progressUpdates || []);
  requireExact(errors, 'state.bottleneckLog', launchBottleneckLog, state.bottleneckLog || []);
  requireExact(errors, 'state.implementationDecisions', launchImplementationDecisions, state.implementationDecisions || []);
  requireExact(errors, 'state.rejectedVariants', launchRejectedVariants, state.rejectedVariants || []);
  requireExact(
    errors,
    'state.codeOptimizationReviews',
    launchCodeOptimizationReviews,
    state.codeOptimizationReviews || [],
  );
  requireExact(errors, 'state.remediationExternalGates.ownerActionGateIds', expectedGateIds, state.remediationExternalGates?.ownerActionGateIds || []);
  requireExact(
    errors,
    'state.remediationExternalGates.sourceArtifact',
    OWNER_ACTION_QUEUE_REMEDIATION_SOURCE_ARTIFACT,
    state.remediationExternalGates?.sourceArtifact,
  );
  requireExact(
    errors,
    'state.remediationExternalGates.sourceArtifactCount',
    1,
    state.remediationExternalGates?.sourceArtifactCount,
  );
  requireExact(
    errors,
    'state.remediationExternalGates.sourceTraceCount',
    expectedRemediationExternalGateSourceTrace.length,
    state.remediationExternalGates?.sourceTraceCount,
  );
  requireExact(
    errors,
    'state.remediationExternalGates.sourceTrace',
    expectedRemediationExternalGateSourceTrace,
    state.remediationExternalGates?.sourceTrace || [],
  );
  requireExact(
    errors,
    'state.remediationExternalGates.ownerActionGateSourceTraceCount',
    expectedRemediationExternalGateSourceTrace.length,
    state.remediationExternalGates?.ownerActionGateSourceTraceCount,
  );
  requireExact(
    errors,
    'state.remediationExternalGates.ownerActionGateSourceTrace',
    expectedRemediationExternalGateSourceTrace,
    state.remediationExternalGates?.ownerActionGateSourceTrace || [],
  );
  requireExact(
    errors,
    'state.remediationExternalGates.sourceTraceBoundary',
    REMEDIATION_EXTERNAL_GATES_SOURCE_TRACE_BOUNDARY,
    state.remediationExternalGates?.sourceTraceBoundary,
  );
  requireExact(
    errors,
    'state.remediationExternalGates.evidenceBoundary',
    REMEDIATION_EXTERNAL_GATES_EVIDENCE_BOUNDARY,
    state.remediationExternalGates?.evidenceBoundary,
  );

  if (!Array.isArray(launchEvidence.progress_updates) || launchEvidence.progress_updates.length === 0) {
    addError(errors, 'launch_missing_progress_updates');
  }
  if (!Array.isArray(launchEvidence.bottleneck_log) || launchEvidence.bottleneck_log.length === 0) {
    addError(errors, 'launch_missing_bottleneck_log');
  }
  if (!Array.isArray(launchEvidence.implementation_decisions) || launchEvidence.implementation_decisions.length === 0) {
    addError(errors, 'launch_missing_implementation_decisions');
  }
  if (!Array.isArray(launchEvidence.rejected_variants) || launchEvidence.rejected_variants.length === 0) {
    addError(errors, 'launch_missing_rejected_variants');
  }
  if (!Array.isArray(launchEvidence.code_optimization_reviews) || launchEvidence.code_optimization_reviews.length === 0) {
    addError(errors, 'launch_missing_code_optimization_reviews');
  }
  if (!launchEvidence.scores || typeof launchEvidence.scores !== 'object') {
    addError(errors, 'launch_missing_scores');
  }
  if (!Array.isArray(launchEvidence.gaps)) {
    addError(errors, 'launch_missing_gaps');
  }
  if (!Array.isArray(launchEvidence.pain_points) || launchEvidence.pain_points.length < 10) {
    addError(errors, 'launch_missing_pain_points');
  }
  if (!Array.isArray(launchEvidence.target_customers) || launchEvidence.target_customers.length < 10) {
    addError(errors, 'launch_missing_target_customers');
  }
  if (!launchEvidence.outreach_plan?.crm_export) {
    addError(errors, 'launch_missing_outreach_crm_export');
  }
  if (
    !launchEvidence.proof_buckets ||
    typeof launchEvidence.proof_buckets !== 'object' ||
    Array.isArray(launchEvidence.proof_buckets)
  ) {
    addError(errors, 'launch_missing_proof_buckets');
  } else {
    ['hosted_live', 'local', 'repo_artifact', 'candidate_shadow', 'roadmap'].forEach((bucketName) => {
      if (!Array.isArray(launchEvidence.proof_buckets[bucketName]) || launchEvidence.proof_buckets[bucketName].length === 0) {
        addError(errors, `launch_missing_${bucketName}_proof_bucket`);
      }
    });
    if (expectedProofBucketSummary.itemCount === 0) {
      addError(errors, 'launch_missing_proof_bucket_items');
    }
  }
  if (sourceAudit.allPassed !== true) {
    addError(errors, 'source_audit_not_all_passed', {
      allPassed: sourceAudit.allPassed,
      failedSourceUrls: sourceAudit.failedSourceUrls || [],
    });
  }
  if (!Array.isArray(sourceAudit.sources) || sourceAudit.sources.length === 0) {
    addError(errors, 'source_audit_missing_sources');
  }
  if ((sourceAudit.failedCount ?? 0) !== 0) {
    addError(errors, 'source_audit_failed_sources', {
      failedCount: sourceAudit.failedCount,
      failedSourceUrls: sourceAudit.failedSourceUrls || [],
    });
  }
  if ((sourceAudit.missingExpectationCount ?? 0) !== 0) {
    addError(errors, 'source_audit_missing_expectations', {
      missingExpectationCount: sourceAudit.missingExpectationCount,
    });
  }
  if (expectedLaunchSourceAuditCoverage.networkFetch !== true) {
    addError(errors, 'source_audit_network_fetch_not_enabled', {
      networkFetch: expectedLaunchSourceAuditCoverage.networkFetch,
    });
  }
  if ((expectedLaunchSourceAuditCoverage.fetchedSourceCount ?? 0) !== (expectedLaunchSourceAuditCoverage.sourceCount ?? 0)) {
    addError(errors, 'source_audit_incomplete_fetch_coverage', {
      fetchedSourceCount: expectedLaunchSourceAuditCoverage.fetchedSourceCount,
      sourceCount: expectedLaunchSourceAuditCoverage.sourceCount,
    });
  }
  if ((expectedLaunchSourceAuditCoverage.expectationCheckCount ?? 0) <= 0) {
    addError(errors, 'source_audit_missing_expected_text_checks', {
      expectationCheckCount: expectedLaunchSourceAuditCoverage.expectationCheckCount,
    });
  }
  if (
    (expectedLaunchSourceAuditCoverage.expectedTextMatchCount ?? 0) !==
    (expectedLaunchSourceAuditCoverage.expectationCheckCount ?? 0)
  ) {
    addError(errors, 'source_audit_expected_text_mismatch', {
      expectedTextMatchCount: expectedLaunchSourceAuditCoverage.expectedTextMatchCount,
      expectationCheckCount: expectedLaunchSourceAuditCoverage.expectationCheckCount,
    });
  }
  if (commercialEvidenceIntakeSourceAudit.allPassed !== true) {
    addError(errors, 'commercial_evidence_intake_source_audit_not_all_passed', {
      allPassed: commercialEvidenceIntakeSourceAudit.allPassed,
      failedSourceIds: commercialEvidenceIntakeSourceAudit.failedSourceIds || [],
    });
  }
  if (!Array.isArray(commercialEvidenceIntakeSourceAudit.sources) || commercialEvidenceIntakeSourceAudit.sources.length === 0) {
    addError(errors, 'commercial_evidence_intake_source_audit_missing_sources');
  }
  if ((commercialEvidenceIntakeSourceAudit.failedCount ?? 0) !== 0) {
    addError(errors, 'commercial_evidence_intake_source_audit_failed_sources', {
      failedCount: commercialEvidenceIntakeSourceAudit.failedCount,
      failedSourceIds: commercialEvidenceIntakeSourceAudit.failedSourceIds || [],
    });
  }
  if ((commercialEvidenceIntakeSourceAudit.missingExpectationCount ?? 0) !== 0) {
    addError(errors, 'commercial_evidence_intake_source_audit_missing_expectations', {
      missingExpectationCount: commercialEvidenceIntakeSourceAudit.missingExpectationCount,
    });
  }
  if ((commercialEvidenceIntakeSourceAudit.unexpectedReferenceCount ?? 0) !== 0) {
    addError(errors, 'commercial_evidence_intake_source_audit_unexpected_references', {
      unexpectedReferenceCount: commercialEvidenceIntakeSourceAudit.unexpectedReferenceCount,
    });
  }
  if (expectedCommercialEvidenceIntakeSourceAuditCoverage.networkFetch !== true) {
    addError(errors, 'commercial_evidence_intake_source_audit_network_fetch_not_enabled', {
      networkFetch: expectedCommercialEvidenceIntakeSourceAuditCoverage.networkFetch,
    });
  }
  if (
    (expectedCommercialEvidenceIntakeSourceAuditCoverage.fetchedSourceCount ?? 0) !==
    (expectedCommercialEvidenceIntakeSourceAuditCoverage.sourceCount ?? 0)
  ) {
    addError(errors, 'commercial_evidence_intake_source_audit_incomplete_fetch_coverage', {
      fetchedSourceCount: expectedCommercialEvidenceIntakeSourceAuditCoverage.fetchedSourceCount,
      sourceCount: expectedCommercialEvidenceIntakeSourceAuditCoverage.sourceCount,
    });
  }
  if ((expectedCommercialEvidenceIntakeSourceAuditCoverage.expectationCheckCount ?? 0) <= 0) {
    addError(errors, 'commercial_evidence_intake_source_audit_missing_expected_text_checks', {
      expectationCheckCount: expectedCommercialEvidenceIntakeSourceAuditCoverage.expectationCheckCount,
    });
  }
  if (
    (expectedCommercialEvidenceIntakeSourceAuditCoverage.expectedTextMatchCount ?? 0) !==
    (expectedCommercialEvidenceIntakeSourceAuditCoverage.expectationCheckCount ?? 0)
  ) {
    addError(errors, 'commercial_evidence_intake_source_audit_expected_text_mismatch', {
      expectedTextMatchCount: expectedCommercialEvidenceIntakeSourceAuditCoverage.expectedTextMatchCount,
      expectationCheckCount: expectedCommercialEvidenceIntakeSourceAuditCoverage.expectationCheckCount,
    });
  }
  if (liveProofRunPacketSourceAudit.allPassed !== true) {
    addError(errors, 'live_proof_run_packet_source_audit_not_all_passed', {
      allPassed: liveProofRunPacketSourceAudit.allPassed,
      failedSourceIds: liveProofRunPacketSourceAudit.failedSourceIds || [],
    });
  }
  if (!Array.isArray(liveProofRunPacketSourceAudit.sources) || liveProofRunPacketSourceAudit.sources.length === 0) {
    addError(errors, 'live_proof_run_packet_source_audit_missing_sources');
  }
  if ((liveProofRunPacketSourceAudit.failedCount ?? 0) !== 0) {
    addError(errors, 'live_proof_run_packet_source_audit_failed_sources', {
      failedCount: liveProofRunPacketSourceAudit.failedCount,
      failedSourceIds: liveProofRunPacketSourceAudit.failedSourceIds || [],
    });
  }
  if ((liveProofRunPacketSourceAudit.missingExpectationCount ?? 0) !== 0) {
    addError(errors, 'live_proof_run_packet_source_audit_missing_expectations', {
      missingExpectationCount: liveProofRunPacketSourceAudit.missingExpectationCount,
    });
  }
  if ((liveProofRunPacketSourceAudit.unexpectedReferenceCount ?? 0) !== 0) {
    addError(errors, 'live_proof_run_packet_source_audit_unexpected_references', {
      unexpectedReferenceCount: liveProofRunPacketSourceAudit.unexpectedReferenceCount,
    });
  }
  if (expectedLiveProofRunPacketSourceAuditCoverage.networkFetch !== true) {
    addError(errors, 'live_proof_run_packet_source_audit_network_fetch_not_enabled', {
      networkFetch: expectedLiveProofRunPacketSourceAuditCoverage.networkFetch,
    });
  }
  if (
    (expectedLiveProofRunPacketSourceAuditCoverage.fetchedSourceCount ?? 0) !==
    (expectedLiveProofRunPacketSourceAuditCoverage.sourceCount ?? 0)
  ) {
    addError(errors, 'live_proof_run_packet_source_audit_incomplete_fetch_coverage', {
      fetchedSourceCount: expectedLiveProofRunPacketSourceAuditCoverage.fetchedSourceCount,
      sourceCount: expectedLiveProofRunPacketSourceAuditCoverage.sourceCount,
    });
  }
  if ((expectedLiveProofRunPacketSourceAuditCoverage.expectationCheckCount ?? 0) <= 0) {
    addError(errors, 'live_proof_run_packet_source_audit_missing_expected_text_checks', {
      expectationCheckCount: expectedLiveProofRunPacketSourceAuditCoverage.expectationCheckCount,
    });
  }
  if (
    (expectedLiveProofRunPacketSourceAuditCoverage.expectedTextMatchCount ?? 0) !==
    (expectedLiveProofRunPacketSourceAuditCoverage.expectationCheckCount ?? 0)
  ) {
    addError(errors, 'live_proof_run_packet_source_audit_expected_text_mismatch', {
      expectedTextMatchCount: expectedLiveProofRunPacketSourceAuditCoverage.expectedTextMatchCount,
      expectationCheckCount: expectedLiveProofRunPacketSourceAuditCoverage.expectationCheckCount,
    });
  }
  if (liveCloseoutAccessSourceAudit.allPassed !== true) {
    addError(errors, 'live_closeout_access_source_audit_not_all_passed', {
      allPassed: liveCloseoutAccessSourceAudit.allPassed,
      failedSourceIds: liveCloseoutAccessSourceAudit.failedSourceIds || [],
    });
  }
  if (liveCloseoutReadiness.commandContext?.mutatesExternalState !== false) {
    addError(errors, 'live_closeout_readiness_external_mutation_overclaim', {
      mutatesExternalState: liveCloseoutReadiness.commandContext?.mutatesExternalState,
    });
  }
  if (liveCloseoutReadiness.commandContext?.printsSecretValues !== false) {
    addError(errors, 'live_closeout_readiness_secret_printing_overclaim', {
      printsSecretValues: liveCloseoutReadiness.commandContext?.printsSecretValues,
    });
  }
  if (liveCloseoutReadiness.githubSecrets?.valuesRedacted !== true) {
    addError(errors, 'live_closeout_readiness_secret_redaction_missing', {
      valuesRedacted: liveCloseoutReadiness.githubSecrets?.valuesRedacted,
    });
  }
  requireExact(
    errors,
    'liveCloseoutReadiness.nextActionCount',
    (liveCloseoutReadiness.nextActions || []).length,
    liveCloseoutReadiness.nextActionCount,
  );
  requireExact(
    errors,
    'liveCloseoutReadiness.doesNotProveCount',
    (liveCloseoutReadiness.doesNotProve || []).length,
    liveCloseoutReadiness.doesNotProveCount,
  );
  if (!Array.isArray(liveCloseoutAccessSourceAudit.sources) || liveCloseoutAccessSourceAudit.sources.length === 0) {
    addError(errors, 'live_closeout_access_source_audit_missing_sources');
  }
  if ((liveCloseoutAccessSourceAudit.failedCount ?? 0) !== 0) {
    addError(errors, 'live_closeout_access_source_audit_failed_sources', {
      failedCount: liveCloseoutAccessSourceAudit.failedCount,
      failedSourceIds: liveCloseoutAccessSourceAudit.failedSourceIds || [],
    });
  }
  if ((liveCloseoutAccessSourceAudit.missingExpectationCount ?? 0) !== 0) {
    addError(errors, 'live_closeout_access_source_audit_missing_expectations', {
      missingExpectationCount: liveCloseoutAccessSourceAudit.missingExpectationCount,
    });
  }
  if ((liveCloseoutAccessSourceAudit.unexpectedReferenceCount ?? 0) !== 0) {
    addError(errors, 'live_closeout_access_source_audit_unexpected_references', {
      unexpectedReferenceCount: liveCloseoutAccessSourceAudit.unexpectedReferenceCount,
    });
  }
  if (expectedLiveCloseoutAccessSourceAuditCoverage.networkFetch !== true) {
    addError(errors, 'live_closeout_access_source_audit_network_fetch_not_enabled', {
      networkFetch: expectedLiveCloseoutAccessSourceAuditCoverage.networkFetch,
    });
  }
  if (
    (expectedLiveCloseoutAccessSourceAuditCoverage.fetchedSourceCount ?? 0) !==
    (expectedLiveCloseoutAccessSourceAuditCoverage.sourceCount ?? 0)
  ) {
    addError(errors, 'live_closeout_access_source_audit_incomplete_fetch_coverage', {
      fetchedSourceCount: expectedLiveCloseoutAccessSourceAuditCoverage.fetchedSourceCount,
      sourceCount: expectedLiveCloseoutAccessSourceAuditCoverage.sourceCount,
    });
  }
  if ((expectedLiveCloseoutAccessSourceAuditCoverage.expectationCheckCount ?? 0) <= 0) {
    addError(errors, 'live_closeout_access_source_audit_missing_expected_text_checks', {
      expectationCheckCount: expectedLiveCloseoutAccessSourceAuditCoverage.expectationCheckCount,
    });
  }
  if (
    (expectedLiveCloseoutAccessSourceAuditCoverage.expectedTextMatchCount ?? 0) !==
    (expectedLiveCloseoutAccessSourceAuditCoverage.expectationCheckCount ?? 0)
  ) {
    addError(errors, 'live_closeout_access_source_audit_expected_text_mismatch', {
      expectedTextMatchCount: expectedLiveCloseoutAccessSourceAuditCoverage.expectedTextMatchCount,
      expectationCheckCount: expectedLiveCloseoutAccessSourceAuditCoverage.expectationCheckCount,
    });
  }
  if (manualWcagReviewPacketSourceAudit.allPassed !== true) {
    addError(errors, 'manual_wcag_review_packet_source_audit_not_all_passed', {
      allPassed: manualWcagReviewPacketSourceAudit.allPassed,
      failedSourceIds: manualWcagReviewPacketSourceAudit.failedSourceIds || [],
    });
  }
  if (!Array.isArray(manualWcagReviewPacketSourceAudit.sources) || manualWcagReviewPacketSourceAudit.sources.length === 0) {
    addError(errors, 'manual_wcag_review_packet_source_audit_missing_sources');
  }
  if ((manualWcagReviewPacketSourceAudit.failedCount ?? 0) !== 0) {
    addError(errors, 'manual_wcag_review_packet_source_audit_failed_sources', {
      failedCount: manualWcagReviewPacketSourceAudit.failedCount,
      failedSourceIds: manualWcagReviewPacketSourceAudit.failedSourceIds || [],
    });
  }
  if ((manualWcagReviewPacketSourceAudit.missingExpectationCount ?? 0) !== 0) {
    addError(errors, 'manual_wcag_review_packet_source_audit_missing_expectations', {
      missingExpectationCount: manualWcagReviewPacketSourceAudit.missingExpectationCount,
    });
  }
  if ((manualWcagReviewPacketSourceAudit.unexpectedReferenceCount ?? 0) !== 0) {
    addError(errors, 'manual_wcag_review_packet_source_audit_unexpected_references', {
      unexpectedReferenceCount: manualWcagReviewPacketSourceAudit.unexpectedReferenceCount,
    });
  }
  if (expectedManualWcagReviewPacketSourceAuditCoverage.networkFetch !== true) {
    addError(errors, 'manual_wcag_review_packet_source_audit_network_fetch_not_enabled', {
      networkFetch: expectedManualWcagReviewPacketSourceAuditCoverage.networkFetch,
    });
  }
  if (
    (expectedManualWcagReviewPacketSourceAuditCoverage.fetchedSourceCount ?? 0) !==
    (expectedManualWcagReviewPacketSourceAuditCoverage.sourceCount ?? 0)
  ) {
    addError(errors, 'manual_wcag_review_packet_source_audit_incomplete_fetch_coverage', {
      fetchedSourceCount: expectedManualWcagReviewPacketSourceAuditCoverage.fetchedSourceCount,
      sourceCount: expectedManualWcagReviewPacketSourceAuditCoverage.sourceCount,
    });
  }
  if ((expectedManualWcagReviewPacketSourceAuditCoverage.expectationCheckCount ?? 0) <= 0) {
    addError(errors, 'manual_wcag_review_packet_source_audit_missing_expected_text_checks', {
      expectationCheckCount: expectedManualWcagReviewPacketSourceAuditCoverage.expectationCheckCount,
    });
  }
  if (
    (expectedManualWcagReviewPacketSourceAuditCoverage.expectedTextMatchCount ?? 0) !==
    (expectedManualWcagReviewPacketSourceAuditCoverage.expectationCheckCount ?? 0)
  ) {
    addError(errors, 'manual_wcag_review_packet_source_audit_expected_text_mismatch', {
      expectedTextMatchCount: expectedManualWcagReviewPacketSourceAuditCoverage.expectedTextMatchCount,
      expectationCheckCount: expectedManualWcagReviewPacketSourceAuditCoverage.expectationCheckCount,
    });
  }
  if (ownerEvidenceCompletionDrillSourceAudit.allPassed !== true) {
    addError(errors, 'owner_evidence_completion_drill_source_audit_not_all_passed', {
      allPassed: ownerEvidenceCompletionDrillSourceAudit.allPassed,
      failedSourceKeys: ownerEvidenceCompletionDrillSourceAudit.failedSourceKeys || [],
    });
  }
  if (!Array.isArray(ownerEvidenceCompletionDrillSourceAudit.sources) || ownerEvidenceCompletionDrillSourceAudit.sources.length === 0) {
    addError(errors, 'owner_evidence_completion_drill_source_audit_missing_sources');
  }
  if ((ownerEvidenceCompletionDrillSourceAudit.failedCount ?? 0) !== 0) {
    addError(errors, 'owner_evidence_completion_drill_source_audit_failed_sources', {
      failedCount: ownerEvidenceCompletionDrillSourceAudit.failedCount,
      failedSourceKeys: ownerEvidenceCompletionDrillSourceAudit.failedSourceKeys || [],
    });
  }
  if ((ownerEvidenceCompletionDrillSourceAudit.missingExpectationCount ?? 0) !== 0) {
    addError(errors, 'owner_evidence_completion_drill_source_audit_missing_expectations', {
      missingExpectationCount: ownerEvidenceCompletionDrillSourceAudit.missingExpectationCount,
    });
  }
  if ((ownerEvidenceCompletionDrillSourceAudit.unexpectedReferenceCount ?? 0) !== 0) {
    addError(errors, 'owner_evidence_completion_drill_source_audit_unexpected_references', {
      unexpectedReferenceCount: ownerEvidenceCompletionDrillSourceAudit.unexpectedReferenceCount,
    });
  }
  if (ownerEvidenceCompletionDrillSourceAudit.topLevelUrlMismatch === true) {
    addError(errors, 'owner_evidence_completion_drill_source_audit_top_level_url_mismatch');
  }
  if (expectedOwnerEvidenceCompletionDrillSourceAuditCoverage.networkFetch !== true) {
    addError(errors, 'owner_evidence_completion_drill_source_audit_network_fetch_not_enabled', {
      networkFetch: expectedOwnerEvidenceCompletionDrillSourceAuditCoverage.networkFetch,
    });
  }
  if (
    (expectedOwnerEvidenceCompletionDrillSourceAuditCoverage.fetchedSourceCount ?? 0) !==
    (expectedOwnerEvidenceCompletionDrillSourceAuditCoverage.sourceCount ?? 0)
  ) {
    addError(errors, 'owner_evidence_completion_drill_source_audit_incomplete_fetch_coverage', {
      fetchedSourceCount: expectedOwnerEvidenceCompletionDrillSourceAuditCoverage.fetchedSourceCount,
      sourceCount: expectedOwnerEvidenceCompletionDrillSourceAuditCoverage.sourceCount,
    });
  }
  if ((expectedOwnerEvidenceCompletionDrillSourceAuditCoverage.expectationCheckCount ?? 0) <= 0) {
    addError(errors, 'owner_evidence_completion_drill_source_audit_missing_expected_text_checks', {
      expectationCheckCount: expectedOwnerEvidenceCompletionDrillSourceAuditCoverage.expectationCheckCount,
    });
  }
  if (
    (expectedOwnerEvidenceCompletionDrillSourceAuditCoverage.expectedTextMatchCount ?? 0) !==
    (expectedOwnerEvidenceCompletionDrillSourceAuditCoverage.expectationCheckCount ?? 0)
  ) {
    addError(errors, 'owner_evidence_completion_drill_source_audit_expected_text_mismatch', {
      expectedTextMatchCount: expectedOwnerEvidenceCompletionDrillSourceAuditCoverage.expectedTextMatchCount,
      expectationCheckCount: expectedOwnerEvidenceCompletionDrillSourceAuditCoverage.expectationCheckCount,
    });
  }
  const manifestSourceUrls = collectManifestSourceUrls(launchEvidence);
  const sourceAuditUrls = expectedLaunchSourceAuditCoverage.sourceUrls;
  requireExact(errors, 'sourceAudit.sourceUrls', manifestSourceUrls, sourceAuditUrls);
  const liveProofRunPacketReferenceUrls =
    collectLiveProofRunPacketReferenceUrls(liveProofRunPacket);
  const liveProofRunPacketSourceAuditUrls = [
    ...new Set(expectedLiveProofRunPacketSourceAuditCoverage.sourceUrls || []),
  ].sort((a, b) => a.localeCompare(b));
  requireExact(
    errors,
    'liveProofRunPacketSourceAudit.sourceUrls',
    liveProofRunPacketReferenceUrls,
    liveProofRunPacketSourceAuditUrls,
  );
  const liveCloseoutReferenceUrls = collectLiveCloseoutReferenceUrls(liveCloseoutReadiness);
  const liveCloseoutAccessSourceAuditUrls = [
    ...new Set(expectedLiveCloseoutAccessSourceAuditCoverage.sourceUrls || []),
  ].sort((a, b) => a.localeCompare(b));
  requireExact(
    errors,
    'liveCloseoutAccessSourceAudit.sourceUrls',
    liveCloseoutReferenceUrls,
    liveCloseoutAccessSourceAuditUrls,
  );
  const manualWcagPacketReferenceUrls =
    collectManualWcagReviewPacketReferenceUrls(manualWcagReviewPacket);
  const manualWcagPacketSourceAuditUrls = [
    ...new Set(expectedManualWcagReviewPacketSourceAuditCoverage.sourceUrls || []),
  ].sort((a, b) => a.localeCompare(b));
  requireExact(
    errors,
    'manualWcagReviewPacketSourceAudit.sourceUrls',
    manualWcagPacketReferenceUrls,
    manualWcagPacketSourceAuditUrls,
  );
  const completionDrillOfficialReferenceUrls = [...(completionDrill.officialReferenceUrls || [])].sort((a, b) =>
    a.localeCompare(b),
  );
  const completionDrillSourceAuditUrls = [
    ...new Set(expectedOwnerEvidenceCompletionDrillSourceAuditCoverage.sourceUrls || []),
  ].sort((a, b) => a.localeCompare(b));
  requireExact(
    errors,
    'ownerEvidenceCompletionDrillSourceAudit.sourceUrls',
    completionDrillOfficialReferenceUrls,
    completionDrillSourceAuditUrls,
  );
  if (!Array.isArray(ownerHandoff.commandSequence) || ownerHandoff.commandSequence.length === 0) {
    addError(errors, 'handoff_missing_command_sequence');
  }
  if (!Array.isArray(ownerHandoff.ownerActionRows)) {
    addError(errors, 'handoff_missing_owner_action_rows');
  }
  if (
    expectedGateIds.length > 0 &&
    (!Array.isArray(remediationGates.ownerActionQueue) || remediationGates.ownerActionQueue.length === 0)
  ) {
    addError(errors, 'remediation_missing_owner_action_queue');
  } else if (Array.isArray(remediationGates.ownerActionQueue)) {
    remediationGates.ownerActionQueue.forEach((item) => {
      ['ownerAction', 'ownerPrepCommand', 'nextCommand', 'riskIfSkipped', 'sourceBoundary'].forEach((field) => {
        if (!item[field]) {
          addError(errors, `remediation_owner_action_missing_${field}`, { gateId: item.id });
        }
      });
      if (!Array.isArray(item.doesNotProve) || item.doesNotProve.length === 0) {
        addError(errors, 'remediation_owner_action_missing_does_not_prove', { gateId: item.id });
      }
    });
  }
  if (!Array.isArray(completionDrill.completionRows)) {
    addError(errors, 'completion_drill_missing_completion_rows');
  }
  if (!Array.isArray(completionDrill.packetSummaries) || completionDrill.packetSummaries.length === 0) {
    addError(errors, 'completion_drill_missing_packets');
  } else {
    const packetOfficialReferenceUrls = [
      ...new Set(completionDrill.packetSummaries.flatMap((packet) => packet.officialReferenceUrls || [])),
    ].sort((a, b) => a.localeCompare(b));
    completionDrill.packetSummaries.forEach((packet) => {
      if ((packet.officialReferenceCount ?? 0) <= 0) {
        addError(errors, 'completion_drill_packet_missing_official_references', {
          packetType: packet.packetType,
        });
      }
      if (!Array.isArray(packet.officialReferenceUrls) || packet.officialReferenceUrls.length !== packet.officialReferenceCount) {
        addError(errors, 'completion_drill_packet_official_reference_url_mismatch', {
          packetType: packet.packetType,
          officialReferenceCount: packet.officialReferenceCount ?? null,
          officialReferenceUrlCount: packet.officialReferenceUrls?.length ?? null,
        });
      }
    });
    requireExact(
      errors,
      'completionDrill.officialReferenceUrls',
      packetOfficialReferenceUrls,
      completionDrill.officialReferenceUrls || [],
    );
    requireExact(
      errors,
      'completionDrill.officialReferenceCount',
      packetOfficialReferenceUrls.length,
      completionDrill.officialReferenceCount ?? null,
    );
  }
  if (!Array.isArray(completionDrill.recommendedCommandOrder) || completionDrill.recommendedCommandOrder.length === 0) {
    addError(errors, 'completion_drill_missing_recommended_commands');
  }
  if (launchEvidence.launch_decision !== expectedDecision) {
    addError(errors, 'launch_decision_does_not_match_owner_gate_state', {
      launchDecision: launchEvidence.launch_decision,
      expectedDecision,
      expectedGateIds,
    });
  }
  if (expectedGateIds.length > 0 && launchEvidence.launch_decision !== 'pilot-only') {
    addError(errors, 'commercial_ready_overclaim_with_open_owner_gates', {
      launchDecision: launchEvidence.launch_decision,
      expectedGateIds,
    });
  }
  if (!String(state.evidenceBoundary || '').includes('does not upgrade the launch decision')) {
    addError(errors, 'state_missing_launch_decision_boundary');
  }
  if (!Array.isArray(state.doesNotProve) || !state.doesNotProve.some((item) => item.includes('commercial readiness'))) {
    addError(errors, 'state_missing_does_not_prove_commercial_readiness');
  }
  if (!String(state.proofBucketSummary?.evidenceBoundary || '').includes('does not prove')) {
    addError(errors, 'state_missing_proof_bucket_boundary');
  }
}

function validateMarkdown(errors, summary, markdownSource) {
  const state = summary.commercialReadinessState || {};
  const expectedReleaseGateCoverage = buildExpectedReleaseGateCoverage(summary);
  const expectedReleaseGateCoverageSummary =
    buildReleaseGateCoverageSummary(expectedReleaseGateCoverage);
  const gateList = (gateIds = []) => (gateIds.length ? gateIds.join(', ') : 'none');
  [
    '## Release Gate Coverage',
    '## Commercial Readiness State',
    `| Launch decision | \`${state.launchDecision}\` |`,
    `| Expected launch decision | \`${state.expectedLaunchDecision}\` |`,
    `| Alignment status | \`${state.alignmentStatus}\` |`,
    `| State source artifact | \`${state.sourceArtifact || ''}\` |`,
    `| State source artifacts | ${state.sourceArtifactCount ?? 0} |`,
    `| Release gate coverage status | \`${expectedReleaseGateCoverageSummary.status}\` |`,
    `| Release gates included | ${expectedReleaseGateCoverageSummary.includedGateCount} |`,
    `| Release gates not included | ${expectedReleaseGateCoverageSummary.notIncludedGateCount} |`,
    `| Release gates requiring separate proof | ${expectedReleaseGateCoverageSummary.requiredSeparateProofGateIds.length} |`,
    `| Release gate does-not-prove boundaries | ${expectedReleaseGateCoverageSummary.doesNotProveCount} |`,
    `| Release gate source trace rows | ${expectedReleaseGateCoverageSummary.sourceTraceCount} |`,
    RELEASE_GATE_COVERAGE_BOUNDARY,
    '### Release Gate Coverage State Summary',
    '#### Release Gate Coverage State Details',
    '#### Release Gate Coverage Source Trace',
    '#### Release Gate Coverage State Boundary',
    '#### Release Gate Coverage State Does Not Prove',
    RELEASE_GATE_COVERAGE_STATE_BOUNDARY,
    RELEASE_GATE_COVERAGE_SOURCE_TRACE_BOUNDARY,
    '## Post-Summary Launch-Readiness Alignment',
    'Verify final summary launch-readiness state aligns with owner/remediation ledgers',
    `Command: \`${EXPECTED_LAUNCH_READINESS_COMMAND}\``,
    `Execution order: \`${EXPECTED_LAUNCH_READINESS_EXECUTION_ORDER}\``,
    `Included in this invocation: ${markdownBool(summary.status === 'passed')}`,
    `Fixture verifier: \`${EXPECTED_LAUNCH_READINESS_FIXTURE_COMMAND}\``,
    EXPECTED_LAUNCH_READINESS_BOUNDARY,
    EXPECTED_LAUNCH_READINESS_FIXTURE_BOUNDARY,
    LAUNCH_EVIDENCE_JSON,
    OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON,
    OWNER_EVIDENCE_HANDOFF_JSON,
    OWNER_EVIDENCE_COMPLETION_DRILL_JSON,
    LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON,
    LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON,
    LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON,
    LIVE_CLOSEOUT_READINESS_JSON,
    MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_JSON,
    REMEDIATION_COMPLETION_AUDIT_JSON,
    REMEDIATION_EXTERNAL_GATES_JSON,
    COMMERCIAL_ARTIFACT_REDACTION_JSON,
    'A passed repo-local verification summary does not upgrade the launch decision',
    '### Launch Evidence Required Output Coverage',
    '#### Launch Score',
    '#### Outreach And Fix-Report Coverage',
    '#### Launch Evidence Blocker Source Trace',
    '### Launch Proof Bucket Coverage',
    '#### Launch Proof Bucket Trace',
    '### Owner Evidence Execution Coverage',
    '#### Owner Evidence Gate Trace',
    '#### Remediation Completion Source Trace',
    '#### Remediation External Gates Source Trace',
    '#### Owner Closeout Next Command Source Trace',
    '#### Owner Closeout Status Artifact Trace',
    '#### Owner Closeout Failed Step Source Trace',
    '#### Operational Access Source Trace',
    '#### Owner Handoff Command Source Trace',
    '#### Completion Drill Command Source Trace',
    '### Owner Action Queue Detail',
    '#### Owner Action Command Trace',
    '#### Owner Action Boundary Trace',
    '#### Owner Action Source Trace',
    '### Launch Source Audit Coverage',
    '#### Launch Source Trace',
    '### Commercial Evidence Intake Source Audit Coverage',
    '#### Commercial Evidence Intake Source Trace',
    '### Live Proof Run Packet Source Audit Coverage',
    '#### Live Proof Run Packet Source Trace',
    '### Live Closeout Access Source Audit Coverage',
    '#### Live Closeout Access Source Trace',
    '### Live Closeout Readiness Status',
    '#### Live Closeout Readiness Check Trace',
    '#### Live Closeout Readiness Next Action Source Trace',
    '#### Live Closeout Readiness Official Reference Source Trace',
    '### Manual WCAG Review Packet Source Audit Coverage',
    '#### Manual WCAG Review Packet Source Trace',
    '### Owner Evidence Completion Drill Source Audit Coverage',
    '#### Owner Evidence Completion Drill Source Trace',
    '### Post-Summary Artifact Redaction Summary',
    '#### Post-Summary Artifact Redaction Boundary',
    '#### Post-Summary Artifact Redaction Does Not Prove',
    '### Full-Local Approval Package Summary',
    '#### Full-Local Approval Command Trace',
    '#### Full-Local Approval Required Trace',
    '### Progress Updates',
    '### Bottleneck Log',
    '### Implementation Decisions',
    '### Rejected Variants',
    '### Code Optimization Reviews',
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_text', { expectedText });
    }
  });

  Object.entries(expectedReleaseGateCoverage)
    .filter(([gateId]) => gateId !== 'boundary')
    .forEach(([gateId, gate]) => {
      const expectedText = `| ${gateId} | \`${gate.command}\` | ${markdownBool(
        gate.includedInThisInvocation,
      )} | ${markdownBool(gate.passedInThisInvocation)} | ${gate.boundary || ''} |`;
      if (!markdownSource.includes(expectedText)) {
        addError(errors, 'markdown_missing_release_gate_coverage_row', {
          gateId,
          expectedText,
        });
      }
    });

  [
    `| Source artifact | \`${expectedReleaseGateCoverageSummary.sourceArtifact}\` |`,
    `| Status | \`${expectedReleaseGateCoverageSummary.status}\` |`,
    `| Gate count | ${expectedReleaseGateCoverageSummary.gateCount} |`,
    `| Included gates | ${gateList(expectedReleaseGateCoverageSummary.includedGateIds)} |`,
    `| Not included gates | ${gateList(expectedReleaseGateCoverageSummary.notIncludedGateIds)} |`,
    `| Passed gates | ${gateList(expectedReleaseGateCoverageSummary.passedGateIds)} |`,
    `| Separate proof required gates | ${gateList(
      expectedReleaseGateCoverageSummary.requiredSeparateProofGateIds,
    )} |`,
    `| Optional gates not included | ${gateList(
      expectedReleaseGateCoverageSummary.optionalNotIncludedGateIds,
    )} |`,
    `| Release gate state does-not-prove boundaries | ${expectedReleaseGateCoverageSummary.doesNotProveCount} |`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_release_gate_coverage_state_text', {
        expectedText,
      });
    }
  });

  Object.entries(expectedReleaseGateCoverageSummary.gates || {}).forEach(([gateId, gate]) => {
    const expectedText = `| ${gateId} | \`${gate.command}\` | ${markdownBool(
      gate.includedInThisInvocation,
    )} | ${markdownBool(gate.passedInThisInvocation)} | ${gate.boundary || ''} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_release_gate_coverage_state_row', {
        gateId,
        expectedText,
      });
    }
  });

  (expectedReleaseGateCoverageSummary.sourceTrace || []).forEach((row) => {
    const expectedText = `| ${row.gateId} | \`${row.command}\` | ${markdownBool(
      row.includedInThisInvocation,
    )} | ${markdownBool(row.passedInThisInvocation)} | ${markdownBool(
      row.optional,
    )} | ${markdownBool(row.separateProofRequired)} | ${row.sourceArtifact} | ${
      row.boundary || ''
    } |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_release_gate_source_trace_row', {
        gateId: row.gateId,
        expectedText,
      });
    }
  });

  (expectedReleaseGateCoverageSummary.doesNotProve || []).forEach((item) => {
    const expectedText = `| ${item} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_release_gate_coverage_state_boundary', {
        expectedText,
      });
    }
  });

  (state.ownerGateScoreboard?.remainingGateIds || []).forEach((gateId) => {
    if (!markdownSource.includes(gateId)) {
      addError(errors, 'markdown_missing_remaining_gate', { gateId });
    }
  });
  [
    `| Remaining owner/live gate source trace rows | ${
      state.ownerGateScoreboard?.remainingGateSourceTraceCount ?? 0
    } |`,
    `| Remediation completion source trace rows | ${
      state.remediationCompletion?.remainingExternalGateSourceTraceCount ?? 0
    } |`,
    `| Remediation external gate source trace rows | ${
      state.remediationExternalGates?.ownerActionGateSourceTraceCount ?? 0
    } |`,
    OWNER_GATE_SCOREBOARD_SOURCE_TRACE_BOUNDARY,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_owner_gate_scoreboard_source_trace_text', {
        expectedText,
      });
    }
  });
  (state.ownerGateScoreboard?.remainingGateSourceTrace || []).forEach((row) => {
    const sourceArtifacts = row.sourceArtifacts || {};
    const expectedText = `| ${row.gateId} | ${row.status || ''} | ${
      sourceArtifacts.scoreboard || ''
    } | ${sourceArtifacts.remediationCompletion || ''} | ${
      sourceArtifacts.remediationExternalGates || ''
    } | ${sourceArtifacts.closeoutStatus || ''} | ${sourceArtifacts.handoff || ''} | ${
      sourceArtifacts.completionDrill || ''
    } |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_owner_gate_scoreboard_source_trace_row', {
        gateId: row.gateId,
        expectedText,
      });
    }
  });
  [
    REMEDIATION_COMPLETION_SOURCE_TRACE_BOUNDARY,
    REMEDIATION_COMPLETION_EVIDENCE_BOUNDARY,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_remediation_completion_source_trace_text', {
        expectedText,
      });
    }
  });
  (state.remediationCompletion?.remainingExternalGateSourceTrace || []).forEach((row) => {
    const expectedText = `| ${row.gateId} | ${row.status || ''} | ${row.sourceArtifact || ''} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_remediation_completion_source_trace_row', {
        gateId: row.gateId,
        expectedText,
      });
    }
  });
  [
    REMEDIATION_EXTERNAL_GATES_SOURCE_TRACE_BOUNDARY,
    REMEDIATION_EXTERNAL_GATES_EVIDENCE_BOUNDARY,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_remediation_external_gate_source_trace_text', {
        expectedText,
      });
    }
  });
  (state.remediationExternalGates?.ownerActionGateSourceTrace || []).forEach((row) => {
    const expectedText = `| ${row.gateId} | ${row.status || ''} | ${row.sourceBoundary || ''} | ${
      row.sourceArtifact || ''
    } |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_remediation_external_gate_source_trace_row', {
        gateId: row.gateId,
        expectedText,
      });
    }
  });

  const launchEvidenceSummary = state.launchEvidenceSummary || {};
  const requiredOutputTableCounts = launchEvidenceSummary.requiredOutputTableCounts || {};
  [
    `| Overall | ${launchEvidenceSummary.scores?.overall ?? 'unknown'} |`,
    `| Pain points | ${launchEvidenceSummary.deliverableCounts?.painPointCount ?? 0} |`,
    `| Target customers | ${launchEvidenceSummary.deliverableCounts?.targetCustomerCount ?? 0} |`,
    `| CRM rows | ${launchEvidenceSummary.outreachCoverage?.crmExport?.rowCount ?? 0} |`,
    `| Unresolved blockers | ${launchEvidenceSummary.fixReportCoverage?.unresolvedBlockerCount ?? 0} |`,
    `| Launch evidence summary source trace rows | ${launchEvidenceSummary.sourceTraceCount ?? 0} |`,
    `| Launch blocker source trace rows | ${state.launchEvidence?.blockerSourceTraceCount ?? 0} |`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_launch_evidence_summary_text', { expectedText });
    }
  });
  [
    '#### Launch Evidence Summary Source Trace',
    LAUNCH_EVIDENCE_SUMMARY_SOURCE_TRACE_BOUNDARY,
    LAUNCH_EVIDENCE_SUMMARY_EVIDENCE_BOUNDARY,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_launch_evidence_summary_source_trace_text', {
        expectedText,
      });
    }
  });
  (launchEvidenceSummary.sourceTrace || []).forEach((row) => {
    const sourceArtifactText =
      Object.values(row.sourceArtifacts || {})
        .filter(Boolean)
        .join('<br>') || 'none';
    const expectedText = `| ${row.coverage || ''} | ${row.metricCount ?? 0} | ${
      row.sourceArtifactCount ?? 0
    } | ${sourceArtifactText} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_launch_evidence_summary_source_trace_row', {
        coverage: row.coverage,
        expectedText,
      });
    }
  });
  if (!markdownSource.includes('#### Required Output Table Counts')) {
    addError(errors, 'markdown_missing_required_output_table_counts_section');
  }
  Object.entries(requiredOutputTableCounts).forEach(([field, count]) => {
    const expectedText = `| ${field} | ${count} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_required_output_table_count', {
        field,
        count,
        expectedText,
      });
    }
  });
  [
    LAUNCH_EVIDENCE_BLOCKER_SOURCE_TRACE_BOUNDARY,
    LAUNCH_EVIDENCE_BLOCKER_EVIDENCE_BOUNDARY,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_launch_evidence_blocker_source_trace_text', {
        expectedText,
      });
    }
  });
  (state.launchEvidence?.blockerSourceTrace || []).forEach((row) => {
    const sourceArtifacts = row.sourceArtifacts || {};
    const expectedText = `| ${row.gateId} | ${row.status || ''} | ${row.severity || ''} | ${
      sourceArtifacts.launchGap || ''
    } | ${sourceArtifacts.unresolvedBlocker || ''} | ${
      sourceArtifacts.remediationCompletion || ''
    } | ${sourceArtifacts.remediationExternalGates || ''} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_launch_evidence_blocker_source_trace_row', {
        gateId: row.gateId,
        expectedText,
      });
    }
  });

  const liveCloseoutReadinessTraceCoverage = state.liveCloseoutReadinessCoverage || {};
  [
    `| Check source trace rows | ${liveCloseoutReadinessTraceCoverage.checkSourceTraceCount ?? 0} |`,
    `| Failed check source trace rows | ${
      liveCloseoutReadinessTraceCoverage.failedCheckSourceTraceCount ?? 0
    } |`,
    `| Next action source trace rows | ${
      liveCloseoutReadinessTraceCoverage.nextActionSourceTraceCount ?? 0
    } |`,
    `| Official reference source trace rows | ${
      liveCloseoutReadinessTraceCoverage.officialReferenceSourceTraceCount ?? 0
    } |`,
    liveCloseoutReadinessTraceCoverage.checkSourceArtifact || '',
    liveCloseoutReadinessTraceCoverage.nextActionSourceArtifact || '',
    liveCloseoutReadinessTraceCoverage.officialReferenceSourceArtifact || '',
    liveCloseoutReadinessTraceCoverage.sourceTraceBoundary || '',
  ].forEach((expectedText) => {
    if (expectedText && !markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_live_closeout_readiness_source_trace_text', {
        expectedText,
      });
    }
  });
  (liveCloseoutReadinessTraceCoverage.checkSourceTrace || []).forEach((row) => {
    const expectedText = `| ${row.id} | ${markdownBool(row.passed)} | ${row.message || ''} | ${
      row.sourceArtifact || ''
    } |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_live_closeout_readiness_check_source_trace_row', {
        checkId: row.id,
        expectedText,
      });
    }
  });
  (liveCloseoutReadinessTraceCoverage.nextActionSourceTrace || []).forEach((row) => {
    const expectedText = `| ${row.order} | ${row.action || ''} | ${row.sourceArtifact || ''} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_live_closeout_readiness_next_action_source_trace_row', {
        order: row.order,
        expectedText,
      });
    }
  });
  (liveCloseoutReadinessTraceCoverage.officialReferenceSourceTrace || []).forEach((row) => {
    const expectedText = `| ${row.id} | ${row.url || ''} | ${
      (row.appliesTo || []).join('<br>') || 'none'
    } | ${row.sourceArtifact || ''} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_live_closeout_readiness_reference_source_trace_row', {
        referenceId: row.id,
        expectedText,
      });
    }
  });

  const ownerExecutionSummary = state.ownerEvidenceExecutionSummary || {};
  const ownerLocalSafetyStatusSummary =
    ownerExecutionSummary.localSafetyStatusSummary || {};
  const postSummaryArtifactRedactionSummary =
    state.postSummaryArtifactRedactionSummary || {};
  const postSummaryLaunchReadinessAlignmentSummary =
    state.postSummaryLaunchReadinessAlignmentSummary || {};
  const postSummaryLaunchEvidenceRefreshSummary =
    state.postSummaryLaunchEvidenceRefreshSummary || {};
  const fullLocalApprovalPackageSummary = state.fullLocalApprovalPackageSummary || {};
  function requirePostSummaryCommandSourceTraceMarkdown(summary, heading, errorType) {
    [heading, `| Source trace rows | ${summary.sourceTraceCount ?? 0} |`, summary.sourceTraceBoundary || '']
      .filter(Boolean)
      .forEach((expectedText) => {
        if (!markdownSource.includes(expectedText)) {
          addError(errors, errorType, { expectedText });
        }
      });

    (summary.sourceTrace || []).forEach((row) => {
      const expectedText = `| ${row.key || ''} | ${row.value || ''} | ${
        row.sourceArtifact || ''
      } | ${row.boundary || ''} |`;
      if (!markdownSource.includes(expectedText)) {
        addError(errors, `${errorType}_row`, {
          key: row.key,
          expectedText,
        });
      }
    });
  }

  function markdownSection(heading) {
    const start = markdownSource.indexOf(heading);
    if (start === -1) return '';
    const afterHeadingStart = start + heading.length;
    const nextSectionOffset = markdownSource.slice(afterHeadingStart).search(/\n### /);
    if (nextSectionOffset === -1) return markdownSource.slice(start);
    return markdownSource.slice(start, afterHeadingStart + nextSectionOffset);
  }

  function topLevelMarkdownSection(heading) {
    const start = markdownSource.indexOf(heading);
    if (start === -1) return '';
    const nextSectionStart = markdownSource.indexOf('\n## ', start + heading.length);
    if (nextSectionStart === -1) return markdownSource.slice(start);
    return markdownSource.slice(start, nextSectionStart);
  }

  const rootCountsSection = topLevelMarkdownSection('## Counts');
  [
    `| Step result rows | ${summary.stepCount ?? 0} |`,
    `| Failed step IDs | ${(summary.failedSteps || []).length} |`,
    `| Does-not-prove boundaries | ${summary.doesNotProveCount ?? 0} |`,
  ].forEach((expectedText) => {
    if (!rootCountsSection.includes(expectedText)) {
      addError(errors, 'markdown_missing_root_counts_text', { expectedText });
    }
  });

  [
    `| Handoff commands | ${ownerExecutionSummary.handoffCoverage?.commandSequenceCount ?? 0} |`,
    `| Handoff command source trace rows | ${
      ownerExecutionSummary.handoffCoverage?.commandSequenceSourceTraceCount ?? 0
    } |`,
    `| Owner prep by-gate entries | ${
      ownerExecutionSummary.ownerPrepActionNeededByGateCoverage?.ownerPrepActionNeededGateCount ?? 0
    } |`,
    `| Gate-scoped owner prep actions | ${
      ownerExecutionSummary.ownerPrepActionNeededByGateCoverage?.gateScopedOwnerPrepActionCount ?? 0
    } |`,
    `| Unique owner prep actions | ${
      ownerExecutionSummary.ownerPrepActionNeededByGateCoverage?.uniqueOwnerPrepActionNeededCount ?? 0
    } |`,
    `| Shared owner prep actions | ${
      ownerExecutionSummary.ownerPrepActionNeededByGateCoverage?.sharedOwnerPrepActionCount ?? 0
    } |`,
    `| Operational access prerequisites | ${
      ownerExecutionSummary.operationalAccessPrerequisiteSummary?.prerequisiteCount ?? 0
    } |`,
    `| Operational access blocking checks | ${
      ownerExecutionSummary.operationalAccessPrerequisiteSummary?.blockingCheckCount ?? 0
    } |`,
    `| Operational access source trace rows | ${
      ownerExecutionSummary.operationalAccessPrerequisiteSummary?.sourceTraceCount ?? 0
    } |`,
    `| Operational access source artifacts | ${
      ownerExecutionSummary.operationalAccessPrerequisiteSummary?.sourceArtifactCount ?? 0
    } |`,
    `| Operational access blocking check source anchors | ${
      ownerExecutionSummary.operationalAccessPrerequisiteSummary?.sourceTraceBlockingCheckCount ?? 0
    } |`,
    `| Local safety status | \`${ownerLocalSafetyStatusSummary.status || 'unknown'}\` |`,
    `| Local safety protected paths ignored | ${
      ownerLocalSafetyStatusSummary.ignoredProtectedPathCount ?? 0
    }/${ownerLocalSafetyStatusSummary.protectedPathCount ?? 0} |`,
    `| Local safety source trace rows | ${ownerLocalSafetyStatusSummary.sourceTraceCount ?? 0} |`,
    `| Local safety source artifacts | ${
      ownerLocalSafetyStatusSummary.sourceArtifactCount ?? 0
    } |`,
    `| Handoff local safety aligned | ${markdownBool(
      ownerLocalSafetyStatusSummary.handoffStatusMatchesLocalSafety,
    )} |`,
    `| Completion-drill local safety aligned | ${markdownBool(
      ownerLocalSafetyStatusSummary.completionDrillStatusMatchesLocalSafety,
    )} |`,
    `| Completion-drill recommended commands | ${
      ownerExecutionSummary.completionDrillCoverage?.recommendedCommandCount ?? 0
    } |`,
    `| Completion-drill command source trace rows | ${
      ownerExecutionSummary.completionDrillCoverage?.recommendedCommandOrderSourceTraceCount ?? 0
    } |`,
    `| Completion-drill packets | ${ownerExecutionSummary.completionDrillCoverage?.packetCount ?? 0} |`,
    `| Completion-drill official reference URLs | ${
      ownerExecutionSummary.completionDrillCoverage?.officialReferenceCount ?? 0
    } |`,
    `| Completion-drill matrix rows | ${ownerExecutionSummary.completionDrillCoverage?.matrixRowCount ?? 0} |`,
    `| Failed closeout steps | ${ownerExecutionSummary.closeoutCoverage?.failedStepCount ?? 0} |`,
    `| Failed closeout source trace rows | ${
      ownerExecutionSummary.closeoutCoverage?.failedStepSourceTraceCount ?? 0
    } |`,
    `| Failed closeout source artifact | \`${
      ownerExecutionSummary.closeoutCoverage?.failedStepSourceArtifact || ''
    }\` |`,
    `| Failed closeout command anchors | ${
      ownerExecutionSummary.closeoutCoverage?.failedStepSourceTraceCommandCount ?? 0
    } |`,
    `| Closeout next command keys | ${
      ownerExecutionSummary.closeoutCoverage?.nextCommandCount ?? 0
    } |`,
    `| Closeout next command values | ${
      ownerExecutionSummary.closeoutCoverage?.nextCommandValueCount ?? 0
    } |`,
    `| Closeout next command source trace rows | ${
      ownerExecutionSummary.closeoutCoverage?.nextCommandSourceTraceCount ?? 0
    } |`,
    `| Closeout status artifacts | ${
      ownerExecutionSummary.closeoutCoverage?.statusArtifactCount ?? 0
    } |`,
    `| Closeout status artifact trace rows | ${
      ownerExecutionSummary.closeoutCoverage?.statusArtifactSourceTraceCount ?? 0
    } |`,
    ownerExecutionSummary.closeoutCoverage?.failedStepSourceTraceBoundary || '',
    ownerExecutionSummary.closeoutCoverage?.nextCommandSourceTraceBoundary || '',
    ownerExecutionSummary.operationalAccessPrerequisiteSummary?.sourceArtifacts?.handoff || '',
    ownerExecutionSummary.operationalAccessPrerequisiteSummary?.sourceArtifacts?.completionDrill || '',
    ownerExecutionSummary.operationalAccessPrerequisiteSummary?.sourceArtifacts?.liveCloseoutReadiness || '',
    ownerExecutionSummary.operationalAccessPrerequisiteSummary?.sourceTraceBoundary || '',
    '#### Owner Local Safety Source Trace',
    ownerLocalSafetyStatusSummary.sourceArtifacts?.localSafety || '',
    ownerLocalSafetyStatusSummary.sourceArtifacts?.handoff || '',
    ownerLocalSafetyStatusSummary.sourceArtifacts?.completionDrill || '',
    ownerLocalSafetyStatusSummary.sourceTraceBoundary || '',
    ownerLocalSafetyStatusSummary.boundary || '',
    ownerExecutionSummary.handoffCoverage?.commandSequenceSourceArtifact || '',
    ownerExecutionSummary.completionDrillCoverage?.recommendedCommandOrderSourceArtifact || '',
    ownerExecutionSummary.commandSequenceSourceTraceBoundary || '',
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_owner_evidence_execution_text', { expectedText });
    }
  });
  (ownerExecutionSummary.operationalAccessPrerequisiteSummary?.prerequisites || []).forEach(
    (prerequisite) => {
      [
        prerequisite.id,
        prerequisite.status,
        prerequisite.ownerPrepCommand,
        prerequisite.nextCommand,
        ...(prerequisite.blockingCheckIds || []),
      ]
        .filter(Boolean)
        .forEach((expectedText) => {
          if (!markdownSource.includes(expectedText)) {
            addError(errors, 'markdown_missing_operational_access_prerequisite_text', {
              prerequisiteId: prerequisite.id,
              expectedText,
            });
          }
        });
    },
  );
  (ownerExecutionSummary.operationalAccessPrerequisiteSummary?.sourceTrace || []).forEach((row) => {
    const sourceArtifacts = row.sourceArtifacts || {};
    const expectedText = `| ${row.id} | ${sourceArtifacts.handoff || ''} | ${
      sourceArtifacts.completionDrill || ''
    } | ${sourceArtifacts.liveCloseoutReadiness || ''} | ${
      (sourceArtifacts.blockingChecks || []).join('<br>') || 'none'
    } |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_operational_access_source_trace_row', {
        prerequisiteId: row.id,
        expectedText,
      });
    }
  });
  (ownerLocalSafetyStatusSummary.sourceTrace || []).forEach((row) => {
    const expectedText = `| ${row.key} | ${row.value || ''} | ${row.sourceArtifact || ''} | ${
      row.handoffSourceArtifact || ''
    } | ${row.completionDrillSourceArtifact || ''} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_owner_local_safety_source_trace_row', {
        key: row.key,
        expectedText,
      });
    }
  });
  (ownerExecutionSummary.closeoutCoverage?.failedStepSourceTrace || []).forEach((step) => {
    const expectedText = `| ${step.id} | ${step.status || ''} | ${step.command || ''} | ${
      step.sourceArtifact || ''
    } |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_owner_closeout_failed_step_source_trace_row', {
        stepId: step.id,
        expectedText,
      });
    }
  });
  (ownerExecutionSummary.closeoutCoverage?.nextCommandSourceTrace || []).forEach((row) => {
    const expectedText = `| ${row.key} | ${
      (row.commands || []).join('<br>') || 'none'
    } | ${row.commandCount ?? 0} | ${row.sourceArtifact || ''} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_owner_closeout_next_command_source_trace_row', {
        key: row.key,
        expectedText,
      });
    }
  });
  (ownerExecutionSummary.closeoutCoverage?.statusArtifactSourceTrace || []).forEach((row) => {
    const expectedText = `| ${row.key} | ${row.artifactPath || ''} | ${row.sourceArtifact || ''} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_owner_closeout_status_artifact_source_trace_row', {
        key: row.key,
        expectedText,
      });
    }
  });
  (ownerExecutionSummary.handoffCoverage?.commandSequenceSourceTrace || []).forEach((row) => {
    const expectedText = `| ${row.order} | ${row.command} | ${row.sourceArtifact} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_owner_handoff_command_source_trace_row', {
        order: row.order,
        expectedText,
      });
    }
  });
  (ownerExecutionSummary.completionDrillCoverage?.recommendedCommandOrderSourceTrace || []).forEach((row) => {
    const expectedText = `| ${row.order} | ${row.command} | ${row.sourceArtifact} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_completion_drill_command_source_trace_row', {
        order: row.order,
        expectedText,
      });
    }
  });

  const ownerActionSourceTraceSummary = state.ownerActionQueueSummary || {};
  [
    `| Closeout rows | ${ownerActionSourceTraceSummary.closeoutQueueCount ?? 0} |`,
    `| Completion-drill rows | ${ownerActionSourceTraceSummary.completionDrillRowCount ?? 0} |`,
    `| Primary source artifact | \`${ownerActionSourceTraceSummary.sourceArtifact || ''}\` |`,
    `| Source artifacts | ${ownerActionSourceTraceSummary.sourceArtifactCount ?? 0} |`,
    `| Row source artifacts | ${ownerActionSourceTraceSummary.rowSourceArtifactCount ?? 0} |`,
    `| Owner action source trace rows | ${ownerActionSourceTraceSummary.sourceTraceCount ?? 0} |`,
    OWNER_ACTION_QUEUE_SOURCE_TRACE_BOUNDARY,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_owner_action_source_trace_text', { expectedText });
    }
  });
  (ownerActionSourceTraceSummary.sourceTrace || []).forEach((row) => {
    const sourceArtifacts = row.sourceArtifacts || {};
    const expectedText = `| ${row.gateId} | ${sourceArtifacts.remediationExternalGates || ''} | ${
      sourceArtifacts.closeoutStatus || ''
    } | ${sourceArtifacts.handoff || ''} | ${sourceArtifacts.completionDrill || ''} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_owner_action_source_trace_row', {
        gateId: row.gateId,
        expectedText,
      });
    }
  });

  [
    `| Post-summary redaction status | \`${postSummaryArtifactRedactionSummary.status || 'unknown'}\` |`,
    `| Post-summary redaction included | ${markdownBool(
      postSummaryArtifactRedactionSummary.includedInThisInvocation,
    )} |`,
    `| Post-summary redaction artifacts | ${
      Object.keys(postSummaryArtifactRedactionSummary.resultArtifacts || {}).length
    } |`,
    `| Post-summary redaction does-not-prove boundaries | ${postSummaryArtifactRedactionSummary.doesNotProveCount ?? 0} |`,
    `| Source artifact | \`${postSummaryArtifactRedactionSummary.sourceArtifact || ''}\` |`,
    `| Status | \`${postSummaryArtifactRedactionSummary.status || 'unknown'}\` |`,
    `| Command | \`${postSummaryArtifactRedactionSummary.command || ''}\` |`,
    `| Result JSON | \`${postSummaryArtifactRedactionSummary.resultArtifacts?.json || ''}\` |`,
    `| Result Markdown | \`${postSummaryArtifactRedactionSummary.resultArtifacts?.markdown || ''}\` |`,
    `| Alignment verifier | \`${postSummaryArtifactRedactionSummary.alignmentVerifier?.command || ''}\` |`,
    `| Fixture verifier | \`${postSummaryArtifactRedactionSummary.fixtureVerifier?.command || ''}\` |`,
    `| Source trace rows | ${postSummaryArtifactRedactionSummary.sourceTraceCount ?? 0} |`,
    `| Does-not-prove boundaries | ${postSummaryArtifactRedactionSummary.doesNotProveCount ?? 0} |`,
    POST_SUMMARY_ARTIFACT_REDACTION_BOUNDARY,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_post_summary_artifact_redaction_text', {
        expectedText,
      });
    }
  });
  requirePostSummaryCommandSourceTraceMarkdown(
    postSummaryArtifactRedactionSummary,
    '#### Post-Summary Artifact Redaction Source Trace',
    'markdown_missing_post_summary_artifact_redaction_source_trace',
  );

  (postSummaryArtifactRedactionSummary.doesNotProve || []).forEach((item) => {
    const expectedText = `| ${item} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_post_summary_artifact_redaction_boundary', {
        expectedText,
      });
    }
  });

  [
    `| Post-summary launch-readiness alignment status | \`${postSummaryLaunchReadinessAlignmentSummary.status || 'unknown'}\` |`,
    `| Post-summary launch-readiness alignment included | ${markdownBool(
      postSummaryLaunchReadinessAlignmentSummary.includedInThisInvocation,
    )} |`,
    `| Post-summary launch-readiness alignment fixture | \`${postSummaryLaunchReadinessAlignmentSummary.fixtureVerifier?.command || ''}\` |`,
    `| Post-summary launch-readiness alignment does-not-prove boundaries | ${postSummaryLaunchReadinessAlignmentSummary.doesNotProveCount ?? 0} |`,
    `| Source artifact | \`${postSummaryLaunchReadinessAlignmentSummary.sourceArtifact || ''}\` |`,
    `| Status | \`${postSummaryLaunchReadinessAlignmentSummary.status || 'unknown'}\` |`,
    `| Command | \`${postSummaryLaunchReadinessAlignmentSummary.command || ''}\` |`,
    `| Execution order | \`${postSummaryLaunchReadinessAlignmentSummary.executionOrder || ''}\` |`,
    `| Fixture verifier | \`${postSummaryLaunchReadinessAlignmentSummary.fixtureVerifier?.command || ''}\` |`,
    `| Fixture execution order | \`${postSummaryLaunchReadinessAlignmentSummary.fixtureVerifier?.executionOrder || ''}\` |`,
    `| Source trace rows | ${postSummaryLaunchReadinessAlignmentSummary.sourceTraceCount ?? 0} |`,
    `| Does-not-prove boundaries | ${postSummaryLaunchReadinessAlignmentSummary.doesNotProveCount ?? 0} |`,
    EXPECTED_LAUNCH_READINESS_BOUNDARY,
    EXPECTED_LAUNCH_READINESS_FIXTURE_BOUNDARY,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_post_summary_launch_readiness_alignment_text', {
        expectedText,
      });
    }
  });
  requirePostSummaryCommandSourceTraceMarkdown(
    postSummaryLaunchReadinessAlignmentSummary,
    '#### Post-Summary Launch-Readiness Alignment Source Trace',
    'markdown_missing_post_summary_launch_readiness_alignment_source_trace',
  );

  (postSummaryLaunchReadinessAlignmentSummary.doesNotProve || []).forEach((item) => {
    const expectedText = `| ${item} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_post_summary_launch_readiness_alignment_boundary', {
        expectedText,
      });
    }
  });

  const topLevelPostSummaryLaunchReadinessAlignment =
    summary.postSummaryLaunchReadinessAlignment || {};
  [
    `Source artifact: \`${topLevelPostSummaryLaunchReadinessAlignment.sourceArtifact || ''}\``,
    `Status: \`${topLevelPostSummaryLaunchReadinessAlignment.status || 'unknown'}\``,
    `Source trace rows: ${topLevelPostSummaryLaunchReadinessAlignment.sourceTraceCount ?? 0}`,
    `Does-not-prove boundaries: ${topLevelPostSummaryLaunchReadinessAlignment.doesNotProveCount ?? 0}`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_top_level_post_summary_launch_readiness_alignment_text', {
        expectedText,
      });
    }
  });
  requirePostSummaryCommandSourceTraceMarkdown(
    topLevelPostSummaryLaunchReadinessAlignment,
    '### Post-Summary Launch-Readiness Alignment Appendix Source Trace',
    'markdown_missing_top_level_post_summary_launch_readiness_alignment_source_trace',
  );

  (topLevelPostSummaryLaunchReadinessAlignment.doesNotProve || []).forEach((item) => {
    const expectedText = `| ${item} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(
        errors,
        'markdown_missing_top_level_post_summary_launch_readiness_alignment_boundary',
        {
          expectedText,
        },
      );
    }
  });

  [
    `| Post-summary launch evidence refresh status | \`${postSummaryLaunchEvidenceRefreshSummary.status || 'unknown'}\` |`,
    `| Post-summary launch evidence refresh included | ${markdownBool(
      postSummaryLaunchEvidenceRefreshSummary.includedInThisInvocation,
    )} |`,
    `| Post-summary launch evidence refresh artifacts | ${
      Object.keys(postSummaryLaunchEvidenceRefreshSummary.resultArtifacts || {}).length
    } |`,
    `| Post-summary launch evidence refresh does-not-prove boundaries | ${postSummaryLaunchEvidenceRefreshSummary.doesNotProveCount ?? 0} |`,
    `| Source artifact | \`${postSummaryLaunchEvidenceRefreshSummary.sourceArtifact || ''}\` |`,
    `| Status | \`${postSummaryLaunchEvidenceRefreshSummary.status || 'unknown'}\` |`,
    `| Command | \`${postSummaryLaunchEvidenceRefreshSummary.command || ''}\` |`,
    `| Execution order | \`${postSummaryLaunchEvidenceRefreshSummary.executionOrder || ''}\` |`,
    `| Result JSON | \`${postSummaryLaunchEvidenceRefreshSummary.resultArtifacts?.json || ''}\` |`,
    `| Result Markdown | \`${postSummaryLaunchEvidenceRefreshSummary.resultArtifacts?.markdown || ''}\` |`,
    `| Final summary rewrite required | ${markdownBool(
      postSummaryLaunchEvidenceRefreshSummary.finalSummaryRewrite?.required,
    )} |`,
    postSummaryLaunchEvidenceRefreshSummary.finalSummaryRewrite?.purpose || '',
    `| Source trace rows | ${postSummaryLaunchEvidenceRefreshSummary.sourceTraceCount ?? 0} |`,
    `| Does-not-prove boundaries | ${postSummaryLaunchEvidenceRefreshSummary.doesNotProveCount ?? 0} |`,
    POST_SUMMARY_LAUNCH_EVIDENCE_REFRESH_STATE_BOUNDARY,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_post_summary_launch_evidence_refresh_text', {
        expectedText,
      });
    }
  });
  requirePostSummaryCommandSourceTraceMarkdown(
    postSummaryLaunchEvidenceRefreshSummary,
    '#### Post-Summary Launch Evidence Refresh Source Trace',
    'markdown_missing_post_summary_launch_evidence_refresh_source_trace',
  );

  (postSummaryLaunchEvidenceRefreshSummary.doesNotProve || []).forEach((item) => {
    const expectedText = `| ${item} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_post_summary_launch_evidence_refresh_boundary', {
        expectedText,
      });
    }
  });

  [
    `| Full-local approval status | \`${fullLocalApprovalPackageSummary.status || 'unknown'}\` |`,
    `| Full-local execution approved | ${markdownBool(fullLocalApprovalPackageSummary.executionApproved)} |`,
    `| Full-local optional commands | ${
      Object.keys(fullLocalApprovalPackageSummary.optionalGateCommands || {}).length
    } |`,
    `| Source artifact | \`${fullLocalApprovalPackageSummary.sourceArtifact || ''}\` |`,
    `| Status | \`${fullLocalApprovalPackageSummary.status || 'unknown'}\` |`,
    `| Command | \`${fullLocalApprovalPackageSummary.command || ''}\` |`,
    `| Execution approved | ${markdownBool(fullLocalApprovalPackageSummary.executionApproved)} |`,
    `| Fixture verifier | \`${fullLocalApprovalPackageSummary.fixtureVerifier?.command || ''}\` |`,
    `| Source trace rows | ${fullLocalApprovalPackageSummary.sourceTraceCount ?? 0} |`,
    `| Does-not-prove boundaries | ${fullLocalApprovalPackageSummary.doesNotProveCount ?? 0} |`,
    FULL_LOCAL_APPROVAL_PACKAGE_BOUNDARY,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_full_local_approval_summary_text', { expectedText });
    }
  });
  const fullLocalApprovalSection = markdownSection('### Full-Local Approval Package Summary');
  const fullLocalDoesNotProveCountText = `| Does-not-prove boundaries | ${
    fullLocalApprovalPackageSummary.doesNotProveCount ?? 0
  } |`;
  if (!fullLocalApprovalSection.includes(fullLocalDoesNotProveCountText)) {
    addError(errors, 'markdown_missing_full_local_approval_summary_text', {
      expectedText: fullLocalDoesNotProveCountText,
    });
  }
  requirePostSummaryCommandSourceTraceMarkdown(
    fullLocalApprovalPackageSummary,
    '#### Full-Local Approval Source Trace',
    'markdown_missing_full_local_approval_source_trace',
  );

  Object.entries(fullLocalApprovalPackageSummary.optionalGateCommands || {}).forEach(
    ([gateId, command]) => {
      const expectedText = `| ${gateId} | \`${command}\` |`;
      if (!markdownSource.includes(expectedText)) {
        addError(errors, 'markdown_missing_full_local_approval_command', {
          gateId,
          expectedText,
        });
      }
    },
  );

  (fullLocalApprovalPackageSummary.approvalRequiredBefore || []).forEach((gateId) => {
    const expectedText = `| ${gateId} | approval required |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_full_local_approval_required_gate', {
        gateId,
        expectedText,
      });
    }
  });

  const sourceAuditCoverage = state.launchSourceAuditCoverage || {};
  const commercialEvidenceIntakeSourceAuditCoverage =
    state.commercialEvidenceIntakeSourceAuditCoverage || {};
  const liveProofRunPacketSourceAuditCoverage =
    state.liveProofRunPacketSourceAuditCoverage || {};
  const liveCloseoutAccessSourceAuditCoverage =
    state.liveCloseoutAccessSourceAuditCoverage || {};
  const liveCloseoutReadinessCoverage = state.liveCloseoutReadinessCoverage || {};
  const manualWcagReviewPacketSourceAuditCoverage =
    state.manualWcagReviewPacketSourceAuditCoverage || {};
  const ownerEvidenceCompletionDrillSourceAuditCoverage =
    state.ownerEvidenceCompletionDrillSourceAuditCoverage || {};
  const proofBucketSummary = state.proofBucketSummary || {};
  const ownerActionQueueSummary = state.ownerActionQueueSummary || {};
  [
    `| Queue rows | ${ownerActionQueueSummary.queueCount ?? 0} |`,
    `| Handoff rows | ${ownerActionQueueSummary.handoffRowCount ?? 0} |`,
    `| Primary source artifact | \`${ownerActionQueueSummary.sourceArtifact || ''}\` |`,
    `| Owner prep commands | ${ownerActionQueueSummary.ownerPrepCommandCount ?? 0} |`,
    `| Next commands | ${ownerActionQueueSummary.nextCommandCount ?? 0} |`,
    `| Raw-evidence policies | ${ownerActionQueueSummary.rawEvidencePolicyCount ?? 0} |`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_owner_action_queue_summary_text', { expectedText });
    }
  });

  (ownerActionQueueSummary.rows || []).forEach((row) => {
    [
      row.gateId,
      row.status,
      row.sourceArtifact,
      row.sourceBoundary,
      row.ownerPrepCommand,
      row.nextCommand,
      row.riskIfSkipped,
    ]
      .filter(Boolean)
      .forEach((expectedText) => {
        if (!markdownSource.includes(expectedText)) {
          addError(errors, 'markdown_missing_owner_action_queue_text', {
          gateId: row.gateId,
          expectedText,
        });
      }
    });
    const expectedCommandTraceRow = `| ${row.gateId} | ${row.status} | ${row.track || ''} | ${
      row.sourceArtifact || ''
    } | ${row.sourceBoundary} | ${row.ownerPrepCommand} | ${row.nextCommand} | ${
      row.blockingOwnerActionCount ?? 0
    } | ${row.closeoutFailureDetailCount ?? 0} |`;
    if (!markdownSource.includes(expectedCommandTraceRow)) {
      addError(errors, 'markdown_missing_owner_action_queue_command_trace_row', {
        gateId: row.gateId,
        expectedText: expectedCommandTraceRow,
      });
    }
  });

  [
    `| Buckets | ${proofBucketSummary.bucketCount ?? 0} |`,
    `| Items | ${proofBucketSummary.itemCount ?? 0} |`,
    `| Roadmap items | ${proofBucketSummary.roadmapItemCount ?? 0} |`,
    `| Repo artifact items | ${proofBucketSummary.repoArtifactItemCount ?? 0} |`,
    `| Candidate/shadow items | ${proofBucketSummary.candidateShadowItemCount ?? 0} |`,
    `| Source trace rows | ${proofBucketSummary.sourceTraceCount ?? 0} |`,
    `| Launch proof-bucket source trace rows | ${proofBucketSummary.sourceTraceCount ?? 0} |`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_proof_bucket_summary_text', { expectedText });
    }
  });

  (proofBucketSummary.bucketNames || []).forEach((bucketName) => {
    if (!markdownSource.includes(bucketName)) {
      addError(errors, 'markdown_missing_proof_bucket_name', { bucketName });
    }
  });

  (proofBucketSummary.items || []).forEach((item) => {
    if (item.label && !markdownSource.includes(item.label)) {
      addError(errors, 'markdown_missing_proof_bucket_item', { label: item.label });
    }
  });
  ['#### Launch Proof Bucket Source Trace', proofBucketSummary.sourceTraceBoundary || '']
    .filter(Boolean)
    .forEach((expectedText) => {
      if (!markdownSource.includes(expectedText)) {
        addError(errors, 'markdown_missing_proof_bucket_source_trace_text', { expectedText });
      }
    });
  (proofBucketSummary.sourceTrace || []).forEach((item) => {
    const expectedText = `| ${item.bucket} | ${item.index ?? ''} | ${item.label} | ${
      item.status
    } | ${item.sourceArtifact} | ${item.sourcePath} | ${item.boundary} |`;
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_proof_bucket_source_trace_row', {
        bucket: item.bucket,
        index: item.index,
        expectedText,
      });
    }
  });

  const requireSourceAuditTraceMarkdown = (coverage, errorType) => {
    [`| Source trace rows | ${coverage.sourceTraceCount ?? 0} |`, coverage.sourceTraceBoundary]
      .filter(Boolean)
      .forEach((expectedText) => {
        if (!markdownSource.includes(expectedText)) {
          addError(errors, errorType, { expectedText });
        }
      });
    (coverage.sourceTrace || []).forEach((row) => {
      const expectedText =
        `| ${row.id || ''} | ${row.url || ''} | ${row.status || ''} | ` +
        `${row.expectedTextMatchCount ?? 0}/${row.expectationCount ?? 0} | ` +
        `${row.sourceArtifact || ''} |`;
      if (!markdownSource.includes(expectedText)) {
        addError(errors, errorType, { sourceId: row.id, expectedText });
      }
    });
  };

  [
    `| Source URLs | ${sourceAuditCoverage.sourceCount ?? 'unknown'} |`,
    `| Failed sources | ${sourceAuditCoverage.failedCount ?? 'unknown'} |`,
    `| Expectation checks | ${sourceAuditCoverage.expectationCheckCount ?? 'unknown'} |`,
    `| Expected-text matches | ${sourceAuditCoverage.expectedTextMatchCount ?? 'unknown'} |`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_source_audit_coverage_text', { expectedText });
    }
  });

  requireSourceAuditTraceMarkdown(sourceAuditCoverage, 'markdown_missing_source_audit_source_trace');

  [
    `| FTC references | ${commercialEvidenceIntakeSourceAuditCoverage.sourceCount ?? 'unknown'} |`,
    `| Failed references | ${commercialEvidenceIntakeSourceAuditCoverage.failedCount ?? 'unknown'} |`,
    `| Unexpected references | ${
      commercialEvidenceIntakeSourceAuditCoverage.unexpectedReferenceCount ?? 'unknown'
    } |`,
    `| Expectation checks | ${
      commercialEvidenceIntakeSourceAuditCoverage.expectationCheckCount ?? 'unknown'
    } |`,
    `| Expected-text matches | ${
      commercialEvidenceIntakeSourceAuditCoverage.expectedTextMatchCount ?? 'unknown'
    } |`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_commercial_evidence_intake_source_audit_coverage_text', {
        expectedText,
      });
    }
  });

  (commercialEvidenceIntakeSourceAuditCoverage.sourceIds || []).forEach((sourceId, index) => {
    const url = (commercialEvidenceIntakeSourceAuditCoverage.sourceUrls || [])[index];
    [sourceId, url].filter(Boolean).forEach((expectedText) => {
      if (!markdownSource.includes(expectedText)) {
        addError(errors, 'markdown_missing_commercial_evidence_intake_source_audit_text', {
          sourceId,
          expectedText,
        });
      }
    });
  });
  requireSourceAuditTraceMarkdown(
    commercialEvidenceIntakeSourceAuditCoverage,
    'markdown_missing_commercial_evidence_intake_source_audit_source_trace',
  );

  [
    `| Stripe/Supabase/GitHub references | ${liveProofRunPacketSourceAuditCoverage.sourceCount ?? 'unknown'} |`,
    `| Failed references | ${liveProofRunPacketSourceAuditCoverage.failedCount ?? 'unknown'} |`,
    `| Unexpected references | ${
      liveProofRunPacketSourceAuditCoverage.unexpectedReferenceCount ?? 'unknown'
    } |`,
    `| Applies-to entries | ${liveProofRunPacketSourceAuditCoverage.appliesToCount ?? 'unknown'} |`,
    `| Expectation checks | ${
      liveProofRunPacketSourceAuditCoverage.expectationCheckCount ?? 'unknown'
    } |`,
    `| Expected-text matches | ${
      liveProofRunPacketSourceAuditCoverage.expectedTextMatchCount ?? 'unknown'
    } |`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_live_proof_run_packet_source_audit_coverage_text', {
        expectedText,
      });
    }
  });

  (liveProofRunPacketSourceAuditCoverage.sourceIds || []).forEach((sourceId, index) => {
    const url = (liveProofRunPacketSourceAuditCoverage.sourceUrls || [])[index];
    [sourceId, url].filter(Boolean).forEach((expectedText) => {
      if (!markdownSource.includes(expectedText)) {
        addError(errors, 'markdown_missing_live_proof_run_packet_source_audit_text', {
          sourceId,
          expectedText,
        });
      }
    });
  });
  requireSourceAuditTraceMarkdown(
    liveProofRunPacketSourceAuditCoverage,
    'markdown_missing_live_proof_run_packet_source_audit_source_trace',
  );

  [
    `| Supabase/GitHub access references | ${liveCloseoutAccessSourceAuditCoverage.sourceCount ?? 'unknown'} |`,
    `| Failed references | ${liveCloseoutAccessSourceAuditCoverage.failedCount ?? 'unknown'} |`,
    `| Unexpected references | ${
      liveCloseoutAccessSourceAuditCoverage.unexpectedReferenceCount ?? 'unknown'
    } |`,
    `| Applies-to entries | ${liveCloseoutAccessSourceAuditCoverage.appliesToCount ?? 'unknown'} |`,
    `| Expectation checks | ${
      liveCloseoutAccessSourceAuditCoverage.expectationCheckCount ?? 'unknown'
    } |`,
    `| Expected-text matches | ${
      liveCloseoutAccessSourceAuditCoverage.expectedTextMatchCount ?? 'unknown'
    } |`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_live_closeout_access_source_audit_coverage_text', {
        expectedText,
      });
    }
  });
  [
    `| Status | \`${liveCloseoutReadinessCoverage.status || 'unknown'}\` |`,
    `| Failed checks | ${liveCloseoutReadinessCoverage.failedCheckCount ?? 'unknown'} |`,
    `| Supabase target project visible | ${markdownBool(
      liveCloseoutReadinessCoverage.supabaseAccess?.targetProjectVisible,
    )} |`,
    `| Supabase functions API accessible | ${markdownBool(
      liveCloseoutReadinessCoverage.supabaseAccess?.functionsApiAccessible,
    )} |`,
    `| Mutates external state | ${markdownBool(liveCloseoutReadinessCoverage.mutatesExternalState)} |`,
    `| Prints secret values | ${markdownBool(liveCloseoutReadinessCoverage.printsSecretValues)} |`,
    `| Next actions | ${liveCloseoutReadinessCoverage.nextActionCount ?? 0} |`,
    `| Does-not-prove boundaries | ${liveCloseoutReadinessCoverage.doesNotProveCount ?? 0} |`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_live_closeout_readiness_coverage_text', { expectedText });
    }
  });

  (liveCloseoutAccessSourceAuditCoverage.sourceIds || []).forEach((sourceId, index) => {
    const url = (liveCloseoutAccessSourceAuditCoverage.sourceUrls || [])[index];
    [sourceId, url].filter(Boolean).forEach((expectedText) => {
      if (!markdownSource.includes(expectedText)) {
        addError(errors, 'markdown_missing_live_closeout_access_source_audit_text', {
          sourceId,
          expectedText,
        });
      }
    });
  });
  requireSourceAuditTraceMarkdown(
    liveCloseoutAccessSourceAuditCoverage,
    'markdown_missing_live_closeout_access_source_audit_source_trace',
  );

  [
    `| W3C/WAI references | ${manualWcagReviewPacketSourceAuditCoverage.sourceCount ?? 'unknown'} |`,
    `| Failed references | ${manualWcagReviewPacketSourceAuditCoverage.failedCount ?? 'unknown'} |`,
    `| Unexpected references | ${
      manualWcagReviewPacketSourceAuditCoverage.unexpectedReferenceCount ?? 'unknown'
    } |`,
    `| Checkpoint references | ${
      manualWcagReviewPacketSourceAuditCoverage.checkpointReferenceCount ?? 'unknown'
    } |`,
    `| Expectation checks | ${
      manualWcagReviewPacketSourceAuditCoverage.expectationCheckCount ?? 'unknown'
    } |`,
    `| Expected-text matches | ${
      manualWcagReviewPacketSourceAuditCoverage.expectedTextMatchCount ?? 'unknown'
    } |`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_manual_wcag_review_packet_source_audit_coverage_text', {
        expectedText,
      });
    }
  });

  (manualWcagReviewPacketSourceAuditCoverage.sourceIds || []).forEach((sourceId, index) => {
    const url = (manualWcagReviewPacketSourceAuditCoverage.sourceUrls || [])[index];
    [sourceId, url].filter(Boolean).forEach((expectedText) => {
      if (!markdownSource.includes(expectedText)) {
        addError(errors, 'markdown_missing_manual_wcag_review_packet_source_audit_text', {
          sourceId,
          expectedText,
        });
      }
    });
  });
  requireSourceAuditTraceMarkdown(
    manualWcagReviewPacketSourceAuditCoverage,
    'markdown_missing_manual_wcag_review_packet_source_audit_source_trace',
  );

  [
    `| Official references | ${ownerEvidenceCompletionDrillSourceAuditCoverage.sourceCount ?? 'unknown'} |`,
    `| Failed references | ${ownerEvidenceCompletionDrillSourceAuditCoverage.failedCount ?? 'unknown'} |`,
    `| Unexpected references | ${
      ownerEvidenceCompletionDrillSourceAuditCoverage.unexpectedReferenceCount ?? 'unknown'
    } |`,
    `| Top-level URL mismatch | ${markdownBool(
      ownerEvidenceCompletionDrillSourceAuditCoverage.topLevelUrlMismatch,
    )} |`,
    `| Expectation checks | ${
      ownerEvidenceCompletionDrillSourceAuditCoverage.expectationCheckCount ?? 'unknown'
    } |`,
    `| Expected-text matches | ${
      ownerEvidenceCompletionDrillSourceAuditCoverage.expectedTextMatchCount ?? 'unknown'
    } |`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_owner_evidence_completion_drill_source_audit_coverage_text', {
        expectedText,
      });
    }
  });

  (ownerEvidenceCompletionDrillSourceAuditCoverage.sourceKeys || []).forEach((sourceKey, index) => {
    const url = (ownerEvidenceCompletionDrillSourceAuditCoverage.sourceUrls || [])[index];
    [sourceKey, url].filter(Boolean).forEach((expectedText) => {
      if (!markdownSource.includes(expectedText)) {
        addError(errors, 'markdown_missing_owner_evidence_completion_drill_source_audit_text', {
          sourceKey,
          expectedText,
        });
      }
    });
  });
  requireSourceAuditTraceMarkdown(
    ownerEvidenceCompletionDrillSourceAuditCoverage,
    'markdown_missing_owner_evidence_completion_drill_source_audit_source_trace',
  );

  (state.progressUpdates || []).forEach((update) => {
    if (update.phase && !markdownSource.includes(update.phase)) {
      addError(errors, 'markdown_missing_progress_phase', { phase: update.phase });
    }
  });

  (state.bottleneckLog || []).forEach((entry) => {
    if (entry.root_cause && !markdownSource.includes(entry.root_cause)) {
      addError(errors, 'markdown_missing_bottleneck_root_cause', { rootCause: entry.root_cause });
    }
    if (entry.task_or_subtask && !markdownSource.includes(entry.task_or_subtask)) {
      addError(errors, 'markdown_missing_bottleneck_task', { taskOrSubtask: entry.task_or_subtask });
    }
  });

  (state.implementationDecisions || []).forEach((item) => {
    if (item.decision && !markdownSource.includes(item.decision)) {
      addError(errors, 'markdown_missing_implementation_decision', { decision: item.decision });
    }
  });

  (state.rejectedVariants || []).forEach((item) => {
    if (item.variant && !markdownSource.includes(item.variant)) {
      addError(errors, 'markdown_missing_rejected_variant', { variant: item.variant });
    }
  });

  (state.codeOptimizationReviews || []).forEach((item) => {
    if (item.target_task && !markdownSource.includes(item.target_task)) {
      addError(errors, 'markdown_missing_code_optimization_review', { targetTask: item.target_task });
    }
  });
}

function main() {
  const summary = readJson(SUMMARY_JSON);
  const markdownSource = read(SUMMARY_MD);
  const launchEvidence = readJson(LAUNCH_EVIDENCE_JSON);
  const sourceAudit = readJson(LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON);
  const commercialEvidenceIntakeSourceAudit = readJson(COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON);
  const liveProofRunPacket = readJson(LIVE_PROOF_RUN_PACKET_JSON);
  const liveProofRunPacketSourceAudit = readJson(LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON);
  const liveCloseoutAccessSourceAudit = readJson(LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON);
  const liveCloseoutReadiness = readJson(LIVE_CLOSEOUT_READINESS_JSON);
  const manualWcagReviewPacket = readJson(MANUAL_WCAG_REVIEW_PACKET_JSON);
  const manualWcagReviewPacketSourceAudit = readJson(MANUAL_WCAG_REVIEW_PACKET_SOURCE_AUDIT_JSON);
  const ownerEvidenceCompletionDrillSourceAudit = readJson(
    OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON,
  );
  const closeoutStatus = readJson(OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON);
  const ownerHandoff = readJson(OWNER_EVIDENCE_HANDOFF_JSON);
  const completionDrill = readJson(OWNER_EVIDENCE_COMPLETION_DRILL_JSON);
  const localSafety = readJson(OWNER_EVIDENCE_LOCAL_SAFETY_JSON);
  const completionAudit = readJson(REMEDIATION_COMPLETION_AUDIT_JSON);
  const remediationGates = readJson(REMEDIATION_EXTERNAL_GATES_JSON);
  const errors = [];

  validateState(
    errors,
    summary,
    launchEvidence,
    sourceAudit,
    commercialEvidenceIntakeSourceAudit,
    liveProofRunPacket,
    liveProofRunPacketSourceAudit,
    liveCloseoutAccessSourceAudit,
    liveCloseoutReadiness,
    manualWcagReviewPacket,
    manualWcagReviewPacketSourceAudit,
    ownerEvidenceCompletionDrillSourceAudit,
    closeoutStatus,
    ownerHandoff,
    completionDrill,
    localSafety,
    completionAudit,
    remediationGates,
  );
  validateMarkdown(errors, summary, markdownSource);
  validateRootSummaryCounts(errors, summary);
  validateOwnerCloseoutStatusCounts(errors, closeoutStatus);
  validateReleaseGateCoverage(errors, summary);
  validatePostSummaryLaunchReadinessMetadata(errors, summary);
  validatePostSummaryLaunchEvidenceRefreshMetadata(errors, summary);

  const result = {
    ok: errors.length === 0,
    sourceSummaryJson: SUMMARY_JSON,
    sourceSummaryMarkdown: SUMMARY_MD,
    sourceLaunchEvidence: LAUNCH_EVIDENCE_JSON,
    sourceLaunchEvidenceSourceAudit: LAUNCH_EVIDENCE_SOURCE_AUDIT_JSON,
    sourceCommercialEvidenceIntakeSourceAudit: COMMERCIAL_EVIDENCE_INTAKE_SOURCE_AUDIT_JSON,
    sourceLiveProofRunPacket: LIVE_PROOF_RUN_PACKET_JSON,
    sourceLiveProofRunPacketSourceAudit: LIVE_PROOF_RUN_PACKET_SOURCE_AUDIT_JSON,
    sourceLiveCloseoutAccessSourceAudit: LIVE_CLOSEOUT_ACCESS_SOURCE_AUDIT_JSON,
    sourceLiveCloseoutReadiness: LIVE_CLOSEOUT_READINESS_JSON,
    sourceManualWcagReviewPacket: MANUAL_WCAG_REVIEW_PACKET_JSON,
    sourceOwnerEvidenceCompletionDrillSourceAudit:
      OWNER_EVIDENCE_COMPLETION_DRILL_SOURCE_AUDIT_JSON,
    sourceOwnerCloseoutStatus: OWNER_EVIDENCE_CLOSEOUT_STATUS_JSON,
    sourceOwnerEvidenceHandoff: OWNER_EVIDENCE_HANDOFF_JSON,
    sourceOwnerEvidenceCompletionDrill: OWNER_EVIDENCE_COMPLETION_DRILL_JSON,
    sourceRemediationCompletionAudit: REMEDIATION_COMPLETION_AUDIT_JSON,
    sourceRemediationExternalGates: REMEDIATION_EXTERNAL_GATES_JSON,
    launchDecision: summary.commercialReadinessState?.launchDecision || null,
    expectedLaunchDecision: summary.commercialReadinessState?.expectedLaunchDecision || null,
    remainingGateIds: summary.commercialReadinessState?.ownerGateScoreboard?.remainingGateIds || [],
    releaseGateCoverageSummary:
      summary.commercialReadinessState?.releaseGateCoverageSummary || null,
    postSummaryLaunchReadinessAlignmentSummary: {
      sourceArtifact:
        summary.postSummaryLaunchReadinessAlignment?.sourceArtifact ||
        null,
      status: summary.postSummaryLaunchReadinessAlignment?.status || null,
      command: summary.postSummaryLaunchReadinessAlignment?.command || null,
      executionOrder: summary.postSummaryLaunchReadinessAlignment?.executionOrder || null,
      includedInThisInvocation:
        summary.postSummaryLaunchReadinessAlignment?.includedInThisInvocation ?? null,
      fixtureVerifierCommand:
        summary.postSummaryLaunchReadinessAlignment?.fixtureVerifier?.command || null,
      fixtureVerifierExecutionOrder:
        summary.postSummaryLaunchReadinessAlignment?.fixtureVerifier?.executionOrder || null,
      sourceTraceCount:
        summary.postSummaryLaunchReadinessAlignment?.sourceTraceCount ?? null,
    },
    postSummaryLaunchReadinessAlignmentStateSummary: {
      status:
        summary.commercialReadinessState?.postSummaryLaunchReadinessAlignmentSummary?.status ||
        null,
      command:
        summary.commercialReadinessState?.postSummaryLaunchReadinessAlignmentSummary?.command ||
        null,
      executionOrder:
        summary.commercialReadinessState?.postSummaryLaunchReadinessAlignmentSummary
          ?.executionOrder || null,
      includedInThisInvocation:
        summary.commercialReadinessState?.postSummaryLaunchReadinessAlignmentSummary
          ?.includedInThisInvocation ?? null,
      fixtureVerifierCommand:
        summary.commercialReadinessState?.postSummaryLaunchReadinessAlignmentSummary
          ?.fixtureVerifier?.command || null,
      fixtureVerifierExecutionOrder:
        summary.commercialReadinessState?.postSummaryLaunchReadinessAlignmentSummary
          ?.fixtureVerifier?.executionOrder || null,
    },
    postSummaryLaunchEvidenceRefreshStateSummary: {
      status:
        summary.commercialReadinessState?.postSummaryLaunchEvidenceRefreshSummary?.status || null,
      command:
        summary.commercialReadinessState?.postSummaryLaunchEvidenceRefreshSummary?.command || null,
      executionOrder:
        summary.commercialReadinessState?.postSummaryLaunchEvidenceRefreshSummary?.executionOrder ||
        null,
      includedInThisInvocation:
        summary.commercialReadinessState?.postSummaryLaunchEvidenceRefreshSummary
          ?.includedInThisInvocation ?? null,
      resultArtifacts:
        summary.commercialReadinessState?.postSummaryLaunchEvidenceRefreshSummary?.resultArtifacts ||
        {},
    },
    progressUpdateCount: summary.commercialReadinessState?.progressUpdates?.length || 0,
    bottleneckLogCount: summary.commercialReadinessState?.bottleneckLog?.length || 0,
    implementationDecisionCount: summary.commercialReadinessState?.implementationDecisions?.length || 0,
    rejectedVariantCount: summary.commercialReadinessState?.rejectedVariants?.length || 0,
    codeOptimizationReviewCount: summary.commercialReadinessState?.codeOptimizationReviews?.length || 0,
    launchEvidenceSummary: {
      sourceArtifact: summary.commercialReadinessState?.launchEvidenceSummary?.sourceArtifact || null,
      sourceArtifactCount:
        summary.commercialReadinessState?.launchEvidenceSummary?.sourceArtifactCount ?? null,
      sourceTraceCount:
        summary.commercialReadinessState?.launchEvidenceSummary?.sourceTraceCount ?? null,
      scores: summary.commercialReadinessState?.launchEvidenceSummary?.scores || {},
      deliverableCounts: summary.commercialReadinessState?.launchEvidenceSummary?.deliverableCounts || {},
      requiredOutputTableCounts:
        summary.commercialReadinessState?.launchEvidenceSummary?.requiredOutputTableCounts || {},
      outreachCoverage: summary.commercialReadinessState?.launchEvidenceSummary?.outreachCoverage || {},
      fixReportCoverage: summary.commercialReadinessState?.launchEvidenceSummary?.fixReportCoverage || {},
    },
    proofBucketSummary: {
      sourceArtifact: summary.commercialReadinessState?.proofBucketSummary?.sourceArtifact || null,
      sourceArtifactCount:
        summary.commercialReadinessState?.proofBucketSummary?.sourceArtifactCount ?? null,
      sourceTraceCount:
        summary.commercialReadinessState?.proofBucketSummary?.sourceTraceCount ?? null,
      bucketNames: summary.commercialReadinessState?.proofBucketSummary?.bucketNames || [],
      bucketCount: summary.commercialReadinessState?.proofBucketSummary?.bucketCount ?? null,
      itemCount: summary.commercialReadinessState?.proofBucketSummary?.itemCount ?? null,
      countsByBucket: summary.commercialReadinessState?.proofBucketSummary?.countsByBucket || {},
      roadmapItemCount: summary.commercialReadinessState?.proofBucketSummary?.roadmapItemCount ?? null,
      candidateShadowItemCount:
        summary.commercialReadinessState?.proofBucketSummary?.candidateShadowItemCount ?? null,
      repoArtifactItemCount: summary.commercialReadinessState?.proofBucketSummary?.repoArtifactItemCount ?? null,
    },
    launchSourceAuditCoverage: {
      allPassed: summary.commercialReadinessState?.launchSourceAuditCoverage?.allPassed ?? null,
      networkFetch: summary.commercialReadinessState?.launchSourceAuditCoverage?.networkFetch ?? null,
      sourceCount: summary.commercialReadinessState?.launchSourceAuditCoverage?.sourceCount ?? null,
      passedCount: summary.commercialReadinessState?.launchSourceAuditCoverage?.passedCount ?? null,
      failedCount: summary.commercialReadinessState?.launchSourceAuditCoverage?.failedCount ?? null,
      missingExpectationCount:
        summary.commercialReadinessState?.launchSourceAuditCoverage?.missingExpectationCount ?? null,
      expectationCheckCount:
        summary.commercialReadinessState?.launchSourceAuditCoverage?.expectationCheckCount ?? null,
      expectedTextMatchCount:
        summary.commercialReadinessState?.launchSourceAuditCoverage?.expectedTextMatchCount ?? null,
      sourceUrlCount: summary.commercialReadinessState?.launchSourceAuditCoverage?.sourceUrls?.length ?? 0,
    },
    commercialEvidenceIntakeSourceAuditCoverage: {
      allPassed:
        summary.commercialReadinessState?.commercialEvidenceIntakeSourceAuditCoverage?.allPassed ?? null,
      networkFetch:
        summary.commercialReadinessState?.commercialEvidenceIntakeSourceAuditCoverage?.networkFetch ?? null,
      sourceCount:
        summary.commercialReadinessState?.commercialEvidenceIntakeSourceAuditCoverage?.sourceCount ?? null,
      passedCount:
        summary.commercialReadinessState?.commercialEvidenceIntakeSourceAuditCoverage?.passedCount ?? null,
      failedCount:
        summary.commercialReadinessState?.commercialEvidenceIntakeSourceAuditCoverage?.failedCount ?? null,
      missingExpectationCount:
        summary.commercialReadinessState?.commercialEvidenceIntakeSourceAuditCoverage
          ?.missingExpectationCount ?? null,
      unexpectedReferenceCount:
        summary.commercialReadinessState?.commercialEvidenceIntakeSourceAuditCoverage
          ?.unexpectedReferenceCount ?? null,
      expectationCheckCount:
        summary.commercialReadinessState?.commercialEvidenceIntakeSourceAuditCoverage
          ?.expectationCheckCount ?? null,
      expectedTextMatchCount:
        summary.commercialReadinessState?.commercialEvidenceIntakeSourceAuditCoverage
          ?.expectedTextMatchCount ?? null,
      sourceUrlCount:
        summary.commercialReadinessState?.commercialEvidenceIntakeSourceAuditCoverage?.sourceUrls?.length ?? 0,
    },
    liveProofRunPacketSourceAuditCoverage: {
      allPassed:
        summary.commercialReadinessState?.liveProofRunPacketSourceAuditCoverage?.allPassed ?? null,
      networkFetch:
        summary.commercialReadinessState?.liveProofRunPacketSourceAuditCoverage?.networkFetch ?? null,
      sourceCount:
        summary.commercialReadinessState?.liveProofRunPacketSourceAuditCoverage?.sourceCount ?? null,
      passedCount:
        summary.commercialReadinessState?.liveProofRunPacketSourceAuditCoverage?.passedCount ?? null,
      failedCount:
        summary.commercialReadinessState?.liveProofRunPacketSourceAuditCoverage?.failedCount ?? null,
      missingExpectationCount:
        summary.commercialReadinessState?.liveProofRunPacketSourceAuditCoverage
          ?.missingExpectationCount ?? null,
      unexpectedReferenceCount:
        summary.commercialReadinessState?.liveProofRunPacketSourceAuditCoverage
          ?.unexpectedReferenceCount ?? null,
      expectationCheckCount:
        summary.commercialReadinessState?.liveProofRunPacketSourceAuditCoverage
          ?.expectationCheckCount ?? null,
      expectedTextMatchCount:
        summary.commercialReadinessState?.liveProofRunPacketSourceAuditCoverage
          ?.expectedTextMatchCount ?? null,
      sourceUrlCount:
        summary.commercialReadinessState?.liveProofRunPacketSourceAuditCoverage?.sourceUrls?.length ?? 0,
    },
    liveCloseoutAccessSourceAuditCoverage: {
      allPassed:
        summary.commercialReadinessState?.liveCloseoutAccessSourceAuditCoverage?.allPassed ?? null,
      networkFetch:
        summary.commercialReadinessState?.liveCloseoutAccessSourceAuditCoverage?.networkFetch ?? null,
      sourceCount:
        summary.commercialReadinessState?.liveCloseoutAccessSourceAuditCoverage?.sourceCount ?? null,
      passedCount:
        summary.commercialReadinessState?.liveCloseoutAccessSourceAuditCoverage?.passedCount ?? null,
      failedCount:
        summary.commercialReadinessState?.liveCloseoutAccessSourceAuditCoverage?.failedCount ?? null,
      missingExpectationCount:
        summary.commercialReadinessState?.liveCloseoutAccessSourceAuditCoverage
          ?.missingExpectationCount ?? null,
      unexpectedReferenceCount:
        summary.commercialReadinessState?.liveCloseoutAccessSourceAuditCoverage
          ?.unexpectedReferenceCount ?? null,
      expectationCheckCount:
        summary.commercialReadinessState?.liveCloseoutAccessSourceAuditCoverage
          ?.expectationCheckCount ?? null,
      expectedTextMatchCount:
        summary.commercialReadinessState?.liveCloseoutAccessSourceAuditCoverage
          ?.expectedTextMatchCount ?? null,
      sourceUrlCount:
        summary.commercialReadinessState?.liveCloseoutAccessSourceAuditCoverage?.sourceUrls?.length ?? 0,
    },
    liveCloseoutReadinessCoverage: {
      status: summary.commercialReadinessState?.liveCloseoutReadinessCoverage?.status || null,
      ok: summary.commercialReadinessState?.liveCloseoutReadinessCoverage?.ok ?? null,
      targetProjectRef:
        summary.commercialReadinessState?.liveCloseoutReadinessCoverage?.targetProjectRef || null,
      mutatesExternalState:
        summary.commercialReadinessState?.liveCloseoutReadinessCoverage?.mutatesExternalState ?? null,
      printsSecretValues:
        summary.commercialReadinessState?.liveCloseoutReadinessCoverage?.printsSecretValues ?? null,
      checkCount:
        summary.commercialReadinessState?.liveCloseoutReadinessCoverage?.checkCount ?? null,
      passedCheckCount:
        summary.commercialReadinessState?.liveCloseoutReadinessCoverage?.passedCheckCount ?? null,
      failedCheckCount:
        summary.commercialReadinessState?.liveCloseoutReadinessCoverage?.failedCheckCount ?? null,
      failedCheckIds:
        summary.commercialReadinessState?.liveCloseoutReadinessCoverage?.failedCheckIds || [],
      githubSecrets: {
        missingRequiredSecretNameCount:
          summary.commercialReadinessState?.liveCloseoutReadinessCoverage?.githubSecrets
            ?.missingRequiredSecretNameCount ?? null,
      },
      supabaseAccess: {
        targetProjectVisible:
          summary.commercialReadinessState?.liveCloseoutReadinessCoverage?.supabaseAccess
            ?.targetProjectVisible ?? null,
        functionsApiAccessible:
          summary.commercialReadinessState?.liveCloseoutReadinessCoverage?.supabaseAccess
            ?.functionsApiAccessible ?? null,
      },
      officialReferenceCount:
        summary.commercialReadinessState?.liveCloseoutReadinessCoverage?.officialReferenceCount ??
        null,
      nextActionCount:
        summary.commercialReadinessState?.liveCloseoutReadinessCoverage?.nextActionCount ?? null,
      doesNotProveCount:
        summary.commercialReadinessState?.liveCloseoutReadinessCoverage?.doesNotProveCount ??
        null,
    },
    manualWcagReviewPacketSourceAuditCoverage: {
      allPassed:
        summary.commercialReadinessState?.manualWcagReviewPacketSourceAuditCoverage?.allPassed ?? null,
      networkFetch:
        summary.commercialReadinessState?.manualWcagReviewPacketSourceAuditCoverage?.networkFetch ?? null,
      sourceCount:
        summary.commercialReadinessState?.manualWcagReviewPacketSourceAuditCoverage?.sourceCount ?? null,
      passedCount:
        summary.commercialReadinessState?.manualWcagReviewPacketSourceAuditCoverage?.passedCount ?? null,
      failedCount:
        summary.commercialReadinessState?.manualWcagReviewPacketSourceAuditCoverage?.failedCount ?? null,
      missingExpectationCount:
        summary.commercialReadinessState?.manualWcagReviewPacketSourceAuditCoverage
          ?.missingExpectationCount ?? null,
      unexpectedReferenceCount:
        summary.commercialReadinessState?.manualWcagReviewPacketSourceAuditCoverage
          ?.unexpectedReferenceCount ?? null,
      expectationCheckCount:
        summary.commercialReadinessState?.manualWcagReviewPacketSourceAuditCoverage
          ?.expectationCheckCount ?? null,
      expectedTextMatchCount:
        summary.commercialReadinessState?.manualWcagReviewPacketSourceAuditCoverage
          ?.expectedTextMatchCount ?? null,
      sourceUrlCount:
        summary.commercialReadinessState?.manualWcagReviewPacketSourceAuditCoverage?.sourceUrls?.length ?? 0,
    },
    ownerEvidenceCompletionDrillSourceAuditCoverage: {
      allPassed:
        summary.commercialReadinessState?.ownerEvidenceCompletionDrillSourceAuditCoverage?.allPassed ?? null,
      networkFetch:
        summary.commercialReadinessState?.ownerEvidenceCompletionDrillSourceAuditCoverage?.networkFetch ?? null,
      sourceCount:
        summary.commercialReadinessState?.ownerEvidenceCompletionDrillSourceAuditCoverage?.sourceCount ?? null,
      passedCount:
        summary.commercialReadinessState?.ownerEvidenceCompletionDrillSourceAuditCoverage?.passedCount ?? null,
      failedCount:
        summary.commercialReadinessState?.ownerEvidenceCompletionDrillSourceAuditCoverage?.failedCount ?? null,
      missingExpectationCount:
        summary.commercialReadinessState?.ownerEvidenceCompletionDrillSourceAuditCoverage
          ?.missingExpectationCount ?? null,
      unexpectedReferenceCount:
        summary.commercialReadinessState?.ownerEvidenceCompletionDrillSourceAuditCoverage
          ?.unexpectedReferenceCount ?? null,
      topLevelUrlMismatch:
        summary.commercialReadinessState?.ownerEvidenceCompletionDrillSourceAuditCoverage
          ?.topLevelUrlMismatch ?? null,
      expectationCheckCount:
        summary.commercialReadinessState?.ownerEvidenceCompletionDrillSourceAuditCoverage
          ?.expectationCheckCount ?? null,
      expectedTextMatchCount:
        summary.commercialReadinessState?.ownerEvidenceCompletionDrillSourceAuditCoverage
          ?.expectedTextMatchCount ?? null,
      sourceUrlCount:
        summary.commercialReadinessState?.ownerEvidenceCompletionDrillSourceAuditCoverage?.sourceUrls?.length ?? 0,
    },
    ownerEvidenceExecutionSummary: {
      status: summary.commercialReadinessState?.ownerEvidenceExecutionSummary?.status || null,
      ownerPrepActionNeededByGateCoverage:
        summary.commercialReadinessState?.ownerEvidenceExecutionSummary
          ?.ownerPrepActionNeededByGateCoverage || {},
      operationalAccessPrerequisiteSummary: {
        prerequisiteCount:
          summary.commercialReadinessState?.ownerEvidenceExecutionSummary
            ?.operationalAccessPrerequisiteSummary?.prerequisiteCount ?? null,
        blockingCheckCount:
          summary.commercialReadinessState?.ownerEvidenceExecutionSummary
            ?.operationalAccessPrerequisiteSummary?.blockingCheckCount ?? null,
        prerequisiteIds:
          summary.commercialReadinessState?.ownerEvidenceExecutionSummary
            ?.operationalAccessPrerequisiteSummary?.prerequisiteIds || [],
        uniqueBlockingCheckIds:
          summary.commercialReadinessState?.ownerEvidenceExecutionSummary
            ?.operationalAccessPrerequisiteSummary?.uniqueBlockingCheckIds || [],
        sourceTraceCount:
          summary.commercialReadinessState?.ownerEvidenceExecutionSummary
            ?.operationalAccessPrerequisiteSummary?.sourceTraceCount ?? null,
        sourceTraceBlockingCheckCount:
          summary.commercialReadinessState?.ownerEvidenceExecutionSummary
            ?.operationalAccessPrerequisiteSummary?.sourceTraceBlockingCheckCount ?? null,
      },
      closeoutCoverage: summary.commercialReadinessState?.ownerEvidenceExecutionSummary?.closeoutCoverage || {},
      handoffCoverage: {
        ownerActionRowCount:
          summary.commercialReadinessState?.ownerEvidenceExecutionSummary?.handoffCoverage?.ownerActionRowCount ??
          null,
        commandSequenceCount:
          summary.commercialReadinessState?.ownerEvidenceExecutionSummary?.handoffCoverage?.commandSequenceCount ??
          null,
        commandSequenceSourceTraceCount:
          summary.commercialReadinessState?.ownerEvidenceExecutionSummary?.handoffCoverage
            ?.commandSequenceSourceTraceCount ?? null,
      },
      completionDrillCoverage: {
        packetCount:
          summary.commercialReadinessState?.ownerEvidenceExecutionSummary?.completionDrillCoverage?.packetCount ??
          null,
        matrixRowCount:
          summary.commercialReadinessState?.ownerEvidenceExecutionSummary?.completionDrillCoverage?.matrixRowCount ??
          null,
        recommendedCommandCount:
          summary.commercialReadinessState?.ownerEvidenceExecutionSummary?.completionDrillCoverage
            ?.recommendedCommandCount ?? null,
        recommendedCommandOrderSourceTraceCount:
          summary.commercialReadinessState?.ownerEvidenceExecutionSummary?.completionDrillCoverage
            ?.recommendedCommandOrderSourceTraceCount ?? null,
      },
    },
    ownerActionQueueSummary: {
      status: summary.commercialReadinessState?.ownerActionQueueSummary?.status || null,
      queueCount: summary.commercialReadinessState?.ownerActionQueueSummary?.queueCount ?? null,
      handoffRowCount: summary.commercialReadinessState?.ownerActionQueueSummary?.handoffRowCount ?? null,
      gateIds: summary.commercialReadinessState?.ownerActionQueueSummary?.gateIds || [],
      nextCommandCount: summary.commercialReadinessState?.ownerActionQueueSummary?.nextCommandCount ?? null,
      ownerPrepCommandCount:
        summary.commercialReadinessState?.ownerActionQueueSummary?.ownerPrepCommandCount ?? null,
      rawEvidencePolicyCount:
        summary.commercialReadinessState?.ownerActionQueueSummary?.rawEvidencePolicyCount ?? null,
      closeoutFailureDetailCount:
        summary.commercialReadinessState?.ownerActionQueueSummary?.closeoutFailureDetailCount ?? null,
    },
    alignmentStatus: summary.commercialReadinessState?.alignmentStatus || null,
    evidenceBoundary:
      'This verifier proves the final commercial verification summary mirrors current repo-generated launch, owner closeout, remediation completion, and remediation gate ledgers. It does not prove owner-held evidence, live checkout, live MRR, partner commitments, documented outcomes, manual WCAG conformance, legal compliance, production state, or commercial readiness.',
    errorCount: errors.length,
    errors,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main();
