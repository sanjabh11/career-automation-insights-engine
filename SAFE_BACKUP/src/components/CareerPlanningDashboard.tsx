
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  TrendingUp, 
  BookOpen, 
  Award, 
  Clock,
  Users,
  Star,
  ArrowRight,
  Plus,
  ChevronRight,
  User,
  AlertTriangle,
  BookOpen as BookOpenIcon,
  BarChart3,
  Loader2
} from 'lucide-react';
import { useCareerPlanningStorage } from '@/hooks/useCareerPlanningStorage';
import { SkillsManagementPanel } from './SkillsManagementPanel';
import { SkillGapAnalysisPanel } from './SkillGapAnalysisPanel';
import { CourseRecommendationsPanel } from './CourseRecommendationsPanel';
import { LearningPathPanel } from './LearningPathPanel';
import { ProgressTrackingPanel } from './ProgressTrackingPanel';
import { UserProfilePanel } from './UserProfilePanel';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import SoftSkillBuilderPanel from './SoftSkillBuilderPanel';

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: string;
}

function StatsCard({ title, value, description, icon: Icon, color, trend }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`} />
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                {trend && (
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    {trend}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
            <div className={`p-3 rounded-full bg-gradient-to-br ${color} shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function CareerPlanningDashboard() {
  const {
    userSkills,
    skillGaps,
    progressTracking,
    learningPaths,
    userProfile,
    isLoading
  } = useCareerPlanningStorage();

  const [activeTab, setActiveTab] = useState('skills');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalSkills = userSkills.length;
  const skillsWithGaps = skillGaps.length;
  const averageProgress = progressTracking.length > 0
    ? Math.round(progressTracking.reduce((sum, p) => sum + p.progressPercentage, 0) / progressTracking.length)
    : 0;
  const totalLearningPaths = learningPaths.length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6 lg:p-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header with Job Market Integration */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Career Planning Hub
              </h1>
              <p className="text-sm text-gray-600">AI-powered career development and skill planning</p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content with Enhanced Panels */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl p-8"
        >
          {activeTab === 'skills' && <SkillsManagementPanel />}
          {activeTab === 'gaps' && <SkillGapAnalysisPanel />}
          {activeTab === 'courses' && <CourseRecommendationsPanel />}
          {activeTab === 'paths' && <LearningPathPanel />}
          {activeTab === 'progress' && <ProgressTrackingPanel />}
          {activeTab === 'softskills' && <SoftSkillBuilderPanel />}
          {activeTab === 'market' && <JobMarketInsightsPanel />}
        </motion.div>
      </div>
    </motion.div>
  );
}

// Add Job Market Insights Panel component
function JobMarketInsightsPanel() {
  const { userSkills } = useCareerPlanningStorage();
  const [jobData, setJobData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchJobMarketData = async () => {
    if (userSkills.length === 0) return;
    
    setIsLoading(true);
    try {
      const topSkill = userSkills[0]?.name;
      const { data, error } = await supabase.functions.invoke('serpapi-jobs', {
        body: { jobTitle: topSkill }
      });

      if (!error && data) {
        setJobData(data);
      }
    } catch (error) {
      console.error('Job market data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobMarketData();
  }, [userSkills]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Job Market Insights</h2>
        <p className="text-gray-600">Real-time job market data for your skills</p>
      </div>

      {isLoading ? (
        <Card className="p-12 text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Fetching job market data...</p>
        </Card>
      ) : jobData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-blue-600">{jobData.totalJobs}</h3>
                <p className="text-gray-600">Available Jobs</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-green-600">
                  {jobData.trending ? 'High' : 'Moderate'}
                </h3>
                <p className="text-gray-600">Demand Level</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-purple-600">
                  {jobData.topLocations?.[0]?.location || 'Various'}
                </h3>
                <p className="text-gray-600">Top Location</p>
              </div>
            </CardContent>
          </Card>

          {jobData.recentJobs && jobData.recentJobs.length > 0 && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader>
                <CardTitle>Recent Job Openings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobData.recentJobs.slice(0, 5).map((job: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-semibold text-gray-900">{job.title}</h4>
                      <p className="text-gray-600">{job.company} • {job.location}</p>
                      {job.salary && <p className="text-green-600 font-medium">{job.salary}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-gray-600">Add skills to see job market insights</p>
        </Card>
      )}
    </div>
  );
}

// Update tabs array to include job market
const tabs = [
  { id: 'skills', label: 'Skills Management', icon: User },
  { id: 'gaps', label: 'Skill Gaps', icon: AlertTriangle },
  { id: 'courses', label: 'Course Recommendations', icon: BookOpenIcon },
  { id: 'paths', label: 'Learning Paths', icon: Target },
  { id: 'progress', label: 'Progress Tracking', icon: TrendingUp },
  { id: 'softskills', label: 'Soft Skills', icon: Award },
  { id: 'market', label: 'Job Market', icon: BarChart3 },
];
