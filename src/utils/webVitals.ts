// Utility to report web-vitals to analytics or logging endpoint
import { ReportHandler } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';

export function reportWebVitals(onPerfEntry?: ReportHandler) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then((mod) => {
      const getCLS = mod.getCLS || (mod.default && mod.default.getCLS);
      const getFID = mod.getFID || (mod.default && mod.default.getFID);
      const getFCP = mod.getFCP || (mod.default && mod.default.getFCP);
      const getLCP = mod.getLCP || (mod.default && mod.default.getLCP);
      const getTTFB = mod.getTTFB || (mod.default && mod.default.getTTFB);
      if (getCLS && getFID && getFCP && getLCP && getTTFB) {
        getCLS(onPerfEntry);
        getFID(onPerfEntry);
        getFCP(onPerfEntry);
        getLCP(onPerfEntry);
        getTTFB(onPerfEntry);
      } else {
        console.warn('web-vitals functions not found. Please check your web-vitals package version.');
      }
    }).catch((err) => {
      console.error('Failed to load web-vitals:', err);
    });
  }
}

// Send metrics to Supabase web_vitals table
export const persistWebVitals: ReportHandler = async (metric) => {
  try {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id ?? null;
    const navigationType = (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type;
    const { error } = await supabase.from('web_vitals').insert({
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
