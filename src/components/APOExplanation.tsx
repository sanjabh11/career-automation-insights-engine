import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type CategoryKey = "tasks" | "knowledge" | "skills" | "abilities" | "technologies";

type Item = { description: string; apo: number; factors?: string[] };

type EnhancedOccupationData = {
  code: string;
  title: string;
  overallAPO: number;
  categoryBreakdown: Record<CategoryKey, { apo: number; confidence: string }>;
  tasks?: Item[];
  knowledge?: Item[];
  skills?: Item[];
  abilities?: Item[];
  technologies?: Item[];
  ci?: { lower?: number; upper?: number; iterations?: number };
};

type Explanation = {
  narrative: string;
  waterfall: Array<{ category: CategoryKey; apo_contribution: number; rationale: string }>;
  top_factors?: string[];
  uncertainties?: string[];
  next_steps?: string[];
  disclaimer?: string;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occupation: EnhancedOccupationData;
}

export default function APOExplanation({ open, onOpenChange, occupation }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<Explanation | null>(null);

  const fetchExplanation = React.useCallback(async () => {
    if (!occupation?.code || !occupation?.title) return;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      const apiKey = import.meta.env.VITE_APO_FUNCTION_API_KEY as string | undefined;
      if (apiKey) headers["x-api-key"] = apiKey;
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

      const body = {
        occupation: { code: occupation.code, title: occupation.title },
        analysis: {
          overallAPO: occupation.overallAPO,
          categoryBreakdown: occupation.categoryBreakdown,
          tasks: occupation.tasks?.slice(0, 10) || [],
          knowledge: occupation.knowledge?.slice(0, 10) || [],
          skills: occupation.skills?.slice(0, 10) || [],
          abilities: occupation.abilities?.slice(0, 10) || [],
          technologies: occupation.technologies?.slice(0, 10) || [],
          ci: occupation.ci || undefined,
        },
      };

      const { data, error } = await supabase.functions.invoke("explain-apo", { body, headers });
      if (error) throw new Error(error.message || "Failed to get explanation");
      const explanation = (data as any)?.explanation as Explanation | undefined;
      if (!explanation) throw new Error("Malformed response from explain-apo");
      setData(explanation);
    } catch (e: any) {
      setError(e?.message || "Failed to load explanation");
    } finally {
      setLoading(false);
    }
  }, [occupation?.code, occupation?.title, occupation?.overallAPO]);

  React.useEffect(() => {
    if (open) fetchExplanation();
  }, [open, fetchExplanation]);

  const categories: CategoryKey[] = ["tasks", "knowledge", "skills", "abilities", "technologies"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Explain Automation Potential</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {loading && (
            <div className="text-sm text-muted-foreground">Generating explanation…</div>
          )}
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          {!loading && !error && data && (
            <div className="space-y-6">
              <div className="text-sm leading-6 text-foreground/90">
                {data.narrative}
              </div>

              {Array.isArray(data.waterfall) && data.waterfall.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">Factor waterfall</div>
                  <div className="space-y-2">
                    {data.waterfall.map((w, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 p-2 rounded border">
                        <div className="text-sm font-medium min-w-[120px]">{w.category}</div>
                        <div className="flex-1 text-xs text-muted-foreground">{w.rationale}</div>
                        <div className={`text-sm font-semibold ${w.apo_contribution >= 0 ? "text-green-700" : "text-red-700"}`}>
                          {w.apo_contribution >= 0 ? "+" : ""}{w.apo_contribution.toFixed(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(data.top_factors) && data.top_factors.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">Top factors</div>
                  <div className="flex flex-wrap gap-2">
                    {data.top_factors.map((f, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(data.uncertainties) && data.uncertainties.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">Uncertainties</div>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {data.uncertainties.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(data.next_steps) && data.next_steps.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2">Next steps</div>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {data.next_steps.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}

              {data.disclaimer && (
                <div className="text-xs text-muted-foreground border-t pt-3">{data.disclaimer}</div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => fetchExplanation()}>Regenerate</Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
