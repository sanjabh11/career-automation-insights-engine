import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Base URL for O*NET Web Services
const ONET_BASE_URL = "https://services.onetcenter.org/ws/online";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getAuthHeader() {
  const user = Deno.env.get("ONET_USERNAME");
  const pass = Deno.env.get("ONET_PASSWORD");
  if (!user || !pass) {
    throw new Error("Missing ONET_USERNAME/ONET_PASSWORD in environment");
  }
  const basic = btoa(`${user}:${pass}`);
  return `Basic ${basic}`;
}

export async function handler(req: Request): Promise<Response> {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Accept both GET (?path=...) and POST ({ onetPath | path })
    let onetPath = "";
    const url = new URL(req.url);
    const qp = url.searchParams.get("path");
    if (qp) {
      onetPath = qp;
    } else if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      onetPath = body.onetPath || body.path || "";
    }

    if (!onetPath || typeof onetPath !== "string") {
      return new Response(JSON.stringify({ error: "Missing O*NET path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize: remove any leading slash
    if (onetPath.startsWith("/")) onetPath = onetPath.slice(1);

    const authHeader = getAuthHeader();
    const target = `${ONET_BASE_URL}/${onetPath}`;
    console.log(`[onet-proxy] -> ${target}`);

    const response = await fetch(target, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    const ct = response.headers.get("content-type") || "";
    const ok = response.ok;
    if (!ok) {
      const errText = await response.text();
      console.error("O*NET API Error", response.status, errText);
      return new Response(JSON.stringify({ error: errText || response.statusText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ct.includes("application/json")) {
      const json = await response.json();
      return new Response(JSON.stringify(json), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const text = await response.text();
    return new Response(text, { headers: { ...corsHeaders, "Content-Type": ct || "text/plain" } });
  } catch (error) {
    console.error("Error in onet-proxy function:", error);
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

if (import.meta.main) {
  serve(handler);
}
