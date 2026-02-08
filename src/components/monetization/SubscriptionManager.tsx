import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CreditCard, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    apo_analyses_per_month: number;
    ai_coach_messages_per_month: number;
    saved_analyses_max: number;
    roadmaps_per_month: number;
  };
}

interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface UsageData {
  resource_type: string;
  current_usage: number;
  limit_value: number;
  percentage_used: number;
}

export function SubscriptionManager() {
  const { session } = useSession();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [billingPortalLoading, setBillingPortalLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadSubscriptionData();
    }
  }, [session]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);

      // Get user's profile with current plan
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_plan_id, subscription_plans(*)')
        .eq('id', session?.user?.id)
        .single();

      if (profileError) throw profileError;

      if (profile?.subscription_plans) {
        setCurrentPlan(profile.subscription_plans as SubscriptionPlan);
      }

      // Get active subscription
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', session?.user?.id)
        .eq('status', 'active')
        .single();

      if (!subError && subData) {
        setSubscription(subData as UserSubscription);
      }

      // Get current usage
      const { data: usageData, error: usageError } = await supabase
        .rpc('get_current_usage', { p_user_id: session?.user?.id });

      if (!usageError && usageData) {
        setUsage(usageData as UsageData[]);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast.error('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setBillingPortalLoading(true);

      const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
        body: { returnUrl: window.location.href }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast.error('Failed to open billing portal');
    } finally {
      setBillingPortalLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    return 'text-green-600';
  };

  const getResourceLabel = (resourceType: string) => {
    const labels: Record<string, string> = {
      apo_analysis: 'APO Analyses',
      ai_coach_message: 'AI Coach Messages',
      roadmap_generation: 'Career Roadmaps',
      saved_analysis: 'Saved Analyses'
    };
    return labels[resourceType] || resourceType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </div>
            <Badge variant={currentPlan?.name === 'free' ? 'secondary' : 'default'} className="text-lg px-4 py-2">
              {currentPlan?.display_name || 'Free'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPlan && (
            <>
              <div>
                <p className="text-sm text-muted-foreground mb-2">{currentPlan.description}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    ${currentPlan.price_monthly}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                  {currentPlan.price_yearly > 0 && (
                    <span className="text-sm text-green-600 ml-2">
                      Save ${(currentPlan.price_monthly * 12 - currentPlan.price_yearly).toFixed(0)}/year with annual billing
                    </span>
                  )}
                </div>
              </div>

              {subscription && (
                <div className="flex items-center gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Renews on:</span>
                    <span className="font-medium">{formatDate(subscription.current_period_end)}</span>
                  </div>
                  {subscription.cancel_at_period_end && (
                    <Badge variant="destructive">Cancels at period end</Badge>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {currentPlan.name === 'free' ? (
                  <Button onClick={() => window.location.href = '/pricing'} className="flex-1">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                ) : (
                  <Button
                    onClick={handleManageBilling}
                    disabled={billingPortalLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    {billingPortalLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Manage Billing
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
          <CardDescription>Track your resource consumption</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {usage.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No usage data available yet. Start using the platform to see your statistics.
              </AlertDescription>
            </Alert>
          ) : (
            usage.map((item) => {
              const isUnlimited = item.limit_value === -1;
              const percentage = isUnlimited ? 0 : item.percentage_used;

              return (
                <div key={item.resource_type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{getResourceLabel(item.resource_type)}</span>
                    <span className={`text-sm font-semibold ${getUsageColor(percentage)}`}>
                      {isUnlimited ? (
                        'Unlimited'
                      ) : (
                        `${item.current_usage} / ${item.limit_value}`
                      )}
                    </span>
                  </div>
                  {!isUnlimited && (
                    <>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(0)}% used
                        {percentage >= 90 && (
                          <span className="text-red-600 ml-2">
                            • Approaching limit
                          </span>
                        )}
                      </p>
                    </>
                  )}
                </div>
              );
            })
          )}

          {currentPlan?.name === 'free' && usage.some(u => u.percentage_used >= 75) && (
            <Alert className="bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30">
              <TrendingUp className="h-4 w-4 text-[var(--accent-primary)]" />
              <AlertDescription className="text-[var(--text-primary)]">
                You're approaching your monthly limits. Upgrade to Pro for unlimited access to all features.
                <Button
                  onClick={() => window.location.href = '/pricing'}
                  size="sm"
                  className="ml-4"
                >
                  View Plans
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Features Card */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Features</CardTitle>
          <CardDescription>What's included in your current plan</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {currentPlan?.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
