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
  skill: z.string().min(1),
  acquired_year: z.number().int().min(1970).max(new Date().getFullYear()).optional(),
  acquired_date: z.string().optional(),
  trend: z.enum(["growing","stable","declining"]).optional(),
  half_life_years: z.number().min(0.5).max(12).optional(),
  critical_threshold: z.number().min(1).max(99.9).optional(),
});

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function parseYearFromDate(dateStr?: string): number | null {
  if (!dateStr) return null;
  const m = dateStr.match(/^(\d{4})/);
  if (!m) return null;
  const y = Number(m[1]);
  if (Number.isFinite(y) && y >= 1970 && y <= new Date().getFullYear()) return y;
  return null;
}

function monthsToThresholdFromZero(lambda: number, thresholdPct: number): number {
  const thr = clamp(thresholdPct/100, 0.0001, 0.9999);
  const years = -Math.log(thr) / lambda;
  return years * 12;
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const headers = corsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const rateLimitMax = Number(Deno.env.get('HL_RATE_LIMIT_PER_MIN') ?? '60');
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
    try { body = ReqSchema.parse(JSON.parse(raw)); } catch (e) { return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }); }

    const now = new Date();
    const acquiredYear = body.acquired_year ?? parseYearFromDate(body.acquired_date) ?? now.getFullYear();

    let halfLife = body.half_life_years ?? 3.0;
    const trend = body.trend ?? 'stable';
    if (!body.half_life_years) {
      if (trend === 'growing') halfLife += 1.0;
      if (trend === 'declining') halfLife -= 0.5;
    }
    halfLife = clamp(halfLife, 0.5, 12.0);

    const lambda = Math.log(2) / halfLife;
    const yearsElapsed = clamp((now.getFullYear() + (now.getMonth()+1)/12) - (acquiredYear + 1/12), 0, 100);
    const remaining = Math.exp(-lambda * yearsElapsed);
    const freshnessScore = Math.round(remaining * 10000) / 100; // 0-100 with 2dp

    const m80 = monthsToThresholdFromZero(lambda, 80);
    const m60 = monthsToThresholdFromZero(lambda, 60);

    const critical = clamp(body.critical_threshold ?? 80, 1, 99.9);
    const curr = freshnessScore; // 0-100
    const deltaMonthsTo = (thr: number) => {
      if (curr <= thr) return 0;
      const thrFrac = thr / 100;
      const years = Math.log(thrFrac / remaining) / (-lambda);
      return Math.max(0, Math.round(years * 12));
    };
    const months_to_80_from_now = deltaMonthsTo(80);
    const months_to_60_from_now = deltaMonthsTo(60);
    const months_to_critical_from_now = deltaMonthsTo(critical);
    const below_critical = curr <= critical;

    const recommended_hours_per_month = Math.round((Math.max(1, Math.min(12, 20 / halfLife))) * 10) / 10;

    const resp = {
      skill: body.skill,
      acquired_year: acquiredYear,
      assumptions: { half_life_years: Math.round(halfLife*100)/100, trend },
      decay_lambda: Math.round(lambda*1000)/1000,
      freshness_score: freshnessScore,
      remaining_percent: freshnessScore,
      months_to_80: Math.round(m80),
      months_to_60: Math.round(m60),
      months_to_80_from_now,
      months_to_60_from_now,
      critical_threshold: critical,
      months_to_critical_from_now,
      below_critical,
      recommended_hours_per_month,
      notes: [
        'Exponential half-life model with bounded priors',
        'Trend-adjusted half-life; consider updating with market signals',
        'Includes maintenance hours and critical threshold alert',
      ],
    };

    return new Response(JSON.stringify(resp), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
});
