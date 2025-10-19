
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Target, Lightbulb, RefreshCw } from 'lucide-react';
import { useCareerPlanningStorage, SkillGap } from '@/hooks/useCareerPlanningStorage';
import { motion } from 'framer-motion';

export function SkillGapAnalysisPanel() {
  const { userSkills, skillGaps, saveSkillGaps, analyzeSkillGaps } = useCareerPlanningStorage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (userSkills.length > 0) {
      const gaps = analyzeSkillGaps(userSkills);
      saveSkillGaps(gaps);
    }
  }, [userSkills]);

  const handleRefreshAnalysis = async () => {
    setIsAnalyzing(true);
    // Simulate analysis time
    await new Promise(resolve => setTimeout(resolve, 1000));
    const gaps = analyzeSkillGaps(userSkills);
    saveSkillGaps(gaps);
    setIsAnalyzing(false);
  };

  const getPriorityColor = (priority: SkillGap['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: SkillGap['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'medium':
        return <TrendingUp className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <Target className="w-4 h-4 text-green-600" />;
      default:
        return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const groupedGaps = skillGaps.reduce((acc, gap) => {
    if (!acc[gap.priority]) {
      acc[gap.priority] = [];
    }
    acc[gap.priority].push(gap);
    return acc;
  }, {} as Record<string, SkillGap[]>);

  if (userSkills.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">No Skills to Analyze</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Add some skills in the Skills Management section to see your skill gap analysis
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
          <h2 className="text-2xl font-bold text-gray-900">Skill Gap Analysis</h2>
          <p className="text-gray-600">Identify areas where you need to improve to reach your target levels</p>
        </div>
        
        <Button 
          onClick={handleRefreshAnalysis}
          disabled={isAnalyzing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>

      {skillGaps.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-green-900">Great Job!</h3>
              <p className="text-green-700 max-w-md mx-auto">
                You've reached your target levels for all skills. Consider setting higher targets or adding new skills to continue growing.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">High Priority</p>
                    <p className="text-2xl font-bold text-red-900">{groupedGaps.high?.length || 0}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Medium Priority</p>
                    <p className="text-2xl font-bold text-yellow-900">{groupedGaps.medium?.length || 0}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Low Priority</p>
                    <p className="text-2xl font-bold text-green-900">{groupedGaps.low?.length || 0}</p>
                  </div>
                  <Target className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skill Gaps by Priority */}
          {(['high', 'medium', 'low'] as const).map((priority) => {
            const gaps = groupedGaps[priority];
            if (!gaps || gaps.length === 0) return null;

            return (
              <div key={priority} className="space-y-4">
                <div className="flex items-center gap-3">
                  {getPriorityIcon(priority)}
                  <h3 className="text-xl font-semibold text-gray-900 capitalize">
                    {priority} Priority Skills
                  </h3>
                  <Badge className={getPriorityColor(priority)}>
                    {gaps.length} skill{gaps.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {gaps.map((gap, index) => (
                    <motion.div
                      key={gap.skillId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-all duration-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg font-semibold text-gray-900">
                                {gap.skillName}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  Gap: {gap.gapSize} levels
                                </Badge>
                                <Badge className={getPriorityColor(gap.priority)}>
                                  {gap.priority}
                                </Badge>
                              </div>
                            </div>
                            {getPriorityIcon(gap.priority)}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Current Level</span>
                              <span className="font-medium">Level {gap.currentLevel}</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Target Level</span>
                              <span className="font-medium">Level {gap.targetLevel}</span>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Progress Needed</span>
                                <span className="font-medium">{gap.gapSize} levels</span>
                              </div>
                              <Progress 
                                value={(gap.currentLevel / gap.targetLevel) * 100} 
                                className="h-2"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-900">Recommendations</span>
                            </div>
                            
                            <div className="space-y-2">
                              {gap.recommendations.slice(0, 3).map((recommendation, idx) => (
                                <div key={idx} className="flex items-start gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded-lg">
                                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                                  <span>{recommendation}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
