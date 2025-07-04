import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Prediction {
  label: string;
  confidence: number;
  timeline: string;
}

export default function ConfidenceTimelinePredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([
    { label: "Software Developer", confidence: 0.8, timeline: "2027-2030" },
    { label: "Data Scientist", confidence: 0.6, timeline: "2031-2035" },
    { label: "Project Manager", confidence: 0.7, timeline: "2027-2030" },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <Card className="max-w-2xl mx-auto shadow-xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-800">Automated Confidence & Timeline Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-6">
            {predictions.map((item, idx) => (
              <li key={idx} className="flex flex-col gap-2 bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700">{item.label}</span>
                  <span className="font-bold text-blue-700">{Math.round(item.confidence * 100)}%</span>
                </div>
                <Progress value={item.confidence * 100} className="h-3" />
                <div className="text-xs text-gray-500">Timeline: <span className="font-semibold text-blue-700">{item.timeline}</span></div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
