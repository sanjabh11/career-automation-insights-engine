# PBI-0009 Heatmap: Deep Research & Implementation Plan

**Date**: 2026-03-15
**Status**: Research Complete → Implementation Ready

---

## Executive Summary

The heatmap feature will visualize **342 occupations** across multiple skill dimensions using O*NET data, showing employment scale (area) and automation exposure (color). Users will experience an interactive treemap with drill-down capabilities, filtering by career cluster, job zone, and skill dimensions.

---

## 1. O*NET Data Structure & Visualization Scope

### Available Skill Dimensions (8 Total)

Based on existing database schema analysis:

| Dimension | Table | Records | Description | Visualization Potential |
|-----------|-------|---------|-------------|------------------------|
| **Skills** | `onet_skills` (inferred) | ~35 core skills | Technical & soft skills (e.g., Critical Thinking, Programming) | **HIGH** - Direct skill heatmap |
| **Abilities** | `onet_abilities` | ~52 abilities | Cognitive, physical, sensory (e.g., Oral Comprehension, Manual Dexterity) | **HIGH** - Ability-based clustering |
| **Knowledge** | `onet_knowledge` | ~33 knowledge areas | Subject matter expertise (e.g., Mathematics, Medicine, Law) | **HIGH** - Knowledge domain heatmap |
| **Work Activities** | `onet_work_activities` | ~41 activities | What workers do (e.g., Analyzing Data, Operating Vehicles) | **MEDIUM** - Activity-based view |
| **Work Styles** | `onet_work_styles` (inferred) | ~16 styles | Personality traits (e.g., Attention to Detail, Dependability) | **MEDIUM** - Culture fit analysis |
| **Interests** | `onet_interests` (inferred) | 6 RIASEC types | Holland Code (Realistic, Investigative, Artistic, Social, Enterprising, Conventional) | **LOW** - Too coarse for heatmap |
| **Tasks** | `onet_tasks` (inferred) | Varies by occupation | Specific job duties | **LOW** - Too granular |
| **Tools & Technology** | `onet_tools_technology` (inferred) | Varies | Software, equipment used | **MEDIUM** - Tech stack visualization |

### Confirmed Available Data

From migration analysis:
- ✅ **onet_knowledge**: level, importance, category (768-dim embeddings for similarity)
- ✅ **onet_abilities**: level, importance, category (768-dim embeddings)
- ✅ **skill_adjacency_cache**: Pre-computed skill relationships with similarity scores
- ✅ **bls_employment_data**: Employment levels, wages, growth projections by region
- ✅ **onet_occupation_enrichment**: Career clusters, job zones, bright outlook, STEM flags

### Realistic Visualization Count

**Primary Heatmap Views (3)**:
1. **By Career Cluster** (16 clusters) - Default view
2. **By Job Zone** (5 zones) - Education/experience level
3. **By Occupation** (342 occupations) - Most granular

**Skill Dimension Overlays (3 High-Value)**:
1. **Knowledge Heatmap** - 33 knowledge domains × 342 occupations = ~11,286 cells
2. **Abilities Heatmap** - 52 abilities × 342 occupations = ~17,784 cells
3. **Skills Heatmap** - 35 skills × 342 occupations = ~11,970 cells

**Total Unique Visualizations**: **6 distinct views**

---

## 2. Data Population Pipeline Architecture

### Phase 1: Foundation (Current State)
```
✅ Tables created:
   - occupation_market_facts (normalized market data)
   - occupation_exposure_snapshot (APO scores)
   - occupation_heatmap_cells (serving layer)
```

