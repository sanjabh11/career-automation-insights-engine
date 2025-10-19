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
