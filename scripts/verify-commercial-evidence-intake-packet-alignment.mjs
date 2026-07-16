#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_INPUT_PATH,
  MIN_ACCEPTED_DESIGN_PARTNERS,
  MIN_ACCEPTED_DOCUMENTED_OUTCOMES,
  OUTCOME_GATE_ID,
  PARTNER_GATE_ID,
  SCHEMA_VERSION as COMMERCIAL_EVIDENCE_SCHEMA_VERSION,
} from './verify-commercial-evidence-records.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = process.argv.slice(2);

function readFlagValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const root = path.resolve(readFlagValue('--root', path.resolve(__dirname, '..')));

const PACKET_JSON_PATH = 'docs/commercialization/commercial-evidence-intake-packet-latest.json';
const PACKET_MARKDOWN_PATH = 'docs/commercialization/commercial-evidence-intake-packet-latest.md';
const PACKET_CSV_PATH = 'docs/commercialization/commercial-evidence-intake-matrix-latest.csv';
const LATEST_RECORDS_PATH = 'docs/commercialization/commercial-evidence-records-latest.json';
const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const INTAKE_TEMPLATE_PATH = 'docs/commercialization/commercial-evidence-intake-template.json';
const HASHER_PATH = 'scripts/hash-owner-evidence-artifacts.mjs';
const COMPOSER_PATH = 'scripts/compose-commercial-evidence-records.mjs';
const VERIFIER_PATH = 'scripts/verify-commercial-evidence-records.mjs';
const INTAKE_SCHEMA_VERSION = '2026-06-04.apo-commercial-evidence-intake-packet.v1';
const SOURCE_TRACE_BOUNDARY =
  'This source trace maps each generated commercial-evidence intake packet provenance row to the sourceArtifacts key used by the owner worksheet. It does not read owner-held partner or outcome evidence contents, hash salts, raw proof files, private quotes, contracts, contacts, payment data, live systems, or upgrade launch readiness.';
