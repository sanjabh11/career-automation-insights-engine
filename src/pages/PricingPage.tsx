/**
 * Pricing Page Component
 * Displays subscription tiers with features and pricing
 * Based on PRD Section 3.1 (B2C Individual Freemium SaaS)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Zap, TrendingUp, Shield, Award } from 'lucide-react';
import { SUBSCRIPTION_TIERS, redirectToCheckout, getAnnualSavings, type SubscriptionTier } from '@/lib/stripe';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const PricingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { currentTier, loading: subscriptionLoading } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const [highlightedTier, setHighlightedTier] = useState<string | null>(null);

  // Pre-select tier from URL parameters (e.g., /pricing?tier=navigator&feature=apoChecks)
  useEffect(() => {
    const tierParam = searchParams.get('tier');
    const featureParam = searchParams.get('feature');

    if (tierParam) {
      setHighlightedTier(tierParam);
      // Scroll to pricing cards after a brief delay
      setTimeout(() => {
        const element = document.getElementById('pricing-cards');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }

    // Log conversion funnel event
    if (featureParam) {
      // DISABLED: Analytics events temporarily disabled due to schema issues
      /*
      const logConversionEvent = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('analytics_events').insert({
              user_id: user.id,
              event_type: 'pricing_page_visited',
              payload: {
                source: 'upgrade_prompt',
                feature: featureParam,
                tier_param: tierParam,
              },
            });
          }
        } catch (error) {
          console.error('Error logging conversion event:', error);
        }
      };
      logConversionEvent();
      */
    }
  }, [searchParams]);

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (tier.id === 'free') {
      navigate('/auth');
      return;
    }

    try {
      setLoadingTier(tier.id);

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Sign in Required',
          description: 'Please sign in to subscribe to a plan.',
        });
        navigate('/auth');
        return;
      }

      // Redirect to Stripe Checkout
      await redirectToCheckout(tier.id as 'defender' | 'coach', user.id, billingPeriod);
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingTier(null);
    }
  };

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'defender':
        return <Shield className="w-6 h-6" />;
      case 'coach':
        return <Award className="w-6 h-6" />;
      default:
        return <TrendingUp className="w-6 h-6" />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-amber)]">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Get personalized automation risk insights and career guidance tailored to your needs
          </p>

          {/* Billing Period Toggle */}
          <div className="inline-flex items-center gap-4 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setBillingPeriod('month')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${billingPeriod === 'month'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('year')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${billingPeriod === 'year'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              Yearly
              <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div id="pricing-cards" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {SUBSCRIPTION_TIERS.map((tier) => {
            const isCurrentPlan = currentTier === tier.id;
            const isHighlighted = highlightedTier === tier.id;
            const price = billingPeriod === 'year' ? tier.annualPrice : tier.monthlyPrice;
            const monthlyPrice = billingPeriod === 'year' ? tier.annualPrice / 12 : tier.monthlyPrice;
            const savings = getAnnualSavings(tier);

            return (
              <Card
                key={tier.id}
                className={`relative flex flex-col ${isHighlighted
                  ? 'border-primary shadow-2xl scale-105 ring-2 ring-primary/30'
                  : tier.recommended
                    ? 'border-primary shadow-lg scale-105'
                    : 'border-border'
                  }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[var(--accent-primary)] text-[var(--bg-primary)]">
                      {tier.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4 text-primary">
                    {getTierIcon(tier.id)}
                  </div>
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <CardDescription className="mt-2">
                    <div className="text-3xl font-bold text-foreground">
                      ${monthlyPrice.toFixed(0)}
                      <span className="text-base font-normal text-muted-foreground">
                        /month
                      </span>
                    </div>
                    {billingPeriod === 'year' && tier.monthlyPrice > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        ${price.toFixed(0)} billed annually
                        <span className="ml-2 text-emerald-500 font-medium">Save ${savings}</span>
                      </div>
                    )}
                    {tier.tagline && (
                      <div className="text-sm text-primary mt-2 font-medium">{tier.tagline}</div>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Usage Limits */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      MONTHLY LIMITS
                    </p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">APO Checks</span>
                        <span className="font-medium">
                          {tier.limits.apoChecksPerMonth === 'unlimited'
                            ? 'Unlimited'
                            : tier.limits.apoChecksPerMonth}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AI Messages</span>
                        <span className="font-medium">
                          {tier.limits.aiChatMessagesPerMonth === 'unlimited'
                            ? 'Unlimited'
                            : tier.limits.aiChatMessagesPerMonth}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Saved Analyses</span>
                        <span className="font-medium">
                          {tier.limits.savedAnalyses === 'unlimited'
                            ? 'Unlimited'
                            : tier.limits.savedAnalyses}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-4">
                  <Button
                    onClick={() => handleSelectPlan(tier)}
                    disabled={isCurrentPlan || loadingTier === tier.id || subscriptionLoading}
                    className={`w-full ${tier.recommended
                      ? 'bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[var(--bg-primary)]'
                      : ''
                      }`}
                    variant={tier.recommended ? 'default' : 'outline'}
                  >
                    {loadingTier === tier.id
                      ? 'Loading...'
                      : isCurrentPlan
                        ? 'Current Plan'
                        : tier.id === 'free'
                          ? 'Get Started Free'
                          : `Select ${tier.name}`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Coach Pro CTA */}
        <div className="mt-12 max-w-4xl mx-auto">
          <Card className="border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-[var(--accent-primary)]/5">
            <CardHeader className="text-center">
              <Badge variant="outline" className="mx-auto mb-2 text-amber-500 border-amber-500/30">For Career Coaches</Badge>
              <CardTitle className="text-2xl">Coach Pro — White-Label Reports</CardTitle>
              <CardDescription className="text-base mt-2">
                Generate branded AI career reports for your clients. Pay $10/report. Charge $150+. <strong>15x ROI.</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold mb-2">Your Brand, Your Reports</h4>
                  <p className="text-sm text-muted-foreground">
                    Custom logo, colors, and domain masking on every PDF
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Pay-As-You-Go</h4>
                  <p className="text-sm text-muted-foreground">
                    No subscription. Buy credits, generate reports, bill your clients
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">AI + O*NET Data</h4>
                  <p className="text-sm text-muted-foreground">
                    Enterprise-grade intelligence that no competitor offers at this price
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate('/sample-report')}
                  variant="outline"
                >
                  Try Sample Report Free
                </Button>
                <Button
                  size="lg"
                  onClick={() => navigate('/for-coaches')}
                  className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[var(--bg-primary)]"
                >
                  Learn About Coach Pro
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enterprise CTA */}
        <div className="mt-8 max-w-4xl mx-auto">
          <Card className="border-2 border-[var(--accent-primary)]/20 bg-gradient-to-br from-[var(--accent-primary)]/5 to-[var(--accent-amber)]/5">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Enterprise & Workforce Audit</CardTitle>
              <CardDescription className="text-base mt-2">
                Bulk-analyze your entire workforce. CSV upload, department-level risk scoring, and executive PDF reports.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold mb-2">Workforce Audit PDF</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload a CSV roster → get a C-suite-ready automation risk report
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">HRIS Integration</h4>
                  <p className="text-sm text-muted-foreground">
                    Connect with Workday, BambooHR, SAP, and more
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Custom Workshops</h4>
                  <p className="text-sm text-muted-foreground">
                    On-site training and strategy sessions for your leadership team
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                onClick={() => navigate('/contact-sales')}
                className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[var(--bg-primary)]"
              >
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                and we'll prorate any charges.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, American Express) and debit cards through Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a refund policy?</h3>
              <p className="text-muted-foreground">
                We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How is APO score calculated?</h3>
              <p className="text-muted-foreground">
                Our Automation Potential of Occupations (APO) score combines O*NET task data,
                skill requirements, and automation economics using advanced AI models.
                <a href="/validation" className="text-primary hover:underline ml-1">
                  Learn more about our methodology
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
