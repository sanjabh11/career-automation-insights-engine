#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import {
  DEFAULT_INPUT_PATH,
  MIN_ACCEPTED_DESIGN_PARTNERS,
  MIN_ACCEPTED_DOCUMENTED_OUTCOMES,
  OUTCOME_INTEGRITY_ATTESTATIONS,
  OUTCOME_GATE_ID,
  OUTCOME_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS,
  OUTCOME_PROOF_ARTIFACT_TYPES,
  OUTCOME_REQUIRED_PROOF_TYPES,
  PARTNER_GATE_ID,
  PARTNER_INTEGRITY_ATTESTATIONS,
  PARTNER_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS,
  PARTNER_PERMISSION_PROOF_TYPES,
  PARTNER_PROOF_ARTIFACT_TYPES,
  SCHEMA_VERSION as COMMERCIAL_EVIDENCE_SCHEMA_VERSION,
} from './verify-commercial-evidence-records.mjs';

const SCHEMA_VERSION = '2026-06-04.apo-commercial-evidence-intake-packet.v1';
const OUTPUT_JSON = 'docs/commercialization/commercial-evidence-intake-packet-latest.json';
const OUTPUT_MARKDOWN = 'docs/commercialization/commercial-evidence-intake-packet-latest.md';
const OUTPUT_CSV = 'docs/commercialization/commercial-evidence-intake-matrix-latest.csv';
const INTAKE_TEMPLATE_PATH = 'docs/commercialization/commercial-evidence-intake-template.json';
const HASHER_PATH = 'scripts/hash-owner-evidence-artifacts.mjs';
const COMPOSER_PATH = 'scripts/compose-commercial-evidence-records.mjs';
const VERIFIER_PATH = 'scripts/verify-commercial-evidence-records.mjs';
const LATEST_RECORDS_PATH = 'docs/commercialization/commercial-evidence-records-latest.json';
const CLOSEOUT_STATUS_PATH = 'docs/commercialization/owner-evidence-closeout-status-latest.json';
const SOURCE_TRACE_BOUNDARY =
  'This source trace maps each generated commercial-evidence intake packet provenance row to the sourceArtifacts key used by the owner worksheet. It does not read owner-held partner or outcome evidence contents, hash salts, raw proof files, private quotes, contracts, contacts, payment data, live systems, or upgrade launch readiness.';
const HASHER_INPUT_BOUNDARY =
  'When hashing proof artifacts, use ordinary owner-held files outside git or under an ignored local proof path. The hasher rejects symbolic links, hard-linked files, tracked files, staged files, and non-ignored repository files; copy proof material to a single-link owner-held file before hashing.';
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

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function readOptionalJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function markdownCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function formatList(values) {
  return values.join('; ');
}

function requirement(id, label, requiredValue, ownerInputLocation, notes, acceptedValues = '') {
  return { id, label, requiredValue, ownerInputLocation, notes, acceptedValues };
}

