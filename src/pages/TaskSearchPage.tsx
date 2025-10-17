import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, ListChecks } from "lucide-react";
import { motion } from "framer-motion";

interface TaskHit {
  task_id: string;
  task_description: string;
  importance?: number;
  frequency?: number;
  automation_category?: string;
}

interface TaskSearchOccupationGroup {
  occupation_code: string;
  occupation_title: string;
  bright_outlook: boolean;
  job_zone?: number;
  tasks: TaskHit[];
}

export default function TaskSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TaskSearchOccupationGroup[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const runSearch = async (reset = true) => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-tasks", {
        body: { query: query.trim(), limit, offset: reset ? 0 : offset },
      });
      if (error) throw error;

      const occupations = (data?.occupations || []) as TaskSearchOccupationGroup[];
      setTotalTasks(Number(data?.totalTasks || 0));
      if (reset) {
        setResults(occupations);
        setOffset(limit);
      } else {
        setResults((prev) => [...prev, ...occupations]);
        setOffset((prev) => prev + limit);
      }
    } catch (e) {
      // swallow for now; toast is optional here
      console.error("Task search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <ListChecks className="h-8 w-8 text-indigo-600" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Duty & Task Search
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Search O*NET task statements and discover relevant occupations with task-level context.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="e.g., analyze financial data, prepare patient records, design APIs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch(true)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => runSearch(true)} disabled={isSearching || !query.trim()}>
            {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Search
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Results grouped by occupation. Powered by full-text search on onet_detailed_tasks.
        </div>
      </Card>

      <div className="space-y-3">
        {results.map((occ, idx) => (
          <motion.div
            key={`${occ.occupation_code}-${idx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
          >
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{occ.occupation_title}</h4>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{occ.occupation_code}</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {occ.bright_outlook && (
                    <Badge variant="secondary" className="text-xs">Bright Outlook</Badge>
                  )}
                  {occ.job_zone && (
                    <Badge variant="outline" className="text-xs">Zone {occ.job_zone}</Badge>
                  )}
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {occ.tasks.slice(0, 5).map((t) => (
                  <div key={t.task_id} className="text-sm text-gray-700">
                    • {t.task_description}
                  </div>
                ))}
                {occ.tasks.length > 5 && (
                  <div className="text-xs text-muted-foreground">+{occ.tasks.length - 5} more tasks</div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/?search=${encodeURIComponent(occ.occupation_title)}`}>View in Dashboard →</a>
                </Button>
                <Button variant="link" size="sm" asChild>
                  <a href={`/ai-impact-planner`}>Open Planner</a>
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {results.length > 0 && (offset < totalTasks) && (
        <Button onClick={() => runSearch(false)} disabled={isSearching} variant="outline" className="w-full">
          {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Load More
        </Button>
      )}
    </div>
  );
}
