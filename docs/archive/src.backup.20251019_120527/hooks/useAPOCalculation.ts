
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { APIErrorHandler, withRetry } from "@/utils/apiErrorHandler";
import { apoRateLimiter, checkRateLimit } from "@/utils/rateLimiting";
import { getFunctionsBaseUrl } from "@/lib/utils";

export interface APOAnalysis {
  occupation_code: string;
  occupation_title: string;
  overall_score: number;
  confidence_level: number;
  automation_timeline: string;
  risk_level: 'Low' | 'Medium' | 'Med-High' | 'High';
  category_breakdown: {
    tasks: { score: number; details: any[] };
    knowledge: { score: number; details: any[] };
    skills: { score: number; details: any[] };
    abilities: { score: number; details: any[] };
    technology: { score: number; details: any[] };
  };
  insights: {
    opportunities: string[];
    challenges: string[];
    recommendations: string[];
  };
  job_market: {
    current_demand: string;
    salary_range: string;
    growth_outlook: string;
    locations: string[];
  };
}

export function useAPOCalculation() {
  const [isCalculating, setIsCalculating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  function isMissingRelationOrColumn(error: any): boolean {
    const msg = String(error?.message || "");
    const code = String(error?.code || "");
    return (
      code === "42P01" || // undefined_table
      code === "42703" || // undefined_column
      /relation .* does not exist/i.test(msg) ||
      /column .* does not exist/i.test(msg)
    );
  }

  // Health check mutation
  const healthCheckMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('health_check');
      if (error) throw error;
      return data;
    }
  });

  const calculateAPO = async (occupationCode: string, occupationTitle: string): Promise<APOAnalysis> => {
    setIsCalculating(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      // Check rate limiting
      const rateCheck = checkRateLimit(apoRateLimiter, user.id);
      if (!rateCheck.allowed) {
        const resetTime = new Date(rateCheck.resetTime);
        throw new Error(`Rate limit exceeded. Try again at ${resetTime.toLocaleTimeString()}`);
      }

      // Check and deduct API credits before processing
      const { data: creditsDeducted, error: creditsError } = await supabase.rpc('deduct_api_credits', {
        p_user_id: user.id,
        p_credits_to_deduct: 1.0
      });

      if (creditsError) {
        console.error('Credits deduction error:', creditsError);
        throw new Error('Failed to process credits');
      }

      if (!creditsDeducted) {
        // Send notification about insufficient credits
        await supabase.rpc('create_notification', {
          p_user_id: user.id,
          p_title: 'Insufficient Credits',
          p_message: 'You don\'t have enough API credits to perform this analysis. Please upgrade your plan.',
          p_type: 'warning'
        });
        
        throw new Error('Insufficient API credits. Please upgrade your plan.');
      }

      // Check cache first
      const { data: cached, error: cacheError } = await supabase
        .from('apo_analysis_cache')
        .select('*')
        .eq('occupation_code', occupationCode)
        .maybeSingle();

      if (cacheError && !isMissingRelationOrColumn(cacheError)) {
        throw cacheError;
      }

      if (!cacheError && cached && (cached as any).analysis_data) {
        console.log('Using cached APO analysis');
        setIsCalculating(false);
        
        // Send success notification
        await supabase.rpc('create_notification', {
          p_user_id: user.id,
          p_title: 'Analysis Complete',
          p_message: `APO analysis completed for ${occupationTitle}`,
          p_type: 'success'
        });

        return cached.analysis_data as unknown as APOAnalysis;
      }

      // Calculate new APO analysis with retry logic (via Netlify apo-proxy to avoid exposing keys client-side)
      const analysis = await withRetry(async () => {
        const fnBase = getFunctionsBaseUrl();
        const url = `${fnBase}/.netlify/functions/apo-proxy`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ occupation: { code: occupationCode, title: occupationTitle } })
        });
        if (!resp.ok) {
          const txt = await resp.text();
          throw new Error(`APO proxy failed (${resp.status}): ${txt}`);
        }
        const payload = await resp.json();
        if (payload?.error) throw new Error(payload.error);
        return payload.analysis;
      }, 'APO calculation');

      // Cache the result (ignore if cache table doesn't exist yet)
      const { error: upsertError } = await supabase
        .from('apo_analysis_cache')
        .upsert({
          occupation_code: occupationCode,
          occupation_title: occupationTitle,
          analysis_data: analysis
        });

      if (upsertError && !isMissingRelationOrColumn(upsertError)) {
        throw upsertError;
      }

      // Send success notification
      await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_title: 'Analysis Complete',
        p_message: `APO analysis completed for ${occupationTitle}`,
        p_type: 'success'
      });

      // Invalidate user profile to update credits display
      queryClient.invalidateQueries({ queryKey: ['user_profile'] });

      setIsCalculating(false);
      return analysis;

    } catch (error) {
      setIsCalculating(false);
      const apiError = APIErrorHandler.handle(error);
      APIErrorHandler.logError(apiError, 'APO Calculation');
      
      console.error('APO Calculation Error:', error);
      
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: apiError.message,
      });
      
      throw error;
    }
  };

  const getJobMarketData = async (occupationTitle: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const data = await withRetry(async () => {
        const { data, error } = await supabase.functions.invoke('serpapi-jobs', {
          body: { occupation_title: occupationTitle }
        });
        
        if (error) throw error;
        return data;
      }, 'Job market data fetch');

      return data;
    } catch (error) {
      const apiError = APIErrorHandler.handle(error);
      APIErrorHandler.logError(apiError, 'Job Market Data');
      console.error('Job Market Data Error:', error);
      return null;
    }
  };

  return {
    calculateAPO,
    getJobMarketData,
    isCalculating,
    healthCheck: () => healthCheckMutation.mutate()
  };
}
