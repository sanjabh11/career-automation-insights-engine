import type { CrosswalkFrom, CrosswalkTo } from "@/hooks/useCrosswalk";

type CrosswalkFallbackParams = {
  from: CrosswalkFrom;
  code: string;
  to?: CrosswalkTo;
  branch?: string;
};

type CrosswalkOccupation = {
  code: string;
  title: string;
  source: string;
};

type CrosswalkFallback = {
  fallback: true;
  source: "local_repo_fallback";
  caveat: string;
  results: CrosswalkOccupation[];
  match?: Array<{
    code: string;
    title: string;
    occupation: CrosswalkOccupation[];
  }>;
};

const FALLBACK_CAVEAT =
  "Local fallback used because the live Supabase /crosswalk Edge Function is unavailable. This keeps verified sample workflows usable, but it is not a live O*NET response.";

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function normalizeSoc(code: string): string {
  return normalizeCode(code).replace(/\.00$/, "");
}

export function getCrosswalkFallback({
  from,
  code,
  to,
  branch,
}: CrosswalkFallbackParams): CrosswalkFallback | null {
  const normalizedFrom = from.toUpperCase();
  const normalizedTo = to?.toUpperCase();
  const normalizedCode = normalizeCode(code);
  const normalizedBranch = branch?.trim().toLowerCase();

  if (
    normalizedFrom === "MOC" &&
    normalizedCode === "11B" &&
    (!normalizedBranch || normalizedBranch === "army")
  ) {
    const occupations: CrosswalkOccupation[] = [
      {
        code: "33-3051.00",
        title: "Police and Sheriff's Patrol Officers",
        source: "Army 11B sample fallback",
      },
      {
        code: "33-1091.00",
        title: "First-Line Supervisors of Security Workers",
        source: "Army 11B sample fallback",
      },
      {
        code: "33-9032.00",
        title: "Security Guards",
        source: "Army 11B sample fallback",
      },
      {
        code: "33-3012.00",
        title: "Correctional Officers and Jailers",
        source: "Army 11B sample fallback",
      },
    ];

    return {
      fallback: true,
      source: "local_repo_fallback",
      caveat: FALLBACK_CAVEAT,
      results: occupations,
      match: [
        {
          code: "11B",
          title: "Infantryman (Army)",
          occupation: occupations,
        },
      ],
    };
  }

  if (
    normalizedFrom === "SOC" &&
    (!normalizedTo || normalizedTo === "ALL" || normalizedTo === "CIP") &&
    normalizeSoc(code) === "15-1252"
  ) {
    return {
      fallback: true,
      source: "local_repo_fallback",
      caveat: FALLBACK_CAVEAT,
      results: [
        {
          code: "11.0101",
          title: "Computer and Information Sciences, General",
          source: "SOC 15-1252 sample fallback",
        },
        {
          code: "11.0201",
          title: "Computer Programming/Programmer, General",
          source: "SOC 15-1252 sample fallback",
        },
        {
          code: "11.0701",
          title: "Computer Science",
          source: "SOC 15-1252 sample fallback",
        },
      ],
    };
  }

  return null;
}

export function isCrosswalkFallback(value: unknown): value is CrosswalkFallback {
  return (
    typeof value === "object" &&
    value !== null &&
    "fallback" in value &&
    (value as { fallback?: unknown }).fallback === true
  );
}
