import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import NavigationPremium from "@/components/NavigationPremium";

export default function PilotTermsPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0F172A]">
            <NavigationPremium />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-6 text-slate-400 hover:text-white"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                {/* G-12: Pending Legal Review Banner */}
                <div className="mb-8 p-4 rounded-lg bg-amber-900/30 border border-amber-500/50 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-amber-200 font-semibold">Pending Legal Review — Not Active</p>
                        <p className="text-amber-300/80 text-sm mt-1">
                            These terms are a draft and have not been approved by legal counsel.
                            Pilot enrollment is blocked until terms are approved and activated.
                            Do not rely on these terms as a binding agreement.
                        </p>
                    </div>
                </div>

                <div className="prose prose-invert prose-slate max-w-none">
                    <h1 className="text-white">Pilot Terms and Data Notice</h1>

                    <p className="text-slate-400">
                        <strong>Version:</strong> 1.0-draft<br />
                        <strong>Effective Date:</strong> Not effective while draft<br />
                        <strong>Status:</strong> DRAFT — Pending Owner/Legal Approval
                    </p>

                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm mb-6">
                        <strong>NOTICE:</strong> This document is a draft. It has not been approved by the owner or legal counsel. It does not constitute a binding agreement until signed off. Pilot participants should not rely on these terms until the status changes to "Active."
                    </div>

                    <h2 className="text-white">1. Pilot Scope</h2>
                    <p className="text-slate-300">This service is being prepared for a <strong>pilot phase</strong> limited to:</p>
                    <ul className="text-slate-300">
                        <li><strong>Geography:</strong> United States and Canada only</li>
                        <li><strong>Pricing:</strong> $49 per 5-report credit pack (no subscription required)</li>
                        <li><strong>Users:</strong> Career coaches, counselors, and workforce development professionals</li>
                    </ul>
                    <p className="text-slate-300">Enrollment and checkout are <strong>closed while these terms are draft</strong>. Subscriptions, enterprise tiers, and APIs are deferred and not offered for sale.</p>

                    <h2 className="text-white">2. What This Service Is</h2>
                    <p className="text-slate-300">An AI-assisted planning artifact generator that produces source-labeled automation transition reports grounded in U.S. Department of Labor O*NET data. Reports are <strong>drafts for human review</strong>, not employment decisions.</p>

                    <h2 className="text-white">3. What This Service Is Not</h2>
                    <ul className="text-slate-300">
                        <li>Not a job placement tool</li>
                        <li>Not a salary prediction tool</li>
                        <li>Not a substitute for professional career counseling judgment</li>
                        <li>Not a guarantee of client outcomes or revenue</li>
                    </ul>

                    <h2 className="text-white">4. Data Handling</h2>
                    <h3 className="text-slate-200">4.1 Data We Collect</h3>
                    <ul className="text-slate-300">
                        <li><strong>Account data:</strong> Account identifiers and authentication-provider records</li>
                        <li><strong>Usage data:</strong> Occupation searches, report generations, credit transactions, and non-PII product analytics</li>
                        <li><strong>Report artifacts:</strong> Intended for private cloud storage with signed-URL delivery (60-second expiry); deployment and cleanup monitoring require verification before activation</li>
                    </ul>
                    <h3 className="text-slate-200">4.2 Data-entry boundary (not a collection guarantee)</h3>
                    <ul className="text-slate-300">
                        <li>The workflow is designed for pseudonymous labels such as "Client A", not real client names</li>
                        <li>Coaches must not submit client resumes, education records, government IDs, or other client PII</li>
                        <li>Payment card details are processed by Stripe and are not entered into this application</li>
                    </ul>
                    <p className="text-slate-300">This is an instruction to participants, not a claim that the application has been independently certified to detect or remove every sensitive value. Existing report schemas and operational logs require owner review before activation.</p>
                    <h3 className="text-slate-200">4.3 Client-Data Prohibitions</h3>
                    <p className="text-slate-300">Coaches must NOT enter into the system: real client names, client email/phone/address, client government IDs, client resume content, or any PII belonging to a client. The system is designed for pseudonymous labels only. Violation may result in immediate termination of pilot access.</p>
                    <h3 className="text-slate-200">4.4 Data Retention</h3>
                    <ul className="text-slate-300">
                        <li>Report artifacts: intended to expire after 30 days; cleanup deployment and monitoring must be verified before this is treated as a guarantee</li>
                        <li>Credit transaction logs: retained for accounting</li>
                        <li>Usage analytics: intended to be aggregated and non-PII; retention follows the configured analytics provider policy</li>
                        <li>Pilot enrollment records: retained until pilot concludes</li>
                    </ul>
                    <h3 className="text-slate-200">4.5 Privacy Rights</h3>
                    <ul className="text-slate-300">
                        <li>Contact details for data-access, deletion, and refund requests will be published before activation</li>
                        <li>Request deletion of account data, subject to accounting retention</li>
                        <li>The owner and legal reviewer must confirm applicable privacy notices and jurisdictional requirements before activation; this draft makes no compliance representation</li>
                    </ul>

                    <h2 className="text-white">5. Human Review Requirement</h2>
                    <p className="text-slate-300">All reports require <strong>coach review before client delivery</strong>. Reports include source labels, uncertainty notes, and proof boundary statements.</p>

                    <h2 className="text-white">6. Coach Responsibilities</h2>
                    <ol className="text-slate-300">
                        <li>Review every report before delivering to a client</li>
                        <li>Use pseudonymous client labels, not real names</li>
                        <li>Do not present reports as employment guarantees</li>
                        <li>Set your own client pricing and engagement terms</li>
                        <li>Obtain client consent before sharing report content</li>
                        <li>Do not enter client PII into the system</li>
                    </ol>

                    <h2 className="text-white">7. Refund and Payment Terms</h2>
                    <h3 className="text-slate-200">7.1 Credit Packs</h3>
                    <ul className="text-slate-300">
                        <li>$49 USD for 5 report credits (one-time purchase)</li>
                        <li>Credits valid for 30 days from purchase date</li>
                        <li>Unused credits expire after 30 days — no carryover, no refund for expired credits</li>
                    </ul>
                    <h3 className="text-slate-200">7.2 Refund Policy</h3>
                    <ul className="text-slate-300">
                        <li>A verified report-generation failure is intended to restore the reserved credit when the ledger identifies the original credit lot</li>
                        <li>Other refund requests will be reviewed under the payment policy published before activation; this draft makes no automatic pro-rated-refund promise</li>
                    </ul>
                    <h3 className="text-slate-200">7.3 Payment Processing</h3>
                    <p className="text-slate-300">Payments processed by Stripe. We do not store card information. Billing disputes: contact [email protected] first, then your card issuer.</p>

                    <h2 className="text-white">8. Email Communications</h2>
                    <p className="text-slate-300">Any transactional or product email, sender identity, mailing address, consent record, and unsubscribe flow must be configured and reviewed for the recipient's jurisdiction before activation. This draft is not a CAN-SPAM, CASL, or other legal-compliance representation.</p>

                    <h2 className="text-white">9. Limitation of Liability</h2>
                    <p className="text-slate-300">This service provides AI-assisted planning artifacts for informational purposes. We are not liable for coaching outcomes, client career decisions, O*NET data accuracy, third-party AI model outputs, or loss of report artifacts after the 30-day retention period.</p>

                    <h2 className="text-white">10. Changes to These Terms</h2>
                    <p className="text-slate-300">Pilot terms may change as the service evolves. Each active version will have a version and content hash. Material changes require explicit re-acceptance before continued pilot access; continued use alone does not constitute acceptance.</p>

                    <h2 className="text-white">11. Contact</h2>
                    <p className="text-slate-300">Questions and contact details will be published before activation. No support-response-time promise is made in this draft.</p>

                    <h2 className="text-white">12. Pilot Termination</h2>
                    <p className="text-slate-300">The owner reserves the right to terminate the pilot at any time. Any notice, credit treatment, and artifact cleanup will follow the active terms and payment policy published at that time; this draft makes no pro-rated-refund, notice-period, or deletion guarantee.</p>

                    <hr className="border-slate-700 my-8" />
                    <p className="text-slate-500 text-sm">This document is versioned at <code>docs/legal/pilot-terms-v1.md</code>. Status: DRAFT — do not activate without owner and legal sign-off.</p>
                </div>
            </main>
        </div>
    );
}
