# Contributing

As of 2026-06-01, this repository is maintained as a reviewable decision-support application, not as a popularity or adoption claim. Contributions should reduce maintainer burden, strengthen regression coverage, or improve source-labeled career and workforce data pipelines.

## Good First Contribution Areas

| Area | Useful contribution | Proof expected |
| --- | --- | --- |
| PR review quality | Smaller changes, clear acceptance evidence, and no unsupported product claims | PR summary plus relevant verifier output |
| CI and regression tests | Focused Playwright, TypeScript, lint, or verifier coverage for an existing workflow | Passing local command and hosted GitHub check when available |
| Data pipeline maintenance | Source-date updates, provenance checksums, adapter boundary fixes, or schema validation | Source link, retrieval date, and `npm run verify:data-provenance` when relevant |
| Evidence boundaries | Redacted proof templates, does-not-prove text, and owner-held evidence validators | `npm run verify:commercial-trust` or narrower verifier |
| Documentation hygiene | Removing stale certainty language and linking to canonical status | `npm run verify:claim-boundaries` when claim wording changes |

## Local Setup

```bash
npm install
npm run dev
```

## Pull Request Checklist

Run the narrowest relevant checks first, then the broader gates when your change touches shared behavior.

```bash
npx tsc --noEmit
npm run lint
npm run verify:report-evidence
npm run verify:secrets
npm run verify:commercial-trust
```

For commercial proof-pack, data provenance, claim-boundary, or CI workflow changes, also run:

```bash
npm run verify:commercial
npm run verify:claim-boundaries
```

`npm run verify:commercial` intentionally regenerates timestamped evidence docs. Review the generated diff before committing.

## Claim Boundaries

Do not describe APO outputs as scientific validation, job-loss prediction, employment-decision automation, live revenue proof, or localized wage/outlook proof unless the repository contains current evidence for that exact claim. Use dated, sourced, scoped wording and include a `doesNotProve` boundary when a proof artifact could be misread.

## Secrets And Owner-Held Evidence

Never commit secrets, raw partner identities, customer data, private notes, Stripe payloads, Supabase service-role keys, or hash salts. Use the gitignored local evidence templates documented in `docs/commercialization/phase-e-commercial-validation-playbook.md`.

## License

By contributing, you agree that your contribution is provided under the MIT License in `LICENSE`.
