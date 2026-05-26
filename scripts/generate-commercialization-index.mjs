#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

const OUTPUT_DIR = 'docs/commercialization';
const JSON_OUTPUT = `${OUTPUT_DIR}/commercialization-codebase-index.json`;
const MD_OUTPUT = `${OUTPUT_DIR}/commercialization-codebase-index.md`;
const execFileAsync = promisify(execFile);

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
      'src/lib/commercialLaunchGate.ts',
      'src/lib/commercialLaunchReadiness.ts',
      'src/lib/supabaseFunctionGovernance.ts',
      'src/lib/institutionalReadinessPacket.ts',
      'docs/commercialization/pilot-outreach-pack.md',
      'scripts/verify-commercial-browser.mjs',
      'scripts/verify-commercial-trust-boundaries.mjs',
      'scripts/verify-supabase-function-governance.mjs',
    ],
    proof: 'Public proof-pack gallery, launch readiness command center, function governance dashboard, buyer-specific sample routes, occupation sample shelf, bounded pilot caveats, downloadable institutional readiness packet, and downloadable CRM-import outreach CSV.',
  },
  {
    feature: 'Institutional readiness and governance packet',
    buyer: 'Career centers, workforce boards, L&D teams, institutional pilot reviewers',
    routes: ['/proof-pack-gallery'],
    files: [
      'src/lib/institutionalReadinessPacket.ts',
      'src/pages/ProofPackGalleryPage.tsx',
      'scripts/verify-report-evidence.mjs',
      'scripts/verify-commercial-browser.mjs',
      'scripts/verify-commercial-accessibility.mjs',
      'scripts/verify-commercial-data-provenance.mjs',
      'docs/commercialization/commercial-accessibility-audit-latest.md',
      'docs/commercialization/commercial-accessibility-audit-latest.json',
    ],
    proof: 'Downloadable trust packet now includes an institutional risk register, AI RMF Govern/Map/Measure/Manage controls, WCAG 2.2 accessibility gate, generated accessibility audit packet with manual WCAG checklist, employment-decision boundary, live proof blockers, evidence cards, and a CSV risk register for buyer review.',
  },
  {
    feature: 'Commercial proof-pack CI workflow',
    buyer: 'Founder, maintainer, pilot reviewers',
    routes: [],
    files: [
      '.github/workflows/commercial-proof-pack.yml',
      'docs/commercialization/commercial-proof-pack.workflow.yml',
      'docs/commercialization/live-supabase-deployment-runbook.md',
      'scripts/verify-commercial-release.mjs',
      'scripts/generate-commercial-supabase-deployment-packet.mjs',
      'scripts/verify-commercial-live-auth-e2e.mjs',
      'scripts/verify-commercial-browser.mjs',
      'scripts/verify-commercial-accessibility.mjs',
      'docs/commercialization/commercial-accessibility-audit-latest.md',
    ],
    proof: 'GitHub Actions workflow is installed with read-only permissions, commercial build/route/evidence checks, Playwright a11y/browser journey checks, a generated WCAG 2.2 audit packet with manual review boundary, optional authenticated live e2e for a synthetic Supabase Auth test user, plus manual/scheduled source and production audit checks.',
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
      'supabase/migrations/20260525172048_add_commercial_outreach_pipeline.sql',
      'supabase/migrations/20260526000100_add_commercial_outreach_response_metrics.sql',
    ],
    proof: 'Staff-gated lead list, status updates, outreach stage/channel/priority/sequence/follow-up tracking, response metrics, notes, CSV export, artifact open/download event logging, section-level review/client-ready event logging, final artifact client-ready approval, and downloadable human-review attestation.',
  },
  {
    feature: 'Commercial launch gate and payment fulfillment boundary',
    buyer: 'Founder, pilot operations, paid proof-pack buyers',
    routes: ['/proof-pack-gallery', '/pricing', '/for-coaches', '/operations/leads'],
    files: [
      'src/lib/commercialLaunchGate.ts',
      'src/lib/commercialLaunchReadiness.ts',
      'src/lib/supabaseFunctionGovernance.ts',
      'src/lib/stripe.ts',
      'supabase/functions/create-checkout-session/index.ts',
      'supabase/functions/stripe-webhook/index.ts',
      'scripts/verify-report-evidence.mjs',
      'scripts/verify-commercial-trust-boundaries.mjs',
      'scripts/verify-supabase-function-governance.mjs',
    ],
    proof: 'Launch gate now separates owner-held secrets, public function review, legacy function sprawl, outreach automation, provider data, accessibility, and payment fulfillment. The proof-pack gallery includes a launch readiness command center, payment fulfillment status, function governance dashboard, source freshness view, manual WCAG checklist, and pilot feedback capture plan. Checkout helpers pass authenticated Supabase JWTs, the deployed checkout Edge Function verifies callers for subscription and credit checkout, and Stripe webhook credit purchases add report credits plus transaction records.',
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
    feature: 'Local labor-market snapshot packet',
    buyer: 'Career centers, workforce boards, L&D teams, institutional pilot reviewers',
    routes: ['/proof-pack-gallery'],
    files: [
      'src/lib/localLaborMarketSnapshot.ts',
      'src/pages/ProofPackGalleryPage.tsx',
      'scripts/verify-commercial-browser.mjs',
      'scripts/verify-report-evidence.mjs',
      'scripts/verify-commercial-data-provenance.mjs',
    ],
    proof: 'Proof-pack gallery now exports a local labor-market snapshot HTML/CSV packet that lists required geography, source vintage, query metadata, reviewer notes, source IDs, caveats, and does-not-prove boundaries before any local-demand, wage, training, posting, or provider-backed claim becomes client-ready.',
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
      'src/lib/resumeProofReportArtifacts.ts',
      'src/pages/ResponsibleAIPage.tsx',
      'src/integrations/supabase/client.ts',
      'supabase/functions/parse-resume/index.ts',
      'supabase/functions/analyze-resume/index.ts',
      'supabase/migrations/20260524000400_add_resume_deletion_receipts.sql',
      'supabase/migrations/20260524000500_add_resume_proof_report_artifacts.sql',
      'docs/commercialization/live-supabase-deployment-runbook.md',
      'scripts/generate-commercial-supabase-deployment-packet.mjs',
      'scripts/verify-commercial-trust-boundaries.mjs',
      'scripts/verify-resume-parser-live.mjs',
      'scripts/verify-commercial-live-auth-e2e.mjs',
    ],
    proof: 'Privacy notice, missing-Supabase fallback, bounded resume deletion receipt RPC/table, server-side resume parser boundary with upload validation and non-persistence receipt, live parse-resume receipt verifier, raw resume text redaction stub, resume analysis proof-pack metadata, parser boundary, source-labeled evidence cards, downloadable resume proof report, authenticated redacted resume proof artifact persistence, artifact deletion receipt, optional signed-in live synthetic e2e verifier for artifact save/delete and resume-analysis deletion receipts, copyable rewrite draft packet with caveats, deletion/employment-decision messaging, consent and local-queue guardrail verifier.',
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

