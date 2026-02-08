import type { SelectedOccupation } from '@/components/APODashboard';

export interface CSVRow {
  [key: string]: string | number | boolean | null | undefined;
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const needsQuotes = /[",\n]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function toCSV(rows: CSVRow[], headers?: string[]): string {
  if (!rows || rows.length === 0) return "";
  const keys = headers && headers.length ? headers : Object.keys(rows[0]);
  const head = keys.map(escapeCSV).join(",");
  const body = rows.map(r => keys.map(k => escapeCSV(r[k])).join(",")).join("\n");
  return `${head}\n${body}`;
}

export function download(filename: string, content: string, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAnalysesToCSV(analyses: any[], filename = 'saved_analyses.csv') {
  const rows: CSVRow[] = (analyses || []).map((a) => ({
    id: a.id,
    occupation_code: a.occupation_code,
    occupation_title: a.occupation_title,
    tags: Array.isArray(a.tags) ? a.tags.join(';') : '',
    created_at: a.created_at,
    updated_at: a.updated_at,
  }));
  const csv = toCSV(rows, ['id','occupation_code','occupation_title','tags','created_at','updated_at']);
  download(filename, csv);
}

export function exportAnalysesToPrintableHTML(analyses: any[], title = 'Saved Analyses Report') {
  const rows = (analyses || []).map((a: any) => `
    <tr>
      <td>${escapeHTML(a.occupation_title || '')}</td>
      <td>${escapeHTML(a.occupation_code || '')}</td>
      <td>${Array.isArray(a.tags) ? escapeHTML(a.tags.join(', ')) : ''}</td>
      <td>${a.created_at ? new Date(a.created_at).toLocaleString() : ''}</td>
      <td>${a.updated_at ? new Date(a.updated_at).toLocaleString() : ''}</td>
    </tr>
  `).join('');

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHTML(title)}</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; padding: 24px; }
        h1 { font-size: 20px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
        th { background: #f5f5f5; text-align: left; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>${escapeHTML(title)}</h1>
      <table>
        <thead>
          <tr>
            <th>Occupation Title</th>
            <th>Code</th>
            <th>Tags</th>
            <th>Created</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <script>window.onload = () => window.print();</script>
    </body>
  </html>`;

  const report = window.open('', '_blank');
  if (!report) return;
  report.document.open('text/html');
  report.document.write(html);
  report.document.close();
}

function escapeHTML(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ---------------------------------------------------------------------------
// APO-specific CSV export (merged from exportToCSV.ts)
// ---------------------------------------------------------------------------

export const exportToCSV = (occupations: SelectedOccupation[]) => {
  if (!occupations.length) return;
  const fields = [
    "Code", "Title", "Overall APO (%)", "Confidence", "Timeline",
    "Tasks APO", "Knowledge APO", "Skills APO", "Abilities APO", "Technologies APO"
  ];
  let csv = fields.join(",") + "\n";
  for (const occ of occupations) {
    csv += [
      `"${occ.code}"`,
      `"${occ.title.replace(/"/g, '""')}"`,
      `${occ.overallAPO?.toFixed(1) ?? ""}`,
      `"${occ.confidence}"`,
      `"${occ.timeline}"`,
      `${occ.categoryBreakdown?.tasks?.apo?.toFixed(1) ?? ""}`,
      `${occ.categoryBreakdown?.knowledge?.apo?.toFixed(1) ?? ""}`,
      `${occ.categoryBreakdown?.skills?.apo?.toFixed(1) ?? ""}`,
      `${occ.categoryBreakdown?.abilities?.apo?.toFixed(1) ?? ""}`,
      `${occ.categoryBreakdown?.technologies?.apo?.toFixed(1) ?? ""}`,
    ].join(",") + "\n";
  }
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "APO_Career_Export.csv";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
};

// ---------------------------------------------------------------------------
// APO-specific PDF export (merged from exportToPDF.ts)
// ---------------------------------------------------------------------------
export interface CareerAnalysisData {
  title: string;
  code: string;
  overallAPO: number;
  confidence: string;
  timeline: string;
  categoryBreakdown: {
    tasks: { apo: number; confidence: string };
    knowledge: { apo: number; confidence: string };
    skills: { apo: number; confidence: string };
    abilities: { apo: number; confidence: string };
    technologies: { apo: number; confidence: string };
  };
  insights: {
    primary_opportunities: string[];
    main_challenges: string[];
    automation_drivers: string[];
    barriers: string[];
  };
}

