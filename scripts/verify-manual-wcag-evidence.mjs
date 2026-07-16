#!/usr/bin/env node

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

export const SCHEMA_VERSION = '2026-06-04.apo-manual-wcag-evidence.v1';
export const DEFAULT_INPUT_PATH = 'docs/commercialization/manual-wcag-evidence.local.json';
const OUTPUT_PATH = 'docs/commercialization/manual-wcag-evidence-latest.json';

export const REQUIRED_ROUTE_PATHS = [
  '/privacy',
  '/trust-center',
  '/for-coaches',
  '/sample-report',
  '/tools/resume-analyzer',
  '/tools/counselor-reports',
  '/enterprise-dashboard',
  '/proof-pack-gallery',
  '/automation-risk/accountant',
];

export const REQUIRED_CHECKPOINT_IDS = [
  'wcag-em-scope',
  'keyboard-focus-not-obscured',
  'target-size',
  'form-errors-and-redundant-entry',
  'accessible-authentication',
  'screen-reader-name-role-value',
  'contrast-reflow-text-spacing',
  'downloadable-artifacts',
];

export const REQUIRED_MANUAL_WCAG_CHECKPOINT_COUNT = REQUIRED_CHECKPOINT_IDS.length;
export const REQUIRED_MANUAL_WCAG_ROUTE_COUNT = REQUIRED_ROUTE_PATHS.length;

export const REQUIRED_COMPLETE_PROCESS_IDS = [
  'public-trust-navigation',
  'resume-analysis-proof-report',
  'counselor-report-generation',
  'proof-pack-downloads',
  'payment-and-account-access',
];

export const REQUIRED_ACCESSIBILITY_SUPPORT_BASELINE_COUNT = 2;
export const REVIEW_RECORD_ARCHIVE_ATTESTATIONS = [
  'samplesArchivedOwnerHeld',
  'evaluationToolsRecorded',
  'wcagEmReportToolExportOwnerHeld',
  'browserAssistiveTechnologyVersionsRecorded',
  'navigationPathsRecorded',
  'issueLogOwnerHeld',
  'rawEvidenceSecurityReviewed',
  'reEvaluationRequiredAfterMaterialChange',
];

export const MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS = [
  'rawReviewerNotesOwnerHeldOutsideGit',
  'screenshotsRecordingsOwnerHeldOutsideGit',
  'assistiveTechnologyTranscriptsOwnerHeldOutsideGit',
  'reviewerIdentityOwnerHeldOutsideGit',
  'issueDetailsOwnerHeldOutsideGit',
  'evaluationToolOutputOwnerHeldOutsideGit',
  'sampleArchivesOwnerHeldOutsideGit',
  'artifactHashSourceMapOwnerHeld',
  'reReviewRequiredAfterMaterialChange',
];

export const OFFICIAL_REFERENCE_REQUIREMENTS = [
  {
    id: 'wcag22',
    label: 'WCAG 2.2 Recommendation',
    url: 'https://www.w3.org/TR/WCAG22/',
  },
  {
    id: 'wcag-em-overview',
    label: 'WCAG-EM overview',
    url: 'https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/',
  },
  {
    id: 'wcag-em-2',
    label: 'WCAG-EM 2.0',
    url: 'https://www.w3.org/TR/wcag-em-2/',
  },
  {
    id: 'wcag-em-report-tool',
    label: 'WCAG-EM Report Tool',
    url: 'https://www.w3.org/WAI/eval/report-tool/',
  },
  {
    id: 'wai-easy-checks',
    label: 'WAI Easy Checks',
    url: 'https://www.w3.org/WAI/test-evaluate/preliminary/',
  },
  {
    id: 'wai-aria-apg',
    label: 'WAI-ARIA Authoring Practices',
    url: 'https://www.w3.org/WAI/ARIA/apg/',
  },
  {
    id: 'wcag2ict-22',
    label: 'WCAG2ICT 2.2',
    url: 'https://www.w3.org/TR/wcag2ict-22/',
  },
];

export const REQUIRED_MANUAL_WCAG_OFFICIAL_REFERENCE_COUNT = OFFICIAL_REFERENCE_REQUIREMENTS.length;

export const CHECKPOINT_STANDARD_REFS = {
  'wcag-em-scope': ['wcag-em-overview', 'wcag-em-2', 'wcag-em-report-tool'],
  'keyboard-focus-not-obscured': ['wcag22'],
  'target-size': ['wcag22'],
  'form-errors-and-redundant-entry': ['wcag22', 'wai-easy-checks'],
  'accessible-authentication': ['wcag22'],
  'screen-reader-name-role-value': ['wcag22', 'wai-aria-apg'],
  'contrast-reflow-text-spacing': ['wcag22', 'wai-easy-checks'],
  'downloadable-artifacts': ['wcag22', 'wai-easy-checks', 'wai-aria-apg', 'wcag2ict-22'],
};