const REQUIRED_DOES_NOT_PROVE = [
  'Partner commitments',
  'Documented outcomes',
  'Revenue',
  'Retention',
  'Causal product impact',
  'Market-wide demand',
  'Guaranteed career outcomes',
  'Legal compliance',
  'Testimonial compliance',
];
const REQUIRED_GATE_IDS = [PARTNER_GATE_ID, OUTCOME_GATE_ID];
const REQUIRED_OWNER_COMMAND_SEQUENCE = [
  'npm run generate:commercial-evidence-intake-packet',
  'npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>',
  'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
  `npm run verify:commercial-evidence-records -- --evidence ${DEFAULT_INPUT_PATH} --require-all`,
];
const REQUIRED_OFFICIAL_REFERENCE_IDS = [
  'ftc-consumer-reviews-rule-questions',
  'ftc-endorsements-reviews',
  'ftc-endorsement-guides-faq',
  'ftc-review-solicitation-guide',
];
const REQUIRED_REQUIREMENT_IDS = [
  'partner-ref',
  'proof-artifact-hashes',
  'proof-artifact-types',
  'integrity-attestations',
  'owner-evidence-archive',
  'measured-change-unit',
  'outcome-claim-scope',
  'typicality-boundary',
];
const REQUIRED_CSV_COLUMNS = [
  'record_slot',
  'record_type',
  'gate_id',
  'required_record_index',
  'requirement_id',
  'requirement_label',
  'required_value',
  'accepted_values',
  'owner_input_location',
  'review_status',
  'notes',
  'raw_evidence_policy',
  'does_not_prove',
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
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

function addError(errors, type, detail = {}) {
  errors.push({ type, ...detail });
}

function normalizeSummaryCount(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function expectedLatestRecordsSummary(latestRecords) {
  return {
    latestRecordsPath: LATEST_RECORDS_PATH,
    status: latestRecords.status || 'unknown',
    acceptedDesignPartnerCount: latestRecords.acceptedDesignPartnerCount || 0,
    acceptedOutcomeCount: latestRecords.acceptedOutcomeCount || 0,
    requiredDesignPartnerCount: normalizeSummaryCount(
      latestRecords.requiredDesignPartnerCount,
      MIN_ACCEPTED_DESIGN_PARTNERS,
    ),
    requiredOutcomeCount: normalizeSummaryCount(latestRecords.requiredOutcomeCount, MIN_ACCEPTED_DOCUMENTED_OUTCOMES),
    partnerGateSatisfied: latestRecords.partnerGateSatisfied === true,
    outcomeGateSatisfied: latestRecords.outcomeGateSatisfied === true,
  };
}

function expectedCloseoutSummary(closeoutStatus) {
  const queue = Array.isArray(closeoutStatus.ownerActionQueue) ? closeoutStatus.ownerActionQueue : [];
  return {
    closeoutStatusPath: CLOSEOUT_STATUS_PATH,
    goalComplete: closeoutStatus.goalComplete === true,
    relevantOwnerActions: queue
      .filter((item) => REQUIRED_GATE_IDS.includes(item.id))
      .map((item) => ({
        id: item.id,
        status: item.status,
        ownerAction: item.ownerAction,
        nextCommand: item.nextCommand,
      })),
  };
}

function stableJson(value) {
  return JSON.stringify(value);
}

function requireExact(errors, context, expected, actual) {
  if (stableJson(expected) !== stableJson(actual)) {
    addError(errors, 'field_mismatch', { context, expected, actual });
  }
}

function buildExpectedSourceTrace(sourceArtifacts) {
  return Object.entries(sourceArtifacts).map(([key, artifactPath]) => ({
    key,
    artifactPath,
    sourceArtifact: `${PACKET_JSON_PATH}#sourceArtifacts.${key}`,
  }));
}

function validatePacketShape(errors, packet) {
  requireExact(errors, 'packet.schemaVersion', INTAKE_SCHEMA_VERSION, packet.schemaVersion);
  requireExact(errors, 'packet.status', 'owner_commercial_evidence_required', packet.status);
  requireExact(errors, 'packet.requiredDesignPartnerCount', MIN_ACCEPTED_DESIGN_PARTNERS, packet.requiredDesignPartnerCount);
  requireExact(errors, 'packet.requiredOutcomeCount', MIN_ACCEPTED_DOCUMENTED_OUTCOMES, packet.requiredOutcomeCount);
  requireExact(errors, 'packet.requiredGateIds', REQUIRED_GATE_IDS, packet.requiredGateIds);
  requireExact(errors, 'packet.ownerCommandSequence', REQUIRED_OWNER_COMMAND_SEQUENCE, packet.ownerCommandSequence);
  requireExact(errors, 'packet.sourceSchema.commercialEvidenceRecordsSchemaVersion', COMMERCIAL_EVIDENCE_SCHEMA_VERSION, packet.sourceSchema?.commercialEvidenceRecordsSchemaVersion);
  requireExact(errors, 'packet.sourceSchema.defaultCommercialEvidenceRecordsPath', DEFAULT_INPUT_PATH, packet.sourceSchema?.defaultCommercialEvidenceRecordsPath);
  requireExact(errors, 'packet.sourceArtifacts.intakeTemplate', INTAKE_TEMPLATE_PATH, packet.sourceArtifacts?.intakeTemplate);
  requireExact(errors, 'packet.sourceArtifacts.ownerHasher', HASHER_PATH, packet.sourceArtifacts?.ownerHasher);
  requireExact(errors, 'packet.sourceArtifacts.composer', COMPOSER_PATH, packet.sourceArtifacts?.composer);
  requireExact(errors, 'packet.sourceArtifacts.verifier', VERIFIER_PATH, packet.sourceArtifacts?.verifier);
  requireExact(errors, 'packet.sourceArtifacts.latestRecords', LATEST_RECORDS_PATH, packet.sourceArtifacts?.latestRecords);
  requireExact(errors, 'packet.sourceArtifacts.closeoutStatus', CLOSEOUT_STATUS_PATH, packet.sourceArtifacts?.closeoutStatus);

  const sourceArtifacts = packet.sourceArtifacts && typeof packet.sourceArtifacts === 'object' ? packet.sourceArtifacts : {};
  const expectedPrimarySourceArtifact = sourceArtifacts.intakeTemplate;
  if (!packet.sourceArtifact) {
    addError(errors, 'packet_primary_source_artifact_missing', {
      expected: expectedPrimarySourceArtifact,
      actual: packet.sourceArtifact || null,
    });
  } else if (packet.sourceArtifact !== expectedPrimarySourceArtifact) {
    addError(errors, 'packet_primary_source_artifact_mismatch', {
      expected: expectedPrimarySourceArtifact,
      actual: packet.sourceArtifact,
    });
  }

  const expectedSourceArtifactCount = Object.keys(sourceArtifacts).length;
  if (packet.sourceArtifactCount !== expectedSourceArtifactCount) {
    addError(errors, 'packet_source_artifact_count_mismatch', {
      expected: expectedSourceArtifactCount,
      actual: packet.sourceArtifactCount,
    });
  }
  const expectedSourceTrace = buildExpectedSourceTrace(sourceArtifacts);
  if (packet.sourceTraceCount !== expectedSourceTrace.length) {
    addError(errors, 'packet_source_trace_count_mismatch', {
      expected: expectedSourceTrace.length,
      actual: packet.sourceTraceCount,
    });
  }
  if (stableJson(packet.sourceTrace || []) !== stableJson(expectedSourceTrace)) {
    addError(errors, 'packet_source_trace_mismatch', {
      expected: expectedSourceTrace,
      actual: packet.sourceTrace || [],
    });
  }
  if (packet.sourceTraceBoundary !== SOURCE_TRACE_BOUNDARY) {
    addError(errors, 'packet_source_trace_boundary_mismatch', {
      expected: SOURCE_TRACE_BOUNDARY,
      actual: packet.sourceTraceBoundary || '',
    });
  }

  requireExact(errors, 'packet.doesNotProve', REQUIRED_DOES_NOT_PROVE, packet.doesNotProve || []);
  if (packet.doesNotProveCount !== REQUIRED_DOES_NOT_PROVE.length) {
    addError(errors, 'packet_does_not_prove_count_mismatch', {
      expected: REQUIRED_DOES_NOT_PROVE.length,
      actual: packet.doesNotProveCount,
    });
  }

  requireExact(errors, 'packet.outputArtifacts.json', PACKET_JSON_PATH, packet.outputArtifacts?.json);
  requireExact(errors, 'packet.outputArtifacts.markdown', PACKET_MARKDOWN_PATH, packet.outputArtifacts?.markdown);
  requireExact(errors, 'packet.outputArtifacts.csv', PACKET_CSV_PATH, packet.outputArtifacts?.csv);

  if (typeof packet.evidenceBoundary !== 'string' || !packet.evidenceBoundary.includes('Raw partner names')) {
    addError(errors, 'missing_evidence_boundary', {
      expectedText: 'Raw partner names',
      actual: packet.evidenceBoundary || '',
    });
  }

  const officialReferenceIds = (packet.officialReferences || []).map((item) => item.id);
  requireExact(errors, 'packet.officialReferences.ids', REQUIRED_OFFICIAL_REFERENCE_IDS, officialReferenceIds);
  const expectedOfficialReferenceCount = officialReferenceIds.length;
  if (packet.officialReferenceCount !== expectedOfficialReferenceCount) {
    addError(errors, 'packet_official_reference_count_mismatch', {
      expected: expectedOfficialReferenceCount,
      actual: packet.officialReferenceCount,
    });
  }
  (packet.officialReferences || []).forEach((item) => {
    if (typeof item.url !== 'string' || !item.url.startsWith('https://www.ftc.gov/')) {
      addError(errors, 'official_reference_url_mismatch', { referenceId: item.id, url: item.url || '' });
    }
  });
}

function validateRequirementMatrix(errors, packet) {
  const matrix = Array.isArray(packet.requirementMatrix) ? packet.requirementMatrix : [];
  const slots = Array.isArray(packet.recordSlots) ? packet.recordSlots : [];
  const expectedRowCount = (MIN_ACCEPTED_DESIGN_PARTNERS * 16) + (MIN_ACCEPTED_DOCUMENTED_OUTCOMES * 19);
  const expectedSlots = [
    ...Array.from({ length: MIN_ACCEPTED_DESIGN_PARTNERS }, (_, index) => ({
      recordSlot: `partner-${index + 1}`,
      recordType: 'design_partner_commitment',
      gateId: PARTNER_GATE_ID,
      requiredRecordIndex: index,
      requirementCount: 16,
    })),
    {
      recordSlot: 'outcome-1',
      recordType: 'documented_outcome',
      gateId: OUTCOME_GATE_ID,
      requiredRecordIndex: 0,
      requirementCount: 19,
    },
  ];

  requireExact(errors, 'packet.requirementRowCount', expectedRowCount, packet.requirementRowCount);
  requireExact(errors, 'packet.requirementMatrix.length', expectedRowCount, matrix.length);
  requireExact(errors, 'packet.recordSlots', expectedSlots, slots);

  const basisCounts = [
    {
      field: 'requiredGateCount',
      expected: Array.isArray(packet.requiredGateIds) ? packet.requiredGateIds.length : 0,
      actual: packet.requiredGateCount,
      type: 'packet_required_gate_count_mismatch',
    },
    {
      field: 'recordSlotCount',
      expected: slots.length,
      actual: packet.recordSlotCount,
      type: 'packet_record_slot_count_mismatch',
    },
    {
      field: 'ownerCommandSequenceCount',
      expected: Array.isArray(packet.ownerCommandSequence) ? packet.ownerCommandSequence.length : 0,
      actual: packet.ownerCommandSequenceCount,
      type: 'packet_owner_command_sequence_count_mismatch',
    },
  ];
  basisCounts.forEach((basis) => {
    if (basis.actual !== basis.expected) {
      addError(errors, basis.type, {
        field: basis.field,
        expected: basis.expected,
        actual: basis.actual,
      });
    }
  });

  const requirementIds = new Set(matrix.map((row) => row.requirementId));
  REQUIRED_REQUIREMENT_IDS.forEach((requirementId) => {
    if (!requirementIds.has(requirementId)) {
      addError(errors, 'missing_required_requirement_id', { requirementId });
    }
  });

  matrix.forEach((row, index) => {
    if (row.reviewStatus !== 'owner_evidence_required') {
      addError(errors, 'requirement_row_status_mismatch', {
        index,
        requirementId: row.requirementId,
        expected: 'owner_evidence_required',
        actual: row.reviewStatus || '',
      });
    }
    if (typeof row.rawEvidencePolicy !== 'string' || !row.rawEvidencePolicy.includes('owner-held outside tracked files')) {
      addError(errors, 'requirement_row_raw_evidence_policy_missing', { index, requirementId: row.requirementId });
    }
    if (typeof row.doesNotProve !== 'string' || !row.doesNotProve.includes('Revenue')) {
      addError(errors, 'requirement_row_claim_boundary_missing', { index, requirementId: row.requirementId });
    }
  });
}

function validateCsv(errors, packet, csvSource) {
  const { header, rows } = parseCsv(csvSource);
  const matrix = Array.isArray(packet.requirementMatrix) ? packet.requirementMatrix : [];
  requireExact(errors, 'csv.header', REQUIRED_CSV_COLUMNS, header);
  requireExact(errors, 'csv.rowCount', matrix.length, rows.length);

  matrix.forEach((expectedRow, index) => {
    const actualRow = rows[index] || {};
    const expectedCsvRow = {
      record_slot: expectedRow.recordSlot,
      record_type: expectedRow.recordType,
      gate_id: expectedRow.gateId,
      required_record_index: String(expectedRow.requiredRecordIndex),
      requirement_id: expectedRow.requirementId,
      requirement_label: expectedRow.requirementLabel,
      required_value: expectedRow.requiredValue,
      accepted_values: expectedRow.acceptedValues,
      owner_input_location: expectedRow.ownerInputLocation,
      review_status: expectedRow.reviewStatus,
      notes: expectedRow.notes,
      raw_evidence_policy: expectedRow.rawEvidencePolicy,
      does_not_prove: expectedRow.doesNotProve,
    };
    if (stableJson(expectedCsvRow) !== stableJson(actualRow)) {
      addError(errors, 'csv_requirement_matrix_mismatch', {
        index,
        requirementId: expectedRow.requirementId,
        expected: expectedCsvRow,
        actual: actualRow,
      });
    }
  });
}

function validateMarkdown(errors, packet, markdownSource) {
  [
    '# Commercial Evidence Intake Packet',
    'owner_commercial_evidence_required',
    PACKET_CSV_PATH,
    'npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>',
    'FTC',
    'testimonial compliance',
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'markdown_missing_text', { expectedText });
    }
  });

  [
    `Primary source artifact: \`${INTAKE_TEMPLATE_PATH}\``,
    'Source artifact count: 6',
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'packet_primary_source_artifact_markdown_mismatch', { expectedText });
    }
  });
  [
    `Source trace rows: ${packet.sourceTraceCount}`,
    '## Source Trace',
    SOURCE_TRACE_BOUNDARY,
    `${PACKET_JSON_PATH}#sourceArtifacts.intakeTemplate`,
    `${PACKET_JSON_PATH}#sourceArtifacts.closeoutStatus`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'packet_source_trace_markdown_mismatch', { expectedText });
    }
  });

  if (!markdownSource.includes('Official references | 4')) {
    addError(errors, 'packet_official_reference_count_markdown_mismatch', {
      expectedText: 'Official references | 4',
    });
  }

  [
    `Required gates | ${packet.requiredGateCount}`,
    `Record slots | ${packet.recordSlotCount}`,
    `Owner command sequence | ${packet.ownerCommandSequenceCount}`,
    `Does-not-prove boundaries | ${packet.doesNotProveCount}`,
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'packet_basis_count_markdown_mismatch', { expectedText });
    }
  });

  [
    `Does-not-prove boundaries: ${packet.doesNotProveCount}`,
    '## Does Not Prove',
    ...REQUIRED_DOES_NOT_PROVE.map((item) => `- ${item}`),
  ].forEach((expectedText) => {
    if (!markdownSource.includes(expectedText)) {
      addError(errors, 'packet_does_not_prove_markdown_mismatch', { expectedText });
    }
  });
}

