# 🚀 WHOP MARKETPLACE DEPLOYMENT GUIDE

**Career Automation Insights Engine**  
**Version:** 1.0.0  
**Last Updated:** December 10, 2025

---

## ✅ IMPLEMENTATION STATUS

All code changes have been completed. Your app is ready for Whop deployment!

### Completed Fixes

| # | Issue | Status | Files Modified |
|---|-------|--------|----------------|
| 1 | Whop iframe SDK integration | ✅ | `src/contexts/WhopAppContext.tsx` |
| 2 | Whop entry point pages | ✅ | `src/pages/whop/ExperiencePage.tsx`, `DashboardPage.tsx`, `DiscoverPage.tsx` |
| 3 | App routes for Whop | ✅ | `src/App.tsx` |
| 4 | X-Frame-Options headers | ✅ | `netlify.toml`, `public/_headers` |
| 5 | CSP frame-ancestors | ✅ | `netlify.toml`, `public/_headers` |
| 6 | Whop auth context | ✅ | `src/contexts/WhopAppContext.tsx` |
| 7 | Build verification | ✅ | All chunks built successfully |

---

## 📋 YOUR MANUAL STEPS (Required)

### Step 1: Deploy to Netlify

First, deploy your app to get a live URL:

```bash
# Commit all changes
git add .
git commit -m "feat: Add Whop marketplace integration"

# Push to main branch (triggers Netlify deploy)
git push origin main
```

Or deploy directly:
```bash
netlify deploy --prod
```

**Note your deployment URL** (e.g., `https://career-insights.netlify.app`)

---

### Step 2: Register App in Whop Developer Portal

1. **Go to Whop Developer Dashboard**
   - URL: https://whop.com/dashboard/developer/apps
   - Log in with your Whop account

2. **Click "Create App"**

3. **Fill in App Details:**

   | Field | Value |
   |-------|-------|
   | **App Name** | Career Automation Insights |
   | **Description** | AI-powered career risk analysis and personalized roadmaps to help your community members future-proof their careers. |
   | **App Type** | B2B App (for community owners) |
   | **Icon** | Upload a 512x512 PNG (see below for requirements) |

4. **Configure App URLs:**

   | URL Type | Path | Full URL Example |
   |----------|------|------------------|
   | **Base URL** | (your domain) | `https://career-insights.netlify.app` |
   | **Experience Path** | `/whop/experience` | Customer view when accessing the app |
   | **Dashboard Path** | `/whop/dashboard` | Seller/admin view for community owners |
   | **Discover Path** | `/whop/discover` | App store preview page |
   | **OAuth Redirect URI** | `/auth/whop/callback` | OAuth callback handler |

5. **Copy Your API Credentials:**
   
   After creation, you'll receive:
   - **Client ID** (e.g., `app_xxxxxxxxxxxxxx`)
   - **Client Secret** (keep this secret!)
   - **API Key**

---

### Step 3: Configure Environment Variables

Add these to your Netlify environment variables:

1. Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables

2. Add the following:

```env
# Whop Integration
VITE_WHOP_CLIENT_ID=app_your_client_id
VITE_WHOP_REDIRECT_URI=https://your-domain.netlify.app/auth/whop/callback
VITE_WHOP_API_KEY=your_api_key

# Backend (for Edge Functions)
WHOP_CLIENT_SECRET=your_client_secret
WHOP_WEBHOOK_SECRET=your_webhook_secret
```

3. Also add to your Supabase Edge Function secrets:

```bash
supabase secrets set WHOP_CLIENT_SECRET=your_client_secret
supabase secrets set WHOP_WEBHOOK_SECRET=your_webhook_secret
supabase secrets set WHOP_API_KEY=your_api_key
```

---

### Step 4: Configure Webhooks

1. In Whop Developer Portal, go to your app → Webhooks

2. **Add Webhook Endpoint:**
   - URL: `https://your-supabase-project.supabase.co/functions/v1/whop-webhook`
   - Events to subscribe:
     - `membership.went_valid`
     - `membership.went_invalid`
     - `membership.created`
     - `membership.cancelled`
     - `payment.succeeded`
     - `payment.failed`

3. **Copy the Webhook Secret** and add it to your environment variables