async function getCurrentBranch() {
  const envBranch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || process.env.GIT_BRANCH;
  if (envBranch) return envBranch;

  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
    return stdout.trim() || 'unknown';
  } catch {
    return 'unknown';
  }
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
2. \`npm run verify:commercial-a11y\` or \`npm run verify:commercial -- --with-a11y\` when Chromium startup is stable; this writes \`docs/commercialization/commercial-accessibility-audit-latest.md\` and \`.json\`
3. \`npm run verify:sources\` when DNS/network access is available
4. \`npm audit --omit=dev --audit-level=high\` when registry access is available
5. \`npm run verify:commercial-browser\` when macOS/CI browser startup is stable enough for the full lead/report/workforce journey

CI boundary:

- \`.github/workflows/commercial-proof-pack.yml\` is the installed GitHub Actions workflow. It uses Node 24-compatible action wrappers, keeps Node 20 as the app test runtime, runs the commercial proof-pack gate with Playwright a11y and browser journey checks on push/PR, and runs source verification plus production audit on manual or scheduled runs. Hosted run evidence must be checked after each workflow-affecting push.

## Remaining Index Gaps

- Full repo lint is still legacy-failing outside the commercial proof-pack files.
- Browser QA now has committed commercial Playwright journey and responsive/accessibility smoke harnesses plus a generated WCAG 2.2 audit packet, but full visual snapshots and completed manual WCAG conformance evidence still need expansion.
- \`npm run verify:commercial-full\` includes accessibility, network, and full browser journey gates, but these remain environment-dependent until DNS, npm registry access, and Chromium startup are stable.
- Proof-pack output now has static and route-smoke verification plus section-level review metadata, proxy task-weight basis, per-row skill caveats, and role-level review/taxonomy/posting-validation boundaries; O*NET Task Ratings schema/import/runtime boundaries exist, but richer scoring still needs target Supabase ingest/export checksums, local labor-market validation, and licensed job-posting adapters before Lightcast-level market claims.
- Human-review state is preserved in generated report HTML and artifact/audit metadata; staff UI transitions, final artifact approval, non-legal review attestation, resume deletion receipts, the server-side resume parser boundary, the live parser receipt verifier, and the optional signed-in synthetic artifact/deletion e2e verifier are implemented. Live Supabase commercial schema/RPC proof now passes, while paid PDF/DOCX parser adapters, malware scanning, completed authenticated e2e run evidence, and formal e-signature/PDF storage remain Phase 5 hardening work.
- Phase 6 now has a public proof-pack gallery, local labor-market snapshot packet, and CRM-import CSV, but deployed-domain analytics, email automation, and a live CRM sync remain pending before scaled outreach.
- Supabase local DB lint needs a running local database on \`127.0.0.1:54322\`.
- GitHub local tracking and the installed workflow are present, but direct remote branch, collaborator access, hosted push CI, and hosted manual source/audit evidence must be re-confirmed from a network-available shell after each workflow-affecting push.
- ESCO, Lightcast, and live market search are adapter boundaries, not imported scoring sources.
- Local seed artifacts, the local labor-market snapshot packet, and O*NET Task Ratings import boundaries have checksums, but production O*NET/BLS imported database-table checksums and true O*NET Task Ratings task-time weights still need a live Supabase data export.

## Machine-Readable Companion

See \`${JSON_OUTPUT}\` for the same index as JSON.
`;
}

