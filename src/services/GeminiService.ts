// GeminiService: Server-side Gemini via Supabase Edge Function
// Usage: GeminiService.generate(prompt, config?) -> calls supabase.functions.invoke('gemini-generate')

export interface GeminiResponse {
  text: string;
  usageMetadata?: Record<string, unknown>;
  latency_ms?: number;
}

type GeminiFunctionResponse = {
  text: string;
  usageMetadata?: Record<string, unknown>;
  latency_ms?: number;
};

import { supabase } from '@/integrations/supabase/client';

export class GeminiService {
  /**
   * Generate LLM output using server-side Edge Function.
   * @param prompt User/system prompt
   * @param generationConfig Gemini API generationConfig (optional)
   */
  static async generate(
    prompt: string,
    generationConfig?: object,
  ): Promise<GeminiResponse> {
    const started = Date.now();
    const { data, error } = await supabase.functions.invoke('gemini-generate', {
      body: { prompt, generationConfig },
    });
    const latency = Date.now() - started;
    if (error) {
      throw new Error(error.message || 'Edge function gemini-generate failed');
    }
    // Expected shape: { text, usageMetadata, latency_ms }
    const response = data as GeminiFunctionResponse;
    return { text: response.text, usageMetadata: response.usageMetadata, latency_ms: response.latency_ms ?? latency };
  }
}
