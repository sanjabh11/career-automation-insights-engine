
Gap Analysis of the Career Automation Insights Engine Against Global State of the Art
Executive summary
Your current platform is already stronger than most public-facing career automation tools because it is not a single glossy score. It combines decomposition, uncertainty, market context, transition planning, resume analysis, and governance artifacts in one auditable stack. That is a real advantage. Based on the architecture you described, the platform already contains a production APO scorer, deterministic resistance scoring, simulation, embeddings, transition matching, calibration metrics, market intelligence, profile analysis, and NIST-oriented proof packs. 

The hard truth is that the scientific weakest links are not the obvious UI pieces; they are the core prediction assumptions. The biggest methodological gaps are: fixed hand-set category weights; occupation-level scoring that underweights within-occupation task heterogeneity; confidence intervals created from injected noise rather than empirical residuals or distribution-free uncertainty methods; weak linkage to realized adoption data; no demonstrated benchmark against simpler supervised baselines; and no formal protected-class bias auditing loop. Recent research is moving away from static occupation-level exposure scores toward task-level, workflow-level, adoption-aware, usage-informed, and human-agency-aware models. Static exposure scores are still useful, but mostly as priors or coarse screening tools, not as final user-facing career advice. 

The highest-return upgrades are not the most glamorous ones. Under your zero-cost infrastructure constraint, the best near-term moves are: learn the APO weights from data instead of fixing them; add post-hoc calibration using isotonic regression or temperature scaling; replace synthetic Monte Carlo confidence intervals with split-conformal intervals around calibrated scores; add occupation-cluster-specific models for software, legal, creative, administrative, healthcare, and field/manual roles; add SHAP-style deterministic feature attribution for the non-LLM layers; integrate a second taxonomy such as ESCO for international coverage; and build a fairness audit pipeline around adverse-impact, subgroup calibration, and error parity metrics. These changes are much more likely to improve trustworthiness and measured accuracy than adding another LLM prompt. 

My bottom-line judgment is this: the platform is promising and already differentiated, but it is not yet close to global top-three status on prediction science. The single biggest blocker is the absence of strong ground-truth outcome data and empirical validation loops that tie predictions to real adoption, transition, and labor-market outcomes. Without that, the system remains a sophisticated expert-heuristic product rather than a fully validated workforce intelligence platform. 

Overall verdict
The platform is good operational product engineering built on moderately strong first-generation automation science, but it is not yet using the best available 2025–2026 scientific mechanisms for high-stakes career prediction. Its strongest design choice is the hybridization of deterministic logic and LLM assistance; its weakest design choice is that the hybrid is still anchored by heuristics that appear hand-specified rather than statistically learned from a validated target. 
 

What has changed most since the early Frey/Osborne and even early GPT-exposure era is that the frontier now distinguishes at least four different things that older public tools collapse into one number: technical capability, actual adoption, workflow coverage, and preferred human agency. Eloundou et al. measured exposure to LLM capabilities; Microsoft’s Copilot analysis measured real work activities people actually bring to AI; Anthropic’s Economic Index measured observed use on real tasks; the WORKBank / Human Agency line of work adds worker preference over how much human control should remain in the task. Your APO score currently mixes some of these concepts implicitly, but it does not separate them explicitly. That is now a scientific gap, not just a feature gap. 

A publishable version of this system could exist, but a peer reviewer would almost certainly demand stronger answers to six questions: what is the target variable, where do the labels come from, how are weights learned, how does the model compare with simpler baselines, how are uncertainty intervals validated, and how are harms across protected groups measured and mitigated? NIST’s AI RMF is explicit that trustworthy AI requires validity, reliability, accountability, transparency, explainability, privacy enhancement, and fairness with harmful bias managed. Your platform is much stronger on auditability than on empirical validity. 

Scientific audit of the current stack
Core assessment
The right way to think about your current stack is that it has strong decomposition and governance, medium prediction science, and weak causal/outcome grounding. The table below audits the highest-value components against the current literature and disclosed operational systems.

