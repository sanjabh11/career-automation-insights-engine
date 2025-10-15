import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { BrightOutlookBadge } from "@/components/BrightOutlookBadge";
import { useAdvancedSearch } from "@/hooks/useAdvancedSearch";
import { motion } from "framer-motion";
import { formatWage } from "@/types/onet-enrichment";

export default function BrowseBrightOutlook() {
  const { search, results, total, hasMore, loadMore, isSearching } = useAdvancedSearch();

  useEffect(() => {
    search("", { brightOutlook: true });
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bright Outlook Careers</h1>
        <p className="text-sm text-muted-foreground">Occupations expected to grow rapidly, have numerous openings, or are new & emerging.</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{total} results</div>
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
