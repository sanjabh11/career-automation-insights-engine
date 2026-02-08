// supabase/lib/GeminiClient.ts
// Simple wrapper around Google Generative Language Gemini 2.5 Flash
// Designed for reuse in Supabase Edge Functions (Deno runtime)

import { z } from "https://esm.sh/zod@3.22.4";

export const generationConfigSchema = z
  .object({
    temperature: z.number().min(0).max(1).optional().default(0.2),
    topK: z.number().min(1).max(40).optional().default(1),
    topP: z.number().min(0).max(1).optional().default(0.8),
    maxOutputTokens: z.number().min(1).max(4096).optional().default(2048),
  })
  .strict();

export type GenerationConfig = z.infer<typeof generationConfigSchema>;

export interface GeminiUsageMetadata {
  totalTokens: number;
  promptTokens?: number;
  completionTokens?: number;
}

export interface GeminiResponse {
  text: string;
  usageMetadata?: GeminiUsageMetadata;
}

// Helpers to centralize model and generation defaults from env
export function getEnvModel(): string {
  const raw = (Deno.env.get("GEMINI_MODEL") || '').trim();
  if (raw.length > 0) {
    return raw;
  }
  return 'gemini-2.0-flash-exp';
}

export function getEnvGenerationDefaults(): Partial<GenerationConfig> {
  const parseNum = (v: string | undefined) => (v === undefined ? undefined : Number(v));
  const cfg: Partial<GenerationConfig> = {};
  const t = parseNum(Deno.env.get('GEMINI_TEMPERATURE'));
  const k = parseNum(Deno.env.get('GEMINI_TOP_K'));
  const p = parseNum(Deno.env.get('GEMINI_TOP_P'));
  const max = parseNum(Deno.env.get('GEMINI_MAX_OUTPUT_TOKENS'));
  if (typeof t === 'number' && !Number.isNaN(t)) cfg.temperature = t;
  if (typeof k === 'number' && !Number.isNaN(k)) cfg.topK = k;
  if (typeof p === 'number' && !Number.isNaN(p)) cfg.topP = p;
  if (typeof max === 'number' && !Number.isNaN(max)) cfg.maxOutputTokens = max;
  return cfg;
}

export class GeminiClient {
  private readonly apiKey: string;
  private readonly baseUrlPrefix =
    "https://generativelanguage.googleapis.com/v1beta/models";

  constructor(apiKey?: string) {
    const key = apiKey || Deno.env.get("GEMINI_API_KEY");
    if (!key) {
      throw new Error("GEMINI_API_KEY env var not set");
    }
    this.apiKey = key;
  }

  async generateContent(
    prompt: string,
    config: Partial<GenerationConfig> = {},
  ): Promise<GeminiResponse> {
    if (!prompt.trim()) throw new Error("Prompt cannot be empty");
    const envDefaults = getEnvGenerationDefaults();
    const generationConfig = generationConfigSchema.parse({ ...envDefaults, ...config });

    const model = getEnvModel();
    const url = `${this.baseUrlPrefix}/${model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${err}`);
    }

    const { candidates, usageMetadata } = await response.json();
    const text: string = candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { text, usageMetadata };
  }
}
