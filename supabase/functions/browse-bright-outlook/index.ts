import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
} as const;

/**
 * Browse Bright Outlook Occupations
 *
 * GET /browse-bright-outlook
 * - List all bright outlook occupations
 * - Filter by category: Rapid Growth, Numerous Openings, New & Emerging
 * - Include STEM filter, job zone filter
 *
 * Also supports fetching from O*NET API directly if DB is empty.
 */
export async function handler(req: Request) {
  const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = req.headers.get("origin") || "";
  const allowAll = allowedOrigins.includes("*");
  const cors = {
    ...BASE_CORS_HEADERS,
    "Access-Control-Allow-Origin": allowAll ? "*" : (allowedOrigins.includes(origin) ? origin : "null"),
    Vary: "Origin",
  } as Record<string, string>;

  if (req.method === "OPTIONS") {
    if (!allowAll && origin && !allowedOrigins.includes(origin)) {
      return new Response("CORS not allowed", { status: 403, headers: cors });
    }
    return new Response(null, { headers: cors });
  }

  try {
    const url = new URL(req.url);
    let category = url.searchParams.get("category") || undefined;
    let stemOnly = url.searchParams.get("stem") === "true";
    let jobZone = url.searchParams.get("jobZone") ? parseInt(url.searchParams.get("jobZone")!) : undefined;
    let limit = parseInt(url.searchParams.get("limit") || "100");
    let offset = parseInt(url.searchParams.get("offset") || "0");

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (typeof body?.category === "string") category = body.category;
        if (typeof body?.stem === "boolean") stemOnly = body.stem;
        if (typeof body?.jobZone === "number") jobZone = body.jobZone;
        if (typeof body?.limit === "number") limit = body.limit;
        if (typeof body?.offset === "number") offset = body.offset;
      } catch (_e) { /* fallback to query params */ }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ occupations: [], totalCount: 0, source: "db", error: "Missing config" }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query bright outlook occupations from DB
    let query = supabase
      .from("onet_occupation_enrichment")
      .select("occupation_code, occupation_title, bright_outlook, bright_outlook_categories, is_stem, job_zone, median_wage_annual, career_cluster, description", { count: "exact" })
      .eq("bright_outlook", true)
      .order("occupation_title")
      .range(offset, offset + limit - 1);

    // Apply category filter if specified
    if (category) {
      query = query.contains("bright_outlook_categories", [category]);
    }

    // Apply STEM filter
    if (stemOnly) {
      query = query.eq("is_stem", true);
    }

    // Apply job zone filter
    if (jobZone) {
      query = query.eq("job_zone", jobZone);
    }

    const { data: occupations, count, error } = await query as { data: unknown[] | null; count?: number; error: unknown };

    if (error) {
      // DB error — try O*NET API fallback
      const ONET_USERNAME = Deno.env.get("ONET_USERNAME");
      const ONET_PASSWORD = Deno.env.get("ONET_PASSWORD");
      if (ONET_USERNAME && ONET_PASSWORD) {
        try {
          const auth = btoa(`${ONET_USERNAME}:${ONET_PASSWORD}`);
          const onetUrl = new URL("https://services.onetcenter.org/ws/online/search");
          onetUrl.searchParams.set("bright_outlook", "yes");
          if (category === "Rapid Growth") onetUrl.searchParams.set("bright_outlook_category", "Rapid Growth");
          if (category === "Numerous Openings") onetUrl.searchParams.set("bright_outlook_category", "Numerous Openings");
          if (category === "New & Emerging") onetUrl.searchParams.set("bright_outlook_category", "New & Emerging");
          onetUrl.searchParams.set("start", String(offset + 1));
          onetUrl.searchParams.set("end", String(offset + limit));

          const onetRes = await fetch(onetUrl.toString(), {
            headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
          });

          if (onetRes.ok) {
            const onetData = await onetRes.json() as { occupation?: unknown[] | unknown; total?: number };
            const occArr = Array.isArray(onetData.occupation) ? onetData.occupation : (onetData.occupation ? [onetData.occupation] : []);
            return new Response(
              JSON.stringify({
                occupations: occArr,
                totalCount: onetData.total ?? occArr.length,
                source: "onet_api",
                category: category || "all",
              }),
              { headers: { ...cors, "Content-Type": "application/json" } },
            );
          }
        } catch (_e) { /* fall through to empty response */ }
      }

      return new Response(
        JSON.stringify({ occupations: [], totalCount: 0, source: "db", error: String(error) }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        occupations: occupations || [],
        totalCount: count ?? 0,
        source: "db",
        category: category || "all",
        stemOnly,
        jobZone: jobZone || null,
        offset,
        limit,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("browse-bright-outlook error:", error);
    return new Response(
      JSON.stringify({ occupations: [], totalCount: 0, source: "db", error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
}

if (import.meta.main) {
  serve(handler);
}
