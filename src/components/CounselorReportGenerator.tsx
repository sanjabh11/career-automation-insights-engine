import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Settings, Download, Palette, Search, ShieldCheck, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/hooks/useSession';
import { CreditBalance } from '@/components/monetization/CreditBalance';

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

function normalizeOccupation(item: any): OccupationOption | null {
    const code = item?.occupation_code || item?.code || item?.onetsoc_code;
    const title = item?.occupation_title || item?.title || item?.name;
    if (!code || !title) return null;

    return {
        code,
        title,
        description: item?.description || item?.summary || 'O*NET occupation profile',
    };
}

export default function CounselorReportGenerator() {
    const [config, setConfig] = useState<WhiteLabelConfig>({
        company_name: '',
        primary_color: '#3b82f6',
        secondary_color: '#8b5cf6',
        include_apo_branding: true
    });
    const [clientName, setClientName] = useState('');
    const [clientOccupationCode, setClientOccupationCode] = useState('');
    const [clientOccupationTitle, setClientOccupationTitle] = useState('');
    const [occupationQuery, setOccupationQuery] = useState('');
    const [occupationResults, setOccupationResults] = useState<OccupationOption[]>([]);
    const [searchingOccupation, setSearchingOccupation] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reportHtml, setReportHtml] = useState<string | null>(null);
    const [reportId, setReportId] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const { toast } = useToast();
    const { session } = useSession();

    useEffect(() => {
        loadWhiteLabelConfig();
    }, [session?.user?.id]);

    const loadWhiteLabelConfig = async () => {
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
    };

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

            const occupations = Array.isArray((data as any)?.occupations)
                ? (data as any).occupations
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
        } catch (error: any) {
            console.error('Occupation search failed:', error);
            setOccupationResults([]);
            toast({
                title: 'Occupation Search Failed',
                description: error.message || 'Unable to search occupations',
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
        setReportHtml(null);
        setReportId(null);
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
        } catch (error: any) {
            console.error('Error saving config:', error);
            toast({
                title: 'Save Error',
                description: error.message || 'Failed to save configuration',
                variant: 'destructive'
            });
        }
    };

    const generateReport = async () => {
        if (!clientName || !clientOccupationCode) {
            toast({
                title: 'Missing Information',
                description: 'Please provide client name and occupation code',
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

        setGenerating(true);
        setStatusMessage('Checking report credit and generating client report...');

        try {
            // Deduct credit before generating report
            const { data: creditResult, error: creditError } = await supabase.rpc('deduct_report_credit', {
                p_user_id: session.user.id,
                p_report_type: 'counselor_report',
                p_occupation_code: clientOccupationCode
            });

            if (creditError) {
                console.error('Credit deduction error:', creditError);
                toast({
                    title: 'Credit Error',
                    description: 'Unable to verify credits. Please try again.',
                    variant: 'destructive'
                });
                setGenerating(false);
                return;
            }

            if (!creditResult) {
                toast({
                    title: 'Insufficient Credits',
                    description: 'You need report credits to generate reports. Please purchase more credits.',
                    variant: 'destructive'
                });
                setGenerating(false);
                return;
            }

            // Credit deducted successfully, now generate report
            const { data, error } = await supabase.functions.invoke('generate-counselor-report', {
                body: {
                    client_name: clientName,
                    client_occupation_code: clientOccupationCode,
                    counselor_id: session.user.id
                }
            });

            if (error) throw error;

            if (data && data.success) {
                setReportHtml(data.html);
                setReportId(data.report_id || null);
                setStatusMessage('Report generated. Use preview and print/save as PDF before sending to a client.');

                toast({
                    title: 'Report Generated',
                    description: 'Your client report is ready to download'
                });

                // Auto-download or open in new window
                const blob = new Blob([data.html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${clientName.replace(/\s+/g, '_')}_Career_Report.html`;
                link.click();
                URL.revokeObjectURL(url);
            }
        } catch (error: any) {
            console.error('Error generating report:', error);
            setStatusMessage('Report generation failed. If credit was deducted, verify the credit ledger before retrying.');
            toast({
                title: 'Generation Error',
                description: error.message || 'Failed to generate report',
                variant: 'destructive'
            });
        } finally {
            setGenerating(false);
        }
    };

    const printReport = () => {
        if (!reportHtml) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(reportHtml);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Credit Balance */}
            <CreditBalance showBuyButton={true} />

            <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertDescription>
                    Status: report generation is source-implemented but remains partially usable until auth, report credits, and the print-to-PDF handoff are smoke-tested. Use the sample report for buyer demos before relying on live client credits.
                </AlertDescription>
            </Alert>

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
                            <Label htmlFor="clientName">Client Name</Label>
                            <Input
                                id="clientName"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="John Doe"
                            />
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
                                setReportHtml(null);
                                setReportId(null);
                            }}
                            placeholder="15-1252.00"
                        />
                    </div>

                    {statusMessage && (
                        <p className="text-sm text-muted-foreground">{statusMessage}</p>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={generateReport}
                            disabled={generating || !session?.user?.id || !clientOccupationCode || !clientName}
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

                        {reportHtml && (
                            <Button
                                onClick={printReport}
                                variant="outline"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Print/Save as PDF
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Preview (if report generated) */}
            {reportHtml && (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <CardTitle>Report Preview</CardTitle>
                            {reportId && <Badge variant="outline">Report ID: {reportId}</Badge>}
                        </div>
                        <CardDescription>
                            Review before sharing with client
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg p-4 bg-[var(--bg-tertiary)] max-h-96 overflow-auto">
                            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reportHtml) }} />
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
