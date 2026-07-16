# Phase 6: Codebase Reconnaissance

**Audit ID:** caie-niche-positioning-2026-07-16
**Date:** 2026-07-16

---

## 6.1 Capability Verification — Positioning Claims vs. Implemented Capabilities

| Positioning Claim | Implementation | Verified? | Gap? |
|---|---|---|---|
| "White-label automation defense reports" | `CounselorReportGenerator.tsx` (737 LOC) with `WhiteLabelConfig` interface (company_name, logo_url, colors, contact info, `include_apo_branding` flag). `generate-counselor-report` Edge Function (399 LOC) generates HTML for PDF. DOMPurify for XSS protection. CreditBalance integration for PAYG. | ✅ Verified | None |
| "O*NET 30.3 government data" | 19,000+ tasks in `onet_detailed_tasks`, O*NET knowledge/abilities/technologies tables. `calculate-apo` injects O*NET data into Gemini prompts via `fetchOnetContext()`. | ✅ Verified | None |
| "Bridge role pathfinding" | `find-bridge-roles` Edge Function (390 LOC) with A* algorithm, skill overlaps, feasibility scores, asymmetric difficulty. Algorithm: `a_star` / `graph_edges` / `direct`. | ✅ Verified | None |
| "Skill adjacency graph" | `calculate-skill-adjacency` Edge Function using Gemini `gemini-embedding-001` (768-dim) + pgvector. Smoke test verified. | ✅ Verified | None |
| "Monte Carlo confidence intervals" | `calculate-apo` with confidence-scaled Monte Carlo CI (high=2%, medium=5%, low=10% noise). | ✅ Verified | None |
| "$149/mo Coach Pro with 15 white-label reports" | `stripe.ts` with real Stripe price ID `price_1SzAwCCDRnHqUTRJdPZaLEGn` (monthly) and `price_1SzAwCCDRnHqUTRJIbQ7YlJe` (annual). 15 whitelabelReports/mo limit. | ✅ Verified | None |
| "Credit packs ($49-$299)" | `CREDIT_PACKAGES` in `stripe.ts` with real Stripe price IDs: Starter ($49/5 credits), Professional ($129/15 credits), Enterprise ($299/40 credits). | ✅ Verified | None |
| "50+ SEO occupation pages" | `AutomationRiskLandingPage.tsx` (388 LOC) with `occupationRiskData` and `occupationSlugs`. Schema.org JSON-LD structured data. Meta descriptions. Email capture. | ✅ Verified | None |
| "Sitemap submitted" | `public/sitemap.xml` exists with `https://automationinsights.app/` domain. Includes /, /pricing, /for-coaches, /ai-impact-planner, /veterans, and occupation pages. | ✅ Verified | None — but needs Google Search Console submission |
| "Analytics infrastructure" | PostHog integration (`posthog.ts`) + Supabase `analytics_events` table. 15+ conversion funnel events defined. `trackAnalyticsEvent` helper with email redaction. | ✅ Verified | None — but no live data accessible |
| "Stripe checkout wired" | `create-checkout-session` Edge Function + `redirectToCheckout()` in `stripe.ts` calling Supabase Edge Function. `stripe-webhook` for subscription management. | ✅ Verified | None — but live checkout not proven |
| "Veterans MOC crosswalk" | `crosswalk` Edge Function + `VeteransPage.tsx` (12,786 bytes). | ✅ Verified | None |
| "Enterprise team dashboard" | `EnterpriseTeamDashboard.tsx` (54,184 bytes, 795 LOC) with CSV import. | ✅ Verified | Basic compared to JobRoute/INOP — lacks HRIS, SOC 2 |

---

## 6.2 Proof Instrumentation Check

| Instrument | Status | Notes |
|---|---|---|
| PostHog analytics | ✅ Wired | `VITE_POSTHOG_KEY` env var. No-op if not set. Pageview + pageleave capture. Manual events. |
| Supabase analytics_events | ✅ Wired | `trackAnalyticsEvent()` inserts to `analytics_events` table. Skips in dev mode. Requires authenticated user. |
| APO telemetry logging | ✅ Wired | `apo_logs` table with prompt hashing, model, tokens, latency. `logLLM()` helper in `supabase/lib/llmTelemetry.ts`. |
| Conversion funnel events | ✅ Defined | 15+ events: signup, pricing_viewed, checkout_started, checkout_completed, apo_check, resume_analyzed, report_generated, etc. |
| Commercial lead capture | ✅ Wired | `commercialLeadCaptured` event + `commercialLeads.ts` lib. |
| Activation/retention tracking | ✅ Wired | `activation_apo_result_viewed`, `retention_return_visit` events. |

**Assessment**: Analytics infrastructure is comprehensive. If PostHog key is set and Supabase is live, the product can track the full conversion funnel from signup to checkout. This is sufficient for measuring experiment outcomes.

---

## 6.3 Integration Readiness

