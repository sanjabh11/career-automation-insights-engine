/**
 * Whop Authentication Context
 * Career Automation Insights Engine
 * 
 * Provides Whop authentication state and methods throughout the app.
 * Works alongside Supabase auth for hybrid authentication.
 */

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  getWhopAuthUrl, 
  exchangeCodeForToken, 
  getWhopUser, 
  verifyMembership,
  refreshWhopToken,
  isWhopConfigured,
  WhopUser,
  WhopTokens,
} from '@/integrations/whop/client';
import { supabase } from '@/integrations/supabase/client';
import { WhopAuthContext, type WhopAuthState } from '@/contexts/WhopAuthContextCore';

// Whop session storage keys
const WHOP_ACCESS_TOKEN_KEY = 'whop_access_token';
const WHOP_REFRESH_TOKEN_KEY = 'whop_refresh_token';
const WHOP_EXPIRES_AT_KEY = 'whop_expires_at';
const WHOP_USER_KEY = 'whop_user';

interface WhopAuthProviderProps {
  children: ReactNode;
}

export function WhopAuthProvider({ children }: WhopAuthProviderProps) {
  const [state, setState] = useState<WhopAuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    membership: null,
    error: null,
  });

  const isWhopEnabled = isWhopConfigured();

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem(WHOP_REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;

      const tokens = await refreshWhopToken(refreshToken);

      const expiresAt = Date.now() + (tokens.expires_in * 1000);
      localStorage.setItem(WHOP_ACCESS_TOKEN_KEY, tokens.access_token);
      localStorage.setItem(WHOP_REFRESH_TOKEN_KEY, tokens.refresh_token);
      localStorage.setItem(WHOP_EXPIRES_AT_KEY, expiresAt.toString());

      return true;
    } catch (error) {
      console.error('[WhopAuth] Token refresh failed:', error);
      clearStorage();
      return false;
    }
  }, []);

  // Initialize from storage
  useEffect(() => {
    if (!isWhopEnabled) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem(WHOP_ACCESS_TOKEN_KEY);
        const expiresAt = localStorage.getItem(WHOP_EXPIRES_AT_KEY);
        const userStr = localStorage.getItem(WHOP_USER_KEY);

        if (!accessToken || !expiresAt) {
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Check if token is expired
        if (Date.now() > parseInt(expiresAt)) {
          const refreshed = await refreshSession();
          if (!refreshed) {
            setState(prev => ({ ...prev, isLoading: false }));
            return;
          }
        }

        // Restore user from storage
        if (userStr) {
          const user = JSON.parse(userStr) as WhopUser;
          
          // Verify membership
          const { hasAccess, membership } = await verifyMembership(accessToken);
          
          setState({
            isAuthenticated: true,
            isLoading: false,
            user,
            membership,
            error: null,
          });
        } else {
          // Fetch user if not in storage
          const user = await getWhopUser(accessToken);
          const { membership } = await verifyMembership(accessToken);
          
          localStorage.setItem(WHOP_USER_KEY, JSON.stringify(user));
          
          setState({
            isAuthenticated: true,
            isLoading: false,
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              name: user.name,
              profilePicUrl: user.profile_pic_url,
            },
            membership,
            error: null,
          });
        }
      } catch (error) {
        console.error('[WhopAuth] Initialization error:', error);
        clearStorage();
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          membership: null,
          error: 'Failed to initialize Whop session',
        });
      }
    };

    initializeAuth();
  }, [isWhopEnabled, refreshSession]);

  // Handle OAuth callback
  useEffect(() => {
    if (!isWhopEnabled) return;

    const handleCallback = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: `Whop OAuth error: ${error}`,
        }));
        return;
      }

      if (!code) return;

      // Verify state if we stored one
      const storedState = sessionStorage.getItem('whop_oauth_state');
      if (storedState && state !== storedState) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Invalid OAuth state',
        }));
        return;
      }

      try {
        setState(prev => ({ ...prev, isLoading: true }));

        // Exchange code for tokens
        const tokens = await exchangeCodeForToken(code);
        
        // Store tokens
        const expiresAt = Date.now() + (tokens.expires_in * 1000);
        localStorage.setItem(WHOP_ACCESS_TOKEN_KEY, tokens.access_token);
        localStorage.setItem(WHOP_REFRESH_TOKEN_KEY, tokens.refresh_token);
        localStorage.setItem(WHOP_EXPIRES_AT_KEY, expiresAt.toString());

        // Get user info
        const whopUser = await getWhopUser(tokens.access_token);
        localStorage.setItem(WHOP_USER_KEY, JSON.stringify(whopUser));

        // Verify membership
        const { membership } = await verifyMembership(tokens.access_token);

        // Clear URL params
        window.history.replaceState({}, document.title, window.location.pathname);
        sessionStorage.removeItem('whop_oauth_state');

        // Sync with Supabase
        await syncUserWithSupabase(whopUser, membership);

        setState({
          isAuthenticated: true,
          isLoading: false,
          user: {
            id: whopUser.id,
            email: whopUser.email,
            username: whopUser.username,
            name: whopUser.name,
            profilePicUrl: whopUser.profile_pic_url,
          },
          membership,
          error: null,
        });
      } catch (error) {
        console.error('[WhopAuth] OAuth callback error:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to complete Whop login',
        }));
      }
    };

    if (window.location.pathname.includes('/auth/whop/callback')) {
      handleCallback();
    }
  }, [isWhopEnabled]);

  const loginWithWhop = useCallback(() => {
    if (!isWhopEnabled) {
      console.warn('[WhopAuth] Whop is not configured');
      return;
    }

    // Generate and store state for CSRF protection
    const state = crypto.randomUUID();
    sessionStorage.setItem('whop_oauth_state', state);

    // Redirect to Whop OAuth
    const authUrl = getWhopAuthUrl(state);
    window.location.href = authUrl;
  }, [isWhopEnabled]);

  const logout = useCallback(async () => {
    clearStorage();
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      membership: null,
      error: null,
    });
  }, []);

  const syncWithSupabase = useCallback(async () => {
    if (!state.user || !state.membership) return;
    await syncUserWithSupabase(state.user, state.membership);
  }, [state.user, state.membership]);

  return (
    <WhopAuthContext.Provider
      value={{
        ...state,
        loginWithWhop,
        logout,
        refreshSession,
        syncWithSupabase,
        isWhopEnabled,
      }}
    >
      {children}
    </WhopAuthContext.Provider>
  );
}

