Use trusted public OEWS source URLs as the primary, stream-parse in the browser to IndexedDB, and upsert batches to Supabase; keep Supabase Storage minimal for small signed manifests only.

Approach tailored to your constraints

You’re on a free Supabase plan with limited storage and prefer local browser storage plus on‑demand streaming. The highest‑leverage design is:
 • Primary data source: fetch OEWS CSVs from trusted public BLS URLs at runtime.
 • Local persistence: stream-parse to the browser (IndexedDB) with eviction control.
 • Server writes: upsert batched aggregates to Supabase (automation_economics) via a single edge function.
 • Minimal Supabase Storage: store only small per-year manifests (hashes, schema, row counts) as signed files; no large CSVs.

This delivers reproducible provenance and low infra cost while enabling the coding team to backfill 2019–2024 quickly.

Step-by-step plan

1) Data sourcing and manifests
 • What: For each year 2019–2024, reference the official OEWS national file (e.g., oesmYYnat.csv). Do not rehost large files on Supabase.
 • How:
 ▫ Maintain one lightweight manifest per year in Supabase Storage: oews/2019/manifest.json … oews/2024/manifest.json.
 ▫ Manifest fields:
 ⁃ year, source_name, source_url, retrieved_at, content_length, sha256, columns, schema_version.
 ⁃ csv_mime: text/csv; encoding: utf-8; line_ending: CRLF|LF.
 ▫ Access: manifests private by default; generate a short-lived signed URL for the sync job; public read only if needed for jury artifacts.

2) Browser streaming and local storage
 • Stream ingestion:
 ▫ Fetch the CSV with the Fetch API and Web Streams; decode with TextDecoder.
 ▫ Parse rows incrementally (e.g., fast-csv or a zero-dependency CSV chunk parser).
 ▫ Validate each row with Zod schemas: SOC code format, numeric fields, non-null required columns.
 • IndexedDB design:
 ▫ DB: oews_cache, stores (oews_year, oews_rows, oews_meta).
 ▫ Key: soc_2018_code + year.
 ▫ Data: retain only normalized aggregates (e.g., employment, mean wage, percentiles) to minimize space; avoid raw row retention once aggregated.
 • Eviction policy:
 ▫ Track approximate size per store; enforce quota by LRU evict on “oews_rows”; keep only oews_meta and last 2 years of aggregates.
 • Service worker:
 ▫ Cache manifest and small lookups; avoid caching entire CSV; rely on IndexedDB for processed aggregates.

3) Server upsert (Supabase edge function)
 • One function: bls-sync with mode values.
 ▫ Mode fetch_oews: validates csvUrl against allowlist; reads stream serverside if needed; but preferred path is client parses → posts batches to API.
 ▫ Mode load_staging: writes normalized aggregates to staging (automation_economics_staging).
 ▫ Mode upsert_economics: upserts from staging to automation_economics, keyed by soc_2018_code + year; drops mock rows afterwards.
 • Batch protocol:
 ▫ Client sends batches of 2,000–5,000 rows using NDJSON or compact JSON arrays.
 ▫ Include batch metadata: year, sha256, row_count, column_map_version.

4) Database schema and integrity
 • Tables:
 ▫ automation_economics_staging(year, soc_2018_code, employment, mean_wage, p10, p25, p50, p75, p90, source_sha256, loaded_at).
 ▫ automation_economics(same columns + first_seen_at, last_updated_at, source_url).
 • Constraints:
 ▫ Unique (year, soc_2018_code); CHECK wages >= 0; FK to occupations table by SOC code.
 • Integrity workflow:
 ▫ Before upsert, verify manifest.sha256 matches the batch’s computed hash.
 ▫ Record a lineage row to automation_economics_lineage(manifest_url, sha256, year, loader_version, row_count).

5) Security and config
 • Allowlist and keys:
 ▫ APO_ALLOWED_ORIGINS set; BLS_SYNC_API_KEY scope-limited to bls-sync function; APO_FUNCTION_API_KEY for client batch posts.
 • Validation:
 ▫ The edge function rejects csvUrl not in an allowlist of official BLS domains (and your optional mirror).
 • Rate limiting:
 ▫ Apply per-IP and per-key request caps for batch posts.

