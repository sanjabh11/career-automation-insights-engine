# Detailed Implementation Plan - Career Automation Insights Engine

**Version**: 2.0  
**Date**: 2025-10-21  
**Status**: Ready for Execution  
**Priority**: ET AI Awards Nomination

---

## Executive Summary

This plan addresses the remaining implementation tasks to complete the Career Automation Insights Engine for ET AI Awards 2025 nomination. All core APO features are **code-complete**; remaining work focuses on:

1. **Data Population** (BLS, validation metrics, skill demand)
2. **Documentation Artifacts** (model cards, nomination evidence)
3. **Award-Specific Features** (explainability, ROI calculator, outcome tracking)

**Timeline**: 4-5 weeks  
**Current Completion**: ~60% (10/20 tasks)  
**Remaining Effort**: ~120 hours

---

## Task Status Overview

| Task ID | Description | Status | Priority | Effort |
|---------|-------------|--------|----------|--------|
| t1 | Docs deep-read & synthesis | ✅ Complete | High | 4h |
| t2 | Codebase inventory | 🟡 In Progress | High | 6h |
| t3 | DB schema-feature map | 🟡 In Progress | High | 4h |
| t4 | Gap analysis matrix | 🟡 In Progress | High | 6h |
| t5 | Feasibility analysis | 🟡 In Progress | Medium | 8h |
| t6 | Implementation plan | ✅ Complete | High | 8h |
| t7 | Implementation table | ⏳ Pending | Medium | 2h |
| t8 | Clarification questions | ⏳ Pending | Low | 2h |
| t9 | External data integration | ✅ Complete | Critical | 40h |
| t10 | BLS integration | ✅ Complete | Critical | 12h |
| t11 | WEF economics | ✅ Complete | Critical | 10h |
| t12 | McKinsey benchmarks | ✅ Complete | Critical | 8h |
| t13 | Academic validation | 🟡 Partial | Critical | 16h |
| t14 | Skills demand pipeline | ✅ Complete | High | 14h |
| t15 | APO CI & external signals | ✅ Complete | Critical | 18h |
| t16 | UI integration | ✅ Complete | Critical | 12h |
| t17 | Migrations & seeds | ✅ Complete | Critical | 10h |
| t18 | Nomination evidence | 🟡 Partial | Critical | 20h |
| t19 | Apply migrations | ✅ Complete | Critical | 2h |
| t20 | Deploy functions | ✅ Complete | Critical | 4h |

**Legend**: ✅ Complete | 🟡 In Progress | ⏳ Pending

---

## Phase 1: Data Population & Validation (Week 1)

### Task: Populate BLS Employment Data

**Objective**: Enable BLS sparkline charts and trend badges in UI.

**Files**:
- `supabase/seeds/bls_employment_seed.sql` (exists)
- `scripts/populate_demo_data.sh` (created)

**Acceptance Criteria**:
- [ ] `bls_employment_data` table has ≥100 rows covering top 20 SOC-6 codes
- [ ] Query for SOC-6 `15-1252` returns 5 years of data (2020-2024)
- [ ] Sparkline renders in `OccupationAnalysis` component after APO calculation

**Test Steps**:
```bash
# 1. Run population script
bash scripts/populate_demo_data.sh

# 2. Verify data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM bls_employment_data;"

# 3. Test UI
# - Navigate to http://localhost:5173/
# - Search "Software Developer"
# - Click result
# - Verify sparkline appears under header
```

**Effort**: 2 hours  
**Owner**: TBD  
**Dependencies**: None

---

### Task: Generate Academic Validation Metric

**Objective**: Populate `validation_metrics` with Pearson r correlation.

**Files**:
- `supabase/functions/validate-apo/index.ts` (exists)
- `supabase/migrations/*_create_expert_assessments.sql` (exists)

**Acceptance Criteria**:
- [ ] `expert_assessments` table has ≥50 rows from Frey & Osborne (2013)
- [ ] `validate-apo` function runs without error
- [ ] `validation_metrics` has row with `metric_name='apo_vs_academic_pearson_r'`
- [ ] Badge shows in header and `/validation` page

**Test Steps**:
```bash
# 1. Insert sample expert data
psql $DATABASE_URL <<SQL
INSERT INTO expert_assessments (occupation_code, source, automation_probability)
VALUES
  ('15-1252.00', 'Frey_Osborne_2013', 4.2),
  ('11-1011.00', 'Frey_Osborne_2013', 1.5),
  -- ... add 48 more rows
SQL

# 2. Invoke validation
supabase functions invoke validate-apo --body '{"sinceDays": 90}'

# 3. Verify metric
psql $DATABASE_URL -c "SELECT * FROM validation_metrics WHERE metric_name='apo_vs_academic_pearson_r';"

# 4. Test UI
# - Visit /validation
# - Verify badge shows "Acad r=0.XX n=YY"
# - Check header badge
```

