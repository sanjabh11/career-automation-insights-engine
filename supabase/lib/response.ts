// supabase/lib/response.ts
// Shared CORS headers and response helpers for Edge Functions

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Return a 200 JSON response with CORS headers */
export function jsonOk(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Return a JSON error response with CORS headers */
export function jsonError(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
): Response {
  return new Response(
    JSON.stringify({ error: message, ...extra }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

/** Handle CORS preflight (OPTIONS) — return early if it is one */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}
