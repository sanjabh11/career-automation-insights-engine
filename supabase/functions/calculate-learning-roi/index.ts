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
        const { employeeId, courseId, cost } = await req.json();

        // STUB: Calculate ROI
        const mockResponse = {
            roi: 245, // 245%
            projectedValue: 15000,
            breakEvenMonths: 3.5,
            skillsGained: ['Data Analysis', 'Python'],
            productivityBoost: '15%'
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
