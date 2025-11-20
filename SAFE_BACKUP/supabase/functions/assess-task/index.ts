import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GeminiClient, getEnvModel, getEnvGenerationDefaults } from "../../lib/GeminiClient.ts";
import { jsonrepair } from "https://esm.sh/jsonrepair@3.0.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const resolveEnv = (...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = Deno.env.get(key);
    if (value && value.trim().length > 0) {
      return value.trim();
    }
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
      return new Response(JSON.stringify({ error: 'Gemini API key is not configured', function: 'assess-task' }), { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { taskDescription, occupationContext } = await req.json();
    
    if (!taskDescription) {
      throw new Error('Task description is required');
    }

    console.log(`Assessing task: "${taskDescription.substring(0, 50)}..."`);
    if (occupationContext) {
      console.log(`Occupation context: ${occupationContext}`);
    }

    // Initialize Supabase client
    const supabaseUrl = resolveEnv('SUPABASE_URL', 'PROJECT_URL', 'VITE_SUPABASE_URL', 'PUBLIC_SUPABASE_URL') || '';
    const supabaseKey = resolveEnv('SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const prompt = `You are an AI assistant assessing task automation potential. Based on the task description${occupationContext ? ` for the occupation "${occupationContext}"` : ''}, classify it as one of: Automate, Augment, Human-only. Provide a brief explanation and a confidence score (0-1). Output ONLY JSON with keys category, explanation, confidence.\nTask description: ${taskDescription}`;

    const client = new GeminiClient(GEMINI_API_KEY);
    const envDefaults = getEnvGenerationDefaults();
    const generationConfig = { ...envDefaults, temperature: 0.2, topK: 1, topP: 0.8, maxOutputTokens: 1024 } as const;
    const { text } = await client.generateContent(prompt, generationConfig);

    let assessmentData: any;
    try {
      assessmentData = JSON.parse(text);
    } catch (_e) {
      const match = text.match(/\{[\s\S]*\}/);
      const raw = match ? match[0] : text;
      try {
        assessmentData = JSON.parse(raw);
      } catch (_e2) {
        assessmentData = JSON.parse(jsonrepair(raw));
      }
    }

    // Get user ID from auth if available
    let userId = null;
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id;
      }
    } catch (authError) {
      console.error('Auth error:', authError);
    }

    // Store assessment in Supabase if user is authenticated
    if (userId) {
      const { error: insertError } = await supabase
        .from('ai_task_assessments')
        .insert({
          user_id: userId,
          occupation_code: 'custom',
          occupation_title: occupationContext || 'Custom Task',
          task_description: taskDescription,
          category: assessmentData.category,
          explanation: assessmentData.explanation,
          confidence: assessmentData.confidence
        });

      if (insertError) {
        console.error('Error storing task assessment:', insertError);
      }
    }

    return new Response(JSON.stringify(assessmentData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in assess-task function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      function: 'assess-task'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});