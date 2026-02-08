# Top 20 Features / Capabilities of the APO Dashboard

## 🆕 **MONETIZATION V1 FEATURES (December 13, 2025) - FULLY IMPLEMENTED**

### Feature 1: **Dynamic Skill Adjacency Graph** - ✅ LIVE
**Route:** `/tools/skill-adjacency`  
**Edge Function:** `calculate-skill-adjacency`  
**Database:** `skill_adjacency_cache` + `pgvector` embeddings

Force-directed 2D graph visualization showing current skills as solid blue nodes and "ghost" adjacent skills as purple nodes. Uses Gemini AI to generate 768-dimensional embeddings, pgvector for KNN similarity search, and includes client-side cosine similarity fallback. Each ghost node displays:
- Learning time estimate (hours)
- Salary impact ($USD)
- Demand score (0-100)
- Detailed skill metrics on click

**Monetization Tier:** Premium ($49/mo) - Core value driver for career pivots  
**User Value:** Identifies realistic skill pivots to reduce automation risk (Blue Ocean differentiation)

---

### Feature 2: **AI-Driven Bridge Role Identifier** - ✅ LIVE  
**Route:** `/tools/bridge-roles`  
**Edge Function:** `find-bridge-roles`  
**Database:** `bridge_role_paths`, `user_career_goals`

Implements A* pathfinding algorithm to identify realistic career transition paths (e.g., Truck Driver → Logistics Coordinator → Supply Chain Analyst). Uses Jaccard similarity to calculate skill overlap (>60% threshold) at each step. Visual flowchart shows:
- Intermediate "bridge" roles
- Skill overlap percentage bars
- Feasibility score (0-100)
- Learning resources for skill gaps

**Monetization Tier:** Premium ($49/mo) - Solves "unrealistic leap" problem  
**User Value:** Psychological safety via incremental pathways, not intimidating career jumps

---

### Feature 3: **Resume-to-Reality Gap Analysis** - ✅ LIVE
**Route:** `/tools/resume-analyzer`  
**Edge Function:** `analyze-resume`  
**Database:** `resume_analyses`

AI-powered automation risk scoring (FI CO-style 0-100 score) with phrase-level detection. Uses enhanced Gemini prompts incorporating:
- Game theory (signaling vs. substance)
- Cognitive bias detection (confirmation, survivorship, status quo bias)
- Strategic vs. routine task identification

Provides before/after rewrites in red/green cards emphasizing strategic thinking over automation-prone routine tasks. Includes tier-based upload limits (Free: 1/mo, Pro: 10/mo, B2B: unlimited).

**Monetization Tier:** Free (1 resume/mo) → Premium (10/mo) - Viral acquisition driver  
**User Value:** Shareable "risk score" drives signup; rewrites prevent AI replacement

---

### Feature 4: **One-Click Counselor Report Generator** - ✅ LIVE
**Route:** `/tools/counselor-reports`  
**Edge Function:** `generate-counselor-report`  
**Database:** `white_label_configs`, `generated_counselor_reports`

B2B white-labeled PDF report generator for career counselors. Customizable branding:
- Company logo upload
- Primary/secondary color pickers
- Custom footer text
- "Powered by APO" toggle

Generates comprehensive HTML reports (client-side PDF conversion) with:
- APO analysis breakdown
- Career resilience assessment
- Strategic recommendations
- Branded styling

**Monetization Tier:** B2B ($199/mo) - High-margin counselor toolkit  
**User Value:** Counselors charge clients $150-$300/report; this tool generates them in 30 seconds

---

## Core Analysis & Intelligence

