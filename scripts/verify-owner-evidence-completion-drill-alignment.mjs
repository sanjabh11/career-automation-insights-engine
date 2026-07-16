#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = process.argv.slice(2);

function readFlagValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const root = path.resolve(readFlagValue('--root', path.resolve(__dirname, '..')));

const DRILL_JSON_PATH = 'docs/commercialization/owner-evidence-completion-drill-latest.json';
const DRILL_MARKDOWN_PATH = 'docs/commercialization/owner-evidence-completion-drill-latest.md';
const DRILL_CSV_PATH = 'docs/commercialization/owner-evidence-completion-matrix-latest.csv';
const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const HANDOFF_JSON_PATH = 'docs/commercialization/owner-evidence-handoff-latest.json';
const OWNER_EVIDENCE_LOCAL_SAFETY_PATH = 'docs/commercialization/owner-evidence-local-safety-latest.json';
const OWNER_EVIDENCE_LOCAL_SAFETY_SOURCE_TRACE_BOUNDARY =
  'This local-safety source trace identifies owner-evidence-local-safety artifact anchors for git ignore, tracking, staging, error, and boundary counts. It does not read owner-held evidence file contents, load secrets, run live checks, or upgrade launch readiness.';
const COMPLETION_DRILL_SOURCE_TRACE_BOUNDARY =
  'This completion-drill source trace maps each owner-evidence completion drill provenance row to the sourceArtifacts key used by the generated drill packet. It does not execute owner commands, load credentials, collect owner-held evidence, read local evidence values, run live checks, or upgrade launch readiness.';
const MODEL_PATH = 'src/lib/commercialLaunchReadiness.ts';
const EXPECTED_SCHEMA_VERSION = '2026-06-04.apo-owner-evidence-completion-drill.v1';
const EXPECTED_FILENAME = 'owner-evidence-completion-matrix-latest.csv';
const PACKET_PATH_BY_TYPE = {
  live_proof_run: 'docs/commercialization/live-proof-run-packet-latest.json',
  commercial_evidence_intake: 'docs/commercialization/commercial-evidence-intake-packet-latest.json',
  manual_wcag_review: 'docs/commercialization/manual-wcag-review-packet-latest.json',
};
const LIVE_CLOSEOUT_TARGET_PROJECT_REF = 'kvunnankqgfokeufvsrv';
const REQUIRED_OPERATIONAL_ACCESS_COMMANDS = [
  'gh secret list --repo sanjabh11/career-automation-insights-engine',
  'supabase login',
  'supabase projects list --output json',
  `supabase functions list --project-ref ${LIVE_CLOSEOUT_TARGET_PROJECT_REF}`,
  'npm run generate:live-closeout-readiness',
  'npm run verify:live-closeout-readiness',
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function readJsonIfExists(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
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
  if (!header) return [];
  return body.map((csvRow) => {
    const record = {};
    header.forEach((column, index) => {
      record[column] = csvRow[index] || '';
    });
    return record;
  });
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item));
  return String(value || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeJoined(value) {
  return normalizeList(value).join('; ');
}

function markdownCell(value) {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

function basename(value) {
  return path.basename(String(value || ''));
}

function loadUiModel() {
  const source = read(MODEL_PATH);
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove,
    },
    fileName: MODEL_PATH,
  }).outputText;
  const module = { exports: {} };
  const context = vm.createContext({
    exports: module.exports,
    module,
    require: (specifier) => {
      throw new Error(`Unexpected runtime require in ${MODEL_PATH}: ${specifier}`);
    },
  });
  new vm.Script(transpiled, { filename: MODEL_PATH }).runInContext(context);
  return module.exports;
}

function addError(errors, type, detail) {
  errors.push({ type, ...detail });
}

