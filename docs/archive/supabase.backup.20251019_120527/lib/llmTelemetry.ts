// supabase/lib/llmTelemetry.ts
// Common LLM telemetry logging helper for consistent tracking across Edge Functions

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts";

interface LLMLogEntry {
  user_id?: string | null;
  function_name: string;
  prompt: string;
  response: string;
  model?: string;
  generation_config?: Record<string, any>;
  tokens_used?: number;
  latency_ms: number;
  prompt_hash?: string;
  error_message?: string | null;
}

/**
 * Log LLM interaction to llm_logs table with consistent telemetry
 * @param entry - Log entry with prompt, response, and metadata
 * @returns Promise<void>
 */
export async function logLLM(entry: LLMLogEntry): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials missing - skipping LLM log");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate prompt hash for deduplication and analysis
    const promptHash = entry.prompt_hash || 
      createHash("sha256").update(entry.prompt).digest("hex").substring(0, 16);

    const logEntry = {
      user_id: entry.user_id || null,
      function_name: entry.function_name,
      prompt: entry.prompt.substring(0, 500), // Truncate for storage
      response: entry.response.substring(0, 2000), // Truncate for storage
      model: entry.model || null,
      generation_config: entry.generation_config || null,
      tokens_used: entry.tokens_used || null,
      latency_ms: entry.latency_ms,
      prompt_hash: promptHash,
      error_message: entry.error_message || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("llm_logs").insert(logEntry);

    if (error) {
      console.error("Failed to log LLM interaction:", error);
    }
  } catch (err) {
    console.error("Error in logLLM helper:", err);
  }
}

/**
 * Generate a short hash of a prompt for tracking and deduplication
 * @param prompt - The prompt text to hash
 * @returns 16-character hex hash
 */
export function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex").substring(0, 16);
}
