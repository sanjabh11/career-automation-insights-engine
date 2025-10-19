import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parse } from "https://deno.land/std@0.208.0/csv/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminKey = req.headers.get("x-admin-key") || "";
    const expected = Deno.env.get("ADMIN_API_KEY") || "";
    if (!expected || adminKey !== expected) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const contentType = req.headers.get("content-type") || "";
    let records: Array<Record<string, string>> = [];

    if (contentType.includes("application/json")) {
      const body = await req.json();
      records = Array.isArray(body) ? body : (Array.isArray(body?.rows) ? body.rows : []);
    } else {
      const text = await req.text();
      const parsed = parse(text, { skipFirstRow: true }) as Array<Record<string, string>>;
      records = parsed;
    }

    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({ error: "No records provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const norm = (s: string | undefined) => (s || "").trim();

    const stemCodes = new Set<string>();
    for (const r of records) {
      const code = norm(r.onetsoc_code || r.soc_code || r.code);
      const flag = norm(r.is_stem || r.stem || r.official_stem || r.flag);
      if (!code) continue;
      if (flag === "Y" || flag === "1" || flag.toLowerCase() === "true") {
        stemCodes.add(code);
      }
    }

    if (stemCodes.size === 0) {
      return new Response(
        JSON.stringify({ error: "No STEM rows identified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const codes = Array.from(stemCodes);

    const { error: upsertMembershipErr } = await supabase
      .from("onet_stem_membership")
      .upsert(
        codes.map((code) => ({
          occupation_code: code,
          is_official_stem: true,
          data_source: "Official STEM CSV",
        })),
        { onConflict: "occupation_code" }
      );

    const { error: updateEnrichmentErr } = await supabase
      .from("onet_occupation_enrichment")
      .update({ is_stem: true })
      .in("occupation_code", codes);

    return new Response(
      JSON.stringify({
        success: true,
        updated_codes: codes.length,
        source: "admin_csv",
        upsertMembershipErr: upsertMembershipErr?.message || null,
        updateEnrichmentErr: updateEnrichmentErr?.message || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

if (import.meta.main) {
  serve(handler);
}
