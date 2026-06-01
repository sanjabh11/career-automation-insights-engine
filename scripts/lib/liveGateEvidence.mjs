import fs from 'node:fs';
import path from 'node:path';

export const LIVE_GATE_EVIDENCE_SCHEMA_VERSION = '2026-05-31.apo-live-gate-evidence.v1';
export const DEFAULT_LIVE_GATE_EVIDENCE_PATH = 'docs/commercialization/live-gate-evidence.local.json';

export const LIVE_GATE_EVIDENCE_GATE_IDS = [
  'real_stripe_test_checkout',
  'production_calibration_run',
  'authenticated_live_artifact_e2e',
  'live_mrr_gt_zero',
];
export const LIVE_GATE_EVIDENCE_REQUIRED_COUNT = LIVE_GATE_EVIDENCE_GATE_IDS.length;

const REQUIRED_GATE_IDS = new Set(LIVE_GATE_EVIDENCE_GATE_IDS);

const SECRET_OR_PRIVATE_PATTERNS = [
  { id: 'email_address', pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { id: 'stripe_secret_key', pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/ },
  { id: 'stripe_webhook_secret', pattern: /\bwhsec_[A-Za-z0-9]{16,}\b/ },
  { id: 'google_api_key', pattern: /\bAIza[A-Za-z0-9_-]{25,}\b/ },
  { id: 'jwt_like_token', pattern: /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/ },
];

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T[\d:.+-]+Z?)?$/.test(value);
}

