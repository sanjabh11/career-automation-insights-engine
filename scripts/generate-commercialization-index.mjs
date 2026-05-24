#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';

const OUTPUT_DIR = 'docs/commercialization';
const JSON_OUTPUT = `${OUTPUT_DIR}/commercialization-codebase-index.json`;
const MD_OUTPUT = `${OUTPUT_DIR}/commercialization-codebase-index.md`;

const commercialRoutePaths = new Set([
  '/',
  '/for-coaches',
  '/sample-report',
  '/tools/resume-analyzer',
  '/tools/counselor-reports',
  '/enterprise-dashboard',
  '/operations/leads',
  '/privacy',
  '/proof-pack-gallery',
  '/automation-risk/:occupation',
  '/pricing',
  '/workshops',
]);

const featureMap = [
  {
    feature: 'Pilot proof-pack gallery and outreach assets',
    buyer: 'Coaches, career centers, workforce boards, L&D pilot sponsors',
    routes: ['/proof-pack-gallery', '/sample-report', '/automation-risk/:occupation', '/enterprise-dashboard'],
    files: [
      'src/pages/ProofPackGalleryPage.tsx',
      'docs/commercialization/pilot-outreach-pack.md',
      'scripts/verify-commercial-browser.mjs',
      'scripts/verify-commercial-trust-boundaries.mjs',
    ],
    proof: 'Public proof-pack gallery, buyer-specific sample routes, occupation sample shelf, bounded pilot caveats, and downloadable CRM-import outreach CSV.',
  },
  {
    feature: 'Commercial proof-pack CI workflow',
    buyer: 'Founder, maintainer, pilot reviewers',
    routes: [],
    files: [
      '.github/workflows/commercial-proof-pack.yml',
      'docs/commercialization/commercial-proof-pack.workflow.yml',
      'scripts/verify-commercial-release.mjs',
      'scripts/verify-commercial-browser.mjs',
      'scripts/verify-commercial-accessibility.mjs',
    ],
    proof: 'GitHub Actions workflow is installed with read-only permissions, commercial build/route/evidence checks, Playwright a11y and browser journey checks on push/PR, plus manual/scheduled source and production audit checks.',
  },
  {
    feature: 'SEO report lead capture',
    buyer: 'Individuals, coaches, inbound SEO visitors',
    routes: ['/automation-risk/:occupation'],
    files: [
      'src/components/SEOReportDownload.tsx',
      'src/lib/commercialLeads.ts',
      'src/lib/commercialReportArtifacts.ts',
      'supabase/migrations/20260523000100_create_commercial_leads.sql',
    ],
    proof: 'Consent-gated report download, artifact persistence, deduping RPC, offline retry queue, provenance in report HTML.',
  },
  {
    feature: 'White-label coach sample reports',
    buyer: 'Career coaches, resume writers, education counselors',
    routes: ['/for-coaches', '/sample-report'],
    files: [
      'src/pages/ForCoachesPage.tsx',
      'src/pages/SampleReportPage.tsx',
      'src/lib/commercialLeads.ts',
      'src/lib/reportProvenance.ts',
    ],
    proof: 'Brand colors, contact details, consent-gated artifact capture, source/caveat block, sample watermark.',
  },
  {
    feature: 'Workforce CSV exposure audit',
    buyer: 'HR, L&D, workforce boards, AI transformation consultants',
    routes: ['/enterprise-dashboard'],
    files: [
      'src/pages/EnterpriseTeamDashboard.tsx',
      'src/lib/commercialWorkforceAudits.ts',
      'src/lib/socSuggestions.ts',
      'src/lib/workforceExecutiveReport.ts',
      'supabase/migrations/20260523000100_create_commercial_leads.sql',
    ],
    proof: 'CSV parsing, role exposure rollup, saved audits, review queue, broader local SOC suggestions, staff mapping boundary, downloadable executive HTML report.',
  },
  {
    feature: 'Commercial lead operations',
    buyer: 'Founder, sales, support, pilot operations',
    routes: ['/operations/leads'],
    files: [
      'src/pages/CommercialLeadOpsPage.tsx',
      'src/lib/commercialLeadOps.ts',
      'src/lib/commercialReportArtifacts.ts',
      'supabase/migrations/20260523000100_create_commercial_leads.sql',
      'supabase/migrations/20260524000200_add_commercial_artifact_review_events.sql',
    ],
    proof: 'Staff-gated lead list, status updates, notes, CSV export, artifact open/download event logging, section-level review/client-ready event logging, final artifact client-ready approval, and downloadable human-review attestation.',
  },
  {
    feature: 'Source provenance and claim boundaries',
    buyer: 'All buyers, especially institutional and workforce pilots',
    routes: ['/sample-report', '/automation-risk/:occupation', '/enterprise-dashboard'],
    files: [
      'src/lib/sourceManifest.ts',
      'src/lib/reportProvenance.ts',
      'scripts/verify-source-manifest.mjs',
      'scripts/verify-commercial-data-provenance.mjs',
      'docs/commercialization/source-refresh-manifest.md',
      'docs/commercialization/data-provenance-checksums.md',
    ],
    proof: 'Versioned source registry, confidence/caveats, report HTML provenance block, official source verification artifact, local data checksum manifest.',
  },
  {
    feature: 'AI Work Transition Proof Pack',
    buyer: 'Individuals, coaches, career centers, workforce boards, L&D teams',
    routes: ['/sample-report', '/automation-risk/:occupation', '/enterprise-dashboard'],
    files: [
      'src/lib/reportEvidenceCards.ts',
      'src/lib/workTransitionProofPack.ts',
      'src/components/SEOReportDownload.tsx',
      'src/pages/SampleReportPage.tsx',
      'src/lib/workforceExecutiveReport.ts',
      'supabase/lib/scripts/ingest_onet_metadata.ts',
      'supabase/migrations/20260524000300_add_onet_task_rating_metadata.sql',
      'scripts/verify-onet-task-ratings-ingest.mjs',
      'scripts/verify-report-evidence.mjs',
    ],
    proof: 'Downloadable reports now include source-labeled evidence cards, task exposure split with proxy weight basis, skill-change ledger with all five states plus per-row confidence/review/caveats, AI-era role radar with role-level review/taxonomy/posting-validation boundaries, learning/provider recommendation boundaries, local labor-market proof appendix boundaries, "does not prove" boundaries, generated timestamps, confidence, section-level review workflow, persisted review metadata, staff review/client-ready event logging, final artifact approval, and human-review attestation. O*NET 30.3 Task Ratings migration, ingest boundary, runtime helper, and verifier are implemented before replacing proxy weights.',
  },
  {
    feature: 'Privacy and responsible-use trust boundary',
    buyer: 'Individuals, coaches, institutional reviewers',
    routes: ['/privacy', '/tools/resume-analyzer', '/responsible-ai'],
    files: [
      'src/pages/PrivacyPage.tsx',
      'src/components/ResumeAnalyzer.tsx',
      'src/lib/resumeAnalysisPrivacy.ts',
      'src/pages/ResponsibleAIPage.tsx',
      'src/integrations/supabase/client.ts',
      'supabase/functions/analyze-resume/index.ts',
      'supabase/migrations/20260524000400_add_resume_deletion_receipts.sql',
      'scripts/verify-commercial-trust-boundaries.mjs',
    ],
    proof: 'Privacy notice, missing-Supabase fallback, bounded resume deletion receipt RPC/table, raw resume text redaction stub, deletion/employment-decision messaging, consent and local-queue guardrail verifier.',
  },
  {
    feature: 'Counselor report generator',
    buyer: 'Schools, workforce boards, coaches',
    routes: ['/tools/counselor-reports'],
    files: [
      'src/components/CounselorReportGenerator.tsx',
      'src/lib/careerCenterCohortProofPack.ts',
      'supabase/migrations/20251213000003_white_label_configs.sql',
    ],
    proof: 'Route now includes a downloadable aggregate-only career-center cohort proof pack with source-labeled cohort segments, FERPA-style privacy boundary, NACE first-destination outcome boundary, evidence cards, CSV export, and advisor-review requirements. Live authenticated batch consent and commercial artifact persistence remain pending.',
  },
];

