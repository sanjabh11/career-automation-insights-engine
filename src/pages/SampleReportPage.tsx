import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Brain,
  ShieldCheck,
  ShieldX,
  Zap,
  ArrowRight,
  Download,
  Mail,
  Building2,
  FileText,
  Users,
  Star,
  Palette
} from 'lucide-react';
import { occupationRiskData, occupationSlugs, type OccupationRiskData } from '@/data/occupationRiskData';
import { captureCommercialLead, type CommercialLeadResult } from '@/lib/commercialLeads';
import { trackEvent } from '@/lib/posthog';
import {
  REPORT_TRUST_NOTICES,
  getActiveReportSourceVersionSummary,
  getReportProvenanceCss,
  renderReportProvenanceHtml,
} from '@/lib/reportProvenance';
import {
  buildOccupationTransitionProofPack,
  getTransitionProofPackCss,
  getTransitionProofPackReviewMetadata,
  renderTransitionProofPackHtml,
} from '@/lib/workTransitionProofPack';
import { useToast } from '@/hooks/use-toast';

interface CoachSampleBrandConfig {
  companyName: string;
  primaryColor: string;
  accentColor: string;
  contactEmail: string;
  websiteUrl: string;
  reportFooterText: string;
  consentToContact: boolean;
  includePlatformBranding: boolean;
}

const COACH_SAMPLE_BRAND_STORAGE_KEY = 'coach_sample_report_brand_config';

