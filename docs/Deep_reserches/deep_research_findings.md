# Deep Research Findings: Career Automation Insights Engine

## Systematic Gap Analysis & Phased Improvement Roadmap

**Date**: 2026-01-13 (updated 2026-07-01 with last-30-days developments)
**Research Sources**: Exa neural search (19 queries, 90+ papers and platform docs)
**Codebase**: career-automation-insights-engine
**Constraints**: Zero-cost infrastructure (Supabase free tier, Gemini API free tier, Netlify free tier)

---

## Question A: Are We Using the Latest and Best Scientific Mechanisms?

### A1: SOTA Audit — Automation Exposure Measurement

Our current approach uses a single LLM (Gemini) to assess task-level automation potential, then applies deterministic weighted aggregation and Monte Carlo confidence intervals. This is a reasonable v1 approach but lags significantly behind SOTA.

**Finding A1-1: Benchmark-Based AI Occupational Exposure (BAIOE)**
- **Who uses it**: Academic researchers (OpenReview 2025)
- **Citation**: BAIOE paper, OpenReview 2025, https://openreview.net/pdf?id=6Sg1kouJmP
- **What it does better**: Dynamically links AI benchmark performance (MMLU, HumanEval, etc.) to O*NET task abilities, producing a living exposure index that updates as AI capabilities improve. Our static LLM assessment doesn't track AI progress over time.
- **Recommendation**: **Adapt** — Integrate benchmark-to-task mapping as a secondary signal
- **Effort**: Medium (1-4 weeks)
- **Impact**: Enables temporal tracking of AI exposure as models improve; differentiates our platform from static 2013 Frey & Osborne data used by competitors

**Finding A1-2: Task Exposure to AI (TEAI) & Task Replacement by AI (TRAI) Indexes**
- **Who uses it**: Colombo, Mercorio, Mezzanzanica, Serino (IJCAI 2025)
- **Citation**: Colombo et al. (2025), IJCAI, https://doi.org/10.24963/ijcai.2025.1066
- **What it does better**: Uses open-source LLMs (not proprietary) to assess both exposure (TEAI) and actual replacement (TRAI) separately. Validates through human evaluation. Distinguishes between "AI can do this" vs "AI will replace this" — our APO conflates these.
- **Recommendation**: **Adopt** — Split APO into exposure vs replacement components
- **Effort**: Medium (1-4 weeks)
- **Impact**: More nuanced predictions; separates augmentation from substitution

**Finding A1-3: Anthropic Economic Index — Observed vs Theoretical Exposure**
- **Who uses it**: Anthropic (Handa et al., 2025), Brynjolfsson et al. (2025)
- **Citation**: Brynjolfsson et al. (2025), "Canaries in the Coal Mine?", https://digitaleconomy.stanford.edu/app/uploads/2025/12/CanariesintheCoalMine_Nov25.pdf
- **What it does better**: Measures *observed* AI usage (from Claude traffic) vs *theoretical* capability. Finds entry-level employment declined in automative tasks but not augmentative ones. Our system has no observed-usage signal.
- **Recommendation**: **Watch** — Partner with or scrape aggregate AI usage data
- **Effort**: High (1-3 months)
- **Impact**: Ground-truth validation of predictions; first-mover advantage in observed-vs-theoretical gap analysis

**Finding A1-4: Generative AI Susceptibility Index (GAISI)**
- **Who uses it**: Henseke et al. (2025), Cardiff University
- **Citation**: Henseke et al. (2025), arXiv:2507.22748, https://arxiv.org/pdf/2507.22748
- **What it does better**: Task-based measure using probabilistic LLM ratings linked to worker-reported task data. Demonstrates that job postings fell 5.5% below pre-GPT trends by 2025-Q2. Uses 25% productivity threshold (not 50% like Eloundou). High reliability and predictive power.
- **Recommendation**: **Adapt** — Adopt the 25% threshold and probabilistic rating approach
- **Effort**: Low (<1 week)
- **Impact**: More sensitive detection of automation impact; better correlation with real labor market outcomes

**Finding A1-5: ILO Refined Global Index (2025 Update)**
- **Who uses it**: ILO (Gmyrek, 2025)
- **Citation**: Gmyrek (2025), ILO Working Paper WP140, https://webapps.ilo.org/static/english/intserv/working-papers/wp140/index.html
- **What it does better**: Uses Delphi-style expert validation + survey data from 1,640 workers across ISCO-08 groups. Four progressive exposure gradients. Updated from 2023 to reflect GenAI advances. 52,558 data points across 2,861 tasks.
- **Recommendation**: **Adapt** — Adopt four-gradient exposure framework (not binary high/low)
- **Effort**: Low (<1 week)
- **Impact**: More nuanced categorization; international comparability

### A2: Loopholes and Gaps in Current APO Methodology

| Gap | Severity | Current State | SOTA Approach |
|-----|:---:|---|---|
| No temporal AI capability tracking | **Critical** | Static LLM assessment at query time | BAIOE: benchmark-to-task dynamic mapping |
| Conflates exposure with replacement | **High** | Single APO score | TEAI/TRAI split (Colombo et al. 2025) |
| No observed-usage validation | **High** | Pure theoretical prediction | Anthropic Economic Index approach |
| Binary confidence levels (high/medium/low) | **Medium** | 3-tier confidence | Conformal prediction with mathematical guarantees |
| No expert validation loop | **Medium** | LLM-only assessment | ILO Delphi method + survey validation |
| Single LLM dependency | **Medium** | Gemini only | Multi-model ensemble + human validation |
| No demographic disaggregation | **High** | Occupation-level only | Brynjolfsson: entry-level vs senior effects |
| No augmentation vs substitution split | **High** | Single automation score | Anthropic: automative vs augmentative usage |

### A3: Occupation and Demographic Assessment

**Finding A3-1: Entry-Level vs Senior Impact Disaggregation**
- Brynjolfsson et al. (2025) find that entry-level employment has declined specifically in automative AI exposure applications, with muted changes for augmentation exposure. Our system does not disaggregate by career stage.
- **Recommendation**: **Adopt** — Add career-stage dimension to APO
- **Effort**: Medium (1-4 weeks)
- **Impact**: Critical for student/recent-grad users; differentiates from competitors

---

## Question B: What Is the Rest of the World Doing That We Are Not?

### B1: Industry Operational Systems

**Finding B1-1: LinkedIn Economic Graph + Skills Graph**
- **Who uses it**: LinkedIn (225M+ US members, 875M globally, 39K skills, 59M companies)
- **Citation**: LinkedIn Economic Graph Research Institute, https://economicgraph.linkedin.com/
- **What they do**:
  - Skills Genome: TF-IDF-based 50 most characteristic skills per occupation
  - Skills-based talent pool increase metric
  - Real-time hiring rate indexed to 2016 baseline
  - Labor market tightness from job application data
  - AI Talent Index adjusted for platform penetration
  - Generative AI Impact framework: 3-stage (GAI-assisted skill classification → embedding-driven expansion → skill-based occupation classification)
- **What we lack**: Real-time labor market data, skills supply/demand matching, 39K skill taxonomy
- **Recommendation**: **Adapt** — Integrate LinkedIn Skills API for supply/demand signals
- **Effort**: High (1-3 months)
- **Impact**: Transforms market intelligence from LLM-generated to data-grounded

**Finding B1-2: Lightcast (formerly Burning Glass) Job Posting Analytics**
- **Who uses it**: Lightcast (220K+ sources, 165+ countries, data back to 2010)
- **Citation**: Lightcast JPA Methodology, https://docs.lightcast.io/data/docs/job-posting-analytics-jpa-methodology
- **What they do**:
  - Scrape 220K+ websites daily with 80% deduplication rate
  - Extract skills, education, experience, salary from job postings
  - SOC and NAICS code assignment via ML classifiers
  - Real-time skill demand tracking with historical trends
  - Posting duration as difficulty-to-fill signal
  - Multi-language skill classification (German, Spanish, French, Italian, Dutch)
