import React, { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ArrowRight,
  Brain,
  TrendingUp,
  Mail,
  Users,
  ArrowLeftRight
} from 'lucide-react';
import { occupationRiskData, type OccupationRiskData } from '@/data/occupationRiskData';

/** Get unique industries + slug-safe names from occupation data */
export function getIndustries(): { slug: string; name: string; count: number; avgRisk: number }[] {
  const industryMap = new Map<string, { name: string; occupations: { slug: string; data: OccupationRiskData }[] }>();

  for (const [slug, data] of Object.entries(occupationRiskData)) {
    const industrySlug = data.industry.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!industryMap.has(industrySlug)) {
      industryMap.set(industrySlug, { name: data.industry, occupations: [] });
    }
    industryMap.get(industrySlug)!.occupations.push({ slug, data });
  }

  return Array.from(industryMap.entries()).map(([slug, { name, occupations }]) => ({
    slug,
    name,
    count: occupations.length,
    avgRisk: Math.round(occupations.reduce((sum, o) => sum + o.data.overallRisk, 0) / occupations.length),
  })).sort((a, b) => b.count - a.count);
}

function getRiskColor(risk: number): string {
  if (risk <= 30) return 'text-emerald-500';
  if (risk <= 60) return 'text-amber-500';
  return 'text-red-500';
}

