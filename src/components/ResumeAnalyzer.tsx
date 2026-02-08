import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload, FileText, AlertTriangle, CheckCircle2, Download, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/hooks/useSession';

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

export default function ResumeAnalyzer() {
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [resumeText, setResumeText] = useState('');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [filename, setFilename] = useState('');
    const { toast } = useToast();
    const { session } = useSession();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setFilename(file.name);
        setUploading(true);

        try {
            // Read file as text (simplified - in production, use PDF parser)
            const text = await file.text();
            setResumeText(text);

            // Auto-analyze after upload
            await analyzeResume(text, file.name);

        } catch (error) {
            console.error('Error reading file:', error);
            toast({
                title: 'Upload Error',
                description: 'Failed to read resume file',
                variant: 'destructive'
            });
        } finally {
            setUploading(false);
        }
    }, []);

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

    const analyzeResume = async (text: string, fname: string) => {
        setAnalyzing(true);

        try {
            const { data, error } = await supabase.functions.invoke('analyze-resume', {
                body: {
                    resume_text: text,
                    user_id: session?.user?.id,
                    filename: fname
                }
            });

            if (error) throw error;

            if (data && data.success) {
                setAnalysisResult(data as AnalysisResult);

                toast({
                    title: 'Analysis Complete',
                    description: `Automation Risk Score: ${data.automation_risk_score}/100`,
                });
            }
        } catch (error: any) {
            console.error('Error analyzing resume:', error);
            toast({
                title: 'Analysis Error',
                description: error.message || 'Failed to analyze resume',
                variant: 'destructive'
            });
        } finally {
            setAnalyzing(false);
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
        <div className="space-y-6">
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
                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${isDragActive ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-gray-300 hover:border-[var(--accent-primary)]'
                            } ${(uploading || analyzing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <input {...getInputProps()} />
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
                                <p className="text-xs text-muted-foreground mt-2">Supports .txt, .pdf, .doc, .docx</p>
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

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button className="flex-1" variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Download Full Report
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
        </div>
    );
}
