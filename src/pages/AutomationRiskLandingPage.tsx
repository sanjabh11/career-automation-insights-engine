import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    ShieldAlert,
    ShieldCheck,
    ShieldX,
    TrendingUp,
    TrendingDown,
    Zap,
    Brain,
    ArrowRight,
    Mail,
    Users,
    Briefcase
} from 'lucide-react';

// Import SEO occupation data (50+ occupations for programmatic SEO)
import { occupationRiskData, occupationSlugs } from '@/data/occupationRiskData';

export const AutomationRiskLandingPage: React.FC = () => {
    const { occupation } = useParams<{ occupation: string }>();
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    const data = occupation ? occupationRiskData[occupation] : null;

    useEffect(() => {
        // Set page title for SEO
        if (data) {
            document.title = `Will AI Replace ${data.title}s? Automation Risk Analysis | APO Dashboard`;

            // Add meta description
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', data.seoDescription);
            } else {
                const meta = document.createElement('meta');
                meta.name = 'description';
                meta.content = data.seoDescription;
                document.head.appendChild(meta);
            }

            // Add schema.org JSON-LD structured data
            const existingSchema = document.querySelector('script[data-schema="automation-risk"]');
            if (existingSchema) {
                existingSchema.remove();
            }

            const schema = {
                "@context": "https://schema.org",
                "@type": "Article",
                "headline": `Will AI Replace ${data.title}s? Automation Risk Analysis`,
                "description": data.seoDescription,
                "author": {
                    "@type": "Organization",
                    "name": "APO Dashboard",
                    "url": "https://apodashboard.com"
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "APO Dashboard"
                },
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": window.location.href
                },
                "about": {
                    "@type": "Occupation",
                    "name": data.title,
                    "occupationalCategory": data.code,
                    "estimatedSalary": {
                        "@type": "MonetaryAmount",
                        "currency": "USD",
                        "value": data.averageSalary.replace(/[^0-9]/g, '')
                    }
                },
                "keywords": [
                    `${data.title} automation risk`,
                    `AI replacing ${data.title}s`,
                    `${data.title} future career`,
                    `${data.industry} automation`,
                    "career future-proofing"
                ]
            };

            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.setAttribute('data-schema', 'automation-risk');
            script.textContent = JSON.stringify(schema);
            document.head.appendChild(script);

            // Cleanup on unmount
            return () => {
                const schemaScript = document.querySelector('script[data-schema="automation-risk"]');
                if (schemaScript) schemaScript.remove();
            };
        }
    }, [data]);

    if (!data) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Occupation Not Found</CardTitle>
                        <CardDescription>
                            We don't have data for this occupation yet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link to="/">
                            <Button>Search All Occupations</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const riskLevel = data.overallRisk <= 30 ? 'Low' : data.overallRisk <= 60 ? 'Medium' : 'High';
    const riskColor = data.overallRisk <= 30 ? 'text-emerald-500' : data.overallRisk <= 60 ? 'text-amber-500' : 'text-red-500';

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Submit to email list
        setIsSubmitted(true);
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* Hero Section */}
            <section className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto text-center">
                    <Badge variant="outline" className="mb-4">
                        AI Career Analysis
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Will AI Replace <span className="text-primary">{data.title}s</span>?
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8">
                        {data.seoDescription}
                    </p>

                    {/* Risk Score Hero */}
                    <div className="bg-card border rounded-2xl p-8 shadow-lg mb-8">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <Brain className="h-12 w-12 text-primary" />
                            <div className="text-left">
                                <div className={`text-5xl font-bold ${riskColor}`}>
                                    {data.overallRisk}%
                                </div>
                                <div className="text-lg text-muted-foreground">
                                    Automation Risk Score
                                </div>
                            </div>
                        </div>
                        <Progress value={data.overallRisk} className="h-4 mb-4" />
                        <Badge className={`${riskColor} text-lg px-4 py-1`}>
                            {riskLevel} Risk
                        </Badge>
                    </div>
                </div>
            </section>

            {/* Key Stats */}
            <section className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-6 text-center">
                            <Briefcase className="h-8 w-8 text-primary mx-auto mb-2" />
                            <div className="text-2xl font-bold">{data.averageSalary}</div>
                            <div className="text-sm text-muted-foreground">Average Salary</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <TrendingUp className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                            <div className="text-2xl font-bold">{data.jobGrowth}</div>
                            <div className="text-sm text-muted-foreground">Job Growth (10yr)</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6 text-center">
                            <Users className="h-8 w-8 text-[var(--accent-primary)] mx-auto mb-2" />
                            <div className="text-2xl font-bold">{data.industry}</div>
                            <div className="text-sm text-muted-foreground">Industry</div>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* High Risk Tasks */}
            <section className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <ShieldX className="h-6 w-6 text-red-500" />
                        Tasks at Highest Automation Risk
                    </h2>
                    <div className="grid gap-3">
                        {data.highRiskTasks.map((task, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <TrendingDown className="h-5 w-5 text-red-500 flex-shrink-0" />
                                <span>{task}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Safe Skills */}
            <section className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-emerald-500" />
                        Skills That Remain Human
                    </h2>
                    <div className="grid gap-3">
                        {data.safeSkills.map((skill, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                <span>{skill}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Reskilling Suggestions */}
            <section className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Zap className="h-6 w-6 text-primary" />
                        Recommended Reskilling Paths
                    </h2>
                    <div className="grid gap-3">
                        {data.reskillingSuggestions.map((suggestion, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                                <ArrowRight className="h-5 w-5 text-primary flex-shrink-0" />
                                <span>{suggestion}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-4 py-16">
                <div className="max-w-2xl mx-auto">
                    <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">Get Your Personalized Career Future-Proofing Report</CardTitle>
                            <CardDescription>
                                This is just a preview. Get a detailed, personalized analysis of YOUR skills and tasks.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!isSubmitted ? (
                                <form onSubmit={handleEmailSubmit} className="space-y-4">
                                    <Input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="text-lg py-6"
                                    />
                                    <Button type="submit" className="w-full text-lg py-6">
                                        <Mail className="mr-2 h-5 w-5" />
                                        Get My Free Report
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground">
                                        Or <Link to="/pricing" className="text-primary underline">sign up as a Career Coach</Link> to generate white-labeled reports for your clients.
                                    </p>
                                </form>
                            ) : (
                                <div className="text-center py-8">
                                    <ShieldCheck className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold mb-2">Check Your Email!</h3>
                                    <p className="text-muted-foreground">
                                        We've sent your personalized report to {email}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Coach CTA */}
            <section className="container mx-auto px-4 py-8 pb-16">
                <div className="max-w-4xl mx-auto text-center bg-card border rounded-xl p-8">
                    <h2 className="text-xl font-bold mb-2">Are You a Career Coach?</h2>
                    <p className="text-muted-foreground mb-4">
                        Generate white-labeled Career Future-Proofing Reports for your clients.
                        You pay $12 per report. Clients pay $150+. Keep the difference.
                    </p>
                    <Link to="/pricing">
                        <Button size="lg">
                            Start Free Trial
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default AutomationRiskLandingPage;
