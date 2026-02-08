/**
 * Stripe Integration Utilities
 * Handles subscription management, pricing, and payment processing
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize Stripe (use publishable key from environment)
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('Stripe publishable key not found in environment variables');
      return null;
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// ============================================================================
// PRICING CONFIGURATION (from PRD Section 3.1)
// ============================================================================

export interface SubscriptionTier {
  id: 'free' | 'explorer' | 'navigator' | 'strategist';
  name: string;
  price: number;
  billingPeriod: 'month' | 'year';
  stripePriceId?: string;
  features: string[];
  limits: {
    apoChecksPerMonth: number | 'unlimited';
    aiChatMessagesPerMonth: number | 'unlimited';
    savedAnalyses: number | 'unlimited';
    exportReports: number | 'unlimited';
    apiCallsPerDay: number;
  };
  recommended?: boolean;
  badge?: string;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billingPeriod: 'month',
    features: [
      '3 APO score checks per month',
      '10 AI chat messages per month',
      '5 saved analyses',
      'Basic automation insights',
      'Community support',
    ],
    limits: {
      apoChecksPerMonth: 3,
      aiChatMessagesPerMonth: 10,
      savedAnalyses: 5,
      exportReports: 0,
      apiCallsPerDay: 0,
    },
  },
  {
    id: 'explorer',
    name: 'Explorer',
    price: 19,
    billingPeriod: 'month',
    stripePriceId: 'price_explorer_monthly', // TODO: Replace with actual Stripe price ID
    features: [
      'Unlimited APO score checks',
      '50 AI chat messages per month',
      '25 saved analyses',
      '5 report exports per month',
      'Career transition planning',
      'Email support',
    ],
    limits: {
      apoChecksPerMonth: 'unlimited',
      aiChatMessagesPerMonth: 50,
      savedAnalyses: 25,
      exportReports: 5,
      apiCallsPerDay: 0,
    },
  },
  {
    id: 'navigator',
    name: 'Navigator',
    price: 39,
    billingPeriod: 'month',
    stripePriceId: 'price_navigator_monthly',
    recommended: true,
    badge: 'Most Popular',
    features: [
      'Everything in Explorer',
      'Unlimited AI career coaching',
      'Unlimited saved analyses',
      'Unlimited report exports',
      'Learning Path ROI calculator',
      'Monthly automation risk alerts',
      '100 API calls per day',
      'Priority support',
    ],
    limits: {
      apoChecksPerMonth: 'unlimited',
      aiChatMessagesPerMonth: 'unlimited',
      savedAnalyses: 'unlimited',
      exportReports: 'unlimited',
      apiCallsPerDay: 100,
    },
  },
  {
    id: 'strategist',
    name: 'Strategist',
    price: 49,
    billingPeriod: 'month',
    stripePriceId: 'price_strategist_monthly',
    badge: 'Pro',
    features: [
      'Everything in Navigator',
      'Compare multiple occupations',
      'Advanced scenario planning',
      '1,000 API calls per day',
      'White-label reports',
      'Custom integrations',
      '1-on-1 coaching sessions (2/month)',
      'Premium support',
    ],
    limits: {
      apoChecksPerMonth: 'unlimited',
      aiChatMessagesPerMonth: 'unlimited',
      savedAnalyses: 'unlimited',
      exportReports: 'unlimited',
      apiCallsPerDay: 1000,
    },
  },
];

// ============================================================================
// BOOTCAMP PRICING
// ============================================================================

export const BOOTCAMP_PRICING = {
  regularPrice: 1997,
  earlyBirdPrice: 1497,
  currency: 'USD',
  stripePriceId: 'price_bootcamp', // TODO: Replace with actual Stripe price ID
};

// ============================================================================
// WORKSHOP PRICING (PRD Section 3.3)
// ============================================================================

export const WORKSHOP_PRICING = {
  halfDay: {
    small: 10000, // <500 employees
    medium: 15000, // 500-2,000 employees
    large: 25000, // 2,000+ employees
  },
  fullDay: {
    small: 20000,
    medium: 35000,
    large: 50000,
  },
  twoDay: {
    small: 35000,
    medium: 60000,
    large: 85000,
  },
};

// ============================================================================
// STRIPE CHECKOUT FUNCTIONS
// ============================================================================

export const redirectToCheckout = async (
  tierId: 'explorer' | 'navigator' | 'strategist',
  userId: string
): Promise<void> => {
  const stripe = await getStripe();
  if (!stripe) {
    throw new Error('Stripe not initialized');
  }

  const tier = SUBSCRIPTION_TIERS.find((t) => t.id === tierId);
  if (!tier || !tier.stripePriceId) {
    throw new Error('Invalid subscription tier');
  }

  // Create checkout session via Supabase Edge Function
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId: tier.stripePriceId,
      userId,
      tier: tierId,
    }),
  });

  const { sessionId } = await response.json();

  const { error } = await stripe.redirectToCheckout({ sessionId });

  if (error) {
    console.error('Stripe redirect error:', error);
    throw error;
  }
};

// ============================================================================
// CUSTOMER PORTAL
// ============================================================================

export const redirectToCustomerPortal = async (): Promise<void> => {
  // Call Supabase Edge Function to create portal session
  const response = await fetch('/api/create-portal-session', {
    method: 'POST',
  });

  const { url } = await response.json();
  window.location.href = url;
};

// ============================================================================
// FEATURE ACCESS HELPERS
// ============================================================================

export const hasFeatureAccess = (
  tier: SubscriptionTier['id'],
  feature: string
): boolean => {
  const tierConfig = SUBSCRIPTION_TIERS.find((t) => t.id === tier);
  if (!tierConfig) return false;

  const featureMap: Record<string, boolean> = {
    apo_score_basic: true, // All tiers
    apo_score_unlimited: tier !== 'free',
    ai_chat_basic: true,
    ai_chat_unlimited: tier === 'navigator' || tier === 'strategist',
    learning_path_roi: tier === 'navigator' || tier === 'strategist',
    automation_alerts: tier === 'navigator' || tier === 'strategist',
    compare_occupations: tier === 'strategist',
    export_reports: tier !== 'free',
    api_access: tier === 'navigator' || tier === 'strategist',
  };

  return featureMap[feature] || false;
};

export const getUsageLimits = (tier: SubscriptionTier['id']) => {
  const tierConfig = SUBSCRIPTION_TIERS.find((t) => t.id === tier);
  return tierConfig?.limits || SUBSCRIPTION_TIERS[0].limits;
};

export const getTierName = (tier: SubscriptionTier['id']): string => {
  const tierConfig = SUBSCRIPTION_TIERS.find((t) => t.id === tier);
  return tierConfig?.name || 'Free';
};

// ============================================================================
// USAGE TRACKING
// ============================================================================

export interface UsageStats {
  apoChecksThisMonth: number;
  aiChatMessagesThisMonth: number;
  savedAnalysesCount: number;
  exportsThisMonth: number;
}

export const checkUsageLimit = (
  tier: SubscriptionTier['id'],
  feature: 'apoChecks' | 'aiChat' | 'savedAnalyses' | 'exports',
  currentUsage: number
): { allowed: boolean; remaining: number | 'unlimited'; limit: number | 'unlimited' } => {
  const limits = getUsageLimits(tier);

  const limitMap = {
    apoChecks: limits.apoChecksPerMonth,
    aiChat: limits.aiChatMessagesPerMonth,
    savedAnalyses: limits.savedAnalyses,
    exports: limits.exportReports,
  };

  const limit = limitMap[feature];

  if (limit === 'unlimited') {
    return { allowed: true, remaining: 'unlimited', limit: 'unlimited' };
  }

  const remaining = Math.max(0, limit - currentUsage);
  const allowed = currentUsage < limit;

  return { allowed, remaining, limit };
};