function manualWcagEvidenceCounts(value) {
  const root = isPlainObject(value) ? value : {};
  return {
    requiredCheckpointCount: REQUIRED_MANUAL_WCAG_CHECKPOINT_COUNT,
    requiredRouteCount: REQUIRED_MANUAL_WCAG_ROUTE_COUNT,
    requiredOfficialReferenceCount: REQUIRED_MANUAL_WCAG_OFFICIAL_REFERENCE_COUNT,
    requiredCompleteProcessCount: REQUIRED_COMPLETE_PROCESS_IDS.length,
    requiredAccessibilitySupportBaselineCount: REQUIRED_ACCESSIBILITY_SUPPORT_BASELINE_COUNT,
    requiredOwnerEvidenceArchiveRequirementCount: MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS.length,
    checkpointResultCount: Array.isArray(root.checkpointResults) ? root.checkpointResults.length : 0,
    routeReviewedCount: Array.isArray(root.evaluationScope?.routesReviewed) ? root.evaluationScope.routesReviewed.length : 0,
    officialReferenceCount: Array.isArray(root.officialReferences) ? root.officialReferences.length : 0,
    completeProcessReviewedCount: Array.isArray(root.evaluationScope?.completeProcessesReviewed)
      ? root.evaluationScope.completeProcessesReviewed.length
      : 0,
    accessibilitySupportBaselineCount: Array.isArray(root.evaluationScope?.accessibilitySupportBaseline)
      ? root.evaluationScope.accessibilitySupportBaseline.length
      : 0,
  };
}

const ACCEPTED_STATUSES = new Set(['passed', 'passed_with_remediation', 'not_applicable_with_rationale']);
const REVIEW_STATUSES = new Set([...ACCEPTED_STATUSES, 'failed', 'blocked', 'not_reviewed']);
const SECRET_OR_PRIVATE_PATTERNS = [
  { id: 'email_address', pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { id: 'stripe_secret_key', pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/ },
  { id: 'stripe_webhook_secret', pattern: /\bwhsec_[A-Za-z0-9]{16,}\b/ },
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
  const candidate = requestedPath || process.env.MANUAL_WCAG_EVIDENCE_PATH || DEFAULT_INPUT_PATH;
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

function validateStringArray(errors, value, pathName, options = {}) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || item.trim().length < 2)) {
    errors.push(`${pathName} must be a non-empty string array`);
    return;
  }

  for (const requiredValue of options.includesAll || []) {
    if (!value.includes(requiredValue)) errors.push(`${pathName} must include ${requiredValue}`);
  }
}

function validateBoolean(errors, value, pathName) {
  if (value !== true) errors.push(`${pathName} must be true`);
}

function validateString(errors, value, pathName, minLength = 3) {
  if (typeof value !== 'string' || value.trim().length < minLength) errors.push(`${pathName} is required`);
}

function validateDoesNotProve(errors, value, pathName) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || item.trim().length < 3)) {
    errors.push(`${pathName} must contain explicit claim boundaries`);
  }
}

function validateReviewRecordArchive(errors, value, pathName) {
  if (!isPlainObject(value)) {
    errors.push(`${pathName} must be an object`);
    return;
  }

  REVIEW_RECORD_ARCHIVE_ATTESTATIONS.forEach((key) => {
    validateBoolean(errors, value[key], `${pathName}.${key}`);
  });
}

function validateOwnerEvidenceArchive(errors, value, pathName) {
  if (!isPlainObject(value)) {
    errors.push(`${pathName} must be an object`);
    return;
  }

  MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS.forEach((key) => {
    validateBoolean(errors, value[key], `${pathName}.${key}`);
  });
}

