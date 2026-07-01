import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const ReqSchema = z.object({
  format: z.enum(["json", "edge_list", "pyg_ready"]).default("json"),
  include_features: z.boolean().default(true),
  include_labels: z.boolean().default(true),
  min_skill_overlap: z.number().min(0).max(1).default(0.1),
});

interface JobEdgeRow {
  source_soc: string;
  target_soc: string;
  skill_overlap: number;
  transition_difficulty: number;
}

interface ApoLogRow {
  occupation_code: string;
  overall_apo: number | null;
  category_scores: Record<string, number> | null;
}

interface OccupationRow {
  occupation_code: string;
  occupation_title: string;
}

interface KnowledgeRow {
  occupation_code: string;
  knowledge_id: string;
  importance: number;
}

/**
 * GNN Graph Export
 *
 * Exports the occupation-skill graph in formats suitable for
 * training Graph Neural Networks in Python (PyTorch Geometric, DGL).
 *
 * HARD STOP: This function ONLY exports the graph structure and features.
 * Actual GNN training requires a Python runtime (PyTorch + PyG/DGL)
 * which is not available in Supabase Edge Functions.
 *
 * Output formats:
 * - json: Full JSON with nodes, edges, features, labels
 * - edge_list: Simple (src, dst, weight) tuples
 * - pyg_ready: JSON formatted for direct loading into PyTorch Geometric
 *   (includes node_features, edge_index, edge_weight, labels)
 */
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

    // 1. Fetch all job edges
    const { data: edges } = await supabase
      .from("job_edges")
      .select("source_soc, target_soc, skill_overlap, transition_difficulty")
      .gte("skill_overlap", body.min_skill_overlap)
      .limit(10000) as { data: JobEdgeRow[] | null; error: unknown };

    // 2. Fetch all occupation titles
    const { data: occRows } = await supabase
      .from("onet_occupation_enrichment")
      .select("occupation_code, occupation_title")
      .limit(2000) as { data: OccupationRow[] | null; error: unknown };

    const titleMap = new Map<string, string>();
    if (occRows) {
      for (const o of occRows) titleMap.set(o.occupation_code, o.occupation_title);
    }

    // 3. Fetch APO scores (node labels for GNN)
    const allSocs = new Set<string>();
    if (edges) {
      for (const e of edges) {
        allSocs.add(e.source_soc);
        allSocs.add(e.target_soc);
      }
    }

    const { data: apoLogs } = await supabase
      .from("apo_logs")
      .select("occupation_code, overall_apo, category_scores")
      .in("occupation_code", Array.from(allSocs))
      .not("overall_apo", "is", null)
      .order("created_at", { ascending: false })
      .limit(5000) as { data: ApoLogRow[] | null; error: unknown };

    const apoMap = new Map<string, { overall: number; categories: Record<string, number> | null }>();
    if (apoLogs) {
      for (const log of apoLogs) {
        if (!apoMap.has(log.occupation_code) && log.overall_apo !== null) {
          apoMap.set(log.occupation_code, {
            overall: Number(log.overall_apo),
            categories: log.category_scores,
          });
        }
      }
    }

    // 4. Fetch knowledge features (node features for GNN)
    const { data: knowledgeRows } = await supabase
      .from("onet_knowledge")
      .select("occupation_code, knowledge_id, importance")
      .in("occupation_code", Array.from(allSocs))
      .gte("importance", 2.0)
      .limit(10000) as { data: KnowledgeRow[] | null; error: unknown };

    // Build node feature vectors (knowledge importance as features)
    const nodeFeatures = new Map<string, Record<string, number>>();
    if (knowledgeRows) {
      for (const k of knowledgeRows) {
        if (!nodeFeatures.has(k.occupation_code)) {
          nodeFeatures.set(k.occupation_code, {});
        }
        nodeFeatures.get(k.occupation_code)![k.knowledge_id] = Number(k.importance);
      }
    }

    // 5. Build node index mapping
    const nodeList = Array.from(allSocs).sort();
    const nodeIndexMap = new Map<string, number>();
    nodeList.forEach((soc, i) => nodeIndexMap.set(soc, i));

    // 6. Build edge index (2 x E tensor for PyG)
    const edgeIndex: number[][] = [[], []];
    const edgeWeight: number[] = [];
    const edgeList: Array<{ src: string; dst: string; weight: number; src_idx: number; dst_idx: number }> = [];

    if (edges) {
      for (const e of edges) {
        const srcIdx = nodeIndexMap.get(e.source_soc);
        const dstIdx = nodeIndexMap.get(e.target_soc);
        if (srcIdx === undefined || dstIdx === undefined) continue;

        edgeIndex[0].push(srcIdx);
        edgeIndex[1].push(dstIdx);
        edgeWeight.push(Number(e.skill_overlap));

        edgeList.push({
          src: e.source_soc,
          dst: e.target_soc,
          weight: Number(e.skill_overlap),
          src_idx: srcIdx,
          dst_idx: dstIdx,
        });

        // Add reverse edge (undirected graph)
        edgeIndex[0].push(dstIdx);
        edgeIndex[1].push(srcIdx);
        edgeWeight.push(Number(e.skill_overlap));
      }
    }

    // 7. Build labels (APO scores as regression targets)
    const labels: Array<{ occupation_code: string; node_idx: number; apo: number | null }> = [];
    for (const soc of nodeList) {
      const apo = apoMap.get(soc);
      labels.push({
        occupation_code: soc,
        node_idx: nodeIndexMap.get(soc)!,
        apo: apo?.overall ?? null,
      });
    }

    // 8. Build response based on format
    let response: Record<string, unknown>;

    if (body.format === "edge_list") {
      response = {
        format: "edge_list",
        num_nodes: nodeList.length,
        num_edges: edgeList.length,
        edges: edgeList.map((e) => [e.src_idx, e.dst_idx, e.weight]),
      };
    } else if (body.format === "pyg_ready") {
      // Format for direct loading into PyTorch Geometric
      const nodeFeatureMatrix = nodeList.map((soc) => {
        const feats = nodeFeatures.get(soc) ?? {};
        return feats;
      });

      response = {
        format: "pyg_ready",
        num_nodes: nodeList.length,
        num_edges: edgeIndex[0].length,
        edge_index: edgeIndex, // [2, E] — transpose for PyG
        edge_weight: edgeWeight,
        node_features: body.include_features ? nodeFeatureMatrix : undefined,
        node_labels: body.include_labels
          ? labels.map((l) => l.apo)
          : undefined,
        node_ids: nodeList,
        node_titles: nodeList.map((soc) => titleMap.get(soc) ?? soc),
        metadata: {
          export_date: new Date().toISOString(),
          min_skill_overlap: body.min_skill_overlap,
          feature_dim: Object.keys(nodeFeatures.get(nodeList[0]) ?? {}).length || 0,
          task_type: "regression",
          target: "automation_probability",
          training_instructions: "Load this JSON in Python, convert edge_index to torch.LongTensor, edge_weight to torch.FloatTensor, build node feature tensor from node_features. Use PyG Data object. GNN training requires Python runtime — NOT available in Supabase Edge Functions.",
        },
      };
    } else {
      // Full JSON format
      response = {
        format: "json",
        num_nodes: nodeList.length,
        num_edges: edgeList.length,
        nodes: nodeList.map((soc, i) => ({
          idx: i,
          occupation_code: soc,
          occupation_title: titleMap.get(soc) ?? soc,
          features: body.include_features ? (nodeFeatures.get(soc) ?? {}) : undefined,
          label: body.include_labels ? (apoMap.get(soc)?.overall ?? null) : undefined,
          category_scores: body.include_labels ? (apoMap.get(soc)?.categories ?? null) : undefined,
        })),
        edges: edgeList.map((e) => ({
          source: e.src,
          target: e.dst,
          source_idx: e.src_idx,
          target_idx: e.dst_idx,
          weight: e.weight,
        })),
        metadata: {
          export_date: new Date().toISOString(),
          min_skill_overlap: body.min_skill_overlap,
          graph_type: "directed_occupation_skill_graph",
          hard_stop: "GNN training requires Python runtime (PyTorch + PyG/DGL). This export is graph structure + features only.",
        },
      };
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("export-gnn-graph error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
