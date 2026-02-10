import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Brain,
  ShieldCheck,
  ShieldX,
  Zap,
  ArrowRight,
  Download,
  Mail,
  Briefcase,
  TrendingUp,
  Building2,
  FileText,
  Users,
  Star
} from 'lucide-react';
import { occupationRiskData, occupationSlugs, type OccupationRiskData } from '@/data/occupationRiskData';
import { trackEvent } from '@/lib/posthog';

function getRiskColor(risk: number): string {
  if (risk <= 30) return 'text-emerald-500';
  if (risk <= 60) return 'text-amber-500';
  return 'text-red-500';
}

function getRiskLabel(risk: number): string {
  if (risk <= 30) return 'Low Risk';
  if (risk <= 60) return 'Medium Risk';
  return 'High Risk';
}

function generateSampleReportHTML(data: OccupationRiskData, brandName?: string): string {
  const riskLevel = data.overallRisk <= 30 ? 'Low' : data.overallRisk <= 60 ? 'Medium' : 'High';
  const riskColor = data.overallRisk <= 30 ? '#10b981' : data.overallRisk <= 60 ? '#f59e0b' : '#ef4444';
  const brand = brandName || 'Automation Insights';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${data.title} — AI Career Resilience Report | ${brand}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 26px; margin-bottom: 4px; }
    h2 { font-size: 18px; margin: 28px 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; }
    .header { text-align: center; margin-bottom: 36px; padding-bottom: 20px; border-bottom: 3px solid ${riskColor}; }
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
    .task-reskill { background: #eff6ff; border-left: 3px solid #3b82f6; }
    .bridge { background: #f0fdf4; border: 2px solid #10b981; border-radius: 10px; padding: 16px; margin: 12px 0; }
    .bridge-title { font-weight: 700; color: #10b981; margin-bottom: 2px; }
    .cta { background: linear-gradient(135deg, #0f172a, #1e293b); color: white; border-radius: 12px; padding: 24px; text-align: center; margin-top: 32px; }
    .cta h3 { font-size: 18px; margin-bottom: 8px; }
    .cta p { font-size: 13px; color: #94a3b8; margin-bottom: 12px; }
    .cta a { display: inline-block; background: #2dd4a8; color: #0f172a; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; }
    .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 11px; }
    .sample-watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; color: rgba(0,0,0,0.03); font-weight: 900; letter-spacing: 8px; pointer-events: none; z-index: 0; }
    @media print { body { padding: 20px; } .no-print { display: none; } .sample-watermark { display: none; } }
  </style>
</head>
<body>
  <div class="sample-watermark">SAMPLE</div>

  <div class="header">
    <div class="brand">${brand}</div>
    <h1>AI Career Resilience Report</h1>
    <div class="subtitle">${data.title} (SOC: ${data.code})</div>
    <div class="subtitle">Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  <div class="score-box">
    <div class="score-label">Overall Automation Risk</div>
    <div class="score-value">${data.overallRisk}%</div>
    <div class="badge">${riskLevel} Risk</div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-value">${data.averageSalary}</div><div class="stat-label">Average Salary</div></div>
    <div class="stat"><div class="stat-value">${data.jobGrowth}</div><div class="stat-label">Growth (10yr)</div></div>
    <div class="stat"><div class="stat-value">${data.industry}</div><div class="stat-label">Industry</div></div>
  </div>

  <h2>Tasks at Highest Automation Risk</h2>
  <ul class="task-list">${data.highRiskTasks.map(t => `<li class="task-risk">${t}</li>`).join('')}</ul>

  <h2>Skills That Remain Human</h2>
  <ul class="task-list">${data.safeSkills.map(s => `<li class="task-safe">${s}</li>`).join('')}</ul>

  <h2>Recommended Reskilling Paths</h2>
  <ul class="task-list">${data.reskillingSuggestions.map(r => `<li class="task-reskill">${r}</li>`).join('')}</ul>

  <h2>Bridge Role Recommendation</h2>
  <div class="bridge">
    <div class="bridge-title">${data.bridgeRole}</div>
    <div style="font-size:13px;">Automation Risk: ${data.bridgeRoleRisk}% — ${data.bridgeRoleRisk <= 30 ? 'Significantly safer' : 'Lower risk'} than ${data.title}</div>
  </div>

  <div class="cta no-print">
    <h3>This is a Sample Report</h3>
    <p>The full report includes personalized task-level AI analysis, detailed skill gap mapping, and custom reskilling timelines powered by O*NET 29.3 + Gemini AI.</p>
    <a href="https://automationinsights.app/for-coaches">Get Coach Pro → White-label this for your clients</a>
  </div>

  <div class="footer">
    <p>Data: O*NET 29.3 (U.S. Department of Labor) &bull; WEF Future of Jobs 2025</p>
    <p style="margin-top:4px;">Powered by <a href="https://automationinsights.app" style="color:#2dd4a8;text-decoration:none;">${brand}</a></p>
  </div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

export default function SampleReportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [brandName, setBrandName] = useState('');

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

  const handleGenerateReport = () => {
    if (!selectedData || !selectedSlug) return;
    trackEvent('sample_report_generated', {
      occupation: selectedData.title,
      slug: selectedSlug,
      branded: !!brandName.trim(),
    });
    const html = generateSampleReportHTML(selectedData, brandName.trim() || undefined);
    const win = window.open('', '_blank');
    if (win) {
      win.document.open('text/html');
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
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
        <div className="max-w-2xl mx-auto space-y-4">
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

          {/* Brand Name (optional) */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Your brand name (optional — for white-label preview)"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="pl-10"
            />
          </div>
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
                  {selectedData.title} — Report Preview
                </CardTitle>
                <CardDescription>
                  {brandName.trim() ? `Branded as "${brandName.trim()}"` : 'Default Automation Insights branding'}
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

                <Button onClick={handleGenerateReport} className="w-full" size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Generate Sample Report (PDF)
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Opens in a new tab. Use File → Print → Save as PDF. Includes "SAMPLE" watermark.
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
                <h3 className="font-bold mb-1">AI-Powered Analysis</h3>
                <p className="text-xs text-muted-foreground">O*NET 29.3 data + Gemini AI generates task-level insights no competitor offers.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <Users className="h-8 w-8 text-[var(--accent-primary)] mx-auto mb-3" />
                <h3 className="font-bold mb-1">15x ROI</h3>
                <p className="text-xs text-muted-foreground">Pay $10/report. Charge clients $150+. 122,000+ coaches globally need this.</p>
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
    </div>
  );
}
