/**
 * Whop SDK Client Configuration
 * Career Automation Insights Engine
 * 
 * This module provides Whop integration for:
 * - OAuth authentication
 * - Membership verification
 * - API interactions
 */

// Environment variables: only OAuth public config belongs in the browser.
// Client secrets and API keys are handled by server-side Edge Functions.
const WHOP_CLIENT_ID = import.meta.env.VITE_WHOP_CLIENT_ID || '';
const WHOP_REDIRECT_URI = import.meta.env.VITE_WHOP_REDIRECT_URI || 'http://localhost:5173/auth/whop/callback';

// Supabase URL for Edge Function calls
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

// Whop API base URL
const WHOP_API_BASE = 'https://api.whop.com/v5';

// Validate environment
export function validateWhopConfig(): boolean {
  const missing: string[] = [];
  
  if (!WHOP_CLIENT_ID) missing.push('VITE_WHOP_CLIENT_ID');
  // Client secret and API keys are server-only and handled by whop-oauth Edge Function.
  
  if (missing.length > 0) {
    console.warn(`[Whop] Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

// Check if Whop is configured
export function isWhopConfigured(): boolean {
  return Boolean(WHOP_CLIENT_ID && WHOP_REDIRECT_URI);
}

// Export configuration for OAuth (no secret — that's server-side only)
export const whopConfig = {
  clientId: WHOP_CLIENT_ID,
  redirectUri: WHOP_REDIRECT_URI,
  scopes: ['openid', 'profile', 'email', 'whop.membership.read'],
};

/**
 * Generate OAuth authorization URL
 */
export function getWhopAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: whopConfig.clientId,
    redirect_uri: whopConfig.redirectUri,
    response_type: 'code',
    scope: whopConfig.scopes.join(' '),
    state: state || crypto.randomUUID(),
  });
  
  return `https://whop.com/oauth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token via server-side Edge Function
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/whop-oauth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'exchange',
      code,
      redirect_uri: whopConfig.redirectUri,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`Whop OAuth error: ${error.error || response.statusText}`);
  }
  
  return response.json();
}

/**
 * Refresh access token via server-side Edge Function
 */
export async function refreshWhopToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/whop-oauth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'refresh',
      refresh_token: refreshToken,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to refresh Whop token');
  }
  
  return response.json();
}

/**
 * Get current user from Whop
 */
export async function getWhopUser(accessToken: string): Promise<{
  id: string;
  email: string;
  username: string;
  name: string;
  profile_pic_url: string;
}> {
  const response = await fetch(`${WHOP_API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get Whop user');
  }
  
  return response.json();
}

/**
 * Get user's memberships
 */
export async function getWhopMemberships(accessToken: string): Promise<Array<{
  id: string;
  product_id: string;
  plan_id: string;
  status: string;
  valid: boolean;
  license_key: string;
  created_at: string;
  expires_at: string | null;
}>> {
  const response = await fetch(`${WHOP_API_BASE}/me/memberships`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to get Whop memberships');
  }
  
  const data = await response.json();
  return data.data || [];
}

/**
 * Verify if user has valid membership for this app
 */
export async function verifyMembership(
  accessToken: string,
  productId?: string
): Promise<{
  hasAccess: boolean;
  membership: {
    id: string;
    tier: 'free' | 'pro' | 'enterprise';
    valid: boolean;
    expiresAt: string | null;
  } | null;
}> {
  try {
    const memberships = await getWhopMemberships(accessToken);
    
    // Find valid membership for our product
    const validMembership = memberships.find(m => {
      if (productId && m.product_id !== productId) return false;
      return m.valid;
    });
    
    if (!validMembership) {
      return { hasAccess: false, membership: null };
    }
    
    // Map Whop plan to our tiers
    const tierMap: Record<string, 'free' | 'pro' | 'enterprise'> = {
      'free': 'free',
      'basic': 'free',
      'pro': 'pro',
      'premium': 'pro',
      'enterprise': 'enterprise',
      'business': 'enterprise',
    };
    
    // Get tier from plan ID or default to pro
    const tier = tierMap[validMembership.plan_id.toLowerCase()] || 'pro';
    
    return {
      hasAccess: true,
      membership: {
        id: validMembership.id,
        tier,
        valid: validMembership.valid,
        expiresAt: validMembership.expires_at,
      },
    };
  } catch (error) {
    console.error('[Whop] Membership verification error:', error);
    return { hasAccess: false, membership: null };
  }
}

// Export types
export interface WhopUser {
  id: string;
  email: string;
  username: string;
  name: string;
  profilePicUrl: string;
}

export interface WhopMembership {
  id: string;
  productId: string;
  planId: string;
  status: string;
  valid: boolean;
  licenseKey: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface WhopTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