- **What we lack**: Real-time job posting data, skill demand quantification, salary extraction
- **Recommendation**: **Watch** — Lightcast API is paid; explore free alternatives (SerpAPI + scraping)
- **Effort**: Very High (3-12 months)
- **Impact**: Would close the biggest data gap vs commercial competitors

**Finding B1-3: ESCO Framework Integration**
- **Who uses it**: European Commission (3,039 occupations, 13,939 skills, 28 languages)
- **Citation**: ESCO v1.2.1, https://esco.ec.europa.eu/
- **What they do**:
  - Multilingual occupation-skill taxonomy
  - REST API with linked data (URI-identified concepts)
  - Free download in CSV, RDF, JSON-LD, XML formats
  - Mapped to ISCO-08 codes
  - Occupation-skill relationships for job matching
- **What we lack**: European occupation coverage, multilingual support, ESCO skill taxonomy
- **Recommendation**: **Adopt** — Integrate ESCO API (free, zero-cost constraint compatible)
- **Effort**: Medium (1-4 weeks)
- **Impact**: Expands coverage from US-only to EU; enables international users

### B2: Emerging ML/DL Approaches

**Finding B2-1: Graph Neural Networks for Occupation-Skill Graphs**
- **Who uses it**: AOC-GCN (UTS Sydney), LinkSAGE (LinkedIn), OKRA (2025)
- **Citations**:
  - AOC-GCN: https://opus.lib.uts.edu.au/bitstream/10453/164892/2/Being_Automated_or_Not__Risk_Identification_of_Occupations_with_Graph_Neural_Networks.pdf
  - LinkSAGE: Liu et al. (2024), arXiv:2402.13430, https://arxiv.org/pdf/2402.13430
  - OKRA: Schellingerhout et al. (2025), arXiv:2504.07108, https://arxiv.org/pdf/2504.07108
- **What they do**:
  - AOC-GCN: Builds bipartite occupation-skill graph (910 occupations, 135 skills, 13,222 edges), applies GCN for automated risk classification. Outperforms baselines by capturing both internal features and external interactions.
  - LinkSAGE: LinkedIn's production GNN with billions of nodes/edges. Inductive graph learning on heterogeneous, evolving graph. Nearline inference for real-time serving. Validated across multiple A/B tests with improved member engagement and retention.
  - OKRA: Explainable multi-stakeholder job recommender using attention-based GNN. Provides both candidate- and company-side explanations. Outperforms 6 baselines on nDCG.
- **What we lack**: No graph-based models; our skill adjacency uses cosine similarity on embeddings only
- **Recommendation**: **Adopt** — Build occupation-skill bipartite graph from O*NET + ESCO data, apply GCN
- **Effort**: High (1-3 months)
- **Impact**: Captures structural relationships missed by pairwise similarity; SOTA for occupation classification

**Finding B2-2: Pre-DyGAE — Dynamic Graph Autoencoder for Skill Demand Forecasting**
- **Who uses it**: Chen et al. (IJCAI 2024)
- **Citation**: Chen et al. (2024), IJCAI, https://www.ijcai.org/proceedings/2024/0222.pdf
- **What it does**: Pre-trains graph autoencoder on job descriptions, then fine-tunes with temporal shift module for dynamic skill demand forecasting. Uses contrastive learning on skill co-occurrence clusters. Tweedie + ranking loss for imbalanced distributions.
- **Recommendation**: **Watch** — Relevant for future skill demand forecasting feature
- **Effort**: Very High (3-12 months)
- **Impact**: Would enable predictive skill demand, not just current state

**Finding B2-3: CHGH — Cross-View Hierarchical Graph for Skill Demand-Supply Joint Prediction**
- **Who uses it**: Chao et al. (AAAI 2024)
- **Citation**: Chao et al. (2024), AAAI, https://doi.org/10.1609/aaai.v38i18.29956
- **What it does**: Joint prediction of skill demand AND supply using cross-view graph encoder + hierarchical graph encoder + conditional hyper-decoder. Outperforms 7 baselines on 3 real-world datasets.
- **Recommendation**: **Watch** — Relevant for future supply/demand matching
- **Effort**: Very High (3-12 months)
- **Impact**: Would enable talent pool analysis

**Finding B2-4: CAREER Foundation Model for Labor Sequence Data**
- **Who uses it**: Vafa et al. (2024), Columbia University
- **Citation**: Vafa et al. (2024), https://www.cs.columbia.edu/~blei/papers/VafaPalikotDuKanodiaAtheyBlei2024.pdf
- **What it does**: Transformer-based foundation model trained on career histories. Conditions on entire job history (not just last job like Markov models). Predicts among hundreds of occupations. Nonlinear representations without manual features. Outperforms first-order Markov models significantly.
- **Recommendation**: **Adopt** — Replace our A* pathfinding with transformer-based career trajectory prediction
- **Effort**: High (1-3 months)
- **Impact**: SOTA career path prediction; fundamentally better than our current A* + Jaccard approach

**Finding B2-5: LABOR-LLM — Language-Based Occupational Representations**
- **Who uses it**: Vafa et al. (2025)
- **Citation**: LABOR-LLM, arXiv:2406.17972v4, https://arxiv.org/html/2406.17972v4
- **What it does**: Uses LLM next-word probability to predict career transitions. Fine-tunes Llama-2 (7B/13B) on career history text templates. Leverages textual job titles (CAREER treats occupation as categorical). Better than CAREER when text is informative.
- **Recommendation**: **Adapt** — Use Gemini's next-token probability for career transition scoring
- **Effort**: Medium (1-4 weeks)
- **Impact**: Leverages our existing Gemini integration for improved career predictions

**Finding B2-6: Bipartite Graph Occupation Similarity from ESCO**
- **Who uses it**: Boškoski et al. (2024)
- **Citation**: Boškoski et al. (2024), DOI:10.1080/12460125.2024.2354585, https://doi.org/10.1080/12460125.2024.2354585
- **What it does**: Multiple weighted bipartite projection measures from ESCO ontology. Validated on 450,000+ job transitions in Slovenia. Different measures capture different viable career paths. Fully explainable and transferable across regions.
- **Recommendation**: **Adopt** — Replace Jaccard similarity with weighted bipartite projection measures
- **Effort**: Medium (1-4 weeks)
- **Impact**: Better career path recommendations; explainable; internationally transferable

### B3: Academic Research Advances

**Finding B3-1: Conformal Prediction for Calibrated Uncertainty**
- **Who uses it**: Multiple papers (2024-2025), MDPI, MLR Proceedings
- **Citations**:
  - Kaiser & Herzog (2025), https://journals.sagepub.com/doi/10.1177/25152459251380452
  - Peng et al. (2025), https://proceedings.mlr.press/v267/peng25b.html
  - Conformal prediction under covariate shift, https://assets-eu.researchsquare.com/files/rs-9822449/v1_covered_30c133ae-822d-43d7-82af-a3dc1b82dfde.pdf
- **What it does**: Distribution-free uncertainty quantification with finite-sample coverage guarantees. Converts point predictions to prediction intervals with mathematical guarantees (e.g., 90% coverage). Works with any black-box model. Handles covariate shift via importance weighting.
- **What we lack**: Our Monte Carlo CI is heuristic (2%/5%/10% noise based on confidence tier), not mathematically guaranteed
- **Recommendation**: **Adopt** — Replace Monte Carlo CI with split conformal prediction
- **Effort**: Medium (1-4 weeks)
- **Impact**: Mathematically guaranteed coverage; replaces heuristic with principled UQ; improves ECE calibration

**Finding B3-2: SHAP-Based Explainability for Career Predictions**
- **Who uses it**: Multiple papers (2024-2025)
- **Citations**:
  - Begum & Mrutyunjaya (2025), https://doi.org/10.5281/zenodo.16885113
  - Shannaq (2025), IEEE ICBATS, https://doi.org/10.1109/icbats66542.2025.11258455
  - Vultureanu-Albişi & Bădică (2026), Springer, https://doi.org/10.1007/978-3-031-98170-8_6
