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

const SkillSchema = z.object({
  skill: z.string().min(1),
  expected_return: z.number(), // index units, e.g. 0.10 = +10
  risk: z.number().min(0),     // standard deviation in same units
});

const ReqSchema = z.object({
  items: z.array(SkillSchema).min(2),
  target_risk: z.number().min(0).optional(),
  correlation: z.number().min(-1).max(1).default(0.2),
});

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function normalize(weights: number[]) {
  const sum = weights.reduce((a,b)=>a+b,0);
  return sum === 0 ? weights.map(()=>1/weights.length) : weights.map(w=>w/sum);
}

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

    const raw = await req.text();
    let body: z.infer<typeof ReqSchema>;
    try { body = ReqSchema.parse(JSON.parse(raw)); } catch (_e) { return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }); }

    const items = body.items;
    const rho = body.correlation;

    // Heuristic tangency-like weights: proportional to return/risk
    const base = items.map(it => (it.risk > 0 ? it.expected_return / it.risk : 0));
    let weights = normalize(base.map(x=>Math.max(0, x)));

    // Compute portfolio expected return and risk (equal correlation rho)
    const mu = items.reduce((acc, it, i) => acc + weights[i] * it.expected_return, 0);

    const varDiag = items.reduce((acc, it, i) => acc + (weights[i]**2) * (it.risk**2), 0);
    let varOff = 0;
    for (let i=0;i<items.length;i++){
      for (let j=i+1;j<items.length;j++){
        varOff += 2 * weights[i] * weights[j] * rho * items[i].risk * items[j].risk;
      }
    }
    const variance = Math.max(0, varDiag + varOff);
    const portfolio_risk = Math.sqrt(variance);

    // Diversification score (lower correlation and more balanced weights -> higher score)
    const evenness = 1 - weights.reduce((acc,w)=> acc + Math.abs(w - 1/items.length), 0) / 2;
    const diversification_score = clamp(Math.round(((1 - Math.max(0, rho)) * 0.6 + evenness * 0.4) * 100), 0, 100);

    const resp = {
      expected_return: Math.round(mu*10000)/10000,
      risk: Math.round(portfolio_risk*10000)/10000,
      weights: items.map((it, i) => ({ skill: it.skill, weight: Math.round(weights[i]*10000)/10000 })),
      diversification_score,
      rationale: [
        'Weights favor higher return/risk skills (heuristic tangency)',
        `Assumed equal correlation rho=${rho}`,
        'Frontier optimization deferred; this is a fast, deterministic baseline',
      ]
    };

    return new Response(JSON.stringify(resp), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
});