const partnerRequirements = [
  requirement('partner-ref', 'Stable owner-held partner reference', 'Non-placeholder partnerRef', 'designPartnerCommitments[].partnerRef', 'Use an internal owner reference only; do not commit names, emails, profile URLs, meeting/calendar links, contracts, or contacts.'),
  requirement('segment', 'Buyer segment label', 'Segment such as career_coach, career_center, or workforce_board', 'designPartnerCommitments[].segment', 'Keep segment-level metadata only.'),
  requirement('committed-at', 'Commitment date', 'ISO date or datetime not later than asOf', 'designPartnerCommitments[].committedAt', 'Use the date the permissioned pilot commitment was made.'),
  requirement('permissioned', 'Permission to cite/use record', 'true', 'designPartnerCommitments[].permissioned', 'Do not count informal or unpermissioned conversations.'),
  requirement('contact-permission', 'Contact permission', 'true', 'designPartnerCommitments[].contactPermission', 'Owner must hold the permission trail outside git.'),
  requirement('pilot-scope-accepted', 'Pilot scope accepted', 'true', 'designPartnerCommitments[].pilotScopeAccepted', 'A lead or polite reply is not a committed pilot scope.'),
  requirement('planning-only-use-confirmed', 'Planning-only use confirmed', 'true', 'designPartnerCommitments[].planningOnlyUseConfirmed', 'Preserve the no-employment-selection boundary.'),
  requirement('artifact-reviewed', 'Product artifact reviewed', 'Non-empty artifactReviewed', 'designPartnerCommitments[].artifactReviewed', 'Examples: sample_report, trust_center, proof_pack_gallery, cohort_packet.'),
  requirement('next-step-recorded', 'Concrete next step recorded', 'true', 'designPartnerCommitments[].nextStepRecorded', 'Examples: pilot scope review, follow-up call, sample artifact review.'),
  requirement('proof-artifact-hashes', 'Owner-held proof artifact hashes', 'At least one non-placeholder sha256 hash', 'designPartnerCommitments[].proofArtifactHashes', `Generate hashes with npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>. ${HASHER_INPUT_BOUNDARY}`),
  requirement('proof-artifact-types', 'Supported proof artifact types', `artifact_review_log plus at least one of ${formatList(PARTNER_PERMISSION_PROOF_TYPES)}`, 'designPartnerCommitments[].proofArtifactTypes', 'Allowed values come from the verifier.', formatList([...PARTNER_PROOF_ARTIFACT_TYPES])),
  requirement('raw-evidence-owner-held', 'Raw evidence owner-held attestation', 'true', 'designPartnerCommitments[].rawEvidenceOwnerHeld', 'Raw partner names, contacts, profile URLs, meeting/calendar links, contracts, notes, and proof artifacts stay outside git.'),
  requirement('redaction-level', 'Redaction boundary', 'Description with at least 6 characters', 'designPartnerCommitments[].redactionLevel', 'Examples: public_segment_only, founder_private_records.'),
  requirement('integrity-attestations', 'Marketing/testimonial integrity attestations', formatList(PARTNER_INTEGRITY_ATTESTATIONS), 'designPartnerCommitments[].integrityAttestations', 'Owner-held review must cover marketing use, material connections, incentives or compensation, fake/synthetic testimonial risk, and review gating/suppression.', formatList(PARTNER_INTEGRITY_ATTESTATIONS.map((key) => `${key}=true`))),
  requirement('owner-evidence-archive', 'Owner-held commercial proof archive', formatList(PARTNER_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS), 'designPartnerCommitments[].ownerEvidenceArchive', 'Owner-held archive metadata must confirm permission trails, pilot scope records, artifact review logs, contact details, material-connection review, incentive review, non-sentiment-conditioned solicitation, and required re-review before public use.', formatList(PARTNER_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS.map((key) => `${key}=true`))),
  requirement('does-not-prove', 'Explicit claim boundaries', 'Non-empty doesNotProve array', 'designPartnerCommitments[].doesNotProve', 'Must include limits such as revenue, successful outcomes, or market-wide demand.'),
];

