# PBI-0009 Heatmap: Implementation Guide

**Status**: Ready for Execution
**Date**: 2026-03-15

---

## Quick Start: How to See the Heatmap Working

### Prerequisites
- Supabase CLI logged in ✅ (confirmed)
- Database credentials available
- Node modules installed

### Step 1: Apply Database Migration

The migration file is already created at:
`supabase/migrations/20260315184500_create_heatmap_data_layer.sql`

**Option A: Using Supabase CLI (Recommended)**
```bash
# You'll need the database password
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to https://supabase.com/dashboard/project/kvunnankqgfokeufvsrv/sql
2. Copy contents of `supabase/migrations/20260315184500_create_heatmap_data_layer.sql`
3. Paste and run in SQL Editor

**What this creates**:
- ✅ `occupation_market_facts` table
- ✅ `occupation_exposure_snapshot` table
- ✅ `occupation_heatmap_cells` table (serving layer)
- ✅ Indexes for fast queries
- ✅ RLS policies

### Step 2: Populate Sample Data

**Create Edge Function**: `supabase/functions/populate-heatmap-snapshot/index.ts`

This script will:
1. Query existing BLS employment data
2. Join with O*NET enrichment (clusters, job zones)
3. Fetch latest APO scores from `apo_logs`
4. Calculate risk bands and cell weights
5. Insert into heatmap tables

**Run it**:
```bash
supabase functions deploy populate-heatmap-snapshot
supabase functions invoke populate-heatmap-snapshot
```

### Step 3: Navigate to Heatmap

**Direct URL**: `http://localhost:5173/market-map`

**Or add navigation entry points** (see Step 4 below)

### Step 4: Add Navigation Entry Points

**Files to modify**:

1. **NavigationPremium.tsx** - Add menu item
2. **HeroSection.tsx** - Add CTA button
3. **Index.tsx** (homepage) - Add dashboard widget

---

## Detailed Implementation Steps

### Phase 1: Database Setup ✅

**Status**: Migration file created, ready to apply

**Tables Created**:
```sql
-- Market facts (normalized source data)
occupation_market_facts (
  occupation_code_6, occupation_code_8, occupation_title,
  region, year, employment_level, projected_growth_10y,
  median_wage_annual, career_cluster, job_zone,
  bright_outlook, is_stem
)

-- Exposure snapshots (APO scores)
occupation_exposure_snapshot (
  snapshot_date, occupation_code_8, occupation_title,
  model, scoring_version, overall_apo, confidence,
  timeline, category_scores_json
)

-- Serving layer (pre-aggregated for fast reads)
occupation_heatmap_cells (
  snapshot_date, region, occupation_code_6, occupation_title,
  career_cluster, job_zone, employment_level,
  median_wage_annual, projected_growth_10y, overall_apo,
  confidence, risk_band, cell_weight, cell_color_score
)
```

### Phase 2: Data Population

**Edge Function**: `populate-heatmap-snapshot`

**Logic Flow**:
```typescript
1. Query bls_employment_data for latest year
   SELECT * FROM bls_employment_data
   WHERE year = (SELECT MAX(year) FROM bls_employment_data)
   AND region = 'US'

2. Join with onet_occupation_enrichment
   LEFT JOIN onet_occupation_enrichment
   ON bls.occupation_code_6 = LEFT(enrichment.occupation_code, 7)

3. Fetch latest APO scores
   SELECT DISTINCT ON (occupation_code) *
   FROM apo_logs
   ORDER BY occupation_code, created_at DESC

4. Calculate derived fields:
   - risk_band:
     * Low: APO < 35
     * Moderate: 35 ≤ APO < 55
     * High: 55 ≤ APO < 75
     * Critical: APO ≥ 75
   - cell_weight: employment_level (for treemap sizing)
   - cell_color_score: overall_apo (for color gradient)

5. Insert into occupation_market_facts
6. Insert into occupation_exposure_snapshot
7. Aggregate into occupation_heatmap_cells
```

**Sample Data Strategy**:
- Start with 20-50 occupations for demo
- Focus on diverse clusters (Healthcare, IT, Business, Manufacturing)
- Include mix of risk levels (Low, Moderate, High, Critical)

### Phase 3: API Enhancement ✅

**Status**: Already implemented

**Endpoint**: `supabase/functions/market-heatmap/index.ts`

**Features**:
- ✅ Region filtering (US, state codes)
- ✅ Group by (career_cluster, job_zone, occupation)
- ✅ Server-side aggregation
- ✅ Weighted average calculations
- ✅ 5-minute cache headers

**Example Request**:
```bash
curl "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/market-heatmap?region=US&groupBy=career_cluster"
```