**Effort**: 4 hours  
**Owner**: TBD  
**Dependencies**: Need Frey & Osborne CSV data

---

### Task: Populate Skill Demand Signals

**Objective**: Enable demand badges on TechSkillsPage.

**Files**:
- `supabase/functions/skill-demand-scraper/index.ts` (exists)
- `scripts/populate_demo_data.sh` (updated)

**Acceptance Criteria**:
- [ ] `SERPAPI_API_KEY` secret is set in Supabase
- [ ] `skill_demand_signals` table has ≥8 rows for popular skills
- [ ] TechSkillsPage shows postings, growth, salary badges

**Test Steps**:
```bash
# 1. Set secret
supabase secrets set SERPAPI_API_KEY="7e3aa9cacd93806c7b8f31b3f84e0c31149546f95f97bab73e4b62048dafd256"

# 2. Invoke scraper
supabase functions invoke skill-demand-scraper --body '{"skills":["Python","Excel","JavaScript","SQL","AWS","Salesforce","React","Git"],"occupationCode":"ALL"}'

# 3. Verify data
psql $DATABASE_URL -c "SELECT skill_name, posting_count_30d, growth_rate_yoy FROM skill_demand_signals;"

# 4. Test UI
# - Visit /tech-skills
# - Search "Python"
# - Click Python from list
# - Verify badges: "Postings (30d): XXX", "YoY: X.X%", "Median Salary: $XXX,XXX"
```

**Effort**: 2 hours  
**Owner**: TBD  
**Dependencies**: Valid SerpAPI key

---

## Phase 2: Documentation Artifacts (Week 2)

### Task: Create Model Cards (PDF)

**Objective**: Provide transparency artifacts for nomination.

**Files**:
- `public/docs/model_cards/APO_MODEL_CARD.pdf` (new)
- `public/docs/model_cards/TASK_MODEL_CARD.pdf` (new)

**Content Requirements**:
- **APO Model Card**:
  - Model architecture (Gemini 2.0 Flash + deterministic formula)
  - Training data (O*NET 28.2, BLS, WEF, McKinsey)
  - Performance metrics (Pearson r, ECE, latency)
  - Intended use cases and limitations
  - Ethical considerations (fairness, bias mitigation)
  
- **Task Model Card**:
  - Classification approach (Automate/Augment/Human)
  - Features used (routine cognitive load, tech adoption, skill level)
  - Accuracy metrics (precision, recall, F1)
  - Calibration results

**Acceptance Criteria**:
- [ ] Both PDFs exist in `public/docs/model_cards/`
- [ ] Links on `/validation` page open PDFs
- [ ] Each PDF is 2-4 pages, professionally formatted

**Test Steps**:
```bash
# 1. Generate PDFs (use Markdown → PDF tool or LaTeX)
# 2. Place in public/docs/model_cards/
# 3. Visit /validation
# 4. Click "APO Model Card (PDF)" button
# 5. Verify PDF opens
```

**Effort**: 8 hours  
**Owner**: TBD  
**Dependencies**: Validation metrics for performance section

---

### Task: Create Dataset Sheets (PDF)

**Objective**: Document data provenance and quality.

**Files**:
- `public/docs/data_sheets/ONET_ENRICHMENT_SHEET.pdf` (new)
- `public/docs/data_sheets/TELEMETRY_SHEET.pdf` (new)

**Content Requirements**:
- **O*NET Enrichment Sheet**:
  - Source: O*NET 28.2 (2024-09 release)
  - Tables: `onet_occupation_enrichment`, `onet_hot_technologies_master`, etc.
  - Update frequency: Quarterly
  - Quality checks: Null rate, outlier detection
  - License: CC BY 4.0

- **Telemetry Sheet**:
  - Table: `apo_logs`
  - Metrics: Latency, token usage, cache hit rate
  - PII handling: Hashed prompts, no user content stored
  - Retention: 90 days
  - Access controls: RLS enabled

**Acceptance Criteria**:
- [ ] Both PDFs exist and are linked on `/validation`
- [ ] Each sheet follows standard dataset documentation format

**Test Steps**:
- Same as Model Cards

**Effort**: 6 hours  
**Owner**: TBD  
**Dependencies**: None

---

### Task: Create Nomination Evidence Package

**Objective**: Compile screenshots, metrics, and demo script for jury.

**Files**:
- `public/docs/nomination/EVIDENCE_PACKAGE.md` (new)
- `public/docs/nomination/DEMO_SCRIPT.md` (new)
- `public/docs/screens/*.png` (new)