Current component	SOTA verdict in 2025–2026	What does better than your current approach	Recommendation	Effort	Expected impact
APO weighted score	No longer best-in-class as a final score	Newer work separates capability, adoption, observed usage, workflow coverage, and human-agency preference rather than compressing them into one fixed-weight linear score. Exposure-only indices are now widely criticized as structurally limited for policy-facing use. 
Adapt, not replace. Keep APO as a transparent prior, but learn weights from validation data and decompose into sub-scores: capability, adoption likelihood, workflow coverage, and human-agency sensitivity.	Medium	High; likely the single biggest accuracy/trust upgrade
Fixed O*NET category weights	Scientifically weak	Recent task-based work suggests the importance of task structure and adoption conditions varies by occupation cluster and geography; a single weight vector is too rigid. 
Replace fixed global weights with occupation-cluster-specific learned weights or monotonic GBM/GAM layers constrained for interpretability.	Medium	High
Automation Resistance heuristic	Useful but incomplete	Tacit knowledge and human touch matter, but current literature adds workflow autonomy, data availability, error cost, regulatory burden, and desired human agency. 
Expand to a structured rubric with empirical anchors. Add regulatory intensity, end-to-end workflow closure, and liability/error cost.	Low	Medium-high
Monte Carlo CI from synthetic noise	Not scientifically honest enough for end-user risk intervals	Conformal prediction supplies distribution-free finite-sample coverage; modern calibration methods improve reliability more directly than ad hoc noise injection. 
Replace synthetic CI with split-conformal intervals on top of calibrated residuals.	Low-medium	High for user trust and compliance
ECE-only calibration diagnostics	Necessary but insufficient	Isotonic regression, temperature scaling, and modern multiclass calibration directly improve probabilistic outputs, rather than merely measuring miscalibration. 
Build a full calibration loop: holdout set, reliability diagrams, isotonic / temperature scaling, subgroup calibration checks.	Low	High
Career trajectory simulator	Reasonable first pass, but not SOTA	Markov and graph-based transition systems use real transition data, not only skill overlap plus Gaussian shocks; LinkedIn-grade systems learn from actual transition graphs. 
Add a transition matrix / Markov layer from observed occupation transitions when you can source behavioral data; until then, use historical BLS/O*NET plus inferred transition priors.	Medium-high	High
Skill half-life exponential decay	Over-simplified	Modern work forecasts changing skill demand from postings and taxonomies at monthly granularity; decay is not constant and often has structural breaks. 
Keep decay model, but update λ from external market signals and occupation-specific trend forecasts instead of static labels.	Medium	Medium-high
Embedding-based adjacency with cosine similarity	Fine baseline, not frontier	Graph-enhanced models and heterogeneous graph learning outperform pure local embedding similarity in job marketplaces. 
Upgrade from pairwise cosine to a skill–occupation graph with learned edge weights; defer full GNN until you have enough graph data.	Medium	Medium-high
Bridge-role finder with Jaccard + A*	Too coarse	Transition graphs, company/occupation embeddings, and heterogenous graph models capture asymmetric move probabilities and latent similarity better than set overlap. 
Replace Jaccard with a learned metric using text embeddings + structured features + transition priors; keep A* as the search layer.	Medium	High
LLM market intelligence summaries from job ad aggregates	Useful, but shallow without normalized real-time pipelines	NLx/JAAT-style pipelines extract occupation, task, tools, wages, and monthly state/industry signals from very large job-ad corpora; frontier systems normalize postings before analysis. 
Add a normalized posting-intelligence layer before LLM narrative generation.	Medium	High
Profile / resume LLM analysis	Reasonable for augmentation, risky for scoring without fairness controls	LLMs are good at coding unstructured job text and occupation extraction, but supervised extraction often still outperforms few-shot LLM extraction, and recruitment bias concerns are real. 
Keep LLM for parsing and narration, but add deterministic extraction, schema normalization, and fairness audits before user-facing scored judgments.	Medium	High
LLM-generated APO explanations	Okay, but vulnerable to post-hoc rationalization	SHAP-like additive attributions and deterministic decomposition produce stronger audit trails than narrative-only explanations. 
Separate the explanation stack into deterministic attribution first, LLM paraphrase second.	Low	Medium-high

Weakest scientific links
Your most risky proxy is the assumption that a weighted average over O*NET tasks, technologies, skills, abilities, and knowledge can stand in for automation risk across occupations without an explicit adoption model. The newer literature shows that exposure, adoption, and realized labor effects can diverge materially. Some occupations are technically exposed but only slowly adopted because of liability, regulation, workflow complexity, or worker preference for human control. Others see rapid AI absorption because the workflow is text-native and easily modularized. 

Your second-biggest risk is the uncertainty logic. If the interval is generated from a chosen noise schedule rather than from observed error distributions, it is not an honest measure of predictive uncertainty. In a high-trust product, users will interpret those intervals as statistical evidence, and a reviewer would likely object that the current CI system is epistemically ungrounded. Conformal prediction is a much stronger fit here because it is model-agnostic, computationally light, and produces coverage guarantees under clear assumptions. 