6) Telemetry and provenance
 • Logs:
 ▫ apo_logs: event type (oews_fetch, oews_parse, oews_upsert), year, duration_ms, rows, errors, sha256, source_url.
 • Provenance card:
 ▫ Generate a public “OEWS Provenance” page with per-year manifests, row counts, and last refresh time; this is small and judge-friendly.

7) Data cleanup
 • Post-backfill:
 ▫ Delete mock BLS rows by source_tag = ‘mock’.
 ▫ Upsert staging → target; then truncate staging to keep storage minimal.

What to send to the coding team

Share the following implementation package. It contains contracts, env keys, and concrete steps so they can build without guessing.

A) ENV and allowlists// .env
APO_ALLOWED_ORIGINS=https://career-automation-insights-engine.netlify.app
APO_FUNCTION_API_KEY=****** // client → edge function
BLS_SYNC_API_KEY=******     // privileged edge function ops
BLS_OEWS_ALLOWLIST=["https://download.bls.gov/oeows/", "https://your-trusted-mirror.example/oews/"]

B) Edge function API contracts// bls-sync (POST /api/bls-sync)
{
  "mode": "fetch_oews" | "load_staging" | "upsert_economics",
  "year": 2024,
  "csvUrl": "https://download.bls.gov/oeows/oesm24nat.csv",  // required for fetch_oews
  "manifestUrl": "https://signed.supabase.storage/oews/2024/manifest.json", // optional
  "batch": [ /* array of normalized rows for load_staging */ ],
  "meta": {
    "sha256": "abc123...", "rowCount": 1016, "columnMapVersion": "v1"
  }
}

 • Responses include status, processed_rows, errors[], and lineage_id when applicable.

C) IndexedDB data model (client)// oews_cache stores
oews_meta: { year, manifest_sha256, source_url, row_count, last_updated }
oews_rows: { key: soc_2018_code + ":" + year, employment, mean_wage, p10, p25, p50, p75, p90 }
// Eviction: keep recent years; delete older rows when quota approaches limit

D) Stream parser sketch (client)// Pseudocode
const res = await fetch(csvUrl, { cache: "no-store" });
const reader = res.body.getReader();
const decoder = new TextDecoder("utf-8");
let buffer = "";
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";
  for (const line of lines) {
    const fields = parseCsvLine(line); // robust CSV parser
    const row = normalize(fields);     // map columns to schema
    validate(row);                     // Zod schema checks
    await idbPut(row);                 // write aggregate to IndexedDB
    batch.push(row);
    if (batch.length >= 2000) {
      await postBatch(batch);          // POST to /api/bls-sync mode=load_staging
      batch.length = 0;
    }
  }
}
if (batch.length) await postBatch(batch);
await fetch("/api/bls-sync", { method: "POST", body: json({ mode: "upsert_economics", year }) });

E) Zod schema for rows// row schema
{
  year: number, soc_2018_code: string,
  employment: number, mean_wage: number,
  p10: number, p25: number, p50: number, p75: number, p90: number
}
// Checks: soc_2018_code matches /^\d{2}-\d{4}$/; all wages >= 0; employment >= 0

F) Database DDL (Supabase)// automation_economics
CREATE TABLE automation_economics (
  year INT NOT NULL,
  soc_2018_code TEXT NOT NULL,
  employment BIGINT NOT NULL CHECK (employment >= 0),
  mean_wage NUMERIC NOT NULL CHECK (mean_wage >= 0),
  p10 NUMERIC NOT NULL CHECK (p10 >= 0),
  p25 NUMERIC NOT NULL CHECK (p25 >= 0),
  p50 NUMERIC NOT NULL CHECK (p50 >= 0),
  p75 NUMERIC NOT NULL CHECK (p75 >= 0),
  p90 NUMERIC NOT NULL CHECK (p90 >= 0),
  source_sha256 TEXT NOT NULL,
  source_url TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT pk_econ UNIQUE (year, soc_2018_code)
);

