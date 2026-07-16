#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  DEFAULT_INPUT_PATH,
  MIN_ACCEPTED_DESIGN_PARTNERS,
  MIN_ACCEPTED_DOCUMENTED_OUTCOMES,
  OUTCOME_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS,
  OUTCOME_INTEGRITY_ATTESTATIONS,
  SCHEMA_VERSION as COMMERCIAL_EVIDENCE_SCHEMA_VERSION,
  PARTNER_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS,
  PARTNER_INTEGRITY_ATTESTATIONS,
  validateCommercialEvidence,
} from './verify-commercial-evidence-records.mjs';

const root = process.cwd();
const INTAKE_SCHEMA_VERSION = '2026-06-01.apo-commercial-evidence-intake.v1';
const DEFAULT_INTAKE_PATH = 'docs/commercialization/commercial-evidence-intake.local.json';
const PARTNER_PROOF_ARTIFACT_TYPES = new Set([
  'permissioned_email',
  'signed_pilot_scope',
  'artifact_review_log',
  'crm_stage_snapshot',
  'calendar_hold',
  'call_note',
]);
const OUTCOME_PROOF_ARTIFACT_TYPES = new Set([
  'baseline_workflow_note',
  'artifact_review_log',
  'measured_change_summary',
  'quote_approval',
  'outcome_review_note',
]);
const PARTNER_PERMISSION_PROOF_TYPES = ['permissioned_email', 'signed_pilot_scope'];
const OUTCOME_REQUIRED_PROOF_TYPES = ['baseline_workflow_note', 'measured_change_summary', 'quote_approval'];

function hasFlag(name) {
  return process.argv.includes(name);
}

function readFlagValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function resolvePath(candidate) {
  return path.isAbsolute(candidate) ? candidate : path.join(root, candidate);
}

function displayPath(absolutePath) {
  return path.relative(root, absolutePath) || path.basename(absolutePath);
}

function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function normalizeRef(value) {
  return String(value || '').trim().toLowerCase();
}

function isPlaceholder(value) {
  return /replace-with|placeholder|example|sample-only|000000/i.test(String(value || ''));
}

function saltedHash(kind, value, salt) {
  return `sha256:${sha256(`${salt}:${kind}:${normalizeRef(value)}`)}`;
}

function assertOwnerHeldInputPath(inputAbsolutePath, allowRepoInput, errors) {
  const relative = path.relative(root, inputAbsolutePath);
  const isInsideRepo = relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  if (isInsideRepo && !relative.endsWith('.local.json') && !allowRepoInput) {
    errors.push('intake path inside the repo must end with .local.json unless --allow-repo-input is passed');
  }
}

function readIntake(inputPath) {
  const inputAbsolutePath = resolvePath(inputPath);
  const errors = [];
  assertOwnerHeldInputPath(inputAbsolutePath, hasFlag('--allow-repo-input'), errors);

  if (!fs.existsSync(inputAbsolutePath)) {
    return {
      inputPath: displayPath(inputAbsolutePath),
      intake: null,
      errors: [...errors, `${displayPath(inputAbsolutePath)} is missing`],
    };
  }

  const source = fs.readFileSync(inputAbsolutePath, 'utf8');
  try {
    return {
      inputPath: displayPath(inputAbsolutePath),
      intake: JSON.parse(source),
      errors,
    };
  } catch {
    return {
      inputPath: displayPath(inputAbsolutePath),
      intake: null,
      errors: [...errors, `${displayPath(inputAbsolutePath)} must be valid JSON`],
    };
  }
}

function addString(errors, item, key, pathName, minLength = 3) {
  if (typeof item?.[key] !== 'string' || item[key].trim().length < minLength) {
    errors.push(`${pathName}.${key} is required`);
  }
}

function addBooleanTrue(errors, item, key, pathName) {
  if (item?.[key] !== true) errors.push(`${pathName}.${key} must be true`);
}

