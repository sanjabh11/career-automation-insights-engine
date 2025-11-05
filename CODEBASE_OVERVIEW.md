# Career Automation Insights Engine - Comprehensive Codebase Overview

## Executive Summary

The **Career Automation Insights Engine (APO Dashboard)** is a production-ready web application that leverages AI to analyze career automation potential. Built with React 18, TypeScript, Supabase, and Google Gemini 2.5, it provides professionals, HR managers, and career counselors with data-driven insights about AI's impact on different occupations.

**Current Status:** Production-ready with 22 active database migrations, 19+ Supabase Edge Functions, and comprehensive UI/UX implementation (Oct 2025).

---

## 1. TECHNOLOGY STACK & ARCHITECTURE

### Frontend Stack
- **Framework:** React 18.3.1 with TypeScript 5.5
- **Build Tool:** Vite 5.4 (with React SWC plugin)
- **Styling:** Tailwind CSS 3.4 + shadcn/ui components
- **UI Components:** 40+ Radix UI primitives (buttons, dialogs, selects, etc.)
- **State Management:** TanStack React Query v5.56 (server state)
- **Routing:** React Router DOM v6.26
- **Charts:** Recharts v2.15 (interactive data visualization)
- **Animations:** Framer Motion v12.18
- **Forms:** React Hook Form v7.53 + Zod v3.23 validation
- **Notifications:** Sonner v1.5 (toast system)
- **Icons:** Lucide React v0.462

### Backend Architecture
- **Database:** Supabase PostgreSQL (managed)
- **Authentication:** Supabase Auth (email/password)
- **Serverless Functions:** 19+ Supabase Edge Functions (Deno-based)
- **Real-time:** Supabase Realtime subscriptions
- **Row Level Security (RLS):** Implemented across all user-facing tables
- **API Key Protection:** Custom header-based validation

### External APIs
1. **O*NET Web Services**
   - Occupation data, skills, abilities, tasks
   - Authentication: Username/password
   - Rate limits: 1000 requests/day

2. **Google Gemini AI**
   - Models: gemini-2.5-flash, gemini-2.0-flash-exp
   - Used for: APO calculations, task analysis, recommendations
   - JSON-mode responses enforced

3. **SerpAPI**
   - Job market data and search results
   - Used for: Job listings, salary ranges, market demand

4. **Bureau of Labor Statistics (BLS)**
   - Employment trends and projections
   - Public API: https://api.bls.gov/publicAPI/v2/

### Deployment
- **Hosting:** Netlify (auto-deploy from git)
- **Build Command:** `npm run build` → Vite produces optimized dist/
- **Functions:** Netlify Functions directory (currently unused, using Supabase only)
- **Build Time:** ~4-5 minutes
- **Node Version:** 18+ required

---

## 2. DATABASE SCHEMA & DATA MODELS

### Core Tables

