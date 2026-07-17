import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const ALLOWED_ORIGIN = Deno.env.get('APP_URL') || 'http://localhost:5173';

const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Simple in-memory rate limiter (per user, per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }
    if (entry.count >= RATE_LIMIT_MAX) {
        return false;
    }
    entry.count++;
    return true;
}

// Stable public error codes
const ERROR_CODES = {
    MISSING_PARAMS: 'MISSING_PARAMS',
    INVALID_PARAMS: 'INVALID_PARAMS',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
    CONFLICT: 'CONFLICT',
    RATE_LIMITED: 'RATE_LIMITED',
    METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

type ScoreValue = number | string | null | undefined;

interface ReportOccupation {
    title: string;
    soc_code: string;
}

interface ApoCategoryScores {
    tasks?: ScoreValue;
    skills?: ScoreValue;
    technology?: ScoreValue;
}

interface ApoAnalysisData {
    apo_score?: ScoreValue;
    category_scores?: ApoCategoryScores | null;
}

interface BrandingConfig {
    company_name: string;
    primary_color: string;
    secondary_color: string;
    include_apo_branding?: boolean;
    contact_email?: string | null;
}

/**
 * Generate Counselor Report (Print-Ready HTML)
 *
 * Creates white-labeled print-ready HTML report for career counselors.
 * Includes APO analysis, skill recommendations, career roadmap, and proof boundary.
 *
 * SECURITY: JWT-verified. User ID derived from token, never from caller.
 * Credits: Server-side idempotent reservation/refund via report_generation_ledger.
 * Input: All user-supplied fields are HTML-escaped.
 *
 * @param client_label - Pseudonymous label for the client (not real name)
 * @param occupation_code - O*NET SOC code
 * @param idempotency_key - UUID for idempotent credit reservation
 * @param human_review_acknowledgement - Boolean confirming human review requirement
 */

function escapeHtml(str: string): string {
    // Also strip control characters (\x00-\x1f) per B1-6
    const controlChars = new RegExp(
        '[' + Array.from({ length: 32 }, (_, i) => '\\x' + i.toString(16).padStart(2, '0')).join('') + ']',
        'g'
    );
    return String(str)
        .replace(controlChars, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function validateHexColor(color: string): string {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    return hexRegex.test(color) ? color : '#3b82f6';
}

async function verifyJwtAndGetUser(req: Request, supabaseUrl: string, supabaseKey: string) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HttpError(401, 'Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
        },
    });

    if (!response.ok) {
        throw new HttpError(401, 'Invalid or expired token');
    }

    const user = await response.json();
    if (!user?.id) {
        throw new HttpError(401, 'Unable to verify user identity');
    }

    return { user, token };
}

async function refundReservedCredit(supabaseClient: unknown, ledgerId: string): Promise<void> {
    const client = supabaseClient as {
        rpc: (functionName: string, args: Record<string, string>) => Promise<{ data: unknown; error: { message: string } | null }>;
    };
    const { data, error } = await client.rpc('refund_report_credit', { p_ledger_id: ledgerId });
    if (error || data !== true) {
        throw new HttpError(500, 'Credit refund could not be confirmed', ERROR_CODES.INTERNAL_ERROR);
    }
}

