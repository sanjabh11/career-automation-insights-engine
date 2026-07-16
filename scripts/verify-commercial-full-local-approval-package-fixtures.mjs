#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-commercial-full-local-approval-package.mjs');

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

const DYNAMIC_WORKFLOW_RUNNER =
  '/Users/sanjayb/.codex/plugins/cache/local-codex-marketplace/everything-claude-code/1.9.0/skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js';

const GATE_IDS = [
  'manual_wcag_evidence',
  'real_stripe_test_checkout',
  'live_mrr_gt_zero',
  'three_committed_partners',
  'documented_outcomes',
];

const WORKFLOW_GOAL =
  'Plan-only phase for career-automation-insights-engine commercial launch readiness: prove optional non-secret local gates before any full-local execution. Scope: accessibility smoke, browser journey, official source URL refresh, launch evidence source URL fetch, live closeout access source URL fetch, npm production audit, and final npm run verify:commercial-full summary. Constraints: no production deploys, no live credentials, no payment changes, no customer outreach, no destructive actions, no worker execution/export without approval. Evidence required: exact commands, expected artifacts, stop conditions, pass/fail criteria, and launch-decision boundary stays pilot-only until owner evidence gates close.';

const packageScripts = {
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

const TASK_EVIDENCE = {
  T005: `${PLAN_MD}#current-baseline; ${PACKAGE_JSON} verify:commercial-full; scripts/verify-commercial-release.mjs releaseGateCoverage`,
  T006: `${PLAN_MD}#step-2-accessibility-smoke; scripts/verify-commercial-accessibility.mjs; ${PACKAGE_JSON} verify:commercial-a11y`,
  T007: `${PLAN_MD}#stop-conditions; ${PLAN_MD}#evidence-boundary; scripts/verify-commercial-release.mjs commercialReadinessState`,
  T008: `${PLAN_MD}#step-5-production-dependency-audit; package-lock.json; ${PACKAGE_JSON}`,
  T009: `${PLAN_MD}#step-4-network-source-refresh; scripts/verify-source-manifest.mjs; scripts/verify-launch-evidence-sources.mjs; scripts/verify-live-closeout-access-sources.mjs; scripts/generate-launch-evidence-manifest.mjs`,
  T010: `${PLAN_MD}#step-3-browser-journey; scripts/verify-commercial-browser.mjs; ${PACKAGE_JSON} verify:commercial-browser`,
  T011: `${PLAN_MD}#step-6-full-local-commercial-gate; ${PLAN_MD}#step-7-final-readbacks; ${PACKAGE_JSON} verify:commercial-full`,
  T012: `${PLAN_MD}#current-baseline; ${PLAN_MD}#approval-gate`,
  T013: `${PLAN_MD}#step-2-accessibility-smoke; ${PLAN_MD}#evidence-boundary`,
  T014: `${PLAN_MD}#step-3-browser-journey; ${PLAN_MD}#evidence-boundary`,
  T015: `${PLAN_MD}#step-4-network-source-refresh`,
  T016: `${PLAN_MD}#step-5-production-dependency-audit`,
  T017: `${PLAN_MD}#stop-conditions; ${PLAN_MD}#evidence-boundary`,
};

const TASK_CONTRACTS = {
  T005: {
    phase: 'map',
    role: 'release-gate-mapper',
    title: 'Map optional gate baseline',
    prompt:
      'Plan only. Inspect commercial-verification-summary-latest.json releaseGateCoverage and verify-commercial-release.mjs optional step definitions. Record that current default_core passes, while accessibility_smoke, browser_journey, network_and_audit, and full_local_gate are not included. Do not run commands until approval.',
    dependsOn: [],
    reviewOf: null,
    summary:
      'Optional gate baseline mapped from current summary and verifier wiring; default core is passed while optional full-local gates remain unexecuted.',
  },
  T006: {
    phase: 'verify',
    role: 'accessibility-planner',
    title: 'Plan accessibility smoke evidence',
    prompt:
      'Plan only. Prepare command npm run verify:commercial-a11y, expected artifacts docs/commercialization/commercial-accessibility-audit-latest.json and .md, pass criteria, failure triage path, and boundary that this is not manual WCAG conformance evidence.',
    dependsOn: [],
    reviewOf: null,
    summary:
      'Accessibility smoke plan records command, expected artifacts, pass criteria, failure triage, and explicit non-WCAG-conformance boundary.',
  },
  T007: {
    phase: 'verify',
    role: 'adversarial-planner',
    title: 'Plan adversarial review of full-local evidence',
    prompt:
      'Plan only. Define false-positive checks for overclaiming commercial readiness, confusing local/browser/network proof with hosted/live proof, and accepting green full-local summary while owner gates remain open.',
    dependsOn: [],
    reviewOf: null,
    summary:
      'Adversarial review plan defines false-positive checks for overclaiming full-local evidence, mixing proof buckets, and upgrading beyond pilot-only while owner gates remain open.',
  },
  T008: {
    phase: 'audit',
    role: 'dependency-audit-planner',
    title: 'Plan production dependency audit evidence',
    prompt:
      'Plan only. Prepare command npm audit --omit=dev --audit-level=high, pass/fail criteria, lockfile/advisory triage path, and boundary that advisories are time-sensitive.',
    dependsOn: [],
    reviewOf: null,
    summary:
      'Production dependency audit plan records npm audit command, pass/fail criteria, advisory triage, and time-sensitive advisory boundary.',
  },
  T009: {
    phase: 'verify',
    role: 'network-source-planner',
    title: 'Plan network and source-refresh evidence',
    prompt:
      'Plan only. Prepare commands node scripts/verify-source-manifest.mjs --write, node scripts/verify-launch-evidence-sources.mjs --fetch --write, node scripts/verify-live-closeout-access-sources.mjs --fetch --write, node scripts/generate-launch-evidence-manifest.mjs --write --validate, expected artifacts, source URL drift checks, and boundary that this uses public URLs only and does not prove Supabase account access.',
    dependsOn: [],
    reviewOf: null,
    summary:
      'Network/source-refresh plan records public-source commands, live-closeout access source-audit coverage, expected artifacts, source-drift handling, and public-URL-only boundary.',
  },
  T010: {
    phase: 'verify',
    role: 'browser-journey-planner',
    title: 'Plan browser journey evidence',
    prompt:
      'Plan only. Prepare command npm run verify:commercial-browser, expected local Vite/Playwright behavior, routes and interactions covered, failure triage path, and boundary that this proves local browser journey only, not production uptime or owner-held proof.',
    dependsOn: [],
    reviewOf: null,
    summary:
      'Browser journey plan records local Vite/Playwright command, route/rendering proof expectations, failure triage, and local-only proof boundary.',
  },
  T011: {
    phase: 'synthesize',
    role: 'full-local-gate-planner',
    title: 'Plan final full-local gate evidence',
    prompt:
      'Plan only. Prepare final command npm run verify:commercial-full, expected summary fields for accessibility_smoke/browser_journey/network_and_audit/full_local_gate plus liveCloseoutAccessSourceAuditCoverage, post-summary checks, stop conditions, and launch decision boundary stays pilot-only.',
    dependsOn: [],
    reviewOf: null,
    summary:
      'Full-local gate plan records final verify:commercial-full command, expected releaseGateCoverage and live-closeout source-audit coverage fields, focused rerun strategy, final readbacks, and pilot-only launch boundary.',
  },
  T012: {
    phase: 'verify',
    role: 'adversarial-reviewer',
    title: 'Review optional gate baseline',
    prompt:
      'Plan-only review. Check whether the optional gate baseline clearly separates passed default-core evidence from unexecuted optional gates and does not imply full-local proof before approval.',
    dependsOn: ['T005'],
    reviewOf: 'T005',
    summary:
      'Review passed: baseline keeps default-core pass separate from unexecuted optional gates and requires approval before full-local evidence can be claimed.',
  },
  T013: {
    phase: 'verify',
    role: 'adversarial-reviewer',
    title: 'Review accessibility smoke plan',
    prompt:
      'Plan-only review. Check whether the accessibility plan names automated smoke proof only, preserves manual WCAG evidence as unresolved, and avoids conformance overclaiming.',
    dependsOn: ['T006'],
    reviewOf: 'T006',
    summary:
      'Review passed: accessibility plan limits proof to automated smoke checks and explicitly preserves manual WCAG evidence as unresolved.',
  },
  T014: {
    phase: 'verify',
    role: 'adversarial-reviewer',
    title: 'Review browser journey plan',
    prompt:
      'Plan-only review. Check whether the browser journey plan is local-only, does not imply hosted uptime, and has concrete route/rendering failure triage.',
    dependsOn: ['T010'],
    reviewOf: 'T010',
    summary:
      'Review passed: browser journey plan states local Vite/Playwright proof only and does not claim hosted uptime or owner-held evidence.',
  },
  T015: {
    phase: 'verify',
    role: 'adversarial-reviewer',
    title: 'Review network source plan',
    prompt:
      'Plan-only review. Check whether source refresh separates public-source drift from transient network failure, includes live closeout access source-audit coverage, uses public URLs only, and does not weaken source claims to force green status.',
    dependsOn: ['T009'],
    reviewOf: 'T009',
    summary:
      'Review passed: network/source plan includes live-closeout access source-audit coverage, separates public-source drift from transient failure, and forbids weakening source claims for green status.',
  },
  T016: {
    phase: 'verify',
    role: 'adversarial-reviewer',
    title: 'Review dependency audit plan',
    prompt:
      'Plan-only review. Check whether dependency audit criteria are time-sensitive, production scoped, and stop before breaking major upgrades.',
    dependsOn: ['T008'],
    reviewOf: 'T008',
    summary: 'Review passed: dependency audit plan is production-scoped, time-sensitive, and stops before breaking major upgrades.',
  },
  T017: {
    phase: 'verify',
    role: 'adversarial-reviewer',
    title: 'Review adversarial boundary plan',
    prompt:
      'Plan-only review. Check whether the adversarial boundary plan catches false-positive commercial readiness, proof-bucket confusion, and launch-decision upgrades beyond pilot-only.',
    dependsOn: ['T007'],
    reviewOf: 'T007',
    summary:
      'Review passed: adversarial plan preserves pilot-only launch decision and explicitly checks proof-bucket confusion and commercial-ready overclaiming.',
  },
};

function writeFile(root, relativePath, contents) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
}