#### **profiles** (User Management)
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE (references auth.users),
  full_name TEXT,
  occupation_code TEXT,
  current_occupation_title TEXT,
  career_goals TEXT,
  subscription_tier TEXT ('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  api_credits INTEGER (100 for free, 1000 for premium),
  preferences JSONB,
  stripe_session_id TEXT (for payment processing),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```
**RLS Enabled:** Users can only manage their own profile

#### **apo_logs** (Analysis Tracking)
```sql
CREATE TABLE public.apo_logs (
  id UUID PRIMARY KEY,
  user_id UUID (references profiles),
  occupation_code TEXT,
  occupation_title TEXT,
  overall_apo_score NUMERIC(5,2) (0-100),
  confidence_level NUMERIC(3,2) (0-1),
  category_scores JSONB,
  timeline_projections JSONB,
  automation_factors JSONB,
  model_version TEXT,
  prompt_hash TEXT,
  tokens_used INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```
**Use Case:** Audit trail for AI calculations, enables validation and metrics tracking

#### **search_history** (User Search Tracking)
```sql
CREATE TABLE public.search_history (
  id UUID PRIMARY KEY,
  user_id UUID,
  search_query TEXT,
  occupation_code TEXT,
  occupation_title TEXT,
  timestamp TIMESTAMPTZ,
  session_id TEXT
);
```

### O*NET Data Tables

#### **onet_occupation_enrichment**
Comprehensive cached data:
- Bright Outlook flags, employment projections, wage data
- Career clusters, job zones (1-5), STEM classifications
- Education level requirements, experience requirements
- Cache expiry tracking (30-day TTL)

#### **onet_stem_membership** (102 occupations)
- STEM classification with certainty levels
- Queryable by occupation_code

#### **onet_knowledge & onet_abilities**
- Knowledge areas and ability requirements
- Importance/level scales
- Indexed by occupation_code

#### **onet_work_context**
- Physical demands, work environment
- Remote work capability flags
- Travel requirements, licensing needs

#### **onet_detailed_tasks** (19,000+ tasks)
- Task descriptions by occupation
- Automation category indicators
- Full-text search indexing via GIN

#### **onet_work_activities**
- Standard work activity classifications
- Grouped by occupation

#### **onet_technologies** (40 hot technologies)
- Tool and technology requirements
- Technology adoption maturity levels

#### **onet_career_clusters** (16 clusters)
- Cluster taxonomy from O*NET
- Descriptions and sort order

#### **onet_job_zones** (5 zones)
- Job complexity levels
- Descriptions and examples

### AI Features Tables

#### **user_profiles**
- Extended user data: technical/soft skills, certifications
- Career goals and interests
- Work history and education

#### **profile_analyses**
- Automation risk scores
- Skill gap assessments
- Learning path recommendations
- Analysis type: automation_risk, gap_analysis, career_match, skill_assessment

#### **conversation_context**
- AI chat history and context
- Session management for multi-turn conversations
- Memory summaries for context compression
- 30-day expiry

#### **learning_paths**
- Generated learning recommendations
- Skill development tracking
- Resource links and estimates

### Validation & Economics Tables

#### **expert_assessments**
- Frey & Osborne, Arntz OECD data
- Ground truth for calibration
- Historical expert assessments

#### **validation_metrics**
- Pearson correlation scores
- Model performance metrics
- Ablation study results

#### **automation_economics**
- Implementation costs by task/sector
- ROI timelines
- Technology maturity levels
- WEF adoption scores

#### **bls_employment_data**
- Real employment trends
- Projections and growth rates
- Wage data

#### **skill_demand_signals**
- Real-time job posting analysis
- Skill demand trends
- Salary correlations

### Real-time & Notifications

#### **notifications**
```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY,
  user_id UUID,
  type TEXT ('system', 'analysis', 'warning', 'info'),
  title TEXT,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ
);
```

#### **feedback**
- Bug reports, feature requests
- User satisfaction tracking

#### **web_vitals**
- Core Web Vitals metrics (LCP, FID, CLS)
- Performance monitoring

---

## 3. AUTHENTICATION & USER MANAGEMENT

### Authentication Flow
1. **Sign Up/Sign In:** Supabase Auth (email/password)
2. **Session Management:** JWT tokens with automatic refresh
3. **Hooks:** `useSession()` - tracks auth state globally

### User Profile Management
- **Hook:** `useUserProfile()` - queries profiles table
- **RLS Policies:** Users can only read/write their own profile
- **Subscription Tiers:**
  - `free` - 100 API credits/month, basic features
  - `basic` - 500 API credits/month
  - `premium` - 1000 API credits/month
  - `enterprise` - Custom limits

### API Credits System
- **Component:** `APICreditsDisplay.tsx` shows current usage
- **RPC Function:** `deduct_api_credits(p_user_id, p_credits_to_deduct)`
- **Enforcement:** Called before APO calculations
- **Rate Limiting:** Additional per-hour limits (20 searches/hour typical)

### Stripe Integration
- **Status:** Infrastructure present but not fully implemented
- **Fields:** `stripe_session_id` in profiles table
- **Plan:** Ready for Stripe webhook integration

---

## 4. PAYMENT PROCESSING CAPABILITIES

### Current State
- **Database Support:** ✅ subscription_tier and stripe_session_id fields exist
- **Credit System:** ✅ api_credits tracking implemented
- **RPC Functions:** ✅ deduct_api_credits() function available
- **UI Display:** ✅ APICreditsDisplay component shows usage

### Missing for Production
1. **Stripe Integration**
   - No Stripe webhook handler
   - No checkout flow implemented
   - No subscription management UI

2. **Pricing Tier Configuration**
   - No publicly accessible pricing page
   - Tier benefits not clearly defined
   - No upgrade/downgrade flow

3. **Usage-based Billing**
   - No metered usage integration
   - No overage charges
   - No credit replenishment workflow

4. **Payment Method Management**
   - No card update UI
   - No billing history
   - No invoice management

---

## 5. API ENDPOINTS & EDGE FUNCTIONS

### Supabase Edge Functions (19 total)

#### Core Analysis
1. **calculate-apo** (POST)
   - Input: `{ occupation: { code, title } }`
   - Output: Full APO breakdown, confidence scores, timeline projections
   - Rate Limited: Via `apoRateLimiter`
   - Tokens: JSON-mode Gemini response parsing

2. **calculate-apo-with-ci** (POST)
   - Enhanced version with confidence intervals
   - Returns probabilistic bounds around APO score

#### O*NET Data
3. **browse-career-clusters** - Career cluster hierarchy
4. **sync-stem-membership** - STEM classification sync
5. **sync-knowledge-abilities** - Knowledge/ability data ingestion

#### Task Analysis
6. **analyze-occupation-tasks** - Task automation assessment
7. **assess-task** - Individual task automation analysis
8. **search-tasks** - Full-text search across 19,000+ tasks

#### AI Career Features
9. **ai-career-coach** - Multi-turn AI coaching
10. **learning-path** - Generate personalized learning paths
11. **analyze-profile** - Deep profile analysis
12. **estimate-skill-half-life** - Skill currency modeling

#### Job Market
13. **filters** - Job posting analysis and filtering
14. **program-exemplars** - Career program recommendations

#### Data Sync
15. **econ-sync** - Automation economics data sync
16. **bls-sync** - Bureau of Labor Statistics sync

#### Utility
17. **health-check** - System health monitoring
18. **calibrate-ece** - Validation metrics calibration
19. **cascade-risk** - Occupation ecosystem risk analysis

### Database RPC Functions

```typescript
deduct_api_credits(p_user_id UUID, p_credits_to_deduct NUMERIC)
  → returns boolean (success/insufficient credits)

create_notification(p_user_id UUID, p_title TEXT, p_message TEXT, p_type TEXT)
  → inserts notification record

calculate_roi(p_soc8 TEXT)
  → returns table of ROI metrics by sector

get_occupation_task_assessments(p_occupation_code TEXT)
  → returns assessment details

health_check()
  → system status indicator
```

---

## 6. FRONTEND FEATURES & PAGES

### Main Pages (37 routes)
1. **Index (/)** - Landing page with hero section
2. **Auth (/auth)** - Sign in/Sign up page
3. **Dashboard (/dashboard, /user-dashboard)** - User dashboard
4. **Gap Analysis (/gap-analysis)** - Skill gap assessment
5. **AI Impact (/ai-impact)** - Automation impact overview
6. **AI Impact Planner (/ai-impact-planner)** - Task assessment tool
7. **Career Planning (/career-planning)** - Career path planning
8. **Crosswalk (/crosswalk)** - Occupation code mapping (SOC/OOH/ESCO)
9. **Browse Features:**
   - Bright Outlook (/browse/bright-outlook) - Growth opportunities
   - STEM (/browse/stem) - STEM occupations (102)
   - Job Zones (/browse/job-zones) - Complexity levels
10. **Occupation Detail (/occupation/:code)** - Deep dive analysis
11. **Job Zone Ladders (/job-zone-ladders)** - Career progression
12. **Impact Dashboard (/impact)** - Ecosystem impact
13. **Validation Center (/validation-center)** - Model validation data
14. **Quality Page (/quality)** - WCAG AA compliance
15. **Responsible AI (/responsible-ai)** - Model cards & governance
16. **Veterans (/veterans)** - Military transition support
17. **Tech Skills (/tech-skills)** - Technology demand heatmap
18. **Economics Browser (/economics)** - Cost-benefit analysis
19. **Econ Importer (/econ-importer)** - Data ingestion tool
20. **Operations (/operations)** - System monitoring & alerts

### Key Components (90+ components)

#### Search & Discovery
- **SearchInterface** - Main search with advanced filters
- **AdvancedSearchPanel** - Filter by cluster, zone, STEM, outlook
- **SearchHistoryPanel** - Recent searches

#### Analysis & Results
- **APODashboard** - Main analysis results view
- **APOVisualization** - Score charts and breakdowns
- **APOExplanation** - Human-readable explanations
- **OccupationAnalysis** - Detailed job breakdown
- **CategoryBreakdowns** - Task/skill/knowledge scores

#### User Dashboard
- **UserDashboard** - Personalized analytics
- **UserProfilePanel** - Profile management
- **SavedAnalysesPanel** - Saved results
- **SearchHistoryPanel** - Query history
- **APICreditsDisplay** - Usage indicator

#### AI Features
- **AIImpactDashboard** - AI impact summary
- **AIImpactPlanner** - Task categorization tool
- **LearningPathPanel** - Skill recommendations (16KB component)
- **ChatCoachPanel** - AI coaching interface
- **CourseRecommendationsPanel** - Learning resources

#### Data Export
- **ExportCareersModal** - CSV/PDF export
- **ShareAnalysisModal** - Sharing & access control
- **PremiumReportSummary** - Professional reports

#### Visualization
- **EmploymentOutlookCard** - Wage trends
- **AutomationTimelineChart** - Timeline visualization
- **BrightOutlookBadge** - Growth indicators
- **RelatedOccupationsPanel** - Similar careers

### UI Library
- 40+ Radix UI component wrappers (button, card, dialog, select, etc.)
- Custom hooks for common patterns
- Accessible form components with validation

---

## 7. EXISTING MONETIZATION FEATURES

### Current Implementation

#### 1. Subscription Tiers
```typescript
subscription_tier: 'free' | 'basic' | 'premium' | 'enterprise'
```
- **Free Tier:**
  - 100 API credits/month
  - Basic analysis
  - No premium features

- **Premium:**
  - 1000 API credits/month
  - Advanced analytics
  - Batch processing

#### 2. API Credit System
- **Tracking:** apo_logs table with user_id
- **Deduction:** RPC function before each analysis
- **Display:** APICreditsDisplay component
- **Warning:** At <20% credits, shows alert

#### 3. Feature Gating
- Career planning features behind premium flag
- Advanced exports limited by tier
- API access controlled by subscription_tier

### What's Missing for Full Monetization

1. **Payment Gateway Integration**
   - No Stripe/Paddle/Lemonsqueezy integration
   - No checkout flow
   - No webhook handlers

2. **Subscription Management**
   - No upgrade/downgrade UI
   - No billing history
   - No invoice management
   - No auto-renewal setup

3. **Metered Billing**
   - api_credits deducted but not replenished automatically
   - No overage handling
   - No usage alerts

4. **Pricing Page**
   - No public tier comparison
   - No feature matrix
   - No CTA buttons

5. **Admin Tools**
   - No manual credit granting UI
   - No subscription override tools
   - No usage reporting dashboard

---

## 8. DATA MODELS & STORAGE SYSTEMS

### Data Flow Architecture

```
User Input
    ↓
[React Components]
    ↓
[Supabase Client]
    ↓
[Edge Functions] ← [O*NET API] ← [Gemini AI]
                 ← [BLS API]
                 ← [SerpAPI]
    ↓
[PostgreSQL Tables]
    ↓
[RLS Policies] (Row Level Security)
    ↓
[Results back to UI]
```

### Data Freshness & Caching

1. **O*NET Enrichment Cache**
   - TTL: 30 days (cache_expires_at)
   - Auto-refresh when expired
   - fetch_error tracking for failed requests

2. **Query Result Caching**
   - TanStack React Query client
   - Stale time: 5 minutes
   - Manual invalidation on mutations

3. **Session Storage**
   - UTM parameters cached in sessionStorage
   - Search filters preserved during session
   - User selections in localStorage

### Data Security

1. **Row Level Security (RLS)**
   - All user-facing tables have RLS enabled
   - Policy: `(auth.uid() = user_id)`
   - Public read on reference tables (job zones, STEM list, etc.)

2. **Input Validation**
   - Zod schema validation (APO responses)
   - XSS sanitization via DOMPurify
   - SQL injection prevention (parameterized queries)

3. **Secrets Management**
   - Environment variables via Vite + Netlify
   - Supabase edge function secrets
   - API key protection headers

---

## 9. THIRD-PARTY INTEGRATIONS

### Active Integrations

#### Google Gemini AI (Server-side via Edge Function)
- **Service:** GeminiService.ts
- **Usage:** APO calculations, task analysis, recommendations
- **Model:** gemini-2.5-flash (with fallback to gemini-2.0-flash-exp)
- **Rate Limits:** Per API quota (Supabase paid plan)
- **JSON Mode:** Enforced for response parsing

#### O*NET Web Services
- **Authentication:** Basic auth (username/password)
- **Data:** Occupation details, tasks, skills, abilities
- **Cache:** 30-day TTL in database
- **Fallback:** Return cached data if API unavailable

#### SerpAPI
- **Usage:** Job market search, salary data
- **Component:** JobMarketPanel, JobMarketInsights
- **Rate Limits:** Per subscription tier

#### Supabase (Complete Backend)
- **Database:** PostgreSQL 14+
- **Auth:** Email/password, session management
- **Storage:** None (data in tables)
- **Real-time:** Enabled for collaborative features
- **Functions:** 19 edge functions

### Inactive/Planned Integrations

#### Bureau of Labor Statistics
- **Status:** Tables created, sync functions available
- **Data:** Employment projections, wage data
- **Next Step:** Webhook-based auto-sync

#### Stripe
- **Status:** Infrastructure only (no integration code)
- **Plan:** Card in profiles table
- **Next Step:** Full implementation needed

---

## 10. DEPLOYMENT SETUP

### Current Deployment

**Platform:** Netlify (Primary), Supabase (Backend)

```
Git Repository (GitHub)
    ↓ (webhook on push)
Netlify Build
    ↓
npm run build
    ↓
Vite outputs dist/
    ↓
Deploy to Netlify CDN
    ↓
Supabase handles auth + database
```

### Environment Configuration

#### Required Variables (.env)
```bash
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyxxxxx
VITE_SUPABASE_SERVICE_ROLE_KEY=eyxxxxx

# APIs
VITE_GEMINI_API_KEY=AIxxxxx
GEMINI_API_KEY=AIxxxxx
GEMINI_MODEL=gemini-2.5-flash

VITE_SERPAPI_API_KEY=xxxxx
SERPAPI_API_KEY=xxxxx

# O*NET
ONET_USERNAME=xxxxx
ONET_PASSWORD=xxxxx

# Supabase Edge Function Security
APO_FUNCTION_API_KEY=xxxxx (32-char hex)
VITE_APO_FUNCTION_API_KEY=xxxxx

# Data Sync
VITE_ECON_SYNC_API_KEY=xxxxx

# Optional
BLS_API_KEY=xxxxx
GEMINI_MODEL=gemini-2.5-flash
```

#### Rate Limits (Optional)
```bash
HL_RATE_LIMIT_PER_MIN=60
AR_RATE_LIMIT_PER_MIN=60
SIM_RATE_LIMIT_PER_MIN=30
CASCADE_RATE_LIMIT_PER_MIN=30
PORTFOLIO_RATE_LIMIT_PER_MIN=30
```

### Build & Deploy Process

1. **Build:** `npm run build`
   - Vite compiles TypeScript/React
   - Tailwind CSS processed
   - Output: dist/ folder (~2-3MB)

2. **Type Check:** `npx tsc --noEmit`
   - Ensures TypeScript safety

3. **Deploy:** Git push triggers Netlify
   - Build time: 4-5 minutes
   - Auto-redirect /\* to index.html (SPA)
   - Security headers configured (CSP, HSTS, etc.)

### Security Headers (Configured)
```toml
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com
Strict-Transport-Security: max-age=63072000
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 11. FEATURE MATRIX & COMPLETENESS

### ✅ Fully Implemented
- User authentication & profiles
- APO calculation engine
- O*NET data caching
- Occupation search & filtering
- STEM/Bright Outlook/Job Zones browsing
- AI Impact Planner (task analysis)
- Learning path recommendations
- CSV/PDF export
- Sharing & collaboration
- API credit system
- Real-time notifications
- Accessibility (WCAG AA)
- Performance monitoring
- Responsible AI dashboard

### 🟡 Partially Implemented
- Stripe integration (infrastructure only)
- Subscription tier enforcement (tiers exist, but not enforced everywhere)
- Economic data integration (tables exist, limited population)
- Metered billing (tracking only, no replenishment)

### ❌ Not Implemented
- Subscription management UI (upgrade/downgrade)
- Payment checkout flow
- Invoice management
- Billing history
- Admin dashboard (for credit management)
- Usage alerts/notifications
- Pricing page

---

## 12. DATABASE MIGRATIONS SUMMARY

**Total Migrations:** 37 active migrations

### Key Milestones
1. **Phase 1 (June-July 2025):** Core tables & enrichment
2. **Phase 2 (August 2025):** AI features (learning paths, profile analysis)
3. **Phase 3 (October 2025):** Economics & validation (BLS, automation costs)
4. **Recent (Oct 22-Nov 5):** ROI calculations, expert assessments

### Latest Critical Migrations
- `20251004140000` - profiles table (subscription tiers)
- `20251004140100` - O*NET enrichment tables
- `20251004140200` - Work context & tasks
- `20251004160000` - Phase 3 AI features
- `20251021113500` - automation_economics table
- `20251021113000` - bls_employment_data table
- `20251023113000` - calculate_roi() function

---

## 13. PERFORMANCE METRICS

### Current Metrics (from OutcomesPage)

- **Page Load Time:** < 3 seconds (Netlify CDN)
- **API Response:** < 2 seconds average
- **Uptime:** 99.9%+ (Netlify SLA)
- **Error Rate:** < 0.1%

### Web Vitals Tracked
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to First Byte (TTFB)

### Feature Performance
- APO Calculation: ~800ms - 2 seconds (Gemini API call)
- Search: < 500ms (database query)
- Chart Rendering: < 300ms (Recharts)

---

## 14. KNOWN GAPS & IMPROVEMENT AREAS

### High Priority (Monetization)
1. Stripe integration for payment processing
2. Subscription management UI
3. Usage-based billing implementation
4. Credit replenishment workflow
5. Billing dashboard

### Medium Priority (Features)
1. Expert override system for APO scores
2. Batch occupation analysis
3. Historical trend tracking
4. Custom reporting builder
5. API rate limit management UI

### Low Priority (Optimization)
1. Database query optimization
2. Edge caching strategy
3. Service worker for offline mode
4. Component code-splitting
5. Lighthouse score improvements

---

## 15. FILE STRUCTURE OVERVIEW

```
career-automation-insights-engine/
├── src/
│   ├── pages/                    (37 route pages)
│   ├── components/               (90+ UI components)
│   │   ├── ui/                  (shadcn components)
│   │   ├── assistant/           (AI coach)
│   │   ├── help/                (help modals)
│   │   ├── outcomes/            (outcome components)
│   │   └── onboarding/          (onboarding flow)
│   ├── hooks/                    (20+ custom hooks)
│   ├── services/                 (API service classes)
│   ├── utils/                    (10 utility modules)
│   ├── lib/                      (helpers & constants)
│   ├── integrations/
│   │   └── supabase/            (client + types)
│   ├── types/                    (TypeScript definitions)
│   ├── content/                  (Static content)
│   └── App.tsx                   (Main app router)
├── supabase/
│   ├── migrations/               (37 SQL files)
│   ├── functions/                (19 edge functions)
│   ├── lib/                      (Deno utilities)
│   ├── data/                     (Seed scripts)
│   └── tests/                    (Function tests)
├── public/
│   ├── docs/                     (PDF artifacts)
│   ├── data/                     (Static datasets)
│   └── _headers                  (Security headers)
├── package.json                  (Dependencies)
├── vite.config.ts               (Build config)
├── netlify.toml                 (Deployment config)
├── tsconfig.json                (TypeScript config)
├── tailwind.config.ts           (Tailwind config)
└── README.md                     (Documentation)
```

---

## 16. KEY STATISTICS

| Metric | Value |
|--------|-------|
| **Frontend Components** | 90+ |
| **Custom React Hooks** | 20+ |
| **Database Tables** | 30+ |
| **Edge Functions** | 19 |
| **RPC Functions** | 5+ |
| **Routes/Pages** | 37 |
| **SQL Migrations** | 37 |
| **Lines of Code (Frontend)** | ~50K |
| **Lines of Code (Backend)** | ~15K |
| **TypeScript Coverage** | 100% |
| **NPM Dependencies** | 30+ (core) |
| **DevDependencies** | 12 |

---

## 17. NEXT STEPS FOR MONETIZATION

### Phase 1: Payment Gateway (2-3 weeks)
- [ ] Integrate Stripe API
- [ ] Create checkout flow
- [ ] Set up webhooks for subscription events
- [ ] Test with test mode

### Phase 2: Subscription Management (1-2 weeks)
- [ ] Build upgrade/downgrade UI
- [ ] Create customer portal (or embed Stripe)
- [ ] Implement auto-renewal
- [ ] Add billing history endpoint

### Phase 3: Usage Monitoring (1 week)
- [ ] Real-time usage dashboard
- [ ] Overage alerts
- [ ] Refill workflow
- [ ] Admin controls

### Phase 4: Pricing Page (1 week)
- [ ] Create pricing tier comparison
- [ ] Feature matrix
- [ ] CTA buttons
- [ ] FAQ section

---

**Document Generated:** November 5, 2025
**Last Updated:** October 22, 2025
**Status:** Production-Ready (Monetization Infrastructure Present, Payment Gateway Pending)
