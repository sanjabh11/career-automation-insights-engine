import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GeminiClient, getEnvModel } from "../../lib/GeminiClient.ts";
import { SYSTEM_PROMPT_CAREER_ROADMAP_V2 } from "../../lib/prompts.ts";

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
            throw new Error('Gemini API key not configured');
        }

        const { startingRole, targetRole } = await req.json();

        if (!targetRole) {
            throw new Error('Target role is required');
        }

        console.log(`Generating roadmap: ${startingRole || 'Entry Level'} -> ${targetRole}`);

        const client = new GeminiClient(GEMINI_API_KEY);
        const model = getEnvModel();

        const prompt = `${SYSTEM_PROMPT_CAREER_ROADMAP_V2}

USER CONTEXT:
Starting Role: ${startingRole || 'No prior experience (Entry Level)'}
Target Role: ${targetRole}

Generate the 5-phase roadmap now. Output ONLY valid JSON.`;

        const { text, usageMetadata } = await client.generateContent(prompt, {
            temperature: 0.4, // Slightly higher for creative but structured advice
            maxOutputTokens: 4000
        });

        // Parse JSON safely
        let roadmapData;
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                roadmapData = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("No JSON found in response");
            }
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.error("Raw Text:", text);
            throw new Error("Failed to parse AI response");
        }

        return new Response(JSON.stringify({ ...roadmapData, usageMetadata }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in generate-roadmap:', error);
        return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error",
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
