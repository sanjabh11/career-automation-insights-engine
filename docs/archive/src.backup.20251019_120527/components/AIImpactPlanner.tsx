import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Notebook as Robot, Brain, User, Zap, BookOpen, Lightbulb, AlertTriangle, CheckCircle, Clock, Save, RefreshCw, Briefcase, GraduationCap, ThumbsUp, DollarSign, TrendingUp, Award, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useSession } from '@/hooks/useSession';

// Types
interface Occupation {
  code: string;
  title: string;
  description?: string;
}

const normalizeOccupation = (input: any): Occupation => {
  return {
    code: input?.code || input?.occupation_code || '',
    title: input?.title || input?.occupation_title || '',
    description:
      input?.description ||
      input?.summary ||
      input?.occupation_description ||
      input?.short_description ||
      undefined,
  };
};

interface Task {
  id: string;
  description: string;
  category: 'Automate' | 'Augment' | 'Human-only';
  explanation?: string;
  confidence?: number;
  isCustom?: boolean;
}

interface Skill {
  name: string;
  explanation: string;
  inProgress?: boolean;
}

interface Resource {
  title: string;
  url: string;
  provider: string;
  skillArea: string;
  costType?: string;
}

interface LearningPathMilestone {
  id: string;
  title: string;
  skills: string[];
  duration_weeks?: number;
  resources?: any[];
  cost_estimate?: number;
  priority?: string;
}

interface LearningPathData {
  learningPath: {
    name: string;
    description: string;
    estimatedDuration: string;
    milestones: LearningPathMilestone[];
  };
  financials: {
    totalCost: number;
    currentSalary?: number;
    targetSalary?: number;
    salaryIncrease: number;
    roiMonths: number | null;
    lifetimeEarningIncrease: number;
    breakEvenYears: string | null;
  };
  metadata: {
    skillGapsAddressed: number;
    estimatedWeeksToComplete: number;
  };
}

interface CIPProgram {
  code: string;
  title: string;
  type?: string;
}

interface CourseResult {
  id: string;
  title: string;
  provider: string;
  url: string;
  duration: string;
  level: string;
  price: string;
  rating?: number;
}


interface UserPreferences {
  occupation?: Occupation;
  recentTasks?: Task[];
  skillProgress?: Record<string, boolean>;
  lastVisited?: string;
}

interface FeedbackData {
  taskId: string;
  isAccurate: boolean;
  comment?: string;
}

