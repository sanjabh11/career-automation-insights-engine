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
// PRICING CONFIGURATION - SIMPLIFIED 3-TIER MODEL (Dec 25, 2025)
// Based on Value Proposition Research: "Defender" at $29 sweet spot
// ============================================================================

export interface SubscriptionTier {
  id: 'free' | 'defender' | 'coach';
  name: string;
  monthlyPrice: number;
  annualPrice: number; // 2 months free
  billingPeriod: 'month' | 'year';
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  features: string[];
  limits: {
    apoChecksPerMonth: number | 'unlimited';
    aiChatMessagesPerMonth: number | 'unlimited';
    savedAnalyses: number | 'unlimited';
    exportReports: number | 'unlimited';
    whitelabelReports: number;
    apiCallsPerDay: number;
  };
  recommended?: boolean;
  badge?: string;
  tagline?: string;
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Explorer',
    monthlyPrice: 0,
    annualPrice: 0,
    billingPeriod: 'month',
    tagline: 'Start your career defense journey',
    features: [
      '3 APO risk checks per month',
      '10 AI chat messages per month',
      '5 saved analyses',
      'Basic skill adjacency preview',
      'Community support',
    ],
    limits: {
      apoChecksPerMonth: 3,
      aiChatMessagesPerMonth: 10,
      savedAnalyses: 5,
      exportReports: 0,
      whitelabelReports: 0,
      apiCallsPerDay: 0,
    },
  },
  {
    id: 'defender',
    name: 'Defender',
    monthlyPrice: 29,
    annualPrice: 290, // $24.17/mo effective - 2 months free
    billingPeriod: 'month',
    stripePriceIdMonthly: 'price_1SzAwBCDRnHqUTRJY78xxjKY',
    stripePriceIdAnnual: 'price_1SzAwBCDRnHqUTRJ7vMvAN28',
    recommended: true,
    badge: 'Most Popular',
    tagline: 'Career resilience planning for less than $1/day',
    features: [
      'Unlimited APO exposure checks',
      'Unlimited AI career coaching',
      'Unlimited saved analyses',
      'Full Skill Adjacency Graph access',
      'Bridge Role pathfinding',
      'Learning Path ROI calculator',
      'Monthly automation exposure alerts',
      'PDF report exports',
      'Email support',
    ],
    limits: {
      apoChecksPerMonth: 'unlimited',
      aiChatMessagesPerMonth: 'unlimited',
      savedAnalyses: 'unlimited',
      exportReports: 'unlimited',
      whitelabelReports: 0,
      apiCallsPerDay: 100,
    },
  },
  {
    id: 'coach',
    name: 'Coach Pro',
    monthlyPrice: 149,
    annualPrice: 1490, // $124.17/mo effective - 2 months free
    billingPeriod: 'month',
    stripePriceIdMonthly: 'price_1SzAwCCDRnHqUTRJdPZaLEGn',
    stripePriceIdAnnual: 'price_1SzAwCCDRnHqUTRJIbQ7YlJe',
    badge: 'For Professionals',
    tagline: 'White-label reports that sell',
    features: [
      'Everything in Defender',
      '15 white-label client reports/month',
      'Client management dashboard',
      'Full branding customization',
      'Bulk occupation analysis',
      '1,000 API calls per day',
      'Priority support',
      'Early access to new features',
    ],
    limits: {
      apoChecksPerMonth: 'unlimited',
      aiChatMessagesPerMonth: 'unlimited',
      savedAnalyses: 'unlimited',
      exportReports: 'unlimited',
      whitelabelReports: 15,
      apiCallsPerDay: 1000,
    },
  },
];

// Helper to get annual savings
export const getAnnualSavings = (tier: SubscriptionTier): number => {
  if (tier.monthlyPrice === 0) return 0;
  const yearlyIfMonthly = tier.monthlyPrice * 12;
  return yearlyIfMonthly - tier.annualPrice;
};

// Legacy tier mapping for backward compatibility
export const LEGACY_TIER_MAP: Record<string, string> = {
  'explorer': 'free',
  'navigator': 'defender',
  'strategist': 'coach',
};

// ============================================================================
// CREDIT PACKAGES (Monetization V2 - Report Credits)
// ============================================================================

