# Deep Research Prompt V2 — Automation Insights Revenue Activation

**Version:** 2.0  
**Date:** February 9, 2026  
**Purpose:** Replace the original research query that produced `DEEP_RESEARCH_GTM_STRATEGY.md`  
**When to use:** Feed this entire prompt to a Deep Research-capable model (Gemini Deep Research, Perplexity Pro, ChatGPT Deep Research, or Claude with extended thinking). Include the CODEBASE CAPABILITY MAP below as grounding context.

---

## THE PROMPT (Copy everything below this line)

---

You are now activating **"Deep Research Mode"** — an advanced reasoning system for producing exceptionally thorough, alpha-grade insights that surpass human solo research. You will treat this query as a high-stakes consulting engagement for a bootstrapped SaaS founder.

### FOLLOW THIS PROTOCOL EXACTLY:

---

### 1. CONTEXT IMMERSION (Most Critical — Read Carefully)

**Who is the final reader?**  
A solo technical founder who has already built a production-ready AI-powered career analytics platform (the "Automation Insights" app) with 20+ working AI features, 45+ Supabase Edge Functions, Stripe billing, and $0 current revenue. The founder can code but has no sales team, no marketing budget beyond $5K, and needs to generate revenue within 30 days.

**How will the output be used?**  
- **Direct execution** — every recommendation must be actionable within 1-7 days by a single person
- **Channel-specific scripts** — actual messages/emails/posts the founder can send today
- **Pricing validation** — with real competitor pricing data from 2025-2026
- **Customer identification** — specific companies, communities, and individuals to target

**Constraints:**  
- Budget: $0-$5K marketing spend  
- Timeline: First paying customer in 14 days, $5K MRR in 60 days, $10K MRR in 90 days  
- Risk tolerance: Medium — will give free trials, won't rebuild product, won't do lifetime deals  
- Team: Solo founder (technical) — no enterprise sales capability  
- Tech stack: React + Vite + Supabase + Stripe + Netlify  

**What the app ACTUALLY does (verified working features — not roadmap):**

| # | Capability | How It Works | Monetization Angle |
|---|-----------|-------------|-------------------|
| 1 | **APO Score** — Automation Probability of Obsolescence scoring | Gemini AI analyzes O*NET 29.3 task/skill/ability data. 768-dim embeddings. Zod-validated. Rate-limited. | Core free-tier hook → upgrade for unlimited |
| 2 | **Resume Automation Risk Analyzer** | Upload resume → AI detects automation-prone phrases → strategic rewrites | Viral acquisition tool (1 free scan, share score) |
| 3 | **White-Label Counselor Reports** | Coaches enter occupation → get branded PDF with risk score, bridge roles, reskilling paths | $149/mo subscription or $20/report PAYG |
| 4 | **Bridge Role Pathfinding** | A* algorithm on O*NET skill graph finds realistic career transitions | Premium feature |
| 5 | **Skill Adjacency Graph** | pgvector + Gemini embeddings visualize skill similarity | Premium feature |
| 6 | **Career Trajectory Simulator** | Monte Carlo simulation for transition probability | Premium feature |
| 7 | **AI Career Coach** | Conversational Gemini AI with career context | Free-tier hook |
| 8 | **Market Intelligence** | SerpAPI job data + AI analysis of labor market | Premium feature |
| 9 | **Learning Path Generator** | Personalized reskilling roadmaps | Premium feature |
| 10 | **Enterprise Team Dashboard** | CSV import → org-level workforce automation risk audit | Enterprise upsell ($10K-$50K) |
| 11 | **Veterans MOC→Civilian Crosswalk** | Military occupation code translation + APO scoring | Government/nonprofit niche |
| 12 | **SEO Landing Pages** | 50+ `/automation-risk/:occupation` pages with Schema.org JSON-LD | Organic traffic acquisition |
| 13 | **Workshop Booking System** | Enterprise training event scheduling with tiered pricing | Services revenue |
| 14 | **Bootcamp Dashboard** | Cohort-based career transition program management | Education institution sales |

