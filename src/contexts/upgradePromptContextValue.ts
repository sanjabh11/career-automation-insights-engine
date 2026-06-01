import { createContext, useContext } from 'react';

export interface UpgradePromptState {
  isOpen: boolean;
  feature: 'apoChecks' | 'aiChat' | 'savedAnalyses' | 'exports' | 'apiAccess';
  currentUsage?: number;
  limitReached?: boolean;
}

export interface UpgradePromptContextType {
  showUpgradePrompt: (
    feature: UpgradePromptState['feature'],
    options?: { currentUsage?: number; limitReached?: boolean }
  ) => void;
  hideUpgradePrompt: () => void;
}

export const UpgradePromptContext = createContext<UpgradePromptContextType | undefined>(undefined);

export const useUpgradePrompt = (): UpgradePromptContextType => {
  const context = useContext(UpgradePromptContext);
  if (!context) {
    throw new Error('useUpgradePrompt must be used within UpgradePromptProvider');
  }
  return context;
};
