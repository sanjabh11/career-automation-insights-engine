#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const SOURCE_MANIFEST_PATH = 'src/lib/sourceManifest.ts';
const SOURCE_VERIFICATION_PATH = 'docs/commercialization/source-verification-latest.json';
const JSON_OUTPUT = 'docs/commercialization/data-provenance-checksums.json';
const MD_OUTPUT = 'docs/commercialization/data-provenance-checksums.md';

const artifacts = [
  {
    id: 'wef-economics-csv',
    label: 'WEF economics CSV seed',
    path: 'public/data/econ_wef.csv',
    type: 'csv',
    sourceIds: ['wef-foj-2025'],
    expectedHeaders: ['source', 'source_url', 'as_of_year', 'evidence_note'],
    caveat: 'Local WEF-derived economics seed used for directional macro context; not a complete live labor-market feed.',
  },
  {
    id: 'occupation-risk-seed',
    label: 'SEO occupation risk seed',
    path: 'src/data/occupationRiskData.ts',
    type: 'typescript-seed',
    sourceIds: ['onet', 'bls-emp', 'bls-oews', 'wef-foj-2025'],
    expectedSnippets: ['export const occupationRiskData', 'overallRisk', 'bridgeRole', 'reskillingSuggestions'],
    caveat: 'Hand-curated SEO seed data; do not claim full O*NET 30.3/BLS-backed scoring until refreshed imports are checksum-verified.',
  },
  {
    id: 'onet-ingest-boundary',
    label: 'O*NET metadata ingestion boundary',
    path: 'supabase/lib/scripts/ingest_onet_metadata.ts',
    type: 'ingestion-script',
    sourceIds: ['onet'],
    expectedSnippets: ['<path-to-onet-csv-root>', 'Job Zones.txt', 'Tools Used.txt', 'SUPABASE_SERVICE_ROLE_KEY'],
    caveat: 'Ingestion utility boundary only; it proves import mechanics exist, not that current production tables are refreshed.',
  },
  {
    id: 'source-manifest-module',
    label: 'Source manifest module',
    path: SOURCE_MANIFEST_PATH,
    type: 'source-registry',
    sourceIds: ['onet', 'bls-emp', 'bls-oews', 'wef-foj-2025', 'anthropic-economic-index', 'anthropic-observed-exposure', 'openai-gdpval', 'bls-ai-mlr-2025', 'wcag-22', 'nist-ai-rmf', 'ada-ai-hiring-guidance', 'esco', 'lightcast', 'serpapi', 'llm-output'],
    expectedSnippets: ['export const SOURCE_MANIFEST', 'claimBoundary', 'adapter-ready'],
    caveat: 'Commercial source registry; adapter-ready records are not imported provider-backed data.',
  },
  {
    id: 'report-evidence-card-module',
    label: 'Report evidence card renderer',
    path: 'src/lib/reportEvidenceCards.ts',
    type: 'report-runtime',
    sourceIds: ['onet', 'bls-ai-mlr-2025', 'nist-ai-rmf', 'llm-output'],
    expectedSnippets: ['export interface EvidenceCard', 'doesNotProve', 'reviewStatus', 'renderEvidenceCardsHtml'],
    caveat: 'Shared report evidence card renderer; evidence cards still depend on correct source assignment in each report flow.',
  },
  {
    id: 'work-transition-proof-pack-module',
    label: 'AI work transition proof pack renderer',
    path: 'src/lib/workTransitionProofPack.ts',
    type: 'report-runtime',
    sourceIds: ['onet', 'wef-foj-2025', 'anthropic-economic-index', 'anthropic-observed-exposure', 'openai-gdpval', 'bls-ai-mlr-2025', 'wcag-22', 'nist-ai-rmf', 'ada-ai-hiring-guidance', 'esco', 'lightcast', 'llm-output'],
    expectedSnippets: ['AI_ERA_ROLE_RADAR', 'TaskExposureBucket', 'SkillChangeStatus', 'ProofPackSectionReview', 'getTransitionProofPackReviewMetadata', 'renderTransitionProofPackHtml'],
    caveat: 'Emerging role radar, skill-change ledger, and section-level review workflow are planning signals; provider-backed market validation remains adapter-ready.',
  },
  {
    id: 'report-provenance-module',
    label: 'Report provenance renderer',
    path: 'src/lib/reportProvenance.ts',
    type: 'report-runtime',
    sourceIds: ['onet', 'bls-emp', 'bls-oews', 'wef-foj-2025', 'llm-output'],
    expectedSnippets: ['renderReportProvenanceHtml', 'REPORT_TRUST_NOTICES', 'getReportSourceSnapshot'],
    caveat: 'Runtime report trust layer; each generated report still needs its own source snapshot and artifact event history.',
  },
  {
    id: 'workforce-executive-report-module',
    label: 'Workforce executive report artifact renderer',
    path: 'src/lib/workforceExecutiveReport.ts',
    type: 'report-runtime',
    sourceIds: ['onet', 'bls-emp', 'bls-oews', 'wef-foj-2025', 'llm-output'],
    expectedSnippets: ['buildWorkforceExecutiveReportHtml', 'downloadWorkforceExecutiveReport', 'Workforce Report Source Provenance'],
    caveat: 'Client-side pilot artifact renderer; final enterprise reporting still needs signed storage, PDF generation, and delivery/audit events.',
  },
  {
    id: 'artifact-review-event-migration',
    label: 'Artifact review event migration',
    path: 'supabase/migrations/20260524000200_add_commercial_artifact_review_events.sql',
    type: 'supabase-migration',
    sourceIds: ['nist-ai-rmf', 'ada-ai-hiring-guidance', 'llm-output'],
    expectedSnippets: ['section_review_updated', 'section_client_ready', 'artifact_client_ready', 'log_commercial_report_artifact_event'],
    caveat: 'Staff review events create an append-only readiness trail; they do not replace legal, accessibility, or labor-relations review.',
  },
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function countRows(source, type) {
  const lines = source.split(/\r?\n/).filter((line) => line.length > 0);
  if (type === 'csv') return Math.max(0, lines.length - 1);
  return lines.length;
}

function parseCsvHeader(source) {
  const [header = ''] = source.split(/\r?\n/, 1);
  return header.split(',').map((value) => value.trim());
}

function validateArtifactSource(artifact, source) {
  const failures = [];

  if (artifact.expectedHeaders) {
    const headers = parseCsvHeader(source);
    for (const header of artifact.expectedHeaders) {
      if (!headers.includes(header)) failures.push(`missing CSV header ${header}`);
    }
  }

  if (artifact.expectedSnippets) {
    for (const snippet of artifact.expectedSnippets) {
      if (!source.includes(snippet)) failures.push(`missing snippet ${snippet}`);
    }
  }

  return failures;
}

async function loadSourceVerification() {
  try {
    const parsed = JSON.parse(await readFile(SOURCE_VERIFICATION_PATH, 'utf8'));
    const passedIds = new Set(
      Array.isArray(parsed.results)
        ? parsed.results.filter((result) => result.passed).map((result) => result.id)
        : []
    );
    return {
      generatedAt: parsed.generatedAt || null,
      allPassed: parsed.allPassed === true,
      passedIds,
    };
  } catch {
    return {
      generatedAt: null,
      allPassed: false,
      passedIds: new Set(),
    };
  }
}

async function verifyManifestSourceIds() {
  const source = await readFile(SOURCE_MANIFEST_PATH, 'utf8');
  const ids = new Set(Array.from(source.matchAll(/id:\s*'([^']+)'/g), (match) => match[1]));
  const missing = artifacts.flatMap((artifact) =>
    artifact.sourceIds.filter((sourceId) => !ids.has(sourceId)).map((sourceId) => `${artifact.id}:${sourceId}`)
  );

  if (missing.length > 0) {
    throw new Error(`Data provenance references source IDs missing from source manifest: ${missing.join(', ')}`);
  }

  return ids;
}

function renderMarkdown(index) {
  const rows = index.artifacts.map((artifact) => [
    `\`${artifact.id}\``,
    artifact.label,
    `\`${artifact.path}\``,
    artifact.type,
    artifact.rows.toLocaleString(),
    `\`${artifact.sha256.slice(0, 16)}...\``,
    artifact.sourceIds.map((id) => `\`${id}\``).join(', '),
    artifact.passed ? 'pass' : `fail: ${artifact.failures.join('; ')}`,
  ]);

  const table = [
    '| Artifact | Label | Path | Type | Rows/Lines | SHA-256 | Source IDs | Status |',
    '|---|---|---|---|---:|---|---|---|',
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');

  return `# Data Provenance Checksums

Generated: ${index.generatedAt}
Source verification artifact: \`${SOURCE_VERIFICATION_PATH}\`
Source verification generated: ${index.sourceVerification.generatedAt || 'not available'}
All referenced current-source checks passed: ${index.sourceVerification.allPassed ? 'yes' : 'no'}
Current-source verification required for this local checksum pass: ${index.sourceVerification.requiredForPass ? 'yes' : 'no'}

This file records hash-level evidence for local commercial data artifacts and source/provenance code used by the proof-pack flows. It is not a substitute for licensed provider imports, but it prevents silent drift in the current seed data and ingestion boundaries.

${table}

## Caveats

${index.artifacts.map((artifact) => `- \`${artifact.id}\`: ${artifact.caveat}`).join('\n')}
`;
}

async function main() {
  const shouldWrite = process.argv.includes('--write');
  const requireSourceVerification = process.argv.includes('--require-source-verification');
  await verifyManifestSourceIds();
  const sourceVerification = await loadSourceVerification();

  const results = [];
  for (const artifact of artifacts) {
    const source = await readFile(artifact.path, 'utf8');
    const failures = validateArtifactSource(artifact, source);
    if (requireSourceVerification) {
      const unverifiedCurrentSourceIds = artifact.sourceIds.filter((sourceId) => {
        if (['lightcast', 'serpapi'].includes(sourceId)) return false;
        return !sourceVerification.passedIds.has(sourceId);
      });
      for (const sourceId of unverifiedCurrentSourceIds) {
        failures.push(`source verification not passing for ${sourceId}`);
      }
    }

    const result = {
      ...artifact,
      bytes: Buffer.byteLength(source),
      rows: countRows(source, artifact.type),
      sha256: sha256(source),
      failures,
      passed: failures.length === 0,
    };
    results.push(result);
    console.log(`${result.passed ? 'ok' : 'fail'} ${artifact.id} - ${artifact.label}`);
  }

  const index = {
    generatedAt: new Date().toISOString(),
    sourceManifestPath: SOURCE_MANIFEST_PATH,
    sourceVerificationPath: SOURCE_VERIFICATION_PATH,
    sourceVerification: {
      generatedAt: sourceVerification.generatedAt,
      allPassed: sourceVerification.allPassed,
      requiredForPass: requireSourceVerification,
    },
    allPassed: results.every((result) => result.passed),
    artifacts: results,
  };

  if (shouldWrite) {
    await mkdir('docs/commercialization', { recursive: true });
    await writeFile(JSON_OUTPUT, `${JSON.stringify(index, null, 2)}\n`);
    await writeFile(MD_OUTPUT, renderMarkdown(index));
    console.log(`wrote ${JSON_OUTPUT}`);
    console.log(`wrote ${MD_OUTPUT}`);
  }

  if (!index.allPassed) {
    process.exitCode = 1;
  }
}

await main();
