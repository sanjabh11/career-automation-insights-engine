import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GeminiClient } from "../../lib/GeminiClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  occupationCode: z.string(),
  occupationTitle: z.string(),
  gapSkills: z.array(z.string().min(2)).min(1).max(20),
  userId: z.string().uuid(),
});

// Instantiate GeminiClient inside handler to ensure env is available at runtime

export async function handler(req: Request) {
  console.log("[DEBUG] handling personalized-skill-recommendations request");
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { occupationCode, occupationTitle, gapSkills, userId } = requestSchema.parse(
      await req.json(),
    );
    const prompt = `You are a career coach. For the occupation ${occupationTitle} (${occupationCode}), the user lacks the following skills: ${gapSkills.join(", ")}. For each missing skill, recommend a concrete learning action (e.g., online course, project) with an estimated effort level (hours). Return JSON array [{skill, recommendation, effortHours}].`;
    const gemini = new GeminiClient();
    const { text } = await gemini.generateContent(prompt);
    let recommendations: any[] = [];
    try {
      recommendations = JSON.parse(text);
    } catch {
      recommendations = gapSkills.map((s) => ({ skill: s, recommendation: `Self-study ${s}`, effortHours: 10 }));
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    await supabase.from("ai_skill_recommendations").insert(
      recommendations.map((r) => ({
        user_id: userId,
        occupation_code: occupationCode,
        skill_name: r.skill,
        recommendation: r.recommendation,
        effort_hours: r.effortHours,
      })),
    );
    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("personalized-skill-recommendations error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

if (import.meta.main) {
  serve(handler);
}
