# Owner Evidence Local Safety

Generated: 2026-06-08T23:24:34.221Z

Status: `passed`

This preflight checks git tracking, staging, and ignore policy for owner-held local evidence paths. It never reads `.env.local` or `docs/commercialization/*.local.json` contents.

## Counts

| Field | Count |
| --- | ---: |
| Protected paths | 10 |
| Ignored protected paths | 10 |
| Tracked sensitive file violations | 0 |
| Staged sensitive path violations | 0 |
| Reference practices | 2 |
| Does-not-prove boundaries | 3 |
| Errors | 0 |

## Protected Paths

| Path | Kind | Ignored | Tracked | Staged | Ignore source |
| --- | --- | --- | --- | --- | --- |
| `.env` | owner_environment | yes | no | no | .gitignore:18 .env |
| `.env.local` | owner_environment | yes | no | no | .gitignore:19 .env.* |
| `.env.production` | owner_environment | yes | no | no | .gitignore:19 .env.* |
| `.env.production.local` | owner_environment | yes | no | no | .gitignore:19 .env.* |
| `.env.test.local` | owner_environment | yes | no | no | .gitignore:19 .env.* |
| `docs/commercialization/live-gate-evidence.local.json` | owner_live_evidence | yes | no | no | .gitignore:44 docs/commercialization/*.local.json |
| `docs/commercialization/commercial-evidence-intake.local.json` | owner_commercial_intake | yes | no | no | .gitignore:44 docs/commercialization/*.local.json |
| `docs/commercialization/commercial-evidence-records.local.json` | owner_commercial_records | yes | no | no | .gitignore:44 docs/commercialization/*.local.json |
| `docs/commercialization/manual-wcag-evidence.local.json` | owner_manual_wcag_evidence | yes | no | no | .gitignore:44 docs/commercialization/*.local.json |
| `docs/commercialization/__owner-evidence-local-safety-probe__.local.json` | future_owner_local_json | yes | no | no | .gitignore:44 docs/commercialization/*.local.json |

## Sensitive Tracked File Scan

Tracked sensitive file violations: 0

Staged sensitive path violations: 0

## Errors

- none

## Evidence Boundary

This preflight proves only git ignore/tracking/staging policy for owner-held local evidence paths. It does not inspect file contents, validate redacted evidence completeness, prove live payment or revenue, prove partner commitments, prove documented outcomes, prove manual WCAG conformance, or replace host-level secret scanning/push protection.

## Does Not Prove

- absence of secrets in git history, logs, screenshots, local machines, cloud dashboards, browser caches, or third-party systems
- validity or completeness of local owner evidence files
- commercial-ready status, legal compliance, WCAG conformance, or procurement approval
