#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

export const SCHEMA_VERSION = '2026-06-01.apo-commercial-evidence-records.v1';
const PARTNER_GATE_ID = 'three_committed_partners';
const OUTCOME_GATE_ID = 'documented_outcomes';
export const DEFAULT_INPUT_PATH = 'docs/commercialization/commercial-evidence-records.local.json';
const OUTPUT_PATH = 'docs/commercialization/commercial-evidence-records-latest.json';

const SECRET_OR_PRIVATE_PATTERNS = [
  { id: 'email_address', pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { id: 'stripe_secret_key', pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/ },
  { id: 'stripe_webhook_secret', pattern: /\bwhsec_[A-Za-z0-9]{16,}\b/ },
  { id: 'google_api_key', pattern: /\bAIza[A-Za-z0-9_-]{25,}\b/ },
  { id: 'jwt_like_token', pattern: /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/ },
];

function readFlagValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T[\d:.+-]+Z?)?$/.test(value);
}

function isSha256(value) {
  return typeof value === 'string' && /^sha256:[a-f0-9]{64}$/.test(value) && !/^sha256:0{64}$/.test(value);
}

function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function resolveInputPath(requestedPath, baseRoot = repoRoot) {
  const candidate = requestedPath || process.env.COMMERCIAL_EVIDENCE_RECORDS_PATH || DEFAULT_INPUT_PATH;
  return path.isAbsolute(candidate) ? candidate : path.join(baseRoot, candidate);
}

function containsPhoneLikeNumber(source) {
  const candidates = source.match(/\+?\d[\d().\-\s]{8,}\d/g) || [];
  return candidates.some((candidate) => {
    const digits = candidate.replace(/\D/g, '');
    const hasPhoneSeparator = /^\+/.test(candidate) || /[().\-\s]/.test(candidate);
    return digits.length >= 10 && hasPhoneSeparator;
  });
}

function detectSecretOrPrivatePatternIds(source) {
  const ids = SECRET_OR_PRIVATE_PATTERNS.filter((item) => item.pattern.test(source)).map((item) => item.id);
  if (containsPhoneLikeNumber(source)) ids.push('phone_like_number');
  return ids;
}

function addRequiredBoolean(errors, value, pathName) {
  if (value !== true) errors.push(`${pathName} must be true`);
}

function validateDoesNotProve(errors, value, pathName) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || item.trim().length < 3)) {
    errors.push(`${pathName} must contain explicit claim boundaries`);
  }
}

function validateDesignPartner(item, index) {
  const errors = [];
  const prefix = `designPartnerCommitments[${index}]`;

  if (!isPlainObject(item)) return { accepted: false, errors: [`${prefix} must be an object`] };
  if (!isSha256(item.partnerIdHash)) errors.push(`${prefix}.partnerIdHash must be a non-placeholder sha256 hash`);
  if (typeof item.segment !== 'string' || item.segment.trim().length < 3) errors.push(`${prefix}.segment is required`);
  if (!isIsoDate(item.committedAt)) errors.push(`${prefix}.committedAt must be an ISO date or datetime`);
  addRequiredBoolean(errors, item.permissioned, `${prefix}.permissioned`);
  addRequiredBoolean(errors, item.contactPermission, `${prefix}.contactPermission`);
  addRequiredBoolean(errors, item.pilotScopeAccepted, `${prefix}.pilotScopeAccepted`);
  addRequiredBoolean(errors, item.planningOnlyUseConfirmed, `${prefix}.planningOnlyUseConfirmed`);
  if (typeof item.artifactReviewed !== 'string' || item.artifactReviewed.trim().length < 3) errors.push(`${prefix}.artifactReviewed is required`);
  addRequiredBoolean(errors, item.nextStepRecorded, `${prefix}.nextStepRecorded`);
  if (typeof item.redactionLevel !== 'string' || item.redactionLevel.trim().length < 6) errors.push(`${prefix}.redactionLevel must describe the redaction boundary`);
  validateDoesNotProve(errors, item.doesNotProve, `${prefix}.doesNotProve`);

  return { accepted: errors.length === 0, errors };
}

