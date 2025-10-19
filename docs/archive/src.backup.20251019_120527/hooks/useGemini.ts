// useGemini: React hook for Gemini LLM calls via Supabase Edge Function (server-side)
// Usage: const { loading, error, data, generate } = useGemini();

import { useState } from 'react';
import { GeminiService, GeminiResponse } from '@/services/GeminiService';

export function useGemini() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GeminiResponse | null>(null);

  /**
   * Call Gemini LLM through the server-side Edge Function (gemini-generate).
   * @param prompt User/system prompt
   * @param generationConfig Gemini API generationConfig (optional)
   */
  const generate = async (prompt: string, generationConfig?: object) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await GeminiService.generate(prompt, generationConfig);
      setData(result);
    } catch (err: any) {
      setError((err as Error).message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, data, generate };
}
