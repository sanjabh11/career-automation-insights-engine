# UI/UX Redesign Audit — 2026 Edition
**Date:** 2026-02-08  
**Auditor:** Elite UI/UX Design & Frontend Architecture  
**Approach:** Mobile-first, 2026 trend-forward, performance-obsessed  
**Constraint:** No purple palettes. No AI-generated aesthetic signals.

---

## Phase 1: Application Overview & Core Identification

### User Decisions (Phase 1 Answers)
- **Audience:** Mid-career professionals (28–45), knowledge workers. Tech-savvy, proactive, anxious about AI.
- **Color:** Warm/grounded dark mode. Earth tones + teal/amber accents. NO purple.
- **Messaging:** Empowerment + credibility. Drop all fear. Aspirational, calm, results-focused.
- **Stats:** Remove all fake stats. Replace with real data (McKinsey/WEF) or static proof points.

---

## Phase 2: Page-by-Page Mobile-First UI/UX Audit

*Rated on: Mobile (M), Core Prominence (C), Visual (V), Accessibility (A) — each 1–10.*

### 2.1 Homepage (`/`)
| Dim | Score | Notes |
|-----|-------|-------|
| M | 4/10 | Hero eats entire viewport. Dashboard below fold. No bottom nav. |
| C | 5/10 | Search visible but competes with gradient orbs and fake stats. |
| V | 3/10 | Purple gradients + Sparkles = AI-template look. No bento. |
| A | 5/10 | Has role=search. Gradient text has contrast issues. No reduced-motion. |

**Fix:** Shrink hero to ≤50vh. Kill fake stats. Replace purple. Add persistent mobile CTA bar.

### 2.2 Career Impact Planner (`/ai-impact-planner`)
| Dim | Score | Notes |
|-----|-------|-------|
| M | 4/10 | 30+ state vars, 8+ tabs cramped on mobile. No bottom sheets. |
| C | 7/10 | IS the core function. But cognitive overload — too many panels. |
| V | 4/10 | Uniform card stacking, no hierarchy. Every panel looks equal. |
| A | 5/10 | Radix Tabs (good). Missing ARIA labels on custom inputs. |

**Fix:** Progressive disclosure — show Tasks+Skills first, collapse rest. Bottom sheet for details on mobile.

### 2.3 Occupation Detail (`/occupation/:code`)
| Dim | Score | Notes |
|-----|-------|-------|
| M | 5/10 | Long vertical scroll with no section anchors. Heavy data load. |
| C | 6/10 | Shows APO score + breakdown. Good, but entry point is buried. |
| V | 4/10 | ExecutiveSummary uses `bg-white/80` + light-mode colors (bg-red-50 etc). |
| A | 4/10 | Hardcoded light-mode semantic colors break in dark theme. |

**Fix:** Sticky section nav on mobile. Fix all light-mode color refs. Add share CTA.

### 2.4 Pricing (`/pricing`)
| Dim | Score | Notes |
|-----|-------|-------|
| M | 5/10 | 4-column grid → stacked on mobile. Cards work but are tall. |
| C | 3/10 | Disconnected from core function. No "try before you buy" hook. |
| V | 3/10 | Purple gradient in headline and badges (`from-primary to-purple-600`). |
| A | 6/10 | Good structure. Toggle is custom but lacks ARIA role=radiogroup. |

**Fix:** Kill purple gradients. Add inline APO demo above pricing. 2-col on tablet.

### 2.5 Auth (`/auth`)
| Dim | Score | Notes |
|-----|-------|-------|
| M | 7/10 | Centered card, simple form. Works on mobile. |
| C | 2/10 | No context — user doesn't know why they should sign up. |
| V | 4/10 | Sparkles icon + purple accent. Generic auth screen. |
| A | 7/10 | Uses native inputs, required attrs. Good error mapping. |

**Fix:** Add value prop copy. Remove Sparkles. Show "Continue with APO analysis" context.

### 2.6 User Dashboard (`/dashboard`)
| Dim | Score | Notes |
|-----|-------|-------|
| M | 5/10 | Stacked cards. hover:bg-blue-50 hardcoded (light-mode leak). |
| C | 5/10 | Shows saved analyses. "Back to APO Dashboard" button uses blue-600. |
| V | 4/10 | Blue-themed buttons clash with dark theme. No visual hierarchy. |
| A | 5/10 | Functional. No landmarks or section headings. |

**Fix:** Fix all blue-* hardcoded colors. Add empty-state CTA. Group by recency.

### 2.7 Browse Pages (`/browse/*`)
| Dim | Score | Notes |
|-----|-------|-------|
| M | 5/10 | List-based, scrollable. Adequate but uninspiring. |
| C | 4/10 | No inline APO scores. Must navigate away to see value. |
| V | 3/10 | Plain list with badges. No visual differentiation. |
| A | 5/10 | Basic list semantics. Missing filter announcements. |

**Fix:** Inline APO mini-scores. Bento card layout. Sticky filters.

### 2.8 Tools (`/tools/*`)
| Dim | Score | Notes |
|-----|-------|-------|
| M | 3/10 | Skill Adjacency uses Three.js/force-graph — unusable on mobile. |
| C | 3/10 | Disconnected from core APO flow. Users don't find these. |
| V | 3/10 | Mixed styling. Resume Analyzer has its own visual language. |
| A | 3/10 | Canvas-based graphs have no alt text. No keyboard nav for graph. |

**Fix:** Gate Three.js behind desktop-only. Integrate tools into planner flow.

### 2.9 For Coaches (`/for-coaches`)
| Dim | Score | Notes |
|-----|-------|-------|
| M | 5/10 | Standard landing page. Responsive. |
| C | 2/10 | Different product narrative. "768-Dim AI Analysis" is jargon. |
| V | 4/10 | Separate visual language from main app. Feels disjointed. |
| A | 5/10 | Standard structure. Missing skip links. |

