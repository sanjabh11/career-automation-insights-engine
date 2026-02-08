Key O*NET Data Your APO Dashboard Does Not Yet Surface
Your PRD already covers automation-risk scoring, task analysis and skill recommendations, but ONET exposes a far broader lattice of occupational metadata and exploratory tooling. Below is a point-by-point “gap list” showing what ONET offers and where the current APO spec has no parallel.
1. Discovery & Classification Dimensions You’re MissingBright Outlook flags: Rapid Growth, Numerous Job Openings, New & Emerging signals that let users spot “hot” roles at a glance.Job Zone scale (1 – 5): Standardized education/experience tiers that career advisors lean on for pathway planning.STEM taxonomy: Managerial, R&D, Technician and Sales cuts of STEM roles.Career Clusters (16 national clusters): K-12 and workforce-development standard used by schools and state agencies.Industry filters (NAICS-aligned): Lets users restrict analyses to roles concentrated in specific sectors.
Why it matters: Without these dimensions, users cannot slice automation risk by education level, growth outlook, sector or STEM relevance—insights HR teams expect.
2. Deep Occupational Descriptors Absent From Your Model
O*NET Descriptor Families (browse menu)
Typical Fields
How They Add Value to APO
Abilities, Skills (basic & cross-functional), Knowledge
Numeric importance/level scales
Tie automation risk to specific human strengths; enrich skill-gap logic
Work Activities & Context
Task frequencies, physical/social context
Explain why tasks are automatable or resilient
Work Styles & Values
Personality, work motivation measures
Drives personalized reskilling guidance
Interests (RIASEC)
Holland codes
Powers career change recommendations


3. Task-Level Assets Not Yet Exposed19 000+ Task Statements (occupation-specific)2 000+ Detailed Work Activities (cross-job verbs)
O*NET’s “Job Duties” and “Related Activities” searches let users find similar roles by overlapping tasks—functionality missing in the APO UX.
4. Technology & Soft-Skill TaxonomiesHot Technology list: Employer-signalled software tools (updated quarterly).Soft Skills Builder: 34 foundational “employability” skills with self-assessment.
Integrating these lists would let your AI skill recommender cite concrete tools (e.g., “Power BI”) and behavioural skills (e.g., “Active Listening”) rather than high-level labels.
5. Crosswalk Tables Absent From Database Schema
Crosswalk
Example Use
Military MOC ⇄ O*NET
Veteran reskilling, DoD workforce planning
CIP (education programs) ⇄ O*NET
Aligns degrees/certificates to automation risk
SOC 2018, DOT, RAPIDS, ESCO
Regulatory, apprenticeship and EU mapping


Your schema lacks these join tables, making it hard to pull education- or military-centric insights.
6. Career Exploration Tools Not in ScopeInterest Profiler (My Next Move): Self-assessment feeding occupation matches.Desk Aid, OnLine Help: Embedded guidance that lowers learning curve.Spanish site (Mi Próximo Paso): Bilingual reach.
These support engagement and accessibility KPIs you list (1000 DAU, WCAG 2.1 AA).
7. Licensing, Data-File & Web-Service Details
O*NET’s Resource Center exposes:Bulk data ZIPs (relational TXT/CVS + XML)Public web-service endpoints with versioning and quotasCC-BY licensing terms
Your PRD mentions an “onet-proxy” Edge Function but not file-based ingest or license attribution—required for compliance and offline analytics.
8. Metrics & Flags Useful for Risk WeightingEmployment & wage quartiles (from BLS integration)Green Economy & Apprenticeship flagsWorkforce Demand indicators (job-posting rates, where licensed)
These numbers can sharpen your APO confidence and timeline models.
9. Missing UI/UX Patterns
O*NET offers:Occupational keyword auto-complete with five quick suggestionsCollapsible left-hand explanatory panels for every search tool (mirrors your “Verse Explanation” layout but for careers)Rate-limited “Go” buttons guarding each form
Replicating these micro-interactions will move you toward the < 3 s load-time and 85 % search completion goals.
Closing Gap ActionsExtend your Supabase schema to store O*NET descriptors, crosswalk codes and growth flags.Ingest HOT technologies & soft-skill lists for richer AI recommendations.Expose Job Zone, Bright Outlook, STEM and Career Cluster filters in the React search UI.Implement task-similarity search using O*NET task IDs to boost comparison features.Honor CC-BY licence in exports and on-screen attributions.
Bridging these gaps will align APO’s analytic depth and discovery breadth with the authoritative O*NET dataset—meeting your objective of “data-driven career planning and workforce development decisions.”
O*NET Capability Missing in APOIntegration Idea for Your DashboardRepresentative User StoriesWage & Employment StatisticsMerge BLS wage percentiles and state-level outlooks with existing APO scores; display “Risk vs. Reward” scatter plots.- As a data analyst, I want to see pay ranges alongside automation risk so I can weigh career moves.<br>- As an HR planner, I want regional demand numbers to justify reskilling budgets. Job Zone (education/experience tiers)Tag every occupation with its Job Zone; add filter and highlight low-prep pivot roles.- As a frontline worker, I need to know how much schooling a safer job requires.<br>- As a career coach, I want to filter for “Zone 2 or below” when advising clients. Bright Outlook FlagsOverlay “Rapid Growth / Numerous Openings / New & Emerging” badges; rank roles by “growth × low risk”.- As a student, I want to target high-growth roles with low automation threat.<br>- As a policymaker, I need exportable lists of Bright-Outlook jobs for grant programs. Career Clusters (16 national clusters)Enable cluster filters; auto-generate skill plans aligned to K-12 curricula.- As a high-school counselor, I want cluster-aligned reports to guide course selection.<br>- As a workforce board member, I need cluster roll-ups for regional planning. Crosswalk Tables (MOC, CIP, SOC, RAPIDS, ESCO, DOT)Store crosswalk IDs; build lookup wizard so veterans or students see instant APO results.- As a veteran, I want to enter my MOS code and view civilian automation risk.<br>- As a training provider, I need to map my CIP program to threatened occupations. Descriptor Families (Abilities, Work Styles, Values, Context)Feed descriptors into Gemini prompts to compute “personal fit” scores next to APO.- As a job-seeker, I wish to match my strengths to roles that AI can’t easily automate.<br>- As an L&D lead, I need to identify soft-skill gaps in our workforce. Tools & Technology (T2) TaxonomyList top software/hardware per occupation; link to vendor courses.- As a technician, I want to know which CAD tools are hottest in my field.<br>- As a training manager, I need to budget licenses for the most referenced tools. Soft-Skill BuilderImport 34 employability skills; let users self-rate and weight APO results.- As a career changer, I want to benchmark my soft skills against target roles.<br>- As an employer, I need dashboards on team-wide soft-skill gaps. Interest Profiler (RIASEC) & Similar-Occupation GraphEmbed profiler or replicate via API; suggest low-risk, high-fit pivots.- As an undecided student, I want a quick quiz to surface fitting, safe careers.<br>- As a recruiter, I need “adjacent talent” suggestions for hard-to-fill roles. Green Economy & Apprenticeship FlagsTag roles with sustainability or apprenticeship indicators; add “Green & Earn-while-you-learn” filter.- As a job-seeker, I want to find eco-friendly careers with apprenticeship paths.<br>- As a grant writer, I need lists of green occupations to support funding proposa