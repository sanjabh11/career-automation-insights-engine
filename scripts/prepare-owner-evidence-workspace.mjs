#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS,
  OFFICIAL_REFERENCE_REQUIREMENTS,
  REQUIRED_ACCESSIBILITY_SUPPORT_BASELINE_COUNT,
  REQUIRED_CHECKPOINT_IDS,
  REQUIRED_COMPLETE_PROCESS_IDS,
  REQUIRED_ROUTE_PATHS,
} from './verify-manual-wcag-evidence.mjs';
import {
  LIVE_GATE_EVIDENCE_GATE_IDS,
  validateLiveGateEvidence,
} from './lib/liveGateEvidence.mjs';

const root = process.cwd();
const args = process.argv.slice(2);

const DEFAULT_ENV_PATH = '.env.local';
const DEFAULT_INTAKE_PATH = 'docs/commercialization/commercial-evidence-intake.local.json';
const DEFAULT_MANUAL_WCAG_PATH = 'docs/commercialization/manual-wcag-evidence.local.json';
const DEFAULT_LIVE_EVIDENCE_PATH = 'docs/commercialization/live-gate-evidence.local.json';
const DEFAULT_COMMERCIAL_RECORDS_PATH = 'docs/commercialization/commercial-evidence-records.local.json';
const INTAKE_TEMPLATE_PATH = 'docs/commercialization/commercial-evidence-intake-template.json';
const LIVE_PROOF_RUN_PACKET_PATH = 'docs/commercialization/live-proof-run-packet-latest.md';
const LIVE_PROOF_RUN_MATRIX_PATH = 'docs/commercialization/live-proof-run-matrix-latest.csv';
const COMMERCIAL_EVIDENCE_INTAKE_PACKET_PATH = 'docs/commercialization/commercial-evidence-intake-packet-latest.md';
const COMMERCIAL_EVIDENCE_INTAKE_MATRIX_PATH = 'docs/commercialization/commercial-evidence-intake-matrix-latest.csv';
const MANUAL_WCAG_TEMPLATE_PATH = 'docs/commercialization/manual-wcag-evidence-template.json';
const MANUAL_WCAG_REVIEW_PACKET_PATH = 'docs/commercialization/manual-wcag-review-packet-latest.md';
const MANUAL_WCAG_REVIEW_MATRIX_PATH = 'docs/commercialization/manual-wcag-review-matrix-latest.csv';

const liveProofArtifacts = [
  {
    readinessId: 'stripe_test_checkout',
    gateId: 'real_stripe_test_checkout',
    path: 'docs/commercialization/stripe-test-checkout-proof-latest.json',
    command: 'npm run verify:stripe-test-checkout',
  },
  {
    readinessId: 'production_calibration',
    gateId: 'production_calibration_run',
    path: 'docs/commercialization/production-calibration-proof-latest.json',
    command: 'npm run verify:production-calibration',
  },
  {
    readinessId: 'authenticated_live_artifact_e2e',
    gateId: 'authenticated_live_artifact_e2e',
    path: 'docs/commercialization/live-auth-e2e-proof-latest.json',
    command: 'npm run verify:commercial-live-auth-e2e',
  },
  {
    readinessId: 'live_mrr_gt_zero',
    gateId: 'live_mrr_gt_zero',
    path: 'docs/commercialization/stripe-live-mrr-proof-latest.json',
    command: 'npm run verify:stripe-live-mrr',
  },
];

