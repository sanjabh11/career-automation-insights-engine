import { useState } from 'react';
import { Check, Zap, Building2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/hooks/useSession';
import { toast } from 'sonner';

interface PricingTier {
  name: string;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  cta: string;
  popular?: boolean;
  icon: React.ReactNode;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'free',
    displayName: 'Free',
    description: 'Get started with basic automation insights',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      'Basic automation exposure estimate',
      '3 APO analyses per month',
      'Limited AI coach (5 messages/month)',
      'One-time career assessment',
      '3 saved analyses',
      'Community support'
    ],
    cta: 'Get Started',
    icon: <TrendingUp className="h-6 w-6" />
  },
  {
    name: 'pro',
    displayName: 'Pro',
    description: 'Full access to personalized career insights',
    priceMonthly: 29,
    priceYearly: 290,
    features: [
      'Unlimited APO analyses',
      'Full personalized roadmaps',
      'Skill tracking & alerts',
      'Unlimited AI coach access',
      'Priority support',
      'Export to CSV/PDF',
      '50 saved analyses',
      'Advanced analytics',
      'Email notifications'
    ],
    cta: 'Start Pro Trial',
    popular: true,
    icon: <Zap className="h-6 w-6" />
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'Advanced features for teams and organizations',
    priceMonthly: 99,
    priceYearly: 990,
    features: [
      'All Pro features',
      'White-label reporting',
      'CSV bulk import',
      'API access (10K calls/month)',
      'Custom branding',
      'Dedicated support',
      'Unlimited saved analyses',
      'Team management',
      'SSO integration',
      'Custom integrations',
      'SLA guarantee'
    ],
    cta: 'Contact Sales',
    icon: <Building2 className="h-6 w-6" />
  }
];

export function PricingPage() {
  const { session } = useSession();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planName: string) => {
    if (!session) {
      toast.error('Please sign in to subscribe');
      window.location.href = '/auth';
      return;
    }

    if (planName === 'free') {
      toast.info('You are already on the free plan');
      return;
    }

    if (planName === 'enterprise') {
      window.location.href = 'mailto:sales@apodashboard.com?subject=Enterprise Plan Inquiry';
      return;
    }

    try {
      setLoading(planName);

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          planName,
          billingCycle,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: `${window.location.origin}/pricing`
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setLoading(null);
    }
  };

  const getPrice = (tier: PricingTier) => {
    return billingCycle === 'yearly' ? tier.priceYearly : tier.priceMonthly;
  };

  const getSavings = (tier: PricingTier) => {
    if (tier.priceYearly === 0) return 0;
    return tier.priceMonthly * 12 - tier.priceYearly;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Get started with AI-powered career insights. Upgrade anytime as your needs grow.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <Label htmlFor="billing-toggle" className={billingCycle === 'monthly' ? 'font-semibold' : ''}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <Label htmlFor="billing-toggle" className={billingCycle === 'yearly' ? 'font-semibold' : ''}>
              Yearly
              <Badge variant="secondary" className="ml-2">
                Save up to 17%
              </Badge>
            </Label>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {pricingTiers.map((tier) => {
            const price = getPrice(tier);
            const savings = getSavings(tier);
            const isLoading = loading === tier.name;

            return (
              <Card
                key={tier.name}
                className={`relative ${
                  tier.popular
                    ? 'border-primary shadow-lg scale-105'
                    : 'border-border'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${
                      tier.popular ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {tier.icon}
                    </div>
                    <CardTitle className="text-2xl">{tier.displayName}</CardTitle>
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">${price}</span>
                      {price > 0 && (
                        <span className="text-muted-foreground">
                          /{billingCycle === 'yearly' ? 'year' : 'month'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'yearly' && savings > 0 && (
                      <p className="text-sm text-green-600 mt-1">
                        Save ${savings}/year
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleSubscribe(tier.name)}
                    disabled={isLoading}
                    className="w-full"
                    variant={tier.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {isLoading ? 'Loading...' : tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, 
                  or at the end of your billing period for downgrades.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards (Visa, Mastercard, American Express) and debit cards through Stripe. 
                  Enterprise customers can also pay via invoice.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  The Free plan is available forever with no credit card required. Pro and Enterprise plans offer 
                  a 14-day money-back guarantee if you're not satisfied.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens if I exceed my usage limits?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You'll receive notifications as you approach your limits. Once exceeded, you'll be prompted to upgrade 
                  or wait until your next billing cycle. No overage charges - we believe in transparent pricing.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer discounts for students or nonprofits?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! We offer 50% discounts for verified students and nonprofit organizations. 
                  Contact us at support@apodashboard.com with proof of eligibility.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-3xl">Still have questions?</CardTitle>
              <CardDescription className="text-primary-foreground/80 text-lg">
                Our team is here to help you choose the right plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => window.location.href = 'mailto:support@apodashboard.com'}
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
