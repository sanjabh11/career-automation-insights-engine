import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-whop-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface WhopWebhookPayload {
  action: string;
  data: {
    id: string;
    user_id: string;
    plan_id: string;
    product_id?: string;
    access_pass?: {
      id: string;
    };
    license_key?: string;
    status: 'active' | 'past_due' | 'canceled' | 'trialing';
    valid: boolean;
    cancel_at_period_end: boolean;
    renewal_period_start?: number;
    renewal_period_end?: number;
    plan?: {
      id: string;
      name: string;
    };
    metadata?: Record<string, unknown>;
  };
}

/**
 * Verify Whop webhook signature
 * Whop signs webhooks with HMAC-SHA256
 */
async function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return signature === expectedSignature;
}

/**
 * Handle membership created event
 */
async function handleMembershipCreated(
  supabase: ReturnType<typeof createClient>,
  data: WhopWebhookPayload['data']
) {
  console.log(`Creating membership for Whop user ${data.user_id}`);

  // Find or create auth user by Whop user ID
  // In a real implementation, you'd need to map Whop user_id to Supabase auth.users
  // For now, we'll store the data and require manual user linking

  const { data: membership, error } = await supabase
    .from('whop_memberships')
    .insert({
      whop_membership_id: data.id,
      whop_user_id: data.user_id,
      whop_plan_id: data.plan_id,
      plan_name: data.plan?.name || 'Unknown Plan',
      status: data.status,
      access_pass_id: data.access_pass?.id,
      license_key: data.license_key,
      valid: data.valid,
      will_renew: !data.cancel_at_period_end,
      renewal_period_start: data.renewal_period_start
        ? new Date(data.renewal_period_start * 1000).toISOString()
        : null,
      renewal_period_end: data.renewal_period_end
        ? new Date(data.renewal_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: data.cancel_at_period_end,
      metadata: data.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating membership:', error);
    throw error;
  }

  return membership;
}

/**
 * Handle membership updated event
 */
async function handleMembershipUpdated(
  supabase: ReturnType<typeof createClient>,
  data: WhopWebhookPayload['data']
) {
  console.log(`Updating membership ${data.id}`);

  const { data: membership, error } = await supabase
    .from('whop_memberships')
    .update({
      status: data.status,
      valid: data.valid,
      will_renew: !data.cancel_at_period_end,
      renewal_period_start: data.renewal_period_start
        ? new Date(data.renewal_period_start * 1000).toISOString()
        : null,
      renewal_period_end: data.renewal_period_end
        ? new Date(data.renewal_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: data.cancel_at_period_end,
      license_key: data.license_key,
      metadata: data.metadata || {},
    })
    .eq('whop_membership_id', data.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating membership:', error);
    throw error;
  }

  return membership;
}

/**
 * Handle membership deleted/canceled event
 */
async function handleMembershipDeleted(
  supabase: ReturnType<typeof createClient>,
  data: WhopWebhookPayload['data']
) {
  console.log(`Deleting/canceling membership ${data.id}`);

  const { data: membership, error } = await supabase
    .from('whop_memberships')
    .update({
      status: 'canceled',
      valid: false,
    })
    .eq('whop_membership_id', data.id)
    .select()
    .single();

  if (error) {
    console.error('Error canceling membership:', error);
    throw error;
  }

  return membership;
}

/**
 * Log webhook event
 */
async function logWebhookEvent(
  supabase: ReturnType<typeof createClient>,
  eventType: string,
  membershipId: string,
  payload: unknown,
  processed: boolean,
  errorMessage?: string
) {
  await supabase.from('whop_webhook_logs').insert({
    event_type: eventType,
    whop_membership_id: membershipId,
    payload,
    processed,
    error_message: errorMessage,
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Get environment variables
    const webhookSecret = Deno.env.get('WHOP_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!webhookSecret) {
      throw new Error('WHOP_WEBHOOK_SECRET not configured');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Get webhook signature from header
    const signature = req.headers.get('x-whop-signature');
    const rawBody = await req.text();

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse webhook payload
    const payload: WhopWebhookPayload = JSON.parse(rawBody);
    console.log('Received webhook:', payload.action);

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result;
    let processed = true;
    let errorMessage: string | undefined;

    try {
      // Handle different webhook events
      switch (payload.action) {
        case 'membership.created':
        case 'membership.went_valid':
          result = await handleMembershipCreated(supabase, payload.data);
          break;

        case 'membership.updated':
          result = await handleMembershipUpdated(supabase, payload.data);
          break;

        case 'membership.deleted':
        case 'membership.went_invalid':
        case 'membership.canceled':
          result = await handleMembershipDeleted(supabase, payload.data);
          break;

        default:
          console.log(`Unhandled webhook event: ${payload.action}`);
          processed = false;
      }
    } catch (err) {
      processed = false;
      errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error processing webhook:', errorMessage);
    }

    // Log webhook event
    await logWebhookEvent(
      supabase,
      payload.action,
      payload.data.id,
      payload,
      processed,
      errorMessage
    );

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        processed,
        action: payload.action,
        membership_id: payload.data.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
