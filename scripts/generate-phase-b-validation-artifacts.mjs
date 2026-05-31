import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, "public", "docs", "reports");
const MODEL_CARD_DIR = path.join(ROOT, "public", "docs", "model_cards");

const generatedAt = "2026-05-31";

const sources = {
  freyOsborne: "https://ora.ox.ac.uk/objects/uuid:4ed9f1bd-27e9-4e30-997e-5fc8405b0491/",
  atlantaFed: "https://www.atlantafed.org/research-and-data/publications/workforce-currents/2020/02/12/01-opportunity-occupations-and-the-future-of-work",
  modelCards: "https://research.google/pubs/pub48120/",
  nist: "https://www.nist.gov/itl/ai-risk-management-framework",
  openAiExposure: "https://openai.com/index/gpts-are-gpts/",
  ilo2025: "https://www.ilo.org/publications/generative-ai-and-jobs-2025-update",
};

const fixtureRows = [
  {
    code: "41-9041.00",
    occupation: "Telemarketers",
    apoEstimate: 88,
    externalAnchor: 99,
    anchorSource: "Frey and Osborne occupation computerisation probabilities",
    citation: sources.freyOsborne,
  },
  {
    code: "43-3031.00",
    occupation: "Bookkeeping, Accounting, and Auditing Clerks",
    apoEstimate: 85,
    externalAnchor: 98,
    anchorSource: "Frey and Osborne, corroborated in Atlanta Fed workforce-current summary",
    citation: sources.atlantaFed,
  },
  {
    code: "41-2011.00",
    occupation: "Cashiers",
    apoEstimate: 85,
    externalAnchor: 97,
    anchorSource: "Frey and Osborne occupation computerisation probabilities",
    citation: sources.freyOsborne,
  },
  {
    code: "13-2011.00",
    occupation: "Accountants and Auditors",
    apoEstimate: 52,
    externalAnchor: 94,
    anchorSource: "Frey and Osborne occupation computerisation probabilities",
    citation: sources.freyOsborne,
  },
  {
    code: "27-3042.00",
    occupation: "Technical Writers",
    apoEstimate: 58,
    externalAnchor: 89,
    anchorSource: "Frey and Osborne occupation computerisation probabilities",
    citation: sources.freyOsborne,
  },
  {
    code: "41-9022.00",
    occupation: "Real Estate Sales Agents",
    apoEstimate: 48,
    externalAnchor: 86,
    anchorSource: "Frey and Osborne occupation computerisation probabilities",
    citation: sources.freyOsborne,
  },
  {
    code: "29-1021.00",
    occupation: "Dentists, General",
    apoEstimate: 18,
    externalAnchor: 0.4,
    anchorSource: "Frey and Osborne occupation computerisation probabilities",
    citation: sources.freyOsborne,
  },
];

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value)));
}

