import { useContext } from 'react';
import { WhopAuthContext } from '@/contexts/WhopAuthContextCore';
import type { WhopAuthContextValue, WhopAuthState } from '@/contexts/WhopAuthContextCore';

export function useWhopAuth() {
  const context = useContext(WhopAuthContext);
  if (!context) {
    throw new Error('useWhopAuth must be used within WhopAuthProvider');
  }
  return context;
}

export type { WhopAuthContextValue, WhopAuthState };