- **What they do**: Apply SHAP (SHapley Additive exPlanations) to career/prediction models for feature-level attribution. Identify which features (courses, skills, experience) most influence predictions. LIME as complementary local explanation.
- **What we lack**: Our explain-apo function uses LLM narrative only, no quantitative feature attribution
- **Recommendation**: **Adopt** — Add SHAP values to APO explanation
- **Effort**: Medium (1-4 weeks)
- **Impact**: Quantitative explainability; users see exactly which factors drive their score; NIST AI RMF compliance

**Finding B3-3: Ensemble Stacking (XGBoost + LightGBM + CatBoost)**
- **Who uses it**: Multiple papers (2024-2025)
- **Citations**:
  - Sindhu (2025), https://doi.org/10.21203/rs.3.rs-7944070/v1
  - Zhu et al. (2024), arXiv:2402.17979, https://arxiv.org/html/2402.17979
  - MetaBoost (2025), https://github.com/Shivansh-707/MetaBoost
- **What they do**: Stack XGBoost + LightGBM + CatBoost as base learners with Random Forest or Ridge Regression as meta-learner. Dual-layer ensemble reduces both variance and bias. Consistently outperforms individual models on tabular data.
- **What we lack**: Our APO uses a single LLM + deterministic weighting, no ML ensemble
- **Recommendation**: **Adopt** — Train ensemble model on historical APO predictions + expert assessments
- **Effort**: High (1-3 months)
- **Impact**: Better calibrated predictions; reduces LLM dependency; enables continuous improvement

### B4: Operational Practices

**Finding B4-1: SkillMORTEX — Epidemiological Skill Decay Modeling**
- **Who uses it**: Kavargy (open-source, 2024)
- **Citation**: SkillMORTEX, https://github.com/dkavargy/SkillMORTEX
- **What it does**: Models skill lifecycle using Weibull survival distributions. Tracks skill birth, growth, decay, and obsolescence using Stack Overflow data (250K+ posts). Epidemiological metrics: prevalence, incidence, mortality for skills.
- **What we lack**: Our skill half-life uses simple exponential decay with no empirical validation
- **Recommendation**: **Adopt** — Replace exponential decay with Weibull survival model
- **Effort**: Medium (1-4 weeks)
- **Impact**: Empirically grounded skill decay; better than our heuristic exponential model

**Finding B4-2: Semi-Markov Career Transition Models**
- **Who uses it**: Multiple papers (2024-2025)
- **Citations**:
  - BOUNNITE (2025), https://doi.org/10.21203/rs.3.rs-6398455/v1
  - Semi-Markov framework (2025), https://www.pbjournals.com/image/catalog/Journal%20Papers/AJSA/2025/No%202%20(2025)/6-Anindita-AJSA%20(1).pdf
  - Oda (2023), https://doi.org/10.14293/s2199-1006.1.sor-.ppbwilc.v1
- **What they do**: Semi-Markov models incorporate random holding times (not memoryless). Time-dependent transition probabilities. More realistic than simple Markov chains. Bootstrap CI for transition matrices.
- **What we lack**: Our career trajectory simulator uses Monte Carlo with stochastic learning/market factors, not a principled transition model
- **Recommendation**: **Adopt** — Replace Monte Carlo simulation with semi-Markov transition model
- **Effort**: Medium (1-4 weeks)
- **Impact**: More realistic career trajectories; time-dependent probabilities

**Finding B4-3: Algorithmic Bias Auditing Frameworks**
- **Who uses it**: EEOC, NYC Local Law 144, academic researchers
- **Citations**:
  - EEOC Select Issues (2024), https://data.aclum.org/storage/2025/01/EOCC_www_eeoc_gov_laws_guidance_select-issues-assessing-adverse-impact-software-algorithms-and-artificial.pdf
  - Gerchick et al. (2025), "Auditing the Audits", https://doi.org/10.1145/3715275.3732004
  - JobFair framework (2024), arXiv:2406.15484, https://arxiv.org/abs/2406.15484v1
- **What they do**:
  - Four-fifths rule for adverse impact detection
  - Demographic parity, equalized odds, calibration fairness metrics
  - Counterfactual bias testing (swap gender/race in resumes)
  - NYC Local Law 144 mandates independent bias audits for automated employment tools
  - 116 bias audits analyzed: most pass four-fifths rule but have significant missing demographic data
- **What we lack**: No bias auditing; no demographic disaggregation; no four-fifths rule compliance
- **Recommendation**: **Adopt** — Implement bias auditing pipeline with four-fifths rule check
- **Effort**: High (1-3 months)
- **Impact**: Legal compliance (EEOC, ADA, Title VII); differentiator for enterprise clients

---

## Question C: What Should We Incorporate to Improve Our Model Multifold?

### C1: Prioritized Recommendations

| # | Recommendation | Source | Effort | Impact | Priority |
|---|---|---|:---:|:---:|:---:|
| 1 | Split conformal prediction for APO confidence intervals | Academic SOTA | Medium | Critical | **P0** |
| 2 | SHAP feature attribution for APO explanations | Multiple papers | Medium | Critical | **P0** |
| 3 | TEAI/TRAI split (exposure vs replacement) | Colombo et al. 2025 | Medium | High | **P0** |
| 4 | ESCO API integration (free, 28 languages) | EU Commission | Medium | High | **P0** |
| 5 | Four-gradient exposure framework | ILO 2025 | Low | Medium | **P0** |
| 6 | Weibull survival model for skill half-life | SkillMORTEX | Medium | High | **P1** |
| 7 | Semi-Markov career transition model | Multiple papers | Medium | High | **P1** |
| 8 | Bipartite graph occupation similarity | Boškoski et al. 2024 | Medium | High | **P1** |
| 9 | Career-stage disaggregation (entry vs senior) | Brynjolfsson 2025 | Medium | High | **P1** |
| 10 | GCN on occupation-skill bipartite graph | AOC-GCN, LinkSAGE | High | High | **P1** |
| 11 | Ensemble stacking (XGBoost+LightGBM+CatBoost) | Multiple papers | High | High | **P2** |
| 12 | CAREER foundation model for trajectories | Vafa et al. 2024 | High | Very High | **P2** |
| 13 | LABOR-LLM next-token career prediction | Vafa et al. 2025 | Medium | Medium | **P2** |
| 14 | Bias auditing pipeline (four-fifths rule) | EEOC, LL144 | High | Critical | **P2** |
| 15 | BAIOE benchmark-to-task dynamic mapping | OpenReview 2025 | High | Medium | **P3** |
| 16 | Pre-DyGAE skill demand forecasting | IJCAI 2024 | Very High | High | **P3** |
| 17 | CHGH skill demand-supply joint prediction | AAAI 2024 | Very High | High | **P3** |
| 18 | Observed AI usage validation (Anthropic Index) | Anthropic 2025 | Very High | Very High | **P3** |

### C2: Specific Architecture Recommendations

**Architecture Change 1: Conformal Prediction Layer**
```
Current: LLM → Deterministic Weighting → Monte Carlo CI (heuristic noise)
Proposed: LLM → Deterministic Weighting → Split Conformal Prediction (90% coverage guarantee)
```
Implementation: Reserve 20% of historical APO predictions as calibration set. Compute nonconformity scores. Use empirical quantile as threshold for new predictions. Guarantees 90% coverage regardless of distribution.

**Architecture Change 2: Graph-Based Occupation-Skill Model**
```
Current: Gemini embeddings → Cosine similarity → Pairwise adjacency
Proposed: O*NET+ESCO bipartite graph → GCN/GAT embeddings → Structural adjacency + pairwise similarity
```
Implementation: Build bipartite graph from O*NET (tasks, skills, abilities, knowledge, technologies) + ESCO (occupation-skill relationships). Train GCN with node features from embeddings. Use learned representations for skill adjacency, bridge roles, and career pathfinding.

**Architecture Change 3: Ensemble APO Model**
```
Current: Single Gemini LLM → Weighted aggregation → APO score
Proposed: Gemini LLM (semantic) + XGBoost (tabular features) + CatBoost (categorical) → Meta-learner → APO score
```
Implementation: Extract tabular features from O*NET data (task counts, skill levels, knowledge areas). Train gradient boosting models on historical APO predictions + expert assessments. Stack with LLM output as meta-learner input. Reduces LLM API costs and improves calibration.

