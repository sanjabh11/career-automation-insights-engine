import { useEffect, useState } from "react";

export interface SearchHistoryItem {
  id: string;
  search_term: string;
  results_count: number;
  searched_at: string;
}

const STORAGE_KEY = "local_search_history";

function load(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: SearchHistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useSearchHistoryLocal() {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    setSearchHistory(load());
    setIsLoading(false);
  }, []);

  const addSearch = ({ search_term, results_count }: { search_term: string; results_count: number }) => {
    const now = new Date().toISOString();
    const item: SearchHistoryItem = {
      id: `local_${Date.now()}`,
      search_term,
      results_count,
      searched_at: now,
    };
    setSearchHistory((prev) => {
      const next = [item, ...prev].slice(0, 50);
      save(next);
      return next;
    });
  };

  const clearHistory = async () => {
    setIsClearing(true);
    try {
      setSearchHistory([]);
      save([]);
    } finally {
      setIsClearing(false);
    }
  };

  return { searchHistory, isLoading, addSearch, clearHistory, isClearing };
}
