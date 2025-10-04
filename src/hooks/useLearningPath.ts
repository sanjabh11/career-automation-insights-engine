import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SkillGap {
  name: string;
  currentLevel: number;
  targetLevel: number;
  category: string;
}

export interface LearningPathRequest {
  profileId?: string;
  targetOccupationCode: string;
  userSkills: SkillGap[];
  targetRole: string;
  currentRole: string;
  yearsExperience?: number;
  timeCommitment: string; // hours per week
  learningStyle: string;
  budget: string;
  currentSalary?: number;
  targetSalary?: number;
  saveToDB?: boolean;
}

export interface LearningMilestone {
  name: string;
  skills: string[];
  duration_weeks: number;
  resources: Array<{
    name: string;
    type: 'course' | 'certification' | 'project' | 'book';
    url?: string;
    cost: number;
  }>;
  cost_estimate: number;
  priority: 'Critical' | 'High' | 'Medium';
}

export interface LearningPathResult {
  learningPath: {
    id: string;
    name: string;
    description: string;
    skills: string[];
    estimatedDuration: string;
    difficulty: string;
    prerequisites: string[];
    milestones: LearningMilestone[];
  };
  savedPathId?: string;
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
    modelUsed: string;
    generationTimeMs: number;
  };
}

/**
 * Hook to generate personalized learning paths with ROI analysis
 */
export function useLearningPathGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (request: LearningPathRequest) => {
      const { data, error } = await supabase.functions.invoke("generate-learning-path", {
        body: request,
      });

      if (error) throw error;
      return data as LearningPathResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["learning-paths"] });
      
      const roi = data.financials.roiMonths;
      const roiMessage = roi 
        ? `Break-even in ${data.financials.breakEvenYears} years`
        : 'ROI calculation unavailable';

      toast({
        title: "Learning Path Generated",
        description: `${data.learningPath.name} - ${roiMessage}`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Failed to generate learning path",
      });
    },
  });

  return {
    generate: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    result: generateMutation.data,
    error: generateMutation.error,
  };
}

/**
 * Hook to fetch user's learning paths
 */
export function useLearningPaths(status?: 'draft' | 'active' | 'paused' | 'completed' | 'abandoned') {
  return useQuery({
    queryKey: ["learning-paths", status],
    queryFn: async () => {
      let query = supabase
        .from("learning_paths")
        .select("*")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

/**
 * Hook to fetch a specific learning path by ID
 */
export function useLearningPath(pathId?: string) {
  return useQuery({
    queryKey: ["learning-path", pathId],
    queryFn: async () => {
      if (!pathId) return null;

      const { data, error } = await supabase
        .from("learning_paths")
        .select("*")
        .eq("id", pathId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!pathId,
  });
}

/**
 * Hook to update learning path status
 */
export function useLearningPathUpdate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ 
      pathId, 
      updates 
    }: { 
      pathId: string; 
      updates: Partial<{
        status: string;
        current_milestone_index: number;
        completion_percentage: number;
      }>;
    }) => {
      const { data, error } = await supabase
        .from("learning_paths")
        .update(updates)
        .eq("id", pathId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["learning-paths"] });
      queryClient.invalidateQueries({ queryKey: ["learning-path", data.id] });
      toast({
        title: "Learning Path Updated",
        description: `Status changed to: ${data.status}`,
      });
    },
  });

  return {
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}

/**
 * Hook to track progress on a specific milestone
 */
export function useMilestoneProgress(pathId?: string) {
  const queryClient = useQueryClient();

  const updateProgressMutation = useMutation({
    mutationFn: async ({
      milestoneIndex,
      status,
      progressPercentage,
      skillsAcquired,
      notes,
    }: {
      milestoneIndex: number;
      status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
      progressPercentage?: number;
      skillsAcquired?: string[];
      notes?: string;
    }) => {
      if (!pathId) throw new Error("Path ID is required");

      const { data: path } = await supabase
        .from("learning_paths")
        .select("milestones")
        .eq("id", pathId)
        .single();

      if (!path) throw new Error("Learning path not found");

      const milestones = path.milestones as any[];
      const milestoneName = milestones[milestoneIndex]?.name || `Milestone ${milestoneIndex + 1}`;

      const progressData = {
        learning_path_id: pathId,
        milestone_index: milestoneIndex,
        milestone_name: milestoneName,
        status,
        progress_percentage: progressPercentage || 0,
        skills_acquired: skillsAcquired || [],
        notes,
        started_at: status === 'in_progress' ? new Date().toISOString() : undefined,
        completed_at: status === 'completed' ? new Date().toISOString() : undefined,
      };

      const { data, error } = await supabase
        .from("learning_path_progress")
        .upsert(progressData, { onConflict: "learning_path_id,milestone_index" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-path", pathId] });
      queryClient.invalidateQueries({ queryKey: ["milestone-progress", pathId] });
    },
  });

  // Fetch progress for all milestones
  const { data: progress } = useQuery({
    queryKey: ["milestone-progress", pathId],
    queryFn: async () => {
      if (!pathId) return [];

      const { data, error } = await supabase
        .from("learning_path_progress")
        .select("*")
        .eq("learning_path_id", pathId)
        .order("milestone_index");

      if (error) throw error;
      return data;
    },
    enabled: !!pathId,
  });

  return {
    progress,
    updateProgress: updateProgressMutation.mutate,
    isUpdating: updateProgressMutation.isPending,
  };
}