function validateAccessibilitySupportBaseline(errors, value, pathName) {
  if (!Array.isArray(value) || value.length < REQUIRED_ACCESSIBILITY_SUPPORT_BASELINE_COUNT) {
    errors.push(`${pathName} must include at least ${REQUIRED_ACCESSIBILITY_SUPPORT_BASELINE_COUNT} browser/assistive-technology support combinations`);
    return;
  }

  const ids = new Set();
  value.forEach((item, index) => {
    const prefix = `${pathName}[${index}]`;
    if (!isPlainObject(item)) {
      errors.push(`${prefix} must be an object`);
      return;
    }

    if (typeof item.id !== 'string' || item.id.trim().length < 3) errors.push(`${prefix}.id is required`);
    if (ids.has(item.id)) errors.push(`${pathName}.id must be unique; ${item.id} is duplicated`);
    ids.add(item.id);
    if (typeof item.operatingSystem !== 'string' || item.operatingSystem.trim().length < 3) {
      errors.push(`${prefix}.operatingSystem is required`);
    }
    if (typeof item.browser !== 'string' || item.browser.trim().length < 3) errors.push(`${prefix}.browser is required`);
    if (typeof item.assistiveTechnology !== 'string' || item.assistiveTechnology.trim().length < 3) {
      errors.push(`${prefix}.assistiveTechnology is required`);
    }
    validateStringArray(errors, item.inputModalities, `${prefix}.inputModalities`, { includesAll: ['keyboard'] });
    validateStringArray(errors, item.viewports, `${prefix}.viewports`);
  });
}

function validateOfficialReferences(errors, references, asOfBounds) {
  if (!Array.isArray(references)) {
    errors.push('officialReferences must be an array');
    return;
  }

  const referencesById = new Map();
  references.forEach((reference, index) => {
    const prefix = `officialReferences[${index}]`;
    if (!isPlainObject(reference)) {
      errors.push(`${prefix} must be an object`);
      return;
    }
    if (typeof reference.id !== 'string' || reference.id.trim().length === 0) errors.push(`${prefix}.id is required`);
    if (referencesById.has(reference.id)) errors.push(`officialReferences.id must be unique; ${reference.id} is duplicated`);
    referencesById.set(reference.id, reference);
    if (typeof reference.label !== 'string' || reference.label.trim().length < 3) errors.push(`${prefix}.label is required`);
    if (typeof reference.url !== 'string' || !reference.url.startsWith('https://www.w3.org/')) {
      errors.push(`${prefix}.url must be an official W3C/WAI https://www.w3.org/ URL`);
    }
    addEvidenceDateErrors(errors, reference.accessedAt, `${prefix}.accessedAt`);
    addNotAfterAsOfError(errors, reference.accessedAt, asOfBounds, `${prefix}.accessedAt`);
  });

  for (const expected of OFFICIAL_REFERENCE_REQUIREMENTS) {
    const actual = referencesById.get(expected.id);
    if (!actual) {
      errors.push(`officialReferences must include ${expected.id}`);
      continue;
    }
    if (actual.url !== expected.url) errors.push(`officialReferences.${expected.id}.url must be ${expected.url}`);
    if (actual.label !== expected.label) errors.push(`officialReferences.${expected.id}.label must be ${expected.label}`);
  }
}

function validateCheckpointStandardRefs(errors, item, pathName) {
  const requiredRefs = CHECKPOINT_STANDARD_REFS[item.checkpointId] || [];
  validateStringArray(errors, item.standardRefs, `${pathName}.standardRefs`, { includesAll: requiredRefs });
}

