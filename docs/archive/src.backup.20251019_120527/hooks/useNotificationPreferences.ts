
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";

export type NotificationPreferences = {
  id: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  analysis_complete: boolean;
  weekly_summary: boolean;
  share_notifications: boolean;
  system_updates: boolean;
  created_at: string;
  updated_at: string;
};

export function useNotificationPreferences() {
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
      queryClient.invalidateQueries({ queryKey: ['notification_preferences'] });
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [queryClient]);

  const queryKey = ['notification_preferences', user?.id];

  const { data: preferences, isLoading } = useQuery<NotificationPreferences | null>({
    queryKey,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.error("Failed to load notification preferences:", error);
        return null;
      }
      return data;
    },
    enabled: !!user,
  });

  const upsertPreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('User not authenticated');
      const fieldsToUpdate = { ...preferences, ...updates, user_id: user.id };
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert(fieldsToUpdate)
        .select()
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    preferences,
    isLoading,
    updatePreferences: (updates: Partial<NotificationPreferences>) => upsertPreferencesMutation.mutate(updates),
    isUpdating: upsertPreferencesMutation.isPending,
    user,
  };
}

