
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";

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

export function useSavedAnalyses() {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      queryClient.invalidateQueries({ queryKey: ['saved_analyses'] });
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [queryClient]);

  const queryKey = ['saved_analyses', user?.id];

  const { data: savedAnalyses = [], isLoading } = useQuery<SavedAnalysis[]>({
    queryKey,
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('saved_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching saved analyses:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  const saveAnalysisMutation = useMutation({
    mutationFn: async ({ 
      occupation_code, 
      occupation_title, 
      analysis_data, 
      tags = [], 
      notes 
    }: {
      occupation_code: string;
      occupation_title: string;
      analysis_data: any;
      tags?: string[];
      notes?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('saved_analyses')
        .insert({
          user_id: user.id,
          occupation_code,
          occupation_title,
          analysis_data,
          tags,
          notes
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error saving analysis:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateAnalysisMutation = useMutation({
    mutationFn: async ({ 
      id, 
      tags, 
      notes 
    }: {
      id: string;
      tags?: string[];
      notes?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('saved_analyses')
        .update({ tags, notes })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating analysis:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const deleteAnalysisMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('saved_analyses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting analysis:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    savedAnalyses,
    isLoading,
    saveAnalysis: (data: any) => saveAnalysisMutation.mutate(data),
    updateAnalysis: (data: any) => updateAnalysisMutation.mutate(data),
    deleteAnalysis: (id: string) => deleteAnalysisMutation.mutate(id),
    isSaving: saveAnalysisMutation.isPending,
    isUpdating: updateAnalysisMutation.isPending,
    isDeleting: deleteAnalysisMutation.isPending,
  };
}
