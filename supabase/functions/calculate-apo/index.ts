import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GeminiClient, getEnvModel, getEnvGenerationDefaults } from "../../lib/GeminiClient.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit } from "../../lib/RateLimiter.ts";
import { jsonrepair } from "https://esm.sh/jsonrepair@3.0.2";

declare const Deno: any;

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, x-api-key, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Expose-Headers': 'X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset',
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

function buildCorsHeaders(origin: string): Record<string, string> {
  const permitted = isOriginPermitted(origin);
  const allowOrigin = permitted ? (origin || '*') : 'null';
  return { ...corsHeaders, 'Access-Control-Allow-Origin': allowOrigin } as Record<string, string>;
}

// Defaults, can be overridden by DB config (apo_config)
const DEFAULT_CATEGORY_WEIGHTS = {
  tasks: 0.35,        // Highest weight - core work activities
  technologies: 0.25, // Second highest - automation enablers
  skills: 0.20,       // Critical for human-AI interaction
  abilities: 0.15,    // Physical/cognitive requirements
  knowledge: 0.05     // Lowest - knowledge can often be codified
};

// Deterministic factor multipliers (controlled vocabulary) - default
const DEFAULT_FACTOR_MULTIPLIERS: Record<string, number> = {
  routine: 1.2,
  data_driven: 1.15,
  creative: 0.5,
  social: 0.6,
  physical_complex: 0.7,
  judgment: 0.9,
  compliance: 0.95,
  genai_boost: 1.2,
  // Additional factors default to neutral (1.0) if present
  economic_viability: 1.1,
  productivity_enhancement: 0.95,
  insufficient_evidence: 0.9,
};

const FREQ_SCORE: Record<"low" | "medium" | "high", number> = {
  low: 0.3,
  medium: 0.6,
  high: 0.9,
};

// Zod schema for strict validation of model output
const ApoItemSchema = z.object({
  category: z.enum(["tasks", "knowledge", "skills", "abilities", "technologies"]),
  description: z.string().min(1),
  factors: z.array(z.enum([
    "routine",
    "data_driven",
    "creative",
    "social",
    "physical_complex",
    "judgment",
    "compliance",
    "genai_boost",
    "economic_viability",
    "productivity_enhancement",
    "insufficient_evidence",
  ])).default([]),
  explanation: z.string().min(1).max(500).optional(),
  timeline: z.enum(["immediate", "short_term", "medium_term", "long_term"]).optional(),
  confidence: z.number().min(0).max(1).default(0.6),
  metadata: z.object({
    importance: z.number().min(0).max(1).default(0.5),
    frequency: z.enum(["low", "medium", "high"]).default("medium"),
    skill_level: z.number().min(1).max(5).default(3),
    tech_adoption: z.number().min(0).max(1).default(0.5),
  }),
});

const ApoSchema = z.object({
  overall_apo: z.number().min(0).max(100).optional(),
  items: z.array(ApoItemSchema).min(1),
  category_apos: z.object({
    tasks: z.object({ apo: z.number().min(0).max(100), confidence: z.enum(["low","medium","high"]) }).optional(),
    knowledge: z.object({ apo: z.number().min(0).max(100), confidence: z.enum(["low","medium","high"]) }).optional(),
    skills: z.object({ apo: z.number().min(0).max(100), confidence: z.enum(["low","medium","high"]) }).optional(),
    abilities: z.object({ apo: z.number().min(0).max(100), confidence: z.enum(["low","medium","high"]) }).optional(),
    technologies: z.object({ apo: z.number().min(0).max(100), confidence: z.enum(["low","medium","high"]) }).optional(),
  }).default({} as any),
  timeline_projections: z.object({
    immediate: z.number().min(0).max(100).optional(),
    short_term: z.number().min(0).max(100).optional(),
    medium_term: z.number().min(0).max(100).optional(),
    long_term: z.number().min(0).max(100).optional(),
    explanation: z.string().optional(),
  }).optional(),
  key_factors: z.object({
    bottlenecks: z.array(z.string()).optional(),
    gen_ai_impacts: z.array(z.string()).optional(),
    adaptation_strategies: z.array(z.string()).optional(),
  }).optional(),
  recommendations: z.array(z.string()).optional(),
  clarifications_needed: z.array(z.string()).optional(),
});

// Request schema validation
const RequestSchema = z.object({
  occupation: z.object({
    code: z.string().min(1),
    title: z.string().min(1),
  }),
});

// Helpers for deterministic APO computation
const normSkill = (level: number) => (level - 1) / 4; // 1-5 -> 0-1
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const clamp100 = (v: number) => Math.max(0, Math.min(100, v));