**Example Response**:
```json
{
  "snapshotDate": "2026-03-15",
  "region": "US",
  "groupBy": "career_cluster",
  "summary": {
    "totalCells": 16,
    "totalEmployment": 143000000,
    "weightedAverageApo": 52.3,
    "occupationCount": 342
  },
  "cells": [
    {
      "id": "HL",
      "label": "Health Science",
      "value": 8200000,
      "colorValue": 28.5,
      "occupationCount": 45
    }
  ]
}
```

### Phase 4: Frontend Enhancement ✅

**Status**: Basic shell implemented

**Current Features**:
- ✅ Treemap visualization (recharts)
- ✅ Region selector
- ✅ Group by selector
- ✅ Refresh button
- ✅ Summary stats cards
- ✅ Hover tooltips
- ✅ Empty state handling

**Enhancements Needed**:
1. **Navigation entry points** - Make discoverable
2. **Drill-down navigation** - Click to filter
3. **Breadcrumb navigation** - Back button
4. **Advanced filters** - Risk band, STEM, Bright Outlook
5. **Loading skeleton** - Better UX during fetch

### Phase 5: Navigation Integration

**1. Hero Section CTA**

File: `src/components/HeroSection.tsx`

Add button after existing CTAs:
```tsx
<Button
  size="lg"
  variant="outline"
  onClick={() => navigate('/market-map')}
  className="gap-2"
>
  <Map className="h-5 w-5" />
  Explore Market Map
</Button>
```

**2. Navigation Menu**

File: `src/components/NavigationPremium.tsx`

Add menu item in "Tools" or "Explore" section:
```tsx
<NavigationMenuItem>
  <Link to="/market-map">
    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
      <Map className="mr-2 h-4 w-4" />
      Market Heatmap
    </NavigationMenuLink>
  </Link>
</NavigationMenuItem>
```

**3. Dashboard Widget**

File: `src/pages/Index.tsx` or `src/pages/UserDashboardPage.tsx`

Add card in dashboard grid:
```tsx
<Card className="p-6 card-interactive">
  <div className="flex items-center gap-3 mb-3">
    <Map className="h-6 w-6 text-[var(--accent-primary)]" />
    <h3 className="font-semibold">Market Intelligence</h3>
  </div>
  <p className="text-sm text-muted-foreground mb-4">
    Explore 342 occupations by employment scale and automation exposure
  </p>
  <Button onClick={() => navigate('/market-map')} className="w-full">
    View Market Map
  </Button>
</Card>
```

---

## Testing Checklist

### Functional Tests

- [ ] Migration applies successfully
- [ ] Sample data populates correctly
- [ ] API returns valid JSON
- [ ] Treemap renders with data
- [ ] Hover tooltips show correct metrics
- [ ] Region filter works
- [ ] Group by filter works
- [ ] Refresh button fetches new data
- [ ] Empty state shows when no data
- [ ] Loading state shows during fetch
- [ ] Navigation links work
- [ ] Click drill-down works (future)

### Performance Tests

- [ ] API response < 300ms
- [ ] Page load < 2s
- [ ] Treemap renders smoothly
- [ ] No console errors
- [ ] No memory leaks

### UX Tests

- [ ] Colors match design system (teal/amber)
- [ ] Tooltips are readable
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Screen reader compatible

---

## Skill Dimension Visualization (Phase 2)

### How Many Skill Sets Can Be Visualized?

**Answer**: **120 unique skill dimensions** across 3 categories:

1. **Knowledge Domains** (33): Mathematics, Medicine, Law, Engineering, etc.
2. **Abilities** (52): Oral Comprehension, Deductive Reasoning, Manual Dexterity, etc.
3. **Skills** (35): Critical Thinking, Programming, Active Listening, etc.

### How Users Experience It

**Toggle View Mode**:
```
[Occupation View ●] [Knowledge View ○] [Abilities View ○] [Skills View ○]
```

**Knowledge View Example**:
- Shows 33 knowledge domains as treemap cells
- Size = number of occupations requiring that knowledge
- Color = average importance level
- Click domain → shows all occupations requiring it

**Abilities View Example**:
- Shows 52 abilities as treemap cells
- Size = number of occupations requiring that ability
- Color = average importance level
- Click ability → shows all occupations requiring it

**Implementation**:
1. Add `dimension` parameter to API
2. Query `onet_knowledge` or `onet_abilities`
3. Group by skill name
4. Count occupations per skill
5. Return skill × occupation matrix

---

## What It Looks Like on the Website

### Homepage Entry Point

```
┌─────────────────────────────────────────────────────────┐
│  Stay Indispensable in the AI Era                      │
│                                                          │
│  [Get Started] [Explore Market Map →]                  │
└─────────────────────────────────────────────────────────┘
```

### Navigation Menu

