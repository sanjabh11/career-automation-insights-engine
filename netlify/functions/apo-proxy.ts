// Netlify Function: apo-proxy
// Forwards client requests to Supabase Edge Function 'calculate-apo' and injects x-api-key server-side.
// Loads local .env when running via Netlify Dev.
import 'dotenv/config';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function getFunctionsBaseFromSupabaseUrl(url?: string): string {
  // Example: https://kvunnankqgfokeufvsrv.supabase.co -> https://kvunnankqgfokeufvsrv.functions.supabase.co
  if (!url) throw new Error('SUPABASE_URL is not configured');
  try {
    const u = new URL(url);
    const host = u.hostname.replace('.supabase.co', '.functions.supabase.co');
    return `${u.protocol}//${host}`;
  } catch {
    throw new Error('Invalid SUPABASE_URL');
  }
}

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const functionsBase = getFunctionsBaseFromSupabaseUrl(supabaseUrl);
    const target = `${functionsBase}/calculate-apo`;

    const apiKey = process.env.APO_FUNCTION_API_KEY || '';

    const body = event.body ?? '{}';

    const upstream = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
      body,
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get('Content-Type') || 'application/json';

    return {
      statusCode: upstream.status,
      headers: { ...corsHeaders, 'Content-Type': contentType },
      body: text,
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err?.message || String(err) }),
    };
  }
};