function addIntegrityAttestations(errors, item, pathName, attestations) {
  if (!isPlainObject(item?.integrityAttestations)) {
    errors.push(`${pathName}.integrityAttestations must be an object`);
    return;
  }

  attestations.forEach((key) => {
    if (item.integrityAttestations[key] !== true) {
      errors.push(`${pathName}.integrityAttestations.${key} must be true`);
    }
  });
}

function addOwnerEvidenceArchive(errors, item, pathName, requirements) {
  if (!isPlainObject(item?.ownerEvidenceArchive)) {
    errors.push(`${pathName}.ownerEvidenceArchive must be an object`);
    return;
  }

  requirements.forEach((key) => {
    if (item.ownerEvidenceArchive[key] !== true) {
      errors.push(`${pathName}.ownerEvidenceArchive.${key} must be true`);
    }
  });
}

function addProofArtifactHashes(errors, item, pathName) {
  if (!Array.isArray(item?.proofArtifactHashes) || item.proofArtifactHashes.length === 0) {
    errors.push(`${pathName}.proofArtifactHashes must contain at least one non-placeholder sha256 hash`);
    return;
  }

  const seen = new Set();
  item.proofArtifactHashes.forEach((value, index) => {
    if (typeof value !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(value) || /^sha256:0{64}$/.test(value) || isPlaceholder(value)) {
      errors.push(`${pathName}.proofArtifactHashes[${index}] must be a non-placeholder sha256 hash`);
    }
    if (seen.has(value)) errors.push(`${pathName}.proofArtifactHashes[${index}] must be unique within the record`);
    seen.add(value);
  });
}

function addProofArtifactTypes(errors, item, pathName, allowedTypes, requiredTypes = [], oneOfTypes = []) {
  if (!Array.isArray(item?.proofArtifactTypes) || item.proofArtifactTypes.length === 0) {
    errors.push(`${pathName}.proofArtifactTypes must contain at least one supported proof artifact type`);
    return;
  }

  const seen = new Set();
  item.proofArtifactTypes.forEach((value, index) => {
    if (typeof value !== 'string' || !allowedTypes.has(value)) {
      errors.push(`${pathName}.proofArtifactTypes[${index}] must be one of ${[...allowedTypes].join(', ')}`);
    }
    if (seen.has(value)) errors.push(`${pathName}.proofArtifactTypes[${index}] must be unique within the record`);
    seen.add(value);
  });

  requiredTypes.forEach((requiredType) => {
    if (!seen.has(requiredType)) errors.push(`${pathName}.proofArtifactTypes must include ${requiredType}`);
  });

  if (oneOfTypes.length > 0 && !oneOfTypes.some((requiredType) => seen.has(requiredType))) {
    errors.push(`${pathName}.proofArtifactTypes must include at least one of ${oneOfTypes.join(', ')}`);
  }
}

function addDoesNotProve(errors, item, pathName) {
  if (!Array.isArray(item?.doesNotProve) || item.doesNotProve.length === 0 || item.doesNotProve.some((value) => typeof value !== 'string' || value.trim().length < 3)) {
    errors.push(`${pathName}.doesNotProve must contain explicit claim boundaries`);
  }
}

function addDate(errors, item, key, pathName) {
  const value = item?.[key];
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T[\d:.+-]+Z?)?$/.test(value) || !Number.isFinite(Date.parse(value))) {
    errors.push(`${pathName}.${key} must be an ISO date or datetime`);
  }
}

function validateSalt(errors, intake, envSalt) {
  const salt = envSalt || intake?.hashSalt;
  if (typeof salt !== 'string' || salt.trim().length < 16 || isPlaceholder(salt)) {
    errors.push('hashSalt or COMMERCIAL_EVIDENCE_HASH_SALT must be an owner-held non-placeholder string with at least 16 characters');
    return '';
  }
  return salt.trim();
}

