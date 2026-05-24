# Data Provenance Checksums

Generated: 2026-05-24T05:04:11.190Z
Source verification artifact: `docs/commercialization/source-verification-latest.json`
Source verification generated: 2026-05-24T05:03:18.404Z
All referenced current-source checks passed: yes
Current-source verification required for this local checksum pass: no

This file records hash-level evidence for local commercial data artifacts and source/provenance code used by the proof-pack flows. It is not a substitute for licensed provider imports, but it prevents silent drift in the current seed data and ingestion boundaries.

| Artifact | Label | Path | Type | Rows/Lines | SHA-256 | Source IDs | Status |
|---|---|---|---|---:|---|---|---|
| `wef-economics-csv` | WEF economics CSV seed | `public/data/econ_wef.csv` | csv | 1,740 | `cedb403873db0637...` | `wef-foj-2025` | pass |
| `occupation-risk-seed` | SEO occupation risk seed | `src/data/occupationRiskData.ts` | typescript-seed | 1,043 | `4b5826d0fb62c3a8...` | `onet`, `bls-emp`, `bls-oews`, `wef-foj-2025` | pass |
| `onet-ingest-boundary` | O*NET metadata ingestion boundary | `supabase/lib/scripts/ingest_onet_metadata.ts` | ingestion-script | 228 | `8deb7c39cc054a41...` | `onet` | pass |
| `source-manifest-module` | Source manifest module | `src/lib/sourceManifest.ts` | source-registry | 273 | `e021c03cbdf006d3...` | `onet`, `bls-emp`, `bls-oews`, `wef-foj-2025`, `anthropic-economic-index`, `anthropic-observed-exposure`, `openai-gdpval`, `bls-ai-mlr-2025`, `wcag-22`, `nist-ai-rmf`, `ada-ai-hiring-guidance`, `esco`, `lightcast`, `serpapi`, `llm-output` | pass |
| `report-evidence-card-module` | Report evidence card renderer | `src/lib/reportEvidenceCards.ts` | report-runtime | 91 | `2a82837b74fe7871...` | `onet`, `bls-ai-mlr-2025`, `nist-ai-rmf`, `llm-output` | pass |
| `work-transition-proof-pack-module` | AI work transition proof pack renderer | `src/lib/workTransitionProofPack.ts` | report-runtime | 979 | `cfb4295829b18df5...` | `onet`, `wef-foj-2025`, `anthropic-economic-index`, `anthropic-observed-exposure`, `openai-gdpval`, `bls-ai-mlr-2025`, `wcag-22`, `nist-ai-rmf`, `ada-ai-hiring-guidance`, `esco`, `lightcast`, `llm-output` | pass |
| `report-provenance-module` | Report provenance renderer | `src/lib/reportProvenance.ts` | report-runtime | 135 | `7e022db47a018150...` | `onet`, `bls-emp`, `bls-oews`, `wef-foj-2025`, `llm-output` | pass |
| `workforce-executive-report-module` | Workforce executive report artifact renderer | `src/lib/workforceExecutiveReport.ts` | report-runtime | 234 | `4ad0baba8eac8298...` | `onet`, `bls-emp`, `bls-oews`, `wef-foj-2025`, `llm-output` | pass |
| `artifact-review-event-migration` | Artifact review event migration | `supabase/migrations/20260524000200_add_commercial_artifact_review_events.sql` | supabase-migration | 87 | `f0179f9e596e98e0...` | `nist-ai-rmf`, `ada-ai-hiring-guidance`, `llm-output` | pass |

## Caveats

- `wef-economics-csv`: Local WEF-derived economics seed used for directional macro context; not a complete live labor-market feed.
- `occupation-risk-seed`: Hand-curated SEO seed data; do not claim full O*NET 30.3/BLS-backed scoring until refreshed imports are checksum-verified.
- `onet-ingest-boundary`: Ingestion utility boundary only; it proves import mechanics exist, not that current production tables are refreshed.
- `source-manifest-module`: Commercial source registry; adapter-ready records are not imported provider-backed data.
- `report-evidence-card-module`: Shared report evidence card renderer; evidence cards still depend on correct source assignment in each report flow.
- `work-transition-proof-pack-module`: Emerging role radar, skill-change ledger, and section-level review workflow are planning signals; provider-backed market validation remains adapter-ready.
- `report-provenance-module`: Runtime report trust layer; each generated report still needs its own source snapshot and artifact event history.
- `workforce-executive-report-module`: Client-side pilot artifact renderer; final enterprise reporting still needs signed storage, PDF generation, and delivery/audit events.
- `artifact-review-event-migration`: Staff review events create an append-only readiness trail; they do not replace legal, accessibility, or labor-relations review.
