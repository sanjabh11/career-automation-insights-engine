import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GeminiClient } from "../../lib/GeminiClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const reqSchema = z.object({
  occupationCode: z.string(),
  occupationTitle: z.string(),
  recommendations: z.array(
    z.object({ skill: z.string(), recommendation: z.string() }),
  ).min(1).max(20),
  userId: z.string().uuid(),
});

const gemini = new GeminiClient();

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { occupationCode, occupationTitle, recommendations, userId } =
      reqSchema.parse(await req.json());

    const prompt = `You are a career learning-path generator. The user wants to become a competent ${occupationTitle}. Build a sequenced learning path covering the following skills with recommended actions: ${recommendations
      .map((r) => r.skill)
      .join(", ")}. Output JSON: {steps:[{order:int,skill:string,action:string,resources:[string]}], totalHours:int}`;

    const { text } = await gemini.generateContent(prompt);
    let plan: any = {};
    try {
      plan = JSON.parse(text);
    } catch {
      plan = { steps: recommendations.map((r, i) => ({ order: i + 1, skill: r.skill, action: r.recommendation, resources: [] })), totalHours: 40 };
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await supabase.from("learning_paths").insert({
      user_id: userId,
      occupation_code: occupationCode,
      plan,
    });

    return new Response(JSON.stringify({ plan }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
