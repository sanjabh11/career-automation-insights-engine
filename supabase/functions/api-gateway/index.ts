import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, x-api-key, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * Public API Gateway
 *
 * Unified entry point for external API consumers.
 * Validates API keys, enforces rate limits, and routes to internal edge functions.
 *
 * Endpoints:
 * GET  /v1/occupations          — search occupations
 * GET  /v1/occupations/:code    — occupation details
 * POST /v1/apo                  — calculate APO for an occupation
 * POST /v1/assess-task          — assess a task's automation potential
 * GET  /v1/skills/:skill/half-life — skill half-life estimation
 * POST /v1/bridge-roles         — find bridge roles between occupations
 * POST /v1/counterfactual       — generate counterfactual explanations
 * POST /v1/agency-scale         — H1-H5 human agency classification
 * GET  /v1/health               — API health check
 */

const TIER_LIMITS: Record<string, { perMin: number; perDay: number }> = {
  free:      { perMin: 10,  perDay: 100 },
  starter:   { perMin: 30,  perDay: 1000 },
  pro:       { perMin: 60,  perDay: 10000 },
  enterprise:{ perMin: 300, perDay: 100000 },
};

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface ApiKeyRow {
  id: string;
  key_hash: string;
  key_prefix: string;
  tenant_name: string;
  tier: string;
  rate_limit_per_min: number;
  rate_limit_per_day: number;
  allowed_endpoints: string[];
  is_active: boolean;
  expires_at: string | null;
  total_requests: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse path
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/+/, "").replace(/^api\/?/, "");
    const segments = path.split("/").filter(Boolean);

    // Health check — no auth required
    if (segments[0] === "v1" && segments[1] === "health") {
      return new Response(JSON.stringify({
        status: "ok",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        endpoints: [
          "GET  /v1/occupations",
          "GET  /v1/occupations/:code",
          "POST /v1/apo",
          "POST /v1/assess-task",
          "GET  /v1/skills/:skill/half-life",
          "POST /v1/bridge-roles",
          "POST /v1/counterfactual",
          "POST /v1/agency-scale",
        ],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // API key validation
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API key. Provide x-api-key header." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyHash = await sha256(apiKey);
    const keyPrefix = apiKey.substring(0, 8);

    const { data: keyRow, error: keyErr } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .single() as { data: ApiKeyRow | null; error: unknown };

    if (keyErr || !keyRow) {
      return new Response(JSON.stringify({ error: "Invalid or inactive API key" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "API key expired" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting: check requests in last minute
    const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
    const { count: recentCount } = await supabase
      .from("api_request_log")
      .select("*", { count: "exact", head: true })
      .eq("api_key_id", keyRow.id)
      .gte("created_at", oneMinAgo) as { count: number | null };

    const tierLimits = TIER_LIMITS[keyRow.tier] ?? TIER_LIMITS.free;
    const perMinLimit = keyRow.rate_limit_per_min || tierLimits.perMin;

    if ((recentCount ?? 0) >= perMinLimit) {
      return new Response(JSON.stringify({
        error: "Rate limit exceeded",
        limit: perMinLimit,
        window: "60s",
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(perMinLimit),
          "X-RateLimit-Remaining": "0",
          "Retry-After": "60",
        },
      });
    }

    // Daily rate limit enforcement
    const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const { count: dailyCount } = await supabase
      .from("api_request_log")
      .select("*", { count: "exact", head: true })
      .eq("api_key_id", keyRow.id)
      .gte("created_at", dayAgo) as { count: number | null };

    const perDayLimit = keyRow.rate_limit_per_day || tierLimits.perDay;
    if ((dailyCount ?? 0) >= perDayLimit) {
      return new Response(JSON.stringify({
        error: "Daily rate limit exceeded",
        limit: perDayLimit,
        window: "24h",
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(perDayLimit),
          "X-RateLimit-Remaining": "0",
          "Retry-After": "3600",
        },
      });
    }

    // Allowed endpoints enforcement
    const requestedEndpoint = segments.slice(0, 3).join("/");
    if (keyRow.allowed_endpoints && keyRow.allowed_endpoints.length > 0) {
      const allowed = keyRow.allowed_endpoints.some((ep) => requestedEndpoint.startsWith(ep));
      if (!allowed) {
        return new Response(JSON.stringify({
          error: "Endpoint not allowed for this API key",
          requested: requestedEndpoint,
          allowed: keyRow.allowed_endpoints,
        }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Route to internal functions
    const routeKey = `${req.method}:${segments.slice(0, 3).join("/")}`;
    let internalUrl = "";
    let internalMethod = req.method;
    let internalBody: BodyInit | undefined;

    // Map public routes to internal Supabase edge functions
    if (segments[0] === "v1") {
      switch (segments[1]) {
        case "occupations":
          if (segments[2]) {
            // GET /v1/occupations/:code
            internalUrl = `${supabaseUrl}/functions/v1/search-occupations?code=${encodeURIComponent(segments[2])}`;
          } else {
            // GET /v1/occupations?query=...
            const query = url.searchParams.get("q") || "";
            internalUrl = `${supabaseUrl}/functions/v1/search-occupations?query=${encodeURIComponent(query)}`;
          }
          break;
        case "apo":
          internalUrl = `${supabaseUrl}/functions/v1/calculate-apo`;
          internalMethod = "POST";
          internalBody = await req.text();
          break;
        case "assess-task":
          internalUrl = `${supabaseUrl}/functions/v1/assess-task`;
          internalMethod = "POST";
          internalBody = await req.text();
          break;
        case "skills":
          if (segments[3] === "half-life") {
            internalUrl = `${supabaseUrl}/functions/v1/estimate-skill-half-life`;
            internalMethod = "POST";
            internalBody = JSON.stringify({ skill: segments[2] });
          }
          break;
        case "bridge-roles":
          internalUrl = `${supabaseUrl}/functions/v1/find-bridge-roles`;
          internalMethod = "POST";
          internalBody = await req.text();
          break;
        case "counterfactual":
          internalUrl = `${supabaseUrl}/functions/v1/generate-counterfactual`;
          internalMethod = "POST";
          internalBody = await req.text();
          break;
        case "agency-scale":
          internalUrl = `${supabaseUrl}/functions/v1/human-agency-scale`;
          internalMethod = "POST";
          internalBody = await req.text();
          break;
        default:
          return new Response(JSON.stringify({ error: "Unknown endpoint", path: segments.join("/") }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
      }
    } else {
      return new Response(JSON.stringify({ error: "API version required. Use /v1/..." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!internalUrl) {
      return new Response(JSON.stringify({ error: "Endpoint not implemented" }), {
        status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward request to internal function
    const internalResp = await fetch(internalUrl, {
      method: internalMethod,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
        "apikey": supabaseKey,
      },
      body: internalMethod === "POST" ? internalBody : undefined,
    });

    const respBody = await internalResp.text();
    const elapsed = Date.now() - startTime;

    // Log request
    await supabase.from("api_request_log").insert({
      api_key_id: keyRow.id,
      endpoint: segments.join("/"),
      method: req.method,
      status_code: internalResp.status,
      response_time_ms: elapsed,
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });

    // Increment total requests
    await supabase.from("api_keys")
      .update({ total_requests: keyRow.total_requests + 1, last_used_at: new Date().toISOString() })
      .eq("id", keyRow.id);

    // Return response with rate limit headers
    return new Response(respBody, {
      status: internalResp.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-RateLimit-Limit": String(perMinLimit),
        "X-RateLimit-Remaining": String(Math.max(0, perMinLimit - (recentCount ?? 0) - 1)),
      },
    });
  } catch (error) {
    console.error("API gateway error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
