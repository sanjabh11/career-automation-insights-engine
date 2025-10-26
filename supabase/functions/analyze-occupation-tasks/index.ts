import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEnvModel, getEnvGenerationDefaults } from "../../lib/GeminiClient.ts";
import { SYSTEM_PROMPT_OCCUPATION_TASKS } from "../../lib/prompts.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
// Require username/password per O*NET Web Services (no API key fallback)
const ONET_USERNAME = Deno.env.get('ONET_USERNAME');
const ONET_PASSWORD = Deno.env.get('ONET_PASSWORD');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    const hasOnetCreds = !!ONET_USERNAME && !!ONET_PASSWORD;

    // Optional API key enforcement
    const requiredApiKey = Deno.env.get('LLM_FUNCTION_API_KEY');
    if (requiredApiKey) {
      const providedKey = req.headers.get('x-api-key') ?? '';
      if (providedKey !== requiredApiKey) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { occupation_code, occupation_title } = await req.json();
    
    if (!occupation_code || !occupation_title) {
      throw new Error('Occupation code and title are required');
    }

    console.log(`Analyzing tasks for occupation: ${occupation_title} (${occupation_code})`);

    // Initialize Supabase client (optional)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('PROJECT_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || '';
    const canCache = !!supabaseUrl && !!supabaseKey;
    const supabase = canCache ? createClient(supabaseUrl, supabaseKey) : null as any;

    if (canCache) {
      try {
        const { data: cachedAnalysis } = await supabase
          .from('ai_task_assessments')
          .select('*')
          .eq('occupation_code', occupation_code)
          .limit(20);
        if (cachedAnalysis && cachedAnalysis.length > 0) {
          const tasks = cachedAnalysis.map((task: any) => ({
            description: task.task_description,
            category: task.category,
            explanation: task.explanation,
            confidence: task.confidence
          }));
          return new Response(JSON.stringify({ tasks }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (e) {
        console.warn('Skipping cache lookup due to error:', e);
      }
    }

    let tasksToProcess: any[] = [];
    if (hasOnetCreds) {
      const basicToken = btoa(`${ONET_USERNAME}:${ONET_PASSWORD}`);
      const onetUrl = `https://services.onetcenter.org/ws/online/occupations/${occupation_code}/details`;
      console.log('Calling O*NET API:', onetUrl);
      const onetResponse = await fetch(onetUrl, {
        headers: {
          'Authorization': `Basic ${basicToken}`,
          'Accept': 'application/json'
        }
      });
      console.log('O*NET response status:', onetResponse.status);
      if (!onetResponse.ok) {
        const errorText = await onetResponse.text();
        console.error('O*NET API error response:', errorText);
      } else {
        const onetData = await onetResponse.json();
        if (onetData.tasks) {
          if (Array.isArray(onetData.tasks)) {
            tasksToProcess = onetData.tasks;
          } else if (onetData.tasks.task) {
            tasksToProcess = Array.isArray(onetData.tasks.task) ? onetData.tasks.task : [onetData.tasks.task];
          } else if (onetData.tasks.items) {
            tasksToProcess = Array.isArray(onetData.tasks.items) ? onetData.tasks.items : [onetData.tasks.items];
          } else if (typeof onetData.tasks === 'object') {
            tasksToProcess = [onetData.tasks];
          }
        }
      }
    }
    if (tasksToProcess.length === 0) {
      tasksToProcess = [
        { description: `Document core responsibilities for ${occupation_title}` },
        { description: `Identify automation candidates within ${occupation_title} workflows` },
        { description: `Collaborate with stakeholders to improve ${occupation_title} outcomes` },
        { description: `Create SOPs and quality checks for ${occupation_title} tasks` }
      ];
    }

    // Extract task descriptions from the processed tasks array
    const taskDescriptions: string[] = tasksToProcess.map((task: any) => {
      if (typeof task === 'string') {
        return task;
      } else if (task && typeof task === 'object') {
        return task.description || task.title || task.name || String(task);
      }
      return String(task);
    }).filter(desc => desc && desc.trim().length > 0);

    if (taskDescriptions.length === 0) {
      throw new Error('No tasks found for this occupation');
    }

    // Build prompt with centralized system instruction + context
    const prompt = `${SYSTEM_PROMPT_OCCUPATION_TASKS}

Occupation: ${occupation_title} (O*NET code: ${occupation_code})

Tasks to analyze:
${taskDescriptions.map((task: string) => `- ${task}`).join('\n')}`;

    // Call Gemini API using env-driven model/config
    const model = getEnvModel();
    const envDefaults = getEnvGenerationDefaults();
    const generationConfig = { 
      ...envDefaults, 
      temperature: 0.2, 
      topK: 1, 
      topP: 0.8, 
      maxOutputTokens: 4096,
      responseMimeType: "application/json"  // Force JSON mode
    } as const;
    
    // Simple exponential backoff for transient 503s from Gemini
    async function callGeminiWithRetry(maxAttempts = 3): Promise<any> {
      let attempt = 0;
      let lastStatus = 0;
      let lastText = '';
      while (attempt < maxAttempts) {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig
          }),
        });

        if (resp.ok) {
          try {
            return await resp.json();
          } catch (e) {
            const t = await resp.text();
            console.error('Gemini non-JSON response:', t.slice(0, 300));
            throw new Error('Gemini returned non-JSON response');
          }
        }

        lastStatus = resp.status;
        lastText = await resp.text();
        console.error(`Gemini API error (${lastStatus}) attempt ${attempt + 1}:`, lastText.slice(0, 400));
        if (resp.status !== 503) break; // only retry on overload
        const delayMs = 5000 * Math.pow(2, attempt); // 5s, 10s
        await new Promise(r => setTimeout(r, delayMs));
        attempt++;
      }
      throw new Error(`Gemini API request failed: ${lastStatus} ${lastText.slice(0, 200)}`);
    }

    const geminiData = await callGeminiWithRetry();
    
    if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = geminiData.candidates[0].content.parts[0].text;
    
    console.log('Gemini raw response:', generatedText.substring(0, 500));
    
    // Extract JSON from response (handle markdown code blocks)
    let analysisData;
    try {
      // Remove markdown code blocks if present
      let cleanedText = generatedText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        console.error('No JSON found in cleaned response:', cleanedText.substring(0, 200));
        throw new Error('No JSON found in response');
      }
      
      // Validate structure
      if (!analysisData.tasks || !Array.isArray(analysisData.tasks)) {
        console.error('Invalid structure - missing tasks array:', analysisData);
        throw new Error('Response missing tasks array');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      console.error('Raw text:', generatedText);
      // Fallback: map tasks to a minimal, consistent schema to avoid 500s
      analysisData = {
        tasks: taskDescriptions.slice(0, 10).map((d: string) => ({
          description: d,
          category: 'Augment',
          explanation: 'Default categorization fallback due to AI parse issue',
          confidence: 0.5
        }))
      };
    }

    // Store results in Supabase for future use
    const taskInserts = analysisData.tasks.map((task: any) => ({
      occupation_code,
      occupation_title,
      task_description: task.description,
      category: task.category,
      explanation: task.explanation,
      confidence: task.confidence
    }));

    if (canCache) {
      try {
        const { error: insertError } = await supabase
          .from('ai_task_assessments')
          .insert(taskInserts);
        if (insertError) {
          console.error('Error storing task assessments:', insertError);
        }
      } catch (e) {
        console.warn('Skipping cache insert due to error:', e);
      }
    }

    return new Response(JSON.stringify(analysisData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-occupation-tasks function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error stack:', errorStack);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorStack?.split('\n').slice(0, 3).join('\n'),
      timestamp: new Date().toISOString(),
      function: 'analyze-occupation-tasks'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});