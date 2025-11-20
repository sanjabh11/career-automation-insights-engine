import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.sh/zod@3.22.4";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { rateLimit } from "../../lib/RateLimiter.ts";

const corsBase = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, x-api-key, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
} as const;

const LOCAL_DEV_PREFIXES = ['http://localhost:', 'http://127.0.0.1:', 'https://localhost:', 'https://127.0.0.1:'];

function isOriginPermitted(origin: string): boolean {
  const normalize = (s: string) => s.replace(/\/$/, '').toLowerCase();
  const raw = (Deno.env.get('APO_ALLOWED_ORIGINS') || '*')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (raw.length === 1 && raw[0] === '*') return true;
  if (!origin) return false;
  if (LOCAL_DEV_PREFIXES.some(prefix => origin.startsWith(prefix))) return true;
  const allow = raw.map(normalize);
  const o = normalize(origin);
  return allow.includes(o);
}

function corsHeaders(origin: string): Record<string, string> {
  const permitted = isOriginPermitted(origin);
  const allowOrigin = permitted ? (origin || '*') : 'null';
  return { ...corsBase, 'Access-Control-Allow-Origin': allowOrigin } as Record<string, string>;
}

const ReqSchema = z.object({
  outcome_id: z.string().uuid(),
  reminder_type: z.enum(['90_day', '180_day']),
  channel: z.enum(['email', 'ui_notification']).default('ui_notification'),
});

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const headers = corsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const rateLimitMax = Number(Deno.env.get('PORTFOLIO_RATE_LIMIT_PER_MIN') ?? '30');
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = rateLimit(ip, { windowMs: 60_000, max: rateLimitMax });
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const raw = await req.text();
    let body: z.infer<typeof ReqSchema>;
    try { body = ReqSchema.parse(JSON.parse(raw)); } catch (_e) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    // Verify outcome exists and belongs to user
    const { data: outcome, error: outcomeError } = await supabase
      .from('user_outcomes')
      .select('id')
      .eq('id', body.outcome_id)
      .eq('user_id', user.id)
      .single();
    if (outcomeError || !outcome) {
      return new Response(JSON.stringify({ error: 'Outcome not found' }), { status: 404, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    // Calculate remind_at
    const now = new Date();
    const days = body.reminder_type === '90_day' ? 90 : 180;
    const remindAt = new Date(now);
    remindAt.setDate(now.getDate() + days);

    // Insert reminder
    const { data: reminder, error: insertError } = await supabase
      .from('outcome_reminders')
      .insert({
        user_id: user.id,
        outcome_id: body.outcome_id,
        remind_at: remindAt.toISOString(),
        channel: body.channel,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert reminder error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create reminder' }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    // For email channel, check if email keys are configured
    let emailConfigured = false;
    if (body.channel === 'email') {
      const resendKey = Deno.env.get('RESEND_API_KEY');
      const sendgridKey = Deno.env.get('SENDGRID_API_KEY');
      emailConfigured = !!(resendKey || sendgridKey);
      if (!emailConfigured) {
        console.warn('Email channel requested but no email provider configured');
      }
    }

    const resp = {
      success: true,
      reminder_id: reminder.id,
      remind_at: reminder.remind_at,
      channel: reminder.channel,
      email_configured: emailConfigured,
      note: emailConfigured ? 'Reminder scheduled successfully' : 'Reminder created but email not configured; will notify via UI',
    };

    return new Response(JSON.stringify(resp), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
  } catch (_err) {
    console.error('Outcome reminder error:', _err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
});
