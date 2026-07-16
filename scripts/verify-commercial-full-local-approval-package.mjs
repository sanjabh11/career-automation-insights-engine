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

const PACKAGE_JSON = 'package.json';
const SUMMARY_JSON = 'docs/commercialization/commercial-verification-summary-latest.json';
const SUMMARY_MD = 'docs/commercialization/commercial-verification-summary-latest.md';
const PLAN_MD = 'docs/commercialization/full-local-gate-execution-plan-2026-06-05.md';
const DIGEST_MD = 'docs/commercialization/full-local-gate-progress-digest-2026-06-05.md';
const WORKFLOW_README = '.dynamic-workflows/commercial-full-local-gate-2026-06-05/README.md';
const WORKFLOW_JSON = '.dynamic-workflows/commercial-full-local-gate-2026-06-05/workflow.json';
const WORKFLOW_SCRIPT = '.dynamic-workflows/commercial-full-local-gate-2026-06-05/workflow.js';
const WORKFLOW_BACKLOG = '.dynamic-workflows/commercial-full-local-gate-2026-06-05/backlog.jsonl';
const WORKFLOW_RESULTS = '.dynamic-workflows/commercial-full-local-gate-2026-06-05/results.jsonl';
const WORKFLOW_CLAIMS = '.dynamic-workflows/commercial-full-local-gate-2026-06-05/claims.jsonl';

const EXPECTED_WORKFLOW_NAME = 'commercial-full-local-gate-2026-06-05';
const EXPECTED_WORKFLOW_REPO_ROOT = root;
const EXPECTED_DYNAMIC_WORKFLOW_RUNNER =
  '/Users/sanjayb/.codex/plugins/cache/local-codex-marketplace/everything-claude-code/1.9.0/skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js';
const EXPECTED_CANCELLED_AUTOGEN_TASKS = ['T001', 'T002', 'T003', 'T004'];
const EXPECTED_REMAINING_OWNER_GATES = [
  'manual_wcag_evidence',
  'real_stripe_test_checkout',
  'live_mrr_gt_zero',
  'three_committed_partners',
  'documented_outcomes',
];
const EXPECTED_DEFAULT_FIXTURE_STEP_ID = 'full-local-approval-package-fixtures';
const EXPECTED_DEFAULT_FIXTURE_STEP_COMMAND =
  'node scripts/verify-commercial-full-local-approval-package-fixtures.mjs';

const WORKFLOW_METADATA_REQUIRED_TEXT = [
  'Plan-only phase for career-automation-insights-engine commercial launch readiness',
  'accessibility smoke',
  'browser journey',
  'official source URL refresh',
  'launch evidence source URL fetch',
  'live closeout access source URL fetch',
  'npm production audit',
  'final npm run verify:commercial-full summary',
  'no production deploys',
  'no live credentials',
  'no payment changes',
  'no customer outreach',
  'no destructive actions',
  'no worker execution/export without approval',
  'launch-decision boundary stays pilot-only until owner evidence gates close',
];

