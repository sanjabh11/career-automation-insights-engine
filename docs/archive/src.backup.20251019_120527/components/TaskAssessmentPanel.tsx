import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Brain, CheckCircle, AlertTriangle, Info, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TaskAssessmentPanelProps {
  occupationTitle?: string;
}

type AssessmentCategory = 'Automate' | 'Augment' | 'Human-only';

interface TaskAssessment {
  category: AssessmentCategory;
  explanation: string;
  confidence: number;
}

export function TaskAssessmentPanel({ occupationTitle }: TaskAssessmentPanelProps) {
  const [taskDescription, setTaskDescription] = useState('');
  const [isAssessing, setIsAssessing] = useState(false);
  const [assessment, setAssessment] = useState<TaskAssessment | null>(null);
  const [recentAssessments, setRecentAssessments] = useState<Array<{ task: string; assessment: TaskAssessment }>>([]);

  const handleAssessTask = async () => {
    if (!taskDescription.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    setIsAssessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('assess-task', {
        body: { 
          taskDescription: taskDescription.trim(),
          occupationContext: occupationTitle
        },
      });

      if (error) throw error;
      
      const result: TaskAssessment = {
        category: data.category,
        explanation: data.explanation,
        confidence: data.confidence
      };
      
      setAssessment(result);
      
      // Add to recent assessments
      setRecentAssessments(prev => {
        const newAssessments = [
          { task: taskDescription, assessment: result },
          ...prev
        ].slice(0, 5); // Keep only the 5 most recent
        
        // Save to localStorage
        localStorage.setItem('recentTaskAssessments', JSON.stringify(newAssessments));
        
        return newAssessments;
      });
      
      toast.success('Task assessment completed');
    } catch (error) {
      console.error('Task assessment error:', error);
      toast.error('Failed to assess task. Please try again.');
    } finally {
      setIsAssessing(false);
    }
  };

  // Load recent assessments from localStorage on component mount
  React.useEffect(() => {
    const savedAssessments = localStorage.getItem('recentTaskAssessments');
    if (savedAssessments) {
      try {
        setRecentAssessments(JSON.parse(savedAssessments));
      } catch (e) {
        console.error('Error parsing saved assessments:', e);
      }
    }
  }, []);

  const getCategoryIcon = (category: AssessmentCategory) => {
    switch (category) {
      case 'Automate':
        return <Brain className="w-5 h-5 text-red-500" />;
      case 'Augment':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'Human-only':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryColor = (category: AssessmentCategory) => {
    switch (category) {
      case 'Automate':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Augment':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Human-only':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          Task Automation Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Enter a specific task you perform in your job to assess its automation potential.
            {occupationTitle && ` Context: ${occupationTitle}`}
          </p>
          <Textarea
            placeholder="Describe a specific task you perform in your job..."
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            className="min-h-[100px]"
            disabled={isAssessing}
          />
          <Button 
            onClick={handleAssessTask} 
            disabled={isAssessing || !taskDescription.trim()}
            className="w-full"
          >
            {isAssessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Task...
              </>
            ) : (
              'Assess Task'
            )}
          </Button>
        </div>

        {assessment && (
          <div className={`p-4 rounded-lg border ${getCategoryColor(assessment.category)}`}>
            <div className="flex items-start gap-3">
              {getCategoryIcon(assessment.category)}
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Category: {assessment.category}</h3>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(assessment.confidence * 100)}% confidence
                  </Badge>
                </div>
                <p className="text-sm">{assessment.explanation}</p>
                <Progress value={assessment.confidence * 100} className="h-2" />
              </div>
            </div>
          </div>
        )}

        {recentAssessments.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Recent Assessments</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recentAssessments.map((item, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border text-sm ${getCategoryColor(item.assessment.category)}`}
                >
                  <div className="flex items-start gap-2">
                    {getCategoryIcon(item.assessment.category)}
                    <div className="flex-1">
                      <p className="font-medium">{item.task}</p>
                      <p className="text-xs mt-1">{item.assessment.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}