const outcomeRequirements = [
  requirement('outcome-ref', 'Stable owner-held outcome reference', 'Non-placeholder outcomeRef', 'documentedOutcomes[].outcomeRef', 'Use an internal owner reference only; do not commit names, quotes, or private notes.'),
  requirement('observed-at', 'Outcome observation date', 'ISO date or datetime not later than asOf', 'documentedOutcomes[].observedAt', 'Use the date the owner observed or confirmed the outcome.'),
  requirement('permissioned', 'Permission to cite/use record', 'true', 'documentedOutcomes[].permissioned', 'Do not count unpermissioned anecdotes.'),
  requirement('baseline-workflow-captured', 'Baseline workflow captured', 'true', 'documentedOutcomes[].baselineWorkflowCaptured', 'Owner-held proof should show the before-state.'),
  requirement('artifact-reviewed', 'Product artifact reviewed', 'Non-empty artifactReviewed', 'documentedOutcomes[].artifactReviewed', 'Examples: sample_report, resume_analysis, cohort_packet.'),
  requirement('measured-change-captured', 'Measured change captured', 'true', 'documentedOutcomes[].measuredChangeCaptured', 'Use a bounded measured-change summary; do not overclaim causality.'),
  requirement('approved-quote-captured', 'Approved quote captured', 'true', 'documentedOutcomes[].approvedQuoteCaptured', 'The quote or testimonial approval remains owner-held.'),
  requirement('quote-approval-captured', 'Quote approval captured', 'true', 'documentedOutcomes[].quoteApprovalCaptured', 'Keep the approval trail outside git.'),
  requirement('measured-change-unit', 'Measured-change unit', 'Non-empty measuredChangeUnit', 'documentedOutcomes[].measuredChangeUnit', 'Examples: minutes_saved_per_report, review_cycles_reduced, counselor_prep_time_delta.'),
  requirement('measurement-window', 'Measurement window', 'Description with at least 6 characters', 'documentedOutcomes[].measurementWindow', 'Use a bounded observation window; avoid implying long-term retention or broad impact.'),
  requirement('outcome-claim-scope', 'Outcome claim scope', 'Description with at least 12 characters', 'documentedOutcomes[].outcomeClaimScope', 'State exactly what the result covers and what it does not cover.'),
  requirement('typicality-boundary', 'Typicality boundary', 'Description with at least 12 characters', 'documentedOutcomes[].typicalityBoundary', 'Do not imply a result is typical without separate substantiation.'),
  requirement('proof-artifact-hashes', 'Owner-held proof artifact hashes', 'At least one non-placeholder sha256 hash', 'documentedOutcomes[].proofArtifactHashes', `Generate hashes with npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>. ${HASHER_INPUT_BOUNDARY}`),
  requirement('proof-artifact-types', 'Required proof artifact types', formatList(OUTCOME_REQUIRED_PROOF_TYPES), 'documentedOutcomes[].proofArtifactTypes', 'Allowed values come from the verifier.', formatList([...OUTCOME_PROOF_ARTIFACT_TYPES])),
  requirement('raw-evidence-owner-held', 'Raw evidence owner-held attestation', 'true', 'documentedOutcomes[].rawEvidenceOwnerHeld', 'Raw names, private quotes, notes, and proof artifacts stay outside git.'),
  requirement('redaction-level', 'Redaction boundary', 'Description with at least 6 characters', 'documentedOutcomes[].redactionLevel', 'Examples: public_quote_approved, founder_private_records.'),
  requirement('integrity-attestations', 'Marketing/testimonial and outcome integrity attestations', formatList(OUTCOME_INTEGRITY_ATTESTATIONS), 'documentedOutcomes[].integrityAttestations', 'Owner-held review must cover marketing use, material connections, incentives or compensation, fake/synthetic testimonial risk, review gating/suppression, no counterfactual causality claim, and no guaranteed outcome claim.', formatList(OUTCOME_INTEGRITY_ATTESTATIONS.map((key) => `${key}=true`))),
  requirement('owner-evidence-archive', 'Owner-held outcome proof archive', formatList(OUTCOME_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS), 'documentedOutcomes[].ownerEvidenceArchive', 'Owner-held archive metadata must confirm baseline workflow evidence, measured-change evidence, quote approval records, private quote text, material-connection review, incentive review, typicality substantiation, and required re-review before public case-study use.', formatList(OUTCOME_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS.map((key) => `${key}=true`))),
  requirement('does-not-prove', 'Explicit claim boundaries', 'Non-empty doesNotProve array', 'documentedOutcomes[].doesNotProve', 'Must include limits such as guaranteed outcomes, causality, or generalizable demand.'),
];

const officialReferences = [
  {
    id: 'ftc-consumer-reviews-rule-questions',
    label: 'FTC Consumer Reviews and Testimonials Rule questions',
    url: 'https://www.ftc.gov/business-guidance/resources/consumer-reviews-testimonials-rule-questions-answers',
    appliesTo: ['fake or false review/testimonial boundary', 'review/testimonial rule awareness'],
  },
  {
    id: 'ftc-endorsements-reviews',
    label: 'FTC endorsements, influencers, and reviews',
    url: 'https://www.ftc.gov/business-guidance/advertising-marketing/endorsements-influencers-reviews',
    appliesTo: ['quote approval', 'review/testimonial boundaries', 'material connection awareness'],
  },
  {
    id: 'ftc-endorsement-guides-faq',
    label: "FTC Endorsement Guides: What People Are Asking",
    url: 'https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking',
    appliesTo: ['honest endorsement handling', 'material connection disclosure review'],
  },
  {
    id: 'ftc-review-solicitation-guide',
    label: 'FTC soliciting and paying for online reviews guide',
    url: 'https://www.ftc.gov/business-guidance/resources/soliciting-paying-online-reviews-guide-marketers',
    appliesTo: ['review solicitation integrity', 'anti-fake-review boundary'],
  },
];

