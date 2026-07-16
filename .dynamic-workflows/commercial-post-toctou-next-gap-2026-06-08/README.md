# Dynamic Workflow Backlog: commercial-post-toctou-next-gap-2026-06-08

Goal: Audit the current commercial launch readiness repo state after owner-evidence hasher TOCTOU hardening. Find the next unblocked repo-local proof-boundary, evidence-alignment, source, verifier, security, accessibility, or owner-handoff gap that moves launch readiness without synthesizing owner-held proof. Preserve pilot-only launch decision until manual WCAG evidence, real Stripe test checkout, live MRR, three committed partners, documented outcomes, and Supabase owner access are proven. No production deploys, credentials, payment changes, live outreach, destructive commands, or worker execution without explicit approval.

## Commands

- Status: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js status --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-post-toctou-next-gap-2026-06-08`
- Next: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js next --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-post-toctou-next-gap-2026-06-08`
- Preview workers: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js run-workers --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-post-toctou-next-gap-2026-06-08 --dry-run`
- Execute workers: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js run-workers --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-post-toctou-next-gap-2026-06-08 --execute`
- Dashboard: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js dashboard --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-post-toctou-next-gap-2026-06-08`
- Export worktree plan: `node skills/dynamic-workflow-backlog/scripts/dynamic-workflow-backlog.js export-worktree-plan --run /Users/sanjayb/Documents/newrepo/career-automation-insights-engine/.dynamic-workflows/commercial-post-toctou-next-gap-2026-06-08 --out .orchestration/commercial-post-toctou-next-gap-2026-06-08.json`

## Files

- `workflow.json`: run metadata and safety limits
- `workflow.js`: run-specific executable wrapper for status, next, synthesize, and export commands
- `backlog.jsonl`: task state
- `results.jsonl`: completion evidence
- `claims.jsonl`: claim and review evidence
- `waves/`: optional worker wave plans, status files, and handoffs
