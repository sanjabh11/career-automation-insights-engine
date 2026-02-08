# 🚀 Monetization Implementation Guide

**Created:** December 8, 2025  
**Status:** HIGH PRIORITY - Ready for Implementation  
**Timeline:** 2-3 weeks to revenue

---

## 📋 EXECUTIVE SUMMARY

This guide provides step-by-step instructions to implement the freemium monetization strategy for the Career Automation Insights Engine. Based on the comprehensive analysis in `MONETIZATION_STRATEGY_ANALYSIS.md`, this focuses on **HIGH PRIORITY** items that can generate revenue within 2-3 weeks.

### What's Been Created

✅ **Database Migration** - `supabase/migrations/20251208000000_add_subscriptions.sql`
- Subscription plans table with 3 tiers (Free, Pro, Enterprise)
- User subscriptions table with Stripe integration
- Usage tracking system
- Payment history
- Helper functions for usage limits
- RLS policies for security

✅ **UI Components**
- `SubscriptionManager.tsx` - Manage subscriptions and view usage
- `PricingPage.tsx` - Public pricing comparison page
- `UsageLimitModal.tsx` - Upgrade prompt when limits reached

### What Needs to Be Done

🔧 **Database Setup** (30 minutes)
🔧 **Stripe Integration** (2-3 hours)
🔧 **Edge Functions** (4-6 hours)
🔧 **UI Integration** (2-3 hours)
🔧 **Testing & Launch** (1-2 hours)

---

## 🎯 IMPLEMENTATION STEPS

### STEP 1: Apply Database Migration (30 minutes)

#### 1.1 Run Migration

```bash
# Navigate to project root
cd /Users/sanjayb/Documents/newrepo/career-automation-insights-engine

# Apply migration using Supabase CLI
supabase db push

# Or apply manually in Supabase Dashboard
# Copy contents of supabase/migrations/20251208000000_add_subscriptions.sql
# Paste into SQL Editor and execute
```

#### 1.2 Verify Tables Created

```sql
-- Run in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'subscription_plans',
  'user_subscriptions',
  'usage_tracking',
  'payment_history'
);

-- Should return 4 rows
```

#### 1.3 Verify Default Plans

```sql
-- Check subscription plans
SELECT name, display_name, price_monthly, is_active 
FROM public.subscription_plans 
ORDER BY sort_order;

-- Should show: free ($0), pro ($29), enterprise ($99)
```

#### 1.4 Update Existing Users

```sql
-- Set all existing users to free plan
UPDATE public.profiles 
SET current_plan_id = (
  SELECT id FROM public.subscription_plans WHERE name = 'free'
)
WHERE current_plan_id IS NULL;
```

---

### STEP 2: Set Up Stripe (2-3 hours)

#### 2.1 Create Stripe Account

1. Go to https://stripe.com
2. Sign up for account (use business email)
3. Complete business verification
4. Note: Use TEST mode initially

#### 2.2 Create Products in Stripe Dashboard

**Pro Plan:**
```
Product Name: Career Insights Pro
Description: Full access to personalized career insights
Price: $29/month (recurring)
Price ID: Save this (e.g., price_1ABC123...)
```

**Pro Annual:**
```
Product Name: Career Insights Pro (Annual)
Description: Full access with annual billing
Price: $290/year (recurring)
Price ID: Save this (e.g., price_1XYZ789...)
```

**Enterprise Plan:**
```
Product Name: Career Insights Enterprise
Description: Advanced features for teams
Price: $99/month (recurring)
Price ID: Save this
```

#### 2.3 Update Database with Stripe Price IDs

```sql
-- Update Pro plan
UPDATE public.subscription_plans
SET 
  stripe_price_id_monthly = 'price_YOUR_MONTHLY_ID',
  stripe_price_id_yearly = 'price_YOUR_YEARLY_ID'
WHERE name = 'pro';

-- Update Enterprise plan
UPDATE public.subscription_plans
SET 
  stripe_price_id_monthly = 'price_YOUR_ENTERPRISE_ID',
  stripe_price_id_yearly = 'price_YOUR_ENTERPRISE_YEARLY_ID'
WHERE name = 'enterprise';
```

