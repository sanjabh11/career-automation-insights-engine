import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, RefreshCw, ThumbsUp, Notebook as Robot, Zap, User } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { TaskCard } from '@/components/planner/ui';
import { OutcomeSurvey } from '@/components/outcomes/OutcomeSurvey';
import { OutcomesList } from '@/components/outcomes/OutcomesList';
import type { Task } from '@/components/planner/types';

export interface TasksAnalysisPanelProps {
  customTask: string;
  setCustomTask: (v: string) => void;
  assessCustomTask: () => void;
  isAssessingTask: boolean;
  computeResistance: () => void;
  isComputingResistance: boolean;
  resistanceResult: {
    resistance_score?: number | string;
    category?: string;
    timeline_years?: number | string;
  } | null;
  confidenceFilter: number;
  setConfidenceFilter: (v: number) => void;
  isLoading: boolean;
  tasks: Task[];
  submitFeedback: (taskId: string, isAccurate: boolean, comment?: string) => void;
}

export function TasksAnalysisPanel({
  customTask,
  setCustomTask,
  assessCustomTask,
  isAssessingTask,
  computeResistance,
  isComputingResistance,
  resistanceResult,
  confidenceFilter,
  setConfidenceFilter,
  isLoading,
  tasks,
  submitFeedback,
}: TasksAnalysisPanelProps) {
  const filteredTasks = useMemo(
    () => tasks.filter(task => task.confidence ? task.confidence * 100 >= confidenceFilter : true),
    [tasks, confidenceFilter]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-[var(--accent-primary)]" />
          Task Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Assess Your Own Task</h3>
          <div className="flex flex-col md:flex-row gap-2">
            <Textarea
              placeholder="Describe a specific task you perform in your job..."
              value={customTask}
              onChange={(e) => setCustomTask(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={assessCustomTask}
              disabled={isAssessingTask || !customTask.trim()}
              className="md:self-end"
            >
              {isAssessingTask ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Assessing...
                </>
              ) : (
                'Assess Task'
              )}
            </Button>
            <Button
              onClick={computeResistance}
              disabled={isComputingResistance || !customTask.trim()}
              className="md:self-end"
              variant="outline"
            >
              {isComputingResistance ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Scoring...
                </>
              ) : (
                'Resistance Score'
              )}
            </Button>
          </div>
          {resistanceResult && (
            <div className="mt-3 p-3 bg-green-50 rounded-md text-sm text-green-800">
              <div className="flex items-center justify-between">
                <span>Resistance: {typeof resistanceResult.resistance_score === 'number' ? resistanceResult.resistance_score.toFixed(2) : resistanceResult.resistance_score} ({resistanceResult.category})</span>
                <Badge variant="outline">{resistanceResult.timeline_years} yrs</Badge>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-6" />

        {/* Confidence filter */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Confidence Filter: {confidenceFilter}%+</h3>
            <div className="w-1/2">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Adjust to filter tasks by AI confidence score
          </p>
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <LoadingSpinner size="md" text="Analyzing tasks..." />
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Robot className="h-5 w-5 text-red-600" />
                Tasks to Automate
              </h3>
              <div className="space-y-3">
                {filteredTasks.filter(t => t.category === 'Automate').map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onFeedback={(isAccurate, comment) => submitFeedback(task.id, isAccurate, comment)}
                  />
                ))}
                {filteredTasks.filter(t => t.category === 'Automate').length === 0 && (
                  <p className="text-[var(--text-tertiary)] text-sm italic">No tasks in this category</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Tasks to Augment
              </h3>
              <div className="space-y-3">
                {filteredTasks.filter(t => t.category === 'Augment').map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onFeedback={(isAccurate, comment) => submitFeedback(task.id, isAccurate, comment)}
                  />
                ))}
                {filteredTasks.filter(t => t.category === 'Augment').length === 0 && (
                  <p className="text-[var(--text-tertiary)] text-sm italic">No tasks in this category</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                Human-only Tasks
              </h3>
              <div className="space-y-3">
                {filteredTasks.filter(t => t.category === 'Human-only').map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onFeedback={(isAccurate, comment) => submitFeedback(task.id, isAccurate, comment)}
                  />
                ))}
                {filteredTasks.filter(t => t.category === 'Human-only').length === 0 && (
                  <p className="text-[var(--text-tertiary)] text-sm italic">No tasks in this category</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--text-tertiary)]">
            {tasks.length > 0 ?
              'No tasks match your confidence filter. Try lowering the threshold.' :
              'No tasks available for this occupation.'}
          </div>
        )}

        {/* Outcomes */}
        <div className="mt-8 space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-green-600" />
            Track Outcomes
          </h4>
          <OutcomeSurvey />
          <OutcomesList />
        </div>
      </CardContent>
    </Card>
  );
}
