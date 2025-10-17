# PBI-0008: Homepage & Navigation Redesign

**Status**: Done  
**Priority**: High  
**Type**: Feature / UI  
**Tier**: Tier2 (Behavioral change)

## Overview
Redesign homepage and top navigation to prioritize search-first user flow, consolidate evidence navigation, and simplify naming conventions for better discoverability and reduced cognitive load.

## Business Goals
- **Increase engagement**: Make search and planner the primary entry points
- **Reduce bounce rate**: Clear value proposition and CTAs above the fold
- **Improve discoverability**: Evidence pages accessible but not overwhelming
- **Simplify branding**: Remove internal jargon (APO, Oracle) for general audience

## User Stories
1. As a **job seeker**, I want to search for my occupation immediately on the homepage so I can quickly understand AI impact
2. As a **career counselor**, I want to explore occupations by category (Bright Outlook, STEM) so I can guide clients
3. As a **researcher**, I want to access evidence and validation pages easily so I can verify methodology
4. As a **mobile user**, I want a clean, focused interface so I can navigate without clutter

## Scope

### Completed
- ✅ Redesign hero section as search-first split layout
- ✅ Add quick filter chips (Bright Outlook, STEM, Tech Skills, Job Zones)
- ✅ Consolidate top navigation with Evidence dropdown
- ✅ Rename labels: Automation Insights (brand), Market Signals (outcomes), Career Impact Planner, Occupation Explorer
- ✅ Reduce homepage density: remove heavy stat cards and full dashboard
- ✅ Add Top Occupations teaser and Evidence & Transparency footer
- ✅ Implement hero→planner handoff via localStorage
- ✅ Fix O*NET API calls to use Supabase edge functions (removed Netlify dependency)
- ✅ Accessibility: ARIA roles, keyboard navigation, 44px tap targets

### Out of Scope
- Backend changes to evidence pages
- New telemetry implementation (deferred to future PBI)
- Lighthouse performance optimization (deferred to future PBI)
- Mobile-specific redesign beyond responsive layout

## Technical Design

### Architecture
- **Frontend**: React components with Framer Motion animations
- **State**: localStorage for last search handoff (`planner:lastSearch`)
- **API**: Supabase edge functions for O*NET proxy
- **Styling**: TailwindCSS with existing design system

### Key Components Modified
1. `src/components/Hero.tsx` - Complete redesign to search-first split layout
2. `src/components/EnhancedAPODashboardHeader.tsx` - Navigation restructure with Evidence dropdown
3. `src/pages/Index.tsx` - Homepage simplification (removed APODashboard, added teaser + footer)
4. `src/components/AIImpactPlanner.tsx` - Auto-prefill from hero, fixed O*NET API calls
5. `src/components/AIImpactPlannerButton.tsx` - Label update to "Career Impact Planner"
6. `src/pages/AIImpactPlannerPage.tsx` - Back button label update
7. `src/pages/OutcomesPage.tsx` - Heading update to "Market Signals & KPIs"
8. `src/components/APODashboard.tsx` - Label update to "Career Impact Planner"
9. `src/components/APODashboardHeader.tsx` - Label update to "Occupation Explorer"

### API Changes
- **Before**: Used Netlify functions (`/.netlify/functions/onet-proxy`)
- **After**: Uses Supabase edge functions (`supabase.functions.invoke('onet-proxy', { body: { path } })`)
- Requires `ONET_USERNAME` and `ONET_PASSWORD` environment variables

## Acceptance Criteria

### Functional
- [x] Hero search input accepts occupation/skill queries
- [x] Enter key triggers search and navigates to planner
- [x] Quick filter chips navigate to correct browse pages
- [x] "Analyze my role" CTA stores search and opens planner with prefilled results
- [x] "Explore occupations" CTA navigates to Bright Outlook browse
- [x] Evidence dropdown shows all 6 pages (Market Signals, Validation, Methods, Operations, Responsible AI, Quality)
- [x] Mobile menu shows same navigation structure
- [x] Top Occupations teaser renders on homepage
- [x] Footer Evidence links all work
- [x] O*NET search uses Supabase edge functions

