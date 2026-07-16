#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const SCHEMA_VERSION = '2026-06-05.apo-commercial-artifact-redaction.v1';
const SCANNED_ROOT = 'docs/commercialization';
const OUTPUT_JSON = 'docs/commercialization/commercial-artifact-redaction-latest.json';
const OUTPUT_MD = 'docs/commercialization/commercial-artifact-redaction-latest.md';
const SCANNED_EXTENSIONS = new Set(['.json', '.md', '.csv']);
const LOCAL_EVIDENCE_PATTERN = /\.local\.json$/;
const writeOutputs = process.argv.includes('--write');

const placeholderPattern =
  /(\.\.\.|your|example|placeholder|redacted|fake|dummy|not_set|not-computed|owner-held|<owner-held|sample-only|Deno\.env|get\(|process\.env|import\.meta\.env|\[redacted\])/i;

const secretPatterns = [
  {
    id: 'stripe-secret-or-restricted-key',
    pattern: /(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{8,}/g,
  },
  {
    id: 'stripe-webhook-secret',
    pattern: /whsec_[A-Za-z0-9]{8,}/g,
  },
  {
    id: 'supabase-personal-access-token',
    pattern: /sbp_[A-Za-z0-9]{20,}/g,
  },
  {
    id: 'postgres-url-with-password',
    pattern: /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/gi,
  },
  {
    id: 'jwt-literal',
    pattern: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  },
  {
    id: 'google-api-key',
    pattern: /AIza[A-Za-z0-9_-]{20,}/g,
  },
  {
    id: 'serpapi-literal',
    pattern: /SERPAPI(?:_API)?_KEY\s*=\s*["']?[A-Za-z0-9_-]{24,}/gi,
  },
  {
    id: 'onet-password-literal',
    pattern: /ONET_PASSWORD\s*=\s*["']?[^"'\s<>$][^"'\s]*/gi,
  },
  {
    id: 'supabase-db-password-literal',
    pattern: /SUPABASE_DB_PASSWORD\s*=\s*["']?[^"'\s<>$][^"'\s]*/g,
  },
];

const ownerLocalMetadataRules = [
  {
    id: 'owner-local-env-name-outside-authorized-deployment-docs',
    term: 'SUPABASE_DB_PASSWORD',
    pattern: /SUPABASE_DB_PASSWORD/g,
    allowedPathPatterns: [
      /^docs\/commercialization\/live-supabase-deployment-packet\.json$/,
      /^docs\/commercialization\/live-supabase-deployment-runbook\.md$/,
      /^docs\/commercialization\/data-provenance-checksums\.(json|md)$/,
    ],
  },
  {
    id: 'owner-local-env-name',
    term: 'Stripe_Publisher_key',
    pattern: /Stripe_Publisher_key/g,
    allowedPathPatterns: [],
  },
];

const evidenceBoundary =
  'Generated commercialization artifacts scanned under docs/commercialization for high-confidence secret leakage and disallowed owner-local metadata. Ignored .local.json evidence files are intentionally skipped and must remain owner-held.';

const doesNotProve = [
  'absence of secrets in git history, ignored local evidence files, screenshots, browser caches, external provider dashboards, CI secrets, or owner-held archives',
  'validity of live Stripe, Supabase, partner, outcome, customer, or manual WCAG evidence',
  'legal compliance, WCAG conformance, employment-selection validity, or production uptime',
];

const referencePractices = [
  {
    name: 'OWASP Logging Cheat Sheet',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html',
    use: 'sensitive data should not be recorded in application logs or generated artifacts',
  },
  {
    name: 'OWASP Secrets Management Cheat Sheet',
    url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html',
    use: 'secrets should not be hardcoded or persisted in source-controlled artifacts',
  },
  {
    name: 'GitHub push protection',
    url: 'https://docs.github.com/en/code-security/concepts/secret-security/about-push-protection',
    use: 'repository workflows should add automated checks before sensitive values enter source control',
  },
];

function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

function listCommercialArtifacts(root, relativeDir = SCANNED_ROOT) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) {
    throw new Error(`Missing scanned root: ${relativeDir}`);
  }

  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = toPosixPath(path.join(relativeDir, entry.name));
    if (entry.isDirectory()) {
      files.push(...listCommercialArtifacts(root, relativePath));
      continue;
    }

    if (!entry.isFile()) continue;
    if (LOCAL_EVIDENCE_PATTERN.test(relativePath)) continue;
    if (!SCANNED_EXTENSIONS.has(path.extname(entry.name))) continue;
    files.push(relativePath);
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function isAllowedPlaceholder(match, line) {
  return placeholderPattern.test(match) || placeholderPattern.test(line);
}

function isAuthorizedOwnerLocalMetadata(file, rule) {
  return rule.allowedPathPatterns.some((pattern) => pattern.test(file));
}

function redactPreview(line, match) {
  return line.replace(match, '[redacted]').slice(0, 220);
}

function scanLine({ file, line, lineNumber }) {
  const findings = [];

  for (const rule of ownerLocalMetadataRules) {
    rule.pattern.lastIndex = 0;
    const matches = [...line.matchAll(rule.pattern)];
    for (const match of matches) {
      if (isAuthorizedOwnerLocalMetadata(file, rule)) continue;
      findings.push({
        id: rule.id,
        file,
        line: lineNumber,
        preview: redactPreview(line, match[0]),
      });
    }
  }

  for (const { id, pattern } of secretPatterns) {
    pattern.lastIndex = 0;
    const matches = [...line.matchAll(pattern)];
    for (const match of matches) {
      if (isAllowedPlaceholder(match[0], line)) continue;
      findings.push({
        id,
        file,
        line: lineNumber,
        preview: redactPreview(line, match[0]),
      });
    }
  }

  return findings;
}

function scanFile(root, file) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const lines = source.split(/\r?\n/);
  return lines.flatMap((line, index) => scanLine({ file, line, lineNumber: index + 1 }));
}

function buildResult(root) {
  const scannedFiles = listCommercialArtifacts(root);
  const findings = scannedFiles.flatMap((file) => scanFile(root, file));

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    ok: findings.length === 0,
    status: findings.length === 0 ? 'passed' : 'failed',
    scannedRoot: SCANNED_ROOT,
    scannedExtensions: [...SCANNED_EXTENSIONS].sort(),
    scannedExtensionCount: SCANNED_EXTENSIONS.size,
    skippedLocalEvidencePattern: '*.local.json',
    scannedFileCount: scannedFiles.length,
    scannedFiles,
    findingCount: findings.length,
    findings,
    evidenceBoundary,
    doesNotProve,
    doesNotProveCount: doesNotProve.length,
    referencePracticeCount: referencePractices.length,
    referencePractices,
    outputs: {
      json: OUTPUT_JSON,
      markdown: OUTPUT_MD,
    },
  };
}

