#!/usr/bin/env python3
import argparse
import csv
import pathlib
import re
from typing import List, Dict, Any, Optional

try:
    import pdfplumber  # type: ignore
except Exception as e:
    raise SystemExit("pdfplumber is required. Install with: pip install pdfplumber")

# Target schema for automation_economics_staging (extended)
COLUMNS = [
    "task_category",
    "industry_sector",
    "implementation_cost_low",
    "implementation_cost_high",
    "roi_timeline_months",
    "technology_maturity",
    "wef_adoption_score",
    "regulatory_friction",
    "min_org_size",
    "annual_labor_cost_threshold",
    "source",
    "source_url",
    "as_of_year",
    "adoption_current_pct",
    "adoption_expected_pct",
    "payback_months",
    "region",
    "country",
    "evidence_note",
    "source_page",
]

# Minimal canonical sectors to scaffold rows even if extraction is sparse
SEED_SECTORS = [
    "Manufacturing",
    "Healthcare",
    "Finance",
    "Retail",
    "Transportation & Logistics",
    "Information Technology",
]

ADOPTION_PAT = re.compile(r"(adoption|adopt(ed|ion)|penetration)[^%\n]{0,40}?(\d{1,3}(?:\.\d{1,2})?)%", re.IGNORECASE)
PAYBACK_PAT = re.compile(r"(pay\s*back|payback|ROI\s*in)[^\d\n]{0,30}?(\d{1,3})\s*(months|month)\b", re.IGNORECASE)
MATURITY_PAT = re.compile(r"(maturity|TRL|technology\s+maturity)\s*[:\-]?\s*(\w[\w\s\-]+)", re.IGNORECASE)
WEF_PAT = re.compile(r"(WEF|World Economic Forum)[^%\n]{0,40}?(\d{1,3}(?:\.\d{1,2})?)%", re.IGNORECASE)


def extract_from_pdf(pdf_path: pathlib.Path) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    try:
        with pdfplumber.open(str(pdf_path)) as pdf:
            for pnum, page in enumerate(pdf.pages, start=1):
                try:
                    text = page.extract_text() or ""
                except Exception:
                    text = ""
                if not text:
                    continue
                # Find signals on this page
                adoption_current: Optional[float] = None
                adoption_expected: Optional[float] = None
                payback: Optional[int] = None
                maturity: Optional[str] = None
                wef_score: Optional[float] = None

                # Heuristics: take first match as 'current', second as 'expected'
                ad_matches = ADOPTION_PAT.findall(text)
                if ad_matches:
                    try:
                        adoption_current = float(ad_matches[0][2])
                        if len(ad_matches) > 1:
                            adoption_expected = float(ad_matches[1][2])
                    except Exception:
                        pass
                pb = PAYBACK_PAT.search(text)
                if pb:
                    try:
                        payback = int(pb.group(2))
                    except Exception:
                        pass
                mt = MATURITY_PAT.search(text)
                if mt:
                    maturity = mt.group(2).strip()
                wf = WEF_PAT.search(text)
                if wf:
                    try:
                        wef_score = float(wf.group(2))
                    except Exception:
                        pass

                # Evidence note is trimmed for brevity
                ev_note = text.strip().replace("\n", " ")
                if len(ev_note) > 300:
                    ev_note = ev_note[:297] + "..."

                # Scaffold a few sectors per page with found signals
                for sector in SEED_SECTORS:
                    rows.append({
                        "task_category": None,
                        "industry_sector": sector,
                        "implementation_cost_low": None,
                        "implementation_cost_high": None,
                        "roi_timeline_months": None,
                        "technology_maturity": maturity,
                        "wef_adoption_score": wef_score,
                        "regulatory_friction": None,
                        "min_org_size": None,
                        "annual_labor_cost_threshold": None,
                        "source": None,  # filled by caller
                        "source_url": None,  # filled by caller
                        "as_of_year": None,  # filled by caller
                        "adoption_current_pct": adoption_current,
                        "adoption_expected_pct": adoption_expected,
                        "payback_months": payback,
                        "region": None,
                        "country": None,
                        "evidence_note": ev_note,
                        "source_page": str(pnum),
                    })
    except Exception as e:
        print(f"Warning: failed to parse {pdf_path}: {e}")
    return rows


def main():
    ap = argparse.ArgumentParser(description="Extract/scaffold automation economics rows from PDFs with provenance")
    ap.add_argument("--as-of-year", type=int, required=True)
    ap.add_argument("--source", type=str, required=True)
    ap.add_argument("--source-url", type=str, required=True)
    ap.add_argument("--region", type=str, default="Global")
    ap.add_argument("--country", type=str, default="")
    ap.add_argument("--output", type=str, default="data/economics.csv")
    ap.add_argument("pdfs", nargs='+', help="One or more PDF paths")
    args = ap.parse_args()

    out_path = pathlib.Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    all_rows: List[Dict[str, Any]] = []
    for pdf in args.pdfs:
        rows = extract_from_pdf(pathlib.Path(pdf))
        for r in rows:
            r["source"] = args.source
            r["source_url"] = args.source_url
            r["as_of_year"] = args.as_of_year
            r["region"] = args.region
            r["country"] = args.country or None
        all_rows.extend(rows)

    # Deduplicate by (industry_sector, source_url, source_page, evidence_note)
    seen = set()
    deduped: List[Dict[str, Any]] = []
    for r in all_rows:
        key = (r.get("industry_sector"), r.get("source_url"), r.get("source_page"), r.get("evidence_note"))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(r)

    # Write CSV with headers
    with out_path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS)
        w.writeheader()
        for r in deduped:
            w.writerow({c: r.get(c) for c in COLUMNS})

    print(f"Wrote {len(deduped)} rows to {out_path}")

if __name__ == "__main__":
    main()
