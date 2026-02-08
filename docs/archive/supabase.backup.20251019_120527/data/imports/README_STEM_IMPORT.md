# STEM Data Import Instructions

## Status
✅ **ADMIN_API_KEY created and set**: `7f0f70f9571ee0b34ef1af8088d5f7805ca6147f05e937129b3323b9afd5c0ef`
✅ **STEM CSV normalized**: 100 official STEM occupations ready
✅ **SQL import scripts generated**

## Quick Import via Supabase SQL Editor

### Option 1: Run Complete SQL Script (RECOMMENDED)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `complete_stem_import_full.sql`
3. Execute the script
4. Verify output shows ~100 STEM occupations imported

### Option 2: Use Edge Function (when disk space resolved)

```bash
export ADMIN_API_KEY=7f0f70f9571ee0b34ef1af8088d5f7805ca6147f05e937129b3323b9afd5c0ef

curl -s -X POST \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -H "Content-Type: text/csv" \
  --data-binary @supabase/data/imports/stem_membership_normalized.csv \
  "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/admin-import-stem" | jq
```

## Verification

After import, test the STEM filter:

```bash
curl -s -X POST \
  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  "https://kvunnankqgfokeufvsrv.supabase.co/functions/v1/search-occupations" \
  -d '{"filters":{"stem":true},"limit":20,"offset":0}' | jq '.source, .total, .occupations[0:5]'
```

**Expected Result:**
- `source`: "db" (not "onet_browse_stem")
- `total`: ≥50 (should be ~100)
- Sample occupations with STEM titles

## Files Generated

- `stem_membership_normalized.csv` - Normalized source data (100 rows)
- `stem_inserts.sql` - Individual INSERT statements
- `complete_stem_import_full.sql` - Complete import script with verification
- `import_stem.sql` - Template for manual COPY approach

## Next Steps

1. **Import STEM data** using SQL Editor (Option 1 above)
2. **Verify** using the curl command
3. **Check UI badges** - should now show 🟢 Database for STEM searches
4. **Seed remaining datasets**:
   - Bright Outlook (~340 occupations)
   - Job Zones (all 5 zones)
   - Hot Technologies (master list + mappings)
   - Career Clusters (16 clusters + mappings)

## Troubleshooting

### Edge Function Returns 401
- The function requires both Supabase auth AND x-admin-key
- Current implementation has auth dependency; SQL import bypasses this

### Disk Space Issues
- Use SQL Editor approach instead of file edits
- Scripts are pre-generated and ready to paste

### Source Still Shows "onet_browse_stem"
- Verify data imported: `SELECT COUNT(*) FROM onet_occupation_enrichment WHERE is_stem = true;`
- Check function deployed: `supabase functions list`
- Clear browser cache and retry search