### Phase 2: Data Population Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCES                              │
├─────────────────────────────────────────────────────────────┤
│ 1. bls_employment_data (employment, wages, growth)          │
│ 2. onet_occupation_enrichment (clusters, zones, flags)      │
│ 3. apo_logs (latest APO scores per occupation)              │
│ 4. onet_knowledge + onet_abilities (skill dimensions)       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              SNAPSHOT PIPELINE (Edge Function)               │
├─────────────────────────────────────────────────────────────┤
│ 1. Extract latest BLS data (national + state)               │
│ 2. Join with O*NET enrichment (clusters, zones)             │
│ 3. Fetch latest APO scores from apo_logs                    │
│ 4. Calculate risk bands (Low/Moderate/High/Critical)        │
│ 5. Compute cell weights (employment × importance)           │
│ 6. Insert into occupation_market_facts                      │
│ 7. Insert into occupation_exposure_snapshot                 │
│ 8. Aggregate into occupation_heatmap_cells                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  SERVING LAYER                               │
├─────────────────────────────────────────────────────────────┤
│ occupation_heatmap_cells (pre-aggregated, indexed)          │
│ - Snapshot date (for versioning)                            │
│ - Region (US, state codes)                                  │
│ - Grouping (cluster, zone, occupation)                      │
│ - Metrics (employment, APO, wages, growth)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (market-heatmap API)                   │
├─────────────────────────────────────────────────────────────┤
│ GET /market-heatmap?region=US&groupBy=career_cluster        │
│ Returns: Treemap-ready JSON with aggregated cells           │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Skill Dimension Extension

```
┌─────────────────────────────────────────────────────────────┐
│           SKILL DIMENSION HEATMAP (Future)                   │
├─────────────────────────────────────────────────────────────┤
│ 1. Query onet_knowledge/abilities by occupation             │
│ 2. Filter by importance threshold (e.g., >= 3.5)            │
│ 3. Create skill × occupation matrix                         │
│ 4. Color by importance, size by employment                  │
│ 5. Enable drill-down: Skill → Occupations requiring it      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Complete UX Flow & User Journey

### Discovery Phase

**Entry Points** (4 ways to discover):
1. **Homepage Hero CTA**: "Explore Market Map" button
2. **Navigation Menu**: "Market Intelligence" → "Occupation Heatmap"
3. **Dashboard Widget**: "View Market Trends" card
4. **Occupation Detail Page**: "See in Market Context" link

### Interaction Phase

**Initial Load** (`/market-map`):
```
┌─────────────────────────────────────────────────────────────┐
│  [Map Icon] Occupation Market Map                           │
│  Area = employment scale. Color = automation exposure.      │
│                                                              │
│  [Region: US ▼] [Group by: Career Cluster ▼] [Refresh]     │
├─────────────────────────────────────────────────────────────┤
│  Snapshot: 2026-03-15  |  Cells: 16  |  Occupations: 342   │
│  Weighted Exposure: 52%                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  TREEMAP VISUALIZATION                │  │
│  │                                                        │  │
│  │  ┌─────────────┐ ┌──────┐ ┌────────────┐            │  │
│  │  │   Health    │ │ IT   │ │  Business  │            │  │
│  │  │   Science   │ │      │ │  Mgmt      │            │  │
│  │  │   (Green)   │ │(Red) │ │  (Orange)  │            │  │
│  │  └─────────────┘ └──────┘ └────────────┘            │  │
│  │                                                        │  │
│  │  [Hover shows: Healthcare Support, 8.2M jobs,        │  │
│  │   Median: $35K, Exposure: 28%, Growth: +12%]         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Legend: Green (Low) → Amber (Moderate) → Red (High)       │
└─────────────────────────────────────────────────────────────┘
```

**Interaction Patterns**:

1. **Hover**: Tooltip shows detailed metrics
   - Occupation/cluster name
   - Employment count (formatted: 2.8M)
   - Median wage (formatted: $42,830)
   - Exposure score (0-100%)
   - Growth projection (+15%)

2. **Click Cell**: Drill-down action
   - Career Cluster → Shows occupations in that cluster
   - Job Zone → Shows occupations in that zone
   - Occupation → Navigates to `/occupation/:code` detail page

3. **Filter Controls**:
   - **Region**: US (national), CA, TX, NY, etc. (state-level)
   - **Group By**: Career Cluster, Job Zone, Occupation
   - **Advanced** (future): Risk Band, STEM Only, Bright Outlook

4. **Refresh**: Fetches latest snapshot data

### Drill-Down Phase

**Scenario: User clicks "Information Technology" cluster**

```
URL changes to: /market-map?cluster=IT&groupBy=occupation