function validateOutcome(item, index) {
  const errors = [];
  const prefix = `documentedOutcomes[${index}]`;

  if (!isPlainObject(item)) return { accepted: false, errors: [`${prefix} must be an object`] };
  if (!isSha256(item.outcomeIdHash)) errors.push(`${prefix}.outcomeIdHash must be a non-placeholder sha256 hash`);
  if (!isIsoDate(item.observedAt)) errors.push(`${prefix}.observedAt must be an ISO date or datetime`);
  addRequiredBoolean(errors, item.permissioned, `${prefix}.permissioned`);
  addRequiredBoolean(errors, item.baselineWorkflowCaptured, `${prefix}.baselineWorkflowCaptured`);
  if (typeof item.artifactReviewed !== 'string' || item.artifactReviewed.trim().length < 3) errors.push(`${prefix}.artifactReviewed is required`);
  addRequiredBoolean(errors, item.measuredChangeCaptured, `${prefix}.measuredChangeCaptured`);
  addRequiredBoolean(errors, item.approvedQuoteCaptured, `${prefix}.approvedQuoteCaptured`);
  addRequiredBoolean(errors, item.quoteApprovalCaptured, `${prefix}.quoteApprovalCaptured`);
  if (typeof item.redactionLevel !== 'string' || item.redactionLevel.trim().length < 6) errors.push(`${prefix}.redactionLevel must describe the redaction boundary`);
  validateDoesNotProve(errors, item.doesNotProve, `${prefix}.doesNotProve`);

  return { accepted: errors.length === 0, errors };
}

export function validateCommercialEvidence({ inputPath, root: requestedRoot } = {}) {
  const baseRoot = requestedRoot || repoRoot;
  const absolutePath = resolveInputPath(inputPath, baseRoot);
  const relativePath = path.relative(baseRoot, absolutePath) || path.basename(absolutePath);

  if (!fs.existsSync(absolutePath)) {
    return {
      found: false,
      inputPath: relativePath,
      schemaVersion: SCHEMA_VERSION,
      errors: [],
      acceptedDesignPartnerCount: 0,
      acceptedOutcomeCount: 0,
      partnerGateSatisfied: false,
      outcomeGateSatisfied: false,
    };
  }

  const source = fs.readFileSync(absolutePath, 'utf8');
  const errors = detectSecretOrPrivatePatternIds(source)
    .map((id) => `commercial evidence file contains a high-confidence secret or private-contact pattern: ${id}`);
  let parsed = null;

  try {
    parsed = JSON.parse(source);
  } catch {
    errors.push('commercial evidence file must be valid JSON');
  }

  let acceptedDesignPartnerCount = 0;
  let acceptedOutcomeCount = 0;

  if (parsed) {
    if (!isPlainObject(parsed)) errors.push('commercial evidence file root must be an object');
    if (parsed.schemaVersion !== SCHEMA_VERSION) errors.push(`schemaVersion must be ${SCHEMA_VERSION}`);
    if (!isIsoDate(parsed.asOf)) errors.push('asOf must be an ISO date or datetime');
    if (typeof parsed.sourceBoundary !== 'string' || parsed.sourceBoundary.length < 20) {
      errors.push('sourceBoundary must describe the owner-held evidence and redaction boundary');
    }

    if (!Array.isArray(parsed.designPartnerCommitments)) {
      errors.push('designPartnerCommitments must be an array');
    } else {
      parsed.designPartnerCommitments.forEach((item, index) => {
        const result = validateDesignPartner(item, index);
        if (result.accepted) acceptedDesignPartnerCount += 1;
        errors.push(...result.errors);
      });
    }

    if (!Array.isArray(parsed.documentedOutcomes)) {
      errors.push('documentedOutcomes must be an array');
    } else {
      parsed.documentedOutcomes.forEach((item, index) => {
        const result = validateOutcome(item, index);
        if (result.accepted) acceptedOutcomeCount += 1;
        errors.push(...result.errors);
      });
    }
  }

  return {
    found: true,
    inputPath: relativePath,
    schemaVersion: SCHEMA_VERSION,
    errors,
    acceptedDesignPartnerCount,
    acceptedOutcomeCount,
    partnerGateSatisfied: errors.length === 0 && acceptedDesignPartnerCount >= 3,
    outcomeGateSatisfied: errors.length === 0 && acceptedOutcomeCount >= 1,
    evidenceHash: `sha256:${sha256(source)}`,
  };
}

