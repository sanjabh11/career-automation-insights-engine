import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, TrendingUp, Sparkles, Code2, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { formatWage } from "@/types/onet-enrichment";

interface HotTechnology {
  technology_name: string;
  category: string;
  trending_score?: number;
  related_occupations_count: number;
  occupation_count?: number;
}

interface TechOccupation {
  occupation_code: string;
  onet_occupation_enrichment: {
    occupation_title: string;
    bright_outlook: boolean;
    median_wage_annual?: number;
  };
}

export default function TechSkillsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTech, setSelectedTech] = useState<string | null>(null);

  // Fetch all hot technologies
  const { data: techsData, isLoading: techsLoading } = useQuery({
    queryKey: ["hot-technologies"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("hot-technologies", {
        body: { limit: 100 },
      });
      if (error) throw error;
      return data as { technologies: HotTechnology[]; totalCount: number; source?: string };
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch occupations for selected technology
  const { data: occupationsData, isLoading: occupationsLoading } = useQuery({
    queryKey: ["tech-occupations", selectedTech],
    queryFn: async () => {
      if (!selectedTech) return null;
      const { data, error } = await supabase.functions.invoke("hot-technologies", {
        body: { technology: selectedTech },
      });
      if (error) throw error;
      return data as { technology: string; occupations: TechOccupation[]; count: number };
    },
    enabled: !!selectedTech,
    staleTime: 1000 * 60 * 5,
  });

  const technologies = techsData?.technologies || [];
  const filteredTechs = technologies.filter((tech) =>
    tech.technology_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate heat index (normalized score 0-100)
  const maxCount = Math.max(...technologies.map((t) => t.occupation_count || t.related_occupations_count || 1));
  const getHeatIndex = (tech: HotTechnology) => {
    const count = tech.occupation_count || tech.related_occupations_count || 0;
    return Math.round((count / maxCount) * 100);
  };

  const getHeatColor = (heat: number) => {
    if (heat >= 80) return "bg-red-100 text-red-800 border-red-300";
    if (heat >= 60) return "bg-orange-100 text-orange-800 border-orange-300";
    if (heat >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-blue-100 text-blue-800 border-blue-300";
  };

  const totalTechs = techsData?.totalCount || 0;
  const source = (techsData as any)?.source || "db";

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Code2 className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Technology Skills Discovery
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Explore hot technologies, their demand across occupations, and related learning paths.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Heat Legend:</span>
            <Badge className="bg-red-100 text-red-800 border-red-300">80–100</Badge>
            <Badge className="bg-orange-100 text-orange-800 border-orange-300">60–79</Badge>
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">40–59</Badge>
            <Badge className="bg-blue-100 text-blue-800 border-blue-300">0–39</Badge>
          </div>
          <div className="flex items-center gap-2">
            {source === "db" ? (
              <span className="inline-flex items-center text-xs px-2 py-1 rounded border bg-green-50 text-green-700 border-green-300">🟢 From Database</span>
            ) : (
              <span className="inline-flex items-center text-xs px-2 py-1 rounded border bg-yellow-50 text-yellow-700 border-yellow-300">🟡 {source}</span>
            )}
            <Badge variant={totalTechs > 0 ? "secondary" : "destructive"}>
              {totalTechs > 0 ? `${totalTechs} technologies` : "No technologies found"}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Exemplar Chips */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium">Popular Technologies:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Excel', 'Python', 'Salesforce'].map((tech) => (
            <Button
              key={tech}
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm(tech);
                setSelectedTech(tech);
              }}
              className="gap-2"
            >
              <Code2 className="h-3 w-3" />
              {tech}
            </Button>
          ))}
        </div>
      </Card>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search technologies (e.g., Python, React, AWS)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technologies List */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Hot Technologies ({filteredTechs.length})
          </h3>

          {techsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          )}

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredTechs.map((tech, index) => {
              const heat = getHeatIndex(tech);
              const isSelected = selectedTech === tech.technology_name;

              return (
                <motion.div
                  key={tech.technology_name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card
                    className={`p-3 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-purple-50 border-purple-500 border-2 shadow-md"
                        : "hover:shadow-md hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedTech(tech.technology_name)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {tech.technology_name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tech.category}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={`${getHeatColor(heat)} border text-xs`}>
                          🔥 {heat}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {tech.occupation_count || tech.related_occupations_count} jobs
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </Card>

        {/* Occupations for Selected Technology */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Related Occupations
          </h3>

          {!selectedTech && (
            <div className="text-center py-12 text-muted-foreground">
              <Code2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Select a technology to view related occupations</p>
            </div>
          )}

          {selectedTech && occupationsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          )}

          {selectedTech && !occupationsLoading && occupationsData && (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-semibold text-purple-900">
                  {selectedTech}
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  {occupationsData.count} occupations use this technology
                </p>
              </div>

              {occupationsData.occupations.map((occ, index) => (
                <motion.div
                  key={occ.occupation_code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-semibold text-sm">
                          {occ.onet_occupation_enrichment.occupation_title}
                        </h4>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          {occ.occupation_code}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {occ.onet_occupation_enrichment.bright_outlook && (
                          <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                            Bright Outlook
                          </Badge>
                        )}
                        {occ.onet_occupation_enrichment.median_wage_annual && (
                          <Badge variant="outline" className="text-xs text-green-700">
                            {formatWage(occ.onet_occupation_enrichment.median_wage_annual)}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="link" className="h-auto p-0 text-xs" asChild>
                          <a href={`/?search=${encodeURIComponent(occ.onet_occupation_enrichment.occupation_title)}`}>
                            View Analysis →
                          </a>
                        </Button>
                        <Button variant="link" className="h-auto p-0 text-xs" asChild>
                          <a href={`/ai-impact-planner`}>
                            Open in Planner →
                          </a>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
