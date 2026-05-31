import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type BridgeSupabaseClient = ReturnType<typeof createClient>;

type BridgePathResult = {
    path_socs: string[];
    skill_overlaps: number[];
    avg_skill_overlap: number;
    total_distance: number;
    path_length: number;
    feasibility_score: number;
    algorithm_used: 'a_star';
};

/**
 * Find Bridge Roles using A* Pathfinding
 * 
 * Finds realistic career transition paths between two occupations by identifying
 * intermediate "bridge" roles that maximize skill overlap at each step.
 * 
 * @param origin_soc - Starting occupation SOC code (e.g., "53-3032.00")
 * @param destination_soc - Target occupation SOC code (e.g., "15-2051.00")
 * @param max_path_length - Maximum number of intermediate roles (default: 3)
 */

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { origin_soc, destination_soc, max_path_length = 3 } = await req.json();

        if (!origin_soc || !destination_soc) {
            throw new Error('origin_soc and destination_soc are required');
        }

        const startTime = Date.now();

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Check cache first
        const { data: cachedPath } = await supabase
            .from('bridge_role_paths')
            .select('*')
            .eq('origin_soc', origin_soc)
            .eq('destination_soc', destination_soc)
            .single();

        if (cachedPath) {
            console.log('Returning cached path');
            return new Response(
                JSON.stringify({
                    success: true,
                    cached: true,
                    path: cachedPath
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Fetch origin and destination occupations
        const { data: occupations } = await supabase
            .from('onet_occupation_enrichment')
            .select('soc_code, title')
            .in('soc_code', [origin_soc, destination_soc]);

        if (!occupations || occupations.length < 2) {
            throw new Error('One or both SOC codes not found');
        }

        const originOccupation = occupations.find(o => o.soc_code === origin_soc);
        const destinationOccupation = occupations.find(o => o.soc_code === destination_soc);

        // Get skills for origin and destination
        const originSkills = await getOccupationSkills(supabase, origin_soc);
        const destinationSkills = await getOccupationSkills(supabase, destination_soc);

        // Calculate direct overlap
        const directOverlap = calculateSkillOverlap(originSkills, destinationSkills);

        // If direct overlap > 60%, no bridge needed
        if (directOverlap >= 0.60) {
            const path = {
                origin_soc,
                origin_title: originOccupation?.title,
                destination_soc,
                destination_title: destinationOccupation?.title,
                path_socs: [origin_soc, destination_soc],
                path_titles: [originOccupation?.title, destinationOccupation?.title],
                skill_overlaps: [directOverlap],
                avg_skill_overlap: directOverlap,
                total_distance: 1 - directOverlap,
                path_length: 0,
                feasibility_score: directOverlap * 100,
                transitions: [{
                    from_soc: origin_soc,
                    to_soc: destination_soc,
                    overlap: directOverlap,
                    direct_transition: true
                }],
                algorithm_used: 'direct',
                calculation_time_ms: Date.now() - startTime
            };

            // Cache the result
            await supabase.from('bridge_role_paths').insert(path);

            return new Response(
                JSON.stringify({ success: true, cached: false, path }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Use A* pathfinding to find bridge roles
        const bridgePath = await findBridgePath(
            supabase,
            origin_soc,
            destination_soc,
            originSkills,
            destinationSkills,
            max_path_length
        );

        if (!bridgePath) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'No feasible path found within max_path_length',
                    suggestion: 'Try increasing max_path_length or consider alternative destinations'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            );
        }

        // Construct full path response
        const pathData = {
            origin_soc,
            origin_title: originOccupation?.title,
            destination_soc,
            destination_title: destinationOccupation?.title,
            ...bridgePath,
            calculation_time_ms: Date.now() - startTime
        };

        // Cache the result
        await supabase.from('bridge_role_paths').insert(pathData);

        return new Response(
            JSON.stringify({ success: true, cached: false, path: pathData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in find-bridge-roles:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});

// Helper function to get occupation skills
async function getOccupationSkills(supabase: BridgeSupabaseClient, socCode: string): Promise<Set<string>> {
    const skills = new Set<string>();

    // Get knowledge requirements
    const { data: knowledge } = await supabase
        .from('onet_knowledge')
        .select('element_id, scale_id, data_value')
        .eq('onetsoc_code', socCode)
        .gte('data_value', 3.0); // Moderate importance threshold

    knowledge?.forEach((k) => skills.add(`knowledge:${k.element_id}`));

    // Get ability requirements
    const { data: abilities } = await supabase
        .from('onet_abilities')
        .select('element_id, scale_id, data_value')
        .eq('onetsoc_code', socCode)
        .gte('data_value', 3.0);

    abilities?.forEach((a) => skills.add(`ability:${a.element_id}`));

    return skills;
}

// Calculate Jaccard similarity between skill sets
function calculateSkillOverlap(skillsA: Set<string>, skillsB: Set<string>): number {
    const intersection = new Set([...skillsA].filter(x => skillsB.has(x)));
    const union = new Set([...skillsA, ...skillsB]);

    return union.size === 0 ? 0 : intersection.size / union.size;
}

// A* pathfinding to find optimal bridge roles
async function findBridgePath(
    supabase: BridgeSupabaseClient,
    origin: string,
    destination: string,
    originSkills: Set<string>,
    destSkills: Set<string>,
    maxLength: number
): Promise<BridgePathResult | null> {
    // Get related occupations from O*NET
    const { data: relatedOccupations } = await supabase
        .from('onet_occupation_enrichment')
        .select('soc_code, title')
        .limit(500); // Get sample of occupations for pathfinding

    if (!relatedOccupations) return null;

    // Priority queue for A*
    interface PathNode {
        soc: string;
        path: string[];
        overlaps: number[];
        gScore: number; // Cost from start
        fScore: number; // gScore + heuristic
    }

    const queue: PathNode[] = [{
        soc: origin,
        path: [origin],
        overlaps: [],
        gScore: 0,
        fScore: 1 - calculateSkillOverlap(originSkills, destSkills) // Heuristic: inverse of direct overlap
    }];

    const visited = new Set<string>();

    while (queue.length > 0) {
        // Sort by fScore (lowest first)
        queue.sort((a, b) => a.fScore - b.fScore);
        const current = queue.shift()!;

        if (current.path.length > maxLength + 1) continue;
        if (visited.has(current.soc)) continue;
        visited.add(current.soc);

        // Get current node skills
        const currentSkills = await getOccupationSkills(supabase, current.soc);

        // Check if we reached destination
        if (current.soc === destination) {
            const avgOverlap = current.overlaps.reduce((a, b) => a + b, 0) / current.overlaps.length;

            return {
                path_socs: current.path,
                skill_overlaps: current.overlaps,
                avg_skill_overlap: avgOverlap,
                total_distance: current.gScore,
                path_length: current.path.length - 2, // Exclude origin and destination
                feasibility_score: avgOverlap * 100,
                algorithm_used: 'a_star'
            };
        }

        // Explore neighbors (related occupations)
        for (const neighbor of relatedOccupations) {
            if (visited.has(neighbor.soc_code)) continue;
            if (current.path.includes(neighbor.soc_code)) continue; // Avoid cycles



            const neighborSkills = await getOccupationSkills(supabase, neighbor.soc_code);
            const overlap = calculateSkillOverlap(currentSkills, neighborSkills);

            // Only consider transitions with >50% overlap
            if (overlap < 0.50) continue;

            const newGScore = current.gScore + (1 - overlap);
            const heuristic = 1 - calculateSkillOverlap(neighborSkills, destSkills);
            const newFScore = newGScore + heuristic;

            queue.push({
                soc: neighbor.soc_code,
                path: [...current.path, neighbor.soc_code],
                overlaps: [...current.overlaps, overlap],
                gScore: newGScore,
                fScore: newFScore
            });
        }
    }

    return null; // No path found
}
