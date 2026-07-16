// Create Stripe Customer Portal Session Edge Function
// Allows subscribers to manage billing, cancel, update payment method

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
      throw new Error('Origin not allowed for portal redirect');
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

    // Get user from auth header
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Find Stripe customer ID for this user
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (!subscription?.stripe_customer_id) {
      throw new Error('No active subscription found');
    }

    const origin = resolveReturnOrigin(req);

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/dashboard`,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating portal session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...responseHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
