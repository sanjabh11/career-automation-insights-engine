// Utility to report web-vitals to analytics or logging endpoint
import type { ReportCallback } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';

type WebVitalsModule = typeof import('web-vitals');
type WebVitalsReporter = (onReport: ReportCallback) => void;
type WebVitalsCompatModule = WebVitalsModule &
  Partial<Record<'getCLS' | 'getFID' | 'getFCP' | 'getLCP' | 'getTTFB', WebVitalsReporter>>;

type WebVitalsInsertPayload = {
  user_id: string | null;
  name: string;
  value: number;
  delta: number;
  idempotency_key: string;
  navigation_type: PerformanceNavigationTiming['type'] | undefined;
  url: string;
  user_agent: string;
};

type WebVitalsInsertBuilder = {
  insert(payload: WebVitalsInsertPayload): Promise<{ error: { message?: string } | null }>;
};

type WebVitalsSupabaseClient = {
  from(table: 'web_vitals'): WebVitalsInsertBuilder;
};

const webVitalsSupabase = supabase as unknown as WebVitalsSupabaseClient;

export function reportWebVitals(onPerfEntry?: ReportCallback) {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    import('web-vitals')
      .then((mod: WebVitalsModule) => {
        const compat = mod as WebVitalsCompatModule;
        // web-vitals v5: use onINP (replaces deprecated onFID)
        const onCLS = compat.onCLS ?? compat.getCLS;
        const onINP = compat.onINP ?? compat.onFID ?? compat.getFID; // v5 uses INP instead of FID
        const onFCP = compat.onFCP ?? compat.getFCP;
        const onLCP = compat.onLCP ?? compat.getLCP;
        const onTTFB = compat.onTTFB ?? compat.getTTFB;

        // Call available metrics (INP may be undefined in older versions)
        if (onCLS) onCLS(onPerfEntry);
        if (onINP) onINP(onPerfEntry);
        if (onFCP) onFCP(onPerfEntry);
        if (onLCP) onLCP(onPerfEntry);
        if (onTTFB) onTTFB(onPerfEntry);
      })
      .catch((err) => {
        console.error('Failed to load web-vitals:', err);
      });
  }
}

// Send metrics to Supabase web_vitals table
export const persistWebVitals: ReportCallback = async (metric) => {
  try {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id ?? null;
    const navigationType = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type;
    const { error } = await webVitalsSupabase.from('web_vitals').insert({
      user_id: userId,
      name: metric.name,
      value: Number(metric.value.toFixed(3)),
      delta: Number(metric.delta?.toFixed(3) ?? 0),
      idempotency_key: metric.id,
      navigation_type: navigationType,
      url: window.location.href,
      user_agent: navigator.userAgent,
    });
    if (error) {
      // Non-fatal; log to console only
      console.warn('[WebVitals] insert error', error.message);
    }
  } catch (e) {
    console.warn('[WebVitals] persist error', e);
  }
};
