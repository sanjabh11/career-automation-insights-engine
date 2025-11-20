import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GeminiClient } from "../../lib/GeminiClient.ts";
import { SYSTEM_PROMPT_CAREER_COACH } from "../../lib/prompts.ts";

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

    // Centralized system prompt
    const systemContext = SYSTEM_PROMPT_CAREER_COACH;

    const promptParts = [
      systemContext,
      userProfile
        ? `\nUser Context:\n- Occupation: ${userProfile.occupationCode || "Unknown"}\n- Career Goals: ${userProfile.careerGoals || "Not specified"}`
        : "",
      "\nConversation History:",
      conversationHistory.length > 0
        ? conversationHistory
            .map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`)
            .join("\n")
        : "No previous conversation",
      `\nUser: ${message}`,
      "\nCoach (respond ONLY with valid JSON):",
    ].join("\n");

    const { text, usageMetadata } = await gemini.generateContent(promptParts, {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 1500,
    });

    // Parse structured response
    let parsedResponse: any;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if AI didn't return JSON
        parsedResponse = {
          response: text,
          followUpQuestions: [],
          actionItems: [],
          insights: [],
        };
      }
    } catch (e) {
      console.warn("Failed to parse JSON response, using fallback");
      parsedResponse = {
        response: text,
        followUpQuestions: [],
        actionItems: [],
        insights: [],
      };
    }

    // Persist log
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    const userId = userProfile?.id ?? null;

    try {
      await supabase.from("llm_logs").insert({
        user_id: userId,
        prompt: `Career coach: ${message.substring(0, 100)}...`,
        response: JSON.stringify(parsedResponse),
        tokens_used: usageMetadata?.totalTokens ?? null,
        latency_ms: Date.now() - started,
        function_name: "ai-career-coach",
      });
    } catch (e) {
      console.warn("Failed to log to llm_logs:", e);
    }

    const responseBody = {
      response: parsedResponse.response || text,
      followUpQuestions: parsedResponse.followUpQuestions || [],
      actionItems: parsedResponse.actionItems || [],
      insights: parsedResponse.insights || [],
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
