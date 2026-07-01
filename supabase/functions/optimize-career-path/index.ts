import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ReqSchema = z.object({
  starting_role: z.string().min(1),
  target_role: z.string().min(1),
  criteria: z.object({
    salary_growth: z.number().min(0).max(1).default(0.3),
    automation_safety: z.number().min(0).max(1).default(0.3),
    skill_transfer: z.number().min(0).max(1).default(0.2),
    time_efficiency: z.number().min(0).max(1).default(0.2),
  }).default({}),
  max_path_length: z.number().min(1).max(8).default(4),
});

interface JobEdgeRow {
  source_soc: string;
  target_soc: string;
  skill_overlap: number;
  transition_difficulty: number;
  source_title: string | null;
  target_title: string | null;
}

interface ApoLogRow {
  occupation_code: string;
  overall_apo: number | null;
}

interface BlsRow {
  occupation_code_6: string;
  median_wage_annual: number | null;
}

interface OccupationRow {
  occupation_code: string;
  occupation_title: string;
}

interface PathNode {
  soc: string;
  title: string;
  path: string[];
  titles: string[];
  gScore: number;
  fScore: number;
  overlaps: number[];
  skillGaps: Array<{ from: string; to: string; gap: number }>[];
}

/**
 * A* multi-criteria path optimization on occupation graph
 *
 * cost(u, v) = α * (-log(transition_prob[u→v]))
 *            + β * (apo[v] / 100)  // automation risk penalty
 *            - γ * (salary[v] - salary[u]) / max_salary  // salary growth bonus
 *            + δ * skill_gap_penalty(u, v)
 *
 * h(u, target) = skill_distance(u, target) * avg_edge_cost
 */
