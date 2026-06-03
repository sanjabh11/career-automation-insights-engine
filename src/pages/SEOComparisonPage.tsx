import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ShieldCheck,
  ShieldX,
  ArrowRight,
  Briefcase,
  TrendingUp,
  Users,
  Brain,
  ArrowLeftRight,
  Zap,
  Mail
} from 'lucide-react';
import { occupationRiskData, occupationSlugs, type OccupationRiskData } from '@/data/occupationRiskData';
import { SEOReportDownload } from '@/components/SEOReportDownload';

/** Generate all valid comparison pairs for internal linking */
function getComparisonPairs(): { slug1: string; slug2: string; label: string }[] {
  const popular = [
    'accountant', 'software-developer', 'registered-nurse', 'lawyer',
    'graphic-designer', 'data-entry-clerk', 'marketing-manager', 'teacher-k12',
    'financial-analyst', 'web-developer', 'project-manager', 'journalist'
  ];
  const pairs: { slug1: string; slug2: string; label: string }[] = [];
  for (let i = 0; i < popular.length; i++) {
    for (let j = i + 1; j < popular.length; j++) {
      const a = occupationRiskData[popular[i]];
      const b = occupationRiskData[popular[j]];
      if (a && b) {
        pairs.push({
          slug1: popular[i],
          slug2: popular[j],
          label: `${a.title} vs ${b.title}`
        });
      }
    }
  }
  return pairs;
}

function getRiskColor(risk: number): string {
  if (risk <= 30) return 'text-emerald-500';
  if (risk <= 60) return 'text-amber-500';
  return 'text-red-500';
}

function getRiskLabel(risk: number): string {
  if (risk <= 30) return 'Lower Exposure';
  if (risk <= 60) return 'Moderate Exposure';
  return 'Higher Exposure';
}

