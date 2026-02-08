import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.env.set("GEMINI_API_KEY", "fake-key");
Deno.env.set("SUPABASE_URL", "http://localhost:54321");
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "fake-role");

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

globalThis.fetch = async (input: Request | string, init?: RequestInit): Promise<Response> => {
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
  return originalFetch(input as any, init);
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
  const data = await resp.json();
  assert(data.assessments.length === 1);
  assertEquals(data.assessments[0].category, "Automate");

// Clear intervals created during handler execution
for (const id of __intervalIds) _clearInterval(id as any);
__intervalIds.length = 0;
});
