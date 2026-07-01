import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Notebook as Robot, Brain, User, Zap, BookOpen, Lightbulb, AlertTriangle, CheckCircle, Clock, Save, RefreshCw, Briefcase, GraduationCap, ThumbsUp, DollarSign, TrendingUp, Award, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useSession } from '@/hooks/useSession';
import { occupationDefaults } from '@/content/templates/occupationDefaults';
import { HelpTrigger } from '@/components/help/HelpTrigger';
import { PortfolioHedgingCard } from '@/components/PortfolioHedgingCard';
import { PortfolioFrontierCard } from '@/components/PortfolioFrontierCard';
import { SkillFreshnessAlerts } from '@/components/SkillFreshnessAlerts';
import { OutcomeSurvey } from '@/components/outcomes/OutcomeSurvey';
import { OutcomesList } from '@/components/outcomes/OutcomesList';
import type {
  Occupation, Task, Skill, Resource, LearningPathData,
  CIPProgram, CourseResult, UserPreferences, FeedbackData,
} from '@/components/planner/types';
import { normalizeOccupation } from '@/components/planner/types';
import { TaskCard, InfoIcon, containerVariants, itemVariants } from '@/components/planner/ui';
import { OccupationSearchPanel } from '@/components/planner/panels/OccupationSearchPanel';
import { ImpactSummaryPanel } from '@/components/planner/panels/ImpactSummaryPanel';
import { TasksAnalysisPanel } from '@/components/planner/panels/TasksAnalysisPanel';

type ResistanceResult = {
  resistance_score?: number | string;
  category?: string;
  timeline_years?: number | string;
};

type SkillFreshnessResult = {
  skill?: string;
  freshness_score?: number;
  months_to_80?: number;
  months_to_60?: number;
  decay_lambda?: number;
  critical_threshold?: number;
  recommended_hours_per_month?: number;
  assumptions?: {
    half_life_years?: number;
  };
};

type SkillFreshnessDerived = {
  recommendedHours: number | null;
  monthsToCritical: number | null;
  belowCritical: boolean;
  critical: number;
};

type SkillComparisonResult = {
  skills: Array<{
    name: string;
    half_life_years: number;
    maint_hours: number;
  }>;
  recommendation: {
    top_choice: string;
    reasoning: string[];
  };
};

type SimulatorRiskTolerance = 'conservative' | 'balanced' | 'aggressive';

type SimulatorResult = {
  p_success_12m: number;
  p_success_18m: number;
  p_success_24m: number;
  months_p50: number;
  months_p90: number;
  median_salary_at_completion?: number | null;
};

type CascadeUpstreamItem = Record<string, unknown>;
type CascadeResult = Record<string, unknown>;

type PortfolioWeight = {
  skill: string;
  weight: number;
};

type PortfolioResult = {
  expected_return: number;
  risk: number;
  diversification_score: number;
  weights: PortfolioWeight[];
  rationale?: string[];
};

type FunctionInvokeResult<TData = unknown> = {
  data: TData | null;
  error: Error | { message?: string } | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const asString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
};

const getArrayField = (value: unknown, field: string): unknown[] => {
  if (!isRecord(value)) return [];
  const fieldValue = value[field];
  return Array.isArray(fieldValue) ? fieldValue : [];
};

const getFirstArrayField = (value: unknown, fields: string[]): unknown[] => {
  for (const field of fields) {
    const items = getArrayField(value, field);
    if (items.length > 0) return items;
  }
  return [];
};

const normalizeCipProgram = (item: unknown): CIPProgram => {
  const record = isRecord(item) ? item : {};
  return {
    code: asString(record.code || record.to_code || record.target),
    title: asString(record.title || record.name || record.desc, 'Unknown Program'),
    type: asString(record.type || record.category),
  };
};

const isSimulatorRiskTolerance = (value: string): value is SimulatorRiskTolerance => {
  return value === 'conservative' || value === 'balanced' || value === 'aggressive';
};

