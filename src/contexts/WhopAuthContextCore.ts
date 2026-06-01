import { createContext } from 'react';
import type { WhopUser } from '@/integrations/whop/client';

export interface WhopAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: WhopUser | null;
  membership: {
    id: string;
    tier: 'free' | 'pro' | 'enterprise';
    valid: boolean;
    expiresAt: string | null;
  } | null;
  error: string | null;
}

export interface WhopAuthContextValue extends WhopAuthState {
  loginWithWhop: () => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  syncWithSupabase: () => Promise<void>;
  isWhopEnabled: boolean;
}

export const WhopAuthContext = createContext<WhopAuthContextValue | null>(null);
