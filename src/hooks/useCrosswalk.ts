import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/asyncTimeout";
import { getCrosswalkFallback } from "@/lib/crosswalkFallbacks";

export type CrosswalkFrom = "MOC" | "CIP" | "RAPIDS" | "ESCO" | "DOT" | "SOC" | "OOH";
export type CrosswalkTo = "MOC" | "CIP" | "RAPIDS" | "ESCO" | "DOT" | "SOC";

export interface CrosswalkParams {
  from: CrosswalkFrom;
  code: string;
  to?: CrosswalkTo;
  branch?: string;
  enabled?: boolean;
}

const CROSSWALK_TIMEOUT_MS = 15_000;

export const useCrosswalk = <T = unknown>({ from, code, to, branch, enabled = true }: CrosswalkParams) => {
  const key = ["crosswalk", from, code, to ?? "ALL", branch ?? "all"] as const;

  const fetcher = async (): Promise<T> => {
    if (!code) throw new Error("Crosswalk requires a code");
    const fallback = getCrosswalkFallback({ from, code, to, branch });

    const { data, error } = await withTimeout(
      supabase.functions.invoke("crosswalk", {
        body: { from, code, ...(to ? { to } : {}), ...(branch ? { branch } : {}) },
      }),
      CROSSWALK_TIMEOUT_MS,
      "Crosswalk Edge Function timed out."
    ).catch((error: unknown) => {
      if (fallback) return { data: fallback, error: null };
      throw error;
    });

    if (error) {
      if (fallback) return fallback as T;
      throw new Error(
        error.message ||
        "Crosswalk Edge Function is unavailable. Verify the Supabase function deployment and O*NET credentials."
      );
    }

    if (!data && fallback) return fallback as T;
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
