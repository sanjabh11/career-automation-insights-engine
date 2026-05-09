# Tasks for PBI-0009: Occupation Market Heatmap

**Parent PBI**: [PBI-0009](./prd.md)

## Task Summary

| Task ID | Name | Status | Description |
|---------|------|--------|-------------|
| PBI-0009-T1 | Data Layer Foundation | InProgress | Create heatmap data tables and indexes |
| PBI-0009-T2 | Snapshot Publish Flow | Proposed | Define and implement snapshot/publish workflow |
| PBI-0009-T3 | Heatmap Read API | InProgress | Add dedicated read endpoint for grouped/filterable cells |
| PBI-0009-T4 | Isolated Frontend Route | InProgress | Add lazy-loaded heatmap page and supporting components |
| PBI-0009-T5 | Verification & Release Safety | InProgress | Validate data integrity, regressions, and performance |

## Task Details

### PBI-0009-T1: Data Layer Foundation
**Status**: InProgress
**Files**:
- `supabase/migrations/*_create_heatmap_data_layer.sql`

**Changes**:
- Create `occupation_market_facts`
- Create `occupation_exposure_snapshot`
- Create `occupation_heatmap_cells`
- Add indexes for region, snapshot, group, and occupation lookups

**Acceptance**:
- [x] Tables created in migration file
- [x] Indexes created in migration file
- [x] Public/service-role access policy defined in migration file

---

### PBI-0009-T2: Snapshot Publish Flow
**Status**: Proposed
**Files**:
- `supabase/functions/*`

**Acceptance**:
- [ ] Batch-friendly snapshot path documented and implemented
- [ ] Heatmap serving table can be refreshed without live UI coupling

---

### PBI-0009-T3: Heatmap Read API
**Status**: InProgress
**Files**:
- `supabase/functions/*`

**Acceptance**:
- [x] API returns compact treemap-ready payload
- [x] Filters supported server-side

---

### PBI-0009-T4: Isolated Frontend Route
**Status**: InProgress
**Files**:
- `src/pages/*`
- `src/components/*`
- `src/App.tsx`

**Acceptance**:
- [x] Lazy-loaded route added
- [x] Existing primary flows untouched

---

### PBI-0009-T5: Verification & Release Safety
**Status**: InProgress

**Acceptance**:
- [ ] Manual regression checklist completed
- [ ] Build/tests relevant to changed surfaces pass
- [ ] Data quality spot checks documented
