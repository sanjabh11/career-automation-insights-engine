# QA Checklist - Phase 2 UI/UX Fixes

## 1. Card Component Polish
- [ ] **Visual Style**:
    - [ ] Verify Cards have `rounded-xl` (more modern than `rounded-lg`).
    - [ ] Check for subtle shadow (`shadow-sm`) and hover effect (`hover:shadow-md`).
    - [ ] Verify transition is smooth (`duration-200`).
- [ ] **Padding Consistency**:
    - [ ] Check `CardHeader`, `CardContent`, `CardFooter` padding.
    - [ ] Should be `p-6` on mobile and `p-8` on small screens and up (`sm:p-8`).

## 2. Visual Hierarchy
- [ ] **Typography**:
    - [ ] **Occupation Detail Page**: Main Title should be **Serif** (`font-serif`), large and bold.
    - [ ] **Analysis Dashboard**: Section headings (e.g., "Economic Viability", "Planning & Forecasts") should be **Serif**.
    - [ ] Verify contrast between headings and body text.
- [ ] **Data Visualization**:
    - [ ] Check "Factor Contributions" bars. They should look clean and aligned.
    - [ ] Check "Detailed Component Analysis" accordion headers. They should use the new Serif font for clarity.

## 3. Responsive Design
- [ ] **Mobile Layout**:
    - [ ] Open `OccupationDetailPage` on mobile view (<640px).
    - [ ] Verify padding is comfortable (`p-4`).
    - [ ] Check that Cards don't overflow horizontally.
    - [ ] Check that the Navigation menu works and looks good.
- [ ] **Tablet/Desktop**:
    - [ ] Resize window to tablet size. Verify padding increases to `p-8` inside cards.
    - [ ] Verify grid layouts (e.g., "Job Zone" cards) stack correctly.

## 4. Regression Testing
- [ ] **Interactivity**:
    - [ ] Click on Accordions in `OccupationAnalysis`. Ensure they open/close smoothly.
    - [ ] Hover over Cards. Ensure the shadow transition works without layout shift.
