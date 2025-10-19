// Supabase Edge Function: /crosswalk
// Fetches crosswalk mappings (MOC, CIP, RAPIDS, ESCO, DOT, SOC) from O*NET Web Services.
// Usage: GET /functions/v1/crosswalk?from=moc&code=11B
// Optional: ?to=soc (to filter target codes, otherwise returns the full mapping response)
//
// Environment: expects ONET_USERNAME / ONET_PASSWORD to be stored
//              as Supabase secrets. This function simply forwards the request to the
//              public O*NET Web-Services endpoint using basic auth and caches the
//              response for 5 minutes.

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const USERNAME = Deno.env.get("ONET_USERNAME");
const PASSWORD = Deno.env.get("ONET_PASSWORD");
if (!(USERNAME && PASSWORD)) {
  console.error("O*NET credentials (ONET_USERNAME/ONET_PASSWORD) not found in environment variables");
}

function buildAuthHeaders(): HeadersInit {
  // O*NET Web Services use HTTP Basic auth. Require username/password.
  if (USERNAME && PASSWORD) {
    const b64 = btoa(`${USERNAME}:${PASSWORD}`);
    return { Authorization: `Basic ${b64}` };
  }
  throw new Error("Missing ONET_USERNAME/ONET_PASSWORD");
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    let from: string | null = null;
    let code: string | null = null;
    let to: string | null = null;

    // Support both GET and POST
    if (req.method === "GET") {
      const url = new URL(req.url);
      from = url.searchParams.get("from");
      code = url.searchParams.get("code");
      to = url.searchParams.get("to");
    } else if (req.method === "POST") {
      const body = await req.json();
      from = body.from;
      code = body.code;
      to = body.to;
    } else {
      return new Response("Method Not Allowed", { 
        status: 405,
        headers: corsHeaders 
      });
    }

    if (!from || !code) {
      return new Response("Missing required parameters: from, code", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Construct O*NET Web-Services path.
    // Docs: https://services.onetcenter.org/reference/
    // Support both generic crosswalk and specific endpoints (e.g., OOH)
    let onetUrl: string;
    const fromUpper = (from || '').toUpperCase();
    // Normalize SOC codes like 29-1141.00 -> 29-1141 for generic crosswalk
    if (fromUpper === "SOC" && code) {
      code = (code as string).replace(/\.00$/, "");
    }
    
    if (fromUpper === "OOH") {
      // Use dedicated OOH crosswalk endpoint
      // Reference: https://services.onetcenter.org/reference/online/crosswalk/ooh
      const qs = new URLSearchParams({ keyword: code });
      onetUrl = `https://services.onetcenter.org/ws/online/crosswalks/ooh?${qs.toString()}`;
    } else {
      // Generic crosswalk endpoint
      // Example: /online/crosswalk?identifier=11B&codes=MOC&to=SOC
      const qs = new URLSearchParams({ identifier: code, codes: fromUpper });
      if (to) qs.set("to", to.toUpperCase());
      onetUrl = `https://services.onetcenter.org/ws/online/crosswalk?${qs.toString()}`;
    }

    const res = await fetch(onetUrl, {
      headers: {
        ...buildAuthHeaders(),
        Accept: "application/json",
      },
    });

    // If O*NET returns 404 (no mapping), respond with an empty result and 200 OK
    if (res.status === 404) {
      return new Response(
        JSON.stringify({ results: [], mappings: [], items: [] }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60",
          },
        }
      );
    }

    return new Response(res.body, {
      status: res.status,
      headers: {
        ...corsHeaders,
        "Content-Type": res.headers.get("Content-Type") || "application/json",
        "Cache-Control": "public, max-age=300", // 5-minute cache
      },
    });
  } catch (err) {
    console.error("/crosswalk error", err);
    const message = err instanceof Error ? err.message : "Internal Error";
    const status = message.includes("ONET_USERNAME") ? 500 : 500;
    return new Response(message, { status, headers: corsHeaders });
  }
});
