import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ReqSchema = z.object({
  occupation_code: z.string().min(1),
  shock_magnitude: z.number().min(0).max(100).default(50),
  depth: z.number().min(1).max(5).default(2),
});

interface DependencyRow {
  source_soc: string;
  target_soc: string;
  dependency_weight: number;
  dependency_type: string;
}

interface ApoLogRow {
  occupation_code: string;
  overall_apo: number | null;
}

interface OccupationRow {
  occupation_code: string;
  occupation_title: string;
}

/**
 * Linear Threshold Cascade Model (Kempe et al. 2003)
 *
 * Each occupation has a threshold θ = 1 - (APO/100).
 * Higher APO = lower threshold = more susceptible to cascade.
 * An occupation "adopts" (is affected) when cumulative weighted
 * influence from affected neighbors exceeds its threshold.
 */
function simulateCascade(
  adjacency: Map<string, Array<{ target: string; weight: number }>>,
  apoMap: Map<string, number>,
  startNode: string,
  shockMagnitude: number,
  maxDepth: number,
): {
  affected: Map<string, number>;
  cascadeDepth: number;
  cascadeSize: number;
  bottlenecks: string[];
} {
  const affected = new Map<string, number>();
  affected.set(startNode, shockMagnitude);

  let cascadeDepth = 0;

  for (let d = 0; d < maxDepth; d++) {
    let newAdoptions = 0;

    for (const [node, shock] of affected) {
      const neighbors = adjacency.get(node) || [];
      for (const edge of neighbors) {
        if (affected.has(edge.target)) continue;

        const targetApo = apoMap.get(edge.target) ?? 50;
        const threshold = 1 - targetApo / 100;

        // Cumulative weighted influence from all affected neighbors
        let totalInfluence = 0;
        for (const [src, srcShock] of affected) {
          const srcEdges = adjacency.get(src) || [];
          const edgeToTarget = srcEdges.find((e) => e.target === edge.target);
          if (edgeToTarget) {
            totalInfluence += edgeToTarget.weight * (srcShock / 100);
          }
        }

        if (totalInfluence >= threshold) {
          const propagatedShock = Math.min(
            100,
            targetApo + totalInfluence * 100,
          );
          affected.set(edge.target, Math.round(propagatedShock * 100) / 100);
          newAdoptions++;
        }
      }
    }

    if (newAdoptions === 0) break;
    cascadeDepth = d + 1;
  }

  // Find bottleneck occupations (nodes that, if removed, would disconnect the most paths)
  const bottlenecks: string[] = [];
  for (const [node] of affected) {
    if (node === startNode) continue;
    const neighbors = adjacency.get(node) || [];
    const downstreamCount = neighbors.filter((n) => affected.has(n.target)).length;
    if (downstreamCount >= 2) bottlenecks.push(node);
  }

  return {
    affected,
    cascadeDepth,
    cascadeSize: affected.size,
    bottlenecks: bottlenecks.slice(0, 10),
  };
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

    // Fetch dependencies involving the target occupation
    const { data: deps, error: depsErr } = await supabase
      .from("occupation_dependencies")
      .select("source_soc, target_soc, dependency_weight, dependency_type")
      .or(`source_soc.eq.${body.occupation_code},target_soc.eq.${body.occupation_code}`)
      .limit(500) as { data: DependencyRow[] | null; error: unknown };

    if (depsErr) {
      return new Response(JSON.stringify({ error: "Failed to fetch dependencies" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Also fetch job_edges for additional graph connectivity
    const { data: jobEdges } = await supabase
      .from("job_edges")
      .select("source_soc, target_soc, skill_overlap")
      .or(`source_soc.eq.${body.occupation_code},target_soc.eq.${body.occupation_code}`)
      .limit(200) as { data: Array<{ source_soc: string; target_soc: string; skill_overlap: number }> | null };

    // Build adjacency list (directed: source depends on target → cascade flows source→target)
    const adjacency = new Map<string, Array<{ target: string; weight: number }>>();

    if (deps) {
      for (const d of deps) {
        if (!adjacency.has(d.source_soc)) adjacency.set(d.source_soc, []);
        adjacency.get(d.source_soc)!.push({
          target: d.target_soc,
          weight: d.dependency_weight,
        });
      }
    }

    // Add job_edges as bidirectional with skill_overlap as weight
    if (jobEdges) {
      for (const e of jobEdges) {
        const w = clamp(Number(e.skill_overlap) || 0.5, 0, 1);
        if (!adjacency.has(e.source_soc)) adjacency.set(e.source_soc, []);
        adjacency.get(e.source_soc)!.push({ target: e.target_soc, weight: w });
        if (!adjacency.has(e.target_soc)) adjacency.set(e.target_soc, []);
        adjacency.get(e.target_soc)!.push({ target: e.source_soc, weight: w });
      }
    }

    // Fetch APO scores for all involved occupations
    const allSocs = new Set<string>();
    for (const [src, edges] of adjacency) {
      allSocs.add(src);
      for (const e of edges) allSocs.add(e.target);
    }
    allSocs.add(body.occupation_code);

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

    // Fetch occupation titles
    const { data: occRows } = await supabase
      .from("onet_occupation_enrichment")
      .select("occupation_code, occupation_title")
      .in("occupation_code", Array.from(allSocs))
      .limit(500) as { data: OccupationRow[] | null; error: unknown };

    const titleMap = new Map<string, string>();
    if (occRows) {
      for (const o of occRows) {
        titleMap.set(o.occupation_code, o.occupation_title);
      }
    }

    // Run cascade simulation
    const result = simulateCascade(
      adjacency,
      apoMap,
      body.occupation_code,
      body.shock_magnitude,
      body.depth,
    );

    // Build response
    const affectedList = Array.from(result.affected.entries())
      .map(([soc, shock]) => ({
        occupation_code: soc,
        occupation_title: titleMap.get(soc) ?? soc,
        shock_level: shock,
        baseline_apo: apoMap.get(soc) ?? null,
      }))
      .sort((a, b) => b.shock_level - a.shock_level);

    const bottleneckList = result.bottlenecks.map((soc) => ({
      occupation_code: soc,
      occupation_title: titleMap.get(soc) ?? soc,
    }));

    // Timeline estimate: higher shock = faster cascade
    const timelineMonths = clamp(
      Math.round(6 + (100 - body.shock_magnitude) * 0.6 + result.cascadeDepth * 3),
      3,
      60,
    );

    const response = {
      occupation_code: body.occupation_code,
      occupation_title: titleMap.get(body.occupation_code) ?? body.occupation_code,
      cascade_score: clamp(
        Math.round((result.cascadeSize / Math.max(allSocs.size, 1)) * 100),
        0,
        100,
      ),
      cascade_size: result.cascadeSize,
      cascade_depth: result.cascadeDepth,
      total_nodes_in_graph: allSocs.size,
      affected_occupations: affectedList,
      bottleneck_occupations: bottleneckList,
      timeline_months: timelineMonths,
      model: "linear_threshold_cascade",
      recommendations: [
        "Reduce dependency weight on high-automation upstream roles",
        "Diversify skill-supply chains to avoid single-point-of-failure cascades",
        "Strengthen bridge occupations that buffer cross-cluster contagion",
        "Stagger automation adoption timelines to avoid synchronized shocks",
      ],
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("cascade-risk-graph error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