const liveProofGroups = [
  {
    id: 'stripe_test_checkout',
    command: 'npm run verify:stripe-test-checkout',
    stripeKeyModeRequirement: {
      requiredMode: 'test',
      alternatives: ['STRIPE_TEST_SECRET_KEY', 'STRIPE_TEST_RESTRICTED_KEY'],
      action: 'provide explicit STRIPE_TEST_SECRET_KEY or STRIPE_TEST_RESTRICTED_KEY with a sk_test_/rk_test_ value',
    },
    requiredAnyOf: [
      ['SUPABASE_URL', 'VITE_SUPABASE_URL'],
      ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'],
      ['LIVE_SUPABASE_TEST_USER_EMAIL', 'STRIPE_TEST_USER_EMAIL'],
      ['LIVE_SUPABASE_TEST_USER_PASSWORD', 'STRIPE_TEST_USER_PASSWORD'],
      ['STRIPE_TEST_SECRET_KEY', 'STRIPE_TEST_RESTRICTED_KEY'],
      ['STRIPE_TEST_PRICE_ID', 'APO_STRIPE_TEST_PRICE_ID'],
    ],
  },
  {
    id: 'production_calibration',
    command: 'npm run verify:production-calibration',
    requiredAnyOf: [
      ['SUPABASE_URL', 'VITE_SUPABASE_URL'],
      ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'],
    ],
  },
  {
    id: 'authenticated_live_artifact_e2e',
    command: 'npm run verify:commercial-live-auth-e2e',
    requiredAnyOf: [
      ['SUPABASE_URL', 'VITE_SUPABASE_URL'],
      ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'],
      ['LIVE_SUPABASE_TEST_USER_EMAIL'],
      ['LIVE_SUPABASE_TEST_USER_PASSWORD'],
    ],
  },
  {
    id: 'live_mrr_gt_zero',
    command: 'npm run verify:stripe-live-mrr',
    stripeKeyModeRequirement: {
      requiredMode: 'live',
      alternatives: ['STRIPE_LIVE_SECRET_KEY', 'STRIPE_LIVE_RESTRICTED_KEY', 'STRIPE_SECRET_KEY'],
      action: 'provide STRIPE_LIVE_SECRET_KEY, STRIPE_LIVE_RESTRICTED_KEY, or STRIPE_SECRET_KEY with a sk_live_/rk_live_ value',
    },
    requiredAnyOf: [
      ['STRIPE_LIVE_SECRET_KEY', 'STRIPE_LIVE_RESTRICTED_KEY', 'STRIPE_SECRET_KEY'],
    ],
  },
];

function hasFlag(name) {
  return args.includes(name);
}

