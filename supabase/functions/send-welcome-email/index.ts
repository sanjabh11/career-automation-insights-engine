import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set — skipping welcome email');
      return new Response(
        JSON.stringify({ success: false, reason: 'Email service not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, name } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const displayName = name || email.split('@')[0];
    const APP_URL = Deno.env.get('APP_URL') || 'https://automationinsights.app';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; background: #f8fafc;">
  <div style="background: #0f172a; border-radius: 12px; padding: 32px; margin-bottom: 24px;">
    <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 8px 0;">Welcome to Automation Insights</h1>
    <p style="color: #94a3b8; font-size: 16px; margin: 0;">Your career defense journey starts now, ${displayName}.</p>
  </div>

  <div style="background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
    <h2 style="font-size: 18px; margin: 0 0 16px 0;">Here's what you can do right now:</h2>

    <div style="padding: 12px 16px; background: #f0fdf4; border-radius: 8px; margin-bottom: 12px;">
      <strong style="color: #166534;">1. Check Your Automation Risk</strong>
      <p style="color: #4b5563; font-size: 14px; margin: 4px 0 0 0;">
        Search any of 1,016 occupations and get an AI-powered risk score backed by O*NET data.
      </p>
    </div>

    <div style="padding: 12px 16px; background: #eff6ff; border-radius: 8px; margin-bottom: 12px;">
      <strong style="color: #1e40af;">2. Analyze Your Resume</strong>
      <p style="color: #4b5563; font-size: 14px; margin: 4px 0 0 0;">
        Upload your resume to detect automation-prone phrases and get strategic rewrites.
      </p>
    </div>

    <div style="padding: 12px 16px; background: #fefce8; border-radius: 8px; margin-bottom: 12px;">
      <strong style="color: #854d0e;">3. Discover Bridge Roles</strong>
      <p style="color: #4b5563; font-size: 14px; margin: 4px 0 0 0;">
        Find realistic career transition paths using A* pathfinding and skill overlap analysis.
      </p>
    </div>

    <a href="${APP_URL}" style="display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 8px;">
      Start Exploring &rarr;
    </a>
  </div>

  <div style="background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
    <h2 style="font-size: 16px; margin: 0 0 8px 0;">Are you a Career Coach?</h2>
    <p style="color: #64748b; font-size: 14px; margin: 0 0 12px 0;">
      Generate white-labeled automation risk reports for your clients in 30 seconds.
      You pay $10/report. Clients pay $150+. That's 15x ROI.
    </p>
    <a href="${APP_URL}/for-coaches" style="color: #10b981; font-weight: 600; text-decoration: underline;">
      Learn about Coach Pro &rarr;
    </a>
  </div>

  <p style="color: #94a3b8; font-size: 12px; text-align: center;">
    Automation Insights &middot; AI-powered career defense for 1,016+ occupations
  </p>
</body>
</html>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Automation Insights <onboarding@automationinsights.app>',
        to: [email],
        subject: `Welcome to Automation Insights, ${displayName}!`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend API error:', errText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Welcome email error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
