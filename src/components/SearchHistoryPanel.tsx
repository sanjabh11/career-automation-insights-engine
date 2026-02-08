
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Trash2, Search } from "lucide-react";
import { useSearchHistoryUnified } from "@/hooks/useSearchHistoryUnified";
import { toast } from "sonner";

interface SearchHistoryPanelProps {
  onSearchSelect?: (searchTerm: string) => void;
}

export function SearchHistoryPanel({ onSearchSelect }: SearchHistoryPanelProps) {
  const { searchHistory, clearHistory, isLoading, isClearing } = useSearchHistoryUnified();

  const handleClearHistory = async () => {
    if (confirm("Are you sure you want to clear your entire search history?")) {
      try {
        await clearHistory();
        toast.success("Search history cleared!");
      } catch (error) {
        toast.error("Failed to clear search history");
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-tertiary)]">Loading search history...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[var(--accent-primary)]" />
          <h3 className="text-lg font-semibold">Search History</h3>
          <Badge variant="secondary">{searchHistory.length}</Badge>
        </div>
        {searchHistory.length > 0 && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleClearHistory}
            disabled={isClearing}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {searchHistory.length === 0 ? (
          <p className="text-[var(--text-tertiary)] text-sm">No search history yet.</p>
        ) : (
          searchHistory.map((item) => (
            <div 
              key={item.id} 
              className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Search className="w-3 h-3 text-[var(--text-tertiary)]" />
                  <span 
                    className="text-sm font-medium cursor-pointer text-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                    onClick={() => onSearchSelect?.(item.search_term)}
                  >
                    {item.search_term}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {new Date(item.searched_at).toLocaleDateString()}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {item.results_count} results
                  </Badge>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