function readFlagValue(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

function resolvePath(relativeOrAbsolute) {
  return path.isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : path.join(root, relativeOrAbsolute);
}

function displayPath(absolutePath) {
  return path.relative(root, absolutePath) || path.basename(absolutePath);
}

function stripOuterQuotes(value) {
  const trimmed = String(value || '').trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function parseEnvAssignments(source) {
  const assignments = new Map();
  for (const line of String(source || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) assignments.set(match[1], stripOuterQuotes(match[2]));
  }
  return assignments;
}

function isBlankOrPlaceholderValue(value) {
  const normalized = String(value || '').trim();
  return (
    normalized.length === 0 ||
    /replace-with|placeholder|sample-only|todo|owner-held/i.test(normalized)
  );
}

function stripeKeyMode(value) {
  if (!value) return 'missing';
  if (/^(sk|rk)_test_/.test(String(value))) return 'test';
  if (/^(sk|rk)_live_/.test(String(value))) return 'live';
  return 'unknown';
}

function resolveKeyWithMode(alternatives, envFileAssignments) {
  const processKey = alternatives.find((key) => !isBlankOrPlaceholderValue(process.env[key]));
  if (processKey) {
    return {
      key: processKey,
      source: 'process_env',
      mode: stripeKeyMode(process.env[processKey]),
    };
  }

  const fileKey = alternatives.find((key) => {
    return envFileAssignments.has(key) && !isBlankOrPlaceholderValue(envFileAssignments.get(key));
  });
  if (fileKey) {
    return {
      key: fileKey,
      source: 'env_file',
      mode: stripeKeyMode(envFileAssignments.get(fileKey)),
    };
  }

  return null;
}

function expectedEnvKeyNames() {
  const keys = new Set(['COMMERCIAL_EVIDENCE_HASH_SALT']);
  for (const group of liveProofGroups) {
    for (const alternatives of group.requiredAnyOf) {
      alternatives.forEach((key) => keys.add(key));
    }
    if (group.stripeKeyModeRequirement) {
      group.stripeKeyModeRequirement.alternatives.forEach((key) => keys.add(key));
    }
  }
  return [...keys].sort();
}

function envFileStatus(envPath, exists, assignments = new Map()) {
  const expectedKeys = expectedEnvKeyNames();
  const expectedKeySet = new Set(expectedKeys);
  const presentExpectedKeys = expectedKeys.filter((key) => assignments.has(key));
  const blankOrPlaceholderExpectedKeys = presentExpectedKeys
    .filter((key) => isBlankOrPlaceholderValue(assignments.get(key)))
    .sort();
  const extraKeyCount = [...assignments.keys()].filter((key) => !expectedKeySet.has(key)).length;

  return {
    path: displayPath(resolvePath(envPath)),
    exists,
    keyNamesRedacted: true,
    expectedKeyCount: expectedKeys.length,
    presentExpectedKeyCount: presentExpectedKeys.length,
    blankOrPlaceholderExpectedKeys,
    extraKeyCount,
    redactionBoundary:
      'Only expected owner-proof environment key names are reported. Extra local key names and all values are redacted from repo artifacts and command output.',
  };
}

function readEnvFileStatus(envPath) {
  const absolutePath = resolvePath(envPath);
  if (!fs.existsSync(absolutePath)) {
    return {
      status: envFileStatus(envPath, false),
      assignments: new Map(),
    };
  }
  const assignments = parseEnvAssignments(fs.readFileSync(absolutePath, 'utf8'));
  return {
    status: envFileStatus(envPath, true, assignments),
    assignments,
  };
}

function groupStatus(group, envFileAssignments) {
  const missingGroups = [];
  const presentGroups = [];
  const loadFromEnvFile = [];
  const blankOrPlaceholderEnvFile = [];
  const invalidKeyModeGroups = [];

  for (const alternatives of group.requiredAnyOf) {
    const processMatch = alternatives.find((key) => !isBlankOrPlaceholderValue(process.env[key]));
    const fileReadyMatch = alternatives.find((key) => {
      return envFileAssignments.has(key) && !isBlankOrPlaceholderValue(envFileAssignments.get(key));
    });
    const fileBlankMatch = alternatives.find((key) => {
      return envFileAssignments.has(key) && isBlankOrPlaceholderValue(envFileAssignments.get(key));
    });
    if (processMatch) {
      presentGroups.push({ alternatives, source: 'process_env', key: processMatch });
      continue;
    }
    if (fileReadyMatch) {
      presentGroups.push({ alternatives, source: 'env_file', key: fileReadyMatch });
      loadFromEnvFile.push(fileReadyMatch);
      continue;
    }
    if (fileBlankMatch) {
      blankOrPlaceholderEnvFile.push(fileBlankMatch);
      continue;
    }
    missingGroups.push(alternatives);
  }

  let stripeKeyModeRequirement = null;
  if (group.stripeKeyModeRequirement) {
    const requirement = group.stripeKeyModeRequirement;
    const resolved = resolveKeyWithMode(requirement.alternatives, envFileAssignments);
    stripeKeyModeRequirement = {
      requiredMode: requirement.requiredMode,
      resolvedKey: resolved?.key || null,
      resolvedSource: resolved?.source || null,
      resolvedMode: resolved?.mode || 'missing',
    };
    if (resolved && resolved.mode !== requirement.requiredMode) {
      invalidKeyModeGroups.push(requirement.action);
      const loadIndex = loadFromEnvFile.indexOf(resolved.key);
      if (loadIndex >= 0) loadFromEnvFile.splice(loadIndex, 1);
    }
  }

  const counts = {
    requiredGroupCount: group.requiredAnyOf.length,
    presentGroupCount: presentGroups.length,
    missingGroupCount: missingGroups.length,
    blankOrPlaceholderEnvFileCount: blankOrPlaceholderEnvFile.length,
    invalidKeyModeCount: invalidKeyModeGroups.length,
    loadFromEnvFileCount: loadFromEnvFile.length,
  };

  return {
    id: group.id,
    command: group.command,
    ...counts,
    ready:
      missingGroups.length === 0 &&
      blankOrPlaceholderEnvFile.length === 0 &&
      invalidKeyModeGroups.length === 0 &&
      loadFromEnvFile.length === 0,
    envFileCompleteButNotLoaded:
      missingGroups.length === 0 &&
      blankOrPlaceholderEnvFile.length === 0 &&
      invalidKeyModeGroups.length === 0 &&
      loadFromEnvFile.length > 0,
    missingGroups,
    blankOrPlaceholderEnvFile,
    invalidKeyModeGroups,
    stripeKeyModeRequirement,
    presentGroups,
    loadFromEnvFile,
  };
}

function buildEnvTemplate() {
  return `# APO owner evidence local environment
# Keep this file untracked. Do not paste values in chat or commit it.
# Load for owner-run verifiers with:
#   set -a; source .env.local; set +a

SUPABASE_URL=
SUPABASE_ANON_KEY=
LIVE_SUPABASE_TEST_USER_EMAIL=
LIVE_SUPABASE_TEST_USER_PASSWORD=
STRIPE_TEST_SECRET_KEY=
STRIPE_TEST_PRICE_ID=
STRIPE_LIVE_SECRET_KEY=
COMMERCIAL_EVIDENCE_HASH_SALT=
`;
}

function createIfMissing(absolutePath, source, created, skippedExisting) {
  if (fs.existsSync(absolutePath)) {
    skippedExisting.push(displayPath(absolutePath));
    return false;
  }
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, source);
  created.push(displayPath(absolutePath));
  return true;
}

function countPlaceholders(value) {
  const source = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  const matches = source.match(/replace-with|placeholder|000000|sample-only/gi);
  return matches ? matches.length : 0;
}

function commercialEvidenceIntakeCounts(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  if (!Array.isArray(value.designPartnerCommitments) && !Array.isArray(value.documentedOutcomes)) {
    return null;
  }
  return {
    designPartnerCommitmentCount: Array.isArray(value.designPartnerCommitments)
      ? value.designPartnerCommitments.length
      : 0,
    documentedOutcomeCount: Array.isArray(value.documentedOutcomes)
      ? value.documentedOutcomes.length
      : 0,
  };
}

function readJsonValue(filePath) {
  try {
    return JSON.parse(fs.readFileSync(resolvePath(filePath), 'utf8'));
  } catch {
    return null;
  }
}

function manualWcagEvidenceCounts(value, sourcePath) {
  const root = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    sourcePath,
    requiredCheckpointCount: REQUIRED_CHECKPOINT_IDS.length,
    requiredRouteCount: REQUIRED_ROUTE_PATHS.length,
    requiredCompleteProcessCount: REQUIRED_COMPLETE_PROCESS_IDS.length,
    requiredAccessibilitySupportBaselineCount: REQUIRED_ACCESSIBILITY_SUPPORT_BASELINE_COUNT,
    requiredOfficialReferenceCount: OFFICIAL_REFERENCE_REQUIREMENTS.length,
    requiredOwnerEvidenceArchiveRequirementCount: MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS.length,
    ownerEvidenceArchiveRequirementCount:
      root.ownerEvidenceArchive && typeof root.ownerEvidenceArchive === 'object' && !Array.isArray(root.ownerEvidenceArchive)
        ? MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS.filter(
            (requirement) => root.ownerEvidenceArchive[requirement] === true,
          ).length
        : 0,
    checkpointResultCount: Array.isArray(root.checkpointResults) ? root.checkpointResults.length : 0,
    routeReviewedCount: Array.isArray(root.evaluationScope?.routesReviewed) ? root.evaluationScope.routesReviewed.length : 0,
    completeProcessReviewedCount: Array.isArray(root.evaluationScope?.completeProcessesReviewed)
      ? root.evaluationScope.completeProcessesReviewed.length
      : 0,
    accessibilitySupportBaselineCount: Array.isArray(root.evaluationScope?.accessibilitySupportBaseline)
      ? root.evaluationScope.accessibilitySupportBaseline.length
      : 0,
    officialReferenceCount: Array.isArray(root.officialReferences) ? root.officialReferences.length : 0,
  };
}