#### 2.4 Get Stripe API Keys

1. Go to Stripe Dashboard → Developers → API keys
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`)
4. Add to `.env`:

```env
# Add to .env file
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
```

#### 2.5 Set Supabase Secrets

```bash
# Set Stripe secret in Supabase
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY --project-ref YOUR_PROJECT_REF

# Or via Supabase Dashboard:
# Settings → Edge Functions → Add Secret
# Name: STRIPE_SECRET_KEY
# Value: sk_test_YOUR_KEY
```

---

### STEP 3: Create Edge Functions (4-6 hours)

#### 3.1 Create Checkout Session Function

Create file: `supabase/functions/create-checkout-session/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { planName, billingCycle, successUrl, cancelUrl } = await req.json();

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', planName)
      .single();

    if (planError || !plan) {
      throw new Error('Plan not found');
    }

    const priceId = billingCycle === 'yearly' 
      ? plan.stripe_price_id_yearly 
      : plan.stripe_price_id_monthly;

    if (!priceId) {
      throw new Error('Price ID not configured');
    }

    // Get or create Stripe customer
    let customerId = user.user_metadata?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Update user metadata
      await supabase.auth.updateUser({
        data: { stripe_customer_id: customerId },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: user.id,
        plan_id: plan.id,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
```

#### 3.2 Create Stripe Webhook Handler

Create file: `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log('Webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const planId = session.metadata?.plan_id;

        if (userId && planId) {
          // Create subscription record
          await supabase.from('user_subscriptions').upsert({
            user_id: userId,
            plan_id: planId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });

          // Update profile
          await supabase.from('profiles').update({
            current_plan_id: planId,
            stripe_customer_id: session.customer as string,
          }).eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase.from('user_subscriptions').update({
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        }).eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          // Revert to free plan
          const { data: freePlan } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('name', 'free')
            .single();

          if (freePlan) {
            await supabase.from('profiles').update({
              current_plan_id: freePlan.id,
            }).eq('id', userId);

            await supabase.from('user_subscriptions').update({
              status: 'canceled',
              canceled_at: new Date().toISOString(),
            }).eq('stripe_subscription_id', subscription.id);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          await supabase.from('payment_history').insert({
            user_id: userId,
            stripe_payment_intent_id: invoice.payment_intent as string,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency,
            status: 'succeeded',
            payment_method: invoice.payment_intent ? 'card' : 'other',
            description: invoice.description || 'Subscription payment',
          });
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
});
```

#### 3.3 Create Billing Portal Function

Create file: `supabase/functions/create-billing-portal-session/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.5.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { returnUrl } = await req.json();

    const customerId = user.user_metadata?.stripe_customer_id;
    if (!customerId) {
      throw new Error('No Stripe customer found');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
```

#### 3.4 Deploy Edge Functions

```bash
# Deploy all three functions
supabase functions deploy create-checkout-session --project-ref YOUR_REF
supabase functions deploy stripe-webhook --project-ref YOUR_REF
supabase functions deploy create-billing-portal-session --project-ref YOUR_REF
```

#### 3.5 Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
4. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy webhook signing secret (starts with `whsec_`)
6. Add to Supabase secrets:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET --project-ref YOUR_REF
```

---

### STEP 4: Integrate UI Components (2-3 hours)

#### 4.1 Add Pricing Page Route

Edit `src/App.tsx` or your router configuration:

```typescript
import { PricingPage } from '@/components/monetization/PricingPage';

// Add route
<Route path="/pricing" element={<PricingPage />} />
```

#### 4.2 Add Subscription Manager to Dashboard

Edit `src/components/UserDashboard.tsx` or `EnhancedUserDashboard.tsx`:

```typescript
import { SubscriptionManager } from '@/components/monetization/SubscriptionManager';

// Add tab or section
<TabsContent value="subscription">
  <SubscriptionManager />
</TabsContent>
```

#### 4.3 Add Usage Limit Checks

Create hook: `src/hooks/useUsageLimit.ts`

```typescript
import { useState, useEffect } from 'react';
import { useSession } from './useSession';
import { supabase } from '@/integrations/supabase/client';
import { UsageLimitModal } from '@/components/monetization/UsageLimitModal';

export function useUsageLimit(resourceType: string) {
  const { session } = useSession();
  const [canUse, setCanUse] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [usage, setUsage] = useState({ current: 0, limit: 0 });

  const checkLimit = async () => {
    if (!session?.user) return true;

    const { data, error } = await supabase
      .rpc('check_usage_limit', {
        p_user_id: session.user.id,
        p_resource_type: resourceType
      });

    if (error) {
      console.error('Error checking usage limit:', error);
      return true;
    }

    setCanUse(data as boolean);
    return data as boolean;
  };

  const trackUsage = async () => {
    if (!session?.user) return;

    await supabase.rpc('track_usage', {
      p_user_id: session.user.id,
      p_resource_type: resourceType,
      p_count: 1
    });
  };

  const handleUpgrade = () => {
    window.location.href = '/pricing';
  };

  return {
    canUse,
    checkLimit,
    trackUsage,
    showModal,
    setShowModal,
    usage,
    UsageLimitModal: () => (
      <UsageLimitModal
        open={showModal}
        onOpenChange={setShowModal}
        resourceType={resourceType as any}
        currentUsage={usage.current}
        limit={usage.limit}
        onUpgrade={handleUpgrade}
      />
    )
  };
}
```

#### 4.4 Add Usage Checks to APO Analysis

Edit `src/components/APODashboard.tsx` or wherever APO analysis is triggered:

```typescript
import { useUsageLimit } from '@/hooks/useUsageLimit';

function APODashboard() {
  const { canUse, checkLimit, trackUsage, setShowModal, UsageLimitModal } = 
    useUsageLimit('apo_analysis');

  const handleAnalyze = async () => {
    // Check limit before analysis
    const allowed = await checkLimit();
    if (!allowed) {
      setShowModal(true);
      return;
    }

    // Perform analysis
    // ... existing code ...

    // Track usage after successful analysis
    await trackUsage();
  };

  return (
    <>
      {/* Existing UI */}
      <UsageLimitModal />
    </>
  );
}
```

#### 4.5 Add Navigation Links

Edit `src/components/Navigation.tsx` or `SidebarContent.tsx`:

```typescript
// Add pricing link
<Link to="/pricing">
  <Button variant="ghost">Pricing</Button>
</Link>

// Add upgrade CTA for free users
{currentPlan === 'free' && (
  <Button onClick={() => navigate('/pricing')} className="w-full">
    <Zap className="h-4 w-4 mr-2" />
    Upgrade to Pro
  </Button>
)}
```

---

### STEP 5: Testing & Launch (1-2 hours)

#### 5.1 Test Stripe Integration

**Test Checkout:**
1. Use Stripe test card: `4242 4242 4242 4242`
2. Any future expiry date
3. Any CVC
4. Complete checkout flow
5. Verify subscription created in database
6. Verify webhook received

**Test Usage Limits:**
1. Create test user on free plan
2. Perform 3 APO analyses
3. Attempt 4th analysis
4. Verify modal appears
5. Click upgrade
6. Verify redirected to pricing

**Test Billing Portal:**
1. Subscribe to Pro plan (test mode)
2. Go to subscription manager
3. Click "Manage Billing"
4. Verify Stripe portal opens
5. Test cancel subscription
6. Verify reverted to free plan

#### 5.2 Launch Checklist

- [ ] Database migration applied
- [ ] Stripe products created
- [ ] Price IDs updated in database
- [ ] Edge functions deployed
- [ ] Webhook configured and tested
- [ ] UI components integrated
- [ ] Usage limits working
- [ ] Upgrade flow tested
- [ ] Cancellation flow tested
- [ ] Email existing users about new pricing
- [ ] Update homepage with pricing CTA
- [ ] Add pricing link to footer
- [ ] Monitor Stripe dashboard for first payment

---

## 📊 MONITORING & METRICS

### Key Metrics to Track

**Conversion Funnel:**
- Visitors to pricing page
- Checkout sessions started
- Successful subscriptions
- Conversion rate (target: 5-8%)

**Usage Metrics:**
- Free tier usage (approaching limits)
- Modal impressions
- Upgrade button clicks
- Time to upgrade

**Revenue Metrics:**
- MRR (Monthly Recurring Revenue)
- Churn rate (target: <3%)
- LTV (Lifetime Value)
- CAC (Customer Acquisition Cost)

### Supabase Queries for Monitoring

```sql
-- Active subscriptions by plan
SELECT 
  sp.display_name,
  COUNT(*) as subscribers,
  SUM(sp.price_monthly) as mrr
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.status = 'active'
GROUP BY sp.display_name, sp.price_monthly;

-- Usage approaching limits (potential upgrades)
SELECT 
  p.email,
  ut.resource_type,
  SUM(ut.count) as usage,
  sp.limits->ut.resource_type as limit
FROM usage_tracking ut
JOIN profiles p ON ut.user_id = p.id
JOIN subscription_plans sp ON p.current_plan_id = sp.id
WHERE ut.period_start >= DATE_TRUNC('month', NOW())
GROUP BY p.email, ut.resource_type, sp.limits
HAVING SUM(ut.count) >= (sp.limits->>ut.resource_type)::int * 0.8;

-- Revenue this month
SELECT 
  SUM(amount) as total_revenue,
  COUNT(*) as payment_count,
  AVG(amount) as avg_payment
FROM payment_history
WHERE created_at >= DATE_TRUNC('month', NOW())
AND status = 'succeeded';
```

---

## 🚨 TROUBLESHOOTING

### Common Issues

**Issue: TypeScript errors in SubscriptionManager**
- **Cause:** Database migration not applied yet
- **Fix:** Run `supabase db push` to apply migration

**Issue: Stripe webhook not receiving events**
- **Cause:** Incorrect webhook URL or secret
- **Fix:** Verify URL in Stripe dashboard, check secret in Supabase

**Issue: Usage limits not enforcing**
- **Cause:** RPC functions not created
- **Fix:** Verify migration applied, check function exists in Supabase

**Issue: Checkout session fails**
- **Cause:** Missing Stripe price IDs
- **Fix:** Update subscription_plans table with correct price IDs

---

## 📧 NEXT STEPS AFTER LAUNCH

### Week 1-2: Initial Launch
- [ ] Email existing users about new pricing
- [ ] Monitor conversion rates
- [ ] Fix any bugs reported
- [ ] Gather user feedback

### Week 3-4: Optimization
- [ ] A/B test pricing ($19 vs $29 vs $39)
- [ ] Add testimonials to pricing page
- [ ] Create comparison chart vs competitors
- [ ] Implement referral system

### Month 2: Growth
- [ ] Launch affiliate program
- [ ] Create case studies
- [ ] Add annual billing discount
- [ ] Implement usage-based pricing experiments

---

## 💡 TIPS FOR SUCCESS

1. **Start with test mode** - Use Stripe test mode until you're confident
2. **Monitor closely** - Check Stripe dashboard daily for first week
3. **Respond quickly** - Reply to support emails within 2 hours
4. **Be flexible** - Adjust pricing based on feedback
5. **Communicate clearly** - Be transparent about what's included
6. **Offer guarantees** - 14-day money-back guarantee reduces friction
7. **Track everything** - Use analytics to understand user behavior

---

## 📞 SUPPORT

**Stripe Documentation:** https://stripe.com/docs  
**Supabase Edge Functions:** https://supabase.com/docs/guides/functions  
**Questions:** Create issue in GitHub repo

---

**Ready to launch? Start with STEP 1 and work through sequentially. You can have paying customers within 2-3 weeks!** 🚀
