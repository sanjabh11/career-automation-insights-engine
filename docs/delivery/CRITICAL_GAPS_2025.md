# Critical Gap Analysis - Implementation Score < 4.9
**Date**: 2025-10-04  
**Total Gaps Identified**: 28 critical items

## 🔴 CRITICAL O*NET Feature Gaps (Score 0.0-1.0)

| # | Feature | Score | Impact | O*NET API Endpoint |
|---|---------|-------|--------|-------------------|
| 1 | Bright Outlook Indicator | 0.0 | HIGH | `/careers/{code}/bright_outlook` |
| 2 | Career Clusters (16) | 0.0 | HIGH | `/find/career_cluster` |
| 3 | Job Families | 0.0 | MED | `/find/family` |
| 4 | Job Zones (5 levels) | 0.0 | HIGH | `/find/zone` |
| 5 | STEM Designation | 0.0 | MED | `/occupations/{code}/stem` |
| 6 | Task-Based Search (19K) | 0.0 | HIGH | `/search/tasks` |
| 7 | Professional Associations (3K) | 0.0 | LOW | `/occupations/{code}/associations` |
| 8 | Work Activities Search | 0.0 | MED | `/search/work_activities` |
| 9 | Software/Tools Search | 0.0 | MED | `/search/tools_technology` |
| 10 | Interests (RIASEC) | 0.0 | HIGH | `/occupations/{code}/interests` |
| 11 | Work Styles | 0.0 | MED | `/occupations/{code}/work_styles` |
| 12 | Employment Outlook | 0.0 | CRITICAL | `/careers/{code}/outlook` |
| 13 | Related Occupations | 0.0 | HIGH | `/occupations/{code}/related_occupations` |
| 14 | Historical Tracking | 0.0 | MED | New DB table needed |
| 15 | User Profiles Table | 0.0 | CRITICAL | `CREATE TABLE profiles` |

## 🟡 LLM Integration Gaps (Score 0.0-3.8)

| # | Feature | Score | LLM.md Page | Fix Required |
|---|---------|-------|-------------|--------------|
| 16 | Market Intelligence Analyzer | 1.0 | Lines 293-356 | Create Edge Function |
| 17 | Resume/Profile Analyzer | 0.0 | Lines 473-492 | Create Edge Function |
| 18 | Context Caching | 0.0 | Lines 718-754 | Implement cache manager |
| 19 | API Key Management | 0.0 | Lines 649-713 | Client-side encryption |
| 20 | Career Coach Follow-ups | 3.5 | Lines 62-108 | Enhance prompt structure |
| 21 | Task Assessor 7-Criteria | 3.5 | Lines 170-218 | Add criteria scoring |
| 22 | Skill Planner Learning Paths | 3.8 | Lines 224-288 | Add ROI/timeline |
| 23 | Dynamic APO Analysis Function | 0.0 | Lines 384-403 | Create Edge Function |

## 🟢 Infrastructure & Auth Gaps (Score 3.0-4.5)

| # | Feature | Score | Location | Fix Required |
|---|---------|-------|----------|--------------|
| 24 | O*NET API Key Fallback | 4.5 | `analyze-occupation-tasks/index.ts` | Remove fallback (lines 27-30) |
| 25 | Hardcoded Gemini Model | 4.7 | `skill-recommendations/index.ts` | Use env-driven (line 86) |
| 26 | Security Headers Verification | 3.0 | Netlify/Supabase config | Add CSP, X-Frame headers |
| 27 | WCAG 2.1 AA Audit | 3.0 | Frontend components | Run Lighthouse audit |
| 28 | Bulk Analysis (5+ items) | 3.5 | `/compare` page | Support 5+ occupations |

---

## Quick Wins (Can Fix Immediately)

### 1. Remove O*NET API Key Fallback ✅ **2 minutes**
```typescript
// File: supabase/functions/analyze-occupation-tasks/index.ts
// Lines 27-30: DELETE these lines
const hasUserPass = Boolean(ONET_USERNAME && ONET_PASSWORD);
if (!hasUserPass) {
  throw new Error('O*NET credentials not configured: set ONET_USERNAME and ONET_PASSWORD');
}
```

### 2. Fix Hardcoded Gemini Model ✅ **1 minute**
```typescript
// File: supabase/functions/skill-recommendations/index.ts
// Line 86: CHANGE from
const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent...`)
// TO:
import { getEnvModel } from "../../lib/GeminiClient.ts";
const model = getEnvModel();
const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent...`)
```

### 3. Create Profiles Table ✅ **5 minutes**
```sql
-- File: supabase/migrations/20251004_create_profiles.sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  occupation_code TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles 
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

---

## High-Impact Implementation Priorities

### Phase 1 (Week 1): O*NET Core Features
**Impact**: Brings parity with O*NET Online

1. **Bright Outlook & Employment Data** - 2 days
2. **Career Clusters Navigation** - 1 day
3. **Job Zones & STEM Filter** - 1 day
4. **Related Occupations** - 1 day

### Phase 2 (Week 2): LLM Enhancement
**Impact**: Delivers on LLM.md vision

5. **Market Intelligence Analyzer Function** - 2 days
6. **Enhanced Career Coach (Follow-ups/Actions)** - 2 days
7. **Learning Path Generator** - 1 day

### Phase 3 (Week 3): Advanced Search
**Impact**: Power-user features

8. **Task-Based Search (19K tasks)** - 3 days
9. **Work Activities & Soft Skills Search** - 2 days

---

## Detailed Fix Instructions

Coming in next message with code implementations...