function readJsonStatus(filePath) {
  const absolutePath = resolvePath(filePath);
  if (!fs.existsSync(absolutePath)) {
    return { path: displayPath(absolutePath), exists: false, validJson: false, placeholderCount: null };
  }
  const source = fs.readFileSync(absolutePath, 'utf8');
  try {
    const parsed = JSON.parse(source);
    const status = {
      path: displayPath(absolutePath),
      exists: true,
      validJson: true,
      schemaVersion: parsed.schemaVersion || null,
      placeholderCount: countPlaceholders(parsed),
    };
    const intakeCounts = commercialEvidenceIntakeCounts(parsed);
    if (intakeCounts) status.commercialEvidenceIntakeCounts = intakeCounts;
    return status;
  } catch {
    return {
      path: displayPath(absolutePath),
      exists: true,
      validJson: false,
      placeholderCount: countPlaceholders(source),
    };
  }
}

function readManualWcagEvidenceStatus(filePath) {
  const status = readJsonStatus(filePath);
  const countsSourcePath = status.exists && status.validJson ? filePath : MANUAL_WCAG_TEMPLATE_PATH;
  const countsSource = readJsonValue(countsSourcePath);
  status.manualWcagEvidenceCounts = manualWcagEvidenceCounts(countsSource, countsSourcePath);
  return status;
}