┌─────────────────────────────────────────────────────────────┐
│  ← Back to All Clusters                                     │
│                                                              │
│  Information Technology (11 occupations, 3.2M jobs)         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │  ┌────────────┐ ┌──────┐ ┌────────┐ ┌─────┐         │  │
│  │  │  Software  │ │ Data │ │Network │ │Info │         │  │
│  │  │ Developers │ │ Sci  │ │ Admin  │ │ Sec │         │  │
│  │  │   (Red)    │ │(Red) │ │(Orange)│ │(Red)│         │  │
│  │  │   1.9M     │ │246K  │ │ 332K   │ │183K │         │  │
│  │  └────────────┘ └──────┘ └────────┘ └─────┘         │  │
│  │                                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Click any occupation to see full APO analysis →            │
└─────────────────────────────────────────────────────────────┘
```

### Action Phase

**User clicks "Software Developers" cell**:
- Navigates to `/occupation/15-1252.00`
- Shows full APO Dashboard with:
  - Executive Summary (APO score, confidence, timeline)
  - Category breakdown (Technical, Cognitive, Physical, etc.)
  - BLS employment trends
  - Related occupations
  - **NEW**: "View in Market Context" button → returns to heatmap with this occupation highlighted

---

## 4. Skill Dimension Visualization (Extended Feature)

### How Users Experience Skill Heatmaps

**Entry Point**: Toggle in Market Map UI

```
┌─────────────────────────────────────────────────────────────┐
│  View Mode: [Occupation ●] [Knowledge ○] [Abilities ○]     │
└─────────────────────────────────────────────────────────────┘
```

**Knowledge Heatmap Example**:

```
User selects "Knowledge" view mode
→ API call: /market-heatmap?dimension=knowledge&minImportance=3.5