Your third-biggest risk is the lack of demonstrated head-to-head benchmarking against simpler models. In adjacent tasks such as skill extraction and occupation standardization, LLMs are competitive and flexible, but supervised models still often outperform in-domain few-shot prompting when labeled data exist. A reviewer would therefore ask whether a monotonic gradient-boosted model, ordinal regression, or graph model trained on expert assessments and external signals could beat your hybrid APO with better calibration. Right now, based on the materials provided, that seems untested. 

Occupation-specific gaps
The platform currently under-models occupation-specific automation mechanisms. For software engineering, the relevant unit is increasingly not “can code be generated?” but “how much of the end-to-end SDLC can agents complete with adequate review, test generation, and integration?” Recent industry-and-academia work treats software engineering as a workflow automation problem rather than a simple programming-skill problem. 

For law, the gap is different. LLMs can be strong at drafting and issue spotting, but weaker at specialized legal research and fact-precise reasoning, which means the risk profile is highly task-fragmented. Treating “law” as a high-knowledge, high-document occupation with one exposure score misses where the actual substitution boundary sits. 

For creative and design work, the mechanism is neither pure substitution nor pure protection. Recruiter experiments suggest AI skills help candidates in several occupations, but the effects are weaker for graphic designers than for office assistants and software engineers. That is consistent with a model where creativity-intensive work sees hybridization, style commoditization, and job redesign more than straightforward replacement. 

Demographic and fairness assessment
At present, your stack description does not show a formal bias-audit loop across protected classes. That is a serious gap for any platform influencing employment-related guidance. NIST explicitly treats harmful-bias management, explainability, accountability, and validity as core trustworthiness properties. Meanwhile, both litigation and the post-LL144 audit literature show that employment AI systems can fail in ways that are not visible from average accuracy alone. 

You also do not appear to account for differential adoption and differential harm by demographic group. Recent evidence finds persistent gender gaps in workplace GenAI adoption, especially in highly exposed occupations, and audits of recruiting-oriented LLM use show gendered and stereotyped outputs even when headline job suggestions look similar. That means an automation-risk system can become indirectly discriminatory even if it never explicitly uses protected attributes, because adoption opportunities, exposure, and model outputs can differ by subgroup. 

Global state of the art and what others are doing that you are not
The most important global shift is from taxonomy-only systems to behaviorally informed graph systems. LinkedIn’s disclosed work uses the Economic Graph, company-transition embeddings for salary inference, large heterogeneous job-marketplace graphs, and GNN/PLM hybrids deployed in online experiments. That is structurally different from your current platform, which reasons mainly from taxonomies and prompts. The implication is not that you need LinkedIn-scale infrastructure immediately; it is that the best operational systems learn from observed transitions, observed applications, observed salaries, and observed interaction graphs rather than from skills overlap alone. 

The second global shift is from survey-only occupational databases to near-real-time posting intelligence. The NLx/JAAT work shows that open job-ad corpora can be normalized into monthly occupation-state-industry features at massive scale, including tasks, tools, technologies, wages, and skills. Your system has market intelligence, but it is still closer to an LLM summary over coarse posting aggregates than to a normalized labor-market signal engine. That matters because skill demand, tool mentions, and workflow descriptors now move faster than O*NET revision cycles. 

The third shift is from theoretical exposure to observed use and human agency. Microsoft’s Copilot study, Anthropic’s Economic Index, and the WORKBank line of research all point in the same direction: what workers actually do with AI, how successfully AI does the work, and how much human involvement workers want are now measurable and decision-relevant. Your platform currently has an “automation resistance” concept, but not a human-agency preference model, and that is a now-important omission. 

The fourth shift is from single-model reasoning to model routing and hybrid extraction pipelines. In skill extraction and occupation coding, LLMs are excellent for zero-/few-shot standardization and coverage expansion, but domain-supervised extraction can still beat generic prompting. The operational lesson is that the best system is usually not “one frontier LLM everywhere,” but a pipeline that combines deterministic parsing, specialized labeling, embeddings, and only then LLM summarization. 

The fifth shift is toward formal governance artifacts that are machine-actionable, not only prose compliance statements. NIST AI RMF and the newer GenAI profile emphasize lifecycle governance, measurement, and risk management. Your proof packs are directionally good, but you can go further by turning decision boundaries, evidence cards, validation reports, subgroup performance, and model/version lineage into first-class machine-readable artifacts. 