function commercialIntakeOwnerAction(status) {
  const packetHint =
    `run npm run generate:commercial-evidence-intake-packet and use ${COMMERCIAL_EVIDENCE_INTAKE_PACKET_PATH} plus ` +
    `${COMMERCIAL_EVIDENCE_INTAKE_MATRIX_PATH} as the owner-held partner/outcome worksheet before hashing proof artifacts`;

  if (!status.exists) {
    return `${status.path}: ${packetHint}; create from ${INTAKE_TEMPLATE_PATH}`;
  }

  const actions = [];
  const counts = status.commercialEvidenceIntakeCounts;
  if (counts && counts.designPartnerCommitmentCount < 3) {
    actions.push(`add ${3 - counts.designPartnerCommitmentCount} designPartnerCommitments record(s) so the local intake has at least three permissioned partner slots`);
  }
  if (counts && counts.documentedOutcomeCount < 1) {
    actions.push('add at least one documentedOutcomes record');
  }
  if (status.placeholderCount > 0) {
    actions.push(`${packetHint}; run npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>, then replace placeholder partner/outcome refs, proof artifact hashes/types, integrity attestations, ownerEvidenceArchive policy metadata, measured-outcome scope fields, rawEvidenceOwnerHeld attestation, and hash salt`);
  }

  return actions.length > 0 ? `${status.path}: ${actions.join('; ')}` : null;
}

