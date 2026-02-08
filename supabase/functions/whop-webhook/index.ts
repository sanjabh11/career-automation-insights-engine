/**
 * Whop Webhook Handler
 * Career Automation Insights Engine
 * 
 * Handles webhook events from Whop marketplace:
 * - membership.went_valid: New or renewed membership
 * - membership.went_invalid: Expired or cancelled membership
 * - payment.completed: Successful payment
 * - payment.failed: Failed payment
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createHmac } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

// Initialize Supabase client with service role for admin operations
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const whopWebhookSecret = Deno.env.get('WHOP_WEBHOOK_SECRET')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-whop-signature',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify webhook signature
    const signature = req.headers.get('x-whop-signature');
    const body = await req.text();
    
    if (!verifyWebhookSignature(body, signature, whopWebhookSecret)) {
      console.error('[Whop Webhook] Invalid signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    console.log(`[Whop Webhook] Received event: ${event.event}`);

    // Log event for audit
    const { error: logError } = await supabase
      .from('whop_webhook_events')
      .insert({
        whop_event_id: event.id || crypto.randomUUID(),
        event_type: event.event,
        whop_user_id: event.data?.user?.id,
        whop_membership_id: event.data?.membership?.id,
        whop_company_id: event.data?.company?.id,
        whop_product_id: event.data?.product?.id,
        payload: event,
        processed: false,
      });

    if (logError) {
      console.error('[Whop Webhook] Failed to log event:', logError);
    }

    // Process event based on type
    let processed = false;
    let errorMessage: string | null = null;

    try {
      switch (event.event) {
        case 'membership.went_valid':
          await handleMembershipValid(event.data);
          processed = true;
          break;

        case 'membership.went_invalid':
          await handleMembershipInvalid(event.data);
          processed = true;
          break;

        case 'membership.created':
          await handleMembershipCreated(event.data);
          processed = true;
          break;

        case 'payment.completed':
          await handlePaymentCompleted(event.data);
          processed = true;
          break;

        case 'payment.failed':
          await handlePaymentFailed(event.data);
          processed = true;
          break;

        case 'company.created':
        case 'company.updated':
          await handleCompanyUpdate(event.data);
          processed = true;
          break;

        default:
          console.log(`[Whop Webhook] Unhandled event type: ${event.event}`);
          processed = true; // Mark as processed to avoid retries
      }
    } catch (err) {
      errorMessage = err.message;
      console.error(`[Whop Webhook] Error processing ${event.event}:`, err);
    }

    // Update event log with processing status
    await supabase
      .from('whop_webhook_events')
      .update({
        processed,
        processed_at: processed ? new Date().toISOString() : null,
        error_message: errorMessage,
      })
      .eq('whop_event_id', event.id);

    return new Response(
      JSON.stringify({ received: true, processed }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[Whop Webhook] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// ============================================================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================================================

function verifyWebhookSignature(
  payload: string, 
  signature: string | null, 
  secret: string
): boolean {
  if (!signature || !secret) {
    // Allow in development if no secret configured
    if (!secret) {
      console.warn('[Whop Webhook] No WHOP_WEBHOOK_SECRET configured - skipping verification');
      return true;
    }
    return false;
  }

  try {
    // Whop uses HMAC-SHA256
    const encoder = new TextEncoder();
    const key = encoder.encode(secret);
    const data = encoder.encode(payload);
    
    // Create HMAC
    const hmac = createHmac('sha256', key);
    hmac.update(data);
    const expectedSignature = hmac.digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('[Whop Webhook] Signature verification error:', error);
    return false;
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

async function handleMembershipValid(data: any) {
  const { membership, user, company, plan } = data;
  
  console.log(`[Whop] Membership valid: ${membership?.id} for user ${user?.id}`);

  // Map plan to tier
  const tier = mapPlanToTier(plan?.internal_notes || plan?.renewal_product_id);

  // Process membership using stored procedure
  const { error } = await supabase.rpc('process_whop_membership', {
    p_whop_membership_id: membership?.id,
    p_whop_user_id: user?.id,
    p_whop_company_id: company?.id,
    p_whop_plan_id: plan?.id,
    p_tier: tier,
    p_valid: true,
    p_status: 'active',
    p_license_key: membership?.license_key,
    p_expires_at: membership?.expires_at,
    p_email: user?.email,
  });

  if (error) {
    console.error('[Whop] Failed to process membership:', error);
    throw error;
  }
}

async function handleMembershipInvalid(data: any) {
  const { membership, user, company } = data;
  
  console.log(`[Whop] Membership invalid: ${membership?.id} for user ${user?.id}`);

  // Update membership to invalid
  const { error } = await supabase
    .from('whop_memberships')
    .update({
      valid: false,
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('whop_membership_id', membership?.id);

  if (error) {
    console.error('[Whop] Failed to invalidate membership:', error);
    throw error;
  }

  // Update profile
  await supabase
    .from('profiles')
    .update({
      whop_membership_valid: false,
      whop_tier: 'free',
      updated_at: new Date().toISOString(),
    })
    .eq('whop_user_id', user?.id);
}

async function handleMembershipCreated(data: any) {
  const { membership, user, company, plan } = data;
  
  console.log(`[Whop] Membership created: ${membership?.id} for user ${user?.id}`);

  const tier = mapPlanToTier(plan?.internal_notes || plan?.renewal_product_id);

  // Ensure community exists
  await ensureCommunityExists(company);

  // Process the new membership
  await supabase.rpc('process_whop_membership', {
    p_whop_membership_id: membership?.id,
    p_whop_user_id: user?.id,
    p_whop_company_id: company?.id,
    p_whop_plan_id: plan?.id,
    p_tier: tier,
    p_valid: membership?.valid ?? true,
    p_status: 'active',
    p_license_key: membership?.license_key,
    p_expires_at: membership?.expires_at,
    p_email: user?.email,
  });
}

async function handlePaymentCompleted(data: any) {
  const { payment, membership, user } = data;
  
  console.log(`[Whop] Payment completed: ${payment?.id} for membership ${membership?.id}`);

  // Payment is recorded in Whop - we just need to ensure membership is active
  if (membership) {
    await supabase
      .from('whop_memberships')
      .update({
        valid: true,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('whop_membership_id', membership.id);

    await supabase
      .from('profiles')
      .update({
        whop_membership_valid: true,
        updated_at: new Date().toISOString(),
      })
      .eq('whop_user_id', user?.id);
  }
}

async function handlePaymentFailed(data: any) {
  const { payment, membership, user } = data;
  
  console.log(`[Whop] Payment failed: ${payment?.id} for membership ${membership?.id}`);

  // Update membership status
  if (membership) {
    await supabase
      .from('whop_memberships')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('whop_membership_id', membership.id);
  }

  // TODO: Send notification to user about failed payment
}

async function handleCompanyUpdate(data: any) {
  const { company } = data;
  
  console.log(`[Whop] Company update: ${company?.id}`);

  await ensureCommunityExists(company);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapPlanToTier(planIdentifier: string | null): string {
  if (!planIdentifier) return 'free';
  
  const lower = planIdentifier.toLowerCase();
  
  if (lower.includes('enterprise') || lower.includes('business')) {
    return 'enterprise';
  }
  if (lower.includes('pro') || lower.includes('premium')) {
    return 'pro';
  }
  return 'free';
}

async function ensureCommunityExists(company: any) {
  if (!company?.id) return;

  const { data: existing } = await supabase
    .from('whop_communities')
    .select('id')
    .eq('whop_company_id', company.id)
    .single();

  if (!existing) {
    await supabase
      .from('whop_communities')
      .insert({
        whop_company_id: company.id,
        name: company.title || company.name || 'Unnamed Community',
        description: company.description,
        owner_whop_user_id: company.owner?.id,
        settings: {},
      });
  } else {
    // Update existing
    await supabase
      .from('whop_communities')
      .update({
        name: company.title || company.name,
        description: company.description,
        updated_at: new Date().toISOString(),
      })
      .eq('whop_company_id', company.id);
  }
}
