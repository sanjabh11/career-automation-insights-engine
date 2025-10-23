
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Plus, BarChart3, TrendingUp, TrendingDown, Clock, Target, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { EnhancedAPOVisualization } from './EnhancedAPOVisualization';
import { BrightOutlookBadge } from './BrightOutlookBadge';
import { EmploymentOutlookCard } from './EmploymentOutlookCard';
import { RelatedOccupationsPanel } from './RelatedOccupationsPanel';
import { useBrightOutlook } from '@/hooks/useOnetEnrichment';

interface EnhancedOccupationData {
  code: string;
  title: string;
  description: string;
  overallAPO: number;
  confidence: string;
  timeline: string;
  tasks: Array<{ description: string; apo: number; factors?: string[]; timeline?: string }>;
  knowledge: Array<{ description: string; apo: number; factors?: string[]; timeline?: string }>;
  skills: Array<{ description: string; apo: number; factors?: string[]; timeline?: string }>;
  abilities: Array<{ description: string; apo: number; factors?: string[]; timeline?: string }>;
  technologies: Array<{ description: string; apo: number; factors?: string[]; timeline?: string }>;
  categoryBreakdown: {
    tasks: { apo: number; confidence: string };
    knowledge: { apo: number; confidence: string };
    skills: { apo: number; confidence: string };
    abilities: { apo: number; confidence: string };
    technologies: { apo: number; confidence: string };
  };
  insights: {
    primary_opportunities: string[];
    main_challenges: string[];
    automation_drivers: string[];
    barriers: string[];
  };
  metadata: {
    analysis_version: string;
    calculation_method: string;
    timestamp: string;
  };
  ci?: { lower: number; upper: number; iterations?: number };
  externalSignals?: {
    blsTrendPct?: number;
    blsAdjustmentPts?: number;
    industrySector?: string;
    sectorDelayMonths?: number;
    econViabilityDiscount?: number;
  };
}

interface OccupationAnalysisProps {
  occupation: EnhancedOccupationData;
  overallAPO: number;
  onAddToSelected: () => void;
  isAlreadySelected: boolean;
}