function buildRecordSlots() {
  return [
    ...Array.from({ length: MIN_ACCEPTED_DESIGN_PARTNERS }, (_, index) => ({
      recordSlot: `partner-${index + 1}`,
      recordType: 'design_partner_commitment',
      gateId: PARTNER_GATE_ID,
      requiredRecordIndex: index,
      requirements: partnerRequirements,
    })),
    ...Array.from({ length: MIN_ACCEPTED_DOCUMENTED_OUTCOMES }, (_, index) => ({
      recordSlot: `outcome-${index + 1}`,
      recordType: 'documented_outcome',
      gateId: OUTCOME_GATE_ID,
      requiredRecordIndex: index,
      requirements: outcomeRequirements,
    })),
  ];
}

function buildMatrix(recordSlots) {
  return recordSlots.flatMap((slot) =>
    slot.requirements.map((item) => ({
      recordSlot: slot.recordSlot,
      recordType: slot.recordType,
      gateId: slot.gateId,
      requiredRecordIndex: slot.requiredRecordIndex,
      requirementId: item.id,
      requirementLabel: item.label,
      requiredValue: item.requiredValue,
      acceptedValues: item.acceptedValues,
      ownerInputLocation: item.ownerInputLocation,
      reviewStatus: 'owner_evidence_required',
      notes: item.notes,
      rawEvidencePolicy:
        'Keep raw names, contacts, profile URLs, meeting/calendar links, contracts, notes, private quotes, customer data, proof artifacts, and hash salts owner-held outside tracked files.',
      doesNotProve:
        'Revenue; retention; causal product impact; market-wide demand; guaranteed career outcomes; legal compliance; testimonial compliance review',
    }))
  );
}

function summarizeLatestRecords(latestRecords) {
  if (!latestRecords) {
    return {
      latestRecordsPath: LATEST_RECORDS_PATH,
      status: 'missing_latest_records_artifact',
      acceptedDesignPartnerCount: 0,
      acceptedOutcomeCount: 0,
      partnerGateSatisfied: false,
      outcomeGateSatisfied: false,
    };
  }
  return {
    latestRecordsPath: LATEST_RECORDS_PATH,
    status: latestRecords.status || 'unknown',
    acceptedDesignPartnerCount: latestRecords.acceptedDesignPartnerCount || 0,
    acceptedOutcomeCount: latestRecords.acceptedOutcomeCount || 0,
    requiredDesignPartnerCount: latestRecords.requiredDesignPartnerCount || MIN_ACCEPTED_DESIGN_PARTNERS,
    requiredOutcomeCount: latestRecords.requiredOutcomeCount || MIN_ACCEPTED_DOCUMENTED_OUTCOMES,
    partnerGateSatisfied: latestRecords.partnerGateSatisfied === true,
    outcomeGateSatisfied: latestRecords.outcomeGateSatisfied === true,
  };
}

function summarizeCloseout(closeoutStatus) {
  const queue = Array.isArray(closeoutStatus?.ownerActionQueue) ? closeoutStatus.ownerActionQueue : [];
  return {
    closeoutStatusPath: CLOSEOUT_STATUS_PATH,
    goalComplete: closeoutStatus?.goalComplete === true,
    relevantOwnerActions: queue
      .filter((item) => item.id === PARTNER_GATE_ID || item.id === OUTCOME_GATE_ID)
      .map((item) => ({
        id: item.id,
        status: item.status,
        ownerAction: item.ownerAction,
        nextCommand: item.nextCommand,
      })),
  };
}

function buildSourceTrace(sourceArtifacts) {
  return Object.entries(sourceArtifacts).map(([key, artifactPath]) => ({
    key,
    artifactPath,
    sourceArtifact: `${OUTPUT_JSON}#sourceArtifacts.${key}`,
  }));
}

