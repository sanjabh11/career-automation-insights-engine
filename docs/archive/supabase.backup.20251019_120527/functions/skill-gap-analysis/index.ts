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
  userSkills: z.array(z.string().min(2)).min(1).max(100),
  userId: z.string().uuid(),
});

const gemini = new GeminiClient();

export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const start = Date.now();

  try {
    const json = await req.json();
    const { occupationCode, occupationTitle, userSkills, userId } =
      requestSchema.parse(json);

    // Very simple prompt – in Phase-II this will reference DB descriptors
    const prompt = `You are a skill-gap analyst. The user has the following skills: ${userSkills.join(", ")}. The target occupation is ${occupationTitle} (${occupationCode}). List the top 5 skills the user is missing, ordered by importance. Return JSON array of strings.`;

    const { text } = await gemini.generateContent(prompt);
    let gaps: string[] = [];
    try {
      gaps = JSON.parse(text);
    } catch {
      // Fallback: split by comma / newline
      gaps = text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 5);
    }

    // Persist gaps (optional future table)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    await supabase.from("ai_skill_recommendations").insert(
      gaps.map((skill) => ({
        user_id: userId,
        occupation_code: occupationCode,
        skill_name: skill,
        created_at: new Date().toISOString(),
      })),
    );

    return new Response(
      JSON.stringify({
        gapSkills: gaps,
        latency_ms: Date.now() - start,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("skill-gap-analysis error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

if (import.meta.main) {
  serve(handler);
}
