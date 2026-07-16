#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERIFIER_SCRIPT = path.join(__dirname, 'verify-commercial-evidence-intake-packet-alignment.mjs');

const PACKET_JSON_PATH = 'docs/commercialization/commercial-evidence-intake-packet-latest.json';
const PACKET_MARKDOWN_PATH = 'docs/commercialization/commercial-evidence-intake-packet-latest.md';
const PACKET_CSV_PATH = 'docs/commercialization/commercial-evidence-intake-matrix-latest.csv';
const LATEST_RECORDS_PATH = 'docs/commercialization/commercial-evidence-records-latest.json';
const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const PARTNER_GATE_ID = 'three_committed_partners';
const OUTCOME_GATE_ID = 'documented_outcomes';
const REQUIRED_GATE_IDS = [PARTNER_GATE_ID, OUTCOME_GATE_ID];
const SOURCE_TRACE_BOUNDARY =
  'This source trace maps each generated commercial-evidence intake packet provenance row to the sourceArtifacts key used by the owner worksheet. It does not read owner-held partner or outcome evidence contents, hash salts, raw proof files, private quotes, contracts, contacts, payment data, live systems, or upgrade launch readiness.';
const DOES_NOT_PROVE = [
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
const OWNER_COMMAND_SEQUENCE = [
  'npm run generate:commercial-evidence-intake-packet',
  'npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>',
  'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
  'npm run verify:commercial-evidence-records -- --evidence docs/commercialization/commercial-evidence-records.local.json --require-all',
];
const CSV_COLUMNS = [
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
const PARTNER_REQUIREMENT_IDS = [
  'partner-ref',
  'segment',
  'committed-at',
  'permissioned',
  'contact-permission',
  'pilot-scope-accepted',
  'planning-only-use-confirmed',
  'artifact-reviewed',
  'next-step-recorded',
  'proof-artifact-hashes',
  'proof-artifact-types',
  'raw-evidence-owner-held',
  'redaction-level',
  'integrity-attestations',
  'owner-evidence-archive',
  'does-not-prove',
];
const OUTCOME_REQUIREMENT_IDS = [
  'outcome-ref',
  'observed-at',
  'permissioned',
  'baseline-workflow-captured',
  'artifact-reviewed',
  'measured-change-captured',
  'approved-quote-captured',
  'quote-approval-captured',
  'measured-change-unit',
  'measurement-window',
  'outcome-claim-scope',
  'typicality-boundary',
  'proof-artifact-hashes',
  'proof-artifact-types',
  'raw-evidence-owner-held',
  'redaction-level',
  'integrity-attestations',
  'owner-evidence-archive',
  'does-not-prove',
];

function writeJson(root, relativePath, value) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function requirementRow(recordSlot, recordType, gateId, requiredRecordIndex, requirementId) {
  return {
    recordSlot,
    recordType,
    gateId,
    requiredRecordIndex,
    requirementId,
    requirementLabel: `${requirementId} label`,
    requiredValue: `${requirementId} required value`,
    acceptedValues: requirementId === 'proof-artifact-types' ? 'accepted artifact types' : '',
    ownerInputLocation:
      recordType === 'design_partner_commitment'
        ? `designPartnerCommitments[].${requirementId}`
        : `documentedOutcomes[].${requirementId}`,
    reviewStatus: 'owner_evidence_required',
    notes: `${requirementId} owner-held evidence note.`,
    rawEvidencePolicy:
      'Keep raw names, contacts, contracts, notes, private quotes, customer data, proof artifacts, and hash salts owner-held outside tracked files.',
    doesNotProve:
      'Revenue; retention; causal product impact; market-wide demand; guaranteed career outcomes; legal compliance; testimonial compliance review',
  };
}

function requirementMatrix() {
  const partnerRows = Array.from({ length: 3 }, (_, slotIndex) =>
    PARTNER_REQUIREMENT_IDS.map((requirementId) =>
      requirementRow(
        `partner-${slotIndex + 1}`,
        'design_partner_commitment',
        PARTNER_GATE_ID,
        slotIndex,
        requirementId,
      ),
    ),
  ).flat();
  const outcomeRows = OUTCOME_REQUIREMENT_IDS.map((requirementId) =>
    requirementRow('outcome-1', 'documented_outcome', OUTCOME_GATE_ID, 0, requirementId),
  );
  return [...partnerRows, ...outcomeRows];
}

function recordSlots() {
  return [
    ...Array.from({ length: 3 }, (_, index) => ({
      recordSlot: `partner-${index + 1}`,
      recordType: 'design_partner_commitment',
      gateId: PARTNER_GATE_ID,
      requiredRecordIndex: index,
      requirementCount: PARTNER_REQUIREMENT_IDS.length,
    })),
    {
      recordSlot: 'outcome-1',
      recordType: 'documented_outcome',
      gateId: OUTCOME_GATE_ID,
      requiredRecordIndex: 0,
      requirementCount: OUTCOME_REQUIREMENT_IDS.length,
    },
  ];
}

function latestRecords() {
  return {
    generatedAt: '2026-06-05T00:00:00.000Z',
    schemaVersion: '2026-06-01.apo-commercial-evidence-records.v1',
    status: 'no_local_evidence',
    acceptedDesignPartnerCount: 0,
    acceptedOutcomeCount: 0,
    requiredDesignPartnerCount: 3,
    requiredOutcomeCount: 1,
    partnerGateSatisfied: false,
    outcomeGateSatisfied: false,
  };
}

function closeoutStatus() {
  return {
    generatedAt: '2026-06-05T00:00:00.000Z',
    schemaVersion: '2026-06-04.apo-owner-evidence-closeout-status.v1',
    goalComplete: false,
    ownerActionQueue: [
      {
        id: PARTNER_GATE_ID,
        status: 'blocked_missing_owner_evidence_records',
        ownerAction: 'Collect three permissioned design-partner commitments with owner-held proof.',
        nextCommand:
          'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
      },
      {
        id: OUTCOME_GATE_ID,
        status: 'blocked_missing_owner_evidence_records',
        ownerAction: 'Collect one permissioned documented outcome with bounded measurement proof.',
        nextCommand:
          'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
      },
    ],
  };
}

function closeoutSummary(status = closeoutStatus()) {
  return {
    closeoutStatusPath: CLOSEOUT_STATUS_PATH,
    goalComplete: status.goalComplete === true,
    relevantOwnerActions: status.ownerActionQueue.map((item) => ({
      id: item.id,
      status: item.status,
      ownerAction: item.ownerAction,
      nextCommand: item.nextCommand,
    })),
  };
}

function buildSourceArtifacts() {
  return {
    intakeTemplate: 'docs/commercialization/commercial-evidence-intake-template.json',
    ownerHasher: 'scripts/hash-owner-evidence-artifacts.mjs',
    composer: 'scripts/compose-commercial-evidence-records.mjs',
    verifier: 'scripts/verify-commercial-evidence-records.mjs',
    latestRecords: LATEST_RECORDS_PATH,
    closeoutStatus: CLOSEOUT_STATUS_PATH,
  };
}

function buildSourceTrace(sourceArtifacts) {
  return Object.entries(sourceArtifacts).map(([key, artifactPath]) => ({
    key,
    artifactPath,
    sourceArtifact: `${PACKET_JSON_PATH}#sourceArtifacts.${key}`,
  }));
}

function packet(records = latestRecords(), status = closeoutStatus()) {
  const matrix = requirementMatrix();
  const sourceArtifacts = buildSourceArtifacts();
  const sourceTrace = buildSourceTrace(sourceArtifacts);
  return {
    generatedAt: '2026-06-05T00:00:00.000Z',
    schemaVersion: '2026-06-04.apo-commercial-evidence-intake-packet.v1',
    status: 'owner_commercial_evidence_required',
    requiredDesignPartnerCount: 3,
    requiredOutcomeCount: 1,
    requirementRowCount: matrix.length,
    requiredGateCount: REQUIRED_GATE_IDS.length,
    recordSlotCount: recordSlots().length,
    ownerCommandSequenceCount: OWNER_COMMAND_SEQUENCE.length,
    doesNotProveCount: DOES_NOT_PROVE.length,
    requiredGateIds: [...REQUIRED_GATE_IDS],
    officialReferences: [
      {
        id: 'ftc-consumer-reviews-rule-questions',
        label: 'FTC Consumer Reviews and Testimonials Rule questions',
        url: 'https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers',
        appliesTo: ['review/testimonial rule awareness'],
      },
      {
        id: 'ftc-endorsements-reviews',
        label: 'FTC endorsements, influencers, and reviews',
        url: 'https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews',
        appliesTo: ['quote approval'],
      },
      {
        id: 'ftc-endorsement-guides-faq',
        label: 'FTC Endorsement Guides: What People Are Asking',
        url: 'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking',
        appliesTo: ['honest endorsement handling'],
      },
      {
        id: 'ftc-review-solicitation-guide',
        label: 'FTC soliciting and paying for online reviews guide',
        url: 'https://www.ftc.gov/business-guidance/resources/soliciting-paying-online-reviews-guide-marketers',
        appliesTo: ['review solicitation integrity'],
      },
    ],
    officialReferenceCount: 4,
    sourceArtifacts,
    sourceArtifact: 'docs/commercialization/commercial-evidence-intake-template.json',
    sourceArtifactCount: 6,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_TRACE_BOUNDARY,
    outputArtifacts: {
      json: PACKET_JSON_PATH,
      markdown: PACKET_MARKDOWN_PATH,
      csv: PACKET_CSV_PATH,
    },
    evidenceBoundary:
      'This packet is an owner-intake worksheet only. Raw partner names, contact details, contracts, private notes, private quotes, customer data, proof artifacts, material-connection reviews, incentive reviews, typicality substantiation, approval trails, and hash salts must remain owner-held outside tracked files. The packet does not prove partner commitments, documented outcomes, revenue, retention, causality, market-wide demand, guaranteed career outcomes, legal compliance, or testimonial compliance.',
    doesNotProve: [...DOES_NOT_PROVE],
    latestRecordsSummary: {
      latestRecordsPath: LATEST_RECORDS_PATH,
      status: records.status,
      acceptedDesignPartnerCount: records.acceptedDesignPartnerCount,
      acceptedOutcomeCount: records.acceptedOutcomeCount,
      requiredDesignPartnerCount: records.requiredDesignPartnerCount,
      requiredOutcomeCount: records.requiredOutcomeCount,
      partnerGateSatisfied: records.partnerGateSatisfied,
      outcomeGateSatisfied: records.outcomeGateSatisfied,
    },
    closeoutSummary: closeoutSummary(status),
    recordSlots: recordSlots(),
    requirementMatrix: matrix,
    ownerCommandSequence: [...OWNER_COMMAND_SEQUENCE],
    sourceSchema: {
      commercialEvidenceRecordsSchemaVersion: '2026-06-01.apo-commercial-evidence-records.v1',
      defaultCommercialEvidenceRecordsPath: 'docs/commercialization/commercial-evidence-records.local.json',
    },
  };
}

function renderCsv(value) {
  const rows = value.requirementMatrix.map((row) =>
    [
      row.recordSlot,
      row.recordType,
      row.gateId,
      row.requiredRecordIndex,
      row.requirementId,
      row.requirementLabel,
      row.requiredValue,
      row.acceptedValues,
      row.ownerInputLocation,
      row.reviewStatus,
      row.notes,
      row.rawEvidencePolicy,
      row.doesNotProve,
    ].map(csvCell).join(','),
  );
  return `${CSV_COLUMNS.map(csvCell).join(',')}\n${rows.join('\n')}\n`;
}

function renderMarkdown(value) {
  const sourceTraceRows = value.sourceTrace
    .map((row) => `| ${row.key} | ${row.artifactPath} | ${row.sourceArtifact} |`)
    .join('\n');
  return `# Commercial Evidence Intake Packet

Status: \`${value.status}\`

Primary source artifact: \`${value.sourceArtifact}\`

Source artifact count: ${value.sourceArtifactCount}

Source trace rows: ${value.sourceTraceCount}

Does-not-prove boundaries: ${value.doesNotProveCount}

## Does Not Prove

${value.doesNotProve.map((item) => `- ${item}`).join('\n')}

## Source Trace

${value.sourceTraceBoundary}

| Key | Artifact | Source anchor |
| --- | --- | --- |
${sourceTraceRows}

Required gates | ${value.requiredGateCount}

Record slots | ${value.recordSlotCount}

Owner command sequence | ${value.ownerCommandSequenceCount}

Does-not-prove boundaries | ${value.doesNotProveCount}

Official references | ${value.officialReferenceCount}

Use the CSV companion for worksheet execution: \`${PACKET_CSV_PATH}\`.

## Owner Command Sequence

- \`npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>\`

## Official Reference Basis

FTC reference basis for testimonial compliance.
`;
}

function writeBaseArtifacts(root) {
  const records = latestRecords();
  const status = closeoutStatus();
  const value = packet(records, status);
  writeJson(root, LATEST_RECORDS_PATH, records);
  writeJson(root, CLOSEOUT_STATUS_PATH, status);
  writeJson(root, PACKET_JSON_PATH, value);
  fs.mkdirSync(path.dirname(path.join(root, PACKET_CSV_PATH)), { recursive: true });
  fs.writeFileSync(path.join(root, PACKET_CSV_PATH), renderCsv(value));
  fs.writeFileSync(path.join(root, PACKET_MARKDOWN_PATH), renderMarkdown(value));
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `apo-commercial-evidence-intake-${name}-`));
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
    name: 'aligned-commercial-evidence-intake-packet-pass',
    expectedCode: 0,
    expectedText: '"ok": true',
    mutate() {},
  },
  {
    name: 'required-gates-mismatch-fails',
    expectedCode: 1,
    expectedText: 'packet.requiredGateIds',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.requiredGateIds = [PARTNER_GATE_ID];
      });
    },
  },
  {
    name: 'requirement-row-count-mismatch-fails',
    expectedCode: 1,
    expectedText: 'packet.requirementMatrix.length',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.requirementMatrix.pop();
      });
    },
  },
  {
    name: 'required-gate-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_required_gate_count_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.requiredGateCount += 1;
      });
    },
  },
  {
    name: 'record-slot-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_record_slot_count_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.recordSlotCount += 1;
      });
    },
  },
  {
    name: 'owner-command-sequence-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_owner_command_sequence_count_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.ownerCommandSequenceCount += 1;
      });
    },
  },
  {
    name: 'packet-does-not-prove-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_does_not_prove_count_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.doesNotProveCount += 1;
      });
    },
  },
  {
    name: 'packet-basis-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_basis_count_markdown_mismatch',
    mutate(root) {
      updateText(root, PACKET_MARKDOWN_PATH, (source) => source.replace('Record slots | 4', 'Record slots | 3'));
    },
  },
  {
    name: 'latest-records-summary-drift-fails',
    expectedCode: 1,
    expectedText: 'packet.latestRecordsSummary',
    mutate(root) {
      updateJson(root, LATEST_RECORDS_PATH, (value) => {
        value.acceptedDesignPartnerCount = 2;
      });
    },
  },
  {
    name: 'closeout-owner-action-drift-fails',
    expectedCode: 1,
    expectedText: 'packet.closeoutSummary',
    mutate(root) {
      updateJson(root, CLOSEOUT_STATUS_PATH, (value) => {
        value.ownerActionQueue[1].nextCommand = 'npm run verify:commercial-evidence-records --wrong';
      });
    },
  },
  {
    name: 'csv-matrix-drift-fails',
    expectedCode: 1,
    expectedText: 'csv_requirement_matrix_mismatch',
    mutate(root) {
      updateText(root, PACKET_CSV_PATH, (source) => source.replace('owner_evidence_required', 'review_complete'));
    },
  },
  {
    name: 'owner-command-sequence-drift-fails',
    expectedCode: 1,
    expectedText: 'packet.ownerCommandSequence',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.ownerCommandSequence[2] = 'npm run compose:commercial-evidence-records -- --write';
      });
    },
  },
  {
    name: 'packet-primary-source-artifact-missing-fails',
    expectedCode: 1,
    expectedText: 'packet_primary_source_artifact_missing',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        delete value.sourceArtifact;
      });
    },
  },
  {
    name: 'packet-primary-source-artifact-stale-fails',
    expectedCode: 1,
    expectedText: 'packet_primary_source_artifact_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.sourceArtifact = 'docs/commercialization/commercial-evidence-records-latest.json';
      });
    },
  },
  {
    name: 'packet-source-artifact-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_source_artifact_count_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.sourceArtifactCount += 1;
      });
    },
  },
  {
    name: 'packet-source-trace-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_source_trace_count_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.sourceTraceCount += 1;
      });
    },
  },
  {
    name: 'packet-source-trace-stale-fails',
    expectedCode: 1,
    expectedText: 'packet_source_trace_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.sourceTrace[0].sourceArtifact = `${PACKET_JSON_PATH}#sourceArtifacts.latestRecords`;
      });
    },
  },
  {
    name: 'packet-source-trace-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_source_trace_markdown_mismatch',
    mutate(root) {
      updateText(root, PACKET_MARKDOWN_PATH, (source) =>
        source.replace('Source trace rows: 6', 'Source trace rows: 5'),
      );
    },
  },
  {
    name: 'packet-does-not-prove-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_does_not_prove_markdown_mismatch',
    mutate(root) {
      updateText(root, PACKET_MARKDOWN_PATH, (source) =>
        source.replace('- Guaranteed career outcomes', '- Career outcomes are guaranteed'),
      );
    },
  },
  {
    name: 'packet-primary-source-artifact-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_primary_source_artifact_markdown_mismatch',
    mutate(root) {
      updateText(root, PACKET_MARKDOWN_PATH, (source) =>
        source.replace(
          'Primary source artifact: `docs/commercialization/commercial-evidence-intake-template.json`',
          'Primary source artifact: `docs/commercialization/commercial-evidence-records-latest.json`',
        ),
      );
    },
  },
  {
    name: 'packet-official-reference-count-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_official_reference_count_mismatch',
    mutate(root) {
      updateJson(root, PACKET_JSON_PATH, (value) => {
        value.officialReferenceCount += 1;
      });
    },
  },
  {
    name: 'packet-official-reference-count-markdown-drift-fails',
    expectedCode: 1,
    expectedText: 'packet_official_reference_count_markdown_mismatch',
    mutate(root) {
      updateText(root, PACKET_MARKDOWN_PATH, (source) => source.replace('Official references | 4', 'Official references | 3'));
    },
  },
  {
    name: 'markdown-boundary-drift-fails',
    expectedCode: 1,
    expectedText: 'markdown_missing_text',
    mutate(root) {
      updateText(root, PACKET_MARKDOWN_PATH, (source) => source.replace('testimonial compliance', 'marketing copy'));
    },
  },
];

for (const testCase of cases) {
  assertCase(testCase.name, testCase.mutate, testCase.expectedCode, testCase.expectedText);
}

console.log(`Commercial evidence intake packet alignment fixture verification passed: ${cases.length} cases.`);
