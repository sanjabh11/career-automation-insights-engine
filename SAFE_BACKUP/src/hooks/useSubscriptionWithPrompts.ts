/**
 * Enhanced Subscription Hook with Upgrade Prompts
 * Automatically shows upgrade prompts when users hit limits
 */

import { useSubscription } from './useSubscription';
import { useUpgradePrompt } from '@/contexts/UpgradePromptContext';

export const useSubscriptionWithPrompts = () => {
  const subscription = useSubscription();
  const { showUpgradePrompt } = useUpgradePrompt();

  /**
   * Request feature with automatic upgrade prompt on limit reached
   */
  const requestFeatureWithPrompt = async (
    feature: 'apoChecks' | 'aiChat' | 'savedAnalyses' | 'exports'
  ): Promise<boolean> => {
    const usageCheck = subscription.checkUsage(feature);

    if (!usageCheck.allowed) {
      // Show upgrade prompt instead of just a toast
      const currentUsage =
        feature === 'apoChecks' ? subscription.usageStats.apoChecksThisMonth :
        feature === 'aiChat' ? subscription.usageStats.aiChatMessagesThisMonth :
        feature === 'savedAnalyses' ? subscription.usageStats.savedAnalysesCount :
        subscription.usageStats.exportsThisMonth;

      showUpgradePrompt(feature, {
        currentUsage,
        limitReached: true,
      });

      return false;
    }

    // Track usage
    await subscription.trackUsage(feature);
    return true;
  };

  return {
    ...subscription,
    requestFeature: requestFeatureWithPrompt,
    showUpgradePrompt, // Expose for manual triggering
  };
};