What to incorporate for multifold improvement
Highest-leverage recommendations
The following are the highest-confidence upgrades, ordered by impact × feasibility, with an explicit recommendation under your cost constraints.

Technology or method	Who uses it	Paper citation	What it does better than your current approach	Implementation recommendation	Estimated effort	Expected impact
Post-hoc calibration loop with isotonic regression / temperature scaling	Standard ML practice; NIST-aligned trustworthy-AI workflows	Guo et al., 2017, On Calibration of Modern Neural Networks, arXiv:1706.04599. ROC-regularized isotonic regression: Berta et al., 2023, arXiv:2311.12436. 
Converts “measured ECE” into better-calibrated probabilities	Adopt now	Low	High; likely meaningful drop in ECE and better user trust
Split-conformal prediction intervals	Broad high-stakes ML; increasingly used for human-AI decision support	Campos et al., 2024, Conformal Prediction for NLP: A Survey, arXiv:2405.01976; Cresswell et al., 2024, arXiv:2401.13744. 
Honest coverage beats synthetic noise-based CI	Adopt now	Low-medium	High
Learned APO model with monotonic constraints	Common in risk models and tabular ML	Supported by the broader shift away from static exposure scores toward dynamic, benchmarked, task-aware systems. 
Learns weights from evidence instead of defending hand-tuned constants	Adopt	Medium	Very high
Observed-usage / adoption layer	Anthropic Economic Index; Microsoft Copilot applicability work	Appel et al., 2025, Anthropic Economic Index report, arXiv:2511.15080; Tomlinson et al., 2025, Working with AI, arXiv:2507.07935. 
Distinguishes what AI can do from what workers actually use it for	Adopt in stages	Medium	Very high
Human Agency Scale / worker preference layer	WORKBank / Brynjolfsson–Yang line	Shao et al., 2025, Future of Work with AI Agents, arXiv:2506.06576. 
Prevents over-automating tasks users actually want to retain human control over	Adopt	Medium	High
Deterministic feature attribution with SHAP	Industry-standard XAI for tabular models	Lundberg & Lee, 2017, A Unified Approach to Interpreting Model Predictions, arXiv:1705.07874. 
Stronger auditability than LLM-only narrative explanation	Adopt now	Low	Medium-high
Normalized real-time job posting pipeline	LinkedIn/NLx-class workforce analytics systems	Meisenbacher et al., 2025, Extracting ONET Features from the NLx Corpus*, arXiv:2510.01470. 
Improves freshness, local demand signals, and skill trend detection	Adopt if you can source data cheaply	Medium	High
Occupation–skill graph with learned transition priors	LinkedIn Economic Graph / job marketplace research	Chen et al., 2018, LinkedIn Salary, arXiv:1806.09063; Liu et al., 2024, LinkSAGE, arXiv:2402.13430; Zhu et al., 2024, PLM4Job, arXiv:2408.04381. 
Stronger career-path and bridge-role recommendations	Adapt later	Medium-high	High
ESCO integration alongside O*NET	EU labor market infrastructure; multilingual labor analytics	ESCO is the European Commission’s multilingual occupation/skills framework; current skill-extraction research increasingly aligns to ESCO. 
International coverage and better crosswalks beyond U.S.-centric SOC/O*NET	Adopt	Medium	High
Formal fairness auditing for employment-related outputs	Required by trustworthy-AI and emerging employment-AI regimes	NIST AI RMF 1.0 DOI 10.6028/NIST.AI.100-1; LL144 empirical analyses; EEOC litigation posture in Mobley v. Workday. 
Moves from “non-discrimination intent” to measurable subgroup risk control	Adopt now	Medium	Very high
Counterfactual recourse explanations	Modern XAI / recourse systems	Jiang et al., 2024, Robust Counterfactual Explanations: A Survey, arXiv:2402.01928. 
Tells users what to change to alter pathway recommendations instead of only explaining why	Adopt after calibrated model exists	Medium	Medium-high
Federated learning for profile analysis	Privacy-sensitive multi-party ML	Collins & Wang, 2025, survey; Jimenez-Gutierrez et al., 2025, security/privacy survey. 
Reduces centralized data retention needs	Watch / skip for now	High	Low under current scale

