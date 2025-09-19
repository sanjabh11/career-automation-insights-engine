
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";

export interface SavedSelection<T> {
  id: string;
  name: string;
  data: T;
  createdAt: number;
}

const STORAGE_KEY = "apo_saved_selections_v1";

// Helpers for localStorage for anonymous users
function getLocalSelections<T>(): SavedSelection<T>[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // ignore parsing errors
    }
  }
  return [];
}

function setLocalSelections<T>(selections: SavedSelection<T>[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
}

export function useSavedSelections<T = unknown>() {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  function isMissingRelationOrColumn(error: any): boolean {
    const msg = String(error?.message || "");
    const code = String(error?.code || "");
    return (
      code === "42P01" || // undefined_table
      code === "42703" || // undefined_column
      /relation .* does not exist/i.test(msg) ||
      /column .* does not exist/i.test(msg)
    );
  }

  useEffect(() => {
    const checkUserSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      queryClient.invalidateQueries({ queryKey: ['user_selections'] });
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [queryClient]);
  
  const queryKey = ['user_selections', user?.id];

  const { data: saved = [], isLoading } = useQuery<SavedSelection<T>[]>({
    queryKey,
    queryFn: async () => {
      if (!user) {
        return getLocalSelections<T>();
      }

      const { data, error } = await supabase
        .from('user_selections')
        .select('id, name, selections, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (isMissingRelationOrColumn(error)) {
          console.warn('user_selections not available; falling back to local selections');
          return getLocalSelections<T>();
        }
        console.error('Error fetching selections from Supabase:', error);
        throw error;
      }
      
      return data.map(d => ({
        id: d.id,
        name: d.name,
        data: d.selections as T,
        createdAt: new Date(d.created_at).getTime(),
      }));
    },
  });

  const saveListMutation = useMutation({
    mutationFn: async ({ name, data: listData }: { name: string, data: T }) => {
      if (!user) {
        const currentSelections = getLocalSelections<T>();
        const newEntry: SavedSelection<T> = {
          id: `local_${Date.now().toString(36)}`,
          name: name || "Untitled",
          data: listData,
          createdAt: Date.now(),
        };
        setLocalSelections([newEntry, ...currentSelections]);
        return newEntry;
      }

      const { data, error } = await supabase
        .from('user_selections')
        .insert({ user_id: user.id, name: name || "Untitled", selections: listData as any })
        .select('id')
        .single();
      
      if (error) {
        if (isMissingRelationOrColumn(error)) {
          console.warn('user_selections not available; saving locally');
          const currentSelections = getLocalSelections<T>();
          const newEntry: SavedSelection<T> = {
            id: `local_${Date.now().toString(36)}`,
            name: name || "Untitled",
            data: listData,
            createdAt: Date.now(),
          };
          setLocalSelections([newEntry, ...currentSelections]);
          return { id: newEntry.id } as any;
        }
        console.error('Error saving selection to Supabase:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: string, newName: string }) => {
      if (!user || id.startsWith('local_')) {
        const selections = getLocalSelections<T>();
        const updatedSelections = selections.map(s => s.id === id ? { ...s, name: newName } : s);
        setLocalSelections(updatedSelections);
        return;
      }

      const { error } = await supabase
        .from('user_selections')
        .update({ name: newName })
        .eq('id', id);

      if (error) {
        if (isMissingRelationOrColumn(error)) {
          console.warn('user_selections not available; updating name locally');
          const selections = getLocalSelections<T>();
          const updatedSelections = selections.map(s => s.id === id ? { ...s, name: newName } : s);
          setLocalSelections(updatedSelections);
          return;
        }
        console.error("Error updating selection name in Supabase:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  const removeListMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user || id.startsWith('local_')) {
        const selections = getLocalSelections<T>();
        const filteredSelections = selections.filter(s => s.id !== id);
        setLocalSelections(filteredSelections);
        return;
      }

      const { error } = await supabase
        .from('user_selections')
        .delete()
        .eq('id', id);

      if (error) {
        if (isMissingRelationOrColumn(error)) {
          console.warn('user_selections not available; removing locally');
          const selections = getLocalSelections<T>();
          const filteredSelections = selections.filter(s => s.id !== id);
          setLocalSelections(filteredSelections);
          return;
        }
        console.error("Error removing selection from Supabase:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return {
    saved,
    isLoading,
    saveList: (name: string, data: T) => saveListMutation.mutate({ name, data }),
    updateName: (id: string, newName: string) => updateNameMutation.mutate({ id, newName }),
    removeList: (id: string) => removeListMutation.mutate(id),
    loadList: (id: string): SavedSelection<T> | undefined => saved.find((entry) => entry.id === id),
  };
}
