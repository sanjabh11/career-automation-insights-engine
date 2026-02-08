/**
 * Usage Dashboard Component
 * Shows users their current usage, limits, and suggests upgrades
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { TrendingUp, MessageSquare, Save, Download, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { SUBSCRIPTION_TIERS } from '@/lib/stripe';

export const UsageDashboard = () => {
  const navigate = useNavigate();
  const {
    currentTier,
    tierConfig,
    usageStats,
    loading,
    isActive,
    isPastDue,
    isCancelled,
    periodEnd,
    cancelSubscription,
    resumeSubscription,
  } = useSubscription();

  const [usagePercentages, setUsagePercentages] = useState({
    apoChecks: 0,
    aiChat: 0,
    savedAnalyses: 0,
    exports: 0,
  });

  useEffect(() => {
    if (!tierConfig) return;

    const calculatePercentage = (used: number, limit: number | 'unlimited'): number => {
      if (limit === 'unlimited') return 0; // No limit to show
      if (limit === 0) return 100; // If limit is 0, any usage is 100% (or technically infinite, but cap at 100 for UI)
      return Math.min((used / limit) * 100, 100);
    };

    setUsagePercentages({
      apoChecks: calculatePercentage(
        usageStats.apoChecksThisMonth,
        tierConfig.limits.apoChecksPerMonth
      ),
      aiChat: calculatePercentage(
        usageStats.aiChatMessagesThisMonth,
        tierConfig.limits.aiChatMessagesPerMonth
      ),
      savedAnalyses: calculatePercentage(
        usageStats.savedAnalysesCount,
        tierConfig.limits.savedAnalyses
      ),
      exports: calculatePercentage(
        usageStats.exportsThisMonth,
        tierConfig.limits.exportReports || 0
      ),
    });
  }, [usageStats, tierConfig]);

  const getStatusColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertCircle className="w-5 h-5 text-destructive" />;
    if (percentage >= 70) return <Zap className="w-5 h-5 text-yellow-600" />;
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  };

  const formatLimit = (limit: number | 'unlimited'): string => {
    return limit === 'unlimited' ? '∞' : limit.toString();
  };

  const getDaysUntilReset = (): number => {
    if (!periodEnd) {
      // Default to end of current month
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    const end = new Date(periodEnd);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const usageItems = [
    {
      icon: TrendingUp,
      label: 'APO Score Checks',
      used: usageStats.apoChecksThisMonth,
      limit: tierConfig?.limits.apoChecksPerMonth,
      percentage: usagePercentages.apoChecks,
      color: 'text-blue-600',
    },
    {
      icon: MessageSquare,
      label: 'AI Chat Messages',
      used: usageStats.aiChatMessagesThisMonth,
      limit: tierConfig?.limits.aiChatMessagesPerMonth,
      percentage: usagePercentages.aiChat,
      color: 'text-purple-600',
    },
    {
      icon: Save,
      label: 'Saved Analyses',
      used: usageStats.savedAnalysesCount,
      limit: tierConfig?.limits.savedAnalyses,
      percentage: usagePercentages.savedAnalyses,
      color: 'text-green-600',
    },
    {
      icon: Download,
      label: 'Report Exports',
      used: usageStats.exportsThisMonth,
      limit: tierConfig?.limits.exportReports,
      percentage: usagePercentages.exports,
      color: 'text-orange-600',
    },
  ];

  const getNextTier = () => {
    const currentIndex = SUBSCRIPTION_TIERS.findIndex((t) => t.id === currentTier);
    if (currentIndex < SUBSCRIPTION_TIERS.length - 1) {
      return SUBSCRIPTION_TIERS[currentIndex + 1];
    }
    return null;
  };

  const nextTier = getNextTier();
  const daysUntilReset = getDaysUntilReset();
  const hasHighUsage = Object.values(usagePercentages).some((p) => p >= 70);

  const handleCancelSubscription = async () => {
    if (confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of the current billing period.')) {
      await cancelSubscription();
    }
  };

  const handleResumeSubscription = async () => {
    await resumeSubscription();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Usage Overview</CardTitle>
              <CardDescription className="mt-1">
                {tierConfig ? (
                  <>
                    Current Plan: <strong>{tierConfig.name}</strong>
                    {isPastDue && (
                      <Badge variant="destructive" className="ml-2">
                        Past Due
                      </Badge>
                    )}
                    {isActive && !isCancelled && (
                      <Badge variant="secondary" className="ml-2">
                        Active
                      </Badge>
                    )}
                    {isCancelled && (
                      <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600">
                        Canceled (Expires soon)
                      </Badge>
                    )}
                  </>
                ) : (
                  'Loading plan details...'
                )}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Resets in</p>
              <p className="text-2xl font-bold">{daysUntilReset} days</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Usage Items */}
      <div className="grid md:grid-cols-2 gap-4">
        {usageItems.map((item) => {
          const Icon = item.icon;
          const isUnlimited = item.limit === 'unlimited';
          const isNearLimit = item.percentage >= 70 && !isUnlimited;

          return (
            <Card key={item.label} className={isNearLimit ? 'border-yellow-500/50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${item.color}`} />
                    <CardTitle className="text-base">{item.label}</CardTitle>
                  </div>
                  {!isUnlimited && getStatusIcon(item.percentage)}
                </div>
              </CardHeader>
              <CardContent>
                {isUnlimited ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-gradient-to-r from-primary/20 to-purple-600/20">
                      Unlimited
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {item.used} used this month
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">{item.used}</span>
                      <span className="text-sm text-muted-foreground">
                        / {formatLimit(item.limit!)}
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                    <p className={`text-xs mt-2 ${getStatusColor(item.percentage)}`}>
                      {item.percentage >= 90
                        ? 'Limit almost reached'
                        : item.percentage >= 70
                          ? 'Usage is high'
                          : `${Math.round(100 - item.percentage)}% remaining`}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upgrade CTA - Show if high usage OR if user is on free tier */}
      {(hasHighUsage || currentTier === 'free') && nextTier && (
        <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              {hasHighUsage ? 'Running Low on Credits?' : 'Unlock More Features'}
            </CardTitle>
            <CardDescription>
              Upgrade to <strong>{nextTier.name}</strong> for {nextTier.price === 0 ? 'more features' : `$${nextTier.price}/month`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium mb-2">With {nextTier.name}, you get:</p>
                <ul className="text-sm space-y-1">
                  {nextTier.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate(`/pricing?tier=${nextTier.id}`)}
                  className="bg-gradient-to-r from-primary to-purple-600"
                >
                  Upgrade to {nextTier.name}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Management */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>Manage your plan and billing details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isActive && periodEnd && (
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Next Billing Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(periodEnd).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                {isCancelled ? (
                  <Button variant="outline" onClick={handleResumeSubscription} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                    Resume Subscription
                  </Button>
                ) : (
                  currentTier !== 'free' && (
                    <Button variant="outline" onClick={handleCancelSubscription} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      Cancel Subscription
                    </Button>
                  )
                )}
                <Button variant="outline" onClick={() => navigate('/pricing')}>
                  Change Plan
                </Button>
              </div>
            </div>
          )}

          {!isActive && (
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">No Active Subscription</p>
                <p className="text-sm text-muted-foreground">You are currently on the free plan.</p>
              </div>
              <Button onClick={() => navigate('/pricing')}>
                View Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
