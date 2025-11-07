import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.22.4";
import { GeminiClient } from "../../lib/GeminiClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// REQUEST SCHEMA
// ============================================================================
const executeRequestSchema = z.object({
  deploymentId: z.string().uuid(),
  agentCode: z.string(),
  inputData: z.object({}).passthrough(), // Agent-specific input
  userId: z.string().uuid().optional(), // Will be extracted from auth if not provided
});

// ============================================================================
// AGENT HANDLERS
// ============================================================================

/**
 * Document Analyzer Agent
 * Analyzes documents and extracts key information
 */
async function executeDocAnalyzer(
  inputData: any,
  gemini: GeminiClient
): Promise<any> {
  const { documentText, analysisType = "summary" } = inputData;

  if (!documentText) {
    throw new Error("documentText is required for doc-analyzer");
  }

  const prompt = `You are a professional document analyzer. Analyze the following document and provide:
1. A concise summary (2-3 sentences)
2. Key points (bullet list)
3. Important entities (people, organizations, dates, amounts)
4. Document type classification
5. Any action items or deadlines

Document:
${documentText}

Return your analysis as JSON with these fields:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "entities": {"people": [], "organizations": [], "dates": [], "amounts": []},
  "documentType": "...",
  "actionItems": ["..."]
}`;

  const { text } = await gemini.generateContent(prompt);

  // Parse JSON response
  let analysis;
  try {
    analysis = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      analysis = JSON.parse(match[0]);
    } else {
      throw new Error("Failed to parse agent response");
    }
  }

  return {
    status: "completed",
    result: analysis,
    metadata: {
      documentLength: documentText.length,
      analysisType,
    },
  };
}

/**
 * Data Entry Automator Agent
 * Extracts structured data from unstructured input
 */
async function executeDataEntryAgent(
  inputData: any,
  gemini: GeminiClient
): Promise<any> {
  const { sourceText, targetSchema } = inputData;

  if (!sourceText) {
    throw new Error("sourceText is required for data-entry-agent");
  }

  const schemaDescription = targetSchema
    ? `Target schema: ${JSON.stringify(targetSchema)}`
    : "Extract all structured data you can find";

  const prompt = `You are a data extraction specialist. Extract structured data from the following text.
${schemaDescription}

Text:
${sourceText}

Return extracted data as JSON. If target schema is provided, match it exactly. Otherwise, extract all structured information you find (names, dates, numbers, addresses, etc.).`;

  const { text } = await gemini.generateContent(prompt);

  let extractedData;
  try {
    extractedData = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      extractedData = JSON.parse(match[0]);
    } else {
      throw new Error("Failed to parse extracted data");
    }
  }

  return {
    status: "completed",
    result: { extractedData },
    metadata: {
      fieldsExtracted: Object.keys(extractedData).length,
    },
  };
}

/**
 * Email Response Agent
 * Generates professional email responses
 */
async function executeEmailResponder(
  inputData: any,
  gemini: GeminiClient
): Promise<any> {
  const { emailContent, responseType = "reply", tone = "professional" } = inputData;

  if (!emailContent) {
    throw new Error("emailContent is required for email-responder");
  }

  const prompt = `You are a professional email assistant. Generate a ${tone} ${responseType} to the following email.

Original Email:
${emailContent}

Guidelines:
- Keep it concise and clear
- Match the tone (${tone})
- Include appropriate greeting and closing
- If it's an inquiry, provide helpful information
- If it's a meeting request, suggest availability or acknowledge receipt

Return JSON with:
{
  "subject": "...",
  "body": "...",
  "suggestedActions": ["..."]
}`;

  const { text } = await gemini.generateContent(prompt);

  let response;
  try {
    response = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      response = JSON.parse(match[0]);
    } else {
      throw new Error("Failed to parse email response");
    }
  }

  return {
    status: "completed",
    result: response,
    metadata: {
      tone,
      responseType,
    },
  };
}

/**
 * Report Generator Agent
 * Creates professional reports from data
 */
async function executeReportGenerator(
  inputData: any,
  gemini: GeminiClient
): Promise<any> {
  const { data, reportType = "summary", title } = inputData;

  if (!data) {
    throw new Error("data is required for report-generator");
  }

  const prompt = `You are a professional report writer. Create a ${reportType} report from the following data.

Data:
${JSON.stringify(data, null, 2)}

${title ? `Title: ${title}` : ""}

Create a well-structured report with:
1. Executive Summary
2. Key Findings (bullet points with numbers)
3. Detailed Analysis
4. Recommendations
5. Conclusion

Return JSON with:
{
  "title": "...",
  "executiveSummary": "...",
  "keyFindings": [{"finding": "...", "value": "..."}],
  "analysis": "...",
  "recommendations": ["..."],
  "conclusion": "..."
}`;

  const { text } = await gemini.generateContent(prompt);

  let report;
  try {
    report = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      report = JSON.parse(match[0]);
    } else {
      throw new Error("Failed to parse report");
    }
  }

  return {
    status: "completed",
    result: report,
    metadata: {
      reportType,
      dataPointsAnalyzed: Array.isArray(data) ? data.length : Object.keys(data).length,
    },
  };
}