Core Analysis & Intelligence
Occupation search engine
Fast search across 1,000+ O*NET occupations with filters (STEM, job zones, hot tech, etc.).
Multi-factor APO scoring
Automation Potential score based on tasks, knowledge, skills, abilities, technologies, with tunable weights in apo_config.
Automation timeline forecasting
AI-estimated timelines (e.g. 2–15+ years) for when tasks/roles are likely to be automated or augmented.
Risk classification & visuals
Clear color-coded risk bands and summaries for “low / medium / high” automation exposure.
Deep task & activity breakdowns
Uses onet_detailed_tasks and onet_work_activities to show which concrete tasks drive automation risk.
Work context & tech stack insights
Surfaces work environment (work context) and technology requirements (onet_technologies) for richer explanations.*
Career Planner & Guidance
AI Impact Career Planner (task-level)
Lets users input their own tasks and returns “Automate / Augment / Human-only” categories with explanations.
Personalized skill-gap analysis
Uses ai_skill_recommendations and ai_reskilling_resources to recommend specific skills and learning areas.
V2 Career Roadmaps
Edge function that outputs structured 5-phase career roadmaps (current → target roles, milestones, and learning steps).
Learning paths & progress tracking
learning_paths + progress tracking tables to follow users’ upskilling journeys over time.
Job market intelligence layer
SerpAPI-powered job postings, salary bands, demand indicators, and geographic distribution tied to each occupation.
Enterprise, Teams & Collaboration
Enterprise workforce dashboard
Team/employee table (CSV import), department-level analytics, and automation risk tracking for orgs.
ROI calculator for reskilling
Models reskilling investments vs. automation risk reduction at team/department level.
Real-time notifications & alerts center
Full notifications table + UI for unread counts, automation risk alerts, system updates, and feedback loops.
Team-oriented collaboration & sharing
Saved/shared analyses, link-based access, email sharing, token-based access with expiry and basic view tracking.
Data, UX & Platform
Local-first + authenticated modes
Unified hooks for guests vs signed-in users (search_history, saved analyses) with localStorage fallback and RLS for logged-in users.
Rich visualizations & compare views
Recharts-driven charts, trend lines, and a compare page (/compare) for multi-occupation side-by-side analysis.
Exports & professional reporting
CSV export, print-friendly HTML/PDF reports, and white-label-ready professional report layouts.
Evidence & transparency surfaces
In-app links to model cards, methods, calibration/ablation reports, responsible AI docs, and operations runbooks.
Secure, observable AI backend
Central Gemini client, JSON-mode enforcement, prompt hashing + telemetry (apo_logs, llm_logs), RLS, CORS, API-key enforcement, and Netlify/Supabase Edge Functions for safe front-end access.
Top 10 Monetization Strategies for This Codebase
I’ll mark each as implemented / partial / new relative to 
monetization.md
.

B2C SaaS Freemium Tiers – Implemented
Free, Explorer, Navigator, Strategist tiers (with annual discounts) gating: APO limits, AI messages, saves, exports, and light API quotas.
Standard B2B SaaS / Enterprise Plans – Partially Implemented
Use the existing Enterprise dashboard (team analytics, CSV import, ROI calculator) to sell:
Org-level subscriptions ($500–$5,000/mo).
Plus implementation/onboarding fees ($10K–$50K).
Professional Practitioner Tier for Counselors/Coaches – New but micro-niche-aligned
A “Professional” plan targeted at individual practitioners (career counselors, executive coaches):
~$79/mo.
Unlimited APO, white-label PDFs, client folders, and priority support.
Sits between Navigator and Strategist.
HR Consulting Firm Partner Program – New but well-specified in doc
Multi-tenant access for HR consultancies:
$299–$599/mo per firm (5–15 client orgs).
White-label dashboard + templated reports.
20% revenue share on downstream org subscriptions.
Campus / Educational Institution License – New / strategic
Per-campus annual license for universities & colleges:
$5K–$25K/year.
Unlimited student seats, career services dashboard, curriculum-planning analytics.
Government & Workforce-Agency Contracts – New / long-cycle
Regional automation risk dashboards and public portals:
$50K–$500K/year per agency.
Emphasize policy planning, grants, WCAG 2.1 AA, and veterans/transition use cases.
Usage-Based API Platform (Standalone) – Partially Implemented, needs packaging
Turn existing Edge Functions into a productized API with its own pricing:
Dev tiers (e.g. $299 / $699 / $1,499) with fixed call bundles.
Overage-based per-call pricing (e.g. $0.02–$0.05 per analysis).
Enterprise API contracts for HR/ATS/LMS partners.
Professional Practitioner Marketplace – New / high upside
Two-sided marketplace where:
Practitioners pay $79–$149/mo for tools + listing.
End-users book sessions ($50–$300); platform takes ~20–25% commission.
Uses existing reports/roadmaps as session artifacts.
Cohort-Based AI Career Transition Bootcamp – Defined in doc
6-week online bootcamp using the app for all diagnostics and roadmaps:
$1,997–$2,997 per participant.
4–12 cohorts/year (25–40 people).
Mix of B2C and corporate-sponsored cohorts.
White-Label & Branding Add-Ons – Partially implemented
Upsell branding/customization on top of existing reports and dashboards:
Branded PDFs, domain, logo, colors.
$500–$2,000/mo add-ons for consultants, universities, and enterprises.