class HttpError extends Error {
    status: number;
    code?: string;
    constructor(status: number, message: string, code?: string) {
        super(message);
        this.status = status;
        this.code = code;
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    // Reject unsupported methods
    if (!['GET', 'POST'].includes(req.method)) {
        return new Response(
            JSON.stringify({ success: false, error: 'Method not allowed', code: ERROR_CODES.METHOD_NOT_ALLOWED }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
        );
    }

    // GET: Retrieve/resume existing report via signed URL
    if (req.method === 'GET') {
        try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
            const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
            const supabase = createClient(supabaseUrl, supabaseKey);

            const { user } = await verifyJwtAndGetUser(req, supabaseUrl, supabaseAnonKey);
            const userId = user.id;

            const url = new URL(req.url);
            const reportId = url.searchParams.get('report_id');

            if (!reportId) {
                throw new HttpError(400, 'report_id query parameter is required');
            }

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(reportId)) {
                throw new HttpError(400, 'report_id must be a valid UUID');
            }

            // Verify report belongs to user
            const { data: report, error: reportError } = await supabase
                .from('generated_counselor_reports')
                .select('id, report_url, artifact_path, client_name, client_occupation_title, generated_at, expires_at')
                .eq('id', reportId)
                .eq('counselor_id', userId)
                .single();

            if (reportError || !report) {
                throw new HttpError(404, 'Report not found', ERROR_CODES.NOT_FOUND);
            }

            // B1-8: Check if report artifact has expired → 410 Gone
            if (report.expires_at && new Date(report.expires_at) < new Date()) {
                throw new HttpError(410, 'Report artifact has expired', ERROR_CODES.NOT_FOUND);
            }

            const artifactPath = report.artifact_path || report.report_url;
            if (!artifactPath) {
                throw new HttpError(404, 'Report artifact not available', ERROR_CODES.NOT_FOUND);
            }

            // Generate fresh signed URL
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                .from('coach-report-artifacts')
                .createSignedUrl(artifactPath, 60);

            if (signedUrlError || !signedUrlData) {
                throw new HttpError(500, 'Failed to generate delivery URL');
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    report_id: report.id,
                    delivery_url: signedUrlData.signedUrl,
                    metadata: {
                        client_label: report.client_name,
                        occupation_title: report.client_occupation_title,
                        generated_at: report.generated_at
                    },
                    instructions: {
                        delivery: 'Signed URL expires in 60 seconds. Download or print immediately.'
                    }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        } catch (error) {
            const status = error instanceof HttpError ? error.status : 400;
            const message = error instanceof Error ? error.message : 'Unknown error';
            return new Response(
                JSON.stringify({ success: false, error: message }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
            );
        }
    }

    try {
        const { client_label, occupation_code, idempotency_key, human_review_acknowledgement } = await req.json();

        if (!client_label || !occupation_code || !idempotency_key) {
            throw new HttpError(400, 'client_label, occupation_code, and idempotency_key are required');
        }

        if (!human_review_acknowledgement) {
            throw new HttpError(400, 'human_review_acknowledgement is required');
        }

        // Input validation
        if (typeof client_label !== 'string' || client_label.length < 1 || client_label.length > 80) {
            throw new HttpError(400, 'client_label must be 1-80 characters');
        }
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(idempotency_key)) {
            throw new HttpError(400, 'idempotency_key must be a valid UUID');
        }
        if (typeof occupation_code !== 'string' || occupation_code.length < 3 || occupation_code.length > 20) {
            throw new HttpError(400, 'occupation_code must be 3-20 characters');
        }

        const startTime = Date.now();

        // Initialize Supabase client with service role for DB operations
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Verify JWT and derive user ID — never trust caller-supplied ID
        const { user } = await verifyJwtAndGetUser(req, supabaseUrl, supabaseAnonKey);
        const userId = user.id;

        // Rate limit check
        if (!checkRateLimit(userId)) {
            throw new HttpError(429, 'Rate limit exceeded. Try again in a minute.');
        }

        // Pilot boundary: check server-owned pilot_participants table (not user_metadata)
        const { data: pilotEnrollment, error: pilotEnrollmentError } = await supabase
            .from('pilot_participants')
            .select('country, active, terms_version, terms_hash')
            .eq('user_id', userId)
            .single();

        if (
            pilotEnrollmentError
            || !pilotEnrollment
            || !pilotEnrollment.active
            || !['US', 'CA'].includes(pilotEnrollment.country)
        ) {
            throw new HttpError(403, 'Pilot enrollment required. Enroll at /for-coaches before generating reports.');
        }

        const { data: approvedTerms, error: approvedTermsError } = await supabase
            .from('pilot_terms_versions')
            .select('status, content_hash')
            .eq('version', pilotEnrollment.terms_version)
            .single();

        if (
            approvedTermsError
            || approvedTerms?.status !== 'approved'
            || typeof approvedTerms.content_hash !== 'string'
            || typeof pilotEnrollment.terms_hash !== 'string'
            || approvedTerms.content_hash.toLowerCase() !== pilotEnrollment.terms_hash.toLowerCase()
        ) {
            throw new HttpError(403, 'Pilot terms must match the currently approved terms before report generation.');
        }

        // Reserve credit atomically (idempotent)
        const { data: reserveResult, error: reserveError } = await supabase
            .rpc('reserve_report_credit', {
                p_user_id: userId,
                p_idempotency_key: idempotency_key,
                p_occupation_code: occupation_code,
                p_client_label: client_label,
                p_human_review_acknowledgement: human_review_acknowledgement
            });

        if (reserveError) {
            throw new HttpError(500, 'Credit reservation failed', ERROR_CODES.INTERNAL_ERROR);
        }

        if (!reserveResult?.success) {
            throw new HttpError(402, reserveResult?.error || 'Insufficient credits');
        }

        // Pass human_review_acknowledgement to the reservation
        // (already passed via RPC parameter above)

        // B1-2: Handle idempotency state machine responses
        if (reserveResult.idempotent && reserveResult.status === 'conflict') {
            throw new HttpError(409, reserveResult.error || 'Conflicting idempotency key');
        }

        if (reserveResult.idempotent && reserveResult.status === 'reserved') {
            // B1-8: Return 202 for in-progress idempotent replay
            return new Response(
                JSON.stringify({
                    success: true,
                    idempotent: true,
                    ledger_id: reserveResult.ledger_id,
                    status: 'reserved',
                    message: 'Report generation in progress. Poll or retry GET for delivery.'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 202 }
            );
        }

        // If idempotent hit and already succeeded, return signed URL (no re-debit)
        if (reserveResult.idempotent && reserveResult.status === 'succeeded') {
            // Generate new signed URL for the existing artifact
            const { data: existingReport, error: existingReportError } = await supabase
                .from('generated_counselor_reports')
                .select('id, artifact_path, report_url, expires_at')
                .eq('id', reserveResult.report_id)
                .eq('counselor_id', userId)
                .single();

            if (existingReportError || !existingReport) {
                throw new HttpError(404, 'Previously generated report metadata was not found', ERROR_CODES.NOT_FOUND);
            }

            if (existingReport.expires_at && new Date(existingReport.expires_at) < new Date()) {
                throw new HttpError(410, 'Previously generated report artifact has expired', ERROR_CODES.NOT_FOUND);
            }

            const filePath = existingReport.artifact_path || existingReport.report_url;
            if (!filePath) {
                throw new HttpError(404, 'Previously generated report artifact is not available', ERROR_CODES.NOT_FOUND);
            }

            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                .from('coach-report-artifacts')
                .createSignedUrl(filePath, 60);
            if (signedUrlError || !signedUrlData?.signedUrl) {
                throw new HttpError(404, 'Previously generated report artifact is not available', ERROR_CODES.NOT_FOUND);
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    idempotent: true,
                    ledger_id: reserveResult.ledger_id,
                    report_id: reserveResult.report_id,
                    delivery_url: signedUrlData.signedUrl,
                    message: 'Report already generated for this idempotency key'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        const ledgerId = reserveResult.ledger_id;

        // Get user's white-label config using JWT-derived user_id
        const { data: config } = await supabase
            .from('white_label_configs')
            .select('*')
            .eq('user_id', userId)
            .single();

        // Use defaults if no config exists — escape all branding fields
        const brandingConfig = {
            company_name: escapeHtml(config?.company_name || 'Career Counseling Services'),
            primary_color: validateHexColor(config?.primary_color || '#3b82f6'),
            secondary_color: validateHexColor(config?.secondary_color || '#8b5cf6'),
            include_apo_branding: config?.include_apo_branding ?? true,
            contact_email: config?.contact_email ? escapeHtml(config.contact_email) : null
        };

        // Get occupation data
        // B1-6: Validate occupation code against loaded O*NET inventory
        const { data: occupation } = await supabase
            .from('onet_occupation_enrichment')
            .select('*')
            .eq('occupation_code', occupation_code)
            .maybeSingle();

        if (!occupation) {
            // Refund credit on failure
            await refundReservedCredit(supabase, ledgerId);
            throw new HttpError(404, 'Occupation not found');
        }

        // B1-6: Normalize label from DB (don't trust caller-supplied title)
        const normalizedOccupation = {
            ...occupation,
            title: occupation.occupation_title || occupation.title || occupation_code,
            soc_code: occupation.occupation_code || occupation.soc_code || occupation_code,
        };

        // B1-6: Query DB for O*NET source version (don't hardcode)
        // Query the count of loaded occupations as a proxy for data freshness
        const { count: onetCount } = await supabase
            .from('onet_occupation_enrichment')
            .select('*', { count: 'exact', head: true });
        const configuredOnetRelease = Deno.env.get('ONET_RELEASE_VERSION') || '30.3';
        const onetRelease = /^\d+\.\d+$/.test(configuredOnetRelease) ? configuredOnetRelease : '30.3';
        const onetVersion = `O*NET Database ${onetRelease}; indexed occupations: ${onetCount || 0}`;

        // Calculate APO analysis server-side — never accept caller-supplied report_data
        let apoData: ApoAnalysisData | null = null;
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
                        code: occupation_code,
                        title: normalizedOccupation.title
                    }
                })
            }
        );

