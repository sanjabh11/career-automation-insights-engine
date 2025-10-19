# Product Requirements Document (PRD)
## Automation Potential Opportunity (APO) Dashboard For Professionals

### 1. Product Overview
**Product Name:** APO Dashboard For Professionals  
**Version:** 2.0  
**Target Audience:** Career professionals, HR managers, workforce planners, researchers  

### 2. Core Objectives
- Provide AI-powered automation potential analysis for occupations
- Enable data-driven career planning and workforce development decisions
- Deliver actionable insights on job security and future employment trends
- Support comparative analysis across different occupations
- Help workers understand and prepare for AI's impact on their careers

### 3. Key Features

#### 3.1 Search & Discovery
- **Occupation Search:** Real-time search with O*NET database integration
- **Advanced Filtering:** Filter by occupation codes and categories
- **Search History:** Track and revisit previous searches
- **Rate Limiting:** 20 searches per hour per user

#### 3.2 AI-Powered Analysis
- **APO Calculation:** Comprehensive automation potential scoring (0-100%)
- **Category Breakdown:** Analysis across tasks, knowledge, skills, abilities, technologies
- **Confidence Levels:** High/Medium/Low confidence ratings
- **Timeline Predictions:** Short-term (1-3 years), Medium-term (3-7 years), Long-term (7+ years)

#### 3.3 Data Management
- **Save Analyses:** Persistent storage of occupation analyses
- **Export Capabilities:** CSV and PDF export functionality
- **Comparison Tools:** Side-by-side occupation comparisons
- **Tagging System:** Organize analyses with custom tags

#### 3.4 User Experience
- **Responsive Design:** Mobile-first, responsive across all devices
- **Real-time Updates:** Live data synchronization
- **Accessibility:** WCAG 2.1 AA compliance
- **Performance:** < 3s page load times

#### 3.5 Security & Privacy
- **Authentication:** Supabase-based secure authentication
- **Data Encryption:** End-to-end encryption for sensitive data
- **Rate Limiting:** API abuse prevention
- **Input Sanitization:** XSS and injection attack prevention

#### 3.6 AI Impact Career Planner
- **Task Automation Assessment:** Analyze which tasks might be automated, augmented, or remain human-only
- **Personalized Task Analysis:** Input specific tasks to get automation potential assessment
- **Skill Recommendations:** Get personalized skill development recommendations to stay relevant
- **Learning Resources:** Access curated resources for upskilling
- **Progress Tracking:** Track skill development progress

### 4. Technical Requirements

#### 4.1 Frontend Stack
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Animations:** Framer Motion for micro-interactions
- **State Management:** TanStack React Query
- **Routing:** React Router DOM

#### 4.2 Backend Integration
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **APIs:** 
  - O*NET Web Services
  - Google Gemini 2.5 Pro
  - SerpAPI
- **Functions:** Supabase Edge Functions

#### 4.3 Security Features
- **CSP Headers:** Content Security Policy implementation
- **XSS Protection:** Input sanitization and validation
- **Rate Limiting:** User and IP-based throttling
- **Secure Headers:** X-Frame-Options, X-Content-Type-Options

### 5. User Workflows

#### 5.1 Primary User Journey
1. User signs in or browses as guest
2. Search for occupation using keywords or codes
3. Select occupation for AI analysis
4. Review comprehensive APO breakdown
5. Save analysis or add to comparison
6. Export results or share insights

#### 5.2 AI Impact Career Planner Workflow
1. User selects their occupation
2. System analyzes tasks and categorizes them (Automate/Augment/Human-only)
3. User can input specific tasks for personalized assessment
4. System recommends skills to develop based on analysis
5. User accesses learning resources and tracks progress

#### 5.3 Secondary Workflows
- **Bulk Analysis:** Compare multiple occupations
- **Historical Tracking:** Monitor changes over time
- **Team Collaboration:** Share analyses with colleagues
- **Data Export:** Generate reports for stakeholders

### 6. Performance Metrics

#### 6.1 User Engagement
- **Daily Active Users:** Target 1000+ DAU
- **Session Duration:** Average 15+ minutes
- **Search Completion Rate:** 85%+
- **Export Usage:** 40% of analyses exported

#### 6.2 Technical Performance
- **Page Load Time:** < 3 seconds
- **API Response Time:** < 2 seconds
- **Uptime:** 99.9% availability
- **Error Rate:** < 0.1%

### 7. Compliance & Security

#### 7.1 Data Protection
- **GDPR Compliance:** EU data protection standards
- **Data Retention:** User-controlled data lifecycle
- **Privacy Controls:** Granular privacy settings
- **Audit Logging:** Comprehensive activity tracking

#### 7.2 Security Standards
- **OWASP Top 10:** Complete vulnerability coverage
- **Input Validation:** Comprehensive sanitization
- **Secure Communication:** HTTPS/TLS encryption
- **Access Controls:** Role-based permissions

### 8. Database Schema

#### Core Tables
- **profiles:** User profiles and subscription information
- **saved_analyses:** Stored occupation analyses with metadata
- **shared_analyses:** Sharing configuration and access controls
- **search_history:** User search tracking and analytics
- **user_settings:** User preferences and configurations
- **notifications:** User notification system
- **analytics_events:** Usage tracking and metrics