function uniq(values) {
  return Array.from(new Set(values)).sort();
}

function extractRoutes(appSource) {
  const routePattern = /<Route\s+path="([^"]+)"\s+element=\{<([^>\s}]+)[^}]*\}\s*\/>/g;
  const routes = [];
  for (const match of appSource.matchAll(routePattern)) {
    routes.push({
      path: match[1],
      component: match[2],
      commercial: commercialRoutePaths.has(match[1]),
    });
  }
  return routes.sort((a, b) => a.path.localeCompare(b.path));
}

function extractLazyImports(appSource) {
  const lazyPattern = /const\s+([A-Za-z0-9_]+)\s*=\s*lazy\(\(\)\s*=>\s*import\("([^"]+)"\)\);/g;
  const imports = [];
  for (const match of appSource.matchAll(lazyPattern)) {
    imports.push({ symbol: match[1], importPath: match[2] });
  }
  return imports.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

function extractPackageScripts(packageSource) {
  const pkg = JSON.parse(packageSource);
  return Object.keys(pkg.scripts || {})
    .sort()
    .map((name) => ({ name, command: pkg.scripts[name] }));
}

function extractSourceIds(sourceManifest) {
  const idPattern = /id:\s*'([^']+)'/g;
  return uniq(Array.from(sourceManifest.matchAll(idPattern), (match) => match[1]));
}

