# Dynamic Workflow Backlog: commercial-owner-evidence-next-slice-2026-06-05

Goal: Continue career-automation-insights-engine commercial launch readiness by selecting and implementing one bounded repo-side owner-evidence preparation slice. Constraints: no production deploys, no live credentials, no payment changes, no customer outreach, no destructive actions, no owner-held evidence fabrication, and launch decision must remain pilot-only while gates remain open.

## Commands

- Status: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js status --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-owner-evidence-next-slice-2026-06-05`
- Next: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js next --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-owner-evidence-next-slice-2026-06-05`
- Preview workers: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js run-workers --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-owner-evidence-next-slice-2026-06-05 --dry-run`
- Execute workers: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js run-workers --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-owner-evidence-next-slice-2026-06-05 --execute`
- Dashboard: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js dashboard --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-owner-evidence-next-slice-2026-06-05`
- Export worktree plan: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js export-worktree-plan --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-owner-evidence-next-slice-2026-06-05 --out .orchestration/commercial-owner-evidence-next-slice-2026-06-05.json`

## Files

- `workflow.json`: run metadata and safety limits
- `workflow.js`: run-specific executable wrapper for status, next, synthesize, and export commands
- `backlog.jsonl`: task state
- `results.jsonl`: completion evidence
- `claims.jsonl`: claim and review evidence
- `waves/`: optional worker wave plans, status files, and handoffs
