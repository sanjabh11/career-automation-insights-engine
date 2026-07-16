import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      throw new Error('Origin not allowed for credit checkout redirect');
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
      return new Response('forbidden', { status: 403, headers: responseHeaders });
    }
    return new Response('ok', { headers: responseHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    const { priceId, userId: requestedUserId, packageId, credits } = await req.json();

    if (!priceId || !packageId || !credits) {
      throw new Error('priceId, packageId, and credits are required');
    }

    // Verify the caller from the Supabase JWT. Do not trust client-supplied user ids.
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase service credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
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
      throw new Error('Credit checkout user mismatch');
    }

    const userId = user.id;
    const email = user.email || '';

    // Find or create Stripe customer
    let customerId: string;
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
    }

    const origin = resolveReturnOrigin(req);

    // Create one-time payment checkout session
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
      { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error creating credit checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...responseHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
