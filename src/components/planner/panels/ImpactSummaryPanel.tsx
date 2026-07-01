import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Notebook as Robot, Zap, User, AlertTriangle } from 'lucide-react';

export interface ImpactSummaryPanelProps {
  taskCounts: { Automate: number; Augment: number; 'Human-only': number };
  getPercentage: (count: number) => number;
}

export function ImpactSummaryPanel({ taskCounts, getPercentage }: ImpactSummaryPanelProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">AI Impact Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Robot className="h-5 w-5 text-red-600" />
                <span className="font-medium">Automate</span>
              </div>
              <Badge variant="outline" className="text-red-600">
                {taskCounts.Automate} tasks
              </Badge>
            </div>
            <Progress value={getPercentage(taskCounts.Automate)} className="h-2 bg-red-200" />
            <p className="text-xs text-red-700 mt-2">
              Tasks that can be fully automated by AI
            </p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span className="font-medium">Augment</span>
              </div>
              <Badge variant="outline" className="text-yellow-600">
                {taskCounts.Augment} tasks
              </Badge>
            </div>
            <Progress value={getPercentage(taskCounts.Augment)} className="h-2 bg-yellow-200" />
            <p className="text-xs text-yellow-700 mt-2">
              Tasks where AI can assist but humans are still needed
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                <span className="font-medium">Human-only</span>
              </div>
              <Badge variant="outline" className="text-green-600">
                {taskCounts['Human-only']} tasks
              </Badge>
            </div>
            <Progress value={getPercentage(taskCounts['Human-only'])} className="h-2 bg-green-200" />
            <p className="text-xs text-green-700 mt-2">
              Tasks that require human skills and cannot be automated
            </p>
          </div>
        </div>

        <div className="bg-[var(--accent-primary)]/10 p-4 rounded-lg">
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-[var(--accent-primary)]" />
            What This Means For You
          </h4>
          <p className="text-sm text-[var(--text-secondary)]">
            {getPercentage(taskCounts.Automate) > 50 ? (
              "A significant portion of tasks in your role could be automated. Focus on developing skills that complement AI and prepare for role evolution."
            ) : getPercentage(taskCounts.Augment) > 50 ? (
              "Your role is likely to be augmented rather than replaced. Learn to collaborate effectively with AI tools to enhance your productivity."
            ) : (
              "Your role contains many tasks that require human skills. Continue developing these while learning to use AI for support with routine tasks."
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
