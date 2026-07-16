#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const OUTPUT_JSON = 'docs/commercialization/launch-evidence-latest.json';
const OUTPUT_MD = 'docs/commercialization/launch-evidence-latest.md';
const OUTPUT_CRM_JSON = 'docs/commercialization/launch-outreach-crm-latest.json';
const OUTPUT_CRM_CSV = 'docs/commercialization/launch-outreach-crm-latest.csv';
const REMEDIATION_GATES_JSON = 'docs/commercialization/remediation-external-gates-latest.json';
const COMPLETION_AUDIT_JSON = 'docs/commercialization/remediation-completion-audit-latest.json';
const OWNER_CLOSEOUT_STATUS_JSON = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const OWNER_HANDOFF_JSON = 'docs/commercialization/owner-evidence-handoff-latest.json';
const LAUNCH_SOURCE_AUDIT_JSON = 'docs/commercialization/launch-evidence-source-audit-latest.json';
const FULL_LOCAL_PLAN_MD = 'docs/commercialization/full-local-gate-execution-plan-2026-06-05.md';
const PHASE_LEDGER_JSONL = '.phase-loop/phase-ledger.jsonl';
const COMMERCIAL_VERIFICATION_SUMMARY_JSON =
  'docs/commercialization/commercial-verification-summary-latest.json';
const COMMERCIAL_VERIFICATION_SUMMARY_MD =
  'docs/commercialization/commercial-verification-summary-latest.md';
const VALIDATOR_PATH =
  process.env.LAUNCH_EVIDENCE_VALIDATOR ||
  '/Users/sanjayb/.codex/skills/commercial-launch-readiness-orchestrator/scripts/validate_launch_evidence.py';