**Architecture Change 4: SHAP Explanation Layer**
```
Current: explain-apo → LLM narrative (qualitative)
Proposed: explain-apo → SHAP values (quantitative) + LLM narrative (qualitative) + Waterfall chart
```
Implementation: Apply SHAP to the ensemble model. Generate waterfall plots showing feature contributions. Combine with LLM narrative for human-readable context. Satisfies NIST AI RMF explainability requirements.

### C3: Prediction Quality Improvements

**Improvement 1: Calibration**
- Current ECE: Unknown (ECE function exists but no regular calibration runs)
- Target: ECE < 0.05 with conformal prediction
- Method: Monthly calibration runs on new expert assessments + conformal prediction intervals

**Improvement 2: Coverage**
- Current: Heuristic 95% CI with ±2%/5%/10% noise
- Target: Mathematically guaranteed 90% marginal coverage via split conformal
- Method: Replace Monte Carlo with conformal quantile

**Improvement 3: Bias Detection**
- Current: No bias metrics computed
- Target: Four-fifths rule compliance + demographic parity + equalized odds
- Method: Log demographic proxies (occupation codes, geographic regions) and compute bias metrics quarterly

---

## Top 3 Web App Gap Analysis (Required Table)

| Dimension | Our Current Rating (1-5) | Top 3 Benchmark Rating (1-5) | What's Needed to Reach 5 | Priority | Effort |
|-----------|:---:|:---:|---|:---:|:---:|
| **Prediction Accuracy** (APO scoring, calibration, validation) | 2 | 4 | Conformal prediction, ensemble stacking, expert validation loop, ECE < 0.05 | Critical | High |
| **Model Sophistication** (ensemble, causal inference, conformal prediction) | 1 | 4 | XGBoost+LightGBM+CatBoost ensemble, GCN on occupation-skill graph, CAREER foundation model | High | High |
| **Data Coverage & Freshness** (O*NET, BLS, real-time job postings, ESCO) | 2 | 5 | ESCO API integration, SerpAPI job posting scraping, BLS API automation, daily data refresh | Critical | Medium |
| **Explainability & XAI** (SHAP, counterfactuals, waterfall, audit trail) | 2 | 4 | SHAP values, waterfall visualizations, counterfactual explanations, LLM+SHAP hybrid | High | Medium |
| **Career Transition Intelligence** (bridge roles, trajectory simulation, Markov models) | 2 | 4 | Semi-Markov transition model, CAREER foundation model, bipartite graph similarity, LABOR-LLM | High | Medium |
| **Skill Analytics** (embeddings, adjacency, half-life, decay modeling) | 2 | 4 | Weibull survival model, GCN embeddings, SkillMORTEX-style decay, ESCO skill taxonomy | High | Medium |
| **Personalization** (profile-based ML, collaborative filtering, user history) | 2 | 4 | User profile embeddings, collaborative filtering on career transitions, history-based recommendations | Medium | High |
| **Market Intelligence** (real-time labor market, salary prediction, demand forecasting) | 1 | 5 | Lightcast-style job posting analytics, LinkedIn Skills API, salary prediction model, Pre-DyGAE forecasting | Critical | Very High |
| **Fairness & Bias Auditing** (demographic parity, EEOC/ADA compliance, bias metrics) | 1 | 3 | Four-fifths rule implementation, demographic disaggregation, counterfactual bias testing, quarterly audits | Critical | High |
| **UI/UX & Accessibility** (WCAG 2.2 AA, responsive, dark mode, interactive visualizations) | 4 | 4 | Already strong — add SHAP waterfall charts, conformal interval visualizations, career trajectory graph views | Low | Low |
| **API & Integration Ecosystem** (public API, webhook, ESCO, LinkedIn, Lightcast) | 1 | 4 | Public REST API, ESCO API integration, LinkedIn Skills API, webhook system, SDK | Medium | High |
| **Compliance & Governance** (NIST AI RMF, proof packs, decision boundaries, audit logs) | 3 | 3 | Already strong — add automated bias audits, conformal prediction audit trail, model card generation | Medium | Medium |
| **Scalability & Performance** (caching, CDN, edge compute, load times) | 3 | 5 | Already good — add prediction caching (24h TTL), ensemble model serving, graph DB for occupation-skill | Medium | Medium |
| **Community & Social Proof** (user reviews, expert endorsements, citations, partnerships) | 1 | 4 | Expert advisory board, academic partnerships, user testimonials, SEO content, conference presentations | Medium | Low |
| **Monetization & Sustainability** (pricing tiers, enterprise contracts, API revenue) | 2 | 4 | Stripe integration (in progress), enterprise tier, API usage billing, coach white-label reports | High | Medium |

### Strategic Insights

**Top 3 Dimensions with Highest Compound Effect (if improved to 5/5):**
1. **Prediction Accuracy** — Everything depends on this. Conformal prediction + ensemble = trust = retention = revenue.
2. **Data Coverage & Freshness** — ESCO (free) + SerpAPI job scraping transforms market intelligence from LLM hallucination to data-grounded insights.
3. **Fairness & Bias Auditing** — Legal compliance unlocks enterprise contracts; differentiates from competitors who ignore this.

**Table Stakes (must be 4+ to be considered top 3):**
- Prediction Accuracy
- Data Coverage & Freshness
- Fairness & Bias Auditing
- Explainability & XAI
- UI/UX & Accessibility

**Current Differentiators to Protect and Amplify:**
- **Compliance & Governance** (3/5) — NIST AI RMF proof packs are rare among competitors
- **UI/UX & Accessibility** (4/5) — Dark mode, bento grids, WCAG compliance already strong
- **Scalability & Performance** (3/5) — Edge functions + caching already implemented

**Single Biggest Blocker Preventing Top 3:**
**Data Coverage & Freshness (rated 1/5)**. Our market intelligence relies entirely on LLM-generated analysis with SerpAPI as a thin wrapper. Top 3 competitors (LinkedIn, Lightcast, WillRobotsTakeMyJob) have real-time data pipelines. Without grounding predictions in real labor market data, no amount of model sophistication will close the gap. ESCO integration (free) is the fastest path to improvement here.

---

## Phased Implementation Roadmap

### Phase 0: Quick Wins (<1 week, low effort, high impact)

| Task | Files to Modify | Verification |
|------|---|---|
| **P0-1**: Four-gradient exposure framework | `supabase/functions/calculate-apo/index.ts`, `supabase/lib/prompts.ts` | APO output includes 4 gradient levels instead of binary |
| **P0-2**: 25% productivity threshold (GAISI) | `supabase/lib/prompts.ts` | Prompt updated to use 25% threshold instead of 50% |
| **P0-3**: Add career-stage dimension to APO | `supabase/functions/calculate-apo/index.ts`, Zod schema | APO output includes entry_level vs senior disaggregation |
| **P0-4**: Log demographic proxies for bias auditing | `supabase/functions/calculate-apo/index.ts` | Occupation codes + geographic regions logged to `apo_logs` |

### Phase 1: Medium Improvements (1-4 weeks)

| Task | Files to Modify | Verification |
|------|---|---|
| **P1-1**: Split conformal prediction | New file: `supabase/lib/conformal.ts`. Modify: `supabase/functions/calculate-apo/index.ts` | ECE < 0.10; 90% coverage guarantee on calibration set |
| **P1-2**: SHAP feature attribution | New file: `supabase/lib/shap.ts`. Modify: `supabase/functions/explain-apo/index.ts` | SHAP waterfall chart in APO explanation |
| **P1-3**: TEAI/TRAI split | `supabase/functions/calculate-apo/index.ts`, `supabase/lib/prompts.ts`, `supabase/lib/promptSchemas.ts` | Two separate scores: exposure + replacement |
| **P1-4**: ESCO API integration | New file: `supabase/lib/escoClient.ts`. New function: `supabase/functions/search-esco-occupations/index.ts` | ESCO occupations searchable; mapped to O*NET codes |
| **P1-5**: Weibull survival model for skill half-life | `supabase/functions/estimate-skill-half-life/index.ts` | Half-life uses Weibull distribution with empirical shape parameter |
| **P1-6**: Semi-Markov career transition model | `supabase/functions/simulate-career-trajectory/index.ts` | Transition probabilities are time-dependent (not memoryless) |
| **P1-7**: Bipartite graph occupation similarity | `supabase/functions/calculate-skill-adjacency/index.ts`, `supabase/functions/find-bridge-roles/index.ts` | Replace Jaccard with weighted bipartite projection from ESCO |
| **P1-8**: Career-stage disaggregation | `supabase/functions/calculate-apo/index.ts`, `supabase/lib/prompts.ts` | APO includes separate scores for entry-level vs experienced |
| **P1-9**: GCN on occupation-skill graph | New files: `supabase/lib/occupationGraph.ts`, graph construction + GCN inference | Occupation-skill graph built from O*NET + ESCO; GCN embeddings used for adjacency |