#### AI Impact Career Planner Tables
- **ai_task_assessments:** Task automation assessments
- **ai_skill_recommendations:** Recommended skills for occupations
- **ai_reskilling_resources:** Learning resources for skill development

#### Relationships
```
profiles (1) --- (*) saved_analyses
profiles (1) --- (*) search_history
profiles (1) --- (1) user_settings
saved_analyses (1) --- (*) shared_analyses
profiles (1) --- (*) ai_task_assessments
occupation_code (*) --- (*) ai_skill_recommendations
skill_area (*) --- (*) ai_reskilling_resources
```

### 9. API Integrations

#### 9.1 O*NET Web Services
- **Purpose:** Occupation data and metadata
- **Endpoints:**
  - `/search`: Find occupations by keyword
  - `/occupations/{code}/details`: Get detailed occupation information
- **Rate Limits:** 1000 requests per day

#### 9.2 Google Gemini 2.5 Pro
- **Purpose:** AI-powered analysis and recommendations
- **Capabilities:**
  - APO calculation and confidence scoring
  - Task automation assessment
  - Skill recommendations
  - Learning resource suggestions
- **Rate Limits:** Based on API quota

#### 9.3 SerpAPI
- **Purpose:** Job market data and learning resources
- **Endpoints:**
  - Google Jobs search for market data
  - Google search for learning resources
- **Rate Limits:** Based on subscription tier

### 10. Supabase Edge Functions

#### 10.1 onet-proxy
- **Purpose:** Proxy requests to O*NET Web Services
- **Inputs:** Search parameters, occupation codes
- **Outputs:** Occupation data, task information

#### 10.2 calculate-apo
- **Purpose:** Calculate automation potential for occupations
- **Inputs:** Occupation data
- **Outputs:** APO scores, category breakdowns, confidence levels

#### 10.3 analyze-occupation-tasks
- **Purpose:** Analyze tasks for automation potential
- **Inputs:** Occupation code, title
- **Outputs:** Tasks categorized as Automate/Augment/Human-only

#### 10.4 assess-task
- **Purpose:** Analyze user-input tasks
- **Inputs:** Task description, occupation context
- **Outputs:** Category, explanation, confidence score

#### 10.5 skill-recommendations
- **Purpose:** Generate skill recommendations
- **Inputs:** Occupation code, title
- **Outputs:** Recommended skills with explanations and priorities

#### 10.6 serpapi-jobs
- **Purpose:** Fetch job market data
- **Inputs:** Job title, location
- **Outputs:** Job listings, salary data, demand metrics

### 11. User Stories

#### Core APO Dashboard
1. As a worker, I want to select my occupation from a list so that I can see how AI might affect my job.
2. As a worker, I want to see a detailed breakdown of automation potential across different aspects of my job.
3. As a career advisor, I want to compare multiple occupations side-by-side to help my clients make informed decisions.
4. As a researcher, I want to export data for further analysis in other tools.
5. As a user, I want to save my analyses for future reference.

#### AI Impact Career Planner
1. As a worker, I want to see which tasks in my occupation are likely to be automated so that I can prepare accordingly.
2. As a worker, I want to know which tasks will still require human involvement so that I can focus on those areas.
3. As a worker, I want recommendations on skills to develop to stay relevant in my field.
4. As a worker, I want to input specific tasks I perform and get an assessment of their automation potential.
5. As a worker, I want access to reskilling resources to learn new skills.

### 12. Future Roadmap

#### 12.1 Phase 2 Features
- **Industry Trends:** Sector-wide automation insights
- **Skill Recommendations:** Personalized upskilling suggestions
- **Market Integration:** Job posting and salary data
- **Advanced Analytics:** Predictive modeling

#### 12.2 Phase 3 Enhancements
- **Mobile App:** Native iOS/Android applications
- **API Marketplace:** Third-party integrations
- **Enterprise Features:** Multi-tenant architecture
- **AI Model Training:** Custom automation models

### 13. Success Criteria
- **User Adoption:** 10,000+ registered users in first quarter
- **Analysis Accuracy:** 90%+ user satisfaction with AI insights
- **Performance:** Sub-3-second load times maintained
- **Security:** Zero critical vulnerabilities
- **Business Impact:** Measurable career planning improvements

### 14. Risk Assessment

#### 14.1 Technical Risks
- **API Dependencies:** O*NET service availability
- **AI Model Changes:** Google Gemini API modifications
- **Scalability:** Database performance under load
- **Security Threats:** Evolving attack vectors

#### 14.2 Mitigation Strategies
- **Redundancy:** Multiple data source fallbacks
- **Monitoring:** Comprehensive system health checks
- **Backup Systems:** Automated data recovery
- **Security Updates:** Regular vulnerability assessments

