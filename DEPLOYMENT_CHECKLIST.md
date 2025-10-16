# Deployment Checklist - Oct 16, 2025

## ✅ Pre-Deployment Verification

### Build & Type Check
- [x] TypeScript compilation: `npx tsc --noEmit` - **PASSED**
- [x] Production build: `npm run build` - **PASSED** (3m 51s)
- [x] No critical errors or warnings

### Code Changes Summary
**Modified Files (13):**
- `src/pages/ValidationMethodsPage.tsx` - Added deliverables buttons (PDFs + CSV)
- `src/pages/QualityPage.tsx` - Fixed JSX, added WCAG AA evidence artifacts
- `src/pages/TechSkillsPage.tsx` - Added heat legend and methods note
- `src/pages/BrowseBrightOutlook.tsx` - Added parity footnote
- `src/pages/CrosswalkPage.tsx` - Added tabs (General/OOH/ESCO) with defaults
- `src/components/CrosswalkWizard.tsx` - Added CSV export, fixed isIdle check
- `src/pages/OutcomesPage.tsx` - Added Signals & Methods card with PDF link
- `src/pages/VeteransPage.tsx` - Added CSV/PDF export controls
- `src/pages/OperationsPage.tsx` - Added alert history table and drift runbook link
- `src/pages/ResponsibleAIPage.tsx` - Added scorecard tiles
- `src/pages/ValidationPage.tsx` - (minor updates)
- `README.md` - Added Evidence Artifacts section
- `docs/PRD.md` - Added Evidence Artifacts note

**New Artifacts (11 files):**
- `public/docs/examples/baselines_sample.csv`
- `public/docs/methods/CALIBRATION_METHODS.pdf`
- `public/docs/methods/SIGNALS_METHODS.pdf`
- `public/docs/operations/DRIFT_RUNBOOK.pdf`
- `public/docs/quality/AA_STATEMENT.pdf`
- `public/docs/QUALITY_CHECKLIST.pdf`
- `public/docs/resources/VETERANS_TRANSITION_SUMMARY.pdf`
- Existing: APO_MODEL_CARD.pdf, TASK_MODEL_CARD.pdf, ONET_ENRICHMENT_SHEET.pdf, TELEMETRY_SHEET.pdf, THREAT_MODEL.pdf, PEN_TEST_SUMMARY.pdf, RLS_PROOFS.pdf

**New Migration:**
- `supabase/migrations/20251016120000_create_ops_alerts.sql` - Operations alerts table

## 🧪 Manual Test Plan

### 1. Validation Methods Page (`/validation/methods`)
- [ ] Visit page, verify no React errors
- [ ] Click "Download Methods & Ablations (PDF)" - opens ABLATIONS_REPORT.pdf
- [ ] Click "Calibration Methods (PDF)" - opens CALIBRATION_METHODS.pdf
- [ ] Click "Sample Baselines CSV" - downloads baselines_sample.csv

### 2. Quality Page (`/quality`)
- [ ] Visit page, verify no React errors
- [ ] Verify WCAG AA Evidence Artifacts card renders
- [ ] Click "AA Statement (PDF)" - opens AA_STATEMENT.pdf
- [ ] Click "AA Checklist (PDF)" - opens QUALITY_CHECKLIST.pdf
- [ ] Verify keyboard navigation table displays correctly

### 3. Tech Skills Page (`/tech-skills`)
- [ ] Visit page, verify heat legend badges render (80-100, 60-79, 40-59, 0-39)
- [ ] Verify normalization note displays
- [ ] Search for a technology, verify results display

### 4. Bright Outlook Page (`/browse-bright-outlook`)
- [ ] Visit page, apply filters
- [ ] Verify parity footnote displays: "Coverage is computed against O*NET Bright Outlook flags..."
- [ ] Verify results count and parity display correctly

### 5. Crosswalk Page (`/crosswalk`)
- [ ] Visit page, verify three tabs: General, OOH, ESCO
- [ ] **General tab**: Enter SOC code (e.g., 15-1252.00), click Explore
  - [ ] Results display
  - [ ] Click "Download CSV" - downloads crosswalk_[timestamp].csv
- [ ] **OOH tab**: Verify defaults to OOH→SOC, run query, CSV works
- [ ] **ESCO tab**: Verify defaults to ESCO→SOC, run query, CSV works
- [ ] Verify educator packs link displays at bottom