function manualWcagOwnerAction(status) {
  const counts = status.manualWcagEvidenceCounts || {};
  const shapeSummary =
    `template requires ${counts.requiredCheckpointCount || REQUIRED_CHECKPOINT_IDS.length} checkpoint(s), ` +
    `${counts.requiredRouteCount || REQUIRED_ROUTE_PATHS.length} route(s), and ` +
    `${counts.requiredCompleteProcessCount || REQUIRED_COMPLETE_PROCESS_IDS.length} complete process(es), ` +
    `${counts.requiredAccessibilitySupportBaselineCount || REQUIRED_ACCESSIBILITY_SUPPORT_BASELINE_COUNT} accessibility-support baseline combination(s), and ` +
    `${counts.requiredOfficialReferenceCount || OFFICIAL_REFERENCE_REQUIREMENTS.length} official W3C/WAI reference(s), plus ` +
    `${counts.requiredOwnerEvidenceArchiveRequirementCount || MANUAL_WCAG_OWNER_EVIDENCE_ARCHIVE_REQUIREMENTS.length} ownerEvidenceArchive policy field(s)`;
  const packetHint =
    `run npm run generate:manual-wcag-review-packet and use ${MANUAL_WCAG_REVIEW_PACKET_PATH}, ` +
    `${MANUAL_WCAG_REVIEW_MATRIX_PATH}, and the W3C WCAG-EM Report Tool as the owner-held review worksheet/report export before hashing proof artifacts`;

  if (!status.exists) {
    return `${status.path}: ${packetHint}; create from ${MANUAL_WCAG_TEMPLATE_PATH} after the owner-held WCAG-EM review is complete (${shapeSummary}), including reviewer disclosure, technologies relied upon, sample-selection method, review-record archive attestations, owner-held WCAG-EM report-tool export, and ownerEvidenceArchive policy metadata, then run npm run hash:owner-evidence-artifacts -- <local WCAG review proof files> before replacing artifactHashes`;
  }

  if (!status.validJson) {
    return `${status.path}: ${packetHint}; repair valid JSON from ${MANUAL_WCAG_TEMPLATE_PATH} (${shapeSummary}) before hashing owner-held manual WCAG review artifacts into artifactHashes and completing reviewer disclosure, review-record archive fields, and ownerEvidenceArchive policy metadata`;
  }

  const actions = [];
  if (counts.checkpointResultCount < counts.requiredCheckpointCount) {
    actions.push(`add ${counts.requiredCheckpointCount - counts.checkpointResultCount} checkpointResults record(s)`);
  }
  if (counts.routeReviewedCount < counts.requiredRouteCount) {
    actions.push(`include all ${counts.requiredRouteCount} required commercial route(s) in evaluationScope.routesReviewed`);
  }
  if (counts.completeProcessReviewedCount < counts.requiredCompleteProcessCount) {
    actions.push(`include all ${counts.requiredCompleteProcessCount} required complete process(es) in evaluationScope.completeProcessesReviewed`);
  }
  if (counts.accessibilitySupportBaselineCount < counts.requiredAccessibilitySupportBaselineCount) {
    actions.push(`include at least ${counts.requiredAccessibilitySupportBaselineCount} browser/assistive-technology support baseline combination(s) in evaluationScope.accessibilitySupportBaseline`);
  }
  if (counts.officialReferenceCount < counts.requiredOfficialReferenceCount) {
    actions.push(`include all ${counts.requiredOfficialReferenceCount} required official W3C/WAI reference(s)`);
  }
  if (counts.ownerEvidenceArchiveRequirementCount < counts.requiredOwnerEvidenceArchiveRequirementCount) {
    actions.push(`complete all ${counts.requiredOwnerEvidenceArchiveRequirementCount} ownerEvidenceArchive policy field(s)`);
  }
  if (status.placeholderCount > 0) {
    actions.push(`${packetHint}; run npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>, then replace placeholder artifactHashes with owner-held manual WCAG evidence hashes and complete reviewer disclosure, technologies relied upon, sample-selection method, review-record archive attestations, and ownerEvidenceArchive policy metadata`);
  }

  return actions.length > 0 ? `${status.path}: ${actions.join('; ')}` : null;
}

function proofArtifactStatus(filePath) {
  const status = readJsonStatus(filePath);
  if (!status.exists || !status.validJson) return { ...status, acceptedSourceArtifact: false, artifactStatus: null };
  const artifact = JSON.parse(fs.readFileSync(resolvePath(filePath), 'utf8'));
  return {
    ...status,
    artifactStatus: artifact.status || null,
    acceptedSourceArtifact: artifact.status === 'passed',
  };
}

function liveGateEvidenceStatus(filePath) {
  const status = readJsonStatus(filePath);
  if (!status.exists || !status.validJson) {
    return {
      ...status,
      complete: false,
      acceptedGateIds: [],
      rejectedGateIds: [],
      errorCount: 0,
      errors: [],
    };
  }

  const validation = validateLiveGateEvidence({ root, evidencePath: filePath });
  const acceptedGateIds = validation.acceptedGateIds || [];
  const acceptedGateIdSet = new Set(acceptedGateIds);
  return {
    ...status,
    complete: LIVE_GATE_EVIDENCE_GATE_IDS.every((gateId) => acceptedGateIdSet.has(gateId)),
    acceptedGateIds,
    rejectedGateIds: validation.rejectedGateIds || [],
    errorCount: validation.errors?.length || 0,
    errors: validation.errors || [],
  };
}

function ownerPrepBlockerPrefixesForGate(gateId) {
  const mapping = {
    manual_wcag_evidence: ['docs/commercialization/manual-wcag-evidence.local.json:'],
    real_stripe_test_checkout: [
      'real_stripe_test_checkout:',
      'stripe_test_checkout:',
      'docs/commercialization/stripe-test-checkout-proof-latest.json:',
    ],
    production_calibration_run: ['production_calibration_run:', 'production_calibration:'],
    authenticated_live_artifact_e2e: ['authenticated_live_artifact_e2e:'],
    live_mrr_gt_zero: [
      'live_mrr_gt_zero:',
      'docs/commercialization/stripe-live-mrr-proof-latest.json:',
    ],
    three_committed_partners: ['docs/commercialization/commercial-evidence-intake.local.json:'],
    documented_outcomes: ['docs/commercialization/commercial-evidence-intake.local.json:'],
  };
  return mapping[gateId] || [];
}

