import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================
const deployRequestSchema = z.object({
  agentCode: z.string(),
  deploymentName: z.string().min(1).max(100),
  configuration: z.object({}).passthrough().optional(),
});

const updateDeploymentSchema = z.object({
  deploymentId: z.string().uuid(),
  deploymentName: z.string().min(1).max(100).optional(),
  configuration: z.object({}).passthrough().optional(),
  status: z.enum(["active", "paused", "deleted"]).optional(),
});

// ============================================================================
// MAIN HANDLER
// ============================================================================
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // POST /agent-deploy - Deploy new agent
    // ========================================================================
    if (req.method === "POST") {
      const body = await req.json();
      const { agentCode, deploymentName, configuration } =
        deployRequestSchema.parse(body);

      // Verify agent exists in registry
      const { data: agent, error: agentError } = await supabase
        .from("agent_registry")
        .select("*")
        .eq("agent_code", agentCode)
        .eq("status", "active")
        .single();

      if (agentError || !agent) {
        return new Response(
          JSON.stringify({ error: `Agent ${agentCode} not found or inactive` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create deployment
      const { data: deployment, error: deployError } = await supabase
        .from("agent_deployments")
        .insert({
          user_id: user.id,
          agent_code: agentCode,
          deployment_name: deploymentName,
          configuration: configuration || {},
          status: "active",
        })
        .select()
        .single();

      if (deployError) {
        throw deployError;
      }

      return new Response(
        JSON.stringify({
          deployment,
          agent: {
            code: agent.agent_code,
            name: agent.name,
            description: agent.description,
            category: agent.category,
            creditsPerExecution: agent.credits_per_execution,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // PATCH /agent-deploy - Update deployment
    // ========================================================================
    if (req.method === "PATCH") {
      const body = await req.json();
      const { deploymentId, deploymentName, configuration, status } =
        updateDeploymentSchema.parse(body);

      // Verify deployment belongs to user
      const { data: existingDeployment, error: checkError } = await supabase
        .from("agent_deployments")
        .select("*")
        .eq("id", deploymentId)
        .eq("user_id", user.id)
        .single();

      if (checkError || !existingDeployment) {
        return new Response(
          JSON.stringify({ error: "Deployment not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build update object
      const updates: any = {};
      if (deploymentName) updates.deployment_name = deploymentName;
      if (configuration) updates.configuration = configuration;
      if (status) updates.status = status;

      // Update deployment
      const { data: updatedDeployment, error: updateError } = await supabase
        .from("agent_deployments")
        .update(updates)
        .eq("id", deploymentId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ deployment: updatedDeployment }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // GET /agent-deploy - Get user's deployments
    // ========================================================================
    if (req.method === "GET") {
      const { data: deployments, error } = await supabase
        .from("agent_deployments")
        .select(`
          id,
          agent_code,
          deployment_name,
          configuration,
          status,
          deployed_at,
          last_executed_at,
          total_executions,
          successful_executions,
          failed_executions,
          total_credits_used
        `)
        .eq("user_id", user.id)
        .order("deployed_at", { ascending: false });

      if (error) {
        throw error;
      }

      // Enrich with agent info
      const enrichedDeployments = await Promise.all(
        (deployments || []).map(async (deployment) => {
          const { data: agent } = await supabase
            .from("agent_registry")
            .select("name, description, category, icon")
            .eq("agent_code", deployment.agent_code)
            .single();

          return {
            ...deployment,
            agentInfo: agent,
          };
        })
      );

      return new Response(
        JSON.stringify({
          deployments: enrichedDeployments,
          total: enrichedDeployments.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // DELETE /agent-deploy?deploymentId=xxx - Delete deployment
    // ========================================================================
    if (req.method === "DELETE") {
      const url = new URL(req.url);
      const deploymentId = url.searchParams.get("deploymentId");

      if (!deploymentId) {
        throw new Error("deploymentId query parameter is required");
      }

      // Soft delete (set status to 'deleted')
      const { error: deleteError } = await supabase
        .from("agent_deployments")
        .update({ status: "deleted" })
        .eq("id", deploymentId)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      return new Response(
        JSON.stringify({ success: true, message: "Deployment deleted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("agent-deploy error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error instanceof z.ZodError ? error.errors : undefined,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
