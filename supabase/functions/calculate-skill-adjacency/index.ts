import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";
const DEFAULT_EMBEDDING_DIMENSIONS = 768;
const SUPPORTED_EMBEDDING_DIMENSIONS = new Set([768, 1536, 3072]);
const SCHEMA_EMBEDDING_DIMENSIONS = 768;

type SkillType = "knowledge" | "ability";

type SkillRow = {
  element_id: string;
  element_name: string;
  description?: string | null;
  embedding?: unknown;
  embedding_model?: string | null;
};

type DirectAdjacentRow = {
  element_id: string;
  element_name: string;
  embedding?: unknown;
};

type AdjacentSkill = {
  adjacent_skill_id: string;
  adjacent_skill_name: string;
  similarity_score: number;
  estimated_learning_hours: number;
  salary_impact_usd: number;
  demand_score: number;
};

type SkillAdjacencyResult = {
  skill_id: string;
  skill_name: string;
  skill_type: SkillType;
  adjacent_skills: AdjacentSkill[];
  error?: string;
};

type RequestBody = {
  skill_ids?: unknown;
  skill_type?: unknown;
  limit?: unknown;
  force_refresh?: unknown;
};

type EmbeddingConfig = {
  model: string;
  dimensions: number;
};

function isSkillType(value: unknown): value is SkillType {
  return value === "knowledge" || value === "ability";
}

function getEmbeddingConfig(): EmbeddingConfig {
  const model = Deno.env.get("GEMINI_EMBEDDING_MODEL") || DEFAULT_EMBEDDING_MODEL;
  const dimensions = Number.parseInt(
    Deno.env.get("GEMINI_EMBEDDING_DIMENSIONS") || String(DEFAULT_EMBEDDING_DIMENSIONS),
    10,
  );

  if (!model.includes("embedding")) {
    throw new Error("GEMINI_EMBEDDING_MODEL must be an embedding model such as gemini-embedding-001");
  }

  if (!SUPPORTED_EMBEDDING_DIMENSIONS.has(dimensions)) {
    throw new Error("GEMINI_EMBEDDING_DIMENSIONS must be one of 768, 1536, or 3072");
  }

  if (dimensions !== SCHEMA_EMBEDDING_DIMENSIONS) {
    throw new Error("Current pgvector schema stores 768-dimensional skill embeddings; migrate vector columns before using larger output dimensions");
  }

  return { model, dimensions };
}

function parseEmbedding(value: unknown): number[] | null {
  if (Array.isArray(value)) {
    const vector = value.map(Number);
    return vector.every(Number.isFinite) ? vector : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim().replace(/^\[/, "").replace(/\]$/, "");
    if (!trimmed) return null;
    const vector = trimmed.split(",").map((part) => Number(part.trim()));
    return vector.every(Number.isFinite) ? vector : null;
  }

  return null;
}