function applyMultipliers(base: number, factors: string[], multipliers: Record<string, number>): number {
  let mult = 1;
  for (const f of factors || []) {
    const m = multipliers[f] ?? 1;
    mult *= m;
  }
  return clamp100(base * mult);
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function computeItemAPO(item: z.infer<typeof ApoItemSchema>, multipliers: Record<string, number>): number {
  const imp = clamp01(item.metadata.importance);
  const freq = FREQ_SCORE[item.metadata.frequency] ?? 0.6;
  const skill = clamp01(normSkill(item.metadata.skill_level));
  const tech = clamp01(item.metadata.tech_adoption);
  const base = 100 * ((0.3 * imp) + (0.2 * freq) + (0.3 * (1 - skill)) + (0.2 * tech));
  return applyMultipliers(base, item.factors, multipliers);
}

function weightedMean(values: number[], weights: number[]): number {
  let sum = 0, wsum = 0;
  for (let i = 0; i < values.length; i++) {
    const w = weights[i] ?? 0;
    sum += values[i] * w;
    wsum += w;
  }
  return wsum > 0 ? sum / wsum : 0;
}

function confidenceBand(avg: number): "low" | "medium" | "high" {
  if (avg >= 0.75) return "high";
  if (avg >= 0.5) return "medium";
  return "low";
}

// Normalize weights to sum to 1.0
function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const sum = Object.values(weights).reduce((a, b) => a + (b ?? 0), 0) || 1;
  const out: Record<string, number> = {};
  for (const k of Object.keys(weights)) {
    out[k] = (weights[k] ?? 0) / sum;
  }
  return out;
}

const validateAPOScore = (score: number, context: string): number => {
  const validated = Math.max(0, Math.min(100, score));
  if (Math.abs(score - validated) > 0.1) {
    console.log(`APO score validation: ${context} adjusted from ${score} to ${validated}`);
  }
  return validated;
};

// ---------------------------------------------------------------------------
// O*NET data grounding: fetch real task/knowledge/skill/ability/tech data
// ---------------------------------------------------------------------------
interface OnetContext {
  tasks: Array<{ description: string; importance?: number; type?: string }>;
  knowledge: Array<{ name: string; importance?: number; level?: number }>;
  skills: Array<{ name: string; importance?: number; level?: number }>;
  abilities: Array<{ name: string; importance?: number; level?: number }>;
  technologies: Array<{ name: string; category?: string; is_hot?: boolean }>;
}

async function fetchOnetContext(
  supabase: any,
  occupationCode: string,
): Promise<OnetContext> {
  const empty: OnetContext = { tasks: [], knowledge: [], skills: [], abilities: [], technologies: [] };
  if (!supabase) return empty;

  try {
    // Fire all queries in parallel for speed
    const [tasksRes, knowledgeRes, skillsRes, abilitiesRes, techRes] = await Promise.all([
      supabase
        .from('onet_detailed_tasks')
        .select('task_description, importance, task_type')
        .eq('occupation_code', occupationCode)
        .order('importance', { ascending: false })
        .limit(20),
      supabase
        .from('onet_knowledge')
        .select('name, importance, level')
        .eq('occupation_code', occupationCode)
        .order('importance', { ascending: false })
        .limit(15),
      // Skills table doesn't exist yet — try onet_knowledge pattern; gracefully fail
      supabase
        .from('onet_abilities') // will reuse abilities table structure for skills if needed
        .select('name, importance, level')
        .eq('occupation_code', occupationCode)
        .order('importance', { ascending: false })
        .limit(15)
        .then((r: any) => r), // placeholder — overridden below if skills table exists
      supabase
        .from('onet_abilities')
        .select('name, importance, level')
        .eq('occupation_code', occupationCode)
        .order('importance', { ascending: false })
        .limit(15),
      supabase
        .from('onet_technologies')
        .select('technology_name, category, is_hot_technology')
        .eq('occupation_code', occupationCode)
        .limit(20),
    ]);

    return {
      tasks: (tasksRes.data || []).map((t: any) => ({
        description: t.task_description,
        importance: t.importance ? Number(t.importance) : undefined,
        type: t.task_type,
      })),
      knowledge: (knowledgeRes.data || []).map((k: any) => ({
        name: k.name,
        importance: k.importance ? Number(k.importance) : undefined,
        level: k.level ? Number(k.level) : undefined,
      })),
      skills: [], // Dedicated skills table not yet migrated; LLM will infer from other context
      abilities: (abilitiesRes.data || []).map((a: any) => ({
        name: a.name,
        importance: a.importance ? Number(a.importance) : undefined,
        level: a.level ? Number(a.level) : undefined,
      })),
      technologies: (techRes.data || []).map((t: any) => ({
        name: t.technology_name,
        category: t.category,
        is_hot: t.is_hot_technology,
      })),
    };
  } catch (e) {
    console.warn('O*NET context fetch failed (non-fatal, LLM will generate from training data):', e);
    return empty;
  }
}

