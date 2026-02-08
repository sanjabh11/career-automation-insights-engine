import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

/**
 * Simulate Career/Automation Scenario using Gemini AI
 * 
 * Replaces mock data with real AI-powered projections based on:
 * - Industry automation trends
 * - Labor economics
 * - Change management timelines
 */

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { scenarioType, parameters } = await req.json();

        if (!scenarioType || !parameters) {
            throw new Error('scenarioType and parameters are required');
        }

        const startTime = Date.now();

        // Initialize Supabase and Gemini
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        const geminiModel = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

        if (!geminiApiKey) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        // Build comprehensive scenario analysis prompt
        const scenarioPrompt = `You are a workforce planning and automation expert. Simulate this scenario with realistic projections.

# SCENARIO DETAILS
Type: ${scenarioType}
Parameters: ${JSON.stringify(parameters, null, 2)}

# ANALYSIS TASK
Provide data-driven projections based on:
1. **Industry Automation Trends:** S-curve adoption rates for similar technologies
2. **Labor Economics:** Wage elasticity, replacement costs, productivity gains
3. **Change Management:** Organizational inertia, training curves, resistance factors
4. **Risk Factors:** Technical failures, employee pushback, regulatory changes

# OUTPUT FORMAT (JSON)
{
  "scenario_id": "<generate UUID>",
  "outcome": {
    "risk_level": "Low|Medium|High",
    "risk_justification": "Detailed explanation of why this risk level",
    "impact_score": <number 0-100>,
    "affected_roles": <number of employees>,
    "affected_role_titles": ["Role 1", "Role 2", ...],
    "savings_potential": <annual savings in USD>,
    "savings_breakdown": {
      "labor_cost_reduction": <$>,
      "efficiency_gains": <$>,
      "technology_costs": <$>,
      "training_costs": <$>,
      "net_savings": <$>
    },
    "timeline": "<estimated months to full implementation>",
    "timeline_breakdown": {
      "planning_phase": "<months>",
      "pilot_phase": "<months>",
      "rollout_phase": "<months>",
      "stabilization_phase": "<months>"
    },
    "confidence_level": <0-1 decimal>
  },
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "Specific actionable step",
      "rationale": "Why this matters",
      "estimated_cost": <$USD>,
      "roi_multiplier": <X.X>,
      "timeline": "<months>"
    }
  ],
  "risks_and_mitigation": [
    {
      "risk": "Description of risk",
      "probability": "Low|Medium|High",
      "impact": "Low|Medium|High",
      "mitigation": "How to address this"
    }
  ],
  "assumptions": [
    "Key assumption 1",
    "Key assumption 2"
  ]
}

Be realistic and data-driven. Cite industry benchmarks where possible.`;

        // Call Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: scenarioPrompt }]
                    }],
                    generationConfig: {
                        temperature: 0.4, // Balanced creativity and consistency
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
        let simulationResult;
        try {
            const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
            const jsonText = jsonMatch ? jsonMatch[1] : responseText;
            simulationResult = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', responseText);
            throw new Error('Invalid JSON response from Gemini');
        }

        const processingTime = Date.now() - startTime;

        // Store simulation in database for auditing
        const { error: insertError } = await supabase
            .from('automation_scenarios')
            .insert({
                scenario_type: scenarioType,
                parameters: parameters,
                simulation_result: simulationResult,
                confidence_score: simulationResult.outcome?.confidence_level || 0.7,
                processing_time_ms: processingTime,
                gemini_model: geminiModel
            });

        if (insertError) {
            console.error('Failed to store scenario:', insertError);
            // Non-blocking - continue anyway
        }

        return new Response(
            JSON.stringify({
                success: true,
                ...simulationResult,
                metadata: {
                    model: geminiModel,
                    processing_time_ms: processingTime,
                    cached: false
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error in simulate-scenario:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
