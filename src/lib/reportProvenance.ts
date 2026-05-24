import {
  SOURCE_REFRESH_MANIFEST,
  getActiveSourceVersionSummary,
  getSourceManifestSnapshot,
  type SourceConfidence,
  type SourceIntegrationStatus,
} from '@/lib/sourceManifest';

export type { SourceConfidence } from '@/lib/sourceManifest';
export type SourceStatus = SourceIntegrationStatus;

export interface ReportSource {
  id: string;
  label: string;
  provider: string;
  version: string;
  lastChecked: string;
  status: SourceStatus;
  confidence: SourceConfidence;
  usedFor: string;
  caveat: string;
  url: string;
}

export interface ProvenanceHtmlOptions {
  title?: string;
  generatedAt?: Date;
  includeAdapterReady?: boolean;
  includeLlmOutput?: boolean;
  context?: string;
}

export const REPORT_SOURCE_REGISTRY: ReportSource[] = SOURCE_REFRESH_MANIFEST.map((source) => ({
  id: source.id,
  label: source.label,
  provider: source.provider,
  version: `${source.currentVersion}; ${source.releaseDate}`,
  lastChecked: source.lastVerifiedAt,
  status: source.integrationStatus,
  confidence: source.confidence,
  usedFor: source.usedFor,
  caveat: `${source.caveat} ${source.claimBoundary}`,
  url: source.url,
}));

export const REPORT_TRUST_NOTICES = [
  'Automation scores are directional planning signals, not deterministic predictions.',
  'Do not use this report as the sole basis for hiring, termination, compensation, promotion, or other employment decisions.',
  'Human review is required before applying recommendations to an individual worker, job seeker, or protected employment context.',
  'Employer-specific job design, location, tools, bargaining agreements, accessibility needs, and compliance obligations can materially change the result.',
];

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const shouldIncludeSource = (
  source: ReportSource,
  includeAdapterReady: boolean,
  includeLlmOutput: boolean
) => {
  if (source.status === 'adapter-ready') return includeAdapterReady;
  if (source.status === 'llm-output') return includeLlmOutput;
  return true;
};

export function getReportSources(options: {
  includeAdapterReady?: boolean;
  includeLlmOutput?: boolean;
} = {}): ReportSource[] {
  const includeAdapterReady = options.includeAdapterReady ?? true;
  const includeLlmOutput = options.includeLlmOutput ?? true;

  return REPORT_SOURCE_REGISTRY.filter((source) =>
    shouldIncludeSource(source, includeAdapterReady, includeLlmOutput)
  );
}

export function getReportSourceSnapshot(): Record<string, unknown> {
  return getSourceManifestSnapshot();
}

export function getActiveReportSourceVersionSummary(): string {
  return getActiveSourceVersionSummary();
}

export function renderReportProvenanceHtml(options: ProvenanceHtmlOptions = {}): string {
  const generatedAt = options.generatedAt || new Date();
  const includeAdapterReady = options.includeAdapterReady ?? true;
  const includeLlmOutput = options.includeLlmOutput ?? true;
  const sources = getReportSources({ includeAdapterReady, includeLlmOutput });
  const context = options.context
    ? `<p class="provenance-context">${escapeHtml(options.context)}</p>`
    : '';

  return `
  <section class="provenance">
    <h2>${escapeHtml(options.title || 'Source Provenance and Caveats')}</h2>
    ${context}
    <div class="source-meta">
      <strong>Generated:</strong> ${escapeHtml(generatedAt.toISOString())}
      <span>&bull;</span>
      <strong>Confidence:</strong> Directional, source-grounded planning signal
    </div>
    <table class="source-table">
      <thead>
        <tr>
          <th>Source</th>
          <th>Version / Status</th>
          <th>Use</th>
          <th>Caveat</th>
        </tr>
      </thead>
      <tbody>
        ${sources.map((source) => `
          <tr>
            <td><a href="${escapeHtml(source.url)}">${escapeHtml(source.label)}</a><br/><span>${escapeHtml(source.provider)}</span></td>
            <td>${escapeHtml(source.version)}<br/><span>${escapeHtml(source.status)} / ${escapeHtml(source.confidence)} confidence</span></td>
            <td>${escapeHtml(source.usedFor)}</td>
            <td>${escapeHtml(source.caveat)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <ul class="trust-notices">
      ${REPORT_TRUST_NOTICES.map((notice) => `<li>${escapeHtml(notice)}</li>`).join('')}
    </ul>
  </section>`;
}

export function getReportProvenanceCss(): string {
  return `
    .provenance { margin-top: 32px; padding: 18px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; }
    .provenance h2 { margin-top: 0; }
    .provenance-context, .source-meta { color: #475569; font-size: 12px; margin-bottom: 12px; }
    .source-meta { display: flex; gap: 8px; flex-wrap: wrap; }
    .source-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
    .source-table th, .source-table td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
    .source-table th { background: #e2e8f0; color: #0f172a; }
    .source-table span { color: #64748b; }
    .source-table a { color: #0f766e; text-decoration: none; font-weight: 700; }
    .trust-notices { margin: 12px 0 0; padding-left: 18px; color: #334155; font-size: 11px; }
    .trust-notices li { margin: 4px 0; }
  `;
}