Direct answers to your architecture questions
A single-LLM approach should not be the only core inference engine. The right architecture is a hybrid ensemble, but not necessarily a multi-frontier-model voting system on day one. Under your cost ceiling, the best near-term design is: deterministic extractors + a small supervised tabular/graph model for scoring + one LLM for standardization and narrative generation. That gives you better calibration, easier ablations, lower cost, and cleaner auditability than running multiple LLMs for the score itself. 

You should add a fine-tuned classifier or structured tabular model alongside the LLM if you can get enough labels. A monotonic gradient boosting model or interpretable GAM trained on expert assessments, external task labels, and market features is more likely to improve the APO than adding prompt complexity. Under zero cost, XGBoost/LightGBM/CatBoost plus SHAP is the practical answer. 

You should integrate ESCO alongside O*NET. O*NET is U.S.-centric and strong for rich job-analysis descriptors, but international career products need EU-compatible occupational and skill taxonomies. ESCO also aligns well with current multilingual skill-extraction research. 

You should not prioritize a full GNN immediately unless you can obtain meaningful graph data beyond taxonomy edges. GNNs shine on actual interaction or transition graphs, and LinkedIn’s results are compelling precisely because it has those graphs. Without them, a lighter graph-regularized embedding + learned edge weights is the better first step. 

You should build a formal calibration loop immediately and replace Monte Carlo CI with conformal intervals. This is one of the best low-effort upgrades available. 

You should integrate real-time posting intelligence, but the paid commercial APIs are not the only path. If Lightcast or LinkedIn data are unavailable, the open NLx/JAAT direction is the most scientifically aligned substitute. 

You should add causal inference, but not as the primary user-facing score. It belongs in research and policy layers to separate correlation from labor-market effect estimation; it is overkill for the front-end score until you have richer observational or quasi-experimental data. Natural-experiment and DiD work on GenAI shows why this matters, but also how data-hungry it is. 

You should replace Jaccard similarity for bridge roles with a learned metric and later a transition matrix. Yes to a Markov chain layer, but after improving your transition representation and calibration. 

You should add SHAP and formal bias auditing across protected classes. Both are now table stakes for an auditable employment-adjacent AI product. 

Recommended target architecture
O*NET + ESCO + BLS + Posting Signals

Deterministic Extraction Layer

Structured Feature Store

Calibrated APO Base Model

Transition Graph and Skill Graph

Split-Conformal Uncertainty

Career Path and Bridge Role Engine

SHAP and Deterministic Attributions

Risk Scorecard

LLM Narrative Layer

Bias Audit and Governance Artifacts



Show code
This architecture preserves your current explainability strengths while moving the predictive core toward learned, calibrated, and auditable components. It is also compatible with NIST AI RMF’s lifecycle-oriented notion of govern-map-measure-manage. 

Top-three web app benchmark assessment
For the benchmark ceiling, I am using a composite of LinkedIn Economic Graph-class graph modeling, NLx/JAAT-class real-time public labor-market normalization, and frontier exposure/adoption measurement work from Microsoft and Anthropic. That is a better evidence-backed benchmark than pretending that proprietary vendor internals are fully public. 

Dimension	Our Current Rating	Top 3 Benchmark Rating	What’s Needed to Reach 5	Priority	Effort
Prediction Accuracy	2.5	5	Learn APO from labels; benchmark against supervised baselines; external validation; occupation-cluster models; real adoption data	Critical	High
Model Sophistication	2	5	Add calibrated base learner, conformal prediction, adoption layer, human-agency layer, transition matrix; defer full GNN until data justify it	High	Medium–High
Data Coverage & Freshness	2.5	5	Add normalized real-time posting pipeline, ESCO crosswalks, more geography, more non-U.S. occupation mappings	Critical	Medium
Explainability & XAI	3.5	5	Add SHAP, deterministic scorecards, counterfactual recourse, uncertainty decomposition, subgroup reliability reports	High	Medium
Career Transition Intelligence	3	5	Replace Jaccard with learned transition priors and Markov chain logic; incorporate observed transition data	High	Medium–High
Skill Analytics	3	5	Move from static embedding adjacency to dynamic skill graph + demand forecasting + occupation-specific decay	High	Medium
Personalization	2.5	5	Add user-history features, collaborative filtering, path preference learning, behavioral feedback loops	Medium	High
Market Intelligence	2.5	5	Normalize postings, forecast demand, salary modeling, location skill premiums, industry-specific signals	Critical	Medium
Fairness & Bias Auditing	1.5	5	Subgroup error rates, calibration by group, adverse-impact testing, recourse audits, documentation and ongoing monitoring	Critical	Medium
UI/UX & Accessibility	3	5	WCAG 2.2 AA audits, comparison views, confidence communication, interactive transition maps, simpler uncertainty UX	Medium	Medium
API & Integration Ecosystem	2	5	Public API, webhooks, taxonomic crosswalk endpoints, bulk export, employer / workforce-board integrations	Medium	Medium–High
Compliance & Governance	4	5	You are strong already; add machine-readable validation artifacts and fairness reports	High	Low–Medium
Scalability & Performance	3	5	Better precomputation, model caching, smaller scoring models, async pipelines, queueing	Medium	Medium
Community & Social Proof	1	5	External experts, validation studies, citations, workforce-board pilots, academic partnerships	High	High
Monetization & Sustainability	2	5	Enterprise analytics, API plans, premium career reports, institutional data partnerships	Medium	Medium–High