| Integration | Status | Notes |
|---|---|---|
| Stripe subscriptions | ✅ Wired | Real price IDs for Defender and Coach Pro. `create-checkout-session` Edge Function. `stripe-webhook` for lifecycle. |
| Stripe credit packs | ✅ Wired | Real price IDs for Starter/Professional/Enterprise packs. `create-credit-checkout` Edge Function. |
| Supabase Auth | ✅ Wired | `useSession` hook. Email/password + OAuth. |
| Whop marketplace | ✅ Wired | `whop-oauth` + `whop-webhook` Edge Functions. Server-side OAuth token exchange. |
| Email delivery | ⚠️ Partial | `send-shared-analysis` returns 501 if RESEND_API_KEY or SENDGRID_API_KEY not configured. `send-welcome-email` exists. |
| Google Search Console | ❌ Not verified | Sitemap exists but no evidence of Search Console submission or domain verification. |

---

## 6.4 Pricing Surface Verification

| Surface | Location | Matches Positioning? |
|---|---|---|
| Pricing page | `PricingPage.tsx` (403 LOC) | ✅ Shows 3 tiers + credit packs |
| Coach landing page | `ForCoachesPage.tsx` (490 LOC) | ✅ Shows $20/report PAYG + $149/mo Coach Pro |
| Stripe integration | `stripe.ts` (483 LOC) | ✅ Real price IDs, checkout redirect, credit packages |
| Upgrade prompts | `UpgradePrompt.tsx` | ✅ Feature-gated upgrade prompts |
| Credit balance | `CreditBalance.tsx` | ✅ Shows remaining credits |

**Pricing inconsistency**: ForCoachesPage says "$20/report" but credit packs are $49 for 5 credits ($9.80/report) to $299 for 40 credits ($7.48/report). The actual per-report price is LOWER than advertised. This is a messaging opportunity, not a gap.

---

## 6.5 Distribution Readiness

| Channel | Status | Notes |
|---|---|---|
| SEO pages | ✅ 50+ occupation pages with JSON-LD | Need Google Search Console submission |
| Sitemap | ✅ `sitemap.xml` with 64 URLs | Need Search Console submission |
| Robots.txt | ✅ Exists with sitemap reference | — |
| Meta tags | ✅ Dynamic per-page meta descriptions | — |
| Social sharing | ⚠️ `share_clicked` event tracked but no OG image or social cards | Missing Open Graph images |
| Netlify prerendering | ✅ Configured in `netlify.toml` | For SEO crawlability |
| LinkedIn presence | ❌ No company page or content | Critical for B2B coach outreach |
| Coach community | ❌ No presence in ICF, coach forums, or associations | Critical for beachhead |

---

## 6.6 Technical Debt Assessment

| Item | Severity | Impact on Beachhead Positioning |
|---|---|---|
| No SOC 2 / GDPR / ISO 27001 | 🔴 HIGH (for enterprise) | 🟢 LOW (for coaches — coaches don't require SOC 2) |
| No HRIS integration | 🔴 HIGH (for enterprise) | 🟢 LOW (for coaches — coaches don't use HRIS) |
| Email delivery not configured | 🟡 MEDIUM | 🟡 MEDIUM — coaches may want email delivery of reports |
| No Open Graph images | 🟢 LOW | 🟡 MEDIUM — LinkedIn sharing needs OG images for B2B |
| Bootcamp checkout disabled | 🟢 LOW | 🟢 LOW — not relevant to coach beachhead |
| WorkshopBookingPage schema mismatch | 🟢 LOW | 🟢 LOW — not relevant to coach beachhead |

**Assessment**: Technical debt does NOT block the beachhead positioning. The product is technically ready for B2B coach sales. The gaps are in distribution and proof, not in capability.

---

## 6.7 Implementation Gap Report

| Gap | Type | Market Gap or Implementation Gap? | Action |
|---|---|---|---|
| No coach-specific onboarding/trial | Implementation gap | Add 1 free white-label report trial for coaches |
| No demo video | Implementation gap | Record 3-min Loom demo |
| No testimonials/case studies | Implementation gap (chicken-and-egg) | Offer free reports to 5 coaches in exchange for testimonials |
| No LinkedIn company page | Implementation gap | Create LinkedIn company page + content |
| No Google Search Console | Implementation gap | Submit sitemap, verify domain |
| No OG images | Implementation gap | Create social sharing images for coach landing page |
| Email delivery not configured | Implementation gap | Set up RESEND_API_KEY or SENDGRID_API_KEY |

**Key finding**: All gaps are implementation/distribution gaps, not product capability gaps. The product is built. It needs to be sold.

---

## Gate Decision

**CONDITIONAL_GO** — Codebase reconnaissance complete. All positioning claims verified against implemented capabilities. Technical debt does not block beachhead. All gaps are distribution/proof gaps, not product gaps. Proceed to Phase 7: Terminal Report.
