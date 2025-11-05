# Whop Integration Setup Guide

This guide walks you through setting up the Whop integration for membership management and payments.

## Overview

The Whop integration provides:
- **Automated subscription management** with webhook-driven sync
- **Secure payment processing** through Whop's platform
- **Tiered access control** (Free, Basic, Premium, Enterprise)
- **Real-time membership status updates**
- **Comprehensive webhook event logging**

## Prerequisites

1. A Whop account ([Sign up at whop.com](https://whop.com))
2. A Whop Company/Brand created
3. Products/Plans configured in Whop dashboard
4. Supabase project with database access

## Step 1: Create Whop App

1. Go to [Whop Apps Dashboard](https://whop.com/apps)
2. Click "Create New App"
3. Fill in your app details:
   - **App Name**: Career Automation Insights Engine
   - **Description**: Career automation risk analysis and insights platform
   - **Redirect URLs**: Add your app's URLs (e.g., `https://yourdomain.com/auth/callback`)

4. Save your credentials:
   - **App ID**: `app_xxxxxxxxxxxxx`
   - **API Key**: `whop_xxxxxxxxxxxxx`
   - **Webhook Secret**: `whsec_xxxxxxxxxxxxx`
   - **Company ID**: Found in your Whop dashboard URL

## Step 2: Create Products/Plans in Whop

Create the following products in your Whop dashboard:

### Free Tier (Optional)
- Not needed in Whop - handled in application logic

### Basic Plan
- **Name**: Basic Membership
- **Price**: $9.99/month
- **Features**: Add descriptions matching `PricingPlans.tsx`
- **Plan ID**: Copy this after creation (e.g., `plan_xxxxx`)

### Premium Plan
- **Name**: Premium Membership
- **Price**: $29.99/month
- **Features**: Add descriptions matching `PricingPlans.tsx`
- **Plan ID**: Copy this after creation (e.g., `plan_yyyyy`)

### Enterprise Plan
- **Name**: Enterprise Membership
- **Price**: $99.99/month
- **Features**: Add descriptions matching `PricingPlans.tsx`
- **Plan ID**: Copy this after creation (e.g., `plan_zzzzz`)

## Step 3: Configure Environment Variables

Update your `.env` file with Whop credentials:

```bash
# Whop Integration
WHOP_API_KEY=whop_xxxxxxxxxxxxx
WHOP_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
VITE_WHOP_COMPANY_ID=biz_xxxxxxxxxxxxx
VITE_WHOP_APP_ID=app_xxxxxxxxxxxxx
```

**Important**: Never commit real API keys to version control!

## Step 4: Update Pricing Configuration

Edit `src/components/pricing/PricingPlans.tsx` and update the plan IDs:

```typescript
export const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  // ... free tier ...
  {
    id: "basic",
    name: "Basic",
    // ... other config ...
    whopPlanId: "plan_xxxxx", // ← Replace with your actual Whop plan ID
    checkoutUrl: `https://whop.com/checkout/plan_xxxxx?d=${
      import.meta.env.VITE_WHOP_COMPANY_ID
    }`,
  },
  // ... repeat for premium and enterprise ...
];
```

## Step 5: Deploy Database Migration

Run the migration to create the required tables:

```bash
# If using Supabase CLI locally
supabase db push

# Or in Supabase Dashboard:
# 1. Go to Database → Migrations
# 2. Create new migration
# 3. Paste contents of supabase/migrations/20251105110000_create_whop_integration.sql
# 4. Run migration
```

This creates:
- `whop_memberships` table
- `whop_webhook_logs` table
- RLS policies
- Helper functions for membership management

## Step 6: Deploy Webhook Edge Function

Deploy the webhook handler to Supabase:

```bash
# Using Supabase CLI
supabase functions deploy whop-webhook

# Or manually in Supabase Dashboard:
# 1. Go to Edge Functions
# 2. Create new function named "whop-webhook"
# 3. Paste contents of supabase/functions/whop-webhook/index.ts
# 4. Deploy function
```

Note the function URL: `https://[your-project].supabase.co/functions/v1/whop-webhook`

## Step 7: Configure Whop Webhook

1. In Whop Apps Dashboard, go to your app settings
2. Navigate to **Webhooks** section
3. Add webhook endpoint: `https://[your-project].supabase.co/functions/v1/whop-webhook`
4. Select events to listen for:
   - ✅ `membership.created`
   - ✅ `membership.updated`
   - ✅ `membership.deleted`
   - ✅ `membership.went_valid`
   - ✅ `membership.went_invalid`
   - ✅ `membership.canceled`

5. Save webhook configuration

## Step 8: Test the Integration

### Test Webhook Handler

```bash
# Test webhook endpoint (replace with your project URL)
curl -X POST https://[your-project].supabase.co/functions/v1/whop-webhook \
  -H "Content-Type: application/json" \
  -H "x-whop-signature: test_signature" \
  -d '{
    "action": "membership.created",
    "data": {
      "id": "mem_test123",
      "user_id": "user_test123",
      "plan_id": "plan_xxxxx",
      "status": "active",
      "valid": true,
      "cancel_at_period_end": false
    }
  }'
```

### Test Pricing Components

Add the pricing component to a page:

```typescript
import { PricingPlans } from "@/components/pricing";
import { useUserProfile } from "@/hooks/useUserProfile";

export function PricingPage() {
  const { profile } = useUserProfile();

  return (
    <PricingPlans
      currentTier={profile?.subscription_tier || "free"}
    />
  );
}
```

## Step 9: User Linking (Important!)

Currently, the webhook handler stores Whop user IDs but doesn't automatically link them to Supabase auth users. You have two options:

### Option A: Manual Linking
After a user purchases through Whop:
1. They receive a license key or access pass
2. In your app, provide an interface to enter the license key
3. Link the Whop membership to the authenticated user

### Option B: OAuth Integration (Recommended)
Implement Whop OAuth flow:
1. User clicks "Sign in with Whop" or "Connect Whop Account"
2. OAuth flow provides Whop user ID
3. Store mapping in `profiles` table: `whop_user_id` column (add via migration)
4. Update webhook handler to use this mapping

## Monitoring

### Check Webhook Logs

Query webhook logs in Supabase:

```sql
-- View recent webhook events
SELECT * FROM whop_webhook_logs
ORDER BY created_at DESC
LIMIT 50;

-- Check for failed webhooks
SELECT * FROM whop_webhook_logs
WHERE processed = false;
```

### Check Memberships

```sql
-- View all active memberships
SELECT
  wm.*,
  p.full_name,
  p.subscription_tier
FROM whop_memberships wm
JOIN profiles p ON p.user_id = wm.user_id
WHERE wm.status = 'active';
```

## Customization

### Adding Custom Tiers

1. Add tier to `profiles` table CHECK constraint:
```sql
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_subscription_tier_check
CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise', 'your_custom_tier'));
```

2. Update `sync_profile_subscription_from_whop()` function
3. Add to `PricingPlans.tsx` configuration
4. Create corresponding Whop product

### Customizing Plan Mapping

Edit the `sync_profile_subscription_from_whop()` function in the migration file to change how Whop plan names map to subscription tiers.

## Troubleshooting

### Webhooks Not Received
1. Check webhook endpoint is publicly accessible
2. Verify webhook secret matches environment variable
3. Check Supabase function logs for errors
4. Ensure events are enabled in Whop dashboard

### Membership Not Syncing
1. Check `whop_webhook_logs` for error messages
2. Verify trigger function is enabled
3. Check RLS policies aren't blocking updates
4. Ensure user exists in `auth.users` table

### Signature Verification Failing
1. Verify `WHOP_WEBHOOK_SECRET` is correct
2. Check webhook secret in Whop dashboard matches
3. Ensure no trailing spaces in environment variable

## Security Best Practices

1. ✅ Always verify webhook signatures
2. ✅ Use HTTPS for all webhook endpoints
3. ✅ Store API keys in environment variables (never in code)
4. ✅ Enable RLS policies on all tables
5. ✅ Use service role key only in Edge Functions
6. ✅ Implement rate limiting on public endpoints
7. ✅ Log all webhook events for audit trail
8. ✅ Regularly rotate API keys

## Next Steps

1. **Test thoroughly** in development before production
2. **Set up monitoring** and alerting for failed webhooks
3. **Implement user linking** (OAuth or manual)
4. **Create admin dashboard** to manage memberships
5. **Add upgrade/downgrade flows** in the UI
6. **Configure email notifications** for membership changes
7. **Set up analytics** to track conversion rates

## Support

- **Whop Docs**: https://docs.whop.com
- **Supabase Docs**: https://supabase.com/docs
- **Issues**: File in GitHub repository

## Resources

- [Whop API Documentation](https://docs.whop.com/api)
- [Whop Webhooks Guide](https://docs.whop.com/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
