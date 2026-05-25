import {
  getActiveReportSourceVersionSummary,
  getReportProvenanceCss,
  renderReportProvenanceHtml,
} from "@/lib/reportProvenance";
import { getSocSuggestionCatalogStats, suggestSocCodes } from "@/lib/socSuggestions";
import {
  buildWorkforceTransitionProofPack,
  getTransitionProofPackCss,
  renderTransitionProofPackHtml,
} from "@/lib/workTransitionProofPack";

export interface WorkforceExecutiveReportRow {
  department: string;
  role: string;
  headcount: number;
  avgSalary: number;
  apoScore: number;
  socCode?: string;
}

export interface WorkforceExecutiveReportSummary {
  totalHeadcount: number;
  weightedExposure: number;
  highRiskHeadcount: number;
  payroll: number;
  highRiskPayroll: number;
  mappedRows: number;
  unmappedRows: number;
  suggestedRows: number;
  highConfidenceSuggestedRows?: number;
}

export interface WorkforceExecutiveReportInput {
  orgName: string;
  fileName: string;
  generatedAt?: Date;
  rows: WorkforceExecutiveReportRow[];
  summary: WorkforceExecutiveReportSummary;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatNumber = (value: number): string => new Intl.NumberFormat("en-US").format(Math.round(value));

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.round(value));

function rowPayroll(row: WorkforceExecutiveReportRow): number {
  return row.headcount * row.avgSalary;
}

function riskLabel(score: number): string {
  if (score >= 70) return "High";
  if (score >= 50) return "Medium";
  return "Lower";
}