function getRiskBg(risk: number): string {
  if (risk <= 30) return 'bg-emerald-500/10 border-emerald-500/20';
  if (risk <= 60) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

function getRiskLabel(risk: number): string {
  if (risk <= 30) return 'Low';
  if (risk <= 60) return 'Medium';
  return 'High';
}

function getRiskIcon(risk: number) {
  if (risk <= 30) return <ShieldCheck className="h-5 w-5 text-emerald-500" />;
  if (risk <= 60) return <ShieldAlert className="h-5 w-5 text-amber-500" />;
  return <ShieldX className="h-5 w-5 text-red-500" />;
}

export default function IndustrySEOPage() {
  const { industry } = useParams<{ industry: string }>();

  const industries = useMemo(() => getIndustries(), []);

  const currentIndustry = industries.find(i => i.slug === industry);

  const occupations = useMemo(() => {
    if (!industry) return [];
    return Object.entries(occupationRiskData)
      .filter(([_, data]) => {
        const slug = data.industry.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return slug === industry;
      })
      .map(([slug, data]) => ({ slug, ...data }))
      .sort((a, b) => b.overallRisk - a.overallRisk);
  }, [industry]);

  const avgRisk = occupations.length
    ? Math.round(occupations.reduce((s, o) => s + o.overallRisk, 0) / occupations.length)
    : 0;
  const highRiskCount = occupations.filter(o => o.overallRisk >= 60).length;
  const lowRiskCount = occupations.filter(o => o.overallRisk < 30).length;
  const avgSalary = occupations.length
    ? Math.round(occupations.reduce((s, o) => s + parseInt(o.averageSalary.replace(/[^0-9]/g, ''), 10), 0) / occupations.length)
    : 0;

  useEffect(() => {
    if (currentIndustry) {
      document.title = `AI Automation Risk in ${currentIndustry.name}: ${occupations.length} Jobs Analyzed | Automation Insights`;
      const metaDesc = document.querySelector('meta[name="description"]');
      const desc = `How will AI impact ${currentIndustry.name}? We analyzed ${occupations.length} occupations — average automation risk is ${avgRisk}%. See which roles are safest.`;
      if (metaDesc) {
        metaDesc.setAttribute('content', desc);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = desc;
        document.head.appendChild(meta);
      }
    }
  }, [currentIndustry, occupations, avgRisk]);

  // Industry index page (no specific industry selected)
  if (!industry || !currentIndustry) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-4"><Building2 className="h-3 w-3 mr-1" /> Industry Analysis</Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">AI Automation Risk by Industry</h1>
              <p className="text-lg text-muted-foreground">
                How will AI impact your industry? Explore automation risk data for {Object.keys(occupationRiskData).length}+ occupations across {industries.length} sectors.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {industries.map((ind) => (
                <Link key={ind.slug} to={`/automation-risk/industry/${ind.slug}`} className="block">
                  <Card className="hover:border-primary/50 transition-colors h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h2 className="font-bold text-lg">{ind.name}</h2>
                        {getRiskIcon(ind.avgRisk)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>{ind.count} occupations</span>
                        <span className={`font-semibold ${getRiskColor(ind.avgRisk)}`}>{ind.avgRisk}% avg risk</span>
                      </div>
                      <Progress value={ind.avgRisk} className="h-2" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-12">
              <Card className="max-w-lg mx-auto bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="p-6">
                  <h2 className="text-lg font-bold mb-2">Get Your Personalized Analysis</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    These are industry averages. Your actual risk depends on your specific skills and experience.
                  </p>
                  <Link to="/auth">
                    <Button><Mail className="mr-2 h-4 w-4" /> Analyze My Career Free</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Specific industry page
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <Link to="/automation-risk/industry" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
            ← All Industries
          </Link>
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4"><Building2 className="h-3 w-3 mr-1" /> {currentIndustry.name}</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              AI Automation Risk in <span className="text-primary">{currentIndustry.name}</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              {occupations.length} occupations analyzed — average automation risk is{' '}
              <strong className={getRiskColor(avgRisk)}>{avgRisk}%</strong>.
            </p>
          </div>

          {/* Industry Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Brain className="h-6 w-6 text-primary mx-auto mb-1" />
                <div className={`text-2xl font-bold ${getRiskColor(avgRisk)}`}>{avgRisk}%</div>
                <div className="text-xs text-muted-foreground">Avg Risk</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 text-[var(--accent-primary)] mx-auto mb-1" />
                <div className="text-2xl font-bold">{occupations.length}</div>
                <div className="text-xs text-muted-foreground">Occupations</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <ShieldX className="h-6 w-6 text-red-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-red-500">{highRiskCount}</div>
                <div className="text-xs text-muted-foreground">High Risk</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <ShieldCheck className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
                <div className="text-2xl font-bold text-emerald-500">{lowRiskCount}</div>
                <div className="text-xs text-muted-foreground">Low Risk</div>
              </CardContent>
            </Card>
          </div>

          {/* Occupation List */}
          <h2 className="text-xl font-bold mb-4">Occupations in {currentIndustry.name}</h2>
          <div className="grid gap-3">
            {occupations.map((occ) => (
              <Link key={occ.slug} to={`/automation-risk/${occ.slug}`} className="block">
                <Card className={`hover:border-primary/50 transition-colors border ${getRiskBg(occ.overallRisk)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {getRiskIcon(occ.overallRisk)}
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{occ.title}</div>
                          <div className="text-xs text-muted-foreground">{occ.code} • {occ.averageSalary}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getRiskColor(occ.overallRisk)}`}>{occ.overallRisk}%</div>
                          <div className="text-xs text-muted-foreground">{occ.jobGrowth} growth</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    {/* Bridge role hint */}
                    <div className="mt-2 text-xs text-muted-foreground">
                      Bridge role: <span className="text-emerald-500 font-medium">{occ.bridgeRole}</span> ({occ.bridgeRoleRisk}% risk)
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Compare Prompt */}
          {occupations.length >= 2 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" /> Compare {currentIndustry.name} Occupations
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {occupations.slice(0, 3).flatMap((a, i) =>
                  occupations.slice(i + 1, i + 3).map((b) => (
                    <Link key={`${a.slug}-${b.slug}`} to={`/compare/${a.slug}-vs-${b.slug}`} className="block">
                      <div className="p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors text-sm">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{a.title}</span>
                          <ArrowLeftRight className="h-3 w-3 mx-1 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{b.title}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Other Industries */}
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">Explore Other Industries</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {industries
                .filter(i => i.slug !== industry)
                .map((ind) => (
                  <Link key={ind.slug} to={`/automation-risk/industry/${ind.slug}`} className="block">
                    <div className="p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors text-center">
                      <div className="font-medium text-sm">{ind.name}</div>
                      <div className={`text-xs font-semibold ${getRiskColor(ind.avgRisk)}`}>{ind.avgRisk}% avg</div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-bold mb-2">Are You a Career Coach?</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Generate white-labeled "{currentIndustry.name} AI Readiness" reports for your clients.
                  $10 per report. Clients pay $150+. <strong>That's 15x ROI.</strong>
                </p>
                <Link to="/for-coaches">
                  <Button size="lg">Learn About Coach Pro <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
