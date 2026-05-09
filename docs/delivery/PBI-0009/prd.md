# PBI-0009: Occupation Market Heatmap

**Status**: InProgress
**Priority**: High
**Type**: Feature / Data Platform / UI
**Tier**: Tier2 (Behavioral change)

## Overview
Create a scalable occupation market heatmap that visualizes employment scale and automation exposure using precomputed data, while preserving the speed and stability of the existing search, planner, and occupation detail flows.

## Business Goals
- Launch a market-intelligence visualization that expands beyond single-occupation analysis
- Reuse existing O*NET, BLS, and APO infrastructure without introducing runtime regressions
- Support national and state-aware views through a dedicated serving layer
- Keep the implementation isolated from existing critical user journeys until verified

## User Stories
1. As a user, I want to view occupations in a market map so I can compare exposure and job scale at a glance.
2. As a researcher, I want grouping and filtering by career cluster and region so I can explore patterns efficiently.
3. As a product owner, I want this feature to ship without slowing the homepage, planner, or occupation detail page.

## Scope

### In Scope
- Heatmap data layer tables for normalized market facts, exposure snapshots, and serving cells
- A dedicated heatmap read API
- An isolated frontend route for the market map
- National-first delivery with state-ready schema and API contracts

### Out of Scope For Initial Slice
- Embedding the heatmap inside homepage, planner, or occupation detail flows
- Region-specific APO re-scoring logic
- CSV/PDF export and advanced sharing workflows
- Metro-level or county-level geography

## Technical Approach
1. Create `occupation_market_facts` for normalized occupation + region + year market data.
2. Create `occupation_exposure_snapshot` for precomputed APO exposure snapshots.
3. Create `occupation_heatmap_cells` as the serving table for fast UI/API reads.
4. Add a dedicated read function for grouped/filterable treemap payloads.
5. Add an isolated lazy-loaded route for the market map UI.

## Acceptance Criteria
- [ ] Data layer tables exist with indexes appropriate for region and grouping filters.
- [ ] Heatmap pipeline architecture does not require live APO computation at page render time.
- [ ] API contract supports region, grouping, and basic filter controls.
- [ ] Frontend route is isolated from existing search/planner/detail flows.
- [ ] Manual validation and performance checks are documented before release.

## Risks
- SOC-6 vs SOC-8 join mismatches could duplicate or drop occupations.
- Overly large payloads could hurt treemap interactivity.
- Mixing heatmap logic into existing routes could create regressions.

## Related Tasks
See `tasks.md` in the same directory.
