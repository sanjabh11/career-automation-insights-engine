# Frontend Integration Guide
**Date**: 2025-10-04  
**Phase**: Option A - Frontend Integration  
**Status**: Components Ready, Integration Instructions Provided

---

## ✅ Components Created (7 New Files)

### React Hooks (4 files)
1. **`src/hooks/useOnetEnrichment.ts`** - Main hook for O*NET enrichment data
2. **`src/hooks/useCareerClusters.ts`** - Career clusters browsing
3. **`src/hooks/useJobZones.ts`** - Job zones browsing
4. **`src/hooks/useAdvancedSearch.ts`** - Advanced search with filters

### UI Components (3 files)
5. **`src/components/BrightOutlookBadge.tsx`** - Bright Outlook badge component
6. **`src/components/EmploymentOutlookCard.tsx`** - Employment outlook display
7. **`src/components/RelatedOccupationsPanel.tsx`** - Related occupations panel
8. **`src/components/CareerClusterNav.tsx`** - Career cluster navigation
9. **`src/components/AdvancedSearchPanel.tsx`** - Advanced search interface

---

## 🔌 Integration Instructions

### Step 1: Add Bright Outlook Badge to Occupation Cards

**File**: `src/components/OccupationAnalysis.tsx`

**Add imports**:
```typescript
import { BrightOutlookBadge } from './BrightOutlookBadge';
import { useBrightOutlook } from '@/hooks/useOnetEnrichment';
```

**Inside component function**:
```typescript
const { hasBrightOutlook, brightOutlookCategory } = useBrightOutlook(occupation.code);
```

**In the JSX (next to occupation title)**:
```tsx
<div className="flex items-start gap-2 flex-wrap">
  <h2 className="text-lg font-bold">{occupation.title}</h2>
  <BrightOutlookBadge
    hasBrightOutlook={hasBrightOutlook}
    category={brightOutlookCategory}
    size="sm"
  />
</div>
```

---

### Step 2: Add Employment Outlook Section

**File**: `src/components/APODashboard.tsx` or create new page

**Add import**:
```typescript
import { EmploymentOutlookCard } from './EmploymentOutlookCard';
```

**In JSX (after occupation analysis)**:
```tsx
{selectedOccupation && (
  <EmploymentOutlookCard
    occupationCode={selectedOccupation.code}
    occupationTitle={selectedOccupation.title}
  />
)}
```

---

### Step 3: Add Related Occupations Panel

**File**: Same as Step 2

**Add import**:
```typescript
import { RelatedOccupationsPanel } from './RelatedOccupationsPanel';
```

**In JSX**:
```tsx
{selectedOccupation && (
  <RelatedOccupationsPanel
    occupationCode={selectedOccupation.code}
    onSelectOccupation={(code, title) => {
      // Handle selection - fetch new occupation
      console.log('Selected:', code, title);
    }}
    maxResults={5}
  />
)}
```

---

### Step 4: Add Career Cluster Navigation (New Page)

**Create**: `src/pages/BrowseClusters.tsx`

```typescript
import React from 'react';
import { CareerClusterNav } from '@/components/CareerClusterNav';
import { useNavigate } from 'react-router-dom';

export const BrowseClusters = () => {
  const navigate = useNavigate();

  const handleSelectCluster = (clusterId: string, clusterName: string) => {
    navigate(`/cluster/${clusterId}`, { state: { clusterName } });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Explore Career Clusters</h1>
      <CareerClusterNav onSelectCluster={handleSelectCluster} />
    </div>
  );
};

export default BrowseClusters;
```

**Add route** in `src/App.tsx`:
```typescript
import { BrowseClusters } from './pages/BrowseClusters';

// In routes:
<Route path="/clusters" element={<BrowseClusters />} />
```

---

### Step 5: Add Advanced Search (New Page)

**Create**: `src/pages/AdvancedSearch.tsx`

```typescript
import React from 'react';
import { AdvancedSearchPanel } from '@/components/AdvancedSearchPanel';

export const AdvancedSearch = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Advanced Occupation Search</h1>
      <p className="text-muted-foreground mb-6">
        Search and filter occupations by keywords, education level, salary, and more
      </p>
      <AdvancedSearchPanel />
    </div>
  );
};

export default AdvancedSearch;
```

**Add route**:
```typescript
<Route path="/search" element={<AdvancedSearch />} />
```

---

### Step 6: Update Navigation Menu

**File**: `src/components/EnhancedAPODashboardHeader.tsx` or navigation component

**Add links**:
```typescript
<nav>
  <Link to="/">Dashboard</Link>
  <Link to="/clusters">Career Clusters</Link>
  <Link to="/search">Advanced Search</Link>
  <Link to="/compare">Compare</Link>
</nav>
```

---

## 📊 Hook Usage Examples

### Basic Usage: useOnetEnrichment

