
// Supabase does not export the Json type, so we define it here:
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

import { supabase } from "@/integrations/supabase/client";

/**
 * Track an analytics event for the current user (basic interface).
 * @param payload - event details
 */
export async function trackAnalyticsEvent(payload: {
  event_name: string;
  event_category: string;
  event_data?: Json;    // Use Json type explicitly!
  page_url?: string;
}) {
  // DISABLED: Analytics events table has schema issues
  // Re-enable after fixing analytics_events table schema in Supabase
  return;

  try {
    // In local dev, skip analytics unless explicitly enabled
    const envAny = (import.meta as any)?.env || {};
    const enableDev = envAny.VITE_ENABLE_ANALYTICS_DEV === 'true';
    const isDevBuild = !!envAny.DEV;

    if (!enableDev && isDevBuild) {
      // Never send analytics in local dev by default
      return;
    }

    // Grabs user from supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    const user_id = session?.user?.id;

    // In contexts like Whop iframe or unauthenticated views, there may be no Supabase user.
    // To avoid 400s from a NOT NULL constraint on analytics_events.user_id, safely no-op.
    if (!user_id) {
      return;
    }

    // Insert using correct column names matching the analytics_events table schema
    await supabase.from('analytics_events').insert({
      user_id,
      event_name: payload.event_name,
      event_category: payload.event_category,
      event_data: payload.event_data ?? {},
      page_url: payload.page_url ?? window.location.pathname,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.warn("Analytics event not tracked:", error);
  }
}