### 15. Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase       │    │   External APIs │
│   (React/Vite)  │◄──►│   Backend        │◄──►│   (O*NET, AI)   │
│                 │    │                  │    │                 │
│   - Static Site │    │   - PostgreSQL   │    │   - Google AI   │
│   - CDN Hosted  │    │   - Auth         │    │   - SerpAPI     │
│   - Auto-scale  │    │   - Edge Funcs   │    │   - O*NET API   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 16. LLM System Prompts

#### Task Assessment Prompt
```
You are an AI assistant assessing task automation potential. Based on the task description, classify it as:
1. Automate (repetitive, low-value, stressful tasks that can be fully automated)
2. Augment (tasks that benefit from AI assistance but need human oversight)
3. Human-only (tasks requiring creativity, interpersonal skills, or domain expertise)

Provide a brief explanation and a confidence score (0-1).

Task description: [task description]

Output format: 
{
  "category": "Automate/Augment/Human-only",
  "explanation": "Brief explanation of why this task falls into this category",
  "confidence": 0.85
}
```

#### Skill Recommendations Prompt
```
You are a career advisor specializing in AI's impact on jobs. Based on the occupation, recommend 5 key skills that workers should develop to stay relevant as AI transforms their field.

For each skill:
1. Provide a specific, actionable skill name (not general categories)
2. Explain why this skill is important for future-proofing this career
3. Assign a priority level (1=highest, 3=lowest)

Focus on skills that:
- Complement AI capabilities rather than compete with them
- Emphasize uniquely human abilities (creativity, empathy, complex judgment)
- Have transferability across roles and industries
- Are in growing demand based on job market trends

Output format:
[
  {
    "skill_name": "Specific skill name",
    "explanation": "Detailed explanation of why this skill matters",
    "priority": 1
  }
]
```

---

**Document Version:** 2.1  
**Last Updated:** 2025-10-19  
**Next Review:** 2025-11-19  
**Owner:** Product Team  
**Stakeholders:** Engineering, Design, Security, Business

---

## 17. Implementation Update (2025-09-19)

### Delivered in this milestone
- Local-first guest experience with unified hooks for saved analyses and search history
- Real-data-only course search (no fabricated ratings/prices); optional curated fallbacks via env flag
- O*NET HTTP Basic auth only; removed API key fallback where present
- Env-driven Gemini model across Edge Functions
- APO security hardening: routed client calls through Netlify `apo-proxy` (server-side `x-api-key`)
- Exports: CSV and print-friendly HTML (Export PDF)
- Compare page (`/compare`) to view two saved analyses side-by-side
- Premium hero section on home (full-width image, glassmorphism, serif headings, fade-in on scroll)

### Developer quickstart
1) Install & run
```
npm install
npm run dev
```
2) Environment (local)
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
ONET_USERNAME=...
ONET_PASSWORD=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
COURSE_SEARCH_ALLOW_FALLBACKS=false
```
3) Netlify Dev
```
netlify dev
```

### Evidence Artifacts (Oct 16, 2025)
Added comprehensive documentation and evidence artifacts:
- **Validation & Methods**: Ablations report, calibration methods, signals methods, baselines CSV sample
- **Quality & Accessibility**: WCAG AA statement, quality checklist
- **Responsible AI**: Model cards (APO, Task), data sheets (O*NET, Telemetry), security artifacts (Threat model, Pen-test, RLS proofs)
- **Operations**: Drift runbook with PSI monitoring procedures
- **Resources**: Veterans transition summary PDF

All artifacts accessible via UI pages: `/validation/methods`, `/quality`, `/responsible-ai`, `/operations`, `/veterans`.
CSV export added to Crosswalk results and Veterans matches.

### Browse & Discovery Features (Oct 19, 2025)

#### Implemented
- **STEM Browse** (`/browse/stem`): 102 STEM occupations with drill-down
- **Career Clusters** (`/industry`): 16 clusters with occupation drill-down
- **Job Zones** (`/browse/job-zones`): 5 zones with occupation drill-down
- **Bright Outlook** (`/browse/bright-outlook`): 41 high-growth occupations
- **Hot Technologies** (`/tech-skills`): 40 trending technologies with occupation mapping

#### Edge Functions
- `search-occupations`: Advanced search with STEM/Bright Outlook/Cluster/Zone filters
- `browse-career-clusters`: List clusters + drill-down to occupations
- `browse-job-zones`: List zones + drill-down to occupations
- `hot-technologies`: List trending tech + related occupations

#### Data Seeding
- Job Zones: 5 zones seeded with descriptions
- Hot Technologies: 40 technologies seeded with categories and trending scores
- Career Clusters: 16 clusters from O*NET taxonomy
- Enrichment: 109 occupations tagged with cluster_id, job_zone, bright_outlook

#### Status Indicators
- All browse pages show "🟢 From Database" badge
- Pass/fail badges for data sync status
- Total counts visible on all pages

### Pending (post-deploy follow-ups)
- E2E CoS test for APO (PBI-0001-16)
- Durable rate limiting backend (see design doc PBI-0001-32)
- Lighthouse CI / a11y checks (see checklist PBI-0001-31)
- Advanced filters beyond Max Results
- Optional: true PDF generation (server-side) in addition to print-friendly HTML
- LLM prompt library and versioning system
- RAG-based grounding for occupation analysis