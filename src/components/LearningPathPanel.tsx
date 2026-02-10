
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Target, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  Circle,
  Loader2,
  Lightbulb,
  Calendar,
  Award
} from 'lucide-react';
import { useCareerPlanningStorage, LearningPath, Milestone } from '@/hooks/useCareerPlanningStorage';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getCourseLink, getGenericCourseSearchUrl } from '@/lib/affiliateLinks';
import { trackEvent } from '@/lib/posthog';

export function LearningPathPanel() {
  const { 
    userSkills, 
    learningPaths, 
    saveLearningPaths, 
    userProfile 
  } = useCareerPlanningStorage();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);

  useEffect(() => {
    if (learningPaths.length > 0) {
      setSelectedPath(learningPaths[0]);
    }
  }, [learningPaths]);

  const handleGenerateLearningPath = async () => {
    if (userSkills.length === 0) {
      toast.error('Please add some skills first to generate a learning path');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-learning-path', {
        body: {
          userSkills,
          targetRole: userProfile?.targetRole || 'Target Role',
          currentRole: userProfile?.currentRole || 'Current Role',
          timeCommitment: userProfile?.preferences?.timeCommitment || '5',
          learningStyle: userProfile?.preferences?.learningStyle || 'mixed',
          budget: userProfile?.preferences?.budget || 'moderate'
        }
      });

      if (error) {
        console.error('Learning path generation error:', error);
        toast.error('Failed to generate learning path. Please try again.');
        return;
      }

      if (data?.learningPath) {
        const newPaths = [data.learningPath, ...learningPaths];
        saveLearningPaths(newPaths);
        setSelectedPath(data.learningPath);
        toast.success('AI-powered learning path generated successfully!');
      }

    } catch (error) {
      console.error('Learning path generation error:', error);
      toast.error('Failed to generate learning path. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleMilestone = (pathId: string, milestoneId: string) => {
    const updatedPaths = learningPaths.map(path => {
      if (path.id === pathId) {
        return {
          ...path,
          milestones: path.milestones.map(milestone => {
            if (milestone.id === milestoneId) {
              return { ...milestone, completed: !milestone.completed };
            }
            return milestone;
          })
        };
      }
      return path;
    });
    
    saveLearningPaths(updatedPaths);
    
    if (selectedPath && selectedPath.id === pathId) {
      const updatedSelectedPath = updatedPaths.find(p => p.id === pathId);
      if (updatedSelectedPath) {
        setSelectedPath(updatedSelectedPath);
      }
    }
  };

  const getProgress = (path: LearningPath) => {
    if (path.milestones.length === 0) return 0;
    const completed = path.milestones.filter(m => m.completed).length;
    return (completed / path.milestones.length) * 100;
  };

  const getDifficultyColor = (difficulty: string | undefined) => {
    if (!difficulty) return 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]';
    
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]';
    }
  };

  const isOverdue = (targetDate: string) => {
    return new Date(targetDate) < new Date();
  };

  if (userSkills.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8 text-[var(--text-tertiary)]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">No Skills Added Yet</h3>
            <p className="text-[var(--text-secondary)] max-w-md mx-auto">
              Add some skills in the Skills Management section to generate personalized learning paths
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Learning Paths</h2>
          <p className="text-[var(--text-secondary)]">AI-generated personalized learning journeys to achieve your career goals</p>
        </div>
        
        <Button 
          onClick={handleGenerateLearningPath}
          disabled={isGenerating}
          className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[var(--bg-primary)] flex items-center gap-2"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Lightbulb className="w-4 h-4" />
          )}
          {isGenerating ? 'Generating Path...' : 'Generate AI Learning Path'}
        </Button>
      </div>

      {learningPaths.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-[var(--accent-primary)]/10 rounded-full flex items-center justify-center mx-auto">
              <Target className="w-8 h-8 text-[var(--accent-primary)]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">Ready to Create Your Learning Path?</h3>
              <p className="text-[var(--text-secondary)] max-w-md mx-auto">
                Click "Generate AI Learning Path" to create a personalized learning journey based on your skills and career goals
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Learning Paths List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Your Learning Paths</h3>
            <div className="space-y-3">
              {learningPaths.map((path, index) => (
                <motion.div
                  key={path.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedPath?.id === path.id ? 'ring-2 ring-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : ''
                    }`}
                    onClick={() => setSelectedPath(path)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-[var(--text-primary)] line-clamp-2">{path.name}</h4>
                          <Badge className={getDifficultyColor(path.difficulty)}>
                            {path.difficulty || 'Unknown'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{path.description}</p>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-secondary)]">Progress</span>
                            <span className="font-medium">{Math.round(getProgress(path))}%</span>
                          </div>
                          <Progress value={getProgress(path)} className="h-2" />
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{path.estimatedDuration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>{path.milestones.length} milestones</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Selected Path Details */}
          {selectedPath && (
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{selectedPath.name}</CardTitle>
                      <p className="text-[var(--text-secondary)]">{selectedPath.description}</p>
                    </div>
                    <Badge className={getDifficultyColor(selectedPath.difficulty)}>
                      {selectedPath.difficulty || 'Unknown'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Path Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-[var(--bg-tertiary)] rounded-lg">
                      <Clock className="w-6 h-6 text-[var(--accent-primary)] mx-auto mb-2" />
                      <p className="text-sm font-medium text-[var(--text-primary)]">{selectedPath.estimatedDuration}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Duration</p>
                    </div>
                    
                    <div className="text-center p-4 bg-[var(--bg-tertiary)] rounded-lg">
                      <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-[var(--text-primary)]">{selectedPath.milestones.length}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Milestones</p>
                    </div>
                    
                    <div className="text-center p-4 bg-[var(--bg-tertiary)] rounded-lg">
                      <TrendingUp className="w-6 h-6 text-[var(--accent-primary)] mx-auto mb-2" />
                      <p className="text-sm font-medium text-[var(--text-primary)]">{Math.round(getProgress(selectedPath))}%</p>
                      <p className="text-xs text-[var(--text-secondary)]">Complete</p>
                    </div>
                  </div>

                  {/* Skills Covered — with course links */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-[var(--text-primary)]">Skills Covered</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPath.skills.map((skill, index) => {
                        const course = getCourseLink(skill);
                        const courseUrl = course?.url || getGenericCourseSearchUrl(skill);
                        return (
                          <a
                            key={index}
                            href={courseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackEvent('affiliate_course_clicked', { skill, provider: course?.provider || 'coursera_search', course_title: course?.title || 'search' })}
                            className="group"
                            title={course ? `Learn: ${course.title} (${course.estimatedTime})` : `Find courses for ${skill}`}
                          >
                            <Badge variant="secondary" className="cursor-pointer group-hover:bg-[var(--accent-primary)]/20 group-hover:border-[var(--accent-primary)]/40 transition-colors">
                              {skill}
                              <BookOpen className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100" />
                            </Badge>
                          </a>
                        );
                      })}
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)]">Click any skill to find recommended courses</p>
                  </div>

                  {/* Prerequisites */}
                  {selectedPath.prerequisites && selectedPath.prerequisites.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-[var(--text-primary)]">Prerequisites</h4>
                      <ul className="space-y-1">
                        {selectedPath.prerequisites.map((prereq, index) => (
                          <li key={index} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full mt-2 flex-shrink-0" />
                            {prereq}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[var(--accent-primary)]" />
                    Learning Milestones
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {selectedPath.milestones.map((milestone, index) => (
                      <motion.div
                        key={milestone.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`p-4 border rounded-lg transition-all duration-200 ${
                          milestone.completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-[var(--bg-secondary)] border-[hsl(var(--border))] hover:border-[var(--accent-primary)]/30'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleMilestone(selectedPath.id, milestone.id)}
                            className="p-0 h-auto hover:bg-transparent"
                          >
                            {milestone.completed ? (
                              <CheckCircle2 className="w-6 h-6 text-green-600" />
                            ) : (
                              <Circle className="w-6 h-6 text-[var(--text-tertiary)]" />
                            )}
                          </Button>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <h5 className={`font-medium ${
                                milestone.completed ? 'text-green-900' : 'text-[var(--text-primary)]'
                              }`}>
                                {milestone.title}
                              </h5>
                              
                              <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
                                <Calendar className="w-4 h-4" />
                                <span className={isOverdue(milestone.targetDate) && !milestone.completed ? 'text-red-600' : ''}>
                                  {new Date(milestone.targetDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            <p className={`text-sm ${
                              milestone.completed ? 'text-green-700' : 'text-[var(--text-secondary)]'
                            }`}>
                              {milestone.description}
                            </p>
                            
                            {milestone.skills && milestone.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {milestone.skills.map((skill, skillIndex) => (
                                  <Badge 
                                    key={skillIndex} 
                                    variant="outline" 
                                    className="text-xs"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
