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

serve(async (req) => {
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
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`Processing event: ${event.type}`);

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

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
    await supabase
      .from('payment_transactions')
      .insert({
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
      });

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

  // Create initial subscription record
  const tier = session.metadata?.tier || 'explorer';

  const { error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: clientReferenceId,
      tier,
      status: 'active',
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      metadata: session.metadata || {},
    });

  if (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }

  console.log(`Checkout completed for user: ${clientReferenceId}, tier: ${tier}`);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getTierFromPrice(subscription: Stripe.Subscription): string {
  const priceId = subscription.items.data[0]?.price.id;

  // Map Stripe price IDs to tiers
  // Update these when real Stripe price IDs are created in the Stripe Dashboard
  const priceToTierMap: Record<string, string> = {
    'price_defender_monthly': 'defender',
    'price_defender_annual': 'defender',
    'price_coach_monthly': 'coach',
    'price_coach_annual': 'coach',
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