export const exportAnalysisToPDF = async (analyses: CareerAnalysisData[], _filename?: string) => {
  try {
    const htmlContent = generatePDFHTML(analyses);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please allow pop-ups.');
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      setTimeout(() => { printWindow.close(); }, 1000);
    };
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error('Failed to export PDF. Please try again.');
  }
};

const generatePDFHTML = (analyses: CareerAnalysisData[]): string => {
  const currentDate = new Date().toLocaleDateString();
  return `<!DOCTYPE html>
<html><head><title>APO Career Analysis Report</title>
<style>
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
  .analysis { margin-bottom: 40px; break-inside: avoid; }
  .title { color: #2563eb; font-size: 24px; margin-bottom: 10px; }
  .apo-score { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
  .category-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
  .category-item { background: #f9fafb; padding: 10px; border-radius: 6px; border-left: 4px solid #2563eb; }
  .insights { margin-top: 20px; }
  .insight-section { margin-bottom: 15px; }
  .insight-title { font-weight: bold; color: #1f2937; margin-bottom: 8px; }
  .insight-list { list-style-type: disc; margin-left: 20px; }
  .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
  @media print { body { margin: 0; } .analysis { page-break-inside: avoid; } }
</style></head><body>
<div class="header"><h1>APO Career Analysis Report</h1><p>Generated on ${currentDate}</p>
<p>Automation Potential Overview for ${analyses.length} Career${analyses.length > 1 ? 's' : ''}</p></div>
${analyses.map(a => `<div class="analysis">
  <h2 class="title">${a.title}</h2><p><strong>O*NET Code:</strong> ${a.code}</p>
  <div class="apo-score"><h3>Overall Automation Potential: ${(a.overallAPO * 100).toFixed(1)}%</h3>
  <p><strong>Confidence:</strong> ${a.confidence}</p><p><strong>Timeline:</strong> ${a.timeline}</p></div>
  <h3>Category Breakdown</h3>
  <div class="category-grid">
    <div class="category-item"><strong>Tasks:</strong> ${(a.categoryBreakdown.tasks.apo * 100).toFixed(1)}%<br><small>Confidence: ${a.categoryBreakdown.tasks.confidence}</small></div>
    <div class="category-item"><strong>Knowledge:</strong> ${(a.categoryBreakdown.knowledge.apo * 100).toFixed(1)}%<br><small>Confidence: ${a.categoryBreakdown.knowledge.confidence}</small></div>
    <div class="category-item"><strong>Skills:</strong> ${(a.categoryBreakdown.skills.apo * 100).toFixed(1)}%<br><small>Confidence: ${a.categoryBreakdown.skills.confidence}</small></div>
    <div class="category-item"><strong>Abilities:</strong> ${(a.categoryBreakdown.abilities.apo * 100).toFixed(1)}%<br><small>Confidence: ${a.categoryBreakdown.abilities.confidence}</small></div>
    <div class="category-item"><strong>Technologies:</strong> ${(a.categoryBreakdown.technologies.apo * 100).toFixed(1)}%<br><small>Confidence: ${a.categoryBreakdown.technologies.confidence}</small></div>
  </div>
  <div class="insights"><h3>Key Insights</h3>
    <div class="insight-section"><div class="insight-title">Primary Opportunities:</div><ul class="insight-list">${a.insights.primary_opportunities.map(i => `<li>${i}</li>`).join('')}</ul></div>
    <div class="insight-section"><div class="insight-title">Main Challenges:</div><ul class="insight-list">${a.insights.main_challenges.map(i => `<li>${i}</li>`).join('')}</ul></div>
    <div class="insight-section"><div class="insight-title">Automation Drivers:</div><ul class="insight-list">${a.insights.automation_drivers.map(i => `<li>${i}</li>`).join('')}</ul></div>
    <div class="insight-section"><div class="insight-title">Barriers to Automation:</div><ul class="insight-list">${a.insights.barriers.map(i => `<li>${i}</li>`).join('')}</ul></div>
  </div>
</div>`).join('')}
<div class="footer"><p>This report was generated by the APO Dashboard</p>
<p>Data sourced from O*NET and analyzed using advanced AI algorithms</p></div>
</body></html>`;
};