**Content**:
- **Evidence Package**:
  - Screenshots of all key features (BLS badge, Economics card, Validation badges, Skills demand)
  - Metrics snapshot (latency p95, accuracy, cache hit rate)
  - User testimonials (if available)
  - Benchmark comparison (APO vs simple baseline)

- **Demo Script** (6 minutes):
  1. Problem statement (30s)
  2. Search → APO calculation (90s)
  3. Task breakdown (Automate/Augment/Human) (60s)
  4. Learning path with ROI (60s)
  5. Market outlook (BLS, Economics) (60s)
  6. Validation & transparency (60s)

**Acceptance Criteria**:
- [ ] All screenshots captured at 1920x1080
- [ ] Demo script is rehearsed and timed
- [ ] Evidence package is PDF-exportable

**Test Steps**:
```bash
# 1. Capture screenshots
# - Use browser dev tools or screenshot tool
# - Save to public/docs/screens/

# 2. Write demo script
# - Follow 6-minute structure
# - Include exact navigation steps

# 3. Rehearse demo
# - Time each section
# - Adjust for 6-minute target
```

**Effort**: 12 hours  
**Owner**: TBD  
**Dependencies**: All features working with populated data

---

## Phase 3: Award-Specific Features (Weeks 3-4)

### Task: Explainable APO Breakdown

**Objective**: Show factor-level contributions in natural language.

**Status**: ✅ **Already implemented** in `OccupationAnalysis.tsx` lines 345-374

**Enhancement**: Add natural language explanations.

**Files**:
- `src/components/OccupationAnalysis.tsx` (enhance)

**Acceptance Criteria**:
- [ ] Each factor shows contribution in points and percentage
- [ ] Natural language summary: "This task's APO is elevated primarily due to high routine cognitive load (+12 pts) and mature automation technology (+8 pts), partially offset by complex ethical judgment (-6 pts)."

**Test Steps**:
- Search occupation → View analysis → Check "Factor Contributions" section

**Effort**: 4 hours  
**Owner**: TBD  
**Dependencies**: None

---

### Task: Learning Path ROI Calculator

**Objective**: Show financial return on skill investment.

**Files**:
- `src/components/LearningPathROI.tsx` (new)
- `src/pages/CareerPlanningPage.tsx` (integrate)

**Acceptance Criteria**:
- [ ] Component shows:
  - Upfront learning costs (course fees)
  - Opportunity cost (study time × current wage)
  - Projected salary increase
  - Payback period in months
  - 5-year cumulative benefit
- [ ] Visual: Break-even point chart

**Test Steps**:
```bash
# 1. Navigate to /career-planning
# 2. Select current occupation
# 3. Select target occupation
# 4. View ROI calculator
# 5. Verify all fields populated
```

**Effort**: 12 hours  
**Owner**: TBD  
**Dependencies**: Course cost data, wage differentials

---

### Task: Outcome Survey System

**Objective**: Collect user transition results for testimonials.

**Files**:
- `src/components/OutcomeSurveyModal.tsx` (new)
- `supabase/migrations/*_create_career_outcomes.sql` (new)

**Acceptance Criteria**:
- [ ] Table `career_outcomes` created with RLS
- [ ] Modal appears 90 days after learning plan generation
- [ ] Captures: completion %, time to transition, new role, salary change, satisfaction
- [ ] Admin dashboard shows aggregated metrics

**Test Steps**:
```bash
# 1. Generate learning plan
# 2. Manually trigger survey (for testing)
# 3. Submit outcome data
# 4. Verify row in career_outcomes table
# 5. Check /operations dashboard for aggregates
```

**Effort**: 10 hours  
**Owner**: TBD  
**Dependencies**: Email automation (optional)

---

### Task: Performance Dashboard

**Objective**: Show latency, cost, cache metrics for nomination.

**Files**:
- `src/pages/OperationsPage.tsx` (enhance)

**Acceptance Criteria**:
- [ ] Charts show:
  - Latency distribution (p50, p95, p99) over time
  - Cost per APO calculation trend
  - Cache hit rate by occupation
  - Error rate and types
- [ ] Data from `apo_logs` aggregated daily

**Test Steps**:
- Visit `/operations` → Verify all charts render with real data

**Effort**: 8 hours  
**Owner**: TBD  
**Dependencies**: Sufficient `apo_logs` data (≥100 rows)

---

## Phase 4: O*NET Parity Features (Week 5)

### Task: Bright Outlook & STEM Filters

**Status**: ✅ **Already implemented** in browse pages

**Enhancement**: Add filter chips to main search.

**Files**:
- `src/components/SearchInterface.tsx` (add filters)

**Acceptance Criteria**:
- [ ] Filter chips: "Bright Outlook", "STEM", "High Wage"
- [ ] Filters apply to search results
- [ ] Badge count shows filtered results

