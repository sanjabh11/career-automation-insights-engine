import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.env.set("GEMINI_API_KEY", "fake");
Deno.env.set("SUPABASE_URL", "http://localhost:54321");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "fake");

interface PersonalizedSkillRecommendationsResponse {
  recommendations: Array<{
    skill: string;
  }>;
}

// Track intervals to clear after test
const _setInterval = globalThis.setInterval;
const _clearInterval = globalThis.clearInterval;
const __intervalIds: ReturnType<typeof globalThis.setInterval>[] = [];
globalThis.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]): ReturnType<typeof globalThis.setInterval> => {
  const id = _setInterval(handler, timeout, ...args);
  __intervalIds.push(id);
  return id;
}) as typeof globalThis.setInterval;

const originalFetch = globalThis.fetch;
globalThis.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
  const [input] = args;
  if (typeof input === "string" && input.includes("gemini-2.5-flash")) {
    return new Response(
      JSON.stringify({
        candidates: [
          { content: { parts: [{ text: '[{"skill":"SQL","recommendation":"Take intro SQL","effortHours":5}]' }] } },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  if (typeof input === "string" && input.includes("ai_skill_recommendations")) {
    return new Response(null, { status: 201 });
  }
  return originalFetch(...args);
};

import { handler } from "../functions/personalized-skill-recommendations/index.ts";


Deno.test("personalized-skill-recommendations", async () => {
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({
      occupationCode: "15-1252",
      occupationTitle: "Software Dev",
      gapSkills: ["SQL"],
      userId: crypto.randomUUID(),
    }),
    headers: { "Content-Type": "application/json" },
  });
  const resp = await handler(req);
  assertEquals(resp.status, 200);
  const data = await resp.json() as PersonalizedSkillRecommendationsResponse;
  assertEquals(data.recommendations[0].skill, "SQL");

  // Clear intervals
  for (const id of __intervalIds) _clearInterval(id);
  __intervalIds.length = 0;
});
