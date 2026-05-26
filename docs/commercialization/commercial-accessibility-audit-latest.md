# Commercial WCAG 2.2 Accessibility Audit Packet

Generated: 2026-05-26T13:29:00.358Z
Target: http://127.0.0.1:5176
Status: **automated_smoke_passed_manual_wcag_required**

## Boundary

This packet proves automated responsive/accessibility smoke for the scoped commercial routes. It is not a WCAG conformance claim; manual WCAG 2.2, WCAG-EM, screen-reader, contrast, focus, form-error, target-size, and accessible-authentication evidence remains required before institutional delivery.

## Automated Smoke Results

| Route | Label | Viewport | H1 | Controls | Visible Text Length | Keyboard Tab Stops Checked | Result |
|---|---|---|---|---:|---:|---:|---|
| `/privacy` | privacy policy | mobile | Privacy Policy | 1 | 2559 | 1 | pass |
| `/for-coaches` | coach landing page | mobile | Generate "Future-Proof" Client Reports in 30 Seconds | 10 | 3134 | 5 | pass |
| `/sample-report` | coach sample report | mobile | Generate a Free AI Career Report | 27 | 1568 | 5 | pass |
| `/tools/resume-analyzer` | resume analyzer | mobile | Resume Automation Risk Analyzer | 4 | 884 | 4 | pass |
| `/tools/counselor-reports` | counselor reports | mobile | Counselor Report Generator | 25 | 1518 | 5 | pass |
| `/enterprise-dashboard` | workforce dashboard | mobile | Workforce Planning Dashboard | 10 | 482 | 5 | pass |
| `/proof-pack-gallery` | proof-pack gallery | mobile | Proof-pack gallery for coach, career-center, and workforce pilots | 28 | 41787 | 5 | pass |
| `/automation-risk/accountant` | occupation SEO report | mobile | Will AI Replace Accountants? | 25 | 2319 | 5 | pass |
| `/privacy` | privacy policy | tablet | Privacy Policy | 1 | 2559 | n/a | pass |
| `/for-coaches` | coach landing page | tablet | Generate "Future-Proof" Client Reports in 30 Seconds | 10 | 3134 | n/a | pass |
| `/sample-report` | coach sample report | tablet | Generate a Free AI Career Report | 27 | 1568 | n/a | pass |
| `/tools/resume-analyzer` | resume analyzer | tablet | Resume Automation Risk Analyzer | 4 | 884 | n/a | pass |
| `/tools/counselor-reports` | counselor reports | tablet | Counselor Report Generator | 25 | 1518 | n/a | pass |
| `/enterprise-dashboard` | workforce dashboard | tablet | Workforce Planning Dashboard | 10 | 482 | n/a | pass |
| `/proof-pack-gallery` | proof-pack gallery | tablet | Proof-pack gallery for coach, career-center, and workforce pilots | 28 | 41787 | n/a | pass |
| `/automation-risk/accountant` | occupation SEO report | tablet | Will AI Replace Accountants? | 25 | 2351 | n/a | pass |
| `/privacy` | privacy policy | desktop | Privacy Policy | 1 | 2559 | n/a | pass |
| `/for-coaches` | coach landing page | desktop | Generate "Future-Proof" Client Reports in 30 Seconds | 16 | 3191 | n/a | pass |
| `/sample-report` | coach sample report | desktop | Generate a Free AI Career Report | 27 | 1568 | n/a | pass |
| `/tools/resume-analyzer` | resume analyzer | desktop | Resume Automation Risk Analyzer | 4 | 884 | n/a | pass |
| `/tools/counselor-reports` | counselor reports | desktop | Counselor Report Generator | 25 | 1518 | n/a | pass |
| `/enterprise-dashboard` | workforce dashboard | desktop | Workforce Planning Dashboard | 10 | 482 | n/a | pass |
| `/proof-pack-gallery` | proof-pack gallery | desktop | Proof-pack gallery for coach, career-center, and workforce pilots | 34 | 41844 | n/a | pass |
| `/automation-risk/accountant` | occupation SEO report | desktop | Will AI Replace Accountants? | 25 | 2343 | n/a | pass |

## Manual WCAG 2.2 Review Checklist

These rows are required before any institutional delivery or WCAG conformance statement.

| Check | Source | Criteria | Status | Evidence Needed |
|---|---|---|---|---|
| `wcag-em-scope` | WCAG-EM | Evaluation scope<br/>Target conformance level<br/>Representative route sample<br/>User-agent and assistive-technology context | manual_required | Document evaluator, browser, assistive technology, routes, states, and target WCAG 2.2 A/AA scope before any conformance statement. |
| `focus-not-obscured` | WCAG 2.2 | 2.4.7 Focus Visible<br/>2.4.11 Focus Not Obscured (Minimum)<br/>2.4.12 Focus Not Obscured (Enhanced) | manual_required | Tab through sticky navigation, modals, report popups, downloadable artifacts, and long forms at mobile/tablet/desktop sizes and capture obscured-focus issues. |
| `target-size` | WCAG 2.2 | 2.5.5 Target Size (Enhanced)<br/>2.5.8 Target Size (Minimum) | manual_required | Measure compact links, icon buttons, table actions, form controls, and mobile CTA clusters for pointer target size or spacing exceptions. |
| `redundant-entry-and-errors` | WCAG 2.2 / WAI Easy Checks | 3.3.1 Error Identification<br/>3.3.2 Labels or Instructions<br/>3.3.7 Redundant Entry | manual_required | Exercise lead capture, coach sample, resume analyzer, workforce CSV, and counselor forms with missing/invalid values and verify labels, instructions, recovery, and no unnecessary re-entry. |
| `accessible-authentication` | WCAG 2.2 | 3.3.8 Accessible Authentication (Minimum)<br/>3.3.9 Accessible Authentication (Enhanced) | manual_required | Review sign-in/payment/account flows before institutional pilots; prove there is no cognitive-function test without an accessible alternative. |
| `screen-reader-and-name-role-value` | WAI-ARIA Authoring Practices | 4.1.2 Name, Role, Value<br/>1.3.1 Info and Relationships<br/>2.1.1 Keyboard | manual_required | Use a screen reader to review menus, dialogs, generated reports, evidence cards, CSV/HTML download controls, and dynamic status messages. |
| `contrast-and-reflow` | WCAG 2.2 / WAI Easy Checks | 1.4.3 Contrast (Minimum)<br/>1.4.10 Reflow<br/>1.4.11 Non-text Contrast<br/>1.4.12 Text Spacing | manual_required | Run color contrast and text-spacing checks on commercial cards, badges, alerts, charts, downloadable HTML, and dark-theme surfaces. |

## Official References

- [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) - Target standard for commercial route accessibility checks and manual audit notes.
- [WCAG-EM overview](https://www.w3.org/WAI/test-evaluate/conformance/wcag-em/) - Evaluation-methodology structure for scope, target conformance level, sampling, audit results, and reporting.
- [WCAG-EM 2.0 draft](https://www.w3.org/TR/wcag-em-2/) - Current W3C methodology draft for optional conformance claims and report structure.
- [WAI Easy Checks](https://www.w3.org/WAI/test-evaluate/preliminary/) - Preliminary manual checks for headings, labels, keyboard access, visible focus, forms, and contrast.
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) - Manual interaction-pattern review for dynamic widgets, names, roles, states, and keyboard behavior.
