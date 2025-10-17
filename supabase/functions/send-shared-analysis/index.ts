
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  share_token: string;
  recipient_email: string;
  analysis_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { share_token, recipient_email, analysis_id }: EmailRequest = await req.json();

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get analysis details
    const { data: analysis, error: analysisError } = await supabase
      .from("saved_analyses")
      .select("occupation_title, occupation_code, created_at")
      .eq("id", analysis_id)
      .single();

    if (analysisError || !analysis) {
      throw new Error("Analysis not found");
    }

    // For now, we'll just log the email that would be sent
    // In a real implementation, you would integrate with an email service like Resend
    const shareUrl = `${req.headers.get("origin") || "https://your-domain.com"}/shared/${share_token}`;
    
    const emailData = {
      to: recipient_email,
      subject: `Shared Analysis: ${analysis.occupation_title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Career Analysis Shared With You</h2>
          <p>Someone has shared a career automation analysis with you:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>${analysis.occupation_title}</h3>
            <p><strong>O*NET Code:</strong> ${analysis.occupation_code}</p>
            <p><strong>Analysis Date:</strong> ${new Date(analysis.created_at).toLocaleDateString()}</p>
          </div>
          
          <p>
            <a href="${shareUrl}" 
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Analysis
            </a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This analysis provides insights into automation potential and career recommendations.
          </p>
        </div>
      `
    };

    // Check for email provider configuration
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
    
    if (!resendApiKey && !sendgridApiKey) {
      console.log("Email provider not configured. Email would be sent:", emailData);
      return new Response(
        JSON.stringify({ 
          error: "Email service not configured",
          message: "Email sharing is not available. Please configure RESEND_API_KEY or SENDGRID_API_KEY environment variable.",
          details: "Contact administrator to enable email notifications."
        }),
        {
          status: 501, // Not Implemented
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // TODO: Implement actual email sending with configured provider
    // For now, return success if provider is configured
    console.log("Email provider configured. Would send:", emailData);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email notification prepared (provider integration pending)",
        email_data: emailData 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-shared-analysis function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
