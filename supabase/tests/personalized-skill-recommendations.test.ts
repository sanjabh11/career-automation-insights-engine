import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.env.set("GEMINI_API_KEY", "fake");
Deno.env.set("SUPABASE_URL", "http://localhost:54321");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "fake");

// Track intervals to clear after test
const _setInterval = globalThis.setInterval;
const _clearInterval = globalThis.clearInterval;
const __intervalIds: number[] = [];
globalThis.setInterval = ((handler: TimerHandler, timeout?: number, ...args: any[]): number => {
  const id = _setInterval(handler as any, timeout as any, ...args);
  __intervalIds.push(id);
  return id;
}) as any;

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input: Request | string): Promise<Response> => {
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
  return originalFetch(input as any);
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
  const data = await resp.json();
  assertEquals(data.recommendations[0].skill, "SQL");

// Clear intervals
for (const id of __intervalIds) _clearInterval(id as any);
__intervalIds.length = 0;
});