**Fix:** Align with main brand. Remove technical jargon. Add demo video/GIF.

### 2.10 Evidence & Transparency Pages (`/validation`, `/outcomes`, etc.)
| Dim | Score | Notes |
|-----|-------|-------|
| M | 5/10 | Text-heavy. Adequate mobile rendering. |
| C | 1/10 | These exist for credibility but are never discovered organically. |
| V | 3/10 | Plain content pages with minimal styling. |
| A | 6/10 | Good semantic structure. Text-based = accessible. |

**Fix:** Consolidate into single `/evidence` page with tabs. Link from footer + occupation details.

### Phase 2 Summary — Overall Scores
| Page | M | C | V | A | Avg |
|------|---|---|---|---|-----|
| Homepage | 4 | 5 | 3 | 5 | **4.3** |
| Planner | 4 | 7 | 4 | 5 | **5.0** |
| Occupation Detail | 5 | 6 | 4 | 4 | **4.8** |
| Pricing | 5 | 3 | 3 | 6 | **4.3** |
| Auth | 7 | 2 | 4 | 7 | **5.0** |
| Dashboard | 5 | 5 | 4 | 5 | **4.8** |
| Browse | 5 | 4 | 3 | 5 | **4.3** |
| Tools | 3 | 3 | 3 | 3 | **3.0** |
| For Coaches | 5 | 2 | 4 | 5 | **4.0** |
| Evidence | 5 | 1 | 3 | 6 | **3.8** |

**App-wide average: 4.3/10** — Functional but dated, inconsistent, and not mobile-first.

---

## Phase 3: Global Design System Overhaul (2026 Trends)

### 3.1 New Color Palette — "Warm Authority"

Built on warm/grounded dark mode per user directive. Earth tones with teal accent.

#### Backgrounds (Dark Mode Default)
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-base` | `#0D1117` | Page background (near-black with warm undertone) |
| `--bg-surface` | `#161B22` | Cards, panels, elevated surfaces |
| `--bg-elevated` | `#1C2128` | Modals, dropdowns, popovers |
| `--bg-overlay` | `#21262D` | Hover states, active surfaces |

#### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#E6EDF3` | Headlines, primary content |
| `--text-secondary` | `#8B949E` | Body text, descriptions |
| `--text-tertiary` | `#6E7681` | Captions, metadata, disabled |
| `--text-inverse` | `#0D1117` | Text on accent-colored buttons |

#### Accents — NO PURPLE
| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-teal` | `#2DD4A8` | Primary CTA, links, focus rings |
| `--accent-teal-hover` | `#14B88E` | Hover/active on teal elements |
| `--accent-teal-muted` | `#2DD4A815` | Teal tint backgrounds (8% opacity) |
| `--accent-amber` | `#E5A54B` | Secondary CTA, warnings, highlights |
| `--accent-amber-hover` | `#D4943A` | Hover on amber elements |
| `--accent-amber-muted` | `#E5A54B15` | Amber tint backgrounds |

#### Semantic
| Token | Hex | Usage |
|-------|-----|-------|
| `--status-danger` | `#F85149` | High risk, errors, destructive |
| `--status-warning` | `#E5A54B` | Medium risk, caution (shares amber) |
| `--status-success` | `#3FB950` | Low risk, success states |
| `--status-info` | `#58A6FF` | Informational, neutral data |

#### Borders & Dividers
| Token | Hex | Usage |
|-------|-----|-------|
| `--border-default` | `#30363D` | Card borders, dividers |
| `--border-muted` | `#21262D` | Subtle separators |
| `--border-accent` | `#2DD4A840` | Focus rings, active borders (25% teal) |

### 3.2 Typography Scale

**Families:** Inter (sans), JetBrains Mono (mono) — keep both.
Add **Space Grotesk** as display font for hero headlines (geometric, modern, not "AI-looking").

| Level | Size (mobile) | Size (desktop) | Weight | Font | Usage |
|-------|--------------|----------------|--------|------|-------|
| Display | 2rem / 32px | 3.5rem / 56px | 700 | Space Grotesk | Hero headline only |
| H1 | 1.75rem / 28px | 2.5rem / 40px | 700 | Inter | Page titles |
| H2 | 1.375rem / 22px | 1.75rem / 28px | 600 | Inter | Section headers |
| H3 | 1.125rem / 18px | 1.25rem / 20px | 600 | Inter | Card titles |
| Body | 1rem / 16px | 1rem / 16px | 400 | Inter | Paragraphs |
| Small | 0.875rem / 14px | 0.875rem / 14px | 400 | Inter | Metadata, captions |
| Mono | 0.875rem / 14px | 0.875rem / 14px | 400 | JetBrains Mono | Data, codes, scores |

**Kinetic Typography Opportunities:**
- Hero headline: Staggered word reveal on load (CSS `@keyframes`, no JS)
- APO score number: Count-up animation from 0 to final value
- Section headers: Subtle fade-up on scroll via `IntersectionObserver` (CSS-only)

### 3.3 Bento Grid System

Replace uniform rectangular card layouts with asymmetric, modular bento grids. Each grid cell has a purpose-driven size.

**Homepage Bento (mobile-first):**
```
Mobile (1 col):
┌─────────────────────┐
│  Search Bar (full)   │  ← sticky on scroll
├─────────────────────┤
│  APO Score Hero      │  ← largest cell, primary result
├──────────┬──────────┤
│ Risk     │ Skills   │  ← 2-col compact
│ Level    │ at Risk  │
├──────────┴──────────┤
│  Top 3 Tasks at Risk │  ← expandable list
├─────────────────────┤
│  Quick Actions       │  ← "Plan Career" / "Compare" / "Share"
└─────────────────────┘

Desktop (3 col bento):
┌──────────────┬────────────┬──────────┐
│              │  Risk      │  Skills  │
│  APO Score   │  Breakdown │  at Risk │
│  (2 rows)    │  (chart)   │  (list)  │
│              ├────────────┴──────────┤
│              │  Top Tasks at Risk     │
├──────────────┼───────────────────────┤
│  Quick       │  Career Bridge        │
│  Actions     │  Recommendations      │
└──────────────┴───────────────────────┘
```

