
// Supabase does not export the Json type, so we define it here:
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/posthog";

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
  const eventType = payload.event_name.trim();
  if (!eventType) return;

  const pageUrl = payload.page_url ?? (typeof window !== "undefined" ? window.location.pathname : "");
  const eventPayload = sanitizeAnalyticsPayload({
    category: payload.event_category,
    data: payload.event_data ?? {},
    page_url: pageUrl,
  });

  trackEvent(eventType, eventPayload as Record<string, unknown>);

  try {
    // In local dev, skip analytics unless explicitly enabled
    const enableDev = import.meta.env.VITE_ENABLE_ANALYTICS_DEV === 'true';
    const isDevBuild = import.meta.env.DEV;

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

    // Match public.analytics_events(event_type, payload) from the baseline migration.
    await supabase.from('analytics_events').insert({
      user_id,
      event_type: eventType,
      payload: {
        ...eventPayload,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        tracked_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.warn("Analytics event not tracked:", error);
  }
}

function sanitizeAnalyticsPayload(value: Json): Json {
  if (typeof value === "string") {
    return value
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email-redacted]")
      .slice(0, 500);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 25).map(sanitizeAnalyticsPayload);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 50)
        .map(([key, nestedValue]) => [key, sanitizeAnalyticsPayload(nestedValue)])
    );
  }

  return value;
}
