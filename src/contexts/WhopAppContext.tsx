/**
 * Whop App Context
 * Career Automation Insights Engine
 * 
 * This context provides Whop iframe SDK integration for embedded app mode.
 * It handles:
 * - Detection of Whop iframe context
 * - Communication with parent Whop window
 * - User identity and access level from Whop
 * - Bypassing traditional auth when in Whop mode
 */

import React, { useEffect, useState, useCallback, ReactNode } from 'react';
import {
  WhopAppContext,
  type WhopAppContextValue,
  type WhopExperience,
  type WhopMembership,
  type WhopTier,
  type WhopUser,
} from '@/contexts/WhopAppContextCore';

// Check if we're running inside a Whop iframe
function detectWhopIframe(): boolean {
  try {
    // Check for Whop-specific indicators from URL and referrer
    const urlParams = new URLSearchParams(window.location.search);
    const whopFlag = urlParams.get('whop');
    const hasWhopParams = whopFlag === '1' ||
                          urlParams.has('experience_id') ||
                          urlParams.has('company_id') ||
                          urlParams.has('user_token');

    const referrer = document.referrer;
    const isWhopReferrer = referrer.includes('whop.com') ||
                           referrer.includes('whop.dev');

    const isEmbedded = window.self !== window.top;

    // True Whop iframe case
    if (isEmbedded) {
      return true;
    }

    // Dev/test override: allow ?whop=1 to simulate Whop mode even when not embedded
    if (whopFlag === '1') {
      return true;
    }

    return hasWhopParams || isWhopReferrer;
  } catch (e) {
    // If we can't access window.top, we're likely in a cross-origin iframe
    // This could be Whop
    return true;
  }
}

// Get Whop user token from various sources
function getWhopUserToken(): string | null {
  // Check URL params
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get('user_token');
  if (tokenFromUrl) return tokenFromUrl;
  
  // Check headers (if passed via postMessage from parent)
  const storedToken = sessionStorage.getItem('whop_user_token');
  if (storedToken) return storedToken;
  
  return null;
}

interface WhopAppProviderProps {
  children: ReactNode;
  // Optional: Force Whop mode for testing
  forceWhopMode?: boolean;
}

