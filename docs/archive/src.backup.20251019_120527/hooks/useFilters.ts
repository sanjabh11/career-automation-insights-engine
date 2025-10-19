import { useQuery } from "@tanstack/react-query";

export type FiltersResponse = {
  jobZones: { id: number; name: string }[];
  brightOutlook: { id: number; name: string }[];
  stem: { id: number; name: string }[];
  clusters: { id: number; name: string }[];
  industries: { id: number; name: string }[];
};

export function useFilters(options?: Parameters<typeof useQuery<FiltersResponse>>[2]) {
  const fetcher = async (): Promise<FiltersResponse> => {
    const res = await fetch("/functions/v1/filters", { method: "GET" });
    if (!res.ok) throw new Error(`Filters fetch failed (${res.status})`);
    return (await res.json()) as FiltersResponse;
  };
  return useQuery<FiltersResponse>(["filters"], fetcher, { staleTime: 5 * 60 * 1000, ...options });
}