function writeJson(root, relativePath, value) {
  writeFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeJsonl(root, relativePath, rows) {
  writeFile(root, relativePath, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
}

function readJsonl(root, relativePath) {
  return fs
    .readFileSync(path.join(root, relativePath), 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function readJson(root, relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function updateJson(root, relativePath, updater) {
  const value = readJson(root, relativePath);
  updater(value);
  writeJson(root, relativePath, value);
}

function updateText(root, relativePath, updater) {
  const absolutePath = path.join(root, relativePath);
  fs.writeFileSync(absolutePath, updater(fs.readFileSync(absolutePath, 'utf8')));
}

function updateWorkflowEvidence(root, taskId, evidence) {
  writeJsonl(
    root,
    WORKFLOW_BACKLOG,
    readJsonl(root, WORKFLOW_BACKLOG).map((item) => (item.id === taskId ? { ...item, evidence } : item)),
  );
  writeJsonl(
    root,
    WORKFLOW_RESULTS,
    readJsonl(root, WORKFLOW_RESULTS).map((item) => (item.taskId === taskId ? { ...item, evidence } : item)),
  );
  writeJsonl(
    root,
    WORKFLOW_CLAIMS,
    readJsonl(root, WORKFLOW_CLAIMS).map((item) =>
      item.type === 'evidence' && item.taskId === taskId ? { ...item, evidence } : item,
    ),
  );
}

function updateBacklogTask(root, taskId, updater) {
  writeJsonl(
    root,
    WORKFLOW_BACKLOG,
    readJsonl(root, WORKFLOW_BACKLOG).map((item) => (item.id === taskId ? updater(item) : item)),
  );
}

function summary() {
  return {
    status: 'passed',
    failedStepCount: 0,
    steps: [
      {
        id: 'full-local-approval-package-fixtures',
        label: 'Verify full-local approval-package failure fixtures',
        command: 'node scripts/verify-commercial-full-local-approval-package-fixtures.mjs',
        status: 'passed',
      },
    ],
    commercialReadinessState: {
      status: 'owner_evidence_required',
      launchDecision: 'pilot-only',
      ownerGateScoreboard: {
        remainingGateIds: [...GATE_IDS],
      },
      sourceArtifacts: {
        liveCloseoutAccessSourceAudit: 'docs/commercialization/live-closeout-access-source-audit-latest.json',
        liveCloseoutReadiness: 'docs/commercialization/live-closeout-readiness-latest.json',
      },
      liveCloseoutAccessSourceAuditCoverage: {
        artifact: 'docs/commercialization/live-closeout-access-source-audit-latest.json',
        readinessPath: 'docs/commercialization/live-closeout-readiness-latest.json',
        allPassed: true,
        networkFetch: true,
        sourceCount: 4,
        failedCount: 0,
        expectationCheckCount: 8,
        expectedTextMatchCount: 8,
      },
    },
    releaseGateCoverage: {
      default_core: {
        includedInThisInvocation: true,
        passedInThisInvocation: true,
      },
      accessibility_smoke: {
        includedInThisInvocation: false,
        passedInThisInvocation: null,
      },
      browser_journey: {
        includedInThisInvocation: false,
        passedInThisInvocation: null,
      },
      network_and_audit: {
        includedInThisInvocation: false,
        passedInThisInvocation: null,
      },
      full_local_gate: {
        includedInThisInvocation: false,
        passedInThisInvocation: null,
      },
      boundary: 'Null means the gate was not included and needs separate current command output.',
    },
    postSummaryFullLocalApprovalPackage: {
      command: 'node scripts/verify-commercial-full-local-approval-package.mjs',
      executionOrder: 'after post-summary redaction and launch-readiness alignment fixtures',
      includedInThisInvocation: true,
      condition:
        'Runs only for the default commercial verifier invocation where optional accessibility, browser journey, network/audit, and live gates are not included.',
      fixtureVerifier: {
        command: 'node scripts/verify-commercial-full-local-approval-package-fixtures.mjs',
        executionOrder: 'before or alongside the default commercial verifier static gate',
        boundary:
          'This fixture verifier builds temporary approval-package artifacts, mutates those copies, and proves drift fails closed. It writes no repo artifacts.',
      },
      boundary:
        'This verifier reads the approval plan, progress digest, workflow metadata, workflow backlog/results, package scripts, and current commercial summary only. It does not execute accessibility, browser, network, audit, full-local, worker, live, payment, credential, outreach, or owner-held evidence gates.',
    },
  };
}

function summaryMarkdown() {
  return `# Commercial Verification Summary

## Commercial Readiness State

| Field | Value |
| --- | --- |
| Readiness status | \`owner_evidence_required\` |
| Launch decision | \`pilot-only\` |
| Expected launch decision | \`pilot-only\` |
| Goal complete | \`no\` |
| Owner gate status | \`owner_evidence_required\` |
| Remaining owner/live gate count | 5 |

### Remaining Owner/Live Gates

| Gate | Status | Boundary |
| --- | --- | --- |
| manual_wcag_evidence | open | owner/live evidence required |
| real_stripe_test_checkout | open | owner/live evidence required |
| live_mrr_gt_zero | open | owner/live evidence required |
| three_committed_partners | open | owner/live evidence required |
| documented_outcomes | open | owner/live evidence required |

### Launch-Readiness Source Artifacts

| Artifact | Path |
| --- | --- |
| Launch evidence | \`docs/commercialization/launch-evidence-latest.json\` |
| Live closeout access source audit | \`docs/commercialization/live-closeout-access-source-audit-latest.json\` |
| Live closeout readiness | \`docs/commercialization/live-closeout-readiness-latest.json\` |
| Owner evidence closeout status | \`docs/commercialization/owner-evidence-closeout-status-latest.json\` |
| Remediation completion audit | \`docs/commercialization/remediation-completion-audit-latest.json\` |
| Remediation external gates | \`docs/commercialization/remediation-external-gates-latest.json\` |

This state summarizes current repo-generated launch and owner-evidence ledgers only. A passed repo-local verification summary does not upgrade the launch decision while owner/live gates remain unresolved.

### Live Closeout Access Source Audit Coverage

| Field | Value |
| --- | --- |
| Artifact | \`docs/commercialization/live-closeout-access-source-audit-latest.json\` |
| Readiness artifact | \`docs/commercialization/live-closeout-readiness-latest.json\` |
| Network fetch | \`yes\` |
| All passed | \`yes\` |
| Supabase/GitHub access references | 4 |
| Passed references | 4 |
| Failed references | 0 |
| Missing expectations | 0 |
| Unexpected references | 0 |
| Applies-to entries | 7 |
| Expectation checks | 8 |
| Expected-text matches | 8 |
| Fetched references | 4 |

#### Live Closeout Access Source Trace

| Source ID | Source URL |
| --- | --- |
| supabase-access-control | https://supabase.com/docs/guides/platform/access-control |
| supabase-cli-login | https://supabase.com/docs/reference/cli/supabase-login |
| supabase-functions-list | https://supabase.com/docs/reference/cli/supabase-functions-list |
| github-actions-secrets | https://docs.github.com/en/actions/concepts/security/secrets |

Live closeout access source audit proves only that the live closeout readiness artifact contains reviewed Supabase and GitHub official reference URLs and, when network fetch is enabled, that those pages matched expected access/secret-management text at verification time. It does not prove Supabase account access, functions API access, secret value validity, deployment completion, O*NET ingest completion, parse-resume deployment completion, live closeout, or commercial readiness.

## Release Gate Coverage

| Gate | Command | Included in this invocation | Passed in this invocation | Boundary |
| --- | --- | --- | --- | --- |
| default_core | \`npm run verify:commercial\` | \`yes\` | \`yes\` |  |
| browser_journey | \`npm run verify:commercial-browser\` | \`no\` | \`not included\` |  |
| accessibility_smoke | \`npm run verify:commercial-a11y\` | \`no\` | \`not included\` |  |
| network_and_audit | \`npm run verify:commercial-network\` | \`no\` | \`not included\` |  |
| full_local_gate | \`npm run verify:commercial-full\` | \`no\` | \`not included\` |  |

Release-gate coverage records only the steps included in this exact verifier invocation. Null means the gate was not included and needs separate current command output.

## Post-Summary Full-Local Approval Package

Command: \`node scripts/verify-commercial-full-local-approval-package.mjs\`
Execution order: \`after post-summary redaction and launch-readiness alignment fixtures\`
Included in this invocation: \`yes\`
Condition: Runs only for the default commercial verifier invocation where optional accessibility, browser journey, network/audit, and live gates are not included. Full-local and other optional invocations are expected to update releaseGateCoverage instead of preserving the plan-only approval package state.
Fixture verifier: \`node scripts/verify-commercial-full-local-approval-package-fixtures.mjs\`

This verifier reads the approval plan, progress digest, workflow metadata, workflow backlog/results, package scripts, and current commercial summary only. It does not execute accessibility, browser, network, audit, full-local, worker, live, payment, credential, outreach, or owner-held evidence gates.

This fixture verifier builds temporary approval-package artifacts, mutates those copies, and proves optional-gate overclaims, launch-decision upgrades, execution approval drift, missing review results, missing approval text, and missing package script wiring fail closed. It writes no repo artifacts.

## Step Results

| Step | Status | Command | Duration seconds | Exit code |
| --- | --- | --- | ---: | ---: |
| full-local-approval-package-fixtures | passed | \`node scripts/verify-commercial-full-local-approval-package-fixtures.mjs\` | 1.9 | 0 |
`;
}

function workflow(root) {
  return {
    schemaVersion: 1,
    name: 'commercial-full-local-gate-2026-06-05',
    goal: WORKFLOW_GOAL,
    sourceTask: WORKFLOW_GOAL,
    repoRoot: root,
    mode: 'plan-only',
    executionApproved: false,
    classification: {
      launch: true,
      mode: 'plan-only',
      tier: 2,
      score: 6,
      primarySkill: 'dynamic-workflow-backlog',
      reasons: [
        'large multi-surface task',
        'multi-phase or long-running execution',
        'risk level benefits from explicit verification gates',
      ],
      cautions: ['requires stop-and-ask before execution; use plan-only backlog until approved'],
      maxConcurrency: 4,
      maxAgents: 64,
    },
    automode: null,
    maxConcurrency: 4,
    maxAgents: 64,
  };
}

function task(id, reviewOf = null) {
  const contract = TASK_CONTRACTS[id];
  if (!contract) throw new Error(`Missing task contract for ${id}`);
  if ((contract.reviewOf || null) !== (reviewOf || null)) {
    throw new Error(`Fixture reviewOf mismatch for ${id}`);
  }
  return {
    id,
    phase: contract.phase,
    role: contract.role,
    title: contract.title,
    prompt: contract.prompt,
    status: 'pass',
    dependsOn: [...contract.dependsOn],
    reviewOf: contract.reviewOf,
    summary: contract.summary,
    evidence: TASK_EVIDENCE[id],
  };
}

function tasks() {
  return [
    task('T005'),
    task('T006'),
    task('T007'),
    task('T008'),
    task('T009'),
    task('T010'),
    task('T011'),
    task('T012', 'T005'),
    task('T013', 'T006'),
    task('T014', 'T010'),
    task('T015', 'T009'),
    task('T016', 'T008'),
    task('T017', 'T007'),
  ];
}

function results() {
  return tasks().map((item) => ({
    type: 'completion',
    taskId: item.id,
    status: 'pass',
    summary: item.summary,
    evidence: item.evidence,
  }));
}

function claims() {
  return [
    ...['T001', 'T002', 'T003', 'T004'].map((taskId) => ({ type: 'cancel', taskId })),
    ...tasks().map((item) => ({
      type: 'evidence',
      taskId: item.id,
      evidence: item.evidence,
    })),
    ...tasks()
      .filter((item) => item.reviewOf)
      .map((item) => ({
        type: 'review-task-added',
        taskId: item.id,
        reviewOf: item.reviewOf,
      })),
    { type: 'synthesis-check' },
  ];
}

function planText() {
  return `# Full Local Commercial Gate Execution Plan

Status: plan-only, approval required before execution

## Objective

This phase must not run production deploys, live Supabase/Stripe commands, payment changes, customer outreach, destructive cleanup, credential rotation, or worker execution/export.

## Current Baseline

npm run verify:commercial-summary-launch-readiness
npm run verify:commercial-a11y
npm run verify:commercial-browser
node scripts/verify-source-manifest.mjs --write
node scripts/verify-launch-evidence-sources.mjs --fetch --write
node scripts/verify-live-closeout-access-sources.mjs --fetch --write
node scripts/generate-launch-evidence-manifest.mjs --write --validate
docs/commercialization/live-closeout-access-source-audit-latest.json
docs/commercialization/live-closeout-readiness-latest.json
npm audit --omit=dev --audit-level=high
npm run verify:commercial-full
dynamic workflow executionApproved: false

Preserve \`commercialReadinessState.launchDecision: pilot-only\` while owner evidence gates remain open.

${GATE_IDS.join('\n')}

A full-local pass would prove a stronger local and public-source verification surface.
It would still not prove owner-held Stripe evidence.

## Approval Gate

Do not execute the commands below until the plan-only gate is approved.

## Step 1: Baseline Readback

Command: npm run verify:commercial-summary-launch-readiness

## Step 2: Accessibility Smoke

Command: npm run verify:commercial-a11y

## Step 3: Browser Journey

Command: npm run verify:commercial-browser

## Step 4: Network Source Refresh

Commands: node scripts/verify-source-manifest.mjs --write; node scripts/verify-launch-evidence-sources.mjs --fetch --write; node scripts/verify-live-closeout-access-sources.mjs --fetch --write; node scripts/generate-launch-evidence-manifest.mjs --write --validate

## Step 5: Production Dependency Audit

Command: npm audit --omit=dev --audit-level=high

## Step 6: Full Local Commercial Gate

Command: npm run verify:commercial-full

## Step 7: Final Readbacks

Command: npm run verify:commercial-summary-launch-readiness

## Stop Conditions

Stop before production deploys, live credentials, payment changes, customer outreach, destructive actions, worker export or worker execution.

## Evidence Boundary

A full-local pass still would not prove owner-held Stripe, partner, outcome, manual WCAG, production uptime, legal, procurement, or commercial-ready evidence.
`;
}

function digestText() {
  return `# Full Local Commercial Gate Progress Digest

Execution state: \`plan-only\`

This digest reports progress for the approval-gated planning workflow only.
It does not prove that the accessibility smoke, browser journey, network/source refresh, production dependency audit, or \`npm run verify:commercial-full\` gates have passed.
The dynamic workflow has \`executionApproved: false\`.
Explicit approval to execute the full-local command sequence.
The source-refresh plan includes the live closeout access source audit.
No synthetic market or customer data was used in this phase.
This digest proves only that the plan-only workflow is complete and reviewed.

${GATE_IDS.join('\n')}
`;
}

function readmeText() {
  return `# Dynamic Workflow Backlog

Approval plan: \`docs/commercialization/full-local-gate-execution-plan-2026-06-05.md\`
Progress digest: \`docs/commercialization/full-local-gate-progress-digest-2026-06-05.md\`

Scope includes live closeout access source URL fetch.

No workers have been executed or exported.
Do not run \`run-workers --execute\`, \`export-worktree-plan\`, or \`npm run verify:commercial-full\` until this plan-only gate is approved.

Wrapper: \`.dynamic-workflows/commercial-full-local-gate-2026-06-05/workflow.js\`
Verified runner path: \`${DYNAMIC_WORKFLOW_RUNNER}\`

- Status: \`node .dynamic-workflows/commercial-full-local-gate-2026-06-05/workflow.js status\`
- Next: \`node .dynamic-workflows/commercial-full-local-gate-2026-06-05/workflow.js next\`
- Preview workers: \`node .dynamic-workflows/commercial-full-local-gate-2026-06-05/workflow.js run-workers --dry-run\`
- Execute workers: \`node .dynamic-workflows/commercial-full-local-gate-2026-06-05/workflow.js run-workers --execute\`
- Dashboard: \`node .dynamic-workflows/commercial-full-local-gate-2026-06-05/workflow.js dashboard\`
- Export worktree plan: \`node .dynamic-workflows/commercial-full-local-gate-2026-06-05/workflow.js export-worktree-plan --out .orchestration/commercial-full-local-gate-2026-06-05.json\`
`;
}

function workflowScriptText() {
  return `#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runner = "${DYNAMIC_WORKFLOW_RUNNER}";
const command = process.argv[2] || 'status';
const args = process.argv.slice(3);
const result = spawnSync(process.execPath, [runner, command, '--run', __dirname, ...args], {
  stdio: 'inherit'
});
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
if (result.signal) {
  console.error(\`dynamic workflow runner terminated by signal \${result.signal}\`);
  process.exit(1);
}
process.exit(result.status ?? 1);
`;
}

function writeBaseArtifacts(root) {
  writeJson(root, PACKAGE_JSON, { scripts: packageScripts });
  writeJson(root, 'package-lock.json', { lockfileVersion: 3 });
  writeFile(root, 'scripts/verify-commercial-release.mjs', 'releaseGateCoverage\ncommercialReadinessState\n');
  writeFile(root, 'scripts/verify-commercial-accessibility.mjs', 'commercial accessibility smoke\n');
  writeFile(root, 'scripts/verify-commercial-browser.mjs', 'commercial browser journey\n');
  writeFile(root, 'scripts/verify-source-manifest.mjs', 'source manifest verifier\n');
  writeFile(root, 'scripts/verify-launch-evidence-sources.mjs', 'launch evidence sources verifier\n');
  writeFile(root, 'scripts/verify-live-closeout-access-sources.mjs', 'live closeout access sources verifier\n');
  writeFile(root, 'scripts/generate-launch-evidence-manifest.mjs', 'launch evidence manifest generator\n');
  writeJson(root, SUMMARY_JSON, summary());
  writeFile(root, SUMMARY_MD, summaryMarkdown());
  writeFile(root, PLAN_MD, planText());
  writeFile(root, DIGEST_MD, digestText());
  writeFile(root, WORKFLOW_README, readmeText());
  writeJson(root, WORKFLOW_JSON, workflow(root));
  writeFile(root, WORKFLOW_SCRIPT, workflowScriptText());
  writeJsonl(root, WORKFLOW_BACKLOG, tasks());
  writeJsonl(root, WORKFLOW_RESULTS, results());
  writeJsonl(root, WORKFLOW_CLAIMS, claims());
}

function runVerifier(root) {
  return spawnSync(process.execPath, [VERIFIER_SCRIPT, '--root', root], {
    cwd: path.dirname(root),
    encoding: 'utf8',
  });
}

function assertCase(name, mutate, expectedCode, expectedText) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-full-local-approval-${name}-`));
  try {
    writeBaseArtifacts(root);
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
    name: 'aligned-approval-package-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
  },
  {
    name: 'approval-package-does-not-prove-count-pass',
    expectedCode: 0,
    expectedText: '"doesNotProveCount": 6',
    mutate() {},
  },
  {
    name: 'full-local-gate-overclaim-fails',
    expectedCode: 1,
    expectedText: 'releaseGateCoverage.full_local_gate.included',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.releaseGateCoverage.full_local_gate.includedInThisInvocation = true;
        value.releaseGateCoverage.full_local_gate.passedInThisInvocation = true;
      });
    },
  },
  {
    name: 'launch-decision-upgrade-fails',
    expectedCode: 1,
    expectedText: 'summary.commercialReadinessState.launchDecision',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.commercialReadinessState.launchDecision = 'commercial-ready';
      });
    },
  },
  {
    name: 'workflow-execution-approval-fails',
    expectedCode: 1,
    expectedText: 'workflow.executionApproved',
    mutate(root) {
      updateJson(root, WORKFLOW_JSON, (value) => {
        value.executionApproved = true;
      });
    },
  },
  {
    name: 'workflow-execution-approval-missing-fails',
    expectedCode: 1,
    expectedText: 'workflow.executionApproved',
    mutate(root) {
      updateJson(root, WORKFLOW_JSON, (value) => {
        delete value.executionApproved;
      });
    },
  },
  {
    name: 'workflow-repo-root-drift-fails',
    expectedCode: 1,
    expectedText: 'workflow.repoRoot',
    mutate(root) {
      updateJson(root, WORKFLOW_JSON, (value) => {
        value.repoRoot = '/tmp/foreign-repo';
      });
    },
  },
  {
    name: 'workflow-safety-scope-drift-fails',
    expectedCode: 1,
    expectedText: 'no worker execution/export without approval',
    mutate(root) {
      updateJson(root, WORKFLOW_JSON, (value) => {
        value.goal = value.goal.replace('no worker execution/export without approval', 'worker execution ready');
        value.sourceTask = value.sourceTask.replace('no worker execution/export without approval', 'worker execution ready');
      });
    },
  },
  {
    name: 'workflow-source-task-drift-fails',
    expectedCode: 1,
    expectedText: 'workflow.goal',
    mutate(root) {
      updateJson(root, WORKFLOW_JSON, (value) => {
        value.sourceTask = value.sourceTask.replace('npm production audit', 'dependency review');
      });
    },
  },
  {
    name: 'workflow-live-closeout-source-scope-missing-fails',
    expectedCode: 1,
    expectedText: 'live closeout access source URL fetch',
    mutate(root) {
      updateJson(root, WORKFLOW_JSON, (value) => {
        value.goal = value.goal.replace('live closeout access source URL fetch, ', '');
        value.sourceTask = value.sourceTask.replace('live closeout access source URL fetch, ', '');
      });
    },
  },
  {
    name: 'workflow-stop-and-ask-caution-missing-fails',
    expectedCode: 1,
    expectedText: 'workflow_classification_missing_stop_and_ask_caution',
    mutate(root) {
      updateJson(root, WORKFLOW_JSON, (value) => {
        value.classification.cautions = [];
      });
    },
  },
  {
    name: 'workflow-task-title-drift-fails',
    expectedCode: 1,
    expectedText: 'workflow.task.T010.title',
    mutate(root) {
      updateBacklogTask(root, 'T010', (item) => ({ ...item, title: 'Plan hosted browser evidence' }));
    },
  },
  {
    name: 'workflow-task-prompt-drift-fails',
    expectedCode: 1,
    expectedText: 'workflow.task.T006.prompt',
    mutate(root) {
      updateBacklogTask(root, 'T006', (item) => ({
        ...item,
        prompt: item.prompt.replace('this is not manual WCAG conformance evidence', 'manual WCAG conformance is ready'),
      }));
    },
  },
  {
    name: 'workflow-task-dependency-drift-fails',
    expectedCode: 1,
    expectedText: 'workflow.task.T013.dependsOn',
    mutate(root) {
      updateBacklogTask(root, 'T013', (item) => ({ ...item, dependsOn: ['T010'] }));
    },
  },
  {
    name: 'workflow-task-evidence-contract-drift-fails',
    expectedCode: 1,
    expectedText: 'workflow.task.T006.evidence',
    mutate(root) {
      updateWorkflowEvidence(
        root,
        'T006',
        `${PLAN_MD}#step-3-browser-journey; scripts/verify-commercial-browser.mjs; ${PACKAGE_JSON} verify:commercial-browser`,
      );
    },
  },
  {
    name: 'workflow-evidence-anchor-drift-fails',
    expectedCode: 1,
    expectedText: 'workflow_task_evidence_anchor_missing',
    mutate(root) {
      updateText(root, PLAN_MD, (source) => source.replace('## Step 2: Accessibility Smoke', '## Accessibility Smoke'));
    },
  },
  {
    name: 'workflow-evidence-file-missing-fails',
    expectedCode: 1,
    expectedText: 'workflow_task_evidence_file_missing',
    mutate(root) {
      fs.rmSync(path.join(root, 'scripts/verify-commercial-browser.mjs'), { force: true });
    },
  },
  {
    name: 'workflow-evidence-marker-drift-fails',
    expectedCode: 1,
    expectedText: 'workflow_task_evidence_marker_missing',
    mutate(root) {
      updateText(root, 'scripts/verify-commercial-release.mjs', (source) => source.replace('releaseGateCoverage', 'coverageLedger'));
    },
  },
  {
    name: 'workflow-evidence-unparseable-fails',
    expectedCode: 1,
    expectedText: 'workflow_task_evidence_reference_unparseable',
    mutate(root) {
      updateWorkflowEvidence(root, 'T005', 'plain evidence without file refs');
    },
  },
  {
    name: 'missing-workflow-wrapper-fails',
    expectedCode: 1,
    expectedText: 'missing_file',
    mutate(root) {
      fs.rmSync(path.join(root, WORKFLOW_SCRIPT), { force: true });
    },
  },
  {
    name: 'workflow-wrapper-runner-drift-fails',
    expectedCode: 1,
    expectedText: DYNAMIC_WORKFLOW_RUNNER,
    mutate(root) {
      updateText(root, WORKFLOW_SCRIPT, (source) => source.replace(DYNAMIC_WORKFLOW_RUNNER, 'skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js'));
    },
  },
  {
    name: 'workflow-wrapper-commonjs-module-fails',
    expectedCode: 1,
    expectedText: "import { spawnSync } from 'node:child_process';",
    mutate(root) {
      updateText(root, WORKFLOW_SCRIPT, (source) =>
        source
          .replace("import { spawnSync } from 'node:child_process';\nimport path from 'node:path';\nimport { fileURLToPath } from 'node:url';\n\nconst __dirname = path.dirname(fileURLToPath(import.meta.url));", "const { spawnSync } = require('child_process');")
          .replace("[runner, command, '--run', __dirname, ...args]", "[runner, command, '--run', __dirname, ...args]"),
      );
    },
  },
  {
    name: 'workflow-wrapper-error-handling-missing-fails',
    expectedCode: 1,
    expectedText: 'if (result.error) {',
    mutate(root) {
      updateText(root, WORKFLOW_SCRIPT, (source) =>
        source.replace("if (result.error) {\n  console.error(result.error.message);\n  process.exit(1);\n}\n", ''),
      );
    },
  },
  {
    name: 'workflow-wrapper-signal-handling-missing-fails',
    expectedCode: 1,
    expectedText: 'if (result.signal) {',
    mutate(root) {
      updateText(root, WORKFLOW_SCRIPT, (source) =>
        source.replace(
          "if (result.signal) {\n  console.error(`dynamic workflow runner terminated by signal ${result.signal}`);\n  process.exit(1);\n}\n",
          '',
        ),
      );
    },
  },
  {
    name: 'workflow-wrapper-null-status-success-fails',
    expectedCode: 1,
    expectedText: 'process.exit(result.status ?? 1);',
    mutate(root) {
      updateText(root, WORKFLOW_SCRIPT, (source) =>
        source.replace('process.exit(result.status ?? 1);', 'process.exit(result.status || 0);'),
      );
    },
  },
  {
    name: 'readme-relative-runner-command-fails',
    expectedCode: 1,
    expectedText: 'readme_uses_unverified_relative_dynamic_workflow_runner',
    mutate(root) {
      updateText(root, WORKFLOW_README, (source) =>
        `${source}\n- Status: \`node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js status --run /tmp/run\`\n`,
      );
    },
  },
  {
    name: 'readme-wrapper-command-missing-fails',
    expectedCode: 1,
    expectedText: 'Preview workers: `node .dynamic-workflows/commercial-full-local-gate-2026-06-05/workflow.js run-workers --dry-run`',
    mutate(root) {
      updateText(root, WORKFLOW_README, (source) =>
        source.replace(
          '- Preview workers: `node .dynamic-workflows/commercial-full-local-gate-2026-06-05/workflow.js run-workers --dry-run`',
          '',
        ),
      );
    },
  },
  {
    name: 'missing-review-result-fails',
    expectedCode: 1,
    expectedText: 'missing_workflow_result',
    mutate(root) {
      writeJsonl(
        root,
        WORKFLOW_RESULTS,
        results().filter((item) => item.taskId !== 'T017'),
      );
    },
  },
  {
    name: 'duplicate-workflow-result-fails',
    expectedCode: 1,
    expectedText: 'duplicate_workflow_result',
    mutate(root) {
      writeJsonl(root, WORKFLOW_RESULTS, [...results(), results()[0]]);
    },
  },
  {
    name: 'unexpected-workflow-result-fails',
    expectedCode: 1,
    expectedText: 'unexpected_workflow_result',
    mutate(root) {
      writeJsonl(root, WORKFLOW_RESULTS, [...results(), { ...results()[0], taskId: 'T999' }]);
    },
  },
  {
    name: 'workflow-result-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'workflow.result.T006.summary',
    mutate(root) {
      writeJsonl(
        root,
        WORKFLOW_RESULTS,
        results().map((item) => (item.taskId === 'T006' ? { ...item, summary: 'Drifted summary' } : item)),
      );
    },
  },
  {
    name: 'workflow-result-evidence-drift-fails',
    expectedCode: 1,
    expectedText: 'workflow.result.T006.evidence',
    mutate(root) {
      writeJsonl(
        root,
        WORKFLOW_RESULTS,
        results().map((item) => (item.taskId === 'T006' ? { ...item, evidence: 'Drifted evidence' } : item)),
      );
    },
  },
  {
    name: 'missing-workflow-claims-file-fails',
    expectedCode: 1,
    expectedText: 'missing_file',
    mutate(root) {
      fs.rmSync(path.join(root, WORKFLOW_CLAIMS), { force: true });
    },
  },
  {
    name: 'missing-workflow-claim-evidence-fails',
    expectedCode: 1,
    expectedText: 'missing_workflow_claim_evidence',
    mutate(root) {
      writeJsonl(
        root,
        WORKFLOW_CLAIMS,
        claims().filter((item) => !(item.type === 'evidence' && item.taskId === 'T017')),
      );
    },
  },
  {
    name: 'workflow-claim-evidence-drift-fails',
    expectedCode: 1,
    expectedText: 'workflow.claim.T006.evidence',
    mutate(root) {
      writeJsonl(
        root,
        WORKFLOW_CLAIMS,
        claims().map((item) =>
          item.type === 'evidence' && item.taskId === 'T006' ? { ...item, evidence: 'Drifted evidence' } : item,
        ),
      );
    },
  },
  {
    name: 'duplicate-workflow-claim-evidence-fails',
    expectedCode: 1,
    expectedText: 'duplicate_workflow_claim_evidence',
    mutate(root) {
      const evidenceClaim = claims().find((item) => item.type === 'evidence' && item.taskId === 'T006');
      writeJsonl(root, WORKFLOW_CLAIMS, [...claims(), evidenceClaim]);
    },
  },
  {
    name: 'unexpected-workflow-claim-evidence-fails',
    expectedCode: 1,
    expectedText: 'unexpected_workflow_claim_evidence',
    mutate(root) {
      writeJsonl(root, WORKFLOW_CLAIMS, [...claims(), { type: 'evidence', taskId: 'T999', evidence: 'unexpected' }]);
    },
  },
  {
    name: 'missing-workflow-review-claim-fails',
    expectedCode: 1,
    expectedText: 'missing_workflow_review_claim',
    mutate(root) {
      writeJsonl(
        root,
        WORKFLOW_CLAIMS,
        claims().filter((item) => !(item.type === 'review-task-added' && item.taskId === 'T017')),
      );
    },
  },
  {
    name: 'workflow-review-claim-drift-fails',
    expectedCode: 1,
    expectedText: 'workflow.claim.T017.reviewOf',
    mutate(root) {
      writeJsonl(
        root,
        WORKFLOW_CLAIMS,
        claims().map((item) =>
          item.type === 'review-task-added' && item.taskId === 'T017' ? { ...item, reviewOf: 'T011' } : item,
        ),
      );
    },
  },
  {
    name: 'missing-workflow-synthesis-claim-fails',
    expectedCode: 1,
    expectedText: 'workflow.synthesisClaimCount',
    mutate(root) {
      writeJsonl(
        root,
        WORKFLOW_CLAIMS,
        claims().filter((item) => item.type !== 'synthesis-check'),
      );
    },
  },
  {
    name: 'unexpected-workflow-claim-type-fails',
    expectedCode: 1,
    expectedText: 'unexpected_workflow_claim_type',
    mutate(root) {
      writeJsonl(root, WORKFLOW_CLAIMS, [...claims(), { type: 'worker-executed', taskId: 'T006' }]);
    },
  },
  {
    name: 'missing-approval-text-fails',
    expectedCode: 1,
    expectedText: 'Do not execute the commands below until the plan-only gate is approved.',
    mutate(root) {
      updateText(root, PLAN_MD, (source) =>
        source.replace('Do not execute the commands below until the plan-only gate is approved.', ''),
      );
    },
  },
  {
    name: 'plan-live-closeout-access-source-command-missing-fails',
    expectedCode: 1,
    expectedText: 'node scripts/verify-live-closeout-access-sources.mjs --fetch --write',
    mutate(root) {
      updateText(root, PLAN_MD, (source) =>
        source
          .replace('node scripts/verify-live-closeout-access-sources.mjs --fetch --write\n', '')
          .replace('node scripts/verify-live-closeout-access-sources.mjs --fetch --write; ', ''),
      );
    },
  },
  {
    name: 'missing-package-script-fails',
    expectedCode: 1,
    expectedText: 'package.scripts.verify:commercial-full-local-approval-package',
    mutate(root) {
      updateJson(root, PACKAGE_JSON, (value) => {
        delete value.scripts['verify:commercial-full-local-approval-package'];
      });
    },
  },
  {
    name: 'missing-post-summary-metadata-fails',
    expectedCode: 1,
    expectedText: 'missing_post_summary_full_local_approval_package_metadata',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.postSummaryFullLocalApprovalPackage;
      });
    },
  },
  {
    name: 'missing-default-fixture-step-fails',
    expectedCode: 1,
    expectedText: 'missing_default_full_local_approval_package_fixture_step',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.steps = value.steps.filter((step) => step.id !== 'full-local-approval-package-fixtures');
      });
    },
  },
  {
    name: 'failed-default-fixture-step-fails',
    expectedCode: 1,
    expectedText: 'summary.steps.full-local-approval-package-fixtures.status',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        value.steps[0].status = 'failed';
      });
    },
  },
  {
    name: 'missing-summary-markdown-fails',
    expectedCode: 1,
    expectedText: 'missing_file',
    mutate(root) {
      fs.rmSync(path.join(root, SUMMARY_MD), { force: true });
    },
  },
  {
    name: 'summary-markdown-fixture-row-missing-fails',
    expectedCode: 1,
    expectedText: 'full-local-approval-package-fixtures | passed',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '| full-local-approval-package-fixtures | passed | `node scripts/verify-commercial-full-local-approval-package-fixtures.mjs` | 1.9 | 0 |',
          '',
        ),
      );
    },
  },
  {
    name: 'summary-markdown-boundary-missing-fails',
    expectedCode: 1,
    expectedText: 'It does not execute accessibility, browser, network, audit, full-local',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          'It does not execute accessibility, browser, network, audit, full-local, worker, live, payment, credential, outreach, or owner-held evidence gates.',
          '',
        ),
      );
    },
  },
  {
    name: 'summary-markdown-browser-gate-overclaim-fails',
    expectedCode: 1,
    expectedText: '| browser_journey | `npm run verify:commercial-browser` | `no` | `not included` |',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '| browser_journey | `npm run verify:commercial-browser` | `no` | `not included` |  |',
          '| browser_journey | `npm run verify:commercial-browser` | `yes` | `yes` |  |',
        ),
      );
    },
  },
  {
    name: 'summary-markdown-full-local-gate-overclaim-fails',
    expectedCode: 1,
    expectedText: '| full_local_gate | `npm run verify:commercial-full` | `no` | `not included` |',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '| full_local_gate | `npm run verify:commercial-full` | `no` | `not included` |  |',
          '| full_local_gate | `npm run verify:commercial-full` | `yes` | `yes` |  |',
        ),
      );
    },
  },
  {
    name: 'summary-markdown-launch-decision-overclaim-fails',
    expectedCode: 1,
    expectedText: '| Launch decision | `pilot-only` |',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace('| Launch decision | `pilot-only` |', '| Launch decision | `commercial-ready` |'),
      );
    },
  },
  {
    name: 'summary-markdown-readiness-status-overclaim-fails',
    expectedCode: 1,
    expectedText: '| Readiness status | `owner_evidence_required` |',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace('| Readiness status | `owner_evidence_required` |', '| Readiness status | `commercial_ready` |'),
      );
    },
  },
  {
    name: 'summary-markdown-owner-gate-missing-fails',
    expectedCode: 1,
    expectedText: '| real_stripe_test_checkout | open | owner/live evidence required |',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace('| real_stripe_test_checkout | open | owner/live evidence required |\n', ''),
      );
    },
  },
  {
    name: 'summary-markdown-source-artifact-missing-fails',
    expectedCode: 1,
    expectedText: '| Owner evidence closeout status | `docs/commercialization/owner-evidence-closeout-status-latest.json` |',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          '| Owner evidence closeout status | `docs/commercialization/owner-evidence-closeout-status-latest.json` |\n',
          '',
        ),
      );
    },
  },
  {
    name: 'summary-json-live-closeout-access-source-audit-missing-fails',
    expectedCode: 1,
    expectedText: 'summary.commercialReadinessState.liveCloseoutAccessSourceAuditCoverage.artifact',
    mutate(root) {
      updateJson(root, SUMMARY_JSON, (value) => {
        delete value.commercialReadinessState.liveCloseoutAccessSourceAuditCoverage;
      });
    },
  },
  {
    name: 'summary-markdown-live-closeout-access-source-audit-missing-fails',
    expectedCode: 1,
    expectedText: '### Live Closeout Access Source Audit Coverage',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          /### Live Closeout Access Source Audit Coverage[\s\S]*?## Release Gate Coverage/,
          '## Release Gate Coverage',
        ),
      );
    },
  },
  {
    name: 'summary-markdown-no-upgrade-boundary-missing-fails',
    expectedCode: 1,
    expectedText: 'A passed repo-local verification summary does not upgrade the launch decision while owner/live gates remain unresolved.',
    mutate(root) {
      updateText(root, SUMMARY_MD, (source) =>
        source.replace(
          'This state summarizes current repo-generated launch and owner-evidence ledgers only. A passed repo-local verification summary does not upgrade the launch decision while owner/live gates remain unresolved.',
          '',
        ),
      );
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText);
}

console.log(`Commercial full-local approval-package fixture verification passed: ${cases.length} cases.`);
