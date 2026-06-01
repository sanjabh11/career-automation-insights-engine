import { createContext } from 'react';

export interface WhopUser {
  id: string;
  username: string;
  email: string;
  profilePicUrl?: string;
}

export interface WhopMembership {
  id: string;
  productId: string;
  planId: string;
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  valid: boolean;
  accessLevel: 'none' | 'customer' | 'admin';
}

export interface WhopExperience {
  id: string;
  name: string;
  companyId: string;
}

export type WhopTier = 'free' | 'pro' | 'enterprise';

export interface WhopAppContextValue {
  isWhopEmbed: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  whopUser: WhopUser | null;
  membership: WhopMembership | null;
  experience: WhopExperience | null;
  accessLevel: 'none' | 'customer' | 'admin';
  profileId: string | null;
  refreshContext: () => Promise<void>;
  requestUpgrade: () => void;
  isCustomer: boolean;
  isAdmin: boolean;
  hasAccess: boolean;
  isFreeTier: boolean;
  isPremiumTier: boolean;
  whopTier: WhopTier;
  canAccessFeature: (feature: string) => boolean;
}

export const WhopAppContext = createContext<WhopAppContextValue | null>(null);