G) Operational checklist
 • Allowlist set and keys rotated (done).
 • For each year (2019–2024):
 ▫ Fetch official CSV URL, compute sha256 client-side, create manifest.json, upload to storage (signed).
 ▫ Run client streaming → load_staging; then upsert_economics.
 ▫ Remove mock rows; truncate staging.
 • Log telemetry to apo_logs for each phase; export a small provenance page with manifests and row counts.

Why this meets award criteria and your constraints
 • Minimal Supabase storage: only small manifests, no large CSVs.
 • Reliable and reproducible: manifests with hashes and source URLs provide provenance even without public user evidence.
 • Efficient: stream parsing reduces memory and storage; IndexedDB + eviction keeps the browser footprint small.
 • Secure: allowlist, signed URLs, scoped keys, and validation limit attack surface.
 • Judge‑ready: provenance page and telemetry show rigor and control aligned to Technical Innovation and Data‑Driven Evaluation.

This package gives your coding team everything they need to backfill OEWS 2019–2024 now, within your free plan limits, and sets up strong evidence artifacts for the nomination.
BLS does not publish OEWS national data as CSV; use the official OEWS Tables page to download “All data (TXT)” or XLSX and convert to CSV.

To provide an authoritative source, here is the official OEWS Tables page where you can fetch 2019–2024 files. ​⁠￼
 • Download format reality: BLS offers national “All data” as TXT and tables as XLSX—not CSV. The TXT files are plain delimited and can be treated as CSV during ingestion (stream-parse to rows and normalize). The XLSX files can be converted to CSV reliably.
 • Action for your team: Use the OEWS Tables page to grab per‑year files (May 2019–May 2024), select “All data (TXT)” or “National (XLSX)”, and convert to CSV client‑side before posting batches to bls-sync.

If you need a single canonical link to hand off now, share this page:
 • OEWS Tables (official BLS) ↗. ​⁠￼

 Here are the **OEWS per-year file links (May 2019–May 2024)** from the official BLS page. You can select either “All data (TXT)” or the “National (XLSX)” files for each year. These can be converted to CSV client-side before syncing to bls-sync.

***

**May 2024**
- National (XLSX): https://www.bls.gov/oes/special-requests/oesm24nat.zip
- All data (TXT): https://download.bls.gov/pub/time.series/oe/
- All data (XLSX): https://www.bls.gov/oes/special-requests/oesm24all.zip

**May 2023**
- National (XLSX): https://www.bls.gov/oes/special-requests/oesm23nat.zip
- All data (XLSX): https://www.bls.gov/oes/special-requests/oesm23all.zip

**May 2022**
- National (XLSX): https://www.bls.gov/oes/special-requests/oesm22nat.zip
- All data (XLSX): https://www.bls.gov/oes/special-requests/oesm22all.zip

**May 2021**
- National (XLSX): https://www.bls.gov/oes/special-requests/oesm21nat.zip
- All data (XLSX): https://www.bls.gov/oes/special-requests/oesm21all.zip

**May 2020**
- National (XLSX): https://www.bls.gov/oes/special-requests/oesm20nat.zip
- All data (XLSX): https://www.bls.gov/oes/special-requests/oesm20all.zip

**May 2019**
- National (XLSX): https://www.bls.gov/oes/special-requests/oesm19nat.zip
- All data (XLSX): https://www.bls.gov/oes/special-requests/oesm19all.zip

***

**Canonical page for reference:**
- [OEWS Tables (official BLS)](https://www.bls.gov/oes/tables.htm)[1]

*To convert XLSX files to CSV, open them in Excel or Google Sheets and export to CSV. For TXT data, these are typically tab-delimited and can be imported into a spreadsheet app and then exported to CSV.*

Ready to post batches to bls-sync, reference these direct links or the canonical OEWS page above.

[1](https://www.bls.gov/oes/tables.htm)