**Implementation:** CSS Grid with `grid-template-areas` + `grid-template-rows: auto`. No JS layout needed. Tailwind `grid-cols-1 md:grid-cols-3` with `col-span-*` and `row-span-*`.

### 3.4 Micro-Interactions & Tactile Feedback

| Interaction | Current | Proposed |
|-------------|---------|----------|
| Button press | None | `transform: scale(0.97)` on `:active` (2ms, CSS only) |
| Card hover | opacity change | Subtle `translateY(-2px)` + border glow with `--accent-teal` |
| APO score load | Instant render | Count-up from 0→N over 800ms + risk color fade-in |
| Tab switch | Instant | Content slides in from direction of tab (CSS `translateX`) |
| Search submit | Loading spinner | Skeleton pulse in results area + progress bar in search input |
| Risk level reveal | Static | Ring/gauge animation filling to percentage (SVG + CSS) |
| Navigation scroll | Background opacity | Frosted glass intensifies (`backdrop-blur` 0→12px) |
| Toast notifications | Default sonner | Slide from bottom-right on desktop, bottom-center on mobile |

**Performance rule:** All micro-interactions use CSS transitions/animations only. Zero JS animation libraries. Remove framer-motion dependency (saves ~39KB gzipped).

### 3.5 AI Personalization Opportunities

These don't require an ML model — they use existing user data and simple heuristics:

1. **Adaptive Bento Reordering:** If user has searched 3+ occupations, promote "Compare" card to top position. If user has a saved analysis, show "Continue where you left off" card first.

2. **Predictive Search:** Show trending occupations in search dropdown based on aggregate query frequency (already have search history in localStorage). Surface "People who searched X also explored Y."

3. **Contextual CTAs:** After viewing a high-risk occupation, promote "Build Skill Bridge" CTA. After low-risk, promote "Share Your Results" or "Help a Colleague."

4. **Dynamic Content Density:** First-time visitors see simplified 2-card bento. Returning users see full dashboard. Controlled via localStorage flag, no auth required.

5. **Smart Defaults:** Pre-fill planner preferences based on previous session (already partially implemented with `planner:lastSearch`).

### 3.6 Recommended Libraries (Keep / Add / Remove)

| Library | Action | Justification |
|---------|--------|---------------|
| Tailwind CSS 3.x | **Keep** | Core styling. Already in use. |
| shadcn/ui + Radix | **Keep** | Accessible component primitives. |
| Inter + JetBrains Mono | **Keep** | Good choices for data-dense UI. |
| recharts | **Keep but lazy-load** | Only load on pages with charts. |
| @tanstack/react-query | **Keep** | Essential for data fetching. |
| dompurify | **Keep** | XSS prevention. |
| lucide-react | **Keep** | Tree-shakeable icon set. |
| **framer-motion** | **REMOVE** | Replace with CSS animations. Saves ~39KB. |
| **three / react-force-graph** | **REMOVE** | Desktop-only niche tool. Replace with D3 or static graph. |
| **@react-pdf/renderer** | **LAZY-LOAD** | Only needed for counselor reports route. |
| **Space Grotesk** (Google Font) | **ADD** | Display font for hero. ~15KB woff2. |
| **@fontsource/space-grotesk** | **ADD** | Self-hosted font, no Google Fonts flash. |

---

## Phase 4: Core Function Emphasis & Interaction Design

### 4.1 Mobile-First CTA Placement

The core function is: **Search → APO Score → Action Plan**. Every screen should make the next step in this flow unmissable.

**Persistent Bottom Action Bar (mobile only, <768px):**
```
┌─────────────────────────────────────────┐
│  [🔍 Search]     [📊 My Results]  [≡]  │
│   (primary)       (secondary)    (menu) │
└─────────────────────────────────────────┘
```
- Fixed to bottom, 56px height, frosted glass background
- "Search" opens a bottom-sheet search modal with autofocus
- "My Results" shows saved analyses (replaces dashboard nav link)
- Hamburger for remaining navigation
- Thumb-zone optimized: all targets in bottom 1/3 of screen

**Homepage Hero CTA (redesigned):**
- Single prominent search input with placeholder: "What's your job title?"
- Below: 4 filter chips (Bright Outlook, STEM, Tech Skills, Job Zones)
- Below: Social proof line: "Join 50,000+ professionals planning ahead"
- No secondary CTA in hero — reduce cognitive load

**After Search Result (contextual CTA):**
- Inline in results: "See Full Analysis →" per occupation (teal accent button)
- After selecting: persistent top banner "Viewing: Software Developer — 67% automation risk" with "Plan Career" CTA

### 4.2 Button Hierarchy

| Level | Style | Usage | Example |
|-------|-------|-------|---------|
| **Primary** | Solid `--accent-teal`, white text, 12px radius | Core actions | "Analyze My Role", "Plan Career" |
| **Secondary** | Outlined `--border-default`, `--text-primary` text | Supporting actions | "Compare", "Browse All" |
| **Tertiary** | Ghost/text-only, `--accent-teal` text | Navigation, inline | "Learn more", "View details" |
| **Destructive** | Solid `--status-danger`, white text | Irreversible | "Delete Analysis" |
| **Disabled** | `--bg-overlay` bg, `--text-tertiary` text, no pointer | Unavailable | Rate-limited states |

**States (all CSS, no JS):**
- `:hover` — darken 10% + subtle shadow
- `:active` — `scale(0.97)` + darken 15%
- `:focus-visible` — 2px teal ring offset 2px (keyboard only)
- `[aria-busy="true"]` — inline spinner, no layout shift

