# APO Validation Protocol

**Version**: 1.0  
**Last Updated**: 2025-10-21  
**Maintained By**: Career Automation Insights Engine Team

---

## Overview

This document describes the validation methodology for the Automation Potential Opportunity (APO) scoring system. Our multi-layered validation approach ensures that APO predictions are:

1. **Accurate** - Aligned with expert human assessments and academic research
2. **Calibrated** - Predicted probabilities match observed frequencies
3. **Fair** - Consistent across demographic groups and occupation types
4. **Transparent** - Explainable with clear factor attribution

---

## Validation Layers

### 1. Academic Correlation Validation

**Objective**: Measure agreement between APO scores and established automation risk research.

**Method**:
- Collect expert assessments from academic literature (Frey & Osborne 2013, Arntz et al. 2016, McKinsey 2017)
- Store in `expert_assessments` table with occupation code, source, and probability
- Compute Pearson correlation coefficient between APO scores and expert probabilities
- Store results in `validation_metrics` table

**Acceptance Criteria**:
- Pearson r ≥ 0.70 indicates strong agreement
- Sample size n ≥ 50 occupations for statistical power
- p-value < 0.05 for significance

**Invocation**:
```bash
supabase functions invoke validate-apo --body '{"sinceDays": 90}'
```

**Output**:
- Metric: `apo_vs_academic_pearson_r`
- Value: Correlation coefficient (0-1)
- Sample size: Number of matched occupations
- Created timestamp

---

### 2. Calibration Analysis (ECE)

**Objective**: Ensure predicted APO scores match actual automation rates.

**Method**:
- Bin APO predictions into deciles (0-10%, 10-20%, ..., 90-100%)
- For each bin, compute:
  - **Predicted average**: Mean APO score in bin
  - **Observed average**: Actual automation rate (from historical data or expert labels)
  - **ECE component**: |predicted - observed| × (count / total)
- Sum ECE components across bins for overall Expected Calibration Error

**Acceptance Criteria**:
- ECE < 0.10 (10 percentage points) indicates well-calibrated model
- Reliability diagram shows points near diagonal

**Storage**:
- Table: `calibration_runs` (run metadata)
- Table: `calibration_results` (per-bin statistics)

**Visualization**:
- Available on `/validation` page
- Shows predicted vs observed bars per bin
- Displays overall ECE score

---

### 3. Confidence Interval Validation

**Objective**: Quantify uncertainty in APO predictions.

**Method**:
- Monte Carlo simulation with N=200 iterations (configurable via `APO_CI_ITERATIONS`)
- Perturb category scores and external adjustments with Gaussian noise (σ=3%)
- Compute 5th and 95th percentiles for 90% confidence interval
- Store bounds in `apo_logs.ci_lower` and `apo_logs.ci_upper`

**Acceptance Criteria**:
- CI width < 20 percentage points for high-confidence predictions
- Actual outcomes fall within CI bounds ≥90% of the time (when historical data available)

**Display**:
- Shown in `OccupationAnalysis` component under overall APO score
- Format: "Confidence Interval: XX.X% – YY.Y% (N sims)"

---

### 4. External Signal Validation

**Objective**: Verify that BLS trends and economic factors improve prediction accuracy.

**Method**:
- **BLS Trend**: Compare projected employment growth from BLS with APO adjustments
  - Declining employment → increase APO (automation replacing workers)
  - Growing employment → decrease APO (demand outpacing automation)
- **Economic Viability**: Verify that high implementation costs reduce APO
  - Query `automation_economics` for sector-specific cost ranges
  - Apply discount when cost > 3× annual labor cost

**Acceptance Criteria**:
- APO scores with external signals show higher correlation with expert assessments than baseline
- Ablation study: APO without external signals has r ≥ 0.05 lower correlation

**Data Sources**:
- BLS: `bls_employment_data` table (updated quarterly)
- Economics: `automation_economics` table (WEF, McKinsey benchmarks)

