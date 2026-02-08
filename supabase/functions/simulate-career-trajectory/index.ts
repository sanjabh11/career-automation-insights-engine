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

const ReqSchema = z.object({
  hours_per_week: z.number().min(1).max(60).default(10),
  risk_tolerance: z.enum(["conservative","balanced","aggressive"]).default("balanced"),
  current_salary: z.number().min(0).optional(),
  target_salary: z.number().min(0).optional(),
  duration_months_max: z.number().min(6).max(60).default(36),
  iterations: z.number().min(200).max(20000).default(2000)
});

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function randn(std = 1): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * std;
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const headers = corsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const rateLimitMax = Number(Deno.env.get('SIM_RATE_LIMIT_PER_MIN') ?? '30');
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

    const N = body.iterations;
    const horizon = body.duration_months_max;
    const speedBase = body.hours_per_week / 10; // baseline scaling
    const riskMap = { conservative: 0.8, balanced: 1.0, aggressive: 1.2 } as const;
    const riskFactor = riskMap[body.risk_tolerance];

    const results: { months: number; success: boolean; salary?: number }[] = [];
    for (let i = 0; i < N; i++) {
      const learningNoise = 1 + randn(0.2);
      const marketNoise = 1 + randn(body.risk_tolerance === 'conservative' ? 0.1 : body.risk_tolerance === 'balanced' ? 0.2 : 0.3);
      const effectiveSpeed = clamp(speedBase * riskFactor * learningNoise * marketNoise, 0.2, 3.0);
      const threshold = 10; // arbitrary completion threshold units
      const monthsToComplete = Math.ceil(threshold / effectiveSpeed);
      const cappedMonths = clamp(monthsToComplete, 1, horizon + Math.floor(horizon*0.5));
      const success = cappedMonths <= horizon;
      let salary: number | undefined = undefined;
      if (typeof body.current_salary === 'number' && typeof body.target_salary === 'number') {
        const delta = Math.max(0, body.target_salary - body.current_salary);
        const salaryNoise = 1 + randn(0.1);
        salary = Math.round((body.current_salary + delta * 0.7 * salaryNoise));
      }
      results.push({ months: cappedMonths, success, salary });
    }

    results.sort((a,b)=>a.months-b.months);
    const qIndex = (p: number) => Math.max(0, Math.min(results.length - 1, Math.floor(p * (results.length - 1))));
    const months_p50 = results[qIndex(0.5)].months;
    const months_p90 = results[qIndex(0.9)].months;

    const successAt = (m: number) => results.filter(r => r.months <= m).length / results.length;
    const p_success_12m = Math.round(successAt(12)*10000)/10000;
    const p_success_18m = Math.round(successAt(18)*10000)/10000;
    const p_success_24m = Math.round(successAt(24)*10000)/10000;

    const salaries = results.map(r=>r.salary).filter((s): s is number => typeof s === 'number');
    salaries.sort((a,b)=>a-b);
    const median_salary_at_completion = salaries.length ? salaries[qIndex(0.5)] : null;

    const resp = {
      p_success_12m,
      p_success_18m,
      p_success_24m,
      months_p50,
      months_p90,
      median_salary_at_completion,
      notes: ["Monte Carlo-lite with stochastic learning and market factors"]
    };

    return new Response(JSON.stringify(resp), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
});
