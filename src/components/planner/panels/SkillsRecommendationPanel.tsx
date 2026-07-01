import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Brain, RefreshCw, Lightbulb } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { HelpTrigger } from '@/components/help/HelpTrigger';
import { SkillFreshnessAlerts } from '@/components/SkillFreshnessAlerts';
import type { Skill } from '@/components/planner/types';

export interface SkillsRecommendationPanelProps {
  sfSkill: string;
  setSfSkill: (v: string) => void;
  sfAcquiredYear: string;
  setSfAcquiredYear: (v: string) => void;
  estimateFreshness: () => void;
  isLoadingFreshness: boolean;
  freshnessResult: any;
  freshnessDerived: any;
  compASkill: string;
  setCompASkill: (v: string) => void;
  compAYear: string;
  setCompAYear: (v: string) => void;
  compAHalfLife: string;
  setCompAHalfLife: (v: string) => void;
  compBSkill: string;
  setCompBSkill: (v: string) => void;
  compBYear: string;
  setCompBYear: (v: string) => void;
  compBHalfLife: string;
  setCompBHalfLife: (v: string) => void;
  compareLongevity: () => void;
  isComparing: boolean;
  compResult: any;
  skillRecommendations: Skill[];
  toggleSkillProgress: (name: string) => void;
}

export function SkillsRecommendationPanel({
  sfSkill, setSfSkill, sfAcquiredYear, setSfAcquiredYear,
  estimateFreshness, isLoadingFreshness, freshnessResult, freshnessDerived,
  compASkill, setCompASkill, compAYear, setCompAYear, compAHalfLife, setCompAHalfLife,
  compBSkill, setCompBSkill, compBYear, setCompBYear, compBHalfLife, setCompBHalfLife,
  compareLongevity, isComparing, compResult,
  skillRecommendations, toggleSkillProgress,
}: SkillsRecommendationPanelProps) {
  return (
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
                {compResult.skills.map((s: any) => (
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
  );
}
