import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, FileText, AlertTriangle, CheckCircle2, Download, Lightbulb, Lock, ShieldCheck, Trash2, FileWarning } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/hooks/useSession';
import { ShareableScoreBadge } from '@/components/ShareableScoreBadge';
import { getReportSourceSnapshot, REPORT_TRUST_NOTICES } from '@/lib/reportProvenance';
import { deleteResumeAnalysisWithReceipt, type ResumeDeletionReceipt } from '@/lib/resumeAnalysisPrivacy';
import {
    createResumeProofReportArtifact,
    deleteResumeProofReportArtifactWithReceipt,
    type ResumeProofReportArtifact,
    type ResumeProofReportArtifactDeletionReceipt,
} from '@/lib/resumeProofReportArtifacts';

interface AutomationPronePhrase {
    phrase: string;
    context: string;
    severity: 'low' | 'medium' | 'high';
    reason: string;
}

interface RewriteSuggestion {
    original: string;
    suggested: string;
    rationale: string;
}

type ResumeProofConfidence = 'low' | 'medium' | 'high';

interface ResumeProofEvidenceCard {
    id: string;
    claim: string;
    sourceIds: string[];
    confidence: ResumeProofConfidence | string;
    generatedAt: string;
    caveat: string;
    doesNotProve: string;
    reviewStatus: string;
}

interface ResumeParserBoundary {
    filename: string;
    inputMode: string;
    rawFileStored: boolean;
    rawResumeTextStored: boolean;
    savedAnalysisId: string | null;
    deletionReceiptAvailable: boolean;
    productionPdfDocxParser: boolean;
    caveat: string;
}

interface ResumeProofPack {
    proofPackType: string;
    schemaVersion?: string;
    generatedAt: string;
    reviewStatus: string;
    sourceIds: string[];
    evidenceCards: ResumeProofEvidenceCard[];
    parserBoundary?: ResumeParserBoundary;
    decisionBoundaries: string[];
}

interface AnalysisResult {
    analysis_id?: string | null;
    automation_risk_score: number;
    confidence_score: number;
    automation_prone_phrases: AutomationPronePhrase[];
    rewrite_suggestions: RewriteSuggestion[];
    detected_skills: string[];
    recommended_skills: Array<{
        skill: string;
        reason: string;
        priority: 'high' | 'medium' | 'low';
    }>;
    proof_pack?: ResumeProofPack;
}

interface ResumeProofReportOptions {
    redactResumeDetails?: boolean;
}

const FREE_SCAN_KEY = 'apo:resume_free_scan_used';
const MAX_FREE_SCANS = 1;
const REVIEW_STATUS_LABELS: Record<string, string> = {
    auto_generated: 'Auto-generated',
    staff_review_required: 'Staff review required',
    staff_reviewed: 'Staff reviewed',
    coach_reviewed: 'Coach reviewed',
    client_ready: 'Client ready',
};

