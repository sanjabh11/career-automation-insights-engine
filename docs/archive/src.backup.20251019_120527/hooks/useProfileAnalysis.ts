import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProfileAnalysisRequest {
  profileId?: string;
  analysisType: 'automation_risk' | 'gap_analysis' | 'career_match' | 'skill_assessment';
  targetOccupationCode?: string;
  profileData?: {
    currentOccupation?: string;
    yearsExperience?: number;
    educationLevel?: string;
    technicalSkills?: string[];
    softSkills?: string[];
    certifications?: string[];
  };
}

export interface ProfileAnalysisResult {
  analysisId: string;
  analysisType: string;
  automationRiskScore?: number;
  automationRiskCategory?: string;
  skillGaps?: Array<{
    skill: string;
    importance: string;
    currentLevel: string;
    targetLevel: string;
    estimatedTimeToAcquire: string;
  }>;
  recommendations?: Array<{
    title: string;
    description: string;
    priority: string;
    estimatedCost?: number;
    estimatedDuration?: string;
  }>;
  matchScore?: number;
  matchFactors?: Record<string, any>;
  estimatedTransitionMonths?: number;
}

/**
 * Hook to analyze user profile for automation risk, skill gaps, career match, etc.
 */
export function useProfileAnalysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (request: ProfileAnalysisRequest) => {
      const { data, error } = await supabase.functions.invoke("analyze-profile", {
        body: request,
      });

      if (error) throw error;
      return data as ProfileAnalysisResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profile-analyses"] });
      toast({
        title: "Analysis Complete",
        description: `${data.analysisType.replace('_', ' ')} analysis completed successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "Failed to analyze profile",
      });
    },
  });

  return {
    analyze: analyzeMutation.mutate,
    isAnalyzing: analyzeMutation.isPending,
    result: analyzeMutation.data,
    error: analyzeMutation.error,
  };
}

/**
 * Hook to fetch previous profile analyses for a user
 */
export function useProfileAnalysisHistory() {
  return useQuery({
    queryKey: ["profile-analyses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Hook to fetch a specific analysis by ID
 */
export function useProfileAnalysisById(analysisId?: string) {
  return useQuery({
    queryKey: ["profile-analysis", analysisId],
    queryFn: async () => {
      if (!analysisId) return null;

      const { data, error } = await supabase
        .from("profile_analyses")
        .select("*")
        .eq("id", analysisId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!analysisId,
  });
}