/**
 * Calendar Scheduler Agent
 * Finds optimal meeting times and creates calendar events
 */
async function executeCalendarScheduler(
  inputData: any,
  gemini: GeminiClient
): Promise<any> {
  const {
    meetingRequest,
    participants,
    duration = 60,
    preferredTimes,
  } = inputData;

  if (!meetingRequest) {
    throw new Error("meetingRequest is required for calendar-scheduler");
  }

  const prompt = `You are a smart scheduling assistant. Analyze this meeting request and suggest optimal scheduling.

Meeting Request: ${meetingRequest}
Participants: ${participants ? participants.join(", ") : "Not specified"}
Duration: ${duration} minutes
Preferred Times: ${preferredTimes || "Flexible"}

Provide:
1. Meeting title (short, descriptive)
2. Suggested time slots (3 options)
3. Meeting agenda (bullet points)
4. Pre-meeting preparation items
5. Email invitation text

Return JSON with:
{
  "title": "...",
  "suggestedTimeSlots": ["...", "...", "..."],
  "agenda": ["..."],
  "preparation": ["..."],
  "invitationText": "..."
}`;

  const { text } = await gemini.generateContent(prompt);

  let schedule;
  try {
    schedule = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      schedule = JSON.parse(match[0]);
    } else {
      throw new Error("Failed to parse schedule");
    }
  }

  return {
    status: "completed",
    result: schedule,
    metadata: {
      duration,
      participantCount: participants ? participants.length : 0,
    },
  };
}

// ============================================================================
// AGENT ROUTER
// ============================================================================
async function routeAgent(
  agentCode: string,
  inputData: any,
  gemini: GeminiClient
): Promise<any> {
  switch (agentCode) {
    case "doc-analyzer":
      return await executeDocAnalyzer(inputData, gemini);
    case "data-entry-agent":
      return await executeDataEntryAgent(inputData, gemini);
    case "email-responder":
      return await executeEmailResponder(inputData, gemini);
    case "report-generator":
      return await executeReportGenerator(inputData, gemini);
    case "calendar-scheduler":
      return await executeCalendarScheduler(inputData, gemini);
    default:
      throw new Error(`Unknown agent: ${agentCode}`);
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse request
    const body = await req.json();
    const { deploymentId, agentCode, inputData, userId: providedUserId } =
      executeRequestSchema.parse(body);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header if not provided
    const authHeader = req.headers.get("authorization");
    let userId = providedUserId;

    if (!userId && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = user.id;
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Verify deployment belongs to user
    const { data: deployment, error: deploymentError } = await supabase
      .from("agent_deployments")
      .select("*")
      .eq("id", deploymentId)
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (deploymentError || !deployment) {
      return new Response(
        JSON.stringify({ error: "Deployment not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get agent info for credits
    const { data: agent, error: agentError } = await supabase
      .from("agent_registry")
      .select("credits_per_execution")
      .eq("agent_code", agentCode)
      .single();

    if (agentError || !agent) {
      throw new Error(`Agent ${agentCode} not found in registry`);
    }

    // Create execution record (pending)
    const { data: execution, error: execError } = await supabase
      .from("agent_executions")
      .insert({
        deployment_id: deploymentId,
        user_id: userId,
        agent_code: agentCode,
        input_data: inputData,
        status: "running",
        credits_charged: agent.credits_per_execution,
      })
      .select()
      .single();

    if (execError || !execution) {
      throw new Error("Failed to create execution record");
    }

    // Initialize Gemini client
    const gemini = new GeminiClient();

    // Execute agent
    let result;
    let status = "completed";
    let errorMessage = null;

    try {
      result = await routeAgent(agentCode, inputData, gemini);
    } catch (agentError) {
      console.error(`Agent execution error:`, agentError);
      status = "failed";
      errorMessage = agentError.message;
      result = { error: errorMessage };
    }

    // Update execution record with result
    const processingTime = Date.now() - startTime;
    const { error: updateError } = await supabase
      .from("agent_executions")
      .update({
        status,
        output_data: result,
        completed_at: new Date().toISOString(),
        processing_time_ms: processingTime,
        error_message: errorMessage,
        model_used: "gemini-2.5-flash",
      })
      .eq("id", execution.id);

    if (updateError) {
      console.error("Failed to update execution:", updateError);
    }

    return new Response(
      JSON.stringify({
        executionId: execution.id,
        status,
        result,
        processingTimeMs: processingTime,
        creditsCharged: agent.credits_per_execution,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("agent-execute error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error instanceof z.ZodError ? error.errors : undefined,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
