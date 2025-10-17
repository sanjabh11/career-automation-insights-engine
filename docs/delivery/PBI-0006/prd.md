# PBI-0006: Homepage & Navigation Redesign

**Status**: InProgress  
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

### In Scope
- ✅ Redesign hero section as search-first split layout
- ✅ Add quick filter chips (Bright Outlook, STEM, Tech Skills, Job Zones)
- ✅ Consolidate top navigation with Evidence dropdown
- ✅ Rename labels: Automation Insights (brand), Market Signals (outcomes), Career Impact Planner
- ✅ Reduce homepage density: remove heavy stat cards and full dashboard
- ✅ Add Top Occupations teaser and Evidence & Transparency footer
- ✅ Implement hero→planner handoff via localStorage
- ✅ Fix O*NET API calls to use Supabase edge functions
- ✅ Accessibility: ARIA roles, keyboard navigation, 44px tap targets

### Out of Scope
- Backend changes to evidence pages
- New telemetry implementation (deferred to future PBI)
- Lighthouse performance optimization (deferred to future PBI)
- Mobile-specific redesign beyond responsive layout

## Technical Design

### Architecture
- **Frontend**: React components with Framer Motion animations
- **State**: localStorage for last search handoff
- **API**: Supabase edge functions for O*NET proxy
- **Styling**: TailwindCSS with existing design system

### Key Components Modified
1. `src/components/Hero.tsx` - Complete redesign
2. `src/components/EnhancedAPODashboardHeader.tsx` - Navigation restructure
3. `src/pages/Index.tsx` - Homepage simplification
4. `src/components/AIImpactPlanner.tsx` - Auto-prefill from hero
5. `src/components/AIImpactPlannerButton.tsx` - Label update
6. `src/pages/OutcomesPage.tsx` - Heading update
7. `src/components/APODashboard.tsx` - Label update
8. `src/components/APODashboardHeader.tsx` - Label update

### API Changes
- Changed from Netlify functions to Supabase edge functions
- Uses `supabase.functions.invoke('onet-proxy', { body: { path } })`
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
- [ ] Hero height ≤40vh on desktop (1920x1080) - needs visual verification
- [x] Search input has ARIA role="search"
- [x] All chips have ≥44px tap targets
- [x] Tab order: search → chips → CTAs → nav
- [ ] No console errors on page load - needs testing
- [ ] O*NET search returns results within 2s - needs testing

### Naming Consistency
- [x] "Automation Insights" appears in header brand
- [x] "Career Impact Planner" in button, page heading, and mobile menu
- [x] "Market Signals" in Evidence dropdown, mobile menu, and footer
- [x] "Occupation Explorer" in APODashboardHeader
- [x] No instances of "APO Dashboard", "Automation Potential Oracle", or "Evidence Hub"

## Test Plan

### Manual Testing
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
   - Check network tab → verify calls to Supabase edge function

### Automated Testing (Future)
- Playwright E2E for hero→planner flow
- Lighthouse CI for performance regression
- Axe accessibility scan

## Rollout Plan

### Phase 1: Development (Complete)
- ✅ Implement all component changes
- ✅ Fix O*NET API integration
- ✅ Update naming across codebase

### Phase 2: Testing (Current)
- [ ] Manual QA on dev environment
- [ ] Accessibility audit
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile testing (iOS Safari, Chrome Android)

### Phase 3: Deployment
- [ ] Deploy to staging
- [ ] Smoke test critical paths
- [ ] Deploy to production
- [ ] Monitor error rates and search success

### Phase 4: Validation
- [ ] Collect engagement metrics (search usage, planner clicks)
- [ ] User feedback on new navigation
- [ ] Iterate based on data

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| O*NET API rate limits | High | Implement client-side caching, rate limit UI |
| Search returns no results | Medium | Add helpful error messages, suggest alternatives |
| Mobile layout breaks | Medium | Responsive testing, progressive enhancement |
| Users can't find evidence pages | Low | Footer links, clear dropdown labels |

## Dependencies
- Supabase edge function `onet-proxy` must be deployed
- Environment variables `ONET_USERNAME` and `ONET_PASSWORD` must be set
- `TopCareersPanel` component must exist

## Success Metrics
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
