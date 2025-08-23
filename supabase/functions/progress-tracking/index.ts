import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const updateSchema = z.object({
  learningPathId: z.string().uuid(),
  stepOrder: z.number().min(1),
  completed: z.boolean(),
  userId: z.string().uuid(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method === "POST") {
      const { learningPathId, stepOrder, completed, userId } = updateSchema.parse(
        await req.json(),
      );
      const { error } = await supabase.from("learning_paths").update({
        plan: supabase.rpc("mark_step_complete", {
          lp_id: learningPathId,
          order_in: stepOrder,
          completed_in: completed,
        }),
      }).eq("id", learningPathId).eq("user_id", userId);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const pathId = url.searchParams.get("learningPathId");
    const userId = url.searchParams.get("userId");
    if (!pathId || !userId) throw new Error("learningPathId and userId params required");

    const { data, error } = await supabase
      .from("learning_paths")
      .select("plan")
      .eq("id", pathId)
      .eq("user_id", userId)
      .single();
    if (error) throw error;
    return new Response(JSON.stringify({ plan: data.plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
