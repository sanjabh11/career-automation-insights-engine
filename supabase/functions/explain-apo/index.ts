import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { GeminiClient, getEnvGenerationDefaults, getEnvModel } from "../../lib/GeminiClient.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsonrepair } from "https://esm.sh/jsonrepair@3.0.2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, x-api-key, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
} as const;

const RequestSchema = z.object({
  occupation: z.object({ code: z.string().min(1), title: z.string().min(1) }),
  analysis: z
    .object({
      overallAPO: z.number().min(0).max(100),
      categoryBreakdown: z.object({
        tasks: z.object({ apo: z.number(), confidence: z.string() }).optional(),
        knowledge: z.object({ apo: z.number(), confidence: z.string() }).optional(),
        skills: z.object({ apo: z.number(), confidence: z.string() }).optional(),
        abilities: z.object({ apo: z.number(), confidence: z.string() }).optional(),
        technologies: z.object({ apo: z.number(), confidence: z.string() }).optional(),
      }),
      tasks: z.array(z.object({ description: z.string(), apo: z.number(), factors: z.array(z.string()).optional() })).optional(),
      knowledge: z.array(z.object({ description: z.string(), apo: z.number(), factors: z.array(z.string()).optional() })).optional(),
      skills: z.array(z.object({ description: z.string(), apo: z.number(), factors: z.array(z.string()).optional() })).optional(),
      abilities: z.array(z.object({ description: z.string(), apo: z.number(), factors: z.array(z.string()).optional() })).optional(),
      technologies: z.array(z.object({ description: z.string(), apo: z.number(), factors: z.array(z.string()).optional() })).optional(),
      ci: z.object({ lower: z.number().optional(), upper: z.number().optional(), iterations: z.number().optional() }).optional(),
    })
    .optional(),
});

const RESPONSE_SCHEMA_DESC = `{
  "narrative": "string (200-600 chars, executive-friendly explanation of why the APO looks this way)",
  "waterfall": [
    { "category": "tasks|knowledge|skills|abilities|technologies", "apo_contribution": "number (± points)", "rationale": "string (<=180 chars)" }
  ],
  "top_factors": ["string"],
  "uncertainties": ["string"],
  "next_steps": ["string"],
  "disclaimer": "string (<=160 chars)"
}`;

function buildPrompt(input: z.infer<typeof RequestSchema>): string {
  const { occupation, analysis } = input;
  const cat = analysis?.categoryBreakdown || {};
  const lines: string[] = [];
  lines.push(
    `You are an explainable-AI analyst. Produce ONLY valid JSON per the schema. No code fences. No extra keys.`
  );
  lines.push(`Context:`);
  lines.push(`Occupation: ${occupation.title}`);
  lines.push(`SOC: ${occupation.code}`);
  if (analysis) {
    lines.push(`Overall_APO: ${analysis.overallAPO}`);
    const cb = analysis.categoryBreakdown as any;
    lines.push(`Category_APOs: tasks=${cb?.tasks?.apo ?? 0}, knowledge=${cb?.knowledge?.apo ?? 0}, skills=${cb?.skills?.apo ?? 0}, abilities=${cb?.abilities?.apo ?? 0}, technologies=${cb?.technologies?.apo ?? 0}`);
  }
  const sampleItems = (k: string) => (analysis as any)?.[k]?.slice(0, 5) || [];
  const items = {
    tasks: sampleItems('tasks'),
    knowledge: sampleItems('knowledge'),
    skills: sampleItems('skills'),
    abilities: sampleItems('abilities'),
    technologies: sampleItems('technologies'),
  };
  lines.push(`Representative items (up to 5 each): ${JSON.stringify(items)}`);
  lines.push(`
SCHEMA:
${RESPONSE_SCHEMA_DESC}

Rules:
- Be faithful to provided numbers; the waterfall should reconcile approximately to overall APO (±5 pts).
- Use plain language and reference concrete factors (routine, data_driven, creative, social, physical_complex, judgment, compliance, genai_boost).
- Keep narrative concise and decision-oriented; avoid jargon.
- If CI provided, reflect uncertainty succinctly.
- Output ONLY JSON.`);
  return lines.join("\n");
}

function buildHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin || "*";
  return { ...corsHeaders, "Access-Control-Allow-Origin": allowOrigin } as Record<string, string>;
}

serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const baseHeaders = buildHeaders(origin);
  if (req.method === "OPTIONS") return new Response(null, { headers: baseHeaders });

  try {
    // Optional API key gate similar to calculate-apo
    const requiredApiKey = Deno.env.get("APO_FUNCTION_API_KEY");
    if (requiredApiKey) {
      const providedKey = req.headers.get("x-api-key");
      if (providedKey !== requiredApiKey) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...baseHeaders, "Content-Type": "application/json" } });
      }
    }

    const bodyText = await req.text();
    let body: any;
    try {
      body = JSON.parse(bodyText);
    } catch (_e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...baseHeaders, "Content-Type": "application/json" } });
    }

    const parsed = RequestSchema.parse(body);

    const prompt = buildPrompt(parsed);
    const client = new GeminiClient();
    const started = Date.now();
    const perCall = { temperature: 0.1, topK: 1, topP: 0.8, maxOutputTokens: 1024 } as const;
    const { text } = await client.generateContent(prompt, perCall);
    const latency = Date.now() - started;

    let json: any;
    try {
      json = JSON.parse(text);
    } catch (_e) {
      const match = text.match(/\{[\s\S]*\}/);
      const raw = match ? match[0] : text;
      try {
        json = JSON.parse(raw);
      } catch (_e2) {
        json = JSON.parse(jsonrepair(raw));
      }
    }

    // Basic shape checks to guard UI
    if (!json || typeof json !== "object" || !Array.isArray(json.waterfall)) {
      throw new Error("Model did not return expected JSON shape");
    }

    // Minimal telemetry (PII-safe)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      if (supabaseUrl && supabaseKey) {
        const sb = createClient(supabaseUrl, supabaseKey);
        await sb.from("llm_logs").insert({
          function_name: "explain-apo",
          prompt: prompt.slice(0, 500),
          response: JSON.stringify(json).slice(0, 2000),
          model: getEnvModel(),
          generation_config: { ...getEnvGenerationDefaults(), ...perCall },
          latency_ms: latency,
          created_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn("Telemetry insert failed (non-fatal)", e);
    }

    return new Response(JSON.stringify({ explanation: json }), { headers: { ...baseHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("explain-apo error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...baseHeaders, "Content-Type": "application/json" } });
  }
});
