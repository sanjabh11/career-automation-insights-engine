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
        const { scenarioType, parameters } = await req.json();

        // STUB: Simulate scenario
        const mockResponse = {
            scenarioId: `scen_${Date.now()}`,
            outcome: {
                riskLevel: 'Medium',
                impactScore: 65,
                affectedRoles: 12,
                savingsPotential: 250000,
                timeline: '18 months'
            },
            recommendations: [
                'Upskill support staff',
                'Invest in automation tools',
                'Review hiring plan'
            ]
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