function main() {
  const packet = readJson(PACKET_JSON_PATH);
  const latestRecords = readJson(LATEST_RECORDS_PATH);
  const closeoutStatus = readJson(CLOSEOUT_STATUS_PATH);
  const csvSource = read(PACKET_CSV_PATH);
  const markdownSource = read(PACKET_MARKDOWN_PATH);
  const errors = [];

  validatePacketShape(errors, packet);
  validateRequirementMatrix(errors, packet);
  requireExact(errors, 'packet.latestRecordsSummary', expectedLatestRecordsSummary(latestRecords), packet.latestRecordsSummary);
  requireExact(errors, 'packet.closeoutSummary', expectedCloseoutSummary(closeoutStatus), packet.closeoutSummary);
  validateCsv(errors, packet, csvSource);
  validateMarkdown(errors, packet, markdownSource);

  const result = {
    ok: errors.length === 0,
    sourcePacket: PACKET_JSON_PATH,
    sourceCsv: PACKET_CSV_PATH,
    sourceMarkdown: PACKET_MARKDOWN_PATH,
    sourceLatestRecords: LATEST_RECORDS_PATH,
    sourceCloseoutStatus: CLOSEOUT_STATUS_PATH,
    requiredGateIds: REQUIRED_GATE_IDS,
    requiredGateCount: packet.requiredGateCount ?? null,
    recordSlotCount: packet.recordSlotCount ?? null,
    ownerCommandSequenceCount: packet.ownerCommandSequenceCount ?? null,
    doesNotProveCount: packet.doesNotProveCount ?? null,
    sourceTraceCount: packet.sourceTraceCount ?? null,
    requirementRowCount: Array.isArray(packet.requirementMatrix) ? packet.requirementMatrix.length : 0,
    csvRowCount: parseCsv(csvSource).rows.length,
    evidenceBoundary:
      'This verifier proves the generated commercial evidence intake packet, matrix CSV, and owner-facing Markdown align with the current redacted records summary and closeout status only. It does not prove partner commitments, documented outcomes, raw permission trails, testimonial compliance, revenue, retention, causality, market-wide demand, or commercial readiness.',
    errorCount: errors.length,
    errors,
  };

  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main();
