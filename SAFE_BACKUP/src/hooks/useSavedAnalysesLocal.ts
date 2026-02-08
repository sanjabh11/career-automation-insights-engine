import { useState, useEffect } from "react";

export interface SavedAnalysis {
  id: string;
  occupation_code: string;
  occupation_title: string;
  analysis_data: any;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "savedAnalyses";

function loadAnalyses(): SavedAnalysis[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveAnalyses(analyses: SavedAnalysis[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
}

export function useSavedAnalysesLocal() {
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSavedAnalyses(loadAnalyses());
    setIsLoading(false);
  }, []);

  const saveAnalysis = (analysis: Omit<SavedAnalysis, "id" | "created_at" | "updated_at"> & { id?: string }) => {
    setSavedAnalyses(prev => {
      const now = new Date().toISOString();
      let updated: SavedAnalysis[];
      if (analysis.id) {
        updated = prev.map(a =>
          a.id === analysis.id ? { ...a, ...analysis, updated_at: now } : a
        );
      } else {
        const newAnalysis: SavedAnalysis = {
          ...analysis,
          id: `analysis_${Date.now()}`,
          created_at: now,
          updated_at: now,
        };
        updated = [newAnalysis, ...prev];
      }
      saveAnalyses(updated);
      return updated;
    });
  };

  const updateAnalysis = (id: string, updates: Partial<SavedAnalysis>) => {
    setSavedAnalyses(prev => {
      const now = new Date().toISOString();
      const updated = prev.map(a =>
        a.id === id ? { ...a, ...updates, updated_at: now } : a
      );
      saveAnalyses(updated);
      return updated;
    });
  };

  const deleteAnalysis = (id: string) => {
    setSavedAnalyses(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveAnalyses(updated);
      return updated;
    });
  };

  return {
    savedAnalyses,
    isLoading,
    saveAnalysis,
    updateAnalysis,
    deleteAnalysis,
  };
}