function expectedLocalSafetySourceTrace(localSafety) {
  if (!localSafety) return [];
  return [
    {
      key: 'status',
      value: localSafety.ok === true ? 'passed' : 'failed',
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#ok`,
    },
    {
      key: 'protectedPathCount',
      value: String(localSafety.protectedPathCount ?? 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#protectedPathCount`,
    },
    {
      key: 'ignoredProtectedPathCount',
      value: String(localSafety.ignoredProtectedPathCount ?? 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#ignoredProtectedPathCount`,
    },
    {
      key: 'trackedSensitiveFileViolationCount',
      value: String(localSafety.trackedSensitiveFileViolations?.length || 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#trackedSensitiveFileViolations`,
    },
    {
      key: 'stagedSensitivePathViolationCount',
      value: String(localSafety.stagedSensitivePathViolations?.length || 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#stagedSensitivePathViolations`,
    },
    {
      key: 'errorCount',
      value: String(localSafety.errorCount ?? localSafety.errors?.length ?? 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#errorCount`,
    },
    {
      key: 'doesNotProveCount',
      value: String(localSafety.doesNotProveCount ?? localSafety.doesNotProve?.length ?? 0),
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#doesNotProveCount`,
    },
    {
      key: 'evidenceBoundary',
      value: localSafety.evidenceBoundary || '',
      sourceArtifact: `${OWNER_EVIDENCE_LOCAL_SAFETY_PATH}#evidenceBoundary`,
    },
  ];
}

function expectedLocalSafetyStatus(localSafety) {
  const sourceTrace = expectedLocalSafetySourceTrace(localSafety);
  if (!localSafety) {
    return {
      sourceArtifact: OWNER_EVIDENCE_LOCAL_SAFETY_PATH,
      status: 'missing_local_safety_artifact',
      ok: false,
      protectedPathCount: 0,
      ignoredProtectedPathCount: 0,
      trackedSensitiveFileViolationCount: 0,
      stagedSensitivePathViolationCount: 0,
      errorCount: 1,
      evidenceBoundary:
        'Owner-evidence local-safety status could not be read. Run npm run verify:owner-evidence-local-safety before using this completion drill.',
      doesNotProve: [
        'safe handling of owner-held local evidence paths',
        'evidence completeness',
        'commercial-ready status',
      ],
      doesNotProveCount: 3,
      sourceTraceCount: sourceTrace.length,
      sourceTrace,
      sourceTraceBoundary: OWNER_EVIDENCE_LOCAL_SAFETY_SOURCE_TRACE_BOUNDARY,
    };
  }

  return {
    sourceArtifact: OWNER_EVIDENCE_LOCAL_SAFETY_PATH,
    status: localSafety.ok === true ? 'passed' : 'failed',
    ok: localSafety.ok === true,
    protectedPathCount: localSafety.protectedPathCount ?? 0,
    ignoredProtectedPathCount: localSafety.ignoredProtectedPathCount ?? 0,
    trackedSensitiveFileViolationCount: localSafety.trackedSensitiveFileViolations?.length || 0,
    stagedSensitivePathViolationCount: localSafety.stagedSensitivePathViolations?.length || 0,
    errorCount: localSafety.errorCount ?? localSafety.errors?.length ?? 0,
    evidenceBoundary: localSafety.evidenceBoundary || '',
    doesNotProve: localSafety.doesNotProve || [],
    doesNotProveCount: localSafety.doesNotProveCount ?? localSafety.doesNotProve?.length ?? 0,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: OWNER_EVIDENCE_LOCAL_SAFETY_SOURCE_TRACE_BOUNDARY,
  };
}

function validateLocalSafetySourceTraceMarkdown(errors, markdown, expectedSafety) {
  const requiredSnippets = [
    '## Local Evidence Safety Preflight',
    `Does-not-prove boundaries: ${expectedSafety.doesNotProveCount}`,
    `Source trace rows: ${expectedSafety.sourceTraceCount}`,
    '### Local Evidence Safety Source Trace',
    `Trace boundary: ${expectedSafety.sourceTraceBoundary}`,
    '| Key | Value | Source artifact |',
  ];
  requiredSnippets.forEach((snippet) => {
    if (!markdown.includes(snippet)) {
      addError(errors, 'local_safety_source_trace_markdown_mismatch', {
        markdownPath: DRILL_MARKDOWN_PATH,
        missing: snippet,
      });
    }
  });

  (expectedSafety.sourceTrace || []).forEach((row) => {
    const expectedRow = `| ${markdownCell(row.key)} | ${markdownCell(row.value)} | ${markdownCell(row.sourceArtifact)} |`;
    if (!markdown.includes(expectedRow)) {
      addError(errors, 'local_safety_source_trace_markdown_mismatch', {
        markdownPath: DRILL_MARKDOWN_PATH,
        missing: expectedRow,
      });
    }
  });
}

function buildExpectedSourceTrace(sourceArtifacts) {
  return Object.entries(sourceArtifacts || {}).map(([key, artifactPath]) => ({
    key,
    artifactPath,
    sourceArtifact: `${DRILL_JSON_PATH}#sourceArtifacts.${key}`,
  }));
}

function validateSourceTraceMarkdown(errors, markdown, drill) {
  [
    `Source trace rows: ${drill.sourceTraceCount}`,
    '## Source Trace',
    `Trace boundary: ${COMPLETION_DRILL_SOURCE_TRACE_BOUNDARY}`,
    '| Key | Artifact | Source anchor |',
  ].forEach((snippet) => {
    if (!markdown.includes(snippet)) {
      addError(errors, 'drill_source_trace_markdown_mismatch', {
        markdownPath: DRILL_MARKDOWN_PATH,
        missing: snippet,
      });
    }
  });

  (drill.sourceTrace || []).forEach((row) => {
    const expectedRow = `| ${markdownCell(row.key)} | \`${markdownCell(row.artifactPath)}\` | \`${markdownCell(row.sourceArtifact)}\` |`;
    if (!markdown.includes(expectedRow)) {
      addError(errors, 'drill_source_trace_markdown_mismatch', {
        markdownPath: DRILL_MARKDOWN_PATH,
        missing: expectedRow,
      });
    }
  });
}

function validateDrillBasisCounts(errors, drill, markdown) {
  const basisCounts = [
    {
      field: 'recommendedCommandOrderCount',
      label: 'Recommended commands',
      expected: Array.isArray(drill.recommendedCommandOrder) ? drill.recommendedCommandOrder.length : 0,
      actual: drill.recommendedCommandOrderCount,
      type: 'drill_recommended_command_order_count_mismatch',
    },
    {
      field: 'recommendedOperationalAccessCommandCount',
      label: 'Recommended operational access commands',
      expected: Array.isArray(drill.recommendedOperationalAccessCommands)
        ? drill.recommendedOperationalAccessCommands.length
        : 0,
      actual: drill.recommendedOperationalAccessCommandCount,
      type: 'drill_recommended_operational_access_command_count_mismatch',
    },
    {
      field: 'doesNotProveCount',
      label: 'Does-not-prove boundaries',
      expected: Array.isArray(drill.doesNotProve) ? drill.doesNotProve.length : 0,
      actual: drill.doesNotProveCount,
      type: 'drill_does_not_prove_count_mismatch',
    },
    {
      field: 'ownerPrepActionNeededByGateCount',
      label: 'Owner prep by-gate maps',
      expected: drill.ownerPrepActionNeededByGate && typeof drill.ownerPrepActionNeededByGate === 'object'
        ? Object.keys(drill.ownerPrepActionNeededByGate).length
        : 0,
      actual: drill.ownerPrepActionNeededByGateCount,
      type: 'drill_owner_prep_action_needed_by_gate_count_mismatch',
    },
  ];

  basisCounts.forEach((basis) => {
    if (basis.actual !== basis.expected) {
      addError(errors, basis.type, {
        drillJson: DRILL_JSON_PATH,
        field: basis.field,
        expected: basis.expected,
        actual: basis.actual,
      });
    }
    const expectedRow = `| ${basis.label} | ${basis.actual} |`;
    if (!markdown.includes(expectedRow)) {
      addError(errors, 'drill_basis_count_markdown_mismatch', {
        markdownPath: DRILL_MARKDOWN_PATH,
        missing: expectedRow,
      });
    }
  });
}

function validateOperationalAccessCommands(errors, drill, markdown) {
  const commands = drill.recommendedOperationalAccessCommands || [];
  if (JSON.stringify(commands) !== JSON.stringify(REQUIRED_OPERATIONAL_ACCESS_COMMANDS)) {
    addError(errors, 'drill_recommended_operational_access_commands_mismatch', {
      drillJson: DRILL_JSON_PATH,
      expected: REQUIRED_OPERATIONAL_ACCESS_COMMANDS,
      actual: commands,
    });
  }

  [
    '## Recommended Operational Access Commands',
    'These commands are owner-run access probes and local status refreshes.',
    ...REQUIRED_OPERATIONAL_ACCESS_COMMANDS.map((command) => `- \`${markdownCell(command)}\``),
  ].forEach((snippet) => {
    if (!markdown.includes(snippet)) {
      addError(errors, 'drill_recommended_operational_access_command_markdown_mismatch', {
        markdownPath: DRILL_MARKDOWN_PATH,
        missing: snippet,
      });
    }
  });
}

function expectedOwnerPrepActionNeededByGate(closeoutStatus, gateIds) {
  const actionsByGate = closeoutStatus?.ownerEvidencePrep?.ownerActionNeededByGate || {};
  return Object.fromEntries(
    gateIds.map((gateId) => {
      const ownerActionNeeded = Array.isArray(actionsByGate[gateId]) ? actionsByGate[gateId] : [];
      return [
        gateId,
        {
          gateId,
          ownerActionNeededCount: ownerActionNeeded.length,
          ownerActionNeeded,
          sourceArtifact: `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate.${gateId}`,
        },
      ];
    })
  );
}

function compareField(errors, context, field, expected, actual) {
  if (expected !== actual) {
    addError(errors, 'field_mismatch', { context, field, expected, actual });
  }
}

function generatedComparable(row) {
  return {
    order: row.order,
    gateId: row.gateId,
    label: row.label,
    track: row.track,
    completionState: row.completionState,
    packetType: row.packetType,
    packetStatus: row.packetStatus,
    packetMarkdown: row.packetMarkdown,
    packetCsv: row.packetCsv,
    packetGeneratorCommand: row.packetGeneratorCommand,
    expectedProofArtifact: row.expectedProofArtifact,
    acceptedWhen: row.acceptedWhen,
    acceptanceVerifierCommand: row.acceptanceVerifierCommand,
    ownerPrepCommand: row.ownerPrepCommand || '',
    ownerAction: row.ownerAction || '',
    blockingOwnerActionCount: row.blockingOwnerActionCount,
    blockingOwnerActions: normalizeJoined(row.blockingOwnerActions),
    sourceBoundary: row.sourceBoundary,
    riskIfSkipped: row.riskIfSkipped,
    rawEvidencePolicy: row.rawEvidencePolicy,
    repoDoesNotDo: Array.isArray(row.repoDoesNotDo) ? row.repoDoesNotDo.join('; ') : String(row.repoDoesNotDo || ''),
    doesNotProve: normalizeJoined(row.doesNotProve),
  };
}

function uiComparable(row) {
  return {
    order: row.order,
    gateId: row.gateId,
    label: row.label,
    track: row.track,
    completionState: row.completionState,
    packetType: row.packetType,
    packetStatus: row.packetStatus,
    packetMarkdown: row.packetMarkdown,
    packetCsv: row.packetCsv,
    packetGeneratorCommand: row.packetGeneratorCommand,
    expectedProofArtifact: row.expectedProofArtifact,
    acceptedWhen: row.acceptedWhen,
    acceptanceVerifierCommand: row.acceptanceVerifierCommand,
    ownerPrepCommand: row.ownerPrepCommand || '',
    ownerAction: row.ownerAction || '',
    blockingOwnerActionCount: Array.isArray(row.blockingOwnerActions) ? row.blockingOwnerActions.length : 0,
    blockingOwnerActions: normalizeJoined(row.blockingOwnerActions),
    sourceBoundary: row.sourceBoundary,
    riskIfSkipped: row.riskIfSkipped,
    rawEvidencePolicy: row.rawEvidencePolicy,
    repoDoesNotDo: row.repoDoesNotDo,
    doesNotProve: normalizeJoined(row.doesNotProve),
  };
}

function csvComparable(row) {
  return {
    order: Number(row.order),
    gateId: row.gate_id,
    track: row.track,
    completionState: row.completion_state,
    packetType: row.packet_type,
    packetStatus: row.packet_status,
    packetMarkdown: row.packet_markdown,
    packetCsv: row.packet_csv,
    packetGeneratorCommand: row.packet_generator_command,
    expectedProofArtifact: row.expected_proof_artifact,
    acceptedWhen: row.accepted_when,
    acceptanceVerifierCommand: row.acceptance_verifier_command,
    ownerPrepCommand: row.owner_prep_command,
    blockingOwnerActions: normalizeJoined(row.blocking_owner_actions),
    rawEvidencePolicy: row.raw_evidence_policy,
    repoDoesNotDo: row.repo_does_not_do,
    doesNotProve: normalizeJoined(row.does_not_prove),
  };
}

function compareRows(errors, generatedRows, uiRows) {
  const generatedByGate = new Map(generatedRows.map((row) => [row.gateId, generatedComparable(row)]));
  const uiByGate = new Map(uiRows.map((row) => [row.gateId, uiComparable(row)]));
  const comparableFields = [
    'order',
    'gateId',
    'label',
    'track',
    'completionState',
    'packetType',
    'packetStatus',
    'packetMarkdown',
    'packetCsv',
    'packetGeneratorCommand',
    'expectedProofArtifact',
    'acceptedWhen',
    'acceptanceVerifierCommand',
    'ownerPrepCommand',
    'ownerAction',
    'blockingOwnerActionCount',
    'blockingOwnerActions',
    'sourceBoundary',
    'riskIfSkipped',
    'rawEvidencePolicy',
    'repoDoesNotDo',
    'doesNotProve',
  ];

  for (const [gateId, expected] of generatedByGate) {
    const actual = uiByGate.get(gateId);
    if (!actual) {
      addError(errors, 'missing_ui_completion_drill_item', { gateId });
      continue;
    }
    for (const field of comparableFields) {
      compareField(errors, `row:${gateId}`, field, expected[field], actual[field]);
    }
  }

  const generatedGateIds = new Set(generatedByGate.keys());
  for (const actual of uiRows) {
    if (!generatedGateIds.has(actual.gateId)) {
      addError(errors, 'extra_ui_completion_drill_item', { gateId: actual.gateId });
    }
  }
}

function compareUiCsv(errors, uiCsvRows, uiItems) {
  const csvByGate = new Map(uiCsvRows.map((row) => [row.gateId, row]));
  const uiByGate = new Map(uiItems.map((row) => [row.gateId, uiComparable(row)]));
  const fields = [
    'order',
    'gateId',
    'track',
    'completionState',
    'packetType',
    'packetStatus',
    'packetMarkdown',
    'packetCsv',
    'packetGeneratorCommand',
    'expectedProofArtifact',
    'acceptedWhen',
    'acceptanceVerifierCommand',
    'ownerPrepCommand',
    'blockingOwnerActions',
    'rawEvidencePolicy',
    'repoDoesNotDo',
    'doesNotProve',
  ];

  for (const [gateId, expected] of uiByGate) {
    const actual = csvByGate.get(gateId);
    if (!actual) {
      addError(errors, 'missing_ui_csv_row', { gateId });
      continue;
    }
    for (const field of fields) {
      compareField(errors, `ui_csv:${gateId}`, field, expected[field], actual[field]);
    }
  }
}

function officialReferenceComparable(packet) {
  const officialReferences = Array.isArray(packet?.officialReferences) ? packet.officialReferences : [];
  return {
    count: officialReferences.length,
    ids: officialReferences.map((reference) => reference.id).filter(Boolean),
    urls: officialReferences.map((reference) => reference.url).filter(Boolean),
  };
}

function validatePacketOfficialReferences(errors, drill) {
  const packetSummaries = Array.isArray(drill.packetSummaries) ? drill.packetSummaries : [];
  if (packetSummaries.length === 0) {
    addError(errors, 'missing_packet_summaries', { sourceDrillJson: DRILL_JSON_PATH });
    return;
  }

  const packetSummaryByType = new Map(packetSummaries.map((packet) => [packet.packetType, packet]));
  const distinctUrls = [];

  Object.entries(PACKET_PATH_BY_TYPE).forEach(([packetType, packetPath]) => {
    const summary = packetSummaryByType.get(packetType);
    if (!summary) {
      addError(errors, 'missing_packet_summary', { packetType });
      return;
    }
    compareField(errors, `packet:${packetType}`, 'json', packetPath, summary.json);

    const packet = readJsonIfExists(packetPath);
    if (!packet) {
      addError(errors, 'missing_packet_artifact', { packetType, packetPath });
      return;
    }

    const officialReferences = officialReferenceComparable(packet);
    if (officialReferences.count === 0) {
      addError(errors, 'packet_missing_official_references', { packetType, packetPath });
    }
    if (officialReferences.urls.length !== officialReferences.count) {
      addError(errors, 'packet_official_reference_missing_url', {
        packetType,
        packetPath,
        officialReferenceCount: officialReferences.count,
        officialReferenceUrlCount: officialReferences.urls.length,
      });
    }

    compareField(
      errors,
      `packet:${packetType}`,
      'officialReferenceCount',
      officialReferences.count,
      summary.officialReferenceCount,
    );
    compareField(
      errors,
      `packet:${packetType}`,
      'officialReferenceIds',
      JSON.stringify(officialReferences.ids),
      JSON.stringify(summary.officialReferenceIds || []),
    );
    compareField(
      errors,
      `packet:${packetType}`,
      'officialReferenceUrls',
      JSON.stringify(officialReferences.urls),
      JSON.stringify(summary.officialReferenceUrls || []),
    );

    distinctUrls.push(...officialReferences.urls);
  });

  const expectedOfficialReferenceUrls = [...new Set(distinctUrls)].sort((a, b) => a.localeCompare(b));
  compareField(
    errors,
    'drill',
    'officialReferenceCount',
    expectedOfficialReferenceUrls.length,
    drill.officialReferenceCount,
  );
  compareField(
    errors,
    'drill',
    'officialReferenceUrls',
    JSON.stringify(expectedOfficialReferenceUrls),
    JSON.stringify(drill.officialReferenceUrls || []),
  );
}

function main() {
  const drill = readJson(DRILL_JSON_PATH);
  const drillMarkdown = read(DRILL_MARKDOWN_PATH);
  const generatedCsvRows = parseCsv(read(DRILL_CSV_PATH));
  const closeoutStatus = readJsonIfExists(CLOSEOUT_STATUS_PATH);
  const handoff = readJsonIfExists(HANDOFF_JSON_PATH);
  const localSafety = readJsonIfExists(OWNER_EVIDENCE_LOCAL_SAFETY_PATH);
  const uiModel = loadUiModel();
  const uiSummary = uiModel.ownerEvidenceCompletionDrillSummary;
  const uiItems = uiModel.ownerEvidenceCompletionDrillItems || [];
  const uiCsvRows = parseCsv(`${uiModel.buildOwnerEvidenceCompletionDrillCsv()}\n`).map(csvComparable);
  const errors = [];

  if (!Array.isArray(drill.completionRows) || drill.completionRows.length === 0) {
    addError(errors, 'missing_completion_rows', { sourceDrillJson: DRILL_JSON_PATH });
  }

  compareField(errors, 'drill', 'schemaVersion', EXPECTED_SCHEMA_VERSION, drill.schemaVersion);
  compareField(errors, 'ui.filename', 'OWNER_EVIDENCE_COMPLETION_DRILL_FILENAME', EXPECTED_FILENAME, uiModel.OWNER_EVIDENCE_COMPLETION_DRILL_FILENAME);
  compareField(errors, 'ui.filename', 'generatedOutputCsvBasename', basename(drill.outputArtifacts?.csv), uiModel.OWNER_EVIDENCE_COMPLETION_DRILL_FILENAME);
  compareField(errors, 'summary', 'status', drill.status, uiSummary?.status);
  compareField(errors, 'summary', 'goalComplete', drill.goalComplete, uiSummary?.goalComplete);
  compareField(errors, 'summary', 'requiredGateCount', drill.requiredGateCount, uiSummary?.requiredGateCount);
  compareField(errors, 'summary', 'blockedGateCount', drill.blockedGateCount, uiSummary?.blockedGateCount);
  compareField(errors, 'summary', 'ownerActionNeededCount', drill.ownerActionNeededCount, uiSummary?.ownerActionNeededCount);
  compareField(errors, 'summary', 'matrixRowCount', drill.matrixRowCount, uiSummary?.matrixRowCount);
  compareField(errors, 'rowCount', 'generatedJsonRows', drill.completionRows?.length || 0, uiItems.length);
  compareField(errors, 'rowCount', 'generatedCsvRows', generatedCsvRows.length, uiItems.length);
  compareField(errors, 'rowCount', 'uiCsvRows', uiCsvRows.length, uiItems.length);
  compareField(
    errors,
    'drill.sourceArtifacts',
    'closeoutStatus',
    CLOSEOUT_STATUS_PATH,
    drill.sourceArtifacts?.closeoutStatus,
  );
  compareField(
    errors,
    'drill.sourceArtifacts',
    'handoff',
    HANDOFF_JSON_PATH,
    drill.sourceArtifacts?.handoff,
  );
  compareField(
    errors,
    'drill.sourceArtifacts',
    'ownerEvidenceLocalSafety',
    OWNER_EVIDENCE_LOCAL_SAFETY_PATH,
    drill.sourceArtifacts?.ownerEvidenceLocalSafety,
  );
  const expectedPrimarySourceArtifact = drill.sourceArtifacts?.handoff;
  if (!drill.sourceArtifact) {
    addError(errors, 'drill_primary_source_artifact_missing', {
      drillJson: DRILL_JSON_PATH,
      expected: expectedPrimarySourceArtifact,
      actual: drill.sourceArtifact,
    });
  } else if (drill.sourceArtifact !== expectedPrimarySourceArtifact) {
    addError(errors, 'drill_primary_source_artifact_mismatch', {
      drillJson: DRILL_JSON_PATH,
      expected: expectedPrimarySourceArtifact,
      actual: drill.sourceArtifact,
    });
  }
  const expectedSourceArtifactCount = Object.keys(drill.sourceArtifacts || {}).length;
  if (drill.sourceArtifactCount !== expectedSourceArtifactCount) {
    addError(errors, 'drill_source_artifact_count_mismatch', {
      drillJson: DRILL_JSON_PATH,
      expected: expectedSourceArtifactCount,
      actual: drill.sourceArtifactCount,
    });
  }
  const expectedSourceTrace = buildExpectedSourceTrace(drill.sourceArtifacts);
  if (drill.sourceTraceCount !== expectedSourceTrace.length) {
    addError(errors, 'drill_source_trace_count_mismatch', {
      drillJson: DRILL_JSON_PATH,
      expected: expectedSourceTrace.length,
      actual: drill.sourceTraceCount,
    });
  }
  if (JSON.stringify(drill.sourceTrace || null) !== JSON.stringify(expectedSourceTrace)) {
    addError(errors, 'drill_source_trace_mismatch', {
      drillJson: DRILL_JSON_PATH,
      expected: expectedSourceTrace,
      actual: drill.sourceTrace || null,
    });
  }
  if (drill.sourceTraceBoundary !== COMPLETION_DRILL_SOURCE_TRACE_BOUNDARY) {
    addError(errors, 'drill_source_trace_boundary_mismatch', {
      drillJson: DRILL_JSON_PATH,
      expected: COMPLETION_DRILL_SOURCE_TRACE_BOUNDARY,
      actual: drill.sourceTraceBoundary,
    });
  }
  validateSourceTraceMarkdown(errors, drillMarkdown, drill);
  if (drill.sourceArtifact) {
    [
      `Primary source artifact: \`${drill.sourceArtifact}\``,
      `Source artifact count: ${drill.sourceArtifactCount}`,
    ].forEach((snippet) => {
      if (!drillMarkdown.includes(snippet)) {
        addError(errors, 'drill_primary_source_artifact_markdown_mismatch', {
          markdownPath: DRILL_MARKDOWN_PATH,
          missing: snippet,
        });
      }
    });
  }
  validateDrillBasisCounts(errors, drill, drillMarkdown);
  validateOperationalAccessCommands(errors, drill, drillMarkdown);

  const expectedSafety = expectedLocalSafetyStatus(localSafety);
  if (JSON.stringify(expectedSafety) !== JSON.stringify(drill.localSafetyStatus || null)) {
    addError(errors, 'local_safety_status_mismatch', {
      expected: expectedSafety,
      actual: drill.localSafetyStatus || null,
    });
  }
  validateLocalSafetySourceTraceMarkdown(errors, drillMarkdown, expectedSafety);
  if (JSON.stringify(expectedSafety) !== JSON.stringify(uiModel.ownerEvidenceLocalSafetySummary || null)) {
    addError(errors, 'ui_local_safety_status_mismatch', {
      expected: expectedSafety,
      actual: uiModel.ownerEvidenceLocalSafetySummary || null,
    });
  }

  if (!closeoutStatus) {
    addError(errors, 'missing_closeout_status', { closeoutStatusPath: CLOSEOUT_STATUS_PATH });
  } else {
    compareField(
      errors,
      'drill',
      'ownerPrepActionNeededByGateSourceArtifact',
      `${CLOSEOUT_STATUS_PATH}#ownerEvidencePrep.ownerActionNeededByGate`,
      drill.ownerPrepActionNeededByGateSourceArtifact,
    );
    if (!drill.ownerPrepActionNeededByGateBoundary) {
      addError(errors, 'owner_prep_action_needed_by_gate_boundary_missing', {
        drillJson: DRILL_JSON_PATH,
      });
    }
    const expectedOwnerPrepByGate = expectedOwnerPrepActionNeededByGate(closeoutStatus, drill.requiredGateIds || []);
    if (JSON.stringify(expectedOwnerPrepByGate) !== JSON.stringify(drill.ownerPrepActionNeededByGate || {})) {
      addError(errors, 'owner_prep_action_needed_by_gate_mismatch', {
        expected: expectedOwnerPrepByGate,
        actual: drill.ownerPrepActionNeededByGate || {},
      });
    }
    compareField(
      errors,
      'drill',
      'ownerPrepActionNeededByGateCount',
      Object.keys(expectedOwnerPrepByGate).length,
      drill.ownerPrepActionNeededByGateCount,
    );
    if (handoff) {
      if (JSON.stringify(expectedOwnerPrepByGate) !== JSON.stringify(handoff.ownerPrepActionNeededByGate || {})) {
        addError(errors, 'handoff_owner_prep_action_needed_by_gate_mismatch', {
          expected: expectedOwnerPrepByGate,
          actual: handoff.ownerPrepActionNeededByGate || {},
        });
      }
      compareField(
        errors,
        'handoff',
        'ownerPrepActionNeededByGateCount',
        Object.keys(expectedOwnerPrepByGate).length,
        handoff.ownerPrepActionNeededByGateCount,
      );
    }
  }

  compareRows(errors, drill.completionRows || [], uiItems);
  compareUiCsv(errors, uiCsvRows, uiItems);
  validatePacketOfficialReferences(errors, drill);

  const generatedCsvGateIds = generatedCsvRows.map((row) => row.gate_id);
  const generatedJsonGateIds = (drill.completionRows || []).map((row) => row.gateId);
  if (JSON.stringify(generatedCsvGateIds) !== JSON.stringify(generatedJsonGateIds)) {
    addError(errors, 'generated_csv_json_gate_order_mismatch', {
      expected: generatedJsonGateIds,
      actual: generatedCsvGateIds,
    });
  }

  const result = {
    ok: errors.length === 0,
    sourceDrillJson: DRILL_JSON_PATH,
    sourceDrillCsv: DRILL_CSV_PATH,
    uiModel: MODEL_PATH,
    schemaVersion: drill.schemaVersion,
    status: drill.status,
    goalComplete: drill.goalComplete,
    generatedRowCount: drill.completionRows?.length || 0,
    generatedCsvRowCount: generatedCsvRows.length,
    uiRowCount: uiItems.length,
    uiCsvRowCount: uiCsvRows.length,
    uiLocalSafetyStatus: uiModel.ownerEvidenceLocalSafetySummary?.status || null,
    ownerPrepActionNeededByGateCount: drill.ownerPrepActionNeededByGateCount ?? null,
    officialReferenceCount: drill.officialReferenceCount ?? null,
    recommendedCommandOrderCount: drill.recommendedCommandOrderCount ?? null,
    recommendedOperationalAccessCommandCount: drill.recommendedOperationalAccessCommandCount ?? null,
    doesNotProveCount: drill.doesNotProveCount ?? null,
    gateIds: generatedJsonGateIds,
    alignmentBoundary:
      'This verifier proves the Trust Center completion-drill model and CSV export mirror the generated owner-evidence completion drill artifact. It does not prove live checkout, live MRR, production calibration, authenticated live artifacts, partner commitments, documented outcomes, manual WCAG conformance, or commercial readiness.',
    errors,
  };

  console.log(JSON.stringify(result, null, 2));
  if (errors.length) process.exitCode = 1;
}

main();