### Non-Functional
- [x] Hero height ~35-40vh on desktop (content-driven)
- [x] Search input has ARIA role="search"
- [x] All chips have ≥44px tap targets (h-11 = 44px)
- [x] Tab order: search → chips → CTAs → nav
- [x] O*NET API calls properly routed to Supabase

### Naming Consistency
- [x] "Automation Insights" appears in header brand
- [x] "Career Impact Planner" in button, page heading, planner component, and mobile menu
- [x] "Market Signals" in Evidence dropdown, mobile menu, footer, and OutcomesPage heading
- [x] "Occupation Explorer" in APODashboardHeader
- [x] No instances of "APO Dashboard", "Automation Potential Oracle", or "Evidence Hub"

## Test Plan

### Manual Testing (Required)
1. **Homepage Flow**
   - Load `/` → verify hero search is visible above fold
   - Type "Software Developer" → press Enter → verify navigation to `/ai-impact-planner` with results
   - Click "Bright Outlook" chip → verify navigation to `/browse/bright-outlook`
   - Click "Analyze my role" → verify planner opens with last search
   - Scroll to footer → verify all Evidence links work

2. **Navigation**
   - Desktop: Click Evidence dropdown → verify all 6 items
   - Mobile: Open menu → verify Evidence group with 6 items
   - Verify all nav links route correctly

3. **Accessibility**
   - Tab through hero → verify focus order
   - Screen reader: verify search has proper label
   - Keyboard: Enter in search triggers analyze

4. **O*NET Integration**
   - Search "Nurse" → verify results appear
   - Search "invalid12345" → verify error handling
   - Check network tab → verify calls to Supabase edge function (not Netlify)

### Automated Testing (Future)
- Playwright E2E for hero→planner flow
- Lighthouse CI for performance regression
- Axe accessibility scan

## Implementation Summary

### Files Changed
- `src/components/Hero.tsx` - 120 lines (complete rewrite)
- `src/components/EnhancedAPODashboardHeader.tsx` - Navigation + dropdown
- `src/pages/Index.tsx` - Simplified layout
- `src/components/AIImpactPlanner.tsx` - API fix + auto-prefill
- `src/components/AIImpactPlannerButton.tsx` - Label
- `src/pages/AIImpactPlannerPage.tsx` - Back button
- `src/pages/OutcomesPage.tsx` - Heading
- `src/components/APODashboard.tsx` - Label + comment
- `src/components/APODashboardHeader.tsx` - Label

### Lines of Code
- **Added**: ~200 lines (new Hero, navigation structure)
- **Modified**: ~150 lines (API calls, labels, layout)
- **Removed**: ~100 lines (old Hero, Netlify calls, unused imports)

## Risks & Mitigations

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| O*NET API rate limits | High | Implement client-side caching, rate limit UI | Future work |
| Search returns no results | Medium | Add helpful error messages, suggest alternatives | Implemented (toast) |
| Mobile layout breaks | Medium | Responsive testing, progressive enhancement | Needs testing |
| Users can't find evidence pages | Low | Footer links, clear dropdown labels | Implemented |

## Dependencies
- ✅ Supabase edge function `onet-proxy` deployed
- ✅ Environment variables `ONET_USERNAME` and `ONET_PASSWORD` set
- ✅ `TopCareersPanel` component exists

## Success Metrics (To Be Measured)
- **Engagement**: 30% increase in planner usage from homepage
- **Search**: 70% of homepage visitors use search within 10s
- **Navigation**: <5% bounce rate from homepage
- **Accessibility**: Lighthouse score ≥95

## Related Work
- PBI-0001: Gemini LLM integration (planner backend)
- PBI-0004: Skill Gap Planner (future enhancement)
- PBI-0005: O*NET Data Depth (browse functionality)

## References
- [AI Coding Policy](/docs/AI_CODING_POLICY.md) - Tier2 requirements
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [O*NET Web Services API](https://services.onetcenter.org/reference/)

## Deployment Notes
- No database migrations required
- No environment variable changes (uses existing ONET credentials)
- Frontend-only changes, safe to deploy independently
- Recommend smoke test: homepage → search → planner flow
