import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function buildRetainedResumeStub(resumeText: string): string {
    return `[raw resume text redacted after analysis; original_length_chars=${resumeText.length}]`;
}

function buildResumeAnalysisProofPack(generatedAt: string, filename: string, analysisId: string | null, parserReceipt: Record<string, unknown> | null = null) {
    const parserSourceIds = Array.isArray(parserReceipt?.sourceIds)
        ? parserReceipt.sourceIds.filter((sourceId): sourceId is string => typeof sourceId === 'string')
        : ['owasp-file-upload', 'supabase-edge-functions', 'nist-ai-rmf', 'ada-ai-hiring-guidance'];
    const parserReceiptId = typeof parserReceipt?.receiptId === 'string' ? parserReceipt.receiptId : null;
    const detectedFileKind = typeof parserReceipt?.detectedFileKind === 'string' ? parserReceipt.detectedFileKind : 'pasted_text';
    const parserCaveat = typeof parserReceipt?.caveat === 'string'
        ? parserReceipt.caveat
        : 'The production-safe path is text submitted to the Edge Function. Browser PDF/DOCX extraction remains degraded until a server-side parser with file deletion proof is integrated.';

    return {
        proofPackType: 'resume_analysis_proof_boundary',
        schemaVersion: '2026-05-24',
        generatedAt,
        reviewStatus: 'staff_review_required',
        sourceIds: ['llm-output', 'nist-ai-rmf', 'ada-ai-hiring-guidance', 'wcag-22', ...parserSourceIds],
        evidenceCards: [
            {
                id: 'resume-risk-score-boundary',
                claim: 'Resume automation exposure estimate is an LLM-assisted coaching signal about phrasing and skill framing.',
                sourceIds: ['llm-output', 'nist-ai-rmf', 'ada-ai-hiring-guidance'],
                confidence: 'medium',
                generatedAt,
                caveat: 'The score depends on extracted resume text, prompt behavior, and model output; it must be reviewed by a qualified human before client delivery.',
                doesNotProve: 'That the person will lose work, should be screened differently, or is less qualified for any job.',
                reviewStatus: 'staff_review_required',
            },
            {
                id: 'resume-rewrite-boundary',
                claim: 'Rewrite suggestions should emphasize judgment, strategy, communication, and human-led outcomes.',
                sourceIds: ['llm-output', 'nist-ai-rmf'],
                confidence: 'medium',
                generatedAt,
                caveat: 'Rewrites are drafting suggestions, not verified truth about a candidate or employer requirement.',
                doesNotProve: 'That a rewrite improves hiring outcomes, pay, promotion, or legal compliance.',
                reviewStatus: 'staff_review_required',
            },
            {
                id: 'resume-skill-recommendation-boundary',
                claim: 'Recommended skills are transition themes for discussion, not provider-backed training prescriptions.',
                sourceIds: ['llm-output', 'nist-ai-rmf', 'wcag-22'],
                confidence: 'medium',
                generatedAt,
                caveat: 'Skill recommendations need user goals, local labor-market context, accessibility needs, and provider/course review before becoming a pathway.',
                doesNotProve: 'That any course, credential, job, wage, or placement outcome is guaranteed.',
                reviewStatus: 'staff_review_required',
            },
            {
                id: 'resume-employment-decision-boundary',
                claim: 'Resume analysis is for coaching and self-development only.',
                sourceIds: ['ada-ai-hiring-guidance', 'nist-ai-rmf'],
                confidence: 'high',
                generatedAt,
                caveat: 'Employment-selection, accommodation, adverse-impact, and disability-discrimination risks require separate validated processes and legal review.',
                doesNotProve: 'That this output can be used for hiring, firing, promotion, compensation, layoff, or eligibility decisions.',
                reviewStatus: 'staff_review_required',
            },
            {
                id: 'resume-parser-retention-boundary',
                claim: 'Saved resume analyses redact raw resume text and can return an app-level deletion receipt.',
                sourceIds: ['nist-ai-rmf', 'ada-ai-hiring-guidance', 'owasp-file-upload', 'supabase-edge-functions'],
                confidence: 'high',
                generatedAt,
                caveat: 'The deletion receipt covers the app row only; browser files, user exports, model-provider logs, and backups require separate controls.',
                doesNotProve: 'That external model-provider logs, browser files, user exports, or backups were deleted.',
                reviewStatus: 'staff_review_required',
            },
            {
                id: 'resume-server-parser-boundary',
                claim: 'Server-side resume parsing must validate file type, size, signature, and storage minimization before paid PDF/DOCX workflows are enabled.',
                sourceIds: parserSourceIds,
                confidence: parserReceiptId ? 'high' : 'medium',
                generatedAt,
                caveat: parserCaveat,
                doesNotProve: 'That the uploaded file is malware-free, that PDF/DOC/DOCX text extraction is complete, or that a production parser has been deployed for every document format.',
                reviewStatus: 'staff_review_required',
            },
        ],
        parserBoundary: {
            filename,
            inputMode: typeof parserReceipt?.inputMode === 'string' ? parserReceipt.inputMode : 'server_received_text',
            serverParserReceiptId: parserReceiptId,
            fileSha256: typeof parserReceipt?.fileSha256 === 'string' ? parserReceipt.fileSha256 : null,
            detectedFileKind,
            uploadValidation: parserReceiptId ? 'server_validated_upload_boundary' : 'text_submission_without_file_upload',
            rawFileStored: false,
            rawResumeTextStored: false,
            savedAnalysisId: analysisId,
            deletionReceiptAvailable: Boolean(analysisId),
            productionPdfDocxParser: Boolean(parserReceipt?.productionPdfDocxParser),
            tempFileDeletionStatus: typeof parserReceipt?.tempFileDeletionStatus === 'string' ? parserReceipt.tempFileDeletionStatus : 'not_applicable',
            caveat: parserCaveat,
        },
        decisionBoundaries: [
            'Not a hiring, firing, promotion, compensation, layoff, or eligibility decision system.',
            'Not a disability, accommodation, adverse-impact, or candidate-validity assessment.',
            'Not a guarantee of interview, job, wage, placement, credential, or career outcome.',
            'Human review is required before client delivery or institutional use.',
        ],
        retentionBoundary: {
            raw_resume_text_stored: false,
            saved_record_text_policy: 'raw resume text redacted after analysis; saved row stores a length-only stub',
            deletion_receipt_available: Boolean(analysisId),
            deletion_receipt_scope: 'resume_analyses saved row only; model-provider logs, browser files, exports, and backups are outside this receipt',
        },
    };
}