async function buildPacket() {
  const generatedAt = new Date().toISOString();
  const latestRecords = await readOptionalJson(LATEST_RECORDS_PATH);
  const closeoutStatus = await readOptionalJson(CLOSEOUT_STATUS_PATH);
  const recordSlots = buildRecordSlots();
  const requirementMatrix = buildMatrix(recordSlots);
  const requiredGateIds = [PARTNER_GATE_ID, OUTCOME_GATE_ID];
  const ownerCommandSequence = [
    'npm run generate:commercial-evidence-intake-packet',
    'npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>',
    'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
    `npm run verify:commercial-evidence-records -- --evidence ${DEFAULT_INPUT_PATH} --require-all`,
  ];
  const sourceArtifacts = {
    intakeTemplate: INTAKE_TEMPLATE_PATH,
    ownerHasher: HASHER_PATH,
    composer: COMPOSER_PATH,
    verifier: VERIFIER_PATH,
    latestRecords: LATEST_RECORDS_PATH,
    closeoutStatus: CLOSEOUT_STATUS_PATH,
  };
  const sourceTrace = buildSourceTrace(sourceArtifacts);
  const doesNotProve = [...DOES_NOT_PROVE];

  return {
    generatedAt,
    schemaVersion: SCHEMA_VERSION,
    status: 'owner_commercial_evidence_required',
    requiredDesignPartnerCount: MIN_ACCEPTED_DESIGN_PARTNERS,
    requiredOutcomeCount: MIN_ACCEPTED_DOCUMENTED_OUTCOMES,
    requirementRowCount: requirementMatrix.length,
    requiredGateCount: requiredGateIds.length,
    recordSlotCount: recordSlots.length,
    ownerCommandSequenceCount: ownerCommandSequence.length,
    doesNotProveCount: doesNotProve.length,
    requiredGateIds,
    officialReferences,
    officialReferenceCount: officialReferences.length,
    sourceArtifact: sourceArtifacts.intakeTemplate,
    sourceArtifacts,
    sourceArtifactCount: Object.keys(sourceArtifacts).length,
    sourceTraceCount: sourceTrace.length,
    sourceTrace,
    sourceTraceBoundary: SOURCE_TRACE_BOUNDARY,
    outputArtifacts: {
      json: OUTPUT_JSON,
      markdown: OUTPUT_MARKDOWN,
      csv: OUTPUT_CSV,
    },
    evidenceBoundary:
      'This packet is an owner-intake worksheet only. Raw partner names, contact details, profile URLs, meeting/calendar links, contracts, private notes, private quotes, customer data, proof artifacts, material-connection reviews, incentive reviews, typicality substantiation, approval trails, and hash salts must remain owner-held outside tracked files. The packet does not prove partner commitments, documented outcomes, revenue, retention, causality, market-wide demand, guaranteed career outcomes, legal compliance, or testimonial compliance.',
    hasherInputBoundary: HASHER_INPUT_BOUNDARY,
    doesNotProve,
    latestRecordsSummary: summarizeLatestRecords(latestRecords),
    closeoutSummary: summarizeCloseout(closeoutStatus),
    recordSlots: recordSlots.map((slot) => ({
      recordSlot: slot.recordSlot,
      recordType: slot.recordType,
      gateId: slot.gateId,
      requiredRecordIndex: slot.requiredRecordIndex,
      requirementCount: slot.requirements.length,
    })),
    requirementMatrix,
    ownerCommandSequence,
    sourceSchema: {
      commercialEvidenceRecordsSchemaVersion: COMMERCIAL_EVIDENCE_SCHEMA_VERSION,
      defaultCommercialEvidenceRecordsPath: DEFAULT_INPUT_PATH,
    },
  };
}

