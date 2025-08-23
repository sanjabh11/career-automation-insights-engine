import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GeminiClient } from "../../lib/GeminiClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --------- Schema ---------
const requestSchema = z.object({
  occupationCode: z.string(),
  occupationTitle: z.string(),
  tasks: z.array(z.string().min(3)).min(1).max(50),
  userId: z.string().uuid(),
});

const gemini = new GeminiClient();

interface AssessmentResult {
  task: string;
  category: "Automate" | "Augment" | "Human-only";
  explanation: string;
  confidence: number;
}

export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const started = Date.now();

  try {
    const body = await req.json();
    const { occupationCode, occupationTitle, tasks, userId } = requestSchema.parse(
      body,
    );

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const assessments: AssessmentResult[] = [];

    // Prompt template
    const template = (
      t: string,
    ) => `You are an AI work-task assessor. Categorise the task below for automation potential using exactly one of the categories: Automate, Augment, Human-only. Provide a short justification and a confidence score (0-1). Return JSON with keys: category, explanation, confidence.\n\nTask: ${t}`;

    for (const task of tasks) {
      const { text } = await gemini.generateContent(template(task));
      // naive JSON parse fallback
      let parsed: AssessmentResult | null = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        // attempt regex extraction
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        }
      }
      if (!parsed) {
        parsed = {
          task,
          category: "Human-only",
          explanation: "Unable to parse model response",
          confidence: 0.3,
        };
      } else {
        parsed.task = task;
      }
      assessments.push(parsed);
    }

    // Insert into DB
    const rows = assessments.map((a) => ({
      user_id: userId,
      occupation_code: occupationCode,
      occupation_title: occupationTitle,
      task_description: a.task,
      category: a.category,
      explanation: a.explanation,
      confidence: a.confidence,
    }));

    await supabase.from("ai_task_assessments").insert(rows);

    const latency = Date.now() - started;

    return new Response(
      JSON.stringify({ assessments, latency_ms: latency }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("intelligent-task-assessment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

if (import.meta.main) {
  serve(handler);
}