// Main component
export function AIImpactPlanner() {
  // State
  const { user } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [selectedOccupation, setSelectedOccupation] = useState<Occupation | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customTask, setCustomTask] = useState('');
  const [isAssessingTask, setIsAssessingTask] = useState(false);
  const [skillRecommendations, setSkillRecommendations] = useState<Skill[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [similarOccupations, setSimilarOccupations] = useState<Occupation[]>([]);
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [isSearchingCustomJob, setIsSearchingCustomJob] = useState(false);
  const [skillProgress, setSkillProgress] = useState<Record<string, boolean>>({});
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const skillProgressRef = useRef(skillProgress);
  skillProgressRef.current = skillProgress;

  // Education Path state
  const [timeCommitment, setTimeCommitment] = useState('5');
  const [learningStyle, setLearningStyle] = useState('self-paced');
  const [budget, setBudget] = useState('moderate');
  const [currentSalary, setCurrentSalary] = useState('');
  const [targetSalary, setTargetSalary] = useState('');
  const [learningPathData, setLearningPathData] = useState<LearningPathData | null>(null);
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const [cipPrograms, setCipPrograms] = useState<CIPProgram[]>([]);
  const [isLoadingCIP, setIsLoadingCIP] = useState(false);
  const [selectedSkillForCourses, setSelectedSkillForCourses] = useState<string | null>(null);
  const [coursesForSkill, setCoursesForSkill] = useState<CourseResult[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  const [resistanceResult, setResistanceResult] = useState<ResistanceResult | null>(null);
  const [isComputingResistance, setIsComputingResistance] = useState(false);
  const [sfSkill, setSfSkill] = useState('');
  const [sfAcquiredYear, setSfAcquiredYear] = useState('');
  const [isLoadingFreshness, setIsLoadingFreshness] = useState(false);
  const [freshnessResult, setFreshnessResult] = useState<SkillFreshnessResult | null>(null);
  const [compASkill, setCompASkill] = useState('');
  const [compAYear, setCompAYear] = useState('');
  const [compAHalfLife, setCompAHalfLife] = useState('');
  const [compBSkill, setCompBSkill] = useState('');
  const [compBYear, setCompBYear] = useState('');
  const [compBHalfLife, setCompBHalfLife] = useState('');
  const [isComparing, setIsComparing] = useState(false);
  const [compResult, setCompResult] = useState<SkillComparisonResult | null>(null);
  const [simHoursPerWeek, setSimHoursPerWeek] = useState(10);
  const [simRiskTolerance, setSimRiskTolerance] = useState<SimulatorRiskTolerance>('balanced');
  const [simCurrentSalary, setSimCurrentSalary] = useState('');
  const [simTargetSalary, setSimTargetSalary] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<SimulatorResult | null>(null);

  const [cascadePayload, setCascadePayload] = useState('');
  const [cascadeResult, setCascadeResult] = useState<CascadeResult | null>(null);
  const [isCascadeLoading, setIsCascadeLoading] = useState(false);
  const [pfItems, setPfItems] = useState<Array<{ skill: string; expected: string; risk: string }>>([
    { skill: '', expected: '', risk: '' },
    { skill: '', expected: '', risk: '' },
    { skill: '', expected: '', risk: '' },
  ]);
  const [pfCorrelation, setPfCorrelation] = useState('0.2');
  const [pfResult, setPfResult] = useState<PortfolioResult | null>(null);
  const [isPfLoading, setIsPfLoading] = useState(false);
  const [scenario, setScenario] = useState<'none' | 'recession' | 'ai'>('none');

  const addPfRow = () => setPfItems(prev => [...prev, { skill: '', expected: '', risk: '' }]);
  const updatePfItem = (idx: number, field: 'skill' | 'expected' | 'risk', value: string) => {
    setPfItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };
  const removePfRow = (idx: number) => setPfItems(prev => prev.filter((_, i) => i !== idx));

  const currentAlloc = useMemo(() => {
    const valid = pfItems.filter(r => r.skill.trim());
    const n = valid.length || 1;
    const w = 1 / n;
    return valid.map(v => ({ skill: v.skill.trim(), weight: Math.round(w * 10000) / 10000 }));
  }, [pfItems]);

  const optimizedSuggestion = useMemo(() => {
    if (!pfResult || !pfResult.weights || pfResult.weights.length === 0) return null;
    const cap = 0.4;
    const raw = pfResult.weights.map((w) => w.weight);
    const capped = raw.map(w => Math.min(w, cap));
    const deficit = 1 - capped.reduce((a, b) => a + b, 0);
    const adjusted = [...capped];
    if (deficit > 0) {
      const underIdx = adjusted.map((w, i) => (w < cap ? i : -1)).filter(i => i >= 0);
      const underTotal = underIdx.reduce((acc, i) => acc + (cap - adjusted[i]), 0);
      underIdx.forEach(i => {
        const room = cap - adjusted[i];
        const add = underTotal > 0 ? deficit * (room / underTotal) : 0;
        adjusted[i] += add;
      });
    }
    // Heuristic low-correlation boost
    const rho = parseFloat(pfCorrelation || '0.2');
    if (rho <= 0.2 && adjusted.length >= 2) {
      let maxI = 0, minI = 0;
      adjusted.forEach((w, i) => { if (w > adjusted[maxI]) maxI = i; if (w < adjusted[minI]) minI = i; });
      const delta = Math.max(0, Math.min(0.05, adjusted[maxI] - 0.05, cap - adjusted[minI]));
      if (delta > 0) {
        adjusted[maxI] = adjusted[maxI] - delta;
        adjusted[minI] = adjusted[minI] + delta;
      }
    }
    const weights = pfResult.weights.map((w, i) => ({ skill: w.skill, weight: Math.round(adjusted[i] * 10000) / 10000 }));
    const concentration = Math.max(...weights.map((w) => w.weight)) * 100;
    return { weights, concentration: Math.round(concentration * 10) / 10 };
  }, [pfResult, pfCorrelation]);

  const scenarioMetrics = useMemo(() => {
    if (!pfResult) return null;
    let expected = pfResult.expected_return as number;
    let risk = pfResult.risk as number;
    let divers = pfResult.diversification_score as number;
    if (scenario === 'recession') {
      expected = expected * 0.85;
      risk = risk * 1.2;
      divers = Math.max(0, Math.round(divers * 0.8));
    } else if (scenario === 'ai') {
      expected = expected * 1.1;
      risk = risk * 1.05;
      divers = Math.min(100, Math.round(divers * 1.1));
    }
    return {
      baseline: { expected_return: pfResult.expected_return, risk: pfResult.risk, diversification_score: pfResult.diversification_score },
      scenario: { expected_return: Math.round(expected * 10000) / 10000, risk: Math.round(risk * 10000) / 10000, diversification_score: divers }
    };
  }, [pfResult, scenario]);

  const freshnessDerived = useMemo<SkillFreshnessDerived | null>(() => {
    if (!freshnessResult) return null;
    const halfLife = Number(freshnessResult.assumptions?.half_life_years) || 0;
    const recommendedHours = halfLife ? Math.round((Math.max(1, Math.min(12, 20 / halfLife))) * 10) / 10 : null;
    const lambda = Number(freshnessResult.decay_lambda) || 0;
    const curr = Number(freshnessResult.freshness_score) || 0;
    const remaining = curr / 100;
    const critical = Number(freshnessResult.critical_threshold) || 80;
    let monthsToCritical: number | null = null;
    let belowCritical = false;
    if (remaining > 0 && lambda > 0) {
      const yrs = Math.log((critical / 100) / remaining) / (-lambda);
      monthsToCritical = Math.max(0, Math.round(yrs * 12));
      belowCritical = curr <= critical;
    }
    return { recommendedHours, monthsToCritical, belowCritical, critical };
  }, [freshnessResult]);

  // Load user preferences from localStorage on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('aiImpactPlanner');
    if (savedPreferences) {
      try {
        const preferences: UserPreferences = JSON.parse(savedPreferences);
        if (preferences.occupation) {
          const normalized = normalizeOccupation(preferences.occupation);
          if (normalized.code && normalized.title) {
            setSelectedOccupation(normalized);
          }
        }
        if (preferences.skillProgress) {
          setSkillProgress(preferences.skillProgress);
        }
      } catch (error) {
        console.error('Error loading saved preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage when occupation changes
  useEffect(() => {
    if (selectedOccupation) {
      const preferences: UserPreferences = {
        occupation: selectedOccupation,
        recentTasks: tasks.slice(0, 5),
        skillProgress,
        lastVisited: new Date().toISOString()
      };
      localStorage.setItem('aiImpactPlanner', JSON.stringify(preferences));
    }
  }, [selectedOccupation, tasks, skillProgress]);

  // Search for occupations
  const searchOccupations = async (query: string) => {
    if (!query.trim()) {
      setOccupations([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-occupations', {
        body: {
          keyword: query.trim(),
          limit: 10,
        },
      });

      if (error) {
        throw new Error(error.message ?? 'Search function failed');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Unexpected response from search function');
      }

      const occupations = getArrayField(data, 'occupations');

      const occs: Occupation[] = occupations
        .map((o) => {
          const normalized = normalizeOccupation(o);
          if (!normalized.description) {
            normalized.description = 'An occupation from the O*NET database.';
          }
          return normalized;
        })
        .filter((o: Occupation) => o.code && o.title);

      setOccupations(occs);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to search occupations');
    } finally {
      setIsSearching(false);
    }
  };

  // If the homepage hero stored a last search, prefill and fetch results
  useEffect(() => {
    try {
      const last = localStorage.getItem('planner:lastSearch');
      if (last && last.trim()) {
        setSearchQuery(last);
        searchOccupations(last);
        localStorage.removeItem('planner:lastSearch');
      }
    } catch {
      // localStorage may be unavailable in private or restricted browser contexts.
    }

  }, []);

  // Find similar occupations for custom job title
  const findSimilarOccupations = async (jobTitle: string) => {
    if (!jobTitle.trim()) {
      toast.error('Please enter a job title');
      return;
    }

    setIsSearchingCustomJob(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-occupations', {
        body: {
          keyword: jobTitle.trim(),
          limit: 5,
        },
      });

      if (error) {
        throw new Error(error.message ?? 'Search function failed');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Unexpected response from search function');
      }

      const occupations = getArrayField(data, 'occupations');

      const occs: Occupation[] = occupations
        .map((o) => {
          const normalized = normalizeOccupation(o);
          if (!normalized.description) {
            normalized.description = 'An occupation from the O*NET database.';
          }
          return normalized;
        })
        .filter((o: Occupation) => o.code && o.title);

      setSimilarOccupations(occs);

      if (occs.length === 0) {
        toast.error('No similar occupations found. Try a different job title.');
      } else {
        toast.success(`Found ${occs.length} similar occupations`);
      }
    } catch (error) {
      console.error('Similar occupations search failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to find similar occupations');
    } finally {
      setIsSearchingCustomJob(false);
    }
  };

  // Fetch tasks for selected occupation
  const fetchTasks = useCallback(async (occupation: Occupation) => {
    setIsLoading(true);
    try {
      const { code, title } = occupation;
      if (!code || !title) {
        throw new Error('Occupation code and title are required');
      }

      const { data, error } = await supabase.functions.invoke('analyze-occupation-tasks', {
        body: { occupation_code: code, occupation_title: title }
      });

      // Log both data and error for debugging
      console.log('Function response - data:', data);
      console.log('Function response - error:', error);

      if (error) {
        console.error('Function error details:', error);
        // Check if data contains error details even when error is set
        if (data?.error) {
          console.error('Function returned error in data:', data);
          throw new Error(`${data.error}${data.details ? '\n' + data.details : ''}`);
        }
        throw error;
      }

      if (data?.error) {
        console.error('Function returned error:', data);
        throw new Error(`${data.error}${data.details ? '\n' + data.details : ''}`);
      }

      const incoming = (data?.tasks ?? []) as Array<{ description: string; category: Task['category']; explanation?: string; confidence?: number }>;
      const parsedTasks: Task[] = incoming.map((t, idx) => ({
        id: `${code}-${idx + 1}`,
        description: t.description,
        category: t.category,
        explanation: t.explanation,
        confidence: t.confidence
      }));
      setTasks(parsedTasks);
      setError(null);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : 'Failed to load tasks for this occupation';
      setError(message);
      toast.error(`Task analysis failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Assess custom task using Gemini LLM
  const assessCustomTask = async () => {
    if (!customTask.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    setIsAssessingTask(true);
    try {
      const { data, error } = await supabase.functions.invoke('assess-task', {
        body: {
          taskDescription: customTask,
          occupationContext: selectedOccupation?.title || undefined,
        },
      });
      if (error) throw error;

      const assessed = data as { category: Task['category']; explanation: string; confidence: number };
      const newTask: Task = {
        id: `custom-${Date.now()}`,
        description: customTask,
        category: assessed.category,
        explanation: assessed.explanation,
        confidence: assessed.confidence,
        isCustom: true,
      };

      setTasks([newTask, ...tasks]);
      setCustomTask('');
      toast.success('Task assessed successfully');
    } catch (error) {
      console.error('Error assessing task:', error);
      toast.error('Failed to assess task');
    } finally {
      setIsAssessingTask(false);
    }
  };

  const computeResistance = async () => {
    if (!customTask.trim()) {
      toast.error('Please enter a task description');
      return;
    }
    setIsComputingResistance(true);
    try {
      const { data, error } = await supabase.functions.invoke('automation-resistance-score', {
        body: { task: customTask },
      });
      if (error) throw error;
      setResistanceResult(data as ResistanceResult);
      toast.success('Resistance scored');
    } catch (_error) {
      toast.error('Failed to score resistance');
    } finally {
      setIsComputingResistance(false);
    }
  };

  const estimateFreshness = async () => {
    if (!sfSkill.trim()) {
      toast.error('Enter a skill');
      return;
    }
    const year = sfAcquiredYear.trim() ? parseInt(sfAcquiredYear.trim()) : undefined;
    setIsLoadingFreshness(true);
    try {
      const { data, error } = await supabase.functions.invoke('estimate-skill-half-life', {
        body: { skill: sfSkill.trim(), acquired_year: year },
      });
      if (error) throw error;
      setFreshnessResult(data as SkillFreshnessResult);
      toast.success('Estimated skill freshness');
    } catch (_error) {
      toast.error('Failed to estimate freshness');
    } finally {
      setIsLoadingFreshness(false);
    }
  };

  const compareLongevity = async () => {
    if (!compASkill.trim() || !compBSkill.trim()) {
      toast.error('Enter two skills to compare');
      return;
    }
    setIsComparing(true);
    setCompResult(null);
    try {
      const parseHL = (v: string) => {
        const n = parseFloat(v);
        return Number.isFinite(n) && n > 0.1 && n <= 50 ? n : null;
      };
      const aYear = compAYear.trim() ? parseInt(compAYear.trim()) : undefined;
      const bYear = compBYear.trim() ? parseInt(compBYear.trim()) : undefined;
      const aManual = parseHL(compAHalfLife);
      const bManual = parseHL(compBHalfLife);

      const invokeHL = async (skill: string, year?: number): Promise<SkillFreshnessResult> => {
        const { data, error } = await supabase.functions.invoke('estimate-skill-half-life', {
          body: { skill: skill.trim(), acquired_year: year },
        });
        if (error) throw error;
        return data as SkillFreshnessResult;
      };

      let aData: SkillFreshnessResult;
      let bData: SkillFreshnessResult;
      if (aManual !== null) {
        const hl = aManual;
        const lambda = Math.log(2) / hl;
        aData = {
          skill: compASkill.trim(),
          assumptions: { half_life_years: hl },
          decay_lambda: Math.round(lambda * 1000) / 1000,
          recommended_hours_per_month: Math.round((Math.max(1, Math.min(12, 20 / hl))) * 10) / 10,
        };
      } else {
        aData = await invokeHL(compASkill, aYear);
      }
      if (bManual !== null) {
        const hl = bManual;
        const lambda = Math.log(2) / hl;
        bData = {
          skill: compBSkill.trim(),
          assumptions: { half_life_years: hl },
          decay_lambda: Math.round(lambda * 1000) / 1000,
          recommended_hours_per_month: Math.round((Math.max(1, Math.min(12, 20 / hl))) * 10) / 10,
        };
      } else {
        bData = await invokeHL(compBSkill, bYear);
      }

      const aHL = Number(aData?.assumptions?.half_life_years) || 0;
      const bHL = Number(bData?.assumptions?.half_life_years) || 0;
      const aMaint = Number(aData?.recommended_hours_per_month) || (aHL ? Math.round((Math.max(1, Math.min(12, 20 / aHL))) * 10) / 10 : 0);
      const bMaint = Number(bData?.recommended_hours_per_month) || (bHL ? Math.round((Math.max(1, Math.min(12, 20 / bHL))) * 10) / 10 : 0);

      let top = compASkill.trim();
      const reasons: string[] = [];
      if (bHL > aHL || (bHL === aHL && bMaint < aMaint)) top = compBSkill.trim();
      if (aHL !== bHL) reasons.push(`${(aHL > bHL ? compASkill : compBSkill)} has ${(Math.max(aHL, bHL) / Math.max(0.0001, Math.min(aHL, bHL))).toFixed(2)}x longer half-life`);
      reasons.push(`${top} requires ~${top === compASkill.trim() ? aMaint : bMaint} hrs/mo vs ${top === compASkill.trim() ? bMaint : aMaint}`);

      setCompResult({
        skills: [
          { name: compASkill.trim(), half_life_years: aHL, maint_hours: aMaint },
          { name: compBSkill.trim(), half_life_years: bHL, maint_hours: bMaint },
        ],
        recommendation: { top_choice: top, reasoning: reasons },
      });
      toast.success('Comparison ready');
    } catch (e) {
      toast.error('Failed to compare skills');
    } finally {
      setIsComparing(false);
    }
  };

  const runSimulator = async () => {
    setIsSimulating(true);
    try {
      const { data, error } = await supabase.functions.invoke('simulate-career-trajectory', {
        body: {
          hours_per_week: simHoursPerWeek,
          risk_tolerance: simRiskTolerance,
          current_salary: simCurrentSalary ? parseFloat(simCurrentSalary) : undefined,
          target_salary: simTargetSalary ? parseFloat(simTargetSalary) : undefined,
        },
      });
      if (error) throw error;
      setSimResult(data as SimulatorResult);
      toast.success('Simulation complete');
    } catch (_error) {
      toast.error('Failed to simulate');
    } finally {
      setIsSimulating(false);
    }
  };

  const runCascade = async () => {
    setIsCascadeLoading(true);
    try {
      let upstream: CascadeUpstreamItem[] = [];
      try {
        const parsed = JSON.parse(cascadePayload || '[]') as unknown;
        upstream = Array.isArray(parsed)
          ? parsed.filter((item): item is CascadeUpstreamItem => isRecord(item))
          : [];
      } catch {
        // Invalid upstream JSON is handled by the empty-array validation below.
      }
      if (upstream.length === 0) {
        toast.error('Provide upstream array JSON');
        setIsCascadeLoading(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke('cascade-risk', { body: { upstream } });
      if (error) throw error;
      setCascadeResult(data as CascadeResult);
      toast.success('Cascade computed');
    } catch (_e) {
      toast.error('Failed to compute cascade');
    } finally {
      setIsCascadeLoading(false);
    }
  };

  const runPortfolio = async () => {
    setIsPfLoading(true);
    try {
      const cleaned = pfItems.map((r, i) => {
        const skill = (r.skill || '').trim();
        const expected = (r.expected || '').trim();
        const risk = (r.risk || '').trim();
        const expNum = expected === '' ? NaN : Number(expected);
        const riskNum = risk === '' ? NaN : Number(risk);
        return { i, skill, expNum, riskNum };
      });
      const valid = cleaned.filter(c => c.skill && Number.isFinite(c.expNum) && Number.isFinite(c.riskNum));
      const skillOnly = cleaned.filter(c => c.skill);
      if (valid.length < 2) {
        if (skillOnly.length >= 2) {
          toast.error('Add expected return and risk for at least 2 skills');
        } else {
          toast.error('Enter at least 2 skill names');
        }
        setIsPfLoading(false);
        return;
      }
      const items = valid.map(v => ({ skill: v.skill, expected_return: v.expNum, risk: v.riskNum }));
      const rhoParsed = parseFloat(pfCorrelation || '0.2');
      const rho = Number.isFinite(rhoParsed) ? rhoParsed : 0.2;
      const { data, error } = await supabase.functions.invoke('portfolio-basics', { body: { items, correlation: rho } });
      if (error) throw error;
      setPfResult(data as PortfolioResult);
      toast.success('Portfolio computed');
    } catch (_e) {
      toast.error('Failed to compute portfolio');
    } finally {
      setIsPfLoading(false);
    }
  };

  // Generate skill recommendations
  const generateSkillRecommendations = useCallback(async (occupationTitle: string) => {
    try {
      const occupationCode = selectedOccupation?.code || '';
      const { data, error } = await supabase.functions.invoke('skill-recommendations', {
        body: { occupation_code: occupationCode, occupation_title: occupationTitle },
      });
      if (error) throw error;

      const recs = (data ?? []) as Array<{ skill_name: string; explanation: string; priority?: number }>;
      const skills: Skill[] = recs.map((rec) => ({
        name: rec.skill_name,
        explanation: rec.explanation,
        inProgress: skillProgressRef.current[rec.skill_name] || false,
      }));

      setSkillRecommendations(skills);
    } catch (error) {
      console.error('Error generating skill recommendations:', error);
      toast.error('Failed to generate skill recommendations');
    }
  }, [selectedOccupation?.code]);

  // Fetch reskilling resources based on skill recommendations
  const fetchResources = useCallback(async () => {
    try {
      // Get skill areas from current skill recommendations
      const skillAreas = skillRecommendations.map(skill => skill.name);

      if (skillAreas.length === 0) {
        // If no specific skill recommendations, fetch general resources
        const { data, error } = await supabase
          .from('ai_reskilling_resources')
          .select('*')
          .limit(6);

        if (error) throw error;

        const formattedResources: Resource[] = (data || []).map(resource => ({
          title: resource.title,
          url: resource.url,
          provider: resource.provider,
          skillArea: resource.skill_area,
          costType: resource.cost_type || 'Unknown'
        }));

        setResources(formattedResources);
        return;
      }

      // Fetch resources that match the recommended skills
      const { data, error } = await supabase
        .from('ai_reskilling_resources')
        .select('*')
        .in('skill_area', skillAreas)
        .limit(10);

      if (error) throw error;

      let formattedResources: Resource[] = (data || []).map(resource => ({
        title: resource.title,
        url: resource.url,
        provider: resource.provider,
        skillArea: resource.skill_area,
        costType: resource.cost_type || 'Unknown'
      }));

      // If we don't have enough specific resources, add some general ones
      if (formattedResources.length < 4) {
        const { data: generalData, error: generalError } = await supabase
          .from('ai_reskilling_resources')
          .select('*')
          .not('skill_area', 'in', `(${skillAreas.join(',')})`)
          .limit(6 - formattedResources.length);

        if (!generalError && generalData) {
          const generalResources: Resource[] = generalData.map(resource => ({
            title: resource.title,
            url: resource.url,
            provider: resource.provider,
            skillArea: resource.skill_area,
            costType: resource.cost_type || 'Unknown'
          }));
          formattedResources = [...formattedResources, ...generalResources];
        }
      }

      setResources(formattedResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      // Fallback to showing message instead of broken mock resources
      setResources([]);
      toast.error('Unable to load learning resources at this time');
    }
  }, [skillRecommendations]);

  // Load tasks when occupation is selected
  useEffect(() => {
    if (selectedOccupation) {
      fetchTasks(selectedOccupation);
      generateSkillRecommendations(selectedOccupation.title);
    }
  }, [selectedOccupation, fetchTasks, generateSkillRecommendations]);

  // Fetch resources when skill recommendations change
  useEffect(() => {
    if (skillRecommendations.length > 0) {
      fetchResources();
    }
  }, [skillRecommendations.length, fetchResources]);

  // Track skill progress
  const toggleSkillProgress = (skillName: string) => {
    setSkillProgress(prev => {
      const newProgress = { ...prev, [skillName]: !prev[skillName] };

      // Update localStorage
      const savedPreferences = localStorage.getItem('aiImpactPlanner');
      if (savedPreferences) {
        try {
          const preferences: UserPreferences = JSON.parse(savedPreferences);
          preferences.skillProgress = newProgress;
          localStorage.setItem('aiImpactPlanner', JSON.stringify(preferences));
        } catch (error) {
          console.error('Error updating saved preferences:', error);
        }
      }

      return newProgress;
    });

    toast.success(`Progress updated for ${skillName}`);
  };

  // Submit feedback on task assessment
  const submitFeedback = (taskId: string, isAccurate: boolean, comment?: string) => {
    // In a real implementation, this would send to the backend
    console.log('Feedback submitted:', { taskId, isAccurate, comment });

    toast.success('Thank you for your feedback!');
    setFeedbackData(null);
  };

  // Reset all data
  const handleReset = () => {
    setSelectedOccupation(null);
    setTasks([]);
    setSkillRecommendations([]);
    setResources([]);
    setSearchQuery('');
    setOccupations([]);
    setSkillProgress({});
    setSimilarOccupations([]);
    setCustomJobTitle('');
    localStorage.removeItem('aiImpactPlanner');
    toast.success('All data has been reset');
  };

  // Get counts by category
  const getTaskCountsByCategory = () => {
    const counts = {
      Automate: 0,
      Augment: 0,
      'Human-only': 0
    };

    tasks.forEach(task => {
      counts[task.category]++;
    });

    return counts;
  };

  const taskCounts = getTaskCountsByCategory();
  const totalTasks = tasks.length;

  // Calculate percentages
  const getPercentage = (count: number) => {
    return totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
  };

  // filteredTasks now computed inside TasksAnalysisPanel via useMemo

  // Animation variants
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        className="mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-[var(--accent-primary)]" />
          Career Impact Planner
        </h1>
        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
          Understand how AI will impact your job, which tasks might be automated or augmented,
          and what skills to develop for the future of work.
        </p>
      </motion.div>

      {!selectedOccupation ? (
        <OccupationSearchPanel
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          occupations={occupations}
          setSelectedOccupation={setSelectedOccupation}
          isSearching={isSearching}
          searchOccupations={searchOccupations}
          customJobTitle={customJobTitle}
          setCustomJobTitle={setCustomJobTitle}
          similarOccupations={similarOccupations}
          isSearchingCustomJob={isSearchingCustomJob}
          findSimilarOccupations={findSimilarOccupations}
        />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/30">
                        {selectedOccupation.code}
                      </Badge>
                      <h2 className="text-2xl font-bold">{selectedOccupation.title}</h2>
                    </div>
                    <p className="text-[var(--text-secondary)] mt-1">{selectedOccupation.description || 'No description available.'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedOccupation(null)}>
                      Change Occupation
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      Reset All
                    </Button>
                    {user && (
                      <Button variant="outline" onClick={() => toast.success('Progress saved to your account')}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-6">
            <ImpactSummaryPanel taskCounts={taskCounts} getPercentage={getPercentage} />
          </motion.div>

          <motion.div variants={itemVariants}>
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg flex items-start gap-3 text-red-800">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Analysis Failed</h3>
                  <p className="text-sm mt-1">{error}</p>
                  {error.includes('FunctionsFetchError') && (
                    <p className="text-xs mt-2 text-red-600">
                      This may be due to Supabase Quota limits (402 Payment Required) or CORS issues.
                      Please check your Supabase project status.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Tasks Analysis</span>
                </TabsTrigger>
                <TabsTrigger value="skills" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span>Skill Recommendations</span>
                </TabsTrigger>
                <TabsTrigger value="resources" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Reskilling Resources</span>
                </TabsTrigger>
                <TabsTrigger value="education" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Education Path</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tasks">
                <TasksAnalysisPanel
                  customTask={customTask}
                  setCustomTask={setCustomTask}
                  assessCustomTask={assessCustomTask}
                  isAssessingTask={isAssessingTask}
                  computeResistance={computeResistance}
                  isComputingResistance={isComputingResistance}
                  resistanceResult={resistanceResult}
                  confidenceFilter={confidenceFilter}
                  setConfidenceFilter={setConfidenceFilter}
                  isLoading={isLoading}
                  tasks={tasks}
                  submitFeedback={submitFeedback}
                />
              </TabsContent>

              <TabsContent value="skills">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-[var(--accent-primary)]" />
                      Skill Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <p className="text-[var(--text-secondary)]">
                        Based on the AI impact analysis of your occupation, here are key skills to develop
                        to enhance your career resilience in the age of AI.
                      </p>
                    </div>
                    <div className="mb-6 p-4 bg-[var(--bg-tertiary)] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">Skill Freshness</h3>
                        <HelpTrigger entryKey="skill_half_life" variant="tip" />
                      </div>
                      <div className="flex flex-col md:flex-row gap-2">
                        <Input placeholder="Enter a skill (e.g., Python)" value={sfSkill} onChange={(e) => setSfSkill(e.target.value)} />
                        <Input placeholder="Acquired year (e.g., 2021)" value={sfAcquiredYear} onChange={(e) => setSfAcquiredYear(e.target.value.replace(/[^0-9]/g, ''))} className="md:max-w-[160px]" />
                        <Button onClick={estimateFreshness} disabled={isLoadingFreshness || !sfSkill.trim()}>
                          {isLoadingFreshness ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Estimating...
                            </>
                          ) : (
                            'Estimate'
                          )}
                        </Button>
                      </div>
                      {freshnessResult && (
                        <div className="mt-3 p-3 bg-[var(--accent-primary)]/10 rounded-md text-sm text-[var(--accent-primary)]">
                          <div className="flex items-center justify-between">
                            <span>{freshnessResult.skill}: {freshnessResult.freshness_score}% current</span>
                            <Badge variant="outline">t½ {freshnessResult.assumptions?.half_life_years}y</Badge>
                          </div>
                          <div className="mt-1 text-xs">To 80%: {freshnessResult.months_to_80} mo • To 60%: {freshnessResult.months_to_60} mo</div>
                          <div className="mt-1 text-xs">Maintenance: {freshnessDerived?.recommendedHours ?? '—'} hrs/mo</div>
                          {freshnessDerived && (
                            <div className="mt-1 text-xs">
                              {freshnessDerived.belowCritical ? 'Below critical now' : `Critical in ~${freshnessDerived.monthsToCritical ?? '—'} mo (≤${freshnessDerived.critical}%)`}
                            </div>
                          )}
                          <div className="mt-2">
                            <SkillFreshnessAlerts skill={freshnessResult.skill || sfSkill || 'Skill'} derived={freshnessDerived} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mb-6 p-4 bg-[var(--accent-primary)]/10 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Skill Longevity Comparator</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Input placeholder="Skill A (e.g., Python)" value={compASkill} onChange={(e) => setCompASkill(e.target.value)} />
                          <div className="flex gap-2">
                            <Input placeholder="Acquired year (opt)" value={compAYear} onChange={(e) => setCompAYear(e.target.value.replace(/[^0-9]/g, ''))} />
                            <Input placeholder="Manual t½ years (opt)" value={compAHalfLife} onChange={(e) => setCompAHalfLife(e.target.value.replace(/[^0-9.]/g, ''))} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Input placeholder="Skill B (e.g., React)" value={compBSkill} onChange={(e) => setCompBSkill(e.target.value)} />
                          <div className="flex gap-2">
                            <Input placeholder="Acquired year (opt)" value={compBYear} onChange={(e) => setCompBYear(e.target.value.replace(/[^0-9]/g, ''))} />
                            <Input placeholder="Manual t½ years (opt)" value={compBHalfLife} onChange={(e) => setCompBHalfLife(e.target.value.replace(/[^0-9.]/g, ''))} />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Button onClick={compareLongevity} disabled={isComparing || !compASkill.trim() || !compBSkill.trim()}>
                          {isComparing ? (<><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Comparing...</>) : 'Compare Longevity'}
                        </Button>
                      </div>
                      {compResult && (
                        <div className="mt-3 p-3 bg-[var(--accent-primary)]/10 rounded-md text-sm text-[var(--text-primary)]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {compResult.skills.map((s) => (
                              <div key={s.name} className="p-2 bg-[var(--bg-elevated)] rounded border border-[var(--accent-primary)]/20">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{s.name}</span>
                                  <Badge variant="outline">t½ {s.half_life_years || '—'}y</Badge>
                                </div>
                                <div className="mt-1 text-xs">Maintenance ~{s.maint_hours || '—'} hrs/mo</div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3">
                            <div className="text-sm font-semibold">Recommendation: {compResult.recommendation.top_choice}</div>
                            <ul className="list-disc list-inside text-xs mt-1">
                              {compResult.recommendation.reasoning.map((r: string, i: number) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>

                    {skillRecommendations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {skillRecommendations.map((skill, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border ${skill.inProgress ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]/30' : 'bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/10'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex items-center h-6 mt-0.5">
                                <Checkbox
                                  id={`skill-${index}`}
                                  checked={skill.inProgress}
                                  onCheckedChange={() => toggleSkillProgress(skill.name)}
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor={`skill-${index}`}
                                  className={`font-semibold text-[var(--text-primary)] mb-2 ${skill.inProgress ? 'line-through opacity-70' : ''}`}
                                >
                                  {skill.name}
                                </label>
                                <p className={`text-sm text-[var(--text-secondary)] ${skill.inProgress ? 'opacity-70' : ''}`}>
                                  {skill.explanation}
                                </p>
                                {skill.inProgress && (
                                  <Badge className="mt-2 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">In Progress</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[var(--text-tertiary)]">
                        <LoadingSpinner size="sm" />
                        <p className="mt-2">Generating skill recommendations...</p>
                      </div>
                    )}

                    <div className="mt-6 p-4 bg-[var(--accent-primary)]/10 rounded-lg">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-[var(--accent-primary)]" />
                        Why These Skills Matter
                      </h4>
                      <p className="text-sm text-[var(--text-secondary)]">
                        As AI automates routine tasks, human skills like creativity, emotional intelligence,
                        and complex problem-solving become more valuable. Focus on developing skills that
                        complement AI rather than compete with it.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      Reskilling Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <p className="text-[var(--text-secondary)]">
                        Explore these resources to develop the recommended skills and prepare for
                        the changing nature of work in your field.
                      </p>
                    </div>

                    {resources.length > 0 ? (
                      <div className="space-y-4">
                        {resources.map((resource, index) => (
                          <div
                            key={index}
                            className="p-4 border rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-[var(--accent-primary)]">{resource.title}</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">Provider: {resource.provider}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge variant="outline">{resource.skillArea}</Badge>
                                {resource.costType && (
                                  <Badge className={
                                    resource.costType === 'Free' ? 'bg-green-100 text-green-800' :
                                      resource.costType === 'Freemium' ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' :
                                        'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                  }>
                                    {resource.costType}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="mt-3">
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-[var(--accent-primary)] hover:underline"
                              >
                                View Resource →
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : skillRecommendations.length > 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-[var(--text-tertiary)] mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">No Resources Found</h3>
                        <p className="text-[var(--text-secondary)] mb-4">
                          We couldn't find specific learning resources for this occupation yet.
                          Try exploring these general learning platforms:
                        </p>
                        <div className="space-y-2 text-left max-w-md mx-auto">
                          <a href="https://www.coursera.org" target="_blank" rel="noopener noreferrer"
                            className="block p-3 border rounded hover:bg-[var(--bg-hover)] text-[var(--accent-primary)] hover:underline">
                            Coursera - Online courses from universities and companies
                          </a>
                          <a href="https://www.linkedin.com/learning" target="_blank" rel="noopener noreferrer"
                            className="block p-3 border rounded hover:bg-[var(--bg-hover)] text-[var(--accent-primary)] hover:underline">
                            LinkedIn Learning - Professional skill development
                          </a>
                          <a href="https://www.edx.org" target="_blank" rel="noopener noreferrer"
                            className="block p-3 border rounded hover:bg-[var(--bg-hover)] text-[var(--accent-primary)] hover:underline">
                            edX - University-level courses and programs
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[var(--text-tertiary)]">
                        <LoadingSpinner size="sm" />
                        <p className="mt-2">Loading resources...</p>
                      </div>
                    )}

                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        Learning Plan
                      </h4>
                      <p className="text-sm text-yellow-700">
                        Consider dedicating 3-5 hours per week to skill development.
                        Start with one course or resource, complete it, then move to the next.
                        Consistent learning over time will help you adapt to AI-driven changes in your field.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="education">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-[var(--accent-primary)]" />
                      Education Path & ROI
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <p className="text-[var(--text-secondary)]">
                        Generate a personalized learning path with ROI analysis based on your skill gaps and career goals.
                      </p>
                    </div>

                    <div className="mb-6 p-4 bg-[var(--accent-primary)]/10 rounded-lg">
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <TrendingUp className="h-4 w-4 text-[var(--accent-primary)]" />
                        Career Trajectory Simulator
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                        <div className="md:col-span-1">
                          <Input placeholder="Hours/week" value={String(simHoursPerWeek)} onChange={(e) => setSimHoursPerWeek(Math.max(1, Math.min(60, parseInt(e.target.value || '0'))))} />
                        </div>
                        <div className="md:col-span-1">
                          <select
                            className="border rounded px-2 py-2 w-full"
                            value={simRiskTolerance}
                            onChange={(e) => {
                              if (isSimulatorRiskTolerance(e.target.value)) {
                                setSimRiskTolerance(e.target.value);
                              }
                            }}
                          >
                            <option value="conservative">Conservative</option>
                            <option value="balanced">Balanced</option>
                            <option value="aggressive">Aggressive</option>
                          </select>
                        </div>
                        <div className="md:col-span-1">
                          <Input placeholder="Current salary" value={simCurrentSalary} onChange={(e) => setSimCurrentSalary(e.target.value.replace(/[^0-9.]/g, ''))} />
                        </div>
                        <div className="md:col-span-1">
                          <Input placeholder="Target salary" value={simTargetSalary} onChange={(e) => setSimTargetSalary(e.target.value.replace(/[^0-9.]/g, ''))} />
                        </div>
                        <div className="md:col-span-1">
                          <Button onClick={runSimulator} disabled={isSimulating} className="w-full">
                            {isSimulating ? (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Simulating...
                              </>
                            ) : (
                              'Run Simulation'
                            )}
                          </Button>
                        </div>
                      </div>
                      {simResult && (
                        <div className="mt-3 p-3 bg-[var(--accent-primary)]/10 rounded-md text-sm text-[var(--text-primary)]">
                          <div className="flex flex-wrap gap-4">
                            <span>Success 12m: {(simResult.p_success_12m * 100).toFixed(1)}%</span>
                            <span>18m: {(simResult.p_success_18m * 100).toFixed(1)}%</span>
                            <span>24m: {(simResult.p_success_24m * 100).toFixed(1)}%</span>
                            <span>P50: {simResult.months_p50} mo</span>
                            <span>P90: {simResult.months_p90} mo</span>
                            {simResult.median_salary_at_completion != null && (
                              <span>Median salary: ${'{'}simResult.median_salary_at_completion{'}'}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Portfolio Basics */}
                    <div className="mb-6 space-y-4">
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                          <h4 className="font-medium flex items-center gap-2 text-slate-800">
                            <Briefcase className="h-4 w-4 text-slate-600" />
                            Portfolio Basics (Beta)
                          </h4>
                          <span className="text-xs text-slate-500">Enter at least two skills to model your skill portfolio</span>
                        </div>

                        <div className="space-y-3">
                          {pfItems.map((row, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                              <div className="md:col-span-2">
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Skill</label>
                                <Input
                                  placeholder="e.g. Python"
                                  value={row.skill}
                                  onChange={(e) => updatePfItem(idx, 'skill', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Expected return</label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.10"
                                  value={row.expected}
                                  onChange={(e) => updatePfItem(idx, 'expected', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate-600 block mb-1">Risk</label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.25"
                                  value={row.risk}
                                  onChange={(e) => updatePfItem(idx, 'risk', e.target.value)}
                                />
                              </div>
                              <div className="md:col-span-4 flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removePfRow(idx)}
                                  disabled={pfItems.length <= 2}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}

                          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-dashed border-slate-200 mt-2">
                            <Button variant="outline" size="sm" onClick={addPfRow}>
                              Add Skill
                            </Button>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <span>Correlation (ρ):</span>
                              <Input
                                type="number"
                                step="0.05"
                                min="-1"
                                max="1"
                                value={pfCorrelation}
                                onChange={(e) => setPfCorrelation(e.target.value)}
                                className="w-24"
                              />
                            </div>
                            <Button onClick={runPortfolio} disabled={isPfLoading}>
                              {isPfLoading ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Calculating...
                                </>
                              ) : (
                                'Compute Portfolio'
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {pfResult && (
                        <div className="space-y-4">
                          <div className="p-4 bg-[var(--bg-secondary)] border rounded-lg">
                            <h5 className="font-semibold text-slate-800 mb-3">Portfolio Summary</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Expected Return</p>
                                <p className="text-lg font-semibold text-slate-800">{(pfResult.expected_return * 100).toFixed(1)}%</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Portfolio Risk</p>
                                <p className="text-lg font-semibold text-slate-800">{(pfResult.risk * 100).toFixed(1)}%</p>
                              </div>
                              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                                <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Diversification</p>
                                <p className="text-lg font-semibold text-slate-800">{pfResult.diversification_score}/100</p>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Current Allocation (Equal weight)</p>
                                <div className="space-y-1">
                                  {currentAlloc.length > 0 ? currentAlloc.map((item) => (
                                    <div key={item.skill} className="flex justify-between bg-slate-50 px-3 py-2 rounded border border-slate-200">
                                      <span>{item.skill || 'Unnamed skill'}</span>
                                      <span>{(item.weight * 100).toFixed(1)}%</span>
                                    </div>
                                  )) : (
                                    <p className="text-slate-500">Add skill names above to view allocations.</p>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Baseline Weights (Model)</p>
                                <div className="space-y-1">
                                  {pfResult.weights.map((item) => (
                                    <div key={item.skill} className="flex justify-between bg-[var(--bg-secondary)] px-3 py-2 rounded border border-slate-200">
                                      <span>{item.skill}</span>
                                      <span>{(item.weight * 100).toFixed(1)}%</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {pfResult.rationale && (
                              <ul className="mt-3 text-xs text-slate-500 list-disc list-inside">
                                {pfResult.rationale.map((line: string, idx: number) => (
                                  <li key={idx}>{line}</li>
                                ))}
                              </ul>
                            )}
                          </div>

                          {optimizedSuggestion && (
                            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h5 className="font-semibold text-indigo-900">Portfolio Optimizer (MVP)</h5>
                                <Badge className="bg-[var(--bg-secondary)] text-indigo-700 border-indigo-200">
                                  Concentration Risk: {optimizedSuggestion.concentration.toFixed(1)}%
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-indigo-600 mb-2">Optimized Allocation (≤40%)</p>
                                  <div className="space-y-1">
                                    {optimizedSuggestion.weights.map((item) => (
                                      <div key={item.skill} className="flex justify-between bg-[var(--bg-secondary)]/60 px-3 py-2 rounded border border-indigo-200">
                                        <span>{item.skill}</span>
                                        <span>{(item.weight * 100).toFixed(1)}%</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-indigo-600 mb-2">Suggested Actions</p>
                                  <ul className="space-y-2 text-indigo-900">
                                    <li>• Rebalance positions above 40% back toward the cap.</li>
                                    <li>• Reallocate freed weight to underrepresented, lower-risk skills.</li>
                                    <li>• Revisit correlation assumptions quarterly as market signals shift.</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Hedging Card */}
                          {pfResult?.weights && pfResult.weights.length > 1 && (
                            <PortfolioHedgingCard
                              weights={pfResult.weights.map(w => ({ skill: w.skill, weight: Number(w.weight) }))}
                              onApply={(next) => {
                                setPfResult((prev) => prev ? { ...prev, weights: next } : prev);
                                toast.success('Applied hedging suggestions');
                              }}
                            />
                          )}

                          {scenarioMetrics && (
                            <div className="p-4 bg-slate-900 text-slate-100 rounded-lg space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <h5 className="font-semibold">Scenario Planning</h5>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant={scenario === 'none' ? 'default' : 'outline'}
                                    onClick={() => setScenario('none')}
                                  >
                                    None
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={scenario === 'recession' ? 'default' : 'outline'}
                                    onClick={() => setScenario('recession')}
                                  >
                                    Recession
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={scenario === 'ai' ? 'default' : 'outline'}
                                    onClick={() => setScenario('ai')}
                                  >
                                    AI Disruption
                                  </Button>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="bg-slate-800 border border-slate-700 rounded-md p-3">
                                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Baseline</p>
                                  <p>Return: {(scenarioMetrics.baseline.expected_return * 100).toFixed(1)}%</p>
                                  <p>Risk: {(scenarioMetrics.baseline.risk * 100).toFixed(1)}%</p>
                                  <p>Diversification: {scenarioMetrics.baseline.diversification_score}/100</p>
                                </div>
                                <div className="bg-slate-800 border border-slate-700 rounded-md p-3">
                                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Scenario</p>
                                  <p>Return: {(scenarioMetrics.scenario.expected_return * 100).toFixed(1)}%</p>
                                  <p>Risk: {(scenarioMetrics.scenario.risk * 100).toFixed(1)}%</p>
                                  <p>Diversification: {scenarioMetrics.scenario.diversification_score}/100</p>
                                </div>
                              </div>
                              <p className="text-xs text-slate-400">
                                Heuristics: Recession reduces returns and increases correlation; AI Disruption amplifies both upside and volatility.
                              </p>
                            </div>
                          )}
                          {/* Efficient Frontier (stub) */}
                          <PortfolioFrontierCard
                            items={pfItems}
                            correlation={parseFloat(pfCorrelation || '0.2')}
                            baseline={{ expected: pfResult.expected_return, risk: pfResult.risk }}
                            optimized={optimizedSuggestion?.weights || []}
                          />
                        </div>
                      )}
                    </div>

                    {/* CIP Programs Section */}
                    {selectedOccupation && (
                      <div className="mb-6 p-4 bg-[var(--accent-primary)]/10 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <Award className="h-4 w-4 text-[var(--accent-primary)]" />
                            Accredited Programs (CIP)
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              setIsLoadingCIP(true);
                              try {
                                const codeNorm = (selectedOccupation.code || '').replace(/\.00$/, '');
                                const invoke = supabase.functions.invoke('crosswalk', { body: { from: 'SOC', code: codeNorm, to: 'CIP' } }) as Promise<FunctionInvokeResult>;
                                const withTimeout = <T,>(p: Promise<T>, ms: number) => new Promise<T>((resolve, reject) => {
                                  const t = setTimeout(() => reject(new Error('Request timed out')), ms);
                                  p.then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); reject(e); });
                                });
                                const { data, error } = await withTimeout(invoke, 8000);
                                if (error) throw error;
                                const programs = getFirstArrayField(data, ['results', 'mappings', 'items']).map(normalizeCipProgram);
                                setCipPrograms(programs);
                                if (programs.length === 0) {
                                  toast.error('No accredited programs found for this occupation');
                                }
                              } catch (e) {
                                console.error('CIP crosswalk failed:', e);
                                const msg = e instanceof Error ? e.message : 'Failed to load CIP programs';
                                toast.error(msg.includes('timed out') ? 'CIP lookup timed out. Please try again.' : 'Failed to load CIP programs');
                              } finally {
                                setIsLoadingCIP(false);
                              }
                            }}
                            disabled={isLoadingCIP}
                          >
                            {isLoadingCIP ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                            See Accredited Programs
                          </Button>
                        </div>
                        {cipPrograms.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {cipPrograms.slice(0, 5).map((prog, idx) => (
                              <div key={idx} className="p-3 bg-[var(--bg-secondary)] rounded border border-[hsl(var(--border))]">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-sm">{prog.title}</p>
                                    <p className="text-xs text-[var(--text-tertiary)] font-mono">{prog.code}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">{prog.type || 'Program'}</Badge>
                                </div>
                              </div>
                            ))}
                            {cipPrograms.length > 5 && (
                              <p className="text-xs text-[var(--text-tertiary)]">+{cipPrograms.length - 5} more programs</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Learning Path Form */}
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Time Commitment (hrs/week)</label>
                          <Input
                            type="number"
                            value={timeCommitment}
                            onChange={(e) => setTimeCommitment(e.target.value)}
                            placeholder="5"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Learning Style</label>
                          <select
                            className="w-full border rounded-md p-2 text-sm"
                            value={learningStyle}
                            onChange={(e) => setLearningStyle(e.target.value)}
                          >
                            <option value="self-paced">Self-paced</option>
                            <option value="structured">Structured</option>
                            <option value="hands-on">Hands-on</option>
                            <option value="mentored">Mentored</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Budget</label>
                          <select
                            className="w-full border rounded-md p-2 text-sm"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                          >
                            <option value="free">Free only</option>
                            <option value="low">Low ($0-500)</option>
                            <option value="moderate">Moderate ($500-2000)</option>
                            <option value="high">High ($2000+)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Current Salary (optional)</label>
                          <Input
                            type="number"
                            value={currentSalary}
                            onChange={(e) => setCurrentSalary(e.target.value)}
                            placeholder="60000"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Target Salary (optional)</label>
                          <Input
                            type="number"
                            value={targetSalary}
                            onChange={(e) => setTargetSalary(e.target.value)}
                            placeholder="80000"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={async () => {
                          if (!selectedOccupation || skillRecommendations.length === 0) {
                            toast.error('Please select an occupation and view skill recommendations first');
                            return;
                          }
                          setIsGeneratingPath(true);
                          try {
                            const userSkills = skillRecommendations.map(s => ({
                              name: s.name,
                              currentLevel: 1,
                              targetLevel: 5,
                              category: 'technical'
                            }));
                            const { data, error } = await supabase.functions.invoke('generate-learning-path', {
                              body: {
                                targetOccupationCode: selectedOccupation.code,
                                userSkills,
                                targetRole: selectedOccupation.title,
                                currentRole: 'Current Role',
                                timeCommitment: `${timeCommitment} hours/week`,
                                learningStyle,
                                budget,
                                currentSalary: currentSalary ? Number(currentSalary) : undefined,
                                targetSalary: targetSalary ? Number(targetSalary) : undefined,
                                saveToDB: !!user
                              }
                            });
                            if (error) throw error;
                            setLearningPathData(data as LearningPathData);
                            toast.success('Learning path generated!');
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : 'Failed to generate learning path');
                          } finally {
                            setIsGeneratingPath(false);
                          }
                        }}
                        disabled={isGeneratingPath || !selectedOccupation || skillRecommendations.length === 0}
                        className="w-full"
                      >
                        {isGeneratingPath ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Generating Path...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Generate Learning Path
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Learning Path Results */}
                    {learningPathData && learningPathData.learningPath && (
                      <div className="space-y-6">
                        {/* ROI Summary */}
                        {learningPathData.financials ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="p-4 bg-green-50 border-green-200">
                              <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                <h4 className="font-medium text-sm">Total Investment</h4>
                              </div>
                              <p className="text-2xl font-bold text-green-700">
                                ${(learningPathData.financials?.totalCost ?? 0).toLocaleString()}
                              </p>
                            </Card>
                            <Card className="p-4 bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/30">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-5 w-5 text-[var(--accent-primary)]" />
                                <h4 className="font-medium text-sm">Salary Increase</h4>
                              </div>
                              <p className="text-2xl font-bold text-[var(--accent-primary)]">
                                ${(learningPathData.financials?.salaryIncrease ?? 0).toLocaleString()}
                              </p>
                            </Card>
                            <Card className="p-4 bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/20">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-5 w-5 text-[var(--accent-primary)]" />
                                <h4 className="font-medium text-sm">Break-even</h4>
                              </div>
                              <p className="text-2xl font-bold text-[var(--accent-primary)]">
                                {learningPathData.financials?.breakEvenYears || 'N/A'} years
                              </p>
                            </Card>
                          </div>
                        ) : (
                          <div className="p-3 border rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm">
                            ROI metrics are not available for this run. You can still review the learning path and milestones below.
                          </div>
                        )}

                        {/* Path Details */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3">{learningPathData.learningPath.name || 'Learning Path'}</h3>
                          <p className="text-sm text-[var(--text-secondary)] mb-4">{learningPathData.learningPath.description || ''}</p>
                          <div className="flex items-center gap-4 text-sm text-[var(--text-tertiary)] mb-4">
                            <span>Duration: {learningPathData.learningPath.estimatedDuration || 'TBD'}</span>
                            <span>•</span>
                            <span>Skills: {learningPathData.metadata?.skillGapsAddressed || 0}</span>
                            <span>•</span>
                            <span>Weeks: {learningPathData.metadata?.estimatedWeeksToComplete || 0}</span>
                          </div>
                        </div>

                        {/* Milestones */}
                        <div>
                          <h4 className="font-medium mb-3">Learning Milestones</h4>
                          <div className="space-y-3">
                            {(learningPathData.learningPath.milestones || []).map((milestone, idx) => (
                              <div key={milestone.id} className="p-4 border rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium">{milestone.title}</h5>
                                  {milestone.priority && (
                                    <Badge variant={milestone.priority === 'Critical' ? 'destructive' : 'secondary'}>
                                      {milestone.priority}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {milestone.skills.map((skill, sidx) => (
                                    <Badge key={sidx} variant="outline" className="text-xs">{skill}</Badge>
                                  ))}
                                </div>
                                {milestone.duration_weeks && (
                                  <p className="text-xs text-[var(--text-tertiary)]">Duration: {milestone.duration_weeks} weeks</p>
                                )}
                                {milestone.cost_estimate && (
                                  <p className="text-xs text-[var(--text-tertiary)]">Est. Cost: ${milestone.cost_estimate}</p>
                                )}
                                {milestone.skills.length > 0 && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="text-xs p-0 h-auto mt-2"
                                    onClick={async () => {
                                      setSelectedSkillForCourses(milestone.skills[0]);
                                      setIsLoadingCourses(true);
                                      try {
                                        const { data, error } = await supabase.functions.invoke('course-search', {
                                          body: { skills: [milestone.skills[0]], level: 'any', budget: 'any', duration: 'any' }
                                        });
                                        if (error) throw error;
                                        setCoursesForSkill(data?.courses || []);
                                      } catch (e) {
                                        toast.error('Failed to load courses');
                                      } finally {
                                        setIsLoadingCourses(false);
                                      }
                                    }}
                                  >
                                    Find courses for {milestone.skills[0]} →
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Courses for selected skill */}
                        {selectedSkillForCourses && coursesForSkill.length > 0 && (
                          <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                            <h4 className="font-medium mb-3">Courses for {selectedSkillForCourses}</h4>
                            <div className="space-y-2">
                              {coursesForSkill.slice(0, 5).map((course) => (
                                <div key={course.id} className="p-3 bg-[var(--bg-secondary)] rounded border border-[hsl(var(--border))]">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-sm">{course.title}</h5>
                                      <p className="text-xs text-[var(--text-tertiary)]">{course.provider} • {course.duration} • {course.level}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <Badge variant="outline" className="text-xs">{course.price}</Badge>
                                      {course.rating && (
                                        <span className="text-xs text-yellow-600">★ {course.rating}</span>
                                      )}
                                    </div>
                                  </div>
                                  <a
                                    href={course.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-[var(--accent-primary)] hover:underline mt-2 inline-flex items-center gap-1"
                                  >
                                    View Course <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      )}

      {/* Feedback Modal */}
      {feedbackData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Assessment Feedback</h3>
            <p className="mb-4">Is this assessment accurate?</p>
            <div className="flex gap-4 mb-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => submitFeedback(feedbackData.taskId, true)}
              >
                <ThumbsUp className="h-4 w-4 mr-2" />
                Yes, it's accurate
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => submitFeedback(feedbackData.taskId, false)}
              >
                <ThumbsUp className="h-4 w-4 mr-2 rotate-180" />
                No, it's not accurate
              </Button>
            </div>
            <Textarea
              placeholder="Optional: Tell us why you think this assessment is or isn't accurate..."
              className="mb-4"
              value={feedbackData.comment || ''}
              onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFeedbackData(null)}>
                Cancel
              </Button>
              <Button onClick={() => submitFeedback(feedbackData.taskId, feedbackData.isAccurate, feedbackData.comment)}>
                Submit Feedback
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