export const OccupationAnalysis = ({ 
  occupation, 
  overallAPO, 
  onAddToSelected, 
  isAlreadySelected 
}: OccupationAnalysisProps) => {
  const { hasBrightOutlook, brightOutlookCategory } = useBrightOutlook(occupation.code);
  const [econ, setEcon] = React.useState<any | null>(null);
  const [blsSeries, setBlsSeries] = React.useState<Array<{ x: number; y: number }>>([]);
  const [roi, setRoi] = React.useState<{ roi_months?: number; industry_sector?: string; annual_wage?: number; avg_cost?: number } | null>(null);
  const [econProv, setEconProv] = React.useState<{ source?: string | null; source_url?: string | null; as_of_year?: number | null } | null>(null);

  const toSoc6 = (code: string) => {
    const m = (code || '').match(/^(\d{2}-\d{4})/);
    return m ? m[1] : code;
  };

  // Fallback: derive sector from SOC major group when not provided by the function
  const deriveSector = (soc8: string): string | null => {
    const major = (soc8 || '').slice(0, 2);
    switch (major) {
      case '11': return 'Business';
      case '13': return 'Finance';
      case '15': return 'Technology';
      case '17': return 'Technology';
      case '19': return 'Technology';
      case '21': return 'Services';
      case '25': return 'Education';
      case '27': return 'Media';
      case '29': return 'Healthcare';
      case '31': return 'Services';
      case '33': return 'Government';
      case '35': return 'Hospitality';
      case '37': return 'Services';
      case '39': return 'Services';
      case '41': return 'Retail';
      case '43': return 'Business';
      case '45': return 'Agriculture';
      case '47': return 'Construction';
      case '49': return 'Manufacturing';
      case '51': return 'Manufacturing';
      case '53': return 'Transportation';
      default: return null;
    }
  };

  const sector = React.useMemo(() => {
    return occupation?.externalSignals?.industrySector ?? deriveSector(occupation?.code);
  }, [occupation?.externalSignals?.industrySector, occupation?.code]);

  React.useEffect(() => {
    if (!sector) { setEcon(null); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from('automation_economics')
        .select('task_category,industry_sector,implementation_cost_low,implementation_cost_high,roi_timeline_months,technology_maturity,wef_adoption_score,regulatory_friction,min_org_size,annual_labor_cost_threshold')
        .eq('industry_sector', sector)
        .order('wef_adoption_score', { ascending: false })
        .limit(1)
        .maybeSingle();
      setEcon(data || null);
    })();
  }, [sector]);

  React.useEffect(() => {
    const soc6 = toSoc6(occupation.code);
    if (!soc6) { setBlsSeries([]); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from('bls_employment_data')
        .select('year, employment_level')
        .eq('occupation_code_6', soc6)
        .order('year', { ascending: true });
      const series = (data || [])
        .filter((r: any) => typeof r.employment_level === 'number' && typeof r.year === 'number')
        .map((r: any) => ({ x: r.year, y: r.employment_level }));
      setBlsSeries(series);
    })();
  }, [occupation?.code]);

  React.useEffect(() => {
    if (!occupation?.code) { setRoi(null); return; }
    (async () => {
      const { data } = await (supabase as any).rpc('calculate_roi', { p_soc8: occupation.code }).single();
      setRoi(data || null);
      if (data?.industry_sector) {
        const { data: prov } = await (supabase as any)
          .from('automation_economics')
          .select('source, source_url, as_of_year')
          .eq('industry_sector', data.industry_sector)
          .limit(1)
          .maybeSingle();
        setEconProv((prov as any) || null);
      } else {
        setEconProv(null);
      }
    })();
  }, [occupation?.code]);
  
  const getAPOColor = (apo: number) => {
    if (apo >= 70) return 'text-red-600 bg-red-50 border-red-200';
    if (apo >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (apo >= 30) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getAPOIcon = (apo: number) => {
    if (apo >= 50) return <TrendingUp className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  const getRiskLevel = (apo: number) => {
    if (apo >= 70) return { level: 'High Automation Risk', icon: AlertTriangle, color: 'text-red-600' };
    if (apo >= 50) return { level: 'Medium-High Risk', icon: Target, color: 'text-orange-600' };
    if (apo >= 30) return { level: 'Medium Risk', icon: Target, color: 'text-yellow-600' };
    return { level: 'Low Automation Risk', icon: Target, color: 'text-green-600' };
  };

  const getTimelineColor = (timeline: string) => {
    if (timeline?.includes('2024-2026')) return 'bg-red-100 text-red-800';
    if (timeline?.includes('2027-2030')) return 'bg-orange-100 text-orange-800';
    if (timeline?.includes('2031-2035')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const categories = [
    { 
      name: 'Tasks', 
      data: occupation.tasks, 
      apo: occupation.categoryBreakdown?.tasks?.apo || 0,
      confidence: occupation.categoryBreakdown?.tasks?.confidence || 'medium'
    },
    { 
      name: 'Knowledge', 
      data: occupation.knowledge, 
      apo: occupation.categoryBreakdown?.knowledge?.apo || 0,
      confidence: occupation.categoryBreakdown?.knowledge?.confidence || 'medium'
    },
    { 
      name: 'Skills', 
      data: occupation.skills, 
      apo: occupation.categoryBreakdown?.skills?.apo || 0,
      confidence: occupation.categoryBreakdown?.skills?.confidence || 'medium'
    },
    { 
      name: 'Abilities', 
      data: occupation.abilities, 
      apo: occupation.categoryBreakdown?.abilities?.apo || 0,
      confidence: occupation.categoryBreakdown?.abilities?.confidence || 'medium'
    },
    { 
      name: 'Technologies', 
      data: occupation.technologies, 
      apo: occupation.categoryBreakdown?.technologies?.apo || 0,
      confidence: occupation.categoryBreakdown?.technologies?.confidence || 'medium'
    },

  ];

  const riskAssessment = getRiskLevel(occupation.overallAPO || overallAPO);
  const RiskIcon = riskAssessment.icon;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <div className="flex items-start gap-2 sm:gap-3 mb-3">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                    {occupation.title}
                  </h2>
                  <BrightOutlookBadge
                    hasBrightOutlook={hasBrightOutlook}
                    category={brightOutlookCategory}
                    size="sm"
                  />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 font-mono break-all">
                  {occupation.code}
                </p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              {occupation.description}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="flex items-center space-x-4">
              {occupation.timeline && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <Badge className={getTimelineColor(occupation.timeline)}>
                    {occupation.timeline}
                  </Badge>
                </div>
              )}
              {occupation.confidence && (
                <Badge className={
                  occupation.confidence === 'high' ? 'bg-green-100 text-green-800' :
                  occupation.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {occupation.confidence} confidence
                </Badge>
              )}
              {typeof roi?.roi_months === 'number' && (
                <Badge variant="secondary" className="text-xs">ROI: {roi.roi_months} mo</Badge>
              )}
              {typeof occupation.externalSignals?.blsTrendPct === 'number' && (
                <Badge variant="outline" className="text-xs">
                  BLS: {occupation.externalSignals.blsTrendPct >= 0 ? '📈' : '📉'} {occupation.externalSignals.blsTrendPct}%
                </Badge>
              )}
            </div>

            {(roi || occupation?.externalSignals?.blsTrendPct != null || occupation?.ci) && (
              <div className="mt-2 grid gap-2 rounded-md border p-2 sm:grid-cols-3">
                <div className="text-xs">
                  <div className="font-medium">Evidence</div>
                  {typeof (occupation as any)?.ci?.lower === 'number' && typeof (occupation as any)?.ci?.upper === 'number' && (
                    <div>CI: {(occupation as any).ci.lower}–{(occupation as any).ci.upper}{(occupation as any)?.ci?.iterations ? ` (n=${(occupation as any).ci.iterations})` : ''}</div>
                  )}
                </div>
                <div className="text-xs">
                  {typeof roi?.roi_months === 'number' && (
                    <div>ROI: {roi?.roi_months} mo{roi?.annual_wage ? ` • wage ~$${Math.round((roi.annual_wage as number)).toLocaleString()}` : ''}{roi?.avg_cost ? ` • cost ~$${Math.round((roi.avg_cost as number)).toLocaleString()}` : ''}</div>
                  )}
                  {roi?.industry_sector && (
                    <div>Sector: {roi.industry_sector}</div>
                  )}
                </div>
                <div className="text-xs">
                  {blsSeries && blsSeries.length > 0 && (
                    <div>BLS year: {blsSeries[blsSeries.length - 1]?.x}</div>
                  )}
                  {econProv?.source && (
                    <div>
                      Econ: {econProv.source}
                      {econProv?.as_of_year ? ` (${econProv.as_of_year})` : ''}
                      {econProv?.source_url ? (
                        <a href={econProv.source_url as string} target="_blank" rel="noreferrer" className="ml-1 underline">link</a>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )}

            {blsSeries && blsSeries.length > 1 && (
              <div className="mt-2">
                <div className="h-10 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={blsSeries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                      <Line type="monotone" dataKey="y" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[10px] text-gray-500">
                  Employment trend {blsSeries[0].x}–{blsSeries[blsSeries.length - 1].x}
                </div>
              </div>
            )}

            {(occupation.externalSignals?.blsTrendPct !== undefined || sector) && (
              <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                <span className="opacity-80">Provenance:</span>
                {occupation.externalSignals?.blsTrendPct !== undefined && (
                  <Badge variant="outline" className="text-[10px]">BLS</Badge>
                )}
                {sector && (
                  <Badge variant="outline" className="text-[10px]">Economics</Badge>
                )}
              </div>
            )}

            <Button
              onClick={onAddToSelected}
              disabled={isAlreadySelected}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAlreadySelected ? 'Added' : 'Add to List'}
            </Button>
          </div>
        </div>

        {/* Enhanced Overall APO Score */}
        <div className={`p-6 rounded-lg border-2 mb-6 ${getAPOColor(occupation.overallAPO || overallAPO)}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <RiskIcon className="h-5 w-5" />
                <h3 className="text-lg font-semibold">{riskAssessment.level}</h3>
              </div>
              <p className="text-sm opacity-75">Enhanced AI analysis with weighted scoring</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                {getAPOIcon(occupation.overallAPO || overallAPO)}
                <span className="text-3xl font-bold">{(occupation.overallAPO || overallAPO).toFixed(1)}%</span>
              </div>
            </div>
          </div>
          {occupation.ci && (
            <div className="mt-2 text-xs text-gray-700">
              Confidence Interval: {occupation.ci.lower.toFixed(1)}% – {occupation.ci.upper.toFixed(1)}%
              {occupation.ci.iterations ? ` (${occupation.ci.iterations} sims)` : ''}
            </div>
          )}
          {occupation.externalSignals && (
            <div className="mt-2 text-xs text-gray-700 flex flex-wrap gap-2">
              {occupation.externalSignals.industrySector && (
                <Badge variant="secondary" className="text-xs">Sector: {occupation.externalSignals.industrySector}</Badge>
              )}
              {typeof occupation.externalSignals.sectorDelayMonths === 'number' && occupation.externalSignals.sectorDelayMonths > 0 && (
                <Badge variant="outline" className="text-xs">Sector Delay: {occupation.externalSignals.sectorDelayMonths} mo</Badge>
              )}
              {typeof occupation.externalSignals.econViabilityDiscount === 'number' && occupation.externalSignals.econViabilityDiscount > 0 && (
                <Badge variant="destructive" className="text-xs">Econ Discount: -{occupation.externalSignals.econViabilityDiscount} pts</Badge>
              )}
            </div>
          )}
        </div>

        {(econ || sector) && (
          <div className="mb-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Economic Viability
            </h3>
            <Card className="p-4">
              {econ ? (
                <>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {typeof econ.roi_timeline_months === 'number' && (
                      <Badge variant="secondary" className="text-xs">ROI: {econ.roi_timeline_months} mo</Badge>
                    )}
                    {econ.technology_maturity && (
                      <Badge variant="outline" className="text-xs">Maturity: {String(econ.technology_maturity)}</Badge>
                    )}
                    {typeof econ.wef_adoption_score === 'number' && (
                      <Badge variant="outline" className="text-xs">WEF adoption: {Number(econ.wef_adoption_score).toFixed(1)}</Badge>
                    )}
                    {econ.regulatory_friction && (
                      <Badge variant="outline" className="text-xs">Regulatory: {String(econ.regulatory_friction)}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 flex flex-wrap gap-4">
                    {(typeof econ.implementation_cost_low === 'number' || typeof econ.implementation_cost_high === 'number') && (
                      <div>
                        <span className="font-medium">Implementation cost:</span>{' '}
                        {typeof econ.implementation_cost_low === 'number' ? `$${Math.round(econ.implementation_cost_low).toLocaleString()}` : '—'}
                        {' – '}
                        {typeof econ.implementation_cost_high === 'number' ? `$${Math.round(econ.implementation_cost_high).toLocaleString()}` : '—'}
                      </div>
                    )}
                    {typeof econ.min_org_size === 'number' && (
                      <div><span className="font-medium">Min org size:</span> {econ.min_org_size}+ employees</div>
                    )}
                    {typeof econ.annual_labor_cost_threshold === 'number' && (
                      <div><span className="font-medium">Annual labor cost ≥</span> ${Math.round(econ.annual_labor_cost_threshold).toLocaleString()}</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">Sector: {sector}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Economic references are not available for this sector yet.</div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Factor Contributions (Explainability) */}
        <div className="mb-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Factor Contributions to Overall APO
          </h3>
          <div className="space-y-3">
            {categories.map((cat) => {
              const contribution = ((cat.apo / 100) * 20); // Each category weighted equally (20% max)
              const pct = ((contribution / (occupation.overallAPO || overallAPO)) * 100).toFixed(1);
              return (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-muted-foreground">{cat.apo.toFixed(1)}% × 0.2 = {contribution.toFixed(1)} pts ({pct}% of total)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                      style={{ width: `${Math.min(100, (contribution / 20) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Each category contributes up to 20 points to the overall APO (0-100 scale). Bars show relative contribution.
          </div>
        </div>

        {/* Enhanced APO Visualization */}
        <div className="mb-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Enhanced Analysis Breakdown
          </h3>
          <EnhancedAPOVisualization 
            categories={categories} 
            overallAPO={occupation.overallAPO || overallAPO}
            insights={occupation.insights || {
              primary_opportunities: [],
              main_challenges: [],
              automation_drivers: [],
              barriers: []
            }}
          />
        </div>

        {/* Enhanced Category Details */}
        <div>
          <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Detailed Component Analysis</h3>
          <Accordion type="single" collapsible className="space-y-2 md:space-y-3">
            {categories.map((category) => (
              <AccordionItem key={category.name} value={category.name}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-col md:flex-row md:items-center justify-between w-full mr-0 md:mr-4 gap-2 md:gap-0">
                    <span className="font-medium">{category.name}</span>
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <Badge className={
                        category.confidence === 'high' ? 'bg-green-100 text-green-800' :
                        category.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {category.confidence}
                      </Badge>
                      <Progress value={category.apo} className="w-24" />
                      <span className={`text-sm font-semibold px-2 py-1 rounded ${getAPOColor(category.apo)}`}>
                        {category.apo.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 md:space-y-4 pt-2">
                    {category.data.map((item, index) => (
                      <div key={index} className="p-4 md:p-5 bg-gray-50 rounded-xl shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2 md:gap-0">
                          <p className="text-sm md:text-base text-gray-700 font-medium flex-1">{item.description}</p>
                          <div className="flex items-center space-x-3 ml-4">
                            <Progress value={item.apo} className="w-16" />
                            <span className="text-sm font-medium text-gray-900 w-12 text-right">
                              {item.apo.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Enhanced Item Details */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex flex-wrap gap-1">
                            {item.factors?.map((factor, factorIndex) => (
                              <Badge key={factorIndex} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                          {item.timeline && (
                            <Badge className={getTimelineColor(item.timeline)}>
                              {item.timeline}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Analysis Metadata */}
        {occupation.metadata && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 flex items-center justify-between">
              <span>Analysis Method: {occupation.metadata.calculation_method}</span>
              <span>Generated: {new Date(occupation.metadata.timestamp).toLocaleString()}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
