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
  task: z.string().min(5),
  hints: z.array(z.string()).optional(),
});

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function heuristicScores(task: string, hints: string[] = []) {
  const t = task.toLowerCase();
  const tokens = (t.match(/[a-z]+/g) || []);
  const contains = (words: string[]) => words.some(w => t.includes(w));

  let complexity = 5;
  let tacit = 5;
  let human = 5;
  let adversarial = 5;

  if (contains(["strategy","strategic","architecture","design document","synthesis","tradeoff"])) complexity += 2;
  if (contains(["debug","investigate","diagnose","triage","interpret"])) complexity += 1.5;
  if (contains(["routine","data entry","copy","extract","template","form"])) complexity -= 2;
  if (contains(["checklist","standard operating procedure","sop","step-by-step"])) complexity -= 1;

  if (contains(["you'll know it when you see it","judgment","intuition","taste","context"])) tacit += 2;
  if (contains(["follow procedure","rule-based","structured"])) tacit -= 1.5;

  if (contains(["negotiate","mediate","empathy","counsel","relationship","trust","lead"])) human += 2.5;
  if (contains(["customer","patient","client","stakeholder"])) human += 1;
  if (contains(["batch","pipeline","etl","cron"])) human -= 1.5;

  if (contains(["fraud","spam","adversary","attack","game","competition"])) adversarial += 2;
  if (contains(["static rules","deterministic"])) adversarial -= 1;

  for (const h of hints) {
    const s = h.toLowerCase();
    if (s.includes("regulatory") || s.includes("compliance")) adversarial += 1.5;
    if (s.includes("high-stakes") || s.includes("safety")) human += 1.5;
    if (s.includes("creative") || s.includes("novel")) tacit += 1;
    if (s.includes("repeatable") || s.includes("routine")) tacit -= 1; complexity -= 1;
  }

  complexity = clamp(complexity, 0, 10);
  tacit = clamp(tacit, 0, 10);
  human = clamp(human, 0, 10);
  adversarial = clamp(adversarial, 0, 10);

  return { complexity, tacit, human, adversarial };
}

function mapCategory(score: number) {
  if (score < 3) return "low";
  if (score < 6) return "medium";
  if (score < 8) return "high";
  return "very_high";
}

function timelineYears(score: number) {
  const inv = 10 - score;
  return clamp(2 + inv * 1.2, 0, 30);
}

serve(async (req) => {
  const origin = req.headers.get('origin') || '';
  const headers = corsHeaders(origin);
  if (req.method === 'OPTIONS') return new Response(null, { headers });

  try {
    const rateLimitMax = Number(Deno.env.get('AR_RATE_LIMIT_PER_MIN') ?? '60');
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

    const subs = heuristicScores(body.task, body.hints);
    const score = clamp(0.3*subs.complexity + 0.25*subs.tacit + 0.25*subs.human + 0.2*subs.adversarial, 0, 10);

    const resp = {
      task: body.task,
      subscores: { complexity: Math.round(subs.complexity*10)/10, tacit_knowledge: Math.round(subs.tacit*10)/10, human_touch: Math.round(subs.human*10)/10, adversarial: Math.round(subs.adversarial*10)/10 },
      resistance_score: Math.round(score*100)/100,
      category: mapCategory(score),
      timeline_years: Math.round(timelineYears(score)*10)/10,
      explanation: "Deterministic heuristic scoring based on task wording and hints",
    };

    return new Response(JSON.stringify(resp), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
});
