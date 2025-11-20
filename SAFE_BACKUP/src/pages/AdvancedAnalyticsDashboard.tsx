import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalyticsMetric {
  label: string;
  value: number | string;
  trend?: string;
}

export default function AdvancedAnalyticsDashboard() {
  const metrics: AnalyticsMetric[] = [
    { label: "Total Users", value: 1280, trend: "+4% MoM" },
    { label: "Analyses Run", value: 5432, trend: "+2% WoW" },
    { label: "Saved Analyses", value: 312 },
    { label: "Avg. APO Score", value: 36.2 },
    { label: "Learning Resource Clicks", value: 421 },
    { label: "API Credits Used", value: 1890 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <Card className="max-w-3xl mx-auto shadow-xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-800">Advanced Analytics Dashboard (Admin)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {metrics.map((m, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow-sm flex flex-col gap-2">
                <span className="text-lg font-semibold text-gray-700">{m.label}</span>
                <span className="text-2xl font-bold text-blue-800">{m.value}</span>
                {m.trend && <span className="text-xs text-green-600">{m.trend}</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
