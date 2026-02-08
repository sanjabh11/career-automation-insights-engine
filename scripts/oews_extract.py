#!/usr/bin/env python3
import sys
import os
import pandas as pd

SOC6 = {"15-1252","29-1141","41-2011","43-4051","53-3032","11-1021"}

RENAME = {
    "occ_code": "occ_code",
    "occ code": "occ_code",
    "tot_emp": "tot_emp",
    "total employment": "tot_emp",
    "a_median": "a_median",
    "annual median wage": "a_median",
    "a_mean": "a_mean",
    "annual mean wage": "a_mean",
}

NUMERIC_COLS = {"tot_emp", "a_median", "a_mean"}


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    cols = [str(c).strip().lower() for c in df.columns]
    mapped = []
    for c in cols:
        mapped.append(RENAME.get(c, c.replace(" ", "_")))
    df.columns = mapped
    return df


def coerce_numeric(df: pd.DataFrame) -> pd.DataFrame:
    for c in NUMERIC_COLS:
        if c in df.columns:
            df[c] = (
                df[c]
                .astype(str)
                .str.replace(",", "", regex=False)
                .str.replace("—", "", regex=False)
                .str.replace("-", "-", regex=False)
            )
            df[c] = pd.to_numeric(df[c], errors="coerce")
    return df


def main():
    if len(sys.argv) != 4:
        print("Usage: oews_extract.py <input_xlsx> <year> <output_csv>")
        sys.exit(1)
    in_xlsx = sys.argv[1]
    year = int(sys.argv[2])
    out_csv = sys.argv[3]

    if not os.path.exists(in_xlsx):
        print(f"Input not found: {in_xlsx}")
        sys.exit(2)

    # Read first sheet by default; OEWS national files usually put data on first sheet
    df = pd.read_excel(in_xlsx, engine="openpyxl")
    df = normalize_columns(df)

    # Select relevant columns if present
    want_cols = [c for c in ["occ_code", "tot_emp", "a_median", "a_mean"] if c in df.columns]
    if not want_cols:
        print("Could not find required columns in the workbook header")
        print(f"Columns present: {list(df.columns)}")
        sys.exit(3)

    df = df[want_cols]
    df = coerce_numeric(df)

    # Filter to target SOC6 codes
    df = df[df["occ_code"].astype(str).str.strip().isin(SOC6)].copy()
    if df.empty:
        print("Warning: No target SOC-6 rows found in this file.")

    # Ensure output directory
    os.makedirs(os.path.dirname(out_csv), exist_ok=True)

    # Save as minimal CSV with expected headers
    # Headers must match bls-sync parser expectations (case-insensitive)
    df.to_csv(out_csv, index=False)
    print(f"Wrote {len(df)} rows to {out_csv}")


if __name__ == "__main__":
    main()
