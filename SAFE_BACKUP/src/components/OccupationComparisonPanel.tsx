
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ComparisonOccupation {
  code: string;
  title: string;
  overallAPO: number;
  confidence: string;
  timeline: string;
  categoryBreakdown: {
    tasks: { apo: number; confidence: string };
    knowledge: { apo: number; confidence: string };
    skills: { apo: number; confidence: string };
    abilities: { apo: number; confidence: string };
    technologies: { apo: number; confidence: string };
  };
  insights: {
    primary_opportunities: string[];
    main_challenges: string[];
    automation_drivers: string[];
    barriers: string[];
  };
}

interface OccupationComparisonPanelProps {
  occupations: ComparisonOccupation[];
  onRemove: (code: string) => void;
}

const riskMeta = (apo: number) => {
  if (apo >= 70) return { name: "High", color: "text-red-600" };
  if (apo >= 50) return { name: "Med-High", color: "text-orange-600" };
  if (apo >= 30) return { name: "Medium", color: "text-yellow-600" };
  return { name: "Low", color: "text-green-600" };
};

export const OccupationComparisonPanel = ({
  occupations,
  onRemove,
}: OccupationComparisonPanelProps) => {
  if (occupations.length < 2) return null;

  const categories = [
    "tasks",
    "knowledge",
    "skills",
    "abilities",
    "technologies",
  ];

  return (
    <Card className="p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">
        Side-by-Side Career Comparison
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {occupations.map((occ) => {
          const risk = riskMeta(occ.overallAPO || 0);
          return (
            <div key={occ.code} className="bg-gray-50 rounded-lg p-4 shadow-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-base">{occ.title}</p>
                  <span className="text-xs text-gray-500">{occ.code}</span>
                </div>
                <button
                  onClick={() => onRemove(occ.code)}
                  title="Remove"
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
              <div className="flex flex-wrap gap-1 text-xs items-center">
                <Badge className="bg-blue-100 text-blue-700">{occ.timeline}</Badge>
                <Badge className={occ.confidence === "high"
                  ? "bg-green-100 text-green-800"
                  : occ.confidence === "medium"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"}>
                  {occ.confidence} confidence
                </Badge>
                <span className={`font-semibold ${risk.color}`}>
                  {risk.name} Risk
                </span>
              </div>
              <div className="text-3xl font-semibold text-blue-600">{(occ.overallAPO ?? 0).toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full border rounded">
          <thead>
            <tr className="bg-slate-100">
              <th className="py-2 px-2 text-left text-xs font-medium text-gray-700">Category</th>
              {occupations.map((occ) => (
                <th key={occ.code} className="py-2 px-2 text-xs font-medium text-gray-700">{occ.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat}>
                <td className="border-t px-2 py-2 text-xs font-semibold">{cat.charAt(0).toUpperCase() + cat.slice(1)}</td>
                {occupations.map((occ) => (
                  <td key={occ.code} className="border-t px-2 py-2">
                    <span className="font-semibold">{occ.categoryBreakdown[cat as keyof typeof occ.categoryBreakdown]?.apo?.toFixed(1) ?? "--"}%</span>
                    <Badge className={
                      occ.categoryBreakdown[cat as keyof typeof occ.categoryBreakdown]?.confidence === "high"
                        ? "bg-green-100 text-green-800"
                        : occ.categoryBreakdown[cat as keyof typeof occ.categoryBreakdown]?.confidence === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }>
                      {occ.categoryBreakdown[cat as keyof typeof occ.categoryBreakdown]?.confidence}
                    </Badge>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
