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

// Pizzinelli 6-dimension complementarity model
// Replaces the old 4-factor heuristic with a research-backed framework
// that separates Exposure (substitution risk) from Complementarity (augmentation potential)
function pizzinelliScores(task: string, hints: string[] = []) {
  const t = task.toLowerCase();
  const contains = (words: string[]) => words.some(w => t.includes(w));

  // 6 dimensions (0-10 scale, 5 = neutral)
  let cognitiveComplexity = 5;  // D1: Problem-solving depth
  let creativeIntelligence = 5; // D2: Novel idea generation
  let socioEmotional = 5;       // D3: Human interaction/relationships
  let tacitKnowledge = 5;       // D4: Implicit, experience-based knowledge
  let physicalDexterity = 5;    // D5: Manual precision/mobility
  let adversarialContext = 5;   // D6: Adversarial/competitive environment

  // D1: Cognitive complexity
  if (contains(["strategy","strategic","architecture","synthesis","tradeoff","optimization"])) cognitiveComplexity += 2.5;
  if (contains(["debug","investigate","diagnose","triage","interpret","analyze"])) cognitiveComplexity += 1.5;
  if (contains(["routine","data entry","copy","extract","template","form","transcribe"])) cognitiveComplexity -= 2.5;
  if (contains(["checklist","sop","step-by-step","manual","procedure"])) cognitiveComplexity -= 1;

  // D2: Creative intelligence
  if (contains(["design","creative","novel","innovate","brainstorm","artistic","compose"])) creativeIntelligence += 2.5;
  if (contains(["write","draft","content","story","narrative"])) creativeIntelligence += 1;
  if (contains(["format","standardize","normalize","convert","reformat"])) creativeIntelligence -= 2;

  // D3: Socio-emotional
  if (contains(["negotiate","mediate","empathy","counsel","relationship","trust","lead","mentor"])) socioEmotional += 2.5;
  if (contains(["customer","patient","client","stakeholder","team","collaborate"])) socioEmotional += 1;
  if (contains(["batch","pipeline","etl","cron","automated","background"])) socioEmotional -= 1.5;

  // D4: Tacit knowledge
  if (contains(["judgment","intuition","taste","context","experience","craft","expertise"])) tacitKnowledge += 2;
  if (contains(["follow procedure","rule-based","structured","codified","documented"])) tacitKnowledge -= 1.5;

  // D5: Physical dexterity
  if (contains(["hand","manual","precision","assembly","repair","operate","inspect","physical"])) physicalDexterity += 2.5;
  if (contains(["desk","computer","screen","remote","virtual"])) physicalDexterity -= 1;

  // D6: Adversarial context
  if (contains(["fraud","spam","adversary","attack","game","competition","security","threat"])) adversarialContext += 2;
  if (contains(["static rules","deterministic","cooperative","collaborative"])) adversarialContext -= 1;

  // Apply hints
  for (const h of hints) {
    const s = h.toLowerCase();
    if (s.includes("regulatory") || s.includes("compliance")) adversarialContext += 1.5;
    if (s.includes("high-stakes") || s.includes("safety")) { socioEmotional += 1; cognitiveComplexity += 1; }
    if (s.includes("creative") || s.includes("novel")) creativeIntelligence += 1;
    if (s.includes("repeatable") || s.includes("routine")) { cognitiveComplexity -= 1; tacitKnowledge -= 1; }
    if (s.includes("physical") || s.includes("hands-on")) physicalDexterity += 1.5;
    if (s.includes("social") || s.includes("interpersonal")) socioEmotional += 1;
  }

  cognitiveComplexity = clamp(cognitiveComplexity, 0, 10);
  creativeIntelligence = clamp(creativeIntelligence, 0, 10);
  socioEmotional = clamp(socioEmotional, 0, 10);
  tacitKnowledge = clamp(tacitKnowledge, 0, 10);
  physicalDexterity = clamp(physicalDexterity, 0, 10);
  adversarialContext = clamp(adversarialContext, 0, 10);

  // Exposure score (substitution risk): low on all 6 dimensions = high exposure
  // Higher complexity/creativity/social/tacit/physical/adversarial = lower exposure
  const exposureRaw = 10 - (
    0.20 * cognitiveComplexity +
    0.20 * creativeIntelligence +
    0.20 * socioEmotional +
    0.15 * tacitKnowledge +
    0.15 * physicalDexterity +
    0.10 * adversarialContext
  );
  const exposure = clamp(exposureRaw, 0, 10);

  // Complementarity score (augmentation potential): high complexity + creativity + data-driven
  // Tasks that are cognitively complex but routine-adjacent benefit most from AI
  const complementarityRaw =
    0.30 * cognitiveComplexity +
    0.20 * creativeIntelligence +
    0.15 * tacitKnowledge +
    0.15 * adversarialContext +
    0.10 * socioEmotional +
    0.10 * physicalDexterity;
  const complementarity = clamp(complementarityRaw, 0, 10);

  // Backward-compatible subscores
  const complexity = cognitiveComplexity;
  const tacit = tacitKnowledge;
  const human = socioEmotional;
  const adversarial = adversarialContext;

  return {
    // 6-dimension scores
    cognitiveComplexity,
    creativeIntelligence,
    socioEmotional,
    tacitKnowledge,
    physicalDexterity,
    adversarialContext,
    // Dual-index scores
    exposure,
    complementarity,
    // Backward-compatible
    complexity,
    tacit,
    human,
    adversarial,
  };
}

function heuristicScores(task: string, hints: string[] = []) {
  return pizzinelliScores(task, hints);
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

    // Classify exposure/complementarity profile
    // HE = High Exposure, HC = High Complementarity, LC = Low Complementarity
    const exposureHigh = subs.exposure >= 5.5;
    const complementarityHigh = subs.complementarity >= 5.5;
    const profile = exposureHigh && complementarityHigh ? "HEHC" : exposureHigh && !complementarityHigh ? "HELC" : !exposureHigh && complementarityHigh ? "LEHC" : "LELC";

    const resp = {
      task: body.task,
      subscores: { complexity: Math.round(subs.complexity*10)/10, tacit_knowledge: Math.round(subs.tacit*10)/10, human_touch: Math.round(subs.human*10)/10, adversarial: Math.round(subs.adversarial*10)/10 },
      // Pizzinelli 6-dimension scores
      pizzinelli: {
        cognitive_complexity: Math.round(subs.cognitiveComplexity*10)/10,
        creative_intelligence: Math.round(subs.creativeIntelligence*10)/10,
        socio_emotional: Math.round(subs.socioEmotional*10)/10,
        tacit_knowledge: Math.round(subs.tacitKnowledge*10)/10,
        physical_dexterity: Math.round(subs.physicalDexterity*10)/10,
        adversarial_context: Math.round(subs.adversarialContext*10)/10,
      },
      // Dual-index: Exposure (substitution risk) + Complementarity (augmentation potential)
      exposure: Math.round(subs.exposure*100)/100,
      complementarity: Math.round(subs.complementarity*100)/100,
      profile, // HEHC, HELC, LEHC, LELC
      resistance_score: Math.round(score*100)/100,
      category: mapCategory(score),
      timeline_years: Math.round(timelineYears(score)*10)/10,
      explanation: "Pizzinelli 6-dimension model: separates substitution exposure from augmentation complementarity",
    };

    return new Response(JSON.stringify(resp), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } });
  } catch (_err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
});
