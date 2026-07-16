# Dynamic Workflow Backlog: commercial-owner-evidence-closeout-current-audit-2026-06-08

Goal: Audit current commercial launch-readiness closeout state after full local verification passed. Preserve pilot-only launch boundaries, verify current best-practice source coverage, and identify only repo-local gaps that can be fixed without secrets, production mutation, payments, outreach, or owner-held evidence.

## Commands

- Status: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js status --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-owner-evidence-closeout-current-audit-2026-06-08`
- Next: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js next --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-owner-evidence-closeout-current-audit-2026-06-08`
- Preview workers: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js run-workers --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-owner-evidence-closeout-current-audit-2026-06-08 --dry-run`
- Execute workers: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js run-workers --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-owner-evidence-closeout-current-audit-2026-06-08 --execute`
- Dashboard: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js dashboard --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-owner-evidence-closeout-current-audit-2026-06-08`
- Export worktree plan: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js export-worktree-plan --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-owner-evidence-closeout-current-audit-2026-06-08 --out .orchestration/commercial-owner-evidence-closeout-current-audit-2026-06-08.json`

## Files

- `workflow.json`: run metadata and safety limits
- `workflow.js`: run-specific executable wrapper for status, next, synthesize, and export commands
- `backlog.jsonl`: task state
- `results.jsonl`: completion evidence
- `claims.jsonl`: claim and review evidence
- `waves/`: optional worker wave plans, status files, and handoffs
