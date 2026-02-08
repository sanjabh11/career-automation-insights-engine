import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONET_USERNAME = Deno.env.get("ONET_USERNAME");
const ONET_PASSWORD = Deno.env.get("ONET_PASSWORD");
const ONET_BASE_URL = "https://services.onetcenter.org/ws";

const requestSchema = z.object({
  occupationCode: z.string().min(1),
});

function getAuthHeader(): string {
  if (!ONET_USERNAME || !ONET_PASSWORD) {
    throw new Error("O*NET credentials not configured");
  }
  return `Basic ${btoa(`${ONET_USERNAME}:${ONET_PASSWORD}`)}`;
}

async function fetchOnet(path: string): Promise<any | null> {
  try {
    const res = await fetch(`${ONET_BASE_URL}/${path}`, {
      headers: { Authorization: getAuthHeader(), Accept: "application/json" },
    });
    if (!res.ok) {
      console.error(`O*NET error ${res.status} for ${path}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error("fetchOnet error", e);
    return null;
  }
}

async function getKnowledge(code: string) {
  // Use details endpoint which returns numeric scores under `element[].score`
  const data = await fetchOnet(`online/occupations/${code}/details/knowledge`);
  const items = data?.element ?? [];
  const arr = Array.isArray(items) ? items : [items];
  return arr.map((k: any) => {
    const scores = Array.isArray(k.score) ? k.score : (k.score ? [k.score] : []);
    const importance = Number(
      (scores.find((s: any) => String(s.scale || '').toLowerCase().includes('importance'))?.value) ?? null
    );
    // Knowledge "details" typically doesn't provide a separate level value; keep null if absent
    const level = Number(
      (scores.find((s: any) => String(s.scale || '').toLowerCase().includes('level'))?.value) ?? null
    );
    return {
      occupation_code: code,
      knowledge_id: k.id,
      name: k.name || k.title,
      description: k.description || null,
      level: Number.isFinite(level) ? level : null,
      importance: Number.isFinite(importance) ? importance : null,
      category: null,
    };
  });
}

async function getAbilities(code: string) {
  // Use details endpoint and parse scores for level & importance when available
  const data = await fetchOnet(`online/occupations/${code}/details/abilities`);
  const items = data?.element ?? [];
  const arr = Array.isArray(items) ? items : [items];
  return arr.map((a: any) => {
    const scores = Array.isArray(a.score) ? a.score : (a.score ? [a.score] : []);
    const level = Number(
      (scores.find((s: any) => String(s.scale || '').toLowerCase().includes('level'))?.value) ?? null
    );
    const importance = Number(
      (scores.find((s: any) => String(s.scale || '').toLowerCase().includes('importance'))?.value) ?? null
    );
    return {
      occupation_code: code,
      ability_id: a.id,
      name: a.name || a.title,
      description: a.description || null,
      level: Number.isFinite(level) ? level : null,
      importance: Number.isFinite(importance) ? importance : null,
      category: null,
    };
  });
}

export async function handler(req: Request) {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { occupationCode } = requestSchema.parse(body);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [knowledge, abilities] = await Promise.all([
      getKnowledge(occupationCode),
      getAbilities(occupationCode),
    ]);

    let knowledgeInserted = 0;
    let abilitiesInserted = 0;
    const errors: string[] = [];

    if (knowledge.length) {
      console.log("Upserting knowledge:", JSON.stringify(knowledge[0]));
      const { error, count } = await supabase
        .from("onet_knowledge")
        .upsert(knowledge, { onConflict: "occupation_code,knowledge_id", count: "exact" });
      if (error) {
        console.error("knowledge upsert error", error);
        errors.push(`Knowledge: ${error.message}`);
      } else {
        knowledgeInserted = count ?? knowledge.length;
      }
    }

    if (abilities.length) {
      console.log("Upserting abilities:", JSON.stringify(abilities[0]));
      const { error, count } = await supabase
        .from("onet_abilities")
        .upsert(abilities, { onConflict: "occupation_code,ability_id", count: "exact" });
      if (error) {
        console.error("abilities upsert error", error);
        errors.push(`Abilities: ${error.message}`);
      } else {
        abilitiesInserted = count ?? abilities.length;
      }
    }

    return new Response(JSON.stringify({
      occupationCode,
      knowledgeCount: knowledge.length,
      knowledgeInserted,
      abilitiesCount: abilities.length,
      abilitiesInserted,
      errors: errors.length ? errors : undefined,
      syncedAt: new Date().toISOString(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("sync-knowledge-abilities error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}

if (import.meta.main) serve(handler);
