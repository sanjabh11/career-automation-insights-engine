import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Allow OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // No auth required for health check
  try {
    // Check environment variables
    const checks = {
      gemini_api_key: !!Deno.env.get('GEMINI_API_KEY'),
      onet_username: !!Deno.env.get('ONET_USERNAME'),
      onet_password: !!Deno.env.get('ONET_PASSWORD'),
      serpapi_key: !!Deno.env.get('SERPAPI_API_KEY'),
      supabase_url: !!Deno.env.get('SUPABASE_URL'),
      supabase_service_role: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      gemini_model: Deno.env.get('GEMINI_MODEL') || 'not set (will use default)',
    };

    const allGood = checks.gemini_api_key && 
                    checks.onet_username && 
                    checks.onet_password && 
                    checks.serpapi_key;

    return new Response(JSON.stringify({
      status: allGood ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      environment_checks: checks,
      message: allGood 
        ? 'All required secrets are configured' 
        : 'Some required secrets are missing',
      missing_secrets: Object.entries(checks)
        .filter(([key, value]) => !value && key !== 'gemini_model')
        .map(([key]) => key)
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