**Current pricing (live in code):**  
- **Explorer (Free):** 3 APO checks/mo, 1 resume scan, basic features  
- **Defender ($29/mo):** 30 APO checks, 10 resume scans, bridge roles, AI coach  
- **Coach Pro ($149/mo):** 15 white-label reports, unlimited APO, client management  

**What's already been done (don't re-recommend these):**  
- ✅ Stripe checkout flow built (Edge Functions: create-checkout-session, create-portal-session, stripe-webhook)
- ✅ PostHog analytics installed with 15 funnel events  
- ✅ Resume Analyzer allows 1 free scan without auth + social share CTA  
- ✅ ForCoachesPage has ROI calculator, data authority badges, How It Works, demo CTA  
- ✅ SEO pages have internal linking, Related Occupations, strong CTAs  
- ✅ Welcome email Edge Function (Resend)  
- ✅ Checkout success onboarding banner  
- ✅ Sitemap (64 URLs), robots.txt, OG tags, Schema.org JSON-LD  

**Explicitly restate the refined context before proceeding.**

---

### 2. HYPOTHESIS & SCOPE DEFINITION

Form **5-7 testable hypotheses** based on this query. Examples to seed your thinking (refine or replace):

- **H1:** Career coaches who currently use manual research or generic AI tools will pay $149/mo for white-label automation risk reports because it saves them 2+ hours per client and adds a $150+ billable deliverable.
- **H2:** The `/automation-risk/:occupation` SEO pages can capture organic traffic from the 100K+ monthly searches for "will AI replace [job]" queries, converting at 2-5% to free signups.
- **H3:** The Resume Analyzer, positioned as an "AI-Proof Score," can achieve viral distribution on LinkedIn/Reddit because professionals are anxious about AI displacement and love shareable score badges.
- **H4:** Veterans transition programs (government-funded) represent a high-value niche ($5K-$25K contracts) because the MOC→civilian crosswalk + APO scoring is a unique capability no competitor offers.
- **H5:** Enterprise workforce automation audits ($10K-$50K engagements) can be sold to HR consulting firms and L&D departments using the Enterprise Team Dashboard as the delivery platform.
- **H6:** The $29/mo Defender tier can be sold to individual professionals through content marketing ("Is your career AI-proof?") on LinkedIn, targeting mid-career professionals in high-risk occupations.
- **H7:** Partnering with coding bootcamps and career transition programs (using the Bootcamp Dashboard) can create B2B2C distribution that avoids direct customer acquisition costs.

**Define success criteria:** Research is complete when each hypothesis has been validated/invalidated with ≥3 independent data points and a clear action plan exists for the top 5 validated opportunities.

**Identify potential biases:**  
- Builder's bias: Overvaluing features that were hard to build vs. features customers actually want  
- Survivorship bias: Looking only at successful competitors, not failed ones  
- Anchoring: Being anchored to current $29/$149 pricing without testing higher/lower  

---

### 3. SOURCE HIERARCHY & CONTROL

**Tier 1 (Prioritize — 2025-2026 data only):**  
- Bureau of Labor Statistics 2025 reports on AI displacement  
- World Economic Forum "Future of Jobs 2025" report  
- ICF Global Coaching Study 2023/2024 (coaching industry market size)  
- Gartner/McKinsey/BCG reports on workforce automation  
- Stripe Atlas/ProfitWell SaaS benchmarking data  
- Competitor pricing pages: Jobscan, Teal, VMock, Rezi, Kickresume, PathwayU, Burning Glass  
- O*NET OnLine traffic data (SimilarWeb/SEMrush if available)  
- LinkedIn job posting data for "career coach" and "L&D" roles  

**Tier 2 (Expert Practitioners):**  
- Career coaching certification body forums (ICF, NCDA, CDI)  
- Reddit r/careerguidance, r/jobs, r/cscareerquestions (search for "AI replacing my job")  
- LinkedIn posts by career coaches about their tools/tech stack  
- IndieHackers/X posts by SaaS founders selling to coaches  
- Product Hunt launches of career/AI tools in 2024-2025  