---

### Step 5: Deploy Whop Webhook Edge Function

```bash
# Navigate to your project
cd /path/to/career-automation-insights-engine

# Deploy the webhook handler
supabase functions deploy whop-webhook --no-verify-jwt
```

---

### Step 6: Test Your Integration

1. **Test iframe embedding:**
   - In Whop Developer Portal, use the "Preview" feature
   - Your app should load inside the Whop frame without showing a login page

2. **Test webhook delivery:**
   - Use Whop's webhook testing tool to send test events
   - Check Supabase Edge Function logs for received events

3. **Test user flow:**
   - Access `/whop/experience` - should show customer view
   - Access `/whop/dashboard` - should show admin dashboard
   - Access `/whop/discover` - should show app store preview

---

### Step 7: Submit for Review

1. **Prepare required assets:**
   - App icon: 512x512 PNG
   - Screenshots: 1280x720 or 1920x1080 showing key features
   - Video demo (optional but recommended): 30-60 seconds

2. **Write app listing:**
   - Short description (under 150 characters)
   - Full description (features, benefits, use cases)
   - Pricing information

3. **Submit for Whop review:**
   - Click "Submit for Review" in Developer Portal
   - Whop typically reviews within 24-48 hours

---

## 🔧 APP CONFIGURATION REFERENCE

### Recommended App Structure

```
/whop/experience    → Customer-facing app (main experience)
/whop/dashboard     → Seller/admin analytics dashboard  
/whop/discover      → App store preview & marketing page
/auth/whop/callback → OAuth redirect handler
```

### Environment Variables Summary

| Variable | Location | Purpose |
|----------|----------|---------|
| `VITE_WHOP_CLIENT_ID` | Netlify | Frontend OAuth |
| `VITE_WHOP_REDIRECT_URI` | Netlify | OAuth callback |
| `VITE_WHOP_API_KEY` | Netlify | Frontend API calls |
| `WHOP_CLIENT_SECRET` | Netlify + Supabase | Backend auth |
| `WHOP_WEBHOOK_SECRET` | Supabase | Webhook verification |
| `WHOP_API_KEY` | Supabase | Backend API calls |

---

## 📊 PRICING CONFIGURATION

Configure your pricing in Whop Developer Portal:

### Recommended Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Free Trial** | $0 | 3 APO analyses, Basic AI coach |
| **Pro** | $29/month | Unlimited analyses, Full AI coach, Roadmaps |
| **Enterprise** | $99/month | Team dashboard, API access, Priority support |

---

## 🐛 TROUBLESHOOTING

### App won't load in iframe

1. Check browser console for CSP errors
2. Verify `frame-ancestors` includes `whop.com` and `*.whop.com`
3. Confirm `X-Frame-Options` is NOT set to DENY

### User not recognized

1. Check that `x-whop-user-token` header is being passed
2. Verify webhook is processing `membership.went_valid` events
3. Check Supabase profiles table for Whop user entries

### Webhook not receiving events

1. Verify webhook URL is correct in Whop dashboard
2. Check Edge Function logs: `supabase functions logs whop-webhook`
3. Ensure `--no-verify-jwt` flag was used during deployment

### OAuth callback failing

1. Verify redirect URI matches exactly in Whop dashboard
2. Check that `WHOP_CLIENT_SECRET` is set correctly
3. Look for errors in browser console during OAuth flow

---

## 📝 POST-LAUNCH CHECKLIST

After successful deployment:

- [ ] Monitor webhook delivery in Whop dashboard
- [ ] Check Supabase logs for any errors
- [ ] Test complete user journey (discover → purchase → use)
- [ ] Set up analytics to track Whop user engagement
- [ ] Create support documentation for Whop users
- [ ] Respond promptly to any Whop review feedback

---

## 📞 SUPPORT RESOURCES

- **Whop Developer Docs:** https://docs.whop.com
- **Whop Discord:** https://discord.gg/whop
- **Your App's Support:** Add your contact info

---

## 🎉 CONGRATULATIONS!

Your Career Automation Insights Engine is now ready for the Whop marketplace. 
Follow the manual steps above to complete the deployment.

**Estimated time to complete:** 30-45 minutes
