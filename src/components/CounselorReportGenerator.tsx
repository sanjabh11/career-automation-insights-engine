import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Settings, Download, Palette, Search, ShieldCheck, ExternalLink, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/hooks/useSession';
import { CreditBalance } from '@/components/monetization/CreditBalance';
import { analytics } from '@/lib/posthog';
import {
    buildCareerCenterCohortCsv,
    buildCareerCenterCohortProofPack,
    renderCareerCenterCohortProofPackHtml,
} from '@/lib/careerCenterCohortProofPack';

interface WhiteLabelConfig {
    company_name: string;
    logo_url?: string;
    primary_color: string;
    secondary_color: string;
    accent_color?: string;
    contact_email?: string;
    contact_phone?: string;
    website_url?: string;
    report_footer_text?: string;
    include_apo_branding: boolean;
}

interface OccupationOption {
    code: string;
    title: string;
    description?: string;
}

const REPORT_EXAMPLES: OccupationOption[] = [
    { code: '15-1252.00', title: 'Software Developers' },
    { code: '43-4051.00', title: 'Customer Service Representatives' },
    { code: '17-2071.00', title: 'Electrical Engineers' },
];

interface SearchOccupationsResponse {
    occupations?: unknown[];
}

interface CounselorReportResponse {
    success?: boolean;
    delivery_url?: string;
    report_id?: string;
    ledger_id?: string;
    idempotent?: boolean;
    metadata?: {
        remaining_credits?: number;
        [key: string]: unknown;
    };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function readString(record: Record<string, unknown>, key: string): string | undefined {
    const value = record[key];
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

function downloadTextFile(filename: string, body: string, type: string) {
    const blob = new Blob([body], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function normalizeOccupation(item: unknown): OccupationOption | null {
    if (!isRecord(item)) return null;

    const code = readString(item, 'occupation_code') || readString(item, 'code') || readString(item, 'onetsoc_code');
    const title = readString(item, 'occupation_title') || readString(item, 'title') || readString(item, 'name');
    if (!code || !title) return null;

    return {
        code,
        title,
        description: readString(item, 'description') || readString(item, 'summary') || 'O*NET occupation profile',
    };
}

export default function CounselorReportGenerator() {
    const [config, setConfig] = useState<WhiteLabelConfig>({
        company_name: '',
        primary_color: '#3b82f6',
        secondary_color: '#8b5cf6',
        include_apo_branding: true
    });
    const [clientLabel, setClientLabel] = useState('');
    const [clientOccupationCode, setClientOccupationCode] = useState('');
    const [clientOccupationTitle, setClientOccupationTitle] = useState('');
    const [occupationQuery, setOccupationQuery] = useState('');
    const [occupationResults, setOccupationResults] = useState<OccupationOption[]>([]);
    const [searchingOccupation, setSearchingOccupation] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [deliveryUrl, setDeliveryUrl] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [humanReviewAcknowledged, setHumanReviewAcknowledged] = useState(false);
    const reportRequestKeyRef = useRef<string | null>(null);
    const { toast } = useToast();
    const { session } = useSession();

    const loadWhiteLabelConfig = useCallback(async () => {
        if (!session?.user?.id) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('white_label_configs')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (data) {
                setConfig(data);
            } else if (error && error.code !== 'PGRST116') { // Not found is ok
                console.error('Error loading config:', error);
            }
        } catch (error) {
            console.error('Error loading white label config:', error);
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        loadWhiteLabelConfig();
    }, [loadWhiteLabelConfig]);

    const searchOccupations = async () => {
        if (occupationQuery.trim().length < 2) {
            setStatusMessage('Type at least 2 characters to search O*NET occupations.');
            return;
        }

        setSearchingOccupation(true);
        setStatusMessage(null);

        try {
            const { data, error } = await supabase.functions.invoke('search-occupations', {
                body: {
                    keyword: occupationQuery.trim(),
                    limit: 8,
                },
            });

            if (error) throw error;

            const searchData = data as SearchOccupationsResponse | null;
            const occupations = Array.isArray(searchData?.occupations)
                ? searchData.occupations
                : [];

            const normalized = occupations
                .map(normalizeOccupation)
                .filter(Boolean) as OccupationOption[];

            setOccupationResults(normalized);
            setStatusMessage(
                normalized.length > 0
                    ? `Found ${normalized.length} matching occupation${normalized.length === 1 ? '' : 's'}.`
                    : 'No matching occupations found. Try a broader title.'
            );
        } catch (error: unknown) {
            console.error('Occupation search failed:', error);
            setOccupationResults([]);
            toast({
                title: 'Occupation Search Failed',
                description: getErrorMessage(error, 'Unable to search occupations'),
                variant: 'destructive',
            });
        } finally {
            setSearchingOccupation(false);
        }
    };

    const selectOccupation = (occupation: OccupationOption) => {
        setClientOccupationCode(occupation.code);
        setClientOccupationTitle(occupation.title);
        setOccupationQuery(occupation.title);
        setOccupationResults([]);
        setDeliveryUrl(null);
        reportRequestKeyRef.current = null;
    };

    const saveWhiteLabelConfig = async () => {
        if (!session?.user?.id) {
            toast({
                title: 'Not Authenticated',
                description: 'Please log in to save configuration',
                variant: 'destructive'
            });
            return;
        }

        try {
            const { error } = await supabase
                .from('white_label_configs')
                .upsert({
                    user_id: session.user.id,
                    ...config
                });

            if (error) throw error;

            toast({
                title: 'Settings Saved',
                description: 'White-label configuration updated successfully'
            });
        } catch (error: unknown) {
            console.error('Error saving config:', error);
            toast({
                title: 'Save Error',
                description: getErrorMessage(error, 'Failed to save configuration'),
                variant: 'destructive'
            });
        }
    };

    const generateReport = async () => {
        if (!clientLabel || !clientOccupationCode) {
            toast({
                title: 'Missing Information',
                description: 'Please provide a client label and occupation code',
                variant: 'destructive'
            });
            return;
        }

        if (!session?.user?.id) {
            toast({
                title: 'Not Authenticated',
                description: 'Please log in to generate reports',
                variant: 'destructive'
            });
            return;
        }

        if (!humanReviewAcknowledged) {
            toast({
                title: 'Acknowledgement Required',
                description: 'You must acknowledge the human-review requirement before generating a report.',
                variant: 'destructive'
            });
            return;
        }

        setGenerating(true);
        setStatusMessage('Reserving credit and generating client report...');

        try {
            // Keep one key for this form request so a network retry cannot
            // reserve a second credit. A successful request clears the key.
            const idempotencyKey = reportRequestKeyRef.current || crypto.randomUUID();
            reportRequestKeyRef.current = idempotencyKey;

            // Server-side credit reservation + report generation (single call)
            const { data, error } = await supabase.functions.invoke('generate-counselor-report', {
                body: {
                    client_label: clientLabel,
                    occupation_code: clientOccupationCode,
                    idempotency_key: idempotencyKey,
                    human_review_acknowledgement: true
                }
            });

            if (error) throw error;

            const reportData = data as CounselorReportResponse | null;
            if (reportData?.success) {
                analytics.coachReportSucceeded();
                if (reportData.delivery_url) {
                    setDeliveryUrl(reportData.delivery_url);
                    setStatusMessage('Report generated. Open the short-lived private delivery link after review.');
                    reportRequestKeyRef.current = null;
                } else {
                    throw new Error('Report generated without a private delivery URL');
                }

                toast({
                    title: 'Report Generated',
                    description: reportData.metadata?.remaining_credits !== undefined
                        ? `Your client report is ready. ${reportData.metadata.remaining_credits} credits remaining.`
                        : 'Your client report is ready to download'
                });
            }
        } catch (error: unknown) {
            console.error('Error generating report:', error);
            setStatusMessage('Report generation failed. Retry this same request to preserve idempotency; a terminal conflict requires changing the inputs.');
            toast({
                title: 'Generation Error',
                description: getErrorMessage(error, 'Failed to generate report'),
                variant: 'destructive'
            });
        } finally {
            setGenerating(false);
        }
    };

    const downloadCohortProofPackHtml = () => {
        const pack = buildCareerCenterCohortProofPack();
        downloadTextFile(
            'career-center-cohort-proof-pack.html',
            renderCareerCenterCohortProofPackHtml(pack),
            'text/html;charset=utf-8'
        );
    };

    const downloadCohortProofPackCsv = () => {
        const pack = buildCareerCenterCohortProofPack();
        downloadTextFile(
            'career-center-cohort-proof-pack.csv',
            `${buildCareerCenterCohortCsv(pack)}\n`,
            'text/csv;charset=utf-8'
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
            </div>
        );
    }

    return (
        <main className="space-y-6">
            <h1 className="sr-only">Counselor Report Generator</h1>
            {/* Credit Balance */}
            <CreditBalance showBuyButton={true} />

            <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                    Reports are delivered as private, signed print-ready HTML links. Review every report before client delivery; checkout, hosted storage, and live credit evidence remain owner-gated until smoke-tested.
                </AlertDescription>
            </Alert>

            <Card data-career-center-cohort-pack="true">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Career Center Cohort Proof Pack
                    </CardTitle>
                    <CardDescription>
                        Aggregate-only sample for counselor review, workshop planning, and career-center pilot conversations.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <ShieldCheck className="h-4 w-4" />
                        <AlertDescription>
                            Cohort outputs must stay aggregate-only and advisor-reviewed. Do not include student names, IDs, resumes, or education-record PII; do not call this a placement-rate or first-destination outcome report.
                        </AlertDescription>
                    </Alert>
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-lg border p-3">
                            <div className="text-sm font-semibold">Evidence boundary</div>
                            <p className="mt-1 text-sm text-muted-foreground">FERPA-style privacy, NACE career readiness, local labor-market, and outcome caveats.</p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <div className="text-sm font-semibold">Review state</div>
                            <p className="mt-1 text-sm text-muted-foreground">Staff review required before institutional delivery or workshop use.</p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <div className="text-sm font-semibold">Does not prove</div>
                            <p className="mt-1 text-sm text-muted-foreground">No individual ranking, placement, salary, admission, or employment decision support.</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button type="button" variant="outline" onClick={downloadCohortProofPackHtml} className="flex-1">
                            <Download className="mr-2 h-4 w-4" />
                            Cohort HTML
                        </Button>
                        <Button type="button" variant="outline" onClick={downloadCohortProofPackCsv} className="flex-1">
                            <Download className="mr-2 h-4 w-4" />
                            Cohort CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-col md:flex-row gap-3">
                <Button type="button" variant="outline" onClick={() => window.open('/sample-report', '_blank')} className="flex-1">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Sample Report
                </Button>
                {!session?.user?.id && (
                    <Button type="button" onClick={() => window.location.href = '/auth'} className="flex-1">
                        Sign In To Generate Reports
                    </Button>
                )}
            </div>

            {/* White-Label Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        White-Label Settings
                    </CardTitle>
                    <CardDescription>
                        Customize reports with your branding
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                                id="companyName"
                                value={config.company_name}
                                onChange={(e) => setConfig({ ...config, company_name: e.target.value })}
                                placeholder="Your Company Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">Contact Email</Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                value={config.contact_email || ''}
                                onChange={(e) => setConfig({ ...config, contact_email: e.target.value })}
                                placeholder="[email protected]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">Contact Phone</Label>
                            <Input
                                id="contactPhone"
                                value={config.contact_phone || ''}
                                onChange={(e) => setConfig({ ...config, contact_phone: e.target.value })}
                                placeholder="+1 (555) 123-4567"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Website URL</Label>
                            <Input
                                id="website"
                                type="url"
                                value={config.website_url || ''}
                                onChange={(e) => setConfig({ ...config, website_url: e.target.value })}
                                placeholder="https://yourwebsite.com"
                            />
                        </div>
                    </div>

                    {/* Color Pickers */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Brand Colors
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="primaryColor" className="text-sm">Primary Color</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="primaryColor"
                                        type="color"
                                        value={config.primary_color}
                                        onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                                        className="w-20 h-10 cursor-pointer"
                                    />
                                    <Input
                                        value={config.primary_color}
                                        onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                                        placeholder="#3b82f6"
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="secondaryColor" className="text-sm">Secondary Color</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="secondaryColor"
                                        type="color"
                                        value={config.secondary_color}
                                        onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                                        className="w-20 h-10 cursor-pointer"
                                    />
                                    <Input
                                        value={config.secondary_color}
                                        onChange={(e) => setConfig({ ...config, secondary_color: e.target.value })}
                                        placeholder="#8b5cf6"
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Text */}
                    <div className="space-y-2">
                        <Label htmlFor="footerText">Custom Footer Text (Optional)</Label>
                        <Textarea
                            id="footerText"
                            value={config.report_footer_text || ''}
                            onChange={(e) => setConfig({ ...config, report_footer_text: e.target.value })}
                            placeholder="Additional information to include in report footer"
                            rows={2}
                        />
                    </div>

                    {/* APO Branding Toggle */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                            <Label htmlFor="apoBranding">Include APO Dashboard Branding</Label>
                            <p className="text-sm text-muted-foreground">
                                Show "Powered by APO Dashboard" in report footer
                            </p>
                        </div>
                        <Switch
                            id="apoBranding"
                            checked={config.include_apo_branding}
                            onCheckedChange={(checked) => setConfig({ ...config, include_apo_branding: checked })}
                        />
                    </div>

                    <Button onClick={saveWhiteLabelConfig} variant="outline" className="w-full">
                        Save Settings
                    </Button>
                </CardContent>
            </Card>

            {/* Report Generation */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Generate Client Report
                    </CardTitle>
                    <CardDescription>
                        Create a professional career analysis report for your client
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="clientLabel">Client Label (pseudonymous)</Label>
                            <Input
                                id="clientLabel"
                                value={clientLabel}
                                onChange={(e) => {
                                    setClientLabel(e.target.value);
                                    setDeliveryUrl(null);
                                    reportRequestKeyRef.current = null;
                                }}
                                placeholder="Client A, Transitioning Professional, etc."
                            />
                            <p className="text-xs text-muted-foreground">Use a pseudonymous label, not a real client name.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="clientOccupationSearch">Client Occupation</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="clientOccupationSearch"
                                    value={occupationQuery}
                                    onChange={(e) => setOccupationQuery(e.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') searchOccupations();
                                    }}
                                    placeholder="Search occupation title"
                                    disabled={searchingOccupation || generating}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={searchOccupations}
                                    disabled={searchingOccupation || generating}
                                >
                                    {searchingOccupation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    <span className="sr-only">Search occupation</span>
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {REPORT_EXAMPLES.map(example => (
                            <Button
                                key={example.code}
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => selectOccupation(example)}
                                disabled={generating}
                            >
                                {example.title}
                            </Button>
                        ))}
                    </div>

                    {occupationResults.length > 0 && (
                        <div className="grid gap-2">
                            {occupationResults.map(occupation => (
                                <button
                                    key={occupation.code}
                                    type="button"
                                    className="text-left rounded-lg border p-3 hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 transition-colors"
                                    onClick={() => selectOccupation(occupation)}
                                    disabled={generating}
                                >
                                    <div className="font-medium">{occupation.title}</div>
                                    <div className="text-xs text-muted-foreground">{occupation.code}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {clientOccupationCode && (
                        <div className="rounded-lg border bg-[var(--bg-secondary)] p-3 flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{clientOccupationCode}</Badge>
                            <span className="font-medium">{clientOccupationTitle || clientOccupationCode}</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="clientOccupation">Manual SOC Code</Label>
                        <Input
                            id="clientOccupation"
                            value={clientOccupationCode}
                            onChange={(e) => {
                                setClientOccupationCode(e.target.value);
                                setClientOccupationTitle(e.target.value);
                                setDeliveryUrl(null);
                                reportRequestKeyRef.current = null;
                            }}
                            placeholder="15-1252.00"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                            <Label htmlFor="humanReview">Human Review Acknowledgement</Label>
                            <p className="text-sm text-muted-foreground">
                                I understand this is a planning artifact for human review, not for employment decisions.
                            </p>
                        </div>
                        <Switch
                            id="humanReview"
                            checked={humanReviewAcknowledged}
                            onCheckedChange={setHumanReviewAcknowledged}
                        />
                    </div>

                    {statusMessage && (
                        <p className="text-sm text-muted-foreground">{statusMessage}</p>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={generateReport}
                            disabled={generating || !session?.user?.id || !clientOccupationCode || !clientLabel || !humanReviewAcknowledged}
                            className="flex-1"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating Report...
                                </>
                            ) : (
                                <>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Generate Report
                                </>
                            )}
                        </Button>

                    </div>
                    {deliveryUrl && (
                        <Alert>
                            <ExternalLink className="h-4 w-4" />
                            <AlertDescription>
                                <a className="underline" href={deliveryUrl} target="_blank" rel="noopener noreferrer">
                                    Open private report delivery link
                                </a>
                                <span className="ml-2 text-xs text-muted-foreground">The link expires after 60 seconds.</span>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
