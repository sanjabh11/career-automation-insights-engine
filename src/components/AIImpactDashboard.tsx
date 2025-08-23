import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Brain, 
  Briefcase, 
  ListChecks, 
  Award, 
  Lightbulb,
  Zap,
  Info,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TaskAssessmentPanel } from './TaskAssessmentPanel';
import { SkillRecommendationsPanel } from './SkillRecommendationsPanel';
import { motion } from 'framer-motion';

interface Occupation {
  code: string;
  title: string;
  description?: string;
}

interface Task {
  description: string;
  category: 'Automate' | 'Augment' | 'Human-only';
  explanation?: string;
  confidence?: number;
}

export function AIImpactDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [selectedOccupation, setSelectedOccupation] = useState<Occupation | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  // Load from localStorage on mount
  useEffect(() => {
    const savedOccupation = localStorage.getItem('selectedOccupation');
    if (savedOccupation) {
      try {
        setSelectedOccupation(JSON.parse(savedOccupation));
      } catch (e) {
        console.error('Error parsing saved occupation:', e);
      }
    }
  }, []);

  // Save to localStorage when occupation changes
  useEffect(() => {
    if (selectedOccupation) {
      localStorage.setItem('selectedOccupation', JSON.stringify(selectedOccupation));
      fetchTasks(selectedOccupation.code);
    }
  }, [selectedOccupation]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const path = `search?keyword=${encodeURIComponent(searchQuery)}&end=10`;
      const fnBase = typeof window !== 'undefined' && window.location.port === '8080' ? 'http://localhost:8888' : '';
      const url = `${fnBase}/.netlify/functions/onet-proxy?path=${encodeURIComponent(path)}`;
      console.debug('[AIImpactDashboard] fetching', { url, origin: window.location.origin });
      const resp = await fetch(url);
      console.debug('[AIImpactDashboard] response', { status: resp.status, url });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Search failed (${resp.status}): ${txt}`);
      }
      const contentType = resp.headers.get("Content-Type") || "";
      console.debug('[AIImpactDashboard] response', { status: resp.status, contentType });
      if (!contentType.toLowerCase().includes("json")) {
        const txt = await resp.text();
        throw new Error(`O*NET responded with non-JSON (${contentType}): ${txt.slice(0, 200)}`);
      }
      const data = await resp.json();
      
      let results: Occupation[] = [];
      if ((data as any).occupation) {
        const occ = (data as any).occupation;
        results = Array.isArray(occ)
          ? occ.map((o: any) => ({ code: o.code, title: o.title, description: o.description }))
          : [{ code: occ.code, title: occ.title, description: occ.description }];
      }
      
      setOccupations(results);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search occupations');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchTasks = async (occupationCode: string) => {
    setIsLoadingTasks(true);
    try {
      // First check if we have cached tasks
      const { data: cachedTasks, error: cacheError } = await supabase
        .from('ai_task_assessments')
        .select('*')
        .eq('occupation_code', occupationCode);

      if (!cacheError && cachedTasks && cachedTasks.length > 0) {
        // Transform cached tasks to our format
        const formattedTasks: Task[] = cachedTasks.map(task => ({
          description: task.task_description,
          category: task.category as 'Automate' | 'Augment' | 'Human-only',
          explanation: task.explanation,
          confidence: task.confidence
        }));
        
        setTasks(formattedTasks);
        toast.success('Tasks loaded from cache');
      } else {
        // If no cached data, fetch from the API
        const { data, error } = await supabase.functions.invoke('analyze-occupation-tasks', {
          body: { 
            occupation_code: occupationCode,
            occupation_title: selectedOccupation?.title
          },
        });

        if (error) throw error;
        
        setTasks(data.tasks || []);
        toast.success('Tasks analyzed successfully');
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to analyze tasks');
      setTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleSelectOccupation = (occupation: Occupation) => {
    setSelectedOccupation(occupation);
    setOccupations([]);
    setSearchQuery('');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Automate':
        return <Brain className="w-4 h-4 text-red-500" />;
      case 'Augment':
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'Human-only':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
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
      className="w-full space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600" />
              AI Impact Career Planner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Understand how AI might affect your job, which tasks could be automated or augmented, 
              and what skills to develop to stay relevant in your field.
            </p>
            
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search for your occupation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()}>
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
              
              {occupations.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {occupations.map((occ) => (
                    <div
                      key={occ.code}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleSelectOccupation(occ)}
                    >
                      <div className="font-medium">{occ.title}</div>
                      <div className="text-xs text-gray-500">Code: {occ.code}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedOccupation && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium">{selectedOccupation.title}</h3>
                    <p className="text-xs text-gray-600">O*NET Code: {selectedOccupation.code}</p>
                    {selectedOccupation.description && (
                      <p className="text-sm mt-2 text-gray-700">{selectedOccupation.description}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {selectedOccupation && (
        <motion.div variants={itemVariants}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                <span>Tasks Analysis</span>
              </TabsTrigger>
              <TabsTrigger value="assessment" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Task Assessment</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Skill Recommendations</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="tasks" className="space-y-4">
              {isLoadingTasks ? (
                <div className="flex justify-center items-center p-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : tasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['Automate', 'Augment', 'Human-only'].map((category) => {
                    const categoryTasks = tasks.filter(t => t.category === category);
                    return (
                      <Card key={category} className={`border-t-4 ${
                        category === 'Automate' ? 'border-t-red-500' : 
                        category === 'Augment' ? 'border-t-yellow-500' : 
                        'border-t-green-500'
                      }`}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            {getCategoryIcon(category)}
                            {category}
                            <Badge className="ml-auto">
                              {categoryTasks.length}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {categoryTasks.length > 0 ? (
                            categoryTasks.map((task, index) => (
                              <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm">
                                <p>{task.description}</p>
                                {task.explanation && (
                                  <p className="text-xs text-gray-600 mt-1">{task.explanation}</p>
                                )}
                                {task.confidence !== undefined && (
                                  <div className="mt-2">
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>Confidence</span>
                                      <span>{Math.round(task.confidence * 100)}%</span>
                                    </div>
                                    <Progress value={task.confidence * 100} className="h-1 mt-1" />
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              No tasks in this category
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">No Task Analysis Available</h3>
                  <p className="text-gray-600 mb-4">
                    We don't have task analysis data for this occupation yet.
                  </p>
                  <Button onClick={() => fetchTasks(selectedOccupation.code)}>
                    Analyze Tasks
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="assessment">
              <TaskAssessmentPanel occupationTitle={selectedOccupation.title} />
            </TabsContent>
            
            <TabsContent value="skills">
              <SkillRecommendationsPanel 
                occupationTitle={selectedOccupation.title}
                occupationCode={selectedOccupation.code}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      )}

      {!selectedOccupation && (
        <motion.div variants={itemVariants}>
          <Card className="bg-gray-50">
            <CardContent className="p-8 text-center">
              <Info className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">Select an Occupation</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Search for and select your occupation to see how AI might impact your job, 
                which tasks could be automated, and what skills to develop.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}