function serializeEmbedding(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

function isValidEmbedding(vector: number[] | null, dimensions: number): vector is number[] {
  return Boolean(vector && vector.length === dimensions && vector.every(Number.isFinite));
}

async function generateEmbedding(
  apiKey: string,
  config: EmbeddingConfig,
  text: string,
): Promise<number[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${config.model}`,
        content: {
          parts: [{ text }],
        },
        embedContentConfig: {
          taskType: "SEMANTIC_SIMILARITY",
          outputDimensionality: config.dimensions,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini embedding API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const embedding = parseEmbedding(data?.embedding?.values);
  if (!isValidEmbedding(embedding, config.dimensions)) {
    throw new Error(`Gemini embedding returned ${embedding?.length || 0} dimensions; expected ${config.dimensions}`);
  }

  return embedding;
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
}

function buildDirectAdjacency(
  sourceEmbedding: number[],
  rows: DirectAdjacentRow[],
  sourceSkillId: string,
  limit: number,
  dimensions: number,
): AdjacentSkill[] {
  return rows
    .map((row): AdjacentSkill | null => {
      const adjacentEmbedding = parseEmbedding(row.embedding);
      if (!isValidEmbedding(adjacentEmbedding, dimensions)) return null;

      const similarity = cosineSimilarity(sourceEmbedding, adjacentEmbedding);
      if (similarity < 0.5) return null;

      return {
        adjacent_skill_id: row.element_id,
        adjacent_skill_name: row.element_name,
        similarity_score: Number(similarity.toFixed(4)),
        estimated_learning_hours: Math.round((1 - similarity) * 200),
        salary_impact_usd: Math.round(similarity * 15000),
        demand_score: Math.round(similarity * 80),
      };
    })
    .filter((row): row is AdjacentSkill => Boolean(row))
    .filter((row) => row.adjacent_skill_id !== sourceSkillId)
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit);
}

export async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json() as RequestBody;
    const skillIds = Array.isArray(body.skill_ids)
      ? body.skill_ids.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [];
    const skillType = isSkillType(body.skill_type) ? body.skill_type : "knowledge";
    const limit = typeof body.limit === "number" && Number.isFinite(body.limit)
      ? Math.max(1, Math.min(25, Math.round(body.limit)))
      : 10;
    const forceRefresh = body.force_refresh === true;

    if (skillIds.length === 0) {
      throw new Error("skill_ids array is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const embeddingConfig = getEmbeddingConfig();

    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY environment variable not set");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const tableName = skillType === "knowledge" ? "onet_knowledge" : "onet_abilities";
    const results: SkillAdjacencyResult[] = [];
    let generatedEmbeddings = 0;

    for (const skillId of skillIds) {
      const { data: skillData, error: skillError } = await supabase
        .from(tableName)
        .select("*")
        .eq("element_id", skillId)
        .single();

      const skill = skillData as SkillRow | null;
      if (skillError || !skill) {
        console.error(`Skill ${skillId} not found`, skillError);
        continue;
      }

      let sourceEmbedding = parseEmbedding(skill.embedding);
      const hasCurrentEmbedding =
        !forceRefresh &&
        skill.embedding_model === embeddingConfig.model &&
        isValidEmbedding(sourceEmbedding, embeddingConfig.dimensions);

      if (!hasCurrentEmbedding) {
        const skillDescription = `${skill.element_name}: ${skill.description || ""}`;
        sourceEmbedding = await generateEmbedding(geminiApiKey, embeddingConfig, skillDescription);
        generatedEmbeddings += 1;

        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            embedding: serializeEmbedding(sourceEmbedding),
            embedding_generated_at: new Date().toISOString(),
            embedding_model: embeddingConfig.model,
          })
          .eq("element_id", skillId);

        if (updateError) {
          console.error(`Error storing embedding for ${skillId}:`, updateError);
        }
      }

      if (!isValidEmbedding(sourceEmbedding, embeddingConfig.dimensions)) {
        results.push({
          skill_id: skillId,
          skill_name: skill.element_name,
          skill_type: skillType,
          adjacent_skills: [],
          error: `Source embedding unavailable or wrong dimensionality for ${skillId}`,
        });
        continue;
      }

      const { data: rpcAdjacent, error: adjacentError } = await supabase
        .rpc("find_adjacent_skills", {
          p_skill_id: skillId,
          p_skill_type: skillType,
          p_limit: limit,
          p_min_similarity: 0.5,
        });

      if (!adjacentError && Array.isArray(rpcAdjacent) && rpcAdjacent.length > 0) {
        results.push({
          skill_id: skillId,
          skill_name: skill.element_name,
          skill_type: skillType,
          adjacent_skills: rpcAdjacent as AdjacentSkill[],
        });
        continue;
      }

      if (adjacentError) {
        console.error(`RPC adjacency lookup failed for ${skillId}; using direct vector fallback`, adjacentError);
      }

      const { data: directRows, error: directError } = await supabase
        .from(tableName)
        .select("element_id, element_name, embedding")
        .neq("element_id", skillId)
        .eq("embedding_model", embeddingConfig.model)
        .not("embedding", "is", null)
        .limit(limit * 4);

      if (directError || !Array.isArray(directRows)) {
        console.error(`Direct adjacency lookup failed for ${skillId}:`, directError);
        results.push({
          skill_id: skillId,
          skill_name: skill.element_name,
          skill_type: skillType,
          adjacent_skills: [],
          error: "Could not find adjacent skills",
        });
        continue;
      }

      results.push({
        skill_id: skillId,
        skill_name: skill.element_name,
        skill_type: skillType,
        adjacent_skills: buildDirectAdjacency(
          sourceEmbedding,
          directRows as DirectAdjacentRow[],
          skillId,
          limit,
          embeddingConfig.dimensions,
        ),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: results,
        model: embeddingConfig.model,
        embeddingDimensions: embeddingConfig.dimensions,
        generatedEmbeddings,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in calculate-skill-adjacency:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
}

if (import.meta.main) {
  serve(handler);
}
