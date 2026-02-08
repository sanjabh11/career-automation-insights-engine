import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Calculate Skill Adjacency using Gemini Embeddings
 * 
 * This Edge Function generates vector embeddings for skills and calculates
 * similarity to find "adjacent" skills that represent realistic career pivots.
 * 
 * @param skill_ids - Array of O*NET skill IDs (e.g., ["2.A.1.a", "2.C.1.a"])
 * @param skill_type - "knowledge" or "ability"
 * @param limit - Max number of adjacent skills to return (default: 10)
 */

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { skill_ids, skill_type = 'knowledge', limit = 10, force_refresh = false } = await req.json();

        if (!skill_ids || !Array.isArray(skill_ids) || skill_ids.length === 0) {
            throw new Error('skill_ids array is required');
        }

        if (!['knowledge', 'ability'].includes(skill_type)) {
            throw new Error('skill_type must be "knowledge" or "ability"');
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Initialize Gemini API
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        const geminiModel = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

        if (!geminiApiKey) {
            throw new Error('GEMINI_API_KEY environment variable not set');
        }

        const tableName = skill_type === 'knowledge' ? 'onet_knowledge' : 'onet_abilities';
        const results = [];

        for (const skillId of skill_ids) {
            // 1. Get skill details from database
            const { data: skill, error: skillError } = await supabase
                .from(tableName)
                .select('*')
                .eq('element_id', skillId)
                .single();

            if (skillError || !skill) {
                console.error(`Skill ${skillId} not found`);
                continue;
            }

            // 2. Check if embedding exists and is current
            if (!force_refresh && skill.embedding && skill.embedding_model === geminiModel) {
                console.log(`Using cached embedding for ${skillId}`);
            } else {
                // 3. Generate embedding using Gemini
                const skillDescription = `${skill.element_name}: ${skill.description || ''}`;

                const embeddingResponse = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:embedContent?key=${geminiApiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: `models/${geminiModel}`,
                            content: {
                                parts: [{ text: skillDescription }]
                            }
                        })
                    }
                );

                if (!embeddingResponse.ok) {
                    const errorText = await embeddingResponse.text();
                    throw new Error(`Gemini API error: ${embeddingResponse.status} - ${errorText}`);
                }

                const embeddingData = await embeddingResponse.json();
                const embedding = embeddingData.embedding.values;

                // 4. Store embedding in database
                const { error: updateError } = await supabase
                    .from(tableName)
                    .update({
                        embedding: `[${embedding.join(',')}]`,
                        embedding_generated_at: new Date().toISOString(),
                        embedding_model: geminiModel
                    })
                    .eq('element_id', skillId);

                if (updateError) {
                    console.error(`Error storing embedding for ${skillId}:`, updateError);
                }
            }

            // 5. Find adjacent skills using vector similarity
            // Use pgvector's <=> operator for cosine distance
            const { data: adjacent, error: adjacentError } = await supabase
                .rpc('find_adjacent_skills', {
                    p_skill_id: skillId,
                    p_skill_type: skill_type,
                    p_limit: limit,
                    p_min_similarity: 0.5
                });

            if (adjacentError) {
                console.error(`Error finding adjacent skills for ${skillId}:`, adjacentError);

                // Fallback: Direct vector query if RPC fails
                const { data: directAdjacent, error: directError } = await supabase
                    .from(tableName)
                    .select('element_id, element_name, embedding')
                    .neq('element_id', skillId)
                    .not('embedding', 'is', null)
                    .limit(limit * 2); // Get more for client-side filtering

                if (!directError && directAdjacent) {
                    // Calculate cosine similarity client-side (temporary fallback)
                    const sourceEmbedding = skill.embedding;
                    if (sourceEmbedding && Array.isArray(sourceEmbedding)) {
                        const adjacentWithSimilarity = directAdjacent
                            .map(adj => {
                                if (!adj.embedding || !Array.isArray(adj.embedding)) return null;

                                const similarity = cosineSimilarity(sourceEmbedding, adj.embedding);

                                return {
                                    adjacent_skill_id: adj.element_id,
                                    adjacent_skill_name: adj.element_name,
                                    similarity_score: similarity,
                                    estimated_learning_hours: Math.round((1 - similarity) * 200), // Rough estimate
                                    salary_impact_usd: Math.round(similarity * 15000), // Rough estimate
                                    demand_score: Math.round(similarity * 80)
                                };
                            })
                            .filter(x => x !== null && x.similarity_score >= 0.5)
                            .sort((a, b) => b.similarity_score - a.similarity_score)
                            .slice(0, limit);

                        results.push({
                            skill_id: skillId,
                            skill_name: skill.element_name,
                            skill_type: skill_type,
                            adjacent_skills: adjacentWithSimilarity
                        });
                        continue;
                    }
                }

                results.push({
                    skill_id: skillId,
                    skill_name: skill.element_name,
                    skill_type: skill_type,
                    adjacent_skills: [],
                    error: 'Could not find adjacent skills'
                });
            } else {
                results.push({
                    skill_id: skillId,
                    skill_name: skill.element_name,
                    skill_type: skill_type,
                    adjacent_skills: adjacent || []
                });
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: results,
                model: geminiModel
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        );

    } catch (error) {
        console.error('Error in calculate-skill-adjacency:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        );
    }
});

// Utility function for cosine similarity
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
