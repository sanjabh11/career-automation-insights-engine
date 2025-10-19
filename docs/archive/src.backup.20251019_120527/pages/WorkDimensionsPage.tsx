import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Brain, BookOpen, Activity, TrendingUp, Download } from "lucide-react";
import { motion } from "framer-motion";
import { HelpOverlay } from "@/components/HelpOverlay";

type DimensionType = "abilities" | "knowledge" | "activities";

interface WorkDimension {
  id: string;
  occupation_code: string;
  name: string;
  description?: string;
  level?: number;
  importance?: number;
  occupation_title?: string;
}

export default function WorkDimensionsPage() {
  const [dimension, setDimension] = useState<DimensionType>("abilities");
  const [minImportance, setMinImportance] = useState(3.0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  // Fetch work dimensions based on selected type
  const { data, isLoading } = useQuery({
    queryKey: ["work-dimensions", dimension, minImportance],
    queryFn: async () => {
      // Map dimension type to table name
      const tableMap = {
        abilities: "onet_abilities",
        knowledge: "onet_knowledge",
        activities: "onet_work_activities",
      };

      const table = tableMap[dimension];
      
      // Query with importance filter
      let query = supabase
        .from(table)
        .select("*")
        .gte("importance", minImportance)
        .order("importance", { ascending: false })
        .limit(100);

      const { data, error } = await query;
      if (error) throw error;

      return data as WorkDimension[];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Group by dimension name and count occupations
  const groupedData = React.useMemo(() => {
    if (!data) return [];

    const groups = new Map<string, { name: string; occupations: Set<string>; avgImportance: number; totalImportance: number; count: number }>();

    data.forEach((item) => {
      const key = item.name || item.description || "Unknown";
      if (!groups.has(key)) {
        groups.set(key, {
          name: key,
          occupations: new Set(),
          avgImportance: 0,
          totalImportance: 0,
          count: 0,
        });
      }

      const group = groups.get(key)!;
      group.occupations.add(item.occupation_code);
      group.totalImportance += item.importance || 0;
      group.count += 1;
    });

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        avgImportance: group.totalImportance / group.count,
        occupationCount: group.occupations.size,
      }))
      .sort((a, b) => b.avgImportance - a.avgImportance);
  }, [data]);

  const getImportanceColor = (importance: number) => {
    if (importance >= 4.5) return "bg-red-100 text-red-800 border-red-300";
    if (importance >= 4.0) return "bg-orange-100 text-orange-800 border-orange-300";
    if (importance >= 3.5) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-blue-100 text-blue-800 border-blue-300";
  };

  const getDimensionIcon = (type: DimensionType) => {
    switch (type) {
      case "abilities":
        return <Brain className="h-5 w-5" />;
      case "knowledge":
        return <BookOpen className="h-5 w-5" />;
      case "activities":
        return <Activity className="h-5 w-5" />;
    }
  };

  const exportCSV = () => {
    try {
      const rows = (groupedData || []).map((g: any) => ({
        name: g.name,
        occupationCount: g.occupationCount,
        avgImportance: Number(g.avgImportance || 0).toFixed(2),
      }));
      const header = Object.keys(rows[0] || { name: "", occupationCount: "", avgImportance: "" });
      const csv = [header.join(","), ...rows.map((r: any) => header.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `work_dimensions_${dimension}_min${minImportance}_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
    } catch {}
  };

  const exportJourney = () => {
    try {
      const chosen = (groupedData || []).filter((g: any) => selected[g.name]);
      const header = ["step","activity","note"];
      const rows = chosen.map((g: any, i: number) => ({ step: i+1, activity: g.name, note: `Used in ${g.occupationCount} occupations` }));
      const csv = [header.join(","), ...rows.map(r => header.map(h => JSON.stringify((r as any)[h] ?? "")).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `dwa_journey_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
    } catch {}
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-indigo-600" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Work Dimensions Explorer
            </h1>
          </div>
          <HelpOverlay title="Work Dimensions">
            <p>Browse Abilities, Knowledge, and Work Activities from O*NET. Filter by importance, export CSV, or build a simple DWA Journey for demos.</p>
          </HelpOverlay>
        </div>
        <p className="text-sm text-muted-foreground">
          Browse occupations by key abilities, knowledge areas, and work activities. Filter by importance to find critical skills.
        </p>
      </div>

      {/* Tabs for dimension types */}
      <Card className="p-6">
        <Tabs value={dimension} onValueChange={(v) => setDimension(v as DimensionType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="abilities" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Abilities
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Knowledge
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Work Activities
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            {/* Importance Filter */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Minimum Importance:</label>
              <div className="flex gap-2">
                {[3.0, 3.5, 4.0, 4.5].map((val) => (
                  <Button
                    key={val}
                    size="sm"
                    variant={minImportance === val ? "default" : "outline"}
                    onClick={() => setMinImportance(val)}
                  >
                    {val}+
                  </Button>
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={exportCSV}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                {dimension === 'activities' && (
                  <Button size="sm" variant="outline" className="gap-2" onClick={exportJourney}>
                    <Download className="h-4 w-4" /> Export Journey
                  </Button>
                )}
              </div>
            </div>

            {/* Results */}
            <TabsContent value={dimension} className="mt-4">
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              )}

              {!isLoading && groupedData.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No {dimension} found with importance ≥ {minImportance}</p>
                </div>
              )}

              {!isLoading && groupedData.length > 0 && (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-4">
                    Showing {groupedData.length} {dimension} across {data?.length || 0} occupation entries
                  </div>

                  {groupedData.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getDimensionIcon(dimension)}
                              <h4 className="font-semibold text-sm">{item.name}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Used in {item.occupationCount} occupations
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <Badge className={`${getImportanceColor(item.avgImportance)} border`}>
                              Avg: {item.avgImportance.toFixed(2)}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={() => {
                                // Navigate to search with this dimension as filter
                                window.location.href = `/?dimension=${dimension}&name=${encodeURIComponent(item.name)}`;
                              }}
                            >
                              View Occupations →
                            </Button>
                            {dimension === 'activities' && (
                              <label className="text-xs flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!selected[item.name]}
                                  onChange={(e) => setSelected((s) => ({ ...s, [item.name]: e.target.checked }))}
                                />
                                Add to Journey
                              </label>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-indigo-50 border-indigo-200">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-indigo-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-indigo-900 mb-2">Understanding Work Dimensions</h3>
            <ul className="text-sm text-indigo-800 space-y-1 list-disc list-inside">
              <li><strong>Abilities:</strong> Enduring attributes (e.g., oral comprehension, deductive reasoning)</li>
              <li><strong>Knowledge:</strong> Organized sets of principles and facts (e.g., mathematics, psychology)</li>
              <li><strong>Work Activities:</strong> Types of job behaviors (e.g., analyzing data, operating vehicles)</li>
              <li><strong>Importance:</strong> Rated 1-5, where 5 is extremely important for the occupation</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
