import { useQuery } from "@tanstack/react-query";

export type CrosswalkFrom = "MOC" | "CIP" | "RAPIDS" | "ESCO" | "DOT" | "SOC";
export type CrosswalkTo = "MOC" | "CIP" | "RAPIDS" | "ESCO" | "DOT" | "SOC";

export interface CrosswalkParams {
  from: CrosswalkFrom;
  code: string;
  to?: CrosswalkTo;
  enabled?: boolean;
}

export function useCrosswalk<T = unknown>({ from, code, to, enabled = true }: CrosswalkParams) {
  const key = ["crosswalk", from, code, to ?? "ALL"] as const;

  const fetcher = async (): Promise<T> => {
    if (!code) throw new Error("Crosswalk requires a code");
    const qs = new URLSearchParams({ from, code });
    if (to) qs.set("to", to);
    const url = `/functions/v1/crosswalk?${qs.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Crosswalk request failed (${res.status})`);
    const ct = res.headers.get("Content-Type") || "";
    if (ct.includes("json")) return (await res.json()) as T;
    return (await res.text()) as unknown as T;
  };

  return useQuery<T>({
    queryKey: key,
    queryFn: fetcher,
    enabled: !!code && enabled,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });
}
