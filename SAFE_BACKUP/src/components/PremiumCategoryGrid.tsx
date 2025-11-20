import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Layers, Wrench, Sparkles, Cpu } from "lucide-react";

type Category = { name: string; apo: number; confidence: string };

const iconFor = (name: string) => {
  switch (name) {
    case "Tasks": return <Wrench className="h-4 w-4" />;
    case "Knowledge": return <Brain className="h-4 w-4" />;
    case "Skills": return <Sparkles className="h-4 w-4" />;
    case "Abilities": return <Layers className="h-4 w-4" />;
    case "Technologies": return <Cpu className="h-4 w-4" />;
    default: return <Sparkles className="h-4 w-4" />;
  }
};

export default function PremiumCategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
      {categories.map((cat) => (
        <div key={cat.name} className="group relative rounded-2xl border border-white/40 bg-white/70 backdrop-blur-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all">
          <div className="absolute -inset-1 opacity-0 group-hover:opacity-20 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-sky-500 blur-xl transition-opacity" />
          <div className="relative p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                <span className="text-gray-600">{iconFor(cat.name)}</span>
                {cat.name}
              </div>
              <Badge variant="outline" className="text-[10px]">
                {cat.confidence}
              </Badge>
            </div>
            <div className="flex items-end justify-between mb-2">
              <div className="text-2xl font-bold text-gray-900">{cat.apo.toFixed(1)}%</div>
            </div>
            <Progress value={cat.apo} className="h-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