function validatePartnerInput(item, index, errors) {
  const pathName = `designPartnerCommitments[${index}]`;
  if (!isPlainObject(item)) {
    errors.push(`${pathName} must be an object`);
    return;
  }
  addString(errors, item, 'partnerRef', pathName, 3);
  if (isPlaceholder(item.partnerRef)) errors.push(`${pathName}.partnerRef must not be a placeholder`);
  addString(errors, item, 'segment', pathName);
  addDate(errors, item, 'committedAt', pathName);
  addBooleanTrue(errors, item, 'permissioned', pathName);
  addBooleanTrue(errors, item, 'contactPermission', pathName);
  addBooleanTrue(errors, item, 'pilotScopeAccepted', pathName);
  addBooleanTrue(errors, item, 'planningOnlyUseConfirmed', pathName);
  addString(errors, item, 'artifactReviewed', pathName);
  addBooleanTrue(errors, item, 'nextStepRecorded', pathName);
  addProofArtifactHashes(errors, item, pathName);
  addProofArtifactTypes(errors, item, pathName, PARTNER_PROOF_ARTIFACT_TYPES, ['artifact_review_log'], PARTNER_PERMISSION_PROOF_TYPES);
  addBooleanTrue(errors, item, 'rawEvidenceOwnerHeld', pathName);
  addString(errors, item, 'redactionLevel', pathName, 6);
  addIntegrityAttestations(errors, item, pathName, PARTNER_INTEGRITY_ATTESTATIONS);
  addOwnerEvidenceArchive(errors, item, pathName, PARTNER_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS);
  addDoesNotProve(errors, item, pathName);
}

function validateOutcomeInput(item, index, errors) {
  const pathName = `documentedOutcomes[${index}]`;
  if (!isPlainObject(item)) {
    errors.push(`${pathName} must be an object`);
    return;
  }
  addString(errors, item, 'outcomeRef', pathName, 3);
  if (isPlaceholder(item.outcomeRef)) errors.push(`${pathName}.outcomeRef must not be a placeholder`);
  addDate(errors, item, 'observedAt', pathName);
  addBooleanTrue(errors, item, 'permissioned', pathName);
  addBooleanTrue(errors, item, 'baselineWorkflowCaptured', pathName);
  addString(errors, item, 'artifactReviewed', pathName);
  addBooleanTrue(errors, item, 'measuredChangeCaptured', pathName);
  addBooleanTrue(errors, item, 'approvedQuoteCaptured', pathName);
  addBooleanTrue(errors, item, 'quoteApprovalCaptured', pathName);
  addString(errors, item, 'measuredChangeUnit', pathName);
  addString(errors, item, 'measurementWindow', pathName, 6);
  addString(errors, item, 'outcomeClaimScope', pathName, 12);
  addString(errors, item, 'typicalityBoundary', pathName, 12);
  addProofArtifactHashes(errors, item, pathName);
  addProofArtifactTypes(errors, item, pathName, OUTCOME_PROOF_ARTIFACT_TYPES, OUTCOME_REQUIRED_PROOF_TYPES);
  addBooleanTrue(errors, item, 'rawEvidenceOwnerHeld', pathName);
  addString(errors, item, 'redactionLevel', pathName, 6);
  addIntegrityAttestations(errors, item, pathName, OUTCOME_INTEGRITY_ATTESTATIONS);
  addOwnerEvidenceArchive(errors, item, pathName, OUTCOME_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS);
  addDoesNotProve(errors, item, pathName);
}

function buildPartnerRecord(item, salt) {
  return {
    partnerIdHash: saltedHash('partner', item.partnerRef, salt),
    segment: item.segment,
    committedAt: item.committedAt,
    permissioned: item.permissioned,
    contactPermission: item.contactPermission,
    pilotScopeAccepted: item.pilotScopeAccepted,
    planningOnlyUseConfirmed: item.planningOnlyUseConfirmed,
    artifactReviewed: item.artifactReviewed,
    nextStepRecorded: item.nextStepRecorded,
    proofArtifactHashes: item.proofArtifactHashes,
    proofArtifactTypes: item.proofArtifactTypes,
    rawEvidenceOwnerHeld: item.rawEvidenceOwnerHeld,
    redactionLevel: item.redactionLevel,
    integrityAttestations: item.integrityAttestations,
    ownerEvidenceArchive: item.ownerEvidenceArchive,
    doesNotProve: item.doesNotProve,
  };
}