function renderMarkdown(packet) {
  const rows = packet.requirementMatrix
    .map((row) =>
      `| ${markdownCell(row.recordSlot)} | ${markdownCell(row.recordType)} | ${markdownCell(row.requirementId)} | ${markdownCell(row.requiredValue)} | ${markdownCell(row.ownerInputLocation)} | ${markdownCell(row.reviewStatus)} |`
    )
    .join('\n');
  const referenceRows = packet.officialReferences
    .map((ref) => `| ${markdownCell(ref.label)} | ${markdownCell(ref.url)} | ${markdownCell(formatList(ref.appliesTo))} |`)
    .join('\n');
  const commandRows = packet.ownerCommandSequence.map((command) => `- \`${command}\``).join('\n');
  const sourceTraceRows = packet.sourceTrace
    .map((row) => `| ${markdownCell(row.key)} | \`${markdownCell(row.artifactPath)}\` | \`${markdownCell(row.sourceArtifact)}\` |`)
    .join('\n');

  return `# Commercial Evidence Intake Packet

Generated: ${packet.generatedAt}

Status: \`${packet.status}\`

Primary source artifact: \`${packet.sourceArtifact}\`

Source artifact count: ${packet.sourceArtifactCount}

Source trace rows: ${packet.sourceTraceCount}

Does-not-prove boundaries: ${packet.doesNotProveCount}

## Evidence Boundary

${packet.evidenceBoundary}

## Hasher Input Boundary

${packet.hasherInputBoundary}

## Does Not Prove

${packet.doesNotProve.map((item) => `- ${item}`).join('\n')}

## Source Trace

${packet.sourceTraceBoundary}

| Key | Artifact | Source anchor |
| --- | --- | --- |
${sourceTraceRows}

## Required Counts

| Item | Count |
| --- | ---: |
| Design partner commitments | ${packet.requiredDesignPartnerCount} |
| Documented outcomes | ${packet.requiredOutcomeCount} |
| Requirement matrix rows | ${packet.requirementRowCount} |
| Required gates | ${packet.requiredGateCount} |
| Record slots | ${packet.recordSlotCount} |
| Owner command sequence | ${packet.ownerCommandSequenceCount} |
| Does-not-prove boundaries | ${packet.doesNotProveCount} |
| Official references | ${packet.officialReferenceCount} |

## Latest Records Summary

| Artifact | Status | Partners | Outcomes | Partner gate | Outcome gate |
| --- | --- | ---: | ---: | --- | --- |
| \`${packet.latestRecordsSummary.latestRecordsPath}\` | ${packet.latestRecordsSummary.status} | ${packet.latestRecordsSummary.acceptedDesignPartnerCount} / ${packet.latestRecordsSummary.requiredDesignPartnerCount} | ${packet.latestRecordsSummary.acceptedOutcomeCount} / ${packet.latestRecordsSummary.requiredOutcomeCount} | ${packet.latestRecordsSummary.partnerGateSatisfied} | ${packet.latestRecordsSummary.outcomeGateSatisfied} |

## Owner Command Sequence

${commandRows}

## Official Reference Basis

| Reference | URL | Applies to |
| --- | --- | --- |
${referenceRows}

## Requirement Matrix

Use the CSV companion for worksheet execution: \`${OUTPUT_CSV}\`.

| Slot | Type | Requirement | Required value | Owner input location | Status |
| --- | --- | --- | --- | --- | --- |
${rows}
`;
}

function renderCsv(packet) {
  const header = [
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
  const rows = packet.requirementMatrix.map((row) =>
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
    ].map(csvCell).join(',')
  );
  return `${header.map(csvCell).join(',')}\n${rows.join('\n')}\n`;
}

async function writePacket(packet) {
  await mkdir('docs/commercialization', { recursive: true });
  await writeFile(OUTPUT_JSON, `${JSON.stringify(packet, null, 2)}\n`);
  await writeFile(OUTPUT_MARKDOWN, renderMarkdown(packet));
  await writeFile(OUTPUT_CSV, renderCsv(packet));
}

const packet = await buildPacket();
if (hasFlag('--write')) await writePacket(packet);

console.log(JSON.stringify({
  ok: true,
  schemaVersion: packet.schemaVersion,
  status: packet.status,
  requiredDesignPartnerCount: packet.requiredDesignPartnerCount,
  requiredOutcomeCount: packet.requiredOutcomeCount,
  requirementRowCount: packet.requirementRowCount,
  requiredGateCount: packet.requiredGateCount,
  recordSlotCount: packet.recordSlotCount,
  ownerCommandSequenceCount: packet.ownerCommandSequenceCount,
  doesNotProveCount: packet.doesNotProveCount,
  officialReferenceCount: packet.officialReferenceCount,
  sourceArtifact: packet.sourceArtifact,
  sourceArtifactCount: packet.sourceArtifactCount,
  sourceTraceCount: packet.sourceTraceCount,
  latestRecordsStatus: packet.latestRecordsSummary.status,
  outputs: packet.outputArtifacts,
  evidenceBoundary: packet.evidenceBoundary,
}, null, 2));
