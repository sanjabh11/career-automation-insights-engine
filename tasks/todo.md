# Task Plan

## Active Work
- [x] Audit the live heatmap backfill workflow against the intended operational path
- [x] Confirm the current root causes across queue exports and runner implementation
- [x] Restore robust CSV-driven backfill runners for enrichment and APO
- [x] Align runnable documentation with the checked-in runner behavior and queue exports
- [x] Run targeted verification on the updated scripts and summarize exact next execution order

## Review
- Confirmed `scripts/backfill-enrichment.sh` and `scripts/backfill-apo.sh` had drifted back to brittle `awk` parsing.
- Confirmed the Python runner files were missing from `scripts/`, so the documented robust path was not actually present in the repo.
- Confirmed `scripts/enrichment_queue.csv` is a batch-summary export (`APO BATCHES`), not a row-level queue export suitable for the enrichment runner.
- Verified `supabase/data/imports/13_BUILD_HEATMAP_BACKFILL_QUEUES.sql` still exposes the authoritative row-level queue result sets needed for export.
- Restored `scripts/backfill_enrichment.py` and `scripts/backfill_apo.py`, and converted the shell scripts into thin Python wrappers.
- Aligned `scripts/README_BACKFILL.md` and `docs/delivery/PBI-0009/BATCH_BACKFILL_PLAN.md` with the checked-in runner flow and explicit queue-export guidance.
- Updated SQL batch labels to clearly mark summary result sets as not intended for runner input.
- Verified shell syntax, Python syntax, and wrapper behavior; the runner now rejects the checked-in summary CSV with the expected error.
