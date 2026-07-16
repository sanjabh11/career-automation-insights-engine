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

    const {
      priceId,
      userId: requestedUserId,
      tier,
      billingPeriod,
      packageId,
      credits,
    } = await req.json();

    const isCreditPurchase = Boolean(packageId || credits);
    if (!priceId || (!isCreditPurchase && !tier)) {
      throw new Error('priceId and tier are required');
    }
    if (isCreditPurchase && (!packageId || !credits)) {
      throw new Error('priceId, packageId, and credits are required');
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

    if (requestedUserId && requestedUserId !== user.id) {
      throw new Error('Checkout user mismatch');
    }

    const userId = user.id;

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

    if (isCreditPurchase) {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        client_reference_id: userId,
        mode: 'payment',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          type: 'credit_purchase',
          packageId,
          credits: String(credits),
          supabase_user_id: userId,
        },
        success_url: `${origin}/dashboard?checkout=credit_success&credits=${credits}`,
        cancel_url: `${origin}/for-coaches?checkout=cancelled`,
        allow_promotion_codes: true,
      });

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
        tier,
        billingPeriod: billingPeriod || 'month',
        supabase_user_id: userId,
      },
      success_url: `${origin}/dashboard?checkout=success&tier=${tier}`,
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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
