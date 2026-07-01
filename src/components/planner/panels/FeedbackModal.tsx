import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp } from 'lucide-react';
import type { FeedbackData } from '@/components/planner/types';

export interface FeedbackModalProps {
  feedbackData: FeedbackData | null;
  setFeedbackData: (data: FeedbackData | null) => void;
  submitFeedback: (taskId: string, isAccurate: boolean, comment?: string) => void;
}

export function FeedbackModal({ feedbackData, setFeedbackData, submitFeedback }: FeedbackModalProps) {
  if (!feedbackData) return null;

  return (
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
  );
}
