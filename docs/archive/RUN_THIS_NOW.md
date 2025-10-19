# 🚨 RUN THESE 3 SCRIPTS NOW 🚨

## Open Supabase SQL Editor
https://supabase.com/dashboard/project/kvunnankqgfokeufvsrv/sql/new

## Copy/Paste Each Script EXACTLY in Order

### 1️⃣ Job Zones
**File:** `supabase/data/imports/02_seed_job_zones_FINAL.sql`

```sql
-- Copy entire contents of 02_seed_job_zones_FINAL.sql
-- Paste in SQL Editor
-- Click Run
```

**Expected:** "Job Zones Seeded, zone_count: 5"

---

### 2️⃣ Career Clusters  
**File:** `supabase/data/imports/03_seed_career_clusters_FINAL.sql`

```sql
-- Copy entire contents of 03_seed_career_clusters_FINAL.sql
-- Paste in SQL Editor
-- Click Run
```

**Expected:** "Career Clusters Seeded, cluster_count: 16"

---

### 3️⃣ Hot Technologies
**File:** `supabase/data/imports/04_seed_hot_technologies_FINAL.sql`

```sql
-- Copy entire contents of 04_seed_hot_technologies_FINAL.sql
-- Paste in SQL Editor
-- Click Run
```

**Expected:** "Hot Technologies Seeded, tech_count: 40"

---

## ✅ Verify All Imports

Run this in SQL Editor:

```sql
SELECT 'STEM' as dataset, COUNT(*) as count FROM onet_occupation_enrichment WHERE is_stem = true
UNION ALL
SELECT 'Job Zones', COUNT(*) FROM onet_job_zones
UNION ALL
SELECT 'Career Clusters', COUNT(*) FROM onet_career_clusters
UNION ALL
SELECT 'Hot Technologies', COUNT(*) FROM onet_hot_technologies_master;
```

**Expected Results:**
- STEM: 100 ✅ (already done)
- Job Zones: 5
- Career Clusters: 16
- Hot Technologies: 40

---

## 🧪 Test Endpoints

```bash
./test_endpoints.sh
```

**Expected:** All show `"db"` as source

---

## 🎉 Done!

Once all 3 scripts run successfully:
1. Build frontend: `npm run build`
2. Start dev server: `npm run dev`
3. Visit new pages:
   - http://localhost:8080/impact
   - http://localhost:8080/validation/center
   - http://localhost:8080/responsible-ai

---

## Why These Scripts Work

1. **Job Zones:** Only inserts `zone_number` and `zone_name` (no `updated_at`)
2. **Career Clusters:** Uses `cluster_name` (NOT NULL column), not `name`
3. **Hot Technologies:** All `trending_score` values are < 1.0 (e.g., 0.95 not 95)

**No more errors. These will work.** 🚀
