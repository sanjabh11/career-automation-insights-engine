import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

const OutcomeSchema = z.object({
  initial_apo_score: z.number().min(0).max(100).optional(),
  initial_salary: z.number().min(0).optional(),
  goal_occupation: z.string().min(1).max(255).optional(),
  completed_learning_hours: z.number().min(0).optional(),
  skills_acquired: z.array(z.string()).optional(),
  transitioned: z.boolean().optional(),
  new_salary: z.number().min(0).optional(),
  transition_months: z.number().min(0).max(120).optional(),
  satisfaction_score: z.number().min(1).max(10).optional(),
  consent_to_research: z.boolean().optional(),
  consent_to_contact: z.boolean().optional(),
  transition_plan_ref: z.string().max(255).optional(),
  selected_transition_option: z.string().max(255).optional(),
  options_presented: z.array(z.string().max(255)).max(12).optional(),
  artifact_reviewed: z.boolean().optional(),
  does_not_prove_acknowledged: z.boolean().optional(),
});

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const headers = corsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const rateLimitMax = Number(Deno.env.get('OUTCOME_RATE_LIMIT_PER_MIN') ?? '15');
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = rateLimit(ip, { windowMs: 60_000, max: rateLimitMax });
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    const raw = await req.text();
    let body: z.infer<typeof OutcomeSchema>;
    try { body = OutcomeSchema.parse(JSON.parse(raw)); } catch (_e) { return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }); }

    const url = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !anon) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: userResp, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userResp?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    const user_id = userResp.user.id;
    const { data, error } = await supabase
      .from('user_outcomes')
      .insert([{ user_id, ...body }])
      .select('*')
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    if (body.selected_transition_option || body.artifact_reviewed || body.options_presented?.length) {
      await supabase
        .from('revealed_transition_events')
        .insert([{
          user_id,
          outcome_id: data.id,
          event_type: body.selected_transition_option ? 'option_selected' : body.artifact_reviewed ? 'artifact_reviewed' : 'option_presented',
          target_occupation: body.goal_occupation,
          options_presented: body.options_presented ?? [],
          selected_option: body.selected_transition_option ? { label: body.selected_transition_option } : null,
          consent_to_research: body.consent_to_research ?? false,
          consent_to_contact: body.consent_to_contact ?? false,
          artifact_reviewed: body.artifact_reviewed ?? false,
        }]);
    }

    return new Response(JSON.stringify({ ok: true, outcome: data }), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
});
