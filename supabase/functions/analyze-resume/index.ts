import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Analyze Resume for Automation Risk
 * 
 * Parses resume text, detects automation-prone phrases, and generates
 * rewrite suggestions to emphasize strategic/creative skills.
 * 
 * @param resume_text - Extracted resume text (from PDF or manual input)
 * @param user_id - Optional user ID for storage
 */

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { resume_text, user_id, filename = 'resume.txt' } = await req.json();

        if (!resume_text) {
            throw new Error('resume_text is required');
        }

        const startTime = Date.now();

        // Initialize clients
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        const geminiModel = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

        if (!geminiApiKey) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        // Prepare Gemini prompt for automation risk analysis
        const analysisPrompt = `You are an expert career counselor analyzing resumes for automation risk.

Analyze this resume and identify:
1. Automation-prone phrases (keywords that indicate routine, repetitive, or easily automated work)
2. Strategic rewrites for each problematic phrase (emphasize strategic thinking, creativity, human judgment)
3. Overall automation risk score (0-100, where 100 = highest risk)
4. Detected skills (both technical and soft skills)
5. Recommended skills to add (to reduce automation risk)

Resume:
${resume_text}

Respond in JSON format:
{
  "automation_risk_score": <number 0-100>,
  "confidence_score": <number 0-1>,
  "automation_prone_phrases": [
    {
      "phrase": "<exact phrase from resume>",
      "context": "<surrounding sentence for context>",
      "severity": "<low|medium|high>",
      "reason": "<why this phrase signals automation risk>"
    }
  ],
  "rewrite_suggestions": [
    {
      "original": "<original phrase>",
      "suggested": "<rewritten phrase>",
      "rationale": "<why this rewrite reduces automation risk>"
    }
  ],
  "detected_skills": ["<skill1>", "<skill2>", ...],
  "recommended_skills": [
    {
      "skill": "<skill name>",
      "reason": "<why this skill reduces automation risk>",
      "priority": "<high|medium|low>"
    }
  ]
}`;

        // Call Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: analysisPrompt }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        responseMimeType: "application/json"
                    }
                })
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
        }

        const geminiData = await geminiResponse.json();
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error('No response from Gemini API');
        }

        // Parse JSON response (handle markdown code blocks if present)
        let analysisResult;
        try {
            const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
            const jsonText = jsonMatch ? jsonMatch[1] : responseText;
            analysisResult = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', responseText);
            throw new Error('Invalid JSON response from Gemini');
        }

        const processingTime = Date.now() - startTime;

        // Store analysis if user_id provided
        let analysisId = null;
        if (user_id) {
            const { data: insertedAnalysis, error: insertError } = await supabase
                .from('resume_analyses')
                .insert({
                    user_id,
                    filename,
                    resume_text,
                    automation_risk_score: analysisResult.automation_risk_score,
                    confidence_score: analysisResult.confidence_score,
                    automation_prone_phrases: analysisResult.automation_prone_phrases,
                    rewrite_suggestions: analysisResult.rewrite_suggestions,
                    detected_skills: analysisResult.detected_skills,
                    recommended_skills: analysisResult.recommended_skills,
                    gemini_model: geminiModel,
                    processing_time_ms: processingTime
                })
                .select('id')
                .single();

            if (!insertError && insertedAnalysis) {
                analysisId = insertedAnalysis.id;
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                analysis_id: analysisId,
                ...analysisResult,
                metadata: {
                    model: geminiModel,
                    processing_time_ms: processingTime
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        );

    } catch (error) {
        console.error('Error in analyze-resume:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        );
    }
});
