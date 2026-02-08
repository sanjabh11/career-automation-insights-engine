/**
 * Upgrade Prompt Component
 * Contextual upgrade prompts shown when users hit usage limits
 * Tracks conversion events and provides clear upgrade paths
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Sparkles, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/hooks/useSubscription';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'apoChecks' | 'aiChat' | 'savedAnalyses' | 'exports' | 'apiAccess';
  currentUsage?: number;
  limitReached?: boolean;
}

const FEATURE_INFO = {
  apoChecks: {
    title: 'APO Score Checks',
    description: 'Analyze automation risk for any occupation',
    icon: TrendingUp,
    benefit: 'Unlimited career insights',
  },
  aiChat: {
    title: 'AI Career Coach',
    description: 'Get personalized career guidance',
    icon: Sparkles,
    benefit: 'Unlimited AI conversations',
  },
  savedAnalyses: {
    title: 'Saved Analyses',
    description: 'Save and track your career progress',
    icon: Zap,
    benefit: 'Unlimited saved reports',
  },
  exports: {
    title: 'Export Reports',
    description: 'Download PDF and CSV reports',
    icon: ArrowRight,
    benefit: 'Unlimited exports',
  },
  apiAccess: {
    title: 'API Access',
    description: 'Integrate with your own tools',
    icon: Zap,
    benefit: 'Full API access',
  },
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  isOpen,
  onClose,
  feature,
  currentUsage,
  limitReached = true,
}) => {
  const navigate = useNavigate();
  const { currentTier, tierConfig } = useSubscription();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier['id'] | null>(null);

  const featureInfo = FEATURE_INFO[feature];
  const FeatureIcon = featureInfo.icon;

  // Get recommended tier for this feature
  const getRecommendedTier = (): SubscriptionTier => {
    // Find the cheapest tier that provides unlimited access to this feature
    const eligibleTiers = SUBSCRIPTION_TIERS.filter((tier) => {
      switch (feature) {
        case 'apoChecks':
          return tier.limits.apoChecksPerMonth === 'unlimited';
        case 'aiChat':
          return tier.limits.aiChatMessagesPerMonth === 'unlimited';
        case 'savedAnalyses':
          return tier.limits.savedAnalyses === 'unlimited';
        case 'exports':
          return tier.limits.exportReports === 'unlimited';
        case 'apiAccess':
          return tier.limits.apiCallsPerDay && tier.limits.apiCallsPerDay > 0;
        default:
          return false;
      }
    });

    return eligibleTiers[0] || SUBSCRIPTION_TIERS[1]; // Default to Explorer
  };

  const recommendedTier = getRecommendedTier();

  const handleUpgrade = async (tierId: string) => {
    try {
      // Track conversion event
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event_type: 'upgrade_prompt_clicked',
          payload: {
            feature,
            current_tier: currentTier,
            target_tier: tierId,
            current_usage: currentUsage,
            limit_reached: limitReached,
          },
        });
      }

      // Navigate to pricing page with pre-selected tier
      navigate(`/pricing?tier=${tierId}&feature=${feature}`);
      onClose();
    } catch (error) {
      console.error('Error tracking upgrade click:', error);
      navigate('/pricing');
      onClose();
    }
  };

  const handleDismiss = async () => {
    try {
      // Track dismissal
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event_type: 'upgrade_prompt_dismissed',
          payload: {
            feature,
            current_tier: currentTier,
          },
        });
      }
    } catch (error) {
      console.error('Error tracking dismissal:', error);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FeatureIcon className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl">
              {limitReached ? 'Usage Limit Reached' : 'Unlock More Features'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {limitReached ? (
              <>
                You've reached your <strong>{featureInfo.title}</strong> limit for this month.
                Upgrade to continue using this feature and unlock unlimited access.
              </>
            ) : (
              <>
                Upgrade your plan to get <strong>{featureInfo.benefit}</strong> and more premium features.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Current Usage Info */}
        {currentUsage !== undefined && tierConfig && (
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Current Plan</p>
                  <p className="text-2xl font-bold">{tierConfig.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Monthly Usage</p>
                  <p className="text-2xl font-bold">
                    {currentUsage} / {typeof tierConfig.limits[feature === 'apoChecks' ? 'apoChecksPerMonth' : feature === 'aiChat' ? 'aiChatMessagesPerMonth' : 'savedAnalyses'] === 'number'
                      ? tierConfig.limits[feature === 'apoChecks' ? 'apoChecksPerMonth' : feature === 'aiChat' ? 'aiChatMessagesPerMonth' : 'savedAnalyses']
                      : '∞'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tier Comparison */}
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {SUBSCRIPTION_TIERS.filter((tier) => tier.id !== 'free').map((tier) => {
            const isRecommended = tier.id === recommendedTier.id;
            const isCurrent = tier.id === currentTier;
            const isSelected = tier.id === selectedTier;

            // Determine if this tier provides unlimited access to the feature
            let providesUnlimited = false;
            switch (feature) {
              case 'apoChecks':
                providesUnlimited = tier.limits.apoChecksPerMonth === 'unlimited';
                break;
              case 'aiChat':
                providesUnlimited = tier.limits.aiChatMessagesPerMonth === 'unlimited';
                break;
              case 'savedAnalyses':
                providesUnlimited = tier.limits.savedAnalyses === 'unlimited';
                break;
              case 'exports':
                providesUnlimited = tier.limits.exportReports === 'unlimited';
                break;
              case 'apiAccess':
                providesUnlimited = tier.limits.apiCallsPerDay && tier.limits.apiCallsPerDay > 0;
                break;
            }

            return (
              <Card
                key={tier.id}
                className={`relative cursor-pointer transition-all ${
                  isRecommended
                    ? 'border-primary shadow-lg ring-2 ring-primary/20'
                    : isSelected
                    ? 'border-primary'
                    : 'border-border hover:border-primary/50'
                } ${isCurrent ? 'opacity-60' : ''}`}
                onClick={() => !isCurrent && setSelectedTier(tier.id)}
              >
                {isRecommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white">
                      Recommended
                    </Badge>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="secondary">Current Plan</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-3">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary mt-2">
                    ${tier.price}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-2">
                    {/* Highlight the specific feature */}
                    <li className="flex items-start gap-2 text-sm font-medium">
                      {providesUnlimited ? (
                        <>
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-green-600">{featureInfo.benefit}</span>
                        </>
                      ) : (
                        <>
                          <X className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">Limited {featureInfo.title.toLowerCase()}</span>
                        </>
                      )}
                    </li>

                    {/* Show top features */}
                    {tier.features.slice(0, 3).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full mt-4"
                    variant={isRecommended ? 'default' : 'outline'}
                    disabled={isCurrent}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpgrade(tier.id);
                    }}
                  >
                    {isCurrent ? 'Current Plan' : `Upgrade to ${tier.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Benefits Section */}
        <Card className="mt-4 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <CardHeader>
            <CardTitle className="text-lg">What You'll Get</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Unlimited Access</p>
                  <p className="text-sm text-muted-foreground">
                    No more monthly limits on {featureInfo.title.toLowerCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Priority Support</p>
                  <p className="text-sm text-muted-foreground">
                    Get faster responses from our support team
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Advanced Features</p>
                  <p className="text-sm text-muted-foreground">
                    Access to premium tools and integrations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Cancel Anytime</p>
                  <p className="text-sm text-muted-foreground">
                    No long-term commitment, flexible billing
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleDismiss}>
            Maybe Later
          </Button>
          <Button
            onClick={() => handleUpgrade(recommendedTier.id)}
            className="bg-gradient-to-r from-primary to-purple-600"
          >
            View All Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Inline Upgrade Banner Component
 * Less intrusive upgrade prompt for display within pages
 */
interface UpgradeBannerProps {
  feature: keyof typeof FEATURE_INFO;
  compact?: boolean;
}

export const UpgradeBanner: React.FC<UpgradeBannerProps> = ({ feature, compact = false }) => {
  const navigate = useNavigate();
  const { currentTier } = useSubscription();
  const featureInfo = FEATURE_INFO[feature];
  const FeatureIcon = featureInfo.icon;

  const handleUpgradeClick = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event_type: 'upgrade_banner_clicked',
          payload: {
            feature,
            current_tier: currentTier,
            banner_type: compact ? 'compact' : 'full',
          },
        });
      }
    } catch (error) {
      console.error('Error tracking banner click:', error);
    }

    navigate(`/pricing?feature=${feature}`);
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2">
          <FeatureIcon className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">Upgrade for {featureInfo.benefit.toLowerCase()}</span>
        </div>
        <Button size="sm" onClick={handleUpgradeClick}>
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <FeatureIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{featureInfo.benefit}</h3>
            <p className="text-sm text-muted-foreground">{featureInfo.description}</p>
          </div>
        </div>
        <Button onClick={handleUpgradeClick} className="bg-gradient-to-r from-primary to-purple-600">
          Upgrade Now
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};
