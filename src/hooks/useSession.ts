
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { identifyUser, resetUser } from "@/lib/posthog";

/**
 * useSession - Hook to manage Supabase user & session state.
 */
export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncSession = (nextSession: Session | null) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        identifyUser(nextSession.user.id, { auth_provider: "supabase" });
      } else {
        resetUser();
      }
      setLoading(false);
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, session, loading };
}
