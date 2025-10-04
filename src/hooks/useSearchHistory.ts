
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";

export interface SearchHistoryItem {
  id: string;
  search_term: string;
  results_count: number;
  searched_at: string;
}

function isMissingRelationOrColumn(error: any): boolean {
  const msg = String(error?.message || "");
  const code = String(error?.code || "");
  return (
    code === "42P01" || // undefined_table
    code === "42703" || // undefined_column
    code === "PGRST204" || // PostgREST schema cache column not found
    /relation .* does not exist/i.test(msg) ||
    /column .* does not exist/i.test(msg) ||
    /could not find .* column/i.test(msg)
  );
}

export function useSearchHistory() {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const schemaAvailableRef = useRef(true);

  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      queryClient.invalidateQueries({ queryKey: ['search_history'] });
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [queryClient]);

  const queryKey = ['search_history', user?.id];

  const { data: searchHistory = [], isLoading } = useQuery<SearchHistoryItem[]>({
    queryKey,
    queryFn: async () => {
      if (!user || !schemaAvailableRef.current) return [];

      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('searched_at', { ascending: false })
        .limit(50);

      if (error) {
        if (isMissingRelationOrColumn(error)) {
          schemaAvailableRef.current = false;
          console.warn('search_history schema unavailable; skipping history fetch');
          return [];
        }
        console.error('Error fetching search history:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  const addSearchMutation = useMutation({
    mutationFn: async ({ 
      search_term, 
      results_count 
    }: {
      search_term: string;
      results_count: number;
    }) => {
      if (!user || !schemaAvailableRef.current) return;

      const { error } = await supabase
        .from('search_history')
        .insert({
          user_id: user.id,
          search_term,
          results_count
        });
      
      if (error) {
        if (isMissingRelationOrColumn(error)) {
          schemaAvailableRef.current = false;
          return;
        }
        console.error('Error saving search history:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      if (!schemaAvailableRef.current) return;

      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        if (isMissingRelationOrColumn(error)) {
          console.warn('search_history not available; skipping clearHistory');
          return;
        }
        console.error('Error clearing search history:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    searchHistory,
    isLoading,
    addSearch: (data: any) => addSearchMutation.mutate(data),
    clearHistory: () => clearHistoryMutation.mutate(),
    isClearing: clearHistoryMutation.isPending,
  };
}
