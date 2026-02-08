import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { occupationCode } = await req.json()

        // Mock data for now, as we don't have O*NET API keys
        // In a real implementation, this would query the O*NET API
        const relatedOccupations = [
            {
                code: '15-1252.00',
                title: 'Software Developers',
                similarity_score: 0.85,
                relationship_type: 'similar_skills'
            },
            {
                code: '15-1251.00',
                title: 'Computer Programmers',
                similarity_score: 0.82,
                relationship_type: 'similar_skills'
            },
            {
                code: '15-1299.08',
                title: 'Computer Systems Engineers/Architects',
                similarity_score: 0.78,
                relationship_type: 'similar_skills'
            }
        ]

        return new Response(JSON.stringify(relatedOccupations), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
