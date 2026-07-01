import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Search, Brain, User, BookOpen, AlertTriangle, CheckCircle, Save, GraduationCap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useSession } from '@/hooks/useSession';
import type {
  Occupation, Task, Skill, Resource, LearningPathData,
  CIPProgram, CourseResult, UserPreferences, FeedbackData,
} from '@/components/planner/types';
import { normalizeOccupation } from '@/components/planner/types';
import { TaskCard, InfoIcon, containerVariants, itemVariants } from '@/components/planner/ui';
import { OccupationSearchPanel } from '@/components/planner/panels/OccupationSearchPanel';
import { ImpactSummaryPanel } from '@/components/planner/panels/ImpactSummaryPanel';
import { TasksAnalysisPanel } from '@/components/planner/panels/TasksAnalysisPanel';
import { SkillsRecommendationPanel } from '@/components/planner/panels/SkillsRecommendationPanel';
import { ReskillingResourcesPanel } from '@/components/planner/panels/ReskillingResourcesPanel';
import { EducationPathPanel } from '@/components/planner/panels/EducationPathPanel';
import { FeedbackModal } from '@/components/planner/panels/FeedbackModal';

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
                <SkillsRecommendationPanel
                  sfSkill={sfSkill}
                  setSfSkill={setSfSkill}
                  sfAcquiredYear={sfAcquiredYear}
                  setSfAcquiredYear={setSfAcquiredYear}
                  estimateFreshness={estimateFreshness}
                  isLoadingFreshness={isLoadingFreshness}
                  freshnessResult={freshnessResult}
                  freshnessDerived={freshnessDerived}
                  compASkill={compASkill}
                  setCompASkill={setCompASkill}
                  compAYear={compAYear}
                  setCompAYear={setCompAYear}
                  compAHalfLife={compAHalfLife}
                  setCompAHalfLife={setCompAHalfLife}
                  compBSkill={compBSkill}
                  setCompBSkill={setCompBSkill}
                  compBYear={compBYear}
                  setCompBYear={setCompBYear}
                  compBHalfLife={compBHalfLife}
                  setCompBHalfLife={setCompBHalfLife}
                  compareLongevity={compareLongevity}
                  isComparing={isComparing}
                  compResult={compResult}
                  skillRecommendations={skillRecommendations}
                  toggleSkillProgress={toggleSkillProgress}
                />
              </TabsContent>

              <TabsContent value="resources">
                <ReskillingResourcesPanel resources={resources} skillRecommendations={skillRecommendations} />
              </TabsContent>

              <TabsContent value="education">
                <EducationPathPanel
                  selectedOccupation={selectedOccupation}
                  skillRecommendations={skillRecommendations}
                  user={user}
                  simHoursPerWeek={simHoursPerWeek}
                  setSimHoursPerWeek={setSimHoursPerWeek}
                  simRiskTolerance={simRiskTolerance}
                  setSimRiskTolerance={setSimRiskTolerance}
                  simCurrentSalary={simCurrentSalary}
                  setSimCurrentSalary={setSimCurrentSalary}
                  simTargetSalary={simTargetSalary}
                  setSimTargetSalary={setSimTargetSalary}
                  runSimulator={runSimulator}
                  isSimulating={isSimulating}
                  simResult={simResult}
                  pfItems={pfItems}
                  updatePfItem={updatePfItem}
                  removePfRow={removePfRow}
                  addPfRow={addPfRow}
                  pfCorrelation={pfCorrelation}
                  setPfCorrelation={setPfCorrelation}
                  runPortfolio={runPortfolio}
                  isPfLoading={isPfLoading}
                  pfResult={pfResult}
                  setPfResult={setPfResult}
                  currentAlloc={currentAlloc}
                  optimizedSuggestion={optimizedSuggestion}
                  scenarioMetrics={scenarioMetrics}
                  scenario={scenario}
                  setScenario={setScenario}
                  isLoadingCIP={isLoadingCIP}
                  setIsLoadingCIP={setIsLoadingCIP}
                  cipPrograms={cipPrograms}
                  setCipPrograms={setCipPrograms}
                  timeCommitment={timeCommitment}
                  setTimeCommitment={setTimeCommitment}
                  learningStyle={learningStyle}
                  setLearningStyle={setLearningStyle}
                  budget={budget}
                  setBudget={setBudget}
                  currentSalary={currentSalary}
                  setCurrentSalary={setCurrentSalary}
                  targetSalary={targetSalary}
                  setTargetSalary={setTargetSalary}
                  isGeneratingPath={isGeneratingPath}
                  setIsGeneratingPath={setIsGeneratingPath}
                  learningPathData={learningPathData}
                  setLearningPathData={setLearningPathData}
                  selectedSkillForCourses={selectedSkillForCourses}
                  setSelectedSkillForCourses={setSelectedSkillForCourses}
                  coursesForSkill={coursesForSkill}
                  setCoursesForSkill={setCoursesForSkill}
                  isLoadingCourses={isLoadingCourses}
                  setIsLoadingCourses={setIsLoadingCourses}
                  isSimulatorRiskTolerance={isSimulatorRiskTolerance}
                  getFirstArrayField={getFirstArrayField}
                  normalizeCipProgram={normalizeCipProgram}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      )}

      <FeedbackModal
        feedbackData={feedbackData}
        setFeedbackData={setFeedbackData}
        submitFeedback={submitFeedback}
      />
    </div>
  );
}