### Phase 2: Architectural Changes (1-3 months)

| Task | Files to Modify | Verification |
|------|---|---|
| **P2-1**: Ensemble stacking model | New files: `supabase/lib/ensemble.ts`, training pipeline. Modify: `supabase/functions/calculate-apo/index.ts` | XGBoost+LightGBM+CatBoost ensemble with meta-learner; AUC > 0.85 |
| **P2-2**: CAREER foundation model for trajectories | New file: `supabase/lib/careerModel.ts`. Modify: `supabase/functions/simulate-career-trajectory/index.ts`, `supabase/functions/find-bridge-roles/index.ts` | Transformer-based career prediction; outperforms A* + Jaccard |
| **P2-3**: LABOR-LLM next-token career prediction | `supabase/lib/GeminiClient.ts`, `supabase/functions/simulate-career-trajectory/index.ts` | Gemini next-token probability used for transition scoring |
| **P2-4**: Bias auditing pipeline | New files: `supabase/lib/biasAudit.ts`, `supabase/functions/audit-bias/index.ts`. New migration: bias audit results table | Four-fifths rule compliance; demographic parity metrics; quarterly audit reports |
| **P2-5**: Public REST API | New function: `supabase/functions/api-v1/index.ts`. New docs: `docs/api/` | Public API with rate limiting, API key auth, usage billing |
| **P2-6**: User profile embeddings + collaborative filtering | New file: `supabase/lib/profileEmbeddings.ts`. Modify: `supabase/functions/analyze-profile/index.ts` | Profile-based ML recommendations; user history influences suggestions |

### Phase 3: Research-Grade Capabilities (3-12 months)

| Task | Files to Modify | Verification |
|------|---|---|
| **P3-1**: BAIOE benchmark-to-task dynamic mapping | New file: `supabase/lib/benchmarkTracker.ts`. New table: `ai_benchmarks` | APO updates as AI benchmarks improve; temporal tracking |
| **P3-2**: Pre-DyGAE skill demand forecasting | New function: `supabase/functions/forecast-skill-demand/index.ts` | Dynamic graph autoencoder for skill demand prediction |
| **P3-3**: CHGH skill demand-supply joint prediction | New function: `supabase/functions/skill-supply-demand/index.ts` | Cross-view hierarchical graph for joint prediction |
| **P3-4**: Observed AI usage validation | New function: `supabase/functions/ai-usage-index/index.ts`. Partnership or scraping | Anthropic Economic Index-style observed vs theoretical exposure |
| **P3-5**: Lightcast-style job posting analytics | New function: `supabase/functions/job-posting-analytics/index.ts`. SerpAPI + scraping pipeline | Real-time skill demand from job postings; salary extraction |
| **P3-6**: Academic partnerships + expert advisory board | Organizational | Expert validation of APO predictions; published methodology paper |

---

## Constraints Compliance

### Zero-Cost Infrastructure
- **ESCO API**: Free, no API key required ✅
- **Conformal Prediction**: Pure computation, no external API ✅
- **SHAP**: Pure computation, no external API ✅
- **Weibull Survival**: Pure computation, no external API ✅
- **Semi-Markov Models**: Pure computation, no external API ✅
- **GCN**: Requires training but inference is free (Supabase Edge Function) ✅
- **Ensemble (XGBoost/LightGBM/CatBoost)**: Training requires compute but inference is free ✅
- **SerpAPI**: Already integrated (free tier: 100 searches/month) ✅
- **LinkedIn Skills API**: Requires partnership (not free) ❌ — Phase 3
- **Lightcast API**: Paid ❌ — Phase 3, explore free alternatives

### Explainability and Auditability
- SHAP values provide quantitative feature attribution (NIST AI RMF)
- Conformal prediction provides mathematical coverage guarantees
- Bias auditing provides four-fifths rule compliance evidence
- All changes maintain existing proof pack system

### Non-Discrimination
- Bias auditing pipeline (P2-4) addresses EEOC/ADA/Title VII compliance
- Demographic disaggregation (P0-4) enables bias detection
- Counterfactual testing planned for Phase 2

---

## Research Anchors

| Anchor | Year | Relevance | Status in Codebase |
|--------|------|-----------|-------------------|
| Frey & Osborne | 2013 | Original automation probability | Referenced in docs |
| Eloundou et al. | 2024 | GPT-4 task exposure (β measure) | **Not referenced** — Add |
| Brynjolfsson et al. | 2025 | Observed AI employment effects | **Not referenced** — Add |
| Colombo et al. (TEAI/TRAI) | 2025 | LLM-based task exposure + replacement | **Not referenced** — Add |
| Anthropic Economic Index | 2025 | Observed vs theoretical AI usage | **Not referenced** — Add |
| ILO/Gmyrek | 2025 | Refined global exposure index | **Not referenced** — Add |
| Henseke et al. (GAISI) | 2025 | UK GenAI susceptibility index | **Not referenced** — Add |
| BAIOE | 2025 | Benchmark-based AI exposure | **Not referenced** — Add |
| Vafa et al. (CAREER) | 2024 | Foundation model for career sequences | **Not referenced** — Add |
| Vafa et al. (LABOR-LLM) | 2025 | LLM-based occupational representations | **Not referenced** — Add |
| Boškoski et al. | 2024 | Bipartite graph occupation similarity | **Not referenced** — Add |
| SkillMORTEX | 2024 | Weibull skill decay modeling | **Not referenced** — Add |
| EEOC Select Issues | 2024 | Algorithmic adverse impact guidance | **Not referenced** — Add |
| Gerchick et al. (LL144 audits) | 2025 | Bias audit analysis | **Not referenced** — Add |
| WEF Future of Jobs | 2025 | Skills outlook 2025-2030 | Referenced in StatsOverview |
| Cedefop Skills Forecast | 2025 | European skills demand projection | **Not referenced** — Add |

---

## Summary

This deep research identified **18 specific findings** across SOTA academic methods, industry platforms, and operational practices. The most critical gaps are:

1. **No conformal prediction** (heuristic CI instead of mathematically guaranteed coverage)
2. **No graph-based models** (pairwise cosine similarity instead of GCN on occupation-skill graph)
3. **No real-time data** (LLM-generated market intelligence instead of job posting analytics)
4. **No bias auditing** (no four-fifths rule compliance, no demographic disaggregation)
5. **No ensemble model** (single LLM dependency instead of stacked gradient boosting)
6. **No ESCO integration** (US-only O*NET data, no European/international coverage)

The **single biggest blocker** to top 3 ranking is **Data Coverage & Freshness (1/5)**. ESCO API integration (free) is the fastest path to improvement. Conformal prediction and SHAP explainability are the highest-impact model improvements. Bias auditing is the highest-impact compliance improvement for unlocking enterprise revenue.

**Phase 0** (4 tasks, <1 week) can be implemented immediately with zero external dependencies.
**Phase 1** (9 tasks, 1-4 weeks) requires moderate engineering effort but transforms the platform's scientific foundation.
**Phase 2** (6 tasks, 1-3 months) requires architectural changes but enables enterprise-grade capabilities.
**Phase 3** (6 tasks, 3-12 months) requires partnerships and research-grade investment.

---

## Addendum: Last-30-Days Developments (June–July 2026)

