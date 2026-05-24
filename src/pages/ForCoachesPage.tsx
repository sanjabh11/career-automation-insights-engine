import React, { useState } from "react";
import { ArrowRight, Shield, Clock, Palette, Users, CreditCard, CheckCircle2, Star, DollarSign, Database, BarChart3, Play, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import NavigationPremium from "@/components/NavigationPremium";
import { redirectToCreditCheckout, CREDIT_PACKAGES } from "@/lib/stripe";
import { useSession } from "@/hooks/useSession";
import { useToast } from "@/hooks/use-toast";

/**
 * ForCoachesPage - B2B Landing Page for Career Coaches
 * 
 * Value Proposition: "Generate Future-Proof Client Reports in 30 Seconds"
 * Target: Career counselors, executive coaches, resume writers
 * Pricing Push: $149/mo Coach tier or $20/report PAYG
 */
export default function ForCoachesPage() {
    const navigate = useNavigate();
    const { session } = useSession();
    const { toast } = useToast();
    const [buyingCredits, setBuyingCredits] = useState(false);

    const handleBuyCredits = async () => {
        if (!session?.user) {
            navigate('/auth');
            return;
        }
        setBuyingCredits(true);
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
            title: "30-Second Reports",
            description: "Generate comprehensive automation risk audits in under a minute. No more hours of manual research."
        },
        {
            icon: Palette,
            title: "100% White Label",
            description: "Your logo, your colors, your brand. We're the invisible intelligence engine powering your practice."
        },
        {
            icon: Shield,
            title: "O*NET-Grounded Analysis",
            description: "Source-labeled task assessments grounded in the O*NET 30.3 release boundary, with caveats your clients cannot get from a generic chat answer."
        },
        {
            icon: Users,
            title: "Client Authority",
            description: "Data-backed career advice builds trust. Stop guessing - start showing quantified evidence."
        }
    ];

    const pricingTiers = [
        {
            name: "Pay-As-You-Go",
            price: "$20",
            unit: "per report",
            features: [
                "White-label PDF reports",
                "Custom branding",
                "No commitment",
                "Perfect for 1-5 clients/month"
            ],
            cta: "Buy Credits",
            highlighted: false
        },
        {
            name: "Coach Pro",
            price: "$149",
            unit: "per month",
            features: [
                "15 reports included ($10/report value)",
                "Client management dashboard",
                "Priority support",
                "Unlimited occupation searches",
                "Perfect for 5-20 clients/month"
            ],
            cta: "Start Free Trial",
            highlighted: true,
            badge: "Most Popular"
        }
    ];

    const testimonialData = {
        quote: "I used to spend 2 hours researching each client's industry before our sessions. Now I generate a personalized automation risk report in 30 seconds and charge clients $150 for it.",
        author: "Career Coach",
        role: "Executive Career Services"
    };

    return (
        <div className="min-h-screen bg-[#0F172A]">
            <NavigationPremium />
            <main>

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
                            Generate "Future-Proof"<br />
                            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                Client Reports in 30 Seconds
                            </span>
                        </h1>

                        <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
                            Stop guessing which jobs are safe. Differentiate your coaching practice with
                            white-labeled, AI-driven automation risk audits and reskilling roadmaps.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                size="lg"
                                onClick={() => navigate("/tools/counselor-reports")}
                                className="w-full whitespace-normal bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-6 text-base font-semibold text-white shadow-lg hover:from-emerald-400 hover:to-teal-400 sm:w-auto sm:px-8 sm:text-lg"
                            >
                                Get Your Free Sample Report
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
                                    <div className="text-sm text-red-700">Current Risk</div>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-lg text-center">
                                    <div className="text-3xl font-bold text-amber-600">3</div>
                                    <div className="text-sm text-amber-700">Bridge Roles</div>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-lg text-center">
                                    <div className="text-3xl font-bold text-emerald-600">18%</div>
                                    <div className="text-sm text-emerald-700">Target Risk</div>
                                </div>
                            </div>

                            <div className="h-2 bg-slate-200 rounded mb-2" />
                            <div className="h-2 bg-slate-200 rounded w-3/4 mb-2" />
                            <div className="h-2 bg-slate-200 rounded w-1/2" />
                        </div>

                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg">
                            ✨ Generated in 28 seconds
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
                            <span><strong className="text-white">1,016</strong> O*NET Occupations</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-emerald-400" />
                            <span><strong className="text-white">19,000+</strong> Task-Level Analyses</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-emerald-400" />
                            <span>Source-verified <strong className="text-white">O*NET 30.3</strong> boundary + <strong className="text-white">AI-assisted</strong> analysis</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-emerald-400" />
                            <span><strong className="text-white">109,200+</strong> Coaches Worldwide (ICF 2023)</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ROI Calculator Section */}
            <section className="py-16 bg-slate-900/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white text-center mb-4">
                        The Math is Simple
                    </h2>
                    <p className="text-slate-400 text-center mb-10 max-w-2xl mx-auto">
                        Stop selling time. Start selling insights.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-slate-800/60 rounded-xl p-6 text-center border border-slate-700/50">
                            <DollarSign className="h-8 w-8 text-red-400 mx-auto mb-3" />
                            <div className="text-3xl font-bold text-white mb-1">$10</div>
                            <div className="text-slate-400 text-sm">Your cost per report</div>
                            <div className="text-slate-500 text-xs mt-1">($149/mo &#247; 15 reports)</div>
                        </div>
                        <div className="bg-slate-800/60 rounded-xl p-6 text-center border border-slate-700/50">
                            <TrendingUp className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                            <div className="text-3xl font-bold text-white mb-1">$150-$300</div>
                            <div className="text-slate-400 text-sm">What you charge clients</div>
                            <div className="text-slate-500 text-xs mt-1">Industry standard for career audits</div>
                        </div>
                        <div className="bg-gradient-to-b from-emerald-900/40 to-slate-800/60 rounded-xl p-6 text-center border-2 border-emerald-500/40">
                            <Zap className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                            <div className="text-3xl font-bold text-emerald-400 mb-1">15x ROI</div>
                            <div className="text-slate-400 text-sm">Return on your subscription</div>
                            <div className="text-slate-500 text-xs mt-1">One client pays for 10 months</div>
                        </div>
                    </div>

                    <div className="text-center">
                        <p className="text-slate-300 text-lg">
                            With just <strong className="text-emerald-400">2 clients per month</strong>, your Coach Pro subscription pays for itself <strong className="text-white">20x over</strong>.
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
                                description: "Search from 1,016 O*NET occupations. Our AI analyzes tasks, skills, abilities, and technologies."
                            },
                            {
                                step: "2",
                                title: "Customize & Brand",
                                description: "Upload your logo, choose colors, add footer text. The report looks 100% like it came from your firm."
                            },
                            {
                                step: "3",
                                title: "Deliver & Charge",
                                description: "Download the PDF report. Share with your client. Charge $150-$300 for the 'Career Future-Proofing Audit.'"
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
                        onClick={() => navigate("/tools/counselor-reports")}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && navigate("/tools/counselor-reports")}
                    >
                        <div className="aspect-video flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/30 transition-colors">
                                    <Play className="h-10 w-10 text-emerald-400 ml-1" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">See It In Action</h3>
                                <p className="text-slate-400">Try the report generator yourself — no signup required</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-16 bg-slate-900/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">
                        Why Top Coaches Choose APO
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
                        One client session covers your monthly cost. Generate unlimited reports, charge clients $150-$300 each.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {pricingTiers.map((tier) => (
                            <div
                                key={tier.name}
                                className={`relative rounded-2xl p-8 ${tier.highlighted
                                        ? 'bg-gradient-to-b from-emerald-900/50 to-slate-900 border-2 border-emerald-500/50'
                                        : 'bg-slate-800/50 border border-slate-700/50'
                                    }`}
                            >
                                {tier.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                                        {tier.badge}
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
                                    className={`w-full py-6 text-lg ${tier.highlighted
                                            ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                                            : 'bg-slate-700 hover:bg-slate-600 text-white'
                                        }`}
                                    onClick={() => tier.highlighted ? navigate("/pricing") : handleBuyCredits()}
                                    disabled={!tier.highlighted && buyingCredits}
                                >
                                    {!tier.highlighted && buyingCredits ? 'Redirecting...' : tier.cta}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof — Data-as-Testimonials */}
            <section className="py-16 bg-slate-900/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-white text-center mb-12">
                        Why Coaches Trust Our Data
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 text-center">
                            <div className="text-4xl font-bold text-emerald-400 mb-2">O*NET 30.3</div>
                            <div className="text-slate-300 font-medium mb-1">U.S. Dept. of Labor Data</div>
                            <div className="text-slate-500 text-sm">Source-verified occupation and task-rating boundary. Not generic chat guesses.</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 text-center">
                            <div className="text-4xl font-bold text-emerald-400 mb-2">Gemini AI</div>
                            <div className="text-slate-300 font-medium mb-1">Enterprise-Grade Analysis</div>
                            <div className="text-slate-500 text-sm">Multi-factor scoring across tasks, skills, abilities, knowledge, and technologies.</div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 text-center">
                            <div className="text-4xl font-bold text-emerald-400 mb-2">A* Pathfinding</div>
                            <div className="text-slate-300 font-medium mb-1">Bridge Role Discovery</div>
                            <div className="text-slate-500 text-sm">Algorithm finds realistic career transitions via skill overlap — not "unrealistic leaps."</div>
                        </div>
                    </div>

                    {/* Testimonial */}
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="flex justify-center gap-1 mb-6">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="h-6 w-6 text-amber-400 fill-amber-400" />
                            ))}
                        </div>
                        <blockquote className="text-2xl text-white font-light italic mb-6">
                            "{testimonialData.quote}"
                        </blockquote>
                        <div className="text-slate-400">
                            <span className="font-medium text-slate-300">{testimonialData.author}</span>
                            <span className="mx-2">·</span>
                            <span>{testimonialData.role}</span>
                        </div>
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
                        Join career professionals who are using AI to deliver more value to their clients.
                    </p>
                    <Button
                        size="lg"
                        onClick={() => navigate("/tools/counselor-reports")}
                        className="w-full whitespace-normal bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-6 text-base font-semibold text-white hover:from-emerald-400 hover:to-teal-400 sm:w-auto sm:px-10 sm:text-lg"
                    >
                        Generate Your First Report Free
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </section>
            </main>
        </div>
    );
}