**Effort**: 4 hours

---

### Task: Technology Skills Search

**Status**: ✅ **Already implemented** in `/tech-skills`

**Enhancement**: Add heat index from job postings.

**Acceptance Criteria**:
- [ ] Heat index (0-100) computed from posting counts
- [ ] Color-coded badges (red=hot, blue=cool)
- [ ] Links to learning modules

**Effort**: 2 hours (already mostly done)

---

### Task: Duty/Activity Semantic Search

**Files**:
- `supabase/functions/search-duties/index.ts` (new)
- `src/pages/TaskSearchPage.tsx` (enhance)

**Acceptance Criteria**:
- [ ] Embeddings generated for 19K task statements
- [ ] Multi-duty weighted similarity to occupations
- [ ] Attach Automate/Augment/Human classification

**Effort**: 16 hours  
**Owner**: TBD  
**Dependencies**: Embedding model (OpenAI or local)

---

### Task: CIP Education Crosswalk

**Files**:
- `supabase/migrations/*_create_cip_programs.sql` (new)
- `src/components/EducationPathways.tsx` (new)

**Acceptance Criteria**:
- [ ] SOC↔CIP mapping table populated
- [ ] Program catalogs for top gaps (costs, duration, outcomes)
- [ ] Integrated into learning paths with ROI

**Effort**: 12 hours  
**Owner**: TBD  
**Dependencies**: CIP data source

---

## Phase 5: Polish & Testing (Ongoing)

### Task: End-to-End Testing

**Objective**: Verify all features work in production.

**Test Matrix**:

| Feature | Test Case | Expected Result | Status |
|---------|-----------|-----------------|--------|
| APO Calculation | Search "Software Developer" → Click | APO score with CI, badges | ⏳ |
| BLS Sparkline | Same as above | Chart renders with 5 data points | ⏳ |
| Economic Viability | Same as above | Card shows ROI, maturity, WEF | ⏳ |
| Validation Badge | Visit /validation | Pearson r badge visible | ⏳ |
| Skills Demand | Visit /tech-skills → Search "Python" | Postings, growth, salary badges | ⏳ |
| Tech Skills Page | Same as above | Heat index, occupations list | ⏳ |
| Career Planning | Visit /career-planning | ROI calculator works | ⏳ |
| Validation Page | Visit /validation | All docs linked, charts render | ⏳ |

**Effort**: 8 hours  
**Owner**: TBD

---

### Task: Performance Optimization

**Objective**: Ensure sub-2s p95 latency.

**Actions**:
- [ ] Profile slow queries
- [ ] Add indexes for common lookups
- [ ] Optimize Gemini prompt (reduce tokens)
- [ ] Increase cache TTL for static data

**Acceptance Criteria**:
- [ ] p95 latency < 2000ms
- [ ] Cache hit rate > 80%
- [ ] Cost per calculation < $0.05

**Effort**: 6 hours  
**Owner**: TBD

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| SerpAPI rate limits | High | Cache results, batch requests |
| Gemini API downtime | High | Implement fallback to rule-based APO |
| Missing expert data | Medium | Use synthetic labels from academic papers |
| PDF generation complexity | Low | Use Markdown → PDF tools (Pandoc, Prince) |
| Timeline slippage | Medium | Prioritize critical path (data population, evidence) |

---

## Success Metrics

### Technical Excellence
- [ ] Pearson r ≥ 0.70 (academic correlation)
- [ ] ECE < 0.10 (calibration)
- [ ] p95 latency < 2s
- [ ] Cache hit rate > 80%

### Nomination Readiness
- [ ] All model cards and dataset sheets complete
- [ ] Evidence package with ≥10 screenshots
- [ ] Demo script rehearsed and timed
- [ ] 3 user testimonials with metrics

### Feature Completeness
- [ ] 18/20 tasks complete (90%)
- [ ] All UI features visible with populated data
- [ ] No critical bugs in production

---

## Next Actions (Immediate)

1. **Run Data Population Script**:
   ```bash
   bash scripts/populate_demo_data.sh
   ```

2. **Verify UI Features**:
   - Test complete flow: search → APO → badges/charts
   - Capture screenshots for evidence package

3. **Generate PDFs**:
   - Model cards (APO, Task)
   - Dataset sheets (O*NET, Telemetry)

4. **Create Demo Script**:
   - Write 6-minute walkthrough
   - Rehearse and time

5. **Collect Metrics**:
   - Query `apo_logs` for latency, cost
   - Query `validation_metrics` for Pearson r
   - Export to evidence package

---

**Plan Status**: ✅ **Ready for Execution**  
**Next Review**: After Phase 1 completion  
**Contact**: Career Automation Insights Engine Team

---

**End of Implementation Plan**