**Research date**: 2026-07-01
**Sources**: 40+ web sources via Exa neural search (6 query clusters)

### D1: Agentic AI Is the New Paradigm Shift

The conversation has fundamentally shifted from "can AI do this task?" to "can an AI agent execute this entire workflow?" This is the single most important development since our original research.

**Finding D1-1: Agentic Task Exposure (ATE) Score**
- **Citation**: arXiv:2604.00186, June 2026, https://arxiv.org/abs/2604.00186
- **What it does**: Extends Acemoglu-Restrepo task exposure framework to agentic AI systems. Scores AI capability, workflow coverage, and logistic adoption velocity. Finds 93.2% of 236 information-intensive occupations cross moderate-risk threshold (ATE ≥ 0.35) by 2030 in Tier 1 US tech regions. Identifies 17 emerging occupation categories in human-AI collaboration, AI governance, and domain-specific AI operations.
- **Impact on our platform**: Our APO assesses individual tasks. We need a **workflow-level exposure dimension** that evaluates whether entire occupational workflows can be executed by AI agents.
- **Recommendation**: **Adopt** — Add ATE-style workflow coverage scoring
- **Effort**: High (1-3 months)

**Finding D1-2: Cognizant "New Work, New World 2026"**
- **Citation**: Cognizant, 2026, https://www.cognizant.com/en_us/aem-i/document/ai-and-the-future-of-work-report/new-work-new-world-2026-how-ai-is-reshaping-work.pdf
- **Key finding**: Exposure scores are **30% higher than forecast for 2032** — happening 6 years ahead of schedule. Annual exposure increase jumped from 2% to **9%**. Fully automatable tasks rose from 1% to 10% in 3 years. Attributes acceleration to multimodal, reasoning, and agentic capabilities.
- **Impact**: Our predictions may be significantly underestimating automation timeline. Need to update our APO scoring to account for agentic capabilities.

**Finding D1-3: Coface "Next Automation Frontier"**
- **Citation**: Coface, 2026, https://www.coface.com/fr/content/download/99219/file/Focus%20Coface%20-%20The%20Next%20Automation%20Frontier%20A%20Scenario%20Map%20of%20AI%20Labour%20Exposure.pdf
- **Key finding**: Introduces "Phase 2: Special Agent" framework. 120 of 923 occupations (13%) show >30% task susceptibility to agentic AI. Workers shift from operators to **supervisors of validation points**. Three-phase model: Phase 1 (LLM task automation), Phase 2 (agentic workflow automation), Phase 3 (autonomous AI systems).
- **Recommendation**: **Adopt** — Add phase-based exposure classification to APO

**Finding D1-4: AIJRI — AI Job Resistance Index**
- **Citation**: JobZone Risk, 2026, https://jobzonerisk.com/methodology
- **Key finding**: Composite scoring methodology specifically designed for **agentic AI** resistance. Task rubric scores "can an AI agent execute this entire workflow without a human?" on 1-5 scale (Irreducible Human → Fully Automatable). Applies evidence-informed modifiers for deployment signals, industry adoption, and regulatory environment. Normalized 0-100 score.
- **Recommendation**: **Adopt** — Replace our binary automation scoring with AIJRI-style 1-5 rubric

### D2: Observed vs Theoretical Exposure Is Now Mainstream

**Finding D2-1: Anthropic Economic Index June 2026 Report**
- **Citation**: Anthropic, June 2026, https://www.anthropic.com/research/economic-index-june-2026-report
- **Key finding**: Launched Economic Index Survey (April 2026), linking 9,700 respondents to Claude usage data. 6 in 10 respondents expect AI to handle most/nearly all work tasks within 12 months. Distinguishes "reported exposure" (today) vs "anticipated exposure" (12 months). Automative usage correlates with worry about job security; augmentative usage does not.
- **Impact**: We should add an "observed adoption" signal alongside theoretical capability. The gap between "can AI do this" and "is AI actually doing this" is the key metric now.

**Finding D2-2: California AI-Unemployment Tracker**
- **Citation**: California Policy Lab, June 2026
- **Key finding**: First state dashboard linking AI exposure to unemployment claims. No statewide surge, but **college-educated workers in highly exposed occupations** show elevated claims post-ChatGPT. Bay Area claims up 50%+.
- **Impact**: Adds real-world validation signal for our predictions.

**Finding D2-3: SHRM 2026 Report**
- **Citation**: SHRM, June 18 2026, https://www.shrm.org/about/press-room/shrm-research-finds-ai-and-automation-exposure-is-rising--but-hi
- **Key finding**: 14,245 US workers surveyed. High displacement risk declined from 6% to **5.1%** (7.9M jobs). Uses O*NET generalized work activity similarity matrix across 830 occupations. Near-term displacement remains limited but concentrated.

**Finding D2-4: Statistics Canada**
- **Citation**: StatCan, Jan 2026, https://www150.statcan.gc.ca/n1/pub/36-28-0001/2026001/article/00003-eng.htm
- **Key finding**: Employment grew regardless of AI exposure Nov 2022–Dec 2025, but **younger and less-educated workers** saw weaker growth. Coding professionals under 30 **stagnated** while 30-49 grew. High-quality jobs most at risk.

**Finding D2-5: Yale Budget Lab**
- **Citation**: Yale Budget Lab, June 2026, https://budgetlab.yale.edu/research/tracking-impact-ai-labor-market
- **Key finding**: AI usage measures show no connection to employment/unemployment changes yet. Occupational mix not changing in ways clearly aligned with AI introduction.

### D3: New Competitor Platforms (10+ New Entrants)

| Platform | Launch | Key Differentiator | Our Gap |
|----------|--------|-------------------|---------|
| **Kairo** (kairocareer.com) | 2026 | Task-level CV analysis, skill overlap mapping, adjacent role paths, 30-day action plan | Similar but simpler; validates our market |
| **Flux AI** (getfluxai.com) | 2026 | 0-100 risk score, **career simulator** ("what if I learn X?"), live rising/declining skill data | We lack career simulator |
| **Skillmelo** (skillmelo.com) | 2026 | **Per-skill automation risk** (not just job title), 1,200+ career paths, AI career coach | We lack per-skill risk scoring |
| **JobForesight** (jobforesight.com) | 2026 | **AI Career Risk Index 2026** — 334 occupations, 2,563 tasks, **CC BY 4.0 open licence**. Calibrated against Anthropic Economic Index | We lack open dataset and Anthropic calibration |
| **AIExposure.org** | Mar 2026 | Task-Level GenAI Capability Mapping (TGCM). AI Displacement Index (ADI). 12 domain expert panels | We lack expert calibration panels |
| **AI Work Index** (aiworkindex.com) | V7 Jun 2026 | 562 occupations, task-concentration exposure buffer (Hampole et al. 2025), demand-persistence proxy | We lack task-concentration buffering |
| **Orbyt Intelligence** | Jun 2026 | **AI Skill Half-Life Engine** — fits exponential/logistic/plateau decay curves to skill premium data. MCP-accessible | We lack multi-curve fitting and MCP |
| **SkillShield** (GitHub) | Feb 2026 | AI-powered **skill-decay detection** — tracks AI-assisted vs self-work, intervenes with micro-challenges | Novel "skill health" concept we lack |
| **AscendIQ** (GitHub) | Jun 2026 | Multi-agent Gemini 2.5 Flash pipeline, career path mapper (upload mentor resume → timeline) | We lack mentor resume analysis |
| **Skilllich** (GitHub/PyPI) | Apr 2026 | AI career impact ratings for 1,028 skills, Python SDK + MCP server, PyPI published | We lack SDK and MCP server |
| **PwC AI Jobs Barometer** | 2026 | Productivity data, "professionalised vs democratised" job classification, wage premium analysis | We lack productivity/wage correlation |

### D4: New Scientific Frameworks (6 New Papers)