The three dimensions with the highest compound effect are Prediction Accuracy, Data Coverage & Freshness, and Fairness & Bias Auditing. Improving those three would materially lift trust, user retention, enterprise viability, and defensibility at the same time. The table-stakes dimensions for any credible top-three platform are Prediction Accuracy, Data Coverage & Freshness, Explainability & XAI, Fairness & Bias Auditing, and Compliance & Governance. Your current differentiators are the integrated end-to-end career stack, deterministic decomposition, and governance-oriented proof packs. The single biggest blocker is still the same: insufficient validated ground truth and longitudinal outcome data. 

Roadmap and implementation priorities
Because I only have your architecture description rather than the repository tree, the mapping below is module-level rather than exact file-by-file. The parts that clearly exist in your stack are the APO scorer, calibration functions, bridge-role logic, profile/resume pipelines, prompts, prompt schemas, telemetry, and market intelligence modules. 

Phase zero
The fast wins are all on the measurement layer. Add a held-out validation set around the current APO; fit isotonic and temperature-scaled variants; compare ECE, Brier-style error, MAE, and subgroup calibration; and then wrap the calibrated outputs with split-conformal intervals. In parallel, add deterministic score contribution accounting and SHAP for every non-LLM predictor that feeds the user-facing score. These changes are cheap, auditable, and likely to improve both trust and measured reliability quickly. 

Likely code areas: APO scoring function, calibration module, explanation module, experiment configs, validation metrics persistence, UI risk card components. 

Phase one
Replace fixed APO weights with a learned but interpretable scorer. The practical option is a monotonic boosted model or GAM trained on expert labels and external features, with your current weighted APO retained as a backup prior or feature. Also replace bridge-role Jaccard with a learned similarity model using occupation text embeddings, structured overlap features, and transition priors. Then add ESCO crosswalks and a normalized feature store for occupation–skill taxonomy mapping. 

Likely code areas: APO calculator, automation resistance module, skill adjacency module, bridge-role finder, database schema for taxonomy crosswalks, scoring telemetry. 

Phase two
Build a market-data pipeline that stores normalized job-posting signals by month, geography, industry, occupation, skill, tool, and wage band. Use those signals to update skill half-life dynamically, improve local market intelligence, and support transition forecasting. At the same stage, add subgroup fairness reporting and bias-audit dashboards across resume/profile analyses and recommendation outputs. 

Likely code areas: market intelligence analyzer, heatmap generator, half-life estimator, profile analysis pipeline, resume analysis pipeline, governance proofs and dashboards. 

Phase three
Only after the earlier phases should you chase research-grade capabilities: human-agency preference elicitation, adoption-aware scoring, inferred or observed transition matrices, graph learning, causal inference modules, and institution-facing workforce analytics. If you reach this stage, partnerships matter more than prompt engineering. The best candidates are public workforce agencies, universities, labor economists, or job-posting data partners. 

Open questions and limitations
Some comparisons the user requested are only partially answerable from public evidence because major commercial systems do not fully disclose their internal production methods. I can compare you confidently to the parts of global SOTA that are public: LinkedIn’s graph-based job-marketplace research, NLx/JAAT-style real-time labor-market extraction, Microsoft and Anthropic task-/usage-based AI applicability work, NIST governance guidance, and the post-2024 literature on calibration, conformal uncertainty, fairness auditing, and skill extraction. Where proprietary vendors such as Lightcast, Indeed, and Glassdoor do not publish enough detail, I have benchmarked functional capability rather than speculating about hidden architectures. 

I also cannot do a true file-level codebase mapping because I was given an architecture description, not the repository tree or source files. The roadmap is therefore exact at the system-design level but only approximate at the file-path level. 

