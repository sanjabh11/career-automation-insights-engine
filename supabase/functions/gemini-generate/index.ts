import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generationConfigSchema, getEnvModel, getEnvGenerationDefaults } from "../../lib/GeminiClient.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  // Pre-flight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const { prompt, generationConfig } = await req.json();
    if (!prompt) throw new Error('Prompt is required');

    const started = Date.now();

    // Build effective config from env defaults merged with request overrides
    const envDefaults = getEnvGenerationDefaults();
    const effectiveConfig = generationConfigSchema.parse({ ...envDefaults, ...(generationConfig ?? {}) });
    const model = getEnvModel();

    // Call Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const geminiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: effectiveConfig,
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini error: ${geminiResponse.statusText}. ${errorText}`);
    }

    const { candidates, usageMetadata } = await geminiResponse.json();
    if (!candidates?.length) throw new Error('Empty Gemini response');

    const text = candidates[0]?.content?.parts?.[0]?.text ?? '';

    const latency = Date.now() - started;

    // Log to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('llm_logs').insert({
      prompt,
      response: text,
      model,
      tokens_used: usageMetadata?.totalTokens ?? null,
      latency_ms: latency,
    });

    return new Response(JSON.stringify({ text, usageMetadata, latency_ms: latency }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('gemini-generate error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
