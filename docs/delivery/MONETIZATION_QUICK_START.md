# ⚡ Monetization Quick Start Checklist

**Goal:** Start generating revenue in 2-3 weeks  
**Difficulty:** Intermediate  
**Time Required:** 10-15 hours total

---

## 📋 PRE-FLIGHT CHECKLIST

Before you start, make sure you have:

- [ ] Supabase project with admin access
- [ ] Stripe account (can use test mode initially)
- [ ] Access to deploy Edge Functions
- [ ] Existing user base (even 10-20 users is fine)
- [ ] 10-15 hours over next 2 weeks

---

## 🚀 WEEK 1: INFRASTRUCTURE (5-6 hours)

### Day 1: Database Setup (1 hour)

```bash
# 1. Apply migration
cd /Users/sanjayb/Documents/newrepo/career-automation-insights-engine
supabase db push

# 2. Verify in Supabase Dashboard → SQL Editor
SELECT COUNT(*) FROM subscription_plans;
# Should return: 3

# 3. Check existing users assigned to free plan
SELECT COUNT(*) FROM profiles WHERE current_plan_id IS NOT NULL;
```

**✅ Success:** 3 plans exist, all users on free plan

---

### Day 2: Stripe Setup (2-3 hours)

```bash
# 1. Create Stripe account at stripe.com
# Use TEST MODE initially

# 2. Create products in Stripe Dashboard:
# - Pro Monthly: $29/month
# - Pro Yearly: $290/year  
# - Enterprise Monthly: $99/month

# 3. Copy Price IDs (start with price_)

# 4. Update database
```

```sql
-- Run in Supabase SQL Editor
UPDATE subscription_plans
SET 
  stripe_price_id_monthly = 'price_YOUR_PRO_MONTHLY_ID',
  stripe_price_id_yearly = 'price_YOUR_PRO_YEARLY_ID'
WHERE name = 'pro';

UPDATE subscription_plans
SET stripe_price_id_monthly = 'price_YOUR_ENTERPRISE_ID'
WHERE name = 'enterprise';
```

```bash
# 5. Add Stripe keys to .env
echo "VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY" >> .env
echo "STRIPE_SECRET_KEY=sk_test_YOUR_KEY" >> .env

# 6. Set Supabase secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY
```

**✅ Success:** Stripe products created, keys configured

---

### Day 3: Deploy Edge Functions (1-2 hours)

```bash
# 1. Copy Edge Function code from implementation guide
# Files needed:
# - supabase/functions/create-checkout-session/index.ts
# - supabase/functions/stripe-webhook/index.ts
# - supabase/functions/create-billing-portal-session/index.ts

# 2. Deploy functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy create-billing-portal-session

# 3. Configure Stripe webhook
# URL: https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook
# Events: checkout.session.completed, customer.subscription.*

# 4. Add webhook secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

**✅ Success:** 3 functions deployed, webhook configured

---

### Day 4: Test Stripe Integration (1 hour)

```bash
# 1. Test checkout (use test card 4242 4242 4242 4242)
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-checkout-session \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "planName": "pro",
    "billingCycle": "monthly",
    "successUrl": "http://localhost:5173/dashboard",
    "cancelUrl": "http://localhost:5173/pricing"
  }'

# 2. Complete checkout in browser
# 3. Verify subscription in database
```

```sql
SELECT * FROM user_subscriptions WHERE status = 'active';
```

**✅ Success:** Test subscription created successfully

---

## 🎨 WEEK 2: UI INTEGRATION (4-5 hours)

### Day 5: Add Pricing Page (1 hour)

```typescript
// 1. Add route in src/App.tsx or router config
import { PricingPage } from '@/components/monetization/PricingPage';

<Route path="/pricing" element={<PricingPage />} />

// 2. Add navigation link
<Link to="/pricing">
  <Button variant="ghost">Pricing</Button>
</Link>

