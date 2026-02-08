
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";

export interface UserSettings {
  theme: 'light' | 'dark';
  emailNotifications: boolean;
  autoSaveAnalyses: boolean;
  defaultExportFormat: 'csv' | 'pdf' | 'json';
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  emailNotifications: true,
  autoSaveAnalyses: true,
  defaultExportFormat: 'csv'
};

export function useUserSettings() {
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
      queryClient.invalidateQueries({ queryKey: ['user_settings'] });
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [queryClient]);

  const queryKey = ['user_settings', user?.id];

  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery<UserSettings>({
    queryKey,
    queryFn: async () => {
      if (!user) return DEFAULT_SETTINGS;

      const { data, error } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user settings:', error);
        return DEFAULT_SETTINGS;
      }

      // Defensive: force settings to be an object if possible
      let settingsObj = {};
      if (data && typeof data.settings === 'object' && data.settings !== null) {
        settingsObj = data.settings;
      }

      return { ...DEFAULT_SETTINGS, ...settingsObj };
    },
    enabled: !!user,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      if (!user) throw new Error('User not authenticated');

      const updatedSettings = { ...settings, ...newSettings };

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: updatedSettings
        });

      if (error) {
        console.error('Error updating user settings:', error);
        throw error;
      }
      
      return updatedSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: (newSettings: Partial<UserSettings>) => updateSettingsMutation.mutate(newSettings),
    isUpdating: updateSettingsMutation.isPending,
  };
}
