import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEnvModel, getEnvGenerationDefaults } from "../../lib/GeminiClient.ts";

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

    // Validate O*NET credentials (username/password required - no API key fallback)
    if (!ONET_USERNAME || !ONET_PASSWORD) {
      throw new Error('O*NET credentials not configured: set ONET_USERNAME and ONET_PASSWORD');
    }

    const { occupation_code, occupation_title } = await req.json();
    
    if (!occupation_code || !occupation_title) {
      throw new Error('Occupation code and title are required');
    }

    console.log(`Analyzing tasks for occupation: ${occupation_title} (${occupation_code})`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if we already have cached task analysis
    const { data: cachedAnalysis } = await supabase
      .from('ai_task_assessments')
      .select('*')
      .eq('occupation_code', occupation_code)
      .limit(20);

    if (cachedAnalysis && cachedAnalysis.length > 0) {
      console.log('Using cached task analysis');
      
      // Transform to expected format
      const tasks = cachedAnalysis.map(task => ({
        description: task.task_description,
        category: task.category,
        explanation: task.explanation,
        confidence: task.confidence
      }));
      
      return new Response(JSON.stringify({ tasks }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build Authorization header for O*NET (Basic auth)
    const basicToken = btoa(`${ONET_USERNAME}:${ONET_PASSWORD}`);
    const onetResponse = await fetch(`https://services.onetcenter.org/ws/online/occupations/${occupation_code}/details`, {
      headers: {
        'Authorization': `Basic ${basicToken}`,
        'Accept': 'application/json'
      }
    });

    if (!onetResponse.ok) {
      throw new Error(`O*NET API request failed: ${onetResponse.statusText}`);
    }

    const onetData = await onetResponse.json();
    
    // Handle different possible structures of the O*NET response
    let tasksToProcess: any[] = [];
    
    if (onetData.tasks) {
      if (Array.isArray(onetData.tasks)) {
        // Direct array of tasks
        tasksToProcess = onetData.tasks;
      } else if (onetData.tasks.task) {
        // Tasks nested under 'task' property
        tasksToProcess = Array.isArray(onetData.tasks.task) ? onetData.tasks.task : [onetData.tasks.task];
      } else if (onetData.tasks.items) {
        // Tasks nested under 'items' property
        tasksToProcess = Array.isArray(onetData.tasks.items) ? onetData.tasks.items : [onetData.tasks.items];
      } else if (typeof onetData.tasks === 'object') {
        // Single task object
        tasksToProcess = [onetData.tasks];
      }
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

    // Prepare the prompt for Gemini
    const prompt = `
You are an expert in AI and automation analysis. Based on the research paper "Future of Work with AI Agents: Auditing Automation and Augmentation Potential across the All Workforce," analyze the following tasks for the occupation "${occupation_title}" (O*NET code: ${occupation_code}).

For each task, classify it into one of these categories:
1. Automate: Tasks that can be fully automated by AI (repetitive, rule-based, data-driven)
2. Augment: Tasks where AI can assist humans but human oversight is needed
3. Human-only: Tasks requiring uniquely human capabilities (creativity, empathy, complex judgment)

For each task, provide:
- The category (Automate, Augment, or Human-only)
- A brief explanation of why it falls into that category
- A confidence score (0.0 to 1.0) for your assessment

Tasks to analyze:
${taskDescriptions.map((task: string) => `- ${task}`).join('\n')}

Respond in this JSON format:
{
  "tasks": [
    {
      "description": "Task description",
      "category": "Automate/Augment/Human-only",
      "explanation": "Brief explanation",
      "confidence": 0.85
    }
  ]
}
`;

    // Call Gemini API using env-driven model/config
    const model = getEnvModel();
    const envDefaults = getEnvGenerationDefaults();
    const generationConfig = { ...envDefaults, temperature: 0.2, topK: 1, topP: 0.8, maxOutputTokens: 4096 } as const;
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
    let analysisData;
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', parseError);
      throw new Error('Failed to parse task analysis from Gemini');
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

    const { error: insertError } = await supabase
      .from('ai_task_assessments')
      .insert(taskInserts);

    if (insertError) {
      console.error('Error storing task assessments:', insertError);
    }

    return new Response(JSON.stringify(analysisData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-occupation-tasks function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      function: 'analyze-occupation-tasks'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});