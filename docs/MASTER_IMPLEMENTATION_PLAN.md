# Master Implementation Plan: Revenue Activation & Gap Closure

**Created:** February 9, 2026  
**Source:** Synthesis of 9 research documents + codebase audit  
**Status:** ACTIVE — Execute sequentially  

---

## 0. EXECUTIVE SUMMARY

After reading all 9 research documents and auditing the codebase, here is the distilled truth:

**The product is built. The problem is 100% distribution + payment activation.**

The codebase has 40+ Edge Functions, 47 pages, 80+ components, Stripe billing infrastructure, Whop marketplace hooks, white-label B2B tools, and enterprise dashboards. But it has **$0 revenue** because:

1. Stripe checkout flow was broken (no Edge Function existed) — **FIXED this session**
2. Price IDs are still placeholders — **requires manual Stripe Dashboard action**
3. SEO pages are client-rendered (invisible to Google) — **partially fixed, needs prerender**
4. No analytics = can't optimize anything — **needs PostHog**
5. ForCoachesPage has no demo/proof — **needs screenshots + video**
6. Resume Analyzer requires auth (kills viral loop) — **needs 1 free scan**
7. No onboarding email — **needs Resend integration**

---

## 1. CROSS-DOCUMENT CONFLICT RESOLUTION

### Pricing (3 conflicting schemas across docs)

| Document | Tiers | Prices |
|----------|-------|--------|
| MONETIZATION_IMPLEMENTATION.md (Nov 2025) | Free/Explorer/Navigator/Strategist | $0/$19/$39/$49 |
| Monetization_verification.md (Dec 2024) | Solo Starter/Pro Authority/Agency | $49/$129/$299 |
| Value_proposition.md + **Current Code** (Dec 2025) | Explorer/Defender/Coach Pro | **$0/$29/$149** |

**RESOLUTION:** Current code (`src/lib/stripe.ts`) uses **Free/$29/$149** with tier IDs `free/defender/coach`. This is the canonical, validated pricing per Value_proposition.md research. The $29 sweet spot is confirmed by competitor analysis (undercuts Jobscan $49.95, above commodity tools $9-19).

### Distribution Channels (conflicting recommendations)

| Document | Recommendation |
|----------|---------------|
| Monetization_research.md | Whop + Gumroad + AppSumo |
| Monetization_verification.md | **REJECT AppSumo** (unit economic death trap), PRIMARY = Certification partners |
| GTM Strategy | Direct Stripe + LinkedIn outreach |

**RESOLUTION:** 
- **PRIMARY:** Stripe direct checkout (already built, highest margin)
- **SECONDARY:** LinkedIn/Reddit organic outreach (zero cost)
- **TERTIARY:** Whop marketplace (integration exists, lower priority)
- **REJECT:** AppSumo (data-intensive product = negative unit economics on LTDs)

### Whop Strategy

WHOP_IMP_PLAN.MD is for a *different project* (Canada Energy Dashboard). The APO Dashboard does have Whop OAuth + webhook Edge Functions. Whop is a **secondary channel** — don't invest heavy effort here until Stripe direct is generating revenue.

---

## 2. COMPLETE GAP INVENTORY (All 9 Documents)

### CATEGORY A: PAYMENT & MONETIZATION (Revenue Blockers)

| # | Gap | Status | Fix Type | Sprint |
|---|-----|--------|----------|--------|
| A1 | Stripe Price IDs are placeholders (`price_defender_monthly`, etc.) | ❌ OPEN | Manual: Stripe Dashboard | 1 |
| A2 | `create-checkout-session` Edge Function missing | ✅ FIXED | Code | — |
| A3 | `create-portal-session` Edge Function missing | ✅ FIXED | Code | — |
| A4 | `stripe-webhook` tier mapping used legacy names | ✅ FIXED | Code | — |
| A5 | Frontend `redirectToCheckout` called non-existent `/api/` | ✅ FIXED | Code | — |
| A6 | Supabase secrets not set (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) | ❌ OPEN | Manual: Supabase Dashboard | 1 |
| A7 | Edge Functions not deployed to production | ❌ OPEN | Manual: CLI deploy | 1 |
| A8 | No PAYG report credit purchase flow | ❌ OPEN | Code | 7 |
| A9 | Usage tracking exists (`useSubscription`) but not enforced on Edge Functions | ❌ OPEN | Code | 7 |
| A10 | No `analytics_events` table (disabled in PricingPage) | ❌ OPEN | Code | 4 |

