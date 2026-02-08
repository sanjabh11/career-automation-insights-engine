import { AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface UsageLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: 'apo_analysis' | 'ai_coach_message' | 'roadmap_generation' | 'saved_analysis';
  currentUsage: number;
  limit: number;
  onUpgrade: () => void;
}

const resourceLabels = {
  apo_analysis: 'APO Analyses',
  ai_coach_message: 'AI Coach Messages',
  roadmap_generation: 'Career Roadmaps',
  saved_analysis: 'Saved Analyses'
};

const resourceDescriptions = {
  apo_analysis: 'Unlock unlimited automation risk assessments to explore all career paths',
  ai_coach_message: 'Get unlimited AI coaching to guide your career decisions',
  roadmap_generation: 'Create unlimited personalized career transition roadmaps',
  saved_analysis: 'Save and organize unlimited career analyses for future reference'
};

export function UsageLimitModal({
  open,
  onOpenChange,
  resourceType,
  currentUsage,
  limit,
  onUpgrade
}: UsageLimitModalProps) {
  const percentage = (currentUsage / limit) * 100;
  const label = resourceLabels[resourceType];
  const description = resourceDescriptions[resourceType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-orange-100">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <DialogTitle>Usage Limit Reached</DialogTitle>
          </div>
          <DialogDescription>
            You've reached your monthly limit for {label.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Usage Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Usage</span>
              <Badge variant="secondary">
                {currentUsage} / {limit}
              </Badge>
            </div>
            <Progress value={percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {percentage.toFixed(0)}% of your monthly allowance used
            </p>
          </div>

          {/* Upgrade Benefits */}
          <div className="bg-gradient-to-br from-[var(--accent-primary)]/5 to-[var(--accent-amber)]/5 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[var(--accent-primary)]" />
              <h4 className="font-semibold">Upgrade to Pro</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>Unlimited {label.toLowerCase()}</span>
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>Advanced analytics</span>
              </li>
            </ul>
            <div className="pt-2 border-t">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">$29</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cancel anytime • 14-day money-back guarantee
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button
            onClick={() => {
              onUpgrade();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto"
          >
            <Zap className="h-4 w-4 mr-2" />
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