// Main component
export function AIImpactPlanner() {
  // State
  const { user } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [selectedOccupation, setSelectedOccupation] = useState<Occupation | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customTask, setCustomTask] = useState('');
  const [isAssessingTask, setIsAssessingTask] = useState(false);
  const [skillRecommendations, setSkillRecommendations] = useState<Skill[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [similarOccupations, setSimilarOccupations] = useState<Occupation[]>([]);
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [isSearchingCustomJob, setIsSearchingCustomJob] = useState(false);
  const [skillProgress, setSkillProgress] = useState<Record<string, boolean>>({});
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState(0);
  
  // Education Path state
  const [timeCommitment, setTimeCommitment] = useState('5');
  const [learningStyle, setLearningStyle] = useState('self-paced');
  const [budget, setBudget] = useState('moderate');
  const [currentSalary, setCurrentSalary] = useState('');
  const [targetSalary, setTargetSalary] = useState('');
  const [learningPathData, setLearningPathData] = useState<LearningPathData | null>(null);
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const [cipPrograms, setCipPrograms] = useState<CIPProgram[]>([]);
  const [isLoadingCIP, setIsLoadingCIP] = useState(false);
  const [selectedSkillForCourses, setSelectedSkillForCourses] = useState<string | null>(null);
  const [coursesForSkill, setCoursesForSkill] = useState<CourseResult[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Load user preferences from localStorage on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('aiImpactPlanner');
    if (savedPreferences) {
      try {
        const preferences: UserPreferences = JSON.parse(savedPreferences);
        if (preferences.occupation) {
          const normalized = normalizeOccupation(preferences.occupation);
          if (normalized.code && normalized.title) {
            setSelectedOccupation(normalized);
          }
        }
        if (preferences.skillProgress) {
          setSkillProgress(preferences.skillProgress);
        }
      } catch (error) {
        console.error('Error loading saved preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage when occupation changes
  useEffect(() => {
    if (selectedOccupation) {
      const preferences: UserPreferences = {
        occupation: selectedOccupation,
        recentTasks: tasks.slice(0, 5),
        skillProgress,
        lastVisited: new Date().toISOString()
      };
      localStorage.setItem('aiImpactPlanner', JSON.stringify(preferences));
    }
  }, [selectedOccupation, tasks, skillProgress]);

  // Load tasks when occupation is selected
  useEffect(() => {
    if (selectedOccupation) {
      fetchTasks(selectedOccupation);
      generateSkillRecommendations(selectedOccupation.title);
    }
  }, [selectedOccupation]);

  // Fetch resources when skill recommendations change
  useEffect(() => {
    if (skillRecommendations.length > 0) {
      fetchResources();
    }
  }, [skillRecommendations]);

  // Search for occupations
  const searchOccupations = async (query: string) => {
    if (!query.trim()) {
      setOccupations([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-occupations', {
        body: {
          keyword: query.trim(),
          limit: 10,
        },
      });

      if (error) {
        throw new Error(error.message ?? 'Search function failed');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Unexpected response from search function');
      }

      const occupations = Array.isArray((data as any).occupations)
        ? (data as any).occupations
        : [];

      const occs: Occupation[] = occupations
        .map((o: any) => {
          const normalized = normalizeOccupation(o);
          if (!normalized.description) {
            normalized.description = 'An occupation from the O*NET database.';
          }
          return normalized;
        })
        .filter((o: Occupation) => o.code && o.title);

      setOccupations(occs);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to search occupations');
    } finally {
      setIsSearching(false);
    }
  };

  // If the homepage hero stored a last search, prefill and fetch results
  useEffect(() => {
    try {
      const last = localStorage.getItem('planner:lastSearch');
      if (last && last.trim()) {
        setSearchQuery(last);
        searchOccupations(last);
        localStorage.removeItem('planner:lastSearch');
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Find similar occupations for custom job title
  const findSimilarOccupations = async (jobTitle: string) => {
    if (!jobTitle.trim()) {
      toast.error('Please enter a job title');
      return;
    }

    setIsSearchingCustomJob(true);
    try {
      const { data, error } = await supabase.functions.invoke('search-occupations', {
        body: {
          keyword: jobTitle.trim(),
          limit: 5,
        },
      });

      if (error) {
        throw new Error(error.message ?? 'Search function failed');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Unexpected response from search function');
      }

      const occupations = Array.isArray((data as any).occupations)
        ? (data as any).occupations
        : [];

      const occs: Occupation[] = occupations
        .map((o: any) => {
          const normalized = normalizeOccupation(o);
          if (!normalized.description) {
            normalized.description = 'An occupation from the O*NET database.';
          }
          return normalized;
        })
        .filter((o: Occupation) => o.code && o.title);

      setSimilarOccupations(occs);
      
      if (occs.length === 0) {
        toast.error('No similar occupations found. Try a different job title.');
      } else {
        toast.success(`Found ${occs.length} similar occupations`);
      }
    } catch (error) {
      console.error('Similar occupations search failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to find similar occupations');
    } finally {
      setIsSearchingCustomJob(false);
    }
  };

  // Fetch tasks for selected occupation
  const fetchTasks = async (occupation: Occupation) => {
    setIsLoading(true);
    try {
      const { code, title } = occupation;
      if (!code || !title) {
        throw new Error('Occupation code and title are required');
      }

      const { data, error } = await supabase.functions.invoke('analyze-occupation-tasks', {
        body: { occupation_code: code, occupation_title: title }
      });
      
      // Log both data and error for debugging
      console.log('Function response - data:', data);
      console.log('Function response - error:', error);
      
      if (error) {
        console.error('Function error details:', error);
        // Check if data contains error details even when error is set
        if (data?.error) {
          console.error('Function returned error in data:', data);
          throw new Error(`${data.error}${data.details ? '\n' + data.details : ''}`);
        }
        throw error;
      }

      if (data?.error) {
        console.error('Function returned error:', data);
        throw new Error(`${data.error}${data.details ? '\n' + data.details : ''}`);
      }

      const incoming = (data?.tasks ?? []) as Array<{ description: string; category: Task['category']; explanation?: string; confidence?: number }>;
      const parsedTasks: Task[] = incoming.map((t, idx) => ({
        id: `${code}-${idx + 1}`,
        description: t.description,
        category: t.category,
        explanation: t.explanation,
        confidence: t.confidence
      }));
      setTasks(parsedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      const message = error instanceof Error ? error.message : 'Failed to load tasks for this occupation';
      toast.error(`Task analysis failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Assess custom task using Gemini LLM
  const assessCustomTask = async () => {
    if (!customTask.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    setIsAssessingTask(true);
    try {
      const { data, error } = await supabase.functions.invoke('assess-task', {
        body: {
          taskDescription: customTask,
          occupationContext: selectedOccupation?.title || undefined,
        },
      });
      if (error) throw error;

      const assessed = data as { category: Task['category']; explanation: string; confidence: number };
      const newTask: Task = {
        id: `custom-${Date.now()}`,
        description: customTask,
        category: assessed.category,
        explanation: assessed.explanation,
        confidence: assessed.confidence,
        isCustom: true,
      };

      setTasks([newTask, ...tasks]);
      setCustomTask('');
      toast.success('Task assessed successfully');
    } catch (error) {
      console.error('Error assessing task:', error);
      toast.error('Failed to assess task');
    } finally {
      setIsAssessingTask(false);
    }
  };

  // Generate skill recommendations
  const generateSkillRecommendations = async (occupationTitle: string) => {
    try {
      const occupationCode = selectedOccupation?.code || '';
      const { data, error } = await supabase.functions.invoke('skill-recommendations', {
        body: { occupation_code: occupationCode, occupation_title: occupationTitle },
      });
      if (error) throw error;

      const recs = (data ?? []) as Array<{ skill_name: string; explanation: string; priority?: number }>;
      const skills: Skill[] = recs.map((rec) => ({
        name: rec.skill_name,
        explanation: rec.explanation,
        inProgress: skillProgress[rec.skill_name] || false,
      }));

      setSkillRecommendations(skills);
    } catch (error) {
      console.error('Error generating skill recommendations:', error);
      toast.error('Failed to generate skill recommendations');
    }
  };

  // Fetch reskilling resources based on skill recommendations
  const fetchResources = async () => {
    try {
      // Get skill areas from current skill recommendations
      const skillAreas = skillRecommendations.map(skill => skill.name);
      
      if (skillAreas.length === 0) {
        // If no specific skill recommendations, fetch general resources
        const { data, error } = await supabase
          .from('ai_reskilling_resources')
          .select('*')
          .limit(6);

        if (error) throw error;
        
        const formattedResources: Resource[] = (data || []).map(resource => ({
          title: resource.title,
          url: resource.url,
          provider: resource.provider,
          skillArea: resource.skill_area,
          costType: resource.cost_type || 'Unknown'
        }));
        
        setResources(formattedResources);
        return;
      }
      
      // Fetch resources that match the recommended skills
      const { data, error } = await supabase
        .from('ai_reskilling_resources')
        .select('*')
        .in('skill_area', skillAreas)
        .limit(10);

      if (error) throw error;
      
      let formattedResources: Resource[] = (data || []).map(resource => ({
        title: resource.title,
        url: resource.url,
        provider: resource.provider,
        skillArea: resource.skill_area,
        costType: resource.cost_type || 'Unknown'
      }));
      
      // If we don't have enough specific resources, add some general ones
      if (formattedResources.length < 4) {
        const { data: generalData, error: generalError } = await supabase
          .from('ai_reskilling_resources')
          .select('*')
          .not('skill_area', 'in', `(${skillAreas.join(',')})`)
          .limit(6 - formattedResources.length);

        if (!generalError && generalData) {
          const generalResources: Resource[] = generalData.map(resource => ({
            title: resource.title,
            url: resource.url,
            provider: resource.provider,
            skillArea: resource.skill_area,
            costType: resource.cost_type || 'Unknown'
          }));
          formattedResources = [...formattedResources, ...generalResources];
        }
      }
      
      setResources(formattedResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      // Fallback to showing message instead of broken mock resources
      setResources([]);
      toast.error('Unable to load learning resources at this time');
    }
  };

  // Track skill progress
  const toggleSkillProgress = (skillName: string) => {
    setSkillProgress(prev => {
      const newProgress = { ...prev, [skillName]: !prev[skillName] };
      
      // Update localStorage
      const savedPreferences = localStorage.getItem('aiImpactPlanner');
      if (savedPreferences) {
        try {
          const preferences: UserPreferences = JSON.parse(savedPreferences);
          preferences.skillProgress = newProgress;
          localStorage.setItem('aiImpactPlanner', JSON.stringify(preferences));
        } catch (error) {
          console.error('Error updating saved preferences:', error);
        }
      }
      
      return newProgress;
    });
    
    toast.success(`Progress updated for ${skillName}`);
  };

  // Submit feedback on task assessment
  const submitFeedback = (taskId: string, isAccurate: boolean, comment?: string) => {
    // In a real implementation, this would send to the backend
    console.log('Feedback submitted:', { taskId, isAccurate, comment });
    
    toast.success('Thank you for your feedback!');
    setFeedbackData(null);
  };

  // Reset all data
  const handleReset = () => {
    setSelectedOccupation(null);
    setTasks([]);
    setSkillRecommendations([]);
    setResources([]);
    setSearchQuery('');
    setOccupations([]);
    setSkillProgress({});
    setSimilarOccupations([]);
    setCustomJobTitle('');
    localStorage.removeItem('aiImpactPlanner');
    toast.success('All data has been reset');
  };

  // Get counts by category
  const getTaskCountsByCategory = () => {
    const counts = {
      Automate: 0,
      Augment: 0,
      'Human-only': 0
    };
    
    tasks.forEach(task => {
      counts[task.category]++;
    });
    
    return counts;
  };

  const taskCounts = getTaskCountsByCategory();
  const totalTasks = tasks.length;

  // Calculate percentages
  const getPercentage = (count: number) => {
    return totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
  };

  // Filter tasks by confidence score
  const filteredTasks = tasks.filter(task => 
    task.confidence ? task.confidence * 100 >= confidenceFilter : true
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div 
        className="mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-blue-600" />
          Career Impact Planner
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Understand how AI will impact your job, which tasks might be automated or augmented, 
          and what skills to develop for the future of work.
        </p>
      </motion.div>

      {!selectedOccupation ? (
        <motion.div 
          className="max-w-2xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  Select Your Occupation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search for your occupation (e.g., Software Developer, Nurse)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && searchOccupations(searchQuery)}
                    />
                    <Button 
                      onClick={() => searchOccupations(searchQuery)}
                      disabled={isSearching || !searchQuery.trim()}
                    >
                      {isSearching ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        'Search'
                      )}
                    </Button>
                  </div>
                  
                  {isSearching ? (
                    <div className="py-8 text-center">
                      <LoadingSpinner size="md" text="Searching occupations..." />
                    </div>
                  ) : occupations.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <div className="max-h-80 overflow-y-auto">
                        {occupations.map((occ) => (
                          <div
                            key={occ.code}
                            className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedOccupation(occ)}
                          >
                            <div className="font-medium">{occ.title}</div>
                            <div className="text-sm text-gray-500">Code: {occ.code}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : searchQuery ? (
                    <div className="text-center py-4 text-gray-500">
                      No occupations found. Try a different search term.
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-purple-600" />
                  Can't Find Your Occupation?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Enter your job title below and we'll find the closest matching occupation.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter your job title (e.g., Growth Hacker, DevOps Engineer)"
                      value={customJobTitle}
                      onChange={(e) => setCustomJobTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && findSimilarOccupations(customJobTitle)}
                    />
                    <Button 
                      onClick={() => findSimilarOccupations(customJobTitle)}
                      disabled={isSearchingCustomJob || !customJobTitle.trim()}
                    >
                      {isSearchingCustomJob ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        'Find Matches'
                      )}
                    </Button>
                  </div>
                  
                  {isSearchingCustomJob ? (
                    <div className="py-4 text-center">
                      <LoadingSpinner size="sm" text="Finding similar occupations..." />
                    </div>
                  ) : similarOccupations.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Similar Occupations:</h4>
                      <div className="border rounded-md overflow-hidden">
                        {similarOccupations.map((occ) => (
                          <div
                            key={occ.code}
                            className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => setSelectedOccupation(occ)}
                          >
                            <div className="font-medium">{occ.title}</div>
                            <div className="text-sm text-gray-500">Code: {occ.code}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  How This Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Search and select your occupation</li>
                  <li>View tasks categorized by automation potential</li>
                  <li>Add your own tasks to assess their AI impact</li>
                  <li>Explore skill recommendations to future-proof your career</li>
                  <li>Find resources to develop those skills</li>
                </ol>
                <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                  <p className="flex items-start gap-2">
                    <InfoIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>
                      Based on research from "Future of Work with AI Agents: Auditing Automation and Augmentation Potential across the All Workforce"
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        {selectedOccupation.code}
                      </Badge>
                      <h2 className="text-2xl font-bold">{selectedOccupation.title}</h2>
                    </div>
                    <p className="text-gray-600 mt-1">{selectedOccupation.description || 'No description available.'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSelectedOccupation(null)}>
                      Change Occupation
                    </Button>
                    <Button variant="outline" onClick={handleReset}>
                      Reset All
                    </Button>
                    {user && (
                      <Button variant="outline" onClick={() => toast.success('Progress saved to your account')}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="mb-6">
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
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    What This Means For You
                  </h4>
                  <p className="text-sm text-blue-700">
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
          </motion.div>

          <motion.div variants={itemVariants}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Tasks Analysis</span>
                </TabsTrigger>
                <TabsTrigger value="skills" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  <span>Skill Recommendations</span>
                </TabsTrigger>
                <TabsTrigger value="resources" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Reskilling Resources</span>
                </TabsTrigger>
                <TabsTrigger value="education" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Education Path</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="tasks">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      Task Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">Assess Your Own Task</h3>
                      <div className="flex flex-col md:flex-row gap-2">
                        <Textarea
                          placeholder="Describe a specific task you perform in your job..."
                          value={customTask}
                          onChange={(e) => setCustomTask(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={assessCustomTask} 
                          disabled={isAssessingTask || !customTask.trim()}
                          className="md:self-end"
                        >
                          {isAssessingTask ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Assessing...
                            </>
                          ) : (
                            'Assess Task'
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    {/* Confidence filter */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Confidence Filter: {confidenceFilter}%+</h3>
                        <div className="w-1/2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={confidenceFilter}
                            onChange={(e) => setConfidenceFilter(parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Adjust to filter tasks by AI confidence score
                      </p>
                    </div>
                    
                    {isLoading ? (
                      <div className="py-8 text-center">
                        <LoadingSpinner size="md" text="Analyzing tasks..." />
                      </div>
                    ) : filteredTasks.length > 0 ? (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Robot className="h-5 w-5 text-red-600" />
                            Tasks to Automate
                          </h3>
                          <div className="space-y-3">
                            {filteredTasks.filter(t => t.category === 'Automate').map(task => (
                              <TaskCard 
                                key={task.id} 
                                task={task} 
                                onFeedback={(isAccurate, comment) => submitFeedback(task.id, isAccurate, comment)}
                              />
                            ))}
                            {filteredTasks.filter(t => t.category === 'Automate').length === 0 && (
                              <p className="text-gray-500 text-sm italic">No tasks in this category</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-600" />
                            Tasks to Augment
                          </h3>
                          <div className="space-y-3">
                            {filteredTasks.filter(t => t.category === 'Augment').map(task => (
                              <TaskCard 
                                key={task.id} 
                                task={task} 
                                onFeedback={(isAccurate, comment) => submitFeedback(task.id, isAccurate, comment)}
                              />
                            ))}
                            {filteredTasks.filter(t => t.category === 'Augment').length === 0 && (
                              <p className="text-gray-500 text-sm italic">No tasks in this category</p>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 text-green-600" />
                            Human-only Tasks
                          </h3>
                          <div className="space-y-3">
                            {filteredTasks.filter(t => t.category === 'Human-only').map(task => (
                              <TaskCard 
                                key={task.id} 
                                task={task} 
                                onFeedback={(isAccurate, comment) => submitFeedback(task.id, isAccurate, comment)}
                              />
                            ))}
                            {filteredTasks.filter(t => t.category === 'Human-only').length === 0 && (
                              <p className="text-gray-500 text-sm italic">No tasks in this category</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        {tasks.length > 0 ? 
                          'No tasks match your confidence filter. Try lowering the threshold.' : 
                          'No tasks available for this occupation.'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="skills">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      Skill Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <p className="text-gray-600">
                        Based on the AI impact analysis of your occupation, here are key skills to develop 
                        to enhance your career resilience in the age of AI.
                      </p>
                    </div>
                    
                    {skillRecommendations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {skillRecommendations.map((skill, index) => (
                          <div 
                            key={index} 
                            className={`p-4 rounded-lg border ${skill.inProgress ? 'bg-purple-100 border-purple-300' : 'bg-purple-50 border-purple-100'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex items-center h-6 mt-0.5">
                                <Checkbox 
                                  id={`skill-${index}`}
                                  checked={skill.inProgress}
                                  onCheckedChange={() => toggleSkillProgress(skill.name)}
                                />
                              </div>
                              <div>
                                <label 
                                  htmlFor={`skill-${index}`}
                                  className={`font-semibold text-purple-800 mb-2 ${skill.inProgress ? 'line-through opacity-70' : ''}`}
                                >
                                  {skill.name}
                                </label>
                                <p className={`text-sm text-purple-700 ${skill.inProgress ? 'opacity-70' : ''}`}>
                                  {skill.explanation}
                                </p>
                                {skill.inProgress && (
                                  <Badge className="mt-2 bg-purple-200 text-purple-800">In Progress</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <LoadingSpinner size="sm" />
                        <p className="mt-2">Generating skill recommendations...</p>
                      </div>
                    )}
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        Why These Skills Matter
                      </h4>
                      <p className="text-sm text-blue-700">
                        As AI automates routine tasks, human skills like creativity, emotional intelligence, 
                        and complex problem-solving become more valuable. Focus on developing skills that 
                        complement AI rather than compete with it.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="resources">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      Reskilling Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <p className="text-gray-600">
                        Explore these resources to develop the recommended skills and prepare for 
                        the changing nature of work in your field.
                      </p>
                    </div>
                    
                    {resources.length > 0 ? (
                      <div className="space-y-4">
                        {resources.map((resource, index) => (
                          <div 
                            key={index} 
                            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-blue-700">{resource.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">Provider: {resource.provider}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge variant="outline">{resource.skillArea}</Badge>
                                {resource.costType && (
                                  <Badge className={
                                    resource.costType === 'Free' ? 'bg-green-100 text-green-800' :
                                    resource.costType === 'Freemium' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }>
                                    {resource.costType}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="mt-3">
                              <a 
                                href={resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                View Resource →
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : skillRecommendations.length > 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Resources Found</h3>
                        <p className="text-gray-600 mb-4">
                          We couldn't find specific learning resources for this occupation yet. 
                          Try exploring these general learning platforms:
                        </p>
                        <div className="space-y-2 text-left max-w-md mx-auto">
                          <a href="https://www.coursera.org" target="_blank" rel="noopener noreferrer" 
                             className="block p-3 border rounded hover:bg-gray-50 text-blue-600 hover:underline">
                            Coursera - Online courses from universities and companies
                          </a>
                          <a href="https://www.linkedin.com/learning" target="_blank" rel="noopener noreferrer" 
                             className="block p-3 border rounded hover:bg-gray-50 text-blue-600 hover:underline">
                            LinkedIn Learning - Professional skill development
                          </a>
                          <a href="https://www.edx.org" target="_blank" rel="noopener noreferrer" 
                             className="block p-3 border rounded hover:bg-gray-50 text-blue-600 hover:underline">
                            edX - University-level courses and programs
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <LoadingSpinner size="sm" />
                        <p className="mt-2">Loading resources...</p>
                      </div>
                    )}
                    
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        Learning Plan
                      </h4>
                      <p className="text-sm text-yellow-700">
                        Consider dedicating 3-5 hours per week to skill development. 
                        Start with one course or resource, complete it, then move to the next. 
                        Consistent learning over time will help you adapt to AI-driven changes in your field.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="education">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-indigo-600" />
                      Education Path & ROI
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6">
                      <p className="text-gray-600">
                        Generate a personalized learning path with ROI analysis based on your skill gaps and career goals.
                      </p>
                    </div>

                    {/* CIP Programs Section */}
                    {selectedOccupation && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <Award className="h-4 w-4 text-blue-600" />
                            Accredited Programs (CIP)
                          </h4>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              setIsLoadingCIP(true);
                              try {
                                const codeNorm = (selectedOccupation.code || '').replace(/\.00$/, '');
                                const { data, error } = await supabase.functions.invoke('crosswalk', {
                                  body: { from: 'SOC', code: codeNorm, to: 'CIP' }
                                });
                                if (error) throw error;
                                const programs = (data?.results || data?.mappings || data?.items || []).map((item: any) => ({
                                  code: item.code || item.to_code || item.target || '',
                                  title: item.title || item.name || item.desc || 'Unknown Program',
                                  type: item.type || item.category || ''
                                }));
                                setCipPrograms(programs);
                                if (programs.length === 0) {
                                  toast.error('No accredited programs found for this occupation');
                                }
                              } catch (e) {
                                console.error('CIP crosswalk failed:', e);
                                toast.error('Failed to load CIP programs');
                              } finally {
                                setIsLoadingCIP(false);
                              }
                            }}
                            disabled={isLoadingCIP}
                          >
                            {isLoadingCIP ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                            See Accredited Programs
                          </Button>
                        </div>
                        {cipPrograms.length > 0 && (
                          <div className="space-y-2 mt-3">
                            {cipPrograms.slice(0, 5).map((prog, idx) => (
                              <div key={idx} className="p-3 bg-white rounded border border-blue-200">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-sm">{prog.title}</p>
                                    <p className="text-xs text-gray-500 font-mono">{prog.code}</p>
                                  </div>
                                  <Badge variant="outline" className="text-xs">{prog.type || 'Program'}</Badge>
                                </div>
                              </div>
                            ))}
                            {cipPrograms.length > 5 && (
                              <p className="text-xs text-gray-500">+{cipPrograms.length - 5} more programs</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Learning Path Form */}
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Time Commitment (hrs/week)</label>
                          <Input 
                            type="number" 
                            value={timeCommitment} 
                            onChange={(e) => setTimeCommitment(e.target.value)}
                            placeholder="5"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Learning Style</label>
                          <select 
                            className="w-full border rounded-md p-2 text-sm"
                            value={learningStyle}
                            onChange={(e) => setLearningStyle(e.target.value)}
                          >
                            <option value="self-paced">Self-paced</option>
                            <option value="structured">Structured</option>
                            <option value="hands-on">Hands-on</option>
                            <option value="mentored">Mentored</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Budget</label>
                          <select 
                            className="w-full border rounded-md p-2 text-sm"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                          >
                            <option value="free">Free only</option>
                            <option value="low">Low ($0-500)</option>
                            <option value="moderate">Moderate ($500-2000)</option>
                            <option value="high">High ($2000+)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Current Salary (optional)</label>
                          <Input 
                            type="number" 
                            value={currentSalary} 
                            onChange={(e) => setCurrentSalary(e.target.value)}
                            placeholder="60000"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Target Salary (optional)</label>
                          <Input 
                            type="number" 
                            value={targetSalary} 
                            onChange={(e) => setTargetSalary(e.target.value)}
                            placeholder="80000"
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={async () => {
                          if (!selectedOccupation || skillRecommendations.length === 0) {
                            toast.error('Please select an occupation and view skill recommendations first');
                            return;
                          }
                          setIsGeneratingPath(true);
                          try {
                            const userSkills = skillRecommendations.map(s => ({
                              name: s.name,
                              currentLevel: 1,
                              targetLevel: 5,
                              category: 'technical'
                            }));
                            const { data, error } = await supabase.functions.invoke('generate-learning-path', {
                              body: {
                                targetOccupationCode: selectedOccupation.code,
                                userSkills,
                                targetRole: selectedOccupation.title,
                                currentRole: 'Current Role',
                                timeCommitment: `${timeCommitment} hours/week`,
                                learningStyle,
                                budget,
                                currentSalary: currentSalary ? Number(currentSalary) : undefined,
                                targetSalary: targetSalary ? Number(targetSalary) : undefined,
                                saveToDB: !!user
                              }
                            });
                            if (error) throw error;
                            setLearningPathData(data);
                            toast.success('Learning path generated!');
                          } catch (e: any) {
                            toast.error(e.message || 'Failed to generate learning path');
                          } finally {
                            setIsGeneratingPath(false);
                          }
                        }}
                        disabled={isGeneratingPath || !selectedOccupation || skillRecommendations.length === 0}
                        className="w-full"
                      >
                        {isGeneratingPath ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Generating Path...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Generate Learning Path
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Learning Path Results */}
                    {learningPathData && learningPathData.learningPath && (
                      <div className="space-y-6">
                        {/* ROI Summary */}
                        {learningPathData.financials ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="p-4 bg-green-50 border-green-200">
                              <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                <h4 className="font-medium text-sm">Total Investment</h4>
                              </div>
                              <p className="text-2xl font-bold text-green-700">
                                ${(learningPathData.financials?.totalCost ?? 0).toLocaleString()}
                              </p>
                            </Card>
                            <Card className="p-4 bg-blue-50 border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                                <h4 className="font-medium text-sm">Salary Increase</h4>
                              </div>
                              <p className="text-2xl font-bold text-blue-700">
                                ${(learningPathData.financials?.salaryIncrease ?? 0).toLocaleString()}
                              </p>
                            </Card>
                            <Card className="p-4 bg-purple-50 border-purple-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="h-5 w-5 text-purple-600" />
                                <h4 className="font-medium text-sm">Break-even</h4>
                              </div>
                              <p className="text-2xl font-bold text-purple-700">
                                {learningPathData.financials?.breakEvenYears || 'N/A'} years
                              </p>
                            </Card>
                          </div>
                        ) : (
                          <div className="p-3 border rounded bg-gray-50 text-gray-600 text-sm">
                            ROI metrics are not available for this run. You can still review the learning path and milestones below.
                          </div>
                        )}

                        {/* Path Details */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3">{learningPathData.learningPath.name || 'Learning Path'}</h3>
                          <p className="text-sm text-gray-600 mb-4">{learningPathData.learningPath.description || ''}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <span>Duration: {learningPathData.learningPath.estimatedDuration || 'TBD'}</span>
                            <span>•</span>
                            <span>Skills: {learningPathData.metadata?.skillGapsAddressed || 0}</span>
                            <span>•</span>
                            <span>Weeks: {learningPathData.metadata?.estimatedWeeksToComplete || 0}</span>
                          </div>
                        </div>

                        {/* Milestones */}
                        <div>
                          <h4 className="font-medium mb-3">Learning Milestones</h4>
                          <div className="space-y-3">
                            {(learningPathData.learningPath.milestones || []).map((milestone, idx) => (
                              <div key={milestone.id} className="p-4 border rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-medium">{milestone.title}</h5>
                                  {milestone.priority && (
                                    <Badge variant={milestone.priority === 'Critical' ? 'destructive' : 'secondary'}>
                                      {milestone.priority}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {milestone.skills.map((skill, sidx) => (
                                    <Badge key={sidx} variant="outline" className="text-xs">{skill}</Badge>
                                  ))}
                                </div>
                                {milestone.duration_weeks && (
                                  <p className="text-xs text-gray-500">Duration: {milestone.duration_weeks} weeks</p>
                                )}
                                {milestone.cost_estimate && (
                                  <p className="text-xs text-gray-500">Est. Cost: ${milestone.cost_estimate}</p>
                                )}
                                {milestone.skills.length > 0 && (
                                  <Button 
                                    variant="link" 
                                    size="sm" 
                                    className="text-xs p-0 h-auto mt-2"
                                    onClick={async () => {
                                      setSelectedSkillForCourses(milestone.skills[0]);
                                      setIsLoadingCourses(true);
                                      try {
                                        const { data, error } = await supabase.functions.invoke('course-search', {
                                          body: { skills: [milestone.skills[0]], level: 'any', budget: 'any', duration: 'any' }
                                        });
                                        if (error) throw error;
                                        setCoursesForSkill(data?.courses || []);
                                      } catch (e) {
                                        toast.error('Failed to load courses');
                                      } finally {
                                        setIsLoadingCourses(false);
                                      }
                                    }}
                                  >
                                    Find courses for {milestone.skills[0]} →
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Courses for selected skill */}
                        {selectedSkillForCourses && coursesForSkill.length > 0 && (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-3">Courses for {selectedSkillForCourses}</h4>
                            <div className="space-y-2">
                              {coursesForSkill.slice(0, 5).map((course) => (
                                <div key={course.id} className="p-3 bg-white rounded border">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-sm">{course.title}</h5>
                                      <p className="text-xs text-gray-500">{course.provider} • {course.duration} • {course.level}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <Badge variant="outline" className="text-xs">{course.price}</Badge>
                                      {course.rating && (
                                        <span className="text-xs text-yellow-600">★ {course.rating}</span>
                                      )}
                                    </div>
                                  </div>
                                  <a 
                                    href={course.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline mt-2 inline-flex items-center gap-1"
                                  >
                                    View Course <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      )}

      {/* Feedback Modal */}
      {feedbackData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
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
              onChange={(e) => setFeedbackData({...feedbackData, comment: e.target.value})}
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
      )}
    </div>
  );
}

// Helper components
interface TaskCardProps {
  task: Task;
  onFeedback: (isAccurate: boolean, comment?: string) => void;
}

const TaskCard = ({ task, onFeedback }: TaskCardProps) => {
  const [showFeedback, setShowFeedback] = useState(false);
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Automate': return 'bg-red-50 border-red-200';
      case 'Augment': return 'bg-yellow-50 border-yellow-200';
      case 'Human-only': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };
  
  const getCategoryTextColor = (category: string) => {
    switch (category) {
      case 'Automate': return 'text-red-700';
      case 'Augment': return 'text-yellow-700';
      case 'Human-only': return 'text-green-700';
      default: return 'text-gray-700';
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Automate': return <Robot className="h-5 w-5 text-red-600" />;
      case 'Augment': return <Zap className="h-5 w-5 text-yellow-600" />;
      case 'Human-only': return <User className="h-5 w-5 text-green-600" />;
      default: return null;
    }
  };
  
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
                <span className="text-xs text-gray-500">Confidence:</span>
                <Progress 
                  value={task.confidence * 100} 
                  className="h-1.5 w-24" 
                />
                <span className="text-xs text-gray-500">
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

const InfoIcon = ({ className }: { className?: string }) => (
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