---

### 5. Fairness Audit

**Objective**: Ensure APO scores do not encode demographic biases.

**Method**:
- Stratify occupations by gender composition, education level, wage quartile
- Compute mean APO for each stratum
- Test for statistical differences using ANOVA or Kruskal-Wallis
- Control for actual task characteristics (routine cognitive load, tech adoption)

**Acceptance Criteria**:
- No significant APO difference between male-dominated and female-dominated occupations (p > 0.05) after controlling for task attributes
- No systematic undervaluation of low-wage occupations beyond justified automation potential

**Reporting**:
- Fairness audit results documented in `public/docs/validation/FAIRNESS_AUDIT_REPORT.md`
- Updated quarterly

---

## Validation Metrics Summary

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Academic Correlation (Pearson r) | ≥ 0.70 | TBD | Pending data |
| Calibration Error (ECE) | < 0.10 | TBD | Pending data |
| CI Coverage | ≥ 90% | TBD | Pending data |
| External Signal Lift | ≥ +0.05 r | TBD | Pending data |
| Fairness p-value | > 0.05 | TBD | Pending data |

---

## Data Requirements

### Expert Assessments

**Table**: `expert_assessments`

**Schema**:
```sql
CREATE TABLE expert_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occupation_code TEXT NOT NULL,
  source TEXT NOT NULL, -- e.g., 'Frey_Osborne_2013'
  automation_probability NUMERIC(5,2) NOT NULL, -- 0-100
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Sample Data**:
- Frey & Osborne (2013): 702 occupations with automation probabilities
- Arntz et al. (2016): Task-based estimates for OECD countries
- McKinsey (2017): Sector-specific automation potential

**Population**:
```bash
# Import from CSV
psql $DATABASE_URL -c "\COPY expert_assessments(occupation_code, source, automation_probability) FROM 'expert_data.csv' CSV HEADER"
```

---

## Continuous Validation

### Automated Checks

- **Daily**: Monitor `apo_logs` for outliers (APO > 100 or < 0)
- **Weekly**: Recompute calibration on latest 1000 APO calculations
- **Monthly**: Update academic correlation with new expert assessments
- **Quarterly**: Run full fairness audit across all occupations

### Alerting

- ECE > 0.15: Trigger model retraining review
- Pearson r < 0.65: Investigate prompt drift or data quality issues
- Fairness p-value < 0.05: Immediate bias mitigation required

---

## References

1. Frey, C. B., & Osborne, M. A. (2013). *The future of employment: How susceptible are jobs to computerisation?* Oxford Martin School.
2. Arntz, M., Gregory, T., & Zierahn, U. (2016). *The risk of automation for jobs in OECD countries.* OECD Social, Employment and Migration Working Papers.
3. McKinsey Global Institute (2017). *A future that works: Automation, employment, and productivity.*
4. World Economic Forum (2023). *Future of Jobs Report 2023.*

---

## Appendix: Validation Function Code

**File**: `supabase/functions/validate-apo/index.ts`

**Key Logic**:
```typescript
// Fetch APO logs and expert assessments
const { data: logs } = await supabase
  .from('apo_logs')
  .select('occupation_code, overall_apo')
  .gte('created_at', cutoffDate);

const { data: experts } = await supabase
  .from('expert_assessments')
  .select('occupation_code, automation_probability');

// Join and compute Pearson correlation
const matched = logs.filter(l => experts.some(e => e.occupation_code === l.occupation_code));
const r = pearsonCorrelation(matched.map(m => m.overall_apo), matched.map(m => experts.find(e => e.occupation_code === m.occupation_code).automation_probability));

// Store metric
await supabase.from('validation_metrics').insert({
  metric_name: 'apo_vs_academic_pearson_r',
  value: r,
  sample_size: matched.length
});
```

---

**End of Validation Protocol**