**Tier 3 (Community Sentiment):**  
- Twitter/X conversations about AI job displacement anxiety  
- Hacker News threads on automation risk  
- YouTube comments on "Will AI take my job" videos  
- Glassdoor/Indeed forums on career transition  

**Actively seek contrarian/unusual sources:**  
- Failed career tech startups (postmortems, why they failed)  
- Career coaches who explicitly reject AI tools (understand objections)  
- HR departments that STOPPED using automation risk tools (why?)  
- Countries outside US where O*NET-equivalent data exists (international expansion?)  

---

### 4. PHASED EXECUTION (5 Iterative Stages)

**Phase A: Landscape Mapping**  
- Map ALL competitors offering automation risk scoring, AI career coaching, or white-label career reports  
- For each: pricing, features, traffic (SimilarWeb), customer reviews, funding status  
- Identify the "white space" this app uniquely occupies  
- Map the buyer journey for each customer segment (career coach, individual professional, enterprise HR, veteran)  

**Phase B: Depth Diving**  
- Test each hypothesis against real data  
- Find the actual monthly search volume for "will AI replace [job]" queries (top 20 occupations)  
- Find the actual pricing career coaches charge for "career assessments" or "future-proofing audits"  
- Find real examples of career coaches using AI tools in their practice  
- Calculate customer acquisition cost (CAC) for each channel (SEO, LinkedIn outreach, Reddit, partnerships)  

**Phase C: Multi-Perspective Analysis**  
- **Career Coach perspective:** "Why would I pay $149/mo when I can use ChatGPT for free?"  
- **Individual professional perspective:** "Why pay $29/mo when I can check once and be done?"  
- **Enterprise HR perspective:** "Why buy this vs. McKinsey/Gartner workforce reports?"  
- **Veteran perspective:** "Does the government already provide this through the VA?"  
- **Counterargument for each** and how to overcome it  

**Phase D: Pattern Synthesis**  
- Identify emerging 2025-2026 trends that create tailwinds for this product  
- Map the intersection of trends (e.g., AI displacement anxiety + coaching industry growth + remote work)  
- Identify "category creation" opportunity: Is "Career Automation Insurance" a viable framing?  
- Identify partnership multipliers (one partnership that could 10x distribution)  

**Phase E: Refinement & Stress-Test**  
- Stress-test the top 5 opportunities with "What if this fails?" scenarios  
- Define leading indicators for each opportunity (measurable within 7 days)  
- Create a "kill criteria" for each — at what point do you stop investing time?  
- Model the unit economics for each opportunity at $5K, $10K, and $25K MRR  

---

### 5. OUTPUT ENGINEERING (Mandatory Structure)

Deliver the output in this EXACT structure:

**Section 1: Executive Summary (1 page)**  
- Top 5 opportunities ranked by (speed-to-revenue × probability × revenue ceiling)  
- The single most important thing to do in the next 48 hours  
- Key insight that changes the founder's mental model  

**Section 2: Competitive Landscape Matrix**  
- Table: Competitor | Pricing | Features overlap | Traffic | Weakness we exploit  
- For each competitor: what they do better AND what they can't do that we can  

**Section 3: Validated Hypotheses**  
- For each H1-H7: Validated/Invalidated/Partially Validated  
- Evidence trail with specific sources and quotes  
- Revised probability estimate  

**Section 4: Top 5 Revenue Plays (Detailed)**  
For each play:  
- **Target customer** (with specific persona: name, title, company type, pain point)  
- **Acquisition channel** (specific, not "social media")  
- **Conversion mechanism** (exact funnel steps)  
- **Pricing & packaging** (validated against competitor data)  
- **Outreach scripts** (actual copy-pasteable messages for LinkedIn DM, email, Reddit post)  
- **Week-by-week execution timeline** (Days 1-7, 8-14, 15-30, 31-60, 61-90)  
- **Revenue model** (conservative / base / optimistic MRR)  
- **Leading indicators** (metrics to track in week 1)  
- **Kill criteria** (when to pivot away)  