**Finding D4-1: CDR Taxonomy — Three-Axis Exposure Measurement**
- **Citation**: GWU, 2026, https://www2.gwu.edu/~forcpgm/2026-005.pdf
- **What it does**: Separates AI exposure into three independent axes: **C**ognitive complexity (C0-C4), **D**eployment difficulty (D0-D4), **R**egulatory restrictions (R0-R4). Applied to full O*NET (23,850 task-activity pairs, 923 occupations) via multi-model LLM consensus (Claude Sonnet 4.6, GPT-5-mini, Gemini 3 Flash). Finds **40.2% of labor time** is within current AI cognitive reach with no physical or regulatory barriers. An additional **19.6%** is blocked by professional standards (R2: 11.5%), statutory regulation (R3: 8.0%), or moral agency requirements (R4: 0.1%).
- **Key insight**: Solves the "dimensional conflation" problem — existing measures mix up "can AI do it" with "will it be deployed" with "is it allowed."
- **Recommendation**: **Adopt** — Restructure APO into CDR three-axis scoring
- **Effort**: High (1-3 months)
- **Impact**: Fundamental improvement in prediction quality; differentiates from all competitors

**Finding D4-2: SAFI — Skill Automation Feasibility Index**
- **Citation**: arXiv:2604.06906, 2026, https://arxiv.org/html/2604.06906
- **What it does**: Benchmarks 4 frontier LLMs (LLaMA 3.3 70B, Mistral Large, Qwen 2.5 72B, Gemini 2.5 Flash) across 263 tasks spanning all 35 O*NET skills (1,052 total model calls). Cross-references with Anthropic Economic Index (756 occupations, 17,998 tasks).
- **Key findings**:
  1. Mathematics (SAFI: 73.2) and Programming (71.8) highest automation feasibility; Active Listening (42.2) and Reading Comprehension (45.5) lowest
  2. **"Capability-demand inversion"** — skills most demanded in AI-exposed jobs are those LLMs perform *least* well at
  3. **78.7% of observed AI interactions are augmentation**, not automation
  4. All 4 models converge to similar skill profiles (3.6-point spread) — feasibility is **skill-dependent, not model-dependent**
- **Recommendation**: **Adopt** — Use SAFI scores as calibration baseline for our APO
- **Effort**: Low (<1 week) — SAFI data is open-sourced
- **Impact**: Grounds our predictions in empirically validated multi-model benchmarks

**Finding D4-3: Tech-Risk Dual-Factor Model**
- **Citation**: arXiv:2604.04464, 2026, https://www.arxiv.org/pdf/2604.04464
- **What it does**: Introduces "Cognitive Risk Asymmetry" — true occupational replaceability is governed by **risk tolerance of the commercial environment**, not just algorithm capability. Multi-model AI ensemble + 31-expert HITL validation across 2,087 DWAs.
- **Key insight**: The labor-market moat is "no longer cognitive complexity, but **physical friction and liability**." Symbolic manipulation and non-routine cognitive professions (Data Scientists, Editors) face unprecedented exposure, while embodied physical trades and high-stakes healthcare roles remain structurally insulated.
- **Recommendation**: **Adopt** — Add business risk tolerance dimension to APO
- **Effort**: Medium (1-4 weeks)