// 3. Test at http://localhost:5173/pricing
```

**✅ Success:** Pricing page accessible and renders correctly

---

### Day 6: Add Subscription Manager (1 hour)

```typescript
// 1. Add to user dashboard
import { SubscriptionManager } from '@/components/monetization/SubscriptionManager';

// In UserDashboard.tsx or EnhancedUserDashboard.tsx
<TabsContent value="subscription">
  <SubscriptionManager />
</TabsContent>

// 2. Add tab
<TabsList>
  <TabsTrigger value="subscription">Subscription</TabsTrigger>
</TabsList>

// 3. Test: Sign in → Dashboard → Subscription tab
```

**✅ Success:** Subscription manager shows current plan and usage

---

### Day 7: Add Usage Limits (2-3 hours)

```typescript
// 1. Create hook: src/hooks/useUsageLimit.ts
// (Copy from implementation guide)

// 2. Add to APO analysis component
import { useUsageLimit } from '@/hooks/useUsageLimit';

const { canUse, checkLimit, trackUsage, setShowModal, UsageLimitModal } = 
  useUsageLimit('apo_analysis');

const handleAnalyze = async () => {
  const allowed = await checkLimit();
  if (!allowed) {
    setShowModal(true);
    return;
  }
  
  // ... existing analysis code ...
  
  await trackUsage();
};

// 3. Render modal
return (
  <>
    {/* existing UI */}
    <UsageLimitModal />
  </>
);
```

**✅ Success:** Modal appears after 3 analyses on free plan

---

## 🧪 WEEK 3: TESTING & LAUNCH (1-2 hours)

### Day 8: End-to-End Testing (1 hour)

**Test Scenario 1: Free User Upgrade**
1. [ ] Create new account
2. [ ] Perform 3 APO analyses
3. [ ] Attempt 4th analysis
4. [ ] Verify modal appears
5. [ ] Click "Upgrade to Pro"
6. [ ] Complete checkout (test card)
7. [ ] Verify unlimited access

**Test Scenario 2: Subscription Management**
1. [ ] Go to dashboard → Subscription
2. [ ] Verify shows "Pro" plan
3. [ ] Check usage shows "Unlimited"
4. [ ] Click "Manage Billing"
5. [ ] Verify Stripe portal opens
6. [ ] Test cancel subscription
7. [ ] Verify reverted to Free plan

**Test Scenario 3: Webhook Events**
1. [ ] Subscribe to Pro
2. [ ] Check Supabase logs for webhook
3. [ ] Verify subscription record created
4. [ ] Cancel subscription in Stripe
5. [ ] Verify webhook processed
6. [ ] Verify user downgraded to Free

**✅ Success:** All 3 scenarios pass

---

### Day 9: Launch Preparation (1 hour)

```bash
# 1. Switch Stripe to LIVE mode
# - Stripe Dashboard → Developers → Toggle to Live
# - Update .env with live keys (pk_live_, sk_live_)
# - Redeploy Edge Functions with live keys

# 2. Create launch email
```

**Email Template:**
```
Subject: Introducing Pro Plans - Unlimited Career Insights

Hi [Name],

We're excited to announce our new Pro subscription plans!

🎯 What's New:
- Unlimited APO analyses
- Unlimited AI coach access
- Priority support
- Advanced analytics

💰 Special Launch Offer:
Get 20% off your first month with code LAUNCH20

[Upgrade to Pro →]

Questions? Reply to this email.

Best,
[Your Name]
```

```bash
# 3. Update homepage
# - Add pricing CTA
# - Add "Upgrade" button in navigation
# - Add testimonials (if available)

# 4. Monitor checklist
# - Stripe Dashboard open
# - Supabase logs monitoring
# - Email ready to respond
```

**✅ Success:** Ready to send launch email

---

### Day 10: Go Live! (Ongoing)

```bash
# 1. Send launch email to existing users

