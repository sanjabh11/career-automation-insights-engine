import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.env.set("GEMINI_API_KEY", "fake-key");
Deno.env.set("SUPABASE_URL", "http://localhost:54321");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "fake-role");

interface IntelligentTaskAssessmentResponse {
  assessments: Array<{
    category: string;
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
          {
            content: {
              parts: [
                {
                  text:
                    '{"category":"Automate","explanation":"Routine task","confidence":0.9}',
                },
              ],
            },
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  if (typeof input === "string" && input.includes("/rest/v1/ai_task_assessments")) {
    return new Response(null, { status: 201 });
  }
  return originalFetch(...args);
};

const { handler } = await import(
  "../functions/intelligent-task-assessment/index.ts"
);

Deno.test("intelligent-task-assessment returns assessments", async () => {
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({
      occupationCode: "15-1252",
      occupationTitle: "Software Developer",
      tasks: ["Write unit tests"],
      userId: crypto.randomUUID(),
    }),
    headers: { "Content-Type": "application/json" },
  });
  const resp = await handler(req);
  assertEquals(resp.status, 200);
  const data = await resp.json() as IntelligentTaskAssessmentResponse;
  assert(data.assessments.length === 1);
  assertEquals(data.assessments[0].category, "Automate");

  // Clear intervals created during handler execution
  for (const id of __intervalIds) _clearInterval(id);
  __intervalIds.length = 0;
});
