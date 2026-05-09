#!/usr/bin/env python3
import csv
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib import error, request

SUPABASE_URL = "https://kvunnankqgfokeufvsrv.supabase.co"
FUNCTION_PATH = "/functions/v1/onet-enrichment"
DEFAULT_QUEUE_FILE = "enrichment_queue.csv"
DEFAULT_BATCH_SIZE = 25
DEFAULT_START_RANK = 1
REQUEST_TIMEOUT_SECONDS = 120
SLEEP_SECONDS = 1
REQUIRED_COLUMNS = {"priority_rank", "occupation_code_8"}
SUMMARY_COLUMNS = {"batch_no", "occupations", "start_rank", "end_rank", "total_employment"}


def fail(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def parse_positive_int(raw_value: str, name: str) -> int:
    try:
        value = int(raw_value)
    except ValueError as exc:
        raise SystemExit(f"ERROR: {name} must be an integer, got: {raw_value}") from exc
    if value <= 0:
        fail(f"ERROR: {name} must be greater than zero")
    return value


def resolve_queue_path(raw_path: str) -> Path:
    queue_path = Path(raw_path)
    if queue_path.is_file():
        return queue_path
    fail(
        "ERROR: Queue file not found: "
        f"{raw_path}\n\n"
        "To generate the queue:\n"
        "1. Run 13_BUILD_HEATMAP_BACKFILL_QUEUES.sql in Supabase SQL Editor\n"
        "2. Export the 'TOP ENRICHMENT QUEUE' result set as CSV\n"
        "3. Save as enrichment_queue.csv"
    )
    return queue_path


def normalize_fieldnames(fieldnames: list[str] | None) -> list[str]:
    if not fieldnames:
        fail("ERROR: CSV is empty or missing a header row")
    return [field.strip() for field in fieldnames]


def load_queue_rows(queue_path: Path, start_rank: int, end_rank: int) -> list[dict[str, str]]:
    with queue_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        fieldnames = normalize_fieldnames(reader.fieldnames)
        field_set = set(fieldnames)
        if "priority_rank" not in field_set and SUMMARY_COLUMNS.issubset(field_set):
            fail(
                "ERROR: This CSV looks like a batch summary export, not a row-level queue.\n"
                "Export 'TOP ENRICHMENT QUEUE', not the batch summary result set."
            )
        missing = REQUIRED_COLUMNS - field_set
        if missing:
            fail(
                "ERROR: Queue CSV is missing required columns: "
                f"{', '.join(sorted(missing))}\n"
                f"Found columns: {', '.join(fieldnames)}"
            )
        rows: list[dict[str, str]] = []
        for raw_row in reader:
            row = {
                (key or "").strip(): (value or "").strip()
                for key, value in raw_row.items()
                if key is not None
            }
            if not any(row.values()):
                continue
            rank_value = row.get("priority_rank", "")
            try:
                priority_rank = int(rank_value)
            except ValueError as exc:
                fail(f"ERROR: Invalid priority_rank value in {queue_path}: {rank_value}")
                raise exc
            if start_rank <= priority_rank <= end_rank:
                row["priority_rank"] = str(priority_rank)
                rows.append(row)
        rows.sort(key=lambda row: int(row["priority_rank"]))
        return rows


def build_headers() -> dict[str, str]:
    anon_key = os.environ.get("VITE_SUPABASE_ANON_KEY", "").strip()
    if not anon_key:
        fail("ERROR: VITE_SUPABASE_ANON_KEY environment variable not set")
    return {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
    }


def post_json(url: str, headers: dict[str, str], payload: dict[str, object]) -> tuple[int, str]:
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=body, headers=headers, method="POST")
    try:
        with request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as response:
            return response.getcode(), response.read().decode("utf-8", errors="replace")
    except error.HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", errors="replace")
    except Exception as exc:
        return 0, str(exc)


def write_log_line(log_path: Path, line: str) -> None:
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(line + "\n")


def main(argv: list[str]) -> int:
    queue_file = argv[1] if len(argv) > 1 else DEFAULT_QUEUE_FILE
    batch_size = parse_positive_int(argv[2], "batch_size") if len(argv) > 2 else DEFAULT_BATCH_SIZE
    start_rank = parse_positive_int(argv[3], "start_rank") if len(argv) > 3 else DEFAULT_START_RANK
    end_rank = start_rank + batch_size - 1
    queue_path = resolve_queue_path(queue_file)
    rows = load_queue_rows(queue_path, start_rank, end_rank)
    headers = build_headers()
    log_path = Path(__file__).resolve().parent / f"enrichment_backfill_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

    print("===================================")
    print("Enrichment Backfill Runner")
    print("===================================")
    print(f"Queue file: {queue_file}")
    print(f"Batch size: {batch_size}")
    print(f"Rank range: {start_rank} to {end_rank}")
    print(f"Selected rows: {len(rows)}")
    print(f"Log file: {log_path}")
    print()

    if not rows:
        print("No queue items found in the requested rank range.")
        return 0

    success_count = 0
    failure_count = 0
    url = f"{SUPABASE_URL}{FUNCTION_PATH}"

    for row in rows:
        priority_rank = row["priority_rank"]
        occupation_code = row.get("occupation_code_8", "")
        occupation_title = row.get("occupation_title", "")
        if not occupation_code:
            fail(f"ERROR: Row {priority_rank} is missing occupation_code_8")
        print(f"[{priority_rank}] Processing: {occupation_code} - {occupation_title}")
        status_code, response_body = post_json(
            url,
            headers,
            {
                "occupationCode": occupation_code,
                "forceRefresh": True,
            },
        )
        clean_body = " ".join(response_body.split())
        timestamp = datetime.now().isoformat(timespec="seconds")
        if status_code == 200:
            success_count += 1
            print("  SUCCESS")
            write_log_line(
                log_path,
                f"[{timestamp}] [{priority_rank}] SUCCESS: {occupation_code} | {status_code} | {clean_body}",
            )
        else:
            failure_count += 1
            print(f"  FAILED (HTTP {status_code})")
            write_log_line(
                log_path,
                f"[{timestamp}] [{priority_rank}] FAILED: {occupation_code} | {status_code} | {clean_body}",
            )
        time.sleep(SLEEP_SECONDS)

    print()
    print("===================================")
    print("Batch Complete")
    print("===================================")
    print(f"Success: {success_count}")
    print(f"Failure: {failure_count}")
    print(f"Log: {log_path}")
    print()
    print("Next steps:")
    print("1. Review the log file for failures")
    print("2. Run populate-heatmap-snapshot")
    print("3. Run 12_VERIFY_HEATMAP_BROAD_COVERAGE.sql")
    print(f"4. Process next batch with: ./scripts/backfill-enrichment.sh {queue_file} {batch_size} {end_rank + 1}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