function ownerActionNeededByGate(ownerActionNeeded) {
  const gateIds = [
    'manual_wcag_evidence',
    'real_stripe_test_checkout',
    'production_calibration_run',
    'authenticated_live_artifact_e2e',
    'live_mrr_gt_zero',
    'three_committed_partners',
    'documented_outcomes',
  ];

  return Object.fromEntries(
    gateIds.map((gateId) => {
      const prefixes = ownerPrepBlockerPrefixesForGate(gateId);
      const blockers = ownerActionNeeded.filter((action) => prefixes.some((prefix) => action.startsWith(prefix)));
      return [gateId, blockers];
    })
  );
}

function main() {
  const shouldWrite = hasFlag('--write');
  const envPath = readFlagValue('--env-path', DEFAULT_ENV_PATH);
  const liveEvidencePath = readFlagValue('--live-evidence', DEFAULT_LIVE_EVIDENCE_PATH);
  const intakePath = readFlagValue('--commercial-intake', DEFAULT_INTAKE_PATH);
  const commercialRecordsPath = readFlagValue('--commercial-evidence', DEFAULT_COMMERCIAL_RECORDS_PATH);
  const manualWcagPath = readFlagValue('--manual-wcag-evidence', DEFAULT_MANUAL_WCAG_PATH);
  const envAbsolutePath = resolvePath(envPath);
  const intakeAbsolutePath = resolvePath(intakePath);
  const manualWcagAbsolutePath = resolvePath(manualWcagPath);
  const created = [];
  const skippedExisting = [];

  if (shouldWrite) {
    createIfMissing(envAbsolutePath, buildEnvTemplate(), created, skippedExisting);
    const intakeTemplate = fs.readFileSync(resolvePath(INTAKE_TEMPLATE_PATH), 'utf8');
    createIfMissing(intakeAbsolutePath, intakeTemplate, created, skippedExisting);
    const manualWcagTemplate = fs.readFileSync(resolvePath(MANUAL_WCAG_TEMPLATE_PATH), 'utf8');
    createIfMissing(manualWcagAbsolutePath, manualWcagTemplate, created, skippedExisting);
  }

  const { status: envFile, assignments: envFileAssignments } = readEnvFileStatus(envPath);
  const liveProofReadiness = liveProofGroups.map((group) => groupStatus(group, envFileAssignments));
  const commercialIntake = readJsonStatus(intakePath);
  const manualWcagEvidence = readManualWcagEvidenceStatus(manualWcagPath);
  const liveGateEvidence = liveGateEvidenceStatus(liveEvidencePath);
  const proofArtifacts = liveProofArtifacts.map((artifact) => ({
    ...proofArtifactStatus(artifact.path),
    gateId: artifact.gateId,
    readinessId: artifact.readinessId,
    command: artifact.command,
  }));
  const acceptedProofArtifactByReadinessId = new Map(
    proofArtifacts
      .filter((artifact) => artifact.acceptedSourceArtifact)
      .map((artifact) => [artifact.readinessId, artifact])
  );
  const acceptedLiveGateIds = new Set(liveGateEvidence.acceptedGateIds || []);

  const ownerActionNeeded = [
    ...liveProofReadiness
      .filter((item) => !item.ready && !acceptedProofArtifactByReadinessId.has(item.id))
      .map((item) => {
        const needed = [];
        if (item.missingGroups.length > 0) {
          needed.push(`provide ${item.missingGroups.map((group) => group.join(' or ')).join('; ')}`);
        }
        if (item.blankOrPlaceholderEnvFile.length > 0) {
          needed.push(`fill ${item.blankOrPlaceholderEnvFile.join(', ')}`);
        }
        if (item.invalidKeyModeGroups.length > 0) {
          const invalidKeyAction = item.invalidKeyModeGroups.join(', ');
          needed.push(invalidKeyAction.startsWith('provide ') ? invalidKeyAction : `replace ${invalidKeyAction}`);
        }
        if (item.loadFromEnvFile.length > 0) {
          needed.push(`load ${item.loadFromEnvFile.join(', ')}`);
        }
        return `${item.id}: ${needed.join(' and ')}`;
      }),
    ...proofArtifacts
      .filter((artifact) => artifact.acceptedSourceArtifact && !acceptedLiveGateIds.has(artifact.gateId))
      .map(
        (artifact) =>
          `${artifact.gateId}: ${artifact.path} has status=passed; run npm run compose:live-gate-evidence -- --write --allow-partial --output ${liveEvidencePath} and then validate the redacted partial live-gate evidence with npm run verify:live-gate-evidence -- --evidence ${liveEvidencePath} --require-any; final closeout still requires complete live-gate evidence`
      ),
    commercialIntakeOwnerAction(commercialIntake),
    manualWcagOwnerAction(manualWcagEvidence),
    ...proofArtifacts
      .filter((artifact) => !artifact.acceptedSourceArtifact)
      .map((artifact) => {
        const archiveHint =
          artifact.gateId === 'real_stripe_test_checkout'
            ? ' with test-mode subscription Checkout metadata and owner-held Checkout Session/function-invocation archive policy'
            : artifact.gateId === 'live_mrr_gt_zero'
              ? ' with active subscription, paid invoice, redacted MRR metadata, and owner-held subscription/invoice archive policy'
              : ' with redacted owner-held archive policy metadata';
        return `${artifact.path}: run owner proof command until status=passed${archiveHint}`;
      }),
  ].filter(Boolean);
  const ownerPrepActionsByGate = ownerActionNeededByGate(ownerActionNeeded);

  const result = {
    ok: true,
    writeMode: shouldWrite,
    created,
    skippedExisting,
    evidenceBoundary: 'This helper creates or inspects local owner-evidence scaffolding only. It never makes placeholders count as proof and never prints secret values, partner names, customer data, raw quotes, contracts, or salts.',
    envFile,
    liveProofReadiness,
    liveGateEvidence,
    commercialIntake,
    manualWcagEvidence,
    proofArtifacts,
    readyForCloseout: ownerActionNeeded.length === 0,
    ownerActionNeeded,
    ownerActionNeededByGate: ownerPrepActionsByGate,
    nextCommands: {
      writeLocalScaffold: `npm run prepare:owner-evidence -- --write`,
      verifyLocalSafety: 'npm run verify:owner-evidence-local-safety',
      generateLiveProofRunPacket: 'npm run generate:live-proof-run-packet',
      loadEnv: `set -a; source ${envPath}; set +a`,
      liveProofs: liveProofGroups.map((group) => group.command),
      composeLiveGateEvidence: `npm run compose:live-gate-evidence -- --write --allow-partial --output ${liveEvidencePath}`,
      validateLiveGateEvidence: `npm run verify:live-gate-evidence -- --evidence ${liveEvidencePath} --require-any`,
      composeCompleteLiveGateEvidence: `npm run compose:live-gate-evidence -- --write --require-complete --output ${liveEvidencePath}`,
      validateCompleteLiveGateEvidence: `npm run verify:live-gate-evidence -- --evidence ${liveEvidencePath} --require-complete`,
      generateCommercialEvidenceIntakePacket: 'npm run generate:commercial-evidence-intake-packet',
      hashCommercialProofArtifacts: 'npm run hash:owner-evidence-artifacts -- <local partner/outcome proof files>',
      composeCommercialRecords: 'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
      generateManualWcagReviewPacket: 'npm run generate:manual-wcag-review-packet',
      hashManualWcagProofArtifacts: 'npm run hash:owner-evidence-artifacts -- <local WCAG review proof files>',
      validateManualWcagEvidence: `npm run verify:manual-wcag-evidence -- --evidence ${manualWcagPath} --require-complete`,
      finalCloseout: `npm run closeout:owner-evidence -- --write --refresh-tracked --live-evidence ${liveEvidencePath} --commercial-intake ${intakePath} --commercial-evidence ${commercialRecordsPath} --manual-wcag-evidence ${manualWcagPath}`,
    },
  };

  console.log(JSON.stringify(result, null, 2));
  if (hasFlag('--require-ready') && !result.readyForCloseout) {
    process.exitCode = 1;
  }
}

main();
