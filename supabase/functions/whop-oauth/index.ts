import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WHOP_API_BASE = "https://api.whop.com/v5";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { action, code, redirect_uri, refresh_token } = await req.json();

    // Server-side secrets — never exposed to the client
    const clientId = Deno.env.get("WHOP_CLIENT_ID");
    const clientSecret = Deno.env.get("WHOP_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "Whop OAuth not configured on server" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "exchange") {
      // Exchange authorization code for tokens
      if (!code || !redirect_uri) {
        return new Response(
          JSON.stringify({ error: "Missing code or redirect_uri" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch(`${WHOP_API_BASE}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri,
          code,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("[whop-oauth] Token exchange failed:", err);
        return new Response(
          JSON.stringify({ error: "Token exchange failed" }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokens = await response.json();
      return new Response(JSON.stringify(tokens), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "refresh") {
      // Refresh an existing token
      if (!refresh_token) {
        return new Response(
          JSON.stringify({ error: "Missing refresh_token" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const response = await fetch(`${WHOP_API_BASE}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token,
        }),
      });

      if (!response.ok) {
        console.error("[whop-oauth] Token refresh failed");
        return new Response(
          JSON.stringify({ error: "Token refresh failed" }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokens = await response.json();
      return new Response(JSON.stringify(tokens), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'exchange' or 'refresh'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("[whop-oauth] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
