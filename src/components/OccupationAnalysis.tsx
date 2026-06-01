
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Plus, BarChart3, TrendingUp, TrendingDown, Clock, Target, AlertTriangle, Download } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { EnhancedAPOVisualization } from './EnhancedAPOVisualization';
import APOExplanation from './APOExplanation';
import { BrightOutlookBadge } from './BrightOutlookBadge';
import PremiumReportSummary from './PremiumReportSummary';
import PremiumCategoryGrid from './PremiumCategoryGrid';
import { RelatedOccupationsPanel } from './RelatedOccupationsPanel';
import { ROICalculator } from '@/components/ROICalculator';
import { CareerSimulatorCard } from '@/components/CareerSimulatorCard';
import { EcosystemRiskCard } from '@/components/EcosystemRiskCard';
import { useBrightOutlook } from '@/hooks/useOnetEnrichment';
import {
  getBrowserGlobalEnglishRegion,
  getOfficialSources,
  getRegionalLaborMarketDisclosure,
} from '@/lib/globalEnglishLocalization';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ExampleModal } from '@/components/help/ExampleModal';
import { HelpTrigger } from '@/components/help/HelpTrigger';

type AnalysisItem = {
  category?: string;
  description: string;
  apo: number;
  factors?: string[];
  timeline?: string;
};

type CategoryKey = 'tasks' | 'knowledge' | 'skills' | 'abilities' | 'technologies';

type AutomationEconomicsRow = {
  task_category?: string | null;
  industry_sector?: string | null;
  implementation_cost_low?: number | null;
  implementation_cost_high?: number | null;
  roi_timeline_months?: number | null;
  technology_maturity?: string | null;
  wef_adoption_score?: number | null;
  regulatory_friction?: string | null;
  min_org_size?: number | null;
  annual_labor_cost_threshold?: number | null;
  source?: string | null;
  source_url?: string | null;
  as_of_year?: number | null;
};

type BlsEmploymentRow = {
  year?: number | null;
  employment_level?: number | null;
};

type RoiResult = {
  roi_months?: number;
  industry_sector?: string;
  annual_wage?: number;
  avg_cost?: number;
};

type SupabaseQueryBuilder<T> = PromiseLike<{ data: T | null }> & {
  select(columns: string): SupabaseQueryBuilder<T>;
  eq(column: string, value: unknown): SupabaseQueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): SupabaseQueryBuilder<T>;
  limit(count: number): SupabaseQueryBuilder<T>;
  maybeSingle(): Promise<{ data: T | null }>;
  single(): Promise<{ data: T | null }>;
};

type SupabaseLooseClient = {
  from<T>(table: string): SupabaseQueryBuilder<T>;
  rpc<T>(fn: string, args?: Record<string, unknown>): {
    single(): Promise<{ data: T | null }>;
  };
};

export interface EnhancedOccupationData {
  code: string;
  title: string;
  description: string;
  overallAPO: number;
  confidence: string;
  timeline: string;
  tasks: AnalysisItem[];
  knowledge: AnalysisItem[];
  skills: AnalysisItem[];
  abilities: AnalysisItem[];
  technologies: AnalysisItem[];
  items?: AnalysisItem[];
  categoryBreakdown: Record<CategoryKey, { apo: number; confidence: string }>;
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
  const [econ, setEcon] = React.useState<AutomationEconomicsRow | null>(null);
  const [blsSeries, setBlsSeries] = React.useState<Array<{ x: number; y: number }>>([]);
  const [roi, setRoi] = React.useState<RoiResult | null>(null);
  const [econProv, setEconProv] = React.useState<{ source?: string | null; source_url?: string | null; as_of_year?: number | null } | null>(null);
  const [showExplain, setShowExplain] = React.useState(false);
  const [showExample, setShowExample] = React.useState<false | 'apo' | 'portfolio'>(false);
  const globalEnglishRegion = React.useMemo(() => getBrowserGlobalEnglishRegion(), []);
  const regionalDisclosure = React.useMemo(
    () => getRegionalLaborMarketDisclosure(globalEnglishRegion, occupation.code),
    [globalEnglishRegion, occupation.code],
  );
  const regionalSources = getOfficialSources(regionalDisclosure.sourceIds);

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

  const db = React.useMemo(() => supabase as unknown as SupabaseLooseClient, []);