function checkpointSpecificError(item) {
  const summary = isPlainObject(item.evidenceSummary) ? item.evidenceSummary : {};

  switch (item.checkpointId) {
    case 'wcag-em-scope':
      if (summary.scopeDefined !== true) return 'requires evidenceSummary.scopeDefined=true';
      if (summary.conformanceTarget !== 'WCAG 2.2 A/AA') return 'requires evidenceSummary.conformanceTarget="WCAG 2.2 A/AA"';
      if (summary.productScopeDefined !== true) return 'requires evidenceSummary.productScopeDefined=true';
      if (summary.sampleSelectionRationaleDocumented !== true) return 'requires evidenceSummary.sampleSelectionRationaleDocumented=true';
      if (summary.completeProcessesReviewed !== true) return 'requires evidenceSummary.completeProcessesReviewed=true';
      if (summary.accessibilitySupportBaselineDefined !== true) return 'requires evidenceSummary.accessibilitySupportBaselineDefined=true';
      return null;
    case 'keyboard-focus-not-obscured':
      if (summary.keyboardTraversalCompleted !== true) return 'requires evidenceSummary.keyboardTraversalCompleted=true';
      if (summary.focusNotObscuredChecked !== true) return 'requires evidenceSummary.focusNotObscuredChecked=true';
      return null;
    case 'target-size':
      if (summary.pointerTargetReviewCompleted !== true) return 'requires evidenceSummary.pointerTargetReviewCompleted=true';
      return null;
    case 'form-errors-and-redundant-entry':
      if (summary.errorStateReviewCompleted !== true) return 'requires evidenceSummary.errorStateReviewCompleted=true';
      if (summary.redundantEntryReviewCompleted !== true) return 'requires evidenceSummary.redundantEntryReviewCompleted=true';
      return null;
    case 'accessible-authentication':
      if (summary.authFlowReviewed !== true) return 'requires evidenceSummary.authFlowReviewed=true';
      return null;
    case 'screen-reader-name-role-value':
      if (!Array.isArray(summary.assistiveTechnologies) || summary.assistiveTechnologies.length === 0) {
        return 'requires evidenceSummary.assistiveTechnologies';
      }
      if (summary.nameRoleValueReviewCompleted !== true) return 'requires evidenceSummary.nameRoleValueReviewCompleted=true';
      return null;
    case 'contrast-reflow-text-spacing':
      if (summary.contrastReviewCompleted !== true) return 'requires evidenceSummary.contrastReviewCompleted=true';
      if (summary.reflowAndTextSpacingReviewCompleted !== true) return 'requires evidenceSummary.reflowAndTextSpacingReviewCompleted=true';
      return null;
    case 'downloadable-artifacts':
      if (!Array.isArray(summary.artifactsReviewed) || summary.artifactsReviewed.length === 0) {
        return 'requires evidenceSummary.artifactsReviewed';
      }
      if (summary.downloadedArtifactReviewCompleted !== true) return 'requires evidenceSummary.downloadedArtifactReviewCompleted=true';
      return null;
    default:
      return `unknown checkpointId ${item.checkpointId}`;
  }
}

function validateCheckpoint(item, index, asOfBounds) {
  const errors = [];
  const prefix = `checkpointResults[${index}]`;

  if (!isPlainObject(item)) return { checkpointId: null, accepted: false, errors: [`${prefix} must be an object`] };
  if (!REQUIRED_CHECKPOINT_IDS.includes(item.checkpointId)) {
    errors.push(`${prefix}.checkpointId must be one of the required manual WCAG checkpoint ids`);
  }
  if (!REVIEW_STATUSES.has(item.status)) errors.push(`${prefix}.status must be a supported review status`);
  if (item.status === 'not_applicable_with_rationale' && (typeof item.applicabilityRationale !== 'string' || item.applicabilityRationale.length < 12)) {
    errors.push(`${prefix}.applicabilityRationale is required when status is not_applicable_with_rationale`);
  }
  addEvidenceDateErrors(errors, item.observedAt, `${prefix}.observedAt`);
  addNotAfterAsOfError(errors, item.observedAt, asOfBounds, `${prefix}.observedAt`);
  validateBoolean(errors, item.reviewedByHuman, `${prefix}.reviewedByHuman`);
  validateStringArray(errors, item.routesReviewed, `${prefix}.routesReviewed`, { includesAll: REQUIRED_ROUTE_PATHS });
  if (!Array.isArray(item.artifactHashes) || item.artifactHashes.length === 0 || item.artifactHashes.some((hash) => !isSha256(hash))) {
    errors.push(`${prefix}.artifactHashes must contain at least one sha256:<64 hex> hash`);
  }
  if (!isPlainObject(item.evidenceSummary)) errors.push(`${prefix}.evidenceSummary must be an object`);
  if (!Number.isInteger(item.unresolvedIssueCount) || item.unresolvedIssueCount < 0) {
    errors.push(`${prefix}.unresolvedIssueCount must be a non-negative integer`);
  }
  if (!Number.isInteger(item.remediatedIssueCount) || item.remediatedIssueCount < 0) {
    errors.push(`${prefix}.remediatedIssueCount must be a non-negative integer`);
  }
  validateCheckpointStandardRefs(errors, item, prefix);
  validateDoesNotProve(errors, item.doesNotProve, `${prefix}.doesNotProve`);

  const requirementError = checkpointSpecificError(item);
  if (requirementError) errors.push(`${prefix} ${requirementError}`);

  return {
    checkpointId: item.checkpointId || null,
    accepted: errors.length === 0 && ACCEPTED_STATUSES.has(item.status) && item.unresolvedIssueCount === 0,
    errors,
  };
}

function addDuplicateCheckpointErrors(errors, items) {
  const indexesByCheckpoint = new Map();
  items.forEach((item, index) => {
    if (!isPlainObject(item) || typeof item.checkpointId !== 'string') return;
    const indexes = indexesByCheckpoint.get(item.checkpointId) || [];
    indexes.push(index);
    indexesByCheckpoint.set(item.checkpointId, indexes);
  });

  for (const [checkpointId, indexes] of indexesByCheckpoint.entries()) {
    if (indexes.length > 1) errors.push(`checkpointResults.checkpointId must be unique; ${checkpointId} appears at indexes ${indexes.join(', ')}`);
  }
}

