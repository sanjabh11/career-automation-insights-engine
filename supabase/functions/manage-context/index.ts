import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GeminiClient } from "../../lib/GeminiClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ManageContextRequest {
  action: 'save' | 'load' | 'update' | 'summarize' | 'clear';
  sessionId: string;
  conversationType?: 'career_coaching' | 'skill_planning' | 'resume_review' | 'general';
  data?: {
    message?: { role: string; content: string };
    userContext?: Record<string, any>;
    userPreferences?: Record<string, any>;
    mentionedOccupations?: string[];
    mentionedSkills?: string[];
  };
}

interface ContextResponse {
  success: boolean;
  context?: {
    sessionId: string;
    conversationType: string;
    conversationHistory: Array<{ role: string; content: string; timestamp: string }>;
    userContext: Record<string, any>;
    userPreferences: Record<string, any>;
    memorySummary?: string;
    keyFacts?: string[];
    lastInteractionAt: string;
  };
  message?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    const body: ManageContextRequest = await req.json();
    const { action, sessionId, conversationType, data } = body;

    if (!sessionId) {
      throw new Error("sessionId is required");
    }

    let response: ContextResponse = { success: false };

    switch (action) {
      case "save":
      case "update": {
        // Load existing context or create new
        const { data: existingContext } = await supabaseClient
          .from("conversation_context")
          .select("*")
          .eq("user_id", user.id)
          .eq("session_id", sessionId)
          .single();

        const conversationHistory = existingContext?.conversation_history || [];
        
        // Add new message if provided
        if (data?.message) {
          conversationHistory.push({
            ...data.message,
            timestamp: new Date().toISOString(),
          });
        }

        const contextData = {
          user_id: user.id,
          session_id: sessionId,
          conversation_type: conversationType || existingContext?.conversation_type || 'general',
          conversation_history: conversationHistory,
          user_context: {
            ...(existingContext?.user_context || {}),
            ...(data?.userContext || {}),
          },
          user_preferences: {
            ...(existingContext?.user_preferences || {}),
            ...(data?.userPreferences || {}),
          },
          mentioned_occupations: [
            ...(existingContext?.mentioned_occupations || []),
            ...(data?.mentionedOccupations || []),
          ],
          mentioned_skills: [
            ...(existingContext?.mentioned_skills || []),
            ...(data?.mentionedSkills || []),
          ],
          last_interaction_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        };

        // Summarize if conversation is getting long (>20 messages)
        if (conversationHistory.length > 20) {
          const gemini = new GeminiClient();
          const summaryPrompt = `Summarize the following conversation into key facts and context (max 200 words):

${conversationHistory.slice(-20).map(m => `${m.role}: ${m.content}`).join('\n\n')}

Extract:
1. User's career goals
2. Current situation
3. Key constraints or preferences
4. Mentioned skills/occupations
5. Important decisions or insights

Return as JSON: { "summary": string, "keyFacts": string[] }`;

          try {
            const summaryResponse = await gemini.generateContent({
              prompt: summaryPrompt,
              temperature: 0.3,
              responseFormat: { type: "json_object" },
            });

            const { summary, keyFacts } = JSON.parse(summaryResponse.text);
            contextData.memory_summary = summary;
            contextData.key_facts = keyFacts;
          } catch (error) {
            console.error("Failed to generate summary:", error);
          }
        }

        const { data: savedContext, error: saveError } = await supabaseClient
          .from("conversation_context")
          .upsert(contextData, { onConflict: "user_id,session_id" })
          .select()
          .single();

        if (saveError) throw saveError;

        response = {
          success: true,
          context: {
            sessionId: savedContext.session_id,
            conversationType: savedContext.conversation_type,
            conversationHistory: savedContext.conversation_history,
            userContext: savedContext.user_context,
            userPreferences: savedContext.user_preferences,
            memorySummary: savedContext.memory_summary,
            keyFacts: savedContext.key_facts,
            lastInteractionAt: savedContext.last_interaction_at,
          },
          message: "Context saved successfully",
        };
        break;
      }

      case "load": {
        const { data: context, error: loadError } = await supabaseClient
          .from("conversation_context")
          .select("*")
          .eq("user_id", user.id)
          .eq("session_id", sessionId)
          .single();

        if (loadError && loadError.code !== "PGRST116") {
          throw loadError;
        }

        if (!context) {
          response = {
            success: false,
            message: "No context found for this session",
          };
        } else {
          // Update last interaction time
          await supabaseClient
            .from("conversation_context")
            .update({ last_interaction_at: new Date().toISOString() })
            .eq("id", context.id);

          response = {
            success: true,
            context: {
              sessionId: context.session_id,
              conversationType: context.conversation_type,
              conversationHistory: context.conversation_history,
              userContext: context.user_context,
              userPreferences: context.user_preferences,
              memorySummary: context.memory_summary,
              keyFacts: context.key_facts,
              lastInteractionAt: context.last_interaction_at,
            },
          };
        }
        break;
      }

      case "summarize": {
        const { data: context } = await supabaseClient
          .from("conversation_context")
          .select("*")
          .eq("user_id", user.id)
          .eq("session_id", sessionId)
          .single();

        if (!context) {
          throw new Error("Context not found");
        }

        const gemini = new GeminiClient();
        const summaryPrompt = `Provide a comprehensive summary of this conversation:

${context.conversation_history.map(m => `${m.role}: ${m.content}`).join('\n\n')}

Return as JSON: { "summary": string, "keyFacts": string[], "actionItems": string[], "followUpTopics": string[] }`;

        const summaryResponse = await gemini.generateContent({
          prompt: summaryPrompt,
          temperature: 0.3,
          responseFormat: { type: "json_object" },
        });

        const summary = JSON.parse(summaryResponse.text);

        // Update context with new summary
        await supabaseClient
          .from("conversation_context")
          .update({
            memory_summary: summary.summary,
            key_facts: summary.keyFacts,
          })
          .eq("id", context.id);

        response = {
          success: true,
          context: {
            ...context,
            memorySummary: summary.summary,
            keyFacts: summary.keyFacts,
          },
          message: "Context summarized successfully",
        };
        break;
      }

      case "clear": {
        const { error: deleteError } = await supabaseClient
          .from("conversation_context")
          .delete()
          .eq("user_id", user.id)
          .eq("session_id", sessionId);

        if (deleteError) throw deleteError;

        response = {
          success: true,
          message: "Context cleared successfully",
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Context management error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to manage context",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