**Finding D4-4: RL Exposure Index**
- **Citation**: arXiv:2605.02598, 2026, https://arxiv.org/html/2605.02598
- **What it does**: First index measuring exposure to **reinforcement learning-driven automation**. Scores 17,951 O*NET tasks across 8 RL training feasibility dimensions. Publicly available on GitHub (https://github.com/boukektkcl/RL-exposure-public).
- **Recommendation**: **Watch** — Integrate as secondary signal for RL-specific exposure
- **Effort**: Low (<1 week) — Public dataset available

**Finding D4-5: Human Agency Scale (H1-H5)**
- **Citation**: arXiv:2506.06576v3, Feb 2026, https://arxiv.org/html/2506.06576v3
- **What it does**: Worker-centric survey framework. Complements SAE L0-L5 automation levels by quantifying **degree of human involvement** required. Finds workers generally positive toward AI agent automation for repetitive/low-value tasks.
- **Recommendation**: **Adopt** — Add Human Agency Scale to our APO output
- **Effort**: Low (<1 week)

**Finding D4-6: AI Work Index V7 — Task-Concentration Buffer**
- **Citation**: AI Work Index V7, Jun 2026, https://aiworkindex.com/reports/v7-release
- **What it does**: Introduces task-concentration exposure buffer based on Hampole et al. (2025, NBER w33509). Key finding: mean task exposure depresses labour demand, but **concentration of exposure in a few tasks offsets losses** — workers reallocate effort to non-exposed tasks. V7 applies concentration as an exposure buffer.
- **Recommendation**: **Adopt** — Add task-concentration buffer to our APO aggregation
- **Effort**: Low (<1 week)

### D5: ESCO + LLM Integration Has Matured

**Finding D5-1: SkiLLink Pipeline**
- **Citation**: Springer, Jun 2026, https://link.springer.com/article/10.1007/s44163-026-01609-1
- **What it does**: Extracts emerging skills from online job ads and maps to ESCO taxonomy using word embeddings + LLMs. Validated by labor market experts across EU countries. Two components: (1) identification-and-filtering using embeddings, (2) mapping via embedding-based recommendations + LLM refinement.
- **Recommendation**: **Adopt** — Use SkiLLink approach for our ESCO integration
- **Effort**: Medium (1-4 weeks)

**Finding D5-2: SkiLLens — 18M Job Ads Across Europe**
- **Citation**: EACL 2026, https://aclanthology.org/2026.eacl-industry.65.pdf
- **What it does**: Multilingual pipeline applied to **18 million job advertisements** from 28 European countries, 23 languages. 70%+ of extracted skills recognized as valid by experts. Combines embedding-based extraction with LLM-assisted validation and ESCO mapping.
- **Impact**: Demonstrates feasibility of large-scale ESCO integration with LLMs.

**Finding D5-3: ESCOPlus 2.0**
- **Citation**: GitHub, 2026, https://github.com/dkavargy/ESCOPlus2.0
- **What it does**: Open-source framework for extending ESCO taxonomy using real OJA data. Occupation-skill bipartite modeling, percentile-based extension thresholds, structured consensus validation. Skill Intensity Indicator, emerging vs declining skill detection, pruning mechanism.
- **Recommendation**: **Adopt** — Use ESCOPlus 2.0 for occupation-skill bipartite graph construction
- **Effort**: Medium (1-4 weeks)

**Finding D5-4: ESCOX — Open-Source Skill Extraction Tool**
- **Citation**: ScienceDirect, 2025, https://www.sciencedirect.com/science/article/pii/S2665963825000326
- **What it does**: Open-source tool for skill/occupation extraction using ESCO + LLMs + precomputed embeddings. User-friendly GUI, no coding required. Developed within SKILLAB EU Horizon project.
- **Recommendation**: **Adopt** — Use ESCOX for our skill extraction pipeline
- **Effort**: Low (<1 week) — Open-source, ready to use

**Finding D5-5: Contrastive Bi-Encoder for ESCO Matching**
- **Citation**: arXiv:2601.09119, Jan 2026, https://arxiv.org/pdf/2601.09119
- **What it does**: Zero-shot pipeline using ESCO skill definitions as supervision. Annotation-free on real postings. Hierarchically constrained generation from ESCO Level-2 categories. Extreme Multi-Label Classification (XMLC) framework.
- **Recommendation**: **Watch** — Relevant for future skill extraction from job postings

### D6: PwC AI Jobs Barometer 2026

**Finding D6-1: PwC AI Jobs Barometer 2026**
- **Citation**: PwC, 2026, https://www.pwc.com/gx/en/services/ai/ai-jobs-barometer.html
- **Key findings**:
  1. Productivity growth is **40% higher** at companies most exposed to AI vs least
  2. **Two-track jobs market**: "professionalised" jobs growing 2x faster than "democratised" jobs with **42% faster wage growth**
  3. Skills needed for AI-exposed jobs are **changing 2x faster** than least exposed (75% increase in gap vs last year)
  4. **Career ladder compressing**: AI-exposed junior roles are **7x more likely** to demand senior skills (leadership, strategic thinking)
  5. Most AI-exposed companies are **not cutting headcount** — expanding and sharing gains with workers
  6. Top fifth of most-exposed companies achieve **163% productivity growth** on average
- **Recommendation**: **Adopt** — Add "professionalised vs democratised" job classification and career ladder compression metrics
- **Effort**: Medium (1-4 weeks)

### D7: OpenAI AI Jobs Transition Framework

**Finding D7-1: OpenAI "Mapping Europe's AI Workforce Opportunity"**
- **Citation**: OpenAI, June 2026, https://www.siliconreport.com/openai-maps-eu-ai-job-transition-identifies-18-of-roles-at-high-automation-risk-8abd6d92
- **What it does**: AI Jobs Transition Framework categorizing occupations into four outcomes: **18% high automation risk, 24% reorganize, 12% grow with AI, 46% less immediate change**. Applies to 900+ occupations covering 99.7% of US employment.
- **Key insight**: Four-category classification (not binary) is becoming the industry standard. Our APO currently outputs a single score — we should add categorical classification.
- **Recommendation**: **Adopt** — Add four-category outcome classification to APO
- **Effort**: Low (<1 week)

### D8: Updated Gap Analysis — New Dimensions

Based on the last-30-days research, our Top 3 Web App Gap Analysis needs these additional dimensions:

| New Dimension | Our Rating (1-5) | Benchmark (1-5) | What's Needed | Priority | Effort |
|---|:---:|:---:|---|:---:|:---:|
| **Agentic AI Workflow Exposure** | 1 | 4 | ATE-style workflow coverage scoring, AIJRI rubric, Coface phase classification | Critical | High |
| **Observed vs Theoretical Exposure** | 1 | 4 | Anthropic Economic Index integration, real-world usage signals, adoption gap tracking | High | Very High |
| **CDR Three-Axis Decomposition** | 1 | 3 | Cognitive complexity, deployment difficulty, regulatory restriction scoring | High | High |
| **Task-Concentration Buffering** | 1 | 3 | Hampole et al. concentration signal as exposure buffer | Medium | Low |
| **Per-Skill Risk Scoring** | 2 | 4 | SAFI-style per-skill automation feasibility, Skilllich-style 1,028 skill ratings | High | Medium |
| **Career Simulator** | 1 | 4 | "What if I learn X?" scenario testing, risk score recalculation (Flux AI style) | High | Medium |
| **Professionalised vs Democratised Classification** | 1 | 3 | PwC two-track job classification, career ladder compression metrics | Medium | Low |
| **Four-Category Outcome Classification** | 2 | 4 | OpenAI-style automate/reorganize/grow/unchanged categories | Critical | Low |
| **Open Dataset Publication** | 1 | 4 | CC BY 4.0 per-occupation per-task scores (JobForesight model) | Medium | Low |
| **MCP Server / SDK** | 1 | 4 | Public MCP server, Python SDK, API adapters (Skilllich model) | Medium | Medium |
| **Skill Health Tracking** | 1 | 2 | AI-assisted vs self-work tracking, skill atrophy detection (SkillShield model) | Low | High |

### D9: Updated Priority Recommendations

Based on the new findings, the priority order shifts significantly:

| # | Recommendation | Source | Effort | New Priority |
|---|---|---|:---:|:---:|
| 1 | Four-category outcome classification (automate/reorganize/grow/unchanged) | OpenAI 2026 | Low | **P0** (was not in list) |
| 2 | SAFI calibration baseline (open-source multi-model benchmarks) | arXiv:2604.06906 | Low | **P0** (was not in list) |
| 3 | Task-concentration buffer (Hampole et al.) | AI Work Index V7 | Low | **P0** (was not in list) |
| 4 | Human Agency Scale (H1-H5) | arXiv:2506.06576 | Low | **P0** (was not in list) |
| 5 | Split conformal prediction | Academic SOTA | Medium | **P0** (unchanged) |
| 6 | SHAP feature attribution | Multiple papers | Medium | **P0** (unchanged) |
| 7 | TEAI/TRAI split (exposure vs replacement) | Colombo et al. 2025 | Medium | **P0** (unchanged) |
| 8 | ESCO API integration + ESCOX tool | EU Commission + SKILLAB | Medium | **P0** (unchanged) |
| 9 | Agentic Task Exposure (ATE) scoring | arXiv:2604.00186 | High | **P1** (new) |
| 10 | CDR three-axis decomposition | GWU 2026 | High | **P1** (new) |
| 11 | Tech-Risk Dual-Factor (business risk tolerance) | arXiv:2604.04464 | Medium | **P1** (new) |
| 12 | Career simulator ("what if I learn X?") | Flux AI | Medium | **P1** (new) |
| 13 | Per-skill risk scoring (SAFI + Skilllich) | arXiv:2604.06906 + PyPI | Medium | **P1** (new) |
| 14 | Professionalised vs democratised classification | PwC 2026 | Low | **P1** (new) |
| 15 | Weibull survival model for skill half-life | SkillMORTEX | Medium | **P1** (unchanged) |
| 16 | Semi-Markov career transition model | Multiple papers | Medium | **P1** (unchanged) |
| 17 | Bipartite graph occupation similarity | Boškoski et al. 2024 | Medium | **P1** (unchanged) |
| 18 | GCN on occupation-skill bipartite graph | AOC-GCN, LinkSAGE | High | **P1** (unchanged) |
| 19 | RL Exposure Index integration | arXiv:2605.02598 | Low | **P2** (new) |
| 20 | Open dataset publication (CC BY 4.0) | JobForesight model | Low | **P2** (new) |
| 21 | MCP server + Python SDK | Skilllich model | Medium | **P2** (new) |
| 22 | Ensemble stacking (XGBoost+LightGBM+CatBoost) | Multiple papers | High | **P2** (unchanged) |
| 23 | CAREER foundation model for trajectories | Vafa et al. 2024 | High | **P2** (unchanged) |
| 24 | Bias auditing pipeline (four-fifths rule) | EEOC, LL144 | High | **P2** (unchanged) |
| 25 | Observed AI usage validation (Anthropic Index) | Anthropic 2025 | Very High | **P3** (unchanged) |
| 26 | Skill health tracking (AI-assisted vs self-work) | SkillShield | High | **P3** (new) |

### D10: Key Strategic Insights from Last-30-Days Research

1. **Agentic AI is the biggest shift since GenAI launch**. Our task-level APO is now insufficient — we need workflow-level exposure scoring. The ATE framework provides the methodology.

2. **The capability-demand inversion is counterintuitive and important**. Skills most demanded in AI-exposed jobs are those LLMs perform *least* well at. This means our skill recommendations should prioritize "AI-resistant" skills that are in high demand but have low SAFI scores.

3. **78.7% of AI interactions are augmentation, not automation**. Our platform should emphasize augmentation opportunities, not just automation threats. The messaging should shift from "will your job be automated?" to "how can AI augment your work?"

4. **The labor-market moat is physical friction and liability, not cognitive complexity**. Our APO should decompose exposure into cognitive, deployment, and regulatory dimensions (CDR taxonomy) rather than a single score.

5. **10+ new competitors emerged in 2026**. Several have features we lack (career simulator, per-skill risk, open datasets, MCP integration). We need to move fast on differentiation through scientific rigor (CDR, conformal prediction, SHAP) and compliance (bias auditing, NIST AI RMF).

6. **Open datasets are becoming a competitive differentiator**. JobForesight publishes 334 occupations × 2,563 tasks under CC BY 4.0. We should consider publishing our APO scores as an open dataset for credibility and SEO.

7. **ESCO + LLM pipelines are production-ready**. SkiLLink, SkiLLens, ESCOX, and ESCOPlus 2.0 provide open-source tools for ESCO integration. We should adopt these rather than building from scratch.

8. **The career ladder is compressing**. AI-exposed junior roles demand 7x more senior skills. Our career roadmap generator should account for this compression.

9. **Observed exposure > theoretical exposure**. The Anthropic Economic Index + California AI-Unemployment Tracker represent the frontier of empirical validation. Our platform should eventually integrate observed-usage signals.

10. **Four-category classification is the new standard**. OpenAI's automate/reorganize/grow/unchanged framework is more actionable than a single risk score. We should adopt this immediately.