function buildOutcomeRecord(item, salt) {
  return {
    outcomeIdHash: saltedHash('outcome', item.outcomeRef, salt),
    observedAt: item.observedAt,
    permissioned: item.permissioned,
    baselineWorkflowCaptured: item.baselineWorkflowCaptured,
    artifactReviewed: item.artifactReviewed,
    measuredChangeCaptured: item.measuredChangeCaptured,
    approvedQuoteCaptured: item.approvedQuoteCaptured,
    quoteApprovalCaptured: item.quoteApprovalCaptured,
    measuredChangeUnit: item.measuredChangeUnit,
    measurementWindow: item.measurementWindow,
    outcomeClaimScope: item.outcomeClaimScope,
    typicalityBoundary: item.typicalityBoundary,
    proofArtifactHashes: item.proofArtifactHashes,
    proofArtifactTypes: item.proofArtifactTypes,
    rawEvidenceOwnerHeld: item.rawEvidenceOwnerHeld,
    redactionLevel: item.redactionLevel,
    integrityAttestations: item.integrityAttestations,
    ownerEvidenceArchive: item.ownerEvidenceArchive,
    doesNotProve: item.doesNotProve,
  };
}

function validateOutput(records) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'apo-commercial-records-compose-'));
  const tempPath = path.join(tempDir, 'commercial-evidence-records.json');
  try {
    fs.writeFileSync(tempPath, `${JSON.stringify(records, null, 2)}\n`);
    return validateCommercialEvidence({ inputPath: tempPath, root });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function composeRecords() {
  const inputPath = readFlagValue('--input') || readFlagValue('--intake') || DEFAULT_INTAKE_PATH;
  const outputPath = readFlagValue('--output') || DEFAULT_INPUT_PATH;
  const envSalt = process.env.COMMERCIAL_EVIDENCE_HASH_SALT;
  const { inputPath: inputDisplayPath, intake, errors } = readIntake(inputPath);

  if (intake) {
    if (!isPlainObject(intake)) errors.push('intake root must be an object');
    if (intake.schemaVersion !== INTAKE_SCHEMA_VERSION) errors.push(`schemaVersion must be ${INTAKE_SCHEMA_VERSION}`);
    addDate(errors, intake, 'asOf', 'intake');
    if (typeof intake.sourceBoundary !== 'string' || intake.sourceBoundary.trim().length < 20) {
      errors.push('sourceBoundary must describe the owner-held intake boundary');
    }
  }

  const salt = validateSalt(errors, intake, envSalt);
  const partnerInputs = Array.isArray(intake?.designPartnerCommitments) ? intake.designPartnerCommitments : [];
  const outcomeInputs = Array.isArray(intake?.documentedOutcomes) ? intake.documentedOutcomes : [];
  if (!Array.isArray(intake?.designPartnerCommitments)) errors.push('designPartnerCommitments must be an array');
  if (!Array.isArray(intake?.documentedOutcomes)) errors.push('documentedOutcomes must be an array');

  partnerInputs.forEach((item, index) => validatePartnerInput(item, index, errors));
  outcomeInputs.forEach((item, index) => validateOutcomeInput(item, index, errors));

  const records = {
    schemaVersion: COMMERCIAL_EVIDENCE_SCHEMA_VERSION,
    asOf: intake?.asOf || new Date().toISOString().slice(0, 10),
    sourceBoundary: 'Redacted founder-held commercial evidence records composed from local owner intake. Partner, outcome, and proof artifact hashes use owner-held source material; raw names, contacts, profile URLs, meeting/calendar links, Stripe checkout URLs, contracts, notes, quotes, customer data, proof artifacts, and the salt remain outside the repository.',
    designPartnerCommitments: errors.length === 0 ? partnerInputs.map((item) => buildPartnerRecord(item, salt)) : [],
    documentedOutcomes: errors.length === 0 ? outcomeInputs.map((item) => buildOutcomeRecord(item, salt)) : [],
  };

  const outputValidation = errors.length === 0
    ? validateOutput(records)
    : {
      errors: [],
      partnerGateSatisfied: false,
      outcomeGateSatisfied: false,
      uniqueDesignPartnerCount: 0,
      uniqueOutcomeCount: 0,
      acceptedDesignPartnerCount: 0,
      acceptedOutcomeCount: 0,
    };

  return {
    records,
    inputDisplayPath,
    outputPath,
    errors: [...errors, ...outputValidation.errors],
    outputValidation,
  };
}

function main() {
  const shouldWrite = hasFlag('--write');
  const requirePartners = hasFlag('--require-partners') || hasFlag('--require-all');
  const requireOutcomes = hasFlag('--require-outcomes') || hasFlag('--require-all');
  const allowPartial = hasFlag('--allow-partial');
  const { records, inputDisplayPath, outputPath, errors, outputValidation } = composeRecords();
  const outputAbsolutePath = resolvePath(outputPath);
  const outputDisplayPath = displayPath(outputAbsolutePath);
  const partnerGateSatisfied =
    outputValidation.partnerGateSatisfied === true &&
    outputValidation.uniqueDesignPartnerCount >= MIN_ACCEPTED_DESIGN_PARTNERS;
  const outcomeGateSatisfied =
    outputValidation.outcomeGateSatisfied === true &&
    outputValidation.uniqueOutcomeCount >= MIN_ACCEPTED_DOCUMENTED_OUTCOMES;
  const gateRequirementsSatisfied = (!requirePartners || partnerGateSatisfied) && (!requireOutcomes || outcomeGateSatisfied);
  const canWrite = shouldWrite && errors.length === 0 && (allowPartial || gateRequirementsSatisfied);

  if (canWrite) {
    fs.mkdirSync(path.dirname(outputAbsolutePath), { recursive: true });
    fs.writeFileSync(outputAbsolutePath, `${JSON.stringify(records, null, 2)}\n`);
  }

  const composeCommand = `COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all`;
  const validateCommand = `npm run verify:commercial-evidence-records -- --evidence ${outputDisplayPath} --require-all`;
  const finalReadOnlyLedgerCommand = `npm run verify:remediation-gates -- --live-evidence <live-gate-evidence-path> --commercial-evidence ${outputDisplayPath} --manual-wcag-evidence <manual-wcag-evidence-path> --require-complete`;
  const refreshTrackedLedgerCommand = `npm run verify:remediation-gates:write -- --live-evidence <live-gate-evidence-path> --commercial-evidence ${outputDisplayPath} --manual-wcag-evidence <manual-wcag-evidence-path> --require-complete`;

  const result = {
    ok: errors.length === 0 && gateRequirementsSatisfied,
    schemaVersion: INTAKE_SCHEMA_VERSION,
    inputPath: inputDisplayPath,
    outputPath: outputDisplayPath,
    wrote: canWrite ? outputDisplayPath : null,
    acceptedDesignPartnerCount: outputValidation.acceptedDesignPartnerCount,
    acceptedOutcomeCount: outputValidation.acceptedOutcomeCount,
    requiredDesignPartnerCount: MIN_ACCEPTED_DESIGN_PARTNERS,
    requiredOutcomeCount: MIN_ACCEPTED_DOCUMENTED_OUTCOMES,
    uniqueDesignPartnerCount: outputValidation.uniqueDesignPartnerCount,
    uniqueOutcomeCount: outputValidation.uniqueOutcomeCount,
    partnerGateSatisfied,
    outcomeGateSatisfied,
    errorCount: errors.length,
    errors,
    nextCommand: canWrite ? validateCommand : composeCommand,
    nextCommands: canWrite
      ? {
        validateCommercialEvidence: validateCommand,
        finalReadOnlyLedger: finalReadOnlyLedgerCommand,
        refreshTrackedLedger: refreshTrackedLedgerCommand,
      }
      : {
        composeCommercialEvidence: composeCommand,
      },
  };

  console.log(JSON.stringify(result, null, 2));

  if (errors.length > 0 || (shouldWrite && !canWrite) || !gateRequirementsSatisfied) {
    process.exitCode = 1;
  }
}

main();
