import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CrosswalkFrom = "MOC" | "CIP" | "RAPIDS" | "ESCO" | "DOT" | "SOC" | "OOH";
export type CrosswalkTo = "MOC" | "CIP" | "RAPIDS" | "ESCO" | "DOT" | "SOC";

export interface CrosswalkParams {
  from: CrosswalkFrom;
  code: string;
  to?: CrosswalkTo;
  enabled?: boolean;
}

export const useCrosswalk = <T = unknown>({ from, code, to, enabled = true }: CrosswalkParams) => {
  const key = ["crosswalk", from, code, to ?? "ALL"] as const;

  const fetcher = async (): Promise<T> => {
    if (!code) throw new Error("Crosswalk requires a code");
    const { data, error } = await supabase.functions.invoke("crosswalk", {
      body: { from, code, ...(to ? { to } : {}) },
    });
    if (error) throw new Error(error.message || "Crosswalk request failed");
    return data as T;
  };

  return useQuery<T>({
    queryKey: key,
    queryFn: fetcher,
    enabled: !!code && enabled,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
};
