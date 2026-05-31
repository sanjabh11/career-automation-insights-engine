import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GeminiClient, getEnvModel, getEnvGenerationDefaults } from "../../lib/GeminiClient.ts";
import { SYSTEM_PROMPT_SKILL_RECOMMENDATIONS } from "../../lib/prompts.ts";
import { jsonrepair } from "https://esm.sh/jsonrepair@3.0.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

type JsonRecord = Record<string, unknown>;

interface SkillRecommendationRequest {
  occupation_code?: string;
  occupation_title?: string;
}

interface TaskAssessmentRow {
  task_description?: string | null;
  category?: string | null;
}

interface SkillRecommendation {
  skill_name: string;
  explanation: string;
  priority: number;
}

interface SkillRecommendationRow extends SkillRecommendation {
  occupation_code?: string;
}

interface SkillRecommendationInsert {
  occupation_code: string;
  skill_name: string;
  explanation: string;
  priority: number;
}

const resolveEnv = (...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = Deno.env.get(key);
    if (value && value.trim().length > 0) return value.trim();
  }
  return undefined;
};

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const normalizeRecommendation = (value: unknown, index: number): SkillRecommendation | null => {
  if (!isRecord(value)) return null;
  const skillName = asString(value.skill_name) || asString(value.skill) || asString(value.name);
  if (!skillName) return null;
  return {
    skill_name: skillName,
    explanation: asString(value.explanation) || asString(value.reason) || asString(value.rationale) || 'No explanation provided.',
    priority: asNumber(value.priority) ?? index + 1,
  };
};

const normalizeRecommendations = (value: unknown): SkillRecommendation[] => {
  const source = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.recommendations)
      ? value.recommendations
      : isRecord(value) && Array.isArray(value.skills)
        ? value.skills
        : [];
  return source.flatMap((item, index) => {
    const normalized = normalizeRecommendation(item, index);
    return normalized ? [normalized] : [];
  });
};

const parseRecommendations = (generatedText: string): SkillRecommendation[] => {
  const attempts: string[] = [];
  attempts.push(generatedText);
  const jsonMatch = generatedText.match(/\[[\s\S]*\]/) || generatedText.match(/\{[\s\S]*\}/);
  if (jsonMatch) attempts.push(jsonMatch[0]);

  for (const raw of attempts) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      const normalized = normalizeRecommendations(parsed);
      if (normalized.length > 0) return normalized;
    } catch (_e) {
      try {
        const parsed = JSON.parse(jsonrepair(raw)) as unknown;
        const normalized = normalizeRecommendations(parsed);
        if (normalized.length > 0) return normalized;
      } catch (_e2) {
        // Try the next extraction candidate.
      }
    }
  }

  throw new Error('Gemini response did not include usable skill recommendations');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Gemini API key is not configured', function: 'skill-recommendations' }), { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const requestBody = await req.json() as SkillRecommendationRequest;
    const { occupation_code, occupation_title } = requestBody;
    
    if (!occupation_code || !occupation_title) {
      throw new Error('Occupation code and title are required');
    }

    console.log(`Generating skill recommendations for: ${occupation_title} (${occupation_code})`);

    // Initialize Supabase client (optional)
    const supabaseUrl = resolveEnv('SUPABASE_URL', 'PROJECT_URL', 'VITE_SUPABASE_URL', 'PUBLIC_SUPABASE_URL') || '';
    const supabaseKey = resolveEnv('SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY') || '';
    const canDb = !!supabaseUrl && !!supabaseKey;
    const supabase = canDb ? createClient(supabaseUrl, supabaseKey) : null;

    // Check if we already have cached recommendations
    let cachedRecommendations: SkillRecommendationRow[] | null = null;
    if (supabase) {
      const { data } = await supabase
        .from('ai_skill_recommendations')
        .select('*')
        .eq('occupation_code', occupation_code)
        .order('priority', { ascending: true });
      cachedRecommendations = (data as SkillRecommendationRow[] | null) || null;
    }

    if (cachedRecommendations && cachedRecommendations.length > 0) {
      console.log('Using cached skill recommendations');
      return new Response(JSON.stringify(cachedRecommendations), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch task assessments for this occupation
    let taskAssessments: TaskAssessmentRow[] = [];
    if (supabase) {
      const { data } = await supabase
        .from('ai_task_assessments')
        .select('*')
        .eq('occupation_code', occupation_code);
      taskAssessments = (data as TaskAssessmentRow[] | null) || [];
    }

    // Build prompt with centralized system instruction + context
    const taskContext = taskAssessments && taskAssessments.length > 0
      ? `\n\nTask analysis for this occupation:\n${taskAssessments.map((task) => `- ${task.task_description || 'Task description unavailable'} (Category: ${task.category || 'Uncategorized'})`).join('\n')}`
      : '';
    
    const prompt = `${SYSTEM_PROMPT_SKILL_RECOMMENDATIONS}

Occupation: ${occupation_title} (O*NET code: ${occupation_code})${taskContext}`;

    // Call Gemini API using env-driven model/config
    const envDefaults = getEnvGenerationDefaults();
    const generationConfig = { ...envDefaults, temperature: 0.2, topK: 1, topP: 0.8, maxOutputTokens: 2048 };
    const client = new GeminiClient(GEMINI_API_KEY);
    const { text: generatedText } = await client.generateContent(prompt, generationConfig);
    
    // Extract JSON from response
    const recommendationsData = parseRecommendations(generatedText);

    // Store recommendations in Supabase
    const recommendationsInserts: SkillRecommendationInsert[] = recommendationsData.map((rec) => ({
      occupation_code,
      skill_name: rec.skill_name,
      explanation: rec.explanation,
      priority: rec.priority
    }));

    if (supabase) {
      const { error: insertError } = await supabase
        .from('ai_skill_recommendations')
        .insert(recommendationsInserts);
      if (insertError) {
        console.error('Error storing skill recommendations:', insertError);
      }
    }

    // Removed runtime sample inserts — rely on migration seeds and UI empty states

    return new Response(JSON.stringify(recommendationsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in skill-recommendations function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString(),
      function: 'skill-recommendations'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
