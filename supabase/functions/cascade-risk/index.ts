import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
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

const UpstreamSchema = z.object({
  occupation_code: z.string().min(1),
  title: z.string().min(1),
  weight: z.number().min(0).max(1),
  automation_prob: z.number().min(0).max(1)
});

const ReqSchema = z.object({
  occupation_code: z.string().optional(),
  upstream: z.array(UpstreamSchema).min(1),
});

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const headers = corsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const rateLimitMax = Number(Deno.env.get('CASCADE_RATE_LIMIT_PER_MIN') ?? '30');
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = rateLimit(ip, { windowMs: 60_000, max: rateLimitMax });
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const raw = await req.text();
    let body: z.infer<typeof ReqSchema>;
    try { body = ReqSchema.parse(JSON.parse(raw)); } catch (_e) { return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }); }

    const contributions = body.upstream.map(u => ({
      ...u,
      contribution: u.weight * u.automation_prob,
    })).sort((a,b)=> b.contribution - a.contribution);

    const sum = contributions.reduce((acc,c)=> acc + c.contribution, 0);
    const cascade_score = clamp(Math.round(sum * 10000)/100, 0, 100);

    const timeline_months = clamp(Math.round(
      contributions.reduce((acc,c)=> acc + (c.weight * (12 + (1 - c.automation_prob) * 24)), 0)
    ), 0, 60);

    const top_contributors = contributions.slice(0, 5).map(c => ({
      occupation_code: c.occupation_code,
      title: c.title,
      weight: Math.round(c.weight*1000)/1000,
      automation_prob: Math.round(c.automation_prob*1000)/1000,
    }));

    const recommendations = [
      'Reduce dependency weight on high-automation upstream roles',
      'Increase links to high-resistance roles to buffer cascades',
      'Stagger adoption timelines to avoid synchronized shocks'
    ];

    const resp = { cascade_score, top_contributors, timeline_months, recommendations };
    return new Response(JSON.stringify(resp), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
});