**Section 5: Content Marketing Playbook**  
- 10 specific blog post titles optimized for SEO + the search intent they target  
- 5 LinkedIn post templates with hooks  
- 3 Reddit thread ideas (which subreddits, what angle)  
- 1 viral campaign concept for the Resume Analyzer  

**Section 6: Partnership Plays**  
- 5 specific organizations/companies to approach  
- For each: contact strategy, value proposition, partnership structure  

**Section 7: Risks & Counterpoints**  
- Top 5 risks to the business model  
- Mitigation strategy for each  
- "What kills this company" scenario analysis  

**Section 8: Confidence Scoring**  
- For each recommendation: HIGH / MEDIUM / LOW confidence  
- Confidence rationale (what would change your confidence?)  

**Section 9: 90-Day Calendar**  
- Week-by-week action items with specific deliverables  
- Revenue milestones  
- Decision points ("If X hasn't happened by Day 30, pivot to Y")  

---

### RESEARCH QUERY

> **"Given 'Automation Insights' — a production-ready AI career analytics platform with 20 working AI features (APO scoring, resume analyzer, white-label coach reports, bridge role pathfinding, enterprise workforce audits, veterans crosswalk), 3-tier Stripe pricing (Free/$29/$149), 50+ SEO pages, and full analytics — what are the 5 highest-probability revenue plays that a solo bootstrapped founder can execute in 90 days to reach $10K MRR, specifically identifying: (1) the exact customer segments to target first, (2) the specific acquisition channels with lowest CAC, (3) the pricing adjustments (if any) validated by 2025-2026 competitor data, (4) the partnership multipliers that avoid direct customer acquisition, and (5) the content/viral mechanics that compound over time?"**

---

## WHAT THIS PROMPT IMPROVES OVER V1

| Aspect | V1 (Original) | V2 (This Prompt) |
|--------|--------------|-------------------|
| **Codebase grounding** | Listed 20 capabilities generically | Includes monetization angle for each capability + what's already been done |
| **Hypotheses** | None — open-ended query | 7 specific testable hypotheses with built-in bias checks |
| **Source hierarchy** | None | 3-tier source prioritization with contrarian sources required |
| **Output structure** | Free-form | 9 mandatory sections with specific sub-deliverables |
| **Competitor analysis** | General landscape | Requires specific pricing, traffic, and weakness exploitation |
| **Actionability** | "Top 5 opportunities" | Requires copy-pasteable outreach scripts, week-by-week calendar, kill criteria |
| **Failure planning** | None | Kill criteria, stress tests, "what kills this company" scenario |
| **Content marketing** | Mentioned but not deliverable | 10 blog titles, 5 LinkedIn templates, 3 Reddit threads, 1 viral campaign |
| **Partnership plays** | None | 5 specific organizations with contact strategy |

---

## DO I NEED TO REDO EXISTING RESEARCH?

**Short answer: No. Supplement, don't replace.**

The existing `DEEP_RESEARCH_GTM_STRATEGY.md` is still valid for:
- ✅ Codebase capability audit (accurate)
- ✅ Top 5 revenue opportunity ranking (directionally correct)
- ✅ Pricing validation ($29/$149 confirmed)
- ✅ Distribution channel recommendations (Stripe direct > LinkedIn > Whop)
- ✅ Outreach script templates (usable)
- ✅ 90-day execution calendar (reasonable)

**What V2 research would ADD that V1 lacks:**
- ❌ Competitor pricing/traffic matrix with real data
- ❌ SEO keyword volume data for "will AI replace [job]" queries
- ❌ Validated customer personas with real pain point quotes
- ❌ Content marketing playbook (blog titles, LinkedIn templates)
- ❌ Partnership plays with specific organizations
- ❌ Failure scenarios and kill criteria
- ❌ International market assessment
- ❌ Career coaching industry pricing benchmarks (what coaches charge clients)

**Recommendation:** Run V2 prompt as a SUPPLEMENTARY research round. Merge findings into a V2 GTM strategy document. Don't discard V1 — use it as a baseline that V2 builds upon.
