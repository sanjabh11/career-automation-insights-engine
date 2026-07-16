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
const REQUIRED_CRM_FIELDS = [
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
const REQUIRED_PROGRESS_LANES = [
  'Repo Map',
  'Security',
  'Readiness',
  'Sellability',
  'Market Pain Research',
  'Target Customers + Outreach',
  'Safe Fix Lane',
  'Synthesis + Validation',
];
const REQUIRED_PROGRESS_LANE_WEIGHTS = new Map([
  ['Repo Map', 10],
  ['Security', 15],
  ['Readiness', 15],
  ['Sellability', 15],
  ['Market Pain Research', 20],
  ['Target Customers + Outreach', 10],
  ['Safe Fix Lane', 10],
  ['Synthesis + Validation', 5],
]);
const ALLOWED_PROGRESS_STATUSES = new Set(['pass', 'running', 'fail', 'pending']);
const ALLOWED_BOTTLENECK_ROOT_CAUSES = new Set([
  'context overload',
  'ambiguous requirements',
  'dependency issue',
  'testing loop',
  'search/exploration',
  'decision paralysis',
  'tool/execution delay',
  'worker failure',
  'evidence gap',
]);
const REQUIRED_PROOF_BUCKETS = ['hosted_live', 'local', 'repo_artifact', 'candidate_shadow', 'roadmap'];
const REQUIRED_PROOF_BUCKET_ITEM_FIELDS = ['label', 'evidence', 'source', 'status', 'boundary'];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
        continue;
      }
      if (char === '"') {
        inQuotes = false;
        continue;
      }
      field += char;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }
    if (char === '\r') continue;
    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((csvRow) => csvRow.some((cell) => cell.length > 0));
  if (!header) return { header: [], rows: [] };
  return {
    header,
    rows: body.map((csvRow) => {
      const record = {};
      header.forEach((column, index) => {
        record[column] = csvRow[index] || '';
      });
      return record;
    }),
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

function uniqueSorted(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim()))].sort((a, b) =>
    a.localeCompare(b)
  );
}

