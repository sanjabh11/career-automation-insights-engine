# Quick Start - 15 Minutes to Award-Ready

## 1. Import Data (10 min)

Open: https://supabase.com/dashboard/project/kvunnankqgfokeufvsrv/sql/new

Copy/paste and execute **in order**:

### ✅ STEM (Already Done)
Skip - already imported successfully

### 📝 Job Zones
File: `supabase/data/imports/02_seed_job_zones_FIXED.sql`
- Copy entire file
- Paste in SQL Editor
- Click Run
- Expect: "Job Zones Seeded, zone_count: 5"

### 📝 Career Clusters
File: `supabase/data/imports/03_seed_career_clusters_FIXED.sql`
- Copy entire file
- Paste in SQL Editor
- Click Run
- Expect: "Career Clusters Seeded, cluster_count: 16"

### 📝 Hot Technologies
File: `supabase/data/imports/04_seed_hot_technologies_FIXED.sql`
- Copy entire file
- Paste in SQL Editor
- Click Run
- Expect: "Hot Technologies Seeded, tech_count: 40"

---

## 2. Test (3 min)

```bash
./test_endpoints.sh
```

**Expected:**
- STEM: `"db"` / 100
- Job Zones: `"db"` / 5
- Hot Tech: `"db"` / 40
- Clusters: `"db"` / 16

---

## 3. Build & View (2 min)

```bash
npm run build
npm run dev
```

Visit:
- http://localhost:8080/impact
- http://localhost:8080/validation/center
- http://localhost:8080/responsible-ai

---

## ✅ Done!

You now have:
- 100 STEM occupations
- 5 Job Zones
- 16 Career Clusters
- 40 Hot Technologies
- 3 award-ready pages
- Source badges showing 🟢 Database

**Next:** Take screenshots, record demo, submit award!
