Based on established research (e.g., Frey & Osborne, 2013; OECD adaptations; and subsequent studies using ONET), here's a step-by-step breakdown of how APO is typically calculated. This can be algorithmic (rule-based) or AI-augmented (using LLMs like Gemini for dynamic, contextual scoring). In your dashboard's context, it starts with ONET data and incorporates Gen-AI-specific factors like NLP capabilities or emerging tech impacts.Step-by-Step Calculation MethodologyData Ingestion from O*NET:Fetch occupation details via O*NET Web Services or APIs, including:Tasks: Core activities (e.g., "Inspect building systems" for Energy Auditors).
Knowledge, Skills, Abilities (KSAs): Rated by importance/value (e.g., "Mathematics" with value 75).
Technologies/Tools: Associated software/equipment.
Work Context: Factors like routineness, physical demands, or interpersonal interaction.

Example: For "Energy Auditors" (O*NET-SOC Code: 47-4011.01), pull tasks like "Calculate potential for energy savings" and rate them.

Task-Level Scoring (Granular Automation Assessment):Evaluate each task/item against "automation bottlenecks" from Frey & Osborne (2013):Perception and Manipulation: Tasks requiring fine motor skills or sensory input (low automation if complex, e.g., inspecting physical systems).
Creative Intelligence: Novel problem-solving (low automation, e.g., recommending innovative energy solutions).
Social Intelligence: Human interaction (low automation, e.g., client consultations).

Assign scores (0-100%) based on factors:Routineness: High if repetitive (e.g., data entry = high APO).
Cognitive vs. Manual: Cognitive routine tasks (e.g., calculations) are more automatable with Gen-AI.
Importance/Frequency/Skill Level: Weighted (e.g., importance: 0.3, frequency: 0.2, skill level: 0.3, technology used: 0.2).
Gen-AI Specifics: Adjust for current AI capabilities (e.g., +20% if NLP/image gen applies).

Formula for individual APO (adapted from your PRD and research like OECD/Arntz et al.):

APO_item = (importance_weight * normalized_importance) + (frequency_weight * getFrequencyScore(frequency)) + (skill_weight * normalized_skill_level) + (tech_weight * getTechAdoptionScore(technology)) * 100

Normalization: Scale values (e.g., O*NET importance 1-100 → 0-1).
Example: For "Calculate potential for energy savings" (importance: 75/100 = 0.75, frequency: high → 0.8, skill level: 4/5 = 0.8, tech: AI tools available → 0.7).APO = (0.30.75) + (0.20.8) + (0.30.8) + (0.20.7) * 100 ≈ 76.5%.

Category-Level Aggregation:Average APO across items in each category (Tasks, Knowledge, Skills, Abilities, Technologies).Example: Tasks APO = Average of all task APOs (e.g., 46.79% as in your sample for Energy Auditors).

Use dynamic weights if occupation-specific (e.g., tech-heavy jobs weight technologies higher), per advanced studies (e.g., network analysis in journals like Sage).

Overall Occupation APO:Weighted average of category APOs (often equal 20% each, but adjustable for context like industry or region).Formula: Overall APO = (Tasks_APO + Knowledge_APO + Skills_APO + Abilities_APO + Technologies_APO) / 5.
Example: 49.51% for Energy Auditors in your sample.

Enhancements from research:Timeline Projections: Short-term (0-5 years: current tech), medium (5-10: emerging AI), long (10+: speculative).
Confidence Intervals: Based on data variability (e.g., 45-55% range for uncertain tasks).
Contextual Adjustments: +/- factors for industry (e.g., +10% in manufacturing), region (e.g., slower adoption in rural areas), or economics (ROI of automation).

AI-Enhanced Refinements (Using LLMs like Gemini):For "perfect" calculation, integrate LLMs to handle nuances:Semantic analysis of task descriptions.
Incorporation of real-time trends (e.g., via integrated searches).
Cross-validation with historical data (e.g., past automation patterns).

Output: Not just a score, but explanations, recommendations, and visualizations (e.g., radar charts for dimensions).

