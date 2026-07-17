# Pilot Terms and Data Notice

**Version:** 1.0-draft
**Effective Date:** Not effective while draft
**Status:** DRAFT — Pending Owner/Legal Approval

> **NOTICE:** This document is a draft. It has not been approved by the owner or legal counsel. It does not constitute a binding agreement until signed off. Pilot participants should not rely on these terms until the status changes to "Active."

## 1. Pilot Scope

This service is being prepared for a **pilot phase** limited to:
- **Geography:** United States and Canada only
- **Pricing:** $49 per 5-report credit pack (no subscription required)
- **Users:** Career coaches, counselors, and workforce development professionals

Enrollment and checkout are **closed while these terms are draft**. Features outside this scope (subscriptions, enterprise tiers, and APIs) are deferred and not offered for sale.

## 2. What This Service Is

An AI-assisted planning artifact generator that produces source-labeled automation transition reports grounded in U.S. Department of Labor O*NET data. Reports are **drafts for human review**, not employment decisions.

## 3. What This Service Is Not

- Not a job placement tool
- Not a salary prediction tool
- Not a substitute for professional career counseling judgment
- Not a guarantee of client outcomes or revenue

## 4. Data Handling

### 4.1 Data We Collect
- **Account data:** Account identifiers and authentication-provider records
- **Usage data:** Occupation searches, report generations, credit transactions, and non-PII product analytics
- **Report artifacts:** Intended for private cloud storage with signed-URL delivery (60-second expiry); deployment and cleanup monitoring must be verified before activation

### 4.2 Data-entry boundary (not a collection guarantee)
- The pilot workflow is designed for pseudonymous labels such as "Client A", not real client names
- Coaches must not submit client resumes, education records, government IDs, or other client PII
- Payment card details are processed by Stripe and are not entered into this application

This boundary is an instruction to participants, not a representation that the application has been independently certified to detect or remove every sensitive value. Existing report schemas and operational logs require owner review before activation.

### 4.3 Client-Data Prohibitions
Coaches must NOT enter into the system:
- Real client names or initials
- Client email addresses, phone numbers, or physical addresses
- Client government IDs (SSN, SIN, passport numbers)
- Client resume content or employment history
- Any personally identifiable information (PII) belonging to a client

The system is designed for pseudonymous labels only (e.g., "Client A", "Client B"). Violation of this prohibition may result in immediate termination of pilot access.

### 4.4 Data Retention
- Report artifacts: intended to expire after 30 days; the cleanup queue, Storage deletion worker, and monitoring must be deployed and verified before this is treated as a guarantee
- Credit transaction logs: retained for accounting
- Usage analytics: intended to be aggregated and non-PII; retention follows the configured analytics provider policy
- Pilot enrollment records: retained until pilot concludes, then archived or deleted at owner's discretion

### 4.5 Privacy Rights
- Contact details for data-access, deletion, and refund requests will be published before activation
- You may request deletion of your account and associated data, subject to accounting record retention requirements
- The owner and legal reviewer must confirm the applicable privacy notices and jurisdictional requirements before activation; this draft makes no compliance representation

## 5. Human Review Requirement

All reports generated through this service require **coach review before client delivery**. The coach acknowledges this requirement at generation time. Reports include:
- Source labels (O*NET task IDs, data version)
- Uncertainty notes and confidence levels
- Proof boundary statement ("does not prove employment outcomes")

## 6. Coach Responsibilities

1. Review every report before delivering to a client
2. Use pseudonymous client labels, not real names
3. Do not present reports as employment guarantees
4. Set your own client pricing and engagement terms
5. Obtain client consent before sharing report content
6. Do not enter client PII into the system (see Section 4.3)

## 7. Refund and Payment Terms

### 7.1 Credit Packs
- Credit packs are sold as one-time purchases of 5 report credits at $49 USD
- Credits are valid for 30 days from the date of purchase
- Unused credits expire after 30 days — no carryover, no refund for expired credits

### 7.2 Refund Policy
- A verified report-generation failure is intended to restore the reserved credit when the ledger can identify the original credit lot
- Other refund requests, including outages, change of mind, or unused credits, will be reviewed under the payment policy published before activation; this draft makes no automatic pro-rated-refund promise

### 7.3 Payment Processing
- Payments are processed by Stripe. We do not store your payment card information
- Billing disputes should be directed to [email protected] first, then to your card issuer if unresolved

## 8. Email Communications

Any transactional or product email, sender identity, mailing address, consent record, and unsubscribe flow must be configured and reviewed for the recipient's jurisdiction before activation. This draft is not a CAN-SPAM, CASL, or other legal-compliance representation.

## 9. Limitation of Liability

This service provides AI-assisted planning artifacts for informational purposes. We are not liable for:
- Coaching outcomes or client career decisions
- Accuracy of O*NET data (sourced from U.S. Department of Labor)
- Third-party AI model outputs (Gemini)
- Loss of report artifacts after the 30-day retention period

## 10. Changes to These Terms

Pilot terms may change as the service evolves. Each active version will have a version and content hash. Material changes require explicit re-acceptance before continued pilot access; continued use alone does not constitute acceptance.

## 11. Contact

Questions and contact details will be published before activation. No support-response-time promise is made in this draft.

## 12. Pilot Termination

The owner reserves the right to terminate the pilot at any time. Any notice, credit treatment, and artifact cleanup will follow the active terms and payment policy published at that time; this draft makes no pro-rated-refund, notice-period, or deletion guarantee.

---

*This document is versioned at `docs/legal/pilot-terms-v1.md`. Status: DRAFT — do not activate without owner and legal sign-off.*