function buildReviewRows(rows: WorkforceExecutiveReportRow[]): string {
  const unmappedRows = rows
    .filter((row) => !row.socCode)
    .slice()
    .sort((a, b) => b.headcount - a.headcount)
    .slice(0, 12);

  if (unmappedRows.length === 0) {
    return '<p class="muted">All rows include a SOC/O*NET code. Keep the review evidence before treating the artifact as client-ready.</p>';
  }

  return `
    <table>
      <thead>
        <tr>
          <th>Department</th>
          <th>Role</th>
          <th>Headcount</th>
          <th>Suggested SOC/O*NET</th>
          <th>Evidence Boundary</th>
        </tr>
      </thead>
      <tbody>
        ${unmappedRows.map((row) => {
          const suggestions = suggestSocCodes({ role: row.role, department: row.department, limit: 2 });
          const suggestionText = suggestions.length > 0
            ? suggestions.map((suggestion) => `${suggestion.code} ${suggestion.title} (${suggestion.confidence}%)`).join("; ")
            : "Manual O*NET review required";

          return `
            <tr>
              <td>${escapeHtml(row.department)}</td>
              <td>${escapeHtml(row.role)}</td>
              <td>${formatNumber(row.headcount)}</td>
              <td>${escapeHtml(suggestionText)}</td>
              <td>Deterministic title match only; staff approval required.</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function buildPriorityRows(rows: WorkforceExecutiveReportRow[]): string {
  const priorityRows = rows
    .slice()
    .sort((a, b) => (b.apoScore * b.headcount) - (a.apoScore * a.headcount))
    .slice(0, 10);

  return `
    <table>
      <thead>
        <tr>
          <th>Department</th>
          <th>Role</th>
          <th>Headcount</th>
          <th>Payroll</th>
          <th>APO</th>
          <th>SOC/O*NET</th>
        </tr>
      </thead>
      <tbody>
        ${priorityRows.map((row) => `
          <tr>
            <td>${escapeHtml(row.department)}</td>
            <td>${escapeHtml(row.role)}</td>
            <td>${formatNumber(row.headcount)}</td>
            <td>${formatCurrency(rowPayroll(row))}</td>
            <td><strong>${Math.round(row.apoScore)}%</strong><br/><span>${riskLabel(row.apoScore)}</span></td>
            <td>${escapeHtml(row.socCode || "Needs review")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

export function buildWorkforceExecutiveReportHtml(input: WorkforceExecutiveReportInput): string {
  const generatedAt = input.generatedAt || new Date();
  const catalogStats = getSocSuggestionCatalogStats();
  const sourceSummary = getActiveReportSourceVersionSummary();
  const proofPack = buildWorkforceTransitionProofPack(input.rows, generatedAt);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.orgName)} Workforce Automation Exposure Report</title>
  <style>
    body { margin: 0; background: #f8fafc; color: #0f172a; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    main { max-width: 1080px; margin: 0 auto; padding: 32px 20px 48px; }
    header { border-bottom: 3px solid #0f766e; margin-bottom: 24px; padding-bottom: 18px; }
    h1 { margin: 0 0 8px; font-size: 30px; line-height: 1.1; }
    h2 { margin: 0 0 12px; font-size: 18px; }
    p { line-height: 1.55; }
    .muted, span { color: #64748b; }
    .meta { color: #475569; display: flex; flex-wrap: wrap; gap: 10px; font-size: 13px; }
    .grid { display: grid; gap: 12px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 22px 0; }
    .metric, section { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05); }
    .metric { padding: 14px; }
    .metric-label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
    .metric-value { font-size: 24px; font-weight: 800; margin-top: 6px; }
    section { margin-top: 18px; padding: 18px; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #e2e8f0; color: #0f172a; }
    .notice { background: #fff7ed; border-color: #fed7aa; color: #7c2d12; }
    .next-actions li { margin: 6px 0; }
    ${getReportProvenanceCss()}
    ${getTransitionProofPackCss()}
    @media (max-width: 760px) { .grid { grid-template-columns: 1fr 1fr; } main { padding: 20px 12px 36px; } }
    @media print { body { background: #fff; } main { max-width: none; padding: 0; } section, .metric { break-inside: avoid; box-shadow: none; } }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(input.orgName)} Workforce Automation Exposure Report</h1>
      <div class="meta">
        <span>Generated ${escapeHtml(generatedAt.toISOString())}</span>
        <span>Source file: ${escapeHtml(input.fileName)}</span>
        <span>Artifact type: pilot executive HTML</span>
      </div>
    </header>

    <section class="notice">
      <h2>Decision Boundary</h2>
      <p>This artifact is a planning memo for workforce and reskilling discussions. It is not an employment decision system, layoff predictor, or substitute for human, legal, accessibility, and labor-relations review.</p>
    </section>

    <div class="grid">
      <div class="metric"><div class="metric-label">Headcount</div><div class="metric-value">${formatNumber(input.summary.totalHeadcount)}</div></div>
      <div class="metric"><div class="metric-label">Weighted Exposure</div><div class="metric-value">${input.summary.weightedExposure.toFixed(1)}%</div></div>
      <div class="metric"><div class="metric-label">High-Risk Headcount</div><div class="metric-value">${formatNumber(input.summary.highRiskHeadcount)}</div></div>
      <div class="metric"><div class="metric-label">High-Risk Payroll</div><div class="metric-value">${formatCurrency(input.summary.highRiskPayroll)}</div></div>
    </div>

    <section>
      <h2>Executive Summary</h2>
      <p>This pilot audit covers ${formatNumber(input.rows.length)} role rows and ${formatNumber(input.summary.totalHeadcount)} workers. The weighted exposure score is ${input.summary.weightedExposure.toFixed(1)}%, with ${formatNumber(input.summary.highRiskHeadcount)} workers in roles above APO 70.</p>
      <p>Mapped rows: ${formatNumber(input.summary.mappedRows)}. Rows needing SOC/O*NET review: ${formatNumber(input.summary.unmappedRows)}. Deterministic local suggestion coverage: ${formatNumber(input.summary.suggestedRows)} unmapped rows; ${formatNumber(input.summary.highConfidenceSuggestedRows || 0)} are 75% confidence or higher.</p>
      <p class="muted">Active sources: ${escapeHtml(sourceSummary)}. SOC suggestion catalog: ${formatNumber(catalogStats.candidateCount)} local candidates. Provider-backed ESCO, Lightcast, and job-posting signals remain adapter-ready until terms, licensing, and refresh jobs are implemented.</p>
    </section>

    <section>
      <h2>Priority Role Review</h2>
      ${buildPriorityRows(input.rows)}
    </section>

    <section>
      <h2>SOC/O*NET Review Queue</h2>
      ${buildReviewRows(input.rows)}
    </section>

    ${renderTransitionProofPackHtml(proofPack)}

    <section>
      <h2>Recommended Next Actions</h2>
      <ol class="next-actions">
        <li>Validate role titles and headcount with HR before sharing the report outside the pilot team.</li>
        <li>Resolve every missing SOC/O*NET code and preserve the reviewer note for auditability.</li>
        <li>Separate augmentation, training, and redesign opportunities from individual employment decisions.</li>
        <li>Add department-level reskilling paths only after the occupation mapping is human-reviewed.</li>
      </ol>
    </section>

    ${renderReportProvenanceHtml({
      title: "Workforce Report Source Provenance",
      generatedAt,
      context: "Workforce CSV audit artifact generated from user-provided role rows, local seed data, source manifest versions, and deterministic SOC suggestion rules.",
    })}
  </main>
</body>
</html>`;
}

export function downloadWorkforceExecutiveReport(input: WorkforceExecutiveReportInput): void {
  const html = buildWorkforceExecutiveReportHtml(input);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = input.fileName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  link.href = url;
  link.download = `${safeName || "workforce-audit"}-executive-report.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
