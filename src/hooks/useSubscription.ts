/**
 * useSubscription Hook
 * Manages user subscription state, feature access, and usage tracking
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  SUBSCRIPTION_TIERS,
  hasFeatureAccess,
  getUsageLimits,
  checkUsageLimit,
  type SubscriptionTier,
  type UsageStats,
} from '@/lib/stripe';

interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier['id'];
  status: 'active' | 'cancelled' | 'past_due' | 'trialing' | 'paused';
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export const useSubscription = () => {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    apoChecksThisMonth: 0,
    aiChatMessagesThisMonth: 0,
    savedAnalysesCount: 0,
    exportsThisMonth: 0,
  });

  // Fetch current subscription
  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get active subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Gracefully handle quota exceeded (402) or other errors
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.warn('[useSubscription] fetch failed (quota may be exceeded):', error.message);
        // Default to free tier when quota exceeded
        setSubscription(null);
        setLoading(false);
        return;
      }

      setSubscription(data);

      // Fetch usage stats (skip if quota exceeded)
      if (!error) {
        await fetchUsageStats(user.id);
      }
    } catch (error: any) {
      console.warn('[useSubscription] Error in fetchSubscription:', error?.message || error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch usage statistics
  const fetchUsageStats = async (userId: string) => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // APO checks this month
      const { count: apoChecks, error: apoError } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', 'apo_score_used')
        .gte('created_at', startOfMonth.toISOString());

      // If quota exceeded, skip remaining queries and use defaults
      if (apoError) {
        console.warn('[useSubscription] Usage stats fetch failed (quota may be exceeded):', apoError.message);
        return;
      }

      // AI chat messages this month
      const { count: aiMessages } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', 'ai_chat_used')
        .gte('created_at', startOfMonth.toISOString());

      // Saved analyses
      const { count: savedCount } = await supabase
        .from('saved_analyses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Exports this month
      const { count: exportCount } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', 'export_used')
        .gte('created_at', startOfMonth.toISOString());

      setUsageStats({
        apoChecksThisMonth: apoChecks || 0,
        aiChatMessagesThisMonth: aiMessages || 0,
        savedAnalysesCount: savedCount || 0,
        exportsThisMonth: exportCount || 0,
      });
    } catch (error: any) {
      console.warn('[useSubscription] Error fetching usage stats:', error?.message || error);
    }
  };

  useEffect(() => {
    fetchSubscription();

    // Realtime subscriptions disabled to reduce Supabase load during quota restrictions
    // To re-enable when quota is resolved, uncomment the channel subscription below
    /*
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
    */
  }, []);

  // Get current tier (defaults to 'free' if no active subscription)
  const currentTier: SubscriptionTier['id'] = subscription?.tier || 'free';

  // Get tier configuration
  const tierConfig = SUBSCRIPTION_TIERS.find((t) => t.id === currentTier);

  // Check feature access
  const checkFeatureAccess = (feature: string): boolean => {
    return hasFeatureAccess(currentTier, feature);
  };

  // Check usage limits with remaining quota
  const checkUsage = (
    feature: 'apoChecks' | 'aiChat' | 'savedAnalyses' | 'exports'
  ) => {
    const usageMap = {
      apoChecks: usageStats.apoChecksThisMonth,
      aiChat: usageStats.aiChatMessagesThisMonth,
      savedAnalyses: usageStats.savedAnalysesCount,
      exports: usageStats.exportsThisMonth,
    };

    return checkUsageLimit(currentTier, feature, usageMap[feature]);
  };

  // Track feature usage
  const trackUsage = async (feature: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Map feature names to event types
      const eventTypeMap: Record<string, string> = {
        apoChecks: 'apo_score_used',
        aiChat: 'ai_chat_used',
        savedAnalyses: 'analysis_saved',
        exports: 'export_used',
      };

      const eventType = eventTypeMap[feature] || `${feature}_used`;

      // Call database function to track usage
      await supabase.rpc('track_feature_usage', {
        p_user_id: user.id,
        p_feature_name: feature, // RPC might expect the feature name key, checking migration next
      });

      // Also log analytics event
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event_type: eventType,
        payload: {
          tier: currentTier,
          timestamp: new Date().toISOString(),
        },
      });

      // Refresh usage stats
      await fetchUsageStats(user.id);
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  };

  // Request feature with limit check
  const requestFeature = async (
    feature: 'apoChecks' | 'aiChat' | 'savedAnalyses' | 'exports'
  ): Promise<boolean> => {
    const usageCheck = checkUsage(feature);

    if (!usageCheck.allowed) {
      // Show upgrade prompt
      toast({
        title: 'Usage Limit Reached',
        description: `You've reached your ${feature} limit for this month. Upgrade to continue.`,
        variant: 'destructive',
      });
      return false;
    }

    // Track usage
    await trackUsage(feature);
    return true;
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    try {
      if (!subscription) {
        throw new Error('No active subscription');
      }

      // Call Supabase Edge Function to cancel via Stripe
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will end at the end of the current billing period.',
      });

      await fetchSubscription();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Resume subscription
  const resumeSubscription = async () => {
    try {
      if (!subscription) {
        throw new Error('No active subscription');
      }

      const response = await fetch('/api/resume-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to resume subscription');
      }

      toast({
        title: 'Subscription Resumed',
        description: 'Your subscription has been reactivated.',
      });

      await fetchSubscription();
    } catch (error) {
      console.error('Error resuming subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to resume subscription. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    subscription,
    currentTier,
    tierConfig,
    loading,
    usageStats,
    checkFeatureAccess,
    checkUsage,
    trackUsage,
    requestFeature,
    cancelSubscription,
    resumeSubscription,
    refresh: fetchSubscription,
    isActive: subscription?.status === 'active',
    isPastDue: subscription?.status === 'past_due',
    isTrialing: subscription?.status === 'trialing',
    isCancelled: subscription?.cancel_at_period_end || false,
    periodEnd: subscription?.current_period_end || null,
  };
};