export function WhopAppProvider({ children, forceWhopMode = false }: WhopAppProviderProps) {
  const [isWhopEmbed, setIsWhopEmbed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [whopUser, setWhopUser] = useState<WhopUser | null>(null);
  const [membership, setMembership] = useState<WhopMembership | null>(null);
  const [experience, setExperience] = useState<WhopExperience | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Initialize Whop SDK and context
  const initializeWhopContext = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const isEmbed = forceWhopMode || detectWhopIframe();
      setIsWhopEmbed(isEmbed);
      
      if (!isEmbed) {
        // Not in Whop mode, skip Whop initialization
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }
      
      console.log('[WhopApp] Detected Whop iframe environment');
      
      // Try to get user token
      const userToken = getWhopUserToken();
      
      if (userToken) {
        // Verify token and get user info via our backend
        const response = await fetch('/api/whop/verify-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-whop-user-token': userToken,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setWhopUser(data.user);
          setMembership(data.membership);
          setExperience(data.experience);
          setProfileId(data.profileId);
        } else {
          console.warn('[WhopApp] Token verification failed, using anonymous mode');
        }
      }
      
      // Set up message listener for parent window communication
      const handleMessage = (event: MessageEvent) => {
        // Verify origin is Whop
        if (!event.origin.includes('whop.com') && !event.origin.includes('whop.dev')) {
          return;
        }
        
        const { type, payload } = event.data || {};
        
        switch (type) {
          case 'WHOP_USER_TOKEN':
            sessionStorage.setItem('whop_user_token', payload.token);
            break;
            
          case 'WHOP_USER_INFO':
            setWhopUser(payload.user);
            setMembership(payload.membership);
            break;
            
          case 'WHOP_THEME_CHANGE':
            // Handle theme changes if needed
            console.log('[WhopApp] Theme change:', payload);
            break;
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Request user info from parent
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'WHOP_APP_READY' }, '*');
      }
      
      setIsInitialized(true);
      
    } catch (err) {
      console.error('[WhopApp] Initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize Whop context');
    } finally {
      setIsLoading(false);
    }
  }, [forceWhopMode]);

  // Sync Whop user with Supabase profile
  // Note: Using RPC or raw queries because Supabase types may not be regenerated yet
  const syncWithSupabase = useCallback(async () => {
    if (!whopUser) return;
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      // Check if profile exists for this Whop user using raw query
      // The whop_user_id column exists in DB but types may not be updated
      const { data: existingProfile, error: existingError } = await supabase
        .rpc('get_or_create_whop_profile', {
          p_whop_user_id: whopUser.id,
          p_email: whopUser.email,
          p_username: whopUser.username,
          p_name: whopUser.username,
          p_avatar_url: whopUser.profilePicUrl || null,
        });
      
      if (!existingError && existingProfile) {
        setProfileId(existingProfile as string);
        return;
      }
      
      // Fallback: Try to find by email using standard query
      const { data: profileByEmail } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', whopUser.email)
        .single();
      
      if (profileByEmail) {
        setProfileId(profileByEmail.id);
      }
      
    } catch (err) {
      console.error('[WhopApp] Error syncing with Supabase:', err);
    }
  }, [whopUser]);

  // Initialize on mount
  useEffect(() => {
    initializeWhopContext();
  }, [initializeWhopContext]);

  // Sync with Supabase when Whop user changes
  useEffect(() => {
    if (whopUser && isWhopEmbed) {
      syncWithSupabase();
    }
  }, [whopUser, isWhopEmbed, syncWithSupabase]);

  // Computed values
  const accessLevel = membership?.accessLevel || 'none';
  const isCustomer = accessLevel === 'customer' || accessLevel === 'admin';
  const isAdmin = accessLevel === 'admin';
  const hasAccess = membership?.valid || false;
  
  // Freemium model: all Whop embed users get basic access
  // Premium features can be gated using isPremiumTier
  const isPremiumTier = hasAccess || membership?.valid || false;
  const isFreeTier = !isPremiumTier;
  
  // Map Whop membership to internal tier
  const whopTier: WhopTier = (() => {
    if (!membership?.valid) return 'free';
    const tierStr = membership.accessLevel?.toLowerCase() || '';
    if (tierStr.includes('enterprise') || tierStr.includes('admin')) return 'enterprise';
    if (tierStr.includes('pro') || tierStr.includes('customer')) return 'pro';
    return 'free';
  })();
  
  // Feature access control based on Whop tier
  const canAccessFeature = useCallback((feature: string): boolean => {
    // Free tier features
    const freeFeatures = [
      'apo_basic',           // 3 APO checks/month
      'ai_chat_basic',       // 10 messages/month
      'skill_tracking_basic', // Basic skill view
      'browse_occupations',   // Browse all occupations
    ];
    
    // Pro tier features
    const proFeatures = [
      ...freeFeatures,
      'apo_unlimited',        // Unlimited APO checks
      'ai_chat_unlimited',    // Unlimited AI coaching
      'roadmap_generator',    // Full roadmaps
      'skill_half_life',      // Skill decay alerts
      'export_reports',       // PDF/CSV exports
      'share_analysis',       // Share with link
    ];
    
    // Enterprise features
    const enterpriseFeatures = [
      ...proFeatures,
      'community_analytics',  // Full community dashboard
      'bulk_import',          // CSV bulk import
      'white_label',          // White-label reports
      'api_access',           // API access
      'priority_support',     // Priority support
    ];
    
    switch (whopTier) {
      case 'enterprise':
        return enterpriseFeatures.includes(feature);
      case 'pro':
        return proFeatures.includes(feature);
      default:
        return freeFeatures.includes(feature);
    }
  }, [whopTier]);
  
  // Request upgrade via Whop native flow
  const requestUpgrade = useCallback(() => {
    if (window.parent !== window) {
      // Send message to Whop parent to trigger upgrade modal
      window.parent.postMessage({ 
        type: 'WHOP_REQUEST_UPGRADE',
        payload: {
          currentTier: whopTier,
          requestedTier: whopTier === 'free' ? 'pro' : 'enterprise',
        }
      }, '*');
    } else {
      // Fallback: redirect to pricing page
      window.location.href = '/pricing';
    }
  }, [whopTier]);

  const value: WhopAppContextValue = {
    isWhopEmbed,
    isLoading,
    isInitialized,
    error,
    whopUser,
    membership,
    experience,
    accessLevel,
    profileId,
    refreshContext: initializeWhopContext,
    requestUpgrade,
    isCustomer,
    isAdmin,
    hasAccess,
    isFreeTier,
    isPremiumTier,
    whopTier,
    canAccessFeature,
  };

  return (
    <WhopAppContext.Provider value={value}>
      {children}
    </WhopAppContext.Provider>
  );
}

export type { WhopTier } from '@/contexts/WhopAppContextCore';