function renderMarkdown(result) {
  const findingsSection =
    result.findings.length === 0
      ? 'No high-confidence generated-artifact leakage findings.'
      : result.findings
          .map((finding) => `- ${finding.id}: ${finding.file}:${finding.line} ${finding.preview}`)
          .join('\n');

  const references = result.referencePractices
    .map((reference) => `- ${reference.name}: ${reference.url}`)
    .join('\n');

  return `# Commercial Artifact Redaction

Status: \`${result.status}\`
Generated: \`${result.generatedAt}\`

Generated commercialization artifacts scanned for high-confidence secret leakage and owner-local metadata exposure.

## Counts

| Field | Value |
| --- | ---: |
| Scanned extensions | ${result.scannedExtensionCount} |
| Scanned files | ${result.scannedFileCount} |
| Findings | ${result.findingCount} |
| Does-not-prove boundaries | ${result.doesNotProveCount} |
| Reference practices | ${result.referencePracticeCount} |

## Findings

${findingsSection}

## Evidence Boundary

${result.evidenceBoundary}

## Does Not Prove

${result.doesNotProve.map((item) => `- ${item}`).join('\n')}

## Reference Practices

${references}
`;
}

function writeResult(root, result) {
  fs.mkdirSync(path.join(root, path.dirname(OUTPUT_JSON)), { recursive: true });
  fs.writeFileSync(path.join(root, OUTPUT_JSON), `${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(path.join(root, OUTPUT_MD), renderMarkdown(result));
}

const root = process.cwd();
const result = buildResult(root);

if (writeOutputs) {
  writeResult(root, result);
}

if (!result.ok) {
  console.error('Commercial artifact redaction verification failed:');
  for (const finding of result.findings) {
    console.error(`- ${finding.id} ${finding.file}:${finding.line} ${finding.preview}`);
  }
  process.exit(1);
}

console.log(
  `Commercial artifact redaction verification passed: ${result.scannedFileCount} files scanned, ${result.findingCount} findings.`,
);