  React.useEffect(() => {
    if (!sector) { setEcon(null); return; }
    (async () => {
      const { data } = await db
        .from<AutomationEconomicsRow>('automation_economics')
        .select('task_category,industry_sector,implementation_cost_low,implementation_cost_high,roi_timeline_months,technology_maturity,wef_adoption_score,regulatory_friction,min_org_size,annual_labor_cost_threshold')
        .eq('industry_sector', sector)
        .order('wef_adoption_score', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fallback for Construction if not found in DB
      if (!data && sector === 'Construction') {
        setEcon({
          industry_sector: 'Construction',
          implementation_cost_low: 15000,
          implementation_cost_high: 80000,
          roi_timeline_months: 18,
          technology_maturity: 'Emerging',
          wef_adoption_score: 45,
          regulatory_friction: 'High',
          min_org_size: 10,
          annual_labor_cost_threshold: 50000
        });
      } else {
        setEcon(data || null);
      }
    })();
  }, [db, sector]);

  React.useEffect(() => {
    const soc6 = toSoc6(occupation.code);
    if (!soc6) { setBlsSeries([]); return; }
    (async () => {
      const { data } = await db
        .from<BlsEmploymentRow[]>('bls_employment_data')
        .select('year, employment_level')
        .eq('occupation_code_6', soc6)
        .order('year', { ascending: true });
      const series = (data || [])
        .filter((r) => typeof r.employment_level === 'number' && typeof r.year === 'number')
        .map((r) => ({ x: r.year as number, y: r.employment_level as number }));
      setBlsSeries(series);
    })();
  }, [db, occupation?.code]);

  React.useEffect(() => {
    if (!occupation?.code) { setRoi(null); return; }
    (async () => {
      const { data } = await db.rpc<RoiResult>('calculate_roi', { p_soc8: occupation.code }).single();
      setRoi(data || null);
      if (data?.industry_sector) {
        const { data: prov } = await db
          .from<AutomationEconomicsRow>('automation_economics')
          .select('source, source_url, as_of_year')
          .eq('industry_sector', data.industry_sector)
          .limit(1)
          .maybeSingle();
        setEconProv(prov || null);
      } else {
        setEconProv(null);
      }
    })();
  }, [db, occupation?.code]);

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
    return 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]';
  };

  // Helper to normalize data from V2 (items array) or V1 (separate arrays)
  const getCategoryData = (categoryName: CategoryKey, v1Array: AnalysisItem[]) => {
    if (v1Array && v1Array.length > 0) return v1Array;

    // If V1 array is missing/empty, try to find items in the unified 'items' array (V2 format)
    if (occupation.items && Array.isArray(occupation.items)) {
      return occupation.items.filter((item) =>
        item.category?.toLowerCase() === categoryName.toLowerCase()
      );
    }

    return [];
  };

  const categories = [
    {
      name: 'Tasks',
      data: getCategoryData('tasks', occupation.tasks),
      apo: occupation.categoryBreakdown?.tasks?.apo || 0,
      confidence: occupation.categoryBreakdown?.tasks?.confidence || 'medium'
    },
    {
      name: 'Knowledge',
      data: getCategoryData('knowledge', occupation.knowledge),
      apo: occupation.categoryBreakdown?.knowledge?.apo || 0,
      confidence: occupation.categoryBreakdown?.knowledge?.confidence || 'medium'
    },
    {
      name: 'Skills',
      data: getCategoryData('skills', occupation.skills),
      apo: occupation.categoryBreakdown?.skills?.apo || 0,
      confidence: occupation.categoryBreakdown?.skills?.confidence || 'medium'
    },
    {
      name: 'Abilities',
      data: getCategoryData('abilities', occupation.abilities),
      apo: occupation.categoryBreakdown?.abilities?.apo || 0,
      confidence: occupation.categoryBreakdown?.abilities?.confidence || 'medium'
    },
    {
      name: 'Technologies',
      data: getCategoryData('technologies', occupation.technologies),
      apo: occupation.categoryBreakdown?.technologies?.apo || 0,
      confidence: occupation.categoryBreakdown?.technologies?.confidence || 'medium'
    },
  ];

  const riskAssessment = getRiskLevel(occupation.overallAPO || overallAPO);
  const RiskIcon = riskAssessment.icon;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="glass-card p-4 sm:p-6">
        {regionalDisclosure.shouldShow && (
          <div
            role="note"
            aria-label="Regional labor-market disclosure"
            className="mb-4 rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-xs text-[var(--text-secondary)]"
          >
            <div className="mb-1 flex flex-wrap items-center gap-2 font-semibold text-[var(--text-primary)]">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>{regionalDisclosure.heading}</span>
              {regionalDisclosure.classification && (
                <Badge variant="outline" className="text-[10px]">
                  {regionalDisclosure.classification.code}
                </Badge>
              )}
            </div>
            <p>{regionalDisclosure.message}</p>
            {regionalDisclosure.adapter && (
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-[10px]">
                  Adapter: {regionalDisclosure.adapter.valueStatus.replace(/_/g, ' ')}
                </Badge>
                <span className="basis-full text-[11px] leading-snug text-[var(--text-secondary)]">
                  Join requirement: {regionalDisclosure.adapter.joinLevel}
                </span>
              </div>
            )}
            {regionalSources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {regionalSources.map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-[var(--text-primary)]"
                  >
                    {source.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <div className="flex items-start gap-2 sm:gap-3 mb-3">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--accent-primary)] mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-primary)] break-words">
                    {occupation.title}
                  </h2>
                  <BrightOutlookBadge
                    hasBrightOutlook={hasBrightOutlook}
                    category={brightOutlookCategory}
                    size="sm"
                  />
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-tertiary)] mt-1 font-mono break-all">
                  {occupation.code}
                </p>
              </div>
            </div>
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">
              {occupation.description}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="flex flex-col items-end gap-2">
              {/* Giant gradient APO score */}
              <div className="text-right">
                <div className="text-6xl font-bold font-data leading-none
                                bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-amber)]
                                bg-clip-text text-transparent">
                  {Math.round(overallAPO)}%
                </div>
                <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mt-2">
                  Decision-support estimate
                </div>
              </div>
            </div>
            <div className="max-w-xs rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-xs text-[var(--text-secondary)]">
              <div className="mb-1 flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Uncertainty disclosure
              </div>
              <p>
                This percentage estimates automation exposure for planning. It is not a job-loss probability, employment decision, or salary prediction.
              </p>
              <a href="/docs/model_cards/APO_MODEL_CARD.html" className="mt-2 inline-block underline hover:text-[var(--text-primary)]">
                Read model card
              </a>
            </div>
            <div className="flex items-center space-x-4">
              {occupation.timeline && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className={getTimelineColor(occupation.timeline)}>
                        {occupation.timeline}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Estimated period when automation impact is likely
                    </TooltipContent>
                  </Tooltip>
                  <HelpTrigger entryKey="timeline" />
                </div>
              )}
              {occupation.confidence && (
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className={
                        occupation.confidence === 'high' ? 'bg-green-100 text-green-800' :
                          occupation.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                      }>
                        {occupation.confidence} confidence
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Evidence strength for this estimate
                    </TooltipContent>
                  </Tooltip>
                  <HelpTrigger entryKey="confidence" />
                </div>
              )}
              {typeof roi?.roi_months === 'number' && (
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary" className="text-xs">ROI: {roi.roi_months} mo</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Months to break even on upskilling/automation investment
                    </TooltipContent>
                  </Tooltip>
                  <HelpTrigger entryKey="roi_months" />
                </div>
              )}
              {typeof occupation.externalSignals?.blsTrendPct === 'number' && (
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs">
                        BLS: {occupation.externalSignals.blsTrendPct >= 0 ? '📈' : '📉'} {occupation.externalSignals.blsTrendPct}%
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Latest employment trend for this occupation
                    </TooltipContent>
                  </Tooltip>
                  <HelpTrigger entryKey="bls_trend" />
                </div>
              )}
            </div>

            {(roi || occupation?.externalSignals?.blsTrendPct != null || occupation?.ci) && (
              <div className="mt-2 grid gap-2 rounded-md border p-2 sm:grid-cols-3">
                <div className="text-xs">
                  <div className="font-medium">Evidence</div>
                  {typeof occupation.ci?.lower === 'number' && typeof occupation.ci?.upper === 'number' && (
                    <div>Uncertainty band: {occupation.ci.lower}–{occupation.ci.upper}{occupation.ci.iterations ? ` (n=${occupation.ci.iterations})` : ''}</div>
                  )}
                </div>
                <div className="text-xs">
                  {typeof roi?.roi_months === 'number' && (
                    <div>ROI: {roi.roi_months} mo{roi.annual_wage ? ` • wage ~$${Math.round(roi.annual_wage).toLocaleString()}` : ''}{roi.avg_cost ? ` • cost ~$${Math.round(roi.avg_cost).toLocaleString()}` : ''}</div>
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
                      <Line type="monotone" dataKey="y" stroke="var(--accent-primary)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)]">
                  Employment trend {blsSeries[0].x}–{blsSeries[blsSeries.length - 1].x}
                </div>
              </div>
            )}

            {(occupation.externalSignals?.blsTrendPct !== undefined || sector) && (
              <div className="text-xs text-[var(--text-tertiary)] mt-1 flex items-center gap-2">
                <span className="opacity-80">Provenance:</span>
                {occupation.externalSignals?.blsTrendPct !== undefined && (
                  <Badge variant="outline" className="text-[10px]">BLS</Badge>
                )}
                {sector && (
                  <Badge variant="outline" className="text-[10px]">Economics</Badge>
                )}
              </div>
            )}

            {/* Methods & Evidence strip */}
            <div className="text-[11px] text-[var(--text-tertiary)] mt-2">
              Methods & Evidence: <a href="/validation/methods" className="underline hover:text-[var(--text-secondary)]">Read methodology</a>
              {' '}· <a href="/docs/reports/apo-calibration-report.html" className="underline hover:text-[var(--text-secondary)]">Calibration artifact</a>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={onAddToSelected}
                disabled={isAlreadySelected}
                className="flex-1 sm:flex-none shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAlreadySelected ? 'Added' : 'Add to Compare'}
              </Button>
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setShowExplain(true)}>
                Explain Score
              </Button>
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setShowExample('apo')}>
                Example
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:inline-flex" title="Export Report" aria-label="Export Report">
                <Download className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="breakdown">Detailed Breakdown</TabsTrigger>
            <TabsTrigger value="forecast">Planning & Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PremiumReportSummary occupation={occupation} overallAPO={overallAPO} />

            {/* Factor Contributions (Explainability) */}
            <div>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="factors" className="border-none">
                  <AccordionTrigger className="py-0 hover:no-underline">
                    <span className="text-xl md:text-2xl font-serif font-bold text-gray-100 flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Factor Contributions
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    <div className="space-y-3">
                      {categories?.map((cat) => {
                        const contribution = ((cat.apo / 100) * 20);
                        const pct = ((contribution / (occupation.overallAPO || overallAPO)) * 100).toFixed(1);
                        return (
                          <div key={cat.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{cat.name}</span>
                              <span className="text-muted-foreground">{cat.apo.toFixed(1)}% × 0.2 = {contribution.toFixed(1)} pts ({pct}% of total)</span>
                            </div>
                            <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 hover:opacity-90 transition-opacity cursor-help"
                                    style={{ width: `${Math.min(100, (contribution / 20) * 100)}%` }}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <div className="font-semibold">{cat.name} Contribution</div>
                                    <div>Raw Score: {cat.apo.toFixed(1)}%</div>
                                    <div>Weight: 20%</div>
                                    <div className="mt-1 text-muted-foreground">
                                      {cat.apo.toFixed(1)} × 0.2 = {contribution.toFixed(1)} pts
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {(econ || sector) && (
              <div>
                <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-100 mb-3 flex items-center">
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
                      <div className="text-sm text-gray-300 flex flex-wrap gap-4">
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
                    <div className="text-sm text-gray-300">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">Sector: {sector}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">Economic references are not available for this sector yet.</div>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-6">
            <div className="mt-4">
              <PremiumCategoryGrid categories={categories.map(c => ({ name: c.name, apo: c.apo, confidence: c.confidence }))} />
            </div>

            {/* Enhanced APO Visualization */}
            <div>
              <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-100 mb-4 flex items-center">
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
              <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-100 mb-4 flex items-center">Detailed Component Analysis</h3>
              <Accordion type="single" collapsible className="space-y-2 md:space-y-3">
                {categories?.map((category) => (
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
                        {category.data?.map((item, index) => (
                          <div key={index} className="p-4 md:p-5 bg-[var(--bg-secondary)]/5 rounded-xl shadow-sm border border-[var(--bg-secondary)]/10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2 md:gap-0">
                              <p className="text-sm md:text-base text-gray-200 font-medium flex-1">{item.description}</p>
                              <div className="flex items-center space-x-3 ml-4">
                                <Progress value={item.apo} className="w-16" />
                                <span className="text-sm font-medium text-gray-100 w-12 text-right">
                                  {(item.apo || 0).toFixed(1)}%
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
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            {/* Planning & Forecasts */}
            <div>
              <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-100 mb-3 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Planning & Forecasts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ROICalculator roi={roi || {}} />
                <CareerSimulatorCard currentSalary={typeof roi?.annual_wage === 'number' ? roi.annual_wage : undefined} />
                <EcosystemRiskCard occupationCode={occupation.code} occupationTitle={occupation.title} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Analysis Metadata */}
        {occupation.metadata && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="text-xs text-gray-400 flex items-center justify-between">
              <span>Analysis Method: {occupation.metadata.calculation_method}</span>
              <span>Generated: {new Date(occupation.metadata.timestamp).toLocaleString()}</span>
            </div>
          </div>
        )}
      </Card>
      <ExampleModal open={!!showExample} onClose={() => setShowExample(false)} exampleKey={showExample || 'apo'} />
      <APOExplanation open={showExplain} onOpenChange={setShowExplain} occupation={occupation} />
    </div>
  );
};
