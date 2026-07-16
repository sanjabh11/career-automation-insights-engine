#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

export const SCHEMA_VERSION = '2026-06-01.apo-commercial-evidence-records.v1';
export const MIN_ACCEPTED_DESIGN_PARTNERS = 3;
export const MIN_ACCEPTED_DOCUMENTED_OUTCOMES = 1;
export const PARTNER_GATE_ID = 'three_committed_partners';
export const OUTCOME_GATE_ID = 'documented_outcomes';
export const DEFAULT_INPUT_PATH = 'docs/commercialization/commercial-evidence-records.local.json';
const OUTPUT_PATH = 'docs/commercialization/commercial-evidence-records-latest.json';
export const PARTNER_PROOF_ARTIFACT_TYPES = new Set([
  'permissioned_email',
  'signed_pilot_scope',
  'artifact_review_log',
  'crm_stage_snapshot',
  'calendar_hold',
  'call_note',
]);
export const OUTCOME_PROOF_ARTIFACT_TYPES = new Set([
  'baseline_workflow_note',
  'artifact_review_log',
  'measured_change_summary',
  'quote_approval',
  'outcome_review_note',
]);
export const PARTNER_PERMISSION_PROOF_TYPES = ['permissioned_email', 'signed_pilot_scope'];
export const OUTCOME_REQUIRED_PROOF_TYPES = ['baseline_workflow_note', 'measured_change_summary', 'quote_approval'];
export const PARTNER_INTEGRITY_ATTESTATIONS = [
  'marketingUseReviewed',
  'materialConnectionReviewed',
  'incentiveOrCompensationReviewed',
  'noFakeOrSyntheticTestimonial',
  'noReviewGatingOrSuppression',
];
export const OUTCOME_INTEGRITY_ATTESTATIONS = [
  ...PARTNER_INTEGRITY_ATTESTATIONS,
  'counterfactualNotClaimed',
  'guaranteedOutcomeNotClaimed',
];
export const PARTNER_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS = [
  'permissionTrailOwnerHeld',
  'pilotScopeRecordOwnerHeld',
  'artifactReviewLogOwnerHeld',
  'contactDetailsOwnerHeldOutsideGit',
  'materialConnectionReviewOwnerHeld',
  'incentiveOrCompensationReviewOwnerHeld',
  'reviewSolicitationNotConditionedOnSentiment',
  'reReviewRequiredBeforePublicUse',
];
export const OUTCOME_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS = [
  'baselineWorkflowEvidenceOwnerHeld',
  'measuredChangeEvidenceOwnerHeld',
  'quoteApprovalRecordOwnerHeld',
  'privateQuoteTextOwnerHeldOutsideGit',
  'materialConnectionReviewOwnerHeld',
  'incentiveOrCompensationReviewOwnerHeld',
  'typicalitySubstantiationOwnerHeld',
  'reReviewRequiredBeforePublicCaseStudyUse',
];

