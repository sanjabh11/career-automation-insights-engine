import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProgressItem {
  skill: string;
  percent: number;
}

export default function ProgressTrackingDashboard() {
  const [progress, setProgress] = useState<ProgressItem[]>([
    { skill: "Python", percent: 80 },
    { skill: "Machine Learning", percent: 55 },
    { skill: "Communication", percent: 90 },
    { skill: "Project Management", percent: 65 },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <Card className="max-w-2xl mx-auto shadow-xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-800">Progress Tracking Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-6">
            {progress.map((item, idx) => (
              <li key={idx} className="flex flex-col gap-2 bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">{item.skill}</span>
                  <span className="font-bold text-blue-700">{item.percent}%</span>
                </div>
                <Progress value={item.percent} className="h-3" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