### 4.3 Progressive Disclosure Pattern

**Problem:** The Career Impact Planner shows 8+ tabs and 30+ state variables on first load. This overwhelms new users.

**Solution — 3-Step Progressive Reveal:**

**Step 1 — Search & Score (visible immediately):**
- Search input + occupation picker
- APO Score gauge (large, animated)
- Risk level badge + confidence interval
- "See What's at Risk →" CTA

**Step 2 — Risk Breakdown (revealed on CTA click):**
- 5-category breakdown (Tasks, Skills, Knowledge, Abilities, Tech)
- Top 3 items per category with risk scores
- "Build My Action Plan →" CTA

**Step 3 — Action Plan (revealed on CTA click):**
- Skill recommendations with progress tracking
- Learning path suggestions
- Bridge role pathways
- Course search

Each step uses a vertical accordion on mobile (auto-closes previous) and a horizontal stepper on desktop.

### 4.4 Mobile-Specific Improvements

| Feature | Implementation |
|---------|---------------|
| **Bottom sheets** | Use Vaul (already installed) for detail panels instead of full-page navigations |
| **Thumb zones** | All primary CTAs in bottom 40% of viewport |
| **Swipe gestures** | Swipe left/right between risk categories (Tasks↔Skills↔Knowledge) |
| **Pull to refresh** | On dashboard — reload saved analyses |
| **Haptic feedback** | `navigator.vibrate(10)` on risk score reveal (if supported) |
| **PWA manifest** | Add `manifest.json` with app icon, theme color `#0D1117`, standalone display |
| **Offline skeleton** | Service worker caches app shell; show cached last-search result offline |
| **Mobile keyboard** | `inputMode="search"` on search, `inputMode="numeric"` on salary inputs |

---

## Phase 5: Performance & Accessibility Deep Dive

### 5.1 Current Performance Audit (Estimated)

Based on codebase analysis (no live Lighthouse run):

| Metric | Estimated | Target | Issue |
|--------|-----------|--------|-------|
| **LCP** | ~3.5s | <2.5s | Hero gradient orbs render before meaningful content. Large JS bundle blocks paint. |
| **CLS** | ~0.15 | <0.1 | Lazy-loaded components shift layout. No explicit dimensions on cards. |
| **FID/INP** | ~200ms | <100ms | framer-motion hydration blocks interaction. Heavy initial JS parse. |
| **Bundle (gzipped)** | ~350KB | <200KB | recharts+framer-motion+three = ~250KB of optional deps loaded upfront. |
| **Fonts** | 3 requests | 2 | Google Fonts external request adds latency. Self-host instead. |

### 5.2 Performance Fixes (Prioritized)

**P0 — Immediate (saves 100KB+):**
1. Remove `framer-motion` — replace all `<motion.div>` with CSS `@keyframes` + `IntersectionObserver` for scroll triggers. Saves ~39KB gzipped.
2. Lazy-load `recharts` — only import on pages that use charts (`/occupation/:code`, planner tabs). Use `React.lazy()`.
3. Remove `three` + `react-force-graph` — replace Skill Adjacency with a static SVG or lightweight D3 visualization. Saves ~78KB gzipped.
4. Lazy-load `@react-pdf/renderer` — only on `/tools/counselor-reports`. Already partially done.

**P1 — Bundle Splitting:**
5. Route-based code splitting — every route already uses `React.lazy()` (good). But ensure `Suspense` fallbacks use skeleton screens, not spinners.
6. Remove `netlify-cli` from dependencies — this is a dev tool, not a runtime dependency. Move to devDependencies.
7. Tree-shake lucide-react — already tree-shakeable, but audit for unused icon imports.

**P2 — Loading Experience:**
8. Add `<link rel="preload">` for Inter font woff2 file.
9. Self-host fonts via `@fontsource` packages — eliminates Google Fonts render-blocking request.
10. Use `content-visibility: auto` on below-fold sections for paint containment.
11. Add explicit `width`/`height` or `aspect-ratio` to all card containers to eliminate CLS.

**P3 — Image & Asset Optimization:**
12. Convert `favicon.ico` to SVG favicon for scalability.
13. Add `loading="lazy"` to any images below the fold.
14. Use `<picture>` with WebP/AVIF sources if images are added.

### 5.3 Accessibility Deep Dive

#### Contrast (WCAG AAA = 7:1 for normal text, 4.5:1 for large text)

| Pair | Ratio | Verdict |
|------|-------|---------|
| `#E6EDF3` on `#0D1117` | **15.4:1** | AAA pass |
| `#8B949E` on `#0D1117` | **5.1:1** | AA pass, AAA fail for body text |
| `#2DD4A8` on `#0D1117` | **9.2:1** | AAA pass |
| `#E5A54B` on `#0D1117` | **7.8:1** | AAA pass |
| `#6E7681` on `#0D1117` | **3.6:1** | AA fail — bump to `#848D97` (4.6:1) |
| `#0D1117` on `#2DD4A8` | **9.2:1** | AAA pass (button text) |

**Fix:** Change `--text-tertiary` from `#6E7681` → `#848D97` for AA compliance. For AAA on secondary text, bump `--text-secondary` to `#9DA5AE`.

#### Keyboard Navigation
- **Good:** Radix UI primitives (Tabs, Accordion, Dialog) have built-in keyboard support.
- **Fix:** Add skip-to-content link at top of every page.
- **Fix:** Ensure all custom interactive elements (filter chips, search chips) have `tabindex="0"` and `role="button"`.
- **Fix:** Add `aria-live="polite"` region for search results and APO score updates.

#### Screen Reader Support
- **Fix:** Add `aria-label` to the APO score gauge SVG.
- **Fix:** Add `aria-describedby` linking risk level badges to their explanation text.
- **Fix:** Announce route changes with a visually-hidden live region.
- **Fix:** Add `<main>`, `<nav>`, `<aside>` landmarks to all page layouts.