# 2. Monitor first 24 hours
# - Check Stripe for payments
# - Respond to support emails within 2 hours
# - Fix any bugs immediately

# 3. Track metrics
```

```sql
-- Active subscriptions
SELECT 
  sp.display_name,
  COUNT(*) as count,
  SUM(sp.price_monthly) as mrr
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.status = 'active'
GROUP BY sp.display_name, sp.price_monthly;

-- Conversion rate
SELECT 
  COUNT(DISTINCT CASE WHEN current_plan_id != (SELECT id FROM subscription_plans WHERE name = 'free') THEN id END) * 100.0 / COUNT(*) as conversion_rate
FROM profiles;
```

**✅ Success:** First paying customer! 🎉

---

## 📊 SUCCESS METRICS

### Week 1 Goals
- [ ] Database migration applied
- [ ] Stripe configured
- [ ] Edge Functions deployed
- [ ] Test payment successful

### Week 2 Goals
- [ ] Pricing page live
- [ ] Subscription manager working
- [ ] Usage limits enforced
- [ ] All tests passing

### Week 3 Goals
- [ ] Launch email sent
- [ ] First paying customer
- [ ] $100+ MRR
- [ ] <5% churn

---

## 🚨 TROUBLESHOOTING

### Issue: TypeScript errors in SubscriptionManager
**Fix:** Database migration not applied yet. Run `supabase db push`

### Issue: Stripe checkout fails
**Fix:** Verify price IDs in database match Stripe Dashboard

### Issue: Webhook not receiving events
**Fix:** Check webhook URL and secret in Stripe Dashboard

### Issue: Usage limits not enforcing
**Fix:** Verify RPC functions exist: `SELECT * FROM pg_proc WHERE proname LIKE '%usage%'`

---

## 📈 AFTER LAUNCH

### Week 4-5: Optimize
- [ ] A/B test pricing ($19 vs $29 vs $39)
- [ ] Add testimonials to pricing page
- [ ] Create comparison chart
- [ ] Implement referral system

### Week 6-8: Scale
- [ ] Launch affiliate program
- [ ] Create case studies
- [ ] Add annual billing discount
- [ ] Target enterprise customers

---

## 💡 TIPS FOR SUCCESS

1. **Start small** - Launch with basic paywall, iterate based on feedback
2. **Monitor closely** - Check Stripe daily for first week
3. **Respond fast** - Reply to support emails within 2 hours
4. **Be flexible** - Adjust pricing based on user feedback
5. **Track everything** - Use analytics to understand behavior

---

## 📞 NEED HELP?

**Documentation:**
- Full Analysis: `MONETIZATION_STRATEGY_ANALYSIS.md`
- Implementation Guide: `MONETIZATION_IMPLEMENTATION_GUIDE.md`
- Executive Summary: `MONETIZATION_EXECUTIVE_SUMMARY.md`

**Resources:**
- Stripe Docs: https://stripe.com/docs
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: Create issue for technical problems

---

## ✅ FINAL CHECKLIST

Before you consider this "done":

- [ ] Database migration applied and verified
- [ ] Stripe products created with correct pricing
- [ ] Edge Functions deployed and tested
- [ ] Webhook configured and receiving events
- [ ] Pricing page accessible and functional
- [ ] Subscription manager showing correct data
- [ ] Usage limits enforcing correctly
- [ ] Test payment completed successfully
- [ ] Launch email prepared
- [ ] Monitoring dashboard set up
- [ ] Support email ready to respond

---

**🎉 Congratulations! You're ready to start monetizing your app. Follow this checklist day by day, and you'll have paying customers within 2-3 weeks!**

**Timeline:**
- Week 1: Infrastructure (5-6 hours)
- Week 2: UI Integration (4-5 hours)
- Week 3: Testing & Launch (1-2 hours)
- **Total: 10-15 hours to revenue** 💰

**Next Step:** Start with Day 1 - Database Setup (1 hour)