const EXPECTED_TASKS = {
  T005: {
    phase: 'map',
    role: 'release-gate-mapper',
    title: 'Map optional gate baseline',
    prompt:
      'Plan only. Inspect commercial-verification-summary-latest.json releaseGateCoverage and verify-commercial-release.mjs optional step definitions. Record that current default_core passes, while accessibility_smoke, browser_journey, network_and_audit, and full_local_gate are not included. Do not run commands until approval.',
    status: 'pass',
    dependsOn: [],
    reviewOf: null,
    summary:
      'Optional gate baseline mapped from current summary and verifier wiring; default core is passed while optional full-local gates remain unexecuted.',
    evidence: `${PLAN_MD}#current-baseline; ${PACKAGE_JSON} verify:commercial-full; scripts/verify-commercial-release.mjs releaseGateCoverage`,
  },
  T006: {
    phase: 'verify',
    role: 'accessibility-planner',
    title: 'Plan accessibility smoke evidence',
    prompt:
      'Plan only. Prepare command npm run verify:commercial-a11y, expected artifacts docs/commercialization/commercial-accessibility-audit-latest.json and .md, pass criteria, failure triage path, and boundary that this is not manual WCAG conformance evidence.',
    status: 'pass',
    dependsOn: [],
    reviewOf: null,
    summary:
      'Accessibility smoke plan records command, expected artifacts, pass criteria, failure triage, and explicit non-WCAG-conformance boundary.',
    evidence: `${PLAN_MD}#step-2-accessibility-smoke; scripts/verify-commercial-accessibility.mjs; ${PACKAGE_JSON} verify:commercial-a11y`,
  },
  T007: {
    phase: 'verify',
    role: 'adversarial-planner',
    title: 'Plan adversarial review of full-local evidence',
    prompt:
      'Plan only. Define false-positive checks for overclaiming commercial readiness, confusing local/browser/network proof with hosted/live proof, and accepting green full-local summary while owner gates remain open.',
    status: 'pass',
    dependsOn: [],
    reviewOf: null,
    summary:
      'Adversarial review plan defines false-positive checks for overclaiming full-local evidence, mixing proof buckets, and upgrading beyond pilot-only while owner gates remain open.',
    evidence: `${PLAN_MD}#stop-conditions; ${PLAN_MD}#evidence-boundary; scripts/verify-commercial-release.mjs commercialReadinessState`,
  },
  T008: {
    phase: 'audit',
    role: 'dependency-audit-planner',
    title: 'Plan production dependency audit evidence',
    prompt:
      'Plan only. Prepare command npm audit --omit=dev --audit-level=high, pass/fail criteria, lockfile/advisory triage path, and boundary that advisories are time-sensitive.',
    status: 'pass',
    dependsOn: [],
    reviewOf: null,
    summary:
      'Production dependency audit plan records npm audit command, pass/fail criteria, advisory triage, and time-sensitive advisory boundary.',
    evidence: `${PLAN_MD}#step-5-production-dependency-audit; package-lock.json; ${PACKAGE_JSON}`,
  },
  T009: {
    phase: 'verify',
    role: 'network-source-planner',
    title: 'Plan network and source-refresh evidence',
    prompt:
      'Plan only. Prepare commands node scripts/verify-source-manifest.mjs --write, node scripts/verify-launch-evidence-sources.mjs --fetch --write, node scripts/verify-live-closeout-access-sources.mjs --fetch --write, node scripts/generate-launch-evidence-manifest.mjs --write --validate, expected artifacts, source URL drift checks, and boundary that this uses public URLs only and does not prove Supabase account access.',
    status: 'pass',
    dependsOn: [],
    reviewOf: null,
    summary:
      'Network/source-refresh plan records public-source commands, live-closeout access source-audit coverage, expected artifacts, source-drift handling, and public-URL-only boundary.',
    evidence: `${PLAN_MD}#step-4-network-source-refresh; scripts/verify-source-manifest.mjs; scripts/verify-launch-evidence-sources.mjs; scripts/verify-live-closeout-access-sources.mjs; scripts/generate-launch-evidence-manifest.mjs`,
  },
  T010: {
    phase: 'verify',
    role: 'browser-journey-planner',
    title: 'Plan browser journey evidence',
    prompt:
      'Plan only. Prepare command npm run verify:commercial-browser, expected local Vite/Playwright behavior, routes and interactions covered, failure triage path, and boundary that this proves local browser journey only, not production uptime or owner-held proof.',
    status: 'pass',
    dependsOn: [],
    reviewOf: null,
    summary:
      'Browser journey plan records local Vite/Playwright command, route/rendering proof expectations, failure triage, and local-only proof boundary.',
    evidence: `${PLAN_MD}#step-3-browser-journey; scripts/verify-commercial-browser.mjs; ${PACKAGE_JSON} verify:commercial-browser`,
  },
  T011: {
    phase: 'synthesize',
    role: 'full-local-gate-planner',
    title: 'Plan final full-local gate evidence',
    prompt:
      'Plan only. Prepare final command npm run verify:commercial-full, expected summary fields for accessibility_smoke/browser_journey/network_and_audit/full_local_gate plus liveCloseoutAccessSourceAuditCoverage, post-summary checks, stop conditions, and launch decision boundary stays pilot-only.',
    status: 'pass',
    dependsOn: [],
    reviewOf: null,
    summary:
      'Full-local gate plan records final verify:commercial-full command, expected releaseGateCoverage and live-closeout source-audit coverage fields, focused rerun strategy, final readbacks, and pilot-only launch boundary.',
    evidence: `${PLAN_MD}#step-6-full-local-commercial-gate; ${PLAN_MD}#step-7-final-readbacks; ${PACKAGE_JSON} verify:commercial-full`,
  },
  T012: {
    phase: 'verify',
    role: 'adversarial-reviewer',
    title: 'Review optional gate baseline',
    prompt:
      'Plan-only review. Check whether the optional gate baseline clearly separates passed default-core evidence from unexecuted optional gates and does not imply full-local proof before approval.',
    status: 'pass',
    dependsOn: ['T005'],
    reviewOf: 'T005',
    summary:
      'Review passed: baseline keeps default-core pass separate from unexecuted optional gates and requires approval before full-local evidence can be claimed.',
    evidence: `${PLAN_MD}#current-baseline; ${PLAN_MD}#approval-gate`,
  },
  T013: {
    phase: 'verify',
    role: 'adversarial-reviewer',
    title: 'Review accessibility smoke plan',
    prompt:
      'Plan-only review. Check whether the accessibility plan names automated smoke proof only, preserves manual WCAG evidence as unresolved, and avoids conformance overclaiming.',
    status: 'pass',
    dependsOn: ['T006'],
    reviewOf: 'T006',
    summary:
      'Review passed: accessibility plan limits proof to automated smoke checks and explicitly preserves manual WCAG evidence as unresolved.',
    evidence: `${PLAN_MD}#step-2-accessibility-smoke; ${PLAN_MD}#evidence-boundary`,
  },
  T014: {
    phase: 'verify',
    role: 'adversarial-reviewer',
    title: 'Review browser journey plan',
    prompt:
      'Plan-only review. Check whether the browser journey plan is local-only, does not imply hosted uptime, and has concrete route/rendering failure triage.',
    status: 'pass',
    dependsOn: ['T010'],
    reviewOf: 'T010',
    summary:
      'Review passed: browser journey plan states local Vite/Playwright proof only and does not claim hosted uptime or owner-held evidence.',
    evidence: `${PLAN_MD}#step-3-browser-journey; ${PLAN_MD}#evidence-boundary`,
  },
  T015: {
    phase: 'verify',
    role: 'adversarial-reviewer',
    title: 'Review network source plan',
    prompt:
      'Plan-only review. Check whether source refresh separates public-source drift from transient network failure, includes live closeout access source-audit coverage, uses public URLs only, and does not weaken source claims to force green status.',
    status: 'pass',
    dependsOn: ['T009'],
    reviewOf: 'T009',
    summary:
      'Review passed: network/source plan includes live-closeout access source-audit coverage, separates public-source drift from transient failure, and forbids weakening source claims for green status.',
    evidence: `${PLAN_MD}#step-4-network-source-refresh`,
  },
  T016: {
    phase: 'verify',
    role: 'adversarial-reviewer',
    title: 'Review dependency audit plan',
    prompt:
      'Plan-only review. Check whether dependency audit criteria are time-sensitive, production scoped, and stop before breaking major upgrades.',
    status: 'pass',
    dependsOn: ['T008'],
    reviewOf: 'T008',
    summary: 'Review passed: dependency audit plan is production-scoped, time-sensitive, and stops before breaking major upgrades.',
    evidence: `${PLAN_MD}#step-5-production-dependency-audit`,
  },
  T017: {
    phase: 'verify',
    role: 'adversarial-reviewer',
    title: 'Review adversarial boundary plan',
    prompt:
      'Plan-only review. Check whether the adversarial boundary plan catches false-positive commercial readiness, proof-bucket confusion, and launch-decision upgrades beyond pilot-only.',
    status: 'pass',
    dependsOn: ['T007'],
    reviewOf: 'T007',
    summary:
      'Review passed: adversarial plan preserves pilot-only launch decision and explicitly checks proof-bucket confusion and commercial-ready overclaiming.',
    evidence: `${PLAN_MD}#stop-conditions; ${PLAN_MD}#evidence-boundary`,
  },
};

