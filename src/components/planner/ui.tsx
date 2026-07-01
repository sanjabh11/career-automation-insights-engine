import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Notebook as Robot, Zap, User, ThumbsUp } from 'lucide-react';
import type { Task } from '@/components/planner/types';

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Automate': return 'bg-red-50 border-red-200';
    case 'Augment': return 'bg-yellow-50 border-yellow-200';
    case 'Human-only': return 'bg-green-50 border-green-200';
    default: return 'bg-[var(--bg-tertiary)] border-[hsl(var(--border))]';
  }
};

export const getCategoryTextColor = (category: string) => {
  switch (category) {
    case 'Automate': return 'text-red-700';
    case 'Augment': return 'text-yellow-700';
    case 'Human-only': return 'text-green-700';
    default: return 'text-[var(--text-secondary)]';
  }
};

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Automate': return <Robot className="h-5 w-5 text-red-600" />;
    case 'Augment': return <Zap className="h-5 w-5 text-yellow-600" />;
    case 'Human-only': return <User className="h-5 w-5 text-green-600" />;
    default: return null;
  }
};

export interface TaskCardProps {
  task: Task;
  onFeedback: (isAccurate: boolean, comment?: string) => void;
}

export const TaskCard = ({ task, onFeedback }: TaskCardProps) => {
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className={`p-4 rounded-lg border ${getCategoryColor(task.category)}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1">
          {getCategoryIcon(task.category)}
        </div>
        <div className="flex-1">
          <div className="flex justify-between">
            <p className="font-medium">{task.description}</p>
            {task.isCustom && (
              <Badge variant="outline" className="text-xs">Custom</Badge>
            )}
          </div>
          {task.explanation && (
            <p className={`text-sm mt-1 ${getCategoryTextColor(task.category)}`}>
              {task.explanation}
            </p>
          )}
          <div className="flex items-center justify-between mt-2">
            {task.confidence && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-tertiary)]">Confidence:</span>
                <Progress
                  value={task.confidence * 100}
                  className="h-1.5 w-24"
                />
                <span className="text-xs text-[var(--text-tertiary)]">
                  {Math.round(task.confidence * 100)}%
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setShowFeedback(!showFeedback)}
            >
              {showFeedback ? 'Cancel' : 'Provide Feedback'}
            </Button>
          </div>

          {showFeedback && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm mb-2">Is this assessment accurate?</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onFeedback(true)}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Yes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onFeedback(false)}
                >
                  <ThumbsUp className="h-3 w-3 mr-1 rotate-180" />
                  No
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const InfoIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
