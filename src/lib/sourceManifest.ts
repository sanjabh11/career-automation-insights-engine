export type SourceIntegrationStatus = 'active' | 'adapter-ready' | 'llm-output';
export type SourceConfidence = 'high' | 'medium' | 'low';

export interface SourceManifestEntry {
  id: string;
  label: string;
  provider: string;
  currentVersion: string;
  releaseDate: string;
  lastVerifiedAt: string;
  integrationStatus: SourceIntegrationStatus;
  confidence: SourceConfidence;
  refreshCadence: string;
  usedFor: string;
  caveat: string;
  claimBoundary: string;
  url: string;
}

export interface SourceManifestSnapshotEntry {
  label: string;
  provider: string;
  currentVersion: string;
  releaseDate: string;
  lastVerifiedAt: string;
  integrationStatus: SourceIntegrationStatus;
  confidence: SourceConfidence;
}

export const SOURCE_MANIFEST_LAST_VERIFIED_AT = '2026-05-24';

export const SOURCE_REFRESH_MANIFEST: SourceManifestEntry[] = [
  {
    id: 'onet',
    label: 'O*NET occupational and task data',
    provider: 'U.S. Department of Labor, O*NET Resource Center',
    currentVersion: 'O*NET Database 30.3 production release',
    releaseDate: 'May 2026',
    lastVerifiedAt: SOURCE_MANIFEST_LAST_VERIFIED_AT,
    integrationStatus: 'active',
    confidence: 'high',
    refreshCadence: 'Quarterly O*NET database release review, then app ingestion verification.',
    usedFor: 'SOC occupation metadata, work activities, task statements, Task Ratings importance/frequency fields, and skill descriptors.',
    caveat: 'O*NET describes occupations, not individual people, employer-specific job design, or exact task-time allocation.',
    claimBoundary: 'Do not claim every in-app row is 30.3-backed until the app data-refresh job and checksum manifest are run.',
    url: 'https://www.onetcenter.org/db_releases.html',
  },
  {
    id: 'bls-emp',
    label: 'BLS Employment Projections',
    provider: 'U.S. Bureau of Labor Statistics',
    currentVersion: '2024-34 occupational employment projections',
    releaseDate: '2025 release cycle',
    lastVerifiedAt: SOURCE_MANIFEST_LAST_VERIFIED_AT,
    integrationStatus: 'active',
    confidence: 'high',
    refreshCadence: 'Annual BLS projections release review.',
    usedFor: 'Employment outlook, growth context, and labor-market baseline signals.',
    caveat: 'BLS projections are macro-level estimates and should not be interpreted as employer-specific forecasts.',
    claimBoundary: 'Use as directional labor-market context, not as a prediction for any single worker or employer.',
    url: 'https://www.bls.gov/emp/',
  },
  {
    id: 'bls-oews',
    label: 'BLS Occupational Employment and Wage Statistics',
    provider: 'U.S. Bureau of Labor Statistics',
    currentVersion: 'May 2025 OEWS tables',
    releaseDate: 'Published May 2026',
    lastVerifiedAt: SOURCE_MANIFEST_LAST_VERIFIED_AT,
    integrationStatus: 'active',
    confidence: 'high',
    refreshCadence: 'Annual OEWS table release review.',
    usedFor: 'Wage estimates, occupational employment levels, and location/industry wage context.',
    caveat: 'OEWS wage estimates are survey-based and may exclude bonuses, equity, overtime, or employer-specific compensation design.',
    claimBoundary: 'Use for wage/employment context only after the occupation/SOC mapping has been verified.',
    url: 'https://www.bls.gov/oes/tables.htm',
  },
  {
    id: 'wef-foj-2025',
    label: 'Future of Jobs Report 2025',
    provider: 'World Economic Forum',
    currentVersion: '2025 edition',
    releaseDate: 'Published January 2025',
    lastVerifiedAt: SOURCE_MANIFEST_LAST_VERIFIED_AT,
    integrationStatus: 'active',
    confidence: 'medium',
    refreshCadence: 'Report-cycle review plus annual narrative check for newer WEF future-of-work reports.',
    usedFor: 'Macro technology, skill demand, and workforce-transition framing over the 2025-2030 horizon.',
    caveat: 'WEF signals are directional employer-survey insights and should be combined with occupation-level data.',
    claimBoundary: 'Use for macro narrative and skill trend framing, not for occupation-level scoring on its own.',
    url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/',
  },
  {
    id: 'anthropic-economic-index',
    label: 'Anthropic Economic Index',
    provider: 'Anthropic',
    currentVersion: 'Initial Economic Index plus 2026 Economic Primitives updates',
    releaseDate: 'February 2025 and 2026 updates',
    lastVerifiedAt: SOURCE_MANIFEST_LAST_VERIFIED_AT,
    integrationStatus: 'active',
    confidence: 'medium',
    refreshCadence: 'Review each public Economic Index release and open dataset update before refreshing AI-use claims.',
    usedFor: 'Observed AI use by O*NET task, automation versus augmentation framing, and adoption-inequality caveats.',
    caveat: 'Claude usage is not representative of all AI use, all workers, or all countries, and the source describes observed usage rather than complete automation feasibility.',
    claimBoundary: 'Use as an external AI-use benchmark and caveat layer; do not treat it as the app scoring source until imported task-level datasets are versioned and validated.',
    url: 'https://www.anthropic.com/research/the-anthropic-economic-index',
  },
  {
    id: 'anthropic-observed-exposure',
    label: 'Anthropic observed AI exposure research',
    provider: 'Anthropic',
    currentVersion: 'Labor market impacts observed-exposure research',
    releaseDate: '2026 research release',
    lastVerifiedAt: SOURCE_MANIFEST_LAST_VERIFIED_AT,
    integrationStatus: 'active',
    confidence: 'medium',
    refreshCadence: 'Review when Anthropic publishes new Economic Index labor-market datasets or methodology updates.',
    usedFor: 'Distinguishing theoretical task capability from observed automated, work-related AI use.',
    caveat: 'Observed exposure is based on Claude usage and external task-exposure estimates; it is not a complete labor-market outcome measure.',
    claimBoundary: 'Use to explain why task capability, observed AI use, hiring, and displacement must be separated in commercial reports.',
    url: 'https://www.anthropic.com/research/labor-market-impacts',
  },
  {
    id: 'openai-gdpval',
    label: 'OpenAI GDPval occupational task evaluation',
    provider: 'OpenAI',
    currentVersion: 'GDPval first version',
    releaseDate: 'Published September 2025',
    lastVerifiedAt: SOURCE_MANIFEST_LAST_VERIFIED_AT,
    integrationStatus: 'active',
    confidence: 'medium',
    refreshCadence: 'Review new GDPval releases and gold-set updates before making capability benchmark claims.',
    usedFor: 'AI capability benchmark framing for economically valuable knowledge-work tasks.',
    caveat: 'GDPval is an evaluation benchmark, not a labor-market forecast, and its first version covers a limited set of knowledge-work occupations.',
    claimBoundary: 'Use for capability trend context only; do not translate benchmark performance directly into job-loss or hiring predictions.',
    url: 'https://arxiv.org/abs/2510.04374',
  },
  {
    id: 'bls-ai-mlr-2025',
    label: 'BLS AI impacts in employment projections',
    provider: 'U.S. Bureau of Labor Statistics Monthly Labor Review',
    currentVersion: '2025 occupational case-study article',
    releaseDate: 'Published February 2025',
    lastVerifiedAt: SOURCE_MANIFEST_LAST_VERIFIED_AT,
    integrationStatus: 'active',
    confidence: 'high',
    refreshCadence: 'Review each annual BLS projections cycle and related AI/technology Monthly Labor Review updates.',
    usedFor: 'Claim discipline around AI exposure, employment projections uncertainty, and occupation-specific counterexamples.',
    caveat: 'BLS emphasizes that technology impacts can be gradual and uncertain; exposure does not imply rapid displacement.',
    claimBoundary: 'Use to temper automation claims and explain uncertainty, not as a direct replacement for app scoring or employer-specific forecasts.',
    url: 'https://www.bls.gov/opub/mlr/2025/article/incorporating-ai-impacts-in-bls-employment-projections.htm',
  },
  {
    id: 'wcag-22',
    label: 'WCAG 2.2 accessibility standard',
    provider: 'World Wide Web Consortium',
    currentVersion: 'WCAG 2.2 Recommendation',
    releaseDate: 'December 2024 update',
    lastVerifiedAt: SOURCE_MANIFEST_LAST_VERIFIED_AT,
    integrationStatus: 'active',
    confidence: 'high',
    refreshCadence: 'Review when commercial routes are changed and before institutional demos.',
    usedFor: 'Accessibility conformance target for public report, lead-capture, coach, and workforce pilot surfaces.',
    caveat: 'Automated checks cannot prove full WCAG conformance; manual keyboard, screen-reader, contrast, focus, and error-state review are still required.',
    claimBoundary: 'Do not claim WCAG conformance until the audit checklist, remediation evidence, and manual test notes are complete.',
    url: 'https://www.w3.org/TR/WCAG22/',
  },
  {
    id: 'nist-ai-rmf',
    label: 'NIST AI Risk Management Framework',
    provider: 'U.S. National Institute of Standards and Technology',
    currentVersion: 'AI RMF 1.0',
    releaseDate: 'January 2023; current framework reviewed in 2026',
    lastVerifiedAt: SOURCE_MANIFEST_LAST_VERIFIED_AT,
    integrationStatus: 'active',
    confidence: 'high',
    refreshCadence: 'Review before changing report governance, review-state, or risk-note language.',
    usedFor: 'Risk notes, human-review states, governance boundaries, and trustworthy AI framing.',
    caveat: 'The AI RMF is a voluntary risk-management framework and does not itself validate a product for employment decisions.',
    claimBoundary: 'Use as a governance scaffold only; do not claim certification, compliance, or formal validation from referencing it.',
    url: 'https://www.nist.gov/itl/ai-risk-management-framework',
  },
  {
    id: 'ada-ai-hiring-guidance',
    label: 'ADA algorithmic hiring guidance',
    provider: 'U.S. Department of Justice and EEOC',
    currentVersion: 'Algorithms, Artificial Intelligence, and Disability Discrimination in Hiring guidance',
    releaseDate: 'Guidance current as of 2026 review',
    lastVerifiedAt: SOURCE_MANIFEST_LAST_VERIFIED_AT,
    integrationStatus: 'active',
    confidence: 'high',
    refreshCadence: 'Review before any employer-facing workflow could influence selection, promotion, or workforce decisions.',
    usedFor: 'Employment-decision disclaimers, accommodation language, and human-review guardrails.',
    caveat: 'This guidance is not a substitute for legal advice and does not make the product validated for selection procedures.',
    claimBoundary: 'Use reports for planning and discussion only unless a formal validation, accommodation, and adverse-impact review program exists.',
    url: 'https://www.ada.gov/resources/ai-guidance/',
  },
  {
    id: 'esco',
    label: 'ESCO skills and occupation taxonomy',
    provider: 'European Commission',
    currentVersion: 'ESCO v1.2.1',
    releaseDate: 'Last update 2025-12-10',
    lastVerifiedAt: SOURCE_MANIFEST_LAST_VERIFIED_AT,
    integrationStatus: 'adapter-ready',
    confidence: 'high',
    refreshCadence: 'Monitor ESCO release notes before international skill mapping claims.',
    usedFor: 'International skill language, multilingual skills, and non-U.S. occupation alignment.',
    caveat: 'Requires mapping to local SOC/O*NET rows before it can power scored U.S. reports.',
    claimBoundary: 'Adapter boundary only until the ESCO import, crosswalk, and validation checks exist in this repo.',
    url: 'https://esco.ec.europa.eu/en/use-esco/use-esco-services-api',
  },
  {
    id: 'lightcast',
    label: 'Lightcast skills and labor-market data',
    provider: 'Lightcast',
    currentVersion: 'Commercial adapter boundary',
    releaseDate: 'Not licensed in this repository',
    lastVerifiedAt: SOURCE_MANIFEST_LAST_VERIFIED_AT,
    integrationStatus: 'adapter-ready',
    confidence: 'medium',
    refreshCadence: 'Review only after commercial data agreement and adapter credentials exist.',
    usedFor: 'Job-posting demand, emerging skills, and employer language once licensed.',
    caveat: 'Not bundled in this repository; production use requires a licensed data agreement and ingestion adapter.',
    claimBoundary: 'Do not imply Lightcast-backed scoring until a licensed adapter and provenance log are implemented.',
    url: 'https://lightcast.io/',
  },
  {
    id: 'serpapi',
    label: 'Live market search signals',
    provider: 'SerpAPI-compatible search adapter',
    currentVersion: 'Adapter boundary',
    releaseDate: 'Runtime query timestamp required',
    lastVerifiedAt: SOURCE_MANIFEST_LAST_VERIFIED_AT,
    integrationStatus: 'adapter-ready',
    confidence: 'medium',
    refreshCadence: 'Per-query timestamp, cache key, and jurisdiction capture required.',
    usedFor: 'Current SERP/job-market snapshots for outreach and content validation.',
    caveat: 'Search results are volatile and must be cached with query, timestamp, and jurisdiction.',
    claimBoundary: 'Use only as freshness context until a query log, cache policy, and result-review workflow are implemented.',
    url: 'https://serpapi.com/',
  },
  {
    id: 'llm-output',
    label: 'LLM-generated analysis',
    provider: 'Configured AI model or Supabase Edge Function',
    currentVersion: 'Runtime configured model',
    releaseDate: 'Runtime model/version metadata required',
    lastVerifiedAt: SOURCE_MANIFEST_LAST_VERIFIED_AT,
    integrationStatus: 'llm-output',
    confidence: 'low',
    refreshCadence: 'Capture model name, prompt version, and generation timestamp per artifact.',
    usedFor: 'Narrative explanations, resume rewrites, caveat summaries, and draft recommendations.',
    caveat: 'LLM output is advisory. It needs source grounding, human review, and should never be the sole basis for employment decisions.',
    claimBoundary: 'Treat as draft narrative unless grounded source IDs, human review state, and prompt/model metadata are attached.',
    url: 'https://www.nist.gov/itl/ai-risk-management-framework',
  },
];

export function getSourceManifestSnapshot(): Record<string, SourceManifestSnapshotEntry> {
  return SOURCE_REFRESH_MANIFEST.reduce<Record<string, SourceManifestSnapshotEntry>>((acc, source) => {
    acc[source.id] = {
      label: source.label,
      provider: source.provider,
      currentVersion: source.currentVersion,
      releaseDate: source.releaseDate,
      lastVerifiedAt: source.lastVerifiedAt,
      integrationStatus: source.integrationStatus,
      confidence: source.confidence,
    };
    return acc;
  }, {});
}

export function getActiveSourceVersionSummary(): string {
  return SOURCE_REFRESH_MANIFEST.filter((source) => source.integrationStatus === 'active')
    .map((source) => `${source.label}: ${source.currentVersion} (${source.releaseDate})`)
    .join('; ');
}
