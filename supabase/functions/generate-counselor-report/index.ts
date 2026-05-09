import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Generate Counselor Report (PDF)
 * 
 * Creates white-labeled PDF report for career counselors to share with clients.
 * Includes APO analysis, skill recommendations, career roadmap, and charts.
 * 
 * NOTE: This Edge Function generates HTML markup that can be converted to PDF
 * client-side using @react-pdf/renderer or print-to-PDF functionality.
 * For server-side PDF generation, consider using Puppeteer in a Docker container.
 * 
 * @param client_name - Client's name for the report
 * @param client_occupation_code - O*NET SOC code
 * @param counselor_id - Counselor's user ID (for white-label config)
 */

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { client_name, client_occupation_code, counselor_id, report_data } = await req.json();

        if (!client_name || !client_occupation_code || !counselor_id) {
            throw new Error('client_name, client_occupation_code, and counselor_id are required');
        }

        const startTime = Date.now();

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get counselor's white-label config
        const { data: config } = await supabase
            .from('white_label_configs')
            .select('*')
            .eq('user_id', counselor_id)
            .single();

        // Use defaults if no config exists
        const brandingConfig = config || {
            company_name: 'Career Counseling Services',
            primary_color: '#3b82f6',
            secondary_color: '#8b5cf6',
            include_apo_branding: true
        };

        // Get occupation data
        const { data: occupation } = await supabase
            .from('onet_occupation_enrichment')
            .select('*')
            .eq('occupation_code', client_occupation_code)
            .maybeSingle();

        if (!occupation) {
            throw new Error('Occupation not found');
        }

        const normalizedOccupation = {
            ...occupation,
            title: occupation.occupation_title || occupation.title || client_occupation_code,
            soc_code: occupation.occupation_code || occupation.soc_code || client_occupation_code,
        };

        // Get APO analysis (or calculate if not exists)
        let apoData = report_data?.apo_analysis;
        if (!apoData) {
            // Call calculate-apo function
            const apoResponse = await fetch(
                `${supabaseUrl}/functions/v1/calculate-apo`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseKey
                    },
                    body: JSON.stringify({
                        occupation: {
                            code: client_occupation_code,
                            title: normalizedOccupation.title
                        }
                    })
                }
            );

            if (apoResponse.ok) {
                apoData = await apoResponse.json();
            }
        }

        // Generate report HTML (can be converted to PDF client-side)
        const reportHtml = generateReportHtml({
            clientName: client_name,
            occupation: normalizedOccupation,
            apoData: apoData,
            branding: brandingConfig,
            generatedDate: new Date().toLocaleDateString()
        });

        // Store report metadata
        const { data: reportRecord, error: insertError } = await supabase
            .from('generated_counselor_reports')
            .insert({
                counselor_id,
                client_name,
                client_occupation_code,
                client_occupation_title: normalizedOccupation.title,
                report_data: {
                    apo_analysis: apoData,
                    occupation: normalizedOccupation
                },
                branding_config: brandingConfig,
                generation_time_ms: Date.now() - startTime,
                pdf_engine: 'html'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Failed to store report metadata:', insertError);
        }

        return new Response(
            JSON.stringify({
                success: true,
                report_id: reportRecord?.id,
                html: reportHtml,
                metadata: {
                    client_name,
                    occupation_title: normalizedOccupation.title,
                    generated_at: new Date().toISOString(),
                    generation_time_ms: Date.now() - startTime
                },
                instructions: {
                    pdf_conversion: 'Use window.print() or @react-pdf/renderer to convert HTML to PDF client-side'
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        );

    } catch (error) {
        console.error('Error in generate-counselor-report:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        );
    }
});

// Generate printable HTML report
function generateReportHtml(params: {
    clientName: string;
    occupation: any;
    apoData: any;
    branding: any;
    generatedDate: string;
}): string {
    const { clientName, occupation, apoData, branding, generatedDate } = params;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Career Automation Analysis - ${clientName}</title>
  <style>
    @media print {
      @page { margin: 0.5in; }
      body { margin: 0; }
      .page-break { page-break-after: always; }
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      background: linear-gradient(135deg, ${branding.primary_color}, ${branding.secondary_color});
      color: white;
      padding: 40px;
      text-align: center;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    
    h1 { margin: 0 0 10px 0; font-size: 32px; }
    h2 { color: ${branding.primary_color}; border-bottom: 2px solid ${branding.primary_color}; padding-bottom: 10px; }
    
    .company-name { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; }
    
    .summary-card {
      background: #f8f9fa;
      padding: 20px;
      border-left: 4px solid ${branding.primary_color};
      margin: 20px 0;
    }
    
    .apo-score {
      font-size: 48px;
      font-weight: bold;
      color: ${branding.primary_color};
      text-align: center;
      margin: 20px 0;
    }
    
    .risk-level {
      text-align: center;
      padding: 10px;
      border-radius: 5px;
      font-weight: bold;
    }
    
    .risk-low { background: #d4edda; color: #155724; }
    .risk-medium { background: #fff3cd; color: #856404; }
    .risk-high { background: #f8d7da; color: #721c24; }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    th {
      background: ${branding.primary_color};
      color: white;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #eee;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">${branding.company_name}</div>
    <h1>Career Automation Analysis</h1>
    <p>Prepared for: ${clientName}</p>
    <p>Date: ${generatedDate}</p>
  </div>

  <h2>Executive Summary</h2>
  <div class="summary-card">
    <p><strong>Occupation:</strong> ${occupation.title} (${occupation.soc_code})</p>
    <p><strong>Analysis Type:</strong> Automation Potential Overview (APO)</p>
  </div>

  <h2>Automation Potential Score</h2>
  <div class="apo-score">${apoData?.apo_score || 'N/A'}</div>
  <div class="risk-level ${getRiskClass(apoData?.apo_score)}">
    ${getRiskLabel(apoData?.apo_score)}
  </div>

  <div class="page-break"></div>

  <h2>Key Findings</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th>Impact</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Task Automation</td>
        <td>${apoData?.category_scores?.tasks || 'N/A'}%</td>
        <td>Percentage of routine tasks susceptible to automation</td>
      </tr>
      <tr>
        <td>Skill Demands</td>
        <td>${apoData?.category_scores?.skills || 'N/A'}%</td>
        <td>Skills that remain uniquely human</td>
      </tr>
      <tr>
        <td>Technology Impact</td>
        <td>${apoData?.category_scores?.technology || 'N/A'}%</td>
        <td>Current technology substitution risk</td>
      </tr>
    </tbody>
  </table>

  <h2>Recommendations</h2>
  <div class="summary-card">
    <ul>
      <li><strong>Skill Development Focus:</strong> Develop strategic thinking and complex problem-solving skills</li>
      <li><strong>Human-Centric Tasks:</strong> Emphasize creativity, emotional intelligence, and relationship-building</li>
      <li><strong>Technology Adaptation:</strong> Learn to work alongside AI tools rather than compete with them</li>
      <li><strong>Career Positioning:</strong> Highlight uniquely human capabilities in resume and interviews</li>
</ul>
  </div>

  <div class="footer">
    ${branding.include_apo_branding ? '<p>Powered by APO Dashboard - Career Automation Insights Engine</p>' : ''}
    <p>Report generated on ${generatedDate} | ${branding.company_name}</p>
    ${branding.contact_email ? `<p>Contact: ${branding.contact_email}</p>` : ''}
  </div>
</body>
</html>
  `.trim();
}

function getRiskClass(score: number): string {
    if (!score) return 'risk-medium';
    if (score < 30) return 'risk-low';
    if (score < 60) return 'risk-medium';
    return 'risk-high';
}

function getRiskLabel(score: number): string {
    if (!score) return 'Analysis Pending';
    if (score < 30) return 'Low Automation Risk';
    if (score < 60) return 'Moderate Automation Risk';
    return 'High Automation Risk';
}