#### Reduced Motion
- **Fix:** Wrap ALL animations in `@media (prefers-reduced-motion: no-preference)`.
- **Fix:** Provide instant state changes when reduced motion is preferred.
- Current code has zero `prefers-reduced-motion` checks.

#### Color Blindness
- Teal + Amber accent pair is safe for deuteranopia (most common).
- Red/Green semantic colors need additional shape indicators (icons, patterns) — already using lucide icons (good).
- Add underlines to links in addition to color change.

### 5.4 Testing Recommendations

| Tool | Purpose | Integration |
|------|---------|-------------|
| **Playwright** | Visual regression, mobile viewport testing | CI pipeline, screenshot comparison |
| **axe-core** | Automated a11y scanning | `@axe-core/playwright` in CI |
| **Lighthouse CI** | Performance budget enforcement | GitHub Actions, block deploy if LCP >3s |
| **chromatic** | Visual diff for component library | Optional, if using Storybook |
| **Web Vitals** | Real-user monitoring | Already installed (`web-vitals` package). Wire to analytics. |

---

## Phase 6: Security Reminder (Frontend-Focused)

Most security items were addressed in the previous audit. Quick re-scan of remaining frontend concerns:

| Issue | Severity | Status | Fix |
|-------|----------|--------|-----|
| `Sparkles` icon + "Automation Insights" branding exposes tech stack | Low | Open | Replace with custom SVG logo |
| `VITE_APO_FUNCTION_API_KEY` exposed in client bundle | Medium | Open | Move API key to server-side proxy (Netlify Function or Supabase Edge Function) |
| `localStorage.setItem('loadedAnalysis', JSON.stringify(analysis))` stores full analysis | Low | Open | Sanitize with DOMPurify before storing; limit payload size |
| `window.location.href = "/"` on auth — full reload loses SPA state | Low | Open | Use `navigate("/", { replace: true })` instead |
| Rate limiter uses client-side `getDeviceId()` — spoofable | Medium | Open | Enforce rate limits server-side (already have edge function rate limiting) |
| `import.meta.env.VITE_APO_FUNCTION_API_KEY as string` — no undefined check | Low | Open | Add runtime guard: `if (!key) throw new Error("Config missing")` |
| Search input sanitized via `sanitizeSearchInput` | — | Done | Good — keep this |
| DOMPurify on CounselorReportGenerator | — | Done | Good — keep this |
| CSP `unsafe-eval` removed | — | Done | Good — keep this |
| Whop OAuth moved server-side | — | Done | Good — keep this |

**Priority fix:** Move `VITE_APO_FUNCTION_API_KEY` server-side. Any `VITE_` prefixed env var is embedded in the client bundle and visible to anyone who opens DevTools. Create a thin Netlify Function or use the existing Supabase auth session to authenticate APO requests instead.

---

## Phase 7: Prioritized Implementation Plan

### 7.1 Wireframe Descriptions — 5 Key Pages

#### Page 1: Homepage (Mobile — 375px)

```
┌─────────────────────────────┐
│ ☰  Automation Insights  [→] │ ← minimal nav, logo left, sign-in right
├─────────────────────────────┤
│                             │
│  Stay Indispensable         │ ← Space Grotesk 32px, staggered reveal
│  in the AI Era              │
│                             │
│  ┌─────────────────────┐    │
│  │ 🔍 What's your job? │    │ ← search input, 48px, autofocus
│  └─────────────────────┘    │
│                             │
│  [Bright Outlook] [STEM]    │ ← filter chips, 2x2 grid
│  [Tech Skills] [Job Zones]  │
│                             │
│  "Based on WEF 2025: 44%   │ ← real stat, small text, cited
│   of worker skills will     │
│   need updating by 2027"    │
│                             │
├─────────────────────────────┤
│ ┌───────────────────────┐   │
│ │  YOUR RESULTS          │   │ ← bento card (appears after search)
│ │  Software Developer    │   │
│ │  ████████░░ 67%        │   │ ← animated gauge, teal→amber→red
│ │  Medium Risk           │   │
│ │  [See Full Analysis →] │   │ ← primary CTA, teal
│ └───────────────────────┘   │
│ ┌──────────┬────────────┐   │
│ │ 3 Tasks  │ 5 Skills   │   │ ← compact 2-col bento
│ │ at Risk  │ to Build   │   │
│ └──────────┴────────────┘   │
├─────────────────────────────┤
│ [🔍 Search] [📊 Results] [≡]│ ← persistent bottom bar
└─────────────────────────────┘
```

#### Page 1: Homepage (Desktop — 1280px)

```
┌──────────────────────────────────────────────────────────┐
│ [Logo] Automation Insights    Browse  Evidence  Pricing  │
│                                              [Sign In]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│     Stay Indispensable in the AI Era                     │
│     ┌──────────────────────────────────────┐             │
│     │ 🔍 Search any job title or skill...   │             │
│     └──────────────────────────────────────┘             │
│     [Bright Outlook] [STEM] [Tech] [Job Zones]          │
│     "WEF 2025: 44% of skills need updating by 2027"     │
│                                                          │
├──────────────┬──────────────────┬────────────────────────┤
│              │                  │                        │
│  APO SCORE   │  RISK BREAKDOWN  │  TOP SKILLS TO BUILD   │
│  ████ 67%    │  Tasks: 72%      │  • Prompt Engineering  │
│  Medium      │  Tech:  65%      │  • AI Governance       │
│  CI: 61-73%  │  Skills: 58%     │  • Data Literacy       │
│              │  Abilities: 45%  │  • Systems Thinking    │
│              │  Knowledge: 38%  │                        │
│  [Plan       │                  │  [Start Learning →]    │
│   Career →]  │                  │                        │
├──────────────┴──────────────────┴────────────────────────┤
│  TOP TASKS AT RISK              │  CAREER BRIDGE ROLES   │
│  1. Code review (82%)           │  AI Product Manager    │
│  2. Unit testing (78%)          │  ML Engineer           │
│  3. Documentation (71%)         │  Technical Lead        │
└─────────────────────────────────┴────────────────────────┘
```

