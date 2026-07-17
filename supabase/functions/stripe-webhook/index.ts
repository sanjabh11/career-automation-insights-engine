// Stripe Webhook Handler for Career Automation Insights Engine
// Handles subscription lifecycle events from Stripe

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const configuredStarterPriceId = Deno.env.get('STRIPE_STARTER_PRICE_ID');
const PILOT_CREDIT_PRICE_IDS: Record<string, string> = configuredStarterPriceId
  ? { starter: configuredStarterPriceId }
  : {};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  let claimedEventId: string | null = null;
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      const message = getErrorMessage(err, 'Invalid webhook signature');
      return new Response(`Webhook Error: ${message}`, { status: 400 });
    }

    console.log(`Processing event: ${event.type}`);

    // Claim before doing any side effects. The database lease allows Stripe to
    // retry a failed event while preventing concurrent duplicate fulfillment.
    const payloadHash = await sha256Hex(body);
    const { data: claim, error: claimError } = await supabase.rpc('claim_stripe_webhook_event', {
      p_event_id: event.id,
      p_event_type: event.type,
      p_payload_hash: payloadHash,
    });

    if (claimError) {
      throw new Error(`Webhook event claim failed: ${claimError.message}`);
    }

    if (!claim?.claimed) {
      if (claim?.status === 'processed' || claim?.status === 'processing') {
        console.log(`Event ${event.id} is already ${claim.status} — skipping duplicate delivery`);
        return new Response(JSON.stringify({ received: true, idempotent: true, status: claim.status }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      if (claim?.status === 'payload_conflict') {
        return new Response(JSON.stringify({ received: false, error: 'Webhook payload conflict' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      throw new Error(`Webhook event could not be claimed: ${claim?.status || 'unknown'}`);
    }

    claimedEventId = event.id;

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    const { data: markedProcessed, error: markError } = await supabase.rpc('mark_stripe_webhook_event', {
      p_event_id: event.id,
      p_status: 'processed',
      p_error: null,
    });

    if (markError || markedProcessed !== true) {
      throw new Error(`Webhook event completion could not be recorded: ${markError?.message || 'unknown error'}`);
    }

    claimedEventId = null;
    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const message = getErrorMessage(error, 'Unable to process webhook');
    console.error('Error processing webhook:', error);

    if (claimedEventId) {
      const { error: markFailedError } = await supabase.rpc('mark_stripe_webhook_event', {
        p_event_id: claimedEventId,
        p_status: 'failed',
        p_error: message.slice(0, 1000),
      });
      if (markFailedError) {
        console.error('Failed to record webhook failure:', markFailedError);
      }
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  // Get tier from subscription metadata or price
  const tier = subscription.metadata?.tier || getTierFromPrice(subscription);

  // Find user by Stripe customer ID
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!existingSubscription) {
    console.error(`No subscription found for customer: ${customerId}`);
    return;
  }

  // Update subscription in database
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: existingSubscription.user_id,
      tier,
      status: mapStripeStatus(status),
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_subscription_id',
    });

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  // Update user profile tier
  await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_expires_at: currentPeriodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', existingSubscription.user_id);

  console.log(`Subscription updated for user: ${existingSubscription.user_id}, tier: ${tier}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id;

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }

  // Update user profile to free tier
  const { data: subscription_data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (subscription_data) {
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', subscription_data.user_id);

    console.log(`Subscription cancelled for user: ${subscription_data.user_id}`);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const amount = invoice.amount_paid / 100; // Convert cents to dollars
  const subscriptionId = invoice.subscription as string;

  // Record payment transaction
  const { data: subscription_data } = await supabase
    .from('subscriptions')
    .select('user_id, tier')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (subscription_data) {
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .upsert({
        user_id: subscription_data.user_id,
        transaction_type: 'subscription',
        amount,
        currency: invoice.currency.toUpperCase(),
        status: 'succeeded',
        stripe_payment_intent_id: invoice.payment_intent as string,
        stripe_invoice_id: invoice.id,
        description: `${subscription_data.tier} subscription payment`,
        metadata: {
          subscription_id: subscriptionId,
          period_start: invoice.period_start,
          period_end: invoice.period_end,
        },
      }, { onConflict: 'stripe_payment_intent_id' });

    if (transactionError) {
      throw new Error(`Subscription payment transaction could not be recorded: ${transactionError.message}`);
    }

    console.log(`Payment succeeded for user: ${subscription_data.user_id}, amount: $${amount}`);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  // Update subscription status to past_due
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  if (error) {
    console.error('Error updating subscription to past_due:', error);
  }

  // TODO: Send notification to user about failed payment
  console.log(`Payment failed for subscription: ${subscriptionId}`);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const clientReferenceId = session.client_reference_id; // user_id

  if (!clientReferenceId) {
    console.error('No client_reference_id in checkout session');
    return;
  }

  if (session.metadata?.type === 'credit_purchase') {
    await handleCreditPurchaseCheckout(session, clientReferenceId);
    return;
  }

  if (!subscriptionId) {
    console.error('No subscription id in checkout session');
    return;
  }

  // Create initial subscription record
  const tier = session.metadata?.tier || 'explorer';

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: clientReferenceId,
      tier,
      status: 'active',
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      metadata: session.metadata || {},
    }, { onConflict: 'stripe_subscription_id' });

  if (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }

  console.log(`Checkout completed for user: ${clientReferenceId}, tier: ${tier}`);
}

async function handleCreditPurchaseCheckout(session: Stripe.Checkout.Session, userId: string) {
  if (session.payment_status !== 'paid') {
    throw new Error('Credit purchase checkout is not paid');
  }

  const packageId = session.metadata?.packageId || '';
  const expectedPriceId = PILOT_CREDIT_PRICE_IDS[packageId];
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;
  const amount = typeof session.amount_total === 'number' ? session.amount_total / 100 : 0;

  if (!expectedPriceId || !paymentIntentId) {
    throw new Error('Credit purchase is missing a supported package or payment intent');
  }

  if (session.metadata?.supabase_user_id && session.metadata.supabase_user_id !== userId) {
    throw new Error('Credit purchase user mismatch');
  }

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
  const purchasedPriceId = lineItems.data[0]?.price?.id;
  if (purchasedPriceId !== expectedPriceId) {
    throw new Error('Credit purchase price does not match the published coach package');
  }

  const { data: creditResult, error: creditError } = await supabase.rpc('fulfill_report_credit_purchase', {
    p_user_id: userId,
    p_package_id: packageId,
    p_stripe_payment_intent_id: paymentIntentId,
    p_description: `Stripe ${packageId} report credit purchase`,
  });

  if (creditError || !creditResult?.success) {
    console.error('Error adding report credits:', creditError || creditResult?.error);
    throw new Error(creditError?.message || creditResult?.error || 'Credit fulfillment failed');
  }

  const { error: transactionError } = await supabase
    .from('payment_transactions')
    .upsert({
      user_id: userId,
      transaction_type: 'one_time',
      amount,
      currency: (session.currency || 'usd').toUpperCase(),
      status: 'succeeded',
      stripe_payment_intent_id: paymentIntentId,
      description: `${creditResult.credits_added} report credits purchased`,
      metadata: {
        checkout_session_id: session.id,
        package_id: packageId,
        credits: creditResult.credits_added,
        stripe_customer_id: session.customer,
      },
    }, { onConflict: 'stripe_payment_intent_id' });

  if (transactionError) {
    console.error('Error recording credit purchase transaction:', transactionError);
    throw transactionError;
  }

  console.log(`Credit purchase completed for user: ${userId}, credits: ${creditResult.credits_added}, package: ${packageId}`);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getTierFromPrice(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price.id;

  // Map real Stripe price IDs to tiers (PRICE-3 fix: was using placeholders)
  const priceToTierMap: Record<string, string> = {
    'price_1SzAwBCDRnHqUTRJY78xxjKY': 'defender',
    'price_1SzAwBCDRnHqUTRJ7vMvAN28': 'defender',
    'price_1SzAwCCDRnHqUTRJdPZaLEGn': 'coach',
    'price_1SzAwCCDRnHqUTRJIbQ7YlJe': 'coach',
    // Legacy mappings for backward compatibility
    'price_explorer': 'free',
    'price_navigator': 'defender',
    'price_strategist': 'coach',
  };

  return priceToTierMap[priceId] || 'free';
}

function mapStripeStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    'active': 'active',
    'past_due': 'past_due',
    'canceled': 'cancelled',
    'unpaid': 'past_due',
    'incomplete': 'past_due',
    'incomplete_expired': 'cancelled',
    'trialing': 'trialing',
    'paused': 'paused',
  };

  return statusMap[stripeStatus] || 'cancelled';
}