function ComparisonColumn({ data, slug, side }: { data: OccupationRiskData; slug: string; side: 'left' | 'right' }) {
  const riskColor = getRiskColor(data.overallRisk);
  const winner = side; // just for styling

  return (
    <div className="space-y-4">
      <Link to={`/automation-risk/${slug}`} className="block hover:opacity-80 transition-opacity">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold">{data.title}</h2>
          <Badge variant="outline" className="mt-1">{data.code}</Badge>
        </div>
      </Link>

      {/* Exposure estimate */}
      <div className="text-center p-4 bg-card border rounded-xl">
        <div className={`text-4xl font-bold ${riskColor}`}>{data.overallRisk}%</div>
        <Progress value={data.overallRisk} className="h-2 my-2" />
        <Badge className={riskColor}>{getRiskLabel(data.overallRisk)}</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-2">
        <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
          <span className="text-sm text-muted-foreground flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> Salary</span>
          <span className="font-semibold">{data.averageSalary}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
          <span className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Growth</span>
          <span className="font-semibold">{data.jobGrowth}</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-card border rounded-lg">
          <span className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Industry</span>
          <span className="font-semibold text-sm">{data.industry}</span>
        </div>
      </div>

      {/* Higher exposure tasks */}
      <div>
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
          <ShieldX className="h-4 w-4 text-red-500" /> Tasks To Review
        </h3>
        <div className="space-y-1.5">
          {data.highRiskTasks.map((t, i) => (
            <div key={i} className="text-xs p-2 bg-red-500/10 border border-red-500/20 rounded">
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* Resilience skills */}
      <div>
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
          <ShieldCheck className="h-4 w-4 text-emerald-500" /> Resilience Skills
        </h3>
        <div className="space-y-1.5">
          {data.safeSkills.map((s, i) => (
            <div key={i} className="text-xs p-2 bg-emerald-500/10 border border-emerald-500/20 rounded">
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Reskilling */}
      <div>
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
          <Zap className="h-4 w-4 text-primary" /> Reskilling Paths
        </h3>
        <div className="space-y-1.5">
          {data.reskillingSuggestions.map((r, i) => (
            <div key={i} className="text-xs p-2 bg-primary/10 border border-primary/20 rounded">
              {r}
            </div>
          ))}
        </div>
      </div>

      {/* Bridge Role */}
      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
        <div className="text-xs text-muted-foreground">Bridge Role</div>
        <div className="font-semibold">{data.bridgeRole}</div>
        <div className="text-xs text-emerald-500">{data.bridgeRoleRisk}% exposure estimate</div>
      </div>
    </div>
  );
}

export default function SEOComparisonPage() {
  const { slugs } = useParams<{ slugs: string }>();

  // Parse "accountant-vs-software-developer"
  const parts = slugs?.split('-vs-') || [];
  const slug1 = parts[0] || '';
  const slug2 = parts[1] || '';
  const data1 = occupationRiskData[slug1];
  const data2 = occupationRiskData[slug2];

  useEffect(() => {
    if (data1 && data2) {
      document.title = `${data1.title} vs ${data2.title}: Automation Defense Comparison | Automation Insights`;
      const metaDesc = document.querySelector('meta[name="description"]');
      const desc = `Compare ${data1.title} (${data1.overallRisk}% exposure estimate) vs ${data2.title} (${data2.overallRisk}% exposure estimate). Side-by-side automation-defense planning context with salary, growth, and reskilling recommendations.`;
      if (metaDesc) {
        metaDesc.setAttribute('content', desc);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = desc;
        document.head.appendChild(meta);
      }
    }
  }, [data1, data2]);

  if (!data1 || !data2) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Comparison Not Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground text-sm">
              We couldn't find one or both occupations. Try one of these popular comparisons:
            </p>
            <div className="grid gap-2">
              {getComparisonPairs().slice(0, 6).map((p) => (
                <Link key={`${p.slug1}-${p.slug2}`} to={`/compare/${p.slug1}-vs-${p.slug2}`}>
                  <Button variant="outline" size="sm" className="w-full text-left justify-start">
                    <ArrowLeftRight className="h-3.5 w-3.5 mr-2" />
                    {p.label}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lowerExposure = data1.overallRisk <= data2.overallRisk ? data1 : data2;
  const higherExposure = data1.overallRisk > data2.overallRisk ? data1 : data2;
  const riskDiff = Math.abs(data1.overallRisk - data2.overallRisk);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">
            <ArrowLeftRight className="h-3 w-3 mr-1" /> Automation Defense Comparison
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="text-primary">{data1.title}</span>
            {' '}vs{' '}
            <span className="text-primary">{data2.title}</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Which occupation has a lower decision-support exposure estimate? Side-by-side planning context using O*NET data.
          </p>

          {/* Verdict Card */}
          <Card className="max-w-lg mx-auto mb-8 border-emerald-500/30">
            <CardContent className="p-6 text-center">
              <Brain className="h-8 w-8 text-primary mx-auto mb-2" />
              <h2 className="text-lg font-bold mb-1">Verdict</h2>
              <p className="text-muted-foreground">
                <strong className="text-emerald-500">{lowerExposure.title}</strong> has a{' '}
                <strong>{riskDiff} percentage point lower exposure estimate</strong> than{' '}
                <span className="text-red-400">{higherExposure.title}</span>. This is planning context, not a safety guarantee.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Side-by-Side Comparison */}
      <section className="container mx-auto px-4 py-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <ComparisonColumn data={data1} slug={slug1} side="left" />
          <ComparisonColumn data={data2} slug={slug2} side="right" />
        </div>
      </section>

      {/* PDF Download */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <SEOReportDownload data={lowerExposure} occupationSlug={data1.overallRisk <= data2.overallRisk ? slug1 : slug2} />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-8">
              <h2 className="text-xl font-bold mb-2">Get Your Personalized Career Analysis</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Go beyond static data. Our AI analyzes YOUR specific skills and experience against 1,016 occupations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/auth">
                  <Button>
                    <Mail className="mr-2 h-4 w-4" />
                    Get Free Analysis
                  </Button>
                </Link>
                <Link to="/for-coaches">
                  <Button variant="outline">
                    For Career Coaches
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* More Comparisons */}
      <section className="container mx-auto px-4 py-8 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold mb-4">More Comparisons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {getComparisonPairs()
              .filter(p => !(p.slug1 === slug1 && p.slug2 === slug2))
              .sort(() => 0.5 - Math.random())
              .slice(0, 9)
              .map((p) => {
                const a = occupationRiskData[p.slug1];
                const b = occupationRiskData[p.slug2];
                return (
                  <Link key={`${p.slug1}-${p.slug2}`} to={`/compare/${p.slug1}-vs-${p.slug2}`} className="block">
                    <div className="p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{a?.title}</span>
                        <ArrowLeftRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">{b?.title}</span>
                      </div>
                      <div className="flex justify-between mt-1 text-xs">
                        <span className={getRiskColor(a?.overallRisk || 0)}>{a?.overallRisk}%</span>
                        <span className="text-muted-foreground">vs</span>
                        <span className={getRiskColor(b?.overallRisk || 0)}>{b?.overallRisk}%</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </section>
    </div>
  );
}
