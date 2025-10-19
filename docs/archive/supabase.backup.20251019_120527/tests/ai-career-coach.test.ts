import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { GeminiClient } from "../lib/GeminiClient.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

Deno.env.set("GEMINI_API_KEY", "fake-key");
Deno.env.set("SUPABASE_URL", "http://localhost:54321");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "fake-service-role-key");

// Track intervals to clear after test to avoid leak detection
const _setInterval = globalThis.setInterval;
const _clearInterval = globalThis.clearInterval;
const __intervalIds: number[] = [];
globalThis.setInterval = (
  handler: TimerHandler,
  timeout?: number,
  ...args: any[]
): number => {
  const id = _setInterval(handler, timeout as any, ...args);
  __intervalIds.push(id);
  return id;
};

// Mock global fetch for Gemini and Supabase insert
const originalFetch = globalThis.fetch;

globalThis.fetch = async (input: Request | string, init?: RequestInit): Promise<Response> => {
  // Mock Gemini request
  if (typeof input === "string" && input.includes("gemini-2.5-flash")) {
    return new Response(
      JSON.stringify({
        candidates: [
          { content: { parts: [{ text: "Mock Gemini response" }] } },
        ],
        usageMetadata: { totalTokens: 10 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  // Mock Supabase insert
  if (typeof input === "string" && input.includes("/rest/v1/llm_logs")) {
    return new Response(null, { status: 201 });
  }
  return originalFetch(input as any, init);
};

// Import function handler (dynamic import to allow env mocks first)
const { handler } = await import("../functions/ai-career-coach/index.ts");

Deno.test("ai-career-coach returns valid JSON", async () => {
  const body = {
    message: "Hello coach!",
    userProfile: {
      id: crypto.randomUUID(),
      occupationCode: "15-1252",
      careerGoals: "Become a senior engineer",
    },
  };
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

  const resp = await handler(req);
  assertEquals(resp.status, 200);
  const data = await resp.json();
  assert(data.response.includes("Mock Gemini response"));
  assertEquals(data.usage.totalTokens, 10);

// Clear any intervals started during handler execution
for (const id of __intervalIds) _clearInterval(id);
__intervalIds.length = 0;
});