function extractSqlObjects(sqlSource) {
  return {
    tables: uniq(Array.from(sqlSource.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-z0-9_]+)/gi), (match) => match[1])),
    functions: uniq(Array.from(sqlSource.matchAll(/CREATE OR REPLACE FUNCTION public\.([a-z0-9_]+)/gi), (match) => match[1])),
    grants: uniq(Array.from(sqlSource.matchAll(/GRANT EXECUTE ON FUNCTION public\.([a-z0-9_]+)/gi), (match) => match[1])),
    policies: uniq(Array.from(sqlSource.matchAll(/CREATE POLICY "([^"]+)"/g), (match) => match[1])),
  };
}

function formatTable(headers, rows) {
  const headerRow = `| ${headers.join(' | ')} |`;
  const divider = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.map((value) => String(value).replace(/\n/g, '<br/>')).join(' | ')} |`);
  return [headerRow, divider, ...body].join('\n');
}

function renderMarkdown(index) {
  const commercialRoutes = index.routes.filter((route) => route.commercial);
  const routeRows = commercialRoutes.map((route) => [
    `\`${route.path}\``,
    `\`${route.component}\``,
    index.lazyImports.find((item) => item.symbol === route.component)?.importPath || 'eager import or inline component',
  ]);
  const featureRows = index.featureMap.map((feature) => [
    feature.feature,
    feature.buyer,
    feature.routes.map((route) => `\`${route}\``).join(', '),
    feature.proof,
    feature.files.map((file) => `\`${file}\``).join('<br/>'),
  ]);
  const scriptRows = index.packageScripts
    .filter((script) => /build|index|lint|smoke|verify|audit|dev/.test(script.name))
    .map((script) => [`\`${script.name}\``, `\`${script.command}\``]);

  return `# Commercialization Codebase Index

Generated: ${index.generatedAt}
Branch: \`${index.branch}\`
Purpose: Maintain a repo-grounded index of the commercial proof-pack surfaces, persistence boundaries, source registry, and verification gates.

## Indexed Commercial Routes

${formatTable(['Route', 'Component', 'Import'], routeRows)}

## Feature-To-Code Map

${formatTable(['Feature', 'Buyer', 'Routes', 'Current Proof', 'Primary Files'], featureRows)}

## Supabase Commercial Persistence Boundary

Tables:
${index.sql.tables.map((table) => `- \`public.${table}\``).join('\n')}

RPC functions:
${index.sql.functions.map((fn) => `- \`public.${fn}\`${index.sql.grants.includes(fn) ? ' (granted)' : ''}`).join('\n')}

Policies:
${index.sql.policies.map((policy) => `- ${policy}`).join('\n')}

## Source Registry Coverage

${index.sourceIds.map((id) => `- \`${id}\``).join('\n')}

## Verification And Run Commands

${formatTable(['Script', 'Command'], scriptRows)}

