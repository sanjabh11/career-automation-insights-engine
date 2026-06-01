import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { APIErrorHandler } from "@/utils/apiErrorHandler";
import type { 
  SearchOccupationsRequest,
  SearchOccupationsResponse,
  SearchFilters 
} from "@/types/onet-enrichment";

/**
 * Hook for advanced occupation search with filters
 * Supports: keyword, Bright Outlook, STEM, Career Cluster, Job Zone, Wage range
 */
export function useAdvancedSearch() {
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<SearchOccupationsResponse | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async (params: SearchOccupationsRequest) => {
      const { data, error } = await supabase.functions.invoke("search-occupations", {
        body: params,
      });

      if (error) throw error;
      return data as SearchOccupationsResponse;
    },
    onSuccess: (data) => {
      setSearchResults(data);
    },
    onError: (error) => {
      const apiError = APIErrorHandler.handle(error);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: apiError.message,
      });
    },
  });

  const search = useCallback((keyword?: string, filters?: SearchFilters, limit = 20, offset = 0) => {
    mutate({ keyword, filters, limit, offset });
  }, [mutate]);

  const loadMore = useCallback(() => {
    if (!searchResults?.hasMore) return;
    
    const nextOffset = searchResults.offset + searchResults.limit;
    mutate({
      keyword: searchResults.filters ? undefined : "",
      filters: searchResults.filters,
      limit: searchResults.limit,
      offset: nextOffset,
    });
  }, [mutate, searchResults]);

  const reset = useCallback(() => {
    setSearchResults(null);
  }, []);

  return {
    search,
    loadMore,
    reset,
    results: searchResults?.occupations || [],
    total: searchResults?.total || 0,
    hasMore: searchResults?.hasMore || false,
    isSearching: isPending,
    filters: searchResults?.filters,
  };
}
