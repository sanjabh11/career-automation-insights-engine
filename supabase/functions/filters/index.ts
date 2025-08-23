// supabase/functions/filters/index.ts
// Edge Function: returns all discovery filter reference tables as JSON
// Route: /filters (GET)
// Query params: none
// Response shape:
// {
//   jobZones: [...], brightOutlook: [...], stem: [...], clusters: [...], industries: [...]
// }

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey)
    return new Response("Server misconfiguration", { status: 500, headers: corsHeaders });

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const [jobZones, bright, stem, clusters, industries] = await Promise.all([
    sb.from("job_zones").select("*").order("id"),
    sb.from("bright_outlook_flags").select("*").order("id"),
    sb.from("stem_categories").select("*").order("id"),
    sb.from("career_clusters").select("*").order("id"),
    sb.from("industries").select("*").order("id"),
  ]);

  const error =
    jobZones.error || bright.error || stem.error || clusters.error || industries.error;
  if (error) return new Response(error.message, { status: 500, headers: corsHeaders });

  const body = {
    jobZones: jobZones.data,
    brightOutlook: bright.data,
    stem: stem.data,
    clusters: clusters.data,
    industries: industries.data,
  };
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

if (import.meta.main) {
  serve(handler);
}