export interface CreditPackage {
  id: 'starter' | 'professional' | 'enterprise';
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  stripePriceId?: string;
  features: string[];
  recommended?: boolean;
  badge?: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 5,
    price: 49,
    pricePerCredit: 9.80,
    stripePriceId: 'price_1SzAwDCDRnHqUTRJVDblB0VC',
    features: [
      '5 report credits',
      'Coach-branded print-ready HTML',
      'Human-review acknowledgement',
      '30-day credit expiry (pilot)',
    ],
  },
  {
    id: 'professional',
    name: 'Professional Pack',
    credits: 15,
    price: 129,
    pricePerCredit: 8.60,
    stripePriceId: 'price_1SzAwECDRnHqUTRJmS8Qn13N',
    recommended: true,
    badge: 'Best Value',
    features: [
      '15 report credits',
      'White-label branding',
      'PDF + HTML export',
      'Client management',
      '90-day expiry',
      '13% savings',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    credits: 40,
    price: 299,
    pricePerCredit: 7.48,
    stripePriceId: 'price_1SzAwECDRnHqUTRJChSNHBVY',
    badge: 'Pro',
    features: [
      '40 report credits',
      'Full white-label branding',
      'All export formats',
      'Client management + CRM',
      'Lead selling marketplace',
      'Never expires',
      '24% savings',
    ],
  },
];

// ============================================================================
// BOOTCAMP PRICING
// ============================================================================

export const BOOTCAMP_PRICING = {
  regularPrice: 1997,
  earlyBirdPrice: 1497,
  currency: 'USD',
  stripePriceId: undefined,
  checkoutStatus: 'hidden_pending_live_price' as const,
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
  tierId: 'defender' | 'coach',
  userId: string,
  billingPeriod: 'month' | 'year' = 'month'
): Promise<void> => {
  const tier = SUBSCRIPTION_TIERS.find((t) => t.id === tierId);
  if (!tier) {
    throw new Error('Invalid subscription tier');
  }

  const priceId = billingPeriod === 'year' ? tier.stripePriceIdAnnual : tier.stripePriceIdMonthly;
  if (!priceId) {
    throw new Error('Price ID not configured for this tier/period');
  }

  // Create checkout session via Supabase Edge Function
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL not configured');
  }

  const { supabase } = await import('@/integrations/supabase/client');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token || session.user.id !== userId) {
    throw new Error('Sign in again before starting checkout.');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      priceId,
      userId,
      tier: tierId,
      billingPeriod,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({ error: 'Checkout failed' }));
    throw new Error(errBody.error || `Checkout failed (${response.status})`);
  }

  const { sessionId, url } = await response.json();

  // Prefer direct URL redirect (Stripe Checkout URL) if available
  if (url) {
    window.location.href = url;
    return;
  }

  // Fallback to Stripe.js redirect
  const stripe = await getStripe();
  if (!stripe) {
    throw new Error('Stripe not initialized');
  }

  const { error } = await stripe.redirectToCheckout({ sessionId });

  if (error) {
    console.error('Stripe redirect error:', error);
    throw error;
  }
};

// ============================================================================
// CREDIT CHECKOUT (PAYG)
// ============================================================================

export const redirectToCreditCheckout = async (
  packageId: CreditPackage['id'],
  userId: string
): Promise<void> => {
  if (packageId !== 'starter') {
    throw new Error('Only the coach pilot starter pack is currently available');
  }

  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg || !pkg.stripePriceId) {
    throw new Error('Invalid credit package or price not configured');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL not configured');
  }

  const { supabase } = await import('@/integrations/supabase/client');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token || session.user.id !== userId) {
    throw new Error('Sign in again before buying report credits.');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      package_id: packageId,
      request_id: crypto.randomUUID(),
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({ error: 'Credit checkout failed' }));
    throw new Error(errBody.error || `Credit checkout failed (${response.status})`);
  }

  const { url } = await response.json();
  if (url) {
    window.location.href = url;
  }
};

// ============================================================================
// CUSTOMER PORTAL
// ============================================================================

export const redirectToCustomerPortal = async (): Promise<void> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL not configured');
  }

  // Get current session token for auth
  const { supabase } = await import('@/integrations/supabase/client');
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/create-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({ error: 'Portal session failed' }));
    throw new Error(errBody.error || `Portal failed (${response.status})`);
  }

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
    ai_chat_unlimited: tier === 'defender' || tier === 'coach',
    learning_path_roi: tier === 'defender' || tier === 'coach',
    automation_alerts: tier === 'defender' || tier === 'coach',
    compare_occupations: tier === 'coach',
    export_reports: tier !== 'free',
    api_access: tier === 'defender' || tier === 'coach',
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
