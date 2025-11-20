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

export function EcosystemRiskCard({ occupationCode, occupationTitle }: EcosystemRiskCardProps) {
  const { relatedOccupations, isLoading, error: relatedError } = useRelatedOccupations(occupationCode);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<any | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const top = (relatedOccupations || []).slice(0, 3);
      if (!top.length) {
        setError('No related occupations available.');
        setLoading(false);
        return;
      }

      const apoKey = import.meta.env.VITE_APO_FUNCTION_API_KEY as string | undefined;
      if (!apoKey) {
        setError('APO configuration missing.');
        setLoading(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string,string> = { 'x-api-key': apoKey };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const upstream: { occupation_code: string; title: string; weight: number; automation_prob: number }[] = [];
      for (const rel of top) {
        const { data, error } = await supabase.functions.invoke('calculate-apo', {
          body: { occupation: { code: rel.code, title: rel.title } },
          headers,
        });
        if (error) throw error;
        const apo = (data?.apo_score ?? data?.overallAPO ?? 0) as number;
        const sim = (rel as any).similarity_score ?? (rel as any).similarityScore;
        const weight = typeof sim === 'number' ? Math.max(0, Math.min(1, sim)) : 0.3;
        upstream.push({ occupation_code: rel.code, title: rel.title, weight, automation_prob: Math.max(0, Math.min(1, apo / 100)) });
      }

      const { data: cascade, error: cErr } = await supabase.functions.invoke('cascade-risk', {
        body: { occupation_code: occupationCode, upstream },
      });
      if (cErr) throw cErr;
      setResult(cascade);
    } catch (e: any) {
      setError(e?.message || 'Cascade calculation failed');
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
      <p className="text-xs text-gray-600 mb-3">Upstream automation can impact your role via dependencies.</p>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={run} disabled={loading || isLoading}>{loading ? 'Computing…' : 'Compute Cascade'}</Button>
        {(loading || isLoading) && <LoadingSpinner size="sm" />}
        {error && <div className="text-xs text-red-600">{error}</div>}
        {!loading && !isLoading && !error && Array.isArray(relatedOccupations) && relatedOccupations.length === 0 && (
          <div className="text-xs text-gray-600">No related occupations found. Add O*NET credentials to enable cascade.</div>
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
            <div className="text-xs font-medium text-gray-700 mb-1">Top Contributors</div>
            <div className="space-y-1">
              {Array.isArray(result.top_contributors) && result.top_contributors.map((c: any, idx: number) => (
                <div key={idx} className="text-xs text-gray-700 flex items-center justify-between">
                  <span className="truncate mr-2">{c.title} ({c.occupation_code})</span>
                  <span className="text-gray-500">w={c.weight} • p={Math.round((c.automation_prob||0)*100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
