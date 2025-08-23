import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

const originalFetch = globalThis.fetch;
Deno.env.set("SERPAPI_KEY", "fake");

globalThis.fetch = async (input: Request | string): Promise<Response> => {
  if (typeof input === "string" && input.includes("serpapi.com")) {
    return new Response(
      JSON.stringify({
        organic_results: [
          { title: "SQL Course", link: "https://example.com/sql", snippet: "Free" },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  return originalFetch(input as any);
};

const { handler } = await import("../functions/free-courses/index.ts");

Deno.test("free-courses returns list", async () => {
  const req = new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ skill: "SQL", limit: 1 }),
    headers: { "Content-Type": "application/json" },
  });
  const resp = await handler(req);
  assertEquals(resp.status, 200);
  const data = await resp.json();
  assertEquals(data.results[0].title, "SQL Course");
});
