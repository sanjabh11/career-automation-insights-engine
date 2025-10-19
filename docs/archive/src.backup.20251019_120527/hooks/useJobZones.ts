import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { 
  JobZone, 
  BrowseJobZonesResponse,
  BrowseJobZoneResponse 
} from "@/types/onet-enrichment";

/**
 * Hook to fetch all job zones (5 education/experience levels)
 */
export function useJobZones() {
  return useQuery({
    queryKey: ["job-zones"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("browse-job-zones");

      if (error) throw error;
      return data as BrowseJobZonesResponse;
    },
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days (reference data rarely changes)
  });
}

/**
 * Hook to fetch a specific job zone with occupations
 */
export function useJobZone(zoneNumber?: number, includeOccupations = true) {
  return useQuery({
    queryKey: ["job-zone", zoneNumber, includeOccupations],
    queryFn: async () => {
      if (!zoneNumber) return null;

      const url = `browse-job-zones?zone=${zoneNumber}&includeOccupations=${includeOccupations}`;
      const { data, error } = await supabase.functions.invoke(url);

      if (error) throw error;
      return data as BrowseJobZoneResponse;
    },
    enabled: !!zoneNumber,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}