export function renderArtifact(result) {
  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
    gateIds: [PARTNER_GATE_ID, OUTCOME_GATE_ID],
    inputPath: result.inputPath,
    found: result.found,
    status: result.errors.length
      ? 'invalid'
      : result.partnerGateSatisfied && result.outcomeGateSatisfied
        ? 'passed'
        : result.found
          ? 'insufficient_records'
          : 'no_local_evidence',
    confidence: 'bounded_redacted_commercial_evidence_records',
    caveat:
      'This verifier validates redacted founder-held commercial evidence metadata only. It does not store partner names, contact details, contracts, raw notes, private quotes, customer data, or prove revenue, retention, causality, market-wide demand, or career outcomes.',
    acceptedDesignPartnerCount: result.acceptedDesignPartnerCount,
    acceptedOutcomeCount: result.acceptedOutcomeCount,
    partnerGateSatisfied: result.partnerGateSatisfied,
    outcomeGateSatisfied: result.outcomeGateSatisfied,
    evidenceHash: result.evidenceHash || null,
    doesNotProve: [
      'Revenue',
      'Retention',
      'Causal product impact',
      'Market-wide demand',
      'Guaranteed career outcomes',
    ],
    manualInterventionIfMissing: [
      'Collect at least three permissioned design-partner commitments with pilot scope, planning-only use confirmation, artifact reviewed, contact permission, and next step recorded.',
      'Collect at least one permissioned documented outcome with baseline workflow, artifact reviewed, measured change, approved quote, quote approval, and explicit does-not-prove boundaries.',
      `Store only redacted metadata in ${DEFAULT_INPUT_PATH} or pass --evidence <path>; keep raw names, contacts, contracts, notes, and quotes owner-held.`,
      'Run npm run verify:commercial-evidence-records and then npm run verify:remediation-gates.',
    ],
    errors: result.errors,
  };
}

function main() {
  const inputPath = readFlagValue('--evidence');
  const shouldWrite = hasFlag('--write');
  const requirePartners = hasFlag('--require-partners') || hasFlag('--require-all');
  const requireOutcomes = hasFlag('--require-outcomes') || hasFlag('--require-all');
  const result = validateCommercialEvidence({ inputPath });
  const artifact = renderArtifact(result);

  if (shouldWrite) {
    fs.mkdirSync(path.join(repoRoot, 'docs/commercialization'), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, OUTPUT_PATH), `${JSON.stringify(artifact, null, 2)}\n`);
  }

  console.log(JSON.stringify({
    ok: result.errors.length === 0,
    found: result.found,
    inputPath: result.inputPath,
    acceptedDesignPartnerCount: result.acceptedDesignPartnerCount,
    acceptedOutcomeCount: result.acceptedOutcomeCount,
    partnerGateSatisfied: result.partnerGateSatisfied,
    outcomeGateSatisfied: result.outcomeGateSatisfied,
    errorCount: result.errors.length,
    errors: result.errors,
    wrote: shouldWrite ? OUTPUT_PATH : null,
  }, null, 2));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  } else if (requirePartners && !result.partnerGateSatisfied) {
    console.error('Three committed design partners are not proven by the redacted commercial evidence records.');
    process.exitCode = 1;
  } else if (requireOutcomes && !result.outcomeGateSatisfied) {
    console.error('Permissioned documented outcomes are not proven by the redacted commercial evidence records.');
    process.exitCode = 1;
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) main();