```
┌─────────────────────────────────────────────────────────┐
│  Logo  [Explore ▼] [Tools ▼] [Resources]               │
│                                                          │
│  Explore:                                               │
│  • Browse Occupations                                   │
│  • Market Heatmap ← NEW                                │
│  • Career Clusters                                      │
└─────────────────────────────────────────────────────────┘
```

### Market Map Page

```
┌─────────────────────────────────────────────────────────┐
│  [Map] Occupation Market Map                            │
│  Area = employment. Color = automation exposure.        │
│                                                          │
│  [US ▼] [Career Cluster ▼] [Refresh]                   │
├─────────────────────────────────────────────────────────┤
│  📊 Snapshot: 2026-03-15  |  16 Clusters  |  342 Occs  │
│  🎯 Weighted Exposure: 52%                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │         INTERACTIVE TREEMAP                       │ │
│  │                                                    │ │
│  │  ┌──────────┐ ┌─────┐ ┌────────┐ ┌──────┐       │ │
│  │  │ Health   │ │ IT  │ │Business│ │ Mfg  │       │ │
│  │  │ Science  │ │     │ │  Mgmt  │ │      │       │ │
│  │  │ (Green)  │ │(Red)│ │(Orange)│ │(Amb) │       │ │
│  │  │  8.2M    │ │3.2M │ │  5.1M  │ │ 2.8M │       │ │
│  │  └──────────┘ └─────┘ └────────┘ └──────┘       │ │
│  │                                                    │ │
│  │  [Hover: Healthcare Support                       │ │
│  │   8.2M jobs | $35K median | 28% exposure]        │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  🟢 Low (0-35%)  🟡 Moderate (35-55%)                  │
│  🟠 High (55-75%)  🔴 Critical (75-100%)               │
└─────────────────────────────────────────────────────────┘
```

### Drill-Down View

```
┌─────────────────────────────────────────────────────────┐
│  ← Back to All Clusters                                 │
│                                                          │
│  Information Technology (11 occupations, 3.2M jobs)     │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  ┌────────┐ ┌─────┐ ┌──────┐ ┌─────┐ ┌────┐    │ │
│  │  │Software│ │Data │ │Network│ │Info │ │Web │    │ │
│  │  │  Dev   │ │ Sci │ │ Admin │ │ Sec │ │Dev │    │ │
│  │  │ (Red)  │ │(Red)│ │(Orng) │ │(Red)│ │(Red)│   │ │
│  │  │  1.9M  │ │246K │ │ 332K  │ │183K │ │215K│   │ │
│  │  └────────┘ └─────┘ └──────┘ └─────┘ └────┘    │ │
│  │                                                    │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
│  Click any occupation to see full APO analysis →        │
└─────────────────────────────────────────────────────────┘
```

### Skill Dimension View (Future)

```
┌─────────────────────────────────────────────────────────┐
│  View: [Occupation] [Knowledge ●] [Abilities] [Skills] │
│                                                          │
│  Knowledge Domain Heatmap (33 domains)                  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │  ┌────────┐ ┌────────┐ ┌──────┐ ┌──────┐        │ │
│  │  │  Math  │ │Medicine│ │  Law │ │ Eng  │        │ │
│  │  │(Orange)│ │(Green) │ │(Amb) │ │(Orng)│        │ │
│  │  │842 occ │ │156 occ │ │89 occ│ │234 o │        │ │
│  │  └────────┘ └────────┘ └──────┘ └──────┘        │ │
│  │                                                    │ │
│  │  [Hover: Mathematics - Required by 842 occs      │ │
│  │   Avg importance: 4.2/5 | Top: Actuaries, Data] │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Summary

### What You Get

1. **6 Visualization Modes**:
   - By Career Cluster (16 cells)
   - By Job Zone (5 cells)
   - By Occupation (342 cells)
   - By Knowledge Domain (33 cells) - Phase 2
   - By Abilities (52 cells) - Phase 2
   - By Skills (35 cells) - Phase 2

2. **Interactive Features**:
   - Hover tooltips with detailed metrics
   - Click drill-down navigation
   - Region filtering (national + state)
   - Group by controls
   - Color-coded risk bands

3. **Data Sources**:
   - BLS employment data (143M jobs)
   - O*NET enrichment (342 occupations)
   - APO scores (automation exposure)
   - Skill dimensions (120 unique skills)

### Next Actions

1. **Apply migration** - Create database tables
2. **Populate sample data** - 20-50 occupations for demo
3. **Add navigation** - Make heatmap discoverable
4. **Test end-to-end** - Verify all interactions work
5. **Deploy & monitor** - Track user engagement

---

**Ready to proceed?** Start with Step 1: Apply the migration using Supabase Dashboard SQL Editor.