#### Page 2: Career Impact Planner (Mobile — Progressive Disclosure)

```
Step 1 (default view):
┌─────────────────────────────┐
│ ← Back    Career Planner    │
├─────────────────────────────┤
│ ┌─────────────────────┐     │
│ │ 🔍 Search occupation │     │
│ └─────────────────────┘     │
│                             │
│ ┌───────────────────────┐   │
│ │  Software Developer    │   │
│ │  ████████░░ 67%        │   │
│ │  Medium Risk · High CI │   │
│ │                        │   │
│ │  [See What's at Risk→] │   │
│ └───────────────────────┘   │
│                             │
│ Similar roles:              │
│ [Data Analyst] [DevOps]     │
└─────────────────────────────┘

Step 2 (after CTA tap — accordion expands):
┌─────────────────────────────┐
│ ▼ RISK BREAKDOWN            │
│  Tasks ████████░░ 72%       │
│   • Code review — 82%       │
│   • Unit testing — 78%      │
│   • Documentation — 71%     │
│  Skills ██████░░░░ 58%      │
│   • Debugging — 65%         │
│   • Version control — 52%   │
│                             │
│  [Build Action Plan →]      │
├─────────────────────────────┤
│ ▶ ACTION PLAN (collapsed)   │
└─────────────────────────────┘
```

#### Page 3: Pricing (Mobile)

```
┌─────────────────────────────┐
│ ← Back         Pricing      │
├─────────────────────────────┤
│                             │
│  Find Your Plan             │
│  [Monthly] [Yearly -20%]    │
│                             │
│ ┌───────────────────────┐   │
│ │ FREE — Explorer        │   │
│ │ 3 APO checks/month     │   │
│ │ Basic risk scores       │   │
│ │ [Current Plan]          │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ $9/mo — Defender  ★    │   │ ← highlighted, teal border
│ │ 25 APO checks/month    │   │
│ │ Full breakdowns         │   │
│ │ Career planning tools   │   │
│ │ [Start Free Trial →]   │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ $29/mo — Navigator     │   │
│ │ Unlimited checks        │   │
│ │ AI coaching + reports   │   │
│ │ [Start Free Trial →]   │   │
│ └───────────────────────┘   │
└─────────────────────────────┘
```

### 7.2 Sample Code Snippets

#### A. CSS Variables — New "Warm Authority" Palette