function formatOnetContextForPrompt(ctx: OnetContext): string {
  const lines: string[] = [];
  if (ctx.tasks.length) {
    lines.push('\nO*NET TASK STATEMENTS (authoritative — use these as the basis for task items):');
    ctx.tasks.forEach((t, i) => {
      const imp = t.importance != null ? ` [importance=${t.importance.toFixed(1)}]` : '';
      lines.push(`  ${i + 1}. ${t.description}${imp}`);
    });
  }
  if (ctx.knowledge.length) {
    lines.push('\nO*NET KNOWLEDGE AREAS:');
    ctx.knowledge.forEach((k) => {
      const meta = [k.importance != null ? `imp=${k.importance.toFixed(1)}` : '', k.level != null ? `lv=${k.level.toFixed(1)}` : ''].filter(Boolean).join(', ');
      lines.push(`  - ${k.name}${meta ? ` [${meta}]` : ''}`);
    });
  }
  if (ctx.abilities.length) {
    lines.push('\nO*NET ABILITIES:');
    ctx.abilities.forEach((a) => {
      const meta = [a.importance != null ? `imp=${a.importance.toFixed(1)}` : '', a.level != null ? `lv=${a.level.toFixed(1)}` : ''].filter(Boolean).join(', ');
      lines.push(`  - ${a.name}${meta ? ` [${meta}]` : ''}`);
    });
  }
  if (ctx.technologies.length) {
    lines.push('\nO*NET TECHNOLOGIES:');
    ctx.technologies.forEach((t) => {
      const hot = t.is_hot ? ' [HOT]' : '';
      const cat = t.category ? ` (${t.category})` : '';
      lines.push(`  - ${t.name}${cat}${hot}`);
    });
  }
  if (!lines.length) {
    lines.push('\n(No O*NET data available for this occupation; generate items from research knowledge.)');
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// APO result caching: check apo_logs for recent matching result
// ---------------------------------------------------------------------------
const CACHE_TTL_HOURS = Number(Deno.env.get('APO_CACHE_TTL_HOURS') ?? '24');

async function getCachedResult(
  supabase: any,
  occupationCode: string,
  configId: string | null,
): Promise<any | null> {
  if (!supabase || CACHE_TTL_HOURS <= 0) return null;
  try {
    const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 3600_000).toISOString();
    let query = supabase
      .from('apo_logs')
      .select('overall_apo, model_json, computed_items, category_scores, weights, ci_lower, ci_upper, ci_iterations, bls_trend_pct, bls_adjustment_pts, econ_viability_discount, sector_delay_months, industry_sector')
      .eq('occupation_code', occupationCode)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(1);
    if (configId) query = query.eq('config_id', configId);
    const { data, error } = await query.maybeSingle();
    if (error || !data) return null;
    console.log(`Cache HIT for ${occupationCode} (within ${CACHE_TTL_HOURS}h)`);
    return data;
  } catch (e) {
    console.warn('Cache lookup failed (non-fatal):', e);
    return null;
  }
}

serve(async (req) => {
  console.log('Enhanced Calculate APO function invoked');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  const origin = req.headers.get('origin') || '';
  const baseHeaders = buildCorsHeaders(origin);
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    if (!isOriginPermitted(origin)) {
      return new Response(null, { status: 403, headers: baseHeaders });
    }
    return new Response(null, { headers: baseHeaders });
  }

  try {
    if (!geminiApiKey) {
      console.error('Gemini API key is not configured');
      throw new Error('Gemini API key is not configured');
    }

    // Optional API key enforcement (run before rate limiting to avoid leaking rate-limit behavior to unauthenticated callers)
    const requiredApiKey = Deno.env.get('APO_FUNCTION_API_KEY');
    if (requiredApiKey) {
      const providedKey = req.headers.get('x-api-key');
      if (providedKey !== requiredApiKey) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...baseHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Lightweight rate limiting (per-minute)
    const rateLimitMax = Number(Deno.env.get('APO_RATE_LIMIT_PER_MIN') ?? '30');
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rl = rateLimit(ip, { windowMs: 60_000, max: rateLimitMax });
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...baseHeaders, 'Content-Type': 'application/json', 'X-RateLimit-Limit': String(rateLimitMax), 'X-RateLimit-Remaining': String(rl.remaining), 'X-RateLimit-Reset': String(rl.resetMs) },
      });
    }

    const requestBody = await req.text();
    // Avoid logging full request bodies to reduce risk of sensitive data exposure
    // console.log('Request body received');
    let parsedBody: any;
    try {
      parsedBody = JSON.parse(requestBody);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      throw new Error('Invalid JSON in request body');
    }

    // Backward compatibility: support legacy shape { occupation_code, occupation_title }
    if (!parsedBody.occupation && parsedBody.occupation_code && parsedBody.occupation_title) {
      parsedBody.occupation = { code: String(parsedBody.occupation_code), title: String(parsedBody.occupation_title) };
    }

    const { occupation } = RequestSchema.parse(parsedBody);

    console.log(`Calculating enhanced APO for occupation: ${occupation.title} (${occupation.code})`);

    // Create service client (used for config and telemetry)
    // Fallback to header-provided service key and derive URL from request when env is missing.
    const rawUrl = new URL(req.url);
    const host = rawUrl.hostname;
    const derivedBaseUrl = host.endsWith('.functions.supabase.co')
      ? `https://${host.replace('.functions.supabase.co', '.supabase.co')}`
      : `${rawUrl.protocol}//${host}`;
    const headerApiKey = (req.headers.get('x-service-key') || '').trim()
      || ((req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim())
      || (req.headers.get('apikey') || '').trim();
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('PROJECT_URL') || derivedBaseUrl;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || headerApiKey || '';
    const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;
    if (!supabase) console.warn('Supabase service client not available; using DEFAULT_* config');

    // Resolve user_id and cohort (subscription tier) from Authorization header when available
    const authHeader = req.headers.get('Authorization') || '';
    let userId: string | null = null;
    let cohort: string | null = null;
    if (supabase && authHeader) {
      try {
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || supabaseKey;
        const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
        const { data: userRes } = await userClient.auth.getUser();
        userId = userRes?.user?.id ?? null;
        if (userId) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('user_id', userId)
            .maybeSingle();
          cohort = (prof as any)?.subscription_tier ?? null;
        }
      } catch (e) {
        console.warn('User resolution failed:', e);
      }
    }

    // Fetch active apo_config (T3)
    let configId: string | null = null;
    let weightsUsed = { ...DEFAULT_CATEGORY_WEIGHTS } as Record<string, number>;
    let factorMultipliersUsed = { ...DEFAULT_FACTOR_MULTIPLIERS } as Record<string, number>;
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('apo_config')
          .select('id, weights, factor_multipliers')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          configId = data.id as string;
          if (data.weights) weightsUsed = { ...weightsUsed, ...data.weights } as any;
          if (data.factor_multipliers) factorMultipliersUsed = { ...factorMultipliersUsed, ...data.factor_multipliers } as any;
        }
      } catch (e) {
        console.warn('apo_config fetch failed, using defaults:', e);
      }
    }

    // Ensure weights sum to 1.0 after DB merge
    weightsUsed = normalizeWeights(weightsUsed);

    // APO-2: Check cache before expensive LLM call
    const cached = await getCachedResult(supabase, occupation.code, configId);
    if (cached) {
      // Reconstruct response from cached telemetry row
      const cachedResponse = {
        overallAPO: cached.overall_apo,
        categoryBreakdown: cached.category_scores,
        tasks: (cached.computed_items as any)?.filter?.((i: any) => i.category === 'tasks') || [],
        knowledge: (cached.computed_items as any)?.filter?.((i: any) => i.category === 'knowledge') || [],
        skills: (cached.computed_items as any)?.filter?.((i: any) => i.category === 'skills') || [],
        abilities: (cached.computed_items as any)?.filter?.((i: any) => i.category === 'abilities') || [],
        technologies: (cached.computed_items as any)?.filter?.((i: any) => i.category === 'technologies') || [],
        ci: cached.ci_lower != null ? { lower: cached.ci_lower, upper: cached.ci_upper, iterations: cached.ci_iterations } : undefined,
        externalSignals: {
          blsTrendPct: cached.bls_trend_pct,
          blsAdjustmentPts: cached.bls_adjustment_pts,
          industrySector: cached.industry_sector,
          sectorDelayMonths: cached.sector_delay_months,
          econViabilityDiscount: cached.econ_viability_discount,
        },
        metadata: { analysis_version: '2.1-cached', calculation_method: 'deterministic+gemini', timestamp: new Date().toISOString() },
        confidence: 'medium',
        timeline: 'medium_term',
        insights: { primary_opportunities: [], main_challenges: [], automation_drivers: [], barriers: [] },
        _cached: true,
      };
      const responseBody = { analysis: cachedResponse, ...cachedResponse };
      return new Response(JSON.stringify(responseBody), {
        headers: { ...baseHeaders, 'Content-Type': 'application/json', 'X-APO-Cache': 'HIT' },
      });
    }

    // APO-1: Fetch real O*NET data to ground the LLM
    const onetContext = await fetchOnetContext(supabase, occupation.code);
    const onetDataBlock = formatOnetContextForPrompt(onetContext);
    const hasOnetData = onetContext.tasks.length > 0 || onetContext.knowledge.length > 0 || onetContext.abilities.length > 0 || onetContext.technologies.length > 0;
    console.log(`O*NET grounding: ${onetContext.tasks.length} tasks, ${onetContext.knowledge.length} knowledge, ${onetContext.abilities.length} abilities, ${onetContext.technologies.length} technologies`);

    // Revised strict JSON-only system prompt (T5) — now grounded in O*NET data
    const prompt = `You are an expert AI automation analyst specializing in workforce transformation, using a research-driven methodology (Frey & Osborne 2013; OECD/Arntz et al. 2016; ILO 2025) grounded in O*NET data. Output MUST be ONLY valid JSON conforming to the schema. Do NOT include any prose or code fences. No extra keys.\n\nRules:\n- Work item-first, then aggregate to categories (tasks, knowledge, skills, abilities, technologies), then overall.\n- Use controlled factor vocabulary only: ["routine","data_driven","creative","social","physical_complex","judgment","compliance","genai_boost","economic_viability","productivity_enhancement","insufficient_evidence"].\n- If evidence is weak, set low confidence and include "insufficient_evidence".\n- Category APO should equal the weighted mean of items[].apo (by item importance) within ±5 points; adjust items if misaligned.\n- Overall APO is weighted average of category_apos (equal unless tech-heavy: technologies +10%).\n- Reconcile contradictions (e.g., high barriers with high APO) by adjusting affected items (-10–20%).\n- Prefer partial task automation/augmentation over full replacement; penalize full automation unless most items >80%.${hasOnetData ? '\n- CRITICAL: Base your task items on the O*NET TASK STATEMENTS provided below. Use the provided importance scores to set metadata.importance. Do NOT invent tasks when real ones are given.' : ''}\n\nContext:\nOccupation: ${occupation.title}\nONET_Code: ${occupation.code}${onetDataBlock}\n\nSCHEMA (JSON):\n{\n  "overall_apo": 0.0-100.0,\n  "items": [\n    {\n      "category": "tasks|knowledge|skills|abilities|technologies",\n      "description": "string",\n      "factors": ["routine"|"data_driven"|"creative"|"social"|"physical_complex"|"judgment"|"compliance"|"genai_boost"|"economic_viability"|"productivity_enhancement"|"insufficient_evidence"],\n      "explanation": "string (<=280 chars)",\n      "timeline": "immediate|short_term|medium_term|long_term",\n      "confidence": 0.0-1.0,\n      "metadata": { "importance": 0.0-1.0, "frequency": "low|medium|high", "skill_level": 1-5, "tech_adoption": 0.0-1.0 }\n    }\n  ],\n  "category_apos": {\n    "tasks": { "apo": 0.0-100.0, "confidence": "low|medium|high" },\n    "knowledge": { "apo": 0.0-100.0, "confidence": "low|medium|high" },\n    "skills": { "apo": 0.0-100.0, "confidence": "low|medium|high" },\n    "abilities": { "apo": 0.0-100.0, "confidence": "low|medium|high" },\n    "technologies": { "apo": 0.0-100.0, "confidence": "low|medium|high" }\n  },\n  "timeline_projections": { "immediate": 0.0-100.0, "short_term": 0.0-100.0, "medium_term": 0.0-100.0, "long_term": 0.0-100.0, "explanation": "string" },\n  "key_factors": { "bottlenecks": ["string"], "gen_ai_impacts": ["string"], "adaptation_strategies": ["string"] },\n  "recommendations": ["string"],\n  "clarifications_needed": ["string"]\n}\n\nEXAMPLE (valid, compact):\n{\n  "overall_apo": 62.5,\n  "items": [{"category":"tasks","description":"Process invoices","factors":["routine","data_driven"],"explanation":"Highly routine data workflows","timeline":"short_term","confidence":0.8,"metadata":{"importance":0.7,"frequency":"high","skill_level":2,"tech_adoption":0.8}}],\n  "category_apos": {"tasks":{"apo":70,"confidence":"high"},"knowledge":{"apo":45,"confidence":"medium"},"skills":{"apo":55,"confidence":"medium"},"abilities":{"apo":40,"confidence":"medium"},"technologies":{"apo":80,"confidence":"high"}},\n  "timeline_projections": {"immediate":40,"short_term":55,"medium_term":70,"long_term":80,"explanation":"Adoption increases with tooling"},\n  "key_factors": {"bottlenecks":["manual approvals"],"gen_ai_impacts":["document extraction"],"adaptation_strategies":["process redesign"]},\n  "recommendations":["adopt OCR"],\n  "clarifications_needed":[]\n}`;

    console.log('Requesting Gemini analysis via GeminiClient');
    const client = new GeminiClient();
    const perCallConfig = { temperature: 0.1, topK: 1, topP: 0.8, maxOutputTokens: 2048 } as const;
    const started = Date.now();
    const { text: generatedText, usageMetadata } = await client.generateContent(prompt, perCallConfig);
    const latency = Date.now() - started;
    const effectiveConfig = { ...getEnvGenerationDefaults(), ...perCallConfig };
    const effectiveModel = getEnvModel();
    console.log('Generated analysis length:', generatedText?.length || 0);

    // Strict JSON parsing + validation
    let parsed: unknown;
    try {
      parsed = JSON.parse(generatedText);
    } catch (_e) {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in model response');
      const rawJson = jsonMatch[0];
      try {
        parsed = JSON.parse(rawJson);
      } catch (innerErr) {
        try {
          const repaired = jsonrepair(rawJson);
          parsed = JSON.parse(repaired);
        } catch (repairErr) {
          console.error('Failed to repair Gemini JSON output', { generatedText: generatedText.slice(0, 2000) });
          throw repairErr;
        }
      }
    }

    const apo = ApoSchema.parse(parsed);

    // Deterministic item -> category -> overall computation
    const computedItems = apo.items.map((it) => ({
      ...it,
      computedAPO: computeItemAPO(it as any, factorMultipliersUsed),
    }));

    const byCat = {
      tasks: computedItems.filter(i => i.category === 'tasks'),
      knowledge: computedItems.filter(i => i.category === 'knowledge'),
      skills: computedItems.filter(i => i.category === 'skills'),
      abilities: computedItems.filter(i => i.category === 'abilities'),
      technologies: computedItems.filter(i => i.category === 'technologies'),
    } as const;

    const categoryScores = Object.fromEntries(Object.entries(byCat).map(([cat, items]) => {
      const values = items.map(i => i.computedAPO);
      const weights = items.map(i => (i.metadata.importance ?? 0.5) * (i.confidence ?? 0.6));
      const confAvg = items.length ? (items.reduce((a, b) => a + (b.confidence ?? 0.6), 0) / items.length) : 0.5;
      return [cat, {
        apo: clamp100(weightedMean(values, weights)),
        confidence: confidenceBand(confAvg),
      }];
    })) as Record<string, { apo: number; confidence: "low"|"medium"|"high" }>;

    // Overall weighting: start from config weights; if tech-heavy, add +10% to technologies by subtracting evenly from others
    let weights = { ...weightsUsed } as Record<string, number>;
    const techItems = byCat.technologies;
    if (techItems.length) {
      const avgTechAdoption = techItems.reduce((a, b) => a + (b.metadata.tech_adoption ?? 0.5), 0) / techItems.length;
      if (avgTechAdoption >= 0.6) {
        const delta = 0.1;
        const others = ["tasks","knowledge","skills","abilities"] as const;
        weights.technologies = (weights.technologies ?? 0) + delta;
        for (const c of others) {
          weights[c] = Math.max(0, (weights[c] ?? 0) - delta / others.length);
        }
        // Renormalize to sum 1
        const sum = Object.values(weights).reduce((a,b)=>a+b,0) || 1;
        for (const k of Object.keys(weights)) weights[k] = weights[k] / sum;
      }
    }
    const overallApo = clamp100(
      (categoryScores.tasks?.apo ?? 0) * weights.tasks +
      (categoryScores.knowledge?.apo ?? 0) * weights.knowledge +
      (categoryScores.skills?.apo ?? 0) * weights.skills +
      (categoryScores.abilities?.apo ?? 0) * weights.abilities +
      (categoryScores.technologies?.apo ?? 0) * weights.technologies
    );
    console.log('Deterministic overall APO:', overallApo);

    // External adjustments (BLS trend + Economics) and Confidence Intervals (Monte Carlo)
    let finalApo = overallApo;
    let ciLower: number | null = null;
    let ciUpper: number | null = null;
    let ciIterations: number | null = null;
    let blsTrendPct: number | null = null;
    let blsAdjustmentPts: number | null = null;
    let industrySector: string | null = null;
    let sectorDelayMonths: number | null = null;
    let econViabilityDiscount: number | null = null;

    // Helper: convert SOC-8 to SOC-6 (e.g., 15-1252.00 -> 15-1252)
    const toSoc6 = (soc8: string): string => {
      const m = soc8.match(/^(\d{2}-\d{4})/);
      return m ? m[1] : soc8;
    };

    // Helper: simple gaussian noise (Box-Muller) centered at 0 with std dev
    const randn = (std = 1): number => {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * std;
    };

    // Fetch BLS trend and sector economics if service client is available
    try {
      if (supabase) {
        // BLS trend
        const soc6 = toSoc6(occupation.code);
        const { data: blsRows } = await supabase
          .from('bls_employment_data')
          .select('year, employment_level, projected_growth_10y, median_wage_annual')
          .eq('occupation_code_6', soc6)
          .order('year', { ascending: true });
        if (blsRows && blsRows.length) {
          // Prefer projected_growth_10y if present on latest year
          const latest = blsRows[blsRows.length - 1];
          if (typeof latest.projected_growth_10y === 'number') {
            blsTrendPct = latest.projected_growth_10y;
          } else {
            // Compute CAGR from first and last employment_level if available
            const firstEmp = blsRows.find(r => typeof r.employment_level === 'number')?.employment_level ?? null;
            const lastEmp = [...blsRows].reverse().find(r => typeof r.employment_level === 'number')?.employment_level ?? null;
            const yearsSpan = blsRows[blsRows.length - 1].year - blsRows[0].year;
            if (firstEmp && lastEmp && yearsSpan > 0) {
              const cagr = Math.pow(lastEmp / firstEmp, 1 / yearsSpan) - 1;
              blsTrendPct = Math.round(cagr * 10000) / 100; // percent with 2 decimals
            }
          }
          if (typeof blsTrendPct === 'number') {
            // Map trend to conservative adjustment in [-5, +5] points
            if (blsTrendPct <= -3) blsAdjustmentPts = 3;
            else if (blsTrendPct >= 5) blsAdjustmentPts = -3;
            else blsAdjustmentPts = 0;
            finalApo = clamp100(finalApo + (blsAdjustmentPts || 0));
          }
        }

        // Sector mapping via enrichment (career_cluster -> sector)
        const { data: enr } = await supabase
          .from('onet_occupation_enrichment')
          .select('career_cluster, median_wage_annual')
          .eq('occupation_code', occupation.code)
          .maybeSingle();
        const cluster = (enr as any)?.career_cluster as string | undefined;
        const wageFromEnrichment = (enr as any)?.median_wage_annual as number | undefined;
        const clusterToSector: Record<string, string> = {
          'Health Science': 'Healthcare',
          'Finance': 'Finance',
          'Manufacturing': 'Manufacturing',
          'Information Technology': 'Technology',
          'Education & Training': 'Education',
          'Marketing': 'Retail',
          'Transportation, Distribution & Logistics': 'Transportation',
          'Law, Public Safety, Corrections & Security': 'Government',
          'Government & Public Administration': 'Government',
          'Business Management & Administration': 'Business',
          'Architecture & Construction': 'Construction',
          'Hospitality & Tourism': 'Hospitality',
          'Human Services': 'Services',
          'Science, Technology, Engineering & Mathematics': 'Technology',
          'Agriculture, Food & Natural Resources': 'Agriculture',
          'Arts, Audio/Video Technology & Communications': 'Media'
        };
        industrySector = cluster ? (clusterToSector[cluster] || cluster) : null;

        // Economics lookup (aggregate for sector if detailed task categories not mapped yet)
        if (industrySector) {
          const { data: econRows } = await supabase
            .from('automation_economics')
            .select('implementation_cost_low, implementation_cost_high, roi_timeline_months, technology_maturity, wef_adoption_score, regulatory_friction, min_org_size, annual_labor_cost_threshold')
            .eq('industry_sector', industrySector);
          if (econRows && econRows.length) {
            // Average cost band across rows (placeholder until task_category mapping is added)
            const lowAvg = econRows.map(r => Number(r.implementation_cost_low || 0)).filter(n => n > 0);
            const highAvg = econRows.map(r => Number(r.implementation_cost_high || 0)).filter(n => n > 0);
            const avgCost = (lowAvg.length && highAvg.length) ? ((lowAvg.reduce((a,b)=>a+b,0)/lowAvg.length + highAvg.reduce((a,b)=>a+b,0)/highAvg.length) / 2) : null;
            const frictionValues = econRows.map(r => String(r.regulatory_friction || 'medium'));
            const frictionRank = (s: string) => s === 'high' ? 3 : s === 'low' ? 1 : 2;
            const avgFriction = frictionValues.length ? frictionValues.sort((a,b)=>frictionRank(a)-frictionRank(b))[Math.floor(frictionValues.length/2)] : 'medium';
            sectorDelayMonths = avgFriction === 'high' ? 24 : avgFriction === 'medium' ? 12 : 0;

            // Labor cost proxy from BLS wage or enrichment
            let annualWage = wageFromEnrichment ?? null;
            if (!annualWage && blsRows && blsRows.length) {
              const lastWithWage = [...blsRows].reverse().find(r => typeof r.median_wage_annual === 'number');
              annualWage = lastWithWage?.median_wage_annual ?? null;
            }
            if (avgCost && annualWage) {
              const threshold = 3 * annualWage;
              if (avgCost > threshold) {
                econViabilityDiscount = 10; // subtract up to 10 points for poor ROI
                finalApo = clamp100(finalApo - econViabilityDiscount);
              } else {
                econViabilityDiscount = 0;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('External adjustments failed (non-fatal):', e);
    }

    // APO-4: Confidence-scaled Monte Carlo CI — noise inversely scaled by confidence
    try {
      const N = Number(Deno.env.get('APO_CI_ITERATIONS') ?? '200');
      const sims: number[] = [];
      // Map confidence label to noise std dev: low confidence = wider band
      const confToNoise = (conf: string): number => {
        if (conf === 'high') return 0.02;   // ±2% noise
        if (conf === 'medium') return 0.05; // ±5% noise
        return 0.10;                         // ±10% noise for low confidence
      };
      for (let i = 0; i < N; i++) {
        const cs = {
          tasks: clamp100((categoryScores.tasks?.apo ?? 0) * (1 + randn(confToNoise(categoryScores.tasks?.confidence ?? 'low')))),
          knowledge: clamp100((categoryScores.knowledge?.apo ?? 0) * (1 + randn(confToNoise(categoryScores.knowledge?.confidence ?? 'low')))),
          skills: clamp100((categoryScores.skills?.apo ?? 0) * (1 + randn(confToNoise(categoryScores.skills?.confidence ?? 'low')))),
          abilities: clamp100((categoryScores.abilities?.apo ?? 0) * (1 + randn(confToNoise(categoryScores.abilities?.confidence ?? 'low')))),
          technologies: clamp100((categoryScores.technologies?.apo ?? 0) * (1 + randn(confToNoise(categoryScores.technologies?.confidence ?? 'low')))),
        };
        let sim = clamp100(
          cs.tasks * weights.tasks +
          cs.knowledge * weights.knowledge +
          cs.skills * weights.skills +
          cs.abilities * weights.abilities +
          cs.technologies * weights.technologies
        );
        if (typeof blsAdjustmentPts === 'number') sim = clamp100(sim + blsAdjustmentPts * (1 + randn(0.2)));
        if (typeof econViabilityDiscount === 'number') sim = clamp100(sim - econViabilityDiscount * (1 + randn(0.2)));
        sims.push(sim);
      }
      sims.sort((a,b)=>a-b);
      const q = (p: number) => sims[Math.max(0, Math.min(sims.length - 1, Math.floor(p * (sims.length - 1))))];
      ciLower = Math.round(q(0.05) * 100) / 100;
      ciUpper = Math.round(q(0.95) * 100) / 100;
      ciIterations = sims.length;
    } catch (e) {
      console.warn('CI computation failed (non-fatal):', e);
    }

    // Cross-field validation (T4): compare model category_apos with computed aggregates
    const validationWarnings: string[] = [];
    for (const cat of ["tasks","knowledge","skills","abilities","technologies"] as const) {
      const modelCat = (apo.category_apos as any)?.[cat]?.apo;
      const compCat = (categoryScores as any)?.[cat]?.apo;
      if (typeof modelCat === 'number' && typeof compCat === 'number') {
        const delta = Math.abs(modelCat - compCat);
        if (delta > 5) validationWarnings.push(`Category ${cat} apo mismatch: model=${modelCat.toFixed(1)}, computed=${compCat.toFixed(1)}, delta=${delta.toFixed(1)}`);
      }
    }

    // Transform to enhanced response format
    const transformedData = {
      code: occupation.code,
      title: occupation.title,
      description: `AI-analyzed occupation with deterministic APO assessment using research-driven methodology.`,
      overallAPO: validateAPOScore(finalApo, 'final APO with external adjustments'),
      confidence: (() => {
        // overall confidence from mean of category confidences
        const map = { low: 0.3, medium: 0.6, high: 0.85 } as const;
        const cs = Object.values(categoryScores).map(c => map[c.confidence]);
        const avg = cs.length ? cs.reduce((a,b)=>a+b,0)/cs.length : 0.6;
        return avg >= 0.75 ? 'high' : avg >= 0.5 ? 'medium' : 'low';
      })(),
      timeline: (() => {
        // choose the projection bucket with max value if provided
        if (!apo.timeline_projections) return 'unknown';
        const entries: Array<[string, number]> = [
          ['immediate', apo.timeline_projections.immediate ?? 0],
          ['short_term', apo.timeline_projections.short_term ?? 0],
          ['medium_term', apo.timeline_projections.medium_term ?? 0],
          ['long_term', apo.timeline_projections.long_term ?? 0],
        ];
        entries.sort((a,b)=>b[1]-a[1]);
        const top = entries[0];
        return top && top[1] > 0 ? top[0] : 'unknown';
      })(),
      tasks: byCat.tasks.map((item: any) => ({
        description: item.description,
        apo: clamp100(item.computedAPO),
        factors: item.factors || [],
        timeline: item.timeline || 'medium_term'
      })),
      knowledge: byCat.knowledge.map((item: any) => ({
        description: item.description,
        apo: clamp100(item.computedAPO),
        factors: item.factors || [],
        timeline: item.timeline || 'medium_term'
      })),
      skills: byCat.skills.map((item: any) => ({
        description: item.description,
        apo: clamp100(item.computedAPO),
        factors: item.factors || [],
        timeline: item.timeline || 'medium_term'
      })),
      abilities: byCat.abilities.map((item: any) => ({
        description: item.description,
        apo: clamp100(item.computedAPO),
        factors: item.factors || [],
        timeline: item.timeline || 'medium_term'
      })),
      technologies: byCat.technologies.map((item: any) => ({
        description: item.description,
        apo: clamp100(item.computedAPO),
        factors: item.factors || [],
        timeline: item.timeline || 'short_term'
      })),
      categoryBreakdown: {
        tasks: { apo: categoryScores.tasks?.apo ?? 0, confidence: categoryScores.tasks?.confidence ?? 'medium' },
        knowledge: { apo: categoryScores.knowledge?.apo ?? 0, confidence: categoryScores.knowledge?.confidence ?? 'medium' },
        skills: { apo: categoryScores.skills?.apo ?? 0, confidence: categoryScores.skills?.confidence ?? 'medium' },
        abilities: { apo: categoryScores.abilities?.apo ?? 0, confidence: categoryScores.abilities?.confidence ?? 'medium' },
        technologies: { apo: categoryScores.technologies?.apo ?? 0, confidence: categoryScores.technologies?.confidence ?? 'medium' }
      },
      insights: {
        primary_opportunities: apo.key_factors?.gen_ai_impacts || [],
        main_challenges: apo.key_factors?.bottlenecks || [],
        automation_drivers: apo.key_factors?.gen_ai_impacts || [],
        barriers: apo.key_factors?.bottlenecks || []
      },
      metadata: {
        analysis_version: '3.0',
        calculation_method: 'deterministic_formula',
        weights_used: weights,
        timestamp: new Date().toISOString()
      },
      ci: (ciLower != null && ciUpper != null) ? { lower: ciLower, upper: ciUpper, iterations: ciIterations } : undefined,
      externalSignals: {
        blsTrendPct: blsTrendPct ?? undefined,
        blsAdjustmentPts: blsAdjustmentPts ?? undefined,
        industrySector: industrySector ?? undefined,
        sectorDelayMonths: sectorDelayMonths ?? undefined,
        econViabilityDiscount: econViabilityDiscount ?? undefined
      }
    };

    console.log('Successfully created enhanced APO analysis');

    // Telemetry: persist APO run (PII-safe)
    try {
      if (supabase) {
        const pHash = await sha256Hex(prompt);
        const modelJson = ApoSchema.parse(parsed); // already validated
        const insertPayload = {
          occupation_code: occupation.code,
          occupation_title: occupation.title,
          prompt_hash: pHash,
          model: effectiveModel,
          generation_config: effectiveConfig as unknown as Record<string, unknown>,
          model_json: modelJson as unknown as Record<string, unknown>,
          computed_items: computedItems as unknown as Record<string, unknown>,
          category_scores: categoryScores as unknown as Record<string, unknown>,
          overall_apo: finalApo,
          weights: weights as unknown as Record<string, unknown>,
          config_id: configId,
          factor_multipliers: factorMultipliersUsed as unknown as Record<string, unknown>,
          validation_warnings: validationWarnings as unknown as string[],
          tokens_used: usageMetadata?.totalTokens ?? null,
          latency_ms: latency,
          user_id: userId,
          cohort: cohort,
          ci_lower: ciLower,
          ci_upper: ciUpper,
          ci_iterations: ciIterations,
          bls_trend_pct: blsTrendPct,
          bls_adjustment_pts: blsAdjustmentPts,
          econ_viability_discount: econViabilityDiscount,
          sector_delay_months: sectorDelayMonths,
          industry_sector: industrySector,
          data_provenance: {
            bls: typeof blsTrendPct === 'number',
            economics: typeof industrySector === 'string'
          } as unknown as Record<string, unknown>,
          error: null,
        } as const;
        await supabase.from('apo_logs').insert(insertPayload as any);
      } else {
        console.warn('apo_logs: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      }
    } catch (e) {
      console.warn('apo_logs insert failed:', e);
    }

    // Backward compatibility: also include { analysis } wrapper
    const responseBody = { analysis: transformedData, ...transformedData } as const;

    // Attach rate limit headers on success
    return new Response(JSON.stringify(responseBody), {
      headers: { ...baseHeaders, 'Content-Type': 'application/json', ...(typeof rl !== 'undefined' ? { 'X-RateLimit-Limit': String(rateLimitMax), 'X-RateLimit-Remaining': String(rl.remaining), 'X-RateLimit-Reset': String(rl.resetMs) } : {}) },
    });
  } catch (error) {
    console.error('Error in enhanced calculate-apo function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      function: 'calculate-apo-enhanced',
      version: '2.0'
    }), {
      status: 500,
      headers: { ...baseHeaders, 'Content-Type': 'application/json' },
    });
  }
});
