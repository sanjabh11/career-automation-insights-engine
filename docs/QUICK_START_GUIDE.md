# Quick Start Guide - Phase 2 Implementation

## 🚀 Getting Started

### 1. Run Database Migration
```bash
cd supabase
supabase db push
```

### 2. Sync STEM Membership (One-time setup)
```bash
curl -X POST https://your-project.supabase.co/functions/v1/sync-stem-membership \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### 3. Start Development Server
```bash
npm install
npm run dev
```

## 📍 New Routes to Test

### Browse & Discovery
- **`/browse/bright-outlook`** - Bright Outlook careers with category filters
- **`/browse/stem`** - Official O*NET STEM occupations
- **`/tech-skills`** - Technology skills with heat index
- **`/work-dimensions`** - Browse by abilities, knowledge, activities

### Specialized Tools
- **`/veterans`** - Military to civilian career transition
- **`/crosswalk`** - Enhanced with OOH support
- **`/demo`** - Interactive guided tour for judges

## 🔑 Key Features Implemented

### 1. Official STEM Integration
- Replaces keyword heuristics with O*NET official list
- Run sync function to populate `onet_stem_membership` table
- Automatic `is_stem` flag updates in enrichment

### 2. Bright Outlook Categories
- Filter by: Rapid Growth, Numerous Openings, New & Emerging
- Available in Advanced Search and dedicated browse page

### 3. Veterans Career Transition
- Select military branch
- Enter MOC code (e.g., "11B", "68W", "AE")
- View civilian SOC matches with enrichment data
- Transition guidance and learning paths

### 4. Tech Skills Discovery
- Browse 100+ hot technologies
- Heat index (0-100) based on occupation demand
- Click to see related occupations
- Links to learning paths

### 5. Work Dimensions Explorer
- 3 tabs: Abilities, Knowledge, Work Activities
- Filter by importance level (3.0+, 3.5+, 4.0+, 4.5+)
- Grouped by dimension with occupation counts
- Average importance ratings

### 6. Demo Sandbox
- 3 preloaded occupations (RN, Financial Analyst, Software Dev)
- 5-step guided tour
- Progress tracking
- PDF export placeholder
- Perfect for award judges

## 🧪 Testing Checklist

```bash
# 1. STEM Browse
✓ Visit /browse/stem
✓ Verify only official STEM occupations appear
✓ Check is_stem flags in database

# 2. Bright Outlook
✓ Visit /browse/bright-outlook
✓ Test category filter in Advanced Search
✓ Verify pagination works

# 3. Veterans Flow
✓ Visit /veterans
✓ Select branch + enter MOC code
✓ Verify civilian matches appear
✓ Check enrichment data loads

# 4. Tech Skills
✓ Visit /tech-skills
✓ Search for "Python" or "React"
✓ Click technology to see occupations
✓ Verify heat index calculation

# 5. Work Dimensions
✓ Visit /work-dimensions
✓ Switch between tabs
✓ Adjust importance filter
✓ Verify grouping and counts

# 6. Demo Sandbox
✓ Visit /demo
✓ Start guided tour
✓ Navigate all 5 steps
✓ Test "View Full Analysis"
```

## 📊 Database Tables Added

### `onet_stem_membership`
- `occupation_code` (primary key)
- `stem_occupation_type` (e.g., "Research, Design, or Development")
- `stem_occupation_type_code`
- `job_family`
- `is_official_stem` (always true)
- `last_synced_at`

## 🔧 Environment Variables Required

```env
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=

# O*NET (Required for all features)
ONET_USERNAME=
ONET_PASSWORD=

# Gemini AI
GEMINI_API_KEY=
```

## 📈 Performance Targets

- **Page Load:** < 2 seconds
- **API Response (cached):** < 500ms
- **API Response (fresh):** < 2 seconds
- **Database Queries:** < 100ms

## 🎯 Award Submission Highlights

### Demo Highlights
1. **Visit `/demo`** - Interactive guided tour showcasing all features
2. **Try `/veterans`** - Military transition tool
3. **Explore `/tech-skills`** - Heat index-based tech discovery
4. **Browse `/work-dimensions`** - Multi-dimensional O*NET data

### Key Differentiators
- ✅ Official O*NET STEM list (not heuristics)
- ✅ Comprehensive crosswalk support (including OOH)
- ✅ Veterans career transition tool
- ✅ Technology demand heat index
- ✅ Work dimensions discovery
- ✅ Guided demo sandbox

## 🐛 Troubleshooting

### STEM occupations not showing
```bash
# Re-run STEM sync
curl -X POST <supabase-url>/functions/v1/sync-stem-membership \
  -H "Authorization: Bearer <service-role-key>"
```

### Crosswalk not working
- Verify `ONET_USERNAME` and `ONET_PASSWORD` are set
- Check Supabase function logs
- Test with known MOC code: "11B"

### Pages loading slowly
- Check if enrichment cache is populated
- Verify database indexes exist
- Monitor Supabase dashboard for slow queries

## 📞 Next Steps

1. **Test all new routes** using checklist above
2. **Run STEM sync** to populate membership table
3. **Review demo sandbox** to prepare for judges
4. **Update any custom navigation** to include new routes
5. **Monitor performance** using Supabase dashboard

## 🏆 Success Metrics

- [x] All HIGH priority items completed
- [x] All MEDIUM priority items completed
- [x] 6 new routes functional
- [x] Official O*NET integration
- [x] Veterans support tool
- [x] Demo sandbox ready
- [x] Documentation complete

**Platform is award-ready! 🎉**
