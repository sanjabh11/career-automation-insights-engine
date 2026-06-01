#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = process.argv.slice(2);

const DEFAULT_ENV_PATH = '.env.local';
const DEFAULT_INTAKE_PATH = 'docs/commercialization/commercial-evidence-intake.local.json';
const INTAKE_TEMPLATE_PATH = 'docs/commercialization/commercial-evidence-intake-template.json';

const liveProofGroups = [
  {
    id: 'stripe_test_checkout',
    command: 'npm run verify:stripe-test-checkout',
    requiredAnyOf: [
      ['SUPABASE_URL', 'VITE_SUPABASE_URL'],
      ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY'],
      ['LIVE_SUPABASE_TEST_USER_EMAIL', 'STRIPE_TEST_USER_EMAIL'],
      ['LIVE_SUPABASE_TEST_USER_PASSWORD', 'STRIPE_TEST_USER_PASSWORD'],
      ['STRIPE_SECRET_KEY'],
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

function readEnvFileStatus(envPath) {
  const absolutePath = resolvePath(envPath);
  if (!fs.existsSync(absolutePath)) {
    return {
      status: { path: displayPath(absolutePath), exists: false, keys: [], blankOrPlaceholderKeys: [] },
      assignments: new Map(),
    };
  }
  const assignments = parseEnvAssignments(fs.readFileSync(absolutePath, 'utf8'));
  const blankOrPlaceholderKeys = [...assignments.entries()]
    .filter(([, value]) => isBlankOrPlaceholderValue(value))
    .map(([key]) => key)
    .sort();
  return {
    status: {
      path: displayPath(absolutePath),
      exists: true,
      keys: [...assignments.keys()].sort(),
      blankOrPlaceholderKeys,
    },
    assignments,
  };
}

function groupStatus(group, envFileAssignments) {
  const missingGroups = [];
  const presentGroups = [];
  const loadFromEnvFile = [];
  const blankOrPlaceholderEnvFile = [];

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

  return {
    id: group.id,
    command: group.command,
    ready: missingGroups.length === 0 && blankOrPlaceholderEnvFile.length === 0 && loadFromEnvFile.length === 0,
    envFileCompleteButNotLoaded: missingGroups.length === 0 && blankOrPlaceholderEnvFile.length === 0 && loadFromEnvFile.length > 0,
    missingGroups,
    blankOrPlaceholderEnvFile,
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
STRIPE_SECRET_KEY=
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

function readJsonStatus(filePath) {
  const absolutePath = resolvePath(filePath);
  if (!fs.existsSync(absolutePath)) {
    return { path: displayPath(absolutePath), exists: false, validJson: false, placeholderCount: null };
  }
  const source = fs.readFileSync(absolutePath, 'utf8');
  try {
    const parsed = JSON.parse(source);
    return {
      path: displayPath(absolutePath),
      exists: true,
      validJson: true,
      schemaVersion: parsed.schemaVersion || null,
      placeholderCount: countPlaceholders(parsed),
    };
  } catch {
    return {
      path: displayPath(absolutePath),
      exists: true,
      validJson: false,
      placeholderCount: countPlaceholders(source),
    };
  }
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

function main() {
  const shouldWrite = hasFlag('--write');
  const envPath = readFlagValue('--env-path', DEFAULT_ENV_PATH);
  const intakePath = readFlagValue('--commercial-intake', DEFAULT_INTAKE_PATH);
  const envAbsolutePath = resolvePath(envPath);
  const intakeAbsolutePath = resolvePath(intakePath);
  const created = [];
  const skippedExisting = [];

  if (shouldWrite) {
    createIfMissing(envAbsolutePath, buildEnvTemplate(), created, skippedExisting);
    const intakeTemplate = fs.readFileSync(resolvePath(INTAKE_TEMPLATE_PATH), 'utf8');
    createIfMissing(intakeAbsolutePath, intakeTemplate, created, skippedExisting);
  }

  const { status: envFile, assignments: envFileAssignments } = readEnvFileStatus(envPath);
  const liveProofReadiness = liveProofGroups.map((group) => groupStatus(group, envFileAssignments));
  const commercialIntake = readJsonStatus(intakePath);
  const proofArtifacts = [
    proofArtifactStatus('docs/commercialization/stripe-test-checkout-proof-latest.json'),
    proofArtifactStatus('docs/commercialization/production-calibration-proof-latest.json'),
    proofArtifactStatus('docs/commercialization/live-auth-e2e-proof-latest.json'),
    proofArtifactStatus('docs/commercialization/stripe-live-mrr-proof-latest.json'),
  ];

  const ownerActionNeeded = [
    ...liveProofReadiness
      .filter((item) => !item.ready)
      .map((item) => {
        const needed = [];
        if (item.missingGroups.length > 0) {
          needed.push(`provide ${item.missingGroups.map((group) => group.join(' or ')).join('; ')}`);
        }
        if (item.blankOrPlaceholderEnvFile.length > 0) {
          needed.push(`fill ${item.blankOrPlaceholderEnvFile.join(', ')}`);
        }
        if (item.loadFromEnvFile.length > 0) {
          needed.push(`load ${item.loadFromEnvFile.join(', ')}`);
        }
        return `${item.id}: ${needed.join(' and ')}`;
      }),
    commercialIntake.exists
      ? commercialIntake.placeholderCount > 0
        ? `${commercialIntake.path}: replace placeholder partner/outcome refs and hash salt`
        : null
      : `${commercialIntake.path}: create from ${INTAKE_TEMPLATE_PATH}`,
    ...proofArtifacts
      .filter((artifact) => !artifact.acceptedSourceArtifact)
      .map((artifact) => `${artifact.path}: run owner proof command until status=passed`),
  ].filter(Boolean);

  const result = {
    ok: true,
    writeMode: shouldWrite,
    created,
    skippedExisting,
    evidenceBoundary: 'This helper creates or inspects local owner-evidence scaffolding only. It never makes placeholders count as proof and never prints secret values, partner names, customer data, raw quotes, contracts, or salts.',
    envFile,
    liveProofReadiness,
    commercialIntake,
    proofArtifacts,
    readyForCloseout: ownerActionNeeded.length === 0,
    ownerActionNeeded,
    nextCommands: {
      writeLocalScaffold: `npm run prepare:owner-evidence -- --write`,
      loadEnv: `set -a; source ${envPath}; set +a`,
      liveProofs: liveProofGroups.map((group) => group.command),
      composeCommercialRecords: 'COMMERCIAL_EVIDENCE_HASH_SALT="<owner-held salt>" npm run compose:commercial-evidence-records -- --write --require-all',
      finalCloseout: 'npm run closeout:owner-evidence -- --write --refresh-tracked',
    },
  };

  console.log(JSON.stringify(result, null, 2));
  if (hasFlag('--require-ready') && !result.readyForCloseout) {
    process.exitCode = 1;
  }
}

main();