Required commercial pre-demo gate:

1. \`npm run verify:commercial\`
2. \`npm run verify:commercial-a11y\` or \`npm run verify:commercial -- --with-a11y\` when Chromium startup is stable
3. \`npm run verify:sources\` when DNS/network access is available
4. \`npm audit --omit=dev --audit-level=high\` when registry access is available
5. \`npm run verify:commercial-browser\` when macOS/CI browser startup is stable enough for the full lead/report/workforce journey

CI boundary:

- \`.github/workflows/commercial-proof-pack.yml\` is the installed GitHub Actions workflow. It runs the commercial proof-pack gate with Playwright a11y and browser journey checks on push/PR, and runs source verification plus production audit on manual or scheduled runs. Push run 26358453075 and manual workflow_dispatch run 26358507849 are green on GitHub Actions.

## Remaining Index Gaps

- Full repo lint is still legacy-failing outside the commercial proof-pack files.
- Browser QA now has committed commercial Playwright journey and responsive/accessibility smoke harnesses, but full visual snapshots and formal WCAG audit coverage still need expansion.
- \`npm run verify:commercial-full\` includes accessibility, network, and full browser journey gates, but these remain environment-dependent until DNS, npm registry access, and Chromium startup are stable.
- Proof-pack output now has static and route-smoke verification plus section-level review metadata, proxy task-weight basis, per-row skill caveats, and role-level review/taxonomy/posting-validation boundaries; O*NET Task Ratings schema/import/runtime boundaries exist, but richer scoring still needs target Supabase ingest/export checksums, local labor-market validation, and licensed job-posting adapters before Lightcast-level market claims.
- Human-review state is preserved in generated report HTML and artifact/audit metadata; staff UI transitions, final artifact approval, non-legal review attestation, and resume deletion receipts are implemented, while live Supabase migration proof and formal e-signature/PDF storage remain Phase 5 hardening work.
- Phase 6 now has a public proof-pack gallery and CRM-import CSV, but deployed-domain analytics, email automation, and a live CRM sync remain pending before scaled outreach.
- Supabase local DB lint needs a running local database on \`127.0.0.1:54322\`.
- GitHub remote branch, \`sanjabh1103\` write access, installed workflow, hosted push CI, and hosted manual source/audit workflow are verified.
- ESCO, Lightcast, and live market search are adapter boundaries, not imported scoring sources.
- Local seed artifacts and O*NET Task Ratings import boundaries have checksums, but production O*NET/BLS imported database-table checksums and true O*NET Task Ratings task-time weights still need a live Supabase data export.

## Machine-Readable Companion

See \`${JSON_OUTPUT}\` for the same index as JSON.
`;
}

async function main() {
  const [appSource, packageSource, manifestSource, baseSqlSource, reviewSqlSource, resumeDeletionSqlSource] = await Promise.all([
    readFile('src/App.tsx', 'utf8'),
    readFile('package.json', 'utf8'),
    readFile('src/lib/sourceManifest.ts', 'utf8'),
    readFile('supabase/migrations/20260523000100_create_commercial_leads.sql', 'utf8'),
    readFile('supabase/migrations/20260524000200_add_commercial_artifact_review_events.sql', 'utf8'),
    readFile('supabase/migrations/20260524000400_add_resume_deletion_receipts.sql', 'utf8'),
  ]);
  const sqlSource = `${baseSqlSource}\n${reviewSqlSource}\n${resumeDeletionSqlSource}`;
  const branch = process.env.GIT_BRANCH || 'commercialization-proof-packs';
  const index = {
    generatedAt: new Date().toISOString(),
    branch,
    routes: extractRoutes(appSource),
    lazyImports: extractLazyImports(appSource),
    packageScripts: extractPackageScripts(packageSource),
    sourceIds: extractSourceIds(manifestSource),
    sql: extractSqlObjects(sqlSource),
    featureMap,
  };

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(JSON_OUTPUT, `${JSON.stringify(index, null, 2)}\n`);
  await writeFile(MD_OUTPUT, renderMarkdown(index));

  console.log(`wrote ${JSON_OUTPUT}`);
  console.log(`wrote ${MD_OUTPUT}`);
}

await main();
