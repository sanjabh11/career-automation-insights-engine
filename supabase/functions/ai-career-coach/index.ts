import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GeminiClient } from "../../lib/GeminiClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------- Schema Definitions ----------
const messageSchema = z.object({
  role: z.enum(["user", "assistant"]).default("user"),
  content: z.string().min(1).max(2000),
});

const requestSchema = z.object({
  message: z.string().min(1).max(2000),
  conversationHistory: z.array(messageSchema).max(20).optional().default([]),
  userProfile: z
    .object({
      id: z.string().uuid(),
      occupationCode: z.string().optional(),
      careerGoals: z.string().optional(),
    })
    .optional(),
});



export async function handler(req: Request) {
  const gemini = new GeminiClient();
  // Handle CORS pre-flight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const started = Date.now();

  try {
    const json = await req.json();
    const { message, conversationHistory, userProfile } = requestSchema.parse(
      json
    )

    // Construct prompt
    const promptParts = [
      "You are an AI Career Coach specialising in automation potential and future-of-work analysis.",
      userProfile
        ? `User occupation: ${userProfile.occupationCode}\nGoals: ${userProfile.careerGoals}`
        : "",
      "Conversation history:\n" +
        conversationHistory
          .map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`)
          .join("\n"),
      `User: ${message}`,
      "Coach:",
    ].join("\n\n");

    const { text, usageMetadata } = await gemini.generateContent(promptParts);

    // Persist log
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    const userId = userProfile?.id ?? null;

    await supabase.from("llm_logs").insert({
      user_id: userId,
      prompt: promptParts,
      response: text,
      tokens_used: usageMetadata?.totalTokens ?? null,
      latency_ms: Date.now() - started,
    });

    const responseBody = {
      response: text,
      followUpQuestions: [], // future enhancement
      actionItems: [], // future enhancement
      usage: usageMetadata,
    };

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-career-coach error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

if (import.meta.main) {
  serve(handler);
}
