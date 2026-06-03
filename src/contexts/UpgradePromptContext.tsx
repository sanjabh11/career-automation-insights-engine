/**
 * Upgrade Prompt Context
 * Global state management for upgrade prompts and conversion flows
 */

import React, { useState, useCallback } from 'react';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import {
  UpgradePromptContext,
  type UpgradePromptState,
} from '@/contexts/upgradePromptContextValue';

export const UpgradePromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [promptState, setPromptState] = useState<UpgradePromptState>({
    isOpen: false,
    feature: 'apoChecks',
    currentUsage: undefined,
    limitReached: true,
  });

  const showUpgradePrompt = useCallback(
    (
      feature: UpgradePromptState['feature'],
      options?: { currentUsage?: number; limitReached?: boolean }
    ) => {
      setPromptState({
        isOpen: true,
        feature,
        currentUsage: options?.currentUsage,
        limitReached: options?.limitReached ?? true,
      });
    },
    []
  );

  const hideUpgradePrompt = useCallback(() => {
    setPromptState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <UpgradePromptContext.Provider value={{ showUpgradePrompt, hideUpgradePrompt }}>
      {children}
      <UpgradePrompt
        isOpen={promptState.isOpen}
        onClose={hideUpgradePrompt}
        feature={promptState.feature}
        currentUsage={promptState.currentUsage}
        limitReached={promptState.limitReached}
      />
    </UpgradePromptContext.Provider>
  );
};