function formatReviewStatus(status?: string): string {
    if (!status) return 'Review status unknown';
    return REVIEW_STATUS_LABELS[status] || status.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function formatConfidence(confidence?: string): string {
    if (!confidence) return 'Unknown confidence';
    return `${confidence.charAt(0).toUpperCase()}${confidence.slice(1)} confidence`;
}

function findResumeEvidenceCard(proofPack: ResumeProofPack | undefined, id: string): ResumeProofEvidenceCard | undefined {
    return proofPack?.evidenceCards.find((card) => card.id === id);
}

function ResumeEvidenceBoundaryNote({ card, label }: { card?: ResumeProofEvidenceCard; label: string }) {
    if (!card) return null;

    return (
        <Alert data-resume-evidence-note={card.id}>
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
                <div className="space-y-1">
                    <p>
                        <strong>{label}:</strong> {card.claim}
                    </p>
                    <p>
                        <strong>Sources:</strong> {card.sourceIds.join(', ')}. <strong>{formatConfidence(card.confidence)}.</strong> <strong>Review:</strong> {formatReviewStatus(card.reviewStatus)}.
                    </p>
                    <p>
                        <strong>Caveat:</strong> {card.caveat}
                    </p>
                    <p>
                        <strong>Does not prove:</strong> {card.doesNotProve}
                    </p>
                </div>
            </AlertDescription>
        </Alert>
    );
}

function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getResumeProofReportHtml(
    result: AnalysisResult,
    receipt: ResumeDeletionReceipt | null,
    options: ResumeProofReportOptions = {}
): string {
    const proofPack = result.proof_pack;
    const generatedAt = proofPack?.generatedAt || new Date().toISOString();
    const sourceIds = proofPack?.sourceIds || ['llm-output', 'nist-ai-rmf', 'ada-ai-hiring-guidance', 'eeoc-employment-selection-procedures', 'cfpb-employment-algorithmic-scores'];
    const evidenceCards = proofPack?.evidenceCards || [];
    const redactResumeDetails = options.redactResumeDetails === true;
    const decisionBoundaries = proofPack?.decisionBoundaries || [
        'Not a hiring, firing, promotion, compensation, layoff, or eligibility decision system.',
        'Human review is required before client delivery or institutional use.',
    ];

    const phraseRows = redactResumeDetails
        ? `<tr><td colspan="3">Resume detail rows redacted from saved artifact. Phrase count: ${escapeHtml(result.automation_prone_phrases.length)}. Use the local user-controlled download for detailed phrase review.</td></tr>`
        : result.automation_prone_phrases.map((phrase) => `
      <tr>
        <td>${escapeHtml(phrase.phrase)}</td>
        <td>${escapeHtml(phrase.severity)}</td>
        <td>${escapeHtml(phrase.reason)}</td>
      </tr>`).join('');
    const rewriteRows = redactResumeDetails
        ? `<tr><td colspan="3">Rewrite detail rows redacted from saved artifact. Draft count: ${escapeHtml(result.rewrite_suggestions.length)}. Human-reviewed rewrite work should happen in the user-controlled local artifact or a consented institutional workflow.</td></tr>`
        : result.rewrite_suggestions.map((suggestion) => `
      <tr>
        <td>${escapeHtml(suggestion.original)}</td>
        <td>${escapeHtml(suggestion.suggested)}</td>
        <td>${escapeHtml(suggestion.rationale)}</td>
      </tr>`).join('');
    const skillRows = result.recommended_skills.map((skill) => `
      <tr>
        <td>${escapeHtml(skill.skill)}</td>
        <td>${escapeHtml(skill.priority)}</td>
        <td>${escapeHtml(skill.reason)}</td>
      </tr>`).join('');
    const evidenceRows = evidenceCards.map((card) => `
      <section class="evidence-card">
        <h3>${escapeHtml(card.id)}</h3>
        <p><strong>Claim:</strong> ${escapeHtml(card.claim)}</p>
        <p><strong>Sources:</strong> ${escapeHtml(card.sourceIds.join(', '))}</p>
        <p><strong>Confidence:</strong> ${escapeHtml(card.confidence)}. <strong>Review:</strong> ${escapeHtml(formatReviewStatus(card.reviewStatus))}</p>
        <p><strong>Caveat:</strong> ${escapeHtml(card.caveat)}</p>
        <p><strong>Does not prove:</strong> ${escapeHtml(card.doesNotProve)}</p>
      </section>`).join('');
    const parserBoundary = proofPack?.parserBoundary;
    const retentionText = receipt
        ? `Deletion receipt ${receipt.receiptId} recorded ${receipt.deletionStatus} for saved analysis ${receipt.analysisId}. Receipt hash prefix: ${receipt.receiptHash.slice(0, 16)}.`
        : 'No deletion receipt is attached to this downloaded report. Signed-in saved analyses can create an app-level deletion receipt from the resume analyzer.';

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Resume Work Transition Proof Report</title>
  <style>
    body { color: #172033; font-family: Inter, Arial, sans-serif; line-height: 1.55; margin: 0 auto; max-width: 920px; padding: 32px; }
    h1 { font-size: 28px; margin-bottom: 4px; }
    h2 { border-bottom: 2px solid #d8e1ee; font-size: 18px; margin-top: 28px; padding-bottom: 6px; }
    h3 { font-size: 14px; margin-bottom: 4px; }
    .meta, .boundary, .evidence-card { background: #f8fafc; border: 1px solid #d8e1ee; border-radius: 8px; margin: 12px 0; padding: 12px; }
    .score { align-items: baseline; display: flex; gap: 12px; margin: 18px 0; }
    .score strong { font-size: 42px; }
    table { border-collapse: collapse; margin: 12px 0; width: 100%; }
    th, td { border: 1px solid #d8e1ee; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #eef4fb; }
    ul { padding-left: 20px; }
    .small { color: #5b677a; font-size: 12px; }
  </style>
</head>
<body data-resume-proof-report="true" data-resume-proof-report-redacted="${redactResumeDetails ? 'true' : 'false'}">
  <h1>Resume Work Transition Proof Report</h1>
  <p class="small">Generated ${escapeHtml(new Date(generatedAt).toLocaleString())}. This is a coaching artifact, not an employment decision tool.</p>

  <section class="meta">
    <p><strong>Automation risk score:</strong> ${escapeHtml(result.automation_risk_score)} / 100</p>
    <p><strong>Model confidence:</strong> ${escapeHtml(Math.round(result.confidence_score * 100))}%</p>
    <p><strong>Review state:</strong> ${escapeHtml(formatReviewStatus(proofPack?.reviewStatus))}</p>
    <p><strong>Sources:</strong> ${escapeHtml(sourceIds.join(', '))}</p>
  </section>

  <h2>Decision Boundaries</h2>
  <section class="boundary">
    <ul>${decisionBoundaries.map((boundary) => `<li>${escapeHtml(boundary)}</li>`).join('')}</ul>
  </section>

  ${redactResumeDetails ? `<h2>Saved Artifact Redaction Boundary</h2>
  <section class="boundary">
    <p><strong>Raw resume text stored: no.</strong> Original phrase rows, detailed rewrite rows, and pasted resume text are omitted from this saved artifact.</p>
    <p>This saved artifact is for user-owned coaching review only. It is not a hiring, firing, promotion, compensation, layoff, screening, eligibility, consumer-report, or employment-decision artifact.</p>
  </section>` : ''}

  <h2>Parser And Retention Boundary</h2>
  <section class="boundary">
    <p>${escapeHtml(parserBoundary?.caveat || 'The report analyzes text supplied to the app. Production PDF/DOCX parsing requires a separate server-side parser verification.')}</p>
    <p><strong>Raw file stored:</strong> ${parserBoundary?.rawFileStored ? 'yes' : 'no'}; <strong>raw resume text stored:</strong> ${parserBoundary?.rawResumeTextStored ? 'yes' : 'no'}; <strong>production PDF/DOCX parser ready:</strong> ${parserBoundary?.productionPdfDocxParser ? 'yes' : 'no'}.</p>
    <p>${escapeHtml(retentionText)}</p>
  </section>

  <h2>Automation-Prone Phrases</h2>
  <table>
    <thead><tr><th>Phrase</th><th>Severity</th><th>Reason</th></tr></thead>
    <tbody>${phraseRows || '<tr><td colspan="3">No automation-prone phrases returned by the model.</td></tr>'}</tbody>
  </table>

  <h2>Rewrite Drafts</h2>
  <table>
    <thead><tr><th>Original</th><th>Suggested</th><th>Rationale</th></tr></thead>
    <tbody>${rewriteRows || '<tr><td colspan="3">No rewrite drafts returned by the model.</td></tr>'}</tbody>
  </table>

  <h2>Recommended Skill Themes</h2>
  <table>
    <thead><tr><th>Skill</th><th>Priority</th><th>Reason</th></tr></thead>
    <tbody>${skillRows || '<tr><td colspan="3">No skill themes returned by the model.</td></tr>'}</tbody>
  </table>

  <h2>Evidence Cards</h2>
  ${evidenceRows || '<section class="evidence-card"><p>No evidence cards were returned. Do not use this output for client delivery.</p></section>'}
</body>
</html>`;
}

function getRewriteDraftPacket(result: AnalysisResult): string {
    const proofPack = result.proof_pack;
    const rewriteEvidence = findResumeEvidenceCard(proofPack, 'resume-rewrite-boundary');
    const skillEvidence = findResumeEvidenceCard(proofPack, 'resume-skill-recommendation-boundary');
    const lines = [
        'Resume work-transition rewrite draft packet',
        '',
        'Boundary: coaching draft only. Not a hiring, firing, promotion, compensation, layoff, screening, or eligibility decision tool.',
        rewriteEvidence ? `Rewrite caveat: ${rewriteEvidence.caveat}` : null,
        skillEvidence ? `Skill caveat: ${skillEvidence.caveat}` : null,
        '',
        'Rewrite drafts:',
        ...result.rewrite_suggestions.flatMap((suggestion, index) => [
            `${index + 1}. Original: ${suggestion.original}`,
            `   Suggested: ${suggestion.suggested}`,
            `   Rationale: ${suggestion.rationale}`,
        ]),
        '',
        'Skill themes:',
        ...result.recommended_skills.map((skill, index) => `${index + 1}. ${skill.skill} (${skill.priority}) - ${skill.reason}`),
    ].filter((line): line is string => Boolean(line));

    return lines.join('\n');
}

function downloadHtml(filename: string, html: string): void {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function getFreeScanCount(): number {
    try {
        return parseInt(localStorage.getItem(FREE_SCAN_KEY) || '0', 10);
    } catch {
        return 0;
    }
}

function incrementFreeScanCount(): void {
    try {
        localStorage.setItem(FREE_SCAN_KEY, String(getFreeScanCount() + 1));
    } catch { /* noop */ }
}

function printableRatio(text: string): number {
    if (!text.length) return 0;
    const printable = text.split('').filter((char) => {
        const code = char.charCodeAt(0);
        return code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126);
    }).length;
    return printable / text.length;
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === 'string') return message;
    }
    return fallback;
}

async function extractResumeText(file: File): Promise<{ text: string; warning?: string }> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const rawText = await file.text();
    const normalizedText = rawText.replace(new RegExp(String.fromCharCode(0), 'g'), ' ').replace(/\s+/g, ' ').trim();

    if (extension === 'txt' || file.type === 'text/plain') {
        return { text: normalizedText };
    }

    const ratio = printableRatio(rawText);
    if (normalizedText.length < 300 || ratio < 0.75) {
        throw new Error('This browser route cannot reliably extract text from that file. Export the resume as .txt or paste the resume text below.');
    }

    return {
        text: normalizedText,
        warning: 'This file was read with browser text extraction. For production PDF/DOCX quality, move parsing to a server-side parser before selling this workflow.',
    };
}

export default function ResumeAnalyzer() {
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [resumeText, setResumeText] = useState('');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [analysisId, setAnalysisId] = useState<string | null>(null);
    const [filename, setFilename] = useState('');
    const [fileWarning, setFileWarning] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);
    const [deletingAnalysis, setDeletingAnalysis] = useState(false);
    const [deletionReceipt, setDeletionReceipt] = useState<ResumeDeletionReceipt | null>(null);
    const [savingProofArtifact, setSavingProofArtifact] = useState(false);
    const [deletingProofArtifact, setDeletingProofArtifact] = useState(false);
    const [savedProofArtifact, setSavedProofArtifact] = useState<ResumeProofReportArtifact | null>(null);
    const [proofArtifactDeletionReceipt, setProofArtifactDeletionReceipt] =
        useState<ResumeProofReportArtifactDeletionReceipt | null>(null);
    const { toast } = useToast();
    const { session } = useSession();
    const isAuthenticated = !!session?.user;

    const analyzeResume = useCallback(async (text: string, fname: string) => {
        const cleanedText = text.trim();
        if (cleanedText.length < 200) {
            toast({
                title: 'Resume Text Too Short',
                description: 'Paste or upload enough resume text for a meaningful automation-risk analysis.',
                variant: 'destructive'
            });
            return;
        }

        // Allow 1 free scan for guests, unlimited for authenticated users
        if (!isAuthenticated && getFreeScanCount() >= MAX_FREE_SCANS) {
            toast({
                title: 'Free scan used',
                description: 'Sign up for free to unlock more resume scans and full rewrite suggestions.',
            });
            return;
        }

        setAnalyzing(true);
        setAnalysisResult(null);
        setAnalysisId(null);
        setDeletionReceipt(null);
        setSavedProofArtifact(null);
        setProofArtifactDeletionReceipt(null);

        try {
            const { data, error } = await supabase.functions.invoke('analyze-resume', {
                body: {
                    resume_text: cleanedText,
                    user_id: session?.user?.id,
                    filename: fname
                }
            });

            if (error) throw error;

            if (data && data.success) {
                setAnalysisResult(data as AnalysisResult);
                setAnalysisId(data.analysis_id || null);

                // Track free scan usage for guests
                if (!isAuthenticated) {
                    incrementFreeScanCount();
                }

                toast({
                    title: 'Analysis Complete',
                    description: `Automation Risk Score: ${data.automation_risk_score}/100`,
                });
            }
        } catch (error: unknown) {
            console.error('Error analyzing resume:', error);
            toast({
                title: 'Analysis Error',
                description: getErrorMessage(error, 'Failed to analyze resume'),
                variant: 'destructive'
            });
        } finally {
            setAnalyzing(false);
        }
    }, [isAuthenticated, session?.user?.id, toast]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setFilename(file.name);
        setUploading(true);
        setFileWarning(null);

        try {
            const { text, warning } = await extractResumeText(file);
            setResumeText(text);
            setFileWarning(warning || null);

            // Auto-analyze after upload
            await analyzeResume(text, file.name);

        } catch (error) {
            console.error('Error reading file:', error);
            toast({
                title: 'Upload Error',
                description: error instanceof Error ? error.message : 'Failed to read resume file',
                variant: 'destructive'
            });
        } finally {
            setUploading(false);
        }
    }, [analyzeResume, toast]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxFiles: 1,
        disabled: uploading || analyzing
    });

    const shareScore = (platform: 'twitter' | 'linkedin' | 'copy') => {
        const score = analysisResult?.automation_risk_score ?? 0;
        const text = `My resume work-transition score: ${100 - score}/100. Review your resume language for AI-era work shifts:`;
        const url = window.location.origin + '/tools/resume-analyzer';

        switch (platform) {
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                break;
            case 'copy':
                navigator.clipboard.writeText(`${text} ${url}`);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
                toast({ title: 'Link copied!' });
                break;
        }
    };

    const deleteSavedAnalysis = async () => {
        if (!analysisId || !session?.user?.id) return;

        setDeletingAnalysis(true);
        try {
            const receipt = await deleteResumeAnalysisWithReceipt(analysisId);

            setAnalysisId(null);
            setDeletionReceipt(receipt);
            toast({
                title: 'Deletion Receipt Created',
                description: 'The saved resume analysis row was removed and a bounded receipt was recorded.',
            });
        } catch (error: unknown) {
            console.error('Error deleting resume analysis:', error);
            toast({
                title: 'Delete Failed',
                description: getErrorMessage(error, 'Unable to delete saved analysis'),
                variant: 'destructive',
            });
        } finally {
            setDeletingAnalysis(false);
        }
    };

    const downloadResumeProofReport = () => {
        if (!analysisResult) return;

        const html = getResumeProofReportHtml(analysisResult, deletionReceipt);
        downloadHtml('resume-work-transition-proof-report.html', html);
        toast({
            title: 'Proof Report Downloaded',
            description: 'The HTML report includes sources, caveats, review state, and decision boundaries.',
        });
    };

    const saveRedactedProofArtifact = async () => {
        if (!analysisResult) return;

        if (!isAuthenticated) {
            toast({
                title: 'Sign In Required',
                description: 'Sign in before saving a redacted resume proof artifact.',
                variant: 'destructive',
            });
            return;
        }

        if (!isSupabaseConfigured) {
            toast({
                title: 'Artifact Storage Unavailable',
                description: 'Supabase is not configured in this environment, so only local downloads are available.',
                variant: 'destructive',
            });
            return;
        }

        setSavingProofArtifact(true);
        setProofArtifactDeletionReceipt(null);
        try {
            const proofPack = analysisResult.proof_pack;
            const reportHtmlRedacted = getResumeProofReportHtml(analysisResult, deletionReceipt, {
                redactResumeDetails: true,
            });
            const artifact = await createResumeProofReportArtifact({
                analysisId,
                title: 'Resume Work Transition Proof Report',
                reportHtmlRedacted,
                sourceVersions: getReportSourceSnapshot(),
                metadata: {
                    proof_pack_type: proofPack?.proofPackType || 'resume_analysis',
                    review_status: proofPack?.reviewStatus || 'staff_review_required',
                    source_ids: proofPack?.sourceIds || ['llm-output', 'nist-ai-rmf', 'ada-ai-hiring-guidance', 'eeoc-employment-selection-procedures', 'cfpb-employment-algorithmic-scores'],
                    evidence_card_ids: proofPack?.evidenceCards.map((card) => card.id) || [],
                    automation_risk_score: analysisResult.automation_risk_score,
                    confidence_score: analysisResult.confidence_score,
                    phrase_count_redacted: analysisResult.automation_prone_phrases.length,
                    rewrite_count_redacted: analysisResult.rewrite_suggestions.length,
                    raw_resume_text_stored: false,
                    resume_detail_rows_redacted: true,
                    non_employment_decision_boundary:
                        'not_for_hiring_firing_promotion_compensation_layoff_screening_or_eligibility',
                },
            });
            setSavedProofArtifact(artifact);
            toast({
                title: 'Redacted Artifact Saved',
                description: 'The saved artifact omits resume detail rows and preserves evidence, caveats, and review state.',
            });
        } catch (error: unknown) {
            console.error('Error saving resume proof artifact:', error);
            toast({
                title: 'Artifact Save Failed',
                description: getErrorMessage(error, 'Unable to save redacted resume proof artifact.'),
                variant: 'destructive',
            });
        } finally {
            setSavingProofArtifact(false);
        }
    };

    const deleteSavedProofArtifact = async () => {
        if (!savedProofArtifact) return;

        setDeletingProofArtifact(true);
        try {
            const receipt = await deleteResumeProofReportArtifactWithReceipt(savedProofArtifact.id);
            setSavedProofArtifact(null);
            setProofArtifactDeletionReceipt(receipt);
            toast({
                title: 'Artifact Deletion Receipt Created',
                description: 'The saved redacted proof artifact was deleted and a bounded receipt was recorded.',
            });
        } catch (error: unknown) {
            console.error('Error deleting resume proof artifact:', error);
            toast({
                title: 'Artifact Delete Failed',
                description: getErrorMessage(error, 'Unable to delete redacted resume proof artifact.'),
                variant: 'destructive',
            });
        } finally {
            setDeletingProofArtifact(false);
        }
    };

    const copyRewriteDrafts = async () => {
        if (!analysisResult) return;

        const packet = getRewriteDraftPacket(analysisResult);
        try {
            await navigator.clipboard.writeText(packet);
            toast({
                title: 'Rewrite Drafts Copied',
                description: 'The copied packet includes coaching caveats and review boundaries.',
            });
        } catch {
            const blob = new Blob([packet], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'resume-rewrite-drafts.txt';
            link.click();
            URL.revokeObjectURL(url);
            toast({
                title: 'Rewrite Drafts Downloaded',
                description: 'Clipboard was unavailable, so a bounded text packet was downloaded.',
            });
        }
    };

    const getRiskLevel = (score: number) => {
        if (score < 30) return { label: 'Low Risk', color: 'text-green-600', bgColor: 'bg-green-100' };
        if (score < 60) return { label: 'Moderate Risk', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
        return { label: 'High Risk', color: 'text-red-600', bgColor: 'bg-red-100' };
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'destructive';
            case 'medium': return 'default';
            case 'low': return 'secondary';
            default: return 'outline';
        }
    };

    const proofPack = analysisResult?.proof_pack;
    const riskEvidenceCard = findResumeEvidenceCard(proofPack, 'resume-risk-score-boundary');
    const rewriteEvidenceCard = findResumeEvidenceCard(proofPack, 'resume-rewrite-boundary');
    const skillEvidenceCard = findResumeEvidenceCard(proofPack, 'resume-skill-recommendation-boundary');

    return (
        <main className="space-y-6">
            <h1 className="sr-only">Resume Automation Risk Analyzer</h1>
            {/* Upload Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Resume Automation Risk Analyzer
                    </CardTitle>
                    <CardDescription>
                        Upload your resume to identify automation-prone phrases and get strategic rewrites
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <ShieldCheck className="h-4 w-4" />
                        <AlertDescription>
                            Reliable path today: paste text or upload .txt. PDF/DOCX browser extraction is treated as degraded until server-side parsing is added. Guest scans are not stored; signed-in scans may create a saved analysis record that can be deleted below. {REPORT_TRUST_NOTICES[1]}
                        </AlertDescription>
                    </Alert>

                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-gray-300 hover:border-[var(--accent-primary)]'
                            } ${(uploading || analyzing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <input {...getInputProps({ 'aria-label': 'Upload resume file' })} />
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        {isDragActive ? (
                            <p className="text-lg font-medium">Drop your resume here...</p>
                        ) : uploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
                                <p>Uploading...</p>
                            </div>
                        ) : analyzing ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
                                <p>Analyzing with AI...</p>
                            </div>
                        ) : (
                            <>
                                <p className="text-lg font-medium mb-2">Drag & drop your resume here</p>
                                <p className="text-sm text-muted-foreground">or click to browse</p>
                                <p className="text-xs text-muted-foreground mt-2">Best support: .txt. PDF/DOC/DOCX may require paste fallback.</p>
                            </>
                        )}
                    </div>

                    {filename && (
                        <Alert>
                            <FileText className="h-4 w-4" />
                            <AlertDescription>
                                <strong>{filename}</strong> uploaded successfully
                            </AlertDescription>
                        </Alert>
                    )}

                    {fileWarning && (
                        <Alert>
                            <FileWarning className="h-4 w-4" />
                            <AlertDescription>{fileWarning}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-3">
                        <Textarea
                            value={resumeText}
                            onChange={(event) => {
                                setResumeText(event.target.value);
                                setFileWarning(null);
                            }}
                            placeholder="Paste resume text here if PDF/DOCX extraction is blocked or incomplete..."
                            rows={8}
                            disabled={uploading || analyzing}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => analyzeResume(resumeText, filename || 'pasted-resume.txt')}
                            disabled={uploading || analyzing || resumeText.trim().length < 200}
                            className="w-full"
                        >
                            {analyzing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                'Analyze Pasted Text'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisResult && (
                <>
                    {/* Risk Score Card */}
                    <Card className="border-2 border-[var(--accent-primary)]/20">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Automation Risk Assessment</CardTitle>
                                    <CardDescription>
                                        Based on AI analysis of {analysisResult.automation_prone_phrases.length} potential risk indicators
                                    </CardDescription>
                                </div>

                                <div className="text-right">
                                    <div className={`text-4xl font-bold ${getRiskLevel(analysisResult.automation_risk_score).color}`}>
                                        {analysisResult.automation_risk_score}
                                    </div>
                                    <div className="text-sm text-muted-foreground">out of 100</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Risk Level</span>
                                    <span className="font-medium">{getRiskLevel(analysisResult.automation_risk_score).label}</span>
                                </div>
                                <Progress
                                    value={analysisResult.automation_risk_score}
                                    className="h-3"
                                />
                            </div>

                            <Badge className={getRiskLevel(analysisResult.automation_risk_score).bgColor} variant="outline">
                                Confidence: {Math.round(analysisResult.confidence_score * 100)}%
                            </Badge>

                            <ResumeEvidenceBoundaryNote card={riskEvidenceCard} label="Risk score evidence" />

                            <Alert>
                                <ShieldCheck className="h-4 w-4" />
                                <AlertDescription className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <span>
                                        {analysisId
                                            ? 'This signed-in analysis is saved to your account. Use delete when the client review is complete.'
                                            : 'No saved analysis record is available for this result in the current session.'}
                                    </span>
                                    {analysisId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={deleteSavedAnalysis}
                                            disabled={deletingAnalysis}
                                        >
                                            {deletingAnalysis ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="mr-2 h-4 w-4" />
                                            )}
                                            Delete Saved Record
                                        </Button>
                                    )}
                                </AlertDescription>
                            </Alert>

                            {deletionReceipt && (
                                <Alert data-resume-deletion-receipt="true">
                                    <ShieldCheck className="h-4 w-4" />
                                    <AlertDescription>
                                        <div className="space-y-2">
                                            <p>
                                                <strong>Deletion receipt:</strong> {deletionReceipt.receiptId}
                                            </p>
                                            <p>
                                                Saved analysis {deletionReceipt.analysisId} was marked {deletionReceipt.deletionStatus} at {new Date(deletionReceipt.deletedAt).toLocaleString()}.
                                            </p>
                                            <p>
                                                <strong>Receipt hash:</strong> <code>{deletionReceipt.receiptHash.slice(0, 16)}...</code>
                                            </p>
                                            <p>{deletionReceipt.rawTextRetentionPolicy}</p>
                                            <p>{deletionReceipt.modelProviderBoundary}</p>
                                            <p>
                                                <strong>Sources:</strong> {deletionReceipt.sourceIds.join(', ')}. <strong>Caveat:</strong> {deletionReceipt.caveat}
                                            </p>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Alert data-resume-proof-artifact-boundary="true">
                                <ShieldCheck className="h-4 w-4" />
                                <AlertDescription className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <span>
                                        Saved proof artifacts are redacted: raw resume text, phrase detail rows, and rewrite detail rows are omitted. Keep the local download for user-controlled detailed review.
                                        {!isAuthenticated && ' Sign in to save a redacted proof artifact.'}
                                        {isAuthenticated && !isSupabaseConfigured && ' Supabase is not configured, so saving is unavailable in this environment.'}
                                    </span>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => void saveRedactedProofArtifact()}
                                            disabled={savingProofArtifact || !isAuthenticated || !isSupabaseConfigured}
                                        >
                                            {savingProofArtifact ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <ShieldCheck className="mr-2 h-4 w-4" />
                                            )}
                                            Save Redacted Artifact
                                        </Button>
                                        {savedProofArtifact && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => void deleteSavedProofArtifact()}
                                                disabled={deletingProofArtifact}
                                            >
                                                {deletingProofArtifact ? (
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                )}
                                                Delete Artifact
                                            </Button>
                                        )}
                                    </div>
                                </AlertDescription>
                            </Alert>

                            {savedProofArtifact && (
                                <Alert data-resume-proof-artifact-status="true">
                                    <ShieldCheck className="h-4 w-4" />
                                    <AlertDescription>
                                        <div className="space-y-1">
                                            <p>
                                                <strong>Saved redacted artifact:</strong> {savedProofArtifact.id.slice(0, 8)}.
                                            </p>
                                            <p>
                                                <strong>Review:</strong> {formatReviewStatus(savedProofArtifact.reviewStatus)}. <strong>Sources:</strong> {savedProofArtifact.sourceIds.join(', ')}.
                                            </p>
                                            <p>{savedProofArtifact.retentionPolicy}</p>
                                            <p>
                                                <strong>Caveat:</strong> {savedProofArtifact.caveat}
                                            </p>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {proofArtifactDeletionReceipt && (
                                <Alert data-resume-proof-artifact-deletion-receipt="true">
                                    <ShieldCheck className="h-4 w-4" />
                                    <AlertDescription>
                                        <div className="space-y-1">
                                            <p>
                                                <strong>Artifact deletion receipt:</strong> {proofArtifactDeletionReceipt.receiptId}
                                            </p>
                                            <p>
                                                Artifact {proofArtifactDeletionReceipt.artifactId} was marked {proofArtifactDeletionReceipt.deletionStatus} at {new Date(proofArtifactDeletionReceipt.deletedAt).toLocaleString()}.
                                            </p>
                                            <p>
                                                <strong>Receipt hash:</strong> <code>{proofArtifactDeletionReceipt.receiptHash.slice(0, 16)}...</code>
                                            </p>
                                            <p>{proofArtifactDeletionReceipt.caveat}</p>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {proofPack && (
                        <Card data-resume-proof-pack-boundary="true">
                            <CardHeader>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <CardTitle>Resume Analysis Evidence And Review Boundaries</CardTitle>
                                        <CardDescription>
                                            Source-labeled proof metadata for this AI-assisted coaching analysis.
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline">{formatReviewStatus(proofPack.reviewStatus)}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                    <div className="rounded-md border p-3">
                                        <p className="font-medium">Sources</p>
                                        <p className="text-muted-foreground">{proofPack.sourceIds.join(', ')}</p>
                                    </div>
                                    <div className="rounded-md border p-3">
                                        <p className="font-medium">Generated</p>
                                        <p className="text-muted-foreground">{new Date(proofPack.generatedAt).toLocaleString()}</p>
                                    </div>
                                </div>

                                {proofPack.parserBoundary && (
                                    <Alert data-resume-parser-boundary="true">
                                        <FileWarning className="h-4 w-4" />
                                        <AlertDescription>
                                            <div className="space-y-1">
                                                <p>
                                                    <strong>Parser boundary:</strong> {proofPack.parserBoundary.caveat}
                                                </p>
                                                <p>
                                                    Raw file stored: {proofPack.parserBoundary.rawFileStored ? 'yes' : 'no'}; raw resume text stored: {proofPack.parserBoundary.rawResumeTextStored ? 'yes' : 'no'}; production PDF/DOCX parser ready: {proofPack.parserBoundary.productionPdfDocxParser ? 'yes' : 'no'}.
                                                </p>
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold">Decision Boundaries</h3>
                                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                                        {proofPack.decisionBoundaries.map((boundary) => (
                                            <li key={boundary}>{boundary}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="space-y-3" data-resume-proof-evidence-cards="true">
                                    <h3 className="text-sm font-semibold">Evidence Cards</h3>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        {proofPack.evidenceCards.map((card) => (
                                            <div
                                                key={card.id}
                                                className="rounded-md border p-3 text-sm"
                                                data-resume-proof-evidence-card={card.id}
                                            >
                                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                                    <Badge variant="secondary">{formatConfidence(card.confidence)}</Badge>
                                                    <Badge variant="outline">{formatReviewStatus(card.reviewStatus)}</Badge>
                                                </div>
                                                <p className="font-medium">{card.claim}</p>
                                                <p className="mt-2 text-muted-foreground">
                                                    <strong>Sources:</strong> {card.sourceIds.join(', ')}
                                                </p>
                                                <p className="mt-2 text-muted-foreground">
                                                    <strong>Caveat:</strong> {card.caveat}
                                                </p>
                                                <p className="mt-2 text-muted-foreground">
                                                    <strong>Does not prove:</strong> {card.doesNotProve}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Automation-Prone Phrases */}
                    {analysisResult.automation_prone_phrases.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                    Automation-Prone Phrases ({analysisResult.automation_prone_phrases.length})
                                </CardTitle>
                                <CardDescription>
                                    These phrases signal routine work that may be automated
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <ResumeEvidenceBoundaryNote card={riskEvidenceCard} label="Phrase evidence" />
                                {analysisResult.automation_prone_phrases.map((phrase, index) => (
                                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="font-semibold text-red-800">"{phrase.phrase}"</span>
                                            <Badge variant={getSeverityColor(phrase.severity)}>
                                                {phrase.severity}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            <strong>Context:</strong> {phrase.context}
                                        </p>
                                        <p className="text-sm text-red-700">
                                            <strong>Why risky:</strong> {phrase.reason}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Rewrite Suggestions */}
                    {analysisResult.rewrite_suggestions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5 text-green-500" />
                                    Strategic Rewrites ({analysisResult.rewrite_suggestions.length})
                                </CardTitle>
                                <CardDescription>
                                    Improve your resume by emphasizing strategic and creative skills
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ResumeEvidenceBoundaryNote card={rewriteEvidenceCard} label="Rewrite evidence" />
                                {analysisResult.rewrite_suggestions.map((suggestion, index) => (
                                    <div key={index} className="border rounded-lg overflow-hidden">
                                        <div className="p-3 bg-red-50 border-b">
                                            <div className="flex items-center gap-2 text-sm text-red-800 mb-1">
                                                <span className="font-semibold">❌ Before:</span>
                                            </div>
                                            <p className="text-red-900">{suggestion.original}</p>
                                        </div>
                                        <div className="p-3 bg-green-50">
                                            <div className="flex items-center gap-2 text-sm text-green-800 mb-1">
                                                <span className="font-semibold">✅ After:</span>
                                            </div>
                                            <p className="text-green-900 font-medium">{suggestion.suggested}</p>
                                            <p className="text-sm text-green-700 mt-2">
                                                <strong>Why better:</strong> {suggestion.rationale}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Skills Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Detected Skills */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-[var(--accent-primary)]" />
                                    Detected Skills
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {analysisResult.detected_skills.slice(0, 15).map((skill, index) => (
                                        <Badge key={index} variant="secondary">
                                            {skill}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recommended Skills */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5 text-[var(--accent-primary)]" />
                                    Recommended Skills
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <ResumeEvidenceBoundaryNote card={skillEvidenceCard} label="Skill recommendation evidence" />
                                    {analysisResult.recommended_skills.slice(0, 5).map((rec, index) => (
                                        <div key={index} className="flex items-start gap-2">
                                            <Badge variant={rec.priority === 'high' ? 'default' : 'outline'} className="mt-0.5">
                                                {rec.priority}
                                            </Badge>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{rec.skill}</p>
                                                <p className="text-xs text-muted-foreground">{rec.reason}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Shareable work-transition score badge */}
                    <ShareableScoreBadge
                        score={100 - (analysisResult?.automation_risk_score ?? 0)}
                        onShareTwitter={() => shareScore('twitter')}
                        onShareLinkedIn={() => shareScore('linkedin')}
                    />

                    {/* Signup Gate for Guests */}
                    {!isAuthenticated && (
                        <Card className="border-2 border-amber-500/30 bg-amber-900/10">
                            <CardContent className="py-6 text-center">
                                <Lock className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold mb-2">Unlock Full Analysis</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Sign up free to get unlimited scans, full rewrite suggestions, and skill recommendations.
                                </p>
                                <Button onClick={() => window.location.href = '/auth'} className="bg-emerald-600 hover:bg-emerald-500">
                                    Sign Up Free
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button className="flex-1" variant="outline" onClick={downloadResumeProofReport}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Proof Report
                        </Button>
                        <Button className="flex-1" variant="outline" onClick={() => shareScore('copy')}>
                            {linkCopied ? 'Link Copied' : 'Copy Score Link'}
                        </Button>
                        <Button className="flex-1" onClick={() => void copyRewriteDrafts()} disabled={analysisResult.rewrite_suggestions.length === 0}>
                            Copy Rewrite Drafts
                        </Button>
                    </div>
                </>
            )}

            {/* Empty State */}
            {!resumeText && !analyzing && (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Upload your resume to get started with AI-powered analysis</p>
                    </CardContent>
                </Card>
            )}
        </main>
    );
}