const MANIFEST_LOCAL_CHECKS = [
  'node scripts/generate-launch-evidence-manifest.mjs --write --validate',
  `python3 ${VALIDATOR_PATH} ${path.join(root, OUTPUT_JSON)} --require-repo-exists`,
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
const RELEASE_GATE_COVERAGE_BOUNDARY =
  'Release-gate coverage records only the steps included in the exact verifier invocation. Null means the gate was not included and needs separate current command output.';

function hasFlag(name) {
  return process.argv.includes(name);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function readJsonl(relativePath) {
  if (!exists(relativePath)) return [];
  return read(relativePath)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function buildReleaseGateCoverage(commercialSummary) {
  const sourceCoverage = commercialSummary?.releaseGateCoverage || {};
  const coverage = {};

  for (const [gateId, command] of Object.entries(RELEASE_GATE_COMMANDS)) {
    if (gateId === 'boundary') continue;

    const sourceGate = sourceCoverage[gateId] || {};
    coverage[gateId] = {
      command: sourceGate.command || command,
      includedInThisInvocation: sourceGate.includedInThisInvocation === true,
      passedInThisInvocation:
        sourceGate.passedInThisInvocation === true
          ? true
          : sourceGate.passedInThisInvocation === false
            ? false
            : null,
    };

    if (typeof sourceGate.boundary === 'string' && sourceGate.boundary.trim()) {
      coverage[gateId].boundary = sourceGate.boundary;
    }
  }

  coverage.boundary = sourceCoverage.boundary || RELEASE_GATE_COVERAGE_BOUNDARY;
  return coverage;
}

function runGit(args, fallback = 'unknown') {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function statusForGap(status) {
  if (['locally_proven', 'locally_proven_with_scope_limit', 'externally_proven_redacted_evidence_attached'].includes(status)) {
    return 'done';
  }
  if (status === 'manual_wcag_evidence_attached') return 'done';
  if (status === 'satisfied_by_mapping_adapter_and_us_basis_disclosure') return 'done';
  return 'open';
}

function severityForGate(gateId) {
  if (['real_stripe_test_checkout', 'live_mrr_gt_zero', 'manual_wcag_evidence'].includes(gateId)) return 'P1';
  if (['three_committed_partners', 'documented_outcomes', 'production_calibration_run', 'authenticated_live_artifact_e2e'].includes(gateId)) return 'P1';
  return 'P2';
}

function frameworkMappingForGate(gateId) {
  const mappings = {
    manual_wcag_evidence: ['WCAG 2.2 A/AA', 'WCAG-EM manual evaluation evidence'],
    real_stripe_test_checkout: ['Stripe test-mode checkout proof', 'Secure payment verification boundary'],
    production_calibration_run: ['NIST AI RMF Measure', 'Model-card and calibration evidence boundary'],
    authenticated_live_artifact_e2e: ['OWASP ASVS authenticated workflow evidence', 'Supabase RLS/RPC proof boundary'],
    live_mrr_gt_zero: ['Commercial revenue evidence gate', 'Stripe live-mode read-only MRR proof'],
    three_committed_partners: ['Commercial design-partner validation', 'Permissioned evidence record boundary'],
    documented_outcomes: ['Case-study evidence governance', 'Permissioned outcome evidence boundary'],
  };
  return mappings[gateId] || ['Commercial launch readiness gate'];
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim()))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function collectPainPointSourceUrls(painPoints) {
  return uniqueSorted(
    (painPoints || []).flatMap((painPoint) =>
      Array.isArray(painPoint.source_evidence) ? painPoint.source_evidence : []
    )
  );
}

function collectCompetitorSourceUrls(competitorSubstitutes) {
  return uniqueSorted(
    (competitorSubstitutes || []).flatMap((item) =>
      Array.isArray(item.source_evidence) ? item.source_evidence : []
    )
  );
}

function collectCrmSourceUrls(crmExport) {
  return uniqueSorted(
    (crmExport?.rows || [])
      .map((row) => row.website)
      .filter((value) => /^https?:\/\//.test(value))
  );
}

function collectLaunchEvidenceSourceUrls(manifest) {
  return uniqueSorted([
    ...collectPainPointSourceUrls(manifest.pain_points || []),
    ...collectCompetitorSourceUrls(manifest.competitor_substitutes || []),
    ...collectCrmSourceUrls(manifest.outreach_plan?.crm_export),
  ]);
}

function buildRequiredOutputTableCounts(manifest) {
  const proofBuckets = manifest.proof_buckets || {};
  const outreachPlan = manifest.outreach_plan || {};
  const crmExport = outreachPlan.crm_export || {};
  const fixReport = manifest.fix_report || {};

  return {
    scoreDimensionCount: Object.keys(manifest.scores || {}).length,
    proofBucketTypeCount: Object.keys(proofBuckets).length,
    hostedLiveProofCount: (proofBuckets.hosted_live || []).length,
    localProofCount: (proofBuckets.local || []).length,
    repoArtifactProofCount: (proofBuckets.repo_artifact || []).length,
    candidateShadowProofCount: (proofBuckets.candidate_shadow || []).length,
    roadmapProofCount: (proofBuckets.roadmap || []).length,
    gapCount: (manifest.gaps || []).length,
    painPointCount: (manifest.pain_points || []).length,
    targetCustomerCount: (manifest.target_customers || []).length,
    competitorSubstituteCount: (manifest.competitor_substitutes || []).length,
    outreachMilestoneCount: (outreachPlan.thirty_sixty_ninety_plan || []).length,
    outreachThirtyDayActionCount: (outreachPlan.thirty_days || []).length,
    outreachSixtyDayActionCount: (outreachPlan.sixty_days || []).length,
    outreachNinetyDayActionCount: (outreachPlan.ninety_days || []).length,
    objectionHandlingCount: (outreachPlan.objection_handling || []).length,
    objectionHandlingMatrixCount: (outreachPlan.objection_handling_matrix || []).length,
    crmSchemaFieldCount: (crmExport.schema_fields || []).length,
    crmAllowedStatusCount: (crmExport.allowed_statuses || []).length,
    crmRowCount: (crmExport.rows || []).length,
    fixReportCheckCount: (fixReport.checks_run || []).length,
    approvalGateCount: (fixReport.approval_gates || []).length,
    unresolvedBlockerCount: (fixReport.unresolved_blockers || []).length,
    implementationDecisionCount: (manifest.implementation_decisions || []).length,
    rejectedVariantCount: (manifest.rejected_variants || []).length,
    codeOptimizationReviewCount: (manifest.code_optimization_reviews || []).length,
    adversarialReviewCount: (manifest.adversarial_reviews || []).length,
    progressUpdateCount: (manifest.progress_updates || []).length,
    bottleneckLogCount: (manifest.bottleneck_log || []).length,
  };
}

function collectSourceAuditUrls(sourceAudit) {
  return uniqueSorted((sourceAudit?.sources || []).map((source) => source.url));
}

function diffValues(expected, actual) {
  return {
    missing: expected.filter((value) => !actual.includes(value)),
    unexpected: actual.filter((value) => !expected.includes(value)),
  };
}

function validateLaunchEvidenceAlignment(manifest) {
  const errors = [];
  const completionAudit = readJson(COMPLETION_AUDIT_JSON);
  const gates = readJson(REMEDIATION_GATES_JSON);
  const ownerHandoff = exists(OWNER_HANDOFF_JSON) ? readJson(OWNER_HANDOFF_JSON) : null;
  const expectedGateIds = (completionAudit.remainingExternalGates || []).map((gate) => gate.id);
  const launchGapIds = (manifest.gaps || []).map((gap) => gap.id);
  const launchGapGateIds = (manifest.gaps || []).map((gap) => gap.gate_id);
  const unresolvedBlockers = manifest.fix_report?.unresolved_blockers || [];
  const ownerActionGateIds = (gates.ownerActionQueue || []).map((item) => item.id);
  const handoffGateIds = (ownerHandoff?.ownerActionRows || []).map((row) => row.gateId);

  if (!arraysEqual(launchGapIds, expectedGateIds)) {
    errors.push({
      type: 'launch_gap_ids_mismatch',
      expected: expectedGateIds,
      actual: launchGapIds,
    });
  }

  if (!arraysEqual(launchGapGateIds, expectedGateIds)) {
    errors.push({
      type: 'launch_gap_gate_ids_mismatch',
      expected: expectedGateIds,
      actual: launchGapGateIds,
    });
  }

  if (!arraysEqual(unresolvedBlockers, expectedGateIds)) {
    errors.push({
      type: 'unresolved_blockers_mismatch',
      expected: expectedGateIds,
      actual: unresolvedBlockers,
    });
  }

  if (!arraysEqual(ownerActionGateIds, expectedGateIds)) {
    errors.push({
      type: 'owner_action_queue_mismatch',
      expected: expectedGateIds,
      actual: ownerActionGateIds,
    });
  }

  if (ownerHandoff && !arraysEqual(handoffGateIds, expectedGateIds)) {
    errors.push({
      type: 'owner_handoff_gate_ids_mismatch',
      expected: expectedGateIds,
      actual: handoffGateIds,
    });
  }

  for (const gap of manifest.gaps || []) {
    if (gap.id !== gap.gate_id) {
      errors.push({
        type: 'gap_id_gate_id_mismatch',
        gap: gap.gap,
        id: gap.id,
        gate_id: gap.gate_id,
      });
    }
    if (gap.evidence !== `${COMPLETION_AUDIT_JSON}#${gap.gate_id}`) {
      errors.push({
        type: 'gap_evidence_anchor_mismatch',
        gate_id: gap.gate_id,
        expected: `${COMPLETION_AUDIT_JSON}#${gap.gate_id}`,
        actual: gap.evidence,
      });
    }
  }

  return {
    valid: errors.length === 0,
    expected_gate_ids: expectedGateIds,
    launch_gap_ids: launchGapIds,
    launch_gap_gate_ids: launchGapGateIds,
    unresolved_blockers: unresolvedBlockers,
    owner_action_gate_ids: ownerActionGateIds,
    owner_handoff_gate_ids: handoffGateIds,
    error_count: errors.length,
    errors,
    boundary:
      'Ledger alignment proves launch-evidence gap traceability to repo-generated remediation ledgers only; it does not prove external owner evidence or commercial readiness.',
  };
}

function validateLaunchSourceAuditAlignment(manifest) {
  const sourceAudit = manifest.fix_report?.source_audit || {};
  const expectedSourceUrls = collectLaunchEvidenceSourceUrls(manifest);
  const auditedSourceUrls = Array.isArray(sourceAudit.audited_source_urls)
    ? sourceAudit.audited_source_urls
    : collectSourceAuditUrls(exists(LAUNCH_SOURCE_AUDIT_JSON) ? readJson(LAUNCH_SOURCE_AUDIT_JSON) : null);
  const { missing, unexpected } = diffValues(expectedSourceUrls, auditedSourceUrls);
  const errors = [];

  if (!arraysEqual(expectedSourceUrls, auditedSourceUrls)) {
    errors.push({
      type: 'source_audit_urls_mismatch',
      missing_source_urls: missing,
      unexpected_source_urls: unexpected,
    });
  }

  if (sourceAudit.all_passed !== true) {
    errors.push({
      type: 'source_audit_not_all_passed',
      all_passed: sourceAudit.all_passed,
    });
  }

  if (sourceAudit.failed_count !== 0) {
    errors.push({
      type: 'source_audit_failed_sources_present',
      failed_count: sourceAudit.failed_count,
    });
  }

  if (sourceAudit.missing_expectation_count !== 0) {
    errors.push({
      type: 'source_audit_missing_expectations_present',
      missing_expectation_count: sourceAudit.missing_expectation_count,
    });
  }

  if (sourceAudit.url_alignment_passed !== true) {
    errors.push({
      type: 'source_audit_url_alignment_not_passed',
      url_alignment_passed: sourceAudit.url_alignment_passed,
    });
  }

  return {
    valid: errors.length === 0,
    expected_source_urls: expectedSourceUrls,
    audited_source_urls: auditedSourceUrls,
    missing_source_urls: missing,
    unexpected_source_urls: unexpected,
    error_count: errors.length,
    errors,
    boundary:
      'Source-audit alignment proves the manifest source URLs are covered by the latest source-audit artifact only; it does not prove buyer willingness to pay, customer outcomes, legal compliance, or production behavior.',
  };
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateOutreachPlanCompleteness(manifest) {
  const outreach = manifest.outreach_plan || {};
  const errors = [];
  const requiredTextFields = ['decision_boundary', 'email_script', 'linkedin_script'];
  const requiredLists = ['thirty_days', 'sixty_days', 'ninety_days', 'objection_handling'];
  const demoNarrative = outreach.demo_narrative || {};
  const requiredDemoFields = ['opening', 'proof', 'ask', 'caveat'];
  const structuredPlan = outreach.thirty_sixty_ninety_plan || [];
  const objectionMatrix = outreach.objection_handling_matrix || [];
  const requiredObjectionFields = ['objection', 'buyer_concern', 'response', 'proof_asset', 'next_step', 'boundary'];

  for (const field of requiredTextFields) {
    if (!isNonEmptyString(outreach[field])) {
      errors.push({ type: 'outreach_required_text_missing', field });
    }
  }

  for (const field of requiredLists) {
    if (!Array.isArray(outreach[field]) || outreach[field].length === 0) {
      errors.push({ type: 'outreach_required_list_missing', field });
    }
  }

  for (const field of requiredDemoFields) {
    if (!isNonEmptyString(demoNarrative[field])) {
      errors.push({ type: 'demo_narrative_field_missing', field });
    }
  }

  if (!Array.isArray(structuredPlan) || structuredPlan.length !== 3) {
    errors.push({
      type: 'structured_30_60_90_plan_invalid',
      expected_count: 3,
      actual_count: Array.isArray(structuredPlan) ? structuredPlan.length : null,
    });
  } else {
    for (const [index, item] of structuredPlan.entries()) {
      for (const field of ['window', 'action', 'proof_needed', 'success_metric']) {
        if (!isNonEmptyString(item[field])) {
          errors.push({
            type: 'structured_30_60_90_plan_field_missing',
            index,
            field,
          });
        }
      }
    }
  }

  if (!Array.isArray(objectionMatrix) || objectionMatrix.length < 8) {
    errors.push({
      type: 'objection_handling_matrix_too_short',
      expected_minimum: 8,
      actual_count: Array.isArray(objectionMatrix) ? objectionMatrix.length : null,
    });
  } else {
    for (const [index, item] of objectionMatrix.entries()) {
      for (const field of requiredObjectionFields) {
        if (!isNonEmptyString(item[field])) {
          errors.push({
            type: 'objection_handling_matrix_field_missing',
            index,
            field,
          });
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    has_demo_narrative: requiredDemoFields.every((field) => isNonEmptyString(demoNarrative[field])),
    structured_plan_count: Array.isArray(structuredPlan) ? structuredPlan.length : 0,
    objection_matrix_count: Array.isArray(objectionMatrix) ? objectionMatrix.length : 0,
    error_count: errors.length,
    errors,
    boundary:
      'Outreach-plan completeness proves the generated launch evidence contains the required planning fields only; it does not prove outreach was sent, buyers replied, pilots converted, or revenue exists.',
  };
}

function validateCompetitorSubstituteCompleteness(manifest) {
  const items = manifest.competitor_substitutes || [];
  const errors = [];
  const requiredFields = [
    'name',
    'type',
    'target_buyer',
    'core_promise',
    'pricing_proxy',
    'proof_standard_buyers_expect',
    'repo_stronger_where',
    'repo_weaker_where',
    'switching_or_adoption_friction',
    'boundary',
    'confidence',
  ];

  if (!Array.isArray(items) || items.length < 5) {
    errors.push({
      type: 'competitor_substitutes_count_too_low',
      expected_minimum: 5,
      actual_count: Array.isArray(items) ? items.length : null,
    });
  }

  for (const [index, item] of items.entries()) {
    for (const field of requiredFields) {
      if (field === 'confidence') {
        if (!Number.isInteger(item[field]) || item[field] < 1 || item[field] > 5) {
          errors.push({ type: 'competitor_confidence_invalid', index, field });
        }
      } else if (!isNonEmptyString(item[field])) {
        errors.push({ type: 'competitor_required_field_missing', index, field });
      }
    }

    if (!Array.isArray(item.source_evidence) || item.source_evidence.length === 0) {
      errors.push({ type: 'competitor_source_evidence_missing', index });
    }
  }

  return {
    valid: errors.length === 0,
    competitor_substitute_count: Array.isArray(items) ? items.length : 0,
    source_url_count: collectCompetitorSourceUrls(items).length,
    error_count: errors.length,
    errors,
    boundary:
      'Competitor/substitute completeness proves the launch evidence includes source-backed market alternatives only; it does not prove pricing, buyer preference, win rate, or competitive displacement.',
  };
}

function validateCrmExportCompleteness(manifest) {
  const crmExport = manifest.outreach_plan?.crm_export || {};
  const rows = crmExport.rows || [];
  const errors = [];
  const requiredFields = [
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

  if (!Array.isArray(crmExport.schema_fields) || crmExport.schema_fields.length < requiredFields.length) {
    errors.push({
      type: 'crm_schema_fields_missing_or_too_short',
      expected_minimum: requiredFields.length,
      actual_count: Array.isArray(crmExport.schema_fields) ? crmExport.schema_fields.length : null,
    });
  } else {
    for (const field of requiredFields) {
      if (!crmExport.schema_fields.includes(field)) {
        errors.push({ type: 'crm_schema_field_missing', field });
      }
    }
  }

  const expectedRowCount = (manifest.target_customers || []).length;
  if (
    !Array.isArray(rows) ||
    rows.length !== expectedRowCount ||
    crmExport.row_count !== expectedRowCount ||
    crmExport.rowCount !== expectedRowCount
  ) {
    errors.push({
      type: 'crm_row_count_mismatch',
      expected_count: expectedRowCount,
      actual_row_count: crmExport.row_count ?? null,
      actual_rowCount: crmExport.rowCount ?? null,
      actual_rows_length: Array.isArray(rows) ? rows.length : null,
    });
  }

  for (const [index, row] of rows.entries()) {
    for (const field of requiredFields) {
      if (field === 'confidence') {
        if (!Number.isInteger(row[field]) || row[field] < 1 || row[field] > 5) {
          errors.push({ type: 'crm_confidence_invalid', index, field });
        }
      } else if (!isNonEmptyString(row[field])) {
        errors.push({ type: 'crm_required_field_missing', index, field });
      }
    }

    if (row.status !== 'researched') {
      errors.push({ type: 'crm_status_not_researched', index, status: row.status });
    }

    if (!/^https?:\/\//.test(row.website || '')) {
      errors.push({ type: 'crm_website_source_url_invalid', index, website: row.website });
    }
  }

  return {
    valid: errors.length === 0,
    row_count: Array.isArray(rows) ? rows.length : 0,
    schema_field_count: Array.isArray(crmExport.schema_fields) ? crmExport.schema_fields.length : 0,
    artifact_json: crmExport.artifact_json || null,
    artifact_csv: crmExport.artifact_csv || null,
    error_count: errors.length,
    errors,
    boundary:
      'CRM export completeness proves the manifest has manual outreach seed rows only; it does not prove consent, contact delivery, replies, pilot conversion, revenue, or CRM/email automation.',
  };
}

function proofBucketItem(label, evidence, source, status = 'present', boundary = 'Does not prove commercial readiness.') {
  return { label, evidence, source, status, boundary };
}

function buildPainPoints() {
  return [
    {
      rank: 1,
      pain_point: 'Career coaches need credible AI-exposure explanations without overclaiming validated assessment status.',
      affected_buyer: 'Career coaches and resume writers',
      source_evidence: ['https://www.weforum.org/publications/the-future-of-jobs-report-2025/'],
      willingness_to_pay_signal: 'Coaches can package source-labeled planning artifacts as a paid review workflow when proof boundaries are clear.',
      repo_proof_fit: '/for-coaches, /sample-report, proof-pack gallery, and owner evidence queue are implemented with does-not-prove text.',
      confidence: 4,
    },
    {
      rank: 2,
      pain_point: 'Career centers need aggregate AI-work-transition workshop artifacts that avoid student-level employment decisions.',
      affected_buyer: 'University career centers and alumni offices',
      source_evidence: ['https://www.naceweb.org/career-readiness/competencies/career-readiness-defined'],
      willingness_to_pay_signal: 'Career-readiness programming and workshop delivery budgets favor reusable, source-labeled cohort artifacts.',
      repo_proof_fit: 'Counselor cohort proof pack, FERPA/NACE caveats, and HTML/CSV exports are implemented.',
      confidence: 4,
    },
    {
      rank: 3,
      pain_point: 'Workforce teams need role-level automation-risk review without ranking employees or making employment decisions.',
      affected_buyer: 'Workforce boards, L&D teams, and HR planning groups',
      source_evidence: ['https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/2-jobs-outlook/'],
      willingness_to_pay_signal: 'Role-level workforce planning supports paid advisory, workshop, and audit packages.',
      repo_proof_fit: 'Enterprise dashboard, workforce CSV audit, executive report skeleton, and employment-decision boundary are present.',
      confidence: 4,
    },
    {
      rank: 4,
      pain_point: 'Institutional buyers need AI governance artifacts before piloting career decision-support tools.',
      affected_buyer: 'Higher-ed administrators, public-sector workforce offices, and enterprise governance reviewers',
      source_evidence: [
        'https://www.nist.gov/itl/ai-risk-management-framework',
        'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence',
      ],
      willingness_to_pay_signal: 'Governance review creates procurement friction and paid readiness-review demand.',
      repo_proof_fit: 'Trust Center, AI RMF control map, Generative AI Profile source coverage, risk register, and acceptance checklist exports are present.',
      confidence: 4,
    },
    {
      rank: 5,
      pain_point: 'Accessibility evidence must be reviewable before institutional pilots or procurement conversations.',
      affected_buyer: 'Career centers, public-sector workforce programs, and accessibility reviewers',
      source_evidence: [
        'https://www.w3.org/TR/WCAG22/',
        'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/',
        'https://www.w3.org/TR/wcag-em-2/',
      ],
      willingness_to_pay_signal: 'Accessibility review is a gating procurement workflow for public and institutional buyers.',
      repo_proof_fit: 'Automated accessibility smoke artifacts, manual WCAG evidence template, WCAG-EM/WCAG-EM 2 methodology source coverage, and fail-closed verifier are implemented; manual WCAG evidence remains owner-held and no conformance claim is made.',
      confidence: 4,
    },
    {
      rank: 6,
      pain_point: 'Buyers need source freshness and data provenance before trusting automation-risk reports.',
      affected_buyer: 'Workforce analysts, institutional reviewers, and commercial pilot sponsors',
      source_evidence: ['https://www.onetcenter.org/database.html'],
      willingness_to_pay_signal: 'Evidence-backed data provenance differentiates paid advisory artifacts from generic AI copy.',
      repo_proof_fit: 'Data provenance checksums, source manifest, O*NET task-ratings ingest boundary, and report evidence cards are wired.',
      confidence: 4,
    },
    {
      rank: 7,
      pain_point: 'Payment, subscription, and fulfillment proof must be separated from UI checkout readiness.',
      affected_buyer: 'Founder/operator and early paid pilot buyers',
      source_evidence: [
        'https://docs.stripe.com/api/checkout/sessions',
        'https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1',
      ],
      willingness_to_pay_signal: 'Paid pilots require credible checkout and fulfillment proof before billing is advertised.',
      repo_proof_fit: 'Authenticated checkout source, PCI DSS v4.0.1 payment-security source coverage, and Stripe proof verifiers exist, but live/test proof gates remain blocked and no PCI compliance claim is made.',
      confidence: 3,
    },
    {
      rank: 8,
      pain_point: 'Secure API and file-upload boundaries matter because resume and proof-pack workflows handle sensitive user context.',
      affected_buyer: 'Security reviewers and privacy-conscious pilot sponsors',
      source_evidence: [
        'https://owasp.org/API-Security/editions/2023/en/0x11-t10/',
        'https://csrc.nist.gov/pubs/sp/800/218/final',
        'https://www.cisa.gov/news-events/news/applying-secure-design-thinking-events-news',
        'https://owasp.org/www-project-application-security-verification-standard/',
        'https://genai.owasp.org/resource/owasp-top-10-for-llm-applications-2025/',
      ],
      willingness_to_pay_signal: 'Security review is a hard gate for institutional pilots and repeatable proof-pack delivery.',
      repo_proof_fit: 'Parser boundary, redacted artifact persistence, deletion receipts, commercial trust checks, and current SSDF/Secure by Design/ASVS/LLM-risk source coverage are implemented without claiming framework conformance.',
      confidence: 4,
    },
    {
      rank: 9,
      pain_point: 'Employment-decision boundaries must be explicit to avoid misuse of individual reports or worker scores.',
      affected_buyer: 'Career platforms, workforce boards, employers, and legal reviewers',
      source_evidence: [
        'https://www.eeoc.gov/laws/guidance/employment-tests-and-selection-procedures',
        'https://www.dol.gov/index.php/newsroom/releases/osec/osec20241016',
      ],
      willingness_to_pay_signal: 'Clear boundaries reduce legal-review objections and support planning-only pilots.',
      repo_proof_fit: 'Blocked claims matrix, employment-decision boundary, report does-not-prove text, and worker-centered AI best-practice source coverage are implemented without claiming employment-decision validation or legal compliance.',
      confidence: 4,
    },
    {
      rank: 10,
      pain_point: 'Founder-led market validation needs exportable evidence, not only UI demos or anecdotal feedback.',
      affected_buyer: 'Founder/operator, advisors, and design-partner reviewers',
      source_evidence: [
        'https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/4-workforce-strategies/',
        'https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers',
        'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking',
      ],
      willingness_to_pay_signal: 'Exportable review worksheets and CRM-ready files make manual pilots measurable before automation spend.',
      repo_proof_fit: 'Pilot validation worksheet, owner action queue CSV, lead ops exports, FTC-grounded testimonial/review boundaries, and evidence-record validators are implemented without claiming partner commitments, outcome substantiation, or legal compliance.',
      confidence: 4,
    },
  ];
}

function buildTargetCustomers() {
  return [
    {
      rank: 1,
      account_or_segment: 'Independent career coaches and resume writers serving knowledge workers',
      pain: 'Need differentiated AI-transition guidance with credible caveats.',
      trigger: 'Client asks how AI affects their current role or resume positioning.',
      decision_maker: 'Coach owner or solo practitioner',
      outreach_angle: 'Offer a source-labeled automation defense sample report with planning-only boundaries.',
      proof_to_show: '/for-coaches, /sample-report, owner action queue, and proof-pack gallery.',
      confidence: 4,
    },
    {
      rank: 2,
      account_or_segment: 'University career centers',
      pain: 'Need workshop-ready AI career guidance without storing sensitive student details.',
      trigger: 'Career-readiness programming, alumni reskilling events, or AI literacy workshops.',
      decision_maker: 'Career center director or assistant director',
      outreach_angle: 'Show aggregate cohort proof pack with FERPA/NACE caveats and no individual ranking.',
      proof_to_show: '/tools/counselor-reports and career-center cohort HTML/CSV pack.',
      confidence: 4,
    },
    {
      rank: 3,
      account_or_segment: 'Workforce boards running role-transition programs',
      pain: 'Need role-level planning artifacts that avoid employment-decision misuse.',
      trigger: 'Regional AI workforce planning, grant programs, or reskilling initiatives.',
      decision_maker: 'Workforce program director',
      outreach_angle: 'Offer a 10-25 role CSV audit with source IDs and governance caveats.',
      proof_to_show: '/enterprise-dashboard, workforce CSV audit, and local-market snapshot packet.',
      confidence: 4,
    },
    {
      rank: 4,
      account_or_segment: 'L&D teams at mid-market professional-services firms',
      pain: 'Need training priorities tied to job tasks rather than generic AI awareness.',
      trigger: 'Internal AI adoption plan or skill-gap workshop.',
      decision_maker: 'Head of L&D or People Operations',
      outreach_angle: 'Use role-level task exposure and review-required skill actions as a planning artifact.',
      proof_to_show: 'Enterprise dashboard and workforce executive report artifact.',
      confidence: 3,
    },
    {
      rank: 5,
      account_or_segment: 'Outplacement and career-transition providers',
      pain: 'Need scalable career-transition material with human review boundaries.',
      trigger: 'New cohort intake or employer-sponsored transition program.',
      decision_maker: 'Program director or product lead',
      outreach_angle: 'Position proof packs as coaching aids, not validated employment assessments.',
      proof_to_show: 'Resume analyzer proof report, deletion receipt boundary, and sample report.',
      confidence: 3,
    },
    {
      rank: 6,
      account_or_segment: 'Bootcamps and continuing education providers',
      pain: 'Need employer-relevant skill-transition narratives without unsupported placement claims.',
      trigger: 'Curriculum refresh, AI literacy module, or alumni outcomes initiative.',
      decision_maker: 'Program director or partnerships lead',
      outreach_angle: 'Show source-labeled skill adjacency and career-readiness evidence cards.',
      proof_to_show: 'Skill adjacency, career center cohort pack, and source freshness dashboard.',
      confidence: 3,
    },
    {
      rank: 7,
      account_or_segment: 'Public libraries and community workforce programs',
      pain: 'Need accessible AI career materials for broad public education.',
      trigger: 'Workforce development workshop or digital-literacy program.',
      decision_maker: 'Program manager or community partnerships lead',
      outreach_angle: 'Offer planning-only sample reports and accessible trust packet review.',
      proof_to_show: 'Trust Center, privacy page, and accessibility evidence queue.',
      confidence: 3,
    },
    {
      rank: 8,
      account_or_segment: 'HR consultants advising smaller employers',
      pain: 'Need safe AI-readiness artifacts without creating adverse-action tools.',
      trigger: 'Client asks for workforce AI impact assessment.',
      decision_maker: 'Consulting principal',
      outreach_angle: 'Frame as role-level planning and governance review, not employee scoring.',
      proof_to_show: 'Blocked claims matrix, employment-decision boundary, and workforce CSV audit.',
      confidence: 3,
    },
    {
      rank: 9,
      account_or_segment: 'Economic-development organizations',
      pain: 'Need regional job-transition narratives with source and geography caveats.',
      trigger: 'AI workforce report, grant application, or employer roundtable.',
      decision_maker: 'Economic development director or analyst',
      outreach_angle: 'Use source-labeled local-market snapshot template with reviewer notes.',
      proof_to_show: 'Local labor-market snapshot packet and source freshness dashboard.',
      confidence: 3,
    },
    {
      rank: 10,
      account_or_segment: 'AI literacy training providers',
      pain: 'Need evidence-backed role examples that connect training to job tasks.',
      trigger: 'Enterprise AI literacy sale or workshop proposal.',
      decision_maker: 'Founder, curriculum lead, or sales lead',
      outreach_angle: 'Co-sell proof-pack review as the diagnostic before training recommendations.',
      proof_to_show: 'Proof-pack gallery, task evidence cards, and pilot validation worksheet.',
      confidence: 3,
    },
  ];
}

function buildCompetitorSubstitutes() {
  return [
    {
      rank: 1,
      name: 'Workera',
      type: 'direct_competitor',
      target_buyer: 'Enterprise talent, L&D, AI readiness, and workforce transformation leaders',
      core_promise:
        'Verified skills intelligence, AI readiness measurement, workforce capability gaps, and enterprise-grade skills data for talent decisions.',
      pricing_proxy:
        'Enterprise demo-led pricing; buyer likely expects procurement, security, implementation, and customer-success support.',
      proof_standard_buyers_expect:
        'Defensible skills-verification methodology, enterprise security/compliance proof, integrations, benchmarks, and customer outcome evidence.',
      repo_stronger_where:
        'More focused founder-led proof packs for automation-risk planning, explicit employment-decision boundaries, O*NET provenance, and coach/career-center workflows.',
      repo_weaker_where:
        'No comparable enterprise skills-verification engine, benchmark corpus, HRIS/LMS integrations, customer logos, SLA, or outcome proof.',
      switching_or_adoption_friction:
        'Enterprise buyers already considering Workera will need proof that this repo solves a narrower planning workflow faster and with less procurement load.',
      boundary:
        'Use Workera only as market-positioning context; do not claim Workera-backed validation, integrations, comparable assessment depth, or competitive win probability.',
      source_evidence: ['https://www.workera.ai/product-overview'],
      confidence: 4,
    },
    {
      rank: 2,
      name: 'Lightcast Skills Taxonomy and labor-market data',
      type: 'data_platform',
      target_buyer: 'Workforce analysts, universities, economic-development teams, and enterprise people-analytics teams',
      core_promise:
        'Large-scale skills taxonomy, job-posting-derived skill signals, comparable labor-market language, and licensed market-intelligence data products.',
      pricing_proxy:
        'Data/API and enterprise licensing; buyers expect data contracts, provenance, refresh jobs, and documented permissible use.',
      proof_standard_buyers_expect:
        'Licensed adapter, data refresh timestamps, query provenance, skill taxonomy coverage, labor-market methodology, and geography-specific caveats.',
      repo_stronger_where:
        'Current repo is clearer about unlicensed-adapter boundaries and can produce planning artifacts without pretending to include licensed market intelligence.',
      repo_weaker_where:
        'No licensed Lightcast adapter, real-time posting demand, current salary/demand scoring, or enterprise-grade taxonomy normalization.',
      switching_or_adoption_friction:
        'Buyers needing market-intelligence depth will treat this repo as a workflow/proof-pack layer until a licensed feed is integrated.',
      boundary:
        'Do not imply Lightcast-backed scoring, taxonomy parity, postings coverage, or data freshness until a licensed adapter and provenance log exist.',
      source_evidence: ['https://lightcast.io/open-skills'],
      confidence: 4,
    },
    {
      rank: 3,
      name: 'CareerOneStop and public career tools',
      type: 'public_source',
      target_buyer: 'Career centers, workforce boards, coaches, and public workforce programs',
      core_promise:
        'Trusted public career, employment, education, training, salary, and local workforce-service data via web tools and authenticated APIs.',
      pricing_proxy:
        'Public data access and authenticated API registration; buyer cost is mainly integration, review, and operational workflow.',
      proof_standard_buyers_expect:
        'Endpoint-level API provenance, query location, timestamp, authentication owner, user-facing attribution, and reviewer notes.',
      repo_stronger_where:
        'Adds AI automation-risk interpretation, proof-pack packaging, trust boundaries, and owner-action ledgers over public occupation data.',
      repo_weaker_where:
        'Does not replace CareerOneStop breadth, authenticated endpoint coverage, public-service trust, local provider directory depth, or official UI workflows.',
      switching_or_adoption_friction:
        'Public-sector buyers may prefer official tools unless this repo demonstrates a narrow, auditable planning artifact they cannot assemble manually.',
      boundary:
        'CareerOneStop API availability does not validate this product, a training provider, a local outcome, or a scored employment recommendation.',
      source_evidence: ['https://github.com/CareerOneStop/API-Overview'],
      confidence: 4,
    },
    {
      rank: 4,
      name: 'O*NET Database and O*NET OnLine-style manual workflows',
      type: 'public_source',
      target_buyer: 'Analysts, career practitioners, curriculum teams, and workforce planners who can work directly from occupational data',
      core_promise:
        'Authoritative U.S. occupational taxonomy, skills, work activities, tasks, knowledge, abilities, education, and work-context descriptors.',
      pricing_proxy:
        'Public data; implementation cost is data literacy, attribution, integration, refresh discipline, and manual synthesis time.',
      proof_standard_buyers_expect:
        'Correct O*NET version, attribution, occupational-code mapping, release freshness, and clear separation between source data and derived AI analysis.',
      repo_stronger_where:
        'Turns O*NET-backed task and occupation evidence into reviewable automation-risk, transition, and proof-pack narratives with caveats.',
      repo_weaker_where:
        'O*NET itself remains the authoritative source; this repo must not imply O*NET alone proves AI exposure, individual outcomes, or real-time market demand.',
      switching_or_adoption_friction:
        'Experienced workforce analysts can manually assemble O*NET evidence, so the repo must win on speed, packaging, governance, and reviewer-ready exports.',
      boundary:
        'O*NET is source data for occupation descriptors; it is not an endorsement, employment-decision tool, or standalone automation forecast.',
      source_evidence: ['https://www.onetcenter.org/database.html'],
      confidence: 5,
    },
    {
      rank: 5,
      name: 'Manual consulting, spreadsheets, and AI-literacy workshop substitutes',
      type: 'internal_workaround',
      target_buyer: 'Independent coaches, HR consultants, career centers, public programs, and small L&D teams',
      core_promise:
        'Human-led synthesis of public sources, spreadsheet scoring, slide decks, and workshop materials customized for a client or cohort.',
      pricing_proxy:
        'Hourly consulting, workshop, retainer, or internal staff time; buyer expects high-touch judgment and flexible deliverables.',
      proof_standard_buyers_expect:
        'Transparent assumptions, cited sources, permissioned client examples, repeatable templates, privacy handling, and clear does-not-prove statements.',
      repo_stronger_where:
        'Can standardize repeatable proof packs, source-audit output, Trust Center boundaries, owner evidence queue, and pilot validation worksheets.',
      repo_weaker_where:
        'Cannot yet prove live paid fulfillment, partner commitments, documented outcomes, or manual WCAG evidence without owner-held evidence.',
      switching_or_adoption_friction:
        'Manual substitutes remain attractive until the repo proves the artifact saves time, reduces review risk, and supports a paid pilot workflow.',
      boundary:
        'Manual substitute analysis supports outreach positioning only; it does not prove the product is sellable, differentiated enough, or outcome-effective.',
      source_evidence: ['https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/4-workforce-strategies/'],
      confidence: 3,
    },
  ];
}

function sourceUrlForTargetRank(rank, painPoints) {
  const painPointByRank = new Map((painPoints || []).map((painPoint) => [painPoint.rank, painPoint]));
  const sourceRankByTargetRank = {
    1: 1,
    2: 2,
    3: 3,
    4: 3,
    5: 1,
    6: 2,
    7: 5,
    8: 9,
    9: 10,
    10: 10,
  };
  const painPoint = painPointByRank.get(sourceRankByTargetRank[rank] || rank);
  return painPoint?.source_evidence?.[0] || 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/';
}

function objectionsForSegment(rank) {
  if ([2, 7].includes(rank)) {
    return 'accessibility evidence; privacy/student-data boundary; no employment-decision use; manual review needed';
  }
  if ([3, 4, 8, 9].includes(rank)) {
    return 'integration depth; data freshness; local-market proof; no employee ranking or adverse-action use';
  }
  if ([1, 5, 6, 10].includes(rank)) {
    return 'outcome proof; pricing fit; support workflow; no guaranteed job or client-result claims';
  }
  return 'proof missing; security review; support workflow; buyer fit';
}

function nextActionForSegment(rank) {
  if (rank <= 3) {
    return 'Owner-approved manual 20-minute relevance review with one sample artifact; record objections before any paid pilot claim.';
  }
  if (rank <= 6) {
    return 'Research a named account, confirm permissioned contact path, then offer a planning-only artifact review.';
  }
  return 'Hold as secondary segment until top-three relevance reviews produce disqualification or permissioned pilot evidence.';
}

function buildCrmExport(targetCustomers, painPoints) {
  const schemaFields = [
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
  const rows = targetCustomers.map((target) => ({
    account_name: target.account_or_segment,
    website: sourceUrlForTargetRank(target.rank, painPoints),
    buyer_role: target.decision_maker,
    pain_point: target.pain,
    trigger: target.trigger,
    proof_asset: target.proof_to_show,
    outreach_angle: target.outreach_angle,
    status: 'researched',
    next_action: nextActionForSegment(target.rank),
    objections: objectionsForSegment(target.rank),
    confidence: target.confidence,
    decision_boundary: 'Pilot-only manual founder-led outreach until owner/live evidence gates pass.',
    does_not_prove:
      'Does not prove contact consent, outreach delivery, buyer reply, design-partner commitment, revenue, outcome, legal compliance, or CRM/email automation.',
  }));

  return {
    artifact_json: OUTPUT_CRM_JSON,
    artifact_csv: OUTPUT_CRM_CSV,
    schema_fields: schemaFields,
    allowed_statuses: ['researched', 'contacted', 'replied', 'demoed', 'pilot', 'closed', 'rejected'],
    row_count: rows.length,
    rowCount: rows.length,
    rows,
    boundary:
      'CRM seed rows are manual planning artifacts derived from ranked segments. They do not send outreach, prove consent, prove replies, prove revenue, or replace a configured CRM/email system.',
  };
}

function buildObjectionHandlingMatrix() {
  return [
    {
      objection: 'We already use an incumbent platform or internal spreadsheet.',
      buyer_concern:
        'The buyer may see this repo as duplicative unless it names a narrower workflow than Workera, Lightcast, public tools, or consulting workarounds.',
      response:
        'Position the artifact as a planning-only proof-pack layer that complements existing tools by making source IDs, caveats, reviewer notes, and does-not-prove boundaries visible.',
      proof_asset:
        'Competitor/substitute table, proof-pack gallery, CRM seed rows, and source-audited launch evidence manifest.',
      next_step:
        'Ask for a side-by-side review of one current workflow and one sample proof pack; record the incumbent gap before suggesting a pilot.',
      boundary:
        'Does not prove displacement, switching likelihood, pricing power, or buyer willingness to replace an incumbent.',
    },
    {
      objection: 'Is this secure enough for sensitive resumes or workforce data?',
      buyer_concern:
        'Career, resume, and workforce planning artifacts can contain personal or commercially sensitive data.',
      response:
        'Show the parser boundary, deletion receipt path, redacted evidence policy, owner-held evidence workflow, and secret hygiene checks before discussing any live pilot.',
      proof_asset:
        'Privacy page, resume deletion receipt proof, commercial trust verifier, secret hygiene verifier, and owner evidence handoff.',
      next_step:
        'Route the buyer to a security/privacy review using redacted sample data only; do not request real user data during relevance discovery.',
      boundary:
        'Does not prove SOC 2, enterprise DPA completion, customer security approval, or production tenant-isolation evidence.',
    },
    {
      objection: 'Can this integrate with our stack?',
      buyer_concern:
        'Institutional and workforce buyers may need LMS, HRIS, CRM, storage, analytics, or existing case-management integration.',
      response:
        'Keep the first pilot export-based: CSV, HTML, source IDs, and reviewer notes. Treat integrations as a post-relevance requirement after owner/live evidence closes.',
      proof_asset:
        'Launch outreach CRM CSV, proof-pack exports, lead ops CSV, and commercial codebase index.',
      next_step:
        'Ask which export format is enough for a 20-minute review, then log integration gaps as pilot objections.',
      boundary:
        'Does not prove API integration, SSO, live CRM sync, email automation, or buyer-system compatibility.',
    },
    {
      objection: 'How long does onboarding take?',
      buyer_concern:
        'Buyers need a low-friction first review and cannot commit staff time to an unproven workflow.',
      response:
        'Offer a scoped manual review: one sample artifact, one buyer workflow, one source boundary walkthrough, and one objection log.',
      proof_asset:
        '30/60/90 plan, target customer table, proof-pack gallery, and CRM seed next actions.',
      next_step:
        'Use a 20-minute relevance review for top-three segments before asking for data, payment, or a formal pilot.',
      boundary:
        'Does not prove onboarding SLA, training completion, support burden, or repeatable implementation time.',
    },
    {
      objection: 'What proof do you have?',
      buyer_concern:
        'Local artifacts and demos are not the same as customer outcomes, live revenue, or validated assessment evidence.',
      response:
        'Separate proof buckets explicitly: local checks, repo artifacts, source audit, candidate live artifacts, and owner-held blockers.',
      proof_asset:
        'Launch evidence manifest, launch source audit, remediation completion audit, owner closeout status, and commercial verifier output.',
      next_step:
        'Show only the proof bucket that matches the buyer question, then name which owner-held gate is still open.',
      boundary:
        'Does not prove live MRR, committed partners, documented outcomes, manual WCAG conformance, or production runtime behavior.',
    },
    {
      objection: 'Who supports this if something goes wrong?',
      buyer_concern:
        'A founder-led pilot can fail if support, escalation, review ownership, and artifact correction are unclear.',
      response:
        'Keep the pilot founder-led and review-bound. Use owner action queues, artifact review events, and human-review attestations before client-ready delivery.',
      proof_asset:
        'Commercial lead ops, artifact review event model, owner evidence handoff, and Trust Center owner action queue.',
      next_step:
        'Name one accountable reviewer and one support path for any pilot artifact before collecting buyer evidence.',
      boundary:
        'Does not prove production support coverage, SLA, support staffing, or enterprise customer-success readiness.',
    },
    {
      objection: 'What happens if the analysis is wrong?',
      buyer_concern:
        'Career and workforce users could misuse outputs as employment, eligibility, or high-stakes recommendations.',
      response:
        'State that artifacts are planning-only, source-labeled, human-reviewed, and not for hiring, firing, pay, promotion, screening, eligibility, or individual ranking.',
      proof_asset:
        'Employment-decision boundary, blocked claims matrix, report does-not-prove text, and responsible AI Trust Center.',
      next_step:
        'Ask the buyer to define allowed and disallowed use cases before any pilot artifact is generated.',
      boundary:
        'Does not prove legal compliance, individual accuracy, adverse-impact review, or suitability for high-stakes employment decisions.',
    },
    {
      objection: 'Can procurement approve this?',
      buyer_concern:
        'Institutional buyers need accessibility, privacy, payment, live runtime, compliance, and outcome evidence before purchase.',
      response:
        'Do not claim procurement-ready status. Use the pilot-only decision and owner action queue to show exactly which evidence is missing.',
      proof_asset:
        'Owner evidence closeout status, manual WCAG template, Stripe proof gates, remediation external gates, and launch decision ledger.',
      next_step:
        'Treat procurement as a later gate; collect relevance feedback and owner-held evidence first.',
      boundary:
        'Does not prove procurement approval, WCAG conformance, payment readiness, live revenue, partner commitment, or documented outcome evidence.',
    },
  ];
}

function buildImplementationDecisions() {
  return [
    {
      decision: 'Generate launch evidence from current repo ledgers instead of hand-maintaining a static sales artifact.',
      acceptance_check:
        'Manifest validation must pass validate_launch_evidence.py and launch-evidence alignment must match owner/remediation ledgers.',
      chosen_variant: 'ledger-derived JSON, Markdown, and CRM seed exports with explicit does-not-prove boundaries',
      files_changed: [
        'scripts/generate-launch-evidence-manifest.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
        OUTPUT_CRM_JSON,
        OUTPUT_CRM_CSV,
      ],
      tests_run: [
        'node scripts/generate-launch-evidence-manifest.mjs --write --validate',
        'node scripts/verify-launch-evidence-alignment.mjs',
      ],
      proof:
        'The generated manifest records ledger_alignment, source_audit_alignment, outreach_plan_completeness, competitor_substitute_completeness, and crm_export_completeness results.',
      reason:
        'A ledger-derived manifest prevents stale launch claims and keeps owner-held evidence gates separate from local/repo proof.',
    },
    {
      decision: 'Keep launch_decision pilot-only until owner-held payment, revenue, partner, outcome, and manual WCAG evidence gates close.',
      acceptance_check:
        'Unresolved blockers in fix_report must match the remaining external gate IDs from the remediation completion audit.',
      chosen_variant: 'fail-closed pilot-only decision boundary',
      files_changed: [
        'docs/commercialization/remediation-completion-audit-latest.json',
        'docs/commercialization/remediation-external-gates-latest.json',
        'docs/commercialization/owner-evidence-closeout-status-latest.json',
      ],
      tests_run: ['npm run verify:commercial', 'node scripts/verify-launch-evidence-alignment.mjs'],
      proof:
        'The manifest gap IDs, gate IDs, unresolved blockers, owner-action queue IDs, and handoff gate IDs are compared exactly.',
      reason:
        'Local checks and source-backed outreach planning do not prove commercial readiness without owner-held external evidence.',
    },
    {
      decision: 'Derive progress_updates and bottleneck_log from current verification and owner-evidence ledgers.',
      acceptance_check:
        'Launch evidence alignment must fail if progress updates or the evidence-gap bottleneck disappear.',
      chosen_variant: 'minimal generator-derived progress and bottleneck rows',
      files_changed: [
        'scripts/generate-launch-evidence-manifest.mjs',
        'scripts/verify-launch-evidence-alignment.mjs',
        'scripts/verify-launch-evidence-alignment-fixtures.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'node scripts/generate-launch-evidence-manifest.mjs --write --validate',
        'node scripts/verify-launch-evidence-alignment.mjs',
        'node scripts/verify-launch-evidence-alignment-fixtures.mjs',
      ],
      proof:
        'The manifest includes a target matrix covering all progress-reporting contract lanes and a bottleneck_log item with root_cause=evidence gap.',
      reason:
        'The run is long-running and phase-based; empty progress arrays understate the current completion state and hide the owner-evidence bottleneck.',
    },
    {
      decision: 'Make direct launch-evidence alignment fail closed on weak progress digest details.',
      acceptance_check:
        'Launch evidence alignment fixtures must fail when progress lane weights, status values, confidence scores, activities_remaining, or bottleneck unblock details drift from the progress-reporting contract.',
      chosen_variant: 'minimal direct progress-contract verifier hardening and fixture coverage',
      files_changed: [
        'scripts/verify-launch-evidence-alignment.mjs',
        'scripts/verify-launch-evidence-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The direct launch-evidence verifier now rejects incorrect target lane weights, invalid progress statuses, invalid confidence scores, missing activities_remaining details, and empty bottleneck unblock options.',
      reason:
        'A present progress digest can still be misleading if the target matrix, activities remaining, or bottleneck unblock details are structurally weak.',
    },
    {
      decision: 'Make direct launch-evidence alignment fail closed on proof-bucket boundary drift.',
      acceptance_check:
        'Launch evidence alignment fixtures must fail when required proof buckets are missing, proof bucket item fields are incomplete, or local/candidate/roadmap boundaries stop stating what they do not prove.',
      chosen_variant: 'minimal direct proof-bucket verifier hardening plus explicit generated boundaries',
      files_changed: [
        'scripts/verify-launch-evidence-alignment.mjs',
        'scripts/verify-launch-evidence-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The direct launch-evidence verifier now rejects missing required proof buckets, incomplete proof-bucket fields, missing does-not-prove boundaries, and local/candidate/roadmap boundary drift.',
      reason:
        'Proof buckets are the main guardrail against confusing local, repo-artifact, candidate, roadmap, and hosted/live evidence; empty boundaries weaken that launch-readiness handoff.',
    },
    {
      decision: 'Mirror release-gate coverage in standalone launch evidence.',
      acceptance_check:
        'Launch evidence alignment fixtures must fail when release-gate coverage is missing, drifts from the current commercial summary, overclaims an optional gate, or disappears from Markdown.',
      chosen_variant: 'minimal fix-report coverage snapshot plus direct alignment checks',
      files_changed: [
        'scripts/generate-launch-evidence-manifest.mjs',
        'scripts/verify-launch-evidence-alignment.mjs',
        'scripts/verify-launch-evidence-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The launch evidence fix_report now carries release_gate_coverage copied from the current commercial summary, and the direct verifier rejects missing coverage, summary drift, optional-gate overclaim, and Markdown omission.',
      reason:
        'Release gate command names alone are weaker than coverage evidence; standalone manifest readers need to see which gates were included, which passed, and which still require separate current output.',
    },
    {
      decision: 'Surface owner local-safety status in handoff and completion-drill artifacts.',
      acceptance_check:
        'Owner-evidence handoff and completion-drill alignment fixtures must fail when the local-safety source pointer is missing or the generated safety snapshot drifts from owner-evidence-local-safety-latest.json.',
      chosen_variant: 'minimal owner artifact source snapshot plus direct alignment checks',
      files_changed: [
        'scripts/generate-owner-evidence-handoff.mjs',
        'scripts/verify-owner-evidence-handoff-alignment.mjs',
        'scripts/verify-owner-evidence-handoff-alignment-fixtures.mjs',
        'scripts/generate-owner-evidence-completion-drill.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/owner-evidence-handoff-latest.json',
        'docs/commercialization/owner-evidence-handoff-latest.md',
        'docs/commercialization/owner-evidence-completion-drill-latest.json',
        'docs/commercialization/owner-evidence-completion-drill-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated handoff and completion drill now carry localSafetyStatus from owner-evidence-local-safety-latest.json, and their direct fixture suites reject missing source links and stale safety snapshots.',
      reason:
        'Owner closeout commands already require the local-safety preflight, but downstream owner handoff readers also need a current machine-checkable summary of whether ignored local owner-evidence paths are safe before staging refreshed artifacts.',
    },
    {
      decision: 'Expose owner local-safety preflight status in the Trust Center model and UI.',
      acceptance_check:
        'The proof-visibility and completion-drill alignment verifiers must fail if the Trust Center local-safety summary is missing, not rendered, or stale against owner-evidence-local-safety-latest.json.',
      chosen_variant: 'minimal static UI model snapshot plus direct completion-drill and proof-visibility checks',
      files_changed: [
        'src/lib/commercialLaunchReadiness.ts',
        'src/components/proof/ProofVisibilityPanels.tsx',
        'scripts/verify-owner-evidence-completion-drill-alignment.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment-fixtures.mjs',
        'scripts/verify-proof-visibility-ui.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:proof-visibility-ui',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The Trust Center now renders localSafetyStatus from ownerEvidenceLocalSafetySummary, and the completion-drill fixture suite rejects stale UI local-safety state against owner-evidence-local-safety-latest.json.',
      reason:
        'The generated handoff artifacts carried the preflight status, but the live Trust Center owner surface still only exposed the preflight command; showing the current status reduces the risk of staging refreshed owner evidence before confirming local path safety.',
    },
    {
      decision: 'Propagate owner local-safety source trace into handoff, completion drill, and Trust Center model.',
      acceptance_check:
        'Owner-evidence handoff and completion-drill alignment fixtures must fail when local-safety sourceTrace rows are missing, stale, omitted from Markdown, or stale in the Trust Center model.',
      chosen_variant: 'deterministic artifact-anchor sourceTrace rows plus direct JSON, Markdown, and UI model checks',
      files_changed: [
        'scripts/generate-owner-evidence-handoff.mjs',
        'scripts/generate-owner-evidence-completion-drill.mjs',
        'scripts/verify-owner-evidence-handoff-alignment.mjs',
        'scripts/verify-owner-evidence-handoff-alignment-fixtures.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'src/lib/commercialLaunchReadiness.ts',
        'src/components/proof/ProofVisibilityPanels.tsx',
        'scripts/verify-proof-visibility-ui.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/owner-evidence-handoff-latest.json',
        'docs/commercialization/owner-evidence-handoff-latest.md',
        'docs/commercialization/owner-evidence-completion-drill-latest.json',
        'docs/commercialization/owner-evidence-completion-drill-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:proof-visibility-ui',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The owner handoff, completion drill, and Trust Center model now expose seven local-safety sourceTrace rows from owner-evidence-local-safety-latest.json, and direct fixture suites reject missing, stale, Markdown-omitted, or UI-stale source trace state.',
      reason:
        'Aggregate local-safety counts are useful but not enough provenance for owner-facing closeout packets; sourceTrace rows tie each visible count/status/boundary back to a precise artifact anchor without reading owner-held evidence contents or upgrading launch readiness.',
    },
    {
      decision: 'Expose owner local-safety source trace in the final commercial summary.',
      acceptance_check:
        'Commercial summary launch-readiness alignment fixtures must fail when owner local-safety summary fields, sourceTrace rows, source anchors, copied handoff/completion-drill status, or Markdown rows drift from owner-evidence-local-safety-latest.json.',
      chosen_variant: 'minimal release-summary sourceTrace summary plus direct alignment and trust-boundary fixtures',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now exposes ownerEvidenceExecutionSummary.localSafetyStatusSummary with sourceTrace rows for owner-evidence-local-safety, handoff, and completion-drill anchors; launch-readiness fixtures reject missing, stale, Markdown-omitted, or copied-status-stale local-safety state.',
      reason:
        'Handoff and completion-drill artifacts carried local-safety sourceTrace, but final commercial-summary readers still lacked a release-level provenance row for owner-local path hygiene before owner evidence staging.',
    },
    {
      decision: 'Expose owner evidence local-safety artifact counts.',
      acceptance_check:
        'Owner evidence local-safety fixtures and trust sentinels must fail when protectedPathCount, ignoredProtectedPathCount, trackedSensitiveFileViolationCount, stagedSensitivePathViolationCount, doesNotProveCount, referencePracticeCount, or errorCount drift from the generated artifact arrays.',
      chosen_variant:
        'minimal owner-local-safety count fields plus exported count validator, fixture drift cases, and Markdown count visibility',
      files_changed: [
        'scripts/verify-owner-evidence-local-safety.mjs',
        'scripts/verify-owner-evidence-local-safety-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/owner-evidence-local-safety-latest.json',
        'docs/commercialization/owner-evidence-local-safety-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:owner-evidence-local-safety-fixtures',
        'npm run verify:owner-evidence-local-safety',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The owner evidence local-safety artifact now exposes trackedSensitiveFileViolationCount, stagedSensitivePathViolationCount, doesNotProveCount, and referencePracticeCount alongside protectedPathCount, ignoredProtectedPathCount, and errorCount, with fixture drift cases rejecting stale count metadata.',
      reason:
        'Owner closeout readers should know the protected-path, ignored-path, tracked-sensitive, staged-sensitive, claim-boundary, reference-practice, and error basis size before relying on repo-local safety preflight output for owner-held evidence staging.',
    },
    {
      decision: 'Expose owner handoff local-safety does-not-prove count parity.',
      acceptance_check:
        'Owner-evidence handoff and completion-drill alignment fixtures must fail when embedded localSafetyStatus.doesNotProveCount drifts from doesNotProve length or when the Markdown local-safety preflight omits the does-not-prove count row.',
      chosen_variant:
        'minimal nested localSafetyStatus doesNotProveCount propagation plus source-trace row, Markdown visibility, and fixture drift cases',
      files_changed: [
        'scripts/generate-owner-evidence-handoff.mjs',
        'scripts/generate-owner-evidence-completion-drill.mjs',
        'scripts/verify-owner-evidence-handoff-alignment.mjs',
        'scripts/verify-owner-evidence-handoff-alignment-fixtures.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment-fixtures.mjs',
        'src/lib/commercialLaunchReadiness.ts',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/owner-evidence-handoff-latest.json',
        'docs/commercialization/owner-evidence-handoff-latest.md',
        'docs/commercialization/owner-evidence-completion-drill-latest.json',
        'docs/commercialization/owner-evidence-completion-drill-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:owner-evidence-handoff',
        'npm run verify:owner-evidence-completion-drill',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The owner handoff, completion drill, and Trust Center model now expose localSafetyStatus.doesNotProveCount=3 and sourceTraceCount=8, including a doesNotProveCount source anchor and Markdown count row.',
      reason:
        'Nested owner action artifacts already copied the local-safety doesNotProve boundaries, but without a count readers still had to manually inspect arrays to verify local path-safety claim boundaries before owner-held evidence staging.',
    },
    {
      decision: 'Expose commercial worktree-hygiene artifact counts.',
      acceptance_check:
        'Commercial worktree hygiene fixtures and trust sentinels must fail when allowedUntrackedPathPatternCount, sensitiveUntrackedPathPatternCount, untrackedPathCount, untrackedAllowedPathCount, unexpectedUntrackedPathCount, sensitiveUntrackedPathCount, untrackedPathCheckCount, doesNotProveCount, or errorCount drift from the generated artifact arrays.',
      chosen_variant:
        'minimal worktree-hygiene count fields plus exported count validator, fixture drift cases, and Markdown count visibility',
      files_changed: [
        'scripts/verify-commercial-worktree-hygiene.mjs',
        'scripts/verify-commercial-worktree-hygiene-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-worktree-hygiene-latest.json',
        'docs/commercialization/commercial-worktree-hygiene-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-worktree-hygiene-fixtures',
        'npm run verify:commercial-worktree-hygiene',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The commercial worktree-hygiene artifact now exposes policy-pattern, untracked-path-check, does-not-prove, and error counts alongside existing untracked status counts, with fixture drift cases rejecting stale count metadata.',
      reason:
        'Commercial handoff readers should know the policy-array, checked-path, unexpected-path, sensitive-path, claim-boundary, and error basis size before relying on repo-local dirty worktree hygiene output.',
    },
    {
      decision: 'Expose owner prep-readiness counts by remaining gate in the Trust Center.',
      acceptance_check:
        'The prep-readiness alignment fixtures must fail when per-gate Trust Center prep summaries are missing or stale against ownerEvidencePrep.ownerActionNeededByGate in the closeout-status artifact.',
      chosen_variant: 'minimal static per-gate UI model plus prep-readiness alignment checks',
      files_changed: [
        'src/lib/commercialLaunchReadiness.ts',
        'src/components/proof/ProofVisibilityPanels.tsx',
        'scripts/verify-owner-evidence-prep-readiness-alignment.mjs',
        'scripts/verify-owner-evidence-prep-readiness-alignment-fixtures.mjs',
        'scripts/verify-proof-visibility-ui.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:owner-evidence-prep-alignment-fixtures',
        'npm run verify:owner-evidence-prep-alignment',
        'npm run verify:proof-visibility-ui',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The Trust Center now renders ownerEvidencePrepReadinessGateSummaries and the prep-readiness fixture suite rejects missing or stale gate prep summaries against owner-evidence-closeout-status-latest.json.',
      reason:
        'Flat prep rows tell owners what remains but not which remaining gate each prep action blocks; per-gate summaries reduce closeout ambiguity without reading owner-held proof contents or changing gate status.',
    },
    {
      decision: 'Propagate owner prep-readiness counts by remaining gate into owner handoff artifacts.',
      acceptance_check:
        'Owner-evidence handoff and completion-drill alignment fixtures must fail when top-level ownerPrepActionNeededByGate maps are missing or stale against ownerEvidencePrep.ownerActionNeededByGate in the closeout-status artifact.',
      chosen_variant: 'minimal top-level artifact snapshot plus direct handoff and completion-drill alignment checks',
      files_changed: [
        'scripts/generate-owner-evidence-handoff.mjs',
        'scripts/generate-owner-evidence-completion-drill.mjs',
        'scripts/verify-owner-evidence-handoff-alignment.mjs',
        'scripts/verify-owner-evidence-handoff-alignment-fixtures.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/owner-evidence-handoff-latest.json',
        'docs/commercialization/owner-evidence-handoff-latest.md',
        'docs/commercialization/owner-evidence-completion-drill-latest.json',
        'docs/commercialization/owner-evidence-completion-drill-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated owner handoff and completion drill now carry ownerPrepActionNeededByGate source maps for remaining gates, and direct fixture suites reject missing, stale, or handoff/drill-drifted gate maps.',
      reason:
        'The Trust Center already showed gate-level prep readiness, but the owner execution artifacts still required readers to infer gate blockers from row-level actions; top-level maps make the closeout handoff self-contained without exposing owner-held proof contents.',
    },
    {
      decision: 'Expose owner execution by-gate prep count parity.',
      acceptance_check:
        'Owner-evidence handoff and completion-drill alignment fixtures must fail when ownerPrepActionNeededByGateCount drifts from ownerPrepActionNeededByGate maps or when generated Markdown omits the by-gate count rows.',
      chosen_variant: 'minimal persisted ownerPrepActionNeededByGateCount fields plus direct handoff and completion-drill fixture coverage',
      files_changed: [
        'scripts/generate-owner-evidence-handoff.mjs',
        'scripts/generate-owner-evidence-completion-drill.mjs',
        'scripts/verify-owner-evidence-handoff-alignment.mjs',
        'scripts/verify-owner-evidence-handoff-alignment-fixtures.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/owner-evidence-handoff-latest.json',
        'docs/commercialization/owner-evidence-handoff-latest.md',
        'docs/commercialization/owner-evidence-completion-drill-latest.json',
        'docs/commercialization/owner-evidence-completion-drill-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run verify:owner-evidence-handoff',
        'npm run verify:owner-evidence-completion-drill',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated owner handoff and completion drill now persist ownerPrepActionNeededByGateCount alongside their ownerPrepActionNeededByGate maps, display the count in Markdown, and fixture suites reject stale JSON counts or missing Markdown count rows.',
      reason:
        'The by-gate maps were already synchronized to closeout status, but owners still had to count map entries manually in JSON; a persisted count gives artifact readers a machine-readable basis without changing owner commands, owner-held proof policy, or launch readiness.',
    },
    {
      decision: 'Propagate owner prep-readiness by-gate reconciliation into the final commercial summary.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when ownerPrepActionNeededByGateCoverage drifts, when handoff/drill by-gate maps diverge from closeout status, or when the Markdown owner-execution rows omit gate-scoped counts.',
      chosen_variant: 'closeout-canonical summary snapshot plus handoff/drill parity checks',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries ownerPrepActionNeededByGateCoverage and a by-gate trace, while the alignment verifier rejects stale summary counts and handoff/drill maps that diverge from owner-evidence-closeout-status-latest.json.',
      reason:
        'The handoff and completion drill were self-contained, but the final release summary still hid the distinction between gate-scoped owner-prep actions and unique owner actions; surfacing both prevents closeout readers from miscounting shared owner-held artifacts.',
    },
    {
      decision: 'Make direct launch-evidence alignment fail closed on missing code optimization evidence.',
      acceptance_check:
        'Launch evidence alignment fixtures must fail when implementation_decisions, rejected_variants, code_optimization_reviews, or their Markdown sections disappear or contain incomplete review metadata.',
      chosen_variant: 'minimal direct manifest verifier hardening and fixture coverage',
      files_changed: [
        'scripts/verify-launch-evidence-alignment.mjs',
        'scripts/verify-launch-evidence-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The direct launch-evidence verifier now reports implementationDecisionCount, rejectedVariantCount, and codeOptimizationReviewCount, and its fixture suite rejects missing arrays, incomplete decision fields, non-passing optimization reviews, and Markdown section drift.',
      reason:
        'The final summary verifier already checked these arrays, but the standalone launch-evidence verifier could accept a weaker manifest even though this artifact is the portfolio and handoff source.',
    },
    {
      decision: 'Expose Stripe test checkout proof does-not-prove count.',
      acceptance_check:
        'The Stripe test checkout proof artifact must expose doesNotProveCount matching doesNotProve length, and live-proof packet alignment fixtures must fail when that source proof count drifts.',
      chosen_variant:
        'minimal derived doesNotProveCount in the Stripe test checkout proof artifact plus live-proof packet source-artifact count fixture coverage',
      files_changed: [
        'scripts/verify-stripe-test-checkout.mjs',
        'scripts/generate-live-proof-run-packet.mjs',
        'scripts/verify-live-proof-run-packet-alignment.mjs',
        'scripts/verify-live-proof-run-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/stripe-test-checkout-proof-latest.json',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run verify:stripe-test-checkout -- --allow-missing-env',
        'npm run verify:live-proof-run-packet',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The Stripe test checkout proof artifact now exposes doesNotProveCount=6 from its canonical doesNotProve array while preserving skipped_missing_env until owner-held test Stripe/Supabase credentials are supplied.',
      reason:
        'The proof artifact already carried clear Stripe checkout claim boundaries, but root readers and downstream packet alignment could not verify the boundary array size without manual inspection.',
    },
    {
      decision: 'Expose production calibration proof does-not-prove count.',
      acceptance_check:
        'The production calibration proof artifact must expose doesNotProveCount matching doesNotProve length, and live-proof packet alignment fixtures must fail when that source proof count drifts.',
      chosen_variant:
        'minimal derived doesNotProveCount in the production calibration proof artifact plus live-proof packet source-artifact count fixture coverage',
      files_changed: [
        'scripts/verify-production-calibration-run.mjs',
        'scripts/generate-live-proof-run-packet.mjs',
        'scripts/verify-live-proof-run-packet-alignment.mjs',
        'scripts/verify-live-proof-run-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/production-calibration-proof-latest.json',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run verify:live-proof-run-packet',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The production calibration proof artifact now exposes doesNotProveCount=5 from its canonical doesNotProve array while preserving the existing redacted passed calibration proof and avoiding a fresh deployed function invocation.',
      reason:
        'The proof artifact already carried clear calibration claim boundaries, but root readers and downstream packet alignment could not verify the boundary array size without manual inspection.',
    },
    {
      decision: 'Expose live-auth e2e proof does-not-prove count.',
      acceptance_check:
        'The live-auth e2e proof artifact must expose doesNotProveCount matching doesNotProve length, and live-proof packet alignment fixtures must fail when that source proof count drifts.',
      chosen_variant:
        'minimal derived doesNotProveCount in the live-auth e2e proof artifact plus live-proof packet source-artifact count fixture coverage',
      files_changed: [
        'scripts/verify-commercial-live-auth-e2e.mjs',
        'scripts/generate-live-proof-run-packet.mjs',
        'scripts/verify-live-proof-run-packet-alignment.mjs',
        'scripts/verify-live-proof-run-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/live-auth-e2e-proof-latest.json',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run verify:live-proof-run-packet',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The live-auth e2e proof artifact now exposes doesNotProveCount=7 from its canonical doesNotProve array while preserving the existing redacted passed authenticated artifact proof and avoiding a fresh live-auth verifier run.',
      reason:
        'The proof artifact already carried clear authenticated artifact claim boundaries, but root readers and downstream packet alignment could not verify the boundary array size without manual inspection.',
    },
    {
      decision: 'Expose Stripe live MRR proof does-not-prove count.',
      acceptance_check:
        'The Stripe live MRR proof artifact must expose doesNotProveCount matching doesNotProve length, and live-proof packet alignment fixtures must fail when that source proof count drifts.',
      chosen_variant:
        'minimal derived doesNotProveCount in the Stripe live MRR proof artifact plus live-proof packet source-artifact count fixture coverage',
      files_changed: [
        'scripts/verify-stripe-live-mrr.mjs',
        'scripts/generate-live-proof-run-packet.mjs',
        'scripts/verify-live-proof-run-packet-alignment.mjs',
        'scripts/verify-live-proof-run-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/stripe-live-mrr-proof-latest.json',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run verify:live-proof-run-packet',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The Stripe live MRR proof artifact now exposes doesNotProveCount=6 from its canonical doesNotProve array while preserving the existing failed redacted live-MRR proof and avoiding a fresh Stripe live API invocation.',
      reason:
        'The proof artifact already carried clear live-MRR claim boundaries, but root readers and downstream packet alignment could not verify the boundary array size without manual inspection.',
    },
    {
      decision: 'Use build-class timeout for post-summary launch-readiness fixtures.',
      acceptance_check:
        'The default commercial verifier must give the 250-case post-summary launch-readiness fixture suite a bounded timeout large enough for loaded full-run execution without changing optional Browser, Computer, live, payment, credential, outreach, worker, or owner-held gates.',
      chosen_variant:
        'single-step timeoutMs override on the existing post-summary launch-readiness fixture step using BUILD_STEP_TIMEOUT_MS',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'node scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run verify:live-proof-run-packet',
        'npm run verify:launch-evidence',
        'npm run verify:commercial-trust',
        'git diff --check',
      ],
      proof:
        'The direct post-summary launch-readiness fixture command passed 250 cases in 106.37 seconds, proving the previous full commercial verifier failure was a step-timeout policy problem rather than a hang, external wait, or generated-state blocker.',
      reason:
        'The fixture suite spawns the alignment verifier once per temp-root case; a loaded full verifier run can exceed the generic 5-minute step cap even though the direct fixture command is bounded and repo-local.',
    },
    {
      decision: 'Make direct launch-evidence alignment fail closed on missing adversarial review coverage.',
      acceptance_check:
        'Launch evidence alignment fixtures must fail when adversarial_reviews are missing, required adversarial lanes are absent, review fields are incomplete, or the Markdown adversarial review section drifts.',
      chosen_variant: 'minimal direct adversarial-review verifier hardening and fixture coverage',
      files_changed: [
        'scripts/verify-launch-evidence-alignment.mjs',
        'scripts/verify-launch-evidence-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The direct launch-evidence verifier now reports adversarialReviewCount and rejects missing adversarial reviews, missing review fields, missing launch-decision/evidence/market lanes, and Markdown adversarial section drift.',
      reason:
        'The skill requires final claims to pass adversarial review; the standalone launch-evidence verifier previously checked only the Markdown heading, not the machine-readable review rows.',
    },
    {
      decision: 'Record live closeout access source-audit coverage in the launch and commercial summary ledgers.',
      acceptance_check:
        'The release summary must expose liveCloseoutAccessSourceAuditCoverage and fail alignment if the source audit, readiness references, expected text, or summary rendering drift.',
      chosen_variant:
        'repo-side source-audit verifier plus summary/trust-boundary alignment, without claiming Supabase or GitHub account access',
      files_changed: [
        'scripts/verify-live-closeout-access-sources.mjs',
        'scripts/verify-live-closeout-access-sources-fixtures.mjs',
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'docs/commercialization/live-closeout-access-source-audit-latest.json',
        COMMERCIAL_VERIFICATION_SUMMARY_JSON,
        COMMERCIAL_VERIFICATION_SUMMARY_MD,
      ],
      tests_run: [
        'node scripts/verify-live-closeout-access-sources-fixtures.mjs',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-trust',
      ],
      proof:
        'The commercial summary now mirrors sourceCount, passedCount, failedCount, expected-text matches, source URLs, and an explicit boundary that the audit does not prove Supabase account access.',
      reason:
        'Live closeout readiness depends on external Supabase/GitHub access requirements; official source-page checks are useful only when kept separate from live account proof.',
    },
    {
      decision: 'Record live closeout readiness status in the final commercial summary.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when liveCloseoutReadinessCoverage is missing, stale against live-closeout-readiness-latest.json, omits failed access checks, or allows external mutation/secret-printing overclaims.',
      chosen_variant: 'compact live-closeout readiness snapshot plus no-mutation verifier guardrails',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries liveCloseoutReadinessCoverage from live-closeout-readiness-latest.json, including owner_access_required status, failed Supabase project/functions access checks, redacted GitHub secret-name counts, and no-mutation/no-secret-printing boundaries.',
      reason:
        'The summary previously exposed official reference coverage for live closeout access but not the actual readiness result, so release readers could miss that Supabase account/functions access still blocks live closeout.',
    },
    {
      decision: 'Record owner operational access prerequisites in the final commercial summary.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when operational access prerequisite coverage is missing, stale against owner handoff/completion-drill artifacts, or disappears from Markdown.',
      chosen_variant:
        'compact operational access prerequisite snapshot sourced from owner-evidence handoff, with completion-drill parity checks',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries ownerEvidenceExecutionSummary.operationalAccessPrerequisiteSummary from owner-evidence-handoff-latest.json, including live_closeout_supabase_access, owner_access_required status, failed Supabase check IDs, and the boundary that the repo cannot grant project access or prove live closeout.',
      reason:
        'Owner handoff and completion drill artifacts exposed the Supabase access prerequisite, but the release-level summary did not reconcile it, so a summary-only reader could miss the operational access blocker.',
    },
    {
      decision: 'Expose the full-local approval package inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when full-local approval-package state is missing, stale against postSummaryFullLocalApprovalPackage, upgraded to approved, or omitted from Markdown.',
      chosen_variant:
        'compact fullLocalApprovalPackageSummary inside commercialReadinessState, derived from existing default-core invocation options and the post-summary full-local approval-package contract',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries commercialReadinessState.fullLocalApprovalPackageSummary with status=approval_required_plan_only, executionApproved=false, optional gate commands, approval-required gates, and a boundary that it does not execute Browser/Computer, accessibility, network, audit, full-local, live, payment, credential, outreach, or owner-held evidence gates.',
      reason:
        'The post-summary approval package was visible in an appendix, but a launch-readiness state reader could still miss that optional full-local execution remains approval-gated.',
    },
    {
      decision: 'Expose full-local approval does-not-prove count.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when commercialReadinessState.fullLocalApprovalPackageSummary doesNotProveCount drifts from the full-local doesNotProve boundary array or when the Markdown count row is missing.',
      chosen_variant:
        'minimal doesNotProveCount field on the plan-only full-local approval summary plus Markdown visibility and alignment fixture checks',
      files_changed: [
        'scripts/verify-commercial-full-local-approval-package.mjs',
        'scripts/verify-commercial-full-local-approval-package-fixtures.mjs',
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-full-local-approval-package',
        'npm run verify:commercial-full-local-approval-package-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now exposes fullLocalApprovalPackageSummary.doesNotProveCount matching the three plan-only full-local approval doesNotProve boundaries, and the alignment fixtures reject stale JSON count metadata or missing Markdown count rows without executing optional gates.',
      reason:
        'The plan-only full-local approval summary is a release-safety handoff; readers should know the claim-boundary basis size without inspecting the doesNotProve array before relying on the approval-required boundary.',
    },
    {
      decision: 'Expose the post-summary artifact-redaction contract inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when post-summary artifact-redaction state is missing, stale against postSummaryArtifactRedaction, has stale source artifacts, or is omitted from Markdown.',
      chosen_variant:
        'compact postSummaryArtifactRedactionSummary inside commercialReadinessState, derived from the existing post-summary redaction command contract and result artifact paths without embedding post-scan counts into the pre-scan summary',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries commercialReadinessState.postSummaryArtifactRedactionSummary with the redaction command, result artifacts, alignment verifier, fixture verifier, post-summary timing boundary, and does-not-prove clauses while preserving the later redaction artifact as the actual pass/fail scan evidence.',
      reason:
        'The post-summary redaction scan was visible in a top-level appendix, but a launch-readiness state reader could miss the final generated-artifact safety boundary and the fact that the scan evidence is produced after the summary timestamp.',
    },
    {
      decision: 'Expose post-summary launch-evidence refresh inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when the state refresh summary is missing, stale, command/source drifted, or omitted from Markdown.',
      chosen_variant:
        'compact postSummaryLaunchEvidenceRefreshSummary inside commercialReadinessState, derived from the existing post-summary launch-evidence refresh contract without executing optional gates',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries commercialReadinessState.postSummaryLaunchEvidenceRefreshSummary with the refresh command, result artifacts, final-summary rewrite purpose, timing boundary, and does-not-prove clauses while preserving the pilot-only launch decision.',
      reason:
        'The top-level post-summary launch-evidence refresh appendix existed, but a state-only reader could miss the refresh lifecycle that keeps launch evidence and commercialReadinessState in parity after the initial passed summary.',
    },
    {
      decision: 'Expose post-summary launch-readiness alignment inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when the state alignment summary is missing, stale, command/source drifted, or omitted from Markdown.',
      chosen_variant:
        'compact postSummaryLaunchReadinessAlignmentSummary inside commercialReadinessState, derived from the existing post-summary launch-readiness alignment contract without executing optional gates',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries commercialReadinessState.postSummaryLaunchReadinessAlignmentSummary with the alignment command, fixture verifier, timing boundary, and does-not-prove clauses while preserving the pilot-only launch decision and owner/live gates.',
      reason:
        'The top-level post-summary launch-readiness alignment appendix existed, but a state-only reader could miss the final owner/remediation alignment check and its fixture boundary.',
    },
    {
      decision: 'Mirror post-summary launch-readiness alignment source trace in the top-level appendix.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when the top-level postSummaryLaunchReadinessAlignment source artifact, sourceTrace rows, sourceTraceBoundary, does-not-prove clauses, or Markdown appendix trace are missing or stale.',
      chosen_variant:
        'preserve the existing postSummaryLaunchReadinessAlignmentSummary object as the top-level postSummaryLaunchReadinessAlignment appendix instead of stripping it to command/order/fixture fields',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary top-level postSummaryLaunchReadinessAlignment appendix now includes sourceArtifact, status, sourceTraceCount, sourceTrace, sourceTraceBoundary, and doesNotProve fields, with Markdown appendix source-trace rows and fail-closed fixture coverage while preserving the pilot-only launch decision.',
      reason:
        'The state summary already carried the source trace, but the top-level post-summary appendix remained thinner than sibling post-summary appendices, leaving handoff readers without a direct source-traced appendix contract.',
    },
    {
      decision: 'Expose post-summary lifecycle does-not-prove counts.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when postSummaryArtifactRedaction, postSummaryLaunchReadinessAlignment, or postSummaryLaunchEvidenceRefresh doesNotProveCount drifts from doesNotProve arrays or when generated Markdown omits the post-summary lifecycle count rows.',
      chosen_variant:
        'minimal doesNotProveCount fields on the three post-summary lifecycle summaries plus exact launch-readiness fixture coverage',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now exposes doesNotProveCount for post-summary artifact redaction, launch-readiness alignment, and launch-evidence refresh summaries, renders those counts in Markdown, and launch-readiness fixtures reject stale JSON counts or omitted Markdown rows.',
      reason:
        'These post-summary lifecycle objects already exposed sourceTraceCount and doesNotProve arrays, but readers had to inspect boundary arrays manually while the sibling full-local approval package already exposed count parity.',
    },
    {
      decision: 'Expose root commercial verification summary count parity.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when root stepCount, failedStepCount, or doesNotProveCount drifts from the root steps, failedSteps, or doesNotProve arrays, or when generated Markdown omits the root count rows.',
      chosen_variant:
        'minimal root stepCount and doesNotProveCount fields plus exact failedStepCount parity checks and section-scoped Markdown validation',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary root now exposes stepCount and doesNotProveCount, keeps failedStepCount synchronized with failedSteps, renders the root counts in Markdown, and launch-readiness fixtures reject stale JSON counts or omitted root count rows.',
      reason:
        'The root summary already exposed steps, failedSteps, failedStepCount, and doesNotProve, but the primary handoff artifact did not expose count parity for step rows or top-level proof-boundary rows.',
    },
    {
      decision: 'Expose owner evidence closeout status root count parity.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when owner-evidence-closeout-status-latest.json root acceptedLiveGateCount, ownerGateCloseoutSummaryCount, stepCount, failedStepCount, or wroteCount drifts from its generated arrays.',
      chosen_variant:
        'minimal closeout status root count fields plus launch-readiness alignment fixture drift cases',
      files_changed: [
        'scripts/closeout-owner-evidence.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/owner-evidence-closeout-status-latest.json',
        'docs/commercialization/owner-evidence-closeout-status-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:owner-evidence-closeout-status',
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'Owner-evidence closeout status now exposes root count parity for accepted live gates, owner gate closeout rows, closeout steps, failed closeout steps, and written artifacts, and launch-readiness fixtures fail closed on stale count metadata.',
      reason:
        'owner-evidence-closeout-status-latest.json already exposed the arrays and some nested scoreboard counts, but root status readers still had to inspect acceptedLiveGateIds, ownerGateCloseoutSummary, steps, failedStepIds, and wrote arrays manually.',
    },
    {
      decision: 'Add canonical sourceTrace aliases to remediation summaries.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when remediationCompletion.sourceTrace or remediationExternalGates.sourceTrace aliases are missing or stale against their existing per-gate remediation source traces.',
      chosen_variant:
        'minimal alias parity: keep the existing specialized remediation trace fields and add sourceTrace/sourceTraceCount aliases with exact alignment checks',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary remediationCompletion and remediationExternalGates objects now expose canonical sourceTrace/sourceTraceCount aliases in addition to their existing specialized per-gate trace fields, with fail-closed fixture coverage while preserving pilot-only launch readiness.',
      reason:
        'The remediation summaries already carried source-traced rows, but generic release-state consumers had to know bespoke field names instead of using the same sourceTrace/sourceTraceCount contract as surrounding summary objects.',
    },
    {
      decision: 'Expose release-gate coverage inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when release-gate coverage state is missing, stale against releaseGateCoverage, source-drifted, or omitted from Markdown.',
      chosen_variant:
        'compact releaseGateCoverageSummary inside commercialReadinessState, derived from the existing releaseGateCoverage object and current verifier invocation results without executing optional gates',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries commercialReadinessState.releaseGateCoverageSummary with included, not-included, passed, optional-not-included, command, boundary, and does-not-prove coverage while preserving the pilot-only launch decision and owner/live gates.',
      reason:
        'The top-level releaseGateCoverage object existed, but a state-only reader could miss that Browser/Computer, accessibility, network/audit, and full-local gates were not included in the default verifier invocation.',
    },
    {
      decision: 'Expose release-gate coverage source trace inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when releaseGateCoverageSummary source trace metadata is missing, stale, or omitted from Markdown.',
      chosen_variant:
        'compact gate-level source trace rows inside releaseGateCoverageSummary, derived from existing releaseGateCoverage entries without executing optional gates',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries sourceArtifactCount, sourceTraceCount, sourceTrace, and sourceTraceBoundary for releaseGateCoverageSummary while preserving the pilot-only launch decision and optional-gate boundaries.',
      reason:
        'The releaseGateCoverageSummary exposed included/not-included gate counts and gate objects, but lacked deterministic source anchors back to the releaseGateCoverage entries that prove which optional gates did not run.',
    },
    {
      decision: 'Expose release-gate coverage does-not-prove count.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when releaseGateCoverageSummary doesNotProveCount drifts from the release-gate doesNotProve boundary array or when the Markdown count row is missing.',
      chosen_variant:
        'minimal doesNotProveCount field on releaseGateCoverageSummary plus Markdown visibility and alignment fixture checks',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now exposes releaseGateCoverageSummary.doesNotProveCount matching the three release-gate does-not-prove boundaries, and the launch-readiness fixtures reject stale JSON count metadata or missing Markdown count rows without executing optional gates.',
      reason:
        'releaseGateCoverageSummary carried a doesNotProve array, but readers had to count boundaries manually when checking that optional Browser/Computer, accessibility, network, full-local, live, payment, credential, outreach, and owner-held gates were not proven by the default verifier.',
    },
    {
      decision: 'Expose owner-action queue source trace inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when owner-action queue sourceTrace metadata is missing, stale, or omitted from Markdown.',
      chosen_variant:
        'compact per-gate sourceTrace rows inside ownerActionQueueSummary, derived from existing closeout, handoff, completion-drill, and remediation artifacts without executing owner gates',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries ownerActionQueueSummary sourceTraceCount and per-gate sourceTrace rows for remediationExternalGates, closeoutStatus, handoff, and completionDrill per remaining owner gate, plus Markdown source trace rows, while preserving the pilot-only launch decision and owner-held evidence boundaries.',
      reason:
        'The owner-action queue rows contained commands, policies, and source artifact maps, but state-only readers still lacked a deterministic sourceTrace array/count for provenance checks and summary consumers.',
    },
    {
      decision: 'Expose post-summary command-contract source trace inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when post-summary command-contract sourceTrace metadata is missing, stale, or omitted from Markdown for artifact redaction, launch-readiness alignment, launch-evidence refresh, and full-local approval summaries.',
      chosen_variant:
        'shared deterministic command-contract sourceTrace rows on the four post-summary summary objects, without executing Browser/Computer, accessibility, network, full-local, live, payment, credential, outreach, worker, or owner-held gates',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries sourceTraceCount, sourceTrace, and sourceTraceBoundary for the post-summary artifact-redaction, launch-readiness alignment, launch-evidence refresh, and full-local approval package summaries, plus Markdown source-trace tables for each contract.',
      reason:
        'The post-summary summaries already exposed commands and boundaries, but readers could not audit those release-level command contracts through consistent machine-readable sourceTrace rows.',
    },
    {
      decision: 'Expose owner handoff command sequence source trace inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when owner handoff or completion-drill command source anchors are missing, stale, or omitted from Markdown.',
      chosen_variant:
        'deterministic commandSequence and recommendedCommandOrder source trace rows inside ownerEvidenceExecutionSummary, derived from existing owner handoff and completion-drill artifacts without executing owner gates',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries source anchors for owner handoff commandSequence and completion-drill recommendedCommandOrder rows, plus Markdown source trace tables, while preserving the pilot-only launch decision and owner-held evidence boundaries.',
      reason:
        'The owner handoff commandSequence and completion-drill recommendedCommandOrder arrays were exposed as plain command lists, so state-only readers could not trace individual owner commands back to their repo-generated artifacts.',
    },
    {
      decision: 'Expose operational access prerequisite source trace inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when operational-access prerequisite source anchors are missing, stale, or omitted from Markdown.',
      chosen_variant:
        'compact per-prerequisite source trace rows inside ownerEvidenceExecutionSummary.operationalAccessPrerequisiteSummary, derived from existing owner handoff, completion-drill, and live-closeout readiness artifacts without granting or testing live access',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries source anchors for operational-access prerequisites across owner handoff, completion-drill, and live-closeout readiness checks, plus Markdown source trace rows, while preserving the pilot-only launch decision and owner-held access boundaries.',
      reason:
        'The operational-access summary counted handoff and completion-drill prerequisites, but state-only readers could not trace each prerequisite across the handoff, completion-drill, and live closeout readiness artifacts that produced the owner-access blocker.',
    },
    {
      decision: 'Expose owner closeout failed-step source trace inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when failed closeout step source anchors are missing, stale, or omitted from Markdown.',
      chosen_variant:
        'compact per-step source trace rows inside ownerEvidenceExecutionSummary.closeoutCoverage, derived from existing owner closeout status steps without executing owner commands or live gates',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries source anchors, commands, and statuses for failed owner closeout steps from owner-evidence-closeout-status-latest.json, plus Markdown source trace rows, while preserving the pilot-only launch decision and owner-held evidence boundaries.',
      reason:
        'The closeout summary counted failed owner closeout steps and exposed failedStepIds, but state-only readers could not trace each failed step back to the repo-generated closeout status step and command that produced the blocker.',
    },
    {
      decision: 'Expose owner closeout next-command and status-artifact source trace inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when owner closeout next-command or status-artifact source anchors are missing, stale, or omitted from Markdown.',
      chosen_variant:
        'compact next-command and status-artifact source trace rows inside ownerEvidenceExecutionSummary.closeoutCoverage, derived from existing owner closeout status maps without executing owner commands or live gates',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries source anchors for owner closeout nextCommands and statusArtifacts from owner-evidence-closeout-status-latest.json, plus Markdown source trace rows, while preserving the pilot-only launch decision and owner-held evidence boundaries.',
      reason:
        'The closeout status artifact exposed the owner command map and status artifact paths, but commercialReadinessState closeoutCoverage omitted those maps, so state-only readers could not trace the exact owner closeout commands or status outputs without opening the closeout artifact separately.',
    },
    {
      decision: 'Expose live closeout readiness source trace inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when live closeout readiness check, next-action, or official-reference source anchors are missing, stale, or omitted from Markdown.',
      chosen_variant:
        'compact check, next-action, and official-reference source trace rows inside liveCloseoutReadinessCoverage, derived from the existing redacted live closeout readiness artifact without rerunning live access checks',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries source anchors for live closeout readiness checks, next actions, and official references from live-closeout-readiness-latest.json, plus Markdown source trace rows, while preserving the owner_access_required status and pilot-only launch decision.',
      reason:
        'The live closeout readiness coverage exposed failed checks and next actions, but state-only readers could not trace those blockers, next steps, or official references back to the redacted readiness artifact that produced them.',
    },
    {
      decision: 'Add canonical sourceTrace aliases to liveCloseoutReadinessCoverage.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when liveCloseoutReadinessCoverage.sourceTrace/sourceTraceCount aliases are missing or stale against check, next-action, and official-reference traces.',
      chosen_variant:
        'minimal aggregate alias parity: keep specialized live-closeout readiness trace arrays and add a canonical sourceTrace/sourceTraceCount aggregate with exact validation',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary liveCloseoutReadinessCoverage object now exposes canonical sourceTrace/sourceTraceCount fields aggregating check, next-action, and official-reference trace rows, with fail-closed fixture coverage while preserving owner_access_required status.',
      reason:
        'The live closeout readiness coverage already carried specialized source-traced rows, but generic release-state consumers still needed field-specific knowledge instead of the common sourceTrace/sourceTraceCount contract.',
    },
    {
      decision: 'Expose live closeout readiness artifact action and boundary counts.',
      acceptance_check:
        'Live closeout readiness source and summary fixtures must fail when nextActionCount or doesNotProveCount drifts from nextActions or doesNotProve, or when generated Markdown omits those count rows.',
      chosen_variant:
        'minimal live-closeout readiness count parity: keep the redacted access-check artifact unchanged except for deterministic root counts and Markdown visibility for next actions and does-not-prove boundaries',
      files_changed: [
        'scripts/verify-live-closeout-readiness.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/live-closeout-readiness-latest.json',
        'docs/commercialization/live-closeout-readiness-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:live-closeout-readiness-status',
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'live-closeout-readiness-latest.json now exposes nextActionCount and doesNotProveCount matching its root arrays, and generated Markdown displays those counts while summary fixtures reject stale count metadata.',
      reason:
        'Owner-access closeout readers should know the action and claim-boundary basis size of the redacted live closeout readiness artifact without inspecting arrays before deciding what access work remains.',
    },
    {
      decision: 'Add canonical sourceTrace aliases to owner closeout coverage.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when ownerEvidenceExecutionSummary.closeoutCoverage.sourceTrace/sourceTraceCount aliases are missing or stale against failed-step, next-command, and status-artifact traces.',
      chosen_variant:
        'minimal aggregate alias parity: keep specialized owner closeout trace arrays and add a canonical sourceTrace/sourceTraceCount aggregate with exact validation',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary ownerEvidenceExecutionSummary.closeoutCoverage object now exposes canonical sourceTrace/sourceTraceCount fields aggregating failed-step, next-command, and status-artifact trace rows, with fail-closed fixture coverage while preserving the pilot-only launch decision and owner-held evidence boundaries.',
      reason:
        'The owner closeout coverage already carried specialized source-traced rows, but generic release-state consumers still needed field-specific knowledge instead of the common sourceTrace/sourceTraceCount contract.',
    },
    {
      decision: 'Add canonical sourceTrace aliases to owner handoff coverage.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when ownerEvidenceExecutionSummary.handoffCoverage.sourceTrace/sourceTraceCount aliases are missing or stale against commandSequenceSourceTrace.',
      chosen_variant:
        'minimal alias parity: keep specialized owner handoff commandSequenceSourceTrace and add canonical sourceTrace/sourceTraceCount with exact validation',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary ownerEvidenceExecutionSummary.handoffCoverage object now exposes canonical sourceTrace/sourceTraceCount fields matching commandSequenceSourceTrace, with fail-closed fixture coverage while preserving the pilot-only launch decision and owner-held evidence boundaries.',
      reason:
        'The owner handoff coverage already carried source-traced command sequence rows, but generic release-state consumers still needed field-specific knowledge instead of the common sourceTrace/sourceTraceCount contract.',
    },
    {
      decision: 'Add canonical sourceTrace aliases to owner completion-drill coverage.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when ownerEvidenceExecutionSummary.completionDrillCoverage.sourceTrace/sourceTraceCount aliases are missing or stale against recommendedCommandOrderSourceTrace.',
      chosen_variant:
        'minimal alias parity: keep specialized owner completion-drill recommendedCommandOrderSourceTrace and add canonical sourceTrace/sourceTraceCount with exact validation',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary ownerEvidenceExecutionSummary.completionDrillCoverage object now exposes canonical sourceTrace/sourceTraceCount fields matching recommendedCommandOrderSourceTrace, with fail-closed fixture coverage while preserving the pilot-only launch decision and owner-held evidence boundaries.',
      reason:
        'The owner completion-drill coverage already carried source-traced recommended command rows, but generic release-state consumers still needed field-specific knowledge instead of the common sourceTrace/sourceTraceCount contract.',
    },
    {
      decision: 'Require primary sourceArtifact on commercial readiness canonical sourceTrace rows.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when any commercialReadinessState canonical sourceTrace row lacks a primary sourceArtifact, while exact alignment must fail when that primary sourceArtifact is stale.',
      chosen_variant:
        'minimal primary-anchor parity: keep existing sourceArtifacts maps and add one deterministic sourceArtifact to each affected canonical sourceTrace row, plus a generic invariant in the alignment verifier',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary canonical sourceTrace rows now expose a primary sourceArtifact alongside richer sourceArtifacts maps, and the launch-readiness verifier includes a generic fail-closed invariant for missing primary anchors.',
      reason:
        'Generic release-state consumers should not need row-specific sourceArtifacts map knowledge before they can locate a primary artifact anchor for each canonical sourceTrace row.',
    },
    {
      decision: 'Require primary sourceArtifact on owner-action queue detail rows.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when any ownerActionQueueSummary detail row lacks the primary remediation ownerActionQueue sourceArtifact, when that primary sourceArtifact is stale, or when the Markdown command trace omits it.',
      chosen_variant:
        'minimal row primary-anchor parity: keep existing row sourceArtifacts maps and add one deterministic sourceArtifact to each owner-action detail row matching the remediation ownerActionQueue anchor',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary ownerActionQueueSummary detail rows now expose a primary sourceArtifact alongside richer sourceArtifacts maps, and Markdown command traces display that row-level primary anchor.',
      reason:
        'Generic release-state consumers should not need row-specific sourceArtifacts map knowledge before locating the primary source anchor for each owner-action queue row.',
    },
    {
      decision: 'Require primary sourceArtifact on commercial summary aggregate objects.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when commercialReadinessState or ownerActionQueueSummary aggregate objects lack their deterministic primary sourceArtifact, when that primary sourceArtifact is stale, or when the Markdown aggregate rows omit it.',
      chosen_variant:
        'minimal aggregate primary-anchor parity: keep existing sourceArtifacts maps and add one deterministic sourceArtifact to each affected commercial-summary aggregate',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary aggregate objects commercialReadinessState and ownerActionQueueSummary now expose primary sourceArtifact values alongside richer sourceArtifacts maps, and Markdown summary rows display those primary anchors.',
      reason:
        'Generic release-state consumers should not need aggregate-specific sourceArtifacts map keys before locating the primary artifact anchor for commercial readiness state or owner-action queue summary provenance.',
    },
    {
      decision: 'Require primary sourceArtifact on owner-evidence handoff packet root.',
      acceptance_check:
        'Owner-evidence handoff fixtures must fail when the packet root sourceArtifact is missing, stale against sourceArtifacts.remediationLedger, when sourceArtifactCount drifts, or when Markdown omits the primary root anchor.',
      chosen_variant:
        'minimal handoff root primary-anchor parity: keep the existing sourceArtifacts map and add one deterministic root sourceArtifact plus sourceArtifactCount to the generated handoff packet',
      files_changed: [
        'scripts/generate-owner-evidence-handoff.mjs',
        'scripts/verify-owner-evidence-handoff-alignment.mjs',
        'scripts/verify-owner-evidence-handoff-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/owner-evidence-handoff-latest.json',
        'docs/commercialization/owner-evidence-handoff-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run generate:owner-evidence-handoff',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated owner-evidence handoff packet root now exposes sourceArtifact matching sourceArtifacts.remediationLedger and sourceArtifactCount matching its sourceArtifacts key count, with Markdown displaying the primary root anchor.',
      reason:
        'Generic owner-handoff readers should not need handoff-specific sourceArtifacts map-key knowledge before locating the primary remediation ledger provenance anchor.',
    },
    {
      decision: 'Expose owner-evidence handoff packet source trace rows.',
      acceptance_check:
        'Owner-evidence handoff fixtures must fail when sourceTraceCount drifts from sourceTrace, when sourceTrace rows are stale against sourceArtifacts, when sourceTraceBoundary drifts, or when generated Markdown omits the source-trace rows.',
      chosen_variant:
        'minimal sourceTrace/sourceTraceCount/sourceTraceBoundary derived from the existing sourceArtifacts map plus Markdown visibility and handoff drift fixtures',
      files_changed: [
        'scripts/generate-owner-evidence-handoff.mjs',
        'scripts/verify-owner-evidence-handoff-alignment.mjs',
        'scripts/verify-owner-evidence-handoff-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/owner-evidence-handoff-latest.json',
        'docs/commercialization/owner-evidence-handoff-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run generate:owner-evidence-handoff',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated owner-evidence handoff packet now exposes sourceTraceCount=4 and sourceTrace rows for each sourceArtifacts key, renders the trace in Markdown, and direct fixtures reject stale JSON trace rows, stale boundaries, or omitted Markdown visibility.',
      reason:
        'Generic owner-handoff readers should not need to infer provenance by inspecting the sourceArtifacts map instead of using the same sourceTrace/sourceTraceCount contract as adjacent owner and launch-readiness packets.',
    },
    {
      decision: 'Require primary sourceArtifact on owner-evidence completion drill packet root.',
      acceptance_check:
        'Owner-evidence completion-drill fixtures must fail when the packet root sourceArtifact is missing, stale against sourceArtifacts.handoff, when sourceArtifactCount drifts, or when Markdown omits the primary root anchor.',
      chosen_variant:
        'minimal completion-drill root primary-anchor parity: keep the existing sourceArtifacts map and add one deterministic root sourceArtifact plus sourceArtifactCount to the generated completion-drill packet',
      files_changed: [
        'scripts/generate-owner-evidence-completion-drill.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/owner-evidence-completion-drill-latest.json',
        'docs/commercialization/owner-evidence-completion-drill-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run generate:owner-evidence-completion-drill',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated owner-evidence completion drill packet root now exposes sourceArtifact matching sourceArtifacts.handoff and sourceArtifactCount matching its sourceArtifacts key count, with Markdown displaying the primary root anchor.',
      reason:
        'Generic owner completion-drill readers should not need drill-specific sourceArtifacts map-key knowledge before locating the primary handoff provenance anchor for the gate-by-gate execution matrix.',
    },
    {
      decision: 'Expose owner-evidence completion drill packet source trace rows.',
      acceptance_check:
        'Owner-evidence completion-drill fixtures must fail when sourceTraceCount drifts from sourceTrace, when sourceTrace rows are stale against sourceArtifacts, when sourceTraceBoundary drifts, or when generated Markdown omits the source-trace rows.',
      chosen_variant:
        'minimal sourceTrace/sourceTraceCount/sourceTraceBoundary derived from the existing sourceArtifacts map plus Markdown visibility and completion-drill drift fixtures',
      files_changed: [
        'scripts/generate-owner-evidence-completion-drill.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/owner-evidence-completion-drill-latest.json',
        'docs/commercialization/owner-evidence-completion-drill-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run generate:owner-evidence-completion-drill',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated owner-evidence completion drill packet now exposes sourceTraceCount=8 and sourceTrace rows for each sourceArtifacts key, renders the trace in Markdown, and direct fixtures reject stale JSON trace rows, stale boundaries, or omitted Markdown visibility.',
      reason:
        'Generic owner completion-drill readers should not need to infer provenance by inspecting the sourceArtifacts map instead of using the same sourceTrace/sourceTraceCount contract as adjacent owner and launch-readiness packets.',
    },
    {
      decision: 'Require primary sourceArtifact on commercial evidence intake packet root.',
      acceptance_check:
        'Commercial evidence intake packet fixtures must fail when the packet root sourceArtifact is missing, stale against sourceArtifacts.intakeTemplate, when sourceArtifactCount drifts, or when Markdown omits the primary root anchor.',
      chosen_variant:
        'minimal intake packet root primary-anchor parity: keep the existing sourceArtifacts map and add one deterministic root sourceArtifact plus sourceArtifactCount to the generated intake packet',
      files_changed: [
        'scripts/generate-commercial-evidence-intake-packet.mjs',
        'scripts/verify-commercial-evidence-intake-packet-alignment.mjs',
        'scripts/verify-commercial-evidence-intake-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-evidence-intake-packet-latest.json',
        'docs/commercialization/commercial-evidence-intake-packet-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-evidence-intake-packet-alignment-fixtures',
        'npm run generate:commercial-evidence-intake-packet',
        'npm run verify:commercial-evidence-intake-packet-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated commercial evidence intake packet root now exposes sourceArtifact matching sourceArtifacts.intakeTemplate and sourceArtifactCount matching its sourceArtifacts key count, with Markdown displaying the primary root anchor.',
      reason:
        'Generic intake-packet readers should not need intake-specific sourceArtifacts map-key knowledge before locating the primary worksheet template provenance anchor for owner commercial evidence collection.',
    },
    {
      decision: 'Expose commercial evidence intake packet source trace rows.',
      acceptance_check:
        'Commercial evidence intake packet alignment fixtures must fail when sourceTraceCount drifts from sourceTrace, when sourceTrace rows are stale against sourceArtifacts, or when generated Markdown omits the source-trace rows.',
      chosen_variant:
        'minimal sourceTrace/sourceTraceCount/sourceTraceBoundary derived from the existing sourceArtifacts map plus Markdown visibility and intake-packet drift fixtures',
      files_changed: [
        'scripts/generate-commercial-evidence-intake-packet.mjs',
        'scripts/verify-commercial-evidence-intake-packet-alignment.mjs',
        'scripts/verify-commercial-evidence-intake-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-evidence-intake-packet-latest.json',
        'docs/commercialization/commercial-evidence-intake-packet-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-evidence-intake-packet-alignment-fixtures',
        'npm run generate:commercial-evidence-intake-packet',
        'npm run verify:commercial-evidence-intake-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated commercial evidence intake packet now exposes sourceTraceCount=6 and sourceTrace rows for each sourceArtifacts key, renders the trace in Markdown, and direct fixtures reject stale JSON trace rows or omitted Markdown visibility.',
      reason:
        'The packet had sourceArtifact/sourceArtifacts provenance, but generic intake-packet readers still lacked the common sourceTrace/sourceTraceCount contract used by neighboring commercial handoff artifacts.',
    },
    {
      decision: 'Require primary sourceArtifact on live proof run packet root.',
      acceptance_check:
        'Live proof run packet fixtures must fail when the packet root sourceArtifact is missing, stale against sourceArtifacts.ownerEvidencePrep, when sourceArtifactCount drifts, or when Markdown omits the primary root anchor.',
      chosen_variant:
        'minimal live-proof packet root primary-anchor parity: keep the existing sourceArtifacts map and add one deterministic root sourceArtifact plus sourceArtifactCount to the generated live proof packet',
      files_changed: [
        'scripts/generate-live-proof-run-packet.mjs',
        'scripts/verify-live-proof-run-packet-alignment.mjs',
        'scripts/verify-live-proof-run-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/live-proof-run-packet-latest.json',
        'docs/commercialization/live-proof-run-packet-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run generate:live-proof-run-packet',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated live proof run packet root now exposes sourceArtifact matching sourceArtifacts.ownerEvidencePrep and sourceArtifactCount matching its sourceArtifacts key count, with Markdown displaying the primary root anchor.',
      reason:
        'Generic live-proof packet readers should not need live-proof-specific sourceArtifacts map-key knowledge before locating the primary owner-prep provenance anchor for credentialed proof readiness.',
    },
    {
      decision: 'Expose live proof run packet source trace rows.',
      acceptance_check:
        'Live proof run packet alignment fixtures must fail when sourceTraceCount drifts from sourceTrace, when sourceTrace rows are stale against sourceArtifacts, or when generated Markdown omits the source-trace rows.',
      chosen_variant:
        'minimal sourceTrace/sourceTraceCount/sourceTraceBoundary derived from the existing sourceArtifacts map plus Markdown visibility and live-proof packet drift fixtures',
      files_changed: [
        'scripts/generate-live-proof-run-packet.mjs',
        'scripts/verify-live-proof-run-packet-alignment.mjs',
        'scripts/verify-live-proof-run-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/live-proof-run-packet-latest.json',
        'docs/commercialization/live-proof-run-packet-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run generate:live-proof-run-packet',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated live proof run packet now exposes sourceTraceCount=4 and sourceTrace rows for each sourceArtifacts key, renders the trace in Markdown, and direct fixtures reject stale JSON trace rows or omitted Markdown visibility.',
      reason:
        'The packet had sourceArtifact/sourceArtifacts provenance, but generic live-proof readers still lacked the common sourceTrace/sourceTraceCount contract used by neighboring commercial handoff artifacts.',
    },
    {
      decision: 'Require primary sourceArtifact on manual WCAG review packet root.',
      acceptance_check:
        'Manual WCAG review packet fixtures must fail when the packet root sourceArtifact is missing, stale against sourceArtifacts.manualEvidenceTemplate, when sourceArtifactCount drifts, or when Markdown omits the primary root anchor.',
      chosen_variant:
        'minimal manual-WCAG review packet root primary-anchor parity: keep the existing sourceArtifacts map and add one deterministic root sourceArtifact plus sourceArtifactCount to the generated manual WCAG review packet',
      files_changed: [
        'scripts/generate-manual-wcag-review-packet.mjs',
        'scripts/verify-manual-wcag-review-packet-alignment.mjs',
        'scripts/verify-manual-wcag-review-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/manual-wcag-review-packet-latest.json',
        'docs/commercialization/manual-wcag-review-packet-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:manual-wcag-review-packet-alignment-fixtures',
        'npm run generate:manual-wcag-review-packet',
        'npm run verify:manual-wcag-review-packet-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated manual WCAG review packet root now exposes sourceArtifact matching sourceArtifacts.manualEvidenceTemplate and sourceArtifactCount matching its sourceArtifacts key count, with Markdown displaying the primary root anchor.',
      reason:
        'Generic manual-WCAG packet readers should not need manual-WCAG-specific sourceArtifacts map-key knowledge before locating the primary manual evidence template provenance anchor for owner review execution.',
    },
    {
      decision: 'Expose manual WCAG review packet source trace rows.',
      acceptance_check:
        'Manual WCAG review packet fixtures must fail when sourceTraceCount drifts from sourceTrace, when sourceTrace rows are stale against sourceArtifacts, or when generated Markdown omits the source-trace rows.',
      chosen_variant:
        'minimal sourceTrace/sourceTraceCount/sourceTraceBoundary derived from the existing sourceArtifacts map plus Markdown visibility and manual-WCAG review packet drift fixtures',
      files_changed: [
        'scripts/generate-manual-wcag-review-packet.mjs',
        'scripts/verify-manual-wcag-review-packet-alignment.mjs',
        'scripts/verify-manual-wcag-review-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/manual-wcag-review-packet-latest.json',
        'docs/commercialization/manual-wcag-review-packet-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:manual-wcag-review-packet-alignment-fixtures',
        'npm run generate:manual-wcag-review-packet',
        'npm run verify:manual-wcag-review-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated manual WCAG review packet now exposes sourceTraceCount=5 and sourceTrace rows for each sourceArtifacts key, renders the trace in Markdown, and direct fixtures reject stale JSON trace rows or omitted Markdown visibility.',
      reason:
        'The packet had sourceArtifact/sourceArtifacts provenance, but generic manual-WCAG review readers still lacked the common sourceTrace/sourceTraceCount contract used by neighboring commercial handoff artifacts.',
    },
    {
      decision: 'Require root officialReferenceCount on commercialization official-reference artifacts.',
      acceptance_check:
        'Generated packet fixtures and trust sentinels must fail when officialReferences arrays are present but the root officialReferenceCount is missing, stale against the array length, or omitted from generated Markdown where the artifact has a reader-facing packet.',
      chosen_variant:
        'minimal official-reference count parity: keep existing officialReferences arrays and add one deterministic root officialReferenceCount to commercial accessibility audit, commercial evidence intake packet, live proof run packet, and manual WCAG evidence template artifacts',
      files_changed: [
        'scripts/verify-commercial-accessibility.mjs',
        'scripts/generate-commercial-evidence-intake-packet.mjs',
        'scripts/verify-commercial-evidence-intake-packet-alignment.mjs',
        'scripts/verify-commercial-evidence-intake-packet-alignment-fixtures.mjs',
        'scripts/generate-live-proof-run-packet.mjs',
        'scripts/verify-live-proof-run-packet-alignment.mjs',
        'scripts/verify-live-proof-run-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-accessibility-audit-latest.json',
        'docs/commercialization/commercial-accessibility-audit-latest.md',
        'docs/commercialization/commercial-evidence-intake-packet-latest.json',
        'docs/commercialization/commercial-evidence-intake-packet-latest.md',
        'docs/commercialization/live-proof-run-packet-latest.json',
        'docs/commercialization/live-proof-run-packet-latest.md',
        'docs/commercialization/manual-wcag-evidence-template.json',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-a11y',
        'npm run verify:commercial-evidence-intake-packet-alignment-fixtures',
        'npm run generate:commercial-evidence-intake-packet',
        'npm run verify:commercial-evidence-intake-packet-alignment',
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run generate:live-proof-run-packet',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'Every root commercialization artifact that exposes officialReferences now exposes officialReferenceCount matching the officialReferences array length, with generated packet Markdown displaying the count and focused fixtures rejecting JSON or Markdown drift for owner packets.',
      reason:
        'Generic launch-readiness readers should not need artifact-specific array inspection before knowing the official-reference basis size for accessibility, owner evidence, live proof, or manual WCAG template artifacts.',
    },
    {
      decision: 'Require root officialReferenceCount on manual WCAG review packet.',
      acceptance_check:
        'Manual WCAG review packet fixtures must fail when the packet root officialReferenceCount is missing or stale against officialReferences length, or when generated Markdown omits the official-reference count row.',
      chosen_variant:
        'minimal manual-WCAG packet count parity: keep existing officialReferences rows and requiredOfficialReferenceCount, then add one deterministic root officialReferenceCount to the generated manual WCAG review packet',
      files_changed: [
        'scripts/generate-manual-wcag-review-packet.mjs',
        'scripts/verify-manual-wcag-review-packet-alignment.mjs',
        'scripts/verify-manual-wcag-review-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/manual-wcag-review-packet-latest.json',
        'docs/commercialization/manual-wcag-review-packet-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:manual-wcag-review-packet-alignment-fixtures',
        'npm run generate:manual-wcag-review-packet',
        'npm run verify:manual-wcag-review-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated manual WCAG review packet root now exposes officialReferenceCount matching officialReferences array length, with Markdown displaying the official-reference count and fixtures rejecting JSON or Markdown count drift.',
      reason:
        'Generic manual-WCAG packet readers should not need manual-WCAG-specific row inspection before knowing the official W3C/WAI review basis size.',
    },
    {
      decision: 'Expose manual WCAG review packet basis count parity.',
      acceptance_check:
        'Manual WCAG review packet fixtures must fail when routeReviewPlanCount, checkpointReviewPlanCount, routeCheckpointMatrixRowCount, nextCommandCount, or doesNotProveCount drift from their root arrays, or when generated Markdown omits those count rows.',
      chosen_variant:
        'minimal manual-WCAG review packet basis counts: keep existing route, checkpoint, matrix, command, and claim-boundary arrays intact, then add deterministic root counts plus Markdown visibility',
      files_changed: [
        'scripts/generate-manual-wcag-review-packet.mjs',
        'scripts/verify-manual-wcag-review-packet-alignment.mjs',
        'scripts/verify-manual-wcag-review-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/manual-wcag-review-packet-latest.json',
        'docs/commercialization/manual-wcag-review-packet-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:manual-wcag-review-packet-alignment-fixtures',
        'npm run verify:manual-wcag-review-packet',
        'npm run verify:manual-wcag-review-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated manual WCAG review packet now exposes routeReviewPlanCount, checkpointReviewPlanCount, routeCheckpointMatrixRowCount, nextCommandCount, and doesNotProveCount matching its root arrays, with Markdown displaying each count and fixtures rejecting JSON or Markdown drift.',
      reason:
        'Manual-WCAG owner-review readers should know the worksheet, command, and claim-boundary basis size without inspecting every root array before starting owner-held accessibility evidence collection.',
    },
    {
      decision: 'Require root rowCount on launch outreach CRM export.',
      acceptance_check:
        'Launch evidence alignment fixtures must fail when launch-outreach-crm-latest.json or manifest outreach_plan.crm_export has rowCount stale against row_count, rows.length, target_customers length, or the CSV row count.',
      chosen_variant:
        'minimal outreach CRM count parity: keep row_count and all CRM rows unchanged, then add one deterministic camelCase rowCount to the generated CRM export and manifest copy',
      files_changed: [
        'scripts/generate-launch-evidence-manifest.mjs',
        'scripts/verify-launch-evidence-alignment.mjs',
        'scripts/verify-launch-evidence-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'docs/commercialization/launch-outreach-crm-latest.json',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated launch outreach CRM export now exposes rowCount matching row_count, rows.length, target_customers length, and CSV row count, with alignment fixtures rejecting stale root count metadata.',
      reason:
        'Generic launch-readiness readers should not need to inspect outreach rows before knowing the manual CRM seed export size.',
    },
    {
      decision: 'Expose required output table counts in launch evidence.',
      acceptance_check:
        'Launch evidence alignment fixtures must fail when required_output_table_counts drifts from scores, proof buckets, gaps, pain points, target customers, outreach rows, fix report rows, Code Optimization Gate rows, progress updates, or bottleneck log rows.',
      chosen_variant:
        'minimal generator-derived required_output_table_counts block plus direct alignment and Markdown visibility checks',
      files_changed: [
        'scripts/generate-launch-evidence-manifest.mjs',
        'scripts/verify-launch-evidence-alignment.mjs',
        'scripts/verify-launch-evidence-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated launch evidence manifest now exposes required_output_table_counts derived from the current manifest arrays, and the alignment verifier rejects stale count metadata while Markdown renders the count table.',
      reason:
        'The orchestrator final deliverable has required tables for scores, gaps, pain points, targets, outreach, fix report, optimization evidence, progress, and bottlenecks; a root count block lets portfolio and handoff readers audit table completeness without custom array traversal.',
    },
    {
      decision: 'Expose launch required output table counts in commercial summary.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when commercialReadinessState.launchEvidenceSummary.requiredOutputTableCounts is missing, stale against launch-evidence required_output_table_counts, or omitted from Markdown.',
      chosen_variant:
        'minimal state mirror of launch required_output_table_counts inside launchEvidenceSummary plus exact alignment and Markdown visibility checks',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now mirrors launch-evidence required_output_table_counts as launchEvidenceSummary.requiredOutputTableCounts and renders the full count table, with launch-readiness fixtures rejecting missing, stale, or Markdown-omitted count metadata.',
      reason:
        'Commercial summary readers should not need to open the lower-level launch manifest to confirm the required orchestrator output table sizes before evaluating pilot-only readiness boundaries.',
    },
    {
      decision: 'Expose redaction scanned extension count.',
      acceptance_check:
        'Commercial summary redaction alignment fixtures must fail when commercial-artifact-redaction-latest.json scannedExtensionCount drifts from scannedExtensions length or when the Markdown count row is missing.',
      chosen_variant:
        'minimal generated scannedExtensionCount field plus redaction alignment and Markdown visibility checks',
      files_changed: [
        'scripts/verify-commercial-artifact-redaction.mjs',
        'scripts/verify-commercial-summary-redaction-alignment.mjs',
        'scripts/verify-commercial-summary-redaction-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-artifact-redaction-latest.json',
        'docs/commercialization/commercial-artifact-redaction-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-artifact-redaction',
        'npm run verify:commercial-summary-redaction',
        'npm run verify:commercial-summary-redaction-fixtures',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated commercial artifact redaction report now exposes scannedExtensionCount matching scannedExtensions length and renders the count in Markdown, with post-summary redaction fixtures rejecting stale JSON count metadata or missing Markdown count rows.',
      reason:
        'The post-summary redaction artifact is a release-safety handoff; readers should know the extension scope size without inspecting the scannedExtensions array before trusting zero-finding claims.',
    },
    {
      decision: 'Expose redaction reference-practice count.',
      acceptance_check:
        'Commercial summary redaction alignment fixtures must fail when commercial-artifact-redaction-latest.json referencePracticeCount drifts from referencePractices length or when the Markdown count row is missing.',
      chosen_variant:
        'minimal generated referencePracticeCount field plus redaction alignment and Markdown visibility checks',
      files_changed: [
        'scripts/verify-commercial-artifact-redaction.mjs',
        'scripts/verify-commercial-summary-redaction-alignment.mjs',
        'scripts/verify-commercial-summary-redaction-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-artifact-redaction-latest.json',
        'docs/commercialization/commercial-artifact-redaction-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-artifact-redaction',
        'npm run verify:commercial-summary-redaction',
        'npm run verify:commercial-summary-redaction-fixtures',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated commercial artifact redaction report now exposes referencePracticeCount matching referencePractices length and renders the count in Markdown, with post-summary redaction fixtures rejecting stale JSON count metadata or missing Markdown count rows.',
      reason:
        'The post-summary redaction artifact cites external release-safety practices; readers should know the reference-practice basis size without inspecting the referencePractices array before relying on the zero-finding boundary.',
    },
    {
      decision: 'Expose redaction does-not-prove count.',
      acceptance_check:
        'Commercial summary redaction alignment fixtures must fail when commercial-artifact-redaction-latest.json doesNotProveCount drifts from doesNotProve length or when the Markdown count row is missing.',
      chosen_variant:
        'minimal generated doesNotProveCount field plus redaction alignment and Markdown visibility checks',
      files_changed: [
        'scripts/verify-commercial-artifact-redaction.mjs',
        'scripts/verify-commercial-summary-redaction-alignment.mjs',
        'scripts/verify-commercial-summary-redaction-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-artifact-redaction-latest.json',
        'docs/commercialization/commercial-artifact-redaction-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-artifact-redaction',
        'npm run verify:commercial-summary-redaction',
        'npm run verify:commercial-summary-redaction-fixtures',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated commercial artifact redaction report now exposes doesNotProveCount matching doesNotProve length and renders the count in Markdown, with post-summary redaction fixtures rejecting stale JSON count metadata or missing Markdown count rows.',
      reason:
        'The post-summary redaction artifact is a release-safety handoff; readers should know the claim-boundary basis size without inspecting the doesNotProve array before relying on the zero-finding boundary.',
    },
    {
      decision: 'Expose commercial accessibility audit proof-basis counts.',
      acceptance_check:
        'Commercial trust sentinels and the generated accessibility audit must expose routeCount, viewportCount, routeResultCount, and manualReviewChecklistCount matching the scoped route, viewport, result, and manual-checklist arrays.',
      chosen_variant:
        'minimal generated root count fields plus Markdown visibility and commercial trust sentinels',
      files_changed: [
        'scripts/verify-commercial-accessibility.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-accessibility-audit-latest.json',
        'docs/commercialization/commercial-accessibility-audit-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-a11y',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated commercial accessibility audit now exposes routeCount, viewportCount, routeResultCount, and manualReviewChecklistCount matching the audit arrays and renders the counts in Markdown, with trust sentinels enforcing the proof-basis contract.',
      reason:
        'Release-safety readers should know the automated accessibility audit basis size before evaluating the manual WCAG and owner-held evidence boundaries.',
    },
    {
      decision: 'Expose owner-evidence handoff basis counts.',
      acceptance_check:
        'Owner-evidence handoff alignment fixtures must fail when remainingGateCount, commandSequenceCount, or ownerActionRowCount drift from remainingGateIds, commandSequence, or ownerActionRows, or when generated Markdown omits those counts.',
      chosen_variant:
        'minimal generated handoff basis count fields plus Markdown visibility and handoff alignment fixtures',
      files_changed: [
        'scripts/generate-owner-evidence-handoff.mjs',
        'scripts/verify-owner-evidence-handoff-alignment.mjs',
        'scripts/verify-owner-evidence-handoff-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/owner-evidence-handoff-latest.json',
        'docs/commercialization/owner-evidence-handoff-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run generate:owner-evidence-handoff',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated owner-evidence handoff packet now exposes remainingGateCount, commandSequenceCount, and ownerActionRowCount matching its root arrays and renders those counts in Markdown, with alignment fixtures rejecting stale count metadata or Markdown omission.',
      reason:
        'Owner-evidence closeout readers should know the gate, command, and handoff-row basis size before executing the owner-held evidence plan or evaluating pilot-only launch blockers.',
    },
    {
      decision: 'Expose live proof run packet basis counts.',
      acceptance_check:
        'Live proof run packet alignment fixtures must fail when liveProofCount, ownerCommandSequenceCount, or doesNotProveCount drift from liveProofs, ownerCommandSequence, or doesNotProve, or when generated Markdown omits those counts.',
      chosen_variant:
        'minimal generated live-proof packet basis count fields plus Markdown visibility and live-proof packet alignment fixtures',
      files_changed: [
        'scripts/generate-live-proof-run-packet.mjs',
        'scripts/verify-live-proof-run-packet-alignment.mjs',
        'scripts/verify-live-proof-run-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/live-proof-run-packet-latest.json',
        'docs/commercialization/live-proof-run-packet-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run generate:live-proof-run-packet',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated live proof run packet now exposes liveProofCount, ownerCommandSequenceCount, and doesNotProveCount matching its root arrays and renders those counts in Markdown, with alignment fixtures rejecting stale count metadata or Markdown omission.',
      reason:
        'Owner live-proof readers should know the proof-row, owner-command, and claim-boundary basis size before executing credentialed checks or evaluating live/payment evidence gaps.',
    },
    {
      decision: 'Expose owner-evidence completion drill basis counts.',
      acceptance_check:
        'Owner-evidence completion drill alignment fixtures must fail when recommendedCommandOrderCount, recommendedOperationalAccessCommandCount, or doesNotProveCount drift from recommendedCommandOrder, recommendedOperationalAccessCommands, or doesNotProve, or when generated Markdown omits those counts.',
      chosen_variant:
        'minimal generated completion-drill basis count fields plus Markdown visibility and completion-drill alignment fixtures',
      files_changed: [
        'scripts/generate-owner-evidence-completion-drill.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/owner-evidence-completion-drill-latest.json',
        'docs/commercialization/owner-evidence-completion-drill-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run generate:owner-evidence-completion-drill',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated owner-evidence completion drill now exposes recommendedCommandOrderCount, recommendedOperationalAccessCommandCount, and doesNotProveCount matching its root arrays and renders those counts in Markdown, with alignment fixtures rejecting stale count metadata or Markdown omission.',
      reason:
        'Owner closeout readers should know the command-order, operational-access-command, and claim-boundary basis size before using the completion drill to coordinate remaining owner-held evidence gates.',
    },
    {
      decision: 'Expose commercial evidence intake packet basis counts.',
      acceptance_check:
        'Commercial evidence intake packet alignment fixtures must fail when requiredGateCount, recordSlotCount, or ownerCommandSequenceCount drift from requiredGateIds, recordSlots, or ownerCommandSequence, or when generated Markdown omits those counts.',
      chosen_variant:
        'minimal generated commercial-evidence intake basis count fields plus Markdown visibility and intake-packet alignment fixtures',
      files_changed: [
        'scripts/generate-commercial-evidence-intake-packet.mjs',
        'scripts/verify-commercial-evidence-intake-packet-alignment.mjs',
        'scripts/verify-commercial-evidence-intake-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-evidence-intake-packet-latest.json',
        'docs/commercialization/commercial-evidence-intake-packet-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-evidence-intake-packet-alignment-fixtures',
        'npm run generate:commercial-evidence-intake-packet',
        'npm run verify:commercial-evidence-intake-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated commercial evidence intake packet now exposes requiredGateCount, recordSlotCount, and ownerCommandSequenceCount matching its root arrays and renders those counts in Markdown, with alignment fixtures rejecting stale count metadata or Markdown omission.',
      reason:
        'Partner/outcome evidence owners should know the required gate, record-slot, and owner-command basis size before using the intake packet to prepare owner-held proof artifacts and redacted records.',
    },
    {
      decision: 'Expose commercial evidence intake packet does-not-prove count.',
      acceptance_check:
        'Commercial evidence intake packet alignment fixtures must fail when doesNotProveCount drifts from the packet-level doesNotProve array or when generated Markdown omits the boundary count/list.',
      chosen_variant:
        'minimal generated packet-level doesNotProve array and count plus Markdown visibility and intake-packet alignment fixtures',
      files_changed: [
        'scripts/generate-commercial-evidence-intake-packet.mjs',
        'scripts/verify-commercial-evidence-intake-packet-alignment.mjs',
        'scripts/verify-commercial-evidence-intake-packet-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-evidence-intake-packet-latest.json',
        'docs/commercialization/commercial-evidence-intake-packet-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-evidence-intake-packet-alignment-fixtures',
        'npm run generate:commercial-evidence-intake-packet',
        'npm run verify:commercial-evidence-intake-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The generated commercial evidence intake packet now exposes doesNotProveCount=9 matching its packet-level doesNotProve array and renders both the boundary count and list in Markdown without changing owner commands or gate status.',
      reason:
        'The owner worksheet already described partner/outcome claim boundaries in prose and row-level fields, but packet-level readers could not verify the boundary basis size without manually inspecting the generated artifact.',
    },
    {
      decision: 'Expose commercial evidence records artifact counts.',
      acceptance_check:
        'Commercial evidence records fixtures and trust sentinels must fail when gateIdCount, doesNotProveCount, manualInterventionIfMissingCount, or errorCount drift from the rendered artifact arrays.',
      chosen_variant:
        'minimal rendered artifact count fields plus exported count validator and fixture drift cases',
      files_changed: [
        'scripts/verify-commercial-evidence-records.mjs',
        'scripts/verify-commercial-evidence-records-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-evidence-records-latest.json',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-evidence-records-fixtures',
        'npm run verify:commercial-evidence-records:write',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The rendered commercial evidence records artifact now exposes gateIdCount, doesNotProveCount, manualInterventionIfMissingCount, and errorCount matching its root arrays, with fixture drift cases rejecting stale count metadata.',
      reason:
        'Partner/outcome closeout readers should know the gate, claim-boundary, owner-intervention, and error basis size before evaluating redacted commercial evidence records or remaining owner-held evidence blockers.',
    },
    {
      decision: 'Expose manual WCAG evidence artifact counts.',
      acceptance_check:
        'Manual WCAG evidence fixtures and trust sentinels must fail when gateIdCount, ownerEvidenceArchiveRequirementCount, requiredOwnerEvidenceArchiveRequirementCount, rejectedCheckpointCount, doesNotProveCount, manualInterventionIfMissingCount, or errorCount drift from the rendered artifact arrays.',
      chosen_variant:
        'minimal rendered manual-WCAG artifact count fields plus exported count validator and fixture drift cases',
      files_changed: [
        'scripts/verify-manual-wcag-evidence.mjs',
        'scripts/verify-manual-wcag-evidence-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/manual-wcag-evidence-latest.json',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:manual-wcag-evidence-fixtures',
        'npm run verify:manual-wcag-evidence:write',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The rendered manual WCAG evidence artifact now exposes gateIdCount, ownerEvidenceArchiveRequirementCount, requiredOwnerEvidenceArchiveRequirementCount, rejectedCheckpointCount, doesNotProveCount, manualInterventionIfMissingCount, and errorCount matching its root arrays, with fixture drift cases rejecting stale count metadata.',
      reason:
        'Manual accessibility closeout readers should know the gate, archive-policy, rejected-checkpoint, claim-boundary, owner-intervention, and error basis size before evaluating redacted manual WCAG evidence or remaining owner-held accessibility blockers.',
    },
    {
      decision: 'Expose source-audit source trace inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when source-audit source trace rows are missing, stale, or omitted from Markdown.',
      chosen_variant:
        'compact per-source trace rows for launch, commercial-intake, live-proof, live-closeout-access, manual-WCAG, and completion-drill source audits, derived from existing source-audit artifacts without rerunning network or live gates',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries per-source sourceTrace rows with source ids/keys, URLs, statuses, expected-text match counts, and source-audit source anchors for the current official/reference source-audit coverage objects, while preserving the pilot-only launch decision and owner-held evidence boundaries.',
      reason:
        'The source-audit coverage objects exposed aggregate counts, source IDs/URLs, and boundaries, but state-only readers could not trace each official/reference source row back to the repo-generated audit artifact that produced the source-audit claim.',
    },
    {
      decision: 'Expose owner-gate scoreboard source trace inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when owner-gate scoreboard source trace rows are missing, stale, or omitted from Markdown.',
      chosen_variant:
        'compact per-gate source trace rows inside ownerGateScoreboard, derived from existing owner closeout, remediation, handoff, and completion-drill artifacts without executing owner or live gates',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries per-gate source trace rows for remaining owner/live gates across owner closeout, remediation completion, remediation gates, handoff, and completion-drill artifacts, while preserving the pilot-only launch decision and owner-held evidence boundaries.',
      reason:
        'The top-level ownerGateScoreboard exposed the remaining owner gate IDs and counts, but state-only readers could not trace each high-level blocker back to the repo-generated artifacts that produced the closeout status.',
    },
    {
      decision: 'Add canonical sourceTrace aliases to ownerGateScoreboard.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when ownerGateScoreboard.sourceTrace/sourceTraceCount aliases are missing or stale against remainingGateSourceTrace.',
      chosen_variant:
        'minimal alias parity: keep remainingGateSourceTrace for existing readers and add sourceTrace/sourceTraceCount with exact validation',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary ownerGateScoreboard now exposes canonical sourceTrace/sourceTraceCount aliases matching remainingGateSourceTrace, with fail-closed fixture coverage while preserving pilot-only launch readiness.',
      reason:
        'The owner gate scoreboard already carried source-traced rows, but generic release-state consumers still needed the bespoke remainingGateSourceTrace field instead of the common sourceTrace/sourceTraceCount contract.',
    },
    {
      decision: 'Expose remediation summary source traces inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when remediationCompletion or remediationExternalGates source trace rows are missing, stale, or omitted from Markdown.',
      chosen_variant:
        'compact per-gate source trace rows inside remediationCompletion and remediationExternalGates, derived from existing remediation completion and owner-action queue artifacts without executing owner or live gates',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries per-gate source trace rows for remediationCompletion and remediationExternalGates, while preserving the pilot-only launch decision and owner-held evidence boundaries.',
      reason:
        'The top-level remediation summary objects exposed remaining owner gate IDs and counts, but state-only readers could not trace those remediation blockers back to the repo-generated remediation artifacts that produced them.',
    },
    {
      decision: 'Expose launch-evidence blocker source trace inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when launchEvidence blocker source trace rows are missing, stale, or omitted from Markdown.',
      chosen_variant:
        'compact per-gate blocker source trace rows inside launchEvidence, derived from existing launch gaps, unresolved blockers, remediation completion, and owner-action queue artifacts without executing owner or live gates',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries per-gate blocker source trace rows for launchEvidence gaps and unresolved blockers, while preserving the pilot-only launch decision and owner-held evidence boundaries.',
      reason:
        'The top-level launchEvidence state exposed gap IDs and unresolved blockers without direct source anchors back to the launch manifest and remediation artifacts that produced those blocker claims.',
    },
    {
      decision: 'Add canonical sourceTrace aliases to launchEvidence blockers.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when launchEvidence.sourceTrace/sourceTraceCount aliases are missing or stale against blockerSourceTrace.',
      chosen_variant:
        'minimal alias parity: keep blockerSourceTrace for existing readers and add sourceTrace/sourceTraceCount with exact validation',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary launchEvidence object now exposes canonical sourceTrace/sourceTraceCount aliases matching blockerSourceTrace, with fail-closed fixture coverage while preserving pilot-only launch readiness.',
      reason:
        'The launch-evidence blocker rows were already source-traced, but generic release-state consumers still needed the bespoke blockerSourceTrace field instead of the common sourceTrace/sourceTraceCount contract.',
    },
    {
      decision: 'Expose launch-evidence summary source trace inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when launchEvidenceSummary source trace metadata is missing, stale, or omitted from Markdown.',
      chosen_variant:
        'compact coverage-level source trace rows inside launchEvidenceSummary, derived from existing launch manifest score, deliverable, outreach, CRM, fix-report, source-audit, and release-gate-command anchors without executing outreach, live, or owner-held gates',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries sourceArtifact/sourceArtifacts, sourceTraceCount, sourceTrace, and sourceTraceBoundary for launchEvidenceSummary aggregate coverage while preserving pilot-only launch readiness boundaries.',
      reason:
        'The top-level launchEvidenceSummary object exposed aggregate scores, deliverable counts, outreach coverage, and fix-report coverage without machine-readable source anchors to the launch manifest fields that produced those counts.',
    },
    {
      decision: 'Expose proof-bucket source trace inside commercialReadinessState.',
      acceptance_check:
        'Commercial summary launch-readiness fixtures must fail when proofBucketSummary source trace metadata is missing, stale, or omitted from Markdown.',
      chosen_variant:
        'compact item-level proof-bucket source trace rows inside proofBucketSummary, derived from existing launch manifest proof_buckets entries without executing proof commands, live checks, or owner-held gates',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs',
        'scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/commercial-verification-summary-latest.json',
        'docs/commercialization/commercial-verification-summary-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The final commercial summary now carries sourceArtifact/sourceArtifacts, sourceTraceCount, sourceTrace, and sourceTraceBoundary for proofBucketSummary item-level coverage while preserving pilot-only launch readiness boundaries.',
      reason:
        'The top-level proofBucketSummary object exposed bucket counts, source paths, boundary counts, and item rows without machine-readable anchors to the launch manifest proof_buckets entries that produced those proof-bucket claims.',
    },
    {
      decision: 'Derive launch-evidence progress phase from the latest Code Optimization Gate review.',
      acceptance_check:
        'Launch evidence alignment fixtures must fail when progress_updates[0].phase is stale against the latest code_optimization_reviews target_task or when accomplished work omits that latest review.',
      chosen_variant:
        'derive the progress phase slug and latest accomplished row from the current manifest code_optimization_reviews array, falling back to the PhaseLoop ledger only when no optimization review exists',
      files_changed: [
        'scripts/generate-launch-evidence-manifest.mjs',
        'scripts/verify-launch-evidence-alignment.mjs',
        'scripts/verify-launch-evidence-alignment-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
      proof:
        'The progress update now derives its phase from the latest Code Optimization Gate review target and includes that review in accomplished work, so launch-evidence progress cannot stay stuck on an older PhaseLoop ledger entry after new repo-side proof-boundary slices are generated.',
      reason:
        'The manifest had current implementation and optimization entries, but progress_updates[0].phase could still show an older completed phase, weakening progress reporting for long-running commercial-readiness work.',
    },
    {
      decision: 'Keep the full-local gate as a plan-only approval package until the owner approves optional execution.',
      acceptance_check:
        'The approval-package verifier must require the execution plan, progress digest, workflow metadata, backlog/results/claims, package scripts, current summary, and live closeout source-audit commands to stay synchronized while executionApproved=false.',
      chosen_variant:
        'plan-only dynamic workflow ledger and package verifier instead of executing Browser, Computer, accessibility, network, npm audit, or worker commands',
      files_changed: [
        'docs/commercialization/full-local-gate-execution-plan-2026-06-05.md',
        'docs/commercialization/full-local-gate-progress-digest-2026-06-05.md',
        '.dynamic-workflows/commercial-full-local-gate-2026-06-05/README.md',
        '.dynamic-workflows/commercial-full-local-gate-2026-06-05/workflow.json',
        '.dynamic-workflows/commercial-full-local-gate-2026-06-05/backlog.jsonl',
        '.dynamic-workflows/commercial-full-local-gate-2026-06-05/results.jsonl',
        '.dynamic-workflows/commercial-full-local-gate-2026-06-05/claims.jsonl',
        'scripts/verify-commercial-full-local-approval-package.mjs',
        'scripts/verify-commercial-full-local-approval-package-fixtures.mjs',
        'scripts/verify-commercial-trust-boundaries.mjs',
      ],
      tests_run: [
        'npm run verify:commercial-full-local-approval-package',
        'npm run verify:commercial-full-local-approval-package-fixtures',
        'npm run verify:commercial-trust',
        'git diff --check',
      ],
      proof:
        'The plan-only artifacts include verify-live-closeout-access-sources before optional full-local execution and keep executionApproved=false with explicit approval requirements.',
      reason:
        'The optional full-local path crosses Browser/Computer, network, audit, and worker-execution boundaries; running it without approval would blur repo proof with owner-approved operational checks.',
    },
    {
      decision: 'Derive the commercial verifier step-count progress line from the current summary instead of a historical constant.',
      acceptance_check:
        'Launch evidence regeneration must report finalized step counts only when the summary is already passed, and otherwise defer readers to the final commercial summary artifact.',
      chosen_variant: 'small formatter inside the launch-evidence generator',
      files_changed: [
        'scripts/generate-launch-evidence-manifest.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
        COMMERCIAL_VERIFICATION_SUMMARY_JSON,
        COMMERCIAL_VERIFICATION_SUMMARY_MD,
      ],
      tests_run: [
        'node scripts/generate-launch-evidence-manifest.mjs --write --validate',
        'node scripts/verify-launch-evidence-alignment.mjs',
        'npm run verify:commercial-summary-launch-readiness',
      ],
      proof:
        'The progress update reads plannedStepCount, passedStepCount, failedStepCount, and status from the commercial summary, but avoids turning an in-progress release summary into a false completed-step claim.',
      reason:
        'A hard-coded step total makes launch evidence stale, while reporting in-progress counts as final would overstate the current release-gate state.',
    },
    {
      decision: 'Refresh launch evidence after the initial passed commercial summary, then rewrite the final summary before post-summary redaction.',
      acceptance_check:
        'A passed default commercial verifier must leave launch evidence and commercialReadinessState in parity with the final passed summary, while post-summary redaction and launch-readiness alignment still pass.',
      chosen_variant:
        'post-summary launch-evidence refresh plus final summary rewrite before redaction/alignment checks',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
        COMMERCIAL_VERIFICATION_SUMMARY_JSON,
        COMMERCIAL_VERIFICATION_SUMMARY_MD,
      ],
      tests_run: [
        'npm run verify:commercial',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'git diff --check',
      ],
      proof:
        'The commercial release runner writes an initial passed summary, refreshes launch evidence from that passed summary, rewrites the final summary from refreshed launch evidence, and only then runs post-summary redaction and launch-readiness alignment.',
      reason:
        'The launch-evidence step runs before the final summary exists; a post-summary refresh closes that lifecycle gap without claiming optional live, network, browser, accessibility, payment, credential, outreach, or owner-held evidence gates passed.',
    },
    {
      decision: 'Make commercial trust summary sentinels invocation-aware for full-local verification.',
      acceptance_check:
        'The full-local commercial verifier must pass with browser, accessibility, network/audit, full-local, typecheck, and diff gates included, while standalone trust and launch-evidence alignment checks still pass against the final full-local summary.',
      chosen_variant:
        'minimal trust-boundary pattern relaxation for variable step counts and full-local release-gate coverage status',
      files_changed: [
        'scripts/verify-commercial-trust-boundaries.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
        COMMERCIAL_VERIFICATION_SUMMARY_JSON,
        COMMERCIAL_VERIFICATION_SUMMARY_MD,
      ],
      tests_run: [
        'node --check scripts/verify-commercial-trust-boundaries.mjs',
        'npm run verify:commercial-full',
        'npm run verify:commercial-trust',
        'npm run verify:launch-evidence-alignment',
      ],
      proof:
        'The final full-local commercial summary records 79 planned steps, 0 failed steps, releaseGateCoverageSummary.status=all_configured_release_gates_included, and all seven release gates passed while launch_decision remains pilot-only.',
      reason:
        'The trust-boundary verifier was locked to the default 67-step partial optional-gate summary, which made the configured full-local proof path fail before browser, accessibility, network, and audit checks could run.',
    },
    {
      decision: 'Require fresh source-registry provenance before strict data provenance in network-enabled release runs.',
      acceptance_check:
        'The full commercial verifier must run the official source-registry step before data-provenance, the data-provenance command must include --require-source-verification, and the checksum artifact must preserve sourceVerification.requiredForPass=true.',
      chosen_variant:
        'reuse the existing sources step before data-provenance only when --with-network is selected, then run the remaining network audits later without duplicating the source-registry fetch',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        'docs/commercialization/data-provenance-checksums.json',
        'docs/commercialization/data-provenance-checksums.md',
        OUTPUT_JSON,
        OUTPUT_MD,
        COMMERCIAL_VERIFICATION_SUMMARY_JSON,
        COMMERCIAL_VERIFICATION_SUMMARY_MD,
      ],
      tests_run: [
        'node --check scripts/verify-commercial-release.mjs',
        'node scripts/verify-commercial-data-provenance.mjs --write --require-source-verification',
        'npm run verify:commercial-full',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
      ],
      proof:
        'Network-enabled release runs place sources immediately before data-provenance, and the final summary records data-provenance as node scripts/verify-commercial-data-provenance.mjs --write --require-source-verification while launch_decision remains pilot-only.',
      reason:
        'A full verifier run could previously refresh official sources after data provenance, leaving strict checksum provenance tied to an older source-verification artifact even though the same invocation produced a newer source registry later.',
    },
    {
      decision: 'Include Phase E commercial validation instrumentation in the full commercial release gate.',
      acceptance_check:
        'The default commercial release verifier must include the phase-e-commercial-validation step, the full-local commercial summary must report 79 planned steps with zero failures, and launch_decision must remain pilot-only until owner-held gates close.',
      chosen_variant:
        'add the existing standalone Phase E verifier to DEFAULT_STEPS instead of creating a live-owner gate or a separate commercial runner path',
      files_changed: [
        'scripts/verify-commercial-release.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
        COMMERCIAL_VERIFICATION_SUMMARY_JSON,
        COMMERCIAL_VERIFICATION_SUMMARY_MD,
      ],
      tests_run: [
        'node --check scripts/verify-commercial-release.mjs',
        'npm run verify:commercial-validation',
        'npm run verify:commercial-full',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
      ],
      proof:
        'The commercial release runner now executes node scripts/verify-phase-e-commercial-validation.mjs as phase-e-commercial-validation, and the current full-local summary reports 79 planned steps, 79 passed steps, 0 failed steps, and all configured release gates included while launch_decision remains pilot-only.',
      reason:
        'Phase E validation was available as a standalone proof gate, but leaving it outside the full release verifier let the release summary pass without exercising the commercial-validation instrumentation that guards the remaining owner-evidence boundary.',
    },
    {
      decision: 'Ignore only browser-aborted local app-icon requests in the commercial browser journey.',
      acceptance_check:
        'The browser journey must keep failing on application route, console, page, and non-ignored network failures while allowing a local GET /icon.svg request cancelled by the browser with net::ERR_ABORTED.',
      chosen_variant:
        'narrow requestfailed classifier keyed by local Vite host, GET method, /icon.svg path, and net::ERR_ABORTED failure text',
      files_changed: [
        'scripts/verify-commercial-browser.mjs',
        'scripts/generate-launch-evidence-manifest.mjs',
        OUTPUT_JSON,
        OUTPUT_MD,
        COMMERCIAL_VERIFICATION_SUMMARY_JSON,
        COMMERCIAL_VERIFICATION_SUMMARY_MD,
      ],
      tests_run: [
        'node --check scripts/verify-commercial-browser.mjs',
        'npm run verify:commercial-browser',
        'npm run verify:commercial-full',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
      ],
      proof:
        'The commercial browser journey had completed all route, download, Trust Center, proof-pack, and interaction assertions, but failed only because Chromium reported a cancelled local /icon.svg request even though public/icon.svg exists.',
      reason:
        'Treating a browser-cancelled favicon/app-icon fetch as a launch-blocking product failure creates flakiness without improving proof quality; the selected classifier preserves strictness for all substantive application and third-party failures.',
    },
    {
      decision: 'Expose owner operational-access recovery commands in handoff, completion drill, and Trust Center surfaces.',
      acceptance_check:
        'Owner evidence handoff and completion-drill alignment fixtures must fail when Supabase/GitHub operational access commands are missing, stale, or omitted from Markdown, and the Trust Center must render the same command checklist without treating it as launch proof.',
      chosen_variant:
        'append a non-mutating owner-run access checklist to the existing live_closeout_supabase_access prerequisite instead of adding a new launch gate or executing owner credentials',
      files_changed: [
        'scripts/generate-owner-evidence-handoff.mjs',
        'scripts/generate-owner-evidence-completion-drill.mjs',
        'scripts/verify-owner-evidence-handoff-alignment.mjs',
        'scripts/verify-owner-evidence-handoff-alignment-fixtures.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment.mjs',
        'scripts/verify-owner-evidence-completion-drill-alignment-fixtures.mjs',
        'src/lib/commercialLaunchReadiness.ts',
        'src/components/proof/ProofVisibilityPanels.tsx',
        'docs/commercialization/owner-evidence-handoff-latest.json',
        'docs/commercialization/owner-evidence-handoff-latest.md',
        'docs/commercialization/owner-evidence-completion-drill-latest.json',
        'docs/commercialization/owner-evidence-completion-drill-latest.md',
        OUTPUT_JSON,
        OUTPUT_MD,
      ],
      tests_run: [
        'npm run generate:owner-evidence-handoff',
        'npm run generate:owner-evidence-completion-drill',
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:proof-visibility-ui',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
      ],
      proof:
        'The owner handoff now embeds six access-recovery commands on live_closeout_supabase_access, the completion drill reports and renders those six recommended operational access commands, fixture suites reject command-list or Markdown drift, and the trust sentinel no longer depends on a previous run summary having failedStepCount=0 before the current release run can write its authoritative summary.',
      reason:
        'The completion drill previously counted recommended operational access commands without rendering the checklist and stopped at repo scripts, leaving owner recovery for the failed Supabase project/functions checks less actionable than the verifier itself.',
    },
  ];
}

function buildRejectedVariants() {
  return [
    {
      variant: 'Declare the app commercial-ready from local release checks and generated proof-pack artifacts.',
      reason_rejected:
        'Local checks do not prove live Stripe checkout, live MRR, committed design partners, documented outcomes, or manual WCAG conformance.',
      tradeoff:
        'This preserves a stricter launch boundary at the cost of keeping the public-facing decision at pilot-only.',
      evidence: 'docs/commercialization/remediation-external-gates-latest.json lists the remaining owner evidence gates.',
    },
    {
      variant: 'Store raw partner, Stripe, WCAG reviewer, or customer evidence directly in tracked launch artifacts.',
      reason_rejected:
        'Raw evidence may include secrets, private customer data, contracts, reviewer notes, screenshots, or provider payloads.',
      tradeoff:
        'Tracked artifacts remain less detailed, but they are safer to audit and can reference owner-held hashes and policies.',
      evidence: 'docs/commercialization/owner-evidence-handoff-latest.json keeps raw evidence owner-held and outside git.',
    },
    {
      variant: 'Treat outreach CRM seed rows as evidence that outreach was sent or buyers agreed to pilots.',
      reason_rejected:
        'Seed rows are planning artifacts derived from target segments and source URLs; they do not prove consent, delivery, reply, commitment, or revenue.',
      tradeoff: 'The launch plan stays operational without overstating go-to-market proof.',
      evidence: `${OUTPUT_CRM_JSON} records researched rows and explicit does_not_prove boundaries.`,
    },
    {
      variant: 'Leave progress_updates and bottleneck_log empty because the schema validator allows them.',
      reason_rejected:
        'The progress-reporting contract requires long-running phase loops to surface accomplished work, target matrix, pending work, and bottlenecks.',
      tradeoff:
        'Generated progress rows add a little manifest length, but they keep launch evidence aligned with the actual phase-loop state.',
      evidence:
        '/Users/sanjayb/.codex/skills/commercial-launch-readiness-orchestrator/references/progress-reporting-contract.md requires progress digests for long-running runs.',
    },
    {
      variant: 'Add only Markdown progress notes without structured JSON fields.',
      reason_rejected:
        'Markdown-only progress would not be available to evidence comparison, alignment verifiers, or portfolio rollups.',
      tradeoff:
        'Structured JSON plus Markdown rendering is slightly more code but gives machine-checkable progress evidence.',
      evidence: 'references/launch-evidence-schema.md defines progress_updates and bottleneck_log as top-level manifest fields.',
    },
    {
      variant: 'Check only that progress_updates and bottleneck_log arrays exist.',
      reason_rejected:
        'Presence-only checks allow incorrect lane weights, arbitrary statuses, missing activities_remaining details, and empty unblock options to pass as a complete progress digest.',
      tradeoff:
        'The selected verifier adds a few precise contract checks, but it protects the phase-loop handoff from misleading progress evidence.',
      evidence:
        'references/progress-reporting-contract.md requires a target matrix, activities remaining, current bottleneck, root cause, and top three unblock options.',
    },
    {
      variant: 'Allow arbitrary target matrix lane weights because the schema accepts numeric percentages.',
      reason_rejected:
        'The commercial launch readiness skill defines fixed lane weights; arbitrary weights would distort the target accomplishment matrix.',
      tradeoff:
        'Exact weight checks are stricter, but they keep portfolio and progress comparisons stable across phases.',
      evidence:
        '/Users/sanjayb/.codex/skills/commercial-launch-readiness-orchestrator/references/progress-reporting-contract.md defines the lane weights.',
    },
    {
      variant: 'Accept proof buckets as complete when required arrays are merely present.',
      reason_rejected:
        'Presence-only proof buckets can still omit evidence, source, status, or does-not-prove boundaries, which lets local or roadmap artifacts read like launch proof.',
      tradeoff:
        'The selected verifier adds explicit field and boundary checks, but it keeps proof buckets usable as a launch-readiness claim boundary.',
      evidence:
        '/Users/sanjayb/.codex/skills/commercial-launch-readiness-orchestrator/references/security-readiness-framework.md defines hosted/live, local, repo artifact, candidate/shadow, and roadmap claim limits.',
    },
    {
      variant: 'Rely only on commercial-summary proof-bucket counts.',
      reason_rejected:
        'Counts do not prove each proof bucket item carries the source, evidence, status, and boundary text needed by downstream handoff readers.',
      tradeoff:
        'The direct launch-evidence verifier duplicates a small amount of summary coverage but protects the standalone manifest used for portfolio comparison and owner handoff.',
      evidence:
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs summarizes bucket counts but the direct manifest verifier now validates item-level boundaries.',
    },
    {
      variant: 'Keep release-gate coverage only in the commercial verification summary.',
      reason_rejected:
        'The launch evidence manifest is a standalone handoff artifact; command names without current included/pass status can be mistaken for proof that optional gates ran.',
      tradeoff:
        'Copying the coverage snapshot duplicates a small summary field, but it keeps the manifest self-contained and machine-checkable.',
      evidence:
        'docs/commercialization/commercial-verification-summary-latest.json records releaseGateCoverage while docs/commercialization/launch-evidence-latest.json previously exposed only release_gate_commands.',
    },
    {
      variant: 'Leave local-safety status only as a separate verifier output.',
      reason_rejected:
        'The owner handoff and completion drill are the action artifacts owners use before staging refreshed evidence; if they only list the local-safety command, stale or missing safety state is easier to miss.',
      tradeoff:
        'Duplicating a compact local-safety snapshot adds a few fields, but it keeps owner execution artifacts self-contained and machine-checkable.',
      evidence:
        'docs/commercialization/owner-evidence-local-safety-latest.json records ignored/tracked/staged safety state while owner-evidence-handoff-latest.json and owner-evidence-completion-drill-latest.json previously carried only command-sequence references.',
    },
    {
      variant: 'Leave Trust Center local-safety visibility as a command checklist row only.',
      reason_rejected:
        'A command row tells the owner what to run but does not show whether the current preflight passed or whether protected owner-local paths remain ignored before staging refreshed proof metadata.',
      tradeoff:
        'Adding a compact static UI summary duplicates a few generated-artifact fields, but the direct verifier now rejects stale UI status without reading owner-held local evidence contents.',
      evidence:
        'src/lib/commercialLaunchReadiness.ts previously listed verify:owner-evidence-local-safety in ownerEvidenceCloseoutCommandItems while the generated handoff artifacts carried localSafetyStatus.',
    },
    {
      variant: 'Leave localSafetyStatus with aggregate counts only.',
      reason_rejected:
        'Aggregate counts do not show which owner-evidence-local-safety artifact anchors produced each status, count, and boundary field, so stale generated packets can look current while losing provenance.',
      tradeoff:
        'Seven sourceTrace rows add small JSON and Markdown sections, but direct verifiers now prove the owner-facing packets and Trust Center model stay synchronized without reading owner-held evidence contents.',
      evidence:
        'owner-evidence-handoff-latest.json, owner-evidence-completion-drill-latest.json, and ownerEvidenceLocalSafetySummary previously carried sourceArtifact and counts but no sourceTrace rows for field-level alignment.',
    },
    {
      variant: 'Leave owner evidence local-safety arrays partially counted.',
      reason_rejected:
        'Owner closeout readers would still need to inspect trackedSensitiveFileViolations, stagedSensitivePathViolations, doesNotProve, referencePractices, and errors before knowing the complete local-safety artifact basis size.',
      tradeoff:
        'Adding rendered root counts duplicates compact metadata already derivable from arrays, but the exported count validator and fixture drift cases keep the values synchronized while preserving the no-secret-read owner-held evidence boundary.',
      evidence:
        'docs/commercialization/owner-evidence-local-safety-latest.json exposed protectedPathCount and ignoredProtectedPathCount but left trackedSensitiveFileViolations, stagedSensitivePathViolations, doesNotProve, and referencePractices without matching root counts.',
    },
    {
      variant: 'Leave embedded local-safety does-not-prove boundaries uncounted in handoff packets.',
      reason_rejected:
        'Owner handoff and completion-drill readers would need to manually inspect nested localSafetyStatus.doesNotProve arrays even though the source local-safety artifact already exposes the count.',
      tradeoff:
        'Adding the nested count and sourceTrace row duplicates one compact field, but direct alignment fixtures now prove JSON and Markdown stay synchronized without reading owner-held evidence contents.',
      evidence:
        'docs/commercialization/owner-evidence-local-safety-latest.json exposed doesNotProveCount while owner-evidence-handoff-latest.json and owner-evidence-completion-drill-latest.json copied doesNotProve without the matching nested count.',
    },
    {
      variant: 'Leave commercial worktree-hygiene arrays partially counted.',
      reason_rejected:
        'Commercial handoff readers would still need to inspect allowedUntrackedPathPatterns, sensitiveUntrackedPathPatterns, untrackedPathChecks, doesNotProve, and errors before knowing the complete worktree-hygiene artifact basis size.',
      tradeoff:
        'Adding rendered root counts duplicates metadata already derivable from arrays, but the exported count validator and fixture drift cases keep the values synchronized while preserving the repo-local path-policy boundary.',
      evidence:
        'docs/commercialization/commercial-worktree-hygiene-latest.json exposed dirty/untracked path status counts but left policy arrays, untrackedPathChecks, doesNotProve, and errors without matching root counts.',
    },
    {
      variant: 'Leave final commercial summary owner-execution coverage without local-safety provenance.',
      reason_rejected:
        'The final summary is the release handoff artifact; omitting local-safety provenance forces readers to inspect lower-level owner artifacts to confirm owner-local evidence path hygiene.',
      tradeoff:
        'Adding a compact localSafetyStatusSummary duplicates seven trace rows, but it keeps the final summary machine-checkable without reading owner-held evidence contents or running live gates.',
      evidence:
        'owner-evidence-handoff-latest.json and owner-evidence-completion-drill-latest.json carried localSafetyStatus.sourceTrace while commercialReadinessState.ownerEvidenceExecutionSummary previously exposed only command, closeout, and operational-access source traces.',
    },
    {
      variant: 'Leave owner prep-readiness as flat Trust Center rows only.',
      reason_rejected:
        'Flat rows force the owner to infer which remaining launch gate is blocked by each prep action, and duplicated actions such as commercial intake can affect more than one gate.',
      tradeoff:
        'The selected per-gate summary duplicates only counts and source pointers from the closeout artifact, but it gives the owner a gate-level closeout map without exposing owner-held evidence contents.',
      evidence:
        'docs/commercialization/owner-evidence-closeout-status-latest.json carries ownerEvidencePrep.ownerActionNeededByGate while the Trust Center previously rendered only ownerEvidencePrepReadinessItems.',
    },
    {
      variant: 'Leave owner prep by-gate mapping only in closeout status and Trust Center UI.',
      reason_rejected:
        'The owner handoff and completion drill are the execution artifacts owners use during closeout; without their own top-level gate map, stale or incomplete handoffs can pass while still forcing readers to infer blockers from row-level actions.',
      tradeoff:
        'Duplicating a compact count/source map adds a small JSON and Markdown section, but direct verifiers now keep it synchronized with the canonical closeout artifact.',
      evidence:
        'docs/commercialization/owner-evidence-closeout-status-latest.json carries ownerEvidencePrep.ownerActionNeededByGate while owner-evidence-handoff-latest.json and owner-evidence-completion-drill-latest.json previously exposed only row-level blockingOwnerActions.',
    },
    {
      variant: 'Leave owner prep by-gate maps without persisted counts.',
      reason_rejected:
        'The maps would remain synchronized, but handoff readers and downstream checks would still have to infer the number of required gate maps from object keys instead of a durable artifact field.',
      tradeoff:
        'The selected count fields add one scalar and one Markdown row per owner execution artifact, and direct fixtures now fail when the scalar or visible row drifts.',
      evidence:
        'owner-evidence-handoff-latest.json and owner-evidence-completion-drill-latest.json carried ownerPrepActionNeededByGate maps while their generators only printed ownerPrepActionNeededByGateCount in command output.',
    },
    {
      variant: 'Leave owner prep by-gate reconciliation out of the final commercial summary.',
      reason_rejected:
        'The commercial summary is the release-level handoff; if it only exposes aggregate owner-action counts, readers can miss that shared owner-held artifacts affect more than one remaining gate.',
      tradeoff:
        'The selected summary fields duplicate a compact gate map and count snapshot, but the standalone alignment verifier keeps the summary, handoff, and completion drill synchronized to closeout status.',
      evidence:
        'docs/commercialization/owner-evidence-handoff-latest.json and docs/commercialization/owner-evidence-completion-drill-latest.json now carry ownerPrepActionNeededByGate, while the final commercial summary previously exposed only closeoutCoverage ownerPrepActionNeededCount.',
    },
    {
      variant: 'Rely only on commercial-summary launch-readiness alignment to catch missing code optimization evidence.',
      reason_rejected:
        'The launch evidence manifest is also consumed directly by the orchestrator validator, portfolio comparison, and handoff readers, so its own alignment verifier should reject missing code-change evidence.',
      tradeoff:
        'The selected direct verifier check duplicates a small part of summary alignment, but it keeps the manifest independently audit-ready.',
      evidence:
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs already rejects missing implementation_decisions, rejected_variants, and code_optimization_reviews.',
    },
    {
      variant: 'Only add Markdown heading checks for implementation decisions and optimization reviews.',
      reason_rejected:
        'Markdown headings do not prove the JSON arrays contain structured implementation decisions, rejected variants, passing review verdicts, or verification commands.',
      tradeoff:
        'The selected JSON checks require more fixture rows, but they prove the machine-readable manifest remains useful for evidence comparison.',
      evidence:
        'scripts/verify-launch-evidence-alignment.mjs now validates required fields, non-empty changed-file/test arrays, valid policy, pass verdict, and minimality score range.',
    },
    {
      variant: 'Treat adversarial reviews as optional because the schema validator accepts the top-level field.',
      reason_rejected:
        'The orchestrator requires adversarial review before synthesis; an empty or partial array would weaken the launch decision proof even if the schema shape remains valid.',
      tradeoff:
        'The selected verifier check adds three required lane names, but it keeps the final synthesis challenge coverage machine-checkable.',
      evidence:
        '/Users/sanjayb/.codex/skills/commercial-launch-readiness-orchestrator/SKILL.md requires lane-specific adversarial review tasks before final synthesis.',
    },
    {
      variant: 'Check only the Markdown Adversarial Review heading.',
      reason_rejected:
        'A heading does not prove the JSON manifest has launch-decision, evidence, and market challenges with concrete results.',
      tradeoff:
        'The selected JSON checks are slightly stricter, but they protect the portfolio and handoff artifact consumed outside the Markdown page.',
      evidence:
        'scripts/verify-launch-evidence-alignment.mjs now validates adversarial_reviews lane, challenge, and result fields directly.',
    },
    {
      variant: 'Treat the live closeout access source audit as proof of Supabase or GitHub account access.',
      reason_rejected:
        'The source audit only verifies official page reachability, expected text, and reference alignment; it cannot inspect owner-held accounts, secrets, project permissions, or live closeout state.',
      tradeoff:
        'The launch evidence gains a narrower but defensible source-audit proof bucket while live access remains an owner-side gate.',
      evidence: 'docs/commercialization/live-closeout-access-source-audit-latest.json states the account-access boundary.',
    },
    {
      variant: 'Leave live closeout readiness status only in its standalone artifact.',
      reason_rejected:
        'The final commercial summary is the release-level handoff; omitting owner_access_required and failed Supabase access checks makes the live-closeout blocker easier to miss.',
      tradeoff:
        'Duplicating a compact readiness snapshot adds a small summary section, but exact alignment checks keep it synchronized with the standalone artifact and preserve the no-mutation/no-secret boundary.',
      evidence:
        'docs/commercialization/live-closeout-readiness-latest.json records failed Supabase project visibility and functions API access while the final commercial summary previously exposed only source-audit reference coverage.',
    },
    {
      variant: 'Leave operational access prerequisites only in owner handoff and completion-drill artifacts.',
      reason_rejected:
        'The commercial summary is the release-level handoff; hiding live_closeout_supabase_access outside the summary makes the Supabase project/functions access blocker easier to miss.',
      tradeoff:
        'Adding a compact operational-access snapshot duplicates one row, but exact alignment checks keep it synchronized with owner handoff and completion-drill artifacts.',
      evidence:
        'docs/commercialization/owner-evidence-handoff-latest.json records operationalAccessPrerequisites[0].id=live_closeout_supabase_access with owner_access_required status.',
    },
    {
      variant: 'Execute the full-local, Browser/Computer, accessibility, network, npm audit, or worker gate sequence before approval.',
      reason_rejected:
        'Those checks cross optional execution, network, browser automation, audit, and dynamic-worker boundaries that the approval package explicitly keeps gated.',
      tradeoff:
        'The current verifier remains less exhaustive, but it preserves the owner-approved execution boundary and avoids implying unapproved checks passed.',
      evidence: 'docs/commercialization/full-local-gate-execution-plan-2026-06-05.md records executionApproved=false.',
    },
    {
      variant: 'Leave full-local approval state only in the post-summary appendix.',
      reason_rejected:
        'A state-only consumer of commercialReadinessState could miss that optional full-local execution is still approval-required and should not be treated as completed evidence.',
      tradeoff:
        'Duplicating a compact approval summary adds a small synchronized field, but exact launch-readiness fixtures keep it aligned with the top-level post-summary gate.',
      evidence:
        'docs/commercialization/commercial-verification-summary-latest.json previously had postSummaryFullLocalApprovalPackage but no commercialReadinessState.fullLocalApprovalPackageSummary field.',
    },
    {
      variant: 'Leave full-local approval does-not-prove boundaries as an uncounted array.',
      reason_rejected:
        'Release-safety readers would still need to inspect the plan-only doesNotProve array before knowing the boundary basis behind the full-local approval-required summary.',
      tradeoff:
        'Adding one generated count duplicates doesNotProve length, but exact launch-readiness fixtures prevent stale count metadata while preserving the plan-only gate and avoiding Browser/Computer, accessibility, network, audit, full-local, worker, live, payment, credential, outreach, and owner-held evidence execution.',
      evidence:
        'commercialReadinessState.fullLocalApprovalPackageSummary exposed doesNotProve without doesNotProveCount.',
    },
    {
      variant: 'Leave post-summary artifact-redaction state only in the top-level appendix.',
      reason_rejected:
        'A state-only consumer of commercialReadinessState could miss the final generated-artifact safety boundary and the timing rule that the redaction artifact is generated after the summary timestamp.',
      tradeoff:
        'Duplicating a compact redaction contract adds a small synchronized field, but exact launch-readiness fixtures keep it aligned without creating a stale post-redaction summary cycle.',
      evidence:
        'docs/commercialization/commercial-verification-summary-latest.json had postSummaryArtifactRedaction but no commercialReadinessState.postSummaryArtifactRedactionSummary field.',
    },
    {
      variant: 'Leave post-summary launch-evidence refresh only in the top-level summary appendix.',
      reason_rejected:
        'A state-only consumer of commercialReadinessState could miss that launch evidence was refreshed after the initial passed summary and before the final summary rewrite.',
      tradeoff:
        'Duplicating a compact refresh summary adds one synchronized field, but exact launch-readiness fixtures keep it aligned with the post-summary refresh contract.',
      evidence:
        'docs/commercialization/commercial-verification-summary-latest.json had postSummaryLaunchEvidenceRefresh but no commercialReadinessState.postSummaryLaunchEvidenceRefreshSummary field.',
    },
    {
      variant: 'Leave post-summary launch-readiness alignment only in the top-level summary appendix.',
      reason_rejected:
        'A state-only consumer of commercialReadinessState could miss that the final summary was checked against launch evidence, owner closeout, remediation completion, and remediation gate ledgers.',
      tradeoff:
        'Duplicating a compact alignment summary adds one synchronized field, but exact launch-readiness fixtures keep it aligned with the post-summary alignment contract.',
      evidence:
        'docs/commercialization/commercial-verification-summary-latest.json had postSummaryLaunchReadinessAlignment but no commercialReadinessState.postSummaryLaunchReadinessAlignmentSummary field.',
    },
    {
      variant: 'Keep top-level postSummaryLaunchReadinessAlignment as command/order/fixture metadata only.',
      reason_rejected:
        'A handoff reader using the top-level post-summary appendix could see that the verifier is configured without a deterministic source trace back to the summary appendix fields and fixture boundary.',
      tradeoff:
        'Mirroring the existing summary object adds no new abstraction and a small amount of duplicated Markdown, while fixtures enforce parity and prevent stale appendix source traces.',
      evidence:
        'docs/commercialization/commercial-verification-summary-latest.json carried sourceTrace rows under commercialReadinessState.postSummaryLaunchReadinessAlignmentSummary, but the top-level postSummaryLaunchReadinessAlignment appendix exposed only command, executionOrder, includedInThisInvocation, fixtureVerifier, and boundary.',
    },
    {
      variant: 'Leave post-summary lifecycle does-not-prove arrays uncounted.',
      reason_rejected:
        'The post-summary lifecycle summaries would remain source-traced, but handoff readers could not compare boundary scope at a glance or catch stale copied count metadata.',
      tradeoff:
        'The selected fields add one scalar and one Markdown row per post-summary lifecycle summary while exact fixtures keep them synchronized.',
      evidence:
        'commercial-verification-summary-latest.json carried postSummaryArtifactRedaction, postSummaryLaunchReadinessAlignment, and postSummaryLaunchEvidenceRefresh doesNotProve arrays without matching doesNotProveCount fields.',
    },
    {
      variant: 'Leave root commercial verification summary counts implicit.',
      reason_rejected:
        'Readers would still need to manually compare root steps, failedSteps, and doesNotProve arrays against scalar metadata, and stale copied count metadata could escape fixture coverage.',
      tradeoff:
        'Adding two root scalar fields plus explicit failedStepCount parity checks is smaller than a broad recursive count-normalization layer and preserves existing summary shape.',
      evidence:
        'commercial-verification-summary-latest.json exposed steps, failedSteps, failedStepCount, and doesNotProve without stepCount or doesNotProveCount root parity fields.',
    },
    {
      variant: 'Leave owner evidence closeout status root counts implicit.',
      reason_rejected:
        'Owner closeout readers would still need to inspect root arrays before trusting blocker, step, failed-step, and write-artifact basis sizes, and stale copied count metadata could escape launch-readiness fixture coverage.',
      tradeoff:
        'Adding five root scalar fields plus exact alignment fixtures is smaller than introducing a generic artifact-count normalizer and preserves existing closeout status shape.',
      evidence:
        'owner-evidence-closeout-status-latest.json exposed acceptedLiveGateIds, ownerGateCloseoutSummary, steps, failedStepIds, and wrote arrays without matching root count parity fields.',
    },
    {
      variant: 'Leave release-gate coverage only in the top-level summary object.',
      reason_rejected:
        'A state-only consumer of commercialReadinessState could miss that optional Browser/Computer, accessibility, network/audit, and full-local gates did not run in the default verifier invocation.',
      tradeoff:
        'Duplicating a compact release-gate state summary adds one synchronized field, but exact launch-readiness fixtures keep it aligned with releaseGateCoverage and Markdown.',
      evidence:
        'docs/commercialization/commercial-verification-summary-latest.json had releaseGateCoverage but no commercialReadinessState.releaseGateCoverageSummary field.',
    },
    {
      variant: 'Leave release-gate coverage summary as counts and gate objects only.',
      reason_rejected:
        'A state-only or Markdown reader could see which optional gates were not included without a deterministic per-gate anchor back to the releaseGateCoverage source object.',
      tradeoff:
        'Adding seven compact source-trace rows duplicates gate metadata, but it makes optional-gate non-execution auditable without running Browser/Computer, accessibility, network, full-local, live, payment, credential, outreach, or owner-held gates.',
      evidence:
        'commercialReadinessState.releaseGateCoverageSummary had gate counts and gate objects but no sourceTrace rows to releaseGateCoverage gate anchors.',
    },
    {
      variant: 'Leave release-gate coverage does-not-prove boundaries as an uncounted array.',
      reason_rejected:
        'A state-only or Markdown reader could miss stale or truncated release-gate claim-boundary text because the boundary count was implicit in the doesNotProve array.',
      tradeoff:
        'Adding one count duplicates array length, but exact launch-readiness fixtures keep the release-gate claim boundary auditable without executing optional Browser/Computer, accessibility, network, full-local, live, payment, credential, outreach, or owner-held gates.',
      evidence:
        'commercialReadinessState.releaseGateCoverageSummary exposed doesNotProve without doesNotProveCount.',
    },
    {
      variant: 'Manually rerun strict data provenance after every full commercial verifier run.',
      reason_rejected:
        'A manual cleanup command depends on operator memory and lets future verify:commercial-full runs silently leave stale provenance ordering behind.',
      tradeoff:
        'Wiring the strict command and source-registry order into the release runner changes one execution path but removes a recurring hand-run repair step.',
      evidence:
        'scripts/verify-commercial-release.mjs now invokes data-provenance with --require-source-verification and places sources before data-provenance when --with-network is selected.',
    },
    {
      variant: 'Add a second source-registry fetch after data provenance to prove freshness.',
      reason_rejected:
        'Duplicating the same official source-registry fetch would lengthen the full verifier and still require readers to decide which source snapshot backed the checksum artifact.',
      tradeoff:
        'Moving the existing sources step ahead of data-provenance preserves the full verifier step count while binding the checksum to the current network-enabled source snapshot.',
      evidence:
        'The commercial summary records one sources step and one data-provenance step in the same full-local invocation.',
    },
    {
      variant: 'Keep network source verification after data provenance and rely only on requiredForPass=true.',
      reason_rejected:
        'requiredForPass=true proves strict mode was enabled, but if the source registry refresh occurs later in the same invocation the checksum artifact can still point at the prior source-verification timestamp.',
      tradeoff:
        'The selected ordering makes the dependency explicit without adding a new verifier, external service, or launch-readiness claim.',
      evidence:
        'docs/commercialization/data-provenance-checksums.json records sourceVerification.generatedAt from the source-verification artifact used by data provenance.',
    },
    {
      variant: 'Leave owner-action queue rows without explicit source-artifact anchors.',
      reason_rejected:
        'A reader could see owner prep commands, next commands, and raw-evidence policies without a first-class row-level sourceTrace to the remediation, closeout, handoff, and completion-drill artifacts that produced them.',
      tradeoff:
        'Adding deterministic sourceTrace rows duplicates a small amount of metadata, but it lets state-only and Markdown readers audit owner-action provenance without executing owner-held gates.',
      evidence:
        'commercialReadinessState.ownerActionQueueSummary rows carried commands, policies, and source artifact maps but no sourceTrace array/count per gate.',
    },
    {
      variant: 'Leave post-summary command-contract summaries with command fields only.',
      reason_rejected:
        'A release-state reader could see the post-summary commands but not a consistent sourceTrace row set tying commands, artifacts, fixtures, approval prerequisites, and rewrite contracts back to summary anchors.',
      tradeoff:
        'Adding compact command-contract sourceTrace rows duplicates a small amount of release metadata, but it keeps post-summary provenance auditable without executing Browser/Computer, accessibility, network, full-local, live, payment, credential, outreach, worker, or owner-held gates.',
      evidence:
        'commercialReadinessState postSummaryArtifactRedactionSummary, postSummaryLaunchReadinessAlignmentSummary, postSummaryLaunchEvidenceRefreshSummary, and fullLocalApprovalPackageSummary carried sourceArtifact and boundary fields but no sourceTrace array/count or Markdown source-trace table.',
    },
    {
      variant: 'Leave owner handoff and completion-drill command sequences as source-less arrays.',
      reason_rejected:
        'A state-only release reader could see the ordered owner commands without knowing which repo-generated owner handoff or completion-drill artifact backed each command.',
      tradeoff:
        'Adding deterministic command-level anchors duplicates compact metadata, but it preserves auditability without running optional live, credential, outreach, or owner-held evidence gates.',
      evidence:
        'commercialReadinessState.ownerEvidenceExecutionSummary.handoffCoverage.commandSequence and completionDrillCoverage.recommendedCommandOrder were exposed without command-level source trace rows.',
    },
    {
      variant: 'Leave operational-access prerequisites without cross-artifact source trace rows.',
      reason_rejected:
        'A state-only release reader could see the owner-access prerequisite and blocking checks without a deterministic trace to the owner handoff, completion-drill, and live-closeout readiness artifacts behind that blocker.',
      tradeoff:
        'Adding one compact source trace duplicates source anchors, but it keeps the Supabase-access blocker auditable without granting project access, loading credentials, deploying functions, or running live closeout.',
      evidence:
        'commercialReadinessState.ownerEvidenceExecutionSummary.operationalAccessPrerequisiteSummary had prerequisite and blocking-check counts but no per-prerequisite sourceTrace across handoff, completionDrill, and liveCloseoutReadiness artifacts.',
    },
    {
      variant: 'Leave failed owner closeout steps as source-less IDs in the commercial summary.',
      reason_rejected:
        'A state-only release reader could see the failed closeout step count and IDs without the command/status/source anchor that explains which owner-side closeout step still blocks completion.',
      tradeoff:
        'Adding one compact failed-step source trace duplicates closeout status step metadata, but it keeps closeout blockers auditable without executing owner commands or live gates.',
      evidence:
        'commercialReadinessState.ownerEvidenceExecutionSummary.closeoutCoverage had failedStepCount and failedStepIds but no failedStepSourceTrace across owner-evidence-closeout-status-latest.json steps.',
    },
    {
      variant: 'Leave owner closeout nextCommands and statusArtifacts only in the closeout status artifact.',
      reason_rejected:
        'A release-state reader could see failed closeout steps without the command map and output artifact paths needed to continue owner evidence closeout from the final commercial summary.',
      tradeoff:
        'Adding compact next-command and status-artifact source traces duplicates closeout status metadata, but it keeps the release-level handoff self-contained without executing owner commands or exposing owner-held evidence.',
      evidence:
        'docs/commercialization/owner-evidence-closeout-status-latest.json had nextCommands and statusArtifacts, while commercialReadinessState.ownerEvidenceExecutionSummary.closeoutCoverage did not expose those maps or source traces.',
    },
    {
      variant: 'Leave live closeout readiness checks, next actions, and references as source-less summary fields.',
      reason_rejected:
        'A release-state reader could see owner_access_required, failed Supabase checks, and next actions without deterministic anchors to the redacted readiness artifact rows that produced those blockers.',
      tradeoff:
        'Adding compact live-closeout readiness source traces duplicates artifact metadata, but it keeps blocker provenance auditable without rerunning live checks, loading credentials, mutating external state, or upgrading launch readiness.',
      evidence:
        'commercialReadinessState.liveCloseoutReadinessCoverage had failedCheckIds, checkResults, nextActions, and officialReferenceCount but no per-check, per-action, or per-reference source trace rows.',
    },
    {
      variant: 'Keep liveCloseoutReadinessCoverage source traces only under specialized arrays.',
      reason_rejected:
        'Generic release-state readers would still need live-closeout-specific field knowledge instead of the common sourceTrace/sourceTraceCount contract used by neighboring summary objects.',
      tradeoff:
        'Adding a compact aggregate alias duplicates the existing check, next-action, and official-reference trace rows, but exact fixtures prevent drift while preserving specialized arrays for existing readers.',
      evidence:
        'commercialReadinessState.liveCloseoutReadinessCoverage used checkSourceTrace, nextActionSourceTrace, and officialReferenceSourceTrace while adjacent summaries exposed canonical sourceTrace/sourceTraceCount fields.',
    },
    {
      variant: 'Leave live closeout readiness action and boundary arrays uncounted.',
      reason_rejected:
        'Owner-access closeout readers would still need to inspect nextActions and doesNotProve before knowing the action list and claim-boundary basis size behind owner_access_required.',
      tradeoff:
        'Adding two generated root counts duplicates compact metadata already derivable from arrays, but exact summary fixtures and Markdown checks prevent stale metadata while preserving non-mutating access checks, owner credential boundaries, and pilot-only launch status.',
      evidence:
        'docs/commercialization/live-closeout-readiness-latest.json exposed nextActions and doesNotProve arrays without matching root basis counts.',
    },
    {
      variant: 'Keep owner closeout coverage source traces only under specialized arrays.',
      reason_rejected:
        'Generic release-state readers would still need owner-closeout-specific field knowledge instead of the common sourceTrace/sourceTraceCount contract used by neighboring summary objects.',
      tradeoff:
        'Adding a compact aggregate alias duplicates the existing failed-step, next-command, and status-artifact trace rows, but exact fixtures prevent drift while preserving specialized arrays for existing readers.',
      evidence:
        'commercialReadinessState.ownerEvidenceExecutionSummary.closeoutCoverage used failedStepSourceTrace, nextCommandSourceTrace, and statusArtifactSourceTrace while adjacent summaries exposed canonical sourceTrace/sourceTraceCount fields.',
    },
    {
      variant: 'Keep owner handoff coverage source traces only under commandSequenceSourceTrace.',
      reason_rejected:
        'Generic release-state readers would still need owner-handoff-specific field knowledge instead of the common sourceTrace/sourceTraceCount contract used by neighboring summary objects.',
      tradeoff:
        'Adding aliases duplicates one compact command-sequence trace array, but exact fixtures prevent drift while preserving the specialized commandSequenceSourceTrace field for existing readers.',
      evidence:
        'commercialReadinessState.ownerEvidenceExecutionSummary.handoffCoverage used commandSequenceSourceTrace while adjacent summaries exposed canonical sourceTrace/sourceTraceCount fields.',
    },
    {
      variant: 'Keep owner completion-drill coverage source traces only under recommendedCommandOrderSourceTrace.',
      reason_rejected:
        'Generic release-state readers would still need owner-completion-drill-specific field knowledge instead of the common sourceTrace/sourceTraceCount contract used by neighboring summary objects.',
      tradeoff:
        'Adding aliases duplicates one compact recommended-command trace array, but exact fixtures prevent drift while preserving the specialized recommendedCommandOrderSourceTrace field for existing readers.',
      evidence:
        'commercialReadinessState.ownerEvidenceExecutionSummary.completionDrillCoverage used recommendedCommandOrderSourceTrace while adjacent summaries exposed canonical sourceTrace/sourceTraceCount fields.',
    },
    {
      variant: 'Leave canonical sourceTrace rows with only sourceArtifacts maps.',
      reason_rejected:
        'Generic release-state readers would still need object-specific map keys before locating a single primary artifact anchor for each canonical trace row.',
      tradeoff:
        'Adding one primary sourceArtifact string duplicates the first relevant anchor per row, but it preserves the richer sourceArtifacts maps and makes trace consumption uniform.',
      evidence:
        'commercialReadinessState ownerGateScoreboard, launchEvidence, launchEvidenceSummary, ownerEvidenceExecutionSummary.operationalAccessPrerequisiteSummary, and ownerActionQueueSummary sourceTrace rows had sourceArtifacts maps but no primary sourceArtifact field.',
    },
    {
      variant: 'Leave owner-action queue detail rows with only sourceArtifacts maps.',
      reason_rejected:
        'A state-only release reader could inspect owner-action commands and policies but still need row-specific sourceArtifacts key knowledge before locating the primary remediation anchor for that row.',
      tradeoff:
        'Adding one primary sourceArtifact string per detail row duplicates the remediation ownerActionQueue anchor, but it preserves the richer sourceArtifacts maps and makes row provenance uniform.',
      evidence:
        'commercialReadinessState.ownerActionQueueSummary.rows carried owner commands, policies, sourceBoundary, and sourceArtifacts maps but no primary sourceArtifact field on each detail row.',
    },
    {
      variant: 'Leave commercial summary aggregate objects with only sourceArtifacts maps.',
      reason_rejected:
        'Generic release-state readers would still need aggregate-specific sourceArtifacts key knowledge before locating a single primary artifact anchor for commercial readiness state and owner-action queue summary provenance.',
      tradeoff:
        'Adding one primary sourceArtifact string per aggregate duplicates the most relevant source map entry, but it preserves the richer sourceArtifacts maps and makes aggregate provenance uniform.',
      evidence:
        'commercialReadinessState and commercialReadinessState.ownerActionQueueSummary exposed sourceArtifacts maps but no primary sourceArtifact field on the aggregate objects themselves.',
    },
    {
      variant: 'Leave owner-evidence handoff packet root with only sourceArtifacts map.',
      reason_rejected:
        'Generic owner-handoff readers would still need handoff-specific sourceArtifacts map-key knowledge before locating the primary remediation ledger anchor for the packet.',
      tradeoff:
        'Adding one root sourceArtifact string and sourceArtifactCount duplicates compact provenance metadata, but preserves the richer sourceArtifacts map and makes packet-level provenance uniform.',
      evidence:
        'docs/commercialization/owner-evidence-handoff-latest.json exposed a sourceArtifacts map but no root sourceArtifact/sourceArtifactCount primary provenance contract.',
    },
    {
      variant: 'Leave owner-evidence handoff packet root without canonical sourceTrace rows.',
      reason_rejected:
        'Generic owner-handoff readers would still need to infer provenance by inspecting the sourceArtifacts map instead of using the common sourceTrace/sourceTraceCount contract used by adjacent owner and launch-readiness packets.',
      tradeoff:
        'Adding four derived sourceTrace rows duplicates compact provenance metadata already present in sourceArtifacts, but the rows are generated from the same map and alignment fixtures keep them synchronized while preserving owner-held evidence boundaries.',
      evidence:
        'docs/commercialization/owner-evidence-handoff-latest.json exposed sourceArtifact/sourceArtifacts/sourceArtifactCount, but no sourceTrace/sourceTraceCount/sourceTraceBoundary contract.',
    },
    {
      variant: 'Leave owner-evidence completion drill packet root with only sourceArtifacts map.',
      reason_rejected:
        'Generic owner completion-drill readers would still need drill-specific sourceArtifacts map-key knowledge before locating the primary handoff anchor for the gate-by-gate execution matrix.',
      tradeoff:
        'Adding one root sourceArtifact string and sourceArtifactCount duplicates compact provenance metadata, but preserves the richer sourceArtifacts map and makes completion-drill packet-level provenance uniform.',
      evidence:
        'docs/commercialization/owner-evidence-completion-drill-latest.json exposed a sourceArtifacts map but no root sourceArtifact/sourceArtifactCount primary provenance contract.',
    },
    {
      variant: 'Leave owner-evidence completion drill packet root without canonical sourceTrace rows.',
      reason_rejected:
        'Generic owner completion-drill readers would still need to infer provenance by inspecting the sourceArtifacts map instead of using the common sourceTrace/sourceTraceCount contract used by adjacent owner and launch-readiness packets.',
      tradeoff:
        'Adding eight derived sourceTrace rows duplicates compact provenance metadata already present in sourceArtifacts, but the rows are generated from the same map and alignment fixtures keep them synchronized while preserving owner-held evidence boundaries.',
      evidence:
        'docs/commercialization/owner-evidence-completion-drill-latest.json exposed sourceArtifact/sourceArtifacts/sourceArtifactCount, but no sourceTrace/sourceTraceCount/sourceTraceBoundary contract.',
    },
    {
      variant: 'Leave commercial evidence intake packet root with only sourceArtifacts map.',
      reason_rejected:
        'Generic intake-packet readers would still need intake-specific sourceArtifacts map-key knowledge before locating the primary worksheet template anchor for owner commercial evidence collection.',
      tradeoff:
        'Adding one root sourceArtifact string and sourceArtifactCount duplicates compact provenance metadata, but preserves the richer sourceArtifacts map and makes intake packet-level provenance uniform.',
      evidence:
        'docs/commercialization/commercial-evidence-intake-packet-latest.json exposed a sourceArtifacts map but no root sourceArtifact/sourceArtifactCount primary provenance contract.',
    },
    {
      variant: 'Leave commercial evidence intake packet root without canonical sourceTrace rows.',
      reason_rejected:
        'Generic intake-packet readers would still need to infer provenance by inspecting the sourceArtifacts map instead of using the common sourceTrace/sourceTraceCount contract used by adjacent launch-readiness artifacts.',
      tradeoff:
        'Adding six derived sourceTrace rows duplicates compact provenance metadata already present in sourceArtifacts, but the rows are generated from the same map and alignment fixtures keep them synchronized while preserving owner-held evidence boundaries.',
      evidence:
        'docs/commercialization/commercial-evidence-intake-packet-latest.json exposed sourceArtifact/sourceArtifacts/sourceArtifactCount, but no sourceTrace/sourceTraceCount/sourceTraceBoundary contract.',
    },
    {
      variant: 'Leave commercial evidence intake packet basis arrays uncounted.',
      reason_rejected:
        'Owner commercial-evidence readers would still need to inspect requiredGateIds, recordSlots, and ownerCommandSequence before knowing the required-gate, record-slot, and owner-command basis size.',
      tradeoff:
        'Adding three generated root counts duplicates compact metadata already derivable from arrays, but exact intake-packet alignment fixtures keep the counts synchronized while preserving every owner command, partner/outcome requirement, owner-held evidence boundary, and launch gate status.',
      evidence:
        'docs/commercialization/commercial-evidence-intake-packet-latest.json exposed requiredGateIds, recordSlots, and ownerCommandSequence arrays without matching root basis counts.',
    },
    {
      variant: 'Leave commercial evidence intake packet boundaries as prose and row-only fields.',
      reason_rejected:
        'Owner commercial-evidence readers would still need to inspect row-level doesNotProve strings or prose before knowing the packet-level claim-boundary basis behind partner and documented-outcome evidence prep.',
      tradeoff:
        'Adding one generated packet-level array and derived count duplicates compact boundary language already present in the worksheet, but exact intake-packet alignment fixtures keep the count synchronized while preserving owner-held evidence boundaries and launch gate status.',
      evidence:
        'docs/commercialization/commercial-evidence-intake-packet-latest.json exposed an evidenceBoundary and row doesNotProve strings, but no packet-level doesNotProve array or doesNotProveCount.',
    },
    {
      variant: 'Leave commercial evidence record artifact arrays uncounted.',
      reason_rejected:
        'Owner closeout readers would still need to inspect gateIds, doesNotProve, manualInterventionIfMissing, and errors before knowing the redacted commercial evidence artifact basis size.',
      tradeoff:
        'Adding four rendered root counts duplicates compact metadata already derivable from arrays, but the exported count validator and fixture drift cases keep the values synchronized while preserving owner-held evidence boundaries and every commercial-evidence acceptance rule.',
      evidence:
        'docs/commercialization/commercial-evidence-records-latest.json exposed gateIds, doesNotProve, manualInterventionIfMissing, and errors arrays without matching root artifact counts.',
    },
    {
      variant: 'Leave manual WCAG evidence artifact arrays uncounted.',
      reason_rejected:
        'Manual accessibility closeout readers would still need to inspect gateIds, ownerEvidenceArchiveRequirements, rejectedCheckpointIds, doesNotProve, manualInterventionIfMissing, and errors before knowing the redacted manual WCAG evidence artifact basis size.',
      tradeoff:
        'Adding rendered root counts duplicates compact metadata already derivable from arrays, but the exported count validator and fixture drift cases keep the values synchronized while preserving owner-held evidence boundaries and every manual WCAG acceptance rule.',
      evidence:
        'docs/commercialization/manual-wcag-evidence-latest.json exposed gateIds, ownerEvidenceArchiveRequirements, rejectedCheckpointIds, doesNotProve, manualInterventionIfMissing, and errors arrays without matching root artifact counts.',
    },
    {
      variant: 'Leave live proof run packet root with only sourceArtifacts map.',
      reason_rejected:
        'Generic live-proof packet readers would still need live-proof-specific sourceArtifacts map-key knowledge before locating the primary owner-prep anchor for credentialed proof readiness.',
      tradeoff:
        'Adding one root sourceArtifact string and sourceArtifactCount duplicates compact provenance metadata, but preserves the richer sourceArtifacts map and makes live proof packet-level provenance uniform.',
      evidence:
        'docs/commercialization/live-proof-run-packet-latest.json exposed a sourceArtifacts map but no root sourceArtifact/sourceArtifactCount primary provenance contract.',
    },
    {
      variant: 'Leave live proof run packet root without canonical sourceTrace rows.',
      reason_rejected:
        'Generic live-proof readers would still need to infer provenance by inspecting the sourceArtifacts map instead of using the common sourceTrace/sourceTraceCount contract used by adjacent launch-readiness artifacts.',
      tradeoff:
        'Adding four derived sourceTrace rows duplicates compact provenance metadata already present in sourceArtifacts, but the rows are generated from the same map and alignment fixtures keep them synchronized while preserving owner-held live-proof boundaries.',
      evidence:
        'docs/commercialization/live-proof-run-packet-latest.json exposed sourceArtifact/sourceArtifacts/sourceArtifactCount, but no sourceTrace/sourceTraceCount/sourceTraceBoundary contract.',
    },
    {
      variant: 'Leave live proof run packet basis arrays uncounted.',
      reason_rejected:
        'Owner live-proof readers would still need to inspect liveProofs, ownerCommandSequence, and doesNotProve before knowing the proof-row, command, and claim-boundary basis size.',
      tradeoff:
        'Adding three generated root counts duplicates compact metadata already derivable from arrays, but exact live-proof packet alignment fixtures keep the counts synchronized while preserving every owner command, live/payment gate, and owner-held evidence boundary.',
      evidence:
        'docs/commercialization/live-proof-run-packet-latest.json exposed liveProofs, ownerCommandSequence, and doesNotProve arrays without matching root basis counts.',
    },
    {
      variant: 'Leave Stripe test checkout proof boundaries as an uncounted array.',
      reason_rejected:
        'Payment-readiness readers would still need to manually inspect the redacted doesNotProve array before knowing the claim-boundary basis behind the skipped or passed checkout proof artifact.',
      tradeoff:
        'Adding one derived scalar duplicates array length, but fixture and trust checks keep it synchronized without loading credentials, creating checkout sessions, proving payment readiness, or changing launch status.',
      evidence:
        'docs/commercialization/stripe-test-checkout-proof-latest.json exposed doesNotProve without doesNotProveCount.',
    },
    {
      variant: 'Leave production calibration proof boundaries as an uncounted array.',
      reason_rejected:
        'Calibration-readiness readers would still need to manually inspect the redacted doesNotProve array before knowing the claim-boundary basis behind the passed production calibration proof artifact.',
      tradeoff:
        'Adding one derived scalar duplicates array length, but fixture and trust checks keep it synchronized without invoking the deployed calibration function, loading credentials, proving scientific validity, or changing launch status.',
      evidence:
        'docs/commercialization/production-calibration-proof-latest.json exposed doesNotProve without doesNotProveCount.',
    },
    {
      variant: 'Leave live-auth e2e proof boundaries as an uncounted array.',
      reason_rejected:
        'Authenticated-artifact readers would still need to manually inspect the redacted doesNotProve array before knowing the claim-boundary basis behind the passed live-auth e2e proof artifact.',
      tradeoff:
        'Adding one derived scalar duplicates array length, but fixture and trust checks keep it synchronized without invoking live auth, loading credentials, mutating Supabase rows, proving payment readiness, or changing launch status.',
      evidence:
        'docs/commercialization/live-auth-e2e-proof-latest.json exposed doesNotProve without doesNotProveCount.',
    },
    {
      variant: 'Leave Stripe live MRR proof boundaries as an uncounted array.',
      reason_rejected:
        'Revenue-readiness readers would still need to manually inspect the redacted doesNotProve array before knowing the claim-boundary basis behind the failed or passed live-MRR proof artifact.',
      tradeoff:
        'Adding one derived scalar duplicates array length, but fixture and trust checks keep it synchronized without invoking Stripe live APIs, loading credentials, proving revenue, or changing launch status.',
      evidence:
        'docs/commercialization/stripe-live-mrr-proof-latest.json exposed doesNotProve without doesNotProveCount.',
    },
    {
      variant: 'Retry the full commercial verifier under the generic 5-minute fixture timeout.',
      reason_rejected:
        'The direct fixture command is bounded but the previous full verifier run already proved the generic cap can terminate the 250-case fixture suite before completion under load.',
      tradeoff:
        'Adding a single existing timeout-class override is narrower than changing the global commercial verifier timeout or rewriting the fixture suite, and it preserves Browser, Computer, live, payment, credential, outreach, worker, and owner-held gate boundaries.',
      evidence:
        'node scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs passed 250 cases in 106.37 seconds after npm run verify:commercial had timed out at the same fixture step after 300.7 seconds.',
    },
    {
      variant: 'Leave owner-evidence completion drill basis arrays uncounted.',
      reason_rejected:
        'Owner completion-drill readers would still need to inspect recommendedCommandOrder, recommendedOperationalAccessCommands, and doesNotProve before knowing the command-order, operational-access-command, and claim-boundary basis size.',
      tradeoff:
        'Adding three generated root counts duplicates compact metadata already derivable from arrays, but exact completion-drill alignment fixtures keep the counts synchronized while preserving every owner command, operational-access boundary, and owner-held evidence gate.',
      evidence:
        'docs/commercialization/owner-evidence-completion-drill-latest.json exposed recommendedCommandOrder, recommendedOperationalAccessCommands, and doesNotProve arrays without matching root basis counts.',
    },
    {
      variant: 'Leave manual WCAG review packet root with only sourceArtifacts map.',
      reason_rejected:
        'Generic manual-WCAG packet readers would still need manual-WCAG-specific sourceArtifacts map-key knowledge before locating the primary manual evidence template anchor for owner review execution.',
      tradeoff:
        'Adding one root sourceArtifact string and sourceArtifactCount duplicates compact provenance metadata, but preserves the richer sourceArtifacts map and makes manual WCAG review packet-level provenance uniform.',
      evidence:
        'docs/commercialization/manual-wcag-review-packet-latest.json exposed a sourceArtifacts map but no root sourceArtifact/sourceArtifactCount primary provenance contract.',
    },
    {
      variant: 'Leave manual WCAG review packet root without canonical sourceTrace rows.',
      reason_rejected:
        'Generic manual-WCAG review readers would still need to infer provenance by inspecting the sourceArtifacts map instead of using the common sourceTrace/sourceTraceCount contract used by adjacent launch-readiness artifacts.',
      tradeoff:
        'Adding five derived sourceTrace rows duplicates compact provenance metadata already present in sourceArtifacts, but the rows are generated from the same map and alignment fixtures keep them synchronized while preserving owner-held manual-review boundaries.',
      evidence:
        'docs/commercialization/manual-wcag-review-packet-latest.json exposed sourceArtifact/sourceArtifacts/sourceArtifactCount, but no sourceTrace/sourceTraceCount/sourceTraceBoundary contract.',
    },
    {
      variant: 'Leave officialReferences arrays without root officialReferenceCount.',
      reason_rejected:
        'Generic launch-readiness readers would still need artifact-specific array parsing before knowing the official-reference basis size for accessibility, owner evidence, live proof, and manual WCAG template artifacts.',
      tradeoff:
        'Adding one root count duplicates compact metadata already derivable from officialReferences, but exact verifier and trust checks prevent stale counts while keeping official reference rows unchanged.',
      evidence:
        'commercial-accessibility-audit-latest.json, commercial-evidence-intake-packet-latest.json, live-proof-run-packet-latest.json, and manual-wcag-evidence-template.json exposed officialReferences arrays without root officialReferenceCount.',
    },
    {
      variant: 'Leave accessibility audit proof-basis arrays uncounted.',
      reason_rejected:
        'Readers would still need to inspect route, viewport, route result, and manual checklist arrays before knowing the automated accessibility audit basis size.',
      tradeoff:
        'Adding four generated root counts duplicates compact metadata already derivable from arrays, but trust sentinels keep the counts aligned while preserving the audit scope and manual-WCAG boundary.',
      evidence:
        'docs/commercialization/commercial-accessibility-audit-latest.json exposed routes, viewports, routeResults, and manualReviewChecklist arrays without matching root proof-basis counts.',
    },
    {
      variant: 'Leave owner-evidence handoff basis arrays uncounted.',
      reason_rejected:
        'Owner handoff readers would still need to inspect remainingGateIds, commandSequence, and ownerActionRows before knowing the blocker, command, and handoff-row basis size.',
      tradeoff:
        'Adding three generated root counts duplicates compact metadata already derivable from arrays, but exact handoff alignment fixtures keep the counts synchronized while preserving every owner command and owner-held evidence boundary.',
      evidence:
        'docs/commercialization/owner-evidence-handoff-latest.json exposed remainingGateIds, commandSequence, and ownerActionRows arrays without matching root basis counts.',
    },
    {
      variant: 'Leave manual WCAG review packet officialReferences without root officialReferenceCount.',
      reason_rejected:
        'The owner-review worksheet would remain the only generated official-reference packet in this lane requiring array inspection to determine the W3C/WAI reference basis size.',
      tradeoff:
        'Adding one root count duplicates compact metadata already derivable from officialReferences, but exact alignment fixtures and trust sentinels prevent stale counts while preserving the official reference rows.',
      evidence:
        'docs/commercialization/manual-wcag-review-packet-latest.json exposed officialReferences and requiredOfficialReferenceCount but no root officialReferenceCount for the actual officialReferences array.',
    },
    {
      variant: 'Leave manual WCAG review packet basis arrays uncounted.',
      reason_rejected:
        'Owner-review readers would still need to inspect routeReviewPlan, checkpointReviewPlan, routeCheckpointMatrix, nextCommands, and doesNotProve before knowing the worksheet, command, and claim-boundary basis size.',
      tradeoff:
        'Adding five generated root counts duplicates compact metadata already derivable from arrays, but exact alignment fixtures and Markdown checks prevent stale count metadata while preserving every route, checkpoint, command, and owner-held evidence boundary.',
      evidence:
        'docs/commercialization/manual-wcag-review-packet-latest.json exposed routeReviewPlan, checkpointReviewPlan, routeCheckpointMatrix, nextCommands, and doesNotProve arrays without matching root basis counts.',
    },
    {
      variant: 'Leave launch outreach CRM export with row_count only.',
      reason_rejected:
        'Standalone CRM export readers using the generated artifact camelCase count convention would still need to inspect rows or know the snake_case manifest field before reading export size.',
      tradeoff:
        'Adding one camelCase root count duplicates row_count, but exact alignment checks prevent stale count metadata while preserving every CRM row and outreach boundary.',
      evidence:
        'docs/commercialization/launch-outreach-crm-latest.json exposed row_count and rows but no root rowCount parity field.',
    },
    {
      variant: 'Leave required launch-evidence output table sizes implicit in arrays only.',
      reason_rejected:
        'Portfolio and handoff readers would still need launch-evidence-specific traversal to confirm that required score, gap, pain-point, target, outreach, fix-report, optimization, progress, and bottleneck tables are present at the expected sizes.',
      tradeoff:
        'Adding one root count object duplicates compact array lengths, but the values are generator-derived and exact alignment fixtures reject stale hand-edited counts while preserving all source rows and proof boundaries.',
      evidence:
        'docs/commercialization/launch-evidence-latest.json exposed the required arrays but no single root count summary for the orchestrator deliverable tables.',
    },
    {
      variant: 'Leave launch required output table counts only in the launch manifest.',
      reason_rejected:
        'The final commercial summary is the release-level handoff artifact; state-only consumers would still need to inspect launch-evidence-latest.json before confirming required orchestrator table sizes.',
      tradeoff:
        'Mirroring the compact count object adds redundant summary metadata, but exact launch-readiness fixtures keep it synchronized and avoid copying any owner-held, live, payment, credential, or outreach evidence.',
      evidence:
        'docs/commercialization/commercial-verification-summary-latest.json exposed launchEvidenceSummary.deliverableCounts, outreachCoverage, and fixReportCoverage but not the full launch required_output_table_counts set.',
    },
    {
      variant: 'Leave redaction scanned extensions as an uncounted array.',
      reason_rejected:
        'Release-safety readers would still need to inspect scannedExtensions before knowing the scope breadth behind the zero-finding redaction claim.',
      tradeoff:
        'Adding one generated count duplicates scannedExtensions length, but exact redaction alignment fixtures prevent stale count metadata while preserving scan rules, findings, scanned files, and proof boundaries.',
      evidence:
        'docs/commercialization/commercial-artifact-redaction-latest.json exposed scannedExtensions, scannedFileCount, and findingCount, but no scannedExtensionCount.',
    },
    {
      variant: 'Leave redaction reference practices as an uncounted array.',
      reason_rejected:
        'Release-safety readers would still need to inspect referencePractices before knowing the cited external-practice basis behind the redaction report.',
      tradeoff:
        'Adding one generated count duplicates referencePractices length, but exact redaction alignment fixtures prevent stale count metadata while preserving scan rules, findings, reference URLs, and proof boundaries.',
      evidence:
        'docs/commercialization/commercial-artifact-redaction-latest.json exposed referencePractices without referencePracticeCount.',
    },
    {
      variant: 'Leave redaction does-not-prove boundaries as an uncounted array.',
      reason_rejected:
        'Release-safety readers would still need to inspect doesNotProve before knowing the claim-boundary basis behind the redaction report.',
      tradeoff:
        'Adding one generated count duplicates doesNotProve length, but exact redaction alignment fixtures prevent stale count metadata while preserving scan rules, findings, references, and proof boundaries.',
      evidence:
        'docs/commercialization/commercial-artifact-redaction-latest.json exposed doesNotProve without doesNotProveCount.',
    },
    {
      variant: 'Leave source-audit coverage as source IDs, URLs, and aggregate counts only.',
      reason_rejected:
        'A state-only release reader could see official/reference source counts and URLs without a deterministic row-level trace to the source-audit artifact anchors that produced those proof-boundary claims.',
      tradeoff:
        'Adding compact per-source trace rows duplicates source ids, status, and expected-text counts, but keeps provenance auditable without rerunning network fetches, live checks, credentials, Browser/Computer, or owner-held evidence gates.',
      evidence:
        'commercialReadinessState source-audit coverage objects carried sourceIds/sourceKeys/sourceUrls and aggregate expectedTextMatchCount fields but no sourceTrace rows with sourceArtifact anchors.',
    },
    {
      variant: 'Leave ownerGateScoreboard as counts and remaining gate IDs only.',
      reason_rejected:
        'A state-only release reader could see the highest-level remaining owner/live blockers without knowing which closeout, remediation, handoff, and completion-drill artifacts generated each gate status.',
      tradeoff:
        'Adding compact per-gate source traces duplicates a small source map, but it keeps the scoreboard auditable without executing owner commands, live checks, Browser/Computer gates, credentials, payments, or outreach.',
      evidence:
        'commercialReadinessState.ownerGateScoreboard carried remainingGateIds, counts, acceptedLiveGateIds, and failedStepIds but no per-gate sourceTrace across the repo-generated owner-evidence artifacts.',
    },
    {
      variant: 'Keep ownerGateScoreboard source traces only under remainingGateSourceTrace.',
      reason_rejected:
        'Generic release-state readers would still need scoreboard-specific field knowledge instead of the common sourceTrace/sourceTraceCount contract used by surrounding summaries.',
      tradeoff:
        'Adding aliases duplicates one compact per-gate array, but exact fixtures prevent drift while preserving the existing remainingGateSourceTrace field and avoiding a broader schema rewrite.',
      evidence:
        'commercialReadinessState.ownerGateScoreboard used remainingGateSourceTrace while adjacent summaries exposed canonical sourceTrace/sourceTraceCount fields.',
    },
    {
      variant: 'Leave remediationCompletion and remediationExternalGates as counts and gate IDs only.',
      reason_rejected:
        'A state-only release reader could see remediation gate counts and IDs without knowing which remediation completion or owner-action queue rows generated each blocker.',
      tradeoff:
        'Adding compact per-gate remediation source traces duplicates a small amount of row metadata, but it keeps remediation provenance auditable without executing owner commands, live checks, Browser/Computer gates, credentials, payments, or outreach.',
      evidence:
        'commercialReadinessState.remediationCompletion and remediationExternalGates carried gate IDs and counts but no per-gate sourceTrace rows with remediation artifact anchors.',
    },
    {
      variant: 'Keep remediation source traces only under specialized field names.',
      reason_rejected:
        'Generic release-state readers would still need remediation-specific field knowledge instead of the common sourceTrace/sourceTraceCount contract used by neighboring summary objects.',
      tradeoff:
        'Adding aliases duplicates a small per-gate array, but exact fixtures prevent drift while preserving backward-compatible specialized fields and avoiding a broader schema refactor.',
      evidence:
        'commercialReadinessState.remediationCompletion used remainingExternalGateSourceTrace and remediationExternalGates used ownerActionGateSourceTrace while adjacent summaries exposed canonical sourceTrace/sourceTraceCount fields.',
    },
    {
      variant: 'Leave launchEvidence as gap IDs and unresolved blocker IDs only.',
      reason_rejected:
        'A state-only release reader could see the launch blocker IDs without knowing which launch gap, unresolved-blocker, remediation-completion, and remediation-gate rows generated each claim.',
      tradeoff:
        'Adding compact launch blocker source traces duplicates a small source map, but it keeps launch-evidence blocker provenance auditable without executing owner commands, live checks, Browser/Computer gates, credentials, payments, outreach, or owner-held evidence collection.',
      evidence:
        'commercialReadinessState.launchEvidence carried gapGateIds, unresolvedBlockers, and scoreOverall but no sourceArtifact, sourceArtifacts, sourceTrace rows, or proof-boundary text.',
    },
    {
      variant: 'Keep launchEvidence blocker traces only under blockerSourceTrace.',
      reason_rejected:
        'Generic release-state readers would still need launchEvidence-specific field knowledge instead of the common sourceTrace/sourceTraceCount contract used by neighboring summary objects.',
      tradeoff:
        'Adding aliases duplicates one compact blocker array, but exact fixtures prevent drift while preserving the existing blockerSourceTrace field and avoiding a broader schema rewrite.',
      evidence:
        'commercialReadinessState.launchEvidence used blockerSourceTrace while adjacent summaries exposed canonical sourceTrace/sourceTraceCount fields.',
    },
    {
      variant: 'Leave launchEvidenceSummary as aggregate counts without source anchors.',
      reason_rejected:
        'A state-only release reader could see launch scores, required-output counts, outreach coverage, and fix-report coverage without knowing which launch manifest fields produced those summary claims.',
      tradeoff:
        'Adding four compact coverage source-trace rows duplicates a small amount of metadata, but it keeps aggregate launch-evidence provenance auditable without executing outreach, live checks, Browser/Computer gates, credentials, payments, or owner-held evidence collection.',
      evidence:
        'commercialReadinessState.launchEvidenceSummary carried scores, deliverableCounts, outreachCoverage, and fixReportCoverage but no sourceArtifact, sourceArtifacts, sourceTrace rows, or sourceTraceBoundary.',
    },
    {
      variant: 'Leave proofBucketSummary as bucket counts and item rows only.',
      reason_rejected:
        'A state-only release reader could see proof-bucket counts, source paths, and boundary-bearing items without knowing which launch manifest proof_buckets entries generated each proof-bucket row.',
      tradeoff:
        'Adding compact item-level proof-bucket source traces duplicates a small amount of metadata, but it keeps proof-bucket provenance auditable without executing proof commands, live checks, Browser/Computer gates, credentials, payments, outreach, or owner-held evidence collection.',
      evidence:
        'commercialReadinessState.proofBucketSummary carried bucketNames, countsByBucket, sourcePaths, and items but no sourceArtifact, sourceArtifacts, sourceTrace rows, or sourceTraceBoundary.',
    },
    {
      variant: 'Continue deriving launch-evidence progress phase only from the previous PhaseLoop ledger entry.',
      reason_rejected:
        'The launch-evidence manifest is generated before the current slice can record its final PhaseLoop ledger entry, so ledger-only phase derivation can lag behind the manifest implementation and Code Optimization Gate rows.',
      tradeoff:
        'Using the latest optimization review makes the progress update self-consistent with the generated manifest, while retaining the ledger as a fallback for manifests without code-review rows.',
      evidence:
        'docs/commercialization/launch-evidence-latest.json carried code_optimization_reviews for the post-summary redaction slice while progress_updates[0].phase still named the older full-local approval slice.',
    },
    {
      variant: 'Hard-code the commercial verifier step count inside progress_updates.',
      reason_rejected:
        'The commercial verifier step list changes as repo-side proof gates are added, so fixed progress text becomes stale after subsequent phases.',
      tradeoff:
        'Reading the current summary adds a small formatter, but it keeps generated launch evidence synchronized with release evidence.',
      evidence: `${COMMERCIAL_VERIFICATION_SUMMARY_JSON} records plannedStepCount and passedStepCount.`,
    },
    {
      variant: 'Refresh launch evidence after the final summary without rewriting the summary.',
      reason_rejected:
        'That would make launch-evidence progress updates differ from commercialReadinessState.progressUpdates in the release summary.',
      tradeoff:
        'The selected two-write lifecycle adds one final summary rewrite, but it keeps the reader handoff and machine-checkable manifest in parity.',
      evidence:
        'scripts/verify-commercial-summary-launch-readiness-alignment.mjs requires state.progressUpdates to exactly match launch evidence progress_updates.',
    },
    {
      variant: 'Keep the post-run launch evidence progress line as an in-progress summary boundary only.',
      reason_rejected:
        'That avoids overclaiming, but it leaves a confusing stale-looking progress line after a successful default commercial verifier run.',
      tradeoff:
        'The post-summary refresh adds a small deterministic step while preserving the same pilot-only owner-evidence boundary.',
      evidence: 'docs/commercialization/launch-evidence-latest.json progress_updates are the structured launch-evidence handoff.',
    },
    {
      variant: 'Keep the commercial trust summary sentinel locked to the default 67-step invocation.',
      reason_rejected:
        'That makes the advertised full-local commercial verifier fail before the optional browser, accessibility, network, and audit proof gates can run.',
      tradeoff:
        'Invocation-aware sentinels are slightly less tied to one step count, but the release summary alignment fixtures still fail closed on stale root counts and optional-gate overclaims.',
      evidence:
        'npm run verify:commercial-full writes a 79-step summary with all configured release gates included, while the default verifier writes a 67-step partial optional-gate summary.',
    },
    {
      variant: 'Keep Phase E commercial validation as a standalone npm script only.',
      reason_rejected:
        'A standalone command can pass locally while the advertised full commercial verifier still omits the Phase E instrumentation gate.',
      tradeoff:
        'Adding the step to DEFAULT_STEPS lengthens the release verifier slightly, but it prevents a full-summary pass from masking Phase E drift.',
      evidence:
        'package.json exposes verify:commercial-validation, and scripts/verify-commercial-release.mjs now includes phase-e-commercial-validation in DEFAULT_STEPS.',
    },
    {
      variant: 'Run owner/live Stripe, revenue, partner, outcome, or manual WCAG proof commands as part of the Phase E release-gate fix.',
      reason_rejected:
        'Those gates require credentials, live provider access, third-party evidence, or manual reviewer artifacts and must remain owner-held until explicitly supplied.',
      tradeoff:
        'The repo-local full gate remains pilot-only, but it avoids overwriting owner-held evidence, leaking secrets, or converting missing live proof into a false pass.',
      evidence:
        'docs/commercialization/owner-evidence-closeout-status-latest.json keeps manual_wcag_evidence, real_stripe_test_checkout, live_mrr_gt_zero, three_committed_partners, and documented_outcomes unresolved.',
    },
    {
      variant: 'Create a second commercial release runner or a broad release-gate abstraction for Phase E.',
      reason_rejected:
        'The existing release runner already owns ordered release steps, optional gates, summary writing, and pilot-only boundaries.',
      tradeoff:
        'Appending one existing verifier to DEFAULT_STEPS is less flexible than a refactor, but it keeps the change auditable and avoids a new path that could drift from summary alignment checks.',
      evidence:
        'scripts/verify-commercial-release.mjs DEFAULT_STEPS is the source of the commercial summary step list consumed by launch-evidence and trust-boundary verifiers.',
    },
    {
      variant: 'Ignore all net::ERR_ABORTED request failures in the commercial browser journey.',
      reason_rejected:
        'A broad abort ignore could hide cancelled application data requests, route resources, or download failures that should remain release-blocking.',
      tradeoff:
        'The selected local app-icon-only rule is more specific, but it keeps the browser journey strict for substantive route and asset failures.',
      evidence:
        'scripts/verify-commercial-browser.mjs checks the method, host, path, and failure text before ignoring the icon request.',
    },
    {
      variant: 'Remove the /icon.svg links from index.html to avoid the browser abort.',
      reason_rejected:
        'The app icon is a valid public asset used by browser and PWA surfaces; removing the links would weaken presentation metadata instead of fixing verifier classification.',
      tradeoff:
        'Keeping the icon link preserves app metadata and confines the release-gate change to benign browser cancellation handling.',
      evidence:
        'index.html links /icon.svg and public/icon.svg exists in the repo.',
    },
    {
      variant: 'Treat the operational access checklist as proof that Supabase project/functions access is available.',
      reason_rejected:
        'The commands are owner-run probes and local status refreshes; until the strict live closeout readiness verifier exits 0 without --allow-incomplete, Supabase target project visibility and functions API access remain blocked.',
      tradeoff:
        'The checklist adds owner execution detail without moving any launch gate, so the handoff is clearer but still requires owner-approved credentials and current command output.',
      evidence:
        'docs/commercialization/live-closeout-readiness-latest.json still reports status=owner_access_required with supabase-target-project-visible and supabase-functions-api-accessible failed.',
    },
  ];
}

function buildCodeOptimizationReviews() {
  return [
    {
      target_task: 'Launch evidence manifest schema alignment',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 4,
      evidence:
        'The generator emits the validator-required implementation_decisions, rejected_variants, and code_optimization_reviews arrays while preserving the existing pilot-only owner-evidence boundary.',
      tests_or_checks: [
        `python3 ${VALIDATOR_PATH} ${path.join(root, OUTPUT_JSON)} --require-repo-exists`,
        'node scripts/generate-launch-evidence-manifest.mjs --write --validate',
      ],
    },
    {
      target_task: 'Commercial readiness claim boundary',
      policy: 'safe',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The manifest derives launch_decision from goalComplete=false owner/remediation ledgers and retains unresolved blocker IDs for all remaining external gates.',
      tests_or_checks: [
        'node scripts/verify-launch-evidence-alignment.mjs',
        'node scripts/verify-commercial-trust-boundaries.mjs',
      ],
    },
    {
      target_task: 'Launch evidence progress-reporting completeness',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 4,
      evidence:
        'The generator derives one progress update and one evidence-gap bottleneck from current summary, source-audit, owner gates, and PhaseLoop ledger without adding a new subsystem or dependency.',
      tests_or_checks: [
        'node scripts/generate-launch-evidence-manifest.mjs --write --validate',
        'node scripts/verify-launch-evidence-alignment.mjs',
        'node scripts/verify-launch-evidence-alignment-fixtures.mjs',
      ],
    },
    {
      target_task: 'Direct launch evidence progress-digest contract coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The direct launch-evidence alignment verifier now checks fixed progress lane weights, valid lane statuses, confidence bounds, activities_remaining details, and non-empty bottleneck unblock options without changing product behavior or owner evidence gates.',
      tests_or_checks: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Direct launch evidence proof-bucket boundary coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The direct launch-evidence alignment verifier now checks required proof bucket arrays, item-level evidence/source/status/boundary fields, does-not-prove text, and local/candidate/roadmap boundary semantics without changing product behavior or owner evidence gates.',
      tests_or_checks: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Launch evidence release-gate coverage alignment',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The generator adds fix_report.release_gate_coverage from the current commercial summary, and the direct verifier checks command parity, exact summary parity, optional-gate null status, and Markdown visibility without executing optional gates.',
      tests_or_checks: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Owner evidence local-safety handoff propagation',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The owner handoff and completion drill generators now copy a compact localSafetyStatus from owner-evidence-local-safety-latest.json, and direct alignment verifiers reject missing source links or stale snapshots without reading owner-held local evidence contents.',
      tests_or_checks: [
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Trust Center owner local-safety preflight visibility',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The Trust Center model exposes ownerEvidenceLocalSafetySummary and the owner closeout panel renders a local-safety preflight section; the completion-drill alignment verifier now rejects stale UI local-safety status.',
      tests_or_checks: [
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:proof-visibility-ui',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Trust Center owner prep-readiness by-gate visibility',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The Trust Center model exposes ownerEvidencePrepReadinessGateSummaries, the owner closeout panel renders a per-gate prep summary grid, and the prep-readiness alignment verifier rejects missing or stale gate summaries.',
      tests_or_checks: [
        'npm run verify:owner-evidence-prep-alignment-fixtures',
        'npm run verify:owner-evidence-prep-alignment',
        'npm run verify:proof-visibility-ui',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Owner evidence handoff prep-readiness by-gate propagation',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The owner handoff and completion drill expose ownerPrepActionNeededByGate maps with sourceArtifact anchors, and direct alignment fixtures reject missing maps, stale action counts, source drift, and handoff/drill map divergence.',
      tests_or_checks: [
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Owner execution by-gate prep count parity',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The owner handoff and completion drill persist ownerPrepActionNeededByGateCount matching ownerPrepActionNeededByGate map cardinality, render the counts in Markdown, and direct fixtures reject stale JSON counts or omitted Markdown rows.',
      tests_or_checks: [
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run verify:owner-evidence-handoff',
        'npm run verify:owner-evidence-completion-drill',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Commercial summary owner prep-readiness by-gate reconciliation',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The final commercial summary exposes ownerPrepActionNeededByGateCoverage, including gate-scoped, unique, and shared owner-action counts, and the summary alignment fixtures reject stale summary counts plus handoff/drill map divergence.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Direct launch evidence code-optimization evidence coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The direct launch-evidence alignment verifier now checks implementation decisions, rejected variants, code optimization reviews, and Markdown sections without changing product behavior or owner evidence gates.',
      tests_or_checks: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Direct launch evidence adversarial-review coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The direct launch-evidence alignment verifier now checks adversarial review structure and required launch-decision, evidence, and market challenge lanes without changing product behavior or owner evidence gates.',
      tests_or_checks: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Live closeout access source-audit summary coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 4,
      evidence:
        'The source-audit verifier and summary alignment expose official Supabase/GitHub access requirements, expected-text coverage, and account-access does-not-prove boundaries without loading credentials or querying owner accounts.',
      tests_or_checks: [
        'node scripts/verify-live-closeout-access-sources-fixtures.mjs',
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Commercial summary live closeout readiness status coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The final commercial summary now exposes liveCloseoutReadinessCoverage, failed access check IDs, Supabase visibility/function-access booleans, GitHub secret-name counts, and no-mutation/no-secret-printing boundaries from the standalone readiness artifact.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Commercial summary operational access prerequisite coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The final commercial summary now exposes a compact operationalAccessPrerequisiteSummary sourced from owner handoff, while the alignment verifier checks completion-drill parity and Markdown visibility without executing Supabase, Browser/Computer, live, payment, or owner-held evidence gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Full-local approval package plan-only synchronization',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The approval-package verifier checks execution plan, digest, dynamic workflow files, package scripts, and summary references while preserving executionApproved=false.',
      tests_or_checks: [
        'npm run verify:commercial-full-local-approval-package',
        'npm run verify:commercial-full-local-approval-package-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Commercial summary full-local approval state coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes fullLocalApprovalPackageSummary in commercialReadinessState and the alignment fixtures fail closed on approval-state drift, missing state, stale post-summary command wiring, stale source artifact, and Markdown omission without executing optional gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Commercial summary full-local approval does-not-prove count',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'commercialReadinessState.fullLocalApprovalPackageSummary now exposes doesNotProveCount matching its three plan-only doesNotProve boundaries, and launch-readiness alignment fixtures fail closed on stale JSON count metadata or Markdown count omission without executing optional gates.',
      tests_or_checks: [
        'npm run verify:commercial-full-local-approval-package',
        'npm run verify:commercial-full-local-approval-package-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary post-summary artifact-redaction state coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes postSummaryArtifactRedactionSummary in commercialReadinessState and the alignment fixtures fail closed on redaction-state drift, missing state, stale post-summary command wiring, stale source artifact, and Markdown omission without moving the post-summary scan earlier or claiming post-scan counts inside the pre-scan summary.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Commercial verifier progress step-count derivation',
      policy: 'safe',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The launch-evidence generator now formats the progress line from commercial summary status and step counts, and only reports exact pass totals when the summary is finalized as passed.',
      tests_or_checks: [
        'node scripts/generate-launch-evidence-manifest.mjs --write --validate',
        'node scripts/verify-launch-evidence-alignment.mjs',
        'npm run verify:commercial-summary-launch-readiness',
      ],
    },
    {
      target_task: 'Post-summary launch evidence refresh lifecycle',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 4,
      evidence:
        'The release runner refreshes launch evidence after an initial passed summary and rewrites the final summary before redaction and launch-readiness alignment, closing the summary/manifest lifecycle gap without broad refactoring.',
      tests_or_checks: [
        'npm run verify:commercial',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'git diff --check',
      ],
    },
    {
      target_task: 'Launch evidence progress phase freshness',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The launch-evidence generator now derives progress_updates[0].phase from the latest Code Optimization Gate review target_task and the direct alignment fixture suite rejects stale phase names or missing latest-review accomplished text.',
      tests_or_checks: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Commercial summary post-summary launch-evidence refresh state coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes postSummaryLaunchEvidenceRefreshSummary in commercialReadinessState and the launch-readiness fixtures fail closed on missing refresh state, stale status, stale command wiring, stale source artifact, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary post-summary launch-readiness alignment state coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes postSummaryLaunchReadinessAlignmentSummary in commercialReadinessState and the launch-readiness fixtures fail closed on missing alignment state, stale status, stale state command wiring, stale source artifact, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary release-gate coverage state coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes releaseGateCoverageSummary in commercialReadinessState and the launch-readiness fixtures fail closed on missing coverage state, stale included-gate lists, stale source artifact, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary owner command sequence source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes command-level source trace rows for owner handoff commandSequence and completion-drill recommendedCommandOrder, and launch-readiness fixtures fail closed on stale source anchors, missing command source trace rows, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary operational access source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes source trace rows for operational-access prerequisites across owner handoff, completion-drill, and live-closeout readiness check anchors, and launch-readiness fixtures fail closed on stale source anchors, missing operational-access source trace rows, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary owner closeout failed-step source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes source trace rows for failed owner closeout steps from owner-evidence-closeout-status-latest.json, and launch-readiness fixtures fail closed on stale source anchors, missing failed-step source trace rows, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary owner closeout next-command source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes source trace rows for owner closeout nextCommands and statusArtifacts from owner-evidence-closeout-status-latest.json, and launch-readiness fixtures fail closed on stale source anchors, missing command source trace rows, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary live closeout readiness source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes source trace rows for live closeout readiness checks, next actions, and official references from live-closeout-readiness-latest.json, and launch-readiness fixtures fail closed on stale source anchors, missing next-action source trace rows, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary source-audit source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes per-source sourceTrace rows for launch, commercial-intake, live-proof, live-closeout-access, manual-WCAG, and completion-drill source-audit coverage, and launch-readiness fixtures fail closed on missing sourceTrace, stale source anchors, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary owner-gate scoreboard source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes per-gate sourceTrace rows for remaining owner/live gates inside ownerGateScoreboard, and launch-readiness fixtures fail closed on missing sourceTrace, stale source anchors, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary remediation source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes per-gate sourceTrace rows for remediationCompletion and remediationExternalGates, and launch-readiness fixtures fail closed on missing sourceTrace, stale source anchors, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary launch-evidence blocker source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes per-gate blocker sourceTrace rows for launchEvidence gaps and unresolved blockers, and launch-readiness fixtures fail closed on missing sourceTrace, stale source anchors, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary launch-evidence summary source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes coverage-level sourceTrace rows for launchEvidenceSummary scores, deliverable counts, outreach coverage, CRM exports, fix-report coverage, source-audit status, and release-gate commands; launch-readiness fixtures fail closed on missing sourceTrace, stale source anchors, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary proof-bucket source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes item-level sourceTrace rows for proofBucketSummary bucket entries and launch-readiness fixtures fail closed on missing sourceTrace, stale source anchors, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary release-gate source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes gate-level sourceTrace rows for releaseGateCoverageSummary; launch-readiness fixtures fail closed on missing sourceTrace, stale source anchors, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary release-gate coverage does-not-prove count',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes releaseGateCoverageSummary.doesNotProveCount matching its three does-not-prove boundaries, and launch-readiness fixtures fail closed on stale JSON count metadata or Markdown count omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary owner-action queue source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes ownerActionQueueSummary sourceTraceCount and per-gate sourceTrace rows for remediation, closeout, handoff, and completion-drill artifacts, and launch-readiness fixtures fail closed on missing sourceTrace, stale source anchors, missing row source artifacts, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary post-summary command-contract source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes sourceTraceCount, sourceTrace, and sourceTraceBoundary rows for post-summary artifact redaction, launch-readiness alignment, launch-evidence refresh, and full-local approval summaries; launch-readiness fixtures fail closed on missing sourceTrace, stale source anchors, and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, worker, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Owner evidence local-safety source trace propagation',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The owner handoff and completion drill now expose deterministic local-safety sourceTrace rows in JSON and Markdown, the Trust Center model mirrors the same rows, and direct fixture suites reject missing, stale, Markdown-omitted, or UI-stale trace state without reading owner-held local evidence contents.',
      tests_or_checks: [
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:proof-visibility-ui',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Commercial summary owner local-safety source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now exposes ownerEvidenceExecutionSummary.localSafetyStatusSummary with sourceTrace rows tied to owner-evidence-local-safety-latest.json, owner-evidence-handoff-latest.json#localSafetyStatus, and owner-evidence-completion-drill-latest.json#localSafetyStatus; launch-readiness fixtures fail closed on missing sourceTrace, stale anchors, Markdown omission, and stale copied local-safety state without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Owner evidence local-safety artifact counts',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'owner-evidence-local-safety-latest.json now exposes trackedSensitiveFileViolationCount, stagedSensitivePathViolationCount, doesNotProveCount, and referencePracticeCount alongside protectedPathCount, ignoredProtectedPathCount, and errorCount, with fixture drift cases rejecting stale count metadata without reading owner-held local evidence contents or changing owner/live/payment/credential gates.',
      tests_or_checks: [
        'npm run verify:owner-evidence-local-safety-fixtures',
        'npm run verify:owner-evidence-local-safety',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Owner handoff local-safety does-not-prove count parity',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The owner handoff and completion drill now expose localSafetyStatus.doesNotProveCount=3, render the does-not-prove boundary count in Markdown, and carry an eighth local-safety sourceTrace row for owner-evidence-local-safety-latest.json#doesNotProveCount; direct fixture suites reject stale JSON counts and omitted Markdown count rows without reading owner-held evidence contents.',
      tests_or_checks: [
        'npm run verify:owner-evidence-handoff',
        'npm run verify:owner-evidence-completion-drill',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary top-level launch-readiness source trace coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release summary now preserves the full postSummaryLaunchReadinessAlignmentSummary object in the top-level postSummaryLaunchReadinessAlignment appendix, including sourceArtifact, status, sourceTraceCount, sourceTrace, sourceTraceBoundary, and doesNotProve rows; launch-readiness fixtures fail closed on missing/stale top-level source trace and Markdown omission without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, worker, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary remediation canonical sourceTrace alias parity',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The remediationCompletion and remediationExternalGates summary objects now expose sourceTrace/sourceTraceCount aliases that match their existing specialized per-gate remediation traces, and launch-readiness fixtures fail closed on missing or stale aliases without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, worker, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary owner-gate scoreboard canonical sourceTrace alias parity',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'ownerGateScoreboard now exposes sourceTrace/sourceTraceCount aliases matching remainingGateSourceTrace, and launch-readiness fixtures fail closed on missing or stale aliases without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, worker, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary launchEvidence canonical sourceTrace alias parity',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'launchEvidence now exposes sourceTrace/sourceTraceCount aliases matching blockerSourceTrace, and launch-readiness fixtures fail closed on missing or stale aliases without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, worker, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary live closeout readiness canonical sourceTrace alias parity',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'liveCloseoutReadinessCoverage now exposes sourceTrace/sourceTraceCount as a canonical aggregate of check, next-action, and official-reference trace rows, and launch-readiness fixtures fail closed on missing or stale aliases without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, worker, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Live closeout readiness action and boundary count parity',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'live-closeout-readiness-latest.json now exposes nextActionCount and doesNotProveCount matching nextActions and doesNotProve, with Markdown count visibility and launch-readiness fixtures rejecting stale source count metadata without running optional live, Browser/Computer, credential, payment, outreach, worker, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:live-closeout-readiness-status',
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary owner closeout coverage canonical sourceTrace alias parity',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'ownerEvidenceExecutionSummary.closeoutCoverage now exposes sourceTrace/sourceTraceCount as a canonical aggregate of failed-step, next-command, and status-artifact trace rows, and launch-readiness fixtures fail closed on missing or stale aliases without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, worker, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary owner handoff coverage canonical sourceTrace alias parity',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'ownerEvidenceExecutionSummary.handoffCoverage now exposes sourceTrace/sourceTraceCount aliases matching commandSequenceSourceTrace, and launch-readiness fixtures fail closed on missing or stale aliases without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, worker, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary owner completion-drill coverage canonical sourceTrace alias parity',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'ownerEvidenceExecutionSummary.completionDrillCoverage now exposes sourceTrace/sourceTraceCount aliases matching recommendedCommandOrderSourceTrace, and launch-readiness fixtures fail closed on missing or stale aliases without running optional live, Browser/Computer, accessibility, network, full-local, payment, credential, outreach, worker, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary canonical sourceTrace primary sourceArtifact invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'commercialReadinessState canonical sourceTrace rows now include a primary sourceArtifact in addition to richer sourceArtifacts maps, with a generic invariant that rejects missing primary anchors and exact fixture coverage for stale primary anchors.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary owner-action detail row primary sourceArtifact invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'ownerActionQueueSummary detail rows now include a primary sourceArtifact matching the remediation ownerActionQueue anchor, with launch-readiness fixtures rejecting missing, stale, or Markdown-omitted primary row anchors.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary aggregate primary sourceArtifact invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'commercialReadinessState and ownerActionQueueSummary now include deterministic primary sourceArtifact values next to existing sourceArtifacts maps, with launch-readiness fixtures rejecting missing, stale, or Markdown-omitted aggregate primary anchors.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Owner-evidence handoff root primary sourceArtifact invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'owner-evidence-handoff-latest.json now exposes sourceArtifact matching sourceArtifacts.remediationLedger and sourceArtifactCount matching the sourceArtifacts key count, with alignment fixtures rejecting missing, stale, count-drift, or Markdown-omitted root anchors without running owner/live/payment/credential gates.',
      tests_or_checks: [
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run generate:owner-evidence-handoff',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Owner-evidence handoff source trace invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'owner-evidence-handoff-latest.json now exposes sourceTraceCount=4 and sourceTrace rows derived from sourceArtifacts, with Markdown visibility and direct fixtures rejecting stale sourceTraceCount, stale trace rows, stale boundaries, or omitted trace rows without running owner/live/payment/credential gates.',
      tests_or_checks: [
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run generate:owner-evidence-handoff',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Owner-evidence completion drill root primary sourceArtifact invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'owner-evidence-completion-drill-latest.json now exposes sourceArtifact matching sourceArtifacts.handoff and sourceArtifactCount matching the sourceArtifacts key count, with alignment fixtures rejecting missing, stale, count-drift, or Markdown-omitted root anchors without running owner/live/payment/credential gates.',
      tests_or_checks: [
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run generate:owner-evidence-completion-drill',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Owner-evidence completion drill source trace invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'owner-evidence-completion-drill-latest.json now exposes sourceTraceCount=8 and sourceTrace rows derived from sourceArtifacts, with Markdown visibility and direct fixtures rejecting stale sourceTraceCount, stale trace rows, stale boundaries, or omitted trace rows without running owner/live/payment/credential gates.',
      tests_or_checks: [
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run generate:owner-evidence-completion-drill',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial evidence intake packet root primary sourceArtifact invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'commercial-evidence-intake-packet-latest.json now exposes sourceArtifact matching sourceArtifacts.intakeTemplate and sourceArtifactCount matching the sourceArtifacts key count, with alignment fixtures rejecting missing, stale, count-drift, or Markdown-omitted root anchors without running owner/live/payment/credential gates.',
      tests_or_checks: [
        'npm run verify:commercial-evidence-intake-packet-alignment-fixtures',
        'npm run generate:commercial-evidence-intake-packet',
        'npm run verify:commercial-evidence-intake-packet-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial evidence intake packet source trace invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'commercial-evidence-intake-packet-latest.json now exposes sourceTraceCount=6 and sourceTrace rows derived from sourceArtifacts, with Markdown visibility and direct fixtures rejecting stale sourceTraceCount, stale trace rows, or omitted trace rows without running owner/live/payment/credential gates.',
      tests_or_checks: [
        'npm run verify:commercial-evidence-intake-packet-alignment-fixtures',
        'npm run generate:commercial-evidence-intake-packet',
        'npm run verify:commercial-evidence-intake-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Live proof run packet root primary sourceArtifact invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'live-proof-run-packet-latest.json now exposes sourceArtifact matching sourceArtifacts.ownerEvidencePrep and sourceArtifactCount matching the sourceArtifacts key count, with alignment fixtures rejecting missing, stale, count-drift, or Markdown-omitted root anchors without running owner/live/payment/credential gates.',
      tests_or_checks: [
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run generate:live-proof-run-packet',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Live proof run packet source trace invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'live-proof-run-packet-latest.json now exposes sourceTraceCount=4 and sourceTrace rows derived from sourceArtifacts, with Markdown visibility and direct fixtures rejecting stale sourceTraceCount, stale trace rows, or omitted trace rows without running owner/live/payment/credential gates.',
      tests_or_checks: [
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run generate:live-proof-run-packet',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Manual WCAG review packet root primary sourceArtifact invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'manual-wcag-review-packet-latest.json now exposes sourceArtifact matching sourceArtifacts.manualEvidenceTemplate and sourceArtifactCount matching the sourceArtifacts key count, with alignment fixtures rejecting missing, stale, count-drift, or Markdown-omitted root anchors without running owner/live/payment/credential gates.',
      tests_or_checks: [
        'npm run verify:manual-wcag-review-packet-alignment-fixtures',
        'npm run generate:manual-wcag-review-packet',
        'npm run verify:manual-wcag-review-packet-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Manual WCAG review packet source trace invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'manual-wcag-review-packet-latest.json now exposes sourceTraceCount=5 and sourceTrace rows derived from sourceArtifacts, with Markdown visibility and direct fixtures rejecting stale sourceTraceCount, stale trace rows, or omitted trace rows without running owner/manual/live/payment/credential gates.',
      tests_or_checks: [
        'npm run verify:manual-wcag-review-packet-alignment-fixtures',
        'npm run generate:manual-wcag-review-packet',
        'npm run verify:manual-wcag-review-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercialization official-reference root count invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'commercial-accessibility-audit-latest.json, commercial-evidence-intake-packet-latest.json, live-proof-run-packet-latest.json, and manual-wcag-evidence-template.json now expose officialReferenceCount matching their officialReferences array length, with owner-packet fixtures rejecting count or Markdown drift.',
      tests_or_checks: [
        'npm run verify:commercial-a11y',
        'npm run verify:commercial-evidence-intake-packet-alignment-fixtures',
        'npm run verify:commercial-evidence-intake-packet-alignment',
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Manual WCAG review packet official-reference root count invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'manual-wcag-review-packet-latest.json now exposes officialReferenceCount matching its officialReferences array length, with alignment fixtures rejecting stale JSON counts and Markdown count drift while preserving owner-held/manual/live/credential boundaries.',
      tests_or_checks: [
        'npm run verify:manual-wcag-review-packet-alignment-fixtures',
        'npm run generate:manual-wcag-review-packet',
        'npm run verify:manual-wcag-review-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Manual WCAG review packet basis count parity',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'manual-wcag-review-packet-latest.json now exposes routeReviewPlanCount, checkpointReviewPlanCount, routeCheckpointMatrixRowCount, nextCommandCount, and doesNotProveCount matching root arrays, with alignment fixtures rejecting stale JSON counts and Markdown count drift while preserving owner-held/manual/live/credential boundaries.',
      tests_or_checks: [
        'npm run verify:manual-wcag-review-packet-alignment-fixtures',
        'npm run verify:manual-wcag-review-packet',
        'npm run verify:manual-wcag-review-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Launch outreach CRM root rowCount invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'launch-outreach-crm-latest.json now exposes rowCount matching row_count, rows.length, target_customers length, and CSV row count, with alignment fixtures rejecting stale JSON count drift while preserving manual outreach-only boundaries.',
      tests_or_checks: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Launch evidence required output table count summary',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'launch-evidence-latest.json now exposes required_output_table_counts for the orchestrator output tables, derived from current manifest arrays and checked by direct alignment fixtures without changing any launch claim or owner/live gate status.',
      tests_or_checks: [
        'npm run verify:launch-evidence-alignment-fixtures',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary required output table count mirror',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'commercial-verification-summary-latest.json now mirrors launch-evidence required_output_table_counts as launchEvidenceSummary.requiredOutputTableCounts, with exact launch-readiness fixtures rejecting missing, stale, or Markdown-omitted summary count metadata while preserving pilot-only launch readiness boundaries.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial artifact redaction scanned extension count',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'commercial-artifact-redaction-latest.json now exposes scannedExtensionCount matching scannedExtensions length, and redaction alignment fixtures fail closed on stale JSON count metadata or Markdown count omission without changing scan patterns, file inclusion, or zero-finding boundaries.',
      tests_or_checks: [
        'npm run verify:commercial-artifact-redaction',
        'npm run verify:commercial-summary-redaction',
        'npm run verify:commercial-summary-redaction-fixtures',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial artifact redaction reference-practice count',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'commercial-artifact-redaction-latest.json now exposes referencePracticeCount matching referencePractices length, and redaction alignment fixtures fail closed on stale JSON count metadata or Markdown count omission without changing scan patterns, reference rows, file inclusion, or zero-finding boundaries.',
      tests_or_checks: [
        'npm run verify:commercial-artifact-redaction',
        'npm run verify:commercial-summary-redaction',
        'npm run verify:commercial-summary-redaction-fixtures',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial artifact redaction does-not-prove count',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'commercial-artifact-redaction-latest.json now exposes doesNotProveCount matching doesNotProve length, and redaction alignment fixtures fail closed on stale JSON count metadata or Markdown count omission without changing scan patterns, references, file inclusion, or zero-finding boundaries.',
      tests_or_checks: [
        'npm run verify:commercial-artifact-redaction',
        'npm run verify:commercial-summary-redaction',
        'npm run verify:commercial-summary-redaction-fixtures',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial accessibility audit proof-basis counts',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'commercial-accessibility-audit-latest.json now exposes routeCount, viewportCount, routeResultCount, and manualReviewChecklistCount matching the audit arrays, and the Markdown packet displays those counts without changing audit scope, route coverage, manual-WCAG boundaries, or external gates.',
      tests_or_checks: [
        'npm run verify:commercial-a11y',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Owner-evidence handoff basis counts',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'owner-evidence-handoff-latest.json now exposes remainingGateCount, commandSequenceCount, and ownerActionRowCount matching its root arrays, and the Markdown handoff packet displays those counts without changing owner commands, owner-held evidence gates, or launch readiness.',
      tests_or_checks: [
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run generate:owner-evidence-handoff',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Live proof run packet basis counts',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'live-proof-run-packet-latest.json now exposes liveProofCount, ownerCommandSequenceCount, and doesNotProveCount matching its root arrays, and the Markdown packet displays those counts without changing owner commands, live/payment gates, credential handling, or launch readiness.',
      tests_or_checks: [
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run generate:live-proof-run-packet',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Stripe test checkout proof does-not-prove count invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The Stripe test checkout proof verifier derives doesNotProveCount from its canonical doesNotProve array, and the live-proof packet alignment fixture rejects stale source proof count metadata without running Stripe, Supabase, Browser, Computer, payment, credential, outreach, worker, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run verify:stripe-test-checkout -- --allow-missing-env',
        'npm run verify:live-proof-run-packet',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Production calibration proof does-not-prove count invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The production calibration proof verifier derives doesNotProveCount from its canonical doesNotProve array, and the live-proof packet alignment fixture rejects stale source proof count metadata without invoking Supabase Edge Functions, loading credentials, running Browser, Computer, payment, outreach, worker, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run verify:live-proof-run-packet',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Live-auth e2e proof does-not-prove count invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The live-auth e2e proof verifier derives doesNotProveCount from its canonical doesNotProve array, and the live-proof packet alignment fixture rejects stale source proof count metadata without invoking live auth, loading credentials, running Browser, Computer, payment, outreach, worker, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run verify:live-proof-run-packet',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Stripe live MRR proof does-not-prove count invariant',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The Stripe live MRR proof verifier emits doesNotProveCount from its canonical doesNotProve array, and the live-proof packet alignment fixture rejects stale source proof count metadata without invoking Stripe live APIs, loading credentials, running Browser, Computer, payment mutation, outreach, worker, or owner-held gates.',
      tests_or_checks: [
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run verify:live-proof-run-packet',
        'npm run verify:live-proof-run-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Post-summary launch-readiness fixture timeout bound',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The post-summary launch-readiness fixture step uses the existing build-class timeout only for its 250-case temp-root verifier suite, preserving all optional Browser, Computer, live, payment, credential, outreach, worker, and owner-held gate boundaries.',
      tests_or_checks: [
        'node scripts/verify-commercial-summary-launch-readiness-alignment-fixtures.mjs',
        'npm run verify:live-proof-run-packet-alignment-fixtures',
        'npm run verify:live-proof-run-packet',
        'npm run verify:launch-evidence',
        'npm run verify:commercial-trust',
        'git diff --check',
      ],
    },
    {
      target_task: 'Owner-evidence completion drill basis counts',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'owner-evidence-completion-drill-latest.json now exposes recommendedCommandOrderCount, recommendedOperationalAccessCommandCount, and doesNotProveCount matching its root arrays, and the Markdown drill displays those counts without changing owner commands, operational-access prerequisites, owner-held evidence gates, credential handling, or launch readiness.',
      tests_or_checks: [
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run generate:owner-evidence-completion-drill',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial evidence intake packet basis counts',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'commercial-evidence-intake-packet-latest.json now exposes requiredGateCount, recordSlotCount, and ownerCommandSequenceCount matching its root arrays, and the Markdown packet displays those counts without changing owner commands, partner/outcome evidence requirements, owner-held evidence gates, credential handling, outreach, or launch readiness.',
      tests_or_checks: [
        'npm run verify:commercial-evidence-intake-packet-alignment-fixtures',
        'npm run generate:commercial-evidence-intake-packet',
        'npm run verify:commercial-evidence-intake-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial evidence intake packet does-not-prove count',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'commercial-evidence-intake-packet-latest.json now exposes doesNotProveCount matching its packet-level doesNotProve array, and the Markdown packet displays the boundary count and list without changing owner commands, partner/outcome evidence requirements, owner-held evidence gates, credential handling, outreach, or launch readiness.',
      tests_or_checks: [
        'npm run verify:commercial-evidence-intake-packet-alignment-fixtures',
        'npm run generate:commercial-evidence-intake-packet',
        'npm run verify:commercial-evidence-intake-packet-alignment',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial evidence records artifact counts',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'commercial-evidence-records-latest.json now exposes gateIdCount, doesNotProveCount, manualInterventionIfMissingCount, and errorCount matching its root arrays, with fixture drift cases rejecting stale count metadata without changing owner-held evidence gates, record acceptance rules, salt handling, outreach, or launch readiness.',
      tests_or_checks: [
        'npm run verify:commercial-evidence-records-fixtures',
        'npm run verify:commercial-evidence-records:write',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Manual WCAG evidence artifact counts',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'manual-wcag-evidence-latest.json now exposes gateIdCount, ownerEvidenceArchiveRequirementCount, requiredOwnerEvidenceArchiveRequirementCount, rejectedCheckpointCount, doesNotProveCount, manualInterventionIfMissingCount, and errorCount matching its root arrays, with fixture drift cases rejecting stale count metadata without changing owner-held evidence gates, manual WCAG acceptance rules, route/checkpoint requirements, outreach, or launch readiness.',
      tests_or_checks: [
        'npm run verify:manual-wcag-evidence-fixtures',
        'npm run verify:manual-wcag-evidence:write',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial worktree hygiene artifact counts',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'commercial-worktree-hygiene-latest.json now exposes allowedUntrackedPathPatternCount, sensitiveUntrackedPathPatternCount, untrackedPathCheckCount, doesNotProveCount, and errorCount matching its root arrays while preserving existing untracked path status counts, with fixture drift cases rejecting stale count metadata without reading file contents, changing git policy, running live gates, or upgrading launch readiness.',
      tests_or_checks: [
        'npm run verify:commercial-worktree-hygiene-fixtures',
        'npm run verify:commercial-worktree-hygiene',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial summary post-summary lifecycle does-not-prove counts',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'postSummaryArtifactRedaction, postSummaryLaunchReadinessAlignment, and postSummaryLaunchEvidenceRefresh now expose doesNotProveCount matching their doesNotProve arrays, render those counts in Markdown, and launch-readiness fixtures reject stale JSON counts or omitted Markdown rows.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Commercial verification summary root count parity',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'Root stepCount and doesNotProveCount are derived from root arrays, failedStepCount is verified against failedSteps, Markdown exposes the root counts, and launch-readiness fixtures fail closed on stale JSON count metadata or count-row omission.',
      tests_or_checks: [
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Owner evidence closeout status root count parity',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'Root closeout counts are derived from acceptedLiveGateIds, ownerGateCloseoutSummary, steps, failedStepIds, and wrote arrays, Markdown exposes the counts, and launch-readiness fixtures fail closed on stale count metadata.',
      tests_or_checks: [
        'npm run verify:owner-evidence-closeout-status',
        'npm run verify:commercial-summary-launch-readiness-fixtures',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:launch-evidence',
        'npm run verify:launch-evidence-alignment',
        'npm run verify:commercial-trust',
        'npm run verify:commercial',
      ],
    },
    {
      target_task: 'Full-local trust summary sentinel compatibility',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The trust-boundary verifier now accepts the current summary step-count field and either the default partial optional-gate state or the full-local all-configured-gates-included state, while the final full-local summary records all release gates passed and keeps launch_decision pilot-only.',
      tests_or_checks: [
        'node --check scripts/verify-commercial-trust-boundaries.mjs',
        'npm run verify:commercial-full',
        'npm run verify:commercial-trust',
        'npm run verify:launch-evidence-alignment',
      ],
    },
    {
      target_task: 'Strict provenance release gate ordering',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The release runner now requires source verification for data provenance and, for --with-network invocations, moves the existing sources step ahead of data-provenance without duplicating network fetches or weakening the pilot-only launch boundary.',
      tests_or_checks: [
        'node --check scripts/verify-commercial-release.mjs',
        'node scripts/verify-commercial-data-provenance.mjs --write --require-source-verification',
        'npm run verify:commercial-full',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Phase E commercial validation full release gate coverage',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The commercial release runner now includes the existing Phase E verifier as phase-e-commercial-validation, the full-local summary reports 79 planned and passed steps with zero failures, and launch evidence still records a pilot-only decision with the same five owner-held blockers.',
      tests_or_checks: [
        'node --check scripts/verify-commercial-release.mjs',
        'npm run verify:commercial-validation',
        'npm run verify:commercial-full',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Commercial browser local app-icon abort classifier',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The commercial browser verifier now ignores only a browser-cancelled local GET /icon.svg request with net::ERR_ABORTED while preserving failure behavior for application routes, page errors, console errors, non-local requests, and other network failures.',
      tests_or_checks: [
        'node --check scripts/verify-commercial-browser.mjs',
        'npm run verify:commercial-browser',
        'npm run verify:commercial-full',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
      ],
    },
    {
      target_task: 'Owner operational access command checklist surfacing',
      policy: 'strict',
      verdict: 'pass',
      minimality_score: 5,
      evidence:
        'The owner evidence handoff, completion drill, and Trust Center now expose the exact owner-run GitHub/Supabase access probes plus strict live-closeout verifier commands, while fixture suites fail closed on stale command lists or missing Markdown, the trust sentinel avoids stale failed-summary coupling during release runs, and the pilot-only owner-access boundary is preserved.',
      tests_or_checks: [
        'npm run generate:owner-evidence-handoff',
        'npm run generate:owner-evidence-completion-drill',
        'npm run verify:owner-evidence-handoff-alignment-fixtures',
        'npm run verify:owner-evidence-completion-drill-alignment-fixtures',
        'npm run verify:owner-evidence-handoff-alignment',
        'npm run verify:owner-evidence-completion-drill-alignment',
        'npm run verify:proof-visibility-ui',
        'npm run verify:commercial-summary-launch-readiness',
        'npm run verify:commercial-trust',
      ],
    },
  ];
}

function latestPhaseLedgerEntry() {
  const entries = readJsonl(PHASE_LEDGER_JSONL).filter((entry) => entry.type === 'phase');
  return entries.at(-1) || null;
}

function slugifyPhaseId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function latestCodeOptimizationReview(codeOptimizationReviews) {
  return Array.isArray(codeOptimizationReviews) ? codeOptimizationReviews.at(-1) || null : null;
}

function progressPhaseId({ latestPhase, codeOptimizationReviews }) {
  const latestReview = latestCodeOptimizationReview(codeOptimizationReviews);
  const reviewPhase = slugifyPhaseId(latestReview?.target_task);
  if (reviewPhase) return reviewPhase;
  return latestPhase?.phase_id || 'commercial-launch-readiness-phase-loop';
}

function buildTargetMatrix(summary, remainingGates, launchSourceAudit, latestPhase) {
  const summaryPassed = summary?.status === 'passed';
  const fullLocalPlanReady = exists(FULL_LOCAL_PLAN_MD);
  const launchEvidenceAligned = launchSourceAudit.status === 'passed' && launchSourceAudit.url_alignment_passed === true;

  return [
    {
      lane: 'Repo Map',
      target_percent: 10,
      current_percent: summaryPassed ? 100 : 45,
      status: summaryPassed ? 'pass' : 'running',
      evidence: ['docs/commercialization/commercialization-codebase-index.json', COMMERCIAL_VERIFICATION_SUMMARY_JSON],
      confidence: summaryPassed ? 5 : 3,
    },
    {
      lane: 'Security',
      target_percent: 15,
      current_percent: summaryPassed ? 100 : 45,
      status: summaryPassed ? 'pass' : 'running',
      evidence: ['npm run verify:commercial', 'docs/commercialization/commercial-artifact-redaction-latest.json'],
      confidence: summaryPassed ? 5 : 3,
    },
    {
      lane: 'Readiness',
      target_percent: 15,
      current_percent: summaryPassed ? 85 : 45,
      status: remainingGates.length === 0 ? 'pass' : 'running',
      evidence: [COMMERCIAL_VERIFICATION_SUMMARY_JSON, OWNER_CLOSEOUT_STATUS_JSON],
      confidence: 4,
    },
    {
      lane: 'Sellability',
      target_percent: 15,
      current_percent: remainingGates.length === 0 ? 100 : 65,
      status: remainingGates.length === 0 ? 'pass' : 'running',
      evidence: [OUTPUT_JSON, OWNER_HANDOFF_JSON],
      confidence: 4,
    },
    {
      lane: 'Market Pain Research',
      target_percent: 20,
      current_percent: launchEvidenceAligned ? 100 : 45,
      status: launchEvidenceAligned ? 'pass' : 'running',
      evidence: [OUTPUT_JSON, LAUNCH_SOURCE_AUDIT_JSON],
      confidence: launchEvidenceAligned ? 5 : 3,
    },
    {
      lane: 'Target Customers + Outreach',
      target_percent: 10,
      current_percent: 85,
      status: 'running',
      evidence: [OUTPUT_CRM_JSON, OUTPUT_CRM_CSV],
      confidence: 4,
    },
    {
      lane: 'Safe Fix Lane',
      target_percent: 10,
      current_percent: fullLocalPlanReady ? 85 : 45,
      status: fullLocalPlanReady ? 'running' : 'pending',
      evidence: [FULL_LOCAL_PLAN_MD, latestPhase?.phase_id || PHASE_LEDGER_JSONL],
      confidence: 4,
    },
    {
      lane: 'Synthesis + Validation',
      target_percent: 5,
      current_percent: summaryPassed ? 90 : 45,
      status: remainingGates.length === 0 ? 'pass' : 'running',
      evidence: [OUTPUT_JSON, COMMERCIAL_VERIFICATION_SUMMARY_JSON, PHASE_LEDGER_JSONL],
      confidence: 4,
    },
  ];
}

function formatCommercialVerifierProgress(summary) {
  const planned = Number.isInteger(summary?.plannedStepCount) ? summary.plannedStepCount : null;
  const passed = Number.isInteger(summary?.passedStepCount) ? summary.passedStepCount : null;
  const failed = Number.isInteger(summary?.failedStepCount) ? summary.failedStepCount : null;
  const status = summary?.status || 'unknown';

  if (status === 'passed' && planned !== null && passed !== null && failed !== null) {
    return `Default commercial verifier summary status=${status}; ${passed}/${planned} planned repo-side steps passed and ${failed} failed, followed by post-summary redaction, launch-readiness alignment, and full-local approval-package checks.`;
  }

  if (planned !== null) {
    return `Default commercial verifier summary status=${status}; final step counts are written after the launch-evidence generation step, so use ${COMMERCIAL_VERIFICATION_SUMMARY_JSON} as the authoritative release-gate coverage artifact.`;
  }

  return `Default commercial verifier summary status=${status}; step counts were unavailable, so verify ${COMMERCIAL_VERIFICATION_SUMMARY_JSON} before treating release-gate coverage as current.`;
}

function formatLatestCodeOptimizationProgress(codeOptimizationReviews) {
  const latestReview = latestCodeOptimizationReview(codeOptimizationReviews);
  if (!isNonEmptyString(latestReview?.target_task)) {
    return 'No Code Optimization Gate review is available; use the PhaseLoop ledger for progress context.';
  }

  const verdict = isNonEmptyString(latestReview.verdict) ? latestReview.verdict : 'unknown';
  const minimality = Number.isInteger(latestReview.minimality_score)
    ? `, minimality ${latestReview.minimality_score}/5`
    : '';
  const evidence = isNonEmptyString(latestReview.evidence) ? ` ${latestReview.evidence}` : '';

  return `Latest Code Optimization Gate review: ${latestReview.target_task} (${verdict}${minimality}).${evidence}`;
}

function buildProgressUpdates({ summary, remainingGates, launchSourceAudit, latestPhase, codeOptimizationReviews }) {
  const createdAt = new Date().toISOString();
  const phase = progressPhaseId({ latestPhase, codeOptimizationReviews });
  return [
    {
      phase,
      created_at: createdAt,
      accomplished: [
        formatCommercialVerifierProgress(summary),
        formatLatestCodeOptimizationProgress(codeOptimizationReviews),
        'Launch evidence manifest validates against the orchestrator schema and remains pilot-only with five owner-evidence gates open.',
        'Plan-only full-local workflow status is executable and remains executionApproved=false.',
      ],
      target_matrix: buildTargetMatrix(summary, remainingGates, launchSourceAudit, latestPhase),
      pending: [
        ...remainingGates.map((gate) => `${gate.id}: ${gate.neededEvidence || gate.label}`),
        'Explicit approval is still required before optional Browser/Computer, accessibility, browser journey, network/source fetch, npm audit, full-local worker execution, live payment, credential, or outreach gates.',
      ],
      activities_remaining: {
        current_phase_actions: remainingGates.length,
        next_phase_actions: 1,
        next_phase: 'owner-held evidence closeout or explicitly approved optional full-local gate execution',
      },
      bottleneck:
        'Owner-held evidence gates are the current launch-readiness bottleneck; repo-side checks can stay green without proving live checkout, live MRR, partner commitments, documented outcomes, or manual WCAG conformance.',
    },
  ];
}

function buildBottleneckLog(remainingGates) {
  return [
    {
      phase: 'owner-evidence-closeout',
      task_or_subtask: remainingGates.map((gate) => gate.id).join(', '),
      elapsed_minutes: 0,
      last_update: new Date().toISOString(),
      root_cause: 'evidence gap',
      top_unblock_options: [
        'Owner completes manual WCAG review packet, hashes owner-held review artifacts, and validates docs/commercialization/manual-wcag-evidence.local.json with --require-complete.',
        'Owner loads test-mode Stripe and Supabase synthetic-user credentials, then runs npm run verify:stripe-test-checkout and attaches only redacted proof metadata.',
        'Owner provides permissioned partner/outcome evidence plus owner-held hashes, then composes and validates redacted commercial evidence records.',
      ],
    },
  ];
}

function buildLaunchSourceAuditSummary(painPoints, competitorSubstitutes, crmExport) {
  const boundary =
    'Source URL audit proves source-page reachability and expected page text only; it does not prove buyer willingness to pay, customer outcomes, legal compliance, WCAG conformance, live revenue, partner commitments, or production runtime behavior.';
  const currentSourceUrls = collectLaunchEvidenceSourceUrls({
    pain_points: painPoints,
    competitor_substitutes: competitorSubstitutes,
    outreach_plan: {
      crm_export: crmExport,
    },
  });

  if (!exists(LAUNCH_SOURCE_AUDIT_JSON)) {
    return {
      artifact: LAUNCH_SOURCE_AUDIT_JSON,
      status: 'missing',
      all_passed: null,
      source_count: 0,
      passed_count: 0,
      failed_count: 0,
      missing_expectation_count: 0,
      network_fetch: null,
      generated_at: null,
      current_manifest_source_urls: currentSourceUrls,
      audited_source_urls: [],
      current_source_count: currentSourceUrls.length,
      audited_source_count: 0,
      url_alignment_passed: false,
      missing_source_urls: currentSourceUrls,
      unexpected_source_urls: [],
      boundary,
    };
  }

  const audit = readJson(LAUNCH_SOURCE_AUDIT_JSON);
  const auditedSourceUrls = collectSourceAuditUrls(audit);
  const { missing, unexpected } = diffValues(currentSourceUrls, auditedSourceUrls);
  const urlAlignmentPassed = arraysEqual(currentSourceUrls, auditedSourceUrls);
  const allPassed = audit.allPassed === true && urlAlignmentPassed;

  return {
    artifact: LAUNCH_SOURCE_AUDIT_JSON,
    status: allPassed ? 'passed' : 'failed',
    all_passed: audit.allPassed === true,
    source_count: audit.sourceCount || 0,
    passed_count: audit.passedCount || 0,
    failed_count: audit.failedCount || 0,
    missing_expectation_count: audit.missingExpectationCount || 0,
    network_fetch: audit.networkFetch === true,
    generated_at: audit.generatedAt || null,
    current_manifest_source_urls: currentSourceUrls,
    audited_source_urls: auditedSourceUrls,
    current_source_count: currentSourceUrls.length,
    audited_source_count: auditedSourceUrls.length,
    url_alignment_passed: urlAlignmentPassed,
    missing_source_urls: missing,
    unexpected_source_urls: unexpected,
    boundary,
  };
}

function buildManifest() {
  const packageJson = readJson('package.json');
  const gates = readJson(REMEDIATION_GATES_JSON);
  const completionAudit = readJson(COMPLETION_AUDIT_JSON);
  const remainingGates = completionAudit.remainingExternalGates || [];
  const ownerActionQueue = gates.ownerActionQueue || [];
  const ownerHandoff = exists(OWNER_HANDOFF_JSON) ? readJson(OWNER_HANDOFF_JSON) : null;
  const ownerHandoffRowsByGateId = new Map(
    (ownerHandoff?.ownerActionRows || []).map((row) => [row.gateId, row])
  );
  const painPoints = buildPainPoints();
  const targetCustomers = buildTargetCustomers();
  const competitorSubstitutes = buildCompetitorSubstitutes();
  const crmExport = buildCrmExport(targetCustomers, painPoints);
  const objectionHandlingMatrix = buildObjectionHandlingMatrix();
  const implementationDecisions = buildImplementationDecisions();
  const rejectedVariants = buildRejectedVariants();
  const codeOptimizationReviews = buildCodeOptimizationReviews();
  const launchSourceAudit = buildLaunchSourceAuditSummary(painPoints, competitorSubstitutes, crmExport);
  const latestPhase = latestPhaseLedgerEntry();
  const commercialSummary = exists(COMMERCIAL_VERIFICATION_SUMMARY_JSON)
    ? readJson(COMMERCIAL_VERIFICATION_SUMMARY_JSON)
    : null;
  const goalComplete = gates.goalComplete === true && completionAudit.goalComplete === true;
  const branch = runGit(['branch', '--show-current']);
  const commit = runGit(['rev-parse', '--short', 'HEAD']);

  const gaps = remainingGates.map((gate) => ({
    id: gate.id,
    gate_id: gate.id,
    gap: gate.label,
    severity: severityForGate(gate.id),
    evidence: `${COMPLETION_AUDIT_JSON}#${gate.id}`,
    framework_mapping: frameworkMappingForGate(gate.id),
    needed_evidence: gate.neededEvidence,
    buyer_impact: gate.riskIfSkipped || gate.neededEvidence,
    owner_action: gate.ownerAction || gate.neededEvidence,
    owner_prep_command: gate.ownerPrepCommand || null,
    blocking_owner_actions: ownerHandoffRowsByGateId.get(gate.id)?.blockingOwnerActions || [],
    next_command: gate.nextCommand || null,
    fix: gate.ownerAction || gate.neededEvidence,
    status: statusForGap(gate.status),
  }));

  const manifest = {
    schema_version: 1,
    repo: {
      name: packageJson.name || 'career-automation-insights-engine',
      path: root,
      profile: 'ai-app',
      commit,
    },
    run: {
      name: 'career-automation-insights-commercial-launch-readiness',
      mode: 'fix-safe',
      research_depth: 'deep',
      worker_mode: 'dry-run',
      generated_at: new Date().toISOString(),
      branch,
    },
    launch_decision: goalComplete ? 'sellable-with-caveats' : 'pilot-only',
    scores: {
      security: 4,
      readiness: 3,
      sellability: 4,
      evidence: 3,
      overall: 3,
    },
    proof_buckets: {
      hosted_live: [
        proofBucketItem(
          'Production calibration proof artifact',
          'Tracked redacted artifact exists, but final live-gate evidence remains unattached.',
          'docs/commercialization/production-calibration-proof-latest.json',
          'candidate_live_artifact',
          'Does not prove broad scientific validity or future production performance.'
        ),
        proofBucketItem(
          'Authenticated live artifact E2E proof artifact',
          'Tracked redacted artifact exists, but final live-gate evidence remains unattached.',
          'docs/commercialization/live-auth-e2e-proof-latest.json',
          'candidate_live_artifact',
          'Does not prove payment proof, malware scanning, provider-log deletion, or legal compliance.'
        ),
      ],
      local: [
        proofBucketItem(
          'Commercial release verifier',
          'Default commercial gate passes locally.',
          'npm run verify:commercial',
          'present',
          'Local proof only. Does not prove hosted runtime, owner-held evidence, optional full-local gates, or commercial readiness.'
        ),
        proofBucketItem(
          'TypeScript compiler',
          'Type-level check passes.',
          'npx tsc --noEmit',
          'present',
          'Local proof only. Does not prove runtime behavior, hosted deployment, owner-held evidence, or commercial readiness.'
        ),
        proofBucketItem(
          'Accessibility smoke',
          'Commercial responsive/accessibility smoke artifact exists.',
          'npm run verify:commercial-a11y',
          'present',
          'Local proof only. Does not prove manual WCAG conformance, legal compliance, procurement approval, or commercial readiness.'
        ),
      ],
      repo_artifact: [
        proofBucketItem(
          'Remediation external gates ledger',
          'Canonical owner action queue and fail-closed gates.',
          REMEDIATION_GATES_JSON,
          'present',
          'Repo artifact only. Does not prove owner-held evidence, live runtime completion, or commercial readiness.'
        ),
        proofBucketItem(
          'Remediation completion audit',
          'Phase A-E local proof and remaining external gates.',
          COMPLETION_AUDIT_JSON,
          'present',
          'Repo artifact only. Does not prove owner-held evidence, live runtime completion, or commercial readiness.'
        ),
        proofBucketItem(
          'Owner action queue alignment',
          'Trust Center queue matches generated remediation ledger.',
          'npm run verify:owner-action-queue',
          'present',
          'Repo artifact only. Does not prove owner action completion, external evidence, or commercial readiness.'
        ),
        ...(exists(OWNER_CLOSEOUT_STATUS_JSON)
          ? [
              proofBucketItem(
                'Owner evidence closeout status',
                'Ordered closeout status artifact records incomplete-safe owner/live evidence readiness.',
                OWNER_CLOSEOUT_STATUS_JSON,
                'present',
                'Does not prove owner-held live, payment, partner, outcome, or manual WCAG evidence.'
              ),
            ]
          : []),
        ...(exists(OWNER_HANDOFF_JSON)
          ? [
              proofBucketItem(
                'Owner evidence handoff packet',
                'Generated JSON/Markdown/CSV handoff consolidates owner actions, closeout steps, raw-evidence policy, and next commands.',
                OWNER_HANDOFF_JSON,
                'present',
                'Does not prove external evidence; it is an execution aid for owner-held closeout.'
              ),
            ]
          : []),
        ...(exists(LAUNCH_SOURCE_AUDIT_JSON)
          ? [
              proofBucketItem(
                'Launch evidence source URL audit',
                `Launch evidence source URLs audited with status=${launchSourceAudit.status}; ${launchSourceAudit.passed_count}/${launchSourceAudit.source_count} source URLs passed.`,
                LAUNCH_SOURCE_AUDIT_JSON,
                launchSourceAudit.status,
                launchSourceAudit.boundary
              ),
            ]
          : []),
        proofBucketItem(
          'Launch outreach CRM seed export',
          'Generated manual outreach seed rows for the top target segments with source URLs, proof assets, next actions, objections, and does-not-prove boundaries.',
          OUTPUT_CRM_JSON,
          'generated',
          crmExport.boundary
        ),
        proofBucketItem(
          'Commercial codebase index',
          'Route/function/doc index regenerated by commercial verifier.',
          'docs/commercialization/commercialization-codebase-index.json',
          'present',
          'Repo artifact only. Does not prove route behavior, live deployment, owner-held evidence, or commercial readiness.'
        ),
      ],
      candidate_shadow: [
        proofBucketItem(
          'Founder-led pilot validation workflow',
          'Worksheet/export and lead ops exist; real reviewer rows remain owner-held.',
          'src/lib/commercialLaunchReadiness.ts',
          'candidate_shadow',
          'Candidate/shadow proof only. Does not prove partner commitments, outreach delivery, buyer replies, revenue, or commercial readiness.'
        ),
        proofBucketItem(
          'Trust Center owner action queue',
          'Five remaining owner-evidence gates are visible and exportable as CSV.',
          'src/components/proof/ProofVisibilityPanels.tsx',
          'candidate_shadow',
          'Candidate/shadow proof only. Does not prove owner action completion, external evidence, or commercial readiness.'
        ),
      ],
      roadmap: [
        proofBucketItem(
          'Live MRR proof',
          'Requires real paid subscription or paid invoice evidence.',
          'npm run verify:stripe-live-mrr',
          'owner_required',
          'Roadmap/owner-required proof only. Does not prove live revenue, retention, product-market fit, or commercial readiness.'
        ),
        proofBucketItem(
          'Manual WCAG evidence',
          'Requires completed owner-held WCAG-EM review metadata.',
          'npm run verify:manual-wcag-evidence -- --evidence docs/commercialization/manual-wcag-evidence.local.json --require-complete',
          'owner_required',
          'Roadmap/owner-required proof only. Does not prove manual WCAG conformance, legal compliance, procurement approval, or commercial readiness.'
        ),
        proofBucketItem(
          'Committed partner/outcome evidence',
          'Requires permissioned owner-held evidence records.',
          'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
          'owner_required',
          'Roadmap/owner-required proof only. Does not prove partner commitments, documented outcomes, testimonial compliance, or commercial readiness.'
        ),
      ],
    },
    gaps,
    pain_points: painPoints,
    target_customers: targetCustomers,
    competitor_substitutes: competitorSubstitutes,
    outreach_plan: {
      decision_boundary: 'Manual founder-led pilots only until owner/live evidence gates pass.',
      thirty_sixty_ninety_plan: [
        {
          window: '0-30 days',
          action: 'Run founder-led relevance reviews with coaches, career centers, and workforce planning teams using the proof-pack gallery and Trust Center queue.',
          proof_needed:
            'Reviewer notes, permissioned design-partner commitment metadata, manual WCAG evidence metadata, and objections mapped to the owner-evidence handoff.',
          success_metric:
            'At least three permissioned design-partner commitments or explicit disqualification notes with no unsupported commercial-ready claims.',
        },
        {
          window: '31-60 days',
          action: 'Convert the strongest segment into scoped pilots, then run owner-held Stripe, live runtime, and commercial evidence closeout commands.',
          proof_needed:
            'Passed Stripe test checkout, production calibration, authenticated live artifact E2E, live MRR, and redacted partner/outcome evidence records.',
          success_metric:
            'The two accepted live-runtime artifacts stay attached while the five remaining external gates are explicitly blocked with owner actions.',
        },
        {
          window: '61-90 days',
          action: 'Re-score launch decision after evidence closeout, formalize pricing/support boundaries, and prepare portfolio comparison from validated evidence JSON.',
          proof_needed:
            'Validated launch evidence manifest, complete owner-evidence closeout status, source-audit alignment, and documented outcome evidence.',
          success_metric:
            'Launch decision can move beyond pilot-only only if P1 gates are closed by owner-held evidence.',
        },
      ],
      thirty_days: [
        'Use proof-pack gallery and Trust Center queue in review calls.',
        'Collect three permissioned design-partner commitments.',
        'Complete manual WCAG evidence metadata before institutional procurement claims.',
      ],
      sixty_days: [
        'Run Stripe test checkout and live MRR verifier only with owner-held keys.',
        'Attach redacted live-gate evidence for already-passed production calibration and authenticated live E2E artifacts.',
        'Collect at least one permissioned documented outcome record.',
      ],
      ninety_days: [
        'Re-run closeout:owner-evidence with complete redacted evidence.',
        'Use the launch evidence manifest as the compare-ready artifact for portfolio prioritization.',
        'Re-score launch decision after external gates are proven.',
      ],
      email_script:
        'Subject: Source-labeled AI work transition review\\n\\nI am piloting a planning-only proof pack for role-level AI exposure and career transition conversations. It includes source IDs, caveats, and explicit does-not-prove boundaries. Would a 20-minute review of one sample artifact be useful for your coaching, career-center, or workforce planning workflow?',
      linkedin_script:
        'I am testing a source-labeled AI work transition proof pack for planning-only career and workforce reviews. If you review career readiness, coaching, or workforce programs, I would value feedback on whether the artifact is useful and what proof is missing.',
      demo_narrative: {
        opening:
          'Start with one buyer workflow: a coach, career center, or workforce team needs a planning-only AI work-transition artifact that is source-labeled and safe to review.',
        proof:
          'Show the proof-pack gallery, Trust Center owner-action queue, source-audited launch evidence, and one sample report while naming the exact does-not-prove boundaries.',
        ask:
          'Ask for a 20-minute relevance review and permission to record redacted commitment or outcome metadata if the artifact is useful.',
        caveat:
          'State plainly that the product is pilot-only until live revenue, Stripe checkout, partner commitments, outcomes, production runtime evidence, and manual WCAG evidence are accepted.',
      },
      objection_handling: [
        ...objectionHandlingMatrix.map((item) => `If asked "${item.objection}": ${item.response}`),
      ],
      objection_handling_matrix: objectionHandlingMatrix,
      crm_export: crmExport,
    },
    fix_report: {
      files_changed_scope:
        'Commercial launch-readiness scripts, generated ledgers, Trust Center proof surfaces, Supabase payment functions, and proof-pack docs.',
      owner_action_queue_count: ownerActionQueue.length,
      owner_prep_command_count: ownerActionQueue.filter((item) => item.ownerPrepCommand).length,
      owner_prep_action_needed_count: ownerHandoff?.ownerPrepReadiness?.ownerActionNeededCount ?? null,
      ledger_alignment: {
        status: 'generated_from_current_ledgers',
        expected_gate_ids: remainingGates.map((gate) => gate.id),
        launch_gap_ids: gaps.map((gap) => gap.id),
        launch_gap_gate_ids: gaps.map((gap) => gap.gate_id),
        owner_action_gate_ids: ownerActionQueue.map((item) => item.id),
        owner_handoff_gate_ids: ownerHandoff?.ownerActionRows?.map((row) => row.gateId) || [],
        boundary:
          'Launch evidence gap IDs are generated from the current remediation completion audit and owner-action queue. This traceability does not prove the external gates are complete.',
      },
      source_audit: launchSourceAudit,
      checks_run: MANIFEST_LOCAL_CHECKS,
      checks_run_boundary:
        'checks_run records only the manifest-generation and schema-validation commands represented by this artifact. Default release, browser journey, accessibility, network, typecheck, and diff checks require separate current command output.',
      release_gate_commands: RELEASE_GATE_COMMANDS,
      release_gate_coverage: buildReleaseGateCoverage(commercialSummary),
      commercial_verification_summary: {
        json: COMMERCIAL_VERIFICATION_SUMMARY_JSON,
        markdown: COMMERCIAL_VERIFICATION_SUMMARY_MD,
        boundary:
          'Use this summary as evidence only for the exact verifier invocation it records. It does not prove release gates that were not included in that invocation or any owner-held live/commercial evidence.',
      },
      unresolved_blockers: remainingGates.map((gate) => gate.id),
      approval_gates: [
        'No production deploys without owner approval.',
        'No payment changes or live Stripe actions without owner approval.',
        'No credential rotation performed by this repo-side verifier.',
        'No customer outreach performed by this repo-side verifier.',
      ],
    },
    implementation_decisions: implementationDecisions,
    rejected_variants: rejectedVariants,
    code_optimization_reviews: codeOptimizationReviews,
    adversarial_reviews: [
      {
        lane: 'launch decision',
        challenge: 'Commercial-ready would be an overclaim because owner/live gates remain incomplete.',
        result: 'Launch decision is pilot-only and final completion remains false.',
      },
      {
        lane: 'evidence',
        challenge: 'Passed local tests do not prove live MRR, committed partners, or WCAG conformance.',
        result: 'Those claims remain explicit gaps and roadmap/owner-action items.',
      },
      {
        lane: 'market',
        challenge: 'Source URLs support buyer pain framing but do not prove willingness to pay for this product.',
        result: 'Manifest labels willingness-to-pay as directional and keeps paid launch gated by owner evidence.',
      },
    ],
    progress_updates: buildProgressUpdates({
      summary: commercialSummary,
      remainingGates,
      launchSourceAudit,
      latestPhase,
      codeOptimizationReviews,
    }),
    bottleneck_log: buildBottleneckLog(remainingGates),
    market_evidence_mode: 'real',
    synthetic_data_points: [],
    ecc_ledger: {
      route: 'commercial-launch-readiness-orchestrator',
      tier: 2,
      mode: 'PhaseLoop',
      automode_decision: 'skip',
      baseline: 'Repo had remediation ledgers but no skill-schema launch evidence manifest.',
      checks: ['validate_launch_evidence.py', 'npm run verify:commercial'],
      delta: 'Structured launch evidence JSON and Markdown are generated from current repo ledgers.',
      decision: goalComplete ? 'sellable-with-caveats' : 'pilot-only',
      next_adjustment: 'Attach owner-held evidence or rerun manifest after external gates pass.',
    },
  };

  manifest.required_output_table_counts = buildRequiredOutputTableCounts(manifest);
  return manifest;
}

function renderMarkdown(manifest, validation) {
  const scoreRows = Object.entries(manifest.scores)
    .map(([key, value]) => `| ${key} | ${value}/5 |`)
    .join('\n');
  const requiredOutputCountRows = Object.entries(manifest.required_output_table_counts)
    .map(([key, value]) => `| ${key} | ${value} |`)
    .join('\n');
  const gapRows = manifest.gaps
    .map((gap) => {
      const ownerPrepCommand = gap.owner_prep_command ? `\`${gap.owner_prep_command}\`` : 'n/a';
      const blockingOwnerActions = gap.blocking_owner_actions.length > 0 ? gap.blocking_owner_actions.join('<br>') : 'n/a';
      const nextCommand = gap.next_command ? `\`${gap.next_command}\`` : 'n/a';
      return `| ${gap.gate_id || 'n/a'} | ${gap.gap} | ${gap.severity} | ${gap.status} | ${gap.fix} | ${ownerPrepCommand} | ${blockingOwnerActions} | ${nextCommand} |`;
    })
    .join('\n');
  const painRows = manifest.pain_points
    .map((item) => {
      const sources = item.source_evidence.map((source) => `[source](${source})`).join('<br>');
      return `| ${item.rank} | ${item.pain_point} | ${item.affected_buyer} | ${sources} | ${item.willingness_to_pay_signal} | ${item.repo_proof_fit} | ${item.confidence}/5 |`;
    })
    .join('\n');
  const targetRows = manifest.target_customers
    .map(
      (item) =>
        `| ${item.rank} | ${item.account_or_segment} | ${item.pain} | ${item.trigger} | ${item.decision_maker} | ${item.outreach_angle} | ${item.proof_to_show} | ${item.confidence}/5 |`
    )
    .join('\n');
  const competitorRows = manifest.competitor_substitutes
    .map((item) => {
      const sources = item.source_evidence.map((source) => `[source](${source})`).join('<br>');
      return `| ${item.rank} | ${item.name} | ${item.type} | ${item.target_buyer} | ${item.core_promise} | ${item.repo_stronger_where} | ${item.repo_weaker_where} | ${item.switching_or_adoption_friction} | ${sources} | ${item.confidence}/5 |`;
    })
    .join('\n');
  const outreachRows = manifest.outreach_plan.thirty_sixty_ninety_plan
    .map((item) => `| ${item.window} | ${item.action} | ${item.proof_needed} | ${item.success_metric} |`)
    .join('\n');
  const objectionRows = manifest.outreach_plan.objection_handling
    .map((item) => `| ${item} | See proof boundary in Trust Center and owner evidence handoff. |`)
    .join('\n');
  const objectionMatrixRows = manifest.outreach_plan.objection_handling_matrix
    .map(
      (item) =>
        `| ${item.objection} | ${item.buyer_concern} | ${item.response} | ${item.proof_asset} | ${item.next_step} | ${item.boundary} |`
    )
    .join('\n');
  const crmExport = manifest.outreach_plan.crm_export;
  const crmRows = crmExport.rows
    .map(
      (item) =>
        `| ${item.account_name} | ${item.buyer_role} | ${item.status} | [source](${item.website}) | ${item.proof_asset} | ${item.next_action} | ${item.confidence}/5 |`
    )
    .join('\n');
  const proofBucketRows = Object.entries(manifest.proof_buckets)
    .flatMap(([bucket, items]) =>
      items.map((item) => `| ${bucket} | ${item.label} | ${item.status} | ${item.source} | ${item.boundary || 'n/a'} |`)
    )
    .join('\n');
  const fixReportRows = [
    ['Files changed scope', manifest.fix_report.files_changed_scope],
    ['Owner action queue count', String(manifest.fix_report.owner_action_queue_count)],
    ['Owner prep command count', String(manifest.fix_report.owner_prep_command_count)],
    ['Owner prep action needed count', String(manifest.fix_report.owner_prep_action_needed_count)],
    ['Manifest-local checks', manifest.fix_report.checks_run.join('<br>')],
    ['Checks boundary', manifest.fix_report.checks_run_boundary],
    [
      'Release gate commands',
      Object.entries(manifest.fix_report.release_gate_commands)
        .map(([key, value]) => `${key}: ${value}`)
        .join('<br>'),
    ],
    [
      'Release gate coverage',
      Object.entries(manifest.fix_report.release_gate_coverage)
        .map(([key, value]) => {
          if (key === 'boundary') return `boundary: ${value}`;
          const passed =
            value.passedInThisInvocation === null ? 'not included' : String(value.passedInThisInvocation);
          return `${key}: command=${value.command}; included=${value.includedInThisInvocation}; passed=${passed}${
            value.boundary ? `; boundary=${value.boundary}` : ''
          }`;
        })
        .join('<br>'),
    ],
    [
      'Commercial verification summary',
      `${manifest.fix_report.commercial_verification_summary.json}<br>${manifest.fix_report.commercial_verification_summary.markdown}<br>${manifest.fix_report.commercial_verification_summary.boundary}`,
    ],
    ['Unresolved blockers', manifest.fix_report.unresolved_blockers.join(', ')],
    ['Approval gates', manifest.fix_report.approval_gates.join('<br>')],
  ]
    .map(([field, value]) => `| ${field} | ${value} |`)
    .join('\n');
  const adversarialRows = manifest.adversarial_reviews
    .map((item) => `| ${item.lane} | ${item.challenge} | ${item.result} |`)
    .join('\n');
  const progressRows = manifest.progress_updates
    .map((item) => {
      const accomplished = item.accomplished.join('<br>');
      const pending = item.pending.join('<br>');
      const activities = item.activities_remaining
        ? [
            `current_phase_actions: ${item.activities_remaining.current_phase_actions}`,
            `next_phase_actions: ${item.activities_remaining.next_phase_actions}`,
            `next_phase: ${item.activities_remaining.next_phase}`,
          ].join('<br>')
        : 'n/a';
      return `| ${item.phase} | ${item.created_at} | ${accomplished} | ${pending} | ${activities} | ${item.bottleneck} |`;
    })
    .join('\n');
  const targetMatrixRows = manifest.progress_updates
    .flatMap((item) =>
      item.target_matrix.map((lane) => {
        const evidence = lane.evidence.join('<br>');
        return `| ${lane.lane} | ${lane.target_percent}% | ${lane.current_percent}% | ${lane.status} | ${evidence} | ${lane.confidence}/5 |`;
      })
    )
    .join('\n');
  const bottleneckRows = manifest.bottleneck_log
    .map((item) => {
      const options = item.top_unblock_options.join('<br>');
      return `| ${item.phase} | ${item.task_or_subtask} | ${item.elapsed_minutes} | ${item.last_update} | ${item.root_cause} | ${options} |`;
    })
    .join('\n');
  const implementationDecisionRows = manifest.implementation_decisions
    .map(
      (item) =>
        `| ${item.decision} | ${item.chosen_variant} | ${item.acceptance_check} | ${item.proof} | ${item.tests_run.join('<br>')} |`
    )
    .join('\n');
  const rejectedVariantRows = manifest.rejected_variants
    .map((item) => `| ${item.variant} | ${item.reason_rejected} | ${item.tradeoff} | ${item.evidence} |`)
    .join('\n');
  const optimizationReviewRows = manifest.code_optimization_reviews
    .map(
      (item) =>
        `| ${item.target_task} | ${item.policy} | ${item.verdict} | ${item.minimality_score}/5 | ${item.evidence} | ${item.tests_or_checks.join('<br>')} |`
    )
    .join('\n');
  const eccRows = Object.entries(manifest.ecc_ledger)
    .map(([key, value]) => `| ${key} | ${Array.isArray(value) ? value.join('<br>') : value} |`)
    .join('\n');
  const sourceAudit = manifest.fix_report.source_audit;

  return `# Launch Evidence Manifest

Generated: ${manifest.run.generated_at}
Decision: \`${manifest.launch_decision}\`
Validator: ${validation.valid ? 'passed' : 'not run or failed'}

This manifest is generated from repo ledgers. It is not a commercial-ready claim. Owner-held live payment, partner, outcome, and manual WCAG evidence remain separate gates.

## Scores

| Dimension | Score |
| --- | --- |
${scoreRows}

## Required Output Table Counts

| Field | Count |
| --- | --- |
${requiredOutputCountRows}

## Gaps

| Gate ID | Gap | Severity | Status | Fix | Owner prep command | Blocking owner-prep actions | Next command |
| --- | --- | --- | --- | --- | --- | --- | --- |
${gapRows}

## Pain Points

| Rank | Pain point | Buyer | Source evidence | Willingness-to-pay signal | Repo proof fit | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
${painRows}

## Target Customers

| Rank | Segment | Pain | Trigger | Decision maker | Outreach angle | Proof to show | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
${targetRows}

## Competitor And Substitute Analysis

| Rank | Alternative | Type | Target buyer | Core promise | Repo stronger where | Repo weaker where | Switching/adoption friction | Source evidence | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${competitorRows}

## Outreach Plan

Decision boundary: ${manifest.outreach_plan.decision_boundary}

| Window | Action | Proof needed | Success metric |
| --- | --- | --- | --- |
${outreachRows}

### Email Script

\`\`\`text
${manifest.outreach_plan.email_script}
\`\`\`

### LinkedIn Script

\`\`\`text
${manifest.outreach_plan.linkedin_script}
\`\`\`

### Demo Narrative

Opening: ${manifest.outreach_plan.demo_narrative.opening}

Proof: ${manifest.outreach_plan.demo_narrative.proof}

Ask: ${manifest.outreach_plan.demo_narrative.ask}

Caveat: ${manifest.outreach_plan.demo_narrative.caveat}

### Objection Handling

| Objection | Response |
| --- | --- |
${objectionRows}

### Objection Handling Matrix

| Objection | Buyer concern | Response | Proof asset | Next step | Boundary |
| --- | --- | --- | --- | --- | --- |
${objectionMatrixRows}

## CRM Export Seed Rows

Artifacts: \`${crmExport.artifact_json}\`, \`${crmExport.artifact_csv}\`

${crmExport.boundary}

| Account/segment | Buyer role | Status | Source URL | Proof asset | Next action | Confidence |
| --- | --- | --- | --- | --- | --- | --- |
${crmRows}

## Proof Buckets

| Bucket | Evidence | Status | Source | Boundary |
| --- | --- | --- | --- | --- |
${proofBucketRows}

## Fix Report

| Field | Value |
| --- | --- |
${fixReportRows}

## Adversarial Review

| Lane | Claim challenged | Result |
| --- | --- | --- |
${adversarialRows}

## Progress Updates

| Phase | Created at | Accomplished | Pending | Activities remaining | Bottleneck |
| --- | --- | --- | --- | --- | --- |
${progressRows}

### Target Matrix

| Lane | Target | Current | Status | Evidence | Confidence |
| --- | --- | --- | --- | --- | --- |
${targetMatrixRows}

## Bottleneck Log

| Phase | Task/subtask | Elapsed minutes | Last update | Root cause | Top unblock options |
| --- | --- | --- | --- | --- | --- |
${bottleneckRows}

## Implementation Decisions

| Decision | Chosen variant | Acceptance check | Proof | Tests/checks |
| --- | --- | --- | --- | --- |
${implementationDecisionRows}

## Rejected Variants

| Variant | Reason rejected | Tradeoff | Evidence |
| --- | --- | --- | --- |
${rejectedVariantRows}

## Code Optimization Reviews

| Target task | Policy | Verdict | Minimality | Evidence | Tests/checks |
| --- | --- | --- | --- | --- | --- |
${optimizationReviewRows}

## ECC Ledger

| Field | Value |
| --- | --- |
${eccRows}

## Source Audit

Artifact: \`${sourceAudit.artifact}\`
Status: \`${sourceAudit.status}\`
Source URLs: ${sourceAudit.source_count}
Passed: ${sourceAudit.passed_count}
Failed: ${sourceAudit.failed_count}
Missing expectations: ${sourceAudit.missing_expectation_count}
URL alignment: \`${sourceAudit.url_alignment_passed === true ? 'passed' : 'failed'}\`
Current manifest source URLs: ${sourceAudit.current_source_count}
Audited source URLs: ${sourceAudit.audited_source_count}
Missing source URLs: ${sourceAudit.missing_source_urls.length}
Unexpected source URLs: ${sourceAudit.unexpected_source_urls.length}

${sourceAudit.boundary}

## Validation

\`\`\`text
${validation.command || 'not run'}
${validation.stdout || ''}
${validation.stderr || ''}
\`\`\`
`;
}

function writeManifest(manifest) {
  fs.mkdirSync(path.join(root, 'docs/commercialization'), { recursive: true });
  fs.writeFileSync(path.join(root, OUTPUT_JSON), `${JSON.stringify(manifest, null, 2)}\n`);
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function renderCrmCsv(crmExport) {
  const fields = crmExport.schema_fields;
  const lines = [
    fields.map(csvEscape).join(','),
    ...crmExport.rows.map((row) => fields.map((field) => csvEscape(row[field])).join(',')),
  ];
  return `${lines.join('\n')}\n`;
}

function writeCrmExport(manifest) {
  const crmExport = manifest.outreach_plan.crm_export;
  fs.writeFileSync(path.join(root, OUTPUT_CRM_JSON), `${JSON.stringify(crmExport, null, 2)}\n`);
  fs.writeFileSync(path.join(root, OUTPUT_CRM_CSV), renderCrmCsv(crmExport));
}

function validateManifest(targetPath) {
  const command = [
    'python3',
    VALIDATOR_PATH,
    targetPath,
    '--require-repo-exists',
  ];
  const result = spawnSync(command[0], command.slice(1), {
    cwd: root,
    encoding: 'utf8',
  });
  const manifest = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  const alignment = validateLaunchEvidenceAlignment(manifest);
  const sourceAuditAlignment = validateLaunchSourceAuditAlignment(manifest);
  const outreachPlanCompleteness = validateOutreachPlanCompleteness(manifest);
  const competitorSubstituteCompleteness = validateCompetitorSubstituteCompleteness(manifest);
  const crmExportCompleteness = validateCrmExportCompleteness(manifest);
  const schemaValid = result.status === 0;
  const valid =
    schemaValid &&
    alignment.valid &&
    sourceAuditAlignment.valid &&
    outreachPlanCompleteness.valid &&
    competitorSubstituteCompleteness.valid &&
    crmExportCompleteness.valid;
  return {
    valid,
    command: command.join(' '),
    exitCode: valid ? 0 : result.status || 1,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim(),
    schema_valid: schemaValid,
    ledger_alignment: alignment,
    source_audit_alignment: sourceAuditAlignment,
    outreach_plan_completeness: outreachPlanCompleteness,
    competitor_substitute_completeness: competitorSubstituteCompleteness,
    crm_export_completeness: crmExportCompleteness,
  };
}

function main() {
  const shouldWrite = hasFlag('--write');
  const shouldValidate = hasFlag('--validate');
  const manifest = buildManifest();
  let targetPath = path.join(root, OUTPUT_JSON);

  if (shouldWrite) {
    writeManifest(manifest);
    writeCrmExport(manifest);
  } else if (shouldValidate) {
    targetPath = path.join(os.tmpdir(), `apo-launch-evidence-${Date.now()}.json`);
    fs.writeFileSync(targetPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  const validation = shouldValidate
    ? validateManifest(targetPath)
    : { valid: null, command: null, exitCode: null, stdout: '', stderr: '' };

  if (shouldWrite) {
    fs.writeFileSync(path.join(root, OUTPUT_MD), renderMarkdown(manifest, validation));
  }

  const output = {
    ok: shouldValidate ? validation.valid : true,
    launchDecision: manifest.launch_decision,
    scoreOverall: manifest.scores.overall,
    gapCount: manifest.gaps.length,
    painPointCount: manifest.pain_points.length,
    targetCustomerCount: manifest.target_customers.length,
    validation,
    crmRowCount: manifest.outreach_plan.crm_export.row_count,
    wrote: shouldWrite ? [OUTPUT_JSON, OUTPUT_MD, OUTPUT_CRM_JSON, OUTPUT_CRM_CSV] : null,
  };

  console.log(JSON.stringify(output, null, 2));
  if (shouldValidate && !validation.valid) process.exitCode = validation.exitCode || 1;
}

main();