const SECRET_OR_PRIVATE_PATTERNS = [
  { id: 'email_address', pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { id: 'stripe_secret_key', pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/ },
  { id: 'stripe_webhook_secret', pattern: /\bwhsec_[A-Za-z0-9]{16,}\b/ },
  { id: 'stripe_checkout_url', pattern: /\bhttps?:\/\/checkout\.stripe\.com\/(?:c|pay)\/[A-Za-z0-9._~%-]+/i },
  {
    id: 'private_profile_url',
    pattern:
      /\bhttps?:\/\/(?:[a-z]{2,3}\.)?(?:linkedin\.com\/(?:in|pub|company)|x\.com|twitter\.com)\/[A-Za-z0-9%_.-]+/i,
  },
  {
    id: 'meeting_or_calendar_link',
    pattern:
      /\bhttps?:\/\/(?:www\.)?(?:calendly\.com|cal\.com)\/[A-Za-z0-9._~%/-]+|\bhttps?:\/\/(?:[A-Za-z0-9-]+\.)?zoom\.us\/(?:j|my)\/[A-Za-z0-9._~%-]+|\bhttps?:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}\b|\bhttps?:\/\/teams\.microsoft\.com\/l\/meetup-join\/[A-Za-z0-9%._~:/?&=+-]+/i,
  },
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

function parseEvidenceDateBounds(value) {
  if (!isIsoDate(value)) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return {
    start: timestamp,
    end: isDateOnly ? timestamp + 86_400_000 - 1 : timestamp,
  };
}

function addEvidenceDateErrors(errors, value, pathName) {
  const bounds = parseEvidenceDateBounds(value);
  if (bounds === null) {
    errors.push(`${pathName} must be an ISO date or datetime`);
  } else if (bounds.start > Date.now()) {
    errors.push(`${pathName} must not be future-dated`);
  }
}

function addNotAfterAsOfError(errors, value, asOfBounds, pathName) {
  const bounds = parseEvidenceDateBounds(value);
  if (bounds !== null && asOfBounds !== null && bounds.start > asOfBounds.end) {
    errors.push(`${pathName} must not be later than asOf`);
  }
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

function addDuplicateHashErrors(errors, items, fieldName, pathName) {
  const indexesByValue = new Map();

  items.forEach((item, index) => {
    if (!isPlainObject(item) || typeof item[fieldName] !== 'string') return;
    const indexes = indexesByValue.get(item[fieldName]) || [];
    indexes.push(index);
    indexesByValue.set(item[fieldName], indexes);
  });

  for (const indexes of indexesByValue.values()) {
    if (indexes.length > 1) {
      errors.push(`${pathName}.${fieldName} must be unique; duplicate hash appears at indexes ${indexes.join(', ')}`);
    }
  }
}

function addRequiredBoolean(errors, value, pathName) {
  if (value !== true) errors.push(`${pathName} must be true`);
}

function addRequiredString(errors, value, pathName, minLength = 3) {
  if (typeof value !== 'string' || value.trim().length < minLength) errors.push(`${pathName} is required`);
}

function validateIntegrityAttestations(errors, item, pathName, attestations) {
  if (!isPlainObject(item.integrityAttestations)) {
    errors.push(`${pathName}.integrityAttestations must be an object`);
    return;
  }

  attestations.forEach((key) => {
    addRequiredBoolean(errors, item.integrityAttestations[key], `${pathName}.integrityAttestations.${key}`);
  });
}

function validateOwnerEvidenceArchive(errors, item, pathName, requirements) {
  if (!isPlainObject(item.ownerEvidenceArchive)) {
    errors.push(`${pathName}.ownerEvidenceArchive must be an object`);
    return;
  }

  requirements.forEach((key) => {
    addRequiredBoolean(errors, item.ownerEvidenceArchive[key], `${pathName}.ownerEvidenceArchive.${key}`);
  });
}

function validateProofArtifactHashes(errors, value, pathName) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${pathName} must contain at least one non-placeholder sha256 hash`);
    return;
  }

  const seen = new Set();
  value.forEach((item, index) => {
    if (!isSha256(item)) errors.push(`${pathName}[${index}] must be a non-placeholder sha256 hash`);
    if (seen.has(item)) errors.push(`${pathName}[${index}] must be unique within the record`);
    seen.add(item);
  });
}

function validateProofArtifactTypes(errors, value, pathName, allowedTypes, requiredTypes = [], oneOfTypes = []) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${pathName} must contain at least one supported proof artifact type`);
    return;
  }

  const seen = new Set();
  value.forEach((item, index) => {
    if (typeof item !== 'string' || !allowedTypes.has(item)) {
      errors.push(`${pathName}[${index}] must be one of ${[...allowedTypes].join(', ')}`);
    }
    if (seen.has(item)) errors.push(`${pathName}[${index}] must be unique within the record`);
    seen.add(item);
  });

  requiredTypes.forEach((requiredType) => {
    if (!seen.has(requiredType)) errors.push(`${pathName} must include ${requiredType}`);
  });

  if (oneOfTypes.length > 0 && !oneOfTypes.some((requiredType) => seen.has(requiredType))) {
    errors.push(`${pathName} must include at least one of ${oneOfTypes.join(', ')}`);
  }
}

