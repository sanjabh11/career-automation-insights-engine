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

serve(async (req: Request): Promise<Response> => {
  try {
    if (req.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const code = url.searchParams.get("code");
    const to = url.searchParams.get("to");

    if (!from || !code) {
      return new Response("Missing required parameters: from, code", {
        status: 400,
      });
    }

    // Construct O*NET Web-Services path.
    // Docs: https://services.onetcenter.org/reference/
    // Example: /online/crosswalk?identifier=11B&codes=MOC&to=SOC
    const qs = new URLSearchParams({ identifier: code, codes: from.toUpperCase() });
    if (to) qs.set("to", to.toUpperCase());
    const onetUrl = `https://services.onetcenter.org/ws/online/crosswalk?${qs.toString()}`;

    const res = await fetch(onetUrl, {
      headers: {
        ...buildAuthHeaders(),
        Accept: "application/json",
      },
    });

    return new Response(res.body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/json",
        "Cache-Control": "public, max-age=300", // 5-minute cache
      },
    });
  } catch (err) {
    console.error("/crosswalk error", err);
    const message = err instanceof Error ? err.message : "Internal Error";
    const status = message.includes("ONET_USERNAME") ? 500 : 500;
    return new Response(message, { status });
  }
});