export function validateManualWcagEvidence({ inputPath, root: requestedRoot } = {}) {
  const baseRoot = requestedRoot || repoRoot;
  const absolutePath = resolveInputPath(inputPath, baseRoot);
  const relativePath = path.relative(baseRoot, absolutePath) || path.basename(absolutePath);

  if (!fs.existsSync(absolutePath)) {
    return {
      found: false,
      inputPath: relativePath,
      schemaVersion: SCHEMA_VERSION,
      ...manualWcagEvidenceCounts(null),
      errors: [],
      acceptedCheckpointIds: [],
      rejectedCheckpointIds: [],
      acceptedCheckpointCount: 0,
      complete: false,
      manualWcagGateSatisfied: false,
    };
  }

  const source = fs.readFileSync(absolutePath, 'utf8');
  const errors = detectSecretOrPrivatePatternIds(source)
    .map((id) => `manual WCAG evidence file contains a high-confidence secret or private-contact pattern: ${id}`);
  let parsed = null;

  try {
    parsed = JSON.parse(source);
  } catch {
    errors.push('manual WCAG evidence file must be valid JSON');
  }

  const acceptedCheckpointIds = [];
  const rejectedCheckpointIds = [];
  let asOfBounds = null;

  if (parsed) {
    if (!isPlainObject(parsed)) errors.push('manual WCAG evidence file root must be an object');
    if (parsed.schemaVersion !== SCHEMA_VERSION) errors.push(`schemaVersion must be ${SCHEMA_VERSION}`);
    addEvidenceDateErrors(errors, parsed.asOf, 'asOf');
    asOfBounds = parseEvidenceDateBounds(parsed.asOf);
    if (typeof parsed.sourceBoundary !== 'string' || parsed.sourceBoundary.length < 30) {
      errors.push('sourceBoundary must describe the reviewer-held notes, screenshots, and redaction boundary');
    }
    if (parsed.targetStandard !== 'WCAG 2.2 A/AA') errors.push('targetStandard must be WCAG 2.2 A/AA');
    if (parsed.methodology !== 'WCAG-EM') errors.push('methodology must be WCAG-EM');
    validateOfficialReferences(errors, parsed.officialReferences, asOfBounds);

    if (!isPlainObject(parsed.evaluator)) {
      errors.push('evaluator must be an object');
    } else {
      if (!isSha256(parsed.evaluator.reviewerIdHash)) errors.push('evaluator.reviewerIdHash must be a non-placeholder sha256 hash');
      validateString(errors, parsed.evaluator.role, 'evaluator.role');
      validateString(errors, parsed.evaluator.reviewType, 'evaluator.reviewType', 8);
      validateString(errors, parsed.evaluator.independenceBoundary, 'evaluator.independenceBoundary', 12);
      validateBoolean(errors, parsed.evaluator.expertiseConfirmed, 'evaluator.expertiseConfirmed');
      validateBoolean(errors, parsed.evaluator.conflictOfInterestDisclosed, 'evaluator.conflictOfInterestDisclosed');
    }

    if (!isPlainObject(parsed.evaluationScope)) {
      errors.push('evaluationScope must be an object');
    } else {
      if (typeof parsed.evaluationScope.productScope !== 'string' || parsed.evaluationScope.productScope.trim().length < 30) {
        errors.push('evaluationScope.productScope must describe the evaluated product scope');
      }
      if (typeof parsed.evaluationScope.sampleSelectionRationale !== 'string' || parsed.evaluationScope.sampleSelectionRationale.trim().length < 30) {
        errors.push('evaluationScope.sampleSelectionRationale must explain why the route sample covers launch-risk surfaces');
      }
      validateStringArray(errors, parsed.evaluationScope.routesReviewed, 'evaluationScope.routesReviewed', { includesAll: REQUIRED_ROUTE_PATHS });
      validateStringArray(errors, parsed.evaluationScope.completeProcessesReviewed, 'evaluationScope.completeProcessesReviewed', { includesAll: REQUIRED_COMPLETE_PROCESS_IDS });
      validateStringArray(errors, parsed.evaluationScope.technologiesReliedUpon, 'evaluationScope.technologiesReliedUpon');
      validateString(errors, parsed.evaluationScope.sampleSetSelectionMethod, 'evaluationScope.sampleSetSelectionMethod', 12);
      validateStringArray(errors, parsed.evaluationScope.browsers, 'evaluationScope.browsers');
      validateStringArray(errors, parsed.evaluationScope.assistiveTechnologies, 'evaluationScope.assistiveTechnologies');
      validateStringArray(errors, parsed.evaluationScope.viewports, 'evaluationScope.viewports', { includesAll: ['mobile', 'tablet', 'desktop'] });
      validateAccessibilitySupportBaseline(errors, parsed.evaluationScope.accessibilitySupportBaseline, 'evaluationScope.accessibilitySupportBaseline');
      if (parsed.evaluationScope.conformanceTarget !== 'WCAG 2.2 A/AA') {
        errors.push('evaluationScope.conformanceTarget must be WCAG 2.2 A/AA');
      }
    }

    validateReviewRecordArchive(errors, parsed.reviewRecordArchive, 'reviewRecordArchive');
    validateOwnerEvidenceArchive(errors, parsed.ownerEvidenceArchive, 'ownerEvidenceArchive');

    if (!isPlainObject(parsed.reviewerAttestation)) {
      errors.push('reviewerAttestation must be an object');
    } else {
      validateBoolean(errors, parsed.reviewerAttestation.manualReviewCompleted, 'reviewerAttestation.manualReviewCompleted');
      validateBoolean(errors, parsed.reviewerAttestation.assistiveTechnologyReviewCompleted, 'reviewerAttestation.assistiveTechnologyReviewCompleted');
      validateBoolean(errors, parsed.reviewerAttestation.noWcagConformanceClaim, 'reviewerAttestation.noWcagConformanceClaim');
      validateBoolean(errors, parsed.reviewerAttestation.noProcurementApprovalClaim, 'reviewerAttestation.noProcurementApprovalClaim');
      validateBoolean(errors, parsed.reviewerAttestation.ownerHeldRawNotes, 'reviewerAttestation.ownerHeldRawNotes');
    }

    if (!Array.isArray(parsed.checkpointResults)) {
      errors.push('checkpointResults must be an array');
    } else {
      addDuplicateCheckpointErrors(errors, parsed.checkpointResults);
      parsed.checkpointResults.forEach((item, index) => {
        const result = validateCheckpoint(item, index, asOfBounds);
        if (result.accepted) acceptedCheckpointIds.push(result.checkpointId);
        if (!result.accepted && result.checkpointId) rejectedCheckpointIds.push(result.checkpointId);
        errors.push(...result.errors);
      });
    }
  }

  const accepted = [...new Set(acceptedCheckpointIds)];
  const complete = REQUIRED_CHECKPOINT_IDS.every((checkpointId) => accepted.includes(checkpointId));
  const counts = manualWcagEvidenceCounts(parsed);

  return {
    found: true,
    inputPath: relativePath,
    schemaVersion: SCHEMA_VERSION,
    ...counts,
    errors,
    acceptedCheckpointIds: accepted,
    rejectedCheckpointIds: [...new Set(rejectedCheckpointIds)],
    acceptedCheckpointCount: accepted.length,
    complete: errors.length === 0 && complete,
    manualWcagGateSatisfied: errors.length === 0 && complete,
    evidenceHash: `sha256:${sha256(source)}`,
  };
}

