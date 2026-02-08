// Netlify Function: onet-proxy
// Load local .env when running via Netlify Dev
import 'dotenv/config';
// Proxies O*NET Web Services with Basic Auth using Netlify environment variables
// GET:  /.netlify/functions/onet-proxy?path=search?keyword=developer&end=10
// POST: /.netlify/functions/onet-proxy  { path: "search?keyword=..." }

const ONET_BASE_URL = "https://services.onetcenter.org/ws/online";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function getAuthHeader() {
  const user = process.env.ONET_USERNAME;
  const pass = process.env.ONET_PASSWORD;
  if (!user || !pass) throw new Error("Missing ONET_USERNAME/ONET_PASSWORD env vars");
  const basic = Buffer.from(`${user}:${pass}`).toString("base64");
  return `Basic ${basic}`;
}

export const handler = async (event: any) => {
  const start = Date.now();
  const method = event.httpMethod;
  try {
    console.log("[onet-proxy] incoming", {
      method,
      hasUser: !!process.env.ONET_USERNAME,
      hasPass: !!process.env.ONET_PASSWORD,
    });
  } catch {}
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  try {
    let onetPath = "";
    const qp = event.queryStringParameters?.path;
    if (qp) onetPath = qp;
    else if (event.httpMethod === "POST" && event.body) {
      const body = JSON.parse(event.body || "{}");
      onetPath = body.onetPath || body.path || "";
    }

    if (!onetPath || typeof onetPath !== "string") {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing O*NET path" }),
      };
    }

    // Decode if URL-encoded
    const beforeDecode = onetPath;
    try {
      onetPath = decodeURIComponent(onetPath);
    } catch {}
    if (onetPath.startsWith("/")) onetPath = onetPath.slice(1);
    try {
      console.log("[onet-proxy] path", { beforeDecode, afterDecode: onetPath });
    } catch {}

    // Ensure JSON response from O*NET when possible
    if (!/[?&]fmt=/.test(onetPath)) {
      onetPath += (onetPath.includes("?") ? "&" : "?") + "fmt=json";
    }

    const target = `${ONET_BASE_URL}/${onetPath}`;
    const authHeader = getAuthHeader();

    try {
      console.log("[onet-proxy] outbound", { target, node: process.version });
    } catch {}

    const resp = await fetch(target, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    const ct = resp.headers.get("content-type") || "";
    const text = await resp.text();

    try {
      console.log("[onet-proxy] upstream", {
        status: resp.status,
        contentType: ct,
        bytes: text.length,
        ms: Date.now() - start,
      });
    } catch {}

    if (!resp.ok) {
      return {
        statusCode: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ error: text || resp.statusText }),
      };
    }

    // Normalize any vendor JSON to application/json for the client
    if (ct.toLowerCase().includes("json")) {
      return {
        statusCode: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        body: text,
      };
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "Content-Type": ct || "text/plain" },
      body: text,
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ error: err?.message || String(err) }),
    };
  }
};
