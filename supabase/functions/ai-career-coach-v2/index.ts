import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { message, conversationId, userId } = await req.json();

        // STUB: Return mock AI career coaching response
        const mockResponse = {
            conversationId: conversationId || `conv_${Date.now()}`,
            message: message,
            aiResponse: {
                text: `Based on your career goals and the current automation trends, I recommend focusing on developing skills in AI integration and data analysis. These areas show strong growth potential and are less susceptible to automation. Would you like me to suggest specific learning paths?`,
                recommendations: [
                    {
                        type: 'skill',
                        name: 'Machine Learning Fundamentals',
                        priority: 'high',
                        timeEstimate: '3-4 months'
                    },
                    {
                        type: 'career_path',
                        name: 'Data Scientist',
                        apoScore: 28.5,
                        growth: 'Strong demand (+35% over 5 years)'
                    }
                ],
                nextSteps: [
                    'Complete an ML fundamentals course',
                    'Build 2-3 portfolio projects',
                    'Network with professionals in the field'
                ]
            },
            metadata: {
                model: 'ai-coach-v2',
                timestamp: new Date().toISOString(),
                contextUsed: true
            }
        };

        return new Response(
            JSON.stringify(mockResponse),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        );
    }
});
