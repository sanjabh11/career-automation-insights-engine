/**
 * PostHog Analytics Integration
 * Free tier: 1M events/month
 * 
 * Setup: Set VITE_POSTHOG_KEY in .env to enable.
 * If not set, all tracking calls are no-ops.
 */

import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string) || 'https://us.i.posthog.com';

let initialized = false;

export function initPostHog(): void {
  if (initialized || !POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: '2026-01-30',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false, // manual events only for now
    persistence: 'localStorage+cookie',
  });

  initialized = true;
}

export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId, properties);
}

export function resetUser(): void {
  if (!POSTHOG_KEY) return;
  posthog.reset();
}

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

// Pre-defined event helpers for the conversion funnel
export const analytics = {
  signupStarted: () => trackEvent('signup_started'),
  signupCompleted: (method: string) => trackEvent('signup_completed', { method }),
  pricingPageViewed: (source?: string) => trackEvent('pricing_page_viewed', { source }),
  checkoutStarted: (tier: string, billingPeriod: string) =>
    trackEvent('checkout_started', { tier, billingPeriod }),
  checkoutCompleted: (tier: string) => trackEvent('checkout_completed', { tier }),
  apoCheckPerformed: (occupation: string) =>
    trackEvent('apo_check_performed', { occupation }),
  resumeAnalyzed: (riskScore: number) =>
    trackEvent('resume_analyzed', { riskScore }),
  reportGenerated: (occupation: string) =>
    trackEvent('report_generated', { occupation }),
  bridgeRoleSearched: (from: string, to: string) =>
    trackEvent('bridge_role_searched', { from, to }),
  coachesPageViewed: () => trackEvent('coaches_page_viewed'),
  seoPageViewed: (occupation: string) =>
    trackEvent('seo_page_viewed', { occupation }),
  shareClicked: (platform: string, feature: string) =>
    trackEvent('share_clicked', { platform, feature }),
  upgradePromptShown: (feature: string) =>
    trackEvent('upgrade_prompt_shown', { feature }),
  freeLimitHit: (feature: string) =>
    trackEvent('free_limit_hit', { feature }),
  activationApoResult: (occupation: string, latencyMs?: number) =>
    trackEvent('activation_apo_result_viewed', { occupation, latency_ms: latencyMs }),
  activationProofArtifact: (artifactType: string, buyerSegment: string) =>
    trackEvent('activation_proof_artifact_created', { artifact_type: artifactType, buyer_segment: buyerSegment }),
  retentionReturnVisit: (surface: string) =>
    trackEvent('retention_return_visit', { surface }),
  commercialLeadCaptured: (source: string, buyerSegment: string, persisted: boolean) =>
    trackEvent('commercial_lead_captured', { source, buyer_segment: buyerSegment, persisted }),

  // B2-5: Coach funnel analytics taxonomy (non-PII only)
  // Never include: email, client label, occupation, report ID, free-form notes
  coachLandingViewed: () => trackEvent('coach_landing_viewed'),
  coachSampleViewed: () => trackEvent('coach_sample_viewed'),
  coachPilotInterestSubmitted: () => trackEvent('coach_pilot_interest_submitted'),
  coachCheckoutStarted: () => trackEvent('coach_checkout_started'),
  coachCheckoutCompleted: () => trackEvent('coach_checkout_completed'),
  coachReportSucceeded: () => trackEvent('coach_report_succeeded'),
  coachReportRefunded: () => trackEvent('coach_report_refunded'),
  coachFeedbackSubmitted: () => trackEvent('coach_feedback_submitted'),
};

export { posthog };
