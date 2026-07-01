import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, TrendingUp, RefreshCw, Briefcase, Award, DollarSign, Clock, ExternalLink } from 'lucide-react';
import { PortfolioHedgingCard } from '@/components/PortfolioHedgingCard';
import { PortfolioFrontierCard } from '@/components/PortfolioFrontierCard';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Occupation, Skill, LearningPathData, CIPProgram, CourseResult } from '@/components/planner/types';

export interface EducationPathPanelProps {
  selectedOccupation: Occupation | null;
  skillRecommendations: Skill[];
  user: any;
  simHoursPerWeek: number;
  setSimHoursPerWeek: (v: number) => void;
  simRiskTolerance: string;
  setSimRiskTolerance: (v: string) => void;
  simCurrentSalary: string;
  setSimCurrentSalary: (v: string) => void;
  simTargetSalary: string;
  setSimTargetSalary: (v: string) => void;
  runSimulator: () => void;
  isSimulating: boolean;
  simResult: any;
  pfItems: any[];
  updatePfItem: (idx: number, field: string, value: string) => void;
  removePfRow: (idx: number) => void;
  addPfRow: () => void;
  pfCorrelation: string;
  setPfCorrelation: (v: string) => void;
  runPortfolio: () => void;
  isPfLoading: boolean;
  pfResult: any;
  setPfResult: React.Dispatch<React.SetStateAction<any>>;
  currentAlloc: any[];
  optimizedSuggestion: any;
  scenarioMetrics: any;
  scenario: string;
  setScenario: (v: string) => void;
  isLoadingCIP: boolean;
  setIsLoadingCIP: (v: boolean) => void;
  cipPrograms: CIPProgram[];
  setCipPrograms: (v: CIPProgram[]) => void;
  timeCommitment: string;
  setTimeCommitment: (v: string) => void;
  learningStyle: string;
  setLearningStyle: (v: string) => void;
  budget: string;
  setBudget: (v: string) => void;
  currentSalary: string;
  setCurrentSalary: (v: string) => void;
  targetSalary: string;
  setTargetSalary: (v: string) => void;
  isGeneratingPath: boolean;
  setIsGeneratingPath: (v: boolean) => void;
  learningPathData: LearningPathData | null;
  setLearningPathData: (v: LearningPathData | null) => void;
  selectedSkillForCourses: string;
  setSelectedSkillForCourses: (v: string) => void;
  coursesForSkill: CourseResult[];
  setCoursesForSkill: (v: CourseResult[]) => void;
  isLoadingCourses: boolean;
  setIsLoadingCourses: (v: boolean) => void;
  isSimulatorRiskTolerance: (v: string) => boolean;
  getFirstArrayField: (data: any, keys: string[]) => any[];
  normalizeCipProgram: (data: any) => CIPProgram;
}

export function EducationPathPanel(props: EducationPathPanelProps) {
  const {
    selectedOccupation, skillRecommendations, user,
    simHoursPerWeek, setSimHoursPerWeek, simRiskTolerance, setSimRiskTolerance,
    simCurrentSalary, setSimCurrentSalary, simTargetSalary, setSimTargetSalary,
    runSimulator, isSimulating, simResult,
    pfItems, updatePfItem, removePfRow, addPfRow, pfCorrelation, setPfCorrelation,
    runPortfolio, isPfLoading, pfResult, setPfResult, currentAlloc, optimizedSuggestion,
    scenarioMetrics, scenario, setScenario,
    isLoadingCIP, setIsLoadingCIP, cipPrograms, setCipPrograms,
    timeCommitment, setTimeCommitment, learningStyle, setLearningStyle,
    budget, setBudget, currentSalary, setCurrentSalary, targetSalary, setTargetSalary,
    isGeneratingPath, setIsGeneratingPath, learningPathData, setLearningPathData,
    selectedSkillForCourses, setSelectedSkillForCourses, coursesForSkill, setCoursesForSkill,
    isLoadingCourses, setIsLoadingCourses,
    isSimulatorRiskTolerance, getFirstArrayField, normalizeCipProgram,
  } = props;

  return (
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
                  <span>Median salary: ${simResult.median_salary_at_completion}</span>
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
                  weights={pfResult.weights.map((w: any) => ({ skill: w.skill, weight: Number(w.weight) }))}
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
                    const invoke = supabase.functions.invoke('crosswalk', { body: { from: 'SOC', code: codeNorm, to: 'CIP' } });
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
  );
}
