// Create Stripe Checkout Session Edge Function
// Called by frontend redirectToCheckout() to start payment flow

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const DEFAULT_APP_ORIGIN = 'https://automationinsights.app';
const LOCAL_DEV_PREFIXES = ['http://localhost:', 'http://127.0.0.1:', 'https://localhost:', 'https://127.0.0.1:'];

function normalizeOrigin(value?: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function allowedOrigins(): string[] {
  const configured = [
    Deno.env.get('APP_URL'),
    ...(Deno.env.get('CHECKOUT_ALLOWED_ORIGINS') || '').split(','),
    DEFAULT_APP_ORIGIN,
  ];

  return configured
    .map((value) => normalizeOrigin(value?.trim()))
    .filter((value): value is string => Boolean(value));
}

function isOriginAllowed(origin: string): boolean {
  if (LOCAL_DEV_PREFIXES.some((prefix) => origin.startsWith(prefix))) return true;
  return allowedOrigins().includes(origin);
}

function resolveReturnOrigin(req: Request): string {
  const requestOrigin = normalizeOrigin(req.headers.get('origin'));
  if (requestOrigin) {
    if (!isOriginAllowed(requestOrigin)) {
      throw new Error('Origin not allowed for checkout redirect');
    }
    return requestOrigin;
  }

  return normalizeOrigin(Deno.env.get('APP_URL')) || DEFAULT_APP_ORIGIN;
}

function buildCorsHeaders(req: Request): Record<string, string> {
  const requestOrigin = normalizeOrigin(req.headers.get('origin'));
  const allowOrigin = requestOrigin && isOriginAllowed(requestOrigin) ? requestOrigin : 'null';
  return { ...corsHeaders, 'Access-Control-Allow-Origin': allowOrigin };
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

serve(async (req) => {
  const responseHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    if (responseHeaders['Access-Control-Allow-Origin'] === 'null' && req.headers.get('origin')) {
      return new Response(null, { status: 403, headers: responseHeaders });
    }
    return new Response(null, { headers: responseHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const body = await req.json();
    const packageId = typeof body?.package_id === 'string' ? body.package_id : null;
    const requestId = body?.request_id;
    const priceId = typeof body?.priceId === 'string' ? body.priceId : null;
    const requestedUserId = typeof body?.userId === 'string' ? body.userId : null;
    const requestedTier = typeof body?.tier === 'string' ? body.tier : null;
    const requestedBillingPeriod = body?.billingPeriod === 'year' ? 'year' : 'month';

    const configuredStarterPriceId = Deno.env.get('STRIPE_STARTER_PRICE_ID');
    const pilotPackage = packageId === 'starter' && configuredStarterPriceId
      ? {
        packageId,
        priceId: configuredStarterPriceId,
        credits: 5,
      }
      : null;

    if (packageId === 'starter' && !configuredStarterPriceId) {
      throw new Error('STRIPE_STARTER_PRICE_ID is not configured for the coach pilot');
    }

    if (packageId && !pilotPackage) {
      throw new Error('Unsupported coach pilot package');
    }
    if (packageId && !isUuid(requestId)) {
      throw new Error('request_id must be a valid UUID');
    }

    // Subscription price IDs are still supported by the separate legacy route,
    // but a credit price can no longer be selected by sending a raw priceId.
    const subscriptionPriceMap: Record<string, { tier: string; billingPeriod: 'month' | 'year' }> = {
      'price_1SzAwBCDRnHqUTRJY78xxjKY': { tier: 'defender', billingPeriod: 'month' },
      'price_1SzAwBCDRnHqUTRJ7vMvAN28': { tier: 'defender', billingPeriod: 'year' },
      'price_1SzAwCCDRnHqUTRJdPZaLEGn': { tier: 'coach', billingPeriod: 'month' },
      'price_1SzAwCCDRnHqUTRJIbQ7YlJe': { tier: 'coach', billingPeriod: 'year' },
    };

    if (!pilotPackage) {
      if (!priceId || !requestedTier) {
        throw new Error('package_id/request_id or validated subscription fields are required');
      }
      const subscriptionMapping = subscriptionPriceMap[priceId];
      if (!subscriptionMapping || subscriptionMapping.tier !== requestedTier || subscriptionMapping.billingPeriod !== requestedBillingPeriod) {
        throw new Error('Subscription price is not valid for the requested tier and billing period');
      }
    }

    // Verify the caller from the Supabase JWT. Do not trust client-supplied user ids.
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    if (!packageId && requestedUserId && requestedUserId !== user.id) {
      throw new Error('Checkout user mismatch');
    }

    const userId = user.id;

    if (pilotPackage) {
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('pilot_participants')
        .select('active, country, terms_version, terms_hash')
        .eq('user_id', userId)
        .single();

      if (enrollmentError || !enrollment?.active || !['US', 'CA'].includes(enrollment.country)) {
        throw new Error('Active coach pilot enrollment is required before checkout');
      }

      const { data: terms, error: termsError } = await supabase
        .from('pilot_terms_versions')
        .select('status, content_hash')
        .eq('version', enrollment.terms_version)
        .single();

      if (
        termsError
        || terms?.status !== 'approved'
        || typeof terms.content_hash !== 'string'
        || typeof enrollment.terms_hash !== 'string'
        || terms.content_hash.toLowerCase() !== enrollment.terms_hash.toLowerCase()
      ) {
        throw new Error('Coach pilot terms are not approved for checkout');
      }

      // Fulfillment locks user_profiles, so fail before creating a Stripe
      // session if the account cannot receive the purchased lot.
      const { data: creditProfile, error: creditProfileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .single();
      if (creditProfileError || !creditProfile) {
        throw new Error('Report credit profile is not ready for coach pilot checkout');
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    // Check if user already has a Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    let customerId = existingSubscription?.stripe_customer_id;

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email || undefined,
        metadata: {
          supabase_user_id: userId,
        },
      });
      customerId = customer.id;
    }

    // Determine success/cancel URLs from an allowlisted browser origin or APP_URL.
    const origin = resolveReturnOrigin(req);

    if (pilotPackage) {
      const checkoutOptions = isUuid(requestId)
        ? { idempotencyKey: `coach-checkout:${userId}:${requestId}` }
        : undefined;
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        client_reference_id: userId,
        mode: 'payment',
        line_items: [
          {
            price: pilotPackage.priceId,
            quantity: 1,
          },
        ],
        metadata: {
          type: 'credit_purchase',
          packageId: pilotPackage.packageId,
          supabase_user_id: userId,
        },
        success_url: `${origin}/dashboard?checkout=credit_success&package=${pilotPackage.packageId}`,
        cancel_url: `${origin}/for-coaches?checkout=cancelled`,
        allow_promotion_codes: true,
      }, checkoutOptions);

      return new Response(
        JSON.stringify({ sessionId: session.id, url: session.url }),
        {
          headers: { ...responseHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Create subscription checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: userId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        type: 'subscription',
        tier: requestedTier,
        billingPeriod: requestedBillingPeriod,
        supabase_user_id: userId,
      },
      success_url: `${origin}/dashboard?checkout=success&tier=${requestedTier}`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      tax_id_collection: { enabled: true },
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const message = error instanceof Error ? error.message : 'Unable to create checkout session';
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