// Helper to clear storage
function clearStorage() {
  localStorage.removeItem(WHOP_ACCESS_TOKEN_KEY);
  localStorage.removeItem(WHOP_REFRESH_TOKEN_KEY);
  localStorage.removeItem(WHOP_EXPIRES_AT_KEY);
  localStorage.removeItem(WHOP_USER_KEY);
}

// Sync Whop user with Supabase
async function syncUserWithSupabase(
  whopUser: WhopUser,
  membership: { id: string; tier: string; valid: boolean; expiresAt: string | null } | null
) {
  try {
    // Check if user exists in Supabase
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, whop_user_id')
      .eq('whop_user_id', whopUser.id)
      .single();

    if (existingProfile) {
      // Update existing profile
      await supabase
        .from('profiles')
        .update({
          whop_membership_id: membership?.id,
          whop_tier: membership?.tier || 'free',
          whop_membership_valid: membership?.valid || false,
          whop_membership_expires_at: membership?.expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id);
    } else {
      // Create new profile linked to Whop
      // Note: This requires the user to also have a Supabase account
      // For Whop-only users, we'd need to create a shadow account
      console.log('[WhopAuth] User does not have linked Supabase account');
    }
  } catch (error) {
    console.error('[WhopAuth] Failed to sync with Supabase:', error);
  }
}

export type { WhopAuthContextValue, WhopAuthState } from '@/contexts/WhopAuthContextCore';
