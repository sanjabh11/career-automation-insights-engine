import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEnvModel, getEnvGenerationDefaults } from "../../lib/GeminiClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Prepare the prompt for Gemini
    const prompt = `
You are an AI assistant assessing task automation potential. Based on the task description${occupationContext ? ` for the occupation "${occupationContext}"` : ''}, classify it as:

1. Automate (repetitive, low-value, stressful tasks that can be fully automated)
2. Augment (tasks that benefit from AI assistance but need human oversight)
3. Human-only (tasks requiring creativity, interpersonal skills, or domain expertise)

Provide a brief explanation and a confidence score (0-1).

Task description: ${taskDescription}

Output format: 
{
  "category": "Automate/Augment/Human-only",
  "explanation": "Brief explanation of why this task falls into this category",
  "confidence": 0.85
}
`;

    // Call Gemini API using env-driven model and defaults
    const model = getEnvModel();
    const envDefaults = getEnvGenerationDefaults();
    const generationConfig = { ...envDefaults, temperature: 0.2, topK: 1, topP: 0.8, maxOutputTokens: 1024 } as const;
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API Error:', errorText);
      throw new Error(`Gemini API request failed: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    
    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = geminiData.candidates[0].content.parts[0].text;
    
    // Extract JSON from response
    let assessmentData;
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        assessmentData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      throw new Error('Failed to parse task assessment from Gemini');
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