### 6. Outcomes Page (`/outcomes`)
- [ ] Visit page, verify Signals & Methods card renders
- [ ] Verify card text: "Correlations are computed on detrended, normalized series..."
- [ ] Click "Methods (PDF)" link - opens SIGNALS_METHODS.pdf
- [ ] Verify cohort selector works (All/Free/Basic/Premium/Enterprise)
- [ ] Verify KPI cards display (Analyses 30d/90d, MAU, Latency p95/p99, Uptime, etc.)

### 7. Veterans Page (`/veterans`)
- [ ] Visit page, select branch and enter MOC code
- [ ] Submit and wait for civilian matches
- [ ] Click "Download CSV" - downloads veterans_matches_[MOC]_[timestamp].csv
- [ ] Click "Download PDF" - opens VETERANS_TRANSITION_SUMMARY.pdf

### 8. Operations Page (`/operations`)
- [ ] Visit page, verify PSI card displays with drift value
- [ ] Click "View Drift Runbook (PDF)" - opens DRIFT_RUNBOOK.pdf
- [ ] Verify Alert History table renders (may be empty if no alerts)
- [ ] Verify table columns: Time, Metric, Value, Threshold, Severity, Action

### 9. Responsible AI Page (`/responsible-ai`)
- [ ] Visit page, verify scorecard tiles render (4 tiles):
  - Security: RLS + Secrets
  - Data Governance: 90d retention
  - Override Rate: [percentage]
  - Model Cards: 2 published
- [ ] Click "APO Model Card" - opens APO_MODEL_CARD.pdf
- [ ] Click "Task Model Card" - opens TASK_MODEL_CARD.pdf
- [ ] Click "O*NET Enrichment" - opens ONET_ENRICHMENT_SHEET.pdf
- [ ] Click "Telemetry" - opens TELEMETRY_SHEET.pdf
- [ ] Click "Threat Model" - opens THREAT_MODEL.pdf
- [ ] Click "Pen-test Summary" - opens PEN_TEST_SUMMARY.pdf
- [ ] Click "RLS Proofs" - opens RLS_PROOFS.pdf

## 🚀 Deployment Steps

### 1. Database Migration (if not already applied)
```bash
# Apply ops_alerts migration
supabase db push
# Or via Supabase Dashboard: SQL Editor → paste migration → run
```

### 2. Git Commit & Push
```bash
git add .
git commit -m "feat: Add evidence artifacts and export features

- Add validation methods deliverables (PDFs + CSV sample)
- Add WCAG AA evidence artifacts on Quality page
- Add heat legend and methods note to Tech Skills
- Add parity footnote to Bright Outlook
- Add Crosswalk tabs (General/OOH/ESCO) with CSV export
- Add Signals & Methods card to Outcomes
- Add Veterans CSV/PDF export controls
- Add Operations alert history table and drift runbook
- Add Responsible AI scorecard tiles
- Create ops_alerts migration for alert history
- Update README and PRD with artifacts documentation

All artifacts are placeholder PDFs/CSVs ready for production content."

git push origin main
```

### 3. Netlify Deploy
- Netlify will auto-deploy on push to main
- Monitor build logs at: https://app.netlify.com/sites/[your-site]/deploys
- Expected build time: ~4-5 minutes

### 4. Post-Deploy Verification
- [ ] Visit production URL
- [ ] Run through manual test plan above
- [ ] Verify all PDF/CSV links work (no 404s)
- [ ] Check browser console for errors
- [ ] Test on mobile viewport (375px+)

## 📊 Metrics to Monitor

### Immediate (First 24h)
- [ ] Error rate in Supabase logs
- [ ] 404 errors for artifact paths
- [ ] Page load times (should remain < 3s)
- [ ] User feedback on new features

### Week 1
- [ ] Download counts for artifacts (if tracking enabled)
- [ ] User engagement with new export features
- [ ] Any reported issues with CSV/PDF generation

## 🔄 Rollback Plan

If critical issues arise:
1. Revert git commit: `git revert HEAD`
2. Push: `git push origin main`
3. Netlify will auto-deploy previous version
4. Investigate issues in local environment

## 📝 Notes

- All artifact PDFs are minimal placeholders - replace with production content as needed
- CSV exports are client-side generated (no server load)
- ops_alerts table is optional; alert history will be empty until populated
- .env and .env.* remain in .gitignore (safe)

## ✅ Sign-Off

- **Build Status**: ✅ PASSED
- **Type Check**: ✅ PASSED
- **Artifacts Created**: ✅ 11 files
- **Docs Updated**: ✅ README + PRD
- **Ready for Deploy**: ✅ YES

**Deployment Date**: Oct 16, 2025
**Deployed By**: [Your Name]
**Deployment Time**: [Time]