### CATEGORY B: SEO & ORGANIC TRAFFIC

| # | Gap | Status | Fix Type | Sprint |
|---|-----|--------|----------|--------|
| B1 | SEO pages are client-rendered React (Google can't index) | ⚠️ PARTIAL | Code: prerender meta tags | 5 |
| B2 | `sitemap.xml` generated (64 URLs) | ✅ FIXED | — | — |
| B3 | `robots.txt` updated with sitemap reference | ✅ FIXED | — | — |
| B4 | OG tags + Twitter cards on `index.html` | ✅ FIXED | — | — |
| B5 | Netlify prerendering config added | ✅ FIXED | — | — |
| B6 | No blog/content pages for long-tail SEO | ❌ OPEN | Code + Content | 5 |
| B7 | No Google Search Console submission | ❌ OPEN | Manual | 5 |
| B8 | Schema.org JSON-LD on SEO pages | ✅ EXISTS | — | — |
| B9 | SEO pages lack strong CTAs to signup/pricing | ⚠️ WEAK | Code | 5 |

### CATEGORY C: LANDING PAGES & CONVERSION

| # | Gap | Status | Fix Type | Sprint |
|---|-----|--------|----------|--------|
| C1 | ForCoachesPage has no sample report screenshots | ❌ OPEN | Code | 2 |
| C2 | ForCoachesPage has no demo video embed | ❌ OPEN | Code (Loom placeholder) | 2 |
| C3 | No testimonials or social proof anywhere | ❌ OPEN | Code: data-as-proof | 2 |
| C4 | No "Powered by O*NET + Gemini AI" authority badges | ❌ OPEN | Code | 2 |
| C5 | No "analyses performed" live counter | ❌ OPEN | Code | 2 |
| C6 | PricingPage analytics events disabled | ❌ OPEN | Code | 4 |
| C7 | No checkout success page with onboarding | ❌ OPEN | Code | 6 |
| C8 | No dedicated `/veterans-transition` enhanced landing page | ❌ OPEN | Code | 8 |

### CATEGORY D: VIRAL MECHANICS & GROWTH

| # | Gap | Status | Fix Type | Sprint |
|---|-----|--------|----------|--------|
| D1 | Resume Analyzer requires auth for ANY use (kills viral loop) | ❌ OPEN | Code | 3 |
| D2 | No social sharing CTA for Resume Analyzer score | ❌ OPEN | Code | 3 |
| D3 | No "Share your AI-Proof Score" badge/image generation | ❌ OPEN | Code | 3 |
| D4 | No referral program (coach gets 1 free month per referral) | ❌ OPEN | Code | 8 |

### CATEGORY E: EMAIL & ONBOARDING

| # | Gap | Status | Fix Type | Sprint |
|---|-----|--------|----------|--------|
| E1 | No welcome email on signup | ❌ OPEN | Code: Resend Edge Function | 6 |
| E2 | No email drip sequences | ❌ OPEN | Resend + Code | 8 |
| E3 | No upgrade prompts when hitting free tier limits | ⚠️ EXISTS (UpgradePrompt.tsx) but not wired to real limits | Code | 6 |

### CATEGORY F: ANALYTICS & OPTIMIZATION

| # | Gap | Status | Fix Type | Sprint |
|---|-----|--------|----------|--------|
| F1 | No product analytics (PostHog/Mixpanel) | ❌ OPEN | Code | 4 |
| F2 | No funnel tracking (signup → trial → paid) | ❌ OPEN | Code | 4 |
| F3 | No A/B testing capability | ❌ OPEN | PostHog feature flags | 8 |

**Total: 16 gaps FIXED, 26 gaps remaining across 8 sprints.**

---

## 3. IMPLEMENTATION SPRINTS (Sequential Execution)

### SPRINT 1: "Can Take Money" (Manual Setup — User Action Required)
**Goal:** Live payment flow end-to-end  
**Effort:** 1-2 hours of Stripe/Supabase dashboard work  
**Dependency:** None — this unblocks everything  

**Steps:**
1. Create Stripe account (or use existing) in **test mode**
2. Create 4 Stripe Products + Prices:
   - Defender Monthly: $29/mo → get `price_xxx` ID
   - Defender Annual: $290/yr → get `price_xxx` ID
   - Coach Pro Monthly: $149/mo → get `price_xxx` ID
   - Coach Pro Annual: $1,490/yr → get `price_xxx` ID
3. Update `src/lib/stripe.ts` with real Price IDs
4. Set Supabase secrets:
   - `STRIPE_SECRET_KEY` = `sk_test_xxx`
   - `STRIPE_WEBHOOK_SECRET` = `whsec_xxx`
   - `APP_URL` = `https://your-domain.netlify.app`
5. Deploy Edge Functions:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy create-portal-session
   supabase functions deploy stripe-webhook
   ```
6. Configure Stripe webhook endpoint in Stripe Dashboard:
   - URL: `https://your-supabase-url.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_succeeded`, `invoice.payment_failed`
7. Test complete flow: Browse → Pricing → Select Plan → Stripe Checkout → Success redirect

---

### SPRINT 2: "Worth Paying For" (Code Changes — Conversion Optimization)
**Goal:** ForCoachesPage converts visitors to trials  
**Effort:** 2-3 hours of code  
**Dependency:** None  

**Changes:**
- Add sample report preview section to ForCoachesPage
- Add "Powered by O*NET 29.3 + Gemini AI" authority badge
- Add data-as-proof counters ("1,016 occupations analyzed", "19,000+ O*NET tasks")
- Add Loom video embed placeholder with compelling CTA
- Add ROI calculator inline ("You charge $200/session. This report costs you $10. That's 20x ROI.")

---

### SPRINT 3: "Goes Viral" (Code Changes — Resume Analyzer Viral Loop)
**Goal:** Resume Analyzer usable without auth, shareable results  
**Effort:** 2-3 hours of code  
**Dependency:** None  

**Changes:**
- Allow 1 free resume scan without authentication (store in localStorage to prevent abuse)
- Show partial results for free (risk score + top 3 flags), gate full rewrites behind signup
- Add "Share Your AI-Proof Score" social share buttons (Twitter, LinkedIn, copy link)
- Generate shareable score badge ("My resume AI-Proof Score: 72/100")

---

### SPRINT 4: "Can Measure" (Code Changes — Analytics)
**Goal:** Track signup → trial → paid funnel  
**Effort:** 1-2 hours of code  
**Dependency:** None  

**Changes:**
- Install PostHog (free tier: 1M events/mo)
- Add PostHog provider to App.tsx
- Track key events: `page_view`, `signup`, `pricing_page_viewed`, `checkout_started`, `checkout_completed`, `apo_check_performed`, `resume_analyzed`, `report_generated`
- Re-enable PricingPage analytics events (route to PostHog instead of broken Supabase table)

---

### SPRINT 5: "Can Be Found" (Code + Manual — SEO Hardening)
**Goal:** Google indexes the 50 SEO occupation pages  
**Effort:** 2-3 hours  
**Dependency:** Sprint 1 (need live site for Google Search Console)  

**Changes:**
- Add `<meta name="fragment" content="!">` to index.html for AJAX crawling
- Enhance AutomationRiskLandingPage CTAs: "Get Your Full Analysis Free →" button
- Add internal links between related occupation pages (high→bridge role pages)
- Add "Related Occupations" section to each SEO page
- Submit sitemap to Google Search Console
- Submit to Bing Webmaster Tools

---

### SPRINT 6: "Converts & Retains" (Code — Email & Onboarding)
**Goal:** New users get welcome email, hitting limits triggers upgrade  
**Effort:** 3-4 hours  
**Dependency:** Sprint 1 (Supabase secrets)  

**Changes:**
- Create `send-welcome-email` Supabase Edge Function using Resend API
- Wire to Supabase Auth trigger (on user signup)
- Create checkout success page (`/dashboard?checkout=success`) with onboarding steps
- Wire UpgradePrompt.tsx to real usage limits from useSubscription hook

---

### SPRINT 7: "More Revenue" (Code — PAYG Credits)
**Goal:** Coaches can buy report credits without subscription  
**Effort:** 3-4 hours  
**Dependency:** Sprint 1  

**Changes:**
- Create `create-credit-checkout` Edge Function (Stripe one-time payments)
- Add credit balance display in CounselorReportGenerator
- Deduct credits on report generation
- Add PAYG purchase buttons on ForCoachesPage

---

### SPRINT 8: "Scale Revenue" (Code + Manual — Enterprise & Growth)
**Goal:** Enterprise pipeline + referral program  
**Effort:** 4-6 hours  
**Dependency:** Sprints 1-4  

**Changes:**
- Create "Workforce Automation Audit" PDF proposal template
- Add Enterprise pricing CTA section on PricingPage
- Add referral program (coach gets 1 free month for each referral who pays)
- Enhanced /veterans-transition landing page
- Email drip sequence setup (Resend)

---

## 4. REVENUE PROJECTIONS (Conservative)

| Timeline | Source | MRR |
|----------|--------|-----|
| Week 2 (Sprint 1 done) | First test payments | $0 (testing) |
| Week 4 (Sprints 1-3 done) | 3-5 coaches from LinkedIn outreach | $450-$750 |
| Week 8 (Sprints 1-6 done) | 15 coaches + 10 B2C from SEO | $2,525-$3,735 |
| Week 12 (All sprints done) | 30 coaches + 30 B2C + 1 enterprise audit | $7,345-$12,170 |

---

## 5. WHAT WAS ALREADY FIXED (This Session)

| Item | File | What |
|------|------|------|
| ✅ Checkout flow | `supabase/functions/create-checkout-session/index.ts` | Created Edge Function |
| ✅ Portal flow | `supabase/functions/create-portal-session/index.ts` | Created Edge Function |
| ✅ Webhook tiers | `supabase/functions/stripe-webhook/index.ts` | Fixed defender/coach mapping |
| ✅ Frontend routing | `src/lib/stripe.ts` | Fixed both checkout + portal calls |
| ✅ SEO sitemap | `public/sitemap.xml` + `scripts/generate-sitemap.js` | 64 URLs |
| ✅ SEO robots | `public/robots.txt` | Added sitemap reference |
| ✅ Social sharing | `index.html` | OG tags, Twitter cards, canonical URL |
| ✅ Netlify config | `netlify.toml` | Prerendering + sitemap plugin |

---

## 6. CRITICAL PATH TO FIRST DOLLAR

```
Sprint 1 (Manual: Stripe setup) 
    → Sprint 2 (Code: ForCoachesPage polish)
    → LinkedIn outreach to 50 coaches (Manual: use scripts from GTM doc Section 8)
    → First paying customer (Target: Day 14)
```

**The single biggest bottleneck right now is Sprint 1 — setting up real Stripe Price IDs. Everything else is built.**

---

*This document supersedes all previous strategy documents as the single execution plan. Update weekly with actual results vs. projections.*
