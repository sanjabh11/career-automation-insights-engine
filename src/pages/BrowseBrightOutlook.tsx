import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";
import { BrightOutlookBadge } from "@/components/BrightOutlookBadge";
import { useAdvancedSearch } from "@/hooks/useAdvancedSearch";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatWage } from "@/types/onet-enrichment";

export default function BrowseBrightOutlook() {
  const { search, results, total, hasMore, loadMore, isSearching } = useAdvancedSearch();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [jobZone, setJobZone] = useState<number | undefined>(undefined);
  const [minWage, setMinWage] = useState<string>("");
  const [maxWage, setMaxWage] = useState<string>("");

  useEffect(() => {
    search("", { brightOutlook: true });
  }, []);

  const applyFilters = () => {
    const filters: any = { brightOutlook: true };
    if (category) filters.brightOutlookCategory = category;
    if (jobZone) filters.jobZone = jobZone;
    if (minWage) filters.minWage = Number(minWage);
    if (maxWage) filters.maxWage = Number(maxWage);
    search("", filters);
  };

  const { data: parity, isLoading: parityLoading } = useQuery({
    queryKey: ["bright-outlook-parity"],
    queryFn: async () => {
      const { count } = await supabase
        .from("onet_occupation_enrichment")
        .select("occupation_code", { count: "exact", head: true })
        .eq("bright_outlook", true);
      return count || 0;
    },
    staleTime: 60_000,
  });

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bright Outlook Careers</h1>
        <p className="text-sm text-muted-foreground">Occupations expected to grow rapidly, have numerous openings, or are new & emerging.</p>
      </div>

      <Card className="p-6 space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Category</div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "All", value: undefined },
                { label: "Rapid Growth", value: "Rapid Growth" },
                { label: "Numerous Openings", value: "Numerous Openings" },
                { label: "New & Emerging", value: "New & Emerging" },
              ].map((c) => (
                <Button
                  key={c.label}
                  size="sm"
                  variant={(category ?? "All") === (c.value ?? "All") ? "default" : "outline"}
                  onClick={() => setCategory(c.value as any)}
                >
                  {c.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Job Zone</div>
            <div className="flex flex-wrap gap-2">
              {[undefined, 1, 2, 3, 4, 5].map((z) => (
                <Button
                  key={String(z ?? "All")}
                  size="sm"
                  variant={(jobZone ?? "All") === (z ?? "All") ? "default" : "outline"}
                  onClick={() => setJobZone(z as number | undefined)}
                >
                  {z ?? "All"}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="min-wage" className="text-xs text-muted-foreground">Min Wage (annual)</label>
            <Input id="min-wage" type="number" placeholder="e.g. 60000" value={minWage} onChange={(e) => setMinWage(e.target.value)} aria-label="Minimum annual wage filter" />
          </div>

          <div className="space-y-2">
            <label htmlFor="max-wage" className="text-xs text-muted-foreground">Max Wage (annual)</label>
            <Input id="max-wage" type="number" placeholder="e.g. 150000" value={maxWage} onChange={(e) => setMaxWage(e.target.value)} aria-label="Maximum annual wage filter" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={applyFilters} disabled={isSearching} variant="outline" aria-label="Apply selected filters to Bright Outlook careers">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : null}
            Apply Filters
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {total} results {parity !== undefined && !parityLoading ? (<span className="ml-2">• Parity: {Math.min(total, parity)} of {parity}</span>) : null}
          </div>
        </div>

        <div className="text-xs text-muted-foreground mt-1">
          Coverage is computed against O*NET Bright Outlook flags. Data version: 2025-09 (sync weekly). Filters narrow coverage by category/job zone.
        </div>

        <div className="space-y-3">
          {results.map((occupation, index) => (
            <motion.div
              key={occupation.occupation_code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{occupation.occupation_title}</h4>
                      <p className="text-xs text-muted-foreground font-mono mt-1">{occupation.occupation_code}</p>
                    </div>
                    <BrightOutlookBadge
                      hasBrightOutlook={true}
                      category={occupation.bright_outlook_category}
                      size="sm"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {occupation.is_stem && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" /> STEM
                      </Badge>
                    )}
                    {occupation.job_zone && (
                      <Badge variant="outline" className="text-xs">Zone {occupation.job_zone}</Badge>
                    )}
                    {occupation.median_wage_annual && (
                      <Badge variant="outline" className="text-xs text-green-700">{formatWage(occupation.median_wage_annual)}</Badge>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {hasMore && (
          <Button onClick={loadMore} disabled={isSearching} variant="outline" className="w-full">
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Load More
          </Button>
        )}
      </Card>
    </div>
  );
}