function aStarSearch(
  graph: Map<string, Array<{ target: string; weight: number; difficulty: number; targetTitle: string }>>,
  start: string,
  target: string,
  startTitle: string,
  targetTitle: string,
  apoMap: Map<string, number>,
  salaryMap: Map<string, number>,
  maxSalary: number,
  criteria: { salary_growth: number; automation_safety: number; skill_transfer: number; time_efficiency: number },
  maxLength: number,
): PathNode | null {
  const alpha = criteria.skill_transfer || 0.2;
  const beta = criteria.automation_safety || 0.3;
  const gamma = criteria.salary_growth || 0.3;
  const delta = criteria.time_efficiency || 0.2;

  const targetApo = apoMap.get(target) ?? 50;
  const targetSalary = salaryMap.get(target) ?? 0;

  const heuristic = (soc: string): number => {
    const apo = apoMap.get(soc) ?? 50;
    const salary = salaryMap.get(soc) ?? 0;
    // Estimate remaining cost based on APO and salary distance
    const apoDist = Math.abs(apo - targetApo) / 100;
    const salaryDist = maxSalary > 0 ? Math.abs(salary - targetSalary) / maxSalary : 0;
    return (beta * apoDist + gamma * salaryDist) * 0.5;
  };

  const open: PathNode[] = [{
    soc: start,
    title: startTitle,
    path: [start],
    titles: [startTitle],
    gScore: 0,
    fScore: heuristic(start),
    overlaps: [],
    skillGaps: [],
  }];

  const visited = new Set<string>();
  let iterations = 0;
  const MAX_ITER = 5000;

  while (open.length > 0 && iterations < MAX_ITER) {
    iterations++;

    // Sort by fScore (priority queue simulation)
    open.sort((a, b) => a.fScore - b.fScore);
    const current = open.shift()!;

    if (current.soc === target) {
      return current;
    }

    if (current.path.length > maxLength + 1) continue;
    if (visited.has(current.soc)) continue;
    visited.add(current.soc);

    const neighbors = graph.get(current.soc) || [];
    for (const edge of neighbors) {
      if (visited.has(edge.target)) continue;
      if (current.path.includes(edge.target)) continue;

      const transitionProb = Math.max(0.01, edge.weight);
      const apoV = apoMap.get(edge.target) ?? 50;
      const salaryU = salaryMap.get(current.soc) ?? 0;
      const salaryV = salaryMap.get(edge.target) ?? 0;

      // Multi-criteria edge cost
      const cost =
        alpha * (-Math.log(transitionProb)) +
        beta * (apoV / 100) -
        gamma * (maxSalary > 0 ? (salaryV - salaryU) / maxSalary : 0) +
        delta * (edge.difficulty || 0.5);

      const newGScore = current.gScore + cost;
      const newFScore = newGScore + heuristic(edge.target);

      open.push({
        soc: edge.target,
        title: edge.targetTitle,
        path: [...current.path, edge.target],
        titles: [...current.titles, edge.targetTitle],
        gScore: newGScore,
        fScore: newFScore,
        overlaps: [...current.overlaps, edge.weight],
        skillGaps: [...current.skillGaps, [{ from: current.soc, to: edge.target, gap: 1 - edge.weight }]],
      });
    }
  }

  return null;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const raw = await req.text();
    let body: z.infer<typeof ReqSchema>;
    try {
      body = ReqSchema.parse(JSON.parse(raw));
    } catch (_e) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch job_edges to build graph
    const { data: edges } = await supabase
      .from("job_edges")
      .select("source_soc, target_soc, skill_overlap, transition_difficulty, source_title, target_title")
      .limit(2000) as { data: JobEdgeRow[] | null; error: unknown };

    // 2. Fetch occupation titles
    const { data: occRows } = await supabase
      .from("onet_occupation_enrichment")
      .select("occupation_code, occupation_title")
      .limit(1000) as { data: OccupationRow[] | null; error: unknown };

    const titleMap = new Map<string, string>();
    if (occRows) {
      for (const o of occRows) titleMap.set(o.occupation_code, o.occupation_title);
    }

    // 3. Fetch APO scores
    const allSocs = new Set<string>([body.starting_role, body.target_role]);
    if (edges) {
      for (const e of edges) {
        allSocs.add(e.source_soc);
        allSocs.add(e.target_soc);
      }
    }

    const { data: apoLogs } = await supabase
      .from("apo_logs")
      .select("occupation_code, overall_apo")
      .in("occupation_code", Array.from(allSocs))
      .not("overall_apo", "is", null)
      .order("created_at", { ascending: false })
      .limit(500) as { data: ApoLogRow[] | null; error: unknown };

    const apoMap = new Map<string, number>();
    if (apoLogs) {
      for (const log of apoLogs) {
        if (!apoMap.has(log.occupation_code) && log.overall_apo !== null) {
          apoMap.set(log.occupation_code, Number(log.overall_apo));
        }
      }
    }

    // 4. Fetch salary data from BLS
    const { data: blsRows } = await supabase
      .from("bls_employment_projections")
      .select("occupation_code_6, median_wage_annual")
      .in("occupation_code_6", Array.from(allSocs).map((s) => s.substring(0, 6)))
      .limit(500) as { data: BlsRow[] | null; error: unknown };

    const salaryMap = new Map<string, number>();
    let maxSalary = 1;
    if (blsRows) {
      for (const b of blsRows) {
        if (b.median_wage_annual && b.median_wage_annual > 0) {
          salaryMap.set(b.occupation_code_6, Number(b.median_wage_annual));
          maxSalary = Math.max(maxSalary, Number(b.median_wage_annual));
        }
      }
    }

    // 5. Build adjacency graph
    const graph = new Map<string, Array<{ target: string; weight: number; difficulty: number; targetTitle: string }>>();
    if (edges) {
      for (const e of edges) {
        if (!graph.has(e.source_soc)) graph.set(e.source_soc, []);
        graph.get(e.source_soc)!.push({
          target: e.target_soc,
          weight: clamp(Number(e.skill_overlap) || 0.5, 0.01, 1),
          difficulty: clamp(Number(e.transition_difficulty) || 0.5, 0, 1),
          targetTitle: e.target_title || titleMap.get(e.target_soc) || e.target_soc,
        });
      }
    }

    // 6. Run A* search
    const startTitle = titleMap.get(body.starting_role) ?? body.starting_role;
    const targetTitle = titleMap.get(body.target_role) ?? body.target_role;

    const result = aStarSearch(
      graph,
      body.starting_role,
      body.target_role,
      startTitle,
      targetTitle,
      apoMap,
      salaryMap,
      maxSalary,
      body.criteria,
      body.max_path_length,
    );

    if (!result) {
      return new Response(JSON.stringify({
        error: "No feasible path found",
        starting_role: body.starting_role,
        target_role: body.target_role,
        suggestion: "Try increasing max_path_length or check if job_edges data exists for these occupations",
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. Build response
    const avgOverlap = result.overlaps.length > 0
      ? result.overlaps.reduce((a, b) => a + b, 0) / result.overlaps.length
      : 0;

    const pathAPOs = result.path.map((soc) => apoMap.get(soc) ?? null);
    const pathSalaries = result.path.map((soc) => salaryMap.get(soc.substring(0, 6)) ?? null);

    const automationSafetyScore = clamp(
      Math.round(100 - (pathAPOs.reduce((a, b) => a + (b ?? 50), 0) / result.path.length)),
      0,
      100,
    );

    const estimatedMonths = result.path.length * 6 + Math.round((1 - avgOverlap) * 12);

    const response = {
      starting_role: body.starting_role,
      target_role: body.target_role,
      optimal_path: result.path.map((soc, i) => ({
        step: i,
        occupation_code: soc,
        occupation_title: result.titles[i],
        automation_apo: pathAPOs[i],
        median_salary: pathSalaries[i],
      })),
      path_length: result.path.length - 2,
      estimated_months: estimatedMonths,
      avg_skill_overlap: Math.round(avgOverlap * 1000) / 1000,
      automation_safety_score: automationSafetyScore,
      total_cost: Math.round(result.gScore * 1000) / 1000,
      salary_projection: pathSalaries,
      skill_gaps_per_step: result.skillGaps.map((gaps, i) => ({
        step: i,
        gaps: gaps.map((g) => ({ from: g.from, to: g.to, gap_size: Math.round(g.gap * 1000) / 1000 })),
      })),
      algorithm: "a_star_multicriteria",
      criteria_used: body.criteria,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("optimize-career-path error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