export function renderArtifact(result) {
  const gateIds = ['manual_wcag_evidence'];
  const ownerEvidenceArchiveRequirements = MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS;
  const rejectedCheckpointIds = result.rejectedCheckpointIds || [];
  const doesNotProve = [
    'WCAG conformance statement',
    'Legal compliance',
    'Institutional procurement approval',
    'Assistive-technology coverage beyond the reviewed matrix',
    'Future accessibility after code changes',
  ];
  const manualInterventionIfMissing = [
    'Complete a WCAG-EM-scoped manual review over the commercial route sample.',
    'Document the evaluated product scope, route-sample rationale, complete processes reviewed, and browser/assistive-technology support baseline combinations.',
    'Record reviewer type, independence/conflict boundary, technologies relied upon, sample selection method, evaluation-tool/version notes, owner-held WCAG-EM report-tool export, sample/navigation archive, issue-log retention, ownerEvidenceArchive policy metadata, and re-evaluation trigger after material UI changes.',
    'Review keyboard focus, focus-not-obscured behavior, target size, form errors, redundant entry, authentication, screen-reader name/role/value, contrast, reflow, text spacing, and downloadable artifacts.',
    `Store only redacted metadata in ${DEFAULT_INPUT_PATH} or pass --evidence <path>; keep raw notes, screenshots, recordings, reviewer identity, reviewer profile URLs, meeting/calendar links, assistive-technology transcripts, issue tracker details, evaluation-tool output, sample archives, and artifact hash source maps owner-held.`,
    `Validate with npm run verify:manual-wcag-evidence -- --evidence ${DEFAULT_INPUT_PATH} --require-complete before relying on the manual accessibility gate.`,
    'Run npm run verify:remediation-gates -- --manual-wcag-evidence <path> with live and commercial evidence paths for final closeout.',
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
      : result.manualWcagGateSatisfied
        ? 'passed'
        : result.found
          ? 'incomplete_evidence'
          : 'no_local_evidence',
    confidence: 'bounded_manual_wcag_evidence_metadata',
    caveat:
      'This verifier validates redacted manual WCAG evidence metadata only. Raw reviewer notes, screenshots, recordings, reviewer profile URLs, meeting/calendar links, assistive-technology transcripts, issue logs, evaluation-tool output, sample archives, and private identities remain owner-held. It does not create a WCAG conformance claim, legal compliance claim, procurement approval, or accessibility warranty.',
    requiredCheckpointIds: REQUIRED_CHECKPOINT_IDS,
    requiredCheckpointCount: REQUIRED_MANUAL_WCAG_CHECKPOINT_COUNT,
    requiredRouteCount: REQUIRED_MANUAL_WCAG_ROUTE_COUNT,
    requiredCompleteProcessIds: REQUIRED_COMPLETE_PROCESS_IDS,
    requiredCompleteProcessCount: REQUIRED_COMPLETE_PROCESS_IDS.length,
    requiredAccessibilitySupportBaselineCount: REQUIRED_ACCESSIBILITY_SUPPORT_BASELINE_COUNT,
    ownerEvidenceArchiveRequirements,
    ownerEvidenceArchiveRequirementCount: ownerEvidenceArchiveRequirements.length,
    requiredOwnerEvidenceArchiveRequirementCount: ownerEvidenceArchiveRequirements.length,
    requiredOfficialReferenceIds: OFFICIAL_REFERENCE_REQUIREMENTS.map((reference) => reference.id),
    requiredOfficialReferenceCount: REQUIRED_MANUAL_WCAG_OFFICIAL_REFERENCE_COUNT,
    checkpointStandardRefs: CHECKPOINT_STANDARD_REFS,
    acceptedCheckpointIds: result.acceptedCheckpointIds,
    acceptedCheckpointCount: result.acceptedCheckpointCount || 0,
    rejectedCheckpointIds,
    rejectedCheckpointCount: rejectedCheckpointIds.length,
    checkpointResultCount: result.checkpointResultCount || 0,
    routeReviewedCount: result.routeReviewedCount || 0,
    completeProcessReviewedCount: result.completeProcessReviewedCount || 0,
    accessibilitySupportBaselineCount: result.accessibilitySupportBaselineCount || 0,
    officialReferenceCount: result.officialReferenceCount || 0,
    complete: result.complete,
    manualWcagGateSatisfied: result.manualWcagGateSatisfied,
    evidenceHash: result.evidenceHash || null,
    doesNotProve,
    doesNotProveCount: doesNotProve.length,
    manualInterventionIfMissing,
    manualInterventionIfMissingCount: manualInterventionIfMissing.length,
    nextCommands: {
      validateManualWcagEvidence: `npm run verify:manual-wcag-evidence -- --evidence ${DEFAULT_INPUT_PATH} --require-complete`,
      finalReadOnlyLedger: 'npm run verify:remediation-gates -- --live-evidence <path> --commercial-evidence <path> --manual-wcag-evidence <path> --require-complete',
      refreshTrackedLedger: 'npm run verify:remediation-gates:write -- --live-evidence <path> --commercial-evidence <path> --manual-wcag-evidence <path> --require-complete',
    },
    errorCount: errors.length,
    errors,
  };
}

