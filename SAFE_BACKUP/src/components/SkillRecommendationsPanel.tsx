import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, BookOpen, ExternalLink, Star, Clock, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SkillRecommendationsProps {
  occupationTitle?: string;
  occupationCode?: string;
}

interface SkillRecommendation {
  skill_name: string;
  explanation: string;
  priority: number;
}

interface LearningResource {
  title: string;
  url: string;
  provider: string;
  cost_type: string;
  description?: string;
}

export function SkillRecommendationsPanel({ occupationTitle, occupationCode }: SkillRecommendationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<SkillRecommendation[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [trackedSkills, setTrackedSkills] = useState<Record<string, number>>({});

  // Load tracked skills from localStorage
  useEffect(() => {
    const savedSkills = localStorage.getItem('trackedSkills');
    if (savedSkills) {
      try {
        setTrackedSkills(JSON.parse(savedSkills));
      } catch (e) {
        console.error('Error parsing saved skills:', e);
      }
    }
  }, []);

  // Save tracked skills to localStorage when updated
  useEffect(() => {
    localStorage.setItem('trackedSkills', JSON.stringify(trackedSkills));
  }, [trackedSkills]);

  const fetchRecommendations = async () => {
    if (!occupationCode) {
      toast.error('Please select an occupation first');
      return;
    }

    setIsLoading(true);
    try {
      // First check if we have cached recommendations
      const { data: cachedRecommendations, error: cacheError } = await supabase
        .from('ai_skill_recommendations')
        .select('*')
        .eq('occupation_code', occupationCode)
        .order('priority', { ascending: true });

      if (!cacheError && cachedRecommendations && cachedRecommendations.length > 0) {
        setRecommendations(cachedRecommendations);
        toast.success('Skill recommendations loaded');
      } else {
        // If no cached data, fetch from the API
        const { data, error } = await supabase.functions.invoke('skill-recommendations', {
          body: { 
            occupation_code: occupationCode,
            occupation_title: occupationTitle
          },
        });

        if (error) throw error;
        
        setRecommendations(data);
        toast.success('Skill recommendations generated');
      }

      // Fetch learning resources
      await fetchLearningResources();
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      toast.error('Failed to fetch skill recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLearningResources = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_reskilling_resources')
        .select('*')
        .limit(5);

      if (error) throw error;
      
      setResources(data || []);
    } catch (error) {
      console.error('Failed to fetch learning resources:', error);
    }
  };

  const updateSkillProgress = (skillName: string, progress: number) => {
    setTrackedSkills(prev => ({
      ...prev,
      [skillName]: progress
    }));
    toast.success(`Progress updated for ${skillName}`);
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return { label: 'High', color: 'bg-red-100 text-red-800' };
      case 2: return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
      case 3: return { label: 'Low', color: 'bg-green-100 text-green-800' };
      default: return { label: 'Medium', color: 'bg-blue-100 text-blue-800' };
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-600" />
          Skill Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {occupationTitle ? (
          <p className="text-sm text-gray-600">
            Based on AI impact analysis for <span className="font-medium">{occupationTitle}</span>
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            Select an occupation to get personalized skill recommendations
          </p>
        )}

        <Button 
          onClick={fetchRecommendations} 
          disabled={isLoading || !occupationCode}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Skills...
            </>
          ) : (
            'Get Skill Recommendations'
          )}
        </Button>

        {recommendations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Recommended Skills to Develop</h3>
            <div className="space-y-3">
              {recommendations.map((rec, index) => {
                const priority = getPriorityLabel(rec.priority);
                const progress = trackedSkills[rec.skill_name] || 0;
                
                return (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <h4 className="font-medium">{rec.skill_name}</h4>
                      </div>
                      <Badge className={priority.color}>
                        {priority.label} Priority
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{rec.explanation}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Learning Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex gap-2 mt-2">
                        {[25, 50, 75, 100].map(value => (
                          <Button 
                            key={value} 
                            variant="outline" 
                            size="sm"
                            className="text-xs flex-1"
                            onClick={() => updateSkillProgress(rec.skill_name, value)}
                          >
                            {value}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {resources.length > 0 && (
          <div className="space-y-3 mt-6">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Learning Resources
            </h3>
            <div className="space-y-2">
              {resources.map((resource, index) => (
                <a 
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border rounded-lg flex items-start gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-blue-600">{resource.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {resource.cost_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Provider: {resource.provider}</p>
                    {resource.description && (
                      <p className="text-sm text-gray-700 mt-2">{resource.description}</p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}