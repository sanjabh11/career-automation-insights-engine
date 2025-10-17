
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
  try {
    // In local dev, skip analytics unless explicitly enabled
    const enableDev = (import.meta as any)?.env?.VITE_ENABLE_ANALYTICS_DEV === 'true';
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && !enableDev) {
      return;
    }
    // Grabs user from supabase auth
    const { data: { session } } = await supabase.auth.getSession();
    const user_id = session?.user?.id;
    
    // Map to existing DB columns: event_type and payload
    // Cast to any to bypass outdated TypeScript types
    await supabase.from('analytics_events').insert({
      user_id,
      event_type: `${payload.event_category}:${payload.event_name}`,
      payload: {
        event_name: payload.event_name,
        event_category: payload.event_category,
        event_data: payload.event_data ?? {},
        page_url: payload.page_url ?? window.location.pathname,
        user_agent: navigator.userAgent,
      } as Json,
    } as any);
  } catch (error) {
    console.warn("Analytics event not tracked:", error);
  }
}

