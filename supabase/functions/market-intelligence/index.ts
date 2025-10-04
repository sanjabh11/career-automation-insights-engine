import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GeminiClient } from "../../lib/GeminiClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Request schema
const requestSchema = z.object({
  occupation: z.string().min(1),
  occupationCode: z.string().optional(),
  location: z.string().optional().default("United States"),
  timeframe: z.number().min(1).max(10).optional().default(5),
});

/**
 * Market Intelligence Analyzer
 * 
 * Per LLM.md lines 293-356: Analyze job market conditions and predict trends
 * for specific occupations using real-time data and AI analysis.
 */
export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const started = Date.now();

  try {
    const json = await req.json();
    const { occupation, occupationCode, location, timeframe } = requestSchema.parse(json);

    console.log(`Market intelligence analysis for: ${occupation} in ${location}`);

    // Initialize clients
    const gemini = new GeminiClient();
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch job market data from SerpAPI (if available)
    let jobMarketContext = "";
    try {
      const jobsResponse = await fetch(
        `${req.url.split('/market-intelligence')[0]}/serpapi-jobs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobTitle: occupation }),
        }
      );
      
      if (jobsResponse.ok) {
        const jobData = await jobsResponse.json();
        jobMarketContext = `
Current Job Market Data:
- Total job postings: ${jobData.totalJobs || "Unknown"}
- Average salary: ${jobData.averageSalary ? `$${jobData.averageSalary}` : "Data unavailable"}
- Top locations: ${jobData.topLocations?.map((l: any) => l.location).join(", ") || "N/A"}
- Market trending: ${jobData.trending ? "Yes" : "No"}
`;
      }
    } catch (e) {
      console.warn("Job market data fetch failed:", e);
    }

    // Construct comprehensive prompt per LLM.md specification
    const prompt = `You are a labor market intelligence expert analyzing current conditions and future trends for the occupation: "${occupation}" ${occupationCode ? `(O*NET Code: ${occupationCode})` : ""}.

Location: ${location}
Analysis Timeframe: ${timeframe} years

${jobMarketContext}

Your task is to provide a comprehensive market intelligence analysis covering:

1. **Demand Trends**: Current job posting volume, growth rates, and trajectory
2. **Skill Requirements**: Evolving skill demands and emerging competencies
3. **Salary Trends**: Compensation patterns and changes over time
4. **Geographic Patterns**: Regional opportunities and variations
5. **AI Integration Impact**: How AI/automation is transforming this role
6. **Future Outlook**: 3-5 year predictions with confidence levels

Output ONLY valid JSON in this exact format:
{
  "marketSummary": {
    "demandLevel": "High|Medium|Low",
    "growthRate": "X% annually",
    "averageSalary": "$XX,XXX",
    "topLocations": ["City1", "City2", "City3"],
    "keyTrend": "Brief trend description"
  },
  "skillEvolution": {
    "emergingSkills": ["skill1", "skill2", "skill3"],
    "decliningSkills": ["skill1", "skill2"],
    "stableSkills": ["skill1", "skill2", "skill3"]
  },
  "opportunities": [
    {
      "trend": "Description of opportunity",
      "impact": "Percentage or description",
      "timeline": "Next X months/years",
      "preparationSteps": ["step1", "step2"]
    }
  ],
  "threats": [
    {
      "risk": "Description of risk",
      "likelihood": "High|Medium|Low",
      "mitigation": "How to mitigate this risk"
    }
  ],
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3"
  ],
  "confidence": "high|medium|low",
  "dataSource": "Analysis based on current market data and trends"
}`;

    console.log("Requesting market intelligence from Gemini");
    const { text, usageMetadata } = await gemini.generateContent(prompt, {
      temperature: 0.3,
      topK: 10,
      topP: 0.9,
      maxOutputTokens: 2048,
    });

    // Parse JSON response
    let analysis: any;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      throw new Error("Invalid response format from AI");
    }

    // Log to database
    try {
      await supabase.from("llm_logs").insert({
        user_id: null,
        prompt: `Market intelligence: ${occupation}`,
        response: JSON.stringify(analysis),
        tokens_used: usageMetadata?.totalTokens ?? null,
        latency_ms: Date.now() - started,
        function_name: "market-intelligence",
      });
    } catch (e) {
      console.warn("Failed to log to llm_logs:", e);
    }

    const responseBody = {
      ...analysis,
      occupation,
      location,
      timeframe,
      generatedAt: new Date().toISOString(),
      usage: usageMetadata,
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("market-intelligence error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

if (import.meta.main) {
  serve(handler);
}
