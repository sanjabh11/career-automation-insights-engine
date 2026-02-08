import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { APIErrorHandler, withRetry } from "@/utils/apiErrorHandler";
import type { OnetEnrichmentData } from "@/types/onet-enrichment";

/**
 * Hook to fetch O*NET enrichment data for an occupation
 * Includes: Bright Outlook, Employment Data, Wages, Related Occupations
 */
export function useOnetEnrichment(occupationCode?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: enrichmentData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["onet-enrichment", occupationCode],
    queryFn: async () => {
      if (!occupationCode) return null;

      const { data, error } = await supabase.functions.invoke("onet-enrichment", {
        body: { occupationCode, forceRefresh: false },
      });

      if (error) throw error;
      return data as OnetEnrichmentData;
    },
    enabled: !!occupationCode,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (data is cached 30 days on backend)
    retry: 2,
  });

  const forceRefreshMutation = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.functions.invoke("onet-enrichment", {
        body: { occupationCode: code, forceRefresh: true },
      });

      if (error) throw error;
      return data as OnetEnrichmentData;
    },
    onSuccess: (data, code) => {
      queryClient.setQueryData(["onet-enrichment", code], data);
      toast({
        title: "Data Refreshed",
        description: "O*NET enrichment data updated successfully",
      });
    },
    onError: (error) => {
      const apiError = APIErrorHandler.handle(error);
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: apiError.message,
      });
    },
  });

  return {
    enrichmentData,
    isLoading,
    error,
    refetch,
    forceRefresh: forceRefreshMutation.mutate,
    isRefreshing: forceRefreshMutation.isPending,
  };
}

/**
 * Hook to fetch related occupations
 */
export function useRelatedOccupations(occupationCode?: string) {
  const { data: enrichmentData } = useOnetEnrichment(occupationCode);
  
  return {
    relatedOccupations: enrichmentData?.relatedOccupations || [],
    isLoading: !enrichmentData && !!occupationCode,
  };
}

/**
 * Hook to check if occupation has Bright Outlook
 */
export function useBrightOutlook(occupationCode?: string) {
  const { enrichmentData, isLoading } = useOnetEnrichment(occupationCode);

  return {
    hasBrightOutlook: enrichmentData?.bright_outlook || false,
    brightOutlookCategory: enrichmentData?.bright_outlook_category,
    isLoading,
  };
}

/**
 * Hook to get employment outlook data
 */
export function useEmploymentOutlook(occupationCode?: string) {
  const { enrichmentData, isLoading } = useOnetEnrichment(occupationCode);

  return {
    employmentData: enrichmentData
      ? {
          current: enrichmentData.employment_current,
          projected: enrichmentData.employment_projected,
          changePercent: enrichmentData.employment_change_percent,
          annualOpenings: enrichmentData.job_openings_annual,
          growthRate: enrichmentData.growth_rate,
          outlookCategory: enrichmentData.outlook_category,
        }
      : null,
    isLoading,
  };
}

/**
 * Hook to get wage data
 */
export function useWageData(occupationCode?: string) {
  const { enrichmentData, isLoading } = useOnetEnrichment(occupationCode);

  return {
    wageData: enrichmentData
      ? {
          annualMedian: enrichmentData.median_wage_annual,
          hourlyMedian: enrichmentData.median_wage_hourly,
          rangeLow: enrichmentData.wage_range_low,
          rangeHigh: enrichmentData.wage_range_high,
        }
      : null,
    isLoading,
  };
}