async function main() {
  const [
    appSource,
    packageSource,
    manifestSource,
    baseSqlSource,
    reviewSqlSource,
    outreachSqlSource,
    outreachResponseSqlSource,
    resumeDeletionSqlSource,
    resumeProofArtifactSqlSource,
  ] = await Promise.all([
    readFile('src/App.tsx', 'utf8'),
    readFile('package.json', 'utf8'),
    readFile('src/lib/sourceManifest.ts', 'utf8'),
    readFile('supabase/migrations/20260523000100_create_commercial_leads.sql', 'utf8'),
    readFile('supabase/migrations/20260524000200_add_commercial_artifact_review_events.sql', 'utf8'),
    readFile('supabase/migrations/20260525172048_add_commercial_outreach_pipeline.sql', 'utf8'),
    readFile('supabase/migrations/20260526000100_add_commercial_outreach_response_metrics.sql', 'utf8'),
    readFile('supabase/migrations/20260524000400_add_resume_deletion_receipts.sql', 'utf8'),
    readFile('supabase/migrations/20260524000500_add_resume_proof_report_artifacts.sql', 'utf8'),
  ]);
  const sqlSource = `${baseSqlSource}\n${reviewSqlSource}\n${outreachSqlSource}\n${outreachResponseSqlSource}\n${resumeDeletionSqlSource}\n${resumeProofArtifactSqlSource}`;
  const branch = await getCurrentBranch();
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
