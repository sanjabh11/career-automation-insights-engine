#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-launch-evidence-alignment.mjs');

const LAUNCH_EVIDENCE_PATH = 'docs/commercialization/launch-evidence-latest.json';
const LAUNCH_EVIDENCE_MARKDOWN_PATH = 'docs/commercialization/launch-evidence-latest.md';
const CRM_JSON_PATH = 'docs/commercialization/launch-outreach-crm-latest.json';
const CRM_CSV_PATH = 'docs/commercialization/launch-outreach-crm-latest.csv';
const REMEDIATION_GATES_PATH = 'docs/commercialization/remediation-external-gates-latest.json';
const COMPLETION_AUDIT_PATH = 'docs/commercialization/remediation-completion-audit-latest.json';
const OWNER_CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const OWNER_HANDOFF_PATH = 'docs/commercialization/owner-evidence-handoff-latest.json';
const SOURCE_AUDIT_PATH = 'docs/commercialization/launch-evidence-source-audit-latest.json';
const COMMERCIAL_SUMMARY_PATH = 'docs/commercialization/commercial-verification-summary-latest.json';
const COMMERCIAL_SUMMARY_MARKDOWN_PATH = 'docs/commercialization/commercial-verification-summary-latest.md';
const GATE_IDS = [
  'manual_wcag_evidence',
  'real_stripe_test_checkout',
  'live_mrr_gt_zero',
  'three_committed_partners',
  'documented_outcomes',
];
const FIXTURE_CODE_OPTIMIZATION_TARGET_TASK = 'Launch evidence alignment fixture coverage';
const FIXTURE_PROGRESS_PHASE = 'launch-evidence-alignment-fixture-coverage';
const CRM_FIELDS = [
  'account_name',
  'website',
  'buyer_role',
  'pain_point',
  'trigger',
  'proof_asset',
  'outreach_angle',
  'status',
  'next_action',
  'objections',
  'confidence',
  'decision_boundary',
  'does_not_prove',
];
const PROGRESS_LANE_WEIGHTS = [
  ['Repo Map', 10],
  ['Security', 15],
  ['Readiness', 15],
  ['Sellability', 15],
  ['Market Pain Research', 20],
  ['Target Customers + Outreach', 10],
  ['Safe Fix Lane', 10],
  ['Synthesis + Validation', 5],
];
const RELEASE_GATE_COMMANDS = {
  default_core: 'npm run verify:commercial',
  browser_journey: 'npm run verify:commercial-browser',
  accessibility_smoke: 'npm run verify:commercial-a11y',
  network_and_audit: 'npm run verify:commercial-network',
  full_local_gate: 'npm run verify:commercial-full',
  typecheck: 'npx tsc --noEmit',
  diff_check: 'git diff --check',
  boundary:
    'These commands are release verification commands, not proof created by the launch-evidence manifest generator itself. Treat them as passed only when paired with current command output or a current commercial verification summary.',
};

