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

const resolveEnv = (...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = Deno.env.get(key);
    if (value && value.trim().length > 0) return value.trim();
  }
  return undefined;
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

    const { occupation_code, occupation_title } = await req.json();
    
    if (!occupation_code || !occupation_title) {
      throw new Error('Occupation code and title are required');
    }

    console.log(`Generating skill recommendations for: ${occupation_title} (${occupation_code})`);

    // Initialize Supabase client (optional)
    const supabaseUrl = resolveEnv('SUPABASE_URL', 'PROJECT_URL', 'VITE_SUPABASE_URL', 'PUBLIC_SUPABASE_URL') || '';
    const supabaseKey = resolveEnv('SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY') || '';
    const canDb = !!supabaseUrl && !!supabaseKey;
    const supabase = canDb ? createClient(supabaseUrl, supabaseKey) : null as any;

    // Check if we already have cached recommendations
    let cachedRecommendations: any[] | null = null;
    if (canDb) {
      const { data } = await supabase
        .from('ai_skill_recommendations')
        .select('*')
        .eq('occupation_code', occupation_code)
        .order('priority', { ascending: true });
      cachedRecommendations = data || null;
    }

    if (cachedRecommendations && cachedRecommendations.length > 0) {
      console.log('Using cached skill recommendations');
      return new Response(JSON.stringify(cachedRecommendations), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch task assessments for this occupation
    let taskAssessments: any[] = [];
    if (canDb) {
      const { data } = await supabase
        .from('ai_task_assessments')
        .select('*')
        .eq('occupation_code', occupation_code);
      taskAssessments = data || [];
    }

    // Build prompt with centralized system instruction + context
    const taskContext = taskAssessments && taskAssessments.length > 0
      ? `\n\nTask analysis for this occupation:\n${taskAssessments.map((task: any) => `- ${task.task_description} (Category: ${task.category})`).join('\n')}`
      : '';
    
    const prompt = `${SYSTEM_PROMPT_SKILL_RECOMMENDATIONS}

Occupation: ${occupation_title} (O*NET code: ${occupation_code})${taskContext}`;

    // Call Gemini API using env-driven model/config
    const envDefaults = getEnvGenerationDefaults();
    const generationConfig = { ...envDefaults, temperature: 0.2, topK: 1, topP: 0.8, maxOutputTokens: 2048 };
    const client = new GeminiClient(GEMINI_API_KEY);
    const { text: generatedText } = await client.generateContent(prompt, generationConfig);
    
    // Extract JSON from response
    let recommendationsData: any[];
    try {
      recommendationsData = JSON.parse(generatedText);
    } catch (_e) {
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      const raw = jsonMatch ? jsonMatch[0] : generatedText;
      try {
        recommendationsData = JSON.parse(raw);
      } catch (_e2) {
        recommendationsData = JSON.parse(jsonrepair(raw));
      }
    }

    // Store recommendations in Supabase
    const recommendationsInserts = recommendationsData.map((rec: any) => ({
      occupation_code,
      skill_name: rec.skill_name,
      explanation: rec.explanation,
      priority: rec.priority
    }));

    if (canDb) {
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
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      function: 'skill-recommendations'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});