┌─────────────────────────────────────────────────────────────┐
│  Knowledge Domain Heatmap (33 domains)                      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │  ┌────────────┐ ┌──────────┐ ┌────────┐             │  │
│  │  │ Mathematics│ │ Medicine │ │  Law   │             │  │
│  │  │  (Orange)  │ │  (Green) │ │(Amber) │             │  │
│  │  │  842 occs  │ │  156 occ │ │ 89 occ │             │  │
│  │  └────────────┘ └──────────┘ └────────┘             │  │
│  │                                                        │  │
│  │  [Hover: Mathematics - Required by 842 occupations,  │  │
│  │   Avg importance: 4.2/5, Top: Actuaries, Data Sci]   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Click a knowledge domain to see all occupations requiring  │
│  that knowledge at high importance levels →                 │
└─────────────────────────────────────────────────────────────┘
```

**Click "Mathematics"**:
- Shows 842 occupations requiring Mathematics knowledge
- Sorted by importance level
- Color by APO exposure
- Size by employment

### Skill Adjacency Integration

**Future Enhancement**: Clicking a skill shows:
1. **Adjacent Skills** (from `skill_adjacency_cache`)
   - "People who need Mathematics also need: Statistics (0.92 similarity), Computer Science (0.78)"
2. **Learning Paths**
   - "Estimated 120 hours to add Statistics proficiency"
   - "Salary impact: +$12K median"
3. **Occupation Transitions**
   - "Occupations you can transition to with this skill"

---

## 5. Technical Implementation Plan

### Step 1: Run Migration ✅
```bash
supabase db push
```

### Step 2: Create Sample Data Population Script
**File**: `supabase/functions/populate-heatmap-snapshot/index.ts`

**Logic**:
1. Query `bls_employment_data` for latest year
2. Join with `onet_occupation_enrichment` on occupation_code
3. Fetch latest APO from `apo_logs` (group by occupation, order by created_at desc, limit 1)
4. Calculate risk bands:
   - Low: APO < 35
   - Moderate: 35 ≤ APO < 55
   - High: 55 ≤ APO < 75
   - Critical: APO ≥ 75
5. Insert into `occupation_market_facts`
6. Insert into `occupation_exposure_snapshot`
7. Aggregate into `occupation_heatmap_cells`

### Step 3: Add Navigation Entry Points
**Files to modify**:
- `src/components/NavigationPremium.tsx` - Add "Market Map" menu item
- `src/components/HeroSection.tsx` - Add CTA button
- `src/pages/Index.tsx` - Add dashboard widget

### Step 4: Enhance MarketMapPage UI
**Current state**: Basic treemap shell
**Enhancements needed**:
1. Add filter panel (region, groupBy, risk band)
2. Improve tooltip styling (match design system)
3. Add drill-down navigation
4. Add "Back" button for breadcrumb navigation
5. Add empty state handling
6. Add loading skeleton

### Step 5: Test End-to-End Flow
1. Populate sample data (10-20 occupations for demo)
2. Navigate to `/market-map`
3. Verify treemap renders
4. Test hover tooltips
5. Test click drill-down
6. Test filter controls
7. Capture screenshots for documentation

### Step 6: Skill Dimension Extension (Phase 2)
1. Create `skill-dimension-heatmap` Edge Function
2. Query `onet_knowledge` or `onet_abilities` with importance filter
3. Aggregate by skill name
4. Return skill × occupation matrix
5. Add toggle UI in MarketMapPage

---

## 6. Data Volume & Performance Considerations

### Current Scale
- **Occupations**: 342 (O*NET standard)
- **Career Clusters**: 16
- **Job Zones**: 5
- **Knowledge Domains**: 33
- **Abilities**: 52
- **Skills**: ~35

### Heatmap Cell Counts
- **By Cluster**: 16 cells (very fast)
- **By Job Zone**: 5 cells (very fast)
- **By Occupation**: 342 cells (fast, <100ms)
- **Knowledge × Occupation**: 11,286 cells (requires pagination/filtering)
- **Abilities × Occupation**: 17,784 cells (requires pagination/filtering)

### Optimization Strategy
1. **Pre-aggregation**: Use `occupation_heatmap_cells` serving table
2. **Caching**: 5-minute cache on API responses
3. **Pagination**: Limit to top 250 cells by default
4. **Lazy loading**: Load skill dimensions on-demand
5. **Indexes**: Already created on snapshot_date, region, cluster, zone

---

## 7. Success Metrics

### User Engagement
- **Discovery**: % of users who find `/market-map` within first session
- **Interaction**: Avg time on page, hover events, drill-downs
- **Conversion**: % who navigate to occupation detail from heatmap

### Technical Performance
- **API Response Time**: <300ms for aggregated views
- **Page Load Time**: <2s for initial render
- **Error Rate**: <1% on heatmap API calls

### Business Value
- **Market Intelligence**: Users can identify high-risk clusters
- **Career Planning**: Users can explore adjacent occupations
- **Skill Development**: Users can see which skills are most valuable

---

## 8. Next Steps (Immediate)

1. ✅ **Run migration** - Create heatmap tables
2. **Create sample data script** - Populate 20-50 occupations for demo
3. **Add navigation entry points** - Make heatmap discoverable
4. **Enhance UI** - Add filters, tooltips, drill-down
5. **Test & document** - Capture user flow screenshots
6. **Deploy & monitor** - Track engagement metrics

---

## Conclusion

The heatmap feature will provide **6 distinct visualization modes** across **3 primary groupings** (cluster, zone, occupation) and **3 skill dimensions** (knowledge, abilities, skills). Users will experience an intuitive treemap interface with hover tooltips, click drill-downs, and filter controls.

**Total addressable skill sets**: **120 unique dimensions** (33 knowledge + 52 abilities + 35 skills) visualized across 342 occupations.

**Implementation complexity**: **Medium** - Requires data pipeline, API enhancements, and UI polish, but leverages existing O*NET and BLS infrastructure.

**User value**: **High** - Provides market-level intelligence that complements individual occupation analysis, enabling strategic career planning and skill development decisions.
