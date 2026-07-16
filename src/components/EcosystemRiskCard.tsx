import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRelatedOccupations } from "@/hooks/useOnetEnrichment";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface EcosystemRiskCardProps {
  occupationCode: string;
  occupationTitle?: string;
}

interface RelatedOccupationInput {
  code: string;
  title: string;
  similarity_score?: number;
  similarityScore?: number;
}

interface CascadeContributor {
  occupation_code: string;
  title: string;
  weight: number;
  automation_prob: number;
}

interface CascadeRiskResult {
  cascade_score: number;
  timeline_months?: number;
  top_contributors?: CascadeContributor[];
}

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const normalizeRelatedOccupation = (value: unknown): RelatedOccupationInput | null => {
  if (!isRecord(value)) return null;

  const code = asString(value.code);
  const title = asString(value.title);
  if (!code || !title) return null;

  const similarity_score = asNumber(value.similarity_score);
  const similarityScore = asNumber(value.similarityScore);

  return {
    code,
    title,
    ...(similarity_score !== undefined ? { similarity_score } : {}),
    ...(similarityScore !== undefined ? { similarityScore } : {}),
  };
};

const normalizeCascadeContributor = (value: unknown): CascadeContributor | null => {
  if (!isRecord(value)) return null;

  const occupation_code = asString(value.occupation_code) || asString(value.code);
  const title = asString(value.title);
  const weight = asNumber(value.weight);
  const automation_prob = asNumber(value.automation_prob) ?? asNumber(value.automationProb);

  if (!occupation_code || !title || weight === undefined || automation_prob === undefined) return null;

  return {
    occupation_code,
    title,
    weight: clamp01(weight),
    automation_prob: clamp01(automation_prob),
  };
};

const normalizeCascadeResult = (value: unknown): CascadeRiskResult | null => {
  if (!isRecord(value)) return null;

  const cascade_score = asNumber(value.cascade_score) ?? asNumber(value.cascadeScore);
  if (cascade_score === undefined) return null;

  const timeline_months = asNumber(value.timeline_months);
  const top_contributors = Array.isArray(value.top_contributors)
    ? value.top_contributors.flatMap((contributor) => {
      const normalizedContributor = normalizeCascadeContributor(contributor);
      return normalizedContributor ? [normalizedContributor] : [];
    })
    : [];

  return {
    cascade_score,
    ...(timeline_months !== undefined ? { timeline_months } : {}),
    ...(top_contributors.length > 0 ? { top_contributors } : {}),
  };
};

const normalizeApoScore = (value: unknown): number => {
  if (!isRecord(value)) return 0;
  return asNumber(value.apo_score) ?? asNumber(value.overallAPO) ?? 0;
};

export function EcosystemRiskCard({ occupationCode, occupationTitle }: EcosystemRiskCardProps) {
  const { relatedOccupations, isLoading, error: relatedError } = useRelatedOccupations(occupationCode);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<CascadeRiskResult | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const top = Array.isArray(relatedOccupations)
        ? relatedOccupations
          .flatMap((occupation) => {
            const normalizedOccupation = normalizeRelatedOccupation(occupation);
            return normalizedOccupation ? [normalizedOccupation] : [];
          })
          .slice(0, 3)
        : [];
      if (!top.length) {
        setError('No related occupations available.');
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string,string> = {};
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const upstream: { occupation_code: string; title: string; weight: number; automation_prob: number }[] = [];
      for (const rel of top) {
        const { data, error } = await supabase.functions.invoke('calculate-apo', {
          body: { occupation: { code: rel.code, title: rel.title } },
          headers,
        });
        if (error) throw error;
        const apo = normalizeApoScore(data);
        const sim = rel.similarity_score ?? rel.similarityScore;
        const weight = typeof sim === 'number' ? Math.max(0, Math.min(1, sim)) : 0.3;
        upstream.push({ occupation_code: rel.code, title: rel.title, weight, automation_prob: Math.max(0, Math.min(1, apo / 100)) });
      }

      const { data: cascade, error: cErr } = await supabase.functions.invoke('cascade-risk', {
        body: { occupation_code: occupationCode, upstream },
      });
      if (cErr) throw cErr;
      const normalizedCascade = normalizeCascadeResult(cascade);
      if (!normalizedCascade) throw new Error('Cascade response missing expected risk data.');
      setResult(normalizedCascade);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Cascade calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Ecosystem Risk</h3>
        <Badge variant="outline" className="text-[10px]">Cascade Model</Badge>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mb-3">Upstream automation can impact your role via dependencies.</p>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={run} disabled={loading || isLoading}>{loading ? 'Computing…' : 'Compute Cascade'}</Button>
        {(loading || isLoading) && <LoadingSpinner size="sm" />}
        {error && <div className="text-xs text-red-600">{error}</div>}
        {!loading && !isLoading && !error && Array.isArray(relatedOccupations) && relatedOccupations.length === 0 && (
          <div className="text-xs text-[var(--text-secondary)]">No related occupations found. Add O*NET credentials to enable cascade.</div>
        )}
        {relatedError && !error && <div className="text-xs text-red-600">{String(relatedError)}</div>}
      </div>
      {result && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">Cascade Score: {Math.round(result.cascade_score)} / 100</Badge>
            {typeof result.timeline_months === 'number' && (
              <Badge variant="outline" className="text-xs">Timeline: {result.timeline_months} mo</Badge>
            )}
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--text-secondary)] mb-1">Top Contributors</div>
            <div className="space-y-1">
              {result.top_contributors?.map((c, idx) => (
                <div key={idx} className="text-xs text-[var(--text-secondary)] flex items-center justify-between">
                  <span className="truncate mr-2">{c.title} ({c.occupation_code})</span>
                  <span className="text-[var(--text-tertiary)]">w={c.weight} • p={Math.round((c.automation_prob||0)*100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