export function validateRenderedArtifactCounts(artifact) {
  const errors = [];
  const expectedGateIdCount = Array.isArray(artifact?.gateIds) ? artifact.gateIds.length : null;
  const expectedOwnerEvidenceArchiveRequirementCount = Array.isArray(artifact?.ownerEvidenceArchiveRequirements)
    ? artifact.ownerEvidenceArchiveRequirements.length
    : null;
  const expectedRejectedCheckpointCount = Array.isArray(artifact?.rejectedCheckpointIds)
    ? artifact.rejectedCheckpointIds.length
    : null;
  const expectedDoesNotProveCount = Array.isArray(artifact?.doesNotProve) ? artifact.doesNotProve.length : null;
  const expectedManualInterventionIfMissingCount = Array.isArray(artifact?.manualInterventionIfMissing)
    ? artifact.manualInterventionIfMissing.length
    : null;
  const expectedErrorCount = Array.isArray(artifact?.errors) ? artifact.errors.length : null;

  if (artifact?.gateIdCount !== expectedGateIdCount) {
    errors.push(`artifact_gate_id_count_mismatch expected ${expectedGateIdCount} got ${artifact?.gateIdCount}`);
  }
  if (artifact?.ownerEvidenceArchiveRequirementCount !== expectedOwnerEvidenceArchiveRequirementCount) {
    errors.push(`artifact_owner_evidence_archive_requirement_count_mismatch expected ${expectedOwnerEvidenceArchiveRequirementCount} got ${artifact?.ownerEvidenceArchiveRequirementCount}`);
  }
  if (artifact?.requiredOwnerEvidenceArchiveRequirementCount !== expectedOwnerEvidenceArchiveRequirementCount) {
    errors.push(`artifact_required_owner_evidence_archive_requirement_count_mismatch expected ${expectedOwnerEvidenceArchiveRequirementCount} got ${artifact?.requiredOwnerEvidenceArchiveRequirementCount}`);
  }
  if (artifact?.rejectedCheckpointCount !== expectedRejectedCheckpointCount) {
    errors.push(`artifact_rejected_checkpoint_count_mismatch expected ${expectedRejectedCheckpointCount} got ${artifact?.rejectedCheckpointCount}`);
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
  const requireAny = hasFlag('--require-any');
  const requireComplete = hasFlag('--require-complete') || hasFlag('--require-all');
  const result = validateManualWcagEvidence({ inputPath });
  const artifact = renderArtifact(result);
  const artifactCountErrors = validateRenderedArtifactCounts(artifact);
  const allErrors = [...result.errors, ...artifactCountErrors];

  if (shouldWrite && artifactCountErrors.length === 0) {
    fs.mkdirSync(path.join(repoRoot, 'docs/commercialization'), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, OUTPUT_PATH), `${JSON.stringify(artifact, null, 2)}\n`);
  }

  console.log(JSON.stringify({
    ok:
      result.errors.length === 0 &&
      (!requireAny || result.acceptedCheckpointIds.length > 0) &&
      (!requireComplete || result.manualWcagGateSatisfied),
    found: result.found,
    inputPath: result.inputPath,
    requiredCheckpointIds: REQUIRED_CHECKPOINT_IDS,
    requiredCheckpointCount: REQUIRED_MANUAL_WCAG_CHECKPOINT_COUNT,
    requiredRouteCount: REQUIRED_MANUAL_WCAG_ROUTE_COUNT,
    requiredCompleteProcessCount: REQUIRED_COMPLETE_PROCESS_IDS.length,
    requiredAccessibilitySupportBaselineCount: REQUIRED_ACCESSIBILITY_SUPPORT_BASELINE_COUNT,
    requiredOwnerEvidenceArchiveRequirementCount: MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS.length,
    requiredOfficialReferenceCount: REQUIRED_MANUAL_WCAG_OFFICIAL_REFERENCE_COUNT,
    acceptedCheckpointIds: result.acceptedCheckpointIds,
    acceptedCheckpointCount: result.acceptedCheckpointCount || 0,
    rejectedCheckpointIds: result.rejectedCheckpointIds,
    checkpointResultCount: result.checkpointResultCount || 0,
    routeReviewedCount: result.routeReviewedCount || 0,
    completeProcessReviewedCount: result.completeProcessReviewedCount || 0,
    accessibilitySupportBaselineCount: result.accessibilitySupportBaselineCount || 0,
    officialReferenceCount: result.officialReferenceCount || 0,
    complete: result.complete,
    manualWcagGateSatisfied: result.manualWcagGateSatisfied,
    errorCount: allErrors.length,
    errors: allErrors,
    wrote: shouldWrite && artifactCountErrors.length === 0 ? OUTPUT_PATH : null,
  }, null, 2));

  if (allErrors.length > 0) {
    process.exitCode = 1;
  } else if (requireAny && result.acceptedCheckpointIds.length === 0) {
    console.error('No accepted manual WCAG evidence checkpoint was found.');
    process.exitCode = 1;
  } else if (requireComplete && !result.manualWcagGateSatisfied) {
    console.error('Manual WCAG evidence is incomplete.');
    process.exitCode = 1;
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) main();