This methodology builds on Frey & Osborne's probabilistic model (70% of US jobs at risk) but refines it task-by-task (OECD: only 9-14% fully automatable). Studies like those in ILO or SciELO adapt it for regions (e.g., 58% risk in Brazil). In your app, it's LLM-driven for personalization, with fallbacks to static formulas.Recommended System Prompt for Gemini 2.5 ProTo enable Gemini 2.5 Pro (an advanced multimodal LLM as of 2025) to calculate APO "perfectly," the system prompt should be detailed, structured, and research-aligned. It needs to guide the model to:Use O*NET data as input.
Apply a consistent, weighted methodology.
Incorporate bottlenecks and Gen-AI specifics.
Output in JSON for easy integration.
Handle edge cases (e.g., ambiguous tasks) with clarifications or confidence scores.

Here's a optimized system prompt, adapted from your PRD's "enhanced_apo_analysis" and refined with elements from Frey & Osborne/OECD methodologies for accuracy:

You are an expert AI automation analyst specializing in workforce transformation, using a research-driven methodology based on Frey & Osborne (2013), OECD task-based approaches, and O*NET data. Your task is to calculate the Automation Potential Overview (APO) for an occupation, providing a nuanced, contextual score (0-100%) that reflects Gen-AI impacts.

Role Guidelines:
- Analyze at task/item level first, then aggregate to categories (Tasks, Knowledge, Skills, Abilities, Technologies), and finally to overall APO.
- Consider automation bottlenecks: perception/manipulation (high if physical/sensory), creative intelligence (low if novel/innovative), social intelligence (low if interpersonal/emotional).
- Factor in Gen-AI specifics: High automation for routine cognitive tasks (e.g., data analysis via NLP/models), low for human-centric (e.g., empathy-driven roles).
- Use dynamic weights: Adjust based on occupation type (e.g., tech-heavy: 30% on Technologies).
- Incorporate timelines: Immediate (0-2 years), Short-term (2-5), Medium (5-10), Long-term (10+).
- Provide confidence scores (low/medium/high) based on data completeness and variability.
- Output explanations, recommendations, and adaptation strategies.
- If input is ambiguous, ask clarifying questions.

Input Format: JSON with occupation details (code, title, tasks: [{description, importance (1-100), frequency (low/medium/high), skill_level (1-5), technology_used}], knowledge/skills/abilities/technologies: similar arrays).

Calculation Steps:
1. For each item (task/skill/etc.): Score APO = (0.3 * normalized_importance) + (0.2 * frequency_score: low=0.3/medium=0.6/high=0.9) + (0.3 * (1 - normalized_skill_level: higher skill = lower automatable)) + (0.2 * tech_adoption_score: 0-1 based on AI readiness) * 100.
   - Adjust for bottlenecks: -20% if creative/social, +15% if routine/cognitive.
   - Gen-AI boost: +10-30% if matches capabilities (e.g., calculation = +25%).
2. Category APO: Average of item APOs, weighted by importance.
3. Overall APO: Average of category APOs, adjusted for context (e.g., +5% for high-tech industry).
4. Timelines: Scale scores progressively (e.g., short-term = base + emerging_tech_factor).

Output Format: Strict JSON only.
{
  "overall_apo": float (0-100),
  "confidence": "low/medium/high",
  "category_apos": {
    "tasks": {"apo": float, "items": [{"description": str, "apo": float, "explanation": str}]},
    "knowledge": {...}, "skills": {...}, "abilities": {...}, "technologies": {...}
  },
  "timeline_projections": {
    "immediate": float, "short_term": float, "medium_term": float, "long_term": float,
    "explanation": str
  },
  "key_factors": {
    "bottlenecks": [str], "gen_ai_impacts": [str], "adaptation_strategies": [str]
  },
  "recommendations": [str],
  "clarifications_needed": [str] (if any)
}
Ensure calculations are defensible, evidence-based, and unbiased. Prioritize accuracy over speculation.

This prompt ensures "perfect" calculation by enforcing structure, weights, and research integration