function writeJson(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function completionGate(gateId) {
  return {
    id: gateId,
    label: gateId.replaceAll('_', ' '),
    status: 'blocked',
    neededEvidence: `${gateId} needed evidence`,
    riskIfSkipped: `${gateId} risk if skipped`,
    ownerAction: `${gateId} owner action`,
    ownerPrepCommand: `prepare ${gateId}`,
    nextCommand: `verify ${gateId}`,
  };
}

function ownerQueueItem(gateId) {
  return {
    id: gateId,
    ownerPrepCommand: `prepare ${gateId}`,
    nextCommand: `verify ${gateId}`,
  };
}

function handoffRow(gateId) {
  return {
    gateId,
    blockingOwnerActions: [`${gateId} blocking owner action`],
  };
}

function crmExport() {
  const rows = Array.from({ length: 2 }, (_, index) => ({
    account_name: `Segment ${index + 1}`,
    website: index === 0 ? 'https://www.w3.org/TR/WCAG22/' : 'https://docs.stripe.com/api/checkout/sessions',
    buyer_role: `Buyer ${index + 1}`,
    pain_point: `Pain ${index + 1}`,
    trigger: `Trigger ${index + 1}`,
    proof_asset: `Proof asset ${index + 1}`,
    outreach_angle: `Outreach angle ${index + 1}`,
    status: 'researched',
    next_action: `Next action ${index + 1}`,
    objections: `Objection ${index + 1}`,
    confidence: index === 0 ? 4 : 3,
    decision_boundary: 'Pilot-only manual founder-led outreach until owner/live evidence gates pass.',
    does_not_prove:
      'Does not prove contact consent, outreach delivery, buyer reply, design-partner commitment, revenue, outcome, legal compliance, or CRM/email automation.',
  }));

  return {
    artifact_json: CRM_JSON_PATH,
    artifact_csv: CRM_CSV_PATH,
    schema_fields: CRM_FIELDS,
    allowed_statuses: ['researched', 'contacted', 'replied', 'demoed', 'pilot', 'closed', 'rejected'],
    row_count: rows.length,
    rowCount: rows.length,
    rows,
    boundary:
      'CRM seed rows are manual planning artifacts derived from ranked segments. They do not send outreach, prove consent, prove replies, prove revenue, or replace a configured CRM/email system.',
  };
}

function sourceAudit() {
  return {
    schemaVersion: '2026-06-04.apo-launch-evidence-source-audit.v1',
    allPassed: true,
    sourceCount: 3,
    passedCount: 3,
    failedCount: 0,
    missingExpectationCount: 0,
    networkFetch: false,
    sources: [
      { url: 'https://docs.stripe.com/api/checkout/sessions', passed: true },
      { url: 'https://www.w3.org/TR/WCAG22/', passed: true },
      { url: 'https://www.workera.ai/product-overview', passed: true },
    ],
  };
}

function releaseGateCoverage() {
  return {
    default_core: {
      command: 'npm run verify:commercial',
      includedInThisInvocation: true,
      passedInThisInvocation: true,
    },
    browser_journey: {
      command: 'npm run verify:commercial-browser',
      includedInThisInvocation: false,
      passedInThisInvocation: null,
    },
    accessibility_smoke: {
      command: 'npm run verify:commercial-a11y',
      includedInThisInvocation: false,
      passedInThisInvocation: null,
    },
    network_and_audit: {
      command: 'npm run verify:commercial-network',
      includedInThisInvocation: false,
      passedInThisInvocation: null,
    },
    full_local_gate: {
      command: 'npm run verify:commercial-full',
      includedInThisInvocation: false,
      passedInThisInvocation: null,
    },
    typecheck: {
      command: 'npx tsc --noEmit',
      includedInThisInvocation: true,
      passedInThisInvocation: true,
      boundary: 'Included in the default commercial verifier as a repo-local TypeScript contract check.',
    },
    diff_check: {
      command: 'git diff --check',
      includedInThisInvocation: true,
      passedInThisInvocation: true,
      boundary:
        'Included in the default commercial verifier for tracked diff whitespace hygiene; the worktree-hygiene step separately checks untracked path policy.',
    },
    boundary:
      'Release-gate coverage records only the steps included in this exact verifier invocation. Null means the gate was not included and needs separate current command output.',
  };
}

function buildRequiredOutputTableCounts(value) {
  const proofBuckets = value.proof_buckets || {};
  const outreachPlan = value.outreach_plan || {};
  const crm = outreachPlan.crm_export || {};
  const fixReport = value.fix_report || {};

  return {
    scoreDimensionCount: Object.keys(value.scores || {}).length,
    proofBucketTypeCount: Object.keys(proofBuckets).length,
    hostedLiveProofCount: (proofBuckets.hosted_live || []).length,
    localProofCount: (proofBuckets.local || []).length,
    repoArtifactProofCount: (proofBuckets.repo_artifact || []).length,
    candidateShadowProofCount: (proofBuckets.candidate_shadow || []).length,
    roadmapProofCount: (proofBuckets.roadmap || []).length,
    gapCount: (value.gaps || []).length,
    painPointCount: (value.pain_points || []).length,
    targetCustomerCount: (value.target_customers || []).length,
    competitorSubstituteCount: (value.competitor_substitutes || []).length,
    outreachMilestoneCount: (outreachPlan.thirty_sixty_ninety_plan || []).length,
    outreachThirtyDayActionCount: (outreachPlan.thirty_days || []).length,
    outreachSixtyDayActionCount: (outreachPlan.sixty_days || []).length,
    outreachNinetyDayActionCount: (outreachPlan.ninety_days || []).length,
    objectionHandlingCount: (outreachPlan.objection_handling || []).length,
    objectionHandlingMatrixCount: (outreachPlan.objection_handling_matrix || []).length,
    crmSchemaFieldCount: (crm.schema_fields || []).length,
    crmAllowedStatusCount: (crm.allowed_statuses || []).length,
    crmRowCount: (crm.rows || []).length,
    fixReportCheckCount: (fixReport.checks_run || []).length,
    approvalGateCount: (fixReport.approval_gates || []).length,
    unresolvedBlockerCount: (fixReport.unresolved_blockers || []).length,
    implementationDecisionCount: (value.implementation_decisions || []).length,
    rejectedVariantCount: (value.rejected_variants || []).length,
    codeOptimizationReviewCount: (value.code_optimization_reviews || []).length,
    adversarialReviewCount: (value.adversarial_reviews || []).length,
    progressUpdateCount: (value.progress_updates || []).length,
    bottleneckLogCount: (value.bottleneck_log || []).length,
  };
}

function manifest() {
  const crm = crmExport();
  const gaps = GATE_IDS.map((gateId) => ({
    id: gateId,
    gate_id: gateId,
    gap: gateId.replaceAll('_', ' '),
    severity: 'P1',
    evidence: `${COMPLETION_AUDIT_PATH}#${gateId}`,
    framework_mapping: ['Commercial launch readiness gate'],
    needed_evidence: `${gateId} needed evidence`,
    buyer_impact: `${gateId} risk if skipped`,
    owner_action: `${gateId} owner action`,
    owner_prep_command: `prepare ${gateId}`,
    blocking_owner_actions: [`${gateId} blocking owner action`],
    next_command: `verify ${gateId}`,
    fix: `${gateId} owner action`,
    status: 'open',
  }));

  const value = {
    schema_version: 1,
    repo: {
      name: 'fixture',
      path: '/fixture',
      profile: 'ai-app',
      commit: 'fixture',
    },
    run: {
      name: 'fixture',
      mode: 'fix-safe',
      research_depth: 'deep',
      worker_mode: 'dry-run',
      generated_at: '2026-06-05T00:00:00.000Z',
      branch: 'main',
    },
    launch_decision: 'pilot-only',
    scores: {
      security: 4,
      readiness: 3,
      sellability: 4,
      evidence: 3,
      overall: 3,
    },
    proof_buckets: {
      hosted_live: [
        {
          label: 'Production calibration proof artifact',
          evidence: 'Synthetic fixture candidate live artifact exists.',
          source: 'docs/commercialization/production-calibration-proof-latest.json',
          status: 'candidate_live_artifact',
          boundary: 'Hosted/live candidate artifact only. Does not prove commercial readiness.',
        },
      ],
      local: [
        {
          label: 'Commercial release verifier',
          evidence: 'Fixture local release check passed.',
          source: 'npm run verify:commercial',
          status: 'present',
          boundary: 'Local proof only. Does not prove hosted runtime, owner evidence, or commercial readiness.',
        },
      ],
      repo_artifact: [
        {
          label: 'Remediation external gates ledger',
          evidence: 'Fixture external gate ledger is present.',
          source: REMEDIATION_GATES_PATH,
          status: 'present',
          boundary: 'Repo artifact only. Does not prove owner-held evidence or commercial readiness.',
        },
        {
          label: 'Remediation completion audit',
          evidence: 'Fixture completion audit is present.',
          source: COMPLETION_AUDIT_PATH,
          status: 'present',
          boundary: 'Repo artifact only. Does not prove owner-held evidence or commercial readiness.',
        },
        {
          label: 'Owner evidence closeout status',
          evidence: 'Fixture owner closeout status is present.',
          source: OWNER_CLOSEOUT_STATUS_PATH,
          status: 'present',
          boundary: 'Does not prove owner-held evidence.',
        },
        {
          label: 'Owner evidence handoff packet',
          evidence: 'Fixture owner handoff packet is present.',
          source: OWNER_HANDOFF_PATH,
          status: 'present',
          boundary: 'Does not prove external evidence.',
        },
        {
          label: 'Launch evidence source URL audit',
          evidence: 'Fixture source URL audit passed.',
          source: SOURCE_AUDIT_PATH,
          status: 'passed',
          boundary: 'Source URL audit proves source-page reachability only. Does not prove buyer demand.',
        },
        {
          label: 'Launch outreach CRM seed export',
          evidence: 'Fixture CRM export is generated.',
          source: CRM_JSON_PATH,
          status: 'generated',
          boundary: crm.boundary,
        },
      ],
      candidate_shadow: [
        {
          label: 'Founder-led pilot validation workflow',
          evidence: 'Fixture pilot workflow exists.',
          source: 'src/lib/commercialLaunchReadiness.ts',
          status: 'candidate_shadow',
          boundary: 'Candidate/shadow proof only. Does not prove partner commitments or commercial readiness.',
        },
      ],
      roadmap: [
        {
          label: 'Live MRR proof',
          evidence: 'Fixture live MRR proof remains owner-gated.',
          source: 'npm run verify:stripe-live-mrr',
          status: 'owner_required',
          boundary: 'Roadmap/owner-required proof only. Does not prove live revenue or commercial readiness.',
        },
      ],
    },
    gaps,
    pain_points: [
      {
        rank: 1,
        pain_point: 'Payment proof boundary',
        affected_buyer: 'Founder',
        source_evidence: ['https://docs.stripe.com/api/checkout/sessions'],
        willingness_to_pay_signal: 'Directional',
        repo_proof_fit: 'Fixture',
        confidence: 4,
      },
    ],
    target_customers: [
      {
        rank: 1,
        account_or_segment: 'Segment 1',
        pain: 'Pain 1',
        trigger: 'Trigger 1',
        decision_maker: 'Buyer 1',
        outreach_angle: 'Outreach angle 1',
        proof_to_show: 'Proof asset 1',
        confidence: 4,
      },
      {
        rank: 2,
        account_or_segment: 'Segment 2',
        pain: 'Pain 2',
        trigger: 'Trigger 2',
        decision_maker: 'Buyer 2',
        outreach_angle: 'Outreach angle 2',
        proof_to_show: 'Proof asset 2',
        confidence: 3,
      },
    ],
    competitor_substitutes: [
      {
        rank: 1,
        name: 'Workera',
        source_evidence: ['https://www.workera.ai/product-overview'],
      },
    ],
    outreach_plan: {
      decision_boundary: 'Manual founder-led pilots only until owner/live evidence gates pass.',
      crm_export: crm,
    },
    fix_report: {
      owner_action_queue_count: GATE_IDS.length,
      owner_prep_command_count: GATE_IDS.length,
      owner_prep_action_needed_count: 6,
      ledger_alignment: {
        status: 'generated_from_current_ledgers',
        expected_gate_ids: [...GATE_IDS],
        launch_gap_ids: [...GATE_IDS],
        launch_gap_gate_ids: [...GATE_IDS],
        owner_action_gate_ids: [...GATE_IDS],
        owner_handoff_gate_ids: [...GATE_IDS],
      },
      source_audit: {
        artifact: SOURCE_AUDIT_PATH,
        status: 'passed',
        all_passed: true,
        source_count: 3,
        passed_count: 3,
        failed_count: 0,
        missing_expectation_count: 0,
        network_fetch: false,
        current_manifest_source_urls: [
          'https://docs.stripe.com/api/checkout/sessions',
          'https://www.w3.org/TR/WCAG22/',
          'https://www.workera.ai/product-overview',
        ],
        audited_source_urls: [
          'https://docs.stripe.com/api/checkout/sessions',
          'https://www.w3.org/TR/WCAG22/',
          'https://www.workera.ai/product-overview',
        ],
        current_source_count: 3,
        audited_source_count: 3,
        url_alignment_passed: true,
        missing_source_urls: [],
        unexpected_source_urls: [],
      },
      checks_run: ['node scripts/generate-launch-evidence-manifest.mjs --write --validate'],
      checks_run_boundary: 'checks_run records only manifest-local commands.',
      release_gate_commands: RELEASE_GATE_COMMANDS,
      release_gate_coverage: releaseGateCoverage(),
      commercial_verification_summary: {
        json: COMMERCIAL_SUMMARY_PATH,
        markdown: COMMERCIAL_SUMMARY_MARKDOWN_PATH,
        boundary: 'Use this summary as evidence only for the exact verifier invocation it records.',
      },
      unresolved_blockers: [...GATE_IDS],
      approval_gates: [
        'No production deploys without owner approval.',
        'No payment changes or live Stripe actions without owner approval.',
        'No credential rotation performed by this repo-side verifier.',
        'No customer outreach performed by this repo-side verifier.',
      ],
    },
    adversarial_reviews: [
      {
        lane: 'launch decision',
        challenge: 'Commercial-ready would be an overclaim because owner/live gates remain incomplete.',
        result: 'Launch decision is pilot-only and final completion remains false.',
      },
      {
        lane: 'evidence',
        challenge: 'Passed local tests do not prove owner-held live or commercial evidence.',
        result: 'Owner-held gates remain explicit unresolved blockers.',
      },
      {
        lane: 'market',
        challenge: 'Source URLs do not prove willingness to pay for this product.',
        result: 'Market evidence remains directional until buyer replies, pilots, or revenue exist.',
      },
    ],
    implementation_decisions: [
      {
        decision: 'Keep launch evidence generated from current repo ledgers.',
        acceptance_check: 'Launch evidence alignment must pass only when manifest rows mirror current owner and remediation ledgers.',
        chosen_variant: 'minimal launch-evidence alignment fixture',
        files_changed: ['scripts/verify-launch-evidence-alignment.mjs'],
        tests_run: ['node scripts/verify-launch-evidence-alignment-fixtures.mjs'],
        proof: 'Fixture manifest includes implementation decision metadata and direct alignment checks reject missing fields.',
        reason: 'A generated manifest without implementation-decision evidence weakens the commercial launch handoff.',
      },
    ],
    rejected_variants: [
      {
        variant: 'Allow launch evidence alignment to ignore code optimization evidence.',
        reason_rejected: 'The orchestrator schema requires implementation decisions, rejected variants, and code optimization reviews for repo-side changes.',
        tradeoff: 'The selected verifier check adds a small fixture requirement but keeps launch evidence self-contained.',
        evidence: 'references/launch-evidence-schema.md defines the top-level arrays and code-optimization contract requires them after code changes.',
      },
    ],
    code_optimization_reviews: [
      {
        target_task: FIXTURE_CODE_OPTIMIZATION_TARGET_TASK,
        policy: 'strict',
        verdict: 'pass',
        minimality_score: 5,
        evidence: 'The fixture uses one implementation decision, one rejected variant, and one passing optimization review.',
        tests_or_checks: ['node scripts/verify-launch-evidence-alignment-fixtures.mjs'],
      },
    ],
    progress_updates: [
      {
        phase: FIXTURE_PROGRESS_PHASE,
        created_at: '2026-06-05T00:00:00.000Z',
        accomplished: [
          'Fixture commercial verification passed.',
          `Latest Code Optimization Gate review: ${FIXTURE_CODE_OPTIMIZATION_TARGET_TASK} (pass, minimality 5/5). The fixture uses one implementation decision, one rejected variant, and one passing optimization review.`,
        ],
        target_matrix: PROGRESS_LANE_WEIGHTS.map(([lane, targetPercent]) => ({
          lane,
          target_percent: targetPercent,
          current_percent: 85,
          status: 'running',
          evidence: [COMMERCIAL_SUMMARY_PATH],
          confidence: 4,
        })),
        pending: ['Owner evidence gates remain open.'],
        activities_remaining: {
          current_phase_actions: GATE_IDS.length,
          next_phase_actions: 1,
          next_phase: 'owner-held evidence closeout',
        },
        bottleneck: 'Owner-held evidence gates remain open.',
      },
    ],
    bottleneck_log: [
      {
        phase: 'owner-evidence-closeout',
        task_or_subtask: GATE_IDS.join(', '),
        elapsed_minutes: 0,
        last_update: '2026-06-05T00:00:00.000Z',
        root_cause: 'evidence gap',
        top_unblock_options: [
          'Complete manual WCAG evidence.',
          'Run Stripe test checkout proof.',
          'Attach partner and outcome evidence.',
        ],
      },
    ],
    ecc_ledger: {
      route: 'commercial-launch-readiness-orchestrator',
      decision: 'pilot-only',
    },
  };

  value.required_output_table_counts = buildRequiredOutputTableCounts(value);
  return value;
}

function renderCsv(crm) {
  return `${CRM_FIELDS.join(',')}\n${crm.rows.map((row) => CRM_FIELDS.map((field) => csvEscape(row[field])).join(',')).join('\n')}\n`;
}

function renderMarkdown(value) {
  return `# Launch Evidence Manifest

Decision: \`${value.launch_decision}\`
Validator: passed

This manifest is generated from repo ledgers. It is not a commercial-ready claim.

## Required Output Table Counts

${Object.entries(value.required_output_table_counts)
  .map(([field, count]) => `| ${field} | ${count} |`)
  .join('\n')}

## Gaps

${value.gaps.map((gap) => `- ${gap.gate_id}`).join('\n')}

## CRM Export Seed Rows

${CRM_CSV_PATH}

## Proof Buckets

${SOURCE_AUDIT_PATH}

## Fix Report

${COMMERCIAL_SUMMARY_PATH}

Release gate coverage

## Adversarial Review

## Progress Updates

Activities remaining

### Target Matrix

## Bottleneck Log

## Implementation Decisions

## Rejected Variants

## Code Optimization Reviews

## ECC Ledger

## Source Audit

URL alignment: \`passed\`
`;
}

function writeBaseArtifacts(root) {
  const value = manifest();
  writeJson(root, LAUNCH_EVIDENCE_PATH, value);
  fs.writeFileSync(path.join(root, LAUNCH_EVIDENCE_MARKDOWN_PATH), renderMarkdown(value));
  writeJson(root, CRM_JSON_PATH, value.outreach_plan.crm_export);
  fs.writeFileSync(path.join(root, CRM_CSV_PATH), renderCsv(value.outreach_plan.crm_export));
  writeJson(root, REMEDIATION_GATES_PATH, {
    goalComplete: false,
    ownerActionQueue: GATE_IDS.map(ownerQueueItem),
  });
  writeJson(root, COMPLETION_AUDIT_PATH, {
    goalComplete: false,
    remainingExternalGates: GATE_IDS.map(completionGate),
  });
  writeJson(root, OWNER_CLOSEOUT_STATUS_PATH, { goalComplete: false });
  writeJson(root, OWNER_HANDOFF_PATH, {
    ownerActionRows: GATE_IDS.map(handoffRow),
    ownerPrepReadiness: {
      ownerActionNeededCount: 6,
    },
  });
  writeJson(root, SOURCE_AUDIT_PATH, sourceAudit());
  writeJson(root, COMMERCIAL_SUMMARY_PATH, {
    status: 'passed',
    failedStepCount: 0,
    releaseGateCoverage: releaseGateCoverage(),
  });
  fs.writeFileSync(path.join(root, COMMERCIAL_SUMMARY_MARKDOWN_PATH), '# Commercial Verification Summary\n');
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

function assertCase(name, mutate, expectedCode, expectedText) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-launch-evidence-alignment-${name}-`));
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
    name: 'aligned-launch-evidence-manifest-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
  },
  {
    name: 'launch-decision-drift-fails',
    expectedCode: 1,
    expectedText: 'manifest.launch_decision',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.launch_decision = 'commercial-ready';
      });
    },
  },
  {
    name: 'gap-id-drift-fails',
    expectedCode: 1,
    expectedText: 'manifest.gaps.ids',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.gaps.pop();
      });
    },
  },
  {
    name: 'required-output-table-count-drift-fails',
    expectedCode: 1,
    expectedText: 'manifest.required_output_table_counts',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.required_output_table_counts.gapCount += 1;
      });
    },
  },
  {
    name: 'owner-action-next-command-drift-fails',
    expectedCode: 1,
    expectedText: 'queue_next_command',
    mutate(root) {
      updateJson(root, REMEDIATION_GATES_PATH, (value) => {
        value.ownerActionQueue[1].nextCommand = 'stale command';
      });
    },
  },
  {
    name: 'handoff-blocking-actions-drift-fails',
    expectedCode: 1,
    expectedText: 'blocking_owner_actions',
    mutate(root) {
      updateJson(root, OWNER_HANDOFF_PATH, (value) => {
        value.ownerActionRows[0].blockingOwnerActions = ['different action'];
      });
    },
  },
  {
    name: 'source-audit-url-drift-fails',
    expectedCode: 1,
    expectedText: 'manifest.audited_source_urls',
    mutate(root) {
      updateJson(root, SOURCE_AUDIT_PATH, (value) => {
        value.sources.pop();
        value.sourceCount = 2;
        value.passedCount = 2;
      });
    },
  },
  {
    name: 'crm-json-drift-fails',
    expectedCode: 1,
    expectedText: 'crm_json_equals_manifest_crm_export',
    mutate(root) {
      updateJson(root, CRM_JSON_PATH, (value) => {
        value.rows[0].status = 'contacted';
      });
    },
  },
  {
    name: 'crm-row-count-drift-fails',
    expectedCode: 1,
    expectedText: 'crm_row_count_mismatch',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.outreach_plan.crm_export.rowCount += 1;
      });
      updateJson(root, CRM_JSON_PATH, (value) => {
        value.rowCount += 1;
      });
    },
  },
  {
    name: 'crm-csv-drift-fails',
    expectedCode: 1,
    expectedText: 'crm_csv_row_mismatch',
    mutate(root) {
      updateText(root, CRM_CSV_PATH, (source) => source.replace('researched', 'contacted'));
    },
  },
  {
    name: 'markdown-decision-boundary-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_text',
    mutate(root) {
      updateText(root, LAUNCH_EVIDENCE_MARKDOWN_PATH, (source) =>
        source.replace('It is not a commercial-ready claim.', 'Commercial-ready claim.'),
      );
    },
  },
  {
    name: 'missing-release-gate-coverage-fails',
    expectedCode: 1,
    expectedText: 'release_gate_coverage_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        delete value.fix_report.release_gate_coverage;
      });
    },
  },
  {
    name: 'release-gate-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'manifest.fix_report.release_gate_coverage',
    mutate(root) {
      updateJson(root, COMMERCIAL_SUMMARY_PATH, (value) => {
        value.releaseGateCoverage.default_core.passedInThisInvocation = false;
      });
    },
  },
  {
    name: 'release-gate-optional-overclaim-fails',
    expectedCode: 1,
    expectedText: 'release_gate_not_included_has_pass_status',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.fix_report.release_gate_coverage.browser_journey.passedInThisInvocation = true;
      });
      updateJson(root, COMMERCIAL_SUMMARY_PATH, (value) => {
        value.releaseGateCoverage.browser_journey.passedInThisInvocation = true;
      });
    },
  },
  {
    name: 'markdown-release-gate-coverage-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_text',
    mutate(root) {
      updateText(root, LAUNCH_EVIDENCE_MARKDOWN_PATH, (source) =>
        source.replace('Release gate coverage', 'Release gate commands only'),
      );
    },
  },
  {
    name: 'missing-proof-bucket-key-fails',
    expectedCode: 1,
    expectedText: 'proof_bucket_missing_or_empty',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        delete value.proof_buckets.roadmap;
      });
    },
  },
  {
    name: 'proof-bucket-item-field-missing-fails',
    expectedCode: 1,
    expectedText: 'proof_bucket_item_field_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        delete value.proof_buckets.repo_artifact[0].evidence;
      });
    },
  },
  {
    name: 'proof-bucket-boundary-missing-fails',
    expectedCode: 1,
    expectedText: 'proof_bucket_item_boundary_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.proof_buckets.local[0].boundary = 'Local command passed.';
      });
    },
  },
  {
    name: 'proof-bucket-local-boundary-missing-fails',
    expectedCode: 1,
    expectedText: 'proof_bucket_local_boundary_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.proof_buckets.local[0].boundary = 'Does not prove hosted runtime or owner evidence.';
      });
    },
  },
  {
    name: 'proof-bucket-candidate-boundary-missing-fails',
    expectedCode: 1,
    expectedText: 'proof_bucket_candidate_boundary_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.proof_buckets.candidate_shadow[0].status = 'present';
        value.proof_buckets.candidate_shadow[0].boundary = 'Does not prove partner commitments or commercial readiness.';
      });
    },
  },
  {
    name: 'proof-bucket-roadmap-boundary-missing-fails',
    expectedCode: 1,
    expectedText: 'proof_bucket_roadmap_boundary_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.proof_buckets.roadmap[0].status = 'present';
        value.proof_buckets.roadmap[0].boundary = 'Does not prove live revenue or commercial readiness.';
      });
    },
  },
  {
    name: 'missing-progress-updates-fails',
    expectedCode: 1,
    expectedText: 'progress_updates_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.progress_updates = [];
      });
    },
  },
  {
    name: 'missing-bottleneck-log-fails',
    expectedCode: 1,
    expectedText: 'bottleneck_log_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.bottleneck_log = [];
      });
    },
  },
  {
    name: 'progress-phase-stale-fails',
    expectedCode: 1,
    expectedText: 'progress_update_phase_stale',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.progress_updates[0].phase = 'stale-progress-phase';
      });
    },
  },
  {
    name: 'progress-latest-review-missing-fails',
    expectedCode: 1,
    expectedText: 'progress_update_latest_review_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.progress_updates[0].accomplished = ['Fixture commercial verification passed.'];
      });
    },
  },
  {
    name: 'progress-target-lane-weight-drift-fails',
    expectedCode: 1,
    expectedText: 'progress_target_lane_weight_mismatch',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.progress_updates[0].target_matrix[1].target_percent = 10;
      });
    },
  },
  {
    name: 'progress-target-lane-status-invalid-fails',
    expectedCode: 1,
    expectedText: 'progress_target_lane_status_invalid',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.progress_updates[0].target_matrix[0].status = 'complete';
      });
    },
  },
  {
    name: 'progress-target-lane-confidence-invalid-fails',
    expectedCode: 1,
    expectedText: 'progress_target_lane_confidence_invalid',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.progress_updates[0].target_matrix[0].confidence = 6;
      });
    },
  },
  {
    name: 'progress-activities-remaining-missing-fails',
    expectedCode: 1,
    expectedText: 'progress_activities_remaining_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        delete value.progress_updates[0].activities_remaining;
      });
    },
  },
  {
    name: 'progress-activities-next-phase-missing-fails',
    expectedCode: 1,
    expectedText: 'progress_activities_remaining_next_phase_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.progress_updates[0].activities_remaining.next_phase = '';
      });
    },
  },
  {
    name: 'bottleneck-unblock-option-empty-fails',
    expectedCode: 1,
    expectedText: 'bottleneck_unblock_option_empty',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.bottleneck_log[0].top_unblock_options[1] = '';
      });
    },
  },
  {
    name: 'bottleneck-root-cause-drift-fails',
    expectedCode: 1,
    expectedText: 'bottleneck.0.root_cause',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.bottleneck_log[0].root_cause = 'testing loop';
      });
    },
  },
  {
    name: 'missing-implementation-decisions-fails',
    expectedCode: 1,
    expectedText: 'implementation_decisions_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.implementation_decisions = [];
      });
    },
  },
  {
    name: 'implementation-decision-field-missing-fails',
    expectedCode: 1,
    expectedText: 'implementation_decision_field_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        delete value.implementation_decisions[0].proof;
      });
    },
  },
  {
    name: 'missing-rejected-variants-fails',
    expectedCode: 1,
    expectedText: 'rejected_variants_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.rejected_variants = [];
      });
    },
  },
  {
    name: 'missing-code-optimization-reviews-fails',
    expectedCode: 1,
    expectedText: 'code_optimization_reviews_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.code_optimization_reviews = [];
      });
    },
  },
  {
    name: 'code-optimization-review-verdict-fails',
    expectedCode: 1,
    expectedText: 'code_optimization_review_not_passed',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.code_optimization_reviews[0].verdict = 'needs-retry';
      });
    },
  },
  {
    name: 'markdown-code-optimization-section-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_text',
    mutate(root) {
      updateText(root, LAUNCH_EVIDENCE_MARKDOWN_PATH, (source) =>
        source.replace('## Code Optimization Reviews', '## Optimization Notes'),
      );
    },
  },
  {
    name: 'missing-adversarial-reviews-fails',
    expectedCode: 1,
    expectedText: 'adversarial_reviews_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.adversarial_reviews = [];
      });
    },
  },
  {
    name: 'adversarial-review-field-missing-fails',
    expectedCode: 1,
    expectedText: 'adversarial_review_field_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        delete value.adversarial_reviews[0].result;
      });
    },
  },
  {
    name: 'adversarial-review-lane-missing-fails',
    expectedCode: 1,
    expectedText: 'adversarial_review_required_lane_missing',
    mutate(root) {
      updateJson(root, LAUNCH_EVIDENCE_PATH, (value) => {
        value.adversarial_reviews = value.adversarial_reviews.filter((review) => review.lane !== 'market');
      });
    },
  },
  {
    name: 'markdown-adversarial-section-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_text',
    mutate(root) {
      updateText(root, LAUNCH_EVIDENCE_MARKDOWN_PATH, (source) =>
        source.replace('## Adversarial Review', '## Review Notes'),
      );
    },
  },
  {
    name: 'commercial-summary-running-zero-failures-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate(root) {
      updateJson(root, COMMERCIAL_SUMMARY_PATH, (value) => {
        value.status = 'running';
        value.failedStepCount = 0;
      });
    },
  },
  {
    name: 'commercial-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'commercial_summary_not_current_pass',
    mutate(root) {
      updateJson(root, COMMERCIAL_SUMMARY_PATH, (value) => {
        value.status = 'failed';
        value.failedStepCount = 1;
      });
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText);
}

console.log(`Launch evidence alignment fixture verification passed: ${cases.length} cases.`);
