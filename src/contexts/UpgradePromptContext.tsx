/**
 * Upgrade Prompt Context
 * Global state management for upgrade prompts and conversion flows
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { UpgradePrompt } from '@/components/UpgradePrompt';

interface UpgradePromptState {
  isOpen: boolean;
  feature: 'apoChecks' | 'aiChat' | 'savedAnalyses' | 'exports' | 'apiAccess';
  currentUsage?: number;
  limitReached?: boolean;
}

interface UpgradePromptContextType {
  showUpgradePrompt: (
    feature: UpgradePromptState['feature'],
    options?: { currentUsage?: number; limitReached?: boolean }
  ) => void;
  hideUpgradePrompt: () => void;
}

const UpgradePromptContext = createContext<UpgradePromptContextType | undefined>(undefined);

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

export const useUpgradePrompt = (): UpgradePromptContextType => {
  const context = useContext(UpgradePromptContext);
  if (!context) {
    throw new Error('useUpgradePrompt must be used within UpgradePromptProvider');
  }
  return context;
};
