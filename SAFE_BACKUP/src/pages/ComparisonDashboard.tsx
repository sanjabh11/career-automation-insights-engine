import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ComparisonItem {
  occupation: string;
  apo: number;
  tags?: string[];
  notes?: string;
}

export default function ComparisonDashboard() {
  const [items, setItems] = useState<ComparisonItem[]>([
    { occupation: "Software Developer", apo: 42, tags: ["tech", "dev"], notes: "Baseline" },
    { occupation: "Data Scientist", apo: 31, tags: ["ai", "analytics"], notes: "Lower automation risk" },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <Card className="max-w-4xl mx-auto shadow-xl rounded-2xl border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-800">Comparison Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Occupation</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">APO %</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Tags</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.occupation}</td>
                    <td className="px-4 py-3">
                      <Badge className="bg-blue-100 text-blue-800 font-semibold text-sm">{item.apo}%</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {item.tags?.map((tag, i) => (
                        <Badge key={i} className="mr-1 mb-1 bg-purple-100 text-purple-700 text-xs">{tag}</Badge>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="outline" className="text-blue-700 border-blue-200 hover:bg-blue-50">Export Comparison</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