function parseEvidenceDate(value) {
  if (!isIsoDate(value)) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function addEvidenceDateErrors(errors, value, pathName) {
  const timestamp = parseEvidenceDate(value);
  if (timestamp === null) {
    errors.push(`${pathName} must be an ISO date or datetime`);
  } else if (timestamp > Date.now()) {
    errors.push(`${pathName} must not be future-dated`);
  }
}

function isSha256(value) {
  return typeof value === 'string' && /^sha256:[a-f0-9]{64}$/.test(value) && !/^sha256:0{64}$/.test(value);
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

function gateRequirementError(item) {
  const summary = isPlainObject(item.evidenceSummary) ? item.evidenceSummary : {};

  switch (item.gateId) {
    case 'real_stripe_test_checkout':
      if (item.evidenceType !== 'stripe_test_checkout_session') return 'requires evidenceType=stripe_test_checkout_session';
      if (summary.testMode !== true) return 'requires evidenceSummary.testMode=true';
      return null;
    case 'production_calibration_run':
      if (item.evidenceType !== 'production_calibration_run') return 'requires evidenceType=production_calibration_run';
      if (typeof summary.ece !== 'number' || summary.ece < 0 || summary.ece > 1) return 'requires evidenceSummary.ece between 0 and 1';
      if (!Number.isInteger(summary.expertAssessmentCount) || summary.expertAssessmentCount <= 0) return 'requires positive evidenceSummary.expertAssessmentCount';
      if (!Number.isInteger(summary.predictionPairCount) || summary.predictionPairCount <= 0) return 'requires positive evidenceSummary.predictionPairCount';
      return null;
    case 'authenticated_live_artifact_e2e':
      if (item.evidenceType !== 'authenticated_live_e2e') return 'requires evidenceType=authenticated_live_e2e';
      if (summary.passed !== true) return 'requires evidenceSummary.passed=true';
      if (summary.syntheticUser !== true) return 'requires evidenceSummary.syntheticUser=true';
      return null;
    case 'live_mrr_gt_zero':
      if (item.evidenceType !== 'stripe_live_mrr_export') return 'requires evidenceType=stripe_live_mrr_export';
      if (summary.liveMode !== true) return 'requires evidenceSummary.liveMode=true';
      if (summary.totalMrrGreaterThanZero !== true) return 'requires evidenceSummary.totalMrrGreaterThanZero=true';
      if (!Number.isInteger(summary.activeSubscriptionCount) || summary.activeSubscriptionCount <= 0) return 'requires positive evidenceSummary.activeSubscriptionCount';
      if (!Number.isInteger(summary.paidInvoiceCount) || summary.paidInvoiceCount <= 0) return 'requires positive evidenceSummary.paidInvoiceCount';
      return null;
    default:
      return `unknown gateId ${item.gateId}`;
  }
}

function validateItem(item, index) {
  const errors = [];
  const prefix = `evidenceItems[${index}]`;

  if (!isPlainObject(item)) return { gateId: null, accepted: false, errors: [`${prefix} must be an object`] };
  if (!REQUIRED_GATE_IDS.has(item.gateId)) errors.push(`${prefix}.gateId must be one of the required remediation gate ids`);
  if (item.status !== 'proven') errors.push(`${prefix}.status must be "proven" to count as accepted evidence`);
  addEvidenceDateErrors(errors, item.observedAt, `${prefix}.observedAt`);
  if (typeof item.evidenceType !== 'string' || item.evidenceType.length < 3) errors.push(`${prefix}.evidenceType is required`);
  if (typeof item.redactionBoundary !== 'string' || item.redactionBoundary.length < 12) errors.push(`${prefix}.redactionBoundary must describe what was redacted or owner-held`);
  if (typeof item.evidenceSummary !== 'object' || item.evidenceSummary === null || Array.isArray(item.evidenceSummary)) errors.push(`${prefix}.evidenceSummary must be an object`);
  if (!Array.isArray(item.artifactHashes) || item.artifactHashes.length === 0 || item.artifactHashes.some((hash) => !isSha256(hash))) {
    errors.push(`${prefix}.artifactHashes must contain at least one sha256:<64 hex> hash`);
  }
  if (!Array.isArray(item.doesNotProve) || item.doesNotProve.length === 0 || item.doesNotProve.some((value) => typeof value !== 'string' || value.length < 3)) {
    errors.push(`${prefix}.doesNotProve must contain explicit claim boundaries`);
  }

  const requirementError = gateRequirementError(item);
  if (requirementError) errors.push(`${prefix} ${requirementError}`);

  return {
    gateId: item.gateId || null,
    accepted: errors.length === 0,
    errors,
  };
}

export function resolveLiveGateEvidencePath(root, requestedPath) {
  const candidate = requestedPath || process.env.LIVE_GATE_EVIDENCE_PATH || DEFAULT_LIVE_GATE_EVIDENCE_PATH;
  return path.isAbsolute(candidate) ? candidate : path.join(root, candidate);
}

export function validateLiveGateEvidence({ root, evidencePath } = {}) {
  const resolvedRoot = root || process.cwd();
  const absolutePath = resolveLiveGateEvidencePath(resolvedRoot, evidencePath);
  const relativePath = path.relative(resolvedRoot, absolutePath) || path.basename(absolutePath);

  if (!fs.existsSync(absolutePath)) {
    return {
      found: false,
      evidencePath: relativePath,
      schemaVersion: LIVE_GATE_EVIDENCE_SCHEMA_VERSION,
      acceptedGateIds: [],
      rejectedGateIds: [],
      errors: [],
    };
  }

  const source = fs.readFileSync(absolutePath, 'utf8');
  const secretPatternIds = detectSecretOrPrivatePatternIds(source);
  const errors = secretPatternIds.map((id) => `evidence file contains a high-confidence secret or private-contact pattern: ${id}`);
  let parsed = null;

  try {
    parsed = JSON.parse(source);
  } catch {
    errors.push('evidence file must be valid JSON');
  }

  const acceptedGateIds = [];
  const rejectedGateIds = [];

  if (parsed) {
    if (!isPlainObject(parsed)) errors.push('evidence file root must be an object');
    if (parsed.schemaVersion !== LIVE_GATE_EVIDENCE_SCHEMA_VERSION) {
      errors.push(`schemaVersion must be ${LIVE_GATE_EVIDENCE_SCHEMA_VERSION}`);
    }
    addEvidenceDateErrors(errors, parsed.asOf, 'asOf');
    if (typeof parsed.sourceBoundary !== 'string' || parsed.sourceBoundary.length < 12) {
      errors.push('sourceBoundary must describe the evidence source and owner-held boundary');
    }
    if (!Array.isArray(parsed.evidenceItems)) {
      errors.push('evidenceItems must be an array');
    } else {
      parsed.evidenceItems.forEach((item, index) => {
        const result = validateItem(item, index);
        if (result.accepted) acceptedGateIds.push(result.gateId);
        if (!result.accepted && result.gateId) rejectedGateIds.push(result.gateId);
        errors.push(...result.errors);
      });
    }
  }

  return {
    found: true,
    evidencePath: relativePath,
    schemaVersion: LIVE_GATE_EVIDENCE_SCHEMA_VERSION,
    acceptedGateIds: [...new Set(acceptedGateIds)],
    rejectedGateIds: [...new Set(rejectedGateIds)],
    errors,
  };
}
