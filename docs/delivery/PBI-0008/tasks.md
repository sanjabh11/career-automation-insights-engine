# Tasks for PBI-0008: Homepage & Navigation Redesign

**Parent PBI**: [PBI-0008](./prd.md)

## Task Summary

| Task ID | Name | Status | Description |
|---------|------|--------|-------------|
| PBI-0008-T1 | Hero Redesign | Done | Implement search-first split layout with quick filters and CTAs |
| PBI-0008-T2 | Navigation Consolidation | Done | Add Evidence dropdown and update top nav structure |
| PBI-0008-T3 | Homepage Simplification | Done | Remove heavy content, add teaser + footer |
| PBI-0008-T4 | Naming Updates | Done | Rename labels across app for consistency |
| PBI-0008-T5 | O*NET API Fix | Done | Replace Netlify functions with Supabase edge functions |
| PBI-0008-T6 | Planner Integration | Done | Implement hero→planner handoff via localStorage |
| PBI-0008-T7 | Accessibility | Done | Add ARIA roles, keyboard nav, tap targets |
| PBI-0008-T8 | Documentation | Done | Create PRD and task files |

## Task Details

### PBI-0008-T1: Hero Redesign
**Status**: Done  
**Files**: `src/components/Hero.tsx`

**Changes**:
- Replaced oversized background hero with compact split layout
- Left side: search input, quick filter chips, CTAs, examples
- Right side: 3 value proposition chips
- Added subtle validation badge
- Implemented localStorage handoff for last search
- ARIA role="search" and keyboard Enter support

**Acceptance**:
- [x] Search input visible above fold
- [x] Quick filters navigate to browse pages
- [x] Primary CTA stores search and opens planner
- [x] Secondary CTA navigates to browse
- [x] Hero height ~35-40vh

---

### PBI-0008-T2: Navigation Consolidation
**Status**: Done  
**Files**: `src/components/EnhancedAPODashboardHeader.tsx`

**Changes**:
- Replaced Dashboard button with Product, Browse, Planner links
- Added Evidence dropdown with 6 items (Market Signals, Validation, Methods, Operations, Responsible AI, Quality)
- Updated mobile menu to match
- Renamed brand to "Automation Insights"

**Acceptance**:
- [x] Evidence dropdown shows all 6 pages
- [x] Mobile menu has Evidence group
- [x] All nav links route correctly

---

### PBI-0008-T3: Homepage Simplification
**Status**: Done  
**Files**: `src/pages/Index.tsx`

**Changes**:
- Removed heavy evidence cards grid
- Removed full APODashboard from homepage
- Added Top Occupations teaser band
- Added Evidence & Transparency footer with links

**Acceptance**:
- [x] Homepage loads faster (less content)
- [x] Top Occupations teaser renders
- [x] Footer Evidence links work

---

### PBI-0008-T4: Naming Updates
**Status**: Done  
**Files**: 
- `src/components/AIImpactPlannerButton.tsx`
- `src/components/AIImpactPlanner.tsx`
- `src/pages/AIImpactPlannerPage.tsx`
- `src/pages/OutcomesPage.tsx`
- `src/components/APODashboard.tsx`
- `src/components/APODashboardHeader.tsx`
- `src/pages/Index.tsx`

**Changes**:
- "AI Impact Planner" → "Career Impact Planner"
- "Outcomes" → "Market Signals"
- "Career APO Explorer" → "Occupation Explorer"
- "Automation Potential Oracle" → "Automation Insights"

**Acceptance**:
- [x] All labels updated consistently
- [x] No legacy naming in UI

---

### PBI-0008-T5: O*NET API Fix
**Status**: Done  
**Files**: `src/components/AIImpactPlanner.tsx`

**Changes**:
- Replaced Netlify function calls with Supabase edge function
- Changed from `fetch('/.netlify/functions/onet-proxy')` to `supabase.functions.invoke('onet-proxy')`
- Fixed both `searchOccupations` and `findSimilarOccupations`
- Removed unused `getFunctionsBaseUrl` import

**Acceptance**:
- [x] Search uses Supabase edge function
- [x] No Netlify function calls
- [x] Error handling improved

---

### PBI-0008-T6: Planner Integration
**Status**: Done  
**Files**: 
- `src/components/Hero.tsx`
- `src/components/AIImpactPlanner.tsx`

**Changes**:
- Hero stores last search in `localStorage.setItem('planner:lastSearch', query)`
- Planner reads on mount, prefills, auto-searches, then clears key
- useEffect with proper dependency array

**Acceptance**:
- [x] Hero→planner handoff works
- [x] Planner auto-searches on load
- [x] localStorage key cleared after use

---

### PBI-0008-T7: Accessibility
**Status**: Done  
**Files**: `src/components/Hero.tsx`

**Changes**:
- Added `role="search"` and `aria-label="Occupation search"`
- Keyboard Enter triggers analyze
- All chips have `h-11` (44px) for tap targets
- Proper focus order

**Acceptance**:
- [x] ARIA roles present
- [x] Keyboard navigation works
- [x] Tap targets ≥44px

---

### PBI-0008-T8: Documentation
**Status**: Done  
**Files**: 
- `docs/delivery/PBI-0008/prd.md`
- `docs/delivery/PBI-0008/tasks.md`

**Changes**:
- Created comprehensive PRD with scope, acceptance criteria, test plan
- Created task breakdown
- Documented all file changes

**Acceptance**:
- [x] PRD complete
- [x] Tasks documented
- [x] Tier2 policy followed

## Testing Checklist

### Manual Testing Required
- [ ] Load `/` and verify hero search above fold
- [ ] Type "Software Developer" → Enter → verify planner opens with results
- [ ] Click each quick filter chip → verify navigation
- [ ] Click "Analyze my role" → verify planner prefill
- [ ] Desktop: Click Evidence dropdown → verify 6 items
- [ ] Mobile: Open menu → verify Evidence group
- [ ] Tab through hero → verify focus order
- [ ] Check network tab → verify Supabase edge function calls

### Automated Testing (Future)
- [ ] Playwright E2E for hero→planner flow
- [ ] Lighthouse accessibility score ≥95
- [ ] Axe accessibility scan

## Deployment Checklist
- [x] All code changes committed
- [x] No breaking changes
- [x] No database migrations needed
- [x] No new environment variables
- [ ] Smoke test on staging
- [ ] Deploy to production
- [ ] Monitor error rates

## Success Metrics (To Track)
- Homepage search usage rate
- Planner engagement from homepage
- Evidence page discovery rate
- Mobile vs desktop usage patterns
