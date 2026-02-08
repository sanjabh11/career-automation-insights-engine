# Complete UI/UX & Security Audit
**Date:** 2026-02-08  
**Auditor:** Cascade (Full-Stack Design & Security)  
**Scope:** Career Automation Insights Engine — all frontend pages, components, backend Edge Functions, auth flows, and deployment config.  
**Status:** ✅ **Implementation Complete** — Build passing, all tiers implemented.

## Implementation Summary

### Quick Wins (Q1-Q6) — ✅ All Done
| ID | Change | Status |
|----|--------|--------|
| Q1 | Deleted `src/App.css` (Vite boilerplate) | ✅ |
| Q2 | Removed `SecurityHeaders.tsx` no-op component from `App.tsx` | ✅ |
| Q3 | Added DOMPurify to `CounselorReportGenerator.tsx` — **CRITICAL XSS fix** | ✅ |
| Q4 | Removed `animate-pulse` from pricing tier highlight | ✅ |
| Q5 | Fixed `postMessage` wildcard `'*'` → `'https://whop.com'` | ✅ |
| Q6 | Added `mapAuthError()` to Auth page — sanitized error messages | ✅ |

### Theme Unification (T1-T11) — ✅ All Done
| ID | Change | Status |
|----|--------|--------|
| T1 | Rewrote `index.css` — new unified dark palette (#0C1222 base, #7C5CFC accent) | ✅ |
| T2 | Deleted `tokyo-night-fixes.css` (737 lines of `!important` overrides) | ✅ |
| T3 | Unified `APODashboard` + `SearchInterfacePremium` to dark theme | ✅ |
| T4 | Unified `AIImpactPlannerPage`, `Auth`, `CareerPlanningPage` to dark theme | ✅ |
| T5 | Updated `HeroSection` background/orbs to new palette | ✅ |
| T6 | Updated `NavigationPremium` (desktop + mobile) to new palette | ✅ |
| T7 | Updated `tailwind.config.ts` — 2 fonts only, tighter container | ✅ |
| T8 | Updated HeroSection filter chips, CTAs, feature cards, scroll indicator | ✅ |
| T9 | Updated `Index.tsx` background to CSS variable | ✅ |
| T10 | Updated 16 remaining light-theme pages (Pricing, UserDashboard, Help, Whop, etc.) | ✅ |
| T11 | Added `@layer components` overrides mapping 509 light-class refs across 69 components | ✅ |

### Security Hardening (SEC1-SEC3) — ✅ All Done
| ID | Change | Status |
|----|--------|--------|
| SEC1 | Created `supabase/functions/whop-oauth/index.ts` Edge Function; removed `VITE_WHOP_CLIENT_SECRET` from frontend — **CRITICAL** | ✅ |
| SEC2 | Removed `'unsafe-eval'` from CSP in `netlify.toml` and `public/_headers` | ✅ |
| SEC3 | Removed EconImporter API key from `localStorage` persistence | ✅ |

### Files Changed
- **Deleted:** `src/App.css`, `src/styles/tokyo-night-fixes.css`
- **Created:** `supabase/functions/whop-oauth/index.ts`, `docs/delivery/UI_UX_SECURITY_AUDIT.md`
- **Modified:** `src/index.css`, `src/App.tsx`, `tailwind.config.ts`, `netlify.toml`, `public/_headers`, `src/integrations/whop/client.ts`, `src/components/HeroSection.tsx`, `src/components/NavigationPremium.tsx`, `src/components/APODashboard.tsx`, `src/components/SearchInterfacePremium.tsx`, `src/components/CounselorReportGenerator.tsx`, `src/pages/Index.tsx`, `src/pages/Auth.tsx`, `src/pages/AIImpactPlannerPage.tsx`, `src/pages/CareerPlanningPage.tsx`, `src/pages/PricingPage.tsx`, `src/pages/UserDashboardPage.tsx`, `src/pages/AIImpactPage.tsx`, `src/pages/api-health.tsx`, `src/pages/HelpPage.tsx`, `src/pages/ConfidenceTimelinePredictions.tsx`, `src/pages/AutomationRiskLandingPage.tsx`, `src/pages/WorkshopBookingPage.tsx`, `src/pages/EconImporter.tsx`, `src/pages/whop/ExperiencePage.tsx`, `src/pages/whop/DashboardPage.tsx`, `src/pages/whop/DiscoverPage.tsx`, `src/contexts/WhopAppContext.tsx`
- **Installed:** `dompurify`, `@types/dompurify`

### Deployment Note
After deploying, set these **server-side** env vars on Supabase for the new `whop-oauth` Edge Function:
- `WHOP_CLIENT_ID` — your Whop OAuth client ID
- `WHOP_CLIENT_SECRET` — your Whop OAuth client secret (no longer in frontend!)

---

---

## Phase 1: Application Overview & Core Functionality

### 1.1 Primary Purpose
A **career defense platform** that calculates an **Automation Potential of Occupations (APO) score** for 1,016+ O*NET occupations. It tells users how likely their job is to be automated by AI and provides actionable skill-bridge pathways to safer roles.

### 1.2 Core User Journey
1. Land on homepage → see fear-based hook ("Don't Let AI Retire You")
2. Search for an occupation (or browse by category)
3. Receive APO score with category breakdowns (tasks, skills, knowledge, abilities, technologies)
4. Explore detailed analysis: confidence intervals, timeline projections, economic signals
5. Use Career Impact Planner / Skill Adjacency Graph to find bridge roles
6. Optionally sign up / subscribe for deeper features

### 1.3 Hero Feature (Single Most Important)
**The APO Score Calculation** — the entire app's USP. A user types an occupation, the backend calls Gemini with O*NET-grounded data, and returns a deterministic, weighted automation risk score with confidence bands.

### 1.4 All Routes (40+ routes, many are low-traffic)

| Route | Purpose | Priority |
|-------|---------|----------|
| `/` | Homepage: Hero + APO Dashboard | **Critical** |
| `/ai-impact-planner` | Career Impact Planner (search, task assessment, skills) | **Critical** |
| `/auth` | Sign In / Sign Up | **High** |
| `/dashboard` | User dashboard (saved analyses, usage) | **High** |
| `/pricing` | Subscription tiers | **High** |
| `/tools/skill-adjacency` | Skill adjacency graph explorer | **High** |
| `/tools/bridge-roles` | Bridge role pathway finder | **Medium** |
| `/tools/resume-analyzer` | Resume analysis tool | **Medium** |
| `/tools/counselor-reports` | Counselor report generator | **Medium** |
| `/occupation/:code` | Individual occupation detail | **Medium** |
| `/browse/bright-outlook` | Browse bright outlook careers | **Medium** |
| `/browse/stem` | Browse STEM careers | **Medium** |
| `/browse/job-zones` | Browse by job zone | **Low** |
| `/crosswalk` | Occupation crosswalk | **Low** |
| `/veterans` | Veterans transition tool | **Low** |
| `/tech-skills` | Tech skills explorer | **Low** |
| `/work-dimensions` | Work dimensions browser | **Low** |
| `/career-planning` | Career planning dashboard | **Low** |
| `/gap-analysis` | Gap analysis | **Low** |
| `/validation`, `/outcomes`, `/quality`, `/responsible-ai` | Evidence/transparency pages | **Low** |
| `/industry` | Industry dashboard | **Low** |
| `/economics` | Economics browser | **Low** |
| `/workshops`, `/bootcamp-dashboard`, `/enterprise-dashboard` | B2B/monetization pages | **Low** |
| `/whop/*` | Whop embedded app routes | **Low** |
| `/for-coaches` | B2B landing page | **Low** |
| `/automation-risk/:occupation` | SEO landing pages | **Medium** |
| `/demo` | Demo sandbox | **Low** |
| `/econ-importer` | Admin: economic data importer | **Internal** |
| `/test` | Test page | **Internal** |

**Verdict:** Too many routes for a focused product. ~15 routes are essential; the rest dilute the experience and create maintenance burden.

### 1.5 Current Visual Style

- **Dominant colors:** Dark slate base (`#0F172A`), indigo-purple accent (`#6366F1` / `#A855F7`), semantic risk colors (emerald/amber/red)
- **Typography:** Space Grotesk (body), Playfair Display (display/unused), Inter (UI fallback), JetBrains Mono (data)
- **Layout:** Full-width dark theme with glass-morphism cards, atmospheric background with animated grid overlay, 3-column desktop layout on dashboard
- **Overall aesthetic:** "Cosmic Dashboard 2025" — ambitious dark theme with layered glass effects. However it suffers from:
  - **Schizophrenic theming**: Homepage is dark (`#0F172A`), but APODashboard immediately switches to light (`from-slate-50 to-blue-50`), then Planner page is also light. This creates jarring theme transitions.
  - **CSS override warfare**: `tokyo-night-fixes.css` (737 lines) uses aggressive `!important` overrides with wildcard selectors like `[class*="card"]` that break component-level styling
  - **Font overload**: 4 font families loaded (2+ never visually prominent)
  - **Vite boilerplate still present**: `App.css` contains default Vite template CSS (logo spin animation, etc.)

---

## Phase 2: Page-by-Page UI/UX Audit

### 2.1 Homepage (`/` — Index.tsx → HeroSection.tsx → APODashboard.tsx)

**Current layout:**
- Fixed transparent nav → scrolls to glass effect
- Full-viewport hero with cosmic background, gradient orbs, grid overlay
- Badge: "Career Defense Platform"
- Headline: "Don't Let AI / Retire You."
- Stats bar (1,016 occupations, 35,000+ skills, 768-dim embeddings)
- Search bar with "Analyze" button
- Quick filter chips (Bright Outlook, STEM, Tech Skills)
- Two CTAs: "Calculate My Risk Score" (amber-red gradient) + "Find My Ghost Paths" (emerald outline)
- Three feature cards below divider
- Scroll indicator
- Then: APODashboard component with completely different light theme

**Core function prominence:** ★★★☆☆ (3/5)
The search bar exists but competes with two other CTAs, filter chips, and stats. The "Calculate My Risk Score" button navigates to `/ai-impact-planner` rather than triggering an inline calculation, which is confusing because there's also a search bar that does... the same thing but differently.

**Critique:**
- **Theme collision**: Hero is dark cosmic; scroll 1vh and you hit a white/light-blue APODashboard. This is the #1 visual problem.
- **"768-dim AI Embeddings" stat**: Meaningless to target users. This is developer vanity, not user value.
- **Two competing search paths**: Hero search → navigates to planner. Dashboard search → inline results. Users don't know which to use.
- **"Find My Ghost Paths"**: Clever but cryptic. New users won't understand what this means.
- **CTA color conflict**: Primary CTA is amber-red (danger color in the app's own risk palette). This sends mixed emotional signals.
- **Feature cards below fold**: "Evidence-Driven", "ROI-Aware", "Actionable" — generic and not scannable.

**Stunning score: 5/10** — The dark cosmic aesthetic has promise, but the theme split and competing interactions kill the experience.

### 2.2 APO Dashboard (scrolled section of `/`)

**Current layout:** Light theme (`from-slate-50 to-blue-50`), 3-column grid:
- Left: Search panel (white card), Selected Careers, Top Careers
- Center: Career Impact Planner link card, Executive Summary, Detailed Analysis, Job Market
- Right: Contextual sidebar (hidden on <xl)

**Critique:**
- **Jarring theme switch**: Going from cosmic dark to corporate light feels like two different apps.
- **SearchInterfacePremium wraps SearchInterface** in a gradient-bordered white card — this is light theme styling that clashes with the dark override CSS
- **OnboardingTour + GuidedTour**: Two separate onboarding mechanisms on the same page
- **3-column layout at xl+**: Content density is good but the right sidebar is hidden below 1280px, losing context for most users
- **"Open Planner" button**: Duplicates the hero CTA; users who scrolled past the hero find a third way to do the same thing
- **Card-within-card nesting**: Multiple ErrorBoundary wrappers create visual nesting artifacts

**Stunning score: 4/10** — Functional but visually incoherent with the hero above it.

### 2.3 Career Impact Planner (`/ai-impact-planner`)

**Current layout:** Light theme (`from-slate-50 via-blue-50 to-purple-50`), sticky header with "Back to Home" button, then the large AIImpactPlanner component.

**Critique:**
- **No navigation bar**: Just a lonely "Back to Home" button. Users lose all site context.
- **Background matches nothing**: Yet another gradient variant that doesn't match hero or dashboard
- **The planner itself**: A massive monolithic component with many local states. The UX within depends on that component's internal design.

**Stunning score: 3/10** — Feels like a disconnected tool page, not part of a cohesive app.

### 2.4 Auth Page (`/auth`)

**Current layout:** Centered card on light gradient background (`from-slate-50 to-blue-50`), simple email/password form.

**Critique:**
- **No branding**: No logo, no app name, no value proposition. Could be any app's login page.
- **No password requirements shown**: User gets no feedback on password strength
- **No "Forgot Password" link**: Critical missing feature
- **Error display is raw text**: `err?.message` directly from Supabase (could leak internal details)
- **Light theme again**: Third different theme in the app
- **No social login options visible**: Only email/password

**Stunning score: 2/10** — Bare minimum auth form with zero brand identity.

### 2.5 Pricing Page (`/pricing`)

**Current layout:** Uses shadcn variable-based theming (HSL vars), 4-column card grid, billing toggle, enterprise CTA, FAQ section.

**Critique:**
- **Uses `bg-gradient-to-b from-background to-muted/20`**: This resolves to the dark theme vars in index.css, which means it renders on dark background — at least consistent with the hero
- **4-column grid on desktop**: Cramped for pricing cards with feature lists
- **Highlighted tier has `animate-pulse`**: Distracting and amateurish; pulsing pricing cards feel like a scam
- **FAQ section is unstyled**: Plain text with no accordion, poor visual hierarchy

**Stunning score: 4/10** — Structurally sound but lacks polish and has the pulse animation problem.

### 2.6 Occupation Detail (`/occupation/:code`)

A dynamic detail page for individual occupations. Fetches APO data on load.

**Stunning score: 4/10** — Functional but shares the theme inconsistency issues.

### 2.7 Tool Pages (`/tools/*`)

The Skill Adjacency Graph, Bridge Roles, Resume Analyzer, and Counselor Reports are standalone tools with varying levels of UI polish.

**Stunning score: 3/10** — Inconsistent styling, no unified tool chrome.

---

## Phase 3: Global Visual Design & Color Scheme Overhaul

### 3.1 The Core Problem
The app has **three competing themes**:
1. **Cosmic Dark** (hero, pricing) — `#0F172A` base with indigo/purple glass
2. **Corporate Light** (dashboard, planner, auth) — white/slate-50/blue-50 gradients
3. **Override Layer** (`tokyo-night-fixes.css`) — 737 lines of `!important` rules that try to force everything dark but break component-level styling

**Recommendation: Commit to ONE theme.** Given the product's identity as a "Career Defense Platform" with risk-aware data visualization, **a refined dark theme is the right choice**. It makes data visualizations pop, conveys seriousness, and aligns with the hero's emotional tone.

### 3.2 Proposed Color Palette

```
PRIMARY PALETTE
─────────────────────────────────────────
Background (base):     #0C1222   (deeper, less blue than current #0F172A)
Surface (cards):       #151D2E   (subtle elevation, not glass-heavy)
Surface elevated:      #1C2640   (modals, popovers)
Border:                #2A3550   (subtle, not indigo-tinted)

TEXT
─────────────────────────────────────────
Primary text:          #E8ECF4   (slightly warm white, easier on eyes)
Secondary text:        #8B95A8   (readable muted)
Tertiary/disabled:     #4A5568   (clear hierarchy)

ACCENT (Brand)
─────────────────────────────────────────
Primary accent:        #7C5CFC   (warmer purple, distinct from generic indigo)
Primary hover:         #9B7FFF
Primary muted:         rgba(124, 92, 252, 0.12)

SEMANTIC (Risk)
─────────────────────────────────────────
Low risk / Success:    #34D399   (emerald-400, ✓ keep)
Medium risk / Warning: #FBBF24   (amber-400, ✓ keep)
High risk / Danger:    #F87171   (red-400, ✓ keep)
Info:                  #60A5FA   (blue-400, ✓ keep)

CHART PALETTE (5-color)
─────────────────────────────────────────
1: #7C5CFC   (brand purple)
2: #34D399   (emerald)
3: #FBBF24   (amber)
4: #F87171   (red)
5: #60A5FA   (blue)
```

### 3.3 Typography

**Reduce to 2 fonts** (currently loading 4):
- **Heading + UI:** `Inter` (already loaded, excellent for data-heavy UIs)
- **Data/Mono:** `JetBrains Mono` (APO scores, code, numbers)

**Remove:** `Space Grotesk` (redundant with Inter), `Playfair Display` (serif feels misplaced in a data platform)

**Scale:**
```
Display (hero):    3rem / 48px / font-bold / Inter
H1:                2rem / 32px / font-semibold / Inter
H2:                1.5rem / 24px / font-semibold / Inter
H3:                1.25rem / 20px / font-medium / Inter
Body:              1rem / 16px / font-normal / Inter
Small/Caption:     0.875rem / 14px / font-normal / Inter
Data values:       var / font-bold / JetBrains Mono
```

### 3.4 Layout Improvements

- **Kill the 3-column dashboard layout**: Move to single-column focused flow with max-width 1200px. Show contextual panels as expandable sections, not a sidebar nobody sees.
- **Unified page chrome**: Every page gets the same nav + consistent dark background. No more naked "Back to Home" buttons.
- **Card design**: Drop glass-morphism (overused, performance-heavy). Use subtle surface elevation (`#151D2E`) with 1px border (`#2A3550`). Hover: slight border brightening + small shadow.
- **Spacing**: Increase vertical rhythm. Current cards are too dense. Use 24px/32px gaps between sections.

### 3.5 Signature Feel

**Target: "Linear meets Vercel" — clean, dark, data-rich, zero fluff.**

- Subtle fade-in animations (not bouncing/pulsing)
- No atmospheric backgrounds, grid overlays, or noise textures (performance drag, visual noise)
- Data visualizations should be the visual delight, not background effects
- Micro-interactions: button press scale, smooth number transitions for APO scores

---

## Phase 4: Interaction Design & Core Functionality Emphasis

### 4.1 Making the APO Score Impossible to Miss

**Current problem:** Three competing entry points (hero search, hero CTA, dashboard search) that all do slightly different things.

**Proposed fix:**
1. **ONE search bar**, prominently centered on the homepage, that performs inline search + calculation
2. Remove the "Calculate My Risk Score" CTA (it just navigates to planner)
3. Remove "Find My Ghost Paths" CTA from hero (move to post-analysis recommendations)
4. When user searches: results appear inline below the search bar, clicking an occupation triggers APO calculation, results render below — **all on the same page, same theme**

### 4.2 Button Hierarchy

```
PRIMARY ACTION (1 per screen):
  bg: #7C5CFC → hover: #9B7FFF
  text: white, font-semibold
  height: 44px, rounded-xl, px-6
  hover: translateY(-1px) + shadow
  Example: "Analyze", "Get Started", "Subscribe"

SECONDARY ACTION:
  bg: transparent, border: 1px solid #2A3550
  text: #8B95A8 → hover: #E8ECF4
  height: 40px, rounded-lg, px-4
  Example: "View Details", "Compare", "Export"

GHOST/TERTIARY:
  bg: transparent, no border
  text: #8B95A8 → hover: #E8ECF4
  height: 36px, rounded-md, px-3
  Example: "Cancel", "Skip", "Back"

DESTRUCTIVE:
  bg: rgba(248, 113, 113, 0.1), border: 1px solid rgba(248, 113, 113, 0.3)
  text: #F87171
  Example: "Remove", "Delete"
```

### 4.3 Forms & States

- **Empty states**: Show illustration + clear CTA ("Search for an occupation to see its automation risk")
- **Loading states**: Skeleton shimmer matching card dimensions (not centered spinner)
- **Error states**: Inline error banners with retry button, not raw error strings
- **Search results**: Show occupation code, title, and brief description. Highlight match terms.

### 4.4 Mobile Responsiveness

- **Current**: Generally responsive (Tailwind breakpoints used), but hero is 85vh+ min-height which pushes content far down on mobile
- **Fixes needed:**
  - Hero: max 70vh on mobile, reduce stats to 2 items
  - Dashboard: single column, cards full-width
  - Nav: mobile menu is functional but needs better touch targets (currently 48px, good)
  - Tool pages: need mobile-specific layouts for graph visualizations

### 4.5 Accessibility

**Good (already present):**
- Skip-to-content link
- `role="search"` on search bar
- `aria-label` on inputs
- Keyboard Enter for search submission

**Needs improvement:**
- Contrast ratios: `#64748B` (tertiary text) on `#0F172A` = 4.0:1 (fails WCAG AA for small text, needs to be 4.5:1+). Use `#6B7A90` instead.
- Many interactive elements lack visible focus indicators (relying on browser defaults)
- Charts/graphs have no text alternatives
- `dangerouslySetInnerHTML` in CounselorReportGenerator renders LLM output without sanitization (see Security section)
- Risk color badges rely solely on color (need icon/text supplements for colorblind users)

---

## Phase 5: Security Audit

### 5.1 CRITICAL Findings

#### S1: OAuth Client Secret Exposed in Frontend (CRITICAL)
**File:** `src/integrations/whop/client.ts:14`
```typescript
const WHOP_CLIENT_SECRET = import.meta.env.VITE_WHOP_CLIENT_SECRET || '';
```
The Whop OAuth `client_secret` is loaded via a `VITE_` prefixed env var, which means **Vite bundles it into the client-side JavaScript**. Anyone can extract it from the browser's source.

**Impact:** Full OAuth token forgery; attacker can impersonate the app and exchange auth codes.  
**Fix:** Move OAuth token exchange to a backend Edge Function. The client should only handle the redirect; the code-for-token exchange must happen server-side.

#### S2: XSS via `dangerouslySetInnerHTML` on LLM Output (CRITICAL)
**File:** `src/components/CounselorReportGenerator.tsx:431`
```tsx
<div dangerouslySetInnerHTML={{ __html: reportHtml }} />
```
The `reportHtml` is generated by an LLM (Gemini). If the LLM returns HTML containing `<script>` tags or event handlers (possible via prompt injection), this renders and executes them in the user's browser.

**Impact:** Stored XSS if reports are shared; session hijacking.  
**Fix:** Sanitize with DOMPurify before rendering:
```typescript
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reportHtml) }} />
```

#### S3: Whop Access Tokens Stored in localStorage (HIGH)
**File:** `src/contexts/WhopAuthContext.tsx:184`
```typescript
localStorage.setItem(WHOP_ACCESS_TOKEN_KEY, tokens.access_token);
localStorage.setItem(WHOP_REFRESH_TOKEN_KEY, tokens.refresh_token);
```
`localStorage` is accessible to any JavaScript on the same origin, including XSS payloads.

**Impact:** Token theft via XSS.  
**Fix:** Use `httpOnly` cookies set by a backend endpoint, or at minimum use `sessionStorage` (cleared on tab close). Combined with S2, this is especially dangerous.

### 5.2 HIGH Findings

#### S4: API Key Persisted in localStorage (HIGH)
**File:** `src/pages/EconImporter.tsx:65`
```typescript
localStorage.setItem('econImporter.apiKey', apiKey);
```
An API key is stored in plain text in localStorage and hydrated on page load. While the page is gated by environment check, the stored key persists.

**Impact:** Key exfiltration via XSS or physical access.  
**Fix:** Never persist API keys in localStorage. Require re-entry or use server-side proxy.

#### S5: CSP Allows `unsafe-eval` (HIGH)
**File:** `netlify.toml:43` and `public/_headers:6`
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' ...
```
`unsafe-eval` allows `eval()`, `new Function()`, and similar. This weakens CSP significantly.

**Impact:** Makes XSS exploitation easier if an injection point exists.  
**Fix:** Remove `unsafe-eval`. If a library needs it (e.g., some Stripe.js versions), use a nonce-based CSP or hash-based approach. Test thoroughly after removal.

#### S6: Whop postMessage to Wildcard Origin (HIGH)
**File:** `src/contexts/WhopAppContext.tsx:216`
```typescript
window.parent.postMessage({ type: 'WHOP_APP_READY' }, '*');
```
Sending messages to `*` means any parent frame can receive them. While incoming messages are origin-checked, outgoing messages should target `https://whop.com` specifically.

**Impact:** Information leakage if embedded in malicious iframe.  
**Fix:** `window.parent.postMessage({ type: 'WHOP_APP_READY' }, 'https://whop.com');`

#### S7: Open Redirect via URL Parameters (HIGH)
**File:** `src/contexts/WhopAppContext.tsx:117-118`
```typescript
const tokenFromUrl = urlParams.get('user_token');
if (tokenFromUrl) return tokenFromUrl;
```
A `user_token` from URL parameters is trusted and stored in sessionStorage. An attacker could craft a URL with a malicious token.

**Impact:** Session fixation attack.  
**Fix:** Validate the token format and verify it server-side before trusting it.

### 5.3 MEDIUM Findings

#### S8: Raw Error Messages Exposed to Users (MEDIUM)
**File:** `src/pages/Auth.tsx:86`
```typescript
setError(err?.message || "Failed to authenticate.");
```
Supabase auth error messages may include internal details like "Invalid login credentials" (which confirms account existence) or rate limit internals.

**Fix:** Map known error codes to user-friendly messages. Never pass raw error.message to UI.

#### S9: No CSRF Protection on Form Submissions (MEDIUM)
Auth form and other POST actions rely solely on Supabase's built-in protections. While Supabase handles CSRF for its auth endpoints, any custom API calls lack CSRF tokens.

**Fix:** For non-Supabase endpoints, add CSRF tokens or use SameSite=Strict cookies.

#### S10: `SecurityHeaders` Component is a No-Op (MEDIUM)
**File:** `src/components/SecurityHeaders.tsx`
```typescript
export const SecurityHeaders = () => {
  return null;
}
```
This component does nothing but is imported in App.tsx, creating a false sense of security.

**Fix:** Remove the component entirely. Security headers are correctly handled at the Netlify level (`netlify.toml` + `_headers`). The dead component is misleading.

#### S11: `unsafe-inline` in CSP for Scripts (MEDIUM)
All CSP headers include `script-src 'self' 'unsafe-inline'`. This defeats much of CSP's XSS protection.

**Fix:** Migrate to nonce-based CSP. Tag inline scripts with `nonce` attributes generated per request.

#### S12: console.log in Production (MEDIUM)
Multiple files log sensitive data:
- `src/components/APODashboard.tsx:77`: `console.log('Selected occupation with enhanced APO data:', occupation);`
- `src/integrations/supabase/client.ts:49`: Logs env key presence
- Various Edge Functions log prompt hashes and model outputs

**Fix:** Strip `console.log` from production builds (use a Vite plugin or replace with a no-op logger).

### 5.4 LOW Findings

#### S13: App.css Contains Vite Boilerplate (LOW)
**File:** `src/App.css` — Contains default Vite template CSS (`logo-spin`, `#root max-width: 1280px`). The `#root` rule constrains layout width, potentially causing issues.

**Fix:** Delete `App.css` or strip to only app-specific rules.

#### S14: Email Validation is Client-Side Only (LOW)
**File:** `src/utils/inputSanitization.ts:44-46` — `validateEmail` regex is used client-side. Server-side validation depends on Supabase's own checks.

**Fix:** Acceptable for now since Supabase validates server-side, but document this dependency.

#### S15: No Rate Limiting UI Feedback on Auth (LOW)
The auth page has no rate limit indicator. Supabase has its own rate limiting but users get cryptic errors.

**Fix:** Show "Too many attempts, try again in X minutes" message.

---

## Phase 6: Prioritized Redesign & Implementation Plan

### Tier 1: Quick Wins (1-2 days, high impact)

| # | Change | Files | Impact |
|---|--------|-------|--------|
| Q1 | **Delete `App.css`** — Remove Vite boilerplate | `src/App.css`, `src/App.tsx` (remove import) | Fixes `#root` width constraint |
| Q2 | **Delete `SecurityHeaders.tsx`** — Remove no-op component | `src/components/SecurityHeaders.tsx`, `src/App.tsx` | Removes misleading code |
| Q3 | **Fix `dangerouslySetInnerHTML` XSS** — Add DOMPurify | `src/components/CounselorReportGenerator.tsx` | **Closes CRITICAL vuln** |
| Q4 | **Remove `animate-pulse` from pricing** | `src/pages/PricingPage.tsx:164` | Removes amateurish animation |
| Q5 | **Fix postMessage wildcard** | `src/contexts/WhopAppContext.tsx:216` | **Closes HIGH vuln** |
| Q6 | **Sanitize auth error messages** | `src/pages/Auth.tsx` | Prevents info leakage |

### Tier 2: Theme Unification (3-5 days, transformative)

| # | Change | Impact |
|---|--------|--------|
| T1 | **Rewrite `index.css`** — Consolidate to new palette, remove Playfair/Space Grotesk, simplify vars | Foundation for everything |
| T2 | **Delete `tokyo-night-fixes.css`** — Replace with proper dark-theme component styles | Removes 737 lines of `!important` overrides |
| T3 | **Unify APODashboard theme** — Remove `from-slate-50 to-blue-50`, use dark background | Fixes the #1 visual problem |
| T4 | **Unify Planner/Auth/CareerPlanning themes** — All dark | Complete visual coherence |
| T5 | **Add NavigationPremium to ALL pages** — Replace isolated "Back" buttons | Unified navigation |

### Tier 3: Security Hardening (2-3 days, critical)

| # | Change | Impact |
|---|--------|--------|
| SEC1 | **Move Whop OAuth to backend Edge Function** — Remove `VITE_WHOP_CLIENT_SECRET` | **Closes CRITICAL vuln** |
| SEC2 | **Move Whop tokens from localStorage to httpOnly cookies** | **Closes HIGH vuln** |
| SEC3 | **Remove `unsafe-eval` from CSP** | Hardens XSS protection |
| SEC4 | **Remove EconImporter API key from localStorage** | Closes HIGH vuln |
| SEC5 | **Add production console.log stripping** | Prevents info leakage |

### Tier 4: UX Polish (1 week)

| # | Change | Impact |
|---|--------|--------|
| U1 | **Simplify hero to ONE search input + ONE CTA** | Clear user path |
| U2 | **Remove "768-dim AI Embeddings" stat** — Replace with user-centric stat | Reduces confusion |
| U3 | **Add "Forgot Password" to auth** | Critical missing feature |
| U4 | **Add brand identity to auth page** | Professional feel |
| U5 | **Redesign pricing to 3-column** (remove 4th or make it a banner) | Better scannability |
| U6 | **Add skeleton loading states** — Replace spinner-only loading | Modern feel |
| U7 | **Improve accessibility contrast** — `#64748B` → `#6B7A90` for tertiary text | WCAG AA compliance |
| U8 | **Add colorblind-safe icons to risk badges** | Inclusive design |

### 6.1 Key Component Redesign: Unified CSS Variables

```css
/* New unified palette — replace entire :root in index.css */
:root {
  --bg-base: #0C1222;
  --bg-surface: #151D2E;
  --bg-elevated: #1C2640;
  --bg-hover: #232F47;
  
  --text-primary: #E8ECF4;
  --text-secondary: #8B95A8;
  --text-tertiary: #6B7A90;
  
  --accent: #7C5CFC;
  --accent-hover: #9B7FFF;
  --accent-muted: rgba(124, 92, 252, 0.12);
  --accent-border: rgba(124, 92, 252, 0.25);
  
  --success: #34D399;
  --warning: #FBBF24;
  --danger: #F87171;
  --info: #60A5FA;
  
  --border: #2A3550;
  --border-hover: #3A4A68;
  
  --radius: 0.75rem;
  --radius-sm: 0.5rem;
  --radius-lg: 1rem;
  
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.25);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.3);
  
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### 6.2 Key Component Redesign: Card System

```css
/* Replace glass-card / tokyo-night card overrides with simple, consistent cards */
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
}

.card-elevated {
  background: var(--bg-elevated);
  box-shadow: var(--shadow-sm);
}
```

### 6.3 Key Component Redesign: Primary Button

```css
.btn-primary {
  background: var(--accent);
  color: white;
  font-weight: 600;
  font-family: var(--font-sans);
  padding: 0.625rem 1.5rem;
  border-radius: var(--radius);
  border: none;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(124, 92, 252, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}
```

---

## Phase 7: Final Recommendations

### 7.1 Transformed Experience Vision

After implementing all tiers, the app would feel like:
- **Unified dark theme** across every page — no jarring transitions
- **Single, clear user flow**: Search → See APO Score → Explore Details → Take Action
- **Clean card surfaces** instead of heavy glass-morphism
- **Professional auth** with branding and modern features
- **Secure** — no client-side secrets, no XSS vectors, proper CSP

### 7.2 Stunning Score Projection

| Area | Current | After |
|------|---------|-------|
| Homepage/Hero | 5/10 | 8/10 |
| APO Dashboard | 4/10 | 8/10 |
| Career Planner | 3/10 | 7/10 |
| Auth Page | 2/10 | 7/10 |
| Pricing | 4/10 | 8/10 |
| **Overall** | **3.5/10** | **7.5/10** |

### 7.3 Recommended Tools & Libraries

- **DOMPurify** — HTML sanitization (install immediately for S2 fix)
- **Remove:** `tailwindcss-animate` (replace with minimal CSS transitions)
- **Consider:** `@radix-ui/react-*` — already partially used via shadcn; standardize on it
- **Consider:** Removing `framer-motion` from non-critical paths (118KB gzipped) and using CSS animations for simple fade/slide
- **Linting:** Add `eslint-plugin-jsx-a11y` for accessibility checks
- **Fonts:** Remove Space Grotesk and Playfair Display from Google Fonts import (saves ~80KB)

### 7.4 Route Consolidation Recommendation

Reduce from 40+ routes to ~15 core routes. Many pages (economics browser, demo sandbox, econ importer, validation sub-pages) should be:
- Admin-only (behind auth gate)
- Combined into fewer pages with tabs
- Or removed entirely if unused

### 7.5 CSS Architecture Recommendation

1. Delete `src/styles/tokyo-night-fixes.css` (737 lines)
2. Delete `src/App.css` (43 lines of Vite boilerplate)
3. Rewrite `src/index.css` with the new palette (~200 lines max)
4. Let shadcn/Tailwind handle component styling via CSS variables
5. No more `!important` overrides — fix at the component level

---

## Questions for You

Before I begin implementing:

1. **Target audience**: Career changers? HR professionals? Both? This affects tone and complexity.
2. **Brand colors**: Are you attached to the indigo/purple palette, or open to the warmer `#7C5CFC` purple I proposed?
3. **Priority pages**: Shall I focus the redesign on Homepage + Dashboard + Auth first?
4. **Route pruning**: Should I flag routes for removal, or do you want to keep all 40+?
5. **Security priority**: Should I fix the CRITICAL Whop OAuth secret exposure first, or prioritize the visual overhaul?