const DEFAULT_COACH_SAMPLE_BRAND: CoachSampleBrandConfig = {
  companyName: '',
  primaryColor: '#2563eb',
  accentColor: '#10b981',
  contactEmail: '',
  websiteUrl: '',
  reportFooterText: '',
  consentToContact: false,
  includePlatformBranding: true,
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeColor(value: string, fallback: string): string {
  return /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim() : fallback;
}

function normalizeWebsiteUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function resolveBrandConfig(config: CoachSampleBrandConfig): CoachSampleBrandConfig {
  return {
    companyName: config.companyName.trim().slice(0, 80),
    primaryColor: normalizeColor(config.primaryColor, DEFAULT_COACH_SAMPLE_BRAND.primaryColor),
    accentColor: normalizeColor(config.accentColor, DEFAULT_COACH_SAMPLE_BRAND.accentColor),
    contactEmail: config.contactEmail.trim().slice(0, 120),
    websiteUrl: normalizeWebsiteUrl(config.websiteUrl).slice(0, 180),
    reportFooterText: config.reportFooterText.trim().slice(0, 240),
    consentToContact: config.consentToContact === true,
    includePlatformBranding: config.includePlatformBranding,
  };
}

function getRiskColor(risk: number): string {
  if (risk <= 30) return 'text-emerald-500';
  if (risk <= 60) return 'text-amber-500';
  return 'text-red-500';
}

interface GeneratedSampleReportPayload {
  html: string;
  proofPackReviewWorkflow: Record<string, unknown>;
}

function generateSampleReportPayload(
  data: OccupationRiskData,
  brandConfig: CoachSampleBrandConfig
): GeneratedSampleReportPayload {
  const riskLevel = data.overallRisk <= 30 ? 'Low' : data.overallRisk <= 60 ? 'Medium' : 'High';
  const riskColor = data.overallRisk <= 30 ? '#10b981' : data.overallRisk <= 60 ? '#f59e0b' : '#ef4444';
  const generatedAt = new Date();
  const proofPack = buildOccupationTransitionProofPack(data, 'coach', generatedAt);
  const config = resolveBrandConfig(brandConfig);
  const brand = escapeHtml(config.companyName || 'Automation Insights');
  const primaryColor = config.primaryColor;
  const accentColor = config.accentColor;
  const contactEmail = config.contactEmail && isValidEmail(config.contactEmail) ? escapeHtml(config.contactEmail) : '';
  const websiteUrl = config.websiteUrl;
  const websiteDisplay = websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const contactBlock = contactEmail || websiteUrl
    ? `<div class="contact-strip">
        ${contactEmail ? `<span>Email: <a href="mailto:${contactEmail}">${contactEmail}</a></span>` : ''}
        ${websiteUrl ? `<span>Website: <a href="${escapeHtml(websiteUrl)}">${escapeHtml(websiteDisplay)}</a></span>` : ''}
      </div>`
    : '';
  const footerText = config.reportFooterText
    ? `<p style="margin-top:4px;">${escapeHtml(config.reportFooterText)}</p>`
    : '';
  const platformBranding = config.includePlatformBranding
    ? `<p style="margin-top:4px;">Powered by <a href="https://automationinsights.app" style="color:${accentColor};text-decoration:none;">Automation Insights</a></p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(data.title)} - AI Career Resilience Report | ${brand}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 26px; margin-bottom: 4px; }
    h2 { font-size: 18px; margin: 28px 0 12px; border-bottom: 2px solid ${primaryColor}; padding-bottom: 6px; }
    .header { text-align: center; margin-bottom: 36px; padding-bottom: 20px; border-bottom: 3px solid ${primaryColor}; }
    .header .brand { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; margin-bottom: 12px; }
    .header .subtitle { color: #64748b; font-size: 13px; margin-top: 4px; }
    .score-box { background: #f8fafc; border: 2px solid ${riskColor}; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .score-value { font-size: 44px; font-weight: 800; color: ${riskColor}; }
    .score-label { color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
    .badge { display: inline-block; background: ${riskColor}; color: white; padding: 3px 14px; border-radius: 20px; font-weight: 600; font-size: 13px; margin-top: 6px; }
    .stats { display: flex; gap: 12px; margin: 20px 0; }
    .stat { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
    .stat-value { font-size: 18px; font-weight: 700; }
    .stat-label { font-size: 11px; color: #64748b; margin-top: 2px; }
    .task-list { list-style: none; padding: 0; }
    .task-list li { padding: 8px 14px; margin: 4px 0; border-radius: 6px; font-size: 13px; }
    .task-risk { background: #fef2f2; border-left: 3px solid #ef4444; }
    .task-safe { background: #f0fdf4; border-left: 3px solid #10b981; }
    .task-reskill { background: #eff6ff; border-left: 3px solid ${primaryColor}; }
    .bridge { background: #f0fdf4; border: 2px solid #10b981; border-radius: 10px; padding: 16px; margin: 12px 0; }
    .bridge-title { font-weight: 700; color: #10b981; margin-bottom: 2px; }
    .cta { background: linear-gradient(135deg, #0f172a, #1e293b); color: white; border-radius: 12px; padding: 24px; text-align: center; margin-top: 32px; }
    .cta h3 { font-size: 18px; margin-bottom: 8px; }
    .cta p { font-size: 13px; color: #94a3b8; margin-bottom: 12px; }
    .cta a { display: inline-block; background: ${accentColor}; color: #0f172a; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; }
    .contact-strip { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; margin-top: 14px; color: #475569; font-size: 12px; }
    .contact-strip a { color: ${primaryColor}; text-decoration: none; }
    .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; }
    .sample-watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; color: rgba(0,0,0,0.03); font-weight: 900; letter-spacing: 8px; pointer-events: none; z-index: 0; }
    ${getReportProvenanceCss()}
    ${getTransitionProofPackCss()}
    @media print { body { padding: 20px; } .no-print { display: none; } .sample-watermark { display: none; } }
  </style>
</head>
<body>
  <div class="sample-watermark">SAMPLE</div>

  <div class="header">
    <div class="brand">${brand}</div>
    <h1>AI Career Resilience Report</h1>
    <div class="subtitle">${escapeHtml(data.title)} (SOC: ${escapeHtml(data.code)})</div>
    <div class="subtitle">Generated ${generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    ${contactBlock}
  </div>

  <div class="score-box">
    <div class="score-label">Overall Automation Risk</div>
    <div class="score-value">${data.overallRisk}%</div>
    <div class="badge">${riskLevel} Risk</div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-value">${escapeHtml(data.averageSalary)}</div><div class="stat-label">Average Salary</div></div>
    <div class="stat"><div class="stat-value">${escapeHtml(data.jobGrowth)}</div><div class="stat-label">Growth (10yr)</div></div>
    <div class="stat"><div class="stat-value">${escapeHtml(data.industry)}</div><div class="stat-label">Industry</div></div>
  </div>

  <h2>Tasks at Highest Automation Risk</h2>
  <ul class="task-list">${data.highRiskTasks.map(t => `<li class="task-risk">${escapeHtml(t)}</li>`).join('')}</ul>

  <h2>Skills That Remain Human</h2>
  <ul class="task-list">${data.safeSkills.map(s => `<li class="task-safe">${escapeHtml(s)}</li>`).join('')}</ul>

  <h2>Recommended Reskilling Paths</h2>
  <ul class="task-list">${data.reskillingSuggestions.map(r => `<li class="task-reskill">${escapeHtml(r)}</li>`).join('')}</ul>

  <h2>Bridge Role Recommendation</h2>
  <div class="bridge">
    <div class="bridge-title">${escapeHtml(data.bridgeRole)}</div>
    <div style="font-size:13px;">Automation Risk: ${data.bridgeRoleRisk}% - ${data.bridgeRoleRisk <= 30 ? 'Significantly safer' : 'Lower risk'} than ${escapeHtml(data.title)}</div>
  </div>

  <div class="cta no-print">
    <h3>This is a Sample Report</h3>
    <p>The full report can include task-level AI analysis, skill gap mapping, and reskilling timelines after source refresh, human review, and client context validation.</p>
    <a href="https://automationinsights.app/for-coaches">Get Coach Pro → White-label this for your clients</a>
  </div>

  ${renderTransitionProofPackHtml(proofPack)}

  ${renderReportProvenanceHtml({
    title: 'Coach Sample Source Provenance',
    context: 'This sample is designed for outreach and coach-client discussion. It should be used as a pilot artifact until the production data-refresh and review workflow is active.',
  })}

  <div class="footer">
    <p>Source registry: O*NET, BLS/OEWS, WEF 2025, ESCO-ready, Lightcast-ready, SerpAPI-ready, and LLM-output caveats.</p>
    ${footerText}
    ${platformBranding}
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  return {
    html,
    proofPackReviewWorkflow: getTransitionProofPackReviewMetadata(proofPack),
  };
}

export default function SampleReportPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [brandConfig, setBrandConfig] = useState<CoachSampleBrandConfig>(DEFAULT_COACH_SAMPLE_BRAND);
  const [isSavingArtifact, setIsSavingArtifact] = useState(false);
  const [leadStatus, setLeadStatus] = useState<CommercialLeadResult | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = window.localStorage.getItem(COACH_SAMPLE_BRAND_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<CoachSampleBrandConfig>;
      setBrandConfig((current) => resolveBrandConfig({ ...current, ...parsed }));
    } catch (error) {
      console.warn('Unable to load saved coach sample branding:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(COACH_SAMPLE_BRAND_STORAGE_KEY, JSON.stringify(resolveBrandConfig(brandConfig)));
    } catch (error) {
      console.warn('Unable to save coach sample branding:', error);
    }
  }, [brandConfig]);

  const filteredOccupations = useMemo(() => {
    if (!searchQuery.trim()) return occupationSlugs.slice(0, 12);
    const q = searchQuery.toLowerCase();
    return occupationSlugs.filter(slug => {
      const data = occupationRiskData[slug];
      return data && (
        data.title.toLowerCase().includes(q) ||
        data.industry.toLowerCase().includes(q) ||
        data.code.includes(q)
      );
    }).slice(0, 12);
  }, [searchQuery]);

	  const selectedData = selectedSlug ? occupationRiskData[selectedSlug] : null;
	  const resolvedBrandConfig = resolveBrandConfig(brandConfig);
	  const coachConsentText =
	    'I agree to save this branded sample report and be contacted about coach pilot opportunities.';
	  const captureConsentMissing = !!resolvedBrandConfig.contactEmail && !resolvedBrandConfig.consentToContact;

  const updateBrandConfig = <Key extends keyof CoachSampleBrandConfig>(
    key: Key,
    value: CoachSampleBrandConfig[Key]
  ) => {
    setLeadStatus(null);
    setBrandConfig((current) => ({ ...current, [key]: value }));
  };

  const handleGenerateReport = async () => {
    if (!selectedData || !selectedSlug) return;

	    if (resolvedBrandConfig.contactEmail && !isValidEmail(resolvedBrandConfig.contactEmail)) {
	      toast({
	        title: 'Check contact email',
	        description: 'Use a valid email address before saving a coach sample artifact.',
        variant: 'destructive',
      });
	      return;
	    }

	    if (resolvedBrandConfig.contactEmail && !resolvedBrandConfig.consentToContact) {
	      toast({
	        title: 'Consent required',
	        description: 'Confirm the contact consent before saving this coach sample artifact.',
	        variant: 'destructive',
	      });
	      return;
	    }

    trackEvent('sample_report_generated', {
      occupation: selectedData.title,
      slug: selectedSlug,
      branded: !!resolvedBrandConfig.companyName,
      artifact_capture_requested: !!resolvedBrandConfig.contactEmail,
    });
    trackEvent('activation_proof_artifact_created', {
      artifact_type: 'coach-sample-report',
      buyer_segment: 'career-coach',
      branded: !!resolvedBrandConfig.companyName,
    });
    const reportPayload = generateSampleReportPayload(selectedData, resolvedBrandConfig);
    const win = window.open('', '_blank');
    if (win) {
      win.document.open('text/html');
      win.document.write(reportPayload.html);
      win.document.close();
    }

    if (!resolvedBrandConfig.contactEmail) {
      setLeadStatus(null);
      return;
    }

    setIsSavingArtifact(true);
    try {
      const result = await captureCommercialLead({
        email: resolvedBrandConfig.contactEmail,
        source: 'coach-sample-report',
        buyerSegment: 'career-coach',
        reportType: 'coach-sample-report',
        occupationSlug: selectedSlug,
        occupationTitle: selectedData.title,
	        riskScore: selectedData.overallRisk,
	        reportHtml: reportPayload.html,
	        consentToContact: resolvedBrandConfig.consentToContact,
	        consentText: coachConsentText,
	        metadata: {
          soc_code: selectedData.code,
          coach_brand_name: resolvedBrandConfig.companyName || 'Automation Insights',
          brand_primary_color: resolvedBrandConfig.primaryColor,
          brand_accent_color: resolvedBrandConfig.accentColor,
          website_url: resolvedBrandConfig.websiteUrl || null,
          include_platform_branding: resolvedBrandConfig.includePlatformBranding,
          sample_report: true,
          proof_pack_review_workflow: reportPayload.proofPackReviewWorkflow,
        },
      });
      setLeadStatus(result);
      toast({
        title: result.persisted ? 'Sample artifact saved' : 'Sample artifact queued',
        description: result.persisted
          ? 'The coach lead and report artifact are available in lead ops.'
          : 'Supabase was unavailable, so the lead was queued locally for retry.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save the sample artifact.';
      toast({
        title: 'Artifact capture failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingArtifact(false);
    }
  };

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            <FileText className="h-3 w-3 mr-1" /> Free Sample Report
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Generate a Free AI Career Report
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            See exactly what your clients receive. Pick any occupation, preview the report, save as PDF.
          </p>
          <p className="text-sm text-muted-foreground">
            Career coaches: <strong>add your brand name</strong> below to preview white-labeled output.
          </p>
        </div>
      </section>

      {/* Search + Brand */}
      <section className="container mx-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search occupations (e.g. Accountant, Nurse, Developer...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base"
            />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Coach Branding
              </CardTitle>
              <CardDescription>
                Settings are saved in this browser and reflected in the generated sample artifact.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coachBrandName">Brand name</Label>
                  <Input
                    id="coachBrandName"
                    placeholder="Your practice or firm name"
                    value={brandConfig.companyName}
                    onChange={(e) => updateBrandConfig('companyName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coachContactEmail">Contact email</Label>
                  <Input
                    id="coachContactEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={brandConfig.contactEmail}
                    onChange={(e) => updateBrandConfig('contactEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coachWebsite">Website</Label>
                  <Input
                    id="coachWebsite"
                    type="url"
                    placeholder="https://yourpractice.com"
                    value={brandConfig.websiteUrl}
                    onChange={(e) => updateBrandConfig('websiteUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2" htmlFor="coachPrimaryColor">
                    <Palette className="h-4 w-4" />
                    Brand colors
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      id="coachPrimaryColor"
                      aria-label="Primary brand color"
                      type="color"
                      value={brandConfig.primaryColor}
                      onChange={(e) => updateBrandConfig('primaryColor', e.target.value)}
                      className="h-10 cursor-pointer"
                    />
                    <Input
                      aria-label="Accent brand color"
                      type="color"
                      value={brandConfig.accentColor}
                      onChange={(e) => updateBrandConfig('accentColor', e.target.value)}
                      className="h-10 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

	              <div className="space-y-2">
	                <Label htmlFor="coachFooterText">Footer note</Label>
	                <Textarea
                  id="coachFooterText"
                  rows={2}
                  placeholder="Optional client-facing note, booking link context, or consultation language"
                  value={brandConfig.reportFooterText}
                  onChange={(e) => updateBrandConfig('reportFooterText', e.target.value)}
	                />
	              </div>

	              <div className="flex items-start gap-2 rounded-md border bg-background/70 p-3">
	                <Checkbox
	                  id="coachSampleConsent"
	                  checked={brandConfig.consentToContact}
	                  onCheckedChange={(checked) => updateBrandConfig('consentToContact', checked === true)}
	                  aria-label="Consent to save sample report and be contacted"
	                />
	                <Label htmlFor="coachSampleConsent" className="text-xs font-normal leading-relaxed text-muted-foreground">
	                  {coachConsentText} See the{' '}
	                  <Link to="/privacy" className="underline underline-offset-2">
	                    privacy policy
	                  </Link>
	                  . This consent is saved with the report artifact only when a contact email is provided.
	                </Label>
	              </div>

	              <div className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Label htmlFor="includePlatformBranding">Platform attribution</Label>
                  <p className="text-xs text-muted-foreground">
                    Keep a small Automation Insights footer for pilot transparency.
                  </p>
                </div>
                <Switch
                  id="includePlatformBranding"
                  checked={brandConfig.includePlatformBranding}
                  onCheckedChange={(checked) => updateBrandConfig('includePlatformBranding', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Occupation Grid */}
      <section className="container mx-auto px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredOccupations.map((slug) => {
              const data = occupationRiskData[slug];
              if (!data) return null;
              const isSelected = slug === selectedSlug;
              return (
                <button
                  key={slug}
                  onClick={() => setSelectedSlug(isSelected ? null : slug)}
                  className={`text-left p-4 bg-card border rounded-lg transition-all ${
                    isSelected ? 'ring-2 ring-[var(--accent-primary)] border-[var(--accent-primary)]' : 'hover:border-primary/50'
                  }`}
                >
                  <div className="font-semibold text-sm">{data.title}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{data.industry}</span>
                    <span className={`text-sm font-bold ${getRiskColor(data.overallRisk)}`}>{data.overallRisk}%</span>
                  </div>
                  {isSelected && (
                    <Badge className="mt-2 bg-[var(--accent-primary)] text-xs">Selected</Badge>
                  )}
                </button>
              );
            })}
          </div>
          {filteredOccupations.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No occupations match your search. Try another term.</p>
          )}
        </div>
      </section>

      {/* Selected Occupation Preview + Generate */}
      {selectedData && selectedSlug && (
        <section className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <Card className="border-[var(--accent-primary)]/30">
              <CardHeader className="pb-3">
	                <CardTitle className="text-lg flex items-center gap-2">
	                  <Brain className="h-5 w-5 text-primary" />
	                  {selectedData.title} - Report Preview
	                </CardTitle>
	                <CardDescription>
	                  {resolvedBrandConfig.companyName
	                    ? `Branded as "${resolvedBrandConfig.companyName}"`
	                    : 'Default Automation Insights branding'}
	                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-card border rounded-lg">
                    <div className={`text-xl font-bold ${getRiskColor(selectedData.overallRisk)}`}>{selectedData.overallRisk}%</div>
                    <div className="text-xs text-muted-foreground">Risk Score</div>
                  </div>
                  <div className="text-center p-3 bg-card border rounded-lg">
                    <div className="text-sm font-bold">{selectedData.averageSalary}</div>
                    <div className="text-xs text-muted-foreground">Avg Salary</div>
                  </div>
                  <div className="text-center p-3 bg-card border rounded-lg">
                    <div className="text-sm font-bold">{selectedData.jobGrowth}</div>
                    <div className="text-xs text-muted-foreground">Growth</div>
                  </div>
                </div>

                {/* Key Points */}
                <div className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <ShieldX className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span><strong>{selectedData.highRiskTasks.length}</strong> at-risk tasks identified</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span><strong>{selectedData.safeSkills.length}</strong> resilient human skills</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Bridge role: <strong className="text-emerald-500">{selectedData.bridgeRole}</strong> ({selectedData.bridgeRoleRisk}% risk)</span>
                  </div>
                </div>

                <div className="rounded-lg border bg-slate-50 p-4 text-xs text-slate-700">
                  <div className="font-semibold mb-2">Source and trust boundary</div>
                  <p className="mb-2">
                    Active report sources: {getActiveReportSourceVersionSummary()}.
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    {REPORT_TRUST_NOTICES.slice(0, 2).map((notice) => (
                      <li key={notice}>{notice}</li>
                    ))}
                  </ul>
                </div>

	                {leadStatus && (
	                  <div className="rounded-lg border bg-emerald-50 p-3 text-xs text-emerald-900">
	                    {leadStatus.persisted
	                      ? 'Saved to Supabase lead ops.'
	                      : 'Queued locally because Supabase was unavailable.'}
	                    {leadStatus.artifactId && (
	                      <span className="ml-1">Artifact: {leadStatus.artifactId.slice(0, 8)}</span>
	                    )}
	                    {leadStatus.artifactError && (
	                      <span className="ml-1">Artifact warning: {leadStatus.artifactError}</span>
	                    )}
	                  </div>
	                )}

	                <Button
	                  onClick={() => void handleGenerateReport()}
	                  className="w-full"
	                  size="lg"
		                  disabled={isSavingArtifact || captureConsentMissing}
	                >
	                  <Download className="mr-2 h-4 w-4" />
	                  {isSavingArtifact ? 'Saving artifact' : 'Generate Sample Report (PDF)'}
	                </Button>
	                <p className="text-xs text-muted-foreground text-center">
	                  Opens in a new tab. Use File - Print - Save as PDF. Includes "SAMPLE" watermark.
	                  Add a contact email to save the lead and artifact to Supabase.
	                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Value Props */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">What Coaches Get with Coach Pro</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 text-center">
                <Star className="h-8 w-8 text-[var(--accent-primary)] mx-auto mb-3" />
                <h3 className="font-bold mb-1">White-Label Branding</h3>
                <p className="text-xs text-muted-foreground">Your logo, colors, and domain. No "Powered by" footer if you prefer.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <Brain className="h-8 w-8 text-[var(--accent-primary)] mx-auto mb-3" />
                <h3 className="font-bold mb-1">Source-Grounded Analysis</h3>
                <p className="text-xs text-muted-foreground">Reports show source versions, caveats, confidence, and LLM review boundaries.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <Users className="h-8 w-8 text-[var(--accent-primary)] mx-auto mb-3" />
                <h3 className="font-bold mb-1">Pilot-Ready Artifacts</h3>
                <p className="text-xs text-muted-foreground">Use bounded sample reports for paid discovery calls, workshops, and coach-client pilots.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-8 pb-16">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-bold mb-2">Ready to Offer AI Career Intelligence?</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Join career coaches already generating white-labeled reports for their clients.
                Start with Pay-As-You-Go at $10/report — no subscription required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/for-coaches">
                  <Button size="lg">
                    Get Coach Pro
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    Try Free First
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
