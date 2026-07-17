import React, { useState } from "react";
import { ArrowRight, Shield, Clock, Palette, Users, CheckCircle2, Database, BarChart3, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NavigationPremium from "@/components/NavigationPremium";
import { redirectToCreditCheckout } from "@/lib/stripe";
import { useSession } from "@/hooks/useSession";
import { useToast } from "@/hooks/use-toast";
import { CoachAuditWorkspacePanel } from "@/components/proof/ProofVisibilityPanels";
import { analytics } from "@/lib/posthog";
import { checkPilotEnrollment } from "@/lib/pilotEnrollment";

// Enrollment stays closed until the owner publishes and approves a terms hash
// in pilot_terms_versions. This prevents a draft checkbox from becoming access.
const PILOT_ENROLLMENT_OPEN = false;

/**
 * ForCoachesPage - B2B Landing Page for Career Coaches
 *
 * Value Proposition: "Generate Source-Labeled Automation Transition Planning Artifacts"
 * Target: Career counselors, executive coaches, resume writers
 * Pricing: $49/5-credit pack (pilot). Coach Pro subscription deferred until pilot validates.
 */
export default function ForCoachesPage() {
    const navigate = useNavigate();
    const { session } = useSession();
    const { toast } = useToast();
    const [buyingCredits, setBuyingCredits] = useState(false);
    const [pilotEnrolled, setPilotEnrolled] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [showEnrollForm, setShowEnrollForm] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<'US' | 'CA'>('US');
    const [termsAccepted, setTermsAccepted] = useState(false);

    React.useEffect(() => {
        analytics.coachLandingViewed();
        if (session?.user) {
            checkPilotEnrollment(session.user.id).then(setPilotEnrolled).catch(() => {});
        }
    }, [session?.user]);

    const handleEnrollInPilot = async () => {
        if (!PILOT_ENROLLMENT_OPEN) {
            toast({ title: 'Pilot enrollment is not open', description: 'Approved pilot terms will be published before enrollment opens.', variant: 'destructive' });
            return;
        }
        if (!session?.user) {
            navigate('/auth');
            return;
        }
        if (!termsAccepted) {
            toast({ title: 'Terms Required', description: 'Please accept the pilot terms to continue.', variant: 'destructive' });
            return;
        }
        setEnrolling(true);
        try {
            // The inactive branch is retained as an owner-operated activation
            // seam; it cannot run while the published terms are still draft.
            throw new Error('Pilot enrollment is not open');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to enroll';
            toast({ title: 'Error', description: message, variant: 'destructive' });
        } finally {
            setEnrolling(false);
        }
    };

    const handleBuyCredits = async () => {
        if (!PILOT_ENROLLMENT_OPEN) {
            toast({ title: 'Pilot enrollment is not open', description: 'View the sample report while the owner/legal terms review is pending.', variant: 'destructive' });
            return;
        }
        if (!session?.user) {
            navigate('/auth');
            return;
        }
        if (!pilotEnrolled) {
            setShowEnrollForm(true);
            return;
        }
        setBuyingCredits(true);
        analytics.coachCheckoutStarted();
        try {
            await redirectToCreditCheckout('starter', session.user.id);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to start checkout';
            toast({ title: 'Error', description: message, variant: 'destructive' });
        } finally {
            setBuyingCredits(false);
        }
    };

    const features = [
        {
            icon: Clock,
            title: "Fast Draft Audits",
            description: "Generate a source-labeled automation defense audit draft for human review before client delivery."
        },
        {
            icon: Palette,
            title: "Coach-Branded",
            description: "Your logo, colors, and review notes on a planning artifact that stays inside your coaching workflow."
        },
        {
            icon: Shield,
            title: "O*NET-Grounded Analysis",
            description: "Source-labeled task assessments grounded in U.S. Department of Labor O*NET data, with caveats your clients cannot get from a generic chat answer."
        },
        {
            icon: Users,
            title: "Evidence Boundaries",
            description: "Show source IDs, review state, uncertainty, and what the estimate does not prove."
        }
    ];

    const pricingTiers = [
        {
            name: "Credit Pack",
            price: "$49",
            unit: "for 5 report credits",
            features: [
                "Print-ready HTML reports",
                "Custom branding",
                "No subscription required",
                "Credits valid for 30 days (pilot)"
            ],
            cta: "Enroll in Pilot",
            highlighted: true
        }
    ];

    // No testimonials displayed until first-party evidence is collected from paying coaches.
    // Testimonials require explicit permission after genuine use + proof boundary.

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#0F172A]">
            <NavigationPremium />
            <main>
            <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
                <CoachAuditWorkspacePanel />
            </section>

            {/* Hero Section */}
            <section className="relative pt-24 pb-16 overflow-hidden">
                <motion.div
                    className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 mb-6">
                            <Shield className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-medium text-emerald-300">For Career Professionals</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                            Build Source-Labeled<br />
                            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                Automation Defense Audits
                            </span>
                        </h1>

                        <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
                            Differentiate your coaching practice with source-labeled,
                            human-reviewed automation transition planning artifacts, uncertainty notes,
                            and reskilling roadmaps grounded in U.S. Department of Labor O*NET data.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                size="lg"
                                onClick={() => {
                                    analytics.coachSampleViewed();
                                    navigate("/sample-report");
                                }}
                                className="w-full whitespace-normal bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-6 text-base font-semibold text-white shadow-lg hover:from-emerald-400 hover:to-teal-400 sm:w-auto sm:px-8 sm:text-lg"
                            >
                                View Sample Report
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => navigate("/pricing")}
                                className="w-full whitespace-normal border-2 border-slate-600 px-4 py-6 text-base text-slate-200 hover:bg-slate-800 sm:w-auto sm:px-8 sm:text-lg"
                            >
                                View Pricing
                            </Button>
                        </div>
                    </div>

                    {/* Report Preview Mock */}
                    <motion.div
                        className="relative max-w-4xl mx-auto"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        <div className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl p-8 border-4 border-emerald-500/30">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">YL</span>
                                    </div>
                                    <div>
                                        <div className="text-slate-900 font-bold">Your Logo Here</div>
                                        <div className="text-slate-500 text-sm">Career Resilience Audit</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-400 text-sm">Client Report</div>
                                    <div className="text-slate-600 font-medium">John Smith</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-red-50 p-4 rounded-lg text-center">
                                    <div className="text-3xl font-bold text-red-600">73%</div>
                                    <div className="text-sm text-red-700">Current Exposure</div>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-lg text-center">
                                    <div className="text-3xl font-bold text-amber-600">3</div>
                                    <div className="text-sm text-amber-700">Bridge Roles</div>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-lg text-center">
                                    <div className="text-3xl font-bold text-emerald-600">18%</div>
                                    <div className="text-sm text-emerald-700">Target Exposure</div>
                                </div>
                            </div>

                            <div className="h-2 bg-slate-200 rounded mb-2" />
                            <div className="h-2 bg-slate-200 rounded w-3/4 mb-2" />
                            <div className="h-2 bg-slate-200 rounded w-1/2" />
                        </div>

                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg">
                            Draft generated for coach review
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Data Authority Bar */}
            <section className="py-8 border-y border-slate-700/50 bg-slate-900/30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-slate-400 text-sm">
                        <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-emerald-400" />
                            <span><strong className="text-white">O*NET</strong> Occupation Database</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-emerald-400" />
                            <span>Task-level <strong className="text-white">AI-assisted</strong> analysis</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-emerald-400" />
                            <span>Source-verified <strong className="text-white">U.S. Dept. of Labor</strong> data boundary</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-400" />
                            <span><strong className="text-white">122,974</strong> ICF Coach Practitioners Worldwide (ICF 2025)</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Value Summary Section */}
            <section className="py-16 bg-slate-900/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white text-center mb-4">
                        How Coaches Use These Artifacts
                    </h2>
                    <p className="text-slate-400 text-center mb-10 max-w-2xl mx-auto">
                        Package a reviewed planning artifact with clear source and limitation boundaries.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-slate-800/60 rounded-xl p-6 text-center border border-slate-700/50">
                            <Clock className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                            <div className="text-lg font-bold text-white mb-1">Draft in Minutes</div>
                            <div className="text-slate-400 text-sm">Generate a structured draft grounded in O*NET data</div>
                        </div>
                        <div className="bg-slate-800/60 rounded-xl p-6 text-center border border-slate-700/50">
                            <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                            <div className="text-lg font-bold text-white mb-1">Review Before Delivery</div>
                            <div className="text-slate-400 text-sm">Coach-approved, with source labels and caveats intact</div>
                        </div>
                        <div className="bg-gradient-to-b from-emerald-900/40 to-slate-800/60 rounded-xl p-6 text-center border-2 border-emerald-500/40">
                            <Palette className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                            <div className="text-lg font-bold text-emerald-400 mb-1">Your Brand</div>
                            <div className="text-slate-400 text-sm">Logo, colors, and footer for your coaching practice</div>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-slate-300 text-lg">
                            You set your own client pricing and engagement terms. No revenue or ROI claims are made here.
                        </p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">
                        How It Works
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "1",
                                title: "Enter Client's Occupation",
                                description: "Search O*NET occupations. Our AI analyzes tasks, skills, abilities, and technologies."
                            },
                            {
                                step: "2",
                                title: "Customize & Brand",
                                description: "Upload your logo, choose colors, add footer text. The report carries your coaching brand."
                            },
                            {
                                step: "3",
                                title: "Review & Deliver",
                                description: "Review the print-ready HTML report. Print to PDF for client delivery, with source labels, caveats, and proof boundary intact."
                            }
                        ].map((item) => (
                            <motion.div
                                key={item.step}
                                className="text-center"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
                                    {item.step}
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                                <p className="text-slate-400">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Demo Video Placeholder */}
            <section className="py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div
                        className="relative bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden cursor-pointer group"
                        onClick={() => navigate("/sample-report")}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && navigate("/sample-report")}
                    >
                        <div className="aspect-video flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/30 transition-colors">
                                    <Play className="h-10 w-10 text-emerald-400 ml-1" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">See It In Action</h3>
                                <p className="text-slate-400">View a static sample report with pseudonymous data</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-16 bg-slate-900/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">
                        Why Coaches Review APO Artifacts
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="bg-emerald-500/20 p-3 rounded-lg">
                                        <feature.icon className="h-6 w-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                                        <p className="text-slate-400">{feature.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-16">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white text-center mb-4">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
                        Pricing is transparent; client billing and ROI claims must be supported by your own engagement evidence.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                        {pricingTiers.map((tier) => (
                            <div
                                key={tier.name}
                                className={`relative rounded-2xl p-8 ${tier.highlighted
                                        ? 'bg-gradient-to-b from-emerald-900/50 to-slate-900 border-2 border-emerald-500/50'
                                        : 'bg-slate-800/50 border border-slate-700/50'
                                    }`}
                            >
                                {showEnrollForm && !pilotEnrolled && (
                                    <div className="mb-4 p-4 rounded-lg bg-slate-800 border border-emerald-500/30">
                                        <h4 className="text-white font-semibold mb-3">Pilot Enrollment</h4>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-slate-300 text-sm block mb-1">Country (US/CA only)</label>
                                                <select
                                                    value={selectedCountry}
                                                    onChange={(e) => setSelectedCountry(e.target.value as 'US' | 'CA')}
                                                    className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600"
                                                >
                                                    <option value="US">United States</option>
                                                    <option value="CA">Canada</option>
                                                </select>
                                            </div>
                                            <label className="flex items-start gap-2 text-slate-300 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={termsAccepted}
                                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                                    disabled={!PILOT_ENROLLMENT_OPEN}
                                                    className="mt-1"
                                                />
                                                <span>I acknowledge that the <a href="/pilot-terms" className="text-emerald-400 underline" target="_blank" rel="noopener noreferrer">pilot terms are still a draft</a>; enrollment is closed until an approved version is published.</span>
                                            </label>
                                            <Button
                                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white"
                                                onClick={handleEnrollInPilot}
                                                disabled={!PILOT_ENROLLMENT_OPEN || enrolling || !termsAccepted}
                                            >
                                                {enrolling ? 'Enrolling...' : 'Enrollment Closed Pending Approval'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <h3 className="text-xl font-semibold text-white mb-2">{tier.name}</h3>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-white">{tier.price}</span>
                                    <span className="text-slate-400 ml-2">{tier.unit}</span>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-300">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className="w-full py-6 text-lg bg-emerald-500 hover:bg-emerald-400 text-white"
                                    onClick={() => handleBuyCredits()}
                                    disabled={buyingCredits || enrolling || !PILOT_ENROLLMENT_OPEN}
                                >
                                    {buyingCredits ? 'Redirecting...' : pilotEnrolled ? 'Buy Credits' : 'Pilot Enrollment Pending'}
                                </Button>
                                {pilotEnrolled && (
                                    <p className="text-center text-sm text-emerald-400 mt-2">Pilot enrollment confirmed</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Data Authority — No Testimonials Until First-Party Evidence */}
            <section className="py-16 bg-slate-900/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">
                        Data Sources & Methodology
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 text-center">
                            <div className="text-4xl font-bold text-emerald-400 mb-2">O*NET</div>
                            <div className="text-slate-300 font-medium mb-1">U.S. Dept. of Labor Data</div>
                            <div className="text-slate-500 text-sm">Source-verified occupation and task-rating boundary. Not generic chat guesses.</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 text-center">
                            <div className="text-4xl font-bold text-emerald-400 mb-2">Gemini AI</div>
                            <div className="text-slate-300 font-medium mb-1">Multi-Factor Analysis</div>
                            <div className="text-slate-500 text-sm">Scoring across tasks, skills, abilities, knowledge, and technologies.</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 text-center">
                            <div className="text-4xl font-bold text-emerald-400 mb-2">A* Pathfinding</div>
                            <div className="text-slate-300 font-medium mb-1">Bridge Role Discovery</div>
                            <div className="text-slate-500 text-sm">Algorithm finds realistic career transitions via skill overlap.</div>
                        </div>
                    </div>

                    <div className="max-w-3xl mx-auto text-center mt-12">
                        <p className="text-slate-400 text-sm">
                            No testimonials are displayed because we have not yet collected first-party evidence from paying coaches.
                            Testimonials will require explicit permission after genuine use.
                        </p>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Ready to Elevate Your Practice?
                    </h2>
                    <p className="text-slate-400 mb-8">
                        Generate source-labeled, human-reviewed planning artifacts for your coaching practice.
                    </p>
                    <Button
                        size="lg"
                        onClick={() => {
                            analytics.coachSampleViewed();
                            navigate("/sample-report");
                        }}
                        className="w-full whitespace-normal bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-6 text-base font-semibold text-white hover:from-emerald-400 hover:to-teal-400 sm:w-auto sm:px-10 sm:text-lg"
                    >
                        View Sample Report
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </section>
            </main>
        </div>
    );
}
