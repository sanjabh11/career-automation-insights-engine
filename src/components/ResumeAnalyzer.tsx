import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, FileText, AlertTriangle, CheckCircle2, Download, Lightbulb, Lock, ShieldCheck, Trash2, FileWarning } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/hooks/useSession';
import { ShareableScoreBadge } from '@/components/ShareableScoreBadge';
import { REPORT_TRUST_NOTICES } from '@/lib/reportProvenance';

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
}

const FREE_SCAN_KEY = 'apo:resume_free_scan_used';
const MAX_FREE_SCANS = 1;

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
    const [deletionProof, setDeletionProof] = useState<string | null>(null);
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
        setDeletionProof(null);

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
        const text = `My resume AI-Proof Score: ${100 - score}/100. Find out if your resume is AI-proof:`;
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
            const deletedId = analysisId;
            const { error } = await supabase
                .from('resume_analyses')
                .delete()
                .eq('id', analysisId)
                .eq('user_id', session.user.id);

            if (error) throw error;

            setAnalysisId(null);
            setDeletionProof(`Deletion confirmed for saved analysis ${deletedId} at ${new Date().toISOString()}.`);
            toast({
                title: 'Saved Analysis Deleted',
                description: 'The stored resume analysis record was removed from your account.',
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

                            {deletionProof && (
                                <Alert>
                                    <ShieldCheck className="h-4 w-4" />
                                    <AlertDescription>{deletionProof}</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

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

                    {/* Shareable AI-Proof Score Badge */}
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
                    <div className="flex gap-3">
                        <Button className="flex-1" variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Download Full Report
                        </Button>
                        <Button className="flex-1" variant="outline" onClick={() => shareScore('copy')}>
                            {linkCopied ? 'Link Copied' : 'Copy Score Link'}
                        </Button>
                        <Button className="flex-1">
                            Apply Suggestions
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