const EXPECTED_PACKAGE_SCRIPTS = {
  'verify:commercial-summary-launch-readiness':
    'node scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
  'verify:commercial-a11y': 'node scripts/verify-commercial-accessibility.mjs',
  'verify:commercial-browser': 'node scripts/verify-commercial-browser.mjs',
  'verify:commercial-network': 'node scripts/verify-commercial-release.mjs --with-network',
  'verify:commercial-full': 'node scripts/verify-commercial-release.mjs --with-a11y --with-network --with-journey',
  'verify:commercial-full-local-approval-package': 'node scripts/verify-commercial-full-local-approval-package.mjs',
  'verify:launch-evidence-sources': 'node scripts/verify-launch-evidence-sources.mjs --fetch --write',
  'verify:live-closeout-access-sources': 'node scripts/verify-live-closeout-access-sources.mjs --fetch --write',
  'verify:live-closeout-access-sources-fixtures': 'node scripts/verify-live-closeout-access-sources-fixtures.mjs',
  'verify:launch-evidence': 'node scripts/generate-launch-evidence-manifest.mjs --write --validate',
  'verify:commercial-worktree-hygiene': 'node scripts/verify-commercial-worktree-hygiene.mjs --write',
};

const PLAN_REQUIRED_TEXT = [
  'Status: plan-only, approval required before execution',
  'This phase must not run production deploys',
  'Do not execute the commands below until the plan-only gate is approved.',
  'npm run verify:commercial-summary-launch-readiness',
  'npm run verify:commercial-a11y',
  'npm run verify:commercial-browser',
  'node scripts/verify-source-manifest.mjs --write',
  'node scripts/verify-launch-evidence-sources.mjs --fetch --write',
  'node scripts/verify-live-closeout-access-sources.mjs --fetch --write',
  'node scripts/generate-launch-evidence-manifest.mjs --write --validate',
  'docs/commercialization/live-closeout-access-source-audit-latest.json',
  'docs/commercialization/live-closeout-readiness-latest.json',
  'npm audit --omit=dev --audit-level=high',
  'npm run verify:commercial-full',
  'dynamic workflow executionApproved: false',
  'Preserve `commercialReadinessState.launchDecision: pilot-only` while owner evidence gates remain open.',
  'A full-local pass would prove a stronger local and public-source verification surface.',
  'It would still not prove owner-held Stripe evidence',
];

const DIGEST_REQUIRED_TEXT = [
  'Execution state: `plan-only`',
  'This digest reports progress for the approval-gated planning workflow only.',
  'It does not prove that the accessibility smoke, browser journey, network/source refresh, production dependency audit, or `npm run verify:commercial-full` gates have passed.',
  'The dynamic workflow has `executionApproved: false`',
  'Explicit approval to execute the full-local command sequence.',
  'live closeout access source audit',
  'No synthetic market or customer data was used in this phase.',
  'This digest proves only that the plan-only workflow is complete and reviewed.',
];

const README_REQUIRED_TEXT = [
  `Approval plan: \`${PLAN_MD}\``,
  `Progress digest: \`${DIGEST_MD}\``,
  'live closeout access source URL fetch',
  'No workers have been executed or exported.',
  'Do not run `run-workers --execute`, `export-worktree-plan`, or `npm run verify:commercial-full` until this plan-only gate is approved.',
  `Wrapper: \`${WORKFLOW_SCRIPT}\``,
  `Verified runner path: \`${EXPECTED_DYNAMIC_WORKFLOW_RUNNER}\``,
  `Status: \`node ${WORKFLOW_SCRIPT} status\``,
  `Next: \`node ${WORKFLOW_SCRIPT} next\``,
  `Preview workers: \`node ${WORKFLOW_SCRIPT} run-workers --dry-run\``,
  `Execute workers: \`node ${WORKFLOW_SCRIPT} run-workers --execute\``,
  `Dashboard: \`node ${WORKFLOW_SCRIPT} dashboard\``,
  `Export worktree plan: \`node ${WORKFLOW_SCRIPT} export-worktree-plan --out .orchestration/commercial-full-local-gate-2026-06-05.json\``,
];

const SUMMARY_MD_RELEASE_GATE_ROWS = [
  '| default_core | `npm run verify:commercial` | `yes` | `yes` |',
  '| browser_journey | `npm run verify:commercial-browser` | `no` | `not included` |',
  '| accessibility_smoke | `npm run verify:commercial-a11y` | `no` | `not included` |',
  '| network_and_audit | `npm run verify:commercial-network` | `no` | `not included` |',
  '| full_local_gate | `npm run verify:commercial-full` | `no` | `not included` |',
];