function validateDoesNotProve(errors, value, pathName) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || item.trim().length < 3)) {
    errors.push(`${pathName} must contain explicit claim boundaries`);
  }
}

function validateDesignPartner(item, index, asOfBounds) {
  const errors = [];
  const prefix = `designPartnerCommitments[${index}]`;

  if (!isPlainObject(item)) return { accepted: false, errors: [`${prefix} must be an object`] };
  if (!isSha256(item.partnerIdHash)) errors.push(`${prefix}.partnerIdHash must be a non-placeholder sha256 hash`);
  if (typeof item.segment !== 'string' || item.segment.trim().length < 3) errors.push(`${prefix}.segment is required`);
  addEvidenceDateErrors(errors, item.committedAt, `${prefix}.committedAt`);
  addNotAfterAsOfError(errors, item.committedAt, asOfBounds, `${prefix}.committedAt`);
  addRequiredBoolean(errors, item.permissioned, `${prefix}.permissioned`);
  addRequiredBoolean(errors, item.contactPermission, `${prefix}.contactPermission`);
  addRequiredBoolean(errors, item.pilotScopeAccepted, `${prefix}.pilotScopeAccepted`);
  addRequiredBoolean(errors, item.planningOnlyUseConfirmed, `${prefix}.planningOnlyUseConfirmed`);
  if (typeof item.artifactReviewed !== 'string' || item.artifactReviewed.trim().length < 3) errors.push(`${prefix}.artifactReviewed is required`);
  addRequiredBoolean(errors, item.nextStepRecorded, `${prefix}.nextStepRecorded`);
  validateProofArtifactHashes(errors, item.proofArtifactHashes, `${prefix}.proofArtifactHashes`);
  validateProofArtifactTypes(errors, item.proofArtifactTypes, `${prefix}.proofArtifactTypes`, PARTNER_PROOF_ARTIFACT_TYPES, ['artifact_review_log'], PARTNER_PERMISSION_PROOF_TYPES);
  addRequiredBoolean(errors, item.rawEvidenceOwnerHeld, `${prefix}.rawEvidenceOwnerHeld`);
  if (typeof item.redactionLevel !== 'string' || item.redactionLevel.trim().length < 6) errors.push(`${prefix}.redactionLevel must describe the redaction boundary`);
  validateIntegrityAttestations(errors, item, prefix, PARTNER_INTEGRITY_ATTESTATIONS);
  validateOwnerEvidenceArchive(errors, item, prefix, PARTNER_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS);
  validateDoesNotProve(errors, item.doesNotProve, `${prefix}.doesNotProve`);

  return { accepted: errors.length === 0, errors };
}

