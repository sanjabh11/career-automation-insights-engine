# QA Checklist: Sprint 4 (Onboarding & Polish)

Use this checklist to verify the "world-class" UI/UX enhancements implemented in Sprint 4.

## 1. Onboarding Wizard (Visuals & Animations)
**Goal:** Verify the new premium design and smooth animations.

- [ ] **Launch Wizard:**
  - Go to the home page (`/`).
  - Click the **"Start Setup"** or **"Get Started"** button in the Hero section (or refresh if it auto-opens).
- [ ] **Verify Visuals:**
  - Check that the modal has a **backdrop blur** effect.
  - Verify the **progress bar** at the top updates as you move through steps.
  - Confirm each step has a unique **Hero Icon** (Sparkles, Target, Rocket, etc.) in the header.
- [ ] **Test Animations:**
  - Click "Next Step". Verify the content **slides in** smoothly from the right.
  - Click "Back". Verify the content **slides out** to the right and new content enters from the left.
  - Ensure no "jumping" or layout shifts during transitions.
- [ ] **Interactive Elements:**
  - **Step 2 (Goals):** Click the goal cards (e.g., "Stay Secure"). Verify they highlight with a border/background change.
  - **Step 3 (Preview):** Verify the 3 insight cards animate in sequentially (staggered fade-in).

## 2. Data Visualization Polish (Tooltips)
**Goal:** Verify rich, informative tooltips on charts.

- [ ] **Navigate to Occupation:**
  - Go to any occupation page (e.g., search for "Software Developers" or click a demo link).
  - Scroll to the **"Detailed Breakdown"** tab (or "Overview" if visible there).
- [ ] **APO Visualization (Main Chart):**
  - Hover over any bar in the main "Enhanced Analysis Breakdown" chart.
  - **Verify Custom Tooltip:**
    - Shows **Category Name** (e.g., "Tasks").
    - Shows **Color-coded dot** matching the bar.
    - Shows **Risk Level Badge** (High Risk = Red, Medium = Amber, Low = Green).
    - Shows precise percentage (e.g., "42.5% Potential").
- [ ] **Factor Contributions (Explainability):**
  - Go to the **"Overview"** tab -> **"Factor Contributions"** section.
  - Hover over any of the colored progress bars.
  - **Verify Tooltip:**
    - Shows calculation details: `Raw Score × Weight = Contribution`.
    - Example: "42.5% × 0.2 = 8.5 pts".

## 3. Performance & Mobile
**Goal:** Verify optimizations and mobile responsiveness.

- [ ] **Load Performance:**
  - Hard refresh the page (`Cmd+Shift+R`).
  - Verify the page loads quickly without a long white screen.
  - (Optional) Open DevTools -> Network -> JS. Confirm that `vendor`, `charts`, and `animation` chunks are loaded separately.
- [ ] **Mobile Sidebar (Sprint 3 Recap):**
  - Resize browser to mobile width (< 768px).
  - Go to an occupation page.
  - Look for the **Floating Action Button (FAB)** at the bottom right (Chart icon).
  - Click it. Verify the **Sheet (Drawer)** opens with "Key Insights" and "Actions".