const SUMMARY_MD_READINESS_ROWS = [
  '## Commercial Readiness State',
  '| Readiness status | `owner_evidence_required` |',
  '| Launch decision | `pilot-only` |',
  '| Expected launch decision | `pilot-only` |',
  '| Goal complete | `no` |',
  '| Owner gate status | `owner_evidence_required` |',
  '| Remaining owner/live gate count | 5 |',
  '### Remaining Owner/Live Gates',
  '| manual_wcag_evidence | open | owner/live evidence required |',
  '| real_stripe_test_checkout | open | owner/live evidence required |',
  '| live_mrr_gt_zero | open | owner/live evidence required |',
  '| three_committed_partners | open | owner/live evidence required |',
  '| documented_outcomes | open | owner/live evidence required |',
];

const SUMMARY_MD_SOURCE_ARTIFACT_ROWS = [
  '### Launch-Readiness Source Artifacts',
  '| Launch evidence | `docs/commercialization/launch-evidence-latest.json` |',
  '| Live closeout access source audit | `docs/commercialization/live-closeout-access-source-audit-latest.json` |',
  '| Live closeout readiness | `docs/commercialization/live-closeout-readiness-latest.json` |',
  '| Owner evidence closeout status | `docs/commercialization/owner-evidence-closeout-status-latest.json` |',
  '| Remediation completion audit | `docs/commercialization/remediation-completion-audit-latest.json` |',
  '| Remediation external gates | `docs/commercialization/remediation-external-gates-latest.json` |',
  'This state summarizes current repo-generated launch and owner-evidence ledgers only. A passed repo-local verification summary does not upgrade the launch decision while owner/live gates remain unresolved.',
];

const SUMMARY_MD_LIVE_CLOSEOUT_ACCESS_ROWS = [
  '### Live Closeout Access Source Audit Coverage',
  '| Artifact | `docs/commercialization/live-closeout-access-source-audit-latest.json` |',
  '| Readiness artifact | `docs/commercialization/live-closeout-readiness-latest.json` |',
  '| Network fetch | `yes` |',
  '| All passed | `yes` |',
  '| Supabase/GitHub access references | 4 |',
  '| Failed references | 0 |',
  '| Expectation checks | 8 |',
  '| Expected-text matches | 8 |',
  '#### Live Closeout Access Source Trace',
  '| supabase-access-control | https://supabase.com/docs/guides/platform/access-control |',
  '| supabase-cli-login | https://supabase.com/docs/reference/cli/supabase-login |',
  '| supabase-functions-list | https://supabase.com/docs/reference/cli/supabase-functions-list |',
  '| github-actions-secrets | https://docs.github.com/en/actions/concepts/security/secrets |',
  'It does not prove Supabase account access, functions API access, secret value validity, deployment completion, O*NET ingest completion, parse-resume deployment completion, live closeout, or commercial readiness.',
];

const SUMMARY_MD_REQUIRED_TEXT = [
  '# Commercial Verification Summary',
  ...SUMMARY_MD_READINESS_ROWS,
  ...SUMMARY_MD_SOURCE_ARTIFACT_ROWS,
  ...SUMMARY_MD_LIVE_CLOSEOUT_ACCESS_ROWS,
  '## Release Gate Coverage',
  ...SUMMARY_MD_RELEASE_GATE_ROWS,
  '## Post-Summary Full-Local Approval Package',
  'Fixture verifier: `node scripts/verify-commercial-full-local-approval-package-fixtures.mjs`',
  '| full-local-approval-package-fixtures | passed | `node scripts/verify-commercial-full-local-approval-package-fixtures.mjs`',
  'This verifier reads the approval plan, progress digest, workflow metadata, workflow backlog/results, package scripts, and current commercial summary only.',
  'It does not execute accessibility, browser, network, audit, full-local, worker, live, payment, credential, outreach, or owner-held evidence gates.',
];

function fullPath(relativePath) {
  return path.join(root, relativePath);
}