function isValidIsoDate(value) {
  return typeof value === 'string' && value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function slugifyPhaseId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function latestCodeOptimizationReview(manifest) {
  const reviews = manifest.code_optimization_reviews;
  return Array.isArray(reviews) ? reviews.at(-1) || null : null;
}

function expectedProgressPhase(manifest) {
  return slugifyPhaseId(latestCodeOptimizationReview(manifest)?.target_task);
}

function hasDoesNotProveBoundary(value) {
  return /does not prove|do not prove|do not send/i.test(String(value || ''));
}

function collectManifestSourceUrls(manifest) {
  return uniqueSorted([
    ...(manifest.pain_points || []).flatMap((item) => item.source_evidence || []),
    ...(manifest.competitor_substitutes || []).flatMap((item) => item.source_evidence || []),
    ...(manifest.outreach_plan?.crm_export?.rows || [])
      .map((row) => row.website)
      .filter((value) => /^https?:\/\//.test(value || '')),
  ]);
}

function expectedRequiredOutputTableCounts(manifest) {
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

function collectAuditSourceUrls(sourceAudit) {
  return uniqueSorted((sourceAudit.sources || []).map((source) => source.url));
}

function mapById(rows, field = 'id') {
  return new Map((rows || []).map((row) => [row[field], row]));
}

function expectedLaunchDecision(gates, completionAudit, closeoutStatus) {
  return gates.goalComplete === true && completionAudit.goalComplete === true && closeoutStatus.goalComplete === true
    ? 'sellable-with-caveats'
    : 'pilot-only';
}

function validateDecisionAndScores(errors, manifest, gates, completionAudit, closeoutStatus) {
  requireExact(errors, 'manifest.schema_version', 1, manifest.schema_version);
  requireExact(errors, 'manifest.launch_decision', expectedLaunchDecision(gates, completionAudit, closeoutStatus), manifest.launch_decision);

  if (manifest.launch_decision === 'pilot-only') {
    requireExact(errors, 'manifest.scores.overall', 3, manifest.scores?.overall);
    if (!Array.isArray(manifest.gaps) || manifest.gaps.length === 0) {
      addError(errors, 'pilot_only_without_open_gaps');
    }
  }

  if (manifest.launch_decision !== 'pilot-only' && (manifest.fix_report?.unresolved_blockers || []).length > 0) {
    addError(errors, 'non_pilot_decision_with_unresolved_blockers', {
      decision: manifest.launch_decision,
      unresolvedBlockers: manifest.fix_report?.unresolved_blockers || [],
    });
  }
}

function validateRequiredOutputTableCounts(errors, manifest, markdownSource) {
  const expected = expectedRequiredOutputTableCounts(manifest);
  const actual = manifest.required_output_table_counts;

  if (!actual || typeof actual !== 'object' || Array.isArray(actual)) {
    addError(errors, 'required_output_table_counts_missing');
    return;
  }

  requireExact(errors, 'manifest.required_output_table_counts', expected, actual);

  for (const [field, count] of Object.entries(expected)) {
    if (!markdownSource.includes(`| ${field} | ${count} |`)) {
      addError(errors, 'markdown_missing_required_output_table_count', { field, count });
    }
  }
}

function validateGapAlignment(errors, manifest, completionAudit, remediationGates, ownerHandoff) {
  const expectedGateIds = (completionAudit.remainingExternalGates || []).map((gate) => gate.id);
  const completionById = mapById(completionAudit.remainingExternalGates || []);
  const ownerQueueById = mapById(remediationGates.ownerActionQueue || []);
  const handoffByGateId = mapById(ownerHandoff.ownerActionRows || [], 'gateId');
  const gaps = manifest.gaps || [];
  const fixReport = manifest.fix_report || {};
  const ledgerAlignment = fixReport.ledger_alignment || {};

  requireExact(errors, 'manifest.gaps.ids', expectedGateIds, gaps.map((gap) => gap.id));
  requireExact(errors, 'manifest.gaps.gate_ids', expectedGateIds, gaps.map((gap) => gap.gate_id));
  requireExact(errors, 'manifest.fix_report.unresolved_blockers', expectedGateIds, fixReport.unresolved_blockers || []);
  requireExact(errors, 'manifest.fix_report.ledger_alignment.expected_gate_ids', expectedGateIds, ledgerAlignment.expected_gate_ids);
  requireExact(errors, 'manifest.fix_report.ledger_alignment.launch_gap_ids', expectedGateIds, ledgerAlignment.launch_gap_ids);
  requireExact(errors, 'manifest.fix_report.ledger_alignment.launch_gap_gate_ids', expectedGateIds, ledgerAlignment.launch_gap_gate_ids);
  requireExact(
    errors,
    'manifest.fix_report.ledger_alignment.owner_action_gate_ids',
    (remediationGates.ownerActionQueue || []).map((item) => item.id),
    ledgerAlignment.owner_action_gate_ids,
  );
  requireExact(
    errors,
    'manifest.fix_report.ledger_alignment.owner_handoff_gate_ids',
    (ownerHandoff.ownerActionRows || []).map((row) => row.gateId),
    ledgerAlignment.owner_handoff_gate_ids,
  );

  for (const gap of gaps) {
    const gate = completionById.get(gap.gate_id);
    const queueItem = ownerQueueById.get(gap.gate_id);
    const handoffRow = handoffByGateId.get(gap.gate_id);

    if (!gate) {
      addError(errors, 'gap_without_completion_gate', { gateId: gap.gate_id });
      continue;
    }

    requireExact(errors, `gap.${gap.gate_id}.id_matches_gate_id`, gap.gate_id, gap.id);
    requireExact(errors, `gap.${gap.gate_id}.gap`, gate.label, gap.gap);
    requireExact(errors, `gap.${gap.gate_id}.evidence`, `${COMPLETION_AUDIT_PATH}#${gap.gate_id}`, gap.evidence);
    requireExact(errors, `gap.${gap.gate_id}.needed_evidence`, gate.neededEvidence, gap.needed_evidence);
    requireExact(errors, `gap.${gap.gate_id}.buyer_impact`, gate.riskIfSkipped || gate.neededEvidence, gap.buyer_impact);
    requireExact(errors, `gap.${gap.gate_id}.owner_action`, gate.ownerAction || gate.neededEvidence, gap.owner_action);
    requireExact(errors, `gap.${gap.gate_id}.owner_prep_command`, gate.ownerPrepCommand || null, gap.owner_prep_command);
    requireExact(errors, `gap.${gap.gate_id}.next_command`, gate.nextCommand || null, gap.next_command);
    requireExact(errors, `gap.${gap.gate_id}.blocking_owner_actions`, handoffRow?.blockingOwnerActions || [], gap.blocking_owner_actions || []);

    if (queueItem) {
      requireExact(errors, `gap.${gap.gate_id}.queue_next_command`, queueItem.nextCommand || null, gap.next_command);
      requireExact(errors, `gap.${gap.gate_id}.queue_owner_prep_command`, queueItem.ownerPrepCommand || null, gap.owner_prep_command);
    }
  }
}

function validateFixReport(errors, manifest, remediationGates, ownerHandoff, commercialSummary) {
  const fixReport = manifest.fix_report || {};
  const releaseGateCommands = fixReport.release_gate_commands || {};
  const releaseGateCoverage = fixReport.release_gate_coverage || {};
  requireExact(errors, 'manifest.fix_report.owner_action_queue_count', (remediationGates.ownerActionQueue || []).length, fixReport.owner_action_queue_count);
  requireExact(
    errors,
    'manifest.fix_report.owner_prep_command_count',
    (remediationGates.ownerActionQueue || []).filter((item) => item.ownerPrepCommand).length,
    fixReport.owner_prep_command_count,
  );
  requireExact(
    errors,
    'manifest.fix_report.owner_prep_action_needed_count',
    ownerHandoff.ownerPrepReadiness?.ownerActionNeededCount ?? null,
    fixReport.owner_prep_action_needed_count,
  );
  requireExact(errors, 'manifest.fix_report.commercial_verification_summary.json', COMMERCIAL_SUMMARY_PATH, fixReport.commercial_verification_summary?.json);
  requireExact(
    errors,
    'manifest.fix_report.commercial_verification_summary.markdown',
    COMMERCIAL_SUMMARY_MARKDOWN_PATH,
    fixReport.commercial_verification_summary?.markdown,
  );

  const summaryStatus = commercialSummary.status;
  const summaryHasAcceptableStatus = summaryStatus === 'passed' || summaryStatus === 'running';
  if (!summaryHasAcceptableStatus || commercialSummary.failedStepCount !== 0) {
    addError(errors, 'commercial_summary_not_current_pass', {
      status: summaryStatus,
      failedStepCount: commercialSummary.failedStepCount,
    });
  }

  if (!fixReport.release_gate_coverage || typeof fixReport.release_gate_coverage !== 'object' || Array.isArray(fixReport.release_gate_coverage)) {
    addError(errors, 'release_gate_coverage_missing');
  } else {
    requireExact(
      errors,
      'manifest.fix_report.release_gate_coverage',
      commercialSummary.releaseGateCoverage || {},
      releaseGateCoverage,
    );

    for (const [gateId, command] of Object.entries(releaseGateCommands)) {
      if (gateId === 'boundary') continue;
      const coverage = releaseGateCoverage[gateId];
      if (!coverage || typeof coverage !== 'object' || Array.isArray(coverage)) {
        addError(errors, 'release_gate_coverage_missing_gate', { gateId });
        continue;
      }
      requireExact(errors, `release_gate_coverage.${gateId}.command`, command, coverage.command);
      if (coverage.includedInThisInvocation === false && coverage.passedInThisInvocation !== null) {
        addError(errors, 'release_gate_not_included_has_pass_status', {
          gateId,
          passedInThisInvocation: coverage.passedInThisInvocation,
        });
      }
      if (coverage.includedInThisInvocation !== true && coverage.passedInThisInvocation === true) {
        addError(errors, 'release_gate_not_included_claimed_pass', { gateId });
      }
    }

    if (!String(releaseGateCoverage.boundary || '').includes('only the steps included')) {
      addError(errors, 'release_gate_coverage_boundary_missing');
    }
  }

  [
    'No production deploys without owner approval.',
    'No payment changes or live Stripe actions without owner approval.',
    'No credential rotation performed by this repo-side verifier.',
    'No customer outreach performed by this repo-side verifier.',
  ].forEach((approvalGate) => {
    if (!Array.isArray(fixReport.approval_gates) || !fixReport.approval_gates.includes(approvalGate)) {
      addError(errors, 'missing_approval_gate', { approvalGate });
    }
  });
}

function validateSourceAudit(errors, manifest, sourceAudit) {
  const summary = manifest.fix_report?.source_audit || {};
  const expectedUrls = collectManifestSourceUrls(manifest);
  const auditedUrls = collectAuditSourceUrls(sourceAudit);
  requireExact(errors, 'manifest.fix_report.source_audit.artifact', SOURCE_AUDIT_PATH, summary.artifact);
  requireExact(errors, 'manifest.source_urls', expectedUrls, summary.current_manifest_source_urls);
  requireExact(errors, 'manifest.audited_source_urls', auditedUrls, summary.audited_source_urls);
  requireExact(errors, 'manifest.fix_report.source_audit.source_count', sourceAudit.sourceCount || 0, summary.source_count);
  requireExact(errors, 'manifest.fix_report.source_audit.passed_count', sourceAudit.passedCount || 0, summary.passed_count);
  requireExact(errors, 'manifest.fix_report.source_audit.failed_count', sourceAudit.failedCount || 0, summary.failed_count);
  requireExact(
    errors,
    'manifest.fix_report.source_audit.missing_expectation_count',
    sourceAudit.missingExpectationCount || 0,
    summary.missing_expectation_count,
  );

  if (sourceAudit.allPassed !== true || summary.all_passed !== true || summary.url_alignment_passed !== true) {
    addError(errors, 'source_audit_not_passed_or_aligned', {
      sourceAuditAllPassed: sourceAudit.allPassed,
      manifestAllPassed: summary.all_passed,
      urlAlignmentPassed: summary.url_alignment_passed,
    });
  }
  if ((summary.missing_source_urls || []).length > 0 || (summary.unexpected_source_urls || []).length > 0) {
    addError(errors, 'source_audit_url_drift_present', {
      missing: summary.missing_source_urls || [],
      unexpected: summary.unexpected_source_urls || [],
    });
  }
}

function validateCrm(errors, manifest, crmJson, crmCsvSource) {
  const crm = manifest.outreach_plan?.crm_export || {};
  const { header, rows } = parseCsv(crmCsvSource);
  requireExact(errors, 'crm_json_equals_manifest_crm_export', crm, crmJson);
  requireExact(errors, 'crm.artifact_json', CRM_JSON_PATH, crm.artifact_json);
  requireExact(errors, 'crm.artifact_csv', CRM_CSV_PATH, crm.artifact_csv);
  requireExact(errors, 'crm.schema_fields', REQUIRED_CRM_FIELDS, crm.schema_fields);
  requireExact(errors, 'crm.row_count', (manifest.target_customers || []).length, crm.row_count);
  if (crm.rowCount !== crm.row_count) {
    addError(errors, 'crm_row_count_mismatch', {
      expected: crm.row_count,
      actual: crm.rowCount,
    });
  }
  requireExact(errors, 'crm.rows.length', crm.row_count, (crm.rows || []).length);
  requireExact(errors, 'crm.csv.header', REQUIRED_CRM_FIELDS, header);
  requireExact(errors, 'crm.csv.row_count', crm.row_count, rows.length);

  (crm.rows || []).forEach((expectedRow, index) => {
    const actualRow = rows[index] || {};
    const expectedCsvRow = Object.fromEntries(REQUIRED_CRM_FIELDS.map((field) => [field, String(expectedRow[field] ?? '')]));
    if (stableJson(expectedCsvRow) !== stableJson(actualRow)) {
      addError(errors, 'crm_csv_row_mismatch', {
        index,
        expected: expectedCsvRow,
        actual: actualRow,
      });
    }
    if (expectedRow.status !== 'researched') {
      addError(errors, 'crm_row_status_not_researched', { index, status: expectedRow.status });
    }
    if (!String(expectedRow.does_not_prove || '').includes('Does not prove contact consent')) {
      addError(errors, 'crm_row_missing_claim_boundary', { index });
    }
  });
}

function validateMarkdown(errors, manifest, markdownSource) {
  [
    '# Launch Evidence Manifest',
    `Decision: \`${manifest.launch_decision}\``,
    'Validator: passed',
    'This manifest is generated from repo ledgers',
    'It is not a commercial-ready claim',
    '## Required Output Table Counts',
    '## Gaps',
    '## Source Audit',
    'URL alignment: `passed`',
    '## CRM Export Seed Rows',
    '## Proof Buckets',
    '## Fix Report',
    'Release gate coverage',
    '## Adversarial Review',
    '## Progress Updates',
    'Activities remaining',
    '### Target Matrix',
    '## Bottleneck Log',
    '## Implementation Decisions',
    '## Rejected Variants',
    '## Code Optimization Reviews',
    '## ECC Ledger',
    COMMERCIAL_SUMMARY_PATH,
    SOURCE_AUDIT_PATH,
    CRM_CSV_PATH,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_text', { expectedText });
    }
  });

  (manifest.fix_report?.unresolved_blockers || []).forEach((gateId) => {
    if (!markdownSource.includes(gateId)) {
      addError(errors, 'markdown_missing_unresolved_gate', { gateId });
    }
  });
}

function validateProgressEvidence(errors, manifest) {
  const updates = manifest.progress_updates || [];
  const bottlenecks = manifest.bottleneck_log || [];
  const expectedPhase = expectedProgressPhase(manifest);
  const latestReviewTargetTask = latestCodeOptimizationReview(manifest)?.target_task;

  if (!Array.isArray(updates) || updates.length === 0) {
    addError(errors, 'progress_updates_missing');
  }

  if (!Array.isArray(bottlenecks) || bottlenecks.length === 0) {
    addError(errors, 'bottleneck_log_missing');
  }

  for (const [index, update] of updates.entries()) {
    for (const field of [
      'phase',
      'created_at',
      'accomplished',
      'target_matrix',
      'pending',
      'activities_remaining',
      'bottleneck',
    ]) {
      if (!(field in update)) {
        addError(errors, 'progress_update_field_missing', { index, field });
      }
    }

    if (!isNonEmptyString(update.phase)) {
      addError(errors, 'progress_update_phase_missing', { index });
    } else if (expectedPhase && update.phase !== expectedPhase) {
      addError(errors, 'progress_update_phase_stale', {
        index,
        expectedPhase,
        actualPhase: update.phase,
      });
    }
    if (!isValidIsoDate(update.created_at)) {
      addError(errors, 'progress_update_created_at_invalid', { index, createdAt: update.created_at });
    }
    if (!Array.isArray(update.accomplished) || update.accomplished.length === 0) {
      addError(errors, 'progress_update_accomplished_missing', { index });
    } else if (update.accomplished.some((item) => !isNonEmptyString(item))) {
      addError(errors, 'progress_update_accomplished_item_empty', { index });
    } else if (
      isNonEmptyString(latestReviewTargetTask) &&
      !update.accomplished.some((item) => item.includes(latestReviewTargetTask))
    ) {
      addError(errors, 'progress_update_latest_review_missing', {
        index,
        targetTask: latestReviewTargetTask,
      });
    }
    if (!Array.isArray(update.pending) || update.pending.length === 0) {
      addError(errors, 'progress_update_pending_missing', { index });
    } else if (update.pending.some((item) => !isNonEmptyString(item))) {
      addError(errors, 'progress_update_pending_item_empty', { index });
    }
    if (!isNonEmptyString(update.bottleneck)) {
      addError(errors, 'progress_update_bottleneck_missing', { index });
    }

    const activitiesRemaining = update.activities_remaining;
    if (!activitiesRemaining || typeof activitiesRemaining !== 'object' || Array.isArray(activitiesRemaining)) {
      addError(errors, 'progress_activities_remaining_missing', { index });
    } else {
      for (const field of ['current_phase_actions', 'next_phase_actions', 'next_phase']) {
        if (!(field in activitiesRemaining)) {
          addError(errors, 'progress_activities_remaining_field_missing', { index, field });
        }
      }
      for (const field of ['current_phase_actions', 'next_phase_actions']) {
        if (!Number.isInteger(activitiesRemaining[field]) || activitiesRemaining[field] < 0) {
          addError(errors, 'progress_activities_remaining_count_invalid', {
            index,
            field,
            value: activitiesRemaining[field],
          });
        }
      }
      if (!isNonEmptyString(activitiesRemaining.next_phase)) {
        addError(errors, 'progress_activities_remaining_next_phase_missing', { index });
      }
    }

    if (!Array.isArray(update.target_matrix) || update.target_matrix.length !== REQUIRED_PROGRESS_LANES.length) {
      addError(errors, 'progress_target_matrix_too_short', {
        index,
        expectedMinimum: REQUIRED_PROGRESS_LANES.length,
        actual: Array.isArray(update.target_matrix) ? update.target_matrix.length : null,
      });
      continue;
    }

    const lanes = update.target_matrix.map((lane) => lane.lane);
    requireExact(errors, `progress_update.${index}.target_lanes`, REQUIRED_PROGRESS_LANES, lanes);
    const targetWeightSum = update.target_matrix.reduce((sum, lane) => sum + (Number.isFinite(lane.target_percent) ? lane.target_percent : 0), 0);
    if (targetWeightSum !== 100) {
      addError(errors, 'progress_target_matrix_weight_sum_invalid', { index, targetWeightSum });
    }

    for (const [laneIndex, lane] of update.target_matrix.entries()) {
      for (const field of ['lane', 'target_percent', 'current_percent', 'status', 'evidence', 'confidence']) {
        if (!(field in lane)) {
          addError(errors, 'progress_target_lane_field_missing', { index, laneIndex, field });
        }
      }
      const expectedWeight = REQUIRED_PROGRESS_LANE_WEIGHTS.get(lane.lane);
      if (expectedWeight !== undefined && lane.target_percent !== expectedWeight) {
        addError(errors, 'progress_target_lane_weight_mismatch', {
          index,
          laneIndex,
          lane: lane.lane,
          expected: expectedWeight,
          actual: lane.target_percent,
        });
      }
      if (!Number.isInteger(lane.current_percent) || lane.current_percent < 0 || lane.current_percent > 100) {
        addError(errors, 'progress_target_lane_current_percent_invalid', {
          index,
          laneIndex,
          lane: lane.lane,
          currentPercent: lane.current_percent,
        });
      }
      if (!ALLOWED_PROGRESS_STATUSES.has(lane.status)) {
        addError(errors, 'progress_target_lane_status_invalid', {
          index,
          laneIndex,
          lane: lane.lane,
          status: lane.status,
        });
      }
      if (!Number.isInteger(lane.confidence) || lane.confidence < 1 || lane.confidence > 5) {
        addError(errors, 'progress_target_lane_confidence_invalid', {
          index,
          laneIndex,
          lane: lane.lane,
          confidence: lane.confidence,
        });
      }
      if (!Array.isArray(lane.evidence) || lane.evidence.length === 0) {
        addError(errors, 'progress_target_lane_evidence_missing', { index, laneIndex, lane: lane.lane });
      } else if (lane.evidence.some((item) => !isNonEmptyString(item))) {
        addError(errors, 'progress_target_lane_evidence_item_empty', { index, laneIndex, lane: lane.lane });
      }
    }
  }

  for (const [index, bottleneck] of bottlenecks.entries()) {
    for (const field of ['phase', 'task_or_subtask', 'elapsed_minutes', 'last_update', 'root_cause', 'top_unblock_options']) {
      if (!(field in bottleneck)) {
        addError(errors, 'bottleneck_field_missing', { index, field });
      }
    }
    requireExact(errors, `bottleneck.${index}.root_cause`, 'evidence gap', bottleneck.root_cause);
    if (!ALLOWED_BOTTLENECK_ROOT_CAUSES.has(bottleneck.root_cause)) {
      addError(errors, 'bottleneck_root_cause_invalid', { index, rootCause: bottleneck.root_cause });
    }
    if (!isNonEmptyString(bottleneck.phase)) {
      addError(errors, 'bottleneck_phase_missing', { index });
    }
    if (!isNonEmptyString(bottleneck.task_or_subtask)) {
      addError(errors, 'bottleneck_task_missing', { index });
    }
    if (!Number.isInteger(bottleneck.elapsed_minutes) || bottleneck.elapsed_minutes < 0) {
      addError(errors, 'bottleneck_elapsed_minutes_invalid', { index, elapsedMinutes: bottleneck.elapsed_minutes });
    }
    if (!isValidIsoDate(bottleneck.last_update)) {
      addError(errors, 'bottleneck_last_update_invalid', { index, lastUpdate: bottleneck.last_update });
    }
    if (!Array.isArray(bottleneck.top_unblock_options) || bottleneck.top_unblock_options.length < 3) {
      addError(errors, 'bottleneck_unblock_options_too_short', {
        index,
        actual: Array.isArray(bottleneck.top_unblock_options) ? bottleneck.top_unblock_options.length : null,
      });
    } else if (bottleneck.top_unblock_options.some((option) => !isNonEmptyString(option))) {
      addError(errors, 'bottleneck_unblock_option_empty', { index });
    }
  }
}

function validateCodeOptimizationEvidence(errors, manifest) {
  const implementationDecisions = manifest.implementation_decisions;
  const rejectedVariants = manifest.rejected_variants;
  const codeOptimizationReviews = manifest.code_optimization_reviews;

  if (!Array.isArray(implementationDecisions) || implementationDecisions.length === 0) {
    addError(errors, 'implementation_decisions_missing');
  } else {
    for (const [index, decision] of implementationDecisions.entries()) {
      for (const field of ['decision', 'acceptance_check', 'chosen_variant', 'files_changed', 'tests_run', 'proof', 'reason']) {
        if (!(field in decision)) {
          addError(errors, 'implementation_decision_field_missing', { index, field });
        }
      }
      if (!Array.isArray(decision.files_changed) || decision.files_changed.length === 0) {
        addError(errors, 'implementation_decision_files_changed_missing', { index });
      }
      if (!Array.isArray(decision.tests_run) || decision.tests_run.length === 0) {
        addError(errors, 'implementation_decision_tests_run_missing', { index });
      }
    }
  }

  if (!Array.isArray(rejectedVariants) || rejectedVariants.length === 0) {
    addError(errors, 'rejected_variants_missing');
  } else {
    for (const [index, variant] of rejectedVariants.entries()) {
      for (const field of ['variant', 'reason_rejected', 'tradeoff', 'evidence']) {
        if (!(field in variant)) {
          addError(errors, 'rejected_variant_field_missing', { index, field });
        }
      }
    }
  }

  if (!Array.isArray(codeOptimizationReviews) || codeOptimizationReviews.length === 0) {
    addError(errors, 'code_optimization_reviews_missing');
  } else {
    for (const [index, review] of codeOptimizationReviews.entries()) {
      for (const field of ['target_task', 'policy', 'verdict', 'minimality_score', 'evidence', 'tests_or_checks']) {
        if (!(field in review)) {
          addError(errors, 'code_optimization_review_field_missing', { index, field });
        }
      }
      if (!['safe', 'strict', 'measured'].includes(review.policy)) {
        addError(errors, 'code_optimization_review_policy_invalid', { index, policy: review.policy });
      }
      if (review.verdict !== 'pass') {
        addError(errors, 'code_optimization_review_not_passed', { index, verdict: review.verdict });
      }
      if (!Number.isInteger(review.minimality_score) || review.minimality_score < 1 || review.minimality_score > 5) {
        addError(errors, 'code_optimization_review_minimality_invalid', {
          index,
          minimalityScore: review.minimality_score,
        });
      }
      if (!Array.isArray(review.tests_or_checks) || review.tests_or_checks.length === 0) {
        addError(errors, 'code_optimization_review_tests_missing', { index });
      }
    }
  }
}

function validateAdversarialReviews(errors, manifest) {
  const reviews = manifest.adversarial_reviews;
  const requiredLanes = ['launch decision', 'evidence', 'market'];

  if (!Array.isArray(reviews) || reviews.length === 0) {
    addError(errors, 'adversarial_reviews_missing');
    return;
  }

  const lanes = new Set();
  for (const [index, review] of reviews.entries()) {
    for (const field of ['lane', 'challenge', 'result']) {
      if (!(field in review) || String(review[field] || '').trim().length === 0) {
        addError(errors, 'adversarial_review_field_missing', { index, field });
      }
    }
    if (typeof review.lane === 'string' && review.lane.trim()) {
      lanes.add(review.lane);
    }
  }

  for (const lane of requiredLanes) {
    if (!lanes.has(lane)) {
      addError(errors, 'adversarial_review_required_lane_missing', { lane });
    }
  }
}

function validateProofBuckets(errors, manifest) {
  const proofBuckets = manifest.proof_buckets;
  if (!proofBuckets || typeof proofBuckets !== 'object' || Array.isArray(proofBuckets)) {
    addError(errors, 'proof_buckets_missing');
    return;
  }

  for (const bucketName of REQUIRED_PROOF_BUCKETS) {
    const items = proofBuckets[bucketName];
    if (!Array.isArray(items) || items.length === 0) {
      addError(errors, 'proof_bucket_missing_or_empty', { bucketName });
      continue;
    }

    for (const [itemIndex, item] of items.entries()) {
      for (const field of REQUIRED_PROOF_BUCKET_ITEM_FIELDS) {
        if (!isNonEmptyString(item?.[field])) {
          addError(errors, 'proof_bucket_item_field_missing', { bucketName, itemIndex, field });
        }
      }

      const boundary = String(item?.boundary || '');
      const status = String(item?.status || '');
      if (!hasDoesNotProveBoundary(boundary)) {
        addError(errors, 'proof_bucket_item_boundary_missing', { bucketName, itemIndex, label: item?.label });
      }
      if (bucketName === 'local' && !/local/i.test(boundary)) {
        addError(errors, 'proof_bucket_local_boundary_missing', { itemIndex, label: item?.label });
      }
      if (bucketName === 'candidate_shadow' && !/candidate|shadow/i.test(`${status} ${boundary}`)) {
        addError(errors, 'proof_bucket_candidate_boundary_missing', { itemIndex, label: item?.label });
      }
      if (bucketName === 'roadmap' && !/roadmap|owner|external/i.test(`${status} ${boundary}`)) {
        addError(errors, 'proof_bucket_roadmap_boundary_missing', { itemIndex, label: item?.label });
      }
    }
  }

  const repoArtifacts = proofBuckets.repo_artifact || [];
  const sourceByLabel = new Map(repoArtifacts.map((item) => [item.label, item]));
  [
    ['Remediation external gates ledger', REMEDIATION_GATES_PATH],
    ['Remediation completion audit', COMPLETION_AUDIT_PATH],
    ['Owner evidence closeout status', OWNER_CLOSEOUT_STATUS_PATH],
    ['Owner evidence handoff packet', OWNER_HANDOFF_PATH],
    ['Launch evidence source URL audit', SOURCE_AUDIT_PATH],
    ['Launch outreach CRM seed export', CRM_JSON_PATH],
  ].forEach(([label, source]) => {
    const item = sourceByLabel.get(label);
    if (!item) {
      addError(errors, 'missing_proof_bucket_item', { label, source });
      return;
    }
    requireExact(errors, `proof_bucket.${label}.source`, source, item.source);
    if (label.startsWith('Owner evidence') && !String(item.boundary || '').includes('Does not prove')) {
      addError(errors, 'proof_bucket_missing_owner_boundary', { label });
    }
  });
}

function main() {
  const manifest = readJson(LAUNCH_EVIDENCE_PATH);
  const markdownSource = read(LAUNCH_EVIDENCE_MARKDOWN_PATH);
  const crmJson = readJson(CRM_JSON_PATH);
  const crmCsvSource = read(CRM_CSV_PATH);
  const remediationGates = readJson(REMEDIATION_GATES_PATH);
  const completionAudit = readJson(COMPLETION_AUDIT_PATH);
  const closeoutStatus = exists(OWNER_CLOSEOUT_STATUS_PATH) ? readJson(OWNER_CLOSEOUT_STATUS_PATH) : { goalComplete: false };
  const ownerHandoff = exists(OWNER_HANDOFF_PATH) ? readJson(OWNER_HANDOFF_PATH) : { ownerActionRows: [] };
  const sourceAudit = readJson(SOURCE_AUDIT_PATH);
  const commercialSummary = readJson(COMMERCIAL_SUMMARY_PATH);
  const errors = [];

  validateDecisionAndScores(errors, manifest, remediationGates, completionAudit, closeoutStatus);
  validateRequiredOutputTableCounts(errors, manifest, markdownSource);
  validateGapAlignment(errors, manifest, completionAudit, remediationGates, ownerHandoff);
  validateFixReport(errors, manifest, remediationGates, ownerHandoff, commercialSummary);
  validateSourceAudit(errors, manifest, sourceAudit);
  validateCrm(errors, manifest, crmJson, crmCsvSource);
  validateMarkdown(errors, manifest, markdownSource);
  validateProgressEvidence(errors, manifest);
  validateCodeOptimizationEvidence(errors, manifest);
  validateAdversarialReviews(errors, manifest);
  validateProofBuckets(errors, manifest);

  const result = {
    ok: errors.length === 0,
    sourceManifest: LAUNCH_EVIDENCE_PATH,
    sourceMarkdown: LAUNCH_EVIDENCE_MARKDOWN_PATH,
    sourceCrmJson: CRM_JSON_PATH,
    sourceCrmCsv: CRM_CSV_PATH,
    sourceCompletionAudit: COMPLETION_AUDIT_PATH,
    sourceRemediationGates: REMEDIATION_GATES_PATH,
    sourceOwnerCloseoutStatus: OWNER_CLOSEOUT_STATUS_PATH,
    sourceOwnerHandoff: OWNER_HANDOFF_PATH,
    sourceSourceAudit: SOURCE_AUDIT_PATH,
    sourceCommercialSummary: COMMERCIAL_SUMMARY_PATH,
    launchDecision: manifest.launch_decision,
    expectedLaunchDecision: expectedLaunchDecision(remediationGates, completionAudit, closeoutStatus),
    unresolvedBlockers: manifest.fix_report?.unresolved_blockers || [],
    requiredOutputTableCounts: manifest.required_output_table_counts || null,
    crmRowCount: manifest.outreach_plan?.crm_export?.row_count || 0,
    sourceUrlCount: collectManifestSourceUrls(manifest).length,
    implementationDecisionCount: Array.isArray(manifest.implementation_decisions) ? manifest.implementation_decisions.length : 0,
    rejectedVariantCount: Array.isArray(manifest.rejected_variants) ? manifest.rejected_variants.length : 0,
    codeOptimizationReviewCount: Array.isArray(manifest.code_optimization_reviews) ? manifest.code_optimization_reviews.length : 0,
    adversarialReviewCount: Array.isArray(manifest.adversarial_reviews) ? manifest.adversarial_reviews.length : 0,
    progressUpdateCount: Array.isArray(manifest.progress_updates) ? manifest.progress_updates.length : 0,
    bottleneckLogCount: Array.isArray(manifest.bottleneck_log) ? manifest.bottleneck_log.length : 0,
    evidenceBoundary:
      'This verifier proves the generated launch evidence manifest, Markdown, CRM exports, source-audit summary, commercial verification summary pointer, and owner/remediation ledger IDs align with current repo artifacts only. It does not prove buyer willingness to pay, outreach consent or delivery, partner commitments, documented outcomes, live Stripe checkout, live MRR, manual WCAG conformance, legal compliance, production deploy state, or commercial readiness.',
    errorCount: errors.length,
    errors,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main();