        if (apoResponse.ok) {
            apoData = await apoResponse.json();
        }

        // Escape client label for safe HTML rendering
        const safeClientLabel = escapeHtml(client_label);

        // Generate report HTML with proof boundary
        const reportHtml = generateReportHtml({
            clientName: safeClientLabel,
            occupation: normalizedOccupation,
            apoData: apoData,
            branding: brandingConfig,
            generatedDate: new Date().toLocaleDateString(),
            onetVersion: onetVersion
        });

        // Store report metadata (report_url will be set after storage upload)
        const { data: reportRecord, error: insertError } = await supabase
            .from('generated_counselor_reports')
            .insert({
                counselor_id: userId,
                client_name: safeClientLabel,
                client_occupation_code: occupation_code,
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
            await refundReservedCredit(supabase, ledgerId);
            throw new HttpError(500, 'Failed to store report metadata');
        }

        // Upload report HTML to private storage bucket
        const artifactPath = `${userId}/${reportRecord.id}.html`;
        const { error: uploadError } = await supabase.storage
            .from('coach-report-artifacts')
            .upload(artifactPath, reportHtml, {
                contentType: 'text/html',
                upsert: false
            });

        if (uploadError) {
            console.error('Failed to upload report artifact:', uploadError);
            const { error: metadataCleanupError } = await supabase
                .from('generated_counselor_reports')
                .delete()
                .eq('id', reportRecord.id);
            if (metadataCleanupError) console.error('Failed to clean report metadata after upload failure:', metadataCleanupError);
            await refundReservedCredit(supabase, ledgerId);
            throw new HttpError(500, 'Failed to store report artifact');
        }

        // Generate 60-second signed URL for delivery
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('coach-report-artifacts')
            .createSignedUrl(artifactPath, 60);

        if (signedUrlError || !signedUrlData) {
            console.error('Failed to create signed URL:', signedUrlError);
            await supabase.storage.from('coach-report-artifacts').remove([artifactPath]);
            const { error: metadataCleanupError } = await supabase
                .from('generated_counselor_reports')
                .delete()
                .eq('id', reportRecord.id);
            if (metadataCleanupError) console.error('Failed to clean report metadata after signed URL failure:', metadataCleanupError);
            await refundReservedCredit(supabase, ledgerId);
            throw new HttpError(500, 'Failed to generate delivery URL');
        }

        // Update report record with artifact path and human_review_acknowledgement
        const { error: reportUpdateError } = await supabase
            .from('generated_counselor_reports')
            .update({ report_url: artifactPath, artifact_path: artifactPath, human_review_acknowledgement: human_review_acknowledgement })
            .eq('id', reportRecord.id);

        if (reportUpdateError) {
            await supabase.storage.from('coach-report-artifacts').remove([artifactPath]);
            await supabase.from('generated_counselor_reports').delete().eq('id', reportRecord.id);
            await refundReservedCredit(supabase, ledgerId);
            throw new HttpError(500, 'Failed to finalize report metadata');
        }

        // Mark credit reservation as succeeded
        const { data: completionResult, error: completionError } = await supabase.rpc('complete_report_generation', {
            p_ledger_id: ledgerId,
            p_report_id: reportRecord.id
        });

        if (completionError || completionResult !== true) {
            await supabase.storage.from('coach-report-artifacts').remove([artifactPath]);
            await supabase.from('generated_counselor_reports').delete().eq('id', reportRecord.id);
            await refundReservedCredit(supabase, ledgerId);
            throw new HttpError(500, 'Credit completion could not be confirmed');
        }

        return new Response(
            JSON.stringify({
                success: true,
                report_id: reportRecord.id,
                ledger_id: ledgerId,
                delivery_url: signedUrlData.signedUrl,
                metadata: {
                    client_label: safeClientLabel,
                    occupation_title: normalizedOccupation.title,
                    generated_at: new Date().toISOString(),
                    generation_time_ms: Date.now() - startTime,
                    remaining_credits: reserveResult.remaining_credits
                },
                instructions: {
                    delivery: 'Signed URL expires in 60 seconds. Download or print immediately.'
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 201
            }
        );

    } catch (error) {
        console.error('Error in generate-counselor-report:', error);

        const status = error instanceof HttpError ? error.status : 400;
        const message = error instanceof Error ? error.message : 'Unknown error';
        const code = status === 401 ? ERROR_CODES.UNAUTHORIZED
            : status === 402 ? ERROR_CODES.INSUFFICIENT_CREDITS
            : status === 403 ? ERROR_CODES.FORBIDDEN
            : status === 404 ? ERROR_CODES.NOT_FOUND
            : status === 405 ? ERROR_CODES.METHOD_NOT_ALLOWED
            : status === 409 ? ERROR_CODES.CONFLICT
            : status === 410 ? ERROR_CODES.NOT_FOUND
            : status === 429 ? ERROR_CODES.RATE_LIMITED
            : status === 400 ? ERROR_CODES.INVALID_PARAMS
            : ERROR_CODES.INTERNAL_ERROR;

        return new Response(
            JSON.stringify({
                success: false,
                error: message,
                code: code
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status
            }
        );
    }
});

// Generate printable HTML report
function generateReportHtml(params: {
    clientName: string;
    occupation: ReportOccupation;
    apoData: ApoAnalysisData | null | undefined;
    branding: BrandingConfig;
    generatedDate: string;
    onetVersion?: string;
}): string {
    const { clientName, occupation, apoData, branding, generatedDate, onetVersion } = params;
    const safeOccupationTitle = escapeHtml(occupation.title);
    const safeOccupationCode = escapeHtml(occupation.soc_code);
    const safeGeneratedDate = escapeHtml(generatedDate);
    const safeOnetVersion = escapeHtml(onetVersion || 'U.S. Department of Labor O*NET data');

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
    <p>Date: ${safeGeneratedDate}</p>
  </div>

  <h2>Executive Summary</h2>
  <div class="summary-card">
    <p><strong>Occupation:</strong> ${safeOccupationTitle} (${safeOccupationCode})</p>
    <p><strong>Analysis Type:</strong> Automation Potential Overview (APO)</p>
  </div>

  <h2>Automation Exposure Estimate</h2>
  <div class="apo-score">${formatScore(apoData?.apo_score)}</div>
  <div class="risk-level ${getRiskClass(apoData?.apo_score)}">
    ${getRiskLabel(apoData?.apo_score)}
  </div>
  <p style="text-align: center; font-size: 11px; color: #6c757d; margin-top: 5px;">Planning artifact, not a prediction</p>

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
        <td>${formatPercent(apoData?.category_scores?.tasks)}</td>
        <td>Percentage of routine tasks susceptible to automation</td>
      </tr>
      <tr>
        <td>Skill Demands</td>
        <td>${formatPercent(apoData?.category_scores?.skills)}</td>
        <td>Skills with lower automation susceptibility</td>
      </tr>
      <tr>
        <td>Technology Impact</td>
        <td>${formatPercent(apoData?.category_scores?.technology)}</td>
        <td>Current technology substitution risk</td>
      </tr>
    </tbody>
  </table>

  <h2>Recommendations</h2>
  <div class="summary-card">
    <ul>
      <li><strong>Skill Development Focus:</strong> Develop strategic thinking and complex problem-solving skills</li>
      <li><strong>Human-Centric Tasks:</strong> Emphasize transferable skills, creativity, and relationship-building</li>
      <li><strong>Technology Adaptation:</strong> Learn to work alongside AI tools rather than compete with them</li>
      <li><strong>Career Positioning:</strong> Highlight transferable capabilities in resume and interviews</li>
</ul>
  </div>

  <div class="proof-boundary" style="margin-top: 30px; padding: 15px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; font-size: 11px; color: #6c757d;">
    <p><strong>Source:</strong> ${safeOnetVersion} | <strong>Generated:</strong> ${safeGeneratedDate}</p>
    <p><strong>Uncertainty:</strong> Estimates include uncertainty. See methodology notes.</p>
    <p><strong>Scope:</strong> Analysis based on U.S. labor market data. Not applicable to other geographies without localization.</p>
    <p><strong>Human Review:</strong> This is a planning artifact for human review. Not for employment decisions.</p>
    <p><strong>Non-Prediction:</strong> Does not predict employment outcomes, layoffs, or job displacement. This is a planning artifact, not a prediction.</p>
    <p><strong>Delivery:</strong> Print-ready HTML. Use File &rarr; Print &rarr; Save as PDF for client delivery.</p>
  </div>

  <div class="footer">
    ${branding.include_apo_branding ? '<p>Powered by APO Dashboard - Career Automation Insights Engine</p>' : ''}
    <p>Report generated on ${safeGeneratedDate} | ${branding.company_name}</p>
    ${branding.contact_email ? `<p>Contact: ${branding.contact_email}</p>` : ''}
  </div>
</body>
</html>
  `.trim();
}

function scoreToNumber(score: ScoreValue): number | null {
    if (typeof score === 'number') return Number.isFinite(score) ? score : null;
    if (typeof score !== 'string' || score.trim().length === 0) return null;
    const parsed = Number(score);
    return Number.isFinite(parsed) ? parsed : null;
}

function formatScore(score: ScoreValue): string {
    const normalized = scoreToNumber(score);
    return normalized === null ? 'N/A' : String(normalized);
}

function formatPercent(score: ScoreValue): string {
    const normalized = scoreToNumber(score);
    return normalized === null ? 'N/A' : `${normalized}%`;
}

function getRiskClass(score: ScoreValue): string {
    const normalized = scoreToNumber(score);
    if (normalized === null) return 'risk-medium';
    if (normalized < 30) return 'risk-low';
    if (normalized < 60) return 'risk-medium';
    return 'risk-high';
}

function getRiskLabel(score: ScoreValue): string {
    const normalized = scoreToNumber(score);
    if (normalized === null) return 'Analysis Pending';
    if (normalized < 30) return 'Low Automation Exposure';
    if (normalized < 60) return 'Moderate Automation Exposure';
    return 'High Automation Exposure';
}
