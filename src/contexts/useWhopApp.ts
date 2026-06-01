import { useContext } from 'react';
import { WhopAppContext } from '@/contexts/WhopAppContextCore';
import type { WhopTier } from '@/contexts/WhopAppContextCore';

export function useWhopApp() {
  const context = useContext(WhopAppContext);
  if (!context) {
    throw new Error('useWhopApp must be used within a WhopAppProvider');
  }
  return context;
}

export function useAuthMode() {
  const { isWhopEmbed, isInitialized } = useWhopApp();

  return {
    isWhopMode: isWhopEmbed,
    isTraditionalMode: !isWhopEmbed,
    isReady: isInitialized,
  };
}

export function useCurrentUser() {
  const { isWhopEmbed, whopUser, membership, profileId, hasAccess } = useWhopApp();

  if (isWhopEmbed && whopUser) {
    return {
      id: profileId || whopUser.id,
      email: whopUser.email,
      username: whopUser.username,
      avatarUrl: whopUser.profilePicUrl,
      isAuthenticated: true,
      tier: membership?.valid ? 'pro' : 'free',
      source: 'whop' as const,
      hasAccess,
    };
  }

  return null;
}

export type { WhopTier };