```typescript
import { useOnetEnrichment } from '@/hooks/useOnetEnrichment';

function MyComponent({ occupationCode }) {
  const { enrichmentData, isLoading, error, forceRefresh } = useOnetEnrichment(occupationCode);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>{enrichmentData.occupation_title}</h2>
      {enrichmentData.bright_outlook && (
        <Badge>Bright Outlook: {enrichmentData.bright_outlook_category}</Badge>
      )}
      <p>Median Salary: ${enrichmentData.median_wage_annual?.toLocaleString()}</p>
      <Button onClick={() => forceRefresh(occupationCode)}>Refresh Data</Button>
    </div>
  );
}
```

### Employment & Wage Data

```typescript
import { useEmploymentOutlook, useWageData } from '@/hooks/useOnetEnrichment';

function EmploymentDetails({ occupationCode }) {
  const { employmentData, isLoading } = useEmploymentOutlook(occupationCode);
  const { wageData } = useWageData(occupationCode);

  return (
    <div>
      <p>Growth Rate: {employmentData?.growthRate}</p>
      <p>Change: {employmentData?.changePercent}%</p>
      <p>Annual Openings: {employmentData?.annualOpenings}</p>
      <p>Median Wage: ${wageData?.annualMedian}</p>
    </div>
  );
}
```

### Career Clusters

```typescript
import { useCareerClusters } from '@/hooks/useCareerClusters';

function ClusterList() {
  const { data, isLoading } = useCareerClusters();

  return (
    <div>
      {data?.clusters.map(cluster => (
        <Card key={cluster.cluster_id}>
          <h3>{cluster.cluster_name}</h3>
          <p>{cluster.occupationCount} occupations</p>
        </Card>
      ))}
    </div>
  );
}
```

### Advanced Search

```typescript
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';

function SearchResults() {
  const { search, results, total, hasMore, loadMore, isSearching } = useAdvancedSearch();

  const handleSearch = () => {
    search('software', {
      brightOutlook: true,
      stem: true,
      jobZone: 4,
      minWage: 80000
    });
  };

  return (
    <div>
      <Button onClick={handleSearch}>Search</Button>
      <p>{total} results found</p>
      {results.map(occ => (
        <Card key={occ.occupation_code}>{occ.occupation_title}</Card>
      ))}
      {hasMore && <Button onClick={loadMore}>Load More</Button>}
    </div>
  );
}
```

---

## 🎨 Styling Guide

All components use:
- **Tailwind CSS** for styling
- **shadcn/ui** components (Card, Button, Badge, etc.)
- **Framer Motion** for animations
- **Lucide React** for icons

### Color Scheme
- **Bright Outlook**: Yellow/Green gradient
- **STEM**: Blue
- **Green Economy**: Green
- **High APO Risk**: Red
- **Low APO Risk**: Green

### Responsive Design
All components are mobile-first:
- Grid layouts collapse on mobile
- Touch-friendly buttons (44px minimum)
- Readable font sizes on small screens

---

## 🧪 Testing Checklist

- [ ] Bright Outlook badge displays on occupation cards
- [ ] Employment outlook card shows real data
- [ ] Related occupations panel navigates correctly
- [ ] Career cluster navigation works
- [ ] Advanced search filters work
- [ ] Mobile responsiveness verified
- [ ] Loading states display properly
- [ ] Error states handle gracefully

---

## 🚨 Important Notes

### Data Loading
- First load: ~3-5 seconds (fetches from O*NET)
- Cached load: ~500ms (from Supabase)
- Cache duration: 30 days

### Error Handling
All hooks include error handling:
```typescript
const { enrichmentData, error } = useOnetEnrichment(code);

if (error) {
  // Display user-friendly error message
  return <ErrorDisplay message={error.message} />;
}
```

### Performance
- Use React Query caching (built into hooks)
- Debounce search inputs
- Lazy load occupation lists
- Paginate search results

---

## 📝 Next Steps

1. **Deploy Backend** (if not done):
   ```bash
   supabase db push
   supabase functions deploy onet-enrichment
   supabase functions deploy browse-career-clusters
   supabase functions deploy browse-job-zones
   supabase functions deploy search-occupations
   ```

2. **Test Hooks Independently**:
   - Create a test page with each hook
   - Verify data loading
   - Check error states

3. **Integrate Components Gradually**:
   - Start with Bright Outlook badge (easiest)
   - Add Employment Outlook card
   - Add Related Occupations panel
   - Create new pages for clusters & search

4. **User Testing**:
   - Get feedback on new features
   - Iterate on UI/UX
   - Optimize performance

---

## 🐛 Troubleshooting

### "Cannot find module" errors
- Ensure types file exists: `src/types/onet-enrichment.ts`
- Check imports are correct
- Restart TypeScript server

### Data not loading
- Check Supabase functions are deployed
- Verify environment variables set
- Check browser console for errors

### Styling issues
- Ensure Tailwind config includes new components
- Check shadcn/ui components are installed
- Verify CSS imports

---

**Integration is modular - add components one at a time and test thoroughly!**
