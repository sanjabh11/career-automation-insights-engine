import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { postEconBatch, type EconRow } from "@/services/econSync";

const BATCH_DEFAULT = 500;

function getEnv(key: string): string | undefined {
  const win = typeof window !== "undefined" ? (window as any) : {};
  const env = win.__CAIE_ENV || {};
  // Vite env first, then injected snapshot
  // @ts-ignore
  return import.meta.env[key] || env[key];
}

export default function EconImporter() {
  const [functionUrl, setFunctionUrl] = useState(
    getEnv("VITE_ECON_SYNC_FUNCTION_URL") ||
      `${getEnv("VITE_SUPABASE_URL") || getEnv("PUBLIC_SUPABASE_URL")}/functions/v1/econ-sync`
  );
  const [apiKey, setApiKey] = useState(getEnv("VITE_ECON_SYNC_API_KEY") || "");
  const [source, setSource] = useState("User CSV");
  const [sourceUrl, setSourceUrl] = useState("");
  const [region, setRegion] = useState("Global");
  const [country, setCountry] = useState("");
  const [overrideYear, setOverrideYear] = useState<string>("");
  const [batchSize, setBatchSize] = useState<number>(BATCH_DEFAULT);
  const [file, setFile] = useState<File | null>(null);
  const [csvUrl, setCsvUrl] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState({ rows: 0, batches: 0, upserted: 0, errors: 0 });
  const abortRef = useRef<{ abort: boolean }>({ abort: false });

  const enabled = import.meta.env.MODE !== 'production' || getEnv('VITE_ENABLE_ECON_IMPORTER') === 'true';

  // Hydrate settings from localStorage
  useEffect(() => {
    try {
      const ls = (k: string) => localStorage.getItem(k) || undefined;
      const fu = ls('econImporter.functionUrl');
      const ak = ls('econImporter.apiKey');
      const so = ls('econImporter.source');
      const su = ls('econImporter.sourceUrl');
      const rg = ls('econImporter.region');
      const co = ls('econImporter.country');
      const oy = ls('econImporter.overrideYear');
      const bs = ls('econImporter.batchSize');
      const cu = ls('econImporter.csvUrl');
      if (fu) setFunctionUrl(fu);
      if (ak) setApiKey(ak);
      if (so) setSource(so);
      if (su) setSourceUrl(su);
      if (rg) setRegion(rg);
      if (co) setCountry(co);
      if (oy) setOverrideYear(oy);
      if (bs && !Number.isNaN(Number(bs))) setBatchSize(Number(bs));
      if (cu) setCsvUrl(cu);
    } catch {}
  }, []);

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('econImporter.functionUrl', functionUrl);
      localStorage.setItem('econImporter.apiKey', apiKey);
      localStorage.setItem('econImporter.source', source);
      localStorage.setItem('econImporter.sourceUrl', sourceUrl);
      localStorage.setItem('econImporter.region', region);
      localStorage.setItem('econImporter.country', country);
      localStorage.setItem('econImporter.overrideYear', overrideYear);
      localStorage.setItem('econImporter.batchSize', String(batchSize));
      localStorage.setItem('econImporter.csvUrl', csvUrl);
    } catch {}
  }, [functionUrl, apiKey, source, sourceUrl, region, country, overrideYear, batchSize, csvUrl]);

  const reset = useCallback(() => {
    setProgress({ rows: 0, batches: 0, upserted: 0, errors: 0 });
    setDone(false);
    abortRef.current.abort = false;
  }, []);

  const mapRow = useCallback(
    (r: Record<string, any>): EconRow => {
      const year = (overrideYear || String(r["as_of_year"] || "").trim() || String(r["Date"] || "").slice(0, 4)).replace(/[^0-9]/g, "");
      const hasAdoption = r.adoption_current_pct != null || r.adoption_expected_pct != null;
      const hasPayback = r.payback_months != null && String(r.payback_months).trim() !== "";
      const hasMaturity = r.technology_maturity != null && String(r.technology_maturity).trim() !== "";
      const derivedCategory = r.task_category ?? (hasAdoption ? 'Adoption' : (hasPayback ? 'Payback' : (hasMaturity ? 'Maturity' : null)));
      const mapped: EconRow = {
        // Pass-through if present (preferred), else derive a category; fallback to 'General'
        task_category: (derivedCategory ?? 'General'),
        industry_sector: r.industry_sector ?? null,
        implementation_cost_low: r.implementation_cost_low ?? null,
        implementation_cost_high: r.implementation_cost_high ?? null,
        roi_timeline_months: r.roi_timeline_months ?? null,
        technology_maturity: r.technology_maturity ?? null,
        wef_adoption_score: r.wef_adoption_score ?? null,
        regulatory_friction: r.regulatory_friction ?? null,
        min_org_size: r.min_org_size ?? null,
        annual_labor_cost_threshold: r.annual_labor_cost_threshold ?? null,
        adoption_current_pct: r.adoption_current_pct ?? null,
        adoption_expected_pct: r.adoption_expected_pct ?? null,
        payback_months: r.payback_months ?? null,
        region: (r.region ?? region) || null,
        country: (r.country ?? country) || (r.Country ? String(r.Country) : null),
        evidence_note: r.evidence_note ?? null,
        source_page: r.source_page ?? null,
        // Provenance
        source: (r.source ?? source) || null,
        source_url: (r.source_url ?? sourceUrl) || (csvUrl || null),
        as_of_year: year ? Number(year) : null,
      };
      return mapped;
    },
    [country, csvUrl, overrideYear, region, source, sourceUrl]
  );

  const onAbort = useCallback(() => {
    abortRef.current.abort = true;
  }, []);

  const doImport = useCallback(async () => {
    if (!functionUrl || !apiKey) {
      alert("Function URL and API key are required");
      return;
    }
    if (!file && !csvUrl) {
      alert("Select a CSV file or provide a CSV URL");
      return;
    }
    reset();
    setRunning(true);

    const sendQueue: EconRow[] = [];
    const flush = async () => {
      if (!sendQueue.length) return;
      const chunk = sendQueue.splice(0, sendQueue.length);
      try {
        const res = await postEconBatch(chunk, { functionUrl, apiKey });
        if (!res.ok) throw new Error(res.error || "Unknown upsert error");
        setProgress((p) => ({ ...p, upserted: p.upserted + (res.totalUpserted || 0), batches: p.batches + 1 }));
      } catch (e) {
        console.error(e);
        setProgress((p) => ({ ...p, errors: p.errors + chunk.length }));
      }
    };

    const onRow = async (rowObj: Record<string, any>) => {
      if (abortRef.current.abort) return;
      const mapped = mapRow(rowObj);
      sendQueue.push(mapped);
      setProgress((p) => ({ ...p, rows: p.rows + 1 }));
      if (sendQueue.length >= batchSize) {
        await flush();
      }
    };

    const onDone = async () => {
      await flush();
      setRunning(false);
      setDone(true);
    };

    const parseConfig: Papa.ParseConfig = {
      header: true,
      worker: true,
      skipEmptyLines: true,
      chunk: async (results) => {
        // results.data is array of row objects
        for (const r of results.data as any[]) {
          await onRow(r);
          if (abortRef.current.abort) break;
        }
      },
      complete: onDone,
      error: (err) => {
        console.error(err);
        setRunning(false);
      },
    };

    if (file) {
      Papa.parse(file, parseConfig);
    } else if (csvUrl) {
      Papa.parse(csvUrl, { ...parseConfig, download: true });
    }
  }, [apiKey, batchSize, csvUrl, file, functionUrl, mapRow, reset]);

  if (!enabled) {
    return (
      <div className="container mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-semibold mb-2">Economics CSV Importer (Disabled)</h1>
        <p className="text-sm text-gray-700">This importer is disabled in production by default. To enable it, set <code>VITE_ENABLE_ECON_IMPORTER=true</code> in your environment and rebuild. This prevents exposing administrative ingestion tools to end users.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <h1 className="text-2xl font-semibold mb-4">Economics CSV Importer (Streaming)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Function URL</span>
          <input className="border rounded p-2" value={functionUrl} onChange={(e) => setFunctionUrl(e.target.value)} placeholder="https://<ref>.functions.supabase.co/econ-sync" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">x-api-key</span>
          <input className="border rounded p-2" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="ECON_SYNC_API_KEY" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Source</span>
          <input className="border rounded p-2" value={source} onChange={(e) => setSource(e.target.value)} placeholder="WEF 2025 / Deloitte / MGI / User CSV" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Source URL</span>
          <input className="border rounded p-2" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="/public/docs/WEF_Future_of_Jobs_Report_2025.pdf or https://..." />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Region</span>
          <input className="border rounded p-2" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Global / EMEA / APAC" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Country</span>
          <input className="border rounded p-2" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Optional" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Override Year (optional)</span>
          <input className="border rounded p-2" value={overrideYear} onChange={(e) => setOverrideYear(e.target.value)} placeholder="2025" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Batch Size</span>
          <input type="number" className="border rounded p-2" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value) || BATCH_DEFAULT)} />
        </label>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-4 mb-4">
        <div className="flex-1">
          <div className="mb-2 text-sm font-medium">Select CSV file</div>
          <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div className="flex-1">
          <div className="mb-2 text-sm font-medium">Or CSV URL (must allow CORS)</div>
          <input className="border rounded p-2 w-full" placeholder="https://.../economics.csv" value={csvUrl} onChange={(e) => setCsvUrl(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {!running ? (
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={doImport}>Start Import</button>
        ) : (
          <>
            <button className="bg-gray-700 text-white px-4 py-2 rounded" onClick={onAbort}>Abort</button>
            <span className="text-sm">Importing...</span>
          </>
        )}
        {done && <span className="text-sm text-green-700">Done.</span>}
      </div>

      <div className="text-sm">
        <div>Rows parsed: <strong>{progress.rows}</strong></div>
        <div>Batches sent: <strong>{progress.batches}</strong></div>
        <div>Rows upserted: <strong>{progress.upserted}</strong></div>
        <div>Errors: <strong className={progress.errors ? "text-red-600" : ""}>{progress.errors}</strong></div>
      </div>

      <div className="mt-6 text-xs text-gray-600 space-y-2">
        <div>- <strong>Required headers (preferred):</strong> task_category, industry_sector, implementation_cost_low, implementation_cost_high, roi_timeline_months, technology_maturity, wef_adoption_score, regulatory_friction, min_org_size, annual_labor_cost_threshold, source, source_url, as_of_year, adoption_current_pct, adoption_expected_pct, payback_months, region, country, evidence_note, source_page.</div>
        <div>- <strong>Kaggle macro CSVs:</strong> We will derive only provenance/year/country and leave automation fields null unless present. For best results, upload a curated CSV matching the target headers.</div>
        <div>- <strong>Security:</strong> This calls the econ-sync Edge Function secured by x-api-key; do not expose your service role keys in the browser.</div>
      </div>
    </div>
  );
}
