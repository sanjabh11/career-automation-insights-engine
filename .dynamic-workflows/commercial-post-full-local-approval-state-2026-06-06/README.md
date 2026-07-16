# Dynamic Workflow Backlog: commercial-post-full-local-approval-state-2026-06-06

Goal: Continue phase-wise commercial launch readiness implementation by selecting and completing the next repo-local proof-boundary hardening slice after full-local approval state coverage, while preserving pilot-only launch decision and all owner/live/optional approval gates.

## Commands

- Status: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js status --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-post-full-local-approval-state-2026-06-06`
- Next: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js next --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-post-full-local-approval-state-2026-06-06`
- Preview workers: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js run-workers --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-post-full-local-approval-state-2026-06-06 --dry-run`
- Execute workers: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js run-workers --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-post-full-local-approval-state-2026-06-06 --execute`
- Dashboard: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js dashboard --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-post-full-local-approval-state-2026-06-06`
- Export worktree plan: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js export-worktree-plan --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-post-full-local-approval-state-2026-06-06 --out .orchestration/commercial-post-full-local-approval-state-2026-06-06.json`

## Files

- `workflow.json`: run metadata and safety limits
- `workflow.js`: run-specific executable wrapper for status, next, synthesize, and export commands
- `backlog.jsonl`: task state
- `results.jsonl`: completion evidence
- `claims.jsonl`: claim and review evidence
- `waves/`: optional worker wave plans, status files, and handoffs