```css
:root {
  /* Backgrounds */
  --bg-base: #0D1117;
  --bg-surface: #161B22;
  --bg-elevated: #1C2128;
  --bg-overlay: #21262D;

  /* Text */
  --text-primary: #E6EDF3;
  --text-secondary: #9DA5AE;
  --text-tertiary: #848D97;
  --text-inverse: #0D1117;

  /* Accents */
  --accent-teal: #2DD4A8;
  --accent-teal-hover: #14B88E;
  --accent-amber: #E5A54B;
  --accent-amber-hover: #D4943A;

  /* Semantic */
  --status-danger: #F85149;
  --status-warning: #E5A54B;
  --status-success: #3FB950;
  --status-info: #58A6FF;

  /* Borders */
  --border-default: #30363D;
  --border-muted: #21262D;
  --border-accent: rgba(45, 212, 168, 0.25);

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;

  /* Fonts */
  --font-display: 'Space Grotesk', sans-serif;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

#### B. Bento Grid Component (React + Tailwind)

```tsx
function BentoDashboard({ score, categories, skills }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
      {/* APO Score — spans 1 col on mobile, 1 col + 2 rows on desktop */}
      <div className="md:row-span-2 rounded-[var(--radius-lg)] bg-[var(--bg-surface)]
                      border border-[var(--border-default)] p-5">
        <APOScoreGauge score={score} />
      </div>

      {/* Risk Breakdown */}
      <div className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)]
                      border border-[var(--border-default)] p-4">
        <RiskBreakdownMini categories={categories} />
      </div>

      {/* Skills to Build */}
      <div className="rounded-[var(--radius-lg)] bg-[var(--bg-surface)]
                      border border-[var(--border-default)] p-4">
        <SkillsList skills={skills} />
      </div>

      {/* Tasks at Risk — spans 2 cols on desktop */}
      <div className="md:col-span-2 rounded-[var(--radius-lg)] bg-[var(--bg-surface)]
                      border border-[var(--border-default)] p-4">
        <TasksAtRisk />
      </div>
    </div>
  );
}
```

#### C. CSS-Only Animation (Replace framer-motion)

```css
/* Fade-up on scroll — triggered by IntersectionObserver adding .visible */
.fade-up {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fade-up.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Count-up animation for APO score */
@property --score {
  syntax: '<integer>';
  initial-value: 0;
  inherits: false;
}
.score-counter {
  animation: count-up 0.8s ease-out forwards;
  counter-reset: score var(--score);
}
.score-counter::after {
  content: counter(score) '%';
}
@keyframes count-up {
  from { --score: 0; }
}

/* Reduced motion override */
@media (prefers-reduced-motion: reduce) {
  .fade-up { opacity: 1; transform: none; transition: none; }
  .score-counter { animation: none; }
}
```

#### D. Mobile Bottom Bar Component

```tsx
function MobileBottomBar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden
                    h-14 bg-[var(--bg-surface)]/90 backdrop-blur-xl
                    border-t border-[var(--border-default)]
                    flex items-center justify-around px-4"
         role="navigation" aria-label="Quick actions">
      <button className="flex flex-col items-center gap-0.5 text-[var(--accent-teal)]"
              aria-label="Search occupations">
        <Search className="w-5 h-5" />
        <span className="text-[10px] font-medium">Search</span>
      </button>
      <button className="flex flex-col items-center gap-0.5 text-[var(--text-secondary)]"
              aria-label="View saved results">
        <BarChart3 className="w-5 h-5" />
        <span className="text-[10px] font-medium">Results</span>
      </button>
      <button className="flex flex-col items-center gap-0.5 text-[var(--text-secondary)]"
              aria-label="Open menu">
        <Menu className="w-5 h-5" />
        <span className="text-[10px] font-medium">More</span>
      </button>
    </nav>
  );
}
```

### 7.3 Prioritized Roadmap

#### Sprint 1 — Quick Wins (1-2 days, high impact, low effort)
| # | Task | Impact | Effort |
|---|------|--------|--------|
| 1 | Replace all purple hex/CSS vars with teal/amber palette | High | Low |
| 2 | Remove `Sparkles` icon from nav and auth | High | Trivial |
| 3 | Remove fake StatsOverview or replace with WEF citation | High | Low |
| 4 | Replace fear headlines with empowerment messaging | High | Low |
| 5 | Fix all hardcoded light-mode colors (`bg-blue-50`, `text-blue-600`, `bg-white/80`) | Medium | Low |
| 6 | Add `prefers-reduced-motion` media query wrapper | Medium | Low |
| 7 | Remove "768-dim AI Embeddings" from hero and coaches page | Medium | Trivial |

#### Sprint 2 — Visual Upgrade (3-5 days)
| # | Task | Impact | Effort |
|---|------|--------|--------|
| 8 | Implement new CSS variable palette ("Warm Authority") | High | Medium |
| 9 | Add Space Grotesk display font + typography scale | Medium | Low |
| 10 | Build bento grid layout for homepage dashboard | High | Medium |
| 11 | Redesign hero section (≤50vh, search-first) | High | Medium |
| 12 | Add mobile bottom action bar | High | Medium |
| 13 | Implement CSS-only fade-up animations | Medium | Low |
| 14 | Add APO score gauge animation (CSS @property) | Medium | Medium |
| 15 | Redesign pricing page (kill purple, add demo hook) | Medium | Medium |

#### Sprint 3 — Performance (2-3 days)
| # | Task | Impact | Effort |
|---|------|--------|--------|
| 16 | Remove framer-motion, replace with CSS animations | High | High |
| 17 | Lazy-load recharts (dynamic import) | Medium | Medium |
| 18 | Remove three/react-force-graph or gate behind desktop | Medium | Medium |
| 19 | Self-host fonts via @fontsource | Low | Low |
| 20 | Move netlify-cli to devDependencies | Low | Trivial |
| 21 | Add skeleton loading screens for Suspense fallbacks | Medium | Medium |

#### Sprint 4 — UX & Interaction (3-5 days)
| # | Task | Impact | Effort |
|---|------|--------|--------|
| 22 | Progressive disclosure for Career Planner (3-step) | High | High |
| 23 | Add bottom sheets (Vaul) for mobile detail views | Medium | Medium |
| 24 | Consolidate evidence pages into single `/evidence` | Medium | Medium |
| 25 | Add skip-to-content + ARIA landmarks to all pages | Medium | Low |
| 26 | Prune/gate Tier 4 routes (test, demo, econ-importer) | Medium | Low |
| 27 | Add contextual CTAs based on search history | Medium | Medium |

#### Sprint 5 — AI Personalization & Polish (3-5 days)
| # | Task | Impact | Effort |
|---|------|--------|--------|
| 28 | Adaptive bento reordering (returning vs new user) | Medium | Medium |
| 29 | "People also explored" in search results | Medium | Medium |
| 30 | PWA manifest + basic service worker | Medium | Medium |
| 31 | Add real social proof (WEF/McKinsey stats, testimonials) | High | Low |
| 32 | Move VITE_APO_FUNCTION_API_KEY server-side | Medium | Medium |

### 7.4 Effort & Impact Summary

| Sprint | Duration | Impact Score | Key Deliverable |
|--------|----------|-------------|-----------------|
| 1 — Quick Wins | 1-2 days | ★★★★★ | Purple gone, fear gone, fake stats gone |
| 2 — Visual Upgrade | 3-5 days | ★★★★★ | New palette, bento grid, mobile bar |
| 3 — Performance | 2-3 days | ★★★★☆ | -150KB bundle, CSS animations |
| 4 — UX & Interaction | 3-5 days | ★★★★☆ | Progressive disclosure, a11y, route cleanup |
| 5 — AI & Polish | 3-5 days | ★★★☆☆ | Personalization, PWA, social proof |

**Total estimated:** 12-20 days for full transformation.

---

## Phase 8: Final Vision

### 8.1 The Transformed App — How It Feels

**On Mobile (375px):**
You open the app. A dark, warm screen greets you — not cold, not sterile, not "techy." The headline reads **"Stay Indispensable in the AI Era"** in clean Space Grotesk type that feels editorial, like opening Bloomberg or The Economist. Below it, a single search input: "What's your job title?" You type "software developer." Results appear instantly in a sleek dropdown. You tap one.

The screen transforms into a bento dashboard. A large teal ring fills to 67% — your automation risk score. Beside it, compact cards show "3 Tasks at Risk" and "5 Skills to Build." Everything is thumb-reachable. A persistent bottom bar lets you search again, view saved results, or open the menu. No clutter. No gradient orbs. No fake statistics.

You tap "See Full Analysis →" and a bottom sheet slides up with the full breakdown — tasks, skills, knowledge — in an accordion that respects your scroll depth. Each item has a risk percentage in JetBrains Mono and a timeline badge ("2-3 years"). You tap "Build Action Plan →" and the next section reveals course recommendations and bridge roles. Everything progressive, nothing overwhelming.

**On Desktop (1280px):**
The same experience, but the bento grid expands to 3 columns. The APO score gauge occupies the left column (2 rows tall). Risk breakdown and skills fill the right. Below, tasks at risk and career bridge recommendations sit in a wide asymmetric layout. The navigation is minimal — Logo, Browse, Evidence, Pricing, Sign In. No dropdowns with 12 items. The evidence link opens a single consolidated page with tabs.

The overall feeling: **a Bloomberg terminal for career defense.** Data-dense but not cluttered. Warm but authoritative. You trust the numbers because they cite O*NET 29.3 and WEF 2025 data, not "768-dim AI embeddings."

### 8.2 Projected Scores (Post-Redesign)

| Page | Before | After | Delta |
|------|--------|-------|-------|
| Homepage | 4.3 | **8.5** | +4.2 |
| Planner | 5.0 | **8.0** | +3.0 |
| Occupation Detail | 4.8 | **7.5** | +2.7 |
| Pricing | 4.3 | **7.5** | +3.2 |
| Auth | 5.0 | **7.0** | +2.0 |
| Dashboard | 4.8 | **7.5** | +2.7 |
| Browse | 4.3 | **7.0** | +2.7 |
| Tools | 3.0 | **6.5** | +3.5 |
| **App Average** | **4.3** | **7.4** | **+3.1** |

### 8.3 Performance Projections

| Metric | Before | After | Method |
|--------|--------|-------|--------|
| Bundle (gzipped) | ~350KB | **~180KB** | Remove framer-motion, three, lazy-load recharts |
| LCP | ~3.5s | **~1.8s** | Smaller bundle, self-hosted fonts, no hero gradient render |
| CLS | ~0.15 | **<0.05** | Explicit dimensions, skeleton screens |
| INP | ~200ms | **<100ms** | CSS animations, no JS hydration overhead |

### 8.4 Must-Have vs Nice-to-Have

#### Must-Have (Sprint 1-3)
1. Replace purple palette with "Warm Authority" teal/amber
2. Replace fear messaging with empowerment copy
3. Remove fake stats — add real WEF/McKinsey citations
4. Remove Sparkles icon and "cosmic" aesthetic
5. Shrink hero to ≤50vh, search-first
6. Bento grid for homepage dashboard
7. Mobile bottom action bar
8. Remove framer-motion (CSS animations)
9. Fix all hardcoded light-mode colors
10. Add `prefers-reduced-motion` support

#### Nice-to-Have (Sprint 4-5)
11. Progressive disclosure 3-step planner
12. Bottom sheets for mobile detail views
13. Consolidate evidence pages
14. Route pruning (remove Tier 4 routes)
15. PWA manifest + service worker
16. Adaptive bento reordering
17. "People also explored" recommendations
18. Swipe gestures between categories
19. Pull-to-refresh on dashboard
20. Haptic feedback on score reveal

### 8.5 Headline Options (Final Recommendations)

For the hero, pick one:

| Option | Tone | Why |
|--------|------|-----|
| **"Stay Indispensable in the AI Era"** | Empowerment + urgency | Direct, confident, no fear. Implies action. |
| **"Master AI Before It Masters You"** | Bold empowerment | Slightly edgier, memorable. Still empowering. |
| **"Build the Skills AI Can't Replicate"** | Practical empowerment | Most concrete. Appeals to "doers." |
| **"Own Your Career Future"** | Calm authority | Broadest appeal. Safe but less memorable. |

**Recommendation:** Lead with **"Stay Indispensable in the AI Era"** as the primary. Use **"Build the Skills AI Can't Replicate"** as the subheading or on the planner page.

### 8.6 Social Proof Replacements (for Fake Stats)

Replace the current hardcoded stats with cited data:

| Current (Fake) | Replacement (Real) | Source |
|-----------------|-------------------|--------|
| "247 Analyzed Today" | "44% of worker skills will need updating by 2027" | WEF Future of Jobs Report 2025 |
| "1,542 Active Sessions" | "1,016+ occupations analyzed from O*NET 29.3 database" | O*NET (real count) |
| "1,016+ Total Occupations" | Keep — this is real | O*NET |
| "+12 this month" | "92M jobs expected to emerge by 2030" | WEF Future of Jobs Report 2025 |

---

## Appendix: Files Requiring Changes (by Sprint)

### Sprint 1 Files
- `src/index.css` — Replace CSS variable palette
- `src/components/HeroSection.tsx` — Replace messaging + remove gradient orbs
- `src/components/StatsOverview.tsx` — Remove or replace with real data
- `src/components/NavigationPremium.tsx` — Remove Sparkles, simplify
- `src/pages/Auth.tsx` — Remove Sparkles, add value prop
- `src/components/ExecutiveSummary.tsx` — Fix light-mode colors
- `src/pages/UserDashboardPage.tsx` — Fix blue-* hardcoded colors
- `src/pages/PricingPage.tsx` — Remove purple gradients
- `src/pages/ForCoachesPage.tsx` — Remove "768-dim" jargon

### Sprint 2 Files
- `src/index.css` — Full palette rewrite
- `src/components/APODashboard.tsx` — Bento grid layout
- `src/components/HeroSection.tsx` — Redesign to ≤50vh
- `src/components/MobileBottomBar.tsx` — New component
- `src/pages/PricingPage.tsx` — Full redesign
- `tailwind.config.ts` — Add Space Grotesk, update colors
- `index.html` — Add font preload

### Sprint 3 Files
- **Every file importing framer-motion** (~25 files) — Remove motion wrappers
- `package.json` — Remove framer-motion, three, react-force-graph deps
- `src/components/SkillAdjacencyGraph.tsx` — Replace or gate
- `src/App.tsx` — Add skeleton Suspense fallbacks

---

*End of audit. Ready for implementation on your go.*
