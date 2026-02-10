---
description: Stripe, Supabase, Netlify environment setup runbook
---

## Purpose
Handoff checklist to keep live billing and app environments aligned across Stripe, Supabase Edge Functions, and Netlify.

## 1) Stripe
1) **API Keys** (get from Stripe Dashboard → Developers → API keys)
   - Publishable: `pk_live_...` (frontend only)
   - Secret: `sk_live_...` (server/Edge Functions only; **never** commit)
2) **Products/Prices (live)**
   - Defender Monthly `price_1SzAwBCDRnHqUTRJY78xxjKY`
   - Defender Annual `price_1SzAwBCDRnHqUTRJ7vMvAN28`
   - Coach Pro Monthly `price_1SzAwCCDRnHqUTRJdPZaLEGn`
   - Coach Pro Annual `price_1SzAwCCDRnHqUTRJIbQ7YlJe`
   - Credits Starter (5) `price_1SzAwDCDRnHqUTRJVDblB0VC`
   - Credits Professional (15) `price_1SzAwECDRnHqUTRJmS8Qn13N`
   - Credits Enterprise (40) `price_1SzAwECDRnHqUTRJChSNHBVY`
3) **Webhook**
   - Endpoint: `https://<SUPABASE_PROJECT>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy webhook signing secret into Supabase `STRIPE_WEBHOOK_SECRET`.

## 2) Supabase Edge Function Secrets
Project Settings → Edge Functions → Secrets:
- `STRIPE_SECRET_KEY` = Stripe live secret key (from Dashboard)
- `STRIPE_WEBHOOK_SECRET` = Stripe webhook signing secret (from webhook endpoint setup)
- (existing) `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc., remain as configured

## 3) Netlify (Frontend Env Vars)
Site Settings → Build & Deploy → Environment:
- `VITE_SUPABASE_URL` = your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
- `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (publishable key)
- (optional) other `VITE_*` keys (Gemini, SerpAPI, etc.)

## 4) Local Development
- Create `.env` (gitignored). Example:
  ```bash
  VITE_SUPABASE_URL=...
  VITE_SUPABASE_ANON_KEY=...
  VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
  # local-only: do NOT commit secrets
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```
- Dev: `npm install && npm run dev`

## 5) Deployment
- Build: `npx tsc --noEmit` then `npx vite build`
- Deploy (Netlify): `npx netlify deploy --prod --dir=dist`

## 6) Validation Checklist
- Checkout flow works for Defender/Coach + credit packs
- Webhook writes subscription + credit events (subscriptions table, `add_report_credits` RPC)
- Client bundles never expose secret key

## 7) Rotations & Safety
- Rotate webhook secret if endpoint recreated
- Never commit `.env`; verify with `git check-ignore .env` and `git diff --cached | grep .env`
- If price IDs change, update both `src/lib/stripe.ts` and `supabase/functions/stripe-webhook/index.ts`