function computeBins(rows, binCount = 5) {
  const bins = Array.from({ length: binCount }, (_, index) => ({
    binLower: index / binCount,
    binUpper: (index + 1) / binCount,
    count: 0,
    predictedSum: 0,
    observedSum: 0,
  }));

  for (const row of rows) {
    const predicted = clamp01(row.apoEstimate / 100);
    const observed = clamp01(row.externalAnchor / 100);
    let index = Math.floor(predicted * binCount);
    if (index === binCount) index = binCount - 1;
    bins[index].count += 1;
    bins[index].predictedSum += predicted;
    bins[index].observedSum += observed;
  }

  let ece = 0;
  const reliabilityBins = bins.map((bin) => {
    const divisor = Math.max(1, bin.count);
    const predictedAvg = bin.predictedSum / divisor;
    const observedAvg = bin.observedSum / divisor;
    const error = Math.abs(observedAvg - predictedAvg);
    const eceComponent = error * (bin.count / rows.length);
    ece += eceComponent;
    return {
      binLower: bin.binLower,
      binUpper: bin.binUpper,
      count: bin.count,
      predictedAvg,
      observedAvg,
      error,
      eceComponent,
    };
  });

  const mae = rows.reduce((sum, row) => sum + Math.abs(row.externalAnchor - row.apoEstimate), 0) / rows.length;
  const rmse = Math.sqrt(rows.reduce((sum, row) => sum + Math.pow(row.externalAnchor - row.apoEstimate, 2), 0) / rows.length);

  return { ece, mae, rmse, reliabilityBins };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function page(title, body) {
  return stripTrailingWhitespace(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; background: #f8fafc; color: #0f172a; }
    main { max-width: 960px; margin: 0 auto; padding: 40px 20px 64px; }
    h1 { font-size: 32px; line-height: 1.15; margin: 0 0 12px; }
    h2 { font-size: 21px; margin-top: 32px; }
    p, li { line-height: 1.65; }
    .meta { color: #475569; font-size: 14px; }
    .callout { border: 1px solid #f59e0b; background: #fffbeb; border-radius: 8px; padding: 14px 16px; }
    .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .metric { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
    .metric strong { display: block; font-size: 28px; }
    table { width: 100%; border-collapse: collapse; background: white; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; }
    a { color: #2563eb; }
    code { background: #e2e8f0; padding: 2px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <main>
    ${body}
  </main>
</body>
</html>
`);
}

function stripTrailingWhitespace(value) {
  return value.replace(/[ \t]+$/gm, "");
}

function renderReliabilitySvg(bins) {
  const width = 760;
  const height = 520;
  const pad = 64;
  const plot = width - pad * 2;
  const scaleX = (value) => pad + value * plot;
  const scaleY = (value) => height - pad - value * plot;
  const points = bins
    .filter((bin) => bin.count > 0)
    .map((bin) => `${scaleX(bin.predictedAvg)},${scaleY(bin.observedAvg)}`)
    .join(" ");
  const circles = bins
    .filter((bin) => bin.count > 0)
    .map((bin) => `<circle cx="${scaleX(bin.predictedAvg).toFixed(2)}" cy="${scaleY(bin.observedAvg).toFixed(2)}" r="${Math.max(5, 5 + bin.count * 2)}" fill="#2563eb" opacity="0.85"><title>${Math.round(bin.binLower * 100)}-${Math.round(bin.binUpper * 100)}%, n=${bin.count}</title></circle>`)
    .join("\n    ");
  return stripTrailingWhitespace(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">APO reliability curve fixture</title>
  <desc id="desc">Predicted APO estimate versus external published automation-probability anchors for the Phase B fixture.</desc>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${pad}" stroke="#94a3b8" stroke-width="2" stroke-dasharray="6 6"/>
  <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#0f172a" stroke-width="2"/>
  <line x1="${pad}" y1="${height - pad}" x2="${pad}" y2="${pad}" stroke="#0f172a" stroke-width="2"/>
  ${[0, 0.25, 0.5, 0.75, 1].map((tick) => `
  <line x1="${scaleX(tick)}" y1="${height - pad}" x2="${scaleX(tick)}" y2="${height - pad + 6}" stroke="#0f172a"/>
  <text x="${scaleX(tick)}" y="${height - pad + 24}" text-anchor="middle" font-size="12" fill="#334155">${Math.round(tick * 100)}%</text>
  <line x1="${pad - 6}" y1="${scaleY(tick)}" x2="${pad}" y2="${scaleY(tick)}" stroke="#0f172a"/>
  <text x="${pad - 12}" y="${scaleY(tick) + 4}" text-anchor="end" font-size="12" fill="#334155">${Math.round(tick * 100)}%</text>`).join("")}
  <text x="${width / 2}" y="${height - 16}" text-anchor="middle" font-size="14" fill="#0f172a">Predicted APO decision-support estimate</text>
  <text x="18" y="${height / 2}" transform="rotate(-90 18 ${height / 2})" text-anchor="middle" font-size="14" fill="#0f172a">External published anchor</text>
  <polyline points="${points}" fill="none" stroke="#2563eb" stroke-width="3"/>
  ${circles}
  <text x="${pad}" y="36" font-size="18" font-weight="700" fill="#0f172a">Reliability fixture: predicted vs. external anchor</text>
  <text x="${pad}" y="58" font-size="12" fill="#475569">Dashed line is perfect agreement. Points are binned averages; area is not proportional to population.</text>
</svg>
`);
}

function renderReport(metrics) {
  const rows = fixtureRows.map((row) => `<tr>
    <td>${escapeHtml(row.code)}</td>
    <td>${escapeHtml(row.occupation)}</td>
    <td>${row.apoEstimate.toFixed(1)}%</td>
    <td>${row.externalAnchor.toFixed(1)}%</td>
    <td>${Math.abs(row.externalAnchor - row.apoEstimate).toFixed(1)} pp</td>
    <td><a href="${escapeHtml(row.citation)}">${escapeHtml(row.anchorSource)}</a></td>
  </tr>`).join("\n");

  const binRows = metrics.reliabilityBins.map((bin) => `<tr>
    <td>${Math.round(bin.binLower * 100)}-${Math.round(bin.binUpper * 100)}%</td>
    <td>${bin.count}</td>
    <td>${(bin.predictedAvg * 100).toFixed(1)}%</td>
    <td>${(bin.observedAvg * 100).toFixed(1)}%</td>
    <td>${(bin.error * 100).toFixed(1)} pp</td>
  </tr>`).join("\n");

  return page("APO Calibration Report", `
    <h1>APO Calibration Report</h1>
    <p class="meta">Generated ${generatedAt}. Scope: Phase B starter artifact for the APO Dashboard.</p>
    <div class="callout">
      <strong>Evidence boundary:</strong> This report proves the calibration pipeline and public artifact path. It does not prove production accuracy. The fixture compares current app seed estimates to published occupation-level automation probability anchors; a live Supabase run against approved expert labels is still required before claiming validation.
    </div>
    <h2>Metrics</h2>
    <div class="grid">
      <div class="metric"><span>Expected Calibration Error</span><strong>${metrics.ece.toFixed(3)}</strong><span class="meta">Normalized 0-1; lower is better.</span></div>
      <div class="metric"><span>Mean Absolute Error</span><strong>${metrics.mae.toFixed(1)} pp</strong><span class="meta">Percentage-point gap.</span></div>
      <div class="metric"><span>RMSE</span><strong>${metrics.rmse.toFixed(1)} pp</strong><span class="meta">Percentage-point root mean squared error.</span></div>
      <div class="metric"><span>Fixture size</span><strong>${fixtureRows.length}</strong><span class="meta">Occupations with source-backed anchors.</span></div>
    </div>
    <h2>Reliability Curve</h2>
    <p><a href="/docs/reports/apo-reliability-curve.svg">Open reliability plot SVG</a>.</p>
    <h2>Calibration Bins</h2>
    <table>
      <thead><tr><th>Predicted bin</th><th>n</th><th>Predicted avg</th><th>Observed anchor avg</th><th>Absolute error</th></tr></thead>
      <tbody>${binRows}</tbody>
    </table>
    <h2>Fixture Rows</h2>
    <table>
      <thead><tr><th>O*NET code</th><th>Occupation</th><th>APO estimate</th><th>External anchor</th><th>Error</th><th>Source</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <h2>Method</h2>
    <p>ECE is computed by binning APO estimates, averaging predicted exposure and observed external anchors in each bin, and summing each bin's weighted absolute gap. The Edge Function now uses <code>apo_overall_vs_expert_assessments</code> and joins <code>apo_logs.occupation_code</code> to <code>expert_assessments.occupation_code</code>.</p>
    <h2>Limitations</h2>
    <ul>
      <li>External anchors are published computerisation probabilities, not contemporary expert labels for generative AI exposure.</li>
      <li>The fixture uses a small set of occupations to verify plumbing and artifact serving, not to certify model accuracy.</li>
      <li>Live calibration requires applying the migration, running APO jobs for matched occupations, and running the <code>calibrate-ece</code> function in an approved Supabase environment.</li>
    </ul>
  `);
}

function renderModelCard(kind, title, purpose) {
  return page(title, `
    <h1>${escapeHtml(title)}</h1>
    <p class="meta">Generated ${generatedAt}. Format follows the model-card transparency pattern and NIST AI RMF evaluation discipline.</p>
    <h2>Model Details</h2>
    <table>
      <tbody>
        <tr><th>System component</th><td>${escapeHtml(kind)}</td></tr>
        <tr><th>Purpose</th><td>${escapeHtml(purpose)}</td></tr>
        <tr><th>Owner</th><td>Career Automation Insights Engine repository maintainers.</td></tr>
        <tr><th>Primary inputs</th><td>O*NET occupation/task descriptors, app scoring configuration, Gemini-generated task analysis, and public labor-market context where available.</td></tr>
        <tr><th>Primary output</th><td>Decision-support automation-exposure estimate and explanatory categories.</td></tr>
      </tbody>
    </table>
    <h2>Intended Use</h2>
    <p>Use for career-coaching, workforce-planning discussion, and prioritizing human review. Do not use as a job-loss prediction, employment decision, salary guarantee, or automated eligibility/ranking system.</p>
    <h2>Performance and Calibration</h2>
    <p>The Phase B starter calibration artifact reports ECE ${metrics.ece.toFixed(3)}, MAE ${metrics.mae.toFixed(1)} percentage points, and RMSE ${metrics.rmse.toFixed(1)} percentage points on ${fixtureRows.length} source-backed fixture rows. These figures validate the calibration pipeline and disclose mismatch against external anchors; they do not certify production accuracy.</p>
    <h2>Limitations</h2>
    <ul>
      <li>Current public calibration uses a small source-backed fixture; live expert-label collection remains a manual gate.</li>
      <li>O*NET/BLS are U.S.-centered; UK/CA/AU localization is a later phase.</li>
      <li>LLM behavior and labor-market conditions can drift; results require periodic recalibration and human review.</li>
      <li>Task-level outputs are sensitive to prompt wording, occupation coverage, and source freshness.</li>
    </ul>
    <h2>Risk Management References</h2>
    <ul>
      <li><a href="${sources.modelCards}">Model Cards for Model Reporting</a></li>
      <li><a href="${sources.nist}">NIST AI Risk Management Framework</a></li>
      <li><a href="${sources.openAiExposure}">OpenAI occupational exposure paper</a></li>
      <li><a href="${sources.ilo2025}">ILO Generative AI and Jobs 2025 update</a></li>
    </ul>
  `);
}

const metrics = computeBins(fixtureRows, 5);

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.mkdirSync(MODEL_CARD_DIR, { recursive: true });

fs.writeFileSync(path.join(REPORT_DIR, "apo-calibration-report.html"), renderReport(metrics));
fs.writeFileSync(path.join(REPORT_DIR, "apo-reliability-curve.svg"), renderReliabilitySvg(metrics.reliabilityBins));
fs.writeFileSync(path.join(REPORT_DIR, "apo-calibration-data.json"), `${JSON.stringify({ generatedAt, sources, fixtureRows, metrics }, null, 2)}\n`);
fs.writeFileSync(path.join(MODEL_CARD_DIR, "APO_MODEL_CARD.html"), renderModelCard("APO occupation-level estimate", "APO Model Card", "Estimate occupation-level automation exposure and explain category-level drivers for coaching and planning."));
fs.writeFileSync(path.join(MODEL_CARD_DIR, "TASK_MODEL_CARD.html"), renderModelCard("Task categorization estimate", "Task Model Card", "Classify occupation tasks into automate, augment, and human-led categories for explanatory coaching workflows."));

console.log(`Generated Phase B validation artifacts in ${path.relative(ROOT, path.join(ROOT, "public", "docs"))}`);
