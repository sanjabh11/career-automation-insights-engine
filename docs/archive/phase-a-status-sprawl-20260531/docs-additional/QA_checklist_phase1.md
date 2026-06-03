# QA Checklist - Phase 1 UI/UX Fixes

## 1. Typography Verification
- [ ] **Font Loading**: Verify `Inter` loads for body text and `Playfair Display` for headings.
    - *Test*: Inspect element on Body and H1 tags.
- [ ] **Readability**: Check that body text is not too small (should be 16px base).
- [ ] **Heading Hierarchy**: Verify H1, H2, H3 sizes are distinct and use the correct font family.

## 2. Component Sizing (Accessibility)
- [ ] **Button Touch Targets**:
    - [ ] Verify Primary/Secondary buttons are **44px** height (`h-11`).
    - [ ] Verify Large buttons are **48px** height (`h-12`).
    - [ ] Check hover states are visible and consistent.
- [ ] **Form Inputs**:
    - [ ] Verify Text Inputs are **44px** height.
    - [ ] Verify Select dropdown triggers are **44px** height.
    - [ ] Check alignment when a Button is next to an Input (should be flush).

## 3. Layout & Responsiveness
- [ ] **Container Max-Width**:
    - [ ] On large screens (>1400px), verify content width is constrained to **1200px**.
    - [ ] Verify no content stretches infinitely across the screen (except full-width backgrounds).
- [ ] **Mobile Responsiveness**:
    - [ ] Check `NavigationPremium` on mobile (hamburger menu works, no horizontal scroll).
    - [ ] Check `HeroSection` padding on mobile (text shouldn't touch edges).
    - [ ] Check `APODashboard` grid behavior (should stack on mobile).

## 4. Visual Regression Check
- [ ] **Navigation Bar**: Ensure logo and links are aligned correctly with the new container width.
- [ ] **Dashboard Cards**: Ensure cards didn't break due to container resizing.
