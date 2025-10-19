import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  Clock, 
  Award, 
  Plus, 
  Calendar,
  BookOpen,
  Target,
  BarChart3
} from 'lucide-react';
import { useCareerPlanningStorage, ProgressTracking } from '@/hooks/useCareerPlanningStorage';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export function ProgressTrackingPanel() {
  const { 
    progressTracking, 
    saveProgressTracking, 
    userSkills, 
    updateSkillProgress 
  } = useCareerPlanningStorage();
  
  const [isLoggingProgress, setIsLoggingProgress] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [newLevel, setNewLevel] = useState(1);
  const [hoursSpent, setHoursSpent] = useState(0);

  // Initialize progress tracking for skills that don't have it
  React.useEffect(() => {
    const skillsWithoutProgress = userSkills.filter(skill => 
      !progressTracking.some(progress => progress.skillId === skill.id)
    );

    if (skillsWithoutProgress.length > 0) {
      const newProgressEntries: ProgressTracking[] = skillsWithoutProgress.map(skill => ({
        id: `progress_${skill.id}_${Date.now()}`,
        skillId: skill.id,
        skillName: skill.name,
        initialLevel: skill.currentLevel,
        currentLevel: skill.currentLevel,
        targetLevel: skill.targetLevel,
        progressPercentage: 0,
        lastUpdated: new Date().toISOString(),
        milestones: [],
        timeSpent: 0,
        coursesCompleted: [],
      }));

      const updatedProgress = [...progressTracking, ...newProgressEntries];
      saveProgressTracking(updatedProgress);
    }
  }, [userSkills, progressTracking, saveProgressTracking]);

  const handleLogProgress = () => {
    if (!selectedSkill) {
      toast.error('Please select a skill');
      return;
    }

    updateSkillProgress(selectedSkill, newLevel, hoursSpent);
    
    setSelectedSkill('');
    setNewLevel(1);
    setHoursSpent(0);
    setIsLoggingProgress(false);
    toast.success('Progress logged successfully!');
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTimeSpentText = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} minutes`;
    if (hours < 24) return `${Math.round(hours)} hours`;
    return `${Math.round(hours / 24)} days`;
  };

  const totalTimeSpent = progressTracking.reduce((sum, progress) => sum + progress.timeSpent, 0);
  const averageProgress = progressTracking.length > 0
    ? Math.round(progressTracking.reduce((sum, p) => sum + p.progressPercentage, 0) / progressTracking.length)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Progress Tracking</h2>
          <p className="text-gray-600">Monitor your skill development journey and achievements</p>
        </div>
        
        <Dialog open={isLoggingProgress} onOpenChange={setIsLoggingProgress}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Log Progress
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Log Skill Progress</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Skill</Label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Choose a skill...</option>
                  {userSkills.map(skill => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newLevel">New Level (1-5)</Label>
                <Input
                  id="newLevel"
                  type="number"
                  min="1"
                  max="5"
                  value={newLevel}
                  onChange={(e) => setNewLevel(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hoursSpent">Hours Spent Learning</Label>
                <Input
                  id="hoursSpent"
                  type="number"
                  min="0"
                  step="0.5"
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button onClick={handleLogProgress} className="flex-1">
                  Log Progress
                </Button>
                <Button variant="outline" onClick={() => setIsLoggingProgress(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-600">Average Progress</p>
                <p className="text-3xl font-bold text-blue-900">{averageProgress}%</p>
                <p className="text-xs text-blue-700">Across all skills</p>
              </div>
              <div className="p-3 bg-blue-500 rounded-full">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-600">Total Time</p>
                <p className="text-3xl font-bold text-green-900">{Math.round(totalTimeSpent)}h</p>
                <p className="text-xs text-green-700">Learning time invested</p>
              </div>
              <div className="p-3 bg-green-500 rounded-full">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-purple-600">Skills Tracked</p>
                <p className="text-3xl font-bold text-purple-900">{progressTracking.length}</p>
                <p className="text-xs text-purple-700">Active skill development</p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Cards */}
      {progressTracking.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">No Progress Data Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Add some skills and start logging your progress to see your development journey
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {progressTracking.map((progress, index) => (
            <motion.div
              key={progress.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200 h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {progress.skillName}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>Updated {new Date(progress.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge 
                      className={`${getProgressColor(progress.progressPercentage)} bg-white border`}
                    >
                      {Math.round(progress.progressPercentage)}%
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {/* Level Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Level Progress</span>
                        <span className="font-medium">
                          {progress.currentLevel} / {progress.targetLevel}
                        </span>
                      </div>
                      <Progress value={progress.progressPercentage} className="h-3" />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Started at Level {progress.initialLevel}</span>
                        <span>Target: Level {progress.targetLevel}</span>
                      </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getTimeSpentText(progress.timeSpent)}
                            </p>
                            <p className="text-xs text-gray-500">Time invested</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-gray-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              +{progress.currentLevel - progress.initialLevel}
                            </p>
                            <p className="text-xs text-gray-500">Levels gained</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Courses Completed */}
                    {progress.coursesCompleted.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">
                            Courses Completed ({progress.coursesCompleted.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {progress.coursesCompleted.slice(0, 3).map((course, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {course}
                            </Badge>
                          ))}
                          {progress.coursesCompleted.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{progress.coursesCompleted.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Achievement */}
                  {progress.progressPercentage >= 100 && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <Award className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Target Level Achieved! 🎉
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