/**
 * Analyze Resume for Automation Risk
 * 
 * Parses resume text, detects automation-prone phrases, and generates
 * rewrite suggestions to emphasize strategic/creative skills.
 * 
 * @param resume_text - Extracted resume text (from PDF or manual input)
 * @param user_id - Optional user ID for storage
 */

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { resume_text, user_id, filename = 'resume.txt', parser_receipt = null } = await req.json();

        if (!resume_text) {
            throw new Error('resume_text is required');
        }

        const startTime = Date.now();

        // Initialize clients
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        const geminiModel = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

        if (!geminiApiKey) {
            throw new Error('GEMINI_API_KEY not configured');
        }

        // Prepare Gemini prompt for automation risk analysis
        const analysisPrompt = `You are an expert career counselor analyzing resumes for automation risk as a bounded coaching signal.

Hard boundaries:
- Do not make hiring, firing, promotion, compensation, layoff, screening, disability, accommodation, eligibility, or legal-compliance recommendations.
- Do not predict layoffs or job loss.
- Treat all outputs as LLM-assisted coaching drafts that require qualified human review before client or institutional delivery.
- Recommended skills must be transition themes only, not course, vendor, credential, job, wage, or placement guarantees.

Analyze this resume and identify:
1. Automation-prone phrases (keywords that indicate routine, repetitive, or easily automated work)
2. Strategic rewrites for each problematic phrase (emphasize strategic thinking, creativity, human judgment)
3. Overall automation exposure estimate (0-100, where 100 = highest exposure)
4. Detected skills (both technical and soft skills)
5. Recommended skills to add (to reduce automation risk)

Resume:
${resume_text}

Respond in JSON format:
{
  "automation_risk_score": <number 0-100>,
  "confidence_score": <number 0-1>,
  "automation_prone_phrases": [
    {
      "phrase": "<exact phrase from resume>",
      "context": "<surrounding sentence for context>",
      "severity": "<low|medium|high>",
      "reason": "<why this phrase signals automation risk>"
    }
  ],
  "rewrite_suggestions": [
    {
      "original": "<original phrase>",
      "suggested": "<rewritten phrase>",
      "rationale": "<why this rewrite reduces automation risk>"
    }
  ],
  "detected_skills": ["<skill1>", "<skill2>", ...],
  "recommended_skills": [
    {
      "skill": "<skill name>",
      "reason": "<why this skill reduces automation risk>",
      "priority": "<high|medium|low>"
    }
  ]
}`;

        // Call Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: analysisPrompt }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        responseMimeType: "application/json"
                    }
                })
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
        }

        const geminiData = await geminiResponse.json();
        const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error('No response from Gemini API');
        }

        // Parse JSON response (handle markdown code blocks if present)
        let analysisResult;
        try {
            const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
            const jsonText = jsonMatch ? jsonMatch[1] : responseText;
            analysisResult = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', responseText);
            throw new Error('Invalid JSON response from Gemini');
        }

        const processingTime = Date.now() - startTime;

        // Store analysis if user_id provided
        let analysisId = null;
        if (user_id) {
            const { data: insertedAnalysis, error: insertError } = await supabase
                .from('resume_analyses')
                .insert({
                    user_id,
                    filename,
                    resume_text: buildRetainedResumeStub(resume_text),
                    automation_risk_score: analysisResult.automation_risk_score,
                    confidence_score: analysisResult.confidence_score,
                    automation_prone_phrases: analysisResult.automation_prone_phrases,
                    rewrite_suggestions: analysisResult.rewrite_suggestions,
                    detected_skills: analysisResult.detected_skills,
                    recommended_skills: analysisResult.recommended_skills,
                    gemini_model: geminiModel,
                    processing_time_ms: processingTime
                })
                .select('id')
                .single();

            if (!insertError && insertedAnalysis) {
                analysisId = insertedAnalysis.id;
            }
        }

        const generatedAt = new Date().toISOString();
        const proofPack = buildResumeAnalysisProofPack(generatedAt, filename, analysisId, parser_receipt);

        return new Response(
            JSON.stringify({
                success: true,
                analysis_id: analysisId,
                ...analysisResult,
                proof_pack: proofPack,
                metadata: {
                    model: geminiModel,
                    processing_time_ms: processingTime,
                    proof_pack_summary: {
                        proofPackType: proofPack.proofPackType,
                        reviewStatus: proofPack.reviewStatus,
                        sourceIds: proofPack.sourceIds,
                        evidenceCardIds: proofPack.evidenceCards.map((card) => card.id),
                    },
                    retention: {
                        raw_resume_text_stored: false,
                        saved_record_text_policy: 'raw resume text redacted after analysis; saved row stores a length-only stub',
                        deletion_receipt_available: Boolean(analysisId),
                        deletion_receipt_scope: 'resume_analyses saved row only; model-provider logs, browser files, exports, and backups are outside this receipt'
                    }
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        );

    } catch (error) {
        console.error('Error in analyze-resume:', error);

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
