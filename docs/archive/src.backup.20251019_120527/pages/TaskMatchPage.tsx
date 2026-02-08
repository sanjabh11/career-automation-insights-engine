import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ListChecks, Download } from "lucide-react";
import { motion } from "framer-motion";

interface MatchOccupation {
  occupation_code: string;
  occupation_title: string;
  bright_outlook?: boolean;
  job_zone?: number;
  score?: number;
  match_count?: number;
  tasks: Array<{
    task_id: string;
    task_description: string;
    importance?: number;
    frequency?: number;
    automation_category?: string;
    matched_query?: string;
  }>;
}

export default function TaskMatchPage() {
  const [duties, setDuties] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<MatchOccupation[]>([]);
  const [queriesUsed, setQueriesUsed] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const runMatch = async () => {
    const queries = duties.split("\n").map(s => s.trim()).filter(Boolean);
    if (queries.length === 0) return;
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-tasks", {
        body: { queries, limit: 30, offset: 0 },
      });
      if (error) throw error;
      setResults((data?.occupations || []) as MatchOccupation[]);
      setQueriesUsed((data?.queries || []) as string[]);
    } catch (e) {
      setResults([]);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  const exportCSV = () => {
    try {
      const header = ["occupation_code","occupation_title","score","match_count","task_id","task_description","matched_query","importance","frequency","automation_category"];
      const rows: any[] = [];
      results.forEach((o) => {
        (o.tasks || []).forEach((t) => {
          rows.push({
            occupation_code: o.occupation_code,
            occupation_title: o.occupation_title,
            score: o.score ?? "",
            match_count: o.match_count ?? "",
            task_id: t.task_id,
            task_description: t.task_description,
            matched_query: t.matched_query ?? "",
            importance: t.importance ?? "",
            frequency: t.frequency ?? "",
            automation_category: t.automation_category ?? "",
          });
        });
      });
      const csv = [header.join(","), ...rows.map(r => header.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `task_match_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <ListChecks className="h-7 w-7 text-indigo-600" /> Multi-Duty Task Match
        </h1>
        <p className="text-sm text-muted-foreground">Paste 2–8 duty statements (one per line). We'll find occupations whose tasks best match your duties.</p>
      </div>

      <Card className="p-6 space-y-4">
        <Textarea
          placeholder={`Example:\n- Analyze financial statements for variances\n- Collaborate with stakeholders to define API specs\n- Prepare patient records and triage information`}
          value={duties}
          onChange={(e) => setDuties(e.target.value)}
          className="min-h-[160px]"
        />
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Supports boolean websearch; keep lines short and specific for best matches.</div>
          <div className="flex gap-2">
            <Button onClick={runMatch} disabled={isSearching || !duties.trim()}>
              {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Match Duties
            </Button>
            {results.length > 0 && (
              <Button variant="outline" className="gap-2" onClick={exportCSV}>
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            )}
          </div>
        </div>

        {(results.length > 0 || (hasSearched && queriesUsed.length > 0)) && (
          <div className="text-xs text-muted-foreground">Queries used: {queriesUsed.join(" • ")}</div>
        )}

        <div className="space-y-3 mt-2">
          {results.map((occ, index) => (
            <motion.div key={occ.occupation_code} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{occ.occupation_title}</h4>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{occ.occupation_code}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Score</div>
                    <div className="text-sm font-medium">{occ.score?.toFixed ? occ.score.toFixed(1) : (occ.score ?? 0)}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {(occ.tasks || []).slice(0, 5).map((t) => (
                    <div key={t.task_id} className="text-sm text-gray-700">• {t.task_description} <span className="text-xs text-muted-foreground">({t.matched_query})</span></div>
                  ))}
                  {occ.tasks.length > 5 && (
                    <div className="text-xs text-muted-foreground">+{occ.tasks.length - 5} more matched tasks</div>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="link" size="sm" asChild>
                    <a href={`/?search=${encodeURIComponent(occ.occupation_title)}`}>View in Dashboard →</a>
                  </Button>
                  <Button variant="link" size="sm" asChild>
                    <a href={`/ai-impact-planner`}>Open Planner</a>
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
          {hasSearched && !isSearching && results.length === 0 && (
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">
                No matches found for your duty lines. Try shorter, concrete phrases (e.g., "write API docs", "implement REST endpoints", "analyze performance metrics").
              </div>
            </Card>
          )}
        </div>
      </Card>
    </div>
  );
}
