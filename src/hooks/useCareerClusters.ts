import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { 
  CareerCluster, 
  BrowseCareerClustersResponse,
  BrowseCareerClusterResponse 
} from "@/types/onet-enrichment";

/**
 * Hook to fetch all career clusters
 */
export function useCareerClusters() {
  return useQuery({
    queryKey: ["career-clusters"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("browse-career-clusters");

      if (error) throw error;
      return data as BrowseCareerClustersResponse;
    },
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days (reference data rarely changes)
  });
}

/**
 * Hook to fetch a specific career cluster with occupations
 */
export function useCareerCluster(clusterId?: string, includeOccupations = true) {
  return useQuery({
    queryKey: ["career-cluster", clusterId, includeOccupations],
    queryFn: async () => {
      if (!clusterId) return null;

      const url = `browse-career-clusters?clusterId=${clusterId}&includeOccupations=${includeOccupations}`;
      const { data, error } = await supabase.functions.invoke(url);

      if (error) throw error;
      return data as BrowseCareerClusterResponse;
    },
    enabled: !!clusterId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}
