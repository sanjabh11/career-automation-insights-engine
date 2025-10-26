import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
} as const;

const RequestSchema = z.object({
  cip_codes: z.array(z.string()).optional(),
  cip_code: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
});

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let input: z.infer<typeof RequestSchema>;
    if (req.method === "GET") {
      const url = new URL(req.url);
      const cip_code = url.searchParams.get("cip_code") || undefined;
      const limit = url.searchParams.get("limit");
      input = RequestSchema.parse({ cip_code, limit: limit ? Number(limit) : undefined });
    } else {
      const body = await req.json();
      input = RequestSchema.parse(body);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const cipList = input.cip_codes && input.cip_codes.length ? input.cip_codes : (input.cip_code ? [input.cip_code] : []);
    if (cipList.length === 0) {
      return new Response(JSON.stringify({ error: "Provide cip_code or cip_codes" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data, error } = await supabase
      .from("program_exemplars")
      .select("id, cip_code, cip_title, program_name, provider, level, modality, duration_weeks, duration_hours, cost_usd, url, outcomes, employment_rate, completion_rate, occupation_code")
      .in("cip_code", cipList)
      .order("cost_usd", { ascending: true, nullsFirst: true })
      .limit(input.limit ?? 50);

    if (error) throw error;

    return new Response(JSON.stringify({ programs: data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
