import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getFunctionsBaseUrl } from "@/lib/utils";

/**
 * Hook: useOnet
 * Fetches live data from the O*NET Web-Services via the onetProxy edge function.
 *
 * NOTE: The onet-proxy Supabase function was retired in Oct 2025 to stay within
 * plan quotas. Keep this hook around for historical reference; new features
 * should rely on Supabase-backed data (e.g. search-occupations / onet-enrichment)
 * until a consolidated proxy is reintroduced.
 *
 * @param path  The O*NET Web Service path starting with a leading `/`,
 *              e.g. `/ws/online/present/taxonomy/occupation/11-1011.00`.
 * @param options Optional React-Query options (staleTime, cacheTime, enabled …)
 */
export function useOnet<T = unknown>(
  path: string,
  options?: UseQueryOptions<T, Error, T, readonly unknown[]>
) {
  const fetcher = async (): Promise<T> => {
    if (!path.startsWith("/")) {
      throw new Error("useOnet path must start with / (e.g. /ws/…)");
    }
    // Use Supabase Edge Function proxy instead of Netlify
    const url = `/functions/v1/onet-proxy?path=${encodeURIComponent(path)}`;
    console.debug('[useOnet] fetching', { url, origin: window.location.origin });
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`O*NET request failed (${res.status})`);
    }
    // O*NET can return XML or JSON depending on endpoint; try JSON first
    const contentType = res.headers.get("Content-Type") || "";
    console.debug('[useOnet] response', { status: res.status, contentType });
    if (contentType.toLowerCase().includes("json")) {
      return (await res.json()) as T;
    }
    const text = await res.text();
    // naive XML-to-string return. Callers can parse as needed.
    return text as unknown as T;
  };

  return useQuery<T>({
    queryKey: ["onet", path],
    queryFn: fetcher,
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 30,
    retry: 2,
    ...(options as any),
  });
}