function read(relativePath) {
  return fs.readFileSync(fullPath(relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function readJsonl(relativePath) {
  return read(relativePath)
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function markdownSlug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function markdownHeadingSlugs(source) {
  return new Set(
    source
      .split(/\r?\n/)
      .map((line) => line.match(/^#{1,6}\s+(.+?)\s*$/)?.[1])
      .filter(Boolean)
      .map((heading) => markdownSlug(heading)),
  );
}

function parseEvidenceReference(reference) {
  const match = reference.match(/^([A-Za-z0-9_./-]+(?:\.[A-Za-z0-9]+))(?:#([A-Za-z0-9_-]+))?(?:\s+(.+))?$/);
  if (!match) return null;
  return {
    file: match[1],
    anchor: match[2] || null,
    marker: match[3]?.trim() || null,
  };
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

function requireIncludes(errors, file, source, expectedText) {
  if (!source.includes(expectedText)) {
    addError(errors, 'missing_text', { file, expectedText });
  }
}

function requireFile(errors, relativePath) {
  if (!fs.existsSync(fullPath(relativePath))) {
    addError(errors, 'missing_file', { file: relativePath });
  }
}

function validateWorkflowEvidenceReference(errors, taskId, reference) {
  const parsed = parseEvidenceReference(reference);
  if (!parsed) {
    addError(errors, 'workflow_task_evidence_reference_unparseable', { taskId, reference });
    return;
  }

  if (path.isAbsolute(parsed.file) || path.normalize(parsed.file).startsWith('..')) {
    addError(errors, 'workflow_task_evidence_reference_outside_repo', {
      taskId,
      reference,
      file: parsed.file,
    });
    return;
  }

  const evidencePath = fullPath(parsed.file);
  if (!fs.existsSync(evidencePath) || !fs.statSync(evidencePath).isFile()) {
    addError(errors, 'workflow_task_evidence_file_missing', {
      taskId,
      reference,
      file: parsed.file,
    });
    return;
  }

  const source = read(parsed.file);
  if (parsed.anchor && !markdownHeadingSlugs(source).has(parsed.anchor)) {
    addError(errors, 'workflow_task_evidence_anchor_missing', {
      taskId,
      reference,
      file: parsed.file,
      anchor: parsed.anchor,
    });
  }

  if (parsed.marker && !source.includes(parsed.marker)) {
    addError(errors, 'workflow_task_evidence_marker_missing', {
      taskId,
      reference,
      file: parsed.file,
      marker: parsed.marker,
    });
  }
}

function validateWorkflowEvidenceReferences(errors, taskId, evidence) {
  const references = String(evidence || '')
    .split(';')
    .map((reference) => reference.trim())
    .filter(Boolean);

  if (references.length === 0) {
    addError(errors, 'workflow_task_evidence_references_missing', { taskId });
    return;
  }

  references.forEach((reference) => validateWorkflowEvidenceReference(errors, taskId, reference));
}

function validateFiles(errors) {
  [
    PACKAGE_JSON,
    SUMMARY_JSON,
    SUMMARY_MD,
    PLAN_MD,
    DIGEST_MD,
    WORKFLOW_README,
    WORKFLOW_JSON,
    WORKFLOW_SCRIPT,
    WORKFLOW_BACKLOG,
    WORKFLOW_RESULTS,
    WORKFLOW_CLAIMS,
  ].forEach((file) => requireFile(errors, file));
}

function validatePackageScripts(errors, packageJson) {
  const scripts = packageJson.scripts || {};
  Object.entries(EXPECTED_PACKAGE_SCRIPTS).forEach(([name, expected]) => {
    requireExact(errors, `package.scripts.${name}`, expected, scripts[name]);
  });
}

function validateSummary(errors, summary) {
  requireExact(errors, 'summary.status', 'passed', summary.status);
  requireExact(errors, 'summary.failedStepCount', 0, summary.failedStepCount);
  if (!Array.isArray(summary.steps)) {
    addError(errors, 'summary_steps_missing');
  } else {
    const fixtureStep = summary.steps.find((step) => step.id === EXPECTED_DEFAULT_FIXTURE_STEP_ID);
    if (!fixtureStep) {
      addError(errors, 'missing_default_full_local_approval_package_fixture_step');
    } else {
      requireExact(errors, 'summary.steps.full-local-approval-package-fixtures.status', 'passed', fixtureStep.status);
      requireExact(
        errors,
        'summary.steps.full-local-approval-package-fixtures.command',
        EXPECTED_DEFAULT_FIXTURE_STEP_COMMAND,
        fixtureStep.command,
      );
    }
  }
  requireExact(errors, 'summary.commercialReadinessState.status', 'owner_evidence_required', summary.commercialReadinessState?.status);
  requireExact(
    errors,
    'summary.commercialReadinessState.launchDecision',
    'pilot-only',
    summary.commercialReadinessState?.launchDecision,
  );
  requireExact(
    errors,
    'summary.commercialReadinessState.ownerGateScoreboard.remainingGateIds',
    EXPECTED_REMAINING_OWNER_GATES,
    summary.commercialReadinessState?.ownerGateScoreboard?.remainingGateIds || [],
  );
  requireExact(
    errors,
    'summary.commercialReadinessState.sourceArtifacts.liveCloseoutAccessSourceAudit',
    'docs/commercialization/live-closeout-access-source-audit-latest.json',
    summary.commercialReadinessState?.sourceArtifacts?.liveCloseoutAccessSourceAudit,
  );
  requireExact(
    errors,
    'summary.commercialReadinessState.sourceArtifacts.liveCloseoutReadiness',
    'docs/commercialization/live-closeout-readiness-latest.json',
    summary.commercialReadinessState?.sourceArtifacts?.liveCloseoutReadiness,
  );
  const liveCloseoutAccessCoverage =
    summary.commercialReadinessState?.liveCloseoutAccessSourceAuditCoverage || {};
  requireExact(
    errors,
    'summary.commercialReadinessState.liveCloseoutAccessSourceAuditCoverage.artifact',
    'docs/commercialization/live-closeout-access-source-audit-latest.json',
    liveCloseoutAccessCoverage.artifact,
  );
  requireExact(
    errors,
    'summary.commercialReadinessState.liveCloseoutAccessSourceAuditCoverage.readinessPath',
    'docs/commercialization/live-closeout-readiness-latest.json',
    liveCloseoutAccessCoverage.readinessPath,
  );
  requireExact(
    errors,
    'summary.commercialReadinessState.liveCloseoutAccessSourceAuditCoverage.allPassed',
    true,
    liveCloseoutAccessCoverage.allPassed,
  );
  requireExact(
    errors,
    'summary.commercialReadinessState.liveCloseoutAccessSourceAuditCoverage.networkFetch',
    true,
    liveCloseoutAccessCoverage.networkFetch,
  );
  requireExact(
    errors,
    'summary.commercialReadinessState.liveCloseoutAccessSourceAuditCoverage.sourceCount',
    4,
    liveCloseoutAccessCoverage.sourceCount,
  );
  requireExact(
    errors,
    'summary.commercialReadinessState.liveCloseoutAccessSourceAuditCoverage.failedCount',
    0,
    liveCloseoutAccessCoverage.failedCount,
  );
  requireExact(
    errors,
    'summary.commercialReadinessState.liveCloseoutAccessSourceAuditCoverage.expectationCheckCount',
    8,
    liveCloseoutAccessCoverage.expectationCheckCount,
  );
  requireExact(
    errors,
    'summary.commercialReadinessState.liveCloseoutAccessSourceAuditCoverage.expectedTextMatchCount',
    8,
    liveCloseoutAccessCoverage.expectedTextMatchCount,
  );

  const coverage = summary.releaseGateCoverage || {};
  requireExact(errors, 'releaseGateCoverage.default_core.included', true, coverage.default_core?.includedInThisInvocation);
  requireExact(errors, 'releaseGateCoverage.default_core.passed', true, coverage.default_core?.passedInThisInvocation);

  ['accessibility_smoke', 'browser_journey', 'network_and_audit', 'full_local_gate'].forEach((gateId) => {
    requireExact(errors, `releaseGateCoverage.${gateId}.included`, false, coverage[gateId]?.includedInThisInvocation);
    requireExact(errors, `releaseGateCoverage.${gateId}.passed`, null, coverage[gateId]?.passedInThisInvocation ?? null);
  });

  if (!String(coverage.boundary || '').includes('Null means the gate was not included')) {
    addError(errors, 'release_gate_coverage_missing_null_boundary');
  }

  const approvalPackage = summary.postSummaryFullLocalApprovalPackage;
  if (!approvalPackage || typeof approvalPackage !== 'object') {
    addError(errors, 'missing_post_summary_full_local_approval_package_metadata');
  } else {
    requireExact(
      errors,
      'summary.postSummaryFullLocalApprovalPackage.command',
      'node scripts/verify-commercial-full-local-approval-package.mjs',
      approvalPackage.command,
    );
    requireExact(
      errors,
      'summary.postSummaryFullLocalApprovalPackage.includedInThisInvocation',
      true,
      approvalPackage.includedInThisInvocation,
    );
    requireExact(
      errors,
      'summary.postSummaryFullLocalApprovalPackage.fixtureVerifier.command',
      'node scripts/verify-commercial-full-local-approval-package-fixtures.mjs',
      approvalPackage.fixtureVerifier?.command,
    );
    if (!String(approvalPackage.condition || '').includes('Runs only for the default commercial verifier invocation')) {
      addError(errors, 'post_summary_full_local_approval_package_missing_default_only_condition');
    }
    if (!String(approvalPackage.boundary || '').includes('does not execute accessibility, browser, network, audit, full-local')) {
      addError(errors, 'post_summary_full_local_approval_package_missing_execution_boundary');
    }
  }
}

function validateWorkflow(errors, workflow, backlog, results) {
  requireExact(errors, 'workflow.name', EXPECTED_WORKFLOW_NAME, workflow.name);
  requireExact(errors, 'workflow.repoRoot', EXPECTED_WORKFLOW_REPO_ROOT, path.resolve(workflow.repoRoot || ''));
  requireExact(errors, 'workflow.mode', 'plan-only', workflow.mode);
  requireExact(errors, 'workflow.classification.mode', 'plan-only', workflow.classification?.mode);
  requireExact(errors, 'workflow.classification.tier', 2, workflow.classification?.tier);
  requireExact(errors, 'workflow.classification.primarySkill', 'dynamic-workflow-backlog', workflow.classification?.primarySkill);
  requireExact(errors, 'workflow.maxConcurrency', 4, workflow.maxConcurrency);
  requireExact(errors, 'workflow.maxAgents', 64, workflow.maxAgents);
  requireExact(errors, 'workflow.executionApproved', false, workflow.executionApproved);

  requireExact(errors, 'workflow.goal', workflow.goal, workflow.sourceTask);
  WORKFLOW_METADATA_REQUIRED_TEXT.forEach((expectedText) => {
    requireIncludes(errors, WORKFLOW_JSON, String(workflow.goal || ''), expectedText);
    requireIncludes(errors, WORKFLOW_JSON, String(workflow.sourceTask || ''), expectedText);
  });

  if (!Array.isArray(workflow.classification?.cautions) || !workflow.classification.cautions.some((caution) => String(caution).includes('stop-and-ask before execution'))) {
    addError(errors, 'workflow_classification_missing_stop_and_ask_caution', {
      workflow: WORKFLOW_JSON,
    });
  }

  const expectedTaskIds = Object.keys(EXPECTED_TASKS);
  const taskById = Object.fromEntries(backlog.map((task) => [task.id, task]));
  Object.entries(EXPECTED_TASKS).forEach(([taskId, expectation]) => {
    const task = taskById[taskId];
    if (!task) {
      addError(errors, 'missing_workflow_task', { taskId });
      return;
    }
    requireExact(errors, `workflow.task.${taskId}.phase`, expectation.phase, task.phase);
    requireExact(errors, `workflow.task.${taskId}.role`, expectation.role, task.role);
    requireExact(errors, `workflow.task.${taskId}.title`, expectation.title, task.title);
    requireExact(errors, `workflow.task.${taskId}.prompt`, expectation.prompt, task.prompt);
    requireExact(errors, `workflow.task.${taskId}.status`, expectation.status, task.status);
    requireExact(errors, `workflow.task.${taskId}.dependsOn`, expectation.dependsOn, task.dependsOn || []);
    requireExact(errors, `workflow.task.${taskId}.reviewOf`, expectation.reviewOf, task.reviewOf ?? null);
    requireExact(errors, `workflow.task.${taskId}.summary`, expectation.summary, task.summary);
    requireExact(errors, `workflow.task.${taskId}.evidence`, expectation.evidence, task.evidence);
    if (!String(task.summary || '').trim()) addError(errors, 'workflow_task_missing_summary', { taskId });
    if (!String(task.evidence || '').trim()) addError(errors, 'workflow_task_missing_evidence', { taskId });
    validateWorkflowEvidenceReferences(errors, taskId, task.evidence);
  });

  const unexpectedOpenTasks = backlog.filter((task) => task.status !== 'pass');
  if (unexpectedOpenTasks.length > 0) {
    addError(errors, 'workflow_has_open_or_failed_tasks', {
      tasks: unexpectedOpenTasks.map((task) => ({ id: task.id, status: task.status })),
    });
  }

  const reviewTasks = backlog.filter((task) => task.reviewOf);
  requireExact(errors, 'workflow.reviewTaskCount', 6, reviewTasks.length);
  requireExact(errors, 'workflow.totalTaskCount', 13, backlog.length);

  const resultTaskIds = results.map((result) => result.taskId);
  const duplicateResultTaskIds = [...new Set(resultTaskIds.filter((taskId, index) => resultTaskIds.indexOf(taskId) !== index))];
  if (duplicateResultTaskIds.length > 0) {
    addError(errors, 'duplicate_workflow_result', { taskIds: duplicateResultTaskIds });
  }

  const unexpectedResults = results.filter((result) => !EXPECTED_TASKS[result.taskId]);
  if (unexpectedResults.length > 0) {
    addError(errors, 'unexpected_workflow_result', {
      taskIds: unexpectedResults.map((result) => result.taskId),
    });
  }

  requireExact(errors, 'workflow.resultCount', expectedTaskIds.length, results.length);

  const resultByTask = Object.fromEntries(results.map((result) => [result.taskId, result]));
  expectedTaskIds.forEach((taskId) => {
    const result = resultByTask[taskId];
    if (!result) {
      addError(errors, 'missing_workflow_result', { taskId });
      return;
    }
    const task = taskById[taskId];
    requireExact(errors, `workflow.result.${taskId}.type`, 'completion', result.type);
    requireExact(errors, `workflow.result.${taskId}.status`, 'pass', result.status);
    if (!String(result.summary || '').trim()) addError(errors, 'workflow_result_missing_summary', { taskId });
    if (!String(result.evidence || '').trim()) addError(errors, 'workflow_result_missing_evidence', { taskId });
    if (task) {
      requireExact(errors, `workflow.result.${taskId}.summary`, task.summary, result.summary);
      requireExact(errors, `workflow.result.${taskId}.evidence`, task.evidence, result.evidence);
    }
  });
}

function validateClaims(errors, backlog, claims) {
  const expectedTaskIds = Object.keys(EXPECTED_TASKS);
  const expectedReviewTaskEntries = Object.entries(EXPECTED_TASKS).filter(([, expectation]) => expectation.reviewOf);
  const taskById = Object.fromEntries(backlog.map((task) => [task.id, task]));

  const unexpectedClaimTypes = claims.filter(
    (claim) => !['cancel', 'evidence', 'review-task-added', 'synthesis-check'].includes(claim.type),
  );
  if (unexpectedClaimTypes.length > 0) {
    addError(errors, 'unexpected_workflow_claim_type', {
      claimTypes: unexpectedClaimTypes.map((claim) => claim.type),
    });
  }

  const cancelRows = claims.filter((claim) => claim.type === 'cancel');
  requireExact(errors, 'workflow.cancelledAutogeneratedTaskIds', EXPECTED_CANCELLED_AUTOGEN_TASKS, cancelRows.map((claim) => claim.taskId));

  const evidenceRows = claims.filter((claim) => claim.type === 'evidence');
  const evidenceTaskIds = evidenceRows.map((claim) => claim.taskId);
  const duplicateEvidenceTaskIds = [
    ...new Set(evidenceTaskIds.filter((taskId, index) => evidenceTaskIds.indexOf(taskId) !== index)),
  ];
  if (duplicateEvidenceTaskIds.length > 0) {
    addError(errors, 'duplicate_workflow_claim_evidence', { taskIds: duplicateEvidenceTaskIds });
  }

  const unexpectedEvidenceRows = evidenceRows.filter((claim) => !EXPECTED_TASKS[claim.taskId]);
  if (unexpectedEvidenceRows.length > 0) {
    addError(errors, 'unexpected_workflow_claim_evidence', {
      taskIds: unexpectedEvidenceRows.map((claim) => claim.taskId),
    });
  }

  requireExact(errors, 'workflow.claimEvidenceCount', expectedTaskIds.length, evidenceRows.length);

  const evidenceByTask = Object.fromEntries(evidenceRows.map((claim) => [claim.taskId, claim]));
  expectedTaskIds.forEach((taskId) => {
    const claim = evidenceByTask[taskId];
    if (!claim) {
      addError(errors, 'missing_workflow_claim_evidence', { taskId });
      return;
    }
    const task = taskById[taskId];
    if (task) {
      requireExact(errors, `workflow.claim.${taskId}.evidence`, task.evidence, claim.evidence);
    }
  });

  const reviewClaimRows = claims.filter((claim) => claim.type === 'review-task-added');
  const reviewClaimTaskIds = reviewClaimRows.map((claim) => claim.taskId);
  const duplicateReviewClaimTaskIds = [
    ...new Set(reviewClaimTaskIds.filter((taskId, index) => reviewClaimTaskIds.indexOf(taskId) !== index)),
  ];
  if (duplicateReviewClaimTaskIds.length > 0) {
    addError(errors, 'duplicate_workflow_review_claim', { taskIds: duplicateReviewClaimTaskIds });
  }

  const expectedReviewTaskIds = expectedReviewTaskEntries.map(([taskId]) => taskId);
  const unexpectedReviewClaimRows = reviewClaimRows.filter((claim) => !expectedReviewTaskIds.includes(claim.taskId));
  if (unexpectedReviewClaimRows.length > 0) {
    addError(errors, 'unexpected_workflow_review_claim', {
      taskIds: unexpectedReviewClaimRows.map((claim) => claim.taskId),
    });
  }

  requireExact(errors, 'workflow.reviewClaimCount', expectedReviewTaskEntries.length, reviewClaimRows.length);

  const reviewClaimByTask = Object.fromEntries(reviewClaimRows.map((claim) => [claim.taskId, claim]));
  expectedReviewTaskEntries.forEach(([taskId, expectation]) => {
    const claim = reviewClaimByTask[taskId];
    if (!claim) {
      addError(errors, 'missing_workflow_review_claim', { taskId });
      return;
    }
    requireExact(errors, `workflow.claim.${taskId}.reviewOf`, expectation.reviewOf, claim.reviewOf ?? null);
  });

  const synthesisRows = claims.filter((claim) => claim.type === 'synthesis-check');
  requireExact(errors, 'workflow.synthesisClaimCount', 1, synthesisRows.length);
  if (synthesisRows.length === 0) {
    addError(errors, 'missing_workflow_synthesis_claim');
  }

  requireExact(
    errors,
    'workflow.claimCount',
    EXPECTED_CANCELLED_AUTOGEN_TASKS.length + expectedTaskIds.length + expectedReviewTaskEntries.length + 1,
    claims.length,
  );
}

function validateWorkflowScript(errors, workflowScriptSource) {
  if (!fs.existsSync(EXPECTED_DYNAMIC_WORKFLOW_RUNNER)) {
    addError(errors, 'missing_dynamic_workflow_runner', {
      runner: EXPECTED_DYNAMIC_WORKFLOW_RUNNER,
    });
  }

  [
    `const runner = "${EXPECTED_DYNAMIC_WORKFLOW_RUNNER}";`,
    "import { spawnSync } from 'node:child_process';",
    "import path from 'node:path';",
    "import { fileURLToPath } from 'node:url';",
    'const __dirname = path.dirname(fileURLToPath(import.meta.url));',
    'const command = process.argv[2] || \'status\';',
    "[runner, command, '--run', __dirname, ...args]",
    "stdio: 'inherit'",
    'if (result.error) {',
    'console.error(result.error.message);',
    'if (result.signal) {',
    'dynamic workflow runner terminated by signal',
    'process.exit(result.status ?? 1);',
  ].forEach((expectedText) => requireIncludes(errors, WORKFLOW_SCRIPT, workflowScriptSource, expectedText));
}

function validateTextArtifacts(errors, planSource, digestSource, readmeSource) {
  PLAN_REQUIRED_TEXT.forEach((expectedText) => requireIncludes(errors, PLAN_MD, planSource, expectedText));
  DIGEST_REQUIRED_TEXT.forEach((expectedText) => requireIncludes(errors, DIGEST_MD, digestSource, expectedText));
  README_REQUIRED_TEXT.forEach((expectedText) => requireIncludes(errors, WORKFLOW_README, readmeSource, expectedText));

  if (readmeSource.includes('node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js')) {
    addError(errors, 'readme_uses_unverified_relative_dynamic_workflow_runner', {
      file: WORKFLOW_README,
    });
  }

  EXPECTED_REMAINING_OWNER_GATES.forEach((gateId) => {
    requireIncludes(errors, PLAN_MD, planSource, gateId);
    requireIncludes(errors, DIGEST_MD, digestSource, gateId);
  });
}

function validateSummaryMarkdown(errors, summaryMarkdown) {
  SUMMARY_MD_REQUIRED_TEXT.forEach((expectedText) => requireIncludes(errors, SUMMARY_MD, summaryMarkdown, expectedText));
}

function main() {
  const errors = [];
  validateFiles(errors);

  if (errors.length === 0) {
    const packageJson = readJson(PACKAGE_JSON);
    const summary = readJson(SUMMARY_JSON);
    const workflow = readJson(WORKFLOW_JSON);
    const backlog = readJsonl(WORKFLOW_BACKLOG);
    const results = readJsonl(WORKFLOW_RESULTS);
    const claims = readJsonl(WORKFLOW_CLAIMS);
    const workflowScriptSource = read(WORKFLOW_SCRIPT);
    const planSource = read(PLAN_MD);
    const digestSource = read(DIGEST_MD);
    const readmeSource = read(WORKFLOW_README);
    const summaryMarkdown = read(SUMMARY_MD);

    validatePackageScripts(errors, packageJson);
    validateSummary(errors, summary);
    validateWorkflow(errors, workflow, backlog, results);
    validateClaims(errors, backlog, claims);
    validateWorkflowScript(errors, workflowScriptSource);
    validateTextArtifacts(errors, planSource, digestSource, readmeSource);
    validateSummaryMarkdown(errors, summaryMarkdown);
  }

  const doesNotProve = [
    'current accessibility smoke pass',
    'current browser journey pass',
    'current public source URL reachability',
    'current production dependency audit pass',
    'current full-local commercial verifier pass',
    'owner-held Stripe, partner, outcome, manual WCAG, production uptime, procurement, legal, or commercial-ready evidence',
  ];

  const result = {
    ok: errors.length === 0,
    status: errors.length === 0 ? 'passed' : 'failed',
    workflow: EXPECTED_WORKFLOW_NAME,
    checkedFiles: [
      PACKAGE_JSON,
      SUMMARY_JSON,
      SUMMARY_MD,
      PLAN_MD,
      DIGEST_MD,
      WORKFLOW_README,
      WORKFLOW_JSON,
      WORKFLOW_SCRIPT,
      WORKFLOW_BACKLOG,
      WORKFLOW_RESULTS,
      WORKFLOW_CLAIMS,
    ],
    dynamicWorkflowRunner: EXPECTED_DYNAMIC_WORKFLOW_RUNNER,
    dynamicWorkflowRunnerExists: fs.existsSync(EXPECTED_DYNAMIC_WORKFLOW_RUNNER),
    expectedRemainingOwnerGateIds: EXPECTED_REMAINING_OWNER_GATES,
    evidenceBoundary:
      'This verifier proves static approval-package consistency only. It does not execute accessibility, browser, network, audit, full-local, worker, live, payment, credential, or outreach gates and cannot prove commercial-ready status.',
    workflowEvidenceReferencePolicy:
      'Every workflow task evidence fragment must resolve to an existing repo file; markdown anchors must match real headings and source markers must appear in the referenced file.',
    doesNotProve,
    doesNotProveCount: doesNotProve.length,
    errorCount: errors.length,
    errors,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main();
