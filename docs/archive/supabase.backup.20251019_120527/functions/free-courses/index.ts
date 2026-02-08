import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { searchCourses } from "../../lib/SerpApiClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  skill: z.string().min(2),
  limit: z.number().min(1).max(10).optional().default(5),
});

export async function handler(req: Request) {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { skill, limit } = requestSchema.parse(await req.json());
    const results = await searchCourses(`${skill} free course`, limit);
    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}

if (import.meta.main) {
  serve(handler);
}