function validateOutcome(item, index, asOfBounds) {
  const errors = [];
  const prefix = `documentedOutcomes[${index}]`;

  if (!isPlainObject(item)) return { accepted: false, errors: [`${prefix} must be an object`] };
  if (!isSha256(item.outcomeIdHash)) errors.push(`${prefix}.outcomeIdHash must be a non-placeholder sha256 hash`);
  addEvidenceDateErrors(errors, item.observedAt, `${prefix}.observedAt`);
  addNotAfterAsOfError(errors, item.observedAt, asOfBounds, `${prefix}.observedAt`);
  addRequiredBoolean(errors, item.permissioned, `${prefix}.permissioned`);
  addRequiredBoolean(errors, item.baselineWorkflowCaptured, `${prefix}.baselineWorkflowCaptured`);
  if (typeof item.artifactReviewed !== 'string' || item.artifactReviewed.trim().length < 3) errors.push(`${prefix}.artifactReviewed is required`);
  addRequiredBoolean(errors, item.measuredChangeCaptured, `${prefix}.measuredChangeCaptured`);
  addRequiredBoolean(errors, item.approvedQuoteCaptured, `${prefix}.approvedQuoteCaptured`);
  addRequiredBoolean(errors, item.quoteApprovalCaptured, `${prefix}.quoteApprovalCaptured`);
  addRequiredString(errors, item.measuredChangeUnit, `${prefix}.measuredChangeUnit`, 3);
  addRequiredString(errors, item.measurementWindow, `${prefix}.measurementWindow`, 6);
  addRequiredString(errors, item.outcomeClaimScope, `${prefix}.outcomeClaimScope`, 12);
  addRequiredString(errors, item.typicalityBoundary, `${prefix}.typicalityBoundary`, 12);
  validateProofArtifactHashes(errors, item.proofArtifactHashes, `${prefix}.proofArtifactHashes`);
  validateProofArtifactTypes(errors, item.proofArtifactTypes, `${prefix}.proofArtifactTypes`, OUTCOME_PROOF_ARTIFACT_TYPES, OUTCOME_REQUIRED_PROOF_TYPES);
  addRequiredBoolean(errors, item.rawEvidenceOwnerHeld, `${prefix}.rawEvidenceOwnerHeld`);
  if (typeof item.redactionLevel !== 'string' || item.redactionLevel.trim().length < 6) errors.push(`${prefix}.redactionLevel must describe the redaction boundary`);
  validateIntegrityAttestations(errors, item, prefix, OUTCOME_INTEGRITY_ATTESTATIONS);
  validateOwnerEvidenceArchive(errors, item, prefix, OUTCOME_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS);
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
      uniqueDesignPartnerCount: 0,
      uniqueOutcomeCount: 0,
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
  const acceptedDesignPartnerHashes = new Set();
  const acceptedOutcomeHashes = new Set();
  let asOfBounds = null;

  if (parsed) {
    if (!isPlainObject(parsed)) errors.push('commercial evidence file root must be an object');
    if (parsed.schemaVersion !== SCHEMA_VERSION) errors.push(`schemaVersion must be ${SCHEMA_VERSION}`);
    addEvidenceDateErrors(errors, parsed.asOf, 'asOf');
    asOfBounds = parseEvidenceDateBounds(parsed.asOf);
    if (typeof parsed.sourceBoundary !== 'string' || parsed.sourceBoundary.length < 20) {
      errors.push('sourceBoundary must describe the owner-held evidence and redaction boundary');
    }

    if (!Array.isArray(parsed.designPartnerCommitments)) {
      errors.push('designPartnerCommitments must be an array');
    } else {
      addDuplicateHashErrors(errors, parsed.designPartnerCommitments, 'partnerIdHash', 'designPartnerCommitments');
      parsed.designPartnerCommitments.forEach((item, index) => {
        const result = validateDesignPartner(item, index, asOfBounds);
        if (result.accepted) {
          acceptedDesignPartnerCount += 1;
          acceptedDesignPartnerHashes.add(item.partnerIdHash);
        }
        errors.push(...result.errors);
      });
    }

    if (!Array.isArray(parsed.documentedOutcomes)) {
      errors.push('documentedOutcomes must be an array');
    } else {
      addDuplicateHashErrors(errors, parsed.documentedOutcomes, 'outcomeIdHash', 'documentedOutcomes');
      parsed.documentedOutcomes.forEach((item, index) => {
        const result = validateOutcome(item, index, asOfBounds);
        if (result.accepted) {
          acceptedOutcomeCount += 1;
          acceptedOutcomeHashes.add(item.outcomeIdHash);
        }
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
    uniqueDesignPartnerCount: acceptedDesignPartnerHashes.size,
    uniqueOutcomeCount: acceptedOutcomeHashes.size,
    partnerGateSatisfied: errors.length === 0 && acceptedDesignPartnerHashes.size >= MIN_ACCEPTED_DESIGN_PARTNERS,
    outcomeGateSatisfied: errors.length === 0 && acceptedOutcomeHashes.size >= MIN_ACCEPTED_DOCUMENTED_OUTCOMES,
    evidenceHash: `sha256:${sha256(source)}`,
  };
}

export function renderArtifact(result) {
  const gateIds = [PARTNER_GATE_ID, OUTCOME_GATE_ID];
  const doesNotProve = [
    'Revenue',
    'Retention',
    'Causal product impact',
    'Market-wide demand',
    'Guaranteed career outcomes',
    'Legal compliance',
    'Testimonial compliance',
  ];
  const manualInterventionIfMissing = [
    'Collect at least three permissioned design-partner commitments with pilot scope, planning-only use confirmation, artifact reviewed, contact permission, next step recorded, owner-held proof artifact hashes/types, rawEvidenceOwnerHeld=true, and partner ownerEvidenceArchive policy metadata.',
    'For partner and outcome records, include owner-held marketing/testimonial integrity attestations: marketing-use review, material-connection review, incentive/compensation review, no fake/synthetic testimonial, and no review gating or suppression.',
    'Collect at least one permissioned documented outcome with baseline workflow, artifact reviewed, measured change, approved quote, quote approval, measured-change unit, measurement window, outcome claim scope, typicality boundary, no-causality/no-guarantee attestations, owner-held proof artifact hashes/types, outcome ownerEvidenceArchive policy metadata, and explicit does-not-prove boundaries.',
    'Option A: place owner-held intake in docs/commercialization/commercial-evidence-intake.local.json with an owner-held hash salt, then run COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all.',
    `Option B: store only redacted metadata in ${DEFAULT_INPUT_PATH} or pass --evidence <path>; keep raw names, contacts, profile URLs, meeting/calendar links, Stripe checkout URLs, contracts, notes, quotes, material-connection reviews, incentive reviews, typicality substantiation, proof artifacts, archive records, and salts owner-held.`,
    `Validate the redacted records with npm run verify:commercial-evidence-records -- --evidence ${DEFAULT_INPUT_PATH} --require-all.`,
    'Run npm run verify:remediation-gates -- --live-evidence <path> --commercial-evidence <path> --require-complete as the read-only final gate.',
    'Run npm run verify:remediation-gates:write -- --live-evidence <path> --commercial-evidence <path> --require-complete only when refreshing tracked closeout artifacts.',
  ];
  const errors = result.errors;

  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: SCHEMA_VERSION,
    gateIds,
    gateIdCount: gateIds.length,
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
      'This verifier validates redacted founder-held commercial evidence metadata only. Partner, outcome, and proof artifact hashes must be unique within their required boundaries, proof artifact types must be present, integrity attestations and ownerEvidenceArchive policy fields must be explicit, measured outcome scope must be bounded, and raw evidence must remain owner-held. It does not store partner names, contact details, profile URLs, meeting/calendar links, Stripe checkout URLs, contracts, raw notes, private quotes, customer data, proof artifacts, or prove revenue, retention, causality, market-wide demand, career outcomes, legal compliance, or testimonial compliance.',
    acceptedDesignPartnerCount: result.acceptedDesignPartnerCount,
    acceptedOutcomeCount: result.acceptedOutcomeCount,
    requiredDesignPartnerCount: MIN_ACCEPTED_DESIGN_PARTNERS,
    requiredOutcomeCount: MIN_ACCEPTED_DOCUMENTED_OUTCOMES,
    uniqueDesignPartnerCount: result.uniqueDesignPartnerCount,
    uniqueOutcomeCount: result.uniqueOutcomeCount,
    partnerGateSatisfied: result.partnerGateSatisfied,
    outcomeGateSatisfied: result.outcomeGateSatisfied,
    evidenceHash: result.evidenceHash || null,
    doesNotProve,
    doesNotProveCount: doesNotProve.length,
    manualInterventionIfMissing,
    manualInterventionIfMissingCount: manualInterventionIfMissing.length,
    nextCommands: {
      composeFromOwnerIntake: 'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
      validateCommercialEvidence: `npm run verify:commercial-evidence-records -- --evidence ${DEFAULT_INPUT_PATH} --require-all`,
      finalReadOnlyLedger: 'npm run verify:remediation-gates -- --live-evidence <path> --commercial-evidence <path> --require-complete',
      refreshTrackedLedger: 'npm run verify:remediation-gates:write -- --live-evidence <path> --commercial-evidence <path> --require-complete',
    },
    errorCount: errors.length,
    errors,
  };
}

export function validateRenderedArtifactCounts(artifact) {
  const errors = [];
  const expectedGateIdCount = Array.isArray(artifact?.gateIds) ? artifact.gateIds.length : null;
  const expectedDoesNotProveCount = Array.isArray(artifact?.doesNotProve) ? artifact.doesNotProve.length : null;
  const expectedManualInterventionIfMissingCount = Array.isArray(artifact?.manualInterventionIfMissing)
    ? artifact.manualInterventionIfMissing.length
    : null;
  const expectedErrorCount = Array.isArray(artifact?.errors) ? artifact.errors.length : null;

  if (artifact?.gateIdCount !== expectedGateIdCount) {
    errors.push(`artifact_gate_id_count_mismatch expected ${expectedGateIdCount} got ${artifact?.gateIdCount}`);
  }
  if (artifact?.doesNotProveCount !== expectedDoesNotProveCount) {
    errors.push(`artifact_does_not_prove_count_mismatch expected ${expectedDoesNotProveCount} got ${artifact?.doesNotProveCount}`);
  }
  if (artifact?.manualInterventionIfMissingCount !== expectedManualInterventionIfMissingCount) {
    errors.push(`artifact_manual_intervention_count_mismatch expected ${expectedManualInterventionIfMissingCount} got ${artifact?.manualInterventionIfMissingCount}`);
  }
  if (artifact?.errorCount !== expectedErrorCount) {
    errors.push(`artifact_error_count_mismatch expected ${expectedErrorCount} got ${artifact?.errorCount}`);
  }

  return errors;
}

function main() {
  const inputPath = readFlagValue('--evidence');
  const shouldWrite = hasFlag('--write');
  const requirePartners = hasFlag('--require-partners') || hasFlag('--require-all');
  const requireOutcomes = hasFlag('--require-outcomes') || hasFlag('--require-all');
  const result = validateCommercialEvidence({ inputPath });
  const artifact = renderArtifact(result);
  const artifactCountErrors = validateRenderedArtifactCounts(artifact);
  const allErrors = [...result.errors, ...artifactCountErrors];
  const gateRequirementsSatisfied =
    (!requirePartners || result.partnerGateSatisfied) &&
    (!requireOutcomes || result.outcomeGateSatisfied);

  if (shouldWrite && artifactCountErrors.length === 0) {
    fs.mkdirSync(path.join(repoRoot, 'docs/commercialization'), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, OUTPUT_PATH), `${JSON.stringify(artifact, null, 2)}\n`);
  }

  console.log(JSON.stringify({
    ok: allErrors.length === 0 && gateRequirementsSatisfied,
    found: result.found,
    inputPath: result.inputPath,
    acceptedDesignPartnerCount: result.acceptedDesignPartnerCount,
    acceptedOutcomeCount: result.acceptedOutcomeCount,
    requiredDesignPartnerCount: MIN_ACCEPTED_DESIGN_PARTNERS,
    requiredOutcomeCount: MIN_ACCEPTED_DOCUMENTED_OUTCOMES,
    uniqueDesignPartnerCount: result.uniqueDesignPartnerCount,
    uniqueOutcomeCount: result.uniqueOutcomeCount,
    partnerGateSatisfied: result.partnerGateSatisfied,
    outcomeGateSatisfied: result.outcomeGateSatisfied,
    errorCount: allErrors.length,
    errors: allErrors,
    wrote: shouldWrite && artifactCountErrors.length === 0 ? OUTPUT_PATH : null,
  }, null, 2));

  if (allErrors.length > 0) {
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
