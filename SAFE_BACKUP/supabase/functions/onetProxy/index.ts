// Supabase Edge Function: onetProxy
// Fetches live data from O*NET Web Services using basic-auth credentials stored in environment variables.
// 
// Usage (client-side):
//   GET /functions/v1/onetProxy?path=/ws/online/present/taxonomy/occupation/11-1011.00
// The `path` query must start with "/" and correspond to an O*NET Web Services path.
// The function will proxy the request, attach HTTP Basic authentication, and stream
// the response back to the caller. Non-GET methods are rejected.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.22.4";

const username = Deno.env.get("ONET_USERNAME");
const password = Deno.env.get("ONET_PASSWORD");

if (!username || !password) {
  console.error("❌ ONET_USERNAME / ONET_PASSWORD env vars are required for onetProxy function");
}

const querySchema = z.object({
  path: z.string().startsWith("/", { message: "path must start with /" }),
});

serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { searchParams } = new URL(req.url);
  const parseResult = querySchema.safeParse({ path: searchParams.get("path") ?? "" });
  if (!parseResult.success) {
    return new Response(`Invalid query: ${parseResult.error.message}`, { status: 400 });
  }

  const { path } = parseResult.data;
  const target = `https://services.onetcenter.org${path}`;

  const authHeader = "Basic " + btoa(`${username}:${password}`);

  try {
    const upstreamResp = await fetch(target, {
      headers: {
        Authorization: authHeader,
      },
    });

    const headers = new Headers();
    headers.set("Content-Type", upstreamResp.headers.get("Content-Type") ?? "application/json");
    headers.set("Cache-Control", "public, max-age=300"); // basic 5-minute edge cache

    return new Response(upstreamResp.body, {
      status: upstreamResp.status,
      headers,
    });
  } catch (e) {
    console.error("Error proxying O*NET request", e);
    return new Response("Upstream error", { status: 502 });
  }
});
