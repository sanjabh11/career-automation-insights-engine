# Dynamic Workflow Backlog: live-closeout-owner-access-recovery

Goal: Recover live closeout owner access evidence for career-automation-insights-engine without deploying, mutating production, printing secrets, or claiming owner gates closed

## Commands

- Status: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js status --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/live-closeout-owner-access-recovery`
- Next: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js next --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/live-closeout-owner-access-recovery`
- Preview workers: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js run-workers --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/live-closeout-owner-access-recovery --dry-run`
- Execute workers: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js run-workers --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/live-closeout-owner-access-recovery --execute`
- Dashboard: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js dashboard --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/live-closeout-owner-access-recovery`
- Export worktree plan: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js export-worktree-plan --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/live-closeout-owner-access-recovery --out .orchestration/live-closeout-owner-access-recovery.json`

## Files

- `workflow.json`: run metadata and safety limits
- `workflow.js`: run-specific executable wrapper for status, next, synthesize, and export commands
- `backlog.jsonl`: task state
- `results.jsonl`: completion evidence
- `claims.jsonl`: claim and review evidence
- `waves/`: optional worker wave plans, status files, and handoffs
